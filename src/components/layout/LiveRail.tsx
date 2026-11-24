"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { findTeam, type Match, type Team } from "@/lib/data";

/**
 * Що грається просто зараз — у підніжжі рейки, просто над «Пікемами».
 *
 * Спершу блок стояв одразу під меню, у верху порожньої половини, і висів там
 * сам по собі: без рамки, без фону, чотири рядки тексту на чорному. Нижче
 * лежало двісті пікселів порожнечі, а ще нижче — клітинка мейджора. Виходило,
 * що найживіше на сторінці стоїть найдалі від того, з чим воно пов'язане.
 *
 * Тепер це один об'єкт із клітинкою під ним: той самий тьмяний вуглик у
 * лівому нижньому куті, та сама червона волосина замість сірої рамки. Два
 * блоки в підніжжі читаються як одна річ — подія і те, що в ній зараз іде, —
 * а порожнеча пішла туди, де порожнеча й має бути: між меню і підніжжям.
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
    <section className="live-cell overflow-hidden rounded-lg">
      <p className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-2 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--major-hot)]">
        {/* Крапка б'ється, бо саме вона тут і є новиною: решта блоку — це
            імена й числа, які виглядають однаково й тоді, коли все давно
            скінчилось. */}
        <span className="live-dot size-1.5 rounded-full bg-[var(--live)]" />
        Зараз грають
      </p>

      {/* Межа на випадок, якого ще не було: вісім матчів одночасно виштовхали
          б «Пікеми» за край екрана. Блок радше прокрутиться всередині себе,
          ніж забере місце в того, що під ним. */}
      <div className="live-divide max-h-[38vh] overflow-y-auto">
        {live.map((m) => {
          const a = side(m, "a");
          const b = side(m, "b");
          if (!a || !b) return null;
          const aWin = m.scoreA > m.scoreB;
          const bWin = m.scoreB > m.scoreA;
          /* Формат і мапа — поруч, бо поодинці вони неповні. «BO3» каже, що
             означає нуль у рахунку; «Mirage» каже, де вони зараз. Разом це
             один рядок на вісім символів, і він звільняє рахунок від роботи
             пояснювати самого себе. */
          const meta = [m.format, m.liveMapLabel].filter(Boolean).join(" · ");
          return (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="block px-2.5 py-2 transition-colors duration-150 hover:bg-white/[0.045]"
            >
              {meta && (
                <p className="mb-1 text-[0.5625rem] font-bold uppercase tracking-wide text-ink-dim">
                  {meta}
                </p>
              )}
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
    </section>
  );
}
