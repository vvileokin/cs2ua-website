import fs from "node:fs";
import { EVENTS } from "./events.mjs";
import { playEvent, rng } from "./play.mjs";

/**
 * Прогноз запрошень: сітки розігруються, очки за місця беруться з прайс-листа,
 * порахованого самою формулою Valve (prices.json), підсумок лягає на живий
 * рейтинг HLTV за сьогодні.
 *
 * Чим це краще за попередню модель. Раніше участь у турнірі давала гарантований
 * приріст, пропорційний вазі турніру. Насправді приріст треба виграти: за
 * вильоту внизу сітки очки відбирають. Тому команда з чотирма турнірами більше
 * не отримує автоматичну перевагу над командою з одним — вона отримує чотири
 * можливості і чотири ризики.
 *
 * Ціна місця залежить і від того, наскільки команда сильніша за поле: виграти
 * турнір, де ти фаворит, майже нічого не додає, а програти його — коштує.
 */
const N = Number(process.argv[2] ?? 20000);
const DIR = "C:/Users/LNU/Downloads/vrs-model";
const PRICES = JSON.parse(fs.readFileSync(`${DIR}/sim/prices.json`, "utf8"));
const NOISE = JSON.parse(fs.readFileSync(`${DIR}/noise2.json`, "utf8"));
const SNAP = JSON.parse(fs.readFileSync(`${DIR}/vrs-live-0210r.json`, "utf8"));
const SLOTS = { europe: 18, americas: 9, asia: 5 };
const REG = { EU: "europe", AM: "americas", AS: "asia" };

/* ---------- рейтинг ---------- */
const live = SNAP.rows.split(";").map((r) => {
  const [g, team, pts, reg] = r.split("|");
  return { globalRank: +g, team, pts: +pts, region: REG[reg] };
});
const byRegion = {};
for (const t of live) (byRegion[t.region] ??= []).push(t);
for (const k of Object.keys(byRegion)) byRegion[k].sort((a, b) => b.pts - a.pts);

const GLOBAL = fs.readFileSync(`${DIR}/vrs-rows-0210.txt`, "utf8").trim().split(";").map((r) => r.split("|"));
const strength = new Map();
for (const [, team, pts] of GLOBAL) if (!strength.has(team)) strength.set(team, +pts);
const rate = (n) => strength.get(n) ?? 600;

/* ---------- ціна місця ---------- */
/** Лінійно між пробами за рейтингом і між місцями за часткою сітки. */
function priceOf(evName, team, place, size) {
  const P = PRICES[evName];
  if (!P) return null;
  const probes = Object.values(P.probes);
  const at = (c) => {
    const spots = P.spots;
    const frac = (place - 1) / Math.max(1, size - 1);
    const pts = spots.map((s) => [(s - 1) / Math.max(1, P.size - 1), c.points[s]]);
    if (frac <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (frac <= pts[i + 1][0]) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        return y0 + ((y1 - y0) * (frac - x0)) / Math.max(1e-6, x1 - x0);
      }
    }
    return pts.at(-1)[1];
  };
  if (probes.length === 1) return at(probes[0]);
  const [a, b] = probes[0].rating >= probes[1].rating ? [probes[0], probes[1]] : [probes[1], probes[0]];
  const r = Math.max(b.rating - 250, Math.min(a.rating + 250, rate(team)));
  const w = (r - b.rating) / Math.max(1, a.rating - b.rating);
  return at(b) + w * (at(a) - at(b));
}

/* Турніри без власного прайса беруть криву схожого за призовим і розміром. */
const FALLBACK = {
  "CyberClash S2": "Tesla Cup 2026",
  "Gamers Club Masters": "VOID Autumn Cup",
  "Hotspawn Showdown": "Elisa Breakout 2",
  "CCT Europe Series 11": "CCT Europe Series 10",
  "NODWIN Clutch Series 13": "CCT Europe Series 10",
  "ESL Challenger League S52 Europe Cup 8": "CROSSFIRE Season 6",
  "ESL Challenger League S52 Europe Cup 9": "CROSSFIRE Season 6",
};

/* ---------- пули для нерозданих місць ---------- */
const namesOf = (region, from, to) => byRegion[region].slice(from, to).map((t) => t.team);
const pools = {
  europe: namesOf("europe", 8, 60),
  "europe-low": namesOf("europe", 40, 110),
  cct: namesOf("europe", 25, 95),
  cis: ["Nemiga", "Nuclear TigeRES", "K27", "FORZE Reload", "BAKS", "ex-RUBY", "Black Phoenix",
        "Rune Eaters", "Butterfly", "Bushido Wildcats", "PRIVATE", "UPGRADE", "CYBERSHOKE", "WW"],
  americas: namesOf("americas", 6, 40),
  asia: namesOf("asia", 2, 30),
};

