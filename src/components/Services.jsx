import { Layers3, Library, Sparkles, Users } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { useSiteSettings } from "../context/SiteSettingsContext";
import RichTextContent from "./ui/RichTextContent";

const serviceIcons = {
  sparkles: Sparkles,
  layers: Layers3,
  library: Library,
  users: Users,
};

const Services = () => {
  const { getSection, getSectionItems } = useSiteSettings();
  const servicesSection = getSection("services");
  const services = getSectionItems("services");

  return (
    <section
      id="services"
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-rose-500 py-4 pt-16 text-white lg:py-8"
    >
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-pink-200/60 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">{servicesSection?.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">{servicesSection?.heading}</h2>
          <RichTextContent value={servicesSection?.description} className="mx-auto mt-6 max-w-3xl text-lg text-white/80" />
        </div>

        <div className="mt-16 grid auto-rows-fr gap-8 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const [ref, visible] = useReveal({ threshold: 0.2 });
            const Icon = serviceIcons[service.icon] || Sparkles;
            return (
              <div
                key={service.key}
                ref={ref}
                className={`group flex h-full flex-col rounded-3xl bg-white/10 p-8 shadow-xl backdrop-blur transition-all duration-700 ease-out hover:-translate-y-2 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-2xl font-semibold">{service.title}</h3>
                <RichTextContent value={service.description} className="mt-4 flex-1 text-lg text-white/80" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
