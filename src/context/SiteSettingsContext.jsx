import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase-client";
import { defaultSiteSettings, normalizeSiteSettingsFromRows, siteThemeCssVariables } from "../services/siteSettings";

const globalContentTable = import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
const siteSectionsTable = import.meta.env.VITE_SUPABASE_SITE_SECTIONS_TABLE || "storefront_site_sections";
const siteSectionItemsTable = import.meta.env.VITE_SUPABASE_SITE_SECTION_ITEMS_TABLE || "storefront_site_section_items";
const siteLinksTable = import.meta.env.VITE_SUPABASE_SITE_LINKS_TABLE || "storefront_site_links";

const SiteSettingsContext = createContext({
  settings: null,
  isLoading: true,
  error: null,
  refreshSettings: async () => {},
  getSection: () => null,
  getSectionItems: () => [],
  getLinks: () => [],
});

export const applyThemeVariables = (theme) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  Object.entries(siteThemeCssVariables(theme)).forEach(([key, value]) => root.style.setProperty(key, value));
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [globalRes, sectionsRes, itemsRes, linksRes] = await Promise.all([
        supabase
          .from(globalContentTable)
          .select("brand_nav_title,brand_full_title,brand_footer_tagline,brand_shop_label,brand_shop_href,brand_support_email,theme_primary,theme_primary_light,theme_secondary,theme_accent,theme_dark,profile_image_url,profile_image_alt,profile_role_label,footer_intro_eyebrow,footer_intro_heading,footer_status_label,footer_terms_label,footer_terms_href,footer_privacy_label,footer_privacy_href,newsletter_form_action,faqs")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from(siteSectionsTable)
          .select("key,label,anchor,is_enabled,show_in_nav,show_in_footer,sort_order,eyebrow,heading,description,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,supporting_eyebrow,supporting_heading,supporting_description,form_heading,form_description,form_submit_label,form_disclaimer,form_action,featured_offering_id")
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
      ]);

      if (globalRes.error) {
        throw globalRes.error;
      }
      if (sectionsRes.error) {
        throw sectionsRes.error;
      }
      if (itemsRes.error) {
        throw itemsRes.error;
      }
      if (linksRes.error) {
        throw linksRes.error;
      }

      setSettings(
        normalizeSiteSettingsFromRows({
          global: globalRes.data || {},
          sections: sectionsRes.data || [],
          sectionItems: itemsRes.data || [],
          links: linksRes.data || [],
        }),
      );
    } catch (loadError) {
      setSettings(null);
      setError(loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings?.theme) {
      applyThemeVariables(settings.theme);
      return;
    }
    applyThemeVariables(defaultSiteSettings.theme);
  }, [settings?.theme]);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
      getSection: (sectionId) => settings?.sections?.find((section) => section.id === sectionId) || null,
      getSectionItems: (sectionId) =>
        settings?.sectionItems?.filter((item) => item.sectionKey === sectionId && item.enabled) || [],
      getLinks: (groupKey) =>
        settings?.links?.filter((link) => link.groupKey === groupKey && link.enabled) || [],
    }),
    [error, isLoading, settings],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
