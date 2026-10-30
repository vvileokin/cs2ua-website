import fs from "node:fs";
import { rank, CUTOFF_TS } from "./base.mjs";
import { teamOf } from "./teams.mjs";
import { buildWorld } from "./play.mjs";
import { EVENTS } from "./events.mjs";

/**
 * Прогноз запрошень на мейджор: сітки розігруються, очки за них рахує формула
 * Valve, а підсумок накладається на сьогоднішній рейтинг HLTV.
 *
 * Чому саме так. Дані матчів у відкритому репозиторії обриваються 6 вересня, і
 * ключа до свіжих нема. Але нам і не потрібен абсолютний рівень: ми беремо той
 * самий світ двічі — без жовтневих турнірів і з ними — і дивимось на різницю.
 * Усе застаріле в ній скорочується, лишається те, що додає жовтень. Цю різницю
 * додаємо до живих очок HLTV, які вже містять усе, що сталося.
 *
 * Поверх цього лишається виміряна невизначеність: склади розпадаються, команди
 * зникають, трапляються турніри, яких ми не знаємо. Вона взята з noise2.json —
 * розподіл Стьюдента з важкими хвостами, виміряний на восьми публікаціях Valve.
 */
const N = Number(process.argv[2] ?? 200);
const SNAP = JSON.parse(fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-live-0210r.json", "utf8"));
const NOISE = JSON.parse(fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/noise2.json", "utf8"));
const SLOTS = { europe: 18, americas: 9, asia: 5 };

/* ---------- живий рейтинг ---------- */
const REG = { EU: "europe", AM: "americas", AS: "asia" };
const live = SNAP.rows.split(";").map((r) => {
  const [g, team, pts, reg] = r.split("|");
  return { globalRank: +g, team, pts: +pts, region: REG[reg] };
});
const byRegion = {};
for (const t of live) (byRegion[t.region] ??= []).push(t);
for (const k of Object.keys(byRegion)) byRegion[k].sort((a, b) => b.pts - a.pts);

/* Сила для розіграшу сіток — глобальні очки, бо турніри міжрегіональні. */
const GLOBAL = fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-rows-0210.txt", "utf8").trim()
  .split(";").map((r) => r.split("|"));
const strength = new Map();
for (const [, team, pts] of GLOBAL) if (!strength.has(team)) strength.set(team, +pts);
const rate = (name) => strength.get(name) ?? 600;

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

/* ---------- базовий прогін ---------- */
console.log("базовий прогін двигуна Valve (світ без жовтневих турнірів)…");
const base = rank({ at: CUTOFF_TS });
const baseById = new Map();
for (const t of base.teams) baseById.set(t.teamId, t.rankValue);

/* Хто з живого рейтингу знайшовся у даних двигуна. */
const linked = [];
for (const t of live) {
  const e = teamOf(t.team);
  if (e && baseById.has(e.id)) linked.push({ ...t, id: e.id });
}
console.log(`команд у живому рейтингу: ${live.length} · зіставлено з двигуном: ${linked.length}`);

/* ---------- шум, що лишається поза сітками ---------- */
const BANDS = [["топ-10", 10], ["11–20", 20], ["21–40", 40], ["41–120", 120]];
const bandOf = (i) => BANDS.find(([, n]) => i < n)?.[0] ?? "41–120";
/* Половина виміряного розмаху: другу половину тепер пояснюють самі сітки. */
const SHARE = 0.5;
const tDraw = (nu, rand) => {
  let u = 0, v = 0;
  for (let i = 0; i < 12; i++) u += rand();
  u -= 6;                                            // наближення нормального
  for (let i = 0; i < Math.max(1, Math.round(nu)); i++) v += (rand() * 2 - 1) ** 2;
  return u / Math.sqrt(Math.max(0.2, v / Math.max(1, Math.round(nu))));
};

/* ---------- симуляція ---------- */
const hits = new Map(linked.map((t) => [t.team + "|" + t.region, 0]));
const deltaSum = new Map(linked.map((t) => [t.team, 0]));
const seen = new Map(linked.map((t) => [t.team + "|" + t.region, 0]));
let t0 = Date.now();
for (let run = 1; run <= N; run++) {
  const world = buildWorld(run * 7919 + 13, rate, pools);
  const sim = rank({ at: CUTOFF_TS, addMatches: world.addMatches, addEvents: world.addEvents });
  const simById = new Map();
  for (const t of sim.teams) simById.set(t.teamId, t.rankValue);

  const rand = (() => { let s = (run * 2654435761) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();

  const finals = { europe: [], americas: [], asia: [] };
  for (const t of linked) {
    const d = (simById.get(t.id) ?? baseById.get(t.id)) - baseById.get(t.id);
    deltaSum.set(t.team, (deltaSum.get(t.team) ?? 0) + d);
    const idx = byRegion[t.region].findIndex((x) => x.team === t.team);
    const band = NOISE[bandOf(idx)] ?? NOISE["41–120"];
    const noise = tDraw(band.nu, rand) * band.sd * SHARE;
    const dead = rand() < band.dropRate * SHARE;
    finals[t.region].push({ team: t.team, v: dead ? -9999 : t.pts + d + noise });
  }
  for (const [reg, list] of Object.entries(finals)) {
    list.sort((a, b) => b.v - a.v);
    list.forEach((x, i) => {
      const k = x.team + "|" + reg;
      seen.set(k, (seen.get(k) ?? 0) + 1);
      if (i < SLOTS[reg]) hits.set(k, (hits.get(k) ?? 0) + 1);
    });
  }
  if (run % 25 === 0) {
    const sec = (Date.now() - t0) / 1000;
    console.log(`  ${run}/${N} прогонів · ${(run / sec).toFixed(1)} за секунду`);
  }
}

/* ---------- підсумок ---------- */
const out = {};
for (const [k, n] of hits) {
  const [team, reg] = k.split("|");
  (out[reg] ??= []).push({ team, p: n / Math.max(1, seen.get(k)) });
}
for (const reg of Object.keys(out)) out[reg].sort((a, b) => b.p - a.p);
fs.writeFileSync("C:/Users/LNU/Downloads/vrs-model/sim-engine.json", JSON.stringify({
  asOf: "2026-10-02", runs: N, slots: SLOTS, events: EVENTS.length, regions: out,
}, null, 1));

for (const [reg, list] of Object.entries(out)) {
  console.log(`\n${reg.toUpperCase()} · ${SLOTS[reg]} місць`);
  list.slice(0, SLOTS[reg] + 8).forEach((x, i) => {
    console.log(`  ${String(i + 1).padStart(2)} ${x.team.padEnd(22)} ${(x.p * 100).toFixed(1).padStart(5)}%${i + 1 === SLOTS[reg] ? "   ← межа" : ""}`);
  });
}
console.log(`\nпрогонів: ${N} · турнірів у симуляції: ${EVENTS.length} · ${((Date.now() - t0) / 1000).toFixed(0)} с`);
