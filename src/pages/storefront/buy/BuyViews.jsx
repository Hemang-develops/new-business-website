import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { buySections, offeringsIndex } from "../../../data/offerings";
import { useSmoothScroll } from "../../../hooks/useSmoothScroll";
import { getBrowserRegion, getCountries, getUsdRates } from "../../../services/marketData";
import { formatAmountFromMajor, getRoundedLocalizedUsdAmount } from "../../../services/pricing";
import PaymentSection from "./PaymentSection";

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];

const CheckoutStatusBanner = ({ status, itemTitle }) => {
  if (!status) {
    return null;
  }

  const normalized = status.toLowerCase();
  if (normalized !== "success" && normalized !== "cancel") {
    return null;
  }

  const isSuccess = normalized === "success";
  const title = isSuccess ? "Payment confirmed" : "Checkout cancelled";
  const description = isSuccess
    ? `Your order for ${itemTitle} is confirmed. Check your inbox for the download or welcome email - if it's missing, reply to this message and we'll resend it manually.`
    : "You left the Stripe checkout flow early. You can relaunch it above or email us to request an alternate payment option.";

  return (
    <div
      className={`rounded-3xl border p-6 text-sm leading-relaxed shadow-inner backdrop-blur ${
        isSuccess
          ? "border-teal-300/60 bg-teal-300/10 text-teal-50"
          : "border-amber-300/60 bg-amber-300/10 text-amber-100"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em]">{title}</p>
      <p className="mt-3">{description}</p>
    </div>
  );
};

const DetailSection = ({ detailsSections, closingNotes }) => {
  if (!detailsSections?.length && !closingNotes?.length) {
    return null;
  }

  return (
    <section className="space-y-8">
      {detailsSections?.map((section) => (
        <div key={section.heading} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">{section.heading}</h3>
          {section.description && <p className="text-base leading-relaxed text-white/75">{section.description}</p>}
          {section.items && (
            <ul className="space-y-3 text-sm leading-relaxed text-white/70">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-teal-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {closingNotes?.length ? (
        <div className="space-y-3 rounded-3xl border border-teal-300/30 bg-teal-300/10 p-8 text-sm text-white/80">
          {closingNotes.map((note) => (
            <p key={note} className="leading-relaxed">
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
};

const OfferHighlights = ({ item }) => {
  if (!item.highlights?.length) {
    return null;
  }

  return (
    <ul className="space-y-3 text-sm leading-relaxed text-white/75">
      {item.highlights.map((highlight) => (
        <li key={highlight} className="flex items-center gap-3">
          <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-teal-300" />
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
  );
};

const SuccessStory = ({ successStory }) => {
  if (!successStory) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200/80">{successStory.heading}</p>
      <p className="text-lg leading-relaxed text-white/90">"{successStory.quote}"</p>
      {successStory.author ? <p className="text-sm font-semibold text-white/60">{successStory.author}</p> : null}
    </div>
  );
};

const OfferCard = ({ item, displayPriceLabel }) => (
  <article className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur transition hover:border-teal-300 hover:shadow-teal-500/20 sm:p-8">
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
          {item.subtitle && (
            <p className="mt-1 text-sm font-medium uppercase tracking-[0.3em] text-teal-200/80">{item.subtitle}</p>
          )}
        </div>
        {(displayPriceLabel || item.priceLabel || item.price) && (
          <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80">
            {displayPriceLabel || item.priceLabel || `$${item.price.usd} / ?${item.price.inr}`}
          </span>
        )}
      </div>
      <p className="text-base text-white/80">{item.summary}</p>
      <OfferHighlights item={item} />
    </div>

    <div className="mt-6">
      <Link
        to={`/buy/${item.id}`}
        className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
      >
        {item.ctaLabel || "Explore offering"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
);

export const BuyListView = () => {
  useSmoothScroll();
  const browserRegion = useMemo(() => getBrowserRegion(), []);
  const [localCurrency, setLocalCurrency] = useState("USD");
  const [usdRates, setUsdRates] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadLocaleCurrency = async () => {
      const countries = (await getCountries()) || fallbackCountryData;
      if (!isMounted || !countries?.length || !browserRegion) {
        return;
      }
      const detected = countries.find((entry) => entry.code === browserRegion);
      const currencyCode = detected?.currencies?.[0];
      if (currencyCode) {
        setLocalCurrency(currencyCode.toUpperCase());
      }
    };
    loadLocaleCurrency();
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
  return (
    <main className="relative z-10">
      <section
        id="hero"
        className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-black px-6 py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.25),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            High Frequencies 11 shop
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Choose the portal that matches the future you've already claimed.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            Every offering below delivers the exact energy, affirmations, and strategy you requested. Follow your intuition, click through for details, and I will deliver everything straight to your inbox within 24 hours.
          </p>
        </div>
      </section>

      {buySections.map((section) => (
        <section key={section.id} id={section.id} className="bg-gray-950 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">{section.title}</p>
              <p className="mt-4 text-lg text-white/70">{section.description}</p>
            </div>
            <div className="mt-12 flex flex-col gap-10">
              {section.items.map((item) => {
                const usdPrice = Number(String(item.price?.usd || "").replace(/,/g, ""));
                let displayPriceLabel = item.priceLabel || "";
                if (Number.isFinite(usdPrice)) {
                  const roundedLocal = getRoundedLocalizedUsdAmount(usdPrice, localCurrency, usdRates);
                  if (Number.isFinite(roundedLocal)) {
                    displayPriceLabel = formatAmountFromMajor(roundedLocal, localCurrency);
                  }
                }
                return <OfferCard key={item.id} item={item} displayPriceLabel={displayPriceLabel} />;
              })}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
};

export const BuyDetailView = ({ item, checkoutStatus }) => {
  const navigate = useNavigate();
  const { section } = offeringsIndex[item.id];
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <main className="relative z-10">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-black px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.32),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-teal-300 hover:text-teal-200"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/80">
            {section?.title}
          </span>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{item.title}</h1>
          <p className="max-w-3xl text-lg text-white/75">{item.longDescription || item.summary}</p>
          <OfferHighlights item={item} />
        </div>
      </section>

      <section className="bg-gray-950 px-6 pb-24 pt-12">
        <div className="mx-auto max-w-5xl space-y-10">
          {checkoutStatus ? <CheckoutStatusBanner status={checkoutStatus} itemTitle={item.title} /> : null}
          <div className="flex flex-col gap-10">
            <div className="space-y-8 lg:flex-1">
              <SuccessStory successStory={item.successStory} />
              <DetailSection detailsSections={item.detailsSections} closingNotes={item.closingNotes} />
              {item.purchase && (
                <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80">
                  <h3 className="text-lg font-semibold text-white">Need help accessing your files?</h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    If the automated download doesn't land in your inbox within a few minutes, tap the button below and we'll resend it manually.
                  </p>
                  <a
                    href={item.purchase.link}
                    className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
                  >
                    {item.purchase.label}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            <div className="lg:flex-[1.1]">
              <PaymentSection item={item} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export const UnknownProduct = () => (
  <main className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center bg-gray-950 px-6 py-24 text-center text-white">
    <h1 className="text-4xl font-bold">Offering not found</h1>
    <p className="mt-4 max-w-xl text-base text-white/70">
      The link you followed is no longer available. Explore the shop to choose a container or ritual that aligns with your current season.
    </p>
    <Link
      to="/buy"
      className="mt-8 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-6 py-3 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
    >
      Return to shop
      <ArrowRight className="h-4 w-4" />
    </Link>
  </main>
);
