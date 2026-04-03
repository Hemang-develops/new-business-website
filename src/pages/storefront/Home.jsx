import { useEffect, useMemo, useState } from 'react';
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
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getBrowserRegion, getCountries, getUsdRates } from '../../services/marketData';

export function Home() {
  useSmoothScroll();
  const location = useLocation();
  const { settings } = useSiteSettings();
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
    () => settings.sections.filter((section) => section.enabled && sectionComponents[section.id]),
    [sectionComponents, settings.sections],
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

  if (settings.isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
        <Navigation />
        <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-black/50 p-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-primary-light" />
            <p className="text-white/80">Loading site content...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      <main className="relative z-10">
        {enabledSections.map((section) => (
          <div key={section.id}>{sectionComponents[section.id]}</div>
        ))}
      </main>
      <Footer />
    </div>
  );
}
