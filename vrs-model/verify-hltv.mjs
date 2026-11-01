import fs from "node:fs";

/**
 * Звірка всіх входів моделі з HLTV, рядок у рядок.
 *
 * Три речі перевіряються: поточні очки в регіональних таблицях, інваріант
 * розкладу 400+Σкомпонентів == очки, і прогноз на дату відсічення.
 */
const LIVE = {
  europe: "1|MOUZ|1959;2|Vitality|1920;3|Aurora|1856;4|Spirit|1844;5|BETBOOM|1786;6|Falcons|1768;7|FUT|1725;8|Nemiga|1643;9|G2|1618;10|Natus Vincere|1592;11|Astralis|1568;12|Ninjas in Pyjamas|1560;13|PARIVISION|1559;14|1win|1543;15|HEROIC|1538;16|FaZe|1538;17|Eternal Fire|1508;18|HOTU|1484;19|fnatic|1482;20|100 Thieves|1473;21|B8|1469;22|JiJieHao|1437;23|Inner Circle|1423;24|Virtus.pro|1417;25|BIG|1410;26|SINNERS|1403;27|K27|1403;28|GamerLegion|1391;29|Luminosity|1373;30|magic|1368;31|Nemesis|1360;32|BBL|1360;33|Envy|1359;34|Sangal|1355;35|PRIVATE|1322;36|FOKUS|1306;37|Alliance|1304;38|Iberian Soul|1286;39|Betclic|1263;40|Metizport|1259;41|Nuclear TigeRES|1257;42|Phantom|1237",
  americas: "1|FURIA|1910;2|Legacy|1663;3|MIBR|1545;4|Liquid|1526;5|9z|1494;6|M80|1487;7|DENDELE|1435;8|Imperial|1413;9|Wildcard|1365;10|NRG|1335;11|BESTIA|1301;12|paiN|1293;13|Fluxo|1247;14|SportsBetExpert|1157;15|BARCA|1156;16|Voca|1126",
  asia: "1|The MongolZ|1554;2|BC.Game|1331;3|FlyQuest|1300;4|TYLOO|1266;5|Lynn Vision|1264;6|Chinggis Warriors|1262;7|5star|1181;8|NEXVOID|1147;9|Alter Ego|1053;10|Sashi|1029;11|DEPO|974;12|The Huns|960;13|Abyssal|947;14|Rare Atom|940",
};
const FILE = { europe: "eu-2810.json", americas: "am-2810.json", asia: "as-2810.json" };
let bad = 0;

console.log("=== 1. Регіональні таблиці: наш файл проти HLTV ===");
for (const [reg, live] of Object.entries(LIVE)) {
  const mine = new Map(JSON.parse(fs.readFileSync(FILE[reg], "utf8")).rows
    .split(";").map((s) => { const [, t, p] = s.split("|"); return [t, +p]; }));
  let n = 0, miss = 0;
  for (const row of live.split(";")) {
    const [, t, p] = row.split("|");
    n++;
    if (!mine.has(t)) { console.log(`  ! ${reg}: ${t} немає у файлі`); bad++; continue; }
    if (mine.get(t) !== +p) { console.log(`  ! ${reg}: ${t} у нас ${mine.get(t)}, у HLTV ${p}`); miss++; }
  }
  console.log(`  ${reg}: ${n} рядків, розбіжностей ${miss}`);
  bad += miss;
}

console.log("\n=== 2. Інваріант розкладу: 400 + Σкомпонентів == очки ===");
let det = 0, detBad = 0;
for (const f of fs.readdirSync("vrs-details")) {
  const j = JSON.parse(fs.readFileSync("vrs-details/" + f, "utf8"));
  det++;
  const sum = 400 + j.c.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - j.p) > 1) { console.log(`  ! ${j.n}: 400+Σc=${sum}, а очок ${j.p}`); detBad++; }
}
console.log(`  розкладів ${det}, зламаних ${detBad}`);
bad += detBad;

console.log("\n=== 3. Прогноз на 2 листопада: наш файл проти компонентів HLTV ===");
const PROJ = JSON.parse(fs.readFileSync("proj-0211.json", "utf8"));
/* Компоненти, зняті зі сторінки розкладу з isFuture=true. */
const COMP = {
  "Eternal Fire": [469,143,239,214,43], "HOTU": [431,180,253,217,4],
  "fnatic": [462,146,237,230,6], "100 Thieves": [467,138,237,230,0],
  "B8": [382,153,249,261,18], "JiJieHao": [468,149,208,238,-27],
  "1win": [357,197,251,316,24], "FaZe": [469,114,296,280,-22],
  "HEROIC": [458,160,233,214,73], "Wildcard": [462,83,233,198,-13],
  "NRG": [374,115,202,232,9], "BESTIA": [451,88,190,174,-3],
  "Imperial": [469,99,223,197,23], "DENDELE": [446,122,247,251,-32],
  "TYLOO": [224,94,249,237,56], "Lynn Vision": [261,68,241,184,106],
  "Chinggis Warriors": [469,95,183,170,-54], "FlyQuest": [469,59,191,155,27],
  "BC.Game": [467,116,184,196,-35], "The MongolZ": [402,118,294,299,39],
};
for (const [t, c] of Object.entries(COMP)) {
  const sum = 400 + c.reduce((a, b) => a + b, 0), ours = PROJ.pts[t];
  const d = ours - sum;
  if (Math.abs(d) > 1) { console.log(`  ! ${t}: у нас ${ours}, за компонентами ${sum}`); bad++; }
  else console.log(`  ${t.padEnd(18)}${String(sum).padStart(5)}${d ? "  (у файлі " + ours + ", заокруглення)" : ""}`);
}
console.log(`\nрозбіжностей усього: ${bad}`);
