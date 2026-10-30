import fs from "node:fs";
import path from "node:path";

/**
 * Прохід НАВІ на мейджор, порахований за опублікованою формулою VRS.
 *
 * Чим це відрізняється від chasers-2810.mjs. Там приріст за матч давав
 * калібрований крок Glicko — одне число на всіх, підігнане під спостережені
 * рухи таблиці. Він працював непогано, і я його перевіряв (22 серії Бухареста,
 * похибка 19 очок на команду; Stake Ranked Episode 4, переможцю обіцяв +146
 * проти реальних +159). Але він у принципі не бачив будови рейтингу, а будова
 * опублікована:
 *
 *   VRS = 400 + LAN wins + Opp. network + Bounty offered + Bounty collected + H2H
 *
 * і з неї видно дві речі, через які одне число на всіх бути не може.
 *
 * ПЕРША. «LAN wins» — десять НАЙСВІЖІШИХ перемог на ЛАНі, кожна по 48·давнина,
 * і більше туди не влазить. У команди, в якої всі десять свіжі, нова перемога
 * витісняє таку саму й додає нуль. Це не теорія, це прямо з розкладу:
 *
 *   НАВІ +43 за перемогу (найслабший рядок 5)      100 Thieves  +1 (найслабший 47)
 *   HOTU +38                                        JiJieHao     +0 (усі по 48)
 *   B8   +28                                        NiP          +0
 *   BIG, Inner Circle, fnatic +16                    Nemiga       +4
 *
 * Тому Vitality 27 жовтня ПЕРЕМОГЛИ НАВІ й втратили 9 очок, а НАВІ 25-го
 * перемогли FURIA й узяли +81. Крок на це не здатен ніяк.
 *
 * ДРУГА. Решта компонентів має степінь 0,23: подвоєння призових додає лише 17%.
 * Звідси й відповідь на «чи великі турніри дають більше» — дають, але
 * переможець мільйонного ЛАНу не бере +800, бо компонент стиснутий степенем.
 *
 * Що тут лишається моделлю: H2H. Він перерозподіляє очки між суперниками
 * залежно від їхніх рейтингів і давнини — тобто це і є той Glicko, який я
 * калібрував, і саме тому калібрування працювало. Його й лишаю кроком, але
 * тільки його, а не весь приріст. Це також пояснює асиметрію WIN_K 2,16 /
 * LOSS_K 1,02, яку я колись підігнав і не вмів витлумачити: перемога дає H2H
 * плюс чотири компоненти, поразка — лише H2H.
 *
 * Запуск: node final-exact.mjs [прогонів]
 */

const RUNS = Number(process.argv[2] ?? 60000);
const SLOTS = Number(process.env.SLOTS ?? 18);
const SPIRIT = process.env.SPIRIT ?? "loss";
const RETAKE = process.env.RETAKE ?? "forfeit";

const K_O = 19.4, K_C = 244, K_N = 100, POW = 0.23, BOUNTY_FULL = 600_000;
const weight = (prize) => Math.pow(prize / 1_000_000, 0.3);
const rawOf = (c, K) => Math.pow(Math.max(c, 1) / K, 1 / POW);
const compOf = (r, K) => K * Math.pow(Math.max(r, 0), POW);

/* ---- стан команд ---- */
const EU = JSON.parse(fs.readFileSync("eu-2810.json", "utf8"));
const P0 = new Map();
for (const s of EU.rows.split(";")) { const [, t, p] = s.split("|"); P0.set(t, +p); }
/* Неєвропейські учасники тих самих сіток. Без них Бухарест рахувався на
   undefined і NaN тихо розповзався по всьому турніру — а команда з NaN у
   порівнянні «вище за НАВІ» завжди давала «ні», тобто прохід виходив завищений. */
