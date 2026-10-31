import { simulate, LAST, P0, REGION } from "./engine-all.mjs";

/**
 * Що саме має статись, щоб Eternal Fire випали.
 *
 * Вони дограли, тож залежать лише від двох: HOTU у фіналі Москви і
 * 100 Thieves на FiRe. Відбираємо прогони, де EF опинились нижче
 * вісімнадцятого, і дивимось, чим вони відрізняються.
 *
 * Запуск: NOISE_SD=0 node ef-why.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 20000);
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const PL = { 1: "виграли", 2: "фінал", 4: "півфінал", 8: "чвертьфінал" };

let out = 0;
const tally = {};
const bump = (k) => { tally[k] = (tally[k] ?? 0) + 1; };
const all = {};
const bumpAll = (k) => { all[k] = (all[k] ?? 0) + 1; };

for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = order.indexOf("Eternal Fire") + 1;
  const hotu = LAST.mcgHotu === 1 ? "HOTU виграли Москву" : "HOTU програли фінал";
  const t100 = "100 Thieves — " + (PL[LAST.fs100Tplace] ?? "виліт");
  bumpAll(hotu); bumpAll(t100);
  if (place <= 18) continue;
  out++;
  bump(hotu); bump(t100);
  bump(`${hotu} + ${t100}`);
}

console.log(`прогонів ${RUNS} · Eternal Fire випали у ${out} (${((100 * out) / RUNS).toFixed(2)}%)\n`);
console.log("що було в тих прогонах:");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  const base = all[k];
  console.log(`  ${k.padEnd(46)}${String(v).padStart(5)} з ${out}` +
    (base ? `   (загалом буває ${((100 * base) / RUNS).toFixed(0)}% прогонів)` : ""));
}
