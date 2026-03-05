import { useState, useEffect } from 'react';
import { fetchExchangeRates, convertPrice, formatPrice } from '../services/currencyConverter';

export const useCurrency = (basePriceUSD, selectedCurrency = 'USD') => {
  const [convertedPrice, setConvertedPrice] = useState(basePriceUSD);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const exchangeRates = await fetchExchangeRates('USD');
        setRates(exchangeRates);
        const converted = convertPrice(basePriceUSD, selectedCurrency, exchangeRates);
        setConvertedPrice(converted);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRates();
  }, [basePriceUSD, selectedCurrency]);

  return {
    price: convertedPrice,
    formatted: formatPrice(convertedPrice, selectedCurrency),
    loading,
    error,
  };
};
