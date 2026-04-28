import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { useGsapHover, useGsapPulse, useGsapReveal, useGsapSpin } from "../../hooks/useGsapMotion";

import RichTextContent from "../ui/RichTextContent";

const OfferingHero = ({ section }) => {
  const heroRef = useRef(null);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    setIsHeroImageLoaded(false);
  }, [section?.heroImageUrl]);

  useGsapReveal(heroRef, [section?.id]);
  useGsapHover(heroRef, "[data-gsap-hover]", [section?.id]);
  useGsapPulse(heroRef, "[data-gsap-pulse]", [section?.id]);
  useGsapSpin(heroRef, "[data-gsap-spin]", [isHeroImageLoaded]);

  useGSAP(
    () => {
      const root = heroRef.current;
      if (!root) return;

      gsap.to(root.querySelectorAll("[data-gsap-drift]"), {
        y: -8,
        x: 4,
        rotate: 0.6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(root.querySelectorAll("[data-gsap-float]"), {
        y: -5,
        rotate: 0.8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { dependencies: [section?.id] },
  );

  const handleCtaClick = () => {
    const ctaHref = section.heroCtaHref || `#${section.id}`;
    const isHash = ctaHref.startsWith("#");

    if (isHash) {
      const target = document.querySelector(ctaHref) || document.querySelector(`#${section.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        return;
      }

      if (window.location.pathname.startsWith("/offerings") || window.location.pathname === "/") {
        window.location.href = `/#${section.id}`;
        return;
      }
    } else if (ctaHref.startsWith("http") || ctaHref.startsWith("/")) {
      window.location.href = ctaHref;
      return;
    }

    const target = document.querySelector(`#${section.id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${section.id}`;
    }
  };

  const profilePicUrl = settings?.global?.profile_image_url || "https://ui-avatars.com/api/?name=Admin&background=020617&color=fff";

  return (
    <section 
      ref={heroRef} 
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #080a0f 100%)`,
      }}
    >
      {/* Dynamic Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] -right-[10%] h-[700px] w-[700px] rounded-full blur-[150px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute -bottom-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl px-6 flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left gap-12 lg:gap-16">
        {/* Content */}
        <div className="flex-1 space-y-8" data-gsap-reveal>
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
              {section.heroSubtitle || section.title}
            </p>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
            {section.heroTitle}
          </h1>

          <RichTextContent 
            value={section.heroDescription} 
            className="mx-auto max-w-3xl text-lg leading-relaxed text-white/50 font-medium lg:mx-0" 
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:justify-start">
            <button
              onClick={handleCtaClick}
              data-gsap-hover
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-teal-300 px-10 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)]"
            >
              {section.heroCtaLabel}
            </button>
          </div>
        </div>

        {/* Media Column */}
        <div className="flex-shrink-0" data-gsap-reveal data-gsap-delay="0.16" data-gsap-drift>
          <div className="relative group" data-gsap-float>
            {/* Dynamic Glow Aura */}
            <div 
              className="absolute -inset-10 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"
              style={{ backgroundColor: 'var(--site-brand-primary)' }}
            />

            <div className="relative h-64 w-64 lg:h-[380px] lg:w-[380px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl shadow-2xl transition-transform duration-700 group-hover:scale-105">
              {!isHeroImageLoaded && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-gray-950/80 backdrop-blur">
                  <div className="flex flex-col items-center gap-4">
                    <div data-gsap-spin className="h-10 w-10 rounded-full border-4 border-white/20 border-t-teal-300" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Syncing...</span>
                  </div>
                </div>
              )}

              <img
                src={section.heroImageUrl || profilePicUrl}
                alt={section.heroTitle || "Identity"}
                className="h-full w-full object-cover rounded-[2.5rem]"
                onLoad={() => setIsHeroImageLoaded(true)}
                onError={(e) => {
                  e.target.src = profilePicUrl;
                  setIsHeroImageLoaded(true);
                }}
              />
            </div>

            {/* Decorative Elements */}
            <div data-gsap-pulse className="absolute -bottom-4 -right-4 h-10 w-10 rounded-full bg-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
            <div data-gsap-pulse data-gsap-delay="0.4" className="absolute -top-4 -left-4 h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--site-brand-secondary)' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferingHero;
