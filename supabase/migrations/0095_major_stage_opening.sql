-- CS2 UA — пари першого туру стадії. Run in Supabase → SQL Editor.
-- Requires 0094.
--
-- Над вкладками стадій має стояти стрічка найближчих матчів, і взяти їх нема
-- звідки: у `public.matches` мейджора немає, а заводити його туди заради
-- восьми рядків означало б підняти разом із ними ставки, сторінки матчів і
-- живу рейку на події, для якої нічого з цього ще не налаштовано.
--
-- Тому пари живуть при стадії, якій належать. Їх знає тільки сторінка
-- пікемів, і коли мейджор заведуть у турніри як слід, ця колонка просто
-- перестане використовуватись.
--
-- Тільки перший тур. Другий залежить від результатів першого — пари там
-- зводить швейцарка, а не розклад, і вписати їх наперед неможливо.

begin;

alter table public.major_stages
  add column if not exists opening jsonb not null default '[]'::jsonb;

comment on column public.major_stages.opening is
  'Пари першого туру: [{"a":"slug","b":"slug","at":"ISO"}]. Тільки для стрічки на сторінці пікемів.';

-- Розклад першого туру Stage 1, час UTC, узятий зі сторінки події.
update public.major_stages
   set opening = '[
         {"a":"heroic",         "b":"imperial",  "at":"2026-11-24T06:00:00Z"},
         {"a":"ninez",          "b":"lynn",      "at":"2026-11-24T06:00:00Z"},
         {"a":"hundredthieves", "b":"chinggis",  "at":"2026-11-24T07:00:00Z"},
         {"a":"nip",            "b":"m80",       "at":"2026-11-24T07:00:00Z"},
         {"a":"parivision",     "b":"sharks",    "at":"2026-11-24T08:00:00Z"},
         {"a":"liquid",         "b":"bcgame",    "at":"2026-11-24T08:00:00Z"},
         {"a":"faze",           "b":"wildcard",  "at":"2026-11-24T09:00:00Z"},
         {"a":"eternalfire",    "b":"flyquest",  "at":"2026-11-24T09:00:00Z"}
       ]'::jsonb,
       updated_at = now()
 where stage = 1;

commit;

-- Перевірка:
--   select stage, jsonb_array_length(opening) from public.major_stages order by stage;
--   -- стадія 1 → 8, решта → 0
