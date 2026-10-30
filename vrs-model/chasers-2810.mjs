import fs from "node:fs";

/**
 * Хто ще може перестрибнути НАВІ до відсічення — за справжніми сітками.
 *
 * Чим це відрізняється від threshold.mjs. Там модель рахує кожну команду
 * окремо: бере її навантаження, виводить σ і питає «з якою ймовірністю вона
 * опиниться вище». Для одного суперника це правильно, для п'ятнадцятьох —
 * ні, бо вони грають між собою. BIG, Inner Circle і fnatic — усі троє на
 * Stake Ranked 5, і далеко пройти можуть не всі; HOTU грає і Tesla Cup, і
 * Москву, тож його два турніри — один ланцюжок, а не дві незалежні спроби.
 * Саме цей зв'язок визначає, скільком вдасться, а незалежний підрахунок дає
 * завищене очікуване число переслідувачів.
 *
 * Тому тут один спільний прогін по всіх подіях, що лишилися, із тим станом
 * сіток, який є станом на 28 жовтня, — і відповідь на питання «скільком
 * удалося» береться зі спільного розподілу.
 *
 * Крок — калібрований (step-scale.json), ймовірність перемоги — та сама
 * логістика з D=817.4. Її перевірено окремо (fit-win.mjs) на 32 парах
 * Бухареста з лінією букмекера: оптимальне D за логарифмічною втратою
 * виходить 876, втрата та сама до четвертого знака, а відхилення за
 * кошиками розриву не більше 3,6 в.п. Крива не плоска навіть на розриві
 * 660 очок.
 *
 * Призових як окремого доданка тут немає свідомо. Нахил 2,14 очка на тисячу
 * доларів (prize.mjs) тримався на двох рядках із власною причиною — The
 * MongolZ виходили з-під штрафу за склад, PRIVATE щойно піднялись, — і
 * мільйонні події його спростовують прямо: на Thunderpick найбільший приріст
 * +177, на EPL +155, а за тим нахилом переможець мав би взяти понад +800.
 * Залишок у переможців Private Club 2 (+9,1) той самий, що й у тих, хто там
 * програв (+9,5), і той самий, що в команд, які не грали взагалі, — тобто це
 * загальний дрейф таблиці, а не гроші. Дрейф однаковий для всіх і в
 * порівнянні «хто вище» скорочується.
 *
 * Запуск: node chasers-2810.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 200000);
const SLOTS = Number(process.env.SLOTS ?? 18);
/** forfeit — два техлузи; withdraw — знялись і не грають; play — грають як є. */
const RETAKE = process.env.RETAKE ?? "forfeit";
/** Програш Spirit у п'ятому турі Бухареста як умова сценарію. */
const SPIRIT = process.env.SPIRIT ?? "loss";
/* Дрейф таблиці поверх кроку (fit-drift.mjs) і його розкид. Вимикаються, щоб
   побачити, скільки відповіді тримається саме на них. */
const DRIFT = process.env.DRIFT !== "0";
const NOISE = process.env.NOISE !== "0";
const DAYS = Number(process.env.DAYS ?? 5);            // 28 жовтня → 2 листопада
const DRIFT_A = 88.2, DRIFT_B = -0.0542, DRIFT_WIN = 3.1;
const DRIFT_SD = Number(process.env.SD ?? 16.5);
const EU = JSON.parse(fs.readFileSync("eu-2810.json", "utf8"));

/** Очки 28 жовтня. Європа — з регіональної таблиці, решта — з глобальної. */
const P0 = new Map();
for (const s of EU.rows.split(";")) { const [, t, p] = s.split("|"); P0.set(t, +p); }
const GLOBAL = JSON.parse(fs.readFileSync("vrs-live-2710.json", "utf8"));
for (const s of GLOBAL.rows.split(";")) { const [, t, p] = s.split("|"); if (!P0.has(t)) P0.set(t, +p); }
/* Склади подій зі сторінок HLTV 28 жовтня; очки — звідти ж. */
const FIX = { MIBR: 1586, "The Huns": 957, "5star": 1206, TYLOO: 1285, "BC.Game": 1392, NRG: 1285 };
for (const [t, p] of Object.entries(FIX)) P0.set(t, p);
/* Кого в таблиці немає взагалі: вони нижче останнього рядка, і для цього
   розрахунку важливо тільки те, що вони слабкі. */
for (const t of ["Arena Pro Team", "Tactical Chaos", "Signatus", "BTH", "Teletubisie", "SNITKO"])
  if (!P0.has(t)) P0.set(t, 600);

