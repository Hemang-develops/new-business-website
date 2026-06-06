import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import AdminInfoHint from "./AdminInfoHint";
import ImageUploader from "@/components/ui/ImageUploader";
import { ctaTypeOptions, offeringModeMeta } from "./catalogAdminConfig";

const ProductsTab = ({ state, actions }) => {
  const {
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
  } = state;
  const {
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
  } = actions;
  return (

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_32%),linear-gradient(180deg,rgba(7,12,22,0.94),rgba(9,16,28,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.24)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-200/80">Products studio</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">Manage what customers see, how they pay, and how each offer is fulfilled.</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                        The editor below is organised around storefront copy, fulfilment mode, and publishing status. Internal fields are tucked behind clearer labels so adding a new product feels like managing a product, not editing a table row.
                      </p>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-3">
                      <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Types</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{sections.length}</p>
                      </div>
                      <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Products</p>
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
                      {showNewSectionForm ? "Hide new type" : "Add new product type"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewOfferingForm((prev) => !prev)}
                      className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                      disabled={!selectedSectionId}
                    >
                      {showNewOfferingForm ? "Hide new product" : "Add new product"}
                    </button>
                  </div>

                  {(showNewSectionForm || showNewOfferingForm) ? (
                    <div className="flex flex-col gap-4 xl:flex-row">
                      {showNewSectionForm ? (
                        <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Add product type</p>
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
                              <SimpleEditor
                                value={newSection.description}
                                onChange={(value) => updateNewSection("description", value)}
                                placeholder="Short description for this product type"
                                minHeightClass="min-h-[10rem]"
                              />
                            </label>
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleCreateSection}
                                disabled={isCreatingSection}
                                className="rounded-full border border-teal-300/50 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 disabled:opacity-60"
                              >
                                {isCreatingSection ? "Creating..." : "Add product type"}
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
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Add product to selected type</p>
                          <div className="mt-4 space-y-3">
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Selected type</span>
                              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                                {sectionsById[selectedSectionId]?.title || "Choose a type first"}
                              </div>
                            </label>
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>Product title</span>
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
                                {isCreatingOffering ? "Creating..." : "Add product"}
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
                        {offeringsForSelectedSection.length} product{offeringsForSelectedSection.length === 1 ? "" : "s"} in this type
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
                          <SimpleEditor
                            value={selectedSection.description || ""}
                            onChange={(value) => updateSectionEditor("description", value)}
                            placeholder="Add paragraphs, lists, and formatted copy for this product type."
                            minHeightClass="min-h-[10rem]"
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
                            <SimpleEditor
                              value={selectedSection.hero_description || ""}
                              onChange={(value) => updateSectionEditor("hero_description", value)}
                              placeholder="Hi, I'm Nehal Patel - a manifestation coach, energy reader, and your guide to quantum leaping into your dream reality..."
                              minHeightClass="min-h-[12rem]"
                            />
                          </label>
                          <label className="block space-y-1 text-xs text-white/60">
                            <span>Hero Image</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-3">
                                <ImageUploader
                                  label={uploadingTarget === "hero-image" ? "Uploading..." : "Upload hero image"}
                                  disabled={uploadingTarget === "hero-image"}
                                  onPick={handleHeroImageUpload}
                                />
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
                          </div>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block space-y-1 text-xs text-white/60">
                              <span>CTA Label</span>
                              <input
                                value={selectedSection.hero_cta_label || ""}
                                onChange={(event) => updateSectionEditor("hero_cta_label", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                placeholder="Details here"
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
                            {isSavingSection ? "Saving..." : "Save product type"}
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
                            <h3 className="mt-5 text-3xl font-semibold text-white">{editor.title || "Untitled product"}</h3>
                            {editor.subtitle ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">{editor.subtitle}</p>
                            ) : null}
                            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/72">
                              {editor.summary || "Add a summary. This is the main storefront copy shown on product cards and reused on the detail page."}
                            </p>
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
                              <span className="inline-flex items-center gap-1.5">
                                Summary
                                <AdminInfoHint text="Shown on offer cards and reused as the opening copy on the detail page." />
                              </span>
                              <textarea
                                value={editor.summary || ""}
                                onChange={(event) => updateEditor("summary", event.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                              />
                            </label>

                            <label className="mt-3 block space-y-1 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1.5">
                                Long description
                                <AdminInfoHint text="Use this for the detailed story, transformation, or delivery explanation." />
                              </span>
                              <SimpleEditor
                                value={editor.long_description || ""}
                                onChange={(value) => updateEditor("long_description", value)}
                                minHeightClass="min-h-[12rem]"
                                placeholder="Use paragraphs, bullet lists, and emphasis for the full offer story."
                              />
                            </label>

                            <div className="mt-3 space-y-2">
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                                Product image
                                <AdminInfoHint text="This image is used on storefront cards and product detail sections." />
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                <ImageUploader
                                  label={uploadingTarget === "offering-image" ? "Uploading..." : "Upload product image"}
                                  disabled={uploadingTarget === "offering-image"}
                                  onPick={handleOfferingImageUpload}
                                />
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
                              <label key={key} className="mt-3 block space-y-1 text-xs text-white/60">
                                <span>{label}</span>
                                <input
                                  value={editor[key] ?? ""}
                                  onChange={(event) => updateEditor(key, event.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                />
                              </label>
                            ))}
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
                                <span className="inline-flex items-center gap-1.5">
                                  Fallback helper message
                                  <AdminInfoHint text="Shown when checkout or booking cannot be completed automatically." />
                                </span>
                                <textarea
                                  value={editor.checkout_fallback_message || ""}
                                  onChange={(event) => updateEditor("checkout_fallback_message", event.target.value)}
                                  rows={3}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                />
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

                      <div className="sticky bottom-4 z-50 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-300/20 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={handleSaveOffering}
                          disabled={isSavingOffering}
                          className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                        >
                          {isSavingOffering ? "Saving..." : "Save product"}
                        </button>
                        <p className="hidden text-sm text-white/45 md:block">
                          Edits are scoped to the selected product only.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                      No products found for this type yet.
                    </div>
                  )}
                </div>
              </section>
  );
};

export default ProductsTab;
