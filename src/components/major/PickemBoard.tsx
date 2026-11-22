import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PRIZE_TOP, tierOf, type CardShape, type PickemTier } from "@/lib/major-pickem";
import type { BoardRow } from "@/lib/db/pickem";
import { cn } from "@/lib/utils";

/**
 * Дошка пікемів.
 *
 * Сезонний лідерборд рахує все, що людина робила на сайті за пів року, і
 * пікеми в ньому розчиняються: прийти на мейджор уперше й опинитися на
 * сімдесятому місці за чужі літні ставки — так собі запрошення грати. Тут
 * рахуються тільки картки, і відлік почався в усіх одночасно.
 *
 * Дошка порожня, поки жодна стадія не дограна, і це правильна порожнеча:
 * очки існують тільки після того, як стадія розклалася. Показувати «лідерів»
 * за поданими картками означало б рейтингувати нездійснене.
 *
 * Місце береться з бази, а не з порядку в масиві. Десятка, якій їдуть скіни,
 * визначається тайбрейком (0096), і номер має бути той самий у будь-якому
 * запиті — а не той, у якому рядки випадково приїхали.
 *
 * Межа призів намальована. Без неї таблиця каже, хто попереду, але не каже
 * головного — де та лінія, заради якої все це складали.
 */
export function PickemBoard({
  rows,
  title,
  caption,
  empty,
  shape,
}: {
  rows: BoardRow[];
  title: string;
  /** Коротке пояснення під заголовком: за що саме ця таблиця. */
  caption?: string;
  empty: string;
  /** Форма картки — щоб показати рівень. Для підсумкової таблиці її немає:
   *  сума влучань за стадії різної форми в одну шкалу не зводиться. */
  shape?: CardShape;
}) {
  return (
    <section>
      <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 px-1 text-base font-extrabold text-ink">
        {title}
        {caption && <span className="text-[0.75rem] font-bold text-ink-dim">{caption}</span>}
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl surface-1 px-4 py-8 text-center text-sm text-ink-subtle">
          {empty}
        </p>
      ) : (
        <ol className="major-plate major-divide overflow-hidden rounded-2xl">
          {rows.map((r, i) => {
            const tier = shape ? tierOf(r.hits, shape) : null;
            const paid = r.rank <= PRIZE_TOP;
            /* Межу малюємо лише тоді, коли по той бік від неї справді хтось
               стоїть: лінія «нижче призів» під останнім рядком обіцяє
               продовження, якого немає. */
            const edge = paid && rows[i + 1] && rows[i + 1].rank > PRIZE_TOP;

            return (
              <React.Fragment key={r.userId}>
                <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <span
                    className={cn(
                      "tnum w-6 shrink-0 text-right text-sm font-extrabold",
                      paid ? "text-[var(--major-hot)]" : "text-ink-dim",
                    )}
                  >
                    {r.rank}
                  </span>
                  <Avatar name={r.handle ?? "?"} src={r.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                    {r.handle ?? "Без імені"}
                  </span>

                  {tier && <TierChip tier={tier} />}

                  <span className="tnum w-14 shrink-0 text-right text-[0.75rem] font-bold text-ink-dim">
                    {r.hits} вл.
                  </span>
                  <span
                    className={cn(
                      "tnum w-16 shrink-0 text-right text-sm font-extrabold",
                      paid ? "text-[var(--major-hot)]" : "text-ink-muted",
                    )}
                  >
                    {r.points}
                  </span>
                </li>

                {edge && (
                  <li
                    aria-hidden
                    className="flex items-center gap-2 bg-black/20 px-3 py-1 sm:px-4"
                  >
                    <span className="h-px flex-1 bg-[var(--major-hot)]/40" />
                    <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[var(--major-hot)]">
                      межа скінів
                    </span>
                    <span className="h-px flex-1 bg-[var(--major-hot)]/40" />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function TierChip({ tier }: { tier: PickemTier }) {
  return (
    <span
      className="hidden shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-extrabold sm:inline"
      style={{
        color: tier.tone,
        backgroundColor: `color-mix(in oklch, ${tier.tone} 16%, transparent)`,
      }}
    >
      {tier.name}
    </span>
  );
}

/** Українське число: 1 картка, 2 картки, 5 карток. */
export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
