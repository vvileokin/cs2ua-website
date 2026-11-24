import fs from "node:fs";

/**
 * Другий тур стадії 1 — у таблицю матчів.
 *
 * Пари взяті зі сторінок матчів HLTV (id 2400557–2400564), а не з сітки на
 * сторінці події: та сітка до жеребу показує здогад симулятора за Бухгольцем,
 * і цього разу він розійшовся з реальним жеребом майже в кожній парі — він
 * обіцяв HEROIC — 9z і M80 — Chinggis, а насправді HEROIC грає з Chinggis, а
 * 9z з M80. Здогад виглядає точно так само, як факт, тому джерелом тут є
 * тільки сторінка матчу.
 *
 * Час — із `data-unix` тих самих сторінок, тобто момент, а не підпис. HLTV
 * малює години в часовому поясі браузера, і підпис «10:45» на одній машині
 * означав би «09:45» на іншій; мітка часу однакова всюди. У базу йде UTC,
 * сайт сам покаже київський.
 *
 * Час тримається за слотом, а не за парою, і це важливо: поки команд у слоті
 * немає, він стоїть із тимчасовою годиною, а щойно жереб проходить — HLTV її
 * уточнює. Так слот #2 з'їхав з 11:00 на 10:45, щойно в нього сіли HEROIC і
 * Chinggis. Тому години беруться після жеребу, а не до нього.
 *
 * Питань зі ставками тут немає свідомо. Лінії на ці матчі ще не виставили, а
 * варіант без коефіцієнта малюється як «×1.00» — ставка, що повертає рівно
 * стільки, скільки з'їла. Питання додається окремо, коли буде що в нього
 * покласти.
 *
 *   node scripts/major-round2.mjs          — показати
 *   node scripts/major-round2.mjs --apply  — залити
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

/** [слот HLTV, мітка часу, команда A, команда B, пул]. Порядок команд — як на
    сторінці матчу: він же визначає, чий рахунок зліва. */
const R2 = [
  ["#1", 1795509900000, "nip", "lynn", "1-0"],
  ["#2", 1795509900000, "heroic", "chinggis", "0-1"],
  ["#3", 1795514400000, "hundredthieves", "imperial", "1-0"],
  ["#4", 1795514400000, "ninez", "m80", "0-1"],
  ["#5", 1795518000000, "parivision", "flyquest", "1-0"],
  ["#6", 1795518000000, "eternalfire", "sharks", "0-1"],
  ["#7", 1795521600000, "liquid", "wildcard", "1-0"],
  ["#8", 1795521600000, "faze", "bcgame", "0-1"],
];

/* Назви — з каталогу сайту, щоб перевірити, що такі слаги взагалі є: помилка
   в слагу інакше вилізла б уже на сторінці, порожнім логотипом. */
const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}

const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit",
});

const rows = R2.map(([slot, ms, a, b, pool]) => {
  for (const t of [a, b]) if (!NAME[t]) throw new Error(`немає такого слага: ${t}`);
  return {
    id: `${a}-vs-${b}`,
    tournament_slug: SLUG,
    is_event: false,
    team_a: a,
    team_b: b,
    status: "upcoming",
    /* Другий тур увесь в одну карту: BO3 починаються там, де матч вирішує
       вихід або виліт, а це пули 2-0 і 0-2. */
    format: "BO1",
    stage: STAGE,
    start_at: new Date(ms).toISOString(),
    open_questions: 0,
    max_reward: 0,
    updated_at: new Date().toISOString(),
    _slot: slot, _pool: pool, _at: kyiv(ms),
  };
});

console.log("слот  Київ    пул    матч");
for (const r of rows) {
  console.log(` ${r._slot}   ${r._at}   ${r._pool}   ${NAME[r.team_a]} — ${NAME[r.team_b]}`);
}

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  const body = rows.map(({ _slot, _pool, _at, ...row }) => row);
  const r = await fetch(API + "matches", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const back = await (await fetch(
    API + `matches?select=id,start_at,status&tournament_slug=eq.${SLUG}&order=start_at`,
    { headers: H },
  )).json();
  console.log(`\nзалито: ${body.length}. Усього матчів події: ${back.length}`);
}
