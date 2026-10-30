import fs from "node:fs";

/**
 * Чи недооцінює модель турнір першого тиру.
 *
 * Це остання перевірна гіпотеза в історії з НАВІ. Бектест на шести днях
 * виявився непридатним: розбитий по смугах рангу, він дає множники від −1,2 до
 * +8,7 без жодної структури, тобто міряє не зміщення моделі, а те, кому
 * випало грати ЛАН того тижня. Тому тут метод інший і значно чистіший —
 * симуляція вже відомої сітки.
 *
 * Для кожної з шістнадцяти команд Бухареста проганяється реальна швейцарка і
 * рахується середній приріст очок. Це число зіставляється з тим, що модель
 * закладає їм у seedFuture. Якщо модель занижує саме учасників тір-1 — це
 * видно як стала різниця в один бік по всіх шістнадцяти, а не як розкид.
 *
 * Запуск: node t1-check.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 12000);

const snap = JSON.parse(fs.readFileSync("vrs-live.json", "utf8"));
const pts = new Map(snap.rows.split(";").map((s) => {
  const [, team, p] = s.split("|");
  return [team, +p];
}));
const F = JSON.parse(fs.readFileSync("final15-2010f.json", "utf8"));
const model = new Map();
for (const list of Object.values(F.regions)) for (const t of list) if (!model.has(t.team)) model.set(t.team, t);

const SEEDS = ["Spirit", "Vitality", "FURIA", "MOUZ", "Aurora", "Legacy", "G2", "BETBOOM",
  "FUT", "Natus Vincere", "9z", "The MongolZ", "Nemiga", "Liquid", "TYLOO", "DENDELE"];
const ROUND1 = [
  ["Spirit", "BETBOOM"], ["Vitality", "9z"], ["MOUZ", "Liquid"], ["FURIA", "DENDELE"],
  ["Aurora", "The MongolZ"], ["Legacy", "Nemiga"], ["G2", "Natus Vincere"], ["FUT", "TYLOO"],
];

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (pts.get(a) - pts.get(b))) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

const total = new Map(SEEDS.map((t) => [t, 0]));

for (let i = 0; i < RUNS; i++) {
  const rec = new Map(SEEDS.map((t) => [t, { w: 0, l: 0 }]));
  const played = new Set();
  const key = (a, b) => [a, b].sort().join("|");
  const play = (a, b) => {
    const aw = Math.random() < E(a, b);
    const [win, lose] = aw ? [a, b] : [b, a];
    rec.get(win).w++; rec.get(lose).l++;
    played.add(key(a, b));
    total.set(win, total.get(win) + WIN_K * KG * (1 - E(win, lose)));
    total.set(lose, total.get(lose) + LOSS_K * -KG * E(lose, win));
  };
  for (const [a, b] of ROUND1) play(a, b);
  for (let r = 2; r <= 5; r++) {
    const alive = SEEDS.filter((t) => rec.get(t).w < 3 && rec.get(t).l < 3);
    if (alive.length < 2) break;
    const groups = new Map();
    for (const t of alive) {
      const g = `${rec.get(t).w}-${rec.get(t).l}`;
      (groups.get(g) ?? groups.set(g, []).get(g)).push(t);
    }
    for (const list of groups.values()) {
      const left = list.slice().sort(() => Math.random() - 0.5);
      while (left.length > 1) {
        const top = left.shift();
        let i2 = left.findIndex((o) => !played.has(key(top, o)));
        if (i2 === -1) i2 = 0;
        play(top, left.splice(i2, 1)[0]);
      }
    }
  }
}

console.log(`симуляція сітки Бухареста · ${RUNS} прогонів\n`);
console.log("команда            симуляція   seedFuture   різниця");
const diffs = [];
for (const t of SEEDS) {
  const sim = total.get(t) / RUNS;
  const sf = model.get(t)?.seedFuture ?? 0;
  diffs.push(sim - sf);
  console.log(`  ${t.padEnd(16)}${sim.toFixed(1).padStart(8)}${sf.toFixed(1).padStart(13)}${(sim - sf >= 0 ? "+" : "") + (sim - sf).toFixed(1)}`.padEnd(10));
}
const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
const sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length);
console.log(`\nсередня різниця ${mean >= 0 ? "+" : ""}${mean.toFixed(1)} очка, розкид ${sd.toFixed(1)}`);
console.log(mean > sd
  ? "→ зміщення в один бік: модель справді занижує учасників тір-1"
  : "→ розкид більший за зміщення: сталої недооцінки тір-1 немає");
