import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { settings } = useSiteSettings();
  const faqs = settings?.faqs || [];

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-950 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1100px] flex flex-col md:flex-row gap-12 md:gap-24">
        {/* Left Side: Heading */}
        <div className="md:w-1/3 shrink-0">
          <h2 className="text-[2.75rem] sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
            Frequently<br />asked questions
          </h2>
        </div>
        
        {/* Right Side: Accordion */}
        <div className="flex-1 md:mt-2">
          <div className="divide-y divide-white/10">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className="py-6 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-start gap-5 text-left group focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="mt-0.5 flex-shrink-0 text-blue-500 transition-transform duration-300">
                      {isOpen ? <Minus className="h-5 w-5" strokeWidth={2} /> : <Plus className="h-5 w-5" strokeWidth={2} />}
                    </span>
                    <span className="text-[17px] sm:text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                      {faq.question}
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="pl-10 pr-4 text-[15px] leading-relaxed text-white/60">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
