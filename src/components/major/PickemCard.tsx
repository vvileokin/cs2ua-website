"use client";

import * as React from "react";
import { MajorCrest } from "./MajorCrest";
import { findTeam } from "@/lib/data";
import {
  isComplete,
  type CardShape,
  type PickRole,
  type PickemPicks,
} from "@/lib/major-pickem";
import { cn } from "@/lib/utils";

/**
 * Картка стадії — сітка, як у клієнті.
 *
 * Перша версія була таблицею: рядок на команду, три кнопки в кожному. Вона
 * працювала, і це все хороше, що про неї можна сказати. Пікем — задача про
 * розподіл: команди треба розкласти по кошиках так, щоб кошики зійшлися. У
 * вигляді списку цього не видно взагалі: кошик існує тільки як число в
 * лічильнику, і щоб побачити, кого ти вже поклав у «3:0», доводиться читати
 * всі шістнадцять рядків.
 *
 * Тут кошики — це предмети. Зверху склад стадії, під ним коробки з комірками,
 * і скільки в них лишилося місця, видно з того, скільки комірок порожні.
 * Рівно так улаштований пікем у самій грі, і впізнається він з одного погляду.
 *
 * Без перетягування. У клієнті команди тягнуть мишею; половина людей тут
 * приходить із телефона, а drag&drop на тачі — це або власні жести, або
 * бібліотека вагою з пів сторінки. Замість цього два дотики: команда, потім
 * коробка. Працює в обох порядках — можна спершу вибрати коробку й настукати
 * в неї кілька команд поспіль, що швидше за все й робитимуть із шісткою
 * проходу.
 *
 * Обраний кошик лишається активним, доки не заповниться. Скидати його після
 * кожної команди означало б шість зайвих дотиків там, де потрібно шість.
 *
 * Форма картки приходить ззовні (`shape`), бо їх дві: швейцарка це 2/6/2 з
 * шістнадцяти, плей-оф — 1/1/2 з восьми. Усередині компонента про це немає
 * жодного припущення; він малює стільки кошиків, скільки в формі.
 */

/** Тон кошика. Шкала одного кольору події: найцінніше найгарячіше, середина
 *  тихіше, край холодний. Зелене з червоним, як у клієнті, тут пробувалося й
 *  пішло: на багряній сторінці зелений читався як чужий елемент. */
type Tone = "win" | "pass" | "out";

const TONE: Record<PickRole, Tone> = {
  "3-0": "win",
  adv: "pass",
  "0-3": "out",
  champ: "win",
  final: "pass",
  semi: "out",
};

/** Заливка ряду, коли кошик заповнений. */
const BOX_FULL: Record<Tone, string> = {
  win: "bg-[color-mix(in_oklch,var(--major-hot)_15%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major-hot)_46%,transparent)]",
  pass: "bg-[color-mix(in_oklch,var(--major)_11%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--major)_34%,transparent)]",
  out: "bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]",
};

/** Колір підпису кошика і його пунктирних комірок. */
const BOX_TINT: Record<Tone, string> = {
  win: "var(--major-hot)",
  pass: "var(--major)",
  /* Холодне — те, що закінчується: команди на цьому мейджорі більше немає, і
     світитися їй нічим. */
  out: "color-mix(in oklch, var(--ink) 55%, transparent)",
};

