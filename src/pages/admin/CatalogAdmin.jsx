import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/AuthContext";
import { applyThemeVariables, useSiteSettings } from "../../context/SiteSettingsContext";
import { supabase } from "../../supabase-client";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Skeleton } from "../../components/ui/skeleton";
import { defaultSiteSettings, normalizeSiteSettingsFromRows } from "../../services/siteSettings";
import { Wand2 } from "lucide-react";
import { generateRandomTheme } from "../../utils/themeGenerator";

const sectionsTable = import.meta.env.VITE_SUPABASE_SECTIONS_TABLE || "storefront_sections";
const offeringsTable = import.meta.env.VITE_SUPABASE_OFFERINGS_TABLE || "storefront_offerings";
const globalContentTable = import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
const siteSectionsTable = import.meta.env.VITE_SUPABASE_SITE_SECTIONS_TABLE || "storefront_site_sections";
const siteSectionItemsTable = import.meta.env.VITE_SUPABASE_SITE_SECTION_ITEMS_TABLE || "storefront_site_section_items";
const siteLinksTable = import.meta.env.VITE_SUPABASE_SITE_LINKS_TABLE || "storefront_site_links";
const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";
const defaultCalcomHostId = import.meta.env.VITE_CALCOM_DEFAULT_HOST_ID || "";
const ctaTypeOptions = [
  { value: "contact", label: "Contact" },
  { value: "checkout", label: "Checkout" },
  { value: "booking", label: "Booking" },
];
const offeringModeMeta = {
  contact: {
    label: "Contact",
    description: "Visitors contact you manually after reading the offer.",
    badgeClass: "border-white/10 bg-white/5 text-white/70",
    accentClass: "text-white/70",
  },
  checkout: {
    label: "Checkout",
    description: "Visitors pay inside your storefront before receiving access.",
    badgeClass: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    accentClass: "text-amber-200",
  },
  booking: {
    label: "Booking",
    description: "Visitors pay first, then unlock the Google Meet booking step.",
    badgeClass: "border-teal-300/30 bg-teal-300/10 text-teal-100",
    accentClass: "text-teal-200",
  },
};

const toLines = (list) => (list || []).join("\n");
const fromLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createEmptyReview = () => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  placement: "home",
  section_id: "",
  offering_id: "",
  heading: "",
  quote: "",
  author: "",
  image_url: "",
  image_alt: "",
  sort_order: 0,
  is_active: true,
});

const siteSectionEditorMeta = {
  hero: {
    itemTitle: "Hero proof cards",
    itemDescription: "Short proof cards beneath the hero buttons.",
    itemType: "card",
    fields: ["title", "description"],
  },
  about: {
    itemTitle: "About proof metrics",
    itemDescription: "Headline proof points under the world map panel.",
    itemType: "metric",
    fields: ["title", "description"],
    advancedFields: ["descriptionSecondary", "supportingEyebrow", "supportingHeading", "supportingDescription", "supportingNote"],
  },
  services: {
    itemTitle: "Service pillars",
    itemDescription: "Feature cards explaining the service experience.",
    itemType: "card",
    fields: ["title", "description", "icon"],
  },
  resources: {
    itemTitle: "Resource links",
    itemDescription: "Cards shown inside the resources section.",
    itemType: "link",
    fields: ["title", "description", "label", "href"],
  },
  coaching: {
    itemTitle: "Coaching benefits",
    itemDescription: "Everything included in the featured coaching offer.",
    itemType: "benefit",
    fields: ["title"],
    advancedFields: ["supportingEyebrow", "supportingNote", "featuredOfferingId"],
  },
  contact: {
    itemTitle: "Contact methods",
    itemDescription: "Quick links shown above the form.",
    linkGroup: "contact",
    advancedFields: ["formHeading", "formDescription", "formSubmitLabel", "formDisclaimer"],
  },
  newsletter: {
    itemTitle: "Newsletter settings",
    itemDescription: "Signup button and helper note.",
    advancedFields: ["supportingNote", "formAction"],
  },
};

const siteLinkGroupMeta = [
  { key: "footer_offerings", title: "Footer offerings links", description: "The offerings column in the footer." },
  { key: "footer_resources", title: "Footer resource links", description: "External media and platform links." },
  { key: "footer_support", title: "Footer support links", description: "Support and utility links in the footer." },
  { key: "footer_social", title: "Footer social icons", description: "Icon links shown on the right side of the footer." },
];
const themeFieldMeta = [
  { key: "primary", label: "Primary", hint: "Buttons and active accents" },
  { key: "primaryLight", label: "Primary light", hint: "Hover states and soft glow" },
  { key: "secondary", label: "Secondary", hint: "Gradients and supporting color" },
  { key: "accent", label: "Accent", hint: "Highlights and contrast moments" },
  { key: "dark", label: "Dark background", hint: "Base canvas tone" },
];
const themePresets = [
  {
    label: "Default Theme",
    theme: { primary: "#06b6d4", primaryLight: "#67e8f9", secondary: "#8b5cf6", accent: "#ec4899", dark: "#0f172a" },
  },
  {
    label: "Ocean Ritual",
    theme: { primary: "#2dd4bf", primaryLight: "#99f6e4", secondary: "#0ea5e9", accent: "#f59e0b", dark: "#08111f" },
  },
  {
    label: "Rose Ember",
    theme: { primary: "#fb7185", primaryLight: "#fda4af", secondary: "#f97316", accent: "#facc15", dark: "#140b12" },
  },
  {
    label: "Midnight Bloom",
    theme: { primary: "#22d3ee", primaryLight: "#a5f3fc", secondary: "#8b5cf6", accent: "#ec4899", dark: "#0b1020" },
  },
];

