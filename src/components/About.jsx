import { useReveal } from '../hooks/useReveal';

const About = () => {
  const [phRef, phVisible] = useReveal({ threshold: 0.2 });
  const highlights = [
    {
      label: "1,000+",
      description: "souls supported through sessions, workshops, and digital communities",
    },
    {
      label: "8+ years",
      description: "of practical manifestation and mindset coaching experience",
    },
    {
      label: "Global",
      description: "clients from 15 countries united by the High Frequencies 11 movement",
    },
  ];

  return (
    <section
      id="about"
      className="relative min-h-[calc(100vh-4rem)] pt-16 flex items-center justify-center overflow-hidden bg-white py-4 lg:py-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-transparent dark:from-gray-900/60 dark:via-gray-950 dark:to-transparent" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 lg:flex-row lg:items-center">
        <div className="lg:w-1/2">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">
            About the movement
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            High Frequencies 11 is a sanctuary for conscious creators.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Founded by manifestation mentor <span className="font-semibold text-blue-600 dark:text-blue-400">Nehal Patel</span>,
            High Frequencies 11 helps you collapse timelines, trust your inner guidance, and
            manifest a life that reflects your highest self. We blend spiritual wisdom with
            grounded action so you can experience sustainable shifts rather than quick fixes.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Whether you join for high-touch private mentorship, immersive audio coaching, or
            heart-led community circles, every offering is designed to amplify your energy and
            make manifestation practical, joyful, and deeply personal.
          </p>
        </div>
        <div className="lg:w-1/2">
          <div className="grid gap-6 sm:grid-cols-3">
            {highlights.map((item) => {
              const [ref, visible] = useReveal({ threshold: 0.2 });
              return (
                <div
                  key={item.label}
                  ref={ref}
                  className={`group rounded-2xl border border-blue-100 bg-white/80 p-6 text-center shadow-lg shadow-blue-100/40 transition-all duration-700 ease-out hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-none ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                >
                  <p className="text-3xl font-bold text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              );
            })}
          </div>
          <div
            ref={phRef}
            className={`mt-10 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 p-[1px] transition-all duration-700 ease-out ${
              phVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="rounded-[26px] bg-white p-8 text-left shadow-xl dark:bg-gray-950">
              <h3 className="text-xl font-semibold">Core Philosophy</h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
                Your desires are divine assignments. When you regulate your nervous system,
                speak your truth, and take aligned action, the universe responds rapidly. We
                give you the rituals, mindset tools, and accountability to stay in that high
                frequency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