P0.set("MIBR", 1586); P0.set("The Huns", 957); P0.set("5star", 1206);
P0.set("TYLOO", 1285); P0.set("BC.Game", 1392); P0.set("NRG", 1285);
P0.set("The MongolZ", 1589); P0.set("Liquid", 1539); P0.set("FURIA", 1867);
for (const t of ["Arena Pro Team", "Tactical Chaos", "Signatus", "BTH", "Teletubisie", "SNITKO",
                 "BARCA", "Bounty Hunters", "Galorys", "Procyon", "Fluxo", "ShindeN", "Isurus",
                 "Wildcard", "Hacha", "BESTIA", "Iberian Soul", "Metizport", "BASEMENT BOYS",
                 "OG", "SAW Youngsters", "WBT Academy", "ZOTIX"])
  if (!P0.has(t)) P0.set(t, 600);

/** Розклад зі сторінок HLTV — для тих, у кого він є. */
const DET = {};
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync(path.join("vrs-details", f), "utf8"));
  DET[j.n] = {
    L: (j.L ?? []).map((s) => Number(s.split("|")[1])).sort((a, b) => a - b),
    cL: j.c[0], cN: j.c[1], cO: j.c[2], cC: j.c[3],
    rO: rawOf(j.c[2], K_O), rC: rawOf(j.c[3], K_C), rN: rawOf(j.c[1], K_N),
  };
}
/** Множник суперника: це його ж призові за вікном, у частках від найкращих. */
const bountyOf = (t) => DET[t] ? Math.min(1, DET[t].rO / BOUNTY_FULL) : Math.min(1, 0.00018 * Math.max(0, P0.get(t) - 900));
const networkOf = (t) => (DET[t] ? Math.min(1, DET[t].rN / 3.2) : 0.35);

/* ---- H2H: той самий калібрований крок, але тепер тільки для H2H ---- */
const Q = Math.log(10) / 400, RD = 75, D = 817.4;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const H2H_K = Number(process.env.H2H_K ?? 1.02);
const Eof = (a, b) => 1 / (1 + Math.pow(10, (gl * (a - b)) / -D));

/* ---- симуляція ---- */
const EU_TEAMS = EU.rows.split(";").map((s) => s.split("|")[1]);
const sum = new Map(EU_TEAMS.map((t) => [t, 0]));
const passed = new Map(EU_TEAMS.map((t) => [t, 0]));
const naviPts = [];
const places = new Map();
let good = 0;

