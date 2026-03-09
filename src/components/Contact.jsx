import { useState } from "react";

import { useOfferingsData } from "../hooks/useOfferingsData";

const initialFormState = {
  name: "",
  email: "",
  support: "",
  message: "",
};

const Contact = () => {
  const { offeringSupportOptions } = useOfferingsData();
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
      setFormValues(initialFormState);
    } catch (error) {
      setSubmissionState({
        status: "error",
        message:
          error?.message ||
          "We were unable to send your message. Please double-check your details and try again.",
      });
    }
  };

  return (
    <section id="contact" className="min-h-screen bg-gray-950 py-4 lg:py-8 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary">
            Connect
          </p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Ready to raise your frequency?</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/70">
            Tell me about the reality you are stepping into and how you desire to be supported.
            I respond to all inquiries within 48 hours Monday through Friday.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.92fr,1.08fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h3 className="text-xl font-semibold">Direct contact</h3>
            <p className="mt-4 text-white/70">
              Prefer to reach out directly? Use any of the channels below and share a few details about your
              vision so I can guide you to the right container.
            </p>
            <div className="mt-6 space-y-4">
              {contactMethods.map((method) => (
                <a
                  key={method.label}
                  href={method.href}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-left transition-colors hover:border-brand-primary hover:text-brand-primary-light"
                  target={method.href.startsWith("http") ? "_blank" : "_self"}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{method.label}</p>
                    <p className="text-base font-medium">{method.value}</p>
                  </div>
                  <span aria-hidden className="text-2xl">
                    →
                  </span>
                </a>
              ))}
            </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">For faster replies</p>
              <p className="mt-3 text-sm text-white/70">
                Include your preferred timeline, the challenge you want to solve, and the offering you are considering.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-10 text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100">
            <h3 className="text-xl font-semibold">Share your intentions</h3>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
              This form lands directly in my inbox. Share your story, desires, and what kind of support you are calling in.
            </p>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formValues.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-brand-primary focus:outline focus:outline-2 focus:outline-brand-primary-light focus:ring-2 focus:ring-brand-primary-light dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formValues.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-brand-primary focus:outline focus:outline-2 focus:outline-brand-primary-light focus:ring-2 focus:ring-brand-primary-light dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Desired Support</label>
                <select
                  name="support"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  required
                  value={formValues.support}
                  onChange={handleChange}
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
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  value={formValues.message}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-brand-primary focus:outline focus:outline-2 focus:outline-brand-primary-light focus:ring-2 focus:ring-brand-primary-light dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Tell me about the future you are calling in."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submissionState.status === "submitting"}
                aria-label={submissionState.status === "submitting" ? "Sending message" : "Send message"}
                className="w-full rounded-full border-2 border-brand-primary-light bg-brand-primary px-8 py-3 text-base font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:border-gray-600 disabled:bg-gray-700 disabled:text-white/70 disabled:shadow-none"
              >
                {submissionState.status === "submitting" ? "Sending..." : "Send message"}
              </button>
            </form>
            <div className="mt-4 min-h-[1.5rem]" aria-live="polite">
              {submissionState.status === "success" && (
                <p className="text-sm font-medium text-teal-500 dark:text-teal-300">{submissionState.message}</p>
              )}
              {submissionState.status === "error" && (
                <p className="text-sm font-medium text-rose-500 dark:text-rose-300">{submissionState.message}</p>
              )}
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              By submitting this form you agree to receive occasional updates about High Frequencies 11 offerings. You can opt out at any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
