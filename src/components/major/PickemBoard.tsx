"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { eventGem } from "@/lib/data";
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
 *
 * Рядок веде на картку людини. Таблиця каже, хто попереду, і зупиняється
 * рівно там, де виникає питання «а що він навибирав»; відповідь лежить
 * поруч, і після замка стадії вона нікому не шкодить. Кому саме видно чужу
 * картку, вирішує політика в базі (0094), а не ця розмітка.
 *
 * Показується десятка, решта — за трьома крапками. Сто вісімдесят рядків
 * нижче десятого місця нічого не додають тому, хто дивиться, хто попереду, а
 * сторінку розтягують на три екрани. Крапки — той самий знак, що й у
 * сезонному лідерборді: одне місце в продукті, один спосіб сказати «далі є
 * ще».
 */
export function PickemBoard({
  rows,
  title,
  caption,
  empty,
  shape,
  topN = 10,
}: {
  rows: BoardRow[];
  title: string;
  /** Коротке пояснення під заголовком: за що саме ця таблиця. */
  caption?: string;
  empty: string;
  /** Форма картки — щоб показати рівень. Для підсумкової таблиці її немає:
   *  сума влучань за стадії різної форми в одну шкалу не зводиться. */
  shape?: CardShape;
  /** Скільки рядків видно до розгортання. 0 — показати всіх одразу. */
  topN?: number;
}) {
  const [open, setOpen] = React.useState(false);
  /* Ріжемо за місцем, а не за позицією в масиві: при рівних очках місця
     повторюються, і зріз по індексу розірвав би таких людей навпіл. */
  const shown = !topN || open ? rows : rows.filter((r) => r.rank <= topN);
  const hidden = rows.length - shown.length;

  return (
    <section>
      <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 px-1 text-base font-extrabold text-ink">
        {title}
        {caption && <span className="text-[0.75rem] font-bold text-ink-dim">{caption}</span>}
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-[4px] surface-1 px-4 py-8 text-center text-sm text-ink-subtle">
          {empty}
        </p>
      ) : (
        <ol className="major-plate major-divide overflow-hidden rounded-[4px]">
          {shown.map((r, i) => {
            const tier = shape ? tierOf(r.hits, shape) : null;
            const paid = r.rank <= PRIZE_TOP;
            /* Межу малюємо лише тоді, коли по той бік від неї справді хтось
               стоїть: лінія «нижче призів» під останнім рядком обіцяє
               продовження, якого немає. */
            const edge = paid && shown[i + 1] && shown[i + 1].rank > PRIZE_TOP;

            return (
              <React.Fragment key={r.userId}>
                <li>
                  <Link
                    href={`/major/card/${r.userId}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.04] sm:px-4"
                  >
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

                  {/* Камінь біля числа, бо це не абстрактний рахунок: ці
                      очки лягають на мейджорський гаманець, тим самим, яким
                      тут платять за ставки. Голе число не казало, що саме
                      нараховано, і скільки на нього можна поставити. */}
                  <span
                    className={cn(
                      "tnum flex w-20 shrink-0 items-center justify-end gap-1 text-sm font-extrabold",
                      paid ? "text-[var(--major-hot)]" : "text-ink-muted",
                    )}
                  >
                    {r.points}
                    <BrandIcon name={eventGem("major")} className="size-3.5" />
                  </span>
                  </Link>
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

          {hidden > 0 && (
            <li>
              <button
                onClick={() => setOpen(true)}
                aria-label={`Показати решту: ${hidden}`}
                className="flex w-full items-center justify-center py-2 text-ink-faint transition-colors hover:bg-white/[0.04] hover:text-ink-muted"
              >
                <span className="text-xs tracking-widest">· · ·</span>
              </button>
            </li>
          )}

          {open && topN > 0 && rows.length > topN && (
            <li>
              <button
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center py-2 text-[0.6875rem] font-bold text-ink-dim transition-colors hover:bg-white/[0.04] hover:text-ink-muted"
              >
                Згорнути
              </button>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

function TierChip({ tier }: { tier: PickemTier }) {
  return (
    <span
      className="hidden shrink-0 rounded-[3px] px-2 py-0.5 text-[0.6875rem] font-extrabold sm:inline"
      style={{
        color: tier.tone,
        backgroundColor: `color-mix(in oklch, ${tier.tone} 16%, transparent)`,
      }}
    >
      {tier.name}
    </span>
  );
}
