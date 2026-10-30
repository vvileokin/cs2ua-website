import fs from "node:fs";
import path from "node:path";

/**
 * Прогноз інвайтів на мейджор — усі три регіони на опублікованій формулі VRS.
 *
 * До цього так рахувалась лише Європа, а Америка з Азією лишались на старій
 * каліброваній моделі: формула вимагає розкладу очок із HLTV по кожній
 * команді, а зібрано їх було тільки для європейських. Тепер зібрано для всіх,
 * хто ще грає або кого ще можуть обійти, — тридцять п'ять розкладів.
 *
 * Формула (перевірена на кожному з тих тридцяти п'яти до одиниці):
 *
 *   VRS = 400 + LAN wins + Opp. network + Bounty offered + Bounty collected + H2H
 *   recency(d) = 1 при d ≤ 30, далі max(0, 1 − (d−30)/152)
 *   LAN wins       = Σ 48·recency по десяти НАЙСВІЖІШИХ перемогах на ЛАНі
 *   Bounty offered = 19,4 · (Σ призові·recency)^0,23          } десять найкращих
 *   Bounty collect =  244 · (Σ bounty·recency·weight)^0,23    } у кожному,
 *   Opp. network   =  100 · (Σ network·recency·weight)^0,23   } з витісненням
 *   weight(призовий) ≈ (призовий/1e6)^0,3
 *   bounty(команда) ≈ (Σ її призові·recency)/600000, не більше 1
 *
 * H2H лишається моделлю — його з розкладу не відтворити, бо він рахується
 * щоразу з нуля по всій таблиці. Зате зміряно головне про нього: він
 * перераховується ВІД НОВОЇ бази, тож частину приросту забирає назад.
 * H2H_DAMP=0,56 (див. h2h-damp.mjs).
 *
 * Запуск: node engine-all.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 40000);
const SLOTS = { europe: 18, americas: 9, asia: 5 };
const STAGES = {
  europe: { s3: 6, s2: 6, s1: 6 },
  americas: { s3: 2, s2: 1, s1: 6 },
  asia: { s3: 0, s2: 1, s1: 4 },
};
const SPIRIT = process.env.SPIRIT ?? "open";
const CAPS = process.env.CAPS !== "0";
const USE_ODDS = process.env.ODDS !== "0";
const NOISE_SD = Number(process.env.NOISE_SD ?? 10);
const H2H_DAMP = Number(process.env.H2H_DAMP ?? 0.56);

const K = { O: 19.4, C: 244, N: 100 };
const POW = 0.23, BOUNTY_FULL = 600_000, SLOT_CAP = 10;
/* Скільки важить свіжа перемога на ЛАНі. 28 жовтня це було 48, 29-го HLTV
   перерахував на 47 — величина не прибита намертво, тож береться з даних:
   максимум серед рядків усіх зібраних розкладів. */
let LAN_BASE = 47;
const weight = (prize) => Math.pow(prize / 1_000_000, 0.3);
const compOf = (raw, k) => k * Math.pow(Math.max(raw, 0), POW);
const rawOf = (c, k) => Math.pow(Math.max(c, 1) / k, 1 / POW);

/* ---- таблиці ---- */
export const REGION = {};          // команда → регіон
export const P0 = new Map();
const TABLE = {};
for (const [reg, file] of [["europe", "eu-2810.json"], ["americas", "am-2810.json"], ["asia", "as-2810.json"]]) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  TABLE[reg] = j.rows.split(";").map((s) => s.split("|")[1]);
  for (const s of j.rows.split(";")) {
    const [, t, p] = s.split("|");
    P0.set(t, +p); REGION[t] = reg;
  }
}
/* Дрібні учасники подій, яких у верхніх рядках таблиць немає: їхні очки
   потрібні, щоб рахувати ймовірність матчу, але самі вони нікуди не метять. */
