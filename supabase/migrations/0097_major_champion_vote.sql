-- CS2 UA — голосування «хто візьме мейджор». Run in Supabase → SQL Editor.
-- Requires 0094, 0096.
--
-- Це не пікем і очок не дає. Пікем — задача: розклади швейцарку так, щоб
-- кошики зійшлися. Тут питання одне й відповідь одна, і цінність її не в
-- тому, хто вгадав, а в тому, як відповіла спільнота цілком. Тому голос
-- нічого не коштує, нічого не приносить і міняється скільки завгодно, поки
-- не почався плей-оф.
--
-- Один рядок на людину — це і є «один голос». Не таблиця голосів із
-- підрахунком, а таблиця виборів: змінити думку означає переписати свій
-- рядок, а не додати другий.

begin;

create table if not exists public.major_champion_vote (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  -- Слаг команди з нашого довідника. Що він із мейджора, перевіряє RPC.
  team       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.major_champion_vote enable row level security;

-- Видно тільки свій голос. Чужі імена поруч із вибором тут не потрібні
-- нікому: сторінка показує частки, а не хто за кого.
drop policy if exists "own vote" on public.major_champion_vote;
create policy "own vote" on public.major_champion_vote
  for select using (auth.uid() = user_id);

grant select on public.major_champion_vote to authenticated;

-- ---------------------------------------------------------------------------
-- Підрахунок
-- ---------------------------------------------------------------------------
-- `security_invoker` тут свідомо ВИМКНЕНО — на відміну від усіх в'юх вище.
--
-- Правило «не обходь RLS таблиці під собою» захищає рядки: у 0091 через таку
-- в'юху витекли чужі дані. Тут витікати нема чому. На виході тільки слаг
-- команди й число — ні user_id, ні часу, ні будь-чого, що веде до людини.
-- А порахувати частки, бачачи лише власний голос, неможливо: з увімкненим
-- invoker кожен бачив би «100% за мою команду», тобто дзеркало замість
-- статистики.
drop view if exists public.major_champion_tally;
create view public.major_champion_tally as
  select v.team, count(*)::integer as votes
    from public.major_champion_vote v
   group by v.team;

grant select on public.major_champion_tally to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Голос
-- ---------------------------------------------------------------------------
create or replace function public.vote_major_champion(p_team text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_lock timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'anon');
  end if;

  -- Голосувати можна тільки за того, хто на мейджорі. Склад береться з самих
  -- стадій, тож список не треба вести вдруге: кого туди вписали, за того й
  -- можна голосувати.
  if not exists (
    select 1 from public.major_stages s where s.teams ? p_team
  ) then
    return jsonb_build_object('ok', false, 'error', 'bad_team');
  end if;

  -- Замок — початок плей-офа. Далі питання «хто візьме мейджор» уже наполовину
  -- вирішене сіткою, і голоси після цього говорили б не про прогноз, а про
  -- вміння читати таблицю.
  select min(s.starts_at) into v_lock
    from public.major_stages s where s.kind = 'playoff';

  if v_lock is not null and now() >= v_lock then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;

  insert into public.major_champion_vote (user_id, team)
       values (v_user, p_team)
  on conflict (user_id) do update
       set team = excluded.team, updated_at = now();

  return jsonb_build_object('ok', true, 'team', p_team);
end;
$$;

revoke all on function public.vote_major_champion(text) from public, anon;
grant execute on function public.vote_major_champion(text) to authenticated, service_role;

commit;

-- Перевірка:
--   select * from public.major_champion_tally order by votes desc;
--   select public.vote_major_champion('spirit');   -- з-під увійшлого користувача
--   select public.vote_major_champion('nonsuch');  -- {"ok":false,"error":"bad_team"}
