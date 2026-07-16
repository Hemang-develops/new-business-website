import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/AuthContext";
import { applyThemeVariables, useSiteSettings } from "../../context/SiteSettingsContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabase-client";
import { Skeleton } from "../../components/ui/skeleton";
import { useGsapPulse } from "../../hooks/useGsapMotion";
import { defaultSiteSettings, normalizeSiteSettingsFromRows } from "../../services/siteSettings";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileSearch,
  Home,
  Layers3,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareQuote,
  Package,
  X,
} from "lucide-react";
import SharedContentTab from "./SharedContentTab";
import ReviewsTab from "./ReviewsTab";
import FulfillmentTab from "./FulfillmentTab";
import ReviewSaveSummaryModal from "./ReviewSaveSummaryModal";
import ProductsTab from "./ProductsTab";
import WebsiteTab from "./WebsiteTab";
import CoursesTab from "./CoursesTab";
import useCatalogAdminSaves from "./useCatalogAdminSaves";
import useCatalogAdminUploads from "./useCatalogAdminUploads";
import { offeringModeMeta, siteSectionEditorMeta } from "./catalogAdminConfig";
import {
  defaultCalcomHostId,
  adminNotificationsTable,
  adminDashboardSummaryView,
  offeringPerformanceAnalyticsView,
  userLearningPathView,
  contentAuditTrailView,
  courseAccessTable,
  courseItemsTable,
  coursesTable,
  globalContentTable,
  offeringsTable,
  reviewsTable,
  sectionsTable,
  siteLinksTable,
  siteSectionItemsTable,
  siteSectionsTable,
  courseModulesTable,
  toLines,
} from "./catalogAdminHelpers";
import NewsletterTab from "./NewsletterTab";
import AnalyticsTab from "./AnalyticsTab";
import ContentAuditTab from "./ContentAuditTab";

const adminTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "content-audit", label: "Content Audit", icon: FileSearch },
  { id: "site", label: "Website", icon: Home },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "offerings", label: "Products", icon: Package },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "shared", label: "Checkout Content", icon: Layers3 },
  { id: "reviews", label: "Reviews", icon: MessageSquareQuote },
  { id: "fulfillment", label: "Fulfillment", icon: CheckCircle2 },
];

