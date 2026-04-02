alter table public.storefront_global_content
  add column if not exists brand_nav_title text,
  add column if not exists brand_full_title text,
  add column if not exists brand_footer_tagline text,
  add column if not exists brand_shop_label text,
  add column if not exists brand_shop_href text,
  add column if not exists brand_support_email text,
  add column if not exists theme_primary text,
  add column if not exists theme_primary_light text,
  add column if not exists theme_secondary text,
  add column if not exists theme_accent text,
  add column if not exists theme_dark text,
  add column if not exists profile_image_url text,
  add column if not exists profile_image_alt text,
  add column if not exists profile_role_label text,
  add column if not exists footer_intro_eyebrow text,
  add column if not exists footer_intro_heading text,
  add column if not exists footer_status_label text,
  add column if not exists footer_terms_label text,
  add column if not exists footer_terms_href text,
  add column if not exists footer_privacy_label text,
  add column if not exists footer_privacy_href text,
  add column if not exists newsletter_form_action text;

create table if not exists public.storefront_site_sections (
  key text primary key,
  label text not null,
  anchor text not null,
  is_enabled boolean not null default true,
  show_in_nav boolean not null default false,
  show_in_footer boolean not null default false,
  sort_order integer not null default 0,
  eyebrow text,
  heading text,
  description text,
  description_secondary text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  supporting_eyebrow text,
  supporting_heading text,
  supporting_description text,
  supporting_note text,
  form_heading text,
  form_description text,
  form_submit_label text,
  form_disclaimer text,
  form_action text,
  featured_offering_id text
);

alter table public.storefront_site_sections
  add column if not exists description_secondary text,
  add column if not exists supporting_eyebrow text,
  add column if not exists supporting_heading text,
  add column if not exists supporting_description text,
  add column if not exists supporting_note text,
  add column if not exists form_heading text,
  add column if not exists form_description text,
  add column if not exists form_submit_label text,
  add column if not exists form_disclaimer text,
  add column if not exists form_action text,
  add column if not exists featured_offering_id text;

create table if not exists public.storefront_site_section_items (
  key text primary key,
  section_key text not null references public.storefront_site_sections(key) on delete cascade,
  item_type text not null default 'card',
  title text,
  description text,
  label text,
  href text,
  icon text,
  image_url text,
  image_alt text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true
);

alter table public.storefront_site_section_items
  drop constraint if exists storefront_site_section_items_item_type_chk;

alter table public.storefront_site_section_items
  add constraint storefront_site_section_items_item_type_chk
  check (item_type in ('card', 'metric', 'link', 'benefit'));

create table if not exists public.storefront_site_links (
  key text primary key,
  group_key text not null,
  label text not null,
  value text,
  href text,
  icon text,
  sort_order integer not null default 0,
  is_enabled boolean not null default true
);

alter table public.storefront_site_links
  drop constraint if exists storefront_site_links_group_key_chk;

alter table public.storefront_site_links
  add constraint storefront_site_links_group_key_chk
  check (group_key in ('contact', 'footer_offerings', 'footer_resources', 'footer_support', 'footer_social'));

