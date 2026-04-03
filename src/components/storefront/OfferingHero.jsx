import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { profilePic } from "../../utils";

const OfferingHero = ({ section }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setIsHeroImageLoaded(false);
  }, [section?.heroImageUrl]);

  const handleCtaClick = () => {
    const ctaHref = section.heroCtaHref || `#${section.id}`;
    const isHash = ctaHref.startsWith("#");

    if (isHash) {
      // Prefer the configured anchor, then fallback to the section id anchor.
      const target = document.querySelector(ctaHref) || document.querySelector(`#${section.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        return;
      }

      // If the anchor section is not found on this screen, force route to the shop page where it exists.
      if (window.location.pathname.startsWith("/offerings") || window.location.pathname === "/") {
        window.location.href = `/#${section.id}`;
        return;
      }
    } else if (ctaHref.startsWith("http") || ctaHref.startsWith("/")) {
      window.location.href = ctaHref;
      return;
    }

    // Fallback: navigate to the section id on the current page.
    const target = document.querySelector(`#${section.id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${section.id}`;
    }
  };

  const profilePicUrl = settings?.profile?.imageUrl || profilePic;

  return (
    <>
      <style>
        {`
          @keyframes smoothDrift {
            0%, 100% {
              transform: translateY(0px) translateX(0px) rotate(0deg);
            }
            25% {
              transform: translateY(-6px) translateX(2px) rotate(0.3deg);
            }
            50% {
              transform: translateY(-3px) translateX(4px) rotate(0.6deg);
            }
            75% {
              transform: translateY(-9px) translateX(1px) rotate(0.2deg);
            }
          }
          
          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-4px) rotate(0.8deg);
            }
          }
          
          .profile-smooth {
            animation: smoothDrift 8s ease-in-out infinite;
            animation-delay: 1.5s;
          }
          
          .profile-float {
            animation: gentleFloat 6s ease-in-out infinite;
          }
        `}
      </style>
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-950 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-fixed bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-fixed bg-gradient-to-br from-indigo-900/40 via-gray-950 to-black mix-blend-screen" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 py-16 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        {/* Content */}
        <div
          className={`flex-1 space-y-8 transition-all duration-1000 ease-out lg:pr-12 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium uppercase tracking-[0.4em] text-white/70">
            {section.heroSubtitle || section.title}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl lg:text-5xl xl:text-6xl">
            {section.heroTitle}
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/70 lg:mx-0">
            {section.heroDescription}
          </p>

          {/* CTA Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-start">
            <button
              onClick={handleCtaClick}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-brand-primary-light bg-brand-primary px-8 py-3 text-base font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {section.heroCtaLabel}
            </button>
          </div>
        </div>

        {/* Profile Image */}
        <div
          className={`mt-12 flex-shrink-0 transition-all duration-1000 ease-out lg:mt-0 profile-smooth ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="relative profile-float">
            {/* Glow Effect */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-brand-primary-light/20 via-brand-secondary/20 to-brand-accent/20 blur-xl" />

            {/* Image Container */}
            <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white/20 shadow-2xl lg:h-80 lg:w-80">
              {!isHeroImageLoaded && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-gray-950/80 backdrop-blur">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-primary-light" />
                    <span className="text-xs uppercase text-white/75 tracking-wider">Loading...</span>
                  </div>
                </div>
              )}

              <img
                src={section.heroImageUrl || profilePicUrl}
                alt={section.heroTitle || "Nehal Patel"}
                className="h-full w-full object-cover"
                onLoad={() => setIsHeroImageLoaded(true)}
                onError={(e) => {
                  e.target.src = profilePicUrl;
                  setIsHeroImageLoaded(true);
                }}
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-4 -right-4 h-8 w-8 rounded-full bg-brand-primary-light animate-pulse" />
            <div className="absolute -top-4 -left-4 h-6 w-6 rounded-full bg-brand-secondary animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 -right-6 h-4 w-4 rounded-full bg-brand-accent animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
    </section>
    </>
  );
};

export default OfferingHero;