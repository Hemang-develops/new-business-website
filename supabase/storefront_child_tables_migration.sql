-- Run after base tables are populated.
-- This creates normalized child tables and backfills from existing JSONB columns.

begin;

create table if not exists public.storefront_offering_highlights (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_payment_methods (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  method text not null,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_manual_instructions (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  instruction text not null,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_legal_notes (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  note text not null,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_closing_notes (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  note text not null,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_price_details (
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  label text,
  amount text,
  currency text,
  updated_at timestamptz not null default now(),
  primary key (offering_id, sort_order)
);

create table if not exists public.storefront_offering_detail_sections (
  id bigint generated always as identity primary key,
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  sort_order integer not null,
  heading text,
  description text,
  updated_at timestamptz not null default now(),
  unique (offering_id, sort_order)
);

create table if not exists public.storefront_offering_detail_items (
  section_id bigint not null references public.storefront_offering_detail_sections(id) on delete cascade,
  sort_order integer not null,
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (section_id, sort_order)
);

create table if not exists public.storefront_offering_success_stories (
  offering_id text primary key references public.storefront_offerings(id) on delete cascade,
  heading text,
  quote text,
  author text,
  updated_at timestamptz not null default now()
);

-- Backfill arrays / objects
delete from public.storefront_offering_highlights;
insert into public.storefront_offering_highlights (offering_id, sort_order, text)
select o.id, arr.ordinality::int - 1, arr.value
from public.storefront_offerings o
cross join lateral jsonb_array_elements_text(coalesce(o.highlights, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_payment_methods;
insert into public.storefront_offering_payment_methods (offering_id, sort_order, method)
select o.id, arr.ordinality::int - 1, arr.value
from public.storefront_offerings o
cross join lateral jsonb_array_elements_text(coalesce(o.payment_methods, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_manual_instructions;
insert into public.storefront_offering_manual_instructions (offering_id, sort_order, instruction)
select o.id, arr.ordinality::int - 1, arr.value
from public.storefront_offerings o
cross join lateral jsonb_array_elements_text(coalesce(o.manual_instructions, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_legal_notes;
insert into public.storefront_offering_legal_notes (offering_id, sort_order, note)
select o.id, arr.ordinality::int - 1, arr.value
from public.storefront_offerings o
cross join lateral jsonb_array_elements_text(coalesce(o.legal_notes, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_closing_notes;
insert into public.storefront_offering_closing_notes (offering_id, sort_order, note)
select o.id, arr.ordinality::int - 1, arr.value
from public.storefront_offerings o
cross join lateral jsonb_array_elements_text(coalesce(o.closing_notes, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_price_details;
insert into public.storefront_offering_price_details (offering_id, sort_order, label, amount, currency)
select
  o.id,
  arr.ordinality::int - 1,
  arr.value->>'label',
  arr.value->>'amount',
  arr.value->>'currency'
from public.storefront_offerings o
cross join lateral jsonb_array_elements(coalesce(o.price_details, '[]'::jsonb)) with ordinality as arr(value, ordinality);

delete from public.storefront_offering_detail_items;
delete from public.storefront_offering_detail_sections;

insert into public.storefront_offering_detail_sections (offering_id, sort_order, heading, description)
select
  o.id,
  arr.ordinality::int - 1,
  arr.value->>'heading',
  arr.value->>'description'
from public.storefront_offerings o
cross join lateral jsonb_array_elements(coalesce(o.details_sections, '[]'::jsonb)) with ordinality as arr(value, ordinality);

insert into public.storefront_offering_detail_items (section_id, sort_order, text)
select
  ds.id as section_id,
  items.ordinality::int - 1,
  items.value
from public.storefront_offering_detail_sections ds
join public.storefront_offerings o on o.id = ds.offering_id
cross join lateral (
  select
    arr.value,
    arr.ordinality
  from jsonb_array_elements_text(
    coalesce((o.details_sections->ds.sort_order)->'items', '[]'::jsonb)
  ) with ordinality as arr(value, ordinality)
) as items;

delete from public.storefront_offering_success_stories;
insert into public.storefront_offering_success_stories (offering_id, heading, quote, author)
select
  o.id,
  o.success_story->>'heading',
  o.success_story->>'quote',
  o.success_story->>'author'
from public.storefront_offerings o
where o.success_story is not null;

commit;
