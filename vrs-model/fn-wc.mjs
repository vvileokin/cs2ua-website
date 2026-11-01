import { simulate, REGION } from "./engine-all.mjs";
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 60000;
let fn = 0, hotu = 0, t100 = 0, ef = 0;
for (let i = 0; i < RUNS; i++) {
  const pts = simulate({ "100 Thieves|Wildcard": "Wildcard" });
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const pl = {}; order.forEach((t, k) => { pl[t] = k + 1; });
  if (pl["fnatic"] <= 18) fn++;
  if (pl["HOTU"] <= 18) hotu++;
  if (pl["100 Thieves"] <= 18) t100++;
  if (pl["Eternal Fire"] <= 18) ef++;
}
const pc = (x) => (100 * x / RUNS).toFixed(1) + "%";
console.log("  fnatic", pc(fn), "· HOTU", pc(hotu), "· 100 Thieves", pc(t100), "· Eternal Fire", pc(ef));
