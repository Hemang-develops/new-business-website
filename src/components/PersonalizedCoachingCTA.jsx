import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBrowserRegion, getCountries, getUsdRates } from "../services/marketData";
import { roundUpAestheticAmount } from "../services/pricing";

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];

const benefits = [
  "Personalised Coaching with me for 30 days",
  "5 calls with me",
  "Unlimited emails or DMs",
  "4 personalized meditations/ rampages",
  "Support for self-concept, mastery, luck, beauty, money, love, and dissolving every block",
  "Manifestation techniques tailored to you including portal visualisations, EFT, and parts work",
  "Daily Affirmations",
  "Guided meditations",
  "30 days of consistent energetic accountability",
];

const quickLinks = [
  {
    title: "For energy readings",
    description: "Explore tarot and energetic guidance tailored to your manifestations.",
    href: "#programs",
  },
  {
    title: "For free manifestation content",
    description: "Access meditations, affirmations, and resources to stay anchored in your desired timeline.",
    href: "#resources",
  },
];

const PersonalizedCoachingCTA = () => {
  const midpoint = Math.ceil(benefits.length / 2);
  const benefitColumns = [benefits.slice(0, midpoint), benefits.slice(midpoint)];
  const baseUsdAmount = 1111;
  const browserRegion = useMemo(() => getBrowserRegion(), []);
  const [countryCurrencyCode, setCountryCurrencyCode] = useState("USD");
  const [usdRates, setUsdRates] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadCountryCurrency = async () => {
      const countries = (await getCountries()) || fallbackCountryData;
      if (!isMounted || !countries?.length) {
        return;
      }
      const detected = countries.find((entry) => entry.code === browserRegion);
      const code = detected?.currencies?.[0] || "USD";
      setCountryCurrencyCode(String(code).toUpperCase());
    };
    loadCountryCurrency();
    return () => {
      isMounted = false;
    };
  }, [browserRegion]);

  useEffect(() => {
    let isMounted = true;
    const loadRates = async () => {
      const rates = await getUsdRates();
      if (isMounted && rates) {
        setUsdRates(rates);
      }
    };
    loadRates();
    return () => {
      isMounted = false;
    };
  }, []);

  const localInvestmentLabel = useMemo(() => {
    const currencyCode = countryCurrencyCode || "USD";
    if (currencyCode === "USD") {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(baseUsdAmount);
    }
    const rate = usdRates?.[currencyCode];
    if (!rate) {
      return null;
    }
    const converted = roundUpAestheticAmount(baseUsdAmount * rate, currencyCode);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(converted);
  }, [baseUsdAmount, countryCurrencyCode, usdRates]);

  const usdInvestmentLabel = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(baseUsdAmount),
    [baseUsdAmount],
  );

  return (
    <section
      id="coaching"
      className="relative min-h-[calc(100vh-4rem)] pt-16 overflow-hidden bg-gradient-to-br from-purple-900/30 via-gray-950 to-black py-4 lg:py-8 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),transparent_65%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-pink-200">
              Click down below for personalised one-on-one coaching
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">Personalised Coaching with me for 30 days</h2>
            <p className="text-lg text-white/75">
              This immersive container helps you become your higher/divine self with tailored manifestation practices, daily
              regulation rituals, and unwavering energetic support.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-pink-200">Investment</p>
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-4xl font-bold">{localInvestmentLabel || usdInvestmentLabel}</p>
            </div>
            <p className="mt-4 text-sm text-white/70">30 days • private Voxer/email support • personalised meditations</p>
            <Link
              to="/buy/become-a-new-you"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border-2 border-pink-200/90 bg-pink-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-white shadow-xl shadow-pink-500/45 transition-all hover:-translate-y-0.5 hover:border-white hover:bg-pink-400 hover:shadow-pink-400/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Become a new you here
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-pink-500/10">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-pink-200">What&apos;s included</p>
              <h3 className="mt-4 text-2xl font-semibold">Become a new you coaching immersion</h3>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {benefitColumns.map((column, columnIndex) => (
                  <ul key={columnIndex} className="space-y-4 text-white/80">
                    {column.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-200">Have questions?</p>
              <p className="mt-3 text-base text-white/75">
                Email:
                <a className="ml-2 text-white underline" href="mailto:highfrequencies11@gmail.com">
                  highfrequencies11@gmail.com
                </a>
              </p>
              <a
                href="mailto:highfrequencies11@gmail.com?subject=Personalised%20Coaching%20Inquiry"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-pink-300 hover:text-pink-200"
              >
                Email me here
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedCoachingCTA;
