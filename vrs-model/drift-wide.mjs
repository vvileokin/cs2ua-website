import fs from "node:fs";
/**
 * Дрейф таблиці, зміряний широко: по всіх рядках, а не по одному турніру.
 *
 * fit-drift.mjs дав нахил на шістнадцяти командах Бухареста, і R² там 0,35 —
 * замало, щоб на ньому тримався сценарій, у якому переслідувачі отримують по
 * двадцять очок нізащо. Тут те саме міряється на всій таблиці: більшість
 * рядків у будь-яке вікно не грає взагалі, тож медіана по кошику рівня — це і
 * є дрейф у чистому вигляді, без домішки кроку.
 */
const pairs = [["vrs-live-2010.json", "vrs-live-2710.json", 7],
               ["vrs-live-2310.json", "vrs-live-2710.json", 4],
               ["vrs-live-2510.json", "vrs-live-2710.json", 2]];
const P = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const c = s.split("|"); if (!m.has(c[1])) m.set(c[1], +c[2]);
  }
  return m;
};
const med = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
for (const [f1, f2, days] of pairs) {
  const a = P(f1), b = P(f2);
  const rows = [...a].filter(([t]) => b.has(t)).map(([t, p]) => ({ t, p, d: b.get(t) - p }));
  console.log(`\n${f1} → ${f2}  (${days} доби, ${rows.length} команд)`);
  console.log("  рівень        n   медіана   середнє   зросли   за добу");
  for (const [lo, hi] of [[1700, 3000], [1550, 1700], [1450, 1550], [1350, 1450],
                          [1200, 1350], [900, 1200], [0, 900]]) {
    const g = rows.filter((r) => r.p >= lo && r.p < hi);
    if (g.length < 4) continue;
    const m = med(g.map((r) => r.d)), mean = g.reduce((s, r) => s + r.d, 0) / g.length;
    const up = g.filter((r) => r.d > 0).length / g.length;
    console.log(`  ${String(lo).padStart(4)}–${String(hi).padStart(4)}${String(g.length).padStart(6)}` +
      `${((m >= 0 ? "+" : "") + m.toFixed(1)).padStart(10)}${((mean >= 0 ? "+" : "") + mean.toFixed(1)).padStart(10)}` +
      `${(100 * up).toFixed(0).padStart(8)}%${((m / days >= 0 ? "+" : "") + (m / days).toFixed(2)).padStart(10)}`);
  }
}
