import fs from "node:fs";
import { rank, CUTOFF_TS } from "./base.mjs";
import { teamOf } from "./teams.mjs";
import { buildWorld } from "./play.mjs";

/** Скільки очок формула Valve нараховує за жовтень — по одному розіграшу. */
const G = fs.readFileSync("C:/Users/LNU/Downloads/vrs-model/vrs-rows-0210.txt", "utf8").trim()
  .split(";").map((r) => r.split("|"));
const st = new Map();
for (const [, t, p] of G) if (!st.has(t)) st.set(t, +p);
const rate = (n) => st.get(n) ?? 600;

const base = rank({ at: CUTOFF_TS });
const b = new Map(base.teams.map((t) => [t.teamId, t.rankValue]));
const world = buildWorld(12345, rate, {});
const sim = rank({ at: CUTOFF_TS, addMatches: world.addMatches, addEvents: world.addEvents });
const s = new Map(sim.teams.map((t) => [t.teamId, t.rankValue]));

const rows = [];
for (const [, name] of G.map((x) => [x[0], x[1]]).slice(0, 60)) {
  const e = teamOf(name);
  if (!e || !b.has(e.id)) continue;
  rows.push({ name, base: Math.round(b.get(e.id)), sim: Math.round(s.get(e.id) ?? b.get(e.id)), live: st.get(name) });
}
rows.forEach((r) => { r.d = r.sim - r.base; });
rows.sort((a, c) => c.d - a.d);
console.log("  команда                жива VRS   база двигуна   після жовтня   різниця");
for (const r of rows)
  console.log(`  ${r.name.padEnd(22)} ${String(r.live).padStart(6)} ${String(r.base).padStart(12)} ${String(r.sim).padStart(14)} ${String(r.d > 0 ? "+" + r.d : r.d).padStart(9)}`);