insert into public.storefront_site_sections (
  key,
  label,
  anchor,
  is_enabled,
  show_in_nav,
  show_in_footer,
  sort_order,
  eyebrow,
  heading,
  description,
  description_secondary,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  supporting_eyebrow,
  supporting_heading,
  supporting_description,
  supporting_note,
  form_heading,
  form_description,
  form_submit_label,
  form_disclaimer,
  form_action,
  featured_offering_id
)
values
  ('hero', 'Hero', '#hero', true, false, false, 0, '', 'Quantum manifestation coaching for visionaries ready to lead themselves.', 'Hey love, I''m Nehal Patel. I help you manifest with integrity-honoring both the mystical and the practical. Together we create a sustainable, regulated, joyful path to your next level.', null, 'Explore offerings', '#programs', 'Book a discovery call', '#contact', null, null, null, null, null, null, null, null, null, null),
  ('about', 'About', '#about', true, true, true, 1, 'About the movement', 'A grounded spiritual practice for real-world transformation.', 'Manifestation work that blends devotion, nervous-system safety, and daily embodiment.', 'Whether you join for high-touch private mentorship, immersive audio coaching, or heart-led community circles, every offering is designed to amplify your energy and make manifestation practical, joyful, and deeply personal.', '', '', '', '', 'Around the world', 'Our users are building new realities globally', 'High Frequencies 11 supports clients across time zones, cultures, and chapters of life. The work may be personal, but the movement is international.', 'From North America to Europe, the Middle East, Africa, Asia, and Australia, our community keeps expanding through aligned support and word of mouth.', null, null, null, null, null, null),
  ('programs', 'Programs', '#programs', true, true, true, 2, 'Offerings', 'Choose the support that aligns with your season of growth.', 'Every option below is a living portal into your next reality. Select what resonates now and I will follow up with next steps within 24 hours.', null, '', '', '', '', null, null, null, null, null, null, null, null, null, null),
  ('services', 'Services', '#services', true, true, true, 3, 'The experience', 'What makes High Frequencies 11 different.', 'These pillars define every session, program, and resource we create. You will be seen, supported, and stretched into your next evolution.', null, '', '', '', '', null, null, null, null, null, null, null, null, null, null),
  ('testimonials', 'Testimonials', '#testimonials', true, true, true, 4, 'Testimonials', 'Words from the High Frequencies 11 collective.', 'Real people. Real timelines collapsing. Real lives transforming.', null, '', '', '', '', null, null, null, null, null, null, null, null, null, null),
  ('resources', 'Resources', '#resources', true, false, false, 5, 'Resources', 'Continue the frequency work between sessions.', 'A curated library of free and paid resources to support your practice.', null, '', '', '', '', null, null, null, null, null, null, null, null, null, null),
  ('coaching', 'Coaching CTA', '#coaching', true, false, false, 6, 'Click down below for personalised one-on-one coaching', 'Personalised Coaching with me for 30 days', 'Private high-touch mentorship to collapse timelines and support your full embodiment.', null, 'Become a new you here', '', '', '', 'Investment', null, null, '30 days • private Voxer/email support • personalised meditations', null, null, null, null, null, 'become-a-new-you'),
  ('contact', 'Contact', '#contact', true, true, true, 7, 'Connect', 'Ready to raise your frequency?', 'Tell me about the reality you are stepping into and how you desire to be supported. I respond to all inquiries within 48 hours Monday through Friday.', null, '', '', '', '', null, null, null, null, 'Share your intentions', 'This form lands directly in my inbox. Share your story, desires, and what kind of support you are calling in.', 'Send message', 'By submitting this form you agree to receive occasional updates about High Frequencies 11 offerings. You can opt out at any time.', null, null),
  ('newsletter', 'Newsletter', '#newsletter', true, false, true, 8, 'The Frequency Drop', 'Stay plugged into the vortex.', 'Receive monthly energy reports, journal prompts, and VIP offers.', null, 'Join now', '', '', '', null, null, null, 'No spam. Just potent reminders.', null, null, null, null, 'https://formspree.io/f/xovqwaaw', null)
on conflict (key) do update
set
  label = excluded.label,
  anchor = excluded.anchor,
  is_enabled = excluded.is_enabled,
  show_in_nav = excluded.show_in_nav,
  show_in_footer = excluded.show_in_footer,
  sort_order = excluded.sort_order;

insert into public.storefront_site_section_items (key, section_key, item_type, title, description, label, href, icon, sort_order, is_enabled)
values
  ('hero-proof-strategy', 'hero', 'card', 'Aligned Strategy', 'Energetic calibrations paired with tangible daily actions.', null, null, null, 0, true),
  ('hero-proof-discipline', 'hero', 'card', 'Sacred Discipline', 'Rituals that keep you grounded while your manifestations unfold.', null, null, null, 1, true),
  ('hero-proof-support', 'hero', 'card', 'Devoted Support', 'A coach, cheerleader, and mirror as you lead your divine mission.', null, null, null, 2, true),
  ('about-metric-clients', 'about', 'metric', '1,000+', 'souls supported through sessions, workshops, and digital communities', null, null, null, 0, true),
  ('about-metric-years', 'about', 'metric', '8+ years', 'of practical manifestation and mindset coaching experience', null, null, null, 1, true),
  ('about-metric-global', 'about', 'metric', 'Global', 'clients from 15 countries united by the High Frequencies 11 movement', null, null, null, 2, true),
  ('services-practice', 'services', 'card', 'Somatic & Energetic Practices', 'Breathwork, tapping, and body-led rituals that keep your nervous system anchored while you quantum leap.', null, null, 'sparkles', 0, true),
  ('services-frameworks', 'services', 'card', 'Manifestation Frameworks', 'Signature High Frequencies 11 methods that blend neuroscience with spiritual teachings for tangible shifts.', null, null, 'layers', 1, true),
  ('services-resources', 'services', 'card', 'Lifetime-Ready Resources', 'Journals, guided meditations, and replay libraries you can return to whenever you need a frequency boost.', null, null, 'library', 2, true),
  ('services-community', 'services', 'card', 'Community & Accountability', 'Monthly circles, private Voxer channels, and global members who are walking the same path by your side.', null, null, 'users', 3, true),
  ('resources-podcast', 'resources', 'link', 'Podcast: High Frequencies 11', 'Weekly activations, channelled messages, and conversations about manifestation, mindset, and miracles.', 'Listen on Spotify', 'https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n', null, 0, true),
  ('resources-youtube', 'resources', 'link', 'YouTube: @nehalpatelishere', 'Binge long-form trainings, rituals, and intimate vlogs that make manifestation feel like your daily rhythm.', 'Subscribe on YouTube', 'https://www.youtube.com/@nehalpatelishere', null, 1, true),
  ('resources-amazon', 'resources', 'link', 'Amazon Storefront', 'Shop the exact books, candles, and ritual tools I use to stay anchored in a high frequency every day.', 'View the list', 'https://www.amazon.ca/shop/bookescape_?ref_=cm_sw_r_cp_mwn_aipsfshop_aipsfbookescape__PBB131SY1HEHXB4D7YG2_1&language=en_US', null, 2, true),
  ('resources-newsletter', 'resources', 'link', 'Newsletter & Free Gifts', 'Receive monthly energy forecasts, journal prompts, and pop-up offers that keep you plugged into the vortex.', 'Join the list', '#newsletter', null, 3, true),
  ('coaching-benefit-1', 'coaching', 'benefit', 'Personalised Coaching with me for 30 days', null, null, null, null, 0, true),
  ('coaching-benefit-2', 'coaching', 'benefit', '5 calls with me', null, null, null, null, 1, true),
  ('coaching-benefit-3', 'coaching', 'benefit', 'Unlimited emails or DMs', null, null, null, null, 2, true),
  ('coaching-benefit-4', 'coaching', 'benefit', '4 personalized meditations/ rampages', null, null, null, null, 3, true),
  ('coaching-benefit-5', 'coaching', 'benefit', 'Support for self-concept, mastery, luck, beauty, money, love, and dissolving every block', null, null, null, null, 4, true),
  ('coaching-benefit-6', 'coaching', 'benefit', 'Manifestation techniques tailored to you including portal visualisations, EFT, and parts work', null, null, null, null, 5, true),
  ('coaching-benefit-7', 'coaching', 'benefit', 'Daily Affirmations', null, null, null, null, 6, true),
  ('coaching-benefit-8', 'coaching', 'benefit', 'Guided meditations', null, null, null, null, 7, true),
  ('coaching-benefit-9', 'coaching', 'benefit', '30 days of consistent energetic accountability', null, null, null, null, 8, true)
