-- Canonical storefront settings schema
-- Run this after older phase migrations to converge the database onto the
-- schema the React storefront and admin UI use in production.

begin;

create or replace function public.update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.storefront_brand_settings (
  id smallint primary key default 1 check (id = 1),
  nav_title text,
  full_title text,
  footer_tagline text,
  shop_label text,
  shop_href text,
  support_email text,
  profile_image_url text,
  profile_image_alt text,
  profile_role_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.storefront_brand_settings
  add column if not exists nav_title text,
  add column if not exists full_title text,
  add column if not exists footer_tagline text,
  add column if not exists shop_label text,
  add column if not exists shop_href text,
  add column if not exists support_email text,
  add column if not exists profile_image_url text,
  add column if not exists profile_image_alt text,
  add column if not exists profile_role_label text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.storefront_theme_settings (
  id smallint primary key default 1 check (id = 1),
  primary_color text,
  primary_light_color text,
  secondary_color text,
  accent_color text,
  dark_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storefront_footer_settings (
  id smallint primary key default 1 check (id = 1),
  intro_eyebrow text,
  intro_heading text,
  status_label text,
  terms_label text,
  terms_href text,
  privacy_label text,
  privacy_href text,
  newsletter_form_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storefront_faq_settings (
  id smallint primary key default 1 check (id = 1),
  faqs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storefront_site_sections (
  key text primary key,
  label text not null,
  anchor text not null,
  is_enabled boolean not null default true,
  show_in_nav boolean not null default false,
  show_in_footer boolean not null default false,
  sort_order integer not null default 0,
  eyebrow text,
  heading text,
  description text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  supporting_eyebrow text,
  supporting_heading text,
  supporting_description text,
  form_heading text,
  form_description text,
  form_submit_label text,
  form_disclaimer text,
  form_action text,
  featured_offering_id text
);

alter table public.storefront_site_sections
  add column if not exists supporting_eyebrow text,
  add column if not exists supporting_heading text,
  add column if not exists supporting_description text,
  add column if not exists form_heading text,
  add column if not exists form_description text,
  add column if not exists form_submit_label text,
  add column if not exists form_disclaimer text,
  add column if not exists form_action text,
  add column if not exists featured_offering_id text;

create table if not exists public.storefront_site_section_items (
  key text primary key,
  section_key text not null references public.storefront_site_sections(key) on delete cascade,
  item_type text not null default 'card',
  title text,
  description text,
  label text,
  href text,
  icon text,
  image_url text,
  image_alt text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true
);

create table if not exists public.storefront_site_links (
  key text primary key,
  group_key text not null,
  label text not null,
  value text,
  href text,
  icon text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true
);

insert into public.storefront_brand_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.storefront_theme_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.storefront_footer_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.storefront_faq_settings (id)
values (1)
on conflict (id) do nothing;

-- Carry forward legacy storefront_global_content values when present.
do $$
declare
  has_global_settings boolean;
begin
  select to_regclass('public.storefront_global_content') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'storefront_global_content'
        and column_name = 'brand_nav_title'
    )
  into has_global_settings;

  if has_global_settings then
    execute $sql$
      update public.storefront_brand_settings b
      set
        nav_title = coalesce(b.nav_title, g.brand_nav_title),
        full_title = coalesce(b.full_title, g.brand_full_title),
        footer_tagline = coalesce(b.footer_tagline, g.brand_footer_tagline),
        shop_label = coalesce(b.shop_label, g.brand_shop_label),
        shop_href = coalesce(b.shop_href, g.brand_shop_href),
        support_email = coalesce(b.support_email, g.brand_support_email),
        profile_image_url = coalesce(b.profile_image_url, g.profile_image_url),
        profile_image_alt = coalesce(b.profile_image_alt, g.profile_image_alt),
        profile_role_label = coalesce(b.profile_role_label, g.profile_role_label)
      from public.storefront_global_content g
      where b.id = 1 and g.id = 1
    $sql$;

    execute $sql$
      update public.storefront_theme_settings t
      set
        primary_color = coalesce(t.primary_color, g.theme_primary),
        primary_light_color = coalesce(t.primary_light_color, g.theme_primary_light),
        secondary_color = coalesce(t.secondary_color, g.theme_secondary),
        accent_color = coalesce(t.accent_color, g.theme_accent),
        dark_color = coalesce(t.dark_color, g.theme_dark)
      from public.storefront_global_content g
      where t.id = 1 and g.id = 1
    $sql$;

    execute $sql$
      update public.storefront_footer_settings f
      set
        intro_eyebrow = coalesce(f.intro_eyebrow, g.footer_intro_eyebrow),
        intro_heading = coalesce(f.intro_heading, g.footer_intro_heading),
        status_label = coalesce(f.status_label, g.footer_status_label),
        terms_label = coalesce(f.terms_label, g.footer_terms_label),
        terms_href = coalesce(f.terms_href, g.footer_terms_href),
        privacy_label = coalesce(f.privacy_label, g.footer_privacy_label),
        privacy_href = coalesce(f.privacy_href, g.footer_privacy_href),
        newsletter_form_action = coalesce(f.newsletter_form_action, g.newsletter_form_action)
      from public.storefront_global_content g
      where f.id = 1 and g.id = 1
    $sql$;

    execute $sql$
      update public.storefront_faq_settings q
      set faqs = coalesce(q.faqs, g.faqs, '[]'::jsonb)
      from public.storefront_global_content g
      where q.id = 1 and g.id = 1
    $sql$;
  end if;
end $$;

-- Carry forward compact phase-6 values when those columns exist.
do $$
declare
  has_brand_name boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'storefront_brand_settings'
      and column_name = 'brand_name'
  ) into has_brand_name;

  if has_brand_name then
    execute $sql$
      update public.storefront_brand_settings
      set
        nav_title = coalesce(nav_title, brand_name),
        full_title = coalesce(full_title, brand_name),
        footer_tagline = coalesce(footer_tagline, tagline),
        profile_image_url = coalesce(profile_image_url, logo_url)
      where id = 1
    $sql$;
  end if;
end $$;

drop trigger if exists storefront_brand_settings_updated_at on public.storefront_brand_settings;
create trigger storefront_brand_settings_updated_at
  before update on public.storefront_brand_settings
  for each row execute function public.update_timestamp();

drop trigger if exists storefront_theme_settings_updated_at on public.storefront_theme_settings;
create trigger storefront_theme_settings_updated_at
  before update on public.storefront_theme_settings
  for each row execute function public.update_timestamp();

drop trigger if exists storefront_footer_settings_updated_at on public.storefront_footer_settings;
create trigger storefront_footer_settings_updated_at
  before update on public.storefront_footer_settings
  for each row execute function public.update_timestamp();

drop trigger if exists storefront_faq_settings_updated_at on public.storefront_faq_settings;
create trigger storefront_faq_settings_updated_at
  before update on public.storefront_faq_settings
  for each row execute function public.update_timestamp();

create or replace view public.storefront_site_settings_composed_v as
select
  b.id,
  b.nav_title as brand_nav_title,
  b.full_title as brand_full_title,
  b.footer_tagline as brand_footer_tagline,
  b.shop_label as brand_shop_label,
  b.shop_href as brand_shop_href,
  b.support_email as brand_support_email,
  t.primary_color as theme_primary,
  t.primary_light_color as theme_primary_light,
  t.secondary_color as theme_secondary,
  t.accent_color as theme_accent,
  t.dark_color as theme_dark,
  b.profile_image_url,
  b.profile_image_alt,
  b.profile_role_label,
  f.intro_eyebrow as footer_intro_eyebrow,
  f.intro_heading as footer_intro_heading,
  f.status_label as footer_status_label,
  f.terms_label as footer_terms_label,
  f.terms_href as footer_terms_href,
  f.privacy_label as footer_privacy_label,
  f.privacy_href as footer_privacy_href,
  f.newsletter_form_action,
  q.faqs,
  greatest(
    coalesce(b.updated_at, '-infinity'::timestamptz),
    coalesce(t.updated_at, '-infinity'::timestamptz),
    coalesce(f.updated_at, '-infinity'::timestamptz),
    coalesce(q.updated_at, '-infinity'::timestamptz)
  ) as updated_at
from public.storefront_brand_settings b
join public.storefront_theme_settings t on t.id = b.id
join public.storefront_footer_settings f on f.id = b.id
join public.storefront_faq_settings q on q.id = b.id;

alter table public.storefront_brand_settings enable row level security;
alter table public.storefront_theme_settings enable row level security;
alter table public.storefront_footer_settings enable row level security;
alter table public.storefront_faq_settings enable row level security;
alter table public.storefront_site_sections enable row level security;
alter table public.storefront_site_section_items enable row level security;
alter table public.storefront_site_links enable row level security;

drop policy if exists "Public read brand settings" on public.storefront_brand_settings;
create policy "Public read brand settings"
  on public.storefront_brand_settings for select
  using (true);

drop policy if exists "Admins manage brand settings" on public.storefront_brand_settings;
create policy "Admins manage brand settings"
  on public.storefront_brand_settings for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read theme settings" on public.storefront_theme_settings;
create policy "Public read theme settings"
  on public.storefront_theme_settings for select
  using (true);

drop policy if exists "Admins manage theme settings" on public.storefront_theme_settings;
create policy "Admins manage theme settings"
  on public.storefront_theme_settings for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read footer settings" on public.storefront_footer_settings;
create policy "Public read footer settings"
  on public.storefront_footer_settings for select
  using (true);

drop policy if exists "Admins manage footer settings" on public.storefront_footer_settings;
create policy "Admins manage footer settings"
  on public.storefront_footer_settings for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read faq settings" on public.storefront_faq_settings;
create policy "Public read faq settings"
  on public.storefront_faq_settings for select
  using (true);

drop policy if exists "Admins manage faq settings" on public.storefront_faq_settings;
create policy "Admins manage faq settings"
  on public.storefront_faq_settings for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read site sections" on public.storefront_site_sections;
create policy "Public read site sections"
  on public.storefront_site_sections for select
  using (true);

drop policy if exists "Admins manage site sections" on public.storefront_site_sections;
create policy "Admins manage site sections"
  on public.storefront_site_sections for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read site section items" on public.storefront_site_section_items;
create policy "Public read site section items"
  on public.storefront_site_section_items for select
  using (true);

drop policy if exists "Admins manage site section items" on public.storefront_site_section_items;
create policy "Admins manage site section items"
  on public.storefront_site_section_items for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

drop policy if exists "Public read site links" on public.storefront_site_links;
create policy "Public read site links"
  on public.storefront_site_links for select
  using (true);

drop policy if exists "Admins manage site links" on public.storefront_site_links;
create policy "Admins manage site links"
  on public.storefront_site_links for all
  using (public.is_storefront_admin())
  with check (public.is_storefront_admin());

grant select on public.storefront_site_settings_composed_v to anon, authenticated;
grant select on public.storefront_site_sections to anon, authenticated;
grant select on public.storefront_site_section_items to anon, authenticated;
grant select on public.storefront_site_links to anon, authenticated;
grant select on public.storefront_brand_settings to anon, authenticated;
grant select on public.storefront_theme_settings to anon, authenticated;
grant select on public.storefront_footer_settings to anon, authenticated;
grant select on public.storefront_faq_settings to anon, authenticated;
grant insert, update, delete on public.storefront_brand_settings to authenticated;
grant insert, update, delete on public.storefront_theme_settings to authenticated;
grant insert, update, delete on public.storefront_footer_settings to authenticated;
grant insert, update, delete on public.storefront_faq_settings to authenticated;
grant insert, update, delete on public.storefront_site_sections to authenticated;
grant insert, update, delete on public.storefront_site_section_items to authenticated;
grant insert, update, delete on public.storefront_site_links to authenticated;

commit;
