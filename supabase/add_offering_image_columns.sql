begin;

alter table public.storefront_offerings
add column if not exists image_url text,
add column if not exists image_alt text;

commit;
