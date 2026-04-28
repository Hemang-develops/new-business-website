-- Fix course admin RLS after add_courses_and_access.sql.
-- Replace admin@example.com with your real admin login email before running.

begin;

create table if not exists public.storefront_admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.storefront_admin_users (email)
values ('admin@example.com')
on conflict (email) do nothing;

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

alter table public.storefront_courses enable row level security;
alter table public.storefront_course_items enable row level security;
alter table public.storefront_course_access enable row level security;
alter table public.storefront_admin_notifications enable row level security;
alter table public.storefront_admin_users enable row level security;

drop policy if exists "Admins read admin users" on public.storefront_admin_users;
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
