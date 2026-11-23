"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Calculator, Check, Plus, X } from "lucide-react";
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

export type PlayedMatch = { a: string; b: string; w: string };
export type OpeningMatch = {
  a: string;
  b: string;
  at: string;
  oa?: number | null;
  ob?: number | null;
};

export type AdminStage = {
  stage: number;
  title: string;
  kind: StageKind;
  teams: string[];
  startsAt: string;
  played: PlayedMatch[];
  opening: OpeningMatch[];
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
  const [played, setPlayed] = React.useState<PlayedMatch[]>(stage.played ?? []);
  const [pair, setPair] = React.useState<{ a: string; b: string }>({ a: "", b: "" });
  const [odds, setOdds] = React.useState<OpeningMatch[]>(stage.opening ?? []);
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

      {/* Коефіцієнти BetKing.
          Вносяться руками, бо брати їх нема звідки: лінія живе всередині
          їхнього застосунку, без відкритого ендпоінта. Вісім матчів —
          шістнадцять чисел, і зате це справжні чужі числа, а не наші,
          видані за чужі. Порожнє поле — рядок просто без пігулки. */}
      {stage.opening.length > 0 && (
        <Panel
          title="Коефіцієнти BetKing"
          action={
            <button
              type="button"
              onClick={() => void call("odds", { opening: odds })}
              disabled={!!busy}
              className="inline-flex items-center gap-2 rounded-lg bg-fill-2 px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-fill-3 disabled:opacity-50"
            >
              {busy === "odds" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Зберегти коефіцієнти
            </button>
          }
        >
          <div className="space-y-1.5">
            {stage.opening.map((m, i) => (
              <div key={`${m.a}-${m.b}`} className="flex flex-wrap items-center gap-2">
                <span className="w-32 shrink-0 truncate text-sm font-bold text-ink">
                  {findTeam(m.a)?.tag ?? m.a} — {findTeam(m.b)?.tag ?? m.b}
                </span>
                <OddsInput
                  value={odds[i]?.oa}
                  onChange={(v) =>
                    setOdds((list) => list.map((x, k) => (k === i ? { ...x, oa: v } : x)))
                  }
                />
                <OddsInput
                  value={odds[i]?.ob}
                  onChange={(v) =>
                    setOdds((list) => list.map((x, k) => (k === i ? { ...x, ob: v } : x)))
                  }
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.8125rem] text-ink-dim">
            Лінія: betking.com.ua → Кіберспорт → CS2 Major Singapore. У них
            BC.Game називається GOSH.
          </p>
        </Panel>
      )}

      {/* Зіграні матчі — не для нарахування, а для шансів.
          Нарахування бере підсумок стадії (нижче), а шанси рахуються від
          того, що вже сталося: без переліку матчів відсотки застигають на
          тих, що були до першої карти. */}
      <Panel
        title={`Зіграні матчі — ${played.length}`}
        action={
          <button
            type="button"
            onClick={() => void call("played", { played })}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-lg bg-fill-2 px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-fill-3 disabled:opacity-50"
          >
            {busy === "played" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Зберегти матчі
          </button>
        }
      >
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Select
            label="Перша"
            value={pair.a}
            teams={stage.teams}
            onChange={(v) => setPair((p) => ({ ...p, a: v }))}
          />
          <Select
            label="Друга"
            value={pair.b}
            teams={stage.teams}
            onChange={(v) => setPair((p) => ({ ...p, b: v }))}
          />
          {/* Переможець обирається кнопкою, а не третім списком: пара вже
              задана, і вибір тут завжди з двох. */}
          {(["a", "b"] as const).map((side) => {
            const slug = pair[side];
            if (!slug) return null;
            return (
              <button
                key={side}
                type="button"
                onClick={() => {
                  if (!pair.a || !pair.b || pair.a === pair.b) return;
                  setPlayed((list) => [...list, { a: pair.a, b: pair.b, w: slug }]);
                  setPair({ a: "", b: "" });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-fill-2 px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-fill-3"
              >
                <Plus className="size-3.5" />
                виграла {findTeam(slug)?.tag ?? slug}
              </button>
            );
          })}
        </div>

        {played.length === 0 ? (
          <p className="text-sm text-ink-muted">Поки жодного матчу.</p>
        ) : (
          <ol className="space-y-1">
            {played.map((m, i) => (
              <li key={`${m.a}-${m.b}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="tnum w-6 shrink-0 text-right text-ink-dim">{i + 1}</span>
                <span className={cn("font-bold", m.w === m.a ? "text-success" : "text-ink-dim")}>
                  {findTeam(m.a)?.name ?? m.a}
                </span>
                <span className="text-ink-dim">—</span>
                <span className={cn("font-bold", m.w === m.b ? "text-success" : "text-ink-dim")}>
                  {findTeam(m.b)?.name ?? m.b}
                </span>
                <button
                  type="button"
                  onClick={() => setPlayed((list) => list.filter((_, k) => k !== i))}
                  className="ml-auto text-ink-dim transition-colors hover:text-danger"
                  aria-label="прибрати"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-3 text-[0.8125rem] text-ink-dim">
          Після збереження перерахувати шанси:{" "}
          <code className="rounded bg-fill-2 px-1.5 py-0.5 font-mono text-[0.75rem]">
            node scripts/major-odds.mjs {stage.stage}
          </code>
        </p>
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

function OddsInput({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      step="0.01"
      min="1"
      inputMode="decimal"
      placeholder="—"
      value={value ?? ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(e.target.value === "" || !Number.isFinite(n) ? null : n);
      }}
      className="tnum h-9 w-20 rounded-lg surface-1 px-2 text-sm font-bold text-ink"
    />
  );
}

function Select({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: string;
  teams: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg surface-1 px-2 text-sm font-bold text-ink"
      >
        <option value="">—</option>
        {teams.map((t) => (
          <option key={t} value={t}>
            {findTeam(t)?.name ?? t}
          </option>
        ))}
      </select>
    </label>
  );
}
