import fs from "node:fs";
/**
 * ps-anchors.mjs <step.ps1> <файл-до-кроку> <цільове-ім'я.mjs> [out]
 *
 * Розбирає крок PowerShell і повідомляє, чи кожен .Replace() має свій якір у
 * файлі ДО кроку. PowerShell .Replace() нічого не каже, коли не знайшов, тому
 * без цієї перевірки латка зникає безслідно.
 *
 * Крок може правити кілька файлів ($a = Get-Content access.mjs, $c = ... ),
 * тому заміни відбираються за змінною, яку прив'язано саме до цільового файла.
 *
 * Розбирає ті конструкції, що справді трапляються в журналі:
 *   'рядок в одинарних лапках'  (подвоєна лапка '' = одна)
 *   @'\n...тут-рядок...\n'@
 *   $old / $new / $old2 ... — змінні, яким щойно присвоїли тут-рядок
 */
const script = fs.readFileSync(process.argv[2], "utf8");
const before = fs.readFileSync(process.argv[3], "utf8");
const target = process.argv[4];
const outPath = process.argv[5] ?? process.argv[3];

/* яку змінну прив'язано до цільового файла */
let holder = null;
for (const m of script.matchAll(/\$([A-Za-z_]\w*)\s*=\s*Get-Content\s+([^\s]+)/g))
  if (m[2].replace(/["']/g, "") === target) holder = m[1];
if (!holder) { console.error(`!! у кроці немає Get-Content ${target}`); process.exit(2); }

const vars = new Map();
let i = 0;
const n = script.length;

function readSingle(pos) {              // 'рядок', '' = одна лапка
  let s = "", p = pos + 1;
  while (p < n) {
    if (script[p] === "'") {
      if (script[p + 1] === "'") { s += "'"; p += 2; continue; }
      return { s, end: p + 1 };
    }
    s += script[p++];
  }
  return { s, end: p };
}
function readHere(pos) {                // @'\n ... \n'@
  let p = script.indexOf("\n", pos);
  if (p < 0) return null;
  p++;
  let endMarker = script.startsWith("'@", p) ? p - 1 : script.indexOf("\n'@", p - 1);
  if (endMarker < 0) return null;
  return { s: script.slice(p, endMarker + 1).replace(/\n$/, ""), end: endMarker + 3 };
}

const calls = [];
while (i < n) {
  const m = /^\$([A-Za-z_]\w*)\s*=\s*@'/.exec(script.slice(i, i + 80));
  if (m) {
    const h = readHere(i + m[0].length - 2);
    if (h) { vars.set(m[1], h.s); i = h.end; continue; }
  }
  /* $old = '…' — звичайний рядок в одинарних лапках, теж буває багаторядковим */
  const sq = /^\$([A-Za-z_]\w*)\s*=\s*'/.exec(script.slice(i, i + 80));
  if (sq && !/^\$[A-Za-z_]\w*\s*=\s*\$/.test(script.slice(i, i + 40))) {
    const r = readSingle(i + sq[0].length - 1);
    vars.set(sq[1], r.s); i = r.end; continue;
  }
  const rm = new RegExp(`^\\$${holder}\\s*=\\s*\\$${holder}\\.Replace\\(`).exec(script.slice(i, i + 60));
  if (rm) {
    let p = i + rm[0].length;
    const args = [];
    for (let a = 0; a < 2; a++) {
      while (p < n && /[\s,]/.test(script[p])) p++;
      if (script[p] === "'") { const r = readSingle(p); args.push({ kind: "lit", v: r.s }); p = r.end; }
      else if (script.startsWith("@'", p)) { const r = readHere(p); args.push({ kind: "here", v: r.s }); p = r.end; }
      else {
        const vm = /^\$([A-Za-z_]\w*)/.exec(script.slice(p));
        if (vm) { args.push({ kind: "var", name: vm[1], v: vars.get(vm[1]) }); p += vm[0].length; }
        else { args.push({ kind: "?", v: undefined }); break; }
      }
    }
    calls.push({ args });
    i = p;
    continue;
  }
  i++;
}

let cur = before, bad = 0;
console.log(`  замін на ${target}: ${calls.length}`);
calls.forEach((c, idx) => {
  const [o, nw] = c.args;
  const tag = `   [${String(idx + 1).padStart(2)}] ${o?.kind === "var" ? "$" + o.name : o?.kind}`;
  if (o?.v === undefined) { console.log(`${tag}  ??? не розібрано`); bad++; return; }
  const cnt = cur.split(o.v).length - 1;
  if (cnt === 0) { console.log(`${tag}  ЯКІР НЕ ЗНАЙДЕНО :: ${JSON.stringify(o.v.slice(0, 100))}`); bad++; }
  else { if (nw?.v !== undefined) cur = cur.split(o.v).join(nw.v); }
});
console.log(bad ? `  ** ПРОБЛЕМНИХ ЗАМІН: ${bad}` : `  усі ${calls.length} якорів на місці`);
fs.writeFileSync(outPath, cur, "utf8");
process.exit(bad ? 1 : 0);
