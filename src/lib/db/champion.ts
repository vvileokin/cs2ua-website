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

export const getChampionTally = cache(async (): Promise<ChampionTally> => {
  const sb = await createClient();
  const { data } = await sb.from("major_champion_tally").select("team, votes");

  const byTeam: Record<string, number> = {};
  let total = 0;
  for (const r of data ?? []) {
    const n = (r.votes as number) ?? 0;
    byTeam[r.team as string] = n;
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
