import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import { supabase } from "../supabase-client";
import { reviewsTable } from "../pages/admin/catalogAdminHelpers";

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
  const testimonialsRef = useRef(null);
  const { getSection } = useSiteSettings();
  const testimonialsSection = getSection("testimonials");
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  
  useGsapReveal(testimonialsRef, [testimonials.length]);
  useGsapHover(testimonialsRef, "[data-gsap-hover]", [testimonials.length]);

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
  }, []);

  return (
    <section 
      ref={testimonialsRef} 
      id="testimonials" 
      className="relative min-h-screen overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute -bottom-[10%] right-[20%] h-[400px] w-[400px] rounded-full blur-[100px] opacity-5"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl mb-16" data-gsap-reveal>


          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 leading-[1.1]">
            {testimonialsSection?.heading}
          </h2>
          
          <p className="text-lg leading-relaxed text-white/50 max-w-2xl font-medium">
            {testimonialsSection?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              data-gsap-reveal
              data-gsap-hover
              className="group relative flex flex-col justify-between rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-10 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-teal-300/30"
            >
              <div className="absolute top-8 left-8 text-teal-300/20">
                <svg width="40" height="30" viewBox="0 0 40 30" fill="currentColor">
                  <path d="M11.6667 30C5.22222 30 0 24.8148 0 18.4259C0 14.3519 1.48148 9.35185 4.44444 3.42593C5.55556 1.2037 6.66667 0 7.77778 0C8.7037 0 9.44444 0.740741 10 2.22222C10.5556 3.7037 10 4.81481 8.33333 5.55556C6.66667 6.2963 5.37037 8.51852 4.44444 12.2222C4.07407 14.0741 4.62963 15.3704 6.11111 16.1111C7.59259 16.8519 9.44444 17.2222 11.6667 17.2222C18.1111 17.2222 23.3333 22.4074 23.3333 28.7963C23.3333 35.1852 18.1111 30 11.6667 30ZM28.3333 30C21.8889 30 16.6667 24.8148 16.6667 18.4259C16.6667 14.3519 18.1481 9.35185 21.1111 3.42593C22.2222 1.2037 23.3333 0 24.4444 0C25.3704 0 26.1111 0.740741 26.6667 2.22222C27.2222 3.7037 26.6667 4.81481 25 5.55556C23.3333 6.2963 22.037 8.51852 21.1111 12.2222C20.7407 14.0741 21.2963 15.3704 22.7778 16.1111C24.2593 16.8519 26.1111 17.2222 28.3333 17.2222C34.7778 17.2222 40 22.4074 40 28.7963C40 35.1852 34.7778 30 28.3333 30Z" />
                </svg>
              </div>
              
              <div className="relative pt-12">
                <p className="text-lg leading-relaxed text-white/70 italic font-medium">
                  {testimonial.quote?.replace(/<[^>]*>?/gm, '')}
                </p>
                <div className="mt-10 pt-8 border-t border-white/5">
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-teal-300">
                    {testimonial.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
