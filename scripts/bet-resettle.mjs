import fs from "node:fs";

/**
 * Перерахувати ставки на питанні, яке розрахували не на той варіант.
 *
 * Помилка адміна: `settle_bets` викликали з чужим `correct_option_id`. Вона
 * нічого не питає й нічого не перевіряє — хто вказаний, той і виграв. Тому
 * відкат мусить бути повний: гроші, ставки, результат, серії.
 *
 * Чому не можна просто покликати `settle_bets` ще раз із правильним варіантом
 * — вона бере тільки `settled_at is null`. Усі ставки вже розраховані, і
 * другий виклик не зробить нічого.
 *
 * ---------------------------------------------------------------------------
 * Порядок кроків, і чому саме такий
 * ---------------------------------------------------------------------------
 * 1. ЗАБРАТИ помилкову виплату. Точно зворотна дія до `settle_bets` (0079):
 *    івентовий гаманець отримав усю виплату, сезонна колонка — тільки
 *    прибуток, `ewc_earned_points` — його ж. Віднімаємо те саме.
 * 2. РОЗРАХУВАТИ НАЗАД усі ставки питання: `payout = 0`, `settled_at = null`.
 *    Інакше крок 5 їх не побачить. `odds` не чіпаємо: при `live_odds` функція
 *    однаково перепише їх фінальним коефіцієнтом переможця.
 * 3. ВИПРАВИТИ результат у `question_results`.
 * 4. ПОВЕРНУТИ СЕРІЇ НА МОМЕНТ ПЕРЕД МАТЧЕМ. Це головне й найтонше місце.
 *    Множник виплати (×1.25 / ×1.5 / ×2 на серії 3 / 5 / 10) `settle_bets`
 *    бере з `profiles.streak` — тобто з того, що в профілі зараз. А зараз там
 *    наслідок помилки: у тих, хто ставив на справжнього переможця, серія
 *    згоріла, і вони отримали б виплату без множника, який заробили.
 *
 *    Тому серія кожного ставника відтворюється наново з нуля — по всіх його
 *    відповідях у хронологічному порядку матчів, з уже виправленим
 *    результатом, і обрізається рівно перед цим матчем. Саме «перед», а не
 *    «зараз»: множник має бути той, з яким людина заходила в матч. Порядок —
 *    за початком матчу, а не за часом натискання «розрахувати», бо клік
 *    адміна не має впливати на число.
 * 5. РОЗРАХУВАТИ питання правильно — тією самою `settle_bets`, що працює на
 *    сайті. Переписувати її формулу тут було б другим джерелом правди, а
 *    розбіжність у формулі, що рахує гроші, виявилася б не одразу.
 * 6. ПЕРЕРАХУВАТИ СЕРІЇ остаточно, по всій базі — як `recount-streaks.mjs`.
 *    Крок 4 свідомо лишив у профілях «серію перед матчем»; тут вона
 *    доганяється до справжньої, уже з правильним результатом.
 * 7. РЕКОРД (`best_streak`) опускаємо тільки там, де його поставила сама
 *    помилка — тобто де поточний рекорд дорівнює найкращій серії, порахованій
 *    зі старим, хибним результатом, і більший за найкращу з правильним.
 *    Загальний перерахунок цього не зробить: він бере `max` зі старим
 *    значенням, щоб не зрізати рекорди тих часів, коли ставок ще не було.
 * 8. СПОВІСТИТИ всіх ставників. Людина, у якої баланс сам змінився в обидві
 *    сторони, має прочитати, чому.
 *
 * Якщо впаде посередині — видно де: ставки нерозраховані, результат уже
 * правильний, і повторний запуск доробить решту (крок 1 пропустить сам, бо
 * шукає `payout > 0` на розрахованих ставках).
 *
 *   node scripts/bet-resettle.mjs <question_id> <option_id>
 *   node scripts/bet-resettle.mjs <question_id> <option_id> --apply
 */

const [QUESTION, OPTION] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
if (!QUESTION || !OPTION) {
  console.error("використання: node scripts/bet-resettle.mjs <question_id> <option_id> [--apply]");
  process.exit(1);
}

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const get = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};
/** PostgREST віддає щонайбільше тисячу рядків за раз. */
const all = async (path) => {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await get(`${path}&limit=1000&offset=${from}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
};
const patch = async (path, body) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    method: "PATCH", headers: H, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path}: ${r.status} ${await r.text()}`);
};

