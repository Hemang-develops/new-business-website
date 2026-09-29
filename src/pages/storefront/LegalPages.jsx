import { useSiteSettings } from "../../context/SiteSettingsContext";
import LegalPage from "./LegalPage";

export const PrivacyPolicyPage = () => {
  const { settings } = useSiteSettings();
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This privacy policy explains how we collect, use, and protect your information when you use our website."
      docUrl={settings?.legal?.privacyPolicyDocUrl}
      sections={[
        {
          heading: "Information we collect",
          body: [
            "We collect information you provide directly, such as your name, email address, and payment details when you buy an offering or create an account.",
            "We also collect limited technical information, such as browser details and usage patterns, to keep the site secure and improve your experience.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "We use your information to deliver products and services, communicate about orders and support requests, and maintain account security.",
            "We may also use your contact information to send service-related or transactional communications that are necessary for your purchase or account.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You may request access to, correction of, or deletion of your personal information by contacting support.",
            "You can also unsubscribe from marketing emails at any time using the link in the email footer.",
          ],
        },
      ]}
    />
  );
};

export const TermsOfServicePage = () => {
  const { settings } = useSiteSettings();
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your access to and use of this website and its services."
      docUrl={settings?.legal?.termsOfServiceDocUrl}
      sections={[
        {
          heading: "Use of the site",
          body: [
            "You agree to use the site lawfully and not to misuse its services or content.",
            "You are responsible for keeping your account credentials secure.",
          ],
        },
        {
          heading: "Purchases and services",
          body: [
            "Digital products and coaching services are provided as described on the relevant offering page.",
            "Refunds are handled based on the applicable product terms and the platform policies in effect at the time of purchase.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "We are not liable for indirect, incidental, or consequential damages arising from the use of the website or services.",
            "These terms are intended to be interpreted in a fair and reasonable manner.",
          ],
        },
      ]}
    />
  );
};

export const CookiePolicyPage = () => {
  const { settings } = useSiteSettings();
  return (
    <LegalPage
      title="Cookie Policy"
      intro="This cookie policy explains how we use cookies and similar technologies on our website."
      docUrl={settings?.legal?.cookiePolicyDocUrl}
      sections={[
        {
          heading: "What are cookies?",
          body: [
            "Cookies are small files stored on your device that help websites remember information about your visit.",
            "They help us provide a smoother experience, remember your choices, and understand how the site performs.",
          ],
        },
        {
          heading: "How we use them",
          body: [
            "We use cookies to keep the site functioning properly, remember your preferences, and improve performance.",
            "We also use basic analytics and support tools where appropriate to understand site usage.",
          ],
        },
        {
          heading: "Managing preferences",
          body: [
            "You can manage or delete cookies through your browser settings.",
            "If you disable certain cookies, some features of the website may not work as intended.",
          ],
        },
      ]}
    />
  );
};
