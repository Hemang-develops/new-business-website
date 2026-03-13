import HorizontalCard from "./common/HorizontalCard";
import { useReveal } from "../hooks/useReveal";
import { useOfferingsData } from "../hooks/useOfferingsData";

const ProgramItem = ({ group }) => {
  const [ref, visible] = useReveal({ threshold: 0.2 });
  const previewTitles = group.items.slice(0, 3).map((item) => item.title).join(", ");
  const imageSource = group.items.find((item) => item.imageUrl)?.imageUrl || "";
  const imageAlt = group.items.find((item) => item.imageUrl)?.imageAlt || group.title;

  return (
    <div
      ref={ref}
      className={`h-full transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
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

const Programs = () => {
  const { buySections } = useOfferingsData();

  return (
    <section id="programs" className="min-h-[calc(100vh-4rem)] bg-gray-50 py-4 pt-16 lg:py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">Offerings</p>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Choose the support that aligns with your season of growth.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            Every option below is a living portal into your next reality. Select what resonates now and I will follow up with next steps within 24 hours.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-8 md:grid-cols-2">
          {buySections.map((group) => (
            <ProgramItem key={group.id} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
