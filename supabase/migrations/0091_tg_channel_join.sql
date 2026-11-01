-- CS2 UA — журнал входів і виходів каналу. Run in Supabase → SQL Editor.
--
-- Навіщо. Bot API не має методу, який віддає список підписників каналу:
-- є getChatMemberCount (число) і getChatAdministrators (адміни), і все. Тобто
-- про власну аудиторію з API відомо рівно одне число, і коли воно змінюється,
-- сказати що саме сталося неможливо.
--
-- Зате бот-адмін із "chat_member" у allowed_updates отримує подію на кожен
-- вхід і вихід. Ця таблиця — місце, куди вебхук їх складає. Працює тільки
-- вперед: що відбувалося до того, як його ввімкнули, не відновити, бо ніхто
-- не записував.
--
-- Таблиця нічого не вирішує й нічого не робить із підписниками. Вона пам'ятає.

create table if not exists public.tg_channel_join (
  user_id     bigint      primary key,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  username    text,
  name        text,
  is_bot      boolean     not null default false,
  lang        text,
  -- Сире тіло апдейта. Телеграм з часом додає поля, і коли наступного разу
  -- знадобиться щось, чого сьогодні не видно, воно вже лежатиме тут.
  raw         jsonb
);

create index if not exists tg_channel_join_at on public.tg_channel_join (joined_at desc);

alter table public.tg_channel_join enable row level security;
-- Без політик: читає й пише тільки service role. Для відвідувача сайту
-- поіменний список підписників каналу — не його справа.

comment on table public.tg_channel_join is
  'Входи й виходи каналу, як їх бачить вебхук бота. Тільки запис.';

-- Приріст по годинах.
create or replace view public.tg_channel_hours as
select
  date_trunc('hour', joined_at)               as hour,
  count(*)                                    as joined,
  count(*) filter (where left_at is not null) as already_gone
from public.tg_channel_join
group by 1
order by 1 desc;

comment on view public.tg_channel_hours is 'Приріст каналу по годинах.';
