import fs from "node:fs";
import readline from "node:readline";

/** Другий прохід: усі журнали проєкту, включно з частковими читаннями. */
const DIR = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua";
const FILES = fs.readdirSync(DIR).filter(f => f.endsWith(".jsonl")).map(f => `${DIR}/${f}`);
const TARGET = process.argv.slice(2);

const hits = [];
for (const jl of FILES) {
  const rl = readline.createInterface({ input: fs.createReadStream(jl, { encoding: "utf8" }), crlfDelay: Infinity });
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
        const inp = c.input ?? {};
        const p = inp.file_path ?? "";
        if (TARGET.some(t => String(p).includes(t)) && c.name === "Write" && typeof inp.content === "string")
          hits.push({ jl: jl.split("/").pop().slice(0, 8), line: n, file: String(p).split(/[\\/]/).pop(), how: "write", bytes: inp.content.length, text: inp.content });
        if (TARGET.some(t => String(p).includes(t)) && c.name === "Edit")
          hits.push({ jl: jl.split("/").pop().slice(0, 8), line: n, file: String(p).split(/[\\/]/).pop(), how: "edit", bytes: (inp.new_string ?? "").length, text: null, edit: { old: inp.old_string, neu: inp.new_string } });
        if ((c.name === "Bash" || c.name === "PowerShell") && typeof inp.command === "string") {
          for (const m of inp.command.matchAll(/cat\s*>\s*['"]?([^\s<'"]+)['"]?\s*<<\s*'?EOF'?\n([\s\S]*?)\nEOF/g))
            if (TARGET.some(t => m[1].includes(t)))
              hits.push({ jl: jl.split("/").pop().slice(0, 8), line: n, file: m[1].split(/[\\/]/).pop(), how: "heredoc", bytes: m[2].length, text: m[2] });
        }
      } else if (c.type === "tool_result") {
        const u = uses.get(c.tool_use_id);
        if (!u || u.name !== "Read") continue;
        const p = u.input?.file_path ?? "";
        if (!TARGET.some(t => String(p).includes(t))) continue;
        let text = c.content;
        if (Array.isArray(text)) text = text.map(x => (typeof x === "string" ? x : x?.text ?? "")).join("");
        if (typeof text !== "string" || !text) continue;
        const body = text.split("\n").filter(l => /^\s*\d+\t/.test(l));
        if (!body.length) continue;
        const from = +body[0].match(/^\s*(\d+)\t/)[1];
        const to = +body.at(-1).match(/^\s*(\d+)\t/)[1];
        hits.push({ jl: jl.split("/").pop().slice(0, 8), line: n, file: String(p).split(/[\\/]/).pop(), how: `read ${from}-${to}`, bytes: text.length, text: body.map(l => l.replace(/^\s*\d+\t/, "")).join("\n"), from, to });
      }
    }
  }
}
fs.writeFileSync("restore/.hits.json", JSON.stringify(hits, null, 1));
for (const h of hits) console.log(`${h.jl} #${String(h.line).padStart(6)} ${h.file.padEnd(16)} ${h.how.padEnd(12)} ${h.bytes}b`);
console.log(`\nвсього записів: ${hits.length}`);
