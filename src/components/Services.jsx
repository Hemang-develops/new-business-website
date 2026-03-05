import { useReveal } from '../hooks/useReveal';

const services = [
  {
    title: "Somatic & Energetic Practices",
    description:
      "Breathwork, tapping, and body-led rituals that keep your nervous system anchored while you quantum leap.",
    icon: "🌀",
  },
  {
    title: "Manifestation Frameworks",
    description:
      "Signature High Frequencies 11 methods that blend neuroscience with spiritual teachings for tangible shifts.",
    icon: "✨",
  },
  {
    title: "Lifetime-Ready Resources",
    description:
      "Journals, guided meditations, and replay libraries you can return to whenever you need a frequency boost.",
    icon: "📚",
  },
  {
    title: "Community & Accountability",
    description:
      "Monthly circles, private Voxer channels, and global members who are walking the same path by your side.",
    icon: "🤝",
  },
];

const Services = () => {
  return (
    <section
      id="services"
      className="relative min-h-[calc(100vh-4rem)] pt-16 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-rose-500 py-4 lg:py-8 text-white"
    >
      <div className="absolute inset-0 opacity-20 mix-blend-soft-light">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-pink-200/60 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">
            The experience
          </p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            What makes High Frequencies 11 different.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/80">
            These pillars define every session, program, and resource we create. You will be seen, supported, and stretched into your next evolution.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-8 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const [ref, visible] = useReveal({ threshold: 0.2 });
            return (
              <div
                key={service.title}
                ref={ref}
                className={`group flex h-full flex-col rounded-3xl bg-white/10 p-8 shadow-xl backdrop-blur transition-all duration-700 ease-out hover:-translate-y-2 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                  {service.icon}
                </span>
                <h3 className="mt-6 text-2xl font-semibold">{service.title}</h3>
                <p className="mt-4 flex-1 text-lg text-white/80">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
