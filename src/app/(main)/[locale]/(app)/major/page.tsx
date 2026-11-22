import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { MajorMode } from "@/components/major/MajorMode";
import { MajorHero } from "@/components/major/MajorHero";
import { LockCountdown } from "@/components/major/LockCountdown";
import { PickemCard } from "@/components/major/PickemCard";
import { PickemBoard } from "@/components/major/PickemBoard";
import { findTeam } from "@/lib/data";
import {
  getStages, getMyCards, getBoard, getDistribution, isOpen, currentStage,
} from "@/lib/db/pickem";
import {
  ROLES, ROLE_LABEL, ROLE_PRICE, ROLE_TITLE, STAGE_MAX, isHit, tierOf,
  type PickRole,
} from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Пікеми на мейджор",
  description:
    "Розклади швейцарку PGL Major Singapore 2026: двоє на 3-0, шестеро на прохід, двоє на 0-3.",
};

/* Сторінка читає картки конкретної людини й розподіл, що міняється з кожним
   збереженням. Кешувати тут нічого. */
export const dynamic = "force-dynamic";

export default async function MajorPickemPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const [{ stage: wanted }, stages, cards, board] = await Promise.all([
    searchParams, getStages(), getMyCards(), getBoard(50),
  ]);

  if (!stages.length) {
    return (
      <div className="space-y-5">
        <MajorMode />
        <MajorHero kicker="PGL Major Singapore 2026" title="Пікеми" />
        <p className="rounded-2xl surface-1 px-6 py-12 text-center text-sm text-ink-subtle">
          Стадії ще не заведені. Заходь ближче до старту.
        </p>
      </div>
    );
  }

  const picked = stages.find((s) => String(s.stage) === wanted);
  const stage = picked ?? currentStage(stages) ?? stages[0];
  const open = isOpen(stage);
  const ready = stage.teams.length === 16;
  const card = cards[stage.stage] ?? null;
  const dist = await getDistribution(stage.stage, stage.startsAt);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MajorMode />

      <MajorHero kicker="PGL Major Singapore 2026" title="Пікеми">
        {/* Правило гри одним рядком, прямо в шапці. Воно коротке, і сторінка,
            яка починається з «ось арт, а тепер здогадайся», марнує єдиний
            екран, на якому людина точно дивиться. */}
        <p className="max-w-xl text-pretty text-[0.8125rem] font-semibold leading-snug text-white/80 sm:text-sm">
          Двоє пройдуть без поразок, шестеро пройдуть далі, двоє вилетять усуха.
          Десять виборів із шістнадцяти — до {STAGE_MAX} очок за стадію.
        </p>
      </MajorHero>

      {/* Стадії. Три, і всі три завжди видно: друга і третя ще без складу, але
          сховати їх означало б приховати й те, що гра триватиме два тижні. */}
      <nav className="grid grid-cols-3 gap-2">
        {stages.map((s) => {
          const here = s.stage === stage.stage;
          const mine = cards[s.stage];
          const locked = !isOpen(s);
          return (
            <Link
              key={s.stage}
              href={`/major?stage=${s.stage}`}
              aria-current={here ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-2.5 transition-colors duration-150",
                here
                  ? "bg-[color-mix(in_oklch,var(--major)_20%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major)_50%,transparent)]"
                  : "bg-surface hover:bg-surface-2",
              )}
            >
              <p
                className={cn(
                  "truncate text-sm font-extrabold",
                  here ? "text-[var(--major-hot)]" : "text-ink",
                )}
              >
                {s.title}
              </p>
              <p className="mt-0.5 truncate text-[0.6875rem] font-semibold text-ink-dim">
                {s.teams.length < 16
                  ? "Склад невідомий"
                  : mine?.scored
                    ? `${mine.hits}/10 · ${mine.points} очок`
                    : mine
                      ? locked ? "Картка подана" : "Чернетка є"
                      : locked ? "Без картки" : "Картка відкрита"}
              </p>
            </Link>
          );
        })}
      </nav>

      {/* Стан стадії: коли замок, що вже зіграно. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl surface-1 px-4 py-3">
        <p className="text-sm font-extrabold text-ink">{stage.title}</p>
        {ready ? (
          open ? (
            <p className="text-sm text-ink-muted">
              Замок через{" "}
              <LockCountdown
                at={stage.startsAt}
                className="font-extrabold text-[var(--major-hot)]"
              />
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              {stage.scoredAt ? "Зіграно й зараховано" : "Стадія почалася, картки закриті"}
            </p>
          )
        ) : (
          <p className="text-sm text-ink-muted">
            Чекаємо, хто вийде з попередньої стадії — відомо {stage.teams.length} із 16
          </p>
        )}
      </div>

      {!ready ? (
        <IncompleteStage teams={stage.teams} />
      ) : open ? (
        <PickemCard
          stage={stage.stage}
          teams={stage.teams}
          initial={card?.picks ?? {}}
          locked={false}
        />
      ) : (
        <LockedStage
          teams={stage.teams}
          picks={card?.picks ?? null}
          actual={stage.actual}
          hits={card?.hits ?? 0}
          points={card?.points ?? 0}
          scored={!!card?.scored}
          dist={dist}
        />
      )}

      <PickemBoard rows={board} />

      {/* Гонка за інвайти закрилась 2 листопада, але це місяць роботи й
          єдине місце, де лежить, як саме ці тридцять дві команди сюди
          потрапили. Посилання лишається, зі сторінки воно пішло. */}
      <p className="text-center text-[0.8125rem] text-ink-subtle">
        Як рахувались запрошення —{" "}
        <Link
          href="/major/invites"
          className="font-bold text-[var(--major-hot)] underline-offset-4 hover:underline"
        >
          таблиця VRS і прогноз відсічення
        </Link>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/** Стадія без повного складу: показуємо тих, хто вже тут. */
