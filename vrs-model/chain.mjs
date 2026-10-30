import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
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
    const cmd = c.input?.command;
    if (typeof cmd !== "string") continue;
    for (const m of cmd.matchAll(/(?:Copy-Item|cp)\s+(final\d*\.mjs|build\d*\.mjs)\s+(final\d*\.mjs|build\d*\.mjs)/g))
      console.log(`#${String(n).padStart(6)}  ${m[1]} -> ${m[2]}`);
    for (const m of cmd.matchAll(/(?:Move-Item|mv)\s+(final\d*\.mjs)\s+(final\d*\.mjs)/g))
      console.log(`#${String(n).padStart(6)}  MV ${m[1]} -> ${m[2]}`);
  }
}
