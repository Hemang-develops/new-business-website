const Newsletter = () => {
  return (
    <section id="newsletter" className="relative bg-gray-950 py-12 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/10 to-purple-500/30" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
          The Frequency Drop
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Stay plugged into the vortex.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
            Receive monthly energy reports, journal prompts, and VIP offers.
          </p>
          <form
            className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
            action="https://formspree.io/f/xovqwaaw"
            method="POST"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
              className="w-full flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm text-white placeholder:text-white/60 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              type="submit"
              className="w-full rounded-full border-2 border-brand-primary-light bg-brand-primary px-7 py-3 text-sm font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 sm:w-auto"
            >
              Join now
            </button>
          </form>
          <p className="mt-3 text-xs text-white/50">No spam. Just potent reminders.</p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
