import fs from "node:fs";

/**
 * Перевести матчі PGL, що вже почались, у статус «live» і внести вето.
 *
 * `pgl-round1.mjs` рахує статус від часу свого запуску, і це правильно для
 * заливки, але матч не питає скрипт, коли йому починатись. Перші дві пари
 * стартували о 07:00 UTC, у базі лишились `upcoming`, а сайт читає цю колонку
 * напряму — тож картка показувала «очікується», і головне, приймала ставки за
 * доматчевим коефіцієнтом на матч, який уже йде.
 *
 * Вето заразом: воно публікується на старті, а в заливці стояло порожнім.
 * Карти лишаються порожніми доти, доки якась не дограна — рядок із 0:0 виглядав
 * би як зіграна карта з нульовим рахунком.
 *
 * Чому окремий скрипт, а не повторний прогін заливки: та перезаписала б
 * `score_a`, `score_b`, `maps` і `veto` нулями, бо вона їх так і ставить. Поки
 * рахунків немає — байдуже, а з першою ж дограною картою це стерло б результат.
 * Тут оновлюються рівно дві колонки.
 *
 * Запуск: node scripts/pgl-live.mjs --apply
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const APPLY = process.argv.includes("--apply");

/** `b` — ban, `p` — pick, решта лишається вирішальною. Команда «a» чи «b». */
const V = (map, team, action) => ({ map, team, action });

/* Вето зі сторінок матчів HLTV. Порядок той самий, що там: сім кроків, останній
   — карта, яка лишилась. */
const LIVE = {
  "aurora-vs-mongolz-pgl26": [
    V("Anubis", "b", "ban"),
    V("Ancient", "a", "ban"),
    V("Inferno", "b", "pick"),
    V("Nuke", "a", "pick"),
    V("Mirage", "a", "ban"),
    V("Cache", "b", "ban"),
    V("Dust2", "-", "decider"),
  ],
  "fut-vs-tyloo-pgl26": [
    V("Dust2", "b", "ban"),
    V("Inferno", "a", "ban"),
    V("Nuke", "b", "pick"),
    V("Ancient", "a", "pick"),
    V("Cache", "a", "ban"),
    V("Anubis", "b", "ban"),
    V("Mirage", "-", "decider"),
  ],
};

const get = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const ids = Object.keys(LIVE);
const rows = await get(
  `matches?select=id,status,start_at,score_a,score_b,maps&id=in.(${ids.join(",")})`,
);

console.log("матч                        зараз      стане   вето   рахунок");
for (const m of rows) {
  const veto = LIVE[m.id];
  console.log(
    `  ${m.id.replace("-pgl26", "").padEnd(24)}${m.status.padEnd(11)}live` +
    `${String(veto.length).padStart(7)}${`   ${m.score_a}:${m.score_b}`}`,
  );
  if (m.score_a || m.score_b || (m.maps ?? []).length) {
    console.log("    увага: у матчі вже є рахунок — колонки score/maps не чіпаємо");
  }
}

if (!APPLY) {
  console.log("\nпробний прогін — нічого не змінено. --apply щоб оновити");
} else {
  console.log();
  for (const m of rows) {
    const r = await fetch(`${SB}/rest/v1/matches?id=eq.${m.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ status: "live", veto: LIVE[m.id] }),
    });
    if (!r.ok) throw new Error(`${m.id}: ${r.status} ${await r.text()}`);
    console.log(`оновлено ${m.id.replace("-pgl26", "")}`);
  }
  console.log("\nрахунки вносяться далі через адмінку, як завжди");
}
