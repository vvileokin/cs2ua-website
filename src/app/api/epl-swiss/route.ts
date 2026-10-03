import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EPL_SLUG, isCompleteCard, type EplSwissPicks } from "@/lib/epl-swiss";

/**
 * Картка швейцарки: одна на гравця, читається і пишеться лише власником.
 *
 * Коли вона закривається. Турнір уже йшов, коли картка з'явилася, тож замок
 * на першому матчі турніру зачинив би її ще до того, як хтось її побачив.
 * Тому вона тримається до старту другого туру — першого, якого ще ніхто не
 * бачив зіграним. Далі розкладка стає відомою по частинах, і картка втрачає
 * сенс.
 *
 * Замок за годинником, а не за колонкою статусу: статус ставить людина, а
 * час старту не забуває ніхто. Так само, як у групах Porto.
 */
async function cardOpen(): Promise<{ open: boolean; closesAt: string | null }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("matches")
    .select("stage, status, start_at")
    .eq("tournament_slug", EPL_SLUG);

  const rounds = (data ?? []).filter((m) => /тур\s*2/i.test(m.stage ?? ""));
  const pool = rounds.length ? rounds : (data ?? []).filter((m) => m.status === "upcoming");
  const due = pool
    .map((m) => (m.start_at ? new Date(m.start_at as string).getTime() : Infinity))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b)[0];

  if (!due) return { open: true, closesAt: null };
  return { open: Date.now() < due, closesAt: new Date(due).toISOString() };
}

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const window = await cardOpen();
  if (!user) return NextResponse.json({ ...window, card: null });

  const { data } = await sb
    .from("epl_swiss")
    .select("picks, points, scored_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    ...window,
    card: data ? { picks: data.picks as EplSwissPicks, points: data.points, scored: !!data.scored_at } : null,
  });
}

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Увійди, щоб зберегти картку." }, { status: 401 });

  const window = await cardOpen();
  if (!window.open) return NextResponse.json({ error: "Картку вже закрито — другий тур почався." }, { status: 409 });

  const body = (await req.json().catch(() => null)) as { picks?: EplSwissPicks } | null;
  const picks = body?.picks;
  if (!picks || !isCompleteCard(picks)) {
    return NextResponse.json(
      { error: "Картка неповна: кожна команда має стояти в одному кошику, а кошики — бути заповнені рівно." },
      { status: 400 },
    );
  }

  const { error } = await sb
    .from("epl_swiss")
    .upsert({ user_id: user.id, picks, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, closesAt: window.closesAt });
}
