import { useReveal } from '../hooks/useReveal';

const testimonials = [
  {
    name: "Anika, Toronto",
    quote:
      "Within four weeks of working with Nehal I landed the apartment, the partner, and the dream clients I had written down. I finally trust my own timeline.",
  },
  {
    name: "Jasmine, London",
    quote:
      "The audio coaching felt like having a best friend in my pocket. I released anxiety around sales and had my highest launch to date.",
  },
  {
    name: "Maya, Dubai",
    quote:
      "Nehal blends feminine flow with grounded strategy. I learned how to manifest without bypassing my feelings and everything changed.",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="min-h-[calc(100vh-4rem)] pt-16 bg-white py-4 lg:py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">
            Testimonials
          </p>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Words from the High Frequencies 11 collective.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            Real people. Real timelines collapsing. Real lives transforming.
          </p>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => {
            const [ref, visible] = useReveal({ threshold: 0.2 });
            return (
              <div
                key={testimonial.name}
                ref={ref}
                className={`flex h-full flex-col justify-between rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/40 transition-all duration-700 ease-out hover:-translate-y-2 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">“{testimonial.quote}”</p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                  {testimonial.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
