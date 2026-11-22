import { PRIZES, PRIZE_TOP } from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Що саме можна виграти.
 *
 * Очки самі по собі нікому не потрібні — вони тільки спосіб вишикувати людей
 * у рядок. Усе, що з цього рядка справді дістається гравцеві, — це десять
 * перших місць кожної стадії й десять перших підсумку, і без цієї таблиці
 * сторінка просить скласти картку, не кажучи навіщо.
 *
 * Правило нічиєї тут не описане — воно живе в міграції 0096 і проступає на
 * дошці межею десятки. Якщо колись знадобиться показати його словами, місце
 * для цього під таблицею.
 */
export function MajorPrizes({ stage }: { stage?: number }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-base font-extrabold text-ink">Призи</h2>

      <div className="major-plate major-divide overflow-hidden rounded-2xl">
        {PRIZES.map((p) => {
          const here = p.key === stage;
          return (
            <div
              key={String(p.key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 sm:px-4",
                here && "bg-[color-mix(in_oklch,var(--major-hot)_10%,transparent)]",
              )}
            >
              <span
                className={cn(
                  "w-20 shrink-0 text-[0.6875rem] font-extrabold uppercase tracking-wide sm:w-24",
                  here ? "text-[var(--major-hot)]" : "text-ink-dim",
                )}
              >
                {p.label}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-bold text-ink">
                  {p.skin}
                </span>
                <span className="block truncate text-[0.6875rem] text-ink-dim">
                  {p.wear} · ${p.unit.toFixed(2)}
                </span>
              </span>

              {/* Скільки людей це отримає — одна цифра, та сама в кожному
                  рядку. Вона тут не заради інформації, а заради того, щоб
                  «топ-10» читалося як правило, а не як обіцянка. */}
              <span className="tnum shrink-0 text-right text-[0.75rem] font-extrabold text-ink-muted">
                ×{PRIZE_TOP}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
