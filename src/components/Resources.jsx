import { useReveal } from '../hooks/useReveal';

const resources = [
  {
    title: "Podcast: High Frequencies 11",
    description: "Weekly activations, channelled messages, and conversations about manifestation, mindset, and miracles.",
    cta: "Listen on Spotify",
    href: "https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n",
  },
  {
    title: "YouTube: @nehalpatelishere",
    description: "Binge long-form trainings, rituals, and intimate vlogs that make manifestation feel like your daily rhythm.",
    cta: "Subscribe on YouTube",
    href: "https://www.youtube.com/@nehalpatelishere",
  },
  {
    title: "Amazon Storefront",
    description: "Shop the exact books, candles, and ritual tools I use to stay anchored in a high frequency every day.",
    cta: "View the list",
    href: "https://www.amazon.ca/shop/bookescape_?ref_=cm_sw_r_cp_mwn_aipsfshop_aipsfbookescape__PBB131SY1HEHXB4D7YG2_1&language=en_US",
  },
  {
    title: "Newsletter & Free Gifts",
    description: "Receive monthly energy forecasts, journal prompts, and pop-up offers that keep you plugged into the vortex.",
    cta: "Join the list",
    href: "#newsletter",
  },
];

const Resources = () => {
  return (
    <section id="resources" className="min-h-[calc(100vh-4rem)] pt-16 bg-gray-100 py-4 lg:py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">
            Resources
          </p>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Continue the frequency work between sessions.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            A curated library of free and paid resources to support your practice.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-6 md:grid-cols-2">
          {resources.map((resource) => {
            const [ref, visible] = useReveal({ threshold: 0.2 });
            return (
              <a
                key={resource.title}
                ref={ref}
                href={resource.href}
                className={`group flex h-full flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/60 transition-all duration-700 ease-out hover:-translate-y-2 hover:border-blue-400 dark:border-gray-800 dark:bg-gray-950 dark:shadow-none ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {resource.title}
                </h3>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400">{resource.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                {resource.cta}
                <span aria-hidden>↗</span>
              </span>
            </a>)
          })}
        </div>
      </div>
    </section>
  );
};

export default Resources;
