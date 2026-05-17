-- Professionalization phase 9
-- Focus:
-- - provide application integration helpers for new read models
-- - create convenient endpoints and views for admin dashboards
-- - document TypeScript integration patterns
-- - provide example queries for common admin operations

-- Note: This file primarily documents application integration patterns.
-- It includes some utility SQL views and functions for the app.

begin;

-- ============================================================================
-- 1. Admin Dashboard Summary View
-- ============================================================================

create or replace view public.storefront_admin_dashboard_summary_v as
select
  -- Overall stats
  (select count(*) from auth.users) as total_users,
  (select count(*) from public.storefront_offerings where is_active = true) as total_offerings,
  (select count(*) from public.storefront_courses where is_active = true) as total_courses,
  
  -- Recent activity
  (select count(*) from public.storefront_course_access where created_at > now() - interval '7 days') as new_purchases_7d,
  (select count(*) from public.storefront_user_course_progress where completed_at > now() - interval '7 days') as completions_7d,
  (select sum(amount) from public.storefront_course_access where created_at > now() - interval '30 days' and payment_provider is not null) as revenue_30d,
  
  -- Content metrics
  (select count(*) from public.storefront_course_revisions where created_at > now() - interval '30 days') as content_changes_30d,
  (select count(*) from public.storefront_site_setting_revisions where created_at > now() - interval '30 days') as settings_changes_30d,
  
  -- User engagement
  (select avg(coalesce(total_course_accesses, 0)) from public.storefront_user_profile_summary_mv) as avg_courses_per_user,
  (select avg(coalesce(avg_course_progress, 0)) from public.storefront_user_profile_summary_mv where avg_course_progress > 0) as avg_user_progress;

-- ============================================================================
-- 2. Offering Performance Analytics View
-- ============================================================================

create or replace view public.storefront_offering_performance_analytics_v as
select
  so.id as offering_id,
  so.title,
  so.price_usd,
  -- Sales metrics
  coalesce(sales.total_sales, 0) as total_sales,
  coalesce(sales.total_revenue, 0) as total_revenue,
  coalesce(sales.avg_sale_price, 0) as avg_sale_price,
  
  -- Conversion & engagement
  coalesce(access.total_accesses, 0) as total_accesses,
  case 
    when coalesce(impressions.total_views, 0) > 0 then 
      round((coalesce(access.total_accesses, 0)::numeric / impressions.total_views::numeric) * 100, 2)
    else 0
  end as conversion_rate,
  
  -- Course-specific metrics
  case when so.cta_type = 'course' then
    (
      select round(avg(progress_percentage), 1)
      from public.storefront_user_course_summary_v
      where offering_id = so.id
    )
  else null end as avg_course_progress,
  
  case when so.cta_type = 'course' then
    (
      select count(*)
      from public.storefront_user_course_summary_v
      where offering_id = so.id and course_status = 'completed'
    )
  else 0 end as courses_completed,
  
  -- Recency
  (select max(created_at) from public.storefront_course_access where offering_id = so.id) as last_purchase_at,
  so.updated_at as last_updated_at
  
from public.storefront_offerings so
left join (
  select
    offering_id,
    count(*) as total_sales,
    sum(amount) as total_revenue,
    avg(amount) as avg_sale_price
  from public.storefront_course_access
  where payment_provider is not null
  group by offering_id
) sales on sales.offering_id = so.id
left join (
  select offering_id, count(*) as total_accesses
  from public.storefront_course_access
  group by offering_id
) access on access.offering_id = so.id
left join (
  select offering_id, count(*) as total_views
  from public.storefront_user_course_summary_v
  group by offering_id
) impressions on impressions.offering_id = so.id;

-- ============================================================================
-- 3. User Learning Path View
-- ============================================================================

