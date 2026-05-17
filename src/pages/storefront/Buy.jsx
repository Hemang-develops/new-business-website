import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Footer from "../../components/common/Footer";
import Navigation from "../../components/Navigation";
import { BuyDetailView, BuyListView, BuyDetailViewSkeleton, BuyListViewSkeleton, UnknownProduct, UnknownSection } from "./buy/BuyViews";
import { useOfferingsData } from "../../hooks/useOfferingsData";
import FAQSection from "../../components/storefront/FAQSection";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import SiteLoadingScreen from "../../components/storefront/SiteLoadingScreen";
import { useToast } from "../../context/ToastContext";
import { useEffect, useRef } from "react";
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
  const courseAccessUrl = searchParams.get("courseAccess");
  const sessionId = searchParams.get("session_id");
  const processedStripeSessionRef = useRef("");

  // For courses with direct access URL, redirect immediately
  useEffect(() => {
    if (checkoutStatus === "success" && courseAccessUrl && isDetailRoute && product) {
      window.location.href = courseAccessUrl;
    }
  }, [checkoutStatus, courseAccessUrl, isDetailRoute, product]);

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
            checkoutStatus={checkoutStatus}
            courseAccessUrl={courseAccessUrl}
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
