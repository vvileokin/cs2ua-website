import type { Metadata } from "next";
import { GiftGlyph } from "@/components/layout/NavGlyphs";
import { PageIntro } from "@/components/ui/PageIntro";
import { GiveawayCard } from "@/components/cards/GiveawayCard";
import { getGiveaways } from "@/lib/db/giveaways";

export const metadata: Metadata = { title: "Розіграші" };

export default async function GiveawaysPage() {
  const giveaways = await getGiveaways();
  const live = giveaways.filter((g) => g.status !== "finished" && !g.drawnAt);
  const done = giveaways.filter((g) => g.status === "finished" || g.drawnAt);
  return (
    <div className="space-y-6">
      <PageIntro icon={GiftGlyph} title="Розіграші" />

      {/* Розіграні призи стоять окремо від тих, у які ще можна зайти.

          Одна сітка на все казала «Розіграші» і показувала виграну кимось AK —
          прийшовши по участь, читач бачив картку, в якій участі вже немає, і
          мусив сам вичитувати з неї статус. Поділ відповідає на це заголовком,
          а порожній перший розділ — це не порожня сторінка, а чесне «зараз
          нічого», яке видно одразу. */}
      {giveaways.length > 0 ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
              Активні
              {live.length > 0 && (
                <span className="tnum font-mono text-ink-subtle">{live.length}</span>
              )}
            </h2>
            {live.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((g) => (
                  <GiveawayCard key={g.slug} g={g} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl well px-6 py-10 text-center text-sm text-ink-subtle">
                Зараз активних розіграшів немає — незабаром зʼявляться нові призи.
              </div>
            )}
          </section>

          {done.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
                Розіграні
                <span className="tnum font-mono text-ink-subtle">{done.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {done.map((g) => (
                  <GiveawayCard key={g.slug} g={g} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-2xl well px-6 py-16 text-center">
          <GiftGlyph className="mx-auto size-8 text-ink-faint" />
          <p className="mt-3 text-sm font-semibold text-ink">Зараз активних розіграшів немає</p>
          <p className="mt-1 text-sm text-ink-subtle">
            Слідкуй за новинами — незабаром зʼявляться нові призи.
          </p>
        </div>
      )}
    </div>
  );
}
