/**
 * Усе, що лишилося зіграти до 2 листопада — із справжніми складами, форматами
 * і розподілом призових.
 *
 * Склади взяті зі сторінок HLTV, де вони опубліковані, і з реєстраційних
 * таблиць у книзі дентена, де ще ні. Онлайн-ліги тут теж є: VRS їх рахує, тож
 * і ми рахуємо.
 *
 * `prizes` — скільки отримує кожне місце (гроші гравцям + клубна частка, бо
 * формула Valve додає обидві). Де призових за місцями нема, береться рівний
 * розподіл: для дрібних турнірів це не має ваги.
 */

/** Місця у звичайній сітці на вісім і шістнадцять — частки призового фонду. */
const SPLIT8 = [0.4, 0.22, 0.12, 0.08, 0.045, 0.045, 0.035, 0.035];
const SPLIT16 = [0.3, 0.17, 0.1, 0.07, 0.045, 0.045, 0.045, 0.045, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02, 0.015, 0.015];
const SPLIT24 = [...SPLIT16.map((x) => x * 0.92), 0.008, 0.008, 0.008, 0.008, 0.006, 0.006, 0.006, 0.006];

const split = (n) => (n <= 8 ? SPLIT8 : n <= 16 ? SPLIT16 : SPLIT24).slice(0, n);

