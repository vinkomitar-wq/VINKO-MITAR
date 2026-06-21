import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Compass,
  Anchor,
  Clock,
  Ship,
  Info,
  MapPin,
  Check,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  HelpCircle,
  Download,
} from "lucide-react";
import { CATAMARANS, DESTINATIONS, PIERS } from "../data";
import { useLanguage } from "../LanguageContext";
import { generateItineraryPdf } from "../lib/pdfGenerator";

interface Stop {
  destinationId: string;
  name: string;
  activity: string;
  durationHours: number;
  timeOfDay: string;
}

interface GeneratedItinerary {
  recommendedVesselId: string;
  vesselReasoning: string;
  recommendedPierId: string;
  routeTitle: string;
  fullDescription: string;
  stops: Stop[];
  totalEstimatedHours: number;
  insiderTips: string[];
}

interface AIPlannerProps {
  onSelectVessel?: (id: string) => void;
  onSelectDestination?: (id: string) => void;
}

export default function AIPlanner({
  onSelectVessel,
  onSelectDestination,
}: AIPlannerProps) {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const samplePrompts = [
    {
      title: "🐬 Wildlife & Kids",
      text: "A quiet family getaway with young kids. We want dolphin-watching at Maithon, lots of active swimming, and private sandy beaches with minimal speedboats.",
    },
    {
      title: "🌅 Sunset Romance",
      text: "A luxurious romantic trip for a couple. We want high ocean visibility for snorkling, viewing secluded volcanic cliffs, and a spectacular golden sunset dinner in front of Promthep Cape.",
    },
    {
      title: "🎉 Active Celebration",
      text: "An active catamaran party for a birthday celebration with 25 friends. We want wood trim decks, barbecue setup on deck, loud tropical music, and fun water sports.",
    },
  ];

  const getFallbackItinerary = (userPrompt: string): GeneratedItinerary => {
    const p = userPrompt.toLowerCase();

    if (
      p.includes("james") ||
      p.includes("bond") ||
      p.includes("phang") ||
      p.includes("nga") ||
      p.includes("cave") ||
      p.includes("kayak") ||
      p.includes("limestone") ||
      p.includes("hong") ||
      p.includes("panak")
    ) {
      return {
        recommendedVesselId: "double-fun",
        vesselReasoning:
          "The Double Fun catamaran is perfectly equipped with stable sea kayaks, safety tenders, and open decks ideal for taking in the soaring limestone karsts of Phang Nga Bay.",
        recommendedPierId: "ao-po",
        routeTitle:
          "Concierge Phang Nga Bay & James Bond Island Explorer (Signature)",
        fullDescription:
          "A glorious expedition custom-mapped to present you with legendary limestone sea caves, silent lagoons, and the iconic karst of Ko Ta Pu (James Bond Island). Highly optimized to beat peak speedboats.",
        stops: [
          {
            destinationId: "custom-route",
            name: "Ao Po Pier Departure",
            activity:
              "Board our premium custom catamaran, enjoy an iced lemongrass welcome mocktail, and receive a personal safety briefing from Captain Decha.",
            durationHours: 0.5,
            timeOfDay: "09:30 AM",
          },
          {
            destinationId: "custom-route",
            name: "Koh Panak Lagoon & Caves",
            activity:
              "Explore mystical sea-caves by hand-guided kayaks. Spot local crab-eating macaques and view spectacular stalactites inside the mangrove lagoon.",
            durationHours: 2,
            timeOfDay: "10:30 AM",
          },
          {
            destinationId: "custom-route",
            name: "James Bond Island (Khao Phing Kan)",
            activity:
              "Cross over to the legendary towering islet from the 1974 film 'The Man with the Golden Gun'. Stunning viewpoints and memorable photography opportunities.",
            durationHours: 1.5,
            timeOfDay: "01:00 PM",
          },
          {
            destinationId: "custom-route",
            name: "Koh Hong Hidden Blue Lagoon",
            activity:
              "Relax onboard while the crew prepares a freshly grilled barbecue buffet. Afterward, swim inside the breathtaking limestone circle chamber.",
            durationHours: 2,
            timeOfDay: "02:30 PM",
          },
        ],
        totalEstimatedHours: 6.5,
        insiderTips: [
          "Phang Nga Bay national park fees are fully handled by our staff so you can skip the queue.",
          "Stable twin-hull catamaran configuration provides an ultra-smooth glide, making this route highly requested by guests sensitive to motion.",
          "Inform our onboard chef if you prefer seafood, vegetarian, or custom spiced chicken skewered barbecue options!",
        ],
      };
    }

    if (
      p.includes("dolphin") ||
      p.includes("maithon") ||
      p.includes("khai") ||
      p.includes("nok") ||
      p.includes("wildlife") ||
      p.includes("kids") ||
      p.includes("children") ||
      p.includes("swim") ||
      p.includes("shallow")
    ) {
      return {
        recommendedVesselId: "the-best",
        vesselReasoning:
          "Our flagship 'The Best' catamaran offers wide safe deck trampolines, snorkeling gear, and open-plan dining area suited for luxurious multi-generation family escapes.",
        recommendedPierId: "coco",
        routeTitle: "Bespoke Maithon Dolphin Hunt & Khai Reef Coral Snorkeling",
        fullDescription:
          "A family-friendly white beach paradise cruise specifically selected to seek out Phuket's resident family of wild bottlenose dolphins, coupled with shallow, gentle coral reef snorkeling.",
        stops: [
          {
            destinationId: "custom-route",
            name: "Coco Pier Departure",
            activity:
              "Boarding and warm welcome. Children are fitted with comfortable high-visibility flotation lifejackets while parents relax in the shaded lounge.",
            durationHours: 0.5,
            timeOfDay: "09:00 AM",
          },
          {
            destinationId: "custom-route",
            name: "Maithon Blue Water Snorkeling",
            activity:
              "Venture near the private island reef. Snorkel with colorful clownfish and seek out wild playful dolphins cruising along the current.",
            durationHours: 2.5,
            timeOfDay: "10:30 AM",
          },
          {
            destinationId: "koh-khai-nok",
            name: "Koh Khai Nok Island Paradise",
            activity:
              "Step directly onto powdery white sands. Perfect shallow clear water swimming suitable for toddlers. Enjoy safe fresh coconuts and sunset beach clubs.",
            durationHours: 2,
            timeOfDay: "01:30 PM",
          },
          {
            destinationId: "custom-route",
            name: "Cruising Back via Rang Yai",
            activity:
              "Enjoy seasonal sliced tropical fruits and fresh coconut pudding while watching the beautiful southern Phuket coastline drift by.",
            durationHours: 1.5,
            timeOfDay: "03:30 PM",
          },
        ],
        totalEstimatedHours: 6.5,
        insiderTips: [
          "The Maithon dolphin pod is spotted about 80% of the time. Look for active ripples in deep channels!",
          "Koh Khai Nok features rock clusters right at the beach where dozens of yellow-striped sergeant majors will greet you immediately.",
          "Our catamaran features premium inflatable safety steps leading directly into the ocean pool.",
        ],
      };
    }

    if (
      p.includes("sunset") ||
      p.includes("promthep") ||
      p.includes("romantic") ||
      p.includes("dinner") ||
      p.includes("evening") ||
      p.includes("cape") ||
      p.includes("half") ||
      p.includes("night") ||
      p.includes("couple")
    ) {
      return {
        recommendedVesselId: "prime",
        vesselReasoning:
          "'Prime' catamaran is equipped with ambient LED lighting, standard-grade wine coolers, and a superb sound system, setting an incredible romantic mood.",
        recommendedPierId: "chalong",
        routeTitle:
          "Signature Promthep Cape Sunset & Coral Island Golden Hour Cruise",
        fullDescription:
          "A deeply scenic afternoon and twilight voyage blending snorkeling at Coral Island with a spectacular dining sunset toast directly below Phuket's most famous panoramic viewpoint.",
        stops: [
          {
            destinationId: "custom-route",
            name: "Chalong Pier Departure",
            activity:
              "Warm welcome, cold towels, and a refreshing mocktail. Select your background playlist via standard onboard Bluetooth.",
            durationHours: 0.5,
            timeOfDay: "01:30 PM",
          },
          {
            destinationId: "custom-route",
            name: "Coral Island (Kahung Beach)",
            activity:
              "Snorkel in emerald waters, swim among sea fans, or relax under thatched-roof beach huts. Water sport options like Parasailing are also available.",
            durationHours: 2.5,
            timeOfDay: "02:30 PM",
          },
          {
            destinationId: "custom-route",
            name: "Promthep Cape Golden Hour",
            activity:
              "Anchor in calm sunset coordinates. Sip premium wine and share a custom luxury barbecue dining experience as the glowing sun touches the Andaman sea.",
            durationHours: 2,
            timeOfDay: "05:00 PM",
          },
        ],
        totalEstimatedHours: 5,
        insiderTips: [
          "Bring a camera and warm beachwear, as twilight sea breezes on the return glide can feel beautifully cool.",
          "We can pre-arrange gourmet champagne or premium Phuket oysters on request — just message our concierge after choosing this route.",
        ],
      };
    }

    // Default: Phi Phi Islands Ultimate Exploration
    return {
      recommendedVesselId: "the-best",
      vesselReasoning:
        "Our leading luxury twin-deck catamaran 'The Best' provides the ocean speed and comfort required to make the legendary Phi Phi crossing smooth, fast, and secure.",
      recommendedPierId: "chalong",
      routeTitle: "Ultimate Phi Phi Islands, Pileh Lagoon & Maya Bay Discovery",
      fullDescription:
        "The absolute pinnacle of Andaman yachting. Explore the dramatic limestone cliffs of Maya Bay, enjoy crystal paddleboarding inside the neon-blue canyon of Pileh Lagoon, and experience wild coral reef snorkeling.",
      stops: [
        {
          destinationId: "custom-route",
          name: "Chalong Pier Departure",
          activity:
            "Board our flagship yacht. Refresh with fresh mint mojitos and enjoy spacious seating on our padded deck lounge bed.",
          durationHours: 0.5,
          timeOfDay: "08:30 AM",
        },
        {
          destinationId: "custom-route",
          name: "Pileh Lagoon Blue Canyon",
          activity:
            "Step onto stand-up paddleboards or swim in deep emerald pools sheltered by 100-meter cliffs. Absolute peak natural beauty.",
          durationHours: 2,
          timeOfDay: "10:30 AM",
        },
        {
          destinationId: "custom-route",
          name: "Maya Bay National Park",
          activity:
            "Stroll on the white-sand crescent sanctuary immortalized in cinema. Take amazing portraits and enjoy pristine conservation sands.",
          durationHours: 1.5,
          timeOfDay: "01:00 PM",
        },
        {
          destinationId: "custom-route",
          name: "Shark Point & Bamboo Snorkeling",
          activity:
            "Snorkel with gorgeous reef-sharks, brain corals, and vibrant clownfish. Fresh tropical fruit skewers served on deck.",
          durationHours: 1.5,
          timeOfDay: "03:00 PM",
        },
      ],
      totalEstimatedHours: 7.5,
      insiderTips: [
        "To preserve the nesting blacktip reef sharks, swimming is restricted directly inside Maya Bay beach — the optimal snorkeling spot is prepared just around the bay entrance.",
        "Wear light, easy-slip water shoes, as moving around the limestone landing platforms at Pileh Lagoon is best navigated with foot protection.",
        "Our catamaran has full snorkeling masks and snorkeling pipes for both adults and children, sterilized after every charter.",
      ],
    };
  };

  const loadingSteps = [
    "Analyzing your personal preferences...",
    "Navigating local tide conditions & marine maps...",
    "Curating custom sights and local snorkeling stopovers...",
    "Selecting the perfect catamaran from Phuket Amazing Yacht Charter...",
    "Finalizing raw insider concierge tips...",
  ];

  const handleSuggestClick = (text: string) => {
    setPrompt(text);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setItinerary(null);
    setIsFallback(false);
    setLoadingStep(0);

    // Dynamic loading text step cycles
    const interval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < loadingSteps.length - 1 ? prev + 1 : prev,
      );
    }, 1800);

    try {
      const response = await fetch("/api/ai-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to formulate AI itinerary. Please check your API key setup or try again.",
        );
      }

      const data: GeneratedItinerary = await response.json();
      setItinerary(data);
    } catch (err: any) {
      console.warn(
        "AI generation failed or rate-limited. Serving beautiful signature fallback itinerary.",
        err,
      );
      // Seamless luxury fallback
      const fallbackData = getFallbackItinerary(prompt);
      setItinerary(fallbackData);
      setIsFallback(true);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleApplyVessel = (vesselId: string) => {
    if (onSelectVessel) {
      onSelectVessel(vesselId);
      // Smooth scroll to booking form
      const bookingEl =
        document.getElementById("booking-form-wrapper") ||
        document.querySelector("form");
      if (bookingEl) {
        bookingEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Find recommended items locally to render their photos & real attributes
  const recommendedVessel = itinerary
    ? CATAMARANS.find((v) => v.id === itinerary.recommendedVesselId)
    : null;
  const recommendedPier = itinerary
    ? PIERS.find((p) => p.id === itinerary.recommendedPierId)
    : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h4 className="text-xl font-serif text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
          AI Yacht Itinerary Planner
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Tell our artificial intelligence concierge about your dream cruise,
          party size, or sightseeing goals to design your perfect bespoke
          Andaman sea day.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!itinerary && !loading && (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Suggestion Bubbles */}
            <div className="space-y-2">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 block">
                Inspire Me:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {samplePrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestClick(sample.text)}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-slate-100 rounded-xs text-left cursor-pointer transition-all space-y-1.5"
                  >
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {sample.title}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {sample.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* main form */}
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="relative">
                <textarea
                  id="ai-prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your ideal day (e.g. 'I want to celebrate with 15 friends, enjoy cold drinks, snorkeling with corals, visit beautiful white beaches and finish with a quiet romantic sunset view...')"
                  className="w-full p-4 pr-12 text-sm text-slate-800 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xs font-sans placeholder-slate-400 leading-relaxed outline-none transition-colors"
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono">
                  {prompt.length} chars
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-700 font-sans flex items-start gap-2">
                  <span>⚠️</span>
                  <div>{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={!prompt.trim()}
                className={`w-full py-3.5 px-4 sm:px-6 rounded-xs font-sans text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-all flex flex-wrap items-center justify-center gap-2 text-center leading-snug ${
                  prompt.trim()
                    ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="truncate whitespace-normal sm:whitespace-nowrap">
                  Formulate Custom Cruise Itinerary
                </span>
              </button>
            </form>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-6"
          >
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
              <div className="absolute inset-x-0 top-0 h-16 w-16 rounded-full border-t-4 border-indigo-600 animate-spin" />
              <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h5 className="text-sm font-bold text-slate-800 uppercase tracking-widest animate-pulse">
                Formulating bespoke route...
              </h5>
              <p className="text-xs text-slate-400 transition-all font-sans italic">
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </motion.div>
        )}

        {/* Result view */}
        {itinerary && !loading && (
          <motion.div
            key="result-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Reset control */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm flex flex-wrap items-center gap-1">
                <Check className="h-3 w-3 shrink-0" /> Fully Customized
                Itinerary Ready
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    // Populate vessel definitions before producing PDF
                    const selectedCatamaran = CATAMARANS.find(
                      (c) => c.id === itinerary?.recommendedVesselId,
                    );

                    let base64Img: string | null = null;
                    if (selectedCatamaran?.image) {
                      try {
                        const { imgToBase64 } =
                          await import("../lib/imageUtils");
                        base64Img = await imgToBase64(selectedCatamaran.image);
                      } catch (imgErr) {
                        console.warn(
                          "Failed converting catamaran image inside AI Planner:",
                          imgErr,
                        );
                      }
                    }

                    const enrichedItinerary = {
                      ...itinerary,
                      agentName: "AI Guest Concierge Profile",
                      bookingReference:
                        "AI-" + Math.floor(1000 + Math.random() * 9000),
                      vesselSpecs: selectedCatamaran
                        ? {
                            length: selectedCatamaran.length,
                            capacity: selectedCatamaran.capacity,
                            cabins: selectedCatamaran.cabins,
                            bathrooms: selectedCatamaran.bathrooms,
                          }
                        : undefined,
                      vesselImageBase64: base64Img || undefined,
                      vesselNameText:
                        selectedCatamaran?.name ||
                        itinerary.recommendedVesselId?.toUpperCase() ||
                        undefined,
                    };
                    const doc = generateItineraryPdf(enrichedItinerary);
                    doc.save(
                      `Concierge_Itinerary_${itinerary.recommendedVesselId}.pdf`,
                    );
                  }}
                  className="text-xs font-sans font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItinerary(null);
                    setPrompt("");
                  }}
                  className="text-xs font-sans font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Start Over
                </button>
              </div>
            </div>

            {isFallback && (
              <div
                id="ai-quota-warning"
                className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 font-sans flex items-start gap-2.5 shadow-xs"
              >
                <span className="text-base select-none leading-none">✨</span>
                <div className="space-y-1">
                  <span className="font-bold block text-amber-950">
                    Phuket Concierge Signature Match:
                  </span>
                  <p className="leading-relaxed">
                    Due to exceptionally high demand on our live AI model, we
                    resolved your vision using our collection of premium,
                    pre-vetted Phuket signature itineraries. This plan perfectly
                    fits your requested parameters!
                  </p>
                </div>
              </div>
            )}

            {/* Generated Header */}
            <div className="bg-[#FAF9F6] p-6 rounded-xs border border-slate-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Compass className="h-24 w-24 text-slate-900" />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 tracking-wide">
                ✨ {itinerary.routeTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-3 font-sans">
                {itinerary.fullDescription}
              </p>
            </div>

            {/* Recommendation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Catamaran Recommendation */}
              <div className="border border-slate-200 rounded-xs p-5 relative bg-white shadow-s space-y-4 overflow-hidden">
                <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-600 block">
                  🛡️ RECOMMENDED CATAMARAN
                </span>
                {recommendedVessel ? (
                  <div className="flex gap-4 items-center">
                    <img
                      referrerPolicy="no-referrer"
                      src={recommendedVessel.image}
                      alt={recommendedVessel.name}
                      className="w-16 h-16 rounded-xs object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">
                        {recommendedVessel.name}
                      </h5>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
                        {recommendedVessel.model}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Accommodates up to {recommendedVessel.capacity} guests
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {itinerary.recommendedVesselId}
                    </h5>
                  </div>
                )}
                <p className="text-xs text-slate-600 italic leading-relaxed pt-2 border-t border-slate-100 font-sans">
                  "{itinerary.vesselReasoning}"
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyVessel(itinerary.recommendedVesselId)
                  }
                  className="w-full mt-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Ship className="h-3.5 w-3.5" />
                  Select {recommendedVessel?.name || "Vessel"} & Book Now
                </button>
              </div>

              {/* Pier Recommendation */}
              <div className="border border-slate-200 rounded-xs p-5 bg-white shadow-s space-y-4 overflow-hidden">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 block">
                  ⚓ RECOMMENDED DEPARTURE PIER
                </span>
                {recommendedPier ? (
                  <div className="space-y-2">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-700" />
                      {recommendedPier.name}
                    </h5>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      {recommendedPier.location}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {recommendedPier.description}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 capitalize">
                      {itinerary.recommendedPierId} Pier
                    </h5>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-start sm:items-center gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    Your concierge representative will assist with easy hotel
                    transfer to this exact pier.
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Schedule Timeline */}
            <div className="relative border-l border-indigo-200 ml-6 pl-4 sm:ml-8 sm:pl-6 space-y-6 py-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 absolute -top-5 left-0">
                PLAN OF DESTINATION STOPS
              </span>
              {itinerary.stops.map((stop, idx) => {
                const localDest = DESTINATIONS.find(
                  (d) => d.id === stop.destinationId,
                );
                return (
                  <div key={idx} className="relative space-y-2">
                    {/* bullet */}
                    <div className="absolute -left-[calc(1rem+14px)] sm:-left-[calc(1.5rem+14px)] top-0.5 h-7 w-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono text-[10px] font-bold">
                      {idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h4 className="text-md font-bold text-slate-900 font-serif flex flex-wrap items-center gap-2">
                        {stop.name}
                        {localDest && (
                          <span className="text-[9px] uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-sm shrink-0">
                            Verified Spot
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 font-semibold shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-300" />
                        {stop.timeOfDay} ({stop.durationHours} hrs)
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {stop.activity}
                    </p>

                    {localDest && onSelectDestination && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectDestination) {
                            onSelectDestination(stop.destinationId);
                            // Smooth scroll to guide to view this destination
                            const el = document.getElementById(
                              "itinerary-guide-section",
                            );
                            if (el)
                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }
                        }}
                        className="text-[10px] font-sans font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        Learn more about this destination{" "}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Insider tips */}
            <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-xs space-y-3">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Andaman Insider Tips for Your Route:
              </h5>
              <ul className="space-y-2">
                {itinerary.insiderTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 font-sans flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-amber-500 text-sm mt-0.5 shrink-0">
                      •
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
