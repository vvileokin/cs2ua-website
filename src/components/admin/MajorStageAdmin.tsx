"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Calculator, Check } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { findTeam } from "@/lib/data";
import { shapeOf, type StageKind } from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Керування стадією пікемів.
 *
 * Три дії, у тому порядку, в якому вони відбуваються насправді: закрити
 * картки, внести підсумок, нарахувати. Розділені вони не для зручності, а
 * тому, що третя незворотна — вона кладе очки в профілі, — і між «внести» та
 * «нарахувати» має бути мить, коли видно, що саме внесено.
 *
 * Замок і початок стадії — одне поле. Окремий прапорець «закрито» був би
 * другим джерелом правди про те, чи приймаються картки, і рано чи пізно
 * розійшовся б із першим; тут «закрити зараз» просто ставить початок на
 * тепер, і сторінка, RPC та адмінка дивляться в одне місце.
 */

export type AdminStage = {
  stage: number;
  title: string;
  kind: StageKind;
  teams: string[];
  startsAt: string;
  actual: Record<string, string> | null;
  scoredAt: string | null;
};

/** Винесено з тіла компонента: час — не чиста величина, і читати його під
 *  час рендера не можна. */
function isLocked(s: AdminStage, now = Date.now()): boolean {
  return now >= new Date(s.startsAt).getTime();
}

export function MajorStageAdmin({
  stages,
  counts,
}: {
  stages: AdminStage[];
  counts: Record<number, number>;
}) {
  const [pick, setPick] = React.useState(stages[0]?.stage ?? 1);
  const stage = stages.find((s) => s.stage === pick) ?? stages[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {stages.map((s) => (
          <button
            key={s.stage}
            type="button"
            onClick={() => setPick(s.stage)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
              s.stage === pick
                ? "bg-accent text-accent-ink"
                : "surface-1 text-ink-muted hover:text-ink",
            )}
          >
            {s.title}
            <span className="ml-2 text-[0.6875rem] font-semibold opacity-70">
              {counts[s.stage] ?? 0} карт.
            </span>
          </button>
        ))}
      </div>

      {/* `key` на стадії — щоб чернетка підсумку не переїжджала за вкладкою.
          Інакше набрані, але не збережені результати однієї стадії
          опинялися б у формі іншої. */}
      <StagePanel key={stage.stage} stage={stage} />
    </div>
  );
}

function StagePanel({ stage }: { stage: AdminStage }) {
  const router = useRouter();
  const shape = shapeOf(stage.kind);
  const [actual, setActual] = React.useState<Record<string, string>>(stage.actual ?? {});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<{ ok: boolean; text: string } | null>(null);

  const locked = isLocked(stage);
  const filled = stage.teams.filter((t) => actual[t]).length;
  const stored = stage.actual ? Object.keys(stage.actual).length : 0;

  async function call(action: string, body: Record<string, unknown> = {}) {
    setBusy(action);
    setNote(null);
    try {
      const r = await fetch("/api/admin/major", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, stage: stage.stage, ...body }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setNote({ ok: false, text: j.error ?? "Не вийшло." });
        return;
      }
      setNote({
        ok: true,
        text:
          action === "score"
            ? `Нараховано ${j.awarded} очок на ${j.cards} карток.`
            : action === "lock"
              ? "Картки закрито."
              : `Підсумок збережено: ${j.filled} команд.`,
      });
      router.refresh();
    } catch {
      setNote({ ok: false, text: "Мережа не відповіла." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Panel title="Стан">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-ink-muted">
            Склад:{" "}
            <b className={cn("tnum", stage.teams.length === shape.roster ? "text-success" : "text-warning")}>
              {stage.teams.length}/{shape.roster}
            </b>
          </span>
          <span className="text-ink-muted">
            Картки: <b className={locked ? "text-danger" : "text-success"}>
              {locked ? "закриті" : "приймаються"}
            </b>
          </span>
          <span className="text-ink-muted">
            Початок:{" "}
            <b className="tnum text-ink">
              {new Date(stage.startsAt).toLocaleString("uk-UA", {
                timeZone: "Europe/Kyiv",
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              })}
            </b>
          </span>
          <span className="text-ink-muted">
            Нараховано: <b className={stage.scoredAt ? "text-success" : "text-ink"}>
              {stage.scoredAt ? "так" : "ні"}
            </b>
          </span>

          {!locked && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Закрити картки цієї стадії просто зараз? Після цього їх не можна буде міняти.")) {
                  void call("lock");
                }
              }}
              disabled={!!busy}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-fill-2 px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-fill-3"
            >
              {busy === "lock" ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Закрити картки зараз
            </button>
          )}
        </div>
      </Panel>

      <Panel
        title={`Підсумок стадії — ${filled} із ${shape.roster}`}
        action={
          <button
            type="button"
            onClick={() => void call("outcome", { actual })}
            disabled={!!busy || !!stage.scoredAt}
            className="inline-flex items-center gap-2 rounded-lg bg-fill-2 px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-fill-3 disabled:opacity-50"
          >
            {busy === "outcome" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Зберегти підсумок
          </button>
        }
      >
        {stage.teams.length === 0 ? (
          <p className="text-sm text-ink-muted">Склад стадії ще не внесений.</p>
        ) : (
          <div className="space-y-1">
            {stage.teams.map((slug) => {
              const team = findTeam(slug);
              return (
                <div key={slug} className="flex flex-wrap items-center gap-2 py-0.5">
                  <span className="w-40 shrink-0 truncate text-sm font-bold text-ink">
                    {team?.name ?? slug}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {shape.outcomes.map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        disabled={!!stage.scoredAt}
                        onClick={() =>
                          setActual((a) =>
                            a[slug] === o.key
                              ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== slug))
                              : { ...a, [slug]: o.key },
                          )
                        }
                        className={cn(
                          "tnum rounded-lg px-2.5 py-1 text-[0.8125rem] font-bold transition-colors",
                          actual[slug] === o.key
                            ? "bg-accent text-accent-ink"
                            : "surface-1 text-ink-muted hover:text-ink",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Нарахування">
        <p className="mb-3 text-sm text-ink-muted">
          Роздає очки за картки цієї стадії й пише їх у профілі. Робиться один
          раз: повторний виклик нічого нікому не додасть, бо зараховані картки
          більше не беруться.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Нарахувати очки за «${stage.title}»? Це незворотно.`)) {
              void call("score");
            }
          }}
          disabled={!!busy || !!stage.scoredAt || stored !== shape.roster}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-extrabold text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-default disabled:bg-fill-2 disabled:text-ink-faint"
        >
          {busy === "score" ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
          Нарахувати очки
        </button>
        {/* Кнопка мертва, доки підсумок не повний — і тут сказано чому,
            бо інакше це виглядає як поломка. */}
        {!stage.scoredAt && stored !== shape.roster && (
          <p className="mt-2 text-[0.8125rem] text-ink-dim">
            Спершу збережи підсумок на всі {shape.roster} команд — зараз у базі {stored}.
          </p>
        )}
      </Panel>

      {note && (
        <p className={cn("text-sm font-semibold", note.ok ? "text-success" : "text-danger")}>
          {note.text}
        </p>
      )}
    </div>
  );
}
