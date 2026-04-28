-- storefront_booking_access
-- Tracks purchased one-on-one meeting slots (offerings with cta_type = 'booking').
-- Mirrors storefront_course_access in structure so admin tooling stays consistent.
--
-- Run after: add_booking_fields_to_storefront_offerings.sql
-- Run after: add_courses_and_access.sql  (needs is_storefront_admin function)

begin;

create extension if not exists pgcrypto;

create table if not exists public.storefront_booking_access (
  id               uuid       primary key default gen_random_uuid(),
  offering_id      text       not null references public.storefront_offerings(id) on delete cascade,
  customer_email   text       not null,
  customer_name    text,
  user_id          uuid       references auth.users(id) on delete set null,

  -- Payment / order tracking (same as course access)
  payment_provider text,
  payment_id       text,
  order_id         text,
  amount           integer,    -- in minor units (e.g. cents)
  currency         text,

  -- Scheduling fields (set by admin or booking provider webhook)
  scheduled_at     timestamptz,              -- confirmed meeting datetime
  duration_minutes integer,                  -- overrides offering default
  meeting_url      text,                     -- join link (Zoom / Google Meet / Cal.com)
  notes            text,                     -- admin or user notes
  status           text       not null default 'pending'
                              check (status in ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled')),

  -- Lifecycle
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.storefront_booking_access is
  'Records of booking offerings purchased by users. One row per purchase/slot.';

-- Prevent duplicate Stripe/payment records
create unique index if not exists storefront_booking_access_payment_idx
  on public.storefront_booking_access (payment_provider, payment_id)
  where payment_provider is not null and payment_id is not null;

-- Index lookups by user identity
create index if not exists storefront_booking_access_user_idx
  on public.storefront_booking_access (user_id)
  where user_id is not null;

create index if not exists storefront_booking_access_email_idx
  on public.storefront_booking_access (lower(customer_email));

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.storefront_booking_access enable row level security;

-- Users can read their own bookings (not cancelled/revoked)
drop policy if exists "Users read own booking access" on public.storefront_booking_access;
create policy "Users read own booking access"
  on public.storefront_booking_access
  for select
  to authenticated
  using (
    revoked_at is null
    and status <> 'cancelled'
    and (
      user_id = auth.uid()
      or lower(btrim(customer_email)) = lower(btrim(auth.jwt() ->> 'email'))
    )
  );

-- Admins can do anything
drop policy if exists "Admins manage booking access" on public.storefront_booking_access;
create policy "Admins manage booking access"
  on public.storefront_booking_access
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

-- ─── Notify admin on new booking purchase ────────────────────────────────────
-- Reuses storefront_admin_notifications table from add_courses_and_access.sql

-- Add a nullable booking_access_id reference if the notifications table exists
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public'
               and table_name   = 'storefront_admin_notifications') then

    -- Add booking_access_id column
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public'
                     and table_name   = 'storefront_admin_notifications'
                     and column_name  = 'booking_access_id') then
      alter table public.storefront_admin_notifications
        add column booking_access_id uuid
          references public.storefront_booking_access(id) on delete cascade;
    end if;

    -- Widen the type column constraint to allow 'booking_purchase'
    alter table public.storefront_admin_notifications
      drop constraint if exists storefront_admin_notifications_type_check;
  end if;
end;
$$;

commit;
