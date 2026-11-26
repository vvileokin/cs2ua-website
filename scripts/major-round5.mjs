import fs from "node:fs";

/**
 * П'ятий тур стадії 1 — останній.
 *
 * Пул один: 2-2. Шість команд, три пари, і кожна пара — це вихід проти
 * вильоту в одному матчі. П'ятеро вже вийшли (NiP і FlyQuest з 3-0, Liquid,
 * PARIVISION і Eternal Fire з 3-1), п'ятеро вже вдома. Ці троє — останні
 * місця в стадії 2.
 *
 * Пари й час — зі сторінок матчів (id 2400579–2400581). Звірка на здоровий
 * глузд тут обов'язкова: усі троє, що програють, мали бути з 2-1, а всі
 * троє, що виграють, — із 1-2. Lynn, Imperial і M80 справді програли свої
 * четверті, HEROIC, Wildcard і 100 Thieves справді виграли. Сходиться — отже
 * це жереб, а не прогноз симулятора.
 *
 *   node scripts/major-round5.mjs          — показати
 *   node scripts/major-round5.mjs --apply  — залити
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

const SLUG = "pgl-major-singapore-2026";
const STAGE = "Стадія 1";

/** [мітка часу, A, B, формат, пул]. Порядок команд — як на сторінці матчу. */
const R5 = [
  [1795759200000, "lynn", "heroic", "BO3", "2-2 · вихід або виліт"],
  [1795768200000, "imperial", "wildcard", "BO3", "2-2 · вихід або виліт"],
  [1795777200000, "m80", "hundredthieves", "BO3", "2-2 · вихід або виліт"],
];

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}
const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

const rows = R5.map(([ms, a, b, format, pool]) => {
  for (const t of [a, b]) if (!NAME[t]) throw new Error(`немає такого слага: ${t}`);
  return {
    id: `${a}-vs-${b}`,
    tournament_slug: SLUG,
    is_event: false,
    team_a: a,
    team_b: b,
    status: "upcoming",
    format,
    stage: STAGE,
    start_at: new Date(ms).toISOString(),
    open_questions: 0,
    max_reward: 0,
    updated_at: new Date().toISOString(),
    _pool: pool, _at: kyiv(ms),
  };
});

console.log("Київ            формат  пул              матч");
for (const r of rows) {
  console.log(`  ${r._at}   ${r.format}   ${r._pool.padEnd(15)} ${NAME[r.team_a]} — ${NAME[r.team_b]}`);
}

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  const body = rows.map(({ _pool, _at, ...row }) => row);
  const r = await fetch(API + "matches", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const back = await (await fetch(
    API + `matches?select=id&tournament_slug=eq.${SLUG}`, { headers: H },
  )).json();
  console.log(`\nзалито: ${body.length}. Усього матчів події: ${back.length}`);
}
