import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getBrowserRegion, getCountries, getUsdRates } from "../../../services/marketData";
import { formatAmountFromMajor, formatUnitAmountLabel, roundUpAestheticAmount } from "../../../services/pricing";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../supabase-client";

const isExternalLink = (link) => typeof link === "string" && /^(https?:|upi:|mailto:)/.test(link);

const fallbackCountryData = [
  { name: "India", code: "IN", currencies: ["INR"] },
  { name: "United States", code: "US", currencies: ["USD"] },
  { name: "Canada", code: "CA", currencies: ["CAD"] },
  { name: "United Kingdom", code: "GB", currencies: ["GBP"] },
];
const DEFAULT_PAYPAL_LINK = "https://www.paypal.com/paypalme/NehalPatel64";
const MIN_INSTALLMENT_AMOUNT_INR = 15000;

const defaultInstallmentPresets = [
  {
    id: "pay-in-full",
    label: "Pay in full",
    mode: "payment",
    installmentCount: 1,
    feePercent: 0,
    description: "Lowest total cost",
    badge: "Best price",
  },
  {
    id: "two-installments",
    label: "2 installments",
    mode: "payment",
    installmentCount: 2,
    feePercent: 8,
    description: "Split your payment across 2 parts",
    badge: "Easy start",
  },
  {
    id: "four-installments",
    label: "4 installments",
    mode: "payment",
    installmentCount: 4,
    feePercent: 15,
    description: "Lowest upfront commitment",
    badge: "Most flexible",
  },
];

const applyInstallmentFeeToCurrencies = (currencies, feePercent) => {
  const multiplier = 1 + feePercent / 100;
  return Object.entries(currencies || {}).reduce((acc, [code, config]) => {
    const next = { ...config };
    if (typeof config?.unitAmount === "number") {
      const adjusted = Math.max(1, Math.round(config.unitAmount * multiplier));
      next.unitAmount = adjusted;
      next.amount = formatUnitAmountLabel(adjusted, code);
    }
    acc[code] = next;
    return acc;
  }, {});
};

