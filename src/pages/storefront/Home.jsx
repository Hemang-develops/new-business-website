import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation } from 'react-router-dom';
import About from '../../components/About';
import Contact from '../../components/Contact';
import Navigation from '../../components/Navigation';
import Newsletter from '../../components/Newsletter';
import PersonalizedCoachingCTA from '../../components/PersonalizedCoachingCTA';
import Programs from '../../components/Programs';
import Resources from '../../components/Resources';
import Services from '../../components/Services';
import Testimonials from '../../components/Testimonials';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import Footer from '../../components/common/Footer';
import Hero from '../../components/storefront/Hero';
import SiteLoadingScreen from '../../components/storefront/SiteLoadingScreen';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useGsapReveal } from '../../hooks/useGsapMotion';
import { getBrowserRegion, getCountries, getUsdRates } from '../../services/marketData';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HomeExperience = ({ enabledSections, sectionComponents }) => {
  const location = useLocation();
  const pageRef = useRef(null);

  useGsapReveal(pageRef, [enabledSections.length], "[data-home-section-reveal]");

  useGSAP(
    () => {
      const page = pageRef.current;
      if (!page) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        gsap.set(page.querySelectorAll("[data-parallax-layer], [data-parallax-content], [data-parallax-media], [data-home-ambient]"), {
          clearProps: "transform",
        });
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px)",
          mobile: "(max-width: 1023px)",
        },
        (context) => {
          const distance = context.conditions.desktop ? 1 : 0.55;

          gsap.set(page.querySelectorAll("[data-parallax-layer], [data-parallax-content], [data-parallax-media]"), {
            force3D: true,
            willChange: "transform",
          });

          gsap.to(page.querySelectorAll("[data-home-ambient]"), {
            y: (index) => (index % 2 === 0 ? 140 : -120) * distance,
            ease: "none",
            scrollTrigger: {
              trigger: page,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.2,
            },
          });

          gsap.utils.toArray(page.querySelectorAll("[data-home-parallax-section]")).forEach((section) => {
            const layers = section.querySelectorAll("[data-parallax-layer]");
            const content = section.querySelectorAll("[data-parallax-content]");
            const media = section.querySelectorAll("[data-parallax-media]");

            layers.forEach((layer) => {
              const depth = Number(layer.dataset.parallaxDepth || 1);
              gsap.fromTo(
                layer,
                { y: -90 * depth * distance, scale: 1.12 },
                {
                  y: 110 * depth * distance,
                  scale: 1.03,
                  ease: "none",
                  scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.9,
                  },
                },
              );
            });

            content.forEach((element) => {
              const depth = Number(element.dataset.parallaxDepth || 0.45);
              gsap.fromTo(
                element,
                { y: 46 * depth * distance },
                {
                  y: -74 * depth * distance,
                  ease: "none",
                  scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                  },
                },
              );
            });

            media.forEach((element) => {
              const depth = Number(element.dataset.parallaxDepth || 0.8);
              gsap.fromTo(
                element,
                { y: 72 * depth * distance, rotate: -0.45 },
                {
                  y: -112 * depth * distance,
                  rotate: 0.45,
                  ease: "none",
                  scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                  },
                },
              );
            });
          });

          ScrollTrigger.refresh();
        },
      );

      return () => mm.revert();
    },
    { dependencies: [enabledSections.length] },
  );

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => {
          const nav = document.querySelector('nav');
          const navHeight = nav ? nav.offsetHeight : 64;
          const y = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 200);
      }
    }
  }, [location]);

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div
        data-home-ambient
        className="pointer-events-none fixed left-[-8rem] top-[18vh] z-0 h-80 w-80 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        data-home-ambient
        className="pointer-events-none fixed bottom-[8vh] right-[-10rem] z-0 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <Navigation />
      <main className="relative z-10">
        {enabledSections.map((section, index) => (
          <div
            key={section.id}
            className="relative overflow-hidden"
            data-home-parallax-section
            data-home-section-reveal={index === 0 ? undefined : true}
          >
            {sectionComponents[section.id]}
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export function Home() {
  // useSmoothScroll();
  const { settings, isLoading, error } = useSiteSettings();
  const [localRateLabel, setLocalRateLabel] = useState("");
  const browserRegion = useMemo(() => getBrowserRegion(), []);
  const sectionComponents = useMemo(
    () => ({
      hero: <Hero />,
      about: <About />,
      programs: <Programs />,
      services: <Services />,
      testimonials: <Testimonials />,
      resources: <Resources />,
      coaching: <PersonalizedCoachingCTA />,
      contact: <Contact />,
      newsletter: <Newsletter />,
    }),
    [],
  );
  const enabledSections = useMemo(
    () => (settings?.sections || []).filter((section) => section.enabled && sectionComponents[section.id]),
    [sectionComponents, settings?.sections],
  );

  useEffect(() => {
    let isMounted = true;
    const preloadMarketData = async () => {
      const [countries, rates] = await Promise.all([getCountries(), getUsdRates()]);
      if (!isMounted || !countries?.length || !rates || !browserRegion) {
        return;
      }
      const matchedCountry = countries.find((entry) => entry.code === browserRegion);
      const currencyCode = matchedCountry?.currencies?.[0];
      if (!currencyCode || currencyCode === "USD") {
        setLocalRateLabel("1 USD = 1 USD");
        return;
      }
      const rate = rates[currencyCode];
      if (!rate) {
        return;
      }
      const formatted = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 4,
      }).format(rate);
      setLocalRateLabel(`1 USD = ${formatted} ${currencyCode}`);
    };
    preloadMarketData();
    return () => {
      isMounted = false;
    };
  }, [browserRegion]);

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
        <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-black/50 p-8 text-center">
            <h1 className="text-3xl font-semibold text-white">Unable to load site content</h1>
            <p className="mt-4 text-base leading-relaxed text-white/65">
              The latest website data could not be loaded, so the page has been paused instead of showing outdated content.
            </p>
            <p className="mt-6 text-sm text-rose-200/80">{error.message || "Please try refreshing the page."}</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading || !settings) {
    return <SiteLoadingScreen title="Entering the vortex" description="Take a breath while the experience settles into place." />;
  }

  return <HomeExperience enabledSections={enabledSections} sectionComponents={sectionComponents} />;
}
