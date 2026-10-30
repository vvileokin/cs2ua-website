import fs from "node:fs";
import path from "node:path";

/**
 * Рушій прогнозу інвайтів на мейджор, версія на опублікованій формулі VRS.
 *
 * Що вже вміє final-exact.mjs: рахує приріст по компонентах замість одного
 * каліброваного кроку, і знає, що «LAN wins» вміщує лише десять перемог.
 *
 * Тут додано три речі, яких немає ні там, ні — судячи зі сторінки SimDetail —
 * у Mischief. У нього намальована межа лише для «LAN wins» («LAN Wins Cap
 * Space»), а решта трьох компонентів виглядає як відкрита сума.
 *
 * ПЕРШЕ. Межа в десять рядків — не лише в «LAN wins». «Bounty offered»,
 * «Bounty collected» і «Opponent network» теж беруть ДЕСЯТЬ НАЙКРАЩИХ. Отже
 * нова перемога чи новий чек не додаються, а змагаються з найслабшим рядком
 * свого списку — і додають лише різницю. Для команди з сильним списком
 * скальпів чергова перемога над середняком не дає майже нічого. Без цього
 * приріст завищений тим сильніше, чим краще команда вже зіграла сезон.
 *
 * ДРУГЕ. «Bounty collected» рахує силу суперника НА МОМЕНТ ПЕРЕРАХУНКУ, а не
 * на момент матчу. Формула це описує прямо для H2H («recalculated every time»),
 * і множник суперника в ній — його ж призові за вікном, які змінюються. Отже
 * якщо ти переміг команду, а вона потім узяла великий турнір, твоя стара
 * перемога подорожчала сама собою. У прогоні це означає, що після того, як
 * розіграні всі призові, треба перерахувати списки скальпів усім. Ефект
 * односторонній — лише вгору, — і найбільший у тих, хто бив майбутніх
 * переможців.
 *
 * ТРЕТЄ. Де є лінія букмекера, ймовірність перемоги береться з неї, а не з
 * рейтингу. Перевірено на 32 парах Бухареста (fit-win.mjs): рейтингова крива
 * добра в середньому, але систематично хибна для НАВІ — лінія дає їм 30% проти
 * Spirit, рейтинг 25%, і так само на матчах із BETBOOM і G2 розбіжність була
 * 24-25 в.п. Для команди, заради якої все це рахується, це не дрібниця.
 *
 * Запуск: node engine.mjs [прогонів]
 *   SPIRIT=open|loss|win   RETAKE=play|forfeit|withdraw
 *   CAPS=0   вимкнути межі всіх компонентів (щоб побачити, скільки вони варті)
 *   RETRO=0  вимкнути перерахунок скальпів
 *   ODDS=0   не брати лінію букмекера
 *   SENS=1   порахувати ціну кожного матчу в пунктах проходу
 */

const RUNS = Number(process.argv[2] ?? 40000);
const SLOTS = Number(process.env.SLOTS ?? 18);
const SPIRIT = process.env.SPIRIT ?? "open";
const RETAKE = process.env.RETAKE ?? "play";
const CAPS = process.env.CAPS !== "0";
const RETRO = process.env.RETRO !== "0";
const USE_ODDS = process.env.ODDS !== "0";
/**
 * Рух таблиці, якого формула не бачить: H2H перераховується щодня по всіх
 * командах одразу, у списках «десять найкращих» згаслий рядок підмінює
 * одинадцятий, якого сторінка не показує, бувають зміни складу. Без цього
 * команда, яка не грає, стоїть із σ=0 — тобто сторінка обіцяє про неї
 * абсолютну певність, якої нема.
 *
 * Величина зміряна: смуга 1420–1485 проти смуги 1485–1545 розходиться на
 * −2,5 ± 6,9 очка за вікно (band-tilt.mjs, 13 вікон), що за п'ять днів до
 * відсічення дає близько ±11. Беремо 10 і перевіряємо, що відповідь від цього
 * майже не залежить.
 */
