import Navigation from '../../components/Navigation';
import Footer from '../../components/common/Footer';
import { useEffect, useState } from 'react';

export function ErrorPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-fixed bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-fixed bg-gradient-to-br from-indigo-900/40 via-gray-950 to-black mix-blend-screen" />

      <Navigation />

      <main className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Animated Content */}
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-brand-primary-light via-brand-secondary to-brand-accent bg-clip-text text-transparent sm:text-9xl">
                404
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-12 space-y-6">
              <h2 className="text-3xl font-bold sm:text-4xl">Page Not Found</h2>
              <p className="mx-auto max-w-2xl text-lg text-white/70 leading-relaxed">
                The page you're looking for seems to have wandered off into the quantum field.
                Don't worry, even in the multiverse of possibilities, we can guide you back home.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-brand-primary-light bg-brand-primary px-8 py-3 text-base font-semibold text-brand-dark shadow-xl shadow-brand-primary/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-brand-primary-light hover:shadow-brand-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                Return Home
              </a>
              {/* <a
                href="#contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/5 px-8 py-3 text-base font-semibold text-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary-light hover:bg-white/10 hover:text-brand-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                Contact Support
              </a> */}
            </div>

            {/* Decorative Elements */}
            <div className="mt-16 flex justify-center">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-brand-primary-light animate-pulse" style={{ animationDelay: '0s' }}></div>
                <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}