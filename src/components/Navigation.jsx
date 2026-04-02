import {
  BookOpen,
  CircleUserRound,
  CreditCard,
  Heart,
  List,
  Mail,
  Mic,
  PenTool,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";

const quickLinkGroups = {
  content: {
    title: "Content & Media",
    items: [
      {
        name: "Books and Journals",
        href: "https://www.amazon.ca/shop/bookescape_/list/3PDNUMMTE0PL6?ref_=cm_sw_r_apann_aipsflist_H4V2XXVECVSZ2MTY13RG&language=en_US",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        name: "Podcast",
        href: "https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n",
        icon: <Mic className="h-5 w-5" />,
      },
      {
        name: "Blog",
        href: "https://www.instagram.com/highfrequencies11/",
        icon: <PenTool className="h-5 w-5" />,
      },
    ],
  },
  community: {
    title: "Community & Updates",
    items: [
      {
        name: "Newsletter",
        href: "#newsletter",
        icon: <Mail className="h-5 w-5" />,
      },
      {
        name: "Free gift",
        href: "#newsletter",
        icon: <Heart className="h-5 w-5" />,
      },
    ],
  },
  shopping: {
    title: "Shopping & Wishlist",
    items: [
      {
        name: "Amazon Storefront",
        href: "https://www.amazon.ca/shop/bookescape_?ref_=cm_sw_r_cp_mwn_aipsfshop_aipsfbookescape__PBB131SY1HEHXB4D7YG2_1&language=en_US",
        icon: <ShoppingBag className="h-5 w-5" />,
      },
      {
        name: "My Wishlist",
        href: "https://www.amazon.ca/hz/wishlist/ls/3S2LVE1XECZ46?ref_=wl_share",
        icon: <List className="h-5 w-5" />,
      },
    ],
  },
  support: {
    title: "Support",
    items: [
      {
        name: "Paypal",
        href: "https://www.paypal.com/paypalme/NehalPatel64",
        icon: <CreditCard className="h-5 w-5" />,
      },
    ],
  },
};

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();
  const quickPanelRef = useRef(null);
  const quickPanelButtonRef = useRef(null);
  const anchorLinks = settings.sections.filter((section) => section.enabled && section.navVisible && section.anchor);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isQuickPanelOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        quickPanelRef.current?.contains(target) ||
        quickPanelButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsQuickPanelOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsQuickPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuickPanelOpen]);

  useEffect(() => {
    setIsQuickPanelOpen(false);
  }, [location]);

  const handleAnchorNavigation = (event, href, closeMenu = false) => {
    event.preventDefault();

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: href });
    } else {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }

    if (closeMenu) {
      setIsDrawerOpen(false);
    }
    setIsQuickPanelOpen(false);
  };

  const handleQuickLinkNavigation = (event, href, closeMenu = false) => {
    if (href.startsWith("#")) {
      handleAnchorNavigation(event, href, closeMenu);
    } else if (closeMenu) {
      setIsDrawerOpen(false);
      setIsQuickPanelOpen(false);
    }
  };

  const accountLabel = isAuthenticated ? user?.name?.split(" ")?.[0] || "Account" : "Account";

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-gray-950/90 shadow-lg backdrop-blur" : "bg-transparent"
          }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold text-white" onClick={() => setIsDrawerOpen(false)}>
            {settings.brand.navTitle}
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {anchorLinks.map((link) => (
              <a
                key={link.id}
                href={link.anchor}
                onClick={(event) => handleAnchorNavigation(event, link.anchor)}
                className="text-sm font-medium tracking-[0.24em] text-white/70 transition-colors hover:text-teal-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              ref={quickPanelButtonRef}
              type="button"
              onClick={() => setIsQuickPanelOpen((previous) => !previous)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isQuickPanelOpen
                  ? "border-teal-300/70 bg-teal-300/10 text-teal-200"
                  : "border-white/20 text-white/80 hover:border-teal-300 hover:text-teal-200"
                }`}
            >
              Explore
              <svg
                className={`h-4 w-4 transition-transform ${isQuickPanelOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-teal-300 hover:text-teal-200"
            >
              <CircleUserRound className="h-4 w-4" />
              {accountLabel}
            </Link>
            <Link
              to={settings.brand.shopHref}
              className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              {settings.brand.shopLabel}
            </Link>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 lg:hidden"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
            </div>
          </button>
        </div>
      </nav>

      {isQuickPanelOpen ? (
        <>
          <div className="fixed inset-0 z-40 hidden lg:block" aria-hidden onClick={() => setIsQuickPanelOpen(false)} />
          <div
            ref={quickPanelRef}
            className="fixed right-6 top-24 z-50 hidden w-[24rem] rounded-3xl border border-white/10 bg-gray-950/95 p-6 shadow-2xl backdrop-blur lg:block"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Quick access</p>
            <div className="mt-4 space-y-5">
              {Object.entries(quickLinkGroups).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isExternal = item.href.startsWith("http");
                      const isAnchor = item.href.startsWith("#");

                      if (isAnchor) {
                        return (
                          <a
                            key={item.name}
                            href={item.href}
                            onClick={(event) => handleQuickLinkNavigation(event, item.href)}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm text-white/80 transition-colors hover:border-teal-300 hover:text-teal-200"
                          >
                            <span className="text-white/50">{item.icon}</span>
                            <span>{item.name}</span>
                          </a>
                        );
                      }

                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm text-white/80 transition-colors hover:border-teal-300 hover:text-teal-200"
                        >
                          <span className="text-white/50">{item.icon}</span>
                          <span>{item.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-teal-300/40 bg-teal-300/10 p-4 text-sm text-teal-100">
              Need support choosing an offering? Email
              <a className="ml-1 font-semibold" href={`mailto:${settings.brand.supportEmail}`}>
                {settings.brand.supportEmail}
              </a>
              .
            </div>
          </div>
        </>
      ) : null}

      <div
        className={`fixed inset-0 z-40 bg-gray-950/90 backdrop-blur transition-opacity duration-300 lg:hidden ${isDrawerOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
      >
        <div
          className={`ml-auto flex h-full w-full max-w-sm flex-col gap-8 border-l border-white/10 bg-gray-950 px-6 py-10 transition-transform duration-300 ${isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-white">Navigate</span>
            <button onClick={() => setIsDrawerOpen(false)} className="text-sm text-white/60">
              Close
            </button>
          </div>

          <div className="space-y-5">
            {anchorLinks.map((link) => (
              <a
                key={link.id}
                href={link.anchor}
                onClick={(event) => handleAnchorNavigation(event, link.anchor, true)}
                className="block text-base font-medium tracking-[0.28em] text-white/80 transition-colors hover:text-teal-200"
              >
                {link.label}
              </a>
            ))}
            <Link
              to={settings.brand.shopHref}
              onClick={() => setIsDrawerOpen(false)}
              className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2 text-sm font-semibold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              {settings.brand.shopLabel}
            </Link>
            <Link
              to="/sign-in"
              onClick={() => setIsDrawerOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-teal-300 hover:text-teal-200"
            >
              <CircleUserRound className="h-4 w-4" />
              {accountLabel}
            </Link>
          </div>

          <div className="space-y-8 overflow-y-auto pb-6">
            {Object.entries(quickLinkGroups).map(([groupKey, group]) => (
              <div key={groupKey}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">{group.title}</h3>
                <div className="mt-3 space-y-3">
                  {group.items.map((item) => {
                    const isExternal = item.href.startsWith("http");
                    const isAnchor = item.href.startsWith("#");

                    if (isAnchor) {
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={(event) => handleQuickLinkNavigation(event, item.href, true)}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:border-teal-300 hover:text-teal-200"
                        >
                          <span className="text-white/50">{item.icon}</span>
                          <span>{item.name}</span>
                        </a>
                      );
                    }

                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition-colors hover:border-teal-300 hover:text-teal-200"
                      >
                        <span className="text-white/50">{item.icon}</span>
                        <span>{item.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/60">Need a sign?</p>
            <p className="mt-2 text-sm">
              Email
              <a href={`mailto:${settings.brand.supportEmail}`} className="ml-1 text-teal-200">
                {settings.brand.supportEmail}
              </a>
              and let's talk about what you're manifesting.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