export function PickemCard({
  stage,
  shape,
  teams,
  initial,
}: {
  stage: number;
  shape: CardShape;
  teams: string[];
  initial: PickemPicks;
}) {
  const [picks, setPicks] = React.useState<PickemPicks>(initial);
  const [sel, setSel] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<PickRole | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const capOf = React.useCallback(
    (role: PickRole) => shape.roles.find((r) => r.role === role)?.cap ?? 0,
    [shape],
  );

  /** Хто стоїть у кошику, у порядку додавання. */
  const inRole = React.useCallback(
    (role: PickRole) => Object.keys(picks).filter((t) => picks[t] === role),
    [picks],
  );

  const complete = isComplete(picks, shape);
  const dirty = JSON.stringify(picks) !== JSON.stringify(initial);

  function place(team: string, role: PickRole) {
    setSaved(false);
    setPicks((prev) => {
      if (Object.keys(prev).filter((t) => prev[t] === role).length >= capOf(role)) {
        return prev;
      }
      return { ...prev, [team]: role };
    });
    setSel(null);
    // Кошик лишається активним, поки в ньому є місце.
    setTarget((t) =>
      t === role &&
      Object.keys(picks).filter((x) => picks[x] === role).length + 1 >= capOf(role)
        ? null
        : t,
    );
  }

  function pickTeam(team: string) {
    if (picks[team]) return; // вже в кошику — знімається кліком по комірці
    if (target && inRole(target).length < capOf(target)) {
      place(team, target);
      return;
    }
    setSel((s) => (s === team ? null : team));
  }

  function hitBox(role: PickRole) {
    const full = inRole(role).length >= capOf(role);
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

  const hint = target
    ? `Обери команду в «${shape.roles.find((r) => r.role === target)?.label}»`
    : sel
      ? "Тепер обери кошик нижче"
      : null;

  return (
    <div className="space-y-4">
      {/* --- Склад стадії --- */}
      <section className="major-plate rounded-2xl p-3 sm:p-4">
        {/* Над складом немає нічого — ні підпису, ні рядка під підказку.
            Шістнадцять гербів під вкладкою стадії не треба називати, їх
            видно; а порожній рядок, що тримав висоту під підказку, з'їдав
            сорок пікселів угорі заради тексту, якого там здебільшого немає.
            Сама підказка нічого й не додавала: коли обрано команду, її герб
            підсвічений, а всі незаповнені кошики світяться — це вже сказано
            кольором, і словами повторюється. Лишається тільки озвучення для
            тих, хто кольору не бачить. */}
        <p aria-live="polite" className="sr-only">
          {hint}
        </p>

        {/* Сітка, а не пакування рядком.
            Рядок, що набирає скільки влізе, давав на телефоні п'ять, п'ять,
            п'ять і одну команду саму внизу — вона читалася як окрема, хоча
            нічим не відрізняється від решти. Сітка ділить склад на рівні
            колонки, і шістнадцять лягають без залишку на будь-якій із трьох
            ширин. Герби при цьому розтягуються разом із коміркою й
            заповнюють рядок до правого краю. */}
        <div
          className={cn(
            "grid gap-1.5 sm:gap-2",
            "[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]",
            "sm:[grid-template-columns:repeat(var(--cols-sm),minmax(0,1fr))]",
            "lg:[grid-template-columns:repeat(var(--cols-lg),minmax(0,1fr))]",
          )}
          style={
            {
              "--cols": 4,
              "--cols-sm": Math.min(shape.roster, 8),
              "--cols-lg": shape.roster,
            } as React.CSSProperties
          }
        >
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
                  "flex min-w-0 flex-col items-center gap-1 rounded-lg p-1 transition-colors duration-150",
                  used ? "cursor-default" : "hover:bg-white/[0.04]",
                )}
              >
                <MajorCrest
                  team={team}
                  slug={slug}
                  fluid
                  state={used ? "dim" : sel === slug ? "active" : "idle"}
                />
                <span
                  className={cn(
                    "max-w-full truncate text-[0.625rem] font-bold",
                    used
                      ? "text-ink-faint"
                      : sel === slug
                        ? "text-[var(--major-hot)]"
                        : "text-ink-dim",
                  )}
                >
                  {team?.tag ?? slug}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* --- Кошики --- */}
      {/* Рядки одного об'єкта, а не окремі картки.
          Окремою карткою кошик «3:0» виходив на всю ширину колонки заради
          двох комірок, і дві третини його площі були порожнім полем —
          коробка, що виглядає як незаповнена форма. Тут ширину задає
          найбільший кошик, а менші вирівнюються по його правому краю: ряди
          читаються як одна таблиця, і жодна площа не стоїть даремно. */}
      <div className="major-plate major-divide overflow-hidden rounded-2xl">
        {shape.roles.map((spec) => {
          const role = spec.role;
          const tone = TONE[role];
          const tint = BOX_TINT[tone];
          const filled = inRole(role);
          const free = spec.cap - filled.length;
          const isTarget = target === role;
          const armed = !!sel && free > 0;

          return (
            <section
              key={role}
              onClick={() => hitBox(role)}
              style={
                isTarget || armed
                  ? {
                      backgroundColor: `color-mix(in oklch, ${tint} 16%, transparent)`,
                      boxShadow: `inset 0 0 0 1px ${tint}`,
                    }
                  : undefined
              }
              className={cn(
                "flex flex-col gap-3 p-3 transition-[background-color,box-shadow] duration-150 sm:flex-row sm:items-center sm:gap-4 sm:p-4",
                /* Кут повторює кут плити.
                   Рамка кошика малюється як inset-тінь по краю самого ряду, а
                   плита навколо заокруглена й ріже все, що виходить за її
                   радіус. Прямий кут першого ряду зрізався об заокруглений
                   кут плити — рамка виглядала надламаною саме там, де має
                   починатися. Тепер ряд заокруглений так само, і тінь іде по
                   тій самій дузі, якою плита обрізає. */
                "first:rounded-t-2xl last:rounded-b-2xl",
                free === 0
                  ? BOX_FULL[tone]
                  : isTarget || armed
                    ? "cursor-pointer"
                    : "cursor-pointer hover:bg-white/[0.03]",
              )}
            >
              <div className="flex items-baseline gap-2 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:gap-0.5">
                <p
                  className="whitespace-nowrap text-sm font-black tracking-tight"
                  style={{ color: tint }}
                >
                  {spec.label}
                </p>
                <p className="min-w-0 flex-1 truncate text-[0.6875rem] font-semibold text-ink-dim sm:flex-none">
                  {spec.note} · ×{spec.price}
                </p>
                <p
                  className={cn(
                    "tnum shrink-0 text-[0.75rem] font-extrabold sm:hidden",
                    free !== 0 && "text-ink-dim",
                  )}
                  style={free === 0 ? { color: tint } : undefined}
                >
                  {filled.length}/{spec.cap}
                </p>
              </div>

              {/* Комірки: зайняті спочатку, за ними порожні. Притиснуті
                  праворуч, тож нижній кошик стоїть рівно під верхнім. */}
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
                        tone={tone}
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
                      borderColor: isTarget || armed
                        ? tint
                        : `color-mix(in oklch, ${tint} 32%, transparent)`,
                    }}
                  />
                ))}
              </div>

              {/* На широкому — лічильник у кінці рядка, щоб усі стояли
                  стовпчиком під одним краєм. На вузькому він живе в
                  заголовку, де вже є місце. */}
              <p
                className={cn(
                  "tnum hidden w-10 shrink-0 text-right text-[0.75rem] font-extrabold sm:block",
                  free !== 0 && "text-ink-dim",
                )}
                style={free === 0 ? { color: tint } : undefined}
              >
                {filled.length}/{spec.cap}
              </p>
            </section>
          );
        })}
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
          {saving ? "Зберігаю…" : complete && !dirty ? "Збережено" : "Зберегти картку"}
        </button>
      </div>
    </div>
  );
}
