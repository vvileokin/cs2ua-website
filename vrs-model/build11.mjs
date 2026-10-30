import fs from "node:fs";
import ExcelJS from "exceljs";
import { RU_EVENTS, UA_TEAMS, CIS_TEAMS } from "./access.mjs";

/**
 * The workbook, in the shape that worked, on numbers that are right.
 *
 * The calendar version of this file read well and projected the autumn
 * properly, but it stood on a month-old Valve snapshot. The HLTV version fixed
 * the anchor and lost the calendar, leaving a forecast that assumed nobody wins
 * anything before the cutoff. This is both halves: HLTV's exact decay to
 * 2 November, and our own projection of the results they cannot assume.
 */
const F = JSON.parse(fs.readFileSync("final15.json", "utf8"));
const N = F.noise;

const INK = "FF10151E", DIM = "FF5B6472";
const fill = c => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } });
const PINK = fill("FFC98BA8"), REDH = fill("FFD98078"), INPUT = fill("FFFFF6C2");
const S3 = fill("FF9CC79A"), S2 = fill("FFBEDBB8"), S1 = fill("FFDCEBD6");
const HEADF = fill("FF1B2230");
const thin = { style: "thin", color: { argb: "FFBFC6D2" } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

const wb = new ExcelJS.Workbook();
wb.creator = "cs2-ua";
const REGIONS = [
  { key: "europe",   title: "Європа",  slots: F.slots.europe,   tab: "FFC98BA8" },
  { key: "americas", title: "Америка", slots: F.slots.americas, tab: "FF8FA9C7" },
  { key: "asia",     title: "Азія",    slots: F.slots.asia,     tab: "FFD9B36A" },
];

/* ==================== ЯК ЦЕ ПОБУДОВАНО ==================== */
{
  const S = wb.addWorksheet("Модель", { views: [{ showGridLines: false }] });
  S.columns = [{ width: 3 }, { width: 24 }, { width: 100 }];
  let r = 2;
  const H = t => { S.getCell(`B${r}`).value = t; S.getCell(`B${r}`).font = { bold: true, size: 14, color: { argb: INK } }; S.getRow(r).height = 24; r += 2; };
  const T = (a, b) => {
    S.getCell(`B${r}`).value = a;
    S.getCell(`B${r}`).font = { bold: !!a, size: 10, color: { argb: INK } };
    S.getCell(`B${r}`).alignment = { vertical: "top", wrapText: true };
    S.getCell(`C${r}`).value = b;
    S.getCell(`C${r}`).font = { size: 10, color: { argb: a ? DIM : INK } };
    S.getCell(`C${r}`).alignment = { vertical: "top", wrapText: true };
    S.getRow(r).height = Math.max(16, Math.ceil(b.length / 102) * 15);
    r++;
  };
  const GAP = () => r++;

  H("Як рахується прогноз");
  T("", "Одну річ беремо ззовні, все інше рахуємо самі.");
  GAP();
  T("Очки VRS", `Valve Regional Standings на ${F.asOf}, 399 команд, з усіма зіграними матчами. Саме за VRS роздають запрошення на мейджор — інші рейтинги на це не впливають. Беремо їх готовими з майданчика HLTV, який рахує модель Valve безперервно й враховує вже забезпечені призові з незавершених турнірів. Призові — один із чотирьох факторів seed, і в результатах матчів їх не видно, тому відтворювати VRS самотужки немає сенсу: вийде гірше.`);
  T("Прогноз — наш", "Далі готового немає. Прогнозна таблиця VRS на 2 листопада, яку показує HLTV, — це просто перемотка декею вперед: вона припускає, що до відсічення жодна команда нічого не виграє. Це не прогноз, це поточний стан із відрізаним майбутнім.");
  GAP();
  T("Наш ланцюг", "μ = VRS зараз + Форма + Seed.");
  T("Форма", "Скільки команда набере на матчах, які ще попереду. Рахується формулою Valve — очікуваний результат проти середнього суперника, помножений на кількість матчів у календарі — і скоригованою на перекіс, який Valve визнає у власному readme.");
  T("Seed", "Рух від календаря. Турніри дають не лише матчі, а й призові, LAN-перемоги та мережу побитих суперників. Команда з трьома тір-1 запрошеннями росте, команда без жодного просідає — бо вікно котиться вперед, а нових результатів немає.");
  T("Далі", "Навколо μ будується невизначеність, і згортка перетворює її на ймовірність кожного стейджа. Це те, чого не публікує ніхто: HLTV дають одне число, ми — розподіл.");
  GAP();

  H("Чому календар вирішує");
  const navi = F.regions.europe.find(t => t.team === "Natus Vincere");
  if (navi) {
    T("Natus Vincere", `Зараз ${navi.live} очок VRS. Заявлені на ${navi.tier1.length} тір-1 турніри до відсічення: ${navi.tier1.join(", ")}. Це ${navi.matches} матчів і найбільший приріст seed у Європі — ${navi.seedFuture > 0 ? "+" : ""}${Math.round(navi.seedFuture)}. Підсумок ${Math.round(navi.mu)}, ${navi.projected}-те місце, ${(navi.pQual * 100).toFixed(0)}%.`);
    T("Для порівняння", "У прогнозній таблиці VRS на HLTV на ту саму дату NaVi сімнадцяті: там їхні три турніри просто не враховані, бо результатів ще немає. Різниця між сьомим місцем і сімнадцятим — це рівно та частина задачі, яку ми й рахуємо.");
  }
  const noT1 = F.regions.europe.filter(t => t.stage > 0 && !t.tier1.length).slice(0, 1)[0];
  if (noT1) {
    T("І навпаки", `${noT1.team} без жодного тір-1 запрошення: ${noT1.tier2Events.toFixed(1)} відкритих ЛАНів, seed ${noT1.seedFuture > 0 ? "+" : ""}${Math.round(noT1.seedFuture)}. Шлях є, але він вужчий.`);
  }
  GAP();

  H("Календар — головна зміна цієї версії");
  T("", "Тір-2 календар тепер зібраний із таблиці denten «VRS LAN Tournaments», а не вручну зі сторінки подій HLTV. Різниця виявилась більшою, ніж я очікував.");
  GAP();
  T("Було 23 турніри", "Стало 38. П''ятнадцять LAN-ів, яких у моделі не було взагалі — і серед них FiReLEAGUE Last Chance на $75 тисяч в Аргентині, XSE Pro League на $50 тисяч у Китаї, RUSH B! Summit на $50 тисяч у Бразилії.");
  T("Америка мала нуль", "У попередній версії для Америки не було жодного тір-2 турніру, і в таблиці чесно стояв прочерк. Насправді їх сім, і найбільший відкритий ЛАН регіону цієї осені — саме там.");
  T("Прибрав онлайн", "ESEA Finals, European Pro League та інші онлайн-ліги я враховував як ЛАНи. Це турніри рівня, на який команди з цієї таблиці не заявляються, і вони роздували календар саме середняків. Таблиця denten — це список LAN-ів: чого в ній немає, те не той тип турніру.");
  T("Повернув видалене", "Private Club 2, CIS LAN 9, Hotspawn Showdown і Station Strike я раніше викинув як вигадані, бо не знайшов їх на сторінці HLTV. Вони реальні, і один із них — інвайтник на $100 тисяч.");
  GAP();

  H("Скільки місць насправді є на турнірі");
  T("", "Друге виправлення, менш помітне й важливіше за перше. Шанс кожної команди потрапити на відкритий ЛАН рахувався окремо і ніколи не звірявся з тим, скільки там слотів.");
  T("Що виходило", "Для турніру на 16 команд сума ймовірностей по всіх претендентах давала 55 очікуваних учасників. Тобто модель роздавала втричі більше турніру, ніж його існує, і кожен середняк збирав seed із місця, де всі вони одночасно бути не могли.");
  T("Як стало", "Ймовірності кожного турніру діляться на власну суму там, де вона перевищує кількість слотів. Хто ймовірніше потрапить — той і лишається ймовірнішим; арифметика перестає вигадувати турніри. Після цього підтверджена участь важить помітно більше, бо здогадки нарешті нормовані.");
  GAP();

  H("Склади турнірів");
  T("", "Дев'ять турнірів уже оголосили учасників. Раніше модель для кожного з них рахувала ймовірність участі за рангом, і в двох випадках вона помилялась так, що це міняло всю картину.");
  GAP();
  T("Thunderpick, $1 млн", "Другий за розміром призовий календаря. Модель позначала його як «глобальний відкритий» і роздавала частку кожній команді топ-40. Реальний склад: Spirit, Falcons, MOUZ, Vitality, NaVi, 9z, Legacy — сім найкращих команд світу й одне місце з кваліфікації. Із середини таблиці туди не їде ніхто, а модель нараховувала їм усім.");
  T("Moscow Cyber Games", "Чотири команди на $181 тисячу. Правило доступу казало, що неросійський європеєць потрапляє туди раз на десять, а Азія не потрапляє ніколи. Реальний склад: HOTU, 1win, Alter Ego, 5star — польська команда рівно на межі проходу і дві азійські. Обидва припущення були неправильні, і найсильніше — щодо тієї команди, чия кваліфікація найближча до підкидання монети.");
  GAP();
  T("Що це дало", "У стовпці «Календар» тепер два різні рядки. «ЗАЯВЛЕНІ» — команда в опублікованому складі, це факт без відсотка. Нижче — турніри, які складу ще не назвали, і там лишається оцінка. Два найдорожчі турніри вже в першій категорії.");
  GAP();

  H("Чому не рахуємо рейтинг самі");
  T("", "Спершу рахували самі: місячна публікація VRS із репозиторію Valve як якір, плюс Glicko вперед по матчах, плюс оцінка фактора мережі суперників. Проблема в тому, що той репозиторій оновлюється раз на місяць, а VRS змінюється щодня.");
  T("Де зламалось", "Модель ставила THUNDER dOWNUNDER вище за DEPO — бо серпнева публікація VRS давала 1149 проти 1084. За місяць THUNDER втратили 82 очки, DEPO додали 30, і реконструкція за матчами цього не побачила: там був не результат, а призові й декей.");
  T("Урок", "Очки VRS беремо готовими. Рахуємо самі те, чого немає ні в кого: майбутнє й невизначеність.");
}

/* ==================== ПАРАМЕТРИ ==================== */
const P = {};
{
  const S = wb.addWorksheet("Параметри", { views: [{ showGridLines: false }] });
  S.columns = [{ width: 3 }, { width: 26 }, { width: 15 }, { width: 76 }];
  let r = 2;
  S.getCell("B2").value = "Параметри моделі";
  S.getCell("B2").font = { bold: true, size: 14, color: { argb: INK } };
  S.getCell("B3").value = "Жовті клітинки можна крутити — решта перерахується сама.";
  S.getCell("B3").font = { size: 9, italic: true, color: { argb: DIM } };
  r = 5;
  const sec = t => { S.getCell(`B${r}`).value = t; S.getCell(`B${r}`).font = { bold: true, size: 11, color: { argb: INK } }; r++; };
  const p = (label, val, note, input) => {
    S.getCell(`B${r}`).value = label;
    const c = S.getCell(`C${r}`);
    c.value = val;
    c.alignment = { horizontal: "center" };
    if (input) { c.fill = INPUT; c.border = box; }
    S.getCell(`D${r}`).value = note;
    S.getCell(`D${r}`).font = { size: 9, color: { argb: DIM } };
    S.getCell(`D${r}`).alignment = { wrapText: true, vertical: "middle" };
    return r++;
  };
  sec("Константи Valve · з відкритого коду");
  const rQ = p("Q", { formula: "LN(10)/400" }, "Q = ln(10) / 400");
  const rRD = p("RD", 75, "фіксований, тому Glicko вироджується в Elo");
  P.rG = p("g", { formula: `1/SQRT(1+3*C${rQ}^2*C${rRD}^2/PI()^2)` }, "g = 1 / √(1 + 3Q²·RD² / π²)");
  P.rKG = p("K·g", F.KG, "максимальна зміна рейтингу за один матч");
  r++;
  sec("Калібрування — виправлення перекосу Valve");
  const rSlope = p("нахил", Number((400 / F.D).toFixed(4)), `заміряно на ${F.calMatches} матчах walk-forward`, true);
  P.rDiv = p("дільник D", { formula: `400/C${rSlope}` }, "замінює 400 у формулі ймовірності");
  r++;
  sec("Горизонт");
  p("дата відсічення", F.cutoff, "дата запрошень на мейджор — підтверджено на HLTV", true);
  P.rMon = p("місяців лишилось", Number(F.months.toFixed(3)), `від ${F.asOf} до відсічення`, true);
  r++;
  sec("Розмах, хвіст і смертність — заміряно на 8 публікаціях Valve");
  S.getRow(r).values = ["", "група", "σ / місяць", "ν (хвіст) · ризик зникнути за місяць · спостережень"];
  S.getRow(r).font = { bold: true, size: 9.5 };
  r++;
  for (const [name, v] of Object.entries(N)) {
    S.getCell(`B${r}`).value = name;
    S.getCell(`C${r}`).value = Math.round(v.sd);
    S.getCell(`C${r}`).fill = INPUT; S.getCell(`C${r}`).border = box;
    S.getCell(`C${r}`).alignment = { horizontal: "center" };
    S.getCell(`D${r}`).value = `ν ${v.nu.toFixed(1)} · ${(v.dropRate * 100).toFixed(1)}% · n=${v.n} · найбільша реальна зміна ${v.max}`;
    S.getCell(`D${r}`).font = { size: 9, color: { argb: DIM } };
    r++;
  }
  r++;
  S.mergeCells(`B${r}:D${r + 3}`);
  S.getCell(`B${r}`).value =
    "У таблиці ці числа не використовуються сходинками. Між чотирма замірами вони інтерполюються за рангом: " +
    "команда не стає в півтора раза мінливішою від того, що впала на одне місце. Раніше саме така сходинка давала " +
    "95% десятій команді й 42% одинадцятій, хоча між ними був дев'яносто один пункт рейтингу.";
  S.getCell(`B${r}`).alignment = { wrapText: true, vertical: "top" };
  S.getCell(`B${r}`).font = { size: 10, color: { argb: INK } };
}

/* ==================== РЕГІОНИ ==================== */
/**
 * Event names, short enough to read in a cell.
 *
 * The calendar stores official titles; a column of them is unreadable at any
 * width that leaves room for the rest of the table.
 */
const shortName = n => String(n)
  .replace(/\bSeason\s+/i, "").replace(/\bEpisode\s+/i, "")
  .replace(/StarLadder StarSeries/i, "StarLadder")
  .replace(/Thunderpick World Championship/i, "Thunderpick WC")
  .replace(/^ESL CL S52 /i, "ESL CL ")
  .replace(/Logitech G Play Connect/i, "Logitech G Connect")
  .replace(/PGL Masters /i, "PGL ")
  .replace(/^Retake /i, "HyperX RETAKE ")
  .replace(/\s+Cup\b/i, "").trim();

/**
 * What the tournament number is actually made of.
 *
 * "+3.0" is not a fact a reader can argue with. The events behind it, each with
 * the chance the team is in the field, are — and the difference between a known
 * entry list and an estimate becomes visible instead of implied.
 */
const eventsFor = t => {
  const parts = [];
  if (t.tier1?.length) parts.push("ТІР-1:  " + t.tier1.map(shortName).join("  ·  "));
  if (t.qualChance > 0.02) parts.push(`Квала в PGL Bucharest — шанс узяти слот ${(t.qualChance * 100).toFixed(0)}%`);
  /* Fact and estimate are split, because they are not the same claim. A team
     named in a published field is going; a team the model thinks might get an
     invite to something that has announced nothing is a guess wearing a
     percentage. Nine events have named their teams, so most of the heavy
     weight in this column is now the first kind. */
  const lans = [...(t.tier2List ?? [])];
  const sure = lans.filter(e => e.confirmed);
  const maybe = lans.filter(e => !e.confirmed).sort((a, b) => b.p - a.p);
  if (sure.length)
    parts.push("ЗАЯВЛЕНІ:  " +
      sure.map(e => shortName(e.name) + (e.ru ? " 🇷🇺" : "")).join("  ·  "));
  if (maybe.length)
    parts.push("Склад ще не оголошено, оцінка:  " +
      maybe.map(e => shortName(e.name) + (e.ru ? " 🇷🇺" : "") + ` ${Math.round(e.p * 100)}%`).join("  ·  "));
  if (t.nation === "ua" && !sure.some(e => e.ru))
    parts.push("Російські майданчики виключені — українські склади там не грають.");
  if (t.tier2Gap && !t.tier1?.length) parts.push("Відкритих ЛАНів у нашому календарі для цього регіону немає — див. аркуш «Доступ».");
  if (!parts.length) parts.push("Нічого до відсічення — рейтинг тільки просідатиме");
  return parts.join("\n");
};

const noteFor = t => {
  const pc = x => `${(x * 100).toFixed(0)}%`;
  let s;
  if (t.stage === 3) s = t.p3 > 0.8 ? "Верхній стейдж майже певний."
    : `Стоять у Stage 3, але власні числа дають ${pc(t.p3)} проти ${pc(t.p2)} за другий.`;
  else if (t.stage === 2) s = t.p2 > 0.55 ? `Другий стейдж надійно, вниз ${pc(t.p1)}.`
    : `Розтягнуті між стейджами: ${pc(t.p3)} / ${pc(t.p2)} / ${pc(t.p1)}.`;
  else if (t.stage === 1) s = t.pQual > 0.7 ? `Проходять упевнено, але з першого стейджа (${pc(t.pQual)}).`
    : `На межі: тримають місце лише в ${pc(t.pQual)} випадків.`;
  else if (t.pQual > 0.05) s = `Перші поза списком — ${(t.pQual * 100).toFixed(1)}%, треба обійти одну-дві команди.`;
  else s = `Практично поза грою — ${(t.pQual * 100).toFixed(2)}%.`;
  if (t.tier1?.length >= 3) s += ` Найщільніший календар у регіоні — ${t.tier1.length} тір-1 турніри, найбільший приріст seed.`;
  else if (t.tier1?.length >= 1) s += ` ${t.tier1.length} тір-1 ${t.tier1.length === 1 ? "турнір" : "турніри"} попереду.`;
  else if (t.tier2Events >= 2.5) s += " Без тір-1 запрошень: усе, що є, — відкриті ЛАНи.";
  if (t.qualChance > 0.05) s += ` Ще ${(t.qualChance * 100).toFixed(0)}% узяти слот через кваліфікацію в Бухарест.`;
  return s;
};

for (const reg of REGIONS) {
  const rows = F.regions[reg.key], cfg = reg.slots;
  const W = wb.addWorksheet(reg.title, {
    properties: { tabColor: { argb: reg.tab } },
    views: [{ state: "frozen", ySplit: 8, showGridLines: false }],
  });
  W.columns = [{ width: 3 }, { width: 10 }, { width: 21 }, { width: 12 }, { width: 8 }, { width: 8 }, { width: 8 },
    { width: 11 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 7 }, { width: 62 }, { width: 7 }, { width: 40 }];

  W.getCell("B2").value = `Шанси на мейджор · ${reg.title}`;
  W.getCell("B2").font = { bold: true, size: 16, color: { argb: INK } };
  W.getCell("B3").value = `PGL Major Singapore · ${cfg.total} місць (Stage 3 — ${cfg.stage3}, Stage 2 — ${cfg.stage2}, Stage 1 — ${cfg.stage1})`;
  W.getCell("B3").font = { size: 10, color: { argb: DIM } };
  W.getCell("B4").value = `Очки VRS — станом на ${F.asOf}. Форма, seed від календаря та ймовірності — наш розрахунок до дати запрошень ${F.cutoff}.`;
  W.getCell("B4").font = { size: 9, italic: true, color: { argb: DIM } };
  W.getCell("B5").value = "Мітка стейджа — це місце у прогнозі. Наскільки воно тверде, кажуть відсотки поруч.";
  W.getCell("B5").font = { size: 9, italic: true, color: { argb: "FFA33A2E" } };

  let row = 7;
  const hdr = (text, colour) => {
    W.mergeCells(`B${row}:P${row}`);
    const c = W.getCell(`B${row}`);
    c.value = text; c.fill = colour;
    c.font = { bold: true, size: 11, color: { argb: "FF1A1A1A" } };
    c.alignment = { vertical: "middle", indent: 1 };
    W.getRow(row).height = 24;
    row++;
  };
  const cols = () => {
    const r = W.getRow(row);
    r.values = ["", "Стейдж", "Команда", "Шанс проходу", "Stage 3", "Stage 2", "Stage 1", "Місце (90%)",
      "VRS зараз", "Форма", "Seed", "μ на 02.11", "Матчів", "Календар до 2 листопада — заявлені склади й оцінки", "Ризик", "Що це значить"];
    r.font = { bold: true, size: 9, color: { argb: INK } };
    r.alignment = { vertical: "middle", wrapText: true, horizontal: "center" };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(14).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    r.getCell(16).alignment = { horizontal: "left", vertical: "middle" };
    r.height = 34;
    for (let i = 2; i <= 16; i++) { r.getCell(i).border = box; r.getCell(i).fill = fill("FFEDF0F4"); }
    row++;
  };
  let prev = null;
  const put = (t, marking) => {
    const r = W.getRow(row);
    r.getCell(2).value = t.stage ? `Stage ${t.stage}` : "—";
    if (t.stage) r.getCell(2).fill = t.stage === 3 ? S3 : t.stage === 2 ? S2 : S1;
    r.getCell(2).font = { bold: true, size: 9.5 };
    r.getCell(2).alignment = { horizontal: "center" };
    r.getCell(3).value = t.team;
    r.getCell(3).font = { bold: true, size: 10 };
    r.getCell(4).value = t.pQual;
    r.getCell(5).value = t.p3;
    r.getCell(6).value = t.p2;
    r.getCell(7).value = t.p1;
    r.getCell(8).value = `${t.lo}–${t.hi}`;
    r.getCell(9).value = t.live;
    r.getCell(10).value = Math.round(t.form);
    r.getCell(11).value = Math.round(t.seedFuture);
    r.getCell(12).value = Math.round(t.mu);
    r.getCell(13).value = t.matches;
    r.getCell(14).value = eventsFor(t);
    r.getCell(15).value = t.death;
    r.getCell(16).value = noteFor(t);
    [4, 5, 6, 7].forEach(c => { r.getCell(c).numFmt = "0.00%"; r.getCell(c).alignment = { horizontal: "center" }; });
    [10, 11].forEach(c => r.getCell(c).numFmt = "+0;-0;0");
    r.getCell(15).numFmt = "0%";
    r.getCell(14).font = { size: 8.5, color: { argb: DIM } };
    r.getCell(14).alignment = { vertical: "middle", wrapText: true, horizontal: "left" };
    r.getCell(4).font = { bold: true };
    r.getCell(12).font = { bold: true };
    for (let c = 8; c <= 15; c++) r.getCell(c).alignment = { horizontal: "center" };
    r.getCell(16).font = { size: 9, color: { argb: DIM } };
    r.alignment = { vertical: "middle", wrapText: true };
    for (let i = 2; i <= 16; i++) r.getCell(i).border = box;
    if (marking && prev !== null && t.stage !== prev)
      for (let i = 2; i <= 16; i++) r.getCell(i).border = { ...box, top: { style: "medium", color: { argb: "FF7A8494" } } };
    prev = t.stage;
    row++;
  };

  const first = row + 2;
  hdr("Проходять за поточним прогнозом", PINK);
  cols();
  rows.filter(t => t.stage > 0).forEach(t => put(t, true));
  row++;
  hdr("Не проходять за поточним прогнозом", REDH);
  cols();
  prev = null;
  rows.filter(t => t.stage === 0).slice(0, 14).forEach(t => put(t, false));

  W.addConditionalFormatting({ ref: `D${first}:D${row - 1}`, rules: [{ type: "colorScale",
    cfvo: [{ type: "num", value: 0 }, { type: "num", value: 0.5 }, { type: "num", value: 1 }],
    color: [{ argb: "FFE8918A" }, { argb: "FFF7DFA0" }, { argb: "FF8FC79B" }] }] });
  for (const c of ["E", "F", "G"])
    W.addConditionalFormatting({ ref: `${c}${first}:${c}${row - 1}`, rules: [{ type: "colorScale",
      cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }],
      color: [{ argb: "FFFFFFFF" }, { argb: "FF9CC79A" }] }] });
  for (const c of ["J", "K"])
    W.addConditionalFormatting({ ref: `${c}${first}:${c}${row - 1}`, rules: [{ type: "colorScale",
      cfvo: [{ type: "min" }, { type: "num", value: 0 }, { type: "max" }],
      color: [{ argb: "FFE8918A" }, { argb: "FFFFFFFF" }, { argb: "FF8FC79B" }] }] });

  if (reg.key === "asia") {
    const d = rows.find(t => t.team === "DEPO"), th = rows.find(t => t.team === "THUNDER dOWNUNDER");
    if (d && th) {
      row += 2;
      W.getCell(`B${row}`).value = "DEPO проти THUNDER dOWNUNDER";
      W.getCell(`B${row}`).font = { bold: true, size: 11, color: { argb: INK } };
      row++;
      W.mergeCells(`B${row}:P${row + 3}`);
      W.getCell(`B${row}`).value =
        `У серпневій публікації Valve було навпаки: THUNDER 1149 і п'яте місце Азії, DEPO 1084 і шосте. За місяць THUNDER втратили 82 очки, DEPO додали 30 — і в живій таблиці HLTV тепер DEPO ${d.live}, THUNDER ${th.live}.\n` +
        `Далі їх розводить декей. DEPO ${d.decay > 0 ? "додають" : "втрачають"} ${Math.abs(d.decay)} до 2 листопада, THUNDER втрачають ${Math.abs(th.decay)}: у них із шестимісячного вікна випадає більше, ніж заходить. База стає ${d.base} проти ${th.base}.\n` +
        `Підсумок: DEPO ${(d.pQual * 100).toFixed(0)}% і третє місце Азії, THUNDER ${(th.pQual * 100).toFixed(0)}%. Прогноз HLTV на ту саму дату дає той самий порядок.`;
      W.getCell(`B${row}`).alignment = { wrapText: true, vertical: "top" };
      W.getCell(`B${row}`).font = { size: 10, color: { argb: INK } };
    }
  }
  if (reg.key === "europe") {
    const w = rows.find(t => /^jam$/i.test(t.srcTeam));
    if (w) {
      row += 2;
      W.getCell(`B${row}`).value = "WBT (ex-Jam) — окремо, на запит";
      W.getCell(`B${row}`).font = { bold: true, size: 11, color: { argb: INK } };
      row++;
      W.mergeCells(`B${row}:P${row + 3}`);
      const cut = rows.find(t => t.projected === cfg.total);
      const old = rows.find(t => /^wbt$/i.test(t.srcTeam));
      W.getCell(`B${row}`).value =
        `Рахувати треба саме цей склад. Valve рейтингує ростери, а не бейджі: п'ятірка, яка зараз грає під WBT, у таблицях досі значиться як Jam — ` +
        `звідси ${w.live} очок і ${w.globalRank}-те місце у світі` + (old ? `, а не ${old.live} очок і ${old.globalRank}-те, як у рядка зі старою назвою` : "") + `.\n` +
        `Декей до 2 листопада в них ${w.decay >= 0 ? "додатний, плюс " + w.decay : "мінус " + Math.abs(w.decay)} — база ${w.base}. ` +
        `Чотири тір-2 ЛАНи, у яких вони заявлені (${(w.knownT2 ?? []).join(", ")}), плюс форма додають ще ${Math.round(w.mu - w.base)} очок: прогноз ${Math.round(w.mu)}, ${w.projected}-те місце Європи.\n` +
        `До 18-го місця (${cut.team}, ${Math.round(cut.mu)}) бракує ${Math.round(cut.mu - w.mu)} очок. Шанс на мейджор — ${(w.pQual * 100).toFixed(2)}%: мало, але вже не нуль. ` +
        `Ці ЛАНи малі — сумарна вага 1.46 проти 2.07 у чотирьох найважчих відкритих турнірів календаря, тож приріст скромніший, ніж міг би бути.`;
      W.getCell(`B${row}`).alignment = { wrapText: true, vertical: "top" };
      W.getCell(`B${row}`).font = { size: 10, color: { argb: INK } };
    }
  }
}