for (const [t, p] of Object.entries({
  "Arena Pro Team": 600, "Tactical Chaos": 600, Signatus: 600, BTH: 600,
  Teletubisie: 619, SNITKO: 600, Hacha: 436, Isurus: 704, Procyon: 805,
  "Iberian Soul": 1233, Metizport: 1167, "BASEMENT BOYS": 1119, OG: 937,
  "SAW Youngsters": 817, "WBT Academy": 872, ZOTIX: 534, JiJieHao: 1436,
  "Turma do Pagode": 976, ALKA: 727, "QUINTESSÊNCIA": 666, NAOCOPULAS: 600,
  "Low Cortisol BR": 670, "Off Chops": 944, "Ground Zero": 928, Rooster: 854,
  Staqued: 600, LAG: 1007, "The Audacity": 600, "the ONE": 533,
})) if (!P0.has(t)) P0.set(t, p);

/* ---- розклади ---- */
const DET = {};
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", f), "utf8"));
  const rows = (kk) => (j[kk] ?? []).map((s) => Number(s.split("|")[1]));
  const mk = (kk, idx, k) => {
    const shown = rows(kk), comp = j.c[idx], sumRaw = rawOf(comp, k);
    const scale = comp / sumRaw;
    return { comp, raw: shown.map((v) => v / scale) };
  };
  DET[j.n] = {
    lan: rows("L").slice().sort((a, b) => a - b),
    O: mk("O", 2, K.O), N: mk("N", 1, K.N), C: mk("C", 3, K.C),
    rawO: rawOf(j.c[2], K.O), rawN: rawOf(j.c[1], K.N),
  };
}
LAN_BASE = Math.max(...Object.values(DET).flatMap((d) => d.lan), 1);

const bountyOf = (t) => (DET[t] ? Math.min(1, DET[t].rawO / BOUNTY_FULL)
                                : Math.min(1, 0.00018 * Math.max(0, (P0.get(t) ?? 600) - 900)));
const networkOf = (t) => (DET[t] ? Math.min(1, DET[t].rawN / 3.2) : 0.3);

/* ---- ймовірність перемоги ---- */
const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const H2H_K = 1.02;
const Erate = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));
/* Лінія букмекера на 31 жовтня, знята вночі через HLTV. Stake Ranked і
   півфінали Бухареста дограно, тож лишились гранд-фінал, бронза і Москва. */
const LINE = [
  ["Nemiga", "FURIA", 3.10, 1.36],
  ["Vitality", "MOUZ", 1.76, 2.03],
  ["HOTU", "The Huns", 1.08, 6.00],
  ["Abyssal", "NEXVOID", 5.50, 1.10],
];
const ODDS = new Map();
for (const [a, b, oa, ob] of LINE) {
  const s = 1 / oa + 1 / ob;
  ODDS.set(a + "|" + b, 1 / oa / s); ODDS.set(b + "|" + a, 1 / ob / s);
}
const Eof = (a, b, pa, pb) => (USE_ODDS && ODDS.has(a + "|" + b) ? ODDS.get(a + "|" + b) : Erate(pa, pb));

const ALL = [...P0.keys()];

/**
 * `force` прибиває результат конкретного матчу: { "A|B": "A" }.
 *
 * Потрібно, щоб питання «скільки коштує цей матч» мало чесну відповідь.
 * Фільтрувати готові прогони за тим, хто з двох закінчив вище, — не те саме:
 * так відбираються прогони, де команді взагалі все вдалося, і різниця між
 * гілками роздувається вдвічі.
 */
/** Що саме сталось у прогоні — для умовних питань «за яких обставин». */
export const LAST = {};

