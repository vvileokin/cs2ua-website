import { P0 } from "./engine-all.mjs";

/**
 * Скільки H2H забирає назад — зміряно на чотирьох командах FiRe Last Chance
 * за 31 жовтня. Сторінка розкладу віддає компоненти на будь-яку дату, тож
 * різниця 30→31 жовтня це рівно внесок матчів того дня, по компонентах.
 *
 *   ΔH2H = Σпередач − k · Δбаза
 *
 * Це й є те, що вирішує, чи Eternal Fire «clinched»: стеля 100 Thieves сидить
 * за два очки від їхніх 1508, і знак різниці залежить від k.
 */
const gl = 0.9728, D = 817.4, A = 45.0, B = 1.56;
const E = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));
const tr = (win, lose) => A * Math.pow(1 - E(win, lose), B);

/* Очки за 30 жовтня для тих, кого немає у верхніх рядках таблиць. */
const R30 = { Fluxo: 1274, "Bounty Hunters": 1056, ShindeN: 1096,
  Procyon: 904, Hacha: 488, Wildcard: 1372, BESTIA: 1259, BARCA: 1086, Isurus: 736 };
const rate = (t) => R30[t] ?? P0.get(t);

/* [команда, очки 30-го, Δбаза, ΔH2H, [[переможець, той, хто програв], …]] */
const CASE = [
  ["BESTIA",   1259, 44, -3,  [["BESTIA", "Wildcard"], ["BESTIA", "Procyon"]]],
  ["Wildcard", 1372, 28, -36, [["Wildcard", "Hacha"], ["BESTIA", "Wildcard"]]],
  ["BARCA",    1086, 89, -18, [["BARCA", "Fluxo"], ["BARCA", "Bounty Hunters"]]],
  ["Isurus",    736, 50,  4,  [["Isurus", "ShindeN"]]],
];
console.log("команда     Δбаза   ΔH2H   Σпередач    k");
let sw = 0, sn = 0;
for (const [t, p0, dBase, dH2H, games] of CASE) {
  let sum = 0;
  for (const [w, l] of games) {
    const rw = w === t ? p0 : rate(w), rl = l === t ? p0 : rate(l);
    sum += (w === t ? 1 : -1) * tr(rw, rl);
  }
  const k = (sum - dH2H) / dBase;
  console.log("  " + t.padEnd(10) + String(dBase).padStart(5) + String(dH2H).padStart(7) +
    sum.toFixed(1).padStart(11) + k.toFixed(3).padStart(7));
  sw += k * dBase; sn += dBase;                      // вага за розміром Δбази
}
console.log(`\nсередній k, зважений за Δбазою: ${(sw / sn).toFixed(3)}`);
console.log("(у рушії стояло 0,56 — зміряно на днях, де Δбаза була мала)");
