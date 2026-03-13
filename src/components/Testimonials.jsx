import { useEffect, useState } from "react";

import { useReveal } from '../hooks/useReveal';
import { supabase } from "../supabase-client";

const fallbackTestimonials = [
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
  const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from(reviewsTable)
        .select("author,quote,sort_order,is_active")
        .eq("placement", "home")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!isMounted || error || !data?.length) {
        return;
      }

      setTestimonials(
        data.map((entry) => ({
          name: entry.author || "Client",
          quote: entry.quote || "",
        })),
      );
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [reviewsTable]);

  return (
    <section id="testimonials" className="min-h-[calc(100vh-4rem)] bg-gray-950 py-4 pt-16 text-white lg:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">
            Testimonials
          </p>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
            Words from the High Frequencies 11 collective.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-300">
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
                className={`flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur transition-all duration-700 ease-out hover:-translate-y-2 hover:border-blue-400 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <p className="text-lg leading-relaxed text-gray-300">"{testimonial.quote}"</p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
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
