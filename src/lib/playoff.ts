import type { Match } from "@/lib/data";

/**
 * Плейоф EPL S24 — сітка на вісім, відома наперед.
 *
 * Тут усе навпаки проти швейцарки. Там колонку матчу доводиться вираховувати з
 * рахунку обох команд, бо пари наступного туру стають відомі аж після
 * поточного; тут же сітка опублікована цілком — хто з ким у чвертьфіналі і яка
 * пара куди веде. Отже структура живе в коді, а з матчів береться тільки те,
 * чим вона наповнюється: рахунки й переможці.
 *
 * Півфінали й фінал порожні не тому, що даних бракує, а тому що їх ще не
 * зіграли. Порожню картку з питальниками малюємо навмисне — сітка, яка росте
 * на колонку щодня, читається як поламана.
 */
export type PlayoffSlot = {
  id: string;
  /** Матч із бази, якщо пара вже відома і заведена. */
  matchId?: string;
  /** Чиї переможці сюди сходяться — для слотів, які ще порожні. */
  from?: [string, string];
};

export type PlayoffRound = { key: string; label: string; slots: PlayoffSlot[] };

/**
 * Порядок пар узято з публікації ESL і не вгадується: перші дві чвертки
 * сходяться в один півфінал, другі дві — в інший.
 */
export const PLAYOFF: PlayoffRound[] = [
  {
    key: "qf",
    label: "Чвертьфінали",
    slots: [
      { id: "qf1", matchId: "vitality-vs-parivision-epl24" },
      { id: "qf2", matchId: "onewin-vs-aurora-epl24" },
      { id: "qf3", matchId: "falcons-vs-spirit-epl24" },
      { id: "qf4", matchId: "furia-vs-mouz-epl24" },
    ],
  },
  {
    key: "sf",
    label: "Півфінали",
    slots: [
      { id: "sf1", from: ["qf1", "qf2"] },
      { id: "sf2", from: ["qf3", "qf4"] },
    ],
  },
  { key: "gf", label: "Фінал", slots: [{ id: "gf", from: ["sf1", "sf2"] }] },
];

export type PlayoffCell = {
  slot: PlayoffSlot;
  match?: Match;
  /** Хто грає: слаґ команди або `undefined`, поки пара не склалась. */
  a?: string;
  b?: string;
};

const winnerOf = (m?: Match) =>
  m && m.status === "finished" && m.scoreA !== m.scoreB ? (m.scoreA > m.scoreB ? m.a : m.b) : undefined;

/**
 * Хто де стоїть просто зараз.
 *
 * Переможці протікають угору по сітці самі: щойно чвертка дограна, її
 * переможець з'являється у своєму півфіналі, і для цього не треба ні окремого
 * запису в базі, ні того, щоб півфінальний матч уже існував.
 */
export function playoffState(matches: Match[]): PlayoffCell[][] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const won = new Map<string, string | undefined>();

  return PLAYOFF.map((round) =>
    round.slots.map((slot) => {
      const match = slot.matchId ? byId.get(slot.matchId) : undefined;
      const a = match?.a ?? (slot.from && won.get(slot.from[0]));
      const b = match?.b ?? (slot.from && won.get(slot.from[1]));
      won.set(slot.id, winnerOf(match));
      return { slot, match, a: a ?? undefined, b: b ?? undefined };
    }),
  );
}