/* ------------------------------------------------------------------ читаємо */
const [[question], results, questions, matches, preds, bets, profiles] = await Promise.all([
  get(`questions?select=id,match_id,options,live_odds,betting&id=eq.${encodeURIComponent(QUESTION)}`),
  all("question_results?select=question_id,correct_option_id&order=question_id.asc"),
  all("questions?select=id,match_id&order=id.asc"),
  all("matches?select=id,team_a,team_b,start_at,is_event,score_a,score_b&order=id.asc"),
  all("predictions?select=user_id,question_id,option_id&order=user_id.asc"),
  all("bets?select=user_id,question_id,option_id,stake,odds,payout,settled_at,wallet&order=user_id.asc"),
  all("profiles?select=id,handle,points,event_points,ewc_earned_points,streak,best_streak,bounty_streak&order=id.asc"),
]);

if (!question) throw new Error(`питання ${QUESTION} немає`);
const option = question.options.find((o) => o.id === OPTION);
if (!option) throw new Error(`варіанта ${OPTION} у питанні немає`);

const match = matches.find((m) => m.id === question.match_id);
const wasResult = results.find((r) => r.question_id === QUESTION)?.correct_option_id ?? null;
const was = question.options.find((o) => o.id === wasResult);
const mine = bets.filter((b) => b.question_id === QUESTION);
const P = new Map(profiles.map((p) => [p.id, p]));
const who = (p) => String(p.handle ?? p.id.slice(0, 8)).padEnd(20);

console.log(`питання   ${QUESTION}`);
console.log(`матч      ${match?.team_a} ${match?.score_a}:${match?.score_b} ${match?.team_b}  (${match?.start_at})`);
console.log(`було      ${wasResult} — ${was?.label ?? "?"}`);
console.log(`стане     ${OPTION} — ${option.label}  коеф ${option.odds}${question.live_odds ? " (live)" : ""}`);
console.log(`ставок    ${mine.length}, з них розрахованих ${mine.filter((b) => b.settled_at).length}`);
if (wasResult === OPTION) console.log("\nувага: результат уже такий — буде лише перерахунок виплат");

/* ------------------------------------------ крок 1: забрати помилкову виплату */
const overpaid = mine.filter((b) => b.settled_at && (b.payout ?? 0) > 0);
const clawback = overpaid.map((b) => {
  const p = P.get(b.user_id);
  const profit = Math.max((b.payout ?? 0) - b.stake, 0);
  const ev = b.wallet === "event";
  const want = {
    event_points: p.event_points - (ev ? b.payout : 0),
    points: p.points - (ev ? profit : b.payout),
    ewc_earned_points: p.ewc_earned_points - (ev ? profit : 0),
  };
  /* Нижче нуля не опускаємо: якщо людина встигла витратити помилкові очки,
     мінусовий баланс зламає `place_bet` усім наступним викликом. Про кожен
     такий випадок скрипт скаже окремо — це вже рішення людини, не скрипта. */
  const floored = Object.entries(want).filter(([, v]) => v < 0).map(([k]) => k);
  for (const k of floored) want[k] = 0;
  return { bet: b, p, want, floored };
});

console.log(`\n-- 1. забрати помилкову виплату: ${clawback.length} людей --`);
for (const c of clawback.sort((a, b) => b.bet.payout - a.bet.payout)) {
  console.log(
    `  ${who(c.p)} ставка ${String(c.bet.stake).padStart(5)}` +
    ` · виплата ${String(c.bet.payout).padStart(6)}` +
    ` · івент ${String(c.p.event_points).padStart(6)} -> ${String(c.want.event_points).padStart(6)}` +
    ` · сезон ${String(c.p.points).padStart(6)} -> ${String(c.want.points).padStart(6)}` +
    (c.floored.length ? `   <- ОБРІЗАНО ДО НУЛЯ: ${c.floored.join(", ")}` : ""),
  );
}
console.log(`  разом знімається ${overpaid.reduce((s, b) => s + b.payout, 0)} очок`);

/* ------------------------------- кроки 4-5: серії перед матчем і нові виплати */
const matchOf = new Map(questions.map((q) => [q.id, q.match_id]));
const startOf = new Map(matches.map((m) => [m.id, m.start_at ?? ""]));
const eventOf = new Map(matches.map((m) => [m.id, !!m.is_event]));
const order = (a, b) =>
  (startOf.get(a) ?? "").localeCompare(startOf.get(b) ?? "") || a.localeCompare(b);

