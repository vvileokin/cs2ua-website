import fs from "node:fs";
import { standings } from "./major-standings.mjs";

/**
 * Підсумок стадії й повне нарахування.
 *
 * Підсумок не вводиться руками: він рахується з матчів, бо там він уже є.
 * Запис команди — це її кошик, і переписувати шістнадцять рядків у форму
 * означало б завести шістнадцять нагод помилитися.
 *
 * Нарахування робить `score_major_stage`, а не цей скрипт. Вона знає про
 * ціни, бонус за чисту картку, тайбрейк і сповіщення, і після 0104 доплачує
 * різницю, а не платить заново: за 3-0 і 0-3 вже заплачено окремо, і тут
 * додасться тільки те, чого бракує за прохід.
 *
 *   node scripts/major-score-stage.mjs 1          — показати
 *   node scripts/major-score-stage.mjs 1 --apply  — внести підсумок і нарахувати
 */
const APPLY = process.argv.includes("--apply");
const STAGE = Number(process.argv[2] ?? 1);

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const API = ENV.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/";
const H = {
  apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: "Bearer " + ENV.SUPABASE_SERVICE_ROLE_KEY,
  "content-type": "application/json",
};
const j = async (q) => (await fetch(API + q, { headers: H })).json();

const [stage] = await j(`major_stages?select=stage,title,kind,teams,actual,scored_at&stage=eq.${STAGE}`);
if (!stage) throw new Error(`немає стадії ${STAGE}`);
if (stage.scored_at) throw new Error("стадію вже зараховано");

const rec = await standings();
const actual = {};
for (const t of stage.teams) {
  const r = rec.get(t);
  if (!r) throw new Error(`немає матчів для ${t}`);
  /* Кошик — це запис. Поки команда не дійшла ні до трьох перемог, ні до
     трьох поразок, стадія для неї не скінчилася, і підсумку в неї немає. */
  if (r.w !== 3 && r.l !== 3) throw new Error(`${t} ще грає: ${r.w}-${r.l}`);
  actual[t] = `${r.w}-${r.l}`;
}
if (Object.keys(actual).length !== stage.teams.length) throw new Error("не всі команди");

const byOut = {};
for (const [t, o] of Object.entries(actual)) (byOut[o] ??= []).push(t);
console.log(`${stage.title}: підсумок на ${Object.keys(actual).length} команд`);
for (const o of ["3-0", "3-1", "3-2", "2-3", "1-3", "0-3"]) {
  if (byOut[o]) console.log(`  ${o}  ${byOut[o].join(", ")}`);
}

const cards = await j(`major_pickem?select=user_id,points,hits,scored_at&stage=eq.${STAGE}`);
const paid = cards.reduce((s, c) => s + (c.points ?? 0), 0);
console.log(`\nкарток: ${cards.length}, уже виплачено: ${paid} очок`);

if (!APPLY) {
  console.log("\nпробний прогін. --apply щоб внести підсумок і нарахувати");
  process.exit(0);
}

const r1 = await fetch(API + `major_stages?stage=eq.${STAGE}`, {
  method: "PATCH", headers: H,
  body: JSON.stringify({ actual, updated_at: new Date().toISOString() }),
});
if (!r1.ok) throw new Error(`підсумок: ${r1.status} ${await r1.text()}`);
console.log("підсумок внесено");

const r2 = await fetch(API + "rpc/score_major_stage", {
  method: "POST", headers: H, body: JSON.stringify({ p_stage: STAGE }),
});
const out = await r2.json();
if (!r2.ok) throw new Error(`нарахування: ${r2.status} ${JSON.stringify(out).slice(0, 300)}`);

const total = out.reduce((s, x) => s + (x.points ?? 0), 0);
const dist = {};
for (const x of out) dist[x.hits] = (dist[x.hits] ?? 0) + 1;
console.log(`\nнараховано: ${out.length} карток, ${total} очок усього за стадію`);
console.log(`доплачено цього разу: ${total - paid}`);
console.log("влучань:", Object.entries(dist).sort((a, b) => b[0] - a[0])
  .map(([h, n]) => `${h}/10 — ${n}`).join(", "));
console.log("\nтоп:");
for (const x of [...out].sort((a, b) => b.points - a.points).slice(0, 5)) {
  const p = await j(`profiles?select=handle&id=eq.${x.user_id}`);
  console.log(`  ${(p[0]?.handle ?? "—").padEnd(24)} ${String(x.points).padStart(4)} очок  ${x.hits}/10`);
}
