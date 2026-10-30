import fs from "node:fs";

/**
 * Чи рухається смуга 1440–1480 інакше, ніж смуга 1490–1530.
 *
 * Це єдине, що насправді важить для сценарію. Фонові рухи таблиці бувають
 * великі — у вікні 2–6 жовтня команди на 1350–1600, які нічого не грали,
 * узяли медіанних +26, тоді як уся таблиця +3. Але НАВІ в сценарії стоять на
 * 1499, а переслідувачі на 1437–1480: якщо фон піднімає обох однаково, він
 * скорочується і відповідь від нього не залежить. Якщо ні — це перекіс, і він
 * з'їдає всю точність, бо межа 18-го місця проходить за двадцять очок.
 *
 * Міряється різниця медіан між двома вузькими смугами по всіх наявних вікнах.
 */
const SNAPS = ["vrs-live-0210.json", "vrs-live-0310.json", "vrs-live-0510.json",
               "vrs-live-0610.json", "vrs-live-0710.json", "vrs-live-0810.json",
               "vrs-live-1210.json", "vrs-live-1410.json", "vrs-live-2010.json",
               "vrs-live-2310.json", "vrs-live-2410.json", "vrs-live-2510.json",
               "vrs-live-2610.json", "vrs-live-2710.json"];
const P = (f) => {
  const m = new Map();
  for (const s of JSON.parse(fs.readFileSync(f, "utf8")).rows.split(";")) {
    const c = s.split("|"); if (!m.has(c[1])) m.set(c[1], +c[2]);
  }
  return m;
};
const med = (x) => {
  const s = x.slice().sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const LOW = [1420, 1485], HIGH = [1485, 1545];

console.log("смуга переслідувачів 1420–1485 проти смуги НАВІ 1485–1545");
console.log("вікно                     n низ  n верх   медіана низ   медіана верх   перекіс");
const tilts = [];
for (let i = 0; i + 1 < SNAPS.length; i++) {
  const a = P(SNAPS[i]), b = P(SNAPS[i + 1]);
  const rows = [...a].filter(([t]) => b.has(t)).map(([t, p]) => ({ t, p, d: b.get(t) - p }));
  const lo = rows.filter((r) => r.p >= LOW[0] && r.p < LOW[1]).map((r) => r.d);
  const hi = rows.filter((r) => r.p >= HIGH[0] && r.p < HIGH[1]).map((r) => r.d);
  if (lo.length < 4 || hi.length < 4) continue;
  const t = med(lo) - med(hi);
  tilts.push(t);
  const nm = (s) => s.replace("vrs-live-", "").replace(".json", "");
  console.log(`  ${(nm(SNAPS[i]) + " → " + nm(SNAPS[i + 1])).padEnd(24)}` +
    `${String(lo.length).padStart(6)}${String(hi.length).padStart(8)}` +
    `${((med(lo) >= 0 ? "+" : "") + med(lo)).padStart(14)}${((med(hi) >= 0 ? "+" : "") + med(hi)).padStart(15)}` +
    `${((t >= 0 ? "+" : "") + t.toFixed(1)).padStart(10)}`);
}
const mean = tilts.reduce((a, b) => a + b, 0) / tilts.length;
const sd = Math.sqrt(tilts.reduce((s, x) => s + (x - mean) ** 2, 0) / (tilts.length - 1));
console.log(`\nперекіс за вікно: середній ${(mean >= 0 ? "+" : "") + mean.toFixed(1)}, розкид ${sd.toFixed(1)} очка`);
console.log(`накопичений за 5 днів (вікна тут по 1–7 діб, у середньому ~2): ` +
  `${(mean * 2.5 >= 0 ? "+" : "") + (mean * 2.5).toFixed(0)} ± ${(sd * Math.sqrt(2.5)).toFixed(0)} очка`);
console.log(`\nДодатний перекіс — переслідувачі ростуть швидше за смугу НАВІ, тобто проти нас.`);
