import fs from "node:fs";
import { simulate, EU_TEAMS, P0 } from "./engine.mjs";

/**
 * Збирає final15.json для заливки: Європа — новим рушієм, Америка й Азія —
 * з останнього прогону старої моделі.
 *
 * Чому не все одразу новим. Новий рушій стоїть на розкладах очок зі сторінок
 * HLTV, а я зібрав їх для дев'ятнадцяти європейських команд — тих, що в
 * боротьбі. Для Америки й Азії розкладів немає, і вигадувати їх, щоб таблиця
 * виглядала однорідною, було б гірше за чесну суміш: там стара модель працює
 * так само, як працювала, і її числа не стали помилковими від того, що для
 * Європи з'явились кращі.
 *
 * Що саме змінюється в Європі. Стара модель рахувала приріст одним
 * каліброваним кроком, однаковим для всіх. Новий знає будову рейтингу:
 * «LAN wins» вміщує рівно десять перемог, решта компонентів стиснута степенем
 * 0,23, і тому та сама перемога коштує НАВІ сорок три очки, а Eternal Fire
 * нуль. Перевірка: на сценарії «НАВІ програють Spirit і віддають два матчі
 * технічно» старий рушій давав 61%, новий 25,5% — і друге число збігається з
 * незалежною моделлю Mischief (25%).
 *
 * Запуск: node publish-2810.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 60000);
/* База — прогін старої моделі на СЬОГОДНІШНІЙ таблиці, а не вчорашній. Доки
   тут стояв учорашній файл, Америка й Азія віддавали ті самі числа, що
   напередодні, і сторінка показувала рух лише в Європі — не тому, що там
   нічого не сталось, а тому, що їх ніхто не перерахував. */
const OLD = JSON.parse(fs.readFileSync(process.env.BASE ?? "final15-2810-old.json", "utf8"));
const SLOTS = OLD.slots.europe;            // {total:18, stage3:6, stage2:6, stage1:6}

