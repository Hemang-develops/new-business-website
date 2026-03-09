import { useLocation, useParams, useSearchParams } from "react-router-dom";
import Footer from "../../components/common/Footer";
import Navigation from "../../components/Navigation";
import { BuyDetailView, BuyListView, UnknownProduct } from "./buy/BuyViews";
import { useOfferingsData } from "../../hooks/useOfferingsData";

const Buy = () => {
  const { buySections, offeringsIndex } = useOfferingsData();
  const { productId, status: statusParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDetailRoute = Boolean(productId);
  const product = productId ? offeringsIndex[productId] : null;
  const checkoutStatus = statusParam || searchParams.get("status");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <Navigation />
      {isDetailRoute ? (
        product ? (
          <BuyDetailView item={product} checkoutStatus={checkoutStatus} offeringsIndex={offeringsIndex} />
        ) : (
          <UnknownProduct />
        )
      ) : (
        <BuyListView key={location.key} buySections={buySections} />
      )}
      <Footer />
    </div>
  );
};

export default Buy;
