import fs from "node:fs";

/**
 * Шанси пікемів — рахує й заливає в базу.
 *
 * Запуск:  node scripts/major-odds.mjs [стадія] [прогонів]
 *
 * Відповідає на питання «який у мене шанс», і головне — рахує його від
 * поточного стану стадії, а не від її початку. Після кожного туру числа
 * інші: саме це й перетворює чужий матч у щось, за чим стежиш.
 *
 * Чому скриптом, а не на сайті. Потрібні дві речі ззовні: очки VRS і крива
 * ймовірності перемоги. Перші оновлює HLTV, яка не віддає сторінок нічому,
 * що не браузер, — тому вони й лежать у `major_projection`, залиті вручну
 * (0077). Друга живе в моделі (`vrs-model/fit-win.mjs`), перевіреній на
 * тридцяти двох лініях букмекерів. Переносити це в застосунок немає куди й
 * нащо: сайт має читати готове.
 *
 * Що саме рахується:
 *   • для кожної команди — шанс на 3:0, на прохід і на 0:3;
 *   • для кожної картки — очікувані очки, очікувані влучання, розподіл
 *     влучань і шанс кожного окремого вибору;
 *   • після замка — шанс потрапити в десятку, якій їдуть скіни.
 *
 * Останнє можливе тільки після замка, і не через обережність, а по суті:
 * до замка картки ще міняються, і «шанс на скін» проти карток, яких ще не
 * дописали, був би не прогнозом, а малюнком.
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const HEAD = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};
const get = async (p) => {
  const r = await fetch(API + p, { headers: HEAD });
  if (!r.ok) throw new Error(`GET ${p} → ${r.status} ${await r.text()}`);
  return r.json();
};
const send = async (method, p, body, prefer) => {
  const r = await fetch(API + p, {
    method,
    headers: prefer ? { ...HEAD, Prefer: prefer } : HEAD,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${await r.text()}`);
};

const STAGE = Number(process.argv[2] ?? 1);
const RUNS = Number(process.argv[3] ?? 200000);

/* --- Правила картки. Дзеркалять src/lib/major-pickem.ts і 0096. --------- */
const PRICE = { "3-0": 150, adv: 50, "0-3": 150 };
const PERFECT = 500;
const PICKS = 10;
const PRIZE_TOP = 10;

/* --- Крива ймовірності перемоги (vrs-model/fit-win.mjs) ----------------- */
const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const GL = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
/** Bo3 підсилює фаворита рівно так: p²(3−2p). */
const bo3 = (p) => p * p * (3 - 2 * p);

/* ------------------------------------------------------------------------ */

const [stage] = await get(`major_stages?select=*&stage=eq.${STAGE}`);
if (!stage) throw new Error(`стадії ${STAGE} немає`);
if (stage.kind === "playoff") {
  /* Плей-оф — сітка, а не швейцарка: інша симуляція і інша форма картки.
     Поки вісімка невідома, рахувати все одно нічого. */
  console.log("плей-оф тут ще не рахується — потрібна сітка, а не швейцарка");
  process.exit(0);
}

const FIELD = stage.teams ?? [];
if (FIELD.length !== 16) throw new Error(`у стадії ${STAGE} ${FIELD.length} команд, а треба 16`);

const proj = await get("major_projection?select=slug,vrs");
const PTS = new Map(proj.filter((r) => r.slug).map((r) => [r.slug, r.vrs]));
const missing = FIELD.filter((t) => !PTS.has(t));
if (missing.length) throw new Error("немає очок VRS: " + missing.join(", "));

const IDX = new Map(FIELD.map((t, i) => [t, i]));
const RATING = FIELD.map((t) => PTS.get(t));
/** Ймовірність перемоги в одній карті, за індексами. */
const E1 = (a, b) => 1 / (1 + Math.pow(10, (GL * (RATING[a] - RATING[b])) / -D));

const OPEN = (stage.opening ?? []).map((m) => [IDX.get(m.a), IDX.get(m.b)]);
const PLAYED = (stage.played ?? []).map((m) => [IDX.get(m.a), IDX.get(m.b), IDX.get(m.w)]);

