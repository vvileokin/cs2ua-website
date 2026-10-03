"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam, slotTimeLabel, type Match } from "@/lib/data";
import { swissState, SWISS_THROUGH, SWISS_OUT, SWISS_BUCKET_SIZE } from "@/lib/swiss";
import { cn } from "@/lib/utils";

/**
 * Швейцарка EPL S24 — повна форма турніру, а не те, що встигли зіграти.
 *
 * Колонки стоять так, як поле ділиться: спільний старт 0:0, далі гілка
 * переможців угору, програлих униз, і з кожним туром на одну пару менше.
 * Праворуч — два підсумки: хто вже вийшов і хто вже вилетів, розкладені за
 * рахунком, бо 3:0 і 3:2 — це різні історії, хоч обидві ведуть у плейоф.
 *
 * Порожні картки намальовані навмисне. Пари наступного туру стають відомі
 * тільки після поточного, і сітка, що росте з кожним днем, читається як
 * помилка; сітка, у якій видно всі місця з самого початку, читається як
 * турнір, у якому ще не все зіграно.
 */
export function SwissBracket({ matches, teamSlugs }: { matches: Match[]; teamSlugs: string[] }) {
  const state = React.useMemo(() => swissState(matches, teamSlugs), [matches, teamSlugs]);
  const col = (key: string) => state.columns.find((c) => c.key === key);

  return (
    <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
      <div className="flex min-w-[52rem] items-stretch gap-3">
        <Stack>
          <SwissColumnView c={col("0-0")} />
        </Stack>
        <Stack>
          <SwissColumnView c={col("1-0")} />
          <SwissColumnView c={col("0-1")} />
        </Stack>
        <Stack>
          <SwissColumnView c={col("2-0")} />
          <SwissColumnView c={col("1-1")} />
          <SwissColumnView c={col("0-2")} />
        </Stack>
        <Stack>
          <SwissColumnView c={col("2-1")} />
          <SwissColumnView c={col("1-2")} />
        </Stack>
        <Stack>
          <Bucket title="Проходять" keys={SWISS_THROUGH} teams={state.through} tone="through" />
          <Bucket title="Вилітають" keys={SWISS_OUT} teams={state.out} tone="out" />
        </Stack>
      </div>
    </div>
  );
}

function Stack({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-[10.5rem] flex-1 flex-col gap-4">{children}</div>;
}

function SwissColumnView({ c }: { c?: ReturnType<typeof swissState>["columns"][number] }) {
  if (!c) return null;
  return (
    <section className="space-y-1.5">
      <p className="font-mono text-[0.6875rem] font-bold tracking-wide text-white/40">{c.label}</p>
      <div className="space-y-1.5">
        {c.cells.map((cell, i) => (
          <Pair key={cell.match?.id ?? `${c.key}-${i}`} cell={cell} />
        ))}
      </div>
    </section>
  );
}

/** Одна пара. Зіграна показує рахунок, майбутня — час, невідома — питальники. */
function Pair({ cell }: { cell: { match?: Match; a?: string; b?: string } }) {
  const m = cell.match;
  const done = m?.status === "finished";
  const live = m?.status === "live";
  const winner = m && done && m.scoreA !== m.scoreB ? (m.scoreA > m.scoreB ? m.a : m.b) : undefined;

  const body = (
    <div
      className={cn(
        "rounded-lg bg-black/35 px-2 py-1.5 shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.16)]",
        live && "shadow-[inset_0_0_0_1px_rgb(var(--skin-ring)/0.55)]",
      )}
    >
      {m && (
        <p className="mb-1 flex items-center justify-between text-[0.5625rem] font-semibold uppercase tracking-wide text-white/35">
          <span>{m.startISO ? slotTimeLabel(m.startISO) : "TBD"}</span>
          {live && <span className="text-[rgb(var(--skin-ring))]">live</span>}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <Corner slug={cell.a} score={m && done ? m.scoreA : undefined} won={winner === m?.a} />
        <span className="shrink-0 text-[0.5625rem] font-bold uppercase text-white/25">vs</span>
        <Corner slug={cell.b} score={m && done ? m.scoreB : undefined} won={winner === m?.b} align="right" />
      </div>
    </div>
  );

  return m ? (
    <Link href={`/matches/${m.id}`} className="block transition-opacity hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

function Corner({
  slug,
  score,
  won,
  align,
}: {
  slug?: string;
  score?: number;
  won?: boolean;
  align?: "right";
}) {
  const t = slug ? getTeam(slug) : undefined;
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5",
        align === "right" && "flex-row-reverse",
      )}
    >
      {t ? (
        <TeamLogo team={t} size="xs" />
      ) : (
        <span className="grid size-5 shrink-0 place-items-center rounded bg-white/5 text-[0.625rem] font-bold text-white/30">
          ?
        </span>
      )}
      {score !== undefined && (
        <span
          className={cn(
            "tnum shrink-0 font-mono text-[0.6875rem] font-bold",
            won ? "text-[rgb(var(--skin-ring))]" : "text-white/40",
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

/**
 * Підсумковий кошик.
 *
 * Зелений і червоний тут — не прикраса, а єдине місце на сторінці, де колір
 * щось означає: турнір ділить поле надвоє, і ці дві панелі і є той поділ.
 * Місця в кошику видно наперед — їх рівно стільки, скільки туди поміститься.
 */
function Bucket({
  title,
  keys,
  teams,
  tone,
}: {
  title: string;
  keys: readonly string[];
  teams: Record<string, string[]>;
  tone: "through" | "out";
}) {
  return (
    <section
      className={cn(
        "space-y-2 rounded-xl p-2.5",
        tone === "through"
          ? "bg-[color-mix(in_oklch,oklch(0.62_0.17_150)_22%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,oklch(0.62_0.17_150)_45%,transparent)]"
          : "bg-[color-mix(in_oklch,oklch(0.55_0.2_25)_22%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,oklch(0.55_0.2_25)_45%,transparent)]",
      )}
    >
      <p className="text-[0.625rem] font-bold uppercase tracking-wide text-white/55">{title}</p>
      <div className="space-y-2">
        {keys.map((k) => {
          const slots = SWISS_BUCKET_SIZE[k] ?? 0;
          const list = teams[k] ?? [];
          return (
            <div key={k} className="space-y-1">
              <p className="font-mono text-[0.6875rem] font-bold text-white/70">{k.replace("-", ":")}</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: slots }, (_, i) => {
                  const slug = list[i];
                  const t = slug ? getTeam(slug) : undefined;
                  return t ? (
                    <TeamLogo key={slug} team={t} size="sm" />
                  ) : (
                    <span
                      key={`${k}-${i}`}
                      className="grid size-7 place-items-center rounded-md bg-black/30 text-[0.625rem] font-bold text-white/25"
                    >
                      ?
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
