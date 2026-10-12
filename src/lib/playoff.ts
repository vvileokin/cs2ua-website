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
 * Поки стадію не зіграно, її картка стоїть порожньою з питальниками — навмисне:
 * сітка, яка росте на колонку щодня, читається як поламана. На дограному
 * турнірі порожніх уже немає.
 */
export type PlayoffSlot = {
  id: string;
  /** Власний підпис, коли слот стоїть у чужій колонці. */
  label?: string;
  /** Матч із бази, щойно пара склалась і його завели. */
  matchId?: string;
  /** Чиї переможці сюди сходяться. Лишається і тоді, коли matchId вже є: до
   *  появи матчу він наповнює слот, а після — страхує від розбіжності, якщо
   *  матч раптом не знайдеться в переданому списку. */
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
      { id: "sf1", matchId: "vitality-vs-aurora-epl24", from: ["qf1", "qf2"] },
      { id: "sf2", matchId: "spirit-vs-mouz-epl24", from: ["qf3", "qf4"] },
    ],
  },
  {
    key: "gf",
    label: "Фінал",
    slots: [
      { id: "gf", matchId: "vitality-vs-mouz-epl24", from: ["sf1", "sf2"] },
      /* Матч за третє місце стоїть тут, під фіналом, а не окремою колонкою:
         з нього нікуди не виходять, тож колонка справа від фіналу читалася б
         як ще один раунд. `from` у нього немає навмисне — сюди сходяться ті,
         хто півфінали програв, а сітка вміє проводити тільки переможців;
         заводити зворотний зв'язок заради одного матчу на турнір не варто,
         а щойно пара склалась, слот наповнює сам матч. */
      { id: "bronze", label: "За 3-тє місце", matchId: "aurora-vs-spirit-epl24" },
    ],
  },
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
