-- Restore site settings composed view for app compatibility
-- This view aliases Phase 6 normalized tables to match app expectations
-- The app uses this as a unified settings interface

begin;

create or replace view public.storefront_site_settings_composed_v as
select
  bs.id,
  bs.brand_name as brand_nav_title,
  bs.brand_name as brand_full_title,
  ss.footer_content as brand_footer_tagline,
  'Shop' as brand_shop_label,
  '/shop' as brand_shop_href,
  'support@example.com' as brand_support_email,
  bs.primary_color as theme_primary,
  bs.primary_color as theme_primary_light,
  bs.secondary_color as theme_secondary,
  bs.secondary_color as theme_accent,
  '#000000' as theme_dark,
  null as profile_image_url,
  null as profile_image_alt,
  null as profile_role_label,
  'Our Mission' as footer_intro_eyebrow,
  'Welcome' as footer_intro_heading,
  'Status' as footer_status_label,
  'Terms' as footer_terms_label,
  '/terms' as footer_terms_href,
  'Privacy' as footer_privacy_label,
  '/privacy' as footer_privacy_href,
  ss.newsletter_signup_text as newsletter_form_action,
  '[]'::jsonb as faqs,
  greatest(
    coalesce(bs.updated_at, '-infinity'::timestamptz),
    coalesce(ss.updated_at, '-infinity'::timestamptz)
  ) as updated_at
from public.storefront_brand_settings bs
join public.storefront_site_settings ss on ss.id = bs.id
where bs.id = 1;

grant select on public.storefront_site_settings_composed_v to authenticated;

commit;
