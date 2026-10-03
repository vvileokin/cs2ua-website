"use client";

import * as React from "react";
import { Check, Loader2, Lock, LockOpen } from "lucide-react";
import { AdminHead, Panel } from "@/components/admin/ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam } from "@/lib/data";
import { EPL_BUCKETS, EPL_CAPACITY, type EplBucket, type EplSwissPicks } from "@/lib/epl-swiss";
import { cn, formatInt } from "@/lib/utils";

type Status = {
  total: number;
  scored: number;
  paid: number;
  closed: boolean;
  actual: EplSwissPicks | null;
  ready: boolean;
  reason: string | null;
};

/**
 * Швейцарка EPL: замок і розрахунок.
 *
 * Підсумок не вводять руками. Клуб 0-2 доводилося вбивати вручну, бо «вилетів
 * без жодної перемоги» ззовні не видно; тут видно все — три перемоги виводять,
 * три поразки виносять, і кошик кожної команди читається з результатів. Тому
 * сторінка показує те, що порахувала сама, і просить лише підтвердити.
 *
 * Поки турнір не дограно, кнопка розрахунку не працює і каже, чого бракує:
 * платити за неповними кошиками не можна, бо виплата одноразова.
 */
export default function EplAdmin() {
  const [s, setS] = React.useState<Status | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/epl-swiss", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (j.ok) setS(j as Status);
    else setError(j.error ?? "Не вдалося прочитати стан");
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (!s) return;
    setBusy("lock");
    setError(null);
    const res = await fetch("/api/admin/epl-swiss", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ closed: !s.closed }),
    });
    const j = await res.json().catch(() => ({}));
    if (!j.ok) setError(j.error ?? "Не вдалося перемкнути");
    else await load();
    setBusy(null);
  };

  const settle = async () => {
    setBusy("settle");
    setError(null);
    const res = await fetch("/api/admin/epl-swiss", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!j.ok) setError(j.error ?? "Не вдалося розрахувати");
    else {
      setDone(Number(j.scored ?? 0));
      await load();
    }
    setBusy(null);
  };

  return (
    <div>
      <AdminHead
        title="Швейцарка EPL"
        subtitle="Замок на картку прогнозу і разовий розрахунок за підсумком турніру."
      />

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Panel title="Підсумок турніру">
          {s?.actual ? (
            <div className="space-y-3">
              {EPL_BUCKETS.map((b) => (
                <Bucket key={b} bucket={b} picks={s.actual!} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-subtle">
              {s?.reason ?? "Рахую…"}
              {s && !s.ready && (
                <span className="mt-1 block text-xs">
                  Кошики заповнюються самі з результатів матчів — щойно всі 16 команд
                  дограють, тут зʼявиться підсумок, а кнопка розрахунку ввімкнеться.
                </span>
              )}
            </p>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Картки">
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Figure label="Зібрано" value={s ? formatInt(s.total) : "—"} />
              <Figure label="Оплачено" value={s ? formatInt(s.scored) : "—"} />
              <Figure label="Виплачено" value={s ? formatInt(s.paid) : "—"} />
            </dl>
          </Panel>

          <Panel title="Замок">
            <p className="mb-3 text-xs text-ink-subtle">
              Картка і так зачиняється зі стартом другого туру. Цей вимикач зачиняє її
              раніше — і відчиняє назад, поки годинник дозволяє.
            </p>
            <button
              type="button"
              onClick={toggle}
              disabled={busy !== null || !s}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors",
                s?.closed
                  ? "bg-white/10 text-ink hover:bg-white/15"
                  : "bg-danger/15 text-danger hover:bg-danger/25",
              )}
            >
              {busy === "lock" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : s?.closed ? (
                <LockOpen className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
              {s?.closed ? "Відкрити назад" : "Закрити картку"}
            </button>
          </Panel>

          <Panel title="Розрахунок">
            <p className="mb-3 text-xs text-ink-subtle">
              Платить кожній картці, якої ще не платили: 150 за точний 3:0 або 0:3, 60 за
              інший точний рахунок, 20 за вгадану сторону і 500 за картку без помилок.
              Друге натискання нічого не платить удруге.
            </p>
            <button
              type="button"
              onClick={settle}
              disabled={busy !== null || !s?.ready}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors",
                s?.ready ? "bg-accent text-black hover:brightness-110" : "bg-white/10 text-ink-subtle",
              )}
            >
              {busy === "settle" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : done !== null ? (
                <Check className="size-4" />
              ) : null}
              {done !== null ? `Розраховано · ${done}` : "Розрахувати швейцарку"}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Один кошик підсумку: рахунок і команди, що в ньому опинилися. */
function Bucket({ bucket, picks }: { bucket: EplBucket; picks: EplSwissPicks }) {
  const slugs = Object.keys(picks).filter((s) => picks[s] === bucket);
  const through = bucket.startsWith("3");
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "tnum w-10 shrink-0 font-mono text-sm font-bold",
          through ? "text-success" : "text-danger",
        )}
      >
        {bucket.replace("-", ":")}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {slugs.map((slug) => (
          <span key={slug} className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] py-1 pl-1 pr-2.5">
            <TeamLogo team={getTeam(slug)} size="xs" />
            <span className="text-xs font-semibold text-ink">{getTeam(slug).name}</span>
          </span>
        ))}
        {slugs.length !== EPL_CAPACITY[bucket] && (
          <span className="text-xs text-ink-subtle">
            {slugs.length} з {EPL_CAPACITY[bucket]}
          </span>
        )}
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2 py-2">
      <dt className="text-[0.6875rem] leading-none text-ink-subtle">{label}</dt>
      <dd className="tnum mt-1.5 font-mono text-sm font-extrabold leading-none text-ink">{value}</dd>
    </div>
  );
}
