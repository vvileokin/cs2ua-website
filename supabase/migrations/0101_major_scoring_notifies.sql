-- CS2 UA — нарахування за стадію шле сповіщення. Run in Supabase → SQL Editor.
-- Requires 0014, 0094, 0096.
--
-- Досі нарахування мовчало: очки лягали в профіль, і людина дізнавалася про
-- це, випадково помітивши, що їх побільшало. Для стадії, яку складали тиждень
-- і за яку дають скін, це дивно — саме тут є що сказати.
--
-- Текст складений під дзвіночок: до «·» те, про що рядок («Стадія 1»), після
-- — подробиця. Панель виділяє першу частину напівжирним, тож у списку з
-- десяти ставок рядок про мейджор читається з одного погляду.
--
-- `kind = 'major'` — новий вид. Перевірки на колонці немає (0014), тож це не
-- потребує нічого, крім самого рядка; панель фарбує такі рядки багряним
-- цілком.
--
-- Решта функції без змін: ті самі ціни, той самий `updated_at`, якого не
-- можна чіпати, бо він третій ключ тайбрейка (0096).

begin;

create or replace function public.score_major_stage(p_stage smallint)
returns table (user_id uuid, points integer, hits smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage  record;
  v_rec    record;
  v_points integer;
  v_hits   smallint;
  v_picks  integer;
begin
  select * into v_stage from public.major_stages s where s.stage = p_stage;
  if not found then
    raise exception 'Стадії % немає', p_stage;
  end if;

  if v_stage.actual is null
     or (select count(*) from jsonb_object_keys(v_stage.actual))
        <> public.major_roster(v_stage.kind) then
    raise exception 'major_stages.actual для стадії % не заповнений на % команд',
                    p_stage, public.major_roster(v_stage.kind);
  end if;

  select sum(s.cap) into v_picks from public.major_card_shape(v_stage.kind) s;

  for v_rec in
    select * from public.major_pickem c
     where c.stage = p_stage and c.scored_at is null
  loop
    select
      coalesce(sum(case when public.major_pick_hit(p.value, a.value)
                        then public.major_pick_price(p.value) else 0 end), 0),
      coalesce(sum(case when public.major_pick_hit(p.value, a.value)
                        then 1 else 0 end), 0)
      into v_points, v_hits
      from jsonb_each_text(v_rec.picks) p
      join jsonb_each_text(v_stage.actual) a on a.key = p.key;

    if v_hits = v_picks then
      v_points := v_points + public.major_perfect_bonus(v_stage.kind);
    end if;

    update public.major_pickem c
       set points = v_points, hits = v_hits, scored_at = now(), updated_at = c.updated_at
     where c.user_id = v_rec.user_id and c.stage = p_stage;

    update public.profiles
       set points = points + v_points
     where id = v_rec.user_id;

    insert into public.notifications (user_id, kind, title)
    values (
      v_rec.user_id,
      'major',
      v_stage.title || ' · ' || v_hits || ' із ' || v_picks ||
      ', +' || v_points || ' очок'
    );

    user_id := v_rec.user_id;
    points  := v_points;
    hits    := v_hits;
    return next;
  end loop;

  update public.major_stages s
     set scored_at = now(), updated_at = now()
   where s.stage = p_stage;
end;
$$;

revoke all on function public.score_major_stage(smallint) from public, anon, authenticated;
-- Службовому клієнту право треба повертати явно: `revoke from public` забирає
-- його і в service_role.
grant execute on function public.score_major_stage(smallint) to service_role;

commit;

-- Перевірка (після того, як стадія дограна й підсумок внесено в адмінці):
--   select * from public.score_major_stage(1);
--   select kind, title from public.notifications where kind = 'major' order by created_at desc;
