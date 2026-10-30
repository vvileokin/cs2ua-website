import fs from "node:fs";

/**
 * Звірка нашого прогону з прогнозом Mischief за 19 жовтня.
 *
 * Його числа вбиті сюди руками зі скриншотів — іншого джерела немає. Сенс не в
 * тому, щоб підганятись під нього, а в тому, щоб побачити, де розбіжність
 * системна: одна команда на двадцять пунктів — це різні припущення, пів регіону
 * в один бік — це в нас чогось немає.
 */
const HIS = {
  europe: {
    "Vitality": 99.99, "MOUZ": 99.99, "Spirit": 99.99, "Aurora": 99.99, "Falcons": 99.99,
    "G2": 99.99, "FUT": 99.99, "BETBOOM": 99.99, "Astralis": 99.99,
    "Ninjas in Pyjamas": 99.8, "HEROIC": 99.8, "1win": 97.9,
    "PARIVISION": 76.8, "FaZe": 73.6, "Nemiga": 71.2, "B8": 61.3,
    "Natus Vincere": 51.6, "Luminosity": 46.9, "100 Thieves": 40.8, "magic": 33.4,
    "Alliance": 27.3, "Inner Circle": 26.2, "BIG": 25.2, "fnatic": 17.5,
    "Envy": 15.1, "HOTU": 8.9, "GamerLegion": 6.6, "Eternal Fire": 6.4,
    "Nemesis": 5.5, "JiJieHao": 4.9, "K27": 3.3,
  },
  americas: {
    "FURIA": 99.99, "Legacy": 99.99, "9z": 99.99, "MIBR": 99.99, "M80": 99.99,
    "Liquid": 99.96, "DENDELE": 93.84, "Imperial": 73.52, "Wildcard": 72.89,
    "NRG": 21.22, "Fluxo": 15.96, "paiN": 15.73, "BESTIA": 3.36, "ShindeN": 2.18, "Voca": 0.99,
  },
  asia: {
    "BC.Game": 88.9, "TYLOO": 86.5, "FlyQuest": 77.0, "Chinggis Warriors": 66.6,
    "Lynn Vision": 58.8, "5star": 57.0, "The MongolZ": 50.1, "NEXVOID": 12.1, "Sashi": 1.6,
  },
};

const F = JSON.parse(fs.readFileSync(process.argv[2] ?? "final15-2010b.json", "utf8"));
const NAME = { europe: "Європа", americas: "Америка", asia: "Азія" };

let total = 0, n = 0;
for (const [reg, mine] of Object.entries(F.regions)) {
  const his = HIS[reg];
  if (!his) continue;
  const best = new Map();
  for (const t of mine) {
    /* Назва може повторюватись (два Chinggis Warriors) — беремо сильнішу. */
    const cur = best.get(t.team);
    if (!cur || t.live > cur.live) best.set(t.team, t);
  }
  const rows = Object.entries(his)
    .map(([team, h]) => ({ team, his: h, our: best.has(team) ? 100 * best.get(team).pQual : null }))
    .filter((r) => r.our != null)
    .map((r) => ({ ...r, d: r.our - r.his }))
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d));

  const avg = rows.reduce((s, r) => s + Math.abs(r.d), 0) / rows.length;
  total += rows.reduce((s, r) => s + Math.abs(r.d), 0); n += rows.length;
  console.log(`\n=== ${NAME[reg]} · середнє розходження ${avg.toFixed(1)} пп на ${rows.length} команд`);
  for (const r of rows.slice(0, 10))
    console.log(`  ${r.team.padEnd(20)}він ${r.his.toFixed(1).padStart(5)}  ми ${r.our.toFixed(1).padStart(5)}` +
      `   ${r.d > 0 ? "+" : ""}${r.d.toFixed(1)}`);
  const miss = Object.keys(his).filter((t) => !best.has(t));
  if (miss.length) console.log("  немає в нашій таблиці:", miss.join(", "));
}
console.log(`\nсереднє по всіх регіонах: ${(total / n).toFixed(1)} пп`);
