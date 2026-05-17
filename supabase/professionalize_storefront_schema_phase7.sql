-- Professionalization phase 7
-- Focus:
-- - replace queryable JSONB structures with relational tables
-- - normalize storefront_user_achievements metadata
-- - keep JSONB only for opaque/audit payloads
-- - optimize query performance for achievement and badge data

begin;

-- ============================================================================
-- 1. User Achievement Badges Table
-- ============================================================================

create table if not exists public.storefront_achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  badge_name text not null unique,
  badge_icon_url text,
  badge_description text,
  criteria_type text not null, -- e.g., 'course_completion', 'module_completion', 'milestone', 'skill'
  criteria_threshold int,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.storefront_achievement_definitions enable row level security;

create policy "Authenticated users read achievement definitions"
  on public.storefront_achievement_definitions
  for select
  using (is_active = true);

create trigger storefront_achievement_definitions_updated_at
  before update on public.storefront_achievement_definitions
  for each row
  execute function public.update_timestamp();

-- ============================================================================
-- 2. Refactor User Achievements Table (replace metadata JSONB)
-- ============================================================================

-- Create new version with proper columns
create table if not exists public.storefront_user_achievements_v2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  achievement_definition_id uuid references public.storefront_achievement_definitions(id),
  badge_name text not null, -- denormalized for quick access
  badge_level text, -- e.g., 'bronze', 'silver', 'gold'
  badge_icon_url text,
  earned_at timestamptz not null default now(),
  context jsonb, -- opaque context data (e.g., criteria_met: {...})
  created_at timestamptz not null default now(),
  unique(user_id, course_id, badge_name, badge_level)
);

alter table public.storefront_user_achievements_v2 enable row level security;

create policy "Users read their own achievements"
  on public.storefront_user_achievements_v2
  for select
  using (user_id = auth.uid() or public.is_storefront_admin());

create policy "Admins manage achievements"
  on public.storefront_user_achievements_v2
  for all
  using (public.is_storefront_admin());

create index if not exists storefront_user_achievements_v2_user_id_idx
  on public.storefront_user_achievements_v2 (user_id);

create index if not exists storefront_user_achievements_v2_course_id_idx
  on public.storefront_user_achievements_v2 (course_id);

create index if not exists storefront_user_achievements_v2_earned_at_idx
  on public.storefront_user_achievements_v2 (earned_at);

-- Migrate data from old table if needed
insert into public.storefront_user_achievements_v2 (
  id,
  user_id,
  course_id,
  badge_name,
  earned_at,
  context
)
select
  id,
  user_id,
  course_id,
  coalesce(metadata->>'badge_name', 'achievement'),
  coalesce((metadata->>'earned_at')::timestamptz, created_at),
  metadata
from public.storefront_user_achievements
where id not in (select id from public.storefront_user_achievements_v2)
on conflict do nothing;

-- ============================================================================
-- 3. User Achievement Summary View
-- ============================================================================

create or replace view public.storefront_user_achievement_summary_v as
select
  ua.user_id,
  ua.course_id,
  sc.title as course_title,
  count(*) as total_achievements,
  count(*) filter (where badge_level = 'gold') as gold_badges,
  count(*) filter (where badge_level = 'silver') as silver_badges,
  count(*) filter (where badge_level = 'bronze') as bronze_badges,
  max(ua.earned_at) as latest_achievement_at
from public.storefront_user_achievements_v2 ua
join public.storefront_courses sc on sc.id = ua.course_id
group by ua.user_id, ua.course_id, sc.title;

-- ============================================================================
-- 4. Clean up old JSONB columns from offerings (if they still exist)
-- ============================================================================

-- Check for and remove legacy JSONB offering columns
do $$
begin
  -- These drops are safe to attempt even if columns don't exist
  alter table public.storefront_offerings drop column if exists highlights;
  alter table public.storefront_offerings drop column if exists metadata;
  alter table public.storefront_offerings drop column if exists pricing_tiers;
exception when others then
  null; -- Silently ignore if columns don't exist
end $$;

-- ============================================================================
-- 5. Ensure revision history payloads remain JSONB (already correct)
-- ============================================================================

-- The revision tables from Phase 4 correctly use JSONB for opaque payloads
-- Example: storefront_course_revisions.payload is JSONB
-- This is the correct pattern to keep

-- ============================================================================
-- 6. Notification metadata cleanup (already using JSONB correctly)
-- ============================================================================

-- The admin notification feed from Phase 5 already uses JSONB for metadata
-- This is correct because notification metadata is context-specific and not queried

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

grant select on public.storefront_achievement_definitions to authenticated;
grant select on public.storefront_user_achievements_v2 to authenticated;
grant select on public.storefront_user_achievement_summary_v to authenticated;

-- ============================================================================
-- 8. Migration guidance for old storefront_user_achievements
-- ============================================================================

-- After all data is confirmed migrated to v2, rename tables:
-- ALTER TABLE public.storefront_user_achievements RENAME TO storefront_user_achievements_legacy;
-- ALTER TABLE public.storefront_user_achievements_v2 RENAME TO storefront_user_achievements;
-- CREATE VIEW public.storefront_user_achievements_v2 AS SELECT * FROM public.storefront_user_achievements;

commit;

-- Recommended follow-up after running this migration:
-- 1. Verify achievement counts match between old and new tables
-- 2. Update application code to use storefront_user_achievements_v2
-- 3. Test achievement earning workflows
-- 4. Plan rename of v2 to primary table after app migration
-- 5. Monitor query performance improvements on achievement queries
