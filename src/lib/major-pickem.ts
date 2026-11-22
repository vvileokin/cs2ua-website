/**
 * Пікеми на мейджор — правила в одному місці.
 *
 * Усе, що тут лежить, дзеркалить міграції 0094 і 0096. База — це остання
 * інстанція: вона перевіряє форму картки, замок і належність команд стадії, і
 * зробить це навіть тоді, коли запит прийде повз сторінку. Цей файл потрібен
 * для іншого — щоб сторінка могла порахувати те саме ДО відправки й сказати
 * людині, що не так, поки вона ще дивиться на картку, а не після round-trip.
 *
 * Отже два правила: цифри звідси й із міграцій міняються разом, і жодна
 * перевірка звідси не замінює серверну.
 */

/* --- Ролі ---------------------------------------------------------------- */

/** Швейцарка: три ролі з шістнадцяти команд. Четвертої немає — решта шість
 *  лишаються без ролі, і це теж твердження: «пройде, але не 3:0, і не
 *  вилетить». */
export type SwissRole = "3-0" | "adv" | "0-3";

/** Плей-оф: вісім команд, одна сітка. Ролі — це місця в ній. */
export type PlayoffRole = "champ" | "final" | "semi";

export type PickRole = SwissRole | PlayoffRole;

export type PickemPicks = Record<string, PickRole>;

export type StageKind = "swiss" | "playoff";

export type RoleSpec = {
  role: PickRole;
  /** Скільки команд має отримати цю роль. Рівно стільки, не менше й не більше. */
  cap: number;
  /** Підпис кошика. */
  label: string;
  /** Що це означає словами — для заголовків і для озвучування. */
  title: string;
  /** Той самий сенс без рахунку на початку: рахунок уже стоїть у `label`,
   *  і повторювати його в рядку поруч нема сенсу. */
  note: string;
  /** Ціна одного влучання. */
  price: number;
};

export type PickemTier = { key: string; name: string; from: number; tone: string };

export type CardShape = {
  kind: StageKind;
  /** Скільки команд у стадії. Поки їх менше — картка не відкривається. */
  roster: number;
  roles: RoleSpec[];
  /** Бонус за картку без жодної помилки. */
  perfect: number;
  /** Скільки виборів у картці. */
  picks: number;
  /** Максимум за стадію. */
  max: number;
  tiers: PickemTier[];
};

/**
 * Ціни.
 *
 * Йдуть від рідкості, а не від важливості. Назвати найсильнішого легко —
 * назвати того, хто візьме три поспіль, ні; тому краї швейцарки втричі дорожчі
 * за середину. У плей-офі те саме по-іншому: чемпіон один із восьми, а пара
 * тих, хто програє в півфіналі, — це вже вибір із шести, що лишились.
 *
 * Максимум за стадію однаковий — 1400 — і це не збіг. Кожна стадія це одна
 * роздача призів, і жодна не має важити у фінальному заліку більше за інші
 * тільки тому, що в ній більше виборів.
 */
const SWISS: CardShape = build({
  kind: "swiss",
  roster: 16,
  perfect: 500,
  roles: [
    /* Двокрапка в підписі, дефіс у значенні: «3-0» лежить у базі як ключ ролі
       (0094), і міняти його заради типографіки означало б міграцію заради
       вигляду. */
    { role: "3-0", cap: 2, label: "3:0", title: "3:0 — без поразок", note: "без поразок", price: 150 },
    /* Прохід — єдина роль, якій потрібне слово: два рахунки поруч без нього не
       кажуть, що це одне. */
    { role: "adv", cap: 6, label: "3:1 3:2", title: "3:1 3:2 — проходять", note: "проходять", price: 50 },
    { role: "0-3", cap: 2, label: "0:3", title: "0:3 — виліт", note: "виліт", price: 150 },
  ],
  tiers: [
    { key: "diamond", name: "Діамант", from: 10, tone: "var(--info)" },
    { key: "gold", name: "Золото", from: 9, tone: "var(--tier1)" },
    { key: "silver", name: "Срібло", from: 7, tone: "var(--ink-muted)" },
    { key: "bronze", name: "Бронза", from: 5, tone: "var(--warning)" },
  ],
});

