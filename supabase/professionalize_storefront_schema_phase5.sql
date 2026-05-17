-- Professionalization phase 5
-- Focus:
-- - create read models for efficient admin/reporting queries
-- - stabilize user profile and course progress views
-- - provide consistent materialized views for common lookups

begin;

-- User course summary view: combines progress, access, and course metadata
create or replace view public.storefront_user_course_summary_v as
select
  u.id as user_id,
  u.email as user_email,
  u.created_at as user_created_at,
  sca.id as access_id,
  sca.course_id,
  sc.title as course_title,
  sc.description as course_description,
  sc.offering_id,
  so.title as offering_title,
  so.price_usd as offering_price,
  sca.customer_email,
  sca.customer_name,
  sca.starts_at,
  sca.expires_at,
  sca.revoked_at,
  sca.last_accessed_at,
  sca.created_at as access_created_at,
  -- Progress metrics
  coalesce(up.total_items, 0) as total_course_items,
  coalesce(up.completed_items, 0) as completed_items,
  coalesce(up.last_progress_at, sca.last_accessed_at) as last_progress_at,
  -- Achievement summary
  coalesce(ua.total_achievements, 0) as total_achievements,
  -- Status calculations
  case
    when sca.revoked_at is not null then 'revoked'
    when sca.expires_at < now() then 'expired'
    when coalesce(up.completed_items, 0) = coalesce(up.total_items, 0) and coalesce(up.total_items, 0) > 0 then 'completed'
    when coalesce(up.completed_items, 0) > 0 then 'in_progress'
    else 'not_started'
  end as course_status,
  -- Progress percentage
  case
    when coalesce(up.total_items, 0) > 0 then
      round((coalesce(up.completed_items, 0)::decimal / up.total_items::decimal) * 100, 1)
    else 0
  end as progress_percentage
from public.storefront_course_access sca
join auth.users u on u.id = sca.user_id
join public.storefront_courses sc on sc.id = sca.course_id
join public.storefront_offerings so on so.id = sc.offering_id
left join (
  select
    course_id,
    user_id,
    count(*) as total_items,
    count(*) filter (where completed_at is not null) as completed_items,
    max(completed_at) as last_progress_at
  from public.storefront_user_course_progress
  group by course_id, user_id
) up on up.course_id = sca.course_id and up.user_id = sca.user_id
left join (
  select
    course_id,
    user_id,
    count(*) as total_achievements
  from public.storefront_user_achievements
  group by course_id, user_id
) ua on ua.course_id = sca.course_id and ua.user_id = sca.user_id
where sca.revoked_at is null
  or sca.revoked_at > now() - interval '30 days'; -- Keep recent revocations for reporting

-- Offering summary view: aggregates sales and engagement data
create or replace view public.storefront_offering_summary_v as
select
  so.id,
  so.title,
  so.summary as description,
  so.price_usd as price_amount,
  'USD' as price_currency,
  so.cta_type,
  so.cta_label,
  so.action_link as cta_href,
  so.is_active,
  so.sort_order,
  null as created_at,
  null as updated_at,
  -- Sales metrics
  coalesce(sales.total_sales, 0) as total_sales,
  coalesce(sales.total_revenue, 0) as total_revenue,
  coalesce(sales.currency, 'USD') as revenue_currency,
  -- Course metrics (if applicable)
  case when so.cta_type = 'course' then sc.id else null end as course_id,
  case when so.cta_type = 'course' then sc.title else null end as course_title,
  case when so.cta_type = 'course' then sc.is_active else null end as course_active,
  -- Access metrics
  coalesce(access.total_accesses, 0) as total_accesses,
  coalesce(access.active_accesses, 0) as active_accesses,
  coalesce(access.expired_accesses, 0) as expired_accesses,
  -- Progress metrics (for course offerings)
  coalesce(progress.avg_progress, 0) as avg_course_progress,
  coalesce(progress.completion_rate, 0) as course_completion_rate