const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const { a: WIN_K, b: LOSS_K } = JSON.parse(fs.readFileSync("step-scale.json", "utf8"));
const Eof = (pa, pb) => 1 / (1 + Math.pow(10, (gl * (pa - pb)) / -D));

/** Ймовірність окремої карти з ймовірності серії Bo3: p_series = p²(3−2p). */
const mapProb = (ps) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (m * m * (3 - 2 * m) < ps) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
};

/** Нормальна величина методом Бокса–Мюллера. */
const gauss = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const EU_TEAMS = EU.rows.split(";").map((s) => s.split("|")[1]).filter(Boolean);

const sum = new Map(EU_TEAMS.map((t) => [t, 0]));
const passed = new Map(EU_TEAMS.map((t) => [t, 0]));   // скільки разів закінчив вище НАВІ
const naviPts = [];
const places = new Map();
let good = 0;

for (let run = 0; run < RUNS; run++) {
  const pts = new Map(P0);
  /** Одна серія. `forfeit` — назва команди, що віддає матч технічно. */
  const play = (a, b, forfeit = null) => {
    const ea = Eof(pts.get(a), pts.get(b));
    const aw = forfeit ? forfeit !== a : Math.random() < ea;
    const [w, l] = aw ? [a, b] : [b, a];
    /* Очікування переможця. Переможений рахується від свого, тобто від
       (1 − ew): узяти тут ew означало б, що фаворит, який програв слабкому,
       майже нічого не втрачає, — рівно навиворіт. */
    const ew = aw ? ea : 1 - ea;
    pts.set(w, pts.get(w) + WIN_K * KG * (1 - ew));
    pts.set(l, pts.get(l) - LOSS_K * KG * (1 - ew));
    return w;
  };
  /** Bo3, у якій `trailing` програє 0-1 і має взяти дві карти підряд. */
  const playFrom01 = (leader, trailing) => {
    const ps = Eof(pts.get(trailing), pts.get(leader));
    const pm = mapProb(ps);
    const winTrailing = Math.random() < pm * pm;
    const [w, l] = winTrailing ? [trailing, leader] : [leader, trailing];
    const ew = winTrailing ? ps : 1 - ps;
    pts.set(w, pts.get(w) + WIN_K * KG * (1 - ew));
    pts.set(l, pts.get(l) - LOSS_K * KG * (1 - ew));
    return w;
  };
  const other = (pair, win) => (pair[0] === win ? pair[1] : pair[0]);

  /* ---- PGL Masters Bucharest, п'ятий тур, 28 жовтня ----
     За умовою сценарію НАВІ програють Spirit і вилітають на 9-11 місці. */
  /* Після четвертого туру вийшли BETBOOM і FUT з 3-0, далі Vitality, MOUZ і
     Aurora з 3-1. Шестеро на 2-2 грають між собою за три останні місця:
     MongolZ — Nemiga, Liquid — FURIA, Spirit — НАВІ. Решта — плей-оф на один
     виліт 29–31 жовтня.
     Для цього розрахунку з усього Бухареста важлива одна команда — Nemiga на
     1534. Вони єдині з тих, хто вище НАВІ, у кого подія ще попереду; інші
     або давно вище, або вже поїхали. */
  {
    const r5 = [];
    if (SPIRIT === "loss") { play("Spirit", "Natus Vincere", "Natus Vincere"); r5.push("Spirit"); }
    else if (SPIRIT === "win") { play("Spirit", "Natus Vincere", "Spirit"); r5.push("Natus Vincere"); }
    else r5.push(play("Spirit", "Natus Vincere"));
    r5.push(play("The MongolZ", "Nemiga"), play("Liquid", "FURIA"));
    const po = ["BETBOOM", "FUT", "Vitality", "MOUZ", "Aurora", ...r5]
      .sort(() => Math.random() - 0.5);
    const qf = [play(po[0], po[1]), play(po[2], po[3]), play(po[4], po[5]), play(po[6], po[7])];
    const sf = [play(qf[0], qf[1]), play(qf[2], qf[3])];
    play(sf[0], sf[1]);
    play(qf[0] === sf[0] ? qf[1] : qf[0], qf[2] === sf[1] ? qf[3] : qf[2]);   // за третє місце
  }

  /* ---- Stake Ranked Episode 5, $100 000, подвійний виліт ----
     Перший тур дограно 27 жовтня: fnatic — Astralis, BIG — magic,
     Inner Circle — Nemesis, MIBR — Eternal Fire. Четверо переможців у
     верхній сітці, четверо переможених — у нижній. */
  {
    const ub1 = ["fnatic", "BIG"], ub2 = ["Inner Circle", "MIBR"];
    const a = play(...ub1), b = other(ub1, a);
    const c = play(...ub2), d = other(ub2, c);
    const ubf = play(a, c), ubfL = ubf === a ? c : a;
    const lb1 = play("Astralis", "magic");
    const lb2 = play("Nemesis", "Eternal Fire");
    const sf = play(play(b, lb2), play(d, lb1));
    play(ubf, play(ubfL, sf));
  }

  /* ---- Tesla Cup 2026, $50 000, два GSL по чотири ----
     Група A: FaZe уже перша (2-0 Alliance, 2-0 K27). K27 1-1 чекає
     вирішального матчу. B8 — Alliance на виліт, Alliance веде 1-0 по картах.
     Група B: HOTU 2-0 Luminosity, GamerLegion 2-1 Envy. */
  {
    const a2 = play("K27", playFrom01("Alliance", "B8"));
    const b1 = play("HOTU", "GamerLegion"), l1 = b1 === "HOTU" ? "GamerLegion" : "HOTU";
    const b2 = play(l1, play("Luminosity", "Envy"));
    play(play("FaZe", b2), play(b1, a2));
  }

  /* ---- Moscow Cyber Games 2026, 15 млн рублів, чотири команди ----
     31 жовтня HOTU — The Huns і 1win — 5star, 1 листопада фінал та матч за
     третє місце. По два матчі на кожного, тому 1win може і впасти. */
  {
    const s1 = play("HOTU", "The Huns"), l1 = s1 === "HOTU" ? "The Huns" : "HOTU";
    const s2 = play("1win", "5star"), l2 = s2 === "1win" ? "5star" : "1win";
    play(s1, s2);
    play(l1, l2);
  }

  /* ---- FiReSPORTS Last Chance 2026, $75 000, Буенос-Айрес ----
     Чотири GSL по чотири, далі вісімка на один виліт. Для 100 Thieves це
     єдина подія до відсічення, і вся їхня група — південноамериканський
     третій ешелон, тож перемоги там дають мало. */
  {
    const gsl = (o1, o2) => {
      const w1 = play(...o1), l1 = other(o1, w1);
      const w2 = play(...o2), l2 = other(o2, w2);
      const first = play(w1, w2), firstL = first === w1 ? w2 : w1;
      const second = play(firstL, play(l1, l2));
      return [first, second];
    };
    const [a1, a2] = gsl(["100 Thieves", "Arena Pro Team"], ["BARCA", "Bounty Hunters"]);
    const [b1, b2] = gsl(["NRG", "Tactical Chaos"], ["Galorys", "Procyon"]);
    const [c1, c2] = gsl(["Fluxo", "Signatus"], ["ShindeN", "Isurus"]);
    const [d1, d2] = gsl(["Wildcard", "Hacha"], ["BESTIA", "BTH"]);
    play(play(play(a1, d2), play(b1, c2)), play(play(c1, b2), play(d1, a2)));
  }

  /* ---- Circuito Retake Season 13, €12 200, Лісабон ----
     Тринадцять команд, до двох поразок.
     НАВІ за умовою сценарію віддають обидва матчі технічно. Куди підуть ці
     дві дарові перемоги — не однаково: перемога над командою на 1558 коштує
     близько сорока очок, і якби її забрав JiJieHao на 1437, це була б друга
     половина тієї самої шкоди. Але сітка зі сторінки події розводить їх:
     НАВІ вільні в першому колі й виходять на переможця BASEMENT BOYS —
     Teletubisie, JiJieHao вільні в іншій четвертині й виходять на переможця
     WBT Academy — SAW Youngsters, TYLOO у третій. Зустрітися вони можуть
     тільки пізніше, а команда з двома технічними поразками до того часу вже
     поїхала. Тому обидва подарунки дістаються слабким. */
  {
    const field = (RETAKE === "withdraw" || RETAKE === "forfeit" ? [] : ["Natus Vincere"])
      .concat(["TYLOO", "JiJieHao", "BC.Game", "Iberian Soul",
                   "Metizport", "BASEMENT BOYS", "OG", "SAW Youngsters", "WBT Academy",
                   "SNITKO", "Teletubisie", "ZOTIX"]);
    if (RETAKE === "forfeit") {
      /* Перша технічна — переможцю пари BASEMENT BOYS — Teletubisie, друга —
         комусь із нижньої сітки своєї половини. */
      const first = play("BASEMENT BOYS", "Teletubisie");
      play(first, "Natus Vincere", "Natus Vincere");
      const pool = ["Iberian Soul", "Metizport", "OG", "SAW Youngsters", "WBT Academy", "SNITKO", "ZOTIX"];
      play(pool[Math.floor(Math.random() * pool.length)], "Natus Vincere", "Natus Vincere");
    }
    const rec = new Map(field.map((t) => [t, 0]));
    const seen = new Set(), key = (a, b) => [a, b].sort().join("|");
    for (let r = 0; r < 30; r++) {
      const alive = field.filter((t) => rec.get(t) < 2);
      if (alive.length < 2) break;
      const buckets = new Map();
      for (const t of alive) { const k = rec.get(t); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
      let any = false;
      for (const list of buckets.values()) {
        const left = list.slice().sort(() => Math.random() - 0.5);
        while (left.length > 1) {
          const top = left.shift();
          let j = left.findIndex((o) => !seen.has(key(top, o)));
          if (j === -1) j = 0;
          const opp = left.splice(j, 1)[0];
          seen.add(key(top, opp));
          const ff = RETAKE === "forfeit" && (top === "Natus Vincere" || opp === "Natus Vincere")
            ? "Natus Vincere" : null;
          const w = play(top, opp, ff), lost = w === top ? opp : top;
          rec.set(lost, rec.get(lost) + 1);
          any = true;
        }
      }
      if (!any) break;
    }
  }

  /* ---- дрейф таблиці та його розкид ----
     Прикладається до всіх однаково, НАВІ включно: частина його в порівнянні
     «хто вище» скорочується, і саме тому важливо не забути його нікому. */
  if (DRIFT || NOISE) for (const t of EU_TEAMS) {
    const d = DRIFT ? ((DRIFT_A + DRIFT_B * P0.get(t)) / DRIFT_WIN) * DAYS : 0;
    const z = NOISE ? gauss() * DRIFT_SD * Math.sqrt(DAYS / DRIFT_WIN) : 0;
    pts.set(t, pts.get(t) + d + z);
  }

  /* ---- підсумок прогону ---- */
  const navi = pts.get("Natus Vincere");
  naviPts.push(navi);
  let n = 0;
  for (const t of EU_TEAMS) {
    if (t === "Natus Vincere") continue;
    sum.set(t, sum.get(t) + pts.get(t));
    if (pts.get(t) > navi) { passed.set(t, passed.get(t) + 1); n++; }
  }
  places.set(n + 1, (places.get(n + 1) ?? 0) + 1);
  if (n <= SLOTS - 1) good++;
}

/* ---- вивід ---- */
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
const SC = { loss: "програли Spirit", win: "перемогли Spirit", none: "матчу зі Spirit нема" }[SPIRIT];
const RT = { forfeit: "два техлузи на Retake", withdraw: "знялись із Retake", play: "грають Retake" }[RETAKE];
console.log(`прогонів ${RUNS}  ·  зріз ${EU.asOf}  ·  Європа ${SLOTS} місць`);
console.log(`сценарій: ${SC}, ${RT}  ·  дрейф ${DRIFT ? "так" : "ні"}, розкид ${NOISE ? "так" : "ні"}\n`);
console.log(`НАВІ: 1558 → ${mean(naviPts).toFixed(0)} у середньому  (5–95%: ${qt(naviPts, 0.05).toFixed(0)}–${qt(naviPts, 0.95).toFixed(0)})`);
console.log(`\nПРОХІД: ${((100 * good) / RUNS).toFixed(1)}%\n`);
console.log("команда             28.10   середнє     рух   вище НАВІ");
for (const t of EU_TEAMS.filter((t) => t !== "Natus Vincere").sort((a, b) => P0.get(b) - P0.get(a))) {
  const avg = sum.get(t) / RUNS, d = avg - P0.get(t);
  const p = (100 * passed.get(t)) / RUNS;
  console.log(`  ${t.padEnd(19)}${String(P0.get(t)).padStart(5)}${avg.toFixed(0).padStart(10)}` +
    `${((d >= 0 ? "+" : "") + d.toFixed(0)).padStart(8)}` +
    `${(p > 99.9 ? ">99.9" : p < 0.1 ? "<0.1" : p.toFixed(1)).padStart(11)}%`);
}
console.log("\nмісце НАВІ в Європі:");
const ks = [...places.keys()].sort((a, b) => a - b);
let cum = 0;
for (const k of ks) {
  cum += places.get(k);
  if (places.get(k) / RUNS < 0.005) continue;
  console.log(`  ${String(k).padStart(2)}  ${((100 * places.get(k)) / RUNS).toFixed(1).padStart(5)}%` +
    `   накопичено ${((100 * cum) / RUNS).toFixed(1)}%${k === SLOTS ? "   ← останнє місце з інвайтом" : ""}`);
}
