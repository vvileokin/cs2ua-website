import fs from "node:fs";

/**
 * Скільки очок НАВІ ще можуть узяти в Бухаресті з рахунку 2-0.
 *
 * Питання про третю стадію впирається не у відсоток, а в арифметику: на неї
 * треба близько +190, а взяти їх нема де, крім цього турніру. Тож тут
 * проганяється саме залишок — третій тур із BETBOOM, далі швейцарка до трьох
 * перемог, далі плейоф на вісім.
 *
 * Крок калібрований (перемоги ×2,16, поразки ×1,02), але з однією поправкою:
 * він не знає призових, а в Бухаресті вони великі. Міра взята з того самого
 * вимірювання на Private Club 2 — 2,14 очка на тисячу доларів, — і це
 * найслабше місце розрахунку: підгонка робилась на суммах від 7 до 25 тисяч, а
 * тут перше місце коштує 225. Тому призові рахуються з обрізанням на
 * 25 тисячах, тобто як у тій же смузі, де їх міряли; усе вище просто не
 * додається. Виходить свідомо заниженa оцінка верху, і краще так, ніж
 * екстраполювати криву вчетверо за межі даних.
 *
 * Запуск: node navi-stage3.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 40000);
const ME = "Natus Vincere";

const snap = JSON.parse(fs.readFileSync(process.env.VRS_FILE ?? "vrs-live-2510.json", "utf8"));
const pts = new Map();
for (const s of snap.rows.split(";")) { const [, t, p] = s.split("|"); if (!pts.has(t)) pts.set(t, +p); }

/* Стан після двох турів, зі сторінки події. */
const STATE = {
  "Vitality": [2, 0], "FUT": [2, 0], "BetBoom Team": [2, 0], "Natus Vincere": [2, 0],
  "The MongolZ": [1, 1], "MOUZ": [1, 1], "Nemiga": [1, 1], "Aurora": [1, 1],
  "Spirit": [1, 1], "FURIA": [1, 1], "Liquid": [1, 1], "Legacy": [1, 1],
  "9z": [0, 2], "TYLOO": [0, 2], "G2": [0, 2], "DENDELE": [0, 2],
};
/* Пари третього туру — опубліковані, не вгадані. */
const R3 = [["The MongolZ", "MOUZ"], ["Nemiga", "Aurora"], ["Vitality", "FUT"],
            ["9z", "TYLOO"], ["Spirit", "FURIA"], ["Liquid", "Legacy"],
            ["BetBoom Team", "Natus Vincere"], ["G2", "DENDELE"]];

/* BETBOOM у таблиці звуться BetBoom Team. */
const P = (t) => pts.get(t) ?? pts.get("BETBOOM") ?? 1500;

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (P(a) - P(b))) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

/** Призові за місце, обрізані на 25 тисячах — межа, де їх міряли. */
const PRIZE = { 1: 225000, 2: 100000, 3: 68750, 4: 43750, 5: 25000, 9: 15625, 12: 9375, 15: 6250 };
const money = (place) => {
  const key = [1, 2, 3, 4, 5, 9, 12, 15].filter((k) => k <= place).pop() ?? 15;
  return Math.min(PRIZE[key], 25000) * 2.14 / 1000;
};

function once() {
  const rec = new Map(Object.entries(STATE).map(([t, [w, l]]) => [t, { w, l }]));
  const played = new Set();
  const key = (a, b) => [a, b].sort().join("|");
  let delta = 0;
  const play = (a, b) => {
    const aw = Math.random() < E(a, b);
    const [win, lose] = aw ? [a, b] : [b, a];
    rec.get(win).w++; rec.get(lose).l++; played.add(key(a, b));
    if (a === ME || b === ME) {
      const opp = a === ME ? b : a;
      delta += win === ME ? WIN_K * KG * (1 - E(ME, opp)) : LOSS_K * -KG * E(ME, opp);
    }
  };

  for (const [a, b] of R3) play(a, b);
  for (let r = 4; r <= 5; r++) {
    const alive = [...rec].filter(([, v]) => v.w < 3 && v.l < 3).map(([t]) => t);
    const groups = new Map();
    for (const t of alive) { const g = `${rec.get(t).w}-${rec.get(t).l}`; (groups.get(g) ?? groups.set(g, []).get(g)).push(t); }
    for (const list of groups.values()) {
      const left = list.slice().sort(() => Math.random() - 0.5);
      while (left.length > 1) {
        const top = left.shift();
        let i = left.findIndex((o) => !played.has(key(top, o)));
        if (i === -1) i = 0;
        play(top, left.splice(i, 1)[0]);
      }
    }
  }

  const mine = rec.get(ME);
  if (mine.w < 3) {
    /* Не вийшли: місце 9-16 за кількістю перемог. */
    return { place: mine.w === 2 ? 9 : 12, delta: delta + money(mine.w === 2 ? 9 : 12), through: false };
  }

  /* Плейоф: вісімка тих, хто вийшов, жереб випадковий. */
  let field = [...rec].filter(([, v]) => v.w >= 3).map(([t]) => t);
  if (field.length < 8) field = field.concat([...rec].filter(([t, v]) => v.w < 3 && !field.includes(t)).map(([t]) => t)).slice(0, 8);
  field = field.sort(() => Math.random() - 0.5);
  let round = field, place = 5;
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      const [a, b] = [round[i], round[i + 1]];
      const aw = Math.random() < E(a, b);
      const [win, lose] = aw ? [a, b] : [b, a];
      if (a === ME || b === ME) {
        const opp = a === ME ? b : a;
        delta += win === ME ? WIN_K * KG * (1 - E(ME, opp)) : LOSS_K * -KG * E(ME, opp);
      }
      next.push(win);
      if (lose === ME) place = round.length === 8 ? 5 : round.length === 4 ? 3 : 2;
    }
    round = next;
    if (round.length === 1 && round[0] === ME) place = 1;
  }
  return { place, delta: delta + money(place), through: true };
}

const buckets = new Map();
let sum = 0, through = 0;
for (let i = 0; i < RUNS; i++) {
  const { place, delta, through: t } = once();
  const g = buckets.get(place) ?? { n: 0, sum: 0 };
  g.n++; g.sum += delta; buckets.set(place, g);
  sum += delta; if (t) through++;
}

const NAME = { 1: "1-ше", 2: "2-ге", 3: "3-тє", 5: "5-8", 9: "9-11 (2-3)", 12: "12-14 (1-3)" };
console.log(`Бухарест із рахунку 2-0 · ${RUNS} прогонів · НАВІ ${P(ME)} очок\n`);
console.log("місце        частка   приріст   стане   треба на Stage 3 ≈ 1766");
for (const [place, g] of [...buckets].sort((a, b) => a[0] - b[0])) {
  const d = g.sum / g.n, end = Math.round(P(ME) + d);
  console.log(`  ${String(NAME[place] ?? place).padEnd(12)}${((100 * g.n) / RUNS).toFixed(1).padStart(5)}%` +
    `${(d >= 0 ? "+" : "") + d.toFixed(0).padStart(8)}${String(end).padStart(8)}   ${end >= 1766 ? "так" : end >= 1710 ? "межа" : "ні"}`);
}
console.log(`\nвихід у плейоф: ${((100 * through) / RUNS).toFixed(1)}%`);
console.log(`середній приріст: ${(sum / RUNS >= 0 ? "+" : "") + (sum / RUNS).toFixed(0)} → ${Math.round(P(ME) + sum / RUNS)} очок`);
