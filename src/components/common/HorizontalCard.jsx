import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getBrowserRegion, getCountries, getUsdRates } from "../../services/marketData";
import { roundUpAestheticAmount } from "../../services/pricing";

function HorizontalCard({
  image,
  imageAlt = "card-image",
  title,
  subtitle,
  description,
  price,
  priceLabel,
  currency = "$",
  alternativeCurrency = "INR",
  alternativePrice,
  buttonText = "Book here",
  buttonLink = "#",
  maxDescriptionLength = 120,
  clickableCard = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [localCurrency, setLocalCurrency] = useState("USD");
  const [usdRates, setUsdRates] = useState(null);
  const navigate = useNavigate();

  const shouldTruncate = description && description.length > maxDescriptionLength;
  const displayDescription =
    shouldTruncate && !isExpanded ? `${description.slice(0, maxDescriptionLength)}...` : description;

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const isExternalLink =
    buttonLink.startsWith("http") || buttonLink.startsWith("mailto:");
  const isAnchorLink = buttonLink.startsWith("#");
  const isInternalRoute = !isAnchorLink && !isExternalLink && buttonLink.startsWith("/");
  const shouldShowImage = Boolean(image) && !hasImageError;
  const canClickCard = clickableCard && Boolean(buttonLink);

  const handleAnchorClick = (event) => {
    if (isAnchorLink) {
      event.preventDefault();
      const target = document.querySelector(buttonLink);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const triggerCardNavigation = () => {
    if (isInternalRoute) {
      navigate(buttonLink);
      return;
    }
    if (isAnchorLink) {
      const target = document.querySelector(buttonLink);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    if (isExternalLink) {
      window.open(buttonLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCardClick = (event) => {
    if (!canClickCard) {
      return;
    }
    const interactiveTarget = event.target.closest("a,button,input,textarea,select,[role='button'],[role='link']");
    if (interactiveTarget && interactiveTarget !== event.currentTarget) {
      return;
    }
    triggerCardNavigation();
  };

  const handleCardKeyDown = (event) => {
    if (!canClickCard) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    triggerCardNavigation();
  };

  useEffect(() => {
    let isMounted = true;
    const loadLocaleCurrency = async () => {
      const browserRegion = getBrowserRegion();
      if (!browserRegion) {
        return;
      }
      const countries = await getCountries();
      if (!isMounted || !countries?.length) {
        return;
      }
      const detected = countries.find((entry) => entry.code === browserRegion);
      const currencyCode = detected?.currencies?.[0];
      if (currencyCode) {
        setLocalCurrency(currencyCode);
      }
    };
    loadLocaleCurrency();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const normalizedPrice = useMemo(() => {
    if (price == null) {
      return null;
    }
    const numeric = Number(String(price).replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }, [price]);
  const normalizedPriceLabel = useMemo(() => {
    if (!priceLabel) {
      return "";
    }
    const compact = String(priceLabel).replace(/[^0-9.]/g, "");
    if (!compact) {
      return String(priceLabel);
    }
    const numeric = Number(compact);
    if (Number.isFinite(numeric) && numeric === 0) {
      return "";
    }
    return String(priceLabel);
  }, [priceLabel]);

  const localizedPriceLabel = useMemo(() => {
    if (normalizedPrice == null) {
      return "";
    }
    // Cards currently use USD as base price source.
    const isUsdBase = currency === "$" || currency?.toUpperCase?.() === "USD";
    if (!isUsdBase) {
      return `${currency} ${normalizedPrice}`;
    }
    const rate = localCurrency === "USD" ? 1 : usdRates?.[localCurrency];
    if (!rate) {
      const roundedUsd = roundUpAestheticAmount(normalizedPrice, "USD");
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(roundedUsd);
    }
    const converted = normalizedPrice * rate;
    const roundedConverted = roundUpAestheticAmount(converted, localCurrency);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: localCurrency,
      maximumFractionDigits: 2,
    }).format(roundedConverted);
  }, [currency, localCurrency, normalizedPrice, usdRates]);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur transition-all duration-300 ease-in-out md:flex-row ${
        canClickCard ? "cursor-pointer hover:-translate-y-1 hover:border-blue-400 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400" : ""
      }`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={canClickCard ? "link" : undefined}
      tabIndex={canClickCard ? 0 : undefined}
    >
      <div className="h-48 w-full shrink-0 md:h-auto md:w-2/5">
        <div className="h-full w-full overflow-hidden">
          {shouldShowImage ? (
            <img
              src={image}
              alt={imageAlt}
              className="h-full w-full object-cover object-center"
              loading="lazy"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
              No image
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[200px] flex-1 flex-col justify-between p-6">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-bold leading-tight text-white md:text-xl">{title}</h3>

          {subtitle && (
            <p className="mb-2 text-xs font-semibold text-gray-300 md:mb-3 md:text-sm">{subtitle}</p>
          )}

          {description && (
            <div className="mb-3 md:mb-4">
              <p className="text-xs font-medium leading-relaxed text-gray-300 md:text-sm">
                {displayDescription}
              </p>

              {shouldTruncate && (
                <button
                  onClick={toggleExpanded}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 md:text-sm"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>

        <div className="mt-auto flex items-center justify-between">
          {((normalizedPriceLabel && normalizedPriceLabel.trim()) || (typeof normalizedPrice === "number" && normalizedPrice > 0)) && (
            <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-white md:text-lg">
              {normalizedPriceLabel ? (
                <span>{normalizedPriceLabel}</span>
              ) : (
                <span>{localizedPriceLabel || `${currency} ${price}`}</span>
              )}
            </div>
          )}
          {buttonLink && (
            <>
              {isInternalRoute ? (
                <Link to={buttonLink} className="inline-block">
                  <button className="flex items-center gap-2 border-none bg-transparent text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 md:text-base">
                    {buttonText}
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </Link>
              ) : (
                <a
                  href={buttonLink}
                  onClick={handleAnchorClick}
                  target={isExternalLink ? "_blank" : undefined}
                  rel={isExternalLink ? "noopener noreferrer" : undefined}
                  className="inline-block"
                >
                  <button className="flex items-center gap-2 border-none bg-transparent text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 md:text-base">
                    {buttonText}
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HorizontalCard;
