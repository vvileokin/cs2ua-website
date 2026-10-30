import fs from "node:fs";

/**
 * Шлях НАВІ на PGL Masters Bucharest — за реальною сіткою, не за жеребом.
 *
 * Жеребкування провели, пари першого туру опубліковані на HLTV, тож гадати
 * більше нема про що. Для кожного прогону рахується не лише підсумок
 * швейцарки, а й скільки очок VRS НАВІ з нього винесуть: саме очки, а не
 * «вийшли з групи», визначають інвайт.
 *
 * Очки рахуються каліброваним глікківським кроком із calib-step.mjs: перемоги
 * ×2,16, поразки ×1,02. Він заміряний проти рушія Valve на п'ятнадцяти
 * командах EPL і помиляється в середньому на 16 очок — для оцінки сценарію
 * цього досить, для публікації числа вже ні.
 *
 * Запуск: node navi-bucharest.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 40000);
const ME = "Natus Vincere";

const snap = JSON.parse(fs.readFileSync(process.env.VRS_FILE ?? "vrs-live.json", "utf8"));
const pts = new Map(snap.rows.split(";").map((s) => {
  const [, team, p] = s.split("|");
  return [team, +p];
}));

/* Склад і посів — зі сторінки події; посів тут порядковий, за рейтингом на
   дату запрошень, який HLTV показує першим числом біля команди. */
const SEEDS = ["Spirit", "Vitality", "FURIA", "MOUZ", "Aurora", "Legacy", "G2", "BETBOOM",
  "FUT", "Natus Vincere", "9z", "The MongolZ", "Nemiga", "Liquid", "TYLOO", "DENDELE"];
const seedOf = new Map(SEEDS.map((t, i) => [t, i + 1]));

/** Перший тур — опублікований жеребом, а не виведений. */
const ROUND1 = [
  ["Spirit", "BETBOOM"], ["Vitality", "9z"], ["MOUZ", "Liquid"], ["FURIA", "DENDELE"],
  ["Aurora", "The MongolZ"], ["Legacy", "Nemiga"], ["G2", "Natus Vincere"], ["FUT", "TYLOO"],
];

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (pts.get(a) - pts.get(b))) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

function runOnce() {
  const rec = new Map(SEEDS.map((t) => [t, { w: 0, l: 0, opps: [] }]));
  const played = new Set();
  const key = (a, b) => [a, b].sort().join("|");
  let delta = 0;

  const play = (a, b) => {
    const aw = Math.random() < E(a, b);
    const [win, lose] = aw ? [a, b] : [b, a];
    rec.get(win).w++; rec.get(lose).l++;
    rec.get(a).opps.push(b); rec.get(b).opps.push(a);
    played.add(key(a, b));
    if (a === ME || b === ME) {
      const opp = a === ME ? b : a;
      delta += win === ME ? WIN_K * KG * (1 - E(ME, opp)) : LOSS_K * -KG * E(ME, opp);
    }
  };

  for (const [a, b] of ROUND1) play(a, b);

  for (let round = 2; round <= 5; round++) {
    const alive = SEEDS.filter((t) => rec.get(t).w < 3 && rec.get(t).l < 3);
    if (alive.length < 2) break;
    const groups = new Map();
    for (const t of alive) {
      const g = `${rec.get(t).w}-${rec.get(t).l}`;
      (groups.get(g) ?? groups.set(g, []).get(g)).push(t);
    }
    for (const list of groups.values()) {
      /* Регламент: суперника тягнуть жеребом серед тих, з ким ще не грали. */
      const left = list.slice().sort(() => Math.random() - 0.5);
      while (left.length > 1) {
        const top = left.shift();
        let i = left.findIndex((o) => !played.has(key(top, o)));
        if (i === -1) i = 0;
        play(top, left.splice(i, 1)[0]);
      }
    }
  }
  const r = rec.get(ME);
  return { res: `${r.w}-${r.l}`, delta, through: r.w >= 3 };
}

const byRes = new Map();
let through = 0, sum = 0;
for (let i = 0; i < RUNS; i++) {
  const { res, delta, through: t } = runOnce();
  const g = byRes.get(res) ?? { n: 0, sum: 0 };
  g.n++; g.sum += delta; byRes.set(res, g);
  if (t) through++;
  sum += delta;
}

console.log(`PGL Masters Bucharest · реальна сітка · ${RUNS} прогонів`);
console.log(`перший тур НАВІ: G2 (посів ${seedOf.get("G2")}) — НАВІ (посів ${seedOf.get(ME)}), наш шанс ${(100 * E(ME, "G2")).toFixed(1)}%\n`);
console.log("результат  частка   середній приріст очок");
for (const [res, g] of [...byRes.entries()].sort((a, b) => b[1].n - a[1].n))
  console.log(`  ${res.padEnd(9)}${((100 * g.n) / RUNS).toFixed(1).padStart(5)}%   ${(g.sum / g.n >= 0 ? "+" : "") + (g.sum / g.n).toFixed(1)}`);
console.log(`\nвихід у плейоф: ${((100 * through) / RUNS).toFixed(1)}%`);
console.log(`середній приріст за турнір: ${(sum / RUNS >= 0 ? "+" : "") + (sum / RUNS).toFixed(1)} очка`);