create or replace view public.storefront_user_learning_path_v as
select
  u.id as user_id,
  u.email,
  u.created_at as user_joined_at,
  -- Enrollment summary
  coalesce(access.total_courses, 0) as total_enrolled,
  coalesce(access.completed_courses, 0) as total_completed,
  coalesce(access.in_progress_courses, 0) as currently_learning,
  
  -- Engagement metrics
  coalesce(progress.total_items_completed, 0) as lifetime_items_completed,
  coalesce(progress.avg_progress, 0) as avg_course_progress,
  coalesce(progress.last_activity_at, u.created_at) as last_activity_at,
  
  -- Achievement summary
  coalesce(achievements.total_badges, 0) as total_achievements,
  
  -- Financial summary
  coalesce(financial.total_spent, 0) as total_spent,
  coalesce(financial.purchase_count, 0) as purchases_made,
  
  -- Status
  case
    when coalesce(progress.last_activity_at, u.created_at) > now() - interval '7 days' then 'active'
    when coalesce(progress.last_activity_at, u.created_at) > now() - interval '30 days' then 'at_risk'
    else 'inactive'
  end as engagement_status
  
from auth.users u
left join (
  select
    user_id,
    count(*) as total_courses,
    count(*) filter (where course_status = 'completed') as completed_courses,
    count(*) filter (where course_status = 'in_progress') as in_progress_courses
  from (
    select
      sca.user_id,
      case
        when sca.revoked_at is not null then 'revoked'
        when sca.expires_at is not null and sca.expires_at < now() then 'expired'
        when coalesce(up.completed_items, 0) = coalesce(sci.total_items, 0) and coalesce(sci.total_items, 0) > 0 then 'completed'
        when coalesce(up.completed_items, 0) > 0 then 'in_progress'
        else 'not_started'
      end as course_status
    from public.storefront_course_access sca
    left join (
      select course_id, user_id, count(*) filter (where completed_at is not null) as completed_items
      from public.storefront_user_course_progress
      group by course_id, user_id
    ) up on up.course_id = sca.course_id and up.user_id = sca.user_id
    left join (
      select course_id, count(*) as total_items
      from public.storefront_course_items
      where is_active = true
      group by course_id
    ) sci on sci.course_id = sca.course_id
  ) course_list
  group by user_id
) access on access.user_id = u.id
left join (
  select
    user_id,
    sum(1) as total_items_completed,
    avg(case when total_items > 0 then (completed_items::decimal / total_items::decimal) * 100 else 0 end) as avg_progress,
    max(completed_at) as last_activity_at
  from (
    select
      up.user_id,
      up.course_id,
      count(*) as total_items,
      count(*) filter (where completed_at is not null) as completed_items,
      max(completed_at) as completed_at
    from public.storefront_user_course_progress up
    group by up.user_id, up.course_id
  ) progress_summary
  group by user_id
) progress on progress.user_id = u.id
left join (
  select user_id, count(*) as total_badges
  from public.storefront_user_achievements_v2
  group by user_id
) achievements on achievements.user_id = u.id
left join (
  select
    user_id,
    sum(amount) as total_spent,
    count(*) as purchase_count
  from (
    select user_id, amount from public.storefront_course_access where payment_provider is not null
    union all
    select user_id, amount from public.storefront_booking_access where payment_provider is not null
  ) all_payments
  group by user_id
) financial on financial.user_id = u.id;

-- ============================================================================
-- 4. Content Audit Trail View
-- ============================================================================

create or replace view public.storefront_content_audit_trail_v as
select
  'course' as content_type,
  scr.course_id::text as content_id,
  sc.title as content_title,
  scr.revision_number,
  scr.changed_by as changed_by_user_id,
  coalesce(au.email, scr.changed_email, scr.changed_by::text) as changed_by,
  scr.change_summary,
  scr.created_at as changed_at,
  scr.revision_number = max_rev.max_revision as is_current,
  scr.payload as change_payload
from public.storefront_course_revisions scr
join public.storefront_courses sc on sc.id = scr.course_id
left join auth.users au on au.id = scr.changed_by
left join (
  select course_id, max(revision_number) as max_revision
  from public.storefront_course_revisions
  group by course_id
) max_rev on max_rev.course_id = scr.course_id

union all

select
  'site_setting' as content_type,
  ssr.record_id::text as content_id,
  'Site Settings' as content_title,
  ssr.revision_number,
  ssr.changed_by as changed_by_user_id,
  coalesce(au.email, ssr.changed_email, ssr.changed_by::text) as changed_by,
  ssr.change_summary,
  ssr.created_at as changed_at,
  ssr.revision_number = max_rev.max_revision as is_current,
  ssr.payload as change_payload
