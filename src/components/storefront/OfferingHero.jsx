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
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, #030406 0%, #060c16 50%, #03050a 100%)` }}
    >
      {/* Cinematic Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -right-[15%] h-[800px] w-[800px] rounded-full blur-[180px] opacity-[0.12]"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div
          className="absolute -bottom-[15%] -left-[10%] h-[700px] w-[700px] rounded-full blur-[160px] opacity-[0.12]"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl px-6 flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-20 pt-24 pb-16 lg:pt-36 lg:pb-20 text-left">
        {/* Content — on mobile appears BELOW image */}
        <div className="order-2 lg:order-1 flex-1 space-y-8" data-gsap-reveal>



          <h1 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold tracking-tighter text-white leading-[1.05]">
            {section.heroTitle}
          </h1>

          <RichTextContent
            value={section.heroDescription}
            className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-white/45 font-medium lg:mx-0"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-start">
            <button
              onClick={handleCtaClick}
              data-gsap-hover
              className="inline-flex h-13 items-center justify-center rounded-2xl px-8 text-sm font-bold uppercase tracking-widest text-black transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{
                background: `linear-gradient(135deg, var(--site-brand-primary-light), var(--site-brand-primary))`,
                boxShadow: `0 16px 48px -8px color-mix(in srgb, var(--site-brand-primary) 45%, transparent)`,
              }}
            >
              {section.heroCtaLabel}
            </button>
          </div>
        </div>

        {/* Media Column — on mobile appears FIRST (top) */}
        <div className="order-1 lg:order-2 flex-shrink-0 w-full lg:w-auto" data-gsap-reveal data-gsap-delay="0.16" data-gsap-drift>
          <div className="relative group w-full lg:w-[340px]" data-gsap-float>
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
              className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-2xl"
              style={{ boxShadow: `0 40px 120px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative overflow-hidden rounded-[1.6rem] h-[240px] sm:h-[280px] lg:h-[380px] w-full">
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
                  className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                  onLoad={() => setIsHeroImageLoaded(true)}
                  onError={(e) => { e.target.src = profilePicUrl; setIsHeroImageLoaded(true); }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </div>

            {/* Decorative accent dots */}
            <div data-gsap-pulse className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.6)]" style={{ backgroundColor: 'var(--site-brand-primary)' }} />
            <div data-gsap-pulse data-gsap-delay="0.4" className="absolute -top-3 -left-3 h-6 w-6 rounded-full" style={{ backgroundColor: 'var(--site-brand-secondary)', opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferingHero;
