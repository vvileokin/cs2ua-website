import fs from "node:fs";

/**
 * Чи правильний масштаб кроку — заміряно на справжніх добових зсувах.
 *
 * Питання, від якого залежить усе інше: наскільки можна вірити тому, що
 * pending.mjs донараховує за вже зіграні, але ще не внесені в таблицю матчі.
 * Перевірка не вимагає жодних припущень — HLTV тримає таблицю за кожну дату,
 * тож беремо 18 і 19 жовтня, прикладаємо крок до серій 19-го і зіставляємо
 * з тим, що насправді сталося.
 *
 * Окремо виводиться, чи залежить точність від розміру події: 1win Private
 * Club — сто тисяч, DraculaN — тридцять пʼять. Якщо дрібнішу подію треба
 * зважувати вниз, це видно як стало відʼємний залишок у переможців.
 *
 * Запуск: node verify-step.mjs
 */

const T = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const [t, p] = s.split("|");
    if (!m.has(t)) m.set(t, +p);
  }
  return m;
};
const was = T("vrs-table-1810.json"), now = T("vrs-table-1910.json");

/* Серії, зіграні 19 жовтня. Переможець першим, подія третя. Окремі карти
   всередині Bo3 не рахуються — VRS бере серію. */
const PLAYED = [
  ["PARIVISION", "magic", "1win PC2"], ["fnatic", "Liquid", "1win PC2"],
  ["BIG", "PRIVATE", "1win PC2"], ["The MongolZ", "Alliance", "1win PC2"],
  ["INFINITE", "Insiders", "DraculaN 7"], ["BASEMENT BOYS", "aimclub", "DraculaN 7"],
  ["BC.Game", "Drama", "DraculaN 7"], ["WBT", "Nexus", "DraculaN 7"],
  ["Iberian Soul", "HYPERSPIRIT", "DraculaN 7"], ["Sashi", "MOUZ NXT", "DraculaN 7"],
  ["SAW", "Bayankhongor", "DraculaN 7"], ["ASTRAL", "Leo", "DraculaN 7"],
  ["INFINITE", "BASEMENT BOYS", "DraculaN 7"], ["BC.Game", "WBT", "DraculaN 7"],
  ["Iberian Soul", "Sashi", "DraculaN 7"], ["SAW", "ASTRAL", "DraculaN 7"],
  ["aimclub", "Insiders", "DraculaN 7"], ["Nexus", "Drama", "DraculaN 7"],
  ["HYPERSPIRIT", "MOUZ NXT", "DraculaN 7"], ["Leo", "Bayankhongor", "DraculaN 7"],
  ["BASEMENT BOYS", "aimclub", "DraculaN 7"], ["HYPERSPIRIT", "Sashi", "DraculaN 7"],
  ["ASTRAL", "Leo", "DraculaN 7"],
];

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const E = (pa, pb) => 1 / (1 + Math.pow(10, (gl * (pa - pb)) / -D));
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));

const pred = new Map(), ev = new Map(), side = new Map();
const skip = [];
for (const [w, l, e] of PLAYED) {
  if (!was.has(w) || !was.has(l) || !now.has(w) || !now.has(l)) { skip.push(`${w} / ${l}`); continue; }
  pred.set(w, (pred.get(w) ?? 0) + WIN_K * KG * (1 - E(was.get(w), was.get(l))));
  pred.set(l, (pred.get(l) ?? 0) + LOSS_K * -KG * E(was.get(l), was.get(w)));
  ev.set(w, e); ev.set(l, e);
  side.set(w, (side.get(w) ?? 0) + 1); side.set(l, (side.get(l) ?? 0) - 1);
}
if (skip.length) console.log("поза однією з таблиць, не рахуємо:", skip.join(", "), "\n");

console.log("18 → 19 жовтня · крок без жодного зважування за розміром події\n");
console.log("команда             подія         18.10  прогноз   факт  залишок");
const byEv = new Map();
for (const [t, p] of [...pred].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))) {
  const act = now.get(t) - was.get(t), res = act - p;
  const k = `${ev.get(t)} · ${side.get(t) > 0 ? "вигравали" : side.get(t) < 0 ? "програвали" : "порівну"}`;
  const g = byEv.get(k) ?? { n: 0, res: 0, abs: 0 };
  g.n++; g.res += res; g.abs += Math.abs(res); byEv.set(k, g);
  console.log(`  ${t.padEnd(18)}${ev.get(t).padEnd(14)}${String(was.get(t)).padStart(5)}` +
    `${((p >= 0 ? "+" : "") + p.toFixed(1)).padStart(9)}${((act >= 0 ? "+" : "") + act).padStart(7)}` +
    `${((res >= 0 ? "+" : "") + res.toFixed(1)).padStart(9)}`);
}
console.log("\nгрупа                            команд   середній залишок   за модулем");
for (const [k, g] of [...byEv].sort())
  console.log(`  ${k.padEnd(32)}${String(g.n).padStart(4)}${((g.res / g.n >= 0 ? "+" : "") + (g.res / g.n).toFixed(1)).padStart(18)}${(g.abs / g.n).toFixed(1).padStart(14)}`);
console.log("\nЯкщо дрібнішу подію треба зважувати вниз, її залишок має бути стало");
console.log("відʼємним у переможців. Інакше підстав множити крок на розмір");
console.log("призового фонду немає.");
