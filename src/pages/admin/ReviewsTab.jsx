import { createEmptyReview } from "./catalogAdminConfig";
import ImageUploader from "@/components/ui/ImageUploader";

const ReviewsTab = ({ state, actions }) => {
  const {
    isSavingReviews,
    offeringsBySection,
    reviewsEditor,
    sections,
    uploadingTarget,
  } = state;
  const {
    handleReviewImageUpload,
    handleSaveReviews,
    setReviewsEditor,
    updateReviewEditor,
  } = actions;
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Reviews</h2>
        <p className="mt-1 text-xs text-white/60">
          Manage multiple reviews for home testimonials and product-specific buy pages.
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
                    <option value="buy" className="bg-gray-900">Buy (product specific)</option>
                    <option value="global" className="bg-gray-900">Buy (global)</option>
                  </select>
                </label>

                <label className="space-y-1 text-xs text-white/60">
                  <span>Product type</span>
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
                  <span>Product (optional)</span>
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
                    <ImageUploader
                      label={uploadingTarget === `review-image-${index}` ? "Uploading..." : "Upload image"}
                      disabled={uploadingTarget === `review-image-${index}`}
                      onPick={(file) => handleReviewImageUpload(file, index)}
                    />
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
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 z-50 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-300/20 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:flex-nowrap">
          <button
            type="button"
            onClick={handleSaveReviews}
            disabled={isSavingReviews}
            className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {isSavingReviews ? "Saving..." : "Save reviews"}
          </button>
          <p className="hidden text-sm text-white/45 md:block">Changes will be saved across all pages where these reviews appear.</p>
        </div>
      </div>
    </section>
  );
};

export default ReviewsTab;
