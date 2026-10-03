-- ---------------------------------------------------------------------------
-- 0086 — чого вартий матч у гонці за інвайт
--
-- Для кожного матчу дві гілки: що станеться з шансом команди на інвайт, якщо
-- вона виграє, і що — якщо програє. Рахується офлайн тією самою моделлю, що
-- друкує сторінку інвайтів (swing.mjs поруч із final15.mjs), бо модель живе
-- поза сайтом: HLTV не віддає таблицю звичайним запитом, а згортка на 128
-- точках не те, що роблять у маршруті.
--
-- Ключ — матч і команда: рядків на матч рівно два, по одному на сторону.
-- Публікація перезаписує їх (merge-duplicates), тож перерахунок після кожного
-- ігрового дня просто оновлює числа.
--
-- `p_match` — ймовірність перемоги цієї команди з тієї ж моделі. Вона тут не
-- для показу, а для звірки: поточний шанс має дорівнювати середньому з гілок,
-- зваженому нею. Якщо не дорівнює — гілки зібрані неправильно.
-- ---------------------------------------------------------------------------

create table if not exists public.match_vrs_swing (
  match_id    text        not null,
  team_slug   text        not null,
  p_now       real        not null,
  p_win       real        not null,
  p_lose      real        not null,
  p_match     real        not null,
  as_of       date        not null,
  computed_at timestamptz not null default now(),
  primary key (match_id, team_slug)
);

alter table public.match_vrs_swing enable row level security;

drop policy if exists "match swing public read" on public.match_vrs_swing;
create policy "match swing public read"
  on public.match_vrs_swing for select
  to anon, authenticated
  using (true);

-- Пише лише службовий клієнт — числа приходять із моделі, не з браузера.
revoke insert, update, delete on public.match_vrs_swing from anon, authenticated;
grant select on public.match_vrs_swing to anon, authenticated;
