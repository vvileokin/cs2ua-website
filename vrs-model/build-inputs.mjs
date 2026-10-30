import fs from "node:fs";
/**
 * Збирає вхідні дані моделі станом на 13 вересня з найсвіжіших шматків журналу.
 * Кожен список підписаний номером рядка журналу, з якого він узятий.
 */
const SP = "C:/Users/LNU/AppData/Local/Temp/claude/C--Users-LNU-Downloads-cs2-ua/2c786582-0939-414a-a921-6d1989e36ca5/scratchpad";
const OUT = `${SP}/cand-inputs`;
const W = `${OUT}/.regen`;
fs.mkdirSync(W, { recursive: true });

/* Знімок рейтингу 12 вересня — ним востаннє рахувався parse-reg (журнал #28141). */
fs.writeFileSync(`${W}/vrs-live-1209.json`, JSON.stringify({
  asOf: "2026-09-12", source: "hltv.org/valve-ranking/teams",
  rows: fs.readFileSync(`${SP}/restore/vrs-rows-1209.txt`, "utf8").trim(),
}, null, 1));
process.env.VRS_FILE = "vrs-live-1209.json";
for (const f of ["vrs.mjs", "team-names.mjs", "gen-fields.mjs"]) fs.copyFileSync(`${SP}/restore/${f}`, `${W}/${f}`);
const { RANK_OF } = await import(`file:///${W}/team-names.mjs`);

/* --------------------------------------------------------------- slots.json */
/* Квадратики в колонці «Confirmed Teams», вивід slots.mjs — журнал #27816. */
const slots = {
  "Roman Imperium Cup VIII": 16, "Circuit x Curitiba 3": 16, "Retake Season 12": 16,
  "Leon Masters Season 1": 16, "FOX Legacy Cup 1": 16, "Roman Imperium Cup IX": 16,
  "Retake Season 13": 16,
};

/* -------------------------------------------------------- ferjee-teams.json */
/* CSV анкети FERJEE, вивід — журнал #25993 (15 заявок, 14 унікальних). */
const ferjeeRaw = ["Gamdom Imperial", "Galorys", "Galorys", "Meia noite ", "paiN Gaming",
  "Turma do Pagode", "Vivo Keyd Stars", "Yawara", "TEAM ZERO DANO", "PELADONA",
  "Borracheiros", "Bounty Hunters", "Seleça do BT", "ODDIK", "Galáticos"];
const ferjee = [...new Set(ferjeeRaw)];

/* --------------------------------------------------------- fields-page.json */
/* Склади зі сторінок турнірів. Ключі в тому порядку, в якому їх додавали:
   сім із #26127, потім DraculaN 7 і CIS LAN 7 (#28000), Retake Season 12
   (#28015) і UKIC (#28192). Значення — останній стан кожного ключа. */
const page = {
  "Gamers Club Masters": { tbd: 4, teams: ["Legacy", "FURIA", "9z", "MIBR"] },
  "Logitech G Connect": { tbd: 0, teams: ["B8", "Metizport", "Ninjas in Pyjamas", "M80", "GamerLegion", "Luminosity", "Inner Circle", "BBL", "3DMAX", "EYEBALLERS", "Liquid", "INFINITE"] },
  "Moscow Cyber Games": { tbd: 0, teams: ["HOTU", "1win", "Alter Ego", "5star"] },
  "Private Club 1": { tbd: 0, teams: ["magic", "GamerLegion", "3DMAX", "Ninjas in Pyjamas", "K27", "EYEBALLERS", "SINNERS", "Alliance"] },
  "Stake Ranked Episode 4": { tbd: 0, teams: ["FaZe", "Astralis", "B8", "BIG", "Luminosity", "fnatic", "Nemiga", "Alliance"] },
  "iBUYPOWER Masters FML": { tbd: 0, teams: ["Liquid", "M80", "DENDELE", "Wildcard", "NRG", "BESTIA", "Voca", "Chicken Coop"] },
  "Stake Pulse Beat 2": { tbd: 0, teams: ["Astralis", "HEROIC", "JiJieHao", "100 Thieves", "fnatic", "FOKUS", "Betclic", "Eternal Fire", "Sashi", "Johnny Speeds", "Phantom", "BBL", "Virtus.pro", "EAC", "ASTRAL", "Sangal"] },
  "DraculaN 7": { tbd: 0, teams: ["3DMAX", "Liquid", "HEROIC", "M80", "Luminosity", "FOKUS", "Eternal Fire", "BC.Game", "Alliance", "Iberian Soul", "INFINITE", "BBL", "WBT", "9INE", "SAW", "BASEMENT BOYS", "Leo", "LP", "HYPERSPIRIT", "Nexus", "MOUZ NXT", "Drama", "Nordic Partners", "aimclub"] },
  "CIS LAN 7": { tbd: 0, teams: ["Nemesis", "Nuclear TigeRES", "Nemiga", "INOX Division", "Butterfly", "ex-RUBY", "Black Phoenix", "WW", "BET-M", "FORZE Reload", "CYBERSHOKE", "BAKS", "UPGRADE", "DOORDOM", "Young27", "HyperSpace"] },
  "Retake Season 12": { tbd: 0, teams: ["Eternal Fire", "GenOne", "WBT", "LP", "SAW Youngsters", "MAYBE", "BERG", "7o7", "Nice Try", "FaZe Up Next", "WIMOK", "RBLS", "Giant Pandas", "REVENIX", "GBC", "Famalicão"] },
  "UKIC Masters Fall 2026 Finals": { tbd: 0, teams: ["The Last Resort", "Ryvex"] },
};

