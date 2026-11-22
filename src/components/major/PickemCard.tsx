"use client";

import * as React from "react";
import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import {
  ROLES,
  ROLE_CAP,
  ROLE_LABEL,
  ROLE_PRICE,
  ROLE_TITLE,
  isComplete,
  type PickRole,
  type PickemPicks,
} from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Картка стадії — сітка, як у клієнті.
 *
 * Перша версія була таблицею: рядок на команду, три кнопки в кожному. Вона
 * працювала, і це все хороше, що про неї можна сказати. Пікем — задача про
 * розподіл: шістнадцять команд треба розкласти по трьох кошиках так, щоб
 * кошики зійшлися. У вигляді списку цього не видно взагалі: кошик існує
 * тільки як число в лічильнику, і щоб побачити, кого ти вже поклав у «3:0»,
 * доводиться читати всі шістнадцять рядків.
 *
 * Тут кошики — це предмети. Зліва склад стадії, справа три коробки з
 * комірками, і скільки в них лишилося місця, видно з того, скільки комірок
 * порожні. Рівно так улаштований пікем у самій грі, і впізнається він з
 * одного погляду.
 *
 * Без перетягування. У клієнті команди тягнуть мишею; половина людей тут
 * приходить із телефона, а drag&drop на тачі — це або власні жести, або
 * бібліотека вагою з пів сторінки. Замість цього два дотики: команда, потім
 * коробка. Працює в обох порядках — можна спершу вибрати коробку й
 * настукати в неї кілька команд поспіль, що швидше за все й робитимуть із
 * шісткою проходу.
 *
 * Обраний кошик лишається активним, доки не заповниться. Скидати його після
 * кожної команди означало б шість зайвих дотиків там, де потрібно шість.
 */

/** Тон кошика. Шкала одного кольору події: 3:0 найгарячіше, прохід тихіше,
 *  виліт холодний. Зелене з червоним, як у клієнті, тут пробувалося й пішло:
 *  на багряній сторінці зелений читався як чужий елемент, а не як «пройшов». */
const TONE: Record<PickRole, "win" | "pass" | "out"> = {
  "3-0": "win",
  adv: "pass",
  "0-3": "out",
};

/** Заливка ряду, коли кошик заповнений. */
const BOX_FULL: Record<PickRole, string> = {
  "3-0": "bg-[color-mix(in_oklch,var(--major-hot)_15%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major-hot)_46%,transparent)]",
  adv: "bg-[color-mix(in_oklch,var(--major)_11%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major)_34%,transparent)]",
  "0-3": "bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]",
};

/** Колір підпису кошика і його пунктирних комірок. */
const BOX_TINT: Record<PickRole, string> = {
  "3-0": "var(--major-hot)",
  adv: "var(--major)",
  /* Виліт — не колір події, а її відсутність: команди на цьому мейджорі
     більше немає, і світитися їй нічим. */
  "0-3": "color-mix(in oklch, var(--ink) 55%, transparent)",
};

