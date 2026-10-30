import fs from "node:fs";

/**
 * Знімок рейтингу з трьох регіональних таблиць HLTV, а не з глобальної.
 *
 * Запрошення на мейджор роздають за регіональними таблицями, і в них свої
 * очки: BC.Game у глобальній має 1241 і позначку «Європа», а в азійській —
 * 1327 і друге місце. Astralis у європейській 1564 проти 1515 у глобальній,
 * B8 1546 проти 1538. Модель рахує саме змагання за регіональні місця, тож
 * бере регіональні числа.
 *
 * Глобальне місце все одно потрібне — за ним ідуть запрошення на турніри з
 * позначкою «VRS (Global)». Воно приклеюється до команди зіставленням за
 * назвою, а серед тезок — за найближчими очками; кожен рядок глобальної
 * таблиці витрачається один раз, тому дві BC.Game не зливаються в одну.
 */
const EU = fs.readFileSync("vrs-rows-0210-eu.txt", "utf8").trim();
const AM = fs.readFileSync("vrs-rows-0210-am.txt", "utf8").trim();
const AS = fs.readFileSync("vrs-rows-0210-as.txt", "utf8").trim();
const GLOBAL = fs.readFileSync("vrs-rows-0210.txt", "utf8").trim();

const parseReg = (s) => s.split(";").map((r) => {
  const [rank, team, pts] = r.split("|");
  return { rank: +rank, team, pts: +pts };
});
const global = GLOBAL.split(";").map((r) => {
  const [rank, team, pts, reg] = r.split("|");
  return { rank: +rank, team, pts: +pts, reg, taken: false };
});

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const byName = new Map();
for (const g of global) {
  const k = norm(g.team);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(g);
}

const globalRankOf = (team, pts) => {
  const list = byName.get(norm(team))?.filter((g) => !g.taken) ?? [];
  if (!list.length) return 999;
  let best = list[0];
  for (const g of list) if (Math.abs(g.pts - pts) < Math.abs(best.pts - pts)) best = g;
  best.taken = true;
  return best.rank;
};

const rows = [];
const moved = [];
for (const [list, tag] of [[parseReg(EU), "EU"], [parseReg(AM), "AM"], [parseReg(AS), "AS"]]) {
  for (const t of list) {
    const gr = globalRankOf(t.team, t.pts);
    const g = global.find((x) => x.rank === gr);
    if (g && g.reg !== tag) moved.push(`${t.team}: глобальна таблиця каже ${g.reg}, регіональна — ${tag} (${t.pts} очок, ${tag} #${t.rank})`);
    rows.push(`${gr}|${t.team}|${t.pts}|${tag}`);
  }
}

fs.writeFileSync("vrs-live-0210r.json", JSON.stringify({
  asOf: "2026-10-02",
  source: "hltv.org/valve-ranking/teams (регіональні таблиці Європи, Америки та Азії)",
  note: "Очки з регіональних таблиць HLTV — саме за ними роздають запрошення. Номер у першій колонці — місце в глобальній таблиці, воно потрібне для турнірів із запрошеннями за глобальним рейтингом.",
  rows: rows.join(";"),
}, null, 1));

console.log(`рядків: ${rows.length} (EU ${parseReg(EU).length}, AM ${parseReg(AM).length}, AS ${parseReg(AS).length})`);
console.log("\nрозбіжності регіону між глобальною і регіональними таблицями:");
console.log(moved.length ? moved.map((m) => "  " + m).join("\n") : "  немає");
