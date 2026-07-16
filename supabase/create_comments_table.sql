-- Creates comments table for site comments and a reports table
-- Run: supabase db remote commit or via SQL editor in Supabase

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,
  page_id text not null,
  module_id text,
  parent_id uuid,
  author_id uuid,
  author_name text,
  content text,
  image_url text,
  image_alt text,
  is_visible boolean default true,
  created_at timestamptz default now()
);

create index if not exists comments_by_page on public.comments (page_type, page_id);
create index if not exists comments_parent_idx on public.comments (parent_id);

create table if not exists public.comments_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

-- Note: create a Supabase Storage bucket named `comment-images` and set its
-- public access policy if you want public URLs. You can run the create bucket
-- command in the Supabase dashboard Storage UI.
