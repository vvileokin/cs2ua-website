import fs from "node:fs";
import path from "node:path";

/**
 * Скільки команда втрачає за добу, якщо не грає.
 *
 * Рушій досі вважав цей рух випадковим шумом із нулем у середньому. Він не
 * випадковий: кожен рядок розкладу має свою recency, і коли вона падає, падає
 * і компонент. Це рахується точно з тих самих даних, що й усе інше.
 *
 *   recency(d) = 1 при d ≤ 30, далі max(0, 1 − (d−30)/152)
 *
 * Рядки у vrs-details збережені вже помноженими на recency, тож щоб зсунути
 * день уперед, кожен треба поділити на його теперішню recency й помножити на
 * нову. Дата рядка відома — вона в самому рядку.
 *
 * Запуск: node drift-exact.mjs [днів]   (звірка з фактом 30→31 жовтня)
 */
const DAYS = Number(process.argv[2] ?? 1);
const BASE = new Date("2026-10-31T00:00:00Z");      // дата зрізу
const K = { O: 19.4, C: 244, N: 100 }, POW = 0.23;
const comp = (raw, k) => k * Math.pow(Math.max(raw, 0), POW);
const rawOf = (c, k) => Math.pow(Math.max(c, 1) / k, 1 / POW);
const rec = (d) => (d <= 30 ? 1 : Math.max(0, 1 - (d - 30) / 152));

const parse = (s) => {
  const [dt, pts] = s.split("|");
  const [dd, mm, yy] = dt.split("/").map(Number);
  const when = Date.UTC(2000 + yy, mm - 1, dd);
  return { age: Math.round((BASE - when) / 86400000), pts: Number(pts) };
};

export function drift(file, days = DAYS) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", file), "utf8"));
  const shift = (kk, idx, k) => {
    const rows = (j[kk] ?? []).map(parse);
    if (!rows.length) return 0;
    /* масштаб: сума «сирих» значень мусить дати опублікований компонент */
    const sumShown = rows.reduce((a, r) => a + r.pts, 0);
    const sumRaw = rawOf(j.c[idx], k), scale = sumRaw / (sumShown || 1);
    let now = 0, then = 0;
    for (const r of rows) {
      const r0 = rec(r.age), r1 = rec(r.age + days);
      const base = r0 > 0 ? (r.pts * scale) / r0 : 0;
      now += base * r0; then += base * r1;
    }
    return comp(then, k) - comp(now, k);
  };
  /* LAN wins — лінійний, по 47·recency на кожні з десяти найсвіжіших */
  const lan = (j.L ?? []).map(parse);
  let dLan = 0;
  for (const r of lan) {
    const r0 = rec(r.age), r1 = rec(r.age + days);
    const full = r0 > 0 ? r.pts / r0 : 0;
    dLan += full * (r1 - r0);
  }
  const d = dLan + shift("N", 1, K.N) + shift("O", 2, K.O) + shift("C", 3, K.C);
  return { team: j.n, p: j.p, dLan, d };
}

if (process.argv[1] && process.argv[1].includes("drift-exact")) {
  /* Факт: зміна очок у таблиці 30→31 жовтня для тих, хто 31-го не грав. */
  const FACT = {
    "Eternal Fire": -11, fnatic: -10, "100 Thieves": -11, B8: -13,
    "Inner Circle": -13, FaZe: -14, HEROIC: -12, NRG: -10,
    "Lynn Vision": -9, "Chinggis Warriors": -5, FlyQuest: -8,
    Astralis: -14, "Ninjas in Pyjamas": -13, "Virtus.pro": -9,
  };
  const out = [];
  for (const f of fs.readdirSync("vrs-details")) out.push(drift(f, 1));
  console.log("команда           очки   прогноз   факт 30→31   промах");
  let n = 0, se = 0;
  for (const r of out.sort((a, b) => b.p - a.p)) {
    const fact = FACT[r.team];
    const line = `  ${r.team.padEnd(18)}${String(r.p).padStart(5)}${r.d.toFixed(1).padStart(9)}`;
    if (fact == null) { console.log(line); continue; }
    const miss = r.d - fact; n++; se += miss * miss;
    console.log(`${line}${String(fact).padStart(13)}${(miss > 0 ? "+" : "") + miss.toFixed(1)}`.padStart(0));
  }
  console.log(`\nпо ${n} неграючих командах: середньоквадратичний промах ${Math.sqrt(se / n).toFixed(1)} очка`);
}
