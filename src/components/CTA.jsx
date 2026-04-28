import { useSiteSettings } from "../context/SiteSettingsContext";
import { defaultSiteSettings } from "../services/siteSettings";

const CTA = () => {
  const { getSection, settings } = useSiteSettings();
  const siteSettings = settings || defaultSiteSettings;
  const ctaSection = getSection("cta");

  const supportEmail = siteSettings.brand.supportEmail || "highfrequencies11@gmail.com";

  return (
    <section 
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-24"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #080a0f 100%)`,
      }}
    >
      {/* Dynamic Background Orchestration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[150px] opacity-15"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
            {ctaSection?.eyebrow || "Decision Point"}
          </p>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl leading-[1.1]">
          {ctaSection?.heading || "Your next quantum leap is one decision away."}
        </h2>
        
        <p className="max-w-2xl text-lg leading-relaxed text-white/50 font-medium">
          {ctaSection?.description || "When you say yes to yourself, the universe reschedules everything in your favor. Let's co-create the timeline where your desires are the new normal."}
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <a
            href={`mailto:${supportEmail}?subject=I%27m%20ready%20to%20work%20with%20Nehal`}
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-teal-300 px-10 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)]"
          >
            {ctaSection?.primaryCtaLabel || "Start a conversation"}
          </a>
          <a
            href={ctaSection?.secondaryCtaHref || "#programs"}
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-10 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 active:scale-95 backdrop-blur-xl"
          >
            {ctaSection?.secondaryCtaLabel || "View offerings"}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
