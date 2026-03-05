import checkoutCatalog from "./checkoutCatalog.json";

const SUPPORT_EMAIL = "highfrequencies11@gmail.com";
const INTERAC_EMAIL = "nehalpatel755@gmail.com";

const getCheckoutOptions = (id) => {
  const config = checkoutCatalog[id];
  return config ? { ...config, productId: id } : null;
};

const standardLegalNotes = [
  "I acknowledge that Nehal Patel is a manifestation coach and energy reader, not a licensed mental health professional. The services provided are for spiritual and personal development purposes only and are not a substitute for professional mental health, medical, or legal advice. I understand that I am fully responsible for any decisions I make following the session.",
  "I understand and agree that all sales are final, and no refunds will be issued under any circumstances.",
];

const standardManualInstructions = [
  "If you do not want to retry Stripe, use the support button below and we will complete your order through an alternate payment method.",
  `For manual confirmation, email your payment receipt to: ${SUPPORT_EMAIL}`,
  "If you want to pay through Google Pay, email us and we will share the UPI ID with the exact amount.",
  `If you are in Canada, Interac is available at: ${INTERAC_EMAIL}.`,
];

const standardPaymentMethods = [
  "Visa / Mastercard",
  "American Express",
  "Apple Pay",
  "Google Pay",
  "UPI (India via Stripe)",
];

