import fs from "node:fs";
import { TIER1 } from "./calendar.mjs";
import { TIER2 as LAN_TIER2 } from "./lans.mjs";
import { LIVE, AS_OF, SOURCE, CUTOFF, SLOTS } from "./vrs.mjs";
import { accessFactor, fieldFactor, nationOf } from "./access.mjs";
import { FIELDS as BOOK_FIELDS } from "./fields.mjs";
import { withManual } from "./fields-manual.mjs";

/* Склади з книги дентена плюс ті, що зняті зі сторінок команд на HLTV. Книга
   не знає азійського регіону: там на всіх три події, і модель роздавала прямим
   конкурентам однакові «можливо» по 17–34%. */
const FIELDS = withManual(BOOK_FIELDS);

/**
 * The calendar model, on a live anchor.
 *
 * Two previous versions each got one half right.
 *
 * The Valve-anchored version projected the autumn properly — who is invited
 * where, how many matches that is, what it does to a seed — but it stood on the
 * 3 August publication and rebuilt everything since from match results. That
 * reconstruction could not see prize money, which is one of Valve's four seed
 * factors, and it had THUNDER dOWNUNDER above DEPO on a month-old number when
 * the live table has DEPO clear.
 *
 * The HLTV-anchored version fixed the anchor and threw away the calendar. Its
 * projection for 2 November is a pure decay roll-forward: it assumes every team
 * plays nothing and wins nothing between now and the cutoff. That is why it had
 * Natus Vincere shedding 248 points — true only if they never take another map.
 * A forecast that assumes no future results is not a forecast of the future.
 *
 * So: HLTV's live table for where teams stand today, and our own calendar for
 * what they are about to play. Decay still happens — it is inside the seed
 * projection — but so does winning.
 */
const NOISE = JSON.parse(fs.readFileSync("noise2.json", "utf8"));
const CAL = JSON.parse(fs.readFileSync("calibration.json", "utf8"));
const MONTHS = (new Date(CUTOFF) - new Date(AS_OF)) / 864e5 / 30.44;

const Q = Math.log(10) / 400, RD = 75;
const g = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * g * g * 0.25)) * g;
const D = CAL.divisor;
const E = (r, ro, div = 400) => 1 / (1 + Math.pow(10, (g * (r - ro)) / -div));

/* ---- Student-t tail ------------------------------------------------------ */
const gammaln = x => {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (let j = 0; j < 6; j++) s += c[j] / ++y;
  return -t + Math.log(2.5066282746310005 * s / x);
};
const betacf = (a, b, x) => {
  const FP = 1e-30; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
    c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
    c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
};
const betai = (a, b, x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
};
const tSurv = (t, nu) => { const p = 0.5 * betai(nu / 2, 0.5, nu / (nu + t * t)); return t > 0 ? p : 1 - p; };
/* Quantiles of the standard t, by bisection on the survival function. The grid
   below is what lets the standings be worked out conditionally on a team's own
   rating rather than marginally — see the pool loop for why that matters. */
const qCache = new Map();
const tQuant = (u, nu) => {
  const key = nu.toFixed(3) + "|" + u;
  const hit = qCache.get(key); if (hit !== undefined) return hit;
  let lo = -60, hi = 60;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (tSurv(mid, nu) > u) lo = mid; else hi = mid;
  }
  const v = (lo + hi) / 2; qCache.set(key, v); return v;
};
const GRID_N = 128;
const GRID = Array.from({ length: GRID_N }, (_, k) => (k + 0.5) / GRID_N);

/* Volatility, tail shape and mortality as smooth curves of rank. */
const ANCHORS = [["топ-10", 5], ["11–20", 15], ["21–40", 30], ["41–120", 80]];
const interp = key => {
  const pts = ANCHORS.map(([b, r]) => [Math.log(r), NOISE[b][key]]);
  return rank => {
    const x = Math.log(Math.max(1, rank));
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts.at(-1)[0]) return pts.at(-1)[1];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return pts.at(-1)[1];
  };
};
const sdAt = interp("sd"), nuAt = interp("nu");
const hazardAt = (() => {
  const pts = ANCHORS.map(([b, r]) => [Math.log(r), Math.log((NOISE[b].dropOut + 0.5) / (NOISE[b].dropSeen + 1))]);
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  const a = my - b * mx;
  const ceiling = Math.max(...Object.values(NOISE).map(n => n.dropRate));
  return rank => Math.min(ceiling, Math.exp(a + b * Math.log(Math.max(1, rank))));
})();

const nrm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const aka = { natusvincere: "navi", ninjasinpyjamas: "nip", betboomteam: "betboom", themongolz: "mongolz" };
const kk = s => aka[nrm(s)] ?? nrm(s);

/* An event that starts today has not been played yet, so its points are still
   ahead of the standings and it belongs in the projection. Excluding it the
   moment its first map goes live wrote FISSURE Playground 3 out of the model on
   the morning it began, and with it the only tier-one event Astralis, BIG,
   Alliance and magic have all autumn. */
/* SKIP_EVENTS прибирає подію з майбутнього — щоб прогнати сценарій «турнір уже
   зіграно, очки враховані». Без цього умовний прогін рахує той самий турнір
   двічі: і в доданих очках, і попереду. */
const SKIP = new Set((process.env.SKIP_EVENTS ?? "").split("|").filter(Boolean).map(x => x.trim().toLowerCase()));
const skipped = (e) => SKIP.has(String(e.name).toLowerCase());

const t1 = TIER1.filter(t => t.begin < CUTOFF && (t.end ?? t.begin) >= AS_OF && !skipped(t));
/**
 * The tier-two calendar is denten's VRS LAN sheet now.
 *
 * Complete where the hand-built list was not — fifteen events it did not have,
 * including the whole Americas circuit — and LANs only, where the old one had
 * quietly filled the mid-table's autumn with online leagues those teams do not
 * enter.
 *
 * One event is carried across by hand: iBUYPOWER Masters FML in Las Vegas is on
 * HLTV with a published eight-team field and is missing from the sheet. A
 * published field is not something to drop because a spreadsheet has not caught
 * up with it.
 */
