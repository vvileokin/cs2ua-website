import fs from "node:fs";

/**
 * Календар тир-2, зібраний із LAN-таблиці дентена.
 *
 * Знімок береться найсвіжіший із наявних, а не прибитий цвяхом. До 20 жовтня
 * тут стояв файл за 2 жовтня, і це був найгірший різновид помилки — тихий:
 * реєстрації я оновлював щодня, тож склади подій були свіжі, а сам перелік
 * подій застиг. Через це модель не бачила MESA Pro Series Halloween Edition і
 * ROG Journey Winter, зате три тижні рахувала Station Strike, який із книги
 * прибрали. Азія від цього ставала надто впевненою: коли в команди попереду
 * немає подій, її місце нікуди не рухається, і відсотки розповзаються до країв.
 *
 * Тільки LAN. Онлайн-ліги — CCT, ESEA, ESL Challenger League, NODWIN, CROSSFIRE —
 * у таблиці дентена їх нема, і в моделі їх теж нема: там грає не те коло
 * команд, про яке ця модель.
 *
 * Ваги — власна колонка «Tournament Weight» із таблиці. Де її нема (призовий ще
 * не оголошений), вага інтерполюється по кривій, яку описують решта рядків.
 */
const SNAP = process.env.DENT_SNAPSHOT ?? (() => {
  const here = new URL("./", import.meta.url);
  const files = fs.readdirSync(here).filter((f) => /^dent-tournaments-\d{4}\.json$/.test(f));
  if (!files.length) throw new Error("немає жодного dent-tournaments-*.json");
  /* Назви мають вигляд dent-tournaments-DDMM.json, тож сортуємо за датою, а не
     за рядком: 0210 — це 2 жовтня, 2010 — двадцяте, і лексикографічно вони
     стають у зворотному порядку. */
  const key = (f) => { const d = f.match(/(\d{2})(\d{2})/); return d[2] + d[1]; };
  return files.sort((a, b) => key(a).localeCompare(key(b))).at(-1);
})();
const RAW = JSON.parse(fs.readFileSync(new URL("./" + SNAP, import.meta.url), "utf8"));
if (process.env.DENT_VERBOSE === "1") console.error(`[lans] календар зі знімка ${SNAP}`);

/** Де грається — звідти й регіон. */
const REGION = {
  Uzbekistan: "asia", China: "asia", Australia: "asia",
  Mongolia: "asia", Japan: "asia", India: "asia",
  Brazil: "americas", USA: "americas", Argentina: "americas", Canada: "americas",
  Chile: "americas", Mexico: "americas",
  Portugal: "europe", Russia: "europe", Poland: "europe", Sweden: "europe",
  Serbia: "europe", Spain: "europe", Latvia: "europe", Romania: "europe",
  Finland: "europe", UK: "europe", France: "europe", "Czech Republic": "europe",
  Germany: "europe", Denmark: "europe", Netherlands: "europe", Switzerland: "europe",
  Hungary: "europe", Kazakhstan: "europe", Bulgaria: "europe", Lithuania: "europe", Estonia: "europe",
};

const RU_HOST = new Set(["Russia"]);

const MONTH = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
                July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };

const iso = (mm, dd) => `${mm <= 2 ? 2027 : 2026}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

/** «October 29 - November 1» → початок і кінець. «October 7-10» — те саме. */
const datesOf = (s) => {
  const str = String(s);
  const a = str.match(/([A-Z][a-z]+)\s+(\d+)/);
  if (!a) return null;
  const m1 = MONTH[a[1]];
  if (!m1) return null;
  const begin = iso(m1, +a[2]);
  const b = str.slice(a.index + a[0].length).match(/([A-Z][a-z]+)\s+(\d+)|[-–—]\s*(\d+)/);
  let end = begin;
  if (b) end = b[1] ? iso(MONTH[b[1]] ?? m1, +b[2]) : iso(m1, +b[3]);
  return { begin, end };
};

/**
 * Призовий у доларах: «up to €12 000,00», «100000», «up to zł 15 000,0».
 *
 * Валюту доводиться читати: польські злоті в доларах — це вчетверо менше, і
 * без перерахунку BaseStack League виходив найважчим турніром жовтня після
 * Москви, хоча там призовий близько чотирьох тисяч доларів.
 */
const FX = { "€": 1.17, "£": 1.34, "zł": 0.27, "R$": 0.19, "$": 1 };
const prizeOf = (s) => {
  const raw = String(s);
  const str = raw.replace(/\s| |‎/g, "");
  if (!str) return 0;
  const m = str.match(/(\d[\d.,]*)/);
  if (!m) return 0;
  let n = m[1];
  if (/,\d{1,2}$/.test(n)) n = n.replace(/\./g, "").replace(",", ".");
  else n = n.replace(/,/g, "");
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  const cur = Object.keys(FX).find((c) => str.includes(c)) ?? "$";
  return Math.round(v * FX[cur]);
};

const CURVE = [[3_391, 0.288], [10_990, 0.338], [13_937, 0.350], [40_000, 0.417],
               [100_000, 0.500], [173_352, 0.568]];
const weightOf = (prize) => {
  if (!prize) return 0.33;
  const x = Math.log10(prize);
  const p = CURVE.map(([a, b]) => [Math.log10(a), b]);
  if (x <= p[0][0]) return p[0][1];
  if (x >= p.at(-1)[0]) return p.at(-1)[1];
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1];
    if (x <= x1) return Math.round((y0 + (y1 - y0) * (x - x0) / (x1 - x0)) * 1000) / 1000;
  }
  return p.at(-1)[1];
};

/** Розмір сітки зі сторінок HLTV; де не вказано — звичайні шістнадцять. */
const SLOTS = {
  "Roman Imperium Cup IX": 16, "MESA Pro Series Fall": 6, "FRAG University": 16,
  "ANZC Locals Spring 2026": 8, "Stake Pulse Beat 3": 16, "Elisa Breakout 2": 8,
  "Logitech G PRO Series": 8, "Private Club 2": 8, "DraculaN 7": 24, "CIS LAN 9": 16,
  "VOID Autumn Cup": 8, "Circuit X Curitiba 4": 16, "Hotspawn Showdown": 4,
  "Tesla Cup 2026": 8, "Stake Ranked Episode 5": 8, "Stake Ranked Episode 4": 8,
  "DFRAG Invitational": 8, "Retake Season 13": 16, "FiReLEAGUE Last Chance": 16,
  "Gamers Club Masters": 8, "Moscow Cyber Games": 4, "CyberClash S2": 8,
  "FOX Legacy Cup 1": 16, "CIS LAN 8": 8, "ROG Journey Autumn 2026": 16,
  "ESN Fall Showdown 2026": 16, "SwitzerLAN 2026": 16, "Station Strike 2026": 16,
  "EPIC.LAN 49": 16, "NSTLGA Texas Open": 16, "BaseStack League 1": 16,
  "eXTREMESLAND 2026 Mongolia CQ": 16, "Urban Riga Open 7": 16, "FRAG Season 18": 16,
};

/** Турніри, куди запрошують за рейтингом, а не тільки через відбір. */
const INVITE = {
  "Stake Ranked Episode 4": "global", "Stake Ranked Episode 5": "global",
  "Stake Ranked Episode 6": "global", "Private Club 2": "global",
  "Moscow Cyber Games": "europe", "Hotspawn Showdown": "europe",
  "CyberClash S2": "europe", "Gamers Club Masters": "americas",
  "DFRAG Invitational": "asia",
};

export const CUTOFF = "2026-11-02";
export const AS_OF = "2026-10-02";

export const LANS = [];
for (const row of RAW) {
  const c = row.cells;
  if (!c || !c[1] || !c[1].v) continue;
  const name = c[1].v.trim();
  if (/RANKING CUT-OFF/i.test(name) || name.startsWith("If you are a TO") ||
      name === "Tournament Info" || name === "Tournament") continue;
  const d = datesOf(c[2]?.v ?? "");
  if (!d) continue;
  const prize = prizeOf(c[3]?.v ?? "");
  const country = (c[4]?.v ?? "").trim();
  const region = REGION[country] ?? "europe";
  const w = c[10]?.v ? Number(c[10].v) : null;
  LANS.push({
    name, begin: d.begin, end: d.end, prize, country, city: (c[5]?.v ?? "").trim(), region,
    ru: RU_HOST.has(country),
    weight: w && Number.isFinite(w) ? Math.round(w * 1000) / 1000 : weightOf(prize),
    slots: SLOTS[name] ?? 16,
    invite: INVITE[name] ?? "open",
  });
}

/** Усе, що ще не дограно і завершиться до запрошень. */
export const TIER2 = LANS.filter((e) => e.end > AS_OF && e.begin < CUTOFF)
                         .sort((a, b) => b.weight - a.weight);

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  console.log(`у таблиці LAN-ів: ${LANS.length} · попереду до ${CUTOFF}: ${TIER2.length}\n`);
  const by = {};
  for (const e of TIER2) by[e.region] = (by[e.region] ?? 0) + 1;
  console.log("за регіонами: " + JSON.stringify(by) + "\n");
  console.log("  " + "турнір".padEnd(30) + "дати".padEnd(24) + "призовий".padStart(10) +
              "вага".padStart(7) + " міс.".padStart(6) + "  регіон");
  for (const e of TIER2)
    console.log("  " + e.name.slice(0, 28).padEnd(30) + `${e.begin}..${e.end}`.padEnd(24) +
      (e.prize ? "$" + e.prize.toLocaleString("en-US") : "—").padStart(10) +
      e.weight.toFixed(3).padStart(7) + String(e.slots).padStart(6) + "  " + e.region +
      (e.ru ? " RU" : "") + (e.invite !== "open" ? `  invite:${e.invite}` : "") + "  " + e.country);
}
