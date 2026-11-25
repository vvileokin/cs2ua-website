import fs from "node:fs";

/**
 * Питання «Хто переможе?» на матчі четвертого туру — з лінією BetKing.
 *
 * Коефіцієнти зняті з HLTV, де BetKing стоїть окремим рядком у списку
 * букмекерів разом із ggua. Це та сама контора, що й у пігулці на сторінці
 * мейджора, тож числа на сайті й числа в пігулці походять з одного джерела.
 * Чужий рядок (ggua) сюди не береться навіть як запасний: під пігулкою з
 * логотипом BetKing має стояти лінія BetKing, інакше напис бреше.
 *
 * Матч без лінії лишається без питання. Варіант без коефіцієнта малюється як
 * «×1.00» — ставка, що повертає рівно стільки, скільки з'їла, — і це гірше за
 * відсутнє питання: воно виглядає як пропозиція, а нею не є.
 *
 * Скрипт тільки відкриває питання. Те, що вже відкрите, він не чіпає взагалі —
 * ні `odds`, ні `open`. Перша версія перезаписувала `odds` на кожному прогоні
 * й на другому запуску відкотила лінію до тієї, з якою питання відкрилося:
 * коефіцієнт після відкриття живе своїм життям, і скрипт відкриття в це не
 * лізе. Тому його можна ганяти скільки завгодно — він щоразу додає лише те,
 * чого ще немає.
 *
 *   node scripts/major-round4-odds.mjs          — показати
 *   node scripts/major-round4-odds.mjs --apply  — залити
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

/** Лінія BetKing, у порядку команд матчу. */
const ODDS = {
  "m80-vs-eternalfire": [2.00, 1.80],
  "heroic-vs-faze": [1.85, 1.95],
  "lynn-vs-parivision": [4.20, 1.23],
  "hundredthieves-vs-ninez": [1.73, 2.10],
  "wildcard-vs-chinggis": [1.32, 3.33],
  /* Imperial — Liquid: BetKing ринку не відкрив. Узято лінію ggua і
     перераховано під його маржу — 2.71/1.45 у ggua це 65,1% на Liquid, і з
     нашими 5,7% виходить рівно те саме з точністю до копійки. Збіг тут не
     випадковий: маржі в обох контор близькі, а думка про матч одна. */
  "imperial-vs-liquid": [2.72, 1.45],
};

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}

const j = async (q) => (await fetch(API + q, { headers: H })).json();
const ids = Object.keys(ODDS);
const matches = await j(
  `matches?select=id,team_a,team_b,start_at&id=in.(${ids.join(",")})`,
);
const have = new Set((await j(
  `questions?select=id&id=like.q-major-s1r4-*`,
)).map((q) => q.id));

const now = new Date().toISOString();
const rows = [];
const kept = [];
for (const m of matches) {
  const [oa, ob] = ODDS[m.id];
  const id = `q-major-s1r4-${m.team_a}`;
  if (have.has(id)) { kept.push(m.id); continue; }
  const opt = (k, slug, odds) => ({
    id: k, label: NAME[slug] ?? slug, reward: 50, odds,
    /* `open` — ціна, за якою питання відкрилося. Ставиться тут і більше
       ніколи: різниця між нею і поточною показує, куди поїхала лінія. */
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

console.log("матч                          лінія BetKing");
for (const r of rows) {
  const [a, b] = r.options;
  console.log(`  ${r.match_id.padEnd(26)} ${a.label} ${a.odds}  /  ${b.label} ${b.odds}`);
}
if (kept.length) console.log(`уже відкриті, не чіпаю: ${kept.join(", ")}`);
const missing = 6 - rows.length - kept.length;
if (missing) console.log(`без лінії поки що: ${missing} (питання не створюється)`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  const put = async (table, body) => {
    const r = await fetch(API + table, {
      method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${table} → ${r.status} ${await r.text()}`);
  };
  if (!rows.length) { console.log("нема чого відкривати"); process.exit(0); }
  await put("questions", rows);
  /* Лічильник на картці матчу — інакше матч із питанням виглядає як матч без
     нього, і на нього просто не заходять.

     PATCH, а не upsert: POST із `merge-duplicates` підставляє на місце рядка
     той, що йому дали, цілком — три колонки тут означали б, що решта тридцяти
     стає `null`. Для часткової зміни в PostgREST є PATCH, і це той випадок. */
  for (const m of matches.filter((x) => rows.some((r) => r.match_id === x.id))) {
    const r = await fetch(API + `matches?id=eq.${m.id}`, {
      method: "PATCH", headers: H,
      body: JSON.stringify({ open_questions: 1, max_reward: 50, updated_at: now }),
    });
    if (!r.ok) throw new Error(`matches ${m.id} → ${r.status} ${await r.text()}`);
  }
  console.log(`\nзалито питань: ${rows.length}`);
}
