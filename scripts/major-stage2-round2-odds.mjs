import fs from "node:fs";

/**
 * Питання «Хто переможе?» на матчі другого туру стадії 2 — з лінією BetKing.
 *
 * Цього разу BetKing виставив усі вісім пар, тож жодного рядка не довелося
 * ні позичати в ggua, ні рахувати моделлю: під пігулкою з логотипом BetKing
 * усюди стоїть лінія BetKing. Так і має бути — `major-line.mjs` існує для
 * турів, де контора відкрила ринок не на всі пари, а не замість неї.
 *
 * Скрипт тільки відкриває питання. Те, що вже відкрите, він не чіпає
 * взагалі — ні `odds`, ні `open`: коефіцієнт після відкриття живе своїм
 * життям, і скрипт відкриття в це не лізе. Тому його можна ганяти скільки
 * завгодно — він щоразу додає лише те, чого ще немає.
 *
 *   node scripts/major-stage2-round2-odds.mjs          — показати
 *   node scripts/major-stage2-round2-odds.mjs --apply  — залити
 */
const APPLY = process.argv.includes("--apply");

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY,
  "content-type": "application/json",
};

/** Лінія BetKing, у порядку команд матчу. Знята з їхньої ж сторінки. */
const ODDS = {
  "g2-vs-nip": [1.70, 2.14],
  "nemiga-vs-lynn": [1.38, 3.00],
  "onewin-vs-mongolz": [2.36, 1.58],
  "liquid-vs-eternalfire": [1.70, 2.14],
  "fut-vs-hundredthieves": [1.45, 2.71],
  "mibr-vs-imperial": [1.48, 2.62],
  "natus-vs-astralis": [1.22, 4.25],
  "flyquest-vs-parivision": [2.57, 1.50],
};

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}

const j = async (q) => (await fetch(API + q, { headers: H })).json();
const ids = Object.keys(ODDS);
const matches = await j(`matches?select=id,team_a,team_b,start_at&id=in.(${ids.join(",")})`);
const have = new Set((await j("questions?select=id&id=like.q-major-s2r2-*")).map((q) => q.id));

const missing = ids.filter((id) => !matches.some((m) => m.id === id));
if (missing.length) throw new Error(`немає таких матчів: ${missing.join(", ")} — спершу major-stage2-round2.mjs`);

const now = new Date().toISOString();
const rows = [];
const kept = [];
for (const m of matches) {
  const [oa, ob] = ODDS[m.id];
  const id = `q-major-s2r2-${m.team_a}`;
  if (have.has(id)) { kept.push(m.id); continue; }
  const opt = (k, slug, odds) => ({
    id: k, label: NAME[slug] ?? slug, reward: 50, odds,
    /* `open` — ціна, за якою питання відкрилося. Ставиться тут і більше
       ніколи: різниця між нею і поточною показує, куди поїхала лінія, і саме
       ці ціни потім калібрують модель у `major-line.mjs`. */
    open: odds,
  });
  rows.push({
    id,
    match_id: m.id,
    kind: "match_winner",
    title: "Хто переможе?",
    difficulty: "easy",
    status: "open",
    deadline_label: "до старту матчу",
    options: [opt("oa", m.team_a, oa), opt("ob", m.team_b, ob)],
    betting: true,
    live_odds: true,
    updated_at: now,
  });
}

console.log("матч                           лінія BetKing               маржа");
for (const r of rows) {
  const [a, b] = r.options;
  const over = 1 / a.odds + 1 / b.odds;
  console.log(
    `  ${r.match_id.padEnd(28)} ${a.label} ${a.odds}  /  ${b.label} ${b.odds}` +
    `   ${((over - 1) * 100).toFixed(1)}%`,
  );
}
if (kept.length) console.log(`уже відкриті, не чіпаю: ${kept.join(", ")}`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  if (!rows.length) { console.log("нема чого відкривати"); process.exit(0); }
  const r = await fetch(API + "questions", {
    method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`questions → ${r.status} ${await r.text()}`);
  /* Лічильник на картці матчу — інакше матч із питанням виглядає як матч без
     нього, і на нього просто не заходять.

     PATCH, а не upsert: POST із `merge-duplicates` підставляє на місце рядка
     той, що йому дали, цілком — три колонки тут означали б, що решта стає
     `null`. Для часткової зміни в PostgREST є PATCH, і це той випадок. */
  for (const m of matches.filter((x) => rows.some((r2) => r2.match_id === x.id))) {
    const p = await fetch(API + `matches?id=eq.${m.id}`, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ open_questions: 1, max_reward: 50, updated_at: now }),
    });
    if (!p.ok) throw new Error(`matches ${m.id} → ${p.status} ${await p.text()}`);
  }
  console.log(`\nзалито питань: ${rows.length}`);
}
