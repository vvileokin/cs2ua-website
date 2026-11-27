import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GiveawayPrize } from "@/lib/data";

/**
 * Що саме розігрується і кому.
 *
 * Зроблено з таблиці призів мейджора й за тією самою логікою: назва скіна
 * нічого не каже тому, хто його не бачив, а побачивши, він упізнає його в
 * інвентарі з першого погляду. Тому картинка тут не прикраса, а власне зміст.
 *
 * Коробка під картинкою однакова для всіх рядків, бо предмети різної
 * довжини: AWP утричі довша за ніж, а миша взагалі квадратна. Якби кожен
 * рядок підлаштовувався під свою картинку, список поїхав би сходинками.
 * Усередині коробки ширину задає `scale` — частка, яку предмет займає, — тож
 * AWP розтягується майже на весь рядок, а ніж лишається ножем.
 *
 * Місце підписане числом, а не словом «перше»: у списку з дев'яти рядків
 * число читається з одного погляду, а слово доводиться дочитувати.
 */
export function GiveawayPrizes({
  prizes,
  dressed,
}: {
  prizes: GiveawayPrize[];
  /** Розіграш у кольорах події — тоді плита й роздільники беруть її палітру. */
  dressed: boolean;
}) {
  if (!prizes.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
        Призи · {prizes.length}
      </h2>

      <ol
        className={cn(
          "divide-y overflow-hidden rounded-lg",
          dressed
            ? "skin-aura-card skin-divide"
            : "surface-1 divide-[color-mix(in_oklch,var(--ink)_6%,transparent)]",
        )}
      >
        {prizes.map((p, i) => (
          <li key={`${p.title}-${i}`} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            <span
              className={cn(
                "tnum w-6 shrink-0 text-right text-sm font-extrabold",
                dressed ? "text-[rgb(var(--skin-ring))]" : "text-ink-dim",
              )}
            >
              {i + 1}
            </span>

            {p.img && (
              <span className="flex h-9 w-24 shrink-0 items-center justify-center sm:h-12 sm:w-32">
                <span
                  className="relative block h-full"
                  style={{ width: `${Math.round((p.scale ?? 1) * 100)}%` }}
                >
                  <Image
                    src={p.img}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </span>
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{p.title}</span>
              {p.sub && (
                <span className="block truncate text-[0.75rem] text-ink-dim">{p.sub}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
