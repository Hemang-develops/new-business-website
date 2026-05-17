-- Professionalization phase 4
-- Focus:
-- - add revision history for admin-managed course and site-setting content
-- - capture who changed it, when it changed, and what changed
-- - provide restore tooling for prior revisions

begin;

create table if not exists public.storefront_course_revisions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.storefront_courses(id) on delete cascade,
  revision_number integer not null,
  event text not null default 'update' check (event in ('insert', 'update', 'delete', 'revert')),
  payload jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_email citext,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (course_id, revision_number)
);

create index if not exists storefront_course_revisions_course_id_idx
  on public.storefront_course_revisions (course_id, revision_number desc);

create table if not exists public.storefront_site_setting_revisions (
  id uuid primary key default gen_random_uuid(),
  setting_domain text not null check (setting_domain in ('brand', 'theme', 'footer', 'faq', 'global')),
  record_id int2 not null default 1,
  revision_number integer not null,
  event text not null default 'update' check (event in ('insert', 'update', 'delete', 'revert')),
  payload jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_email citext,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (setting_domain, record_id, revision_number)
);

create index if not exists storefront_site_setting_revisions_domain_idx
  on public.storefront_site_setting_revisions (setting_domain, record_id, revision_number desc);

create or replace function public.storefront_course_revision_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_payload jsonb;
  next_revision integer;
begin
  if TG_OP = 'DELETE' then
    row_payload := row_to_json(old)::jsonb;
    select coalesce(max(revision_number), 0) + 1
      into next_revision
      from public.storefront_course_revisions
      where course_id = old.id;
  else
    row_payload := row_to_json(new)::jsonb;
    select coalesce(max(revision_number), 0) + 1
      into next_revision
      from public.storefront_course_revisions
      where course_id = new.id;
  end if;

  insert into public.storefront_course_revisions (
    course_id,
    revision_number,
    event,
    payload,
    changed_by,
    changed_email
  ) values (
    coalesce(new.id, old.id),
    next_revision,
    lower(TG_OP),
    row_payload,
    auth.uid(),
    auth.jwt() ->> 'email'
  );

  if TG_OP = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

create or replace function public.storefront_site_setting_revision_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_payload jsonb;
  target_domain text;
  target_id int2;
  next_revision integer;
begin
  if TG_TABLE_NAME = 'storefront_brand_settings' then
    target_domain := 'brand';
  elsif TG_TABLE_NAME = 'storefront_theme_settings' then
    target_domain := 'theme';
  elsif TG_TABLE_NAME = 'storefront_footer_settings' then
    target_domain := 'footer';
  elsif TG_TABLE_NAME = 'storefront_faq_settings' then
    target_domain := 'faq';
  elsif TG_TABLE_NAME = 'storefront_global_content' then
    target_domain := 'global';
  else
    raise exception 'Unsupported settings table for revision trigger: %', TG_TABLE_NAME;
  end if;

  if TG_OP = 'DELETE' then
    row_payload := row_to_json(old)::jsonb;
    target_id := old.id;
    select coalesce(max(revision_number), 0) + 1
      into next_revision
      from public.storefront_site_setting_revisions
      where setting_domain = target_domain
        and record_id = target_id;
  else
    row_payload := row_to_json(new)::jsonb;
    target_id := new.id;
    select coalesce(max(revision_number), 0) + 1
      into next_revision
      from public.storefront_site_setting_revisions
      where setting_domain = target_domain
        and record_id = target_id;
  end if;

  insert into public.storefront_site_setting_revisions (
    setting_domain,
    record_id,
    revision_number,
    event,
    payload,
    changed_by,
    changed_email
  ) values (
    target_domain,
    target_id,
    next_revision,
    lower(TG_OP),
    row_payload,
    auth.uid(),
    auth.jwt() ->> 'email'
  );

  if TG_OP = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

create trigger trg_storefront_courses_revision
after insert or update or delete on public.storefront_courses
for each row execute function public.storefront_course_revision_trigger();

create trigger trg_storefront_brand_settings_revision
after insert or update or delete on public.storefront_brand_settings
for each row execute function public.storefront_site_setting_revision_trigger();

create trigger trg_storefront_theme_settings_revision
after insert or update or delete on public.storefront_theme_settings
for each row execute function public.storefront_site_setting_revision_trigger();

create trigger trg_storefront_footer_settings_revision
after insert or update or delete on public.storefront_footer_settings
for each row execute function public.storefront_site_setting_revision_trigger();

create trigger trg_storefront_faq_settings_revision
after insert or update or delete on public.storefront_faq_settings
for each row execute function public.storefront_site_setting_revision_trigger();

create trigger trg_storefront_global_content_revision
after insert or update or delete on public.storefront_global_content
for each row execute function public.storefront_site_setting_revision_trigger();

