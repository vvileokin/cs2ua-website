import fs from "node:fs";

/**
 * The same simulation, fast enough to be worth running.
 *
 * The first build did 275 runs a second, which puts six million at six hours.
 * Almost all of it was random-number generation: a Gumbel draw is two
 * logarithms, and a Student-t draw was summing ν squared normals per team per
 * run — two and a half thousand transcendental calls per simulation before any
 * actual modelling happened.
 *
 * Both are now precomputed. A million Gumbel values and a table of standardised
 * Student-t quantiles per distinct ν, sampled by random index. Drawing becomes
 * one integer and one array read. The distributions are identical; only the
 * cost is different.
 *
 * The rest is allocation: the old loop built an array of objects for every
 * event of every run. Everything here is a preallocated typed array, sorted in
 * place over an index buffer.
 *
 * Same model, same fields, same measured variance. The headline probabilities
 * still come from the exact convolution — this exists for the joint questions
 * convolution cannot answer, and to demonstrate that the two agree.
 */
const F = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const N = Number(process.argv[2] ?? 6_000_000);
/* Та сама шкала вартості участі, що й у згортці: інакше симуляція нараховує
   турнірам повну вагу, згортка зменшену, і два способи рахувати одну модель
   розходяться на двадцять пунктів. */
const SEED_PER_WEIGHT = 60 * F.months * Number(process.env.SEED_SCALE ?? 1);
const SPREAD = 0.6;

/* ---------- world ---------- */
const teams = [];
const index = new Map();
for (const [region, rows] of Object.entries(F.regions))
  for (const t of rows) {
    index.set(region + "|" + t.team, teams.length);
    teams.push({ region, team: t.team, base: t.live + t.form,
                 logStrength: (t.live ?? 0) / 180,
                 sd: t.sd, nu: t.nu, death: t.death });
  }
const T = teams.length;

const evMap = new Map();
for (const [region, rows] of Object.entries(F.regions))
  for (const t of rows) {
    const ti = index.get(region + "|" + t.team);
    for (const name of t.tier1 ?? []) {
      const e = evMap.get(name) ?? { name, weight: null, ent: [] };
      e.ent.push([ti, 1]); evMap.set(name, e);
    }
    for (const x of t.tier2List ?? []) {
      const e = evMap.get(x.name) ?? { name: x.name, weight: null, ent: [] };
      e.ent.push([ti, x.p]); evMap.set(x.name, e);
    }
  }
const w1 = new Map((F.tier1 ?? []).map(e => [e.name, e.weight]));
const w2 = new Map((F.tier2 ?? []).map(e => [e.name, e.weight]));
const events = [...evMap.values()].filter(e => e.ent.length >= 2).map(e => ({
  name: e.name,
  weight: e.weight ?? w1.get(e.name) ?? w2.get(e.name) ?? 0.4,
  idx: Int32Array.from(e.ent.map(x => x[0])),
  prob: Float64Array.from(e.ent.map(x => x[1])),
}));
const EV = events.length;
console.log(`команд ${T} · подій ${EV} · участей ${events.reduce((a, e) => a + e.idx.length, 0)}`);

/* ---------- random, precomputed ---------- */
let s0 = 0x9e3779b9 >>> 0;
const rnd = () => { s0 ^= s0 << 13; s0 >>>= 0; s0 ^= s0 >> 17; s0 ^= s0 << 5; s0 >>>= 0; return s0; };
const rf = () => rnd() / 4294967296;

const GN = 1 << 20, GMASK = GN - 1;
const GUM = new Float64Array(GN);
for (let i = 0; i < GN; i++) GUM[i] = -Math.log(-Math.log(Math.max(rf(), 1e-12)));

/* Standardised Student-t (unit variance) per ν, by inverse CDF over a fine grid. */
const nuKey = (nu) => Math.max(3, Math.min(30, Math.round(nu * 2) / 2));
const TN = 1 << 16, TMASK = TN - 1;
const tTables = new Map();
const normal = (() => { let spare = null;
  return () => { if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0; while (u === 0) u = rf(); while (v === 0) v = rf();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v); }; })();
for (const t of teams) {
  const k = nuKey(t.nu);
  if (tTables.has(k)) continue;
  const arr = new Float64Array(TN);
  const scale = Math.sqrt(k / (k - 2));
  for (let i = 0; i < TN; i++) {
    let c = 0;
    for (let j = 0; j < k; j++) { const z = normal(); c += z * z; }
    arr[i] = normal() / Math.sqrt(c / k) / scale;
  }
  tTables.set(k, arr);
}
console.log(`таблиці: ${GN.toLocaleString("uk-UA")} значень Гумбеля, ` +
            `${tTables.size} розподілів Стьюдента по ${TN.toLocaleString("uk-UA")}`);

const tTab = teams.map(t => tTables.get(nuKey(t.nu)));
const baseArr = Float64Array.from(teams.map(t => t.base));
const logStr = Float64Array.from(teams.map(t => t.logStrength));
const deathP = Float64Array.from(teams.map(t => t.death));

/* ---------- variance bookkeeping ---------- */
const rating = new Float64Array(T);
const alive = new Uint8Array(T);
const buf = new Int32Array(64), key = new Float64Array(64);