const NOISE_SD = Number(process.env.NOISE_SD ?? 10);
/**
 * Скільки приросту забирає назад H2H.
 *
 * H2H перераховується щоразу з нуля, і — як написано в поясненні на HLTV —
 * СПЕРШУ рахуються чотири інші компоненти й кожна команда дістає свій
 * «ranking starting point», а вже по цій новій висоті перерозподіляються очки
 * за всі матчі. Отже коли твоя база підскочила, старі перемоги над слабкими
 * знецінюються, старі поразки від сильних дорожчають, і H2H іде вниз.
 *
 * Зміряно 28 жовтня на трьох командах, що зіграли рівно по матчу:
 *
 *   B8       база +37  H2H −10   (перемога над K27)
 *   Nemiga   база +12  H2H  +8   (перемога над The MongolZ)
 *   Astralis база  +5  H2H  +6   (перемога над magic)
 *
 * Пряма передача мінус 0,56·Δбази лягає на всі три в межах трьох очок. Без
 * цього доданка рушій обіцяв B8 +51 за той матч, а сталось +27 — половина
 * матчу з'їдена саме тут. Це ж пояснює, чому старий калібрований крок узагалі
 * працював: він підганявся на ЧИСТИХ рухах таблиці, де компенсація вже сиділа
 * всередині, і тому не потребував окремого H2H.
 */
const H2H_DAMP = Number(process.env.H2H_DAMP ?? 0.56);
const SENS = process.env.SENS === "1";

export const K = { O: 19.4, C: 244, N: 100 };
export const POW = 0.23, BOUNTY_FULL = 600_000, SLOT_CAP = 10;
export const weight = (prize) => Math.pow(prize / 1_000_000, 0.3);
export const compOf = (raw, k) => k * Math.pow(Math.max(raw, 0), POW);
export const rawOf = (c, k) => Math.pow(Math.max(c, 1) / k, 1 / POW);

/* ---- таблиця ---- */
const EU = JSON.parse(fs.readFileSync("eu-2810.json", "utf8"));
export const P0 = new Map();
for (const s of EU.rows.split(";")) { const [, t, p] = s.split("|"); P0.set(t, +p); }
const OUTSIDE = { MIBR: 1586, "The Huns": 957, "5star": 1206, TYLOO: 1285, "BC.Game": 1392,
                  NRG: 1285, "The MongolZ": 1589, Liquid: 1539, FURIA: 1867 };
for (const [t, p] of Object.entries(OUTSIDE)) P0.set(t, p);
for (const t of ["Arena Pro Team", "Tactical Chaos", "Signatus", "BTH", "Teletubisie", "SNITKO",
                 "BARCA", "Bounty Hunters", "Galorys", "Procyon", "Fluxo", "ShindeN", "Isurus",
                 "Wildcard", "Hacha", "BESTIA", "Iberian Soul", "Metizport", "BASEMENT BOYS",
                 "OG", "SAW Youngsters", "WBT Academy", "ZOTIX"]) if (!P0.has(t)) P0.set(t, 600);

/* ---- розклади зі сторінок HLTV ---- */
export const DET = {};
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", f), "utf8"));
  const rows = (kk) => (j[kk] ?? []).map((s) => Number(s.split("|")[1]));
  const mk = (kk, idx, k) => {
    const shown = rows(kk);
    const comp = j.c[idx];
    const sumRaw = rawOf(comp, k);
    const sumShown = shown.reduce((a, b) => a + b, 0) || 1;
    /* Масштаб усередині команди спільний: показане = сире · comp/Σсире. */
    const scale = comp / sumRaw;
    return { comp, raw: shown.map((v) => v / scale), sumRaw, k };
  };
  DET[j.n] = {
    pts: j.p,
    lan: rows("L").slice().sort((a, b) => a - b),
    lanComp: j.c[0],
    O: mk("O", 2, K.O), N: mk("N", 1, K.N), C: mk("C", 3, K.C),
    h2h: j.c[4],
    /* Хто кого бив — для перерахунку скальпів треба знати суперника кожного
       рядка. Де його не збирав, рядок у перерахунок не входить. */
  };
}
export const bounty0 = (t) => (DET[t] ? Math.min(1, DET[t].O.sumRaw / BOUNTY_FULL)
                               : Math.min(1, 0.00018 * Math.max(0, P0.get(t) - 900)));
export const network0 = (t) => (DET[t] ? Math.min(1, DET[t].N.sumRaw / 3.2) : 0.35);

/* ---- ймовірність перемоги ---- */
const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const H2H_K = Number(process.env.H2H_K ?? 1.02);
const Erate = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));

