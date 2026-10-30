import fs from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * Скільки очок треба на третю стадію.
 *
 * `threshold.mjs` відповідає на питання «пройдуть чи ні», а стадія — окреме
 * питання: у Європі вісімнадцять місць розбиті на три шістки, і Stage 3 — це
 * топ-6, тобто сітка, у якій половину вже пройдено за тебе. Тому тут читається
 * не `pQual`, а `p3`, і заразом місце серед європейців.
 *
 * Запуск: node stage3.mjs "Natus Vincere" 0,60,120,180,240,300
 */
const TEAM = process.argv[2] ?? "Natus Vincere";
const DELTAS = (process.argv[3] ?? "0,60,120,180,240,300").split(",").map(Number);
const BASE = process.env.VRS_FILE ?? "vrs-live-2510.json";

const base = JSON.parse(fs.readFileSync(BASE, "utf8"));
const rows = base.rows.split(";").map((s) => {
  const [rank, team, pts, reg] = s.split("|");
  return { rank: +rank, team, pts: +pts, reg };
});
const seen = new Set();
const idx = rows.findIndex((r) => r.team === TEAM && !seen.has(r.team) && (seen.add(r.team), true));
const me = rows[idx];

console.log(`${TEAM}: ${me.pts} очок\n`);
console.log("приріст   очки   місце   Stage 3   Stage 2   Stage 1   прохід");
const out = [];
for (const d of DELTAS) {
  const moved = rows.map((r, i) => (i === idx ? { ...r, pts: r.pts + d } : r)).sort((a, b) => b.pts - a.pts);
  const f = `vrs-s3-${d}.json`;
  fs.writeFileSync(f, JSON.stringify({ ...base, rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.pts}|${r.reg}`).join(";") }));
  const o = `f15-s3-${d}.json`;
  execFileSync(process.execPath, ["final15.mjs"], {
    env: { ...process.env, SEED_SCALE: "0.35", NOISE_SCALE: "0.60", EVENT_BONUS: "33", VRS_FILE: f, OUT_FILE: o },
    stdio: "ignore",
  });
  const F = JSON.parse(fs.readFileSync(o, "utf8"));
  const list = F.regions.europe;
  const t = list.find((x) => x.team === TEAM);
  const place = list.slice().sort((a, b) => b.pQual - a.pQual).findIndex((x) => x.team === TEAM) + 1;
  out.push({ d, pts: me.pts + d, p3: 100 * t.p3 });
  console.log(
    `${(d >= 0 ? "+" : "") + d}`.padEnd(10) + String(me.pts + d).padEnd(7) + String(place).padEnd(8) +
    (100 * t.p3).toFixed(1).padStart(6) + "%" + (100 * t.p2).toFixed(1).padStart(9) + "%" +
    (100 * t.p1).toFixed(1).padStart(9) + "%" + (100 * t.pQual).toFixed(1).padStart(8) + "%",
  );
  fs.rmSync(f, { force: true }); fs.rmSync(o, { force: true });
}
const at = (target) => {
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i], b = out[i + 1];
    if ((a.p3 - target) * (b.p3 - target) <= 0 && a.p3 !== b.p3)
      return Math.round(a.pts + ((target - a.p3) / (b.p3 - a.p3)) * (b.pts - a.pts));
  }
  return null;
};
console.log("\nорієнтири на Stage 3:");
for (const t of [25, 50, 75]) {
  const v = at(t);
  console.log(`  ${String(t).padStart(2)}% — ${v == null ? "поза межами прогону" : `${v} очок (+${v - me.pts})`}`);
}
