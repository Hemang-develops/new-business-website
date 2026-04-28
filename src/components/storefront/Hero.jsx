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
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden py-16"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #080a0f 100%)`,
      }}
    >
      {/* Dynamic Background Orchestration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[10%] -left-[10%] h-[700px] w-[700px] rounded-full blur-[150px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] h-[600px] w-[600px] rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

        {/* Left Content Column */}
        <div className="flex-1 space-y-8" data-gsap-reveal>
          {/* <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
              {heroSection?.eyebrow || "Introduction"}
            </p>
          </div> */}

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
            {heroSection?.heading}
          </h1>

          <RichTextContent
            value={heroSection?.description}
            className="max-w-xl text-lg leading-relaxed text-white/50 font-medium"
          />

          <div className="flex flex-wrap gap-5">
            <a
              href={heroSection?.primaryCtaHref || "#programs"}
              data-gsap-hover
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-teal-300 px-10 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)]"
            >
              {heroSection?.primaryCtaLabel || "Details here"}
            </a>
            <a
              href={heroSection?.secondaryCtaHref || "#contact"}
              data-gsap-hover
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-10 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 active:scale-95 backdrop-blur-xl"
            >
              {heroSection?.secondaryCtaLabel || "Contact"}
            </a>
          </div>

          {/* Value Proof Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {heroProofs.map((item) => (
              <div
                key={item.key}
                data-gsap-hover
                className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-teal-300/30"
              >
                <p className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                  {item.title}
                </p>
                <div className="text-xs font-medium text-white/40 leading-relaxed group-hover:text-white/60">
                  <RichTextContent value={item.description} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Media Column */}
        <div
          className="lg:w-[40%] flex justify-center"
          data-gsap-reveal
          data-gsap-delay="0.2"
        >
          <div className="relative group">
            {/* Dynamic Glow Aura */}
            <div
              className="absolute -inset-10 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"
              style={{ backgroundColor: 'var(--site-brand-primary)' }}
            />

            <div className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <img
                src={settings.profile?.imageUrl || "https://ui-avatars.com/api/?name=Admin&background=020617&color=fff"}
                alt={settings.profile?.imageAlt || "Profile"}
                className="h-72 w-72 rounded-[2rem] object-cover shadow-2xl lg:h-[380px] lg:w-full min-w-[280px] transition-transform duration-700 group-hover:scale-105"
              />

              {/* Floating Role Label */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-max rounded-full border border-teal-300/20 bg-gray-950/90 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300 shadow-2xl backdrop-blur-md">
                {settings.profile?.roleLabel || "Founder"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
