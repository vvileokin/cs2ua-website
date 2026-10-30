import fs from "node:fs";
import readline from "node:readline";

/**
 * Відновлення моделі з журналу сесії.
 *
 * Тимчасову теку з усіма скриптами вичистив прибиральник Windows. Журнал сесії
 * лишився, а в ньому — кожен Write і кожен повний Read. Цей скрипт збирає з
 * нього останню повну версію кожного файла.
 */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });

const uses = new Map();
const cand = new Map();
const add = (name, line, how, text) => {
  if (!text) return;
  if (!cand.has(name)) cand.set(name, []);
  cand.get(name).push({ line, how, text });
};
const base = (p) => String(p).split(/[\\/]/).pop().replace(/[^A-Za-z0-9._-]/g, "");

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
      const inp = c.input ?? {};
      if (c.name === "Write" && inp.file_path && typeof inp.content === "string")
        add(base(inp.file_path), n, "write", inp.content);
      if ((c.name === "Bash" || c.name === "PowerShell") && typeof inp.command === "string") {
        for (const m of inp.command.matchAll(/cat\s*>\s*([^\s<]+)\s*<<\s*'?EOF'?\n([\s\S]*?)\nEOF/g))
          add(base(m[1]), n, "heredoc", m[2]);
      }
    } else if (c.type === "tool_result") {
      const u = uses.get(c.tool_use_id);
      if (!u || u.name !== "Read") continue;
      const p = u.input?.file_path; if (!p) continue;
      if (u.input.offset || u.input.limit) continue;
      let text = c.content;
      if (Array.isArray(text)) text = text.map(x => (typeof x === "string" ? x : x?.text ?? "")).join("");
      if (typeof text !== "string" || !text) continue;
      const lines = text.split("\n");
      const firstNum = lines.find(l => /^\s*\d+\t/.test(l));
      if (!firstNum || !/^\s*1\t/.test(firstNum)) continue;
      const body = lines.filter(l => /^\s*\d+\t/.test(l)).map(l => l.replace(/^\s*\d+\t/, ""));
      add(base(p), n, "read", body.join("\n"));
    }
  }
}

fs.mkdirSync("restore", { recursive: true });
const report = [];
for (const [name, list] of cand) {
  list.sort((a, b) => a.line - b.line);
  const last = list.at(-1);
  report.push({ name, versions: list.length, lastLine: last.line, how: last.how, bytes: last.text.length });
  fs.writeFileSync(`restore/${name}`, last.text.endsWith("\n") ? last.text : last.text + "\n");
  fs.writeFileSync(`restore/.hist-${name}.json`, JSON.stringify(list.map(v => ({ line: v.line, how: v.how, bytes: v.text.length })), null, 1));
}
report.sort((a, b) => b.lastLine - a.lastLine);
fs.writeFileSync("restore/.report.json", JSON.stringify(report, null, 1));
console.log(`рядків у журналі: ${n}, файлів відновлено: ${report.length}`);
