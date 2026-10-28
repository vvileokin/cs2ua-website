import fs from "node:fs";

/**
 * Заливка розкладу VRS по командах у major_team_detail.
 *
 * Вхід — team-detail.json, який робить vrs-model/team-detail.mjs. Тут нічого
 * не рахується: скрипт лише зіставляє назву з HLTV зі слагом каталогу команд
 * і кладе payload як є.
 *
 * Запуск:
 *   node vrs-model/team-detail.mjs 30000 > team-detail.json
 *   node scripts/major-team-push.mjs ../vrs-model/team-detail.json --apply
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL, KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !KEY) { console.error("немає NEXT_PUBLIC_SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

/** Назва в рейтингу HLTV → слаг каталогу. Решта команд сторінки не має. */
const SLUG = {
  "Natus Vincere": "natus", "B8": "b8", "Inner Circle": "innercircle", "G2": "g2",
  "fnatic": "fnatic", "FUT": "fut", "Astralis": "astralis", "Eternal Fire": "eternalfire",
};

const file = process.argv[2];
if (!file) { console.error("вкажи шлях до team-detail.json"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));

const rows = [];
for (const [name, payload] of Object.entries(data.teams)) {
  const slug = SLUG[name];
  if (!slug) { console.log(`  пропущено (немає слага): ${name}`); continue; }
  rows.push({ slug, as_of: data.asOf, runs: data.runs, payload });
}

console.log(`зріз ${data.asOf} · прогонів ${data.runs} · команд ${rows.length}\n`);
console.log("слаг           команда          очки   прохід   місце   +за ЛАН");
for (const r of rows) {
  const p = r.payload;
  console.log(`  ${r.slug.padEnd(13)}${p.team.padEnd(16)}${String(p.pts).padStart(5)}` +
    `${(100 * p.pQual).toFixed(1).padStart(8)}%${p.place.toFixed(1).padStart(8)}` +
    `${("+" + p.lanGain).padStart(10)}`);
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін. --apply щоб записати");
  process.exit(0);
}

const res = await fetch(`${SB}/rest/v1/major_team_detail?on_conflict=slug`, {
  method: "POST",
  headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
if (!res.ok) { console.error(`\nне записалось: ${res.status} ${await res.text()}`); process.exit(1); }
console.log(`\nзаписано ${rows.length} рядків`);
