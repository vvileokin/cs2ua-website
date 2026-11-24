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

/**
 * Пара першого туру зі стадії.
 *
 * `oa` / `ob` — коефіцієнти букмекера на перемогу кожної команди. Їх немає в
 * жодному фіді: у BetKing лінія живе всередині їхнього застосунку, без
 * відкритого ендпоінта, тож числа вносить адмін. Вісім матчів — шістнадцять
 * чисел на тур, і зате вони справжні, а не наші, видані за чужі.
 */
export type StageMatch = {
  a: string;
  b: string;
  at: string;
  oa?: number | null;
  ob?: number | null;
};

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

/** Слаг мейджора в каталозі турнірів. Один рядок, бо він потрібен і тут, і
 *  на сторінці: матч шукається за ним, а не за назвою. */
export const MAJOR_SLUG = "pgl-major-singapore-2026";

/** Що сталося з парою першого туру, якщо матч уже заведений у турнір. */
export type OpeningLive = {
  id: string;
  status: string;
  scoreA: number;
  scoreB: number;
  /** Слаг команди, чий рахунок у матчі стоїть першим. Порівнюється з парою
   *  на місці: ключ складено з відсортованих слагів, і сам по собі він про
   *  порядок нічого не каже. */
  teamA: string;
  /** Друга команда матчу, у тому ж порядку. */
  teamB: string;
  /** Початок за даними матчу. Він правдивіший за розклад стадії: розклад
   *  вносили один раз міграцією, а матч заводять із сітки події. */
  startAt: string | null;
  /** Матч уже почався і ще не завершений. */
  live: boolean;
};

/**
 * Матчі мейджора, ключем — пара команд.
 *
 * Розклад стадії лежить у `major_stages.opening` (0095) і нічого не знає про
 * таблицю матчів: пари вносилися, коли мейджора в турнірах ще не було. Тепер
 * він там є, і ті самі вісім пар можуть мати живий матч зі своєю сторінкою й
 * рахунком — але зв'язати їх можна лише по командах, бо спільного ключа в
 * них немає і заводити його заднім числом нема сенсу.
 *
 * Ключ складається з двох слагів, відсортованих за абеткою, тож порядок
 * команд у матчі й у парі може не збігатися — а він і не збігається, коли
 * матч заводять руками. Саме тому тут їде `teamA`, а не прапорець «перевернуто»:
 * перша версія виводила його як `a > b`, тобто з абетки, і мовчки припускала,
 * що в розкладі команди стоять за абеткою теж. Вони там не за абеткою, і
 * чотири рахунки з восьми показувалися задом наперед — 9z, що програли
 * Lynn Vision, стояли в стрічці з 1:0. Порядок знає тільки той, у кого на
 * руках обидві пари, і це місце виклику.
 */
export const getOpeningLive = cache(
  async (): Promise<Record<string, OpeningLive>> => {
    const sb = await createClient();
    const { data } = await sb
      .from("matches")
      .select("id, team_a, team_b, status, score_a, score_b, start_at")
      .eq("tournament_slug", MAJOR_SLUG);

    const now = Date.now();

    const out: Record<string, OpeningLive> = {};
    for (const m of data ?? []) {
      const a = m.team_a as string;
      const b = m.team_b as string;
      if (!a || !b) continue;
      const key = [a, b].sort().join("|");
      const status = (m.status as string) ?? "upcoming";
      const startAt = (m.start_at as string | null) ?? null;
      out[key] = {
        id: m.id as string,
        status,
        scoreA: (m.score_a as number) ?? 0,
        scoreB: (m.score_b as number) ?? 0,
        teamA: a,
        teamB: b,
        startAt,
        /* Живий — або так каже статус, або час старту вже минув, а
           «завершено» ще ніхто не поставив. Друге важливо: у мейджора немає
           фіду, статус міняють руками, і без цієї умови матч, який почався
           півгодини тому, виглядав би як майбутній. */
        live:
          status === "live" ||
          (status !== "finished" && !!startAt && now >= new Date(startAt).getTime()),
      };
    }
    return out;
  },
);

/**
 * Поточний тур стадії — із самої таблиці матчів.
 *
 * Стрічка нагорі сторінки спершу малювала `major_stages.opening`, тобто
 * перший тур і тільки його. Поки йшов перший тур, це було те саме; коли він
 * скінчився, сторінка мейджора лишилася показувати вісім дограних пар, а
 * другий тур, який у цей час ішов, був на ній не видний ніде.
 *
 * Тур тут не читається з поля — такого поля немає. Він виводиться з того, що
 * тур таке: **у турі кожна команда грає не більше разу**. Тому беремо
 * найраніший незавершений матч і додаємо далі за часом, доки не трапиться
 * команда, яка вже є. Це правило не знає ні про вісімки, ні про години, тож
 * однаково працює і на турі з восьми пар, і на турі з трьох, і в плей-офі —
 * і не збивається, коли матчі наступного туру заводять заздалегідь.
 *
 * Коли незавершених не лишилось, показується останній тур: стадія скінчилася,
 * і найкорисніше, що може сказати стрічка, — чим вона скінчилася.
 */
