import { simulate, REGION } from "./engine-all.mjs";

/**
 * Єдиний сценарій, у якому Eternal Fire випадають, прибитий намертво:
 * HOTU виграють фінал Москви і 100 Thieves виграють FiRe з трьох матчів.
 * Дивимось, де опиняються всі зацікавлені.
 *
 * Запуск: NOISE_SD=0 node ef-forced.mjs
 */
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const FORCE = {
  "HOTU|1win": "HOTU",
  "100 Thieves|Isurus": "100 Thieves",
};
/* Чвертьфінали на іншій половині сітки не прибиваємо — хто б там не виграв,
   100 Thieves мають обіграти його в півфіналі, а далі фінал. Тож беремо
   середнє по ста прогонах із прибитим першим матчем і перемогами далі. */
const RUNS = 4000;
const acc = {}, cnt = {};
let efOut = 0;
for (let i = 0; i < RUNS; i++) {
  const pts = simulate(FORCE);
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  order.forEach((t, k) => {
    if (!["Eternal Fire", "HOTU", "fnatic", "100 Thieves", "FaZe", "HEROIC"].includes(t)) return;
    acc[t] = (acc[t] ?? 0) + pts.get(t);
    cnt[t] = (cnt[t] ?? 0) + (order.indexOf(t) + 1);
  });
  if (order.indexOf("Eternal Fire") + 1 > 18) efOut++;
}
console.log("прибито: HOTU виграють фінал Москви, 100 Thieves проходять свій чвертьфінал\n");
console.log("команда          середні очки   середнє місце");
for (const t of ["FaZe", "HEROIC", "Eternal Fire", "HOTU", "fnatic", "100 Thieves"])
  console.log(`  ${t.padEnd(14)}${(acc[t] / RUNS).toFixed(0).padStart(10)}` +
    `${(cnt[t] / RUNS).toFixed(1).padStart(14)}`);
console.log(`\nза цього розкладу Eternal Fire нижче 18-го у ${((100 * efOut) / RUNS).toFixed(1)}% прогонів`);
