import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { defaultSiteSettings } from "../../services/siteSettings";
import { useGsapPulse } from "../../hooks/useGsapMotion";

const loadingMessages = [
  "Aligning your next reality",
  "Preparing the next frequency",
  "Gathering the latest live content",
];

const SiteLoadingScreen = ({
  eyebrow = "High Frequencies 11",
  title = "Loading the live experience",
  description = "The latest content is loading now so you see the current website, not stale copy.",
}) => {
  const loadingRef = useRef(null);

  useGsapPulse(loadingRef);

  useGSAP(
    () => {
      const root = loadingRef.current;
      if (!root) return;

      const waves = gsap.utils.toArray(root.querySelectorAll("[data-gsap-wave]"));

      waves.forEach((wave, index) => {
        const shapes = [
          wave.getAttribute("d"),
          wave.dataset.waveAlt,
          wave.getAttribute("d"),
        ].filter(Boolean);

        gsap.to(wave, {
          attr: { d: shapes[1] },
          duration: 1.4 + index * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { dependencies: [] },
  );

  return (
    <div 
      ref={loadingRef} 
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, var(--site-brand-dark, #030406) 0%, #080a0f 100%)`,
      }}
    >
      {/* Dynamic Background Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] mix-blend-overlay" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl">
          <div className="mx-auto overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="grid gap-12 px-8 py-10 md:grid-cols-[1.15fr,0.85fr] md:px-12 md:py-12">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full border border-teal-300/20 bg-teal-300/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
                  </span>
                  {eyebrow || defaultSiteSettings.brand.fullTitle}
                </div>

                <div className="space-y-6">
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-white/40 font-medium">
                    {description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {loadingMessages.map((message) => (
                    <div
                      key={message}
                      className="rounded-full border border-white/5 bg-white/[0.02] px-5 py-2 text-xs font-bold uppercase tracking-widest text-white/30"
                    >
                      {message}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-[16rem] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-black/40 shadow-inner">
                  <div className="absolute inset-x-0 top-1/2 h-36 -translate-y-1/2 bg-teal-400/5 blur-3xl" />
                  
                  <div className="relative h-36 w-full overflow-hidden" aria-label="Loading frequencies">
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/5" />
                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 160 52"
                      fill="none"
                      role="img"
                      aria-hidden="true"
                      preserveAspectRatio="none"
                    >
                      <path
                        data-gsap-wave
                        d="M0 27 C10 14 18 38 28 25 C39 9 46 45 58 25 C68 5 75 48 86 26 C99 1 107 50 120 26 C132 9 141 38 160 23"
                        data-wave-alt="M0 24 C10 38 18 13 30 27 C40 46 48 5 60 26 C72 49 80 5 91 27 C103 44 112 9 124 26 C137 41 146 15 160 28"
                        stroke="rgba(45, 212, 191, 0.1)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <path
                        data-gsap-wave
                        d="M0 26 C12 18 18 34 29 25 C39 14 45 39 56 25 C66 12 73 40 84 26 C96 13 104 38 115 25 C129 15 139 35 160 24"
                        data-wave-alt="M0 24 C12 36 20 14 31 27 C42 42 49 9 60 26 C72 43 79 10 90 26 C103 39 111 13 124 26 C137 37 145 17 160 29"
                        stroke="var(--site-brand-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        data-gsap-wave
                        d="M0 27 C9 32 15 21 24 26 C34 33 40 18 50 25 C60 34 67 17 78 26 C89 34 96 18 106 25 C118 33 127 20 138 26 C148 31 154 22 160 25"
                        data-wave-alt="M0 25 C9 18 16 34 26 26 C36 18 42 34 53 25 C64 17 71 35 82 26 C93 18 100 34 111 25 C123 19 132 34 142 26 C151 20 156 32 160 26"
                        stroke="var(--site-brand-secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SiteLoadingScreen;
