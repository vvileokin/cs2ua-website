/**
 * Пікеми на мейджор — правила в одному місці.
 *
 * Усе, що тут лежить, дзеркалить міграцію 0094. База — це остання інстанція:
 * вона перевіряє форму картки, замок і належність команд стадії, і зробить це
 * навіть тоді, коли запит прийде повз сторінку. Цей файл потрібен для іншого —
 * щоб сторінка могла порахувати те саме ДО відправки й сказати людині, що не
 * так, поки вона ще дивиться на картку, а не після round-trip.
 *
 * Отже два правила: цифри звідси й з 0094 міняються разом, і жодна перевірка
 * звідси не замінює серверну.
 */

/** Три ролі, які можна дати команді. Четвертої немає: решта шість лишаються
 *  без ролі, і це теж твердження — «пройде, але не 3-0, і не вилетить». */
export type PickRole = "3-0" | "adv" | "0-3";

export type PickemPicks = Record<string, PickRole>;

/** Скільки команд має отримати кожну роль. Сума — десять із шістнадцяти. */
export const ROLE_CAP: Record<PickRole, number> = { "3-0": 2, adv: 6, "0-3": 2 };

export const ROLES: PickRole[] = ["3-0", "adv", "0-3"];

/**
 * Підписи — рахунком, а не словами.
 *
 * Спершу тут стояло «пройдуть без поразок», «пройдуть далі», «вилетять
 * усуха». Описово це точніше, але той, хто відкриває пікем, уже знає цю гру
 * з клієнта, де кошики підписані «3:0», «3:1 3:2», «0:3» — і шукає очима
 * саме ці цифри. Слова змушували читати те, що мало впізнаватися.
 *
 * Двокрапка в підписі, дефіс у значенні: «3-0» лежить у базі як ключ ролі
 * (0094) і міняти його заради типографіки означало б міграцію заради вигляду.
 */
export const ROLE_LABEL: Record<PickRole, string> = {
  "3-0": "3:0",
  adv: "3:1 3:2",
  "0-3": "0:3",
};

/** Те саме для заголовків кошиків і для озвучування. Прохід — єдиний, кому
 *  потрібне слово: два рахунки поруч без нього не кажуть, що це одне. */
export const ROLE_TITLE: Record<PickRole, string> = {
  "3-0": "3:0 — без поразок",
  adv: "3:1 3:2 — проходять",
  "0-3": "0:3 — виліт",
};

/** Ціна влучання. Краї дорожчі за середину, бо вони рідші: назвати
 *  найсильнішого легко, назвати того, хто візьме три поспіль, — ні. */
export const ROLE_PRICE: Record<PickRole, number> = { "3-0": 150, adv: 50, "0-3": 150 };

/** Бонус за всі десять. */
export const PERFECT_BONUS = 500;

/** Максимум за стадію — 1400. Рахується, а не вписується числом, щоб
 *  лишитися правдою після будь-якої зміни цін вище. */
export const STAGE_MAX =
  ROLES.reduce((s, r) => s + ROLE_CAP[r] * ROLE_PRICE[r], 0) + PERFECT_BONUS;

export const TEAMS_PER_STAGE = 16;
export const PICKS_PER_CARD = ROLES.reduce((s, r) => s + ROLE_CAP[r], 0);

/* --- Рівні ---------------------------------------------------------------
 *
 * Рахуються від влучань, а не від суми. Десять правильних проходів і два
 * вгаданих краї дають близькі суми, але це різні картки, і зводити їх в одну
 * шкалу нечесно. П'ять — поріг, з якого картка взагалі зарахована: нижче це
 * не рівень, а результат.
 */
export type PickemTier = { key: string; name: string; from: number; tone: string };

export const TIERS: PickemTier[] = [
  { key: "diamond", name: "Діамант", from: 10, tone: "var(--info)" },
  { key: "gold", name: "Золото", from: 9, tone: "var(--tier1)" },
  { key: "silver", name: "Срібло", from: 7, tone: "var(--ink-muted)" },
  { key: "bronze", name: "Бронза", from: 5, tone: "var(--warning)" },
];

export function tierOf(hits: number): PickemTier | null {
  return TIERS.find((t) => hits >= t.from) ?? null;
}

/* --- Форма картки -------------------------------------------------------- */

/** Скільки команд уже стоїть у кожній ролі. */
export function roleCounts(picks: PickemPicks): Record<PickRole, number> {
  const n: Record<PickRole, number> = { "3-0": 0, adv: 0, "0-3": 0 };
  for (const role of Object.values(picks)) n[role] += 1;
  return n;
}

/** Картка готова до відправки: всі три кошики заповнені рівно. */
export function isComplete(picks: PickemPicks): boolean {
  const n = roleCounts(picks);
  return ROLES.every((r) => n[r] === ROLE_CAP[r]);
}

/**
 * Підсумок стадії приходить тим самим словником кошиків, що і в швейцарці
 * EPL: 3-0, 3-1, 3-2, 2-3, 1-3, 0-3. Прохід — будь-який кошик, що починається
 * з трійки.
 */
export type StageOutcome = Record<string, string>;

export function isHit(role: PickRole, outcome: string | undefined): boolean {
  if (!outcome) return false;
  if (role === "adv") return outcome.startsWith("3");
  return outcome === role;
}

/** Очки за картку, рахунком тієї ж формули, що в `score_major_stage`. */
export function scoreCard(picks: PickemPicks, actual: StageOutcome) {
  let points = 0;
  let hits = 0;
  for (const [team, role] of Object.entries(picks)) {
    if (isHit(role, actual[team])) {
      points += ROLE_PRICE[role];
      hits += 1;
    }
  }
  if (hits === PICKS_PER_CARD) points += PERFECT_BONUS;
  return { points, hits };
}
