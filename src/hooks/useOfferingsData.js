import { useEffect, useState } from "react";
import { getOfferingsCatalog } from "../services/offeringsCatalog";

const emptyCatalog = {
  source: "supabase",
  buySections: [],
  offeringsIndex: {},
  offeringSupportOptions: [],
};

export const useOfferingsData = () => {
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const resolved = await getOfferingsCatalog();
        if (isMounted) {
          setCatalog(resolved);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError);
          setCatalog(emptyCatalog);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    ...catalog,
    isLoading,
    error,
  };
};
