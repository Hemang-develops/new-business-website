import { useRef } from "react";
import WorldMap from "./ui/world-map";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import RichTextContent from "./ui/RichTextContent";

const About = () => {
  const aboutRef = useRef(null);
  const { getSection, getSectionItems } = useSiteSettings();
  const aboutSection = getSection("about");
  const highlights = getSectionItems("about");
  
  useGsapReveal(aboutRef, [highlights.length]);
  useGsapHover(aboutRef, "[data-gsap-hover]", [highlights.length]);

  const globalDots = [
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 40.7128, lng: -74.0061, label: "New York City, USA" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 51.5072, lng: -0.1275, label: "London, UK" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 25.2047, lng: 55.2708, label: "Dubai, UAE" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 8.61, lng: 81.2089, label: "New Delhi, India" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: -33.8678, lng: 151.21, label: "Sydney, Australia" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: -1.2833, lng: 36.8167, label: "Nairobi, Kenya" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: -8, lng: 82, label: "Tamil Nadu, India" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 31, lng: 35, label: "Israel" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 4.2094, lng: 101.9781, label: "Malaysia" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 44.3, lng: -85.6, label: "Michigan, USA" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 46.7297, lng: -94.6819, label: "Minnesota, USA" } },
    { start: { lat: 43.45, lng: -80.5, label: "Kitchener, Canada" }, end: { lat: 36.7783, lng: -119.4197, label: "California, USA" } },
  ];

  return (
    <section
      id="about"
      ref={aboutRef}
      className="relative min-h-screen overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[20%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[150px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-20 lg:flex-row lg:items-start lg:justify-between">
          
          {/* Left Column: Text Content */}
          <div className="lg:max-w-xl" data-gsap-reveal>


            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-8 leading-[1.1]">
              {aboutSection?.heading}
            </h2>
            
            <div className="h-1 w-20 bg-teal-300/50 mb-10 rounded-full" />
            
            <RichTextContent 
              value={aboutSection?.description} 
              className="text-lg leading-relaxed text-white/50 font-medium" 
            />

            {/* Highlights Grid */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {highlights.map((item) => (
                <div
                  key={item.key}
                  data-gsap-reveal
                  data-gsap-hover
                  className="group rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all duration-300 hover:border-teal-300/30 hover:bg-white/[0.05]"
                >
                  <p className="text-3xl font-bold text-teal-300 mb-2">
                    {item.title}
                  </p>
                  <div className="text-xs font-medium text-white/40 group-hover:text-white/60">
                    <RichTextContent value={item.description} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Map & Supporting Info */}
          <div className="lg:w-[45%]" data-gsap-reveal delay="0.2">
            <div className="relative rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-2 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[2rem] bg-gray-950/80 p-8">
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/60 mb-4">
                      {aboutSection?.supportingEyebrow}
                    </p>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {aboutSection?.supportingHeading}
                    </h3>
                    <RichTextContent 
                      value={aboutSection?.supportingDescription} 
                      className="text-base text-white/40 leading-relaxed font-medium" 
                    />
                  </div>

                  {/* World Map Container */}
                  <div className="relative overflow-hidden rounded-3xl border border-teal-300/10 bg-gradient-to-br from-black/40 to-black/20 p-4 shadow-inner">
                    <WorldMap 
                      dots={globalDots} 
                      lineColor="var(--site-brand-primary)" 
                      theme="dark" 
                    />
                  </div>
                </div>
              </div>

              {/* Decorative Corner Element */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-teal-300/5 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
