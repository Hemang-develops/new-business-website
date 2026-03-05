import HorizontalCard from "./common/HorizontalCard";
import { useReveal } from '../hooks/useReveal';

const offeringGroups = [
  {
    title: "One-on-one coaching",
    description:
      "Intimate support designed to meet you where you are. Choose the container that matches your rhythm and receive tailored strategy, affirmations, and energetic calibration.",
    items: [
      {
        image:
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "journal, coffee and laptop on table",
        title: "Email Coaching With Me",
        subtitle: "Five email coaching",
        description:
          "Personalized affirmations or rampages, delivered according to your schedule with manifesting advice crafted just for you.",
        price: "250",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "22,000",
        buttonLink: "/buy/email-coaching",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "woman speaking on a phone call",
        title: "Coaching With Me via Audio Call",
        subtitle: "Personal coaching (one call)",
        description:
          "A devoted 60-minute audio call to calibrate your energy, refine your self-concept, and anchor a plan for the reality you are manifesting.",
        price: "155",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "14,000",
        buttonLink: "/buy/single-audio-call",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "notebook and headset for coaching call",
        title: "Coaching With Me",
        subtitle: "A package of four audio calls",
        description:
          "Four coaching calls (total 4 hours) so you stay accountable, regulated, and supported while you quantum leap into your dream life.",
        price: "555",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "48,000",
        buttonLink: "/buy/four-call-package",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "woman meditating with headphones",
        title: "Personalised Meditation",
        subtitle: "Two desires crafted only for you",
        description:
          "I’ll make this meditation only for you—layering energy cleansing affirmations, reiki, channeled energy, and high-frequency music you can loop overnight.",
        price: "250",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "22,000",
        buttonLink: "/buy/personalised-meditation",
        buttonText: "Available here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "headphones resting on open journal",
        title: "Personalised Subliminal",
        subtitle: "Energetic audio coded just for you",
        description:
          "Receive a custom subliminal infused with affirmations, reiki, and frequency work coded to your exact desires. Listen daily to accelerate manifestations.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/personalised-subliminal",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "ritual altar with candles",
        title: "Manifest For You",
        subtitle: "Done-for-you manifestation ritual",
        description:
          "Submit one desire and I will complete a full manifestation ritual for you with reiki, light language, and timeline work—plus an audio update and affirmations.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/manifest-for-you",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
    ],
  },
  {
    title: "Meditations (on sale)",
    description:
      "Instant-access immersions layered with reiki and hypnotic sound to rewire your subconscious as you rest.",
    items: [
      {
        image:
          "https://images.unsplash.com/photo-1523294587484-bae6cc870010?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "celestial imagery with woman visualising",
        title: "Quantum Jump to Dream Reality",
        subtitle: "Quantum jump + affirmations + Reiki",
        description:
          "Learn how to reprogram your subconscious in your sleep so you quantum jump into your dream body, career, partner, and master manifester timeline.",
        price: "44",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "4,000",
        buttonLink: "/buy/quantum-jump",
        buttonText: "Available here!",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1465146633011-14f8e0781093?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "woman journaling for healing",
        title: "Removing Trauma Blocks Meditation",
        subtitle: "Heal the blocks from your past",
        description:
          "Heal the situations or people you can't move on from so you manifest with ease. Expect powerful guided meditation, affirmations, and inner child healing in 21 days.",
        price: "11",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "1,000",
        buttonLink: "/buy/trauma-release",
        buttonText: "Get it instantly here!",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "woman relaxing with hand on heart",
        title: "Inner Child Healing Meditation",
        subtitle: "Heal your inner child & transform beliefs",
        description:
          "Go back to your childhood, heal your inner child, and transform the beliefs that shaped your money mindset, relationships, and self-worth.",
        price: "33",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "3,000",
        buttonLink: "/buy/inner-child",
        buttonText: "Available here!",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "woman applying beauty ritual with mirror",
        title: "Aphrodite’s Kiss of Beauty Ritual",
        subtitle: "A sacred kiss to awaken divine allure",
        description:
          "This divine transmission is a channeled video ritual with whispered affirmations so you embody magnetic beauty, softness, and irresistible allure.",
        price: "22",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "2,000",
        buttonLink: "/buy/aphrodite-ritual",
        buttonText: "Details here!",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "headphones resting on open journal",
        title: "Manifest Your Specific Person",
        subtitle: "SP rampage/meditation (250+ affirmations)",
        description:
          "Reprogram your subconscious with hypnotizing music, reiki, and 250+ affirmations so your specific person shows up deeply devoted and obsessed with you.",
        price: "66",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "6,000",
        buttonLink: "/buy/manifest-sp",
        buttonText: "Details here!",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "lucky charms and sparkling lights",
        title: "Good Luck Ritual",
        subtitle: "Call in synchronicities and fortune",
        description:
          "A ceremonial meditation to magnetise good fortune, unexpected opportunities, and serendipitous breakthroughs in every area of your life.",
        price: "28",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "2,400",
        buttonLink: "/buy/good-luck-ritual",
        buttonText: "Tap for details",
        maxDescriptionLength: 240,
      },
    ],
  },
  {
    title: "Energy & tarot readings",
    description:
      "Channeled guidance so you know exactly where your energy stands and how to realign fast.",
    items: [
      {
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "tarot spread with candles",
        title: "Current Energy of Your Specific Person",
        subtitle: "Pinpoint what your SP is feeling",
        description:
          "Receive a detailed reading on where your specific person currently stands energetically, plus aligned actions to bring them closer.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/current-sp-energy",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "tarot cards on cloth",
        title: "Monthly Check-in",
        subtitle: "Ongoing energetic audit",
        description:
          "A monthly energetic audit with tarot and oracle guidance so you stay on top of your manifestations all month long.",
        priceLabel: "Subscription pricing shared via email",
        buttonLink: "/buy/monthly-check-in",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1531263539449-56fdf29dfc4d?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "tarot reading notebook",
        title: "Energy/Tarot Reading via Email",
        subtitle: "One question, full guidance",
        description:
          "Ask one question and receive a detailed tarot reading with energetic coaching delivered straight to your inbox.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/tarot-email",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1512838243191-e81e8f66f1fd?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "oracle cards with crystals",
        title: "Energy/Tarot + Oracle In-depth Email",
        subtitle: "Extended channeled guidance",
        description:
          "An extended tarot and oracle reading with layered channeling, personalised affirmations, and step-by-step guidance.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/tarot-oracle-email",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
      {
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "oracle reading during audio call",
        title: "Energy/Tarot + Oracle Audio Call",
        subtitle: "50-minute live session",
        description:
          "A live 50-minute audio session blending tarot, oracle, and energetic coaching so you leave with clarity and action steps.",
        priceLabel: "Investment shared upon booking",
        buttonLink: "/buy/tarot-audio-call",
        buttonText: "Book here",
        maxDescriptionLength: 240,
      },
    ],
  },
  {
    title: "Digital rituals & resources",
    description:
      "Quick yet potent transmissions you can revisit anytime you want to amplify your magnetism and self-concept.",
    items: [
      {
        image:
          "https://images.unsplash.com/photo-1529234316406-31a017689551?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "open book with pen and flowers",
        title: "SP Rampage Ebook",
        subtitle: "250+ affirmations for self-concept & SP",
        description:
          "Affirmations list with self-concept and SP rampages plus a 21-day practice so you stay in the frequency of your desired relationship.",
        price: "30",
        currency: "$",
        alternativeCurrency: "INR",
        alternativePrice: "3,000",
        buttonLink: "/buy/sp-rampage-ebook",
        buttonText: "Request it here",
        maxDescriptionLength: 240,
      },
    ],
  },
];

const Programs = () => {
  return (
    <section id="programs" className="min-h-[calc(100vh-4rem)] pt-16 bg-gray-50 py-4 lg:py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-400">Offerings</p>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Choose the support that aligns with your season of growth.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            Every option below is a living portal into your next reality. Select what resonates now and I will follow up with next steps within 24 hours.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {offeringGroups.map((group) => (
            <div key={group.title}>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{group.title}</h3>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300">{group.description}</p>
              </div>
              <div className="mt-10 grid auto-rows-fr gap-8 md:grid-cols-2">
                {group.items.map((item) => {
                  const [ref, visible] = useReveal({ threshold: 0.2 });
                  return (
                    <div
                      key={item.title}
                      ref={ref}
                      className={`h-full transition-all duration-700 ease-out ${
                        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                      }`}
                    >
                      <HorizontalCard {...item} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
