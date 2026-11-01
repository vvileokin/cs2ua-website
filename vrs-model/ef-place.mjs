import { simulate, REGION, LAST } from "./engine-all.mjs";
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const RUNS = 40000;
const place = new Map(), byBranch = new Map();
let stage = [0, 0, 0];
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const p = order.indexOf("Eternal Fire") + 1;
  place.set(p, (place.get(p) ?? 0) + 1);
  if (p <= 6) stage[0]++; else if (p <= 12) stage[1]++; else if (p <= 18) stage[2]++;
  const k = LAST.mcgChamp === "HOTU" ? "HOTU беруть Москву" : "1win беруть Москву";
  if (!byBranch.has(k)) byBranch.set(k, new Map());
  const b = byBranch.get(k); b.set(p, (b.get(p) ?? 0) + 1);
}
console.log("місце Eternal Fire у Європі:");
for (const [p, n] of [...place].sort((a, b) => a[0] - b[0]))
  console.log(`  ${p}-те  ${(100 * n / RUNS).toFixed(1).padStart(5)}%`);
console.log(`\nстадія мейджора: Stage 3 ${(100*stage[0]/RUNS).toFixed(1)}% · Stage 2 ${(100*stage[1]/RUNS).toFixed(1)}% · Stage 1 ${(100*stage[2]/RUNS).toFixed(1)}%`);
console.log("\nпо гілках фіналу Москви:");
for (const [k, b] of byBranch) {
  const tot = [...b.values()].reduce((a, c) => a + c, 0);
  console.log(`  ${k}: ` + [...b].sort((x, y) => x[0] - y[0])
    .map(([p, n]) => `${p}-те ${(100 * n / tot).toFixed(0)}%`).join(" · "));
}
