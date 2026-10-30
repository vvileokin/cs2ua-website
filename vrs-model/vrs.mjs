import fs from "node:fs";

/**
 * Valve Regional Standings — the table the Major invitations actually come from.
 *
 * Worth being precise about the name, because two different rankings live on the
 * same site. HLTV's own world ranking is HLTV's opinion and decides nothing.
 * This is VRS: Valve's model, Valve's numbers, and the only table that hands out
 * the thirty-two Major seats. HLTV is simply where it is computed continuously
 * rather than published once a month, and their table includes prize money
 * already secured in tournaments still running — one of the four seed factors,
 * and one that never shows up in match results.
 *
 * The rows live in vrs-live.json rather than in this file, so refreshing the
 * standings is a data edit, not a code edit. Re-scrape from
 * hltv.org/valve-ranking/teams (the page blocks plain fetch; use a browser).
 */
/* Which snapshot, so a scenario can be run against the same code without
   touching the verified one: VRS_FILE=vrs-live-eod.json node final15.mjs */
const SNAPSHOT = process.env.VRS_FILE ?? "vrs-live.json";
const RAW = JSON.parse(fs.readFileSync(new URL("./" + SNAPSHOT, import.meta.url), "utf8"));
const REGION = { EU: "europe", AM: "americas", AS: "asia" };

/**
 * Кого Valve не запросить, хоч би скільки очок вони набрали.
 *
 * Правило: команда не може отримати запрошення на мейджор, якщо протягом
 * останніх трьох місяців вона стояла в рейтингу іншого регіону. Воно закриває
 * переїзд у слабший регіон під саме відсічення.
 *
 * BC.Game під нього спершу потрапили, але Valve розсудили інакше: у списку
 * змін до Singapore 2026 Major стоїть окремим рядком, що склад asap, Magisk,
 * mzinho, s1mple, Senzu приписаний до Азії і право на запрошення має. Тож вони
 * повернулись у таблицю, а правило лишилось — із Sashi.
 *
 * Невідповідних саме видаляємо з таблиці, а не позначаємо. Місце, якого команда
 * не може зайняти, не лежить порожнім: воно переходить наступному, і
 * регіональна таблиця змикається за нею. Побічний ефект чесно називаю: разом із
 * рядком команда зникає і зі складів турнірів, тож чужі очікувані очки на тих
 * подіях трохи занижені.
 */
const INELIGIBLE = new Set(["sashi"]);
const plain = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

export const LIVE = RAW.rows.split(";")
  .map(s => {
    const [rank, team, points, reg] = s.split("|");
    return { rank: +rank, team, points: +points, region: REGION[reg] };
  })
  .filter(t => !INELIGIBLE.has(plain(t.team)));

export const AS_OF = RAW.asOf;
export const SOURCE = RAW.source;
export const CUTOFF = "2026-11-02";

/** Confirmed on HLTV's VRS invites page: 32 seats, split 18 / 9 / 5. */
export const SLOTS = {
  europe:   { total: 18, stage3: 6, stage2: 6, stage1: 6 },
  americas: { total:  9, stage3: 2, stage2: 1, stage1: 6 },
  asia:     { total:  5, stage3: 0, stage2: 1, stage1: 4 },
};
