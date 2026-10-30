import { simulate, LAST, EU_TEAMS } from "./engine.mjs";

/** Те саме питання, але з того боку: де проходить межа і хто стоїть на ній. */
const RUNS = Number(process.argv[2] ?? 120000);
const SLOTS = 18, PAIR = ["fnatic", "Inner Circle"];
let n = 0, cut = 0, gap = 0;
const occupy = new Map();            // хто займає місця 15-19
const savedBy = new Map();           // кого має обійти фіналіст, щоб пройти
for (let i = 0; i < RUNS; i++) {
  const pts = simulate();
  const f = [LAST.srChamp, LAST.srSecond];
  if (!PAIR.every((t) => f.includes(t))) continue;
  n++;
  const order = EU_TEAMS.slice().sort((a, b) => pts.get(b) - pts.get(a));
  cut += pts.get(order[SLOTS - 1]);
  const second = LAST.srSecond;
  gap += pts.get(order[SLOTS - 1]) - pts.get(second);
  for (let k = 14; k < 20 && k < order.length; k++)
    occupy.set(order[k], (occupy.get(order[k]) ?? 0) + 1);
  /* Хто саме стоїть між фіналістом і межею — тобто кого треба обійти. */
  const mine = pts.get(second);
  for (const t of EU_TEAMS)
    if (t !== second && pts.get(t) > mine && pts.get(t) <= pts.get(order[SLOTS - 1]) + 60)
      savedBy.set(t, (savedBy.get(t) ?? 0) + 1);
}
console.log(`фіналів fnatic — Inner Circle: ${n}\n`);
console.log(`межа 18-го місця в Європі: ${(cut / n).toFixed(0)} очок`);
console.log(`фіналіст не дотягує в середньому ${(gap / n).toFixed(0)} очок\n`);
console.log("хто стоїть на місцях 15–19:");
for (const [t, c] of [...occupy].sort((a, b) => b[1] - a[1]).slice(0, 10))
  console.log(`  ${t.padEnd(18)}${((100 * c) / n).toFixed(0).padStart(4)}%`);
console.log("\nкого фіналісту треба обійти (хто стоїть вище нього біля межі):");
for (const [t, c] of [...savedBy].sort((a, b) => b[1] - a[1]).slice(0, 8))
  console.log(`  ${t.padEnd(18)}${((100 * c) / n).toFixed(0).padStart(4)}%`);
