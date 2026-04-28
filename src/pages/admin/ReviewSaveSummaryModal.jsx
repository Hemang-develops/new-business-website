const ReviewSaveSummaryModal = ({
  reviewSaveSummary,
  setReviewSaveSummary,
  persistReviews,
  isSavingReviews,
}) => {
  if (!reviewSaveSummary) {
    return null;
  }

  return (
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
  );
};

export default ReviewSaveSummaryModal;