export const EVENTS = [
  /* ---------- тір-1 ---------- */
  { name: "ESL Pro League Season 24", begin: "2026-10-03", end: "2026-10-11", lan: true, prize: 1_000_000,
    format: "swiss16", teams: ["Spirit", "Vitality", "FURIA", "MOUZ", "Falcons", "Legacy", "G2", "Aurora",
      "Natus Vincere", "BETBOOM", "9z", "PARIVISION", "M80", "TYLOO", "1win", "ShindeN"] },

  { name: "Thunderpick World Championship", begin: "2026-10-14", end: "2026-10-18", lan: true, prize: 1_000_000,
    format: "gsl8", teams: ["FURIA", "Falcons", "Legacy", "Aurora", "BETBOOM", "9z", "PARIVISION", "Virtus.pro"] },

  { name: "PGL Masters Bucharest", begin: "2026-10-24", end: "2026-10-31", lan: true, prize: 1_250_000,
    format: "swiss16", teams: ["Spirit", "Vitality", "FURIA", "MOUZ", "Legacy", "FUT", "G2", "Aurora",
      "Natus Vincere", "BETBOOM", "The MongolZ", "9z", "Liquid", "TYLOO", "Nemiga", "DENDELE"] },

  /* ---------- тір-2 LAN, склади опубліковані ---------- */
  { name: "Stake Ranked Episode 4", begin: "2026-10-03", end: "2026-10-04", lan: true, prize: 100_000,
    format: "double8", teams: ["Astralis", "FaZe", "Alliance", "BIG", "Luminosity", "Nemiga", "fnatic"],
    note: "B8 уже вилетіли, тож їх у сітці нема" },

  { name: "Stake Ranked Episode 5", begin: "2026-10-27", end: "2026-10-30", lan: true, prize: 100_000,
    format: "double8", teams: ["Astralis", "MIBR", "B8", "magic", "Inner Circle", "BIG", "Nemesis", "Eternal Fire"] },

  { name: "Private Club 2", begin: "2026-10-19", end: "2026-10-22", lan: true, prize: 100_000,
    format: "double8", teams: ["The MongolZ", "magic", "PARIVISION", "Alliance", "Liquid", "BIG"],
    tbd: 2, tbdPool: "europe" },

  { name: "Stake Pulse Beat 3", begin: "2026-10-12", end: "2026-10-17", lan: true, prize: 80_000,
    format: "swiss16", teams: ["MIBR", "HEROIC", "Astralis", "Liquid", "Inner Circle", "3DMAX", "100 Thieves",
      "Ninjas in Pyjamas", "HOTU", "fnatic", "JiJieHao", "Betclic", "BC.Game", "Sashi"], tbd: 1, tbdPool: "europe" },

  { name: "FiReLEAGUE Last Chance", begin: "2026-10-29", end: "2026-11-01", lan: true, prize: 75_000,
    format: "swiss16", teams: ["GamerLegion", "100 Thieves", "Ninjas in Pyjamas", "DENDELE", "Wildcard", "Fluxo",
      "SAW", "Voca", "Galorys", "BESTIA", "Bounty Hunters", "SportsBetExpert", "LP", "Procyon", "Isurus"] },

  { name: "CIS LAN 9", begin: "2026-10-20", end: "2026-10-23", lan: true, prize: 50_000, ru: true,
    format: "swiss16", teams: ["Nemesis", "1win", "Virtus.pro", "CYBERSHOKE", "UPGRADE", "PRIVATE", "DEPO", "WW"],
    tbd: 8, tbdPool: "cis" },

  { name: "Tesla Cup 2026", begin: "2026-10-27", end: "2026-10-29", lan: true, prize: 50_000,
    format: "double8", teams: ["HEROIC", "Inner Circle", "3DMAX", "100 Thieves", "1win", "EYEBALLERS",
      "BC.Game", "ex-Zero Tenacity", "DEPO", "WW"] },

  { name: "CyberClash S2", begin: "2026-10-29", end: "2026-10-31", lan: true, prize: 47_862,
    format: "double8", teams: [], tbd: 8, tbdPool: "europe" },

  { name: "DraculaN 7", begin: "2026-10-19", end: "2026-10-23", lan: true, prize: 35_000,
    format: "swiss24", teams: ["Luminosity", "HEROIC", "3DMAX", "M80", "Ninjas in Pyjamas", "JiJieHao",
      "Eternal Fire", "SAW", "SINNERS", "BC.Game", "INFINITE", "Iberian Soul", "aimclub", "9INE", "Nexus",
      "BASEMENT BOYS", "Leo", "Nordic Partners", "MOUZ NXT", "Drama", "HYPERSPIRIT"] },

  { name: "Gamers Club Masters", begin: "2026-10-29", end: "2026-11-01", lan: true, prize: 30_000,
    format: "gsl8", teams: [], tbd: 8, tbdPool: "americas" },

  { name: "DFRAG Invitational", begin: "2026-10-26", end: "2026-11-01", lan: true, prize: 27_886,
    format: "gsl8", teams: ["FlyQuest", "Ground Zero", "NEXVOID", "Alter Ego", "Abyssal", "THUNDER dOWNUNDER", "Rooster"] },

  { name: "FRAG University", begin: "2026-10-09", end: "2026-10-11", lan: true, prize: 25_000,
    format: "swiss16", teams: ["DENDELE", "NRG", "Imperial", "Wildcard", "SportsBetExpert", "Without a Roof",
      "Marsborne", "Alter Ego", "Unreal Nightmare"] },

  { name: "Circuit X Curitiba 4", begin: "2026-10-21", end: "2026-10-25", lan: true, prize: 20_000,
    format: "swiss16", teams: ["Imperial", "paiN", "BESTIA", "ShindeN", "Galorys", "LP", "Bounty Hunters"],
    tbd: 8, tbdPool: "americas" },

  { name: "Elisa Breakout 2", begin: "2026-10-15", end: "2026-10-17", lan: true, prize: 16_899,
    format: "gsl8", teams: ["Phantom", "Voca", "EAC", "ENCE", "HAVU"], tbd: 2, tbdPool: "europe" },

  { name: "Retake Season 13", begin: "2026-10-29", end: "2026-11-01", lan: true, prize: 15_000,
    format: "swiss16", teams: ["Luminosity", "Alliance", "SINNERS", "Lynn Vision", "OG", "WBT Academy",
      "SAW Youngsters", "Teletubisie"], tbd: 7, tbdPool: "europe" },

  { name: "Roman Imperium Cup IX", begin: "2026-10-07", end: "2026-10-10", lan: true, prize: 12_000,
    format: "swiss16", teams: ["SAW", "Sangal", "INFINITE", "EAC", "Lazer Cats", "OG", "RBLS", "G2 Ares",
      "Falcons Force", "PURE", "SINQU", "Famalicão", "NAVI Junior"] },

  { name: "VOID Autumn Cup", begin: "2026-10-20", end: "2026-10-24", lan: true, prize: 12_000,
    format: "gsl8", teams: ["Lynn Vision", "NEXVOID", "Rare Atom", "Alter Ego", "Kaleido", "Vitalem Aerem"] },

  { name: "Moscow Cyber Games", begin: "2026-10-31", end: "2026-11-01", lan: true, prize: 181_214, ru: true,
    format: "single4", teams: ["HOTU", "5star", "1win", "Alter Ego"] },

  { name: "Hotspawn Showdown", begin: "2026-10-24", end: "2026-10-25", lan: true, prize: 13_227,
    format: "single4", teams: ["EAC", "BASEMENT BOYS", "G2 Ares", "STATE"] },

  /* ---------- онлайн ---------- */
  { name: "CCT Europe Series 10", begin: "2026-10-03", end: "2026-10-10", lan: false, prize: 25_000,
    format: "swiss24", teams: ["Nemiga", "SINNERS", "Iberian Soul", "Acend", "ex-RUSTEC", "EAC", "Black Phoenix",
      "ex-Zero Tenacity", "Butterfly", "CYBERSHOKE", "Omega", "Leo", "Lavked", "PCIFIC", "Nexus", "Noir Verse",
      "Azuolas", "Walczaki", "BERG", "megoshort", "Enjoy", "Phantom Academy", "MASONIC", "ARCRED"] },

  { name: "CCT Europe Series 11", begin: "2026-10-13", end: "2026-10-25", lan: false, prize: 25_000,
    format: "swiss24", teams: [], tbd: 24, tbdPool: "cct" },

  { name: "NODWIN Clutch Series 13", begin: "2026-10-14", end: "2026-10-27", lan: false, prize: 30_000,
    format: "swiss24", teams: [], tbd: 24, tbdPool: "asia" },

  { name: "CROSSFIRE Season 6", begin: "2026-10-03", end: "2026-10-11", lan: false, prize: 12_000,
    format: "double8", teams: ["Marsborne", "LAG", "Without a Roof", "Overtake Sector", "regain",
      "Iowa Stormboar", "FarmVille", "Beyond Limits", "DETONATE", "Villainous", "NuTorious", "Wanted Goons"] },

  { name: "ESL Challenger League S52 Europe Cup 8", begin: "2026-10-07", end: "2026-10-10", lan: false, prize: 7_000,
    format: "double8", teams: [], tbd: 16, tbdPool: "europe-low" },

  { name: "ESL Challenger League S52 Europe Cup 9", begin: "2026-10-21", end: "2026-10-23", lan: false, prize: 7_000,
    format: "double8", teams: [], tbd: 16, tbdPool: "europe-low" },
];

/** Призові за місцями: частка фонду × (гроші + клубна частка ≈ подвоєння). */
export const prizesFor = (ev, n) => {
  const parts = split(n);
  const sum = parts.reduce((a, b) => a + b, 0);
  return parts.map((p) => Math.round((ev.prize * p) / sum));
};
