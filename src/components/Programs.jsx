import HorizontalCard from "./common/HorizontalCard";
import { useReveal } from "../hooks/useReveal";
import { useOfferingsData } from "../hooks/useOfferingsData";
import { Skeleton } from "./ui/skeleton";

const ProgramItem = ({ group }) => {
  const [ref, visible] = useReveal({ threshold: 0.2 });
  const previewTitles = group.items.slice(0, 3).map((item) => item.title).join(", ");
  const imageSource = group.items.find((item) => item.imageUrl)?.imageUrl || "";
  const imageAlt = group.items.find((item) => item.imageUrl)?.imageAlt || group.title;

  return (
    <div
      ref={ref}
      className={`h-full transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
    >
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
  <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur transition-all duration-300 ease-in-out md:flex-row">
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
  const { buySections, isLoading } = useOfferingsData();

  return (
    <section id="programs" className="min-h-[calc(100vh-4rem)] bg-gray-950 py-4 pt-16 text-white lg:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">Offerings</p>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
            Choose the support that aligns with your season of growth.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-300">
            Every option below is a living portal into your next reality. Select what resonates now and I will follow up with next steps within 24 hours.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-8 md:grid-cols-2">
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
