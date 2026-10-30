import fs from "node:fs";
/**
 * apply-edit.mjs <цільовий файл> <old-файл> <new-файл> [replace_all]
 *
 * Відтворює крок інструмента Edit: точна підстановка з перевіркою якоря.
 * Edit вимагав унікальності old_string, тому тут теж: кілька влучень —
 * це розбіжність із журналом, і про неї треба сказати, а не вибрати перше.
 */
const [, , file, oldF, newF, all] = process.argv;
const s = fs.readFileSync(file, "utf8");
const o = fs.readFileSync(oldF, "utf8");
const nw = fs.readFileSync(newF, "utf8");
const cnt = s.split(o).length - 1;
if (cnt === 0) { console.log(`  ** ЯКІР НЕ ЗНАЙДЕНО :: ${JSON.stringify(o.slice(0, 110))}`); process.exit(1); }
if (cnt > 1 && all !== "true") { console.log(`  ** ЯКІР НЕ УНІКАЛЬНИЙ (${cnt}x) :: ${JSON.stringify(o.slice(0, 80))}`); process.exit(1); }
fs.writeFileSync(file, all === "true" ? s.split(o).join(nw) : s.replace(o, nw), "utf8");
console.log(`  Edit ok (${cnt}x, ${o.length} -> ${nw.length} симв.)`);
