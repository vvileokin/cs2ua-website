import fs from "node:fs";

/**
 * Два матчі швейцарки EPL S24, яких у базі не було.
 *
 * Знайшлись через сітку: колонка 1:1 показувала три пари замість чотирьох, а
 * 2:2 — одну замість трьох. Перепрогравання показало, чому саме: у MOUZ не
 * вистачало двох перемог, тож рахунки їхніх суперників перед наступними турами
 * виходили не ті, і картки сідали в сусідні колонки.
 *
 * Обидва матчі MOUZ виграли, обидва пропущені при заведенні турів — другого
 * жовтневого і третього.
 *
 * Ідентифікатори з суфіксом туру: `furia-vs-mouz-epl24` уже зайнятий
 * чвертьфіналом тих самих команд, а `mouz-vs-spirit-2` — іншим записом
 * півфіналу. Коли команди за турнір зустрічаються двічі, назви за самими
 * командами більше не вистачає.
 *
 * Питань не чіпляємо: турнір дограно, ставити нема на що.
 *
 * Запуск: node scripts/epl-missing-swiss.mjs --apply
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const MISSING = [
  {
    id: "furia-vs-mouz-epl24-r2",
    team_a: "furia", team_b: "mouz", score_a: 0, score_b: 2,
    stage: "Швейцарка · тур 2", start_at: "2026-10-04T14:30:00+00:00",
  },
  {
    id: "spirit-vs-mouz-epl24-r3",
    team_a: "spirit", team_b: "mouz", score_a: 0, score_b: 2,
    stage: "Швейцарка · тур 3", start_at: "2026-10-05T17:00:00+00:00",
  },
];

const rows = MISSING.map((m) => ({
  ...m,
  tournament_slug: "esl-pro-league-s24",
  is_event: false,
  status: "finished",
  format: "BO3",
  maps: [], veto: [], h2h: null,
  open_questions: 0, max_reward: 0,
}));

for (const m of MISSING) {
  console.log(`${m.stage.padEnd(22)} ${m.team_a} ${m.score_a}:${m.score_b} ${m.team_b}  (${m.id})`);
}

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб залити");
  process.exit(0);
}

const r = await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/matches`, {
  method: "POST",
  headers: {
    apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(rows),
});
if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
console.log(`\nзаписано: ${rows.length} матчів`);
