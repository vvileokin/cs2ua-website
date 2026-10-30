import fs from "node:fs";
import { rank, CUTOFF_TS } from "./base.mjs";
import { teamOf } from "./teams.mjs";
import { EVENTS, prizesFor } from "./events.mjs";

/**
 * Скільки коштує місце на турнірі — за формулою Valve, а не за припущенням.
 *
 * Дослід побудований так, щоб застарілі дані не псували відповідь. Світ береться
 * один і той самий, усі інші результати однакові, різниться тільки те, як
 * виступила одна команда: виграла турнір, вилетіла в середині або вибула першою.
 * Усе, що не стосується її виступу, у різниці скорочується.
 *
 * Команди для досліду підібрані так, щоб їхній рейтинг у базі двигуна був
 * близький до живого: там, де база бреше на двісті очок, глікo реагує надто
 * різко і ціна виходить завищеною.
 */
const ts = (d) => Math.floor(new Date(d + "T12:00:00Z").getTime() / 1000);

/** Побудувати подію, де задана команда посідає задане місце. */
function eventWorld(ev, field, winnerIdx, seedTeam, place) {
  const order = [...field];
  /* Ставимо потрібну команду на потрібне місце, решту лишаємо як є. */
  const i = order.indexOf(seedTeam);
  order.splice(i, 1);
  order.splice(Math.min(place - 1, order.length), 0, seedTeam);

  const eventId = `price-${ev.name.replace(/[^a-z0-9]/gi, "").toLowerCase()}-${place}`;
  const begin = ts(ev.begin), end = ts(ev.end);
  const prizes = prizesFor(ev, order.length);
  const addMatches = [];
  /* Матчі: кожне місце б'є всіх, хто нижче за нього, по одному разу — цього
     досить, щоб модель побачила і перемоги, і силу суперників. */
  for (let a = 0; a < order.length; a++) {
    for (let b = a + 1; b < Math.min(order.length, a + 3); b++) {
      const W = teamOf(order[a]), L = teamOf(order[b]);
      if (!W || !L) continue;
      addMatches.push({
        matchStartTime: begin + (a * 3600),
        team1Id: W.id, team1Name: W.name, team1Image: "", team1Players: W.players,
        team2Id: L.id, team2Name: L.name, team2Image: "", team2Players: L.players,
        eventId, pagename: eventId, parentEventPage: eventId,
        matchId: `${eventId}-${a}-${b}`,
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

const base = rank({ at: CUTOFF_TS });
const baseById = new Map(base.teams.map((t) => [t.teamId, t.rankValue]));

const live = fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-rows-0210.txt", "utf8").trim()
  .split(";").map((r) => r.split("|"));
const liveOf = new Map();
for (const [, t, p] of live) if (!liveOf.has(t)) liveOf.set(t, +p);

/** Команди, чия база близька до живої — на них ціна вимірюється чесно. */
const clean = [];
for (const [name, pts] of liveOf) {
  const e = teamOf(name);
  if (!e || !baseById.has(e.id)) continue;
  const gap = Math.abs(baseById.get(e.id) - pts);
  if (gap < 70 && pts > 900) clean.push({ name, gap: Math.round(gap), base: Math.round(baseById.get(e.id)), live: pts });
}
clean.sort((a, b) => b.live - a.live);
console.log("команди з чесною базою (|база − жива| < 70):");
console.log("  " + clean.slice(0, 14).map((c) => `${c.name} ${c.live}/${c.base}`).join(", "));

const TESTS = [
  ["Stake Pulse Beat 3", ["Inner Circle", "fnatic", "JiJieHao"]],
  ["PGL Masters Bucharest", ["Natus Vincere", "G2"]],
  ["DraculaN 7", ["JiJieHao", "SINNERS"]],
  ["Stake Ranked Episode 5", ["Inner Circle", "BIG"]],
  ["CCT Europe Series 10", ["SINNERS", "CYBERSHOKE"]],
];

console.log("\nціна місця (зміна рейтингу проти вильоту внизу сітки):");
for (const [evName, teams] of TESTS) {
  const ev = EVENTS.find((e) => e.name === evName);
  if (!ev) continue;
  const field = ev.teams.filter((n) => teamOf(n));
  for (const team of teams) {
    if (!field.includes(team)) continue;
    const spots = [1, Math.ceil(field.length / 4), Math.ceil(field.length / 2), field.length];
    const vals = spots.map((place) => {
      const w = eventWorld(ev, field, 0, team, place);
      const r = rank({ at: CUTOFF_TS, addMatches: w.addMatches, addEvents: w.addEvents });
      const v = new Map(r.teams.map((t) => [t.teamId, t.rankValue]));
      const id = teamOf(team).id;
      return Math.round((v.get(id) ?? baseById.get(id)) - baseById.get(id));
    });
    const bottom = vals[vals.length - 1];
    console.log(`  ${evName.slice(0, 26).padEnd(28)} ${team.padEnd(16)} ` +
      spots.map((p, i) => `${p} місце: ${vals[i] > 0 ? "+" : ""}${vals[i]}`).join(" · ") +
      `   (виграти проти вильоту: ${vals[0] - bottom > 0 ? "+" : ""}${vals[0] - bottom})`);
  }
}
