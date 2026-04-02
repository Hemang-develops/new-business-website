import { Instagram, Mail, Music2, ShoppingBag, Youtube } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const iconMap = {
  instagram: Instagram,
  youtube: Youtube,
  music: Music2,
  mail: Mail,
  "shopping-bag": ShoppingBag,
};

const FooterGroup = ({ title, links }) => (
  <div className="min-w-[160px] flex-1">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/88">{title}</p>
    <div className="mt-5 flex flex-col gap-4">
      {links.map((link) => (
        <a
          key={`${title}-${link.key}`}
          href={link.href}
          target={link.href?.startsWith("http") ? "_blank" : undefined}
          rel={link.href?.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-[1.02rem] text-white/62 transition hover:text-brand-primary-light"
        >
          {link.label}
        </a>
      ))}
    </div>
  </div>
);

const Footer = () => {
  const { settings, getLinks } = useSiteSettings();
  const exploreLinks = settings.sections
    .filter((section) => section.enabled && section.footerVisible && section.anchor)
    .map((section) => ({ key: `explore-${section.id}`, label: section.label, href: section.anchor }));
  const offeringLinks = getLinks("footer_offerings");
  const resourceLinks = getLinks("footer_resources");
  const supportLinks = getLinks("footer_support");
  const socialLinks = getLinks("footer_social");

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-[#050608] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%)]" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-1/2 h-[20rem] w-[72rem] -translate-x-1/2 overflow-hidden text-center text-[clamp(6rem,22vw,20rem)] font-semibold uppercase tracking-[-0.08em] text-white/[0.04]">
        {settings.brand.navTitle || "HF11"}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-8 pt-14">
        <div className="flex flex-col gap-12 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/45">
              {settings.footer.introEyebrow}
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white">
              {settings.footer.introHeading}
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/58">{settings.brand.footerTagline}</p>
          </div>

          <div className="flex flex-1 flex-wrap gap-x-12 gap-y-10">
            <FooterGroup title="Explore" links={exploreLinks} />
            <FooterGroup title="Offerings" links={offeringLinks} />
            <FooterGroup title="Resources" links={resourceLinks} />
            <FooterGroup title="Support" links={supportLinks} />
          </div>

          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => {
              const Icon = iconMap[link.icon] || Mail;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  target={link.href?.startsWith("http") ? "_blank" : undefined}
                  rel={link.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-brand-primary-light hover:bg-white/[0.06] hover:text-brand-primary-light"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="relative flex flex-col gap-4 border-t border-white/8 pt-6 text-sm text-white/46 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <span>© {new Date().getFullYear()} {settings.brand.fullTitle}.</span>
            <a href={settings.footer.termsHref} className="transition hover:text-brand-primary-light">
              {settings.footer.termsLabel}
            </a>
            <a href={settings.footer.privacyHref} className="transition hover:text-brand-primary-light">
              {settings.footer.privacyLabel}
            </a>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-white/62">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-primary shadow-[0_0_18px_var(--site-brand-primary)]" />
            {settings.footer.statusLabel}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
