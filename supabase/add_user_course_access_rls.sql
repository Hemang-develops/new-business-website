-- Allow signed-in users to see their own purchased courses in My Courses.

begin;

alter table public.storefront_courses enable row level security;
alter table public.storefront_course_access enable row level security;

drop policy if exists "Users read own course access" on public.storefront_course_access;
create policy "Users read own course access"
  on public.storefront_course_access
  for select
  to authenticated
  using (
    revoked_at is null
    and (
      user_id = auth.uid()
      or lower(btrim(customer_email)) = lower(btrim(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "Users read purchased active courses" on public.storefront_courses;
create policy "Users read purchased active courses"
  on public.storefront_courses
  for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.storefront_course_access access
      where access.course_id = storefront_courses.id
        and access.revoked_at is null
        and (
          access.user_id = auth.uid()
          or lower(btrim(access.customer_email)) = lower(btrim(auth.jwt() ->> 'email'))
        )
    )
  );

commit;
