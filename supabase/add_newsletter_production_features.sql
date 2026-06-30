-- Production newsletter features:
-- - Permanent per-broadcast recipients with delivery status
-- - Global marketing unsubscribe/suppression
-- - Secure unsubscribe tokens
-- - Editable block/template metadata on broadcasts

begin;

alter table if exists public.storefront_newsletter_broadcasts
  add column if not exists body_blocks jsonb not null default '[]'::jsonb,
  add column if not exists template_key text not null default 'weekly_letter',
  add column if not exists preview_text text,
  add column if not exists dispatched_at timestamp with time zone,
  add column if not exists retry_of uuid references public.storefront_newsletter_broadcasts(id) on delete set null;

create table if not exists public.storefront_newsletter_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null,
  reason text not null default 'unsubscribe',
  source text not null default 'unsubscribe_link',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists storefront_newsletter_suppressions_normalized_email_idx
  on public.storefront_newsletter_suppressions (normalized_email);

create table if not exists public.storefront_newsletter_unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null,
  token text not null,
  source text,
  broadcast_id uuid references public.storefront_newsletter_broadcasts(id) on delete set null,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists storefront_newsletter_unsubscribe_tokens_token_idx
  on public.storefront_newsletter_unsubscribe_tokens (token);

create index if not exists storefront_newsletter_unsubscribe_tokens_email_idx
  on public.storefront_newsletter_unsubscribe_tokens (normalized_email);

create table if not exists public.storefront_newsletter_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.storefront_newsletter_broadcasts(id) on delete cascade,
  email text not null,
  normalized_email text not null,
  source text not null default 'newsletter',
  status text not null default 'pending',
  resend_email_id text,
  unsubscribe_token text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint storefront_newsletter_recipients_status_check
    check (status in ('pending', 'sent', 'failed', 'skipped_unsubscribed'))
);

create unique index if not exists storefront_newsletter_recipients_broadcast_email_idx
  on public.storefront_newsletter_recipients (broadcast_id, normalized_email);

create index if not exists storefront_newsletter_recipients_broadcast_status_idx
  on public.storefront_newsletter_recipients (broadcast_id, status);

comment on table public.storefront_newsletter_recipients is
  'Permanent audit log of every email considered for each newsletter broadcast, with per-recipient delivery status.';

comment on table public.storefront_newsletter_suppressions is
  'Global marketing unsubscribe list. Transactional purchase, booking, and access emails should ignore this table.';

commit;
