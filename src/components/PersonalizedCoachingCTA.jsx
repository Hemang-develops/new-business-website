import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useGsapHover, useGsapReveal } from "../hooks/useGsapMotion";
import { getBrowserRegion, getCountries, getUsdRates } from "../services/marketData";
import { roundUpAestheticAmount } from "../services/pricing";
import { useOfferingsData } from "../hooks/useOfferingsData";
import RichTextContent from "./ui/RichTextContent";

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];

const PersonalizedCoachingCTA = () => {
  const coachingRef = useRef(null);
  const { getSection, getSectionItems, settings } = useSiteSettings();
  const { offeringsIndex } = useOfferingsData();
  const coachingSection = getSection("coaching");
  const coachingBenefits = getSectionItems("coaching");
  const featuredOffering = coachingSection?.featuredOfferingId
    ? offeringsIndex?.[coachingSection.featuredOfferingId]
    : null;
  const midpoint = Math.ceil(coachingBenefits.length / 2);
  const benefitColumns = [coachingBenefits.slice(0, midpoint), coachingBenefits.slice(midpoint)];
  const baseUsdAmount = Number(featuredOffering?.price?.usd || 1111);
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

  const coachingHref = coachingSection?.featuredOfferingId
    ? `/buy/${coachingSection.featuredOfferingId}`
    : coachingSection?.primaryCtaHref || "#programs";

  useGsapReveal(coachingRef, [coachingBenefits.length, featuredOffering?.id]);
  useGsapHover(coachingRef, "[data-gsap-hover]", [featuredOffering?.id]);

  return (
    <section
      ref={coachingRef}
      id="coaching"
      className="relative min-h-screen overflow-hidden py-20 lg:py-24"
      style={{
        background: `linear-gradient(to bottom, var(--site-brand-dark, #030406), #0a0a0a)`,
      }}
    >
      {/* Dynamic Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-[10%] right-[10%] h-[700px] w-[700px] rounded-full blur-[150px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-primary)' }}
        />
        <div 
          className="absolute -bottom-[10%] left-[10%] h-[600px] w-[600px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: 'var(--site-brand-secondary)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-6" data-gsap-reveal>


            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl leading-[1.1]">
              {coachingSection?.heading}
            </h2>
            
            <RichTextContent 
              value={coachingSection?.description} 
              className="text-lg leading-relaxed text-white/50 font-medium" 
            />
          </div>

          {/* Investment Card */}
          <div className="w-full max-w-sm rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-12 backdrop-blur-2xl shadow-2xl overflow-hidden group" data-gsap-reveal>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-300/[0.03] to-transparent pointer-events-none" />
            
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-4">
                {coachingSection?.supportingEyebrow || "Investment"}
              </p>
              
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-5xl font-bold text-white tracking-tight">
                  {localInvestmentLabel || usdInvestmentLabel}
                </p>
              </div>

              <RichTextContent
                value={coachingSection?.supportingDescription || "<p>30 days • private Voxer/email support • personalised meditations</p>"}
                className="mt-8 text-sm leading-relaxed text-white/40 font-medium"
              />

              <Link
                to={coachingHref}
                data-gsap-hover
                className="mt-10 inline-flex w-full h-14 items-center justify-center rounded-2xl bg-teal-300 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-teal-200 hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_rgba(45,212,191,0.2)]"
              >
                {coachingSection?.primaryCtaLabel || "Become a new you"}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-[1.6fr,1fr]">
          {/* Benefits Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-16 shadow-2xl backdrop-blur-xl" data-gsap-reveal>
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-8">What&apos;s included</p>
              <h3 className="text-3xl font-bold text-white mb-12">
                {featuredOffering?.title || "Personalised Coaching Immersion"}
              </h3>
              
              <div className="grid gap-12 md:grid-cols-2">
                {benefitColumns.map((column, columnIndex) => (
                  <ul key={columnIndex} className="space-y-6">
                    {column.map((item) => (
                      <li key={item.key} className="flex items-start gap-4">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                        <span className="text-base font-medium text-white/60 leading-relaxed">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-12 text-center backdrop-blur-xl shadow-2xl" data-gsap-reveal>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-6">Inquiry</p>
              <p className="text-lg font-medium text-white/60 mb-8 leading-relaxed">
                Have questions about this immersion? Reach out directly.
              </p>
              <div className="space-y-6">
                <a 
                  href={`mailto:${settings.brand.supportEmail}`}
                  className="block text-xl font-bold text-white hover:text-teal-300 transition-colors"
                >
                  {settings.brand.supportEmail}
                </a>
                <a
                  href={`mailto:${settings.brand.supportEmail}?subject=Personalised%20Coaching%20Inquiry`}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95"
                >
                  Send Inquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedCoachingCTA;
