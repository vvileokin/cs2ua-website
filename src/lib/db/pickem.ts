import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  shapeOf,
  type CardShape,
  type PickRole,
  type PickemPicks,
  type StageKind,
  type StageOutcome,
} from "@/lib/major-pickem";

/**
 * Пікеми на мейджор — читання.
 *
 * Жодного запису тут немає навмисно. Картка зберігається рівно одним шляхом —
 * через `save_major_pickem` (0094, 0096), бо саме там живуть замок і перевірка,
 * що команда з цієї стадії. Другий шлях усередину — це другий набір перевірок,
 * які рано чи пізно розійдуться.
 */

/** Пара першого туру зі стадії. */
export type StageMatch = { a: string; b: string; at: string };

export type MajorStage = {
  stage: number;
  title: string;
  /** Швейцарка чи плей-оф. Від цього залежить усе: склад, форма, ціни. */
  kind: StageKind;
  /** Слаги. Поки їх менше за склад стадії, вона ще не укомплектована. */
  teams: string[];
  startsAt: string;
  /** Розклад першого туру. Порожньо, доки його не внесли. */
  opening: StageMatch[];
  actual: StageOutcome | null;
  scoredAt: string | null;
};

export type PickemCard = {
  stage: number;
  picks: PickemPicks;
  points: number;
  hits: number;
  scored: boolean;
};

export type BoardRow = {
  /** Місце, яке порахувала база разом із тайбрейком. Саме за ним — призи. */
  rank: number;
  userId: string;
  handle: string | null;
  avatarUrl: string | null;
  points: number;
  hits: number;
  stages: number;
};

/** Скільки людей поставило кожну роль на кожну команду. */
export type Distribution = {
  total: number;
  byTeam: Record<string, Record<string, number>>;
};

export const getStages = cache(async (): Promise<MajorStage[]> => {
  const sb = await createClient();
  const { data } = await sb
    .from("major_stages")
    /* Зірочка, а не перелік колонок. PostgREST відповідає помилкою на
       запит колонки, якої ще немає, і один невиконаний міграційний крок
       клав би всю сторінку в «Стадії ще не заведені». Зі `*` нова колонка
       просто приходить порожньою, доки її не додадуть. */
    .select("*")
    .order("stage");

  return (data ?? []).map((r) => ({
    stage: r.stage as number,
    title: r.title as string,
    kind: ((r.kind as StageKind | null) ?? "swiss") as StageKind,
    teams: (r.teams as string[]) ?? [],
    startsAt: r.starts_at as string,
    opening: (r.opening as StageMatch[]) ?? [],
    actual: (r.actual as StageOutcome | null) ?? null,
    scoredAt: (r.scored_at as string | null) ?? null,
  }));
});

/** Форма картки цієї стадії. */
export function shapeFor(s: MajorStage): CardShape {
  return shapeOf(s.kind);
}

/** Склад зібрано повністю. */
export function isReady(s: MajorStage): boolean {
  return s.teams.length === shapeFor(s).roster;
}

/** Стадія вже почалася. */
export function hasStarted(s: MajorStage, now = Date.now()): boolean {
  return now >= new Date(s.startsAt).getTime();
}

/** Стадія відкрита для заповнення: укомплектована і ще не почалася. */
export function isOpen(s: MajorStage, now = Date.now()): boolean {
  return isReady(s) && now < new Date(s.startsAt).getTime();
}

/** Яку стадію показувати першою: найближчу відкриту, інакше останню, що
 *  почалася. Сторінка має відкриватись на тому, що зараз грає роль. */
export function currentStage(stages: MajorStage[], now = Date.now()): MajorStage | null {
  if (!stages.length) return null;
  const open = stages.find((s) => isOpen(s, now));
  if (open) return open;
  const started = stages.filter((s) => now >= new Date(s.startsAt).getTime());
  return started.length ? started[started.length - 1] : stages[0];
}

/** Усі картки гравця, ключем — номер стадії. Для гостя — порожньо. */
export const getMyCards = cache(async (): Promise<Record<number, PickemCard>> => {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return {};

  const { data } = await sb
    .from("major_pickem")
    .select("stage, picks, points, hits, scored_at")
    .eq("user_id", user.id);

  const out: Record<number, PickemCard> = {};
  for (const r of data ?? []) {
    out[r.stage as number] = {
      stage: r.stage as number,
      picks: (r.picks as PickemPicks) ?? {},
      points: (r.points as number) ?? 0,
      hits: (r.hits as number) ?? 0,
      scored: !!r.scored_at,
    };
  }
  return out;
});

/**
 * Підсумкова таблиця — сума за всі зіграні стадії.
 *
 * Порядок приходить із бази разом із місцем: тайбрейк (очки → влучання → час
 * збереження) описаний у в'юсі 0096, і перераховувати його тут означало б
 * завести друге правило про те, кому дістається скін.
 */
export const getBoard = cache(async (limit = 100): Promise<BoardRow[]> => {
  const sb = await createClient();
  const q = () => sb.from("major_pickem_board").select("*").limit(limit);

  /* Спершу — порядком, який порахувала база. Якщо 0096 ще не виконана, колонки
     `rank` немає, PostgREST відповідає помилкою на сортування за нею, і дошка
     зникла б цілком. Тому запасний варіант: той самий порядок без тайбрейка.
     Він гірший — рівні рядки стануть у довільному порядку, — але це краще за
     порожню таблицю, і живе рівно до моменту, коли міграцію виконають. */
  const first = await q().order("rank");
  const { data } = first.error
    ? await q().order("points", { ascending: false }).order("hits", { ascending: false })
    : first;

  return (data ?? []).map((r, i) => ({ ...toRow(r), rank: (r.rank as number) ?? i + 1 }));
});

/** Таблиця однієї стадії. Саме по ній видаються скіни за цю стадію. */
export const getStageBoard = cache(
  async (stage: number, limit = 50): Promise<BoardRow[]> => {
    const sb = await createClient();
    const { data } = await sb
      .from("major_stage_board")
      .select("rank, user_id, handle, avatar_url, points, hits")
      .eq("stage", stage)
      .order("rank")
      .limit(limit);

    return (data ?? []).map(toRow);
  },
);

function toRow(r: Record<string, unknown>): BoardRow {
  return {
    rank: (r.rank as number) ?? 0,
    userId: r.user_id as string,
    handle: (r.handle as string | null) ?? null,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    points: (r.points as number) ?? 0,
    hits: (r.hits as number) ?? 0,
    stages: (r.stages as number) ?? 1,
  };
}

/**
 * Розподіл виборів по стадії.
 *
 * До замка RLS віддасть сюди щонайбільше власну картку, і цифра «100% обрали
 * Spirit» була б не статистикою, а дзеркалом. Тому функція сама не рахує
 * нічого, поки стадія не почалася: краще не показати розподіл, ніж показати
 * вигаданий.
 */
export const getDistribution = cache(
  async (stage: number, startsAt: string): Promise<Distribution | null> => {
    if (Date.now() < new Date(startsAt).getTime()) return null;

    const sb = await createClient();
    const { data } = await sb.from("major_pickem").select("picks").eq("stage", stage);
    if (!data?.length) return { total: 0, byTeam: {} };

    const byTeam: Record<string, Record<string, number>> = {};
    for (const row of data) {
      for (const [team, role] of Object.entries((row.picks as PickemPicks) ?? {})) {
        byTeam[team] ??= {};
        byTeam[team][role as PickRole] = (byTeam[team][role as PickRole] ?? 0) + 1;
      }
    }
    return { total: data.length, byTeam };
  },
);
