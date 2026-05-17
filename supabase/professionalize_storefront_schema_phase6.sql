-- Professionalization phase 6
-- Focus:
-- - split storefront_global_content god table into domain-specific tables
-- - normalize FAQ and success story storage
-- - add proper audit triggers to new tables
-- - maintain backward compatibility with existing views

begin;

-- ============================================================================
-- 0. Utility Functions
-- ============================================================================

create or replace function public.update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. Brand and Theme Settings Table
-- ============================================================================

drop table if exists public.storefront_brand_settings cascade;

create table if not exists public.storefront_brand_settings (
   id smallint primary key default 1 check (id = 1),
   brand_name text default 'Spiritual Sanctuary',
   tagline text default 'Guidance for Your Divine Path',
   logo_url text,
   primary_color text default '#6366f1',
   secondary_color text default '#ec4899',
   font_family text default 'system-ui, sans-serif',
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now(),
   updated_by uuid
);

create trigger storefront_brand_settings_updated_at
  before update on public.storefront_brand_settings
  for each row
  execute function public.update_timestamp();

alter table public.storefront_brand_settings enable row level security;

create policy "Admins manage brand settings"
  on public.storefront_brand_settings
  for all
  using (public.is_storefront_admin());

-- Initialize brand settings with defaults
insert into public.storefront_brand_settings (id)
values (1)
on conflict (id) do nothing;

-- ============================================================================
-- 2. Site Settings Table (split from global_content, with defaults)
-- ============================================================================

drop table if exists public.storefront_site_settings cascade;

create table if not exists public.storefront_site_settings (
   id smallint primary key default 1 check (id = 1),
   manual_instructions text[] not null default '{}'::text[],
   legal_notes text[] not null default '{}'::text[],
   closing_notes text[] not null default '{}'::text[],
   footer_content text,
   newsletter_signup_text text default 'Subscribe to receive guidance and updates.',
   newsletter_success_message text default 'Thank you for subscribing to our spiritual community.',
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now(),
   updated_by uuid
);

create trigger storefront_site_settings_updated_at
  before update on public.storefront_site_settings
  for each row
  execute function public.update_timestamp();

alter table public.storefront_site_settings enable row level security;

create policy "Admins manage site settings"
  on public.storefront_site_settings
  for all
  using (public.is_storefront_admin());

-- Migrate existing data from global_content if it exists
insert into public.storefront_site_settings (
  id,
  manual_instructions,
  legal_notes,
  closing_notes,
  updated_by
)
select
  1,
  coalesce(manual_instructions, '{}'::text[]),
  coalesce(legal_notes, '{}'::text[]),
  coalesce(closing_notes, '{}'::text[]),
  null
from public.storefront_global_content
where id = 1
on conflict (id) do nothing;

-- If global_content doesn't have a row, initialize site_settings with defaults
insert into public.storefront_site_settings (id)
values (1)
on conflict (id) do nothing;

-- ============================================================================
-- 3. FAQ Entries Table (split from global_content)
-- ============================================================================

drop table if exists public.storefront_faq_entries cascade;

create table if not exists public.storefront_faq_entries (
   id uuid primary key default gen_random_uuid(),
   category text not null default 'general',
   question text not null,
   answer text not null,
   sort_order int not null default 0,
   is_active boolean not null default true,
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now(),
   updated_by uuid
);

alter table public.storefront_faq_entries enable row level security;

create policy "Authenticated users read active FAQs"
  on public.storefront_faq_entries
  for select
  using (is_active = true);

create policy "Admins read all FAQs"
  on public.storefront_faq_entries
  for select
  using (public.is_storefront_admin());

create policy "Admins manage FAQs"
  on public.storefront_faq_entries
  for all
  using (public.is_storefront_admin());

create index if not exists storefront_faq_entries_category_active_idx
  on public.storefront_faq_entries (category, is_active);

create index if not exists storefront_faq_entries_sort_order_idx
  on public.storefront_faq_entries (sort_order);

create trigger storefront_faq_entries_updated_at
  before update on public.storefront_faq_entries
  for each row
  execute function public.update_timestamp();

-- ============================================================================
-- 4. Success Stories Table (split from offerings)
-- ============================================================================

drop table if exists public.storefront_success_stories cascade;

create table if not exists public.storefront_success_stories (
   id uuid primary key default gen_random_uuid(),
   offering_id text,  -- Nullable to allow orphaned stories during transitions
   quote text not null,
   author text not null,
   context text,
   sort_order int not null default 0,
   is_active boolean not null default true,
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now(),
   updated_by uuid
   -- Note: No foreign key constraint to allow flexible data entry and cleanup
);

alter table public.storefront_success_stories enable row level security;

create policy "Authenticated users read active success stories"
  on public.storefront_success_stories
  for select
  using (is_active = true);

create policy "Admins read all success stories"
  on public.storefront_success_stories
  for select
  using (public.is_storefront_admin());

