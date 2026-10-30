import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const want = new Set(process.argv.slice(2).map(Number));
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
let n = 0;
for await (const raw of rl) {
  n++;
  if (!want.has(n)) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type !== "tool_use") continue;
    console.log(`\n########## LINE ${n}  ${c.name} ##########`);
    const inp = c.input ?? {};
    if (typeof inp.command === "string") console.log(inp.command);
    else if (inp.old_string !== undefined) {
      console.log(`--- file: ${inp.file_path}`);
      console.log(`--- OLD ---\n${inp.old_string}`);
      console.log(`--- NEW ---\n${inp.new_string}`);
      if (inp.replace_all) console.log(`--- replace_all: true`);
    } else if (typeof inp.content === "string") {
      console.log(`--- write: ${inp.file_path}\n${inp.content}`);
    } else console.log(JSON.stringify(inp, null, 1));
  }
}
