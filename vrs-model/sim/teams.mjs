import fs from "node:fs";

/**
 * Зіставлення наших назв команд із тим, як вони звуться в даних двигуна.
 *
 * У матчданих команда позначена ідентифікатором на кшталт «astralis 2020» або
 * «betboom team 2024» — це сторінка Liquipedia з роком складу. Щоб домалювати
 * майбутні матчі, потрібен саме такий ідентифікатор і останній відомий ростер:
 * двигун рахує рейтинг складу, а не назви.
 */
const DATA = process.env.MATCHDATA ?? "C:/Users/LNU/Downloads/vrs-model/openvrs/data/matchdata_sample_20260909.json";
const raw = JSON.parse(fs.readFileSync(DATA, "utf8"));

export const MATCHES = raw.matches;
export const EVENTS = raw.events;

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

/** Остання поява кожної команди в матчах: ідентифікатор, назва, ростер, час. */
const last = new Map();
for (const m of MATCHES) {
  for (const side of [1, 2]) {
    const id = m[`team${side}Id`], name = m[`team${side}Name`], players = m[`team${side}Players`];
    /* Беремо тільки появи з повним складом: двигун відкидає матчі, де гравців
       не п'ятеро, і домальований матч із неповним ростером валить увесь прогін. */
    if (!id || !Array.isArray(players) || players.length !== 5) continue;
    const cur = last.get(id);
    if (!cur || m.matchStartTime > cur.time)
      last.set(id, { id, name, players, time: m.matchStartTime });
  }
}

/* Назва в HLTV → ідентифікатор у даних. Беремо найсвіжіший склад із тих, чия
   назва збігається; роки в ідентифікаторі ігноруємо. */
const byName = new Map();
for (const t of last.values()) {
  const k = norm(t.name);
  const cur = byName.get(k);
  if (!cur || t.time > cur.time) byName.set(k, t);
}

/* Двигун зве команди повними назвами — «Team Spirit», «FaZe Clan», «1win
   Team», — а HLTV короткими. Знімаємо слова-наповнювачі з обох боків: тільки
   їх, бо зрізати будь-яке зайве слово означає злити «SAW» і «SAW Youngsters». */
const FILLER = new Set(["team", "esports", "esport", "gaming", "clan", "gg", "cs2", "cs",
  "apogee", "roobet", "pusulabet", "1xbet", "lottu", "dexsport", "fc", "vivo", "gamdom", "epicbet"]);
const core = (s) => String(s).toLowerCase().replace(/[^a-z0-9 .]/g, " ")
  .split(/\s+/).filter((w) => w && !FILLER.has(w)).join("");

const byCore = new Map();
for (const t of last.values()) {
  const k = core(t.name);
  const cur = byCore.get(k);
  if (!cur || t.time > cur.time) byCore.set(k, t);
}

const ALIAS = {
  "natusvincere": "natus vincere",
  "ninjasinpyjamas": "ninjas in pyjamas",
  "virtuspro": "virtus.pro",
  "themongolz": "the mongolz",
  "betboom": "betboom team",
  "innercircle": "ic esports",
  "thunderdownunder": "thunder downunder",
};

export const teamOf = (hltvName) => {
  const k = norm(hltvName);
  let t = byName.get(k);
  if (!t && ALIAS[k]) t = byName.get(norm(ALIAS[k]));
  if (!t) t = byCore.get(core(hltvName));
  if (!t && ALIAS[k]) t = byCore.get(core(ALIAS[k]));
  return t ?? null;
};

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/"))) {
  const want = ["Spirit", "Vitality", "MOUZ", "Falcons", "G2", "FUT", "Aurora", "BETBOOM", "Astralis",
    "Luminosity", "B8", "HEROIC", "Inner Circle", "Alliance", "Nemiga", "3DMAX", "magic", "BIG", "FaZe",
    "Ninjas in Pyjamas", "100 Thieves", "GamerLegion", "Nemesis", "Natus Vincere", "JiJieHao", "HOTU",
    "PARIVISION", "K27", "Eternal Fire", "fnatic", "1win", "Sangal", "SINNERS", "BBL", "EYEBALLERS",
    "SAW", "Betclic", "FOKUS", "Nuclear TigeRES", "Virtus.pro", "Legacy", "FURIA", "MIBR", "9z",
    "Liquid", "M80", "DENDELE", "NRG", "Imperial", "paiN", "Fluxo", "Wildcard", "TYLOO", "BC.Game",
    "The MongolZ", "Lynn Vision", "5star", "FlyQuest", "DEPO", "NEXVOID"];
  const missing = [];
  for (const n of want) {
    const t = teamOf(n);
    if (!t) missing.push(n);
  }
  console.log(`команд у даних: ${last.size} · шукали ${want.length} · не знайшли ${missing.length}`);
  if (missing.length) console.log("не знайдено: " + missing.join(", "));
  const s = teamOf("Spirit");
  console.log(`\nприклад — Spirit: id «${s.id}», склад ${s.players.map((p) => p.nick).join(", ")}`);
}
