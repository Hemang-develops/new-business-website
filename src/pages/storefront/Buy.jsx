import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Footer from "../../components/common/Footer";
import Navigation from "../../components/Navigation";
import { BuyDetailView, BuyListView, BuyDetailViewSkeleton, BuyListViewSkeleton, UnknownProduct, UnknownSection } from "./buy/BuyViews";
import { useOfferingsData } from "../../hooks/useOfferingsData";
import FAQSection from "../../components/storefront/FAQSection";

const Buy = () => {
  const { buySections, offeringsIndex, isLoading } = useOfferingsData();
  const { productId, sectionId, status: statusParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const selectedSection = sectionId ? buySections.find((section) => section.id === sectionId) : null;
  const isDetailRoute = Boolean(productId);
  const product = productId ? offeringsIndex[productId] : null;
  const checkoutStatus = statusParam || searchParams.get("status");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      {isDetailRoute ? (
        isLoading ? (
          <BuyDetailViewSkeleton />
        ) : product ? (
          <BuyDetailView item={product} checkoutStatus={checkoutStatus} offeringsIndex={offeringsIndex} />
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
      <Footer />
    </div>
  );
};

export default Buy;
