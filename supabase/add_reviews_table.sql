begin;

create table if not exists public.storefront_reviews (
  id bigint generated always as identity primary key,
  placement text not null default 'home' check (placement in ('home', 'buy', 'global')),
  offering_id text references public.storefront_offerings(id) on delete set null,
  heading text,
  quote text not null,
  author text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists storefront_reviews_placement_idx on public.storefront_reviews (placement, is_active, sort_order);
create index if not exists storefront_reviews_offering_idx on public.storefront_reviews (offering_id, is_active, sort_order);

insert into public.storefront_reviews (placement, heading, quote, author, sort_order, is_active)
values
  ('home', null, 'Within four weeks of working with Nehal I landed the apartment, the partner, and the dream clients I had written down. I finally trust my own timeline.', 'Anika, Toronto', 0, true),
  ('home', null, 'The audio coaching felt like having a best friend in my pocket. I released anxiety around sales and had my highest launch to date.', 'Jasmine, London', 1, true),
  ('home', null, 'Nehal blends feminine flow with grounded strategy. I learned how to manifest without bypassing my feelings and everything changed.', 'Maya, Dubai', 2, true)
on conflict do nothing;

commit;
