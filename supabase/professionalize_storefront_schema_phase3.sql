-- Professionalization phase 3
-- Focus:
-- - split storefront_global_content into bounded settings tables
-- - preserve backward compatibility with existing global-content reads/writes
-- - backfill dedicated settings tables from the current singleton row

begin;

create table if not exists public.storefront_brand_settings (
  id int2 primary key default 1 check (id = 1),
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

create table if not exists public.storefront_theme_settings (
  id int2 primary key default 1 check (id = 1),
  primary_color text,
  primary_light_color text,
  secondary_color text,
  accent_color text,
  dark_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storefront_footer_settings (
  id int2 primary key default 1 check (id = 1),
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
  id int2 primary key default 1 check (id = 1),
  faqs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_storefront_brand_settings_set_updated_at on public.storefront_brand_settings;
create trigger trg_storefront_brand_settings_set_updated_at
before update on public.storefront_brand_settings
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_storefront_theme_settings_set_updated_at on public.storefront_theme_settings;
create trigger trg_storefront_theme_settings_set_updated_at
before update on public.storefront_theme_settings
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_storefront_footer_settings_set_updated_at on public.storefront_footer_settings;
create trigger trg_storefront_footer_settings_set_updated_at
before update on public.storefront_footer_settings
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_storefront_faq_settings_set_updated_at on public.storefront_faq_settings;
create trigger trg_storefront_faq_settings_set_updated_at
before update on public.storefront_faq_settings
for each row execute function public.set_row_updated_at();

create or replace function public.sync_storefront_global_content_to_bounded_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.storefront_brand_settings (
    id,
    nav_title,
    full_title,
    footer_tagline,
    shop_label,
    shop_href,
    support_email,
    profile_image_url,
    profile_image_alt,
    profile_role_label
  )
  values (
    new.id,
    new.brand_nav_title,
    new.brand_full_title,
    new.brand_footer_tagline,
    new.brand_shop_label,
    new.brand_shop_href,
    new.brand_support_email,
    new.profile_image_url,
    new.profile_image_alt,
    new.profile_role_label
  )
  on conflict (id) do update
  set nav_title = excluded.nav_title,
      full_title = excluded.full_title,
      footer_tagline = excluded.footer_tagline,
      shop_label = excluded.shop_label,
      shop_href = excluded.shop_href,
      support_email = excluded.support_email,
      profile_image_url = excluded.profile_image_url,
      profile_image_alt = excluded.profile_image_alt,
      profile_role_label = excluded.profile_role_label,
      updated_at = now();

  insert into public.storefront_theme_settings (
    id,
    primary_color,
    primary_light_color,
    secondary_color,
    accent_color,
    dark_color
  )
  values (
    new.id,
    new.theme_primary,
    new.theme_primary_light,
    new.theme_secondary,
    new.theme_accent,
    new.theme_dark
  )
  on conflict (id) do update
  set primary_color = excluded.primary_color,
      primary_light_color = excluded.primary_light_color,
      secondary_color = excluded.secondary_color,
      accent_color = excluded.accent_color,
      dark_color = excluded.dark_color,
      updated_at = now();

  insert into public.storefront_footer_settings (
    id,
    intro_eyebrow,
    intro_heading,
    status_label,
    terms_label,
    terms_href,
    privacy_label,
    privacy_href,
    newsletter_form_action
  )
  values (
    new.id,
    new.footer_intro_eyebrow,
    new.footer_intro_heading,
    new.footer_status_label,
    new.footer_terms_label,
    new.footer_terms_href,
    new.footer_privacy_label,
    new.footer_privacy_href,
    new.newsletter_form_action
  )
  on conflict (id) do update
  set intro_eyebrow = excluded.intro_eyebrow,
      intro_heading = excluded.intro_heading,
      status_label = excluded.status_label,
      terms_label = excluded.terms_label,
      terms_href = excluded.terms_href,
      privacy_label = excluded.privacy_label,
      privacy_href = excluded.privacy_href,
      newsletter_form_action = excluded.newsletter_form_action,
      updated_at = now();

  insert into public.storefront_faq_settings (
    id,
    faqs
  )
  values (
    new.id,
    coalesce(new.faqs, '[]'::jsonb)
  )
  on conflict (id) do update
  set faqs = excluded.faqs,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_storefront_global_content_sync_bounded_settings on public.storefront_global_content;
create trigger trg_storefront_global_content_sync_bounded_settings
after insert or update on public.storefront_global_content
for each row execute function public.sync_storefront_global_content_to_bounded_settings();

insert into public.storefront_brand_settings (
  id,
  nav_title,
  full_title,
  footer_tagline,
  shop_label,
  shop_href,
  support_email,
  profile_image_url,
  profile_image_alt,
  profile_role_label
)
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
  profile_role_label
from public.storefront_global_content
on conflict (id) do update
set nav_title = excluded.nav_title,
    full_title = excluded.full_title,
    footer_tagline = excluded.footer_tagline,
    shop_label = excluded.shop_label,
    shop_href = excluded.shop_href,
    support_email = excluded.support_email,
    profile_image_url = excluded.profile_image_url,
    profile_image_alt = excluded.profile_image_alt,
    profile_role_label = excluded.profile_role_label,
    updated_at = now();

insert into public.storefront_theme_settings (
  id,
  primary_color,
  primary_light_color,
  secondary_color,
  accent_color,
  dark_color
)
select
  id,
  theme_primary,
  theme_primary_light,
  theme_secondary,
  theme_accent,
  theme_dark
from public.storefront_global_content
on conflict (id) do update
set primary_color = excluded.primary_color,
    primary_light_color = excluded.primary_light_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    dark_color = excluded.dark_color,
    updated_at = now();

insert into public.storefront_footer_settings (
  id,
  intro_eyebrow,
  intro_heading,
  status_label,
  terms_label,
  terms_href,
  privacy_label,
  privacy_href,
  newsletter_form_action
)
select
  id,
  footer_intro_eyebrow,
  footer_intro_heading,
  footer_status_label,
  footer_terms_label,
  footer_terms_href,
  footer_privacy_label,
  footer_privacy_href,
  newsletter_form_action
from public.storefront_global_content
on conflict (id) do update
set intro_eyebrow = excluded.intro_eyebrow,
    intro_heading = excluded.intro_heading,
    status_label = excluded.status_label,
    terms_label = excluded.terms_label,
    terms_href = excluded.terms_href,
    privacy_label = excluded.privacy_label,
    privacy_href = excluded.privacy_href,
    newsletter_form_action = excluded.newsletter_form_action,
    updated_at = now();

insert into public.storefront_faq_settings (
  id,
  faqs
)
select
  id,
  coalesce(faqs, '[]'::jsonb)
from public.storefront_global_content
on conflict (id) do update
set faqs = excluded.faqs,
    updated_at = now();

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

commit;
