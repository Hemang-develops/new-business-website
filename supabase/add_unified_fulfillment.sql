begin;

alter table public.storefront_offerings
  add column if not exists fulfillment_mode text,
  add column if not exists digital_delivery_type text,
  add column if not exists delivery_url text,
  add column if not exists reading_email_body text,
  add column if not exists access_expiry_days integer,
  add column if not exists fulfillment_version integer not null default 1;

update public.storefront_offerings
set
  fulfillment_mode = case
    when cta_type = 'booking' or booking_enabled then 'booking'
    when id = 'awaken-your-inner-godess-divine-feminine-course' then 'digital'
    when section_id in ('meditations', 'digital') or id in ('personalised-meditation', 'personalised-subliminal') then 'digital'
    else 'reading'
  end,
  digital_delivery_type = case
    when id = 'awaken-your-inner-godess-divine-feminine-course' then 'course'
    when cta_type = 'booking' or booking_enabled then null
    when section_id in ('meditations', 'digital') or id in ('personalised-meditation', 'personalised-subliminal') then 'download'
    else null
  end
where fulfillment_mode is null;

update public.storefront_offerings
set digital_delivery_type = case
  when fulfillment_mode <> 'digital' then null
  when digital_delivery_type is null then 'download'
  else digital_delivery_type
end;

alter table public.storefront_offerings
  alter column fulfillment_mode set default 'digital';

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_fulfillment_mode_check;
alter table public.storefront_offerings
  add constraint storefront_offerings_fulfillment_mode_check
  check (fulfillment_mode in ('digital', 'booking', 'reading'));

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_digital_delivery_type_check;
alter table public.storefront_offerings
  add constraint storefront_offerings_digital_delivery_type_check
  check (
    (fulfillment_mode = 'digital' and digital_delivery_type in ('download', 'course'))
    or (fulfillment_mode in ('booking', 'reading') and digital_delivery_type is null)
  );

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_access_expiry_days_check;
alter table public.storefront_offerings
  add constraint storefront_offerings_access_expiry_days_check
  check (access_expiry_days is null or access_expiry_days > 0);

create table if not exists public.storefront_purchases (
  id uuid primary key default gen_random_uuid(),
  offering_id text not null references public.storefront_offerings(id) on delete restrict,
  customer_email text not null,
  customer_name text,
  country text,
  user_id uuid references auth.users(id) on delete set null,
  payment_provider text not null,
  payment_id text not null,
  order_id text,
  amount integer,
  currency text,
  fulfillment_mode text not null,
  fulfillment_version integer not null default 1,
  status text not null default 'paid',
  delivery_status text not null default 'pending',
  delivery_url text,
  admin_note text,
  expires_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payment_provider, payment_id),
  check (fulfillment_mode in ('digital', 'booking', 'reading')),
  check (status in ('paid', 'failed', 'refunded')),
  check (delivery_status in ('pending', 'delivered', 'manual', 'failed'))
);

alter table public.storefront_purchases
  add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.storefront_purchases
  add column if not exists country text;

create index if not exists storefront_purchases_customer_offering_idx
  on public.storefront_purchases (lower(customer_email), offering_id, fulfillment_version);

create index if not exists storefront_purchases_delivery_status_idx
  on public.storefront_purchases (delivery_status, created_at desc);

alter table public.storefront_purchases enable row level security;

drop policy if exists "Admins read storefront purchases" on public.storefront_purchases;
create policy "Admins read storefront purchases"
  on public.storefront_purchases
  for select
  using (public.is_storefront_admin());

drop policy if exists "Users read their storefront purchases" on public.storefront_purchases;
create policy "Users read their storefront purchases"
  on public.storefront_purchases
  for select
  using (
    user_id = auth.uid()
    or lower(btrim(customer_email)) = lower(btrim(auth.jwt() ->> 'email'))
  );

commit;
