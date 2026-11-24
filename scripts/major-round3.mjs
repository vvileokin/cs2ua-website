import fs from "node:fs";

/**
 * Третій тур стадії 1 — у таблицю матчів.
 *
 * Тут швейцарка вперше розпадається на три різні турніри, і формат це
 * показує. Пули 2-0 і 0-2 грають BO3, бо їхні матчі щось вирішують: перемога
 * в першому виводить зі стадії, поразка в другому виводить з мейджора. Пул
 * 1-1 лишається на BO1 — там іще нічого не закінчується.
 *
 * Тому формат тут не константа, як у перших двох турах, а колонка: вона
 * береться зі сторінки матчу HLTV і їде поруч із парою. Поставити скрізь BO1
 * означало б збрехати на картці матчу вдвічі — і про довжину серії, і про
 * ціну поразки.
 *
 * Пари й час — зі сторінок матчів (id 2400565–2400572), з тієї ж причини, що
 * й у другому турі: сітка на сторінці події до жеребу показує здогад
 * симулятора, і він розходиться з реальним жеребом.
 *
 *   node scripts/major-round3.mjs          — показати
 *   node scripts/major-round3.mjs --apply  — залити
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
const R3 = [
  [1795586400000, "heroic", "m80", "BO1", "1-1"],
  [1795586400000, "eternalfire", "hundredthieves", "BO1", "1-1"],
  [1795590000000, "parivision", "faze", "BO1", "1-1"],
  [1795590000000, "wildcard", "lynn", "BO1", "1-1"],
  [1795593600000, "imperial", "flyquest", "BO3", "2-0 · за вихід"],
  [1795593600000, "ninez", "sharks", "BO3", "0-2 · на виліт"],
  [1795602600000, "nip", "liquid", "BO3", "2-0 · за вихід"],
  [1795602600000, "bcgame", "chinggis", "BO3", "0-2 · на виліт"],
];

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}
const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

const rows = R3.map(([ms, a, b, format, pool]) => {
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
