# Catalog Tables Contract (Admin-Friendly)

The frontend now expects three separate Supabase tables (not one umbrella JSON table).

## 1) `storefront_sections`
- `id` (text, primary key)
- `title` (text, not null)
- `description` (text, nullable)
- `sort_order` (int, default 0)
- `is_active` (boolean, default true)
- `updated_at` (timestamptz, default now())

## 2) `storefront_offerings`
- `id` (text, primary key)
- `section_id` (text, foreign key to `storefront_sections.id`)
- `sort_order` (int, default 0)
- `is_active` (boolean, default true)

Core content columns:
- `title` (text, not null)
- `image_url` (text, nullable)
- `image_alt` (text, nullable)
- `subtitle` (text)
- `summary` (text)
- `long_description` (text)
- `price_label` (text)
- `cta_label` (text)
- `action_link` (text)
- `checkout_fallback_message` (text)

Pricing columns (simple admin editing):
- `price_usd` (text)
- `price_inr` (text)

Optional link object columns:
- `purchase_label` (text)
- `purchase_link` (text)
- `manual_support_label` (text)
- `manual_support_link` (text)

Array/object JSONB columns:
- `highlights` (jsonb) array of strings
- `payment_methods` (jsonb) array of strings
- `price_details` (jsonb) array of objects
- `manual_instructions` (jsonb) array of strings
- `legal_notes` (jsonb) array of strings
- `details_sections` (jsonb) array of objects
- `closing_notes` (jsonb) array of strings
- `success_story` (jsonb) object `{ heading, quote, author }`
- `checkout_options` (jsonb, optional override for one-off configs)
- `purchase` (jsonb, optional object override)
- `manual_support` (jsonb, optional object override)
- `price` (jsonb, optional object override)

## 3) `storefront_checkout_configs`
- `product_id` (text, primary key; should match `storefront_offerings.id`)
- `config` (jsonb, not null) value should match each product object currently in `checkoutCatalog.json`
- `updated_at` (timestamptz, default now())

## Query behavior used by app
- Reads all rows from:
  - `storefront_sections` ordered by `sort_order`
  - `storefront_offerings` ordered by `sort_order`
  - `storefront_checkout_configs` as `product_id -> config`
- Filters out rows where `is_active = false`
- Merges by `storefront_offerings.section_id`
- Applies checkout config from `storefront_checkout_configs.config` unless `storefront_offerings.checkout_options` is provided.

## RLS minimum for frontend read
- Enable RLS on all three tables.
- Add `SELECT` policies allowing anon/public read if data is public.
