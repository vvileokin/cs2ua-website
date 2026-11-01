import fs from "node:fs";
import path from "node:path";
import { drift } from "./drift-exact.mjs";

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
const NOISE_SD = Number(process.env.NOISE_SD ?? 2.43);
const MATCH_SD = Number(process.env.MATCH_SD ?? 2.05);
/* Скільки діб від дати таблиці до відсічення: зріз за 31 жовтня, інвайти
   роздаються 2 листопада. */
const DAYS = Number(process.env.DAYS ?? 2);
/* Скільки H2H забирає назад, коли база підскочила. 0,56 було зміряно на днях,
   де Δбаза була мала. На чотирьох командах FiRe за 31 жовтня, де сторінка
   розкладу віддає компоненти на обидві дати: BESTIA 0,638, Wildcard 0,637,
   BARCA 0,606, Isurus 0,469 — зважено за Δбазою 0,584 (h2h-damp-0111.mjs). */
const H2H_DAMP = Number(process.env.H2H_DAMP ?? 0.59);

/* K.O перевірено на опублікованих сумах призових: сторінка розкладу друкує
   і суму в доларах, і recency кожного рядка, тож масштаб не треба вгадувати.
   HOTU 252 p на $78 073 → 18,88; 100 Thieves 237 на $59 306 → 18,91;
   Eternal Fire 238 на $60 126 → 18,94. Колишні 19,4 занижували базу на 10%,
   а отже завищували, скільки коштує новий чек. */
const K = { O: 18.9, C: 244, N: 100 };
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

/* ---- дрейф до відсічення ----
   Найнадійніше джерело тут не моя модель, а сама HLTV: вона друкує прогноз
   таблиці на дату відсічення без симуляції, тобто той самий детермінований
   спад, обчислений на повній базі матчів. Для кого він опублікований — беремо
   його, і це рівно ті команди, що стоять на межах квот. Для решти лишається
   мій рядковий спад, підігнаний під ці ж 20 точок: ×0,64 і легке роздуття
   0,16%, залишок σ 2,43 (drift-vs-hltv.mjs). Без підгонки мій спад давав
   σ 4,04, а «жодного спаду» — 2,86: за ці дві доби таблиця майже не рухається,
   і мої колишні −10 очок за добу були підгонкою під один невдалий день. */
const SCALE = Number(process.env.DRIFT_SCALE ?? 0.64);
const DEFLATE = Number(process.env.DEFLATE ?? -0.0016);
const PROJ = JSON.parse(fs.readFileSync("proj-0211.json", "utf8"));
export const DRIFT = new Map();
for (const f of fs.readdirSync("vrs-details")) {
  const r = drift(f, DAYS);
  DRIFT.set(r.team, SCALE * r.d - DEFLATE * Math.max(0, r.p - 400));
}
/* Опубліковане перебиває порахованe — і для цих команд дрейф уже не
   оцінка, а величина, тож шуму на ній немає. */
export const EXACT = new Set();
for (const [t, v] of Object.entries(PROJ.pts))
  if (P0.has(t)) { DRIFT.set(t, v - P0.get(t)); EXACT.add(t); }
/* TYLOO у п'ятірці HLTV немає, а п'яті там Lynn Vision на 1261 — отже
   TYLOO строго нижче. Межа, не вгадана цифра. */
for (const [t, v] of Object.entries(PROJ.bound))
  if (P0.has(t)) { DRIFT.set(t, v - P0.get(t)); EXACT.add(t); }

const bountyOf = (t) => (DET[t] ? Math.min(1, DET[t].rawO / BOUNTY_FULL)
                                : Math.min(1, 0.00018 * Math.max(0, (P0.get(t) ?? 600) - 900)));
const networkOf = (t) => (DET[t] ? Math.min(1, DET[t].rawN / 3.2) : 0.3);

/* ---- ймовірність перемоги ---- */
const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const H2H_A = Number(process.env.H2H_A ?? 32.5);
const H2H_S = Number(process.env.H2H_S ?? 190);
const Erate = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));
/* Лінія на 1 листопада. Бухарест дограно (FURIA 3-2 Nemiga), лишились
   фінали дрібніших подій — і єдиний, що важить для відсічки, це Москва. */
