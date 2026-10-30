import fs from "node:fs";
import readline from "node:readline";
/** seek.mjs <regex> — рядки журналу, де цей текст є у виводі або в команді. */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const re = new RegExp(process.argv[2], "u");
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const uses = new Map();
let n = 0;
for await (const raw of rl) {
  n++;
  if (!raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type === "tool_use") {
      uses.set(c.id, { name: c.name, input: c.input ?? {} });
      const s = JSON.stringify(c.input ?? {});
      if (re.test(s)) console.log(`#${String(n).padStart(6)} USE  ${c.name.padEnd(10)} ${s.replace(/\n/g, " ").slice(0, 200)}`);
    } else if (c.type === "tool_result") {
      let text = c.content;
      if (Array.isArray(text)) text = text.map((x) => (typeof x === "string" ? x : x?.text ?? "")).join("");
      if (typeof text !== "string") continue;
      if (!re.test(text)) continue;
      const u = uses.get(c.tool_use_id);
      const cmd = String(u?.input?.command ?? u?.input?.file_path ?? "").replace(/\s+/g, " ");
      console.log(`#${String(n).padStart(6)} OUT  ${String(text.length).padStart(7)}b  ${cmd.slice(0, 160)}`);
    }
  }
}