create or replace function public.revert_storefront_course_to_revision(
  target_course_id uuid,
  target_revision integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  revision_payload jsonb;
begin
  select payload
    into revision_payload
    from public.storefront_course_revisions
    where course_id = target_course_id
      and revision_number = target_revision;

  if revision_payload is null then
    raise exception 'No course revision found for % / %', target_course_id, target_revision;
  end if;

  update public.storefront_courses
  set offering_id = revision_payload ->> 'offering_id',
      title = revision_payload ->> 'title',
      description = revision_payload ->> 'description',
      access_period_days = nullif(revision_payload ->> 'access_period_days', '')::integer,
      is_active = (revision_payload ->> 'is_active')::boolean,
      updated_at = now()
  where id = target_course_id;
end;
$$;

create or replace function public.revert_storefront_site_setting_to_revision(
  target_domain text,
  target_record_id int2,
  target_revision integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  revision_payload jsonb;
begin
  select payload
    into revision_payload
    from public.storefront_site_setting_revisions
    where setting_domain = target_domain
      and record_id = target_record_id
      and revision_number = target_revision;

  if revision_payload is null then
    raise exception 'No site setting revision found for % / % / %', target_domain, target_record_id, target_revision;
  end if;

  if target_domain = 'brand' then
    update public.storefront_brand_settings
    set nav_title = revision_payload ->> 'nav_title',
        full_title = revision_payload ->> 'full_title',
        footer_tagline = revision_payload ->> 'footer_tagline',
        shop_label = revision_payload ->> 'shop_label',
        shop_href = revision_payload ->> 'shop_href',
        support_email = revision_payload ->> 'support_email',
        profile_image_url = revision_payload ->> 'profile_image_url',
        profile_image_alt = revision_payload ->> 'profile_image_alt',
        profile_role_label = revision_payload ->> 'profile_role_label',
        updated_at = now()
    where id = target_record_id;
  elsif target_domain = 'theme' then
    update public.storefront_theme_settings
    set primary_color = revision_payload ->> 'primary_color',
        primary_light_color = revision_payload ->> 'primary_light_color',
        secondary_color = revision_payload ->> 'secondary_color',
        accent_color = revision_payload ->> 'accent_color',
        dark_color = revision_payload ->> 'dark_color',
        updated_at = now()
    where id = target_record_id;
  elsif target_domain = 'footer' then
    update public.storefront_footer_settings
    set intro_eyebrow = revision_payload ->> 'intro_eyebrow',
        intro_heading = revision_payload ->> 'intro_heading',
        status_label = revision_payload ->> 'status_label',
        terms_label = revision_payload ->> 'terms_label',
        terms_href = revision_payload ->> 'terms_href',
        privacy_label = revision_payload ->> 'privacy_label',
        privacy_href = revision_payload ->> 'privacy_href',
        newsletter_form_action = revision_payload ->> 'newsletter_form_action',
        updated_at = now()
    where id = target_record_id;
  elsif target_domain = 'faq' then
    update public.storefront_faq_settings
    set faqs = revision_payload -> 'faqs',
        updated_at = now()
    where id = target_record_id;
  elsif target_domain = 'global' then
    update public.storefront_global_content
    set manual_instructions = revision_payload -> 'manual_instructions',
        legal_notes = revision_payload -> 'legal_notes',
        closing_notes = revision_payload -> 'closing_notes',
        success_heading = revision_payload ->> 'success_heading',
        success_quote = revision_payload ->> 'success_quote',
        success_author = revision_payload ->> 'success_author',
        updated_at = now()
    where id = target_record_id;
  else
    raise exception 'Unsupported site setting domain: %', target_domain;
  end if;
end;
$$;

create or replace function public.initialize_storefront_revision_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_courses integer := 0;
  inserted_settings integer := 0;
begin
  with inserted as (
    insert into public.storefront_course_revisions (
      course_id,
      revision_number,
      event,
      payload,
      changed_email,
      created_at
    )
    select
      sc.id,
      1,
      'insert',
      row_to_json(sc)::jsonb,
      null,
      now()
    from public.storefront_courses sc
    where not exists (
      select 1
      from public.storefront_course_revisions r
      where r.course_id = sc.id
    )
    returning 1
  )
  select count(*) into inserted_courses from inserted;

  with settings_to_insert as (
    select 'brand'::text as setting_domain, id as record_id, row_to_json(sb)::jsonb as payload
    from public.storefront_brand_settings sb
    where not exists (
      select 1
      from public.storefront_site_setting_revisions r
      where r.setting_domain = 'brand' and r.record_id = sb.id
    )
    union all
    select 'theme'::text, id, row_to_json(st)::jsonb
    from public.storefront_theme_settings st
    where not exists (
      select 1
      from public.storefront_site_setting_revisions r
      where r.setting_domain = 'theme' and r.record_id = st.id
    )
    union all
    select 'footer'::text, id, row_to_json(sf)::jsonb
    from public.storefront_footer_settings sf
    where not exists (
      select 1
      from public.storefront_site_setting_revisions r
      where r.setting_domain = 'footer' and r.record_id = sf.id
    )
    union all
    select 'faq'::text, id, row_to_json(sq)::jsonb
    from public.storefront_faq_settings sq
    where not exists (
      select 1
      from public.storefront_site_setting_revisions r
      where r.setting_domain = 'faq' and r.record_id = sq.id
    )
    union all
    select 'global'::text, id, row_to_json(sg)::jsonb
    from public.storefront_global_content sg
    where not exists (
      select 1
      from public.storefront_site_setting_revisions r
      where r.setting_domain = 'global' and r.record_id = sg.id
    )
  ),
  inserted as (
    insert into public.storefront_site_setting_revisions (
      setting_domain,
      record_id,
      revision_number,
      event,
      payload,
      changed_email,
      created_at
    )
    select
      setting_domain,
      record_id,
      1,
      'insert',
      payload,
      null,
      now()
    from settings_to_insert
    returning 1
  )
  select count(*) into inserted_settings from inserted;

  return coalesce(inserted_courses, 0) + coalesce(inserted_settings, 0);
end;
$$;

-- Recommended after running this migration:
-- select public.initialize_storefront_revision_history();

commit;
