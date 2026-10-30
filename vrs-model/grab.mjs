import fs from "node:fs";
import readline from "node:readline";

/**
 * Один прохід журналом по всіх цілях одразу: Write, heredoc, Read і будь-який
 * вивід у консоль, де ім'я файла згадане в команді. Пише restore/.grab-<ім'я>.json
 */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const TARGETS = [
  "fields-page.json", "slots.json", "reg-jobs.json", "reg-teams.json",
  "ferjee-teams.json", "qual-thunder.json", "qual.json",
  "qual-buch-americas.json", "qual-buch-asia.json", "fields.mjs",
];
const base = (p) => String(p).split(/[\/]/).pop();
/* Ім'я цілі, згадане в тексті як окреме слово (щоб gen-fields.mjs не читався як fields.mjs). */
const mentions = (txt, t) => {
  const i0 = String(txt).indexOf(t);
  if (i0 < 0) return false;
  let i = i0;
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
const push = (t, rec) => hits.get(t).push(rec);
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
      const fp = inp.file_path ?? "";
      if (c.name === "Write" && typeof inp.content === "string" && TARGETS.includes(base(fp)))
        push(base(fp), { line: n, how: "write", bytes: inp.content.length, text: inp.content });
      if (c.name === "Edit" && TARGETS.includes(base(fp)))
        push(base(fp), { line: n, how: "edit", bytes: (inp.new_string ?? "").length, old: inp.old_string, text: inp.new_string });
      const cmd = typeof inp.command === "string" ? inp.command : "";
      if (cmd) {
        /* heredoc будь-яким маркером */
        for (const m of cmd.matchAll(/cat\s*>\s*['"]?([^\s<'"]+)['"]?\s*<<\s*'?([A-Za-z0-9_]+)'?\n([\s\S]*?)\n\2/g))
          if (TARGETS.includes(base(m[1]))) push(base(m[1]), { line: n, how: "heredoc", bytes: m[3].length, text: m[3] });
        /* команда просто згадує ціль — збережемо команду, вивід додамо з tool_result */
        for (const t of TARGETS) if (mentions(cmd, t)) push(t, { line: n, how: "cmd", cmd: cmd.slice(0, 1200), id: c.id });
      }
    } else if (c.type === "tool_result") {
      const u = uses.get(c.tool_use_id);
      if (!u) continue;
      let text = c.content;
      if (Array.isArray(text)) text = text.map((x) => (typeof x === "string" ? x : x?.text ?? "")).join("");
      if (typeof text !== "string" || !text.trim()) continue;
      const fp = u.input?.file_path ?? "";
      if (u.name === "Read" && TARGETS.includes(base(fp))) {
        const body = text.split("\n").filter((l) => /^\s*\d+\t/.test(l));
        if (body.length) {
          const from = +body[0].match(/^\s*(\d+)\t/)[1];
          const to = +body.at(-1).match(/^\s*(\d+)\t/)[1];
          push(base(fp), { line: n, how: `read ${from}-${to}`, from, to, bytes: text.length, text: body.map((l) => l.replace(/^\s*\d+\t/, "")).join("\n") });
        }
        continue;
      }
      const cmd = typeof u.input?.command === "string" ? u.input.command : "";
      if (!cmd) continue;
      for (const t of TARGETS) if (mentions(cmd, t))
        push(t, { line: n, how: "out", bytes: text.length, cmd: cmd.slice(0, 1200), text: text.slice(0, 400000) });
    }
  }
}

fs.mkdirSync("restore", { recursive: true });
for (const [t, list] of hits) {
  list.sort((a, b) => a.line - b.line);
  fs.writeFileSync(`restore/.grab-${t}.json`, JSON.stringify(list, null, 1));
  const kinds = {};
  for (const h of list) kinds[h.how.split(" ")[0]] = (kinds[h.how.split(" ")[0]] ?? 0) + 1;
  console.log(`${t.padEnd(26)} записів ${String(list.length).padStart(4)}  ${JSON.stringify(kinds)}`);
}
console.log(`\nрядків у журналі: ${n}`);