/**
 * користувач → матч → список «влучив / не влучив».
 * `answer` задає результати, `skipQuestion` виймає одне питання з історії.
 */
function tally(answer, { skipQuestion = null } = {}) {
  const byUser = new Map();
  const put = (user, m, ok) => {
    let per = byUser.get(user);
    if (!per) byUser.set(user, (per = new Map()));
    per.set(m, [...(per.get(m) ?? []), ok]);
  };
  for (const p of preds) {
    if (p.question_id === skipQuestion) continue;
    const a = answer.get(p.question_id), m = matchOf.get(p.question_id);
    if (a && m) put(p.user_id, m, p.option_id === a);
  }
  /* Ставка — така сама відповідь: на платіжному питанні слип і є відповіддю. */
  for (const b of bets) {
    if (b.question_id === skipQuestion) continue;
    if (b.question_id === QUESTION) {
      /* Це питання зараз розраховане неправильно, і його `payout` брехливий.
         Беремо не виплату, а сам варіант проти `answer`. */
      const a = answer.get(b.question_id), m = matchOf.get(b.question_id);
      if (a && m) put(b.user_id, m, b.option_id === a);
      continue;
    }
    if (!b.settled_at) continue;
    const m = matchOf.get(b.question_id);
    if (m) put(b.user_id, m, (b.payout ?? 0) > 0);
  }
  return byUser;
}
const replay = (per, { eventOnly = false, before = null } = {}) => {
  const ids = [...per.keys()]
    .filter((id) => (eventOnly ? eventOf.get(id) : true))
    .filter((id) => (before ? order(id, before) < 0 : true))
    .sort(order);
  let streak = 0, best = 0;
  for (const id of ids) {
    const out = per.get(id);
    streak = out.every(Boolean) ? streak + out.length : 0;
    if (streak > best) best = streak;
  }
  return { streak, best };
};

const fixed = new Map(results.map((r) => [r.question_id, r.correct_option_id]));
fixed.set(QUESTION, OPTION);
const wrong = new Map(results.map((r) => [r.question_id, r.correct_option_id]));

/* Серія, з якою людина заходила в матч: усе виправлено, це питання вийняте,
   матчі — тільки ті, що почалися раніше. */
const prior = tally(fixed, { skipQuestion: QUESTION });
const pre = new Map(mine.map((b) => [
  b.user_id,
  replay(prior.get(b.user_id) ?? new Map(), { before: question.match_id }).streak,
]));
const mult = (s) => (s >= 10 ? 2.0 : s >= 5 ? 1.5 : s >= 3 ? 1.25 : 1.0);

const winners = mine.filter((b) => b.option_id === OPTION);
const finalOdds = question.live_odds ? Number(option.odds) : null;
console.log(`\n-- 4-5. виплатити ${winners.length} людям, що ставили на ${option.label} --`);
let total = 0;
const expect = new Map();
for (const b of winners.sort((x, y) => y.stake - x.stake)) {
  const p = P.get(b.user_id);
  const s = pre.get(b.user_id) ?? 0;
  const odds = finalOdds ?? Number(b.odds);
  const pay = Math.floor(b.stake * odds * mult(s));
  expect.set(b.user_id, pay);
  total += pay;
  console.log(
    `  ${who(p)} ставка ${String(b.stake).padStart(5)}` +
    ` x ${odds} x ${mult(s).toFixed(2)} = ${String(pay).padStart(6)}` +
    `   серія зараз ${String(p.streak).padStart(2)} -> перед матчем ${String(s).padStart(2)}` +
    (mult(s) > 1 ? "  <- множник повернено" : ""),
  );
}
console.log(`  разом виплачується ${total} очок`);

