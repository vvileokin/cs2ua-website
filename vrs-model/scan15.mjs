import fs from "node:fs";
import readline from "node:readline";

/** Усі tool_use, що згадують final15.mjs — у хронологічному порядку. */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const out = [];
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
    if (!blob.includes("final15")) continue;
    out.push({ line: n, id: c.id, name: c.name, input: inp });
  }
}
fs.writeFileSync("restore/.scan15.json", JSON.stringify(out, null, 1));
console.log(`tool_use зі згадкою final15: ${out.length}`);
for (const h of out) {
  const inp = h.input;
  let d = inp.command ?? inp.file_path ?? JSON.stringify(inp).slice(0,200);
  console.log(`#${String(h.line).padStart(6)} ${h.name.padEnd(10)} ${String(d).replace(/\s+/g," ").slice(0,170)}`);
}
