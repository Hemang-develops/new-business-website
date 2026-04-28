import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/AuthContext";
import { applyThemeVariables, useSiteSettings } from "../../context/SiteSettingsContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../supabase-client";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Skeleton } from "../../components/ui/skeleton";
import { useGsapPulse } from "../../hooks/useGsapMotion";
import { defaultSiteSettings, normalizeSiteSettingsFromRows } from "../../services/siteSettings";
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
const CatalogAdmin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { refreshSettings } = useSiteSettings();
  const toast = useToast();
  const adminRef = useRef(null);
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
    faqs: [],
  });
  const [siteSettingsEditor, setSiteSettingsEditor] = useState(defaultSiteSettings);
  const [selectedSiteSectionId, setSelectedSiteSectionId] = useState("hero");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard");
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

  const profileTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "site", label: "Website" },
    { id: "offerings", label: "Products" },
    { id: "courses", label: "Courses" },
    { id: "shared", label: "Shared Checkout Content" },
    { id: "reviews", label: "Reviews" },
    { id: "fulfillment", label: "Fulfillment" },
  ];

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
    return {
      totalCourses: courses.length,
      activeCourseAccess: activeAccess.length,
      totalCoursePurchases: courseAccess.length,
      courseRevenueLabel: courseRevenueLabel || "No payments yet",
      recentNotifications: adminNotifications.slice(0, 8),
    };
  }, [adminNotifications, courseAccess, courses.length]);

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
          refreshSettings(),
        ]);
      } catch (err) {
        if (isMounted) {
          setStatus({ type: "error", message: err.message || "Unable to load catalog." });
          setIsLoadingData(false);
        }
        return;
      }

      const [
        sectionsRes,
        offeringsRes,
        reviewsRes,
        coursesRes,
        courseModulesRes,
        courseItemsRes,
        courseAccessRes,
        adminNotificationsRes,
        settingsData,
      ] = results;

      const firstError = [
        sectionsRes.error,
        offeringsRes.error,
        reviewsRes.error,
        coursesRes.error,
        courseModulesRes.error,
        courseItemsRes.error,
        courseAccessRes.error,
        adminNotificationsRes.error,
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
      setGlobalEditor({
        manualInstructionsText: toLines(globalData.manual_instructions || []),
        legalNotesText: toLines(globalData.legal_notes || []),
        closingNotesText: toLines(globalData.closing_notes || []),
        faqs: Array.isArray(globalData.faqs) ? globalData.faqs : [],
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
      <main className="mx-auto max-w-6xl space-y-6 pb-20 pt-32">
        <h1 className="text-3xl font-semibold">Catalog Admin</h1>

        {isLoadingData ? (
          <div data-gsap-pulse className="space-y-6">
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
            <div className="border-b border-white/20">
              <div
                role="tablist"
                aria-label="Account sections"
                className="flex flex-row"
              >
                {profileTabs.map((tab) => {
                  const isActive = activeAdminTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`account-${tab.id}-panel`}
                      id={`account-${tab.id}-tab`}
                      onClick={() => setActiveAdminTab(tab.id)}
                      className={`relative min-h-14 px-2 pr-4 pb-4 text-center text-xs font-semibold uppercase tracking-[0.35em] transition sm:text-sm ${isActive
                          ? "text-teal-100"
                          : "text-white/50 hover:text-white/80"
                        }`}
                    >
                      {tab.label}
                      <span
                        className={`absolute bottom-[-1px] left-0 h-1 bg-teal-300 transition-all duration-300 ${isActive ? "w-full opacity-100" : "w-0 opacity-0"
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {activeAdminTab === "dashboard" ? <AdminDashboard stats={dashboardStats} /> : null}

            {activeAdminTab === "site" ? <WebsiteTab state={websiteState} actions={websiteActions} /> : null}

            {activeAdminTab === "offerings" ? <ProductsTab state={productsState} actions={productsActions} /> : null}

            {activeAdminTab === "courses" ? <CoursesTab state={coursesState} actions={coursesActions} /> : null}

            {activeAdminTab === "shared" ? <SharedContentTab state={sharedContentState} actions={sharedContentActions} /> : null}

            {activeAdminTab === "reviews" ? <ReviewsTab state={reviewsState} actions={reviewsActions} /> : null}
            
            {activeAdminTab === "fulfillment" ? <FulfillmentTab /> : null}
          </div>
        ) : null}
      </main>
      <ReviewSaveSummaryModal
        reviewSaveSummary={reviewSaveSummary}
        setReviewSaveSummary={setReviewSaveSummary}
        persistReviews={persistReviews}
        isSavingReviews={isSavingReviews}
      />
      <Footer />
    </div>
  );
};

export default CatalogAdmin;

