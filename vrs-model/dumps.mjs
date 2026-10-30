import fs from "node:fs";
import readline from "node:readline";

/**
 * Збирає з журналу всі місця, де вміст файла виводили в консоль:
 * `sed -n 'A,Bp' файл`, `cat -n`, `grep -n` тощо. Для кожного такого виклику
 * зберігає команду і її вивід, щоб потім зшити файл із найсвіжіших шматків.
 */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const TARGET = process.argv[2] ?? "final15.mjs";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });

const uses = new Map();
const out = [];
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
    } else if (c.type === "tool_result") {
      const u = uses.get(c.tool_use_id);
      if (!u) continue;
      const cmd = u.input?.command ?? u.input?.file_path ?? "";
      if (!String(cmd).includes(TARGET)) continue;
      let text = c.content;
      if (Array.isArray(text)) text = text.map(x => (typeof x === "string" ? x : x?.text ?? "")).join("");
      if (typeof text !== "string" || !text.trim()) continue;
      out.push({ line: n, tool: u.name, cmd: String(cmd).slice(0, 400), text });
    }
  }
}
fs.writeFileSync(`restore/.dumps-${TARGET}.json`, JSON.stringify(out, null, 1));
console.log(`знайдено виводів: ${out.length}`);
for (const d of out) console.log(`#${String(d.line).padStart(6)} ${d.tool.padEnd(6)} ${d.text.length}b  ${d.cmd.replace(/\s+/g, " ").slice(0, 140)}`);