export function simulate(force = {}) {
  const pts = new Map(P0);
  const st = {};
  for (const [n, d] of Object.entries(DET))
    st[n] = { lan: d.lan.slice(), O: { raw: d.O.raw.slice(), comp: d.O.comp },
              N: { raw: d.N.raw.slice(), comp: d.N.comp }, C: { raw: d.C.raw.slice(), comp: d.C.comp } };

  const push = (s, key, value) => {
    const b = s[key], k = K[key];
    if (CAPS && b.raw.length >= SLOT_CAP) {
      const worst = Math.min(...b.raw);
      if (value <= worst) return 0;
      b.raw.splice(b.raw.indexOf(worst), 1);
    }
    b.raw.push(value);
    const next = compOf(b.raw.reduce((a, c) => a + c, 0), k);
    const d = next - b.comp; b.comp = next;
    return d;
  };
  const award = (w, l, ev) => {
    const s = st[w];
    if (!s) { pts.set(w, pts.get(w) + 18); return 18; }
    const was = pts.get(w), wt = weight(ev);
    if (CAPS && s.lan.length >= SLOT_CAP) pts.set(w, pts.get(w) + (LAN_BASE - s.lan.shift()));
    else pts.set(w, pts.get(w) + LAN_BASE);
    s.lan.push(LAN_BASE); s.lan.sort((a, b) => a - b);
    pts.set(w, pts.get(w) + push(s, "C", bountyOf(l) * wt) + push(s, "N", networkOf(l) * wt));
    return pts.get(w) - was;
  };
  const prize = (t, money) => {
    const s = st[t];
    if (!s || !money) return;
    const d = push(s, "O", money);
    pts.set(t, pts.get(t) + d - H2H_DAMP * d);
  };
  /* Таблиця вже нараховує «гарантовані» призові незавершеної події: трьом,
     хто лишився на Stake Ranked, зараховано по $13 500 за третє місце. Коли
     місце визначиться, цей рядок не додається поверх, а підміняється — інакше
     одна подія дасть команді дві виплати. */
  const upgrade = (t, from, to) => {
    const s = st[t];
    if (!s || to <= from) return;
    const i = s.O.raw.reduce((best, v, k) =>
      Math.abs(v - from) < Math.abs(s.O.raw[best] - from) ? k : best, 0);
    if (!s.O.raw.length) { prize(t, to); return; }
    const was = s.O.comp;
    s.O.raw[i] = to;
    s.O.comp = compOf(s.O.raw.reduce((a, c) => a + c, 0), K.O);
    const d = s.O.comp - was;
    pts.set(t, pts.get(t) + d - H2H_DAMP * d);
  };
  const play = (a, b, ev, forfeit = null) => {
    let w, l;
    const fk = force[a + "|" + b] ?? force[b + "|" + a];
    if (fk) { w = fk; l = w === a ? b : a; }
    else if (forfeit) { w = forfeit === a ? b : a; l = forfeit; }
    else { const ea = Eof(a, b, pts.get(a), pts.get(b)); [w, l] = Math.random() < ea ? [a, b] : [b, a]; }
    const ew = Eof(w, l, pts.get(w), pts.get(l));
    const transfer = H2H_K * KG * (1 - ew);
    const base = award(w, l, ev);
    pts.set(w, pts.get(w) + transfer - H2H_DAMP * base);
    pts.set(l, pts.get(l) - transfer);
    return w;
  };
  const otr = (p, w) => (p[0] === w ? p[1] : p[0]);
  /** Загальна сітка «до двох поразок», коли точного жереба немає. */
  const bracket = (field, ev, prizes = []) => {
    const rec = new Map(field.map((t) => [t, 0]));
    const order = [];
    for (let r = 0; r < 20; r++) {
      const alive = field.filter((t) => rec.get(t) < 2);
      if (alive.length < 2) break;
      const buckets = new Map();
      for (const t of alive) { const k = rec.get(t); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
      let any = false;
      for (const list of buckets.values()) {
        const left = list.slice().sort(() => Math.random() - 0.5);
        while (left.length > 1) {
          const t1 = left.shift(), t2 = left.shift();
          const w = play(t1, t2, ev), lost = w === t1 ? t2 : t1;
          rec.set(lost, rec.get(lost) + 1);
          if (rec.get(lost) === 2) order.unshift(lost);
          any = true;
        }
      }
      if (!any) break;
    }
    for (const t of field) if (rec.get(t) < 2) order.unshift(t);
    prizes.forEach((m, i) => { if (order[i]) prize(order[i], m); });
    return order;
  };

  /* ---- PGL Masters Bucharest, останній день ----
     Півфінали дограно: Nemiga 2-0 Vitality, FURIA 2-1 MOUZ. Лишився
     гранд-фінал Bo5 і матч за третє місце. */
  {
    const BUCH = 1_250_000;
    const champ = play("Nemiga", "FURIA", BUCH);
    prize(champ, 450_000); prize(champ === "Nemiga" ? "FURIA" : "Nemiga", 200_000);
    const third = play("Vitality", "MOUZ", BUCH);
    prize(third, 137_500); prize(third === "Vitality" ? "MOUZ" : "Vitality", 87_500);
  }

  /* ---- Moscow Cyber Games, 31 жовтня — 1 листопада ----
     Чотири команди, і це останній турнір, де ще можна рухати європейську
     відсічку: HOTU відстають від fnatic на п'ять очок, 1win уже вище. */
  {
    const MCG = 190_000;
    const s1 = play("HOTU", "The Huns", MCG), l1 = s1 === "HOTU" ? "The Huns" : "HOTU";
    const s2 = play("1win", "5star", MCG), l2 = s2 === "1win" ? "5star" : "1win";
    const champ = play(s1, s2, MCG);
    LAST.mcgChamp = champ;
    const second = champ === s1 ? s2 : s1;
    prize(champ, 100_000); prize(second, 50_000);
    const third = play(l1, l2, MCG);
    prize(third, 31_000);
    LAST.mcgHotu = champ === "HOTU" ? 1 : second === "HOTU" ? 2
      : third === "HOTU" ? 3 : 4;
  }

  /* ---- FiRe Last Chance, плей-оф ----
     Групи дограються зараз, 100 Thieves пройшли з двох перемог. Точні пари
     чвертьфіналів ще не зведені, тож плей-оф розігрується як сітка на вісім:
     для 100 Thieves це те саме, бо вони там уже є, а дрібні перестановки в
     групах на їхню гілку не впливають. */
  {
    const FS = 75_000;
    const field = ["100 Thieves", "NRG", "Wildcard", "BESTIA", "Fluxo",
                   "ShindeN", "Galorys", "Bounty Hunters"];
    const q = [play(field[0], field[7], FS), play(field[3], field[4], FS),
               play(field[2], field[5], FS), play(field[1], field[6], FS)];
    const s = [play(q[0], q[1], FS), play(q[2], q[3], FS)];
    const champ = play(s[0], s[1], FS);
    const second = champ === s[0] ? s[1] : s[0];
    LAST.fs100Tplace = champ === "100 Thieves" ? 1 : second === "100 Thieves" ? 2
      : s.includes("100 Thieves") ? 4 : 8;
    prize(champ, 40_000); prize(second, 15_000);
  }

  /* ---- Gamers Club Masters VII ---- */
  bracket(["paiN", "DENDELE", "Imperial", "Turma do Pagode", "ALKA", "QUINTESSÊNCIA",
           "NAOCOPULAS", "Low Cortisol BR"], 30_000, [12_000, 6_000, 4_000, 3_000]);

  /* ---- HyperX Retake Season 13, плей-оф ----
     НАВІ виграли групу, але в плей-оф не вийдуть: вони вже летять на IEM
     Beijing. Отже один техлуз у чвертьфіналі — суперник бере вільну перемогу,
     а далі сітка йде без них. */
  {
    const RT = 13_642;
    const pool = ["Iberian Soul", "Metizport", "OG", "BC.Game", "TYLOO",
                  "JiJieHao", "BASEMENT BOYS", "WBT Academy"];
    play(pool[Math.floor(Math.random() * pool.length)], "Natus Vincere", RT, "Natus Vincere");
    bracket(pool, RT, [7_800, 3_500, 2_100, 700]);
  }

  /* ---- DFRAG Invitational, гранд-фінал 1 листопада ----
     FlyQuest виграли верхню сітку й чекають суперника з нижньої. */
  {
    const DF = 27_886;
    const low = play(play("Abyssal", "NEXVOID", DF), "Alter Ego", DF);
    const champ = play("FlyQuest", low, DF);
    prize(champ, 10_000); prize(champ === "FlyQuest" ? low : "FlyQuest", 6_000);
  }

  /* ---- рух, якого формула не бачить ---- */
  if (NOISE_SD > 0) for (const t of ALL) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    pts.set(t, pts.get(t) + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * NOISE_SD);
  }
  return pts;
}