const LINE = [
  ["HOTU", "1win", 1.91, 1.77],
  ["FlyQuest", "Alter Ego", 1.15, 4.40],
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
  const played = new Map();
  const play = (a, b, ev, forfeit = null) => {
    let w, l;
    const fk = force[a + "|" + b] ?? force[b + "|" + a];
    if (fk) { w = fk; l = w === a ? b : a; }
    else if (forfeit) { w = forfeit === a ? b : a; l = forfeit; }
    else { const ea = Eof(a, b, pts.get(a), pts.get(b)); [w, l] = Math.random() < ea ? [a, b] : [b, a]; }
    const ew = Eof(w, l, pts.get(w), pts.get(l));
    /* Передача H2H. Алгоритм описано на самій сторінці HLTV: спершу рахуються
       чотири інші компоненти, кожна команда дістає «ranking starting point», і
       далі всі матчі проходяться від найстарішого до найновішого, переносячи
       очки від того, хто програв, до переможця — тим більше, чим нижче стояв
       переможець. Розмір події на це не впливає взагалі: перемога над The Huns
       на ЛАНі за $181 000 дала HOTU +2, а над B8 на турнірі за $30 000 — +17.

       Форму підігнано на 367 опублікованих матчах (h2h-model.mjs). Логістика
       по РІЗНИЦІ рейтингів лягає найкраще:

         transfer = 32,5 / (1 + e^((Rw − Rl)/190)) · recency     σ 2,12

       Крива Glicko, яку я тут тримав раніше, давала σ 2,46 і системно
       завищувала проти слабких суперників — саме через неї 100 Thieves
       виходили вище за Eternal Fire. */
    const transfer = H2H_A / (1 + Math.exp((pts.get(w) - pts.get(l)) / H2H_S));
    const base = award(w, l, ev);
    pts.set(w, pts.get(w) + transfer - H2H_DAMP * base);
    pts.set(l, pts.get(l) - transfer);
    played.set(a, (played.get(a) ?? 0) + 1);
    played.set(b, (played.get(b) ?? 0) + 1);
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

  /* ---- Moscow Cyber Games, гранд-фінал 1 листопада ----
     HOTU 2-0 The Huns, 1win 2-0 5star — обидва у фіналі. Це єдина подія, що
     ще може зрушити європейську відсічку: HOTU стоять вісімнадцятими, а
     гроші за місце в таблиці ще НЕ зараховані (у них висить рядок на $6 041
     за участь, не за призове місце). */
  {
    const MCG = 181_214;                       // $96 646 / $48 323 / $30 204 / $6 041
    const champ = play("HOTU", "1win", MCG);
    const second = champ === "HOTU" ? "1win" : "HOTU";
    LAST.mcgChamp = champ;
    LAST.mcgHotu = champ === "HOTU" ? 1 : 2;
    /* Усім чотирьом уже нараховано $6 041 за четверте місце — підміняємо, а
       не додаємо. */
    upgrade(champ, 6_041, 96_646); upgrade(second, 6_041, 48_323);
    const third = play("The Huns", "5star", MCG);
    upgrade(third, 6_041, 30_204);
  }

  /* ---- FiRe Last Chance, плей-оф ----
     Сітка з сторінки події, а не вгадана: чвертьфінали йдуть просто зараз
     (100 Thieves — Isurus, NRG — Wildcard), а BESTIA й BARCA свої вже
     зіграли 31 жовтня і чекають у півфіналах. Раніше рушій переграв ті два
     матчі заново — BESTIA і BARCA діставали очки двічі. 100 Thieves —
     останній європеєць, що ще грає. */
  {
    const FS = 75_000;                 // $40k / $15k / $6,5k / $3,5k / $2,5k
    /* 100 Thieves 2-0 Isurus — чвертьфінал дограно. */
    const q1 = play("100 Thieves", "Isurus", FS, "Isurus");
    const q2 = play("NRG", "Wildcard", FS);
    const s1 = play("BESTIA", q1, FS), s2 = play("BARCA", q2, FS);
    const l1 = s1 === "BESTIA" ? q1 : "BESTIA", l2 = s2 === "BARCA" ? q2 : "BARCA";
    const champ = play(s1, s2, FS);
    const second = champ === s1 ? s2 : s1;
    const third = play(l1, l2, FS);
    LAST.fsChamp = champ;
    LAST.fs100Tplace = champ === "100 Thieves" ? 1 : second === "100 Thieves" ? 2
      : third === "100 Thieves" ? 3 : [l1, l2].includes("100 Thieves") ? 4 : 8;
    /* Четверо, що лишились у сітці, мають нараховані $2 500 за 5-8 місце. */
    upgrade(champ, 2_500, 40_000); upgrade(second, 2_500, 15_000);
    upgrade(third, 2_500, 6_500);
  }

  /* ---- Gamers Club Masters VII, останні матчі ---- */
  {
    const GC = 30_000;
    const semi = play("Imperial", "Low Cortisol BR", GC);
    const champ = play("DENDELE", semi, GC);
    prize(champ, 12_000); prize(champ === "DENDELE" ? semi : "DENDELE", 6_000);
  }

  /* ---- HyperX Retake Season 13, півфінали й фінал ----
     НАВІ віддали чвертьфінал технічною поразкою — вони вже летять на
     IEM Beijing. У сітці лишились четверо. */
  {
    const RT = 13_642;
    const f1 = play("Metizport", "JiJieHao", RT);
    const f2 = play("WBT Academy", "Iberian Soul", RT);
    const champ = play(f1, f2, RT);
    prize(champ, 7_800); prize(champ === f1 ? f2 : f1, 3_500);
  }

  /* ---- DFRAG Invitational, гранд-фінал ---- */
  {
    const DF = 27_886;
    const champ = play("FlyQuest", "Alter Ego", DF);
    prize(champ, 10_000); prize(champ === "FlyQuest" ? "Alter Ego" : "FlyQuest", 6_000);
  }

  /* ---- дрейф до відсічення ----
     Раніше тут стояв симетричний шум із нулем у середньому. Він неправильний:
     рух неграючої команди не випадковий, він майже повністю обчислюється.
     Кожен рядок розкладу має свою recency, і за добу вона падає — це
     обчислюється точно (drift-exact.mjs). Поверх цього вся таблиця щодоби
     зсувається спільно, і той зсув НЕ стала величина: 29→30 жовтня він був
     +1,3, а 30→31 уже −10,9 (drift-fit.mjs). Але він пропорційний очкам, а
     отже між сусідами по таблиці скасовується й місць не змінює. Те, що
     справді вирішує місця, — залишок після спільного зсуву, і він малий:
     σ 1,81 очка за добу на 28 спостереженнях. Саме він тут і стоїть шумом,
     а не колишні 10 очок, узяті зі старої каліброваної моделі. */
  for (const t of ALL) {
    const d = DRIFT.get(t);
    const dec = d != null ? d : -0.0028 * DAYS * Math.max(0, pts.get(t) - 400);
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    /* Де дрейф узято з опублікованого прогнозу, невизначеності в ньому
       немає — але вона лишається в тому, що МИ рахуємо самі: у ціні кожного
       зіграного матчу. Залишок кривої H2H σ 1,85 на матч, плюс ~0,9 на
       похибку концавних компонентів — разом ≈2,05, і росте як корінь із
       кількості матчів. Команда, що не грає, стоїть точно.
       Через це розрив у два очки між fnatic і HOTU — не нуль відсотків:
       fnatic стоять твердо, а HOTU по дорозі проходять фінал Москви. */
    const nm = Math.sqrt(played.get(t) ?? 0) * MATCH_SD;
    const base = EXACT.has(t) ? 0 : NOISE_SD;
    const sd = Math.sqrt(base * base + nm * nm);
    const noise = sd === 0 ? 0
      : Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
    pts.set(t, pts.get(t) + dec + noise);
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
