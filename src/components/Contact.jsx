import { useRef, useState } from "react";

import worldMap from "../assets/world.svg";
import { useToast } from "../context/ToastContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useOfferingsData } from "../hooks/useOfferingsData";
import { useGsapReveal } from "../hooks/useGsapMotion";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import RichTextContent from "./ui/RichTextContent";

const initialFormState = {
  name: "",
  email: "",
  support: "",
  message: "",
};

const Contact = () => {
  const contactRef = useRef(null);
  const { getSection, getLinks } = useSiteSettings();
  const contactSection = getSection("contact");
  const { offeringSupportOptions, isLoading } = useOfferingsData();
  const toast = useToast();
  const [formValues, setFormValues] = useState(initialFormState);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });
  const contactMethods = getLinks("contact");
  
  useGsapReveal(contactRef);

  const supportOptions = [...(offeringSupportOptions || []), "Custom collaboration"];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.support) {
      const message = "Select the offering you are interested in.";
      setSubmissionState({ status: "error", message });
      toast.error(message);
      return;
    }
    setSubmissionState({ status: "submitting", message: "" });

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "We were unable to send your message. Please try again.");
      }

      setSubmissionState({
        status: "success",
        message: data?.message || "Thank you for sharing. I will be in touch shortly.",
      });
      toast.success(data?.message || "Thank you for sharing. I will be in touch shortly.", "Message sent");
      setFormValues(initialFormState);
    } catch (error) {
      const message = error?.message || "We were unable to send your message. Please try again.";
      setSubmissionState({ status: "error", message });
      toast.error(message);
    }
  };

  return (
    <section
      ref={contactRef}
      id="contact"
      className="relative overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] right-[10%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute -bottom-[5%] left-[5%] h-[400px] w-[400px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start">
          
          {/* Left Column: Intro & Interactive Map */}
          <div className="lg:w-[55%]" data-gsap-reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-300/[0.03] to-transparent pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-teal-300/20 bg-teal-300/5 mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
                    {contactSection?.eyebrow || "Contact"}
                  </p>
                </div>

                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-8 leading-[1.1]">
                  {contactSection?.heading}
                </h2>
                
                <RichTextContent 
                  value={contactSection?.description} 
                  className="text-lg leading-relaxed text-white/50 max-w-xl font-medium mb-10" 
                />

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold text-white/30 mb-12">
                  {contactMethods.map((method, index) => (
                    <div key={method.label} className="flex items-center gap-8">
                      <a
                        href={method.href}
                        className="transition-colors hover:text-teal-300 flex items-center gap-2"
                        target={method.href.startsWith("http") ? "_blank" : "_self"}
                        rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-300/40" />
                        {method.value}
                      </a>
                    </div>
                  ))}
                </div>

                {/* Localized Presence Map */}
                <div className="relative min-h-[380px] rounded-[2rem] border border-teal-300/10 bg-black/40 overflow-hidden shadow-inner group">
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                    <div className="rounded-full border border-teal-300/30 bg-gray-950/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                      Current Presence
                    </div>
                    <div className="relative mt-4 h-16 w-px mx-auto bg-gradient-to-b from-transparent via-teal-300 to-transparent">
                      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                    </div>
                  </div>
                  
                  <img
                    src={worldMap}
                    alt="presence map"
                    className="absolute inset-0 w-full h-full object-contain opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:flex-1" data-gsap-reveal delay="0.2">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
              <h3 className="text-2xl font-bold text-white mb-3">
                {contactSection?.formHeading || "Share your intentions"}
              </h3>
              <RichTextContent 
                value={contactSection?.formDescription || "This form lands directly in my inbox."} 
                className="text-sm leading-relaxed text-white/40 mb-10 font-medium" 
              />

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Name</label>
                  <Input
                    type="text"
                    name="name"
                    required
                    value={formValues.name}
                    onChange={handleChange}
                    className="h-12 border-white/5 bg-white/[0.03] rounded-xl focus-visible:border-teal-300 focus-visible:ring-teal-300/10 transition-all"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Email</label>
                  <Input
                    type="email"
                    name="email"
                    required
                    value={formValues.email}
                    onChange={handleChange}
                    className="h-12 border-white/5 bg-white/[0.03] rounded-xl focus-visible:border-teal-300 focus-visible:ring-teal-300/10 transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Desired Support</label>
                  {isLoading ? (
                    <Skeleton className="h-12 w-full rounded-xl" />
                  ) : (
                    <select
                      name="support"
                      required
                      value={formValues.support}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 text-sm text-white/70 outline-none transition-all focus:border-teal-300 focus:ring-1 focus:ring-teal-300/10 appearance-none"
                    >
                      <option value="" disabled className="bg-[#0a0a0a]">Select your path</option>
                      {supportOptions.map((option, index) => (
                        <option key={`${option}-${index}`} value={option} className="bg-[#0a0a0a]">{option}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Message</label>
                  <Textarea
                    name="message"
                    rows={4}
                    required
                    value={formValues.message}
                    onChange={handleChange}
                    className="border-white/5 bg-white/[0.03] rounded-2xl focus-visible:border-teal-300 focus-visible:ring-teal-300/10 transition-all"
                    placeholder="Tell me about the future you are calling in."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submissionState.status === "submitting"}
                  className="w-full h-14 rounded-2xl bg-teal-300 text-black font-bold text-sm uppercase tracking-widest transition-all hover:bg-teal-200 hover:-translate-y-0.5 active:scale-95 disabled:bg-white/10 disabled:text-white/30 disabled:translate-y-0"
                >
                  {submissionState.status === "submitting" ? "Sending..." : contactSection?.formSubmitLabel || "Send message"}
                </button>
              </form>

              {submissionState.message && (
                <div className={`mt-6 p-4 rounded-xl text-center text-xs font-bold uppercase tracking-wider ${
                  submissionState.status === 'success' ? 'bg-teal-300/10 text-teal-300' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {submissionState.message}
                </div>
              )}

              <RichTextContent 
                value={contactSection?.formDisclaimer} 
                className="mt-8 text-[11px] text-white/20 text-center leading-relaxed" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