/* ---- прогін ---- */
export function run(n = RUNS, force = {}) {
  const sum = new Map(ALL.map((t) => [t, 0]));
  const sumSq = new Map(ALL.map((t) => [t, 0]));
  const qual = new Map(ALL.map((t) => [t, 0]));
  const stage = new Map(ALL.map((t) => [t, [0, 0, 0]]));
  const placeSum = new Map(ALL.map((t) => [t, 0]));
  const places = new Map(ALL.map((t) => [t, []]));
  for (let i = 0; i < n; i++) {
    const pts = simulate(force);
    for (const [reg, list] of Object.entries(TABLE)) {
      const order = list.slice().sort((a, b) => pts.get(b) - pts.get(a));
      const S = STAGES[reg];
      order.forEach((t, k) => {
        const place = k + 1;
        sum.set(t, sum.get(t) + pts.get(t));
        sumSq.set(t, sumSq.get(t) + pts.get(t) ** 2);
        placeSum.set(t, placeSum.get(t) + place);
        places.get(t).push(place);
        if (place <= SLOTS[reg]) {
          qual.set(t, qual.get(t) + 1);
          const s = stage.get(t);
          if (place <= S.s3) s[0]++;
          else if (place <= S.s3 + S.s2) s[1]++;
          else s[2]++;
        }
      });
    }
  }
  return { n, sum, sumSq, qual, stage, placeSum, places };
}

