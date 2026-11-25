import fs from "node:fs";

/**
 * Таблиця швейцарки — з наших же матчів.
 *
 * Рахунок у матчі стадії 1 це карти, а не раунди, тож перемога це просто
 * `score_a > score_b`. Більше тут нічого не треба: хто з ким грав, записано в
 * самих матчах, а запис команди — це кількість її перемог і поразок.
 *
 * Чому не з HLTV: вона ріже часті запити, а для нарахування очок потрібне
 * джерело, яке завжди під рукою і яким відповідає сам сайт. Якщо наші матчі
 * розійдуться з подією, то й ставки на них уже розійшлися, і лікувати це
 * треба там, а не тут.
 *
 *   node scripts/major-standings.mjs
 */
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
};

/** Запис кожної команди стадії 1: `{ w, l }` за слагом. */
export async function standings() {
  const ms = await (await fetch(
    API + "matches?select=team_a,team_b,status,score_a,score_b&tournament_slug=eq.pgl-major-singapore-2026",
    { headers: H },
  )).json();

  const rec = new Map();
  const seen = (t) => {
    if (!rec.has(t)) rec.set(t, { w: 0, l: 0 });
    return rec.get(t);
  };
  for (const m of ms) {
    const a = seen(m.team_a), b = seen(m.team_b);
    /* Незіграний матч лишає команду в таблиці з її поточним записом — інакше
       команда, якій щойно завели наступний матч, зникала б зі списку. */
    if (m.status !== "finished") continue;
    const aWon = m.score_a > m.score_b;
    (aWon ? a : b).w++;
    (aWon ? b : a).l++;
  }
  return rec;
}

/** Підсумок команди рядком — `3-0`, `1-3` тощо, або null, поки не визначено. */
export function outcome(r) {
  return r.w === 3 || r.l === 3 ? `${r.w}-${r.l}` : null;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const rec = await standings();
  const rows = [...rec.entries()].sort((x, y) => y[1].w - x[1].w || x[1].l - y[1].l);
  for (const [t, r] of rows) {
    const o = outcome(r);
    console.log(`  ${t.padEnd(16)} ${r.w}-${r.l}  ${o ? (r.w === 3 ? "вийшла" : "вилетіла") : ""}`);
  }
}
