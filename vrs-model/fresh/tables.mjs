import fs from "node:fs";

/** Три регіональні таблиці, зняті ввечері 29 жовтня після останнього матчу дня. */
const T = {
  "eu-2810.json": {
    asOf: "2026-10-29",
    source: "hltv.org/valve-ranking/teams/2026/october/29/region/Europe",
    note: "Європейська таблиця після всіх матчів 29 жовтня. Eternal Fire обіграли Astralis і BIG у нижній сітці Stake Ranked і стрибнули на 20-те (+26); Astralis вилетіли четвертими (-21); Inner Circle вилетіли 5-6 і більше не грають; HOTU виграли Tesla Cup, B8 там четверті. Відсічка — 18-те місце, HOTU 1478.",
    rows: "1|Vitality|1971;2|MOUZ|1965;3|Aurora|1860;4|Spirit|1856;5|BETBOOM|1793;6|Falcons|1785;7|FUT|1739;8|G2|1627;9|Natus Vincere|1620;10|Nemiga|1588;11|Astralis|1573;12|PARIVISION|1569;13|Ninjas in Pyjamas|1563;14|FaZe|1544;15|HEROIC|1541;16|1win|1509;17|fnatic|1495;18|HOTU|1478;19|100 Thieves|1474;20|Eternal Fire|1464;21|B8|1455;22|JiJieHao|1434;23|Inner Circle|1422;24|Virtus.pro|1420;25|BIG|1417;26|GamerLegion|1397;27|K27|1394;28|SINNERS|1394;29|magic|1382;30|Luminosity|1380;31|Envy|1368;32|BBL|1361;33|Sangal|1357;34|Nemesis|1355",
  },
  "am-2810.json": {
    asOf: "2026-10-29",
    source: "hltv.org/valve-ranking/teams/2026/october/29/region/Americas",
    note: "Американська таблиця після матчів 29 жовтня. NRG (+22) і Bounty Hunters (+30) піднялись на FiRe Last Chance. Відсічка — 9-те місце, Wildcard 1337.",
    rows: "1|FURIA|1879;2|Legacy|1673;3|MIBR|1570;4|Liquid|1523;5|9z|1505;6|M80|1487;7|DENDELE|1379;8|Imperial|1366;9|Wildcard|1337;10|paiN|1322;11|NRG|1291;12|BESTIA|1221;13|Fluxo|1220;14|SportsBetExpert|1161;15|Voca|1116;16|Galorys|1108;17|ShindeN|1074;18|BARCA|1073;19|Without a Roof|1059;20|Bounty Hunters|1050",
  },
  "as-2810.json": {
    asOf: "2026-10-29",
    source: "hltv.org/valve-ranking/teams/2026/october/29/region/Asia",
    note: "Азійська таблиця після матчів 29 жовтня. TYLOO програли Iberian Soul на HyperX Retake (-16) і впали з 4-го на 6-те — нижче відсічки. Відсічка — 5-те місце, Chinggis Warriors 1261; TYLOO відстають на 4 очки.",
    rows: "1|The MongolZ|1562;2|BC.Game|1381;3|FlyQuest|1274;4|Lynn Vision|1267;5|Chinggis Warriors|1261;6|TYLOO|1257;7|5star|1182;8|NEXVOID|1160;9|Sashi|1028;10|Abyssal|972;11|DEPO|963;12|Alter Ego|955;13|The Huns|948;14|Rare Atom|937",
  },
};
for (const [f, j] of Object.entries(T)) {
  fs.copyFileSync(f, "fresh/backup-2910/" + f);
  fs.writeFileSync(f, JSON.stringify(j, null, 1) + "\n");
  console.log(`${f}  ${j.rows.split(";").length} рядків`);
}
