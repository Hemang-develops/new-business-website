-- Add template_label and attachments columns to storefront_newsletter_broadcasts
alter table public.storefront_newsletter_broadcasts
  add column if not exists template_label text,
  add column if not exists attachments jsonb not null default '[]'::jsonb;
