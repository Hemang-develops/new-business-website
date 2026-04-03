import { supabase } from "../supabase-client";

const sectionsTable = import.meta.env.VITE_SUPABASE_SECTIONS_TABLE || "storefront_sections";
const offeringsTable = import.meta.env.VITE_SUPABASE_OFFERINGS_TABLE || "storefront_offerings";
const globalContentTable = import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";

let cachedCatalogData = null;
let inflightCatalogPromise = null;

const mapPrice = (row) => (row.price_usd ? { usd: String(row.price_usd) } : undefined);

const sortBy = (list, key = "sort_order") =>
  [...(list || [])].sort((a, b) => Number(a?.[key] || 0) - Number(b?.[key] || 0));

const mapOffering = (row, section, sharedContent, reviewMap) => {
  const detailsSections = sortBy(row.detail_sections).map((section) => ({
    ...(section.heading ? { heading: section.heading } : {}),
    ...(section.description ? { description: section.description } : {}),
    ...(section.detail_items?.length ? { items: sortBy(section.detail_items).map((entry) => entry.text) } : {}),
  }));

  const checkoutOptions = Array.isArray(row.checkout) ? row.checkout[0]?.config || null : row.checkout?.config || null;

  const offeringSpecificReviews = reviewMap.byOffering[row.id] || [];
  const sharedBuyReviews = reviewMap.sharedBuy || [];
  const mergedReviews = [...offeringSpecificReviews, ...sharedBuyReviews];
  const ctaType = row.cta_type || (checkoutOptions ? "checkout" : "contact");
  const booking = row.booking_enabled
    ? {
        enabled: Boolean(row.booking_enabled),
        provider: row.booking_provider || "calcom",
        status: row.booking_status || "pending",
        externalId: row.booking_external_id || undefined,
        url: row.booking_url || undefined,
        ctaLabel: row.booking_cta_label || row.cta_label || section.cta_label || "Book now",
        durationMinutes: row.duration_minutes || undefined,
        sessionFormat: row.session_format || undefined,
        hostId: row.host_id || undefined,
        lastError: row.booking_last_error || undefined,
      }
    : undefined;
  const fallbackActionLink = section.action_link || row.action_link || undefined;

  return {
    id: row.id,
    title: row.title || "",
    imageUrl: row.image_url || undefined,
    imageAlt: row.image_alt || row.title || "Offering image",
    subtitle: row.subtitle || undefined,
    summary: row.summary || "",
    longDescription: row.long_description || undefined,
    price: mapPrice(row),
    ctaType,
    ctaLabel:
      (ctaType === "booking"
        ? booking?.ctaLabel
        : row.cta_label || section.cta_label) || undefined,
    actionLink: fallbackActionLink,
    checkoutFallbackMessage: section.checkout_fallback_message || row.checkout_fallback_message || undefined,
    purchase: section.purchase_label || section.purchase_link || row.purchase_label || row.purchase_link
      ? {
          label: section.purchase_label || row.purchase_label || "Email for access",
          link: section.purchase_link || row.purchase_link || "",
        }
      : undefined,
    manualSupport: section.manual_support_label || section.manual_support_link || row.manual_support_label || row.manual_support_link
      ? {
          label: section.manual_support_label || row.manual_support_label || "Email for support",
          link: section.manual_support_link || row.manual_support_link || "",
        }
      : undefined,
    checkoutOptions,
    paymentMethods: Array.isArray(section.payment_methods) && section.payment_methods.length
      ? section.payment_methods
      : sortBy(row.payment_methods).map((entry) => entry.method),
    manualInstructions: sharedContent.manualInstructions,
    legalNotes: sharedContent.legalNotes,
    closingNotes: sharedContent.closingNotes,
    detailsSections: detailsSections.length ? detailsSections : undefined,
    booking,
    reviews: mergedReviews,
    successStory:
      mergedReviews[0] ||
      sharedContent.successStory,
  };
};

const buildCatalog = (sections, offerings, sharedContent, reviewMap) => {
  const sectionsById = new Map(
    sections.map((section) => [
      section.id,
      {
        ...section,
        title: section.title || "",
        description: section.description || "",
        heroTitle: section.hero_title || section.title || "",
        heroSubtitle: section.hero_subtitle || "",
        heroDescription: section.hero_description || section.description || "",
        heroImageUrl: section.hero_image_url || undefined,
        heroCtaLabel: section.hero_cta_label || "Explore Offerings",
        heroCtaHref: section.hero_cta_href || `#${section.id}`,
        items: [],
      },
    ])
  );

  for (const offeringRow of offerings) {
    const section = sectionsById.get(offeringRow.section_id);
    if (!section) {
      continue;
    }
    section.items.push(mapOffering(offeringRow, section, sharedContent, reviewMap));
  }

  const buySections = Array.from(sectionsById.values()).filter((section) => section.items.length > 0);
  const offeringsIndex = buySections.reduce((acc, section) => {
    section.items.forEach((item) => {
      acc[item.id] = {
        ...item,
        section: { id: section.id, title: section.title, description: section.description },
      };
    });
    return acc;
  }, {});

  return {
    source: "supabase",
    buySections,
    offeringsIndex,
    offeringSupportOptions: Object.values(offeringsIndex).map((offering) => offering.title),
  };
};

