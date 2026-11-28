import fs from "node:fs";

/**
 * Другий тур стадії 2.
 *
 * Швейцарка розвела 1-0 проти 1-0 і 0-1 проти 0-1. Вісім переможців першого
 * туру — FUT, MongolZ, Astralis, NiP, 1win, G2, NAVI, 100 Thieves; вісім
 * тих, хто програв, — FlyQuest, Lynn Vision, Imperial, Nemiga, Eternal Fire,
 * Liquid, PARIVISION, MIBR. Обидві вісімки нижче сходяться рівно, і жодна
 * пара не повторює першого туру: це і є перевірка, що жереб переписаний
 * правильно, а не вгаданий.
 *
 * Усі матчі BO1: до третьої перемоги й до третьої поразки ще далеко, BO3
 * почнуться там, де на кону вихід або виліт.
 *
 * Пари й час — зі сторінок матчів події 9304 (id 2400590–2400597). Саме зі
 * сторінок матчів, а не зі списку й не з сітки події: список ще хвилин
 * двадцять після жеребу віддавав «Swiss Round 2 #1» без команд, а сітка на
 * сторінці події показує прогноз симулятора, поки тур не розведено. Час
 * узятий із `data-unix`, а не з напису: напис HLTV малює в часовому поясі
 * того, хто дивиться, і з чужої машини він інший.
 *
 *   node scripts/major-stage2-round2.mjs          — показати
 *   node scripts/major-stage2-round2.mjs --apply  — залити
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
const R2 = [
  [1795857600000, "g2", "nip", "BO1", "1-0"],
  [1795857600000, "nemiga", "lynn", "BO1", "0-1"],
  [1795861800000, "onewin", "mongolz", "BO1", "1-0"],
  [1795861800000, "liquid", "eternalfire", "BO1", "0-1"],
  [1795865400000, "fut", "hundredthieves", "BO1", "1-0"],
  [1795865400000, "mibr", "imperial", "BO1", "0-1"],
  [1795869000000, "natus", "astralis", "BO1", "1-0"],
  [1795869000000, "flyquest", "parivision", "BO1", "0-1"],
];

/* Хто виграв і хто програв перший тур. Тримається тут не для краси: нижче
   кожна пара звіряється з цими списками, і помилка в жеребі — команда не з
   того пулу або та сама пара вдруге — зупиняє скрипт до заливки. Саме такий
   недогляд уже коштував нам перерахунку ставок. */
const WON = ["fut", "mongolz", "astralis", "nip", "onewin", "g2", "natus", "hundredthieves"];
const LOST = ["flyquest", "lynn", "imperial", "nemiga", "eternalfire", "liquid", "parivision", "mibr"];
/** Пари першого туру — для перевірки «без повторів». */
const R1 = [
  ["fut", "flyquest"], ["mongolz", "lynn"], ["astralis", "imperial"], ["nemiga", "nip"],
  ["g2", "liquid"], ["onewin", "eternalfire"], ["natus", "parivision"], ["mibr", "hundredthieves"],
];

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) {
  NAME[m[2]] = m[3];
}
const kyiv = (ms) => new Date(ms).toLocaleString("uk-UA", {
  timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

/* --------------------------------------------------------------- перевірки */
const seenR1 = new Set(R1.map(([a, b]) => [a, b].sort().join("|")));
const used = [];
for (const [, a, b, , pool] of R2) {
  for (const t of [a, b]) if (!NAME[t]) throw new Error(`немає такого слага: ${t}`);
  const want = pool === "1-0" ? WON : LOST;
  for (const t of [a, b]) {
    if (!want.includes(t)) throw new Error(`${NAME[t]} не з пулу ${pool}`);
  }
  if (seenR1.has([a, b].sort().join("|"))) {
    throw new Error(`${NAME[a]} — ${NAME[b]} уже грали в першому турі`);
  }
  used.push(a, b);
}
if (used.length !== 16 || new Set(used).size !== 16) {
  throw new Error(`команда грає двічі або не грає зовсім: ${used.length} імен, ${new Set(used).size} різних`);
}

console.log("Київ            формат  пул    матч");
for (const [ms, a, b, format, pool] of R2) {
  console.log(`  ${kyiv(ms)}   ${format}   ${pool}    ${NAME[a]} — ${NAME[b]}`);
}
console.log("\nпули сходяться, повторів першого туру немає, всі 16 команд на місці");

const now = new Date().toISOString();
const rows = R2.map(([ms, a, b, format]) => ({
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
  updated_at: now,
}));

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб залити");
} else {
  const r = await fetch(API + "matches", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const back = await (await fetch(
    API + `matches?select=id&tournament_slug=eq.${SLUG}`, { headers: H },
  )).json();
  console.log(`\nзалито: ${rows.length}. Усього матчів події: ${back.length}`);
}
