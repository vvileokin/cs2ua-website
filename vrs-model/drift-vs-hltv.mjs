import fs from "node:fs";
import { drift } from "./drift-exact.mjs";

/**
 * HLTV друкує власний прогноз таблиці на дату відсічення, без симуляції:
 *   /valve-ranking/teams/event/8302?simulate=false
 * Це той самий детермінований спад, який я намагаюсь порахувати сам, тільки
 * обчислений на повній базі матчів. Отже його можна взяти за факт і звірити.
 *
 * Показані лише команди в межах квот — звідси й беруться точки калібрування.
 */
const PROJ = {           // прогноз HLTV на 2 листопада
  MOUZ: 1959, Vitality: 1919, Aurora: 1858, Spirit: 1840, BETBOOM: 1785,
  Falcons: 1763, FUT: 1720, Nemiga: 1643, G2: 1613, "Natus Vincere": 1588,
  Astralis: 1567, "Ninjas in Pyjamas": 1559, PARIVISION: 1556, "1win": 1545,
  FaZe: 1536, HEROIC: 1536, "Eternal Fire": 1508, HOTU: 1484,
  FURIA: 1911, Legacy: 1659, MIBR: 1542, Liquid: 1523, "9z": 1489, M80: 1483,
  DENDELE: 1433, Imperial: 1411, Wildcard: 1362,
  "The MongolZ": 1552, "BC.Game": 1329, FlyQuest: 1301,
  "Chinggis Warriors": 1263, "Lynn Vision": 1261,
};
const rows = [];
for (const f of fs.readdirSync("vrs-details")) {
  const r = drift(f, 2);
  if (PROJ[r.team] == null) continue;
  rows.push({ ...r, fact: PROJ[r.team] - r.p });
}
const fit = (scale, defl) => rows.reduce((s, r) =>
  s + (scale * r.d - defl * Math.max(0, r.p - 400) - r.fact) ** 2, 0);
let best = { e: 1e9 };
for (let s = 0; s <= 2; s += 0.01)
  for (let dfl = -0.004; dfl <= 0.006; dfl += 0.00005) {
    const e = fit(s, dfl);
    if (e < best.e) best = { e, s, dfl };
  }
console.log(`точок: ${rows.length}`);
console.log(`мій рядковий спад без підгонки: σ ${Math.sqrt(fit(1, 0) / rows.length).toFixed(2)}`);
console.log(`нуль (жодного спаду):           σ ${Math.sqrt(fit(0, 0) / rows.length).toFixed(2)}`);
console.log(`підгін: спад ×${best.s.toFixed(2)}, здуття ${(best.dfl * 100).toFixed(3)}%` +
  ` → σ ${Math.sqrt(best.e / rows.length).toFixed(2)}\n`);
console.log("команда            сьогодні   HLTV на 2.11   мій спад×2   промах");
for (const r of rows.sort((a, b) => a.fact - b.fact)) {
  const pred = best.s * r.d - best.dfl * Math.max(0, r.p - 400);
  console.log("  " + r.team.padEnd(18) + String(r.p).padStart(6) +
    String(r.p + r.fact).padStart(14) + r.d.toFixed(1).padStart(13) +
    ((pred - r.fact) > 0 ? "+" : "") + (pred - r.fact).toFixed(1).padStart(8));
}
