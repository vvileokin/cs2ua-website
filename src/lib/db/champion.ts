import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Голосування «хто візьме мейджор» — читання.
 *
 * Запис іде через `vote_major_champion` (0097): там і замок, і перевірка, що
 * команда взагалі на мейджорі. Тут тільки підрахунок і власний голос.
 */

export type ChampionTally = {
  /** Скільки голосів у кожної команди. Команди без голосів сюди не
   *  потрапляють — нуль це відсутність рядка, а не рядок із нулем. */
  byTeam: Record<string, number>;
  total: number;
};

/**
 * Частки голосів.
 *
 * Функція, а не в'юха. Порахувати це, бачачи лише власний голос, неможливо —
 * з увімкненим RLS кожен бачив би «100% за мою команду», — тож підрахунок
 * мусить іти правами власника. В'юха з такими правами це постійно відчинені
 * двері в таблицю, і те, що крізь них проходить лише `group by`, тримається
 * тільки на її тексті; у функції межа стоїть у сигнатурі, яка нічого, крім
 * слага й числа, повернути не може. Деталі — у 0099.
 */
export const getChampionTally = cache(async (): Promise<ChampionTally> => {
  const sb = await createClient();

  /* Функція з 0099, а поки її немає — в'юха з 0097. Без цього між деплоєм і
     міграцією голоси зникали б: запит до неіснуючої функції повертає помилку,
     і сторінка чесно казала б «голосів ще немає», маючи їх у базі. */
  const call = await sb.rpc("major_champion_tally");
  const rows = call.error
    ? (await sb.from("major_champion_tally").select("team, votes")).data
    : call.data;

  const byTeam: Record<string, number> = {};
  let total = 0;
  for (const r of (rows as { team: string; votes: number }[] | null) ?? []) {
    const n = r.votes ?? 0;
    byTeam[r.team] = n;
    total += n;
  }
  return { byTeam, total };
});

/** Власний голос або `null`. Для гостя — завжди `null`. */
export const getMyChampionVote = cache(async (): Promise<string | null> => {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("major_champion_vote")
    .select("team")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.team as string | undefined) ?? null;
});
