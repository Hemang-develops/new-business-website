export const ctaTypeOptions = [
  { value: "contact", label: "Contact" },
  { value: "checkout", label: "Checkout" },
  { value: "booking", label: "Booking" },
];

export const offeringModeMeta = {
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

export const siteSectionEditorMeta = {
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
    advancedFields: ["supportingEyebrow", "supportingHeading", "supportingDescription"],
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
    advancedFields: ["supportingEyebrow", "supportingDescription", "featuredOfferingId"],
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
    advancedFields: ["supportingDescription", "formAction"],
  },
  cta: {
    itemTitle: "Decision card details",
    itemDescription: "The final push before the footer.",
    advancedFields: ["supportingDescription"],
  },
};

export const siteLinkGroupMeta = [
  { key: "footer_offerings", title: "Footer products links", description: "The products column in the footer." },
  { key: "footer_resources", title: "Footer resource links", description: "External media and platform links." },
  { key: "footer_support", title: "Footer support links", description: "Support and utility links in the footer." },
  { key: "footer_social", title: "Footer social icons", description: "Icon links shown on the right side of the footer." },
  { key: "nav_content", title: "Nav: Content & Media", description: "Content links in the resource hub." },
  { key: "nav_community", title: "Nav: Community & Updates", description: "Community links in the resource hub." },
  { key: "nav_shopping", title: "Nav: Shopping & Wishlist", description: "Shopping links in the resource hub." },
  { key: "nav_support", title: "Nav: Support", description: "Support links in the resource hub." },
];

export const themeFieldMeta = [
  { key: "primary", label: "Primary", hint: "Buttons and active accents" },
  { key: "primaryLight", label: "Primary light", hint: "Hover states and soft glow" },
  { key: "secondary", label: "Secondary", hint: "Gradients and supporting color" },
  { key: "accent", label: "Accent", hint: "Highlights and contrast moments" },
  { key: "dark", label: "Dark background", hint: "Base canvas tone" },
];

export const themePresets = [
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

export const createEmptyReview = () => ({
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
