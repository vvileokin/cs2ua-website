import fs from "node:fs";

/** Три регіональні таблиці станом на 31 жовтня — останній день перед відсіченням. */
const T = {
  "eu-2810.json": {
    asOf: "2026-10-31",
    source: "hltv.org/valve-ranking/teams/2026/october/31/region/Europe",
    note: "Європа після 31 жовтня. Eternal Fire виграли Stake Ranked і стоять 17-ми на 1508. HOTU обіграли The Huns і вийшли у фінал Москви — 18-ті, 1484. fnatic дограли й лишились 19-ми на 1482, за межею на два очки. 100 Thieves у чвертьфіналі FiRe.",
    rows: "1|MOUZ|1959;2|Vitality|1919;3|Aurora|1856;4|Spirit|1844;5|BETBOOM|1785;6|Falcons|1768;7|FUT|1725;8|Nemiga|1642;9|G2|1618;10|Natus Vincere|1592;11|Astralis|1568;12|Ninjas in Pyjamas|1560;13|PARIVISION|1559;14|1win|1543;15|HEROIC|1538;16|FaZe|1537;17|Eternal Fire|1508;18|HOTU|1484;19|fnatic|1482;20|100 Thieves|1472;21|B8|1468;22|JiJieHao|1437;23|Inner Circle|1422;24|Virtus.pro|1416;25|BIG|1410;26|SINNERS|1403",
  },
  "am-2810.json": {
    asOf: "2026-10-31",
    source: "hltv.org/valve-ranking/teams/2026/october/31/region/Americas",
    note: "Америка після 31 жовтня. FURIA виграли Бухарест (3-2 Nemiga) і пішли на 1909. Відсічка — 9-те, Wildcard 1362; NRG 1334 відстають на 28 і грають чвертьфінал FiRe.",
    rows: "1|FURIA|1909;2|Legacy|1662;3|MIBR|1545;4|Liquid|1526;5|9z|1494;6|M80|1486;7|DENDELE|1426;8|Imperial|1409;9|Wildcard|1362;10|NRG|1334;11|BESTIA|1291;12|paiN|1290;13|Fluxo|1265;14|SportsBetExpert|1156;15|Voca|1125;16|BARCA|1114",
  },
  "as-2810.json": {
    asOf: "2026-10-31",
    source: "hltv.org/valve-ranking/teams/2026/october/31/region/Asia",
    note: "Азія після 31 жовтня. Чотири очки вкладаються між 4-м і 6-м: TYLOO 1266, Lynn Vision 1264 на відсічці, Chinggis Warriors 1262. Lynn Vision і Chinggis уже дограли, TYLOO теж — вони вилетіли з HyperX.",
    rows: "1|The MongolZ|1554;2|BC.Game|1331;3|FlyQuest|1300;4|TYLOO|1266;5|Lynn Vision|1264;6|Chinggis Warriors|1262;7|5star|1181;8|NEXVOID|1147;9|Alter Ego|1053;10|Sashi|1028;11|DEPO|975;12|The Huns|960;13|Abyssal|947;14|Rare Atom|940",
  },
};
fs.mkdirSync("fresh/backup-0111", { recursive: true });
for (const [f, j] of Object.entries(T)) {
  fs.copyFileSync(f, "fresh/backup-0111/" + f);
  fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
  console.log(`${f}  ${j.rows.split(";").length} рядків`);
}

/* Звірка зліпка з таблицями. */
const fresh = JSON.parse(fs.readFileSync("fresh/details-0111.json", "utf8"));
const tbl = new Map();
for (const j of Object.values(T))
  for (const s of j.rows.split(";")) { const [, t, p] = s.split("|"); tbl.set(t, +p); }
let bad = 0;
for (const [n, v] of Object.entries(fresh)) {
  const p = tbl.get(n);
  if (p != null && Math.abs(p - v.p) > 1) { console.log(`  ✗ ${n}: розклад ${v.p}, таблиця ${p}`); bad++; }
}
console.log(bad ? `\nрозбіжностей: ${bad}` : "\nрозклади сходяться з таблицями");
