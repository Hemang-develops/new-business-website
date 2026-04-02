import { useEffect, useState } from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { profilePic } from "../../utils";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { settings, getSection, getSectionItems } = useSiteSettings();
  const heroSection = getSection("hero");
  const heroProofs = getSectionItems("hero");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gray-950 text-white"
    >
      <div className="absolute inset-0 bg-fixed bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-fixed bg-gradient-to-br from-indigo-900/40 via-gray-950 to-black mix-blend-screen" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:py-12">
        <div
          className={`space-y-8 transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-medium uppercase tracking-[0.4em] text-white/70">
            High Frequencies 11
          </span> */}
          {heroSection?.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">{heroSection.eyebrow}</p>
          ) : null}
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">{heroSection?.heading}</h1>
          <p className="max-w-2xl text-lg text-white/70">
            {heroSection?.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={heroSection?.primaryCtaHref || "#programs"}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-brand-primary-light bg-brand-primary px-8 py-3 text-base font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {heroSection?.primaryCtaLabel || "Explore offerings"}
            </a>
            <a
              href={heroSection?.secondaryCtaHref || "#contact"}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/5 px-8 py-3 text-base font-semibold text-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary-light hover:bg-white/10 hover:text-brand-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              {heroSection?.secondaryCtaLabel || "Book a discovery call"}
            </a>
          </div>
          <div className="flex flex-wrap gap-6 pt-6">
            {heroProofs.map((item) => (
              <div key={item.title} className="w-full sm:w-1/3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mx-auto flex justify-center transition-all duration-1000 ease-out delay-200 lg:mx-0 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 blur-3xl opacity-60" />
            <div className="relative rounded-[36px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <img
                src={settings.profile.imageUrl || profilePic}
                alt={settings.profile.imageAlt}
                width={384}
                height={384}
                className="h-80 w-80 rounded-[28px] object-cover shadow-2xl lg:h-96 lg:w-96"
              />
              <div className="absolute left-1/2 top-full mt-4 w-max -translate-x-1/2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur">
                {settings.profile.roleLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