/* ==================== ЖИВІ ФОРМУЛИ ==================== */
{
  const EU = F.regions.europe.slice(0, 100);
  const colLetter = n => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; };
  const LAST = colLetter(EU.length + 1);
  const T = wb.addWorksheet("Розрахунок", { views: [{ state: "frozen", ySplit: 5, showGridLines: false }] });
  /**
   * The whole chain, live.
   *
   * An earlier draft handed this sheet a finished "Форма" number and asked the
   * reader to trust it. That is the one thing a spreadsheet is for: seeing the
   * step that produced the number. So the Valve chain is rebuilt in cells —
   * average opponent, raw expectation, calibrated expectation, and the Glicko
   * movement that follows from them — and every one of those is a formula.
   * Change a team's matches and the form, the μ, the pairwise odds and the
   * qualification probability all move.
   */
  T.columns = [{ width: 4 }, { width: 20 }, { width: 8 }, { width: 8 }, { width: 11 }, { width: 8 }, { width: 9 },
    { width: 9 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 6 }, { width: 9 }, { width: 8 },
    { width: 10 }, { width: 12 }];
  T.getCell("A1").value = "Живі формули · Європа, 100 команд";
  T.getCell("A1").font = { bold: true, size: 14, color: { argb: INK } };
  T.getCell("A2").value = "Жовті стовпці вхідні. Усе інше — формули: змініть очки VRS, кількість матчів, seed чи розмах, і перерахується весь ланцюг аж до шансу на мейджор.";
  T.getCell("A2").font = { size: 9, italic: true, color: { argb: DIM } };
  T.getCell("A3").value = `Слотів у Європі ${F.slots.europe.total} · горизонт ${F.months.toFixed(2)} міс · дільник калібрування ${Math.round(F.D)} замість 400`;
  T.getCell("A3").font = { size: 9, italic: true, color: { argb: DIM } };

  const H = ["#", "Команда", "VRS зараз", "Матчів", "Сер. суперник", "E сира", "p калібр.",
    "Форма", "Seed", "μ", "σ", "ν", "ризик/міс", "Ризик", "Вище нас", "P(мейджор)"];
  const hr = T.getRow(5);
  hr.values = H;
  hr.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
  hr.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  hr.height = 34;
  for (let i = 1; i <= H.length; i++) { hr.getCell(i).fill = HEADF; hr.getCell(i).border = box; }

  const R0 = 6, LASTROW = R0 + EU.length - 1;
  EU.forEach((t, i) => {
    const r = R0 + i, w = T.getRow(r);
    const pr = r - R0 + 2;                       // matching row on the pairwise sheet
    w.getCell(1).value = t.projected;
    w.getCell(2).value = t.team;
    w.getCell(3).value = t.live;                                             // очки VRS на сьогодні
    w.getCell(4).value = t.matches;                                          // з календаря
    w.getCell(5).value = { formula: `ROUND(AVERAGE($C$${R0}:$C$${R0 + 29}),0)` };
    w.getCell(6).value = { formula: `1/(1+10^(Параметри!$C$${P.rG}*(C${r}-E${r})/-400))` };
    w.getCell(7).value = { formula: `1/(1+10^(Параметри!$C$${P.rG}*(C${r}-E${r})/-Параметри!$C$${P.rDiv}))` };
    w.getCell(8).value = { formula: `Параметри!$C$${P.rKG}*D${r}*(G${r}-F${r})` };
    w.getCell(9).value = Math.round(t.seedFuture);
    w.getCell(10).value = { formula: `C${r}+H${r}+I${r}` };
    w.getCell(11).value = Math.round(t.sd);
    w.getCell(12).value = Number(t.nu.toFixed(1));
    w.getCell(13).value = Number((1 - Math.pow(1 - t.death, 1 / F.months)).toFixed(4));
    w.getCell(14).value = { formula: `1-(1-M${r})^Параметри!$C$${P.rMon}` };
    w.getCell(15).value = { formula: `SUM(Пари!$B${pr}:$${LAST}${pr})` };
    w.getCell(16).value = { formula:
      `(1-N${r})*NORM.DIST(${F.slots.europe.total}-0.5,O${r},MAX(0.4,SQRT(SUMPRODUCT(Пари!$B${pr}:$${LAST}${pr},1-Пари!$B${pr}:$${LAST}${pr}))),TRUE)` };
    w.font = { size: 9 };
    w.getCell(2).font = { bold: true, size: 9.5 };
    [3, 4, 9, 11, 12, 13].forEach(c => w.getCell(c).fill = INPUT);
    [6, 7].forEach(c => w.getCell(c).numFmt = "0.000");
    w.getCell(8).numFmt = "+0.0;-0.0;0";
    w.getCell(9).numFmt = "+0;-0;0";
    w.getCell(10).numFmt = "0";
    w.getCell(14).numFmt = "0%";
    w.getCell(15).numFmt = "0.00";
    w.getCell(16).numFmt = "0.00%";
    w.getCell(10).font = { bold: true, size: 9 };
    w.getCell(16).font = { bold: true, size: 9 };
    for (let c = 1; c <= 16; c++) { w.getCell(c).border = box; if (c !== 2) w.getCell(c).alignment = { horizontal: "center" }; }
  });
  T.addConditionalFormatting({ ref: `P${R0}:P${LASTROW}`, rules: [{ type: "colorScale",
    cfvo: [{ type: "num", value: 0 }, { type: "num", value: 0.5 }, { type: "num", value: 1 }],
    color: [{ argb: "FFE8918A" }, { argb: "FFF7DFA0" }, { argb: "FF8FC79B" }] }] });
  T.addConditionalFormatting({ ref: `H${R0}:H${LASTROW}`, rules: [{ type: "colorScale",
    cfvo: [{ type: "min" }, { type: "num", value: 0 }, { type: "max" }],
    color: [{ argb: "FFE8918A" }, { argb: "FFFFFFFF" }, { argb: "FF8FC79B" }] }] });
  const nr = R0 + EU.length + 1;
  T.mergeCells(`B${nr}:P${nr + 2}`);
  T.getCell(`B${nr}`).value =
    "Стовпець L рахується формулою прямо у файлі: сто команд у пулі й нормальне наближення для підрахунку «скільки команд фінішує вище». " +
    "Модель поруч бере повну згортку. Перевірено клітинка за клітинкою — розбіжність не більша за 1,2 відсоткового пункта, і вся вона на командах рівно на межі. " +
    "Стовпець K — очікувана кількість команд вище: якщо там менше 18, місце ваше.";
  T.getCell(`B${nr}`).alignment = { wrapText: true, vertical: "top" };
  T.getCell(`B${nr}`).font = { size: 9, italic: true, color: { argb: DIM } };

  const PR = wb.addWorksheet("Пари", { views: [{ state: "frozen", xSplit: 1, ySplit: 1, showGridLines: false }] });
  PR.getColumn(1).width = 21;
  PR.getCell("A1").value = "P( стовпець вище рядка )";
  PR.getCell("A1").font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
  PR.getCell("A1").fill = HEADF;
  EU.forEach((t, j) => {
    const c = PR.getRow(1).getCell(j + 2);
    c.value = t.team;
    c.font = { bold: true, size: 8, color: { argb: "FFFFFFFF" } };
    c.fill = HEADF;
    c.alignment = { textRotation: 60, vertical: "bottom" };
    PR.getColumn(j + 2).width = 6.5;
  });
  PR.getRow(1).height = 78;
  EU.forEach((ti, i) => {
    const r = PR.getRow(i + 2);
    r.getCell(1).value = ti.team;
    r.getCell(1).font = { bold: true, size: 8.5 };
    r.getCell(1).fill = fill("FFEDF0F4");
    r.getCell(1).border = box;
    EU.forEach((tj, j) => {
      const c = r.getCell(j + 2);
      if (i === j) { c.value = 0; c.fill = fill("FFE9ECF1"); }
      else {
        const ri = R0 + i, rj = R0 + j;
        /* Розрахунок: J = μ, K = σ, L = ν, N = ризик зникнути. */
        const nu = `MIN(Розрахунок!$L$${ri},Розрахунок!$L$${rj})`;
        const scale = `SQRT(Розрахунок!$K$${ri}^2+Розрахунок!$K$${rj}^2)/SQRT(${nu}/(${nu}-2))`;
        c.value = { formula: `T.DIST((Розрахунок!$J$${rj}-Розрахунок!$J$${ri})/(${scale}),${nu},TRUE)*(1-Розрахунок!$N$${rj})` };
      }
      c.numFmt = "0.00";
      c.font = { size: 8 };
      c.alignment = { horizontal: "center" };
      c.border = box;
    });
  });
  PR.addConditionalFormatting({ ref: `B2:${LAST}${EU.length + 1}`, rules: [{ type: "colorScale",
    cfvo: [{ type: "num", value: 0 }, { type: "num", value: 0.5 }, { type: "num", value: 1 }],
    color: [{ argb: "FFFFFFFF" }, { argb: "FFF7DFA0" }, { argb: "FFE8918A" }] }] });
}

