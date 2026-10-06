"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam, type Match } from "@/lib/data";
import { swissState, SWISS_THROUGH, SWISS_OUT, SWISS_BUCKET_SIZE } from "@/lib/swiss";
import { cn } from "@/lib/utils";

/**
 * Швейцарка EPL S24 — уся форма турніру одразу, а не те, що встигли зіграти.
 *
 * Колонки стоять так, як ділиться поле: спільний старт 0:0, далі гілка
 * переможців угору, програлих униз, і останній тур 2:2, де шестеро грають за
 * останні три місця. Праворуч два підсумки: хто вийшов і хто вилетів, за
 * рахунком — 3:0 і 3:2 ведуть в один плейоф, але це різні історії.
 *
 * Картка — це дві емблеми й «vs», і нічого більше. Герб тут єдине, що читач
 * справді розпізнає з відстані, тож він великий, а плитка рівно така, щоб його
 * тримати: перша версія була вдвічі довша, з годиною і форматом у шапці, і з
 * неї читалися саме ті дві речі, яких у сітці й так ніхто не шукає.
 *
 * Порожні місця намальовані навмисне. Пари наступного туру стають відомі аж
 * після поточного, і сітка, що росте на колонку щодня, читається як поламана;
 * сітка, у якій усі місця видно з першого дня, читається як турнір, у якому
 * ще є що грати.
 */
export function SwissBracket({ matches, teamSlugs }: { matches: Match[]; teamSlugs: string[] }) {
  const state = React.useMemo(() => swissState(matches, teamSlugs), [matches, teamSlugs]);
  const col = (key: string) => state.columns.find((c) => c.key === key);

  return (
    <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
      {/* Колонки стоять по центру, а не від верху. Причина видна на сітці:
          у 0:0 вісім пар, у 2:1 — три, і при верхньому вирівнюванні короткі
          групи висять під своїм написом угорі, а півколонки під ними порожні.
          Зсунуті до середини, вони опиняються навпроти тих пар, з яких вийшли,
          — і сітка читається як рух зліва направо, а не як стовпчики різної
          довжини, приклеєні до чисел. */}
      <div className="flex min-w-[58rem] items-center gap-4">
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
          <Bucket keys={SWISS_THROUGH} teams={state.through} tone="through" />
          <SwissColumnView c={col("2-2")} />
          <Bucket keys={SWISS_OUT} teams={state.out} tone="out" />
        </Stack>
      </div>
    </div>
  );
}

function Stack({ children }: { children: React.ReactNode }) {
  return <div className="flex w-[11rem] shrink-0 flex-col gap-8">{children}</div>;
}

function SwissColumnView({ c }: { c?: ReturnType<typeof swissState>["columns"][number] }) {
  if (!c) return null;
  return (
    <section className="space-y-2.5">
      <p className="font-mono text-sm font-bold leading-none text-[rgb(var(--skin-ring))]">{c.label}</p>
      <div className="space-y-2">
        {c.cells.map((cell, i) => (
          <Pair key={cell.match?.id ?? `${c.key}-${i}`} cell={cell} />
        ))}
      </div>
    </section>
  );
}

/**
 * Одна пара.
 *
 * Зіграна показує рахунок під гербами, майбутня — нічого: час матчу живе на
 * його сторінці, а тут він додавав рядок до кожної з двадцяти семи плиток і
 * робив колонку вдвічі довшою за те, що в ній намальовано.
 */
function Pair({ cell }: { cell: { match?: Match; a?: string; b?: string } }) {
  const m = cell.match;
  const done = m?.status === "finished";
  const live = m?.status === "live";
  const winner = m && done && m.scoreA !== m.scoreB ? (m.scoreA > m.scoreB ? m.a : m.b) : undefined;

  const body = (
    <div
      className={cn(
        /* Герби по краях, «vs» посередині. Зсунуті докупи, вони читалися як
           одна пляма з двох значків; розведені — як дві сторони. */
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

/**
 * Підсумковий кошик.
 *
 * Зелений і червоний — єдине місце на сторінці, де колір щось означає: турнір
 * ділить поле надвоє, і ці дві панелі і є той поділ. Місця видно наперед, бо
 * їх завжди стільки, скільки туди поміститься.
 */
function Bucket({
  keys,
  teams,
  tone,
}: {
  keys: readonly string[];
  teams: Record<string, string[]>;
  tone: "through" | "out";
}) {
  return (
    <section
      className={cn(
        "flex gap-3 rounded-xl p-2.5",
        tone === "through"
          ? "bg-[color-mix(in_oklch,oklch(0.6_0.19_148)_26%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,oklch(0.6_0.19_148)_55%,transparent)]"
          : "bg-[color-mix(in_oklch,oklch(0.52_0.21_27)_26%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,oklch(0.52_0.21_27)_55%,transparent)]",
      )}
    >
      {keys.map((k) => {
        const slots = SWISS_BUCKET_SIZE[k] ?? 0;
        const list = teams[k] ?? [];
        return (
          <div key={k} className="flex-1 space-y-1.5">
            <p className="text-center font-mono text-xs font-bold text-white">{k.replace("-", ":")}</p>
            <div className="flex flex-col items-center gap-1.5">
              {Array.from({ length: slots }, (_, i) => {
                const slug = list[i];
                const t = slug ? getTeam(slug) : undefined;
                return t ? (
                  <TeamLogo key={slug} team={t} size="cardCrest" />
                ) : (
                  <span
                    key={`${k}-${i}`}
                    className="grid size-[2.125rem] place-items-center rounded-md bg-black/25 text-xs font-bold text-white/25"
                  >
                    ?
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