const CatalogAdmin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { refreshSettings } = useSiteSettings();
  const [sections, setSections] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [editor, setEditor] = useState(null);
  const [reviewsEditor, setReviewsEditor] = useState([]);
  const [savedReviewsSnapshot, setSavedReviewsSnapshot] = useState([]);
  const [reviewSaveSummary, setReviewSaveSummary] = useState(null);
  const [globalEditor, setGlobalEditor] = useState({
    manualInstructionsText: "",
    legalNotesText: "",
    closingNotesText: "",
    faqs: [],
  });
  const [siteSettingsEditor, setSiteSettingsEditor] = useState(defaultSiteSettings);
  const [selectedSiteSectionId, setSelectedSiteSectionId] = useState("hero");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingOffering, setIsSavingOffering] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingSite, setIsSavingSite] = useState(false);
  const [isSavingReviews, setIsSavingReviews] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard");
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [showNewOfferingForm, setShowNewOfferingForm] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isCreatingOffering, setIsCreatingOffering] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
  });
  const [newOffering, setNewOffering] = useState({
    title: "",
    subtitle: "",
    price_usd: "",
    cta_type: "contact",
  });

  const sectionsById = useMemo(
    () => sections.reduce((acc, section) => ({ ...acc, [section.id]: section }), {}),
    [sections],
  );
  const offeringsBySection = useMemo(
    () =>
      offerings.reduce((acc, offering) => {
        if (!acc[offering.section_id]) {
          acc[offering.section_id] = [];
        }
        acc[offering.section_id].push(offering);
        return acc;
      }, {}),
    [offerings],
  );
  const offeringsForSelectedSection = useMemo(
    () => offeringsBySection[selectedSectionId] || [],
    [offeringsBySection, selectedSectionId],
  );
  const selectedSection = sectionsById[selectedSectionId] || null;
  const isFooterEditorSelected = selectedSiteSectionId === "__footer";
  const selectedSiteSection = isFooterEditorSelected
    ? null
    : siteSettingsEditor.sections.find((section) => section.id === selectedSiteSectionId) ||
    siteSettingsEditor.sections[0] ||
    null;
  const selectedSiteSectionIndex = siteSettingsEditor.sections.findIndex((section) => section.id === selectedSiteSection?.id);
  const selectedSiteSectionItems = useMemo(
    () =>
      siteSettingsEditor.sectionItems
        .filter((item) => item.sectionKey === selectedSiteSection?.id)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [selectedSiteSection?.id, siteSettingsEditor.sectionItems],
  );
  const selectedSiteSectionMeta = selectedSiteSection ? siteSectionEditorMeta[selectedSiteSection.id] || {} : {};
  const getSectionIdForOffering = (offeringId) =>
    offerings.find((entry) => entry.id === offeringId)?.section_id || "";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoadingData(true);
      setStatus({ type: "idle", message: "" });

      const [sectionsRes, offeringsRes, highlightsRes, globalRes, siteSectionsRes, siteSectionItemsRes, siteLinksRes, reviewsRes] = await Promise.all([
        supabase.from(sectionsTable).select("*").order("sort_order", { ascending: true }),
        supabase.from(offeringsTable).select("*").order("sort_order", { ascending: true }),
        supabase
          .from("storefront_offering_highlights")
          .select("offering_id,sort_order,text")
          .order("sort_order", { ascending: true }),
        supabase
          .from(globalContentTable)
          .select("manual_instructions,legal_notes,closing_notes,success_heading,success_quote,success_author,brand_nav_title,brand_full_title,brand_footer_tagline,brand_shop_label,brand_shop_href,brand_support_email,theme_primary,theme_primary_light,theme_secondary,theme_accent,theme_dark,profile_image_url,profile_image_alt,profile_role_label,footer_intro_eyebrow,footer_intro_heading,footer_status_label,footer_terms_label,footer_terms_href,footer_privacy_label,footer_privacy_href,newsletter_form_action,faqs")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from(siteSectionsTable)
          .select("key,label,anchor,is_enabled,show_in_nav,show_in_footer,sort_order,eyebrow,heading,description,description_secondary,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,supporting_eyebrow,supporting_heading,supporting_description,supporting_note,form_heading,form_description,form_submit_label,form_disclaimer,form_action,featured_offering_id")
          .order("sort_order", { ascending: true }),
        supabase
          .from(siteSectionItemsTable)
          .select("key,section_key,item_type,title,description,label,href,icon,image_url,image_alt,sort_order,is_enabled")
          .order("sort_order", { ascending: true }),
        supabase
          .from(siteLinksTable)
          .select("key,group_key,label,value,href,icon,sort_order,is_enabled")
          .order("group_key", { ascending: true })
          .order("sort_order", { ascending: true }),
        supabase
          .from(reviewsTable)
          .select("id,placement,offering_id,heading,quote,author,image_url,image_alt,sort_order,is_active")
          .order("placement", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
      ]);

      const firstError = [
        sectionsRes.error,
        offeringsRes.error,
        highlightsRes.error,
        globalRes.error,
        siteSectionsRes.error,
        siteSectionItemsRes.error,
        siteLinksRes.error,
        reviewsRes.error,
      ].find(Boolean);

      if (!isMounted) {
        return;
      }

      if (firstError) {
        setStatus({ type: "error", message: firstError.message || "Unable to load catalog." });
        setIsLoadingData(false);
        return;
      }

      const group = (rows, key) =>
        (rows || []).reduce((acc, row) => {
          if (!acc[row.offering_id]) {
            acc[row.offering_id] = [];
          }
          acc[row.offering_id].push(row[key]);
          return acc;
        }, {});

      const highlights = group(highlightsRes.data, "text");

      const mergedOfferings = (offeringsRes.data || []).map((row) => ({
        ...row,
        cta_type: row.cta_type || "contact",
        booking_enabled: Boolean(row.booking_enabled),
        booking_provider: row.booking_provider || (row.booking_enabled ? "calcom" : null),
        booking_status: row.booking_status || "pending",
        booking_cta_label: row.booking_cta_label || "",
        duration_minutes: row.duration_minutes || 60,
        session_format: row.session_format || "google-meet",
        host_id: row.host_id || defaultCalcomHostId,
        booking_last_error: row.booking_last_error || "",
        highlights: highlights[row.id] || [],
      }));
      const getLoadedSectionIdForOffering = (offeringId) =>
        mergedOfferings.find((entry) => entry.id === offeringId)?.section_id || "";

      const globalData = globalRes.data || {};
      setGlobalEditor({
        manualInstructionsText: toLines(globalData.manual_instructions || []),
        legalNotesText: toLines(globalData.legal_notes || []),
        closingNotesText: toLines(globalData.closing_notes || []),
        faqs: Array.isArray(globalData.faqs) ? globalData.faqs : [],
      });
      setSiteSettingsEditor(
        normalizeSiteSettingsFromRows({
          global: globalData,
          sections: siteSectionsRes.data || [],
          sectionItems: siteSectionItemsRes.data || [],
          links: siteLinksRes.data || [],
        }),
      );

      setReviewsEditor(
        (reviewsRes.data || []).map((row) => ({
          ...row,
          section_id: row.offering_id ? getLoadedSectionIdForOffering(row.offering_id) : "",
          offering_id: row.offering_id || "",
        })),
      );
      setSavedReviewsSnapshot(
        (reviewsRes.data || []).map((row) => ({
          ...row,
          section_id: row.offering_id ? getLoadedSectionIdForOffering(row.offering_id) : "",
          offering_id: row.offering_id || "",
        })),
      );
      setSections(
        (sectionsRes.data || []).map((section) => ({
          ...section,
          paymentMethodsText: toLines(section.payment_methods || []),
        })),
      );
      setOfferings(mergedOfferings);
      if (!selectedSectionId && sectionsRes.data?.length) {
        setSelectedSectionId(sectionsRes.data[0].id);
      }
      setIsLoadingData(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    applyThemeVariables(siteSettingsEditor.theme);
  }, [isAdmin, siteSettingsEditor.theme]);

  useEffect(() => {
    if (!siteSettingsEditor.sections.length) {
      return;
    }

    if (
      !selectedSiteSectionId ||
      (!isFooterEditorSelected && !siteSettingsEditor.sections.some((section) => section.id === selectedSiteSectionId))
    ) {
      setSelectedSiteSectionId(siteSettingsEditor.sections[0].id);
    }
  }, [isFooterEditorSelected, selectedSiteSectionId, siteSettingsEditor.sections]);

  useEffect(() => {
    if (!sections.length) {
      return;
    }

    if (!selectedSectionId || !sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  useEffect(() => {
    if (!selectedSectionId) {
      setSelectedOfferingId("");
      return;
    }

    const scopedOfferings = offerings.filter((entry) => entry.section_id === selectedSectionId);
    if (!scopedOfferings.length) {
      setSelectedOfferingId("");
      return;
    }

    if (!scopedOfferings.some((entry) => entry.id === selectedOfferingId)) {
      setSelectedOfferingId(scopedOfferings[0].id);
    }
  }, [offerings, selectedOfferingId, selectedSectionId]);

  useEffect(() => {
    const selected = offerings.find((entry) => entry.id === selectedOfferingId);
    if (!selected) {
      setEditor(null);
      return;
    }
    setEditor({
      ...selected,
      cta_type: selected.cta_type || "contact",
      booking_enabled: Boolean(selected.booking_enabled),
      booking_provider: selected.booking_provider || (selected.cta_type === "booking" ? "calcom" : null),
      booking_status: selected.booking_status || "pending",
      booking_cta_label: selected.booking_cta_label || "",
      duration_minutes: selected.duration_minutes || 60,
      session_format: selected.session_format || "google-meet",
      host_id: selected.host_id || defaultCalcomHostId,
      booking_last_error: selected.booking_last_error || "",
      highlightsText: toLines(selected.highlights),
    });
  }, [offerings, selectedOfferingId]);

  const updateEditor = (name, value) => setEditor((prev) => ({ ...prev, [name]: value }));
  const updateSectionEditor = (name, value) => {
    setSections((prev) =>
      prev.map((section) => (section.id === selectedSectionId ? { ...section, [name]: value } : section)),
    );
  };
  const updateGlobalEditor = (name, value) => setGlobalEditor((prev) => ({ ...prev, [name]: value }));
  const updateSiteSettings = (group, key, value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  const applyThemePreset = (theme) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...theme,
      },
    }));
  const updateSiteSection = (sectionId, key, value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, [key]: value } : section)),
    }));
  const updateSiteFooter = (key, value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [key]: value,
      },
    }));
  const updateSiteSectionItem = (itemKey, key, value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      sectionItems: prev.sectionItems.map((item) => (item.key === itemKey ? { ...item, [key]: value } : item)),
    }));
  const addSiteSectionItem = (sectionKey, itemType = "card") =>
    setSiteSettingsEditor((prev) => {
      const scoped = prev.sectionItems.filter((item) => item.sectionKey === sectionKey);
      return {
        ...prev,
        sectionItems: [
          ...prev.sectionItems,
          {
            key: `site-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sectionKey,
            itemType,
            title: "",
            description: "",
            label: "",
            href: "",
            icon: "",
            imageUrl: "",
            imageAlt: "",
            sortOrder: scoped.length,
            enabled: true,
          },
        ],
      };
    });
  const removeSiteSectionItem = (itemKey) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      sectionItems: prev.sectionItems.filter((item) => item.key !== itemKey),
    }));
  const moveSiteSectionItem = (itemKey, direction) =>
    setSiteSettingsEditor((prev) => {
      const item = prev.sectionItems.find((entry) => entry.key === itemKey);
      if (!item) {
        return prev;
      }
      const scoped = prev.sectionItems
        .filter((entry) => entry.sectionKey === item.sectionKey)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      const currentIndex = scoped.findIndex((entry) => entry.key === itemKey);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= scoped.length) {
        return prev;
      }
      const nextScoped = [...scoped];
      const [moved] = nextScoped.splice(currentIndex, 1);
      nextScoped.splice(nextIndex, 0, moved);
      return {
        ...prev,
        sectionItems: prev.sectionItems.map((entry) => {
          if (entry.sectionKey !== item.sectionKey) {
            return entry;
          }
          const reorderedIndex = nextScoped.findIndex((candidate) => candidate.key === entry.key);
          return reorderedIndex >= 0 ? { ...entry, sortOrder: reorderedIndex } : entry;
        }),
      };
    });
  const updateSiteLink = (linkKey, key, value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      links: prev.links.map((link) => (link.key === linkKey ? { ...link, [key]: value } : link)),
    }));
  const addSiteLink = (groupKey) =>
    setSiteSettingsEditor((prev) => {
      const scoped = prev.links.filter((link) => link.groupKey === groupKey);
      return {
        ...prev,
        links: [
          ...prev.links,
          {
            key: `site-link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            groupKey,
            label: "",
            value: "",
            href: "",
            icon: "",
            sortOrder: scoped.length,
            enabled: true,
          },
        ],
      };
    });
  const removeSiteLink = (linkKey) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      links: prev.links.filter((link) => link.key !== linkKey),
    }));
  const moveSiteLink = (linkKey, direction) =>
    setSiteSettingsEditor((prev) => {
      const link = prev.links.find((entry) => entry.key === linkKey);
      if (!link) {
        return prev;
      }
      const scoped = prev.links
        .filter((entry) => entry.groupKey === link.groupKey)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      const currentIndex = scoped.findIndex((entry) => entry.key === linkKey);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= scoped.length) {
        return prev;
      }
      const nextScoped = [...scoped];
      const [moved] = nextScoped.splice(currentIndex, 1);
      nextScoped.splice(nextIndex, 0, moved);
      return {
        ...prev,
        links: prev.links.map((entry) => {
          if (entry.groupKey !== link.groupKey) {
            return entry;
          }
          const reorderedIndex = nextScoped.findIndex((candidate) => candidate.key === entry.key);
          return reorderedIndex >= 0 ? { ...entry, sortOrder: reorderedIndex } : entry;
        }),
      };
    });
  const moveSiteSection = (sectionId, direction) =>
    setSiteSettingsEditor((prev) => {
      const currentIndex = prev.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.sections.length) {
        return prev;
      }
      const nextSections = [...prev.sections];
      const [entry] = nextSections.splice(currentIndex, 1);
      nextSections.splice(nextIndex, 0, entry);
      return { ...prev, sections: nextSections };
    });
  const updateReviewEditor = (index, key, value) => {
    setReviewsEditor((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry)));
  };
  const updateNewSection = (name, value) => setNewSection((prev) => ({ ...prev, [name]: value }));
  const updateNewOffering = (name, value) => setNewOffering((prev) => ({ ...prev, [name]: value }));

  const uploadImageToStorage = async (file, folder) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeBaseName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "image";
    const filePath = `${folder}/${Date.now()}-${safeBaseName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("Image uploaded, but a public URL could not be generated.");
    }

    return data.publicUrl;
  };

  const handleOfferingImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) {
      return;
    }

    setUploadingTarget("offering-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, `offerings/${editor.id}`);
      updateEditor("image_url", publicUrl);
      if (!editor.image_alt) {
        updateEditor("image_alt", editor.title || file.name);
      }
      setStatus({ type: "success", message: "Offering image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload offering image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleHeroImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedSection) {
      return;
    }

    setUploadingTarget("hero-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, `sections/${selectedSection.id}/hero`);
      updateSectionEditor("hero_image_url", publicUrl);
      setStatus({ type: "success", message: "Hero image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload hero image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadingTarget("site-profile-image");
    setStatus({ type: "idle", message: "" });
    try {
      const publicUrl = await uploadImageToStorage(file, "site/profile");
      updateSiteSettings("profile", "imageUrl", publicUrl);
      if (!siteSettingsEditor.profile.imageAlt) {
        updateSiteSettings("profile", "imageAlt", file.name);
      }
      setStatus({ type: "success", message: "Profile image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload profile image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const handleReviewImageUpload = async (event, index) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadingTarget(`review-image-${index}`);
    setStatus({ type: "idle", message: "" });
    try {
      const review = reviewsEditor[index];
      const folder = review?.offering_id ? `reviews/${review.offering_id}` : "reviews/general";
      const publicUrl = await uploadImageToStorage(file, folder);
      updateReviewEditor(index, "image_url", publicUrl);
      if (!review?.image_alt) {
        updateReviewEditor(index, "image_alt", review?.author || review?.heading || file.name);
      }
      setStatus({ type: "success", message: "Review image uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to upload review image." });
    } finally {
      setUploadingTarget("");
    }
  };

  const replaceRows = async (table, offeringId, rows) => {
    const { error: deleteError } = await supabase.from(table).delete().eq("offering_id", offeringId);
    if (deleteError) {
      throw deleteError;
    }
    if (!rows.length) {
      return;
    }
    const { error: insertError } = await supabase.from(table).insert(rows);
    if (insertError) {
      throw insertError;
    }
  };

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
        booking_status: bookingEnabled ? "pending" : "pending",
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

      await replaceRows(
        "storefront_offering_highlights",
        editor.id,
        fromLines(editor.highlightsText).map((text, index) => ({ offering_id: editor.id, sort_order: index, text })),
      );

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
              highlights: fromLines(editor.highlightsText),
            }
            : entry,
        ),
      );
      setSelectedSectionId(editor.section_id);
      setStatus({
        type: syncedFields.booking_status === "failed" ? "error" : "success",
        message:
          syncedFields.booking_status === "failed"
            ? syncedFields.booking_last_error || "Offering saved, but booking sync failed."
            : bookingEnabled
              ? "Offering and booking synced successfully."
              : "Offering saved successfully.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save offering." });
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
      setStatus({ type: "success", message: "Offering type saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save offering type." });
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleCreateSection = async () => {
    const title = newSection.title.trim();
    if (!title) {
      setStatus({ type: "error", message: "Add an offering type title first." });
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
      setStatus({ type: "success", message: "Offering type created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to create offering type." });
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleCreateOffering = async () => {
    const title = newOffering.title.trim();
    if (!selectedSectionId) {
      setStatus({ type: "error", message: "Select an offering type before creating an offering." });
      return;
    }
    if (!title) {
      setStatus({ type: "error", message: "Add an offering title first." });
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
        cta_type: newOffering.cta_type || "contact",
        cta_label: null,
        action_link: null,
        checkout_fallback_message: null,
        image_url: null,
        image_alt: null,
        booking_enabled: (newOffering.cta_type || "contact") === "booking",
        booking_provider: (newOffering.cta_type || "contact") === "booking" ? "calcom" : null,
        booking_status: "pending",
        booking_external_id: null,
        booking_url: null,
        booking_cta_label: (newOffering.cta_type || "contact") === "booking" ? "Book now" : null,
        duration_minutes: 60,
        session_format: "google-meet",
        host_id: defaultCalcomHostId || null,
        booking_last_error: null,
      };

      const { error } = await supabase.from(offeringsTable).insert(payload);
      if (error) {
        throw error;
      }

      const nextOffering = {
        ...payload,
        highlights: [],
        paymentMethods: [],
      };
      setOfferings((prev) =>
        [...prev, nextOffering].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
      );
      setSelectedOfferingId(payload.id);
      setNewOffering({ title: "", subtitle: "", price_usd: "", cta_type: "contact" });
      setShowNewOfferingForm(false);
      setStatus({ type: "success", message: "Offering created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to create offering." });
    } finally {
      setIsCreatingOffering(false);
    }
  };

  const handleSaveGlobalContent = async () => {
    setIsSavingGlobal(true);
    setStatus({ type: "idle", message: "" });
    try {
      const payload = {
        id: 1,
        manual_instructions: fromLines(globalEditor.manualInstructionsText),
        legal_notes: fromLines(globalEditor.legalNotesText),
        closing_notes: fromLines(globalEditor.closingNotesText),
        faqs: globalEditor.faqs || [],
      };
      const { error } = await supabase.from(globalContentTable).upsert(payload);
      if (error) {
        throw error;
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
      const globalPayload = {
        id: 1,
        brand_nav_title: siteSettingsEditor.brand.navTitle,
        brand_full_title: siteSettingsEditor.brand.fullTitle,
        brand_footer_tagline: siteSettingsEditor.brand.footerTagline,
        brand_shop_label: siteSettingsEditor.brand.shopLabel,
        brand_shop_href: siteSettingsEditor.brand.shopHref,
        brand_support_email: siteSettingsEditor.brand.supportEmail,
        theme_primary: siteSettingsEditor.theme.primary,
        theme_primary_light: siteSettingsEditor.theme.primaryLight,
        theme_secondary: siteSettingsEditor.theme.secondary,
        theme_accent: siteSettingsEditor.theme.accent,
        theme_dark: siteSettingsEditor.theme.dark,
        profile_image_url: siteSettingsEditor.profile.imageUrl,
        profile_image_alt: siteSettingsEditor.profile.imageAlt,
        profile_role_label: siteSettingsEditor.profile.roleLabel,
        footer_intro_eyebrow: siteSettingsEditor.footer.introEyebrow,
        footer_intro_heading: siteSettingsEditor.footer.introHeading,
        footer_status_label: siteSettingsEditor.footer.statusLabel,
        footer_terms_label: siteSettingsEditor.footer.termsLabel,
        footer_terms_href: siteSettingsEditor.footer.termsHref,
        footer_privacy_label: siteSettingsEditor.footer.privacyLabel,
        footer_privacy_href: siteSettingsEditor.footer.privacyHref,
        newsletter_form_action:
          siteSettingsEditor.sections.find((section) => section.id === "newsletter")?.formAction || null,
      };
      const { error: globalError } = await supabase.from(globalContentTable).upsert(globalPayload);
      if (globalError) {
        throw globalError;
      }

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
        description_secondary: section.descriptionSecondary || null,
        primary_cta_label: section.primaryCtaLabel || null,
        primary_cta_href: section.primaryCtaHref || null,
        secondary_cta_label: section.secondaryCtaLabel || null,
        secondary_cta_href: section.secondaryCtaHref || null,
        supporting_eyebrow: section.supportingEyebrow || null,
        supporting_heading: section.supportingHeading || null,
        supporting_description: section.supportingDescription || null,
        supporting_note: section.supportingNote || null,
        form_heading: section.formHeading || null,
        form_description: section.formDescription || null,
        form_submit_label: section.formSubmitLabel || null,
        form_disclaimer: section.formDisclaimer || null,
        form_action: section.formAction || null,
        featured_offering_id: section.featuredOfferingId || null,
      }));
      const { error: sectionsError } = await supabase.from(siteSectionsTable).upsert(sectionRows, { onConflict: "key" });
      if (sectionsError) {
        throw sectionsError;
      }

      const { error: deleteItemsError } = await supabase.from(siteSectionItemsTable).delete().not("key", "is", null);
      if (deleteItemsError) {
        throw deleteItemsError;
      }
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
        if (itemsError) {
          throw itemsError;
        }
      }

      const { error: deleteLinksError } = await supabase.from(siteLinksTable).delete().not("key", "is", null);
      if (deleteLinksError) {
        throw deleteLinksError;
      }
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
        if (linksError) {
          throw linksError;
        }
      }

      await refreshSettings();
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

  const handleSaveReviews = async () => {
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

  const selectedModeMeta = offeringModeMeta[editor?.cta_type || "contact"] || offeringModeMeta.contact;

  if (isLoading) {
    return <div className="min-h-screen bg-gray-950 p-8 text-white">Checking account...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-white">
        <p className="rounded-2xl border border-rose-300/40 bg-rose-300/10 p-4">Access denied. Admin account required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <main className="mx-auto max-w-7xl space-y-6 px-6 pb-20 pt-32">
        <h1 className="text-3xl font-semibold">Catalog Admin</h1>
        {status.message ? (
          <p
            className={`rounded-2xl border p-3 text-sm ${status.type === "error"
              ? "border-rose-300/40 bg-rose-300/10 text-rose-100"
              : "border-teal-300/40 bg-teal-300/10 text-teal-100"
              }`}
          >
            {status.message}
          </p>
        ) : null}

        {isLoadingData ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#11161f] p-1.5">
              <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-52 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Skeleton className="mb-6 h-8 w-1/4 bg-white/10" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
              </div>
            </div>
          </div>
        ) : null}

        {!isLoadingData ? (
          <div className="space-y-6">
            <ToggleGroup
              type="single"
              value={activeAdminTab}
              onValueChange={(value) => {
                if (value) {
                  setActiveAdminTab(value);
                }
              }}
              variant="outline"
              className="flex w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#11161f] p-1.5"
            >
              <ToggleGroupItem value="dashboard">Dashboard</ToggleGroupItem>
              <ToggleGroupItem value="site">Website</ToggleGroupItem>
              <ToggleGroupItem value="offerings">Offerings</ToggleGroupItem>
              <ToggleGroupItem value="shared">Shared Checkout Content</ToggleGroupItem>
              <ToggleGroupItem value="reviews">Reviews</ToggleGroupItem>
            </ToggleGroup>

            {activeAdminTab === "dashboard" ? <AdminDashboard /> : null}

            {activeAdminTab === "site" ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200/80">Website editor</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      Edit the public website with section-first controls instead of a raw settings dump.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      Brand, profile, and theme live above. Homepage sections are edited one at a time below so the admin can
                      focus on what visitors actually see.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Brand and navigation</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Navigation title</span>
                        <input
                          value={siteSettingsEditor.brand.navTitle}
                          onChange={(event) => updateSiteSettings("brand", "navTitle", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Full brand title</span>
                        <input
                          value={siteSettingsEditor.brand.fullTitle}
                          onChange={(event) => updateSiteSettings("brand", "fullTitle", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Footer tagline</span>
                        <textarea
                          value={siteSettingsEditor.brand.footerTagline}
                          onChange={(event) => updateSiteSettings("brand", "footerTagline", event.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="flex-1 space-y-1 text-xs text-white/60">
                          <span>Shop button label</span>
                          <input
                            value={siteSettingsEditor.brand.shopLabel}
                            onChange={(event) => updateSiteSettings("brand", "shopLabel", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                        <label className="flex-1 space-y-1 text-xs text-white/60">
                          <span>Shop button link</span>
                          <input
                            value={siteSettingsEditor.brand.shopHref}
                            onChange={(event) => updateSiteSettings("brand", "shopHref", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                      </div>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Support email</span>
                        <input
                          value={siteSettingsEditor.brand.supportEmail}
                          onChange={(event) => updateSiteSettings("brand", "supportEmail", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Profile media</p>
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                          {uploadingTarget === "site-profile-image" ? "Uploading..." : "Upload profile image"}
                        </label>
                        {siteSettingsEditor.profile.imageUrl ? (
                          <a
                            href={siteSettingsEditor.profile.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-white/55 underline-offset-4 hover:text-white hover:underline"
                          >
                            Preview image
                          </a>
                        ) : null}
                      </div>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile image URL</span>
                        <input
                          value={siteSettingsEditor.profile.imageUrl}
                          onChange={(event) => updateSiteSettings("profile", "imageUrl", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile image alt</span>
                        <input
                          value={siteSettingsEditor.profile.imageAlt}
                          onChange={(event) => updateSiteSettings("profile", "imageAlt", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-white/60">
                        <span>Profile role label</span>
                        <input
                          value={siteSettingsEditor.profile.roleLabel}
                          onChange={(event) => updateSiteSettings("profile", "roleLabel", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Theme direction</p>
                        <p className="mt-1 text-xs text-white/55">A compact palette editor with presets and live swatches, not just five raw hex inputs.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {themePresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyThemePreset(preset.theme)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-100"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {themeFieldMeta.map(({ key, label, hint }) => (
                        <label
                          key={key}
                          className="min-w-[180px] flex-1 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div
                            className="h-16 rounded-xl border border-white/10"
                            style={{ backgroundColor: siteSettingsEditor.theme[key] }}
                          />
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="color"
                              value={siteSettingsEditor.theme[key]}
                              onChange={(event) => updateSiteSettings("theme", key, event.target.value)}
                              className="h-11 w-12 rounded-xl border border-white/10 bg-black/40 p-1"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{label}</p>
                              <p className="mt-1 text-xs text-white/45">{hint}</p>
                            </div>
                          </div>
                          <input
                            value={siteSettingsEditor.theme[key]}
                            onChange={(event) => updateSiteSettings("theme", key, event.target.value)}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Website sections</p>
                        <p className="mt-1 text-xs text-white/55">Choose a section on the left, then edit the exact content block visitors see on the right.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 xl:flex-row">
                      <div className="min-w-0 xl:w-[340px] xl:h-[calc(100vh-280px)] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-2.5">
                          {siteSettingsEditor.sections.map((section, index) => (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setSelectedSiteSectionId(section.id)}
                              className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${selectedSiteSection?.id === section.id
                                  ? "border-teal-300/35 bg-teal-300/10 shadow-[0_10px_30px_rgba(45,212,191,0.08)]"
                                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-white">{section.label}</p>
                                    {!section.enabled ? (
                                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
                                        Hidden
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs text-white/50">{section.heading || "No heading yet."}</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {section.navVisible ? <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Nav</span> : null}
                                    {section.footerVisible ? <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Footer</span> : null}
                                  </div>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/50">{index + 1}</span>
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedSiteSectionId("__footer")}
                            className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${isFooterEditorSelected
                                ? "border-teal-300/35 bg-teal-300/10 shadow-[0_10px_30px_rgba(45,212,191,0.08)]"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-white">Footer</p>
                                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">
                                    Global
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-white/50">
                                  Edit footer intro copy, legal links, and all footer link groups in one place.
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/50">
                                F
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {isFooterEditorSelected ? (
                        <div className="min-w-0 flex-1 rounded-[1.7rem] border border-white/10 bg-black/10 p-5 xl:h-[calc(100vh-280px)] overflow-y-auto">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Editing section</p>
                              <h3 className="mt-2 text-2xl font-semibold text-white">Footer</h3>
                              <p className="mt-2 max-w-2xl text-sm text-white/55">Treat the footer like a real content section: intro copy, legal copy, and each link column are edited here.</p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-4">
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer eyebrow</span>
                              <input value={siteSettingsEditor.footer.introEyebrow} onChange={(event) => updateSiteFooter("introEyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer heading</span>
                              <textarea value={siteSettingsEditor.footer.introHeading} onChange={(event) => updateSiteFooter("introHeading", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Footer tagline</span>
                              <textarea value={siteSettingsEditor.brand.footerTagline} onChange={(event) => updateSiteSettings("brand", "footerTagline", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Status pill label</span>
                              <input value={siteSettingsEditor.footer.statusLabel} onChange={(event) => updateSiteFooter("statusLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Terms label</span>
                                <input value={siteSettingsEditor.footer.termsLabel} onChange={(event) => updateSiteFooter("termsLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Terms link</span>
                                <input value={siteSettingsEditor.footer.termsHref} onChange={(event) => updateSiteFooter("termsHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Privacy label</span>
                                <input value={siteSettingsEditor.footer.privacyLabel} onChange={(event) => updateSiteFooter("privacyLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Privacy link</span>
                                <input value={siteSettingsEditor.footer.privacyHref} onChange={(event) => updateSiteFooter("privacyHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>

                            <div className="border-t border-white/10 pt-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Footer link groups</p>
                              <div className="mt-4 flex flex-col gap-5">
                                {siteLinkGroupMeta.map((group) => {
                                  const groupLinks = siteSettingsEditor.links
                                    .filter((link) => link.groupKey === group.key)
                                    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
                                  return (
                                    <div key={group.key} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-white">{group.title}</p>
                                          <p className="mt-1 text-xs text-white/55">{group.description}</p>
                                        </div>
                                        <button type="button" onClick={() => addSiteLink(group.key)} className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                                          Add link
                                        </button>
                                      </div>
                                      <div className="mt-4 flex flex-col divide-y divide-white/10">
                                        {groupLinks.map((link, index) => (
                                          <div key={link.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                                <input type="checkbox" checked={Boolean(link.enabled)} onChange={(event) => updateSiteLink(link.key, "enabled", event.target.checked)} />
                                                Visible
                                              </label>
                                              <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => moveSiteLink(link.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                                <button type="button" onClick={() => moveSiteLink(link.key, 1)} disabled={index === groupLinks.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                                <button type="button" onClick={() => removeSiteLink(link.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>Label</span>
                                                <input value={link.label || ""} onChange={(event) => updateSiteLink(link.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>URL</span>
                                                <input value={link.href || ""} onChange={(event) => updateSiteLink(link.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                                <span>Display value</span>
                                                <input value={link.value || ""} onChange={(event) => updateSiteLink(link.key, "value", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                              <label className="w-full space-y-1 text-xs text-white/60 sm:w-48">
                                                <span>Icon key</span>
                                                <input value={link.icon || ""} onChange={(event) => updateSiteLink(link.key, "icon", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                              </label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : selectedSiteSection ? (
                        <div className="min-w-0 flex-1 rounded-[1.7rem] border border-white/10 bg-black/10 p-5 xl:h-[calc(100vh-280px)] overflow-y-auto">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Editing section</p>
                              <h3 className="mt-2 text-2xl font-semibold text-white">{selectedSiteSection.label}</h3>
                              <p className="mt-2 max-w-2xl text-sm text-white/55">Update this section's copy, buttons, and visibility without scanning unrelated fields.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveSiteSection(selectedSiteSection.id, -1)}
                                disabled={selectedSiteSectionIndex <= 0}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40"
                              >
                                Move up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSiteSection(selectedSiteSection.id, 1)}
                                disabled={selectedSiteSectionIndex === siteSettingsEditor.sections.length - 1}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40"
                              >
                                Move down
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.enabled)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "enabled", event.target.checked)} />
                              Show on website
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.navVisible)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "navVisible", event.target.checked)} />
                              Show in navigation
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                              <input type="checkbox" checked={Boolean(selectedSiteSection.footerVisible)} onChange={(event) => updateSiteSection(selectedSiteSection.id, "footerVisible", event.target.checked)} />
                              Show in footer
                            </label>
                          </div>

                          <div className="mt-5 flex flex-col gap-4">
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Display label</span>
                              <input value={selectedSiteSection.label} onChange={(event) => updateSiteSection(selectedSiteSection.id, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Eyebrow</span>
                              <input value={selectedSiteSection.eyebrow || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "eyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Heading</span>
                              <input value={selectedSiteSection.heading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "heading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>
                            <label className="space-y-1 text-xs text-white/60">
                              <span>Description</span>
                              <textarea value={selectedSiteSection.description || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "description", event.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                            </label>

                            {selectedSiteSectionMeta.advancedFields?.includes("descriptionSecondary") ? (
                              <label className="space-y-1 text-xs text-white/60">
                                <span>Secondary paragraph</span>
                                <textarea value={selectedSiteSection.descriptionSecondary || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "descriptionSecondary", event.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            ) : null}

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Primary button text</span>
                                <input value={selectedSiteSection.primaryCtaLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "primaryCtaLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Primary button link</span>
                                <input value={selectedSiteSection.primaryCtaHref || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "primaryCtaHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Secondary button text</span>
                                <input value={selectedSiteSection.secondaryCtaLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "secondaryCtaLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                              <label className="flex-1 space-y-1 text-xs text-white/60">
                                <span>Secondary button link</span>
                                <input value={selectedSiteSection.secondaryCtaHref || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "secondaryCtaHref", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>

                            {selectedSiteSectionMeta.advancedFields?.length ? (
                              <div className="border-t border-white/10 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Supporting content</p>
                                <div className="mt-4 flex flex-col gap-3">
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingEyebrow") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting eyebrow</span>
                                      <input value={selectedSiteSection.supportingEyebrow || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingEyebrow", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingHeading") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting heading</span>
                                      <input value={selectedSiteSection.supportingHeading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingHeading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingDescription") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting description</span>
                                      <textarea value={selectedSiteSection.supportingDescription || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingDescription", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("supportingNote") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Supporting note</span>
                                      <textarea value={selectedSiteSection.supportingNote || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "supportingNote", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formHeading") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form heading</span>
                                      <input value={selectedSiteSection.formHeading || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formHeading", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formDescription") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form description</span>
                                      <textarea value={selectedSiteSection.formDescription || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formDescription", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formSubmitLabel") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form submit button</span>
                                      <input value={selectedSiteSection.formSubmitLabel || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formSubmitLabel", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formDisclaimer") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Form disclaimer</span>
                                      <textarea value={selectedSiteSection.formDisclaimer || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formDisclaimer", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("formAction") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Newsletter form action URL</span>
                                      <input value={selectedSiteSection.formAction || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "formAction", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                    </label>
                                  ) : null}
                                  {selectedSiteSectionMeta.advancedFields.includes("featuredOfferingId") ? (
                                    <label className="space-y-1 text-xs text-white/60">
                                      <span>Featured offering</span>
                                      <select value={selectedSiteSection.featuredOfferingId || ""} onChange={(event) => updateSiteSection(selectedSiteSection.id, "featuredOfferingId", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
                                        <option value="" className="bg-gray-900">None</option>
                                        {offerings.map((offering) => (
                                          <option key={offering.id} value={offering.id} className="bg-gray-900">
                                            {offering.title}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                            {selectedSiteSectionMeta.itemType ? (
                              <div className="border-t border-white/10 pt-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">{selectedSiteSectionMeta.itemTitle}</p>
                                    <p className="mt-1 text-xs text-white/55">{selectedSiteSectionMeta.itemDescription}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addSiteSectionItem(selectedSiteSection.id, selectedSiteSectionMeta.itemType)}
                                    className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100"
                                  >
                                    Add item
                                  </button>
                                </div>
                                <div className="mt-4 flex flex-col divide-y divide-white/10">
                                  {selectedSiteSectionItems.map((item, index) => (
                                    <div key={item.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                            <input type="checkbox" checked={Boolean(item.enabled)} onChange={(event) => updateSiteSectionItem(item.key, "enabled", event.target.checked)} />
                                            Visible
                                          </label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <button type="button" onClick={() => moveSiteSectionItem(item.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                          <button type="button" onClick={() => moveSiteSectionItem(item.key, 1)} disabled={index === selectedSiteSectionItems.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                          <button type="button" onClick={() => removeSiteSectionItem(item.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-3">
                                        {selectedSiteSectionMeta.fields.includes("title") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Title</span>
                                            <input value={item.title || ""} onChange={(event) => updateSiteSectionItem(item.key, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("description") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Description</span>
                                            <textarea value={item.description || ""} onChange={(event) => updateSiteSectionItem(item.key, "description", event.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("label") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Button label</span>
                                            <input value={item.label || ""} onChange={(event) => updateSiteSectionItem(item.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("href") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Link URL</span>
                                            <input value={item.href || ""} onChange={(event) => updateSiteSectionItem(item.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                        {selectedSiteSectionMeta.fields.includes("icon") ? (
                                          <label className="space-y-1 text-xs text-white/60">
                                            <span>Icon key</span>
                                            <input value={item.icon || ""} onChange={(event) => updateSiteSectionItem(item.key, "icon", event.target.value)} placeholder="sparkles, layers, library, users" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {selectedSiteSectionMeta.linkGroup ? (
                              <div className="border-t border-white/10 pt-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Contact methods</p>
                                    <p className="mt-1 text-xs text-white/55">These links sit above the contact form.</p>
                                  </div>
                                  <button type="button" onClick={() => addSiteLink(selectedSiteSectionMeta.linkGroup)} className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">Add link</button>
                                </div>
                                <div className="mt-4 flex flex-col divide-y divide-white/10">
                                  {siteSettingsEditor.links
                                    .filter((link) => link.groupKey === selectedSiteSectionMeta.linkGroup)
                                    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
                                    .map((link, index, list) => (
                                      <div key={link.key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                            <input type="checkbox" checked={Boolean(link.enabled)} onChange={(event) => updateSiteLink(link.key, "enabled", event.target.checked)} />
                                            Visible
                                          </label>
                                          <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => moveSiteLink(link.key, -1)} disabled={index === 0} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Up</button>
                                            <button type="button" onClick={() => moveSiteLink(link.key, 1)} disabled={index === list.length - 1} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 disabled:opacity-40">Down</button>
                                            <button type="button" onClick={() => removeSiteLink(link.key)} className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs text-rose-100">Delete</button>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Label</span>
                                            <input value={link.label || ""} onChange={(event) => updateSiteLink(link.key, "label", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Display value</span>
                                            <input value={link.value || ""} onChange={(event) => updateSiteLink(link.key, "value", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                          <label className="flex-1 space-y-1 text-xs text-white/60">
                                            <span>Link URL</span>
                                            <input value={link.href || ""} onChange={(event) => updateSiteLink(link.key, "href", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                          <label className="w-full space-y-1 text-xs text-white/60 sm:w-48">
                                            <span>Icon key</span>
                                            <input value={link.icon || ""} onChange={(event) => updateSiteLink(link.key, "icon", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="border-t border-white/10 pt-5">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Advanced</p>
                              <label className="mt-3 block space-y-1 text-xs text-white/60">
                                <span>Anchor</span>
                                <input value={selectedSiteSection.anchor} onChange={(event) => updateSiteSection(selectedSiteSection.id, "anchor", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="sticky bottom-4 z-50 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-300/20 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:flex-nowrap">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveSiteSettings}
                        disabled={isSavingSite}
                        className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                      >
                        {isSavingSite ? "Saving..." : "Save site settings"}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThemePreset(generateRandomTheme())}
                        className="flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-medium text-teal-100 transition-colors hover:bg-teal-300/20"
                      >
                        <Wand2 className="h-4 w-4" />
                        Randomize Theme
                      </button>
                    </div>
                    <p className="hidden text-sm text-white/45 md:block">These changes affect the live storefront shell immediately.</p>
                  </div>
                </div>
              </section>
            ) : null}

            {activeAdminTab === "offerings" ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200/80">Offerings studio</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">Manage what customers see, how they pay, and how each offer is fulfilled.</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                        The editor below is organised around storefront copy, fulfilment mode, and publishing status. Internal fields are tucked behind clearer labels so adding a new offering feels like managing a product, not editing a table row.
                      </p>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-3">
                      <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Types</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{sections.length}</p>
                      </div>
                      <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Offers</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{offerings.length}</p>
                      </div>
                      <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Current mode</p>
                        <p className="mt-2 text-base font-semibold text-white">{selectedModeMeta.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewSectionForm((prev) => !prev)}
                      className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100"
                    >
                      {showNewSectionForm ? "Hide new type" : "Add new offering type"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewOfferingForm((prev) => !prev)}
                      className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                      disabled={!selectedSectionId}
                    >
                      {showNewOfferingForm ? "Hide new offering" : "Add new offering"}
                    </button>
                  </div>

                  {(showNewSectionForm || showNewOfferingForm) ? (
                    <div className="flex flex-col gap-4 xl:flex-row">
                      {showNewSectionForm ? (
                        <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Add offering type</p>
                          <div className="mt-4 space-y-3">
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Type title</span>
                              <input
                                value={newSection.title}
                                onChange={(event) => updateNewSection("title", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="For example: Coaching"
                              />
                            </label>
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Description</span>
                              <textarea
                                value={newSection.description}
                                onChange={(event) => updateNewSection("description", event.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="Short description for this offering type"
                              />
                            </label>
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleCreateSection}
                                disabled={isCreatingSection}
                                className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                              >
                                {isCreatingSection ? "Creating..." : "Add offering type"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewSectionForm(false)}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {showNewOfferingForm ? (
                        <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Add offering to selected type</p>
                          <div className="mt-4 space-y-3">
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Selected type</span>
                              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                {sectionsById[selectedSectionId]?.title || "Choose a type first"}
                              </div>
                            </label>
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Offering title</span>
                              <input
                                value={newOffering.title}
                                onChange={(event) => updateNewOffering("title", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="For example: Private Mentorship"
                              />
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <label className="block flex-1 space-y-1 text-xs text-white/60">
                                <span>Subtitle</span>
                                <input
                                  value={newOffering.subtitle}
                                  onChange={(event) => updateNewOffering("subtitle", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  placeholder="Optional subtitle"
                                />
                              </label>
                              <label className="block flex-1 space-y-1 text-xs text-white/60">
                                <span>Price (USD)</span>
                                <input
                                  value={newOffering.price_usd}
                                  onChange={(event) => updateNewOffering("price_usd", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  placeholder="Optional"
                                />
                              </label>
                            </div>
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Fulfilment mode</span>
                              <select
                                value={newOffering.cta_type || "contact"}
                                onChange={(event) => updateNewOffering("cta_type", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              >
                                {ctaTypeOptions.map((option) => (
                                  <option key={option.value} value={option.value} className="bg-gray-900">
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <p className={`text-xs leading-relaxed ${offeringModeMeta[newOffering.cta_type || "contact"]?.accentClass || "text-white/60"}`}>
                              {offeringModeMeta[newOffering.cta_type || "contact"]?.description}
                            </p>
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleCreateOffering}
                                disabled={isCreatingOffering || !selectedSectionId}
                                className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                              >
                                {isCreatingOffering ? "Creating..." : "Add offering"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewOfferingForm(false)}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-4 xl:flex-row">
                    <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Browse types</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">{sections.length}</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        {sections.map((section) => {
                          const isSelected = section.id === selectedSectionId;
                          const count = offeringsBySection[section.id]?.length || 0;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setSelectedSectionId(section.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${isSelected
                                  ? "border-teal-300/35 bg-teal-300/10"
                                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{section.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
                                    {section.description || "No description yet."}
                                  </p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/50">
                                  {count}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Browse offers</p>
                          <p className="mt-1 text-xs text-white/55">Choose the offer you want to edit.</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                          {offeringsForSelectedSection.length}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        {offeringsForSelectedSection.length ? (
                          offeringsForSelectedSection.map((offering) => {
                            const isSelected = offering.id === selectedOfferingId;
                            const modeMeta = offeringModeMeta[offering.cta_type || "contact"] || offeringModeMeta.contact;
                            return (
                              <button
                                key={offering.id}
                                type="button"
                                onClick={() => setSelectedOfferingId(offering.id)}
                                className={`w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${isSelected
                                    ? "border-teal-300/35 bg-teal-300/10"
                                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{offering.title}</p>
                                    <p className="mt-1 truncate text-xs text-white/50">{offering.subtitle || offering.summary || "No short copy yet."}</p>
                                  </div>
                                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${modeMeta.badgeClass}`}>
                                    {modeMeta.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                            No offers in this type yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">
                          Current type
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {selectedSection?.title || "No type selected"}
                        </p>
                      </div>
                      <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                        {offeringsForSelectedSection.length} offering{offeringsForSelectedSection.length === 1 ? "" : "s"} in this type
                      </p>
                    </div>
                    {selectedSection ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Type details</p>
                        <div className="flex flex-col gap-3">
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Type title</span>
                            <input
                              value={selectedSection.title || ""}
                              onChange={(event) => updateSectionEditor("title", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            />
                          </label>
                        </div>
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>Description</span>
                          <textarea
                            value={selectedSection.description || ""}
                            onChange={(event) => updateSectionEditor("description", event.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                        <div className="space-y-3 border-t border-white/10 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Hero Section</p>
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Hero Title</span>
                            <input
                              value={selectedSection.hero_title || ""}
                              onChange={(event) => updateSectionEditor("hero_title", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              placeholder="Meet Your Manifestation Coach"
                            />
                          </label>
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Hero Subtitle</span>
                            <input
                              value={selectedSection.hero_subtitle || ""}
                              onChange={(event) => updateSectionEditor("hero_subtitle", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              placeholder="High-Frequency Coaching & Mentorship"
                            />
                          </label>
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Hero Description</span>
                            <textarea
                              value={selectedSection.hero_description || ""}
                              onChange={(event) => updateSectionEditor("hero_description", event.target.value)}
                              rows={4}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              placeholder="Hi, I'm Nehal Patel - a manifestation coach, energy reader, and your guide to quantum leaping into your dream reality..."
                            />
                          </label>
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Hero Image</span>
                            <div className="flex items-center gap-3">
                              <label className="inline-flex cursor-pointer items-center rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                                <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                                {uploadingTarget === "hero-image" ? "Uploading..." : "Upload hero image"}
                              </label>
                              {selectedSection.hero_image_url ? (
                                <a
                                  href={selectedSection.hero_image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-white/55 underline-offset-4 hover:text-white hover:underline"
                                >
                                  View current image
                                </a>
                              ) : null}
                            </div>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>CTA Label</span>
                              <input
                                value={selectedSection.hero_cta_label || ""}
                                onChange={(event) => updateSectionEditor("hero_cta_label", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="Explore Offerings"
                              />
                            </label>
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>CTA Link</span>
                              <input
                                value={selectedSection.hero_cta_href || ""}
                                onChange={(event) => updateSectionEditor("hero_cta_href", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="#offerings"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedSection.is_active)}
                              onChange={(event) => updateSectionEditor("is_active", event.target.checked)}
                            />
                            Active type
                          </label>
                          <button
                            type="button"
                            onClick={handleSaveSection}
                            disabled={isSavingSection}
                            className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                          >
                            {isSavingSection ? "Saving..." : "Save offering type"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {editor ? (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_28%),linear-gradient(180deg,rgba(12,18,30,0.94),rgba(9,14,24,0.98))]">
                        <div className="flex flex-col lg:flex-row">
                          <div className="flex-1 p-6">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${selectedModeMeta.badgeClass}`}>
                                {selectedModeMeta.label}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
                                {editor.is_active ? "Live" : "Draft"}
                              </span>
                            </div>
                            <h3 className="mt-5 text-3xl font-semibold text-white">{editor.title || "Untitled offering"}</h3>
                            {editor.subtitle ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">{editor.subtitle}</p>
                            ) : null}
                            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/72">
                              {editor.summary || "Add a summary. This is the main storefront copy shown on offering cards and reused on the detail page."}
                            </p>
                            {fromLines(editor.highlightsText).length ? (
                              <div className="mt-6 flex flex-col gap-2">
                                {fromLines(editor.highlightsText).slice(0, 3).map((highlight) => (
                                  <div key={highlight} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
                                    {highlight}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="border-t border-white/10 p-6 text-sm text-white/65 lg:w-[340px] lg:border-l lg:border-t-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Storefront preview guide</p>
                            <div className="mt-5 space-y-4">
                              <div>
                                <p className="font-semibold text-white">Card display</p>
                                <p className="mt-1 text-white/55">Title, subtitle, summary, price, and image.</p>
                              </div>
                              <div>
                                <p className="font-semibold text-white">Fulfilment flow</p>
                                <p className={`mt-1 ${selectedModeMeta.accentClass}`}>{selectedModeMeta.description}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-white">Current type</p>
                                <p className="mt-1 text-white/55">{sectionsById[editor.section_id]?.title || editor.section_id}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-white">Internal ID</p>
                                <p className="mt-1 break-all font-mono text-xs text-white/45">{editor.id}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="min-w-0 space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">What customers see</p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                              {[
                                ["title", "Title"],
                                ["subtitle", "Subtitle"],
                                ["price_usd", "Displayed price (USD)"],
                                ["cta_label", "Legacy button label"],
                              ].map(([key, label]) => (
                                <label key={key} className="min-w-[220px] flex-1 space-y-1 text-xs text-white/60">
                                  <span>{label}</span>
                                  <input
                                    value={editor[key] ?? ""}
                                    onChange={(event) => updateEditor(key, event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  />
                                </label>
                              ))}
                            </div>

                            <label className="mt-3 block space-y-1 text-xs text-white/60">
                              <span>Summary</span>
                              <textarea
                                value={editor.summary || ""}
                                onChange={(event) => updateEditor("summary", event.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                              <span className="block text-[11px] text-white/40">Shown on offer cards and reused as the opening copy on the detail page.</span>
                            </label>

                            <label className="mt-3 block space-y-1 text-xs text-white/60">
                              <span>Long description</span>
                              <textarea
                                value={editor.long_description || ""}
                                onChange={(event) => updateEditor("long_description", event.target.value)}
                                rows={6}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                              <span className="block text-[11px] text-white/40">Use this for the detailed story, transformation, or delivery explanation.</span>
                            </label>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Highlights and benefits</p>
                            <label className="mt-4 block space-y-1 text-xs text-white/60">
                              <span>Highlights (one per line)</span>
                              <textarea
                                value={editor.highlightsText || ""}
                                onChange={(event) => updateEditor("highlightsText", event.target.value)}
                                rows={6}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                              <span className="block text-[11px] text-white/40">These render as the key benefits list on the storefront.</span>
                            </label>
                          </div>
                        </div>

                        <div className="min-w-0 space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Fulfilment and publishing</p>
                            <div className="mt-4 flex flex-col gap-3">
                              <label className="space-y-1 text-xs text-white/60">
                                <span>Fulfilment mode</span>
                                <select
                                  value={editor.cta_type || "contact"}
                                  onChange={(event) => updateEditor("cta_type", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                >
                                  {ctaTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-gray-900">
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className={`rounded-xl border px-3 py-3 text-sm ${selectedModeMeta.badgeClass}`}>
                                {selectedModeMeta.description}
                              </div>

                              {editor.cta_type === "booking" ? (
                                <div className="space-y-3 rounded-2xl border border-teal-300/20 bg-teal-300/5 p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">
                                      Booking sync
                                    </p>
                                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${editor.booking_status === "synced"
                                        ? "border border-teal-300/30 bg-teal-300/10 text-teal-100"
                                        : editor.booking_status === "failed"
                                          ? "border border-rose-300/30 bg-rose-300/10 text-rose-100"
                                          : "border border-amber-300/30 bg-amber-300/10 text-amber-100"
                                      }`}>
                                      {editor.booking_status || "pending"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-3 sm:flex-row">
                                    <label className="flex-1 space-y-1 text-xs text-white/60">
                                      <span>Booking CTA label</span>
                                      <input
                                        value={editor.booking_cta_label || ""}
                                        onChange={(event) => updateEditor("booking_cta_label", event.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                        placeholder="Book now"
                                      />
                                    </label>
                                    <label className="flex-1 space-y-1 text-xs text-white/60">
                                      <span>Duration (minutes)</span>
                                      <input
                                        type="number"
                                        min="15"
                                        step="15"
                                        value={editor.duration_minutes ?? 60}
                                        onChange={(event) => updateEditor("duration_minutes", event.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                      />
                                    </label>
                                  </div>
                                  <div className="space-y-2 text-xs text-white/60">
                                    <div className="flex flex-row justify-between">
                                      <span className="block">Cal.com booking link</span>
                                      {editor.booking_url ? (
                                        <div className="space-y-2">
                                          <a
                                            href={editor.booking_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center text-xs font-semibold text-teal-200 underline-offset-4 hover:underline"
                                          >
                                            Open booking page
                                          </a>
                                        </div>
                                      ) : ''}</div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                                      {editor.booking_url ? (
                                        <div className="space-y-2">
                                          <p className="break-all text-sm text-white/75">{editor.booking_url}</p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-white/45">
                                          A booking link will appear here after the event sync succeeds.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-white/45">
                                    Guest additions are disabled on the Cal.com event. The booked attendee can still share their own calendar invite externally.
                                  </p>
                                  {editor.booking_last_error ? (
                                    <p className="text-xs leading-relaxed text-rose-200">{editor.booking_last_error}</p>
                                  ) : null}
                                </div>
                              ) : null}

                              <label className="space-y-1 text-xs text-white/60">
                                <span>Fallback support link</span>
                                <input
                                  value={editor.action_link || ""}
                                  onChange={(event) => updateEditor("action_link", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  placeholder="Use mailto: or a manual recovery page"
                                />
                              </label>
                              <label className="space-y-1 text-xs text-white/60">
                                <span>Fallback helper message</span>
                                <textarea
                                  value={editor.checkout_fallback_message || ""}
                                  onChange={(event) => updateEditor("checkout_fallback_message", event.target.value)}
                                  rows={3}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                />
                                <span className="block text-[11px] text-white/40">Shown when checkout or booking cannot be completed automatically.</span>
                              </label>

                              <div className="space-y-2">
                                <span className="block text-xs text-white/60">Upload image</span>
                                <div className="flex flex-wrap items-center gap-3">
                                  <label className="inline-flex cursor-pointer items-center rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleOfferingImageUpload}
                                    />
                                    {uploadingTarget === "offering-image" ? "Uploading..." : "Upload offering image"}
                                  </label>
                                  {editor.image_url ? (
                                    <a
                                      href={editor.image_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-white/55 underline-offset-4 hover:text-white hover:underline"
                                    >
                                      Preview image
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                              {[
                                ["image_url", "Image URL"],
                                ["image_alt", "Image alt"],
                              ].map(([key, label]) => (
                                <label key={key} className="space-y-1 text-xs text-white/60">
                                  <span>{label}</span>
                                  <input
                                    value={editor[key] ?? ""}
                                    onChange={(event) => updateEditor(key, event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  />
                                </label>
                              ))}
                              <label className="space-y-1 text-xs text-white/60">
                                <span>Offering type</span>
                                <select
                                  value={editor.section_id || ""}
                                  onChange={(event) => {
                                    updateEditor("section_id", event.target.value);
                                    setSelectedSectionId(event.target.value);
                                  }}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                >
                                  {sections.map((section) => (
                                    <option key={section.id} value={section.id} className="bg-gray-900">
                                      {section.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                <input
                                  type="checkbox"
                                  checked={Boolean(editor.is_active)}
                                  onChange={(event) => updateEditor("is_active", event.target.checked)}
                                />
                                Active
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveOffering}
                          disabled={isSavingOffering}
                          className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 disabled:opacity-60"
                        >
                          {isSavingOffering ? "Saving..." : "Save offering"}
                        </button>
                        <p className="text-sm text-white/45">
                          Edits are scoped to the selected offering only.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                      No offerings found for this type yet.
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {activeAdminTab === "shared" ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-white">Shared Checkout Content</h2>
                  <p className="mt-1 text-xs text-white/60">Shared copy that applies across checkout and buy pages.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    {[
                      ["manualInstructionsText", "Manual instructions (one per line)"],
                      ["legalNotesText", "Legal notes (one per line)"],
                      ["closingNotesText", "Closing notes (one per line)"],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-1 text-xs text-white/60">
                        <span>{label}</span>
                        <textarea
                          value={globalEditor[key] || ""}
                          onChange={(event) => updateGlobalEditor(key, event.target.value)}
                          rows={6}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Frequently Asked Questions</h3>
                      <button
                        type="button"
                        onClick={() =>
                          updateGlobalEditor("faqs", [
                            ...(globalEditor.faqs || []),
                            { question: "New Question", answer: "The answer..." },
                          ])
                        }
                        className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-200 transition hover:bg-teal-300/20"
                      >
                        Add FAQ
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {globalEditor.faqs?.length === 0 ? (
                        <p className="text-xs text-white/50">No FAQs added yet.</p>
                      ) : (
                        globalEditor.faqs?.map((faq, index) => (
                          <div key={index} className="relative space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
                            <button
                              type="button"
                              onClick={() => {
                                const nextFaqs = [...globalEditor.faqs];
                                nextFaqs.splice(index, 1);
                                updateGlobalEditor("faqs", nextFaqs);
                              }}
                              className="absolute right-3 top-3 text-white/40 transition hover:text-red-400"
                              title="Delete FAQ"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <label className="block space-y-1">
                              <span className="text-xs font-medium text-white/70">Question</span>
                              <input
                                type="text"
                                value={faq.question || ""}
                                onChange={(e) => {
                                  const nextFaqs = [...globalEditor.faqs];
                                  nextFaqs[index] = { ...faq, question: e.target.value };
                                  updateGlobalEditor("faqs", nextFaqs);
                                }}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="What is the purpose of this offering?"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-xs font-medium text-white/70">Answer</span>
                              <textarea
                                value={faq.answer || ""}
                                onChange={(e) => {
                                  const nextFaqs = [...globalEditor.faqs];
                                  nextFaqs[index] = { ...faq, answer: e.target.value };
                                  updateGlobalEditor("faqs", nextFaqs);
                                }}
                                rows={3}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="Write the answer here..."
                              />
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveGlobalContent}
                    disabled={isSavingGlobal}
                    className="rounded-full border border-teal-300/50 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                  >
                    {isSavingGlobal ? "Saving..." : "Save shared content"}
                  </button>
                </div>
              </section>
            ) : null}

            {activeAdminTab === "reviews" ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-white">Reviews</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Manage multiple reviews for home testimonials and offering-specific buy pages.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setReviewsEditor((prev) => [...prev, { ...createEmptyReview(), sort_order: prev.length }])}
                    className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100"
                  >
                    Add review
                  </button>

                  <div className="space-y-4">
                    {reviewsEditor.map((review, index) => (
                      <div key={review.id} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1 text-xs text-white/60">
                            <span>Placement</span>
                            <select
                              value={review.placement || "home"}
                              onChange={(event) => updateReviewEditor(index, "placement", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            >
                              <option value="home" className="bg-gray-900">Home</option>
                              <option value="buy" className="bg-gray-900">Buy (offering specific)</option>
                              <option value="global" className="bg-gray-900">Buy (global)</option>
                            </select>
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Offering type</span>
                            <select
                              value={review.section_id || ""}
                              onChange={(event) =>
                                setReviewsEditor((prev) =>
                                  prev.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, section_id: event.target.value, offering_id: "" }
                                      : entry,
                                  ),
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            >
                              <option value="" className="bg-gray-900">None</option>
                              {sections.map((section) => (
                                <option key={section.id} value={section.id} className="bg-gray-900">
                                  {section.title}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Offering (optional)</span>
                            <select
                              value={review.offering_id || ""}
                              onChange={(event) => updateReviewEditor(index, "offering_id", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            >
                              <option value="" className="bg-gray-900">None</option>
                              {(offeringsBySection[review.section_id] || []).map((offering) => (
                                <option key={offering.id} value={offering.id} className="bg-gray-900">
                                  {offering.title}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Heading</span>
                            <input
                              value={review.heading || ""}
                              onChange={(event) => updateReviewEditor(index, "heading", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            />
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Author</span>
                            <input
                              value={review.author || ""}
                              onChange={(event) => updateReviewEditor(index, "author", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            />
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Review image URL</span>
                            <div className="flex items-center gap-2">
                              <input
                                value={review.image_url || ""}
                                onChange={(event) => updateReviewEditor(index, "image_url", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                              <label
                                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-teal-300/50 bg-teal-300/10 text-base text-teal-100 transition hover:bg-teal-300/20"
                                title={uploadingTarget === `review-image-${index}` ? "Uploading image" : "Upload image"}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(event) => handleReviewImageUpload(event, index)}
                                />
                                <span aria-hidden="true">
                                  {uploadingTarget === `review-image-${index}` ? "..." : "\u2191"}
                                </span>
                              </label>
                              {review.image_url ? (
                                <a
                                  href={review.image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-white/55 underline-offset-4 hover:text-white hover:underline"
                                >
                                  Preview image
                                </a>
                              ) : null}
                            </div>
                          </label>

                          <label className="space-y-1 text-xs text-white/60">
                            <span>Review image alt</span>
                            <input
                              value={review.image_alt || ""}
                              onChange={(event) => updateReviewEditor(index, "image_alt", event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                            />
                          </label>

                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs text-white/70">
                              <input
                                type="checkbox"
                                checked={Boolean(review.is_active)}
                                onChange={(event) => updateReviewEditor(index, "is_active", event.target.checked)}
                              />
                              Active
                            </label>
                            <button
                              type="button"
                              onClick={() => setReviewsEditor((prev) => prev.filter((_, entryIndex) => entryIndex !== index))}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#141922] text-lg leading-none text-white/70 transition hover:border-rose-300/40 hover:bg-rose-300/10 hover:text-rose-100"
                              aria-label="Delete review"
                            >
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                        </div>

                        <label className="space-y-1 text-xs text-white/60">
                          <span>Quote</span>
                          <textarea
                            value={review.quote || ""}
                            onChange={(event) => updateReviewEditor(index, "quote", event.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>

                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveReviews}
                    disabled={isSavingReviews}
                    className="rounded-full border border-teal-300/50 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                  >
                    {isSavingReviews ? "Saving..." : "Save reviews"}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>
      {reviewSaveSummary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1218] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold text-white">Confirm review changes</h2>
            <p className="mt-2 text-sm text-white/60">Review the pending changes before saving them to Supabase.</p>
            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              {reviewSaveSummary.addedCount ? <p>{reviewSaveSummary.addedCount} review(s) will be added.</p> : null}
              {reviewSaveSummary.modifiedCount ? <p>{reviewSaveSummary.modifiedCount} review(s) will be updated.</p> : null}
              {reviewSaveSummary.deletedCount ? <p>{reviewSaveSummary.deletedCount} review(s) will be deleted.</p> : null}
            </div>
            <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              {reviewSaveSummary.addedDetails?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">Added</p>
                  <ul className="mt-2 space-y-1">
                    {reviewSaveSummary.addedDetails.map((item) => (
                      <li key={`added-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {reviewSaveSummary.modifiedDetails?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Modified</p>
                  <ul className="mt-2 space-y-1">
                    {reviewSaveSummary.modifiedDetails.map((item) => (
                      <li key={`modified-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {reviewSaveSummary.deletedDetails?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200/80">Deleted</p>
                  <ul className="mt-2 space-y-1">
                    {reviewSaveSummary.deletedDetails.map((item) => (
                      <li key={`deleted-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewSaveSummary(null)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => persistReviews(reviewSaveSummary.normalizedRows)}
                disabled={isSavingReviews}
                className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 disabled:opacity-60"
              >
                {isSavingReviews ? "Saving..." : "Confirm and save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};

export default CatalogAdmin;
