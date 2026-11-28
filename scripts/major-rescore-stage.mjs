import fs from "node:fs";

/**
 * Перерахувати вже зараховану стадію за чинним правилом влучання.
 *
 * Потрібен тоді, коли правило змінилося вже після нарахування. Саме це сталося
 * з 0108: кошик «прохід» підписаний у картці «3:1 3:2», а зараховувався на
 * будь-який підсумок із трійки, 3:0 включно, — тобто платив за промах повз
 * дорожчий кошик.
 *
 * `score_major_stage` тут не допоможе: вона бере тільки картки з порожнім
 * `scored_at`, а в зарахованої стадії він стоїть у всіх. Та й доплачує вона
 * різницю лише вгору — від'ємної доплати в ній немає, бо до цього випадку її
 * не бувало.
 *
 * Що робить скрипт:
 *   1. рахує картку заново тією самою формулою, що й база, — ціни кошиків,
 *      бонус за повну картку, правило влучання з 0108;
 *   2. пише нові `points` і `hits` на картку;
 *   3. правит різницю в `event_points` — у той самий гаманець, з якого
 *      платила `score_major_stage` (0105), і в обидва боки;
 *   4. сповіщає тих, у кого число змінилося.
 *
 * `updated_at` картки не чіпається: він третій ключ тайбрейка в таблиці стадії
 * (0096), і зсунути його означало б тихо переставити людей місцями за те, що
 * вони нічого не робили. `scored_at` теж лишається — стадія як була
 * зарахована, так і лишається зарахованою.
 *
 * Нижче нуля баланс не опускається: людина могла встигнути витратити зайве, і
 * мінус у гаманці зламав би їй наступну ставку. Про кожен такий випадок
 * скрипт скаже окремо.
 *
 *   node scripts/major-rescore-stage.mjs 1
 *   node scripts/major-rescore-stage.mjs 1 --apply
 */
