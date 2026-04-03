begin;

update public.storefront_site_sections
set
  description = case
    when nullif(btrim(coalesce(description_secondary, '')), '') is null then description
    when nullif(btrim(coalesce(description, '')), '') is null then description_secondary
    when position(description_secondary in description) > 0 then description
    else description || E'\n\n' || description_secondary
  end,
  supporting_description = case
    when nullif(btrim(coalesce(supporting_note, '')), '') is null then supporting_description
    when nullif(btrim(coalesce(supporting_description, '')), '') is null then supporting_note
    when position(supporting_note in supporting_description) > 0 then supporting_description
    else supporting_description || E'\n\n' || supporting_note
  end
where
  nullif(btrim(coalesce(description_secondary, '')), '') is not null
  or nullif(btrim(coalesce(supporting_note, '')), '') is not null;

alter table public.storefront_site_sections
  drop column if exists description_secondary,
  drop column if exists supporting_note;

commit;