/* ----------------------------------------------------------- reg-teams.json */
/* Склади з реєстраційних таблиць: списки з прогону 10 вересня (#25921) плюс
   зміни 12 вересня (#27816) і 13 вересня (#28149). «Jam» став «WBT» —
   псевдонім додали 12 вересня (#27889), і саме ці чотири турніри з ним у
   списку журнал і називає (#27897). */
const base = {
  /* ПРОГАЛИНА: фінальний прогін цього турніру обрізало `tail -44` (#25920).
     Вісім назв узято з проміжного прогону #25903, де їх теж вісім; у #25867
     їх було сім (без STATE). Яку саме заявку відсіяв строгіший список
     статусів — у журналі не видно, але кількість рейтингових не змінилась. */
  "Roman Imperium Cup VIII": { rows: 36, dropped: 20, teams: ["M80", "Luminosity", "WBT", "Iberian Soul", "STATE", "6666", "MAYBE", "MTX"] },
  "CIS LAN 7": { rows: 40, dropped: 24, teams: ["Nuclear TigeRES", "Nemiga", "Nemesis", "INOX Division", "ex-RUBY", "WW", "Butterfly", "CYBERSHOKE", "UPGRADE", "BET-M", "Black Phoenix", "BAKS", "FORZE Reload"] },
  "Circuit x Curitiba 3": { rows: 38, dropped: 25, teams: ["paiN", "Fluxo", "Galorys", "BESTIA", "ShindeN", "Bounty Hunters", "ALKA", "Yawara", "Peladona", "Turma do Pagode"] },
  "Retake Season 12": { rows: 30, dropped: 14, teams: ["WBT", "GenOne", "Eternal Fire", "LP", "RBLS", "BERG", "SAW Youngsters", "MAYBE", "Famalicão"] },
  "Stake Pulse Beat 2": { rows: 46, dropped: 32, teams: ["Astralis", "HEROIC", "JiJieHao", "fnatic", "100 Thieves", "Betclic", "Virtus.pro", "Sashi", "Eternal Fire", "Phantom", "ASTRAL", "EAC", "Johnny Speeds", "Sangal"] },
  "Leon Masters Season 1": { rows: 48, dropped: 34, teams: ["INFINITE", "GenOne", "Fluxo", "BASEMENT BOYS", "RBLS", "MOUZ NXT", "Famalicão"] },
  "Urban Riga Open 7": { rows: 23, dropped: 3, teams: ["UNiTY", "ENCE", "HYPERSPIRIT", "Sangal", "A Great Chaos", "KUUSAMO", "GamersLab", "MTX", "Aimhaus", "PURE"] },
  "FOX Legacy Cup 1": { rows: 27, dropped: 16, teams: ["INFINITE", "UNiTY", "SINQU", "Falcons Force", "aimclub", "Famalicão", "PURE", "Natus Vincere Junior", "Lazer Cats"] },
  "ROG Journey Autumn 2026": { rows: 35, dropped: 17, teams: [] },
  "Roman Imperium Cup IX": { rows: 40, dropped: 24, teams: ["INFINITE", "WBT", "OG", "G2 Ares", "RBLS", "SINQU", "Falcons Force", "Sangal", "Famalicão", "PURE", "Natus Vincere Junior", "Lazer Cats"] },
  "Stake Pulse Beat 3": { rows: 45, dropped: 31, teams: ["MIBR", "Alliance", "B8", "Astralis", "Inner Circle", "Liquid", "HEROIC", "HOTU", "100 Thieves", "JiJieHao", "fnatic", "Betclic", "Ninjas in Pyjamas", "3DMAX"] },
  "Elisa Breakout 2": { rows: 25, dropped: 25, teams: [] },
  "DraculaN 7": { rows: 44, dropped: 20, teams: ["Alliance", "Liquid", "HEROIC", "3DMAX", "BC.Game", "M80", "Luminosity", "FOKUS", "INFINITE", "WBT", "Iberian Soul", "Eternal Fire", "9INE", "BASEMENT BOYS", "Nexus", "LP", "Leo", "Nordic Partners", "HYPERSPIRIT", "MOUZ NXT", "aimclub", "Drama"] },
  "Station Strike 2026": { rows: 8, dropped: 2, teams: ["BASEMENT BOYS"] },
  "Retake Season 13": { rows: 2, dropped: 1, teams: [] },
  "NSTLGA Texas Open": { rows: 7, dropped: 0, teams: ["regain"] },
};
const reg = {};
for (const [name, v] of Object.entries(base)) {
  const teams = [...new Set(v.teams)].sort((a, b) => (RANK_OF.get(a) ?? 999) - (RANK_OF.get(b) ?? 999));
  /* parse-reg не зміг прочитати колонку розміру сітки (регулярка
     /confirmeds*teams/ без \s), тож у файлі завжди slots: null, tbd: 0 —
     підтверджено виводом #25955 («місць ?»). Розмір живе у slots.json. */
  reg[name] = { accepted: v.rows - v.dropped, slots: null, tbd: 0, teams };
}