const PLAYOFF: CardShape = build({
  kind: "playoff",
  roster: 8,
  perfect: 300,
  roles: [
    { role: "champ", cap: 1, label: "Чемпіон", title: "Візьме мейджор", note: "бере трофей", price: 400 },
    { role: "final", cap: 1, label: "Фіналіст", title: "Дійде до фіналу й програє його", note: "програє фінал", price: 300 },
    { role: "semi", cap: 2, label: "Півфінал", title: "Зупиняться за крок до фіналу", note: "за крок до фіналу", price: 200 },
  ],
  tiers: [
    { key: "diamond", name: "Діамант", from: 4, tone: "var(--info)" },
    { key: "gold", name: "Золото", from: 3, tone: "var(--tier1)" },
    { key: "silver", name: "Срібло", from: 2, tone: "var(--ink-muted)" },
    { key: "bronze", name: "Бронза", from: 1, tone: "var(--warning)" },
  ],
});

function build(s: Omit<CardShape, "picks" | "max">): CardShape {
  const picks = s.roles.reduce((n, r) => n + r.cap, 0);
  /* Рахується, а не вписується числом, щоб лишитися правдою після будь-якої
     зміни цін вище. */
  const max = s.roles.reduce((n, r) => n + r.cap * r.price, 0) + s.perfect;
  return { ...s, picks, max };
}

export const SHAPES: Record<StageKind, CardShape> = { swiss: SWISS, playoff: PLAYOFF };

export function shapeOf(kind: StageKind): CardShape {
  return SHAPES[kind] ?? SWISS;
}

/** Опис ролі за ключем — байдуже, з якої вона картки: ключі не перетинаються. */
export function specOf(role: PickRole): RoleSpec | null {
  for (const s of Object.values(SHAPES)) {
    const hit = s.roles.find((r) => r.role === role);
    if (hit) return hit;
  }
  return null;
}

/* --- Призи ---------------------------------------------------------------
 *
 * Скіни, а не абстрактні очки. Очки тут — спосіб вишикувати людей у рядок;
 * усе, що з цього рядка справді дістається гравцеві, — це десять перших місць
 * кожної стадії та десять перших підсумкової таблиці.
 */

/** Скільки місць нагороджується в кожній роздачі. */
export const PRIZE_TOP = 10;

export type Prize = {
  /** Номер стадії або `"final"` — підсумковий залік за всі чотири. */
  key: number | "final";
  label: string;
  /** Назва скіна так, як вона виглядає в інвентарі. */
  skin: string;
  wear: string;
  /** Ціна одного екземпляра на торговій площадці, USD. */
  unit: number;
  /** Картинка скіна в `public/skins`. Приз краще показати, ніж назвати:
   *  «Desert Eagle | Trigger Discipline» нічого не каже тому, хто цього
   *  скіна не бачив, а побачивши — впізнає одразу. */
  img: string;
  /**
   * Частка ширини коробки, яку займає ствол. Від довжини справжньої зброї.
   *
   * Картинки приходять обрізаними впритул, і якщо просто вписати кожну у
   * свою коробку, пістолет займе її всю, а AWP ляже тонкою смужкою — на
   * сторінці Glock виходить більшим за AK. Тому масштаб один на всіх і
   * береться з довжини: AWP 1180 мм, AK 880, USP із глушником 330,
   * Desert Eagle 270, Glock 186.
   *
   * Не прямою пропорцією, а стисненою (корінь із відношення): у чистих
   * пропорціях Glock — шістнадцять відсотків від AWP, тобто двадцять
   * пікселів, на яких уже нічого не видно. Стиснення лишає порядок
   * правильним — гвинтівки довші за пістолети, — але тримає найменший
   * приз таким, що його ще можна роздивитися.
   */
  scale: number;
  /** Закладений бюджет роздачі, USD. Він трохи більший за десять цін: скіни
   *  купуються в різні дні й за різними цінами, і рівний бюджет — це те, що
   *  ми обіцяємо, а `unit` — те, скільки воно коштує сьогодні. */
  budget: number;
};

