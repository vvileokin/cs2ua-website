import * as React from "react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { MajorBanner } from "@/components/major/MajorBanner";
import { MajorMode } from "@/components/major/MajorMode";
import { MajorCrest } from "@/components/major/MajorCrest";
import { MajorPrizes } from "@/components/major/MajorPrizes";
import { ChampionPoll } from "@/components/major/ChampionPoll";
import { OpeningStrip } from "@/components/major/OpeningStrip";
import { LockCountdown } from "@/components/major/LockCountdown";
import { PickemCard } from "@/components/major/PickemCard";
import { PickemBoard } from "@/components/major/PickemBoard";
import { LockedStage } from "@/components/major/LockedStage";
import { getChampionTally, getMyChampionVote } from "@/lib/db/champion";
import { findTeam } from "@/lib/data";
import {
  getStages, getMyCards, getBoard, getDistribution, getSpread,
  getStageRound,
  isOpen, isReady, hasStarted, shapeFor, currentStage, isSignedIn,
} from "@/lib/db/pickem";
import { cn, plural } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Пікеми на мейджор",
  description:
    "Розклади швейцарку й сітку PGL Major Singapore 2026. Топ-10 кожної стадії забирає скін.",
};

/* Сторінка читає картки конкретної людини й розподіл, що міняється з кожним
   збереженням. Кешувати тут нічого. */
export const dynamic = "force-dynamic";

