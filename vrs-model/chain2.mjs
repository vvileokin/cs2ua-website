import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const T = ["final11","final12","final13","final14"];
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
    if (!T.some(t => blob.includes(t))) continue;
    const which = T.filter(t => blob.includes(t)).join(",");
    let d = inp.command ?? inp.file_path ?? blob.slice(0,160);
    console.log(`#${String(n).padStart(6)} ${c.name.padEnd(10)} [${which}] ${String(d).replace(/\s+/g," ").slice(0,150)}`);
  }
}
