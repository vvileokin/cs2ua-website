import fs from "node:fs";

/**
 * Скільки насправді дав Stake Ranked Episode 4.
 *
 * Питання не теоретичне: Episode 5 іде просто зараз, і від того, скільки він
 * дає, залежить, чи перестрибнуть НАВІ BIG, Inner Circle і fnatic. Episode 4 —
 * той самий організатор, той самий формат (вісім команд, подвійний виліт,
 * Bo3), той самий призовий ($100 000) і майже той самий рівень учасників.
 * Тобто це не аналогія, а той самий турнір місяцем раніше.
 *
 * Переможці матчів беруться з рахунків карт у вікітексті Liquipedia
 * (з овертаймами), очки — з двох знімків таблиці.
 */
const RAW = JSON.parse(fs.readFileSync(
  "C:/Users/LNU/AppData/Local/Temp/claude/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5/scratchpad/lp4-ep4.json",
  "utf8"))?.parse?.wikitext?.["*"] ?? "";

const NAME = { faze: "FaZe", nemiga: "Nemiga", alliance: "Alliance", astralis: "Astralis",
               big: "BIG", fnc: "fnatic", lg: "Luminosity", b8: "B8" };

/** Рахунок карти з усіма овертаймами. */
const mapScore = (blk) => {
  const n = (k) => { const m = blk.match(new RegExp("\\|" + k + "=(\\d+)")); return m ? +m[1] : 0; };
  let a = n("t1t") + n("t1ct"), b = n("t2t") + n("t2ct");
  for (let i = 1; i <= 6; i++) {
    const p = `o${i}t1`;
    if (!blk.includes(`|${p}t=`)) break;
    a += n(`o${i}t1t`) + n(`o${i}t1ct`);
    b += n(`o${i}t2t`) + n(`o${i}t2ct`);
  }
  return [a, b];
};

const matches = [];
for (const m of RAW.matchAll(/\{\{Match\b([\s\S]*?)\n\s*\}\}(?=\n)/g)) {
  const blk = m[1];
  const ops = [...blk.matchAll(/opponent\d=\{\{TeamOpponent\|([^}|]*)/g)].map((x) => x[1].trim());
  if (ops.length !== 2 || !NAME[ops[0]] || !NAME[ops[1]]) continue;
  let w = 0, l = 0;
  for (const mp of blk.matchAll(/\{\{Map\|map=([^|}\n]*)\|finished=(\w*)((?:[^{}]|\{\{[^{}]*\}\})*)\}\}/g)) {
    if (mp[2] !== "true") continue;
    const [a, b] = mapScore(mp[3]);
    if (a > b) w++; else if (b > a) l++;
  }
  if (w === l) continue;
  const date = (blk.match(/\|date=([^|\n]*)/) ?? [])[1]?.trim() ?? "";
  matches.push({ a: NAME[ops[0]], b: NAME[ops[1]], win: w > l ? NAME[ops[0]] : NAME[ops[1]],
                 score: `${w}:${l}`, date });
}

const P = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const c = s.split("|"); if (!m.has(c[1])) m.set(c[1], +c[2]);
  }
  return m;
};
const FROM = process.env.FROM ?? "vrs-live-0210.json";
const TO = process.env.TO ?? "vrs-live-0610.json";
const was = P(FROM), now = P(TO);

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));

/** Матчі, що потрапляють у вікно: за датою зі сторінки. */
const AFTER = process.env.AFTER ?? "October 2";
const inWin = matches.filter((m) => {
  const d = +(m.date.match(/October (\d+)/) ?? [])[1];
  return d >= +(AFTER.match(/\d+/) ?? [2])[0];
});

console.log(`Stake Ranked Episode 4 · $100 000 · 8 команд · подвійний виліт`);
console.log(`усі ${matches.length} серій, у вікні ${FROM} → ${TO}: ${inWin.length}\n`);
for (const m of matches)
  console.log(`  ${m.date.padEnd(26)} ${m.a.padEnd(11)} ${m.score} ${m.b.padEnd(11)} → ${m.win}` +
    (inWin.includes(m) ? "" : "   (поза вікном)"));

const teams = Object.values(NAME);
const cur = new Map(teams.map((t) => [t, was.get(t)]));
const step = new Map(teams.map((t) => [t, 0]));
const played = new Map(teams.map((t) => [t, 0]));
for (const m of inWin) {
  const w = m.win, l = m.win === m.a ? m.b : m.a;
  const e = E(cur.get(w), cur.get(l));
  const dw = WIN_K * KG * (1 - e), dl = -LOSS_K * KG * (1 - e);
  cur.set(w, cur.get(w) + dw); cur.set(l, cur.get(l) + dl);
  step.set(w, step.get(w) + dw); step.set(l, step.get(l) + dl);
  played.set(w, played.get(w) + 1); played.set(l, played.get(l) + 1);
}

console.log(`\nкоманда        старт  серій   прогноз    факт   різниця`);
const rows = teams.map((t) => ({ t, w: was.get(t), n: played.get(t),
  pred: step.get(t), act: now.get(t) - was.get(t) })).sort((a, b) => b.act - a.act);
for (const r of rows)
  console.log(`  ${r.t.padEnd(13)}${String(r.w).padStart(5)}${String(r.n).padStart(7)}` +
    `${((r.pred >= 0 ? "+" : "") + r.pred.toFixed(0)).padStart(10)}` +
    `${((r.act >= 0 ? "+" : "") + r.act).padStart(8)}` +
    `${((r.act - r.pred >= 0 ? "+" : "") + (r.act - r.pred).toFixed(0)).padStart(10)}`);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\nсередня різниця (факт мінус прогноз): ${(mean(rows.map((r) => r.act - r.pred)) >= 0 ? "+" : "") +
  mean(rows.map((r) => r.act - r.pred)).toFixed(1)} очка`);
console.log(`  у тих, хто набирав: ${mean(rows.filter((r) => r.act > 0).map((r) => r.act - r.pred)).toFixed(1)}` +
  `  ·  у тих, хто втрачав: ${mean(rows.filter((r) => r.act <= 0).map((r) => r.act - r.pred)).toFixed(1)}`);
console.log(`\nнайбільший приріст за турнір: ${Math.max(...rows.map((r) => r.act))} очка` +
  `  (мій симулятор дає переможцю Episode 5 близько +45)`);