for (let run = 0; run < RUNS; run++) {
  const pts = new Map(P0);
  /* Для кожної команди з розкладом — своя копія стану компонентів. */
  const st = {};
  for (const [n, d] of Object.entries(DET))
    st[n] = { L: d.L.slice(), cL: d.cL, rO: d.rO, rC: d.rC, rN: d.rN, cO: d.cO, cC: d.cC, cN: d.cN };

  /** Перемога: чотири компоненти за формулою плюс H2H. */
  const award = (w, l, ev) => {
    const s = st[w];
    if (s) {
      const out = s.L.length >= 10 ? s.L.shift() : 0;
      pts.set(w, pts.get(w) + (48 - out));
      s.L.push(48); s.L.sort((a, b) => a - b);
      const wt = weight(ev);
      const nC = compOf(s.rC + bountyOf(l) * wt, K_C);
      const nN = compOf(s.rN + networkOf(l) * wt, K_N);
      pts.set(w, pts.get(w) + (nC - s.cC) + (nN - s.cN));
      s.rC += bountyOf(l) * wt; s.cC = nC;
      s.rN += networkOf(l) * wt; s.cN = nN;
    } else {
      /* Без розкладу — середнє по тих, у кого він є. */
      pts.set(w, pts.get(w) + 18);
    }
  };
  /** Призові: єдиний компонент, що не залежить від того, кого ти переміг. */
  const prize = (t, money) => {
    const s = st[t];
    if (!s || !money) return;
    const nO = compOf(s.rO + money, K_O);
    pts.set(t, pts.get(t) + (nO - s.cO));
    s.rO += money; s.cO = nO;
  };
  /** Один матч. */
  const play = (a, b, ev, forfeit = null) => {
    const ea = Eof(pts.get(a), pts.get(b));
    const aw = forfeit ? forfeit !== a : Math.random() < ea;
    const [w, l] = aw ? [a, b] : [b, a];
    const ew = aw ? ea : 1 - ea;
    const h = H2H_K * KG * (1 - ew);          // перерозподіл H2H, нульова сума
    pts.set(w, pts.get(w) + h);
    pts.set(l, pts.get(l) - h);
    award(w, l, ev);
    return w;
  };
  const otr = (p, w) => (p[0] === w ? p[1] : p[0]);

  /* ---- Бухарест: п'ятий тур і плей-оф ---- */
  const BUCH = 1_250_000;
  {
    const r5 = [];
    /* open — матч ще не зіграно й результат випадковий; loss/win — умова сценарію. */
    if (SPIRIT === "open") r5.push(play("Spirit", "Natus Vincere", BUCH));
    else if (SPIRIT === "loss") { play("Spirit", "Natus Vincere", BUCH, "Natus Vincere"); r5.push("Spirit"); }
    else { play("Spirit", "Natus Vincere", BUCH, "Spirit"); r5.push("Natus Vincere"); }
    r5.push(play("The MongolZ", "Nemiga", BUCH), play("Liquid", "FURIA", BUCH));
    /* Призові за груповий етап уже в розкладі за 27 жовтня, тож тут лише
       плей-оф. 9-11 місце ($31 250) НАВІ отримали й воно враховане. */
    const po = ["BETBOOM", "FUT", "Vitality", "MOUZ", "Aurora", ...r5].sort(() => Math.random() - 0.5);
    const qf = [play(po[0], po[1], BUCH), play(po[2], po[3], BUCH),
                play(po[4], po[5], BUCH), play(po[6], po[7], BUCH)];
    const sf = [play(qf[0], qf[1], BUCH), play(qf[2], qf[3], BUCH)];
    const champ = play(sf[0], sf[1], BUCH);
    prize(champ, 225_000); prize(champ === sf[0] ? sf[1] : sf[0], 100_000);
    for (const t of qf) if (!sf.includes(t)) prize(t, 50_000);
  }

  /* ---- Stake Ranked Episode 5, $100 000 ---- */
  const SR = 100_000;
  {
    const u1 = ["fnatic", "BIG"], u2 = ["Inner Circle", "MIBR"];
    const a = play(...u1, SR), b = otr(u1, a);
    const c = play(...u2, SR), d = otr(u2, c);
    const ubf = play(a, c, SR), ubfL = ubf === a ? c : a;
    const l1 = play("Astralis", "magic", SR), l1L = l1 === "Astralis" ? "magic" : "Astralis";
    const l2 = play("Nemesis", "Eternal Fire", SR), l2L = l2 === "Nemesis" ? "Eternal Fire" : "Nemesis";
    const q1 = play(b, l2, SR), q2 = play(d, l1, SR);
    const sf = play(q1, q2, SR), sfL = sf === q1 ? q2 : q1;
    const lbf = play(ubfL, sf, SR), lbfL = lbf === ubfL ? sf : ubfL;
    const champ = play(ubf, lbf, SR);
    prize(champ, 25_000); prize(champ === ubf ? lbf : ubf, 17_500);
    prize(lbfL, 13_500); prize(sfL, 11_000);
    prize(q1 === sf ? q2 : q1, 9_000); prize(l1L, 7_500); prize(l2L, 7_500);
  }

  /* ---- Tesla Cup 2026, $50 000 ---- */
  const TC = 50_000;
  {
    const a2 = play("K27", play("Alliance", "B8", TC), TC);
    const b1 = play("HOTU", "GamerLegion", TC), l1 = b1 === "HOTU" ? "GamerLegion" : "HOTU";
    const b2 = play(l1, play("Luminosity", "Envy", TC), TC);
    const s1 = play("FaZe", b2, TC), s2 = play(b1, a2, TC);
    const champ = play(s1, s2, TC);
    prize(champ, 30_000); prize(champ === s1 ? s2 : s1, 12_000);
  }

  /* ---- Moscow Cyber Games, ~$190 000 ---- */
  const MCG = 190_000;
  {
    const s1 = play("HOTU", "The Huns", MCG), l1 = s1 === "HOTU" ? "The Huns" : "HOTU";
    const s2 = play("1win", "5star", MCG), l2 = s2 === "1win" ? "5star" : "1win";
    const champ = play(s1, s2, MCG);
    prize(champ, 100_000); prize(champ === s1 ? s2 : s1, 50_000);
    prize(play(l1, l2, MCG), 31_000);
  }

  /* ---- FiReSPORTS Last Chance, $75 000 ---- */
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

  /* ---- Circuito Retake Season 13, €12 200 ≈ $14 300 ---- */
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
    const rec2 = new Map(field.map((t) => [t, 0]));
    for (let r = 0; r < 20; r++) {
      const alive = field.filter((t) => rec2.get(t) < 2);
      if (alive.length < 2) break;
      const bucket = new Map();
      for (const t of alive) { const k = rec2.get(t); if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(t); }
      let any = false;
      for (const list of bucket.values()) {
        const left = list.slice().sort(() => Math.random() - 0.5);
        while (left.length > 1) {
          const t1 = left.shift(), t2 = left.shift();
          const w = play(t1, t2, RT);
          rec2.set(w === t1 ? t2 : t1, rec2.get(w === t1 ? t2 : t1) + 1);
          any = true;
        }
      }
      if (!any) break;
    }
    prize("JiJieHao", 0);
  }

  /* ---- підсумок ---- */
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

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const qt = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };
console.log(`прогонів ${RUNS} · Європа ${SLOTS} місць · приріст за опублікованою формулою VRS`);
console.log(`сценарій: ${SPIRIT === "loss" ? "програли Spirit" : "перемогли Spirit"}, ` +
  `${RETAKE === "forfeit" ? "два техлузи на Retake" : "знялись із Retake"}\n`);
