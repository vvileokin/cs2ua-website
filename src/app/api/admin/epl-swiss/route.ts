import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { toMatch, type Row } from "@/lib/db/matches";
import { swissState } from "@/lib/swiss";
import { EPL_SLUG, EPL_BUCKETS, EPL_CAPACITY, eplTeams, type EplBucket, type EplSwissPicks } from "@/lib/epl-swiss";

/**
 * Закриття і розрахунок картки швейцарки.
 *
 * Підсумок береться з самих матчів, а не вводиться руками — на відміну від
 * клубу 0-2, де «вилетів без жодної перемоги» ззовні не видно. Тут видно все:
 * три перемоги виводять, три поразки виносять, і рахунок, з яким команда пішла
 * з турніру, — це просто її рядок у таблиці результатів. Той самий swissState,
 * що малює сітку на сторінці турніру, рахує і підсумок, тож дошка і виплата не
 * можуть розійтися.
 *
 * Розрахунок не приймає неповний турнір: поки хоч одна команда не має трьох
 * перемог чи трьох поразок, кошики неповні, і платити нема за чим.
 */
async function actualCard(): Promise<
  { ok: true; picks: EplSwissPicks } | { ok: false; error: string; placed: number }
> {
  const admin = createAdminClient();
  const { data } = await admin.from("matches").select("*").eq("tournament_slug", EPL_SLUG);
  const matches = (data ?? []).map((r) => toMatch(r as Row));
  const teams = eplTeams();
  const state = swissState(matches, teams);

  const picks: EplSwissPicks = {};
  for (const [bucket, slugs] of Object.entries({ ...state.through, ...state.out })) {
    for (const slug of slugs) picks[slug] = bucket as EplBucket;
  }

  const placed = Object.keys(picks).length;
  if (placed !== teams.length) {
    return { ok: false, error: "Швейцарка ще не дограна", placed };
  }
  for (const b of EPL_BUCKETS) {
    const n = teams.filter((t) => picks[t] === b).length;
    if (n !== EPL_CAPACITY[b]) {
      return { ok: false, error: `У кошику ${b.replace("-", ":")} ${n} команд замість ${EPL_CAPACITY[b]}`, placed };
    }
  }
  return { ok: true, picks };
}

/** Скільки карток зібрано, скільки вже оплачено і що показує турнір. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();

  const { data: cards, error } = await admin.from("epl_swiss").select("user_id, points, scored_at");
  if (error) {
    const missing = error.code === "42P01";
    return NextResponse.json(
      { ok: false, error: missing ? "Спершу запусти міграцію 0083" : error.message },
      { status: missing ? 409 : 500 },
    );
  }
  const rows = (cards ?? []) as { user_id: string; points: number; scored_at: string | null }[];

  /* Відсутня колонка читається як «руками не закривали» — тобто так, як було
     до появи вимикача. Сторінка через це не падає. */
  const { data: settings } = await admin
    .from("site_settings")
    .select("epl_swiss_closed")
    .eq("id", 1)
    .maybeSingle();

  const actual = await actualCard();

  return NextResponse.json({
    ok: true,
    total: rows.length,
    scored: rows.filter((r) => r.scored_at).length,
    paid: rows.reduce((n, r) => n + (r.points ?? 0), 0),
    closed: !!settings?.epl_swiss_closed,
    actual: actual.ok ? actual.picks : null,
    ready: actual.ok,
    reason: actual.ok ? null : actual.error,
  });
}

/**
 * Замок уручну.
 *
 * Окремо від розрахунку, бо це різні рішення: замок спиняє запис карток,
 * розрахунок платить тим, що вже записані. Між ними зазвичай кілька днів
 * турніру. Відкрити назад можна — вимикач лише зачиняє раніше за годинник, і
 * картка, чий другий тур уже почався, лишиться зачиненою попри нього.
 */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const closed = !!body?.closed;

  const { error } = await createAdminClient()
    .from("site_settings")
    .update({ epl_swiss_closed: closed })
    .eq("id", 1);
  if (error) {
    const missing = error.code === "42703" || error.code === "PGRST204";
    return NextResponse.json(
      { ok: false, error: missing ? "Спершу запусти міграцію 0085" : error.message },
      { status: missing ? 409 : 500 },
    );
  }

  await logAdmin("epl", closed ? "Закрив картку швейцарки" : "Відкрив картку швейцарки назад");
  return NextResponse.json({ ok: true, closed });
}

/** Розрахунок. Платить кожній картці, якої ще не платили. */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const actual = await actualCard();
  if (!actual.ok) {
    return NextResponse.json({ ok: false, error: actual.error }, { status: 409 });
  }

  const admin = createAdminClient();
  /* Функція бере тільки картки з scored_at is null, тож друге натискання не
     платить удруге. */
  const { data, error } = await admin.rpc("score_epl_swiss", { p_actual: actual.picks });
  if (error) {
    const missing = error.code === "42883" || error.code === "PGRST202";
    return NextResponse.json(
      { ok: false, error: missing ? "Спершу запусти міграцію 0083" : error.message },
      { status: missing ? 409 : 500 },
    );
  }

  const paid = (data ?? []) as { user_id: string; points: number }[];
  /* Повідомлення — тільки тим, хто щось заробив. Картка, яка не вгадала
     жодного кошика, не новина, і писати їй «розраховано» поруч із нулем — та
     сама помилка, якої припустилася сітка на EWC. */
  const notifs = paid
    .filter((r) => (r.points ?? 0) > 0)
    .map((r) => ({
      user_id: r.user_id,
      kind: "reward",
      title: `Швейцарка EPL розрахована — +${r.points}`,
    }));
  if (notifs.length > 0) await admin.from("notifications").insert(notifs);

  await logAdmin("epl", `Розрахував швейцарку EPL — ${paid.length} карток`);
  return NextResponse.json({ ok: true, scored: paid.length });
}
