import React, { useState, useEffect, useCallback } from "react";
import { CATAMARANS } from "../data";
import { generateItineraryPdf } from "../lib/pdfGenerator";
import {
  Anchor,
  Clock,
  Calendar,
  Users,
  ChevronRight,
  Check,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Compass,
  Sparkles,
  Moon,
} from "lucide-react";
import PasswordInput from "./PasswordInput";
import { useAgent } from "../AgentContext";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface BookingWizardProps {
  initialTitle?: string;
  onBookingSubmit?: (data: any) => void;
  mode: "guest" | "registered" | "agent";
}

export default function CharterBookingWizard({
  initialTitle,
  onBookingSubmit,
  mode,
}: BookingWizardProps) {
  const { currentAgent, logout, login: agentLogin, isReferred } = useAgent();
  const [step, setStep] = useState<WizardStep>(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dispatchAgentConfig, setDispatchAgentConfig] = useState<any | null>(
    null,
  );

  useEffect(() => {
    if (mode === "agent") {
      if (currentAgent) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } else if (mode === "registered") {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
          setGuestName(user.displayName || user.email?.split("@")[0] || "");
          setGuestEmail(user.email || "");
        } else {
          setIsLoggedIn(false);
        }
      });
      return () => unsub();
    } else {
      setIsLoggedIn(true); // guest needs no credentials
    }
  }, [mode, currentAgent]);

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    if (mode === "agent") {
      logout();
    } else if (mode === "registered") {
      await signOut(auth);
    }
    setStep(1);
    window.location.href = "/";
  };

  const handleModeLogin = async () => {
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    setIsLoggingIn(true);
    if (mode === "agent") {
      const res = agentLogin(username, password);
      if (res.success) {
        setIsLoggedIn(true);
      } else {
        alert(res.message || "Invalid credentials.");
      }
    } else if (mode === "registered") {
      try {
        await signInWithEmailAndPassword(auth, username, password);
        setIsLoggedIn(true);
      } catch (err: any) {
        alert("Login Failed: " + err.message);
      }
    }
    setIsLoggingIn(false);
  };

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestContact, setGuestContact] = useState("");

  const formatPhoneNumber = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, "");
    if (cleaned.length > 0 && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    const match = cleaned.match(/^(\+\d{1,3})(\d{0,4})(\d{0,5})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(" ");
    }
    if (cleaned.length > 4) {
      const cc = cleaned.slice(0, 3);
      const rest = cleaned
        .slice(3)
        .replace(/(.{4})/g, "$1 ")
        .trim();
      return `${cc} ${rest}`;
    }
    return cleaned;
  };

  const [agentRoutePrice, setAgentRoutePrice] = useState("");
  const [agentAddonsPrice, setAgentAddonsPrice] = useState("");
  const [agentItemizedPrices, setAgentItemizedPrices] = useState<
    Record<string, string>
  >({});

  const getDestKey = (destName: string) => {
    switch (destName) {
      case "Ko He (Coral Island)":
        return "destPrice_ko-he";
      case "Ko Racha Yai":
        return "destPrice_racha-yai";
      case "Ko Racha Noi":
        return "destPrice_racha-noi";
      case "Maithon Private Island":
        return "destPrice_maithon";
      case "Phi Phi Islands":
        return "destPrice_phi-phi";
      case "James Bond Island":
        return "destPrice_james-bond";
      case "Promthep Cape":
        return "destPrice_promthep";
      case "Koh Khai Nok":
        return "destPrice_koh-khai-nok";
      default:
        return `destPrice_${destName.replace(/\s+/g, "-").toLowerCase()}`;
    }
  };

  const getAddonKey = (addonName: string) => {
    switch (addonName) {
      case "Inflatable Sea Water Slider":
        return "waterSlider";
      case "Inflatable Ocean Swimming Pool":
        return "inflatablePool";
      case "Private Cabin Access":
        return "cabinCount";
      case "Gas Barbecue Grill":
        return "gasBBQ";
      case "Charcoal Barbecue Grill":
        return "charcoalBBQ";
      case "Extra Fresh Fruits & Snacks":
        return "extraSnack";
      case "On-Board Karaoke Entertainment System":
        return "karaoke";
      case "Private Longtail Boat Exploration":
        return "longtailBoat";
      case "Maya Bay Access Tickets & Longtail":
        return "mayaBayTicketAndLongtail";
      case "James Bond Island National Park Entry Ticket":
        return "jamesBondTicket";
      case "Jet Ski Tour":
        return "jetski";
      default:
        return addonName.replace(/\s+/g, "");
    }
  };

  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState("");
  const [embarkHour, setEmbarkHour] = useState("09:00");
  const [selectedPier, setSelectedPier] = useState("Chalong Pier");
  const [guestCount, setGuestCount] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [cabinCount, setCabinCount] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence: Save and Load Wizard Progress
  const WIZARD_PROGRESS_KEY = "charter_wizard_progress";

  useEffect(() => {
    const saved = localStorage.getItem(WIZARD_PROGRESS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.guestName) setGuestName(parsed.guestName);
        if (parsed.guestEmail) setGuestEmail(parsed.guestEmail);
        if (parsed.guestContact) setGuestContact(parsed.guestContact);
        if (parsed.agentRoutePrice) setAgentRoutePrice(parsed.agentRoutePrice);
        if (parsed.agentAddonsPrice)
          setAgentAddonsPrice(parsed.agentAddonsPrice);
        if (parsed.agentItemizedPrices)
          setAgentItemizedPrices(parsed.agentItemizedPrices);
        // if (parsed.selectedShip) setSelectedShip(parsed.selectedShip);
        if (parsed.selectedDuration)
          setSelectedDuration(parsed.selectedDuration);
        if (parsed.tripDate) setTripDate(parsed.tripDate);
        if (parsed.embarkHour) setEmbarkHour(parsed.embarkHour);
        if (parsed.selectedPier) setSelectedPier(parsed.selectedPier);
        if (parsed.guestCount) setGuestCount(parsed.guestCount);
        if (parsed.selectedDestinations)
          setSelectedDestinations(parsed.selectedDestinations);
        if (parsed.selectedAddons) setSelectedAddons(parsed.selectedAddons);
        if (parsed.cabinCount) setCabinCount(parsed.cabinCount);
        if (parsed.step) setStep(parsed.step);
      } catch (e) {
        console.error("Failed to load wizard progress", e);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      guestName,
      guestEmail,
      guestContact,
      agentRoutePrice,
      agentAddonsPrice,
      agentItemizedPrices,
      selectedShip,
      selectedDuration,
      tripDate,
      embarkHour,
      selectedPier,
      guestCount,
      selectedDestinations,
      selectedAddons,
      cabinCount,
      step,
    };
    localStorage.setItem(WIZARD_PROGRESS_KEY, JSON.stringify(dataToSave));
  }, [
    guestName,
    guestEmail,
    guestContact,
    agentRoutePrice,
    agentAddonsPrice,
    agentItemizedPrices,
    selectedShip,
    selectedDuration,
    tripDate,
    embarkHour,
    selectedPier,
    guestCount,
    selectedDestinations,
    selectedAddons,
    cabinCount,
    step,
  ]);

  const calculateAgentItemizedTotal = () => {
    let price = 0;
    if (mode !== "agent") return 0;

    selectedDestinations.forEach((dest) => {
      const key = getDestKey(dest);
      const val = parseFloat(
        agentItemizedPrices[key] !== undefined
          ? agentItemizedPrices[key]
          : (currentAgent as any)?.priceList?.[key] || "0",
      );
      if (!isNaN(val)) price += val;
    });

    selectedAddons.forEach((addon) => {
      const key = getAddonKey(addon);
      const val = parseFloat(
        agentItemizedPrices[key] !== undefined
          ? agentItemizedPrices[key]
          : (currentAgent as any)?.priceList?.[key] || "0",
      );
      if (!isNaN(val)) price += val;
    });

    return price;
  };

  // Sync itemized to route/addons price automatically when they change
  useEffect(() => {
    if (
      mode === "agent" &&
      (selectedDestinations.length > 0 || selectedAddons.length > 0)
    ) {
      let routeTotal = 0;
      selectedDestinations.forEach((dest) => {
        const key = getDestKey(dest);
        const val = parseFloat(
          agentItemizedPrices[key] !== undefined
            ? agentItemizedPrices[key]
            : (currentAgent as any)?.priceList?.[key] || "0",
        );
        if (!isNaN(val)) routeTotal += val;
      });

      let addonsTotal = 0;
      selectedAddons.forEach((addon) => {
        const key = getAddonKey(addon);
        const val = parseFloat(
          agentItemizedPrices[key] !== undefined
            ? agentItemizedPrices[key]
            : (currentAgent as any)?.priceList?.[key] || "0",
        );
        if (!isNaN(val)) addonsTotal += val;
      });

      if (routeTotal > 0 || agentRoutePrice === "")
        setAgentRoutePrice(routeTotal.toString());
      if (addonsTotal > 0 || agentAddonsPrice === "")
        setAgentAddonsPrice(addonsTotal.toString());
    }
  }, [
    selectedDestinations,
    selectedAddons,
    agentItemizedPrices,
    mode,
    currentAgent,
  ]);

  const durationOptions = [
    {
      id: "half-day-morning",
      label: "Half Day Morning",
      time: "08:30 – 13:00",
      desc: "Perfect high-visibility morning snorkelling",
    },
    {
      id: "half-day-afternoon",
      label: "Half Day Afternoon",
      time: "14:30 – 19:00",
      desc: "A relaxed afternoon sunset voyage",
    },
    {
      id: "half-day-sunset",
      label: "Promthep Sunset",
      time: "16:00 – 19:00",
      desc: "Experience a stunning sunset at Phromthep Cape",
    },
    {
      id: "full-day",
      label: "Full Day Cruise",
      time: "8–9 hours",
      desc: "Full Andaman experience with multiple island stops",
    },
    {
      id: "overnight",
      label: "Overnight Charter",
      time: "2+ days",
      desc: "Multi-day adventure with full board included",
    },
  ];

  const destinationOptions = [
    "Ko He (Coral Island)",
    "Ko Racha Yai",
    "Ko Racha Noi",
    "Maithon Private Island",
    "Phi Phi Islands",
    "James Bond Island",
    "Promthep Cape",
    "Koh Khai Nok",
  ];

  const pierOptions = ["Chalong Pier", "Coco Pier", "Ao Po Pier"];

  const addonOptions = [
    "Inflatable Sea Water Slider",
    "Inflatable Ocean Swimming Pool",
    "Private Cabin Access",
    "Gas Barbecue Grill",
    "Charcoal Barbecue Grill",
    "Extra Fresh Fruits & Snacks",
    "On-Board Karaoke Entertainment System",
    "Private Longtail Boat Exploration",
    "Maya Bay Access Tickets & Longtail",
    "James Bond Island National Park Entry Ticket",
    "Jet Ski Tour",
  ];

  const toggleDestination = (dest: string) => {
    setSelectedDestinations((prev) => {
      const newDests = prev.includes(dest)
        ? prev.filter((d) => d !== dest)
        : [...prev, dest];
      if (
        newDests.includes("James Bond Island") &&
        !prev.includes("James Bond Island")
      ) {
        setSelectedPier("Ao Po Pier");
        setEmbarkHour("09:00");
      }
      return newDests;
    });
  };

  const toggleAddon = (addon: string) => {
    if (
      addon === "Jet Ski Tour" &&
      !selectedDestinations.includes("Koh Khai Nok")
    ) {
      alert("Jet Ski Tour is only available if Koh Khai Nok is selected.");
      return;
    }
    setSelectedAddons((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon],
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedShip) {
      const selectedShipData = CATAMARANS.find((c) => c.id === selectedShip);
      if (selectedShipData?.isPrivateCharter) {
        setStep(4);
        return;
      }
    }
    if (step === 3) {
      if (selectedDestinations.length === 0) {
        alert("Please select at least one route destination stop to proceed.");
        return;
      }
    }
    if (step === 5) {
      if (selectedDestinations.includes("James Bond Island")) {
        const hour = parseInt(embarkHour.split(":")[0]);
        if (hour !== 8 && hour !== 9) {
          alert(
            "For James Bond Island, embark time must be at 08:00 or 09:00 AM (Trip duration ~12-13 hours total). Please adjust.",
          );
          return;
        }
      }
    }
    if (step < 6) setStep((prev) => (prev + 1) as WizardStep);
  };

  const handlePrev = useCallback(() => {
    if (step === 4 && selectedShip) {
      const selectedShipData = CATAMARANS.find((c) => c.id === selectedShip);
      if (selectedShipData?.isPrivateCharter) {
        setStep(1);
        return;
      }
    }
    if (step > 1) setStep((prev) => (prev - 1) as WizardStep);
  }, [step, selectedShip]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we are at step > 1, prevent browser back and go to prev step
      if (step > 1) {
        event.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step, handlePrev]);
  
  useEffect(() => {
    // Push new state when step changes
    window.history.pushState({ step }, `Step ${step}`);
  }, [step]);

  const handleGeneratePdf = async () => {
    if (mode === "guest") {
      if (!guestName || !guestEmail || !guestContact) {
        alert("Please enter full name, email, and contact number.");
        return;
      }
    }
    if (mode === "agent") {
      if (!isLoggedIn || !agentRoutePrice || !guestName || !guestEmail) {
        alert("Please login, enter route price, and customer details.");
        return;
      }
    }
    if (mode === "registered") {
      if (!guestName || !guestEmail || !guestContact) {
        alert("Please enter full name, email, and contact number.");
        return;
      }
    }

    if (selectedDestinations.length === 0) {
      alert("Please select at least one route destination.");
      return;
    }

    if (!selectedShip) {
      alert("Please select a vessel.");
      return;
    }

    setIsGenerating(true);
    try {
      const selectedShipData = CATAMARANS.find((c) => c.id === selectedShip);

      let base64Img: string | null = null;
      if (selectedShipData?.image) {
        try {
          const { imgToBase64 } = await import("../lib/imageUtils");
          base64Img = await imgToBase64(selectedShipData.image);
        } catch (imgErr) {
          console.warn(
            "Failed converting vessel image inside booking wizard:",
            imgErr,
          );
        }
      }

      const routePriceNum = parseFloat(agentRoutePrice) || 0;
      const addonsPriceNum = parseFloat(agentAddonsPrice) || 0;
      const taxAmountNum = (routePriceNum + addonsPriceNum) * 0.07;
      const totalIncTaxNum = routePriceNum + addonsPriceNum + taxAmountNum;
      const agentPriceStr = totalIncTaxNum > 0 ? totalIncTaxNum.toString() : "";

      const itineraryData = {
        recommendedVesselId: selectedShip || "",
        vesselReasoning: "Selected during booking wizard phase.",
        recommendedPierId: selectedPier || "Chalong Pier",
        routeTitle: "Charter Voyage",
        fullDescription: `A luxurious charter voyage.\nDate: ${tripDate || "TBA"} • Boarding Time: ${embarkHour}\nDuration: ${selectedDuration || "Full Day"}\nAdd-ons: ${selectedAddons.length ? selectedAddons.join(", ") : "None"}.`,
        stops: selectedDestinations.map((dest) => ({
          destinationId: dest,
          name: dest,
          activity: "Sightseeing and Swimming",
          durationHours: 2,
          timeOfDay: "Flexible",
        })),
        totalEstimatedHours:
          selectedDuration === "half-day"
            ? 4
            : selectedDuration === "full-day"
              ? 8
              : 24,
        insiderTips: selectedAddons,
        bookingReference: "WIZ-" + Math.floor(Math.random() * 900000 + 100000),
        agentName:
          mode === "agent" && currentAgent ? currentAgent.name : undefined,
        customerName: guestName,
        customerPhone: guestContact,
        customerEmail: guestEmail,
        charterDate: tripDate || new Date().toISOString().split("T")[0],
        guestCount: guestCount || "1",
        duration: selectedDuration || "full-day",
        cabinCount: cabinCount,
        vesselSpecs: selectedShipData
          ? {
              length: selectedShipData.length,
              capacity: selectedShipData.capacity,
              cabins: selectedShipData.cabins,
              bathrooms: selectedShipData.bathrooms,
            }
          : undefined,
        vesselImageBase64: base64Img || undefined,
        vesselNameText: selectedShipData?.name || selectedShip || undefined,
        // Only pass prices on the PDF structure if user mode is strictly agent!
        agentPriceStr: mode === "agent" ? agentPriceStr : undefined,
        routePriceNum: mode === "agent" ? routePriceNum : undefined,
        addonsPriceNum: mode === "agent" ? addonsPriceNum : undefined,
        taxAmountNum: mode === "agent" ? taxAmountNum : undefined,
        totalIncTaxNum: mode === "agent" ? totalIncTaxNum : undefined,
      };

      const pdfDoc = generateItineraryPdf(itineraryData);
      const pdfBase64 = pdfDoc.output("datauristring");
      pdfDoc.save(`Booking_${selectedShip}_${guestName || "Guest"}.pdf`);

      const randomRef = itineraryData.bookingReference;
      const newProposal = {
        id: randomRef,
        clientName: guestName || "Fast Booking Customer",
        charterDate: tripDate || new Date().toISOString().split("T")[0],
        vesselId1: selectedShip,
        vesselId2: selectedShip,
        vesselId3: "",
        price1: mode === "agent" ? agentPriceStr : "",
        routePrice: mode === "agent" ? routePriceNum : 0,
        addonsPrice: mode === "agent" ? addonsPriceNum : 0,
        taxAmount: mode === "agent" ? taxAmountNum : 0,
        totalIncTax: mode === "agent" ? totalIncTaxNum : 0,
        price2: "",
        price3: "",
        compareCount: 1,
        createdAt: new Date().toISOString().split("T")[0],
        agentEmail:
          mode === "agent" && currentAgent ? currentAgent.email : null,
        customerPhone: guestContact,
        customerEmail: guestEmail,
        customerUid:
          mode === "registered" && auth.currentUser
            ? auth.currentUser.uid
            : null,
        hotelPickupLocation: "",
        termsAccepted: termsAccepted,
        termsAcceptedTimestamp: new Date().toISOString(),
        pdfBase64: pdfBase64,
        bookingType: mode,
        folderName:
          mode === "guest"
            ? "unregistered customer req"
            : mode === "registered"
              ? `registered customer / ${guestName} (${guestEmail})`
              : `agents / ${currentAgent?.name || username}`,
      };

      try {
        const addDocPromise = addDoc(collection(db, "booking_requests"), {
          ...newProposal,
          timestamp: serverTimestamp(),
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000),
        );
        await Promise.race([addDocPromise, timeoutPromise]);

        if (mode === "registered" && auth.currentUser) {
          const customerRef = doc(db, "customers", auth.currentUser.uid);
          await updateDoc(customerRef, {
            manifests: arrayUnion({
              date: new Date().toISOString(),
              pdfBase64,
              ref: randomRef,
            }),
          }).catch((e) =>
            console.warn("Could not save to customer manifests", e),
          );
        }
      } catch (e) {
        console.warn("Could not save proposal to Firestore, moving on...", e);
      }

      const targetAgentName =
        isReferred && currentAgent ? currentAgent.name : "Representative";
      const targetAgentEmail =
        isReferred && currentAgent && currentAgent.email
          ? currentAgent.email.toLowerCase().trim()
          : "booking@phuketcharter.com";
      const targetAgentId =
        isReferred && currentAgent
          ? currentAgent.id ||
            currentAgent.uid ||
            (currentAgent.email
              ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
              : "unassigned")
          : "unassigned";

      const targetAgentWhatsApp =
        isReferred && currentAgent
          ? currentAgent.whatsapp || ""
          : "66636368287";
      const targetAgentLine =
        isReferred && currentAgent ? currentAgent.lineId || "" : "";
      const targetAgentWeChat =
        isReferred && currentAgent ? currentAgent.wechatId || "" : "";
      const targetAgentPhone =
        isReferred && currentAgent
          ? currentAgent.contactPhone || ""
          : "+66636368287";

      const inquiryId = `inq_${Date.now()}_fast_${Math.floor(Math.random() * 9000)}`;

      const shipData = CATAMARANS.find((c) => c.id === selectedShip);
      const shipName = shipData ? shipData.name : "Charter Voyage";
      const routeText =
        selectedDestinations.length > 0
          ? selectedDestinations.join(" & ")
          : "None Selected";

      const summaryText = `Fast Booking inquiry submitted for ${shipName} on ${tripDate || "TBA"} at ${embarkHour || "TBA"}. Route: ${routeText}. Duration: ${selectedDuration || "Full Day"}. Guests: ${guestCount || "1"}. Add-ons: ${selectedAddons.length ? selectedAddons.join(", ") : "None"}.`;

      const priceTextForMessage =
        mode === "agent"
          ? `\n• Total Price: ${agentPriceStr || "TBA"} THB`
          : "";

      const textMessage =
        `Dear ${targetAgentName},\n\nI have generated a yacht charter inquiry via your Fast Booking System:\n\n` +
        `• Reference: ${randomRef}\n` +
        `• Customer: ${guestName || "Guest"}\n` +
        `• Vessel: ${shipName}\n` +
        `• Date: ${tripDate || "TBA"} (${embarkHour || "TBA"})\n` +
        `• Route/Destinations: ${routeText}\n` +
        `• Duration: ${selectedDuration || "Full Day"}\n` +
        `• Guests: ${guestCount || "1"} pax\n` +
        `• Add-ons: ${selectedAddons.length ? selectedAddons.join(", ") : "None"}${priceTextForMessage}\n\n` +
        `Please confirm availability. Thank you!`;

      const agentInquiryPayload = {
        id: inquiryId,
        name: guestName || "Fast Booking Guest",
        contact: guestContact || guestEmail || "No contact",
        email: guestEmail || "",
        message: summaryText,
        brokerId: targetAgentId,
        brokerEmail: targetAgentEmail,
        vesselId: selectedShip || "none",
        vesselName: shipName,
        isRead: false,
        createdAt: new Date().toISOString(),
        folder: "Fast Bookings",
        chatHistory: [
          {
            id: `msg_summary_${Date.now()}`,
            sender: "client",
            text: `📝 Fast Booking Summary for ${shipName}`,
            createdAt: new Date().toISOString(),
            isBookingSummary: true,
            bookingDetails: {
              vesselName: shipName,
              vesselModel: selectedShipData
                ? selectedShipData.model
                : "Catamaran",
              charterDate: tripDate || "TBA",
              guestCount: guestCount || "1",
              charterDuration: selectedDuration || "Full Day",
              totalPrice: mode === "agent" ? parseFloat(agentPriceStr) || 0 : 0,
              excursionRoute: routeText,
              amenities: selectedAddons,
            },
          },
          {
            id: `msg_text_${Date.now() + 1}`,
            sender: "client",
            text: textMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      try {
        await setDoc(doc(db, "inquiries", inquiryId), agentInquiryPayload);
      } catch (err) {
        console.warn("Failed to write broker inquiry duplicate", err);
      }

      if (targetAgentId !== "unassigned") {
        const adminInquiryId = `${inquiryId}_admin_incognito`;
        const adminInquiryPayload = {
          ...agentInquiryPayload,
          id: adminInquiryId,
          brokerId: "admin_incognito",
          brokerEmail: "admin_incognito",
          isIncognito: true,
          folder: "Incognito Inbox",
          chatHistory: [
            ...agentInquiryPayload.chatHistory,
            {
              id: `msg_admin_notif_${Date.now()}`,
              sender: "client",
              text: `[INCOGNITO SUBMISSION TO ADMIN]\n\nAn inquiry was submitted to representative ${targetAgentName} (${targetAgentEmail}):\n\n${textMessage}`,
              createdAt: new Date().toISOString(),
            },
          ],
        };

        try {
          await setDoc(
            doc(db, "inquiries", adminInquiryId),
            adminInquiryPayload,
          );
        } catch (err) {
          console.warn("Failed to write admin inquiry duplicate", err);
        }
      }

      setDispatchAgentConfig({
        bookingReference: randomRef,
        pdfBase64: pdfBase64,
        agentName: targetAgentName,
        agentEmail: targetAgentEmail,
        whatsApp: targetAgentWhatsApp,
        lineId: targetAgentLine,
        wechatId: targetAgentWeChat,
        phone: targetAgentPhone,
        messageText: textMessage,
      });

      localStorage.setItem("phuket_charter_active_chat_id", inquiryId);
      localStorage.removeItem(WIZARD_PROGRESS_KEY); // clear quick-save progress on successful submit
      window.dispatchEvent(
        new CustomEvent("trigger-agent-chat-popup", { detail: inquiryId }),
      );

      alert(
        "Your Fast Booking Inquiry has been successfully generated & saved!",
      );

      if (onBookingSubmit) {
        onBookingSubmit({
          selectedShip,
          tripDate,
          guestCount,
          mode,
          guestName,
          guestEmail,
          guestContact,
          agentPrice: mode === "agent" ? agentPriceStr : "",
        });
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to generate PDF: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (dispatchAgentConfig) {
    const copyMessageToClipboard = () => {
      navigator.clipboard.writeText(dispatchAgentConfig.messageText);
      alert("Booking enquiry message text successfully copied to clipboard!");
    };

    return (
      <div className="w-full bg-[#030d12] border border-slate-800 rounded-lg p-6 sm:p-8 text-left font-sans">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">
              Inquiry Compiled & Saved!
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Reference ID:{" "}
              <strong className="font-mono text-[#00a2b8] uppercase">
                {dispatchAgentConfig.bookingReference}
              </strong>
            </p>
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-5 mb-6 text-slate-300 space-y-2">
          <p className="text-xs leading-relaxed">
            Your customized itinerary PDF has been successfully generated and
            compiled. A duplicate copy has been{" "}
            <strong className="text-emerald-400">
              automatically synchronized & saved
            </strong>{" "}
            directly in representative{" "}
            <strong className="text-white">
              {dispatchAgentConfig.agentName}
            </strong>
            's inquiries folder, as well as logged anonymously with the central
            administrator.
          </p>
          <p className="text-[10px] text-emerald-400">
            📁 Saved folder:{" "}
            <strong className="underline font-bold">
              Inboxes / Fast Bookings
            </strong>
          </p>
        </div>

        <div className="border border-slate-800/80 rounded-lg p-4 bg-[#061219] mb-6">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Drafted Inquiry Message
            </span>
            <button
              onClick={copyMessageToClipboard}
              className="text-[9px] text-[#00a2b8] hover:text-[#00b8d1] font-semibold flex items-center gap-1 cursor-pointer transition-colors animate-pulse"
            >
              Copy Text
            </button>
          </div>
          <pre className="text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap select-all max-h-40 overflow-y-auto w-full max-w-full block scrollbar-thin">
            {dispatchAgentConfig.messageText}
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            DIRECT CHANNEL DISPATCH DESKS
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 leading-normal">
            To complete booking confirmation, choose your preferred registered
            channel below to send your quotation direct to our session broker:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dispatchAgentConfig.whatsApp && (
              <a
                href={`https://wa.me/${dispatchAgentConfig.whatsApp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(dispatchAgentConfig.messageText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-500 group-hover:text-white" />
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Send on WhatsApp
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-emerald-100 font-mono mt-0.5">
                      {dispatchAgentConfig.whatsApp}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </a>
            )}

            {dispatchAgentConfig.lineId && (
              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(dispatchAgentConfig.messageText + "\n\n(LINE ID: " + dispatchAgentConfig.lineId + ")")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-green-500/10 border border-green-500/20 hover:bg-green-600 hover:text-white text-green-400 rounded-lg flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform text-green-500 group-hover:text-white" />
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Send on LINE
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-[#dbfbeb] font-mono mt-0.5">
                      ID: {dispatchAgentConfig.lineId}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </a>
            )}

            {dispatchAgentConfig.agentEmail && (
              <a
                href={`mailto:${dispatchAgentConfig.agentEmail}?subject=Yacht Charter Inquiry - Ref: ${dispatchAgentConfig.bookingReference}&body=${encodeURIComponent(dispatchAgentConfig.messageText)}`}
                className="p-3.5 bg-cyan-600/10 border border-cyan-500/20 hover:bg-cyan-600 hover:text-white text-cyan-400 rounded-lg flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 group-hover:scale-110 transition-transform text-cyan-500 group-hover:text-white" />
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Send via Email
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-[#daf8ff] font-sans mt-0.5">
                      {dispatchAgentConfig.agentEmail}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </a>
            )}

            {dispatchAgentConfig.phone && (
              <a
                href={`tel:${dispatchAgentConfig.phone}`}
                className="p-3.5 bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600 hover:text-white text-amber-400 rounded-lg flex items-center justify-between transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-500 group-hover:text-white" />
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Direct Hotline / Call
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-[#fff5da] font-mono mt-0.5">
                      {dispatchAgentConfig.phone}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </a>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800/85">
          <button
            onClick={() => {
              setDispatchAgentConfig(null);
              setStep(1);
              if (onBookingSubmit) {
                onBookingSubmit(null);
              }
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Close & Exit Desk
          </button>
        </div>
      </div>
    );
  }

  // Under Authorized-only modes, show secure Login Interface if they are not certified yet
  if (mode !== "guest" && !isLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#030d12] border border-slate-800 rounded-xl p-6 sm:p-8 font-sans text-slate-300 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#E58c40]/10 border border-[#E58c40]/30 flex items-center justify-center mx-auto mb-3 text-[#E58c40]">
            <Anchor className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-serif text-2xl text-slate-100 font-medium tracking-tight">
            {mode === "agent" ? "Agent Portal" : "Customer Workspace"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
            Secure Entry Verification Required
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Username or Email Address
            </label>
            <input
              type="text"
              placeholder="Enter your credential email"
              value={username}
              className="w-full bg-[#061219] border border-slate-800 focus:border-[#00a2b8]/60 text-slate-200 p-3 rounded text-[13px] outline-none"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Secure Password
            </label>
            <PasswordInput
              placeholder="••••••••••••"
              className="bg-[#061219] border-slate-800 focus:border-[#00a2b8]/60 text-slate-200 p-3 rounded text-[13px] outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleModeLogin}
            disabled={isLoggingIn}
            className="w-full bg-[#00a2b8] hover:bg-[#00b8d1] text-white p-3 rounded text-xs font-bold uppercase tracking-widest transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            {isLoggingIn
              ? "Authenticating Session..."
              : "SECURE LOGIN & ACCESS"}{" "}
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode === "registered") {
                window.location.href =
                  "/?workspace=customer&customer-portal=true";
              } else if (mode === "agent") {
                window.location.href = "/?agent-portal=true";
              } else {
                window.location.href = "/";
              }
            }}
            className="w-full border border-slate-800 hover:bg-slate-900 hover:text-white text-slate-400 p-3 rounded text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            {mode === "registered"
              ? "Cancel & Back to Customer Dashboard Workspace"
              : "Cancel & Exit Portal"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto shadow-2xl rounded-t-lg overflow-hidden animate-in fade-in duration-500 fill-mode-both">
      {/* Permanent Authorization Header at the very top of the card - matches requirement */}
      <div className="w-full bg-[#061219] border-t border-x border-slate-800/80 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isLoggedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
          />
          <div className="text-[11px] font-sans">
            <span className="text-slate-500 uppercase tracking-widest font-black mr-1.5 text-[9px]">
              Portal Status:
            </span>
            <strong className="text-slate-200">
              {mode === "agent"
                ? `Broker Desk (Active Agent: ${currentAgent?.name || "Representative"})`
                : mode === "registered"
                  ? `Registered Customer Portal (${guestEmail || auth.currentUser?.email})`
                  : "Guest Walk-In Session"}
            </strong>
          </div>
        </div>

        {(mode === "agent" || mode === "registered") && isLoggedIn && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mode === "registered") {
                  window.location.href =
                    "/?workspace=customer&customer-portal=true";
                } else if (mode === "agent") {
                  window.location.href = "/?agent-portal=true";
                } else {
                  window.location.href = "/";
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 text-[11px] font-bold rounded transition-colors uppercase tracking-wider font-mono cursor-pointer"
            >
              {mode === "registered"
                ? "Back to Customer Dashboard Workspace"
                : "Back to Workspace"}
            </button>
            <button
              onClick={handleLogout}
              className="bg-[#e11d48]/10 text-[#f43f5e] border border-[#f43f5e]/20 hover:bg-[#e11d48] hover:text-white px-3 py-1.5 text-[11px] font-bold rounded transition-colors uppercase tracking-wider font-mono cursor-pointer"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      <div className="flex bg-[#0a151d] border-b border-slate-800/80 border-x relative text-slate-400">
        {[
          { num: 1, label: "Vessel", icon: Anchor },
          { num: 2, label: "Duration", icon: Clock },
          { num: 3, label: "Route", icon: Compass },
          { num: 4, label: "Upgrades", icon: Sparkles },
          { num: 5, label: "Details", icon: Calendar },
          { num: 6, label: "Confirm", icon: Users },
        ].map((t) => (
          <button
            key={t.num}
            onClick={() => {
              if (t.num < step) {
                setStep(t.num as WizardStep);
              } else if (t.num > step) {
                // Only allow progression if current step is met
                const canProceed =
                  (step === 1 && selectedShip) ||
                  (step === 2 && selectedDuration) ||
                  (step === 3 && selectedDestinations.length > 0) ||
                  (step === 4) ||
                  (step === 5);

                if (canProceed) {
                  setStep(t.num as WizardStep);
                }
              }
            }}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all outline-none border-b-2
                  ${step === t.num ? "border-[#E58c40] text-slate-100 bg-[#0c1a24]" : "border-transparent hover:bg-slate-800/30"}
                  ${t.num < step ? "cursor-pointer text-[#00a2b8]" : t.num > step ? "cursor-default opacity-60" : ""}
                `}
          >
            <t.icon
              className={`w-4 h-4 ${step === t.num ? "text-slate-100" : ""}`}
            />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#030d12] border-x border-b border-slate-800/80 rounded-b-lg p-6 sm:p-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="font-serif text-xl text-slate-100 mb-6 font-medium">
              01. Select Your Vessel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CATAMARANS.map((ship) => (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShip(ship.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col items-start gap-4 ${
                    selectedShip === ship.id
                      ? "border-[#00a2b8] bg-[#0a1824] ring-1 ring-[#00a2b8]/20 md:hover:border-[#00b8d1]"
                      : "border-[#1e293b] bg-[#061219] hover:border-slate-600"
                  }`}
                >
                  <div className="w-full relative h-24 overflow-hidden rounded-md border border-slate-800/80">
                    <img
                      src={
                        ship.image ||
                        "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={ship.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    {selectedShip === ship.id && (
                      <div className="absolute top-2 right-2 bg-[#00a2b8] text-white p-1 rounded-full shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="w-full flex-1">
                    <p className="text-[9px] uppercase tracking-widest text-[#E58c40] mb-1.5 font-bold opacity-90">
                      {ship.model}
                    </p>
                    <h3 className="font-serif text-xl text-slate-100 mb-2 leading-tight">
                      {ship.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
                        <button
                type="button"
                onClick={() => {
                  if (!selectedShip) {
                    alert("Please select a ship first.");
                    return;
                  }
                  setSelectedDuration("overnight");
                  setStep(3);
                }}
                className="mt-6 w-full py-4 bg-[#E58c40]/10 border border-[#E58c40]/30 hover:bg-[#E58c40]/20 text-[#E58c40] rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Moon className="w-4 h-4" />
                Continue planning overnight trip
              </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="font-serif text-xl text-slate-100 mb-6 font-medium">
              02. Choose Charter Duration
            </h2>
            <div className="space-y-4">
              {durationOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedDuration(opt.id)}
                  className={`p-5 rounded-lg border cursor-pointer transition-all ${
                    selectedDuration === opt.id
                      ? "border-[#00a2b8] bg-[#0a1824] ring-1 ring-[#00a2b8]/20"
                      : "border-[#1e293b] bg-[#061219] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <h3 className="font-bold text-[15px] text-slate-100 tracking-wide">
                      {opt.label}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E58c40]/10 text-[#E58c40] border border-[#E58c40]/20">
                      {opt.time}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-400 font-light leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div>
              <h2 className="font-serif text-xl text-slate-100 mb-2 font-medium">
                03. Select Cruise Route
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Select the islands or destinations you wish to include in your
                tailor-made catamaran itinerary. (At least one stop is required
                to continue).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {destinationOptions.map((dest) => {
                  const isSelected = selectedDestinations.includes(dest);
                  const destKey = getDestKey(dest);
                  return (
                    <div
                      key={dest}
                      className={`flex flex-col rounded border transition-all ${isSelected ? "border-[#00a2b8] bg-[#00171f]" : "border-slate-800 bg-[#061219] hover:border-slate-700"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDestination(dest)}
                        className={`p-3 text-left text-xs flex justify-between items-center cursor-pointer ${isSelected ? "text-white font-medium hover:text-white" : "text-slate-400 hover:text-slate-300"}`}
                      >
                        <span>{dest}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#00a2b8]" />
                        )}
                      </button>
                      {mode === "agent" && isSelected && (
                        <div className="px-3 pb-3">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Override Destination Price (Excl. Tax)
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-[#030d12] border border-[#00a2b8]/50 text-[#00a2b8] placeholder:text-[#00a2b8]/30 p-2 rounded text-xs font-mono text-right"
                            value={
                              agentItemizedPrices[destKey] !== undefined
                                ? agentItemizedPrices[destKey]
                                : (currentAgent as any)?.priceList?.[destKey] ||
                                  ""
                            }
                            onChange={(e) =>
                              setAgentItemizedPrices((prev) => ({
                                ...prev,
                                [destKey]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div>
              <h2 className="font-serif text-xl text-slate-100 mb-2 font-medium">
                04. Choose Upgrades & Add-ons
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Enhance your party with deluxe sea water sliders, BBQ, ocean
                swimming pools, or professional tour tickets. (Optional)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonOptions.map((addon) => {
                  const isSelected = selectedAddons.includes(addon);
                  const addonKey = getAddonKey(addon);
                  return (
                    <div
                      key={addon}
                      className={`flex flex-col rounded border transition-all ${isSelected ? "border-[#E58c40] bg-[#1a110a]" : "border-slate-800 bg-[#061219] hover:border-slate-700"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`p-3 text-left text-xs flex justify-between items-center cursor-pointer ${isSelected ? "text-white font-medium hover:text-white" : "text-slate-400 hover:text-slate-300"}`}
                      >
                        <span>{addon}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#E58c40]" />
                        )}
                      </button>
                      {mode === "agent" && isSelected && (
                        <div className="px-3 pb-3">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Override Add-on Price
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-[#030d12] border border-[#E58c40]/50 text-[#E58c40] placeholder:text-[#E58c40]/30 p-2 rounded text-xs font-mono text-right"
                            value={
                              agentItemizedPrices[addonKey] !== undefined
                                ? agentItemizedPrices[addonKey]
                                : (currentAgent as any)?.priceList?.[
                                    addonKey
                                  ] || ""
                            }
                            onChange={(e) =>
                              setAgentItemizedPrices((prev) => ({
                                ...prev,
                                [addonKey]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div>
              <h2 className="font-serif text-xl text-slate-100 mb-4 font-medium">
                05. Charter & Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Embark hour *
                  </label>
                  <input
                    type="time"
                    value={embarkHour}
                    onChange={(e) => setEmbarkHour(e.target.value)}
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    placeholder="e.g. 15"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    WhatsApp / Contact Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+66 99 999 9999"
                    value={guestContact}
                    onChange={(e) =>
                      setGuestContact(formatPhoneNumber(e.target.value))
                    }
                    className="w-full bg-[#061219] border border-slate-800 text-slate-200 p-3 rounded"
                    required
                  />
                </div>
              </div>

              {mode === "agent" && (
                <div className="mt-6 p-4 bg-[#0a1f1d]/40 border border-emerald-950/30 rounded-lg flex flex-col gap-2.5 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-emerald-500 font-medium tracking-widest text-[9px] uppercase">
                      Base Yacht Price:
                    </div>
                    <input
                      type="number"
                      value={agentRoutePrice}
                      onChange={(e) => setAgentRoutePrice(e.target.value)}
                      className="bg-[#030d12] border border-slate-800 text-emerald-400 p-1.5 rounded text-xs font-mono text-right w-32"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-emerald-500 font-medium tracking-widest text-[9px] uppercase">
                      Add-ons subtotal:
                    </div>
                    <input
                      type="number"
                      value={agentAddonsPrice}
                      onChange={(e) => setAgentAddonsPrice(e.target.value)}
                      className="bg-[#030d12] border border-slate-800 text-emerald-400 p-1.5 rounded text-xs font-mono text-right w-32"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2.5">
                    <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                      Subtotal (Without 7% Tax):
                    </span>
                    <span className="font-mono text-slate-200 text-sm font-bold">
                      {(
                        parseFloat(agentRoutePrice || "0") +
                        parseFloat(agentAddonsPrice || "0")
                      ).toLocaleString()}{" "}
                      THB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <h2 className="font-serif text-xl text-slate-100 font-medium">
              06. Confirm & Book
            </h2>

            {/* Digital Boarding Ticket style overview */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#061219] flex flex-col sm:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-[#E58c40] font-black">
                    Yacht Charter Selection
                  </span>
                  <span className="text-[10px] uppercase font-mono text-[#00a2b8] tracking-widest font-bold">
                    Official Proposal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Recommended Ship
                    </span>
                    <p className="text-slate-100 font-serif text-[15px] font-bold">
                      {CATAMARANS.find((c) => c.id === selectedShip)?.name ||
                        "Not Specified"}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Duration
                    </span>
                    <p className="text-slate-100 font-medium text-[13px] capitalize border border-[#E58c40]/20 bg-[#E58c40]/5 px-2 py-0.5 rounded w-fit">
                      {selectedDuration || "Not Selected"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Departure Date
                    </span>
                    <p className="text-slate-200 font-mono text-[13px]">
                      {tripDate || "Not Specified"}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Embark Hour
                    </span>
                    <p className="text-slate-200 font-mono text-[13px]">
                      {embarkHour}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Guest Count
                    </span>
                    <p className="text-slate-200 font-medium text-[13px]">
                      {guestCount || "1"} pax
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                      Launch Pier
                    </span>
                    <p className="text-slate-200 font-medium text-[13px]">
                      {selectedPier}
                    </p>
                  </div>
                </div>

                {(selectedDestinations.length > 0 ||
                  selectedAddons.length > 0) && (
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    {selectedDestinations.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">
                          Routing stops
                        </span>
                        <p className="text-slate-300 text-xs mt-0.5 leading-relaxed font-bold">
                          {selectedDestinations.join(" → ")}
                        </p>
                      </div>
                    )}
                    {selectedAddons.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">
                          Selected Upgrades
                        </span>
                        <p className="text-slate-300 text-xs mt-0.5 leading-relaxed font-mono">
                          {selectedAddons.join(" • ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right section (conditionally displays prices ONLY if mode is agent) */}
              <div className="sm:w-56 bg-[#0a1a26] p-6 flex flex-col justify-center relative border-t sm:border-y-0 sm:border-l border-slate-800">
                <div className="hidden sm:block absolute -left-[11px] top-1/2 -mt-2.5 w-5 h-5 bg-[#030d12] rounded-full border-r border-[#1e293b]"></div>
                <div className="hidden sm:block absolute -left-[11px] -top-2.5 w-5 h-5 bg-[#030d12] rounded-full border-b border-r border-[#1e293b]"></div>
                <div className="hidden sm:block absolute -left-[11px] -bottom-2.5 w-5 h-5 bg-[#030d12] rounded-full border-t border-r border-[#1e293b]"></div>

                {mode === "agent" ? (
                  <div className="space-y-3 text-left">
                    <h4 className="text-[10px] text-emerald-400 font-black uppercase tracking-wider border-b border-emerald-900/40 pb-1.5">
                      Official Quote (Agent Workspace)
                    </h4>
                    <div>
                      <span className="text-[8px] uppercase text-slate-400 tracking-wider">
                        Yacht Route:
                      </span>
                      <p className="font-mono text-slate-200 text-xs text-right">
                        {(parseFloat(agentRoutePrice) || 0).toLocaleString()}{" "}
                        THB
                      </p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-slate-400 tracking-wider">
                        Addons sub:
                      </span>
                      <p className="font-mono text-slate-200 text-xs text-right">
                        {(parseFloat(agentAddonsPrice) || 0).toLocaleString()}{" "}
                        THB
                      </p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-slate-400 tracking-wider">
                        Estimated Tax (7%):
                      </span>
                      <p className="font-mono text-slate-200 text-xs text-right">
                        {(
                          ((parseFloat(agentRoutePrice) || 0) +
                            (parseFloat(agentAddonsPrice) || 0)) *
                          0.07
                        ).toLocaleString()}{" "}
                        THB
                      </p>
                    </div>
                    <div className="border-t border-slate-700 pt-2">
                      <span className="text-[9px] uppercase text-slate-400 tracking-widest font-bold">
                        Total Price (Inc Tax):
                      </span>
                      <p className="font-mono text-amber-400 text-sm font-black text-right">
                        {(
                          ((parseFloat(agentRoutePrice) || 0) +
                            (parseFloat(agentAddonsPrice) || 0)) *
                          1.07
                        ).toLocaleString()}{" "}
                        THB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <div className="mb-4">
                      <div className="mx-auto w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-2 text-indigo-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                        Ready to Finalise
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed font-light">
                      Your tailored catamaran itinerary is configured. Click
                      below to download PDF.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 mt-6 mb-2 bg-[#061219] p-4 rounded-lg border border-[#1e293b]">
              <input
                type="checkbox"
                id="termsAndRules"
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-[#E58c40] focus:ring-[#E58c40]/50 shrink-0 cursor-pointer"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label
                htmlFor="termsAndRules"
                className="text-[11px] text-slate-300 leading-relaxed cursor-pointer select-none"
              >
                I agree to the Terms and Conditions and abide by the Maritime
                Safety Rules on board.
              </label>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (mode === "agent") {
                  window.location.href = "/?agent-portal=true";
                } else if (mode === "registered") {
                  window.location.href =
                    "/?workspace=customer&customer-portal=true";
                } else {
                  window.location.href = "/";
                }
              }}
              className="text-[13px] text-slate-400 hover:text-white transition-colors py-2 px-1 flex items-center gap-1.5 cursor-pointer"
            >
              {mode === "agent"
                ? "← Back to Agent Workspace"
                : mode === "registered"
                  ? "← Back to Customer Dashboard Workspace"
                  : "← Back to Home Page"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrev}
              className="text-[13px] text-slate-400 hover:text-white transition-colors py-2 px-1 cursor-pointer"
            >
              Back
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && !selectedShip) ||
                (step === 2 && !selectedDuration) ||
                (step === 3 && selectedDestinations.length === 0) ||
                (step === 5 &&
                  (!tripDate || !guestName || !guestEmail || !guestContact))
              }
              className="bg-[#00a2b8] hover:bg-[#00b8d1] text-white px-5 py-2.5 text-[13px] font-bold tracking-wider rounded flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              CONTINUE <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGenerating || !termsAccepted}
                className="bg-[#E58c40] hover:bg-[#eb9a54] text-slate-900 px-6 py-2.5 text-[13px] font-bold rounded shadow-[0_0_15px_rgba(229,140,64,0.15)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating
                  ? "Processing..."
                  : mode === "agent"
                    ? "Confirm & Send Quotation"
                    : "Generate Booking PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
