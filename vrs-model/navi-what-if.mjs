import fs from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * Скільки очок НАВІ треба, щоб повернутись у вісімнадцятку.
 *
 * Питання «чому так низько» має дві відповіді, і друга корисніша за першу.
 * Перша: у них 1413 очок і 23-тє місце в Європі при 18 путівках. Друга: у них
 * до відсічення лише дві події — PGL Masters Bucharest і Retake Season 13, —
 * тож рухатись майже нема де. Усе, що в моделі могло б їх підняти (форма,
 * seedFuture, ЛАН-перемоги), множиться на кількість матчів попереду.
 *
 * Тут рахується пряма крива: скільки очок — стільки відсотків. Далі її можна
 * прикласти до будь-якого сценарію Бухареста.
 *
 * Запуск: node navi-what-if.mjs
 */

const TEAM = "Natus Vincere";
const DELTAS = [-40, -20, 0, 20, 40, 60, 80, 100, 130, 160];

const base = JSON.parse(fs.readFileSync("vrs-live.json", "utf8"));
const rows = base.rows.split(";").map((s) => {
  const [rank, team, pts, reg] = s.split("|");
  return { rank: +rank, team, pts: +pts, reg };
});
const now = rows.find((r) => r.team === TEAM);
console.log(`${TEAM}: ${now.pts} очок, глобально #${now.rank}\n`);
console.log("приріст   очки   місце в Європі   шанс на інвайт");

for (const d of DELTAS) {
  const moved = rows
    .map((r) => (r.team === TEAM ? { ...r, pts: r.pts + d } : r))
    .sort((a, b) => b.pts - a.pts);
  const file = `vrs-navi-${d}.json`;
  fs.writeFileSync(file, JSON.stringify({
    ...base,
    rows: moved.map((r, i) => `${i + 1}|${r.team}|${r.pts}|${r.reg}`).join(";"),
  }));
  const out = `final15-navi-${d}.json`;
  execFileSync(process.execPath, ["final15.mjs"], {
    env: { ...process.env, SEED_SCALE: "0.35", NOISE_SCALE: "0.45", VRS_FILE: file, OUT_FILE: out },
    stdio: "ignore",
  });
  const F = JSON.parse(fs.readFileSync(out, "utf8"));
  const t = F.regions.europe.find((x) => x.team === TEAM);
  const place = F.regions.europe.slice().sort((a, b) => b.pQual - a.pQual)
    .findIndex((x) => x.team === TEAM) + 1;
  console.log(
    `${(d >= 0 ? "+" : "") + d}`.padEnd(10) +
    String(now.pts + d).padEnd(7) +
    String(place).padEnd(17) +
    `${(100 * t.pQual).toFixed(1)}%`,
  );
  fs.rmSync(file, { force: true });
}
