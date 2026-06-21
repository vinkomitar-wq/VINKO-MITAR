import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../LanguageContext";

export default function FAQSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is included in the charter price?",
      answer:
        "Our standard charter includes the vessel, captain & crew, drinking water, seasonal fruits, snorkeling equipment, life jackets, and accident insurance. Some vessels also include a complimentary lunch or water toys (like paddleboards). Please check the specific vessel details.",
    },
    {
      question: "Can we bring our own food and alcohol?",
      answer:
        "Yes! You are welcome to bring your own food and alcoholic beverages. Most of our catamarans have iceboxes. However, please note that red wine may be restricted on some yachts to prevent staining.",
    },
    {
      question: "What is the cancellation policy?",
      answer:
        "A deposit is required to confirm your booking. Cancellations made more than 14 days before the charter date are fully refundable. Cancellations within 14 days may be subject to a fee. In case of severe weather (e.g., strong winds/waves deemed unsafe by the captain), we will reschedule or provide a full refund.",
    },
    {
      question: "Do I need to pay a National Park fee?",
      answer:
        "Some destinations like Phi Phi Islands, Phang Nga Bay, and Similan Islands require a National Park visitor fee, which is collected in cash on the day of the trip. The fee is usually around 400 THB per adult and 200 THB per child.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-slate-200 bg-white rounded-lg overflow-hidden shadow-xs"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-slate-800 pr-8">
              {faq.question}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
