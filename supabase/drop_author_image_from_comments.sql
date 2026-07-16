-- Remove the author_image column from comments.
-- Profile images are stored in auth.users.user_metadata and resolved at display time.
-- Run this once against the live DB if the column exists.
alter table public.comments drop column if exists author_image;