/* Турнір, який уже відгримів, — це не можливість, а історія: його очки вже
   всередині живого рейтингу HLTV, і пропонувати його комусь як шанс щось
   набрати означає нарахувати ті самі очки двічі. Upgrade Masters Cup
   завершився 6 вересня і два дні простояв у пулі майбутніх.

   Межа саме така, як у тір-1 вище: подія, що почалась, але ще триває,
   лишається — її очки попереду. Випадає тільки та, що вже скінчилась. */
/**
 * Подія, що вже йде, важить стільки, скільки від неї лишилось.
 *
 * Таблиця HLTV прямо каже про себе: «includes matches and secured prize money
 * from unfinished events». Тобто очки, вже зароблені на турнірі, який триває,
 * сидять у `live`. А модель досі додавала тій самій події повну очікувану вагу
 * попереду — і рахувала її двічі.
 *
 * Видно це було на парі fnatic — NAVI. У fnatic єдина подія, Private Club 2,
 * закінчується 22 жовтня: половина вже зіграна й лежить в очках, а модель
 * нараховувала її цілою. У NAVI Бухарест весь попереду. Через подвійний залік
 * команда з майже дограним турніром опинялась вище за команду з цілим
 * мільйонним турніром попереду.
 *
 * Частка рахується по днях і навмисне груба: усередині турніру очки падають
 * нерівномірно, але знати це наперед ми не можемо, а лінійна частка принаймні
 * не вигадує деталей, яких немає.
 */
const remaining = (e) => {
  const b = Date.parse(e.begin), x = Date.parse(e.end ?? e.begin), now = Date.parse(AS_OF);
  if (!(now > b)) return 1;
  const span = Math.max(1, (x - b) / 86400000 + 1);
  return Math.max(0, Math.min(1, (x - now) / 86400000 / span));
};
const scaleRunning = (list) => list.map((e) => {
  const r = remaining(e);
  return r === 1 ? e : { ...e, weight: e.weight * r, partial: r };
});

const t2 = scaleRunning(LAN_TIER2.filter(e => (e.end ?? e.begin) >= AS_OF && !skipped(e)));
if (!t2.some(e => /ibuypower/i.test(e.name))) {
  t2.push({ name: "iBUYPOWER Masters FML", begin: "2026-09-25", prize: 30_000,
            country: "USA", city: "Las Vegas", region: "americas", ru: false,
            weight: 0.396, slots: 8 });
  t2.sort((a, b) => b.weight - a.weight);
}
/* UKIC Masters Fall 2026 Finals — рейтинговий LAN у Шеффілді 19 вересня, якого
   немає в таблиці denten. Це один матч: The Last Resort проти Ryvex, переможці
   онлайн-етапу. Турнір малий і обидві команди далеко від межі, але рейтинговий
   LAN до відсічення — це саме те, що модель має рахувати, тож він додається з
   закритим складом на двох, щоб більше нікому його не приписати. */
if (!t2.some(e => /ukic/i.test(e.name))) {
  t2.push({ name: "UKIC Masters Fall 2026 Finals", begin: "2026-09-19", end: "2026-09-19", prize: 3_366,
            country: "United Kingdom", city: "Sheffield", region: "europe", ru: false,
            weight: 0.288, slots: 2 });
  t2.sort((a, b) => b.weight - a.weight);
}
/* MESA Pro Series Halloween Cup — рейтинговий ЛАН в Улан-Баторі 27-29 жовтня,
   який denten зі своєї книги прибрав (разом із ROG Journey Winter, але та вже
   після відсічення й нам байдужа). На HLTV подія стоїть: чотири команди, три
   тисячі доларів, тисяча вісімсот за перше місце.

   Сума смішна, та Азія — наш найслабший регіон, і там таких подій усього
   чотири; HLTV у своїй врізці показує, що перемога тут тягне Lynn Vision з
   68,5% на 98,8%. Склад прогнозний, усі троє з відкритої кваліфікації, тож
   четверте місце лишається вільним. */
if (!t2.some(e => /halloween/i.test(e.name))) {
  t2.push({ name: "MESA Pro Series Halloween Cup", begin: "2026-10-27", end: "2026-10-29",
            prize: 3_000, country: "Mongolia", city: "Ulaanbaatar", region: "asia",
            ru: false, weight: 0.288, slots: 4 });
  t2.sort((a, b) => b.weight - a.weight);
}
/**
 * Roster moves the rating tables have not caught up with.
 *
 * Valve rates rosters, not badges, so when a squad changes badge the table
 * keeps it under the old name for a while, and the model relabels it here.
 *
 * Порожньо з 12 вересня. Єдиний такий випадок був WBT: п'ятірка, що грала під
 * цим бейджем, у HLTV значилась як «Jam», і модель показувала її як «WBT
 * (ex-Jam)», а рядок зі справжнім ім'ям — як «WBT (старий склад)». HLTV
 * перейменував склад сам, «Jam» у таблиці більше немає, і те саме правило
 * тепер назвало б справжній склад старим. Механізм лишається для наступного
 * разу; правил у ньому поки жодного.
 */
/* Склад той самий, вивіска нова: HLTV ще веде їх як 3DMAX, рейтинг рахується
   за ростером, а на сторінці має стояти ENVY. Ключ — назва з рейтингу, тож
   усі склади турнірів і правила доступу далі шукають «3DMAX» і знаходять. */
const RENAME = { "3dmax": "ENVY" };

const KNOWN_T2 = {
  /* Names as denten's sheet spells them — the model matches on those now. */
  wbt: ["Roman Imperium Cup VIII", "Retake Season 12", "Roman Imperium Cup IX", "DraculaN 7"],
};

/**
 * Regional tables straight from HLTV's live global list.
 *
 * HLTV tags every team with its region, so the regional order falls out of the
 * global one. No name matching, no roster join, no month-old snapshot — and
 * therefore none of the duplicate-name faults that cost this project three
 * separate bugs.
 */
