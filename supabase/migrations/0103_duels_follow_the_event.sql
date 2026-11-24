-- CS2 UA — дуелі йдуть за подією, а не за Porto. Run in Supabase → SQL Editor.
-- Requires 0064, 0079.
--
-- `duel_create` відмовляла всьому, що не `blast-porto-2026`, і повертала
-- «not_porto». Поки Porto йшов, це означало «не на цій події»; коли він
-- скінчився, це стало означати «ніде».
--
-- Нічого специфічно портівського в дуелі немає: ставка списується з івентового
-- гаманця, а гаманець один на всі події. Тож перевірка тепер дивиться туди ж,
-- куди дивиться `place_bet`, — у `event_tournaments`. Не буває події, де ставка
-- бере івентові поінти, а дуель каже «не тут».
--
-- Список лишається явним і ручним — з тієї самої причини, що й у 0079: це
-- правило про гроші, і коли воно буде хибним, хай буде хибним помітно.
--
-- Решта тіла — точно як у 0064, рядок у рядок. Міняється одна перевірка; усе
-- інше (ліміт відкритих викликів, ескроу при створенні, `match_open`) лишається
-- тим, чим було.

begin;

create or replace function public.duel_create(
  p_user     uuid,
  p_match    text,
  p_side     text,
  p_stake    integer,
  p_opponent uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_slug    text;
  v_balance integer;
  v_open    integer;
  v_id      uuid;
  v_from    text;
  v_match   text;
  v_when    text;
  v_side    text;
begin
  if auth.uid() is not null and auth.uid() <> p_user then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if p_side not in ('a', 'b') then
    return jsonb_build_object('ok', false, 'error', 'bad_side');
  end if;
  if p_opponent = p_user then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;

  select m.tournament_slug into v_slug
    from public.matches m where m.id = p_match;
  -- Подія — та, що в списку `event_tournaments` (0079). Той самий список, що
  -- вирішує, з якого гаманця списується ставка: один список на обидва правила
  -- означає, що вони не можуть розійтися.
  if not exists (select 1 from public.event_tournaments e where e.slug = v_slug) then
    return jsonb_build_object('ok', false, 'error', 'not_event');
  end if;
  if not public.match_open(p_match) then
    return jsonb_build_object('ok', false, 'error', 'started');
  end if;

  if p_stake < 1 then
    return jsonb_build_object('ok', false, 'error', 'bad_stake');
  end if;

  if exists (
    select 1 from public.duels d
     where d.match_id = p_match
       and d.status in ('open', 'matched')
       and (d.challenger = p_user or d.opponent = p_user)
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_in');
  end if;

  select count(*) into v_open
    from public.duels d
   where d.challenger = p_user and d.status = 'open';
  if v_open >= 3 then
    return jsonb_build_object('ok', false, 'error', 'too_many_open');
  end if;

  select event_points into v_balance
    from public.profiles where id = p_user for update;
  if v_balance is null or v_balance < p_stake then
    return jsonb_build_object('ok', false, 'error', 'insufficient');
  end if;

  insert into public.duels (match_id, challenger, side, opponent, stake)
  values (p_match, p_user, p_side, p_opponent, p_stake)
  returning id into v_id;

  update public.profiles
     set event_points = event_points - p_stake
   where id = p_user;

  -- Only a named challenge has somebody to tell. An open one is an offer to
  -- the room, and the room is the board.
  if p_opponent is not null then
    select handle into v_from from public.profiles where id = p_user;
    select coalesce(m.team_a_name, initcap(m.team_a)) || ' — ' || coalesce(m.team_b_name, initcap(m.team_b)),
           coalesce(m.time_label, ''),
           case when p_side = 'a' then coalesce(m.team_a_name, initcap(m.team_a))
                else coalesce(m.team_b_name, initcap(m.team_b)) end
      into v_match, v_when, v_side
      from public.matches m where m.id = p_match;

    perform public.duel_notify(
      p_opponent,
      'duel_challenge',
      coalesce(v_from, 'Суперник') || ' викликав тебе на дуель · ' || p_stake,
      jsonb_build_object('from', coalesce(v_from, 'Суперник'), 'match', v_match,
                         'when', v_when, 'side', v_side, 'stake', p_stake),
      jsonb_build_object('duel', v_id, 'match', p_match)
    );
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'balance', v_balance - p_stake);
end;
$$;

revoke execute on function public.duel_create(uuid, text, text, integer, uuid) from public, anon;
grant execute on function public.duel_create(uuid, text, text, integer, uuid) to authenticated, service_role;

commit;

-- Перевірка:
--   select public.duel_create(
--     '<твій uuid>'::uuid, 'heroic-vs-imperial', 'a', 50);
--   -- має відповісти ok або впертися в баланс, а не в not_event
