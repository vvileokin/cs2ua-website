import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { shapeOf, type StageKind } from "@/lib/major-pickem";

/**
 * Керування стадією пікемів: замок, підсумок, нарахування.
 *
 * Три дії, і третя незворотна — вона роздає очки в `profiles.points`. Тому
 * вона окрема й вимагає, щоб підсумок уже лежав у базі: «внести результати»
 * і «нарахувати» — різні натискання, між якими є час побачити, що внесено.
 *
 * Нарахування захищене від повтору не тут, а в самій `score_major_stage`
 * (0094, 0096): вона бере тільки картки з порожнім `scored_at`. Другий виклик
 * нічого нікому не додасть.
 */

type Body = {
  action?: "lock" | "outcome" | "score" | "teams" | "played" | "odds";
  stage?: number;
  actual?: Record<string, string>;
  teams?: string[];
  played?: { a: string; b: string; w: string }[];
  opening?: { a: string; b: string; at: string; oa?: number | null; ob?: number | null }[];
};

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const stage = Number(body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 4) {
    return NextResponse.json({ ok: false, error: "Немає такої стадії." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("major_stages")
    .select("*")
    .eq("stage", stage)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ ok: false, error: "Немає такої стадії." }, { status: 400 });
  }

  const shape = shapeOf(((row.kind as StageKind | null) ?? "swiss"));
  const teams = (row.teams as string[]) ?? [];

  /* --- Склад стадії ----------------------------------------------------- */
  if (body.action === "teams") {
    const list = Array.isArray(body.teams) ? body.teams.map(String) : [];
    if (new Set(list).size !== list.length) {
      return NextResponse.json({ ok: false, error: "Команда повторюється." }, { status: 400 });
    }
    if (list.length > shape.roster) {
      return NextResponse.json(
        { ok: false, error: `У стадії не більше ${shape.roster} команд.` },
        { status: 400 },
      );
    }
    await admin
      .from("major_stages")
      .update({ teams: list, updated_at: new Date().toISOString() })
      .eq("stage", stage);
    await logAdmin("major", `стадія ${stage}: склад — ${list.length} команд`);
    return NextResponse.json({ ok: true, teams: list });
  }

  /* --- Коефіцієнти букмекера -------------------------------------------- */
  // Чужі числа, тому вносяться руками: у BetKing лінія живе всередині їхнього
  // застосунку, відкритого ендпоінта немає, а вигадувати коефіцієнти й ставити
  // під чужий логотип не можна — це вже не цитата, а підробка.
  //
  // Пари не чіпаємо: приходить той самий `opening`, у якому міняються лише
  // `oa`/`ob`. Так помилка в полі не може переписати розклад.
  if (body.action === "odds") {
    const list = Array.isArray(body.opening) ? body.opening : [];
    const was = (row.opening as { a: string; b: string }[] | null) ?? [];
    if (list.length !== was.length) {
      return NextResponse.json(
        { ok: false, error: "Кількість пар не збігається." },
        { status: 400 },
      );
    }
    const next = was.map((m, i) => {
      const o = list[i];
      const num = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 1 ? Math.round(n * 100) / 100 : null;
      };
      return { ...m, oa: num(o?.oa), ob: num(o?.ob) };
    });

    await admin
      .from("major_stages")
      .update({ opening: next, updated_at: new Date().toISOString() })
      .eq("stage", stage);
    await logAdmin("major", `стадія ${stage}: коефіцієнти оновлено`);
    return NextResponse.json({ ok: true, filled: next.filter((m) => m.oa && m.ob).length });
  }

  /* --- Зіграні матчі ---------------------------------------------------- */
  // Потрібні не для нарахування, а для шансів: щоб сказати, що буде далі,
  // треба знати, звідки рахувати. Матч, а не рахунок команди — з переліку
  // матчів виводяться і рекорди, і те, хто з ким уже грав, а швейцарка не
  // зводить тих самих удруге.
  if (body.action === "played") {
    const list = Array.isArray(body.played) ? body.played : [];
    for (const m of list) {
      if (!teams.includes(m.a) || !teams.includes(m.b)) {
        return NextResponse.json(
          { ok: false, error: `${m.a} або ${m.b} не з цієї стадії.` },
          { status: 400 },
        );
      }
      if (m.a === m.b) {
        return NextResponse.json({ ok: false, error: "Команда сама з собою." }, { status: 400 });
      }
      if (m.w !== m.a && m.w !== m.b) {
        return NextResponse.json(
          { ok: false, error: "Переможець не з цієї пари." },
          { status: 400 },
        );
      }
    }
    await admin
      .from("major_stages")
      .update({ played: list, updated_at: new Date().toISOString() })
      .eq("stage", stage);
    await logAdmin("major", `стадія ${stage}: зіграних матчів — ${list.length}`);
    return NextResponse.json({ ok: true, played: list.length });
  }

  /* --- Замок ------------------------------------------------------------ */
  // Закриває картки негайно: `starts_at` і є замком, окремого прапорця немає
  // навмисно. Два джерела правди про те, чи приймаються картки, рано чи пізно
  // розійдуться — а так сторінка, RPC і адмінка дивляться в одне поле.
  if (body.action === "lock") {
    const at = new Date().toISOString();
    await admin
      .from("major_stages")
      .update({ starts_at: at, updated_at: at })
      .eq("stage", stage);
    await logAdmin("major", `стадія ${stage}: картки закрито вручну`);
    return NextResponse.json({ ok: true, startsAt: at });
  }

  /* --- Підсумок --------------------------------------------------------- */
  if (body.action === "outcome") {
    const actual = body.actual ?? {};
    const keys = Object.keys(actual);
    const allowed = new Set(shape.outcomes.map((o) => o.key));

    const alien = keys.find((k) => !teams.includes(k));
    if (alien) {
      return NextResponse.json(
        { ok: false, error: `${alien} не з цієї стадії.` },
        { status: 400 },
      );
    }
    const bad = keys.find((k) => !allowed.has(actual[k]));
    if (bad) {
      return NextResponse.json(
        { ok: false, error: `Невідомий підсумок у ${bad}.` },
        { status: 400 },
      );
    }

    await admin
      .from("major_stages")
      .update({ actual, updated_at: new Date().toISOString() })
      .eq("stage", stage);
    await logAdmin("major", `стадія ${stage}: підсумок на ${keys.length} команд`);
    return NextResponse.json({ ok: true, filled: keys.length });
  }

  /* --- Нарахування ------------------------------------------------------ */
  if (body.action === "score") {
    if (row.scored_at) {
      return NextResponse.json(
        { ok: false, error: "Стадію вже зараховано." },
        { status: 409 },
      );
    }
    const actual = (row.actual as Record<string, string> | null) ?? null;
    const filled = actual ? Object.keys(actual).length : 0;
    if (filled !== shape.roster) {
      return NextResponse.json(
        { ok: false, error: `Підсумок заповнений на ${filled} із ${shape.roster}.` },
        { status: 400 },
      );
    }

    const { data, error } = await admin.rpc("score_major_stage", { p_stage: stage });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = (data as { user_id: string; points: number; hits: number }[] | null) ?? [];
    const awarded = rows.reduce((s, r) => s + (r.points ?? 0), 0);
    await logAdmin("major", `стадія ${stage}: нараховано ${awarded} очок на ${rows.length} карток`);
    return NextResponse.json({ ok: true, cards: rows.length, awarded });
  }

  return NextResponse.json({ ok: false, error: "Невідома дія." }, { status: 400 });
}
