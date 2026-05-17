-- Dev-only cleanup helpers for course data.
-- Use this when you want to remove course content created during development.
--
-- Important:
-- 1) If dev and live use different Supabase projects, run this only in DEV.
-- 2) If dev and live share the same database, only use the targeted delete sections.
--    There is no environment column on storefront_courses, so SQL cannot infer
--    "dev" vs "live" unless you tell it which rows are safe to remove.
--
-- Cascades:
-- Deleting from public.storefront_courses will also remove related:
-- - storefront_course_modules
-- - storefront_course_items
-- - storefront_course_access
-- - storefront_user_course_progress
-- - storefront_user_achievements
-- Notifications tied to purchase_id will cascade through course_access deletes.

-- ---------------------------------------------------------------------------
-- Preview: see all current course records
-- ---------------------------------------------------------------------------
select
  c.id,
  c.offering_id,
  c.title,
  c.is_active,
  c.created_at,
  c.updated_at
from public.storefront_courses c
order by c.updated_at desc;

-- ---------------------------------------------------------------------------
-- Option A: delete ALL course data
-- Only use this in a dev-only database/project.
-- ---------------------------------------------------------------------------
-- begin;
-- delete from public.storefront_courses;
-- commit;

-- ---------------------------------------------------------------------------
-- Option B: delete by explicit offering ids
-- Safest option if dev/live share one database.
-- Replace the sample ids with the offerings whose course content should be removed.
-- ---------------------------------------------------------------------------
-- begin;
-- with target_offerings as (
--   select unnest(array[
--     'replace-offering-id-1',
--     'replace-offering-id-2'
--   ]::text[]) as offering_id
-- )
-- delete from public.storefront_courses c
-- using target_offerings t
-- where c.offering_id = t.offering_id;
-- commit;

-- ---------------------------------------------------------------------------
-- Option C: delete by explicit course ids
-- Useful when you already know the exact course rows to remove.
-- ---------------------------------------------------------------------------
-- begin;
-- with target_courses as (
--   select unnest(array[
--     'replace-course-uuid-1',
--     'replace-course-uuid-2'
--   ]::uuid[]) as course_id
-- )
-- delete from public.storefront_courses c
-- using target_courses t
-- where c.id = t.course_id;
-- commit;

-- ---------------------------------------------------------------------------
-- Option D: delete everything created/updated after a cutoff timestamp
-- Use only if you know all post-cutoff rows are dev rows.
-- ---------------------------------------------------------------------------
-- begin;
-- delete from public.storefront_courses
-- where updated_at >= timestamptz '2026-04-30 00:00:00+05:30';
-- commit;

-- ---------------------------------------------------------------------------
-- Optional preview for a targeted delete before you run it
-- Example: preview by offering ids
-- ---------------------------------------------------------------------------
-- with target_offerings as (
--   select unnest(array[
--     'replace-offering-id-1',
--     'replace-offering-id-2'
--   ]::text[]) as offering_id
-- )
-- select c.id, c.offering_id, c.title, c.updated_at
-- from public.storefront_courses c
-- join target_offerings t on t.offering_id = c.offering_id
-- order by c.updated_at desc;
