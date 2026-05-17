import {
  BookOpen,
  CreditCard,
  Heart,
  List,
  Mail,
  Mic,
  PenTool,
  ShoppingBag,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { defaultSiteSettings } from "../services/siteSettings";



const getInitials = (user) => {
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.name || "";
  const nameParts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = nameParts
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (initials || user?.email?.[0] || "A").toUpperCase();
};

const AccountAvatar = ({ user }) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-200/40 bg-teal-300/10 text-xs font-bold text-teal-100">
    {user?.profileImage ? (
      <img src={user.profileImage} alt={user?.name || "Account"} className="h-full w-full object-cover" />
    ) : (
      <span>{getInitials(user)}</span>
    )}
  </span>
);

const iconMap = {
  book: BookOpen,
  mic: Mic,
  pen: PenTool,
  mail: Mail,
  heart: Heart,
  shopping: ShoppingBag,
  list: List,
  credit: CreditCard,
};

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { settings, getLinks } = useSiteSettings();
  const siteSettings = settings || defaultSiteSettings;
  const quickPanelRef = useRef(null);
  const quickPanelButtonRef = useRef(null);
  const navRef = useRef(null);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);
  const toggleDrawer = useCallback(() => {
    setIsQuickPanelOpen(false);
    setIsDrawerOpen((previous) => !previous);
  }, []);
  const anchorLinks = siteSettings.sections
    .filter((section) => section.enabled && section.navVisible && section.anchor)
    .filter((link) => {
      const shopHref = siteSettings.brand.shopHref || "/#programs";
      return link.anchor !== shopHref && link.anchor !== `/${shopHref.replace(/^\//, "")}`;
    });

  const dynamicQuickLinkGroups = {
    content: {
      title: "Content & Media",
      items: getLinks("nav_content"),
    },
    community: {
      title: "Community & Updates",
      items: getLinks("nav_community"),
    },
    shopping: {
      title: "Shopping & Wishlist",
      items: getLinks("nav_shopping"),
    },
    support: {
      title: "Support",
      items: getLinks("nav_support"),
    },
  };

  const hasQuickLinks = Object.values(dynamicQuickLinkGroups).some(group => group.items.length > 0);

  useGSAP(
    () => {
      const root = navRef.current;
      if (!root) return;

      gsap.to(root, {
        backgroundColor: isScrolled ? "var(--site-brand-dark, rgba(3, 7, 18, 0.95))" : "rgba(3, 7, 18, 0)",
        boxShadow: isScrolled ? "0 12px 40px rgba(0, 0, 0, 0.3)" : "0 0 0 rgba(0, 0, 0, 0)",
        backdropFilter: isScrolled ? "blur(20px)" : "blur(0px)",
        borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0)",
        duration: 0.3,
        ease: "power2.out",
      });
    },
    { dependencies: [isScrolled] },
  );

  useGSAP(
    () => {
      if (isQuickPanelOpen) {
        gsap.set(quickPanelRef.current, { visibility: "visible", display: "block" });
        gsap.fromTo(
          quickPanelRef.current,
          { opacity: 0, scale: 0.95, y: -10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
        );

        gsap.fromTo(
          ".quick-group",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.1 }
        );

        gsap.fromTo(
          ".quick-item",
          { opacity: 0, x: -5 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", delay: 0.2 }
        );
      } else {
        gsap.to(quickPanelRef.current, {
          opacity: 0,
          scale: 0.95,
          y: -10,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(quickPanelRef.current, { visibility: "hidden" });
          },
        });
      }
    },
    { dependencies: [isQuickPanelOpen] }
  );

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Scrolled state for glassmorphism
      setIsScrolled(currentScrollY > 40);

      // Visibility state for hide-on-scroll
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      gsap.to(navRef.current, {
        y: isVisible ? 0 : -100,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { dependencies: [isVisible] }
  );

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeDrawer, isDrawerOpen]);

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
    closeDrawer();
  }, [closeDrawer, location]);

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
        ref={navRef}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${isScrolled
            ? "bg-black/40 backdrop-blur-xl border-b border-white/5 py-2"
            : "bg-transparent py-4"
          }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-2xl font-bold text-white tracking-tighter" onClick={closeDrawer}>
            {siteSettings.brand.navTitle}
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {anchorLinks.map((link) => (
              <a
                key={link.id}
                href={link.anchor}
                onClick={(event) => handleAnchorNavigation(event, link.anchor)}
                className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/50 transition-colors hover:text-teal-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {hasQuickLinks && (
              <button
                ref={quickPanelButtonRef}
                type="button"
                onClick={() => setIsQuickPanelOpen((previous) => !previous)}
                className={`h-11 inline-flex items-center gap-3 rounded-xl border px-6 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isQuickPanelOpen
                  ? "border-teal-300/30 bg-teal-300/10 text-teal-300"
                  : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                  }`}
              >
                Resources
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${isQuickPanelOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            <Link
              to="/sign-in"
              className="h-11 inline-flex items-center gap-3 rounded-xl border border-white/10 px-5 text-xs font-bold uppercase tracking-widest text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white"
            >
              <AccountAvatar user={user} />
              {accountLabel}
            </Link>

            <Link
              to={siteSettings.brand.shopHref}
              className="h-11 inline-flex items-center gap-2 rounded-xl bg-teal-300 px-6 text-xs font-bold uppercase tracking-widest text-black transition-all duration-300 hover:bg-teal-200 hover:-translate-y-0.5 active:scale-95 shadow-[0_10px_30px_rgba(45,212,191,0.2)]"
            >
              {siteSettings.brand.shopLabel}
            </Link>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 lg:hidden"
            onClick={toggleDrawer}
            aria-label="Toggle navigation"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white/60" />
              <span className="block h-0.5 w-6 bg-white/30" />
            </div>
          </button>
        </div>
      </nav>

      {/* Quick Access Panel */}
      <div
        className="fixed inset-0 z-40 hidden lg:block pointer-events-none"
        onClick={() => setIsQuickPanelOpen(false)}
      />

      <div
        ref={quickPanelRef}
        className="fixed right-6 top-24 z-50 hidden w-[28rem] max-h-[80vh] flex flex-col rounded-[2.5rem] border border-white/5 bg-gray-950/95 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl lg:block overflow-hidden"
        style={{ transformOrigin: 'top right', visibility: 'hidden', opacity: 0 }}
      >
        <div className="p-10 pb-4 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">Navigation</p>
            <h2 className="text-2xl font-bold text-white tracking-tight">Resource Hub</h2>
          </div>
          <button
            onClick={() => setIsQuickPanelOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-4 space-y-10">
          {Object.entries(dynamicQuickLinkGroups).map(([groupKey, group]) => {
            if (group.items.length === 0) return null;
            return (
              <div key={groupKey} className="quick-group space-y-5">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">{group.title}</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {group.items.map((item) => {
                    const isExternal = item.href.startsWith("http");
                    const Icon = iconMap[item.icon] || Mail;
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        onClick={(event) => handleQuickLinkNavigation(event, item.href)}
                        className="quick-item group flex items-center gap-5 rounded-2xl border border-white/[0.03] bg-white/[0.02] p-4 transition-all duration-300 hover:border-teal-300/30 hover:bg-teal-300/5"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-white/30 transition-all duration-300 group-hover:bg-teal-300/20 group-hover:text-teal-300 group-hover:scale-110">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-white/60 group-hover:text-white transition-colors block">{item.label}</span>
                          {isExternal && <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-teal-300/40">External Source</span>}
                        </div>
                        <div className="opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                          <svg className="w-5 h-5 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-10 pt-4 border-t border-white/5 shrink-0">
          <div className="relative group overflow-hidden rounded-2xl bg-teal-300/5 p-5 border border-white/5 transition-all duration-300 hover:border-teal-300/20">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-teal-300/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-teal-300" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-white/80">Personalized Support</p>
                <p className="text-white/40 font-medium mt-0.5">
                  Reach out at
                  <a className="ml-1 font-bold text-teal-300 hover:underline" href={`mailto:${siteSettings.brand.supportEmail}`}>
                    {siteSettings.brand.supportEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-navigation-drawer"
        className={`fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl transition-opacity duration-300 lg:hidden ${
          isDrawerOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      >
        <div
          className={`ml-auto flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-gray-950 transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="p-8 flex items-center justify-between border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300/80">Menu</p>
            <button
              onClick={closeDrawer}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 mb-6">Navigation</p>
              {anchorLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.anchor}
                  onClick={(event) => handleAnchorNavigation(event, link.anchor, true)}
                  className="drawer-item block text-2xl font-bold text-white/60 transition-colors hover:text-teal-300"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-6 flex flex-col gap-4">
                <Link
                  to={siteSettings.brand.shopHref}
                  onClick={closeDrawer}
                  className="drawer-item h-14 inline-flex items-center justify-center rounded-2xl bg-teal-300 text-sm font-bold uppercase tracking-widest text-black"
                >
                  {siteSettings.brand.shopLabel}
                </Link>
                <Link
                  to="/sign-in"
                  onClick={closeDrawer}
                  className="drawer-item h-14 inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-bold uppercase tracking-widest text-white/60"
                >
                  Account Access
                </Link>
              </div>
            </div>

            {Object.entries(dynamicQuickLinkGroups).map(([groupKey, group]) => {
              if (group.items.length === 0) return null;
              return (
                <div key={groupKey} className="drawer-item space-y-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{group.title}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map((item) => {
                      const Icon = iconMap[item.icon] || Mail;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={(event) => handleQuickLinkNavigation(event, item.href, true)}
                          className="flex items-center gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm font-bold text-white/60"
                        >
                          <span className="text-white/20"><Icon className="h-5 w-5" /></span>
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="drawer-item rounded-[2rem] border border-white/5 bg-teal-300/5 p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal-300 mb-4">Manifestation Support</p>
              <p className="text-sm text-white/40 leading-relaxed font-medium">
                Email
                <a href={`mailto:${siteSettings.brand.supportEmail}`} className="mx-1 font-bold text-white/80 hover:text-teal-300">
                  {siteSettings.brand.supportEmail}
                </a>
                to discuss your next quantum leap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
