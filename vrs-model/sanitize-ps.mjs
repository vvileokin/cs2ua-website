import fs from "node:fs";
/**
 * sanitize-ps.mjs <in.cmd> <out.ps1>
 *
 * Лишає з кроку журналу тільки те, що справді змінює файл: читання
 * Get-Content, ланцюжок .Replace(), присвоєння тут-рядків @'...'@ і запис
 * Set-Content. Викидає запуски node/python і друк файлів виводу — вони
 * залежать від даних, яких у відтворенні немає.
 *
 * Межі тут-рядків дотримано: рядок усередині @'...'@ ніколи не фільтрується,
 * бо там може лежати код, що зовні виглядав би як запуск.
 */
const src = fs.readFileSync(process.argv[2], "utf8");
const lines = src.split(/\r?\n/);
const out = [];
let inHere = false;
const DROP = [
  /^\s*cd\s+["']/i,
  /^\s*node\s/i,
  /^\s*python\s/i,
  /^\s*VRS_FILE=/,
  /^\s*ls\s/i,
  /^\s*Get-Content\s+f\d/i,
  /^\s*Get-Content\s+\S+\.txt/i,
  /^\s*Select-String\s/i,
  /^\s*Select-Object\s/i,
  /^\s*Copy-Item\s+\S+\.(xlsx|json)/i,
  /^\s*\$v\s*=\s*Get-Content\s+verify/i,
];
for (let i = 0; i < lines.length; i++) {
  let L = lines[i];
  if (inHere) {
    out.push(L);
    if (/^'@/.test(L)) inHere = false;
    continue;
  }
  // перший рядок кроку часто склеєний: 'cd "..."; $c = Get-Content ...'
  if (i === 0 && /^\s*cd\s+["']/.test(L)) {
    const semi = L.indexOf(";");
    L = semi >= 0 ? L.slice(semi + 1).trim() : "";
    if (!L) continue;
  }
  if (DROP.some(r => r.test(L))) {
    /* node -e "…" розтягнутий на кілька рядків: викидаємо його до кінця лапок,
       інакше хвіст чужого коду лишиться в кроці. */
    if ((L.match(/"/g) ?? []).length % 2 === 1) {
      while (++i < lines.length) if ((lines[i].match(/"/g) ?? []).length % 2 === 1) break;
    }
    continue;
  }
  out.push(L);
  if (/@'\s*$/.test(L)) inHere = true;
}
fs.writeFileSync(process.argv[3], out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n", "utf8");
console.log(`${process.argv[3]}: ${out.length} рядків`);