const DIRECT = process.argv[1] && process.argv[1].split(/[\\/]/).pop() === "engine-all.mjs";
if (DIRECT) {
  const r = run(RUNS);
  const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
  const show = (v) => (v > 99.9 ? ">99,9" : v < 0.1 ? "<0,1" : v.toFixed(1).replace(".", ","));
  console.log(`прогонів ${RUNS} · розкладів ${Object.keys(DET).length} · H2H_DAMP ${H2H_DAMP} · шум ${NOISE_SD}\n`);
  for (const [reg, list] of Object.entries(TABLE)) {
    console.log(`${{ europe: "ЄВРОПА", americas: "АМЕРИКА", asia: "АЗІЯ" }[reg]} — ${SLOTS[reg]} місць`);
    console.log("  місце  команда             очки     μ    σ   прохід");
    const order = list.slice().sort((a, b) => r.qual.get(b) - r.qual.get(a) ||
      r.placeSum.get(a) - r.placeSum.get(b));
    order.slice(0, SLOTS[reg] + 6).forEach((t, i) => {
      const mu = r.sum.get(t) / r.n;
      const sd = Math.sqrt(Math.max(0, r.sumSq.get(t) / r.n - mu * mu));
      console.log(`  ${String(i + 1).padStart(4)}   ${t.padEnd(18)}${String(P0.get(t)).padStart(5)}` +
        `${mu.toFixed(0).padStart(6)}${sd.toFixed(0).padStart(5)}` +
        `${show((100 * r.qual.get(t)) / r.n).padStart(8)}%` +
        `${i + 1 === SLOTS[reg] ? "   ← межа" : ""}`);
    });
    console.log();
  }
}
