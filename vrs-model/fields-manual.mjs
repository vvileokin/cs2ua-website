/**
 * Склади, яких немає в книзі дентена.
 *
 * `fields.mjs` збирається скриптом із реєстраційних таблиць і руками не
 * правиться — тому все, що приходить з іншого джерела, лежить тут і
 * домішується зверху.
 *
 * Звідки це: сторінки подій на HLTV, розділ «Teams attending». Там стоїть
 * повний список із підставою запрошення, тож це факт, а не здогадка.
 *
 * Навіщо знадобилося. Книга не знає азійського й океанського регіонів: на всіх
 * там три події, і модель роздавала Sashi, 5star та FlyQuest однакові
 * «можливо, зіграють» по 17–34%. Гірше інше: без складу подія не має з ким
 * порівнювати, і `fieldWeight` для неї дорівнює одиниці. Тобто FlyQuest, які в
 * Океанії сильніші за все поле на двісті позицій рейтингу, діставали за ці
 * турніри рівно стільки ж, скільки дістав би середняк. Саме тут і ховалася
 * шістдесятипунктова розбіжність із Mischief.
 */
export const MANUAL_FIELDS = {
  /* FlyQuest — три події до відсічення, усі в Океанії, і в кожній вони перший
     номер із великим відривом (#75 проти #102 у найближчого). */
  "ANZC Locals Spring 2026": {
    tbd: 0,
    teams: ["FlyQuest", "Ground Zero", "Abyssal", "Rooster", "Mindfreak",
            "THUNDER dOWNUNDER", "OUREA", "sunday school"],
  },
  "Logitech G PRO Series": {
    tbd: 0,
    teams: ["FlyQuest", "NEXVOID", "Rare Atom", "The Huns", "Ground Zero",
            "Abyssal", "Rooster", "THUNDER dOWNUNDER"],
  },
  "DFRAG Invitational": {
    /* Восьме місце розіграють у Last Chance Qualifier. */
    tbd: 1,
    teams: ["FlyQuest", "NEXVOID", "Alter Ego", "Ground Zero", "Abyssal",
            "Rooster", "Finishers"],
  },

  /* Тут більше немає ні Tesla Cup, ні Sashi, і обидва зникли з причини, а не
     за прибиранням.

     Tesla Cup тримався вручну, бо книга станом на 2 жовтня знала там десять
     команд і жодної з них не звали B8. У свіжій книзі реєстрація відкрита й
     заповнена: двадцять дев'ять рейтингових заявок, B8 серед них. Ручний запис
     став би гіршою копією справжнього списку.

     Sashi дописувались у три європейські події, щоб модель бачила їхній
     календар. Новим правилом Valve вони запрошення отримати не можуть і зняті
     з таблиці в vrs.mjs, тож дописувати їх нема куди. */
};

/**
 * Склад події з книги, доповнений ручним списком.
 *
 * Запис виду `{ add: [...] }` дописує команди до наявного складу і забирає
 * стільки ж нерозіграних місць — поле має стільки учасників, скільки має.
 * Повний запис `{ tbd, teams }` замінює книгу цілком: там, де в неї події
 * просто немає, заміняти нічого.
 */
export function withManual(fields) {
  const out = { ...fields };
  for (const [event, spec] of Object.entries(MANUAL_FIELDS)) {
    if (Array.isArray(spec.teams)) { out[event] = { tbd: spec.tbd ?? 0, teams: spec.teams }; continue; }
    const have = out[event] ?? { tbd: 0, teams: [] };
    const known = new Set(have.teams.map((t) => String(t).toLowerCase()));
    const added = (spec.add ?? []).filter((t) => !known.has(t.toLowerCase()));
    out[event] = {
      tbd: Math.max(0, (have.tbd ?? 0) - added.length),
      teams: [...have.teams, ...added],
    };
  }
  return out;
}
