import fs from "node:fs";
import { createRequire } from "node:module";

/**
 * Додає зіграні матчі EPL S24 у знімок таблиці VRS.
 *
 * Навіщо. HLTV пише, що їхня таблиця враховує матчі з незавершених турнірів, —
 * але EPL туди ще не доїхав. Звірка третього туру це показує прямо: NAVI
 * обіграли 9z 2:0 і втратили 75 очок, 1win обіграли Legacy і втратили 46, а G2
 * за перемогу над сімдесят четвертою командою отримали +63. Рух у таблиці
 * зовсім не про ці матчі — це згасання старих результатів і чужі турніри. Отже
 * прогноз, побудований на такій таблиці, просто не знає про турнір, який ми
 * показуємо.
 *
 * Як. Беремо всі дограні матчі EPL із нашої бази, згодовуємо їх моделі Valve
 * як додані (`addMatches`) і дивимося, на скільки зміниться рейтинг кожної
 * команди проти прогону без них. Ця різниця лягає на живі очки HLTV.
 *
 * Чого це не робить. Не вгадує, скільки Valve нарахує за призові та місце в
 * сітці, — лише за самі матчі. Тому коли HLTV нарешті оновить таблицю, числа
 * розійдуться на кілька очок; це поправка, а не заміна.
 *
 * Запуск: node epl-into-vrs.mjs           — порахувати і показати
 *         node epl-into-vrs.mjs --apply   — записати vrs-live.json
 */

