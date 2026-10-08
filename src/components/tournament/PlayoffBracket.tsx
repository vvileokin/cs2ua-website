"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam, type Match } from "@/lib/data";
import { playoffState, PLAYOFF, type PlayoffCell } from "@/lib/playoff";
import { cn } from "@/lib/utils";

/**
 * Плейоф — тією самою мовою, що й швейцарка.
 *
 * Картка тут така сама: два герби, «vs» між ними, рахунок під гербами в
 * дограних. Це навмисно. Обидві сітки стоять на одній сторінці одна під одною,
 * і якби плейоф малювався інакше — лініями, таблицею, чим завгодно, — читач
 * мусив би вчити другу нотацію для того самого турніру.
 *
 * Відмінність лише в тому, чим колонки підписані: у швейцарці це рахунок, з
 * яким заходять у матч, тут — стадія. І в тому, що кожна наступна колонка
 * удвічі коротша, тож вони вирівняні по центру — так пара видно навпроти тих
 * двох, з яких вона складеться.
 */
export function PlayoffBracket({ matches }: { matches: Match[] }) {
  const rounds = React.useMemo(() => playoffState(matches), [matches]);

  return (
    <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
      <div className="flex min-w-[36rem] items-center gap-4">
        {rounds.map((cells, i) => (
          <section key={PLAYOFF[i].key} className="flex w-[11rem] shrink-0 flex-col gap-3">
            <p className="font-mono text-sm font-bold leading-none text-[rgb(var(--skin-ring))]">
              {PLAYOFF[i].label}
            </p>
            {/* Проміжок росте разом із колонкою: у чвертьфіналах чотири картки
                стоять щільно, а фінал один — йому порожнеча навколо і дає
                видимість. */}
            <div className={cn("flex flex-col", ["gap-2", "gap-10", "gap-2"][i])}>
              {cells.map((cell) => (
                <Pair key={cell.slot.id} cell={cell} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Pair({ cell }: { cell: PlayoffCell }) {
  const m = cell.match;
  const done = m?.status === "finished";
  const live = m?.status === "live";
  const winner = m && done && m.scoreA !== m.scoreB ? (m.scoreA > m.scoreB ? m.a : m.b) : undefined;

  const body = (
    <div
      className={cn(
        "flex items-center justify-between gap-1 rounded-lg px-2.5 py-2",
        "bg-[rgb(var(--skin-deep)/0.5)] shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.28)]",
        live && "bg-[rgb(var(--skin-glow)/0.16)] shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.7)]",
      )}
    >
      <Corner slug={cell.a} score={done ? m?.scoreA : undefined} won={winner === m?.a} />
      <span className="shrink-0 text-[0.625rem] font-bold uppercase text-[rgb(var(--skin-ring)/0.5)]">vs</span>
      <Corner slug={cell.b} score={done ? m?.scoreB : undefined} won={winner === m?.b} />
    </div>
  );

  return m ? (
    <Link href={`/matches/${m.id}`} className="block transition-opacity hover:opacity-85">
      {body}
    </Link>
  ) : (
    body
  );
}

function Corner({ slug, score, won }: { slug?: string; score?: number; won?: boolean }) {
  const t = slug ? getTeam(slug) : undefined;
  return (
    <div className="flex flex-col items-center gap-0.5">
      {t ? (
        <TeamLogo team={t} size="cardCrest" />
      ) : (
        <span className="grid size-[2.125rem] place-items-center rounded-md bg-black/30 text-xs font-bold text-[rgb(var(--skin-ring)/0.35)]">
          ?
        </span>
      )}
      {score !== undefined && (
        <span
          className={cn(
            "tnum font-mono text-[0.6875rem] font-bold leading-none",
            won ? "text-[rgb(var(--skin-ring))]" : "text-white/40",
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
