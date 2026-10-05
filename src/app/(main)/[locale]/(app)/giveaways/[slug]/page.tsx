import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Check, ListChecks } from "lucide-react";
import { GiveawayEntry } from "@/components/giveaway/GiveawayEntry";
import { isAuraSkin } from "@/lib/data";
import { getGiveawayBySlug } from "@/lib/db/giveaways";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGiveawayBySlug(slug);
  return { title: g?.prize ?? "Розіграш" };
}

export default async function GiveawayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = await getGiveawayBySlug(slug);
  if (!g) notFound();

  /* Будь-який івент, не лише EWC: перевірка на один скін лишала розіграш EPL
     на сірій плиті під зеленою карткою, з якої на нього прийшли. */
  const dressed = isAuraSkin(g.skin);

  return (
    /* Скін на корені, а не лише на банері: палітра івенту потрібна і кнопці
       участі, і таймеру, і списку умов — усі вони читають `--skin-ring`, який
       живе на `data-skin`. */
    <div data-skin={g.skin} className="space-y-6">
      {/* The link and the banner it introduces are one group, on 8px, exactly
          as on the tournament and match pages. As a bare child of `space-y-6`
          it stood 24px clear of the banner and the header read as further down
          the page than everywhere else. */}
      <div className="space-y-2">
        {/* Same back link as those pages too: no plate on hover, no left inset.
            It was the only one styled as a button. */}
        <Link
          href="/giveaways"
          className="-mt-2 inline-flex min-h-11 items-center gap-1 py-2 pr-2 text-sm font-semibold text-ink-subtle transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-4" />
          Усі розіграші
        </Link>

      {/* Prize hero — the same banner language the tournament and match pages
          use, so a giveaway run for the event is dressed by the event rather
          than by a generic panel.

          The stock gift glyph that used to sit on the left is gone: it was a
          placeholder standing in for artwork on a page whose whole subject is
          a picture of a skin, and it made every giveaway look identical. With
          `image` set the artwork *is* the hero; without it the block is simply
          shorter. */}
      {(() => {
        /* `skin-art` і далі тільки для EWC — це їхнє полум'я, в інших подій
           його просто немає. */
        return (
          <div
            data-skin={g.skin}
            className={cn(
              "relative overflow-hidden rounded-xl",
              dressed ? "skin-aura" : "surface-1",
              g.skin === "ewc" && "skin-art",
            )}
            style={
              dressed
                ? undefined
                : {
                    background: `linear-gradient(120deg, color-mix(in oklch, ${g.cover} 22%, var(--surface)), var(--surface) 70%)`,
                  }
            }
          >
            {/* The artwork stays on the card in the listings and doesn't get
                repeated here: at full page width it needed a scrim heavy
                enough to bury the skin, which made the hero worse at both
                jobs. This block is the title, and the title only. */}
            {/* Банер — це назва, і більше нічого.

                Плашка стану звідси пішла: «Активний» на сторінці, де під нею
                цокає таймер і стоїть кнопка участі, нічого не додає. Стан, який
                справді змінює справу — що розіграно, — лишається на картці в
                стрічці й у блоці переможців нижче.

                Разом із плашкою пішли і її відступи: без ряду бейджів банеру
                вистачає одного кроку сітки замість півтора. */}
            <div className="relative flex flex-col justify-end px-5 py-4 sm:px-6 sm:py-5">
              <h1 className="text-balance text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {g.prize}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">{g.sponsor}</p>
            </div>
          </div>
        );
      })()}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Left: details */}
        <div className="space-y-6">
          {/* Smaller on phones, where this paragraph sat above the fold and
              pushed the entry card off it. */}
          <p className="text-pretty text-sm leading-relaxed text-ink-muted sm:text-base">
            {g.description}
          </p>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <ListChecks className="size-4 text-ink-subtle" />
              Умови участі
            </h2>
            <ul
              className={cn(
                "divide-y overflow-hidden rounded-lg",
                // A white hairline across an ember plate is the one seam that
                // reads as a scratch rather than a division — it's the only
                // cool-toned thing on the panel. Warm it to the same family.
                dressed
                  ? "skin-aura-card skin-divide"
                  : "surface-1 divide-[color-mix(in_oklch,var(--ink)_6%,transparent)]",
              )}
            >
              {g.conditions.map((c) => (
                <li key={c} className="flex items-center gap-3 px-4 py-3">
                  {/* Green is the site's "done" colour, and these aren't done —
                      they're the terms. On the event they take the ember, same
                      as every other cue on an EWC surface. */}
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full",
                      dressed
                        ? "bg-[rgb(var(--skin-glow)/0.20)] text-[rgb(var(--skin-ring))]"
                        : "bg-success/15 text-success",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-ink">{c}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right: entry / status.
            It used to be `self-start` so it could stick, which left its plate
            ending 25px short of the conditions beside it — a step with nothing
            to explain it. The page is one short paragraph and four rules long,
            so there was never enough scroll for sticky to earn that. */}
        <div className="flex flex-col">
          <GiveawayEntry giveaway={g} />
        </div>
      </div>
    </div>
  );
}
