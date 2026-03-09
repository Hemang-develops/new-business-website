import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const checkoutCatalogPath = path.join(rootDir, "src", "data", "checkoutCatalog.json");
const offeringsPath = path.join(rootDir, "src", "data", "offerings.js");
const outputPath = path.join(rootDir, "supabase", "storefront_catalog.sql");

const escapeSqlString = (value) => String(value).replace(/'/g, "''");

const toSqlText = (value) => {
  if (value === null || value === undefined) {
    return "null";
  }
  return `'${escapeSqlString(value)}'`;
};

const toSqlInt = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "null";
  }
  return String(Number(value));
};

const toSqlJson = (value) => {
  if (value === null || value === undefined) {
    return "null";
  }
  return `'${escapeSqlString(JSON.stringify(value))}'::jsonb`;
};

const buildSectionsRows = (sections) =>
  sections.map((section, index) => ({
    id: section.id,
    title: section.title || "",
    description: section.description || "",
    sort_order: index,
  }));

const buildOfferingsRows = (sections) => {
  const rows = [];
  sections.forEach((section) => {
    (section.items || []).forEach((item, itemIndex) => {
      rows.push({
        id: item.id,
        section_id: section.id,
        sort_order: itemIndex,
        title: item.title || "",
        image_url: item.imageUrl || item.image?.url || null,
        image_alt: item.imageAlt || item.image?.alt || item.title || null,
        subtitle: item.subtitle || null,
        summary: item.summary || null,
        long_description: item.longDescription || null,
        price_label: item.priceLabel || null,
        cta_label: item.ctaLabel || null,
        action_link: item.actionLink || null,
        checkout_fallback_message: item.checkoutFallbackMessage || null,
        price_usd: item.price?.usd || null,
        purchase_label: item.purchase?.label || null,
        purchase_link: item.purchase?.link || null,
        manual_support_label: item.manualSupport?.label || null,
        manual_support_link: item.manualSupport?.link || null,
        highlights: item.highlights || [],
        payment_methods: item.paymentMethods || [],
        price_details: item.priceDetails || [],
        manual_instructions: item.manualInstructions || [],
        legal_notes: item.legalNotes || [],
        details_sections: item.detailsSections || null,
        closing_notes: item.closingNotes || null,
        success_story: item.successStory || null,
        checkout_options: item.checkoutOptions || null,
        purchase: item.purchase || null,
        manual_support: item.manualSupport || null,
        price: item.price || null,
      });
    });
  });
  return rows;
};

const sectionsInsert = (rows) => {
  const values = rows
    .map(
      (row) =>
        `(${toSqlText(row.id)}, ${toSqlText(row.title)}, ${toSqlText(row.description)}, ${toSqlInt(row.sort_order)}, true)`,
    )
    .join(",\n  ");

  return `insert into public.storefront_sections (id, title, description, sort_order, is_active)
values
  ${values}
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();`;
};

const offeringsInsert = (rows) => {
  const values = rows
    .map(
      (row) =>
        `(${toSqlText(row.id)}, ${toSqlText(row.section_id)}, ${toSqlInt(row.sort_order)}, true, ${toSqlText(row.title)}, ${toSqlText(row.image_url)}, ${toSqlText(row.image_alt)}, ${toSqlText(row.subtitle)}, ${toSqlText(row.summary)}, ${toSqlText(row.long_description)}, ${toSqlText(row.price_label)}, ${toSqlText(row.cta_label)}, ${toSqlText(row.action_link)}, ${toSqlText(row.checkout_fallback_message)}, ${toSqlText(row.price_usd)}, ${toSqlText(row.purchase_label)}, ${toSqlText(row.purchase_link)}, ${toSqlText(row.manual_support_label)}, ${toSqlText(row.manual_support_link)}, ${toSqlJson(row.highlights)}, ${toSqlJson(row.payment_methods)}, ${toSqlJson(row.price_details)}, ${toSqlJson(row.manual_instructions)}, ${toSqlJson(row.legal_notes)}, ${toSqlJson(row.details_sections)}, ${toSqlJson(row.closing_notes)}, ${toSqlJson(row.success_story)}, ${toSqlJson(row.checkout_options)}, ${toSqlJson(row.purchase)}, ${toSqlJson(row.manual_support)}, ${toSqlJson(row.price)})`,
    )
    .join(",\n  ");

  return `insert into public.storefront_offerings (
  id, section_id, sort_order, is_active, title, image_url, image_alt, subtitle, summary, long_description, price_label, cta_label, action_link, checkout_fallback_message,
  price_usd, purchase_label, purchase_link, manual_support_label, manual_support_link,
  highlights, payment_methods, price_details, manual_instructions, legal_notes, details_sections, closing_notes, success_story,
  checkout_options, purchase, manual_support, price
)
values
  ${values}
on conflict (id) do update
set section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    title = excluded.title,
    image_url = excluded.image_url,
    image_alt = excluded.image_alt,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    long_description = excluded.long_description,
    price_label = excluded.price_label,
    cta_label = excluded.cta_label,
    action_link = excluded.action_link,
    checkout_fallback_message = excluded.checkout_fallback_message,
    price_usd = excluded.price_usd,
    purchase_label = excluded.purchase_label,
    purchase_link = excluded.purchase_link,
    manual_support_label = excluded.manual_support_label,
    manual_support_link = excluded.manual_support_link,
    highlights = excluded.highlights,
    payment_methods = excluded.payment_methods,
    price_details = excluded.price_details,
    manual_instructions = excluded.manual_instructions,
    legal_notes = excluded.legal_notes,
    details_sections = excluded.details_sections,
    closing_notes = excluded.closing_notes,
    success_story = excluded.success_story,
    checkout_options = excluded.checkout_options,
    purchase = excluded.purchase,
    manual_support = excluded.manual_support,
    price = excluded.price,
    updated_at = now();`;
};

const checkoutInsert = (checkoutCatalog) => {
  const values = Object.entries(checkoutCatalog)
    .map(([productId, config]) => `(${toSqlText(productId)}, ${toSqlJson(config)})`)
    .join(",\n  ");

  return `insert into public.storefront_checkout_configs (product_id, config)
values
  ${values}
on conflict (product_id) do update
set config = excluded.config,
    updated_at = now();`;
};

const loadBuySectionsFromSource = async (checkoutCatalog) => {
  const source = await fs.readFile(offeringsPath, "utf8");

  const prepared = source
    .replace(/import\s+checkoutCatalog\s+from\s+"\.\/checkoutCatalog\.json";/, "")
    .replace(/export const buySections =/, "const buySections =")
    .replace(/export const offeringsIndex[\s\S]*$/, "");

  const factory = new Function("checkoutCatalog", `${prepared}\nreturn { buySections };`);
  const result = factory(checkoutCatalog);
  return result.buySections || [];
};

const main = async () => {
  const checkoutCatalogRaw = await fs.readFile(checkoutCatalogPath, "utf8");
  const checkoutCatalog = JSON.parse(checkoutCatalogRaw);
  const buySections = await loadBuySectionsFromSource(checkoutCatalog);

  const sectionRows = buildSectionsRows(buySections);
  const offeringRows = buildOfferingsRows(buySections);

  const sql = `-- Generated from src/data/offerings.js and src/data/checkoutCatalog.json
-- Run this in Supabase SQL Editor after creating the 3 storefront tables.

begin;

${sectionsInsert(sectionRows)}

${offeringsInsert(offeringRows)}

${checkoutInsert(checkoutCatalog)}

commit;
`;

  await fs.writeFile(outputPath, sql, "utf8");
  process.stdout.write(`Generated ${outputPath}\n`);
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
