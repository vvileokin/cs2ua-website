import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Чого вартий цей матч у гонці за інвайт на мейджор.
 *
 * Дві гілки на команду: що станеться з її шансом, якщо вона виграє, і що —
 * якщо програє. Рахує офлайн та сама модель, що друкує сторінку інвайтів
 * (swing.mjs поруч із final15.mjs), і кладе в `match_vrs_swing` — див. 0086.
 * Тут нічого не рахується: HLTV не віддає таблицю звичайним запитом, а згортка
 * на 128 точках не те, що роблять усередині маршруту.
 *
 * Порожня мапа, коли чисел немає: матч не з тих, що рухають таблицю, модель ще
 * не рахувала його, або міграція не запущена. Сторінка тоді просто не малює
 * цього блоку — як було до нього.
 */
export type Swing = { pNow: number; pWin: number; pLose: number };

export const getMatchSwing = cache(async function getMatchSwing(
  matchId: string,
): Promise<Map<string, Swing>> {
  const out = new Map<string, Swing>();
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("match_vrs_swing")
      .select("team_slug, p_now, p_win, p_lose")
      .eq("match_id", matchId);

    for (const r of data ?? []) {
      out.set(r.team_slug as string, {
        pNow: r.p_now as number,
        pWin: r.p_win as number,
        pLose: r.p_lose as number,
      });
    }
  } catch {
    /* Немає таблиці — немає блоку. */
  }
  return out;
});
