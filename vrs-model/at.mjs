import fs from "node:fs";
import readline from "node:readline";
/** at.mjs <рядок> [...] — друкує повний tool_use/tool_result із заданих рядків журналу. */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const WANT = new Set(process.argv.slice(2).map(Number));
const MAX = +(process.env.MAX ?? 200000);
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
let n = 0;
for await (const raw of rl) {
  n++;
  if (!WANT.has(n) || !raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) { console.log(`#${n} (не масив) ${raw.slice(0, 2000)}`); continue; }
  for (const c of content) {
    if (c.type === "tool_use") {
      console.log(`\n===== #${n} tool_use ${c.name} =====`);
      const inp = c.input ?? {};
      for (const [k, v] of Object.entries(inp))
        console.log(`--- ${k} ---\n${typeof v === "string" ? v.slice(0, MAX) : JSON.stringify(v).slice(0, MAX)}`);
    } else if (c.type === "tool_result") {
      let text = c.content;
      if (Array.isArray(text)) text = text.map((x) => (typeof x === "string" ? x : x?.text ?? "")).join("");
      console.log(`\n===== #${n} tool_result =====\n${String(text).slice(0, MAX)}`);
    } else if (c.type === "text") {
      console.log(`\n===== #${n} text =====\n${String(c.text).slice(0, MAX)}`);
    }
  }
}
