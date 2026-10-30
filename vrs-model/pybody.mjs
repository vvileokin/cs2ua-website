import fs from "node:fs";
/**
 * pybody.mjs <step.cmd> <out.py> [keepFile]
 *
 * Витягує тіло python-латки з heredoc `python - <<'PY' ... PY` у команді Bash.
 * Якщо задано keepFile, лишає тільки ті ділянки, що правлять цей файл: крок
 * часто чіпає ще calendar.mjs або build11.mjs, і чужий assert чи відсутній
 * файл обвалив би латку до того, як вона дійде до нашого.
 *
 * Ділянка починається рядком, що відкриває файл на читання:
 *     p = "ім'я"            (далі open(p) / io.open(p))
 *     s = io.open("ім'я", encoding=...)
 * Шапка (import) лишається завжди.
 */
const src = fs.readFileSync(process.argv[2], "utf8");
const outPath = process.argv[3];
const keep = process.argv[4];

const m = /<<\s*'PY'\n([\s\S]*?)\nPY(?:\n|$)/.exec(src);
if (!m) { console.error("!! heredoc PY не знайдено"); process.exit(2); }
let body = m[1];

if (keep) {
  const lines = body.split("\n");
  /* Рядки, що відкривають новий файл, і який саме файл це */
  const opens = [];
  lines.forEach((L, i) => {
    let f = null;
    /* `p = "ім'я"` — сам або в одному рядку з читанням: p = "f"; s = io.open(p, …) */
    let mm = /^\s*p\s*=\s*["']([^"']+)["']\s*(?:[;#].*)?$/.exec(L);
    if (mm) f = mm[1];
    if (!f) { mm = /^\s*\w+\s*=\s*(?:io\.)?open\(\s*["']([^"']+)["']/.exec(L); if (mm) f = mm[1]; }
    if (f) opens.push({ i, f });
  });
  if (!opens.length) { console.error("!! не знайдено відкриттів файлів"); process.exit(2); }
  const head = lines.slice(0, opens[0].i).filter(L => /^\s*(import|from)\s/.test(L) || !L.trim());
  const blocks = opens.map((o, k) => ({ f: o.f, lines: lines.slice(o.i, opens[k + 1]?.i ?? lines.length) }));
  const kept = blocks.filter(b => b.f === keep);
  if (!kept.length) { console.error(`!! у латці немає ділянки для ${keep} (є: ${blocks.map(b => b.f).join(", ")})`); process.exit(2); }
  body = head.concat(kept.flatMap(b => b.lines)).join("\n");
  console.log(`  ділянок ${blocks.length} (${blocks.map(b => b.f).join(", ")}) -> лишено ${kept.length} для ${keep}`);
}
fs.writeFileSync(outPath, body, "utf8");
console.log(`  ${outPath}: ${body.split("\n").length} рядків python`);