const locked = Date.now() >= new Date(stage.starts_at).getTime();

/* Картки. Після замка потрібні всі — інакше нема з ким порівнювати місце. */
const cards = await get(
  `major_pickem?select=user_id,picks,updated_at&stage=eq.${STAGE}`,
);
cards.sort((a, b) => a.updated_at.localeCompare(b.updated_at) || a.user_id.localeCompare(b.user_id));

/* Картка в компактному вигляді: пари [індекс команди, роль]. */
const ROLE_CODE = { "3-0": 0, adv: 1, "0-3": 3 };
const CARDS = cards.map((c) => ({
  user: c.user_id,
  picks: Object.entries(c.picks ?? {})
    .map(([t, r]) => [IDX.get(t), ROLE_CODE[r]])
    .filter(([i]) => i !== undefined),
}));

console.log(
  `стадія ${STAGE}: зіграно ${PLAYED.length} матчів, карток ${CARDS.length}, ` +
  `${locked ? "замок зачинено" : "ще відкрита"}, прогонів ${RUNS}`,
);

/* --- Симуляція ---------------------------------------------------------- */

const N = FIELD.length;
/* Скільки разів команда прийшла до кожного підсумку. */
const tally = FIELD.map(() => ({ w: 0, a: 0, o: 0 }));
/* Для кожної картки: сума очок, сума влучань, розподіл, скільки разів у
   десятці, і скільки разів зайшов кожен окремий вибір. */
const stat = CARDS.map((c) => ({
  pts: 0, hits: 0, dist: new Array(PICKS + 1).fill(0), top: 0,
  pick: c.picks.map(() => 0),
}));

/* Робочі масиви, створені один раз: мільйон дрібних аллокацій усередині
   циклу коштує більше, ніж уся арифметика разом. */
const w = new Int8Array(N), l = new Int8Array(N);
const met = new Uint8Array(N * N);
const code = new Uint8Array(N);
const pool = new Int32Array(N);
const score = new Int32Array(CARDS.length);
const hitN = new Int32Array(CARDS.length);
const ord = new Int32Array(CARDS.length);
for (let i = 0; i < CARDS.length; i++) ord[i] = i;

function play(a, b) {
  const three = w[a] === 2 || l[a] === 2;   // матч на вихід або на виліт — Bo3
  const p = three ? bo3(E1(a, b)) : E1(a, b);
  const aw = Math.random() < p;
  if (aw) { w[a]++; l[b]++; } else { w[b]++; l[a]++; }
  met[a * N + b] = met[b * N + a] = 1;
}