export default async function MajorPickemPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const [{ stage: wanted }, stages, cards, board, tally, myVote] = await Promise.all([
    searchParams, getStages(), getMyCards(),
    /* Уся таблиця, а не перші п'ятдесят: видно з неї однаково десятку, а
       решта лежить за трьома крапками — і «решта» має означати решту. */
    getBoard(500),
    getChampionTally(), getMyChampionVote(),
  ]);
  const signedIn = await isSignedIn();

  if (!stages.length) {
    return (
      <div className="space-y-5">
        <MajorMode />
        <h1 className="sr-only">Пікеми на мейджор</h1>
        <p className="rounded-[4px] surface-1 px-6 py-12 text-center text-sm text-ink-subtle">
          Стадії ще не заведені. Заходь ближче до старту.
        </p>
      </div>
    );
  }

  const picked = stages.find((s) => String(s.stage) === wanted);
  const stage = picked ?? currentStage(stages) ?? stages[0];
  const shape = shapeFor(stage);
  const open = isOpen(stage);
  const ready = isReady(stage);
  const card = cards[stage.stage] ?? null;
  const [dist, spread, round] = await Promise.all([
    getDistribution(stage.stage, stage.startsAt),
    getSpread(stage.stage),
    getStageRound(),
  ]);

  /* Стрічка показує тур, який іде. Поки матчів у таблиці немає — розклад
     першого туру з `major_stages.opening`: до початку події це єдине, що про
     неї взагалі відомо. */
  const strip = round.matches.length ? round.matches : stage.opening;

  /* Учасники голосування — усі, кого вписали в стадії, від найвищого посіву
     до найнижчого: третя стадія це верх таблиці VRS, перша — низ. Окремого
     списку команд мейджора ніде немає й не треба, бо він розійшовся б зі
     складами стадій рівно тоді, коли когось замінять. */
  const contenders = [...stages]
    .sort((a, b) => b.stage - a.stage)
    .flatMap((s) => s.teams)
    .filter((slug, i, all) => all.indexOf(slug) === i);

  /* Замок голосування — початок плей-офа, як і в 0097. Коли сітка почалася,
     питання «хто візьме мейджор» наполовину вирішене нею. */
  const playoff = stages.find((s) => s.kind === "playoff");
  const pollLocked = !!playoff && hasStarted(playoff);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MajorMode />

      {/* Банер — той самий, яким головна кличе на цю сторінку: прийшов за
          ним і бачиш його ж угорі, тобто потрапив куди йшов. */}
      <MajorBanner image="/brand/hero-major.webp" />

      {/* Найближчі матчі — над вкладками, бо вони про те, що станеться зі
          стадією, а не про картку. Коли розкладу ще немає, стрічки немає
          теж: порожня смуга над вкладками обіцяє те, чого в ній нема. */}
      <OpeningStrip matches={strip} live={round.live} />

      {/* Стадії — плитами: дрібна капітель, обрана заливається кольором
          події цілком. Ряд
          рівних плит також чесно каже, що стадії рівноцінні — і це тепер
          буквально так: максимум за кожну однаковий, бо кожна це одна
          роздача скінів. */}
      {/* Колонок рівно стільки, скільки стадій. Вписане число тут означало б,
          що невиконана міграція лишає порожню плиту в ряду — сторінка
          малювала б чотири вкладки на три стадії. */}
      <nav
        className="grid gap-px overflow-hidden rounded-[4px] bg-white/10 [grid-template-columns:repeat(var(--tabs),minmax(0,1fr))]"
        style={{ "--tabs": stages.length } as React.CSSProperties}
      >
        {stages.map((s) => {
          const here = s.stage === stage.stage;
          const mine = cards[s.stage];
          return (
            <Link
              key={s.stage}
              href={`/major?stage=${s.stage}`}
              aria-current={here ? "page" : undefined}
              className={cn(
                /* Висота задана, а не набігає з вмісту. У зіграної стадії
                   під назвою з'являється другий рядок, і на відступах уся
                   смуга підростала — у того, хто зіграв, кнопки вищі, ніж у
                   того, хто ні. Сорок пікселів тримають і один рядок, і два,
                   тож смуга виглядає однаково в усіх і не ворушиться, коли
                   стадію зараховують. */
                "flex h-10 flex-col items-center justify-center px-2 text-center transition-colors duration-150 sm:px-3",
                here
                  ? "bg-[var(--major-hot)]"
                  : "bg-[var(--major-floor)] hover:bg-white/[0.05]",
              )}
            >
              <p
                className={cn(
                  "truncate text-[0.6875rem] font-black uppercase tracking-[0.08em] sm:text-[0.75rem] sm:tracking-[0.1em]",
                  here ? "text-[var(--major-ink)]" : "text-ink-muted",
                )}
              >
                {s.title}
              </p>
              {mine?.scored && (
                /* Тільки влучання. Очки за стадію тут були зайві: та сама
                   сума стоїть у таблиці нижче, а на вкладці вона
                   перетворювала назву стадії на рядок звіту. Влучання —
                   інша річ: це те, як ти зіграв, і воно має бути поруч із
                   тим, у що ти грав. */
                <p className={cn(
                  "truncate text-[0.625rem] font-bold leading-tight tabular-nums",
                  here ? "text-[var(--major-ink)]/75" : "text-ink-dim",
                )}>
                  {mine.hits}/{shapeFor(s).picks}
                </p>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Стан стадії: коли замок, що вже зіграно.
          Тут же живе єдиний заголовок сторінки. Банера над ним немає
          свідомо — назва сторінки це підпис, а не вміст, і місце нагорі
          віддано тому, заради чого її відкрили. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[4px] surface-1 px-4 py-3">
        <h1 className="flex items-center gap-2 text-sm font-extrabold text-ink">
          <span className="size-1.5 shrink-0 rounded-full bg-[var(--major-hot)] shadow-[0_0_10px_var(--major-hot)]" />
          {stage.title}
        </h1>
        {ready ? (
          open ? (
            <p className="text-sm text-ink-muted">
              Закриється{" "}
              <LockCountdown
                at={stage.startsAt}
                className="font-extrabold text-[var(--major-hot)]"
              />
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              {stage.scoredAt ? "Зіграно й зараховано" : "Пікеми закриті"}
            </p>
          )
        ) : null}
      </div>

      {!ready ? (
        <IncompleteStage teams={stage.teams} />
      ) : open ? (
        <PickemCard
          stage={stage.stage}
          shape={shape}
          teams={stage.teams}
          initial={card?.picks ?? {}}
          canSave={signedIn}
          spread={spread}
        />
      ) : (
        <LockedStage
          shape={shape}
          teams={stage.teams}
          picks={card?.picks ?? null}
          actual={stage.actual}
          hits={card?.hits ?? 0}
          points={card?.points ?? 0}
          scored={!!card?.scored}
          dist={dist}
        />
      )}

      {/* Голосування одразу під карткою, призи — за ним.
          Обидва блоки не про картку, але один із них діє: голос можна
          віддати просто зараз, одним дотиком, і побачити, як зрушилися
          відсотки. Призи — текст, який читають один раз і більше до нього
          не повертаються, тож вони й пропускають уперед те, з чим є що
          робити. */}
      <ChampionPoll
        teams={contenders}
        initialTally={tally.byTeam}
        initialVote={myVote}
        locked={pollLocked}
      />

      <MajorPrizes stage={stage.stage} />

      <PickemBoard
        rows={board}
        title="Підсумкова таблиця"
        caption={
          board.length
            ? `${board.length} ${plural(board.length, "гравець", "гравці", "гравців")}`
            : undefined
        }
        empty="Поки порожньо. Перші очки з’являться тут, коли дограється перша стадія."
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/** Стадія без повного складу: показуємо тих, хто вже тут. */
function IncompleteStage({ teams }: { teams: string[] }) {
  if (!teams.length) {
    return (
      <p className="rounded-[4px] surface-1 px-4 py-10 text-center text-sm text-ink-subtle">
        Склад цієї стадії ще не визначений. Картка відкриється, щойно стане
        відомо, хто в ній грає.
      </p>
    );
  }

  return (
    <div className="major-plate rounded-[4px] p-4 sm:p-5">
      {/* Без підпису «Уже кваліфіковані». Під вкладкою стадії, у якої ще
          немає картки, ряд гербів може означати тільки одне, і називати це
          словами — витрачати рядок на переказ очевидного. */}
      <div className="flex flex-wrap gap-2">
        {teams.map((slug) => {
          const team = findTeam(slug);
          return (
            <span
              key={slug}
              className="flex items-center gap-2 rounded-[3px] bg-fill-1 py-1.5 pl-1.5 pr-3"
            >
              <MajorCrest team={team} slug={slug} size={22} />
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
