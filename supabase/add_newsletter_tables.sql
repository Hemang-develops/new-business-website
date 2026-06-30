-- Create canonical newsletter subscription and broadcast tables

create table if not exists storefront_newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null,
  user_id uuid,
  source text not null default 'newsletter_section',
  metadata jsonb default '{}'::jsonb,
  status text not null default 'subscribed',
  is_confirmed boolean not null default true,
  confirmed_at timestamp with time zone,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists storefront_newsletter_subscriptions_normalized_email_idx
  on storefront_newsletter_subscriptions (normalized_email);

create table if not exists storefront_newsletter_broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience text not null default 'all',
  status text not null default 'queued',
  scheduled_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  stats jsonb default jsonb_build_object('sent', 0, 'failed', 0, 'recipients', 0)
);
