import React, { useState, useMemo, useEffect } from "react";
import { safeStringify } from "../lib/jsonSafe";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  MapPin,
  MessageSquare,
  PhoneCall,
  Users,
  Anchor,
  Sparkles,
  Compass,
  Clock,
  Info,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Bed,
  Flame,
  Music,
  Bus,
  Languages,
  Wine,
  Cake,
  Camera,
  DollarSign,
  CheckCircle,
  FileText,
  Gift,
  Heart,
  Briefcase,
  Upload,
  Image,
  MessageCircle,
  Check,
  Plus,
  Trash,
  RotateCcw,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Catamaran, Pier, Destination, BookingState } from "../types";
import { CATAMARANS, PIERS, DESTINATIONS, STANDARD_EXTRAS } from "../data";
import { useLanguage } from "../LanguageContext";
import { useAgent } from "../AgentContext";
import { useCurrency } from "../CurrencyContext";
import { VESSEL_BASE_RATES } from "./VesselCard";
import {
  CHARTER_FORM_TRANSLATIONS,
  CharterFormLanguage,
} from "./charterFormTranslations";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { sendBookingConfirmationEmail } from "../utils/mailer";
import RouteMapModal, { hasRouteMap, COMPOSITE_ROUTES } from "./RouteMapModal";
import { OnboardRules, ONBOARD_CATEGORIES } from "./OnboardRules";
import { ImageWithFallback } from "./ImageWithFallback";
import FreeMap from "./FreeMap";
import { destCoords, getPhysicalIsland } from "./ExcursionMap";
import { playSuccessChime } from "../utils/audio";
import QRScannerModal from "./QRScannerModal";

const VESSEL_SPEEDS: Record<string, number> = {
  "the-best": 7.5,
  namaste: 7.0,
  "the-one": 6.5,
};

const calculateDistanceNM = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * 3440.065; // Earth radius in Nautical Miles
};

const getOrderedDestinations = (ids: string[]) => {
  return ids
    .map((id) => DESTINATIONS.find((d) => d.id === id))
    .filter(Boolean) as typeof DESTINATIONS;
};

interface BookingFormProps {
  initialVesselId: string;
  onVesselChange: (id: string) => void;
  onSubmitSuccess?: (details: {
    vesselName: string;
    vesselModel: string;
    vesselImage: string;
    charterDate: string;
    guestCount: number;
    actionType:
      | "whatsapp"
      | "call"
      | "line"
      | "wechat"
      | "email"
      | "viber"
      | "web";
    excursionRoute?: string;
    totalPrice?: number;
    amenities?: string[];
    charterDuration?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    optInReminder?: boolean;
    pdfBase64?: string;
  }) => void;
  children?: React.ReactNode;
  initialFormStep?: number;
}

export const getVesselMaxCabins = (vesselId: string, duration: string): number => {
  if (vesselId === "the-best") {
    return duration === "overnight" ? 6 : 4;
  }
  if (vesselId === "namaste") {
    return 2;
  }
  if (vesselId === "the-one") {
    return 1;
  }
  return 0;
};

export const isDestinationEligibleForHalfDay = (id: string): boolean => {
  const eligibleIds = [
    "promteph",
    "ko-he-south",
    "ko-he-north-banana-beach",
    "ko-he-prompteph",
    "coco-coral",
    "coco-phromthep",
  ];
  return eligibleIds.includes(id);
};

