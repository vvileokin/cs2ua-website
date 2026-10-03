import fs from "node:fs";

/**
 * Перерахунок стриків для всіх, із відповіддю на питання «а чи були розбіжності».
 *
 * Та сама логіка, що в `recomputeStreaks`: стрик — це відповіді поспіль, де
 * кожен матч зараховується цілком (усі відповіді в ньому правильні) або
 * обнуляє серію. Матчі програються в порядку їхнього початку, а не в порядку,
 * в якому адмін натискав «розрахувати», — інакше число залежало б від кліків.
 *
 * Навіщо окремо від маршруту: маршрут перераховує лише тих, кого зачепив
 * поточний розрахунок. Гравець, чиє питання колись видалили, лишався зі старим
 * числом назавжди — його ніхто більше не чіпав.
 *
 * Запуск: node scripts/recount-streaks.mjs [--apply]
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
const APPLY = process.argv.includes("--apply");

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

/** PostgREST віддає щонайбільше тисячу рядків за раз. */
async function all(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/${path}&limit=1000&offset=${from}`, { headers });
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

const [questions, matches, results, preds, bets, profiles] = await Promise.all([
  all("questions?select=id,match_id&order=id.asc"),
  all("matches?select=id,start_at,is_event&order=id.asc"),
  all("question_results?select=question_id,correct_option_id&order=question_id.asc"),
  all("predictions?select=user_id,question_id,option_id&order=user_id.asc"),
  all("bets?select=user_id,question_id,payout,settled_at&order=user_id.asc"),
  all("profiles?select=id,handle,streak,best_streak,bounty_streak&order=id.asc"),
]);

const matchOf = new Map(questions.map((q) => [q.id, q.match_id]));
const startOf = new Map(matches.map((m) => [m.id, m.start_at ?? ""]));
const eventOf = new Map(matches.map((m) => [m.id, !!m.is_event]));
const correct = new Map(results.map((r) => [r.question_id, r.correct_option_id]));

/** користувач → матч → список «влучив / не влучив» по розрахованих питаннях */
const byUser = new Map();
const put = (user, match, ok) => {
  let per = byUser.get(user);
  if (!per) byUser.set(user, (per = new Map()));
  const list = per.get(match) ?? [];
  list.push(ok);
  per.set(match, list);
};
for (const p of preds) {
  const answer = correct.get(p.question_id), match = matchOf.get(p.question_id);
  if (answer && match) put(p.user_id, match, p.option_id === answer);
}
/* Ставка — така сама відповідь: на платіжному питанні слип і є відповіддю, і
   без цього гравець, що ставив щораз і щораз угадував, лишався з нулем. */
for (const b of bets) {
  if (!b.settled_at) continue;
  const match = matchOf.get(b.question_id);
  if (match) put(b.user_id, match, (b.payout ?? 0) > 0);
}

const replay = (per, eventOnly) => {
  const ids = [...per.keys()]
    .filter((id) => (eventOnly ? eventOf.get(id) : true))
    .sort((a, b) => (startOf.get(a) ?? "").localeCompare(startOf.get(b) ?? "") || a.localeCompare(b));
  let streak = 0, best = 0;
  for (const id of ids) {
    const outcomes = per.get(id);
    streak = outcomes.every(Boolean) ? streak + outcomes.length : 0;
    if (streak > best) best = streak;
  }
  return { streak, best };
};

const fixes = [];
for (const p of profiles) {
  const per = byUser.get(p.id) ?? new Map();
  const all = replay(per, false), bounty = replay(per, true);
  const want = { streak: all.streak, best_streak: Math.max(all.best, p.best_streak ?? 0), bounty_streak: bounty.streak };
  if (want.streak !== (p.streak ?? 0) || want.bounty_streak !== (p.bounty_streak ?? 0) || want.best_streak !== (p.best_streak ?? 0)) {
    fixes.push({ id: p.id, handle: p.handle, was: { s: p.streak ?? 0, b: p.bounty_streak ?? 0, r: p.best_streak ?? 0 }, want });
  }
}

console.log(`профілів: ${profiles.length} · розбіжностей: ${fixes.length}`);
for (const f of fixes.slice(0, 25)) {
  console.log(
    `  ${(f.handle ?? f.id.slice(0, 8)).padEnd(20)} стрик ${f.was.s}→${f.want.streak}` +
    ` · івентовий ${f.was.b}→${f.want.bounty_streak} · рекорд ${f.was.r}→${f.want.best_streak}`,
  );
}
if (fixes.length > 25) console.log(`  …і ще ${fixes.length - 25}`);

if (!APPLY) {
  console.log("\nпробний прогін — нічого не записано. --apply щоб виправити");
  process.exit(0);
}

for (const f of fixes) {
  const r = await fetch(`${SB}/rest/v1/profiles?id=eq.${f.id}`, {
    method: "PATCH", headers, body: JSON.stringify(f.want),
  });
  if (!r.ok) console.error(`  ${f.handle}: ${r.status} ${await r.text()}`);
}
console.log(`\nвиправлено профілів: ${fixes.length}`);
