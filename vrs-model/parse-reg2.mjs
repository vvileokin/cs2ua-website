import fs from "node:fs";
import E from "exceljs";
import { lookup, RANK_OF } from "./team-names.mjs";

/**
 * Списки зареєстрованих — з двох джерел одразу.
 *
 * 1) Вкладки в самій книзі дентена: відповіді Google-форм він зводить до себе.
 * 2) Окремі реєстраційні таблиці, на які веде колонка «Registered teams».
 *
 * Прийнятою заявкою вважається тільки «Confirmed», «Signed up & Paid», «PAID».
 * Словник статусів у жовтні ширший, ніж був у вересні: «Did not pay»,
 * «On waitlist», «Waiting for payment», «Multiple Sign-up», «Invalid»,
 * «Withdrawn» — усе це означає, що команда не їде.
 *
 * Порожній статус у таблиці, де колонка статусу є, рахується як неприйнята
 * заявка і окремо друкується: організатор цю колонку заповнює, і порожнеча в
 * ній — це «ще не вирішено», а не «підтверджено».
 */
const IN = new Set(["confirmed", "signed up & paid", "paid", "signed up and paid"]);
const accepted = (st) => IN.has(String(st).trim().toLowerCase());

const txt = (v) => {
  if (v == null) return "";
  if (v instanceof Date) return "";
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.text !== undefined) return txt(v.text);
    /* Таблиці, зібрані через IMPORTRANGE, приїздять формулами: справжнє
       значення лежить у запасному аргументі IFERROR, який Google кешує.
       Без цього ROG Journey читався як двадцять чотири порожні рядки. */
    if (v.formula !== undefined &&
        (v.result == null || (v.result instanceof Date && Number.isNaN(+v.result)))) {
      const m = String(v.formula).match(/,\s*"((?:[^"]|"")*)"\)\s*$/);
      return m ? m[1].replace(/""/g, '"') : "";
    }
    if (v.result !== undefined) return v.result instanceof Date ? "" : String(v.result);
    return "";
  }
  return String(v);
};

const out = {}, unmatched = new Map(), blanks = [];

/* ---- 1. вкладки книги дентена ---- */
const tabs = JSON.parse(fs.readFileSync(process.env.REG ?? "dent-reg-0210.json", "utf8"));
for (const [name, rows] of Object.entries(tabs)) {
  const teams = new Set();
  let acc = 0, blank = 0;
  for (const [raw, st] of rows) {
    if (!raw || raw.length > 40) continue;
    if (!st) { blank++; blanks.push(`${name}: ${raw}`); continue; }
    if (!accepted(st)) continue;
    acc++;
    const t = lookup(raw);
    if (t) teams.add(t); else unmatched.set(raw, (unmatched.get(raw) ?? 0) + 1);
  }
  out[name] = { accepted: acc, blank, slots: null, teams: [...teams].sort((a, b) => (RANK_OF.get(a) ?? 999) - (RANK_OF.get(b) ?? 999)), src: "вкладка дентена" };
}

/* ---- 2. окремі таблиці ---- */
const jobs = JSON.parse(fs.readFileSync("reg-jobs.json", "utf8"));
for (const j of jobs) {
  const f = `reg/${j.row}.xlsx`;
  if (!fs.existsSync(f)) continue;
  const wb = new E.Workbook();
  try { await wb.xlsx.readFile(f); } catch { console.log(`!! ${j.name}: книга не читається`); continue; }

  const teams = new Set();
  let acc = 0, blank = 0, hadStatus = false, slots = 0;
  wb.eachSheet((s) => {
    let hdr = null, colTeam = -1, colStatus = -1, colSlots = -1;
    s.eachRow((r, i) => {
      if (hdr || i > 12) return;
      r.eachCell({ includeEmpty: false }, (c, jx) => {
        const t = txt(c.value).trim().toLowerCase();
        if (/team.?s?\s*name|^team$|nome do time|^назва команди$|^команда$|full team name/.test(t) && !hdr) { hdr = i; colTeam = jx; }
      });
      if (hdr === i) r.eachCell({ includeEmpty: false }, (c, jx) => {
        const t = txt(c.value).trim().toLowerCase();
        if (/^status/.test(t) && !/example/.test(t) && colStatus < 0) colStatus = jx;
        if (/confirmed\s*teams/i.test(txt(c.value)) && colSlots < 0) colSlots = jx;
      });
    });
    if (!hdr) return;
    if (colStatus > 0) hadStatus = true;
    if (colSlots > 0) s.eachRow((r, i) => {
      if (i <= hdr || slots) return;
      const v = txt(r.getCell(colSlots).value);
      const n = [...v].filter((ch) => ch === "🟩" || ch === "🟧" || ch === "🟥").length;
      if (n > 1) slots = n;
    });
    s.eachRow((r, i) => {
      if (i <= hdr) return;
      const raw = txt(r.getCell(colTeam).value).trim();
      if (!raw || raw.length > 40) return;
      if (colStatus > 0) {
        const st = txt(r.getCell(colStatus).value).trim();
        if (!st) { blank++; blanks.push(`${j.name}: ${raw}`); return; }
        if (!accepted(st)) return;
      }
      acc++;
      const t = lookup(raw);
      if (t) teams.add(t); else unmatched.set(raw, (unmatched.get(raw) ?? 0) + 1);
    });
  });
  out[j.name] = { accepted: acc, blank, slots: slots || null, teams: [...teams].sort((a, b) => (RANK_OF.get(a) ?? 999) - (RANK_OF.get(b) ?? 999)), src: hadStatus ? "таблиця зі статусами" : "таблиця без статусів" };
}

fs.writeFileSync("reg-teams.json", JSON.stringify(out, null, 1));
for (const [name, v] of Object.entries(out)) {
  const top = v.teams.filter((t) => (RANK_OF.get(t) ?? 999) <= 45).length;
  console.log(`\n${name}  —  прийнято ${v.accepted}${v.blank ? `, без статусу ${v.blank}` : ""}${v.slots ? `, сітка ${v.slots}` : ""} · у рейтингу ${v.teams.length}, з них топ-45: ${top}  [${v.src}]`);
  if (v.teams.length) console.log("   " + v.teams.map((t) => `${t}${RANK_OF.has(t) ? `(${RANK_OF.get(t)})` : ""}`).join(", "));
}
console.log("\n— рядки без статусу (не зараховані) —\n" + blanks.join(" · "));
console.log("\n— назви, яких рейтинг не впізнав —\n" + [...unmatched].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([n, c]) => `${n}×${c}`).join("  ·  "));
