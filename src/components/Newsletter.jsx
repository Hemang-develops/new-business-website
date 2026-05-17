import { useRef } from "react";
import { Input } from "./ui/input";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import RichTextContent from "./ui/RichTextContent";

const Newsletter = () => {
  const newsletterRef = useRef(null);
  const { getSection } = useSiteSettings();
  const newsletterSection = getSection("newsletter");
  
  useGsapReveal(newsletterRef);
  useGsapHover(newsletterRef);

  return (
    <section 
      ref={newsletterRef} 
      id="newsletter" 
      className="relative overflow-hidden py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Background Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -bottom-[20%] right-[10%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 md:p-12 text-center backdrop-blur-2xl shadow-2xl" data-gsap-reveal>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-300/[0.03] to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
                {newsletterSection?.eyebrow || "Insights"}
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              {newsletterSection?.heading}
            </h2>
            
            <RichTextContent 
              value={newsletterSection?.description} 
              className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 font-medium mb-10" 
            />

            <form
              className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:flex-row"
              onSubmit={async (e) => {
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email");
                if (!email) return;

                // Save to Supabase for Admin management
                try {
                  const { supabase } = await import("../supabase-client");
                  await supabase.from("storefront_newsletter_signups").insert([{ 
                    email: String(email).toLowerCase(),
                    created_at: new Date().toISOString()
                  }]);
                } catch (err) {
                  console.warn("Could not save to Supabase:", err.message);
                }
                
                // Formspree submission continues via standard action/method if desired, 
                // but we can also manually fetch it here or just let it submit.
                // Here we let it submit naturally to Formspree after saving to Supabase.
              }}
              action={newsletterSection?.formAction || "https://formspree.io/f/xovqwaaw"}
              method="POST"
            >
              <Input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="h-14 flex-1 rounded-2xl border-white/5 bg-white/[0.03] px-6 text-sm placeholder:text-white/20 focus-visible:border-teal-300 focus-visible:ring-teal-300/10 transition-all"
              />
              <button
                type="submit"
                data-gsap-hover
                className="h-14 rounded-2xl bg-teal-300 px-10 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)]"
              >
                {newsletterSection?.primaryCtaLabel || "Join now"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
