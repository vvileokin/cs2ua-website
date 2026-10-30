import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const T = process.argv[2];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, c => "\\" + c);
const E = esc(T);
const RE = [
  new RegExp("Set-Content\\s+[\"']?[^\\s\"'|]*" + E),
  new RegExp("Out-File[^\\n]*" + E),
  new RegExp("writeFileSync\\([^)]*" + E),
  new RegExp("sed -i[^\\n]*" + E),
  new RegExp("(?:Copy-Item|cp)\\s+\\S+\\s+[\"']?[^\\s\"']*" + E),
  new RegExp("(?:Move-Item|mv)\\s+\\S+\\s+[\"']?[^\\s\"']*" + E),
  /io\.open\(\s*p\s*,\s*"w"/,
  /open\(\s*p\s*,\s*['"]w['"]/,
  new RegExp(">\\s*" + E + "\\b"),
];
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
let n = 0;
for await (const raw of rl) {
  n++;
  if (!raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type !== "tool_use") continue;
    const inp = c.input ?? {};
    const blob = JSON.stringify(inp);
    if (!blob.includes(T)) continue;
    const cmd = typeof inp.command === "string" ? inp.command : "";
    const fp = String(inp.file_path ?? "");
    let mut = false, kind = "";
    if ((c.name === "Write" || c.name === "Edit") && fp.includes(T)) { mut = true; kind = c.name; }
    else if (cmd && RE.some(r => r.test(cmd))) { mut = true; kind = c.name + "/cmd"; }
    if (!mut) continue;
    console.log(`MUT #${String(n).padStart(6)} ${kind.padEnd(14)} ${String(cmd || fp).replace(/\s+/g, " ").slice(0, 120)}`);
  }
}
