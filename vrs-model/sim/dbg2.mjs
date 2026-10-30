import fs from "node:fs";
import { rank, CUTOFF_TS } from "./base.mjs";
import { buildWorld } from "./play.mjs";

const SNAP = JSON.parse(fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-live-0210r.json", "utf8"));
const REG = { EU: "europe", AM: "americas", AS: "asia" };
const live = SNAP.rows.split(";").map((r) => { const [g, t, p, reg] = r.split("|"); return { team: t, pts: +p, region: REG[reg] }; });
const byRegion = {};
for (const t of live) (byRegion[t.region] ??= []).push(t);
for (const k of Object.keys(byRegion)) byRegion[k].sort((a, b) => b.pts - a.pts);
const namesOf = (r, a, b) => byRegion[r].slice(a, b).map((t) => t.team);
const pools = {
  europe: namesOf("europe", 8, 60), "europe-low": namesOf("europe", 40, 110), cct: namesOf("europe", 25, 95),
  cis: ["Nemiga", "Nuclear TigeRES", "K27", "FORZE Reload", "BAKS", "ex-RUBY", "Black Phoenix", "Rune Eaters",
        "Butterfly", "Bushido Wildcats", "PRIVATE", "UPGRADE", "CYBERSHOKE", "WW"],
  americas: namesOf("americas", 6, 40), asia: namesOf("asia", 2, 30),
};
const G = fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-rows-0210.txt", "utf8").trim().split(";").map((r) => r.split("|"));
const st = new Map();
for (const [, t, p] of G) if (!st.has(t)) st.set(t, +p);

const world = buildWorld(7932, (n) => st.get(n) ?? 600, pools);
console.log("матчів:", world.addMatches.length, "подій:", world.addEvents.length);
const bad = world.addMatches.filter((m) => !Array.isArray(m.team1Players) || !Array.isArray(m.team2Players));
console.log("проблемних серед домальованих:", bad.length);

const trim = JSON.parse(fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/sim/matchdata-trim.json", "utf8"));
const merged = [...trim.matches, ...world.addMatches];
const bad2 = merged.filter((m) => !m.team1Players || !m.team2Players);
console.log("проблемних у злитому масиві:", bad2.length, bad2[0] ? JSON.stringify({ e: bad2[0].eventId, t1: bad2[0].team1Name, t2: bad2[0].team2Name }) : "");

try {
  const r = rank({ at: CUTOFF_TS, addMatches: world.addMatches, addEvents: world.addEvents });
  console.log("прогін із сітками: команд", r.teams.length);
} catch (e) {
  console.log("падіння:", e.message);
}
