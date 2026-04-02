import { useReveal } from '../hooks/useReveal';
import { useSiteSettings } from "../context/SiteSettingsContext";

const Resources = () => {
  const { getSection, getSectionItems } = useSiteSettings();
  const resourcesSection = getSection("resources");
  const resources = getSectionItems("resources");
  return (
    <section id="resources" className="min-h-[calc(100vh-4rem)] bg-gray-950 py-4 pt-16 text-white lg:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">{resourcesSection?.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
            {resourcesSection?.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-300">
            {resourcesSection?.description}
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-6 md:grid-cols-2">
          {resources.map((resource) => {
            const [ref, visible] = useReveal({ threshold: 0.2 });
            return (
              <a
                key={resource.key}
                ref={ref}
                href={resource.href}
                className={`group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur transition-all duration-700 ease-out hover:-translate-y-2 hover:border-blue-400 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <div>
                  <h3 className="text-2xl font-semibold text-white transition-colors group-hover:text-blue-400">
                    {resource.title}
                  </h3>
                  <p className="mt-4 text-base text-gray-300">{resource.description}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400 transition-colors group-hover:text-blue-300">
                  {resource.label}
                  <span aria-hidden></span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Resources;
