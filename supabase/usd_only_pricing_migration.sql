-- USD-only pricing migration
-- Run after verifying storefront_checkout_configs.config only contains USD base prices.

begin;

-- 1) Keep only USD in offerings pricing columns.
alter table public.storefront_offerings
  drop column if exists price_inr;

-- Optional safety check: allow null for custom/inquiry offerings, but if present it must be numeric text.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storefront_offerings_price_usd_numeric_text_chk'
  ) then
    alter table public.storefront_offerings
      add constraint storefront_offerings_price_usd_numeric_text_chk
      check (
        price_usd is null
        or regexp_replace(price_usd, '[, ]', '', 'g') ~ '^[0-9]+(\.[0-9]{1,2})?$'
      );
  end if;
end $$;

-- 2) Enforce USD-only currency metadata in normalized price details (if used).
update public.storefront_offering_price_details
set currency = 'USD'
where currency is null or upper(currency) <> 'USD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'storefront_offering_price_details_currency_usd_chk'
  ) then
    alter table public.storefront_offering_price_details
      add constraint storefront_offering_price_details_currency_usd_chk
      check (currency is null or upper(currency) = 'USD');
  end if;
end $$;

commit;
