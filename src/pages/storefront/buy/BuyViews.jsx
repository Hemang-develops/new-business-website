import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSmoothScroll } from "../../../hooks/useSmoothScroll";
import { getBrowserRegion, getCountries, getUsdRates } from "../../../services/marketData";
import { formatAmountFromMajor, getRoundedLocalizedUsdAmount } from "../../../services/pricing";
import PaymentSection from "./PaymentSection";
import HorizontalCard from "../../../components/common/HorizontalCard";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../supabase-client";
import { Skeleton } from "../../../components/ui/skeleton";

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];
const reviewsTable = import.meta.env.VITE_SUPABASE_REVIEWS_TABLE || "storefront_reviews";

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
      className={`rounded-3xl border p-6 text-sm leading-relaxed shadow-inner backdrop-blur ${isSuccess
        ? "border-teal-300/60 bg-teal-300/10 text-teal-50"
        : "border-amber-300/60 bg-amber-300/10 text-amber-100"
        }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em]">{title}</p>
      <p className="mt-3">{description}</p>
    </div>
  );
};

const DetailSection = ({ detailsSections }) => {
  if (!detailsSections?.length) {
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

const ReviewAvatar = ({ entry }) => {
  if (entry.imageUrl) {
    return (
      <img
        src={entry.imageUrl}
        alt={entry.imageAlt || entry.author || entry.heading || "Client review"}
        className="h-14 w-14 rounded-2xl object-cover"
        loading="lazy"
      />
    );
  }

  const initial = (entry.author || entry.heading || "R").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "R";
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-300/15 text-lg font-semibold text-teal-100">
      {initial}
    </div>
  );
};

const SuccessStory = ({ successStory, reviews }) => {
  const reviewItems = reviews?.length ? reviews : successStory ? [successStory] : [];
  if (!reviewItems.length) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-200/80">Client reviews</p>
        <h2 className="text-2xl font-semibold text-white">What clients are saying</h2>
      </div>
      {reviewItems.map((entry, index) => (
        <article
          key={`${entry.author || "review"}-${index}`}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-xl backdrop-blur sm:p-8"
        >
          <div className="flex items-start gap-4">
            <ReviewAvatar entry={entry} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">
                {entry.heading || "Client result"}
              </p>
              {entry.author ? <p className="mt-1 text-sm font-semibold text-white/70">{entry.author}</p> : null}
            </div>
          </div>
          <p className="mt-5 text-lg leading-relaxed text-white/90">"{entry.quote}"</p>
          {entry.imageUrl ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img
                src={entry.imageUrl}
                alt={entry.imageAlt || entry.author || entry.heading || "Client review"}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
};

const OfferCard = ({ item, displayPriceLabel }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(item.imageUrl) && !hasImageError;
  const normalizedUsdPrice = Number(String(item.price?.usd || "").replace(/,/g, ""));
  const hasDisplayAmount = Boolean(displayPriceLabel) || (Number.isFinite(normalizedUsdPrice) && normalizedUsdPrice > 0);

  return (
    <article className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur transition hover:border-teal-300 hover:shadow-teal-500/20 sm:p-8">
      <div className="space-y-4">
        {showImage ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <img
              src={item.imageUrl}
              alt={item.imageAlt || item.title}
              className="h-56 w-full object-cover transition duration-300 hover:scale-[1.02]"
              loading="lazy"
              onError={() => setHasImageError(true)}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
            {item.subtitle && (
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.3em] text-teal-200/80">{item.subtitle}</p>
            )}
          </div>
          {hasDisplayAmount && (
            <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80">
              {displayPriceLabel || (item.price?.usd ? `$${item.price.usd} USD` : "")}
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
};

const ReviewSubmissionForm = ({ itemId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [formValues, setFormValues] = useState({
    name: user?.name || "",
    heading: "",
    quote: "",
    imageUrl: "",
    imageAlt: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.name) {
      return;
    }
    setFormValues((previous) => ({
      ...previous,
      name: previous.name || user.name,
    }));
  }, [isAuthenticated, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.name.trim() || !formValues.quote.trim()) {
      toast.error("Add your name and review before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        placement: "buy",
        offering_id: itemId,
        heading: formValues.heading.trim() || "Client review",
        quote: formValues.quote.trim(),
        author: formValues.name.trim(),
        image_url: formValues.imageUrl.trim() || null,
        image_alt: formValues.imageAlt.trim() || null,
        sort_order: 999,
        is_active: false,
      };

      const { error } = await supabase.from(reviewsTable).insert(payload);
      if (error) {
        throw error;
      }

      toast.success("Your review was submitted and is now waiting for approval.", "Review received");
      setFormValues({
        name: isAuthenticated && user?.name ? user.name : "",
        heading: "",
        quote: "",
        imageUrl: "",
        imageAlt: "",
      });
    } catch (error) {
      toast.error(error?.message || "We could not submit your review right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-xl backdrop-blur sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-200/80">Leave a review</p>
        <h3 className="text-2xl font-semibold text-white">Share your experience</h3>
        <p className="text-sm leading-relaxed text-white/65">
          Your review helps future clients choose the right offering. New submissions are reviewed before they go live.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span className="font-semibold text-white">Your name</span>
            <Input
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className="border-white/10 bg-black/30 focus-visible:border-teal-300"
              placeholder="Your name"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span className="font-semibold text-white">Short heading</span>
            <Input
              name="heading"
              value={formValues.heading}
              onChange={handleChange}
              className="border-white/10 bg-black/30 focus-visible:border-teal-300"
              placeholder="What shifted for you"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm text-white/70">
          <span className="font-semibold text-white">Your review</span>
          <Textarea
            name="quote"
            value={formValues.quote}
            onChange={handleChange}
            rows={5}
            className="border-white/10 bg-black/30 focus-visible:border-teal-300"
            placeholder="Share your experience with this offering."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            <span className="font-semibold text-white">Review image URL</span>
            <Input
              name="imageUrl"
              value={formValues.imageUrl}
              onChange={handleChange}
              className="border-white/10 bg-black/30 focus-visible:border-teal-300"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span className="font-semibold text-white">Image alt text</span>
            <Input
              name="imageAlt"
              value={formValues.imageAlt}
              onChange={handleChange}
              className="border-white/10 bg-black/30 focus-visible:border-teal-300"
              placeholder="Describe the image"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </section>
  );
};

export const BuyListView = ({ buySections = [] }) => {
  useSmoothScroll();
  const browserRegion = useMemo(() => getBrowserRegion(), []);
  const [localCurrency, setLocalCurrency] = useState("USD");
  const [usdRates, setUsdRates] = useState(null);
  const activeSection = buySections.length === 1 ? buySections[0] : null;

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
            {activeSection ? "Offering type" : "High Frequencies 11 shop"}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            {activeSection
              ? activeSection.title
              : "Choose the portal that matches the future you've already claimed."}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            {activeSection
              ? activeSection.description
              : "Every offering below delivers the exact energy, affirmations, and strategy you requested. Follow your intuition, click through for details, and I will deliver everything straight to your inbox within 24 hours."}
          </p>
          {activeSection ? (
            <Link
              to="/#programs"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to offerings
            </Link>
          ) : null}
        </div>
      </section>

      {buySections.map((section) => (
        <section key={section.id} id={section.id} className="bg-gray-950 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">{section.title}</p>
              <p className="mt-4 text-lg text-white/70">{section.description}</p>
            </div>
            <div className={activeSection ? "mt-12 grid auto-rows-fr gap-8 md:grid-cols-2" : "mt-12 flex flex-col gap-10"}>
              {section.items.map((item) => {
                const usdPrice = Number(String(item.price?.usd || "").replace(/,/g, ""));
                let displayPriceLabel = "";
                if (Number.isFinite(usdPrice)) {
                  const roundedLocal = getRoundedLocalizedUsdAmount(usdPrice, localCurrency, usdRates);
                  if (Number.isFinite(roundedLocal)) {
                    displayPriceLabel = formatAmountFromMajor(roundedLocal, localCurrency);
                  }
                }
                if (activeSection) {
                  return (
                    <div key={item.id} className="h-full">
                      <HorizontalCard
                        image={item.imageUrl || ""}
                        imageAlt={item.imageAlt || item.title}
                        title={item.title}
                        subtitle={item.subtitle}
                        description={item.summary || item.longDescription || ""}
                        priceLabel={displayPriceLabel || (item.priceLabel === "0" ? "" : item.priceLabel)}
                        buttonLink={`/buy/${item.id}`}
                        buttonText={item.ctaLabel || "Explore offering"}
                        maxDescriptionLength={240}
                        clickableCard
                      />
                    </div>
                  );
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

export const BuyDetailView = ({ item, checkoutStatus, offeringsIndex = {} }) => {
  const navigate = useNavigate();
  const [hasImageError, setHasImageError] = useState(false);
  const toast = useToast();
  const { section } = offeringsIndex[item.id];
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    if (!checkoutStatus) {
      return;
    }
    const normalized = checkoutStatus.toLowerCase();
    if (normalized === "success") {
      toast.success(`Your order for ${item.title} is confirmed.`, "Payment confirmed");
      return;
    }
    if (normalized === "cancel") {
      toast.info("Checkout was cancelled. You can restart it anytime from this page.", "Checkout cancelled");
    }
  }, [checkoutStatus, item.title, toast]);

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
          {item.imageUrl && !hasImageError ? (
            <div className="max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <img
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                className="h-72 w-full object-cover sm:h-96"
                loading="lazy"
                onError={() => setHasImageError(true)}
              />
            </div>
          ) : null}
          <p className="max-w-3xl text-lg text-white/75">{item.longDescription || item.summary}</p>
          <OfferHighlights item={item} />
        </div>
      </section>

      <section className="bg-gray-950 px-6 pb-24 pt-12">
        <div className="mx-auto max-w-5xl space-y-10">
          {checkoutStatus ? <CheckoutStatusBanner status={checkoutStatus} itemTitle={item.title} /> : null}
          <div className="flex flex-col gap-10">
            <div className="space-y-8 lg:flex-1">
              <SuccessStory successStory={item.successStory} reviews={item.reviews} />
              <DetailSection detailsSections={item.detailsSections} />
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
            <ReviewSubmissionForm itemId={item.id} />
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
      to="/#programs"
      className="mt-8 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-6 py-3 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
    >
      Return to offerings
      <ArrowRight className="h-4 w-4" />
    </Link>
  </main>
);

export const UnknownSection = () => (
  <main className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center bg-gray-950 px-6 py-24 text-center text-white">
    <h1 className="text-4xl font-bold">Offering type not found</h1>
    <p className="mt-4 max-w-xl text-base text-white/70">
      This offering type is no longer available. Return to the shop to explore the current categories and choose the one that fits your season.
    </p>
    <Link
      to="/#programs"
      className="mt-8 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-6 py-3 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
    >
      Return to offerings
      <ArrowRight className="h-4 w-4" />
    </Link>
  </main>
);

export const OfferCardSkeleton = () => (
  <article className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur transition hover:border-teal-300 hover:shadow-teal-500/20 sm:p-8">
    <div className="space-y-4">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="w-1/2 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
    <div className="mt-6">
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  </article>
);

export const BuyListViewSkeleton = () => (
  <main className="relative z-10">
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-black px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.25),transparent_60%)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="mt-6 h-12 w-3/4 sm:h-16" />
        <div className="mt-6 w-full max-w-2xl space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="mx-auto h-5 w-5/6" />
        </div>
      </div>
    </section>

    <section className="bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="mt-12 grid auto-rows-fr gap-8 md:grid-cols-2">
          <OfferCardSkeleton />
          <OfferCardSkeleton />
        </div>
      </div>
    </section>
  </main>
);

export const BuyDetailViewSkeleton = () => (
  <main className="relative z-10">
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-black px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.32),transparent_60%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3 sm:h-12" />
        <Skeleton className="h-72 w-full max-w-3xl rounded-3xl border-none sm:h-96" />
        <div className="w-full max-w-3xl space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
        </div>
      </div>
    </section>

    <section className="bg-gray-950 px-6 pb-24 pt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="w-full space-y-8 lg:flex-1">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </div>
          <div className="w-full lg:flex-[1.1]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <Skeleton className="mb-6 h-8 w-1/2" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="mt-8 h-12 w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
);
