import { useState } from "react";
import { supabase } from "../../supabase-client";
import {
  defaultCalcomHostId,
  checkoutConfigsTable,
  brandSettingsTable,
  themeSettingsTable,
  footerSettingsTable,
  faqSettingsTable,
  fromLines,
  globalContentTable,
  offeringsTable,
  reviewsTable,
  sectionsTable,
  siteLinksTable,
  siteSectionItemsTable,
  siteSectionsTable,
  slugify,
} from "./catalogAdminHelpers";

const parseUsdPrice = (value) => {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const formatUsdAmount = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

const buildCheckoutConfig = ({ id, title, priceUsd }) => {
  const unitAmount = Math.round(priceUsd * 100);
  const amount = formatUsdAmount(priceUsd);
  return {
    name: title || id,
    defaultCurrency: "usd",
    successPath: `/buy/${id}/status/success`,
    cancelPath: `/buy/${id}/status/cancel`,
    currencies: {
      usd: {
        label: `Pay ${amount} USD`,
        amount,
        unitAmount,
        mode: "payment",
      },
    },
    productId: id,
  };
};

const assertNoError = (error) => {
  if (error) {
    throw error;
  }
};

const persistCheckoutConfig = async ({ id, title, priceUsd, enabled }) => {
  if (!enabled) {
    const { error } = await supabase.from(checkoutConfigsTable).delete().eq("product_id", id);
    if (error) {
      throw error;
    }
    return null;
  }

  const config = buildCheckoutConfig({ id, title, priceUsd });
  const { error } = await supabase
    .from(checkoutConfigsTable)
    .upsert({ product_id: id, config, updated_at: new Date().toISOString() });
  if (error) {
    throw error;
  }
  return config;
};

export default function useCatalogAdminSaves({
  editor,
  getSectionIdForOffering,
  globalEditor,
  newOffering,
  newSection,
  offerings,
  refreshSettings,
  reviewsEditor,
  savedReviewsSnapshot,
  sections,
  selectedSection,
  selectedSectionId,
  setNewOffering,
  setNewSection,
  setOfferings,
  setReviewSaveSummary,
  setSavedReviewsSnapshot,
  setSections,
  setSelectedOfferingId,
  setSelectedSectionId,
  setShowNewOfferingForm,
  setShowNewSectionForm,
  setStatus,
  siteSettingsEditor,
}) {
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingOffering, setIsSavingOffering] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingSite, setIsSavingSite] = useState(false);
  const [isSavingReviews, setIsSavingReviews] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isCreatingOffering, setIsCreatingOffering] = useState(false);

  const syncBookingOffering = async (payload) => {
    const { data, error } = await supabase.functions.invoke("sync-booking-offering", {
      body: payload,
    });

    if (error) {
      return {
        booking_status: "failed",
        booking_last_error: error.message || "Unable to sync booking with Cal.com.",
      };
    }

    return data || {
      booking_status: "failed",
      booking_last_error: "Booking sync returned an empty response.",
    };
  };

  const handleSaveOffering = async () => {
    if (!editor) {
      return;
    }
    setIsSavingOffering(true);
    setStatus({ type: "idle", message: "" });
    try {
      const ctaType = editor.cta_type || "contact";
      const bookingEnabled = ctaType === "booking";
      const checkoutEnabled = ctaType === "checkout" || bookingEnabled;
      const priceUsd = parseUsdPrice(editor.price_usd);
      if (checkoutEnabled && priceUsd == null) {
        setStatus({ type: "error", message: "Add a USD price before enabling checkout or booking." });
        return;
      }
      const basePayload = {
        id: editor.id,
        section_id: editor.section_id,
        sort_order: Number(editor.sort_order || 0),
        is_active: Boolean(editor.is_active),
        title: editor.title || "",
        subtitle: editor.subtitle || null,
        summary: editor.summary || null,
        long_description: editor.long_description || null,
        price_usd: editor.price_usd || null,
        cta_type: ctaType,
        cta_label: editor.cta_label || null,
        action_link: editor.action_link || null,
        checkout_fallback_message: editor.checkout_fallback_message || null,
        image_url: editor.image_url || null,
        image_alt: editor.image_alt || null,
        booking_enabled: bookingEnabled,
        booking_provider: bookingEnabled ? "calcom" : null,
        booking_status: "pending",
        booking_external_id: editor.booking_external_id || null,
        booking_url: bookingEnabled ? editor.booking_url || null : null,
        booking_cta_label: bookingEnabled ? editor.booking_cta_label || null : null,
        duration_minutes: bookingEnabled ? Number(editor.duration_minutes || 60) : null,
        session_format: bookingEnabled ? "google-meet" : null,
        host_id: bookingEnabled ? editor.host_id || defaultCalcomHostId || null : null,
        booking_last_error: null,
      };

      const { error: offeringError } = await supabase.from(offeringsTable).upsert(basePayload);
      if (offeringError) {
        throw offeringError;
      }
      await persistCheckoutConfig({
        id: editor.id,
        title: editor.title || "",
        priceUsd,
        enabled: checkoutEnabled,
      });

      let syncedFields = {
        booking_status: basePayload.booking_status,
        booking_external_id: basePayload.booking_external_id,
        booking_url: basePayload.booking_url,
        booking_provider: basePayload.booking_provider,
        booking_last_error: null,
      };

      if (bookingEnabled || editor.booking_external_id) {
        const bookingSyncResult = await syncBookingOffering({
          id: editor.id,
          title: editor.title || "",
          summary: editor.summary || "",
          is_active: Boolean(editor.is_active),
          cta_type: ctaType,
          booking_enabled: bookingEnabled,
          booking_provider: "calcom",
          booking_external_id: editor.booking_external_id || null,
          duration_minutes: bookingEnabled ? Number(editor.duration_minutes || 60) : null,
          session_format: bookingEnabled ? "google-meet" : null,
          host_id: bookingEnabled ? editor.host_id || defaultCalcomHostId || null : null,
        });

        syncedFields = {
          booking_status: bookingSyncResult.booking_status || "failed",
          booking_external_id: bookingSyncResult.booking_external_id || null,
          booking_url: bookingSyncResult.booking_url || null,
          booking_provider: bookingEnabled ? "calcom" : null,
          booking_last_error: bookingSyncResult.booking_last_error || null,
        };

        const { error: syncPersistError } = await supabase
          .from(offeringsTable)
          .update({
            booking_status: syncedFields.booking_status,
            booking_external_id: syncedFields.booking_external_id,
            booking_url: syncedFields.booking_url,
            booking_provider: syncedFields.booking_provider,
            booking_last_error: syncedFields.booking_last_error,
            booking_last_synced_at: syncedFields.booking_status === "synced" ? new Date().toISOString() : null,
          })
          .eq("id", editor.id);

        if (syncPersistError) {
          throw syncPersistError;
        }
      }

      setOfferings((prev) =>
        prev.map((entry) =>
          entry.id === editor.id
            ? {
                ...entry,
                ...basePayload,
                ...syncedFields,
              }
            : entry,
        ),
      );
      setSelectedSectionId(editor.section_id);
      setStatus({
        type: syncedFields.booking_status === "failed" ? "error" : "success",
        message:
          syncedFields.booking_status === "failed"
            ? syncedFields.booking_last_error || "Product saved, but booking sync failed."
            : bookingEnabled
              ? "Product and booking synced successfully."
              : "Product saved successfully.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save product." });
    } finally {
      setIsSavingOffering(false);
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSection) {
      return;
    }

    setIsSavingSection(true);
    setStatus({ type: "idle", message: "" });
    try {
      const payload = {
        id: selectedSection.id,
        title: selectedSection.title || "",
        description: selectedSection.description || null,
        cta_label: selectedSection.cta_label || null,
        action_link: selectedSection.action_link || null,
        checkout_fallback_message: selectedSection.checkout_fallback_message || null,
        purchase_label: selectedSection.purchase_label || null,
        purchase_link: selectedSection.purchase_link || null,
        manual_support_label: selectedSection.manual_support_label || null,
        manual_support_link: selectedSection.manual_support_link || null,
        payment_methods: fromLines(selectedSection.paymentMethodsText),
        hero_title: selectedSection.hero_title || null,
        hero_subtitle: selectedSection.hero_subtitle || null,
        hero_description: selectedSection.hero_description || null,
        hero_image_url: selectedSection.hero_image_url || null,
        hero_cta_label: selectedSection.hero_cta_label || null,
        hero_cta_href: selectedSection.hero_cta_href || null,
        sort_order: Number(selectedSection.sort_order || 0),
        is_active: Boolean(selectedSection.is_active),
      };

      const { error } = await supabase.from(sectionsTable).upsert(payload);
      if (error) {
        throw error;
      }

      setSections((prev) =>
        prev.map((section) =>
          section.id === selectedSectionId
            ? {
                ...section,
                ...payload,
                paymentMethodsText: selectedSection.paymentMethodsText,
              }
            : section,
        ),
      );
      setStatus({ type: "success", message: "Product type saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save product type." });
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleCreateSection = async () => {
    const title = newSection.title.trim();
    if (!title) {
      setStatus({ type: "error", message: "Add a product type title first." });
      return;
    }

    setIsCreatingSection(true);
    setStatus({ type: "idle", message: "" });

    try {
      const baseId = slugify(title) || `type-${Date.now()}`;
      let nextId = baseId;
      let counter = 1;
      while (sections.some((section) => section.id === nextId)) {
        counter += 1;
        nextId = `${baseId}-${counter}`;
      }

      const payload = {
        id: nextId,
        title,
        description: newSection.description.trim() || null,
        cta_label: null,
        action_link: null,
        checkout_fallback_message: null,
        purchase_label: null,
        purchase_link: null,
        manual_support_label: null,
        manual_support_link: null,
        payment_methods: [],
        sort_order: sections.length,
        is_active: true,
      };

      const { error } = await supabase.from(sectionsTable).insert(payload);
      if (error) {
        throw error;
      }

      const nextSections = [...sections, { ...payload, paymentMethodsText: "" }].sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
      );
      setSections(nextSections);
      setSelectedSectionId(payload.id);
      setNewSection({ title: "", description: "" });
      setShowNewSectionForm(false);
      setStatus({ type: "success", message: "Product type created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to create product type." });
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleCreateOffering = async () => {
    const title = newOffering.title.trim();
    if (!selectedSectionId) {
      setStatus({ type: "error", message: "Select a product type before creating a product." });
      return;
    }
    if (!title) {
      setStatus({ type: "error", message: "Add a product title first." });
      return;
    }

    setIsCreatingOffering(true);
    setStatus({ type: "idle", message: "" });

    try {
      const baseId = slugify(title) || `offering-${Date.now()}`;
      let nextId = baseId;
      let counter = 1;
      while (offerings.some((offering) => offering.id === nextId)) {
        counter += 1;
        nextId = `${baseId}-${counter}`;
      }

      const scopedOfferings = offerings.filter((entry) => entry.section_id === selectedSectionId);
      const ctaType = newOffering.cta_type || "contact";
      const checkoutEnabled = ctaType === "checkout" || ctaType === "booking";
      const priceUsd = parseUsdPrice(newOffering.price_usd);
      if (checkoutEnabled && priceUsd == null) {
        setStatus({ type: "error", message: "Add a USD price before creating a checkout or booking product." });
        return;
      }
      const payload = {
        id: nextId,
        section_id: selectedSectionId,
        sort_order: scopedOfferings.length,
        is_active: true,
        title,
        subtitle: newOffering.subtitle.trim() || null,
        summary: null,
        long_description: null,
        price_usd: newOffering.price_usd || null,
        cta_type: ctaType,
        cta_label: null,
        action_link: null,
        checkout_fallback_message: null,
        image_url: null,
        image_alt: null,
        booking_enabled: ctaType === "booking",
        booking_provider: ctaType === "booking" ? "calcom" : null,
        booking_status: "pending",
        booking_external_id: null,
        booking_url: null,
        booking_cta_label: ctaType === "booking" ? "Book now" : null,
        duration_minutes: 60,
        session_format: "google-meet",
        host_id: defaultCalcomHostId || null,
        booking_last_error: null,
      };

      const { error } = await supabase.from(offeringsTable).insert(payload);
      if (error) {
        throw error;
      }
      await persistCheckoutConfig({
        id: payload.id,
        title: payload.title,
        priceUsd,
        enabled: checkoutEnabled,
      });

      setOfferings((prev) =>
        [...prev, payload].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
      );
      setSelectedOfferingId(payload.id);
      setNewOffering({ title: "", subtitle: "", price_usd: "", cta_type: "contact" });
      setShowNewOfferingForm(false);
      setStatus({ type: "success", message: "Product created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to create product." });
    } finally {
      setIsCreatingOffering(false);
    }
  };

  const handleSaveGlobalContent = async () => {
    setIsSavingGlobal(true);
    setStatus({ type: "idle", message: "" });
    try {
      const sharedContentPayload = {
        id: 1,
        manual_instructions: fromLines(globalEditor.manualInstructionsText),
        legal_notes: fromLines(globalEditor.legalNotesText),
        closing_notes: fromLines(globalEditor.closingNotesText),
      };

      const { error: sharedContentError } = await supabase.from(globalContentTable).upsert(sharedContentPayload);

      if (sharedContentError) {
        throw sharedContentError;
      }
      setStatus({ type: "success", message: "Shared content saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save shared content." });
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleSaveSiteSettings = async () => {
    setIsSavingSite(true);
    setStatus({ type: "idle", message: "" });
    try {
      const brandPayload = {
        id: 1,
        nav_title: siteSettingsEditor.brand.navTitle,
        full_title: siteSettingsEditor.brand.fullTitle,
        footer_tagline: siteSettingsEditor.brand.footerTagline,
        shop_label: siteSettingsEditor.brand.shopLabel,
        shop_href: siteSettingsEditor.brand.shopHref,
        support_email: siteSettingsEditor.brand.supportEmail,
        profile_image_url: siteSettingsEditor.profile.imageUrl,
        profile_image_alt: siteSettingsEditor.profile.imageAlt,
        profile_role_label: siteSettingsEditor.profile.roleLabel,
      };
      const themePayload = {
        id: 1,
        primary_color: siteSettingsEditor.theme.primary,
        primary_light_color: siteSettingsEditor.theme.primaryLight,
        secondary_color: siteSettingsEditor.theme.secondary,
        accent_color: siteSettingsEditor.theme.accent,
        dark_color: siteSettingsEditor.theme.dark,
      };
      const footerPayload = {
        id: 1,
        intro_eyebrow: siteSettingsEditor.footer.introEyebrow,
        intro_heading: siteSettingsEditor.footer.introHeading,
        status_label: siteSettingsEditor.footer.statusLabel,
        terms_label: siteSettingsEditor.footer.termsLabel,
        terms_href: siteSettingsEditor.footer.termsHref,
        privacy_label: siteSettingsEditor.footer.privacyLabel,
        privacy_href: siteSettingsEditor.footer.privacyHref,
        newsletter_form_action:
          siteSettingsEditor.sections.find((section) => section.id === "newsletter")?.formAction || null,
      };
      const faqPayload = {
        id: 1,
        faqs: Array.isArray(siteSettingsEditor.faqs) ? siteSettingsEditor.faqs : [],
      };

      const [{ error: brandError }, { error: themeError }, { error: footerError }, { error: faqError }] = await Promise.all([
        supabase.from(brandSettingsTable).upsert(brandPayload),
        supabase.from(themeSettingsTable).upsert(themePayload),
        supabase.from(footerSettingsTable).upsert(footerPayload),
        supabase.from(faqSettingsTable).upsert(faqPayload),
      ]);

      assertNoError(brandError);
      assertNoError(themeError);
      assertNoError(footerError);
      assertNoError(faqError);

      const sectionRows = siteSettingsEditor.sections.map((section, index) => ({
        key: section.id,
        label: section.label,
        anchor: section.anchor,
        is_enabled: Boolean(section.enabled),
        show_in_nav: Boolean(section.navVisible),
        show_in_footer: Boolean(section.footerVisible),
        sort_order: index,
        eyebrow: section.eyebrow || null,
        heading: section.heading || null,
        description: section.description || null,
        primary_cta_label: section.primaryCtaLabel || null,
        primary_cta_href: section.primaryCtaHref || null,
        secondary_cta_label: section.secondaryCtaLabel || null,
        secondary_cta_href: section.secondaryCtaHref || null,
        supporting_eyebrow: section.supportingEyebrow || null,
        supporting_heading: section.supportingHeading || null,
        supporting_description: section.supportingDescription || null,
        form_heading: section.formHeading || null,
        form_description: section.formDescription || null,
        form_submit_label: section.formSubmitLabel || null,
        form_disclaimer: section.formDisclaimer || null,
        form_action: section.formAction || null,
        featured_offering_id: section.featuredOfferingId || null,
      }));
      const { error: sectionsError } = await supabase.from(siteSectionsTable).upsert(sectionRows, {
        onConflict: "key",
      });
      assertNoError(sectionsError);

      const { error: deleteItemsError } = await supabase.from(siteSectionItemsTable).delete().not("key", "is", null);
      assertNoError(deleteItemsError);
      if (siteSettingsEditor.sectionItems.length) {
        const itemRows = siteSettingsEditor.sectionItems.map((item, index) => ({
          key: item.key,
          section_key: item.sectionKey,
          item_type: item.itemType || "card",
          title: item.title || null,
          description: item.description || null,
          label: item.label || null,
          href: item.href || null,
          icon: item.icon || null,
          image_url: item.imageUrl || null,
          image_alt: item.imageAlt || null,
          sort_order: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
          is_enabled: Boolean(item.enabled),
        }));
        const { error: itemsError } = await supabase.from(siteSectionItemsTable).insert(itemRows);
        assertNoError(itemsError);
      }

      const { error: deleteLinksError } = await supabase.from(siteLinksTable).delete().not("key", "is", null);
      assertNoError(deleteLinksError);
      if (siteSettingsEditor.links.length) {
        const linkRows = siteSettingsEditor.links.map((link, index) => ({
          key: link.key,
          group_key: link.groupKey,
          label: link.label || "Untitled",
          value: link.value || null,
          href: link.href || null,
          icon: link.icon || null,
          sort_order: Number.isFinite(Number(link.sortOrder)) ? Number(link.sortOrder) : index,
          is_enabled: Boolean(link.enabled),
        }));
        const { error: linksError } = await supabase.from(siteLinksTable).insert(linkRows);
        assertNoError(linksError);
      }

      await refreshSettings({ throwOnError: true });
      setStatus({ type: "success", message: "Website settings saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save website settings." });
    } finally {
      setIsSavingSite(false);
    }
  };

  const persistReviews = async (normalizedRows) => {
    setIsSavingReviews(true);
    setStatus({ type: "idle", message: "" });
    try {
      const invalid = normalizedRows.find((row) => !row.quote || !row.author);
      if (invalid) {
        throw new Error("Every review needs both quote and author.");
      }

      const { error: deleteError } = await supabase.from(reviewsTable).delete().gte("id", 0);
      if (deleteError) {
        throw deleteError;
      }

      if (normalizedRows.length) {
        const rowsForInsert = normalizedRows.map(({ id, ...row }) => row);
        const { data: insertedRows, error: insertError } = await supabase
          .from(reviewsTable)
          .insert(rowsForInsert)
          .select("id,placement,offering_id,heading,quote,author,image_url,image_alt,sort_order,is_active");
        if (insertError) {
          throw insertError;
        }
        setSavedReviewsSnapshot(
          (insertedRows || []).map((row) => ({
            ...row,
            section_id: row.offering_id ? getSectionIdForOffering(row.offering_id) : "",
            offering_id: row.offering_id || "",
          })),
        );
      } else {
        setSavedReviewsSnapshot([]);
      }
      setReviewSaveSummary(null);
      setStatus({ type: "success", message: "Reviews saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save reviews." });
    } finally {
      setIsSavingReviews(false);
    }
  };

  const handleSaveReviews = () => {
    const formatReviewLabel = (row) => {
      const primary = row.heading || row.author || "Untitled review";
      const placement = row.placement || "home";
      const offeringTitle = row.offering_id
        ? offerings.find((offering) => offering.id === row.offering_id)?.title || row.offering_id
        : null;

      if (placement === "buy" && offeringTitle) {
        return `${primary} (${placement}: ${offeringTitle})`;
      }

      return `${primary} (${placement})`;
    };

    const normalizeForDiff = (entries) =>
      entries.map((entry, index) => ({
        id: entry.id,
        placement: entry.placement || "home",
        offering_id: entry.offering_id || null,
        heading: entry.heading || null,
        quote: (entry.quote || "").trim(),
        author: (entry.author || "").trim(),
        image_url: (entry.image_url || "").trim() || null,
        image_alt: (entry.image_alt || "").trim() || null,
        sort_order: index,
        is_active: Boolean(entry.is_active),
      }));

    const normalizedRows = normalizeForDiff(reviewsEditor);
    const savedRows = normalizeForDiff(savedReviewsSnapshot);
    const savedMap = new Map(savedRows.map((row) => [row.id, row]));
    const nextMap = new Map(normalizedRows.map((row) => [row.id, row]));
    const addedRows = normalizedRows.filter((row) => String(row.id).startsWith("new-"));
    const deletedRows = savedRows.filter((row) => !nextMap.has(row.id));
    const modifiedRows = normalizedRows.filter((row) => {
      if (String(row.id).startsWith("new-")) {
        return false;
      }
      const previous = savedMap.get(row.id);
      return previous ? JSON.stringify(previous) !== JSON.stringify(row) : false;
    });

    const addedCount = addedRows.length;
    const deletedCount = deletedRows.length;
    const modifiedCount = modifiedRows.length;

    const changeSummary = [];
    if (addedCount) changeSummary.push(`${addedCount} added`);
    if (modifiedCount) changeSummary.push(`${modifiedCount} modified`);
    if (deletedCount) changeSummary.push(`${deletedCount} deleted`);

    if (!changeSummary.length) {
      setStatus({ type: "error", message: "No review changes to save." });
      return;
    }

    setReviewSaveSummary({
      normalizedRows,
      addedCount,
      modifiedCount,
      deletedCount,
      addedDetails: addedRows.map(formatReviewLabel),
      modifiedDetails: modifiedRows.map(formatReviewLabel),
      deletedDetails: deletedRows.map(formatReviewLabel),
    });
  };

  return {
    handleCreateOffering,
    handleCreateSection,
    handleSaveGlobalContent,
    handleSaveOffering,
    handleSaveReviews,
    handleSaveSection,
    handleSaveSiteSettings,
    isCreatingOffering,
    isCreatingSection,
    isSavingGlobal,
    isSavingOffering,
    isSavingReviews,
    isSavingSection,
    isSavingSite,
    persistReviews,
  };
}
