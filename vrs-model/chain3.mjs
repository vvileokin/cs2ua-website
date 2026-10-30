import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const T = process.argv[2];
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
    // mutation heuristics
    const cmd = inp.command ?? "";
    const mut = c.name === "Write" || c.name === "Edit"
      || /Set-Content\s+[^\s|]*T_RE/.test("") // placeholder
      || new RegExp(`Set-Content\s+["']?[^\s"']*${T}`).test(cmd)
      || new RegExp(`Out-File[^\n]*${T}`).test(cmd)
      || new RegExp(`writeFileSync\(\s*["'][^"']*${T}`).test(cmd)
      || new RegExp(`open\(\s*p\s*,\s*["']w`).test(cmd) && cmd.includes(T)
      || new RegExp(`sed -i`).test(cmd) && cmd.includes(T)
      || new RegExp(`Copy-Item\s+\S+\s+${T}`).test(cmd)
      || new RegExp(`cp\s+\S+\s+${T}`).test(cmd)
      || /io\.open\(p, "w"/.test(cmd) && cmd.includes(T);
    let d = inp.command ?? inp.file_path ?? blob.slice(0,120);
    console.log(`${mut?"MUT ":"    "}#${String(n).padStart(6)} ${c.name.padEnd(10)} ${String(d).replace(/\s+/g," ").slice(0,130)}`);
  }
}