const require = createRequire(import.meta.url);
const OPENVRS = new URL("./openvrs/", import.meta.url).pathname.replace(/^\//, "");
const { generateRanking } = require(`${OPENVRS}/model/ranking.js`);
const MATCHDATA = `${OPENVRS}/data/matchdata_sample_20260909.json`;
const dataset = require(MATCHDATA);

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const api = async (path) => {
  const r = await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};

const plain = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const aka = { natusvincere: "navi", ninjasinpyjamas: "nip", betboomteam: "betboom", themongolz: "mongolz" };
const nrm = (s) => aka[plain(s)] ?? plain(s);

/** Склади з вибірки Liquipedia: остання гра кожної команди плюс скільки їх усього. */
const rosters = (() => {
  const out = new Map();
  for (const m of dataset.matches) {
    for (const side of [1, 2]) {
      const id = m[`team${side}Id`], name = m[`team${side}Name`];
      if (!id) continue;
      const key = nrm(name);
      const have = out.get(key) ?? { id, name, at: 0, players: [], games: 0 };
      have.games++;
      if (m.matchStartTime > have.at) {
        have.at = m.matchStartTime; have.id = id; have.players = m[`team${side}Players`];
      }
      out.set(key, have);
    }
  }
  return out;
})();

const RENAMED = { envy: "3DMAX" };
function roster(wanted) {
  const want = nrm(RENAMED[nrm(wanted)] ?? wanted);
  const exact = rosters.get(want);
  if (exact) return exact;
  return [...rosters.entries()]
    .filter(([k]) => k.includes(want) || want.includes(k))
    .map(([, v]) => v)
    .sort((a, b) => b.games - a.games)[0] ?? null;
}

const lastTime = Math.max(...dataset.matches.map((m) => m.matchStartTime));
/** Найсвіжіший великий ЛАН — носій для доданих матчів: EPL у вибірці ще немає. */
const stage = dataset.events.filter((e) => e.lan && e.valveRanked).sort((a, b) => (b.lmt ?? 0) - (a.lmt ?? 0))[0];

/* ---- матчі з нашої бази ---------------------------------------------------- */

const played = await api(
  "matches?select=id,team_a,team_b,score_a,score_b,start_at&tournament_slug=eq.esl-pro-league-s24&status=eq.finished&order=start_at.asc",
);
const proj = await api("major_projection?select=slug,team&slug=not.is.null");
const nameOf = new Map(proj.map((r) => [r.slug, r.team]));

const added = [];
const skipped = [];
let clock = lastTime;
for (const m of played) {
  const nameA = nameOf.get(m.team_a), nameB = nameOf.get(m.team_b);
  const rA = nameA && roster(nameA), rB = nameB && roster(nameB);
  if (!rA || !rB) { skipped.push(`${m.team_a}/${m.team_b}`); continue; }
  const winner = m.score_a > m.score_b ? 1 : 2;
  clock += 3600;
  added.push({
    matchStartTime: clock,
    team1Id: rA.id, team1Name: rA.name, team1Image: "", team1Players: rA.players,
    team2Id: rB.id, team2Name: rB.name, team2Image: "", team2Players: rB.players,
    eventId: stage.eventId, pagename: stage.eventPage, parentEventPage: stage.parent,
    matchId: `epl_${m.id}`,
    maps: Array.from({ length: m.score_a + m.score_b }, (_, i) => ({
      mapName: ["inferno", "mirage", "nuke"][i] ?? "dust2",
      team1Score: i < m.score_a ? 13 : 8,
      team2Score: i < m.score_a ? 8 : 13,
    })),
    winningTeam: winner, forfeited: false, valveRanked: true, lan: true,
  });
}

console.log(`дограних матчів EPL: ${played.length} · додано в модель: ${added.length}` +
  (skipped.length ? ` · пропущено: ${skipped.join(", ")}` : ""));

/* ---- що це робить з рейтингом ---------------------------------------------- */

const rank = (teams, name) => teams.find((t) => nrm(t.name) === nrm(name))?.rankValue ?? null;
const [, base] = generateRanking(-1, MATCHDATA, false);
const [, withEpl] = generateRanking(-1, MATCHDATA, false, undefined, undefined, undefined, undefined, undefined, added);

const snapFile = process.env.VRS_FILE ?? "vrs-live.json";
const snap = JSON.parse(fs.readFileSync(snapFile, "utf8"));
const rows = snap.rows.split(";").map((s) => {
  const [r, team, points, reg] = s.split("|");
  return { rank: +r, team, points: +points, reg };
});

/* Запасний спосіб для тих, кого рушій не ранжує.
   1win у вибірці Liquipedia є, але їхній останній матч там — 8 лютого, тобто у
   вікно шести місяців не потрапляє жоден, і в підсумковій таблиці рушія їх
   немає. EPL для них не рахувався взагалі — нуль там, де дві перемоги над
   Legacy і G2.
   Беремо глікківський крок `KG · (результат − очікування)`, але не сирий:
   calib-step.mjs зміряв його проти рушія на тих п'ятнадцяти командах EPL, яких
   рушій бачить, і показав, що одним множником це не зводиться. Поразки крок
   передає майже точно (×1,0), перемоги занижує вдвічі (×2,2) — бо VRS платить
   за саму перемогу над сильним суперником, а симетричний крок бачить лише
   різницю очок. Звідси два коефіцієнти замість одного; на M80 сирий крок давав
   узагалі протилежний знак. */
const Q = Math.log(10) / 400, RD = 75;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const D = JSON.parse(fs.readFileSync("calibration.json", "utf8")).divisor;
const E = (r, ro) => 1 / (1 + Math.pow(10, (gl * (r - ro)) / -D));
const SCALE = fs.existsSync("step-scale.json")
  ? JSON.parse(fs.readFileSync("step-scale.json", "utf8"))
  : { a: 1, b: 1 };
const pointsOf = (name) => rows.find((r) => nrm(r.team) === nrm(name))?.points;

const deltas = new Map();
/** Лише ті, що порахував рушій, — опора для калібрування кроку. */
const byEngine = {};
const approx = [];
for (const slug of new Set(played.flatMap((m) => [m.team_a, m.team_b]))) {
  const name = nameOf.get(slug);
  if (!name) continue;
  const r = roster(name);
  const before = r && rank(base, r.name), after = r && rank(withEpl, r.name);
  if (before != null && after != null) {
    deltas.set(nrm(name), after - before);
    byEngine[name] = after - before;
    continue;
  }

  const mine = pointsOf(name);
  if (mine == null) continue;
  let w = 0, l = 0;
  for (const m of played) {
    const side = m.team_a === slug ? "a" : m.team_b === slug ? "b" : null;
    if (!side) continue;
    const oppName = nameOf.get(side === "a" ? m.team_b : m.team_a);
    const opp = oppName && pointsOf(oppName);
    if (opp == null) continue;
    const won = side === "a" ? m.score_a > m.score_b : m.score_b > m.score_a;
    if (won) w += KG * (1 - E(mine, opp));
    else l -= KG * E(mine, opp);
  }
  const d = SCALE.a * w + SCALE.b * l;
  deltas.set(nrm(name), d);
  approx.push(`${name} ${d >= 0 ? "+" : ""}${d.toFixed(1)}`);
}
fs.writeFileSync("epl-engine-deltas.json", JSON.stringify(byEngine, null, 1));
if (approx.length) console.log(`наближено (рушій не ранжує): ${approx.join(", ")}`);

console.log("\nщо додає турнір (очки VRS):");
[...deltas.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, d]) => {
  const row = rows.find((r) => nrm(r.team) === k);
  console.log(`  ${(row?.team ?? k).padEnd(18)} ${(d >= 0 ? "+" : "") + d.toFixed(1)}  → ${Math.round((row?.points ?? 0) + d)}`);
});

if (!process.argv.includes("--apply")) {
  console.log("\nпробний прогін — знімок не змінено. --apply щоб записати");
  process.exit(0);
}

const moved = rows.map((r) => ({ ...r, points: Math.round(r.points + (deltas.get(nrm(r.team)) ?? 0)) }));
moved.sort((a, b) => b.points - a.points);
fs.writeFileSync(snapFile, JSON.stringify({
  ...snap,
  note: `${snap.note} + дограні матчі EPL S24, пораховані рушієм Valve (HLTV їх ще не врахував)`,
  rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.points}|${r.reg}`).join(";"),
}));
console.log(`\nзнімок оновлено: ${snapFile}`);
