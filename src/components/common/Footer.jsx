const footerLinks = [
  {
    heading: "Explore",
    links: [
      { label: "About", href: "#about" },
      { label: "Programs", href: "#programs" },
      { label: "Experiences", href: "#services" },
      { label: "Testimonials", href: "#testimonials" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/highfrequencies11/" },
      { label: "YouTube", href: "https://www.youtube.com/@nehalpatelishere" },
      { label: "Podcast", href: "https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n" },
      { label: "Amazon Store", href: "https://www.amazon.ca/shop/bookescape_?ref_=cm_sw_r_cp_mwn_aipsfshop_aipsfbookescape__PBB131SY1HEHXB4D7YG2_1&language=en_US" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Email", href: "mailto:highfrequencies11@gmail.com" },
      { label: "Join the Newsletter", href: "#newsletter" },
      { label: "Book a Call", href: "#contact" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-brand-dark py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm space-y-4">
            <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
              High Frequencies 11
            </span>
            <p className="text-lg text-white/70">
              Manifestation mentorship, somatic practices, and community support for leaders building miraculous lives.
            </p>
          </div>
          <div className="flex flex-1 gap-8">
            {footerLinks.map((group) => (
              <div key={group.heading} className="w-full sm:w-1/2 lg:w-1/3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                  {group.heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-base text-white/70 transition-colors hover:text-brand-primary-light"
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-sm text-white/50">
          © {new Date().getFullYear()} High Frequencies 11. All rights reserved. Built with love by Nehal Patel.
        </div>
      </div>
    </footer>
  );
};

export default Footer;