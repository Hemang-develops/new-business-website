-- Professionalization phase 1
-- Non-breaking foundation improvements:
-- - shared updated_at trigger
-- - lookup indexes for real access paths
-- - helper functions to repair identity linkage
-- - canonical admin helper that tolerates current table duplication

begin;

create extension if not exists citext;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target_table text;
  target_tables text[] := array[
    'storefront_booking_access',
    'storefront_courses',
    'storefront_course_modules',
    'storefront_course_items',
    'storefront_course_access',
    'storefront_user_course_progress',
    'storefront_reviews',
    'storefront_global_content',
    'storefront_offerings',
    'storefront_offering_detail_sections',
    'storefront_offering_detail_items',
    'storefront_offering_highlights',
    'storefront_offering_payment_methods',
    'storefront_checkout_configs'
  ];
begin
  foreach target_table in array target_tables loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table
        and column_name = 'updated_at'
    ) then
      execute format('drop trigger if exists trg_%I_set_updated_at on public.%I', target_table, target_table);
      execute format(
        'create trigger trg_%I_set_updated_at before update on public.%I for each row execute function public.set_row_updated_at()',
        target_table,
        target_table
      );
    end if;
  end loop;
end $$;

create or replace function public.is_storefront_admin_email(target_email text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(coalesce(target_email, '')));
  has_storefront_admin boolean := false;
  has_legacy_admin boolean := false;
begin
  if normalized_email = '' then
    return false;
  end if;

  select exists (
    select 1
    from public.storefront_admin_users
    where lower(btrim(email)) = normalized_email
  )
  into has_storefront_admin;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_users'
  ) then
    execute $sql$
      select exists (
        select 1
        from public.admin_users
        where lower(btrim(email)) = $1
      )
    $sql$
    into has_legacy_admin
    using normalized_email;
  end if;

  return has_storefront_admin or has_legacy_admin;
end;
$$;

create or replace function public.backfill_storefront_course_access_user_ids()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  with candidate_links as (
    select
      sca.id,
      au.id as matched_user_id
    from public.storefront_course_access sca
    join auth.users au
      on lower(btrim(au.email)) = lower(btrim(sca.customer_email))
    where sca.user_id is null
      and sca.revoked_at is null
  ),
  applied as (
    update public.storefront_course_access sca
    set user_id = c.matched_user_id,
        updated_at = now()
    from candidate_links c
    where sca.id = c.id
    returning 1
  )
  select count(*) into updated_count from applied;

  return updated_count;
end;
$$;

create or replace function public.backfill_storefront_booking_access_user_ids()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  with candidate_links as (
    select
      sba.id,
      au.id as matched_user_id
    from public.storefront_booking_access sba
    join auth.users au
      on lower(btrim(au.email)) = lower(btrim(sba.customer_email))
    where sba.user_id is null
      and sba.revoked_at is null
  ),
  applied as (
    update public.storefront_booking_access sba
    set user_id = c.matched_user_id,
        updated_at = now()
    from candidate_links c
    where sba.id = c.id
    returning 1
  )
  select count(*) into updated_count from applied;

  return updated_count;
end;
$$;

create index if not exists storefront_course_access_user_id_idx
  on public.storefront_course_access (user_id)
  where user_id is not null and revoked_at is null;

create index if not exists storefront_course_access_customer_email_idx
  on public.storefront_course_access (lower(customer_email))
  where revoked_at is null;

create index if not exists storefront_course_access_offering_id_idx
  on public.storefront_course_access (offering_id)
  where revoked_at is null;

create index if not exists storefront_course_access_course_id_idx
  on public.storefront_course_access (course_id)
  where revoked_at is null;

create index if not exists storefront_course_items_course_sort_idx
  on public.storefront_course_items (course_id, sort_order)
  where is_active = true;

create index if not exists storefront_course_items_module_sort_idx
  on public.storefront_course_items (module_id, sort_order)
  where module_id is not null and is_active = true;

create index if not exists storefront_course_modules_course_sort_idx
  on public.storefront_course_modules (course_id, sort_order)
  where is_active = true;

create index if not exists storefront_user_course_progress_user_course_idx
  on public.storefront_user_course_progress (user_id, course_id);

create index if not exists storefront_user_course_progress_course_item_idx
  on public.storefront_user_course_progress (course_id, item_id);

create index if not exists storefront_user_achievements_user_course_idx
  on public.storefront_user_achievements (user_id, course_id);

create index if not exists storefront_booking_access_user_id_idx
  on public.storefront_booking_access (user_id)
  where user_id is not null and revoked_at is null;

create index if not exists storefront_booking_access_customer_email_idx
  on public.storefront_booking_access (lower(customer_email))
  where revoked_at is null;

commit;

-- Recommended one-time repair after running this migration:
-- select public.backfill_storefront_course_access_user_ids();
-- select public.backfill_storefront_booking_access_user_ids();