const CatalogAdmin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { refreshSettings } = useSiteSettings();
  const toast = useToast();
  const adminRef = useRef(null);
  const footerRef = useRef(null);
  const [sidebarBottomOffset, setSidebarBottomOffset] = useState(24); // default 24px = bottom-6

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    // Shift sidebar up by however many px of the footer are visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.boundingClientRect.height * entry.intersectionRatio;
        setSidebarBottomOffset(24 + Math.ceil(visible));
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  const [sections, setSections] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [editor, setEditor] = useState(null);
  const [reviewsEditor, setReviewsEditor] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseItems, setCourseItems] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [courseAccess, setCourseAccess] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [dashboardSummaryViewData, setDashboardSummaryViewData] = useState(null);
  const [offeringAnalytics, setOfferingAnalytics] = useState([]);
  const [userLearningPaths, setUserLearningPaths] = useState([]);
  const [contentAuditTrail, setContentAuditTrail] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [newCourseOfferingId, setNewCourseOfferingId] = useState("");
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [deletedCourseItemIds, setDeletedCourseItemIds] = useState([]);
  const [deletedCourseModuleIds, setDeletedCourseModuleIds] = useState([]);
  const [savedReviewsSnapshot, setSavedReviewsSnapshot] = useState([]);
  const [reviewSaveSummary, setReviewSaveSummary] = useState(null);
  const [globalEditor, setGlobalEditor] = useState({
    manualInstructionsText: "",
    legalNotesText: "",
    closingNotesText: "",
  });
  const [siteSettingsEditor, setSiteSettingsEditor] = useState(defaultSiteSettings);
  const [selectedSiteSectionId, setSelectedSiteSectionId] = useState("hero");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [showNewOfferingForm, setShowNewOfferingForm] = useState(false);
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

  useGsapPulse(adminRef, "[data-gsap-pulse]", [isLoadingData]);

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
  const selectedSiteSectionIndex = selectedSiteSection
    ? siteSettingsEditor.sections.findIndex((section) => section.id === selectedSiteSection.id)
    : -1;
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
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0] || null;
  const dashboardStats = useMemo(() => {
    const activeAccess = courseAccess.filter((entry) => !entry.revoked_at && (!entry.expires_at || new Date(entry.expires_at).getTime() >= Date.now()));
    const volumeByCurrency = courseAccess.reduce((acc, entry) => {
      const currency = String(entry.currency || "unknown").toUpperCase();
      acc[currency] = (acc[currency] || 0) + (Number(entry.amount) || 0);
      return acc;
    }, {});
    const courseRevenueLabel = Object.entries(volumeByCurrency)
      .filter(([, amount]) => amount > 0)
      .map(([currency, amount]) => `${currency} ${(amount / 100).toLocaleString()}`)
      .join(" / ");

    if (dashboardSummaryViewData) {
      return {
        totalCourses: dashboardSummaryViewData.total_courses ?? courses.length,
        activeCourseAccess: activeAccess.length,
        totalCoursePurchases: courseAccess.length,
        courseRevenueLabel: courseRevenueLabel || "No payments yet",
        recentNotifications: adminNotifications.slice(0, 8),
        dashboardSummaryViewData,
      };
    }

    return {
      totalCourses: courses.length,
      activeCourseAccess: activeAccess.length,
      totalCoursePurchases: courseAccess.length,
      courseRevenueLabel: courseRevenueLabel || "No payments yet",
      recentNotifications: adminNotifications.slice(0, 8),
    };
  }, [adminNotifications, courseAccess, courses.length, dashboardSummaryViewData]);
  const selectedAdminTab = adminTabs.find((tab) => tab.id === activeAdminTab) || adminTabs[0];
  const adminContentOffsetClass = isSidebarExpanded
    ? "md:pl-[6.25rem] lg:pl-[19.5rem]"
    : "md:pl-[6.25rem] lg:pl-[6.75rem]";

  useEffect(() => {
    setIsSidebarExpanded(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  useEffect(() => {
    if (!status.message) {
      return;
    }

    if (status.type === "error") {
      toast.error(status.message);
      return;
    }

    toast.success(status.message);
  }, [status.message, status.type, toast]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoadingData(true);
      setStatus({ type: "idle", message: "" });

      let results;
      try {
        results = await Promise.all([
          supabase
            .from(globalContentTable)
            .select("manual_instructions,legal_notes,closing_notes")
            .eq("id", 1)
            .maybeSingle(),
          supabase.from(sectionsTable).select("*").order("sort_order", { ascending: true }),
          supabase.from(offeringsTable).select("*").order("sort_order", { ascending: true }),
          supabase
            .from(reviewsTable)
            .select("id,placement,offering_id,heading,quote,author,image_url,image_alt,sort_order,is_active")
            .order("placement", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true }),
          supabase.from(coursesTable).select("*").order("created_at", { ascending: false }),
          supabase.from(courseModulesTable).select("*").order("sort_order", { ascending: true }),
          supabase.from(courseItemsTable).select("*").order("sort_order", { ascending: true }),
          supabase.from(courseAccessTable).select("*").order("created_at", { ascending: false }),
          supabase.from(adminNotificationsTable).select("*").order("created_at", { ascending: false }).limit(20),
          supabase.from(offeringPerformanceAnalyticsView).select("*"),
          supabase.from(userLearningPathView).select("*").order("last_activity_at", { ascending: false }).limit(50),
          supabase.from(contentAuditTrailView).select("*").order("changed_at", { ascending: false }).limit(100),
          supabase.from(adminDashboardSummaryView).select("*").maybeSingle(),
          refreshSettings({ throwOnError: true }),
        ]);
      } catch (err) {
        if (isMounted) {
          setStatus({ type: "error", message: err.message || "Unable to load catalog." });
          setIsLoadingData(false);
        }
        return;
      }

      const [
        sharedContentRes,
        sectionsRes,
        offeringsRes,
        reviewsRes,
        coursesRes,
        courseModulesRes,
        courseItemsRes,
        courseAccessRes,
        adminNotificationsRes,
        offeringAnalyticsRes,
        userLearningPathRes,
        contentAuditTrailRes,
        adminDashboardSummaryViewRes,
        settingsData,
      ] = results;

      const firstError = [
        sharedContentRes.error,
        sectionsRes.error,
        offeringsRes.error,
        reviewsRes.error,
        coursesRes.error,
        courseModulesRes.error,
        courseItemsRes.error,
        courseAccessRes.error,
        adminNotificationsRes.error,
        offeringAnalyticsRes.error,
        userLearningPathRes.error,
        contentAuditTrailRes.error,
        adminDashboardSummaryViewRes.error,
      ].find(Boolean);

      if (!isMounted) {
        return;
      }

      if (firstError) {
        setStatus({ type: "error", message: firstError.message || "Unable to load catalog." });
        setIsLoadingData(false);
        return;
      }

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
      }));
      const getLoadedSectionIdForOffering = (offeringId) =>
        mergedOfferings.find((entry) => entry.id === offeringId)?.section_id || "";

      const globalData = settingsData?.global || {};
      const sharedContentData = sharedContentRes.data || {};
      setGlobalEditor({
        manualInstructionsText: toLines(sharedContentData.manual_instructions || []),
        legalNotesText: toLines(sharedContentData.legal_notes || []),
        closingNotesText: toLines(sharedContentData.closing_notes || []),
      });
      setSiteSettingsEditor(
        normalizeSiteSettingsFromRows({
          global: globalData,
          sections: settingsData?.sections || [],
          sectionItems: settingsData?.sectionItems || [],
          links: settingsData?.links || [],
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
      setCourses(coursesRes.data || []);
      setCourseModules(courseModulesRes.data || []);
      setCourseItems(courseItemsRes.data || []);
      setCourseAccess(courseAccessRes.data || []);
      setAdminNotifications(adminNotificationsRes.data || []);
      setOfferingAnalytics(offeringAnalyticsRes.data || []);
      setUserLearningPaths(userLearningPathRes.data || []);
      setContentAuditTrail(contentAuditTrailRes.data || []);
      setDashboardSummaryViewData(adminDashboardSummaryViewRes.data || null);
      if (!selectedCourseId && coursesRes.data?.length) {
        setSelectedCourseId(coursesRes.data[0].id);
      }
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
  const updateSiteFaqs = (value) =>
    setSiteSettingsEditor((prev) => ({
      ...prev,
      faqs: value,
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
  const moveSiteSection = (sectionId, direction) =>
    setSiteSettingsEditor((prev) => {
      const currentIndex = prev.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.sections.length) {
        return prev;
      }
      const nextSections = [...prev.sections];
      const [moved] = nextSections.splice(currentIndex, 1);
      nextSections.splice(nextIndex, 0, moved);
      return {
        ...prev,
        sections: nextSections.map((section, index) => ({ ...section, sortOrder: index })),
      };
    });
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
  const updateReviewEditor = (index, key, value) => {
    setReviewsEditor((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry)));
  };
  const updateNewSection = (name, value) => setNewSection((prev) => ({ ...prev, [name]: value }));
  const updateNewOffering = (name, value) => setNewOffering((prev) => ({ ...prev, [name]: value }));
  const updateCourse = (name, value) =>
    setCourses((prev) =>
      prev.map((course) => (course.id === selectedCourse?.id ? { ...course, [name]: value } : course)),
    );
  const updateCourseItem = (itemId, name, value) =>
    setCourseItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [name]: value } : item)));
  const addCourseItem = () => {
    if (!selectedCourse) {
      return;
    }
    const scopedItems = courseItems.filter((item) => item.course_id === selectedCourse.id);
    setCourseItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        course_id: selectedCourse.id,
        sort_order: scopedItems.length,
        title: "New content",
        description: "",
        content_type: "text",
        body: "",
        youtube_url: "",
        file_url: "",
        storage_path: "",
        external_url: "",
        allow_download: false,
        is_active: true,
      },
    ]);
  };
  const deleteCourseItem = (itemId) => {
    setDeletedCourseItemIds((prev) => [...new Set([...prev, itemId])]);
    setCourseItems((prev) => prev.filter((item) => item.id !== itemId));
  };
  const updateCourseModule = (moduleId, name, value) =>
    setCourseModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, [name]: value } : m)));
  const addCourseModule = () => {
    if (!selectedCourse) return;
    const scopedModules = courseModules.filter((m) => m.course_id === selectedCourse.id);
    setCourseModules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        course_id: selectedCourse.id,
        sort_order: scopedModules.length,
        title: "New module",
        description: "",
        is_active: true,
      },
    ]);
  };
  const deleteCourseModule = (moduleId) => {
    setDeletedCourseModuleIds((prev) => [...new Set([...prev, moduleId])]);
    setCourseModules((prev) => prev.filter((m) => m.id !== moduleId));
    // Also reset module_id for items in this module
    setCourseItems((prev) => prev.map((item) => (item.module_id === moduleId ? { ...item, module_id: null } : item)));
  };
  const createCourseForOffering = async () => {
    const offering = offerings.find((entry) => entry.id === newCourseOfferingId);
    if (!offering) {
      return;
    }
    setIsSavingCourse(true);
    setStatus({ type: "idle", message: "" });
    try {
      const payload = {
        offering_id: offering.id,
        title: offering.title || "Untitled course",
        description: offering.summary || "",
        access_period_days: null,
        is_active: true,
      };
      const { data, error } = await supabase.from(coursesTable).insert(payload).select("*").single();
      if (error) {
        throw error;
      }
      setCourses((prev) => [data, ...prev]);
      setSelectedCourseId(data.id);
      setNewCourseOfferingId("");
      setStatus({ type: "success", message: "Course created successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to create course." });
    } finally {
      setIsSavingCourse(false);
    }
  };
  const handleSaveCourse = async () => {
    if (!selectedCourse) {
      return;
    }
    setIsSavingCourse(true);
    setStatus({ type: "idle", message: "" });
    try {
      const coursePayload = {
        id: selectedCourse.id,
        offering_id: selectedCourse.offering_id,
        title: selectedCourse.title || "Untitled course",
        description: selectedCourse.description || null,
        access_period_days: selectedCourse.access_period_days ? Number(selectedCourse.access_period_days) : null,
        is_active: Boolean(selectedCourse.is_active),
        updated_at: new Date().toISOString(),
      };
      const { error: courseError } = await supabase.from(coursesTable).upsert(coursePayload);
      if (courseError) {
        throw courseError;
      }

      const currentItems = courseItems.filter((item) => item.course_id === selectedCourse.id);
      const currentModules = courseModules.filter((m) => m.course_id === selectedCourse.id);

      if (deletedCourseItemIds.length) {
        // Filter out any temporary IDs from the delete list before sending to DB
        const realDeleteIds = deletedCourseItemIds.filter(id => typeof id === "string" && !id.startsWith("new-"));
        if (realDeleteIds.length) {
          const { error: deleteError } = await supabase.from(courseItemsTable).delete().in("id", realDeleteIds);
          if (deleteError) throw deleteError;
        }
      }
      if (deletedCourseModuleIds.length) {
        const realDeleteModuleIds = deletedCourseModuleIds.filter(id => typeof id === "string" && !id.startsWith("new-"));
        if (realDeleteModuleIds.length) {
          const { error: deleteModuleError } = await supabase.from(courseModulesTable).delete().in("id", realDeleteModuleIds);
          if (deleteModuleError) throw deleteModuleError;
        }
      }

      // Legacy ID Migration Map (handles items created before the UUID refactor)
      const legacyIdMap = {};
      const getValidId = (id) => {
        if (typeof id === "string" && id.startsWith("new-")) {
          if (!legacyIdMap[id]) legacyIdMap[id] = crypto.randomUUID();
          return legacyIdMap[id];
        }
        return id;
      };

      // Upsert Modules
      const moduleRows = currentModules.map((m, index) => ({
        id: getValidId(m.id),
        course_id: selectedCourse.id,
        sort_order: index,
        title: m.title || "Untitled module",
        description: m.description || null,
        is_active: Boolean(m.is_active),
        updated_at: new Date().toISOString(),
      }));

      let upsertedModules = [];
      if (moduleRows.length) {
        const { data, error: modulesError } = await supabase.from(courseModulesTable).upsert(moduleRows).select("*");
        if (modulesError) throw modulesError;
        upsertedModules = data || [];
      }

      const itemRows = currentItems.map((item, index) => ({
        id: getValidId(item.id),
        course_id: selectedCourse.id,
        module_id: getValidId(item.module_id) || null,
        sort_order: index,
        title: item.title || "Untitled content",
        description: item.description || null,
        content_type: item.content_type || "text",
        body: item.body || null,
        youtube_url: item.youtube_url || null,
        file_url: item.file_url || null,
        storage_path: item.storage_path || null,
        external_url: item.external_url || null,
        allow_download: Boolean(item.allow_download),
        is_active: Boolean(item.is_active),
        unlock_after_days: item.unlock_after_days ? Number(item.unlock_after_days) : 0,
        unlock_on_completion_id: getValidId(item.unlock_on_completion_id) || null,
        updated_at: new Date().toISOString(),
      }));
      let upsertedItems = [];
      if (itemRows.length) {
        const { data, error: itemsError } = await supabase
          .from(courseItemsTable)
          .upsert(itemRows)
          .select("*");
        if (itemsError) {
          throw itemsError;
        }
        upsertedItems = data || [];
      }
      setCourseItems((prev) => [
        ...prev.filter((item) => item.course_id !== selectedCourse.id),
        ...(upsertedItems || []),
      ]);
      setCourseModules((prev) => [
        ...prev.filter((m) => m.course_id !== selectedCourse.id),
        ...(upsertedModules || []),
      ]);
      setDeletedCourseItemIds([]);
      setDeletedCourseModuleIds([]);
      setStatus({ type: "success", message: "Course saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save course." });
    } finally {
      setIsSavingCourse(false);
    }
  };
  const { handleCourseMediaUpload, handleHeroImageUpload, handleOfferingImageUpload, handleProfileImageUpload, handleReviewImageUpload } =
    useCatalogAdminUploads({
      editor,
      reviewsEditor,
      selectedSection,
      setStatus,
      setUploadingTarget,
      siteSettingsEditor,
      updateEditor,
      updateReviewEditor,
      updateSectionEditor,
      updateSiteSettings,
    });
  const {
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
  } = useCatalogAdminSaves({
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
  });

  const selectedModeMeta = offeringModeMeta[editor?.cta_type || "contact"] || offeringModeMeta.contact;
  const productsState = {
    editor,
    isCreatingOffering,
    isCreatingSection,
    isSavingOffering,
    isSavingSection,
    newOffering,
    newSection,
    offerings,
    offeringsBySection,
    offeringsForSelectedSection,
    sections,
    sectionsById,
    selectedModeMeta,
    selectedOfferingId,
    selectedSection,
    selectedSectionId,
    showNewOfferingForm,
    showNewSectionForm,
    uploadingTarget,
  };
  const productsActions = {
    handleCreateOffering,
    handleCreateSection,
    handleHeroImageUpload,
    handleOfferingImageUpload,
    handleSaveOffering,
    handleSaveSection,
    setSelectedOfferingId,
    setSelectedSectionId,
    setShowNewOfferingForm,
    setShowNewSectionForm,
    updateEditor,
    updateNewOffering,
    updateNewSection,
    updateSectionEditor,
  };
  const websiteState = {
    isFooterEditorSelected,
    isSavingSite,
    offerings,
    selectedSiteSection,
    selectedSiteSectionId,
    selectedSiteSectionIndex,
    selectedSiteSectionItems,
    selectedSiteSectionMeta,
    siteSettingsEditor,
    uploadingTarget,
  };
  const websiteActions = {
    addSiteLink,
    addSiteSectionItem,
    applyThemePreset,
    handleProfileImageUpload,
    handleSaveSiteSettings,
    moveSiteLink,
    moveSiteSection,
    moveSiteSectionItem,
    removeSiteLink,
    removeSiteSectionItem,
    setSelectedSiteSectionId,
    updateSiteFaqs,
    updateSiteFooter,
    updateSiteLink,
    updateSiteSection,
    updateSiteSectionItem,
    updateSiteSettings,
  };
  const sharedContentState = {
    globalEditor,
    isSavingGlobal,
  };
  const sharedContentActions = {
    handleSaveGlobalContent,
    updateGlobalEditor,
  };
  const reviewsState = {
    isSavingReviews,
    offeringsBySection,
    reviewsEditor,
    sections,
    uploadingTarget,
  };
  const reviewsActions = {
    handleReviewImageUpload,
    handleSaveReviews,
    setReviewsEditor,
    updateReviewEditor,
  };
  const coursesState = {
    courseAccess,
    courseItems,
    courseModules,
    courses,
    isSavingCourse,
    newCourseOfferingId,
    offerings,
    selectedCourse,
    selectedCourseId,
    uploadingTarget,
  };
  const coursesActions = {
    addCourseItem,
    addCourseModule,
    createCourseForOffering,
    deleteCourseItem,
    deleteCourseModule,
    handleCourseMediaUpload,
    handleSaveCourse,
    setNewCourseOfferingId,
    setSelectedCourseId,
    updateCourse,
    updateCourseItem,
    updateCourseModule,
  };

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
    <div ref={adminRef} className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <main className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className={`mx-auto mb-6 flex max-w-[1500px] flex-wrap items-end justify-between gap-4 transition-[padding] duration-300 ${adminContentOffsetClass}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-200/70">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Catalog Admin</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {selectedAdminTab.label}
          </div>
        </div>

        {isLoadingData ? (
          <div data-gsap-pulse className="grid gap-5 md:grid-cols-[5rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="rounded-3xl border border-white/10 bg-[#11161f] p-3">
              <Skeleton className="mb-4 h-10 w-full rounded-2xl bg-white/10" />
              <div className="space-y-3">
                <Skeleton className="h-11 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-11 w-full rounded-2xl bg-white/10" />
                <Skeleton className="h-11 w-full rounded-2xl bg-white/10" />
              </div>
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
          <div>
            {!isMobileDrawerOpen ? (
              <button
                type="button"
                className="fixed bottom-5 right-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-teal-300/25 bg-gray-950/90 text-teal-100 shadow-2xl shadow-black/40 backdrop-blur md:hidden"
                aria-label="Open admin menu"
                onClick={() => setIsMobileDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            ) : null}

            {isMobileDrawerOpen ? (
              <button
                type="button"
                className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm md:hidden"
                aria-label="Close admin sidebar"
                onClick={() => setIsMobileDrawerOpen(false)}
              />
            ) : null}
            <aside
              style={{ bottom: `${sidebarBottomOffset}px` }}
              className={`fixed z-40 overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_36%),linear-gradient(180deg,rgba(17,22,31,0.96),rgba(3,4,6,0.96))] shadow-2xl shadow-black/30 transition-[width,bottom] duration-300 md:left-6 md:top-24 md:rounded-3xl lg:left-8 ${isMobileDrawerOpen ? "left-4 top-20 block w-[18rem] rounded-3xl md:w-[4.75rem]" : "left-4 top-24 hidden w-[4.75rem] rounded-3xl md:block"} ${isSidebarExpanded ? "lg:w-[17rem]" : "lg:w-[4.75rem]"}`}>
              <div className="flex h-full flex-col">
                <div className={`flex items-center border-b border-white/10 p-3 ${isMobileDrawerOpen ? "justify-between gap-3" : isSidebarExpanded ? "justify-center lg:justify-between lg:gap-3" : "justify-center"}`}>
                  <div className={`min-w-0 transition-opacity ${isMobileDrawerOpen ? "opacity-100" : isSidebarExpanded ? "pointer-events-none w-0 opacity-0 lg:pointer-events-auto lg:w-auto lg:opacity-100" : "pointer-events-none w-0 opacity-0"}`}>
                    <p className="truncate text-xs font-bold uppercase tracking-[0.24em] text-teal-200">High Frequencies</p>
                    <p className="mt-1 truncate text-xs text-white/45">Admin control</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.matchMedia("(max-width: 767px)").matches) {
                        setIsMobileDrawerOpen(false);
                        return;
                      }
                      if (window.matchMedia("(min-width: 1024px)").matches) {
                        setIsSidebarExpanded((value) => !value);
                      }
                    }}
                    className={`inline-flex shrink-0 items-center justify-center rounded-full text-white/70 transition hover:border-teal-300/30 hover:bg-teal-300/10 hover:text-teal-100 ${isMobileDrawerOpen ? "h-11 w-11" : isSidebarExpanded ? "h-12 w-full max-lg:pointer-events-none lg:h-11 lg:w-11" : "h-12 w-full max-lg:pointer-events-none"}`}
                    aria-label={isMobileDrawerOpen || isSidebarExpanded ? "Collapse admin sidebar" : "Expand admin sidebar"}
                    title={isMobileDrawerOpen || isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    {isMobileDrawerOpen ? (
                      <X className="h-5 w-5" />
                    ) : isSidebarExpanded ? (
                      <>
                        <X className="hidden h-5 w-5 lg:block" />
                        <Menu className="h-5 w-5 lg:hidden" />
                      </>
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Admin sections">
                  <div className="space-y-1.5">
                    {adminTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeAdminTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-controls={`account-${tab.id}-panel`}
                          id={`account-${tab.id}-tab`}
                          title={tab.label}
                          onClick={() => {
                            setActiveAdminTab(tab.id);
                            if (window.matchMedia("(max-width: 767px)").matches) {
                              setIsMobileDrawerOpen(false);
                            }
                          }}
                          className={`group relative flex h-12 w-full items-center rounded-2xl border text-sm font-semibold transition ${isMobileDrawerOpen ? "justify-start gap-3 px-3 text-left" : isSidebarExpanded ? "justify-center px-0 lg:justify-start lg:gap-3 lg:px-3 lg:text-left" : "justify-center px-0"} ${isActive
                            ? "border-teal-300/30 bg-teal-300/15 text-teal-50 shadow-[0_16px_35px_rgba(45,212,191,0.12)]"
                            : "border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                            }`}
                        >
                          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-teal-200" : "text-white/42 group-hover:text-white/75"}`} />
                          {isMobileDrawerOpen || isSidebarExpanded ? <span className={`truncate ${isMobileDrawerOpen ? "" : "hidden lg:inline"}`}>{tab.label}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </nav>

              </div>
            </aside>

            <section
              role="tabpanel"
              aria-labelledby={`account-${activeAdminTab}-tab`}
              id={`account-${activeAdminTab}-panel`}
              className={`mx-auto min-w-0 max-w-[1500px] transition-[padding] duration-300 ${adminContentOffsetClass}`}
            >
              {activeAdminTab === "dashboard" ? <AdminDashboard stats={dashboardStats} /> : null}

              {activeAdminTab === "analytics" ? (
                <AnalyticsTab offeringAnalytics={offeringAnalytics} userLearningPaths={userLearningPaths} />
              ) : null}

              {activeAdminTab === "content-audit" ? (
                <ContentAuditTab contentAuditTrail={contentAuditTrail} />
              ) : null}

              {activeAdminTab === "site" ? <WebsiteTab state={websiteState} actions={websiteActions} /> : null}

              {activeAdminTab === "newsletter" ? <NewsletterTab /> : null}

              {activeAdminTab === "offerings" ? <ProductsTab state={productsState} actions={productsActions} /> : null}

              {activeAdminTab === "courses" ? <CoursesTab state={coursesState} actions={coursesActions} /> : null}

              {activeAdminTab === "shared" ? <SharedContentTab state={sharedContentState} actions={sharedContentActions} /> : null}

              {activeAdminTab === "reviews" ? <ReviewsTab state={reviewsState} actions={reviewsActions} /> : null}

              {activeAdminTab === "fulfillment" ? <FulfillmentTab /> : null}
            </section>
          </div>
        ) : null}
      </main>
      <ReviewSaveSummaryModal
        reviewSaveSummary={reviewSaveSummary}
        setReviewSaveSummary={setReviewSaveSummary}
        persistReviews={persistReviews}
        isSavingReviews={isSavingReviews}
      />
      <div ref={footerRef}><Footer /></div>
    </div>
  );
};

export default CatalogAdmin;
