import { NextResponse } from "next/server";
import { getLiveTeamMatches } from "@/lib/db/matches";

/**
 * Матчі, що йдуть просто зараз — для рейки в сайдбарі.
 *
 * Сайдбар живе в layout, а layout малюється один раз на навігацію. Людина ж
 * тримає сайт відкритим годинами, і рахунок на ній застигав би на тому, яким
 * був у момент заходу. Тому дані приходять сюди, а компонент перепитує їх раз
 * на хвилину.
 *
 * `getLiveTeamMatches` віддає мапу «слуг команди → матч», тобто кожна серія
 * лежить там двічі, з обох боків. Тут вона згортається назад у список.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const byTeam = await getLiveTeamMatches();
  const seen = new Set<string>();
  const live = [];
  for (const m of byTeam.values()) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    live.push(m);
  }
  /* Найраніші зверху: серія, що почалась першою, найближча до розв'язки. */
  live.sort((x, y) => x.startISO.localeCompare(y.startISO));
  return NextResponse.json({ live });
}
