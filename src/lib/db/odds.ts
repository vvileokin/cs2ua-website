import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Шанси — читання.
 *
 * Рахує їх скрипт (`scripts/major-odds.mjs`), бо для цього потрібні очки VRS
 * і крива ймовірності перемоги, а те й те живе поза застосунком. Сайт тільки
 * показує те, що вже пораховано, — рівно як із прогнозом відбору з 0077.
 *
 * Усе тут переживає невиконану міграцію: поки 0098 не запущена, колонки й
 * таблиці немає, запит повертає помилку, і сторінка просто малюється без
 * відсотків. Шанси — добавка до картки, а не умова її існування.
 */

/** Шанси однієї команди: 3:0, прохід, 0:3. */
export type TeamOdds = { w: number; a: number; o: number };

export type StageOdds = {
  byTeam: Record<string, TeamOdds>;
  /** Коли рахували. Без цього число — просто число. */
  at: string | null;
};

export type CardOdds = {
  /** Шанс потрапити в десятку, якій їдуть скіни. До замка — null. */
  pPrize: number | null;
  evPoints: number;
  evHits: number;
  /** Шанс кожного власного вибору: слаг → ймовірність саме тієї ролі. */
  pPick: Record<string, number>;
  dist: number[];
};

export const getStageOdds = cache(async (stage: number): Promise<StageOdds> => {
  const sb = await createClient();
  const { data } = await sb
    .from("major_stages")
    .select("odds, odds_at")
    .eq("stage", stage)
    .maybeSingle();

  return {
    byTeam: (data?.odds as Record<string, TeamOdds> | null) ?? {},
    at: (data?.odds_at as string | null) ?? null,
  };
});

export const getMyOdds = cache(async (stage: number): Promise<CardOdds | null> => {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("major_pickem_odds")
    .select("p_prize, ev_points, ev_hits, p_pick, dist")
    .eq("stage", stage)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    pPrize: (data.p_prize as number | null) ?? null,
    evPoints: (data.ev_points as number) ?? 0,
    evHits: (data.ev_hits as number) ?? 0,
    pPick: (data.p_pick as Record<string, number>) ?? {},
    dist: (data.dist as number[]) ?? [],
  };
});
