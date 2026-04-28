export const sectionsTable = import.meta.env.VITE_SUPABASE_SECTIONS_TABLE || "storefront_sections";
export const offeringsTable = import.meta.env.VITE_SUPABASE_OFFERINGS_TABLE || "storefront_offerings";
export const checkoutConfigsTable =
  import.meta.env.VITE_SUPABASE_CHECKOUT_CONFIGS_TABLE || "storefront_checkout_configs";
export const globalContentTable =
  import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
export const siteSectionsTable =
  import.meta.env.VITE_SUPABASE_SITE_SECTIONS_TABLE || "storefront_site_sections";
export const siteSectionItemsTable =
  import.meta.env.VITE_SUPABASE_SITE_SECTION_ITEMS_TABLE || "storefront_site_section_items";
export const siteLinksTable = import.meta.env.VITE_SUPABASE_SITE_LINKS_TABLE || "storefront_site_links";
export const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";
export const coursesTable = import.meta.env.VITE_SUPABASE_COURSES_TABLE || "storefront_courses";
export const courseItemsTable = import.meta.env.VITE_SUPABASE_COURSE_ITEMS_TABLE || "storefront_course_items";
export const courseModulesTable = import.meta.env.VITE_SUPABASE_COURSE_MODULES_TABLE || "storefront_course_modules";
export const userProgressTable = import.meta.env.VITE_SUPABASE_USER_PROGRESS_TABLE || "storefront_user_course_progress";
export const courseAccessTable = import.meta.env.VITE_SUPABASE_COURSE_ACCESS_TABLE || "storefront_course_access";
export const adminNotificationsTable =
  import.meta.env.VITE_SUPABASE_ADMIN_NOTIFICATIONS_TABLE || "storefront_admin_notifications";
export const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";
export const defaultCalcomHostId = import.meta.env.VITE_CALCOM_DEFAULT_HOST_ID || "";

export const toLines = (value) => (Array.isArray(value) ? value.join("\n") : "");

export const fromLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export { slugify } from "../../utils/slugify";