from public.storefront_offerings so
left join public.storefront_courses sc on sc.offering_id = so.id and sc.is_active = true
left join (
  select
    offering_id,
    count(*) as total_sales,
    sum(amount) as total_revenue,
    max(currency) as currency
  from public.storefront_course_access
  where payment_provider is not null
    and payment_id is not null
  group by offering_id
) sales on sales.offering_id = so.id
left join (
  select
    offering_id,
    count(*) as total_accesses,
    count(*) filter (where revoked_at is null and (expires_at is null or expires_at > now())) as active_accesses,
    count(*) filter (where expires_at < now()) as expired_accesses
  from public.storefront_course_access
  group by offering_id
) access on access.offering_id = so.id
left join (
  select
    sc.offering_id,
    avg(case when up.total_items > 0 then (up.completed_items::decimal / up.total_items::decimal) * 100 else 0 end) as avg_progress,
    avg(case when up.total_items > 0 and up.completed_items = up.total_items then 1 else 0 end) as completion_rate
  from public.storefront_courses sc
  join (
    select
      course_id,
      count(*) as total_items,
      count(*) filter (where completed_at is not null) as completed_items
    from public.storefront_user_course_progress
    group by course_id
  ) up on up.course_id = sc.id
  group by sc.offering_id
) progress on progress.offering_id = so.id;

-- Admin notification feed view: consolidated admin alerts
create or replace view public.storefront_admin_notification_feed_v as
select
  'course_purchase' as notification_type,
  sca.id as record_id,
  concat('New course purchase: ', sc.title) as title,
  concat(
    coalesce(sca.customer_name, 'Customer'),
    ' purchased access to ',
    sc.title,
    ' for ',
    coalesce(sca.currency, 'USD'),
    ' ',
    coalesce(sca.amount::text, 'N/A')
  ) as message,
  jsonb_build_object(
    'course_id', sc.id,
    'course_title', sc.title,
    'customer_email', sca.customer_email,
    'customer_name', sca.customer_name,
    'amount', sca.amount,
    'currency', sca.currency,
    'payment_provider', sca.payment_provider,
    'offering_id', so.id,
    'offering_title', so.title
  ) as metadata,
  sca.created_at as occurred_at,
  false as is_read
from public.storefront_course_access sca
join public.storefront_courses sc on sc.id = sca.course_id
join public.storefront_offerings so on so.id = sc.offering_id
where sca.payment_provider is not null
  and sca.payment_id is not null

union all

select
  'booking_purchase' as notification_type,
  sba.id as record_id,
  concat('New booking: ', so.title) as title,
  concat(
    coalesce(sba.customer_name, 'Customer'),
    ' booked ',
    so.title,
    ' for ',
    coalesce(sba.currency, 'USD'),
    ' ',
    coalesce(sba.amount::text, 'N/A')
  ) as message,
  jsonb_build_object(
    'offering_id', so.id,
    'offering_title', so.title,
    'customer_email', sba.customer_email,
    'customer_name', sba.customer_name,
    'amount', sba.amount,
    'currency', sba.currency,
    'scheduled_at', sba.scheduled_at,
    'status', sba.status
  ) as metadata,
  sba.created_at as occurred_at,
  false as is_read
from public.storefront_booking_access sba
join public.storefront_offerings so on so.id = sba.offering_id
where sba.payment_provider is not null
  and sba.payment_id is not null

union all

select
  'course_completion' as notification_type,
  up.id as record_id,
  concat('Course completed: ', sc.title) as title,
  concat(
    coalesce(sca.customer_name, 'Student'),
    ' completed ',
    sc.title
  ) as message,
  jsonb_build_object(
    'course_id', sc.id,
    'course_title', sc.title,
    'user_id', sca.user_id,
    'customer_email', sca.customer_email,
    'customer_name', sca.customer_name,
    'completed_at', up.completed_at
  ) as metadata,
  up.completed_at as occurred_at,
  false as is_read
from public.storefront_user_course_progress up
join public.storefront_courses sc on sc.id = up.course_id
join public.storefront_course_access sca on sca.course_id = up.course_id and sca.user_id = up.user_id
where up.completed_at is not null
  and up.item_id in (
    select sci.id
    from public.storefront_course_items sci
    where sci.course_id = sc.id
      and sci.is_active = true
    order by sci.sort_order desc
    limit 1
  )

order by occurred_at desc;

-- Materialized view for user profile summary (refresh periodically)
create materialized view if not exists public.storefront_user_profile_summary_mv as
select
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  u.last_sign_in_at,
  -- Course access summary
  coalesce(access.total_courses, 0) as total_course_accesses,
  coalesce(access.active_courses, 0) as active_course_accesses,
  coalesce(access.completed_courses, 0) as completed_course_accesses,
  -- Progress summary
  coalesce(progress.total_completed_items, 0) as total_completed_items,
  coalesce(progress.avg_progress_percentage, 0) as avg_course_progress,
  -- Achievement summary
  coalesce(achievements.total_achievements, 0) as total_achievements,
  -- Booking summary
  coalesce(bookings.total_bookings, 0) as total_bookings,
  coalesce(bookings.completed_bookings, 0) as completed_bookings,
  -- Financial summary
  coalesce(financial.total_spent, 0) as total_spent,
  coalesce(financial.currency, 'USD') as primary_currency
