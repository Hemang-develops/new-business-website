-- Professionalization phase 2
-- Focus:
-- - canonical admin identity
-- - compatibility with legacy admin tables
-- - initial bounded read models for site settings

begin;

create table if not exists public.storefront_admin_principals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  is_active boolean not null default true,
  source text not null default 'manual' check (source in ('manual', 'storefront_admin_users', 'admin_users', 'migration')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_storefront_admin_principals_set_updated_at on public.storefront_admin_principals;
create trigger trg_storefront_admin_principals_set_updated_at
before update on public.storefront_admin_principals
for each row execute function public.set_row_updated_at();

create index if not exists storefront_admin_principals_email_idx
  on public.storefront_admin_principals (email)
  where is_active = true;

create or replace function public.sync_storefront_admin_principals_from_legacy()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer := 0;
begin
  insert into public.storefront_admin_principals (
    user_id,
    email,
    is_active,
    source
  )
  select
    deduped.user_id,
    deduped.email,
    true,
    deduped.source
  from (
    select distinct on (au.id)
      au.id as user_id,
      lower(btrim(au.email))::citext as email,
      legacy.source
    from (
      select
        lower(btrim(email)) as email,
        'storefront_admin_users'::text as source,
        1 as source_priority
      from public.storefront_admin_users
      where btrim(coalesce(email, '')) <> ''
      union all
      select
        lower(btrim(email)) as email,
        'admin_users'::text as source,
        2 as source_priority
      from public.admin_users
      where btrim(coalesce(email, '')) <> ''
    ) legacy
    join auth.users au
      on lower(btrim(au.email)) = legacy.email
    order by au.id, legacy.source_priority
  ) deduped
  on conflict (user_id) do update
  set email = excluded.email,
      is_active = true,
      source = excluded.source,
      updated_at = now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

create or replace function public.add_storefront_admin_principal(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(coalesce(target_email, '')));
  matched_user_id uuid;
begin
  if normalized_email = '' then
    raise exception 'Email is required';
  end if;

  select id
  into matched_user_id
  from auth.users
  where lower(btrim(email)) = normalized_email
  limit 1;

  if matched_user_id is null then
    raise exception 'No auth.users row found for %', normalized_email;
  end if;

  insert into public.storefront_admin_principals (
    user_id,
    email,
    is_active,
    source
  )
  values (
    matched_user_id,
    normalized_email::citext,
    true,
    'manual'
  )
  on conflict (user_id) do update
  set email = excluded.email,
      is_active = true,
      source = 'manual',
      updated_at = now();

  insert into public.storefront_admin_users (email)
  values (normalized_email)
  on conflict (email) do nothing;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_users'
  ) then
    execute $sql$
      insert into public.admin_users (user_id, email)
      values ($1, $2)
      on conflict (user_id) do update
      set email = excluded.email
    $sql$
    using matched_user_id, normalized_email;
  end if;

  return matched_user_id;
end;
$$;

create or replace function public.is_storefront_admin_email(target_email text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(coalesce(target_email, '')));
begin
  if normalized_email = '' then
    return false;
  end if;

  if exists (
    select 1
    from public.storefront_admin_principals
    where email = normalized_email::citext
      and is_active = true
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.storefront_admin_users
    where lower(btrim(email)) = normalized_email
  ) then
    return true;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'admin_users'
  ) then
    return exists (
      select 1
      from public.admin_users
      where lower(btrim(email)) = normalized_email
    );
  end if;

  return false;
end;
$$;

create or replace function public.is_storefront_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_storefront_admin_email(auth.jwt() ->> 'email');
$$;

grant execute on function public.is_storefront_admin_email(text) to authenticated;
grant execute on function public.is_storefront_admin() to authenticated;

alter table public.storefront_admin_principals enable row level security;

drop policy if exists "Admins read admin principals" on public.storefront_admin_principals;
create policy "Admins read admin principals"
  on public.storefront_admin_principals
  for select
  using (public.is_storefront_admin());

drop policy if exists "Admins manage admin principals" on public.storefront_admin_principals;
create policy "Admins manage admin principals"
  on public.storefront_admin_principals
  for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

create or replace view public.storefront_brand_settings_v as
select
  id,
  brand_nav_title,
  brand_full_title,
  brand_footer_tagline,
  brand_shop_label,
  brand_shop_href,
  brand_support_email,
  profile_image_url,
  profile_image_alt,
  profile_role_label,
  updated_at
from public.storefront_global_content;

create or replace view public.storefront_theme_settings_v as
select
  id,
  theme_primary,
  theme_primary_light,
  theme_secondary,
  theme_accent,
  theme_dark,
  updated_at
from public.storefront_global_content;

create or replace view public.storefront_footer_settings_v as
select
  id,
  footer_intro_eyebrow,
  footer_intro_heading,
  footer_status_label,
  footer_terms_label,
  footer_terms_href,
  footer_privacy_label,
  footer_privacy_href,
  newsletter_form_action,
  updated_at
from public.storefront_global_content;

create or replace view public.storefront_faq_settings_v as
select
  id,
  faqs,
  updated_at
from public.storefront_global_content;

commit;

-- Recommended after running this migration:
-- select public.sync_storefront_admin_principals_from_legacy();
