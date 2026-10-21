-- Update Courses Schema for Modules, Drip Logic, and Progress Tracking
begin;

-- 1. Create Modules table
create table if not exists public.storefront_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Update Items table with Modules and Drip columns
alter table public.storefront_course_items 
add column if not exists module_id uuid references public.storefront_course_modules(id) on delete set null,
add column if not exists unlock_after_days integer default 0,
add column if not exists unlock_on_completion_id uuid references public.storefront_course_items(id) on delete set null;

-- 3. Create Progress table
create table if not exists public.storefront_user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  item_id uuid not null references public.storefront_course_items(id) on delete cascade,
  last_position_seconds float default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, item_id)
);

-- 4. Create Achievements table
create table if not exists public.storefront_user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  module_id uuid references public.storefront_course_modules(id) on delete cascade,
  achievement_type text not null, -- e.g. 'module_complete', 'course_complete'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. RLS Policies

-- Enable RLS
alter table public.storefront_course_modules enable row level security;
alter table public.storefront_user_course_progress enable row level security;
alter table public.storefront_user_achievements enable row level security;

-- Admin policies for modules
drop policy if exists "Admins manage modules" on public.storefront_course_modules;
create policy "Admins manage modules"
  on public.storefront_course_modules
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

-- User policies for modules (Read-only for buyers)
drop policy if exists "Users can view modules for courses they own" on public.storefront_course_modules;
create policy "Users can view modules for courses they own"
  on public.storefront_course_modules
  for select
  using (
    exists (
      select 1 from public.storefront_course_access a
      where a.course_id = storefront_course_modules.course_id
      and (a.user_id = auth.uid() or a.customer_email = auth.jwt()->>'email')
      and a.revoked_at is null
    )
  );

create or replace function public.can_access_course_item(target_course_id uuid, target_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.storefront_course_access a
    join public.storefront_course_items i
      on i.course_id = a.course_id
     and i.id = target_item_id
    where a.course_id = target_course_id
      and a.user_id = auth.uid()
      and auth.uid() is not null
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and i.is_active
      and coalesce(i.unlock_after_days, 0) <= floor(extract(epoch from (now() - a.starts_at)) / 86400)
      and (
        i.unlock_on_completion_id is null
        or exists (
          select 1
          from public.storefront_user_course_progress prerequisite
          where prerequisite.user_id = auth.uid()
            and prerequisite.course_id = i.course_id
            and prerequisite.item_id = i.unlock_on_completion_id
            and prerequisite.completed_at is not null
        )
      )
  );
$$;

-- User policies for progress (Read/Write only when a valid active course access exists)
drop policy if exists "Users can manage own progress" on public.storefront_user_course_progress;
create policy "Users can manage own progress"
  on public.storefront_user_course_progress
  for all
  using (
    user_id = auth.uid()
    and public.can_access_course_item(course_id, item_id)
  )
  with check (
    user_id = auth.uid()
    and public.can_access_course_item(course_id, item_id)
  );

-- User policies for achievements (Read own)
drop policy if exists "Users can view own achievements" on public.storefront_user_achievements;
create policy "Users can view own achievements"
  on public.storefront_user_achievements
  for select
  using (user_id = auth.uid());

commit;
