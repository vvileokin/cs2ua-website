import { simulate, P0, REGION } from "./engine-all.mjs";

/**
 * Чи може Eternal Fire взагалі випасти з вісімнадцяти.
 *
 * Прогін із вимкненим шумом: лишаються тільки результати матчів. Якщо за
 * жодного збігу результатів вони не падають нижче вісімнадцятого — питання
 * закрите, і решта відсотка в таблиці це вже не спорт, а дрейф рейтингу.
 *
 * Запуск: NOISE_SD=0 node ef-locked.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 20000);
const EU = Object.keys(REGION).filter((t) => REGION[t] === "europe");
const WATCH = ["Eternal Fire", "HOTU", "fnatic", "100 Thieves", "B8", "JiJieHao"];

const worst = {}, best = {};
for (const t of WATCH) { worst[t] = 0; best[t] = 999; }
let efOut = 0, fnIn = 0;

for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const order = EU.slice().sort((a, b) => pts.get(b) - pts.get(a));
  const place = {};
  order.forEach((t, k) => { place[t] = k + 1; });
  for (const t of WATCH) {
    worst[t] = Math.max(worst[t], place[t]);
    best[t] = Math.min(best[t], place[t]);
  }
  if (place["Eternal Fire"] > 18) efOut++;
  if (place["fnatic"] <= 18) fnIn++;
}

console.log(`прогонів ${RUNS}, шум ${process.env.NOISE_SD ?? "за замовчуванням"}\n`);
console.log("команда          очки   найкраще   найгірше місце");
for (const t of WATCH)
  console.log(`  ${t.padEnd(14)}${String(P0.get(t)).padStart(5)}` +
    `${String(best[t]).padStart(10)}${String(worst[t]).padStart(12)}`);
console.log(`\nEternal Fire випадають у ${((100 * efOut) / RUNS).toFixed(2)}% прогонів`);
console.log(`fnatic потрапляють у ${((100 * fnIn) / RUNS).toFixed(2)}% прогонів`);