from public.storefront_site_setting_revisions ssr
left join auth.users au on au.id = ssr.changed_by
left join (
  select setting_domain, record_id, max(revision_number) as max_revision
  from public.storefront_site_setting_revisions
  group by setting_domain, record_id
) max_rev on max_rev.setting_domain = ssr.setting_domain and max_rev.record_id = ssr.record_id

order by changed_at desc;

-- ============================================================================
-- 5. Grant Permissions for Views
-- ============================================================================

grant select on public.storefront_admin_dashboard_summary_v to authenticated;
grant select on public.storefront_offering_performance_analytics_v to authenticated;
grant select on public.storefront_user_learning_path_v to authenticated;
grant select on public.storefront_content_audit_trail_v to authenticated;

-- ============================================================================
-- 6. Application Integration Functions
-- ============================================================================

-- Function to get a user's complete profile for admin dashboard
create or replace function public.get_user_admin_profile(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_profile jsonb;
begin
  if not public.is_storefront_admin() then
    raise exception 'Only admins can access user profiles';
  end if;
  
  select jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'created_at', u.created_at,
    'learning_metrics', (
      select to_jsonb(ulp.*)
      from public.storefront_user_learning_path_v ulp
      where ulp.user_id = p_user_id
    ),
    'courses', (
      select jsonb_agg(to_jsonb(ucs.*))
      from public.storefront_user_course_summary_v ucs
      where ucs.user_id = p_user_id
    ),
    'achievements', (
      select jsonb_agg(to_jsonb(ua.*))
      from public.storefront_user_achievements_v2 ua
      where ua.user_id = p_user_id
    )
  ) into v_profile
  from auth.users u
  where u.id = p_user_id;
  
  return coalesce(v_profile, '{}'::jsonb);
end;
$$;

-- Function to get offering analytics
create or replace function public.get_offering_admin_analytics(p_offering_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_analytics jsonb;
begin
  if not public.is_storefront_admin() then
    raise exception 'Only admins can access analytics';
  end if;
  
  select to_jsonb(opa.*) into v_analytics
  from public.storefront_offering_performance_analytics_v opa
  where opa.offering_id = p_offering_id;
  
  return coalesce(v_analytics, '{}'::jsonb);
end;
$$;

grant execute on function public.get_user_admin_profile(uuid) to authenticated;
grant execute on function public.get_offering_admin_analytics(uuid) to authenticated;

commit;

-- ============================================================================
-- APPLICATION INTEGRATION GUIDE
-- ============================================================================
--
-- After running this migration, your application can use the new read models:
--
-- 1. ADMIN DASHBOARD SUMMARY:
--    query: select * from public.storefront_admin_dashboard_summary_v;
--    returns: single row with KPIs and trends
--
-- 2. OFFERING ANALYTICS:
--    query: select * from public.storefront_offering_performance_analytics_v;
--    returns: per-offering metrics (sales, engagement, completion rates)
--
-- 3. USER LEARNING PATHS:
--    query: select * from public.storefront_user_learning_path_v where engagement_status = 'at_risk';
--    returns: users who need re-engagement
--
-- 4. CONTENT AUDIT TRAIL:
--    query: select * from public.storefront_content_audit_trail_v order by changed_at desc;
--    returns: full history of content changes with revision details
--
-- 5. ADMIN HELPER FUNCTIONS:
--    - get_user_admin_profile(user_id) - complete user profile for admin view
--    - get_offering_admin_analytics(offering_id) - detailed offering metrics
--
-- TypeScript Integration Example (in your React app):
--
--   // Query admin dashboard summary
--   const { data, error } = await supabase
--     .from('storefront_admin_dashboard_summary_v')
--     .select('*')
--     .single();
--
--   // Query at-risk users
--   const { data: atRiskUsers } = await supabase
--     .from('storefront_user_learning_path_v')
--     .select('user_id, email, engagement_status, last_activity_at')
--     .eq('engagement_status', 'at_risk')
--     .order('last_activity_at', { ascending: true });
--
--   // Get detailed user profile
--   const { data: profile } = await supabase
--     .rpc('get_user_admin_profile', { p_user_id: userId });
--
-- See src/components/AdminDashboard for full implementation examples.
