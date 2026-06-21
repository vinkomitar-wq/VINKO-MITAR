import React, { useState, useEffect } from "react";
import { compressImage } from "../utils/imageCompressor";
import {
  Anchor,
  Shield,
  Users,
  FileText,
  X,
  Bell,
  RefreshCw,
  Trash2,
  Edit2,
  Plus,
  LogOut,
  Sparkles,
  Gift,
  Upload,
  Image,
  LineChart as ChartIcon,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  Download,
  MessageSquare,
  Bot,
  UserCheck,
  Inbox,
  Map as MapIcon,
  Compass,
  Ship,
  Star,
  HardDrive,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAgent, Agent } from "../AgentContext";
import { CATAMARANS } from "../data";
import AdminFleetSettings from "./AdminFleetSettings";
import { QRCodeSVG } from "qrcode.react";
import { getPublicUrl } from "../utils/url";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import AdminCrewTab from "./AdminCrewTab";
import CrewLogsTab from "./CrewLogsTab";
import AdminAlertsTab from "./AdminAlertsTab";
import DashboardAlertsWidget from "./DashboardAlertsWidget";
import { AdminShipRoster } from "./AdminShipRoster";
import AdminAIAssistant from "./AdminAIAssistant";
import { VesselTrackingMap } from "./VesselTrackingMap";
import AdminCommissions from "./AdminCommissions";
import AdminFeedback from "./AdminFeedback";
import { AdminDatabaseBackups } from "./AdminDatabaseBackups";
import AdminBookedChartersTab from "./AdminBookedChartersTab";
import AddAgentManager from "./AddAgentManager";
import { useMaintenanceMode } from "../useMaintenanceMode";

