import { useRef } from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../../hooks/useGsapMotion";
import RichTextContent from "../ui/RichTextContent";

const Hero = () => {
  const heroRef = useRef(null);
  const { settings, getSection, getSectionItems } = useSiteSettings();
  const heroSection = getSection("hero");
  const heroProofs = getSectionItems("hero");

  useGsapReveal(heroRef, [heroSection?.id, heroProofs.length]);
  useGsapHover(heroRef, "[data-gsap-hover]", [heroProofs.length]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex lg:min-h-screen items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(160deg, #030406 0%, #060c16 50%, #03050a 100%)` }}
    >
      {/* Cinematic Background Layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[15%] h-[800px] w-[800px] rounded-full blur-[180px] opacity-[0.12]"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] h-[700px] w-[700px] rounded-full blur-[160px] opacity-[0.12]"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[120px] opacity-[0.05]"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-20 pt-24 pb-16 lg:pt-36 lg:pb-20">

        {/* Left Content Column — on mobile this appears BELOW the image */}
        <div className="order-2 lg:order-1 flex-1 space-y-8" data-gsap-reveal>


          {/* Main Heading */}
          <h1 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold tracking-tighter text-white leading-[1.05]">
            {heroSection?.heading}
          </h1>

          {/* Description */}
          <RichTextContent
            value={heroSection?.description}
            className="max-w-lg text-base sm:text-lg leading-relaxed text-white/45 font-medium"
          />

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <a
              href={heroSection?.primaryCtaHref || "#programs"}
              data-gsap-hover
              className="inline-flex h-13 items-center justify-center rounded-2xl px-8 text-sm font-bold uppercase tracking-widest text-black transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{
                background: `linear-gradient(135deg, var(--site-brand-primary-light), var(--site-brand-primary))`,
                boxShadow: `0 16px 48px -8px color-mix(in srgb, var(--site-brand-primary) 45%, transparent)`,
              }}
            >
              {heroSection?.primaryCtaLabel || "Details here"}
            </a>
            <a
              href={heroSection?.secondaryCtaHref || "#contact"}
              data-gsap-hover
              className="inline-flex h-13 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 text-sm font-bold uppercase tracking-widest text-white/70 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/15 hover:text-white hover:-translate-y-1 active:scale-95 backdrop-blur-xl"
            >
              {heroSection?.secondaryCtaLabel || "Book a call"}
            </a>
          </div>

          {/* Value Proof Cards */}
          {heroProofs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {heroProofs.map((item) => (
                <div
                  key={item.key}
                  data-gsap-hover
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--site-brand-primary) 8%, transparent), transparent 70%)` }}
                  />
                  <p className="relative text-base font-bold text-white mb-1.5 group-hover:text-teal-200 transition-colors duration-300">
                    {item.title}
                  </p>
                  <div className="relative text-xs font-medium text-white/35 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                    <RichTextContent value={item.description} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Media Column — on mobile this appears FIRST (top) */}
        <div
          className="order-1 lg:order-2 lg:w-[42%] flex justify-center"
          data-gsap-reveal
          data-gsap-delay="0.2"
        >
          <div className="relative group w-full lg:max-w-none">
            {/* Outer ambient aura */}
            <div
              className="absolute -inset-12 rounded-full blur-[100px] opacity-[0.18] group-hover:opacity-[0.28] transition-opacity duration-1000"
              style={{ backgroundColor: 'var(--site-brand-primary)' }}
            />
            <div
              className="absolute -inset-8 top-[20%] rounded-full blur-[80px] opacity-[0.10] group-hover:opacity-[0.16] transition-opacity duration-1000"
              style={{ backgroundColor: 'var(--site-brand-secondary)' }}
            />

            {/* Glassmorphic card */}
            <div
              className="relative rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-2xl overflow-hidden"
              style={{ boxShadow: `0 40px 120px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative overflow-hidden rounded-[1.6rem]">
                <img
                  src={settings.profile?.imageUrl || "https://ui-avatars.com/api/?name=Admin&background=020617&color=fff"}
                  alt={settings.profile?.imageAlt || "Profile"}
                  className="w-full object-cover object-center h-[240px] sm:h-[280px] lg:h-[420px] transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Floating Role Label */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max">
                <div
                  className="rounded-full border border-white/[0.08] bg-gray-950/80 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white/55 backdrop-blur-md"
                  style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)` }}
                >
                  {settings.profile?.roleLabel || "Founder"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;


