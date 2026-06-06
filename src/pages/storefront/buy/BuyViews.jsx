import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

gsap.registerPlugin(useGSAP, ScrollTrigger);
import { useSmoothScroll } from "../../../hooks/useSmoothScroll";
import { getBrowserRegion, getCountries, getUsdRates } from "../../../services/marketData";
import { formatAmountFromMajor, getRoundedLocalizedUsdAmount } from "../../../services/pricing";
import PaymentSection from "./PaymentSection";
import HorizontalCard from "../../../components/common/HorizontalCard";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../supabase-client";
import { Skeleton } from "../../../components/ui/skeleton";
import OfferingHero from "../../../components/storefront/OfferingHero";
import { useGsapReveal } from "../../../hooks/useGsapMotion";
import RichTextContent from "../../../components/ui/RichTextContent";
import BookingEmbed from "@/components/storefront/BookingEmbed";
import { reviewsTable } from "../../admin/catalogAdminHelpers";
import Comments from "@/components/Comments";
import { useAuth } from "@/context/AuthContext";

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];

const BookingNextStepBanner = ({ item }) => (
  <div className="rounded-3xl border border-teal-300/40 bg-teal-300/10 p-6 text-sm leading-relaxed text-teal-50 shadow-inner backdrop-blur">
    <p className="text-xs font-semibold uppercase tracking-[0.3em]">Next step unlocked</p>
    <p className="mt-3">
      Your payment for {item.title} is confirmed. Use the booking section below to choose your session time.
    </p>
  </div>
);

