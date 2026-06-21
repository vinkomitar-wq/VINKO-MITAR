import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Users,
  Ship,
  Compass,
  Settings,
  Calendar,
  Award,
  Check,
  Shuffle,
  FileText,
  Send,
  Copy,
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
  DollarSign,
  UserCheck,
  Plus,
  Trash2,
  Save,
  Download,
} from "lucide-react";
import { Catamaran } from "../types";
import { CATAMARANS } from "../data";
import { useLanguage } from "../LanguageContext";
import { useAgent } from "../AgentContext";
import { jsPDF } from "jspdf";
import { safeStringify } from "../lib/jsonSafe";
import { useCurrency } from "../CurrencyContext";
import { VESSEL_BASE_RATES } from "./VesselCard";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";

interface VesselComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVessel: (vesselId: string) => void;
  initialSelectedId1?: string;
  initialSelectedId2?: string;
  initialClientName?: string;
  replyToChatId?: string;
}

export default function VesselComparisonModal({
  isOpen,
  onClose,
  onSelectVessel,
  initialSelectedId1 = "the-best",
  initialSelectedId2 = "namaste",
  initialClientName = "",
  replyToChatId,
}: VesselComparisonModalProps) {
  const { t } = useLanguage();
  const { currentAgent } = useAgent();
  const { formatPrice } = useCurrency();

  // Toggles and comparison selection states
  const [compareCount, setCompareCount] = useState<2 | 3>(2);
  const [vesselId1, setVesselId1] = useState(initialSelectedId1);
  const [vesselId2, setVesselId2] = useState(initialSelectedId2);
  const [vesselId3, setVesselId3] = useState("the-one");

  // Client proposal personalization states
  const [isClientMode, setIsClientMode] = useState(
    !!replyToChatId || !!initialClientName,
  );
  const [clientName, setClientName] = useState(initialClientName);
  const [charterDate, setCharterDate] = useState("");
  const [price1, setPrice1] = useState("");
  const [price2, setPrice2] = useState("");
  const [price3, setPrice3] = useState("");
  const [isSendingToChat, setIsSendingToChat] = useState(false);

  const [showCopyToast, setShowCopyToast] = useState(false);

  // Saved Client Proposals State for managing multiple custom proposals ("for few customers")
  interface CustomerProposal {
    id: string;
    clientName: string;
    charterDate: string;
    vesselId1: string;
    vesselId2: string;
    vesselId3: string;
    price1: string;
    price2: string;
    price3: string;
    compareCount: 2 | 3;
    createdAt: string;
    agentEmail?: string | null;
  }

  const [savedProposals, setSavedProposals] = useState<CustomerProposal[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Computed visible proposals for the current user
  const visibleProposals = savedProposals.filter(
    (p) => p.agentEmail === (currentAgent ? currentAgent.email : null),
  );

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

  // Load saved proposals on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("phuket_charter_proposals");
      if (stored) {
        setSavedProposals(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load proposals", e);
    }
  }, []);

  // Save new or update existing proposal
  const saveCurrentProposal = () => {
    const nameToUse = clientName.trim() || "Unnamed Client";
    const newProposal: CustomerProposal = {
      id: activeProposalId || `prop-${Date.now()}`,
      clientName: nameToUse,
      charterDate: charterDate.trim(),
      vesselId1,
      vesselId2,
      vesselId3,
      price1,
      price2,
      price3,
      compareCount,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      agentEmail: currentAgent ? currentAgent.email : null,
    };

    let updatedList: CustomerProposal[];
    if (activeProposalId) {
      updatedList = savedProposals.map((p) =>
        p.id === activeProposalId ? newProposal : p,
      );
    } else {
      updatedList = [newProposal, ...savedProposals];
      setActiveProposalId(newProposal.id);
    }

    setSavedProposals(updatedList);
    localStorage.setItem(
      "phuket_charter_proposals",
      safeStringify(updatedList),
    );

    // Save copy in admin portal (Firestore collection 'proposals')
    setDoc(doc(db, "proposals", newProposal.id), {
      ...newProposal,
      timestamp: Date.now(),
    }).catch((err) => {
      console.warn("Failed to sync proposal copy to Firestore:", err);
    });

    window.dispatchEvent(new Event("proposals-updated"));
    setSaveSuccessMsg(
      activeProposalId ? "Proposal updated!" : "Proposal saved!",
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const createNewProposal = () => {
    setActiveProposalId(null);
    setClientName("");
    setCharterDate("");
    setPrice1("");
    setPrice2("");
    setPrice3("");
  };

  const loadProposal = (prop: CustomerProposal) => {
    setActiveProposalId(prop.id);
    setClientName(prop.clientName);
    setCharterDate(prop.charterDate);
    setVesselId1(prop.vesselId1);
    setVesselId2(prop.vesselId2);
    setVesselId3(prop.vesselId3);
    setPrice1(prop.price1);
    setPrice2(prop.price2);
    setPrice3(prop.price3);
    setCompareCount(prop.compareCount);
  };

  const deleteProposal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(updated);
    localStorage.setItem("phuket_charter_proposals", safeStringify(updated));

    // Delete copy in admin portal (Firestore collection 'proposals')
    deleteDoc(doc(db, "proposals", id)).catch((err) => {
      console.warn("Failed to delete proposal copy from Firestore:", err);
    });

    window.dispatchEvent(new Event("proposals-updated"));
    if (activeProposalId === id) {
      createNewProposal();
    }
  };

  useEffect(() => {
    const handleEditProposal = (e: CustomEvent) => {
      const pid = e.detail;
      const stored = localStorage.getItem("phuket_charter_proposals");
      if (stored) {
        const props = JSON.parse(stored);
        const found = props.find((p: any) => p.id === pid);
        if (found) {
          loadProposal(found);
          setIsClientMode(true);
        }
      }
    };
    window.addEventListener(
      "edit-proposal",
      handleEditProposal as EventListener,
    );
    return () =>
      window.removeEventListener(
        "edit-proposal",
        handleEditProposal as EventListener,
      );
  }, []);

  const downloadProposalsAsCSV = () => {
    if (visibleProposals.length === 0) return;
    const headers = [
      "Proposal ID",
      "Created At",
      "Client Name",
      "Charter Date",
      "Vessels Compared Count",
      "Vessel 1 Name",
      "Vessel 1 Price",
      "Vessel 2 Name",
      "Vessel 2 Price",
      "Vessel 3 Name",
      "Vessel 3 Price",
    ];

    const rows = visibleProposals.map((prop) => {
      const v1 =
        CATAMARANS.find((v) => v.id === prop.vesselId1)?.name || prop.vesselId1;
      const v2 =
        CATAMARANS.find((v) => v.id === prop.vesselId2)?.name || prop.vesselId2;
      const v3 =
        prop.compareCount === 3
          ? CATAMARANS.find((v) => v.id === prop.vesselId3)?.name ||
            prop.vesselId3
          : "";

      return [
        prop.id,
        prop.createdAt,
        prop.clientName,
        prop.charterDate,
        prop.compareCount,
        v1,
        prop.price1 || "Complimentary / Standard",
        v2,
        prop.price2 || "Complimentary / Standard",
        prop.compareCount === 3 ? v3 : "Not Compared",
        prop.compareCount === 3
          ? prop.price3 || "Complimentary / Standard"
          : "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((e) =>
        e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const authorName = currentAgent
      ? currentAgent.name.replace(/\s+/g, "_")
      : "agent";
    link.setAttribute("download", `phuket_charter_proposals_${authorName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive active vessels based on configurations
  const vessel1 = CATAMARANS.find((v) => v.id === vesselId1) || CATAMARANS[0];
  const vessel2 = CATAMARANS.find((v) => v.id === vesselId2) || CATAMARANS[1];
  const vessel3 = CATAMARANS.find((v) => v.id === vesselId3) || CATAMARANS[2];

  // Utility to translate vessel details
  const getTranslatedName = (v: Catamaran) =>
    t(`vessels.${v.id}.name`) !== `vessels.${v.id}.name`
      ? t(`vessels.${v.id}.name`)
      : v.name;

  const getTranslatedSuitability = (v: Catamaran) =>
    v.partySuitability
      ? t(`vessels.${v.id}.suitability`) !== `vessels.${v.id}.suitability`
        ? t(`vessels.${v.id}.suitability`)
        : v.partySuitability
      : null;

  const getTranslatedAmenities = (v: Catamaran) =>
    v.amenities.map((amenity, index) => {
      const key = `vessels.${v.id}.amenities.${index}`;
      return t(key) !== key ? t(key) : amenity;
    });

  const getTranslatedHighlights = (v: Catamaran) =>
    v.highlights.map((highlight, index) => {
      const key = `vessels.${v.id}.highlights.${index}`;
      return t(key) !== key ? t(key) : highlight;
    });

  // Unique selection safety handlers
  const handleVessel1Change = (id: string) => {
    setVesselId1(id);
    if (id === vesselId2) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId3);
      if (other) setVesselId2(other.id);
    } else if (id === vesselId3 && compareCount === 3) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId2);
      if (other) setVesselId3(other.id);
    }
  };

  const handleVessel2Change = (id: string) => {
    setVesselId2(id);
    if (id === vesselId1) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId3);
      if (other) setVesselId1(other.id);
    } else if (id === vesselId3 && compareCount === 3) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId1);
      if (other) setVesselId3(other.id);
    }
  };

  const handleVessel3Change = (id: string) => {
    setVesselId3(id);
    if (id === vesselId1) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId2);
      if (other) setVesselId1(other.id);
    } else if (id === vesselId2) {
      const other = CATAMARANS.find((v) => v.id !== id && v.id !== vesselId1);
      if (other) setVesselId2(other.id);
    }
  };

  const handleSwap = () => {
    if (compareCount === 2) {
      const temp = vesselId1;
      setVesselId1(vesselId2);
      setVesselId2(temp);
      const tempP = price1;
      setPrice1(price2);
      setPrice2(tempP);
    } else {
      // Loop shift columns for fun
      const temp = vesselId1;
      setVesselId1(vesselId2);
      setVesselId2(vesselId3);
      setVesselId3(temp);

      const tempP = price1;
      setPrice1(price2);
      setPrice2(price3);
      setPrice3(tempP);
    }
  };

  // Generate tailored text quote to clipboard / WhatsApp
  const generateWhatsAppPitch = () => {
    let pitch = `⛵ *EXCLUSIVE PHUKET CATAMARAN SAILING PROPOSAL* ⛵\n`;
    if (clientName) {
      pitch += `Prepared especially for: *${clientName}*\n`;
    }
    if (charterDate) {
      pitch += `Proposed Charter Date: *${charterDate}*\n`;
    }
    pitch += `\nHello! Here is a curated side-by-side catamaran comparison option for your luxurious Andaman cruise:\n\n`;

    // Vessel 1 specs
    pitch += `1️⃣ *${getTranslatedName(vessel1)}* (${vessel1.model})\n`;
    pitch += `• *Capacity:* Up to ${vessel1.capacity} guests • *Size:* ${vessel1.length}\n`;
    pitch += `• *Baths/Cabins:* ${vessel1.cabins} cabins / ${vessel1.bathrooms} bathrooms\n`;
    pitch += `• *Cruising Speed:* ${vessel1.specs.speed}\n`;
    pitch += `• *Amenities:* ${getTranslatedAmenities(vessel1).slice(0, 4).join(", ")}\n`;
    if (price1) {
      pitch += `• *Offer Rate:* ✨ *${price1}* ✨\n`;
    }
    pitch += `\n`;

    // Vessel 2 specs
    pitch += `2️⃣ *${getTranslatedName(vessel2)}* (${vessel2.model})\n`;
    pitch += `• *Capacity:* Up to ${vessel2.capacity} guests • *Size:* ${vessel2.length}\n`;
    pitch += `• *Baths/Cabins:* ${vessel2.cabins} cabins / ${vessel2.bathrooms} bathrooms\n`;
    pitch += `• *Cruising Speed:* ${vessel2.specs.speed}\n`;
    pitch += `• *Amenities:* ${getTranslatedAmenities(vessel2).slice(0, 4).join(", ")}\n`;
    if (price2) {
      pitch += `• *Offer Rate:* ✨ *${price2}* ✨\n`;
    }
    pitch += `\n`;

    // Vessel 3 if layout is 3
    if (compareCount === 3) {
      pitch += `3️⃣ *${getTranslatedName(vessel3)}* (${vessel3.model})\n`;
      pitch += `• *Capacity:* Up to ${vessel3.capacity} guests • *Size:* ${vessel3.length}\n`;
      pitch += `• *Baths/Cabins:* ${vessel3.cabins} cabins / ${vessel3.bathrooms} bathrooms\n`;
      pitch += `• *Cruising Speed:* ${vessel3.specs.speed}\n`;
      pitch += `• *Amenities:* ${getTranslatedAmenities(vessel3).slice(0, 4).join(", ")}\n`;
      if (price3) {
        pitch += `• *Offer Rate:* ✨ *${price3}* ✨\n`;
      }
      pitch += `\n`;
    }

    pitch += `Please review these personalized options and let me know your favorite selection so we can verify slot availability! 🐠🌴`;
    return pitch;
  };

  const handleCopyToClipboard = () => {
    const text = generateWhatsAppPitch();
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

  const handleShareToWhatsApp = () => {
    const text = generateWhatsAppPitch();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const generatePdfInstance = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const clean = (str: string) => {
      if (!str) return "";
      return str
        .replace(/[\uD800-\uDFFF]./g, "")
        .replace(/[^\x00-\x7F]/g, " ")
        .trim();
    };

    // Header Panel
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, "F");
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 36, 210, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    const brandName = currentAgent?.companyName
      ? currentAgent.companyName.toUpperCase()
      : "PHUKET AMAZING YACHT CHARTER";
    doc.setFontSize(brandName.length > 25 ? 12 : 14);
    doc.text(brandName, 20, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(190, 242, 219);
    const subtitleText = currentAgent?.companyAddress
      ? `ADDRESS: ${currentAgent.companyAddress.toUpperCase()}`
      : "BESPOKE PRIVATE CATAMARAN PROPOSAL";
    doc.text(subtitleText, 20, 23);

    // Right Side Brand
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("EST. 2026", 190, 17, { align: "right" });
    doc.text("LUXURY CHARTER SERVICE", 190, 25, { align: "right" });

    let currentY = 52;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PROPOSAL DETAILS", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 12;

    const drawMeta = (label: string, value: string, x: number, y: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(clean(value), x, y + 5);
    };

    drawMeta(
      "CLIENT GUEST NAME",
      clientName || "Interested Guest",
      20,
      currentY,
    );
    drawMeta("PROPOSED DATE", charterDate || "To be Determined", 110, currentY);

    currentY += 16;
    drawMeta(
      "BROKER/AGENT",
      currentAgent?.name || "Direct Booking",
      20,
      currentY,
    );
    drawMeta(
      "BROKER CONTACT",
      currentAgent?.whatsapp || currentAgent?.contactPhone || "-",
      110,
      currentY,
    );

    if (currentAgent?.companyName) {
      currentY += 16;
      drawMeta("AGENCY", currentAgent.companyName, 20, currentY);
    }

    currentY += 21;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("YACHT COMPARISON SELECTION", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 12;

    const renderVesselInPdf = (
      vessel: Catamaran,
      price: string,
      yPos: number,
    ) => {
      doc.setFillColor(250, 249, 246);
      doc.rect(20, yPos, 170, 42, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(20, yPos, 170, 42, "S");

      doc.setFillColor(5, 150, 105);
      doc.rect(20.3, yPos + 0.3, 3, 41.4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(
        clean(getTranslatedName(vessel)) + " (" + clean(vessel.model) + ")",
        28,
        yPos + 8,
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Capacity: Up to ${vessel.capacity} guests | Size: ${vessel.length} | ${vessel.cabins} cabins / ${vessel.bathrooms} baths`,
        28,
        yPos + 14,
      );
      doc.text(
        `Cruising Speed: ${vessel.specs.speed} | Built: ${vessel.specs.built}`,
        28,
        yPos + 20,
      );

      const splitDesc = doc.splitTextToSize(clean(vessel.description), 160);
      doc.text(splitDesc, 28, yPos + 26);

      if (price) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(5, 150, 105);

        const cleanPrice = price.replace(/[฿₽€$£]/g, function (match) {
          if (match === "฿") return "THB ";
          if (match === "₽") return "RUB ";
          if (match === "€") return "EUR ";
          if (match === "$") return "USD ";
          if (match === "£") return "GBP ";
          return match;
        });

        doc.text(`Custom Offer: ${cleanPrice}`, 184, yPos + 8, {
          align: "right",
        });
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text("Request Quote", 184, yPos + 8, { align: "right" });
      }

      return yPos + 48;
    };

    currentY = renderVesselInPdf(vessel1, price1, currentY);
    currentY = renderVesselInPdf(vessel2, price2, currentY);
    if (compareCount === 3) {
      if (currentY + 42 > 270) {
        doc.addPage();
        currentY = 20;
      }
      currentY = renderVesselInPdf(vessel3, price3, currentY);
    }

    if (currentY + 50 > 270) {
      doc.addPage();
      currentY = 20;
    }

    // Signatures
    currentY += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("AUTHORIZATION & SIGNATURES", 20, currentY);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 28;

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.4);

    // Broker
    doc.line(20, currentY, 80, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      currentAgent ? currentAgent.name : "Authorized Broker",
      20,
      currentY + 5,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Yacht Representative", 20, currentY + 10);

    // Client
    doc.line(130, currentY, 190, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(clientName || "Client Signature", 130, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Booking Confirmation", 130, currentY + 10);

    return doc;
  };

  const generatePdfQuote = () => {
    saveCurrentProposal();
    const doc = generatePdfInstance();
    const clientNameClean = (clientName || "quote")
      .toLowerCase()
      .replace(/\s+/g, "_");
    doc.save(`phuket_charter_proposal_${clientNameClean}.pdf`);
  };

  const sendPdfToChat = async () => {
    if (!replyToChatId) return;
    saveCurrentProposal();
    setIsSendingToChat(true);
    try {
      const docInstance = generatePdfInstance();
      const dataUri = docInstance.output("datauristring");
      const docRef = doc(db, "inquiries", replyToChatId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const history = data.chatHistory || [];
        const newMsg = {
          sender: "agent",
          agentId: currentAgent?.id || "system",
          agentName: currentAgent?.name || "Broker Representative",
          text: `📄 I have generated a custom yacht quotation for you! Please review the attached PDF.`,
          createdAt: new Date().toISOString(),
          isPdfAttached: true,
          fileName: `Quotation_${(clientName || "Proposal").replace(/\s+/g, "_")}.pdf`,
          pdfData: dataUri,
        };
        await updateDoc(docRef, {
          chatHistory: [...history, newMsg],
        });
        setSaveSuccessMsg("Quote Sent Directly to Customer!");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to send PDF to chat", err);
    } finally {
      setIsSendingToChat(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl bg-[#FAF9F6] rounded-xs shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-white gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#0F172A] text-white rounded-xs">
                <Shuffle className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-xl font-serif text-[#0F172A] tracking-wide font-bold">
                  {isClientMode && clientName
                    ? `Exclusive Yacht Proposal for ${clientName}`
                    : "Compare Catamarans Side-by-Side"}
                </h2>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-sans mt-0.5">
                  {isClientMode
                    ? "Bespoke compilation formulated for your customer"
                    : "Side-by-side yacht dimensions, accommodations, and highlights"}
                </p>
              </div>
            </div>

            {/* Controller Toolbar */}
            <div className="flex items-center gap-3">
              {/* Compare Multi count selection */}
              <div className="inline-flex rounded-xs bg-slate-100 p-1 border border-slate-200">
                <button
                  id="btn-compare-2-yachts"
                  type="button"
                  onClick={() => setCompareCount(2)}
                  className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                    compareCount === 2
                      ? "bg-[#0F172A] text-white"
                      : "text-slate-650 hover:text-slate-900"
                  }`}
                >
                  2 Yachts
                </button>
                <button
                  id="btn-compare-3-yachts"
                  type="button"
                  onClick={() => setCompareCount(3)}
                  className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                    compareCount === 3
                      ? "bg-[#0F172A] text-white"
                      : "text-slate-650 hover:text-slate-900"
                  }`}
                >
                  All 3 Yachts
                </button>
              </div>

              {/* Toggle Customer Personalization Feature */}
              {currentAgent && (
                <button
                  id="btn-toggle-client-mode"
                  type="button"
                  onClick={() => setIsClientMode(!isClientMode)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs border cursor-pointer transition-colors ${
                    isClientMode
                      ? "bg-emerald-50 text-emerald-900 border-emerald-900/20"
                      : "bg-white text-[#0F172A] hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <UserCheck className="h-3 w-3" />
                  {isClientMode
                    ? "Proposal Maker Active"
                    : "Create Quote For Client"}
                </button>
              )}

              <button
                id="comparison-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
                aria-label="Close Comparison"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Client Proposal Input Panel */}
          {isClientMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-emerald-50/40 border-b border-emerald-900/10 p-5 space-y-4"
            >
              {/* Controls and Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-700">
                    Client / Customer Name
                  </label>
                  <input
                    id="client-name-input"
                    type="text"
                    placeholder="e.g. John Smith"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs font-sans py-1.5 px-2.5 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 block">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-700">
                    Target Sailing Date
                  </label>
                  <input
                    id="client-date-input"
                    type="text"
                    placeholder="e.g. 15th December 25"
                    value={charterDate}
                    onChange={(e) => setCharterDate(e.target.value)}
                    className="w-full text-xs font-sans py-1.5 px-2.5 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-700">
                      Custom Offer Prices (Optional)
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const r1 = activeRates[vessel1.id] || VESSEL_BASE_RATES[vessel1.id];
                          const r2 = activeRates[vessel2.id] || VESSEL_BASE_RATES[vessel2.id];
                          const r3 = activeRates[vesselId3] || VESSEL_BASE_RATES[vesselId3];
                          if (r1) setPrice1(`${r1.fullday.toLocaleString()} THB (Full Day)`);
                          if (r2) setPrice2(`${r2.fullday.toLocaleString()} THB (Full Day)`);
                          if (r3) setPrice3(`${r3.fullday.toLocaleString()} THB (Full Day)`);
                        }}
                        className="text-[7.5px] bg-[#10B981]/15 text-[#047857] hover:bg-[#10B981]/25 font-sans font-bold uppercase py-0.5 px-1 rounded-sm transition-all active:scale-95 cursor-pointer select-none"
                        title="Auto-fill Fullday Standard Rates"
                      >
                        ⚡ Fullday
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const r1 = activeRates[vessel1.id] || VESSEL_BASE_RATES[vessel1.id];
                          const r2 = activeRates[vessel2.id] || VESSEL_BASE_RATES[vessel2.id];
                          const r3 = activeRates[vesselId3] || VESSEL_BASE_RATES[vesselId3];
                          if (r1) setPrice1(`${(r1.halfday || r1.sunset || 0).toLocaleString()} THB (Half Day)`);
                          if (r2) setPrice2(`${(r2.halfday || r2.sunset || 0).toLocaleString()} THB (Half Day)`);
                          if (r3) setPrice3(`${(r3.halfday || r3.sunset || 0).toLocaleString()} THB (Half Day)`);
                        }}
                        className="text-[7.5px] bg-[#10B981]/15 text-[#047857] hover:bg-[#10B981]/25 font-sans font-bold uppercase py-0.5 px-1 rounded-sm transition-all active:scale-95 cursor-pointer select-none"
                        title="Auto-fill Halfday Standard Rates"
                      >
                        ⚡ Halfday
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="col-span-1">
                      <span className="text-[7.5px] font-sans font-bold text-slate-400 block truncate">
                        {getTranslatedName(vessel1)}
                      </span>
                      <input
                        id="opt-price-1"
                        type="text"
                        placeholder="Price"
                        value={price1}
                        onChange={(e) => setPrice1(e.target.value)}
                        className="w-full text-[11px] font-sans mt-0.5 py-1 px-1.5 bg-white border border-slate-200 rounded-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-1">
                      <span className="text-[7.5px] font-sans font-bold text-slate-400 block truncate">
                        {getTranslatedName(vessel2)}
                      </span>
                      <input
                        id="opt-price-2"
                        type="text"
                        placeholder="Price"
                        value={price2}
                        onChange={(e) => setPrice2(e.target.value)}
                        className="w-full text-[11px] font-sans mt-0.5 py-1 px-1.5 bg-white border border-slate-200 rounded-xs focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-1">
                      <span className="text-[7.5px] font-sans font-bold text-slate-400 block truncate">
                        {compareCount === 3 ? getTranslatedName(vessel3) : "—"}
                      </span>
                      <input
                        id="opt-price-3"
                        type="text"
                        placeholder="Price"
                        disabled={compareCount !== 3}
                        value={compareCount === 3 ? price3 : ""}
                        onChange={(e) => setPrice3(e.target.value)}
                        className="w-full text-[11px] font-sans mt-0.5 py-1 px-1.5 bg-white border border-slate-200 rounded-xs focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Handy pricing helper info below inputs */}
                  <div className="text-[9px] text-slate-500 italic mt-1.5 font-sans leading-tight bg-slate-100/50 p-2 border border-slate-200/40 rounded-xs">
                    <span className="font-bold uppercase tracking-wider block mb-0.5 text-slate-700">
                      Guide Reference Rates:
                    </span>
                    <ul className="space-y-0.5">
                      <li>
                        •{" "}
                        <span className="font-semibold text-slate-700">
                          {getTranslatedName(vessel1)}:
                        </span>{" "}
                        Half Day:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel1.id]
                            ? formatPrice(activeRates[vessel1.id].halfday)
                            : "N/A"}
                        </span>{" "}
                        | Sunset:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel1.id]
                            ? formatPrice(activeRates[vessel1.id].sunset)
                            : "N/A"}
                        </span>{" "}
                        | Full Day:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel1.id]
                            ? formatPrice(activeRates[vessel1.id].fullday)
                            : "N/A"}
                        </span>
                      </li>
                      <li>
                        •{" "}
                        <span className="font-semibold text-slate-700">
                          {getTranslatedName(vessel2)}:
                        </span>{" "}
                        Half Day:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel2.id]
                            ? formatPrice(activeRates[vessel2.id].halfday)
                            : "N/A"}
                        </span>{" "}
                        | Sunset:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel2.id]
                            ? formatPrice(activeRates[vessel2.id].sunset)
                            : "N/A"}
                        </span>{" "}
                        | Full Day:{" "}
                        <span className="font-mono text-emerald-800">
                          {activeRates[vessel2.id]
                            ? formatPrice(activeRates[vessel2.id].fullday)
                            : "N/A"}
                        </span>
                      </li>
                      {compareCount === 3 && (
                        <li>
                          •{" "}
                          <span className="font-semibold text-slate-700">
                            {getTranslatedName(vessel3)}:
                          </span>{" "}
                          Half Day:{" "}
                          <span className="font-mono text-emerald-800">
                            {activeRates[vessel3.id]
                              ? formatPrice(
                                  activeRates[vessel3.id].halfday,
                                )
                              : "N/A"}
                          </span>{" "}
                          | Sunset:{" "}
                          <span className="font-mono text-[#047857]">
                            {activeRates[vessel3.id]
                              ? formatPrice(
                                  activeRates[vessel3.id].sunset,
                                )
                              : "N/A"}
                          </span>{" "}
                          | Full Day:{" "}
                          <span className="font-mono text-[#047857]">
                            {activeRates[vessel3.id]
                              ? formatPrice(
                                  activeRates[vessel3.id].fullday,
                                )
                              : "N/A"}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Save and New Actions */}
                <div className="flex items-end gap-2">
                  <button
                    id="btn-save-proposal"
                    type="button"
                    onClick={saveCurrentProposal}
                    className="flex-1 text-[10px] font-sans font-bold uppercase tracking-wider py-2 px-3 bg-emerald-800 text-white hover:bg-emerald-900 active:bg-emerald-950 transition-colors rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {activeProposalId ? "Update Pitch" : "Save Pitch"}
                  </button>
                  <button
                    id="btn-new-proposal"
                    type="button"
                    onClick={createNewProposal}
                    title="Clear Proposal Draft"
                    className="text-[10px] font-sans font-bold uppercase tracking-wider py-2 px-3 bg-white text-slate-705 hover:bg-slate-100 border border-slate-200 transition-colors rounded-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New
                  </button>
                  <button
                    id="btn-custom-pdf-proposal"
                    type="button"
                    onClick={generatePdfQuote}
                    title="Generate Custom PDF Brochure"
                    className="text-[10px] font-sans font-bold uppercase tracking-wider py-2 px-3 bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors rounded-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Custom PDF Quote
                  </button>
                  {replyToChatId && (
                    <button
                      type="button"
                      onClick={sendPdfToChat}
                      disabled={isSendingToChat}
                      title="Send Quotation PDF back to Live Chat"
                      className={`text-[10px] font-sans font-bold uppercase tracking-wider py-2 px-3 transition-colors rounded-xs flex items-center justify-center gap-1 cursor-pointer ${
                        isSendingToChat
                          ? "bg-slate-300 text-slate-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isSendingToChat ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Send to Chat
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Saved Profiles Row */}
              <div className="pt-3 border-t border-emerald-900/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[8.5px] font-bold text-emerald-800 uppercase tracking-widest mt-0.5 font-sans">
                    Saved Client Leads ({visibleProposals.length}):
                  </span>
                  {currentAgent && visibleProposals.length > 0 && (
                    <button
                      id="btn-export-proposals-csv"
                      type="button"
                      onClick={downloadProposalsAsCSV}
                      className="flex items-center gap-1 py-1 px-2 bg-emerald-800 hover:bg-emerald-950 text-white font-sans font-bold text-[8px] uppercase tracking-wider rounded-xs cursor-pointer transition-colors shadow-2xs border border-emerald-750/30"
                      title="Export Client Proposals (CSV) for CRM"
                    >
                      <Download className="h-2.5 w-2.5 text-emerald-300" />
                      CSV Export
                    </button>
                  )}
                </div>

                {visibleProposals.length === 0 ? (
                  <span className="text-[10px] text-slate-500 italic mt-0.5">
                    No client entries saved yet. Draft details above and click
                    "Save Pitch".
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[72px] overflow-y-auto w-full">
                    {visibleProposals.map((proposal) => {
                      const isActive = activeProposalId === proposal.id;
                      return (
                        <div
                          key={proposal.id}
                          onClick={() => loadProposal(proposal)}
                          className={`group/badge flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-sans font-medium transition-all cursor-pointer border ${
                            isActive
                              ? "bg-emerald-800 text-white border-emerald-800 shadow-xs font-semibold"
                              : "bg-white hover:bg-emerald-50 text-slate-755 hover:text-emerald-900 border-slate-200"
                          }`}
                        >
                          <span className="truncate max-w-[120px]">
                            {proposal.clientName}
                          </span>
                          {proposal.charterDate && (
                            <span
                              className={`opacity-80 text-[7.5px] border-l pl-1.5 ${isActive ? "border-white/30" : "border-slate-300"}`}
                            >
                              {proposal.charterDate}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => deleteProposal(proposal.id, e)}
                            className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                              isActive
                                ? "text-white/80 hover:text-white"
                                : "text-slate-400 hover:text-red-700"
                            }`}
                            title="Delete Lead"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Save Feedback Toast Alert inline */}
                {saveSuccessMsg && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[9.5px] text-emerald-800 font-bold uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-xs ml-auto font-sans"
                  >
                    ✨ {saveSuccessMsg}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}

          {/* Swap Columns Button (Desktop Only) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:flex">
            <button
              id="comparison-swap-btn"
              onClick={handleSwap}
              type="button"
              title="Rotate Left/Right"
              className="h-10 w-10 flex items-center justify-center bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-full shadow-lg border border-white hover:scale-105 active:scale-95 cursor-pointer transition-all"
            >
              <Shuffle className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Table / Grid Body */}
          <div
            className={`grid grid-cols-1 ${
              compareCount === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
            } divide-y lg:divide-y-0 divide-slate-200 lg:divide-x divide-slate-200 overflow-y-auto max-h-[60vh]`}
          >
            {/* Column 1: Vessel A */}
            <div className="p-6 sm:p-8 flex flex-col space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-sans font-bold text-slate-500 mb-1">
                  Yacht Selection A
                </label>
                <select
                  id="comparison-selector-vessel-1"
                  value={vesselId1}
                  onChange={(e) => handleVessel1Change(e.target.value)}
                  className="w-full text-sm font-sans font-semibold text-[#0F172A] border border-slate-200 py-1.5 px-3 rounded-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {CATAMARANS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getTranslatedName(v)} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Card */}
              <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-slate-950 border border-slate-200/50 shadow-xs">
                <img
                  src={vessel1.image}
                  alt={getTranslatedName(vessel1)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                  <span className="text-[8px] bg-amber-400 text-[#0F172A] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-2xs font-sans">
                    {vessel1.model}
                  </span>
                  <h3 className="text-lg font-serif font-normal italic text-white mt-1 leading-tight">
                    {getTranslatedName(vessel1)}
                  </h3>
                </div>
              </div>

              {/* Comparison Parameters */}
              <div className="space-y-4">
                {/* Dynamically Inject Custom Proposal Offered Price badge if set */}
                {isClientMode && price1 && (
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-xs flex items-center justify-between font-sans">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Offered Rate
                    </span>
                    <span className="text-sm font-extrabold tracking-wide">
                      {price1}
                    </span>
                  </div>
                )}

                {/* Specs list block */}
                <div className="bg-white rounded-xs p-4 border border-slate-200 shadow-3xs space-y-3 font-sans">
                  {/* Capacity Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-blue-600" /> Max Capacity
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Up to {vessel1.capacity} Guests
                    </span>
                  </div>

                  {/* Length Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Ship className="h-3 w-3 text-sky-600" /> Fleet Length
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel1.length}
                    </span>
                  </div>

                  {/* Cabins & Baths Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                      <Ship className="h-3 w-3 text-amber-600" /> Cabin & AC
                      Layout
                    </span>
                    <span className="text-xs font-semibold text-slate-900 text-right">
                      {vessel1.cabins} Cabins / {vessel1.bathrooms} Baths
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5 leading-tight">
                        {vessel1.id === "the-best" && "Full Cabin AC"}
                        {vessel1.id === "namaste" &&
                          "Saloon AC only (No Cabin AC)"}
                        {vessel1.id === "the-one" &&
                          "Non-AC (Natural ventilation)"}
                      </span>
                    </span>
                  </div>

                  {/* Speed Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Compass className="h-3 w-3 text-emerald-600" />{" "}
                      Operational Speed
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel1.specs.speed}
                    </span>
                  </div>

                  {/* Build Year Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-violet-600" /> Build
                      details
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel1.specs.built}
                    </span>
                  </div>

                  {/* Crew members Parameter */}
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Settings className="h-3 w-3 text-teal-600" /> Staff
                      Assigned
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel1.specs.crew} experienced members
                    </span>
                  </div>

                  {/* Engines Parameter */}
                  {vessel1.specs.engines && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-rose-600" /> Engine
                        Power
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.engines}
                      </span>
                    </div>
                  )}

                  {/* Generator Parameter */}
                  {vessel1.specs.generator && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-orange-600" />{" "}
                        Generator
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.generator}
                      </span>
                    </div>
                  )}

                  {/* Inverter Parameter */}
                  {vessel1.specs.inverter && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-amber-600" /> Inverter
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.inverter}
                      </span>
                    </div>
                  )}

                  {/* Winch Parameter */}
                  {vessel1.specs.winch && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-lime-600" /> Sail
                        Winches
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.winch}
                      </span>
                    </div>
                  )}

                  {/* Aircon System Parameter */}
                  {vessel1.specs.airconSystem && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-cyan-600" /> AirCon
                        Chiller
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.airconSystem}
                      </span>
                    </div>
                  )}

                  {/* Fishfinder Parameter */}
                  {vessel1.specs.fishfinder && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-blue-600" />{" "}
                        Fishfinder
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel1.specs.fishfinder}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suitability Banner */}
                {getTranslatedSuitability(vessel1) && (
                  <div className="p-3 bg-emerald-50 text-[#0F172A] rounded-xs border border-emerald-900/10 flex items-start gap-2">
                    <Award className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-emerald-900 font-bold font-sans">
                        Ideal Excursion Mode
                      </p>
                      <p className="text-[10.5px] font-sans text-slate-700 font-medium mt-0.5 leading-tight">
                        {getTranslatedSuitability(vessel1)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Amenities List */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                    Selected Onboard Toys
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getTranslatedAmenities(vessel1).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-sm border border-slate-200"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bullets Key Highlights */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                    Highlights & Full-board Inclusions
                  </p>
                  <div className="space-y-2">
                    {getTranslatedHighlights(vessel1).map(
                      (highlight, index) => (
                        <div key={index} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-[10.5px] text-slate-650 font-sans leading-relaxed">
                            {highlight}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Booking CTA */}
              <div className="pt-4 border-t border-slate-250 mt-auto">
                <button
                  id={`btn-comparison-select-${vessel1.id}`}
                  onClick={() => {
                    onSelectVessel(vessel1.id);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer text-center transition-colors shadow-xs"
                >
                  Configure & Book {getTranslatedName(vessel1)}
                </button>
              </div>
            </div>

            {/* Column 2: Vessel B */}
            <div className="p-6 sm:p-8 flex flex-col space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-sans font-bold text-slate-500 mb-1">
                  Yacht Selection B
                </label>
                <select
                  id="comparison-selector-vessel-2"
                  value={vesselId2}
                  onChange={(e) => handleVessel2Change(e.target.value)}
                  className="w-full text-sm font-sans font-semibold text-[#0F172A] border border-slate-200 py-1.5 px-3 rounded-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  {CATAMARANS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getTranslatedName(v)} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Card */}
              <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-slate-950 border border-slate-200/50 shadow-xs">
                <img
                  src={vessel2.image}
                  alt={getTranslatedName(vessel2)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                  <span className="text-[8px] bg-amber-400 text-[#0F172A] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-2xs font-sans">
                    {vessel2.model}
                  </span>
                  <h3 className="text-lg font-serif font-normal italic text-white mt-1 leading-tight">
                    {getTranslatedName(vessel2)}
                  </h3>
                </div>
              </div>

              {/* Comparison Parameters */}
              <div className="space-y-4">
                {/* Dynamically Inject Custom Proposal Offered Price badge if set */}
                {isClientMode && price2 && (
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-xs flex items-center justify-between font-sans">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Offered Rate
                    </span>
                    <span className="text-sm font-extrabold tracking-wide">
                      {price2}
                    </span>
                  </div>
                )}

                {/* Specs list block */}
                <div className="bg-white rounded-xs p-4 border border-slate-200 shadow-3xs space-y-3 font-sans">
                  {/* Capacity Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-blue-600" /> Max Capacity
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Up to {vessel2.capacity} Guests
                    </span>
                  </div>

                  {/* Length Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Ship className="h-3 w-3 text-sky-600" /> Fleet Length
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel2.length}
                    </span>
                  </div>

                  {/* Cabins & Baths Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                      <Ship className="h-3 w-3 text-amber-600" /> Cabin & AC
                      Layout
                    </span>
                    <span className="text-xs font-semibold text-slate-900 text-right">
                      {vessel2.cabins} Cabins / {vessel2.bathrooms} Baths
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5 leading-tight">
                        {vessel2.id === "the-best" && "Full Cabin AC"}
                        {vessel2.id === "namaste" &&
                          "Saloon AC only (No Cabin AC)"}
                        {vessel2.id === "the-one" &&
                          "Non-AC (Natural ventilation)"}
                      </span>
                    </span>
                  </div>

                  {/* Speed Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Compass className="h-3 w-3 text-emerald-600" />{" "}
                      Operational Speed
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel2.specs.speed}
                    </span>
                  </div>

                  {/* Build Year Parameter */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-violet-600" /> Build
                      details
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel2.specs.built}
                    </span>
                  </div>

                  {/* Crew members Parameter */}
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Settings className="h-3 w-3 text-teal-600" /> Staff
                      Assigned
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {vessel2.specs.crew} experienced members
                    </span>
                  </div>

                  {/* Engines Parameter */}
                  {vessel2.specs.engines && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-rose-600" /> Engine
                        Power
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.engines}
                      </span>
                    </div>
                  )}

                  {/* Generator Parameter */}
                  {vessel2.specs.generator && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-orange-600" />{" "}
                        Generator
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.generator}
                      </span>
                    </div>
                  )}

                  {/* Inverter Parameter */}
                  {vessel2.specs.inverter && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-amber-600" /> Inverter
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.inverter}
                      </span>
                    </div>
                  )}

                  {/* Winch Parameter */}
                  {vessel2.specs.winch && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-lime-600" /> Sail
                        Winches
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.winch}
                      </span>
                    </div>
                  )}

                  {/* Aircon System Parameter */}
                  {vessel2.specs.airconSystem && (
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-cyan-600" /> AirCon
                        Chiller
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.airconSystem}
                      </span>
                    </div>
                  )}

                  {/* Fishfinder Parameter */}
                  {vessel2.specs.fishfinder && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-blue-600" />{" "}
                        Fishfinder
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                        {vessel2.specs.fishfinder}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suitability Banner */}
                {getTranslatedSuitability(vessel2) && (
                  <div className="p-3 bg-emerald-50 text-[#0F172A] rounded-xs border border-emerald-900/10 flex items-start gap-2">
                    <Award className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-emerald-900 font-bold font-sans">
                        Ideal Excursion Mode
                      </p>
                      <p className="text-[10.5px] font-sans text-slate-700 font-medium mt-0.5 leading-tight">
                        {getTranslatedSuitability(vessel2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Amenities List */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                    Selected Onboard Toys
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getTranslatedAmenities(vessel2).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-sm border border-slate-200"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bullets Key Highlights */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                    Highlights & Full-board Inclusions
                  </p>
                  <div className="space-y-2">
                    {getTranslatedHighlights(vessel2).map(
                      (highlight, index) => (
                        <div key={index} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="text-[10.5px] text-slate-650 font-sans leading-relaxed">
                            {highlight}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Booking CTA */}
              <div className="pt-4 border-t border-slate-250 mt-auto">
                <button
                  id={`btn-comparison-select-${vessel2.id}`}
                  onClick={() => {
                    onSelectVessel(vessel2.id);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer text-center transition-colors shadow-xs"
                >
                  Configure & Book {getTranslatedName(vessel2)}
                </button>
              </div>
            </div>

            {/* Column 3: Vessel C (Only rendered if compareCount is 3) */}
            {compareCount === 3 && (
              <div className="p-6 sm:p-8 flex flex-col space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-sans font-bold text-slate-500 mb-1">
                    Yacht Selection C
                  </label>
                  <select
                    id="comparison-selector-vessel-3"
                    value={vesselId3}
                    onChange={(e) => handleVessel3Change(e.target.value)}
                    className="w-full text-sm font-sans font-semibold text-[#0F172A] border border-slate-200 py-1.5 px-3 rounded-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    {CATAMARANS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getTranslatedName(v)} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Photo Card */}
                <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-slate-950 border border-slate-200/50 shadow-xs">
                  <img
                    src={vessel3.image}
                    alt={getTranslatedName(vessel3)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                    <span className="text-[8px] bg-amber-400 text-[#0F172A] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-2xs font-sans">
                      {vessel3.model}
                    </span>
                    <h3 className="text-lg font-serif font-normal italic text-white mt-1 leading-tight">
                      {getTranslatedName(vessel3)}
                    </h3>
                  </div>
                </div>

                {/* Comparison Parameters */}
                <div className="space-y-4">
                  {/* Dynamically Inject Custom Proposal Offered Price badge if set */}
                  {isClientMode && price3 && (
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-xs flex items-center justify-between font-sans">
                      <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Offered Rate
                      </span>
                      <span className="text-sm font-extrabold tracking-wide">
                        {price3}
                      </span>
                    </div>
                  )}

                  {/* Specs list block */}
                  <div className="bg-white rounded-xs p-4 border border-slate-200 shadow-3xs space-y-3 font-sans">
                    {/* Capacity Parameter */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-blue-600" /> Max Capacity
                      </span>
                      <span className="text-xs font-semibold text-slate-950">
                        Up to {vessel3.capacity} Guests
                      </span>
                    </div>

                    {/* Length Parameter */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Ship className="h-3 w-3 text-sky-600" /> Fleet Length
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {vessel3.length}
                      </span>
                    </div>

                    {/* Cabins & Baths Parameter */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                        <Ship className="h-3 w-3 text-amber-600" /> Cabin & AC
                        Layout
                      </span>
                      <span className="text-xs font-semibold text-slate-900 text-right">
                        {vessel3.cabins} Cabins / {vessel3.bathrooms} Baths
                        <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5 leading-tight">
                          {vessel3.id === "the-best" && "Full Cabin AC"}
                          {vessel3.id === "namaste" &&
                            "Saloon AC only (No Cabin AC)"}
                          {vessel3.id === "the-one" &&
                            "Non-AC (Natural ventilation)"}
                        </span>
                      </span>
                    </div>

                    {/* Speed Parameter */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Compass className="h-3 w-3 text-emerald-600" />{" "}
                        Operational Speed
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {vessel3.specs.speed}
                      </span>
                    </div>

                    {/* Build Year Parameter */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-violet-600" /> Build
                        details
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {vessel3.specs.built}
                      </span>
                    </div>

                    {/* Crew members Parameter */}
                    <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Settings className="h-3 w-3 text-teal-600" /> Staff
                        Assigned
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {vessel3.specs.crew} experienced members
                      </span>
                    </div>

                    {/* Engines Parameter */}
                    {vessel3.specs.engines && (
                      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-rose-600" /> Engine
                          Power
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.engines}
                        </span>
                      </div>
                    )}

                    {/* Generator Parameter */}
                    {vessel3.specs.generator && (
                      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-orange-600" />{" "}
                          Generator
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.generator}
                        </span>
                      </div>
                    )}

                    {/* Inverter Parameter */}
                    {vessel3.specs.inverter && (
                      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-amber-600" />{" "}
                          Inverter
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.inverter}
                        </span>
                      </div>
                    )}

                    {/* Winch Parameter */}
                    {vessel3.specs.winch && (
                      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-lime-600" /> Sail
                          Winches
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.winch}
                        </span>
                      </div>
                    )}

                    {/* Aircon System Parameter */}
                    {vessel3.specs.airconSystem && (
                      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-cyan-600" /> AirCon
                          Chiller
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.airconSystem}
                        </span>
                      </div>
                    )}

                    {/* Fishfinder Parameter */}
                    {vessel3.specs.fishfinder && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Settings className="h-3 w-3 text-blue-600" />{" "}
                          Fishfinder
                        </span>
                        <span className="text-xs font-semibold text-slate-900 text-right max-w-[180px] leading-tight">
                          {vessel3.specs.fishfinder}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Suitability Banner */}
                  {getTranslatedSuitability(vessel3) && (
                    <div className="p-3 bg-emerald-50 text-[#0F172A] rounded-xs border border-emerald-900/10 flex items-start gap-2">
                      <Award className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-emerald-900 font-bold font-sans">
                          Ideal Excursion Mode
                        </p>
                        <p className="text-[10.5px] font-sans text-slate-700 font-medium mt-0.5 leading-tight">
                          {getTranslatedSuitability(vessel3)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Amenities List */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                      Selected Onboard Toys
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {getTranslatedAmenities(vessel3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-sm border border-slate-200"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bullets Key Highlights */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] font-sans pb-1 mb-2 border-b border-slate-200/60">
                      Highlights & Full-board Inclusions
                    </p>
                    <div className="space-y-2">
                      {getTranslatedHighlights(vessel3).map(
                        (highlight, index) => (
                          <div key={index} className="flex items-start gap-1.5">
                            <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[10.5px] text-slate-650 font-sans leading-relaxed">
                              {highlight}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Selected Booking CTA */}
                <div className="pt-4 border-t border-slate-250 mt-auto">
                  <button
                    id={`btn-comparison-select-${vessel3.id}`}
                    onClick={() => {
                      onSelectVessel(vessel3.id);
                      onClose();
                    }}
                    className="w-full py-2.5 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer text-center transition-colors shadow-xs"
                  >
                    Configure & Book {getTranslatedName(vessel3)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer for Proposal Export & Pitching */}
          {isClientMode && (
            <div className="p-6 bg-slate-100/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-sans">
                <Sparkles className="h-4 w-4 text-emerald-700 animate-pulse" />
                <span>
                  Format a high-converting quotation list with custom pricing to
                  dispatch directly via WhatsApp or clipboard!
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  id="btn-copy-pitch"
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-[#0F172A]/20 bg-white hover:bg-slate-50 text-[#0F172A] text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors w-full sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Pitch Text
                </button>
                <button
                  id="btn-whatsapp-pitch"
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors w-full sm:w-auto"
                >
                  <Send className="h-3.5 w-3.5" /> Send to WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Copy Toast Indicator */}
          <AnimatePresence>
            {showCopyToast && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-4 py-2 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl border border-slate-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Pitch
                Copied to Clipboard!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer branding note */}
          <div className="px-6 py-3 border-t border-slate-200 bg-white text-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
              {currentAgent?.companyName
                ? `${currentAgent.companyName}${currentAgent.companyAddress ? ` • ${currentAgent.companyAddress}` : ""} • Handcrafted Sailing Selection`
                : "Phuket Amazing Yacht Charter • Handcrafted Sailing Selection"}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
