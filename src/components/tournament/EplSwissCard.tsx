"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { Check, Loader2, Lock, LogIn } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { useUser } from "@/lib/supabase/use-user";
import { getTeam } from "@/lib/data";
import {
  EPL_BUCKETS, EPL_CAPACITY, EPL_MAX, EPL_SCORING,
  type EplBucket, type EplSwissPicks,
} from "@/lib/epl-swiss";
import { cn, formatInt } from "@/lib/utils";

type Api = {
  open: boolean;
  closesAt: string | null;
  card: { picks: EplSwissPicks; points: number; scored: boolean } | null;
};

/**
 * Картка швейцарки — кожній команді свій рахунок.
 *
 * Перша версія працювала у два кроки: підніми команду, постав у кошик. Це
 * виглядало компактно і читалося ніяк — стан «щось підняте» ніде не видно, а
 * шістнадцять дрібних гербів унизу не кажуть, кого вже розсаджено.
 *
 * Тут вибір стоїть поруч із командою: рядок, шість кнопок, одна натиснута.
 * Видно і що вибрано, і що лишилось, і скільки місць у кошику ще вільні — без
 * жодного прихованого стану. Повний кошик гасне, тож зібрати неправильну
 * картку просто неможливо.
 */
export function EplSwissCard({ teamSlugs }: { teamSlugs: string[] }) {
  const user = useUser();
  const [data, setData] = React.useState<Api | null>(null);
  const [picks, setPicks] = React.useState<EplSwissPicks>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/epl-swiss", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Api) => {
        if (cancelled) return;
        setData(d);
        if (d.card?.picks) setPicks(d.card.picks);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [user]);

  const taken = (b: EplBucket) => teamSlugs.filter((s) => picks[s] === b).length;
  const placed = teamSlugs.filter((s) => picks[s]).length;
  const complete = placed === teamSlugs.length;
  const locked = data ? !data.open : false;
  const scored = !!data?.card?.scored;
  const frozen = locked || scored;

  const choose = (slug: string, b: EplBucket) => {
    if (frozen) return;
    setSaved(false);
    setPicks((p) => {
      if (p[slug] === b) { const n = { ...p }; delete n[slug]; return n; }
      if (taken(b) >= EPL_CAPACITY[b]) return p;
      return { ...p, [slug]: b };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/epl-swiss", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "Не збереглося.");
      else setSaved(true);
    } catch {
      setError("Не збереглося — спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="skin-aura-card space-y-3 rounded-xl p-3 sm:p-4">
      {/* Ціни — і є інструкція: з них видно, що робити і за що платять. */}
      <dl className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        <Price label="Точний рахунок 3:0 або 0:3" value={EPL_SCORING.exact["3-0"]} />
        <Price label="Точний рахунок 3:1, 3:2, 2:3, 1:3" value={EPL_SCORING.exact["3-1"]} />
        <Price label="Пройшла чи вилетіла, але рахунок інший" value={EPL_SCORING.side} />
        <Price label="Уся картка без помилок" value={EPL_SCORING.perfect} />
      </dl>

      {/* Скільки місць лишилось у кожному кошику. Та сама шістка, що і в
          рядках нижче, тож колонки читаються згори вниз. */}
      <div className="flex items-center gap-2 rounded-lg bg-black/25 px-2 py-1.5">
        {/* Та сама ширина, що і колонка з гербом нижче, щоб шістки збіглися. */}
        <span className="w-7 shrink-0 self-center text-[0.625rem] font-semibold uppercase tracking-wide text-white/35 sm:w-[7.5rem]">
          <span className="hidden sm:inline">вільних місць</span>
        </span>
        <span className="flex flex-1 gap-1">
          {EPL_BUCKETS.map((b) => (
            <span
              key={b}
              className={cn(
                "flex-1 text-center font-mono text-[0.6875rem] font-bold",
                b.startsWith("3") ? "text-[oklch(0.78_0.17_148)]" : "text-[oklch(0.7_0.17_27)]",
              )}
            >
              {b.replace("-", ":")}
              <span className="ml-1 text-white/35">{EPL_CAPACITY[b] - taken(b)}</span>
            </span>
          ))}
        </span>
      </div>

      {/* Поле. Рядок на команду, вибір поруч із нею. */}
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-lg bg-black/20">
        {teamSlugs.map((slug) => {
          const t = getTeam(slug);
          const mine = picks[slug];
          return (
            <div key={slug} className="flex items-center gap-2 px-2 py-1.5">
              <span className="flex w-7 min-w-0 shrink-0 items-center gap-2 sm:w-[7.5rem]">
                <TeamLogo team={t} size="sm" />
                <span className="hidden min-w-0 truncate text-xs font-semibold text-white sm:block">
                  {t.name}
                </span>
              </span>
              <span className="flex flex-1 gap-1">
                {EPL_BUCKETS.map((b) => {
                  const chosen = mine === b;
                  const full = !chosen && taken(b) >= EPL_CAPACITY[b];
                  const through = b.startsWith("3");
                  return (
                    <button
                      key={b}
                      type="button"
                      disabled={frozen || full}
                      onClick={() => choose(slug, b)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 font-mono text-[0.6875rem] font-bold transition-colors",
                        chosen
                          ? through
                            ? "bg-[oklch(0.6_0.19_148)] text-black"
                            : "bg-[oklch(0.55_0.21_27)] text-white"
                          : full
                            ? "bg-white/[0.03] text-white/15"
                            : "bg-white/[0.07] text-white/55 hover:bg-white/[0.12]",
                      )}
                    >
                      {b.replace("-", ":")}
                    </button>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!user ? (
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white"
          >
            <LogIn className="size-4" /> Увійти, щоб зберегти
          </Link>
        ) : scored ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <BrandIcon name="points-epl" className="size-4" />
            {formatInt(data?.card?.points ?? 0)} за картку
          </span>
        ) : locked ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-white/55">
            <Lock className="size-4" /> Картку закрито — другий тур почався
          </span>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={!complete || saving}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors",
              complete ? "bg-[rgb(var(--skin-ring))] text-black" : "bg-white/10 text-white/40",
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
            {saved ? "Збережено" : complete ? "Зберегти картку" : `Розсаджено ${placed} з ${teamSlugs.length}`}
          </button>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-white/40">
          максимум {formatInt(EPL_MAX)}
          <BrandIcon name="points-epl" className="size-3.5" />
        </span>
      </div>

      {error && <p className="text-xs text-[rgb(var(--skin-ring))]">{error}</p>}
    </div>
  );
}

function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-md bg-black/20 px-2 py-1.5">
      <dt className="min-w-0 text-white/60">{label}</dt>
      <dd className="shrink-0 font-mono font-bold text-[rgb(var(--skin-ring))]">+{value}</dd>
    </div>
  );
}
