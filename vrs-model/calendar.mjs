/**
 * Усе, що грається до того, як роздадуть запрошення на мейджор.
 *
 * Стан на 2 жовтня. Три турніри тир-1 лишилися попереду, і склад кожного вже
 * остаточний — кваліфікацій на них більше нема, тож вільних місць у цьому
 * файлі теж нема.
 *
 * Відсічення жорстке: 2 листопада роздають запрошення, тому IEM Beijing
 * (починається того ж дня) і все після нього поза моделлю.
 */
export const CUTOFF = "2026-11-02";

/**
 * Вага турніру від призового фонду — крива, на якій сидять усі події,
 * що вже були в моделі.
 */
const CURVE = [
  [3_392, 0.288], [10_991, 0.338], [13_942, 0.350], [40_000, 0.417],
  [100_000, 0.500], [174_777, 0.569], [500_000, 0.650], [1_000_000, 0.720],
];
export const weightOf = prize => {
  const x = Math.log10(Math.max(1_000, prize));
  const pts = CURVE.map(([p, w]) => [Math.log10(p), w]);
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts.at(-1)[0]) return pts.at(-1)[1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (x <= x1) return Math.round((y0 + (y1 - y0) * (x - x0) / (x1 - x0)) * 1000) / 1000;
  }
  return pts.at(-1)[1];
};

/* ---- тір-1: опубліковані склади ---- */
export const TIER1 = [
  /**
   * ESL Pro League Season 24 — Катовіце, починається 3 жовтня.
   * Дванадцять запрошень за рейтингом і чотири місця з фіналів ESL
   * Challenger League: M80 (Північна Америка), TYLOO (Азія), 1win (Європа),
   * ShindeN (Південна Америка).
   */
  { name: "ESL Pro League Season 24", begin: "2026-10-03", end: "2026-10-11",
    prize: 1_000_000, slots: 16, weight: 0.72, perTeam: 6,
    teams: ["Spirit", "Vitality", "FURIA", "MOUZ", "Falcons", "Legacy", "G2", "Aurora",
            "Natus Vincere", "BETBOOM", "9z", "PARIVISION", "M80", "TYLOO", "1win", "ShindeN"] },

  /**
   * Thunderpick World Championship — Мальта, 14–18 жовтня.
   * Сім запрошень за глобальним рейтингом і Virtus.pro із закритої
   * кваліфікації. Spirit, MOUZ, Vitality і NaVi туди не їдуть — у вересні
   * модель припускала протилежне, бо склад ще не був опублікований.
   */
  { name: "Thunderpick World Championship", begin: "2026-10-14", end: "2026-10-18",
    prize: 1_000_000, slots: 8, weight: 0.72, perTeam: 4,
    teams: ["FURIA", "Falcons", "Legacy", "Aurora", "BETBOOM", "9z", "PARIVISION", "Virtus.pro"] },

  /**
   * PGL Masters Bucharest — 24–31 жовтня, останній великий турнір до
   * відсічення. Дванадцять за рейтингом і четверо переможців закритих
   * кваліфікацій: Nemiga (Європа), DENDELE (Південна Америка), Liquid
   * (Північна Америка), TYLOO (Азія).
   */
  { name: "PGL Masters Bucharest", begin: "2026-10-24", end: "2026-10-31",
    prize: 1_250_000, slots: 16, weight: 0.72, perTeam: 6,
    /* B8 тут були як заміна — вони знялися зі Stake Ranked 5 саме під це, — але
       підтвердження досі немає, тільки наміри. Турнір на 1,25 млн за тиждень до
       відсічення коштує забагато, щоб давати його командою за здогадкою: він
       сам по собі витягував їх на вісім пунктів. Повернути, коли склад
       оголосять. Їхній підтверджений ЛАН — Tesla Cup, він у fields-manual. */
    teams: ["Spirit", "Vitality", "FURIA", "MOUZ", "Legacy", "FUT", "G2", "Aurora",
            "Natus Vincere", "BETBOOM", "The MongolZ", "9z", "Liquid", "TYLOO",
            "Nemiga", "DENDELE"],
    /* Хто вже вилетів. Для них турнір скінчився, і здобуті призові HLTV уже
       порахував — отже подія більше не можливість, а минуле. Без цього рядка
       модель додавала їм бонус за мільйонний ЛАН попереду: TYLOO і DENDELE
       отримували по 52 і 59 очок за турнір, з якого поїхали.

       Станом на вечір 28 жовтня: G2 і 9z поїхали з 0-3; TYLOO, Legacy і
       DENDELE — з 1-3; п'ятий тур додав The MongolZ і Liquid, які програли
       Nemiga та FURIA. Дописувати після кожного туру, як для тир-2 у
       fields-page. */
    out: ["G2", "9z", "TYLOO", "Legacy", "DENDELE", "The MongolZ", "Liquid"] },
];

/* ---- тір-2 приходить із календаря LAN-ів дентена ---- */
export { TIER2 } from "./lans.mjs";
