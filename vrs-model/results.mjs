import fs from "node:fs";
import readline from "node:readline";
/**
 * results.mjs <рядок> [<рядок> ...]
 * Друкує результат інструмента для tool_use із заданого рядка журналу —
 * тобто що крок НАСПРАВДІ вивів: "готово", throw, "НЕ ЗНАЙДЕНО" тощо.
 */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const want = new Set(process.argv.slice(2).map(Number));
const ids = new Map();
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
let n = 0;
for await (const raw of rl) {
  n++;
  if (!raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type === "tool_use" && want.has(n)) ids.set(c.id, n);
    else if (c.type === "tool_result" && ids.has(c.tool_use_id)) {
      let t = c.content;
      if (Array.isArray(t)) t = t.map(x => (typeof x === "string" ? x : x?.text ?? "")).join("");
      console.log(`\n===== результат кроку #${ids.get(c.tool_use_id)} (рядок результату ${n}, is_error=${!!c.is_error}) =====`);
      console.log(String(t).slice(0, 1800));
    }
  }
}
