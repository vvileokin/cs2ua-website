import { simulate, LAST, REGION } from "./engine-all.mjs";

/** Точні цифри в кожній із чотирьох гілок останнього дня. */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 60000;
const box = {};
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const k = (LAST.mcgHotu === 1 ? "HOTU виграли Москву" : "HOTU програли фінал")
    + " · " + (LAST.fs100Tplace === 1 ? "100T виграли FiRe" : "100T не виграли");
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const b = (box[k] ??= { n: 0, ef: 0, hotu: 0, t: 0, efOut: 0, fnIn: 0 });
  b.n++; b.ef += pts.get("Eternal Fire"); b.hotu += pts.get("HOTU"); b.t += pts.get("100 Thieves");
  if (order.indexOf("Eternal Fire") + 1 > 18) b.efOut++;
  if (order.indexOf("fnatic") + 1 <= 18) b.fnIn++;
}
console.log("гілка                                        буває    EF    HOTU   100T   EF поза    fnatic у");
for (const [k, b] of Object.entries(box).sort((x, y) => y[1].n - x[1].n))
  console.log(`  ${k.padEnd(42)}${((100 * b.n) / RUNS).toFixed(0).padStart(4)}%` +
    `${(b.ef / b.n).toFixed(0).padStart(7)}${(b.hotu / b.n).toFixed(0).padStart(8)}${(b.t / b.n).toFixed(0).padStart(7)}` +
    `${((100 * b.efOut) / b.n).toFixed(0).padStart(9)}%${((100 * b.fnIn) / b.n).toFixed(0).padStart(11)}%`);
