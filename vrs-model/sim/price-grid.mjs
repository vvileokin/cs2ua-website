import fs from "node:fs";
import { rank, CUTOFF_TS } from "./base.mjs";
import { teamOf } from "./teams.mjs";
import { EVENTS, prizesFor } from "./events.mjs";

/**
 * Прайс-лист турнірів: скільки очок дає кожне місце, за формулою Valve.
 *
 * Для кожного турніру беремо кілька «пробних» команд різної сили, чия база в
 * двигуні близька до живого рейтингу, і проганяємо світ, де проба посідає
 * перше, чверть, половину й останнє місце. Усе інше в тих світах однакове, тож
 * різниця — це чиста ціна виступу.
 *
 * Далі ціну перераховуємо на будь-яку команду: вона залежить від того,
 * наскільки команда сильніша за поле. Слабший від поля виграє більше, сильніший
 * має менше що вигравати й більше що втрачати.
 */
const ts = (d) => Math.floor(new Date(d + "T12:00:00Z").getTime() / 1000);

const live = fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-rows-0210.txt", "utf8").trim()
  .split(";").map((r) => r.split("|"));
const liveOf = new Map();
for (const [, t, p] of live) if (!liveOf.has(t)) liveOf.set(t, +p);

const base = rank({ at: CUTOFF_TS });
const baseById = new Map(base.teams.map((t) => [t.teamId, t.rankValue]));

/** Проби: база близька до живого рейтингу. */
const probes = [];
for (const [name, pts] of liveOf) {
  const e = teamOf(name);
  if (!e || !baseById.has(e.id)) continue;
  if (Math.abs(baseById.get(e.id) - pts) < 80 && pts > 800) probes.push({ name, pts, id: e.id });
}
probes.sort((a, b) => b.pts - a.pts);
console.log(`проб: ${probes.length} · від ${probes[0].name} (${probes[0].pts}) до ${probes.at(-1).name} (${probes.at(-1).pts})`);

/** Світ, де `who` посідає місце `place`, а решта поля — як є. */
function world(ev, field, who, place) {
  const order = field.filter((t) => t !== who);
  order.splice(Math.min(place - 1, order.length), 0, who);
  const eventId = `grid-${ev.name.replace(/[^a-z0-9]/gi, "").toLowerCase()}-${place}`;
  const begin = ts(ev.begin), end = ts(ev.end);
  const prizes = prizesFor(ev, order.length);
  const addMatches = [];
  for (let a = 0; a < order.length; a++) {
    for (let b = a + 1; b < Math.min(order.length, a + 3); b++) {
      const W = teamOf(order[a]), L = teamOf(order[b]);
      if (!W || !L) continue;
      addMatches.push({
        matchStartTime: begin + a * 3600,
        team1Id: W.id, team1Name: W.name, team1Image: "", team1Players: W.players,
        team2Id: L.id, team2Name: L.name, team2Image: "", team2Players: L.players,
        eventId, pagename: eventId, parentEventPage: eventId, matchId: `${eventId}-${a}-${b}`,
        maps: [{ map: "sim", team1Score: 2, team2Score: 0 }],
        winningTeam: 1, forfeited: false, valveRanked: true, lan: !!ev.lan,
      });
    }
  }
  const addEvents = [{
    eventId, eventPage: eventId, parent: eventId, eventName: ev.name,
    prizePool: `$${ev.prize}`, lan: !!ev.lan, location: "", valveRanked: true, finished: true,
    fmt: begin, lmt: end,
    prizeDistribution: order.map((t, k) => ({
      placement: String(k + 1), teamId: teamOf(t)?.id, prize: prizes[k] ?? 0, clubShare: prizes[k] ?? 0,
      shared: false, progress: false, qualifiedEvents: [],
    })).filter((x) => x.teamId),
  }];
  return { addMatches, addEvents };
}

const out = {};
let runs = 0;
const t0 = Date.now();
for (const ev of EVENTS) {
  const field = ev.teams.filter((n) => teamOf(n));
  if (field.length < 4) { console.log(`  — ${ev.name}: склад невідомий, пропущено`); continue; }
  const fieldAvg = field.reduce((a, n) => a + (liveOf.get(n) ?? 700), 0) / field.length;

  /* дві проби: сильніша за поле і слабша за поле */
  const sorted = [...probes].sort((a, b) => Math.abs(a.pts - fieldAvg * 1.15) - Math.abs(b.pts - fieldAvg * 1.15));
  const strong = sorted[0];
  const sorted2 = [...probes].sort((a, b) => Math.abs(a.pts - fieldAvg * 0.85) - Math.abs(b.pts - fieldAvg * 0.85));
  const weak = sorted2[0];
  const picks = [...new Set([strong, weak])];

  const n = Math.max(field.length, 4);
  const spots = [...new Set([1, Math.max(2, Math.ceil(n / 4)), Math.max(3, Math.ceil(n / 2)), n])];
  const curve = {};
  for (const p of picks) {
    const f2 = field.includes(p.name) ? field : [...field, p.name];
    curve[p.name] = { rating: p.pts, points: {} };
    for (const place of spots) {
      const w = world(ev, f2, p.name, place);
      const r = rank({ at: CUTOFF_TS, addMatches: w.addMatches, addEvents: w.addEvents });
      runs++;
      const v = new Map(r.teams.map((t) => [t.teamId, t.rankValue]));
      curve[p.name].points[place] = Math.round((v.get(p.id) ?? baseById.get(p.id)) - baseById.get(p.id));
    }
  }
  out[ev.name] = { prize: ev.prize, lan: !!ev.lan, size: n, fieldAvg: Math.round(fieldAvg), spots, probes: curve };
  const show = Object.entries(curve).map(([n2, c]) => `${n2}(${c.rating}): ` + spots.map((s) => `${s}→${c.points[s] > 0 ? "+" : ""}${c.points[s]}`).join(" "));
  console.log(`  ${ev.name.slice(0, 30).padEnd(32)} поле≈${Math.round(fieldAvg)} · ${show.join(" | ")}`);
}

fs.writeFileSync("C:/Users/LNU/Downloads/vrs-model/sim/prices.json", JSON.stringify(out, null, 1));
console.log(`\nпрогонів двигуна: ${runs} · ${((Date.now() - t0) / 1000).toFixed(0)} с · записано prices.json`);
