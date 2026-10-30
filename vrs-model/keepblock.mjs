import fs from "node:fs";
/**
 * keepblock.mjs <in> <out> <ім'я файла>
 *
 * Латки на кілька файлів писані секціями `/* ---- N. ... ---- *\/ { ... }`.
 * Чужа секція кидає виняток на своєму якорі й обриває скрипт до того, як той
 * дійде до нашого файла, тому для відтворення лишаємо шапку (import, LF, rep)
 * і тільки ті секції, що згадують потрібний файл.
 */
const [, , inF, outF, keep] = process.argv;
const src = fs.readFileSync(inF, "utf8");
const lines = src.split("\n");
const marks = [];
lines.forEach((L, i) => { if (/^\/\* ---- /.test(L)) marks.push(i); });
if (!marks.length) { fs.copyFileSync(inF, outF); console.log(`  ${outF}: секцій немає, скопійовано як є`); process.exit(0); }
const head = lines.slice(0, marks[0]);
const secs = marks.map((m, k) => lines.slice(m, marks[k + 1] ?? lines.length));
const kept = secs.filter(s => s.join("\n").includes(keep));
if (!kept.length) { console.error(`!! немає секції для ${keep}`); process.exit(2); }
fs.writeFileSync(outF, head.concat(kept.flat()).join("\n"), "utf8");
console.log(`  ${outF}: лишено ${kept.length} з ${secs.length} секцій (для ${keep})`);