/** Лінія betking / HLTV на заплановані матчі; маржа знімається пропорційно. */
const LINE = [
  ["Spirit", "Natus Vincere", 1.36, 3.10],
  ["BIG", "fnatic", 1.78, 1.95],
];
export const ODDS = new Map();
for (const [a, b, oa, ob] of LINE) {
  const s = 1 / oa + 1 / ob;
  ODDS.set(a + "|" + b, 1 / oa / s);
  ODDS.set(b + "|" + a, 1 / ob / s);
}
const Eof = (a, b, pa, pb) => {
  if (USE_ODDS && ODDS.has(a + "|" + b)) return ODDS.get(a + "|" + b);
  return Erate(pa, pb);
};

/* ---- один прогін ---- */
/** Команди, для яких рахується попарна статистика. Наші вісім. */
export const FOCUS = new Set(["FUT", "G2", "Astralis", "Natus Vincere", "Inner Circle", "fnatic", "B8", "Eternal Fire"]);
export const EU_TEAMS = EU.rows.split(";").map((s) => s.split("|")[1]);

/** Що саме сталось в останньому прогоні — для умовних питань на кшталт
 *  «а якщо у фіналі Stake Ranked зустрінуться ці двоє». Заповнюється кожним
 *  викликом simulate і читається одразу після нього. */
export const LAST = { srChamp: null, srSecond: null };