from auth.users u
left join (
  select
    user_id,
    count(*) as total_courses,
    count(*) filter (where course_status in ('in_progress', 'not_started')) as active_courses,
    count(*) filter (where course_status = 'completed') as completed_courses
  from (
    select
      sca.user_id,
      sca.course_id,
      case
        when sca.revoked_at is not null then 'revoked'
        when sca.expires_at is not null and sca.expires_at < now() then 'expired'
        when coalesce(up.completed_items, 0) = coalesce(sci_total.total_items, 0) and coalesce(sci_total.total_items, 0) > 0 then 'completed'
        when coalesce(up.completed_items, 0) > 0 then 'in_progress'
        else 'not_started'
      end as course_status
    from public.storefront_course_access sca
    left join (
      select
        course_id,
        user_id,
        count(*) as completed_items
      from public.storefront_user_course_progress
      where completed_at is not null
      group by course_id, user_id
    ) up on up.course_id = sca.course_id and up.user_id = sca.user_id
    left join (
      select
        course_id,
        count(*) as total_items
      from public.storefront_course_items
      where is_active = true
      group by course_id
    ) sci_total on sci_total.course_id = sca.course_id
  ) course_statuses
  group by user_id
) access on access.user_id = u.id
left join (
  select
    sca.user_id,
    sum(coalesce(up.completed_items, 0)) as total_completed_items,
    avg(
      case
        when coalesce(sci_total.total_items, 0) > 0 then (coalesce(up.completed_items, 0)::decimal / sci_total.total_items::decimal) * 100
        else 0
      end
    ) as avg_progress_percentage
  from public.storefront_course_access sca
  left join (
    select
      course_id,
      user_id,
      count(*) as completed_items
    from public.storefront_user_course_progress
    where completed_at is not null
    group by course_id, user_id
  ) up on up.course_id = sca.course_id and up.user_id = sca.user_id
  left join (
    select
      course_id,
      count(*) as total_items
    from public.storefront_course_items
    where is_active = true
    group by course_id
  ) sci_total on sci_total.course_id = sca.course_id
  group by sca.user_id
) progress on progress.user_id = u.id
left join (
  select
    user_id,
    sum(total_achievements) as total_achievements
  from (
    select
      sca.user_id,
      count(*) as total_achievements
    from public.storefront_course_access sca
    join public.storefront_user_achievements ua on ua.course_id = sca.course_id and ua.user_id = sca.user_id
    group by sca.user_id, sca.course_id
  ) course_achievements
  group by user_id
) achievements on achievements.user_id = u.id
left join (
  select
    user_id,
    count(*) as total_bookings,
    count(*) filter (where status = 'completed') as completed_bookings
  from public.storefront_booking_access
  where user_id is not null
  group by user_id
) bookings on bookings.user_id = u.id
left join (
  select
    user_id,
    sum(amount) as total_spent,
    max(currency) as currency
  from (
    select user_id, amount, currency from public.storefront_course_access where user_id is not null
    union all
    select user_id, amount, currency from public.storefront_booking_access where user_id is not null
  ) payments
  group by user_id
) financial on financial.user_id = u.id;

-- Create indexes for the materialized view
create unique index if not exists storefront_user_profile_summary_mv_user_id_idx
  on public.storefront_user_profile_summary_mv (user_id);

create index if not exists storefront_user_profile_summary_mv_email_idx
  on public.storefront_user_profile_summary_mv (email);

-- Function to refresh the materialized view
create or replace function public.refresh_storefront_user_profile_summary()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.storefront_user_profile_summary_mv;
$$;

-- Grant permissions for admin access to read models
grant select on public.storefront_user_course_summary_v to authenticated;
grant select on public.storefront_offering_summary_v to authenticated;
grant select on public.storefront_admin_notification_feed_v to authenticated;
grant select on public.storefront_user_profile_summary_mv to authenticated;

-- RLS policies for read models (admins only)
alter view public.storefront_user_course_summary_v set (security_barrier = true);
alter view public.storefront_offering_summary_v set (security_barrier = true);
alter view public.storefront_admin_notification_feed_v set (security_barrier = true);

-- RLS for materialized view
alter materialized view public.storefront_user_profile_summary_mv owner to postgres;

commit;

-- Recommended maintenance after running this migration:
-- select public.refresh_storefront_user_profile_summary();
-- -- Set up a cron job or scheduled task to refresh the materialized view periodically
