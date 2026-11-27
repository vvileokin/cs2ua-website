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
 * Коробка під картинкою однакова для всіх рядків, і предмет вписується в
 * неї цілком. Спершу ширину всередині коробки задавала частка від справжньої
 * довжини зброї — як у таблиці призів мейджора, — але там усі призи зброя, а
 * тут поруч стоять миша, джерсі й AWP. Миша при такому правилі виходила
 * вдвічі дрібнішою за ніж, хоча в руках вона більша: справжні розміри цих
 * речей не зводяться в одну шкалу, і спроба їх звести дає не правду, а
 * безлад.
 *
 * Але й «хай займає скільки влізе» не годиться: присадкуваті речі —
 * пістолети, ніж — упираються у висоту коробки й виходять масивними, тоді як
 * автомат упирається в ширину й лишається тонкою смужкою.
 *
 * Тому в кожного предмета є `fit` — найбільша частка ВИСОТИ коробки, яку йому
 * дозволено зайняти. Саме висоти, а не ширини: довгій зброї висота й так не
 * потрібна, вона впирається в ширину, а присадкуватій саме висота й додає
 * зайвої ваги. Одне число керує рівно тим, що виглядає не так.
 *
 * Квадратні речі — миша, джерсі — беруть усю висоту, бо інакше в рядку
 * заввишки з палець від них нічого не лишається.
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
        Призи
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
                /* Відступ праворуч більший за решту проміжків у рядку:
                   число стоїть упритул до картинки, і «4» читалося як
                   частина автомата. Номер місця — окремий стовпчик, а не
                   підпис до предмета. */
                "tnum mr-4 w-6 shrink-0 text-right text-sm font-extrabold sm:mr-6",
                dressed ? "text-[rgb(var(--skin-ring))]" : "text-ink-dim",
              )}
            >
              {i + 1}
            </span>

            {p.img && (
              <span className="flex h-12 w-28 shrink-0 items-center justify-center sm:h-14 sm:w-36">
                <span
                  className="relative block w-full"
                  style={{ height: `${Math.round((p.fit ?? 1) * 100)}%` }}
                >
                  <Image src={p.img} alt="" fill sizes="144px" className="object-contain" />
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
