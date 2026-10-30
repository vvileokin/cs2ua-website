import { run, P0, REGION } from "./engine-all.mjs";

/**
 * Скільки коштує матч — із прибитим результатом, а не з фільтром за підсумком.
 *
 * Перша версія цього підрахунку фільтрувала готові прогони за тим, хто з двох
 * закінчив із більшими очками. Так відбираються не ті прогони: «HOTU вище за
 * B8» означає, що в HOTU склалась і Москва теж, і різниця між гілками виходить
 * удвічі більша за справжню. Тут матч справді прибивається в обидві сторони.
 */
const N = Number(process.argv[2] ?? 12000);
const SLOTS = { europe: 18, americas: 9, asia: 5 };
const MATCHES = [
  ["B8", "HOTU", "11:00 · півфінал Tesla Cup"],
  ["5star", "Chinggis Warriors", "05:00 · MESA, нижній фінал"],
  ["Eternal Fire", "BIG", "13:00 · Stake Ranked, нижня сітка"],
  ["Astralis", "Inner Circle", "15:30 · Stake Ranked, нижня сітка"],
  ["fnatic", "MIBR", "18:00 · Stake Ranked, фінал верхньої"],
  ["Vitality", "Natus Vincere", "13:00 · чвертьфінал Бухареста"],
  ["BETBOOM", "FURIA", "19:00 · чвертьфінал Бухареста"],
  ["FUT", "Nemiga", "10:00 · чвертьфінал Бухареста"],
];
const pct = (v) => (v > 0.999 ? ">99,9" : v < 0.001 ? "<0,1" : (100 * v).toFixed(1).replace(".", ",")) + "%";

console.log(`по ${N} прогонів на гілку · результат прибито\n`);
const rows = [];
for (const [a, b, when] of MATCHES) {
  const k = a + "|" + b;
  const A = run(N, { [k]: a }), B = run(N, { [k]: b });
  for (const t of [a, b]) {
    const pa = A.qual.get(t) / A.n, pb = B.qual.get(t) / B.n;
    rows.push({ pair: `${a} — ${b}`, when, t, pa, pb, d: Math.abs(pa - pb) });
  }
}
rows.sort((x, y) => y.d - x.d);
console.log("матч                          команда            якщо виграє перша   якщо друга    ціна");
for (const r of rows)
  console.log(`  ${r.pair.padEnd(28)}${r.t.padEnd(18)}${pct(r.pa).padStart(12)}${pct(r.pb).padStart(14)}` +
    `${((100 * r.d).toFixed(0) + " п.").padStart(9)}`);