export const PRIZES: Prize[] = [
  { key: 1, label: "Стадія 1", skin: "AWP | Duality", wear: "Minimal Wear", unit: 5.28 , budget: 50 , img: "/skins/awp-duality.png" , scale: 1 },
  { key: 2, label: "Стадія 2", skin: "Glock-18 | Vogue", wear: "Minimal Wear", unit: 5.77 , budget: 60 , img: "/skins/glock-vogue.webp" , scale: 0.435 },
  { key: 3, label: "Стадія 3", skin: "Desert Eagle | Trigger Discipline", wear: "Factory New", unit: 6.47 , budget: 70 , img: "/skins/deagle-trigger-discipline.webp" , scale: 0.515 },
  { key: 4, label: "Плей-оф", skin: "USP-S | Cortex", wear: "Minimal Wear", unit: 7.37 , budget: 80 , img: "/skins/usp-cortex.webp" , scale: 0.565 },
  { key: "final", label: "Підсумок", skin: "AK-47 | Midnight Laminate", wear: "Minimal Wear", unit: 10.43 , budget: 100 , img: "/skins/ak-midnight-laminate.webp" , scale: 0.875 },
];

export function prizeFor(key: number | "final"): Prize | null {
  return PRIZES.find((p) => p.key === key) ?? null;
}

/** Увесь фонд. Сума, а не вписане число — щоб не розійтися зі списком вище. */
export const PRIZE_FUND = PRIZES.reduce((s, p) => s + p.budget, 0);

/* --- Форма картки -------------------------------------------------------- */

/** Скільки команд уже стоїть у кожній ролі. */
export function roleCounts(picks: PickemPicks, shape: CardShape): Record<string, number> {
  const n: Record<string, number> = {};
  for (const r of shape.roles) n[r.role] = 0;
  for (const role of Object.values(picks)) {
    if (role in n) n[role] += 1;
  }
  return n;
}

/** Картка готова до відправки: всі кошики заповнені рівно. */
export function isComplete(picks: PickemPicks, shape: CardShape): boolean {
  const n = roleCounts(picks, shape);
  return shape.roles.every((r) => n[r.role] === r.cap);
}

/**
 * Підсумок стадії.
 *
 * У швейцарці це той самий словник кошиків, що і в EPL: 3-0, 3-1, 3-2, 2-3,
 * 1-3, 0-3 — прохід це будь-який кошик, що починається з трійки. У плей-офі
 * підсумок пишеться самими ролями: champ, final, semi, qf.
 */
export type StageOutcome = Record<string, string>;

export function isHit(role: PickRole, outcome: string | undefined): boolean {
  if (!outcome) return false;
  /* Єдина роль, яка збирає кілька різних підсумків під себе. */
  if (role === "adv") return outcome.startsWith("3");
  return outcome === role;
}

/** Очки за картку, тією самою формулою, що в `score_major_stage`. */
export function scoreCard(picks: PickemPicks, actual: StageOutcome, shape: CardShape) {
  let points = 0;
  let hits = 0;
  for (const [team, role] of Object.entries(picks)) {
    if (isHit(role, actual[team])) {
      points += specOf(role)?.price ?? 0;
      hits += 1;
    }
  }
  if (hits === shape.picks) points += shape.perfect;
  return { points, hits };
}

/* --- Рівні ---------------------------------------------------------------
 *
 * Рахуються від влучань, а не від суми. Десять правильних проходів і два
 * вгаданих краї дають близькі суми, але це різні картки, і зводити їх в одну
 * шкалу нечесно.
 */
export function tierOf(hits: number, shape: CardShape): PickemTier | null {
  return shape.tiers.find((t) => hits >= t.from) ?? null;
}

/* --- Як розв'язується нічия ----------------------------------------------
 *
 * Скіни дістаються першій десятці, і без цього правила десятки просто не
 * існує: при десяти виборах однакова сума в кількох людей — не рідкість, а
 * норма. Ті самі 600 очок легко збереться в п'ятнадцятьох одночасно, і хтось
 * із них мусить бути одинадцятим.
 *
 * Порядок саме такий:
 *   1. очки
 *   2. влучання — при рівній сумі вище той, хто вгадав більше подій
 *   3. час збереження картки, раніше — вище
 *
 * Третій пункт не випадковий. Він єдиний, на який гравець впливає сам і який
 * не можна перехитрити: картка, подана за годину до замка, встигла врахувати
 * і заміни в складах, і новини, і чужі розклади. Той, хто поставив своє раніше
 * й більше не правив, ризикував більше — і при рівному результаті стоїть вище.
 *
 * Порахувати це на клієнті не можна і не треба: рядки шикує база
 * (`major_stage_board` у 0096), бо тільки вона бачить усі картки.
 */
