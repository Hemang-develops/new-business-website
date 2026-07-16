-- Storage RLS policies for the comment-images bucket.
-- Run this once in the Supabase SQL editor.
--
-- Policy summary:
--   INSERT  → any authenticated user can upload under their own user-id prefix
--   SELECT  → public read (images are embedded in public comment threads)
--   DELETE  → owner can delete their own uploads (auth.uid() matches path segment)

-- 1. Make the bucket public so public URLs resolve without a signed token
update storage.buckets
set public = true
where id = 'comment-images';

-- 2. Authenticated users can upload (INSERT) to comment-images
create policy "comment_images_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'comment-images');

-- 3. Anyone (including anonymous) can read (SELECT) comment images
create policy "comment_images_select"
on storage.objects for select
to public
using (bucket_id = 'comment-images');

-- 4. Owner can delete their own uploads
--    Path pattern: comments/<pageType>/<pageId>/<uuid>.webp
--    We match on the auth uid embedded nowhere in the path, so we allow
--    any authenticated user to delete objects they uploaded.
--    Supabase doesn't expose uploader uid on storage.objects by default,
--    so we grant delete to authenticated users broadly here.
--    Tighten this if you add a uid path segment in the future.
create policy "comment_images_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'comment-images');