on conflict (key) do nothing;

insert into public.storefront_site_links (key, group_key, label, value, href, icon, sort_order, is_enabled)
values
  ('contact-email', 'contact', 'Email', 'highfrequencies11@gmail.com', 'mailto:highfrequencies11@gmail.com', 'mail', 0, true),
  ('contact-instagram', 'contact', 'Instagram', '@highfrequencies11', 'https://www.instagram.com/highfrequencies11/', 'instagram', 1, true),
  ('contact-youtube', 'contact', 'YouTube', '@nehalpatelishere', 'https://www.youtube.com/@nehalpatelishere', 'youtube', 2, true),
  ('footer-offerings-programs', 'footer_offerings', 'Programs', null, '#programs', null, 0, true),
  ('footer-offerings-services', 'footer_offerings', 'Services', null, '#services', null, 1, true),
  ('footer-offerings-coaching', 'footer_offerings', '1:1 Coaching', null, '#coaching', null, 2, true),
  ('footer-offerings-resources', 'footer_offerings', 'Resources', null, '#resources', null, 3, true),
  ('footer-offerings-testimonials', 'footer_offerings', 'Testimonials', null, '#testimonials', null, 4, true),
  ('footer-resources-instagram', 'footer_resources', 'Instagram', null, 'https://www.instagram.com/highfrequencies11/', 'instagram', 0, true),
  ('footer-resources-youtube', 'footer_resources', 'YouTube', null, 'https://www.youtube.com/@nehalpatelishere', 'youtube', 1, true),
  ('footer-resources-podcast', 'footer_resources', 'Podcast', null, 'https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n', 'music', 2, true),
  ('footer-resources-amazon', 'footer_resources', 'Amazon Store', null, 'https://www.amazon.ca/shop/bookescape_?ref_=cm_sw_r_cp_mwn_aipsfshop_aipsfbookescape__PBB131SY1HEHXB4D7YG2_1&language=en_US', 'shopping-bag', 3, true),
  ('footer-support-contact', 'footer_support', 'Contact', null, '#contact', null, 0, true),
  ('footer-support-newsletter', 'footer_support', 'Newsletter', null, '#newsletter', null, 1, true),
  ('footer-support-call', 'footer_support', 'Book a Call', null, '#contact', null, 2, true),
  ('footer-support-shop', 'footer_support', 'Visit Shop', null, '/#programs', null, 3, true),
  ('footer-social-instagram', 'footer_social', 'Instagram', null, 'https://www.instagram.com/highfrequencies11/', 'instagram', 0, true),
  ('footer-social-youtube', 'footer_social', 'YouTube', null, 'https://www.youtube.com/@nehalpatelishere', 'youtube', 1, true),
  ('footer-social-podcast', 'footer_social', 'Podcast', null, 'https://open.spotify.com/show/02zFg2ejkXs1XHBo6teu5n', 'music', 2, true),
  ('footer-social-email', 'footer_social', 'Email', null, 'mailto:highfrequencies11@gmail.com', 'mail', 3, true)
on conflict (key) do nothing;
