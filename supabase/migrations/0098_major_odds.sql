-- CS2 UA — шанси картки. Run in Supabase → SQL Editor. Requires 0094, 0096.
--
-- Питання, на яке це відповідає: «а який у мене шанс?» — і головне, щоб він
-- мінявся після кожного матчу. Ймовірність до першої карти й ймовірність
-- після двох турів — різні числа, і друге набагато цікавіше: саме воно
-- перетворює чужий матч у щось, за чим ти стежиш.
--
-- Рахується це не тут. Симуляція швейцарки — тридцять рядків на коліні, але
-- вона мусить знати криву ймовірності перемоги й очки VRS, а те й те живе в
-- моделі поза застосунком (`vrs-model/`), яку не можна перенести всередину:
-- HLTV не віддає свої сторінки нічому, що не браузер. Тому все як із
-- `major_projection` з 0077 — рахує скрипт на машині з браузером, база
-- зберігає, сайт тільки читає.
--
-- Дві таблиці, бо це два різні факти. Шанси команди належать стадії й
-- однакові для всіх. Шанси картки належать людині.

begin;

-- ---------------------------------------------------------------------------
-- 1. Що вже зіграно
-- ---------------------------------------------------------------------------
-- Без цього немає ради: щоб порахувати, що буде далі, треба знати, звідки
-- рахувати. `actual` для цього не годиться — він заповнюється один раз у
-- кінці, коли рахувати вже нічого.
--
-- Матч, а не рахунок команди. З переліку матчів виводяться і рекорди («2-1»),
-- і те, хто з ким уже грав, — а швейцарка не зводить тих самих удруге, і
-- симуляція мусить це знати. Зі словника рекордів другого не дістати.
alter table public.major_stages
  add column if not exists played jsonb not null default '[]'::jsonb;

comment on column public.major_stages.played is
  'Зіграні матчі стадії: [{"a":"heroic","b":"imperial","w":"heroic"}]. З них виводяться рекорди і хто з ким уже грав.';

-- Шанси команд цієї стадії на поточний момент: {"heroic":{"w":0.18,"a":0.65,"o":0.05}}
-- w — 3:0, a — прохід, o — 0:3. Коротко, бо це читає сторінка на кожен рядок.
alter table public.major_stages
  add column if not exists odds jsonb not null default '{}'::jsonb;

alter table public.major_stages
  add column if not exists odds_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Шанси картки
-- ---------------------------------------------------------------------------
create table if not exists public.major_pickem_odds (
  user_id    uuid     not null references auth.users (id) on delete cascade,
  stage      smallint not null references public.major_stages (stage) on delete cascade,
  -- Шанс потрапити в десятку, якій їдуть скіни. Найголовніше число: воно
  -- відповідає на питання, яке людина справді ставить, — не «скільки я
  -- вгадаю», а «мені щось буде?».
  --
  -- Рахується тільки після замка. До нього чужі картки закриті політикою
  -- (0094), а без них немає з ким порівнюватись: «шанс на скін», порахований
  -- проти уявних суперників, був би не прогнозом, а малюнком.
  p_prize    real,
  -- Очікувані очки й влучання. Ці є завжди, бо не залежать від чужих карток.
  ev_points  real     not null default 0,
  ev_hits    real     not null default 0,
  -- Шанс кожного окремого вибору: {"heroic":0.65,"lynn":0.14}. Ключ — слаг,
  -- значення — ймовірність саме тієї ролі, яку людина йому дала.
  p_pick     jsonb    not null default '{}'::jsonb,
  -- Розподіл влучань, одинадцять чисел від 0/10 до 10/10. Середнє саме по
  -- собі мовчить про те, наскільки картка ризикована.
  dist       jsonb    not null default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  primary key (user_id, stage)
);

alter table public.major_pickem_odds enable row level security;

-- Та сама логіка, що й у карток (0094): свої шанси видно завжди, чужі —
-- після замка. До замка «шанс на скін» сусіда сказав би й те, що в нього в
-- картці; після замка картки й так відкриті.
drop policy if exists "own odds, and everyone's once locked" on public.major_pickem_odds;
create policy "own odds, and everyone's once locked" on public.major_pickem_odds
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.major_stages s
       where s.stage = major_pickem_odds.stage and now() >= s.starts_at
    )
  );

grant select on public.major_pickem_odds to anon, authenticated;

-- Пише тільки службовий клієнт — це результат симуляції, а не дія людини.
-- Політики на запис свідомо немає: при увімкненому RLS це «заборонено».

commit;

-- Перевірка:
--   select stage, jsonb_array_length(played) as matches, odds_at from public.major_stages order by stage;
--   select user_id, ev_points, ev_hits, p_prize from public.major_pickem_odds where stage = 1;
--
-- Рахує і заливає:
--   node scripts/major-odds.mjs 1
-- Вносить результати туру:
--   node scripts/major-round.mjs 1 heroic>imperial ninez>lynn ...