/* ---------- залишковий шум ---------- */
const BANDS = [["топ-10", 10], ["11–20", 20], ["21–40", 40], ["41–120", 120]];
const bandOf = (i) => BANDS.find(([, n]) => i < n)?.[0] ?? "41–120";
/* Половина виміряного місячного розмаху: другу половину тепер пояснюють самі
   турніри. Лишається те, чого модель не бачить: зміни складів, зникнення
   команд, турніри поза календарем. */
const SHARE = 0.5;
const norm = (rand) => {
  let u = 0;
  for (let i = 0; i < 12; i++) u += rand();
  return u - 6;
};
const student = (nu, rand) => {
  const n = Math.max(1, Math.round(nu));
  let v = 0;
  for (let i = 0; i < n; i++) { const z = norm(rand); v += z * z; }
  return norm(rand) / Math.sqrt(v / n);
};

/* ---------- симуляція ---------- */
const teams = live.filter((t) => byRegion[t.region].indexOf(t) < 130);
const key = (t) => t.region + "|" + t.team;
const hits = new Map(teams.map((t) => [key(t), 0]));
const sumPts = new Map(teams.map((t) => [key(t), 0]));
const idxOf = new Map(teams.map((t) => [key(t), byRegion[t.region].findIndex((x) => x.team === t.team)]));

const t0 = Date.now();
for (let run = 1; run <= N; run++) {
  const rand = rng(run * 7919 + 13);
  const gain = new Map();

  for (const ev of EVENTS) {
    let field = ev.teams.filter((n) => strength.has(n));
    if (ev.tbd && pools[ev.tbdPool]?.length) {
      const pool = pools[ev.tbdPool].filter((n) => !field.includes(n));
      for (let i = 0; i < ev.tbd && pool.length; i++) field.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
    if (field.length < 4) continue;
    const priceName = PRICES[ev.name] ? ev.name : FALLBACK[ev.name];
    if (!priceName || !PRICES[priceName]) continue;

    const { placements } = playEvent(ev, field, rate, rand);
    placements.forEach((team, i) => {
      const p = priceOf(priceName, team, i + 1, placements.length);
      if (p !== null) gain.set(team, (gain.get(team) ?? 0) + p);
    });
  }

  const finals = { europe: [], americas: [], asia: [] };
  for (const t of teams) {
    const band = NOISE[bandOf(idxOf.get(key(t)))] ?? NOISE["41–120"];
    const extra = student(band.nu, rand) * band.sd * SHARE;
    const dead = rand() < band.dropRate * SHARE;
    const g = gain.get(t.team) ?? 0;
    sumPts.set(key(t), sumPts.get(key(t)) + g);
    finals[t.region].push({ t, v: dead ? -9999 : t.pts + g + extra });
  }
  for (const [reg, list] of Object.entries(finals)) {
    list.sort((a, b) => b.v - a.v);
    for (let i = 0; i < Math.min(SLOTS[reg], list.length); i++) {
      const k = key(list[i].t);
      hits.set(k, hits.get(k) + 1);
    }
  }
}

/* ---------- підсумок ---------- */
const out = {};
for (const t of teams) {
  const k = key(t);
  (out[t.region] ??= []).push({
    team: t.team, vrs: t.pts, globalRank: t.globalRank,
    gain: Math.round(sumPts.get(k) / N),
    p: hits.get(k) / N,
  });
}
for (const reg of Object.keys(out)) out[reg].sort((a, b) => b.p - a.p);
fs.writeFileSync(`${DIR}/forecast-0210.json`, JSON.stringify({ asOf: "2026-10-02", runs: N, slots: SLOTS, regions: out }, null, 1));

for (const [reg, list] of Object.entries(out)) {
  console.log(`\n${reg.toUpperCase()} · ${SLOTS[reg]} місць`);
  console.log("   #  команда                 VRS   очікувано за жовтень   шанс");
  list.slice(0, SLOTS[reg] + 10).forEach((x, i) => {
    console.log(`  ${String(i + 1).padStart(2)}  ${x.team.padEnd(22)} ${String(x.vrs).padStart(5)} ${String(x.gain > 0 ? "+" + x.gain : x.gain).padStart(12)} ${(x.p * 100).toFixed(1).padStart(10)}%${i + 1 === SLOTS[reg] ? "   ← межа" : ""}`);
  });
}
console.log(`\nпрогонів: ${N} · ${((Date.now() - t0) / 1000).toFixed(0)} с`);
