begin;

with child_highlights as (
  select
    h.offering_id,
    h.sort_order,
    h.text
  from public.storefront_offering_highlights h
  where nullif(btrim(coalesce(h.text, '')), '') is not null
),
jsonb_highlights as (
  select
    o.id as offering_id,
    arr.ordinality::int - 1 as sort_order,
    arr.value as text
  from public.storefront_offerings o
  cross join lateral jsonb_array_elements_text(coalesce(o.highlights, '[]'::jsonb)) with ordinality as arr(value, ordinality)
  where not exists (
    select 1
    from public.storefront_offering_highlights h
    where h.offering_id = o.id
  )
    and nullif(btrim(coalesce(arr.value, '')), '') is not null
),
source_highlights as (
  select * from child_highlights
  union all
  select * from jsonb_highlights
),
ordered_highlights as (
  select
    s.offering_id,
    string_agg(
      '<li>' ||
      replace(
        replace(
          replace(coalesce(s.text, ''), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ) ||
      '</li>',
      '' order by s.sort_order
    ) as list_items
  from source_highlights s
  group by s.offering_id
),
highlight_markup as (
  select
    offering_id,
    '<h3>Highlights</h3><ul>' || list_items || '</ul>' as highlight_html
  from ordered_highlights
  where coalesce(list_items, '') <> ''
),
base_descriptions as (
  select
    o.id,
    o.title,
    coalesce(o.long_description, '') as original_long_description,
    btrim(
      replace(
        replace(
          coalesce(o.long_description, ''),
          '<p></p>' || coalesce(h.highlight_html, ''),
          ''
        ),
        coalesce(h.highlight_html, ''),
        ''
      )
    ) as cleaned_long_description
  from public.storefront_offerings o
  left join highlight_markup h on h.offering_id = o.id
),
missing_highlights as (
  select
    s.offering_id,
    s.sort_order,
    s.text
  from source_highlights s
  join base_descriptions b on b.id = s.offering_id
  where position(lower(btrim(s.text)) in lower(b.cleaned_long_description)) = 0
),
missing_highlight_markup as (
  select
    m.offering_id,
    '<h3>Highlights</h3><ul>' ||
    string_agg(
      '<li>' ||
      replace(
        replace(
          replace(coalesce(m.text, ''), '&', '&amp;'),
          '<',
          '&lt;'
        ),
        '>',
        '&gt;'
      ) ||
      '</li>',
      '' order by m.sort_order
    ) ||
    '</ul>' as missing_highlight_html
  from missing_highlights m
  group by m.offering_id
),
updated as (
  update public.storefront_offerings o
  set long_description = case
    when nullif(b.cleaned_long_description, '') is null then coalesce(m.missing_highlight_html, '')
    when nullif(coalesce(m.missing_highlight_html, ''), '') is null then b.cleaned_long_description
    else b.cleaned_long_description || '<p></p>' || m.missing_highlight_html
  end
  from base_descriptions b
  left join missing_highlight_markup m on m.offering_id = b.id
  where o.id = b.id
    and coalesce(o.long_description, '') is distinct from
      case
        when nullif(b.cleaned_long_description, '') is null then coalesce(m.missing_highlight_html, '')
        when nullif(coalesce(m.missing_highlight_html, ''), '') is null then b.cleaned_long_description
        else b.cleaned_long_description || '<p></p>' || m.missing_highlight_html
      end
  returning o.id, o.title, o.long_description
),
deleted_child_rows as (
  delete from public.storefront_offering_highlights h
  using (
    select distinct offering_id from source_highlights
  ) s
  where h.offering_id = s.offering_id
  returning h.offering_id
)
select
  o.id,
  o.title,
  left(o.long_description, 400) as long_description_preview
from public.storefront_offerings o
where exists (
  select 1
  from source_highlights s
  where s.offering_id = o.id
)
order by o.title;

commit;