export const buySections = [
  {
    id: "coaching",
    title: "Coaching containers",
    description:
      "Personal, high-touch spaces that mirror the depth of the work we do together. Pick the rhythm that meets you right now and I will meet you in your inbox or on our call with grounded, miraculous guidance.",
    items: [
      {
        id: "become-a-new-you",
        title: "Personalised Coaching with me for 30 days",
        subtitle: "Immersive private mentorship (30 days)",
        summary:
          "Five calls, daily support, and custom meditations crafted for your desires. 1,111 $ or \u20B995,000 INR.",
        longDescription:
          "Step inside a 30-day portal of personalised coaching. We meet for five private calls, keep daily contact through email or DMs, and co-create meditations tailored to your desires so you anchor the new you in real time.",
        price: { usd: "1,111", inr: "95,000" },
        priceLabel: "$1,111 / \u20B995,000 INR",
        ctaLabel: "Become a new you",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Become%20a%20New%20You%20Mentorship`,
        manualSupport: {
          label: "Email me to arrange custom payment",
          link: `mailto:${SUPPORT_EMAIL}?subject=Become%20a%20New%20You%20Mentorship`,
        },
        checkoutOptions: getCheckoutOptions("become-a-new-you"),
        checkoutFallbackMessage:
          "If Stripe is unavailable for any reason, email me and I will manually issue a secure invoice in your preferred currency.",
        highlights: [
          "Five private calls plus daily voice/text support for 30 days",
          "Unlimited emails or DMs with personalised guidance",
          "Four meditations and rampages created specifically for your intentions",
        ],
        paymentMethods: [...standardPaymentMethods, "Manual invoice on request"],
        priceDetails: [
          { label: "Full mentorship investment", amount: "$1,111 USD or \u20B995,000 INR" },
        ],
        manualInstructions: [
          "Need to split the investment or pay via bank transfer? Email me for a secure manual invoice in USD or INR.",
          `Prefer UPI, Interac, or another method? Reach out at ${SUPPORT_EMAIL} and I'll share the steps right away.`,
          "You'll receive onboarding questions and scheduling links as soon as checkout is complete.",
        ],
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Immersion results",
          quote:
            "Thirty days with Nehal reset my entire reality. The daily touchpoints and custom meditations kept me anchored in my new identity.",
          author: "- J., Coaching Client",
        },
      },
      {
        id: "email-coaching",
        title: "Email Coaching With Me",
        subtitle: "Five Email Coaching",
        summary:
          "Personalized affirmations or rampages. According to your schedule. Personalized advice about manifesting.",
        longDescription:
          "Five deep-dive email exchanges tailored to your desires. Every reply includes custom affirmations, rampages, and detailed coaching you can revisit anytime.",
        price: { usd: "250", inr: "22,000" },
        priceLabel: "$250 / \u20B922,000 INR",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Email%20Coaching%20With%20Me`,
        checkoutOptions: getCheckoutOptions("email-coaching"),
        highlights: [
          "Five deep-dive email exchanges tailored to your desires",
          "Custom affirmations and rampages channelled just for you",
          "Receive detailed guidance you can revisit anytime",
        ],
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Five email coaching", currency: "USD", amount: "$250.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Success story",
          quote:
            "Five emails with Nehal created a complete shift. Every reply felt like a personal roadmap and I manifested the exact opportunity we mapped out.",
          author: "- A., Manifestation Client",
        },
      },
      {
        id: "single-audio-call",
        title: "Coaching With Me via Audio Call",
        subtitle: "Personal Coaching (One coaching call)",
        summary: "One audio call (1 hour): 155 $ or \u20B914,000 INR",
        longDescription:
          "A devoted hour of strategy, energetic calibration, and next steps. Perfect when you need potent, immediate support and a clear map forward.",
        price: { usd: "155", inr: "14,000" },
        priceLabel: "$155 / \u20B914,000 INR",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Coaching%20Audio%20Call`,
        checkoutOptions: getCheckoutOptions("single-audio-call"),
        highlights: [
          "A devoted hour of strategy, energetic calibration, and next steps",
          "Leave with a clear action map rooted in your dream reality",
          "Perfect when you need potent, immediate support",
        ],
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Audio coaching call", currency: "USD", amount: "$155.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Client breakthrough",
          quote:
            "One hour with Nehal cleared months of confusion. I left the call with a confident plan and a peaceful nervous system.",
          author: "- R., Audio Coaching Client",
        },
      },
      {
        id: "four-call-package",
        title: "Coaching With Me",
        subtitle: "A package of four audio calls",
        summary: "Four Coaching calls (Total 4 hours)",
        longDescription:
          "Four 60-minute calls across one month of transformation. We co-create rituals, maintain accountability, and anchor the results into your daily life.",
        price: { usd: "555", inr: "48,000" },
        priceLabel: "$555 / \u20B948,000 INR",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Four%20Session%20Coaching%20Package`,
        checkoutOptions: getCheckoutOptions("four-call-package"),
        highlights: [
          "Four 60-minute calls across one month of transformation",
          "Accountability, mindset regulation, and consistent energetic hygiene",
          "We co-create rituals so the results anchor in for life",
        ],
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Four-call coaching package", currency: "USD", amount: "$555.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Month-long evolution",
          quote:
            "Each week in the four-call container layered new miracles. By the final call I was already living in the reality we mapped out on day one.",
          author: "- M., Four Call Package Client",
        },
      },
      {
        id: "personalised-subliminal",
        title: "Personalised subliminal",
        subtitle: "Energetic audio coded just for you",
        summary:
          "Receive a custom subliminal infused with affirmations, reiki, and frequency work coded to your exact desires. Listen daily to accelerate your manifestations.",
        longDescription:
          "Share your intentions and I will compose a subliminal audio layered with reiki, energetic sound design, and subconscious affirmations specific to your vision.",
        priceLabel: "Custom investment provided on request",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Personalised%20Subliminal%20Creation`,
        highlights: [
          "Custom subliminal coded with your affirmations",
          "Reiki-charged frequencies for deeper subconscious work",
          "Delivered with guidance on how to use it for 21 days",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Client rave",
          quote:
            "The personalised subliminal had my manifestations pouring in within a week. It felt like it was speaking directly to my soul.",
          author: "- D., Custom Subliminal Client",
        },
      },
      {
        id: "manifest-for-you",
        title: "Manifest for you",
        subtitle: "Done-for-you manifestation ritual",
        summary:
          "I step into ceremony on your behalf to manifest the desire you submit. Includes audio update, affirmations, and integration guide.",
        longDescription:
          "Submit one desire and I will complete a full manifestation ritual for you with reiki, light language, and timeline work. You receive an update plus aligned actions to maintain the shift.",
        priceLabel: "Custom investment provided on request",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Manifest%20For%20You%20Request`,
        highlights: [
          "Done-for-you ritual with reiki and light language",
          "Personal audio recap with next aligned actions",
          "Includes affirmations so you keep the channel open",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Miracle delivered",
          quote:
            "Nehal manifested for me and the outcome appeared in 48 hours. The ritual audio still keeps me anchored in that timeline.",
          author: "- L., Manifest For You Client",
        },
      },
    ],
  },
  {
    id: "custom-meditation",
    title: "Custom creations",
    description:
      "Tailored rituals crafted only for you. Every word, sound, and energetic transmission is channelled for the desires you share.",
    items: [
      {
        id: "personalised-meditation",
        title: "Personalised meditation",
        subtitle: "Created exclusively for your manifestations",
        summary:
          "Two desires. I will make this meditation only for you. Adding affirmations that are perfect for you. Energy cleansing affirmations layered with high-frequency music with reiki and channeled energy. You can listen to this overnight. Results in 21 days or less.",
        longDescription:
          "Share two desires and I will design a meditation infused with reiki, energy cleansing, and hypnotic soundscapes. Listen overnight to let the reprogramming work while you sleep.",
        price: { usd: "250", inr: "22,000" },
        priceLabel: "$250 / \u20B922,000 INR",
        ctaLabel: "Available here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Personalised%20Meditation%20Request`,
        checkoutOptions: getCheckoutOptions("personalised-meditation"),
        highlights: [
          "Send me two desires and I design the entire journey",
          "Includes affirmations, reiki, and energy cleansing tailored to you",
          "Listen overnight to reprogram while you sleep",
        ],
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Custom meditation", currency: "USD", amount: "$250.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Client celebration",
          quote:
            "The personalised meditation sounded like my higher self speaking. I saw movement within 10 days of listening overnight.",
          author: "- P., Meditation Client",
        },
      },
    ],
  },
  {
    id: "meditations",
    title: "Meditations & rituals",
    description:
      "Instant-access immersions you can begin tonight. Each portal includes deep guidance plus the energetic amplification you asked for.",
    items: [
      {
        id: "aphrodite-ritual",
        title: "Aphrodite's Kiss of Beauty ritual",
        summary:
          "This is a divine transmission - a sacred kiss from Aphrodite, channeled through video to awaken your inner divine. With whispered affirmations and a ritual guide, you'll embody magnetic beauty, softness, and divine allure.",
        price: { usd: "22", inr: "2,000" },
        priceLabel: "$22 / \u20B92,000 INR",
        ctaLabel: "Details here!",
        purchase: {
          label: "Email to receive the ritual",
          link: `mailto:${SUPPORT_EMAIL}?subject=Aphrodite%E2%80%99s%20Kiss%20of%20Beauty%20Ritual`,
        },
        checkoutOptions: getCheckoutOptions("aphrodite-ritual"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Aphrodite's Kiss of Beauty ritual", currency: "USD", amount: "$22.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "Aphrodite's Kiss of Beauty",
            description:
              "An Energetic Beauty Ritual to Awaken Your Inner Goddess. Receive a sacred energetic kiss from Aphrodite through a channeled video ritual and magnetic affirmations. This is your invitation to embody divine radiance, softness, and sensual power.",
          },
          {
            heading: "You'll Learn:",
            items: [
              "How to receive a god/goddess energy transmission",
              "Ritual to activate beauty from within",
              "Affirmations that shift your energy and aura",
            ],
          },
          {
            heading: "You'll Awaken:",
            items: [
              "Magnetic self-worth and glow",
              "Divine confidence",
              "Energetic shifts that others instantly feel",
            ],
          },
        ],
        closingNotes: ["This isn't just a ritual - it's a remembrance.", "( Enroll now and say yes to your glow. ("],
        successStory: {
          heading: "Glow up feedback",
          quote: "Within days of starting the ritual, people kept complimenting my glow. I've never felt so radiant.",
          author: "- S., Beauty Ritual Client",
        },
      },
      {
        id: "trauma-release",
        title: "Removing trauma blocks meditation",
        summary:
          "Heal the blocks from your past. So, you can manifest your dream life with ease. In just 21 days, align with your highest self and watch the universe respond with miracles. (",
        price: { usd: "11", inr: "1,000" },
        priceLabel: "$11 / \u20B91,000 INR",
        ctaLabel: "Get it instantly here!",
        purchase: {
          label: "Email for instant access",
          link: `mailto:${SUPPORT_EMAIL}?subject=Removing%20Trauma%20Blocks%20Meditation`,
        },
        checkoutOptions: getCheckoutOptions("trauma-release"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Removing trauma blocks meditation", currency: "USD", amount: "$11.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "What You'll Learn:",
            items: [
              "How to go back to your childhood and heal your inner child",
              "How to remove the blocks between you and your desires",
              "Why your past shows up when you're manifesting someone or something",
              "How to connect with the universe so you can manifest faster and with ease",
              "How to shift into your highest timeline through daily practice",
            ],
          },
          {
            heading: "What Changes You Will Experience:",
            items: [
              "You'll stop letting your past hold you back from becoming your dream self",
              "You'll feel lighter in your soul and closer to God",
              "You'll start manifesting love, beauty, money, and joy - without resistance",
              "You'll experience instant shifts in your energy and mindset",
            ],
          },
          {
            heading: "How It Will Make Your Life Better:",
            items: [
              "You'll transform your relationship with others and with yourself",
              "You'll attract miracles and release the people or situations that once blocked you",
              "You'll feel deeply fulfilled, peaceful, and connected to your divine path",
              "You'll realize there is no such thing as impossible - the universe wants you to be rich, loved, happy, and beautiful.",
            ],
          },
        ],
        closingNotes: [
          "( This is your sign. The desires in your heart are visions of your dream reality.",
          "Let your guardian angel lead you home to it - starting now. =?",
        ],
        successStory: {
          heading: "Trauma release transformation",
          quote:
            "I felt blocks melting away in the first week. I'm manifesting with ease and finally feel light again.",
          author: "- N., Meditation Student",
        },
      },
      {
        id: "quantum-jump",
        title: "Quantum jump into your dream reality!",
        summary:
          "Quantum jump meditation + affirmations + Reiki. Shift to your dream reality. Dream body, dream career, dream partner, marriage, and becoming a master manifester. This bedtime meditation guides you to effortlessly quantum jump into your dream reality.",
        price: { usd: "44", inr: "4,000" },
        priceLabel: "$44 / \u20B94,000 INR",
        ctaLabel: "Available here!",
        purchase: {
          label: "Email to start your quantum jump",
          link: `mailto:${SUPPORT_EMAIL}?subject=Quantum%20Jump%20Meditation`,
        },
        checkoutOptions: getCheckoutOptions("quantum-jump"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Quantum jump meditation", currency: "USD", amount: "$44.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "Get started now!",
            items: [
              "How to impress your subconscious before sleep",
              "How to bring your desires to the surface effortlessly",
              "How to quantum jump into your dream reality while you rest",
            ],
          },
          {
            heading: "What It Will Do for You:",
            items: [
              "Speeds up manifestation using sleep-time reprogramming",
              "Clears blocks and rewires limiting beliefs naturally",
              "Aligns your energy with your dream life overnight",
            ],
          },
        ],
        closingNotes: [
          "( Your subconscious is most open before bed - start tonight and let your desires find you while you sleep.",
        ],
        successStory: {
          heading: "Quantum leap win",
          quote:
            "I listened nightly and landed my dream role in under a month. The meditation makes quantum jumping effortless.",
          author: "- J., Quantum Jump Student",
        },
      },
      {
        id: "manifest-sp",
        title: "Manifest your specific person",
        summary:
          "I will share here, how to manifest deep, committed love using over 250 powerful affirmations infused with Reiki energy. This guided meditation will transform your self-concept and attract obsessive, devoted love into your life.",
        price: { usd: "66", inr: "6,000" },
        priceLabel: "$66 / \u20B96,000 INR",
        ctaLabel: "Details here!",
        purchase: {
          label: "Email to receive the SP rampage",
          link: `mailto:${SUPPORT_EMAIL}?subject=Manifest%20Your%20Specific%20Person`,
        },
        checkoutOptions: getCheckoutOptions("manifest-sp"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Manifest your specific person meditation", currency: "USD", amount: "$66.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "Get started now!",
            items: [
              "How to use over 250 love-based affirmations to manifest your SP",
              "How to shift your energy using guided meditation + Reiki healing",
              "How to reprogram your self-concept to attract love effortlessly",
              "How to receive love, devotion, and commitment without chasing",
            ],
          },
          {
            heading: "What Changes It Will Drive:",
            items: [
              "Your SP will become obsessed, fully committed, and even want to marry you",
              "You'll start feeling truly desired, loved, and chosen",
              "Your self-worth and confidence will skyrocket",
              "You'll attract romantic gestures and 'prince/princess' treatment",
            ],
          },
          {
            heading: "How It Will Make Your Life Better:",
            items: [
              "You'll finally feel secure, adored, and emotionally fulfilled",
              "You'll start receiving love in unexpected, miraculous ways",
              "You'll radiate magnetic energy that draws in devotion from everyone",
              "You'll feel powerful, aligned, and deeply worthy of true love",
            ],
          },
        ],
        closingNotes: [
          "( Why buy now? The energy is already working for you the moment you say yes.",
          "Start today - and watch love chase you.",
        ],
        successStory: {
          heading: "Love manifested",
          quote:
            "Within two weeks my SP confessed their feelings and asked to make it official. The rampage shifted everything.",
          author: "- K., SP Manifestation Student",
        },
      },
      {
        id: "inner-child",
        title: "Inner child healing",
        summary:
          "This meditation with healing frequencies and affirmations heals your inner child, erasing childhood beliefs about money, relationships - transforming self-worth, mindset, and connections.",
        price: { usd: "33", inr: "3,000" },
        priceLabel: "$33 / \u20B93,000 INR",
        ctaLabel: "Available here!",
        purchase: {
          label: "Email to begin your healing",
          link: `mailto:${SUPPORT_EMAIL}?subject=Inner%20Child%20Healing%20Meditation`,
        },
        checkoutOptions: getCheckoutOptions("inner-child"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Inner child healing meditation", currency: "USD", amount: "$33.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "What You'll Learn:",
            items: [
              "How to heal your inner child with love, affirmations, and healing frequencies",
              "How childhood shapes your beliefs about money, relationships, and the Universe",
              "How to release and replace limiting beliefs with empowering ones",
            ],
          },
          {
            heading: "What It Will Do:",
            items: [
              "Heal emotional wounds holding you back",
              "Transform your self-worth, mindset, and relationships",
              "Open you to abundance, love, and peace",
            ],
          },
          {
            heading: "How Life Will Improve:",
            items: [
              "Feel lighter, freer, and more confident",
              "Attract healthier relationships and opportunities",
              "Live aligned with joy, love, and abundance",
            ],
          },
        ],
        closingNotes: [
          "( Why now? The sooner you heal, the sooner your dream life unfolds.",
          "Start today.",
        ],
        successStory: {
          heading: "Inner child restored",
          quote:
            "Listening daily helped me forgive my past and triple my income. My relationships feel safe and loving now.",
          author: "- T., Inner Child Student",
        },
      },
      {
        id: "good-luck-ritual",
        title: "Good luck ritual",
        summary:
          "A ceremonial meditation to magnetise good fortune, unexpected opportunities, and serendipitous breakthroughs in every area of your life.",
        price: { usd: "28", inr: "2,400" },
        priceLabel: "$28 / \u20B92,400 INR",
        ctaLabel: "Tap for details",
        purchase: {
          label: "Email for the good luck ritual",
          link: `mailto:${SUPPORT_EMAIL}?subject=Good%20Luck%20Ritual`,
        },
        checkoutOptions: getCheckoutOptions("good-luck-ritual"),
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "Good luck ritual", currency: "USD", amount: "$28.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        detailsSections: [
          {
            heading: "What You'll Receive:",
            items: [
              "Guided ritual audio with prosperity affirmations",
              "Energy transmission to attract synchronicities",
              "Daily integration prompts for 14 days",
            ],
          },
          {
            heading: "Why It Works:",
            items: [
              "Rewires your aura to expect good fortune",
              "Anchors gratitude so miracles meet you halfway",
              "Calls in aligned opportunities through reiki and sound",
            ],
          },
        ],
        closingNotes: [
          "( Say yes and let fortune find you in every room you enter.",
        ],
        successStory: {
          heading: "Lucky streak",
          quote:
            "The ritual brought unexpected cash, job offers, and so many synchronicities. My friends keep asking what changed!",
          author: "- E., Ritual Participant",
        },
      },
    ],
  },
  {
    id: "digital",
    title: "Digital resources",
    description:
      "Self-paced support you can download instantly and return to anytime you need a reminder of your power.",
    items: [
      {
        id: "sp-rampage-ebook",
        title: "SP rampage ebook",
        summary:
          "Affirmations list (250+) includes self-concept and SP affirmations rampage. 21 days course.",
        price: { usd: "30", inr: "3,000" },
        priceLabel: "$30 / \u20B93,000 INR",
        ctaLabel: "Request it here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=SP%20Rampage%20Ebook%20Request`,
        checkoutOptions: getCheckoutOptions("sp-rampage-ebook"),
        highlights: [
          "Receive a curated list of 250+ affirmations",
          "Follow a 21-day practice to anchor new beliefs",
          "Perfect companion to the Manifest Your Specific Person immersion",
        ],
        paymentMethods: standardPaymentMethods,
        priceDetails: [
          { label: "SP rampage ebook", currency: "USD", amount: "$30.00" },
        ],
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Reader results",
          quote:
            "The affirmations kept me in alignment. My SP mirrored the devotion word for word.",
          author: "- V., Ebook Reader",
        },
      },
    ],
  },
  {
    id: "energy-readings",
    title: "Energy & tarot readings",
    description:
      "Channeled guidance so you know exactly where your energy stands and how to realign fast.",
    items: [
      {
        id: "current-sp-energy",
        title: "Current energy of your specific person",
        summary:
          "Receive a detailed reading on where your specific person currently stands energetically, plus aligned actions to bring them closer.",
        priceLabel: "Investment shared upon booking",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Current%20SP%20Energy%20Reading`,
        highlights: [
          "Understand what your SP is feeling and projecting",
          "Receive aligned affirmations to shift the connection",
          "Delivered within 48 hours via email",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Energy clarity",
          quote:
            "The reading was so accurate and helped me know exactly what to affirm. Contact came in two days later.",
          author: "- B., Reading Client",
        },
      },
      {
        id: "monthly-check-in",
        title: "Monthly check-in",
        summary:
          "A monthly energetic audit with tarot and oracle guidance so you stay on top of your manifestations all month long.",
        priceLabel: "Subscription pricing shared via email",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Monthly%20Check-in%20Reading`,
        highlights: [
          "Full tarot + oracle spread delivered monthly",
          "Personalised action steps for the weeks ahead",
          "Includes voice note recap with affirmations",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Consistent momentum",
          quote:
            "Monthly check-ins keep me accountable and tuned in. Every month brings fresh breakthroughs.",
          author: "- C., Monthly Client",
        },
      },
      {
        id: "tarot-email",
        title: "Energy/tarot reading via one email",
        summary:
          "Ask one question and receive a detailed tarot reading with energetic coaching delivered straight to your inbox.",
        priceLabel: "Pricing shared upon booking",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Tarot%20Reading%20Email`,
        highlights: [
          "Detailed tarot spread answered within 48 hours",
          "Includes affirmations and aligned action steps",
          "Perfect when you desire quick clarity",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Inbox insight",
          quote:
            "The email reading answered every question and shifted my perspective instantly.",
          author: "- H., Tarot Client",
        },
      },
      {
        id: "tarot-oracle-email",
        title: "Energy/tarot reading + Oracle in depth guidance via one email",
        summary:
          "An extended tarot and oracle reading with layered channeling, personalised affirmations, and step-by-step guidance.",
        priceLabel: "Pricing shared upon booking",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Tarot%20%2B%20Oracle%20Reading`,
        highlights: [
          "Deep-dive tarot + oracle spread",
          "Channelled guidance with integration roadmap",
          "Delivered as a comprehensive email PDF",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Depth and direction",
          quote:
            "The oracle guidance gave me a full roadmap. I felt completely seen and supported.",
          author: "- F., Oracle Client",
        },
      },
      {
        id: "tarot-audio-call",
        title: "Energy/tarot + Oracle reading via audio call (50 min)",
        summary:
          "A live 50-minute audio session blending tarot, oracle, and energetic coaching so you leave with clarity and action steps.",
        priceLabel: "Pricing shared upon booking",
        ctaLabel: "Book here",
        actionLink: `mailto:${SUPPORT_EMAIL}?subject=Tarot%20Audio%20Call`,
        highlights: [
          "Live 50-minute call with personalised reading",
          "Interactive Q&A plus next actions",
          "Recording delivered after the session",
        ],
        paymentMethods: standardPaymentMethods,
        manualInstructions: standardManualInstructions,
        legalNotes: standardLegalNotes,
        successStory: {
          heading: "Real-time revelation",
          quote:
            "The live call answered questions I didn't even know to ask. I left energised and ready to act.",
          author: "- G., Tarot Audio Client",
        },
      },
    ],
  },
];

export const offeringsIndex = buySections.reduce((acc, section) => {
  section.items.forEach((item) => {
    acc[item.id] = {
      ...item,
      section: { id: section.id, title: section.title, description: section.description },
    };
  });
  return acc;
}, {});

export const offeringSupportOptions = Object.values(offeringsIndex).map((offering) => offering.title);
