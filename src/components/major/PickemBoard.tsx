import { Avatar } from "@/components/ui/Avatar";
import { tierOf, type PickemTier } from "@/lib/major-pickem";
import type { BoardRow } from "@/lib/db/pickem";
import { cn } from "@/lib/utils";

/**
 * Окрема дошка пікемів.
 *
 * Сезонний лідерборд рахує все, що людина робила на сайті за пів року, і
 * пікеми в ньому розчиняються: прийти на мейджор уперше й опинитися на
 * сімдесятому місці за чужі літні ставки — так собі запрошення грати. Тут
 * рахуються тільки картки, і відлік почався в усіх одночасно.
 *
 * Дошка порожня, поки жодна стадія не дограна, і це правильна порожнеча:
 * очки існують тільки після того, як швейцарка розклалася. Показувати
 * «лідерів» за поданими картками означало б рейтингувати нездійснене.
 *
 * Рівень поруч із сумою, бо вони відповідають на різні питання. Сума — скільки
 * назбирав, рівень — наскільки точно вгадав; десять проходів і два краї дають
 * близькі суми з зовсім різною влучністю.
 */
export function PickemBoard({ rows }: { rows: BoardRow[] }) {
  return (
    <section>
      <h2 className="mb-3 flex items-baseline gap-2 px-1 text-base font-extrabold text-ink">
        Дошка пікемів
        {rows.length > 0 && (
          <span className="text-[0.75rem] font-bold text-ink-dim">
            {rows.length} {plural(rows.length, "картка", "картки", "карток")}
          </span>
        )}
      </h2>

      {rows.length === 0 ? (
        <p className="rounded-2xl surface-1 px-4 py-8 text-center text-sm text-ink-subtle">
          Поки порожньо. Перші очки з&rsquo;являться тут, коли дограється перша стадія.
        </p>
      ) : (
        <ol className="major-plate major-divide overflow-hidden rounded-2xl">
          {rows.map((r, i) => {
            const tier = tierOf(r.hits);
            return (
              <li key={r.userId} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <span
                  className={cn(
                    "tnum w-6 shrink-0 text-right text-sm font-extrabold",
                    i === 0 ? "text-[var(--major-hot)]" : "text-ink-dim",
                  )}
                >
                  {i + 1}
                </span>
                <Avatar name={r.handle ?? "?"} src={r.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                  {r.handle ?? "Без імені"}
                </span>

                {tier && <TierChip tier={tier} />}

                <span className="tnum w-14 shrink-0 text-right text-[0.75rem] font-bold text-ink-dim">
                  {r.hits} вл.
                </span>
                <span className="tnum w-16 shrink-0 text-right text-sm font-extrabold text-[var(--major-hot)]">
                  {r.points}
                </span>
              </li>
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
function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
