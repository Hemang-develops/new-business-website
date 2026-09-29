begin;

insert into storage.buckets (id, name, public, file_size_limit)
values ('course-content', 'course-content', false, 26214400)
on conflict (id) do update
set public = false,
    file_size_limit = 26214400;

alter table public.storefront_course_items
  drop constraint if exists storefront_course_items_content_type_check;
alter table public.storefront_course_items
  add constraint storefront_course_items_content_type_check
  check (content_type in ('text', 'youtube', 'video', 'audio', 'document', 'file', 'link'));

-- Admins may upload and manage protected course media.
drop policy if exists "Admins upload course content" on storage.objects;
create policy "Admins upload course content"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'course-content' and public.is_storefront_admin());

drop policy if exists "Admins update course content" on storage.objects;
create policy "Admins update course content"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'course-content' and public.is_storefront_admin())
  with check (bucket_id = 'course-content' and public.is_storefront_admin());

drop policy if exists "Admins delete course content" on storage.objects;
create policy "Admins delete course content"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'course-content' and public.is_storefront_admin());

commit;
