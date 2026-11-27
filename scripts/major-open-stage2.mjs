import fs from "node:fs";
import { standings } from "./major-standings.mjs";

/**
 * Відкрити стадію 2: повний склад і чесний замок.
 *
 * Склад — це вісім посіяних прямо сюди плюс вісім, що пройшли першу стадію.
 * Друга половина не вписується руками: вона рахується з матчів, бо там вона
 * вже є. Той, у кого три перемоги, пройшов; переписувати ці вісім слаґів
 * означало б завести вісім нагод помилитися.
 *
 * Порядок має значення: картка показує команди в тому порядку, в якому вони
 * лежать у стадії. Спершу посіяні — вони сильніші за визначенням, — а далі
 * ті, хто пробився, від найкращого запису до найгіршого.
 *
 * Замок ставиться на початок найранішого матчу стадії, і це не дрібниця.
 * У першій стадії він стояв на дві години пізніше за перший матч, і хвилин
 * з чотирнадцять картку можна було правити, вже знаючи, хто як почав. Тут
 * час береться з самих матчів.
 *
 *   node scripts/major-open-stage2.mjs          — показати
 *   node scripts/major-open-stage2.mjs --apply  — відкрити
 */
const APPLY = process.argv.includes("--apply");
const STAGE = 2;
const SLUG = "pgl-major-singapore-2026";

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
const j = async (q) => (await fetch(API + q, { headers: H })).json();

const src = fs.readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const NAME = {};
for (const m of src.matchAll(/^\s{2}(\w[\w-]*): \{ slug: "([^"]+)", name: "([^"]+)"/gm)) NAME[m[2]] = m[3];

const [one, two] = await Promise.all([
  j("major_stages?select=teams&stage=eq.1").then((r) => r[0]),
  j(`major_stages?select=stage,title,teams,starts_at&stage=eq.${STAGE}`).then((r) => r[0]),
]);
if (!two) throw new Error("немає стадії 2");

/* Посіяні — ті, хто вже стоїть у стадії; їх вписували наперед, і вони не
   залежать ні від чого. */
const seeded = two.teams.filter((t) => !one.teams.includes(t));

const rec = await standings();
const through = one.teams
  .filter((t) => rec.get(t)?.w === 3)
  .sort((a, b) => rec.get(a).l - rec.get(b).l || a.localeCompare(b));

const teams = [...seeded, ...through];
if (teams.length !== 16) throw new Error(`склад на ${teams.length}, а не 16`);

/* Замок — перший матч стадії. */
const ms = await j(
  `matches?select=start_at&tournament_slug=eq.${SLUG}&stage=eq.${encodeURIComponent(two.title)}&order=start_at&limit=1`,
);
if (!ms.length) throw new Error("матчів стадії 2 ще немає — спершу залити їх");
const startsAt = ms[0].start_at;

const kyiv = (s) => new Date(s).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" });
console.log(`${two.title}: склад на ${teams.length}`);
console.log("  посіяні:  " + seeded.map((t) => NAME[t] ?? t).join(", "));
console.log("  пройшли:  " + through.map((t) => `${NAME[t] ?? t} (3-${rec.get(t).l})`).join(", "));
console.log(`\nзамок: ${kyiv(two.starts_at)}  →  ${kyiv(startsAt)}`);

const cards = await j(`major_pickem?select=user_id&stage=eq.${STAGE}`);
console.log(`карток на цю стадію вже: ${cards.length}`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб відкрити");
  process.exit(0);
}

const r = await fetch(API + `major_stages?stage=eq.${STAGE}`, {
  method: "PATCH", headers: H,
  body: JSON.stringify({ teams, starts_at: startsAt, updated_at: new Date().toISOString() }),
});
if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
console.log("\nвідкрито");
