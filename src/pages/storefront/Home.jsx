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
import { getBrowserRegion, getCountries, getUsdRates } from '../../services/marketData';

export function Home() {
  useSmoothScroll();
  const location = useLocation();
  const [localRateLabel, setLocalRateLabel] = useState("");
  const browserRegion = useMemo(() => getBrowserRegion(), []);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      <main className="relative z-10">
        <Hero />
        <About />
        <Programs />
        <Services />
        <Testimonials />
        <Resources />
        <PersonalizedCoachingCTA />
        <Contact />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
