-- Add fine-grained segmentation support to newsletters
-- Enables targeting specific courses and meetings within buyer/meeting lead audiences

begin;

-- Add audience_segment column to storefront_newsletter_broadcasts
-- Format: "course:{course_id}" or "offering:{offering_id}" for granular targeting
alter table if exists public.storefront_newsletter_broadcasts
  add column if not exists audience_segment text;

comment on column public.storefront_newsletter_broadcasts.audience_segment is
  'Fine-grained audience filter in format "course:{id}" or "offering:{id}". If set, overrides the generic audience field.';

commit;
