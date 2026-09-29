import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const CONSENT_COOKIE_KEY = 'site-cookie-consent';
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const readConsentCookie = () => {
  if (typeof document === 'undefined') return false;

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${CONSENT_COOKIE_KEY}=`));
};

const setConsentCookie = () => {
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${CONSENT_COOKIE_KEY}=accepted; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
};

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (readConsentCookie()) return;

    const revealBanner = () => {
      window.setTimeout(() => setIsVisible(true), 300);
    };

    if (document.readyState === 'complete') {
      revealBanner();
      return;
    }

    window.addEventListener('load', revealBanner, { once: true });
    return () => window.removeEventListener('load', revealBanner);
  }, []);

  const handleAccept = () => {
    setConsentCookie();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
      <div className="border-t border-white/10 bg-gradient-to-r from-slate-950/95 to-slate-900/95 px-5 py-4 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400/15 flex-shrink-0">
              <Cookie className="h-5 w-5 text-teal-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/90 leading-5">
                We use cookies to enhance your experience. Functional cookies are required for checkout, themes, and admin features.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <a href="/cookie-policy" className="text-sm font-medium text-teal-300 transition hover:text-teal-200 underline underline-offset-2">
              Cookie settings
            </a>
            <button
              onClick={handleAccept}
              className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-400"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