const regionsOf = () => {
  const out = { europe: [], americas: [], asia: [] };
  for (const t of LIVE) out[t.region].push(t);
  for (const k of Object.keys(out))
    out[k] = out[k].map((t, i) => ({
      team: RENAME[nrm(t.team)] ?? t.team,
      srcTeam: t.team,
      rank: i + 1, globalRank: t.rank, live: t.points,
    }));
  return out;
};
const REG = regionsOf();

const result = {};
for (const [region, cfg] of Object.entries(SLOTS)) {
  const teams = REG[region].map(t => ({ ...t }));
  /* HLTV's standings carry a dozen pairs of sides sharing a name — two called
     Ninjas in Pyjamas, two called Phantom, two called Rare Atom — hundreds of
     ranking places apart. When a published field lists one of those names it
     means the higher-ranked side, so which entry owns the name is settled once,
     here, instead of the invite being credited to both. */
  const canonical = new Map();
  for (const t of teams) {
    const k = kk(t.srcTeam), cur = canonical.get(k);
    if (!cur || t.rank < cur.rank) canonical.set(k, t);
  }
  const avgOpp = teams.slice(0, 30).reduce((a, t) => a + t.live, 0) / Math.min(30, teams.length);

  const openInvite = (rank, ev) => ev.invite === "global" ? (rank <= 20 ? 0.8 : rank <= 40 ? 0.5 : 0.3)
                                : ev.invite === "europe" ? (rank <= 30 ? 0.7 : 0.4) : 0.55;
  /* Two tier-one seats are decided by a bracket now, not one, so the single
     "the qualifier" this code was written around no longer exists. Each event
     that opens a seat carries its own published field and its own answer. */
  const qualEvents = t1.filter(e => e.openSlots?.[region === "americas" ? "southAmerica" : region]);
  const withQual = qualEvents[0];
  const invited = new Set(qualEvents.flatMap(e => e.teams).map(kk));
  const t1CountOf = t => t1.filter(e => e.teams.some(n => kk(n) === kk(t.srcTeam))).length;
  /* A published bracket beats a spread.
     Until HLTV named the field, the region's open slot had to be shared out
     across everyone plausibly in reach — top thirty, not already invited,
     weighted by rating. That put B8 and Inner Circle on three percent each.
     The European qualifier is now drawn: eight teams for one place, and those
     two are its top seeds by a hundred and sixty points. Playing the actual
     bracket out gives 42.6% and 38.8%, which is an order of magnitude more and
     changes what the autumn is worth to both of them. So where a field has been
     published the model uses it, and falls back to the spread where none has. */
  /* Keyed by region as well as event, because Bucharest is six brackets and
     not one. PGL runs a qualifier for Europe, for each American half, and three
     across Asia — East, West and Oceanic. Each awards its own seat and no side
     enters two, so the regional files simply merge the brackets that feed the
     model's region. The difference is not cosmetic: DEPO, FlyQuest and TYLOO
     are top seeds of four-team draws and take their seat around ninety-five
     percent of the time, where the old spread gave the whole of Asia's open
     slot to everyone in reach at a few percent each. */
  const BRACKETS = {
    "PGL Masters Bucharest": { europe: "qual.json", americas: "qual-buch-americas.json", asia: "qual-buch-asia.json" }[region],
    /* Одна сітка на всі регіони, а не одна для Європи. У Thunderpick рівно
       одне вільне місце, і розігрує його одна закрита кваліфікація на
       шістнадцять команд — серед них Wildcard із Північної Америки та BESTIA з
       Південної. Поки файл читала тільки Європа, американські регіони бачили
       подію як «є вільний слот, сітки нема» і роздавали його розмазаним шансом
       усім своїм командам топ-30. Слот при цьому існує один, і він у цій сітці. */
    "Thunderpick World Championship": "qual-thunder.json",
  };
  /* Per event: the published bracket if there is one, otherwise the old spread
     across everyone in reach. Keyed by event so a team can be chasing both. */
  const qualByEvent = new Map();
  for (const ev of qualEvents) {
    const file = BRACKETS[ev.name];
    if (file && fs.existsSync(file)) {
      const pub = JSON.parse(fs.readFileSync(file, "utf8"));
      qualByEvent.set(ev.name, new Map(Object.entries(pub).map(([n, p]) => [kk(n), p])));
    } else {
      const field = teams.filter(t => !invited.has(kk(t.srcTeam)) && t.rank <= 30 && t1CountOf(t) <= 1);
      const ws = field.map(t => Math.exp(t.live / 120));
      const wsum = ws.reduce((a, b) => a + b, 0);
      qualByEvent.set(ev.name, new Map(field.map((t, i) => [kk(t.srcTeam), ws[i] / wsum])));
    }
  }
  /* The headline number a team sees is its best single shot, but the weight it
     collects is the sum over every seat it is chasing. */
  const qualChance = new Map();
  for (const m of qualByEvent.values())
    for (const [k, p] of m) qualChance.set(k, Math.max(qualChance.get(k) ?? 0, p));

  /**
   * Only the region's own open LANs.
   *
   * Falling back to the European list when a region had none was worse than
   * having nothing: it credited Brazilian and North American sides with a share
   * of nineteen European brackets, Moscow included. Our tier-two calendar simply
   * has no Americas events in it, and the honest response to missing data is to
   * leave the column empty and say so — not to spread a fictional 1.8 LANs
   * across teams that would have to cross an ocean for them.
   *
   * Because the seed term is measured against each region's own average, a
   * region-wide zero shifts nobody: the Americas ordering is then driven by
   * current VRS and tier-one invitations, which is exactly the information we
   * actually have for it.
   */
  const t2pool = t2.filter(e => e.region === region || e.global).sort((a, b) => b.weight - a.weight);
  const t2gap = t2pool.length === 0;

  /**
   * How many seats each open bracket really has, before anybody claims one.
   *
   * Computed per event across the whole region rather than per team in
   * isolation, because "will this team be invited" is not a question with an
   * answer until you know how many others are asking. Where the raw chances add
   * up to more attendees than the tournament has slots, they are scaled down
   * together — the ordering of who is most likely to be there survives, the
   * arithmetic stops inventing tournaments.
   */
  /**
   * Скільки турнір із опублікованим складом справді вартий цій команді.
   *
   * Досі рахувалося за фактом участі: перша сіяна восьмірки і остання
   * отримували однаково. Через це один підтверджений склад підкидав fnatic
   * одразу на дев'ять пунктів — а вони в тому полі найслабші й частіше
   * вилітатимуть першими.
   *
   * Тепер вага множиться на середню ймовірність обіграти суперника з цього ж
   * складу. Множник лінійний і навмисне нейтральний: середня команда поля
   * дістає рівно те, що діставала раніше, фаворит більше, аутсайдер менше.
   * Нижня межа 0,25 — бо навіть виліт із групи фіксує мінімальні призові, а
   * очки за самі матчі рахує окремий доданок «форма», і подвоювати його тут
   * було б неправильно.
   */
  const fieldWeight = (() => {
    const cache = new Map();
    return (evName, team) => {
      const f = FIELDS[evName];
      if (!f) return 1;                       // складу немає — нема з чим порівнювати
      let rates = cache.get(evName);
      if (!rates) {
        rates = new Map();
        for (const n of f.teams) {
          const row = teams.find(x => kk(x.srcTeam) === kk(n));
          if (row) rates.set(kk(n), row.live);
        }
        cache.set(evName, rates);
      }
      const mine = rates.get(kk(team.srcTeam));
      if (mine === undefined || rates.size < 2) return 1;
      let sum = 0, n = 0;
      for (const [k, r] of rates) { if (k === kk(team.srcTeam)) continue; sum += E(mine, r, D); n++; }
      if (!n) return 1;
      return 0.25 + 1.5 * (sum / n);
    };
  })();

  /**
   * Імовірність виграти турнір, а не просто добре в ньому зіграти.
   *
   * Валвівська система платить за перемоги окремо від самих матчів: виграні
   * ЛАНи піднімають сід через `lanFactor`. У нас цього не було — приріст рахував,
   * скільки турнірів команда грає, і не рахував, скільки виграє. Для FlyQuest,
   * які в Океанії сильніші за все поле на двісті позицій, це давало ту саму
   * вагу, що й середняку: +16 очок за три турніри, тоді як насправді вони туди
   * їдуть забирати перші місця.
   *
   * Рахуємо грубо, але в правильну форму: щоб узяти турнір на вісьмох, треба
   * виграти log₂(8) = три матчі поспіль. Звідси p_турнір = p_середня^log₂(N).
   * Опуклість тут головне: сильний фаворит слабкого поля отримує багато,
   * середняк — майже нічого, і це саме те, чого лінійна вага не вміла.
   */
  const eventWin = (evName, team) => {
    const f = FIELDS[evName];
    if (!f) return 0;                       // складу немає — нема чого рахувати
    const rivals = f.teams
      .filter(n => kk(n) !== kk(team.srcTeam))
      .map(n => teams.find(x => kk(x.srcTeam) === kk(n)))
      .filter(Boolean);
    const mine = teams.find(x => kk(x.srcTeam) === kk(team.srcTeam));
    if (!mine || rivals.length < 2) return 0;
    const avg = rivals.reduce((a, r) => a + E(mine.live, r.live, D), 0) / rivals.length;
    const size = Math.max(2, f.teams.length + (f.tbd ?? 0));
    return Math.pow(avg, Math.log2(size));
  };

  const rawP = new Map(), evScale = new Map();
  for (const ev of t2pool) {
    if (FIELDS[ev.name]) continue;              // published field, nothing to guess
    const m = new Map();
    let total = 0;
    for (const x of teams) {
      const acc = accessFactor(x.srcTeam, ev, region) * fieldFactor(ev);
      if (acc === 0) continue;
      const useRank = (ev.global || ev.invite === "global") ? (x.globalRank ?? x.rank) : x.rank;
      const v = openInvite(useRank, ev) * acc;
      if (v > 0) { m.set(x.srcTeam, v); total += v; }
    }
    rawP.set(ev.name, m);
    const slots = ev.slots ?? 16;
    evScale.set(ev.name, total > slots ? slots / total : 1);
  }

  for (const t of teams) {
    /* Бути в складі турніру і мати попереду очки за нього — різні речі.
       Подія, що триває, лишається в календарі, бо її очки ще не в рейтингу; але
       для команди, яка з неї вже вилетіла, вони саме що в рейтингу — HLTV
       рахує здобуті призові з незавершених подій. `out` називає тих, чий
       турнір скінчився, і для них подія більше не можливість. */
    const mine = t1.filter(e => e.teams.some(n => kk(n) === kk(t.srcTeam))
                             && !(e.out ?? []).some(n => kk(n) === kk(t.srcTeam)));
    t.tier1 = mine.map(e => e.name);
    let w1 = mine.reduce((a, e) => a + e.weight, 0);
    let m1 = mine.reduce((a, e) => a + e.perTeam, 0);
    t.qualChance = qualChance.get(kk(t.srcTeam)) ?? 0;
    t.qualBy = qualEvents
      .map(ev => ({ name: ev.name, p: qualByEvent.get(ev.name)?.get(kk(t.srcTeam)) ?? 0 }))
      .filter(x => x.p > 0.001);
    /* Every seat it is chasing pays its own weight, times the chance of taking
       it. Three extra matches a bracket, whether or not the bracket is won. */
    for (const x of t.qualBy) {
      const ev = qualEvents.find(e => e.name === x.name);
      w1 += x.p * ev.weight;
      m1 += x.p * ev.perTeam + 3;
    }

    /**
     * Which open LANs the tier-two number is actually made of.
     *
     * A column reading "+3.0" tells a reader nothing they can check. These are
     * the specific events behind it, each with the probability the team is in
     * the field — so an estimate looks like an estimate, and a known entry list
     * looks like a fact.
     */
    /**
     * A published field beats every estimate about it.
     *
     * Nine tier-two events have named their teams. For those, being in the list
     * is a fact worth one whole entry and being absent is worth nothing —
     * except where slots are still open, in which case the unnamed teams share
     * those out between them by strength, the same way a closed qualifier is
     * priced. This is what stops a million-dollar invitational for the world's
     * top seven from paying the middle of the table.
     */
    /**
     * Two passes, because a published field is not a guess.
     *
     * First the facts: every event that has named this team gets counted in
     * full, however many there are. Alliance is in three of them and a calendar
     * budget that made the third compete with the first would be modelling our
     * own uncertainty rather than their schedule.
     *
     * Then the guesses, on whatever room is left: open seats in half-announced
     * fields, and events that have announced nothing at all. Those still ration
     * against a realistic autumn, because a side cannot be everywhere.
     */
    let w2 = 0, n2 = 0, lanWins = 0;
    const picks = [];
    const named = new Set((KNOWN_T2[kk(t.srcTeam)] ?? []).map(nrm));
    const isMine = (ev) => {
      if (canonical.get(kk(t.srcTeam)) !== t) return false;   // the namesake, not the side invited
      const f = FIELDS[ev.name];
      /* Те саме правило, що й у тір-1: команда, яка з турніру вже вилетіла, має
         його очки в рейтингу, а не попереду. `out` називає таких поіменно.
         Поки турнір не почався, список порожній і нічого не міняє. */
      if (f && (f.out ?? []).some(n => kk(n) === kk(t.srcTeam))) return false;
      if (f && f.teams.some(n => kk(n) === kk(t.srcTeam))) return true;
      return named.has(nrm(ev.name));          // told to us, not yet on HLTV
    };

    /* ---- pass one: confirmed ---- */
    /* Searched across the whole calendar, not the region's slice of it. A
       published field outranks geography: Moscow Cyber Games is filed under
       Europe and two of its four teams are Asian, so filtering by region first
       drops a $181k event from the two sides it matters most to. */
    const confirmed = t2.filter(isMine);
    for (const ev of confirmed) {
      const fw = fieldWeight(ev.name, t);
      w2 += ev.weight * fw; n2 += 1;
      lanWins += eventWin(ev.name, t) * ev.weight;
      picks.push({ name: ev.name, begin: ev.begin, p: 1, confirmed: true, ru: !!ev.ru,
                   fieldWeight: Math.round(fw * 100) / 100 });
    }

    /* ---- pass two: what is still open ---- */
    let budget = Math.max(0, 4 - mine.length * 1.5 - confirmed.length);
    for (const ev of t2pool) {
      if (budget <= 0) break;
      if (isMine(ev)) continue;
      const field = FIELDS[ev.name];
      let p;
      if (field) {
        // Announced and this team is not in it. Only the open seats are left.
        if (field.tbd <= 0) continue;
        /* Вільне місце в турнірі з відомим складом усе одно місце в тому самому
           турнірі. Для турнірів без складу модель перевіряє доступ — хто туди
           взагалі не їде, — а для цієї гілки перевірки не було, тож українська
           команда могла дістати вільне місце на турнірі 1win. Жорсткі нулі
           правил доступу діють тепер і тут. */
        if (accessFactor(t.srcTeam, ev, region) === 0) continue;
        const rest = teams.filter(x =>
          !field.teams.some(n => kk(n) === kk(x.srcTeam)) && x.rank <= 45);
        if (!rest.some(x => kk(x.srcTeam) === kk(t.srcTeam))) continue;
        const sum = rest.reduce((a, x) => a + Math.exp((x.live ?? 0) / 150), 0) || 1;
        p = Math.min(1, field.tbd * Math.exp((t.live ?? 0) / 150) / sum);
      } else {
        /* Normalised to the size of the bracket.
         *
         * The raw invite chance was computed per team and never checked against
         * how many seats exist: a sixteen-team LAN with a hundred plausible
         * entrants summed to fifty-five expected attendees, so the model handed
         * out three times the tournament. Every mid-table side was collecting
         * seed from a place it could not all have been.
         *
         * `evScale` divides each event's raw probabilities by their own total
         * where that total exceeds the slot count, which preserves who is more
         * likely to be invited and fixes how many can be. */
        p = (rawP.get(ev.name)?.get(t.srcTeam) ?? 0) * (evScale.get(ev.name) ?? 1);
        if (!(p > 0)) continue;
      }
      if (!(p > 0)) continue;
      const take = Math.min(1, budget);
      w2 += p * ev.weight * take;
      n2 += p * take;
      budget -= take * Math.min(1, p);
      picks.push({ name: ev.name, begin: ev.begin, p: Math.round(p * take * 100) / 100,
                   confirmed: false, ru: !!ev.ru });
    }
    picks.sort((a, b) => b.p - a.p || b.confirmed - a.confirmed);
    t.knownT2 = confirmed.map(e => e.name);

    /* Keep the cell readable: the long tail of sub-10% entries adds nothing. */
    /* Two lists, on purpose. The sheet shows the six that matter; the model and
       the simulation both need every one, or they are describing different
       calendars — which is exactly the discrepancy the cross-check caught. */
    t.tier2All = picks;
    t.tier2List = picks.filter(p => p.p >= 0.05).slice(0, 6);
    t.tier2Gap = t2gap;
    t.nation = nationOf(t.srcTeam);
    t.tier2Events = Math.round(n2 * 10) / 10;
    t.matches = Math.max(4, Math.round(m1 + n2 * 4));
    t.prestige = Math.round((w1 + w2) * 100) / 100;
    /* Очікувані перемоги на ЛАНах, зважені вагою турніру. Йде окремим доданком
       у приріст, а не в prestige: prestige центрується по полю (`- BASE`), і
       перемоги там розчинилися б у середньому. */
    t.lanWins = Math.round(lanWins * 1000) / 1000;
  }

  const BASE = teams.reduce((a, t) => a + t.prestige, 0) / teams.length;

  /**
   * Старіння старих результатів — окремо для кожної команди. Сценарій,
   * вмикається змінною DECAY_FILE; без неї модель рахує як раніше.
   *
   * VRS дивиться на шість місяців назад, і результати з квітня–травня до 2
   * листопада з вікна випадуть. Модель досі враховувала це лише як середнє:
   * член `prestige - BASE` віднімає від усіх одне й те саме. Але старіє кожна
   * команда по-своєму. HLTV публікує рейтинг кожної команди на 2 листопада без
   * жодного нового матчу, і на 13 вересня NAVI там втрачають 270 очок, коли
   * середня команда біля межі — близько 54.
   *
   * Для відбору важить лише порядок усередині регіону, тож береться не
   * абсолютне старіння, а його відхилення від середнього по регіону. Середнє
   * модель уже враховує, і вдруге воно не додається. Команда, якої в
   * прогнозному списку немає, дістає нуль, тобто середнє старіння.
   */
  const DECAY = process.env.DECAY_FILE ? JSON.parse(fs.readFileSync(process.env.DECAY_FILE, "utf8")) : null;
  if (DECAY) {
    const abs = new Map();
    for (const t of teams) {
      const v = DECAY[t.srcTeam];
      if (typeof v === "number" && canonical.get(kk(t.srcTeam)) === t) abs.set(t, v - t.live);
    }
    const mean = abs.size ? [...abs.values()].reduce((a, b) => a + b, 0) / abs.size : 0;
    for (const t of teams) t.decay = abs.has(t) ? Math.round((abs.get(t) - mean) * 10) / 10 : 0;
  }
  /* Участь у турнірі не безкоштовна.
     Виміряно формулою Valve на відновленому двигуні (sim/prices.json): виграти
     турнір тір-2 дає команді середини таблиці +150…+250 очок, а виліт унизу
     сітки відбирає 30…95. Доти модель нараховувала приріст просто за те, що
     команда їде: хто має чотири турніри, автоматично обганяв того, хто має
     один. Насправді він отримує чотири можливості і чотири ризики.

     Тому середнє зменшено (SEED_SCALE), а розмах прив'язано до календаря:
     команда, яка нікуди не їде, рухається менше за ту, що грає щотижня.
     Загальний розмах по регіону лишається тим, який виміряно на публікаціях
     Valve, — перерозподіляється тільки те, кому його більше, а кому менше. */
  const SEED_SCALE = Number(process.env.SEED_SCALE ?? 1);
  const SD_BY_CAL = Number(process.env.SD_BY_CAL ?? 0);
  const loadOf = (t) => {
    const t1 = Array.isArray(t.tier1) ? t.tier1.length : 0;
    const t2 = Array.isArray(t.tier2All) ? t.tier2All.reduce((a, x) => a + (x.p ?? 0), 0)
      : (Number.isFinite(t.knownT2) ? t.knownT2 : 0);
    return t1 + t2;
  };
  const avgLoad = teams.slice(0, 60).reduce((a, t) => a + loadOf(t), 0) / Math.min(60, teams.length);

  /* LOAD_MODEL=1 — приріст і розмах рахуються за календарем команди, а не за
     календарем взагалі.

     Як було: очікуваний приріст множився на кількість місяців до відсічення, а
     розмах — на корінь із неї. Виходило, що команда, якій до листопада нічого
     грати, однаково «мала» вирости на пів сотні очок і однаково мала розмах
     ±110. Для B8 це коштувало восьми місць у прогнозі: вони стоять, а ті, хто
     внизу, нібито ростуть просто тому, що виходять на корти.

     Як стало: і те, і те масштабується часткою матчів цієї команди від
     середньої. Хто грає вдвічі менше — росте вдвічі менше і коливається в
     корінь із двох вужче. Нуля в розмаху немає: навіть команда без турнірів
     рухається від чужих результатів і втрачає очки на згасанні, тож нижня межа
     0.2 — приблизно місяць звичайного життя таблиці. */
  const LOAD_MODEL = Number(process.env.LOAD_MODEL ?? 0);
  const avgMatches = teams.slice(0, 60).reduce((a, t) => a + (t.matches ?? 0), 0) / Math.min(60, teams.length);
  const shareOf = (t) => Math.min(2, (t.matches ?? 0) / Math.max(1, avgMatches));

  /* LOAD_MODEL=2 — приріст поля центрується на нулі.

     Очки VRS переходять від команди до команди: коли дві з таблиці грають між
     собою, одна бере стільки, скільки друга віддає. Поле в сумі не росте. А
     формула нараховувала всім додатне: Luminosity +78, HEROIC +80, BIG +71 —
     і це при тому, що половина цих матчів між ними ж і зіграється. Тому B8 з
     їхніми +18 просто спливали вниз повз тих, хто «росте» ні за що.

     Центрування лишає різницю (хто сильніший за поле — той і далі набирає
     більше), але прибирає спільний підйом. */
  const raw = teams.map((t) => (t.prestige - BASE) * 60 * MONTHS * SEED_SCALE);
  const rawMean = raw.slice(0, 60).reduce((a, x) => a + x, 0) / Math.min(60, teams.length);

  for (const t of teams) {
    const share = LOAD_MODEL ? shareOf(t) : 1;
    /* Скільки очок коштує виграний ЛАН. Валве платить за це через `lanFactor`,
       у нас це один коефіцієнт — видимий і єдиний, а не розмазаний по формулі.
       200 на одиницю ваги означає, що перемога на турнірі вагою 0,35 (Logitech
       G Pro) варта сімдесяти очок, а на вагомішому — більше.

       Увімкнено тільки в Азії — і це не лінощі, а межа доказу. Підбирали число
       там, де є з чим звіряти: азійський прогноз Mischief на дванадцяти
       командах дає мінімум розбіжності саме на 200 (19,2 пункти при 120, 17,5
       при 200, 17,8 при 300). Для Європи такої звірки немає, а ефект там
       великий і в один бік: множник піднімає тих, хто катається по тир-2, і
       опускає тих, хто майже не грає, — B8 втрачали 15 пунктів, NAVI 16.
       Переносити на цілий регіон коефіцієнт, підігнаний під дюжину чужих чисел
       з іншого регіону, — це вже не модель.

       Азія ж живе саме з регіональних турнірів: там п'ять місць, десяток
       команд у межах трьохсот очок, і хто виграє океанський ЛАН — вирішальне. */
    /* Множник ЛАН-перемог тепер задається окремо на регіон: LANW_EUROPE,
       LANW_AMERICAS, LANW_ASIA. Загальний LANW лишається як аварійний важіль
       на всі три, але вмикати його одним числом означало б переносити
       азійське калібрування на Європу — саме те, проти чого застереження
       вище. Без змінних поведінка та сама, що й була. */
    const LANW = Number(
      process.env[`LANW_${region.toUpperCase()}`] ??
      process.env.LANW ??
      (region === "asia" ? 200 : 0),
    );
    const base = (t.prestige - BASE) * 60 * MONTHS * SEED_SCALE + LANW * (t.lanWins ?? 0);
    t.seedFuture = Math.round(
      (LOAD_MODEL === 3 ? base : LOAD_MODEL === 2 ? base - rawMean : base * share) * 10,
    ) / 10;
    const eRaw = E(t.live, avgOpp), pCal = E(t.live, avgOpp, D);
    t.form = KG * t.matches * (pCal - eRaw);
    /**
     * Турнір сам по собі додає очки, і доти модель цього не бачила.
     *
     * `form` — це чистий Glicko: сильна команда проти сильного поля очікувано
     * втрачає рейтинг, тож у топ-30 середній `form` відʼємний. Але VRS не
     * Glicko. У ній чотири доданки, і три з них — зароблені призові, ЛАН-фактор
     * і зібрана «винагорода» — ніколи не бувають відʼємними. Команда, яка
     * просто приїхала і щось виграла, додає; команда, яка лишилась удома, — ні.
     *
     * Видно це було двічі й незалежно:
     *   · у залишках каліброваного кроку на дограному Private Club 2 — ті, хто
     *     забрав гроші, вийшли краще за прогноз на +5…+77, і найбільше ті, хто
     *     пройшов далі за посів (The MongolZ +77, PRIVATE +62);
     *   · у бектесті 14 → 23 жовтня на 87 командах топ-30: у кого був турнір,
     *     середнє +25, у кого не було — +3.
     *
     * Модель на тих самих даних давала -5 і +9, тобто різницю -14 замість
     * +22. Цей доданок і закриває ті 36 очок, розподіляючи їх за вагою подій,
     * які в команди справді попереду, — бо саме вага (а в календарі це
     * призовий фонд) визначає, скільки там можна взяти.
     *
     * Вимикається EVENT_BONUS=0; тир-1 важить T1_WEIGHT від одиниці
     * навантаження, бо Бухарест із мільйоном двісті п'ятдесят стоїть на стелі
     * кривої ваги, а не поруч із кубком за три тисячі.
     */
    const EVENT_BONUS = Number(process.env.EVENT_BONUS ?? 36);
    const T1_WEIGHT = Number(process.env.T1_WEIGHT ?? 0.7);
    const t2Load = Array.isArray(t.tier2All)
      ? t.tier2All.reduce((a, e) => a + (e.p ?? 0) * (e.weight ?? 0.33) / 0.43, 0)
      : 0;
    const t1Load = (Array.isArray(t.tier1) ? t.tier1.length : 0) * T1_WEIGHT;
    t.eventBonus = Math.round(EVENT_BONUS * (t2Load + t1Load) * 10) / 10;
    t.mu = t.live + t.form + t.seedFuture + t.eventBonus + (t.decay ?? 0);
    const calFactor = (SD_BY_CAL
      ? 0.55 + 0.45 * Math.min(2, loadOf(t) / Math.max(0.5, avgLoad))
      : 1) * Number(process.env.NOISE_SCALE ?? 1);
    const drift = MONTHS * (LOAD_MODEL ? Math.max(0.2, share) : 1);
    const sdOld = calFactor * Math.sqrt((KG * Math.sqrt(t.matches * pCal * (1 - pCal))) ** 2 + (sdAt(t.rank) * Math.sqrt(drift)) ** 2);
    /**
     * Невизначеність має залежати від того, що в команди попереду.
     *
     * Стара формула давала всім те саме: Virtus.pro без жодного турніру — 43,
     * НАВІ з мільйонним ЛАНом і одинадцятьма матчами — 49. Доданок рангового
     * дрейфу заглушував доданок матчів, і розкид виходив майже плоский.
     *
     * Заміряно на факті. Прогін 14 жовтня проти таблиці 23-го, топ-30 кожного
     * регіону, рівно дев'ять днів — стільки ж, скільки лишилось зараз:
     *     у кого був турнір  — середнє +25, розкид 59 (67 команд);
     *     у кого не було     — середнє  +3, розкид 27 (20 команд).
     * Тобто розкид відрізняється вдвічі з гаком, а модель цього не бачила.
     *
     * Нова форма прив'язана до навантаження, а не до рангу: σ = C·√load + F,
     * де C і F розвʼязані рівно з цих двох рівнянь — при середньому √load
     * кожної з двох груп у нашому ж прогоні (1,281 і 0,499) вони дають 59 і
     * 27. Нічого крім цих двох чисел не підганялось, і стара формула
     * лишається під SD_MODEL=old.
     *
     * Межі чесно: це одне вікно з дев'яти днів і 87 команд, і воно випало на
     * густий ЛАН-сезон. Якщо наступний тиждень буде порожнім, число завелике.
     */
    const SD_MODEL = process.env.SD_MODEL ?? "load";
    if (SD_MODEL === "old") { t.sd = sdOld; } else {
      const C = Number(process.env.SD_C ?? 40.9), F = Number(process.env.SD_F ?? 6.6);
      const DAYS = 9;                       // вікно, на якому C і F заміряні
      const span = Math.max(1, (Date.parse(CUTOFF) - Date.parse(AS_OF)) / 86400000);
      t.sd = (C * Math.sqrt(Math.max(0.05, loadOf(t))) + F) * Math.sqrt(span / DAYS);
    }
    t.nu = nuAt(t.rank);
    t.death = 1 - Math.pow(1 - hazardAt(t.rank), MONTHS);
  }

  const pool = [...teams].sort((a, b) => b.mu - a.mu).slice(0, Math.min(120, teams.length));
  /* How many teams finish above ours, worked out conditionally.
     The rivals' placings are not independent of one another: every one of them
     turns on the same quantity, our own team's rating. A bad autumn for us puts
     the whole field above us at once and a good one holds all of it below, so
     asking each rival separately "how often do you beat us?" and then combining
     those answers as if they were unrelated throws that shared cause away. It
     understates how far the count above us can swing, and drives every figure
     toward nought or a certainty — which is how the earlier version managed to
     put teams on exactly 0.0%.
     Hold our own rating fixed and the rivals genuinely are independent, so the
     convolution is exact there. Doing it at 128 equal-probability points of our
     own distribution and averaging the results is the whole correction. */
  const tScale = pool.map(o => o.sd / Math.sqrt(o.nu / (o.nu - 2)));
  for (let pi = 0; pi < pool.length; pi++) {
    const t = pool[pi];
    const dist = new Float64Array(pool.length + 1);
    for (const u of GRID) {
      const x = t.mu + tScale[pi] * tQuant(u, t.nu);
      let d = [1];
      for (let j = 0; j < pool.length; j++) {
        if (j === pi) continue;
        const p = tSurv((x - pool[j].mu) / tScale[j], pool[j].nu) * (1 - pool[j].death);
        const nx = new Array(d.length + 1).fill(0);
        for (let k = 0; k < d.length; k++) { nx[k] += d[k] * (1 - p); nx[k + 1] += d[k] * p; }
        d = nx;
      }
      for (let k = 0; k < d.length; k++) dist[k] += d[k] / GRID_N;
    }
    const upTo = n => { let a = 0; for (let k = 0; k < n && k < dist.length; k++) a += dist[k]; return a; };
    const alive = 1 - t.death;
    t.p3 = alive * upTo(cfg.stage3);
    t.p2 = alive * (upTo(cfg.stage3 + cfg.stage2) - upTo(cfg.stage3));
    t.p1 = alive * (upTo(cfg.total) - upTo(cfg.stage3 + cfg.stage2));
    t.pQual = alive * upTo(cfg.total);
    t.expRank = dist.reduce((a, p, k) => a + p * (k + 1), 0);
    let c = 0; t.lo = null; t.hi = null;
    for (let k = 0; k < dist.length; k++) {
      c += dist[k];
      if (t.lo === null && c >= 0.05) t.lo = k + 1;
      if (t.hi === null && c >= 0.95) t.hi = k + 1;
    }
  }
  const ordered = pool.sort((a, b) => a.expRank - b.expRank);
  ordered.forEach((t, i) => {
    t.projected = i + 1;
    t.stage = i < cfg.stage3 ? 3 : i < cfg.stage3 + cfg.stage2 ? 2 : i < cfg.total ? 1 : 0;
  });
  result[region] = ordered;

  console.log(`\n${region.toUpperCase()} · ${cfg.total} місць (St3 ${cfg.stage3} · St2 ${cfg.stage2} · St1 ${cfg.stage1})`);
  console.log("  " + "#".padStart(3) + "  " + "команда".padEnd(20) + "VRS".padStart(6) + "форма".padStart(7) +
              "seed".padStart(7) + "μ".padStart(6) + "тір1".padStart(6) + "тір2".padStart(6) +
              "прохід".padStart(9) + "St3".padStart(6) + "St2".padStart(6) + "St1".padStart(6) + "місце".padStart(8));
  let line = null;
  for (const t of ordered.slice(0, cfg.total + 8)) {
    const s = t.stage || "out";
    if (line !== s) { console.log("  " + (t.stage ? `— Stage ${t.stage} —` : "— не проходять —")); line = s; }
    console.log("  " + String(t.projected).padStart(3) + "  " + t.team.padEnd(20) +
      String(t.live).padStart(6) + ((t.form >= 0 ? "+" : "") + t.form.toFixed(0)).padStart(7) +
      ((t.seedFuture >= 0 ? "+" : "") + t.seedFuture.toFixed(0)).padStart(7) + t.mu.toFixed(0).padStart(6) +
      (t.qualChance > 0.02 ? `${t.tier1.length}+к` : String(t.tier1.length)).padStart(6) +
      t.tier2Events.toFixed(1).padStart(6) +
      (t.pQual * 100).toFixed(2).padStart(8) + "%" +
      (t.p3 * 100).toFixed(0).padStart(5) + "%" + (t.p2 * 100).toFixed(0).padStart(5) + "%" +
      (t.p1 * 100).toFixed(0).padStart(5) + "%" + `${t.lo}-${t.hi}`.padStart(8));
  }
}