export default function BookingForm({
  initialVesselId,
  onVesselChange,
  onSubmitSuccess,
  children,
  initialFormStep,
}: BookingFormProps) {
  const { t, language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const {
    getNormalizedWhatsApp,
    getContactPhone,
    currentAgent,
    currentCoagent,
    isReferred,
  } = useAgent();
  const isAgentOverride = currentAgent && !isReferred;
  const { formatPrice, currency, setCurrency } = useCurrency();
  const [isAgentOnline, setIsAgentOnline] = useState<boolean>(false);

  // Dynamic fleet pricing overrides state synced automatically via local storage & Cloud Firestore
  const [activeRates, setActiveRates] = useState<Record<string, { halfday: number; sunset: number; fullday: number; overnight: number }>>(VESSEL_BASE_RATES);

  useEffect(() => {
    // 1. Initial quick load from local storage
    const savedRates = localStorage.getItem("admin_fleet_rates_override");
    let currentRates = { ...VESSEL_BASE_RATES };
    if (savedRates) {
      try {
        const parsed = JSON.parse(savedRates);
        currentRates = { ...currentRates, ...parsed };
      } catch (e) {
        console.warn("Failed to parse admin_fleet_rates_override", e);
      }
    }
    const agentId = currentAgent?.id;
    if (agentId) {
      const agentRates = localStorage.getItem(`agent_rates_${agentId}`);
      if (agentRates) {
        try {
          const parsed = JSON.parse(agentRates);
          currentRates = { ...currentRates, ...parsed };
        } catch (e) {
          console.warn("Failed to parse agent_rates", e);
        }
      }
    }
    setActiveRates(currentRates);

    // 2. Fetch live rates from cloud Firestore for perfect real-time client sync
    const loadFromCloud = async () => {
      try {
        const snap = await getDoc(doc(db, "fleet", "rates"));
        if (snap.exists()) {
          const cloudData = snap.data().data;
          if (cloudData) {
            localStorage.setItem("admin_fleet_rates_override", safeStringify(cloudData));
            let merged = { ...VESSEL_BASE_RATES, ...cloudData };
            if (agentId) {
              const agentSnap = await getDoc(doc(db, "agents", agentId));
              if (agentSnap.exists()) {
                const customRates = agentSnap.data().customRates;
                if (customRates) {
                  merged = { ...merged, ...customRates };
                  localStorage.setItem(`agent_rates_${agentId}`, safeStringify(customRates));
                }
              }
            }
            setActiveRates(merged);
          }
        }
      } catch (err) {
        console.warn("Could not load fleet overrides from Firestore:", err);
      }
    };
    loadFromCloud();
  }, [currentAgent]);

  useEffect(() => {
    let bId = "none";

    if (currentAgent) {
      if (currentAgent.id) {
        bId = currentAgent.id;
      } else if (currentAgent.uid) {
        bId = currentAgent.uid;
      } else if (currentAgent.email) {
        bId = currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      }
    } else {
      bId = "vinko_mitar_gmail_com"; // Master fallback for no-referral customers
    }

    const presenceRef = doc(db, "agent_presence", bId);
    const unsubscribe = onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Agent Presence DEBUG:", bId, data);
          const lastActiveTime =
            typeof data.lastActive === "number"
              ? data.lastActive
              : data.lastActive
                ? new Date(data.lastActive).getTime()
                : 0;
          const isRecentlyActive = lastActiveTime
            ? Math.abs(Date.now() - lastActiveTime) < 300000
            : false;
          setIsAgentOnline(data.isOnline === true || isRecentlyActive);
        } else {
          console.log(
            "Agent Presence DEBUG: No presence document found for",
            bId,
          );
          setIsAgentOnline(false);
        }
      },
      (err: any) => {
        if (err?.message?.includes("permission")) return;
        console.log(
          "Failed to load agent presence subscription (expected if offline):",
          err,
        );
      },
    );

    return () => unsubscribe();
  }, [currentAgent]);
  const [customAgentPrices, setCustomAgentPrices] = useState<
    Record<string, string>
  >({
    basePrice: "",
    foodPrice: "",
    waterSlider: "",
    inflatablePool: "",
    ticketCost: "",
    cabinCount: "",
    customMiscFee: "",
  });
  const [formData, setFormData] = useState<BookingState>({
    vesselId: initialVesselId,
    startPierId: "chalong", // default to Chalong
    endPierId: "chalong",
    destinations: [], // default to empty
    charterDate: "",
    departureTime: "08:30",
    arrivalTime: "13:00",
    guestCount: 6,
    guestsAdults: 6,
    guestsKids: 0,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    optInReminder: false,
    specialRequests: "",
    celebrationPackage: "none",
    addWaterSlider: false,
    addInflatablePool: false,
    addCabinRental: false,
    addGasBBQ: false,
    addCharcoalBBQ: false,
    extraWatermelon: 0,
    extraSnack: 0,
    extraPineapple: 0,
    addKaraoke: false,
    addLongtailBoat: false,
    addMayaBayTicketAndLongtail: false,
    addJetski: false,
    jetskiCount: 1,
    jetskiDuration: "30m",
    addMinibusTransfer: false,
    transferMarina: "chalong",
    transferGuests: 1,
    transferPickupAddress: "",
    guideLanguage: "none",
    fishingRodsCount: 0,
    fishingHandlinesCount: 0,
    addJamesBondTicket: false,
    charterDuration: "halfday",
    halfDaySlot: "morning",
    overnightDays: 1,
    foodOption: "standard",
    addBartender: false,
    bartenderCount: 1,
    addBirthdayCake: false,
    birthdayCakeCount: 1,
    cabinCount: 0,
    addPhotographer: false,
    addDJ: false,
    addDroneVideography: false,
    addFlowerBouquet: false,
    flowerBouquetCount: 1,
    addChampagne: false,
    champagneCount: 1,
    addPartyDecorations: false,
    redWineBottles: 0,
    whiteWineBottles: 0,
    beerCartons: 0,
    addSashimi: false,
    addParasailing: false,
    addBananaBoat: false,
    addRubberCanoe: false,
    rubberCanoeCount: 1,
    hotelPickupLocation: "",
    customInclusions: [],
    customExclusions: [],
    customAddonKeys: [],
  });

  const [wantToRegister, setWantToRegister] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");

  // Persistence: Save and Load Form Data
  useEffect(() => {
    const saved = localStorage.getItem("phuket_booking_form_data");
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsedData }));
      } catch (e) {
        console.error("Error loading saved booking data:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("phuket_booking_form_data", safeStringify(formData));
  }, [formData]);

  // Dispatch event when destinations or starting pier changes so ExcursionMap can update visual states
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("booking-destinations-changed", {
        detail: {
          destinations: formData.destinations,
          startPierId: formData.startPierId,
          endPierId: formData.endPierId || formData.startPierId,
        },
      }),
    );
  }, [formData.destinations, formData.startPierId, formData.endPierId]);

  // Listen for pier changes from map
  useEffect(() => {
    const handlePierChanged = (e: CustomEvent) => {
      const { startPierId, endPierId } = e.detail;
      setFormData((prev) => ({
        ...prev,
        ...(startPierId ? { startPierId } : {}),
        ...(endPierId !== undefined ? { endPierId } : {}),
      }));
    };
    window.addEventListener(
      "booking-pier-changed",
      handlePierChanged as EventListener,
    );
    return () =>
      window.removeEventListener(
        "booking-pier-changed",
        handlePierChanged as EventListener,
      );
  }, []);

  // Dispatch event when charterDuration changes so other components stay sync'd
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("booking-duration-changed", {
        detail: formData.charterDuration,
      }),
    );
  }, [formData.charterDuration]);

  // Dispatch event when vesselId changes so other components stay sync'd
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("booking-vessel-changed", { detail: formData.vesselId }),
    );
  }, [formData.vesselId]);

  // Enforce half-day restriction: All except Koh He/Promthep from Chalong or Coco require Full Day
  useEffect(() => {
    const isAoPo = formData.startPierId === "ao-po";
    const hasIneligible = formData.destinations.some(
      (d) => !isDestinationEligibleForHalfDay(d),
    );
    if (formData.charterDuration === "halfday" && (isAoPo || hasIneligible)) {
      setFormData((prev) => ({
        ...prev,
        charterDuration: "fullday",
      }));
    }
  }, [formData.startPierId, formData.destinations, formData.charterDuration]);

  const [formStep, setFormStep] = useState<number>(initialFormStep || 2);

  useEffect(() => {
    if (initialFormStep !== undefined) {
      setFormStep(initialFormStep);
    }
  }, [initialFormStep]);
  const [isCopied, setIsCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [termsLang, setTermsLang] = useState<
    "en" | "hr" | "ru" | "hi" | "zh" | "th" | "fr" | "de"
  >("en");
  const [charterLang, setCharterLang] = useState<CharterFormLanguage>("en");
  const [routeModalData, setRouteModalData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [finalizedBookingReference, setFinalizedBookingReference] = useState<
    string | null
  >(null);
  const [loadedRouteFromMap, setLoadedRouteFromMap] = useState<boolean>(false);

  // Special Overnight Promotion states
  const [promoData, setPromoData] = useState<{
    active: boolean;
    promoCode: string;
    title: string;
    description: string;
    photoBase64: string;
    pdfBase64: string;
    flyerPhotoBase64?: string;
  } | null>(null);

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [isPromoSelected, setIsPromoSelected] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Special Daily Promotion states
  const [dailyPromoData, setDailyPromoData] = useState<{
    active: boolean;
    promoCode: string;
    title: string;
    description: string;
    photoBase64: string;
    pdfBase64: string;
    flyerPhotoBase64?: string;
  } | null>(null);

  const [showDailyPromoModal, setShowDailyPromoModal] = useState(false);
  const [isDailyPromoSelected, setIsDailyPromoSelected] = useState(false);

  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  const getPackageDefaults = (
    duration: "halfday" | "fullday" | "overnight",
    celebration: string,
  ) => {
    let inclusions = [
      "Professional Captain & Crew Support",
      "Fresh Tropical Seasonal Fruits on Board",
      "Chilled Soft Drinks & Mineral Water",
      "Marine Accident Insurance Coverage",
      "Premium Snorkel Masks, Fins & Safety Life Jackets",
    ];
    let exclusions = [
      "National Park Entrance & Mooring Fees (cash only)",
      "Land Roundtrip Hotel Transfers to Pier",
      "Gratuities and crew tips (discretionary)",
      "Alcoholic Beverages (BYOB welcome, corkage free)",
    ];

    if (duration === "halfday") {
      inclusions.push("Fuel Fee for Half-Day Selected Route");
      exclusions.push("Standard Fine-dining Buffet Lunch");
    } else if (duration === "fullday") {
      inclusions.push("Fuel Fee for Full-Day Multi-Island Option");
      inclusions.push("Full Standard Buffet Lunch Onboard");
      inclusions.push("Beach Towels Provided Onboard");
    } else if (duration === "overnight") {
      inclusions.push("Overnight Luxury Cabin Accommodations & Linens");
      inclusions.push(
        "Private Onboard Chef with Full-board Meals (Breakfast, Lunch, Dinner)",
      );
      inclusions.push("Fuel Fee for Extended Overnight Itinerary");
      inclusions.push("Deluxe Inflatable Pool & Water Slide Access");
      exclusions.push("Luxury Land Island Excursions & Guide Entrance Tickets");
      exclusions.push("Premium Selected Champagne Bottlings (optional add-on)");
    }

    if (celebration === "birthday") {
      inclusions.push(
        "Celebration Special Birthday Cake & Onboard Sparkling Wine",
      );
      inclusions.push("Bespoke Balloons Deck Decorations");
    } else if (celebration === "anniversary") {
      inclusions.push("Luxury Flower Bouquet & Onboard Sparkling Wine Accent");
      inclusions.push("Custom romantic acoustic sound-effects support");
    } else if (celebration === "corporate") {
      inclusions.push("Exclusive Onboard Group Team-building Host & PA System");
      inclusions.push("Premium snacking boards & high-density fresh bites");
    }

    return { inclusions, exclusions };
  };

  useEffect(() => {
    const defaults = getPackageDefaults(
      (formData.charterDuration as any) || "halfday",
      formData.celebrationPackage || "none",
    );
    setFormData((prev) => ({
      ...prev,
      customInclusions:
        prev.customInclusions && prev.customInclusions.length > 0
          ? prev.customInclusions
          : defaults.inclusions,
      customExclusions:
        prev.customExclusions && prev.customExclusions.length > 0
          ? prev.customExclusions
          : defaults.exclusions,
    }));
  }, [formData.charterDuration, formData.celebrationPackage]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");

        // Overnight Promo loading
        const promoRef = doc(db, "promotions", "overnight");
        const snap = await getDoc(promoRef);
        if (snap.exists()) {
          const d = snap.data();
          if (d.active) {
            setPromoData({
              active: !!d.active,
              promoCode: d.promoCode || "OVERNIGHTEXCLUSIVES",
              title: d.title || "Exclusive Luxury Overnight Promotion!",
              description: d.description || "",
              photoBase64: d.photoBase64 || "",
              pdfBase64: d.pdfBase64 || "",
              flyerPhotoBase64: d.flyerPhotoBase64 || "",
            });
          }
        }

        // Daily Excursion Promo loading
        const dailyRef = doc(db, "promotions", "daily");
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) {
          const d = dailySnap.data();
          if (d.active) {
            setDailyPromoData({
              active: !!d.active,
              promoCode: d.promoCode || "DAILYADVENTURE",
              title: d.title || "Daily Charter Excursion Promotion!",
              description: d.description || "",
              photoBase64: d.photoBase64 || "",
              pdfBase64: d.pdfBase64 || "",
              flyerPhotoBase64: d.flyerPhotoBase64 || "",
            });
          }
        }
      } catch (err) {
        console.warn("Could not load promotions:", err);
      }
    };
    fetchPromos();
  }, []);

  const downloadPromoPdf = () => {
    if (!promoData || !promoData.pdfBase64) return;
    try {
      const base64Str = promoData.pdfBase64;
      const cleanBase64 = base64Str.includes("base64,")
        ? base64Str.split("base64,")[1]
        : base64Str;

      const binaryString = window.atob(cleanBase64.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Overnight_Trip_Special_Promotion_Flyer_${promoData.promoCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const win = window.open(blobUrl, "_blank");
      if (!win) {
        console.log("Popup blocker active, fell back to direct download.");
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.warn(
        "PDF automatic download/blob failed, opening in window instead:",
        err,
      );
      const fallbackUrl = promoData.pdfBase64.startsWith("data:")
        ? promoData.pdfBase64
        : `data:application/pdf;base64,${promoData.pdfBase64}`;
      window.open(fallbackUrl, "_blank");
    }
  };

  const downloadDailyPromoPdf = () => {
    if (!dailyPromoData || !dailyPromoData.pdfBase64) return;
    try {
      const base64Str = dailyPromoData.pdfBase64;
      const cleanBase64 = base64Str.includes("base64,")
        ? base64Str.split("base64,")[1]
        : base64Str;

      const binaryString = window.atob(cleanBase64.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Daily_Charter_Special_Excursion_Flyer_${dailyPromoData.promoCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const win = window.open(blobUrl, "_blank");
      if (!win) {
        console.log("Popup blocker active, fell back to direct download.");
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.warn(
        "PDF automatic download/blob failed, opening in window instead:",
        err,
      );
      const fallbackUrl = dailyPromoData.pdfBase64.startsWith("data:")
        ? dailyPromoData.pdfBase64
        : `data:application/pdf;base64,${dailyPromoData.pdfBase64}`;
      window.open(fallbackUrl, "_blank");
    }
  };

  useEffect(() => {
    if (
      globalLang === "ru" ||
      globalLang === "hi" ||
      globalLang === "zh" ||
      globalLang === "th" ||
      globalLang === "fr" ||
      globalLang === "de"
    ) {
      setCharterLang(globalLang as CharterFormLanguage);
      setTermsLang(globalLang as any);
    } else {
      setCharterLang("en");
      setTermsLang("en");
    }
  }, [globalLang]);

  const ctx = (key: string, enFallback: string): string => {
    const dict = CHARTER_FORM_TRANSLATIONS[charterLang];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    return enFallback;
  };

  const getCoolersText = (): string => {
    const isBest = formData.vesselId === "the-best";
    switch (charterLang) {
      case "fr":
        return isBest
          ? "3 glacières portatives pour vos boissons fraîches, ainsi qu'un café expresso de qualité supérieure"
          : "1 glacière portative pour vos boissons fraîches";
      case "de":
        return isBest
          ? "3 Kühlboxen für kalte Getränke sowie erstklassiger Espresso"
          : "1 Kühlbox für kalte Getränke";
      case "ru":
        return isBest
          ? "3 переносных холодильника для прохладительных напитков, а также премиальный кофе эспрессо"
          : "1 переносной холодильник для прохладительных напитков";
      case "hi":
        return isBest
          ? "ठंडे पेय पदार्थों के लिए 3 कूलर बॉक्स, साथ ही प्रीमियम कैफ़े एस्प्रेसो"
          : "ठंडे पेय पदार्थों के लिए 1 कूलर बॉक्स";
      case "th":
        return isBest
          ? "กระติกน้ำแข็ง 3 ใบสำหรับเครื่องดื่มเย็นของคุณ พร้อมกาแฟเอสเพรสโซ่ระดับพรีเมียม"
          : "กระติกน้ำแข็ง 1 ใบสำหรับเครื่องดื่มเย็นของคุณ";
      default:
        return isBest
          ? "3 cooler boxes for your cold drinks, plus premium Café Espresso"
          : "1 cooler box for your cold drinks";
    }
  };

  // Multilingual terms Translations
  const termsTranslations = {
    en: {
      label: "Accept Charter Terms & Booking Conditions",
      rulesLabel: "I have read and agree to all the Rules On Board.",
      sub: "I understand and accept that standard charter guidelines apply to this private booking.",
      ruleHeader: "⚠️ Mandatory Post-Boarding Rule:",
      ruleDetail:
        "For any changes in booking after boarding the ship, the customer must contact the agency from which they booked the trip.",
      error:
        "You must accept the terms before booking or contacting the agency by WhatsApp or Call.",
      rulesError: "You must accept the rules on board before proceeding.",
    },
    hr: {
      label: "Prihvaćam uvjete chartera i uvjete rezervacije",
      rulesLabel: "Pročitao/la sam i slažem se sa svim Pravilima na brodu.",
      sub: "Razumijem i prihvaćam da se na ovu privatnu rezervaciju primjenjuju standardne smjernice chartera.",
      ruleHeader: "⚠️ Obavezno pravilo nakon ukrcaja:",
      ruleDetail:
        "Za bilo kakve promjene u rezervaciji nakon ukrcaja na brod, kupac se mora obratiti agenciji kod koje je rezervirao putovanje.",
      error:
        "Morate prihvatiti uvjete prije rezervacije ili kontaktiranja agencije putem WhatsAppa ili poziva.",
      rulesError:
        "Morate prihvatiti pravila na brodu prije nego što nastavite.",
    },
    ru: {
      label: "Я принимаю условия чартера и бронирования",
      rulesLabel: "Я прочитал(а) и согласен(на) со всеми Правилами на борту.",
      sub: "Я понимаю и принимаю, что к этому частному бронированию применяются стандартные правила чартера.",
      ruleHeader: "⚠️ Обязательное правило после посадки:",
      ruleDetail:
        "Для любых изменений в бронировании после посадки на судно, клиент должен связаться с агентством, в котором он забронировал поездку.",
      error:
        "Вы должны принять условия перед бронированием или обращением в агентство по WhatsApp или по телефону.",
      rulesError: "Вы должны принять правила на борту перед продолжением.",
    },
    hi: {
      label: "चार्टर की शर्तें और बुकिंग नियम स्वीकार करें",
      rulesLabel:
        "मैंने बोर्ड पर सभी नियमों को पढ़ लिया है और मैं उनसे सहमत हूं।",
      sub: "मैं समझता/समझती हूँ और स्वीकार करता/करती हूँ कि इस निजी बुकिंग पर मानक चार्टर दिशानिर्देश लागू होते हैं।",
      ruleHeader: "⚠️ बोर्डिंग के बाद का अनिवार्य नियम:",
      ruleDetail:
        "जहाज पर चढ़ने के बाद बुकिंग में किसी भी बदलाव के लिए, ग्राहक को उस एजेंसी से संपर्क करना होगा जिससे उन्होंने यात्रा बुक की थी।",
      error:
        "व्हाट्सएप या कॉल द्वारा एजेंसी से संपर्क करने या बुकिंग करने से पहले आपको शर्तों को स्वीकार करना होगा।",
      rulesError:
        "आगे बढ़ने से पहले आपको बोर्ड पर नियमों को स्वीकार करना होगा।",
    },
    zh: {
      label: "接受游艇包船条款与预订条件",
      rulesLabel: "我已经阅读并同意所有船上规则。",
      sub: "我理解并接受标准包船指南适用于此私人预订。",
      ruleHeader: "⚠️ 登船后强制规则：",
      ruleDetail:
        "登船后对预订方案的任何更改，客户必须联系其预订行程的代理机构。",
      error: "在通过 WhatsApp 或电话预订或联系商户之前，您必须接受此条款。",
      rulesError: "在继续操作之前，您必须接受船上规则。",
    },
    th: {
      label: "ยอมรับข้อตกลงการเช่าเหมาลำและเงื่อนไขการจอง",
      rulesLabel: "ฉันได้อ่านและยอมรับกฎข้อบังคับบนเรือทั้งหมด",
      sub: "ฉันเข้าใจและยอมรับว่าแนวทางปฏิบัติมาตรฐานสำหรับการเช่าเหมาลำจะมีผลบังคับใช้กับการจองส่วนตัวนี้",
      ruleHeader: "⚠️ กฎข้อบังคับหลังขึ้นเรือ:",
      ruleDetail:
        "สำหรับการเปลี่ยนแปลงใดๆ ในการจองหลังจากขึ้นเรือแล้ว ลูกค้าจะต้องติดต่อเอเจนซี่ที่จองทริปด้วยเท่านั้น",
      error:
        "คุณต้องยอมรับข้อตกลงก่อนดำเนินการจองหรือติดต่อเอเจนซี่ผ่าน WhatsApp หรือโทรศัพท์",
      rulesError: "คุณต้องยอมรับกฎข้อบังคับบนเรือก่อนดำเนินการต่อ",
    },
    fr: {
      label: "Accepter les conditions de location et de réservation",
      rulesLabel: "J'ai lu et j'accepte toutes les règles à bord.",
      sub: "Je comprends et j'accepte que les directives standard s'appliquent à cette réservation privée.",
      ruleHeader: "⚠️ Règle obligatoire après embarquement :",
      ruleDetail:
        "Pour toute modification de réservation après l'embarquement, le client doit contacter l'agence auprès de laquelle il a réservé le voyage.",
      error:
        "Vous devez accepter les conditions avant de réserver ou de contacter l'agence par WhatsApp ou par téléphone.",
      rulesError: "Vous devez accepter les règles à bord avant de continuer.",
    },
    de: {
      label: "Charterbedingungen und Buchungskonditionen akzeptieren",
      rulesLabel: "Ich habe alle Regeln an Bord gelesen und stimme ihnen zu.",
      sub: "Ich verstehe und akzeptiere, dass für diese private Buchung die Standard-Charterrichtlinien gelten.",
      ruleHeader: "⚠️ Zwingende Regel nach dem Boarding:",
      ruleDetail:
        "Für Änderungen an der Buchung nach dem Boarding muss sich der Kunde an die Agentur wenden, bei der er die Reise gebucht hat.",
      error:
        "Sie müssen die Bedingungen akzeptieren, bevor Sie buchen oder die Agentur per WhatsApp oder Anruf kontaktieren.",
      rulesError:
        "Sie müssen die Regeln an Bord akzeptieren, bevor Sie fortfahren.",
    },
  };

  // Synchronize vessel selection from parent safely
  if (formData.vesselId !== initialVesselId) {
    const isBest = initialVesselId === "the-best";
    const nextVessel =
      CATAMARANS.find((v) => v.id === initialVesselId) || CATAMARANS[0];
    const capacity = nextVessel.capacity;

    let nextAdults = formData.guestsAdults;
    let nextKids = formData.guestsKids;
    if (nextAdults + nextKids > capacity) {
      if (nextAdults >= capacity) {
        nextAdults = capacity;
        nextKids = 0;
      } else {
        nextKids = capacity - nextAdults;
      }
    }
    const nextTotal = nextAdults + nextKids;

    const isOvernightSupported =
      initialVesselId === "the-best" || initialVesselId === "namaste";

    const nextCharterDuration = isOvernightSupported
      ? formData.charterDuration
      : formData.charterDuration === "overnight"
        ? "fullday"
        : formData.charterDuration;

    const maxCabinsForNext = getVesselMaxCabins(initialVesselId, nextCharterDuration);
    const nextCabinCount = Math.min(formData.cabinCount || 0, maxCabinsForNext);

    setFormData((prev) => ({
      ...prev,
      vesselId: initialVesselId,
      guestsAdults: nextAdults,
      guestsKids: nextKids,
      guestCount: nextTotal,
      addCharcoalBBQ: isBest ? prev.addCharcoalBBQ : false,
      addKaraoke: isBest ? prev.addKaraoke : false,
      cabinCount: nextCabinCount,
      charterDuration: nextCharterDuration,
    }));
  }

  useEffect(() => {
    const handleLoadProposal = (e: CustomEvent) => {
      const prop = e.detail;
      setFormData((prev) => ({
        ...prev,
        vesselId: prop.vesselId1,
        charterDate: prop.charterDate,
        customerName:
          prop.clientName && prop.clientName !== "Web Booking Request"
            ? prop.clientName
            : prev.customerName,
      }));
      if (onVesselChange) {
        onVesselChange(prop.vesselId1);
      }
    };

    const handleConfigureTrip = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;
      setFormData((prev) => ({
        ...prev,
        ...(detail.duration && { charterDuration: detail.duration }),
        ...(detail.package && { celebrationPackage: detail.package }),
      }));
      if (detail.openPromo) {
        setShowPromoModal(true);
      }
      if (detail.openPromoDaily) {
        setShowDailyPromoModal(true);
      }
    };

    const handleAddDestination = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;
      setLoadedRouteFromMap(true);
      setFormData((prev) => {
        let newDests = prev.destinations;
        let pierId = detail.startPierId || detail.pierId;
        let finalEndPierId =
          detail.endPierId || detail.startPierId || detail.pierId;

        if (detail.destinationIds && Array.isArray(detail.destinationIds)) {
          newDests = detail.destinationIds;
          const isSame =
            prev.destinations.length === newDests.length &&
            prev.destinations.every((val, idx) => val === newDests[idx]);
          if (
            isSame &&
            (!pierId || prev.startPierId === pierId) &&
            (!finalEndPierId || prev.endPierId === finalEndPierId)
          ) {
            return prev;
          }
          if (newDests.length > 0) {
            pierId =
              pierId ||
              DESTINATIONS.find((d) => d.id === newDests[0])?.recommendedPierId;
          }
        } else if (detail.destinationId) {
          const destId = detail.destinationId;
          const exists = prev.destinations.includes(destId);
          if (!exists) {
            if (
              prev.destinations.length === 1 &&
              prev.destinations[0] === "prompteph"
            ) {
              newDests = [destId];
            } else {
              newDests = [...prev.destinations, destId];
            }
          }
          pierId =
            pierId ||
            DESTINATIONS.find((d) => d.id === destId)?.recommendedPierId;
          const isSame =
            prev.destinations.length === newDests.length &&
            prev.destinations.every((val, idx) => val === newDests[idx]);
          if (
            isSame &&
            (!pierId || prev.startPierId === pierId) &&
            (!finalEndPierId || prev.endPierId === finalEndPierId)
          ) {
            return prev;
          }
        } else {
          return prev;
        }

        return {
          ...prev,
          destinations: newDests,
          ...(pierId && { startPierId: pierId }),
          ...(finalEndPierId && { endPierId: finalEndPierId }),
        };
      });
      if (!detail.preventStepChange) {
        // Direct user to configure charter step 1 (Route, which has index 2)
        setFormStep(2);
      }
    };

    const handleGotoStep = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail && typeof detail.step === "number") {
        setFormStep(detail.step);
      }
    };

    window.addEventListener(
      "load-booking-proposal",
      handleLoadProposal as EventListener,
    );
    window.addEventListener(
      "configure-booking-trip",
      handleConfigureTrip as EventListener,
    );
    window.addEventListener(
      "add-destination-to-route",
      handleAddDestination as EventListener,
    );
    window.addEventListener(
      "goto-booking-step",
      handleGotoStep as EventListener,
    );

    return () => {
      window.removeEventListener(
        "load-booking-proposal",
        handleLoadProposal as EventListener,
      );
      window.removeEventListener(
        "configure-booking-trip",
        handleConfigureTrip as EventListener,
      );
      window.removeEventListener(
        "add-destination-to-route",
        handleAddDestination as EventListener,
      );
      window.removeEventListener(
        "goto-booking-step",
        handleGotoStep as EventListener,
      );
    };
  }, [onVesselChange]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "customers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Compile profile auxiliary info to append to special requests if not already there
            let profileExtras = "";
            if (data.country) profileExtras += `\nNationality: ${data.country}`;
            if (data.passportNumber)
              profileExtras += `\nPassport: ${data.passportNumber}`;
            if (data.dietaryRestrictions)
              profileExtras += `\nDietary: ${data.dietaryRestrictions}`;

            // Add companions if exists
            if (
              data.companions &&
              Array.isArray(data.companions) &&
              data.companions.length > 0
            ) {
              const companionNames = data.companions
                .map((c: any) => c.name)
                .filter(Boolean)
                .join(", ");
              if (companionNames) {
                profileExtras += `\nTravel Companions: ${companionNames}`;
              }
            }

            setFormData((prev) => {
              const currentRequests = prev.specialRequests || "";
              const hasExtras =
                currentRequests.includes("Nationality:") ||
                currentRequests.includes("Passport:");

              return {
                ...prev,
                customerName:
                  data.name || user.displayName || prev.customerName,
                customerEmail: data.email || user.email || prev.customerEmail,
                customerPhone: data.phoneNumber || prev.customerPhone,
                specialRequests: hasExtras
                  ? currentRequests
                  : (currentRequests + profileExtras).trim(),
              };
            });
          } else {
            setFormData((prev) => ({
              ...prev,
              customerName: user.displayName || prev.customerName,
              customerEmail: user.email || prev.customerEmail,
            }));
          }
        } catch (e) {
          console.error("Error setting default client details", e);
        }
      }
    });
    return () => unsub();
  }, []);

  const selectedVesselObj = useMemo(() => {
    return CATAMARANS.find((v) => v.id === formData.vesselId) || CATAMARANS[0];
  }, [formData.vesselId]);

  const adjustAdults = (amount: number) => {
    setFormData((prev) => {
      const target = Math.max(1, prev.guestsAdults + amount);
      const newTotal = target + prev.guestsKids;
      if (newTotal > selectedVesselObj.capacity) {
        return prev;
      }
      return {
        ...prev,
        guestsAdults: target,
        guestCount: newTotal,
      };
    });
  };

  const adjustKids = (amount: number) => {
    setFormData((prev) => {
      const target = Math.max(0, prev.guestsKids + amount);
      const newTotal = prev.guestsAdults + target;
      if (newTotal > selectedVesselObj.capacity) {
        return prev;
      }
      return {
        ...prev,
        guestsKids: target,
        guestCount: newTotal,
      };
    });
  };

  const handleClearExtras = () => {
    setFormData((prev) => ({
      ...prev,
      celebrationPackage: "none",
      addWaterSlider: false,
      addInflatablePool: false,
      addCabinRental: false,
      addGasBBQ: false,
      addCharcoalBBQ: false,
      extraWatermelon: 0,
      extraSnack: 0,
      extraPineapple: 0,
      addKaraoke: false,
      addLongtailBoat: false,
      addMayaBayTicketAndLongtail: false,
      addJetski: false,
      jetskiCount: 1,
      jetskiDuration: "30m",
      addMinibusTransfer: false,
      transferMarina: "chalong",
      transferGuests: 1,
      transferPickupAddress: "",
      guideLanguage: "none",
      fishingRodsCount: 0,
      fishingHandlinesCount: 0,
      addJamesBondTicket: false,
      foodOption: "standard",
      addBartender: false,
      bartenderCount: 1,
      addBirthdayCake: false,
      birthdayCakeCount: 1,
      cabinCount: 0,
      addPhotographer: false,
      addDJ: false,
      addDroneVideography: false,
      addFlowerBouquet: false,
      flowerBouquetCount: 1,
      addChampagne: false,
      champagneCount: 1,
      addPartyDecorations: false,
      redWineBottles: 0,
      whiteWineBottles: 0,
      beerCartons: 0,
      addSashimi: false,
      customAddonKeys: [],
    }));
  };

  const selectedPierObj = useMemo(() => {
    return PIERS.find((p) => p.id === formData.startPierId) || PIERS[0];
  }, [formData.startPierId]);

  const bookingMapMarkers = useMemo(() => {
    const list: any[] = [];

    // Starting Pier
    if (selectedPierObj) {
      const coord = destCoords[selectedPierObj.id];
      if (coord) {
        list.push({
          id: selectedPierObj.id,
          lat: coord.lat,
          lng: coord.lng,
          title: `⚓ Starting Point: ${selectedPierObj.name}`,
          isPier: true,
          isActive: false,
        });
      }
    }

    // Active Chosen Route points in custom order sequence (Only plotted points)
    formData.destinations.forEach((id, idx) => {
      const dest = DESTINATIONS.find((d) => d.id === id);
      if (!dest) return;
      const physical = getPhysicalIsland(id);
      const coord = destCoords[physical] || destCoords[id];
      if (coord) {
        list.push({
          id: id,
          lat: coord.lat,
          lng: coord.lng,
          title: `[Stop #${idx + 1}] ${dest.name}`,
          isPier: false,
          isActive: true,
        });
      }
    });

    // End Pier
    if (formData.endPierId && formData.endPierId !== formData.startPierId) {
      const endPierObj = PIERS.find((p) => p.id === formData.endPierId);
      if (endPierObj) {
        const coord = destCoords[endPierObj.id];
        if (coord) {
          list.push({
            id: endPierObj.id,
            lat: coord.lat,
            lng: coord.lng,
            title: `🏁 End Point: ${endPierObj.name}`,
            isPier: true,
            isActive: false,
          });
        }
      }
    }

    return list;
  }, [
    formData.destinations,
    selectedPierObj,
    formData.endPierId,
    formData.startPierId,
  ]);

  const bookingMapPaths = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];

    // Starting Pier coordinate
    if (selectedPierObj) {
      const coord = destCoords[selectedPierObj.id];
      if (coord) {
        points.push(coord);
      }
    }

    // Active Sequence coords (Only plotted stops)
    formData.destinations.forEach((id) => {
      const physical = getPhysicalIsland(id);
      const coord = destCoords[physical] || destCoords[id];
      if (coord) {
        points.push(coord);
      }
    });

    // End Pier coordinate
    if (formData.endPierId && formData.endPierId !== formData.startPierId) {
      const endPierObj = PIERS.find((p) => p.id === formData.endPierId);
      if (endPierObj) {
        const coord = destCoords[endPierObj.id];
        if (coord) {
          points.push(coord);
        }
      }
    } else if (selectedPierObj) {
      // Loop back to start pier if same
      const coord = destCoords[selectedPierObj.id];
      if (coord) {
        points.push(coord);
      }
    }

    if (points.length >= 2) {
      return [
        {
          points,
          isActive: true,
          name: `Current Plotted Route`,
          isItinerary: true,
        },
      ];
    }
    return [];
  }, [
    formData.destinations,
    selectedPierObj,
    formData.endPierId,
    formData.startPierId,
  ]);

  const routeStats = useMemo(() => {
    let totalNM = 0;
    let totalMins = 0;

    formData.destinations.forEach((id) => {
      const dest = DESTINATIONS.find((d) => d.id === id);
      if (dest) {
        totalNM += dest.distanceNM || 0;
        totalMins += Math.round(((dest.distanceNM || 0) / 7) * 60);
      }
    });

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    let timeStr = "";
    if (hours > 0) {
      timeStr += `${hours}h `;
    }
    if (mins > 0 || hours === 0) {
      timeStr += `${mins}m`;
    }

    return {
      totalNM: parseFloat(totalNM.toFixed(1)),
      timeStr,
      stopsCount: formData.destinations.length,
    };
  }, [formData.destinations]);

  const isVisitingKohKhaiNok = useMemo(() => {
    return (
      formData.destinations.includes("koh-khai-nok") ||
      formData.destinations.includes("koh-khai-nok-maithon") ||
      formData.destinations.includes("naga-noi") ||
      formData.destinations.includes("naga-yai") ||
      formData.destinations.includes("koh-yao-yai-koh-hong-james-bond")
    ); // this route includes Naga islands
  }, [formData.destinations]);

  // Handle Preconfigured Route Selection (Pick exactly one itinerary and unpack constituents)
  const toggleDestination = (destId: string) => {
    setLoadedRouteFromMap(false);
    setFormData((prev) => {
      if (destId === "custom-route") {
        return { ...prev, destinations: [] };
      }

      const getPhysicalIslandsOfRoute = (routeId: string): string[] => {
        const pts = COMPOSITE_ROUTES[routeId];
        if (pts && pts.length > 0) {
          const islands = pts.filter(
            (id) => id !== "chalong" && id !== "ao-po" && id !== "coco",
          );
          if (islands.length > 0) return islands;
        }
        return [routeId];
      };

      const constituents = getPhysicalIslandsOfRoute(destId);
      const allSelected = constituents.every((id) =>
        prev.destinations.includes(id),
      );

      let newDestinations;
      if (allSelected) {
        newDestinations = prev.destinations.filter(
          (d) => !constituents.includes(d),
        );
      } else {
        const missing = constituents.filter(
          (id) => !prev.destinations.includes(id),
        );
        newDestinations = [...prev.destinations, ...missing];
      }

      let newDuration = prev.charterDuration;
      // If any of the remaining destinations is phi-phi and duration is halfday, force fullday
      const isPhiPhiNow = newDestinations.some((d) => d.includes("phi-phi"));
      if (isPhiPhiNow && prev.charterDuration === "halfday") {
        newDuration = "fullday";
      }

      return {
        ...prev,
        destinations: newDestinations,
        charterDuration: newDuration,
      };
    });
  };

  const handleSelectPackage = (
    pkg: "none" | "birthday" | "anniversary" | "corporate",
  ) => {
    setFormData((prev) => {
      const next = { ...prev, celebrationPackage: pkg };
      if (pkg === "birthday") {
        next.addPartyDecorations = true;
        next.addBirthdayCake = true;
        next.addChampagne = true;
        next.addFlowerBouquet = false;
        next.birthdayCakeCount = 1;
        next.champagneCount = 1;
      } else if (pkg === "anniversary") {
        next.addPartyDecorations = true;
        next.addFlowerBouquet = true;
        next.addChampagne = true;
        next.addBirthdayCake = false;
        next.flowerBouquetCount = 1;
        next.champagneCount = 1;
      } else if (pkg === "corporate") {
        next.addDJ = true;
        next.addPhotographer = true;
        next.addBartender = true;
        next.addPartyDecorations = true;
        next.addBirthdayCake = false;
        next.addFlowerBouquet = false;
        next.bartenderCount = 1;
      } else if (pkg === "none") {
        next.addPartyDecorations = false;
        next.addBirthdayCake = false;
        next.addChampagne = false;
        next.addFlowerBouquet = false;
        next.addDJ = false;
        next.addPhotographer = false;
        next.addDroneVideography = false;
        next.addBartender = false;
      }
      return next;
    });
  };

  // Smart Departure Pier Recommendation Engine
  const recommendationInfo = useMemo(() => {
    const selectedDests = getOrderedDestinations(formData.destinations);
    const recommends = selectedDests.map((d) => d.recommendedPierId);

    // Count occurrences of recommended piers
    const counts = recommends.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    let primaryRecommendedPierId = "chalong";
    let maxCount = 0;
    Object.entries(counts).forEach(([pierId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryRecommendedPierId = pierId;
      }
    });

    const primaryRecommendedPier = PIERS.find(
      (p) => p.id === primaryRecommendedPierId,
    );
    const mismatch = formData.startPierId !== primaryRecommendedPierId;

    return {
      recommendedPierId: primaryRecommendedPierId,
      recommendedPierName: primaryRecommendedPier?.name || "Chalong Pier",
      mismatch,
    };
  }, [formData.destinations, formData.startPierId]);

  // Live estimated price calculation memo
  const priceCalculation = useMemo(() => {
    if (!selectedVesselObj)
      return { basePrice: 0, foodPrice: 0, upgradesList: [], total: 0 };

    const upgradesList: { name: string; price: number }[] = [];

    // Base Price calculation automatically retrieves configured or default rate
    let basePrice = 0;
    if (selectedVesselObj && selectedVesselObj.id) {
      const vId = selectedVesselObj.id;
      const vesselRates = activeRates[vId] || VESSEL_BASE_RATES[vId];
      if (vesselRates) {
        if (formData.charterDuration === "halfday") {
          basePrice =
            formData.halfDaySlot === "sunset"
              ? vesselRates.sunset || vesselRates.halfday
              : vesselRates.halfday;
        } else if (formData.charterDuration === "fullday") {
          basePrice = vesselRates.fullday;
        } else if (formData.charterDuration === "overnight") {
          basePrice = (vesselRates.overnight || 0) * (formData.overnightDays || 1);
        }
      }
    }

    if (isAgentOverride && customAgentPrices.basePrice !== "") {
      basePrice = parseFloat(customAgentPrices.basePrice) || 0;
    }

    // Food Option calculation (per guest)
    let foodPrice = 0;
    const guestTotal = formData.guestCount || 1;
    if (isAgentOverride && customAgentPrices.foodPrice !== "") {
      foodPrice = parseFloat(customAgentPrices.foodPrice) || 0;
    } else {
      if (formData.foodOption === "seafood-bbq") {
        foodPrice = 1200 * guestTotal;
      } else if (formData.foodOption === "royal-thai") {
        foodPrice = 900 * guestTotal;
      } else if (formData.foodOption === "premium-western") {
        foodPrice = 2200 * guestTotal;
      }
    }

    const pricingSource =
      isAgentOverride || isReferred ? currentCoagent || currentAgent : null;

    // Upgrades calculation
    const getPrice = (
      key: string,
      defaultPricePerUnit: number,
      quantity: number = 1,
    ) => {
      // For referral links or agent workspace override
      if (
        pricingSource &&
        (pricingSource as any).customPricing?.standardExtras &&
        (pricingSource as any).customPricing.standardExtras[key] !== undefined
      ) {
        return (
          (parseFloat(
            (pricingSource as any).customPricing.standardExtras[key],
          ) || 0) * quantity
        );
      }

      // Old legacy format fallback just in case
      if (isAgentOverride) {
        if (
          customAgentPrices[key] !== undefined &&
          customAgentPrices[key] !== ""
        ) {
          return (parseFloat(customAgentPrices[key]) || 0) * quantity;
        }
        if (
          currentAgent &&
          (currentAgent as any).priceList &&
          (currentAgent as any).priceList[key] !== undefined
        ) {
          return (
            (parseFloat((currentAgent as any).priceList[key]) || 0) * quantity
          );
        }
      }
      return defaultPricePerUnit * quantity;
    };

    // Calculate dynamic destinations override prices based on specific vessel + route combinations
    const selectedDestPrices: { id: string; name: string; price: number }[] = [];
    formData.destinations.forEach((destId) => {
      const key = `${selectedVesselObj.id}_${destId}`;
      let val = 0;

      if (
        pricingSource &&
        (pricingSource as any).customPricing?.routes &&
        (pricingSource as any).customPricing.routes[key] !== undefined
      ) {
        val = parseFloat((pricingSource as any).customPricing.routes[key]);
      } else {
        // Default destination prices
        const destObj = DESTINATIONS.find((d) => d.id === destId);
        if (destObj && destObj.priceOverlay) {
          val = destObj.priceOverlay;
        }
      }

      if (!isNaN(val) && val > 0) {
        const destObj = DESTINATIONS.find((d) => d.id === destId);
        selectedDestPrices.push({
          id: destId,
          name: destObj?.name || destId,
          price: val,
        });
      }
    });

    // Sort selected prices high to low so the most expensive (furthest fuel/route) is primary
    selectedDestPrices.sort((a, b) => b.price - a.price);

    if (selectedDestPrices.length > 0) {
      const primary = selectedDestPrices[0];
      if (selectedDestPrices.length === 1) {
        upgradesList.push({
          name: `Primary Route Surcharge: ${primary.name}`,
          price: primary.price,
        });
      } else {
        upgradesList.push({
          name: `Primary Route Surcharge: ${primary.name}`,
          price: primary.price,
        });
        selectedDestPrices.slice(1).forEach((sec) => {
          const secondaryHopPrice = Math.round(sec.price * 0.3); // 70% Off for subsequent Island Hopping!
          upgradesList.push({
            name: `↳ Island Hopping Special: ${sec.name} (70% Discount!)`,
            price: secondaryHopPrice,
          });
        });
      }
    }

    if (formData.addWaterSlider) {
      upgradesList.push({
        name: "Inflatable Sea Water Slider",
        price: getPrice("waterSlider", 4500),
      });
    }
    if (formData.addInflatablePool) {
      upgradesList.push({
        name: "Inflatable Ocean Swimming Pool",
        price: getPrice("inflatablePool", 5000),
      });
    }
    const maxCabinsAllowed = getVesselMaxCabins(selectedVesselObj.id, formData.charterDuration);
    const calculatedCabinCount = Math.min(formData.cabinCount || 0, maxCabinsAllowed);
    if (calculatedCabinCount > 0) {
      upgradesList.push({
        name: `Private Cabin Access (Qty: ${calculatedCabinCount})`,
        price: getPrice("cabinCount", 3000, calculatedCabinCount),
      });
    }
    if (formData.addGasBBQ) {
      upgradesList.push({
        name: "Gas Barbecue Grill",
        price: getPrice("gasBBQ", 2000),
      });
    }
    if (formData.addCharcoalBBQ && selectedVesselObj.id === "the-best") {
      upgradesList.push({
        name: "Charcoal Barbecue Grill",
        price: getPrice("charcoalBBQ", 2500),
      });
    }
    if (formData.extraWatermelon > 0) {
      upgradesList.push({
        name: `Extra Watermelon (Qty: ${formData.extraWatermelon})`,
        price: getPrice("extraWatermelon", 200, formData.extraWatermelon),
      });
    }
    if (formData.extraSnack > 0) {
      upgradesList.push({
        name: `Extra Snack Plates (Qty: ${formData.extraSnack})`,
        price: getPrice("extraSnack", 300, formData.extraSnack),
      });
    }
    if (formData.extraPineapple > 0) {
      upgradesList.push({
        name: `Extra Pineapple (Qty: ${formData.extraPineapple})`,
        price: getPrice("extraPineapple", 200, formData.extraPineapple),
      });
    }
    if (formData.addKaraoke && selectedVesselObj.id === "the-best") {
      upgradesList.push({
        name: "On-Board Karaoke Entertainment System",
        price: getPrice("karaoke", 3500),
      });
    }
    if (formData.addLongtailBoat) {
      upgradesList.push({
        name: "Private Longtail Boat Exploration",
        price: getPrice("longtailBoat", 4000),
      });
    }
    if (formData.addMayaBayTicketAndLongtail) {
      upgradesList.push({
        name: "Maya Bay Access Tickets & Longtail Boat",
        price: getPrice("mayaBayTicketAndLongtail", 6000),
      });
    }
    if (formData.addJamesBondTicket) {
      upgradesList.push({
        name: `James Bond Island Tickets (x${guestTotal})`,
        price: getPrice("jamesBondTicket", 500 * guestTotal),
      });
    }
    if (
      formData.addRubberCanoe &&
      formData.destinations.includes("ko-kalu-ok")
    ) {
      upgradesList.push({
        name: `Koh Kalu Ok Rubber Canoes (x${formData.rubberCanoeCount})`,
        price: 0,
      });
    }

    const isVisitingKohKhaiNok =
      formData.destinations.includes("koh-khai-nok") ||
      formData.destinations.includes("koh-khai-nok-maithon") ||
      formData.destinations.includes("naga-noi") ||
      formData.destinations.includes("naga-yai") ||
      formData.destinations.includes("koh-yao-yai-koh-hong-james-bond");
    if (formData.addJetski && isVisitingKohKhaiNok) {
      const durFactor =
        formData.jetskiDuration === "30m"
          ? 2500
          : formData.jetskiDuration === "1h"
            ? 4000
            : 7500;
      upgradesList.push({
        name: `Jet Ski Tour (${formData.jetskiCount}x for ${formData.jetskiDuration})`,
        price: getPrice("jetski", durFactor * (formData.jetskiCount || 1)),
      });
    }
    if (formData.addMinibusTransfer) {
      upgradesList.push({
        name: "Roundtrip Minibus Transfer",
        price: getPrice("minibusTransfer", 1800),
      });
    }
    if (formData.guideLanguage !== "none") {
      upgradesList.push({
        name: `Professional Host Guide (${formData.guideLanguage})`,
        price: getPrice("guide", 3000),
      });
    }
    if (formData.fishingRodsCount > 0) {
      upgradesList.push({
        name: `Premium Fishing Gear (x${formData.fishingRodsCount} Rods)`,
        price: getPrice("fishingGear", 500 * formData.fishingRodsCount),
      });
    }
    if (formData.fishingHandlinesCount > 0) {
      upgradesList.push({
        name: `Fishing Handlines (x${formData.fishingHandlinesCount})`,
        price: getPrice("fishingHandlines", 0),
      });
    }
    if (formData.addBartender) {
      upgradesList.push({
        name: `Professional Bartender (x${formData.bartenderCount})`,
        price: getPrice("bartender", 2500 * (formData.bartenderCount || 1)),
      });
    }
    if (formData.addBirthdayCake) {
      upgradesList.push({
        name: `Celebration Birthday Cake (x${formData.birthdayCakeCount})`,
        price: getPrice(
          "birthdayCake",
          1500 * (formData.birthdayCakeCount || 1),
        ),
      });
    }
    if (formData.addChampagne) {
      upgradesList.push({
        name: `Chilled Champagne Bottle (x${formData.champagneCount})`,
        price: getPrice("champagne", 2500 * (formData.champagneCount || 1)),
      });
    }
    if (formData.addPartyDecorations) {
      upgradesList.push({
        name: `Premium Party Themes & Decorations`,
        price: getPrice("partyDecorations", 3500),
      });
    }
    if (formData.addFlowerBouquet) {
      upgradesList.push({
        name: `Premium Flower Bouquet (x${formData.flowerBouquetCount})`,
        price: getPrice(
          "flowerBouquet",
          2000 * (formData.flowerBouquetCount || 1),
        ),
      });
    }
    if (formData.addPhotographer) {
      upgradesList.push({
        name: "Professional Photographer",
        price: getPrice("photographer", 5000),
      });
    }
    if (formData.addDroneVideography) {
      upgradesList.push({
        name: "Drone Videography",
        price: getPrice("droneVideography", 6500),
      });
    }
    if (formData.addDJ) {
      upgradesList.push({
        name: "Live DJ Onboard",
        price: getPrice("dj", 7500),
      });
    }
    if (formData.addSashimi) {
      upgradesList.push({
        name: "Sashimi Preparation (If tuna/fish is caught)",
        price: getPrice("sashimi", 1000),
      });
    }
    if (formData.redWineBottles > 0) {
      upgradesList.push({
        name: `Red Wine (${formData.redWineBottles}x Bottle(s))`,
        price: getPrice("redWine", 2500 * formData.redWineBottles),
      });
    }
    if (formData.whiteWineBottles > 0) {
      upgradesList.push({
        name: `White Wine (${formData.whiteWineBottles}x Bottle(s))`,
        price: getPrice("whiteWine", 2500 * formData.whiteWineBottles),
      });
    }
    if (formData.beerCartons > 0) {
      upgradesList.push({
        name: `Beer (${formData.beerCartons}x Carton(s))`,
        price: getPrice("beer", 1500 * formData.beerCartons),
      });
    }

    // Dynamically calculate manually added custom extras
    if (formData.customAddonKeys && formData.customAddonKeys.length > 0) {
      formData.customAddonKeys.forEach((key) => {
        const skipKeys = ["waterSlider", "inflatablePool", "cabinCount", "gasBBQ", "charcoalBBQ", "extraWatermelon", "extraSnack", "extraPineapple", "karaoke", "longtailBoat", "mayaBayTicketAndLongtail", "jamesBondTicket", "jetski", "minibusTransfer", "guide", "fishingGear", "fishingHandlines", "bartender", "birthdayCake", "champagne", "partyDecorations", "flowerBouquet", "photographer", "droneVideography", "dj", "sashimi", "redWine", "whiteWine", "beer"];
        if (skipKeys.includes(key)) return;

        const extraItem = STANDARD_EXTRAS.find((e) => e.key === key);
        if (extraItem) {
          const defaultVal = extraItem.defaultPrice !== undefined ? extraItem.defaultPrice : 1000;
          upgradesList.push({
            name: `${extraItem.label}`,
            price: getPrice(key, defaultVal),
          });
        }
      });
    }

    if (isAgentOverride && customAgentPrices.destinationSurcharge) {
      const destFee = parseFloat(customAgentPrices.destinationSurcharge) || 0;
      if (destFee > 0) {
        upgradesList.push({ name: "Destination Surcharge", price: destFee });
      }
    }

    if (isAgentOverride && customAgentPrices.customMiscFee !== "") {
      const miscFee = parseFloat(customAgentPrices.customMiscFee) || 0;
      if (miscFee > 0) {
        upgradesList.push({
          name: "Agency Custom Upgrades & Fees",
          price: miscFee,
        });
      }
    }

    const isOvernight = formData.charterDuration === "overnight";
    const upgradesTotal = isOvernight
      ? 0
      : upgradesList.reduce((sum, item) => sum + item.price, 0);
    const finalBasePrice = basePrice;
    const finalFoodPrice = isOvernight ? 0 : foodPrice;
    const finalUpgradesList = isOvernight
      ? upgradesList.map((item) => ({ ...item, price: 0 }))
      : upgradesList;
    let total = isOvernight
      ? basePrice
      : finalBasePrice + finalFoodPrice + upgradesTotal;

    if (
      isAgentOverride &&
      customAgentPrices.finalPrice &&
      customAgentPrices.finalPrice !== ""
    ) {
      const finalOverride = parseFloat(customAgentPrices.finalPrice);
      if (!isNaN(finalOverride)) {
        return {
          basePrice: finalOverride,
          foodPrice: 0,
          upgradesList: finalUpgradesList.map((item) => ({
            ...item,
            price: 0,
          })),
          total: finalOverride,
        };
      }
    }

    return {
      basePrice: finalBasePrice,
      foodPrice: finalFoodPrice,
      upgradesList: finalUpgradesList,
      total,
    };
  }, [
    formData,
    selectedVesselObj,
    customAgentPrices,
    currentAgent,
    isReferred,
    activeRates,
  ]);

  // Generate list of all selected client amenities/upgrades for texts and PDFs
  const allClientAmenities = useMemo(() => {
    const upgrades: string[] = [];
    if (formData.celebrationPackage === "birthday") {
      upgrades.push("Package: Birthday Party Celebration Upgrade");
    } else if (formData.celebrationPackage === "anniversary") {
      upgrades.push("Package: Anniversary & Romantic Proposal Upgrade");
    } else if (formData.celebrationPackage === "corporate") {
      upgrades.push("Package: Corporate Event & Staff Networking Upgrade");
    }
    if (formData.addWaterSlider) upgrades.push("Inflatable Sea Water Slider");
    if (formData.addInflatablePool)
      upgrades.push("Inflatable Ocean Swimming Pool");
    const maxCabinsAllowed = getVesselMaxCabins(selectedVesselObj?.id || "", formData.charterDuration);
    const calculatedCabinCount = Math.min(formData.cabinCount || 0, maxCabinsAllowed);
    if (calculatedCabinCount > 0)
      upgrades.push(`Private Cabin Access (Qty: ${calculatedCabinCount})`);
    if (formData.addGasBBQ) upgrades.push("Gas Barbecue Grill");
    if (formData.addCharcoalBBQ && selectedVesselObj?.id === "the-best") {
      upgrades.push("Charcoal Barbecue Grill");
    }
    if (formData.extraWatermelon > 0)
      upgrades.push(`Extra Watermelon (Qty: ${formData.extraWatermelon})`);
    if (formData.extraSnack > 0)
      upgrades.push(`Extra Snack Plates (Qty: ${formData.extraSnack})`);
    if (formData.extraPineapple > 0)
      upgrades.push(`Extra Pineapple (Qty: ${formData.extraPineapple})`);
    if (formData.addKaraoke && selectedVesselObj?.id === "the-best") {
      upgrades.push("On-Board Karaoke Entertainment System");
    }
    if (formData.addLongtailBoat) {
      upgrades.push("Private Longtail Boat Exploration at Island Stops");
    }
    if (formData.addMayaBayTicketAndLongtail) {
      upgrades.push("Maya Bay Access Tickets & Longtail Boat Package");
    }
    if (formData.addJamesBondTicket) {
      upgrades.push(
        "James Bond Island National Park Entry & Sightseeing Ticket",
      );
    }
    const isVisitingKohKhaiNok =
      formData.destinations.includes("koh-khai-nok") ||
      formData.destinations.includes("koh-khai-nok-maithon") ||
      formData.destinations.includes("naga-noi") ||
      formData.destinations.includes("naga-yai") ||
      formData.destinations.includes("koh-yao-yai-koh-hong-james-bond");
    if (formData.addJetski && isVisitingKohKhaiNok) {
      const durText =
        formData.jetskiDuration === "30m"
          ? "30 Minutes"
          : formData.jetskiDuration === "1h"
            ? "1 Hour"
            : "2 Hours";
      upgrades.push(
        `Jet Ski Tour (${formData.jetskiCount}x Jet Ski for ${durText})`,
      );
    }
    if (formData.addMinibusTransfer) {
      const marinaName =
        formData.transferMarina === "chalong"
          ? "Chalong Pier"
          : formData.transferMarina === "ao-po"
            ? "Ao Po Pier"
            : "Coco Pier";
      const pickupInfo = formData.transferPickupAddress
        ? ` from ${formData.transferPickupAddress}`
        : "";
      upgrades.push(
        `Roundtrip Minibus Transfer${pickupInfo} to ${marinaName} (${formData.transferGuests} passengers)`,
      );
    }
    if (formData.guideLanguage !== "none") {
      const langLabels: Record<string, string> = {
        english: "English",
        indian: "Indian",
        chinese: "Chinese",
        "south-korean": "South Korean",
        arabic: "Arabic",
        russian: "Russian",
      };
      upgrades.push(
        `Professional Host Guide (${langLabels[formData.guideLanguage]} Speaking)`,
      );
    }
    if (formData.fishingRodsCount > 0) {
      upgrades.push(
        `Premium Fishing Gear (${formData.fishingRodsCount}x Professional Rods)`,
      );
    } else {
      upgrades.push(
        "2 Complimentary Trolling Rods Included (No additional premium rods)",
      );
    }
    if (formData.fishingHandlinesCount > 0) {
      upgrades.push(`Fishing Handlines (${formData.fishingHandlinesCount}x)`);
    }
    if (formData.addBartender) {
      upgrades.push(
        `Professional Bartender Service (${formData.bartenderCount}x Bartender${formData.bartenderCount > 1 ? "s" : ""} on board)`,
      );
    }
    if (formData.addBirthdayCake) {
      upgrades.push(
        `Celebration Birthday Cake (${formData.birthdayCakeCount}x Freshly Baked Cake${formData.birthdayCakeCount > 1 ? "s" : ""})`,
      );
    }
    if (formData.addPhotographer) upgrades.push("Professional Photographer");
    if (formData.addDJ) upgrades.push("Live DJ");
    if (formData.addDroneVideography) upgrades.push("Drone Videography");
    if (formData.addPartyDecorations)
      upgrades.push("Premium Party Themes & Decorations");
    if (formData.addFlowerBouquet)
      upgrades.push(`Premium Flower Bouquet (${formData.flowerBouquetCount}x)`);
    if (formData.addChampagne)
      upgrades.push(`Chilled Champagne Bottle (${formData.champagneCount}x)`);
    if (formData.addSashimi)
      upgrades.push("Sashimi Preparation (+500-1000 THB to Captain)");
    if (
      formData.addParasailing &&
      formData.destinations.includes("ko-he-north-banana-beach")
    ) {
      upgrades.push("Banana Beach: Parasailing Shore Experience");
    }
    if (
      formData.addBananaBoat &&
      formData.destinations.includes("ko-he-north-banana-beach")
    ) {
      upgrades.push("Banana Beach: High-Speed Banana Boat Ride");
    }
    if (
      formData.addRubberCanoe &&
      formData.destinations.includes("ko-kalu-ok")
    ) {
      upgrades.push(
        `Koh Kalu Ok: Inflatable Rubber Canoe Rental (${formData.rubberCanoeCount}x Canoes, 2 pax max/ea)`,
      );
    }
    if (formData.redWineBottles > 0)
      upgrades.push(`Red Wine (${formData.redWineBottles}x Bottle(s))`);
    if (formData.whiteWineBottles > 0)
      upgrades.push(`White Wine (${formData.whiteWineBottles}x Bottle(s))`);
    if (formData.beerCartons > 0)
      upgrades.push(`Beer (${formData.beerCartons}x Carton(s))`);

    if (formData.specialRequests?.trim()) {
      upgrades.push(`Special Requests: ${formData.specialRequests.trim()}`);
    }

    return upgrades;
  }, [formData, selectedVesselObj]);

  // Generate beautiful message for WhatsApp
  const generatedWhatsAppText = useMemo(() => {
    const catamaranName =
      t(`vessels.${selectedVesselObj.id}.name`) !==
      `vessels.${selectedVesselObj.id}.name`
        ? t(`vessels.${selectedVesselObj.id}.name`)
        : selectedVesselObj.name;

    const pierName = ctx(
      `piers.${selectedPierObj.id}.name`,
      selectedPierObj.name,
    );

    const pierLoc =
      t(`piers.${selectedPierObj.id}.location`) !==
      `piers.${selectedPierObj.id}.location`
        ? t(`piers.${selectedPierObj.id}.location`)
        : selectedPierObj.location;

    // Disembark Pier translation
    const disembarkPierId = formData.endPierId || formData.startPierId;
    const disembarkPierObj =
      PIERS.find((p) => p.id === disembarkPierId) || selectedPierObj;
    const disembarkPierName = ctx(
      `piers.${disembarkPierId}.name`,
      disembarkPierObj.name,
    );

    const destNames =
      formData.charterDuration === "overnight"
        ? "Custom Itinerary Planned with Captain"
        : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
            .map((d) => {
              const dName =
                t(`destinations.${d.id}.name`) !== `destinations.${d.id}.name`
                  ? t(`destinations.${d.id}.name`)
                  : d.name;
              return `${dName} (~${d.distanceNM} NM)`;
            })
            .join(" & ") || "None Selected";

    const formattedDate = formData.charterDate
      ? new Date(formData.charterDate).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "(Please select a date)";

    const upgradesText =
      allClientAmenities.length > 0
        ? allClientAmenities.join(" + ")
        : "Standard inclusions only";

    const durationText =
      formData.charterDuration === "halfday"
        ? formData.halfDaySlot === "afternoon"
          ? "Half Day Afternoon (from 14:30)"
          : formData.halfDaySlot === "sunset"
            ? "Promthep Sunset (from 16:00)"
            : "Half Day Morning (from 08:30)"
        : formData.charterDuration === "fullday"
          ? "Full Day Yacht Cruise (approx. 8-9 hours)"
          : `Bespoke Overnight Yacht Charter (${formData.overnightDays} ${formData.overnightDays === 1 ? "Day / 1 Night" : `Days / ${formData.overnightDays} Nights`})`;

    let selectedFoodLabel =
      selectedVesselObj.id === "the-best"
        ? "Standard Cool Soft Drinks, Snacking, Fruit Platters & Café Espresso Included"
        : "Standard Cool Soft Drinks, Snacking & Fruit Platters Included";
    if (formData.foodOption === "seafood-bbq") {
      selectedFoodLabel =
        "Deluxe Andaman Grilled Seafood BBQ (Tiger prawns, local squid & seabass)";
    } else if (formData.foodOption === "royal-thai") {
      selectedFoodLabel =
        "Royal Thai Buffet Feast (Classic local Phuket crab curries, tom yum & pad-thai)";
    } else if (formData.foodOption === "premium-western") {
      selectedFoodLabel =
        "Luxury Multi-Course Western Dining (Seated scallops & prime medallions)";
    }

    const lineIdText =
      currentAgent && currentAgent.lineId
        ? ` | Line ID: ${currentAgent.lineId}`
        : "";
    const companyText =
      currentAgent && currentAgent.companyName
        ? ` | Company: ${currentAgent.companyName}${currentAgent.taxId ? ` (Tax ID: ${currentAgent.taxId})` : ""}`
        : "";
    const agentSignature = currentAgent
      ? `\n• *Broker Agent:* ${currentAgent.name} (Contact: ${getContactPhone()}${lineIdText}${companyText})`
      : "";

    const brandTitle = currentAgent?.companyName
      ? currentAgent.companyName.toUpperCase()
      : "PRIVATE YACHT";
    return (
      `*${brandTitle} CHARTER INQUIRY* ⛵✨\n\n` +
      `• *Guest Name:* ${formData.customerName || "Interested Guest"}\n` +
      `• *Catamaran:* ${catamaranName} (${selectedVesselObj.model})\n` +
      `• *Charter Type:* ${durationText}\n` +
      `• *Date:* ${formattedDate}\n` +
      `• *Start Pier:* ${pierName} (${pierLoc})\n` +
      (formData.endPierId && formData.endPierId !== formData.startPierId
        ? `• *Disembark Pier:* ${disembarkPierName}\n`
        : "") +
      `• *Destinations:* ${destNames}\n` +
      `• *Guests:* ${formData.guestCount} passengers (${formData.guestsAdults} Adults${formData.guestsKids > 0 ? `, ${formData.guestsKids} Kids [0-17 years]` : ""})\n` +
      `• *Catering Selection:* ${selectedFoodLabel}\n` +
      `• *Add-on Upgrades:* ${upgradesText}\n` +
      `• *Special Requests:* ${formData.specialRequests || "None"}${agentSignature}\n\n` +
      `Hello! I'd love to inquire about a private charter in Phuket. Please send availability and package details! 🌴🐠`
    );
  }, [
    formData,
    selectedVesselObj,
    selectedPierObj,
    t,
    currentAgent,
    getContactPhone,
    priceCalculation,
    formatPrice,
    currency,
  ]);

  const saveCustomerRequestToAgentWorkspace = async (
    skipNotification: boolean = false,
  ) => {
    let newId = `prop-${Date.now()}`;
    try {
      const stored = localStorage.getItem("phuket_charter_proposals");
      let proposals = stored ? JSON.parse(stored) : [];

      const agentEmail = currentAgent ? currentAgent.email : null;

      let finalCustomerUid = auth.currentUser?.uid || null;

      if (
        wantToRegister &&
        formData.customerEmail &&
        registerPassword &&
        !auth.currentUser
      ) {
        try {
          const { createUserWithEmailAndPassword, updateProfile } =
            await import("firebase/auth");
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.customerEmail,
            registerPassword,
          );
          if (userCredential.user) {
            await updateProfile(userCredential.user, {
              displayName: formData.customerName || "Interested Guest",
            });

            // Log this registered user to firestore so they have a client profile
            const clientDocRef = doc(db, "customers", userCredential.user.uid);
            await setDoc(
              clientDocRef,
              {
                uid: userCredential.user.uid,
                name: formData.customerName,
                email: formData.customerEmail,
                phone: formData.customerPhone || "",
                createdAt: new Date().toISOString(),
                authStatus: "registered_from_booking",
              },
              { merge: true },
            );

            finalCustomerUid = userCredential.user.uid;
          }
        } catch (regErr: any) {
          console.warn(
            "Failed automatic guest registration upon booking submission:",
            regErr,
          );
          alert(
            `Note: Guest account registration could not be completed automatically: ${regErr.message || regErr}. However, your booking request was logged successfully.`,
          );
        }
      }

      const newProposal = {
        id: newId,
        clientName: formData.customerName || "Web Booking Request",
        charterDate:
          formData.charterDate || new Date().toISOString().split("T")[0],
        vesselId1: formData.vesselId,
        vesselId2: formData.vesselId, // Default same or fallback
        vesselId3: "",
        price1: priceCalculation?.total
          ? priceCalculation.total.toString()
          : "",
        price2: "",
        price3: "",
        compareCount: 1,
        createdAt: new Date().toISOString().split("T")[0],
        agentEmail: agentEmail,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        hotelPickupLocation: formData.hotelPickupLocation || "",
        customerUid: finalCustomerUid,
      };

      proposals = [newProposal, ...proposals];
      localStorage.setItem(
        "phuket_charter_proposals",
        safeStringify(proposals),
      );
      window.dispatchEvent(new Event("proposals-updated"));

      // Play audio feedback for successful booking
      playSuccessChime();

      // Save to Firestore with timeout support
      try {
        const addDocPromise = setDoc(doc(db, "booking_requests", newId), {
          ...newProposal,
          timestamp: serverTimestamp(),
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Save booking_requests timeout (quota/offline)"),
              ),
            1500,
          ),
        );
        await Promise.race([addDocPromise, timeoutPromise]);
      } catch (fbErr) {
        console.warn(
          "Firestore proposal save skipped due to database offline/quota limit:",
          fbErr,
        );
        // Alert top layout
        window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
      }

      // Try sending automated summary email with PDF attachment asynchronously
      const emailToUse =
        formData.customerEmail ||
        (auth.currentUser ? auth.currentUser.email : null);
      if (emailToUse) {
        setTimeout(async () => {
          try {
            console.log("Compiling PDF for automated confirmation email...");
            // Invoke generatePdfBrochure without downloading to client
            const pdfBase64 = await generatePdfBrochure(false);
            if (pdfBase64) {
              const routeText =
                formData.charterDuration === "overnight"
                  ? "Custom Overnight Itinerary"
                  : getOrderedDestinations(formData.destinations)
                      .map((d) => d.name)
                      .join(" • ");

              await sendBookingConfirmationEmail({
                to: [emailToUse],
                customerName: formData.customerName || "Valued Guest",
                bookingRequestRef: null,
              });
            }
          } catch (emailErr) {
            console.error(
              "Error during background automated email dispatch:",
              emailErr,
            );
          }
        }, 100);
      }

      // Admin Notification Trigger & History Logging
      const isAgentBooking = currentAgent && !isReferred;
      const notificationTitle = isAgentBooking
        ? `New Agent Booking: ${currentAgent.name}`
        : `New Direct Customer Booking: ${formData.customerName || "Web Guest"}`;

      const notificationMessage = isAgentBooking
        ? `Agent ${currentAgent.name} (Email: ${agentEmail}) has just submitted a booking request for client "${newProposal.clientName}".`
        : `Customer ${formData.customerName} (${formData.customerEmail}) has submitted a booking for ${formData.charterDate}. [SECRET_REF: ${newId}]`;

      if (!skipNotification) {
        window.dispatchEvent(
          new CustomEvent("admin-trigger", {
            detail: {
              title: notificationTitle,
              message: notificationMessage,
            },
          }),
        );
      }

      // Explicitly log into customer history if UID is present
      if (auth.currentUser?.uid) {
        try {
          const historyRef = doc(
            db,
            "customers",
            auth.currentUser.uid,
            "bookings",
            newId,
          );
          await setDoc(historyRef, {
            ...newProposal,
            timestamp: serverTimestamp(),
            status: "new_request",
          });
        } catch (histErr) {
          console.warn(
            "Failed to log specific sub-collection history:",
            histErr,
          );
        }
      }

      setFinalizedBookingReference(newId);
    } catch (e) {
      console.error(e);
    }
    return newId;
  };

  const generateAgentBookingRequestPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // Clean emojis & non-ASCII characters
    const clean = (str: string) => {
      if (!str) return "";
      return str
        .replace(/[\uD800-\uDFFF]./g, "")
        .replace(/[⛵✨🌴🐠🌊🔒✓🎣🍽🍹🎂👑🎁⭐•*]/g, "")
        .replace(/[~≈]/g, "")
        .replace(/[^\x00-\x7F]/g, " ")
        .trim();
    };

    let currentY = 20;
    const addLine = (
      text: string,
      isBold = false,
      size = 10,
      align: "left" | "center" | "right" = "left",
      color = [15, 23, 42],
    ) => {
      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(
        clean(text),
        align === "center" ? 105 : align === "right" ? 190 : 20,
        currentY,
        { align },
      );
      currentY += size / 2 + 2;
    };

    // Generate Quotation Number
    const currentYear = new Date().getFullYear();
    const qStorageKey = "charter_quotation_sequence";
    let qSeq = 1;
    let storedQ = localStorage.getItem(qStorageKey);
    if (storedQ) {
      try {
        const parsed = JSON.parse(storedQ);
        if (parsed.year === currentYear) {
          qSeq = parsed.seq; // do not increment twice per click, assume generated already by brochure if clicked together. But wait, if they only click booking request, we must increment. Let's just use the logic and increment it or use what's there. Actually, let's just use the standard logic and increment.
          qSeq++;
        }
      } catch (e) {}
    }
    localStorage.setItem(
      qStorageKey,
      JSON.stringify({ year: currentYear, seq: qSeq }),
    );
    const quotationNumber = `QT-${currentYear}-${qSeq.toString().padStart(4, "0")}`;

    const pdfBrandName = currentAgent?.companyName
      ? currentAgent.companyName.toUpperCase()
      : "OFFICIAL BOOKING REQUEST";
    addLine(
      pdfBrandName + " - BOOKING REQUEST",
      true,
      16,
      "center",
      [5, 150, 105],
    );

    addLine(
      `Quotation: ${quotationNumber}`,
      true,
      10,
      "right",
      [100, 116, 139],
    );
    currentY += 5;

    const dateStr = new Date().toLocaleDateString();
    addLine("Client Details", true, 12, "left");
    currentY += 2;
    addLine(`Date of Request: ${dateStr}`);
    addLine(`Client Name: ${formData.customerName || "Interested Guest"}`);
    if (formData.customerPhone)
      addLine(`Phone/WhatsApp: ${formData.customerPhone}`);
    if (formData.customerEmail) addLine(`Email: ${formData.customerEmail}`);
    currentY += 5;

    addLine("Primary Charter Selection", true, 12, "left");
    currentY += 2;
    addLine(`Vessel: ${selectedVesselObj?.name} (${selectedVesselObj?.model})`);
    addLine(`Charter Date: ${formData.charterDate || "Not Specified"}`);
    addLine(
      `Duration: ${formData.charterDuration === "halfday" ? (formData.halfDaySlot === "afternoon" ? "Half Day Afternoon" : formData.halfDaySlot === "sunset" ? "Promthep Sunset" : "Half Day Morning") : formData.charterDuration === "fullday" ? "Full Day" : "Overnight Suite"}`,
    );
    addLine(
      `Total Guests: ${formData.guestCount} (${formData.guestsAdults} Adults, ${formData.guestsKids} Kids)`,
    );
    addLine(`Departure Pier: ${selectedPierObj?.name}`);

    const destNames =
      formData.charterDuration === "overnight"
        ? "Custom Itinerary Planned with Captain"
        : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
            .map((d) => d.name)
            .join(", ") || "None Selected";
    addLine(`Destinations: ${destNames}`);
    currentY += 5;

    addLine("Available Upgrades & Add-ons Checklist", true, 12, "left");
    currentY += 2;

    const boolOptions = [
      { key: "addWaterSlider", label: "Water Slider" },
      { key: "addInflatablePool", label: "Inflatable Pool" },
      { key: "addGasBBQ", label: "Gas BBQ Grill" },
      { key: "addCharcoalBBQ", label: "Charcoal BBQ" },
      { key: "addKaraoke", label: "Karaoke System" },
      { key: "addLongtailBoat", label: "Longtail Boat" },
      { key: "addPhotographer", label: "Professional Photographer" },
      { key: "addDJ", label: "Live DJ" },
      { key: "addTourGuide", label: "Tour Guide" },
      { key: "addNationalParkFee", label: "National Park Fee Paid" },
      { key: "addDroneVideography", label: "Drone Videography" },
      { key: "addBirthdayCake", label: "Birthday Cake" },
      { key: "addPartyDecorations", label: "Party Theme & Decor" },
      { key: "addFlowerBouquet", label: "Flower Bouquet" },
      { key: "addChampagne", label: "Champagne Bottle" },
    ];

    boolOptions.forEach((opt) => {
      const isSelected = !!(formData as any)[opt.key];
      let rowLabel = opt.label;
      if (isSelected) {
        if (opt.key === "addBirthdayCake")
          rowLabel += ` (x${formData.birthdayCakeCount})`;
        if (opt.key === "addChampagne")
          rowLabel += ` (x${formData.champagneCount})`;
        if (opt.key === "addFlowerBouquet")
          rowLabel += ` (x${formData.flowerBouquetCount})`;
      }
      addLine(
        `[ ${isSelected ? "X" : " "} ] ${rowLabel}`,
        isSelected,
        10,
        "left",
        isSelected ? [5, 150, 105] : [100, 116, 139],
      );
    });

    // Sashimi special
    const isSashimi = !!formData.addSashimi;
    addLine(
      `[ ${isSashimi ? "X" : " "} ] Sashimi Prep (+500-1k THB)`,
      isSashimi,
      10,
      "left",
      isSashimi ? [5, 150, 105] : [100, 116, 139],
    );

    const quantityOptions = [
      { key: "cabinCount", label: "Cabin Access" },
      { key: "extraWatermelon", label: "Extra Watermelon Platters" },
      { key: "extraSnack", label: "Extra Snack Buckets" },
      { key: "extraPineapple", label: "Extra Pineapple Platters" },
      { key: "beerCartons", label: "Beer Cartons" },
      { key: "addMinibus", label: "Minibus Transfer (Roundtrip)" },
    ];

    quantityOptions.forEach((opt) => {
      const qty = (formData as any)[opt.key] || 0;
      if (qty > 0) {
        addLine(`[ ${qty} ] ${opt.label}`, true, 10, "left", [5, 150, 105]);
      } else {
        addLine(`[ 0 ] ${opt.label}`, false, 10, "left", [100, 116, 139]);
      }
    });

    if (formData.redWineBottles > 0) {
      addLine(
        `[ ${formData.redWineBottles} ] Red Wine Bottles`,
        true,
        10,
        "left",
        [5, 150, 105],
      );
    } else {
      addLine(`[ 0 ] Red Wine Bottles`, false, 10, "left", [100, 116, 139]);
    }

    if (formData.whiteWineBottles > 0) {
      addLine(
        `[ ${formData.whiteWineBottles} ] White Wine Bottles`,
        true,
        10,
        "left",
        [5, 150, 105],
      );
    } else {
      addLine(`[ 0 ] White Wine Bottles`, false, 10, "left", [100, 116, 139]);
    }

    currentY += 5;
    addLine("Catering Selected", true, 12, "left");
    currentY += 2;
    addLine(`Seafood Catering: ${formData.cateringSeafood ? "Yes" : "No"}`);
    addLine(`Thai Catering: ${formData.cateringThai ? "Yes" : "No"}`);
    addLine(`Western Catering: ${formData.cateringWestern ? "Yes" : "No"}`);
    addLine(
      `Vegetarian Catering: ${formData.cateringVegetarian ? "Yes" : "No"}`,
    );

    currentY += 5;
    if (formData.specialRequests) {
      addLine("Special Requests & Notes", true, 12, "left");
      currentY += 2;

      const lines = doc.splitTextToSize(clean(formData.specialRequests), 170);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(lines, 20, currentY);
      currentY += lines.length * 5;
    }

    currentY += 10;

    // Add Maritime Guidelines and Conduct
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      "HARBOUR DIRECTIVES & SEAWORTHINESS LEGAL DISCLAIMERS:",
      20,
      currentY,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);

    let policyY = currentY + 3.5;
    const policies = [
      "Estimates are based on standard seasonal charter rates, catering ingredients, and official partner services. Final binding invoices are offered dynamically by authorized Brokers depending on tidal height variances, exact state national park fees, and specific holiday surcharges.",
      "Under the regulations set by the Harbor Master Department of the Kingdom of Thailand, all charter passengers must wear approved marine safety life vests at all times during yacht transit. The onboard skipper and captain command the absolute authority to adjust or change scheduled destinations depending on safe wind conditions and maritime weather safety bulletins.",
      "Proper identification documents, such as a valid passport scan or Thai National ID copy, must be furnished via WhatsApp or Email direct synchronization at least 72 hours down to departure for official marine insurance registration and manifest approvals.",
    ];

    policies.forEach((policy) => {
      policyY += 4.5;
      const splitPolicy = doc.splitTextToSize(policy, 170);
      doc.text(splitPolicy, 20, policyY);
      policyY += (splitPolicy.length - 1) * 3;
    });

    policyY += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("RULES ON BOARD:", 20, policyY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);

    const rulesOnBoard = [
      "• No shoes are allowed on board. Please use the designated shoe basket before boarding.",
      "• Smoking is strictly prohibited inside the cabins and saloon. Please smoke only in designated outdoor aft areas.",
      "• Please do not throw toilet paper or sanitary products into the marine toilets to avoid blockages.",
      "• Illegal substances and weapons are strictly prohibited on board under Thai Maritime Law.",
      "• Protect the ocean: Do not throw any trash, plastics, or cigarette butts into the sea.",
    ];

    rulesOnBoard.forEach((rule) => {
      policyY += 4.5;
      const splitRule = doc.splitTextToSize(rule, 170);
      doc.text(splitRule, 20, policyY);
      policyY += (splitRule.length - 1) * 3;
    });

    currentY = policyY + 10;

    addLine(
      "Please contact the agent for an accurate quote and availability.",
      true,
      12,
      "left",
      [5, 150, 105],
    );

    const clientNameClean = (formData.customerName || "guest")
      .toLowerCase()
      .replace(/\s+/g, "_");
    doc.save(`booking_request_${clientNameClean}_to_agent.pdf`);
  };

  const validateCustomerDetails = (): boolean => {
    if (!formData.customerName?.trim()) {
      alert("Please enter the Guest Name in Step 2 before proceeding.");
      document.getElementById("booking-name-input-step2")?.focus();
      return false;
    }
    if (!formData.customerEmail?.trim() && !formData.customerPhone?.trim()) {
      alert(
        "Please provide at least an Email address or Contact Phone in Step 2.",
      );
      document.getElementById("booking-email-input-step2")?.focus();
      return false;
    }
    return true;
  };

  const handleWhatsAppAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!validateCustomerDetails()) return;

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode && !formData.customerPhone) {
      alert("Please enter the Customer's Phone Number to contact them.");
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    // In agent mode, the agent sends the proposal to the customer. Otherwise, the customer sends it to the agent.
    const introText = isAgentMode
      ? `Hello ${formData.customerName || "there"}! I have prepared your private charter booking for ${selectedVesselObj?.name} on ${formData.charterDate || "a future date"}.\n\nPlease see the attached PDF Brochure document for all the details, pricing, and itinerary! Let me know if you would like to proceed. 🌴🐠`
      : `*(Please remember to manually attach the downloaded PDF Brochure here before sending!)*\n\nHello! I am sending my private charter booking for ${selectedVesselObj?.name} on ${formData.charterDate || "a future date"}.\n\nPlease see the attached PDF Brochure document for all my selected options, catering preferences, and passenger details. Looking forward to your response! 🌴🐠`;

    const encodedText = encodeURIComponent(introText);

    let targetPhone = getNormalizedWhatsApp();
    if (isAgentMode) {
      targetPhone = formData.customerPhone.replace(/\D/g, "");
    }

    const url = `https://wa.me/${targetPhone}?text=${encodedText}`;

    setTimeout(() => {
      window.open(url, "_blank");
    }, 500);

    if (onSubmitSuccess) {
      generatePdfBrochure(false).then((pdfBase64) => {
        onSubmitSuccess({
          vesselName: selectedVesselObj?.name || "Charter",
          vesselModel: selectedVesselObj?.model || "",
          vesselImage: selectedVesselObj?.image || "",
          charterDate: formData.charterDate,
          guestCount: formData.guestCount,
          excursionRoute:
            formData.charterDuration === "overnight"
              ? "Custom Overnight Itinerary"
              : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                  .map((d) => d.name)
                  .join(" • "),
          totalPrice: priceCalculation.total,
          charterDuration: formData.charterDuration,
          amenities: allClientAmenities,
          optInReminder: formData.optInReminder,
          actionType: "whatsapp",
          pdfBase64: pdfBase64 || undefined,
        });
      });
    }
  };

  const handleEmailAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!validateCustomerDetails()) return;

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode && !formData.customerEmail) {
      alert("Please enter the Customer's Email Address to contact them.");
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    let subject = "";
    let body = "";
    let targetEmail = "";

    if (isAgentMode) {
      // In agent mode, the agent sends the proposal to the customer.
      targetEmail = formData.customerEmail;
      subject = `Your Private Yacht Charter Proposal: ${selectedVesselObj?.name}`;
      body = `Hello ${formData.customerName || "there"}!\n\nI have prepared your private charter booking for ${selectedVesselObj?.name} on ${formData.charterDate || "a future date"}.\n\nPlease see the attached PDF Brochure document for all the details, pricing, and itinerary!\n\nLet me know if you would like to proceed.\n\nBest regards,\n${currentAgent?.name || ""}${currentAgent?.companyName ? `\n${currentAgent.companyName}` : ""}`;
    } else {
      // Customer mode, email the agent or default email
      targetEmail = currentAgent?.email || "booking@charter-partner.com";
      subject = `Charter Inquiry: ${selectedVesselObj?.name}`;
      body = `Hello!\n\nI am sending my private charter booking for ${selectedVesselObj?.name} on ${formData.charterDate || "a future date"}.\n\nPlease see the attached PDF Brochure document for all my selected options, catering preferences, and passenger details.\n*(Please remember to attach the downloaded PDF here before sending!)*\n\nLooking forward to your response!`;
    }

    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => {
      window.open(mailtoUrl, "_blank");
    }, 500);

    if (onSubmitSuccess && !isAgentMode) {
      generatePdfBrochure(false).then((pdfBase64) => {
        onSubmitSuccess({
          vesselName: selectedVesselObj?.name || "Charter",
          vesselModel: selectedVesselObj?.model || "",
          vesselImage: selectedVesselObj?.image || "",
          charterDate: formData.charterDate,
          guestCount: formData.guestCount,
          excursionRoute:
            formData.charterDuration === "overnight"
              ? "Custom Overnight Itinerary"
              : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                  .map((d) => d.name)
                  .join(" • "),
          totalPrice: priceCalculation.total,
          charterDuration: formData.charterDuration,
          amenities: allClientAmenities,
          optInReminder: formData.optInReminder,
          actionType: "email",
          pdfBase64: pdfBase64 || undefined,
        });
      });
    }
  };

  const handleSendToAgentAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    if (onSubmitSuccess) {
      onSubmitSuccess({
        vesselName: selectedVesselObj?.name || "Charter",
        vesselModel: selectedVesselObj?.model || "",
        vesselImage: selectedVesselObj?.image || "",
        charterDate: formData.charterDate,
        guestCount: formData.guestCount,
        excursionRoute:
          formData.charterDuration === "overnight"
            ? "Custom Overnight Itinerary"
            : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                .map((d) => d.name)
                .join(" • "),
        totalPrice: priceCalculation.total,
        charterDuration: formData.charterDuration,
        amenities: allClientAmenities,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        optInReminder: formData.optInReminder,
        actionType: "web",
      });
    }
  };

  const handleCallAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!validateCustomerDetails()) return;

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode && !formData.customerPhone) {
      alert("Please enter the Customer's Phone Number to contact them.");
      return;
    }

    saveCustomerRequestToAgentWorkspace();

    let rawPhone = getContactPhone();
    if (isAgentMode) {
      rawPhone = formData.customerPhone;
    }

    const cleanPhone = rawPhone.replace(/[^\d+]/g, "");
    window.open(`tel:${cleanPhone}`, "_self");
    if (onSubmitSuccess) {
      generatePdfBrochure(false).then((pdfBase64) => {
        onSubmitSuccess({
          vesselName: selectedVesselObj?.name || "Charter",
          vesselModel: selectedVesselObj?.model || "",
          vesselImage: selectedVesselObj?.image || "",
          charterDate: formData.charterDate,
          guestCount: formData.guestCount,
          excursionRoute:
            formData.charterDuration === "overnight"
              ? "Custom Overnight Itinerary"
              : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                  .map((d) => d.name)
                  .join(" • "),
          totalPrice: priceCalculation.total,
          charterDuration: formData.charterDuration,
          amenities: allClientAmenities,
          optInReminder: formData.optInReminder,
          actionType: "call",
          pdfBase64: pdfBase64 || undefined,
        });
      });
    }
  };

  // Removed handleLiveChatAction

  const handleLiveChatAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    saveCustomerRequestToAgentWorkspace(true);
  };

  const handleLineAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!validateCustomerDetails()) return;

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode) {
      alert(
        "This action is intended for customers to contact the broker via LINE.",
      );
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    let lineId = currentAgent?.lineId || "";
    if (lineId) {
      lineId = lineId.replace(/^@/, "");
      window.open(`https://line.me/ti/p/~${lineId}`, "_blank");
      if (onSubmitSuccess) {
        onSubmitSuccess({
          vesselName: selectedVesselObj?.name || "Charter",
          vesselModel: selectedVesselObj?.model || "",
          vesselImage: selectedVesselObj?.image || "",
          charterDate: formData.charterDate,
          guestCount: formData.guestCount,
          excursionRoute:
            formData.charterDuration === "overnight"
              ? "Custom Overnight Itinerary"
              : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                  .map((d) => d.name)
                  .join(" • "),
          totalPrice: priceCalculation.total,
          charterDuration: formData.charterDuration,
          amenities: allClientAmenities,
          optInReminder: formData.optInReminder,
          actionType: "line",
        });
      }
    } else {
      alert("The broker has not provided a LINE ID.");
    }
  };

  const handleViberAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode && !formData.customerPhone) {
      alert("Please enter the Customer's Phone Number to contact them.");
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    let targetPhone = getContactPhone();
    if (isAgentMode) {
      targetPhone = formData.customerPhone.replace(/\D/g, "");
    } else {
      targetPhone = targetPhone.replace(/\D/g, "");
    }

    // Ensure phone number starts with + if needed by Viber, though usually international format without + works too if country code is present. Let's just pass the numbers.
    const url = `viber://chat?number=${targetPhone}`;

    setTimeout(() => {
      window.open(url, "_self");
    }, 500);

    if (onSubmitSuccess) {
      onSubmitSuccess({
        vesselName: selectedVesselObj?.name || "Charter",
        vesselModel: selectedVesselObj?.model || "",
        vesselImage: selectedVesselObj?.image || "",
        charterDate: formData.charterDate,
        guestCount: formData.guestCount,
        excursionRoute:
          formData.charterDuration === "overnight"
            ? "Custom Overnight Itinerary"
            : DESTINATIONS.filter((d) => formData.destinations.includes(d.id))
                .map((d) => d.name)
                .join(" • "),
        totalPrice: priceCalculation.total,
        charterDuration: formData.charterDuration,
        amenities: allClientAmenities,
        optInReminder: formData.optInReminder,
        actionType: "viber",
      });
    }
  };

  const handleWechatAction = () => {
    if (!acceptedTerms) {
      setTermsError(true);
      const element = document.getElementById("terms-checkbox-container");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const isAgentMode = currentAgent && !isReferred;
    if (isAgentMode) {
      alert(
        "This action is intended for customers to contact the broker via WeChat.",
      );
      return;
    }

    saveCustomerRequestToAgentWorkspace();
    generatePdfBrochure();

    const wechatId = currentAgent?.wechatId || "";
    if (wechatId) {
      navigator.clipboard.writeText(wechatId).then(() => {
        alert(
          `WeChat ID '${wechatId}' has been copied to your clipboard. Please open WeChat to add the broker.`,
        );
        if (onSubmitSuccess) {
          onSubmitSuccess({
            vesselName: selectedVesselObj?.name || "Charter",
            vesselModel: selectedVesselObj?.model || "",
            vesselImage: selectedVesselObj?.image || "",
            charterDate: formData.charterDate,
            guestCount: formData.guestCount,
            excursionRoute:
              formData.charterDuration === "overnight"
                ? "Custom Overnight Itinerary"
                : DESTINATIONS.filter((d) =>
                    formData.destinations.includes(d.id),
                  )
                    .map((d) => d.name)
                    .join(" • "),
            totalPrice: priceCalculation.total,
            charterDuration: formData.charterDuration,
            amenities: allClientAmenities,
            optInReminder: formData.optInReminder,
            actionType: "wechat",
          });
        }
      });
    } else {
      alert("The broker has not provided a WeChat ID.");
    }
  };

  const imgToBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      if (url.startsWith("data:")) {
        resolve(url);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
            return;
          }
        } catch (e) {
          console.warn("Failed canvas toDataURL conversion for URL", url, e);
        }
        resolve(null);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url.includes("?")
        ? `${url}&cache_bypass=${Date.now()}`
        : `${url}?cache_bypass=${Date.now()}`;
    });
  };

  const generatePdfBrochure = async (
    shouldDownload = true,
  ): Promise<string | null> => {
    if (!selectedVesselObj || !selectedPierObj) return null;

    const isAgentMode = currentAgent && !isReferred;

    // Prefetch assets asynchronously
    const vesselImgBase64 = await imgToBase64(selectedVesselObj.image);

    let mapImgBase64: string | null = null;
    const mapElement = document.getElementById("booking-summary-route-map");
    if (mapElement) {
      try {
        const { toPng } = await import("html-to-image");
        mapImgBase64 = await toPng(mapElement, {
          cacheBust: true,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
          filter: (node: any) => {
            if (node && node.classList) {
              if (
                node.classList.contains("leaflet-control-container") ||
                node.classList.contains("pointer-events-auto") ||
                (typeof node.closest === "function" &&
                  node.closest(".pointer-events-auto"))
              ) {
                return false;
              }
            }
            return true;
          },
        });
      } catch (e) {
        console.warn("Failed rendering map screenshot for PDF", e);
      }
    }

    const doc = new jsPDF("p", "mm", "a4");

    // Clean emojis & non-ASCII characters that standard Courier/Helvetica standard PDF fonts do not support
    const clean = (str: string) => {
      if (!str) return "";
      return str
        .replace(/[\uD800-\uDFFF]./g, "")
        .replace(/[⛵✨🌴🐠🌊🔒✓🎣🍽🍹🎂👑🎁⭐•*]/g, "")
        .replace(/[~≈]/g, "")
        .replace(/[^\x00-\x7F]/g, " ")
        .trim();
    };

    // -------------------------------------------------------------
    // PAGE 1: Brand & Charter Specification Proposal
    // -------------------------------------------------------------

    // Calculate header height based on agent contacts
    let headerHeight = 36;
    let contactChannels: string[] = [];
    if (currentAgent) {
      if (currentAgent.whatsapp)
        contactChannels.push(`WhatsApp: ${currentAgent.whatsapp}`);
      if (currentAgent.lineId)
        contactChannels.push(`LINE: ${currentAgent.lineId}`);
      if (currentAgent.wechatId)
        contactChannels.push(`WeChat: ${currentAgent.wechatId}`);
      if (currentAgent.email)
        contactChannels.push(`Email: ${currentAgent.email}`);
      if (
        currentAgent.contactPhone &&
        currentAgent.contactPhone !== currentAgent.whatsapp
      )
        contactChannels.push(`Phone: ${currentAgent.contactPhone}`);

      if (contactChannels.length > 1) {
        headerHeight = 36 + (contactChannels.length - 1) * 5;
      }
    }

    // 1. Sleek Brand Banner
    doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
    doc.rect(0, 0, 210, headerHeight, "F");

    // Teal Divider Strip
    doc.setFillColor(5, 150, 105); // Rich Emerald (#059669)
    doc.rect(0, headerHeight, 210, 1.5, "F");

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const pdfBrandName = currentAgent?.companyName
      ? currentAgent.companyName.toUpperCase()
      : currentAgent?.name?.toUpperCase() || "PRIVATE YACHT CHARTER PROPOSAL";
    doc.text(pdfBrandName, 20, 17);

    // Sub-brand Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(190, 242, 219); // Muted Teal
    doc.text("BESPOKE PRIVATE CATAMARAN PROPOSAL & ITINERARY", 20, 25);

    // Representative Name (If applicable)
    if (currentAgent) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Prepared by: ${currentAgent.name}`, 20, 31);
    }

    // Generate Quotation Number
    const currentYear = new Date().getFullYear();
    const qStorageKey = "charter_quotation_sequence";
    let qSeq = 1;
    let storedQ = localStorage.getItem(qStorageKey);
    if (storedQ) {
      try {
        const parsed = JSON.parse(storedQ);
        if (parsed.year === currentYear) {
          qSeq = parsed.seq + 1;
        }
      } catch (e) {}
    }
    localStorage.setItem(
      qStorageKey,
      JSON.stringify({ year: currentYear, seq: qSeq }),
    );
    const quotationNumber = `QT-${currentYear}-${qSeq.toString().padStart(4, "0")}`;
    const generatedDateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Premium Stamp & Contact Channels
    doc.setTextColor(255, 255, 255);
    let headerRightY = 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Quotation: ${quotationNumber}`, 190, headerRightY, {
      align: "right",
    });
    headerRightY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Date: ${generatedDateStr}`, 190, headerRightY, {
      align: "right",
    });
    headerRightY += 6;

    if (contactChannels.length > 0) {
      doc.setTextColor(5, 150, 105); // Emerald 600
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("CONTACT & BOOKING", 190, headerRightY, { align: "right" });
      headerRightY += 4.5;

      doc.setTextColor(203, 213, 225); // Slate 300
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      contactChannels.forEach((channel) => {
        doc.text(channel, 190, headerRightY, { align: "right" });
        headerRightY += 4.5;
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("LUXURY CHARTER SERVICE", 190, headerRightY, { align: "right" });
    }

    // 2. Proposal Metadata section
    let currentY = headerHeight + 16;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("I. CHARTER PARTNERSHIP SUMMARY", 20, currentY);

    // Section divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 12;

    // Compact left column config
    const cols = {
      col1X: 20,
      labelSize: 7.5,
      valSize: 9,
    };

    const drawMetaLeft = (
      label: string,
      value: string,
      x: number,
      y: number,
    ) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(cols.labelSize);
      doc.setTextColor(100, 116, 139); // Gray 500
      doc.text(label, x, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(cols.valSize);
      doc.setTextColor(15, 23, 42); // Navy 900
      doc.text(clean(value), x, y + 4.2);
    };

    // Date Formatting
    const formattedDate = formData.charterDate
      ? new Date(formData.charterDate).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not Finalized (Pending Selection)";

    // Final Duration logic for PDF clarity
    const isFullDay =
      formData.charterDuration === "fullday" ||
      formData.charterDuration === "full-day";
    const finalDurationText =
      formData.charterDuration === "halfday"
        ? formData.halfDaySlot === "afternoon"
          ? "Half Day Afternoon (from 14:30)"
          : formData.halfDaySlot === "sunset"
            ? "Promthep Sunset (from 16:00)"
            : "Half Day Morning (from 08:30)"
        : isFullDay
          ? "Full Day Cruise (approx. 8 Hours)"
          : `Overnight Charter (${formData.overnightDays || 1} Nights / Full board)${formData.cabinCount > 0 ? ` • ${formData.cabinCount} Cabins` : ""}`;

    const guestDetails = `${formData.guestCount} guests total (${formData.guestsAdults} adults, ${formData.guestsKids} kids)`;
    const pierLabel = selectedPierObj.name;
    const destNames = DESTINATIONS.filter((d) =>
      formData.destinations.includes(d.id),
    )
      .map((d) => d.name)
      .join(" • ");

    let metaY = currentY;
    drawMetaLeft(
      "CLIENT GUEST NAME",
      formData.customerName || "Interested Guest",
      cols.col1X,
      metaY,
    );
    drawMetaLeft(
      "CLIENT PHONE",
      formData.customerPhone || "Not Provided",
      cols.col1X,
      metaY + 11,
    );
    drawMetaLeft("SCHEDULED DATE", formattedDate, 110, metaY + 11); // Add Date here
    drawMetaLeft(
      "CRUISE TYPE & DURATION",
      finalDurationText,
      cols.col1X,
      metaY + 22,
    );
    drawMetaLeft(
      "PASSENGERS COMPOSITION",
      guestDetails,
      cols.col1X,
      metaY + 33,
    );
    drawMetaLeft("DEPARTURE PORT / PIER", pierLabel, cols.col1X, metaY + 44);
    if (formData.endPierId && formData.endPierId !== formData.startPierId) {
      const endPierObj = PIERS.find((p) => p.id === formData.endPierId);
      drawMetaLeft(
        "ARRIVAL PORT / PIER",
        endPierObj?.name || formData.endPierId,
        110,
        metaY + 44,
      );
    }

    drawMetaLeft(
      "ALL DESTINATIONS",
      destNames || "None Selected",
      cols.col1X,
      metaY + 55,
    );
    drawMetaLeft(
      "YACHT MODEL",
      selectedVesselObj.name + " (" + selectedVesselObj.model + ")",
      cols.col1X,
      metaY + 66,
    );

    let nextY = metaY + 77;

    // Contact & Logistics elements added under the Yacht photo
    if (formData.customerPhone) {
      drawMetaLeft(
        "PHONE / WHATSAPP",
        formData.customerPhone,
        cols.col1X,
        nextY,
      );
    }
    drawMetaLeft(
      "EMBARK TIME",
      formData.departureTime || "09:00",
      formData.customerPhone ? 110 : cols.col1X,
      nextY,
    );

    nextY += 11;

    if (formData.hotelPickupLocation) {
      drawMetaLeft(
        "HOTEL PICK-UP",
        formData.hotelPickupLocation,
        cols.col1X,
        nextY,
      );
    }
    if (formData.specialRequests) {
      drawMetaLeft(
        "SPECIAL INQUIRIES",
        formData.specialRequests,
        formData.hotelPickupLocation ? 110 : cols.col1X,
        nextY,
      );
    }

    if (formData.hotelPickupLocation || formData.specialRequests) {
      nextY += 11;
    }

    // Yacht Photo rendering on the right hand side
    if (vesselImgBase64) {
      try {
        doc.setDrawColor(203, 213, 225); // Slate 300 frame
        doc.setLineWidth(0.4);
        doc.rect(114.8, metaY - 0.2, 75.4, 48.4);
        doc.addImage(vesselImgBase64, "JPEG", 115, metaY, 75, 48);
      } catch (e) {
        console.warn("Failed rendering yacht photo inside PDF", e);
      }
    } else {
      doc.setFillColor(248, 250, 252); // Soft light background
      doc.rect(115, metaY, 75, 48, "F");
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(115, metaY, 75, 48);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(clean(selectedVesselObj.name).toUpperCase(), 152.5, metaY + 21, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("YACHT PROFILE CATALOG PHOTO", 152.5, metaY + 27, {
        align: "center",
      });
    }

    currentY = nextY;

    if (currentAgent) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const brokerDetails = `Representative Broker: ${currentAgent.name} ${currentAgent.companyName ? `(${currentAgent.companyName})` : ""} | Contact: ${getContactPhone()}`;
      doc.text(clean(brokerDetails), 20, currentY);
      currentY += 6;
    }

    // 3. Trip Itinerary Timeline Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("II. PERSONALIZED VOYAGE ITINERARY & WAYPOINTS", 20, currentY + 4);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 7, 190, currentY + 7);

    currentY += 15;

    // Draw timeline map dots & texts
    const selectedDests = getOrderedDestinations(formData.destinations);
    if (selectedDests.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "No specific destinations selected. Custom route arranged by choice or charter captain.",
        24,
        currentY + 5,
      );
      currentY += 15;
    } else {
      // Draw connecting vertical sequence line
      const timelineStartX = 26;
      const timelineStartY = currentY + 4;
      const timelineEndY = timelineStartY + (selectedDests.length - 1) * 16;

      if (selectedDests.length > 1) {
        doc.setDrawColor(5, 150, 105); // Emerald Green line
        doc.setLineWidth(0.65);
        doc.line(timelineStartX, timelineStartY, timelineStartX, timelineEndY);
      }

      selectedDests.forEach((dest, idx) => {
        const itemY = currentY + 4 + idx * 16;
        // Circle Dot
        doc.setFillColor(5, 150, 105);
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.circle(timelineStartX, itemY, 2.2, "FD");

        // Destination title next to circle, slightly above center line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Stop #${idx + 1}: ${clean(dest.name)}`,
          timelineStartX + 8,
          itemY - 0.5,
        );

        // Subtext for stats below the title, to completely prevent horizontal overlap
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        const estDuration = Math.round((dest.distanceNM / 7) * 60);
        doc.text(
          `Distance: ${dest.distanceNM} NM  |  Estimated Transit: ~${estDuration} mins`,
          timelineStartX + 8,
          itemY + 3.8,
        );
      });

      currentY += selectedDests.length * 16 + 5;
    }

    // 4. Draw Route Map Trajectory
    if (mapImgBase64) {
      if (currentY + 68 > 280) {
        doc.addPage();

        doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
        doc.rect(0, 0, 210, 18, "F");

        doc.setFillColor(5, 150, 105); // Rich Emerald
        doc.rect(0, 18, 210, 1, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(pdfBrandName, 20, 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("PERSONALIZED CRUISE TRAJECTORY MAP", 190, 12, {
          align: "right",
        });

        currentY = 28;
      }

      // Draw Selected Route Map (Plotted visual)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("III. CRUISE TRAJECTORY ROUTE MAP", 20, currentY);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, currentY + 3, 190, currentY + 3);

      currentY += 8;

      try {
        doc.setDrawColor(203, 213, 225); // Slate 300 frame
        doc.setLineWidth(0.4);
        doc.rect(19.8, currentY - 0.2, 170.4, 55.4); // Outer frame border
        doc.addImage(mapImgBase64, "PNG", 20, currentY, 170, 55);
      } catch (mapErr) {
        console.warn("Failed printing map image inside PDF", mapErr);
      }

      currentY += 62;
    }

    // -------------------------------------------------------------
    // PAGE 2: Financial Proposal & Broker Synchronization
    // -------------------------------------------------------------
    doc.addPage();

    // Top Slim Banner
    doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
    doc.rect(0, 0, 210, 20, "F");

    // Teal Divider Strip
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 20, 210, 1, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(pdfBrandName, 20, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(190, 242, 219);
    doc.text("PROPOSAL COST ESTIMATION & TERMS", 190, 13, { align: "right" });

    currentY = 32;

    // Section 1: Culinary Services
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("III. CATERING & GASTRONOMY", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 12;

    let selectedFoodLabel =
      selectedVesselObj.id === "the-best"
        ? "Standard Cool Soft Drinks, Snacking, Fruit Platters & Cafe Espresso Included"
        : "Standard Cool Soft Drinks, Snacking & Fruit Platters Included";
    if (formData.foodOption === "seafood-bbq") {
      selectedFoodLabel =
        "Deluxe Andaman Grilled Seafood BBQ (Tiger prawns, local squid & seabass)";
    } else if (formData.foodOption === "royal-thai") {
      selectedFoodLabel =
        "Royal Thai Buffet Feast (Classic local Phuket crab curries, tom yum & pad-thai)";
    } else if (formData.foodOption === "premium-western") {
      selectedFoodLabel =
        "Luxury Multi-Course Western Dining (Seated scallops & prime medallions)";
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const foodTitle =
      formData.foodOption === "seafood-bbq"
        ? "DELUXE SEAFOOD BBQ CATERING"
        : formData.foodOption === "royal-thai"
          ? "ROYAL THAI BUFFET FEAST"
          : formData.foodOption === "premium-western"
            ? "LUXURY WESTERN DINING"
            : "FLEET STANDARD COMPLIMENTARY CATERING";
    doc.text(foodTitle, 20, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const foodDescSplit = doc.splitTextToSize(clean(selectedFoodLabel), 170);
    doc.text(foodDescSplit, 20, currentY + 4.5);

    currentY += foodDescSplit.length * 4 + 12;

    // Section 2: Custom Upgrades List
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("IV. BESPOKE SERVICE UPGRADES SELECTION", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 11;

    if (allClientAmenities.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Standard fleet inclusion package. No additional custom upgrade options chosen.",
        20,
        currentY,
      );
      currentY += 14;
    } else {
      // Draw a neat tabular format of select items
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CUSTOM UPGRADE OPTION", 22, currentY);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(20, currentY + 2, 190, currentY + 2);

      currentY += 6.5;

      allClientAmenities.forEach((upgrade, index) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        if (allClientAmenities.length > 5) {
          const isEven = index % 2 === 0;
          doc.text(`• ${clean(upgrade)}`, isEven ? 22 : 110, currentY);
          if (!isEven || index === allClientAmenities.length - 1) {
            currentY += 5.5;
          }
        } else {
          doc.text(`• ${clean(upgrade)}`, 22, currentY);
          currentY += 6.5;
        }
      });

      currentY += 4;
    }

    currentY += 4;

    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    // Section 3: Dynamic Inclusions & Exclusions Config
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("V. ACCREDITED CHARTER INCLUSIONS & EXCLUSIONS", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 9;

    // Split into two columns: Left = Inclusions, Right = Exclusions
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text("ACCEDTED INCLUSIONS ON BOARD (CONFIGURED):", 20, currentY);
    doc.text("EXCLUSIONS & SPECIAL NOTATIONS:", 110, currentY);

    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const inclusionsToPrint =
      formData.customInclusions && formData.customInclusions.length > 0
        ? formData.customInclusions.map((i) => `• ${i}`)
        : getPackageDefaults(
            (formData.charterDuration as any) || "halfday",
            formData.celebrationPackage || "none",
          ).inclusions.map((i) => `• ${i}`);

    const exclusionsToPrint =
      formData.customExclusions && formData.customExclusions.length > 0
        ? formData.customExclusions.map((e) => `• ${e}`)
        : getPackageDefaults(
            (formData.charterDuration as any) || "halfday",
            formData.celebrationPackage || "none",
          ).exclusions.map((e) => `• ${e}`);

    let leftY = currentY;
    inclusionsToPrint.forEach((benefit) => {
      const splitBenefit = doc.splitTextToSize(clean(benefit), 85);
      doc.text(splitBenefit, 20, leftY);
      leftY += splitBenefit.length * 4;
    });

    let rightY = currentY;
    exclusionsToPrint.forEach((rule) => {
      const splitRule = doc.splitTextToSize(clean(rule), 80);
      doc.text(splitRule, 110, rightY);
      rightY += splitRule.length * 4;
    });

    currentY = Math.max(leftY, rightY) + 6;

    let invoiceLinesCount = 0;

    const durationLabel =
      formData.charterDuration === "halfday"
        ? formData.halfDaySlot === "afternoon"
          ? "Base Catamaran Charter (Half Day Afternoon)"
          : formData.halfDaySlot === "sunset"
            ? "Base Catamaran Charter (Promthep Sunset)"
            : "Base Catamaran Charter (Half Day Morning)"
        : formData.charterDuration === "fullday"
          ? "Base Catamaran Charter (Full Day)"
          : `Base Catamaran Charter (Overnight Suite x${formData.overnightDays || 1} nights)`;

    invoiceLinesCount++; // duration
    invoiceLinesCount++; // food

    invoiceLinesCount += priceCalculation.upgradesList.length;

    if (isAgentMode) {
      invoiceLinesCount += 4; // space, subtotal, vat, total space, grand total
    } else {
      invoiceLinesCount += 2; // space, grand total
    }

    let boxHeight = 28 + invoiceLinesCount * 7.5;

    if (currentY + boxHeight > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Section 4: Professional Quotation Invoice Box
    doc.setFillColor(252, 253, 253); // Luxury crisp white-slate
    doc.rect(20, currentY, 170, boxHeight, "F");

    doc.setDrawColor(226, 232, 240); // Soft border
    doc.setLineWidth(0.5);
    doc.rect(20, currentY, 170, boxHeight, "S");

    // Left Elegant Accent Ribbon (Deep Navy)
    doc.setFillColor(15, 23, 42);
    doc.rect(20.25, currentY + 0.25, 2.5, boxHeight - 0.5, "F");

    let invoiceY = currentY + 11;
    // Heading Inside
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ESTIMATED CHARTER INVESTMENT", 32, invoiceY);

    // Subtitle inside
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Base rates derived from official vessel seasonal charter manifests and supply lists.",
      32,
      invoiceY + 4,
    );

    invoiceY += 15;

    const drawInvoiceLine = (
      label: string,
      isTotal: boolean = false,
      amount: string = "",
      isSubTotal: boolean = false,
    ) => {
      doc.setFont("helvetica", isTotal || isSubTotal ? "bold" : "normal");
      doc.setFontSize(isTotal ? 11 : isSubTotal ? 9 : 8.5);

      if (isTotal) {
        doc.setTextColor(15, 23, 42);
      } else if (isSubTotal) {
        doc.setTextColor(51, 65, 85);
      } else {
        doc.setTextColor(100, 116, 139);
      }

      let finalY = invoiceY;

      if (isTotal) {
        finalY = invoiceY + 2;
        // Subtle background for the total line
        doc.setFillColor(241, 245, 249);
        doc.rect(25, invoiceY - 5, 160, 11, "F");

        // Inner left tiny accent for the total (Emerald)
        doc.setFillColor(5, 150, 105);
        doc.rect(25, invoiceY - 5, 1.5, 11, "F");
      }

      doc.text(label, 32, finalY);

      if (amount) {
        doc.setFont("helvetica", "bold");
        if (isTotal) {
          doc.setTextColor(5, 150, 105); // Emerald Green for final amount
        } else {
          doc.setTextColor(15, 23, 42);
        }

        const cleanAmount = amount.replace(/[฿₽€$£]/g, function (match) {
          if (match === "฿") return "THB ";
          if (match === "₽") return "RUB ";
          if (match === "€") return "EUR ";
          if (match === "$") return "USD ";
          if (match === "£") return "GBP ";
          return match;
        });

        doc.text(cleanAmount, 182, finalY, { align: "right" });
      }

      invoiceY += isTotal ? 11 : 7.5;
    };

    // Only show prices in the PDF if the agent is generating a quotation, and it's not an overnight charter.
    if (isAgentMode && formData.charterDuration !== "overnight") {
      drawInvoiceLine(
        durationLabel,
        false,
        formatPrice(priceCalculation.basePrice),
      );

      // Food & Catering
      if (priceCalculation.foodPrice > 0) {
        drawInvoiceLine(
          `Dynamic Dining Catering Service (x${formData.guestCount} guests)`,
          false,
          formatPrice(priceCalculation.foodPrice),
        );
      } else {
        drawInvoiceLine(
          "Standard Compliments Inclusions Service",
          false,
          "Included",
        );
      }

      // Add upgrades list
      priceCalculation.upgradesList.forEach((upgrade) => {
        drawInvoiceLine(
          upgrade.name,
          false,
          upgrade.price > 0 ? formatPrice(upgrade.price) : "Included",
        );
      });

      // Border above final total
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      invoiceY += 1;
      doc.line(32, invoiceY - 3.5, 182, invoiceY - 3.5);
      invoiceY += 2.5;

      // GST Calculation (7%)
      const subtotal = priceCalculation.total;
      const gstAmount = subtotal * 0.07;
      const grandTotal = subtotal + gstAmount;

      drawInvoiceLine("Subtotal", false, formatPrice(subtotal), true);
      drawInvoiceLine("Thailand VAT/GST (7%)", false, formatPrice(gstAmount));

      invoiceY += 1.5;

      // Estimated Grand Total
      drawInvoiceLine(
        "GRAND TOTAL CHARTER BUDGET",
        true,
        formatPrice(grandTotal),
      );
    } else {
      // Customer request mode or overnight mode (No pricing data)
      drawInvoiceLine(durationLabel, false, "To be quoted");
      if (formData.charterDuration !== "overnight") {
        drawInvoiceLine(
          `Dining Catering Service (x${formData.guestCount} guests)`,
          false,
          "To be quoted",
        );
      } else {
        drawInvoiceLine(
          `Dining Catering Service (x${formData.guestCount} guests)`,
          false,
          "Tailored Menu",
        );
      }
      priceCalculation.upgradesList.forEach((upgrade) => {
        drawInvoiceLine(upgrade.name, false, "To be quoted");
      });

      invoiceY += 3;

      drawInvoiceLine(
        "GRAND TOTAL CHARTER BUDGET",
        true,
        "PENDING BROKER QUOTE",
      );
    }

    currentY = currentY + boxHeight + 12;

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // Section 5: Legal & Conduct Policy
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      "HARBOUR DIRECTIVES & SEAWORTHINESS LEGAL DISCLAIMERS:",
      20,
      currentY,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);

    let policyY = currentY + 3.5;
    const policies = [
      "Estimates are based on standard seasonal charter rates, catering ingredients, and official partner services. Final binding invoices are offered dynamically by authorized Brokers depending on tidal height variances, exact state national park fees, and specific holiday surcharges.",
      "Under the regulations set by the Harbor Master Department of the Kingdom of Thailand, all charter passengers must wear approved marine safety life vests at all times during yacht transit. The onboard skipper and captain command the absolute authority to adjust or change scheduled destinations depending on safe wind conditions and maritime weather safety bulletins.",
      "Proper identification documents, such as a valid passport scan or Thai National ID copy, must be furnished via WhatsApp or Email direct synchronization at least 72 hours down to departure for official marine insurance registration and manifest approvals.",
    ];

    policies.forEach((policy) => {
      policyY += 4.5;
      const splitPolicy = doc.splitTextToSize(policy, 166);
      doc.text(splitPolicy, 20, policyY);
      policyY += (splitPolicy.length - 1) * 3;
    });

    // Page End Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const pdfFooterText2 =
      currentAgent && currentAgent.companyName
        ? `${currentAgent.companyName} | Ph: ${getContactPhone()}`
        : "Agent Company - Bespoke Interactive Customized Brochure";
    doc.text(pdfFooterText2, 20, 285);
    doc.text("Page 2 of 3", 190, 285, { align: "right" });

    // -------------------------------------------------------------
    // PAGE 3: Terms and Onboard Safety Rules
    // -------------------------------------------------------------
    doc.addPage();
    doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
    doc.rect(0, 0, 210, 20, "F");

    let p3Y = 32;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("ONBOARD RULES & SAFETY REGULATIONS", 20, p3Y);
    p3Y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const rulesIntro =
      "Your compliance with yacht safety rules is fully mandatory to ensure a premium maritime voyage. The Captain and crew are the ultimate authority on board. Ensure you adhere to all policies.";
    const splitIntro = doc.splitTextToSize(rulesIntro, 170);
    doc.text(splitIntro, 20, p3Y);
    p3Y += splitIntro.length * 4 + 4;

    ONBOARD_CATEGORIES.forEach((cat) => {
      if (p3Y > 260) {
        doc.addPage();
        p3Y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(clean(cat.titleEn).toUpperCase(), 20, p3Y);
      p3Y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      cat.rules.forEach((rule) => {
        if (p3Y > 270) {
          doc.addPage();
          p3Y = 20;
        }
        const bulletText = doc.splitTextToSize(`• ${clean(rule.en)}`, 165);
        doc.text(bulletText, 25, p3Y);
        p3Y += bulletText.length * 3.5;
      });
      p3Y += 3; // Space between categories
    });

    // Page 3 End Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(pdfFooterText2, 20, 285);
    doc.text("Page 3 of 3", 190, 285, { align: "right" });

    // Save the generated document
    const pdfBrandFileName = currentAgent?.companyName
      ? currentAgent.companyName.toLowerCase().replace(/\s+/g, "_")
      : "broker_agency";
    const yachtNameClean = selectedVesselObj.name
      .toLowerCase()
      .replace(/\s+/g, "_");
    const clientNameClean = (formData.customerName || "guest")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const generatedDateStrNoSlash = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    if (shouldDownload) {
      doc.save(
        `${pdfBrandFileName}_quote_${generatedDateStrNoSlash}_${clientNameClean}_${yachtNameClean}.pdf`,
      );
    }
    return doc.output("datauristring").split(",")[1];
  };

  const copyToClipboard = () => {
    const handleCopiedActions = () => {
      setIsCopied(true);
      localStorage.setItem(
        "phuket_copied_inquiry_draft",
        generatedWhatsAppText,
      );
      if (formData.customerName) {
        localStorage.setItem(
          "phuket_copied_customer_name",
          formData.customerName,
        );
      }
      const contactInfo =
        formData.customerPhone || formData.customerEmail || "";
      if (contactInfo) {
        localStorage.setItem("phuket_copied_customer_contact", contactInfo);
      }
      window.dispatchEvent(
        new CustomEvent("phuket_inquiry_copied", {
          detail: {
            text: generatedWhatsAppText,
            customerName: formData.customerName || "",
            customerContact: contactInfo,
          },
        }),
      );
      setTimeout(() => setIsCopied(false), 2500);
    };

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(generatedWhatsAppText)
        .then(handleCopiedActions)
        .catch((err) => {
          console.warn(
            "Clipboard write failed, launching chat event anyway:",
            err,
          );
          handleCopiedActions();
        });
    } else {
      handleCopiedActions();
    }
  };

  const handleSummaryWidgetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent opening chat if clicking interactive elements inside the summary
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea")
    ) {
      return;
    }

    // Auto-save and trigger live inquiry chat!
    localStorage.setItem("phuket_copied_inquiry_draft", generatedWhatsAppText);
    if (formData.customerName) {
      localStorage.setItem(
        "phuket_copied_customer_name",
        formData.customerName,
      );
    }
    const contactInfo = formData.customerPhone || formData.customerEmail || "";
    if (contactInfo) {
      localStorage.setItem("phuket_copied_customer_contact", contactInfo);
    }

    window.dispatchEvent(
      new CustomEvent("phuket_inquiry_copied", {
        detail: {
          text: generatedWhatsAppText,
          customerName: formData.customerName || "",
          customerContact: contactInfo,
        },
      }),
    );
  };

  const isPhiPhi = formData.destinations.some((d) => d.includes("phi-phi"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
      <div className="md:col-span-7 lg:col-span-8 space-y-6">
        <div
          id="booking-section"
          className="rounded-xs border border-[#0F172A]/15 bg-white shadow-md p-6 lg:p-10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#0F172A]/10">
            <div className="flex items-baseline gap-3">
              <Anchor className="h-4.5 w-4.5 text-[#0F172A]/70 shrink-0 self-center" />
              <div>
                <h3 className="text-2xl font-serif italic font-normal text-[#0F172A] tracking-wide">
                  {ctx("header.title", "Configure Your Charter")}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#0F172A]/50 font-sans font-semibold mt-1">
                  {ctx("header.subtitle", "Private Bespoke Yacht Customizer")}
                </p>
              </div>
            </div>

            {/* Configure Charter Language Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xs self-start md:self-auto">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1 font-sans">
                <Languages className="h-3 w-3 text-slate-400" />
                LANG:
              </span>
              {[
                { code: "en", label: "EN", title: "English" },
                { code: "ru", label: "РУ", title: "Русский" },
                { code: "hi", label: "हि", title: "हिन्दी" },
                { code: "zh", label: "中", title: "中文" },
                { code: "th", label: "ไทย", title: "ภาษาไทย" },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  id={`charter-lang-${l.code}`}
                  title={l.title}
                  onClick={() => {
                    setGlobalLang(l.code as any);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold font-sans rounded-xs transition-all cursor-pointer ${
                    charterLang === l.code
                      ? "bg-[#0F172A] text-white"
                      : "text-slate-600 hover:text-[#0F172A]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Stepper for the Booking Customizer */}
          <div className="mb-6 bg-slate-50 border border-[#0F172A]/10 p-4 rounded-xs shadow-3xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-[#0F172A]/50">
                Private Charter Customizer Progression
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded-xs">
                Step {formStep - 1} of 7
              </span>
            </div>
            {/* Dynamic Progress Line */}
            <div className="w-full bg-[#0F172A]/10 h-1 rounded-full overflow-hidden mb-3">
              <div
                className="bg-[#00a2b8] h-full transition-all duration-300"
                style={{ width: `${((formStep - 1) / 7) * 100}%` }}
              />
            </div>
            {/* Step Badge Buttons */}
            <div className="flex flex-wrap text-left items-center gap-1.5 pt-1.5">
              {[
                { label: "1. Route", index: 2 },
                { label: "2. Duration", index: 3 },
                { label: "3. Party Theme", index: 4 },
                { label: "4. Catering", index: 5 },
                { label: "5. Upgrades", index: 6 },
                { label: "6. Date & Guests", index: 7 },
                { label: "7. Confirmation", index: 8 },
              ].map((stepObj) => {
                const currentIdx = stepObj.index;
                const isSelected = formStep === currentIdx;
                const isDone = formStep > currentIdx;
                return (
                  <button
                    key={currentIdx}
                    type="button"
                    onClick={() => setFormStep(currentIdx)}
                    className={`text-[9.5px] font-sans font-bold uppercase tracking-wider py-1 px-2 border transition-all cursor-pointer rounded-xs ${
                      isSelected
                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-3xs"
                        : isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isDone
                      ? `${stepObj.label.split(".")[0]} ✓`
                      : stepObj.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={formStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {formStep === 3 && (
                  <div className="space-y-6">
                    {/* Warning if route requires longer duration than halfday */}
                    {formData.destinations.some(
                      (d) => !isDestinationEligibleForHalfDay(d),
                    ) &&
                      formData.charterDuration !== "overnight" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xs border border-amber-300 bg-amber-50/60 shadow-2xs text-left relative overflow-hidden"
                        >
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-widest block font-sans mb-1">
                            ⚠️ Notice: Route Distance Warning
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            Your selected itinerary route contains islands (such
                            as Phi Phi, Racha, Phang Nga etc.) that require a{" "}
                            <strong>Full Day or Overnight</strong> charter due
                            to cruising range. If you select{" "}
                            <strong>Half Day</strong>, your cruising will be
                            limited strictly to Coral Island (Ko He) or nearby
                            Phromthep Cape range.
                          </p>
                        </motion.div>
                      )}

                    {formData.charterDuration === "overnight" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xs border border-emerald-300 bg-emerald-50/60 shadow-2xs text-left relative overflow-hidden"
                      >
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-widest block font-sans mb-1">
                          Design Your Own Journey
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          For overnight trips, you have the flexibility to
                          design your own custom multi-day voyage. However, for
                          the best and most curated experience, we highly
                          recommend making your own choice and speaking directly
                          with our agents to finalize your bespoke itinerary.
                        </p>
                      </motion.div>
                    )}

                    {/* Step 1B: Choose Charter Duration */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-3">
                        {ctx("step1b.title", "02. Choose Charter Duration")}
                      </label>
                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 ${formData.vesselId === "the-best" ? "xl:grid-cols-5 lg:grid-cols-3" : "xl:grid-cols-4 lg:grid-cols-3"} gap-3`}
                      >
                        {/* Half Day Morning Option */}
                        <div
                          onClick={() => {
                            const isAoPo = formData.startPierId === "ao-po";
                            const hasIneligible = formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            );
                            if (isAoPo) {
                              alert(
                                "Half Day tours are only available when starting from Chalong Pier or Coco Pier. To change to Half Day, please select Chalong Pier or Coco Pier first.",
                              );
                              return;
                            }
                            if (hasIneligible) {
                              alert(
                                "Half Day options are restricted to Coral Island (Ko He) or Phromthep Cape connected from Chalong or Coco. Your selected itinerary contains destinations that require a Full Day charter. Please select Full Day or adjust your destinations.",
                              );
                              return;
                            }
                            if (isPhiPhi) {
                              alert(
                                "Half Day tours are not available for Phi Phi Island routes due to the 12-hour maritime distance. Please select Full Day or Overnight, or remove Phi Phi from your destinations.",
                              );
                              return;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              charterDuration: "halfday",
                              halfDaySlot: "morning",
                              departureTime: "08:30",
                              arrivalTime: "13:00",
                            }));
                          }}
                          id="opt-duration-halfday-morning"
                          className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
                            isPhiPhi ||
                            formData.startPierId === "ao-po" ||
                            formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            )
                              ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : "cursor-pointer " +
                                (formData.charterDuration === "halfday" &&
                                formData.halfDaySlot === "morning"
                                  ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                  : "border-slate-200 bg-white text-slate-705 hover:border-slate-400")
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold font-sans">
                                Half Day Morning (from 08:30)
                              </p>
                            </div>
                            {formData.charterDuration === "halfday" &&
                              formData.halfDaySlot === "morning" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                            {isPhiPhi
                              ? "Not available for Phi Phi routes (requires 12 hours)."
                              : formData.startPierId === "ao-po"
                                ? "Not available from Ao Po."
                                : formData.destinations.some(
                                      (d) =>
                                        !isDestinationEligibleForHalfDay(d),
                                    )
                                  ? "Not available based on destinations."
                                  : "Perfect for high-visibility morning snorkeling before the heat of the afternoon."}
                          </p>
                        </div>

                        {/* Half Day Afternoon Option */}
                        <div
                          onClick={() => {
                            const isAoPo = formData.startPierId === "ao-po";
                            const hasIneligible = formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            );
                            if (isAoPo) {
                              alert(
                                "Half Day tours are only available when starting from Chalong Pier or Coco Pier. To change to Half Day, please select Chalong Pier or Coco Pier first.",
                              );
                              return;
                            }
                            if (hasIneligible) {
                              alert(
                                "Half Day options are restricted to Coral Island (Ko He) or Phromthep Cape connected from Chalong or Coco. Your selected itinerary contains destinations that require a Full Day charter. Please select Full Day or adjust your destinations.",
                              );
                              return;
                            }
                            if (isPhiPhi) {
                              alert(
                                "Half Day tours are not available for Phi Phi Island routes due to the 12-hour maritime distance. Please select Full Day or Overnight, or remove Phi Phi from your destinations.",
                              );
                              return;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              charterDuration: "halfday",
                              halfDaySlot: "afternoon",
                              departureTime: "14:30",
                              arrivalTime: "19:00",
                            }));
                          }}
                          id="opt-duration-halfday-afternoon"
                          className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
                            isPhiPhi ||
                            formData.startPierId === "ao-po" ||
                            formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            )
                              ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : "cursor-pointer " +
                                (formData.charterDuration === "halfday" &&
                                formData.halfDaySlot === "afternoon"
                                  ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                  : "border-slate-200 bg-white text-slate-705 hover:border-slate-400")
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold font-sans">
                                Half Day Afternoon (from 14:30)
                              </p>
                            </div>
                            {formData.charterDuration === "halfday" &&
                              formData.halfDaySlot === "afternoon" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                            {isPhiPhi
                              ? "Not available for Phi Phi routes (requires 12 hours)."
                              : formData.startPierId === "ao-po"
                                ? "Not available from Ao Po."
                                : formData.destinations.some(
                                      (d) =>
                                        !isDestinationEligibleForHalfDay(d),
                                    )
                                  ? "Not available based on destinations."
                                  : "A relaxed afternoon sunset voyage. Highly popular for quick tropical getaways."}
                          </p>
                        </div>

                        {/* Promthep Sunset Option */}
                        <div
                          onClick={() => {
                            const isAoPo = formData.startPierId === "ao-po";
                            const hasIneligible = formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            );
                            if (isAoPo) {
                              alert(
                                "Sunset tours are only available when starting from Chalong Pier or Coco Pier. To change to Sunset, please select Chalong Pier or Coco Pier first.",
                              );
                              return;
                            }
                            if (hasIneligible) {
                              alert(
                                "Sunset options are restricted to Coral Island (Ko He) or Phromthep Cape connected from Chalong or Coco. Your selected itinerary contains destinations that require a Full Day charter.",
                              );
                              return;
                            }
                            if (isPhiPhi) {
                              alert(
                                "Sunset tours are not available for Phi Phi Island routes due to the maritime distance.",
                              );
                              return;
                            }
                            setFormData((prev) => ({
                              ...prev,
                              charterDuration: "halfday",
                              halfDaySlot: "sunset",
                              departureTime: "16:00",
                              arrivalTime: "19:00",
                              destinations: formData.destinations.includes(
                                "prompteph",
                              )
                                ? formData.destinations
                                : ["prompteph"],
                            }));
                          }}
                          id="opt-duration-halfday-sunset"
                          className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
                            isPhiPhi ||
                            formData.startPierId === "ao-po" ||
                            formData.destinations.some(
                              (d) => !isDestinationEligibleForHalfDay(d),
                            )
                              ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : "cursor-pointer " +
                                (formData.charterDuration === "halfday" &&
                                formData.halfDaySlot === "sunset"
                                  ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                  : "border-slate-200 bg-white text-slate-705 hover:border-slate-400")
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold font-sans">
                                Promthep Sunset (16:00 - 19:00)
                              </p>
                            </div>
                            {formData.charterDuration === "halfday" &&
                              formData.halfDaySlot === "sunset" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                            {isPhiPhi
                              ? "Not available for Phi Phi routes (requires 12 hours)."
                              : formData.startPierId === "ao-po"
                                ? "Not available from Ao Po."
                                : formData.destinations.some(
                                      (d) =>
                                        !isDestinationEligibleForHalfDay(d),
                                    )
                                  ? "Not available based on destinations."
                                  : "Experience a stunning sunset at Phromthep Cape, exclusive short 3-hour trip."}
                          </p>
                        </div>

                        {/* Full Day Option */}
                        <div
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              charterDuration: "fullday",
                              halfDaySlot: undefined,
                              departureTime: "09:30",
                              arrivalTime: "19:00",
                            }));
                          }}
                          id="opt-duration-fullday"
                          className={`p-4 rounded-xs border cursor-pointer transition-all flex flex-col justify-between ${
                            formData.charterDuration === "fullday"
                              ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                              : "border-slate-200 bg-white text-slate-707 hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold font-sans">
                                {ctx(
                                  "step1b.full",
                                  "Full Day Cruise (9.5 hours, 09:30 - 19:00)",
                                )}
                              </p>
                            </div>
                            {formData.charterDuration === "fullday" && (
                              <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                            {ctx(
                              "step1b.fullDesc",
                              "Experience the pure depths of the Andaman Sea. Offers complete timeline flexibility with ample snorkeling, beachcombing, and leisurely sunbathing along your package route.",
                            )}
                          </p>
                        </div>

                        {/* Overnight Option (The Best and Namaste support overnight) */}
                        {formData.vesselId !== "the-one" && (
                          <div
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                charterDuration: "overnight",
                              }));
                            }}
                            id="opt-duration-overnight"
                            className={`p-4 rounded-xs border cursor-pointer transition-all flex flex-col justify-between ${
                              formData.charterDuration === "overnight"
                                ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                : "border-slate-200 bg-white text-slate-707 hover:border-slate-400"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold font-sans">
                                  {ctx("step1b.overnight", "Overnight Charter")}
                                </p>
                              </div>
                              {formData.charterDuration === "overnight" && (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                              {formData.vesselId === "the-best"
                                ? ctx(
                                    "step1b.overnightDesc",
                                    "The ultimate private yachting luxury. Sleep secure in 6-cabin AC comfort, waking up to pristine bays, deserted islands, and custom multi-day voyages.",
                                  )
                                : ctx(
                                    "step1b.overnightDescNamaste",
                                    "The ultimate private yachting luxury. Sleep secure in 2-cabin AC comfort, waking up to pristine bays, deserted islands, and custom multi-day voyages.",
                                  )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Overnight Days Selector Sub-box */}
                      {formData.vesselId !== "the-one" &&
                        formData.charterDuration === "overnight" && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 rounded-xs bg-[#FAF9F6] border border-[#0F172A]/15 shadow-2xs space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-[#0F172A] font-sans flex items-center gap-1.5 uppercase tracking-wider">
                                  <Bed className="h-3.5 w-3.5 text-slate-900" />{" "}
                                  {ctx(
                                    "step1b.overnightDaysTitle",
                                    "Overnight Charter Duration",
                                  )}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                                  {ctx(
                                    "step1b.overnightDaysDesc",
                                    "Define multi-day cruise length (1 to 14 nights)",
                                  )}
                                </p>
                              </div>
                              <div
                                id="overnight-days-control"
                                className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-end"
                              >
                                <input
                                  id="booking-overnight-range"
                                  type="range"
                                  min="1"
                                  max="14"
                                  value={formData.overnightDays}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      overnightDays: Number(e.target.value),
                                    }))
                                  }
                                  className="w-full sm:w-36 h-1 bg-slate-200 rounded-lg accent-[#0F172A] cursor-pointer"
                                />
                                <span className="text-xs font-bold text-[#0F172A] bg-white border border-[#0F172A]/15 px-3.5 py-2 rounded-xs min-w-[70px] text-center font-mono">
                                  {formData.overnightDays}{" "}
                                  {formData.overnightDays === 1
                                    ? ctx("step1b.night", "Night")
                                    : ctx("step1b.nights", "Nights")}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {formData.vesselId !== "the-one" &&
                        formData.charterDuration === "overnight" && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 rounded-xs bg-[#FAF9F6] border border-[#0F172A]/15 shadow-2xs space-y-4"
                          >
                            {/* Overnight Sub-Grid for Dates, Passengers, and Cabins */}
                            <div className="pt-4 border-t border-[#0F172A]/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Dates choice */}
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-[#0F172A]/70 animate-pulse" />
                                  Departure & Return Dates
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="col-span-2 md:col-span-1">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                                      Charter Date
                                    </span>
                                    <input
                                      type="date"
                                      required
                                      min={
                                        new Date().toISOString().split("T")[0]
                                      }
                                      value={formData.charterDate}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          charterDate: e.target.value,
                                        }))
                                      }
                                      className="w-full px-4 py-3 rounded-xs border border-slate-300 text-slate-900 text-sm bg-white text-center font-mono focus:border-[#0F172A] focus:outline-hidden min-h-[44px] shadow-xs"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                                      Departure Time
                                    </span>
                                    <input
                                      type="time"
                                      required
                                      value={formData.departureTime}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          departureTime: e.target.value,
                                        }))
                                      }
                                      className="w-full px-4 py-3 rounded-xs border border-slate-300 text-slate-900 text-sm bg-white text-center font-mono focus:border-[#0F172A] focus:outline-hidden min-h-[44px] shadow-xs"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                                      Arrival Time
                                    </span>
                                    <input
                                      type="time"
                                      required
                                      value={formData.arrivalTime}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          arrivalTime: e.target.value,
                                        }))
                                      }
                                      className="w-full px-4 py-3 rounded-xs border border-slate-300 text-slate-900 text-sm bg-white text-center font-mono focus:border-[#0F172A] focus:outline-hidden min-h-[44px] shadow-xs"
                                    />
                                  </div>

                                  {formData.charterDuration === "overnight" && (
                                    <div>
                                      <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                                        Return Date
                                      </span>
                                      <input
                                        type="date"
                                        required
                                        min={
                                          formData.charterDate
                                            ? (() => {
                                                const d = new Date(
                                                  formData.charterDate,
                                                );
                                                d.setDate(d.getDate() + 1);
                                                return d
                                                  .toISOString()
                                                  .split("T")[0];
                                              })()
                                            : new Date(Date.now() + 86400000)
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        value={
                                          formData.charterDate
                                            ? (() => {
                                                const d = new Date(
                                                  formData.charterDate,
                                                );
                                                d.setDate(
                                                  d.getDate() +
                                                    formData.overnightDays,
                                                );
                                                return d
                                                  .toISOString()
                                                  .split("T")[0];
                                              })()
                                            : ""
                                        }
                                        onChange={(e) => {
                                          if (formData.charterDate) {
                                            const returnD = new Date(
                                              e.target.value,
                                            );
                                            const depD = new Date(
                                              formData.charterDate,
                                            );
                                            if (
                                              !isNaN(returnD.getTime()) &&
                                              !isNaN(depD.getTime())
                                            ) {
                                              const diffTime =
                                                returnD.getTime() -
                                                depD.getTime();
                                              let diffDays = Math.round(
                                                diffTime / 86400000,
                                              );
                                              if (diffDays < 1) diffDays = 1;
                                              if (diffDays > 14) diffDays = 14;
                                              setFormData((prev) => ({
                                                ...prev,
                                                overnightDays: diffDays,
                                              }));
                                            }
                                          }
                                        }}
                                        className="w-full px-4 py-3 rounded-xs border border-slate-300 text-slate-900 text-sm bg-white text-center font-mono focus:border-[#0F172A] focus:outline-hidden min-h-[44px] shadow-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Passengers Choice */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1">
                                    <Users className="h-4 w-4 text-[#0F172A]/70" />
                                    Guests on Board
                                  </label>
                                  <span className="text-xs font-bold uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm text-amber-800">
                                    Pax: {formData.guestCount} /{" "}
                                    {selectedVesselObj.capacity} Max
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Adults */}
                                  <div className="bg-white border border-slate-300 px-4 py-2 rounded-xs flex items-center justify-between min-h-[50px]">
                                    <div className="leading-none shrink-0">
                                      <span className="text-sm font-bold block text-slate-800">
                                        Adults
                                      </span>
                                      <span className="text-[10px] text-slate-450 text-slate-400 mt-0.5">
                                        18+ yr
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => adjustAdults(-1)}
                                        disabled={formData.guestsAdults <= 1}
                                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-bold font-mono w-6 text-center">
                                        {formData.guestsAdults}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => adjustAdults(1)}
                                        disabled={
                                          formData.guestCount >=
                                          selectedVesselObj.capacity
                                        }
                                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Kids */}
                                  <div className="bg-white border border-slate-300 px-4 py-2 rounded-xs flex items-center justify-between min-h-[50px]">
                                    <div className="leading-none shrink-0">
                                      <span className="text-sm font-bold block text-slate-800">
                                        Kids
                                      </span>
                                      <span className="text-[10px] text-slate-450 text-slate-400 mt-0.5">
                                        0-17 yr
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => adjustKids(-1)}
                                        disabled={formData.guestsKids <= 0}
                                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-bold font-mono w-6 text-center">
                                        {formData.guestsKids}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => adjustKids(1)}
                                        disabled={
                                          formData.guestCount >=
                                          selectedVesselObj.capacity
                                        }
                                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Cabins Select */}
                              <div className="space-y-3">
                                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1">
                                  <Bed className="h-4 w-4 text-[#0F172A]/70" />
                                  How Many Cabins Booked?
                                </label>
                                <div>
                                  <select
                                    id="sel-cabin-overnight-subbox"
                                    value={formData.cabinCount}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        cabinCount: parseInt(e.target.value),
                                      }))
                                    }
                                    className="w-full px-4 py-3 rounded-xs border border-slate-300 text-slate-900 text-sm font-sans font-semibold focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer min-h-[50px]"
                                  >
                                    <option value={0}>
                                      0 - No double cabins requested
                                    </option>
                                    {Array.from({ length: getVesselMaxCabins(formData.vesselId, formData.charterDuration) }).map((_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1} Double ensuite cabin
                                        {i > 0 ? "s" : ""} (Max {getVesselMaxCabins(formData.vesselId, formData.charterDuration)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div>
                    {/* Step 3: Celebration Packages & Party Options */}
                    <div className="bg-slate-50/50 rounded-xs p-5 mt-5 space-y-5 shadow-sm border border-slate-200">
                      <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        03.{" "}
                        {ctx(
                          "upgrade.partyTitle",
                          "Select Celebration Package & Party Upgrades",
                        )}
                      </label>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 mb-2">
                        {ctx(
                          "upgrade.partySub",
                          "Elevate your private catamaran charter. Select a preconfigured luxury celebration theme package or pick individual option enhancements below.",
                        )}
                      </p>

                      {/* Packages Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Casual Option */}
                        <div
                          onClick={() => handleSelectPackage("none")}
                          className={`p-4 rounded-xs border cursor-pointer select-none transition-all ${
                            formData.celebrationPackage === "none"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]/20"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-[#0F172A]/50"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <Anchor className="h-3.5 w-3.5 text-sky-500" />{" "}
                              Casual Cruise
                            </span>
                            <input
                              type="radio"
                              checked={formData.celebrationPackage === "none"}
                              onChange={() => {}}
                              className="rounded-full accent-emerald-500 h-3 w-3 cursor-pointer"
                            />
                          </div>
                          <p
                            className={`text-[11px] leading-relaxed ${formData.celebrationPackage === "none" ? "text-slate-200" : "text-slate-500"}`}
                          >
                            Relaxed private cruise with standard luxury
                            inclusions. Best for swimming and sightseeing.
                          </p>
                        </div>

                        {/* Birthday Option */}
                        <div
                          onClick={() => handleSelectPackage("birthday")}
                          className={`p-4 rounded-xs border cursor-pointer select-none transition-all ${
                            formData.celebrationPackage === "birthday"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]/20"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-[#0F172A]/50"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <Cake className="h-3.5 w-3.5 text-pink-500" />{" "}
                              Birthday Party
                            </span>
                            <input
                              type="radio"
                              checked={
                                formData.celebrationPackage === "birthday"
                              }
                              onChange={() => {}}
                              className="rounded-full accent-emerald-500 h-3 w-3 cursor-pointer"
                            />
                          </div>
                          <p
                            className={`text-[11px] leading-relaxed ${formData.celebrationPackage === "birthday" ? "text-slate-200" : "text-slate-500"}`}
                          >
                            Premium balloons & themed decor, banner,
                            professional birthday cake, and chilled premium
                            champagne.
                          </p>
                        </div>

                        {/* Anniversary Option */}
                        <div
                          onClick={() => handleSelectPackage("anniversary")}
                          className={`p-4 rounded-xs border cursor-pointer select-none transition-all ${
                            formData.celebrationPackage === "anniversary"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]/20"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-[#0F172A]/50"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5 text-red-500" />{" "}
                              Romantic Setup
                            </span>
                            <input
                              type="radio"
                              checked={
                                formData.celebrationPackage === "anniversary"
                              }
                              onChange={() => {}}
                              className="rounded-full accent-emerald-500 h-3 w-3 cursor-pointer"
                            />
                          </div>
                          <p
                            className={`text-[11px] leading-relaxed ${formData.celebrationPackage === "anniversary" ? "text-slate-200" : "text-slate-500"}`}
                          >
                            Intimate premium flower bouquet, fresh rose petals
                            layout, elegant candles, and custom champagne.
                          </p>
                        </div>

                        {/* Corporate Option */}
                        <div
                          onClick={() => handleSelectPackage("corporate")}
                          className={`p-4 rounded-xs border cursor-pointer select-none transition-all ${
                            formData.celebrationPackage === "corporate"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]/20"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-[#0F172A]/50"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-amber-500" />{" "}
                              Corporate Event
                            </span>
                            <input
                              type="radio"
                              checked={
                                formData.celebrationPackage === "corporate"
                              }
                              onChange={() => {}}
                              className="rounded-full accent-emerald-500 h-3 w-3 cursor-pointer"
                            />
                          </div>
                          <p
                            className={`text-[11px] leading-relaxed ${formData.celebrationPackage === "corporate" ? "text-slate-200" : "text-slate-500"}`}
                          >
                            Onboard DJ, photographer, professional mixologist
                            bartender, and custom branding decorations.
                          </p>
                        </div>
                      </div>

                      {/* Header for Individual fine tuning */}
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-[#0F172A] font-sans flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />{" "}
                          Fine-tune Custom Party Add-ons
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Customize individual elements tailored to your precise
                          celebration schedule.
                        </p>
                      </div>

                      {/* Checks and inputs under selected package */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              addPartyDecorations: !prev.addPartyDecorations,
                            }))
                          }
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${formData.addPartyDecorations ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2" : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="h-32 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&w=600&q=80"
                              alt="Party Decor"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {formData.addPartyDecorations && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5 flex items-center justify-between">
                                Premium Party Theme & Decor
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.addPartyDecorations ? "text-slate-300" : "text-slate-500"}`}
                              >
                                Custom balloon garlands, LED lighting, party
                                props, customized banners, and glow sticks for
                                evening celebrations.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              addDJ: !prev.addDJ,
                            }))
                          }
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${formData.addDJ ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2" : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="h-32 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=600&q=80"
                              alt="Live DJ"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {formData.addDJ && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5 flex items-center justify-between">
                                Live DJ Onboard
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.addDJ ? "text-slate-300" : "text-slate-500"}`}
                              >
                                Set the perfect vibe with a professional DJ
                                mixing live music on deck for unforgettable
                                sunset parties.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              addPhotographer: !prev.addPhotographer,
                            }))
                          }
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${formData.addPhotographer ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2" : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="h-32 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"
                              alt="Photographer"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {formData.addPhotographer && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5 flex items-center justify-between">
                                Professional Photographer
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.addPhotographer ? "text-slate-300" : "text-slate-500"}`}
                              >
                                Capture your memories with an onboard
                                professional photographer, providing a fully
                                retouched album.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              addDroneVideography: !prev.addDroneVideography,
                            }))
                          }
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${formData.addDroneVideography ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2" : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"}`}
                        >
                          <div className="h-32 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&q=80"
                              alt="Drone Videography"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {formData.addDroneVideography && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5 flex items-center justify-between">
                                Drone Videography
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.addDroneVideography ? "text-slate-300" : "text-slate-500"}`}
                              >
                                Cinematic aerial footage of your luxury yacht
                                experience, edited professionally into a bespoke
                                highlight reel.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="p-4 rounded-xs border border-slate-200 bg-white space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              id="chk-add-bartender"
                              type="checkbox"
                              checked={formData.addBartender}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addBartender: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                {t("form.upgrade.bartenderBtn") ||
                                  "Hire Guest-Facing Mixologist & Bartender"}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {t("form.upgrade.bartenderDesc") ||
                                  "Treat your guests to elegant customized cocktail shaking, wine service, and custom-infused party mojitos from a professional mixologist on board."}
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {formData.addBartender && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                      {t("form.upgrade.bartenderSelect") ||
                                        "Select Number of Bartenders"}
                                    </label>
                                    <select
                                      id="sel-bartender-count"
                                      value={formData.bartenderCount}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          bartenderCount: parseInt(
                                            e.target.value,
                                          ),
                                        }))
                                      }
                                      className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                    >
                                      <option value={1}>
                                        {t("form.upgrade.bartenderOpt1") ||
                                          "1 Professional Bartender"}
                                      </option>
                                      <option value={2}>
                                        {t("form.upgrade.bartenderOpt2") ||
                                          "2 Professional Bartenders"}
                                      </option>
                                      <option value={3}>
                                        {t("form.upgrade.bartenderOpt3") ||
                                          "3 Professional Bartenders (Recommended for large groups)"}
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div className="p-4 rounded-xs border border-slate-200 bg-white flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={formData.addBirthdayCake}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addBirthdayCake: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                {t("form.upgrade.cakeBtn") ||
                                  "Celebration Birthday Cake"}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                {t("form.upgrade.cakeDesc") ||
                                  "Make your charter unforgettable with a premium, freshly baked customized celebration cake."}
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {formData.addBirthdayCake && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-slate-100 overflow-hidden"
                              >
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                  {t("form.upgrade.cakeSelect") || "Quantity"}
                                </label>
                                <select
                                  value={formData.birthdayCakeCount}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      birthdayCakeCount: parseInt(
                                        e.target.value,
                                      ),
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                >
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <option key={num} value={num}>
                                      {num} {num === 1 ? "Cake" : "Cakes"}
                                    </option>
                                  ))}
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="p-4 rounded-xs border border-slate-200 bg-white flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={formData.addChampagne}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addChampagne: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                Champagne Bottle
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                Chilled premium champagne served in flutes upon
                                arrival or at sunset.
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {formData.addChampagne && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-slate-100 overflow-hidden"
                              >
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                  Quantity (1-10)
                                </label>
                                <select
                                  value={formData.champagneCount}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      champagneCount: parseInt(e.target.value),
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                    (num) => (
                                      <option key={num} value={num}>
                                        {num} {num === 1 ? "Bottle" : "Bottles"}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="p-4 rounded-xs border border-slate-200 bg-white flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={formData.addFlowerBouquet}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addFlowerBouquet: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                Flower Bouquet
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                Beautiful fresh local flower bouquet, perfect
                                for anniversaries or proposals.
                              </p>
                            </div>
                          </div>
                          <AnimatePresence>
                            {formData.addFlowerBouquet && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-slate-100 overflow-hidden"
                              >
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                  Quantity
                                </label>
                                <select
                                  value={formData.flowerBouquetCount}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      flowerBouquetCount: parseInt(
                                        e.target.value,
                                      ),
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                >
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <option key={num} value={num}>
                                      {num} {num === 1 ? "Bouquet" : "Bouquets"}
                                    </option>
                                  ))}
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 7 && (
                  <div>
                    {/* Step 2: Charter Logistics */}
                    {formData.charterDuration !== "overnight" && (
                      <div className="bg-[#FAF9F6] border border-[#0F172A]/15 p-5 md:p-6 rounded-xs shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#0F172A]/10 pb-3">
                          <div>
                            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-[0.1em] flex items-center gap-2">
                              <span className="bg-[#0F172A] text-white w-5 h-5 rounded-sm flex items-center justify-center text-[10px]">
                                02
                              </span>
                              Charter Logistics
                            </h3>
                            <p className="text-[9.5px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-bold">
                              Required Charter Details
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-2 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-[#0F172A]/60" />
                                {ctx("step2.dateLabel", "Select Charter Date")}{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="booking-date-input"
                                type="date"
                                required
                                min={new Date().toISOString().split("T")[0]}
                                value={formData.charterDate}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    charterDate: e.target.value,
                                  }))
                                }
                                className="w-full px-5 py-3.5 rounded-xs border border-[#0F172A]/20 text-slate-900 text-sm tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs min-h-[48px]"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-2 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#0F172A]/60" />
                                {ctx("step2.timeLabel", "Embark Hour")}{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="booking-time-input"
                                type="time"
                                required
                                value={formData.departureTime || "09:00"}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    departureTime: e.target.value,
                                  }))
                                }
                                className="w-full px-5 py-3.5 rounded-xs border border-[#0F172A]/20 text-slate-900 text-sm tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs min-h-[48px]"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="pt-3">
                          <div className="flex items-center justify-between mb-3 border-b border-[#0F172A]/10 pb-2">
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-[#0F172A]/60" />
                              Guests On Board
                            </label>
                            <span className="text-[10.5px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-xs shadow-3xs uppercase tracking-wider">
                              {formData.guestCount} /{" "}
                              {selectedVesselObj?.capacity || 0} MAX
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Adults */}
                            <div className="bg-white border border-[#0F172A]/15 rounded-xs p-4 flex flex-col justify-center items-center shadow-2xs min-h-[70px]">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                Adults
                              </span>
                              <div className="flex items-center gap-3 mt-3">
                                <button
                                  type="button"
                                  onClick={() => adjustAdults(-1)}
                                  disabled={formData.guestsAdults <= 1}
                                  className="w-10 h-10 rounded border border-slate-300 flex items-center justify-center font-bold text-lg text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-base font-mono font-bold min-w-[24px] text-center">
                                  {formData.guestsAdults}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustAdults(1)}
                                  disabled={
                                    formData.guestCount >=
                                    (selectedVesselObj?.capacity || 0)
                                  }
                                  className="w-10 h-10 rounded border border-slate-300 flex items-center justify-center font-bold text-lg text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {/* Kids */}
                            <div className="bg-white border border-[#0F172A]/15 rounded-xs p-4 flex flex-col justify-center items-center shadow-2xs min-h-[70px]">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                Kids (<span className="font-mono">17</span> ↓)
                              </span>
                              <div className="flex items-center gap-3 mt-3">
                                <button
                                  type="button"
                                  onClick={() => adjustKids(-1)}
                                  disabled={formData.guestsKids <= 0}
                                  className="w-10 h-10 rounded border border-slate-300 flex items-center justify-center font-bold text-lg text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-base font-mono font-bold min-w-[24px] text-center">
                                  {formData.guestsKids}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustKids(1)}
                                  disabled={
                                    formData.guestCount >=
                                    (selectedVesselObj?.capacity || 0)
                                  }
                                  className="w-10 h-10 rounded border border-slate-300 flex items-center justify-center font-bold text-lg text-[#0F172A] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          {formData.guestCount >=
                            (selectedVesselObj?.capacity || 0) && (
                            <p className="text-[9.5px] text-amber-600 font-sans font-semibold italic flex items-center gap-1 mt-2 animate-pulse">
                              ⚠️{" "}
                              {ctx(
                                "step2.capacityReached",
                                "Maximum passenger capacity reached.",
                              ).replace(
                                "{capacity}",
                                String(selectedVesselObj?.capacity || 0),
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formStep === 2 && (
                  <div>
                    {/* Step 3: Pier Selection & Destinations */}
                    <div className="space-y-4 pt-4 pb-6 mt-2 mb-6 border-b border-[#0F172A]/10">
                      <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#0F172A]/60" />
                        {ctx("step4.title", "03. Selected Start Point Pier")}
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PIERS.map((pier) => {
                          const isSelected = formData.startPierId === pier.id;
                          // Dummy recommendation or existing reference (removed tip check here to keep it simple,
                          // but we can preserve the recommendationInfo mismatch alert)
                          const isBestMatch = pier.id === "chalong";
                          return (
                            <button
                              key={pier.id}
                              id={`form-pier-select-${pier.id}`}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  startPierId: pier.id,
                                  // If they haven't unlinked them, keep them synced
                                  endPierId:
                                    prev.startPierId === prev.endPierId
                                      ? pier.id
                                      : prev.endPierId,
                                }))
                              }
                              className={`p-4 rounded-xs border text-left transition-all relative cursor-pointer ${
                                isSelected
                                  ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold font-sans">
                                  {ctx(`piers.${pier.id}.name`, pier.name)}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                {ctx(
                                  `piers.${pier.id}.location`,
                                  pier.location,
                                )}{" "}
                                •{" "}
                                {ctx(
                                  `piers.${pier.id}.description`,
                                  pier.description,
                                ).slice(0, 60)}
                                ...
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-3 flex items-center gap-1.5">
                          <Anchor className="h-3.5 w-3.5 text-[#0F172A]/60" />
                          {ctx("step4.endPierTitle", "03B. End Pier")}
                        </label>
                        <p className="text-[11px] text-slate-500 font-sans mb-3 leading-relaxed">
                          If not selected, the end pier will default to the
                          embarkation port. Choose a different port if needed.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PIERS.map((pier) => {
                            const isSelected = formData.endPierId === pier.id;
                            return (
                              <button
                                key={`end-${pier.id}`}
                                id={`form-end-pier-select-${pier.id}`}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    endPierId: pier.id,
                                  }))
                                }
                                className={`px-4 py-3 rounded-xs border text-left transition-all relative cursor-pointer ${
                                  isSelected
                                    ? "border-[#0F172A] bg-[#FAF9F6] text-[#0F172A] ring-1 ring-[#0F172A]/10"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-bold font-sans">
                                    {ctx(`piers.${pier.id}.name`, pier.name)}
                                  </p>
                                  {isSelected && (
                                    <CheckCircle className="h-3 w-3 text-[#0F172A]" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Destinations Route Select */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-2 flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-[#0F172A]/60" />
                        {formData.charterDuration === "overnight"
                          ? "04. Pick Destinations for Overnight Multi-Day Cruise Route"
                          : ctx(
                              "step3.title",
                              "04. Choose Destination Route (Select any / Plan your own)",
                            )}
                      </label>

                      {loadedRouteFromMap ? (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 rounded-xs border border-emerald-300 bg-emerald-50/40 shadow-2xs space-y-2.5 text-left relative overflow-hidden"
                        >
                          {/* Luxury modern ambient highlight */}
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-600" />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-start gap-2.5">
                              <Sparkles className="h-4.5 w-4.5 text-emerald-800 shrink-0 mt-0.5 animate-pulse" />
                              <div>
                                <span className="text-[9px] uppercase font-bold text-emerald-850 tracking-widest block font-sans">
                                  Route Connection Live
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 font-sans mt-0.5">
                                  Itinerary Route & Launching Pier Preconfigured
                                  from Interactive Map / Guide
                                </h5>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLoadedRouteFromMap(false)}
                              className="text-[9.5px] uppercase font-bold text-slate-700 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-sm shadow-3xs cursor-pointer select-none transition-all active:scale-[0.96]"
                            >
                              ✎ Switch to Manual Mode
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            Your catamaran charter destinations are fully
                            synchronized with your choices on the Phuket maps.
                            The optimal launching hub (
                            <strong>
                              {PIERS.find((p) => p.id === formData.startPierId)
                                ?.name || "Phuket Pier"}
                            </strong>
                            ) has been set. You can review and track your
                            detailed waypoint cruising progression in the
                            timeline tracker below.
                          </p>
                        </motion.div>
                      ) : (
                        <>
                          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-sans italic">
                            {formData.charterDuration === "overnight"
                              ? "Overnight cruisers can build tailor-made inter-island voyages. Select the primary islands from the list below that you wish to add to your wishlist, and let our agents help you build the perfect itinerary."
                              : ctx(
                                  "step3.desc",
                                  "Pick your preferred catamaran cruising route. Our smart itinerary helper will optimize the ideal launching pier.",
                                )}
                          </p>

                          {/* Dynamic route agent assistance section for Overnight Cruises as requested */}
                          {formData.charterDuration === "overnight" && (
                            <div className="mb-5 p-4 rounded-xs border border-emerald-300/80 bg-emerald-50/50 shadow-2xs space-y-3">
                              <div className="flex items-start gap-2.5">
                                <Sparkles className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5 fill-emerald-300/40" />
                                <div>
                                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                    Custom Overnight Itinerary Assistant
                                  </h5>
                                  <p className="text-[11.5px] text-slate-600 leading-relaxed mt-1">
                                    Multi-day itineraries include overnight
                                    anchorage locations, catered meals, beach
                                    stops, and private national park speed boat
                                    transfers.
                                    <strong>
                                      {" "}
                                      Select multiple islands below on your
                                      wishlist
                                    </strong>
                                    , and instantly reach out to our active
                                    charter specialist below to draft the full
                                    details:
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <a
                                  href={`https://wa.me/${getNormalizedWhatsApp()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white font-sans font-bold text-[9.5px] uppercase tracking-wider px-3.5 py-2 rounded-xs shadow-2xs transition-colors"
                                >
                                  <MessageSquare className="h-3 w-3 shrink-0" />
                                  Chat on WhatsApp
                                </a>
                                {currentAgent?.lineId && (
                                  <button
                                    type="button"
                                    onClick={handleLineAction}
                                    className="inline-flex items-center gap-1.5 bg-[#00B900] hover:bg-[#009900] text-white font-sans font-bold text-[9.5px] uppercase tracking-wider px-3.5 py-2 rounded-xs shadow-2xs transition-all"
                                  >
                                    <MessageSquare className="h-3 w-3 shrink-0" />
                                    LINE Agency
                                  </button>
                                )}
                                {currentAgent?.wechatId && (
                                  <button
                                    type="button"
                                    onClick={handleWechatAction}
                                    className="inline-flex items-center gap-1.5 bg-[#07C160] hover:bg-[#06AD56] text-white font-sans font-bold text-[9.5px] uppercase tracking-wider px-3.5 py-2 rounded-xs shadow-2xs transition-all"
                                  >
                                    <MessageSquare className="h-3 w-3 shrink-0" />
                                    WeChat Agent
                                  </button>
                                )}
                                {currentAgent?.contactPhone && (
                                  <a
                                    href={`tel:${getContactPhone()}`}
                                    className="inline-flex items-center gap-1.5 border border-slate-700 bg-white text-slate-800 hover:bg-slate-50 font-sans font-bold text-[9.5px] uppercase tracking-wider px-3.5 py-2 rounded-xs shadow-2xs transition-all"
                                  >
                                    <PhoneCall className="h-3 w-3 shrink-0" />
                                    Direct Call
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {isPhiPhi &&
                            formData.charterDuration !== "overnight" && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 bg-amber-50 border border-amber-300 rounded-xs p-3 text-amber-900 text-xs font-sans shadow-sm flex items-start gap-2"
                              >
                                <div className="font-bold mt-0.5 shrink-0">
                                  ⚠️ Important Notice:
                                </div>
                                <div className="leading-relaxed">
                                  {ctx(
                                    "step3.phiphiNotice",
                                    "Any trip to the Phi Phi Islands has a total itinerary day time of 12 hours. It must start at 08:00 or 08:30 and ends at 20:00 or 20:30 respectively.",
                                  )}
                                </div>
                              </motion.div>
                            )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="col-span-1 sm:col-span-2 mt-1 mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setLoadedRouteFromMap(false);
                                  setFormData((prev) => ({
                                    ...prev,
                                    destinations: [],
                                  }));
                                }}
                                className={`w-full p-4 rounded-xs border text-left transition-all ${
                                  (() => {
                                    if (formData.destinations.length === 0)
                                      return true;
                                    // Check if any standard route EXACTLY matches
                                    const hasStandardMatch =
                                      DESTINATIONS.filter(
                                        (d) => d.id !== "custom-route",
                                      ).some((dest) => {
                                        const pts = COMPOSITE_ROUTES[dest.id];
                                        if (pts && pts.length > 0) {
                                          const constituents = pts.filter(
                                            (id) =>
                                              id !== "chalong" &&
                                              id !== "ao-po" &&
                                              id !== "coco",
                                          );
                                          return (
                                            constituents.length > 0 &&
                                            constituents.every((id) =>
                                              formData.destinations.includes(
                                                id,
                                              ),
                                            ) &&
                                            formData.destinations.every((id) =>
                                              constituents.includes(id),
                                            )
                                          );
                                        }
                                        return (
                                          formData.destinations.length === 1 &&
                                          formData.destinations.includes(
                                            dest.id,
                                          )
                                        );
                                      });
                                    return !hasStandardMatch;
                                  })()
                                    ? "bg-[#0F172A] border-[#0F172A] shadow-md ring-2 ring-[#0F172A]/20"
                                    : "bg-white border-slate-200 hover:border-[#0F172A] hover:shadow-xs"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      (() => {
                                        if (formData.destinations.length === 0)
                                          return true;
                                        const hasStandardMatch =
                                          DESTINATIONS.filter(
                                            (d) => d.id !== "custom-route",
                                          ).some((dest) => {
                                            const pts =
                                              COMPOSITE_ROUTES[dest.id];
                                            if (pts && pts.length > 0) {
                                              const constituents = pts.filter(
                                                (id) =>
                                                  id !== "chalong" &&
                                                  id !== "ao-po" &&
                                                  id !== "coco",
                                              );
                                              return (
                                                constituents.length > 0 &&
                                                constituents.every((id) =>
                                                  formData.destinations.includes(
                                                    id,
                                                  ),
                                                ) &&
                                                formData.destinations.every(
                                                  (id) =>
                                                    constituents.includes(id),
                                                )
                                              );
                                            }
                                            return (
                                              formData.destinations.length ===
                                                1 &&
                                              formData.destinations.includes(
                                                dest.id,
                                              )
                                            );
                                          });
                                        return !hasStandardMatch;
                                      })()
                                        ? "border-emerald-400 bg-emerald-400"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {(() => {
                                      if (formData.destinations.length === 0)
                                        return true;
                                      const hasStandardMatch =
                                        DESTINATIONS.filter(
                                          (d) => d.id !== "custom-route",
                                        ).some((dest) => {
                                          const pts = COMPOSITE_ROUTES[dest.id];
                                          if (pts && pts.length > 0) {
                                            const constituents = pts.filter(
                                              (id) =>
                                                id !== "chalong" &&
                                                id !== "ao-po" &&
                                                id !== "coco",
                                            );
                                            return (
                                              constituents.length > 0 &&
                                              constituents.every((id) =>
                                                formData.destinations.includes(
                                                  id,
                                                ),
                                              ) &&
                                              formData.destinations.every(
                                                (id) =>
                                                  constituents.includes(id),
                                              )
                                            );
                                          }
                                          return (
                                            formData.destinations.length ===
                                              1 &&
                                            formData.destinations.includes(
                                              dest.id,
                                            )
                                          );
                                        });
                                      return !hasStandardMatch;
                                    })() && (
                                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <span
                                      className={`text-[11px] font-bold uppercase tracking-wider block ${
                                        (() => {
                                          if (
                                            formData.destinations.length === 0
                                          )
                                            return true;
                                          const hasStandardMatch =
                                            DESTINATIONS.filter(
                                              (d) => d.id !== "custom-route",
                                            ).some((dest) => {
                                              const pts =
                                                COMPOSITE_ROUTES[dest.id];
                                              if (pts && pts.length > 0) {
                                                const constituents = pts.filter(
                                                  (id) =>
                                                    id !== "chalong" &&
                                                    id !== "ao-po" &&
                                                    id !== "coco",
                                                );
                                                return (
                                                  constituents.length > 0 &&
                                                  constituents.every((id) =>
                                                    formData.destinations.includes(
                                                      id,
                                                    ),
                                                  ) &&
                                                  formData.destinations.every(
                                                    (id) =>
                                                      constituents.includes(id),
                                                  )
                                                );
                                              }
                                              return (
                                                formData.destinations.length ===
                                                  1 &&
                                                formData.destinations.includes(
                                                  dest.id,
                                                )
                                              );
                                            });
                                          return !hasStandardMatch;
                                        })()
                                          ? "text-white"
                                          : "text-[#0F172A]"
                                      }`}
                                    >
                                      OR SELECT MANUALLY Your charter route
                                    </span>
                                    <span
                                      className={`text-[10px] mt-0.5 block ${
                                        (() => {
                                          if (
                                            formData.destinations.length === 0
                                          )
                                            return true;
                                          const hasStandardMatch =
                                            DESTINATIONS.filter(
                                              (d) => d.id !== "custom-route",
                                            ).some((dest) => {
                                              const pts =
                                                COMPOSITE_ROUTES[dest.id];
                                              if (pts && pts.length > 0) {
                                                const constituents = pts.filter(
                                                  (id) =>
                                                    id !== "chalong" &&
                                                    id !== "ao-po" &&
                                                    id !== "coco",
                                                );
                                                return (
                                                  constituents.length > 0 &&
                                                  constituents.every((id) =>
                                                    formData.destinations.includes(
                                                      id,
                                                    ),
                                                  ) &&
                                                  formData.destinations.every(
                                                    (id) =>
                                                      constituents.includes(id),
                                                  )
                                                );
                                              }
                                              return (
                                                formData.destinations.length ===
                                                  1 &&
                                                formData.destinations.includes(
                                                  dest.id,
                                                )
                                              );
                                            });
                                          return !hasStandardMatch;
                                        })()
                                          ? "text-slate-300"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      Plan your own custom itinerary or combined
                                      route
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </div>
                            {DESTINATIONS.filter(
                              (d) => d.id !== "custom-route",
                            ).map((dest) => {
                              const isSelected =
                                dest.id === "custom-route"
                                  ? formData.destinations.length === 0
                                  : (() => {
                                      const pts = COMPOSITE_ROUTES[dest.id];
                                      if (pts && pts.length > 0) {
                                        const constituents = pts.filter(
                                          (id) =>
                                            id !== "chalong" &&
                                            id !== "ao-po" &&
                                            id !== "coco",
                                        );
                                        return (
                                          constituents.length > 0 &&
                                          constituents.every((id) =>
                                            formData.destinations.includes(id),
                                          )
                                        );
                                      }
                                      return formData.destinations.includes(
                                        dest.id,
                                      );
                                    })();
                              return (
                                <div
                                  key={dest.id}
                                  id={`form-dest-select-${dest.id}`}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      toggleDestination(dest.id);
                                    }
                                  }}
                                  onClick={() => toggleDestination(dest.id)}
                                  className={`p-4 rounded-xs border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                                    isSelected
                                      ? "border-[#0F172A] bg-[#FAF9F6] text-slate-900 font-bold ring-1 ring-[#0F172A]/10"
                                      : "border-slate-200 bg-white text-slate-705 hover:border-slate-400"
                                  }`}
                                >
                                  {dest.imageUrls && dest.imageUrls.length > 0 ? (
                                    <div className={`w-full h-28 mb-3 gap-1 relative shrink-0 overflow-hidden rounded-sm grid ${
                                      dest.imageUrls.length === 1 ? "grid-cols-1" :
                                      dest.imageUrls.length === 2 ? "grid-cols-2" :
                                      dest.imageUrls.length === 3 ? "grid-cols-3" : "grid-cols-2 grid-rows-2"
                                    }`}>
                                      {dest.imageUrls.slice(0, 4).map((url, i) => (
                                        <div key={i} className="overflow-hidden relative h-full w-full border border-slate-100">
                                          <ImageWithFallback
                                            referrerPolicy="no-referrer"
                                            src={url}
                                            alt={`${dest.name} ${i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          />
                                        </div>
                                      ))}
                                      {isSelected && (
                                        <div className="absolute inset-0 ring-2 ring-emerald-600 rounded-sm pointer-events-none" />
                                      )}
                                    </div>
                                  ) : dest.imageUrl ? (
                                    <div className="w-full h-28 mb-3 overflow-hidden rounded-sm relative shrink-0 border border-slate-100">
                                      <ImageWithFallback
                                        referrerPolicy="no-referrer"
                                        src={dest.imageUrl}
                                        alt={dest.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 ring-2 ring-emerald-600 rounded-sm pointer-events-none" />
                                      )}
                                    </div>
                                  ) : null}
                                  <div className="flex justify-between items-start w-full gap-1">
                                    <span className="text-xs font-bold tracking-tight block max-w-[85%] font-sans">
                                      {ctx(
                                        `destinations.${dest.id}.name`,
                                        dest.name,
                                      )}
                                    </span>
                                    {isSelected && (
                                      <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                                    )}
                                  </div>
                                  <p
                                    className={`text-[10px] text-slate-500 mt-1.5 leading-relaxed font-sans ${isSelected ? "" : "line-clamp-3"}`}
                                  >
                                    {ctx(
                                      `destinations.${dest.id}.desc`,
                                      dest.description,
                                    )}
                                  </p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] uppercase tracking-widest text-[#0F172A]/40 font-mono">
                                        ~{dest.distanceNM} NM{" "}
                                        {ctx("map.total", "Total")}
                                      </span>
                                      {hasRouteMap(dest.id) && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRouteModalData({
                                              id: dest.id,
                                              name: dest.name,
                                            });
                                          }}
                                          className="inline-flex items-center gap-1 bg-[#0F172A]/5 hover:bg-[#0F172A]/10 text-[#0F172A] px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider font-sans transition-colors"
                                        >
                                          <MapPin className="h-2.5 w-2.5" />
                                          Map
                                        </button>
                                      )}
                                    </div>
                                    <span className="text-[9px] bg-slate-100/80 border border-slate-900/5 text-[#0F172A]/60 px-1.5 py-0.5 rounded-sm font-mono font-semibold">
                                      ⚓{" "}
                                      {dest.recommendedPierId === "chalong"
                                        ? `${ctx("piers.chalong.location", "South")} (${ctx("piers.chalong.name", "Chalong")})`
                                        : dest.recommendedPierId === "ao-po"
                                          ? `${ctx("piers.ao-po.location", "North")} (${ctx("piers.ao-po.name", "Ao Po")})`
                                          : `Phuket (Coco Pier)`}
                                    </span>
                                  </div>

                                  {isAgentOverride && isSelected && (
                                    <div
                                      className="w-full mt-3 pt-2 border-t border-emerald-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <label className="text-[8.5px] uppercase tracking-widest font-bold text-emerald-800 flex items-center justify-between mb-1">
                                        <span>
                                          Agent Price Override{" "}
                                          <span className="opacity-60">
                                            (Excl. Tax)
                                          </span>
                                        </span>
                                        {customAgentPrices[
                                          `destPrice_${dest.id}`
                                        ] ? (
                                          <span className="text-emerald-600">
                                            Active
                                          </span>
                                        ) : null}
                                      </label>
                                      <input
                                        type="number"
                                        value={
                                          customAgentPrices[
                                            `destPrice_${dest.id}`
                                          ] ||
                                          (currentAgent as any)?.priceList?.[
                                            `destPrice_${dest.id}`
                                          ] ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          setCustomAgentPrices({
                                            ...customAgentPrices,
                                            [`destPrice_${dest.id}`]:
                                              e.target.value,
                                          })
                                        }
                                        placeholder="e.g. 5000 THB"
                                        className="w-full text-xs font-mono px-2 py-1.5 border border-emerald-300 rounded focus:outline-hidden focus:border-emerald-600 bg-white"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {isAgentOverride &&
                            formData.destinations.length > 0 && (
                              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 flex justify-between items-center shadow-sm">
                                <div className="font-bold flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                                  <DollarSign className="w-3.5 h-3.5" />{" "}
                                  Selected Destinations Total (Excl. Tax)
                                </div>
                                <div className="font-mono text-xs font-bold tracking-tight">
                                  {formData.destinations
                                    .reduce((sum, destId) => {
                                      const destKey = `destPrice_${destId}`;
                                      let val = 0;
                                      if (
                                        customAgentPrices[destKey] !==
                                          undefined &&
                                        customAgentPrices[destKey] !== ""
                                      ) {
                                        val = parseFloat(
                                          customAgentPrices[destKey],
                                        );
                                      } else if (
                                        currentAgent &&
                                        (currentAgent as any).priceList &&
                                        (currentAgent as any).priceList[
                                          destKey
                                        ] !== undefined
                                      ) {
                                        val = parseFloat(
                                          (currentAgent as any).priceList[
                                            destKey
                                          ],
                                        );
                                      }
                                      return sum + (!isNaN(val) ? val : 0);
                                    }, 0)
                                    .toLocaleString()}{" "}
                                  THB
                                </div>
                              </div>
                            )}
                        </>
                      )}

                      {/* Dynamic Live Route Timeline / Vremenska Crta Plovidbe */}
                      <div className="mt-6 p-5 bg-[#FAF9F6] border border-[#0F172A]/10 rounded-sm relative overflow-hidden shadow-2xs">
                        {/* Thin top luxury border */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600" />

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                          <div>
                            <h5 className="text-[12px] font-sans font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Compass className="h-4 w-4 text-emerald-600" />
                              Live Itinerary Waypoint Timeline • Vremenska Crta
                              Plovidbe
                            </h5>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-normal">
                              Dynamic navigation route progression representing
                              your select catamaran waypoint stops.
                            </p>
                          </div>
                          {formData.destinations.length > 0 && (
                            <span className="text-[9px] bg-emerald-800 text-white font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider shrink-0">
                              {formData.destinations.length} Stops Active
                            </span>
                          )}
                        </div>

                        {formData.destinations.length === 0 ? (
                          <div className="py-8 px-4 text-center border border-dashed border-slate-200/80 rounded bg-white/50">
                            <Anchor className="h-7 w-7 text-slate-350 mx-auto stroke-1 animate-bounce mb-2" />
                            <p className="text-xs font-medium text-slate-600 font-sans">
                              No islands selected yet. Choose islands above to
                              draw your active cruising timeline.
                            </p>
                            <p className="text-[10px] text-slate-400 font-sans italic mt-1">
                              Nema odabranih otoka. Označite odredišta iznad
                              kako biste vidjeli vremensku crtu i dinamiku
                              plovidbe.
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const sequence = formData.destinations;
                            const seqPierId = formData.startPierId || "chalong";
                            const endPierId = formData.endPierId || seqPierId;
                            const speedKnots =
                              VESSEL_SPEEDS[formData.vesselId] || 7.0;

                            let totalSeqDistance = 0;
                            let totalTransitTime = 0;

                            if (sequence.length > 0) {
                              const physicalPoints = [
                                seqPierId,
                                ...sequence.map(getPhysicalIsland),
                                endPierId,
                              ];
                              for (
                                let i = 0;
                                i < physicalPoints.length - 1;
                                i++
                              ) {
                                const fromId = physicalPoints[i];
                                const toId = physicalPoints[i + 1];
                                const p1 = destCoords[fromId];
                                const p2 = destCoords[toId];
                                let distance = 0;
                                if (p1 && p2) {
                                  distance = calculateDistanceNM(
                                    p1.lat,
                                    p1.lng,
                                    p2.lat,
                                    p2.lng,
                                  );
                                }
                                totalSeqDistance += distance;
                                totalTransitTime +=
                                  speedKnots > 0 ? distance / speedKnots : 0;
                              }
                            }

                            const orderedDests = getOrderedDestinations(
                              formData.destinations,
                            );
                            const durationHours =
                              formData.charterDuration === "fullday" ||
                              formData.charterDuration === "full-day"
                                ? 9.5
                                : formData.destinations.some((d) =>
                                      d.includes("phi-phi"),
                                    )
                                  ? 12.0
                                  : formData.charterDuration === "halfday" ||
                                      formData.charterDuration === "half-day"
                                    ? 4.5
                                    : 24.0;
                            const availableSailingTime = durationHours - 1.0; // 1h buffer minimum

                            const depParts = (
                              formData.departureTime || "09:00"
                            ).split(":");
                            let runningTime =
                              parseInt(depParts[0], 10) +
                              parseInt(depParts[1], 10) / 60;

                            return (
                              <div className="space-y-4">
                                {/* Horizontal stats summary ribbon */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200/50 rounded-xs mb-3 text-left">
                                  <div>
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                                      Total Cruising Distance
                                    </span>
                                    <strong className="text-xs font-mono font-bold text-slate-800">
                                      {totalSeqDistance.toFixed(1)} NM
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                                      Estimated Yacht Transit Time
                                    </span>
                                    <strong className="text-xs font-mono font-bold text-[#0F172A]">
                                      ~{totalTransitTime.toFixed(1)}{" "}
                                      {ctx("map.hours", "hours")}
                                    </strong>
                                  </div>
                                  <div className="col-span-2 sm:col-span-1">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                                      Optimal Start Point
                                    </span>
                                    <strong className="text-[10.5px] font-sans font-bold text-emerald-800 truncate block">
                                      ⚓{" "}
                                      {PIERS.find(
                                        (p) =>
                                          p.id ===
                                          recommendationInfo.recommendedPierId,
                                      )?.name || "Chalong Pier"}
                                    </strong>
                                  </div>
                                </div>

                                {totalTransitTime > availableSailingTime && (
                                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-[10px] sm:text-[11px] font-medium flex items-start gap-2 mb-4 animate-in fade-in zoom-in duration-300 font-sans">
                                    <span className="text-red-500 shrink-0 text-base">
                                      ⚠️
                                    </span>
                                    <p>
                                      <strong>Insufficient Time Alert:</strong>{" "}
                                      Standard cruising on your chosen boat (
                                      {speedKnots} kts) needs{" "}
                                      <strong>
                                        {totalTransitTime.toFixed(1)} hours
                                      </strong>{" "}
                                      of sailing, exceeding the available{" "}
                                      {availableSailingTime.toFixed(1)} hours of
                                      sailing time for a {durationHours} hour
                                      charter. Please choose a faster vessel,
                                      increase charter duration, or reduce
                                      island stops.
                                    </p>
                                  </div>
                                )}

                                {/* Timeline steps loop */}
                                <div className="relative pl-6 space-y-5">
                                  {/* Full height center timeline connecting bar */}
                                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-dashed bg-emerald-500/30 border-l border-emerald-500/40" />

                                  {/* 1. START POINT WAYPOINT */}
                                  <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    {/* Bullet Circle marker */}
                                    <div
                                      className="absolute -left-5 top-1 z-10 w-4 h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white"
                                      title="Start Point"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[8px] font-mono uppercase bg-slate-900 text-slate-100 font-bold px-1.5 py-0.2 rounded-sm tracking-wider">
                                        {formData.departureTime || "09:00"} •
                                        Start Pier
                                      </span>
                                      <h6 className="text-[11.5px] font-bold text-slate-900 font-sans mt-1">
                                        Departure:{" "}
                                        {PIERS.find(
                                          (p) => p.id === formData.startPierId,
                                        )?.name || "Selected Phuket Pier"}
                                      </h6>
                                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans max-w-xl">
                                        Embarkation, yacht briefing, general
                                        maritime safety overview, and
                                        introductory mocktails by early crew
                                        attendance.
                                      </p>
                                    </div>
                                  </div>

                                  {/* 2. CHOSEN CRUISE STOPS WAYPOINTS */}
                                  {orderedDests.map((dest, idx) => {
                                    const fromId =
                                      idx === 0
                                        ? seqPierId
                                        : getPhysicalIsland(sequence[idx - 1]);
                                    const toId = getPhysicalIsland(
                                      sequence[idx],
                                    );
                                    const p1 = destCoords[fromId];
                                    const p2 = destCoords[toId];
                                    let legDistance = 0;
                                    if (p1 && p2) {
                                      legDistance = calculateDistanceNM(
                                        p1.lat,
                                        p1.lng,
                                        p2.lat,
                                        p2.lng,
                                      );
                                    }
                                    const legTransitHours =
                                      speedKnots > 0
                                        ? legDistance / speedKnots
                                        : 0;
                                    const legTransitMins = Math.round(
                                      legTransitHours * 60,
                                    );

                                    const arrivalHour =
                                      runningTime + legTransitHours;
                                    const hrInt = Math.floor(arrivalHour);
                                    const minInt = Math.round(
                                      (arrivalHour - hrInt) * 60,
                                    );
                                    const isPM = hrInt >= 12;
                                    const finalHr = hrInt % 24;
                                    const minsPadded =
                                      minInt < 10 ? "0" + minInt : minInt;
                                    const formattedTimeStr = `${finalHr < 10 ? "0" + finalHr : finalHr}:${minsPadded}`;

                                    // Increment runningTime for subsequent legs
                                    runningTime = arrivalHour + 1.5;

                                    return (
                                      <div
                                        key={dest.id}
                                        className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-in fade-in slide-in-from-left-5 duration-200"
                                      >
                                        {/* Blue gradient stop dots */}
                                        <div className="absolute -left-5 top-1 z-10 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center text-[8px] font-bold text-white font-mono shadow-sm">
                                          {idx + 1}
                                        </div>
                                        <div className="text-left flex-1">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[8px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-sm tracking-wider">
                                              approx. {formattedTimeStr} • Stop
                                              Waypoint
                                            </span>
                                            <span className="text-[8.5px] text-slate-400 font-mono">
                                              +{legTransitMins} mins transit (
                                              {legDistance.toFixed(1)} NM cruise
                                              leg)
                                            </span>
                                          </div>
                                          <h6 className="text-[11.5px] font-bold text-slate-950 font-sans mt-1">
                                            {ctx(
                                              `destinations.${dest.id}.name`,
                                              dest.name,
                                            )}
                                          </h6>
                                          <p className="text-[10px] text-slate-500 leading-normal font-sans max-w-xl">
                                            {ctx(
                                              `destinations.${dest.id}.desc`,
                                              dest.description,
                                            )}
                                          </p>

                                          {/* Small bullet sights experiences under waypoints */}
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {dest.highlights
                                              .slice(0, 2)
                                              .map((hg, hgIdx) => (
                                                <span
                                                  key={hgIdx}
                                                  className="text-[8.5px] bg-[#FAF9F6] border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm font-sans"
                                                >
                                                  ✓{" "}
                                                  {ctx(
                                                    `destinations.${dest.id}.highlights.${hgIdx}`,
                                                    hg,
                                                  )}
                                                </span>
                                              ))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* 3. RETURN LEG WAYPOINT */}
                                  <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    {/* Orange return marker icon */}
                                    <div
                                      className="absolute -left-5 top-1 z-10 w-4 h-4 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white"
                                      title="Return Arrival back to Phuket"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[8px] font-mono uppercase bg-slate-900 text-slate-100 font-bold px-1.5 py-0.2 rounded-sm tracking-wider">
                                        {formData.arrivalTime || "17:00"} •
                                        Return Arrival
                                      </span>
                                      <h6 className="text-[11.5px] font-bold text-slate-950 font-sans mt-1">
                                        End Pier at{" "}
                                        {PIERS.find(
                                          (p) =>
                                            p.id ===
                                            (formData.endPierId ||
                                              formData.startPierId),
                                        )?.name || "Selected Pier"}
                                      </h6>
                                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans max-w-xl">
                                        Sunset cruising back home, checking out
                                        of AC luxury cabins, group pictures on
                                        the catamaran deck net flybridge, and
                                        safe arrival at end pier.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 6 && (() => {
                  const getExtraImages = (key: string, fallbackUrl: string): string[] => {
                    if (key === "cabinCount" && selectedVesselObj && selectedVesselObj.cabinImages && selectedVesselObj.cabinImages.length > 0) {
                      return selectedVesselObj.cabinImages;
                    }
                    const found = STANDARD_EXTRAS.find((e) => e.key === key);
                    if (found) {
                      if (found.imageUrls && found.imageUrls.length > 0) return found.imageUrls;
                      if (found.imageUrl) return [found.imageUrl];
                    }
                    return [fallbackUrl];
                  };

                  const waterSliderImgs = getExtraImages("waterSlider", "https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=400&q=80");
                  const inflatablePoolImgs = getExtraImages("inflatablePool", "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80");
                  const cabinCountImgs = getExtraImages("cabinCount", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80");
                  const gasBBQImgs = getExtraImages("gasBBQ", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80");
                  const charcoalBBQImgs = getExtraImages("charcoalBBQ", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80");
                  const karaokeImgs = getExtraImages("karaoke", "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=400&q=80");
                  const longtailBoatImgs = getExtraImages("longtailBoat", "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=400&q=80");
                  const mayaBayImgs = getExtraImages("mayaBayTicketAndLongtail", "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=80");
                  const jamesBondImgs = getExtraImages("jamesBondTicket", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80");

                  return (
                    <div>
                      {/* Dynamic upgrades picker as requested by user */}
                      <div className="border bg-slate-50/50 rounded-xs p-6 space-y-4">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-500 fill-amber-300" />
                          {ctx(
                            "step4b.title",
                            "05. Customize Excursion or Party Upgrades",
                          )}
                        </label>
                        <p className="text-xs text-slate-605 text-slate-600 leading-relaxed mt-1">
                          {ctx(
                            "step4b.desc",
                            "Treat your party to deluxe offshore amusement additions, available for setup on any size catamarans:",
                          )}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Water Slider option */}
                          <div
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                addWaterSlider: !prev.addWaterSlider,
                              }))
                            }
                            id="opt-water-slider"
                            className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                              formData.addWaterSlider
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                            }`}
                          >
                            <div>
                              {waterSliderImgs.length > 0 && (
                                <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={waterSliderImgs[0]}
                                    alt="Water Slider"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {waterSliderImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{waterSliderImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx("upgrade.slider", "Book Water Slide")}
                                </span>
                                <input
                                  id="chk-water-slider"
                                  type="checkbox"
                                  checked={formData.addWaterSlider}
                                  onChange={() => {}} // handled by div click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[10px] leading-relaxed mb-2 ${formData.addWaterSlider ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.sliderDesc",
                                  "Inflatable high-thrills water slide letting guests plunge straight from the sun deck into crystal blue bays!",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Inflatable swimming pool option */}
                          <div
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                addInflatablePool: !prev.addInflatablePool,
                              }))
                            }
                            id="opt-inflatable-pool"
                            className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                              formData.addInflatablePool
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                            }`}
                          >
                            <div>
                              {inflatablePoolImgs.length > 0 && (
                                <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={inflatablePoolImgs[0]}
                                    alt="Inflatable Pool"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {inflatablePoolImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{inflatablePoolImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx("upgrade.pool", "Book Safe-Pool")}
                                </span>
                                <input
                                  id="chk-inflatable-pool"
                                  type="checkbox"
                                  checked={formData.addInflatablePool}
                                  onChange={() => {}} // handled by div click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[10px] leading-relaxed mb-2 ${formData.addInflatablePool ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.poolDesc",
                                  "Premium mesh-protected oceanic swimming enclosure. Swim secure, protected from jellyfishes next to deck.",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Cabin rental option */}
                          {getVesselMaxCabins(formData.vesselId, formData.charterDuration) > 0 && (
                            <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                              <div>
                                {cabinCountImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={cabinCountImgs[0]}
                                      alt="AC Cabins"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {cabinCountImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{cabinCountImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                )}
                                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1 flex items-center gap-1">
                                  <Bed className="h-3.5 w-3.5" />{" "}
                                  {ctx("upgrade.cabin", "Book AC Cabins")}
                                </label>
                                <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                  {ctx(
                                    "upgrade.cabinDesc",
                                    "Select up to " +
                                      getVesselMaxCabins(formData.vesselId, formData.charterDuration) +
                                      " luxury double master cabins with dedicated private ensuite showers.",
                                  )}
                                </p>
                              </div>
                              <select
                                id="sel-cabin"
                                value={formData.cabinCount}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    cabinCount: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                              >
                                <option value={0}>
                                  {ctx("upgrade.cabinSelect.none", "0 - None")}
                                </option>
                                {Array.from({
                                  length: getVesselMaxCabins(formData.vesselId, formData.charterDuration),
                                }).map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1} Cabins
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-200/90 my-4 pt-4" />

                        {/* BBQ Grill Options */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {ctx(
                              "upgrade.bbqGrillTitle",
                              "Barbecue Grill Add-ons (Optional)",
                            )}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* BBQ on Gas */}
                            <div
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addGasBBQ: !prev.addGasBBQ,
                                }))
                              }
                              id="opt-gas-bbq"
                              className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                formData.addGasBBQ
                                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                  : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                              }`}
                            >
                              <div>
                                {gasBBQImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={gasBBQImgs[0]}
                                      alt="Gas BBQ"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {gasBBQImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{gasBBQImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex justify-between items-center w-full mb-2">
                                  <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                    {ctx("upgrade.gasBBQ", "Barbecue on Gas")}
                                  </span>
                                  <input
                                    id="chk-gas-bbq"
                                    type="checkbox"
                                    checked={formData.addGasBBQ}
                                    onChange={() => {}} // handled by click
                                    className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                  />
                                </div>
                                <p
                                  className={`text-[10px] leading-relaxed mb-2 ${formData.addGasBBQ ? "text-slate-200" : "text-slate-500"}`}
                                >
                                  {ctx(
                                    "upgrade.gasBBQDesc",
                                    "High-efficiency propane gas BBQ grill set up on the deck. Perfect for clean, speedy grilling of meat or seafood. Available on all yachts!",
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* BBQ Charcoal - Only for The Best */}
                            {selectedVesselObj.id === "the-best" ? (
                              <div
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    addCharcoalBBQ: !prev.addCharcoalBBQ,
                                  }))
                                }
                                id="opt-charcoal-bbq"
                                className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                  formData.addCharcoalBBQ
                                    ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                    : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                                }`}
                              >
                                <div>
                                  {charcoalBBQImgs.length > 0 && (
                                    <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                      <ImageWithFallback
                                        referrerPolicy="no-referrer"
                                        src={charcoalBBQImgs[0]}
                                        alt="Charcoal BBQ"
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                      />
                                      {charcoalBBQImgs.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                          +{charcoalBBQImgs.length} Photos
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center w-full mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1">
                                      {ctx(
                                        "upgrade.charcoalBBQ",
                                        "👑 Charcoal Barbecue",
                                      )}
                                    </span>
                                    <input
                                      id="chk-charcoal-bbq"
                                      type="checkbox"
                                      checked={formData.addCharcoalBBQ}
                                      onChange={() => {}} // handled by click
                                      className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                    />
                                  </div>
                                  <p
                                    className={`text-[10px] leading-relaxed mb-2 ${formData.addCharcoalBBQ ? "text-slate-100" : "text-slate-500"}`}
                                  >
                                    {ctx(
                                      "upgrade.charcoalBBQDesc",
                                      "Premium wood-charcoal classic design grill on the catamaran stern deck. Imparts an authentic robust smoky flavor to your catch.",
                                    )}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xs border border-slate-100 bg-slate-100/50 text-slate-400 select-none cursor-not-allowed flex flex-col justify-between">
                                <div className="flex justify-between items-center w-full mb-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1 opacity-70">
                                    {ctx(
                                      "upgrade.charcoalBBQLocked",
                                      "🔒 Charcoal Barbecue",
                                    )}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide font-sans">
                                    {ctx(
                                      "upgrade.charcoalBBQTheBestOnly",
                                      '"The Best" Only',
                                    )}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                                  {ctx(
                                    "upgrade.charcoalBBQLimitDesc",
                                    'Authentic coal-smoking barbecue setup. This exclusive premium feature is restricted to our flagship catamaran "The Best".',
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Fruit Platter & Snack Upgrades */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          {ctx(
                            "upgrade.fruitsTitle",
                            "🍎 Extra Fruit & Snack Platters",
                          )}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Extra Watermelon Choice */}
                          <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                            <div>
                              {(() => {
                                const watermelonImgs = getExtraImages("extraWatermelon", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80");
                                return watermelonImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={watermelonImgs[0]}
                                      alt="Watermelon"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {watermelonImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{watermelonImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                {ctx(
                                  "upgrade.watermelon",
                                  "🍉 Extra Watermelon",
                                )}
                              </label>
                              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                {ctx(
                                  "upgrade.watermelonDesc",
                                  "Chilled sweet juicy red slices. Select quantity:",
                                )}
                              </p>
                            </div>
                            <select
                              id="sel-extra-watermelon"
                              value={formData.extraWatermelon}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  extraWatermelon: parseInt(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                            >
                              <option value={0}>
                                {ctx(
                                  "upgrade.watermelonSelect.none",
                                  "0 - None",
                                )}
                              </option>
                              <option value={1}>
                                1{" "}
                                {ctx(
                                  "upgrade.watermelonSelect.unitSingle",
                                  "Platter",
                                )}
                              </option>
                              <option value={2}>
                                2{" "}
                                {ctx(
                                  "upgrade.watermelonSelect.unitPlural",
                                  "Platters",
                                )}
                              </option>
                              <option value={3}>
                                3{" "}
                                {ctx(
                                  "upgrade.watermelonSelect.unitPlural",
                                  "Platters",
                                )}
                              </option>
                              <option value={4}>
                                4{" "}
                                {ctx(
                                  "upgrade.watermelonSelect.unitPlural",
                                  "Platters",
                                )}
                              </option>
                              <option value={5}>
                                5{" "}
                                {ctx(
                                  "upgrade.watermelonSelect.unitPlural",
                                  "Platters",
                                )}
                              </option>
                            </select>
                          </div>

                          {/* Extra Snacks Option */}
                          <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                            <div>
                              {(() => {
                                const snacksImgs = getExtraImages("extraSnack", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80");
                                return snacksImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={snacksImgs[0]}
                                      alt="Snacks"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {snacksImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{snacksImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                {ctx("upgrade.snacks", "🍿 Extra Snacks")}
                              </label>
                              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                {ctx(
                                  "upgrade.snacksDesc",
                                  "Select premium snack spreads (1-20):",
                                )}
                              </p>
                            </div>
                            <select
                              id="sel-extra-snack"
                              value={formData.extraSnack}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  extraSnack: parseInt(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                            >
                              <option value={0}>
                                {ctx(
                                  "upgrade.watermelonSelect.none",
                                  "0 - None",
                                )}
                              </option>
                              {Array.from({ length: 20 }, (_, i) => i + 1).map(
                                (num) => (
                                  <option key={num} value={num}>
                                    {num}{" "}
                                    {num === 1
                                      ? ctx(
                                          "upgrade.snacksUnitSingle",
                                          "Premium snack unit",
                                        )
                                      : ctx(
                                          "upgrade.snacksUnitPlural",
                                          "Premium snack units",
                                        )}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>

                          {/* Extra Pineapple Option */}
                          <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                            <div>
                              {(() => {
                                const pineappleImgs = getExtraImages("extraPineapple", "https://images.unsplash.com/photo-1550258114-28b3a82b2397?auto=format&fit=crop&w=400&q=80");
                                return pineappleImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={pineappleImgs[0]}
                                      alt="Pineapple"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {pineappleImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{pineappleImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                {ctx("upgrade.pineapple", "🍍 Extra Pineapple")}
                              </label>
                              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                {ctx(
                                  "upgrade.pineappleDesc",
                                  "Select local sweet pineapple (1-10):",
                                )}
                              </p>
                            </div>
                            <select
                              id="sel-extra-pineapple"
                              value={formData.extraPineapple}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  extraPineapple: parseInt(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                            >
                              <option value={0}>
                                {ctx(
                                  "upgrade.watermelonSelect.none",
                                  "0 - None",
                                )}
                              </option>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(
                                (num) => (
                                  <option key={num} value={num}>
                                    {num}{" "}
                                    {num === 1
                                      ? ctx(
                                          "upgrade.pineapplePlatterSingle",
                                          "Pineapple platter",
                                        )
                                      : ctx(
                                          "upgrade.pineapplePlatterPlural",
                                          "Pineapple platters",
                                        )}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Karaoke Option */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Music className="h-4 w-4 text-pink-500" />
                          {ctx(
                            "upgrade.entertainmentTitle",
                            "On-Board Premium Entertainment",
                          )}
                        </p>

                        {selectedVesselObj.id === "the-best" && (
                          <div
                            id="the-best-included-media-info"
                            className="p-3.5 rounded-xs bg-sky-50/70 border border-sky-900/10 text-sky-950 flex flex-col gap-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-sky-800 bg-sky-100 border border-sky-300 rounded-sm px-1.5 py-0.5 uppercase tracking-wider font-sans">
                                {ctx(
                                  "upgrade.intellectualFreeTheBest",
                                  '🎁 Included Free on "The Best"',
                                )}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-sky-900 leading-snug font-sans mt-0.5">
                              {ctx(
                                "upgrade.tvFeature",
                                '32" Smart TV with Netflix & YouTube for Kids + Free WiFi Internet',
                              )}
                            </p>
                            <p className="text-[10px] text-sky-700 font-sans leading-relaxed">
                              {ctx(
                                "upgrade.tvFeatureDesc",
                                "Complimentary onboard internet access (speed depending on connected people) and a dedicated 32 inch TV loaded with streaming catalogs to keep children happy and entertained.",
                              )}
                            </p>
                          </div>
                        )}

                        <div>
                          {selectedVesselObj.id === "the-best" ? (
                            <div
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addKaraoke: !prev.addKaraoke,
                                }))
                              }
                              id="opt-karaoke"
                              className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                formData.addKaraoke
                                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                  : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                              }`}
                            >
                              <div>
                                {karaokeImgs.length > 0 && (
                                  <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                    <ImageWithFallback
                                      referrerPolicy="no-referrer"
                                      src={karaokeImgs[0]}
                                      alt="Karaoke"
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    {karaokeImgs.length > 1 && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                        +{karaokeImgs.length} Photos
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex justify-between items-center w-full mb-2">
                                  <span className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1.5">
                                    {ctx(
                                      "upgrade.karaoke",
                                      "🎵 Professional Onboard Karaoke System",
                                    )}
                                  </span>
                                  <input
                                    id="chk-karaoke"
                                    type="checkbox"
                                    checked={formData.addKaraoke}
                                    onChange={() => {}} // handled by click
                                    className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                  />
                                </div>
                                <p
                                  className={`text-[10px] leading-relaxed mb-2 ${formData.addKaraoke ? "text-slate-200" : "text-slate-500"}`}
                                >
                                  {ctx(
                                    "upgrade.karaokeDesc",
                                    "Multi-speaker surround sound system with massive flat screen, catalog containing 50,000+ files, and wireless microphones.",
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xs border border-slate-100 bg-slate-100/50 text-slate-400 select-none cursor-not-allowed flex flex-col justify-between">
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5 opacity-70">
                                  {ctx(
                                    "upgrade.karaokeLocked",
                                    "🔒 On-Board Karaoke System",
                                  )}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide font-sans">
                                  {ctx(
                                    "upgrade.charcoalBBQTheBestOnly",
                                    '"The Best" Only',
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                                {ctx(
                                  "upgrade.karaokeLimitDesc",
                                  'Turn your Andaman sunset into an exceptional acoustic stage. This premium package is exclusively integrated onboard our flagship catamaran "The Best".',
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Longtail Boat & Maya Bay options */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Compass className="h-4 w-4 text-emerald-600" />
                          {ctx(
                            "upgrade.longtailTitle",
                            "Longtail Boat & Island Entry Upgrades",
                          )}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Option 1: Classic Longtail Boat anywhere */}
                          <div
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                addLongtailBoat: !prev.addLongtailBoat,
                              }))
                            }
                            id="opt-longtail-boat"
                            className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                              formData.addLongtailBoat
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                            }`}
                          >
                            <div>
                              {longtailBoatImgs.length > 0 && (
                                <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={longtailBoatImgs[0]}
                                    alt="Private Longtail Boat"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {longtailBoatImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{longtailBoatImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx(
                                    "upgrade.privateLongtail",
                                    "⚓ Private Long Tail Boat",
                                  )}
                                </span>
                                <input
                                  id="chk-longtail-boat"
                                  type="checkbox"
                                  checked={formData.addLongtailBoat}
                                  onChange={() => {}} // handled by click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[10px] leading-relaxed mb-2 ${formData.addLongtailBoat ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.privateLongtailDesc",
                                  "Private local wooden long tail boat charter on any of the selected islands. Perfect for close-up reef access, shallow coral runs, and private beach drop-offs.",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Option 2: Maya Bay and longtail boat tickets */}
                          <div
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                addMayaBayTicketAndLongtail:
                                  !prev.addMayaBayTicketAndLongtail,
                              }))
                            }
                            id="opt-mayabay-ticket"
                            className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                              formData.addMayaBayTicketAndLongtail
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                            }`}
                          >
                            <div>
                              {mayaBayImgs.length > 0 && (
                                <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={mayaBayImgs[0]}
                                    alt="Maya Bay Ticket & Longtail"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {mayaBayImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{mayaBayImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx(
                                    "upgrade.mayaBayTicket",
                                    "🎟️ Maya Bay Tour & Ticket",
                                  )}
                                </span>
                                <input
                                  id="chk-mayabay-ticket"
                                  type="checkbox"
                                  checked={formData.addMayaBayTicketAndLongtail}
                                  onChange={() => {}} // handled by click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[10px] leading-relaxed mb-2 ${formData.addMayaBayTicketAndLongtail ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.mayaBayTicketDesc",
                                  "Guaranteed park entry tickets to Maya Beach combined with an authentic wooden longtail boat cruise into Pileh Lagoon's transparent turquoise waters.",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Option 3: James Bond Island Tour Ticket */}
                          <div
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                addJamesBondTicket: !prev.addJamesBondTicket,
                              }))
                            }
                            id="opt-jamesbond-ticket"
                            className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                              formData.addJamesBondTicket
                                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                            }`}
                          >
                            <div>
                              {jamesBondImgs.length > 0 && (
                                <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={jamesBondImgs[0]}
                                    alt="James Bond Tour Ticket"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {jamesBondImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{jamesBondImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx(
                                    "upgrade.jamesBondTicket",
                                    "🎬 James Bond Tour Ticket",
                                  )}
                                </span>
                                <input
                                  id="chk-jamesbond-ticket"
                                  type="checkbox"
                                  checked={formData.addJamesBondTicket}
                                  onChange={() => {}} // handled by click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[10px] leading-relaxed mb-2 ${formData.addJamesBondTicket ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.jamesBondTicketDesc",
                                  "Guaranteed national park admission tickets to Ao Phang Nga National Park (James Bond Island) with sea canoeing around mystic caves.",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Banana Beach Water Sports - Only for Banana Beach */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Compass className="h-4 w-4 text-orange-500" />
                          {ctx(
                            "upgrade.bananaBeachTitle",
                            "🌊 Banana Beach Water Sports (Exclusive)",
                          )}
                        </p>
                        {formData.destinations.includes(
                          "ko-he-north-banana-beach",
                        ) ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Parasailing */}
                            <div
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addParasailing: !prev.addParasailing,
                                }))
                              }
                              id="opt-parasailing"
                              className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                formData.addParasailing
                                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                  : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                              }`}
                            >
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx(
                                    "upgrade.parasailing",
                                    "Book Parasailing Experience",
                                  )}
                                </span>
                                <input
                                  id="chk-parasailing"
                                  type="checkbox"
                                  checked={formData.addParasailing}
                                  onChange={() => {}} // handled by click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[11px] leading-relaxed ${formData.addParasailing ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.parasailingDesc",
                                  "Experience the ultimate thrill soaring high above the turquoise bay of Koh He with trained safety professionals.",
                                )}
                              </p>
                            </div>

                            {/* Banana Boat */}
                            <div
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addBananaBoat: !prev.addBananaBoat,
                                }))
                              }
                              id="opt-banana-boat"
                              className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                formData.addBananaBoat
                                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                  : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                              }`}
                            >
                              <div className="flex justify-between items-center w-full mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                                  {ctx(
                                    "upgrade.bananaBoat",
                                    "Book Banana Boat Ride",
                                  )}
                                </span>
                                <input
                                  id="chk-banana-boat"
                                  type="checkbox"
                                  checked={formData.addBananaBoat}
                                  onChange={() => {}} // handled by click
                                  className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <p
                                className={`text-[11px] leading-relaxed ${formData.addBananaBoat ? "text-slate-200" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "upgrade.bananaBoatDesc",
                                  "Gather your group and bounce over the tropical waves on our exciting high-speed inflatable banana craft.",
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xs border border-slate-100 bg-slate-100/50 text-slate-400 select-none cursor-not-allowed flex flex-col justify-between">
                            <div className="flex justify-between items-center w-full mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5 opacity-70">
                                {ctx(
                                  "upgrade.bananaBeachLocked",
                                  "🔒 Banana Beach Water Sports",
                                )}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide font-sans">
                                {ctx(
                                  "upgrade.bananaBeachOnly",
                                  "Banana Beach Only",
                                )}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                              {ctx(
                                "upgrade.bananaBeachLimitDesc",
                                "Parasailing and Banana Boat rides are exclusively available at the elite Banana Beach playground (Ko He North). Please select Banana Beach as your destination to enable these options!",
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Rubber Canoe - Only for Koh Kalu Ok */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Compass className="h-4 w-4 text-cyan-600" />
                          {ctx(
                            "upgrade.rubberCanoeTitle",
                            "🛶 Koh Kalu Ok Inflatable Canoe (Exclusive)",
                          )}
                        </p>
                        {formData.destinations.includes("ko-kalu-ok") ? (
                          <div className="p-4 rounded-xs border border-slate-200 bg-white space-y-4 shadow-xs">
                            <div
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addRubberCanoe: !prev.addRubberCanoe,
                                }))
                              }
                              className="flex items-start gap-3 cursor-pointer select-none"
                            >
                              <div className="mt-1 flex items-center justify-center p-0.5 rounded-sm border border-slate-200">
                                <input
                                  id="chk-rubber-canoe"
                                  type="checkbox"
                                  checked={formData.addRubberCanoe}
                                  readOnly
                                  className="accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1">
                                <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                  {ctx(
                                    "upgrade.rubberCanoe",
                                    "Rent Inflatable Rubber Canoes",
                                  )}
                                </span>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  {ctx(
                                    "upgrade.rubberCanoeDesc",
                                    "Explore hidden sea caves and shallow interior lagoons in silence (Max 2 passengers per canoe).",
                                  )}
                                </p>
                              </div>
                            </div>

                            {formData.addRubberCanoe && (
                              <div className="pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1.5">
                                    {ctx(
                                      "upgrade.rubberCanoeQty",
                                      "Select Quantity (1-10 Canoes)",
                                    )}
                                  </label>
                                  <select
                                    id="sel-rubber-canoe-count"
                                    value={formData.rubberCanoeCount}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        rubberCanoeCount: parseInt(
                                          e.target.value,
                                        ),
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                  >
                                    {[...Array(10)].map((_, i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}{" "}
                                        {ctx(
                                          i === 0
                                            ? "upgrade.rubberCanoeUnitSingle"
                                            : "upgrade.rubberCanoeUnitPlural",
                                          i === 0
                                            ? "Rubber Canoe"
                                            : "Rubber Canoes",
                                        )}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50/50 rounded-xs border border-blue-100/50">
                                  <Users className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
                                    Capacity: Up to{" "}
                                    {formData.rubberCanoeCount * 2} Passengers
                                    Total
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xs border border-slate-100 bg-slate-100/50 text-slate-400 select-none cursor-not-allowed">
                            <div className="flex justify-between items-center w-full mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5 opacity-70">
                                {ctx(
                                  "upgrade.rubberCanoeLocked",
                                  "🔒 Rubber Canoe Rentals",
                                )}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide font-sans shrink-0">
                                {ctx(
                                  "upgrade.rubberCanoeOnly",
                                  "Koh Kalu Ok Only",
                                )}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                              {ctx(
                                "upgrade.rubberCanoeLimitDesc",
                                "Rubber canoe rentals are exclusively available for the Koh Kalu Ok destination due to its unique sea caves and lagoons. Please select Koh Kalu Ok to enable this option!",
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Jet Ski - ONLY Koh Khai Nok & Naga Islands */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          {ctx(
                            "upgrade.jetskiTitle",
                            "🌊 Jet Ski Rentals (Exclusive Islands)",
                          )}
                        </p>
                        {isVisitingKohKhaiNok ? (
                          <div className="p-4 rounded-xs border border-slate-200 bg-white space-y-4">
                            {(() => {
                              const jetskiImgs = getExtraImages("jetski", "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80");
                              return jetskiImgs.length > 0 && (
                                <div className="w-full h-36 overflow-hidden rounded-xs relative shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={jetskiImgs[0]}
                                    alt="Jet Ski"
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {jetskiImgs.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                      +{jetskiImgs.length} Photos
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                              <div className="flex items-center gap-3">
                                <input
                                  id="chk-add-jetski"
                                  type="checkbox"
                                  checked={formData.addJetski}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      addJetski: e.target.checked,
                                    }))
                                  }
                                  className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                    {ctx(
                                      "upgrade.jetskiRent",
                                      "Rent High-Speed Jet Ski at Destination Island",
                                    )}
                                  </span>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {ctx(
                                      "upgrade.jetskiDesc",
                                      "Enjoy the crystal shallow waters on high-quality sea scooters with skilled guides.",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
 
                            {formData.addJetski && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                    {ctx(
                                      "upgrade.jetskiQty",
                                      "Select Jet Ski Quantity",
                                    )}
                                  </label>
                                  <select
                                    id="sel-jetski-count"
                                    value={formData.jetskiCount}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        jetskiCount: parseInt(e.target.value),
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                  >
                                    {[1, 2, 3, 4, 5].map((num) => (
                                      <option key={num} value={num}>
                                        {num}{" "}
                                        {num === 1
                                          ? ctx(
                                              "upgrade.jetskiUnitSingle",
                                              "Jet Ski",
                                            )
                                          : ctx(
                                              "upgrade.jetskiUnitPlural",
                                              "Jet Skis",
                                            )}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                                    {ctx(
                                      "upgrade.jetskiDuration",
                                      "Select Ride Duration",
                                    )}
                                  </label>
                                  <select
                                    id="sel-jetski-duration"
                                    value={formData.jetskiDuration}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        jetskiDuration: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A]/50 focus:outline-hidden bg-white cursor-pointer"
                                  >
                                    <option value="30m">
                                      {ctx(
                                        "upgrade.jetskiDuration30m",
                                        "30 Minutes Ride",
                                      )}
                                    </option>
                                    <option value="1h">
                                      {ctx(
                                        "upgrade.jetskiDuration1h",
                                        "1 Hour Rental",
                                      )}
                                    </option>
                                    <option value="2h">
                                      {ctx(
                                        "upgrade.jetskiDuration2h",
                                        "2 Hours Grand Rental",
                                      )}
                                    </option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xs border border-slate-100 bg-slate-100/50 text-slate-400 select-none cursor-not-allowed flex flex-col justify-between">
                            <div className="flex justify-between items-center w-full mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5 opacity-70">
                                {ctx(
                                  "upgrade.jetskiLocked",
                                  "🔒 Jet Ski Rentals",
                                )}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide font-sans">
                                {ctx(
                                  "upgrade.jetskiKhaiNokOnly",
                                  "Exclusive Islands Only",
                                )}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-400 font-sans font-sans">
                              {ctx(
                                "upgrade.jetskiLimitDesc",
                                "Jet Ski rental operates exclusively at select locations (Koh Khai Nok, Naka Yai, Naka Noi). Please select one of these destinations to enable this upgrade!",
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Minibus Transfer option */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Bus className="h-4 w-4 text-sky-600" />
                          {ctx(
                            "upgrade.minibusTitle",
                            "Private Minibus Roundtrip Airport/Hotel Transfer",
                          )}
                        </p>
                        <div className="p-4 rounded-xs border border-slate-200/90 bg-white space-y-4 font-sans">
                          <div className="flex items-center gap-3">
                            <input
                              id="chk-add-minibus"
                              type="checkbox"
                              checked={formData.addMinibusTransfer}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addMinibusTransfer: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider block text-[#0F172A]">
                                {ctx(
                                  "upgrade.minibusLabel",
                                  "Add roundtrip minivan transport",
                                )}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {ctx(
                                  "upgrade.minibusDesc",
                                  "Arrive stress-free in a private, air-conditioned luxury VIP minibus straight to your departure pier and back.",
                                )}
                              </p>
                            </div>
                          </div>

                          {formData.addMinibusTransfer && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                              <div>
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                  {ctx(
                                    "upgrade.transferMarina",
                                    "Destination Pier / Harbor",
                                  )}
                                </label>
                                <select
                                  id="sel-transfer-marina"
                                  value={formData.transferMarina}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      transferMarina: e.target.value as
                                        | "chalong"
                                        | "ao-po"
                                        | "coco",
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                >
                                  <option value="chalong">
                                    {ctx(
                                      "upgrade.transferMarinaChalong",
                                      "Chalong Pier (Recommended for Racha, Coral, Maithon)",
                                    )}
                                  </option>
                                  <option value="ao-po">
                                    {ctx(
                                      "upgrade.transferMarinaAoPo",
                                      "Ao Po Pier (Recommended for Phang Nga, James Bond)",
                                    )}
                                  </option>
                                  <option value="coco">
                                    {ctx(
                                      "upgrade.transferMarinaCoco",
                                      "Coco Pier (Alternative Starting Point)",
                                    )}
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                  {ctx(
                                    "upgrade.minibusGuestsTitle",
                                    "Number of Passengers / People",
                                  )}
                                </label>
                                <select
                                  id="sel-transfer-guests"
                                  value={formData.transferGuests}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      transferGuests: parseInt(e.target.value),
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                                >
                                  {Array.from(
                                    { length: 20 },
                                    (_, i) => i + 1,
                                  ).map((num) => (
                                    <option key={num} value={num}>
                                      {num}{" "}
                                      {num === 1
                                        ? ctx(
                                            "upgrade.transferGuestsUnitSingle",
                                            "Person",
                                          )
                                        : ctx(
                                            "upgrade.transferGuestsUnitPlural",
                                            "People",
                                          )}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                  {ctx(
                                    "upgrade.minibusPickupAddress",
                                    "Pickup Location / Hotel Name (From Where?)",
                                  )}
                                </label>
                                <input
                                  type="text"
                                  placeholder={ctx(
                                    "upgrade.minibusPickupPlaceholder",
                                    "e.g. Hilton Resort Patong, Phuket Airport Flight TG201, Patong Beach Hotel",
                                  )}
                                  value={formData.transferPickupAddress}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      transferPickupAddress: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white"
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Guide Options */}
                      <div className="space-y-3 font-sans">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                          <Languages className="h-4 w-4 text-emerald-600" />
                          {ctx(
                            "upgrade.guideTitle",
                            "Professional Host & Translator guide (Optional)",
                          )}
                        </p>
                        <div className="p-4 rounded-xs border border-slate-200/90 bg-white space-y-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider block text-[#0F172A]">
                              {ctx(
                                "upgrade.guideLabel",
                                "Select Specialist Language Guide",
                              )}
                            </span>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                              {ctx(
                                "upgrade.guideDesc",
                                "Highly vetted native-speaking guides certified by the Tourist Authority of Thailand. Perfect for detailed explanations of islands, marine wildlife, and safety translation.",
                              )}
                            </p>
                          </div>
                          <select
                            id="sel-guide-language"
                            value={formData.guideLanguage}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                guideLanguage: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                          >
                            <option value="none">
                              {ctx(
                                "upgrade.guideOptNone",
                                "No Special host guide needed (Local Thai Skipper & Crew only)",
                              )}
                            </option>
                            <option value="english">
                              🇬🇧{" "}
                              {ctx(
                                "upgrade.guideOptEn",
                                "English Speaking Guide",
                              )}
                            </option>
                            <option value="indian">
                              🇮🇳{" "}
                              {ctx(
                                "upgrade.guideOptIn",
                                "Indian Speaking Guide",
                              )}
                            </option>
                            <option value="chinese">
                              🇨🇳{" "}
                              {ctx(
                                "upgrade.guideOptZh",
                                "Chinese Speaking Guide",
                              )}
                            </option>
                            <option value="south-korean">
                              🇰🇷{" "}
                              {ctx(
                                "upgrade.guideOptKr",
                                "South Korean Speaking Guide",
                              )}
                            </option>
                            <option value="arabic">
                              🇦🇪{" "}
                              {ctx(
                                "upgrade.guideOptAr",
                                "Arabic Speaking Guide",
                              )}
                            </option>
                            <option value="russian">
                              🇷🇺{" "}
                              {ctx(
                                "upgrade.guideOptRu",
                                "Russian Speaking Guide",
                              )}
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/90 my-4 pt-4" />

                      {/* Fishing Options */}
                      <div className="space-y-3 font-sans">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                          🎣{" "}
                          {ctx(
                            "upgrade.fishingTitle",
                            "Tour Fishing & Professional Gear",
                          )}
                        </p>

                        {/* Fishing included banner */}
                        <div
                          id="fishing-standard-inc"
                          className="p-4 rounded-xs border border-[#0F172A]/10 bg-slate-50/50 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center w-full mb-1">
                              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider leading-tight">
                                {ctx(
                                  "upgrade.fishingHeaderV3",
                                  "✓ 2 TROLLING RODS ARE INCLUDED IN ALL SHIPS",
                                )}
                              </span>
                              <span className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 rounded-sm px-1.5 py-0.5 uppercase tracking-wide">
                                {ctx("upgrade.fishingTagV3", "Included")}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                              {ctx(
                                "upgrade.fishingDescV3",
                                "Every private charter includes 2 complimentary trolling rods on board. You can add extra traditional handlines or professional fishing rods below.",
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Handlines */}
                          <div
                            id="fishing-handlines"
                            className="p-4 rounded-xs border border-slate-200 bg-white flex flex-col justify-between"
                          >
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                {ctx(
                                  "upgrade.fishingHandlinesHeader",
                                  "Traditional Fishing Handlines",
                                )}
                              </label>
                              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                                {ctx(
                                  "upgrade.fishingHandlinesDesc",
                                  "Add classical handline fishing gear for your group (1 to 10 handlines available):",
                                )}
                              </p>
                            </div>
                            <select
                              id="sel-fishing-handlines"
                              value={formData.fishingHandlinesCount}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  fishingHandlinesCount: parseInt(
                                    e.target.value,
                                  ),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                            >
                              <option value={0}>
                                {ctx(
                                  "upgrade.fishingHandlinesFreeOption",
                                  "0 - No handlines needed",
                                )}
                              </option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}{" "}
                                  {num === 1
                                    ? ctx(
                                        "upgrade.fishingHandlinesSingle",
                                        "Handline",
                                      )
                                    : ctx(
                                        "upgrade.fishingHandlinesPlural",
                                        "Handlines",
                                      )}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Pro fishing rod upgrades */}
                          <div
                            id="fishing-pro-upgrade"
                            className="p-4 rounded-xs border border-slate-200 bg-white flex flex-col justify-between"
                          >
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                {ctx(
                                  "upgrade.fishingProHeaderV2",
                                  "Upgrade Premium Fishing Rods",
                                )}
                              </label>
                              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                                {ctx(
                                  "upgrade.fishingProDescV2",
                                  "Rent additional professional rods, reels, & premium trolling gear for deeper waters (Max 5 rods):",
                                )}
                              </p>
                            </div>
                            <select
                              id="sel-fishing-rods"
                              value={formData.fishingRodsCount}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  fishingRodsCount: parseInt(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] focus:outline-hidden bg-white cursor-pointer"
                            >
                              <option value={0}>
                                {ctx(
                                  "upgrade.fishingFreeOptionV2",
                                  "0 - Only use the 2 included trolling rods",
                                )}
                              </option>
                              <option value={1}>
                                1{" "}
                                {ctx(
                                  "upgrade.fishingProUnitSingle",
                                  "Additional Premium Rod",
                                )}
                              </option>
                              <option value={2}>
                                2{" "}
                                {ctx(
                                  "upgrade.fishingProUnitPlural",
                                  "Additional Premium Rods",
                                )}
                              </option>
                              <option value={3}>
                                3{" "}
                                {ctx(
                                  "upgrade.fishingProUnitPlural",
                                  "Additional Premium Rods",
                                )}
                              </option>
                              <option value={4}>
                                4{" "}
                                {ctx(
                                  "upgrade.fishingProUnitPlural",
                                  "Additional Premium Rods",
                                )}
                              </option>
                              <option value={5}>
                                5{" "}
                                {ctx(
                                  "upgrade.fishingProFullSet",
                                  "Additional Premium Rods",
                                )}
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Sashimi Prep Box */}
                        <div className="p-4 rounded-xs border border-slate-200 bg-white space-y-4">
                          <div className="flex items-start gap-3">
                            <input
                              id="chk-add-sashimi"
                              type="checkbox"
                              checked={formData.addSashimi}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  addSashimi: e.target.checked,
                                }))
                              }
                              className="rounded-sm accent-[#0F172A] h-4 w-4 cursor-pointer mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider font-sans block text-[#0F172A]">
                                Sashimi Preparation (If Tuna/Fish is caught)
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                Our crew can prepare fresh sashimi right on
                                board from your catch! Note: There is an
                                additional 500 to 1,000 THB fee payable directly
                                to the captain depending on the fish size and
                                amount.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom & Premium Extras Section */}
                      {(() => {
                        const hardcodedKeys = ["waterSlider", "inflatablePool", "cabinCount", "gasBBQ", "charcoalBBQ", "extraWatermelon", "extraSnack", "extraPineapple", "karaoke", "longtailBoat", "mayaBayTicketAndLongtail", "jamesBondTicket", "jetski", "minibusTransfer", "guide", "fishingGear", "fishingHandlines", "bartender", "birthdayCake", "champagne", "partyDecorations", "flowerBouquet", "photographer", "droneVideography", "dj", "sashimi", "redWine", "whiteWine", "beer"];
                        const customExtras = STANDARD_EXTRAS.filter(extra => !hardcodedKeys.includes(extra.key));
                        
                        if (customExtras.length === 0) return null;

                        return (
                          <div className="space-y-4 pt-4 border-t border-slate-200/90 mt-4">
                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                              {ctx(
                                "upgrade.customExtrasTitle",
                                "✨ Additional Custom & Premium Extras",
                              )}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {customExtras.map((extra) => {
                                const isSelected = formData.customAddonKeys?.includes(extra.key) || false;
                                const displayPrice = extra.defaultPrice || 0;
                                
                                // Carousel / Image gallery for custom extras
                                const images = extra.imageUrls && extra.imageUrls.length > 0 
                                  ? extra.imageUrls 
                                  : extra.imageUrl 
                                    ? [extra.imageUrl] 
                                    : [];

                                return (
                                  <div
                                    key={extra.key}
                                    onClick={() => {
                                      const current = formData.customAddonKeys || [];
                                      const updated = isSelected 
                                        ? current.filter(k => k !== extra.key) 
                                        : [...current, extra.key];
                                      setFormData(prev => ({ ...prev, customAddonKeys: updated }));
                                    }}
                                    className={`p-4 rounded-xs border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                      isSelected
                                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-md"
                                        : "bg-white text-[#0F172A] border-slate-200/90 hover:border-[#0F172A]/50"
                                    }`}
                                  >
                                    <div>
                                      {images.length > 0 && (
                                        <div className="w-full h-24 mb-3 overflow-hidden rounded-sm relative shrink-0 bg-slate-100">
                                          {images.length === 1 ? (
                                            <ImageWithFallback
                                              referrerPolicy="no-referrer"
                                              src={images[0]}
                                              alt={extra.label}
                                              className="w-full h-full object-cover transition-transform duration-500"
                                            />
                                          ) : (
                                            // Split or first grid view with photos count banner
                                            <div className="w-full h-full relative">
                                              <ImageWithFallback
                                                referrerPolicy="no-referrer"
                                                src={images[0]}
                                                alt={extra.label}
                                                className="w-full h-full object-cover transition-transform duration-500"
                                              />
                                              <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-bold text-white px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                                +{images.length} Photos
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      <div className="flex justify-between items-start w-full gap-1 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider font-sans block max-w-[85%]">
                                          {extra.label}
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}} // Handled by div container click
                                          className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer mt-0.5 shrink-0"
                                        />
                                      </div>
                                      
                                      {extra.description && (
                                        <p className={`text-[10px] leading-relaxed mb-3 ${isSelected ? "text-slate-350" : "text-slate-500"}`}>
                                          {extra.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex justify-between items-center w-full border-t border-slate-100/10 pt-2 mt-auto">
                                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-emerald-400" : "text-emerald-700"}`}>
                                        Premium Option
                                      </span>
                                      <span className="font-mono text-[10px] font-bold">
                                        {displayPrice.toLocaleString()} THB
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {isAgentOverride && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 flex justify-between items-center shadow-sm">
                          <div className="font-bold flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                            <DollarSign className="w-3.5 h-3.5" /> Selected
                            Upgrades Total (Excl. Tax)
                          </div>
                          <div className="font-mono text-xs font-bold tracking-tight">
                            {priceCalculation.upgradesList
                              .reduce((sum, u) => {
                                // Only count upgrades, skip destination surcharges if they were added to upgradesList
                                if (
                                  u.name === "Destination Surcharge" ||
                                  u.name === "Agency Custom Upgrades & Fees" ||
                                  u.name === "Custom Destination Pier Fees"
                                ) {
                                  return sum;
                                }
                                return sum + u.price;
                              }, 0)
                              .toLocaleString()}{" "}
                            THB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

                {formStep === 5 && (
                  <div>
                    {/* Step 6B: Culinary & Onboard Food Catering Options */}
                    <div className="border bg-slate-50/50 rounded-xs p-6 space-y-4">
                      <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-500 fill-amber-300" />
                        04.{" "}
                        {ctx(
                          "upgrade.bbqTitle",
                          "Customize Culinary & Catering Packages",
                        )}
                      </label>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {ctx(
                          "upgrade.cateringSub",
                          "Treat your guests to exceptional ocean-side catering. Select the best dining upgrade for your catamaran journey:",
                        )}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Option 1: Standard Inclusions */}
                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              foodOption: "standard",
                            }))
                          }
                          id="food-opt-standard"
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${
                            formData.foodOption === "standard"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-40 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1490216692942-e070eec68d1b?auto=format&fit=crop&w=600&q=80"
                              alt="Standard Spread"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm shadow-sm border border-emerald-400/20">
                                {ctx("food.standardIncl", "FREE COMPLIMENTARY")}
                              </span>
                            </div>
                            {formData.foodOption === "standard" && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5">
                                {ctx(
                                  "food.standardLabel",
                                  "Standard Charter Board",
                                )}
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.foodOption === "standard" ? "text-slate-300" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "food.standardDesc",
                                  "Cool soft drinks, fresh tropical pineapple & watermelon platters, pure drinking mineral water, and {coolers} included.",
                                ).replace("{coolers}", getCoolersText())}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Seafood BBQ */}
                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              foodOption: "seafood-bbq",
                            }))
                          }
                          id="food-opt-seafood"
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${
                            formData.foodOption === "seafood-bbq"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-40 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1548231367-7b83ecdcbfd5?auto=format&fit=crop&w=600&q=80"
                              alt="Seafood BBQ"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="text-[10px] uppercase font-bold text-white font-mono bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm shadow-sm border border-white/20">
                                {ctx("food.seafoodTag", "Premium upgrade")}
                              </span>
                            </div>
                            {formData.foodOption === "seafood-bbq" && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5">
                                {ctx(
                                  "food.seafoodLabel",
                                  "Deluxe Grilled Seafood BBQ",
                                )}
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.foodOption === "seafood-bbq" ? "text-slate-300" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "food.seafoodDesc",
                                  "Fresh local sea-bass, jumbo Andaman tiger prawns, local squids grilled on coal deck, served with hot garlic butter corn.",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Option 3: Royal Thai */}
                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              foodOption: "royal-thai",
                            }))
                          }
                          id="food-opt-thai"
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${
                            formData.foodOption === "royal-thai"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-40 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80"
                              alt="Royal Thai"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="text-[10px] uppercase font-bold text-amber-300 font-mono bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm shadow-sm border border-amber-300/20">
                                {ctx("food.thaiTag", "Phuket Special")}
                              </span>
                            </div>
                            {formData.foodOption === "royal-thai" && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5">
                                {ctx(
                                  "food.thaiLabel",
                                  "Royal Thai Cuisine Buffet",
                                )}
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.foodOption === "royal-thai" ? "text-slate-300" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "food.thaiDesc",
                                  "Signature southern crab curries, flavorful Tom Yum Goong shrimp soup, sweet mango sticky rice, and local stir-fried Pad Thai.",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Option 4: Western Fine Dining */}
                        <div
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              foodOption: "premium-western",
                            }))
                          }
                          id="food-opt-western"
                          className={`group rounded-sm border cursor-pointer select-none transition-all flex flex-col overflow-hidden ${
                            formData.foodOption === "premium-western"
                              ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg ring-2 ring-emerald-500 ring-offset-2"
                              : "bg-white text-[#0F172A] border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-40 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img
                              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80"
                              alt="Western Fine Dining"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute bottom-3 left-3 z-20">
                              <span className="text-[10px] uppercase font-bold text-white font-mono bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm shadow-sm border border-white/20">
                                {ctx("food.westernTag", "Elite Reserve")}
                              </span>
                            </div>
                            {formData.foodOption === "premium-western" && (
                              <div className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md border-2 border-white">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="text-[13px] font-bold uppercase tracking-wider font-sans mb-1.5">
                                {ctx(
                                  "food.westernLabel",
                                  "Western Fine Dining",
                                )}
                              </h5>
                              <p
                                className={`text-[11px] leading-relaxed line-clamp-3 ${formData.foodOption === "premium-western" ? "text-slate-300" : "text-slate-500"}`}
                              >
                                {ctx(
                                  "food.westernDesc",
                                  "Truffled Hokkaido sea scallops, chargrilled Australian black angus tenderloin, organic Caesar and premium dessert.",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 bg-white p-4 rounded-xs mt-4">
                      <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-3 text-slate-400 font-mono">
                        ~ Other Beverages ~
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {/* Wine Bottles */}
                        <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                              Wine Selection
                            </label>
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                              Select quantity for Red or White wine:
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                Red Wine (Bottles)
                              </label>
                              <select
                                value={formData.redWineBottles}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    redWineBottles: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] cursor-pointer"
                              >
                                <option value={0}>0 - None</option>
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1} Bottle{i > 0 ? "s" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                White Wine (Bottles)
                              </label>
                              <select
                                value={formData.whiteWineBottles}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    whiteWineBottles: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] cursor-pointer"
                              >
                                <option value={0}>0 - None</option>
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1} Bottle{i > 0 ? "s" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Beer Cartons */}
                        <div className="p-4 rounded-xs border border-slate-200/90 bg-white flex flex-col justify-between">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider font-sans mb-1">
                              Beer Cartons (24 Cans)
                            </label>
                            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                              Select up to 10 cartons:
                            </p>
                          </div>
                          <select
                            value={formData.beerCartons}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                beerCartons: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xs border border-slate-200 text-slate-800 text-xs focus:border-[#0F172A] cursor-pointer"
                          >
                            <option value={0}>0 - None</option>
                            {Array.from({ length: 10 }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} Carton{i > 0 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 8 && (
                  <>
                    {/* Guest Contact Information & Custom Pricing Generator */}
                    <div className="bg-[#FAF9F6] border border-[#0F172A]/15 p-5 md:p-6 rounded-xs shadow-xs space-y-6 mb-8 mt-12">
                      <div className="flex justify-between items-center border-b border-[#0F172A]/10 pb-3">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            Guest Contact Information{" "}
                            <span className="bg-[#0F172A] text-white px-2 py-0.5 rounded text-[9px] ml-2">
                              REQUIRED
                            </span>
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQRScanner(true)}
                          className="flex items-center gap-1.5 bg-[#0F172A] text-white border border-[#0F172A]/20 px-3 py-1.5 rounded-xs hover:bg-slate-800 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5" /> Scan VIP Booking
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1.5 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-[#0F172A]/60" />{" "}
                              Guest Rep. Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="booking-name-input"
                              type="text"
                              required
                              placeholder="e.g. Elena Mitchell"
                              value={formData.customerName || ""}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  customerName: e.target.value,
                                }));
                                localStorage.setItem(
                                  "phuket_copied_customer_name",
                                  e.target.value,
                                );
                              }}
                              className="w-full px-4 py-2.5 rounded-xs border border-[#0F172A]/20 text-slate-800 text-xs tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1.5 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-[#0F172A]/60" />{" "}
                              Phone / WhatsApp{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="booking-phone-input"
                              type="tel"
                              required
                              placeholder="e.g. +1 234 567 8900"
                              value={formData.customerPhone || ""}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  customerPhone: e.target.value,
                                }));
                                if (e.target.value) {
                                  localStorage.setItem(
                                    "phuket_copied_customer_contact",
                                    e.target.value,
                                  );
                                } else if (formData.customerEmail) {
                                  localStorage.setItem(
                                    "phuket_copied_customer_contact",
                                    formData.customerEmail,
                                  );
                                }
                              }}
                              className="w-full px-4 py-2.5 rounded-xs border border-[#0F172A]/20 text-slate-800 text-xs tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1.5 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-[#0F172A]/60" />{" "}
                              Email Address
                            </label>
                            <input
                              id="booking-email-input"
                              type="email"
                              placeholder="e.g. elena@example.com (Optional)"
                              value={formData.customerEmail || ""}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  customerEmail: e.target.value,
                                }));
                                if (!formData.customerPhone) {
                                  localStorage.setItem(
                                    "phuket_copied_customer_contact",
                                    e.target.value,
                                  );
                                }
                              }}
                              className="w-full px-4 py-2.5 rounded-xs border border-[#0F172A]/20 text-slate-800 text-xs tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs"
                            />

                            {/* Booking Reminder Opt-in */}
                            <div className="mt-2.5 flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xs border border-[#0F172A]/10">
                              <input
                                id="booking-reminder-opt-in"
                                type="checkbox"
                                checked={formData.optInReminder || false}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    optInReminder: e.target.checked,
                                  }))
                                }
                                className="mt-0.5 h-4 w-4 bg-white text-[#0F172A] border-slate-300 rounded-[2px] focus:ring-[#0F172A] cursor-pointer"
                              />
                              <label
                                htmlFor="booking-reminder-opt-in"
                                className="text-[10px] text-slate-600 leading-tight font-sans cursor-pointer select-none"
                              >
                                <span className="font-bold text-[#0F172A] uppercase tracking-wider block mb-0.5">
                                  Send a Booking Reminder
                                </span>
                                Opt-in to receive an automated
                                notification/email reminder 48 hours before
                                charter.
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1.5 flex items-center gap-1.5">
                              <span className="flex items-center gap-2 select-none">
                                <input
                                  type="checkbox"
                                  id="reg-opt-check"
                                  checked={wantToRegister}
                                  onChange={(e) =>
                                    setWantToRegister(e.target.checked)
                                  }
                                  className="h-4 w-4 bg-white text-emerald-600 border-slate-300 rounded-[2px] focus:ring-emerald-500 cursor-pointer"
                                />{" "}
                                <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-extrabold text-[#0F172A]">
                                  CREATE GUEST SYSTEM WORKSPACE (OPTIONAL)
                                </span>
                              </span>
                            </label>
                            <input
                              type="text"
                              placeholder={
                                wantToRegister
                                  ? "Choose a secure password (minimum 6 characters) *"
                                  : "Check the box above to register an account"
                              }
                              disabled={!wantToRegister}
                              value={wantToRegister ? registerPassword : ""}
                              onChange={(e) =>
                                setRegisterPassword(e.target.value)
                              }
                              className="w-full px-4 py-2.5 rounded-xs border border-[#0F172A]/20 text-slate-800 text-xs tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em] font-sans mb-1.5 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-[#0F172A]/60" />{" "}
                              Special Inquiries / Requests
                            </label>
                            <input
                              id="booking-special-input"
                              type="text"
                              placeholder="e.g. catering, scuba diving, sunset cake"
                              value={formData.specialRequests || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  specialRequests: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-2.5 rounded-xs border border-[#0F172A]/20 text-slate-800 text-xs tracking-wide focus:border-[#0F172A] focus:outline-hidden bg-white shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agent Toolkit: Custom Pricing Generator */}
                    {currentAgent &&
                      !isReferred &&
                      formData.charterDuration !== "overnight" && (
                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xs mt-4">
                          <h4 className="text-[11px] font-bold text-emerald-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" /> Manual Agency
                            Quotation Toolkit
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 font-sans">
                                Base Yacht Price
                              </label>
                              <input
                                type="number"
                                placeholder={`Standard: ${formatPrice(selectedVesselObj && activeRates[selectedVesselObj.id] ? (formData.charterDuration === "halfday" ? (formData.halfDaySlot === "sunset" ? activeRates[selectedVesselObj.id].sunset : activeRates[selectedVesselObj.id].halfday) : formData.charterDuration === "fullday" ? activeRates[selectedVesselObj.id].fullday : activeRates[selectedVesselObj.id].overnight * (formData.overnightDays || 1)) : 0)}`}
                                value={customAgentPrices.basePrice || ""}
                                onChange={(e) =>
                                  setCustomAgentPrices({
                                    ...customAgentPrices,
                                    basePrice: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xs text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 font-sans">
                                Food Catering Total
                              </label>
                              <input
                                type="number"
                                placeholder="Set custom or 0 for included"
                                value={customAgentPrices.foodPrice || ""}
                                onChange={(e) =>
                                  setCustomAgentPrices({
                                    ...customAgentPrices,
                                    foodPrice: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xs text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                              />
                            </div>

                            {/* Dynamic Addon Override Inputs */}
                            {[
                              {
                                id: "destinationSurcharge",
                                label: "Dest. Surcharge",
                                show: true,
                              },
                              {
                                id: "waterSlider",
                                label: "Slider Cost",
                                show: formData.addWaterSlider,
                              },
                              {
                                id: "inflatablePool",
                                label: "Pool Cost",
                                show: formData.addInflatablePool,
                              },
                              {
                                id: "cabinCount",
                                label: "AC Cabins",
                                show: formData.cabinCount > 0,
                              },
                              {
                                id: "gasBBQ",
                                label: "Gas BBQ",
                                show: formData.addGasBBQ,
                              },
                              {
                                id: "charcoalBBQ",
                                label: "Charcoal BBQ",
                                show: formData.addCharcoalBBQ,
                              },
                              {
                                id: "extraWatermelon",
                                label: "Extra Watermelon",
                                show: formData.extraWatermelon > 0,
                              },
                              {
                                id: "extraPineapple",
                                label: "Extra Pineapple",
                                show: formData.extraPineapple > 0,
                              },
                              {
                                id: "extraSnack",
                                label: "Extra Snack",
                                show: formData.extraSnack > 0,
                              },
                              {
                                id: "photographer",
                                label: "Photographer",
                                show: formData.addPhotographer,
                              },
                              {
                                id: "dj",
                                label: "Live DJ",
                                show: formData.addDJ,
                              },
                              {
                                id: "droneVideography",
                                label: "Drone Video",
                                show: formData.addDroneVideography,
                              },
                              {
                                id: "sashimi",
                                label: "Sashimi",
                                show: formData.addSashimi,
                              },
                              {
                                id: "redWine",
                                label: "Red Wine",
                                show: formData.redWineBottles > 0,
                              },
                              {
                                id: "whiteWine",
                                label: "White Wine",
                                show: formData.whiteWineBottles > 0,
                              },
                              {
                                id: "beer",
                                label: "Beer Cartons",
                                show: formData.beerCartons > 0,
                              },
                              {
                                id: "karaoke",
                                label: "Karaoke System",
                                show: formData.addKaraoke,
                              },
                              {
                                id: "parasailing",
                                label: "Parasailing",
                                show:
                                  formData.addParasailing &&
                                  formData.destinations.includes(
                                    "ko-he-north-banana-beach",
                                  ),
                              },
                              {
                                id: "bananaBoat",
                                label: "Banana Boat",
                                show:
                                  formData.addBananaBoat &&
                                  formData.destinations.includes(
                                    "ko-he-north-banana-beach",
                                  ),
                              },
                              {
                                id: "rubberCanoe",
                                label: "Rubber Canoe",
                                show:
                                  formData.addRubberCanoe &&
                                  formData.destinations.includes("ko-kalu-ok"),
                              },
                              {
                                id: "longtailBoat",
                                label: "Longtail Boat",
                                show: formData.addLongtailBoat,
                              },
                              {
                                id: "mayaBayTicketAndLongtail",
                                label: "Maya Bay/Longtail",
                                show: formData.addMayaBayTicketAndLongtail,
                              },
                              {
                                id: "jamesBondTicket",
                                label: "James Bond Ticket",
                                show: formData.addJamesBondTicket,
                              },
                              {
                                id: "jetski",
                                label: "Jet Ski Tour",
                                show:
                                  formData.addJetski &&
                                  (formData.destinations.includes(
                                    "koh-khai-nok",
                                  ) ||
                                    formData.destinations.includes(
                                      "koh-khai-nok-maithon",
                                    ) ||
                                    formData.destinations.includes(
                                      "naga-noi",
                                    ) ||
                                    formData.destinations.includes(
                                      "naga-yai",
                                    ) ||
                                    formData.destinations.includes(
                                      "koh-yao-yai-koh-hong-james-bond",
                                    )),
                              },
                              {
                                id: "minibusTransfer",
                                label: "Minibus Transfer",
                                show: formData.addMinibusTransfer,
                              },
                              {
                                id: "guide",
                                label: "Host Guide",
                                show: formData.guideLanguage !== "none",
                              },
                              {
                                id: "fishingGear",
                                label: "Fishing Gear",
                                show: formData.fishingRodsCount > 0,
                              },
                              {
                                id: "bartender",
                                label: "Bartender Service",
                                show: formData.addBartender,
                              },
                              {
                                id: "birthdayCake",
                                label: "Birthday Cake",
                                show: formData.addBirthdayCake,
                              },
                              {
                                id: "partyDecorations",
                                label: "Party Decorations",
                                show: formData.addPartyDecorations,
                              },
                              {
                                id: "champagne",
                                label: "Champagne",
                                show: formData.addChampagne,
                              },
                              {
                                id: "flowerBouquet",
                                label: "Flower Bouquet",
                                show: formData.addFlowerBouquet,
                              },
                              {
                                id: "fishingHandlines",
                                label: "Handlines",
                                show: formData.fishingHandlinesCount > 0,
                              },
                            ]
                              .filter((addon) => addon.show)
                              .map((addon) => (
                                <div key={addon.id}>
                                  <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 font-sans truncate">
                                    {addon.label}
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="Standard limit"
                                    value={
                                      customAgentPrices[addon.id] ||
                                      (currentAgent as any)?.priceList?.[
                                        addon.id
                                      ] ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setCustomAgentPrices({
                                        ...customAgentPrices,
                                        [addon.id]: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xs text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                                  />
                                </div>
                              ))}

                            <div className="col-span-1 border border-emerald-300 bg-emerald-100/30 p-2 rounded-xs flex flex-col justify-center">
                              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1 font-sans truncate">
                                Total Upgrades & Surcharges (Excl. Tax)
                              </label>
                              <div className="w-full text-xs font-mono font-bold text-emerald-900">
                                {priceCalculation.upgradesList
                                  .reduce((sum, u) => sum + u.price, 0)
                                  .toLocaleString()}{" "}
                                THB
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 font-sans truncate">
                                Misc Agent Fees
                              </label>
                              <input
                                type="number"
                                placeholder="Custom extra charges"
                                value={customAgentPrices.customMiscFee || ""}
                                onChange={(e) =>
                                  setCustomAgentPrices({
                                    ...customAgentPrices,
                                    customMiscFee: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xs text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 font-sans truncate">
                                Final Price Override
                              </label>
                              <input
                                type="number"
                                placeholder="Override total base price"
                                value={customAgentPrices.finalPrice || ""}
                                onChange={(e) =>
                                  setCustomAgentPrices({
                                    ...customAgentPrices,
                                    finalPrice: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-emerald-500 bg-emerald-50 rounded-xs text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                              />
                              <p className="text-[8px] text-slate-500 mt-1">
                                If set, replaces all above calculations (Tax
                                added on top).
                              </p>
                            </div>
                          </div>
                          {priceCalculation.total > 0 && (
                            <>
                              <div className="mt-4 pt-4 border-t border-emerald-200/60 pb-1">
                                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2 font-sans bg-emerald-100/50 inline-block px-2 py-0.5 rounded-sm">
                                  Included Breakdown
                                </div>
                                <div className="space-y-1.5 text-xs font-sans text-slate-700">
                                  <div className="flex justify-between items-center">
                                    <span className="truncate mr-4 flex-1">
                                      {formData.charterDuration === "halfday"
                                        ? formData.halfDaySlot === "afternoon"
                                          ? "Charter (Half Day Afternoon)"
                                          : formData.halfDaySlot === "sunset"
                                            ? "Charter (Promthep Sunset)"
                                            : "Charter (Half Day Morning)"
                                        : formData.charterDuration === "fullday"
                                          ? "Charter (Full Day)"
                                          : "Charter (Overnight)"}
                                    </span>
                                    <span className="font-mono font-semibold">
                                      {formatPrice(priceCalculation.basePrice)}
                                    </span>
                                  </div>
                                  {priceCalculation.foodPrice > 0 && (
                                    <div className="flex justify-between items-center">
                                      <span className="truncate mr-4 flex-1">
                                        Food & Catering (x{formData.guestCount})
                                      </span>
                                      <span className="font-mono font-semibold">
                                        {formatPrice(
                                          priceCalculation.foodPrice,
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {priceCalculation.upgradesList.length > 0 &&
                                    priceCalculation.upgradesList.map(
                                      (ug, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between items-center text-slate-600"
                                        >
                                          <span className="truncate ml-2 mr-4 flex-1 before:content-['└'] before:mr-1 before:text-slate-300 relative">
                                            {ug.name}
                                          </span>
                                          <span className="font-mono font-medium">
                                            {ug.price > 0
                                              ? formatPrice(ug.price)
                                              : "Free"}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-emerald-200/60 pb-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-200/50 px-2.5 py-1 rounded-sm">
                                    Final Generated Price:
                                  </span>
                                  <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-2 block">
                                      Incl. 7% Thailand VAT/GST
                                    </span>
                                    <span className="text-lg font-bold font-mono text-[#0F172A] tracking-tight">
                                      {formatPrice(
                                        priceCalculation.total +
                                          priceCalculation.total * 0.07,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    {/* Editorial Real-time Draft message Box */}
                    <div className="bg-[#FAF9F6] border border-[#0F172A]/15 rounded-xs p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-bold text-[#0F172A]/65 tracking-widest uppercase font-sans">
                          {t("form.draft.title") || "Generated Inquiry Text"}
                        </span>
                        <button
                          id="btn-copy-draft"
                          type="button"
                          onClick={copyToClipboard}
                          className="text-[10px] font-bold text-slate-800 hover:text-slate-900 font-sans cursor-pointer underline decoration-[#0F172A]/30 underline-offset-4"
                        >
                          {isCopied
                            ? t("form.draft.copied") || "✓ Copied to clipboard!"
                            : t("form.draft.copy") || "Copy message"}
                        </button>
                      </div>
                      <pre className="text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                        {generatedWhatsAppText}
                      </pre>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step Navigation Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8 gap-4">
              {formStep > 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormStep((prev) => prev - 1);
                    document
                      .getElementById("booking-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {formStep < 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    // Validation for current steps
                    if (formStep === 2) {
                      if (formData.destinations.length === 0) {
                        alert(
                          "Please select at least one route destination island to proceed.",
                        );
                        return;
                      }
                    }
                    if (formStep === 7) {
                      if (!formData.charterDate) {
                        alert(
                          "Please enter a valid booking date before proceeding.",
                        );
                        return;
                      }
                      if (!formData.departureTime) {
                        alert(
                          "Please specify a departure boarding time to proceed.",
                        );
                        return;
                      }
                    }
                    setFormStep((prev) => prev + 1);
                    document
                      .getElementById("booking-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-sans font-bold uppercase tracking-[0.2em] rounded-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  Next Step <ChevronRight className="h-4 w-4 text-amber-300" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFormStep(7);
                    document
                      .getElementById("booking-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Logistics
                </button>
              )}
            </div>
          </form>

          <RouteMapModal
            isOpen={!!routeModalData}
            onClose={() => setRouteModalData(null)}
            routeId={routeModalData?.id || ""}
            routeName={routeModalData?.name || ""}
          />

          {showPromoModal && promoData && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 text-white border border-slate-800 rounded-sm max-w-2xl w-full overflow-hidden text-center flex flex-col items-center p-6 space-y-4 shadow-2xl"
              >
                {/* Header with close action */}
                <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500 font-sans flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />{" "}
                    Exclusive Promotion Offer
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer transition-colors"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* Added Promotional Flyer Image */}
                <div className="w-full border border-slate-850 bg-black/40 rounded-sm p-1.5 flex items-center justify-center min-h-[320px] max-h-[65vh] overflow-hidden">
                  {promoData.flyerPhotoBase64 || promoData.photoBase64 ? (
                    <img
                      src={promoData.flyerPhotoBase64 || promoData.photoBase64}
                      alt="Special Offer Flyer"
                      className="max-h-[60vh] max-w-full object-contain rounded-xs"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 italic py-8">
                      No flyer option loaded yet. Choose this promotion to
                      apply.
                    </div>
                  )}
                </div>

                {/* Exclusive choice action and close button (Nothing else!) */}
                <div className="w-full flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPromoSelected(true);
                      setFormData((prev) => ({
                        ...prev,
                        charterDuration: "overnight",
                        specialRequests: prev.specialRequests.includes(
                          promoData.promoCode,
                        )
                          ? prev.specialRequests
                          : `[Selected Offer: ${promoData.promoCode}]\n${prev.specialRequests}`,
                      }));
                      setShowPromoModal(false);
                      const rangeInput = document.getElementById(
                        "booking-overnight-range",
                      );
                      if (rangeInput) {
                        rangeInput.scrollIntoView({ behavior: "smooth" });
                      } else {
                        const selector = document.getElementById(
                          "overnight-days-control",
                        );
                        if (selector)
                          selector.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold uppercase font-sans tracking-wide text-xs rounded-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span>🎁 Choose This Promo / Odaberi Ponudu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="px-5 py-3 border border-slate-700 bg-slate-850 hover:bg-slate-800 hover:border-slate-600 text-slate-300 font-sans text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
                  >
                    Close / Zatvori
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showDailyPromoModal && dailyPromoData && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 text-white border border-slate-800 rounded-sm max-w-2xl w-full overflow-hidden text-center flex flex-col items-center p-6 space-y-4 shadow-2xl"
              >
                {/* Header with close action */}
                <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 font-sans flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />{" "}
                    Exclusive Excursion Offer
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDailyPromoModal(false)}
                    className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer transition-colors"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* Added Promotional Flyer Image */}
                <div className="w-full border border-slate-850 bg-black/40 rounded-sm p-1.5 flex items-center justify-center min-h-[320px] max-h-[65vh] overflow-hidden">
                  {dailyPromoData.flyerPhotoBase64 ||
                  dailyPromoData.photoBase64 ? (
                    <img
                      src={
                        dailyPromoData.flyerPhotoBase64 ||
                        dailyPromoData.photoBase64
                      }
                      alt="Excursion Offer Flyer"
                      className="max-h-[60vh] max-w-full object-contain rounded-xs"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 italic py-8">
                      No flyer option loaded yet. Choose this promotion to
                      apply.
                    </div>
                  )}
                </div>

                {/* Exclusive choice action and close button */}
                <div className="w-full flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDailyPromoSelected(true);
                      setFormData((prev) => ({
                        ...prev,
                        charterDuration:
                          prev.charterDuration === "overnight"
                            ? "halfday"
                            : prev.charterDuration,
                        specialRequests: prev.specialRequests.includes(
                          dailyPromoData.promoCode,
                        )
                          ? prev.specialRequests
                          : `[Selected Offer: ${dailyPromoData.promoCode}]\n${prev.specialRequests}`,
                      }));
                      setShowDailyPromoModal(false);
                      const optHalf = document.getElementById(
                        "opt-duration-halfday",
                      );
                      if (optHalf)
                        optHalf.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold uppercase font-sans tracking-wide text-xs rounded-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span>🎁 Choose This Promo / Odaberi Ponudu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDailyPromoModal(false)}
                    className="px-5 py-3 border border-slate-700 bg-slate-850 hover:bg-slate-800 hover:border-slate-600 text-slate-300 font-sans text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
                  >
                    Close / Zatvori
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Interactive Lightbox View for Flyer Image */}
          {zoomImage && (
            <div
              onClick={() => setZoomImage(null)}
              className="fixed inset-0 z-[100] overflow-auto flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 cursor-zoom-out"
            >
              <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  className="absolute -top-12 right-0 text-white hover:text-slate-300 text-xs font-bold bg-white/15 hover:bg-white/25 px-3.5 py-1.5 rounded uppercase font-sans tracking-wider"
                >
                  Close Zoom ×
                </button>
                <img
                  src={zoomImage}
                  alt="Zoomed Flyer Attachment"
                  className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sticky Summary */}
      <div className="md:col-span-5 lg:col-span-4 space-y-6">
        <div className="sticky top-28 space-y-6">
          {/* Booking Summary Widget */}
          <div
            onClick={handleSummaryWidgetClick}
            className="rounded-xs border border-[#0F172A]/15 bg-white shadow-md p-6 cursor-pointer hover:border-emerald-600/40 hover:shadow-lg transition-all"
            title="Click anywhere on summary to open Live Inquiry Chat"
          >
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[#0F172A]/10 pb-2 flex items-center justify-between text-[#0F172A] font-sans">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Booking Summary
              </span>
            </h4>
            <div className="space-y-4">
              {/* Expandable Booking Details – flows downward naturally */}
              <div className="space-y-4 border-b border-slate-150 pb-3">
                {/* Vessel */}
                {selectedVesselObj && (
                  <div>
                    <ImageWithFallback
                      src={selectedVesselObj.image}
                      className="w-full h-32 object-cover rounded-sm mb-3 shadow-xs border border-slate-100"
                      alt={selectedVesselObj.name}
                    />
                    <div className="text-[10px] bg-[#0F172A] text-white inline-block px-2 py-0.5 rounded-xs font-bold tracking-widest mb-1 font-sans">
                      {selectedVesselObj.model}
                    </div>
                    <div className="font-serif italic text-lg text-[#0F172A] leading-tight">
                      {selectedVesselObj.name}
                    </div>
                    <div className="text-xs text-slate-500 font-sans mt-0.5">
                      {formData.charterDate || "Date pending"} •{" "}
                      {formData.guestCount} Guests
                    </div>

                    {isPromoSelected && promoData && (
                      <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-between text-amber-900">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-[10px] font-bold uppercase tracking-wider">
                              Promo Applied 🎁
                            </p>
                            <p className="text-[9.5px] text-amber-700 font-mono font-bold truncate">
                              {promoData.promoCode}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPromoSelected(false)}
                          className="text-[9px] text-amber-500 hover:text-amber-700 font-sans font-bold uppercase tracking-wider ml-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {isDailyPromoSelected && dailyPromoData && (
                      <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-between text-emerald-950">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-[10px] font-bold uppercase tracking-wider">
                              Promo Applied 🎁
                            </p>
                            <p className="text-[9.5px] text-emerald-800 font-mono font-bold truncate">
                              {dailyPromoData.promoCode}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDailyPromoSelected(false)}
                          className="text-[9px] text-emerald-600 hover:text-emerald-800 font-sans font-bold uppercase tracking-wider ml-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Route */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                      Route & Duration
                    </span>
                    {formData.destinations.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, destinations: [] }))
                        }
                        className="text-[9px] font-bold text-red-600 hover:text-red-700 font-sans cursor-pointer uppercase tracking-wider underline decoration-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 font-medium font-sans">
                    {formData.charterDuration === "halfday"
                      ? formData.halfDaySlot === "afternoon"
                        ? "Half Day Afternoon"
                        : formData.halfDaySlot === "sunset"
                          ? "Promthep Sunset"
                          : "Half Day Morning"
                      : formData.charterDuration === "fullday" ||
                          formData.charterDuration === "full-day"
                        ? "Full Day"
                        : `Overnight (${formData.overnightDays} days)`}
                    {formData.charterDuration === "overnight" &&
                      formData.cabinCount > 0 &&
                      ` • ${formData.cabinCount} Cabins`}
                    {` • Adults: ${formData.guestsAdults}, Kids: ${formData.guestsKids}`}
                  </div>
                  {formData.destinations.length > 0 && (
                    <>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-1 font-sans">
                        {getOrderedDestinations(formData.destinations).map(
                          (d) => (
                            <span
                              key={d.id}
                              className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-xs text-[10px] truncate"
                            >
                              {d.name}
                            </span>
                          ),
                        )}
                      </div>

                      {/* Off-screen map instance purely for PDF trajectory screenshot exports */}
                      <div className="absolute left-[-9999px] top-[-9999px] w-[640px] h-[240px] pointer-events-none">
                        <div
                          id="booking-summary-route-map"
                          className="w-full h-full"
                        >
                          <FreeMap
                            center={{ lat: 7.78, lng: 98.42 }}
                            zoom={9}
                            markers={bookingMapMarkers}
                            multiPaths={bookingMapPaths}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Contact & Logistics */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                      Contact & Logistics
                    </span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 font-sans">
                    <li className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                      <span className="leading-snug">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                          Rep:
                        </span>{" "}
                        {formData.customerName || (
                          <span className="text-red-500 font-bold">
                            Missing Info
                          </span>
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                      <span className="leading-snug">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                          Phone:
                        </span>{" "}
                        {formData.customerPhone || (
                          <span className="text-red-500 font-bold">
                            Missing Info
                          </span>
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                      <span className="leading-snug">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                          Embark:
                        </span>{" "}
                        {formData.departureTime || "09:00"}
                      </span>
                    </li>
                    {selectedPierObj && (
                      <li className="flex items-start gap-2">
                        <Anchor className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                        <span className="leading-snug">
                          <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                            Start Pier:
                          </span>
                          {ctx(
                            `piers.${selectedPierObj.id}.name`,
                            selectedPierObj.name,
                          )}
                        </span>
                      </li>
                    )}
                    {formData.endPierId && (
                      <li className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                        <span className="leading-snug">
                          <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                            Disembark Pier:
                          </span>
                          {ctx(
                            `piers.${formData.endPierId}.name`,
                            PIERS.find((p) => p.id === formData.endPierId)
                              ?.name || formData.endPierId,
                          )}
                        </span>
                      </li>
                    )}
                    {formData.specialRequests && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />
                        <span className="leading-snug">
                          <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider mr-1">
                            Inquiries:
                          </span>{" "}
                          <span className="italic">
                            {formData.specialRequests}
                          </span>
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Addons */}
                {allClientAmenities.length > 0 && (
                  <div className="pt-3 border-t border-[#0F172A]/10">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                        Selected Extras
                      </span>
                      <button
                        type="button"
                        onClick={handleClearExtras}
                        className="text-[9px] font-bold text-red-600 hover:text-red-700 font-sans cursor-pointer uppercase tracking-wider underline decoration-red-200"
                      >
                        Remove
                      </button>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 font-sans">
                      {allClientAmenities.map((amn, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />{" "}
                          <span className="leading-snug">{amn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Total (Using calculated price) */}
              {priceCalculation.total > 0 && currentAgent && !isReferred && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-500 font-bold font-sans">
                      Subtotal
                    </span>
                    <span className="text-xs text-slate-700 font-mono font-medium">
                      {formatPrice(priceCalculation.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-500 font-bold font-sans">
                      VAT (7%)
                    </span>
                    <span className="text-xs text-slate-700 font-mono font-medium">
                      {formatPrice(priceCalculation.total * 0.07)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                    <span className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A] font-sans">
                      Total Estimate
                    </span>
                    <span className="text-xl font-bold text-[#0F172A] font-mono tracking-tight">
                      {formatPrice(priceCalculation.total * 1.07)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CURRENCY SWITCHER PANEL */}
          <div className="bg-slate-50 border border-[#0F172A]/10 rounded-xs p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-sans">
                Display Currency
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-[#0F172A]/5 border border-[#0F172A]/10 p-0.5 rounded-xs justify-end w-full sm:w-auto">
              {[
                { code: "THB", label: "฿ THB" },
                { code: "USD", label: "$ USD" },
                { code: "EUR", label: "€ EUR" },
                { code: "RUB", label: "₽ RUB" },
              ].map((currItem) => (
                <button
                  key={currItem.code}
                  type="button"
                  title={`Switch pricing format to ${currItem.code}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrency(currItem.code as any);
                  }}
                  className={`flex-1 sm:flex-initial text-center px-3 py-1 font-sans text-[10px] font-bold rounded-xs transition-all cursor-pointer ${
                    currency === currItem.code
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
                  }`}
                >
                  {currItem.label}
                </button>
              ))}
            </div>
          </div>

          {formStep === 8 && (
            <div className="space-y-6">
              {/* Terms and Conditions Section */}
              <div
                id="terms-checkbox-container"
                className={`rounded-xs p-5 transition-all duration-300 border ${
                  termsError && !acceptedTerms
                    ? "bg-red-50/90 border-red-300 shadow-sm animate-pulse"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                {/* Language Selector for Terms & Conditions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-slate-200/60">
                  <span className="text-[10px] font-bold text-[#0F172A]/70 uppercase tracking-wider font-sans flex items-center gap-1.5 matches-onboard-rules-toggle-label">
                    <Languages className="h-3.5 w-3.5 text-[#0F172A]" />
                    Terms Language / Uvjeti / 条款
                  </span>
                  <div className="flex flex-wrap bg-white/60 border border-slate-200 rounded-sm p-0.5 gap-0.5 shadow-2xs select-none">
                    {(
                      Object.keys(termsTranslations) as Array<
                        keyof typeof termsTranslations
                      >
                    ).map((langCode) => {
                      const labels: Record<string, string> = {
                        en: "EN",
                        hr: "HR",
                        ru: "РУС",
                        hi: "हिन्दी",
                        zh: "中文",
                        th: "ไทย",
                      };
                      return (
                        <button
                          key={langCode}
                          type="button"
                          onClick={() => {
                            setTermsLang(langCode);
                          }}
                          className={`px-2 py-0.5 rounded-xs text-[9px] font-sans font-bold transition-all cursor-pointer ${
                            termsLang === langCode
                              ? "bg-[#0F172A] text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {labels[langCode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="pt-0.5">
                    <input
                      id="booking-terms-checkbox"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (e.target.checked) setTermsError(false);
                      }}
                      className="h-4.5 w-4.5 text-[#0F172A] border-slate-300 rounded-xs focus:ring-[#0F172A] cursor-pointer accent-[#0F172A]"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="booking-terms-checkbox"
                      className="block text-xs font-bold text-[#0F172A] font-sans select-none cursor-pointer text-left"
                    >
                      {termsTranslations[termsLang].label}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="text-[11px] text-slate-600 leading-relaxed font-sans space-y-1.5 text-left">
                      <p>{termsTranslations[termsLang].sub}</p>
                      <div className="bg-white/90 border border-amber-200 rounded-xs p-2.5 text-amber-950 font-medium shadow-2xs">
                        <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-800 mb-0.5">
                          {termsTranslations[termsLang].ruleHeader}
                        </span>
                        {termsTranslations[termsLang].ruleDetail}
                      </div>
                    </div>

                    {termsError && !acceptedTerms && (
                      <p className="text-[10px] text-red-600 font-semibold italic mt-1.5 flex items-center gap-1 text-left">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        {termsTranslations[termsLang].error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Embedded Onboard Rules underneath the acceptance checkbox */}
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                  <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2 whitespace-normal leading-relaxed text-left flex items-start gap-1">
                    <span className="text-amber-500 shrink-0">⚠️</span>
                    By checking the box above, you confirm that you have read
                    and agreed to the Safety Rules & Code of Conduct below:
                  </h5>
                  <OnboardRules />
                </div>
              </div>

              {/* Direct Action triggers */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-2`}>
                  {currentAgent && !isReferred ? (
                    <>
                      {/* Agent Mode Options */}

                      <button
                        id="btn-submit-whatsapp"
                        type="button"
                        onClick={handleWhatsAppAction}
                        className={`py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm col-span-1 md:col-span-1 ${
                          acceptedTerms
                            ? "bg-[#0F172A] text-white hover:bg-slate-800 hover:shadow-md"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 fill-current shrink-0" />
                        <span className="truncate">WhatsApp Client</span>
                      </button>

                      <button
                        id="btn-submit-email"
                        type="button"
                        onClick={handleEmailAction}
                        className={`py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm col-span-1 md:col-span-1 ${
                          acceptedTerms
                            ? "bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span className="truncate">Email Client</span>
                      </button>

                      <button
                        id="btn-submit-call"
                        type="button"
                        onClick={handleCallAction}
                        className={`py-3.5 px-2 rounded-xs border font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2 md:col-span-1 ${
                          acceptedTerms
                            ? "border-[#0F172A] text-[#0F172A] hover:bg-slate-50"
                            : "border-slate-200 text-slate-350 cursor-not-allowed"
                        }`}
                      >
                        <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Call Client</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Customer Mode - Multiple Agent Contact Options */}

                      {currentAgent?.whatsapp && (
                        <button
                          type="button"
                          onClick={handleWhatsAppAction}
                          className={`col-span-2 md:col-span-1 py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            acceptedTerms
                              ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">WhatsApp Agent</span>
                        </button>
                      )}

                      {currentAgent && (
                        <button
                          type="button"
                          id="btn-customer-chat-agent"
                          onClick={() => {
                            console.log(
                              "Agent chat button clicked. CurrentAgent:",
                              currentAgent,
                            );
                            if (!acceptedTerms) {
                              setTermsError(true);
                              alert(
                                "Please accept the terms and conditions checkbox (scroll up) to proceed.",
                              );
                              const element = document.getElementById(
                                "terms-checkbox-container",
                              );
                              if (element) {
                                element.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                              return;
                            }

                            if (!validateCustomerDetails()) return;

                            console.log(
                              `Customer clicked Chat with Agent in custom broker session. Agent online: ${isAgentOnline}. Triggering popup window.`,
                            );

                            localStorage.setItem(
                              "phuket_copied_inquiry_draft",
                              generatedWhatsAppText ||
                                `Dear ${currentAgent?.name || "Agent"}, I'm interested in chatting about a yacht charter booking.`,
                            );

                            window.dispatchEvent(
                              new CustomEvent("trigger-agent-chat-popup", {
                                detail: "new-chat-session",
                              }),
                            );
                          }}
                          className={`col-span-2 md:col-span-1 py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden ${
                            !acceptedTerms
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : isAgentOnline
                                ? "bg-emerald-600 text-white hover:bg-emerald-750 font-bold border border-emerald-550 shadow-emerald-100"
                                : "bg-rose-600 text-white hover:bg-rose-700 font-bold border border-rose-555 shadow-rose-100"
                          }`}
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-full mr-0.5 shrink-0 ${isAgentOnline ? "bg-green-300 animate-pulse" : "bg-rose-250 animate-ping"}`}
                          />
                          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            Chat with Agent:{" "}
                            {isAgentOnline ? "Online" : "Offline / Email"}
                          </span>
                        </button>
                      )}

                      {currentAgent?.lineId && (
                        <button
                          type="button"
                          onClick={handleLineAction}
                          className={`col-span-2 md:col-span-1 py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            acceptedTerms
                              ? "bg-[#00B900] text-white hover:bg-[#009900]"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">LINE Agent</span>
                        </button>
                      )}

                      {currentAgent?.wechatId && (
                        <button
                          type="button"
                          onClick={handleWechatAction}
                          className={`col-span-2 md:col-span-1 py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            acceptedTerms
                              ? "bg-[#07C160] text-white hover:bg-[#06AD56]"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">WeChat Agent</span>
                        </button>
                      )}

                      {currentAgent?.email && (
                        <button
                          type="button"
                          onClick={handleEmailAction}
                          className={`col-span-2 md:col-span-1 py-3.5 px-2 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            acceptedTerms
                              ? "bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          <span className="truncate">Email Agent</span>
                        </button>
                      )}

                      {!currentAgent?.whatsapp &&
                        !currentAgent?.lineId &&
                        !currentAgent?.wechatId &&
                        !currentAgent?.email && (
                          <button
                            id="btn-send-to-agent"
                            type="button"
                            onClick={handleSendToAgentAction}
                            className={`col-span-2 md:col-span-3 py-4 px-2 rounded-xs font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                              acceptedTerms
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <FileText className="h-4 w-4 fill-current shrink-0" />
                            <span className="truncate">
                              SEND TO AGENT (GENERATE PDF)
                            </span>
                          </button>
                        )}

                      {currentAgent && !isAgentOnline && (
                        <button
                          id="btn-send-offline-booking"
                          type="button"
                          onClick={() => {
                            if (!acceptedTerms) {
                              setTermsError(true);
                              const element = document.getElementById(
                                "terms-checkbox-container",
                              );
                              if (element) {
                                element.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                              return;
                            }
                            handleSendToAgentAction();
                            alert(
                              "Booking sent directly to your agent's secure workspace hub. They will review it once back online!",
                            );
                          }}
                          className={`col-span-2 md:col-span-3 py-4 px-2 my-1 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            acceptedTerms
                              ? "bg-slate-800 text-white border border-slate-700 hover:bg-slate-900"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-amber-500"
                          >
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                          </svg>
                          <span className="truncate">
                            Agent Offline: Send to Workspace Inbox
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <button
                  id="btn-export-pdf"
                  type="button"
                  onClick={() => {
                    if (!acceptedTerms) {
                      setTermsError(true);
                      const element = document.getElementById(
                        "terms-checkbox-container",
                      );
                      if (element) {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                      return;
                    }
                    generatePdfBrochure();
                  }}
                  className="w-full py-3.5 px-5 rounded-xs border border-[#0F172A] bg-emerald-50 text-[#0F172A] font-sans font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 shadow-sm"
                >
                  <Sparkles className="h-4 w-4 text-emerald-700 animate-pulse" />
                  {t("form.downloadPdf") || "Download Custom PDF Brochure"}
                </button>

                {!isReferred && (
                  <div className="text-center pt-2">
                    <a
                      id="link-terms-note"
                      href={`https://wa.me/${getNormalizedWhatsApp()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-450 hover:underline leading-none italic font-serif"
                    >
                      {t("form.speedBooking") ||
                        "Fast private charter booking via WhatsApp chat & direct voice call"}{" "}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {finalizedBookingReference && (
                <div className="mt-8 bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#0F172A] mb-2 font-sans text-center">
                    Mobile Booking Pass
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-5 text-center leading-relaxed max-w-xs">
                    Scan to save your charter details instantly. Present this
                    code for quick retrieval.
                  </p>
                  <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs ring-1 ring-slate-900/5">
                    <QRCodeSVG
                      value={finalizedBookingReference}
                      size={160}
                      level="Q"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      REF: {finalizedBookingReference.toUpperCase()}
                    </p>
                    <p className="text-[9px] font-sans font-bold text-emerald-600 tracking-widest uppercase">
                      Verified
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </div>

      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={async (decodedText) => {
            playSuccessChime();
            try {
              // 1. Try to parse as JSON first (legacy/QR generated locally)
              if (decodedText.startsWith("{") && decodedText.endsWith("}")) {
                const data = JSON.parse(decodedText);
                setFormData((prev) => ({
                  ...prev,
                  customerName:
                    data.name || data.customerName || prev.customerName,
                  customerPhone:
                    data.phone ||
                    data.customerPhone ||
                    data.contact ||
                    prev.customerPhone,
                  customerEmail:
                    data.email || data.customerEmail || prev.customerEmail,
                  hotelPickupLocation:
                    data.hotel ||
                    data.hotelPickupLocation ||
                    prev.hotelPickupLocation,
                }));
                alert("QR Code scanned successfully!");
                setShowQRScanner(false);
                return;
              }

              // 2. Treat as Booking Reference, Inquiry ID, or Customer ID
              // Let's check 'booking_requests' first
              const bookingRef = doc(db, "booking_requests", decodedText);
              const bookingSnap = await getDoc(bookingRef);
              if (bookingSnap.exists()) {
                const fbData = bookingSnap.data();
                setFormData((prev) => ({
                  ...prev,
                  customerName:
                    fbData.clientName ||
                    fbData.customerName ||
                    prev.customerName,
                  customerPhone:
                    fbData.customerPhone ||
                    fbData.contact ||
                    prev.customerPhone,
                  customerEmail:
                    fbData.customerEmail || fbData.email || prev.customerEmail,
                  hotelPickupLocation:
                    fbData.hotelPickupLocation ||
                    fbData.hotel ||
                    prev.hotelPickupLocation,
                }));
                alert("Booking reference matched! Customer details populated.");
                setShowQRScanner(false);
                return;
              }

              // Check 'inquiries' collection
              const inqRef = doc(db, "inquiries", decodedText);
              const inqSnap = await getDoc(inqRef);
              if (inqSnap.exists()) {
                const fbData = inqSnap.data();
                setFormData((prev) => ({
                  ...prev,
                  customerName: fbData.name || prev.customerName,
                  customerPhone: fbData.contact || prev.customerPhone,
                  customerEmail: fbData.email || prev.customerEmail,
                }));
                alert("Inquiry reference matched! Customer details populated.");
                setShowQRScanner(false);
                return;
              }

              // Check 'customers' collection
              const custRef = doc(db, "customers", decodedText);
              const custSnap = await getDoc(custRef);
              if (custSnap.exists()) {
                const fbData = custSnap.data();
                setFormData((prev) => ({
                  ...prev,
                  customerName: fbData.name || prev.customerName,
                  customerPhone: fbData.phone || prev.customerPhone,
                  customerEmail: fbData.email || prev.customerEmail,
                  hotelPickupLocation:
                    fbData.defaultHotel || prev.hotelPickupLocation,
                }));
                alert("Customer reference matched! Details populated.");
                setShowQRScanner(false);
                return;
              }

              // Fallback if not found in db
              setFormData((prev) => ({
                ...prev,
                customerPhone: decodedText,
              }));
              alert("Scanned QR code data as phone/contact.");
            } catch (e) {
              setFormData((prev) => ({
                ...prev,
                customerPhone: decodedText,
              }));
              alert("Scanned QR code data as phone/contact.");
            }
            setShowQRScanner(false);
          }}
        />
      )}
    </div>
  );
}
