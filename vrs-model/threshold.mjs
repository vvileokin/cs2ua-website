import fs from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * Скільки очок команді треба, щоб стати практично певною.
 *
 * Питання «що мені потрібно зробити» має числову відповідь: прогін при
 * зсунутих очках. Таблиця зсувається для однієї команди, решта лишається на
 * місці, і крива «очки → відсоток» показує, де саме проходить межа.
 *
 * Сотні відсотків тут не буде ніколи — не тому, що модель обережна, а тому, що
 * до відсічення грають усі, і хтось завжди може перестрибнути. Тому орієнтир —
 * 95%: далі різниця вже в межах шуму самої моделі.
 *
 * Запуск: node threshold.mjs "Natus Vincere" -40,0,40,80,120,160
 */
const TEAM = process.argv[2];
const DELTAS = (process.argv[3] ?? "-40,0,40,80,120,160").split(",").map(Number);
const BASE = process.env.VRS_FILE ?? "vrs-live-2410.json";

const base = JSON.parse(fs.readFileSync(BASE, "utf8"));
const rows = base.rows.split(";").map((s) => {
  const [rank, team, pts, reg] = s.split("|");
  return { rank: +rank, team, pts: +pts, reg };
});
const seen = new Set();
const idx = rows.findIndex((r) => r.team === TEAM && !seen.has(r.team) && (seen.add(r.team), true));
if (idx < 0) { console.log("немає в таблиці:", TEAM); process.exit(1); }
const REGION = { EU: "europe", AM: "americas", AS: "asia" };
const reg = REGION[rows[idx].reg];
console.log(`${TEAM} · ${rows[idx].pts} очок · ${reg}\n`);
console.log("приріст    очки   місце в регіоні   прохід");

const out = [];
for (const d of DELTAS) {
  const moved = rows.map((r, i) => (i === idx ? { ...r, pts: r.pts + d } : r))
    .sort((a, b) => b.pts - a.pts);
  const f = `vrs-th-${TEAM.replace(/\W/g, "")}-${d}.json`;
  fs.writeFileSync(f, JSON.stringify({ ...base,
    rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.pts}|${r.reg}`).join(";") }));
  const o = `f15-th-${d}.json`;
  execFileSync(process.execPath, ["final15.mjs"], {
    env: { ...process.env, SEED_SCALE: "0.35", NOISE_SCALE: "0.60", VRS_FILE: f, OUT_FILE: o },
    stdio: "ignore",
  });
  const F = JSON.parse(fs.readFileSync(o, "utf8"));
  const list = F.regions[reg];
  const t = list.find((x) => x.team === TEAM);
  const place = list.slice().sort((a, b) => b.pQual - a.pQual).findIndex((x) => x.team === TEAM) + 1;
  out.push({ d, pts: rows[idx].pts + d, place, p: 100 * t.pQual });
  console.log(`${(d >= 0 ? "+" : "") + d}`.padEnd(11) + String(rows[idx].pts + d).padEnd(7) +
    String(place).padEnd(18) + `${(100 * t.pQual).toFixed(1)}%`);
  fs.rmSync(f, { force: true }); fs.rmSync(o, { force: true });
}

/* Лінійна інтерполяція між найближчими точками — щоб не ганяти прогін заради
   кожного цілого очка. */
const at = (target) => {
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i], b = out[i + 1];
    if ((a.p - target) * (b.p - target) <= 0 && a.p !== b.p)
      return Math.round(a.pts + ((target - a.p) / (b.p - a.p)) * (b.pts - a.pts));
  }
  return null;
};
console.log("\nорієнтири:");
for (const t of [50, 75, 90, 95]) {
  const v = at(t);
  console.log(`  ${String(t).padStart(3)}% — ${v == null ? "поза межами прогону" : v + " очок (" + (v - rows[idx].pts >= 0 ? "+" : "") + (v - rows[idx].pts) + ")"}`);
}
