export const formatAmountFromMajor = (amount, currencyCode, maximumFractionDigits = 2) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currencyCode || "USD").toUpperCase(),
    maximumFractionDigits,
  }).format(amount);

export const formatUnitAmountLabel = (unitAmount, currencyCode, maximumFractionDigits = 2) => {
  if (typeof unitAmount !== "number") {
    return null;
  }
  return formatAmountFromMajor(unitAmount / 100, currencyCode, maximumFractionDigits);
};

export const roundUpAestheticAmount = (amount, currencyCode) => {
  if (!Number.isFinite(amount)) {
    return amount;
  }
  const upperCurrency = (currencyCode || "USD").toUpperCase();
  const absolute = Math.abs(amount);
  let step = 1;

  if (upperCurrency === "INR") {
    if (absolute < 500) step = 10;
    else if (absolute < 2000) step = 50;
    else if (absolute < 10000) step = 100;
    else if (absolute < 50000) step = 500;
    else step = 1000;
  } else {
    if (absolute < 20) step = 1;
    else if (absolute < 100) step = 5;
    else if (absolute < 500) step = 10;
    else if (absolute < 2000) step = 25;
    else if (absolute < 10000) step = 50;
    else step = 100;
  }

  return Math.ceil(amount / step) * step;
};

export const getRoundedLocalizedUsdAmount = (usdAmount, targetCurrencyCode, usdRates) => {
  const currencyCode = (targetCurrencyCode || "USD").toUpperCase();
  if (!Number.isFinite(usdAmount)) {
    return null;
  }
  if (currencyCode === "USD") {
    return roundUpAestheticAmount(usdAmount, "USD");
  }
  const rate = usdRates?.[currencyCode];
  if (!rate) {
    return null;
  }
  return roundUpAestheticAmount(usdAmount * rate, currencyCode);
};