/* --------------------------------------------- кроки 6-7: серії та рекорди */
const after = tally(fixed);
const wrongTally = tally(wrong);
const streakFixes = [];
for (const p of profiles) {
  const per = after.get(p.id) ?? new Map();
  const a = replay(per), ev = replay(per, { eventOnly: true });
  /* Рекорд опускаємо лише там, де його поставила помилка (крок 7). */
  const wasBest = replay(wrongTally.get(p.id) ?? new Map()).best;
  const inflated = (p.best_streak ?? 0) === wasBest && wasBest > a.best;
  const want = {
    streak: a.streak,
    best_streak: inflated ? a.best : Math.max(a.best, p.best_streak ?? 0),
    bounty_streak: ev.streak,
  };
  /* Ставників переписуємо завжди, навіть коли нове число дорівнює старому.
     Крок 4 уже поклав їм у профіль серію ПЕРЕД матчем, і порівняння зі
     значенням, прочитаним на початку прогону, тут бреше: «не змінилося»
     означало б «лишити серію перед матчем назавжди». Перший прогін саме так і
     лишив її дев'ятнадцятьом людям. */
  if (pre.has(p.id) || want.streak !== (p.streak ?? 0)
      || want.best_streak !== (p.best_streak ?? 0)
      || want.bounty_streak !== (p.bounty_streak ?? 0)) {
    streakFixes.push({ p, want, inflated });
  }
}
console.log(`\n-- 6-7. серії після перерахунку: ${streakFixes.length} профілів --`);
for (const f of streakFixes) {
  console.log(
    `  ${who(f.p)} серія ${f.p.streak} -> ${f.want.streak}` +
    ` · івентова ${f.p.bounty_streak} -> ${f.want.bounty_streak}` +
    ` · рекорд ${f.p.best_streak} -> ${f.want.best_streak}` +
    (f.inflated ? "  <- рекорд поставила помилка" : ""),
  );
}

if (!APPLY) {
  console.log("\nпробний прогін — нічого не змінено. --apply щоб виправити");
  process.exit(0);
}

/* ================================================================== пишемо */
console.log();
for (const c of clawback) {
  await patch(`profiles?id=eq.${c.p.id}`, c.want);
  console.log(`знято ${String(c.bet.payout).padStart(6)} <- ${c.p.handle ?? c.p.id}`);
}
console.log(`1. знято виплат: ${clawback.length}`);

await patch(`bets?question_id=eq.${encodeURIComponent(QUESTION)}`, { payout: 0, settled_at: null });
console.log(`2. розраховано назад ставок: ${mine.length}`);

await patch(`question_results?question_id=eq.${encodeURIComponent(QUESTION)}`,
  { correct_option_id: OPTION });
console.log(`3. результат виправлено на ${OPTION}`);

for (const [id, s] of pre) await patch(`profiles?id=eq.${id}`, { streak: s });
console.log(`4. серії перед матчем повернено: ${pre.size}`);

const rpc = await fetch(`${SB}/rest/v1/rpc/settle_bets`, {
  method: "POST", headers: H,
  body: JSON.stringify({ p_question: QUESTION, p_correct: OPTION }),
});
if (!rpc.ok) throw new Error(`settle_bets: ${rpc.status} ${await rpc.text()}`);
console.log(`5. розраховано ставок: ${await rpc.text()}`);

for (const f of streakFixes) await patch(`profiles?id=eq.${f.p.id}`, f.want);
console.log(`6-7. серій виправлено: ${streakFixes.length}`);

/* ------------------------------------------------------- крок 8: сповіщення */
const paidNow = await get(
  `bets?select=user_id,payout&question_id=eq.${encodeURIComponent(QUESTION)}&payout=gt.0`,
);
const got = new Map(paidNow.map((b) => [b.user_id, b.payout]));
const wronglyPaid = [...expect].filter(([id, pay]) => got.get(id) !== pay);
if (wronglyPaid.length) {
  console.log(`увага: ${wronglyPaid.length} виплат розійшлися з розрахунком —`);
  for (const [id, pay] of wronglyPaid) console.log(`  ${id}: очікувано ${pay}, у базі ${got.get(id) ?? 0}`);
}

const head = `${match?.team_a?.toUpperCase()} — ${match?.team_b?.toUpperCase()}`;
const notes = mine.map((b) => ({
  user_id: b.user_id,
  kind: "major",
  title: got.has(b.user_id)
    ? `Ставку перераховано · ${head}: виграли ${option.label}, +${got.get(b.user_id)} очок`
    : `Ставку перераховано · ${head}: виграли ${option.label}, виплату знято`,
}));
const n = await fetch(`${SB}/rest/v1/notifications`, {
  method: "POST", headers: H, body: JSON.stringify(notes),
});
if (!n.ok) throw new Error(`notifications: ${n.status} ${await n.text()}`);
console.log(`8. сповіщень надіслано: ${notes.length}`);
