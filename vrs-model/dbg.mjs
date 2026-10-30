import E from "exceljs";
import fs from "node:fs";

const jobs = JSON.parse(fs.readFileSync("reg-jobs.json", "utf8"));
const j = jobs.find((x) => /ROG Journey/i.test(x.name));
const wb = new E.Workbook();
await wb.xlsx.readFile(`reg/${j.row}.xlsx`);
const s = wb.getWorksheet("Sheet1");
const v = s.getRow(3).getCell(2).value;
console.log("keys:", Object.keys(v));
console.log("has text?", v.text !== undefined, "result:", v.result);
const m = String(v.formula).match(/,\s*"((?:[^"]|"")*)"\)\s*$/);
console.log("regex →", m && m[1]);
