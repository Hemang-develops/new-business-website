import { useRef } from "react";
import { Layers3, Library, Sparkles, Users } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import RichTextContent from "./ui/RichTextContent";

const serviceIcons = {
  sparkles: Sparkles,
  layers: Layers3,
  library: Library,
  users: Users,
};

const Services = () => {
  const servicesRef = useRef(null);
  const { getSection, getSectionItems } = useSiteSettings();
  const servicesSection = getSection("services");
  const services = getSectionItems("services");

  useGsapReveal(servicesRef, [services.length]);
  useGsapHover(servicesRef, "[data-gsap-hover]", [services.length]);

  return (
    <section
      ref={servicesRef}
      id="services"
      className="relative min-h-screen overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #05070a 100%)`,
      }}
    >
      {/* Dynamic Background Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
        <div
          className="absolute -right-[5%] bottom-0 h-[400px] w-[400px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl" data-gsap-reveal>
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
              {servicesSection?.eyebrow || "Services"}
            </p>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-8 leading-[1.1]">
            {servicesSection?.heading}
          </h2>

          <div className="h-1 w-20 bg-teal-300/50 mb-8 rounded-full" />

          <RichTextContent
            value={servicesSection?.description}
            className="text-lg leading-relaxed text-white/50 max-w-2xl font-medium"
          />
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = serviceIcons[service.icon] || Sparkles;
            return (
              <div
                key={service.key}
                data-gsap-reveal
                data-gsap-hover
                className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-10 transition-all duration-500 hover:border-teal-300/30 hover:bg-white/[0.04] shadow-2xl backdrop-blur-2xl"
              >
                {/* Hover Glow Effect */}
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-teal-300/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] text-teal-300 border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:bg-teal-300 group-hover:text-black shadow-lg">
                    <Icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors">
                    {service.title}
                  </h3>

                  <div className="text-sm leading-relaxed text-white/40 font-medium group-hover:text-white/60 transition-colors">
                    <RichTextContent value={service.description} />
                  </div>
                </div>

                {/* Corner Decoration */}
                {/* <div className="absolute bottom-6 right-6 h-10 w-10 opacity-0 transition-all duration-500 group-hover:opacity-100 translate-x-3 translate-y-3 group-hover:translate-x-0 group-hover:translate-y-0">
                  <svg className="h-full w-full text-teal-300/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div> */}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
