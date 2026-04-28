import { useRef } from "react";
import HorizontalCard from "./common/HorizontalCard";
import { useOfferingsData } from "../hooks/useOfferingsData";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapReveal } from "../hooks/useGsapMotion";
import { Skeleton } from "./ui/skeleton";

const ProgramItem = ({ group }) => {
  const previewTitles = group.items.slice(0, 3).map((item) => item.title).join(", ");
  const imageSource = group.items.find((item) => item.imageUrl)?.imageUrl || "";
  const imageAlt = group.items.find((item) => item.imageUrl)?.imageAlt || group.title;

  return (
    <div className="h-full" data-gsap-reveal>
      <HorizontalCard
        image={imageSource}
        imageAlt={imageAlt}
        title={group.title}
        subtitle={`${group.items.length} offering${group.items.length === 1 ? "" : "s"}`}
        description={`${group.description}${previewTitles ? ` Includes ${previewTitles}.` : ""}`}
        buttonLink={`/offerings/${group.id}`}
        buttonText="View more"
        maxDescriptionLength={260}
        clickableCard
      />
    </div>
  );
};

const ProgramSkeleton = () => (
  <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur md:flex-row">
    <div className="h-48 w-full shrink-0 md:h-auto md:w-2/5">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
    <div className="flex min-h-[200px] flex-1 flex-col justify-between p-6">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-6 w-3/4 md:h-7" />
        <Skeleton className="h-4 w-1/4 md:h-5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-1/4 md:h-7" />
        <Skeleton className="h-6 w-24 md:h-7" />
      </div>
    </div>
  </div>
);

const Programs = () => {
  const programsRef = useRef(null);
  const { buySections, isLoading } = useOfferingsData();
  const { getSection } = useSiteSettings();
  const programsSection = getSection("programs");
  
  useGsapReveal(programsRef, [isLoading, buySections.length]);

  return (
    <section 
      ref={programsRef} 
      id="programs" 
      className="relative min-h-screen overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Dynamic Background Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -bottom-[20%] left-[10%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute top-[10%] right-[5%] h-[400px] w-[400px] rounded-full blur-[100px] opacity-5"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl" data-gsap-reveal>
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
              {programsSection?.eyebrow || "Offerings"}
            </p>
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 leading-[1.1]">
            {programsSection?.heading}
          </h2>
          
          <div className="h-1 w-20 bg-teal-300/50 mb-8 rounded-full" />
          
          <p className="text-lg leading-relaxed text-white/50 max-w-2xl font-medium">
            {programsSection?.description}
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {isLoading ? (
            <>
              <ProgramSkeleton />
              <ProgramSkeleton />
              <ProgramSkeleton />
              <ProgramSkeleton />
            </>
          ) : (
            buySections.map((group) => (
              <ProgramItem key={group.id} group={group} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Programs;