for (let run = 0; run < RUNS; run++) {
  w.fill(0); l.fill(0); met.fill(0);

  /* Те, що вже сталося, — як сталося. */
  for (const [a, b, win] of PLAYED) {
    if (win === a) { w[a]++; l[b]++; } else { w[b]++; l[a]++; }
    met[a * N + b] = met[b * N + a] = 1;
  }

  /* Решта першого туру — за опублікованим розкладом, а не жеребом. */
  for (const [a, b] of OPEN) if (!met[a * N + b]) play(a, b);

  /* Далі — хто з ким, вирішує турнір. Пари зводяться всередині групи з
     однаковим рахунком; тих, хто вже грав між собою, не зводять удруге.
     Справжня швейцарка сіє всередині групи за Бухгольцем, ми беремо жереб:
     різниця дрібна проти тієї, що й так сидить у кривій. */
  for (let round = 0; round < 6; round++) {
    let any = false;
    for (let wins = 0; wins <= 2; wins++) {
      for (let loss = 0; loss <= 2; loss++) {
        let n = 0;
        for (let t = 0; t < N; t++) if (w[t] === wins && l[t] === loss) pool[n++] = t;
        if (n < 2) continue;
        any = true;
        /* Тасування Фішера — Йейтса на відрізку масиву. */
        for (let i = n - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
        }
        let left = n;
        while (left > 1) {
          const a = pool[--left];
          let k = left - 1;
          while (k >= 0 && met[a * N + pool[k]]) k--;
          if (k < 0) k = left - 1;              // усі вже грали — беремо будь-кого
          const b = pool[k];
          pool[k] = pool[--left];
          play(a, b);
        }
      }
    }
    if (!any) break;
  }

  for (let t = 0; t < N; t++) {
    const o = tally[t];
    if (w[t] === 3 && l[t] === 0) { o.w++; o.a++; code[t] = 0; }
    else if (w[t] === 3) { o.a++; code[t] = 1; }
    else if (l[t] === 3 && w[t] === 0) { o.o++; code[t] = 3; }
    else code[t] = 2;
  }

  for (let c = 0; c < CARDS.length; c++) {
    const picks = CARDS[c].picks, s = stat[c];
    let pts = 0, hits = 0;
    for (let i = 0; i < picks.length; i++) {
      const [t, want] = picks[i];
      const got = code[t];
      /* Прохід збирає під себе і 3:0 — це справді «пройшов далі». */
      const ok = want === 1 ? got <= 1 : got === want;
      if (ok) { hits++; pts += PRICE[want === 1 ? "adv" : "3-0"]; s.pick[i]++; }
    }
    if (hits === PICKS) pts += PERFECT;
    s.pts += pts; s.hits += hits; s.dist[hits]++;
    score[c] = pts; hitN[c] = hits;
  }

  /* Місце в цьому прогоні — тим самим тайбрейком, що й у 0096: очки,
     влучання, далі час збереження. Картки вже відсортовані за часом, тож
     достатньо стабільного порядку за рахунком. */
  if (locked && CARDS.length) {
    ord.sort((x, y) => score[y] - score[x] || hitN[y] - hitN[x] || x - y);
    const top = Math.min(PRIZE_TOP, CARDS.length);
    for (let i = 0; i < top; i++) stat[ord[i]].top++;
  }
}

/* --- Запис -------------------------------------------------------------- */

const odds = {};
FIELD.forEach((t, i) => {
  const o = tally[i];
  odds[t] = {
    w: +(o.w / RUNS).toFixed(4),
    a: +(o.a / RUNS).toFixed(4),
    o: +(o.o / RUNS).toFixed(4),
  };
});

await send("PATCH", `major_stages?stage=eq.${STAGE}`, {
  odds,
  odds_at: new Date().toISOString(),
});

if (CARDS.length) {
  const rows = CARDS.map((c, i) => {
    const s = stat[i];
    const p_pick = {};
    c.picks.forEach(([t], k) => { p_pick[FIELD[t]] = +(s.pick[k] / RUNS).toFixed(4); });
    return {
      user_id: c.user,
      stage: STAGE,
      p_prize: locked ? +(s.top / RUNS).toFixed(4) : null,
      ev_points: +(s.pts / RUNS).toFixed(1),
      ev_hits: +(s.hits / RUNS).toFixed(3),
      p_pick,
      dist: s.dist.map((n) => +(n / RUNS).toFixed(4)),
      computed_at: new Date().toISOString(),
    };
  });
  await send("POST", "major_pickem_odds", rows, "resolution=merge-duplicates");
}

/* --- Що вийшло ---------------------------------------------------------- */

console.log("\nкоманда           3:0    прохід    0:3");
FIELD.map((t, i) => [t, tally[i]])
  .sort((a, b) => b[1].a - a[1].a)
  .forEach(([t, o]) => {
    const f = (n) => ((n / RUNS) * 100).toFixed(1).padStart(5) + "%";
    console.log(t.padEnd(16), f(o.w), " ", f(o.a), " ", f(o.o));
  });

if (CARDS.length) {
  console.log("\nкартки");
  stat
    .map((s, i) => ({ s, user: CARDS[i].user }))
    .sort((a, b) => b.s.pts - a.s.pts)
    .forEach(({ s, user }) => {
      const ev = (s.pts / RUNS).toFixed(0).padStart(4);
      const hits = (s.hits / RUNS).toFixed(2);
      const top = locked ? `  скін ${((s.top / RUNS) * 100).toFixed(1)}%` : "";
      console.log(`  ${user.slice(0, 8)}  ${ev} очок  ${hits}/10${top}`);
    });
}
