begin;

create table if not exists public.storefront_global_content (
  id smallint primary key default 1 check (id = 1),
  manual_instructions text[] not null default '{}'::text[],
  legal_notes text[] not null default '{}'::text[],
  closing_notes text[] not null default '{}'::text[],
  success_heading text,
  success_quote text,
  success_author text,
  updated_at timestamptz not null default now()
);

with first_offering as (
  select id
  from public.storefront_offerings
  order by sort_order asc, id asc
  limit 1
)
insert into public.storefront_global_content (
  id,
  manual_instructions,
  legal_notes,
  closing_notes,
  success_heading,
  success_quote,
  success_author
)
select
  1,
  coalesce(
    (
      select array_agg(instruction order by sort_order asc)
      from public.storefront_offering_manual_instructions mi
      where mi.offering_id = fo.id
    ),
    '{}'::text[]
  ),
  coalesce(
    (
      select array_agg(note order by sort_order asc)
      from public.storefront_offering_legal_notes ln
      where ln.offering_id = fo.id
    ),
    '{}'::text[]
  ),
  coalesce(
    (
      select array_agg(note order by sort_order asc)
      from public.storefront_offering_closing_notes cn
      where cn.offering_id = fo.id
    ),
    '{}'::text[]
  ),
  (
    select ss.heading
    from public.storefront_offering_success_stories ss
    where ss.offering_id = fo.id
  ),
  (
    select ss.quote
    from public.storefront_offering_success_stories ss
    where ss.offering_id = fo.id
  ),
  (
    select ss.author
    from public.storefront_offering_success_stories ss
    where ss.offering_id = fo.id
  )
from first_offering fo
on conflict (id) do nothing;

drop table if exists public.storefront_offering_price_details;
drop table if exists public.storefront_offering_manual_instructions;
drop table if exists public.storefront_offering_legal_notes;
drop table if exists public.storefront_offering_closing_notes;
drop table if exists public.storefront_offering_success_stories;

alter table public.storefront_offerings
  drop column if exists price_label,
  drop column if exists price_details,
  drop column if exists manual_instructions,
  drop column if exists legal_notes,
  drop column if exists closing_notes,
  drop column if exists success_story;

commit;