const fetchCatalogFromSupabase = async () => {
  const [sectionsRes, offeringsRes, sharedContentRes, reviewsRes] = await Promise.all([
    supabase
      .from(sectionsTable)
      .select("id,title,description,cta_label,action_link,checkout_fallback_message,purchase_label,purchase_link,manual_support_label,manual_support_link,payment_methods,sort_order,is_active,hero_title,hero_subtitle,hero_description,hero_image_url,hero_cta_label,hero_cta_href")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from(offeringsTable)
      .select(
        `
          id,
          section_id,
          sort_order,
          is_active,
          title,
          image_url,
          image_alt,
          subtitle,
          summary,
          long_description,
          price_usd,
          cta_type,
          cta_label,
          action_link,
          booking_enabled,
          booking_provider,
          booking_status,
          booking_external_id,
          booking_url,
          booking_cta_label,
          duration_minutes,
          session_format,
          host_id,
          booking_last_error,
          checkout:storefront_checkout_configs(config),
          payment_methods:storefront_offering_payment_methods(sort_order,method),
          detail_sections:storefront_offering_detail_sections(
            sort_order,
            heading,
            description,
            detail_items:storefront_offering_detail_items(sort_order,text)
          )
        `
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from(globalContentTable)
      .select("manual_instructions,legal_notes,closing_notes,success_heading,success_quote,success_author")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from(reviewsTable)
      .select("id,placement,offering_id,heading,quote,author,image_url,image_alt,sort_order,is_active")
      .eq("is_active", true)
      .in("placement", ["buy", "global"])
      .order("sort_order", { ascending: true }),
  ]);

  if (sectionsRes.error) {
    throw new Error(sectionsRes.error.message || "Unable to fetch storefront sections.");
  }
  if (offeringsRes.error) {
    throw new Error(offeringsRes.error.message || "Unable to fetch storefront offerings.");
  }
  if (sharedContentRes.error) {
    throw new Error(sharedContentRes.error.message || "Unable to fetch storefront shared content.");
  }
  if (reviewsRes.error) {
    throw new Error(reviewsRes.error.message || "Unable to fetch storefront reviews.");
  }

  const sharedRow = sharedContentRes.data || {};
  const sharedContent = {
    manualInstructions: Array.isArray(sharedRow.manual_instructions) ? sharedRow.manual_instructions : [],
    legalNotes: Array.isArray(sharedRow.legal_notes) ? sharedRow.legal_notes : [],
    closingNotes: Array.isArray(sharedRow.closing_notes) ? sharedRow.closing_notes : [],
    successStory: sharedRow.success_quote
      ? {
          heading: sharedRow.success_heading || "Client result",
          quote: sharedRow.success_quote,
          ...(sharedRow.success_author ? { author: sharedRow.success_author } : {}),
        }
      : undefined,
  };

  const mappedReviews = (reviewsRes.data || []).map((row) => ({
    heading: row.heading || "Client result",
    quote: row.quote || "",
    ...(row.author ? { author: row.author } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.image_alt ? { imageAlt: row.image_alt } : {}),
    offeringId: row.offering_id || null,
  }));
  const reviewMap = {
    byOffering: mappedReviews.reduce((acc, review) => {
      if (!review.offeringId) {
        return acc;
      }
      if (!acc[review.offeringId]) {
        acc[review.offeringId] = [];
      }
      acc[review.offeringId].push({
        heading: review.heading,
        quote: review.quote,
        ...(review.author ? { author: review.author } : {}),
        ...(review.imageUrl ? { imageUrl: review.imageUrl } : {}),
        ...(review.imageAlt ? { imageAlt: review.imageAlt } : {}),
      });
      return acc;
    }, {}),
    sharedBuy: mappedReviews
      .filter((review) => !review.offeringId)
      .map((review) => ({
        heading: review.heading,
        quote: review.quote,
        ...(review.author ? { author: review.author } : {}),
        ...(review.imageUrl ? { imageUrl: review.imageUrl } : {}),
        ...(review.imageAlt ? { imageAlt: review.imageAlt } : {}),
      })),
  };

  return buildCatalog(sectionsRes.data || [], offeringsRes.data || [], sharedContent, reviewMap);
};

export const getOfferingsCatalog = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedCatalogData) {
    return cachedCatalogData;
  }

  if (!forceRefresh && inflightCatalogPromise) {
    return inflightCatalogPromise;
  }

  inflightCatalogPromise = (async () => {
    const catalog = await fetchCatalogFromSupabase();
    cachedCatalogData = catalog;
    inflightCatalogPromise = null;
    return catalog;
  })();

  return inflightCatalogPromise;
};

export const clearOfferingsCatalogCache = () => {
  cachedCatalogData = null;
  inflightCatalogPromise = null;
};