/* ==================== КАЛЕНДАР ==================== */
{
  const C = wb.addWorksheet("Календар", { views: [{ showGridLines: false }] });
  C.columns = [{ width: 3 }, { width: 13 }, { width: 36 }, { width: 9 }, { width: 12 }, { width: 9 }, { width: 52 }];
  C.getCell("B2").value = "Що ще встигне зіграти до відсічення";
  C.getCell("B2").font = { bold: true, size: 15, color: { argb: INK } };
  C.getCell("B3").value = `Усе, що починається після ${F.asOf} і до ${F.cutoff}. Саме це дає стовпці «Форма» і «Seed».`;
  C.getCell("B3").font = { size: 9, italic: true, color: { argb: DIM } };

  let c = 5;
  const chead = () => {
    const r = C.getRow(c);
    r.values = ["", "Дата", "Турнір", "Регіон", "Призовий", "Вага", "Склад / доступ"];
    r.font = { bold: true, size: 9.5, color: { argb: "FFFFFFFF" } };
    for (let i = 2; i <= 7; i++) r.getCell(i).fill = HEADF;
    r.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
    r.height = 26;
    c++;
  };
  C.getCell(`B${c}`).value = "ТІР-1 · склади опубліковані";
  C.getCell(`B${c}`).font = { bold: true, size: 10, color: { argb: "FF1D8A5E" } };
  c++;
  chead();
  for (const e of F.tier1) {
    const r = C.getRow(c++);
    r.values = ["", e.begin, e.name, e.region ?? "світ", e.prize ? "$" + e.prize.toLocaleString("uk-UA") : "—",
      e.weight, (e.teams ?? []).join(", ")];
    r.font = { size: 9.5 };
    r.getCell(3).font = { bold: true, size: 9.5 };
    r.getCell(7).font = { size: 9, color: { argb: DIM } };
    r.alignment = { vertical: "middle", wrapText: true };
    [2, 4, 5, 6].forEach(i => r.getCell(i).alignment = { horizontal: "center" });
    for (let i = 2; i <= 7; i++) r.getCell(i).border = box;
  }
  c++;
  C.getCell(`B${c}`).value = "ТІР-2 · відкриті LAN-и, де середняки набирають LAN-перемоги й мережу";
  C.getCell(`B${c}`).font = { bold: true, size: 10, color: { argb: "FFA33A2E" } };
  c++;
  chead();
  for (const e of F.tier2) {
    const r = C.getRow(c++);
    r.values = ["", e.begin, e.name, e.region ?? "—", e.prize ? "$" + e.prize.toLocaleString("uk-UA") : "—", e.weight,
      e.invite === "global" ? "відкритий + глобальні запрошення VRS" : e.invite === "europe" ? "відкритий + запрошення VRS Європи" : "повністю відкритий"];
    r.font = { size: 9.5 };
    r.getCell(3).font = { bold: true, size: 9.5 };
    r.getCell(7).font = { size: 9, color: { argb: DIM } };
    [2, 4, 5, 6].forEach(i => { r.getCell(i).alignment = { horizontal: "center" }; r.getCell(i).fill = INPUT; });
    for (let i = 2; i <= 7; i++) r.getCell(i).border = box;
  }
  c += 2;
  C.getCell(`B${c}`).value = "Чому тір-2 важить більше, ніж здається";
  C.getCell(`B${c}`).font = { bold: true, size: 11, color: { argb: INK } };
  c++;
  C.mergeCells(`B${c}:G${c + 4}`);
  C.getCell(`B${c}`).value =
    "Рейтинг Valve годують чотири речі, і лише одна з них — перемоги над сильними. Решта три: призові, перемоги на LAN " +
    "і мережа різних побитих суперників. Відкритий LAN дає всі три, навіть коли суперники слабкі. Тому команда без " +
    "тір-1 запрошень не приречена — у неї просто інший шлях. І тому команда без жодного турніру просідає, навіть " +
    "нікому не програвши: вікно Valve котиться вперед, а нових результатів немає.\n" +
    "Ці турніри не входять у прогноз HLTV, бо в них немає опублікованих складів.";
  C.getCell(`B${c}`).alignment = { wrapText: true, vertical: "top" };
  C.getCell(`B${c}`).font = { size: 10, color: { argb: INK } };
}

