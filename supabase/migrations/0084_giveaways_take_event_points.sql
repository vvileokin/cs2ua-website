-- ---------------------------------------------------------------------------
-- 0084 — розіграші навчаються брати поінти івенту
--
-- Досі квиток можна було купити лише за сезонні поінти або за ewc_points: 0035
-- знав рівно дві валюти, бо третьої тоді не було. Відтоді з'явився гаманець
-- івенту (`profiles.event_points`), на який грає весь EPL S24 — і розіграш
-- турніру лишався єдиним місцем, де гравцеві пропонували заплатити сезонними
-- за річ, яка належить зеленій дошці.
--
-- Тут та сама функція вчиться третьої валюти. Нічого іншого в ній не
-- змінюється: той самий `for update`, та сама перевірка ліміту квитків, той
-- самий запис у giveaway_entries.
--
-- Купівля за зелені — це участь в івенті, нарівні з першою ставкою, тож тут же
-- ставиться `event_joined_at`. Без цього гравець витрачав зелені поінти і не
-- з'являвся в лідерборді EPL, а дошка показувала б людину, що нічого не
-- робила, і не показувала б ту, що купила двадцять квитків.
-- ---------------------------------------------------------------------------

alter table public.giveaways
  drop constraint if exists giveaways_entry_currency_check;
alter table public.giveaways
  add constraint giveaways_entry_currency_check
  check (entry_currency in ('points', 'ewc', 'event'));

create or replace function public.buy_giveaway_ticket(
  p_user uuid,
  p_slug text,
  p_qty  integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g       public.giveaways%rowtype;
  balance integer;
  have    integer;
  cost    integer;
begin
  if auth.uid() is not null then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select * into g from public.giveaways where slug = p_slug;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if g.drawn_at is not null or g.status = 'finished' then
    return jsonb_build_object('ok', false, 'error', 'drawn');
  end if;
  if g.end_iso is not null and g.end_iso <= now() then
    return jsonb_build_object('ok', false, 'error', 'ended');
  end if;

  select case g.entry_currency
           when 'ewc'   then ewc_points
           when 'event' then event_points
           else points
         end
    into balance
    from public.profiles
   where id = p_user
     for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;

  select tickets into have
    from public.giveaway_entries
   where giveaway_slug = p_slug and user_id = p_user;
  have := coalesce(have, 0);

  if have + p_qty > greatest(g.max_tickets, 1) then
    return jsonb_build_object(
      'ok',         false,
      'error',      'max_tickets',
      'tickets',    have,
      'maxTickets', greatest(g.max_tickets, 1)
    );
  end if;

  cost := g.entry_cost * p_qty;
  if balance < cost then
    return jsonb_build_object(
      'ok',      false,
      'error',   'insufficient',
      'balance', balance,
      'needed',  cost
    );
  end if;

  if cost > 0 then
    if g.entry_currency = 'ewc' then
      update public.profiles set ewc_points = ewc_points - cost where id = p_user;
    elsif g.entry_currency = 'event' then
      update public.profiles
         set event_points    = event_points - cost,
             event_joined_at = coalesce(event_joined_at, now())
       where id = p_user;
    else
      update public.profiles set points = points - cost where id = p_user;
    end if;
  end if;

  insert into public.giveaway_entries (giveaway_slug, user_id, tickets, spent, confirmed)
  values (p_slug, p_user, p_qty, cost, true)
  on conflict (giveaway_slug, user_id) do update
     set tickets = public.giveaway_entries.tickets + excluded.tickets,
         spent   = public.giveaway_entries.spent   + excluded.spent;

  return jsonb_build_object(
    'ok',      true,
    'tickets', have + p_qty,
    'spent',   cost,
    'balance', balance - cost
  );
end;
$$;

revoke execute on function public.buy_giveaway_ticket(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.buy_giveaway_ticket(uuid, text, integer)
  to service_role;
