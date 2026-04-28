import { useRef } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import RichTextContent from "./ui/RichTextContent";

const Resources = () => {
  const resourcesRef = useRef(null);
  const { getSection, getSectionItems } = useSiteSettings();
  const resourcesSection = getSection("resources");
  const resources = getSectionItems("resources");
  useGsapReveal(resourcesRef, [resources.length]);
  useGsapHover(resourcesRef, "[data-gsap-hover]", [resources.length]);
  return (
    <section ref={resourcesRef} id="resources" className="min-h-[calc(100vh-4rem)] bg-gray-950 py-4 pt-16 text-white lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-gsap-reveal data-parallax-content data-parallax-depth="0.35">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">{resourcesSection?.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
            {resourcesSection?.heading}
          </h2>
          <RichTextContent value={resourcesSection?.description} className="mx-auto mt-6 max-w-3xl text-lg text-gray-300" />
        </div>

        <div className="mt-16 grid auto-rows-fr gap-6 md:grid-cols-2">
          {resources.map((resource) => {
            return (
              <a
                key={resource.key}
                href={resource.href}
                data-gsap-reveal
                data-gsap-hover
                className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur hover:border-blue-400"
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <div>
                  <h3 className="text-2xl font-semibold text-white transition-colors group-hover:text-blue-400">
                    {resource.title}
                  </h3>
                  <RichTextContent value={resource.description} className="mt-4 text-base text-gray-300" />
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
