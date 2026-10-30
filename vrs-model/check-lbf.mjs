import { simulate, P0 } from "./engine-all.mjs";

/**
 * Звірка кроку на одному матчі, де є з чим звіряти.
 *
 * HLTV друкує під матчем свій прогноз приросту, і це єдина цифра, яку можна
 * поставити проти нашої на тому ж матчі з тією ж базою. Ми нею не рахуємо —
 * але якщо наш крок на ній розходиться, значить розходиться він і всюди.
 *
 * Запуск: node check-lbf.mjs [прогонів]
 */
const RUNS = Number(process.argv[2] ?? 6000);
const PAIR = "MIBR|Eternal Fire";

const avg = (w) => {
  const acc = { MIBR: 0, "Eternal Fire": 0 };
  for (let i = 0; i < RUNS; i++) {
    const pts = simulate({ [PAIR]: w });
    acc.MIBR += pts.get("MIBR");
    acc["Eternal Fire"] += pts.get("Eternal Fire");
  }
  return { MIBR: acc.MIBR / RUNS, "Eternal Fire": acc["Eternal Fire"] / RUNS };
};

/* Решта турніру теж грається, тож беремо приріст одразу після цього матчу:
   різниця між гілками — це і є ціна матчу, без домішок від інших подій. */
const win = avg("MIBR"), lose = avg("Eternal Fire");

console.log(`прогонів ${RUNS} на гілку\n`);
console.log("                база   якщо виграє   якщо програє      ціна матчу");
for (const t of ["MIBR", "Eternal Fire"]) {
  const base = P0.get(t);
  const w = (t === "MIBR" ? win : lose)[t] - base;
  const l = (t === "MIBR" ? lose : win)[t] - base;
  console.log(`  ${t.padEnd(14)}${String(base).padStart(5)}` +
    `${((w >= 0 ? "+" : "") + w.toFixed(0)).padStart(13)}` +
    `${((l >= 0 ? "+" : "") + l.toFixed(0)).padStart(14)}` +
    `${(w - l).toFixed(0).padStart(16)}`);
}
console.log("\nдля порівняння, прогноз HLTV під тим самим матчем:");
console.log("  MIBR          1570          +17           -19              36");
console.log("  Eternal Fire  1464          +22           -11              33");
