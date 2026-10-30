import fs from "node:fs";
import readline from "node:readline";
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
const ev = [];
let n = 0;
for await (const raw of rl) {
  n++;
  if (!raw.trim()) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  for (const c of content) {
    if (c.type !== "tool_use") continue;
    const inp = c.input ?? {};
    const cmd = typeof inp.command === "string" ? inp.command : "";
    const fp = String(inp.file_path ?? "");
    const blob = JSON.stringify(inp);
    // (a) direct mutation of final15
    if ((c.name === "Write" || c.name === "Edit") && fp.includes("final15.mjs"))
      ev.push({ line: n, kind: c.name, what: "direct " + c.name });
    // (b) python / node / ps writing final15 inside a command
    if (cmd.includes("final15.mjs") &&
        (/Set-Content\s+["']?[^\s"'|]*final15\.mjs/.test(cmd) || /io\.open\(\s*p\s*,\s*"w"/.test(cmd) ||
         /open\(\s*p\s*,\s*['"]w['"]/.test(cmd) || /writeFileSync\([^)]*final15\.mjs/.test(cmd) ||
         /sed -i[^\n]*final15\.mjs/.test(cmd) || /(?:Copy-Item|cp)\s+\S+\s+["']?[^\s"']*final15\.mjs/.test(cmd)))
      ev.push({ line: n, kind: c.name + "/cmd", what: "direct cmd" });
    // (c) patch scripts being created
    const mkPatch = [...cmd.matchAll(/cat\s*>\s*(\.?patch\d*\.mjs|\.?patch\d*\.py)\s*<</g)].map(m => m[1]);
    for (const p of mkPatch) ev.push({ line: n, kind: "create", what: "створено " + p });
    if ((c.name === "Write") && /[\\/](\.?patch\d*\.(mjs|py))$/.test(fp))
      ev.push({ line: n, kind: "create", what: "створено " + fp.split(/[\\/]/).pop() });
    // (d) patch scripts being run
    for (const m of cmd.matchAll(/\bnode\s+(?:"?\$SP\/)?(\.?patch\d*\.mjs)/g))
      ev.push({ line: n, kind: "run", what: "node " + m[1] });
    for (const m of cmd.matchAll(/\bpython\s+(?:"?\$SP\/)?(\.?patch\d*\.py)/g))
      ev.push({ line: n, kind: "run", what: "python " + m[1] });
    // (e) python heredoc that mentions final15
    if (/python\s+-\s*<<\s*'?PY'?/.test(cmd) && cmd.includes("final15"))
      ev.push({ line: n, kind: "pyheredoc", what: "python heredoc (final15)" });
  }
}
// dedupe
const seen = new Set();
const outEv = ev.filter(e => { const k = e.line + "|" + e.what; if (seen.has(k)) return false; seen.add(k); return true; });
fs.writeFileSync("restore/.timeline15.json", JSON.stringify(outEv, null, 1));
for (const e of outEv) console.log(`#${String(e.line).padStart(6)} ${e.kind.padEnd(16)} ${e.what}`);
console.log(`\nподій: ${outEv.length}`);
