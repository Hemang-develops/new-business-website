import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Footer from "../../components/common/Footer";
import Navigation from "../../components/Navigation";
import { BuyDetailView, BuyListView, BuyDetailViewSkeleton, BuyListViewSkeleton, UnknownProduct, UnknownSection } from "./buy/BuyViews";
import { useOfferingsData } from "../../hooks/useOfferingsData";
import FAQSection from "../../components/storefront/FAQSection";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import SiteLoadingScreen from "../../components/storefront/SiteLoadingScreen";
import { useToast } from "../../context/ToastContext";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import Contact from "@/components/Contact";

const Buy = () => {
  const { buySections, offeringsIndex, isLoading } = useOfferingsData();
  const { settings, isLoading: isSiteLoading, error: siteError } = useSiteSettings();
  const { productId, sectionId, status: statusParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const selectedSection = sectionId ? buySections.find((section) => section.id === sectionId) : null;
  const isDetailRoute = Boolean(productId);
  const product = productId ? offeringsIndex[productId] : null;
  const checkoutStatus = statusParam || searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const paymentId = searchParams.get("payment_id") || searchParams.get("razorpay_payment_id");
  const provider = searchParams.get("provider");
  const [isVerifiedPayment, setIsVerifiedPayment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (checkoutStatus !== "success" || !productId) {
      setIsVerifiedPayment(false);
      return undefined;
    }

    setIsVerifiedPayment(false);

    // Verify Razorpay redirects against the fulfillment record; URL parameters are untrusted.
    if (provider === "razorpay" && paymentId) {
      supabase.functions
        .invoke("razorpay-verify-payment", {
          body: { action: "verify-return", paymentId, productId },
        })
        .then(({ data, error }) => {
          if (isMounted) setIsVerifiedPayment(!error && data?.verified === true);
        })
        .catch(() => {
          if (isMounted) setIsVerifiedPayment(false);
        });

      return () => {
        isMounted = false;
      };
    }

    if (provider || paymentId) {
      if (isMounted) setIsVerifiedPayment(false);
      return undefined;
    }

    // 2. Stripe checkout redirect with a real session ID (e.g. cs_test_... or cs_live_...)
    const isValidStripeSession = Boolean(
      sessionId &&
      typeof sessionId === "string" &&
      sessionId.trim() !== "" &&
      sessionId !== "{CHECKOUT_SESSION_ID}"
    );

    if (isValidStripeSession) {
      const storedSessionId = sessionStorage.getItem("stripe_session_id");
      const storedProductId = sessionStorage.getItem("product_id");
      const isClientSessionMatch = storedSessionId === sessionId && (!storedProductId || storedProductId === productId);

      if (isClientSessionMatch) {
        setIsVerifiedPayment(false);
      }

      supabase.functions
        .invoke("stripe-endpoint", { body: { action: "verify-session", sessionId, productId } })
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && data?.verified) {
              setIsVerifiedPayment(true);
            } else {
              setIsVerifiedPayment(false);
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsVerifiedPayment(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }

    // 3. Direct URL access without any valid payment or session ID (e.g. typing /buy/product/success directly) -> DENY
    if (isMounted) {
      setIsVerifiedPayment(false);
    }

    return () => {
      isMounted = false;
    };
  }, [checkoutStatus, productId, sessionId, paymentId, provider]);

  if (siteError) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
        <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-black/50 p-8 text-center">
            <h1 className="text-3xl font-semibold text-white">Unable to load site content</h1>
            <p className="mt-4 text-base leading-relaxed text-white/65">
              The latest website data could not be loaded, so the page has been paused instead of showing outdated content.
            </p>
            <p className="mt-6 text-sm text-rose-200/80">{siteError.message || "Please try refreshing the page."}</p>
          </div>
        </main>
      </div>
    );
  }

  if (isSiteLoading || !settings) {
    return <SiteLoadingScreen title="Opening your portal" description="Your next experience is coming into focus." />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      {isDetailRoute ? (
        isLoading ? (
          <BuyDetailViewSkeleton />
        ) : product ? (
          <BuyDetailView
            item={product}
            checkoutStatus={isVerifiedPayment ? checkoutStatus : undefined}
            isVerifiedPayment={isVerifiedPayment}
            offeringsIndex={offeringsIndex}
          />
        ) : (
          <UnknownProduct />
        )
      ) : sectionId ? (
        isLoading ? (
          <BuyListViewSkeleton />
        ) : selectedSection ? (
          <BuyListView key={`${location.key}-${sectionId}`} buySections={[selectedSection]} />
        ) : (
          <UnknownSection />
        )
      ) : (
        <UnknownSection />
      )}
      <FAQSection />
      <Contact />
      <Footer />
    </div>
  );
};

export default Buy;
