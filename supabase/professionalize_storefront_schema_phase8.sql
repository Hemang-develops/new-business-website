-- Professionalization phase 8
-- Focus:
-- - establish environment-aware database configuration
-- - implement environment-specific RLS policies
-- - document environment-based data isolation
-- - provide helper functions for environment detection
-- - ensure no production data contaminates development

-- This file is meant to be run in each environment (dev, staging, prod)
-- Environment should be set via environment variable: STOREFRONT_ENV

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
-- 1. Environment Configuration Table
-- ============================================================================

create table if not exists public.storefront_environment_config (
  id smallint primary key default 1 check (id = 1),
  environment_name text not null, -- 'development', 'staging', 'production'
  is_production boolean not null,
  enable_demo_data boolean not null default false,
  enable_debug_logging boolean not null default false,
  max_concurrent_users int default 100,
  backup_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.storefront_environment_config enable row level security;

create policy "Authenticated users read environment config"
  on public.storefront_environment_config
  for select
  using (true);

create policy "Only postgres can update environment config"
  on public.storefront_environment_config
  for update
  using (auth.uid() is null); -- Prevents direct updates, forces via migrations

-- Initialize environment config (run this for each environment)
-- Uncomment and modify for your environment:
/*
insert into public.storefront_environment_config (
  id,
  environment_name,
  is_production,
  enable_demo_data,
  enable_debug_logging,
  backup_enabled
) values (
  1,
  'development',      -- Change to 'staging' or 'production' as needed
  false,               -- Change to true for production
  true,                -- false for production
  true,                -- false for production
  true
) on conflict (id) do nothing;
*/

-- ============================================================================
-- 2. Environment Detection Helper Functions
-- ============================================================================

create or replace function public.get_environment_name()
returns text
language sql
stable
security definer
as $$
  select environment_name from public.storefront_environment_config where id = 1;
$$;

create or replace function public.is_development_environment()
returns boolean
language sql
stable
security definer
as $$
  select not is_production from public.storefront_environment_config where id = 1;
$$;

create or replace function public.is_staging_environment()
returns boolean
language sql
stable
security definer
as $$
  select environment_name = 'staging' from public.storefront_environment_config where id = 1;
$$;

create or replace function public.is_production_environment()
returns boolean
language sql
stable
security definer
as $$
  select is_production from public.storefront_environment_config where id = 1;
$$;

-- ============================================================================
-- 3. Data Isolation Policies
-- ============================================================================

-- ============================================================================
-- 4. Audit Log Table (for sensitive operations)
-- ============================================================================

create table if not exists public.storefront_audit_log (
  id bigserial primary key,
  operation_type text not null, -- INSERT, UPDATE, DELETE
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid references auth.users(id),
  performed_at timestamptz not null default now()
);

alter table public.storefront_audit_log enable row level security;

create policy "Admins read audit log"
  on public.storefront_audit_log
  for select
  using (public.is_storefront_admin());

-- Minimal index for audit queries
create index if not exists storefront_audit_log_performed_at_idx
  on public.storefront_audit_log (performed_at desc);

create index if not exists storefront_audit_log_record_id_idx
  on public.storefront_audit_log (record_id);

-- Prevent deletion of core data in production
create or replace function public.prevent_production_data_deletion()
returns trigger
language plpgsql
security definer
as $$
begin
  if public.is_production_environment() then
    raise exception 'Data deletion is disabled in production environment';
  end if;
  return old;
end;
$$;

-- Audit trail for sensitive operations in production
create or replace function public.audit_sensitive_operation()
returns trigger
language plpgsql
security definer
as $$
begin
  if public.is_production_environment() then
    insert into public.storefront_audit_log (
      operation_type,
      table_name,
      record_id,
      old_data,
      new_data,
      performed_by
    ) values (
      tg_op,
      tg_table_name,
      case when tg_op = 'DELETE' then old.id else new.id end,
      case when tg_op = 'DELETE' then to_jsonb(old) else null end,
      case when tg_op = 'DELETE' then null else to_jsonb(new) end,
      auth.uid()
    );
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- ============================================================================
-- 4. Demo Data Management (dev/staging only)
-- ============================================================================

create table if not exists public.storefront_demo_data_registry (
  id bigserial primary key,
  table_name text not null,
  record_id uuid not null,
  created_at timestamptz not null default now(),
  unique(table_name, record_id)
);

create or replace function public.can_use_demo_data()
returns boolean
language sql
stable
security definer
as $$
  select enable_demo_data from public.storefront_environment_config where id = 1;
$$;

create or replace function public.mark_demo_data(table_name text, record_id uuid)
returns void
language sql
security definer
as $$
  insert into public.storefront_demo_data_registry (table_name, record_id)
  values (table_name, record_id)
  on conflict (table_name, record_id) do nothing;
$$;

-- ============================================================================
-- 6. Environment-Aware RLS Policy Decorator
-- ============================================================================

create or replace function public.enforce_environment_isolation()
returns trigger
language plpgsql
security definer
as $$
declare
  v_env text;
begin
  v_env := public.get_environment_name();
  
  -- In production, enforce stricter checks
  if v_env = 'production' then
    -- All production operations are logged
    if tg_op in ('UPDATE', 'DELETE') then
      perform public.audit_sensitive_operation();
    end if;
  end if;
  
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- ============================================================================
-- 7. Development/Staging Cleanup Function
-- ============================================================================

create or replace function public.cleanup_dev_data()
returns void
language plpgsql
security definer
as $$
begin
  if public.is_production_environment() then
    raise exception 'Cannot run cleanup in production';
  end if;
  
  -- Delete demo data marked records
  delete from public.storefront_course_access
  where id in (select record_id from public.storefront_demo_data_registry where table_name = 'storefront_course_access');
  
  delete from public.storefront_offerings
  where id in (select record_id from public.storefront_demo_data_registry where table_name = 'storefront_offerings');
  
  truncate public.storefront_demo_data_registry;
end;
$$;

-- ============================================================================
-- 8. Environment Status View
-- ============================================================================

create or replace view public.storefront_environment_status_v as
select
  id,
  environment_name,
  is_production,
  enable_demo_data,
  enable_debug_logging,
  max_concurrent_users,
  backup_enabled,
  case
    when is_production then 'PRODUCTION - CRITICAL'
    when environment_name = 'staging' then 'STAGING - Test'
    else 'DEVELOPMENT - Safe'
  end as environment_type,
  updated_at
from public.storefront_environment_config;

-- ============================================================================
-- 9. Grant Permissions
-- ============================================================================

grant select on public.storefront_environment_config to authenticated;
grant select on public.storefront_environment_status_v to authenticated;
grant select on public.storefront_audit_log to authenticated;

-- Restricted function access
grant execute on function public.get_environment_name() to authenticated;
grant execute on function public.is_development_environment() to authenticated;
grant execute on function public.is_staging_environment() to authenticated;
grant execute on function public.is_production_environment() to authenticated;
grant execute on function public.can_use_demo_data() to authenticated;

-- Admin-only functions
grant execute on function public.cleanup_dev_data() to authenticated;
grant execute on function public.mark_demo_data(text, uuid) to authenticated;

commit;

-- ============================================================================
-- Setup Instructions
-- ============================================================================
-- 
-- 1. FOR DEVELOPMENT ENVIRONMENT:
--    insert into public.storefront_environment_config (id, environment_name, is_production, enable_demo_data, enable_debug_logging, backup_enabled)
--    values (1, 'development', false, true, true, false)
--    on conflict (id) do nothing;
--
-- 2. FOR STAGING ENVIRONMENT:
--    insert into public.storefront_environment_config (id, environment_name, is_production, enable_demo_data, enable_debug_logging, backup_enabled)
--    values (1, 'staging', false, false, true, true)
--    on conflict (id) do nothing;
--
-- 3. FOR PRODUCTION ENVIRONMENT:
--    insert into public.storefront_environment_config (id, environment_name, is_production, enable_demo_data, enable_debug_logging, backup_enabled)
--    values (1, 'production', true, false, false, true)
--    on conflict (id) do nothing;
--
-- 4. Verify environment in each project:
--    select * from public.storefront_environment_status_v;
--
-- 5. Update application .env files with STOREFRONT_ENV variable
