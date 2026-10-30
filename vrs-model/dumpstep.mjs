import fs from "node:fs";
import readline from "node:readline";
/** dumpstep.mjs <outdir> <line> [<line> ...]
 *  Для кожного рядка журналу зберігає повний текст tool_use у окремий файл:
 *    <outdir>/<line>.<name>.cmd      — текст Bash/PowerShell команди
 *    <outdir>/<line>.<name>.write    — вміст Write
 *    <outdir>/<line>.<name>.old/.new — Edit
 */
const JL = "C:/Users/LNU/.claude/projects/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5.jsonl";
const outdir = process.argv[2];
const want = new Set(process.argv.slice(3).map(Number));
fs.mkdirSync(outdir, { recursive: true });
const rl = readline.createInterface({ input: fs.createReadStream(JL, { encoding: "utf8" }), crlfDelay: Infinity });
let n = 0;
for await (const raw of rl) {
  n++;
  if (!want.has(n)) continue;
  let o; try { o = JSON.parse(raw); } catch { continue; }
  const content = o?.message?.content;
  if (!Array.isArray(content)) continue;
  let i = 0;
  for (const c of content) {
    if (c.type !== "tool_use") continue;
    i++;
    const base = `${outdir}/${n}.${i}.${c.name}`;
    const inp = c.input ?? {};
    if (typeof inp.command === "string") { fs.writeFileSync(`${base}.cmd`, inp.command); console.log(`${base}.cmd  ${inp.command.length}b`); }
    else if (inp.old_string !== undefined) {
      fs.writeFileSync(`${base}.old`, inp.old_string);
      fs.writeFileSync(`${base}.new`, inp.new_string ?? "");
      fs.writeFileSync(`${base}.meta.json`, JSON.stringify({ file_path: inp.file_path, replace_all: !!inp.replace_all }, null, 1));
      console.log(`${base}.old/.new  ${String(inp.old_string).length}/${String(inp.new_string ?? "").length}b  file=${String(inp.file_path).split(/[\\/]/).pop()}`);
    } else if (typeof inp.content === "string") {
      fs.writeFileSync(`${base}.write`, inp.content);
      fs.writeFileSync(`${base}.meta.json`, JSON.stringify({ file_path: inp.file_path }, null, 1));
      console.log(`${base}.write  ${inp.content.length}b  file=${String(inp.file_path).split(/[\\/]/).pop()}`);
    } else { fs.writeFileSync(`${base}.json`, JSON.stringify(inp, null, 1)); console.log(`${base}.json`); }
  }
}
