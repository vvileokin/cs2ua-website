import fs from "node:fs";

/**
 * Перший тур стадії 2.
 *
 * Шістнадцять команд: вісім посіяних прямо в другу стадію і вісім, що
 * пройшли першу. Жереб зводить їх попарно одне проти одного — у кожній
 * парі посіяний проти того, хто пробився, і це видно в усіх восьми рядках
 * нижче.
 *
 * Усі матчі BO1: перший тур швейцарки нічого не вирішує, BO3 почнуться там,
 * де на кону вихід або виліт.
 *
 * Пари й час — зі сторінок матчів події 9304 (id 2400582–2400589).
 *
 *   node scripts/major-stage2-round1.mjs          — показати
 *   node scripts/major-stage2-round1.mjs --apply  — залити
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
const STAGE = "Стадія 2";

/** [мітка часу, A, B, формат, пул]. Порядок команд — як на сторінці матчу. */
const R1 = [
  [1795838400000, "fut", "flyquest", "BO1", "1 тур"],
  [1795838400000, "mongolz", "lynn", "BO1", "1 тур"],
  [1795842000000, "astralis", "imperial", "BO1", "1 тур"],
  [1795842000000, "nemiga", "nip", "BO1", "1 тур"],
  [1795845600000, "g2", "liquid", "BO1", "1 тур"],
  [1795845600000, "onewin", "eternalfire", "BO1", "1 тур"],
  [1795849200000, "natus", "parivision", "BO1", "1 тур"],
  [1795849200000, "mibr", "hundredthieves", "BO1", "1 тур"],
];

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}
const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

const rows = R1.map(([ms, a, b, format, pool]) => {
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
