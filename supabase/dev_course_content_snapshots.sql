-- Dev-only helpers for backing up and restoring course content while editing.
-- This is meant for local/dev workflows, not production migrations.
--
-- What it covers:
-- - public.storefront_courses
-- - public.storefront_course_modules
-- - public.storefront_course_items
--
-- Restore behavior:
-- - Restores the course row with an upsert
-- - Replaces all modules and items for that course with the snapshot version
-- - Does not touch storefront_course_access
-- - Will delete dependent progress/achievement rows that cascade from module/item deletes

begin;

create table if not exists public.dev_course_content_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_label text not null,
  course_id uuid not null,
  offering_id text,
  course_row jsonb not null,
  module_rows jsonb not null default '[]'::jsonb,
  item_rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dev_course_content_snapshots_course_idx
  on public.dev_course_content_snapshots (course_id, created_at desc);

create or replace function public.create_dev_course_snapshot(
  target_course_id uuid,
  target_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot_id uuid;
begin
  insert into public.dev_course_content_snapshots (
    snapshot_label,
    course_id,
    offering_id,
    course_row,
    module_rows,
    item_rows
  )
  select
    coalesce(nullif(btrim(target_label), ''), 'snapshot ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    c.id,
    c.offering_id,
    to_jsonb(c),
    coalesce(
      (
        select jsonb_agg(to_jsonb(m) order by m.sort_order, m.created_at, m.id)
        from public.storefront_course_modules m
        where m.course_id = c.id
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(to_jsonb(i) order by i.sort_order, i.created_at, i.id)
        from public.storefront_course_items i
        where i.course_id = c.id
      ),
      '[]'::jsonb
    )
  from public.storefront_courses c
  where c.id = target_course_id
  returning id into snapshot_id;

  if snapshot_id is null then
    raise exception 'Course % not found', target_course_id;
  end if;

  return snapshot_id;
end;
$$;

create or replace function public.restore_dev_course_snapshot(
  target_snapshot_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot_row public.dev_course_content_snapshots%rowtype;
begin
  select *
  into snapshot_row
  from public.dev_course_content_snapshots
  where id = target_snapshot_id;

  if not found then
    raise exception 'Snapshot % not found', target_snapshot_id;
  end if;

  insert into public.storefront_courses (
    id,
    offering_id,
    title,
    description,
    access_period_days,
    is_active,
    created_at,
    updated_at
  )
  select
    restored.id,
    restored.offering_id,
    restored.title,
    restored.description,
    restored.access_period_days,
    restored.is_active,
    restored.created_at,
    restored.updated_at
  from jsonb_populate_record(null::public.storefront_courses, snapshot_row.course_row) as restored
  on conflict (id) do update
  set offering_id = excluded.offering_id,
      title = excluded.title,
      description = excluded.description,
      access_period_days = excluded.access_period_days,
      is_active = excluded.is_active,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;

  delete from public.storefront_course_items
  where course_id = snapshot_row.course_id;

  delete from public.storefront_course_modules
  where course_id = snapshot_row.course_id;

  insert into public.storefront_course_modules (
    id,
    course_id,
    title,
    description,
    sort_order,
    is_active,
    created_at,
    updated_at
  )
  select
    restored.id,
    restored.course_id,
    restored.title,
    restored.description,
    restored.sort_order,
    restored.is_active,
    restored.created_at,
    restored.updated_at
  from jsonb_populate_recordset(null::public.storefront_course_modules, snapshot_row.module_rows) as restored;

  insert into public.storefront_course_items (
    id,
    course_id,
    sort_order,
    title,
    description,
    content_type,
    body,
    youtube_url,
    file_url,
    storage_path,
    external_url,
    allow_download,
    is_active,
    created_at,
    updated_at,
    module_id,
    unlock_after_days,
    unlock_on_completion_id
  )
  select
    restored.id,
    restored.course_id,
    restored.sort_order,
    restored.title,
    restored.description,
    restored.content_type,
    restored.body,
    restored.youtube_url,
    restored.file_url,
    restored.storage_path,
    restored.external_url,
    restored.allow_download,
    restored.is_active,
    restored.created_at,
    restored.updated_at,
    restored.module_id,
    restored.unlock_after_days,
    restored.unlock_on_completion_id
  from jsonb_populate_recordset(null::public.storefront_course_items, snapshot_row.item_rows) as restored;
end;
$$;

commit;

-- Example usage:
--
-- 1) Find the course you want to snapshot
-- select id, offering_id, title
-- from public.storefront_courses
-- order by updated_at desc;
--
-- 2) Create a snapshot before editing
-- select public.create_dev_course_snapshot(
--   'replace-course-uuid-here',
--   'before editing module order'
-- );
--
-- 3) See available snapshots
-- select id, snapshot_label, course_id, offering_id, created_at
-- from public.dev_course_content_snapshots
-- order by created_at desc;
--
-- 4) Restore a snapshot
-- select public.restore_dev_course_snapshot('replace-snapshot-uuid-here');
