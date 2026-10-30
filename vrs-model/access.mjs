/**
 * Хто справді може приїхати.
 *
 * Три правила, зняті з того, як цей цикл поводиться насправді:
 *
 *   подія в Росії, російський або СНД-склад     → звичайний шанс
 *   подія в Росії, український склад            → нуль, завжди
 *   подія в Росії, будь-хто інший               → не більше 10%
 *
 * Українське правило — це не «мала ймовірність». Ці команди туди не їдуть,
 * тож турнір не дає їм нічого і не має усереднюватись так, ніби міг би.
 *
 * Окремо — серія 1win. Private Club грається в Белграді, тобто прапор країни
 * його не ловить, а склад там той самий. Тому для українських команд серія
 * відсікається за назвою, а не за країною: саме на цьому модель раніше дала
 * B8 і NAVI Junior по 6% у Private Club.
 */

/** Події на російській землі або від російських організаторів. */
export const RU_EVENTS = [
  "Moscow Cyber Games", "GLuck Moscow Cyber Games 2026",
  "WINLINE CIS LAN 7", "WINLINE CIS LAN 8", "WINLINE CIS LAN 9",
  "CIS LAN 7", "CIS LAN 8", "CIS LAN 9",
];

/* Private Club грається в Белграді, і склад там не тільки СНД: у другому
   сезоні заявлені The MongolZ з Азії та Liquid з Америки. Тому він не в
   списку вище — інакше модель відмовила б їм у турнірі, куди їх уже
   запросили. Для українських команд його ловить правило нижче. */

/** Серія 1win: ловиться за назвою, бо грається не в Росії. */
const ONE_WIN = /private club|1win/i;

/** Українські склади — нуль участі в подіях вище. */
export const UA_TEAMS = [
  "Natus Vincere", "B8", "NAVI Junior", "Natus Vincere Junior", "Passion UA", "Monte",
  "B8 Academy", "Aurora Young Blud",
];

/** Російські, білоруські та інші СНД-склади — природне поле тих подій. */
export const CIS_TEAMS = [
  "Spirit", "BETBOOM", "BetBoom", "Virtus.pro", "PARIVISION", "1win", "Nuclear TigeRES",
  "FORZE Reload", "CYBERSHOKE", "Nemiga", "ex-RUSTEC", "K27", "Young TigeRES",
  "VP.Prodigy", "ex-VP.Prodigy", "Spirit Academy", "UPGRADE", "PRIVATE", "WW",
  "Nemesis", "BAKS", "ex-RUBY", "Black Phoenix", "DEPO", "Rune Eaters",
];

const nrm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const RU = new Set(RU_EVENTS.map(nrm));
const UA = new Set(UA_TEAMS.map(nrm));
const CIS = new Set(CIS_TEAMS.map(nrm));

export const isRuEvent = name => RU.has(nrm(name));
export const nationOf = team => UA.has(nrm(team)) ? "ua" : CIS.has(nrm(team)) ? "cis" : "other";

/**
 * Множник на шанс команди опинитися в полі відкритого LAN.
 * Для подій без обмежень повертає 1.
 */
export const accessFactor = (team, ev, teamRegion) => {
  if (ONE_WIN.test(ev.name) && nationOf(team) === "ua") return 0;
  if (ev.ru || isRuEvent(ev.name)) {
    if (teamRegion !== "europe") return 0;        // не їдуть узагалі
    const n = nationOf(team);
    return n === "cis" ? 1 : n === "ua" ? 0 : 0.10;
  }
  if (ev.global) return 1;                        // відкрито для всіх регіонів
  if (!ev.region || !teamRegion) return 1;
  if (ev.region === teamRegion) return 1;
  return 0.15;                                    // міжрегіональні виїзди рідкісні
};

/** Маленька сітка — менше місць, менший шанс у неї потрапити. */
export const fieldFactor = ev => Math.min(1, (ev.slots ?? 16) / 12);
