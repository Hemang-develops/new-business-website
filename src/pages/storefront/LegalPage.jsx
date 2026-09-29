import { Link } from "react-router-dom";

const LegalPage = ({ title, intro, sections = [], docUrl = null }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] text-white">
      <div className="mx-auto flex max-w-4xl flex-col px-6 py-16 sm:px-8 lg:px-10">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-200"
        >
          ← Back to home
        </Link>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-300/70">Legal information</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">{intro}</p>

          {/* Document Viewer */}
          {docUrl ? (
            <div className="mt-10">
              {docUrl.toLowerCase().endsWith('.pdf') ? (
                <embed
                  src={docUrl}
                  type="application/pdf"
                  width="100%"
                  height="600"
                  className="rounded-lg border border-white/10"
                />
              ) : (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400"
                >
                  📄 Download Document
                </a>
              )}
            </div>
          ) : (
            <div className="mt-10 space-y-8">
              {sections.map((section, index) => (
                <section key={`${title}-${index}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                  <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-white/70">
                    {Array.isArray(section.body) ? (
                      section.body.map((paragraph, paragraphIndex) => <p key={`${section.heading}-${paragraphIndex}`}>{paragraph}</p>)
                    ) : (
                      <p>{section.body}</p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
