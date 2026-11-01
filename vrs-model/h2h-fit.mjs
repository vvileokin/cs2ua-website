import fs from "node:fs";
import { P0 } from "./engine-all.mjs";

/**
 * Передача H2H за один матч — із опублікованих даних, а не з підгонки.
 *
 * Сторінка розкладу друкує таблицю H2H по кожному матчу: суперник, подія,
 * recency і очки. Це знімає два питання відразу.
 *
 * 1. Чи важиться передача розміром події. НЕ важиться: перемога над The Huns
 *    на ЛАНі за $181 000 дала HOTU +2, а перемога над B8 на RLG Tesla Cup за
 *    $30 000 — +17. Величина залежить від суперника, не від турніру. Множник
 *    weight(ev), який я додав ранком 1 листопада, треба знімати.
 * 2. Якої форми крива. (1−ew) у першому наближенні лінійна тільки біля
 *    рівних; проти слабких вона завищує вчетверо.
 */
const OWN = { hotu: "HOTU", fnatic: "fnatic" };
const gl = 0.9728, D = 817.4;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));

const rows = [];
for (const [f, team] of Object.entries(OWN)) {
  const me = P0.get(team);
  for (const line of fs.readFileSync(`h2h/${f}.txt`, "utf8").trim().split("\n")) {
    const [, opp, rec, wl, pts] = line.split("|");
    const ro = P0.get(opp);
    if (ro == null) continue;                       // суперника немає в таблиці
    const r = Number(rec) / 100, p = Math.abs(Number(pts)) / r;
    /* Передача — це те, що дістав ПЕРЕМОЖЕЦЬ. Тож для поразки беремо
       очікування суперника. */
    const won = wl === "W";
    rows.push({ team, opp, won, x: 1 - (won ? E(me, ro) : E(ro, me)), y: p });
  }
}
const fit = (A, B) => rows.reduce((s, r) => s + (A * Math.pow(r.x, B) - r.y) ** 2, 0);
let best = { e: 1e9 };
for (let A = 10; A <= 140; A += 0.5)
  for (let B = 0.5; B <= 4; B += 0.02) {
    const e = fit(A, B);
    if (e < best.e) best = { e, A, B };
  }
const lin = (() => { let b = { e: 1e9 }; for (let A = 10; A <= 80; A += 0.2) { const e = fit(A, 1); if (e < b.e) b = { e, A }; } return b; })();
console.log(`рядків ${rows.length}`);
console.log(`лінійна A·(1−ew):        A=${lin.A.toFixed(1)}  σ ${Math.sqrt(lin.e / rows.length).toFixed(2)}`);
console.log(`степенева A·(1−ew)^B:    A=${best.A.toFixed(1)} B=${best.B.toFixed(2)}  σ ${Math.sqrt(best.e / rows.length).toFixed(2)}`);
console.log(`\nстарий рушій: 1,02·30,17·(1−ew) = 30,8·(1−ew)  → σ ${Math.sqrt(fit(30.8, 1) / rows.length).toFixed(2)}`);
console.log("\nпо кошиках (1−ew):   n   середнє факт   модель");
for (const [lo, hi] of [[0, .15], [.15, .25], [.25, .35], [.35, .45], [.45, .55], [.55, 1]]) {
  const g = rows.filter((r) => r.x >= lo && r.x < hi);
  if (!g.length) continue;
  const mf = g.reduce((s, r) => s + r.y, 0) / g.length;
  const mm = g.reduce((s, r) => s + best.A * Math.pow(r.x, best.B), 0) / g.length;
  console.log(`  ${lo.toFixed(2)}–${hi.toFixed(2)}  ${String(g.length).padStart(4)}` +
    mf.toFixed(1).padStart(14) + mm.toFixed(1).padStart(9));
}
