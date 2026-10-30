import fs from "node:fs";
/**
 * validate15.mjs <кандидат> [мін-рядок-журналу]
 *
 * Зіставляє відтворений final15.mjs із тим, що журнал колись друкував із
 * справжнього файла. Три формати виводу:
 *   Read            — "NNN\tвміст"
 *   sed -n 'A,Bp'   — чисті рядки, нумерація починається з A
 *   grep -n         — "NNN:вміст"
 *
 * Порівнюємо лише ті дампи, що знято ПІСЛЯ останньої латки (28258), бо
 * ранні показують проміжні стани. Дампи до того йдуть окремим підсумком.
 */
const cand = fs.readFileSync(process.argv[2], "utf8").split("\n");
const minLine = Number(process.argv[3] ?? 0);
const dumps = JSON.parse(fs.readFileSync("restore/.dumps-final15.mjs.json", "utf8"));

const norm = s => s.replace(/\s+$/, "");
let okAll = 0, badAll = 0;
const problems = [];

for (const d of dumps) {
  if (d.line < minLine) continue;
  const lines = d.text.split("\n");
  let pairs = null;                                  // [номер, вміст]

  if (lines.some(l => /^\s*\d+\t/.test(l))) {
    pairs = lines.filter(l => /^\s*\d+\t/.test(l))
                 .map(l => [+l.match(/^\s*(\d+)\t/)[1], l.replace(/^\s*\d+\t/, "")]);
  } else if (lines.some(l => /^\s*\d+:/.test(l)) && /grep -n/.test(d.cmd)) {
    pairs = lines.filter(l => /^\s*\d+:/.test(l))
                 .map(l => [+l.match(/^\s*(\d+):/)[1], l.replace(/^\s*\d+:/, "")]);
  } else {
    const m = /sed -n '(\d+),(\d+)p'\s+(?:"\$SP\/)?final15\.mjs/.exec(d.cmd);
    if (m) {
      const from = +m[1];
      const body = lines.filter((l, i) => !(i === lines.length - 1 && !l.trim()));
      pairs = body.map((l, i) => [from + i, l]);
    }
  }
  if (!pairs || !pairs.length) continue;

  let ok = 0, bad = 0;
  const firstBad = [];
  for (const [ln, want] of pairs) {
    const got = cand[ln - 1];
    if (got === undefined) { bad++; if (firstBad.length < 3) firstBad.push([ln, want, "(немає рядка)"]); continue; }
    if (norm(got) === norm(want)) ok++;
    else { bad++; if (firstBad.length < 3) firstBad.push([ln, want, got]); }
  }
  okAll += ok; badAll += bad;
  const tag = bad === 0 ? "OK  " : "РІЗН";
  console.log(`${tag} дамп #${String(d.line).padStart(5)}  рядки ${pairs[0][0]}–${pairs.at(-1)[0]}  збіг ${ok}/${ok + bad}`);
  for (const [ln, want, got] of firstBad) {
    console.log(`      ${ln}  журнал: ${JSON.stringify(want.slice(0, 95))}`);
    console.log(`      ${String(ln).replace(/./g, " ")}  наш:    ${JSON.stringify(String(got).slice(0, 95))}`);
  }
  if (bad) problems.push(d.line);
}
console.log(`\nразом: збіг ${okAll}, розбіжність ${badAll}`);
if (problems.length) console.log(`дампи з розбіжностями: #${problems.join(" #")}`);
