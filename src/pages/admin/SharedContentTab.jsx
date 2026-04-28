import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";

const SharedContentTab = ({ state, actions }) => {
  const { globalEditor, isSavingGlobal } = state;
  const { handleSaveGlobalContent, updateGlobalEditor } = actions;
  return (
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

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Frequently Asked Questions</h3>
            <button
              type="button"
              onClick={() =>
                updateGlobalEditor("faqs", [
                  ...(globalEditor.faqs || []),
                  { question: "New Question", answer: "The answer..." },
                ])
              }
              className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-200 transition hover:bg-teal-300/20"
            >
              Add FAQ
            </button>
          </div>

          <div className="space-y-6">
            {globalEditor.faqs?.length === 0 ? (
              <p className="text-xs text-white/50">No FAQs added yet.</p>
            ) : (
              globalEditor.faqs?.map((faq, index) => (
                <div key={index} className="relative space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      const nextFaqs = [...globalEditor.faqs];
                      nextFaqs.splice(index, 1);
                      updateGlobalEditor("faqs", nextFaqs);
                    }}
                    className="absolute right-3 top-3 text-white/40 transition hover:text-red-400"
                    title="Delete FAQ"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">Question</span>
                    <input
                      type="text"
                      value={faq.question || ""}
                      onChange={(e) => {
                        const nextFaqs = [...globalEditor.faqs];
                        nextFaqs[index] = { ...faq, question: e.target.value };
                        updateGlobalEditor("faqs", nextFaqs);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      placeholder="What is the purpose of this product?"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">Answer</span>
                    <SimpleEditor
                      value={faq.answer || ""}
                      onChange={(value) => {
                        const nextFaqs = [...globalEditor.faqs];
                        nextFaqs[index] = { ...faq, answer: value };
                        updateGlobalEditor("faqs", nextFaqs);
                      }}
                      minHeightClass="min-h-[8rem]"
                      placeholder="Write the answer here..."
                    />
                  </label>
                </div>
              ))
            )}
          </div>
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
