import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { socials } from "@/lib/data";
import { formatCompact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Усі посилання",
  description: "Telegram, Instagram і TikTok CS2 UA — в одному місці.",
  openGraph: {
    title: "CS2 UA — усі посилання",
    description: "Telegram, Instagram і TikTok в одному місці.",
  },
};

/**
 * Сторінка-візитівка для шапки телеграм-каналу.
 *
 * Живе за адресою /links і ніде не висить у навігації: це не розділ сайту, а
 * одна адреса, яку кладуть у біо, і з якої людина йде далі. Тому тут немає ні
 * бокового меню, ні нижньої панелі — сторінка лежить поза групою (app), як
 * вхід і реєстрація.
 *
 * Кнопки великі й у кольорі своєї платформи: читач приходить сюди з телефону і
 * шукає не текст, а знайомий значок. Під назвою — кількість підписників: це і
 * є причина натиснути, і вона ж каже, що посилання живе.
 */
const TONE: Record<string, { glow: string; ink: string }> = {
  telegram: { glow: "#2AABEE", ink: "#2AABEE" },
  instagram: { glow: "#E1306C", ink: "#E1306C" },
  tiktok: { glow: "#25F4EE", ink: "#25F4EE" },
};

export default function LinksPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <Brand />
        <p className="text-sm text-ink-muted text-balance">
          Найбільша спільнота з CS2 в Україні.
        </p>
      </div>

      <nav className="flex flex-col gap-3">
        {socials.map((s) => {
          const tone = TONE[s.key] ?? { glow: "var(--accent)", ink: "var(--accent)" };
          return (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              style={{ boxShadow: `0 10px 36px -24px ${tone.glow}` }}
              className="lift surface-1 group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl"
                style={{ background: `color-mix(in oklch, ${tone.glow} 16%, transparent)`, color: tone.ink }}
              >
                <Glyph name={s.key} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{s.label}</span>
                <span className="block truncate text-xs text-ink-subtle">{s.handle}</span>
              </span>
              <span className="tnum shrink-0 font-mono text-xs font-bold text-ink-muted">
                {formatCompact(s.followers)}
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          );
        })}
      </nav>

      {/* Сам сайт теж посилання: сюди приходять із телеграму, і половина з них
          не знає, що тут є матчі, прогнози й розіграші. */}
      <Link
        href="/"
        className="mx-auto inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        Відкрити сайт — матчі, прогнози, розіграші
        <ArrowUpRight className="size-3.5" />
      </Link>
    </main>
  );
}

/** Знаки платформ. Лежать тут, бо більше ніде на сайті вони не трапляються. */
function Glyph({ name }: { name: string }) {
  if (name === "telegram") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
        <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.9c.38-.33-.08-.52-.59-.19L6.97 13.1l-4.64-1.45c-1.01-.32-1.03-1.01.21-1.5l18.14-6.99c.84-.31 1.57.19 1.26 1.14Z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12v-3.1a5.7 5.7 0 0 0-.78-.06 5.69 5.69 0 1 0 5.69 5.69V9.01a7.35 7.35 0 0 0 4.3 1.38v-3.1a4.28 4.28 0 0 1-3.25-1.47Z" />
    </svg>
  );
}