/* ---- прогін ---- */
const pts = new Map(EU_TEAMS.map((t) => [t, []]));
const places = new Map(EU_TEAMS.map((t) => [t, []]));
for (let i = 0; i < RUNS; i++) {
  const p = simulate();
  const order = EU_TEAMS.slice().sort((a, b) => p.get(b) - p.get(a));
  order.forEach((t, k) => { pts.get(t).push(p.get(t)); places.get(t).push(k + 1); });
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
const share = (a, f) => a.reduce((s, x) => s + (f(x) ? 1 : 0), 0) / a.length;

/**
 * Стадія — це місце, а не окреме число: верх Європи заходить одразу в третю,
 * низ — у першу. Тому три ймовірності беруться з розподілу місць, і в сумі
 * вони дають рівно шанс поїхати взагалі.
 */
const stageP = (pl) => ({
  p3: share(pl, (x) => x <= SLOTS.stage3),
  p2: share(pl, (x) => x > SLOTS.stage3 && x <= SLOTS.stage3 + SLOTS.stage2),
  p1: share(pl, (x) => x > SLOTS.stage3 + SLOTS.stage2 && x <= SLOTS.total),
});

/* ---- які турніри в кого попереду ---- */
const T1 = { "PGL Masters Bucharest": ["Vitality", "MOUZ", "Spirit", "Aurora", "BETBOOM", "FUT", "Natus Vincere", "Nemiga"] };
const T2 = {
  "Stake Ranked Episode 5": ["BIG", "Inner Circle", "fnatic", "Astralis", "magic", "Nemesis", "Eternal Fire"],
  "RLG Tesla Cup 2026": ["B8", "K27", "FaZe", "HOTU", "GamerLegion", "Luminosity", "Envy"],
  "Moscow Cyber Games": ["1win", "HOTU"],
  "FiReSPORTS Last Chance": ["100 Thieves"],
  "Circuito Retake Season 13": ["Natus Vincere", "JiJieHao"],
};
const t1Of = (t) => Object.entries(T1).filter(([, l]) => l.includes(t)).map(([n]) => n);
const t2Of = (t) => Object.entries(T2).filter(([, l]) => l.includes(t))
  .map(([name]) => ({ name, p: 1, confirmed: true }));

/* ---- збірка європейського списку ---- */
/* Серед тезок беремо найвищий рядок — той самий, що потім піде у fresh.
   Простий `new Map(list.map(...))` лишає ОСТАННІЙ збіг, тож GamerLegion
   успадкувала глобальне місце своєї однойменної академії, і в базі два рядки
   побились за один первинний ключ. */
const byName = new Map();
for (const t of OLD.regions.europe.slice().sort((a, b) => a.rank - b.rank))
  if (!byName.has(t.team)) byName.set(t.team, t);
const fresh = EU_TEAMS.map((t) => {
  const pl = places.get(t), pp = pts.get(t);
  const s = stageP(pl);
  const old = byName.get(t) ?? {};
  return {
    ...old,
    team: t, srcTeam: old.srcTeam ?? t,
    live: P0.get(t),
    mu: mean(pp), sd: sd(pp),
    ...s,
    pQual: s.p3 + s.p2 + s.p1,
    expRank: mean(pl),
    lo: qt(pl, 0.05), hi: qt(pl, 0.95),
    projected: Math.round(qt(pl, 0.5)),
    tier1: t1Of(t), tier2All: t2Of(t), qualBy: [],
    knownT2: undefined,
  };
});

/* Решта Європи — нижче 35-го місця, де шанс і в старій моделі нуль. Рядки
   лишаються як були: перераховувати їх новим рушієм нема з чого, бо розкладів
   для них я не збирав, а викидати зі сторінки — означає сховати половину
   таблиці заради однорідності. */
/* Фільтрувати просто за назвою не можна: HLTV веде по дві GamerLegion, дві
   INFINITE і дві INOX Division — тезки з різними складами за сотню місць одна
   від одної. Назва збігається, тож такий фільтр викидав і ту, якої в новому
   списку нема. Викидаємо тільки найвищий рядок кожної назви — саме він і є
   перерахований. */
const taken = new Set();
const rest = OLD.regions.europe
  .slice().sort((a, b) => a.rank - b.rank)
  .filter((t) => {
    if (!EU_TEAMS.includes(t.team) || taken.has(t.team)) return true;
    taken.add(t.team);
    return false;
  });
const europe = [...fresh, ...rest]
  .sort((a, b) => (b.pQual ?? 0) - (a.pQual ?? 0) || (a.projected ?? 99) - (b.projected ?? 99))
  .map((t, i) => ({ ...t, rank: i + 1 }));

const out = {
  ...OLD,
  asOf: "2026-10-28",
  source: "hltv.org/valve-ranking/teams + /valve-ranking/teams/details",
  sourceNote:
    "Європа порахована за опублікованою формулою VRS: п'ять компонентів із розкладів HLTV, " +
    "межа в десять рядків у кожному, степінь 0,23 на призових і скальпах. Америка й Азія — " +
    "перераховані старою моделлю на тій самій таблиці, бо розкладів VRS для них ще не зібрано.",
  regions: { ...OLD.regions, europe },
};
fs.writeFileSync("final15.json", JSON.stringify(out));
fs.writeFileSync("sim.json", JSON.stringify({ runs: RUNS, asOf: "2026-10-28" }));

console.log(`прогонів ${RUNS} · Європа перерахована (${fresh.length} команд), решта зі старого прогону\n`);
console.log("місце  команда             очки    μ    σ   прохід   було");
europe.slice(0, 24).forEach((t, i) => {
  const was = byName.get(t.team);
  const d = was ? 100 * (t.pQual - was.pQual) : null;
  console.log(`  ${String(i + 1).padStart(2)}   ${t.team.padEnd(18)}${String(t.live).padStart(5)}` +
    `${t.mu.toFixed(0).padStart(6)}${t.sd.toFixed(0).padStart(5)}` +
    `${(100 * t.pQual).toFixed(1).padStart(8)}%` +
    `${was ? ((100 * was.pQual).toFixed(1) + "%").padStart(9) : "".padStart(9)}` +
    `${d == null ? "" : "  " + (d >= 0 ? "+" : "") + d.toFixed(1)}`);
});