export function PickemCard({
  stage,
  teams,
  initial,
}: {
  stage: number;
  teams: string[];
  initial: PickemPicks;
}) {
  const [picks, setPicks] = React.useState<PickemPicks>(initial);
  const [sel, setSel] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<PickRole | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  /** Хто стоїть у кошику, у порядку додавання. */
  const inRole = React.useCallback(
    (role: PickRole) => Object.keys(picks).filter((t) => picks[t] === role),
    [picks],
  );

  const complete = isComplete(picks);
  const dirty = JSON.stringify(picks) !== JSON.stringify(initial);

  function place(team: string, role: PickRole) {
    setSaved(false);
    setPicks((prev) => {
      if (Object.keys(prev).filter((t) => prev[t] === role).length >= ROLE_CAP[role]) {
        return prev;
      }
      return { ...prev, [team]: role };
    });
    setSel(null);
    // Кошик лишається активним, поки в ньому є місце.
    setTarget((t) =>
      t === role &&
      Object.keys(picks).filter((x) => picks[x] === role).length + 1 >= ROLE_CAP[role]
        ? null
        : t,
    );
  }

  function pickTeam(team: string) {
    if (picks[team]) return; // вже в кошику — знімається кліком по комірці
    if (target && inRole(target).length < ROLE_CAP[target]) {
      place(team, target);
      return;
    }
    setSel((s) => (s === team ? null : team));
  }

  function hitBox(role: PickRole) {
    const full = inRole(role).length >= ROLE_CAP[role];
    if (sel && !full) {
      place(sel, role);
      return;
    }
    if (full) return;
    setTarget((t) => (t === role ? null : role));
  }

  function remove(team: string) {
    setSaved(false);
    setPicks((prev) => {
      const next = { ...prev };
      delete next[team];
      return next;
    });
  }

  async function save() {
    if (!complete || saving) return;
    setSaving(true);
    setNote(null);
    try {
      const r = await fetch("/api/major/pickem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, picks }),
      });
      const j = await r.json();
      if (!r.ok) setNote(j.error ?? "Не вдалося зберегти.");
      else setSaved(true);
    } catch {
      setNote("Мережа не відповіла. Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
        {/* --- Склад стадії --- */}
        <section className="major-plate rounded-2xl p-3 sm:p-4">
          <p className="mb-3 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-dim">
            {target
              ? `Обери команду в «${ROLE_LABEL[target]}»`
              : sel
                ? "Тепер обери кошик праворуч"
                : "Склад стадії"}
          </p>

          {/* Пакування, а не сітка на всю ширину.
              `grid-cols-8` розтягував вісім колонок по всій панелі: комірка
              виходила ~130px під 40-піксельний герб, і між гербами лишалося
              по сто пікселів порожнечі. Тут ширину задає сам елемент, а
              рядок просто набирає стільки, скільки влізло, — відстань між
              гербами однакова на будь-якому екрані. */}
          <div className="flex flex-wrap gap-1">
            {teams.map((slug) => {
              const team = findTeam(slug);
              const used = !!picks[slug];
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => pickTeam(slug)}
                  disabled={used}
                  aria-pressed={sel === slug}
                  title={team?.name ?? slug}
                  className={cn(
                    "flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors duration-150",
                    used ? "cursor-default" : "hover:bg-white/[0.04]",
                  )}
                >
                  <MajorCrest
                    team={team}
                    slug={slug}
                    size={40}
                    state={used ? "dim" : sel === slug ? "active" : "idle"}
                  />
                  <span
                    className={cn(
                      "max-w-full truncate text-[0.625rem] font-bold",
                      used ? "text-ink-faint" : sel === slug ? "text-[var(--major-hot)]" : "text-ink-dim",
                    )}
                  >
                    {team?.tag ?? slug}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

      <div>
        {/* --- Кошики --- */}
        {/* Три рядки одного об'єкта, а не три картки.
            Окремими картками кошик «3:0» виходив на всю ширину колонки заради
            двох комірок, і дві третини його площі були порожнім полем —
            коробка, що виглядає як незаповнена форма. Тут ширину задає
            шістка проходу, а двійки вирівнюються по її правому краю: ряди
            читаються як одна таблиця, і жодна площа не стоїть даремно. */}
        <div className="major-plate major-divide overflow-hidden rounded-2xl">
          {ROLES.map((role) => {
            const filled = inRole(role);
            const free = ROLE_CAP[role] - filled.length;
            const isTarget = target === role;
            const armed = !!sel && free > 0;

            return (
              <section
                key={role}
                onClick={() => hitBox(role)}
                style={
                  isTarget || armed
                    ? {
                        backgroundColor: `color-mix(in oklch, ${BOX_TINT[role]} 16%, transparent)`,
                        boxShadow: `inset 0 0 0 1px ${BOX_TINT[role]}`,
                      }
                    : undefined
                }
                className={cn(
                  "flex flex-col gap-3 p-3 transition-[background-color,box-shadow] duration-150 sm:flex-row sm:items-center sm:gap-4 sm:p-4",
                  free === 0
                    ? BOX_FULL[role]
                    : isTarget || armed
                      ? "cursor-pointer"
                      : "cursor-pointer hover:bg-white/[0.03]",
                )}
              >
                <div className="flex items-baseline gap-2 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:gap-0.5">
                  <p
                    className="whitespace-nowrap text-sm font-black tracking-tight"
                    style={{ color: BOX_TINT[role] }}
                  >
                    {ROLE_LABEL[role]}
                  </p>
                  <p className="min-w-0 flex-1 truncate text-[0.6875rem] font-semibold text-ink-dim sm:flex-none">
                    {ROLE_TITLE[role].replace(/^.*— /, "")} · ×{ROLE_PRICE[role]}
                  </p>
                  <p
                    className={cn(
                      "tnum shrink-0 text-[0.75rem] font-extrabold sm:hidden",
                      free !== 0 && "text-ink-dim",
                    )}
                    style={free === 0 ? { color: BOX_TINT[role] } : undefined}
                  >
                    {filled.length}/{ROLE_CAP[role]}
                  </p>
                </div>

                {/* Комірки: зайняті спочатку, за ними порожні. Притиснуті
                    праворуч, тож нижній край двійки стоїть рівно під шісткою. */}
                <div className="flex flex-1 flex-wrap gap-2 sm:justify-end">
                  {filled.map((slug) => {
                    const team = findTeam(slug);
                    return (
                      <button
                        key={slug}
                        type="button"
                        title={`${team?.name ?? slug} — прибрати`}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(slug);
                        }}
                        className="group flex w-10 shrink-0 flex-col items-center gap-1"
                      >
                        <MajorCrest
                          team={team}
                          slug={slug}
                          size={40}
                          state="active"
                          tone={TONE[role]}
                        />
                        <span className="max-w-full truncate text-[0.625rem] font-bold text-ink-muted group-hover:text-ink">
                          {team?.tag ?? slug}
                        </span>
                      </button>
                    );
                  })}
                  {Array.from({ length: free }, (_, i) => (
                    <span
                      key={`empty-${i}`}
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-full border border-dashed transition-colors duration-150"
                      style={{
                        borderColor:
                          isTarget || armed
                            ? BOX_TINT[role]
                            : `color-mix(in oklch, ${BOX_TINT[role]} 32%, transparent)`,
                      }}
                    />
                  ))}
                </div>

                {/* На широкому — лічильник у кінці рядка, щоб три «0/2, 0/6,
                    0/2» стояли стовпчиком під одним краєм. На вузькому він
                    живе в заголовку, де вже є місце. */}
                <p
                  className={cn(
                    "tnum hidden w-10 shrink-0 text-right text-[0.75rem] font-extrabold sm:block",
                    free !== 0 && "text-ink-dim",
                  )}
                  style={free === 0 ? { color: BOX_TINT[role] } : undefined}
                >
                  {filled.length}/{ROLE_CAP[role]}
                </p>
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {note && <p className="flex-1 text-sm font-semibold text-[var(--danger)]">{note}</p>}
        {!note && saved && !dirty && (
          <p className="flex-1 text-sm font-semibold text-[var(--success)]">
            Картку збережено. Поки стадія не почалась, її ще можна міняти.
          </p>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!complete || saving || !dirty}
          className={cn(
            "h-11 rounded-full px-6 text-sm font-extrabold transition-colors duration-150",
            complete && dirty && !saving
              ? "bg-accent text-accent-ink hover:bg-accent-hover"
              : "cursor-default bg-fill-2 text-ink-faint",
          )}
        >
          {/* «Збережено» тільки тоді, коли справді є що було зберігати.
              На порожній картці `dirty` теж хибний — і кнопка впевнено
              повідомляла про збереження того, чого ніхто не робив. */}
          {saving
            ? "Зберігаю…"
            : complete && !dirty
              ? "Збережено"
              : "Зберегти картку"}
        </button>
      </div>
    </div>
  );
}