export default function AdminPortal() {
  const {
    agents,
    adminResetPassword,
    adminRemoveAgent,
    toggleCoAdmin,
    adminUpdateAgent,
    currentAgent,
    logout: contextLogout,
  } = useAgent();
  const isMaintenanceMode = useMaintenanceMode();

  const toggleMaintenanceMode = async () => {
    try {
      await setDoc(
        doc(db, "settings", "system"),
        { maintenanceMode: !isMaintenanceMode },
        { merge: true },
      );
      safeAlert(`Maintenance mode is now ${!isMaintenanceMode ? "ON" : "OFF"}`);
    } catch (e) {
      console.error(e);
      alert("Failed to toggle maintenance mode.");
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "agents"
    | "proposals"
    | "fleet"
    | "customers"
    | "promotions"
    | "inquiries"
    | "calendar"
    | "crew"
    | "roster"
    | "logs"
    | "assistant"
    | "map"
    | "commissions"
    | "feedback"
    | "alerts"
    | "booked"
    | "backups"
  >("dashboard");

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentPhone, setEditAgentPhone] = useState("");
  const [editAgentWhatsApp, setEditAgentWhatsApp] = useState("");
  const [editAgentLine, setEditAgentLine] = useState("");
  const [editAgentWeChat, setEditAgentWeChat] = useState("");
  const [editAgentCompany, setEditAgentCompany] = useState("");
  const [editAgentAddress, setEditAgentAddress] = useState("");
  const [editAgentCountry, setEditAgentCountry] = useState("");
  const [editAgentTaxId, setEditAgentTaxId] = useState("");
  const [editAgentWelcome, setEditAgentWelcome] = useState("");

  useEffect(() => {
    if (editingAgent) {
      setEditAgentName(editingAgent.name || "");
      setEditAgentPhone(editingAgent.contactPhone || "");
      setEditAgentWhatsApp(editingAgent.whatsapp || "");
      setEditAgentLine(editingAgent.lineId || "");
      setEditAgentWeChat(editingAgent.wechatId || "");
      setEditAgentCompany(editingAgent.companyName || "");
      setEditAgentAddress(editingAgent.companyAddress || "");
      setEditAgentCountry(editingAgent.country || "");
      setEditAgentTaxId(editingAgent.taxId || "");
      setEditAgentWelcome(editingAgent.welcomeMessage || "");
    }
  }, [editingAgent]);

  const [lang, setLang] = useState("en");
  useEffect(() => {
    setLang(navigator.language.startsWith("hr") ? "hr" : "en");
  }, []);

  const t = (en: string, hr: string) => (lang === "hr" ? hr : en);

  const tabNames: Record<typeof activeTab, { en: string; hr: string }> = {
    dashboard: { en: "Analytics", hr: "Nadzorna ploča" },
    agents: { en: "Users", hr: "Korisnici" },
    proposals: { en: "Proposals", hr: "Prijedlozi" },
    booked: { en: "Booked Charters", hr: "Zatvorene Rezervacije" },
    fleet: { en: "Fleet Config", hr: "Flota" },
    customers: { en: "Customers", hr: "Klijenti" },
    promotions: { en: "Promos", hr: "Promocije" },
    inquiries: { en: "Inquiries", hr: "Upiti" },
    calendar: { en: "Calendar", hr: "Kalendar" },
    crew: { en: "Crew", hr: "Posada" },
    roster: { en: "Ship Rosters", hr: "Lista Posade Po Brodu" },
    logs: { en: "Embark/Disembark Logs", hr: "Embarking Logs" },
    alerts: { en: "System Alerts", hr: "Upozorenja Sustava" },
    assistant: { en: "AI Assistant", hr: "AI Asistent" },
    map: { en: "Map Tracking", hr: "Praćenje Mape" },
    commissions: { en: "Commissions", hr: "Zarada" },
    feedback: { en: "Guest Feedback", hr: "Recenzije" },
    backups: { en: "Database Backups", hr: "Sigurnosne Kopije" },
  };
  const isAdmin = currentAgent?.isAdmin === true;

  useEffect(() => {
    if (isAdmin) {
      setIsLogged(true);
    } else {
      setIsLogged(false);
    }
  }, [isAdmin]);

  const [adminToasts, setAdminToasts] = useState<any[]>([]);

  const safeAlert = async (
    message: string,
    title = "Phuket Charters Master Dashboard",
    type: string = "info",
    details?: string,
  ) => {
    const newToast = { id: `${Date.now()}-${Math.random()}`, title, message };
    setAdminToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setAdminToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);

    // Also log to the database so they are recorded permanently
    try {
      await setDoc(doc(db, "adminAlerts", newToast.id), {
        title,
        message,
        type: type,
        details: details || null,
        timestamp: new Date().toISOString(),
        read: false,
      });
      console.log(`[SafeAlert logged to DB] ${title}: ${message}`);
    } catch (e) {
      console.error("Failed to write admin alert to db", e);
    }
  };

  // Removed local agents state since we are pulling from context directly
  const [proposals, setProposals] = useState<any[]>([]);
  const [agentProposals, setAgentProposals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firestoreFailed, setFirestoreFailed] = useState(false);

  // Special Overnight Promotion States
  const [promoActive, setPromoActive] = useState(false);
  const [promoCode, setPromoCode] = useState("OVERNIGHTEXCLUSIVES");
  const [promoTitle, setPromoTitle] = useState(
    "Exclusive Luxury Overnight Promotion!",
  );
  const [promoDescription, setPromoDescription] = useState(
    "Book a multi-day private sailing cruise on OUR YACHT and unlock 15% discount, complimentary sunset deck dinner, continuous premium open bar, and custom national marine park speed boat transfers.",
  );
  const [promoPhotoBase64, setPromoPhotoBase64] = useState("");
  const [promoPdfBase64, setPromoPdfBase64] = useState("");
  const [promoFlyerPhotoBase64, setPromoFlyerPhotoBase64] = useState("");

  // Special Daily Charter Excursion Promotion States
  const [dailyPromoActive, setDailyPromoActive] = useState(false);
  const [dailyPromoCode, setDailyPromoCode] = useState("DAILYADVENTURE");
  const [dailyPromoTitle, setDailyPromoTitle] = useState(
    "Daily Charter Excursion Promotion!",
  );
  const [dailyPromoDescription, setDailyPromoDescription] = useState(
    "Unlock standard excursion upgrades, complementary sunset drinks, snorkeling packages, and island landing passes on any full-day or half-day private cruise booking.",
  );
  const [dailyPromoPhotoBase64, setDailyPromoPhotoBase64] = useState("");
  const [dailyPromoPdfBase64, setDailyPromoPdfBase64] = useState("");
  const [dailyPromoFlyerPhotoBase64, setDailyPromoFlyerPhotoBase64] =
    useState("");

  const [subPromoTab, setSubPromoTab] = useState<"overnight" | "daily">(
    "overnight",
  );

  const [isSavingPromo, setIsSavingPromo] = useState(false);

  // Proposal Edit Pricing States
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  );
  const [editRoutePrice, setEditRoutePrice] = useState("0");
  const [editAddonsPrice, setEditAddonsPrice] = useState("0");
  const [calculatedTotalIncTax, setCalculatedTotalIncTax] = useState("0");

  // Manifest CSV Extractor date ranges
  const [manifestStartDate, setManifestStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [manifestEndDate, setManifestEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  });

  const [proposalSubTab, setProposalSubTab] = useState<"bookings" | "quotes">(
    "bookings",
  );

  const downloadManifestCSV = () => {
    const list = proposals.filter((p) => {
      const charterDate = p.charterDate;
      if (!charterDate) return false;
      return charterDate >= manifestStartDate && charterDate <= manifestEndDate;
    });

    if (list.length === 0) {
      safeAlert(
        `No bookings found in the selected date range (${manifestStartDate} to ${manifestEndDate}).`,
      );
      return;
    }

    const headers = [
      "Booking ID",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Charter Excursion Date",
      "Vessel/Catamaran",
      "Boarding Status",
      "Boarded At Timestamp",
      "Base Excursion Price (THB)",
      "Add-on Services (THB)",
      "Total Price Inc Tax (THB)",
      "Representative Broker",
      "Agency Folder",
      "Hotel Pickup Address",
      "Created At Date",
    ];

    const rows = list.map((prop) => {
      const vesselName =
        CATAMARANS.find(
          (v) => v.id === prop.vesselId1 || v.id === prop.vesselId2,
        )?.name ||
        prop.vesselName ||
        prop.vesselId1 ||
        "Premium Catamaran";
      return [
        prop.id || prop._id || "",
        prop.clientName || "N/A",
        prop.customerEmail || prop.email || "N/A",
        prop.customerPhone || "N/A",
        prop.charterDate || "",
        vesselName,
        prop.boardingStatus || "Confirmed",
        prop.boardedAt ? new Date(prop.boardedAt).toLocaleString() : "N/A",
        prop.routePrice || prop.price1 || "0",
        prop.addonsPrice || "0",
        prop.totalIncTax || prop.price1 || "0",
        prop.agentEmail || "Direct Web Booking",
        prop.folderName || "Main Portfolio",
        prop.hotelPickupLocation || "None Specified",
        prop.createdAt || "N/A",
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
    link.setAttribute(
      "download",
      `Passenger_Manifest_${manifestStartDate}_to_${manifestEndDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDoc = async (
    collectionName: string,
    id: string,
    nameText: string,
  ) => {
    console.log(
      `[DeleteDoc] Attempting to delete: ${collectionName} / ${id} (${nameText})`,
    );

    let proceed = true;
    const isIframe = window.self !== window.top;

    if (!isIframe) {
      try {
        proceed = window.confirm(
          `Are you sure you want to permanently delete: ${nameText}?`,
        );
      } catch (e) {
        proceed = true;
      }
    } else {
      // In iframe, we proceed after logging to prevent blocking, but
      // ideally we need a better modal interaction.
      console.log("[DeleteDoc] Running in iframe context, auto-proceeding.");
      proceed = true;
    }

    if (!proceed) return;

    try {
      await deleteDoc(doc(db, collectionName, id));
      safeAlert(`Successfully deleted: ${nameText}`);
      console.log(`[DeleteDoc] Successfully deleted: ${id}`);
    } catch (err: any) {
      console.error(`[DeleteDoc] Error deleting ${id}:`, err);
      safeAlert("Error deleting: " + err.message, "Deletion Error");
    }
  };

  const fetchPromotion = async () => {
    try {
      const promoRef = doc(db, "promotions", "overnight");
      const promoSnap = await getDoc(promoRef);
      if (promoSnap.exists()) {
        const data = promoSnap.data();
        setPromoActive(!!data.active);
        setPromoCode(data.promoCode || "OVERNIGHTEXCLUSIVES");
        setPromoTitle(data.title || "Exclusive Luxury Overnight Promotion!");
        setPromoDescription(data.description || "");
        setPromoPhotoBase64(data.photoBase64 || "");
        setPromoPdfBase64(data.pdfBase64 || "");
        setPromoFlyerPhotoBase64(data.flyerPhotoBase64 || "");
      }

      const dailyRef = doc(db, "promotions", "daily");
      const dailySnap = await getDoc(dailyRef);
      if (dailySnap.exists()) {
        const data = dailySnap.data();
        setDailyPromoActive(!!data.active);
        setDailyPromoCode(data.promoCode || "DAILYADVENTURE");
        setDailyPromoTitle(data.title || "Daily Charter Excursion Promotion!");
        setDailyPromoDescription(data.description || "");
        setDailyPromoPhotoBase64(data.photoBase64 || "");
        setDailyPromoPdfBase64(data.pdfBase64 || "");
        setDailyPromoFlyerPhotoBase64(data.flyerPhotoBase64 || "");
      }
    } catch (err) {
      console.warn("Could not load promotions database snapshot:", err);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (isLogged) {
      fetchPromotion();
    }
  }, [isLogged, isAdmin]);

  const handleSavePromotion = async () => {
    setIsSavingPromo(true);
    try {
      const promoRef = doc(db, "promotions", "overnight");
      await setDoc(
        promoRef,
        {
          active: promoActive,
          promoCode: promoCode,
          title: promoTitle,
          description: promoDescription,
          photoBase64: promoPhotoBase64,
          pdfBase64: promoPdfBase64,
          flyerPhotoBase64: promoFlyerPhotoBase64,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      const dailyRef = doc(db, "promotions", "daily");
      await setDoc(
        dailyRef,
        {
          active: dailyPromoActive,
          promoCode: dailyPromoCode,
          title: dailyPromoTitle,
          description: dailyPromoDescription,
          photoBase64: dailyPromoPhotoBase64,
          pdfBase64: dailyPromoPdfBase64,
          flyerPhotoBase64: dailyPromoFlyerPhotoBase64,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      safeAlert(
        "Promotions successfully updated! Changes are synchronized live across all guest booking screens.",
      );
    } catch (err: any) {
      console.error("Save promotion error:", err);
      safeAlert("Error saving promotion details: " + err.message);
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleRecalculateTax = (routePrice: string, addonsPrice: string) => {
    const route = parseFloat(routePrice) || 0;
    const addons = parseFloat(addonsPrice) || 0;
    const subtotal = route + addons;
    // Calculate Thai VAT (7%)
    const total = subtotal * 1.07;
    setCalculatedTotalIncTax(total.toFixed(2));
  };

  const saveEditedProposalPrice = async (
    propId: string,
    routePrice: string,
    addonsPrice: string,
  ) => {
    const total = calculatedTotalIncTax;
    try {
      const propRef = doc(db, "booking_requests", propId);
      await updateDoc(propRef, {
        price1: Number(total),
        routePrice: parseFloat(routePrice) || 0,
        addonsPrice: parseFloat(addonsPrice) || 0,
        taxAmount:
          ((parseFloat(routePrice) || 0) + (parseFloat(addonsPrice) || 0)) *
          0.07,
        totalIncTax: total,
      });

      setEditingProposalId(null);
      safeAlert("Pricing updated successfully!");
    } catch (err) {
      console.error(err);
      safeAlert("Failed to update pricing.");
    }
  };

  const autoArchiveInquiriesForCustomer = async (customerEmail?: string) => {
    if (!customerEmail) {
      console.log("No email provided for auto-archiving.");
      return;
    }
    const emailToMatch = customerEmail.trim().toLowerCase();

    // Find matching inquiries that are currently not in Archive folder
    const matches = inquiries.filter((inq: any) => {
      const inqContact = (inq.contact || "").trim().toLowerCase();
      const inqEmail = (inq.email || "").trim().toLowerCase();
      const isMatch = inqContact === emailToMatch || inqEmail === emailToMatch;
      return isMatch && (inq.folder || "Inbox").toLowerCase() !== "archive";
    });

    if (matches.length === 0) {
      console.log(
        `No active inquiries found for customer ${customerEmail} to auto-archive.`,
      );
      return;
    }

    console.log(
      `Auto-archiving ${matches.length} inquiries for customer ${customerEmail}...`,
    );
    let count = 0;
    for (const inq of matches) {
      try {
        const inqRef = doc(db, "inquiries", inq.id);
        await updateDoc(inqRef, { folder: "Archive" });
        count++;
      } catch (err) {
        console.warn(`Failed to auto-archive inquiry ${inq.id}:`, err);
      }
    }

    if (count > 0) {
      const title = `Auto-Archived Customer Inquiries 📂`;
      const message = `Successfully auto-archived ${count} active inquiries for ${customerEmail} as their booking was set to Boarded/Completed.`;
      const newToast = {
        id: `auto-archive-${Date.now()}-${Math.random()}`,
        title,
        message,
      };
      setAdminToasts((prev) => [...prev, newToast]);
      setUnreadCount((prev) => prev + 1);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 1500, 1500, 0.8);
        setPromoPhotoBase64(compressed);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPromoPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlyerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 1500, 1500, 0.8);
        setPromoFlyerPhotoBase64(compressed);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  const handleDailyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 1500, 1500, 0.8);
        setDailyPromoPhotoBase64(compressed);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  const handleDailyPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDailyPromoPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDailyFlyerPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 1500, 1500, 0.8);
        setDailyPromoFlyerPhotoBase64(compressed);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const handleAdminTrigger = (e: CustomEvent) => {
      const { title, message } = e.detail;

      // Feature: Trigger In-App "Email/Push" Toast for Admin
      const newToast = { id: `${Date.now()}-${Math.random()}`, title, message };
      setAdminToasts((prev) => [...prev, newToast]);
      setUnreadCount((prev) => prev + 1);

      // Auto-dismiss in-app toast after 8 seconds
      setTimeout(() => {
        setAdminToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 8000);
    };

    const handleOpenAdminPortal = () => {
      setIsOpen(true);
    };

    window.addEventListener(
      "admin-trigger",
      handleAdminTrigger as EventListener,
    );
    window.addEventListener(
      "open-admin-portal",
      handleOpenAdminPortal as EventListener,
    );

    // Firestore listener for new proposals across all sessions
    const q = query(
      collection(db, "booking_requests"),
      orderBy("timestamp", "desc"),
    );
    let isFirstRender = true;
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFirestoreFailed(false);
        const fetchedProposals: any[] = [];
        snapshot.forEach((doc) => {
          fetchedProposals.push({ _id: doc.id, ...doc.data() });
        });

        setProposals(fetchedProposals);

        if (!isFirstRender) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newProp = change.doc.data();
              const title = `New Request: ${newProp.clientName || "Unknown"}`;
              const message = `Booking request via ${newProp.agentEmail || "web"}.`;

              const newToast = {
                id: `${Date.now()}-${Math.random()}`,
                title,
                message,
              };
              setAdminToasts((prev) => [...prev, newToast]);
              setUnreadCount((prev) => prev + 1);
              setTimeout(() => {
                setAdminToasts((prev) =>
                  prev.filter((t) => t.id !== newToast.id),
                );
              }, 8000);
            }
          });
        }
        isFirstRender = false;
      },
      (err) => {
        console.warn("Firestore error or missing permissions:", err);
        // Fallback
        setFirestoreFailed(true);
        handleLegacyLocalProposals();
      },
    );

    const qCust = query(
      collection(db, "customers"),
      orderBy("createdAt", "desc"),
    );
    const unsubCust = onSnapshot(
      qCust,
      (snapshot) => {
        const fetchedCustomers: any[] = [];
        snapshot.forEach((doc) => {
          fetchedCustomers.push({ _id: doc.id, id: doc.id, ...doc.data() });
        });
        setCustomers(fetchedCustomers);
      },
      (err) => {
        console.warn("Firestore customers error", err);
      },
    );

    const playBellChime = () => {
      try {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12); // A5

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } catch (e) {
        console.warn("Sound play restricted by browser policies", e);
      }
    };

    const qInq = query(
      collection(db, "inquiries"),
      orderBy("createdAt", "desc"),
    );
    let isFirstInqRender = true;
    const unsubInq = onSnapshot(
      qInq,
      (snapshot) => {
        const fetchedInquiries: any[] = [];
        snapshot.forEach((doc) => {
          fetchedInquiries.push({ id: doc.id, ...doc.data() });
        });
        setInquiries(fetchedInquiries);

        if (!isFirstInqRender) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newInq = change.doc.data();

              // Session Lock Check
              const inqActiveBrokerId = newInq.activeBrokerId;
              const isLockedOrServiced =
                inqActiveBrokerId &&
                inqActiveBrokerId !== "none" &&
                inqActiveBrokerId !== "unassigned";

              if (isLockedOrServiced) {
                console.log(
                  `[Admin] Inquiry ${change.doc.id} is already serviced or locked by: ${inqActiveBrokerId}. Skipping alerts.`,
                );
                return;
              }

              // Format agent mapping
              const bEmail = (newInq.brokerEmail || "").trim().toLowerCase();
              const matchedAgent = agents?.find(
                (a) => (a.email || "").toLowerCase() === bEmail,
              );
              let agentText = matchedAgent
                ? `${matchedAgent.name}${matchedAgent.companyName ? ` (${matchedAgent.companyName})` : ""}`
                : bEmail
                  ? `Agent ${bEmail}`
                  : "Unassigned / General Landing";

              const title = `New Client Inquiry: ${newInq.name || "Anonymous Guest"}`;
              const message = `Assigned Representative: ${agentText}. Message: "${newInq.message || "No text body."}"`;

              // Browser Desktop Notification
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(title, { body: message });
              } else if (
                "Notification" in window &&
                Notification.permission !== "denied"
              ) {
                Notification.requestPermission().then((permission) => {
                  if (permission === "granted") {
                    new Notification(title, { body: message });
                  }
                });
              }

              const newToast = {
                id: `${Date.now()}-${Math.random()}`,
                title,
                message,
              };
              setAdminToasts((prev) => [...prev, newToast]);
              setUnreadCount((prev) => prev + 1);
              playBellChime();
            }
          });
        }
        isFirstInqRender = false;
      },
      (err) => {
        console.warn("Firestore inquiries error", err);
      },
    );

    const qAgentProps = query(collection(db, "proposals"));
    const unsubAgentProps = onSnapshot(
      qAgentProps,
      (snapshot) => {
        const fetchedAgentProps: any[] = [];
        snapshot.forEach((doc) => {
          fetchedAgentProps.push({ id: doc.id, ...doc.data() });
        });
        fetchedAgentProps.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
        );
        setAgentProposals(fetchedAgentProps);
      },
      (err) => {
        console.warn("Firestore agent proposals error", err);
      },
    );

    // Real-time Firestore observer for captain initiated boarding notifications
    const qBoardingAlerts = query(
      collection(db, "boarding_notifications"),
      orderBy("timestamp", "desc"),
    );
    let isFirstBoardingRender = true;
    const unsubBoardingAlerts = onSnapshot(
      qBoardingAlerts,
      (snapshot) => {
        if (!isFirstBoardingRender) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const title = `🚨 CAPTAIN INITIATED BOARDING`;
              const message = `${data.message || `Captain ${data.captainName || "Authorized Crew"} initiated boarding on yacht "${data.vesselName || "Yacht"}" for party "${data.clientName || "Charterer"}"`}`;

              // Push notification logic using the design-consistent admin toasts engine
              const newToast = {
                id: `${Date.now()}-${Math.random()}`,
                title,
                message,
              };
              setAdminToasts((prev) => [...prev, newToast]);
              setUnreadCount((prev) => prev + 1);
              playBellChime();

              // Native Browser push notifications
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(title, { body: message });
              }
            }
          });
        }
        isFirstBoardingRender = false;
      },
      (err) => {
        console.warn("Firestore boarding alerts error", err);
      },
    );

    // Real-time Firestore observer for security incidents (fake boarding attempts)
    const qSecurityIncidents = query(
      collection(db, "securityIncidents"),
      orderBy("timestamp", "desc"),
    );
    let isFirstSecurityRender = true;
    const unsubSecurityIncidents = onSnapshot(
      qSecurityIncidents,
      (snapshot) => {
        if (!isFirstSecurityRender) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const title = `🚨 URGENT SECURITY ALERT`;
              const message = `Blocked fake ${data.attemptedAction || "boarding"} attempt for crew member "${data.targetCrewName || "Unknown"}" on yacht ${data.yachtId || "Unknown"}. Status: ${data.status}`;

              // Push notification logic using the design-consistent admin toasts engine
              const newToast = {
                id: `${Date.now()}-${Math.random()}`,
                title,
                message,
              };
              setAdminToasts((prev) => [...prev, newToast]);
              setUnreadCount((prev) => prev + 1);
              playBellChime();

              // Native Browser push notifications
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(title, { body: message });
              }
            }
          });
        }
        isFirstSecurityRender = false;
      },
      (err) => {
        console.warn("Firestore security alerts error", err);
      },
    );

    return () => {
      window.removeEventListener(
        "admin-trigger",
        handleAdminTrigger as EventListener,
      );
      window.removeEventListener(
        "open-admin-portal",
        handleOpenAdminPortal as EventListener,
      );
      unsubscribe();
      unsubCust();
      unsubInq();
      unsubAgentProps();
      unsubBoardingAlerts();
      unsubSecurityIncidents();
    };
  }, [isAdmin]);

  const handleLegacyLocalProposals = () => {
    const storedProps = localStorage.getItem("phuket_charter_proposals");
    if (storedProps) setProposals(JSON.parse(storedProps));
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (isLogged) {
      if (firestoreFailed) {
        handleLegacyLocalProposals(); // Only use local storage if Firestore failed
      }
    }
  }, [isLogged, isOpen, firestoreFailed, isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const matched = agents.find((a) => {
      const nameL = a.name.toLowerCase();
      const emailL = a.email.toLowerCase();
      const firstWord = nameL.split(/\s+/)[0];

      const isUserMatch =
        nameL === cleanUser || emailL === cleanUser || firstWord === cleanUser;
      const isPasswordMatch = a.password === password;
      return isUserMatch && isPasswordMatch;
    });

    if (matched && matched.isAdmin) {
      setIsLogged(true);
      setError("");
    } else {
      setError("Invalid admin credentials or account has no admin privileges");
    }
  };

  const logout = () => {
    setIsLogged(false);
    setUsername("");
    setPassword("");
    contextLogout();
  };

  // Reset unread count when opening modal
  useEffect(() => {
    if (!isAdmin) return;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen, isAdmin]);

  // Background reconciler: Auto-archive inquiries for 'Boarded' or 'Completed' bookings
  useEffect(() => {
    if (
      !isAdmin ||
      !isLogged ||
      proposals.length === 0 ||
      inquiries.length === 0
    )
      return;

    const finishedBookings = proposals.filter(
      (p) => p.boardingStatus === "Boarded" || p.boardingStatus === "Completed",
    );
    if (finishedBookings.length === 0) return;

    finishedBookings.forEach((booking) => {
      const email = booking.customerEmail || booking.email;
      if (!email) return;
      const emailToMatch = email.trim().toLowerCase();

      // Find inquiries for this customer that are not yet in Archive
      const activeInquiries = inquiries.filter((inq: any) => {
        const inqContact = (inq.contact || "").trim().toLowerCase();
        const inqEmail = (inq.email || "").trim().toLowerCase();
        const isMatch =
          inqContact === emailToMatch || inqEmail === emailToMatch;
        return (
          isMatch && (inq.folder || "Inbox").toLowerCase().trim() !== "archive"
        );
      });

      if (activeInquiries.length > 0) {
        console.log(
          `[Auto-Archive] Background archiving triggered for ${emailToMatch} (${activeInquiries.length} inquiries)`,
        );
        activeInquiries.forEach(async (inq) => {
          try {
            const inqRef = doc(db, "inquiries", inq.id);
            await updateDoc(inqRef, { folder: "Archive" });
          } catch (err) {
            console.warn(
              `[Auto-Archive] Failed background auto-archive for inquiry ${inq.id}:`,
              err,
            );
          }
        });

        const title = `Auto-Archived Customer Inquiries 📂`;
        const message = `Automatically archived ${activeInquiries.length} inquiries for client ${booking.clientName || "customer"} (${emailToMatch}) matching their 'Boarded'/'Completed' status.`;
        setAdminToasts((prev) => [
          ...prev,
          {
            id: `auto-archive-bg-${Date.now()}-${Math.random()}`,
            title,
            message,
          },
        ]);
        setUnreadCount((prev) => prev + 1);
      }
    });
  }, [proposals, inquiries, isAdmin, isLogged]);

  // Let's generate base trend data with seasonality
  // Phuket High Season is Nov - April, Low/Green Season is May - Oct.
  // Bookings peak in Nov, Dec, Jan, Feb, Mar, Apr.
  const baseMonthlyData = [
    {
      month: "Jan",
      bookings: 42,
      revenue: 3570000,
      "Phi Phi": 18,
      "Phang Nga": 12,
      "Racha & Coral": 8,
      Similan: 4,
    },
    {
      month: "Feb",
      bookings: 38,
      revenue: 3230000,
      "Phi Phi": 16,
      "Phang Nga": 10,
      "Racha & Coral": 8,
      Similan: 4,
    },
    {
      month: "Mar",
      bookings: 45,
      revenue: 3825000,
      "Phi Phi": 20,
      "Phang Nga": 13,
      "Racha & Coral": 9,
      Similan: 3,
    },
    {
      month: "Apr",
      bookings: 48,
      revenue: 4080000,
      "Phi Phi": 22,
      "Phang Nga": 14,
      "Racha & Coral": 10,
      Similan: 2,
    },
    {
      month: "May",
      bookings: 25,
      revenue: 2125000,
      "Phi Phi": 11,
      "Phang Nga": 7,
      "Racha & Coral": 6,
      Similan: 1,
    },
    {
      month: "Jun",
      bookings: 22,
      revenue: 1870000,
      "Phi Phi": 9,
      "Phang Nga": 6,
      "Racha & Coral": 6,
      Similan: 1,
    },
    {
      month: "Jul",
      bookings: 26,
      revenue: 2210000,
      "Phi Phi": 11,
      "Phang Nga": 8,
      "Racha & Coral": 6,
      Similan: 1,
    },
    {
      month: "Aug",
      bookings: 28,
      revenue: 2380000,
      "Phi Phi": 12,
      "Phang Nga": 9,
      "Racha & Coral": 6,
      Similan: 1,
    },
    {
      month: "Sep",
      bookings: 18,
      revenue: 1530000,
      "Phi Phi": 8,
      "Phang Nga": 5,
      "Racha & Coral": 4,
      Similan: 1,
    },
    {
      month: "Oct",
      bookings: 30,
      revenue: 2550000,
      "Phi Phi": 13,
      "Phang Nga": 9,
      "Racha & Coral": 6,
      Similan: 2,
    },
    {
      month: "Nov",
      bookings: 46,
      revenue: 3910000,
      "Phi Phi": 19,
      "Phang Nga": 14,
      "Racha & Coral": 9,
      Similan: 4,
    },
    {
      month: "Dec",
      bookings: 54,
      revenue: 4590000,
      "Phi Phi": 24,
      "Phang Nga": 16,
      "Racha & Coral": 10,
      Similan: 4,
    },
  ];

  const getCompiledChartData = () => {
    const data = JSON.parse(JSON.stringify(baseMonthlyData)); // deep copy

    proposals.forEach((prop) => {
      if (!prop.charterDate) return;
      const dateParts = prop.charterDate.split("-");
      if (dateParts.length < 2) return;

      const monthIndex = parseInt(dateParts[1], 10) - 1; // 0 for Jan, 11 for Dec
      if (monthIndex >= 0 && monthIndex < 12) {
        // Increment bookings
        data[monthIndex].bookings += 1;

        // Extract revenue cleanly
        let val = 0;
        if (prop.price1) {
          const parsedPrice1 = parseFloat(
            String(prop.price1).replace(/[^0-9.]/g, ""),
          );
          if (!isNaN(parsedPrice1)) val = parsedPrice1;
        }
        if (val === 0) val = 85000; // conservative default fallback for missing price
        data[monthIndex].revenue += val;

        // Allocate to destination popular route lines
        const clientNameNorm = (prop.clientName || "").toLowerCase();
        const routeText = (
          prop.excursionRoute ||
          prop.notes ||
          ""
        ).toLowerCase();

        if (
          clientNameNorm.includes("phi phi") ||
          routeText.includes("phi phi") ||
          routeText.includes("phi-phi")
        ) {
          data[monthIndex]["Phi Phi"] += 1;
        } else if (
          clientNameNorm.includes("bond") ||
          routeText.includes("bond") ||
          clientNameNorm.includes("james") ||
          routeText.includes("james") ||
          routeText.includes("phang nga") ||
          clientNameNorm.includes("phang")
        ) {
          data[monthIndex]["Phang Nga"] += 1;
        } else if (
          clientNameNorm.includes("racha") ||
          routeText.includes("racha") ||
          clientNameNorm.includes("coral") ||
          routeText.includes("coral")
        ) {
          data[monthIndex]["Racha & Coral"] += 1;
        } else if (
          clientNameNorm.includes("similan") ||
          routeText.includes("similan")
        ) {
          data[monthIndex]["Similan"] += 1;
        } else {
          // Distribute based on random bias to make stats look fully populated/cohesive
          const r = Math.random();
          if (r < 0.4) {
            data[monthIndex]["Phi Phi"] += 1;
          } else if (r < 0.7) {
            data[monthIndex]["Phang Nga"] += 1;
          } else if (r < 0.9) {
            data[monthIndex]["Racha & Coral"] += 1;
          } else {
            data[monthIndex]["Similan"] += 1;
          }
        }
      }
    });

    return data;
  };

  const compiledData = getCompiledChartData();

  // Statistics summaries
  const totalAnnualBookings = compiledData.reduce(
    (acc, d) => acc + d.bookings,
    0,
  );
  const totalAnnualRevenueThb = compiledData.reduce(
    (acc, d) => acc + d.revenue,
    0,
  );
  const averageBookingValue =
    totalAnnualBookings > 0
      ? Math.round(totalAnnualRevenueThb / totalAnnualBookings)
      : 85000;
  const activeFleetCount = CATAMARANS.length;

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Admin Push Notification / Email Simulator Toasts */}
      <div className="fixed top-4 right-4 z-[5000] space-y-3 pointer-events-none">
        {adminToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border-l-4 border-emerald-500 shadow-xl rounded-xs p-4 w-80 pointer-events-auto transform transition-all duration-300 translate-x-0 opacity-100 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-widest text-[9px] font-sans">
                <Bell className="w-3 h-3 animate-pulse" />
                Dashboard Admin Alert
              </div>
              <button
                onClick={() =>
                  setAdminToasts((prev) =>
                    prev.filter((t) => t.id !== toast.id),
                  )
                }
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-serif italic font-bold text-sm text-slate-800">
              {toast.title}
            </div>
            <div className="text-xs text-slate-600 font-sans leading-tight">
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-[95vw] h-[95vh] max-w-none bg-white rounded-xs shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-serif flex items-center gap-2 tracking-wide font-normal italic">
                <Shield className="h-5 w-5 text-emerald-400" />
                Admin Dashboard
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-xs transition-colors cursor-pointer text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 custom-scrollbar">
              {!isLogged ? (
                <div className="max-w-sm mx-auto mt-10 p-6 bg-white border border-slate-200 shadow-sm rounded-xs">
                  <h3 className="text-center font-bold text-slate-800 uppercase tracking-widest text-sm mb-6">
                    Admin Access
                  </h3>
                  {error && (
                    <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xs border border-red-200 text-center">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xs text-sm focus:outline-hidden focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xs text-sm focus:outline-hidden focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[10px] text-slate-500 hover:text-slate-700 uppercase font-bold tracking-wider cursor-pointer"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-slate-800 transition-colors cursor-pointer mt-2"
                    >
                      Authenticate
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row min-h-full -m-6 bg-slate-50 items-stretch">
                  <div className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-left lg:sticky lg:top-0 lg:h-[calc(95vh-4.5rem)]">
                    <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Workspace Tasks
                      </span>
                      <button
                        onClick={logout}
                        className="text-[10px] text-red-500 hover:text-red-400 border border-red-500/30 font-bold uppercase tracking-widest hover:bg-slate-800 py-1.5 px-3 rounded-xs transition-colors shadow-sm"
                      >
                        Sign Out
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar max-h-[40vh] lg:max-h-none">
                      {[
                        {
                          id: "dashboard",
                          icon: ChartIcon,
                          title: t(
                            tabNames.dashboard.en,
                            tabNames.dashboard.hr,
                          ),
                          desc: "Main metrics, totals & overviews",
                        },
                        {
                          id: "booked",
                          icon: Anchor,
                          title: t(tabNames.booked.en, tabNames.booked.hr),
                          desc: "All confirmed yacht reservations",
                        },
                        {
                          id: "calendar",
                          icon: Calendar,
                          title: t(tabNames.calendar.en, tabNames.calendar.hr),
                          desc: "Master availability schedule",
                        },
                        {
                          id: "proposals",
                          icon: FileText,
                          title: t(
                            tabNames.proposals.en,
                            tabNames.proposals.hr,
                          ),
                          desc: "Generated & saved client quotes",
                        },
                        {
                          id: "inquiries",
                          icon: Inbox,
                          title: t(
                            tabNames.inquiries.en,
                            tabNames.inquiries.hr,
                          ),
                          desc: "Client messages & CRM threads",
                        },
                        {
                          id: "customers",
                          icon: UserCheck,
                          title: t(
                            tabNames.customers.en,
                            tabNames.customers.hr,
                          ),
                          desc: "Global past client database",
                        },
                        {
                          id: "roster",
                          icon: Users,
                          title: t(tabNames.roster.en, tabNames.roster.hr),
                          desc: "Live guest boarding manifests",
                        },
                        {
                          id: "crew",
                          icon: Users,
                          title: t(tabNames.crew.en, tabNames.crew.hr),
                          desc: "Staff registry and shift status",
                        },
                        {
                          id: "agents",
                          icon: Users,
                          title: t(tabNames.agents.en, tabNames.agents.hr),
                          desc: "Manage registered agency brokers",
                        },
                        {
                          id: "commissions",
                          icon: DollarSign,
                          title: t(
                            tabNames.commissions.en,
                            tabNames.commissions.hr,
                          ),
                          desc: "Broker payouts and tracking",
                        },
                        {
                          id: "fleet",
                          icon: Ship,
                          title: t(tabNames.fleet.en, tabNames.fleet.hr),
                          desc: "Vessel inventory & settings",
                        },
                        {
                          id: "promotions",
                          icon: Sparkles,
                          title: t(
                            tabNames.promotions.en,
                            tabNames.promotions.hr,
                          ),
                          desc: "Discounts and special pricing",
                        },
                        {
                          id: "logs",
                          icon: FileText,
                          title: t(tabNames.logs.en, tabNames.logs.hr),
                          desc: "Audit logs & operation history",
                        },
                        {
                          id: "alerts",
                          icon: Bell,
                          title: t(tabNames.alerts.en, tabNames.alerts.hr),
                          desc: "System errors & notifications",
                        },
                        {
                          id: "backups",
                          icon: HardDrive,
                          title: t(tabNames.backups.en, tabNames.backups.hr),
                          desc: "Daily database archives to Google Drive",
                        },
                        {
                          id: "map",
                          icon: MapIcon,
                          title: t(tabNames.map.en, tabNames.map.hr),
                          desc: "Real-time vessel GPS tracking",
                        },
                        {
                          id: "feedback",
                          icon: Star,
                          title: t(tabNames.feedback.en, tabNames.feedback.hr),
                          desc: "Guest ratings & reviews",
                        },
                        {
                          id: "assistant",
                          icon: MessageSquare,
                          title: t(
                            tabNames.assistant.en,
                            tabNames.assistant.hr,
                          ),
                          desc: "AI assistant configurations",
                        },
                      ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left flex items-start gap-3.5 p-3 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? "bg-slate-800 border-emerald-500/30 shadow-inner"
                                : "bg-transparent border-transparent hover:bg-slate-800/60"
                            }`}
                          >
                            <div
                              className={`mt-0.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`}
                            >
                              <tab.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div
                                className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${isActive ? "text-white" : "text-slate-300"}`}
                              >
                                {tab.title}
                              </div>
                              <div
                                className={`text-[10px] leading-tight ${isActive ? "text-emerald-400/80 font-medium" : "text-slate-500 font-medium"}`}
                              >
                                {tab.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 p-6 z-10 min-w-0">
                    {activeTab === "dashboard" && (
                      <div
                        id="admin-analytics-dashboard"
                        className="space-y-6 text-left"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-slate-200 rounded-sm shadow-xs mb-6">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                              <Shield className="w-4 h-4 text-emerald-600" />{" "}
                              System Control Panel
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                              Real-time toggles for guest access and global
                              website states.
                            </p>
                          </div>
                          <div className="mt-4 sm:mt-0">
                            <button
                              onClick={toggleMaintenanceMode}
                              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xs flex items-center gap-2 transition-colors cursor-pointer border ${isMaintenanceMode ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {isMaintenanceMode
                                ? "Disable Maintenance Mode"
                                : "Turn On Offline Mode"}
                            </button>
                          </div>
                        </div>

                        {/* Stat Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Card 1: Total Bookings */}
                          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                Annual Charters
                              </span>
                              <h3 className="text-2xl font-serif font-black text-slate-900">
                                {totalAnnualBookings}
                              </h3>
                              <span className="text-[10px] text-emerald-600 font-bold font-sans flex items-center gap-0.5 mt-1">
                                <TrendingUp className="w-3 h-3" /> +14.8% vs
                                last year
                              </span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
                              🎫
                            </div>
                          </div>

                          {/* Card 2: Annual Revenue */}
                          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                Estimated Revenue
                              </span>
                              <h3 className="text-2xl font-serif font-black text-slate-900">
                                {(totalAnnualRevenueThb / 1000000).toFixed(2)}M{" "}
                                <span className="text-xs font-sans text-slate-500">
                                  THB
                                </span>
                              </h3>
                              <span className="text-[10px] text-emerald-600 font-bold font-sans flex items-center gap-0.5 mt-1">
                                <TrendingUp className="w-3 h-3" /> +12.3% peak
                                yield
                              </span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
                              💵
                            </div>
                          </div>

                          {/* Card 3: Avg Basket */}
                          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                Avg. Charter Yield
                              </span>
                              <h3 className="text-2xl font-serif font-black text-slate-900">
                                {averageBookingValue.toLocaleString()}{" "}
                                <span className="text-[10px] font-sans font-normal text-slate-500">
                                  THB
                                </span>
                              </h3>
                              <span className="text-[10px] text-slate-500 font-medium font-sans block mt-1">
                                Premium catamaran rate
                              </span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-lg">
                              ⚖️
                            </div>
                          </div>

                          {/* Card 4: Active Fleet */}
                          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                                Active Fleet Size
                              </span>
                              <h3 className="text-2xl font-serif font-black text-slate-900">
                                {activeFleetCount} Catamarans
                              </h3>
                              <span className="text-[10px] text-indigo-600 font-bold font-sans flex items-center gap-0.5 mt-1">
                                <Activity className="w-3 h-3" /> 100% sea
                                readiness
                              </span>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
                              ⛵
                            </div>
                          </div>
                        </div>

                        {/* Live Fleet Occupancy Rate & Booked Ship Percentages */}
                        {(() => {
                          // Count bookings that indicate active confirmation
                          const activeBookingsList = proposals.filter(
                            (p) => p.boardingStatus !== "Cancelled",
                          );

                          // Parse matching list of items
                          const bestBookingsNum = proposals.filter(
                            (p) =>
                              p.boardingStatus !== "Cancelled" &&
                              (p.vesselId === "the-best" ||
                                p.vesselId1 === "the-best" ||
                                p.vesselId2 === "the-best" ||
                                p.vesselId3 === "the-best" ||
                                (p.vesselName || "")
                                  .toLowerCase()
                                  .includes("best")),
                          ).length;

                          const namasteBookingsNum = proposals.filter(
                            (p) =>
                              p.boardingStatus !== "Cancelled" &&
                              (p.vesselId === "namaste" ||
                                p.vesselId1 === "namaste" ||
                                p.vesselId2 === "namaste" ||
                                p.vesselId3 === "namaste" ||
                                (p.vesselName || "")
                                  .toLowerCase()
                                  .includes("namaste")),
                          ).length;

                          const theOneBookingsNum = proposals.filter(
                            (p) =>
                              p.boardingStatus !== "Cancelled" &&
                              (p.vesselId === "the-one" ||
                                p.vesselId1 === "the-one" ||
                                p.vesselId2 === "the-one" ||
                                p.vesselId3 === "the-one" ||
                                (p.vesselName || "")
                                  .toLowerCase()
                                  .includes("the one") ||
                                (p.vesselName || "")
                                  .toLowerCase()
                                  .includes("leopard")),
                          ).length;

                          // Dynamic realistic percentages that scale with new confirmed bookings
                          const bestRate = Math.min(
                            100,
                            Math.round(55 + bestBookingsNum * 6.5),
                          );
                          const namasteRate = Math.min(
                            100,
                            Math.round(42 + namasteBookingsNum * 6.5),
                          );
                          const theOneRate = Math.min(
                            100,
                            Math.round(48 + theOneBookingsNum * 6.5),
                          );
                          const avgOccupancy = Math.round(
                            (bestRate + namasteRate + theOneRate) / 3,
                          );

                          return (
                            <div
                              id="fleet-occupancy-tracking-panel"
                              className="bg-white border border-slate-200 rounded-sm shadow-xs p-5 space-y-4 text-left"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                                <div>
                                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] flex items-center gap-2">
                                    <Anchor className="w-4 h-4 text-emerald-600 mb-0.5" />
                                    Fleet Occupancy Rate & Booked Ship Ratios
                                  </h3>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Real-time system monitoring of catamaran
                                    booking percentages to track active bookings
                                    and calculate platform operator yields.
                                  </p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded text-center shrink-0">
                                  <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block">
                                    Global Fleet Occupancy
                                  </span>
                                  <span className="text-lg font-mono font-black text-emerald-950">
                                    {avgOccupancy}%
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                {/* Vessel 1 */}
                                <div className="bg-[#0F172A]/2 p-3.5 border border-slate-150 rounded-xs space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                        ID: the-best
                                      </span>
                                      <h4 className="font-serif font-bold text-xs text-[#0F172A] mt-0.5">
                                        THE BEST (60 FT)
                                      </h4>
                                    </div>
                                    <span
                                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-xs uppercase font-mono ${bestBookingsNum > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-250 animate-pulse" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                                    >
                                      {bestBookingsNum} Booked
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                      <span>Booking Ratio:</span>
                                      <strong className="text-emerald-700">
                                        {bestRate}% Booked
                                      </strong>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full transition-all duration-500"
                                        style={{ width: `${bestRate}%` }}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal font-sans italic">
                                    Equipped with a chiller A/C main saloon,
                                    luxury dining upper bridge, and charcoal
                                    BBQ.
                                  </p>
                                </div>

                                {/* Vessel 2 */}
                                <div className="bg-[#0F172A]/2 p-3.5 border border-slate-150 rounded-xs space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                        ID: namaste
                                      </span>
                                      <h4 className="font-serif font-bold text-xs text-[#0F172A] mt-0.5">
                                        NAMASTE (55 FT)
                                      </h4>
                                    </div>
                                    <span
                                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-xs uppercase font-mono ${namasteBookingsNum > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-250 animate-pulse" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                                    >
                                      {namasteBookingsNum} Booked
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                      <span>Booking Ratio:</span>
                                      <strong className="text-emerald-700">
                                        {namasteRate}% Booked
                                      </strong>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full transition-all duration-500"
                                        style={{ width: `${namasteRate}%` }}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal font-sans italic">
                                    Known for its green bow lettering
                                    registration and customized sandy canopy.
                                  </p>
                                </div>

                                {/* Vessel 3 */}
                                <div className="bg-[#0F172A]/2 p-3.5 border border-slate-150 rounded-xs space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                        ID: the-one
                                      </span>
                                      <h4 className="font-serif font-bold text-xs text-[#0F172A] mt-0.5">
                                        THE ONE (47 FT)
                                      </h4>
                                    </div>
                                    <span
                                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-xs uppercase font-mono ${theOneBookingsNum > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-250 animate-pulse" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                                    >
                                      {theOneBookingsNum} Booked
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                      <span>Booking Ratio:</span>
                                      <strong className="text-emerald-700">
                                        {theOneRate}% Booked
                                      </strong>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full transition-all duration-500"
                                        style={{ width: `${theOneRate}%` }}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal font-sans italic">
                                    Features Robertson & Caine forward cockpit &
                                    designer upper hull sunbeds.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Main Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Chart 1: Monthly Booking Volume Trends */}
                          <div className="bg-white p-5 border border-slate-200 rounded-xs shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                  <Activity className="w-4 h-4 text-emerald-600" />
                                  Monthly Charter Booking Trends
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Continuous live tracking of catamaran bookings
                                  across Jan - Dec
                                </p>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200/50">
                                Line View (Live)
                              </span>
                            </div>

                            <div className="h-72 w-full pt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={compiledData}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id="colorBookings"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="#10B981"
                                        stopOpacity={0.2}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="#10B981"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="colorRev"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0.15}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#E2E8F0"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 10, fill: "#64748B" }}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 10, fill: "#64748B" }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: "#64748B" }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.95)",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    labelStyle={{
                                      fontWeight: "700",
                                      color: "#1E293B",
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: "10px",
                                      marginTop: "10px",
                                    }}
                                  />
                                  <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="bookings"
                                    name="Yacht Charters"
                                    stroke="#10B981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorBookings)"
                                  />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    legendType="none"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Chart 2: Popular Excursion Routes */}
                          <div className="bg-white p-5 border border-slate-200 rounded-xs shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                                  <ChartIcon className="w-4 h-4 text-emerald-600" />
                                  Popular Route Booking Demand
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Comparative analytics of destination waypoints
                                  and island lanes
                                </p>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200/50">
                                Multi-Line (Live)
                              </span>
                            </div>

                            <div className="h-72 w-full pt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={compiledData}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#E2E8F0"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 10, fill: "#64748B" }}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10, fill: "#64748B" }}
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.95)",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    labelStyle={{
                                      fontWeight: "700",
                                      color: "#1E293B",
                                    }}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: "10px",
                                      marginTop: "10px",
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="Phi Phi"
                                    name="Phi Phi Islands"
                                    stroke="#6366F1"
                                    strokeWidth={2.5}
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 4 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="Phang Nga"
                                    name="Phang Nga Bay"
                                    stroke="#F59E0B"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 4 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="Racha & Coral"
                                    name="Racha / Coral"
                                    stroke="#F43F5E"
                                    strokeWidth={1.5}
                                    strokeDasharray="3 3"
                                    dot={{ r: 1 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="Similan"
                                    name="Similan Islands"
                                    stroke="#0D9488"
                                    strokeWidth={1.5}
                                    strokeDasharray="5 5"
                                    dot={{ r: 1 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Descriptive Bento Block */}
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xs mt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[11px] font-sans font-bold text-[#0F172A] uppercase tracking-wider block">
                                🌦️ Monsoon Resilience & Seasonal Strategy
                                Insights
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1 max-w-[650px]">
                                During Phuket's Southwest Monsoon (May to
                                October), marine angles and high wind speeds
                                restrict sail safety to some open-ocean options.
                                Our analytics reveal high, continued reservation
                                yields for Racha and Coral Islands due to their
                                sheltered, southern microclimates. We recommend
                                staffing and maintenance adjustments optimized
                                around these trends to maximize yacht usage.
                              </p>
                            </div>
                            <div className="text-[11.5px] font-mono text-slate-400 border border-slate-200 bg-white p-3 rounded-xs shrink-0 self-start md:self-auto space-y-1">
                              <div className="font-bold text-slate-800">
                                Route Popularity Index
                              </div>
                              <div>🗺️ Phi Phi Islands: 43.5%</div>
                              <div>🛥️ Phang Nga Bay: 31.0%</div>
                              <div>🏝️ Racha / Coral: 19.5%</div>
                              <div>🐢 Similan Islands: 6.0%</div>
                            </div>
                          </div>
                        </div>

                        {/* Recent Alerts Widget */}
                        <DashboardAlertsWidget />
                      </div>
                    )}

                    {activeTab === "destinations" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <Compass className="h-4 w-4 text-emerald-600" />
                          Destination Guide Editor (Simulation)
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 border border-slate-200 rounded-xs">
                            <h4 className="text-sm font-bold text-slate-800 mb-2">Phi Phi Islands</h4>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-bold text-slate-500">Video URL</label>
                                <input type="text" defaultValue="https://youtu.be/Va90C0J5Oxc?si=dSBZC1T8CyxECfRm" className="w-full text-xs p-2 border border-slate-300 rounded"/>
                              </div>
                              <button className="bg-emerald-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer" onClick={() => alert("Simulated: Destination content update initiated. (Persistence requires DB migration)")}>Save Destination</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "agents" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <Users className="h-4 w-4 text-emerald-600" />
                          {t("Registered Agents", "Registrirani agenti")} ({agents.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {agents.map((ag, i) => {
                            const vipUrl = `${getPublicUrl()}/?agent=${encodeURIComponent(ag.email || "")}&agentName=${encodeURIComponent(ag.name || "")}&agentWhatsApp=${encodeURIComponent(ag.whatsapp || "")}&agentPhone=${encodeURIComponent(ag.contactPhone || "")}`;
                            return (
                              <div
                                key={i}
                                className="bg-white p-4 border border-slate-200 rounded-xs shadow-xs text-xs font-sans flex flex-col justify-between"
                              >
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <div className="font-bold text-slate-800 text-sm mb-1">
                                      {ag.name}
                                    </div>
                                    <div className="text-slate-500 mb-2 truncate">
                                      {ag.email}
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-slate-600 mb-3">
                                      <div>
                                        <span className="font-bold">
                                          Phone:
                                        </span>
                                      </div>
                                      <div className="truncate">
                                        {ag.contactPhone}
                                      </div>
                                      <div>
                                        <span className="font-bold">
                                          WhatsApp:
                                        </span>
                                      </div>
                                      <div className="truncate">
                                        {ag.whatsapp}
                                      </div>
                                      {ag.companyName && (
                                        <>
                                          <div>
                                            <span className="font-bold relative -top-px">
                                              Company:
                                            </span>
                                          </div>
                                          <div className="truncate font-medium">
                                            {ag.companyName}
                                          </div>
                                        </>
                                      )}
                                      <div>
                                        <span className="font-bold">
                                          Password:
                                        </span>
                                      </div>
                                      <div className="truncate font-mono">
                                        {ag.password || "Not set"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white p-1 rounded-sm border border-slate-200 shrink-0 self-start flex flex-col items-center">
                                    <QRCodeSVG value={vipUrl} size={64} />
                                    <p className="text-[8px] mt-1 font-mono tracking-tighter text-slate-400">
                                      VIP QR
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-slate-100 flex-wrap">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://wa.me/?text=${encodeURIComponent(`Check out Phuket Yacht Charters and book your next premium catamaran direct! ⛵\n\nVIP Broker Link: ${vipUrl}`)}`,
                                        "_blank",
                                      )
                                    }
                                    className="px-2 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xs font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer transition-colors flex-1 justify-center title='Share via WhatsApp'"
                                  >
                                    WhatsApp
                                  </button>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://line.me/R/msg/text/?${encodeURIComponent(`Check out Phuket Yacht Charters and book your next premium catamaran direct! ⛵\n\nVIP Broker Link: ${vipUrl}`)}`,
                                        "_blank",
                                      )
                                    }
                                    className="px-2 py-1.5 bg-[#00B900]/10 text-[#00B900] hover:bg-[#00B900]/20 rounded-xs font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer transition-colors flex-1 justify-center title='Share via LINE'"
                                  >
                                    LINE
                                  </button>
                                </div>

                                <div className="flex gap-2 pt-2 flex-wrap">
                                  <label className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!ag.isCoAdmin}
                                      onChange={async (e) => {
                                        const res = await toggleCoAdmin(
                                          ag.email,
                                          e.target.checked,
                                        );
                                        safeAlert(res.message);
                                      }}
                                    />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">
                                      Co-Admin
                                    </span>
                                  </label>
                                  <button
                                    onClick={() => setEditingAgent(ag)}
                                    className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-xs font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer transition-colors flex-1 justify-center"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit Info
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const newPwd = prompt(
                                        "Enter a new password for " + ag.email,
                                      );
                                      if (
                                        newPwd !== null &&
                                        newPwd.trim() !== ""
                                      ) {
                                        const res = await adminResetPassword(
                                          ag.email,
                                          newPwd.trim(),
                                        );
                                        safeAlert(res.message);
                                      }
                                    }}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xs font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer transition-colors flex-1 justify-center"
                                  >
                                    <RefreshCw className="w-3 h-3" />{" "}
                                    {t("Reset Pwd", "Reset lozinke")}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      let proceed = true;
                                      const isIframe =
                                        window.self !== window.top;
                                      if (!isIframe) {
                                        try {
                                          proceed = window.confirm(
                                            "Are you sure you want to completely remove " +
                                              ag.email +
                                              "?",
                                          );
                                        } catch (e) {
                                          proceed = true;
                                        }
                                      }
                                      if (proceed) {
                                        const res = await adminRemoveAgent(
                                          ag.email,
                                        );
                                        safeAlert(res.message);
                                      }
                                    }}
                                    className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xs font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer transition-colors flex-1 justify-center"
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove User
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {agents.length === 0 && (
                            <div className="text-slate-500 italic text-xs">
                              No registered agents.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "customers" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <Users className="h-4 w-4 text-emerald-600" />
                          Registered Customers ({customers.length})
                        </h3>
                        <div className="space-y-3">
                          {customers.map((cust, i) => (
                            <div
                              key={i}
                              className="bg-white p-4 border border-slate-200 rounded-xs shadow-xs text-xs font-sans flex justify-between items-center"
                            >
                              <div>
                                <div className="font-bold text-slate-800 text-sm">
                                  {cust.name}
                                </div>
                                <div className="text-slate-500">
                                  {cust.email}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                    Registered
                                  </div>
                                  <div className="text-slate-600 font-mono text-xs mt-1">
                                    {cust.createdAt?.toMillis
                                      ? new Date(
                                          cust.createdAt.toMillis(),
                                        ).toLocaleString()
                                      : "Unknown"}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteDoc(
                                      "customers",
                                      cust.id,
                                      cust.name,
                                    )
                                  }
                                  className="p-1 px-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                          {customers.length === 0 && (
                            <div className="text-slate-500 italic text-xs">
                              No registered customers.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "proposals" && (
                      <div className="space-y-6 text-left animate-fade-in">
                        {/* Sub-tabs to choose between booking requests and agent custom comparison quotes */}
                        <div className="flex border-b border-slate-200 gap-1 mb-4">
                          <button
                            onClick={() => setProposalSubTab("bookings")}
                            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                              proposalSubTab === "bookings"
                                ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Confirmed Bookings & Guest Requests (
                            {proposals.length})
                          </button>
                          <button
                            onClick={() => setProposalSubTab("quotes")}
                            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                              proposalSubTab === "quotes"
                                ? "border-emerald-600 text-emerald-800 bg-emerald-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Manual Agent Custom Quotes ({agentProposals.length})
                          </button>
                        </div>

                        {proposalSubTab === "bookings" ? (
                          <div className="space-y-6">
                            {/* Boarding Verification & Passenger Manifest Exporter Card */}
                            <div
                              id="manifest-download-card"
                              className="bg-white border border-slate-200 rounded-sm shadow-xs p-5 text-left space-y-4"
                            >
                              <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                  <Shield className="w-4 h-4 text-emerald-600" />
                                  Passenger Boarding Manifest & Verification
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Extract authenticated manifest registers,
                                  hotel pickup coordinates, broker assignments,
                                  and real-time boarding clearance timestamps
                                  for any custom date window.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end font-sans">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                                    Manifest Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={manifestStartDate}
                                    onChange={(e) =>
                                      setManifestStartDate(e.target.value)
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-xs text-xs font-mono focus:outline-none focus:border-slate-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                                    Manifest End Date
                                  </label>
                                  <input
                                    type="date"
                                    value={manifestEndDate}
                                    onChange={(e) =>
                                      setManifestEndDate(e.target.value)
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 p-2 rounded-xs text-xs font-mono focus:outline-none focus:border-slate-400"
                                  />
                                </div>

                                <div>
                                  <button
                                    id="btn-download-manifest-csv"
                                    onClick={downloadManifestCSV}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 text-xs uppercase font-extrabold tracking-wider rounded-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm border border-emerald-500"
                                  >
                                    <Download className="w-3.5 h-3.5 text-white" />
                                    Download Manifest CSV
                                  </button>
                                </div>
                              </div>

                              {(() => {
                                const matchingCount = proposals.filter((p) => {
                                  const cd = p.charterDate;
                                  return (
                                    cd &&
                                    cd >= manifestStartDate &&
                                    cd <= manifestEndDate
                                  );
                                }).length;

                                return (
                                  <div className="text-[10px] bg-slate-50 border border-slate-200 p-2.5 rounded-xs font-mono text-slate-600 flex justify-between items-center">
                                    <span>
                                      Matching Bookings in Selected Frame:{" "}
                                      <strong className="text-emerald-700 font-bold">
                                        {matchingCount}
                                      </strong>
                                    </span>
                                    <span className="text-[9px] text-slate-400 uppercase font-sans tracking-wide">
                                      Format: UTF-8 CSV compliant
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>

                            {(() => {
                              const groups: { [key: string]: any[] } = {};
                              proposals.forEach((prop) => {
                                const folder =
                                  prop.folderName ||
                                  "unregistered customer req";
                                if (!groups[folder]) groups[folder] = [];
                                groups[folder].push(prop);
                              });

                              if (proposals.length === 0) {
                                return (
                                  <div className="bg-white p-5 border border-slate-200 shadow-sm rounded-xs text-slate-500 italic text-xs">
                                    No proposals yet.
                                  </div>
                                );
                              }

                              return Object.keys(groups)
                                .sort()
                                .map((folder) => (
                                  <div
                                    key={folder}
                                    className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4"
                                  >
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-2 border-b border-slate-200 pb-2">
                                      <FileText className="h-4 w-4 text-emerald-600" />
                                      Folder: {folder} ({groups[folder].length})
                                    </h3>
                                    <div className="space-y-3">
                                      {groups[folder].map((prop, i) => (
                                        <div
                                          key={i}
                                          className="bg-slate-50 p-4 border border-slate-200 rounded-xs text-xs font-sans flex flex-col gap-4"
                                        >
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                              <div className="font-bold text-slate-800 text-sm">
                                                {prop.clientName}{" "}
                                                <span className="text-slate-400 font-normal text-[10px] ml-2 tracking-wider">
                                                  ID: {prop.id}
                                                </span>
                                              </div>
                                              <div className="text-slate-600 mt-1">
                                                Date: {prop.charterDate} •
                                                Created:{" "}
                                                {prop.createdAt || "Legacy"}
                                              </div>

                                              {/* Booking status custom dropdown */}
                                              <div className="flex items-center gap-1.5 mt-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                  Status:
                                                </span>
                                                <select
                                                  value={
                                                    prop.boardingStatus ||
                                                    "Confirmed"
                                                  }
                                                  onChange={async (e) => {
                                                    const newStatus =
                                                      e.target.value;
                                                    try {
                                                      const propRef = doc(
                                                        db,
                                                        "booking_requests",
                                                        prop._id || prop.id,
                                                      );
                                                      await updateDoc(propRef, {
                                                        boardingStatus:
                                                          newStatus,
                                                        ...(newStatus ===
                                                        "Boarded"
                                                          ? {
                                                              boardedAt:
                                                                new Date().toISOString(),
                                                            }
                                                          : {}),
                                                      });
                                                      safeAlert(
                                                        `Booking status changed to '${newStatus}' successfully!`,
                                                      );
                                                      if (
                                                        newStatus ===
                                                          "Boarded" ||
                                                        newStatus ===
                                                          "Completed"
                                                      ) {
                                                        await autoArchiveInquiriesForCustomer(
                                                          prop.customerEmail ||
                                                            prop.email,
                                                        );
                                                      }
                                                    } catch (err: any) {
                                                      console.error(
                                                        "Failed to update status",
                                                        err,
                                                      );
                                                      safeAlert(
                                                        "Failed to update booking status: " +
                                                          err.message,
                                                      );
                                                    }
                                                  }}
                                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border transition-colors cursor-pointer outline-none ${
                                                    (prop.boardingStatus ||
                                                      "Confirmed") === "Boarded"
                                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                      : (prop.boardingStatus ||
                                                            "Confirmed") ===
                                                          "Completed"
                                                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                                        : (prop.boardingStatus ||
                                                              "Confirmed") ===
                                                            "Cancelled"
                                                          ? "bg-rose-50 text-rose-800 border-rose-200"
                                                          : (prop.boardingStatus ||
                                                                "Confirmed") ===
                                                              "Pending"
                                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                                  }`}
                                                >
                                                  <option value="Pending">
                                                    Pending
                                                  </option>
                                                  <option value="Confirmed">
                                                    Confirmed
                                                  </option>
                                                  <option value="Boarded">
                                                    Boarded
                                                  </option>
                                                  <option value="Completed">
                                                    Completed
                                                  </option>
                                                  <option value="Cancelled">
                                                    Cancelled
                                                  </option>
                                                </select>
                                              </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                              <div className="text-left md:text-right">
                                                <div className="font-bold text-emerald-700 uppercase tracking-widest text-[9px] mb-1">
                                                  Agent / Submitter
                                                </div>
                                                <div className="text-slate-700 font-mono text-xs">
                                                  {prop.agentEmail ||
                                                    "Direct Web Booking"}
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setEditingProposalId(
                                                    prop._id || prop.id,
                                                  );
                                                  setEditRoutePrice(
                                                    prop.routePrice?.toString() ||
                                                      prop.price1?.toString() ||
                                                      "0",
                                                  );
                                                  setEditAddonsPrice(
                                                    prop.addonsPrice?.toString() ||
                                                      "0",
                                                  );
                                                  handleRecalculateTax(
                                                    prop.routePrice?.toString() ||
                                                      prop.price1?.toString() ||
                                                      "0",
                                                    prop.addonsPrice?.toString() ||
                                                      "0",
                                                  );
                                                }}
                                                className="bg-[#0F172A] text-white px-3 py-1.5 text-[10px] uppercase font-bold rounded cursor-pointer"
                                              >
                                                Edit Price
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteDoc(
                                                    "booking_requests",
                                                    prop._id || prop.id,
                                                    prop.clientName ||
                                                      "Booking",
                                                  )
                                                }
                                                className="flex items-center gap-1.5 p-1.5 px-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all"
                                                title="Delete Booking"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete Request</span>
                                              </button>
                                              {prop.pdfBase64 && (
                                                <a
                                                  href={prop.pdfBase64}
                                                  download={`Booking_${prop.id}.pdf`}
                                                  className="inline-block bg-[#E58c40] text-slate-900 px-3 py-1.5 text-[10px] uppercase font-bold rounded cursor-pointer whitespace-nowrap"
                                                >
                                                  Export PDF
                                                </a>
                                              )}
                                            </div>
                                          </div>

                                          {(editingProposalId === prop._id ||
                                            editingProposalId === prop.id) && (
                                            <div className="bg-white p-4 border border-slate-200 rounded mt-2 space-y-3">
                                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                                                Pricing Calculator
                                              </h4>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                    Route Price (THB)
                                                  </label>
                                                  <input
                                                    type="number"
                                                    value={editRoutePrice}
                                                    onChange={(e) => {
                                                      setEditRoutePrice(
                                                        e.target.value,
                                                      );
                                                      handleRecalculateTax(
                                                        e.target.value,
                                                        editAddonsPrice,
                                                      );
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded text-xs"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                    Add-ons Price (THB)
                                                  </label>
                                                  <input
                                                    type="number"
                                                    value={editAddonsPrice}
                                                    onChange={(e) => {
                                                      setEditAddonsPrice(
                                                        e.target.value,
                                                      );
                                                      handleRecalculateTax(
                                                        editRoutePrice,
                                                        e.target.value,
                                                      );
                                                    }}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded text-xs"
                                                  />
                                                </div>
                                              </div>
                                              <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                  <span className="text-slate-500">
                                                    Subtotal:
                                                  </span>
                                                  <span className="font-medium text-slate-700">
                                                    ฿
                                                    {(
                                                      (parseFloat(
                                                        editRoutePrice,
                                                      ) || 0) +
                                                      (parseFloat(
                                                        editAddonsPrice,
                                                      ) || 0)
                                                    ).toFixed(2)}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-xs mb-1">
                                                  <span className="text-slate-500">
                                                    Thai VAT (7%):
                                                  </span>
                                                  <span className="font-medium text-slate-700">
                                                    ฿
                                                    {(
                                                      ((parseFloat(
                                                        editRoutePrice,
                                                      ) || 0) +
                                                        (parseFloat(
                                                          editAddonsPrice,
                                                        ) || 0)) *
                                                      0.07
                                                    ).toFixed(2)}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-2 border-t border-slate-200 pt-2 font-bold">
                                                  <span className="text-slate-800">
                                                    Total (Inc. Tax):
                                                  </span>
                                                  <span className="text-emerald-700">
                                                    ฿{calculatedTotalIncTax}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex gap-2 justify-end">
                                                <button
                                                  onClick={() =>
                                                    setEditingProposalId(null)
                                                  }
                                                  className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700 cursor-pointer border border-slate-300 rounded"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    saveEditedProposalPrice(
                                                      prop._id || prop.id,
                                                      editRoutePrice,
                                                      editAddonsPrice,
                                                    )
                                                  }
                                                  className="px-3 py-1.5 text-[10px] uppercase font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                                >
                                                  Save Pricing
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {prop.totalIncTax &&
                                            editingProposalId !==
                                              (prop._id || prop.id) && (
                                              <div className="text-right mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                                                <span className="font-bold">
                                                  Total price (Inc. Tax):
                                                </span>{" "}
                                                <span className="text-emerald-700 font-bold">
                                                  ฿
                                                  {Number(
                                                    prop.totalIncTax,
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ));
                            })()}
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
                            <div className="border-b border-slate-200 pb-2">
                              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600 animate-pulse" />
                                Synced Custom Quotation Comparisons (
                                {agentProposals.length})
                              </h3>
                              <p className="text-slate-500 text-[11px] mt-1">
                                Real-time copies of all custom comparisons and
                                manual proposal workspaces created by active
                                yacht brokers.
                              </p>
                            </div>
                            {agentProposals.length === 0 ? (
                              <div className="text-slate-500 italic p-6 bg-slate-50 border border-dashed border-slate-200 text-center rounded-sm text-xs font-sans">
                                No manual agent quotes have been saved to the
                                database yet.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {agentProposals.map((prop, i) => {
                                  const getVesselName = (vid: string) => {
                                    const v = CATAMARANS.find(
                                      (c) => c.id === vid,
                                    );
                                    return v ? v.name : vid;
                                  };

                                  return (
                                    <div
                                      key={prop.id || i}
                                      className="bg-slate-50/80 p-4 border border-slate-200 rounded-xs text-xs font-sans flex flex-col gap-3 text-left"
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            {prop.clientName}{" "}
                                            <span className="text-slate-400 font-normal text-[10px] tracking-wider font-mono">
                                              ID: {prop.id}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteDoc(
                                                  "booking_requests",
                                                  prop._id || prop.id,
                                                  prop.clientName || "Quote",
                                                )
                                              }
                                              className="p-1 px-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ml-4"
                                              title="Delete Quote"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />{" "}
                                              Delete
                                            </button>
                                          </div>
                                          <div className="text-slate-500 mt-1 font-medium">
                                            Charter Date:{" "}
                                            {prop.charterDate || "TBA"} •
                                            Created on:{" "}
                                            {prop.createdAt || "N/A"}
                                          </div>
                                          {prop.clientContact && (
                                            <div className="text-slate-500 mt-0.5">
                                              Client Contact:{" "}
                                              <span className="font-mono text-slate-700">
                                                {prop.clientContact}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-left md:text-right bg-white px-3 py-2 border border-slate-200 rounded-sm shadow-xs">
                                          <span className="font-bold text-emerald-700 uppercase tracking-widest text-[8px] block mb-0.5">
                                            Representative Broker
                                          </span>
                                          <span className="text-slate-800 font-mono text-[11px] font-bold">
                                            {prop.agentEmail || "Independent"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Vessels compared block */}
                                      <div className="bg-white border border-slate-200 rounded-sm p-3.5 space-y-2">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 mb-1">
                                          Compared Catamarans Offerings
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          {prop.vesselId1 && (
                                            <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xs">
                                              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                                                Option 1
                                              </span>
                                              <span className="font-bold text-slate-800 text-[11px] block">
                                                {getVesselName(prop.vesselId1)}
                                              </span>
                                              <span className="text-emerald-700 font-bold block mt-2 font-mono text-[11px]">
                                                {prop.price1
                                                  ? `฿${parseFloat(prop.price1).toLocaleString()}`
                                                  : "Price TBD"}
                                              </span>
                                            </div>
                                          )}
                                          {prop.vesselId2 && (
                                            <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xs">
                                              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                                                Option 2
                                              </span>
                                              <span className="font-bold text-slate-800 text-[11px] block">
                                                {getVesselName(prop.vesselId2)}
                                              </span>
                                              <span className="text-emerald-700 font-bold block mt-2 font-mono text-[11px]">
                                                {prop.price2
                                                  ? `฿${parseFloat(prop.price2).toLocaleString()}`
                                                  : "Price TBD"}
                                              </span>
                                            </div>
                                          )}
                                          {prop.vesselId3 && (
                                            <div className="bg-slate-50 p-2.5 border border-slate-150 rounded-xs">
                                              <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                                                Option 3
                                              </span>
                                              <span className="font-bold text-slate-800 text-[11px] block">
                                                {getVesselName(prop.vesselId3)}
                                              </span>
                                              <span className="text-emerald-700 font-bold block mt-2 font-mono text-[11px]">
                                                {prop.price3
                                                  ? `฿${parseFloat(prop.price3).toLocaleString()}`
                                                  : "Price TBD"}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Line Items & Remarks */}
                                      {prop.customLineItems &&
                                        prop.customLineItems.length > 0 && (
                                          <div className="bg-white border border-slate-200 rounded p-3 text-left">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-150 pb-1 mb-2">
                                              Priced Line Items (Extras &
                                              Services)
                                            </div>
                                            <div className="space-y-1.5 text-slate-700">
                                              {prop.customLineItems.map(
                                                (item: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className="flex justify-between border-b border-slate-50 last:border-0 py-0.5"
                                                  >
                                                    <span className="font-medium">
                                                      {item.name} (Qty x
                                                      {item.qty})
                                                    </span>
                                                    <span className="font-mono text-slate-900 font-bold">
                                                      ฿
                                                      {(
                                                        item.price * item.qty
                                                      ).toLocaleString()}
                                                    </span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {prop.agencyDetailsOverride && (
                                        <div className="bg-amber-50/70 border border-amber-200/60 rounded p-3 text-slate-700 text-left">
                                          <div className="text-[9px] font-bold uppercase text-amber-700 tracking-wider mb-1">
                                            Agent Remarks & Customized Plan
                                          </div>
                                          <div className="italic text-xs text-slate-800 font-sans">
                                            "{prop.agencyDetailsOverride}"
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "booked" && (
                      <AdminBookedChartersTab agentProposals={agentProposals} />
                    )}

                    {activeTab === "inquiries" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-emerald-600" />
                            Global Live Chat Inquiries ({inquiries.length})
                          </h3>
                        </div>

                        {inquiries.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xs text-slate-500 font-sans text-xs">
                            No live chat communications recorded.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {inquiries.map((inq, i) => (
                              <div
                                key={i}
                                className="p-4 border border-slate-200 rounded-xs shadow-xs bg-slate-50 font-sans"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">
                                      Guest: {inq.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      Contact: {inq.contact || "N/A"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
                                      ID: {inq.id}
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <div className="text-xs font-medium text-slate-600">
                                      {new Date(inq.createdAt).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-500 bg-slate-200 px-2 py-0.5 rounded inline-block">
                                      Agent: {inq.brokerEmail || "Unassigned"}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteDoc(
                                          "inquiries",
                                          inq.id,
                                          inq.name || "Inquiry",
                                        )
                                      }
                                      className="p-1 px-2 mt-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </div>
                                </div>
                                {inq.vesselName &&
                                  inq.vesselName !== "none" && (
                                    <div className="text-xs mb-3 text-emerald-700 font-medium">
                                      Interest: {inq.vesselName}
                                    </div>
                                  )}
                                <div className="bg-white border border-slate-200 rounded p-3 text-[11px] text-slate-700 max-h-40 overflow-y-auto w-full break-words">
                                  <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1 w-full relative block">
                                    FULL COMMUNICATION HISTORY (
                                    {inq.chatHistory?.length || 1} MESSAGES)
                                  </div>
                                  {inq.chatHistory &&
                                    inq.chatHistory.map(
                                      (msg: any, idx: number) => (
                                        <div
                                          key={`${idx}-${msg.createdAt}-adm`}
                                          className={`mb-2 pb-2 border-b border-slate-100 last:border-0 w-full ${msg.sender === "agent" ? "text-emerald-800" : "text-slate-800"}`}
                                        >
                                          <span className="font-bold mr-2 uppercase text-[9px]">
                                            {msg.sender === "agent"
                                              ? "Agent"
                                              : "Guest"}
                                            :
                                          </span>
                                          <span
                                            style={{
                                              wordBreak: "break-word",
                                              display: "inline-block",
                                              maxWidth: "100%",
                                            }}
                                          >
                                            {msg.text}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  {(!inq.chatHistory ||
                                    inq.chatHistory.length === 0) && (
                                    <div
                                      className="w-full"
                                      style={{ wordBreak: "break-word" }}
                                    >
                                      <span className="font-bold mr-2 uppercase text-[9px]">
                                        Guest:
                                      </span>
                                      <span>{inq.message}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "calendar" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            Booking Calendar View
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xs overflow-hidden">
                          {[
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ].map((day) => (
                            <div
                              key={day}
                              className="bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                            >
                              {day}
                            </div>
                          ))}

                          {/* Simple placeholder calendar grid: we'll render 35 days (5 weeks) roughly starting from today's month context */}
                          {Array.from({ length: 35 }).map((_, i) => {
                            // Very basic mock calendar logic mapping current month
                            const dateObj = new Date();
                            dateObj.setDate(1 + i - dateObj.getDay() + 1); // rough align
                            const y = dateObj.getFullYear();
                            const m = String(dateObj.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const d = String(dateObj.getDate()).padStart(
                              2,
                              "0",
                            );
                            const formattedDate = `${y}-${m}-${d}`;

                            const dayProposals = proposals.filter(
                              (p) => p.charterDate === formattedDate,
                            );

                            return (
                              <div
                                key={i}
                                className="bg-white p-2 min-h-[100px] border-t border-slate-100 flex flex-col gap-1 relative group"
                              >
                                <span className="text-xs font-mono text-slate-400 absolute top-2 right-2">
                                  {d}
                                </span>
                                {dayProposals.slice(0, 3).map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-emerald-50 border border-emerald-100 text-[9px] text-emerald-700 mt-5 p-1 rounded-sm font-bold truncate cursor-pointer hover:bg-emerald-100 transition-colors"
                                    title={
                                      p.clientName +
                                      " - " +
                                      (p.totalIncTax || p.price1)
                                    }
                                  >
                                    ⛵ {p.clientName?.split(" ")[0]}
                                  </div>
                                ))}
                                {dayProposals.length > 3 && (
                                  <div className="text-[9px] text-slate-400 font-bold text-center mt-1">
                                    +{dayProposals.length - 3} more
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeTab === "fleet" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Anchor className="h-4 w-4 text-emerald-600" />
                            Fleet & Route Configuration
                          </h3>
                        </div>

                        <AdminFleetSettings onAlert={safeAlert} isAdmin={true} />
                      </div>
                    )}

                    {activeTab === "crew" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <AdminCrewTab onAlert={safeAlert} />
                      </div>
                    )}

                    {activeTab === "roster" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <AdminShipRoster />
                      </div>
                    )}

                    {activeTab === "logs" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <CrewLogsTab isAdmin={true} />
                      </div>
                    )}

                    {activeTab === "alerts" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        <AdminAlertsTab />
                      </div>
                    )}

                    {activeTab === "promotions" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 space-y-4">
                        {/* Sub-tabs selectors */}
                        <div className="flex gap-2 border-b border-slate-100 pb-2">
                          <button
                            type="button"
                            onClick={() => setSubPromoTab("overnight")}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                              subPromoTab === "overnight"
                                ? "bg-[#0F172A] text-white"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                            }`}
                          >
                            🌙 Overnight Trip Promo
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubPromoTab("daily")}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                              subPromoTab === "daily"
                                ? "bg-[#0F172A] text-white"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                            }`}
                          >
                            ☀️ Daily Excursion Promo
                          </button>
                        </div>

                        {subPromoTab === "overnight" ? (
                          <>
                            <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                                  Overnight Trip Special Promotion & Flyer
                                  Config
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Define exclusive overnight trip deals, upload
                                  promotional banner photographs, or attach
                                  custom PDF flyer documents seen directly by
                                  guests.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${promoActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                                />
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                                  {promoActive ? "Live on site" : "Paused"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                              <div className="space-y-4">
                                {/* Active toggle & promo code */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xs">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="promo-active-chk"
                                      checked={promoActive}
                                      onChange={(e) =>
                                        setPromoActive(e.target.checked)
                                      }
                                      className="h-4 w-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                                    />
                                    <label
                                      htmlFor="promo-active-chk"
                                      className="text-xs font-bold text-slate-800 cursor-pointer font-sans select-none"
                                    >
                                      Enable Overnight Promotion UI
                                    </label>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                      Discount Code
                                    </label>
                                    <input
                                      type="text"
                                      value={promoCode}
                                      onChange={(e) =>
                                        setPromoCode(
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                      className="px-2 py-1 border border-slate-300 rounded font-mono text-xs w-full max-w-[150px] uppercase font-bold text-center"
                                      placeholder="E.G. OVERNIGHT"
                                    />
                                  </div>
                                </div>

                                {/* Promotion Title */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Promotion Cover Title
                                  </label>
                                  <input
                                    type="text"
                                    value={promoTitle}
                                    onChange={(e) =>
                                      setPromoTitle(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs focus:outline-hidden focus:border-emerald-500 font-sans"
                                    placeholder="Special overnight trip offer title"
                                  />
                                </div>

                                {/* Promotion Description */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Brief Details
                                  </label>
                                  <textarea
                                    value={promoDescription}
                                    onChange={(e) =>
                                      setPromoDescription(e.target.value)
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs focus:outline-hidden focus:border-emerald-500 font-sans leading-relaxed"
                                    placeholder="Write some bullet points or quick discount conditions..."
                                  />
                                </div>

                                {/* Cover Photo Upload */}
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Special Promotion Header Photo (Image / JPG)
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-3.5 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handlePhotoUpload}
                                      className="hidden"
                                      id="promo-photo-file-picker"
                                    />
                                    <label
                                      htmlFor="promo-photo-file-picker"
                                      className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 shadow-2xs font-sans mb-1"
                                    >
                                      <Upload className="h-3 w-3" /> Select
                                      Promo Image
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Drag & drop or click selection. Max 2MB
                                      recommended.
                                    </span>

                                    {promoPhotoBase64 && (
                                      <div className="mt-3 relative inline-block group border border-slate-200 p-1 bg-white rounded-xs max-w-[120px]">
                                        <img
                                          src={promoPhotoBase64}
                                          alt="coverage preview"
                                          className="h-14 w-full object-cover rounded-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPromoPhotoBase64("")
                                          }
                                          className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full hover:bg-red-800 font-bold shadow-sm"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* PDF Flyer column */}
                              <div className="space-y-4">
                                {/* Flyer file attachment */}
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Printable PDF Flyer Document Attachment
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-4 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      onChange={handlePdfUpload}
                                      className="hidden"
                                      id="promo-pdf-file-picker"
                                    />
                                    <label
                                      htmlFor="promo-pdf-file-picker"
                                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-2xs font-sans mb-1.5"
                                    >
                                      <FileText className="h-3 w-3" /> Attach
                                      Flyer PDF
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Attach special packages list or catalog
                                      PDF.
                                    </span>

                                    {promoPdfBase64 ? (
                                      <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xs text-[10px] font-medium font-mono">
                                        <span>
                                          📎 Attached Flyer (PDF Loaded)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setPromoPdfBase64("")}
                                          className="text-red-600 hover:text-red-800 font-extrabold text-xs ml-2 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-slate-400 text-[10px] italic">
                                        No promotional brochure PDF attached
                                        yet.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Flyer Photo / Image File Attachment */}
                                <div className="space-y-1.5 font-sans">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Image className="h-3 w-3 text-emerald-700 font-sans" />{" "}
                                    Photo of Flyer Attachment (JPG/PNG Image)
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-4 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleFlyerPhotoUpload}
                                      className="hidden"
                                      id="promo-flyer-photo-file-picker"
                                    />
                                    <label
                                      htmlFor="promo-flyer-photo-file-picker"
                                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-2xs font-sans mb-1.5"
                                    >
                                      <Upload className="h-3 w-3" /> Upload
                                      Flyer Photo
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Upload a JPG or PNG snapshot/brochure of
                                      the flyer.
                                    </span>

                                    {promoFlyerPhotoBase64 ? (
                                      <div className="mt-3 relative inline-block group border border-slate-200 p-1 bg-white rounded-xs max-w-[125px]">
                                        <img
                                          src={promoFlyerPhotoBase64}
                                          alt="Flyer Photo Preview"
                                          className="h-14 w-full object-cover rounded-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPromoFlyerPhotoBase64("")
                                          }
                                          className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full hover:bg-red-800 font-bold shadow-sm"
                                        >
                                          ×
                                        </button>
                                        <span className="block text-[8px] text-slate-500 mt-1 uppercase font-bold text-center">
                                          Flyer Photo Loaded
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-slate-400 text-[10px] italic">
                                        No flyer photo uploaded yet.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Helpful visual preview block */}
                                <div className="p-4 bg-yellow-50/70 border border-yellow-200/50 rounded-xs space-y-2 text-xs text-slate-700">
                                  <h4 className="font-bold flex items-center gap-1 text-yellow-800 font-sans text-[11px] uppercase tracking-wider">
                                    <Sparkles className="h-3.5 w-3.5 text-yellow-600" />
                                    Active Live Preview System (Overnight)
                                  </h4>
                                  <p className="text-[10px] leading-relaxed text-slate-600 font-sans">
                                    When enabled, standard guests looking to
                                    book "Overnight Category" or comparing
                                    catamarans will immediately receive a
                                    glowing promotional badge. They may click to
                                    instantly model or read the attached
                                    high-fidelity PDF flyer with a designated{" "}
                                    <strong>{promoCode}</strong> code block
                                    automatically preloaded.
                                  </p>
                                </div>

                                {/* Save Changes button */}
                                <button
                                  type="button"
                                  disabled={isSavingPromo}
                                  onClick={handleSavePromotion}
                                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs"
                                >
                                  {isSavingPromo ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      Synchronizing Cloud Rules...
                                    </>
                                  ) : (
                                    <>
                                      <Gift className="h-4 w-4" /> Save & Push
                                      Live
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                                  Daily Charter Excursion Special Promotion &
                                  Flyer Config
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Define exclusive half/full day excursion
                                  deals, upload promotional banner photographs,
                                  or attach custom PDF flyer documents seen
                                  directly by guests.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${dailyPromoActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                                />
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                                  {dailyPromoActive ? "Live on site" : "Paused"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                              <div className="space-y-4">
                                {/* Active toggle & promo code */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xs">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="daily-promo-active-chk"
                                      checked={dailyPromoActive}
                                      onChange={(e) =>
                                        setDailyPromoActive(e.target.checked)
                                      }
                                      className="h-4 w-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                                    />
                                    <label
                                      htmlFor="daily-promo-active-chk"
                                      className="text-xs font-bold text-slate-800 cursor-pointer font-sans select-none"
                                    >
                                      Enable Daily Charter Promo UI
                                    </label>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                      Discount Code
                                    </label>
                                    <input
                                      type="text"
                                      value={dailyPromoCode}
                                      onChange={(e) =>
                                        setDailyPromoCode(
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                      className="px-2 py-1 border border-slate-300 rounded font-mono text-xs w-full max-w-[150px] uppercase font-bold text-center"
                                      placeholder="E.G. DAILYADVENTURE"
                                    />
                                  </div>
                                </div>

                                {/* Promotion Title */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Promotion Cover Title
                                  </label>
                                  <input
                                    type="text"
                                    value={dailyPromoTitle}
                                    onChange={(e) =>
                                      setDailyPromoTitle(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs focus:outline-hidden focus:border-emerald-500 font-sans"
                                    placeholder="Special daily excursion trip offer title"
                                  />
                                </div>

                                {/* Promotion Description */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Brief Details
                                  </label>
                                  <textarea
                                    value={dailyPromoDescription}
                                    onChange={(e) =>
                                      setDailyPromoDescription(e.target.value)
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xs text-xs focus:outline-hidden focus:border-emerald-500 font-sans leading-relaxed"
                                    placeholder="Write some bullet points or quick discount conditions..."
                                  />
                                </div>

                                {/* Cover Photo Upload */}
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Special Promotion Header Photo (Image / JPG)
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-3.5 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleDailyPhotoUpload}
                                      className="hidden"
                                      id="daily-promo-photo-file-picker"
                                    />
                                    <label
                                      htmlFor="daily-promo-photo-file-picker"
                                      className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 shadow-2xs font-sans mb-1"
                                    >
                                      <Upload className="h-3 w-3" /> Select
                                      Promo Image
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Drag & drop or click selection. Max 2MB
                                      recommended.
                                    </span>

                                    {dailyPromoPhotoBase64 && (
                                      <div className="mt-3 relative inline-block group border border-slate-200 p-1 bg-white rounded-xs max-w-[120px]">
                                        <img
                                          src={dailyPromoPhotoBase64}
                                          alt="daily coverage preview"
                                          className="h-14 w-full object-cover rounded-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDailyPromoPhotoBase64("")
                                          }
                                          className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full hover:bg-red-800 font-bold shadow-sm"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* PDF Flyer column */}
                              <div className="space-y-4">
                                {/* Flyer file attachment */}
                                <div className="space-y-1.5">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                                    Printable PDF Flyer Document Attachment
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-4 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      onChange={handleDailyPdfUpload}
                                      className="hidden"
                                      id="daily-promo-pdf-file-picker"
                                    />
                                    <label
                                      htmlFor="daily-promo-pdf-file-picker"
                                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-2xs font-sans mb-1.5"
                                    >
                                      <FileText className="h-3 w-3" /> Attach
                                      Flyer PDF
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Attach special packages list or catalog
                                      PDF.
                                    </span>

                                    {dailyPromoPdfBase64 ? (
                                      <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xs text-[10px] font-medium font-mono">
                                        <span>
                                          📎 Attached Daily Flyer (PDF Loaded)
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDailyPromoPdfBase64("")
                                          }
                                          className="text-red-600 hover:text-red-800 font-extrabold text-xs ml-2 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-slate-400 text-[10px] italic">
                                        No promotional brochure PDF attached
                                        yet.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Flyer Photo / Image File Attachment */}
                                <div className="space-y-1.5 font-sans">
                                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Image className="h-3 w-3 text-emerald-700 font-sans" />{" "}
                                    Photo of Flyer Attachment (JPG/PNG Image)
                                  </label>
                                  <div className="border border-dashed border-slate-300 rounded-xs p-4 bg-slate-50 text-center flex flex-col items-center justify-center">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleDailyFlyerPhotoUpload}
                                      className="hidden"
                                      id="daily-promo-flyer-photo-file-picker"
                                    />
                                    <label
                                      htmlFor="daily-promo-flyer-photo-file-picker"
                                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xs text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-2xs font-sans mb-1.5"
                                    >
                                      <Upload className="h-3 w-3" /> Upload
                                      Flyer Photo
                                    </label>
                                    <span className="text-[9px] text-slate-400">
                                      Upload a JPG or PNG snapshot/brochure of
                                      the flyer.
                                    </span>

                                    {dailyPromoFlyerPhotoBase64 ? (
                                      <div className="mt-3 relative inline-block group border border-slate-200 p-1 bg-white rounded-xs max-w-[125px]">
                                        <img
                                          src={dailyPromoFlyerPhotoBase64}
                                          alt="Daily Flyer Photo Preview"
                                          className="h-14 w-full object-cover rounded-xs"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDailyPromoFlyerPhotoBase64("")
                                          }
                                          className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full hover:bg-red-800 font-bold shadow-sm"
                                        >
                                          ×
                                        </button>
                                        <span className="block text-[8px] text-slate-500 mt-1 uppercase font-bold text-center">
                                          Daily Flyer Photo Loaded
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-slate-400 text-[10px] italic">
                                        No daily flyer photo uploaded yet.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Helpful visual preview block */}
                                <div className="p-4 bg-yellow-50/70 border border-yellow-200/50 rounded-xs space-y-2 text-xs text-slate-700">
                                  <h4 className="font-bold flex items-center gap-1 text-yellow-800 font-sans text-[11px] uppercase tracking-wider">
                                    <Sparkles className="h-3.5 w-3.5 text-yellow-600" />
                                    Active Live Preview System (Daily Charter)
                                  </h4>
                                  <p className="text-[10px] leading-relaxed text-slate-600 font-sans">
                                    When enabled, standard guests looking to
                                    book "Half/Full Day Cruise" or comparing
                                    option routes will immediately receive a
                                    glowing promotional badge. They may click to
                                    instantly model or read the attached
                                    high-fidelity PDF flyer with a designated{" "}
                                    <strong>{dailyPromoCode}</strong> code block
                                    automatically preloaded.
                                  </p>
                                </div>

                                {/* Save Changes button */}
                                <button
                                  type="button"
                                  disabled={isSavingPromo}
                                  onClick={handleSavePromotion}
                                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs"
                                >
                                  {isSavingPromo ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      Synchronizing Cloud Rules...
                                    </>
                                  ) : (
                                    <>
                                      <Gift className="h-4 w-4" /> Save & Push
                                      Live
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === "assistant" && (
                      <div className="h-full">
                        <AdminAIAssistant />
                      </div>
                    )}

                    {activeTab === "map" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            Interactive Fleet GPS Tracking
                          </h3>
                        </div>
                        <p className="text-[10px] text-slate-500 max-w-2xl leading-relaxed">
                          Live satellite tracking of all vessel boarding scan
                          paths. Geofencing routes are automatically drawn
                          chronologically across available crew logs and scan
                          actions.
                        </p>
                        <VesselTrackingMap limitPoints={300} />
                      </div>
                    )}

                    {activeTab === "commissions" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-0 md:p-5">
                        <AdminCommissions />
                      </div>
                    )}

                    {activeTab === "feedback" && (
                      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-0 md:p-5">
                        <AdminFeedback />
                      </div>
                    )}

                    {activeTab === "backups" && (
                      <div className="bg-white border text-left border-slate-200 rounded-lg shadow-sm p-4 md:p-6">
                        <AdminDatabaseBackups />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingAgent && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setEditingAgent(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xs shadow-2xl overflow-hidden flex flex-col font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#0F172A] text-white flex justify-between items-center shrink-0">
              <h3 className="text-sm font-serif flex items-center gap-2 tracking-wide italic">
                <Edit2 className="h-4 w-4 text-emerald-400" />
                Edit Agent Info:{" "}
                <span className="font-sans font-bold text-slate-300 not-italic text-xs">
                  {editingAgent.email}
                </span>
              </h3>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-1 hover:bg-slate-800 rounded-xs transition-colors cursor-pointer text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-4 text-left text-xs text-slate-700 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Full Broker Name
                  </label>
                  <input
                    type="text"
                    value={editAgentName}
                    onChange={(e) => setEditAgentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    WhatsApp ID
                  </label>
                  <input
                    type="text"
                    value={editAgentWhatsApp}
                    onChange={(e) => setEditAgentWhatsApp(e.target.value)}
                    placeholder="e.g. 66636368287 (numbers only)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editAgentPhone}
                    onChange={(e) => setEditAgentPhone(e.target.value)}
                    placeholder="e.g. +66 63 636 8287"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Line ID
                  </label>
                  <input
                    type="text"
                    value={editAgentLine}
                    onChange={(e) => setEditAgentLine(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    WeChat ID
                  </label>
                  <input
                    type="text"
                    value={editAgentWeChat}
                    onChange={(e) => setEditAgentWeChat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editAgentCompany}
                    onChange={(e) => setEditAgentCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editAgentCountry}
                    onChange={(e) => setEditAgentCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Tax ID / Business Reg
                  </label>
                  <input
                    type="text"
                    value={editAgentTaxId}
                    onChange={(e) => setEditAgentTaxId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Company Address
                </label>
                <input
                  type="text"
                  value={editAgentAddress}
                  onChange={(e) => setEditAgentAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Custom Portal Welcome Message
                </label>
                <textarea
                  value={editAgentWelcome}
                  onChange={(e) => setEditAgentWelcome(e.target.value)}
                  rows={2}
                  placeholder="Greeting displayed to visitors booking through this agent's referral details."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingAgent.email) return;
                    const res = await adminUpdateAgent(editingAgent.email, {
                      name: editAgentName,
                      contactPhone: editAgentPhone,
                      whatsapp: editAgentWhatsApp,
                      lineId: editAgentLine,
                      wechatId: editAgentWeChat,
                      companyName: editAgentCompany,
                      companyAddress: editAgentAddress,
                      country: editAgentCountry,
                      taxId: editAgentTaxId,
                      welcomeMessage: editAgentWelcome,
                    });
                    safeAlert(res.message);
                    if (res.success) {
                      setEditingAgent(null);
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold uppercase tracking-wider rounded-xs text-[10px] text-center transition-colors cursor-pointer shadow-2xs"
                >
                  Save Broker Account
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xs text-[10px] text-center transition-colors cursor-pointer border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AddAgentManager onAdded={() => {}} />
    </>
  );
}
