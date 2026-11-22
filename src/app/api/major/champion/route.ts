import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Голос у питанні «хто візьме мейджор».
 *
 * Тонкий маршрут, як і в пікемах: замок і те, що команда справді з мейджора,
 * перевіряє `vote_major_champion` (0097). Тут лише відсів порожнечі й
 * переклад кодів у речення.
 */

const SAY: Record<string, string> = {
  anon: "Увійди, щоб проголосувати.",
  bad_team: "Такої команди на мейджорі немає.",
  locked: "Плей-оф почався — голосування закрите.",
};

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: SAY.anon }, { status: 401 });

  let body: { team?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Не розібрав запит." }, { status: 400 });
  }

  const team = typeof body.team === "string" ? body.team.trim() : "";
  if (!team) return NextResponse.json({ error: SAY.bad_team }, { status: 400 });

  const { data, error } = await sb.rpc("vote_major_champion", { p_team: team });
  if (error) {
    return NextResponse.json({ error: "Не вдалося зберегти голос." }, { status: 500 });
  }

  const res = data as { ok: boolean; error?: string } | null;
  if (!res?.ok) {
    const code = res?.error ?? "";
    return NextResponse.json(
      { error: SAY[code] ?? "Голос не прийнято." },
      { status: code === "locked" ? 409 : 400 },
    );
  }

  return NextResponse.json({ ok: true, team });
}
