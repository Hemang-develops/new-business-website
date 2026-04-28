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
create policy "Admins manage modules"
  on public.storefront_course_modules
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

-- User policies for modules (Read-only for buyers)
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

-- User policies for progress (Read/Write own progress)
create policy "Users can manage own progress"
  on public.storefront_user_course_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- User policies for achievements (Read own)
create policy "Users can view own achievements"
  on public.storefront_user_achievements
  for select
  using (user_id = auth.uid());

commit;
