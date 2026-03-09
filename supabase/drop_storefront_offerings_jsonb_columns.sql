-- Run only after your app is reading child tables in production.
-- This removes legacy JSONB columns from storefront_offerings.

begin;

alter table public.storefront_offerings
  drop column if exists highlights,
  drop column if exists payment_methods,
  drop column if exists price_details,
  drop column if exists manual_instructions,
  drop column if exists legal_notes,
  drop column if exists details_sections,
  drop column if exists closing_notes,
  drop column if exists success_story,
  drop column if exists checkout_options,
  drop column if exists purchase,
  drop column if exists manual_support,
  drop column if exists price;

commit;
