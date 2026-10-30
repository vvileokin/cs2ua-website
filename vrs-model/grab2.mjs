import fs from "node:fs";
import readline from "node:readline";
/** Повний текст команд і виводів для заданих цілей. grab2.mjs ціль [ціль...] */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const TARGETS = process.argv.slice(2);
const base = (p) => String(p).split(/[\/]/).pop();
const mentions = (txt, t) => {
  let i = String(txt).indexOf(t);
  while (i >= 0) {
    const prev = i === 0 ? "" : txt[i - 1];
    if (!/[A-Za-z0-9_-]/.test(prev)) return true;
    i = txt.indexOf(t, i + 1);
  }
  return false;
};
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const uses = new Map();
const hits = new Map(TARGETS.map((t) => [t, []]));
let n = 0;
for await (const raw of rl) {
  n++;
  if (!raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type === "tool_use") {
      uses.set(c.id, { name: c.name, input: c.input ?? {}, line: n });
      const cmd = typeof c.input?.command === "string" ? c.input.command : "";
      if (cmd) for (const t of TARGETS) if (mentions(cmd, t)) hits.get(t).push({ line: n, how: "cmd", cmd });
      const fp = c.input?.file_path ?? "";
      if (TARGETS.includes(base(fp))) hits.get(base(fp)).push({ line: n, how: c.name, text: c.input?.content ?? c.input?.new_string ?? null, old: c.input?.old_string });
    } else if (c.type === "tool_result") {
      const u = uses.get(c.tool_use_id);
      if (!u) continue;
      let text = c.content;
      if (Array.isArray(text)) text = text.map((x) => (typeof x === "string" ? x : x?.text ?? "")).join("");
      if (typeof text !== "string" || !text.trim()) continue;
      const cmd = typeof u.input?.command === "string" ? u.input.command : "";
      const fp = u.input?.file_path ?? "";
      if (u.name === "Read" && TARGETS.includes(base(fp))) {
        hits.get(base(fp)).push({ line: n, how: "readout", cmd: `Read ${fp}`, text });
        continue;
      }
      if (cmd) for (const t of TARGETS) if (mentions(cmd, t)) hits.get(t).push({ line: n, how: "out", cmdLine: u.line, cmd, text });
    }
  }
}
fs.mkdirSync("restore", { recursive: true });
for (const [t, list] of hits) {
  list.sort((a, b) => a.line - b.line);
  fs.writeFileSync(`restore/.full-${t}.json`, JSON.stringify(list, null, 1));
  console.log(`${t.padEnd(26)} ${String(list.length).padStart(4)} записів`);
}
console.log(`рядків: ${n}`);
