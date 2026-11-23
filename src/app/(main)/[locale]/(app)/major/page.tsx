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
import { PickemBoard, plural } from "@/components/major/PickemBoard";
import { getChampionTally, getMyChampionVote } from "@/lib/db/champion";
import { findTeam } from "@/lib/data";
import {
  getStages, getMyCards, getBoard, getStageBoard, getDistribution, getSpread,
  isOpen, isReady, hasStarted, shapeFor, currentStage, isSignedIn,
  type BoardRow, type Distribution,
} from "@/lib/db/pickem";
import {
  isHit, tierOf, type CardShape, type PickRole, type StageOutcome,
} from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

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
    searchParams, getStages(), getMyCards(), getBoard(50),
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
  const [dist, stageBoard, spread] = await Promise.all([
    getDistribution(stage.stage, stage.startsAt),
    stage.scoredAt ? getStageBoard(stage.stage) : Promise.resolve<BoardRow[]>([]),
    getSpread(stage.stage),
  ]);

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
      <OpeningStrip matches={stage.opening} />

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
                "px-2 py-3 text-center transition-colors duration-150 sm:px-3",
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
                <p className={cn(
                  "mt-0.5 truncate text-[0.6875rem] font-bold tabular-nums",
                  here ? "text-[var(--major-ink)]/75" : "text-ink-dim",
                )}>
                  {mine.hits}/{shapeFor(s).picks} · {mine.points}
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
              {stage.scoredAt ? "Зіграно й зараховано" : "Стадія почалася, картки закриті"}
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

      {/* Таблиця самої стадії — тільки коли є що показувати. Саме по ній
          їдуть скіни за цю стадію, тож вона стоїть ближче, ніж підсумок. */}
      {stageBoard.length > 0 && (
        <PickemBoard
          rows={stageBoard}
          shape={shape}
          title={`Залік: ${stage.title.toLowerCase()}`}
          caption={`${stageBoard.length} ${plural(stageBoard.length, "картка", "картки", "карток")}`}
          empty=""
        />
      )}

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
function LockedStage({
  shape, teams, picks, actual, hits, points, scored, dist,
}: {
  shape: CardShape;
  teams: string[];
  picks: Record<string, PickRole> | null;
  actual: StageOutcome | null;
  hits: number;
  points: number;
  scored: boolean;
  dist: Distribution | null;
}) {
  const tier = scored ? tierOf(hits, shape) : null;

  return (
    <div className="space-y-3">
      {scored && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[4px] major-plate px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
              Влучань
            </p>
            <p className="tnum text-2xl font-black leading-tight text-ink">
              {hits}/{shape.picks}
            </p>
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
        <p className="rounded-[4px] surface-1 px-4 py-3 text-sm text-ink-subtle">
          Картки на цю стадію в тебе немає. Нижче — як розклалася спільнота.
        </p>
      )}

      <div className="major-plate major-divide overflow-hidden rounded-[4px]">
        {teams.map((slug) => {
          const team = findTeam(slug);
          const mine = picks?.[slug];
          const out = actual?.[slug];
          const hit = mine ? isHit(mine, out) : null;
          const d = dist?.byTeam[slug];
          const total = dist?.total ?? 0;

          return (
            <div key={slug} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <MajorCrest team={team} slug={slug} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                {team?.name ?? slug}
              </span>

              {/* Розподіл спільноти — дрібні відсотки в тому ж порядку, що й
                  кошики в картці, тож колонка читається згори вниз як одна
                  таблиця, а не як кілька незалежних чисел. */}
              {total > 0 && (
                <span className="hidden shrink-0 gap-3 sm:flex">
                  {shape.roles.map((r) => {
                    const n = d?.[r.role] ?? 0;
                    const p = Math.round((n / total) * 100);
                    return (
                      <span
                        key={r.role}
                        title={`${r.title}: ${n} з ${total}`}
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
                  {outLabel(out, shape)}
                </span>
              )}

              {/* Власний вибір — останнім, бо саме його шукає око. */}
              <span className="w-[4.5rem] shrink-0 text-right">
                {mine ? (
                  <span
                    className={cn(
                      "rounded-[3px] px-2 py-1 text-[0.75rem] font-extrabold",
                      hit === null
                        ? "bg-fill-2 text-ink-muted"
                        : hit
                          ? "bg-[var(--major-hot)] text-[var(--major-ink)]"
                          : "bg-fill-2 text-ink-faint line-through",
                    )}
                  >
                    {shape.roles.find((r) => r.role === mine)?.label ?? mine}
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
          що й кошики: {shape.roles.map((r) => `${r.label.toLowerCase()} ×${r.price}`).join(", ")}.
        </p>
      )}
    </div>
  );
}

/**
 * Підсумок однієї команди в людському вигляді.
 *
 * У швейцарці він уже такий: «3-0» читається як рахунок. У плей-офі в базі
 * лежить роль — `champ`, `semi`, `qf` — і показувати англійський ключ
 * посеред української таблиці нема сенсу.
 */
function outLabel(out: string, shape: CardShape): string {
  if (shape.kind !== "playoff") return out;
  return ({ champ: "1-е", final: "2-е", semi: "3-4", qf: "5-8" } as Record<string, string>)[out] ?? out;
}
