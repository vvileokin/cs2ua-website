import { getTournament } from "@/lib/data";

/**
 * Картка швейцарки EPL S24 — що таке правильна картка і скільки вона коштує.
 *
 * Шістнадцять команд, три перемоги виводять далі, три поразки виносять. Це
 * означає, що розкладка завжди та сама, хоч би хто грав: рівно двоє виходять
 * 3-0, троє 3-1, троє 3-2, і дзеркально троє 2-3, троє 1-3, двоє 0-3. Тому
 * картка — не список фаворитів, а розкладка всіх шістнадцяти по шести
 * кошиках із заданою місткістю.
 *
 * Ціна кошика — це його рідкість, а не симпатія до команди. Крайні кошики
 * вузькі (двоє) і вимагають назвати не просто сильного, а того, хто пройде
 * без жодної поразки, або того, хто посиплеться повністю. Середні широкі, і
 * влучити в них легше, бо туди падає більшість.
 *
 * Правило дзеркалиться в міграції 0083, яка і платить. Міняти обидва місця.
 */
export const EPL_BUCKETS = ["3-0", "3-1", "3-2", "2-3", "1-3", "0-3"] as const;
export type EplBucket = (typeof EPL_BUCKETS)[number];

/** Скільки команд сідає в кожен кошик. Разом — шістнадцять. */
export const EPL_CAPACITY: Record<EplBucket, number> = {
  "3-0": 2, "3-1": 3, "3-2": 3, "2-3": 3, "1-3": 3, "0-3": 2,
};

export const EPL_SCORING = {
  /** Точний кошик. Крайні вузькі, тож коштують більше за середні. */
  exact: { "3-0": 150, "3-1": 60, "3-2": 60, "2-3": 60, "1-3": 60, "0-3": 150 } as Record<EplBucket, number>,
  /** Кошик не той, але сторону вгадано: пройшов — і справді пройшов. */
  side: 20,
  /** Усі шістнадцять по місцях. */
  perfect: 500,
} as const;

/** 1 820 за ідеальну картку: 2×150 + 4×3×60 + 2×150 = 1 320, і 500 за безпомилковість. */
export const EPL_MAX =
  EPL_BUCKETS.reduce((sum, b) => sum + EPL_SCORING.exact[b] * EPL_CAPACITY[b], 0) +
  EPL_SCORING.perfect;

export type EplSwissPicks = Record<string, EplBucket>;

export const EPL_SLUG = "esl-pro-league-s24";

/** Хто грає. Порядок — посів першого туру, як у каталозі. */
export function eplTeams(): string[] {
  return getTournament(EPL_SLUG)?.teamSlugs ?? [];
}

/** Пройшов далі чи вилетів — те, що лишається від кошика, коли забути рахунок. */
export function eplSide(bucket: EplBucket): "through" | "out" {
  return bucket.startsWith("3") ? "through" : "out";
}

/**
 * Картка валідна, коли кожна команда турніру стоїть рівно в одному кошику, а
 * місткість кошиків витримана. Перевіряється і тут, і в маршруті, і в самій
 * базі: маршрут — це двері, перевірка в базі — стіна.
 */
export function isCompleteCard(picks: EplSwissPicks): boolean {
  const teams = eplTeams();
  if (teams.length === 0) return false;
  if (Object.keys(picks).length !== teams.length) return false;
  if (!teams.every((t) => EPL_BUCKETS.includes(picks[t] as EplBucket))) return false;
  for (const b of EPL_BUCKETS) {
    const n = teams.filter((t) => picks[t] === b).length;
    if (n !== EPL_CAPACITY[b]) return false;
  }
  return true;
}

/** Скільки коштує картка проти реального підсумку швейцарки. */
export function scoreCard(picks: EplSwissPicks, actual: EplSwissPicks): number {
  let points = 0;
  let exact = 0;
  const teams = eplTeams();
  for (const team of teams) {
    const pick = picks[team];
    const real = actual[team];
    if (!pick || !real) continue;
    if (pick === real) {
      points += EPL_SCORING.exact[real];
      exact++;
    } else if (eplSide(pick) === eplSide(real)) {
      points += EPL_SCORING.side;
    }
  }
  if (exact === teams.length) points += EPL_SCORING.perfect;
  return points;
}
