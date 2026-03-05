const COUNTRY_API = "https://restcountries.com/v3.1/all?fields=name,cca2,currencies";
const RATES_API = "https://open.er-api.com/v6/latest/USD";
const RATES_CACHE_KEY = "usd_rates_cache_v1";
const RATES_TTL_MS = 1000 * 60 * 60 * 12;

let countriesPromise = null;
let countriesCache = null;

let ratesPromise = null;
let ratesCache = null;

export const getBrowserRegion = () => {
  if (typeof navigator === "undefined") {
    return "";
  }
  const locales = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const locale of locales) {
    const match = locale.match(/-([A-Za-z]{2})\b/);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return "";
};

export const getCountries = async () => {
  if (countriesCache) {
    return countriesCache;
  }
  if (!countriesPromise) {
    countriesPromise = fetch(COUNTRY_API)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) =>
        (Array.isArray(data) ? data : [])
          .map((entry) => {
            const name = entry?.name?.common;
            const code = entry?.cca2;
            const currencies = entry?.currencies ? Object.keys(entry.currencies) : [];
            if (!name || !code) {
              return null;
            }
            return { name, code, currencies };
          })
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      .then((parsed) => {
        countriesCache = parsed;
        return parsed;
      })
      .catch(() => []);
  }
  return countriesPromise;
};

const readRatesFromSession = () => {
  try {
    const raw = sessionStorage.getItem(RATES_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || typeof parsed?.fetchedAt !== "number") {
      return null;
    }
    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) {
      return null;
    }
    return parsed.rates;
  } catch {
    return null;
  }
};

const writeRatesToSession = (rates) => {
  try {
    sessionStorage.setItem(
      RATES_CACHE_KEY,
      JSON.stringify({
        rates,
        fetchedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures.
  }
};

export const getUsdRates = async () => {
  if (ratesCache) {
    return ratesCache;
  }

  const sessionRates = typeof sessionStorage !== "undefined" ? readRatesFromSession() : null;
  if (sessionRates) {
    ratesCache = sessionRates;
    return sessionRates;
  }

  if (!ratesPromise) {
    ratesPromise = fetch(RATES_API)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const rates = data?.rates || null;
        if (rates) {
          ratesCache = rates;
          if (typeof sessionStorage !== "undefined") {
            writeRatesToSession(rates);
          }
        }
        return rates;
      })
      .catch(() => null);
  }

  return ratesPromise;
};
