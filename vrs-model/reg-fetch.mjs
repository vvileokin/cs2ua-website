import fs from "node:fs";
import { execSync } from "node:child_process";

/**
 * Тягне реєстраційні таблиці турнірів із колонки «Registered teams» у дентена.
 *
 * Google Sheets віддає .xlsx за /export?format=xlsx — гіперпосилання в ньому
 * виживають. Форми (viewform) відповідей не віддають: їхні відповіді дентен
 * тримає окремими вкладками у власній книзі, тож вони тут не потрібні.
 */
const rows = JSON.parse(fs.readFileSync(process.env.DENT ?? "dent-tournaments-0210.json", "utf8"));
const jobs = [];
for (const r of rows) {
  const c = r.cells;
  if (!c || !c[1] || !c[1].v) continue;
  const name = c[1].v.trim();
  if (/RANKING CUT-OFF/i.test(name)) continue;
  const link = (c[9] && c[9].link) || (c[8] && c[8].link) || null;
  if (!link) continue;
  const m = link.match(/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/);
  jobs.push({ row: r.i, name, link, kind: m ? "sheet" : /viewform/.test(link) ? "form" : "other", id: m ? m[1] : null, dates: c[2]?.v ?? "", prize: c[3]?.v ?? "", weight: c[10]?.v ?? "" });
}
fs.writeFileSync("reg-jobs.json", JSON.stringify(jobs, null, 1));
/* Чистимо теку перед заливкою. Файли звуться номером рядка в календарі
   дентена, а календар живий: дограні турніри він із «Tournaments» прибирає, і
   номери за ними зсуваються. Старий файл, що лишився на номері, який тепер
   належить іншому турніру, тихо приписує йому чужий список — так EPIC.LAN 49
   одного разу дістав склад Tesla Cup, а Retake Season 13 — бразильців із
   Circuit X Curitiba. Зайвий трафік дешевший за таку підміну. */
fs.rmSync("reg", { recursive: true, force: true });
fs.mkdirSync("reg", { recursive: true });

let ok = 0, fail = 0;
for (const j of jobs.filter(j => j.kind === "sheet")) {
  const out = `reg/${j.row}.xlsx`;
  try {
    execSync(`curl -sL --max-time 90 -o "${out}" "https://docs.google.com/spreadsheets/d/${j.id}/export?format=xlsx"`, { stdio: "ignore" });
    const size = fs.statSync(out).size;
    if (size < 4000) { fs.unlinkSync(out); throw new Error(`замала відповідь (${size}b)`); }
    console.log(`  ok   ${j.name.padEnd(28)} ${size}b`);
    ok++;
  } catch (e) {
    console.log(`  —    ${j.name.padEnd(28)} ${e.message}`);
    fail++;
  }
}
console.log(`\nзавдань: ${jobs.length} · таблиць завантажено ${ok}, не вдалося ${fail}`);
console.log("форми (відповіді у книзі дентена): " + jobs.filter(j => j.kind === "form").map(j => j.name).join(", "));
console.log("інші джерела: " + jobs.filter(j => j.kind === "other").map(j => `${j.name} (${new URL(j.link).host})`).join(", "));
