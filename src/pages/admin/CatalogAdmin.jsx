import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabase-client";

const sectionsTable = import.meta.env.VITE_SUPABASE_SECTIONS_TABLE || "storefront_sections";
const offeringsTable = import.meta.env.VITE_SUPABASE_OFFERINGS_TABLE || "storefront_offerings";
const globalContentTable = import.meta.env.VITE_SUPABASE_GLOBAL_CONTENT_TABLE || "storefront_global_content";
const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";

const toLines = (list) => (list || []).join("\n");
const fromLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const createEmptyReview = () => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  placement: "home",
  offering_id: "",
  heading: "",
  quote: "",
  author: "",
  image_url: "",
  image_alt: "",
  sort_order: 0,
  is_active: true,
});

const AccordionSection = ({ title, subtitle, isOpen, onToggle, children }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-white/60">{subtitle}</p> : null}
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-teal-200">{isOpen ? "Close" : "Open"}</span>
    </button>
    {isOpen ? <div className="border-t border-white/10 p-5">{children}</div> : null}
  </section>
);

const CatalogAdmin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [openPanel, setOpenPanel] = useState("offerings");
  const [sections, setSections] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [editor, setEditor] = useState(null);
  const [reviewsEditor, setReviewsEditor] = useState([]);
  const [globalEditor, setGlobalEditor] = useState({
    manualInstructionsText: "",
    legalNotesText: "",
    closingNotesText: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSavingOffering, setIsSavingOffering] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingReviews, setIsSavingReviews] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const sectionsById = useMemo(
    () => sections.reduce((acc, section) => ({ ...acc, [section.id]: section }), {}),
    [sections],
  );

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoadingData(true);
      setStatus({ type: "idle", message: "" });

      const [sectionsRes, offeringsRes, highlightsRes, paymentRes, globalRes, reviewsRes] = await Promise.all([
        supabase.from(sectionsTable).select("*").order("sort_order", { ascending: true }),
        supabase.from(offeringsTable).select("*").order("sort_order", { ascending: true }),
        supabase
          .from("storefront_offering_highlights")
          .select("offering_id,sort_order,text")
          .order("sort_order", { ascending: true }),
        supabase
          .from("storefront_offering_payment_methods")
          .select("offering_id,sort_order,method")
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
        paymentRes.error,
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
      const paymentMethods = group(paymentRes.data, "method");

      const mergedOfferings = (offeringsRes.data || []).map((row) => ({
        ...row,
        highlights: highlights[row.id] || [],
        paymentMethods: paymentMethods[row.id] || [],
      }));

      const globalData = globalRes.data || {};
      setGlobalEditor({
        manualInstructionsText: toLines(globalData.manual_instructions || []),
        legalNotesText: toLines(globalData.legal_notes || []),
        closingNotesText: toLines(globalData.closing_notes || []),
      });

      setReviewsEditor((reviewsRes.data || []).map((row) => ({ ...row, offering_id: row.offering_id || "" })));
      setSections(sectionsRes.data || []);
      setOfferings(mergedOfferings);
      if (!selectedOfferingId && mergedOfferings.length) {
        setSelectedOfferingId(mergedOfferings[0].id);
      }
      setIsLoadingData(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, selectedOfferingId]);

  useEffect(() => {
    const selected = offerings.find((entry) => entry.id === selectedOfferingId);
    if (!selected) {
      setEditor(null);
      return;
    }
    setEditor({
      ...selected,
      highlightsText: toLines(selected.highlights),
      paymentMethodsText: toLines(selected.paymentMethods),
    });
  }, [offerings, selectedOfferingId]);

  const updateEditor = (name, value) => setEditor((prev) => ({ ...prev, [name]: value }));
  const updateGlobalEditor = (name, value) => setGlobalEditor((prev) => ({ ...prev, [name]: value }));
  const updateReviewEditor = (index, key, value) => {
    setReviewsEditor((prev) => prev.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry)));
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
        cta_label: editor.cta_label || null,
        action_link: editor.action_link || null,
        checkout_fallback_message: editor.checkout_fallback_message || null,
        price_usd: editor.price_usd || null,
        purchase_label: editor.purchase_label || null,
        purchase_link: editor.purchase_link || null,
        manual_support_label: editor.manual_support_label || null,
        manual_support_link: editor.manual_support_link || null,
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
      await replaceRows(
        "storefront_offering_payment_methods",
        editor.id,
        fromLines(editor.paymentMethodsText).map((method, index) => ({ offering_id: editor.id, sort_order: index, method })),
      );

      setStatus({ type: "success", message: "Offering saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save offering." });
    } finally {
      setIsSavingOffering(false);
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

  const handleSaveReviews = async () => {
    setIsSavingReviews(true);
    setStatus({ type: "idle", message: "" });
    try {
      const normalizedRows = reviewsEditor.map((entry, index) => ({
        placement: entry.placement || "home",
        offering_id: entry.offering_id || null,
        heading: entry.heading || null,
        quote: (entry.quote || "").trim(),
        author: (entry.author || "").trim(),
        image_url: (entry.image_url || "").trim() || null,
        image_alt: (entry.image_alt || "").trim() || null,
        sort_order: Number(entry.sort_order ?? index),
        is_active: Boolean(entry.is_active),
      }));

      const invalid = normalizedRows.find((row) => !row.quote || !row.author);
      if (invalid) {
        throw new Error("Every review needs both quote and author.");
      }

      const { error: deleteError } = await supabase.from(reviewsTable).delete().gte("id", 0);
      if (deleteError) {
        throw deleteError;
      }

      if (normalizedRows.length) {
        const { error: insertError } = await supabase.from(reviewsTable).insert(normalizedRows);
        if (insertError) {
          throw insertError;
        }
      }

      setStatus({ type: "success", message: "Reviews saved successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Unable to save reviews." });
    } finally {
      setIsSavingReviews(false);
    }
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
        <p className="text-sm text-white/65">Edit one area at a time using the sections below.</p>
        {status.message ? (
          <p
            className={`rounded-2xl border p-3 text-sm ${
              status.type === "error"
                ? "border-rose-300/40 bg-rose-300/10 text-rose-100"
                : "border-teal-300/40 bg-teal-300/10 text-teal-100"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        {isLoadingData ? <p>Loading catalog...</p> : null}

        {!isLoadingData ? (
          <>
            <AccordionSection
              title="Offerings"
              subtitle="Update product cards, text, pricing, media and offering-level highlights."
              isOpen={openPanel === "offerings"}
              onToggle={() => setOpenPanel((prev) => (prev === "offerings" ? "" : "offerings"))}
            >
              <div className="space-y-4">
                <select
                  value={selectedOfferingId}
                  onChange={(event) => setSelectedOfferingId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
                >
                  {offerings.map((offering) => (
                    <option key={offering.id} value={offering.id} className="bg-gray-900">
                      {offering.title}
                    </option>
                  ))}
                </select>

                {editor ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["title", "Title"],
                        ["subtitle", "Subtitle"],
                        ["price_usd", "Price (USD only)"],
                        ["cta_label", "CTA label"],
                        ["action_link", "Action link"],
                        ["image_url", "Image URL"],
                        ["image_alt", "Image alt"],
                        ["purchase_label", "Purchase label"],
                        ["purchase_link", "Purchase link"],
                        ["manual_support_label", "Manual support label"],
                        ["manual_support_link", "Manual support link"],
                        ["sort_order", "Sort order"],
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
                        <span>Section</span>
                        <select
                          value={editor.section_id || ""}
                          onChange={(event) => updateEditor("section_id", event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          {sections.map((section) => (
                            <option key={section.id} value={section.id} className="bg-gray-900">
                              {section.title} ({section.id})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="space-y-1 text-xs text-white/60">
                      <span>Summary</span>
                      <textarea
                        value={editor.summary || ""}
                        onChange={(event) => updateEditor("summary", event.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Long description</span>
                      <textarea
                        value={editor.long_description || ""}
                        onChange={(event) => updateEditor("long_description", event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["highlightsText", "Highlights (one per line)"],
                        ["paymentMethodsText", "Payment methods (one per line)"],
                      ].map(([key, label]) => (
                        <label key={key} className="space-y-1 text-xs text-white/60">
                          <span>{label}</span>
                          <textarea
                            value={editor[key] || ""}
                            onChange={(event) => updateEditor(key, event.target.value)}
                            rows={6}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(editor.is_active)}
                        onChange={(event) => updateEditor("is_active", event.target.checked)}
                      />
                      Active
                    </label>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                      Selected section: {sectionsById[editor.section_id]?.title || editor.section_id}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveOffering}
                      disabled={isSavingOffering}
                      className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 disabled:opacity-60"
                    >
                      {isSavingOffering ? "Saving..." : "Save offerings changes"}
                    </button>
                  </div>
                ) : null}
              </div>
            </AccordionSection>

            <AccordionSection
              title="Shared Checkout Content"
              subtitle="One place for legal notes, manual payment instructions, and buy-page closing notes."
              isOpen={openPanel === "shared"}
              onToggle={() => setOpenPanel((prev) => (prev === "shared" ? "" : "shared"))}
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["manualInstructionsText", "Manual instructions (one per line)"],
                    ["legalNotesText", "Legal notes (one per line)"],
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
            </AccordionSection>

            <AccordionSection
              title="Reviews"
              subtitle="Manage multiple reviews for home testimonials and offering-specific buy pages."
              isOpen={openPanel === "reviews"}
              onToggle={() => setOpenPanel((prev) => (prev === "reviews" ? "" : "reviews"))}
            >
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
                          <span>Offering (optional)</span>
                          <select
                            value={review.offering_id || ""}
                            onChange={(event) => updateReviewEditor(index, "offering_id", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          >
                            <option value="" className="bg-gray-900">None</option>
                            {offerings.map((offering) => (
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
                          <input
                            value={review.image_url || ""}
                            onChange={(event) => updateReviewEditor(index, "image_url", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>

                        <label className="space-y-1 text-xs text-white/60">
                          <span>Review image alt</span>
                          <input
                            value={review.image_alt || ""}
                            onChange={(event) => updateReviewEditor(index, "image_alt", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>

                        <label className="space-y-1 text-xs text-white/60">
                          <span>Sort order</span>
                          <input
                            type="number"
                            value={review.sort_order ?? index}
                            onChange={(event) => updateReviewEditor(index, "sort_order", event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs text-white/70">
                          <input
                            type="checkbox"
                            checked={Boolean(review.is_active)}
                            onChange={(event) => updateReviewEditor(index, "is_active", event.target.checked)}
                          />
                          Active
                        </label>
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

                      <button
                        type="button"
                        onClick={() => setReviewsEditor((prev) => prev.filter((_, entryIndex) => entryIndex !== index))}
                        className="rounded-full border border-rose-300/40 bg-rose-300/10 px-4 py-2 text-xs font-semibold text-rose-100"
                      >
                        Remove review
                      </button>
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
            </AccordionSection>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default CatalogAdmin;
