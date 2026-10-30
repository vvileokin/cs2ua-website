import fs from "node:fs";
import path from "node:path";

/**
 * Перекласти свіжий зліпок розкладів у vrs-details/.
 *
 * Зліпок знятий зі сторінок HLTV одним проходом, тож спершу перевірка: суму
 * компонентів видно в шапці сторінки, і 400 плюс вона має дати очки команди.
 * Рядки концавних компонентів у суму НЕ складаються — там показано внесок
 * кожного, а всього компонента менше; саме через це перший парсер завищував.
 *
 * Запуск: node apply-fresh.mjs [--apply]
 */
const FRESH = JSON.parse(fs.readFileSync("fresh/details-3110.json", "utf8"));
const DIR = "vrs-details";
const byName = {};
for (const f of fs.readdirSync(DIR)) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  byName[j.n] = { file: f, old: j };
}

const rows = [];
let bad = 0;
for (const [n, v] of Object.entries(FRESH)) {
  const chk = 400 + v.c.reduce((a, b) => a + b, 0);
  const ok = Math.abs(chk - v.p) <= 1;
  if (!ok) { bad++; console.log(`  ✗ ${n}: 400+Σc=${chk}, а очок ${v.p}`); continue; }
  const e = byName[n];
  if (!e) { console.log(`  ? ${n}: нема файла, пропускаю`); continue; }
  rows.push([n, e, v]);
}

console.log(`зліпок: ${Object.keys(FRESH).length} команд, збитих ${bad}, до запису ${rows.length}\n`);
console.log("команда             очки        LAN  мережа  гроші  скальпи   H2H");
for (const [n, e, v] of rows) {
  const o = e.old, dp = v.p - o.p;
  const d = (i) => { const x = v.c[i] - o.c[i]; return x === 0 ? "·" : (x > 0 ? "+" : "") + x; };
  if (dp === 0 && v.c.every((x, i) => x === o.c[i])) continue;
  console.log(`  ${n.padEnd(18)}${String(o.p).padStart(5)}→${String(v.p).padEnd(5)}` +
    `${((dp > 0 ? "+" : "") + dp).padStart(5)}  ${d(0).padStart(5)}${d(1).padStart(7)}${d(2).padStart(7)}${d(3).padStart(8)}${d(4).padStart(6)}`);
}

if (!process.argv.includes("--apply")) { console.log("\nпробний прогін. --apply щоб записати"); process.exit(0); }

fs.mkdirSync("fresh/backup-3110", { recursive: true });
for (const [n, e, v] of rows) {
  fs.copyFileSync(path.join(DIR, e.file), path.join("fresh/backup-3110", e.file));
  fs.writeFileSync(path.join(DIR, e.file), JSON.stringify(v, null, 1) + "\n");
}
console.log(`\nзаписано ${rows.length} розкладів, старі в fresh/backup-3110/`);