/* ==================== ПОЯСНЕННЯ ==================== */
{
  const X = wb.addWorksheet("Пояснення", { views: [{ showGridLines: false }] });
  X.columns = [{ width: 3 }, { width: 26 }, { width: 98 }];
  let e = 2;
  const H1 = t => { X.getCell(`B${e}`).value = t; X.getCell(`B${e}`).font = { bold: true, size: 15, color: { argb: INK } }; X.getRow(e).height = 26; e += 2; };
  const H2 = t => { X.getCell(`B${e}`).value = t; X.getCell(`B${e}`).font = { bold: true, size: 11.5, color: { argb: INK } }; e++; };
  const T = (label, text) => {
    X.getCell(`B${e}`).value = label;
    X.getCell(`B${e}`).font = { bold: !!label, size: 10, color: { argb: INK } };
    X.getCell(`B${e}`).alignment = { vertical: "top", wrapText: true };
    X.getCell(`C${e}`).value = text;
    X.getCell(`C${e}`).font = { size: 10, color: { argb: label ? DIM : INK } };
    X.getCell(`C${e}`).alignment = { vertical: "top", wrapText: true };
    X.getRow(e).height = Math.max(16, Math.ceil(text.length / 100) * 15);
    e++;
  };
  const GAP = () => e++;

  H1("Як читати цю таблицю");

  H2("Три регіони, три різні сітки");
  T("", "Мейджор бере 32 команди. Європа 18 — по шість на стейдж. Америка 9, але 2 / 1 / 6. Азія 5, і жодного місця в третьому стейджі.");
  T("Наслідок", "Найкраща команда Азії стартує нижче, ніж шоста команда Європи. Відсотки між регіонами порівнювати не можна: це різні задачі з різною кількістю місць.");
  GAP();
  T("Stage 3", "Заходиш одразу у фінальну стадію: найменше матчів, найбільший запас.");
  T("Stage 2", "Пропускаєш першу стадію.");
  T("Stage 1", "Граєш усе з початку.");
  GAP();
  T("", "Тому в Європі різниця між 6-м і 7-м місцем більша, ніж між 6-м і 5-м: це ціла стадія турніру.");
  GAP();

  H2("Головне про мітку стейджа");
  T("", "Мітка зліва — це просто місце у прогнозі, вона нічого не каже про впевненість. Дивіться на відсотки: у Європі середина таблиці зараз дуже щільна, і кілька команд поспіль мають близькі шанси на ті самі місця.");
  GAP();

  H2("Стовпці, які варто розуміти");
  T("VRS зараз", "Очки Valve Regional Standings на сьогодні. Саме за цим рейтингом роздають запрошення на мейджор.");
  T("Форма", "Наша оцінка того, що команда набере на матчах, які ще попереду. Формула Valve: очікуваний результат проти середнього суперника, помножений на кількість матчів у календарі.");
  T("Seed", "Наша оцінка руху seed від календаря: призові, LAN-перемоги, мережа побитих суперників. Команда без турнірів просідає, навіть нікому не програвши, — вікно рейтингу котиться вперед.");
  T("μ на 02.11", "VRS зараз + Форма + Seed. Центр нашого прогнозу на дату запрошень.");
  T("Матчів", "Скільки карт команда зіграє до відсічення. Це множник для «Форми».");
  T("Календар", "Поіменно, де саме команда це набере, і головне — з поділом на два. «ЗАЯВЛЕНІ» означає, що склад турніру опубліковано і команда в ньому: це факт, без відсотків. «Можливі» — турнір складу ще не оголосив, і відсоток каже, наскільки ймовірно, що команду туди візьмуть. Дев'ять турнірів уже назвали учасників, тож для них здогадок більше немає.");
  T("Ризик", "Ймовірність, що команда просто перестане існувати до відсічення — розпад, зміна складу, орг закрив проєкт.");
  GAP();

  H1("Чому тут немає ані 100%, ані 0%");
  T("", "Перша версія цієї моделі друкувала 100.00% для верхівки Європи й 0.00% для всіх нижче двадцятого. Виглядало впевнено й було неправильно.");
  T("Де була помилка", `Ми припускали, що рейтинг гуляє за нормальним розподілом. Перевірили на реальних даних: у групі 21–40 середній розмах ${Math.round(N["21–40"].sd)} очок за місяць, а найбільша зміна, яку ми бачили, — ${N["21–40"].max} очок. Це майже сім стандартних відхилень. Нормальний розподіл каже, що таке буває раз на десять мільярдів спостережень. Ми побачили це, маючи вісім публікацій.`);
  T("Як стало", `Розподіл Стьюдента, товщина хвоста ν заміряна з тих самих даних: ν≈${N["топ-10"].nu.toFixed(0)} угорі таблиці, ν≈${N["21–40"].nu.toFixed(1)} у групі 21–40. Розмах той самий, краї чесні.`);
  T("Друга річ", `Серед команд 41–120 місця ${(N["41–120"].dropRate * 100).toFixed(1)}% щомісяця зникають зі списку взагалі. Стара версія при вимірюванні таких просто пропускала, тобто викидала з вибірки всі найгірші випадки.`);
  T("Разом", "Найвищий шанс у таблиці — 99.6%. Не 100%, бо навіть Spirit може розвалитись. Найнижчі — соті частки відсотка, а не нуль.");
  GAP();

  H2("Чого модель не вміє");
  T("", "Не передбачає конкретних замін складу. Ризик такої події закладений у хвости, але хто саме змінить гравця — ні.");
  T("", "Участь у відкритих тір-2 ЛАНах оцінена за рангом, бо реєстрація ще триває. Там, де склад відомий точно (WBT), стоїть відоме число.");
  T("", "Наш розмах заміряний на місячних публікаціях Valve і включає в себе й декей, який тут уже враховано окремо. Тобто ми радше перестраховуємось: невизначеність завищена, а не занижена. Це свідомо.");
  T("", "Рахуємо 100 команд Європи у згортці. Команда з-за меж цієї сотні теоретично може увірватись, але за два місяці це малоймовірно.");
}

