"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { findTeam, type Match, type Team } from "@/lib/data";

/**
 * Що грається просто зараз — у порожній половині рейки.
 *
 * Під п'ятьма пунктами меню стояло двісті пікселів чорноти, а на сайті про
 * матчі єдине, чого там бракувало, — це матчі. Рейка тепер відповідає на
 * питання «що відбувається», не питаючи нікуди переходити.
 *
 * Нічого не малюється, коли нічого не йде. Порожній заголовок «зараз грають»
 * над порожнечею гірший за саму порожнечу: він обіцяє те, чого немає, і
 * робить тишу схожою на поломку.
 *
 * Рахунок перепитується раз на хвилину. Частіше не треба — мапа в CS триває
 * десятки хвилин, і єдине, що тут змінюється часто, це рахунок по раундах,
 * якого ця рейка свідомо не показує: на 248 пікселях ширини вона має сказати
 * «хто з ким і як стоїть по мапах», а не замінити сторінку матчу.
 */
const REFRESH_MS = 60_000;

function side(m: Match, which: "a" | "b"): Team | null {
  return (which === "a" ? m.teamAData : m.teamBData) ?? findTeam(which === "a" ? m.a : m.b);
}

export function LiveRail({ initial }: { initial: Match[] }) {
  const [live, setLive] = useState(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        /* Відповідь без списку лишає на екрані те, що вже є: застиглий
           рахунок менш шкідливий за рейку, що блимає в порожнечу на кожному
           невдалому запиті. */
        if (alive && Array.isArray(j.live)) setLive(j.live);
      } catch {
        /* Мережа відпала — лишаємо попереднє. */
      }
    };
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!live.length) return null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-1">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-[0.625rem] font-semibold uppercase tracking-wide text-ink-dim">
        <span className="size-1.5 rounded-full bg-[var(--live)]" />
        Зараз грають
      </p>

      <div className="space-y-1">
        {live.map((m) => {
          const a = side(m, "a");
          const b = side(m, "b");
          if (!a || !b) return null;
          const aWin = m.scoreA > m.scoreB;
          const bWin = m.scoreB > m.scoreA;
          return (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="block rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-surface-2"
            >
              {[
                { team: a, score: m.scoreA, lead: aWin },
                { team: b, score: m.scoreB, lead: bWin },
              ].map(({ team, score, lead }) => (
                <div key={team.slug} className="flex h-6 items-center gap-2">
                  <TeamLogo team={team} size="xs" />
                  {/* Тег, а не назва: «Ninjas in Pyjamas» у цю ширину не
                      влізе, а «NIP» читається з одного погляду. */}
                  <span
                    className={
                      lead
                        ? "flex-1 truncate text-[0.8125rem] font-extrabold text-ink"
                        : "flex-1 truncate text-[0.8125rem] font-bold text-ink-muted"
                    }
                  >
                    {team.tag}
                  </span>
                  <span
                    className={
                      lead
                        ? "text-[0.8125rem] font-extrabold tabular-nums text-ink"
                        : "text-[0.8125rem] font-bold tabular-nums text-ink-dim"
                    }
                  >
                    {score}
                  </span>
                </div>
              ))}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