export const getStageRound = cache(
  async (): Promise<{ matches: StageMatch[]; live: Record<string, OpeningLive> }> => {
    const live = await getOpeningLive();
    const all = Object.values(live)
      .filter((r) => !!r.startAt)
      .sort((x, y) => (x.startAt as string).localeCompare(y.startAt as string));
    if (!all.length) return { matches: [], live };

    /* Старт — найраніший незавершений матч. Коли таких немає, стадія
       дограна, і показується останній тур: тоді старт — найпізніший матч, а
       набір іде назад. */
    const open = all.findIndex((r) => r.status !== "finished");
    const from = open >= 0 ? open : all.length - 1;

    const taken = new Set<string>();
    const round: OpeningLive[] = [];
    /* Від старту в обидва боки: найраніший незавершений не обов'язково
       перший у своєму турі — о 12:00 може бути незавершеним, поки матч того ж
       туру о 10:45 іще йде, а вже дограний матч о 10:45 опинився б позаду. */
    for (const side of [all.slice(from), all.slice(0, from).reverse()]) {
      for (const r of side) {
        if (taken.has(r.teamA) || taken.has(r.teamB)) break;
        taken.add(r.teamA);
        taken.add(r.teamB);
        round.push(r);
      }
    }
    round.sort((x, y) => (x.startAt as string).localeCompare(y.startAt as string));

    /* Коефіцієнти — з питання «Хто переможе?», поки воно відкрите. Лінію
       ведуть там, а не в розкладі стадії: розклад вносили один раз. */
    const sb = await createClient();
    const { data: qs } = await sb
      .from("questions")
      .select("match_id, options, status")
      .in("match_id", round.map((r) => r.id));
    const odds = new Map<string, [number | null, number | null]>();
    for (const q of qs ?? []) {
      if ((q.status as string) !== "open") continue;
      const o = (q.options ?? []) as { id: string; odds?: number }[];
      odds.set(q.match_id as string, [
        o.find((x) => x.id === "oa")?.odds ?? null,
        o.find((x) => x.id === "ob")?.odds ?? null,
      ]);
    }

    const matches: StageMatch[] = round.map((r) => {
      const [oa, ob] = odds.get(r.id) ?? [null, null];
      /* Порядок команд — як у матчі: звідти ж і рахунок, і коефіцієнти. */
      return { a: r.teamA, b: r.teamB, at: r.startAt as string, oa, ob };
    });

    return { matches, live };
  },
);

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

/** Чи є хто за екраном. Порожні картки гостя й недозаповнена картка гравця
 *  виглядають однаково, а причини в них різні — і сказати треба різне. */
export const isSignedIn = cache(async (): Promise<boolean> => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  return !!user;
});

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
 * Як розклалася спільнота — ще до замка.
 *
 * Чужі картки закриті політикою, і це правильно. Агрегат — інша річ: він
 * каже, скільки людей зробило так само, і нічого про те, хто саме. Рахує
 * його функція з 0100, у якої межа стоїть у сигнатурі, а не в тексті
 * запиту; там же живе й поріг у п'ять карток, нижче якого відсоток це не
 * статистика, а чужа картка, прочитана вголос.
 *
 * «Без ролі» теж роль: у швейцарській картці десять виборів із шістнадцяти,
 * і шестеро, що лишилися, — це теж твердження («вилетить, але не всуха»).
 * Тому повертаємо й загальну кількість карток: частку тих, хто команду не
 * чіпав, інакше не порахувати.
 */
export type Spread = {
  total: number;
  byTeam: Record<string, Record<string, number>>;
};

export const getSpread = cache(async (stage: number): Promise<Spread> => {
  const sb = await createClient();
  const [count, rows] = await Promise.all([
    sb.rpc("major_pickem_count", { p_stage: stage }),
    sb.rpc("major_pickem_spread", { p_stage: stage }),
  ]);

  const byTeam: Record<string, Record<string, number>> = {};
  const list = (rows.data as { team: string; role: string; cards: number }[] | null) ?? [];
  for (const r of list) {
    byTeam[r.team] ??= {};
    byTeam[r.team][r.role] = r.cards;
  }

  /* Нуль, коли розкладу немає.
     Нижче порога функція віддає порожньо, а карток при цьому може бути,
     скажімо, дві — і сторінка чесно ділила нуль на два, показуючи «0%» на
     кожній команді. Читається це як «ніхто так не зробив», тобто як факт,
     якого ми не знаємо. Знаменник існує рівно тоді, коли є що ділити. */
  return { total: list.length ? ((count.data as number | null) ?? 0) : 0, byTeam };
});

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
