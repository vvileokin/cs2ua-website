import fs from "node:fs";
import { drift } from "./drift-exact.mjs";

/**
 * Калібрування дрейфу на ДВОХ добових зсувах, не на одному.
 *
 * Зсув 30→31 жовтня сам по собі дає −11 очок на неграючу команду і гарний
 * коефіцієнт здуття 0,88%. Зсув 29→30 дає +1. Тобто щодобове здуття не
 * стала величина, і підгонка по одному дню — самообман.
 *
 * Зате воно ПРОПОРЦІЙНЕ очкам, а отже між сусідами по таблиці майже повністю
 * скасовується. Для питання «хто кого обійде» важить лише залишок після
 * спільного зсуву — його і міряємо.
 */
const FACT = {
  "29-30": { HOTU: 2, "1win": 3, "100 Thieves": 2, B8: 0, JiJieHao: 3,
    "Inner Circle": 0, FaZe: 1, HEROIC: 1, Astralis: 2, "Ninjas in Pyjamas": 2,
    "Lynn Vision": -1, "Chinggis Warriors": 1, "Virtus.pro": 1, "5star": 1 },
  "30-31": { "Eternal Fire": -11, fnatic: -10, "100 Thieves": -11, B8: -13,
    "Inner Circle": -13, FaZe: -14, HEROIC: -12, NRG: -10, "Lynn Vision": -9,
    "Chinggis Warriors": -5, FlyQuest: -8, Astralis: -14,
    "Ninjas in Pyjamas": -13, "Virtus.pro": -9 },
};
const D = new Map();
for (const f of fs.readdirSync("vrs-details")) { const r = drift(f, 1); D.set(r.team, r); }

for (const [day, fact] of Object.entries(FACT)) {
  const rows = Object.entries(fact).filter(([t]) => D.has(t))
    .map(([t, v]) => ({ t, fact: v, ...D.get(t) }));
  const mean = rows.reduce((a, r) => a + r.fact, 0) / rows.length;
  /* здуття цього дня: підгін a в fact ≈ рядковий_спад − a·(очки−400) */
  let bestA = 0, bestE = 1e9;
  for (let a = -0.004; a <= 0.02; a += 0.00002) {
    let se = 0; for (const r of rows) se += (r.d - a * (r.p - 400) - r.fact) ** 2;
    if (se < bestE) { bestE = se; bestA = a; }
  }
  const sd = Math.sqrt(bestE / rows.length);
  console.log(`${day}:  середній зсув ${mean.toFixed(1)}  ·  здуття ${(bestA * 100).toFixed(2)}%` +
    `  ·  залишок σ ${sd.toFixed(2)}`);
}

/* Спільна підгонка: одне здуття на обидва дні. */
const all = [];
for (const [day, fact] of Object.entries(FACT))
  for (const [t, v] of Object.entries(fact)) if (D.has(t)) all.push({ day, t, fact: v, ...D.get(t) });
let bestA = 0, bestE = 1e9;
for (let a = -0.004; a <= 0.02; a += 0.00002) {
  let se = 0; for (const r of all) se += (r.d - a * (r.p - 400) - r.fact) ** 2;
  if (se < bestE) { bestE = se; bestA = a; }
}
console.log(`\nразом по ${all.length} спостереженнях: здуття ${(bestA * 100).toFixed(2)}%/добу,` +
  ` залишок σ ${Math.sqrt(bestE / all.length).toFixed(2)}`);

/* А тепер те, що насправді вирішує місця: залишок ПІСЛЯ зняття спільного
   зсуву дня. Спільний зсув однаковий для всіх і порядку не змінює. */
let se = 0, n = 0;
for (const [day, fact] of Object.entries(FACT)) {
  const rows = Object.entries(fact).filter(([t]) => D.has(t)).map(([t, v]) => ({ t, fact: v, ...D.get(t) }));
  const mf = rows.reduce((a, r) => a + r.fact, 0) / rows.length;
  const md = rows.reduce((a, r) => a + r.d, 0) / rows.length;
  console.log(`\n${day} — хто рухався інакше за решту:`);
  for (const r of rows.sort((a, b) => (a.fact - mf) - (b.fact - mf))) {
    const rel = (r.fact - mf) - (r.d - md);
    se += rel * rel; n++;
    if (Math.abs(rel) >= 2) console.log(`   ${r.t.padEnd(18)}${(rel > 0 ? "+" : "") + rel.toFixed(1)}`);
  }
}
console.log(`\nвідносний дрейф: σ ${Math.sqrt(se / n).toFixed(2)} очка за добу на ${n} спостереженнях`);