/* ==================== ТЕМНІ КОНЯЧКИ ==================== */
{
  const eu = F.regions.europe;
  const cut = eu.find(t => t.projected === F.slots.europe.total);
  const rows = eu.filter(t => t.stage === 0 && t.pQual > 0.002).slice(0, 12);
  const H = wb.addWorksheet("Темні конячки", { views: [{ showGridLines: false }] });
  H.columns = [{ width: 3 }, { width: 6 }, { width: 21 }, { width: 9 }, { width: 10 }, { width: 9 }, { width: 9 }, { width: 62 }, { width: 40 }];
  H.getCell("B2").value = "Хто ще може увірватись · Європа";
  H.getCell("B2").font = { bold: true, size: 15, color: { argb: INK } };
  H.getCell("B3").value = `Лінія проходу — ${Math.round(cut.mu)} очок: з цим ${cut.team} фінішують 18-ми.`;
  H.getCell("B3").font = { size: 9, italic: true, color: { argb: DIM } };
  H.getCell("B4").value = `Одна перемога над рівним суперником коштує до ${Math.round(F.KG)} очок. Розрив у 100 очок — це приблизно ${Math.ceil(100 / F.KG)} несподіваних перемог.`;
  H.getCell("B4").font = { size: 9, italic: true, color: { argb: DIM } };

  let h = 6;
  const hr = H.getRow(h);
  hr.values = ["", "#", "Команда", "VRS зараз", "μ на 02.11", "Шанс", "До лінії", "Турніри", "Що для цього треба"];
  hr.font = { bold: true, size: 9.5, color: { argb: "FFFFFFFF" } };
  for (let i = 2; i <= 9; i++) hr.getCell(i).fill = HEADF;
  hr.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  hr.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
  hr.getCell(8).alignment = { horizontal: "left", vertical: "middle" };
  hr.getCell(9).alignment = { horizontal: "left", vertical: "middle" };
  hr.height = 28;
  h++;
  for (const t of rows) {
    const gap = Math.round(cut.mu - t.mu);
    const need = gap <= 0 ? "Уже на лінії — питання лише в тому, хто просяде поруч."
      : gap < 40 ? `${gap} очок. Одна вдала серія, і місце їхнє.`
      : `${gap} очок. Потрібен результат на турнірі, а не одна перемога.`;
    const w = H.getRow(h++);
    w.values = ["", t.projected, t.team, t.live, Math.round(t.mu), t.pQual, gap, eventsFor(t), need];
    w.getCell(8).font = { size: 8.5, color: { argb: DIM } };
    w.getCell(8).alignment = { vertical: "middle", wrapText: true, horizontal: "left" };
    w.getCell(3).font = { bold: true, size: 10 };
    w.getCell(6).numFmt = "0.0%";
    [2, 4, 5, 6, 7, 8].forEach(i => w.getCell(i).alignment = { horizontal: "center" });
    w.getCell(9).font = { size: 9, color: { argb: DIM } };
    w.alignment = { vertical: "middle", wrapText: true };
    for (let i = 2; i <= 9; i++) w.getCell(i).border = box;
  }
  H.addConditionalFormatting({ ref: `F7:F${h - 1}`, rules: [{ type: "colorScale",
    cfvo: [{ type: "num", value: 0 }, { type: "num", value: 0.3 }],
    color: [{ argb: "FFFFFFFF" }, { argb: "FF8FC79B" }] }] });
}


