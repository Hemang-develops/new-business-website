import { Instagram, Mail, Music2, ShoppingBag, Youtube } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { defaultSiteSettings } from "../../services/siteSettings";

const iconMap = {
  instagram: Instagram,
  youtube: Youtube,
  music: Music2,
  mail: Mail,
  "shopping-bag": ShoppingBag,
};

const FooterGroup = ({ title, links }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLinkClick = (event, href) => {
    if (href.startsWith('#')) {
      event.preventDefault();
      if (location.pathname !== "/") {
        navigate({ pathname: "/", hash: href });
      } else {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className="min-w-[140px] flex-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/40 mb-6">{title}</p>
      <div className="flex flex-col gap-4">
        {links.map((link) => {
          const isAnchorLink = link.href?.startsWith('#');
          const LinkComponent = isAnchorLink ? 'button' : 'a';

          return (
            <LinkComponent
              key={`${title}-${link.key}`}
              href={!isAnchorLink ? link.href : undefined}
              onClick={isAnchorLink ? (e) => handleLinkClick(e, link.href) : undefined}
              target={!isAnchorLink && link.href?.startsWith("http") ? "_blank" : undefined}
              rel={!isAnchorLink && link.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-white/60 transition-all duration-300 hover:text-teal-300 hover:translate-x-1 text-left inline-block w-fit"
            >
              {link.label}
            </LinkComponent>
          );
        })}
      </div>
    </div>
  );
};

const Footer = () => {
  const { settings, getLinks } = useSiteSettings();
  const siteSettings = settings || defaultSiteSettings;
  const exploreLinks = siteSettings.sections
    .filter((section) => section.enabled && section.footerVisible && section.anchor)
    .map((section) => ({ key: `explore-${section.id}`, label: section.label, href: section.anchor }));
  const offeringLinks = getLinks("footer_offerings");
  const resourceLinks = getLinks("footer_resources");
  const supportLinks = getLinks("footer_support");
  const socialLinks = getLinks("footer_social");

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-[#030406] text-white selection:bg-teal-300/30">
      {/* Visual Accents */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(45,212,191,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Large Background Watermark */}
      <div
        className="pointer-events-none absolute bottom-[-4rem] left-1/2 h-[22rem] w-full -translate-x-1/2 overflow-hidden text-center text-[clamp(8rem,25vw,26rem)] font-black uppercase tracking-[-0.05em] text-white/[0.04] select-none leading-none"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 60%)' }}
      >
        {siteSettings.brand.navTitle || "NEHAL"}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 mb-20">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-teal-400/60">
                {siteSettings.footer.introEyebrow}
              </p>
              <h2 className="text-4xl font-bold leading-tight text-white tracking-tight">
                {siteSettings.footer.introHeading}
              </h2>
              <p className="max-w-xs text-base leading-relaxed text-white/40 font-medium">
                {siteSettings.brand.footerTagline}
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-2 pt-4">
              {socialLinks.map((link) => {
                const Icon = iconMap[link.icon] || Mail;
                return (
                  <a
                    key={link.key}
                    href={link.href}
                    target={link.href?.startsWith("http") ? "_blank" : undefined}
                    rel={link.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={link.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition-all duration-300 hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-300 hover:-translate-y-1"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-12 sm:gap-8">
            <FooterGroup title="Explore" links={exploreLinks} />
            <FooterGroup title="Offerings" links={offeringLinks} />
            <FooterGroup title="Resources" links={resourceLinks} />
            <FooterGroup title="Support" links={supportLinks} />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative flex flex-col gap-6 border-t border-white/5 pt-10 text-[13px] font-medium text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            <span className="text-white/20 whitespace-nowrap">© {new Date().getFullYear()} {siteSettings.brand.fullTitle}</span>
            <a href={siteSettings.footer.termsHref} className="transition-colors hover:text-teal-300">
              {siteSettings.footer.termsLabel}
            </a>
            <a href={siteSettings.footer.privacyHref} className="transition-colors hover:text-teal-300">
              {siteSettings.footer.privacyLabel}
            </a>
          </div>

          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-white/40 transition-all hover:bg-white/[0.05] hover:border-white/10">
            <div className="relative flex h-2 w-2">
              <style>{`
                @keyframes smooth-pulse {
                  0%, 100% { transform: scale(1); opacity: 0.8; }
                  50% { transform: scale(2); opacity: 0; }
                }
              `}</style>
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-teal-400"
                style={{ animation: 'smooth-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
            </div>
            <span className="tracking-wide">{siteSettings.footer.statusLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
