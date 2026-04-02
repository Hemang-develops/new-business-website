alter table public.storefront_offerings
  add column if not exists cta_type text not null default 'contact',
  add column if not exists booking_enabled boolean not null default false,
  add column if not exists booking_provider text,
  add column if not exists booking_status text not null default 'pending',
  add column if not exists booking_external_id text,
  add column if not exists booking_url text,
  add column if not exists booking_cta_label text,
  add column if not exists duration_minutes integer,
  add column if not exists session_format text,
  add column if not exists host_id text,
  add column if not exists booking_last_synced_at timestamptz,
  add column if not exists booking_last_error text;

update public.storefront_offerings
set
  cta_type = case
    when exists (
      select 1
      from public.storefront_checkout_configs cfg
      where cfg.product_id = public.storefront_offerings.id
    ) then 'checkout'
    else 'contact'
  end,
  booking_enabled = false,
  booking_provider = case
    when cta_type = 'booking' then 'calcom'
    else booking_provider
  end,
  booking_status = case
    when booking_enabled then coalesce(nullif(booking_status, ''), 'pending')
    else 'pending'
  end
where cta_type is null
   or booking_enabled is null
   or booking_status is null;

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_cta_type_chk;

alter table public.storefront_offerings
  add constraint storefront_offerings_cta_type_chk
  check (cta_type in ('checkout', 'booking', 'contact'));

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_booking_provider_chk;

alter table public.storefront_offerings
  add constraint storefront_offerings_booking_provider_chk
  check (booking_provider is null or booking_provider in ('calcom'));

alter table public.storefront_offerings
  drop constraint if exists storefront_offerings_booking_status_chk;

alter table public.storefront_offerings
  add constraint storefront_offerings_booking_status_chk
  check (booking_status in ('pending', 'synced', 'failed'));