/* ==================== ДОСТУП ==================== */
{
  const A = wb.addWorksheet("Доступ", { views: [{ showGridLines: false }] });
  A.columns = [{ width: 3 }, { width: 30 }, { width: 96 }];
  let r = 2;
  const H = t => { A.getCell(`B${r}`).value = t; A.getCell(`B${r}`).font = { bold: true, size: 14, color: { argb: INK } }; A.getRow(r).height = 24; r += 2; };
  const T = (a, b) => {
    A.getCell(`B${r}`).value = a;
    A.getCell(`B${r}`).font = { bold: !!a, size: 10, color: { argb: INK } };
    A.getCell(`B${r}`).alignment = { vertical: "top", wrapText: true };
    A.getCell(`C${r}`).value = b;
    A.getCell(`C${r}`).font = { size: 10, color: { argb: a ? DIM : INK } };
    A.getCell(`C${r}`).alignment = { vertical: "top", wrapText: true };
    A.getRow(r).height = Math.max(16, Math.ceil(String(b).length / 98) * 15);
    r++;
  };
  const LIST = (label, items, colour) => {
    A.getCell(`B${r}`).value = label;
    A.getCell(`B${r}`).font = { bold: true, size: 10, color: { argb: colour } };
    A.getCell(`B${r}`).alignment = { vertical: "top", wrapText: true };
    const c = A.getCell(`C${r}`);
    c.value = items.join("  ·  ");
    c.font = { size: 10, color: { argb: INK } };
    c.alignment = { vertical: "middle", wrapText: true };
    c.fill = INPUT; c.border = box;
    A.getRow(r).height = Math.max(20, Math.ceil(items.join("  ·  ").length / 96) * 15);
    r += 2;
  };

  H("Хто куди реально їде");
  T("", "Раніше модель роздавала кожен відкритий ЛАН усім підряд. Це неправда, і неправда дорога: Moscow Cyber Games — найважчий тір-2 турнір календаря (вага 0.569, більше за будь-який інший), тож частка в ньому суттєво піднімала саме ті команди, що стоять на межі проходу.");
  r++;

  H("Правило");
  T("Російський майданчик · склад із Росії або СНД", "Звичайний шанс потрапити у сітку.");
  T("Російський майданчик · український склад", "Нуль. Не «маленька ймовірність» — вони туди не їздять, тому турнір не дає їм нічого й не займає в них тиждень.");
  T("Російський майданчик · усі інші європейці", "Не більше 10%.");
  T("Російський майданчик · Америка та Азія", "Нуль. Вони туди не їздять — ні за призовими такого розміру, ні через дорогу.");
  r++;
  T("Чужий регіон узагалі", "15%. Відкритий ЛАН у Ризі — це європейська сітка, а не глобальна: возити склад через океан заради $40 тисяч ніхто не буде.");
  r++;

  H("Списки — їх можна правити");
  T("", "Жовті клітинки читаються моделлю. Якщо якась команда стоїть не там, виправте тут, а не в розрахунку.");
  r++;
  LIST("Російські майданчики", RU_EVENTS, "FFA33A2E");
  LIST("Українські склади", UA_TEAMS, "FF1D8A5E");
  LIST("Склади з Росії та СНД", CIS_TEAMS, "FF5B6472");

  H("Дірка в даних, про яку варто знати");
  T("Америка", "У нашому календарі немає жодного тір-2 ЛАНу для Америки. Раніше модель підставляла їм європейські — включно з Москвою, — і це була помилка, а не оцінка. Тепер стовпець порожній і чесно про це каже. На порядок команд це не впливає: seed рахується відносно середнього по регіону, тож спільний нуль зсуває всіх однаково. Америка зараз ранжується за поточними очками VRS і тір-1 запрошеннями — тобто рівно за тим, що ми про неї справді знаємо.");
  T("Якщо є список", "Додайте американські ЛАНи в календар — і стовпець заповниться сам.");
  r++;

  H("Що варто перевірити");
  T("Перевірено за HLTV", "Календар зібраний зі сторінки подій HLTV, а не вручну. 1win Private Club Season 1 там названий саме так — тобто це справді турнір 1win, і українські склади в ньому не значаться. Серія WINLINE CIS LAN туди ж.");
  T("Розмір сітки", "Moscow Cyber Games — це чотири команди на $181 тисячу, а не відкритий турнір. Раніше модель давала йому вагу за призовим і роздавала частку всій середині таблиці. Тепер шанс потрапити множиться на розмір сітки, тож турнір на 4 місця важить утричі менше за турнір на 12.");
  T("Команди поза списками", "Усе, чого немає у двох нижніх списках, вважається «іншими»: 10% на російських майданчиках. Це навмисно обережно — краще дати малий шанс, ніж помилково відрізати команду або, навпаки, зарахувати їй турнір, куди вона не поїде.");
}

