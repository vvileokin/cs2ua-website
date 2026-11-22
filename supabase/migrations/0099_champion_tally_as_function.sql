-- CS2 UA — підрахунок голосів без security-definer в'юхи.
-- Run in Supabase → SQL Editor. Requires 0097.
--
-- Лінтер Supabase позначив `major_champion_tally` як CRITICAL, і по суті він
-- має рацію, хоча задум був правильний.
--
-- Задум: показати частки, не показуючи, хто за кого. Рядок із голосом
-- закритий політикою, а на виході в'юхи були тільки слаг і число — вести до
-- людини нема чому. Щоб це порахувати, в'юха мусила читати таблицю повз RLS,
-- тобто правами власника.
--
-- Чому лінтер усе одно правий: в'юха з правами власника — це постійно
-- відчинені двері в таблицю, і те, що сьогодні крізь них проходить лише
-- `group by`, тримається виключно на тексті в'юхи. Варто колись додати до
-- `select` ще одну колонку — і звідти поїде те, чого не мало. Жодне правило
-- бази цього не зупинить: вона бачить в'юху, якій дозволено все.
--
-- Тому те саме, але функцією. `security definer` у функції — це не обхід
-- правила, а штатний спосіб сказати «ось рівно ця дія виконується з
-- підвищеними правами». Межа тут не в тексті запиту, а в сигнатурі: функція
-- повертає дві колонки й нічого іншого повернути не може.

begin;

drop view if exists public.major_champion_tally;

create or replace function public.major_champion_tally()
returns table (team text, votes integer)
language sql
security definer
stable
set search_path = public
as $$
  select v.team, count(*)::integer as votes
    from public.major_champion_vote v
   group by v.team;
$$;

comment on function public.major_champion_tally() is
  'Частки голосів «хто візьме мейджор». Тільки агрегат: слаг і число, без user_id.';

-- `revoke from public` забирає право і в service_role — та сама пастка, що в
-- 0035, 0070, 0083 і 0094, тож повертаємо явно.
revoke all on function public.major_champion_tally() from public;
grant execute on function public.major_champion_tally() to anon, authenticated, service_role;

commit;

-- Перевірка:
--   select * from public.major_champion_tally() order by votes desc;
--   -- і те саме з-під анонімного ключа: має віддати ті самі числа
