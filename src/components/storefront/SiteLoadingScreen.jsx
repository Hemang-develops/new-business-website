import { defaultSiteSettings } from "../../services/siteSettings";

const loadingMessages = [
  "Aligning your next reality",
  "Preparing the next frequency",
  "Gathering the latest live content",
];

const SiteLoadingScreen = ({
  eyebrow = "High Frequencies 11",
  title = "Loading the live experience",
  description = "The latest content is loading now so you see the current website, not stale copy.",
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(139,92,246,0.18),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_32%,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="absolute left-[8%] top-[14%] h-40 w-40 rounded-full border border-white/10 bg-white/[0.03] blur-3xl animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] h-52 w-52 rounded-full border border-white/10 bg-white/[0.03] blur-3xl animate-pulse" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl">
          <div className="mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_25px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="grid gap-10 px-8 py-10 md:grid-cols-[1.15fr,0.85fr] md:px-12 md:py-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
                  <span className="h-2 w-2 rounded-full bg-brand-primary-light shadow-[0_0_16px_var(--site-brand-primary-light)]" />
                  {eyebrow || defaultSiteSettings.brand.fullTitle}
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {loadingMessages.map((message) => (
                    <div
                      key={message}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/58"
                    >
                      {message}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-[20rem] w-full max-w-[18rem] items-center justify-center">
                  <div className="absolute h-56 w-56 rounded-full border border-brand-primary/20 bg-brand-primary/10 blur-3xl" />
                  <div className="absolute h-48 w-48 rounded-full border border-brand-accent/20 bg-brand-accent/10 blur-3xl" />
                  <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-white/12 bg-black/35">
                    <div className="absolute h-40 w-40 animate-spin rounded-full border border-transparent border-t-brand-primary-light border-r-brand-secondary" />
                    <div className="absolute h-28 w-28 animate-spin rounded-full border border-transparent border-b-brand-accent border-l-brand-primary" style={{ animationDirection: "reverse", animationDuration: "1.8s" }} />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="text-xs uppercase tracking-[0.42em] text-white/45">Live</div>
                      <div className="text-2xl font-semibold text-white">{defaultSiteSettings.brand.navTitle}</div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-primary-light" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-secondary [animation-delay:160ms]" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-accent [animation-delay:320ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SiteLoadingScreen;