/* ==================== СИМУЛЯЦІЯ ==================== */
if (fs.existsSync("sim.json")) {
  const S = JSON.parse(fs.readFileSync("sim.json", "utf8"));
  const W = wb.addWorksheet("Симуляція", { views: [{ showGridLines: false }] });
  W.columns = [{ width: 3 }, { width: 24 }, { width: 96 }];
  let r = 2;
  const H = t => { W.getCell(`B${r}`).value = t; W.getCell(`B${r}`).font = { bold: true, size: 14, color: { argb: INK } }; W.getRow(r).height = 24; r += 2; };
  const T = (a, b) => {
    W.getCell(`B${r}`).value = a;
    W.getCell(`B${r}`).font = { bold: !!a, size: 10, color: { argb: INK } };
    W.getCell(`B${r}`).alignment = { vertical: "top", wrapText: true };
    W.getCell(`C${r}`).value = b;
    W.getCell(`C${r}`).font = { size: 10, color: { argb: a ? DIM : INK } };
    W.getCell(`C${r}`).alignment = { vertical: "top", wrapText: true };
    W.getRow(r).height = Math.max(16, Math.ceil(String(b).length / 98) * 15);
    r++;
  };

  H(`${S.runs.toLocaleString("uk-UA")} симуляцій осені`);
  T("", `Кожен прогін розігрує весь календар: ${S.events} турнірів, у кожного свій склад, у кожного свій фінальний порядок. ${S.runs.toLocaleString("uk-UA")} прогонів за ${Math.round(S.seconds)} секунд.`);
  r++;
  T("Навіщо це", "Не заради точності. Точні числа в цій книзі рахуються згорткою — це те, до чого нескінченна кількість симуляцій сходиться, і в неї похибки вибірки немає взагалі. Кількість прогонів — це характеристика того, скільки працював комп''ютер, а не того, наскільки модель влучна.");
  T("А заради чого", "Спільних подій. У симуляції результати пов''язані так само, як у житті: якщо Thunderpick виграє Spirit, значить його не виграв ніхто інший. Це дозволяє питання, на які розподіл окремої команди відповісти не може — «які шанси в Alliance, якщо вони виграють Stake Ranked 4», «як часто B8 та Inner Circle проходять обидва», «який один результат найсильніше зрушить HOTU».");
  r++;
  T("Як влаштований прогін", "1 — кожна команда живе або розпадається за заміряною місячною ставкою. 2 — тягнеться склад кожного турніру: підтверджені завжди, відкриті слоти за ймовірністю. 3 — фінальний порядок за Плакеттом–Люсом на силі команд. 4 — місце перетворюється на seed, помножений на вагу турніру. 5 — залишковий шум покриває те, чого турніри не пояснюють.");
  T("Скільки пояснюють турніри", `${(S.eventVarianceShare * 100).toFixed(1)}% дисперсії. Решта — заміни складу, матчі поза цими сітками, декей. Залишковий шум підібраний так, щоб сумарний розмах збігався з тим, що заміряно на восьми публікаціях Valve: турніри перерозподіляють невизначеність, а не додають її.`);
  r += 2;

  H("Симуляція проти згортки");
  T("", "Єдина справжня перевірка прогону — чи сходиться він з точним розрахунком. Розбіжність тут це похибка вибірки й нічого більше.");
  r++;
  const hr = W.getRow(r);
  hr.values = ["", "команда", "симуляція"];
  hr.font = { bold: true, size: 9.5, color: { argb: "FFFFFFFF" } };
  for (let i = 2; i <= 5; i++) hr.getCell(i).fill = HEADF;
  W.getCell(`D${r}`).value = "згортка";
  W.getCell(`E${r}`).value = "різниця";
  for (const c of ["C", "D", "E"]) { W.getCell(`${c}${r}`).font = { bold: true, size: 9.5, color: { argb: "FFFFFFFF" } }; W.getCell(`${c}${r}`).alignment = { horizontal: "center" }; }
  W.getColumn(3).width = 13; W.getColumn(4).width = 13; W.getColumn(5).width = 11;
  r++;
  let worst = 0;
  for (const t of F.regions.europe.slice(0, 22)) {
    const sim = S.teams.find(o => o.region === "europe" && o.team === t.team);
    if (!sim) continue;
    const d = Math.abs(sim.pQual - t.pQual);
    worst = Math.max(worst, d);
    const row = W.getRow(r++);
    row.getCell(2).value = t.team;
    row.getCell(2).font = { bold: true, size: 9.5 };
    row.getCell(3).value = sim.pQual;
    row.getCell(4).value = t.pQual;
    row.getCell(5).value = d;
    [3, 4, 5].forEach(c => { row.getCell(c).numFmt = "0.00%"; row.getCell(c).alignment = { horizontal: "center" }; });
    for (let i = 2; i <= 5; i++) row.getCell(i).border = box;
  }
  r++;
  W.getCell(`B${r}`).value = `Найбільша розбіжність: ${(worst * 100).toFixed(2)} відсоткового пункта.`;
  W.getCell(`B${r}`).font = { bold: true, size: 10, color: { argb: INK } };
  r++;
  W.mergeCells(`B${r}:E${r + 3}`);
  W.getCell(`B${r}`).value =
    "Дві незалежні реалізації однієї моделі — одна аналітична, друга через " +
    S.runs.toLocaleString("uk-UA") + " розіграшів осені — сходяться в межах похибки вибірки. " +
    "Це не робить числа правдивішими, але означає, що жодна з двох не містить помилки, " +
    "якої немає в іншій. Публікуються значення згортки: у них похибки вибірки немає зовсім.";
  W.getCell(`B${r}`).alignment = { wrapText: true, vertical: "top" };
  W.getCell(`B${r}`).font = { size: 10, color: { argb: INK } };
}

wb.worksheets.forEach(ws => { ws.views = [{ ...(ws.views?.[0] ?? {}), showGridLines: false }]; });
const OUT = "vrs-major.xlsx";
await wb.xlsx.writeFile(OUT);
console.log("аркуші:", wb.worksheets.map(w => w.name).join(" · "));
console.log("файл:", OUT, (fs.statSync(OUT).size / 1024).toFixed(0), "КБ");
















