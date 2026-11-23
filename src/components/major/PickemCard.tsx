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
  canSave,
  spread = { total: 0, byTeam: {} },
}: {
  stage: number;
  shape: CardShape;
  teams: string[];
  initial: PickemPicks;
  /**
   * Як розклалася спільнота: скільки карток поставило кожну команду в кожну
   * роль, і скільки карток усього.
   *
   * Нуль карток — значить, показувати нема чого, і картка малюється без
   * цифр. Це навмисно м'яка залежність: відсотки — добавка, а не умова.
   */
  spread?: { total: number; byTeam: Record<string, Record<string, number>> };
  /** Чи є кому зберігати. Для гостя кнопка мовчала б так само, як і для
   *  недозаповненої картки, а причина зовсім інша. */
  canSave: boolean;
}) {
  const [picks, setPicks] = React.useState<PickemPicks>(initial);
  const [sel, setSel] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<PickRole | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  /** Те, що точно лежить у базі. Порівнювати треба з ним, а не з тим, що
   *  приїхало при завантаженні: після першого ж автозбереження `initial`
   *  застаріває, і картка вічно вважалася б незбереженою. */
  const [savedPicks, setSavedPicks] = React.useState<PickemPicks>(initial);

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
  const dirty = JSON.stringify(picks) !== JSON.stringify(savedPicks);

  /**
   * Обраний кошик, якщо в ньому ще є місце.
   *
   * Раніше `target` скидався вручну всередині `place` — по числу, порахованому
   * зі старого стану, тобто завжди на крок позаду. Тут він не скидається
   * взагалі: кошик, що заповнився, просто перестає бути активним, а якщо з
   * нього щось прибрати, він активний знову. Один вираз замість двох місць,
   * де можна розійтися з дійсністю.
   */
  const live = target && inRole(target).length < capOf(target) ? target : null;

  const place = React.useCallback(
    (team: string, role: PickRole) => {
      setPicks((prev) => {
        if (prev[team] === role) return prev;
        /* Команда може переїжджати з кошика в кошик, тому рахуємо місце без
           неї самої — інакше перенос у повний кошик, з якого вона ж і
           виходить, виглядав би як брак місця. */
        const taken = Object.keys(prev).filter((t) => prev[t] === role && t !== team).length;
        if (taken >= capOf(role)) return prev;
        return { ...prev, [team]: role };
      });
      setSel(null);
    },
    [capOf],
  );

  const remove = React.useCallback((team: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[team];
      return next;
    });
  }, []);

  /* --- Перетягування --------------------------------------------------- *
   *
   * Тап нікуди не дівся: команда, потім кошик. Він лишається основним на
   * телефоні й єдиним із клавіатури. Миша просить іншого — узяти герб і
   * покласти, як у клієнті.
   *
   * Зроблено на pointer-подіях, а не на HTML5 drag&drop: той на тачі не
   * працює взагалі, і довелося б тримати два різні механізми.
   *
   * Миша і палець починають драг по-різному, і це не примха.
   *
   * Миші досить шести пікселів руху: іншої роботи на цьому гербі в неї
   * немає. У пальця є — ним гортають сторінку, а склад займає пів екрана,
   * тож майже кожен свайп починається на якомусь гербі. Поки драг стартував
   * від руху, доводилося глушити прокрутку (`touch-action: none`) — і
   * сторінка переставала гортатися саме там, де на неї найбільше тиснуть
   * пальцем.
   *
   * Тому на тачі драг починається від утримання: палець лежить нерухомо
   * чверть секунди — і тільки тоді герб переходить у руку. Короткий свайп
   * лишається свайпом, прокрутка працює як скрізь.
   */
  const HOLD_MS = 240;
  const JITTER = 8;

  const startRef = React.useRef<{
    x: number;
    y: number;
    team: string;
    touch: boolean;
    /** Драг почався: для миші — після руху, для пальця — після утримання. */
    moved: boolean;
    timer: number;
  } | null>(null);
  /* Після перетягування браузер усе одно шле click по спільному предку —
     без цього прапорця він відразу ж скасовував би щойно покладене. */
  const draggedRef = React.useRef(false);
  const [drag, setDrag] = React.useState<{
    team: string;
    x: number;
    y: number;
    over: PickRole | null;
  } | null>(null);

  function beginDrag(e: React.PointerEvent, team: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const touch = e.pointerType !== "mouse";
    const at = { x: e.clientX, y: e.clientY };
    const start = { ...at, team, touch, moved: false, timer: 0 };
    startRef.current = start;

    if (!touch) return;
    start.timer = window.setTimeout(() => {
      if (startRef.current !== start) return;
      start.moved = true;
      atRef.current = at;
      setDrag({ team, x: at.x, y: at.y, over: null });
      /* Коротке відлуння: палець має відчути, що герб перейшов у руку, бо
         очима в цю мить дивляться на кошик, а не на склад. */
      navigator.vibrate?.(12);
    }, HOLD_MS);
  }

  /* Куди зараз показує палець — для автопрокрутки. Окремо від `drag`, бо
     читається щокадру, а не щорендера. */
  const atRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    function boxAt(x: number, y: number): PickRole | null {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const box = el?.closest("[data-basket]") as HTMLElement | null;
      return (box?.dataset.basket as PickRole | undefined) ?? null;
    }

    function onMove(e: PointerEvent) {
      const s = startRef.current;
      if (!s) return;

      if (!s.moved) {
        const far = Math.hypot(e.clientX - s.x, e.clientY - s.y);
        /* Палець поїхав, не дочекавшись утримання, — це прокрутка, а не
           драг. Віддаємо жест браузеру цілком. */
        if (s.touch) {
          if (far > JITTER) {
            clearTimeout(s.timer);
            startRef.current = null;
          }
          return;
        }
        if (far < 6) return;
        s.moved = true;
      }

      atRef.current = { x: e.clientX, y: e.clientY };
      setDrag({ team: s.team, x: e.clientX, y: e.clientY, over: boxAt(e.clientX, e.clientY) });
    }

    /* Поки герб у руці, сторінка під ним не гортається.
       `touch-action` тут не поміг би: браузер читає його на початку жесту, а
       ми вирішуємо пізніше. `preventDefault` на touchmove — єдиний спосіб
       забрати прокрутку в жесту, який уже почався, і тому слухач мусить бути
       неласивим. */
    function onTouchMove(e: TouchEvent) {
      if (startRef.current?.moved) e.preventDefault();
    }

    function onUp(e: PointerEvent) {
      const s = startRef.current;
      startRef.current = null;
      atRef.current = null;
      if (s) clearTimeout(s.timer);
      if (!s?.moved) return;
      setDrag(null);
      draggedRef.current = true;
      /* Повертаємо клікам силу аж після того, як браузер відправить свій
         click по цьому ж жесту. */
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);

      const role = boxAt(e.clientX, e.clientY);
      if (role) place(s.team, role);
    }

    /* Сторінка їде сама, коли палець біля краю.
       Без цього перетягування впирається в межі екрана: на телефоні склад і
       кошики не завжди в одному полі зору, а відпустити герб на півдорозі,
       щоб прокрутити, — означає почати спочатку. Крок залежить від того, як
       близько до краю, тож біля самого краю їде швидше. */
    let raf = 0;
    const EDGE = 90;
    function tick() {
      raf = requestAnimationFrame(tick);
      const at = atRef.current;
      if (!at) return;
      const top = at.y - EDGE;
      const bottom = at.y - (window.innerHeight - EDGE);
      const step = top < 0 ? top / 6 : bottom > 0 ? bottom / 6 : 0;
      if (step) window.scrollBy(0, step);
    }
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [place]);

  function pickTeam(team: string) {
    if (draggedRef.current) return;
    if (picks[team]) return; // вже в кошику — знімається кліком по комірці
    if (live) {
      place(team, live);
      return;
    }
    setSel((s) => (s === team ? null : team));
  }

  function hitBox(role: PickRole) {
    if (draggedRef.current) return;
    const full = inRole(role).length >= capOf(role);
    if (sel && !full) {
      place(sel, role);
      return;
    }
    if (full) return;
    setTarget((t) => (t === role ? null : role));
  }

  /**
   * Збереження.
   *
   * Кнопки немає. Вона була третім станом там, де потрібні два: картка або
   * повна, або ні. Поки неповна — зберігати нічого, і кнопка стояла мертва,
   * нічого не пояснюючи; щойно повна — натискати її вже формальність, бо
   * іншої дії на сторінці немає. Тому картка їде сама, щойно кошики
   * зійшлися, а рядок під нею каже, що з нею зараз.
   *
   * Затримка в сімсот мілісекунд не для сервера, а для людини: шістнадцять
   * гербів розкладають поспіль, і без неї кожен проміжний стан — а їх
   * десять — їхав би окремим запитом.
   */
  /* Картка, на якій сервер уже сказав «ні».
     Без неї автозбереження перетворюється на нескінченний цикл: помилка не
     міняє `picks`, тож картка лишається «незбереженою», ефект спрацьовує
     знову — і так щосемсот мілісекунд, доки людина не піде зі сторінки.
     Повторюємо тільки тоді, коли вибір справді змінився. */
  const failedRef = React.useRef<string | null>(null);

  const save = React.useCallback(async (next: PickemPicks) => {
    setSaving(true);
    setNote(null);
    try {
      const r = await fetch("/api/major/pickem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, picks: next }),
      });
      const j = await r.json();
      if (!r.ok) {
        failedRef.current = JSON.stringify(next);
        setNote(j.error ?? "Не вдалося зберегти.");
      } else {
        failedRef.current = null;
        setSavedPicks(next);
      }
    } catch {
      failedRef.current = JSON.stringify(next);
      setNote("Мережа не відповіла. Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  }, [stage]);

  React.useEffect(() => {
    if (!canSave || !complete || !dirty || saving) return;
    if (failedRef.current === JSON.stringify(picks)) return;
    const t = setTimeout(() => { void save(picks); }, 700);
    return () => clearTimeout(t);
  }, [canSave, complete, dirty, saving, picks, save]);

  /**
   * Частка карток, у яких ця команда стоїть у цій ролі.
   *
   * `role === null` означає «без ролі»: таких карток стільки, скільки
   * всього, мінус ті, де команду кудись поклали.
   */
  const pctFor = React.useCallback(
    (slug: string, role: PickRole | null): number | null => {
      if (!spread.total) return null;
      const row = spread.byTeam[slug] ?? {};
      const placed = Object.values(row).reduce((n, v) => n + v, 0);
      const n = role ? (row[role] ?? 0) : spread.total - placed;
      return Math.round((n / spread.total) * 100);
    },
    [spread],
  );

  /** Що сказати під карткою — або нічого. */
  const status: { text: string; tone: "ok" | "bad" | "quiet" } | null = note
    ? { text: note, tone: "bad" }
    : !canSave
      ? { text: "Увійди, щоб зберегти картку", tone: "quiet" }
      : saving || (complete && dirty)
        ? { text: "Зберігаю…", tone: "quiet" }
        : complete
          ? { text: "Збережено", tone: "ok" }
          : null;

  const hint = live
    ? `Обери команду в «${shape.roles.find((r) => r.role === live)?.label}»`
    : sel
      ? "Тепер обери кошик нижче"
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* --- Склад стадії --- */}
      {/* На телефоні склад іде ПІСЛЯ кошиків, а не перед ними.
          Разом вони в екран не влазять, і доки кошики лежали внизу, покласти
          команду в «0:3» означало прогорнути вниз до кошика, вгору до складу,
          знову вниз — і так на кожну з десяти. Кошики, прилиплі під шапкою,
          прибирають цю ходьбу цілком: мішень завжди на місці, а список під
          нею гортається скільки треба.

          На широкому екрані все вміщається й так, і там порядок звичайний:
          спершу з кого вибирати, потім куди класти. */}
      <section className="order-2 major-plate rounded-[4px] p-3 sm:order-1 sm:p-4">
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
            колонки, і шістнадцять лягають без залишку на будь-якій ширині.

            По чотири на телефоні. Вісім тут пробувалося — щоб склад і кошики
            вмістились в один екран — і виявилося, що герб у тридцять сім
            пікселів це вже не знак команди, а значок. Задачу вирішує не
            розмір складу, а те, де стоять кошики. */}
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
            /* Скільки людей зробило так само.
               Ціляться в кошик — частка тих, хто поклав команду саме туди.
               Команда вже в кошику — частка його ролі. А коли картка повна,
               відсоток отримують і ті шестеро, кого нікуди не поклали: це
               не «не вибрав», це вибір — вилетять, але не всуха, тобто 1:3
               або 2:3. Частка тих, хто лишив їх так само.

               Чому саме «коли повна»: недозаповнена картка ще не каже про
               ці шість нічого. Доки вибір не зроблено, частка тих, хто
               команду не чіпав, це майже сто відсотків у кожного рядка —
               стіна чисел, яка відповідає на питання, якого ще ніхто не
               ставив. Шестеро стають шістьома тільки разом із десятьма. */
            const role = live ?? picks[slug] ?? null;
            const pct = role ? pctFor(slug, role) : complete ? pctFor(slug, null) : null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => pickTeam(slug)}
                onPointerDown={(e) => !used && beginDrag(e, slug)}
                onDragStart={(e) => e.preventDefault()}
                aria-label={
                  pct === null ? undefined : `${team?.name ?? slug}, ${pct}%`
                }
                disabled={used}
                aria-pressed={sel === slug}
                title={team?.name ?? slug}
                className={cn(
                  "flex min-w-0 select-none flex-col items-center gap-1 rounded-[3px] p-1 transition-colors duration-150",
                  used
                    ? "cursor-default"
                    : "cursor-grab hover:bg-white/[0.04] active:cursor-grabbing",
                  drag?.team === slug && "opacity-40",
                )}
              >
                {pct !== null && (
                  <span
                    className={cn(
                      "tnum text-[0.625rem] font-black leading-[0.875rem]",
                      used
                        ? "text-ink-dim"
                        : live
                          ? "text-[var(--major-hot)]"
                          : "text-ink-dim",
                    )}
                  >
                    {pct}%
                  </span>
                )}
                <MajorCrest
                  team={team}
                  slug={slug}
                  fluid
                  state={used ? "dim" : sel === slug || drag?.team === slug ? "active" : "idle"}
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
      {/* z-20 — нижче за шапку (z-40) і вище за склад, щоб герби проїжджали
          під кошиками, а не крізь них. */}
      {/* Рядки одного об'єкта, а не окремі картки.
          Окремою карткою кошик «3:0» виходив на всю ширину колонки заради
          двох комірок, і дві третини його площі були порожнім полем —
          коробка, що виглядає як незаповнена форма. Тут ширину задає
          найбільший кошик, а менші вирівнюються по його правому краю: ряди
          читаються як одна таблиця, і жодна площа не стоїть даремно. */}
      {/* Прилипає обгортка, а не сама плита: `.major-plate` ставить
          `position: relative` звичайним правилом, а воно за каскадом сильніше
          за утиліту `sticky` з шару Tailwind — плита мовчки лишалась
          relative і нікуди не прилипала. */}
      <div className="sticky top-14 z-20 order-1 sm:static sm:order-2">
      <div className="major-plate major-divide overflow-hidden rounded-[4px]">
        {shape.roles.map((spec) => {
          const role = spec.role;
          const tone = TONE[role];
          const tint = BOX_TINT[tone];
          const filled = inRole(role);
          const free = spec.cap - filled.length;
          const isTarget = live === role;
          /* Кошик світиться, коли в нього справді можна покласти: або в руці
             вже є обрана команда, або над ним зараз тягнуть герб. */
          const armed = (!!sel || !!drag) && free > 0;
          const hovered = drag?.over === role && free > 0;

          return (
            <section
              key={role}
              data-basket={role}
              onClick={() => hitBox(role)}
              /* Рамка — тільки під курсором або на обраному кошику.
                 Доки її малювало кожне «сюди можна», три рамки поспіль
                 сходилися краями, і між рядами з'являлися подвійні лінії —
                 власна рамка верхнього, роздільник плити й власна рамка
                 нижнього в одному місці. Схоже було на щілини в плиті.
                 Тепер «сюди можна» каже сама заливка, а рамка лишається
                 відповіддю на питання «куди саме покладеться» — і вона
                 завжди одна. */
              style={
                hovered || isTarget
                  ? {
                      backgroundColor: `color-mix(in oklch, ${tint} 28%, transparent)`,
                      boxShadow: `inset 0 0 0 1px ${tint}`,
                    }
                  : armed
                    ? { backgroundColor: `color-mix(in oklch, ${tint} 12%, transparent)` }
                    : undefined
              }
              className={cn(
                "flex flex-col gap-2 p-2.5 transition-[background-color,box-shadow] duration-150 sm:flex-row sm:items-center sm:gap-4 sm:p-4",
                /* Кут повторює кут плити.
                   Рамка кошика малюється як inset-тінь по краю самого ряду, а
                   плита навколо заокруглена й ріже все, що виходить за її
                   радіус. Прямий кут першого ряду зрізався об заокруглений
                   кут плити — рамка виглядала надламаною саме там, де має
                   починатися. Тепер ряд заокруглений так само, і тінь іде по
                   тій самій дузі, якою плита обрізає. */
                "first:rounded-t-[4px] last:rounded-b-[4px]",
                free === 0
                  ? BOX_FULL[tone]
                  : isTarget || armed
                    ? "cursor-pointer"
                    : "cursor-pointer hover:bg-white/[0.03]",
              )}
            >
              <div className="flex items-baseline gap-2 sm:w-28 sm:shrink-0 sm:flex-col sm:items-start sm:gap-0.5">
                {/* Сам рахунок, великим. Пояснення «без поразок · ×150» під
                    ним більше немає: воно повторювало те, що й так написано
                    цифрами, і займало рядок, через який сам рахунок мусив
                    бути дрібним. Тепер рядок один — і він може бути таким,
                    щоб його було видно через усю картку. */}
                <p
                  className="flex-1 whitespace-nowrap text-base font-black tracking-tight sm:flex-none sm:text-2xl"
                  style={{ color: tint }}
                >
                  {spec.label}
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
                      title={`${team?.name ?? slug} — прибрати або перетягнути в інший кошик`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (draggedRef.current) return;
                        remove(slug);
                      }}
                      /* Покладене теж можна тягнути — з кошика в кошик, не
                         прибираючи спершу назад у склад. */
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginDrag(e, slug);
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      className={cn(
                        "group flex w-9 shrink-0 cursor-grab select-none flex-col items-center gap-0.5 active:cursor-grabbing sm:w-10 sm:gap-1",
                        drag?.team === slug && "opacity-40",
                      )}
                    >
                      <MajorCrest
                        team={team}
                        slug={slug}
                        fluid
                        state="active"
                        tone={tone}
                      />
                          <span className="max-w-full truncate text-[0.625rem] font-bold text-ink-muted group-hover:text-ink">
                        {pctFor(slug, role) !== null
                          ? `${pctFor(slug, role)}%`
                          : (team?.tag ?? slug)}
                      </span>
                    </button>
                  );
                })}
                {Array.from({ length: free }, (_, i) => (
                  <span
                    key={`empty-${i}`}
                    aria-hidden
                    /* Та сама форма, що й у герба, який сюди стане. Коло під
                       квадратний знак — це дві різні фігури на одному місці,
                       і порожній кошик виглядав не як вільне місце, а як
                       інший елемент. */
                    className="h-9 w-9 shrink-0 rounded-[4px] border border-dashed transition-colors duration-150 sm:h-10 sm:w-10"
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
      </div>

      {/* Герб у руці.
          Малюється поверх усього й не ловить подій сам: інакше
          `elementFromPoint` під курсором знаходив би його, а не кошик, і
          покласти команду було б нікуди. */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y }}
        >
          <MajorCrest
            team={findTeam(drag.team)}
            slug={drag.team}
            size={48}
            state="active"
            tone={drag.over ? TONE[drag.over] : "held"}
            className="shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)]"
          />
        </div>
      )}

      {/* Стан картки замість кнопки.
          Рядка немає, поки немає що сказати. «Лишилось обрати: 3:0 — 1»
          звідси пішло: те саме стоїть лічильником у самому кошику («1/2»),
          там, де на нього й дивляться, — а внизу воно просто повторювало
          цифру словами.

          «Збережено» — кольором події, а не зеленим: зелений на багряній
          сторінці читається як чужий елемент. Він близький до кольору
          помилки, але помилки тут — повні речення, а це одне слово. */}
      {status && (
        <p
          aria-live="polite"
          className={cn(
            "order-3 px-1 text-[0.8125rem] font-semibold",
            status.tone === "bad"
              ? "text-[var(--danger)]"
              : status.tone === "ok"
                ? "text-[var(--major-hot)]"
                : "font-normal text-ink-dim",
          )}
        >
          {status.text}
        </p>
      )}

    </div>
  );
}