create policy "Admins manage success stories"
  on public.storefront_success_stories
  for all
  using (public.is_storefront_admin());

create index if not exists storefront_success_stories_offering_active_idx
  on public.storefront_success_stories (offering_id, is_active)
  where is_active = true;

create index if not exists storefront_success_stories_sort_order_idx
  on public.storefront_success_stories (sort_order);

create trigger storefront_success_stories_updated_at
  before update on public.storefront_success_stories
  for each row
  execute function public.update_timestamp();

-- ============================================================================
-- 5. Views for backward compatibility
-- ============================================================================

create or replace view public.storefront_faq_list_v as
select
  id,
  category,
  question,
  answer,
  sort_order
from public.storefront_faq_entries
where is_active = true
order by category, sort_order;

create or replace view public.storefront_success_stories_by_offering_v as
select
  sso.id,
  sso.offering_id,
  coalesce(so.title, 'Standalone Story') as offering_title,
  sso.quote,
  sso.author,
  sso.context,
  sso.sort_order
from public.storefront_success_stories sso
left join public.storefront_offerings so on so.id = sso.offering_id
where sso.is_active = true
order by
  case when sso.offering_id is not null then 0 else 1 end,
  sso.offering_id,
  sso.sort_order;

-- ============================================================================
-- 6. Aggregated Site Settings View (for app use)
-- ============================================================================

create or replace view public.storefront_site_settings_v as
select
  coalesce(ss.manual_instructions, '{}'::text[]) as manual_instructions,
  coalesce(ss.legal_notes, '{}'::text[]) as legal_notes,
  coalesce(ss.closing_notes, '{}'::text[]) as closing_notes,
  ss.footer_content,
  coalesce(ss.newsletter_signup_text, 'Subscribe to receive guidance and updates.') as newsletter_signup_text,
  coalesce(ss.newsletter_success_message, 'Thank you for subscribing to our spiritual community.') as newsletter_success_message,
  coalesce(bs.brand_name, 'Spiritual Sanctuary') as brand_name,
  coalesce(bs.tagline, 'Guidance for Your Divine Path') as tagline,
  bs.logo_url,
  coalesce(bs.primary_color, '#6366f1') as primary_color,
  coalesce(bs.secondary_color, '#ec4899') as secondary_color,
  coalesce(bs.font_family, 'system-ui, sans-serif') as font_family,
  coalesce(ss.updated_at, now()) as settings_updated_at,
  coalesce(bs.updated_at, now()) as branding_updated_at
from (select * from public.storefront_site_settings where id = 1 limit 1) ss
full outer join (select * from public.storefront_brand_settings where id = 1 limit 1) bs on true;

-- ============================================================================
-- 6. Admin Management Views
-- ============================================================================

create or replace view public.storefront_settings_admin_v as
select
   'Site Settings' as setting_type,
   1 as setting_id,
   ss.newsletter_signup_text as current_value,
   ss.updated_at,
   'system@localtest.com' as last_updated_by
from public.storefront_site_settings ss
where ss.id = 1

union all

select
   'Brand',
   bs.id,
   bs.brand_name,
   bs.updated_at,
   'system@localtest.com'
from public.storefront_brand_settings bs
where bs.id = 1;

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

grant select on public.storefront_brand_settings to authenticated;
grant select on public.storefront_site_settings to authenticated;
grant select on public.storefront_faq_entries to authenticated;
grant select on public.storefront_success_stories to authenticated;
grant select on public.storefront_faq_list_v to authenticated;
grant select on public.storefront_success_stories_by_offering_v to authenticated;
grant select on public.storefront_site_settings_v to authenticated;
grant select on public.storefront_settings_admin_v to authenticated;

commit;

-- ============================================================================
-- Post-Migration Checklist
-- ============================================================================
--
-- 1. VERIFY INITIALIZATION:
--    select * from public.storefront_brand_settings;
--    select * from public.storefront_site_settings;
--
-- 2. TEST VIEWS:
--    select * from public.storefront_site_settings_v;
--    select * from public.storefront_faq_list_v;
--    select * from public.storefront_success_stories_by_offering_v;
--
-- 3. UPDATE APPLICATION TO USE NEW TABLES:
--    - Replace references to storefront_global_content.newsletter_signup_text
--      with queries to storefront_site_settings
--    - Update brand/logo display to use storefront_brand_settings
--
-- 4. BACKFILL SUCCESS STORIES (Optional):
--    If you have success_story JSONB data in storefront_offerings:
--    INSERT INTO public.storefront_success_stories (offering_id, quote, author)
--    SELECT id, (success_story->>'quote'), (success_story->>'author')
--    FROM public.storefront_offerings
--    WHERE success_story IS NOT NULL;
--
-- 5. DEPRECATION TIMELINE:
--    Phase 6: New tables coexist with storefront_global_content
--    Phase 6+3 months: Fully migrate app code
--    Phase 6+6 months: Archive/deprecate storefront_global_content
