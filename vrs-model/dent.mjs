import E from "exceljs";
import fs from "node:fs";

/** Друкує таблицю denten: календар LAN і вкладки з реєстраціями. */
const txt = (v) => {
  if (v == null) return "";
  if (typeof v === "object") {
    if (v.richText) return v.richText.map(t => t.text).join("");
    if (v.text !== undefined) return txt(v.text);
    if (v.result !== undefined) return String(v.result);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return "";
  }
  return String(v);
};

const wb = new E.Workbook();
await wb.xlsx.readFile(process.argv[2] ?? "dent0210.xlsx");

const T = wb.getWorksheet("Tournaments");
const rows = [];
T.eachRow((r, i) => {
  const cells = [];
  r.eachCell({ includeEmpty: true }, (c, j) => {
    const link = c.hyperlink ?? (c.value && typeof c.value === "object" && c.value.hyperlink) ?? null;
    cells[j] = { v: txt(c.value).trim(), link };
  });
  rows.push({ i, cells });
});
fs.writeFileSync(process.env.OUT_T ?? "dent-tournaments-0210.json", JSON.stringify(rows, null, 1));
console.log("=== Tournaments ===");
for (const { i, cells } of rows) {
  const line = cells.map((c, j) => (c && c.v ? `${j}:${c.v.slice(0, 34)}${c.link ? "→" : ""}` : "")).filter(Boolean).join(" | ");
  if (line) console.log(String(i).padStart(3), line);
}

console.log("\n=== вкладки реєстрацій ===");
const skip = new Set(["Tournaments", "Finished Events", "Cancelled or postponed", "How much tournaments every team", "Helper"]);
const reg = {};
wb.eachSheet((s) => {
  if (skip.has(s.name)) return;
  const out = [];
  let hdr = null, colTeam = -1, colStatus = -1;
  s.eachRow((r, i) => {
    if (hdr === null) {
      let t = -1, st = -1;
      r.eachCell({ includeEmpty: false }, (c, j) => {
        const v = txt(c.value).trim().toLowerCase();
        if (/team.?s?\s*name|^team$|full team name/.test(v)) t = j;
        if (/^status/.test(v) && !/example/.test(v)) st = j;
      });
      if (t > 0) { hdr = i; colTeam = t; colStatus = st; }
      return;
    }
    const name = txt(r.getCell(colTeam).value).trim();
    const status = colStatus > 0 ? txt(r.getCell(colStatus).value).trim() : "";
    if (name) out.push([name, status]);
  });
  reg[s.name] = out;
  console.log(`\n--- ${s.name} (${out.length} рядків, статус: ${colStatus > 0 ? "є" : "нема"})`);
  console.log(out.map(([n, st]) => `${n}${st ? ` [${st}]` : ""}`).join(", ").slice(0, 2000));
});
fs.writeFileSync(process.env.OUT_R ?? "dent-reg-0210.json", JSON.stringify(reg, null, 1));
