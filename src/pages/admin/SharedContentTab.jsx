const SharedContentTab = ({ state, actions }) => {
  const { globalEditor, isSavingGlobal } = state;
  const { handleSaveGlobalContent, updateGlobalEditor } = actions;
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Shared Checkout Content</h2>
        <p className="mt-1 text-xs text-white/60">
          Shared copy that applies across checkout and buy pages. Website FAQs now live in the Website tab.
        </p>
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

        <div className="sticky bottom-4 z-50 mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-teal-300/20 bg-black/80 px-4 py-3 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleSaveGlobalContent}
            disabled={isSavingGlobal}
            className="rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {isSavingGlobal ? "Saving..." : "Save shared content"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default SharedContentTab;
