import fs from "node:fs";
import { createRequire } from "node:module";

/**
 * Наскільки глікківський крок занижує рух у рейтингу Valve.
 *
 * Потрібно через 1win: у вибірці Liquipedia їхній останній матч — 8 лютого, у
 * вікно шести місяців не потрапляє жоден, тож рушій їх не ранжує і прямо
 * порахувати дельту нема з чого. Але на тих п'ятнадцяти командах EPL, яких
 * рушій бачить, можна порівняти обидва способи на тих самих матчах і дістати
 * коефіцієнт, яким крок доводиться до рушія.
 */

const require = createRequire(import.meta.url);
const OPENVRS = new URL("./openvrs/", import.meta.url).pathname.replace(/^\//, "");
const MATCHDATA = `${OPENVRS}/data/matchdata_sample_20260909.json`;

const engine = JSON.parse(fs.readFileSync("epl-engine-deltas.json", "utf8"));
const snap = JSON.parse(fs.readFileSync("vrs-live-0610.json", "utf8"));
const rows = snap.rows.split(";").map((s) => {
  const [r, team, points, reg] = s.split("|");
  return { rank: +r, team, points: +points, reg };
});

const plain = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const aka = { natusvincere: "navi", ninjasinpyjamas: "nip", betboomteam: "betboom", themongolz: "mongolz" };
const nrm = (s) => aka[plain(s)] ?? plain(s);
const pointsOf = (n) => rows.find((r) => nrm(r.team) === nrm(n))?.points;

const Q = Math.log(10) / 400, RD = 75;
const gl = 1 / Math.sqrt(1 + (3 * Q * Q * RD * RD) / (Math.PI * Math.PI));
const KG = Q * (1 / (1 / (RD * RD) + Q * Q * gl * gl * 0.25)) * gl;
const D = JSON.parse(fs.readFileSync("calibration.json", "utf8")).divisor;
const E = (r, ro) => 1 / (1 + Math.pow(10, (gl * (r - ro)) / -D));

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const api = async (p) => (await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${p}`, {
  headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
})).json();

const played = await api("matches?select=team_a,team_b,score_a,score_b&tournament_slug=eq.esl-pro-league-s24&status=eq.finished");
const proj = await api("major_projection?select=slug,team&slug=not.is.null");
const nameOf = new Map(proj.map((r) => [r.slug, r.team]));

/**
 * Крок Глікко по тих самих матчах, розкладений на перемоги й поразки окремо.
 *
 * Одним множником це не зводиться, і видно це на M80: крок каже −8,9, рушій дає
 * +43,9. Причина в тому, що Valve платить за саму перемогу над сильним
 * суперником, а симетричний крок бачить лише різницю очок, тож виграна частина
 * занижена в рази, а програна майже збігається. Отже два коефіцієнти, не один.
 */
function step(slug) {
  const me = pointsOf(nameOf.get(slug));
  if (me == null) return null;
  let w = 0, l = 0;
  for (const m of played) {
    const side = m.team_a === slug ? "a" : m.team_b === slug ? "b" : null;
    if (!side) continue;
    const opp = pointsOf(nameOf.get(side === "a" ? m.team_b : m.team_a));
    if (opp == null) continue;
    const won = side === "a" ? m.score_a > m.score_b : m.score_b > m.score_a;
    if (won) w += KG * (1 - E(me, opp));
    else l -= KG * E(me, opp);
  }
  return { w, l, d: w + l };
}

const slugOf = new Map([...nameOf].map(([s, n]) => [nrm(n), s]));
const pairs = [];
for (const [name, eng] of Object.entries(engine)) {
  const slug = slugOf.get(nrm(name));
  if (!slug) continue;
  const st = step(slug);
  if (st == null) continue;
  pairs.push({ name, eng, ...st });
}

/* Найменші квадрати на двох невідомих: eng ≈ a·виграна частина + b·програна. */
let Sww = 0, Sll = 0, Swl = 0, Swy = 0, Sly = 0;
for (const p of pairs) {
  Sww += p.w * p.w; Sll += p.l * p.l; Swl += p.w * p.l;
  Swy += p.w * p.eng; Sly += p.l * p.eng;
}
const det = Sww * Sll - Swl * Swl;
const a = (Swy * Sll - Sly * Swl) / det;
const b = (Sly * Sww - Swy * Swl) / det;
const fit = (p) => a * p.w + b * p.l;

pairs.sort((x, y) => y.eng - x.eng);
console.log("команда             рушій   перем.  пораз.   модель   похиб.");
for (const p of pairs) {
  console.log(` ${p.name.padEnd(18)}${p.eng.toFixed(1).padStart(6)}${p.w.toFixed(1).padStart(9)}${p.l.toFixed(1).padStart(8)}` +
    `${fit(p).toFixed(1).padStart(9)}${(fit(p) - p.eng).toFixed(1).padStart(9)}`);
}
const rms = Math.sqrt(pairs.reduce((s, p) => s + (fit(p) - p.eng) ** 2, 0) / pairs.length);
console.log(`\nперемоги ×${a.toFixed(2)}, поразки ×${b.toFixed(2)} · середня похибка ${rms.toFixed(1)} очка на ${pairs.length} командах`);
fs.writeFileSync("step-scale.json", JSON.stringify({ a, b, rms, pairs }, null, 1));