const pilot = 3000;
const s1 = new Float64Array(T), s2 = new Float64Array(T);
const playEvents = (out) => {
  for (let e = 0; e < EV; e++) {
    const ev = events[e], idx = ev.idx, prob = ev.prob;
    let n = 0;
    for (let i = 0; i < idx.length; i++) {
      const t = idx[i];
      if (!alive[t]) continue;
      if (prob[i] < 1 && rf() >= prob[i]) continue;
      buf[n] = t; key[n] = logStr[t] + GUM[rnd() & GMASK]; n++;
      if (n === 64) break;
    }
    if (n < 2) continue;
    for (let i = 1; i < n; i++) {           // insertion sort, descending
      const k0 = key[i], b0 = buf[i];
      let j = i - 1;
      while (j >= 0 && key[j] < k0) { key[j + 1] = key[j]; buf[j + 1] = buf[j]; j--; }
      key[j + 1] = k0; buf[j + 1] = b0;
    }
    const unit = ev.weight * SEED_PER_WEIGHT;
    for (let i = 0; i < n; i++) out[buf[i]] += unit * (1 + SPREAD * (1 - 2 * (i + 0.5) / n));
  }
};
alive.fill(1);
const tmp = new Float64Array(T);
for (let p = 0; p < pilot; p++) {
  tmp.fill(0);
  playEvents(tmp);
  for (let t = 0; t < T; t++) { s1[t] += tmp[t]; s2[t] += tmp[t] * tmp[t]; }
}
const resSd = new Float64Array(T);
let share = 0;
for (let t = 0; t < T; t++) {
  const m = s1[t] / pilot, v = Math.max(0, s2[t] / pilot - m * m);
  resSd[t] = Math.sqrt(Math.max(0, teams[t].sd ** 2 - v));
  share += v / Math.max(1, teams[t].sd ** 2);
}
console.log(`пілот ${pilot} · події пояснюють ${(share / T * 100).toFixed(1)}% дисперсії\n`);

/* ---------- run ---------- */
const regions = Object.keys(F.regions);
const regIdx = regions.map(r => Int32Array.from(teams.map((t, i) => t.region === r ? i : -1).filter(i => i >= 0)));
const regBuf = regIdx.map(a => new Int32Array(a.length));
const regKey = regIdx.map(a => new Float64Array(a.length));
const qual = new Float64Array(T), q3 = new Float64Array(T), q2 = new Float64Array(T), q1 = new Float64Array(T);
const rankSum = new Float64Array(T);

const t0 = Date.now();
for (let s = 0; s < N; s++) {
  for (let t = 0; t < T; t++) {
    alive[t] = rf() < deathP[t] ? 0 : 1;
    rating[t] = baseArr[t];
  }
  playEvents(rating);
  for (let t = 0; t < T; t++) {
    rating[t] += resSd[t] * tTab[t][rnd() & TMASK];
    if (!alive[t]) rating[t] = -1e12;
  }
  for (let r = 0; r < regions.length; r++) {
    const list = regIdx[r], b = regBuf[r], k = regKey[r], n = list.length;
    for (let i = 0; i < n; i++) { b[i] = list[i]; k[i] = rating[list[i]]; }
    for (let i = 1; i < n; i++) {
      const k0 = k[i], b0 = b[i];
      let j = i - 1;
      while (j >= 0 && k[j] < k0) { k[j + 1] = k[j]; b[j + 1] = b[j]; j--; }
      k[j + 1] = k0; b[j + 1] = b0;
    }
    const cfg = F.slots[regions[r]];
    for (let i = 0; i < n; i++) {
      const t = b[i];
      rankSum[t] += i + 1;
      if (!alive[t]) continue;
      if (i < cfg.stage3) { q3[t]++; qual[t]++; }
      else if (i < cfg.stage3 + cfg.stage2) { q2[t]++; qual[t]++; }
      else if (i < cfg.total) { q1[t]++; qual[t]++; }
    }
  }
  if ((s + 1) % 250000 === 0)
    process.stdout.write(`\r  ${((s + 1) / 1e6).toFixed(2)}M / ${(N / 1e6).toFixed(1)}M` +
      `  ·  ${Math.round((s + 1) / ((Date.now() - t0) / 1000)).toLocaleString("uk-UA")} прогонів/с`);
}
const secs = (Date.now() - t0) / 1000;
console.log(`\n\nготово: ${N.toLocaleString("uk-UA")} прогонів за ${secs.toFixed(0)} с ` +
            `(${Math.round(N / secs).toLocaleString("uk-UA")}/с)\n`);

const out = teams.map((t, i) => ({
  region: t.region, team: t.team,
  pQual: qual[i] / N, p3: q3[i] / N, p2: q2[i] / N, p1: q1[i] / N, expRank: rankSum[i] / N,
}));
fs.writeFileSync("sim.json", JSON.stringify({
  runs: N, seconds: secs, events: EV, eventVarianceShare: share / T, teams: out }, null, 1));

console.log("  " + "команда".padEnd(22) + "симуляція".padStart(11) + "згортка".padStart(10) + "різниця".padStart(9));
let worst = 0, worstName = "";
for (const t of F.regions.europe.slice(0, 22)) {
  const sim = out.find(o => o.region === "europe" && o.team === t.team);
  if (!sim) continue;
  const d = Math.abs(sim.pQual - t.pQual) * 100;
  if (d > worst) { worst = d; worstName = t.team; }
  console.log("  " + t.team.padEnd(22) + (sim.pQual * 100).toFixed(2).padStart(10) + "%" +
    (t.pQual * 100).toFixed(2).padStart(9) + "%" + d.toFixed(2).padStart(9));
}
console.log(`\nнайбільша розбіжність зі згорткою: ${worst.toFixed(2)} п.п. (${worstName})`);