const STAGE = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)));
const APPLY = process.argv.includes("--apply");
if (!STAGE) {
  console.error("використання: node scripts/major-rescore-stage.mjs <стадія> [--apply]");
  process.exit(1);
}

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
const j = async (q) => {
  const r = await fetch(API + q, { headers: H });
  const t = await r.text();
  if (!r.ok) throw new Error(`${q}: ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
};
const patch = async (path, body) => {
  const r = await fetch(API + path, { method: "PATCH", headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
};

/* Форма й ціни — дзеркало 0096. Тримати їх тут ще раз неприємно, але читати
   функції бази по REST не можна, а помилитися в них нічого не варто, тож
   нижче стоїть перевірка: сума за старим правилом мусить збігтися з тим, що
   вже лежить у картках. Не збіглася — формула розійшлася, і скрипт спиниться
   до того, як щось напише. */
const SHAPE = {
  swiss: { price: { "3-0": 150, adv: 50, "0-3": 150 }, picks: 10, perfect: 500 },
  playoff: { price: { champ: 500, final: 300, semi: 150 }, picks: 4, perfect: 300 },
};
const hitNew = (role, out) =>
  !out ? false : role === "adv" ? out === "3-1" || out === "3-2" : role === out;
/** Правило до 0108 — тільки щоб переконатися, що саме воно й було застосоване. */
const hitOld = (role, out) =>
  !out ? false : role === "adv" ? String(out).startsWith("3") : role === out;

const score = (picks, actual, shape, hit) => {
  let points = 0, hits = 0;
  for (const [team, role] of Object.entries(picks ?? {})) {
    if (hit(role, actual[team])) { points += shape.price[role] ?? 0; hits++; }
  }
  if (hits === shape.picks) points += shape.perfect;
  return { points, hits };
};

const [stage] = await j(`major_stages?select=stage,title,kind,actual,scored_at&stage=eq.${STAGE}`);
if (!stage) throw new Error(`стадії ${STAGE} немає`);
if (!stage.scored_at) throw new Error("стадія ще не зарахована — тут нема чого перераховувати");
const shape = SHAPE[stage.kind];
if (!shape) throw new Error(`невідомий вид стадії: ${stage.kind}`);

const cards = await j(`major_pickem?select=user_id,picks,points,hits&stage=eq.${STAGE}`);
const ids = [...new Set(cards.map((c) => c.user_id))];
const profs = [];
for (let i = 0; i < ids.length; i += 50) {
  profs.push(...await j(`profiles?select=id,handle,event_points&id=in.(${ids.slice(i, i + 50).join(",")})`));
}
const P = new Map(profs.map((p) => [p.id, p]));

/* --- запобіжник: чи справді в базі лежить старе правило ------------------ */
const mismatch = cards.filter((c) => {
  const old = score(c.picks, stage.actual, shape, hitOld);
  return old.points !== (c.points ?? 0) || old.hits !== (c.hits ?? 0);
});
if (mismatch.length) {
  console.error(`у ${mismatch.length} картках збережене число не сходиться зі старим правилом —`);
  console.error("формула в скрипті розійшлася з базою, нічого не чіпаю");
  for (const c of mismatch.slice(0, 5)) {
    const old = score(c.picks, stage.actual, shape, hitOld);
    console.error(`  ${c.user_id}: у базі ${c.points}/${c.hits}, порахував ${old.points}/${old.hits}`);
  }
  process.exit(1);
}
console.log(`${stage.title}: ${cards.length} карток, збережені числа сходяться зі старим правилом`);

/* --- новий розрахунок ---------------------------------------------------- */
const plan = cards.map((c) => {
  const now = score(c.picks, stage.actual, shape, hitNew);
  const p = P.get(c.user_id);
  const d = now.points - (c.points ?? 0);
  const want = Math.max((p?.event_points ?? 0) + d, 0);
  return {
    id: c.user_id, handle: p?.handle ?? c.user_id.slice(0, 8),
    wasP: c.points ?? 0, wasH: c.hits ?? 0, nowP: now.points, nowH: now.hits, d,
    bal: p?.event_points ?? 0, want,
    floored: (p?.event_points ?? 0) + d < 0,
  };
});
const moved = plan.filter((x) => x.d !== 0 || x.wasH !== x.nowH);

console.log(`\nзміниться в ${moved.length} картках із ${plan.length}`);
for (const x of moved.sort((a, b) => a.d - b.d).slice(0, 40)) {
  console.log(
    `  ${String(x.handle).padEnd(22)} ${String(x.wasP).padStart(4)} -> ${String(x.nowP).padStart(4)}` +
    ` (${x.d > 0 ? "+" : ""}${x.d})  влучань ${x.wasH} -> ${x.nowH}` +
    `  гаманець ${String(x.bal).padStart(6)} -> ${String(x.want).padStart(6)}` +
    (x.floored ? "   <- ОБРІЗАНО ДО НУЛЯ" : ""),
  );
}
if (moved.length > 40) console.log(`  …і ще ${moved.length - 40}`);
console.log(`\nразом по очках: ${plan.reduce((s, x) => s + x.d, 0)}`);
const flo = plan.filter((x) => x.floored);
if (flo.length) console.log(`балансів, що впали б у мінус і обрізані до нуля: ${flo.length}`);

if (!APPLY) {
  console.log("\nпробний прогін — нічого не змінено. --apply щоб перерахувати");
  process.exit(0);
}

for (const x of moved) {
  await patch(`major_pickem?user_id=eq.${x.id}&stage=eq.${STAGE}`,
    { points: x.nowP, hits: x.nowH });
  if (x.d !== 0) await patch(`profiles?id=eq.${x.id}`, { event_points: x.want });
}
console.log(`\nперераховано карток: ${moved.length}`);

const notes = moved.filter((x) => x.d !== 0).map((x) => ({
  user_id: x.id,
  kind: "major",
  title:
    `${stage.title} перерахована · «прохід» це 3:1 і 3:2, 3:0 має власний кошик. ` +
    `Тепер ${x.nowH} із ${shape.picks}, ${x.d > 0 ? "+" : ""}${x.d} очок`,
}));
for (let i = 0; i < notes.length; i += 200) {
  const r = await fetch(API + "notifications", {
    method: "POST", headers: H, body: JSON.stringify(notes.slice(i, i + 200)),
  });
  if (!r.ok) throw new Error("сповіщення: " + (await r.text()).slice(0, 300));
}
console.log(`сповіщень: ${notes.length}`);