export function simulate(force = {}) {
  const pts = new Map(P0);
  const st = {};
  for (const [n, d] of Object.entries(DET))
    st[n] = {
      lan: d.lan.slice(), lanComp: d.lanComp,
      O: { raw: d.O.raw.slice(), comp: d.O.comp },
      N: { raw: d.N.raw.slice(), comp: d.N.comp },
      C: { raw: d.C.raw.slice(), comp: d.C.comp },
      scalps: [],                       // кого перемогли в прогоні: [суперник, вага]
    };

  /** Додати рядок у компонент із межею на десять найкращих. */
  const push = (s, key, value) => {
    const b = s[key], k = K[key];
    if (CAPS && b.raw.length >= SLOT_CAP) {
      const worst = Math.min(...b.raw);
      if (value <= worst) return 0;                       // не проходить у десятку
      b.raw.splice(b.raw.indexOf(worst), 1);
    }
    b.raw.push(value);
    const next = compOf(b.raw.reduce((a, c) => a + c, 0), k);
    const d = next - b.comp;
    b.comp = next;
    return d;
  };

  /** Повертає приріст у чотирьох компонентах — він потрібен для H2H. */
  const award = (w, l, ev) => {
    const s = st[w];
    if (!s) { pts.set(w, pts.get(w) + 18); return 18; }
    const was = pts.get(w);
    const wt = weight(ev);
    if (CAPS && s.lan.length >= SLOT_CAP) {
      const out = s.lan.shift();
      pts.set(w, pts.get(w) + (48 - out));
    } else pts.set(w, pts.get(w) + 48);
    s.lan.push(48); s.lan.sort((a, b) => a - b);
    pts.set(w, pts.get(w) + push(s, "C", bounty0(l) * wt));
    pts.set(w, pts.get(w) + push(s, "N", network0(l) * wt));
    s.scalps.push([l, wt]);
    return pts.get(w) - was;
  };
  const prize = (t, money) => {
    const s = st[t];
    if (!s || !money) return;
    /* Призові теж піднімають базу, отже теж тягнуть H2H униз. */
    const d = push(s, "O", money);
    pts.set(t, pts.get(t) + d - H2H_DAMP * d);
  };
  const play = (a, b, ev, forfeit = null) => {
    const key = a + "|" + b, rev = b + "|" + a;
    let w, l;
    if (force[key] || force[rev]) { w = force[key] ?? force[rev]; l = w === a ? b : a; }
    else if (forfeit) { w = forfeit === a ? b : a; l = forfeit; }
    else {
      const ea = Eof(a, b, pts.get(a), pts.get(b));
      [w, l] = Math.random() < ea ? [a, b] : [b, a];
    }
    const ew = Eof(w, l, pts.get(w), pts.get(l));
    const transfer = H2H_K * KG * (1 - ew);
    const base = award(w, l, ev);
    /* Переможцеві — пряма передача мінус те, що H2H забере назад через
       підняту базу. Переможеному база не рухається, тож він просто віддає
       передачу. */
    pts.set(w, pts.get(w) + transfer - H2H_DAMP * base);
    pts.set(l, pts.get(l) - transfer);
    return w;
  };
  const otr = (p, w) => (p[0] === w ? p[1] : p[0]);

  /* ---- Бухарест ---- */
  const BUCH = 1_250_000;
  {
    const r5 = [];
    if (SPIRIT === "open") r5.push(play("Spirit", "Natus Vincere", BUCH));
    else if (SPIRIT === "loss") { play("Spirit", "Natus Vincere", BUCH, "Natus Vincere"); r5.push("Spirit"); }
    else { play("Spirit", "Natus Vincere", BUCH, "Spirit"); r5.push("Natus Vincere"); }
    /* Решту п'ятого туру дограно 28 жовтня: Nemiga 2-0 The MongolZ,
       FURIA 2-0 Liquid. Лишився тільки Spirit — НАВІ. */
    const po = ["BETBOOM", "FUT", "Vitality", "MOUZ", "Aurora", "Nemiga", "FURIA", ...r5]
      .sort(() => Math.random() - 0.5);
    const qf = [play(po[0], po[1], BUCH), play(po[2], po[3], BUCH),
                play(po[4], po[5], BUCH), play(po[6], po[7], BUCH)];
    const sf = [play(qf[0], qf[1], BUCH), play(qf[2], qf[3], BUCH)];
    const champ = play(sf[0], sf[1], BUCH);
    prize(champ, 225_000); prize(champ === sf[0] ? sf[1] : sf[0], 100_000);
    for (const t of qf) if (!sf.includes(t)) prize(t, 50_000);
  }
  /* ---- Stake Ranked Episode 5 ---- */
  const SR = 100_000;
  {
    const u1 = ["BIG", "fnatic"], u2 = ["Inner Circle", "MIBR"];
    const a = play(...u1, SR), b = otr(u1, a);
    const c = play(...u2, SR), d = otr(u2, c);
    const ubf = play(a, c, SR), ubfL = ubf === a ? c : a;
    /* Astralis 2-1 magic дограно 28 жовтня — magic поїхали на 7-8 місці. */
    const l1 = "Astralis", l1L = "magic";
    const l2 = play("Nemesis", "Eternal Fire", SR), l2L = l2 === "Nemesis" ? "Eternal Fire" : "Nemesis";
    const q1 = play(b, l2, SR), q2 = play(d, l1, SR);
    const sf = play(q1, q2, SR), sfL = sf === q1 ? q2 : q1;
    const lbf = play(ubfL, sf, SR), lbfL = lbf === ubfL ? sf : ubfL;
    const champ = play(ubf, lbf, SR), second = champ === ubf ? lbf : ubf;
    LAST.srChamp = champ; LAST.srSecond = second;
    prize(champ, 25_000); prize(second, 17_500);
    prize(lbfL, 13_500); prize(sfL, 11_000);
    prize(q1 === sf ? q2 : q1, 9_000); prize(l1L, 7_500); prize(l2L, 7_500);
  }
  /* ---- Tesla Cup ---- */
  const TC = 50_000;
  {
    /* Група A: FaZe перші (2-0 Alliance, 2-0 K27). B8 28 жовтня 2-1 перемогли
       Alliance і вийшли на K27 за друге місце — Alliance поїхали четвертими. */
    /* Група A дограна: FaZe перші, B8 2-1 перемогли K27 і пройшли другими. */
    const a2 = "B8";
    const b1 = play("HOTU", "GamerLegion", TC), l1 = b1 === "HOTU" ? "GamerLegion" : "HOTU";
    const b2 = play(l1, play("Luminosity", "Envy", TC), TC);
    const s1 = play("FaZe", b2, TC), s2 = play(b1, a2, TC);
    const champ = play(s1, s2, TC);
    prize(champ, 30_000); prize(champ === s1 ? s2 : s1, 12_000);
  }
  /* ---- Москва ---- */
  const MCG = 190_000;
  {
    const s1 = play("HOTU", "The Huns", MCG), l1 = s1 === "HOTU" ? "The Huns" : "HOTU";
    const s2 = play("1win", "5star", MCG), l2 = s2 === "1win" ? "5star" : "1win";
    const champ = play(s1, s2, MCG);
    prize(champ, 100_000); prize(champ === s1 ? s2 : s1, 50_000);
    prize(play(l1, l2, MCG), 31_000);
  }
  /* ---- FiReSPORTS Last Chance ---- */
  const FS = 75_000;
  {
    const gsl = (o1, o2) => {
      const w1 = play(...o1, FS), l1 = otr(o1, w1);
      const w2 = play(...o2, FS), l2 = otr(o2, w2);
      const first = play(w1, w2, FS), firstL = first === w1 ? w2 : w1;
      return [first, play(firstL, play(l1, l2, FS), FS)];
    };
    const [a1, a2] = gsl(["100 Thieves", "Arena Pro Team"], ["BARCA", "Bounty Hunters"]);
    const [b1, b2] = gsl(["NRG", "Tactical Chaos"], ["Galorys", "Procyon"]);
    const [c1, c2] = gsl(["Fluxo", "Signatus"], ["ShindeN", "Isurus"]);
    const [d1, d2] = gsl(["Wildcard", "Hacha"], ["BESTIA", "BTH"]);
    const q = [play(a1, d2, FS), play(b1, c2, FS), play(c1, b2, FS), play(d1, a2, FS)];
    const s = [play(q[0], q[1], FS), play(q[2], q[3], FS)];
    const champ = play(s[0], s[1], FS);
    prize(champ, 40_000); prize(champ === s[0] ? s[1] : s[0], 15_000);
  }
  /* ---- Retake 13 ---- */
  const RT = 14_300;
  {
    if (RETAKE === "forfeit") {
      const first = play("BASEMENT BOYS", "Teletubisie", RT);
      play(first, "Natus Vincere", RT, "Natus Vincere");
      const pool = ["Iberian Soul", "Metizport", "OG", "SAW Youngsters", "WBT Academy", "SNITKO", "ZOTIX"];
      play(pool[Math.floor(Math.random() * pool.length)], "Natus Vincere", RT, "Natus Vincere");
    }
    const field = (RETAKE === "play" ? ["Natus Vincere"] : []).concat(
      ["TYLOO", "JiJieHao", "BC.Game", "Iberian Soul", "Metizport",
       "BASEMENT BOYS", "OG", "SAW Youngsters", "WBT Academy", "SNITKO", "ZOTIX"]);
    const rec = new Map(field.map((t) => [t, 0]));
    for (let r = 0; r < 20; r++) {
      const alive = field.filter((t) => rec.get(t) < 2);
      if (alive.length < 2) break;
      const bucket = new Map();
      for (const t of alive) { const k = rec.get(t); if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(t); }
      let any = false;
      for (const list of bucket.values()) {
        const left = list.slice().sort(() => Math.random() - 0.5);
        while (left.length > 1) {
          const t1 = left.shift(), t2 = left.shift();
          const w = play(t1, t2, RT);
          rec.set(w === t1 ? t2 : t1, rec.get(w === t1 ? t2 : t1) + 1);
          any = true;
        }
      }
      if (!any) break;
    }
  }

  /* ---- перерахунок скальпів за новою силою суперників ----
     Множник суперника — його ж призові за вікном. Призові щойно розіграли,
     тож команда, яку ти переміг на початку тижня, до відсічення може стати
     дорожчою, і твій рядок подорожчає разом із нею. */
  if (RETRO) for (const [n, s] of Object.entries(st)) {
    let gain = 0;
    for (const [opp, wt] of s.scalps) {
      const b0 = bounty0(opp);
      const b1 = st[opp] ? Math.min(1, rawOf(st[opp].O.comp, K.O) / BOUNTY_FULL) : b0;
      if (b1 <= b0) continue;
      const i = s.C.raw.indexOf(b0 * wt);
      if (i < 0) continue;
      s.C.raw[i] = b1 * wt;
      const next = compOf(s.C.raw.reduce((a, c) => a + c, 0), K.C);
      gain += next - s.C.comp; s.C.comp = next;
    }
    if (gain) pts.set(n, pts.get(n) + gain);
  }
  /* Шум прикладається в самому кінці, однаково до всіх — і до тих, хто грав,
     і до тих, хто ні. Він симетричний, тож середні не зсуває; зсуває лише
     впевненість, і саме це й треба. */
  if (NOISE_SD > 0) for (const t of EU_TEAMS) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    pts.set(t, pts.get(t) + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * NOISE_SD);
  }
  return pts;
}

