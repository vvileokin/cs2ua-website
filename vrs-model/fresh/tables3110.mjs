import fs from "node:fs";

/** Три регіональні таблиці, зняті вночі 31 жовтня — після фіналу Stake Ranked. */
const T = {
  "eu-2810.json": {
    asOf: "2026-10-30",
    source: "hltv.org/valve-ranking/teams/2026/october/30/region/Europe",
    note: "Європа після 30 жовтня. Eternal Fire виграли Stake Ranked (3-2 fnatic у Bo5) і стрибнули з 1464 на 1513 — одразу через fnatic на 17-те. fnatic програли фінал, впали на 1487 і стоять рівно на відсічці. Nemiga 2-0 Vitality у півфіналі Бухареста (+42). НАВІ виграли групу HyperX (+18).",
    rows: "1|MOUZ|1949;2|Vitality|1946;3|Aurora|1865;4|Spirit|1858;5|BETBOOM|1797;6|Falcons|1786;7|FUT|1739;8|Natus Vincere|1638;9|Nemiga|1630;10|G2|1630;11|Astralis|1576;12|PARIVISION|1572;13|Ninjas in Pyjamas|1567;14|FaZe|1547;15|HEROIC|1544;16|1win|1513;17|Eternal Fire|1513;18|fnatic|1487;19|HOTU|1482;20|100 Thieves|1478;21|B8|1457;22|JiJieHao|1439;23|Virtus.pro|1422;24|Inner Circle|1422;25|BIG|1420;26|K27|1402;27|SINNERS|1400;28|GamerLegion|1398;29|magic|1381;30|Luminosity|1381;31|Envy|1369;32|BBL|1364;33|Nemesis|1361;34|Sangal|1361",
  },
  "am-2810.json": {
    asOf: "2026-10-30",
    source: "hltv.org/valve-ranking/teams/2026/october/30/region/Americas",
    note: "Америка після 30 жовтня. FURIA 2-1 MOUZ і в фіналі Бухареста (+27). Imperial 2-0 paiN на Gamers Club (+30). Wildcard (+26), NRG (+24), BESTIA (+28), Fluxo (+34) грають FiRe Last Chance. MIBR програли Eternal Fire і впали на 1554. Відсічка — 9-те, Wildcard 1363.",
    rows: "1|FURIA|1906;2|Legacy|1675;3|MIBR|1554;4|Liquid|1526;5|9z|1507;6|M80|1492;7|DENDELE|1399;8|Imperial|1396;9|Wildcard|1363;10|paiN|1320;11|NRG|1315;12|Fluxo|1254;13|BESTIA|1249;14|SportsBetExpert|1162;15|Voca|1120;16|ShindeN|1106;17|Galorys|1106;18|BARCA|1080;19|Bounty Hunters|1062;20|Without a Roof|1058",
  },
  "as-2810.json": {
    asOf: "2026-10-30",
    source: "hltv.org/valve-ranking/teams/2026/october/30/region/Asia",
    note: "Азія після 30 жовтня. TYLOO обіграли ZOTIX і повернулись на 4-те (+17). FlyQuest виграли дві на DFRAG (+25) і йдуть у гранд-фінал. Відсічка — 5-те, Lynn Vision 1269; Chinggis Warriors відстають на 6 очок і більше не грають.",
    rows: "1|The MongolZ|1565;2|BC.Game|1362;3|FlyQuest|1299;4|TYLOO|1274;5|Lynn Vision|1269;6|Chinggis Warriors|1263;7|5star|1183;8|NEXVOID|1154;9|Sashi|1031;10|Alter Ego|994;11|DEPO|964;12|Abyssal|959;13|The Huns|952;14|Rare Atom|939",
  },
};
fs.mkdirSync("fresh/backup-3110", { recursive: true });
for (const [f, j] of Object.entries(T)) {
  fs.copyFileSync(f, "fresh/backup-3110/" + f);
  fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
  console.log(`${f}  ${j.rows.split(";").length} рядків`);
}

/* Звірка зліпка з таблицями: однойменний рядок видно одразу по розбіжності. */
const fresh = JSON.parse(fs.readFileSync("fresh/details-3110.json", "utf8"));
const tbl = new Map();
for (const j of Object.values(T))
  for (const s of j.rows.split(";")) { const [, t, p] = s.split("|"); tbl.set(t, +p); }
let bad = 0;
for (const [n, v] of Object.entries(fresh)) {
  const p = tbl.get(n);
  if (p == null) continue;
  if (Math.abs(p - v.p) > 1) { console.log(`  ✗ ${n}: у розкладі ${v.p}, у таблиці ${p}`); bad++; }
}
console.log(bad ? `\nрозбіжностей: ${bad}` : "\nусі розклади сходяться з таблицями");