const show = (region, name) => {
  const t = result[region].find(x => x.team === name);
  return t ? `${name}: VRS ${t.live} (рег. #${t.rank}) → μ ${t.mu.toFixed(0)} · прогноз #${t.projected} · прохід ${(t.pQual * 100).toFixed(2)}%` : `${name}: поза пулом`;
};
console.log("\n" + show("asia", "DEPO"));
console.log(show("asia", "THUNDER dOWNUNDER"));
const wbt = result.europe.find(t => /^wbt$/i.test(t.srcTeam));
console.log(wbt ? `WBT: VRS ${wbt.live} (рег. #${wbt.rank}) → μ ${wbt.mu.toFixed(0)} · прогноз #${wbt.projected} · ЛАНи ${wbt.tier2Events} · прохід ${(wbt.pQual * 100).toFixed(3)}%` : "WBT: поза пулом");

const all = Object.values(result).flat();
console.log(`\nперевірка: найвищий ${(Math.max(...all.map(t => t.pQual)) * 100).toFixed(2)}%` +
  ` · рівно 100%: ${all.filter(t => t.pQual >= 0.9995).length} · рівно 0%: ${all.filter(t => t.pQual <= 0).length}`);

/* Куди писати результат. За замовчуванням — канонічний final15.json, але
   сценарій (гілка «що як ця команда виграє») має лягати поруч, а не поверх
   перевіреного прогону: OUT_FILE=branch.json VRS_FILE=patched.json node final15.mjs */
fs.writeFileSync(process.env.OUT_FILE ?? "final15.json", JSON.stringify({
  asOf: AS_OF, cutoff: CUTOFF, months: MONTHS, slots: SLOTS, D, KG, noise: NOISE,
  calMatches: CAL.used, source: SOURCE, sourceNote: "очки VRS + власна система прогнозу",
  tier1: t1, tier2: t2, regions: result,
}, null, 1));
