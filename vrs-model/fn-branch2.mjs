import { simulate, REGION, LAST } from "./engine-all.mjs";

/** Останнє європейське місце по гілках: хто виграв Москву × де стали 100 Thieves. */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 40000;
const box = new Map();
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = {}; order.forEach((t, k) => { place[t] = k + 1; });
  const key = (LAST.mcgChamp === "HOTU" ? "HOTU беруть Москву" : "1win беруть Москву") +
    " · " + (LAST.fs100Tplace === 1 ? "100T виграють FiRe" : "100T не виграють");
  if (!box.has(key)) box.set(key, { n: 0, hotu: 0, t100: 0, fn: 0, ef: 0 });
  const b = box.get(key); b.n++;
  if (place["HOTU"] <= 18) b.hotu++;
  if (place["100 Thieves"] <= 18) b.t100++;
  if (place["fnatic"] <= 18) b.fn++;
  if (place["Eternal Fire"] <= 18) b.ef++;
}
console.log("гілка                                       частка   HOTU   100T  fnatic   EF");
for (const [k, b] of [...box].sort((a, b) => b[1].n - a[1].n))
  console.log("  " + k.padEnd(42) + (100 * b.n / RUNS).toFixed(0).padStart(4) + "%" +
    [b.hotu, b.t100, b.fn, b.ef].map((v) => (100 * v / b.n).toFixed(0).padStart(6) + "%").join(""));
