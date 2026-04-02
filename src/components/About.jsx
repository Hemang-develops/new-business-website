import WorldMap from "./ui/world-map";
import { useReveal } from '../hooks/useReveal';
import { useSiteSettings } from "../context/SiteSettingsContext";

const About = () => {
  const { getSection, getSectionItems } = useSiteSettings();
  const aboutSection = getSection("about");
  const highlights = getSectionItems("about");
  const [phRef, phVisible] = useReveal({ threshold: 0.2 });
  const globalDots = [
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 40.7128, lng: -74.0061, label: "New York City, USA" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 51.5072, lng: -0.1275, label: "London, UK" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 25.2047, lng: 55.2708, label: "Dubai, UAE" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 8.61, lng: 81.2089, label: "New Delhi, India" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: -33.8678, lng: 151.21, label: "Sydney, Australia" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: -1.2833, lng: 36.8167, label: "Nairobi, Kenya" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: -8, lng: 82, label: "Tamil Nadu, India" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 31, lng: 35, label: "Israel" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 4.2094, lng: 101.9781, label: "Malaysia" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 44.3, lng: -85.6, label: "Michigan, USA" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 46.7297, lng: -94.6819, label: "Minnesota, USA" },
    },
    {
      start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" },
      end: { lat: 36.7783, lng: -119.4197, label: "California, USA" },
    },
  ];
  return (
    <section
      id="about"
      className="flex flex-col relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gray-950 py-4 pt-16 text-white lg:py-8"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-gray-950 to-transparent flex flex-col" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 lg:flex-row lg:items-center">
        <div className="lg:w-1/2">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">{aboutSection?.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            {aboutSection?.heading}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-300">
            {aboutSection?.description}
          </p>
          {aboutSection?.descriptionSecondary ? (
            <p className="mt-4 text-lg leading-relaxed text-gray-300">
              {aboutSection.descriptionSecondary}
            </p>
          ) : null}
        </div>
        <div className="lg:w-1/2">
          {/* <div className="grid gap-6 sm:grid-cols-3">
            {highlights.map((item) => {
              const [ref, visible] = useReveal({ threshold: 0.2 });
              return (
                <div
                  key={item.label}
                  ref={ref}
                  className={`group rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-xl shadow-black/20 backdrop-blur transition-all duration-700 ease-out hover:-translate-y-1 ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <p className="text-3xl font-bold text-blue-400 transition-colors group-hover:text-blue-300">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                </div>
              );
            })}
          </div> */}
          <div
            ref={phRef}
            className={`mt-10 rounded-3xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 p-[1px] transition-all duration-700 ease-out ${
              phVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="rounded-[26px] bg-[#081120] p-8 text-left shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">
                    {aboutSection?.supportingEyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{aboutSection?.supportingHeading}</h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-300">
                    {aboutSection?.supportingDescription}
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-slate-950 via-[#081120] to-slate-900 p-3 shadow-inner shadow-sky-950/40">
                  <WorldMap dots={globalDots} lineColor="#60a5fa" theme="dark" />
                </div>
                <p className="text-sm leading-relaxed text-gray-400">
                  {aboutSection?.supportingNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mt-6 grid gap-6 sm:grid-cols-3">
        {highlights.map((item) => {
          const [ref, visible] = useReveal({ threshold: 0.2 });
          return (
            <div
              key={item.key}
              ref={ref}
              className={`group rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-xl shadow-black/20 backdrop-blur transition-all duration-700 ease-out hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <p className="text-3xl font-bold text-blue-400 transition-colors group-hover:text-blue-300">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-gray-300">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default About;
