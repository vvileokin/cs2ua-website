import { findTeam } from "@/lib/data";
import { isHit, type CardShape, type PickRole, type StageOutcome } from "@/lib/major-pickem";
import type { Distribution } from "@/lib/db/pickem";
import { MajorCrest } from "./MajorCrest";
import { cn } from "@/lib/utils";

/**
 * Закрита картка — своя або чужа.
 *
 * Жила всередині сторінки пікемів, доки показувати її треба було рівно в
 * одному місці. Щойно з'явився перегляд чужих карток, виявилося, що це та
 * сама річ: ті самі кошики, ті самі влучання, та сама межа. Копіювати її
 * вдруге означало б завести два місця, які колись розійдуться.
 *
 * Про те, чия це картка, компонент не знає й не має знати. Хто має право її
 * бачити, вирішує політика в базі (0094): своя — завжди, чужа — після замка
 * стадії. Тут лише розмітка.
 */
export function LockedStage({
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
        </div>
      )}

      <div className="major-plate major-divide overflow-hidden rounded-[4px]">
        {teams.map((slug) => {
          const team = findTeam(slug);
          const mine = picks?.[slug];
          const out = actual?.[slug];
          /* `out` обов'язковий, а не лише `mine`.
             `isHit` на порожньому підсумку чесно повертає false — його
             питають «чи вгадано», а не «чи вже відомо». Тому щойно стадія
             закрилась і жодного результату ще немає, кожен вибір малювався
             перекресленим, тобто програним. Невідомо — це третій стан, і він
             тут `null`. */
          const hit = mine && out ? isHit(mine, out) : null;
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
          Відсотки — частка пікемів, у яких команда стоїть у одному або іншому
          кошику. Усього пікемів:{" "}
          <span className="tnum font-bold">{dist.total}</span>.
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
