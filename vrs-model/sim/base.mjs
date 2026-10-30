import fs from "node:fs";
import { createRequire } from "node:module";

/**
 * Базовий прогін двигуна Valve і підготовка швидкого зрізу даних.
 *
 * Повний файл матчів — 52 МБ, і більшу частину трьох секунд прогону займає його
 * розбір. Рейтинг рахується по вікну в шість місяців, тож усе, що старше,
 * можна викинути один раз і далі ганяти симуляції по обрізаному файлу.
 */
const require = createRequire("C:/Users/LNU/Downloads/vrs-model/openvrs/model/");
const Ranking = require("C:/Users/LNU/Downloads/vrs-model/openvrs/model/ranking.js");

const FULL = "C:/Users/LNU/Downloads/vrs-model/openvrs/data/matchdata_sample_20260909.json";
const TRIM = "C:/Users/LNU/Downloads/vrs-model/sim/matchdata-trim.json";
export const CUTOFF_TS = Math.floor(Date.UTC(2026, 10, 2) / 1000);   // 2 листопада
const WINDOW = 6 * 30 * 24 * 3600;

export function makeTrim() {
  const raw = JSON.parse(fs.readFileSync(FULL, "utf8"));
  const from = CUTOFF_TS - WINDOW - 7 * 24 * 3600;
  const matches = raw.matches.filter((m) => m.matchStartTime >= from);
  const keep = new Set(matches.map((m) => m.eventId));
  const events = raw.events.filter((e) => keep.has(e.eventId));
  fs.writeFileSync(TRIM, JSON.stringify({ matches, events }));
  const mb = (n) => (n / 1048576).toFixed(1) + " МБ";
  console.log(`обрізано: матчів ${raw.matches.length} → ${matches.length}, подій ${raw.events.length} → ${events.length}`);
  console.log(`файл: ${mb(fs.statSync(FULL).size)} → ${mb(fs.statSync(TRIM).size)}`);
  return { matches: matches.length, events: events.length };
}

/** Один прогін двигуна. addMatches/addEvents — домальовані майбутні події. */
export function rank({ addMatches = [], addEvents = [], at = CUTOFF_TS, file = TRIM } = {}) {
  /* Порядок аргументів у двигуні: (час, файл, бд, сталі, matchItem,
     globalMatches, partialEvents, maxLimit, addMatches, addEvents). Пропустити
     один undefined означає віддати список подій туди, де чекають матчі. */
  const [, teams] = Ranking.generateRanking(
    at, file, false, undefined, undefined, undefined, undefined, undefined, addMatches, addEvents);
  const out = new Map();
  for (const t of teams) out.set(t.teamId ?? t.id ?? t.name, t);
  return { teams, byId: out };
}

if (process.argv[1]?.endsWith("base.mjs")) {
  if (!fs.existsSync(TRIM) || process.argv.includes("--rebuild")) makeTrim();
  const t0 = Date.now();
  const { teams } = rank();
  console.log(`прогін: ${((Date.now() - t0) / 1000).toFixed(1)} с · команд у таблиці: ${teams.length}`);
  console.log("поля команди:", Object.keys(teams[0]).slice(0, 18).join(", "));
  const top = teams.slice(0, 12).map((t) => `${t.rankGlobal ?? ""} ${t.name ?? t.teamId} ${Math.round(t.rankValue)}`);
  console.log("топ-12 на 2 листопада (дані по 6 вересня):\n  " + top.join("\n  "));
}
