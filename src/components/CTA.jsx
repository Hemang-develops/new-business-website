const CTA = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-gradient-to-r from-brand-secondary via-brand-secondary to-brand-primary text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h2 className="text-4xl font-bold sm:text-5xl">Your next quantum leap is one decision away.</h2>
        <p className="max-w-3xl text-lg text-white/80">
          When you say yes to yourself, the universe reschedules everything in your favor. Let's co-create the
          timeline where your desires are the new normal.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:highfrequencies11@gmail.com?subject=I%27m%20ready%20to%20work%20with%20Nehal"
            className="rounded-full bg-light px-8 py-3 text-base font-semibold text-brand-dark shadow-lg shadow-white/40 transition-transform duration-300 hover:-translate-y-1"
          >
            Start a conversation
          </a>
          <a
            href="#programs"
            className="rounded-full border border-white/40 px-8 py-3 text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-1 hover:border-white"
          >
            View offerings
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
