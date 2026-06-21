import React, { useState, useEffect } from "react";
import { CATAMARANS, DESTINATIONS } from "../data";
import { generateItineraryPdf } from "../lib/pdfGenerator";
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Anchor,
  Clock,
  Calendar,
  Users,
  Menu,
  ChevronRight,
  Check,
  Home,
} from "lucide-react";
import CustomerPortalModal from "./CustomerPortalModal";
import { useAgent } from "../AgentContext";

type WorkspaceStep = 1 | 2 | 3 | 4;

export default function CustomerWorkspace() {
  const { currentAgent } = useAgent();
  const [step, setStep] = useState<WorkspaceStep>(1);
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  // Trip Details
  const [tripDate, setTripDate] = useState("");
  const [embarkHour, setEmbarkHour] = useState("09:00");
  const [selectedPier, setSelectedPier] = useState("Chalong Pier");
  const [guestCount, setGuestCount] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [customRouteText, setCustomRouteText] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [cabinCount, setCabinCount] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("customer-portal") === "true";
  });
  const [activeProfile, setActiveProfile] = useState<any>(null);

  // Customer Details for Step 4
  const [confirmName, setConfirmName] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPhone, setConfirmPhone] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (userObj) => {
      let activeUid = userObj?.uid;
      let fallbackEmail = userObj?.email || "";

      if (!activeUid) {
        const localSandbox = localStorage.getItem("sandbox_customer_session");
        if (localSandbox) {
          try {
            const parsed = JSON.parse(localSandbox);
            activeUid = parsed.uid;
            fallbackEmail = parsed.email;
          } catch (e) {}
        }
      }

      if (userObj) {
        // Prevent Captain session from cross-logging as a Customer
        const isCaptainLocal = localStorage.getItem(
          `captain_cache_${userObj.email}`,
        );
        if (isCaptainLocal) {
          setActiveProfile(null);
          return;
        }
        try {
          const captainDoc = await getDoc(doc(db, "captains", userObj.uid));
          if (captainDoc.exists()) {
            localStorage.setItem(
              `captain_cache_${userObj.email}`,
              JSON.stringify(captainDoc.data()),
            );
            setActiveProfile(null);
            return;
          }
        } catch (e) {
          console.warn("IsCaptain lookup bypass:", e);
        }
      }

      if (activeUid) {
        try {
          const docRef = doc(db, "customers", activeUid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setActiveProfile({ ...data, activeUid, email: fallbackEmail });
            setConfirmName(data.name || data.fullName || fallbackEmail || "");
            setConfirmEmail(fallbackEmail || data.email || "");
            setConfirmPhone(data.phoneNumber || data.phone || "");
          } else {
            setActiveProfile({ activeUid, email: fallbackEmail });
            setConfirmName(fallbackEmail);
            setConfirmEmail(fallbackEmail);
          }
        } catch (e) {
          setActiveProfile({ activeUid, email: fallbackEmail });
        }
      } else {
        setActiveProfile(null);
      }
    });
    return () => unsub();
  }, []);

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

  const getPierId = (pierName: string) => {
    if (pierName.includes("Chalong")) return "chalong";
    if (pierName.includes("Coco")) return "coco";
    if (pierName.includes("Ao Po")) return "ao-po";
    return "chalong";
  };

  const availableDestinations = DESTINATIONS.filter(
    (d) =>
      d.recommendedPierId === getPierId(selectedPier) ||
      d.id === "custom-route",
  );

  const toggleDestination = (destName: string) => {
    setSelectedDestinations((prev) => {
      const newDests = prev.includes(destName)
        ? prev.filter((d) => d !== destName)
        : [...prev, destName];
      if (
        newDests.includes("James Bond Island (Koh Tapu)") &&
        !prev.includes("James Bond Island (Koh Tapu)")
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
      !selectedDestinations.some((d) => d.includes("Khai Nok"))
    ) {
      alert("Jet Ski Tour is only available if Koh Kai Nok is selected.");
      return;
    }
    setSelectedAddons((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon],
    );
  };

  const handleNext = () => {
    if (step === 3) {
      if (selectedDestinations.some((d) => d.includes("James Bond Island"))) {
        const hour = parseInt(embarkHour.split(":")[0]);
        if (hour !== 8 && hour !== 9) {
          alert(
            "For James Bond Island, embark time must be at 08:00 or 09:00 AM (Trip duration ~12-13 hours total). Please adjust.",
          );
          return;
        }
      }
      if (selectedDestinations.some((d) => d.includes("Phi Phi"))) {
        const hour = parseInt(embarkHour.split(":")[0]);
        if (hour !== 8 && hour !== 9) {
          alert(
            "For Phi Phi Islands, embark time must be at 08:00 or 09:00 AM. Total trip handles ~12 hours.",
          );
          return;
        }
      }
    }
    if (step < 4) setStep((prev) => (prev + 1) as WorkspaceStep);
  };

  const handlePrev = () => {
    if (step > 1) setStep((prev) => (prev - 1) as WorkspaceStep);
  };

  const handleGeneratePdf = async () => {
    if (step !== 4) return;
    if (!confirmName.trim() || (!confirmEmail.trim() && !confirmPhone.trim())) {
      alert(
        "Please provide your name and at least an email or phone number to confirm the booking.",
      );
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
            "Failed converting vessel image to base64 inside workspace:",
            imgErr,
          );
        }
      }

      const randomRef = "GUEST-" + Math.floor(100000 + Math.random() * 900000);

      let activeUid = activeProfile?.activeUid || auth.currentUser?.uid || null;

      const selectedDur = durationOptions.find(
        (d) => d.id === selectedDuration,
      );

      const finalDestString =
        selectedDestinations.includes("Custom Route (Plan Your Own)") &&
        customRouteText.trim()
          ? `Custom Route: ${customRouteText}`
          : selectedDestinations.length
            ? selectedDestinations.join(", ")
            : "the Andaman Sea";

      const itinerary = {
        recommendedVesselId: selectedShip || "Not Specified",
        vesselReasoning: `You selected the ${selectedShipData?.name || "Yacht"}.`,
        recommendedPierId: selectedPier,
        routeTitle: `Bespoke ${selectedDur?.label || "Charter"} to ${finalDestString}`,
        fullDescription: `Your exclusive voyage is scheduled for ${tripDate || "TBD"} departing at ${embarkHour} from ${selectedPier} for ${guestCount || "a private party"} guests. Enjoy your ${selectedDur?.label || "trip"}! \n\nSelected Add-ons: ${selectedAddons.length ? selectedAddons.join(", ") : "None"}`,
        stops: selectedDestinations.map((d, i) => ({
          destinationId: `stop-${i}`,
          name: d,
          activity: d.includes("Custom Route")
            ? customRouteText
            : "Leisure, sightseeing, and relaxation.",
          durationHours: 2,
          timeOfDay: "Flexible",
        })),
        totalEstimatedHours:
          selectedDuration === "full-day"
            ? 8
            : selectedDuration === "half-day"
              ? 4
              : 48,
        insiderTips: [
          "Please bring comfortable swimwear and reef-safe sunscreen.",
          "Our crew will assist you upon arrival.",
        ],
        bookingReference: randomRef,
        customerName: confirmName,
        customerPhone: confirmPhone,
        customerEmail: confirmEmail,
        agentName: "Concierge Assigned via App",
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
      };

      const pdfDoc = generateItineraryPdf(itinerary);
      const pdfBase64 = pdfDoc.output("datauristring");

      const newProposal = {
        id: randomRef,
        clientName: confirmName || "Customer Workspace Request",
        charterDate: tripDate || new Date().toISOString().split("T")[0],
        vesselId1: selectedShip,
        vesselId2: selectedShip,
        vesselId3: "",
        price1: "",
        price2: "",
        price3: "",
        compareCount: 1,
        createdAt: new Date().toISOString().split("T")[0],
        agentEmail:
          currentAgent?.email ||
          activeProfile?.representativeBroker?.email ||
          null,
        customerPhone: confirmPhone,
        customerEmail: confirmEmail,
        customerUid: activeUid || null,
        hotelPickupLocation: "",
        termsAccepted: termsAccepted,
        termsAcceptedTimestamp: new Date().toISOString(),
        pdfBase64: pdfBase64,
        bookingType: auth.currentUser ? "registered" : "guest",
        folderName: auth.currentUser
          ? `registered customer / ${confirmName} (${confirmEmail})`
          : "unregistered customer req",
      };

      try {
        const addDocPromise = addDoc(collection(db, "booking_requests"), {
          ...newProposal,
          timestamp: serverTimestamp(),
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Save booking_requests timeout")),
            1500,
          ),
        );
        await Promise.race([addDocPromise, timeoutPromise]);
      } catch (fbErr) {
        console.warn("Firestore proposal save skipped due to limit:", fbErr);
      }

      // Also register as an inquiry so Admin handles it properly
      try {
        await addDoc(collection(db, "inquiries"), {
          name: confirmName,
          email: confirmEmail,
          contact: confirmPhone,
          message: `Fastbooking via PDF Generation.\nVessel: ${CATAMARANS.find((c) => c.id === selectedShip)?.name}\nRoute: ${finalDestString}\nDate: ${tripDate}\nGuests: ${guestCount}`,
          pdfBase64: pdfBase64,
          folder: "Inbox",
          status: "New",
          createdAt: new Date().toISOString(),
        });
      } catch (inqErr) {
        console.warn("Could not save inquiry:", inqErr);
      }

      if (activeUid) {
        try {
          const customerRef = doc(db, "customers", activeUid);
          await updateDoc(customerRef, {
            manifests: arrayUnion({
              date: new Date().toISOString(),
              pdfBase64,
            }),
          });
        } catch (e) {
          console.warn(
            "Could not save to Firebase, continuing with PDF generation.",
          );
        }
      }

      // Automatically trigger secure blob-based download
      pdfDoc.save("Custom_Itinerary.pdf");

      alert(
        "Success! Your itinerary PDF has been generated and downloaded. Our team will contact you soon.",
      );
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030a10] font-sans antialiased text-slate-300 pb-20 selection:bg-[#00a2b8] selection:text-white">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/60 bg-[#030a10] sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E58c40] flex items-center justify-center text-slate-900 shadow-md">
            <Anchor className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-tight text-slate-100">
              Phuket Charter
            </h1>
            <p className="text-[8px] uppercase tracking-[0.25em] text-[#E58c40] font-medium mt-0.5">
              Catamaran & Yacht
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-slate-200 border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-1.5 rounded-sm flex flex-row items-center gap-1.5 transition-colors text-[10px] uppercase tracking-wider font-bold"
          >
            <Home className="w-3.5 h-3.5" /> Back
          </button>
          <button
            onClick={() => setIsCustomerPortalOpen(true)}
            className="text-slate-200 p-1 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 md:mt-12 px-5">
        {step === 1 && (
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#E58c40] mb-4 font-medium">
              Private Bespoke Yacht Customiser
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-slate-100 mb-5 leading-tight">
              Configure Your <br className="md:hidden" />
              <span className="text-[#00a2b8] italic">Charter</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-light max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
              Build your perfect voyage in three simple steps. Our team will
              contact you within 24 hours to confirm all details.
            </p>
          </div>
        )}

        {/* Wizard Container */}
        <div className="w-full relative shadow-2xl rounded-t-lg overflow-hidden animate-in fade-in duration-500 delay-150 fill-mode-both">
          {/* Tabs */}
          <div className="flex bg-[#0a151d] border-b border-slate-800/80 rounded-t-lg border-x border-t relative text-slate-400">
            {[
              { num: 1, label: "Vessel", icon: Anchor },
              { num: 2, label: "Duration", icon: Clock },
              { num: 3, label: "Details", icon: Calendar },
              { num: 4, label: "Confirm", icon: Users },
            ].map((t) => (
              <button
                key={t.num}
                onClick={() => t.num < step && setStep(t.num as WorkspaceStep)}
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

          {/* Form Content Area */}
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
                        <p className="text-[12px] text-slate-400 font-light mb-2 flex items-center justify-between border-b border-slate-800/50 pb-2">
                          <span>Up to {ship.capacity} guests</span>
                          <span>{ship.length}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-light line-clamp-3 leading-relaxed">
                          {ship.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="font-serif text-xl text-slate-100 mb-6 font-medium">
                  03. Trip Details
                </h2>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                        className="w-full bg-[#061219] border border-[#1e293b] text-slate-200 text-sm rounded-md p-3 focus:outline-none focus:border-[#00a2b8] focus:ring-1 focus:ring-[#00a2b8] transition-colors calendar-picker-style"
                      />
                    </div>
                    <style>{`
                        .calendar-picker-style::-webkit-calendar-picker-indicator {
                          filter: invert(1);
                        }
                      `}</style>

                    {/* Embark Hour */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2">
                        Embark Pier *
                      </label>
                      <input
                        type="time"
                        value={embarkHour}
                        onChange={(e) => setEmbarkHour(e.target.value)}
                        className="w-full bg-[#061219] border border-[#1e293b] text-slate-200 text-sm rounded-md p-3 focus:outline-none focus:border-[#00a2b8] focus:ring-1 focus:ring-[#00a2b8] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Guests */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400">
                          Number Of Guests *
                        </label>
                        {selectedShip &&
                          CATAMARANS.find((c) => c.id === selectedShip)
                            ?.capacity && (
                            <span className="text-[10px] text-slate-500">
                              Max:{" "}
                              {
                                CATAMARANS.find((c) => c.id === selectedShip)
                                  ?.capacity
                              }{" "}
                              pax
                            </span>
                          )}
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 12"
                        min="1"
                        max={
                          selectedShip
                            ? CATAMARANS.find((c) => c.id === selectedShip)
                                ?.capacity
                            : undefined
                        }
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className={`w-full bg-[#061219] border text-slate-200 text-sm rounded-md p-3 focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-600 ${
                          selectedShip &&
                          CATAMARANS.find((c) => c.id === selectedShip)
                            ?.capacity &&
                          parseInt(guestCount) >
                            (CATAMARANS.find((c) => c.id === selectedShip)
                              ?.capacity || Number.MAX_SAFE_INTEGER)
                            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                            : "border-[#1e293b] focus:border-[#00a2b8] focus:ring-[#00a2b8]"
                        }`}
                      />
                      {selectedShip &&
                        CATAMARANS.find((c) => c.id === selectedShip)
                          ?.capacity &&
                        guestCount &&
                        parseInt(guestCount) >
                          (CATAMARANS.find((c) => c.id === selectedShip)
                            ?.capacity || 0) && (
                          <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                            Exceeds maximum capacity for{" "}
                            {
                              CATAMARANS.find((c) => c.id === selectedShip)
                                ?.name
                            }
                          </p>
                        )}
                    </div>

                    {/* Pier */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2">
                        Pier of Embark *
                      </label>
                      <select
                        value={selectedPier}
                        onChange={(e) => {
                          setSelectedPier(e.target.value);
                          setSelectedDestinations([]); // Reset destinations when port changes
                        }}
                        className="w-full bg-[#061219] border border-[#1e293b] text-slate-200 text-sm rounded-md p-3 focus:outline-none focus:border-[#00a2b8] focus:ring-1 focus:ring-[#00a2b8] transition-colors"
                      >
                        {pierOptions.map((pier) => (
                          <option key={pier} value={pier}>
                            {pier}
                          </option>
                        ))}
                      </select>
                      {selectedDestinations.some((d) =>
                        d.includes("James Bond Island"),
                      ) && (
                        <p className="text-[10px] text-[#00a2b8] mt-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ao Po Pier is required
                          for James Bond trips
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Destinations */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3">
                      Preferred Destinations (Optional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableDestinations.map((dest) => {
                        const isSelected = selectedDestinations.includes(
                          dest.name,
                        );
                        return (
                          <button
                            key={dest.id}
                            onClick={() => toggleDestination(dest.name)}
                            className={`group relative overflow-hidden rounded-md h-24 transition-all border outline-none ${
                              isSelected
                                ? "border-[#00a2b8] shadow-[0_0_10px_rgba(0,162,184,0.3)] ring-1 ring-[#00a2b8]"
                                : "border-slate-800 hover:border-slate-500"
                            }`}
                          >
                            <img
                              src={dest.imageUrl}
                              alt={dest.name}
                              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSelected ? "opacity-50" : "opacity-30"}`}
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#061219]/90 to-transparent"></div>
                            <span
                              className={`absolute bottom-2 left-2 text-[11px] font-medium text-left z-10 transition-colors ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                            >
                              {dest.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-[#00a2b8] text-white p-0.5 rounded-full z-10">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedDestinations.includes(
                      "Custom Route (Plan Your Own)",
                    ) && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-2">
                          Specify Custom Route *
                        </label>
                        <input
                          type="text"
                          placeholder="Where would you like to explore?"
                          value={customRouteText}
                          onChange={(e) => setCustomRouteText(e.target.value)}
                          className="w-full bg-[#061219] border border-[#00a2b8]/50 text-slate-200 text-sm rounded-md p-3 focus:outline-none focus:border-[#00a2b8] focus:ring-1 focus:ring-[#00a2b8] transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Addons & Cabin Logic */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-3">
                      Add-ons & Upgrades (Optional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800/80 pb-8 gap-3">
                      {addonOptions.map((addon) => {
                        const isSelected = selectedAddons.includes(addon);

                        let addonUrl =
                          "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Slider") || addon.includes("Pool"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Cabin"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Barbecue"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Fruits"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1582293041935-865dc67e3dfd?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Karaoke"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1626343586071-6eb823ca2707?auto=format&fit=crop&w=600&q=80";
                        if (
                          addon.includes("Longtail") ||
                          addon.includes("Tickets")
                        )
                          addonUrl =
                            "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80";
                        if (addon.includes("Jet Ski"))
                          addonUrl =
                            "https://images.unsplash.com/photo-1594240751336-d250bfd4169c?auto=format&fit=crop&w=600&q=80";

                        return (
                          <button
                            key={addon}
                            onClick={() => toggleAddon(addon)}
                            className={`group relative overflow-hidden rounded-md h-28 transition-all border outline-none ${
                              isSelected
                                ? "border-[#E58c40] shadow-[0_0_10px_rgba(229,140,64,0.3)] ring-1 ring-[#E58c40]"
                                : "border-slate-800 hover:border-slate-500"
                            }`}
                          >
                            <img
                              src={addonUrl}
                              alt={addon}
                              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSelected ? "opacity-50" : "opacity-30"}`}
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#061219]/90 to-[#061219]/20"></div>
                            <span
                              className={`absolute bottom-2 left-2 text-[11px] leading-tight font-medium text-left z-10 transition-colors ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                            >
                              {addon}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-[#E58c40] text-slate-900 p-0.5 rounded-full z-10">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAddons.includes("Private Cabin Access") && (
                      <div className="mt-6 bg-[#061219] p-4 rounded-md border border-slate-700">
                        <label className="block text-xs text-slate-300 mb-2 font-medium">
                          {selectedShip === "the-best"
                            ? "How many cabins would you like? (1-5)"
                            : selectedShip === "namaste"
                              ? "How many cabins would you like? (1-2)"
                              : "Number of Cabins"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={
                            selectedShip === "the-best"
                              ? 5
                              : selectedShip === "namaste"
                                ? 2
                                : 0
                          }
                          value={cabinCount}
                          onChange={(e) =>
                            setCabinCount(parseInt(e.target.value))
                          }
                          className="w-full bg-[#030d12] border border-slate-600 rounded p-2 text-white"
                        />
                        {selectedShip === "the-one" && (
                          <p className="text-red-400 text-xs mt-1">
                            This vessel has no cabins for private access.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                <h2 className="font-serif text-xl text-slate-100 mb-6 font-medium">
                  04. Confirm & Book
                </h2>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="bg-[#081824] border border-[#1e293b] rounded-xl flex flex-col sm:flex-row relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Anchor className="w-24 h-24 text-white" />
                    </div>
                    {/* Left part of ticket */}
                    <div className="flex-1 p-6 sm:border-r border-dashed border-[#1e293b] space-y-4">
                      <div className="flex justify-between items-start border-b border-white/5 pb-4 gap-4">
                        <div className="flex gap-3 items-center">
                          {CATAMARANS.find((c) => c.id === selectedShip)
                            ?.image && (
                            <img
                              src={
                                CATAMARANS.find((c) => c.id === selectedShip)
                                  ?.image
                              }
                              alt="Yacht Layout"
                              className="w-16 h-12 object-cover rounded border border-white/15 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-[#E58c40] font-bold">
                              Vessel / Yacht
                            </span>
                            <h3 className="text-slate-100 font-serif text-xl mt-0.5 leading-tight">
                              {CATAMARANS.find((c) => c.id === selectedShip)
                                ?.name || "Not selected"}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {
                                CATAMARANS.find((c) => c.id === selectedShip)
                                  ?.model
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#00a2b8] font-bold">
                            Duration
                          </span>
                          <h4 className="text-slate-200 mt-0.5 text-sm font-medium">
                            {
                              durationOptions.find(
                                (d) => d.id === selectedDuration,
                              )?.label
                            }
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-2">
                        <div>
                          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                            <Calendar className="w-3 h-3 text-[#E58c40]" /> Date
                          </span>
                          <p className="text-slate-200 font-medium text-[13px]">
                            {tripDate || "Not selected"}
                          </p>
                        </div>
                        <div>
                          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                            <Clock className="w-3 h-3 text-[#E58c40]" /> Embark
                          </span>
                          <p className="text-slate-200 font-medium text-[13px]">
                            {embarkHour}
                          </p>
                        </div>
                        <div>
                          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                            <Users className="w-3 h-3 text-[#E58c40]" /> Guests
                          </span>
                          <p className="text-slate-200 font-medium text-[13px]">
                            {guestCount || "Not selected"} pax
                          </p>
                        </div>
                        <div>
                          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                            <Anchor className="w-3 h-3 text-[#E58c40]" /> Pier
                            Location
                          </span>
                          <p className="text-slate-200 font-medium text-[13px]">
                            {selectedPier}
                          </p>
                        </div>
                      </div>

                      {(selectedDestinations.length > 0 ||
                        selectedAddons.length > 0) && (
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          {selectedDestinations.length > 0 && (
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">
                                Routing
                              </span>
                              <p className="text-slate-300 text-[12px] mt-0.5 leading-relaxed">
                                {selectedDestinations.includes(
                                  "Custom Route (Plan Your Own)",
                                ) && customRouteText.trim()
                                  ? `Custom Route: ${customRouteText}`
                                  : selectedDestinations.join(" → ")}
                              </p>
                            </div>
                          )}
                          {selectedAddons.length > 0 && (
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500">
                                Configured Add-ons
                              </span>
                              <p className="text-slate-300 text-[12px] mt-0.5 leading-relaxed">
                                {selectedAddons.join(" • ")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right part of ticket */}
                    <div className="sm:w-48 bg-[#0a1a26] p-6 flex flex-col justify-center items-center relative">
                      <div className="hidden sm:block absolute -left-[11px] top-1/2 -mt-2.5 w-5 h-5 bg-[#030d12] rounded-full border-r border-[#1e293b]"></div>
                      <div className="hidden sm:block absolute -left-[11px] -top-2.5 w-5 h-5 bg-[#030d12] rounded-full border-b border-r border-[#1e293b]"></div>
                      <div className="hidden sm:block absolute -left-[11px] -bottom-2.5 w-5 h-5 bg-[#030d12] rounded-full border-t border-r border-[#1e293b]"></div>

                      <div className="text-center w-full">
                        <div className="mb-4">
                          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                          </div>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            Ready to Finalise
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                          Your reservation request will be sent to the
                          Concierge.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#061219] p-5 rounded-xl border border-[#1e293b] mt-6">
                    <h3 className="font-serif text-slate-200 mb-4 text-sm tracking-wide">
                      Primary Guest Contact Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-400 mb-1.5">
                          Registered Name *
                        </label>
                        <input
                          type="text"
                          value={confirmName}
                          onChange={(e) => setConfirmName(e.target.value)}
                          required
                          placeholder="Your full name"
                          className="w-full bg-[#030a10] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00a2b8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-400 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          placeholder="Email for PDF booking"
                          className="w-full bg-[#030a10] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00a2b8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] text-slate-400 mb-1.5">
                          Line / WhatsApp (Optional)
                        </label>
                        <input
                          type="text"
                          value={confirmPhone}
                          onChange={(e) => setConfirmPhone(e.target.value)}
                          placeholder="+... or Line ID"
                          className="w-full bg-[#030a10] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00a2b8]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-6 mb-2 bg-[#061219] p-4 rounded-lg border border-[#1e293b]">
                    <input
                      type="checkbox"
                      id="termsAndRules"
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-[#E58c40] focus:ring-[#E58c40]/50 shrink-0"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label
                      htmlFor="termsAndRules"
                      className="text-[11px] text-slate-300 leading-relaxed cursor-pointer select-none"
                    >
                      I agree to the Terms and Conditions and abide by the
                      Maritime Safety Rules on board. I verify the itinerary and
                      guest manifest details above are correct.
                    </label>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed text-center max-w-md mx-auto">
                    By confirming, your details will be formatted into an
                    official PDF manifest and secured within your guest vault.
                    Our concierge team will reach out to fulfill payment and
                    final docking protocols.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div
              className={`mt-8 pt-6 ${step === 3 ? "" : "border-t border-slate-800/80"} flex items-center justify-between`}
            >
              <button
                onClick={handlePrev}
                className={`text-[13px] text-slate-400 hover:text-white transition-colors py-2 px-1 ${step === 1 ? "invisible" : ""}`}
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedShip) ||
                    (step === 2 && !selectedDuration) ||
                    (step === 3 &&
                      (!tripDate ||
                        !embarkHour ||
                        !guestCount ||
                        (selectedShip &&
                          parseInt(guestCount) >
                            (CATAMARANS.find((c) => c.id === selectedShip)
                              ?.capacity || 0))))
                  }
                  className="bg-[#00a2b8] hover:bg-[#00b8d1] text-white px-5 py-2.5 text-[13px] font-medium tracking-wide rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CONTINUE <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGeneratePdf}
                  disabled={
                    isGenerating ||
                    !selectedShip ||
                    !selectedDuration ||
                    !termsAccepted ||
                    !confirmName.trim() ||
                    (!confirmEmail.trim() && !confirmPhone.trim())
                  }
                  className="bg-[#E58c40] hover:bg-[#eb9a54] text-slate-900 px-6 py-2.5 text-[13px] font-bold tracking-wide rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-[0_0_15px_rgba(229,140,64,0.3)]"
                >
                  {isGenerating ? "Processing..." : "Generate Booking PDF"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <CustomerPortalModal
        isOpen={isCustomerPortalOpen}
        onClose={() => setIsCustomerPortalOpen(false)}
      />
    </div>
  );
}
