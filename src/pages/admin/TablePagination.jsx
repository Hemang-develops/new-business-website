import { ChevronLeft, ChevronRight } from "lucide-react";

const TablePagination = ({ pageIndex, pageSize, totalItems, onPageChange }) => {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const firstVisibleEntry = totalItems ? currentPageIndex * pageSize + 1 : 0;
  const lastVisibleEntry = Math.min((currentPageIndex + 1) * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/60">
      <p aria-live="polite">
        Showing {firstVisibleEntry}-{lastVisibleEntry} of {totalItems} entries
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          aria-label="Previous page"
          className="flex size-9 items-center justify-center rounded-md border border-white/15 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className="min-w-20 text-center" aria-live="polite">
          Page {currentPageIndex + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPageIndex + 1)}
          disabled={currentPageIndex >= pageCount - 1}
          aria-label="Next page"
          className="flex size-9 items-center justify-center rounded-md border border-white/15 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;