import axios from 'axios';

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback rates if API fails completely
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.32,
  AUD: 1.52,
  INR: 83.12,
  JPY: 149.5,
  CHF: 0.88,
  SGD: 1.34,
  AED: 3.67,
};

const getCachedRates = () => {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { rates, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;

  if (age < CACHE_DURATION) {
    return rates; // Cache is fresh
  }

  return null; // Cache is stale
};

const setCachedRates = (rates) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      rates,
      timestamp: Date.now(),
    })
  );
};

export const fetchExchangeRates = async (baseCurrency = 'USD') => {
  // 1. Check if cached rates are fresh
  const cached = getCachedRates();
  if (cached) {
    console.log('Using cached exchange rates');
    return cached;
  }

  // 2. Try to fetch from API
  try {
    const response = await axios.get(`${BASE_URL}/${baseCurrency}`, {
      timeout: 5000,
    });
    const rates = response.data.rates;
    setCachedRates(rates); // Cache the new rates
    console.log('Fetched fresh exchange rates from API');
    return rates;
  } catch (error) {
    console.warn('API fetch failed, attempting to use stale cache:', error.message);

    // 3. Use stale cached rates if available
    const staleCache = localStorage.getItem(CACHE_KEY);
    if (staleCache) {
      const { rates } = JSON.parse(staleCache);
      console.log('Using stale cached rates');
      return rates;
    }

    // 4. Fall back to hardcoded rates
    console.log('Using fallback hardcoded rates');
    return FALLBACK_RATES;
  }
};

export const convertPrice = (priceUSD, targetCurrency = 'USD', rates = {}) => {
  if (targetCurrency === 'USD') return priceUSD;

  const rate = rates[targetCurrency] || 1;
  return Math.round(priceUSD * rate * 100) / 100;
};

export const formatPrice = (price, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};
