import fs from "node:fs";
import { run, P0, REGION } from "./engine-all.mjs";

/**
 * Збирає final15.json з прогону engine-all.mjs — усі три регіони на формулі.
 *
 * Рядки, для яких розкладу немає (нижче тих, хто ще в боротьбі), лишаються з
 * прогону старої моделі на тій самій таблиці. Там шанс і так нуль, а викидати
 * їх зі сторінки означало б урізати таблиці вдвічі заради однорідності.
 *
 * Запуск: node publish-all.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 40000);
const OLD = JSON.parse(fs.readFileSync("final15-2810-old.json", "utf8"));
const SLOTS = OLD.slots;

/** Глобальне місце — первинний ключ таблиці на сайті. */
const GLOBAL = new Map();
for (const s of JSON.parse(fs.readFileSync("vrs-live-2810.json", "utf8")).rows.split(";")) {
  const [rank, team] = s.split("|");
  if (!GLOBAL.has(team)) GLOBAL.set(team, +rank);
}

/** Які турніри в кого попереду — для підпису на сторінці. */
const T1 = { "PGL Masters Bucharest": ["Vitality", "MOUZ", "Spirit", "Aurora", "BETBOOM", "FUT",
                                       "Natus Vincere", "Nemiga", "FURIA"] };
const T2 = {
  "Stake Ranked Episode 5": ["BIG", "Inner Circle", "fnatic", "Astralis", "magic", "Nemesis", "Eternal Fire", "MIBR"],
  "RLG Tesla Cup 2026": ["B8", "FaZe", "HOTU", "GamerLegion", "Luminosity", "Envy"],
  "Moscow Cyber Games": ["1win", "HOTU", "5star", "The Huns"],
  "FiReSPORTS Last Chance": ["100 Thieves", "NRG", "Wildcard", "BESTIA", "Fluxo", "Galorys", "ShindeN"],
  "Gamers Club Masters": ["paiN", "DENDELE", "Imperial"],
  "Circuito Retake Season 13": ["Natus Vincere", "JiJieHao", "TYLOO", "BC.Game"],
  "DFRAG Invitational": ["FlyQuest", "NEXVOID", "Abyssal", "Alter Ego"],
};
const t1Of = (t) => Object.entries(T1).filter(([, l]) => l.includes(t)).map(([n]) => n);
const t2Of = (t) => Object.entries(T2).filter(([, l]) => l.includes(t))
  .map(([name]) => ({ name, p: 1, confirmed: true }));

process.stderr.write(`прогін, ${RUNS}…\n`);
const r = run(RUNS);
const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };

