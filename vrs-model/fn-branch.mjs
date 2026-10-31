import { simulate, LAST, REGION } from "./engine-all.mjs";

/** Шанс fnatic у кожній гілці — з шумом, бо саме він тут і вирішує. */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 60000;
const box = {};
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const k = (LAST.mcgHotu === 1 ? "HOTU виграли Москву" : "HOTU програли фінал")
    + " · " + (LAST.fs100Tplace === 1 ? "100T виграли FiRe" : "100T не виграли");
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const b = (box[k] ??= { n: 0, fn: 0, ef: 0, gap: 0 });
  b.n++;
  if (order.indexOf("fnatic") + 1 <= 18) b.fn++;
  if (order.indexOf("Eternal Fire") + 1 <= 18) b.ef++;
  b.gap += pts.get("HOTU") - pts.get("fnatic");
}
console.log("гілка                                        буває   fnatic проходять   EF проходять   розрив fnatic-HOTU");
for (const [k, b] of Object.entries(box).sort((x, y) => y[1].n - x[1].n))
  console.log(`  ${k.padEnd(42)}${((100 * b.n) / RUNS).toFixed(0).padStart(4)}%` +
    `${((100 * b.fn) / b.n).toFixed(0).padStart(16)}%${((100 * b.ef) / b.n).toFixed(0).padStart(14)}%` +
    `${(b.gap / b.n).toFixed(0).padStart(18)}`);
