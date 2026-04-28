-- Courses, gated content, purchases, and admin notifications.
-- Run this migration before using the Courses admin tab or course access links.

begin;

create extension if not exists pgcrypto;

create table if not exists public.storefront_admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Required: replace this with the email you use to log into /admin, then run it once.
-- insert into public.storefront_admin_users (email)
-- values ('your-admin-email@example.com')
-- on conflict (email) do nothing;

create or replace function public.is_storefront_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.storefront_admin_users
    where lower(btrim(email)) = lower(btrim(auth.jwt() ->> 'email'))
  );
$$;

grant execute on function public.is_storefront_admin() to authenticated;

create table if not exists public.storefront_courses (
  id uuid primary key default gen_random_uuid(),
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  title text not null,
  description text,
  access_period_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offering_id)
);

create table if not exists public.storefront_course_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  description text,
  content_type text not null default 'text' check (content_type in ('text', 'youtube', 'video', 'audio', 'file', 'link')),
  body text,
  youtube_url text,
  file_url text,
  storage_path text,
  external_url text,
  allow_download boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storefront_course_access (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  offering_id text not null references public.storefront_offerings(id) on delete cascade,
  customer_email text not null,
  customer_name text,
  user_id uuid references auth.users(id) on delete set null,
  payment_provider text,
  payment_id text,
  order_id text,
  package_id text,
  amount integer,
  currency text,
  access_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  access_url text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists storefront_course_access_payment_idx
  on public.storefront_course_access (payment_provider, payment_id)
  where payment_provider is not null and payment_id is not null;

create table if not exists public.storefront_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'course_purchase',
  title text not null,
  message text,
  course_id uuid references public.storefront_courses(id) on delete set null,
  offering_id text references public.storefront_offerings(id) on delete set null,
  purchase_id uuid references public.storefront_course_access(id) on delete cascade,
  customer_email text,
  customer_name text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.storefront_courses enable row level security;
alter table public.storefront_course_items enable row level security;
alter table public.storefront_course_access enable row level security;
alter table public.storefront_admin_notifications enable row level security;
alter table public.storefront_admin_users enable row level security;

drop policy if exists "Admins manage storefront courses" on public.storefront_courses;
create policy "Admins manage storefront courses"
  on public.storefront_courses
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Admins manage storefront course items" on public.storefront_course_items;
create policy "Admins manage storefront course items"
  on public.storefront_course_items
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Admins read course access" on public.storefront_course_access;
create policy "Admins read course access"
  on public.storefront_course_access
  for select
  using (public.is_storefront_admin());

drop policy if exists "Admins read notifications" on public.storefront_admin_notifications;
create policy "Admins read notifications"
  on public.storefront_admin_notifications
  for select
  using (public.is_storefront_admin());

commit;
