import type { Match } from "@/lib/data";

/**
 * Швейцарка на шістнадцять, розкладена з самих матчів.
 *
 * Сітку тут нема де взяти з розкладу: HLTV публікує пари другого туру аж тоді,
 * коли дограно перший, і так до кінця. Але сама форма турніру відома наперед —
 * вісім пар у першому турі, далі переможці грають із переможцями, програлі з
 * програлими, і з кожним туром поле ділиться навпіл. Тому колонка матчу — це
 * не властивість матчу, а рахунок обох команд перед ним, а він рахується з
 * уже зіграного.
 *
 * Звідси і порожні місця: колонка знає, скільки пар у ній має бути, тож поки
 * розклад не вийшов, вона показує стільки ж карток із питальниками, скільки
 * їх там буде.
 */
export type SwissCell = { match?: Match; a?: string; b?: string };

export type SwissColumn = {
  /** «1-0» — рахунок, з яким команди заходять у цей матч. */
  key: string;
  label: string;
  /** Скільки пар у цій колонці, коли турнір дійде до неї. */
  expected: number;
  cells: SwissCell[];
};

export const SWISS_COLUMNS: { key: string; expected: number }[] = [
  { key: "0-0", expected: 8 },
  { key: "1-0", expected: 4 },
  { key: "0-1", expected: 4 },
  { key: "2-0", expected: 2 },
  { key: "1-1", expected: 4 },
  { key: "0-2", expected: 2 },
  { key: "2-1", expected: 3 },
  { key: "1-2", expected: 3 },
  /* Останній тур. Сюди сходяться ті, хто виграв у гілці програлих і програв у
     гілці переможців: шестеро на три пари, і кожна пара розводить по різні
     боки — переможець у 3:2, програлий у 2:3. */
  { key: "2-2", expected: 3 },
];

/** Кошики, якими швейцарка закінчується. Форма та сама за будь-якого складу. */
export const SWISS_THROUGH = ["3-0", "3-1", "3-2"] as const;
export const SWISS_OUT = ["2-3", "1-3", "0-3"] as const;
export const SWISS_BUCKET_SIZE: Record<string, number> = {
  "3-0": 2, "3-1": 3, "3-2": 3, "2-3": 3, "1-3": 3, "0-3": 2,
};

export type SwissState = {
  columns: SwissColumn[];
  /** Команди, що вже вийшли, за підсумковим рахунком. */
  through: Record<string, string[]>;
  /** Команди, що вже вилетіли. */
  out: Record<string, string[]>;
  /** Поточний рахунок кожної команди. */
  records: Map<string, { w: number; l: number }>;
};

const at = (m: Match) => (m.startISO ? Date.parse(m.startISO) : Number.MAX_SAFE_INTEGER);

export function swissState(matches: Match[], teamSlugs: string[] = []): SwissState {
  const records = new Map<string, { w: number; l: number }>();
  for (const slug of teamSlugs) records.set(slug, { w: 0, l: 0 });
  const rec = (slug: string) => {
    let r = records.get(slug);
    if (!r) { r = { w: 0, l: 0 }; records.set(slug, r); }
    return r;
  };

  const cells = new Map<string, SwissCell[]>();
  for (const c of SWISS_COLUMNS) cells.set(c.key, []);

  /* Порядок важливий: рахунок перед матчем залежить від того, що вже зіграно,
     тож матчі проходять у тому порядку, в якому вони відбуваються. */
  for (const m of [...matches].sort((x, y) => at(x) - at(y))) {
    const ra = rec(m.a), rb = rec(m.b);
    /* У швейцарці обидві сторони заходять у матч з однаковим рахунком. Якщо
       дані розійшлися — беремо гіршу з двох, щоб картка не підскочила в
       колонку, якої вона не заслужила. */
    const w = Math.min(ra.w, rb.w);
    const l = Math.min(ra.l, rb.l);
    const key = `${w}-${l}`;
    (cells.get(key) ?? cells.set(key, []).get(key)!).push({ match: m, a: m.a, b: m.b });

    if (m.status === "finished" && m.scoreA !== m.scoreB) {
      const aWon = m.scoreA > m.scoreB;
      (aWon ? ra : rb).w++;
      (aWon ? rb : ra).l++;
    }
  }

  const columns: SwissColumn[] = SWISS_COLUMNS.map((c) => {
    const filled = cells.get(c.key) ?? [];
    const blanks = Math.max(0, c.expected - filled.length);
    return {
      key: c.key,
      label: c.key.replace("-", ":"),
      expected: c.expected,
      cells: [...filled, ...Array.from({ length: blanks }, () => ({}) as SwissCell)],
    };
  });

  const through: Record<string, string[]> = { "3-0": [], "3-1": [], "3-2": [] };
  const out: Record<string, string[]> = { "2-3": [], "1-3": [], "0-3": [] };
  for (const [slug, r] of records) {
    if (r.w >= 3) through[`3-${Math.min(r.l, 2)}`]?.push(slug);
    else if (r.l >= 3) out[`${Math.min(r.w, 2)}-3`]?.push(slug);
  }

  return { columns, through, out, records };
}
