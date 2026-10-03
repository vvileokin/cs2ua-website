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
 * Картка швейцарки — розсадити шістнадцять по шести кошиках.
 *
 * Турнір сам диктує форму: двоє виходять 3-0, троє 3-1, троє 3-2, і дзеркально
 * униз. Тому це не список фаворитів, а розкладка всього поля, і кошики мають
 * фіксовану місткість — у повній картці вільних місць не лишається.
 *
 * Призначення без перетягування: тицяєш команду, тицяєш кошик. Перетягування
 * на телефоні програє в точності, а тут шістнадцять дрібних об'єктів і шість
 * цілей, тобто саме той випадок, де воно ламається найчастіше.
 */
export function EplSwissCard({ teamSlugs }: { teamSlugs: string[] }) {
  const user = useUser();
  const [data, setData] = React.useState<Api | null>(null);
  const [picks, setPicks] = React.useState<EplSwissPicks>({});
  const [held, setHeld] = React.useState<string | null>(null);
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

  const left = (b: EplBucket) =>
    EPL_CAPACITY[b] - teamSlugs.filter((s) => picks[s] === b).length;
  const placed = teamSlugs.filter((s) => picks[s]).length;
  const complete = placed === teamSlugs.length;
  const locked = data ? !data.open : false;
  const scored = !!data?.card?.scored;

  /** Тицяння по кошику кладе туди підняту команду, якщо там є місце. */
  const drop = (b: EplBucket) => {
    if (!held || locked || scored) return;
    if (picks[held] !== b && left(b) <= 0) return;
    setPicks((p) => ({ ...p, [held]: b }));
    setHeld(null);
    setSaved(false);
  };

  const take = (slug: string) => {
    if (locked || scored) return;
    if (held === slug) { setHeld(null); return; }
    setHeld(slug);
  };

  const clear = (slug: string) => {
    if (locked || scored) return;
    setPicks((p) => { const n = { ...p }; delete n[slug]; return n; });
    setSaved(false);
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
    <div className="skin-aura-card space-y-4 rounded-xl p-3 sm:p-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-white">Картка швейцарки</h2>
        <p className="text-sm text-white/55">
          Швейцарка на шістнадцять завжди закінчується однаково: двоє виходять 3-0, троє 3-1,
          троє 3-2, троє вилітають 2-3, троє 1-3, двоє 0-3. Розсади все поле по цих кошиках.
        </p>
      </div>

      {/* Ціни. Крайні кошики вузькі — туди треба назвати не найсильнішого,
          а того, хто пройде без поразки, і не найслабшого, а того, хто
          посиплеться повністю. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <Price label="3:0 або 0:3" value={EPL_SCORING.exact["3-0"]} />
        <Price label="середній кошик" value={EPL_SCORING.exact["3-1"]} />
        <Price label="сторона вгадана" value={EPL_SCORING.side} />
        <Price label="уся картка" value={EPL_SCORING.perfect} />
      </dl>

      {/* Кошики. Повний кошик перестає приймати, тож неправильну картку не
          зберегти — її просто неможливо зібрати. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EPL_BUCKETS.map((b) => {
          const mine = teamSlugs.filter((s) => picks[s] === b);
          const free = left(b);
          const through = b.startsWith("3");
          return (
            <button
              key={b}
              type="button"
              onClick={() => drop(b)}
              disabled={!held || (free <= 0 && picks[held] !== b)}
              className={cn(
                "space-y-1.5 rounded-lg p-2 text-left transition-colors",
                through
                  ? "bg-[color-mix(in_oklch,oklch(0.62_0.17_150)_18%,transparent)]"
                  : "bg-[color-mix(in_oklch,oklch(0.55_0.2_25)_18%,transparent)]",
                held && free > 0 && "ring-1 ring-[rgb(var(--skin-ring))]",
                !held && "cursor-default",
              )}
            >
              <span className="flex items-baseline justify-between">
                <span className="font-mono text-sm font-bold text-white">{b.replace("-", ":")}</span>
                <span className="text-[0.625rem] text-white/45">{mine.length}/{EPL_CAPACITY[b]}</span>
              </span>
              <span className="flex flex-wrap gap-1">
                {Array.from({ length: EPL_CAPACITY[b] }, (_, i) => {
                  const slug = mine[i];
                  const t = slug ? getTeam(slug) : undefined;
                  return t ? (
                    <span
                      key={slug}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); clear(slug!); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); clear(slug!); } }}
                    >
                      <TeamLogo team={t} size="xs" />
                    </span>
                  ) : (
                    <span
                      key={`${b}-${i}`}
                      className="grid size-5 place-items-center rounded bg-black/30 text-[0.5625rem] text-white/25"
                    >
                      ?
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Поле. Команда, яку вже розсадили, тьмяніє, але лишається на місці —
          так видно, кого ще не поставив, не рахуючи по кошиках. */}
      <div className="flex flex-wrap gap-1.5">
        {teamSlugs.map((slug) => {
          const t = getTeam(slug);
          const seated = !!picks[slug];
          return (
            <button
              key={slug}
              type="button"
              onClick={() => take(slug)}
              className={cn(
                "rounded-lg p-0.5 transition-opacity",
                seated && "opacity-35",
                held === slug && "ring-2 ring-[rgb(var(--skin-ring))]",
              )}
              aria-label={t.name}
            >
              <TeamLogo team={t} size="sm" />
            </button>
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
              complete
                ? "bg-[rgb(var(--skin-ring))] text-black"
                : "bg-white/10 text-white/40",
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
            {saved ? "Збережено" : complete ? "Зберегти картку" : `Розсаджено ${placed} з ${teamSlugs.length}`}
          </button>
        )}
        <span className="text-xs text-white/40">
          максимум {formatInt(EPL_MAX)} <BrandIcon name="points-epl" className="inline size-3.5 align-text-bottom" />
        </span>
      </div>

      {error && <p className="text-xs text-[rgb(var(--skin-ring))]">{error}</p>}
    </div>
  );
}

function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:block">
      <dt className="text-white/45">{label}</dt>
      <dd className="font-mono font-bold text-white">+{value}</dd>
    </div>
  );
}
