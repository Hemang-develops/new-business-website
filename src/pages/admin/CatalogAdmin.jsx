import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabase-client";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Skeleton } from "../../components/ui/skeleton";

const sectionsTable = import.meta.env.VITE_SUPABASE_SECTIONS_TABLE || "storefront_sections";
const offeringsTable = import.meta.env.VITE_SUPABASE_OFFERINGS_TABLE || "storefront_offerings";
const globalContentTable = import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";
const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "site-media";

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

const CatalogAdmin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
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
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingOffering, setIsSavingOffering] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
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

      const [sectionsRes, offeringsRes, highlightsRes, globalRes, reviewsRes] = await Promise.all([
        supabase.from(sectionsTable).select("*").order("sort_order", { ascending: true }),
        supabase.from(offeringsTable).select("*").order("sort_order", { ascending: true }),
        supabase
          .from("storefront_offering_highlights")
          .select("offering_id,sort_order,text")
          .order("sort_order", { ascending: true }),
        supabase
          .from(globalContentTable)
          .select("manual_instructions,legal_notes,closing_notes,success_heading,success_quote,success_author")
          .eq("id", 1)
          .maybeSingle(),
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
        highlights: highlights[row.id] || [],
      }));
      const getLoadedSectionIdForOffering = (offeringId) =>
        mergedOfferings.find((entry) => entry.id === offeringId)?.section_id || "";

      const globalData = globalRes.data || {};
      setGlobalEditor({
        manualInstructionsText: toLines(globalData.manual_instructions || []),
        legalNotesText: toLines(globalData.legal_notes || []),
        closingNotesText: toLines(globalData.closing_notes || []),
      });

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

  const handleSaveOffering = async () => {
    if (!editor) {
      return;
    }
    setIsSavingOffering(true);
    setStatus({ type: "idle", message: "" });
    try {
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
        image_url: editor.image_url || null,
        image_alt: editor.image_alt || null,
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

      setOfferings((prev) =>
        prev.map((entry) =>
          entry.id === editor.id
            ? {
              ...entry,
              ...basePayload,
              highlights: fromLines(editor.highlightsText),
            }
            : entry,
        ),
      );
      setSelectedSectionId(editor.section_id);
      setStatus({ type: "success", message: "Offering saved successfully." });
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
        image_url: null,
        image_alt: null,
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
      setNewOffering({ title: "", subtitle: "", price_usd: "" });
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
              <ToggleGroupItem value="offerings">Offerings</ToggleGroupItem>
              <ToggleGroupItem value="shared">Shared Checkout Content</ToggleGroupItem>
              <ToggleGroupItem value="reviews">Reviews</ToggleGroupItem>
            </ToggleGroup>

            {activeAdminTab === "dashboard" ? <AdminDashboard /> : null}

            {activeAdminTab === "offerings" ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-white">Offerings</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Choose an offering type first, then edit one offering in a cleaner single-screen form.
                  </p>
                </div>
                <div className="space-y-4">
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
                    <div className="grid gap-4 xl:grid-cols-2">
                      {showNewSectionForm ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
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
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
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
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block space-y-1 text-xs text-white/60">
                                <span>Subtitle</span>
                                <input
                                  value={newOffering.subtitle}
                                  onChange={(event) => updateNewOffering("subtitle", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  placeholder="Optional subtitle"
                                />
                              </label>
                              <label className="block space-y-1 text-xs text-white/60">
                                <span>Price (USD)</span>
                                <input
                                  value={newOffering.price_usd}
                                  onChange={(event) => updateNewOffering("price_usd", event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                  placeholder="Optional"
                                />
                              </label>
                            </div>
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

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Offering type</span>
                      <select
                        value={selectedSectionId}
                        onChange={(event) => setSelectedSectionId(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      >
                        {sections.map((section) => (
                          <option key={section.id} value={section.id} className="bg-gray-900">
                            {section.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Offering</span>
                      <select
                        value={selectedOfferingId}
                        onChange={(event) => setSelectedOfferingId(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      >
                        {offeringsForSelectedSection.map((offering) => (
                          <option key={offering.id} value={offering.id} className="bg-gray-900">
                            {offering.title}
                          </option>
                        ))}
                      </select>
                    </label>
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
                        <div className="grid gap-3">
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
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Core content</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {[
                                ["title", "Title"],
                                ["subtitle", "Subtitle"],
                                ["price_usd", "Price (USD only)"],
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
                            </div>

                            <label className="mt-3 block space-y-1 text-xs text-white/60">
                              <span>Summary</span>
                              <textarea
                                value={editor.summary || ""}
                                onChange={(event) => updateEditor("summary", event.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                            </label>

                            <label className="mt-3 block space-y-1 text-xs text-white/60">
                              <span>Long description</span>
                              <textarea
                                value={editor.long_description || ""}
                                onChange={(event) => updateEditor("long_description", event.target.value)}
                                rows={6}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                            </label>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Offer details</p>
                            <label className="mt-4 block space-y-1 text-xs text-white/60">
                              <span>Highlights (one per line)</span>
                              <textarea
                                value={editor.highlightsText || ""}
                                onChange={(event) => updateEditor("highlightsText", event.target.value)}
                                rows={6}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Media and placement</p>
                            <div className="mt-4 grid gap-3">
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

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                            <p className="font-semibold uppercase tracking-[0.24em] text-white/45">Editing now</p>
                            <p className="mt-3 text-sm font-semibold text-white">
                              {editor.title || "Untitled offering"}
                            </p>
                            <p className="mt-1">
                              Type: {sectionsById[editor.section_id]?.title || editor.section_id}
                            </p>
                            <p className="mt-1">ID: {editor.id}</p>
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
