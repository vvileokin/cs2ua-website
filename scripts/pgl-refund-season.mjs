import fs from "node:fs";

/**
 * Повернути сезонні поінти тим, хто встиг поставити на PGL до міграції.
 *
 * Матчі залили раніше, ніж 0089 додала `pgl-masters-bucharest-2026` у
 * `event_tournaments`. А `place_bet` (0079) дивиться саме в цю таблицю: турніру
 * в ній немає — значить ставка звичайна, і списує вона сезонне золото. Тож
 * перші ставки на PGL пішли не з того гаманця.
 *
 * Зворотна дія точна, бо пряма проста: для сезонної ставки `place_bet` робить
 * рівно `points = points - stake` і більше нічого — ні `event_joined_at`, ні
 * лічильників. Отже повернення — це `points + stake` і зняття рядка ставки.
 *
 * Рядки саме видаляються, а не переписуються на `wallet = 'event'`. Переписати
 * означало б лишити ставку, за яку ніхто не заплатив: івентовий гаманець її не
 * бачив, а 0089 скидає всі баланси до 500 і слід від списання зник би.
 * Безплатна ставка — гірша відповідь, ніж попросити поставити ще раз.
 *
 * Беруться тільки нерозраховані ставки. Розрахована вже віддала виплату в
 * обидві колонки (0075), і повертати там нічого — якби така знайшлась, скрипт
 * про неї скаже й не чіпатиме.
 *
 * Запуск: node scripts/pgl-refund-season.mjs --apply
 */

const ENV = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB = ENV.NEXT_PUBLIC_SUPABASE_URL;
const KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };
const APPLY = process.argv.includes("--apply");

const get = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};

const bets = await get(
  "bets?select=user_id,question_id,option_id,stake,wallet,settled_at" +
  "&question_id=like.*pgl26&wallet=eq.season&order=created_at",
);
const settled = bets.filter((b) => b.settled_at);
const open = bets.filter((b) => !b.settled_at);
if (settled.length) {
  console.log(`увага: ${settled.length} ставок уже розраховано — їх не чіпаємо\n`);
}

if (!open.length) {
  console.log("сезонних ставок на PGL немає — повертати нема чого");
} else {
  const owed = new Map();
  for (const b of open) owed.set(b.user_id, (owed.get(b.user_id) ?? 0) + b.stake);

  const people = await get(
    `profiles?select=id,handle,points&id=in.(${[...owed.keys()].join(",")})`,
  );
  const by = new Map(people.map((p) => [p.id, p]));

  console.log(`сезонних ставок на PGL: ${open.length} на ${owed.size} людей\n`);
  console.log("гравець              ставок   до повернення   сезонні зараз → стане");
  for (const [id, sum] of owed) {
    const p = by.get(id);
    const n = open.filter((b) => b.user_id === id).length;
    console.log(
      `  ${String(p?.handle ?? id).padEnd(20)}${String(n).padStart(4)}` +
      `${String(sum).padStart(14)}${String(p?.points ?? "?").padStart(16)} → ${(p?.points ?? 0) + sum}`,
    );
  }
  const total = [...owed.values()].reduce((s, x) => s + x, 0);
  console.log(`\nразом до повернення: ${total} сезонних поінтів`);

  if (!APPLY) {
    console.log("\nпробний прогін — нічого не змінено. --apply щоб повернути");
  } else {
    /* Спершу гроші, потім зняття ставки. Якщо впаде між цими двома кроками, у
       людини буде зайвий баланс і жива ставка — це видно й виправляється. У
       зворотному порядку ставка зникла б, а поінти ні, і слід загубився б. */
    console.log();
    for (const [id, sum] of owed) {
      const p = by.get(id);
      const r = await fetch(`${SB}/rest/v1/profiles?id=eq.${id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ points: (p?.points ?? 0) + sum }),
      });
      if (!r.ok) throw new Error(`profiles ${id}: ${r.status} ${await r.text()}`);
      console.log(`повернено ${String(sum).padStart(5)} → ${p?.handle ?? id}`);
    }

    for (const b of open) {
      const q = `user_id=eq.${b.user_id}&question_id=eq.${encodeURIComponent(b.question_id)}`;
      const r = await fetch(`${SB}/rest/v1/bets?${q}&wallet=eq.season&settled_at=is.null`, {
        method: "DELETE", headers,
      });
      if (!r.ok) throw new Error(`bets ${b.question_id}: ${r.status} ${await r.text()}`);
    }
    console.log(`\nзнято ставок: ${open.length}`);
    console.log("після 0089 їх можна поставити заново — уже з івентового гаманця");
  }
}