function IncompleteStage({ teams }: { teams: string[] }) {
  return (
    <div className="major-plate rounded-2xl p-4 sm:p-5">
      <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
        Уже кваліфіковані
      </p>
      <div className="flex flex-wrap gap-2">
        {teams.map((slug) => {
          const team = findTeam(slug);
          return (
            <span
              key={slug}
              className="flex items-center gap-2 rounded-lg bg-fill-1 py-1.5 pl-1.5 pr-3"
            >
              {team ? <TeamLogo team={team} size="xs" /> : null}
              <span className="text-[0.8125rem] font-bold text-ink-muted">
                {team?.name ?? slug}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Закрита стадія.
 *
 * Тут сходиться все, заради чого картку взагалі ховали до замка: власний
 * вибір, підсумок, якщо він уже є, і те, як розклалася спільнота. Останнє —
 * єдина цифра на сторінці, яку не можна було показати раніше, не зіпсувавши
 * саму гру.
 */
function LockedStage({
  teams, picks, actual, hits, points, scored, dist,
}: {
  teams: string[];
  picks: Record<string, PickRole> | null;
  actual: Record<string, string> | null;
  hits: number;
  points: number;
  scored: boolean;
  dist: { total: number; byTeam: Record<string, Record<PickRole, number>> } | null;
}) {
  const tier = scored ? tierOf(hits) : null;

  return (
    <div className="space-y-3">
      {scored && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl major-plate px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
              Влучань
            </p>
            <p className="tnum text-2xl font-black leading-tight text-ink">{hits}/10</p>
          </div>
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
              Очок
            </p>
            <p className="tnum text-2xl font-black leading-tight text-[var(--major-hot)]">
              {points}
            </p>
          </div>
          {tier && (
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
                Рівень
              </p>
              <p
                className="text-2xl font-black leading-tight"
                style={{ color: tier.tone }}
              >
                {tier.name}
              </p>
            </div>
          )}
        </div>
      )}

      {!picks && (
        <p className="rounded-xl surface-1 px-4 py-3 text-sm text-ink-subtle">
          Картки на цю стадію в тебе немає. Нижче — як розклалася спільнота.
        </p>
      )}

      <div className="major-plate major-divide overflow-hidden rounded-2xl">
        {teams.map((slug) => {
          const team = findTeam(slug);
          const mine = picks?.[slug];
          const out = actual?.[slug];
          const hit = mine ? isHit(mine, out) : null;
          const d = dist?.byTeam[slug];
          const total = dist?.total ?? 0;

          return (
            <div key={slug} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              {team ? (
                <TeamLogo team={team} size="sm" />
              ) : (
                <span className="size-7 shrink-0 rounded-md bg-fill-2" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                {team?.name ?? slug}
              </span>

              {/* Розподіл спільноти — три дрібні відсотки в тому ж порядку,
                  що й кнопки в картці, тож колонка читається згори вниз як
                  одна таблиця, а не як три незалежні числа. */}
              {total > 0 && (
                <span className="hidden shrink-0 gap-3 sm:flex">
                  {ROLES.map((r) => {
                    const n = d?.[r] ?? 0;
                    const p = Math.round((n / total) * 100);
                    return (
                      <span
                        key={r}
                        title={`${ROLE_TITLE[r]}: ${n} з ${total}`}
                        className={cn(
                          "tnum w-11 text-right text-[0.75rem] font-bold",
                          p >= 50 ? "text-ink-muted" : "text-ink-dim",
                        )}
                      >
                        {p}%
                      </span>
                    );
                  })}
                </span>
              )}

              {/* Підсумок стадії, коли він уже відомий. */}
              {out && (
                <span className="tnum w-10 shrink-0 text-right text-[0.75rem] font-extrabold text-ink-muted">
                  {out}
                </span>
              )}

              {/* Власний вибір — останнім, бо саме його шукає око. */}
              <span className="w-[4.5rem] shrink-0 text-right">
                {mine ? (
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[0.75rem] font-extrabold",
                      hit === null
                        ? "bg-fill-2 text-ink-muted"
                        : hit
                          ? "bg-[var(--major-hot)] text-[var(--major-ink)]"
                          : "bg-fill-2 text-ink-faint line-through",
                    )}
                  >
                    {ROLE_LABEL[mine]}
                  </span>
                ) : (
                  <span className="text-[0.75rem] text-ink-faint">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {dist && dist.total > 0 && (
        <p className="px-1 text-[0.75rem] text-ink-dim">
          Відсотки — частка карток, у яких команда стоїть у цій ролі. Усього карток:{" "}
          <span className="tnum font-bold">{dist.total}</span>. Колонки в тому ж порядку,
          що й кнопки: {ROLES.map((r) => `${ROLE_LABEL[r].toLowerCase()} ×${ROLE_PRICE[r]}`).join(", ")}.
        </p>
      )}
    </div>
  );
}
