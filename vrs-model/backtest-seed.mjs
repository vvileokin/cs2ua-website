import fs from "node:fs";

/**
 * Чи вгадує модель розмір майбутнього приросту очок.
 *
 * `seedFuture` — це скільки очок команда, за моделлю, ще набере до відсічення.
 * Перевірити його можна без жодних чужих прогнозів: узяти прогін за 14 жовтня,
 * подивитись, що він обіцяв, і зіставити з тим, що сталося до 20-го.
 *
 * Шість днів — не весь залишок. На 14 жовтня до відсічення лишалось дев'ятнадцять,
 * тож за правильного калібрування реальний приріст мав би скласти приблизно
 * 6/19 ≈ 0,32 від обіцяного. Якщо нахил регресії помітно більший — модель
 * занижує майбутнє, і рівно на стільки разів.
 *
 * Беремо лише тих, хто справді грав: у кого приріст нульовий, той нічого не
 * каже про калібрування, зате тягне нахил до нуля.
 *
 * Запуск: node backtest-seed.mjs
 */

const OLD = JSON.parse(fs.readFileSync("final15-1410b.json", "utf8"));
const snapOld = JSON.parse(fs.readFileSync("vrs-live-1410b.json", "utf8"));
const snapNew = JSON.parse(fs.readFileSync("vrs-live-2010.json", "utf8"));

const pts = (snap) => {
  const seen = new Map(), m = new Map();
  for (const s of snap.rows.split(";")) {
    const [, team, p] = s.split("|");
    const n = (seen.get(team) ?? 0) + 1; seen.set(team, n);
    if (n === 1) m.set(team, +p);          // перша поява — основний склад
  }
  return m;
};
const was = pts(snapOld), now = pts(snapNew);

const ELAPSED = 6, WINDOW = 19;           // 14 → 20 жовтня, і 14 жовтня → 2 листопада
const expectedShare = ELAPSED / WINDOW;

const rows = [];
for (const [reg, list] of Object.entries(OLD.regions)) {
  for (const t of list) {
    if (!was.has(t.team) || !now.has(t.team)) continue;
    const actual = now.get(t.team) - was.get(t.team);
    const promised = t.seedFuture ?? 0;
    if (Math.abs(actual) < 1) continue;    // не грали
    if (Math.abs(promised) < 0.5) continue;
    rows.push({ team: t.team, reg, promised, actual });
  }
}

/* Нахил через початок координат: скільки реального приросту припало на
   одиницю обіцяного. */
const num = rows.reduce((s, r) => s + r.promised * r.actual, 0);
const den = rows.reduce((s, r) => s + r.promised * r.promised, 0);
const slope = num / den;

console.log(`команд у вибірці: ${rows.length}`);
console.log(`очікуваний нахил за правильного калібрування: ${expectedShare.toFixed(2)}`);
console.log(`фактичний нахил: ${slope.toFixed(2)}`);
console.log(`отже seedFuture занижений у ${(slope / expectedShare).toFixed(2)} раза`);
console.log(`поточний SEED_SCALE 0.35 → рекомендований ${(0.35 * slope / expectedShare).toFixed(2)}`);

console.log("\nнайбільші відхилення:");
rows.map((r) => ({ ...r, gap: r.actual - r.promised * expectedShare }))
  .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 10)
  .forEach((r) => console.log(
    `  ${r.team.padEnd(20)}${r.reg.padEnd(9)}обіцяно ${(r.promised * expectedShare).toFixed(1).padStart(6)}` +
    `  факт ${r.actual.toFixed(0).padStart(5)}`));