/* ---- прогін ---- */
export const run = (force = {}, n = RUNS) => {
  const sum = new Map(EU_TEAMS.map((t) => [t, 0]));
  const above = new Map(EU_TEAMS.map((t) => [t, 0]));   // скільки разів вище за НАВІ
  /* Відсоток проходу рахується для КОЖНОЇ команди, а не лише для НАВІ:
     сторінка команди потрібна всім вісьмом нашим, і другий прогін заради
     кожної з них був би втричі довшим без жодної користі. */
  const qual = new Map(EU_TEAMS.map((t) => [t, 0]));
  const placeSum = new Map(EU_TEAMS.map((t) => [t, 0]));
  /* Для сторінки команди потрібно не лише «скільком удалось вище», а ХТО саме.
     Рахується попарно для наших вісьмох — 280 лічильників, дешево. */
  const pair = new Map();
  const places = new Map();
  const naviPts = [];
  let ok = 0;
  for (let i = 0; i < n; i++) {
    const pts = simulate(force);
    const navi = pts.get("Natus Vincere");
    naviPts.push(navi);
    let cnt = 0;
    for (const t of EU_TEAMS) {
      sum.set(t, sum.get(t) + pts.get(t));
      if (t !== "Natus Vincere" && pts.get(t) > navi) { above.set(t, above.get(t) + 1); cnt++; }
    }
    for (const t of EU_TEAMS) {
      const mine = pts.get(t);
      let higher = 0;
      for (const o of EU_TEAMS) if (o !== t && pts.get(o) > mine) higher++;
      placeSum.set(t, placeSum.get(t) + higher + 1);
      if (higher <= SLOTS - 1) qual.set(t, qual.get(t) + 1);
      if (FOCUS.has(t)) for (const o of EU_TEAMS) {
        if (o === t) continue;
        if (pts.get(o) > mine) { const k = t + "|" + o; pair.set(k, (pair.get(k) ?? 0) + 1); }
      }
    }
    places.set(cnt + 1, (places.get(cnt + 1) ?? 0) + 1);
    if (cnt <= SLOTS - 1) ok++;
  }
  return { p: (100 * ok) / n, sum, above, qual, placeSum, pair, places, naviPts, n };
};

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
const show = (v) => (v > 99.9 ? ">99,9" : v < 0.1 ? "<0,1" : v.toFixed(1).replace(".", ","));

