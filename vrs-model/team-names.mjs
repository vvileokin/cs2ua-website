/**
 * Одне місце, де рядок із чужої таблиці перетворюється на назву з рейтингу.
 *
 * Раніше цим займався парсер реєстрацій, а складачі складів мали власні
 * шматки тієї ж логіки — і FERJEE поїхав у модель із «paiN Gaming», якого
 * жоден пошук не знаходить. Один матчер на всіх, або тихі розбіжності.
 */
import { LIVE } from "./vrs.mjs";

export const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, "");

/* Перше входження, а не останнє: список іде за спаданням рейтингу, і десятки
   назв у ньому належать двом різним командам. Побудований звичайним способом —
   Map з усього списку — виграє останній, і «Ninjas in Pyjamas» дістають
   рейтинг своєї академії. Цей збіг бив по проєкту вже шість разів. */
export const RANKED = new Map(), RANK_OF = new Map();
LIVE.forEach((t, i) => {
  const k = norm(t.team);
  if (!RANKED.has(k)) { RANKED.set(k, t.team); RANK_OF.set(t.team, i + 1); }
});

const ALIAS = {
  navi: "Natus Vincere", nip: "Ninjas in Pyjamas", vp: "Virtus.pro", virtuspro: "Virtus.pro",
  themongolz: "The MongolZ", paingaming: "paiN", pain: "paiN", imperialesports: "Imperial",
  fluxogaming: "Fluxo", betboomteam: "BetBoom", nemigagaming: "Nemiga", futesports: "FUT",
  teamspirit: "Spirit", teamvitality: "Vitality", teamliquid: "Liquid", "9zteam": "9z",
  auroragaming: "Aurora", icesports: "Inner Circle", ef: "Eternal Fire", onewin: "1win",
  nuclearteres: "Nuclear TigeRES", basementboys: "BASEMENT BOYS", bcgame: "BC.Game",
  thunderdownunder: "Thunder", navijunior: "Natus Vincere Junior", mouznxt: "MOUZ NXT",
  falconsforce: "Falcons Force", sawyoungsters: "SAW Youngsters", g2ares: "G2 Ares",
  exruby: "ex-RUBY", forzereload: "FORZE Reload", vivokeydstars: "Keyd Stars",
  keydstars: "Keyd Stars", gamdomimperial: "Imperial", meianoite: "Meia Noite",
  /* HLTV перейменував склад Jam на WBT ще 12 вересня; у реєстраціях
     організаторів він досі Jam. Це та сама команда. */
  jam: "WBT",
  /* BBL виступають як ECHO. */
  echo: "BBL", echobbl: "BBL",
  bountyhuntes: "Bounty Hunters", icacademy: "Inner Circle Academy",
  /* LP зникли з таблиці 23 жовтня, і того ж дня в Америці зʼявились BARCA з
     1093 очками проти 1101 у LP — той самий регіон, та сама смуга, нікого
     іншого поруч. Підтверджує календар: LP стояли в реєстрації Circuit X
     Curitiba 4, а грали там BARCA. Реєстрації організаторів досі пишуть LP. */
  lp: "BARCA",
};

/* Приставки, які команда чіпляє до назви, не змінюючи складу: спонсор або
   слово-заповнювач. Знімати можна тільки їх. Спокуса зрізати будь-яке останнє
   слово велика і хибна — тоді «B8 Academy» стає B8, а «SAW Youngsters» стає
   SAW, тобто дві різні команди зливаються в одну. */
const FILLER = new Set(["esports", "esport", "e-sports", "gaming", "team", "gg", "cs2", "cs",
  "roobet", "apogee", "pusulabet", "1xbet", "lottu", "dexsport", "fc", "vivo", "gamdom",
  "clan", "epicbet"]);

export const lookup = (s) => {
  const k = norm(s);
  if (!k || k.length < 2) return null;
  if (ALIAS[k]) return ALIAS[k];
  const exact = RANKED.get(k);
  if (exact) return exact;
  const tok = String(s).split(/[\s.]+/).filter(Boolean);
  for (let a = 0; a < tok.length; a++)
    for (let b = tok.length; b > a; b--) {
      if (a === 0 && b === tok.length) continue;
      const dropped = [...tok.slice(0, a), ...tok.slice(b)];
      if (!dropped.length || !dropped.every((d) => FILLER.has(d.toLowerCase()) || /^\d+$/.test(d))) continue;
      const kk = norm(tok.slice(a, b).join(" "));
      if (kk.length >= 2 && (RANKED.has(kk) || ALIAS[kk])) return ALIAS[kk] ?? RANKED.get(kk);
    }
  return null;
};
