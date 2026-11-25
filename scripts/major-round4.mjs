import fs from "node:fs";

/**
 * Четвертий тур стадії 1 — у таблицю матчів.
 *
 * Тут BO1 не лишилося взагалі, і це не збіг. У четвертому турі грають рівно
 * два пули: 2-1 і 1-2. Перемога в першому дає третю — і вихід зі стадії;
 * поразка в другому дає третю — і виліт з мейджора. Жодного матчу, який
 * нічого не вирішує, у цьому турі немає, тож і BO1 немає теж.
 *
 * Шість матчів, а не вісім: дві команди вже вийшли з 3-0, дві вилетіли з 0-3,
 * і дванадцять, що лишилися, діляться на шість пар.
 *
 * Пари й час — зі сторінок матчів (id 2400573–2400578), з тієї ж причини, що
 * й у попередніх турах: сітка на сторінці події до жеребу показує здогад
 * симулятора, і він розходиться з реальним жеребом.
 *
 *   node scripts/major-round4.mjs          — показати
 *   node scripts/major-round4.mjs --apply  — залити
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
const R4 = [
  [1795672800000, "m80", "eternalfire", "BO3", "2-1 · за вихід"],
  [1795672800000, "heroic", "faze", "BO3", "1-2 · на виліт"],
  [1795681800000, "lynn", "parivision", "BO3", "2-1 · за вихід"],
  [1795681800000, "hundredthieves", "ninez", "BO3", "1-2 · на виліт"],
  [1795690800000, "imperial", "liquid", "BO3", "2-1 · за вихід"],
  [1795690800000, "wildcard", "chinggis", "BO3", "1-2 · на виліт"],
];

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}
const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

const rows = R4.map(([ms, a, b, format, pool]) => {
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