console.log(`НАВІ: 1558 → ${mean(naviPts).toFixed(0)}  (5–95%: ${qt(naviPts, 0.05).toFixed(0)}–${qt(naviPts, 0.95).toFixed(0)})`);
console.log(`\nПРОХІД: ${((100 * good) / RUNS).toFixed(1)}%\n`);
console.log("команда             28.10   середнє     рух   вище НАВІ   +за ЛАН-перемогу");
for (const t of EU_TEAMS.filter((x) => x !== "Natus Vincere").sort((a, b) => P0.get(b) - P0.get(a))) {
  const avg = sum.get(t) / RUNS, d = avg - P0.get(t), p = (100 * passed.get(t)) / RUNS;
  const g = DET[t] ? 48 - Math.min(...DET[t].L) : null;
  console.log(`  ${t.padEnd(18)}${String(P0.get(t)).padStart(5)}${avg.toFixed(0).padStart(10)}` +
    `${((d >= 0 ? "+" : "") + d.toFixed(0)).padStart(8)}` +
    `${(p > 99.9 ? ">99.9" : p < 0.1 ? "<0.1" : p.toFixed(1)).padStart(11)}%` +
    `${(g == null ? "—" : "+" + g).padStart(18)}`);
}
console.log("\nмісце НАВІ в Європі:");
let cum = 0;
for (const k of [...places.keys()].sort((a, b) => a - b)) {
  cum += places.get(k);
  if (places.get(k) / RUNS < 0.005) continue;
  console.log(`  ${String(k).padStart(2)}  ${((100 * places.get(k)) / RUNS).toFixed(1).padStart(5)}%` +
    `   накопичено ${((100 * cum) / RUNS).toFixed(1)}%${k === SLOTS ? "   ← останнє місце з інвайтом" : ""}`);
}