const regions = {};
for (const [reg, list] of Object.entries(OLD.regions)) {
  /* Серед тезок перераховується тільки найвищий рядок — решта лишається як
     була, інакше два рядки однієї назви побились би за один глобальний ключ. */
  const taken = new Set();
  const out = [];
  for (const old of list.slice().sort((a, b) => a.rank - b.rank)) {
    const t = old.team;
    const fresh = P0.has(t) && REGION[t] === reg && !taken.has(t) && r.places.get(t)?.length;
    if (!fresh) { out.push(old); continue; }
    taken.add(t);
    const pl = r.places.get(t), n = r.n;
    const mu = r.sum.get(t) / n;
    const sd = Math.sqrt(Math.max(0, r.sumSq.get(t) / n - mu * mu));
    const [s3, s2, s1] = r.stage.get(t);
    out.push({
      ...old, team: t, live: P0.get(t),
      globalRank: GLOBAL.get(t) ?? old.globalRank,
      mu, sd,
      p3: s3 / n, p2: s2 / n, p1: s1 / n, pQual: r.qual.get(t) / n,
      expRank: r.placeSum.get(t) / n,
      lo: qt(pl, 0.05), hi: qt(pl, 0.95), projected: Math.round(qt(pl, 0.5)),
      tier1: t1Of(t), tier2All: t2Of(t), qualBy: [], knownT2: undefined,
    });
  }
  /* Хвіст таблиці сортується за очками, а не за прогнозованим місцем.
     Нижче тих, хто в боротьбі, шанс у всіх нуль, і старе «projected» там
     випадкове — через нього Procyon на 805 опинявся вище за
     SportsBetExpert на 1171, що на сторінці читається як поламане
     сортування. */
  /* Команда може бути в моїй таблиці, але не в старому прогоні — так сталось
     із Sashi, яких HLTV перевели в Азію вже після нього. */
  for (const t of Object.keys(REGION)) {
    if (REGION[t] !== reg || taken.has(t) || !r.places.get(t)?.length) continue;
    const pl = r.places.get(t), n = r.n, mu = r.sum.get(t) / n;
    const [s3, s2, s1] = r.stage.get(t);
    out.push({
      team: t, srcTeam: t, live: P0.get(t), globalRank: GLOBAL.get(t) ?? 999,
      mu, sd: Math.sqrt(Math.max(0, r.sumSq.get(t) / n - mu * mu)),
      p3: s3 / n, p2: s2 / n, p1: s1 / n, pQual: r.qual.get(t) / n,
      expRank: r.placeSum.get(t) / n, lo: qt(pl, 0.05), hi: qt(pl, 0.95),
      projected: Math.round(qt(pl, 0.5)),
      tier1: t1Of(t), tier2All: t2Of(t), qualBy: [],
    });
  }
  /* Хвіст сортується за очками, а не за прогнозованим місцем. Нижче тих, хто
     в боротьбі, шанс у всіх нуль — але стара модель лишає там числа на кшталт
     3e-12 і 1e-47, і без округлення саме вони впорядковували хвіст: Procyon
     на 805 ставав вище за SportsBetExpert на 1171. */
  const key = (t) => Math.round((t.pQual ?? 0) * 1e4);
  regions[reg] = out
    .sort((a, b) => key(b) - key(a) ||
      (key(a) === 0 ? (b.live ?? 0) - (a.live ?? 0)
                    : (a.projected ?? 99) - (b.projected ?? 99)))
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

fs.writeFileSync("final15.json", JSON.stringify({
  ...OLD, asOf: "2026-10-30", slots: SLOTS,
  source: "hltv.org/valve-ranking/teams + /valve-ranking/teams/details",
  sourceNote:
    "Усі три регіони порахована за опублікованою формулою VRS: п'ять компонентів із " +
    "розкладів HLTV по кожній команді, межа в десять рядків у кожному компоненті, " +
    "степінь 0,23 на призових, скальпах і мережі, і компенсація H2H, який " +
    "перераховується вже від нової бази. Рядки нижче тих, хто ще в боротьбі, — з " +
    "прогону старої моделі на тій самій таблиці.",
  regions,
}));
fs.writeFileSync("sim.json", JSON.stringify({ runs: RUNS, asOf: "2026-10-30" }));

const show = (v) => (v > 99.9 ? ">99,9" : v < 0.1 ? "<0,1" : v.toFixed(1).replace(".", ","));
console.log(`прогонів ${RUNS}\n`);
for (const [reg, list] of Object.entries(regions)) {
  const name = { europe: "ЄВРОПА", americas: "АМЕРИКА", asia: "АЗІЯ" }[reg];
  console.log(`${name} — ${SLOTS[reg].total} місць`);
  list.slice(0, SLOTS[reg].total + 5).forEach((t, i) => {
    const was = OLD.regions[reg].find((o) => o.team === t.team);
    const d = was ? 100 * (t.pQual - was.pQual) : null;
    console.log(`  ${String(i + 1).padStart(3)}  ${t.team.padEnd(18)}${String(t.live).padStart(5)}` +
      `${show(100 * t.pQual).padStart(8)}%` +
      `${was ? ("  було " + (100 * was.pQual).toFixed(1) + "%").padStart(14) : ""}` +
      `${d == null ? "" : "  " + (d >= 0 ? "+" : "") + d.toFixed(1)}` +
      `${i + 1 === SLOTS[reg].total ? "   ← межа" : ""}`);
  });
  console.log();
}
