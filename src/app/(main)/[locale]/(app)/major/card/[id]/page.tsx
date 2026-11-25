import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { MajorMode } from "@/components/major/MajorMode";
import { LockedStage } from "@/components/major/LockedStage";
import { getStages, getCardsOf, shapeFor, isOpen } from "@/lib/db/pickem";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const who = await getCardsOf(id);
  return { title: who?.handle ? `Пікем · ${who.handle}` : "Пікем" };
}

/**
 * Чужий пікем.
 *
 * Таблиця каже, хто попереду, і на цьому зупиняється. Питання, яке виникає
 * одразу після неї, — «а що він там навибирав» — досі лишалося без
 * відповіді, хоча відповідь лежить поруч і нікому не зашкодить: після замка
 * картку вже не змінити.
 *
 * Звідси й головне правило, і воно не тут, а в базі: політика на
 * `major_pickem` (0094) віддає чужу картку лише після замка стадії. До
 * замка сторінка просто не має чого показати — і каже про це прямо, замість
 * вдавати, що людини не існує. Відкрити чужий пікем до замка означало б
 * перетворити пікем на змагання «хто зайде останнім».
 *
 * Показуються всі стадії, які видно, а не одна. Цікаво ж не «що він вибрав
 * у третій», а як він грає взагалі: де ризикнув, де пішов за натовпом.
 *
 * Розподіл спільноти сюди не їде. На своїй картці він підказує, наскільки ти
 * сам ішов проти загалу; на чужій це вже не про картку, а про стадію, і
 * повторювати його під кожною людиною — зайвий шум.
 */
export default async function SomeonesCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  /* Перевірка формату, а не існування: сторінка відкрита всім, і підставити
     в адресу що завгодно може будь-хто. Без неї кожен такий рядок їхав би в
     базу й повертався помилкою типу. */
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [who, stages] = await Promise.all([getCardsOf(id), getStages()]);
  if (!who) notFound();

  /* Показуємо лише закриті стадії. Відкрита картка — чернетка, яку автор ще
     міняє, і її тут не було б видно й так: політика її не віддасть. */
  const shown = stages
    .filter((s) => !isOpen(s))
    .map((s) => ({ stage: s, card: who.cards[s.stage] }))
    .filter((x) => !!x.card);

  return (
    <div className="space-y-5 sm:space-y-6">
      <MajorMode />

      <div className="flex items-center gap-3">
        <Link
          href="/major"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-white/[0.06] hover:text-ink"
          aria-label="Назад до пікемів"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <Avatar name={who.handle ?? "?"} src={who.avatarUrl} size="md" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-ink">
            {who.handle ?? "Без імені"}
          </h1>
          <p className="text-[0.8125rem] text-ink-dim">
            {shown.length
              ? `Пікемів: ${shown.length}`
              : "Поки нічого не видно"}
          </p>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[4px] surface-1 px-6 py-12 text-center text-sm text-ink-subtle">
          Чужі пікеми відкриваються після замка стадії — доти їх не видно
          нікому, крім автора.
        </p>
      ) : (
        shown.map(({ stage, card }) => (
          <section key={stage.stage} className="space-y-3">
            <h2 className="flex flex-wrap items-baseline gap-x-2 px-1 text-base font-extrabold text-ink">
              {stage.title}
              {card!.scored && (
                <span className="text-[0.75rem] font-bold text-ink-dim">
                  {card!.hits} із {shapeFor(stage).picks}
                </span>
              )}
            </h2>
            <LockedStage
              shape={shapeFor(stage)}
              teams={stage.teams}
              picks={card!.picks}
              actual={stage.actual}
              hits={card!.hits}
              points={card!.points}
              scored={!!card!.scored}
              dist={null}
            />
          </section>
        ))
      )}
    </div>
  );
}
