import fs from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * Чого вартий 1win — Spirit у четвертому турі EPL.
 *
 * Звичайний swing.mjs рахує зсув очок самим рушієм Valve, додаючи в нього
 * гіпотетичний матч. Для цієї пари так не вийде: у вибірці Liquipedia останній
 * матч 1win — 8 лютого, у вікно рушія вони не потрапляють і в його таблиці їх
 * просто немає. Тому зсув рахується калібрoваним глікківським кроком з
 * calib-step.mjs — тим самим, яким у знімок заводились їхні зіграні матчі EPL.
 *
 * Далі дві гілки знімка йдуть у final15.mjs, і ймовірності перераховуються для
 * всієї Європи: місць фіксована кількість, тож підйом 1win опускає тих, хто
 * стоїть біля межі.
 *
 * Запуск: node onewin-spirit.mjs
 */

const A = "1win", B = "Spirit";

const snap = JSON.parse(fs.readFileSync("vrs-live.json", "utf8"));
const rows = snap.rows.split(";").map((s) => {
  const [r, team, points, reg] = s.split("|");
  return { rank: +r, team, points: +points, reg };
});
const plain = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (n) => rows.find((r) => plain(r.team) === plain(n));

const Q = Math.log(10) / 400, RD = 75;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const D = JSON.parse(fs.readFileSync("calibration.json", "utf8")).divisor;
const E = (r, ro) => 1 / (1 + Math.pow(10, (gl * (r - ro)) / -D));
const { a, b } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

const ra = at(A).points, rb = at(B).points;
const pa = E(ra, rb);
/* Виграна частина йде з одним коефіцієнтом, програна з іншим — так само, як у
   латці EPL. Симетрії тут немає і бути не повинно. */
const win = (me, opp) => a * KG * (1 - E(me, opp));
const loss = (me, opp) => b * -KG * E(me, opp);

const branches = {
  aWins: { [A]: win(ra, rb), [B]: loss(rb, ra) },
  bWins: { [A]: loss(ra, rb), [B]: win(rb, ra) },
};

console.log(`${A} ${at(A).points} (№${at(A).rank}) — ${B} ${at(B).points} (№${at(B).rank})`);
console.log(`наша оцінка перемоги ${A}: ${(100 * pa).toFixed(1)}%\n`);
for (const [k, d] of Object.entries(branches)) {
  console.log(`${k === "aWins" ? `${A} перемагає` : `${B} перемагає`}: ` +
    Object.entries(d).map(([t, v]) => `${t} ${v >= 0 ? "+" : ""}${v.toFixed(1)}`).join(", "));
}

function run(tag, deltas) {
  const moved = rows
    .map((r) => ({ ...r, points: Math.round(r.points + (deltas[Object.keys(deltas).find((k) => plain(k) === plain(r.team))] ?? 0)) }))
    .sort((x, y) => y.points - x.points);
  const file = `vrs-${tag}.json`;
  fs.writeFileSync(file, JSON.stringify({
    ...snap,
    rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.points}|${r.reg}`).join(";"),
  }));
  const out = `final15-${tag}.json`;
  execFileSync(process.execPath, ["final15.mjs"], {
    env: { ...process.env, SEED_SCALE: "0.35", NOISE_SCALE: "0.45", VRS_FILE: file, OUT_FILE: out },
    stdio: "ignore",
  });
  const j = JSON.parse(fs.readFileSync(out, "utf8"));
  const m = new Map();
  for (const l of Object.values(j.regions)) for (const t of l) m.set(t.team, t);
  return m;
}

const base = run("base", {});
const hiA = run("awins", branches.aWins);
const hiB = run("bwins", branches.bWins);

const pc = (x) => (100 * x).toFixed(1).padStart(5);
console.log("\nшанс на інвайт:");
console.log("команда            зараз   перемога   поразка");
for (const t of [A, B]) {
  console.log(` ${t.padEnd(16)}${pc(base.get(t).pQual)}     ${pc(hiA.get(t).pQual)}     ${pc(hiB.get(t).pQual)}`);
}
console.log("\nхто ще рухається (≥1 пп у будь-якій гілці):");
const moved = [...base.keys()]
  .filter((t) => t !== A && t !== B && hiA.has(t))
  .map((t) => ({ t, now: base.get(t).pQual, w: hiA.get(t).pQual, l: hiB.get(t).pQual }))
  .filter((r) => Math.max(Math.abs(r.w - r.now), Math.abs(r.l - r.now)) >= 0.01)
  .sort((x, y) => Math.abs(y.w - y.now) - Math.abs(x.w - x.now));
for (const r of moved.slice(0, 10)) console.log(` ${r.t.padEnd(16)}${pc(r.now)}     ${pc(r.w)}     ${pc(r.l)}`);
