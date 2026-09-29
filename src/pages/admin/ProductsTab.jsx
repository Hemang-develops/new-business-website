import { useState, useMemo, useEffect, useRef } from "react";
import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import AdminInfoHint from "./AdminInfoHint";
import ImageUploader from "@/components/ui/ImageUploader";
import { ctaTypeOptions, fulfillmentModeMeta, fulfillmentModeOptions, offeringModeMeta } from "./catalogAdminConfig";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  ExternalLink,
  Layers,
  FolderKanban,
  Check,
  AlertTriangle,
  Package,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Globe,
  FileText,
  Settings2,
} from "lucide-react";

const STORAGE_KEY_COLUMNS = "admin_products_visible_cols_v1";

const defaultVisibleColumns = {
  category: true,
  price: true,
  deliveryMode: true,
  status: true,
};

const ProductsTab = ({ state, actions }) => {
  const {
    editor,
    isCreatingOffering,
    isCreatingSection,
    isDeletingOffering,
    isSavingOffering,
    isSavingSection,
    newOffering,
    newSection,
    offerings,
    sections,
    sectionsById,
    selectedModeMeta,
    selectedOfferingId,
    selectedSection,
    selectedSectionId,
    showNewOfferingForm,
    uploadingTarget,
  } = state;

  const {
    handleCreateOffering,
    handleCreateSection,
    handleDeleteOffering,
    handleHeroImageUpload,
    handleOfferingDeliveryUpload,
    handleOfferingImageUpload,
    handleSaveOffering,
    handleSaveSection,
    handleTogglePublishOffering,
    setSelectedOfferingId,
    setSelectedSectionId,
    setShowNewOfferingForm,
    updateEditor,
    updateNewOffering,
    updateNewSection,
    updateSectionEditor,
  } = actions;

  // Local UI filters, search, and modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'live' | 'draft'
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showNewSectionInModal, setShowNewSectionInModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [statusChangeCandidate, setStatusChangeCandidate] = useState(null);

  // Column visibility selector with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COLUMNS);
      return stored ? { ...defaultVisibleColumns, ...JSON.parse(stored) } : defaultVisibleColumns;
    } catch {
      return defaultVisibleColumns;
    }
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef(null);

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [colKey]: !prev[colKey] };
      try {
        localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Close column picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    if (showColumnPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnPicker]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSectionId, filterStatus, pageSize]);

  // Filtered offerings list for Master Table
  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = offering.title?.toLowerCase().includes(query);
        const matchesSubtitle = offering.subtitle?.toLowerCase().includes(query);
        const matchesId = offering.id?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubtitle && !matchesId) return false;
      }
      if (filterSectionId !== "all" && offering.section_id !== filterSectionId) {
        return false;
      }
      if (filterStatus === "live" && !offering.is_active) return false;
      if (filterStatus === "draft" && offering.is_active) return false;

      return true;
    });
  }, [offerings, searchQuery, filterSectionId, filterStatus]);

  // Pagination computations
  const totalItems = filteredOfferings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOfferings = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredOfferings.slice(startIdx, startIdx + pageSize);
  }, [filteredOfferings, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Summary statistics
  const liveCount = useMemo(() => offerings.filter((o) => o.is_active).length, [offerings]);
  const draftCount = offerings.length - liveCount;

  // Unified Drawer target (either editing existing product or creating new product)
  const isCreateMode = Boolean(showNewOfferingForm);
  const isDrawerOpen = isCreateMode || Boolean(editor);
  const drawerOffering = isCreateMode ? newOffering : editor;
  const drawerUpdater = isCreateMode ? updateNewOffering : updateEditor;
  const drawerModeMeta = offeringModeMeta[drawerOffering?.cta_type || "checkout"] || offeringModeMeta.checkout;

  // Reset or pre-fill new offering when opening create mode
  const openAddProductDrawer = () => {
    const defaultSection = filterSectionId !== "all" ? filterSectionId : sections[0]?.id || "";
    updateNewOffering("section_id", defaultSection);
    updateNewOffering("title", "");
    updateNewOffering("subtitle", "");
    updateNewOffering("price_usd", "");
    updateNewOffering("cta_type", "checkout");
    updateNewOffering("fulfillment_mode", "digital");
    updateNewOffering("digital_delivery_type", "download");
    updateNewOffering("summary", "");
    updateNewOffering("long_description", "");
    updateNewOffering("image_url", "");
    updateNewOffering("image_alt", "");
    updateNewOffering("delivery_url", "");
    updateNewOffering("reading_email_body", "");
    updateNewOffering("access_expiry_days", "");
    updateNewOffering("duration_minutes", 60);
    updateNewOffering("booking_cta_label", "Book now");
    updateNewOffering("action_link", "");
    updateNewOffering("checkout_fallback_message", "");
    updateNewOffering("cta_label", "");
    setSelectedOfferingId("");
    setShowNewOfferingForm(true);
  };

  const closeDrawer = () => {
    setShowNewOfferingForm(false);
    setSelectedOfferingId("");
  };

  return (
    <section className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200">
              <Package className="h-3.5 w-3.5" />
              Products Studio
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Storefront Products & Offerings
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Browse, search, and manage customer-facing products, digital downloads, bookings, and pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Total</p>
                <p className="mt-1 text-xl font-bold text-white">{offerings.length}</p>
              </div>
              <div className="mx-4 w-px bg-white/10" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">Live</p>
                <p className="mt-1 text-xl font-bold text-teal-200">{liveCount}</p>
              </div>
              <div className="mx-4 w-px bg-white/10" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Drafts</p>
                <p className="mt-1 text-xl font-bold text-white/70">{draftCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCategoriesModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                title="Manage product categories, descriptions, and hero banners"
              >
                <Settings2 className="h-4 w-4 text-teal-300" />
                Manage Categories
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  {sections.length}
                </span>
              </button>

              <button
                type="button"
                onClick={openAddProductDrawer}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-gray-950 shadow-[0_4px_20px_rgba(45,212,191,0.3)] transition hover:bg-teal-300 active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter & Column Selector Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search products by title, subtitle, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-10 pr-4 text-sm text-white placeholder-white/35 transition focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Category:</span>
            <select
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white transition focus:border-teal-400/60 focus:outline-none"
            >
              <option value="all" className="bg-gray-900">All Categories ({offerings.length})</option>
              {sections.map((s) => {
                const count = offerings.filter((o) => o.section_id === s.id).length;
                return (
                  <option key={s.id} value={s.id} className="bg-gray-900">
                    {s.title} ({count})
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoriesModal(true)}
              title="Configure categories & hero banners"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-teal-300 transition hover:bg-white/10 hover:text-teal-200"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Manage</span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
            {[
              { id: "all", label: "All" },
              { id: "live", label: "Live" },
              { id: "draft", label: "Draft" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  filterStatus === tab.id
                    ? "bg-teal-300 text-gray-950 shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Column Visibility Selector Dropdown */}
          <div className="relative" ref={columnPickerRef}>
            <button
              type="button"
              onClick={() => setShowColumnPicker((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-teal-300" />
              Columns
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-white/15 bg-gray-950 p-3 shadow-2xl backdrop-blur-md">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Visible Columns</p>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                    <input
                      type="checkbox"
                      checked={visibleColumns.category}
                      onChange={() => toggleColumn("category")}
                      className="rounded border-white/20 bg-black/40 text-teal-400 focus:ring-teal-400"
                    />
                    Category
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                    <input
                      type="checkbox"
                      checked={visibleColumns.price}
                      onChange={() => toggleColumn("price")}
                      className="rounded border-white/20 bg-black/40 text-teal-400 focus:ring-teal-400"
                    />
                    Price
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                    <input
                      type="checkbox"
                      checked={visibleColumns.deliveryMode}
                      onChange={() => toggleColumn("deliveryMode")}
                      className="rounded border-white/20 bg-black/40 text-teal-400 focus:ring-teal-400"
                    />
                    Delivery Mode
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white">
                    <input
                      type="checkbox"
                      checked={visibleColumns.status}
                      onChange={() => toggleColumn("status")}
                      className="rounded border-white/20 bg-black/40 text-teal-400 focus:ring-teal-400"
                    />
                    Status
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Master Products Table with RIGID Fixed Column Layout */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            {/* Rigid Fixed Colgroup Definition */}
            <colgroup>
              <col className="w-[300px]" />
              {visibleColumns.category && <col className="w-[170px]" />}
              {visibleColumns.price && <col className="w-[140px]" />}
              {visibleColumns.deliveryMode && <col className="w-[190px]" />}
              {visibleColumns.status && <col className="w-[130px]" />}
              <col className="w-[140px]" />
            </colgroup>

            <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-white/50">
              <tr>
                <th scope="col" className="px-5 py-3.5 truncate">Product</th>
                {visibleColumns.category && <th scope="col" className="px-4 py-3.5 truncate">Category</th>}
                {visibleColumns.price && <th scope="col" className="px-4 py-3.5 truncate">Price</th>}
                {visibleColumns.deliveryMode && <th scope="col" className="px-4 py-3.5 truncate">Delivery Mode</th>}
                {visibleColumns.status && <th scope="col" className="px-4 py-3.5 truncate">Status</th>}
                <th scope="col" className="px-5 py-3.5 text-right truncate">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedOfferings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-white/50">
                    <p className="font-semibold text-white/70">No products found</p>
                    <p className="mt-1 text-xs text-white/40">
                      {searchQuery || filterSectionId !== "all" || filterStatus !== "all"
                        ? "Try clearing or adjusting your search filters above."
                        : "Click 'Add Product' above to create your first offering."}
                    </p>
                    {(searchQuery || filterSectionId !== "all" || filterStatus !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterSectionId("all");
                          setFilterStatus("all");
                        }}
                        className="mt-3 rounded-xl border border-teal-300/30 bg-teal-300/10 px-3 py-1.5 text-xs font-medium text-teal-200 transition hover:bg-teal-300/20"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedOfferings.map((offering) => {
                  const modeMeta = offeringModeMeta[offering.cta_type || "checkout"] || offeringModeMeta.checkout;
                  const sectionTitle = sectionsById[offering.section_id]?.title || offering.section_id;

                  return (
                    <tr
                      key={offering.id}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Product Thumbnail & Title (Rigid w-[300px]) */}
                      <td className="px-5 py-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            {offering.image_url ? (
                              <img
                                src={offering.image_url}
                                alt={offering.image_alt || offering.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/30">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white group-hover:text-teal-200" title={offering.title}>
                              {offering.title}
                            </p>
                            <p className="truncate text-xs text-white/45" title={offering.subtitle || offering.id}>
                              {offering.subtitle || offering.summary || offering.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category (Rigid w-[170px]) */}
                      {visibleColumns.category && (
                        <td className="px-4 py-4 text-xs overflow-hidden">
                          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-white/75 truncate" title={sectionTitle}>
                            <Layers className="h-3 w-3 shrink-0 text-teal-300/70" />
                            <span className="truncate">{sectionTitle}</span>
                          </span>
                        </td>
                      )}

                      {/* Price (Rigid w-[140px]) */}
                      {visibleColumns.price && (
                        <td className="px-4 py-4 text-xs font-semibold text-white overflow-hidden">
                          {offering.price_usd ? (
                            <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
                              ${offering.price_usd} USD
                            </span>
                          ) : (
                            <span className="text-white/40">Free / Custom</span>
                          )}
                        </td>
                      )}

                      {/* Delivery Mode (Rigid w-[190px]) */}
                      {visibleColumns.deliveryMode && (
                        <td className="px-4 py-4 text-xs overflow-hidden">
                          <div className="flex flex-col gap-1 items-start max-w-full">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider truncate ${modeMeta.badgeClass}`}>
                              {modeMeta.label}
                            </span>
                            <span className="text-[11px] text-white/40 capitalize truncate max-w-full">
                              {offering.fulfillment_mode || "digital"}
                              {offering.fulfillment_mode === "digital" && offering.digital_delivery_type ? ` (${offering.digital_delivery_type})` : ""}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Status Toggle Switch (Direct In-Table Toggle with Confirmation Guard) */}
                      {visibleColumns.status && (
                        <td className="px-4 py-4 text-xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setStatusChangeCandidate({
                              offering,
                              nextStatus: !offering.is_active,
                            })}
                            title={offering.is_active ? "Click to unpublish (draft)" : "Click to publish live"}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold uppercase tracking-wider transition ${
                              offering.is_active
                                ? "border-teal-300/40 bg-teal-300/15 text-teal-200 hover:border-amber-400/50 hover:bg-amber-400/15 hover:text-amber-200"
                                : "border-white/15 bg-white/5 text-white/45 hover:border-teal-300/50 hover:bg-teal-300/15 hover:text-teal-200"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                offering.is_active ? "bg-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.8)]" : "bg-white/30"
                              }`}
                            />
                            {offering.is_active ? "Live" : "Draft"}
                          </button>
                        </td>
                      )}

                      {/* Actions (Rigid w-[140px]) */}
                      <td className="px-5 py-4 text-right overflow-hidden">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewOfferingForm(false);
                              setSelectedOfferingId(offering.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-200"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(offering)}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-white/40 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
                            title="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Controls */}
        <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>
              Showing <strong className="text-white">{startIndex}</strong> to <strong className="text-white">{endIndex}</strong> of <strong className="text-white">{totalItems}</strong> products
            </span>
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-teal-400 focus:outline-none"
              >
                <option value={10} className="bg-gray-900">10</option>
                <option value={25} className="bg-gray-900">25</option>
                <option value={50} className="bg-gray-900">50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <span className="px-2 text-xs font-semibold text-white/60">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED SLIDE-OVER DRAWER: Used for both Add Product & Edit Product       */}
      {/* ========================================================================= */}
      {isDrawerOpen && drawerOffering && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl border-l border-white/15 bg-gray-950 shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${drawerModeMeta.badgeClass}`}>
                        {drawerModeMeta.label}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        isCreateMode
                          ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                          : drawerOffering.is_active
                            ? "border-teal-300/30 bg-teal-300/10 text-teal-200"
                            : "border-white/10 text-white/40"
                      }`}>
                        {isCreateMode ? "New Product" : drawerOffering.is_active ? "Published Live" : "Draft"}
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-xl font-bold text-white">
                      {isCreateMode ? "Create New Product" : drawerOffering.title || "Untitled Product"}
                    </h3>
                    {!isCreateMode && (
                      <p className="truncate font-mono text-xs text-white/40">ID: {drawerOffering.id}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body - Scrollable Form (100% of fields for both Add & Edit) */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* 1. Basic Information */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Basic Information</p>
                  
                  <label className="block space-y-1 text-xs text-white/60">
                    <span>Product Title *</span>
                    <input
                      value={drawerOffering.title || ""}
                      onChange={(e) => drawerUpdater("title", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      placeholder="e.g. 1-on-1 Breakthrough Session"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Category / Type *</span>
                      <select
                        value={drawerOffering.section_id || selectedSectionId || sections[0]?.id || ""}
                        onChange={(e) => drawerUpdater("section_id", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      >
                        {sections.map((s) => (
                          <option key={s.id} value={s.id} className="bg-gray-900">
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Display Price (USD) *</span>
                      <input
                        value={drawerOffering.price_usd ?? ""}
                        onChange={(e) => drawerUpdater("price_usd", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        placeholder="e.g. 150"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1 text-xs text-white/60">
                    <span>Subtitle</span>
                    <input
                      value={drawerOffering.subtitle || ""}
                      onChange={(e) => drawerUpdater("subtitle", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      placeholder="Short tagline shown below title"
                    />
                  </label>
                </div>

                {/* 2. Storefront Copy & Media */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Storefront Copy & Media</p>
                  
                  <label className="block space-y-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      Summary
                      <AdminInfoHint text="Shown on offer cards and reused as the opening copy on the detail page." />
                    </span>
                    <textarea
                      value={drawerOffering.summary || ""}
                      onChange={(e) => drawerUpdater("summary", e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      placeholder="Brief 1-2 sentence overview of what this offer is..."
                    />
                  </label>

                  <label className="block space-y-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      Long Description
                      <AdminInfoHint text="Use this for the detailed story, transformation, curriculum, or delivery explanation." />
                    </span>
                    <SimpleEditor
                      value={drawerOffering.long_description || ""}
                      onChange={(value) => drawerUpdater("long_description", value)}
                      minHeightClass="min-h-[10rem]"
                      placeholder="Write the full description with formatting, bullet points, etc..."
                    />
                  </label>

                  {/* Product Image */}
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <span className="text-xs text-white/60">Product Image</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <ImageUploader
                        label={uploadingTarget === "offering-image" ? "Uploading..." : "Upload product image"}
                        disabled={uploadingTarget === "offering-image"}
                        onPick={handleOfferingImageUpload}
                      />
                      {drawerOffering.image_url ? (
                        <a
                          href={drawerOffering.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-teal-300 underline-offset-4 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Preview current image
                        </a>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
                      <label className="block space-y-1 text-xs text-white/50">
                        <span>Image URL</span>
                        <input
                          value={drawerOffering.image_url || ""}
                          onChange={(e) => drawerUpdater("image_url", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                        />
                      </label>
                      <label className="block space-y-1 text-xs text-white/50">
                        <span>Image Alt Text</span>
                        <input
                          value={drawerOffering.image_alt || ""}
                          onChange={(e) => drawerUpdater("image_alt", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Sales & Fulfillment Modes */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Sales & Fulfillment</p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-white/60">
                      <span>Sales Mode</span>
                      <select
                        value={drawerOffering.cta_type || "checkout"}
                        onChange={(e) => drawerUpdater("cta_type", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      >
                        {ctaTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-gray-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-xs text-white/60">
                      <span>Fulfilment Mode</span>
                      <select
                        value={drawerOffering.fulfillment_mode || "digital"}
                        onChange={(e) => drawerUpdater("fulfillment_mode", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      >
                        {fulfillmentModeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-gray-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/65">
                    {fulfillmentModeMeta[drawerOffering.fulfillment_mode || "digital"]?.description}
                  </div>

                  {/* Digital Delivery Configuration */}
                  {drawerOffering.fulfillment_mode === "digital" && (
                    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 space-y-3">
                      <label className="block space-y-1 text-xs text-white/70">
                        <span>Digital Product Type</span>
                        <select
                          value={drawerOffering.digital_delivery_type || "download"}
                          onChange={(e) => drawerUpdater("digital_delivery_type", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        >
                          <option value="download" className="bg-gray-900">Download file or external link</option>
                          <option value="course" className="bg-gray-900">Course access (requires linked course)</option>
                        </select>
                      </label>

                      {drawerOffering.digital_delivery_type === "download" ? (
                        <div className="space-y-2">
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>External Delivery URL</span>
                            <input
                              value={drawerOffering.delivery_url || ""}
                              onChange={(e) => drawerUpdater("delivery_url", e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                              placeholder="https://..."
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10">
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleOfferingDeliveryUpload}
                                disabled={uploadingTarget === "offering-delivery"}
                              />
                              {uploadingTarget === "offering-delivery" ? "Uploading file..." : "Upload delivery file"}
                            </label>
                            {drawerOffering.delivery_url && (
                              <a
                                href={drawerOffering.delivery_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-teal-300 underline hover:text-teal-200"
                              >
                                View current delivery file
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white/60">
                          To publish, ensure an active course is linked to this product in the Courses tab.
                        </p>
                      )}

                      <label className="block space-y-1 text-xs text-white/60">
                        <span>Access Expiry (Days, optional)</span>
                        <input
                          type="number"
                          min="1"
                          value={drawerOffering.access_expiry_days || ""}
                          onChange={(e) => drawerUpdater("access_expiry_days", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                          placeholder="No expiry (unlimited)"
                        />
                      </label>
                    </div>
                  )}

                  {/* Reading Configuration */}
                  {drawerOffering.fulfillment_mode === "reading" && (
                    <div className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 space-y-2">
                      <label className="block space-y-1 text-xs text-white/70">
                        <span>Reading Email Body (Plain Text)</span>
                        <textarea
                          value={drawerOffering.reading_email_body || ""}
                          onChange={(e) => drawerUpdater("reading_email_body", e.target.value)}
                          rows={6}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                          placeholder="This text is automatically sent in the branded reading email after payment..."
                        />
                      </label>
                    </div>
                  )}

                  {/* Booking Sync Configuration */}
                  {drawerOffering.cta_type === "booking" && (
                    <div className="rounded-xl border border-teal-300/20 bg-teal-300/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">Cal.com Booking Sync</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          drawerOffering.booking_status === "synced"
                            ? "bg-teal-400/10 text-teal-300 border border-teal-400/20"
                            : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                        }`}>
                          {drawerOffering.booking_status || "Pending sync"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>Booking CTA Label</span>
                          <input
                            value={drawerOffering.booking_cta_label || ""}
                            onChange={(e) => drawerUpdater("booking_cta_label", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                            placeholder="Book session"
                          />
                        </label>
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>Duration (Minutes)</span>
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={drawerOffering.duration_minutes ?? 60}
                            onChange={(e) => drawerUpdater("duration_minutes", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                      </div>

                      {drawerOffering.booking_url ? (
                        <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs">
                          <p className="text-white/40">Cal.com event URL:</p>
                          <a
                            href={drawerOffering.booking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all font-mono text-teal-300 underline"
                          >
                            {drawerOffering.booking_url}
                          </a>
                        </div>
                      ) : null}

                      {drawerOffering.booking_last_error ? (
                        <p className="text-xs text-rose-300">
                          Sync error: {drawerOffering.booking_last_error}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Fallback Support & Details */}
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <label className="block space-y-1 text-xs text-white/50">
                      <span>Legacy Button Label (Optional)</span>
                      <input
                        value={drawerOffering.cta_label || ""}
                        onChange={(e) => drawerUpdater("cta_label", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                        placeholder="Buy now"
                      />
                    </label>

                    <label className="block space-y-1 text-xs text-white/50">
                      <span>Fallback Support Link</span>
                      <input
                        value={drawerOffering.action_link || ""}
                        onChange={(e) => drawerUpdater("action_link", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                        placeholder="mailto:support@example.com"
                      />
                    </label>

                    <label className="block space-y-1 text-xs text-white/50">
                      <span>Fallback Helper Message</span>
                      <textarea
                        value={drawerOffering.checkout_fallback_message || ""}
                        onChange={(e) => drawerUpdater("checkout_fallback_message", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                        placeholder="Message shown if automatic checkout is unavailable."
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCreateMode) {
                          handleCreateOffering({ publishVersion: false });
                        } else {
                          handleSaveOffering({ publishVersion: false });
                        }
                      }}
                      disabled={isCreateMode ? isCreatingOffering : isSavingOffering}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 disabled:opacity-50"
                    >
                      {isCreateMode
                        ? isCreatingOffering ? "Creating Draft..." : "Create as Draft"
                        : isSavingOffering ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isCreateMode) {
                          handleCreateOffering({ publishVersion: true });
                        } else {
                          handleSaveOffering({ publishVersion: true });
                        }
                      }}
                      disabled={isCreateMode ? isCreatingOffering : isSavingOffering}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-400 px-5 py-2 text-sm font-semibold text-gray-950 shadow-[0_4px_15px_rgba(45,212,191,0.3)] transition hover:bg-teal-300 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      {isCreateMode
                        ? isCreatingOffering ? "Publishing..." : "Create & Publish Live"
                        : isSavingOffering ? "Publishing..." : "Publish Live"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Manage Categories / Types                                          */}
      {/* ========================================================================= */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCategoriesModal(false)}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-white/15 bg-gray-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Manage Product Categories & Types</h3>
                <p className="text-xs text-white/50">Edit category titles, descriptions, and hero banners</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split Content: Category List on left, Selected Category Editor on right */}
            <div className="grid flex-1 overflow-hidden grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
              {/* Left Column: Categories List */}
              <div className="border-b border-white/10 md:border-b-0 md:border-r p-4 overflow-y-auto space-y-2 bg-black/20">
                <button
                  type="button"
                  onClick={() => setShowNewSectionInModal((prev) => !prev)}
                  className="w-full mb-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-300/40 bg-teal-300/10 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-300/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showNewSectionInModal ? "Cancel New Type" : "Add Product Type"}
                </button>

                {sections.map((section) => {
                  const isSelected = !showNewSectionInModal && section.id === selectedSectionId;
                  const count = offerings.filter((o) => o.section_id === section.id).length;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setShowNewSectionInModal(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-xs font-medium transition flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-300/15 text-teal-200 border border-teal-300/30"
                          : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <span className="truncate">{section.title}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Editor Form */}
              <div className="p-6 overflow-y-auto space-y-5">
                {showNewSectionInModal ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">New Product Type</p>
                      <button
                        type="button"
                        onClick={() => setShowNewSectionInModal(false)}
                        className="text-xs text-white/50 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Type Title *</span>
                      <input
                        value={newSection.title}
                        onChange={(e) => updateNewSection("title", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        placeholder="e.g. Coaching"
                      />
                    </label>

                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Description</span>
                      <SimpleEditor
                        value={newSection.description}
                        onChange={(val) => updateNewSection("description", val)}
                        minHeightClass="min-h-[8rem]"
                        placeholder="Short description for this category..."
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleCreateSection}
                      disabled={isCreatingSection}
                      className="rounded-xl bg-teal-400 px-4 py-2 text-xs font-semibold text-gray-950 transition hover:bg-teal-300 disabled:opacity-50"
                    >
                      {isCreatingSection ? "Creating..." : "Save Product Type"}
                    </button>
                  </div>
                ) : selectedSection ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                        Editing: {selectedSection.title}
                      </p>
                      <label className="inline-flex items-center gap-2 text-xs text-white/80">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedSection.is_active)}
                          onChange={(e) => updateSectionEditor("is_active", e.target.checked)}
                          className="rounded border-white/20 bg-black/40 text-teal-400 focus:ring-teal-400"
                        />
                        Active Category
                      </label>
                    </div>

                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Category Title</span>
                      <input
                        value={selectedSection.title || ""}
                        onChange={(e) => updateSectionEditor("title", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                      />
                    </label>

                    <label className="block space-y-1 text-xs text-white/60">
                      <span>Description</span>
                      <SimpleEditor
                        value={selectedSection.description || ""}
                        onChange={(val) => updateSectionEditor("description", val)}
                        minHeightClass="min-h-[8rem]"
                        placeholder="Description for this category..."
                      />
                    </label>

                    {/* Hero Section Banner Settings */}
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Category Hero Banner</p>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>Hero Title</span>
                          <input
                            value={selectedSection.hero_title || ""}
                            onChange={(e) => updateSectionEditor("hero_title", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>Hero Subtitle</span>
                          <input
                            value={selectedSection.hero_subtitle || ""}
                            onChange={(e) => updateSectionEditor("hero_subtitle", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                      </div>

                      <label className="block space-y-1 text-xs text-white/60">
                        <span>Hero Description</span>
                        <SimpleEditor
                          value={selectedSection.hero_description || ""}
                          onChange={(val) => updateSectionEditor("hero_description", val)}
                          minHeightClass="min-h-[8rem]"
                          placeholder="Hero copy..."
                        />
                      </label>

                      <div className="space-y-2 border-t border-white/10 pt-2">
                        <span className="text-xs text-white/60">Hero Image</span>
                        <div className="flex items-center gap-3">
                          <ImageUploader
                            label={uploadingTarget === "hero-image" ? "Uploading..." : "Upload hero image"}
                            disabled={uploadingTarget === "hero-image"}
                            onPick={handleHeroImageUpload}
                          />
                          {selectedSection.hero_image_url && (
                            <a
                              href={selectedSection.hero_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-teal-300 underline"
                            >
                              View image
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>CTA Label</span>
                          <input
                            value={selectedSection.hero_cta_label || ""}
                            onChange={(e) => updateSectionEditor("hero_cta_label", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                        <label className="block space-y-1 text-xs text-white/60">
                          <span>CTA Link</span>
                          <input
                            value={selectedSection.hero_cta_href || ""}
                            onChange={(e) => updateSectionEditor("hero_cta_href", e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSection}
                      disabled={isSavingSection}
                      className="rounded-xl bg-teal-400 px-5 py-2 text-xs font-semibold text-gray-950 transition hover:bg-teal-300 disabled:opacity-50"
                    >
                      {isSavingSection ? "Saving..." : "Save Category Changes"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-white/50">Select a category on the left to edit its details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Status Change Confirmation Guard                                    */}
      {/* ========================================================================= */}
      {statusChangeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setStatusChangeCandidate(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-gray-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 border ${
                statusChangeCandidate.nextStatus
                  ? "bg-teal-400/10 border-teal-400/20 text-teal-300"
                  : "bg-amber-400/10 border-amber-400/20 text-amber-300"
              }`}>
                {statusChangeCandidate.nextStatus ? (
                  <Globe className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {statusChangeCandidate.nextStatus ? "Publish Product Live?" : "Set Product to Draft?"}
                </h3>
                <p className="text-xs text-white/50">Status change confirmation</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/75 leading-relaxed">
              Are you sure you want to {statusChangeCandidate.nextStatus ? "publish" : "unpublish"}{" "}
              <strong className="text-white font-semibold">"{statusChangeCandidate.offering.title}"</strong>?
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60 space-y-1">
              {statusChangeCandidate.nextStatus ? (
                <>
                  <p>• This product will immediately become visible to visitors on your storefront.</p>
                  <p>• Customers will be able to proceed through checkout or booking.</p>
                </>
              ) : (
                <>
                  <p>• This product will be hidden from storefront visitors.</p>
                  <p>• Existing customer purchases and past records remain completely safe and untouched.</p>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusChangeCandidate(null)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { offering, nextStatus } = statusChangeCandidate;
                  setStatusChangeCandidate(null);
                  await handleTogglePublishOffering(offering.id, !nextStatus);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold shadow transition ${
                  statusChangeCandidate.nextStatus
                    ? "bg-teal-400 text-gray-950 hover:bg-teal-300"
                    : "bg-amber-400 text-gray-950 hover:bg-amber-300"
                }`}
              >
                {statusChangeCandidate.nextStatus ? "Yes, Publish Live" : "Yes, Set to Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delete Product Confirmation                                        */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-rose-400/20 bg-gray-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-300">
              <div className="rounded-xl bg-rose-400/10 p-2 border border-rose-400/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Product?</h3>
            </div>

            <p className="mt-3 text-sm text-white/70">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">"{deleteCandidate.title}"</span>?
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50 space-y-1">
              <p>• Removes this product and its checkout configuration.</p>
              <p>• If customer purchases exist for this product, the database will block deletion. In that case, simply set it to <strong>Draft</strong> instead.</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingOffering}
                onClick={async () => {
                  await handleDeleteOffering(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-rose-600 disabled:opacity-50"
              >
                {isDeletingOffering ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductsTab;