const CourseAccessBanner = ({ accessUrl }) => {
  if (!accessUrl) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-teal-300/40 bg-teal-300/10 p-6 text-sm leading-relaxed text-teal-50 shadow-inner backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em]">Course access ready</p>
      <p className="mt-3">
        Your private course link is ready. It has also been sent to your email.
      </p>
      <a
        href={accessUrl}
        className="mt-5 inline-flex rounded-full border border-teal-200/50 bg-teal-200 px-5 py-2 text-sm font-semibold text-gray-950"
      >
        Open your course
      </a>
    </div>
  );
};
const PaymentSuccessBanner = () => (
  <div className="rounded-3xl border-2 border-teal-300 bg-teal-300/20 p-8 text-center text-white shadow-lg backdrop-blur">
    <div className="mb-4 text-4xl">✅</div>
    <h3 className="text-xl font-bold text-teal-100">Payment Successful!</h3>
    <p className="mt-2 text-base">
      Your order for this offering has been confirmed. Check your email for the receipt and download links.
    </p>
  </div>
);
const DetailSection = ({ detailsSections }) => {
  if (!detailsSections?.length) {
    return null;
  }

  return (
    <section className="space-y-8">
      {detailsSections?.map((section) => (
        <div key={section.heading} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">{section.heading}</h3>
          {section.description && <RichTextContent value={section.description} className="text-base leading-relaxed text-white/75" />}
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
          <p className="mt-5 text-lg leading-relaxed text-white/90">"{entry.quote?.replace(/<[^>]*>?/gm, '')}"</p>
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
      </div>

      <div className="mt-6">
        <Link
          to={`/buy/${item.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
        >
          {item.ctaLabel || "Details here"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
};

export const BuyListView = ({ buySections = [] }) => {
  // useSmoothScroll();
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
      {activeSection && <OfferingHero section={activeSection} />}

      {buySections.map((section) => (
        <section key={section.id} id={section.id} className="bg-gray-950 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">{section.title}</p>
              <RichTextContent value={section.description} className="mt-4 text-lg text-white/70" />
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
                        buttonText={item.ctaLabel || "Details here"}
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

export const BuyDetailView = ({ item, checkoutStatus, courseAccessUrl, offeringsIndex = {} }) => {
  const navigate = useNavigate();
  const [hasImageError, setHasImageError] = useState(false);
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [userCourseAccess, setUserCourseAccess] = useState(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const lastCheckoutToastRef = useRef("");
  const { section } = offeringsIndex[item.id];

  // Check if user already has access to this course
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      console.log("[BuyDetailView] Not checking course access - isAuthenticated:", isAuthenticated, 'user?.email:', user?.email);
      return;
    }

    const checkCourseAccess = async () => {
      setIsLoadingCourse(true);
      console.log("[BuyDetailView] Checking course access for email:", user.email, 'offering ID:', item.id);
      try {
        const { getUserCourseByOfferingId } = await import("../../../services/userCourses");
        const access = await getUserCourseByOfferingId(user.email, item.id, user.id);
        console.log("[BuyDetailView] Course access result:", access);
        setUserCourseAccess(access);
      } catch (error) {
        console.error("[BuyDetailView] Error checking course access:", error);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    checkCourseAccess();
  }, [isAuthenticated, user?.email, item.id]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    if (!checkoutStatus) {
      lastCheckoutToastRef.current = "";
      return;
    }
    const normalized = checkoutStatus.toLowerCase();
    if (lastCheckoutToastRef.current === normalized) {
      return;
    }
    lastCheckoutToastRef.current = normalized;
    if (normalized === "success") {
      toast.success(`Your order for ${item.title} is confirmed.`, "Payment confirmed");
      return;
    }
    if (normalized === "cancel") {
      toast.info("Checkout was cancelled. You can restart it anytime from this page.", "Checkout cancelled");
    }
  }, [checkoutStatus, item.title, toast]);

  const hasCheckout = Boolean(item.checkoutOptions);
  const bookingEnabled = Boolean(item.booking?.enabled);
  const bookingUnlocked = bookingEnabled && (!hasCheckout || String(checkoutStatus || "").toLowerCase() === "success");

  const detailHeroRef = useRef(null);

  useGsapReveal(detailHeroRef, [item.id]);

  useGSAP(
    () => {
      const root = detailHeroRef.current;
      if (!root) return;

      gsap.to(root.querySelector("[data-hero-parallax]"), {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: detailHeroRef, dependencies: [item.id] },
  );

  return (
    <main className="relative z-10">
      <section
        ref={detailHeroRef}
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-gray-950 to-black px-6 py-20 lg:py-32"
      >
        {/* Cinematic Animated Noise Overlay */}
        <div
          className="absolute inset-0 z-[1] opacity-[0.05] pointer-events-none mix-blend-overlay animate-noise"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(192,132,252,0.15),transparent_60%)]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-teal-300 hover:text-teal-200 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-all duration-1000">
            <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[16/7] overflow-hidden">
              <div className="absolute inset-0" data-hero-parallax>
                {item.imageUrl && !hasImageError ? (
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt || item.title}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                    loading="lazy"
                    onError={() => setHasImageError(true)}
                  />
                ) : (
                  <div className="h-full w-full bg-slate-900" />
                )}
              </div>

              {/* Premium Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent opacity-90 lg:opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/30 via-transparent to-transparent" />

              {/* Content Overlay - Positioned at the bottom */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 lg:p-10">
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-teal-200/80 mb-6 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/5 w-fit"
                  data-gsap-reveal
                  data-gsap-delay="0.2"
                >
                  {section?.title}
                </span>
                <h1
                  className="text-4xl font-bold text-white sm:text-6xl lg:text-7xl leading-[1.1] tracking-tighter"
                  data-gsap-reveal
                  data-gsap-delay="0.3"
                >
                  {item.title}
                </h1>
              </div>
            </div>
          </div>

          <RichTextContent
            value={item.longDescription || item.summary}
            className="max-w-4xl text-lg sm:text-xl leading-relaxed text-white/60 font-medium tracking-tight"
            data-gsap-reveal
            data-gsap-delay="0.4"
          />
        </div>
      </section>


      <section className="bg-gray-950 px-6 pb-24 pt-12">
        <div className="mx-auto max-w-6xl space-y-10">
          {bookingUnlocked && hasCheckout ? <BookingNextStepBanner item={item} /> : null}
          {String(checkoutStatus || "").toLowerCase() === "success" && !courseAccessUrl ? (
            <PaymentSuccessBanner />
          ) : null}
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
              {userCourseAccess ? (
                <section className="space-y-6 rounded-3xl border border-teal-300/40 bg-teal-300/10 p-8 text-white/90 shadow-2xl backdrop-blur">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">✓ Course Access Active</h3>
                    <p className="text-sm text-white/80">You already have access to this course! Open it anytime using the button below.</p>
                    {userCourseAccess.expiresAt && (
                      <p className="text-xs text-white/60">
                        Access valid until: {new Date(userCourseAccess.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <a
                    href={userCourseAccess.accessUrl}
                    className="inline-flex w-full justify-center items-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-200"
                  >
                    Open Course
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </section>
              ) : bookingEnabled ? (
                bookingUnlocked ? (
                  <BookingEmbed item={item} />
                ) : (
                  <PaymentSection item={item} />
                )
              ) : (
                <PaymentSection item={item} />
              )}
            </div>
            <div className="mt-16">
              <Comments pageType="offering" pageId={item.id} />
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
    <section className="relative overflow-hidden bg-gray-950 py-12 lg:py-24">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 space-y-6 lg:order-1">
            <Skeleton className="h-6 w-32 rounded-full bg-white/10" />
            <Skeleton className="h-16 w-3/4 bg-white/10" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
            </div>
            <Skeleton className="h-14 w-40 rounded-2xl bg-teal-300/20" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-4">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-gray-950 py-16">
      <div className="mx-auto max-w-6xl">
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
    <section className="relative overflow-hidden bg-gray-950 px-6 py-20 lg:py-32">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
        <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[16/7] overflow-hidden rounded-[2rem] bg-white/5 border border-white/10">
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 lg:p-20 space-y-4">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-12 w-2/3 sm:h-20 bg-white/10" />
          </div>
        </div>
        <div className="w-full max-w-4xl space-y-3">
          <Skeleton className="h-5 w-full bg-white/5" />
          <Skeleton className="h-5 w-5/6 bg-white/5" />
          <Skeleton className="h-5 w-4/6 bg-white/5" />
        </div>
      </div>
    </section>

    <section className="bg-gray-950 px-6 pb-24 pt-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
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
