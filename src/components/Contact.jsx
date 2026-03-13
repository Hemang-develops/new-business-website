import { useState } from "react";

import worldMap from "../assets/world.svg";
import { useToast } from "../context/ToastContext";
import { useOfferingsData } from "../hooks/useOfferingsData";

const initialFormState = {
  name: "",
  email: "",
  support: "",
  message: "",
};

const Contact = () => {
  const { offeringSupportOptions } = useOfferingsData();
  const toast = useToast();
  const [formValues, setFormValues] = useState(initialFormState);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });
  const contactMethods = [
    {
      label: "Email",
      value: "highfrequencies11@gmail.com",
      href: "mailto:highfrequencies11@gmail.com",
    },
    {
      label: "Instagram",
      value: "@highfrequencies11",
      href: "https://www.instagram.com/highfrequencies11/",
    },
    {
      label: "YouTube",
      value: "@nehalpatelishere",
      href: "https://www.youtube.com/@nehalpatelishere",
    },
  ];

  const supportOptions = [...(offeringSupportOptions || []), "Custom collaboration"];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmissionState({ status: "submitting", message: "" });

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      const message =
        error?.message ||
        "We were unable to send your message. Please double-check your details and try again.";
      setSubmissionState({
        status: "error",
        message,
      });
      toast.error(message);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-[#101827] to-gray-950 py-16 text-white md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%)]" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur md:px-10 md:py-12 lg:flex-[1.05]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_35%,transparent_65%,rgba(20,184,166,0.12))]" />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                <div className="flex h-full w-full items-center justify-center rounded-[0.9rem] bg-slate-950/70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-sky-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 7.535v9.465a3 3 0 0 1-2.824 2.995L19 20H5a3 3 0 0 1-2.995-2.824L2 17V7.535l9.445 6.297.116.066a1 1 0 0 0 .878 0l.116-.066L22 7.535Z"
                      fill="currentColor"
                      strokeWidth="0"
                    />
                    <path
                      d="M19 4c1.08 0 2.027.57 2.555 1.427L12 11.797 2.445 5.427A2.999 2.999 0 0 1 4.799 4L5 3.993h14Z"
                      fill="currentColor"
                      strokeWidth="0"
                    />
                  </svg>
                </div>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary">
                Connect
              </p>
              <h2 className="mt-4 max-w-xl bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                Ready to raise your frequency?
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
                Tell me about the reality you are stepping into and how you desire to be supported. I
                respond to all inquiries within 48 hours Monday through Friday.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/55">
                {contactMethods.map((method, index) => (
                  <div key={method.label} className="flex items-center gap-3">
                    <a
                      href={method.href}
                      className="transition-colors hover:text-brand-primary-light"
                      target={method.href.startsWith("http") ? "_blank" : "_self"}
                      rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {method.value}
                    </a>
                    {index < contactMethods.length - 1 && <span className="h-1 w-1 rounded-full bg-white/35" />}
                  </div>
                ))}
              </div>

              <div className="relative mt-12 flex min-h-[320px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-slate-950/60 to-slate-900/30 px-4 [perspective:1000px] sm:min-h-[380px]">
                <div className="pointer-events-none absolute left-1/2 top-8 z-20 flex -translate-x-1/2 flex-col items-center">
                  <div className="rounded-full border border-sky-400/30 bg-slate-950/90 px-4 py-1 text-xs font-medium text-white shadow-[0_0_30px_rgba(56,189,248,0.18)]">
                    Canada
                  </div>
                  <div className="relative mt-4 h-24 w-px bg-gradient-to-b from-sky-400/0 via-sky-400 to-sky-400/0">
                    <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
                  </div>
                </div>
                <div className="pointer-events-none absolute left-1/2 top-[38%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-2xl" />
                <div className="pointer-events-none absolute left-1/2 top-[62%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/15" />
                <img
                  src={worldMap}
                  alt="world map"
                  className="relative z-10 w-full max-w-[520px] opacity-90 [filter:drop-shadow(0_24px_40px_rgba(15,23,42,0.7))]"
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/95 to-slate-200 p-4 text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-8 lg:flex-[0.95]">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-position:center] [background-size:22px_22px]" />

            <div className="relative z-10">
              <h3 className="text-2xl font-semibold text-slate-950">Share your intentions</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                This form lands directly in my inbox. Share your story, desires, and what kind of
                support you are calling in.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 inline-block text-sm font-medium text-slate-600">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formValues.name}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-2 inline-block text-sm font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formValues.email}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-2 inline-block text-sm font-medium text-slate-600">Desired Support</label>
                  <select
                    name="support"
                    required
                    value={formValues.support}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="" disabled>
                      Select the offering you are interested in
                    </option>
                    {supportOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 inline-block text-sm font-medium text-slate-600">Message</label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    value={formValues.message}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Tell me about the future you are calling in."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submissionState.status === "submitting"}
                  aria-label={submissionState.status === "submitting" ? "Sending message" : "Send message"}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submissionState.status === "submitting" ? "Sending..." : "Send message"}
                </button>
              </form>

              <div className="mt-4 min-h-[1.5rem]" aria-live="polite">
                {submissionState.status === "success" && (
                  <p className="text-sm font-medium text-teal-700">{submissionState.message}</p>
                )}
                {submissionState.status === "error" && (
                  <p className="text-sm font-medium text-rose-600">{submissionState.message}</p>
                )}
              </div>

              <p className="mt-6 text-sm text-slate-500">
                By submitting this form you agree to receive occasional updates about High Frequencies
                11 offerings. You can opt out at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
