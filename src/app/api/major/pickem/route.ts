import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PickemPicks } from "@/lib/major-pickem";

/**
 * Збереження картки пікемів.
 *
 * Тонкий маршрут, і це навмисно: замок, належність команд стадії та форма
 * картки перевіряються в `save_major_pickem` (0094). Повторювати їх тут
 * означало б завести другий набір правил, який колись розійдеться з першим.
 * Єдине, що робиться до виклику, — відсів очевидного браку, щоб не ганяти в
 * базу порожнечу, і переклад кодів помилок у людські речення.
 */

const SAY: Record<string, string> = {
  anon: "Увійди, щоб зберегти картку.",
  no_stage: "Такої стадії немає.",
  not_open: "Склад цієї стадії ще не відомий — картка відкриється, коли визначаться всі її команди.",
  locked: "Стадія вже почалася, картку закрито.",
  bad_shape: "Картка неповна: кошики мають зійтися рівно.",
  bad_team: "У картці команда не з цієї стадії.",
};

export async function POST(req: Request) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: SAY.anon }, { status: 401 });

  let body: { stage?: unknown; picks?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Не розібрав запит." }, { status: 400 });
  }

  const stage = Number(body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 4) {
    return NextResponse.json({ error: SAY.no_stage }, { status: 400 });
  }

  /* Повноту картки тут більше не рахуємо. Форм тепер дві — швейцарка 2/6/2 і
     плей-оф 1/1/2 — і яка з них правильна, знає тільки стадія. Маршрут
     стадію не читає, тож будь-яка перевірка тут була б здогадом; відсіюємо
     лише очевидний брак, а форму звіряє `save_major_pickem`, яка стадію вже
     читає заради замка. */
  const picks = body.picks as PickemPicks | undefined;
  if (!picks || typeof picks !== "object" || !Object.keys(picks).length) {
    return NextResponse.json({ error: SAY.bad_shape }, { status: 400 });
  }

  const { data, error } = await sb.rpc("save_major_pickem", {
    p_stage: stage,
    p_picks: picks,
  });

  if (error) {
    return NextResponse.json({ error: "Не вдалося зберегти. Спробуй ще раз." }, { status: 500 });
  }

  const res = data as { ok: boolean; error?: string } | null;
  if (!res?.ok) {
    const code = res?.error ?? "";
    return NextResponse.json(
      { error: SAY[code] ?? "Картку не прийнято." },
      { status: code === "locked" ? 409 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