const PaymentSection = ({ item }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const checkoutOptions = item.checkoutOptions;
  const manualInstructions = item.manualInstructions || [];
  const legalNotes = item.legalNotes || [];
  const backupLink = item.manualSupport?.link || item.purchase?.link || item.actionLink;
  const backupLabel =
    item.manualSupport?.label || item.purchase?.label || item.ctaLabel || "Email for support";
  const paypalLink = item.paypalLink || import.meta.env.VITE_PAYPAL_ME_LINK || DEFAULT_PAYPAL_LINK;
  const upiLink = item.upiLink || import.meta.env.VITE_UPI_PAY_LINK || "";

  const rawPackageOptions = useMemo(() => {
    if (!checkoutOptions) {
      return [];
    }
    if (checkoutOptions.installments && typeof checkoutOptions.installments === "object") {
      return Object.entries(checkoutOptions.installments)
        .map(([id, config]) => ({
          id,
          label: config.label || id,
          mode: config.mode || "payment",
          installmentCount: config.installmentCount || 1,
          feePercent: config.feePercent || 0,
          description: config.description || "",
          badge: config.badge || "",
          currencies: config.currencies || {},
          defaultCurrency: config.defaultCurrency || checkoutOptions.defaultCurrency || "usd",
        }))
        .filter((entry) => Object.keys(entry.currencies || {}).length > 0);
    }
    if (!checkoutOptions.currencies) {
      return [];
    }
    return defaultInstallmentPresets.map((preset) => ({
      ...preset,
      currencies: applyInstallmentFeeToCurrencies(checkoutOptions.currencies, preset.feePercent || 0),
      defaultCurrency: checkoutOptions.defaultCurrency || "usd",
    }));
  }, [checkoutOptions]);
  const [usdRates, setUsdRates] = useState(null);
  const estimatedBaseAmountInInr = useMemo(() => {
    const usdUnitAmount = rawPackageOptions[0]?.currencies?.usd?.unitAmount;
    const inrUnitAmount = rawPackageOptions[0]?.currencies?.inr?.unitAmount;
    if (typeof inrUnitAmount === "number") {
      return inrUnitAmount / 100;
    }
    if (typeof usdUnitAmount === "number" && usdRates?.INR) {
      return (usdUnitAmount / 100) * usdRates.INR;
    }
    return null;
  }, [rawPackageOptions, usdRates]);
  const installmentEligible = estimatedBaseAmountInInr == null || estimatedBaseAmountInInr >= MIN_INSTALLMENT_AMOUNT_INR;
  const packageOptions = useMemo(
    () =>
      rawPackageOptions.filter((option) =>
        installmentEligible ? true : Math.max(1, option.installmentCount || 1) === 1,
      ),
    [installmentEligible, rawPackageOptions],
  );
  const [selectedPackageId, setSelectedPackageId] = useState(() => packageOptions[0]?.id || "");
  const selectedPackage = useMemo(
    () => packageOptions.find((entry) => entry.id === selectedPackageId) || packageOptions[0] || null,
    [packageOptions, selectedPackageId],
  );
  const currencyKeys = useMemo(() => {
    if (!selectedPackage?.currencies) {
      return [];
    }
    return Object.keys(selectedPackage.currencies);
  }, [selectedPackage]);

  const hasCheckout = packageOptions.length > 0 && currencyKeys.length > 0;
  const browserRegion = useMemo(() => getBrowserRegion(), []);
  const [countryOptions, setCountryOptions] = useState(() => fallbackCountryData);
  const [countryCurrencyMap, setCountryCurrencyMap] = useState(() =>
    fallbackCountryData.reduce((acc, entry) => {
      acc[entry.name] = entry.currencies;
      return acc;
    }, {}),
  );
  const [country, setCountry] = useState("India");
  const preferredCurrencyByCountry = useMemo(() => {
    const currencies = countryCurrencyMap[country] || [];
    for (const code of currencies) {
      const normalized = code.toLowerCase();
      if (currencyKeys.includes(normalized)) {
        return normalized;
      }
    }
    return currencyKeys.includes("usd") ? "usd" : "";
  }, [country, countryCurrencyMap, currencyKeys]);
  const selectedCountryCurrencyCode = useMemo(
    () => ((countryCurrencyMap[country] || [])[0] || "USD").toUpperCase(),
    [country, countryCurrencyMap],
  );
  const canShowUpiOption = browserRegion === "IN" || country === "India" || selectedCountryCurrencyCode === "INR";

  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (!hasCheckout) {
      return "";
    }
    if (preferredCurrencyByCountry && currencyKeys.includes(preferredCurrencyByCountry)) {
      return preferredCurrencyByCountry;
    }
    if (selectedPackage?.defaultCurrency && currencyKeys.includes(selectedPackage.defaultCurrency)) {
      return selectedPackage.defaultCurrency;
    }
    return currencyKeys[0];
  });

  useEffect(() => {
    let isMounted = true;
    const loadCountries = async () => {
      const parsed = await getCountries();
      if (!isMounted || !parsed?.length) {
        return;
      }
      setCountryOptions(parsed);
      setCountryCurrencyMap(
        parsed.reduce((acc, entry) => {
          acc[entry.name] = entry.currencies;
          return acc;
        }, {}),
      );
      if (browserRegion) {
        const detected = parsed.find((entry) => entry.code === browserRegion);
        if (detected?.name) {
          setCountry(detected.name);
        }
      }
    };
    loadCountries();
    return () => {
      isMounted = false;
    };
  }, [browserRegion]);

  useEffect(() => {
    if (!packageOptions.length) {
      setSelectedPackageId("");
      return;
    }
    if (!packageOptions.some((entry) => entry.id === selectedPackageId)) {
      setSelectedPackageId(packageOptions[0].id);
    }
  }, [packageOptions, selectedPackageId]);

  useEffect(() => {
    if (!hasCheckout) {
      setSelectedCurrency("");
      return;
    }
    const preferred =
      (preferredCurrencyByCountry && currencyKeys.includes(preferredCurrencyByCountry)
        ? preferredCurrencyByCountry
        : selectedPackage?.defaultCurrency && currencyKeys.includes(selectedPackage.defaultCurrency)
          ? selectedPackage.defaultCurrency
          : currencyKeys[0]) || "";
    setSelectedCurrency(preferred);
  }, [hasCheckout, currencyKeys, preferredCurrencyByCountry, selectedPackage]);

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

  const currencyConfig = hasCheckout && selectedCurrency ? selectedPackage?.currencies?.[selectedCurrency] : null;
  const referenceUsdAmount = useMemo(() => {
    const unitAmount = selectedPackage?.currencies?.usd?.unitAmount;
    if (typeof unitAmount !== "number") {
      return null;
    }
    return unitAmount / 100;
  }, [selectedPackage]);
  const countryRate = usdRates?.[selectedCountryCurrencyCode] || null;
  const previewCurrencyCode =
    selectedCountryCurrencyCode !== "USD" && countryRate ? selectedCountryCurrencyCode : "USD";
  const packagePricePreviews = useMemo(
    () =>
      packageOptions.reduce((acc, option) => {
        const usdUnitAmount = option?.currencies?.usd?.unitAmount;
        if (typeof usdUnitAmount !== "number") {
          acc[option.id] = {
            totalLabel: option.label,
            perInstallmentLabel: option.label,
            totalMajor: null,
            perInstallmentMajor: null,
            currencyCode: previewCurrencyCode,
          };
          return acc;
        }
        const installments = Math.max(1, option.installmentCount || 1);
        const totalMajorAmount = usdUnitAmount / 100;
        const rawTotalMajor =
          previewCurrencyCode === "USD" ? totalMajorAmount : totalMajorAmount * (countryRate || 1);
        const roundedPerInstallmentMajor = roundUpAestheticAmount(
          rawTotalMajor / installments,
          previewCurrencyCode,
        );
        const roundedTotalMajor = roundedPerInstallmentMajor * installments;

        acc[option.id] = {
          totalLabel: formatAmountFromMajor(roundedTotalMajor, previewCurrencyCode),
          perInstallmentLabel: formatAmountFromMajor(roundedPerInstallmentMajor, previewCurrencyCode),
          totalMajor: roundedTotalMajor,
          perInstallmentMajor: roundedPerInstallmentMajor,
          currencyCode: previewCurrencyCode,
        };
        return acc;
      }, {}),
    [countryRate, packageOptions, previewCurrencyCode],
  );
  const averageRoundedExtraLabel = useMemo(() => {
    const baseTotal = packagePricePreviews["pay-in-full"]?.totalMajor;
    if (typeof baseTotal !== "number") {
      return null;
    }
    const extras = packageOptions
      .filter((option) => option.id !== "pay-in-full")
      .map((option) => {
        const planTotal = packagePricePreviews[option.id]?.totalMajor;
        return typeof planTotal === "number" ? Math.max(0, planTotal - baseTotal) : null;
      })
      .filter((value) => typeof value === "number");
    if (!extras.length) {
      return null;
    }
    const averageExtra = extras.reduce((sum, value) => sum + value, 0) / extras.length;
    return formatAmountFromMajor(averageExtra, previewCurrencyCode);
  }, [packageOptions, packagePricePreviews, previewCurrencyCode]);
  const showReferenceConversion = Boolean(
    hasCheckout &&
    referenceUsdAmount &&
    countryRate &&
    !currencyKeys.includes(selectedCountryCurrencyCode.toLowerCase()) &&
    selectedCountryCurrencyCode !== "USD",
  );
  const presentmentCurrency = selectedCountryCurrencyCode.toLowerCase();
  const presentmentUnitAmount = useMemo(() => {
    if (referenceUsdAmount == null) {
      return null;
    }
    const installments = Math.max(1, selectedPackage?.installmentCount || 1);
    const rawTotal =
      presentmentCurrency === "usd"
        ? referenceUsdAmount
        : countryRate
          ? referenceUsdAmount * countryRate
          : null;
    if (rawTotal == null) {
      return null;
    }
    const roundedPerInstallment = roundUpAestheticAmount(
      rawTotal / installments,
      presentmentCurrency.toUpperCase(),
    );
    const roundedTotal = roundedPerInstallment * installments;
    return Math.max(1, Math.round(roundedTotal * 100));
  }, [countryRate, presentmentCurrency, referenceUsdAmount, selectedPackage?.installmentCount]);
  const amountDueLabel = useMemo(() => {
    const selectedPreview = selectedPackage?.id ? packagePricePreviews[selectedPackage.id] : null;
    if (selectedPreview?.perInstallmentLabel) {
      return selectedPreview.perInstallmentLabel;
    }
    if (!currencyConfig?.amount) {
      return item.price?.usd ? `$${item.price.usd} USD` : "Choose your checkout method";
    }
    return String(currencyConfig.amount).trim();
  }, [
    currencyConfig?.amount,
    item.price?.usd,
    packagePricePreviews,
    selectedPackage?.id,
  ]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [acceptedLegalNotes, setAcceptedLegalNotes] = useState(() => legalNotes.map(() => false));
  const requiresLegalConsent = legalNotes.length > 0;
  const hasAcceptedAllLegalNotes = useMemo(
    () =>
      !requiresLegalConsent ||
      (acceptedLegalNotes.length === legalNotes.length && acceptedLegalNotes.every(Boolean)),
    [acceptedLegalNotes, legalNotes.length, requiresLegalConsent],
  );
  const isConsentPending = requiresLegalConsent && !hasAcceptedAllLegalNotes;
  const isNameMissing = !firstName.trim() || !lastName.trim();
  const isEmailMissing = !email.trim();
  const isActionBlockedByForm = isNameMissing || isEmailMissing || isConsentPending;
  const isActionBlocked = hasCheckout && isActionBlockedByForm;
  const upiInstructionLabel = useMemo(() => {
    if (!referenceUsdAmount || !usdRates?.INR) {
      return null;
    }
    const inrAmount = Math.max(1, Math.round(referenceUsdAmount * usdRates.INR));
    const formattedInr = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(inrAmount);
    return `If you want to pay through Google Pay, email us and we will share the UPI ID (\u20B9${formattedInr} INR).`;
  }, [referenceUsdAmount, usdRates]);
  const displayedManualInstructions = useMemo(() => {
    const resolved = manualInstructions.map((instruction) =>
      /UPI ID/i.test(instruction) && upiInstructionLabel ? upiInstructionLabel : instruction,
    );
    if (backupLink) {
      return resolved;
    }
    return resolved.filter((instruction) => !/support button below/i.test(instruction));
  }, [backupLink, manualInstructions, upiInstructionLabel]);

  useEffect(() => {
    setAcceptedLegalNotes(legalNotes.map(() => false));
  }, [legalNotes]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }
    if (user.name) {
      const fullName = String(user.name).trim();
      const [prefillFirstName, ...restNames] = fullName.split(/\s+/);
      const prefillLastName = restNames.join(" ");

      if (prefillFirstName) {
        setFirstName((previous) => (previous.trim() ? previous : prefillFirstName));
      }
      if (prefillLastName) {
        setLastName((previous) => (previous.trim() ? previous : prefillLastName));
      }
    }
    if (user.email) {
      setEmail((previous) => (previous.trim() ? previous : user.email));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!canShowUpiOption && paymentMethod === "upi") {
      setPaymentMethod("stripe");
    }
  }, [canShowUpiOption, paymentMethod]);

  useEffect(() => {
    if (!import.meta.env.DEV || !averageRoundedExtraLabel) {
      return;
    }
    console.info(`[Checkout pricing] Average extra added vs pay-in-full: ${averageRoundedExtraLabel}`);
  }, [averageRoundedExtraLabel]);

  const apiBase = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) {
      return "";
    }
    return base.replace(/\/$/, "");
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasCheckout) {
      return;
    }

    if (!email?.trim()) {
      const message = "Enter your email so Stripe can send the receipt and download links.";
      setError(message);
      toast.error(message);
      return;
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      const message = "Enter your first and last name to continue.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!selectedCurrency) {
      const message = "Choose your checkout method to continue.";
      setError(message);
      toast.error(message);
      return;
    }
    if (isConsentPending) {
      const message = "Please accept all legal notes to continue.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (paymentMethod === "paypal") {
        if (!paypalLink) {
          throw new Error("PayPal is not configured yet. Please use Stripe or contact support.");
        }
        toast.info("Redirecting you to PayPal to complete your order.", "Redirecting");
        window.location.href = paypalLink;
        return;
      }
      if (paymentMethod === "upi") {
        if (upiLink) {
          toast.info("Opening your UPI payment flow.", "Redirecting");
          window.location.href = upiLink;
          return;
        }
        if (backupLink) {
          toast.info("Sending you to the alternate support payment flow.", "Redirecting");
          window.location.href = backupLink;
          return;
        }
        throw new Error("UPI is manual right now. Please use Stripe or contact support for UPI details.");
      }

      const { data, error: functionError } = await supabase.functions.invoke("stripe-endpoint", {
        body: {
          productId: item.id,
          packageId: selectedPackage?.id || null,
          packageLabel: selectedPackage?.label || null,
          installmentPlanId: selectedPackage?.id || null,
          installmentPlanLabel: selectedPackage?.label || null,
          installmentCount: selectedPackage?.installmentCount || 1,
          installmentFeePercent: selectedPackage?.feePercent || 0,
          currency: selectedCurrency,
          preferredPaymentMethod: paymentMethod,
          mode: selectedPackage?.mode || "payment",
          recurringInterval: null,
          presentmentCurrency,
          presentmentUnitAmount,
          baseCurrency: "usd",
          baseUnitAmount: selectedPackage?.currencies?.usd?.unitAmount || null,
          fxRate: countryRate || null,
          fxSource: "open.er-api",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
          country,
        },
      });

      if (functionError) {
        throw new Error(
          functionError.message ||
          "Unable to start checkout right now. Try again or email us for a manual invoice.",
        );
      }

      if (data?.url) {
        toast.info("Redirecting you to secure Stripe checkout.", "Redirecting");
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe did not return a checkout link. Email us and we will send it manually.");
    } catch (err) {
      const message =
        err?.message && typeof err.message === "string"
          ? err.message
          : "Unexpected error while launching checkout. Please email us and I'll help manually.";

      if (err?.name === "TypeError") {
        const nextMessage = `${message} If this keeps happening, use the manual payment instructions below while we restore the secure checkout link.`;
        setError(nextMessage);
        toast.error(nextMessage);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      if (paymentMethod === "paypal") return "Redirecting to PayPal...";
      if (paymentMethod === "upi") return "Opening UPI...";
      return "Redirecting to Stripe...";
    }
    if (paymentMethod === "paypal") return "Continue with PayPal";
    if (paymentMethod === "upi") return "Continue with UPI";
    return "Confirm and pay now";
  };

  return (
    <section className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/90 shadow-2xl backdrop-blur">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Checkout</h3>
        {hasCheckout ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col space-y-2 text-sm text-white/70 sm:flex-1">
                <span className="font-semibold text-white">First name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-300/60"
                />
              </label>
              <label className="flex flex-col space-y-2 text-sm text-white/70 sm:flex-1">
                <span className="font-semibold text-white">Last name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-300/60"
                />
              </label>
              <label className="flex flex-col space-y-2 text-sm text-white/70 sm:col-span-2">
                <span className="font-semibold text-white">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-300/60"
                />
              </label>
            </div>

            <label className="flex flex-col space-y-2 text-sm text-white/70">
              <span className="font-semibold text-white">Payment method</span>
              <div className={`grid gap-2 ${canShowUpiOption ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${paymentMethod === "stripe"
                    ? "border-teal-200 bg-teal-300/20 text-teal-50"
                    : "border-white/20 bg-black/25 text-white/70 hover:border-teal-300/40 hover:text-white"
                    }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Stripe</p>
                  <p className="mt-1 text-xs text-white/70">Cards, wallets, regional methods</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${paymentMethod === "paypal"
                    ? "border-teal-200 bg-teal-300/20 text-teal-50"
                    : "border-white/20 bg-black/25 text-white/70 hover:border-teal-300/40 hover:text-white"
                    }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">PayPal</p>
                  <p className="mt-1 text-xs text-white/70">Pay via your PayPal account</p>
                </button>
                {canShowUpiOption ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${paymentMethod === "upi"
                      ? "border-teal-200 bg-teal-300/20 text-teal-50"
                      : "border-white/20 bg-black/25 text-white/70 hover:border-teal-300/40 hover:text-white"
                      }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">UPI</p>
                    <p className="mt-1 text-xs text-white/70">
                      {upiLink ? "Pay instantly via UPI app" : "Get UPI details via support"}
                    </p>
                  </button>
                ) : null}
              </div>
            </label>

            {installmentEligible ? (
              <label className="flex flex-col space-y-2 text-sm text-white/70">
                <span className="font-semibold text-white">Installment plan</span>
                <p className="text-xs text-white/55">
                  Need lower upfront payment? Choose more installments. Total price increases with each split.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {packageOptions.map((option) => {
                    const isSelected = option.id === selectedPackage?.id;
                    const previewAmount = packagePricePreviews[option.id];
                    const perInstallmentAmount = previewAmount?.perInstallmentLabel || option.label;
                    const totalAmount = previewAmount?.totalLabel || option.label;
                    const nonSelectedClass =
                      option.installmentCount >= 4
                        ? "border-amber-300/35 bg-amber-300/10 text-white/80 hover:border-amber-200/60"
                        : "border-white/20 bg-black/25 text-white/70 hover:border-teal-300/40 hover:text-white";
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedPackageId(option.id)}
                        aria-pressed={isSelected}
                        className={`rounded-2xl border p-4 text-left transition ${isSelected
                          ? "border-teal-200 bg-teal-300/20 text-teal-50 shadow-[0_0_0_1px_rgba(45,212,191,0.25)]"
                          : nonSelectedClass
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em]">{option.label}</p>
                          {option.badge ? (
                            <span className="rounded-full border border-teal-200/30 bg-teal-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-100">
                              {option.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {perInstallmentAmount}
                        </p>
                        <p className="mt-1 text-xs text-white/50">Per payment</p>
                        <p className="mt-2 text-xs text-white/65">
                          {option.installmentCount > 1
                            ? `${option.installmentCount} x payments`
                            : "1 x payment"}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Total payable: {totalAmount}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </label>
            ) : null}

            <label className="flex flex-col space-y-2 text-sm text-white/70">
              <span className="font-semibold text-white">Country</span>
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-300/60"
              >
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.name} className="bg-gray-900">
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200/80">
                  {installmentEligible ? "Per installment" : "Your investment"}
                </span>
                <span className="text-lg font-semibold text-white">
                  {amountDueLabel}
                </span>
              </div>
              {packagePricePreviews[selectedPackage?.id || ""]?.totalLabel ? (
                <p className="text-xs text-white/55">
                  Total payable: {packagePricePreviews[selectedPackage?.id || ""].totalLabel}
                </p>
              ) : null}
              {installmentEligible ? (
                <p className="text-xs text-white/60">
                  Installment plan: {selectedPackage?.label || "Pay in full"}
                </p>
              ) : null}
              <p className="text-xs text-white/60">
                {paymentMethod === "paypal"
                  ? "You will be redirected to PayPal to complete payment securely."
                  : paymentMethod === "upi"
                    ? upiLink
                      ? "You will be redirected to your UPI payment flow."
                      : "UPI instructions will be shared via support."
                    : "You'll be redirected to Stripe to complete your payment over a secure SSL connection."}
              </p>
              {showReferenceConversion ? (
                <p className="text-xs text-white/50">
                  Displayed in {selectedCountryCurrencyCode} using live exchange rates.
                </p>
              ) : null}
            </div>

            {error && <p className="text-sm font-medium text-rose-300">{error}</p>}


            {legalNotes.length ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-6 text-xs leading-relaxed text-white/70">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80">Consent required</p>
                {legalNotes.map((note, index) => (
                  <label key={note} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(acceptedLegalNotes[index])}
                      onChange={(event) =>
                        setAcceptedLegalNotes((previous) =>
                          previous.map((value, currentIndex) =>
                            currentIndex === index ? event.target.checked : value,
                          ),
                        )
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-black/30 text-teal-300 focus:ring-teal-300/70 hover:cursor-pointer"
                    />
                    <span>{note}</span>
                  </label>
                ))}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting || isActionBlocked}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-300 px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {getSubmitButtonText()}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-sm leading-relaxed text-white/70">
            <p>
              {item.checkoutFallbackMessage ||
                "Stripe checkout links for this offering are being finalised. Email me and you'll receive a private payment link or alternate option within minutes."}
            </p>
            {backupLink && (
              <a
                href={backupLink}
                className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-2 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/20"
              >
                {backupLabel}
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {manualInstructions.length ? (
        <div className="space-y-4 rounded-2xl border border-teal-300/25 bg-gradient-to-br from-teal-300/10 via-white/10 to-white/5 p-6 text-sm text-white/80">
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200/90">Need help completing payment?</h4>
          <p className="text-xs leading-relaxed text-white/70">
            If Stripe Checkout is unavailable, choose any alternate method below and we will confirm your order manually.
          </p>
          <ul className="space-y-3">
            {displayedManualInstructions.map((instruction) => (
              <li
                key={instruction}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 leading-relaxed"
              >
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
          {backupLink && (
            <a
              href={backupLink}
              target={isExternalLink(backupLink) ? "_blank" : undefined}
              rel={isExternalLink(backupLink) ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 self-start rounded-full border border-teal-300/40 bg-teal-300/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-200 hover:bg-teal-300/20"
            >
              {backupLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default PaymentSection;
