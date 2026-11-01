import fs from "node:fs";

/**
 * Модель H2H, підігнана на опублікованих HLTV очках за кожен матч.
 *
 * Алгоритм описано на самій сторінці: спершу рахуються чотири інші
 * компоненти й кожна команда дістає «ranking starting point», далі всі матчі
 * проходяться від найстарішого до найновішого, і кожен переносить очки від
 * того, хто програв, до того, хто виграв. Величина залежить від рейтингів
 * обох і від recency.
 *
 * Тут підганяється саме ця величина. Беруться тільки свіжі матчі
 * (recency ≥ 97%), бо для них теперішній рейтинг — добре наближення того,
 * яким він був під час матчу.
 *
 * Запуск: node h2h-model.mjs
 */
const R = new Map();
for (const s of fs.readFileSync("h2h/rate-3110.txt", "utf8").trim().split(";")) {
  const [t, p] = s.split("|");
  if (t && !R.has(t.trim())) R.set(t.trim(), +p);
}
const rows = [];
for (const line of fs.readFileSync("h2h/rows-0111.txt", "utf8").trim().split("\n")) {
  const [team, opp, rec, wl, pts] = line.trim().split("|");
  if (!R.has(team) || !R.has(opp)) continue;
  const won = wl === "W";
  rows.push({
    w: won ? R.get(team) : R.get(opp),
    l: won ? R.get(opp) : R.get(team),
    y: Math.abs(+pts) / (+rec / 100),
  });
}

const gl = 0.9728, D = 817.4;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));
const sse = (f) => rows.reduce((s, r) => s + (f(r) - r.y) ** 2, 0);
const sd = (f) => Math.sqrt(sse(f) / rows.length);

console.log(`матчів ${rows.length}\n`);

/* 1. степенева по (1−ew) — те, що стоїть зараз */
let best1 = { e: 1e9 };
for (let A = 20; A <= 90; A += 0.5)
  for (let B = 0.6; B <= 3.5; B += 0.01) {
    const e = sse((r) => A * Math.pow(1 - E(r.w, r.l), B));
    if (e < best1.e) best1 = { e, A, B };
  }
console.log(`A·(1−ew)^B           A=${best1.A.toFixed(1)} B=${best1.B.toFixed(2)}   σ ${sd((r) => best1.A * Math.pow(1 - E(r.w, r.l), best1.B)).toFixed(2)}`);

/* 2. лінійна по різниці рейтингів: transfer = a − b·(Rw − Rl) з підлогою */
let best2 = { e: 1e9 };
for (let a = 5; a <= 40; a += 0.25)
  for (let b = 0; b <= 0.08; b += 0.0005) {
    const e = sse((r) => Math.max(0, a - b * (r.w - r.l)));
    if (e < best2.e) best2 = { e, a, b };
  }
console.log(`max(0, a − b·Δ)      a=${best2.a.toFixed(2)} b=${best2.b.toFixed(4)} σ ${sd((r) => Math.max(0, best2.a - best2.b * (r.w - r.l))).toFixed(2)}`);

/* 3. логістична по різниці: A/(1+exp((Rw−Rl)/s)) — тобто A·(1−ew) з власним масштабом */
let best3 = { e: 1e9 };
for (let A = 20; A <= 90; A += 0.5)
  for (let s0 = 80; s0 <= 900; s0 += 5) {
    const e = sse((r) => A / (1 + Math.exp((r.w - r.l) / s0)));
    if (e < best3.e) best3 = { e, A, s: s0 };
  }
console.log(`A/(1+e^(Δ/s))        A=${best3.A.toFixed(1)} s=${best3.s}      σ ${sd((r) => best3.A / (1 + Math.exp((r.w - r.l) / best3.s))).toFixed(2)}`);

/* 4. те саме, але степінь поверх логістики */
let best4 = { e: 1e9 };
for (let A = 20; A <= 120; A += 1)
  for (let s0 = 80; s0 <= 900; s0 += 10)
    for (let B = 0.6; B <= 3; B += 0.05) {
      const e = sse((r) => A * Math.pow(1 / (1 + Math.exp((r.w - r.l) / s0)), B));
      if (e < best4.e) best4 = { e, A, s: s0, B };
    }
console.log(`A·(1/(1+e^(Δ/s)))^B  A=${best4.A} s=${best4.s} B=${best4.B.toFixed(2)} σ ${sd((r) => best4.A * Math.pow(1 / (1 + Math.exp((r.w - r.l) / best4.s)), best4.B)).toFixed(2)}`);

console.log(`\nнинішня в рушії 45,0·(1−ew)^1,56   σ ${sd((r) => 45 * Math.pow(1 - E(r.w, r.l), 1.56)).toFixed(2)}`);

const F = (r) => best4.A * Math.pow(1 / (1 + Math.exp((r.w - r.l) / best4.s)), best4.B);
console.log("\nпо різниці рейтингів:   n    факт   модель");
for (const [lo, hi] of [[-400, -100], [-100, 0], [0, 100], [100, 200], [200, 350], [350, 600], [600, 2000]]) {
  const g = rows.filter((r) => r.w - r.l >= lo && r.w - r.l < hi);
  if (!g.length) continue;
  const mf = g.reduce((s, r) => s + r.y, 0) / g.length;
  const mm = g.reduce((s, r) => s + F(r), 0) / g.length;
  console.log(`  ${String(lo).padStart(5)}…${String(hi).padStart(5)} ${String(g.length).padStart(4)}` +
    mf.toFixed(1).padStart(9) + mm.toFixed(1).padStart(9));
}