/* Звіт — лише коли файл запускають напряму. Як модуль він потрібен
   team-detail.mjs, і там зайвий вивід тільки шкодить. */
const DIRECT = Boolean(process.argv[1] && process.argv[1].split(/[\\/]/).pop() === "engine.mjs");
if (DIRECT) {
  const base = run();
  console.log(`прогонів ${RUNS} · Європа ${SLOTS} місць`);
  console.log(`межі компонентів ${CAPS ? "так" : "НІ"} · перерахунок скальпів ${RETRO ? "так" : "НІ"} · лінія ${USE_ODDS ? "так" : "НІ"}`);
  console.log(`сценарій: ${{ open: "матч зі Spirit попереду", loss: "програли Spirit", win: "перемогли Spirit" }[SPIRIT]}, ` +
    `${{ play: "грають Retake", forfeit: "два техлузи", withdraw: "знялись" }[RETAKE]}\n`);
  console.log(`НАВІ: ${P0.get("Natus Vincere")} → ${mean(base.naviPts).toFixed(0)}  (5–95%: ${qt(base.naviPts, 0.05).toFixed(0)}–${qt(base.naviPts, 0.95).toFixed(0)})`);
  console.log(`ПРОХІД: ${show(base.p)}%\n`);
  console.log("команда             28.10   середнє     рух   вище НАВІ");
  for (const t of EU_TEAMS.sort((a, b) => P0.get(b) - P0.get(a))) {
    const avg = base.sum.get(t) / RUNS, d = avg - P0.get(t);
    const line = `  ${t.padEnd(18)}${String(P0.get(t)).padStart(5)}${avg.toFixed(0).padStart(10)}` +
      `${((d >= 0 ? "+" : "") + d.toFixed(0)).padStart(8)}`;
    console.log(t === "Natus Vincere" ? line + "        —" :
      line + `${show((100 * base.above.get(t)) / RUNS).padStart(10)}%`);
  }

  if (SENS) {
    console.log("\nціна матчу в пунктах проходу (для НАВІ):");
    for (const [a, b] of [["Spirit", "Natus Vincere"], ["BIG", "fnatic"],
                          ["Inner Circle", "MIBR"], ["HOTU", "GamerLegion"],
                          ["1win", "5star"], ["Alliance", "B8"]]) {
      const n = Math.max(4000, Math.round(RUNS / 5));
      const wa = run({ [a + "|" + b]: a }, n).p, wb = run({ [a + "|" + b]: b }, n).p;
      console.log(`  ${(a + " — " + b).padEnd(30)}${a} виграє ${show(wa)}%  ·  ${b} виграє ${show(wb)}%` +
        `  ·  вага ${Math.abs(wa - wb).toFixed(1).replace(".", ",")} п.`);
    }
  }

}
