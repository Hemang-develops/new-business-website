import { Input } from "./ui/input";
import { useSiteSettings } from "../context/SiteSettingsContext";
import RichTextContent from "./ui/RichTextContent";

const Newsletter = () => {
  const { getSection } = useSiteSettings();
  const newsletterSection = getSection("newsletter");
  return (
    <section id="newsletter" className="relative bg-gray-950 py-12 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/10 to-purple-500/30" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
            {newsletterSection?.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{newsletterSection?.heading}</h2>
          <RichTextContent value={newsletterSection?.description} className="mx-auto mt-4 max-w-2xl text-base text-white/70" />
          <form
            className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
            action={newsletterSection?.formAction || "https://formspree.io/f/xovqwaaw"}
            method="POST"
          >
            <Input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
              className="flex-1 rounded-full border-white/20 bg-white/10 px-6 placeholder:text-white/60 focus-visible:border-brand-primary focus-visible:ring-brand-primary"
            />
            <button
              type="submit"
              className="w-full rounded-full border-2 border-brand-primary-light bg-brand-primary px-7 py-3 text-sm font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 sm:w-auto"
            >
              {newsletterSection?.primaryCtaLabel || "Join now"}
            </button>
          </form>
          <RichTextContent value={newsletterSection?.supportingDescription || "No spam. Just potent reminders."} className="mt-3 text-xs text-white/50" />
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