fs.writeFileSync(`${OUT}/slots.json`, JSON.stringify(slots, null, 1));
fs.writeFileSync(`${OUT}/ferjee-teams.json`, JSON.stringify(ferjee, null, 1));
fs.writeFileSync(`${OUT}/fields-page.json`, JSON.stringify(page, null, 1));
fs.writeFileSync(`${OUT}/reg-teams.json`, JSON.stringify(reg, null, 1));

/* ------------------------------------------------- перевірки проти журналу */
const expectAccepted = { "Roman Imperium Cup VIII": 16, "CIS LAN 7": 16, "Circuit x Curitiba 3": 13,
  "Retake Season 12": 16, "Stake Pulse Beat 2": 14, "Leon Masters Season 1": 14, "Urban Riga Open 7": 20,
  "FOX Legacy Cup 1": 11, "ROG Journey Autumn 2026": 18, "Roman Imperium Cup IX": 16,
  "Stake Pulse Beat 3": 14, "Elisa Breakout 2": 0, "DraculaN 7": 24, "Station Strike 2026": 6,
  "Retake Season 13": 1, "NSTLGA Texas Open": 7 };
let bad = 0;
for (const [k, v] of Object.entries(expectAccepted))
  if (reg[k].accepted !== v) { console.log(`!! ${k}: accepted ${reg[k].accepted} != ${v}`); bad++; }
const spb3 = "MIBR, Alliance, B8, Astralis, Inner Circle, Liquid, HEROIC, HOTU, 100 Thieves, JiJieHao, fnatic, Betclic, Ninjas in Pyjamas, 3DMAX";
const got = reg["Stake Pulse Beat 3"].teams.join(", ");
console.log(got === spb3 ? "порядок Stake Pulse Beat 3 збігається з #27897 OK" : `!! порядок SPB3:\n   маємо:  ${got}\n   журнал: ${spb3}`);
console.log(`accepted: ${bad ? bad + " розбіжностей" : "усі 16 збігаються OK"}`);
console.log(`ferjee-teams.json: ${ferjee.length} унікальних · fields-page.json: ${Object.keys(page).length} ключів · reg-teams.json: ${Object.keys(reg).length} ключів`);
