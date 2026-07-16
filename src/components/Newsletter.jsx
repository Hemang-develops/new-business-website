import { useRef, useState } from "react";
import { Input } from "./ui/input";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addNewsletterSubscription, isDuplicateNewsletterSubscriptionError } from "../services/newsletter";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import RichTextContent from "./ui/RichTextContent";

const Newsletter = () => {
  const newsletterRef = useRef(null);
  const { getSection } = useSiteSettings();
  const newsletterSection = getSection("newsletter");
  const { user } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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


            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              {newsletterSection?.heading}
            </h2>
            
            <RichTextContent 
              value={newsletterSection?.description} 
              className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 font-medium mb-10" 
            />

            <form
              className="mx-auto flex w-full max-w-xl flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email) {
                  toast.error("Please enter a valid email address.");
                  return;
                }
                setIsSubmitting(true);
                try {
                  await addNewsletterSubscription({
                    email,
                    source: "newsletter_section",
                    userId: user?.id || null,
                    metadata: { section: "homepage_newsletter" },
                  });
                  setEmail("");
                  toast.success("You’re on the list. Check your inbox soon.");
                } catch (err) {
                  if (isDuplicateNewsletterSubscriptionError(err)) {
                    toast.success("You've already joined the newsletter !");
                    return;
                  }
                  toast.error(err.message || "Could not subscribe to the newsletter.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="h-14 flex-1 rounded-2xl border-white/5 bg-white/[0.03] px-6 text-sm placeholder:text-white/20 focus-visible:border-teal-300 focus-visible:ring-teal-300/10 transition-all"
                />
                <button
                  type="submit"
                  data-gsap-hover
                  disabled={isSubmitting}
                  className="h-14 rounded-2xl bg-teal-300 px-10 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : newsletterSection?.primaryCtaLabel || "Join now"}
                </button>
              </div>

              <p className="text-xs text-white/40">{newsletterSection?.formDisclaimer || "By subscribing you agree to receive newsletter updates and can unsubscribe anytime."}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
