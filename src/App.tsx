import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ship,
  MapPin,
  Anchor,
  Compass,
  Waves,
  Sunset,
  CheckCircle,
  HelpCircle,
  Award,
  Shuffle,
  User,
  Settings,
  LogOut,
  Printer,
  Sparkles,
  Gift,
  Moon,
  MessageSquare,
  Bell,
  RefreshCw,
  Menu,
  X as XIcon,
  Copy,
  FileText,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Users,
  Check,
  AlertCircle,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { playSuccessChime } from "./utils/audio";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  disableNetwork,
  enableNetwork,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from "firebase/auth";
import { QrCode, Gauge, Lock, Play } from "lucide-react";
import { CATAMARANS } from "./data";
import { safeStringify } from "./lib/jsonSafe";
import VesselCard from "./components/VesselCard";
import VesselComparisonModal from "./components/VesselComparisonModal";
import BookingForm from "./components/BookingForm";
import FastBookingSystem from "./components/FastBookingSystem";
import CharterBookingWizard from "./components/CharterBookingWizard";
import ItineraryHelper from "./components/ItineraryHelper";
import ExcursionMap from "./components/ExcursionMap";
import PrivacyBanner from "./components/PrivacyBanner";
import AdminPortal from "./components/AdminPortal";
import { useLanguage } from "./LanguageContext";
import { useCurrency } from "./CurrencyContext";
import { useAgent, Agent } from "./AgentContext";
import { useIsAdmin } from "./useIsAdmin";
import { useMaintenanceMode } from "./useMaintenanceMode";
import AgentPortalModal from "./components/AgentPortalModal";
import CustomerPortalModal from "./components/CustomerPortalModal";
import CaptainWorkspaceModal from "./components/CaptainWorkspaceModal";
import PDFChatModal from "./components/PDFChatModal";
import FAQSection from "./components/FAQSection";
import CustomerWorkspace from "./components/CustomerWorkspace";
import { DigitalBusinessCard } from "./components/DigitalBusinessCard";
import VesselOperationsPortal from "./components/VesselOperationsPortal";
import { generateCaptainManifestPdf } from "./lib/pdfGenerator";
import VesselVideoModal from "./components/VesselVideoModal";

import AgentChatPopup from "./components/AgentChatPopup";
import ScrollToTop from "./components/ScrollToTop";
import ShareAppButton from "./components/ShareAppButton";
import { getPublicUrl } from "./utils/url";
import { QRCodeSVG } from "qrcode.react";
import { DESTINATIONS, STANDARD_EXTRAS } from "./data";
import { VESSEL_BASE_RATES } from "./components/VesselCard";

const CopyLinkButton = ({ link, label }: { link: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center justify-center p-1 rounded-sm bg-slate-800/50 hover:bg-emerald-600/50 text-slate-300 hover:text-white transition-colors cursor-pointer group"
      title={label || "Copy Link"}
    >
      {copied ? (
        <CheckCircle className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 opacity-70 group-hover:opacity-100" />
      )}
    </button>
  );
};

export default function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        localStorage.removeItem("phuket_charter_active_chat_id");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const {
    currentAgent,
    getContactPhone,
    isReferred,
    logout,
    getNormalizedWhatsApp,
    isInitialized,
  } = useAgent();
  const [isAgentOnline, setIsAgentOnline] = useState<boolean>(false);
  const [showDigitalBusinessCard, setShowDigitalBusinessCard] =
    useState<boolean>(false);
  const isAdmin = useIsAdmin();
  const isMaintenanceMode = useMaintenanceMode();

  // Dummy script removed to prevent automatic database overwrites on every refresh.

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
          setIsAgentOnline(false);
        }
      },
      (err: any) => {
        if (err.message && err.message.includes("permission")) return; // Silent error
        console.log("Failed to load agent presence in App:", err);
      },
    );

    return () => unsubscribe();
  }, [currentAgent]);

  const [fleetVersion, setFleetVersion] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("workspace") === "customer" ? "customer" : null;
  });

  // Dynamically load an agent's personal custom ships/routes into the global state locally so the interface offers them.
  useEffect(() => {
    if (currentAgent && !currentAgent.isAdmin) {
      let updated = false;
      const agentVessels = localStorage.getItem(
        `agent_vessels_${currentAgent.id}`,
      );
      if (agentVessels) {
        const customV = JSON.parse(agentVessels);
        customV.forEach((cv: any) => {
          const idx = CATAMARANS.findIndex((v) => v.id === cv.id);
          if (idx < 0) CATAMARANS.push(cv);
          else CATAMARANS[idx] = cv;
        });
        updated = true;
      }
      const agentRoutes = localStorage.getItem(
        `agent_routes_${currentAgent.id}`,
      );
      if (agentRoutes) {
        const customR = JSON.parse(agentRoutes);
        customR.forEach((cr: any) => {
          const idx = DESTINATIONS.findIndex((r) => r.id === cr.id);
          if (idx < 0) DESTINATIONS.push(cr);
          else DESTINATIONS[idx] = cr;
        });
        updated = true;
      }
      // Agent rates overwrite logic was removed to prevent global pricing mixing.

      if (updated) {
        setFleetVersion((v) => v + 1);
      }
    }
  }, [currentAgent]);

  // App initialization override for data
  useEffect(() => {
    // Open Agent Portal if parameter passed
    const params = new URLSearchParams(window.location.search);

    // Auto-open Captain Workspace if a scan parameter is passed
    const scanParam = params.get("scan");
    if (scanParam) {
      // Decode if it hasn't been properly decoded
      const decodedScan = decodeURIComponent(scanParam);
      localStorage.setItem("pending_scan_verify", decodedScan);
      setIsCaptainPortalOpen(true);

      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("scan");
      const qs = newParams.toString();
      const cleanUrl = window.location.pathname + (qs ? "?" + qs : "");
      window.history.replaceState({}, "", cleanUrl);
    }

    if (params.get("agent-portal") === "true") {
      setIsAgentPortalOpen(true);
      const editPropId = params.get("edit-proposal-id");
      if (editPropId) {
        setPortalEditingProposalId(editPropId);
      }
    }

    // Open generator if compare parameter passed
    if (params.get("compare") === "true") {
      setIsComparisonOpen(true);
      if (params.get("v1")) setCompareV1(params.get("v1")!);
      if (params.get("clientName"))
        setCompareClientName(params.get("clientName")!);
      if (params.get("replyToChatId"))
        setCompareReplyToChatId(params.get("replyToChatId")!);
    }

    // Open Customer Portal if parameter passed
    if (params.get("customer-portal") === "true") {
      setIsCustomerPortalOpen(true);
    }

    // Open Captain & Crew Workspace if parameter passed
    if (
      params.get("workspace") === "crew" ||
      params.get("workspace") === "captain" ||
      params.get("captain-portal") === "true"
    ) {
      setIsCaptainPortalOpen(true);
    }

    // Open Vessel Operations & Boarding Portal if parameter passed
    const vPortal = params.get("vessel-portal") || params.get("ship-portal");
    if (vPortal) {
      setVesselPortalActiveId(vPortal);
    }

    // Helper to auto-repair image paths containing old /src/assets references or broken thebest1/thebest2 local assets
    const sanitizeVesselImages = (vesselsList: any[]) => {
      return vesselsList.map((vessel) => {
        const updated = { ...vessel };
        const mapBrokenPath = (path: string) => {
          if (typeof path !== "string") return path;
          let p = path;
          if (p.startsWith("/src/assets/")) {
            p = p.replace("/src/assets/", "/assets/");
          } else if (p.includes("/src/assets/")) {
            p = p.replace(/\/src\/assets\//g, "/assets/");
          }
          if (p.includes("thebest1.jpg")) {
            return "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=800&q=80";
          }
          if (p.includes("thebest2.jpg")) {
            return "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=800&q=80";
          }
          return p;
        };

        if (updated.image) {
          updated.image = mapBrokenPath(updated.image);
        }
        if (Array.isArray(updated.images)) {
          updated.images = updated.images.map((img: any) => mapBrokenPath(img));
        }
        return updated;
      });
    };

    // 1. First load from locally saved cache for instant zero-latency visual draw
    try {
      const storedVessels = localStorage.getItem("admin_vessels_override");
      if (storedVessels) {
        const parsed = JSON.parse(storedVessels);
        const sanitized = sanitizeVesselImages(parsed);
        CATAMARANS.length = 0;
        CATAMARANS.push(...sanitized);
        localStorage.setItem(
          "admin_vessels_override",
          safeStringify(sanitized),
        );
      }
      const storedRoutes = localStorage.getItem("admin_routes_override");
      if (storedRoutes) {
        const parsedRoutes = JSON.parse(storedRoutes);
        DESTINATIONS.length = 0;
        DESTINATIONS.push(...parsedRoutes);
      }
      const storedAddons = localStorage.getItem("admin_addons_override");
      if (storedAddons) {
        const parsedAddons = JSON.parse(storedAddons);
        STANDARD_EXTRAS.length = 0;
        STANDARD_EXTRAS.push(...parsedAddons);
      }
      setFleetVersion((v) => v + 1);
    } catch (e) {
      console.error("Failed to load local admin overrides", e);
    }

    // 2. Fetch and synchronize live fleet settings from Firestore globally for all clients/published links!
    const syncCloudFleet = async () => {
      const isOfflineMode =
        localStorage.getItem("charter_offline_mode") === "true";
      if (isOfflineMode) {
        console.log(
          "Maritime Offline Access is active. Skipping cloud data sync.",
        );
        return;
      }
      try {
        const vesselsSnap = await getDoc(doc(db, "fleet", "vessels"));
        if (vesselsSnap.exists()) {
          const cloudVessels = vesselsSnap.data().list;
          if (cloudVessels && Array.isArray(cloudVessels)) {
            const sanitized = sanitizeVesselImages(cloudVessels);
            CATAMARANS.length = 0;
            CATAMARANS.push(...sanitized);
            localStorage.setItem(
              "admin_vessels_override",
              safeStringify(sanitized),
            );
          }
        }

        const routesSnap = await getDoc(doc(db, "fleet", "routes"));
        if (routesSnap.exists()) {
          const cloudRoutes = routesSnap.data().list;
          if (cloudRoutes && Array.isArray(cloudRoutes)) {
            DESTINATIONS.length = 0;
            DESTINATIONS.push(...cloudRoutes);
            localStorage.setItem(
              "admin_routes_override",
              safeStringify(cloudRoutes),
            );
          }
        }

        const addonsSnap = await getDoc(doc(db, "fleet", "addons"));
        if (addonsSnap.exists()) {
          const cloudAddons = addonsSnap.data().list;
          if (cloudAddons && Array.isArray(cloudAddons)) {
            STANDARD_EXTRAS.length = 0;
            STANDARD_EXTRAS.push(...cloudAddons);
            localStorage.setItem(
              "admin_addons_override",
              safeStringify(cloudAddons),
            );
          }
        }

        // Force react state trigger update so UI updates with newest synchronized photos & details
        setFleetVersion((v) => v + 1);
      } catch (err: any) {
        console.warn("Could not synchronize cloud fleet settings:", err);
        if (
          err?.message?.toLowerCase().indexOf("quota") !== -1 ||
          err?.code === "resource-exhausted"
        ) {
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
      }
    };

    syncCloudFleet();
  }, [currentAgent]);

  useEffect(() => {
    // Allows admin fleet settings to dynamically refresh the app without a full window reload
    const handleAdminDataUpdated = () => {
      setFleetVersion((v) => v + 1);
    };
    window.addEventListener("admin-data-updated", handleAdminDataUpdated);
    return () => {
      window.removeEventListener("admin-data-updated", handleAdminDataUpdated);
    };
  }, []);

  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    // Intercept console.error and console.warn to capture caught Firestore quota/exhausted errors
    const originalConsoleError = console.error;
    console.error = function (...args: any[]) {
      try {
        const argStr = args
          .map((a) => {
            if (!a) return "";
            if (typeof a === "object") {
              return a.message || a.code || String(a);
            }
            return String(a);
          })
          .join(" ")
          .toLowerCase();

        if (argStr.includes("quota") || argStr.includes("resource-exhausted")) {
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
      } catch (e) {
        // Safe fallback
      }
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = function (...args: any[]) {
      try {
        const argStr = args
          .map((a) => {
            if (!a) return "";
            if (typeof a === "object") {
              return a.message || a.code || String(a);
            }
            return String(a);
          })
          .join(" ")
          .toLowerCase();

        if (argStr.includes("quota") || argStr.includes("resource-exhausted")) {
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
      } catch (e) {
        // Safe fallback
      }
      originalConsoleWarn.apply(console, args);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason;
        const reasonStr = String(
          reason?.message || reason?.code || reason || "",
        ).toLowerCase();
        if (
          reasonStr.includes("quota") ||
          reasonStr.includes("resource-exhausted")
        ) {
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
      } catch (e) {}
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    const handleQuota = () => {
      setIsQuotaExceeded(true);
      disableNetwork(db).catch((e: any) =>
        console.warn("Failed to set Firestore offline:", e),
      );
    };
    window.addEventListener("phuket_quota_exceeded", handleQuota);
    return () => {
      window.removeEventListener("phuket_quota_exceeded", handleQuota);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  useEffect(() => {
    const handleOpenPdfChat = () => setIsPdfChatOpen(true);
    const handleClosePdfChat = () => setIsPdfChatOpen(false);
    window.addEventListener("phuket_open_pdf_chat", handleOpenPdfChat);
    window.addEventListener("phuket_close_pdf_chat", handleClosePdfChat);

    // Auto-open PDF Chat if a session parameter is present
    const params = new URLSearchParams(window.location.search);
    if (params.get("session")) {
      setIsPdfChatOpen(true);
    }

    return () => {
      window.removeEventListener("phuket_open_pdf_chat", handleOpenPdfChat);
      window.removeEventListener("phuket_close_pdf_chat", handleClosePdfChat);
    };
  }, []);

  // Dedicated URL parameter handler for scanned customer pairing QR codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairCustomer = params.get("pair_customer");
    if (!pairCustomer) return;

    if (currentAgent) {
      setPortalInquiryTab("customers");
      setIsAgentPortalOpen(true);

      const myAgentId =
        currentAgent.id ||
        currentAgent.uid ||
        currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const myAgentEmail = currentAgent.email.toLowerCase().trim();

      const customerRef = doc(db, "customers", pairCustomer);

      // Fetch customer first to get a neat name or email for visual confirmation dialog
      getDoc(customerRef)
        .then((snap) => {
          const customerName = snap.exists()
            ? snap.data()?.name || snap.data()?.email || "Charter Guest"
            : "Charter Guest";

          // Use setDoc with merge to ensure doc exists
          setDoc(
            customerRef,
            {
              uid: pairCustomer,
              representativeBroker: currentAgent,
              representativeBrokerId: myAgentId,
              brokerId: myAgentId,
              brokerEmail: myAgentEmail,
            },
            { merge: true },
          )
            .then(() => {
              console.log(
                "Successfully paired customer via URL parameter:",
                pairCustomer,
              );

              // Try to also pair inside registered guests
              try {
                const guestRef = doc(
                  db,
                  "admin_registered_guests",
                  pairCustomer,
                );
                setDoc(
                  guestRef,
                  {
                    uid: pairCustomer,
                    representativeBroker: currentAgent,
                    representativeBrokerId: myAgentId,
                    brokerId: myAgentId,
                    brokerEmail: myAgentEmail,
                  },
                  { merge: true },
                ).catch((err) => console.warn(err));
              } catch (e) {
                // Ignored
              }

              alert(
                `✅ PARTNER PAIRING SUCCESS!\n\nLinked customer "${customerName.toUpperCase()}" with your Broker Agent profile (${currentAgent.name}) successfully!\n\nThis client will now show up automatically in your Live Customers list.`,
              );

              // Clean URL parameters without reloading
              const newParams = new URLSearchParams(window.location.search);
              newParams.delete("pair_customer");
              const qs = newParams.toString();
              const cleanUrl = window.location.pathname + (qs ? "?" + qs : "");
              window.history.replaceState({}, "", cleanUrl);
            })
            .catch((e) => {
              console.error("URL customer pairing process failed:", e);
              alert("Failed to pair customer via URL link: " + e.message);
            });
        })
        .catch(() => {
          // Fallback if read failed
          setDoc(
            customerRef,
            {
              uid: pairCustomer,
              representativeBroker: currentAgent,
              representativeBrokerId: myAgentId,
              brokerId: myAgentId,
              brokerEmail: myAgentEmail,
            },
            { merge: true },
          )
            .then(() => {
              alert(
                `✅ PARTNER PAIRING SUCCESS!\n\nLinked customer successfully with your Broker Agent profile (${currentAgent.name})!\n\nThis client will now show up automatically in your Live Customers list.`,
              );

              const newParams = new URLSearchParams(window.location.search);
              newParams.delete("pair_customer");
              const qs = newParams.toString();
              const cleanUrl = window.location.pathname + (qs ? "?" + qs : "");
              window.history.replaceState({}, "", cleanUrl);
            })
            .catch((e) => {
              console.error("URL customer pairing fallback failed:", e);
            });
        });
    } else {
      // Prompt agent portal to open (which defaults to tab so when they log in it triggers the effect)
      setPortalInquiryTab("customers");
      setIsAgentPortalOpen(true);
    }
  }, [currentAgent]);

  useEffect(() => {
    // Setup BroadcastChannel to listen for chat popups triggered from other tabs
    const listenChannel = new BroadcastChannel("phuket_agent_popup_channel");
    listenChannel.onmessage = (event) => {
      const inqId = event.data;
      if (inqId && typeof inqId === "string") {
        console.log(
          "BroadcastChannel received trigger, opening popup for inquiry:",
          inqId,
        );
        setActiveChatPopups((prev) => {
          if (prev.includes(inqId)) return prev;
          return [...prev, inqId];
        });
      }
    };

    const handleEditProposal = () => {
      setIsAgentPortalOpen(false);
      setIsComparisonOpen(true);
    };

    const handleLoadBookingProposal = (e: CustomEvent) => {
      setIsAgentPortalOpen(false);
      setIsComparisonOpen(false);
      scrollToBooking();
      // the actual data population will happen inside BookingForm listening to this same event
    };

    const handleTriggerPopup = (e: CustomEvent) => {
      const inqId = e.detail;
      console.log(
        `[Diagnostic] 'trigger-agent-chat-popup' fired. InquiryId: ${inqId}. Origin: ${window.location.origin}`,
      );
      console.log("Triggering agent chat popup for inquiry:", inqId);
      setActiveChatPopups((prev) => {
        console.log("Current active popups:", prev);
        if (prev.includes(inqId)) return prev;
        const next = [...prev, inqId];
        console.log("Next active popups:", next);
        return next;
      });
      // Broadcast this trigger to other tabs/windows so they also open the popup
      if (inqId) {
        try {
          const popupChannel = new BroadcastChannel(
            "phuket_agent_popup_channel",
          );
          popupChannel.postMessage(inqId);
          popupChannel.close(); // Fire and forget
        } catch (err) {
          console.warn("Failed to broadcast chat popup trigger:", err);
        }
      }
    };

    const handleOpenQuoteGenerator = (e: CustomEvent) => {
      const { chatId, clientName, ship, date, pax } = e.detail;
      setCompareReplyToChatId(chatId);
      setCompareClientName(clientName);
      // We might need to store these in comparison modal props
      setIsComparisonOpen(true);
      setIsAgentPortalOpen(false);
    };

    window.addEventListener(
      "edit-proposal",
      handleEditProposal as EventListener,
    );
    window.addEventListener(
      "load-booking-proposal",
      handleLoadBookingProposal as EventListener,
    );
    window.addEventListener(
      "trigger-agent-chat-popup",
      handleTriggerPopup as EventListener,
    );
    window.addEventListener(
      "open-quote-generator",
      handleOpenQuoteGenerator as EventListener,
    );

    return () => {
      listenChannel.close();
      window.removeEventListener(
        "edit-proposal",
        handleEditProposal as EventListener,
      );
      window.removeEventListener(
        "load-booking-proposal",
        handleLoadBookingProposal as EventListener,
      );
      window.removeEventListener(
        "trigger-agent-chat-popup",
        handleTriggerPopup as EventListener,
      );
      window.removeEventListener(
        "open-quote-generator",
        handleOpenQuoteGenerator as EventListener,
      );
    };
  }, [currentAgent]);

  // Automatically trigger a live chat session for a customer who just scanned an agent's referral QR code
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams(window.location.search);
    const hasAgentParam =
      params.has("agent") ||
      params.has("agentName") ||
      params.has("agentEmail");
    const scanRef =
      localStorage.getItem("phuket_just_scanned_referral") === "true";

    // Check if we have a fresh referral or a stored one that hasn't been handled yet.
    // CRITICAL: We must ensure currentAgent is loaded first to prevent cleaning up URL parameters prematurely.
    const shouldTriggerChat =
      isReferred && !!currentAgent && (hasAgentParam || scanRef);

    if (shouldTriggerChat) {
      console.log("App: REFERRAL TRIGGER DETECTED", {
        isReferred,
        currentAgent: currentAgent?.name,
        hasAgentParam,
        scanRef,
      });

      // Cleanup: Remove the "just scanned" flag and optionally clear the URL
      localStorage.removeItem("phuket_just_scanned_referral");
      if (hasAgentParam) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("App: Cleaned referral parameters from URL.");
      }

      // Track QR Code Scan Analytics
      if (currentAgent?.id) {
        try {
          const agentRef = doc(db, "agents", currentAgent.id);
          setDoc(
            agentRef,
            { qrScans: increment(1), lastScanAt: new Date().toISOString() },
            { merge: true },
          ).catch((err) => {
            console.warn("Analytics: Failed to increment QR scan:", err);
          });
          console.log("Analytics: QR Scan Tracked for agent", currentAgent.id);
        } catch (e) {}
      }

      console.log(
        "App: Showing Digital Business Card instead of auto chat popup.",
      );
      setShowDigitalBusinessCard(true);
    }
  }, [isInitialized, isReferred, currentAgent, isAgentOnline]);

  useEffect(() => {
    if (!isQuotaExceeded) return;

    // Periodically check if Firestore has recovered (e.g. daily quota reset)
    const interval = setInterval(async () => {
      console.log(
        "[Phuket Recovery System] Checking if Firestore quota has reset/recovered...",
      );
      try {
        await enableNetwork(db);

        // Attempt a small read operation with short timeout to check if the quota is no longer exhausted
        const testPromise = getDoc(doc(db, "system_health", "ping"));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout during testing")), 3500),
        );

        await Promise.race([testPromise, timeoutPromise]);

        // Success! Quota is restored.
        console.log(
          "[Phuket Recovery System] Firestore has been restored successfully!",
        );
        setIsQuotaExceeded(false);
        window.dispatchEvent(new CustomEvent("phuket_quota_recovered"));
      } catch (err: any) {
        const errMsg = String(err?.message || err?.code || err).toLowerCase();
        if (errMsg.includes("quota") || errMsg.includes("resource-exhausted")) {
          console.warn(
            "[Phuket Recovery System] Quota still exceeded. Retrying later...",
          );
          disableNetwork(db).catch(() => {});
        } else if (errMsg.includes("timeout")) {
          console.log(
            "[Phuket Recovery System] Check timed out or is pending network, keeping offline.",
          );
          disableNetwork(db).catch(() => {});
        } else {
          // If Firestore returns standard permission-denied or not-found,
          // it proves connectivity and that the quota is NOT exhausted anymore.
          if (
            errMsg.includes("permission-denied") ||
            errMsg.includes("not-found")
          ) {
            console.log(
              "[Phuket Recovery System] Firestore responded, meaning quota is active/recovered!",
            );
            setIsQuotaExceeded(false);
            window.dispatchEvent(new CustomEvent("phuket_quota_recovered"));
          } else {
            console.warn(
              "[Phuket Recovery System] Encountered error during test, maintaining offline state:",
              err,
            );
            disableNetwork(db).catch(() => {});
          }
        }
      }
    }, 45000); // Check every 45s

    return () => clearInterval(interval);
  }, [isQuotaExceeded]);

  const [selectedVesselId, setSelectedVesselId] = useState<string>("the-best");
  const [frontPageVideoUrl, setFrontPageVideoUrl] = useState<string | null>(null);
  const [frontPageVideoTitle, setFrontPageVideoTitle] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Boarding Verification States
  const [verifyBookingId, setVerifyBookingId] = useState<string | null>(null);
  const [gateLoader, setGateLoader] = useState(false);
  const [gateBooking, setGateBooking] = useState<any | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  // Check URL on load for verifyBoardingId or expressManifest & Clear history/logins of previous users
  useEffect(() => {
    // 1. Sign out of Firebase Auth to ensure a fresh session without logged-in leftovers
    signOut(auth).catch((err) => {
      console.warn("Session auto-clear on initial load:", err);
    });

    // 2. Erase any saved mock logins or cached companion entries to prevent cross-profile exposure
    const itemsToClear = [
      "sandbox_customer_session",
      "phuket_charter_active_chat_id",
      "registering_captain_email",
    ];

    // NOTE: We preserve agent cookie lock referral IDs ("charter_active_agent", "charter_agent_referred")
    // so that brokers still receive their deserved commissions and referral link tracking!
    itemsToClear.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });

    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get("verifyBoardingId");
    if (verifyId) {
      setVerifyBookingId(verifyId);
    }
    const expressManifest = params.get("expressManifest");
    if (expressManifest) {
      setCustomerPortalInitialTab("express-manifest");
      setIsCustomerPortalOpen(true);
    }
  }, []);

  // Fetch boarding validation reference from Firestore
  useEffect(() => {
    if (!verifyBookingId) {
      setGateBooking(null);
      setGateError(null);
      return;
    }

    const fetchBooking = async () => {
      setGateLoader(true);
      setGateError(null);
      try {
        const docRef = doc(db, "booking_requests", verifyBookingId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setGateBooking(snap.data());
        } else {
          setGateError(
            "No matching yacht charter manifest found in secure ledger database.",
          );
        }
      } catch (err: any) {
        console.error("Ledger retrieval error:", err);
        setGateError(
          "Secure database access error. Check connectivity or offline/quota state.",
        );
      } finally {
        setGateLoader(false);
      }
    };

    fetchBooking();
  }, [verifyBookingId]);

  const handleAuthorizeBoarding = async () => {
    if (!verifyBookingId || !gateBooking) return;
    try {
      setGateLoader(true);
      const docRef = doc(db, "booking_requests", verifyBookingId);
      await updateDoc(docRef, {
        boardingStatus: "Boarded",
        boardedAt: new Date().toISOString(),
      });
      playSuccessChime();
      setGateBooking((prev) =>
        prev
          ? {
              ...prev,
              boardingStatus: "Boarded",
              boardedAt: new Date().toISOString(),
            }
          : null,
      );
    } catch (err) {
      console.error("Failed to authorize boarding:", err);
      alert("Failed to write authorization to Firestore. Check connection.");
    } finally {
      setGateLoader(false);
    }
  };

  const exportManifestToCSV = () => {
    if (
      !gateBooking ||
      !gateBooking.passengers ||
      gateBooking.passengers.length === 0
    ) {
      alert("No additional passenger manifest data found for this booking.");
      return;
    }

    // Prepare CSV data
    const headers = [
      "No",
      "Full Name",
      "Nationality",
      "Age",
      "Passport/ID",
      "Passport Expiry",
    ];
    const rows = gateBooking.passengers.map((pax: any, idx: number) => [
      idx + 1,
      pax.name || "",
      pax.nationality || "",
      pax.age || "",
      pax.passport || "",
      pax.passportExpiry || "",
    ]);

    // Construct CSV content
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(","),
      ),
    ];
    const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel compatibility

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pax_manifest_${verifyBookingId}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCaptainManifest = () => {
    if (!gateBooking) {
      alert("No active check-in booking available to generate manifest.");
      return;
    }

    // Find vessel name
    const catamaranObj = CATAMARANS.find((v) => v.id === gateBooking.vesselId1);
    const vesselNameStr =
      catamaranObj?.name || gateBooking.vesselId1 || "Premium Yacht";

    const manifestData = {
      id: verifyBookingId || gateBooking.id || "GUEST-MANIFEST",
      clientName:
        gateBooking.clientName ||
        gateBooking.customerName ||
        "Authenticated Guest",
      customerEmail: gateBooking.customerEmail,
      charterDate: gateBooking.charterDate,
      vesselName: vesselNameStr,
      guestCount: gateBooking.guestCount,
      hotelPickupLocation: gateBooking.hotelPickupLocation,
      passengers: gateBooking.passengers || [],
      boardingStatus: gateBooking.boardingStatus,
      boardedAt: gateBooking.boardedAt,
    };

    try {
      const doc = generateCaptainManifestPdf(manifestData);
      doc.save(`Vessel_Manifest_${verifyBookingId || "Captain"}.pdf`);
    } catch (err) {
      console.error(
        "Failed to generate and download Captain Manifest PDF:",
        err,
      );
      alert("An error occurred while compiling the print-ready manifest PDF.");
    }
  };

  const getSuccessBookingId = () => {
    if ((bookingDetails as any)?.bookingId)
      return (bookingDetails as any).bookingId;
    try {
      const stored = localStorage.getItem("phuket_charter_proposals");
      if (stored) {
        const proposals = JSON.parse(stored);
        if (proposals && proposals.length > 0 && proposals[0].id) {
          return proposals[0].id;
        }
      }
    } catch (e) {
      console.warn("Failed to get booking ID from localStorage:", e);
    }
    return "prop-" + Date.now(); // Fallback
  };

  const handleClosePdfPreview = () => {
    setShowPdfPreviewModal(false);
    if (pdfPreviewUrl && pdfPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
  };

  const [bookingDetails, setBookingDetails] = useState<{
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
  } | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [compareV1, setCompareV1] = useState("the-best");
  const [compareClientName, setCompareClientName] = useState("");
  const [compareReplyToChatId, setCompareReplyToChatId] = useState<
    string | undefined
  >(undefined);
  const [isAgentPortalOpen, setIsAgentPortalOpen] = useState(false);
  const [isCaptainPortalOpen, setIsCaptainPortalOpen] = useState(false);
  const [isFastBookingModalOpen, setIsFastBookingModalOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [customerPortalInitialTab, setCustomerPortalInitialTab] = useState<"login" | "register" | "forgot" | "express-manifest">("login");
  const [isPdfChatOpen, setIsPdfChatOpen] = useState(false);
  const [vesselPortalActiveId, setVesselPortalActiveId] = useState<
    string | null
  >(null);
  const [isOfflineChatHovered, setIsOfflineChatHovered] = useState(false);
  const bookingFormRef = useRef<HTMLDivElement>(null);

  // Custom landing-page wizard states
  const [landingStep, setLandingStep] = useState<number>(0);
  const [bookingFormSubStep, setBookingFormSubStep] = useState<number>(2);
  const [selectedDestinationsCount, setSelectedDestinationsCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("phuket_booking_form_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.destinations)) {
          const clean = parsed.destinations.filter((d: any) => d && d !== "custom-route");
          return clean.length;
        }
      }
    } catch (e) {
      console.warn("Could not read initial destinations from localStorage:", e);
    }
    return 0;
  });
  const [wizardFlowMode, setWizardFlowMode] = useState<"full" | "fast">("full");
  const wizardContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToLandingStep = (stepIndex: number) => {
    setLandingStep(stepIndex);
    if (stepIndex === 3) {
      if (landingStep === 2) {
        // Sequentially came from Step 3 (Explore Andaman Routes)
        setBookingFormSubStep(3);
      } else {
        // Fast route or skip option starts on 1.route selection (formStep === 2)
        setBookingFormSubStep(2);
      }
    }
    setTimeout(() => {
      wizardContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // Inquiry state trackers & navigation syncing
  const [portalInquiryTab, setPortalInquiryTab] = useState<
    "quotes" | "inquiries" | "customers" | "fleet"
  >("quotes");
  const [portalActiveInquiryId, setPortalActiveInquiryId] = useState<
    string | null
  >(null);
  const [portalEditingProposalId, setPortalEditingProposalId] = useState<
    string | null
  >(null);
  const [unreadInquiries, setUnreadInquiries] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<{
    id: string;
    clientName: string;
    message: string;
  } | null>(null);
  const [activeChatPopups, setActiveChatPopups] = useState<string[]>([]);
  useEffect(() => {
    if (!currentAgent) {
      setActiveChatPopups([]);
    }
  }, [currentAgent]);

  const [currentCustomer, setCurrentCustomer] = useState<FirebaseUser | null>(
    null,
  );
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Robust Role Validation: Check if the user is a Captain or Agent *before* treating as Customer
        try {
          // Agenti su keyirani po e-mailu (ne uid) — traži po email-ID-u
          const agentEmailId = (user.email || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_");
          const [captainDoc, agentDoc] = await Promise.all([
            getDoc(doc(db, "captains", user.uid)),
            agentEmailId
              ? getDoc(doc(db, "agents", agentEmailId))
              : Promise.resolve({ exists: () => false } as any),
          ]);

          if (captainDoc.exists() || agentDoc.exists()) {
            // User is recognized as a specific role - DO NOT treat as regular customer
            setCurrentCustomer(null);
            setCustomerData(null);
            // Optionally: Clear any stale customer auth storage
            return;
          }
        } catch (e) {
          console.warn("Error verifying role during Auth state change:", e);
        }

        // Proceed with normal customer loading
        setCurrentCustomer(user);
        try {
          const docRef = doc(db, "customers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCustomerData(data);
            try {
              localStorage.setItem(
                `offline_customer_${user.uid}`,
                safeStringify(data),
              );
            } catch (storageErr) {}
          } else {
            setCustomerData(null);
          }
        } catch (err: any) {
          console.warn(
            "Soft Offline Notice: customer data read error:",
            err.message,
          );
          const localData = localStorage.getItem(
            `offline_customer_${user.uid}`,
          );
          if (localData) {
            try {
              setCustomerData(JSON.parse(localData));
            } catch (parseErr) {
              setCustomerData(null);
            }
          } else {
            setCustomerData(null);
          }
        }
      } else {
        setCurrentCustomer(null);
        setCustomerData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const [promoActive, setPromoActive] = useState(false);
  const [promoTitle, setPromoTitle] = useState("Special Promotion");
  const [dailyPromoActive, setDailyPromoActive] = useState(false);
  const [dailyPromoTitle, setDailyPromoTitle] = useState("Daily Special Offer");

  useEffect(() => {
    const fetchPromosActive = async () => {
      try {
        const promoRef = doc(db, "promotions", "overnight");
        const snap = await getDoc(promoRef);
        if (snap.exists() && snap.data().active) {
          setPromoActive(true);
          if (snap.data().title) {
            setPromoTitle(snap.data().title);
          }
        }

        const dailyRef = doc(db, "promotions", "daily");
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists() && dailySnap.data().active) {
          setDailyPromoActive(true);
          if (dailySnap.data().title) {
            setDailyPromoTitle(dailySnap.data().title);
          }
        }
      } catch (e) {
        console.warn("Could not check promo active status:", e);
      }
    };
    fetchPromosActive();
  }, []);

  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  // Synthetic luxury chime player for new incoming broker chats (Idea 2)
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

  // Agent Heartbeat Presence Logger
  useEffect(() => {
    if (!currentAgent || isReferred) return;

    const myAgentId =
      currentAgent.id ||
      currentAgent.uid ||
      currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const updatePresence = async () => {
      try {
        await setDoc(
          doc(db, "agent_presence", myAgentId),
          {
            email: currentAgent.email,
            name: currentAgent.name,
            lastActive: Date.now(),
            isOnline: true,
          },
          { merge: true },
        );
      } catch (err: any) {
        if (err.message && err.message.includes("permission")) {
          // Silent failure (expected when anonymous visitor is impersonating or unauthenticated)
        } else {
          console.warn("Presence heartbeat write failed:", err);
        }
      }
    };

    // Explicitly handle tab closure to mark agent offline
    const handleBeforeUnload = () => {
      setDoc(
        doc(db, "agent_presence", myAgentId),
        {
          isOnline: false,
          lastActive: Date.now(),
        },
        { merge: true },
      ).catch((err) => {
        if (err.message && err.message.includes("permission")) {
          // Silently ignore if unauthorized (expected for unregistered visitors)
        } else {
          console.log("Presence teardown write failed:", err);
        }
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    updatePresence();
    const interval = setInterval(updatePresence, 15000); // Heartbeat every 15 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Mark offline on exit (re-run logic to ensure it fires)
      handleBeforeUnload();
    };
  }, [currentAgent, isReferred]);

  // Real-time Firestore Live Inquiries Listener (Idea 1 & Idea 2)
  useEffect(() => {
    if (!currentAgent || isReferred) return;

    const activeBrokerId =
      currentAgent.id ||
      currentAgent.uid ||
      currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const activeBrokerEmail = currentAgent.email.toLowerCase().trim();

    const q = query(collection(db, "inquiries"));
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const unreadsList: any[] = [];
        const now = Date.now();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.isRead === false) {
            const bId = (data.brokerId || "").trim();
            const bEmail = (data.brokerEmail || "").trim().toLowerCase();

            // Only show in the agent workspace if the inquiry belongs to this specific agent's session (or if current agent is Vinko/Admin)
            const isVinko =
              currentAgent?.isAdmin === true ||
              currentAgent?.email?.toLowerCase() === "vinko.mitar@gmail.com";
            const isMySession = isVinko
              ? true
              : bId === activeBrokerId || bEmail === activeBrokerEmail;

            if (isMySession) {
              unreadsList.push({ id: doc.id, ...data });
            }
          }
        });

        setUnreadInquiries(unreadsList);
        // console.log("Unread inquiries found:", unreadsList.length);

        // Inspect for new incoming client messages
        unreadsList.forEach((inq) => {
          const history = inq.chatHistory || [];
          const lastMsg = history[history.length - 1];
          const lastMsgSender = lastMsg ? lastMsg.sender : "client";
          const lastMsgText = lastMsg ? lastMsg.text : inq.message;
          const msgTime = lastMsg
            ? new Date(lastMsg.createdAt).getTime()
            : new Date(inq.createdAt || 0).getTime();

          // Ensure the message is sent by a client, OR it's an unread AI Chatbot message
          if (
            lastMsgSender === "client" ||
            (lastMsgSender === "agent" &&
              lastMsgText &&
              lastMsgText.includes("[AI Concierge]"))
          ) {
            // console.log("Detected client message, processing inquiry:", inq.id);
            const messageId =
              inq.id + "_" + (lastMsg?.createdAt || inq.createdAt || "");
            if (!notifiedMessagesRef.current.has(messageId)) {
              notifiedMessagesRef.current.add(messageId);

              // Alert if not initial load, OR if it IS initial load but the message is very recent (less than 5 minutes old)
              const isVeryRecent = msgTime > Date.now() - 5 * 60 * 1000;
              if (!isInitialLoad || isVeryRecent) {
                const inqActiveBrokerId = inq.activeBrokerId;
                const isVinko =
                  currentAgent?.isAdmin === true ||
                  currentAgent?.email?.toLowerCase() ===
                    "vinko.mitar@gmail.com";
                const isLockedByOther =
                  !isVinko &&
                  inqActiveBrokerId &&
                  inqActiveBrokerId !== activeBrokerId &&
                  inqActiveBrokerId !== "none" &&
                  inqActiveBrokerId !== "unassigned";

                if (isLockedByOther) {
                  console.log(
                    `Inquiry ${inq.id} is locked by session ${inqActiveBrokerId}. Skipping alerts.`,
                  );
                } else {
                  // Trigger Visual Toast Banner & Audio Chime Alert dynamically!
                  console.log("Setting active toast for:", inq.id);
                  setActiveToast({
                    id: inq.id,
                    clientName: inq.name,
                    message: lastMsgText,
                  });
                  playBellChime();

                  // Auto-open the chat popup for the agent so they can reply instantly
                  window.dispatchEvent(
                    new CustomEvent("trigger-agent-chat-popup", {
                      detail: inq.id,
                    }),
                  );

                  // AUTOMATICALLY pop open a specialized interactive chat window for the broker!
                  console.log(
                    "Automatically popping open chat for inquiry:",
                    inq.id,
                  );
                  setActiveChatPopups((prev) => {
                    console.log(
                      "Current active popups before auto-open:",
                      prev,
                    );
                    if (prev.includes(inq.id)) return prev;
                    const next = [...prev, inq.id];
                    console.log("Next active popups after auto-open:", next);
                    return next;
                  });
                }
              }
            }
          }
        });

        isInitialLoad = false;
      },
      (error: any) => {
        console.error("Failed to run live root inquiries subscription:", error);
        if (
          error?.message?.toLowerCase().indexOf("quota") !== -1 ||
          error?.code === "resource-exhausted"
        ) {
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
      },
    );

    return () => unsubscribe();
  }, [currentAgent]);

  // Customer's Self Active-Chat Real-time Listener (for referred visitors)
  useEffect(() => {
    if (currentAgent && !isReferred) return;

    // Check localStorage for any active chat inquiries
    const activeInqId = localStorage.getItem("phuket_charter_active_chat_id");
    if (!activeInqId) return;

    const docRef = doc(db, "inquiries", activeInqId);
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        const history = data?.chatHistory || [];
        const lastMsg = history[history.length - 1];
        const msgTime = lastMsg ? new Date(lastMsg.createdAt).getTime() : 0;

        if (
          lastMsg &&
          lastMsg.sender === "agent" &&
          (!lastMsg.text || !lastMsg.text.includes("[AI Concierge]"))
        ) {
          const messageId = activeInqId + "_" + (lastMsg.createdAt || "");
          if (!notifiedMessagesRef.current.has(messageId)) {
            notifiedMessagesRef.current.add(messageId);

            const isVeryRecent = msgTime > Date.now() - 5 * 60 * 1000;
            if (!isInitialLoad || isVeryRecent) {
              // Trigger bell chime for customer on new agent message
              try {
                playBellChime();
              } catch (bellErr) {
                console.log("Failed to play bell chime:", bellErr);
              }

              // Automatically open chat box for customer
              setActiveChatPopups((prev) => {
                if (prev.includes(activeInqId)) return prev;
                return [...prev, activeInqId];
              });
            }
          }
        }
        isInitialLoad = false;
      },
      (error) => {
        console.warn("Customer live inquiry subscription failed:", error);
      },
    );

    return () => unsubscribe();
  }, [isReferred]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const scrollToBooking = () => {
    // Fast track goes straight to custom route selection & add-ons pricing (Step 4 / landingStep 3)
    setLandingStep(3);
    setBookingFormSubStep(2); // Start on 1.route selection (formStep === 2)
    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  };

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode"); // 'guest' | 'registered' | 'agent'
  const isBookingFlow = params.get("workspace") === "customer" && mode;

  if (isBookingFlow) {
    return (
      <CharterBookingWizard mode={mode as "guest" | "registered" | "agent"} />
    );
  }

  if (workspaceMode === "customer") {
    return <CustomerWorkspace />;
  }

  const [dispatchedEmailLog, setDispatchedEmailLog] = useState<any | null>(
    null,
  );

  useEffect(() => {
    const handleEmailTriggered = (e: CustomEvent) => {
      console.log("React captured global email dispatch event:", e.detail);
      setDispatchedEmailLog(e.detail);
    };
    window.addEventListener(
      "email-triggered",
      handleEmailTriggered as EventListener,
    );
    return () => {
      window.removeEventListener(
        "email-triggered",
        handleEmailTriggered as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleRouteSelected = (e: CustomEvent) => {
      // If the event is from the sequence builder / drag-and-drop sync or requested no navigation, do not force-change the view step
      if (e && e.detail && (e.detail.noNavigate || e.detail.destinationIds)) {
        return;
      }
      setLandingStep((prev) => {
        if (prev === 1) {
          return 3; // Go to Step 4: Complete Booking
        }
        return prev;
      });
      setTimeout(() => {
        wizardContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    };
    window.addEventListener(
      "add-destination-to-route",
      handleRouteSelected as EventListener,
    );
    return () => {
      window.removeEventListener(
        "add-destination-to-route",
        handleRouteSelected as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;
      let list: string[] = [];
      if (Array.isArray(detail)) {
        list = detail;
      } else if (detail.destinationIds && Array.isArray(detail.destinationIds)) {
        list = detail.destinationIds;
      } else if (detail.destinationId) {
        list = [detail.destinationId];
      } else if (typeof detail === "object" && Array.isArray(detail.destinations)) {
        list = detail.destinations;
      }
      const cleanList = list.filter(id => id && id !== "custom-route" && id !== "the-best" && id !== "namaste" && id !== "the-one");
      setSelectedDestinationsCount(cleanList.length);
    };

    window.addEventListener("add-destination-to-route", handleSync as EventListener);
    window.addEventListener("booking-destinations-changed", handleSync as EventListener);
    
    return () => {
      window.removeEventListener("add-destination-to-route", handleSync as EventListener);
      window.removeEventListener("booking-destinations-changed", handleSync as EventListener);
    };
  }, []);

  const handleBookingSuccess = (details: {
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
  }) => {
    if (details.actionType === "web") {
      // Dispatch immediately to Live Chat and do not show SuccessModal
      const event = new CustomEvent("dispatch_booking_to_chat", {
        detail: details,
      });
      window.dispatchEvent(event);
      return;
    }

    setDispatchedEmailLog(null);
    setBookingDetails(details);
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans selection:bg-[#0F172A]/10 selection:text-[#0F172A]">
      {/* Editorial Header - Now placed at the absolute top of the page */}
      <header
        id="app-header"
        className={`sticky top-0 z-40 w-full border-b border-[#0F172A]/15 bg-[#FAF9F6]/90 backdrop-blur-md transition-all duration-300 overflow-hidden ${isScrolled || landingStep > 0 ? "h-0 py-0 border-transparent opacity-0 pointer-events-none" : "min-h-20 py-3 opacity-100"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {currentAgent ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 shadow-sm border border-slate-300 overflow-hidden">
                  {currentAgent?.logoUrl ? (
                    <img
                      src={currentAgent.logoUrl}
                      alt={currentAgent.companyName || currentAgent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-base md:text-xl font-serif font-bold tracking-tight text-[#0F172A] uppercase leading-none">
                    {currentAgent.companyName || currentAgent.name}
                  </h1>
                  <span className="text-[10px] md:text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-cyan-600 mt-1 block">
                    {currentAgent.companyName
                      ? `Broker Representative: ${currentAgent.name}`
                      : "Yacht Broker Representative"}
                  </span>
                  {currentAgent.companyAddress && (
                    <span className="text-[9px] md:text-[10px] font-sans text-slate-500 tracking-tight mt-1 max-w-[250px] md:max-w-md block leading-normal border-t border-slate-200/50 pt-1">
                      📍 {currentAgent.companyAddress}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <img
                  src="/assets/images/phuket_amazing_logo_1780303817020.png"
                  alt="Phuket Amazing Yacht Charter Logo"
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 object-contain"
                />
                <div>
                  <h1 className="text-base md:text-lg font-serif font-bold tracking-tight text-[#0F172A] uppercase leading-none">
                    {t("header.title")}{" "}
                    <span className="italic font-light font-serif text-[#0F172A]/90">
                      {t("header.subtitle")}
                    </span>
                  </h1>
                  <span className="text-[8px] md:text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#0F172A]/50 mt-1 block">
                    {t("header.tagline")}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#0F172A] p-2"
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1.5 md:max-w-md w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full justify-end">
              <ShareAppButton variant="navbar" className="flex" />

              <div className="flex items-center gap-1 bg-[#0F172A]/5 border border-[#0F172A]/10 p-0.5 rounded-xs">
                {[
                  { code: "en", label: "🇬🇧 EN", title: "English" },
                  { code: "ru", label: "🇷🇺 RU", title: "Русский" },
                  { code: "hi", label: "🇮🇳 HI", title: "Hindi (India)" },
                  { code: "zh", label: "🇨🇳 ZH", title: "Chinese" },
                  { code: "th", label: "🇹🇭 TH", title: "Thai" },
                  { code: "fr", label: "🇫🇷 FR", title: "Français" },
                  { code: "de", label: "🇩🇪 DE", title: "Deutsch" },
                ].map((langItem) => (
                  <button
                    key={langItem.code}
                    type="button"
                    id={`header-lang-${langItem.code}`}
                    title={langItem.title}
                    onClick={() => setLanguage(langItem.code as any)}
                    className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold font-sans rounded-xs transition-all cursor-pointer ${
                      language === langItem.code
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/50"
                    }`}
                  >
                    {langItem.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500/90 text-right leading-tight max-w-[340px]">
              {t("page.translation.instruction")}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#FAF9F6] border-t border-[#0F172A]/10 px-4 py-4"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full justify-center">
                  <ShareAppButton variant="navbar" className="flex" />
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-[#0F172A]/5 border border-[#0F172A]/10 p-0.5 rounded-xs">
                  {[
                    { code: "en", label: "🇬🇧 EN", title: "English" },
                    { code: "ru", label: "🇷🇺 RU", title: "Русский" },
                    { code: "hi", label: "🇮🇳 HI", title: "Hindi (India)" },
                    { code: "zh", label: "🇨🇳 ZH", title: "Chinese" },
                    { code: "th", label: "🇹🇭 TH", title: "Thai" },
                    { code: "fr", label: "🇫🇷 FR", title: "Français" },
                    { code: "de", label: "🇩🇪 DE", title: "Deutsch" },
                  ].map((langItem) => (
                    <button
                      key={langItem.code}
                      type="button"
                      onClick={() => {
                        setLanguage(langItem.code as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-3 py-1.5 text-[11px] font-bold font-sans rounded-xs transition-all cursor-pointer ${
                        language === langItem.code
                          ? "bg-[#0F172A] text-white shadow-xs"
                          : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/50"
                      }`}
                    >
                      {langItem.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Unified Fast Booking & Gateway Hub - Now placed where the brand header used to be */}
      <FastBookingSystem
        currentAgent={currentAgent}
        currentCustomer={currentCustomer}
        customerData={customerData}
        isReferred={isReferred}
        hasActiveChat={activeChatPopups.length > 0}
        hasSelectedVessel={landingStep > 0}
        onOpenAgentPortal={() => setIsAgentPortalOpen(true)}
        onOpenCustomerPortal={(tab = "login") => {
          setCustomerPortalInitialTab(tab);
          setIsCustomerPortalOpen(true);
        }}
        onOpenCaptainPortal={() => setIsCaptainPortalOpen(true)}
        onLogoutAgent={logout}
        onLogoutCustomer={() => {
          signOut(auth)
            .then(() => {
              alert("Logged out successfully");
            })
            .catch((e) => console.error("Customer signout failed", e));
        }}
        getContactPhone={getContactPhone}
        unreadInquiriesCount={unreadInquiries.length}
        onSelectUnreadChat={() => {
          setPortalInquiryTab("inquiries");
          if (unreadInquiries.length > 0) {
            setPortalActiveInquiryId(unreadInquiries[0].id);
          }
          setIsAgentPortalOpen(true);
        }}
      />

      {/* Editorial Hero Layout with bold borders & gorgeous heading */}
      {landingStep === 0 && (
        <section className="relative overflow-hidden border-b border-[#0F172A]/10 bg-white py-20 lg:py-24">
          {/* Subtle geometric line accents echoing architectural prints */}
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-[#0F172A]/5 hidden lg:block" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-[#0F172A]/5 hidden lg:block" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading & Description */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xs text-[#0F172A] text-[10px] font-bold uppercase tracking-[0.25em]">
                  <Waves className="h-3.5 w-3.5" />
                  {t("hero.badge")}
                </div>

                <h2 className="text-4xl sm:text-6xl font-serif font-light tracking-tight text-[#0F172A] leading-none">
                  {t("hero.heading1")} <br />
                  <span className="italic font-normal text-[#0F172A]">
                    {t("hero.heading2")}
                  </span>
                </h2>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl font-sans">
                  {t("hero.description")}
                </p>
              </div>

              {/* Right Column: Call to Action buttons */}
              <div className="lg:col-span-5 flex flex-col sm:grid sm:grid-cols-2 gap-3 pt-4 lg:pt-0">
                <button
                  id="hero-btn-explore"
                  onClick={() => {
                    setWizardFlowMode("full");
                    goToLandingStep(0);
                  }}
                  type="button"
                  className="px-6 py-4 bg-[#0F172A] text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors cursor-pointer text-center sm:col-span-2 shadow-xs flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4" /> Book with Interactive Map
                </button>
                <button
                  id="hero-btn-plan"
                  onClick={() => {
                    setWizardFlowMode("fast");
                    window.dispatchEvent(
                      new CustomEvent("configure-booking-trip", {
                        detail: { duration: "fullday", package: "none" },
                      }),
                    );
                    goToLandingStep(0);
                  }}
                  type="button"
                  className="px-4 py-3 border border-[#0F172A] text-[#0F172A] font-sans font-bold text-[10.5px] uppercase tracking-[0.15em] bg-transparent hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Plan Custom Day Trip <Compass className="h-4.5 w-4.5" />
                </button>
                <button
                  id="hero-btn-plan-party"
                  onClick={() => {
                    setWizardFlowMode("fast");
                    window.dispatchEvent(
                      new CustomEvent("configure-booking-trip", {
                        detail: { duration: "fullday", package: "birthday" },
                      }),
                    );
                    goToLandingStep(0);
                  }}
                  type="button"
                  className="px-4 py-3 border border-[#0F172A] text-[#0F172A] font-sans font-bold text-[10.5px] uppercase tracking-[0.15em] bg-transparent hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Plan Party Trip{" "}
                  <Sparkles className="h-4.5 w-4.5 text-amber-500 fill-amber-300" />
                </button>
                <button
                  id="hero-btn-plan-overnight"
                  onClick={() => {
                    let ans = true;
                    try {
                      ans = window.confirm(
                        "Use interactive map to plan? (Click 'OK' for Interactive Map, or 'Cancel' for direct custom selection)",
                      );
                    } catch (e) {
                      ans = true;
                    }
                    setWizardFlowMode(ans ? "full" : "fast");
                    window.dispatchEvent(
                      new CustomEvent("configure-booking-trip", {
                        detail: { duration: "overnight" },
                      }),
                    );
                    goToLandingStep(0);
                  }}
                  type="button"
                  className="px-4 py-3 border border-[#0F172A] text-[#0F172A] font-sans font-bold text-[10.5px] uppercase tracking-[0.15em] bg-transparent hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 sm:col-span-2"
                >
                  Plan Overnight Trip{" "}
                  <Moon className="h-4.5 w-4.5 text-indigo-500 fill-indigo-200" />
                </button>
              </div>
            </div>

            {/* Clean Metric Stats Bar conforming with modern print magazines */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mt-16 pt-8 border-t border-[#0F172A]/15 text-left text-slate-500">
              <div>
                <p className="text-3xl font-serif italic text-[#0F172A] leading-none">
                  03
                </p>
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#0F172A]/60 mt-2">
                  {t("stats.catamarans")}
                </p>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-[#0F172A] leading-none">
                  03
                </p>
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#0F172A]/60 mt-2">
                  {t("stats.ports")}
                </p>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-[#0F172A] leading-none">
                  10
                </p>
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#0F172A]/60 mt-2">
                  {t("stats.destinations")}
                </p>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-[#0F172A] leading-none">
                  100%
                </p>
                <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#0F172A]/60 mt-2">
                  {t("stats.itineraries")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Container */}
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-8"
      >
        {/* Dynamic Horizontal Wizard Progress Navigation */}
        <div
          ref={wizardContainerRef}
          className="scroll-mt-28 border border-[#0F172A]/10 bg-white p-4 sm:p-5 rounded-xs shadow-xs"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-[9px] font-sans font-black uppercase tracking-[0.25em] text-[#0F172A]/50">
                Premium Catamaran Charter Itinerary Planner
              </span>
              <h3 className="text-lg font-serif font-semibold text-[#0F172A] mt-0.5">
                {landingStep === 0 && "Step 01: Browse Our Luxury Fleet"}
                {landingStep === 1 && "Step 02: Phuket Destination Guide"}
                {landingStep === 2 && "Step 03: Explore Andaman Routes"}
                {landingStep === 3 && "Step 04: Build Reservation Quote"}
              </h3>
            </div>

            {/* Nav Badges */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {[
                { index: 0, label: "1. Select Vessel", icon: Ship },
                { index: 1, label: "2. Destination Guide", icon: Compass },
                { index: 2, label: "3. Interactive Map", icon: MapPin },
                { index: 3, label: "4. Complete Booking", icon: Calendar },
              ].map((stepObj) => {
                const isActive = landingStep === stepObj.index;
                const isCompleted = landingStep > stepObj.index;
                const StepIcon = stepObj.icon;
                return (
                  <button
                    key={stepObj.index}
                    type="button"
                    onClick={() => goToLandingStep(stepObj.index)}
                    className={`px-3 py-2 text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider rounded-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                        : isCompleted
                          ? "bg-slate-900/5 text-emerald-800 border-emerald-300/40"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <StepIcon
                      className={`h-3.5 w-3.5 ${isActive ? "text-amber-300" : "opacity-75"}`}
                    />
                    <span>{stepObj.label}</span>
                    {isCompleted && (
                      <span className="text-emerald-600 ml-1 font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait text-left">
          {landingStep === 0 && (
            <motion.div
              key="step-fleet"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Section 1: Fleet Overview */}
              <section id="fleet-section" className="space-y-10 scroll-mt-20">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <span className="text-[10px] font-sans font-bold text-[#0F172A] uppercase tracking-[0.3em] flex items-center justify-center gap-1">
                    <Award className="h-4 w-4 text-[#0F172A]/70" />{" "}
                    {t("fleet.badge")}
                  </span>
                  <h3 className="text-4xl font-serif font-light text-[#0F172A] tracking-wide">
                    {t("fleet.heading")}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-lg mx-auto">
                    {t("fleet.description")}
                  </p>
                  <div className="pt-2">
                    <button
                      id="btn-open-comparison"
                      type="button"
                      onClick={() => setIsComparisonOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xs bg-[#0F172A] hover:bg-slate-800 text-white text-[10.5px] font-sans font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                    >
                      <Shuffle className="h-3.5 w-3.5" /> Compare Specifications
                      Side-by-Side
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {CATAMARANS.map((vessel) => (
                    <VesselCard
                      key={vessel.id}
                      vessel={vessel}
                      isSelected={selectedVesselId === vessel.id}
                      onSelect={() => setSelectedVesselId(vessel.id)}
                      onBookNow={() => {
                        setSelectedVesselId(vessel.id);
                        scrollToBooking();
                      }}
                      showCalendar={!!currentAgent && !isReferred}
                    />
                  ))}
                </div>
              </section>

              {/* Cinematic Tours & Drone Aerial Showcases Section */}
              <section className="my-16 border border-slate-200/60 rounded-sm bg-[#faf9f6] p-6 sm:p-10 shadow-3xs">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200/80 gap-4">
                  <div>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-emerald-800">
                      🎬 Cinematic Yacht Experiences
                    </span>
                    <h3 className="text-2xl font-serif italic text-slate-900 mt-1 font-normal">
                      Video Walkthroughs & Island Diaries
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm font-sans leading-relaxed font-normal">
                    Take an immersive look at our luxury fleet and the breathtaking tropical destinations awaiting you in southern Thailand.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Card 1 */}
                  <div 
                    onClick={() => {
                      // 🎥 UPDATE FIRST CLIP LINK HERE:
                      // Supports Google Drive, TikTok, Instagram, Facebook, and YouTube links!
                      setFrontPageVideoUrl("https://www.youtube.com/watch?v=scg136qDclY");
                      setFrontPageVideoTitle("Phuket Luxury Yacht & Catamaran Experience");
                    }}
                    className="group cursor-pointer rounded-xs overflow-hidden border border-slate-200 bg-white shadow-3xs transition-all duration-300 hover:shadow-md hover:border-slate-400"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-900">
                      <img 
                        src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
                        alt="Cinematic Phuket Catamaran Walkthrough"
                        className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Play Button Icon wrapper */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300 border border-white/20">
                          <Play className="h-6 w-6 fill-white text-white translate-x-0.5" />
                        </div>
                      </div>

                      <span className="absolute bottom-4 left-4 rounded-xs bg-[#FAF9F6]/90 border border-[#0F172A]/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-[#0F172A] font-sans">
                        Drone Aerial walkthrough
                      </span>
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif italic text-lg text-slate-900 font-normal">
                        Phuket Luxury Catamaran Flight & Sea Tour
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 font-sans leading-relaxed">
                        Exquisite aerial drone vistas of our spacious sailing catamarans cruising the Andaman Sea. Feel the sea breeze and observe our onboard sun loungers, nets, and premium decks.
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 group-hover:text-rose-700 tracking-wider">
                        <span>Click to play tour inside app</span>
                        <span className="text-xs">→</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div 
                    onClick={() => {
                      // 🎥 PHI PHI VIDEO LINK (Updated): 
                      setFrontPageVideoUrl("https://youtu.be/Va90C0J5Oxc?si=dSBZC1T8CyxECfRm");
                      setFrontPageVideoTitle("Phi Phi & Phang Nga Bay Sailing Diaries");
                    }}
                    className="group cursor-pointer rounded-xs overflow-hidden border border-slate-200 bg-white shadow-3xs transition-all duration-300 hover:shadow-md hover:border-slate-400"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-900">
                      <img 
                        src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
                        alt="Andaman Sea Islands Exploration"
                        className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Play Button Icon wrapper */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl group-hover:bg-rose-500 group-hover:scale-110 transition-all duration-300 border border-white/20">
                          <Play className="h-6 w-6 fill-white text-white translate-x-0.5" />
                        </div>
                      </div>

                      <span className="absolute bottom-4 left-4 rounded-xs bg-[#FAF9F6]/90 border border-[#0F172A]/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-[#0F172A] font-sans">
                        Tropical Sailing Diaries
                      </span>
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif italic text-lg text-slate-900 font-normal">
                        Andaman Horizon: Phi Phi & Phang Nga Bay
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 font-sans leading-relaxed">
                        Watch an absolute paradise unfold through deep lagoons, vertical limestone cliffs, and remote white sand keys. Perfect previews to map out your private custom charter route with our master captains.
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 group-hover:text-rose-700 tracking-wider">
                        <span>Click to play tour inside app</span>
                        <span className="text-xs">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Next Navigation Bar */}
              <div className="pt-8 border-t border-slate-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                      Select Your Preferred Planning Flow:
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
                      Would you like to customize your private itinerary with our regional guide, chart routes interactively, or fast-track straight to final pricing?
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => goToLandingStep(1)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer text-center"
                    >
                      🗺️ Destination Guide (Step 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => goToLandingStep(2)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer text-center"
                    >
                      🧭 Interactive Map (Step 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => goToLandingStep(3)}
                      className="px-5 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      ⚡ Fast-Track Booking <ChevronRight className="h-3.5 w-3.5 text-amber-300" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {landingStep === 1 && (
            <motion.div
              key="step-guide"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Section 2: Detailed Island Guide */}
              <section
                id="map-guide-section"
                className="bg-white border border-[#0F172A]/10 rounded-xs p-6 lg:p-10 shadow-sm scroll-mt-20"
              >
                <ItineraryHelper
                  selectedVesselId={selectedVesselId}
                  onSelectVessel={(vesselId) => {
                    setSelectedVesselId(vesselId);
                  }}
                  mode="guide"
                  onSelectDestination={(destId) => {
                    // Lock in this destination route!
                    window.dispatchEvent(
                      new CustomEvent("add-destination-to-route", {
                        detail: { destinationIds: [destId] },
                      }),
                    );
                    // Go straight to Complete Booking (landingStep 3)
                    goToLandingStep(3);
                  }}
                />
              </section>

              {/* Next/Prev Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => goToLandingStep(0)}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Fleet
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => goToLandingStep(2)}
                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                  >
                    <Compass className="h-4 w-4 text-emerald-600" /> Explore Interactive Maps
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      goToLandingStep(3);
                      setBookingFormSubStep(2);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-sans font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" /> Fast Track Booking <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {landingStep === 2 && (
            <motion.div
              key="step-map"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Section 2: Interactive Map */}
              <section
                id="map-chart-section"
                className="scroll-mt-20 px-6 lg:px-10"
              >
                <div className="max-w-7xl mx-auto">
                  <ExcursionMap informationalOnly={true} />
                </div>
              </section>

              {/* Section 2B: Route Hopping Sequence Planner */}
              <section
                id="map-planner-section"
                className="bg-white border border-[#0F172A]/10 rounded-xs p-6 lg:p-10 shadow-sm scroll-mt-20"
              >
                <ItineraryHelper
                  selectedVesselId={selectedVesselId}
                  onSelectVessel={(vesselId) => {
                    setSelectedVesselId(vesselId);
                  }}
                  mode="sequence"
                  onCompleteBooking={(duration) => {
                    goToLandingStep(3);
                  }}
                />
              </section>

              {/* Next/Prev Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => goToLandingStep(1)}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Destination Guide
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {selectedDestinationsCount === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        goToLandingStep(3);
                        setBookingFormSubStep(2);
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-sans font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" /> Fast Track Booking <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        goToLandingStep(3);
                        setBookingFormSubStep(3);
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-sans font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 text-amber-300" /> Continue Configure Bookings <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {landingStep === 3 && (
            <motion.div
              key="step-booking"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="space-y-12"
            >
              {/* Section 3: Booking Form & Advisor Options */}
              <section
                id="booking-sheet"
                ref={bookingFormRef}
                className="scroll-mt-24"
              >
                <BookingForm
                  initialVesselId={selectedVesselId}
                  onVesselChange={(id) => setSelectedVesselId(id)}
                  onSubmitSuccess={handleBookingSuccess}
                  initialFormStep={bookingFormSubStep}
                />
              </section>

              {/* Section 5: FAQ */}
              <section
                id="faq-section"
                className="scroll-mt-24 space-y-6 print:hidden"
              >
                <h2 className="text-xl font-serif font-bold text-center text-[#0F172A] tracking-wide uppercase">
                  Frequently Asked Questions
                </h2>
                <FAQSection />
              </section>

              {/* Prev Navigation Bar */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => goToLandingStep(0)}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Fleet (Step 1)
                </button>
                <button
                  type="button"
                  onClick={() => goToLandingStep(1)}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Itinerary Guide (Step 2)
                </button>
                <button
                  type="button"
                  onClick={() => goToLandingStep(2)}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer rounded-xs transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Interactive Map (Step 3)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success Booking Confirmation Modal */}
      {showSuccessModal && bookingDetails && (
        <div
          id="booking-success-overlay"
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6 md:py-10 outline-none"
          onClick={() => setShowSuccessModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-[#0F172A]/10 rounded-xs shadow-2xl overflow-hidden text-[#0F172A] relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Luxury Brand Banner */}
            <div className="bg-[#0F172A] text-white p-6 relative overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer z-10"
                title="Close modal"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Compass className="h-32 w-32 rotate-12 animate-pulse" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-emerald-400 font-extrabold">
                Inquiry Confirmed
              </p>
              <h4 className="text-xl font-serif italic mt-1 font-normal tracking-wide">
                {bookingDetails.actionType === "whatsapp"
                  ? "WhatsApp Inquiry Launched"
                  : bookingDetails.actionType === "line"
                    ? "LINE Inquiry Launched"
                    : bookingDetails.actionType === "wechat"
                      ? "WeChat Inquiry Launched"
                      : bookingDetails.actionType === "viber"
                        ? "Viber Inquiry Launched"
                        : bookingDetails.actionType === "email"
                          ? "Email Inquiry Launched"
                          : bookingDetails.actionType === "web"
                            ? "Booking Request Sent"
                            : "Private Agency Call Routed"}
              </h4>
            </div>

            {/* Vessel Image & Spec Summary */}
            <div className="p-6 space-y-5">
              {bookingDetails.vesselImage && (
                <div className="relative h-40 w-full overflow-hidden rounded-xs bg-slate-100 border border-slate-200">
                  <img
                    src={bookingDetails.vesselImage}
                    alt={bookingDetails.vesselName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0F172A] text-white text-[10px] font-sans font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-3xs shadow-md">
                    {bookingDetails.vesselName}
                  </div>
                </div>
              )}

              {/* Booking Specifications */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-[#0F172A]/5 pb-1">
                  Charter Selection
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                      Vessel Model
                    </span>
                    <strong className="text-[#0F172A] font-semibold">
                      {bookingDetails.vesselModel || "Premium Catamaran"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                      Scheduled Date
                    </span>
                    <strong className="text-[#0F172A] font-semibold">
                      {bookingDetails.charterDate
                        ? new Date(
                            bookingDetails.charterDate,
                          ).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "To be finalized"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                      Passengers
                    </span>
                    <strong className="text-[#0F172A] font-semibold">
                      {bookingDetails.guestCount}{" "}
                      {bookingDetails.guestCount === 1
                        ? "Passenger"
                        : "Passengers"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                      Routed Channel
                    </span>
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-xs text-[9px] font-extrabold uppercase tracking-wider border border-emerald-600/10 print:hidden">
                      {isReferred
                        ? "🟢 Live Inquiry Chat"
                        : bookingDetails.actionType === "whatsapp"
                          ? "🟢 WhatsApp Chat"
                          : bookingDetails.actionType === "line"
                            ? "🟢 LINE App"
                            : bookingDetails.actionType === "wechat"
                              ? "🟢 WeChat App"
                              : bookingDetails.actionType === "viber"
                                ? "🟢 Viber App"
                                : bookingDetails.actionType === "email"
                                  ? "✉️ Email App"
                                  : "📞 Voice routing"}
                    </span>
                    <span className="hidden print:inline-block font-semibold">
                      Processed Online
                    </span>
                  </div>
                  {bookingDetails.excursionRoute && (
                    <div className="col-span-2 mt-2 border-t border-[#0F172A]/5 pt-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Excursion Route
                      </span>
                      <strong className="text-[#0F172A] font-semibold text-[11px] block mt-0.5 leading-snug">
                        {bookingDetails.excursionRoute}
                      </strong>
                    </div>
                  )}
                  {bookingDetails.charterDuration && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Charter Duration
                      </span>
                      <strong className="text-[#0F172A] font-semibold capitalize text-[11px]">
                        {bookingDetails.charterDuration}
                      </strong>
                    </div>
                  )}
                  {bookingDetails.totalPrice !== undefined && !isReferred && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Estimated Total
                      </span>
                      <strong className="text-[#0F172A] font-semibold text-[11px]">
                        ฿{bookingDetails.totalPrice.toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {isReferred && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Estimated Total
                      </span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider text-amber-800 bg-amber-50 rounded-xs border border-amber-200/40 animate-pulse">
                        Pending Broker Proposal
                      </span>
                    </div>
                  )}
                  {bookingDetails.optInReminder && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                        Automated Reminder
                      </span>
                      <strong className="text-emerald-600 font-semibold text-[11px]">
                        48-Hour Opt-in ✓
                      </strong>
                    </div>
                  )}
                </div>

                {bookingDetails.amenities &&
                  bookingDetails.amenities.length > 0 && (
                    <div className="mt-4 border-t border-[#0F172A]/5 pt-3">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-2">
                        Selected Options & Upgrades
                      </span>
                      <ul className="grid grid-cols-1 gap-1">
                        {bookingDetails.amenities.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-[10px] text-slate-800 flex items-start gap-1.5"
                          >
                            <span className="text-emerald-500 shrink-0 mt-0.5 leading-none">
                              •
                            </span>
                            <span className="leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              {/* Post-Boarding QR Code Verification Module */}
              <div className="bg-[#FAF9F6] border border-[#0F172A]/15 p-5 rounded-xs space-y-4 text-center">
                <div className="flex items-center justify-between border-b border-[#0F172A]/10 pb-2">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-[#0F172A] flex items-center gap-1.5 font-sans">
                    <Compass
                      className="h-4 w-4 text-cyan-600 animate-spin"
                      style={{ animationDuration: "60s" }}
                    />
                    Post-Boarding Gate QR
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded-sm">
                    Vessel Access Pass
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-500 leading-relaxed text-left font-sans">
                  Upon reaching Phuket Marina, present this dynamic QR check-in
                  pass to the crew for boarding validation and manifest
                  authorization.
                </p>

                <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200/60 rounded-sm shadow-xs max-w-[200px] mx-auto relative group">
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-blue-50/10 pointer-events-none" />
                  <QRCodeSVG
                    value={`${getPublicUrl()}?verifyBoardingId=${getSuccessBookingId()}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                    className="relative z-10 p-1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-100/80 px-2 py-1 rounded inline-block">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                    <span>LEDGER ID:</span>
                    <span className="text-slate-700 font-bold">
                      {getSuccessBookingId()}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const verifyUrl = `${getPublicUrl()}?verifyBoardingId=${getSuccessBookingId()}`;
                        navigator.clipboard.writeText(verifyUrl);
                        alert(
                          "Boarding validation link copied! Paste in a new tab to simulate passenger boarding.",
                        );
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Link
                    </button>

                    <button
                      onClick={() => {
                        setVerifyBookingId(getSuccessBookingId());
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Launch Gate
                    </button>
                  </div>
                </div>
              </div>

              {/* Automated Confirmation Email Status Logger Module */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xs font-mono text-[10.5px] space-y-2 border border-slate-800 shadow-inner text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 capitalize text-[9px] font-bold tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Automated Confirmation Service
                  </span>
                  <span className="text-[9.5px] text-emerald-400 font-bold uppercase tracking-widest font-sans">
                    {dispatchedEmailLog
                      ? dispatchedEmailLog.directSent
                        ? "Dispatched"
                        : "Trigger Saved"
                      : "Compiling..."}
                  </span>
                </div>
                {dispatchedEmailLog ? (
                  <div className="space-y-1">
                    <div>
                      <span className="text-[#34D399]">
                        ✓ Firebase Document:
                      </span>{" "}
                      Saved to <span className="text-yellow-400">/mail</span>{" "}
                      database collection
                    </div>
                    <div>
                      <span className="text-[#34D399]">✓ Document UID:</span>{" "}
                      {dispatchedEmailLog.docId}
                    </div>
                    <div>
                      <span className="text-[#34D399]">✓ Recipient:</span>{" "}
                      {dispatchedEmailLog.customerEmail}
                    </div>

                    {bookingDetails.optInReminder && (
                      <div className="text-pink-300">
                        <span className="text-pink-400">
                          ✓ Reminder Service:
                        </span>{" "}
                        48-Hour reminder notification scheduled.
                      </div>
                    )}

                    {dispatchedEmailLog.resendConfigured ? (
                      dispatchedEmailLog.directSent ? (
                        <div className="text-emerald-400">
                          ✓ SMTP API Relay: Successfully dispatched directly via
                          gateway.
                        </div>
                      ) : (
                        <div className="text-red-400">
                          ✗ Relay Failed:{" "}
                          {dispatchedEmailLog.error?.substring(0, 60)}
                        </div>
                      )
                    ) : (
                      <div className="text-slate-400 italic text-[9.5px] leading-relaxed">
                        Direct SMTP/API delivery is simulated. On production,
                        standard Firebase Trigger Email extension processes
                        /mail to send emails automatically.
                      </div>
                    )}
                    <div className="mt-1.5 border-t border-slate-800 pt-1.5 text-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          alert(
                            "A summary email notification containing the generated Phuket yacht charter quotation PDF, travel manifest, and safety guidelines has been sent to: " +
                              dispatchedEmailLog.customerEmail +
                              ".",
                          );
                        }}
                        className="text-[9.5px] font-sans font-bold tracking-wider underline text-[#34D399] hover:text-[#059669] cursor-pointer"
                      >
                        [View Email Payload Log]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center py-2 text-slate-400 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin inline-block" />
                    Compiling Yacht Charter PDF quotation and dispatching email
                    summary...
                  </div>
                )}
              </div>

              {/* Next Steps Prompt */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xs flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-xs font-bold shrink-0">
                  ✓
                </span>
                <div>
                  <h6 className="text-[10px] font-extrabold text-[#0F172A] font-sans uppercase tracking-wider">
                    Agent Checklist Action
                  </h6>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed mt-1 font-sans">
                    {isReferred
                      ? `Your customized catamaran specification has been routed to your Representative, ${currentAgent?.name || "our representative"}. We will check real-time yacht availability, assemble the best direct rate proposal, and send a proposal back to you right here in our live session. Once received, you may accept or decline the price proposal with a single click.`
                      : bookingDetails.actionType === "whatsapp" ||
                          bookingDetails.actionType === "line" ||
                          bookingDetails.actionType === "wechat" ||
                          bookingDetails.actionType === "viber" ||
                          bookingDetails.actionType === "email"
                        ? "A PDF booking request has been downloaded directly to your device! Due to social app restrictions, you MUST manually attach this PDF to our chat. A draft message has been pasted for you."
                        : "Your customized catamaran blueprint coordinates have been routed to our direct reservations desk. An active broker representative has been assigned to help arrange payment options and itinerary details."}
                  </p>
                </div>
              </div>

              {/* Close controls */}
              <div className="pt-1 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => {
                    if (bookingDetails.pdfBase64) {
                      try {
                        const base64Str = bookingDetails.pdfBase64;
                        const cleanBase64 = base64Str.includes("base64,")
                          ? base64Str.split("base64,")[1]
                          : base64Str;

                        // Ultra fast, 100% stable Safari/Chrome compatible synchronous base64 -> Blob URL conversion
                        const binaryString = window.atob(cleanBase64.trim());
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], {
                          type: "application/pdf",
                        });
                        const url = URL.createObjectURL(blob);

                        setPdfPreviewUrl(url);
                        setShowPdfPreviewModal(true);
                      } catch (err) {
                        console.error("Failed to build blob url:", err);
                        // Fallback to data URI directly if atob fails
                        setPdfPreviewUrl(
                          bookingDetails.pdfBase64.startsWith("data:")
                            ? bookingDetails.pdfBase64
                            : `data:application/pdf;base64,${bookingDetails.pdfBase64}`,
                        );
                        setShowPdfPreviewModal(true);
                      }
                    } else {
                      alert("PDF not available yet.");
                    }
                  }}
                  className="px-5 py-2.5 bg-white border border-emerald-600/50 hover:bg-emerald-50 text-emerald-700 rounded-xs text-xs font-sans font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Preview PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] rounded-xs text-xs font-sans font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Save PDF / Print
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-xs font-sans font-bold uppercase tracking-widest transition-colors shadow-xs hover:shadow-md cursor-pointer"
                >
                  Confirm & Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Boarding Gate Validator Screen */}
      {verifyBookingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-slate-900 border border-slate-800 text-slate-100 max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative z-10 space-y-6"
          >
            {/* Header */}
            <div className="text-center border-b border-slate-800 pb-5 space-y-2">
              <div className="flex justify-center gap-2 items-center">
                <Compass className="h-6 w-6 text-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono tracking-[0.25em] font-bold text-slate-400 uppercase">
                  Phuket Marine Port Authority
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-sans font-light tracking-tight text-white uppercase">
                Digital Boarding Gate Validator
              </h2>
              <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                Secure digital manifest passenger check-in against synchronized
                Firestore decentralized database.
              </p>
            </div>

            {/* Main Content Area */}
            {gateLoader ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                <p className="text-sm text-slate-400 font-mono tracking-wider">
                  Accessing secured manifest database ledger...
                </p>
              </div>
            ) : gateError ? (
              <div className="border border-red-900/40 bg-red-950/20 rounded-xs p-6 flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 animate-bounce" />
                <div className="space-y-1.5">
                  <h4 className="text-sm font-sans font-bold text-red-400 uppercase tracking-wide">
                    Manifest Ref Mismatch
                  </h4>
                  <p className="text-xs text-slate-400 font-mono max-w-sm">
                    {gateError}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  REF ID: {verifyBookingId}
                </div>
              </div>
            ) : gateBooking ? (
              <div className="space-y-6">
                {/* Status Card Alert */}
                {gateBooking.boardingStatus === "Boarded" ? (
                  <div className="border border-emerald-500/30 bg-emerald-950/10 rounded-sm p-4 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-pulse">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-extrabold text-emerald-400 uppercase tracking-widest text-[11px]">
                        BOARDING APPROVED & LOGGED
                      </h4>
                      <p className="text-xs text-slate-300 font-sans">
                        Passenger is boarded and cleared of manifest validation
                        check. Vessel access granted.
                      </p>
                      {gateBooking.boardedAt && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Checked-In At:{" "}
                          {new Date(gateBooking.boardedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-amber-500/30 bg-amber-950/10 rounded-sm p-4 flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-extrabold text-amber-500 uppercase tracking-widest text-[11px]">
                        PENDING PASSENGER BOARDING
                      </h4>
                      <p className="text-xs text-slate-300 font-sans">
                        Manifest record authenticated. Captain or crew must
                        verify credentials and click below to confirm boarding.
                      </p>
                    </div>
                  </div>
                )}

                {/* Booking Spec Grid */}
                <div className="space-y-4 text-left">
                  <div className="bg-slate-950 border border-slate-800 rounded-sm p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Manifest Ledger Verification Data
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-[#FAF9F6]/10 text-white px-2 py-0.5 rounded-sm">
                        {verifyBookingId.slice(0, 15).toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">
                          Lead Passenger
                        </span>
                        <span className="text-sm font-bold text-white block">
                          {gateBooking.clientName || "Authenticated Guest"}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {gateBooking.customerEmail || "No Email"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">
                          Charter Date
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-sm font-bold text-white block">
                            {gateBooking.charterDate || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">
                          Vessel Details
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Ship className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-sm font-bold text-white block">
                            {CATAMARANS.find(
                              (v) => v.id === gateBooking.vesselId1,
                            )?.name ||
                              gateBooking.vesselId1 ||
                              "Premium Yacht"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">
                          Boarding Party
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-sm font-bold text-white block">
                            {gateBooking.guestCount || "N/A"} Guests
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Records - Responsive Two Column Card Layout */}
                  {gateBooking.passengers &&
                    gateBooking.passengers.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-slate-500 flex items-center gap-2">
                          <Users className="h-3 w-3" /> Individual Passenger
                          Manifest Records
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {gateBooking.passengers.map(
                            (pax: any, idx: number) => (
                              <div
                                key={pax.id || idx}
                                className="bg-slate-900/50 border border-slate-800 p-2.5 sm:p-3 rounded-xs space-y-2 relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 p-1">
                                  <span className="text-[8px] font-mono text-slate-700 font-bold">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <div className="pr-4">
                                  <span className="text-[8px] text-slate-500 uppercase font-mono tracking-tight block truncate">
                                    Full Legal Name
                                  </span>
                                  <span className="text-[11px] font-bold text-white block truncate uppercase">
                                    {pax.name}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 border-t border-slate-800 pt-1.5">
                                  <div>
                                    <span className="text-[7px] text-slate-500 uppercase font-mono block">
                                      Nationality
                                    </span>
                                    <span className="text-[9px] text-slate-300 block truncate">
                                      {pax.nationality || "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[7px] text-slate-500 uppercase font-mono block">
                                      Age
                                    </span>
                                    <span className="text-[9px] text-slate-300 block">
                                      {pax.age} Y
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-slate-950/50 p-1.5 rounded-xs mt-1 border border-slate-800/50">
                                  <span className="text-[7px] text-slate-500 uppercase font-mono block">
                                    Passport / ID
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                                    {pax.passport || "PENDING"}
                                  </span>
                                  {pax.passportExpiry && (
                                    <span className="text-[7px] text-slate-600 block mt-0.5">
                                      EXP: {pax.passportExpiry}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {gateBooking.hotelPickupLocation && (
                    <div className="bg-slate-900/30 border border-slate-800 p-3 rounded-xs flex items-center gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-full">
                        <MapPin className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-mono">
                          Final Shore-to-Dock Transfer Location
                        </span>
                        <span className="text-xs text-slate-300 font-bold block">
                          {gateBooking.hotelPickupLocation}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Authorize Action Button */}
                {gateBooking.boardingStatus !== "Boarded" && (
                  <button
                    onClick={handleAuthorizeBoarding}
                    className="w-full py-4 text-center bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-slate-950 font-sans font-bold text-xs uppercase tracking-widest transition-colors shadow-lg cursor-pointer rounded-sm flex items-center justify-center gap-2 print:hidden"
                  >
                    <Check className="h-4 w-4" /> Approve Passenger & Board
                    Vessel
                  </button>
                )}

                {/* Export & Print Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={exportManifestToCSV}
                    className="py-3 border border-slate-700 hover:bg-slate-800 text-cyan-400 font-sans font-bold text-[10px] uppercase tracking-widest transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer print:hidden"
                  >
                    <FileDown className="h-4 w-4" /> Export CSV Manifest
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-sans font-bold text-[10px] uppercase tracking-widest transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer print:hidden"
                  >
                    <Printer className="h-4 w-4" /> Print Boarding Pass
                  </button>
                </div>

                {/* Vessel Captain Official PDF Manifest */}
                <button
                  type="button"
                  onClick={downloadCaptainManifest}
                  className="w-full py-3 border border-emerald-500/40 hover:bg-emerald-950/20 active:bg-emerald-900/30 text-emerald-400 font-sans font-extrabold text-[10px] uppercase tracking-[0.15em] transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer print:hidden"
                >
                  <FileText className="h-4 w-4" /> Download Captain's Manifest
                  PDF
                </button>
              </div>
            ) : null}

            {/* Footer Exit actions */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-500 font-mono text-[10px] print:hidden">
              <span>Phuket Harbor Marine Blockchain Ledger</span>
              <button
                onClick={() => {
                  setVerifyBookingId(null);
                  window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                  );
                }}
                className="px-4 py-2 bg-slate-800 active:bg-slate-700 text-slate-200 hover:text-white rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Exit Gate Validator
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scroll To Top Utility */}
      <ScrollToTop />

      {/* Editorial Footer */}
      <footer
        id="app-footer"
        className="border-t border-[#0F172A]/10 bg-white py-16 mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col items-center justify-center gap-2">
            {currentAgent ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 shadow-sm border border-slate-300 overflow-hidden mb-2">
                  {currentAgent?.logoUrl ? (
                    <img
                      src={currentAgent.logoUrl}
                      alt={currentAgent.companyName || currentAgent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-slate-500" />
                  )}
                </div>
                <span className="text-xs uppercase tracking-widest font-sans font-extrabold text-[#0F172A]">
                  {currentAgent.companyName || currentAgent.name}
                </span>
                {currentAgent.companyAddress && (
                  <span className="text-[10px] tracking-wide font-sans text-slate-500 block max-w-sm mx-auto leading-relaxed">
                    📍 {currentAgent.companyAddress}
                  </span>
                )}
              </>
            ) : (
              <>
                <img
                  src="/assets/images/phuket_amazing_logo_1780303817020.png"
                  alt="Phuket Amazing Yacht Charter Logo"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 object-contain"
                />
                <span className="text-xs uppercase tracking-widest font-sans font-extrabold text-[#0F172A]">
                  PHUKET AMAZING YACHT CHARTER
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto font-sans">
            © {new Date().getFullYear()}{" "}
            {currentAgent?.companyName ||
              currentAgent?.name ||
              "Phuket Private Yacht Excursions"}
            . {currentAgent ? "" : "Launch hubs: Chalong Pier & Ao Po Pier."}
          </p>

          <div className="flex flex-col items-center gap-3 pt-4 border-t border-[#0F172A]/5 max-w-md mx-auto">
            <div className="flex justify-center gap-4 text-[10px] uppercase tracking-wider font-bold font-sans text-[#0F172A]/50 pt-1">
              <button
                id="footer-privacy-btn"
                onClick={() => {
                  const btn = document.getElementById(
                    "trigger-privacy-widget-btn",
                  );
                  if (btn) (btn as HTMLButtonElement).click();
                }}
                className="hover:text-[#0F172A] cursor-pointer"
              >
                {t("privacy.btn")}
              </button>
              <span>•</span>
              <button
                id="footer-disclosure-btn"
                onClick={() => {
                  const btn = document.getElementById(
                    "trigger-privacy-widget-btn",
                  );
                  if (btn) (btn as HTMLButtonElement).click();
                }}
                className="hover:text-[#0F172A] cursor-pointer"
              >
                {t("privacy.pdpa")}
              </button>
            </div>
          </div>
          <div className="mt-8 text-[10px] text-slate-500 font-sans border-t border-[#0F172A]/5 pt-6 flex flex-col items-center max-w-sm mx-auto space-y-2">
            <p className="leading-relaxed">
              This page is property of{" "}
              <a
                href="mailto:Vinko.Mitar@gmail.com"
                className="font-bold text-slate-800 hover:text-emerald-700 hover:underline"
              >
                Vinko Mitar
              </a>{" "}
              and page is under construction. For any question contact owner.
            </p>
            <p className="opacity-70 flex items-center justify-center gap-1.5 pt-2 text-[9px] uppercase tracking-widest font-bold">
              Created in GOOGLE AI STUDIO with GEMINI AI team
            </p>
          </div>
        </div>
      </footer>

      {/* Maintenance Mode Overlay */}
      {isMaintenanceMode && !isAdmin && (
        <div className="fixed inset-0 z-[45] bg-[#0F172A] flex flex-col items-center justify-center text-white p-6">
          <Ship className="w-20 h-20 text-emerald-500 mb-6 mx-auto opacity-80" />
          <h2 className="text-3xl font-serif font-bold text-center mb-4 tracking-tight">
            System Under Maintenance
          </h2>
          <p className="text-center text-slate-400 max-w-md font-sans text-sm md:text-base leading-relaxed mb-10">
            We are currently performing scheduled maintenance and repairs.
            Please check back soon.
          </p>
          <button
            type="button"
            className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer text-white hover:text-emerald-500 rounded-full"
            onClick={() => setIsAgentPortalOpen(true)}
            title="Agent Access"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Interactive Privacy & Consent Center */}
      <PrivacyBanner />

      {/* Admin Portal (Vinko) */}
      <AdminPortal />

      {/* Side-by-Side Vessel Comparison Modal */}
      <VesselComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onSelectVessel={(vesselId) => {
          setSelectedVesselId(vesselId);
          scrollToBooking();
        }}
        initialSelectedId1={compareV1}
        initialSelectedId2="namaste"
        initialClientName={compareClientName}
        replyToChatId={compareReplyToChatId}
      />

      {/* Representative Portal Access Modal Dialogue */}
      <AgentPortalModal
        isOpen={isAgentPortalOpen}
        onClose={() => {
          setIsAgentPortalOpen(false);
          setPortalInquiryTab("quotes");
          setPortalActiveInquiryId(null);
          setPortalEditingProposalId(null);
        }}
        initialInquiryTab={portalInquiryTab}
        initialActiveInquiryChatId={portalActiveInquiryId}
        initialEditingProposalId={portalEditingProposalId}
        onRequestComparisonModal={() => setIsComparisonOpen(true)}
      />

      {/* Dynamic Visual Notification Toast Banner for incoming chats */}
      {activeToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-sm bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-4 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-emerald-500/20 p-2 rounded-full">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                Message from {activeToast.clientName}
              </p>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {activeToast.message}
              </p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="flex-shrink-0 text-slate-400 hover:text-white"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {frontPageVideoUrl && (
        <VesselVideoModal
          isOpen={!!frontPageVideoUrl}
          onClose={() => {
            setFrontPageVideoUrl(null);
            setFrontPageVideoTitle("");
          }}
          videoUrl={frontPageVideoUrl}
          vesselName={frontPageVideoTitle}
        />
      )}

      <CustomerPortalModal
        isOpen={isCustomerPortalOpen}
        onClose={() => setIsCustomerPortalOpen(false)}
        initialTab={customerPortalInitialTab}
      />

      <CaptainWorkspaceModal
        isOpen={isCaptainPortalOpen}
        onClose={() => setIsCaptainPortalOpen(false)}
      />

      {vesselPortalActiveId && (
        <VesselOperationsPortal
          vesselId={vesselPortalActiveId}
          onClose={() => setVesselPortalActiveId(null)}
        />
      )}

      {/* Catamaran Charter AI - PDF Itinerary Chatbot */}
      <PDFChatModal
        isOpen={isPdfChatOpen}
        onClose={() => setIsPdfChatOpen(false)}
      />

      {/* PDF Inline Preview Modal */}
      {showPdfPreviewModal && pdfPreviewUrl && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl h-[90vh] sm:h-[85vh] rounded-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div className="text-left">
                  <h3 className="font-sans font-bold text-xs tracking-wider uppercase text-emerald-100">
                    Yacht Charter Quotation Preview
                  </h3>
                  <p className="text-[9px] text-slate-400 font-sans tracking-widest mt-0.5 uppercase">
                    Authentic Presentation Document Manifest
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={pdfPreviewUrl}
                  download={`phuket_yacht_charter_quotation_${(bookingDetails?.vesselName || "quote").toLowerCase().replace(/\s+/g, "_")}.pdf`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold text-[9px] uppercase tracking-widest rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-emerald-950/30"
                >
                  Download PDF
                </a>
                <button
                  onClick={handleClosePdfPreview}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Info Notice */}
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 text-left">
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-sans">
                💡{" "}
                <strong className="text-slate-700">
                  Mobile Device Notice:
                </strong>{" "}
                If your web browser or in-app browser does not display the PDF
                preview below, please tap the green{" "}
                <strong className="text-emerald-700 font-semibold">
                  Download PDF
                </strong>{" "}
                button above to save or view it directly on your device.
              </p>
            </div>

            {/* Modal Body (Iframe) */}
            <div className="flex-1 bg-slate-100 p-2 sm:p-4 relative flex items-center justify-center">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded-xs border border-slate-300 shadow-sm bg-white"
                title="Yacht Charter PDF Brochure Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Active Agent Chat Popups - Allow both agent and customer to interact */}
      {activeChatPopups.length > 0 && (
        <div className="fixed bottom-0 right-0 sm:right-16 left-0 sm:left-auto z-[6000] flex flex-row-reverse pointer-events-none w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row-reverse items-end p-2 sm:p-4 gap-2 sm:gap-4 pointer-events-auto w-full sm:w-auto">
            {activeChatPopups.map((inqId, idx) => (
              <AgentChatPopup
                key={inqId}
                inquiryId={inqId}
                currentAgent={
                  (currentAgent || {
                    name: "Agent Representative",
                    email: "info@phuketyacht.com",
                  }) as Agent
                }
                offsetIndex={idx}
                onClose={() => {
                  setActiveChatPopups((prev) =>
                    prev.filter((id) => id !== inqId),
                  );
                }}
                onResetInquiryId={(oldId, newId) => {
                  setActiveChatPopups((prev) =>
                    prev.map((id) => (id === oldId ? newId : id)),
                  );
                }}
                onCreateQuote={(chatId, clientName) => {
                  setCompareReplyToChatId(chatId);
                  setCompareClientName(clientName);
                  setIsComparisonOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Agent Status Debug */}
      {/* 
      {currentAgent && (
        <div className="fixed top-4 right-4 z-[9999] bg-white p-2 border border-black text-[10px]">
          Agent: {currentAgent.email} / Unreads: {unreadInquiries.length}
        </div>
      )}
      */}

      {/* Customer Representative Chat Bubble */}
      {!isAgentPortalOpen &&
        (() => {
          let activeInqId = localStorage.getItem(
            "phuket_charter_active_chat_id",
          );
          return (
            <>
              {!isAgentOnline && isOfflineChatHovered && (
                <div
                  className="fixed bottom-[8.5rem] right-4 sm:bottom-36 sm:right-6 z-[5001] max-w-[240px] bg-slate-900 text-white text-[11px] font-sans px-3.5 py-2.5 rounded-sm shadow-xl text-left leading-relaxed border border-slate-700 pointer-events-none select-none transition-all duration-200 animate-fade-in"
                  style={{ animationDuration: "0.15s" }}
                >
                  <div className="relative">
                    Agent is currently away—your message will be saved for
                    review
                    <span className="absolute top-full right-[24px] w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 transform -translate-y-1" />
                  </div>
                </div>
              )}
              <button
                type="button"
                id="btn-customer-chat-toggle"
                onClick={async () => {
                  const activeBrokerId =
                    currentAgent?.id ||
                    currentAgent?.uid ||
                    (currentAgent?.email
                      ? currentAgent.email
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_")
                      : "unassigned");
                  const activeBrokerEmail = currentAgent
                    ? currentAgent.email.toLowerCase().trim()
                    : "booking@charter-partner.com";

                  if (activeInqId) {
                    try {
                      const snap = await getDoc(
                        doc(db, "inquiries", activeInqId),
                      );
                      if (snap.exists()) {
                        const data = snap.data();

                        // Auto update the pairing lock if they scanned a new QR referrer!
                        if (
                          data.brokerId !== activeBrokerId ||
                          data.brokerEmail !== activeBrokerEmail
                        ) {
                          await updateDoc(doc(db, "inquiries", activeInqId), {
                            brokerId: activeBrokerId,
                            brokerEmail: activeBrokerEmail,
                          });
                        }

                        setActiveChatPopups((prev) => {
                          if (prev.includes(activeInqId!)) return prev;
                          return [...prev, activeInqId!];
                        });
                        return;
                      }
                    } catch (e) {
                      console.warn(
                        "Could not verify active inquiry status, doing fresh fallback:",
                        e,
                      );
                    }
                  }

                  // If deleted, stale or not found, clear storage and dispatch fresh initialization under this agent!
                  localStorage.removeItem("phuket_charter_active_chat_id");

                  localStorage.setItem(
                    "phuket_copied_inquiry_draft",
                    `Hello ${currentAgent?.name || "Agent"}, I'm browsing the site and have a question.`,
                  );
                  window.dispatchEvent(
                    new CustomEvent("trigger-agent-chat-popup", {
                      detail: "new-chat-session",
                    }),
                  );
                }}
                onMouseEnter={() => setIsOfflineChatHovered(true)}
                onMouseLeave={() => setIsOfflineChatHovered(false)}
                className="fixed bottom-[4.5rem] right-4 sm:bottom-20 sm:right-6 z-[5000] h-14 w-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-all border-[3px] border-white cursor-pointer active:scale-95 animate-bounce"
                style={{ animationDuration: "3s" }}
                title="Chat with Agent"
              >
                <MessageSquare className="h-6 w-6" />
              </button>
            </>
          );
        })()}

      {/* Agent Inbox Bubble */}
      {currentAgent &&
        !isReferred &&
        !isAgentPortalOpen &&
        (() => {
          const unreadsCount = unreadInquiries.length;
          // console.log("DEBUG rendering AgentInboxButton:", { currentAgent: !!currentAgent, isReferred, unreadsCount });
          return (
            <button
              type="button"
              id="btn-agent-inbox-toggle"
              onClick={() => setIsAgentPortalOpen(true)}
              className="fixed bottom-[4.5rem] right-[5.5rem] sm:bottom-20 sm:right-24 z-[5000] h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 transition-all border-[3px] border-slate-700 cursor-pointer active:scale-95"
              title="Open Agent Inbox"
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6" />
                {unreadsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {unreadsCount}
                  </span>
                )}
              </div>
            </button>
          );
        })()}

      {/* Fast Booking System Modal for Custom Agent Session */}
      <AnimatePresence>
        {isFastBookingModalOpen && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[5000] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-[#030d12] rounded-lg border border-slate-800 shadow-2xl overflow-hidden my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0a151d]">
                <div className="flex items-center gap-2 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FAF9F6] font-sans">
                      ⚡ Fast Booking Desk
                    </h3>
                    <p className="text-[9px] text-[#00a2b8] font-bold uppercase tracking-wider mt-0.5">
                      Streamlined direct-to-broker consultation desk
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFastBookingModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 bg-[#030d12] max-h-[80vh] overflow-y-auto scrollbar-thin">
                <CharterBookingWizard
                  mode="guest"
                  onBookingSubmit={() => setIsFastBookingModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Digital Business Card Overlay */}
      {showDigitalBusinessCard && currentAgent && (
        <DigitalBusinessCard
          agent={currentAgent}
          onClose={() => setShowDigitalBusinessCard(false)}
          onMessageClick={() => {
            localStorage.setItem(
              "phuket_copied_inquiry_draft",
              `Hello ${currentAgent?.name || "Agent"}, I scanned your QR code and would like to chat about catamaran charters.`,
            );
            setActiveChatPopups((prev) => {
              if (prev.includes("new-chat-session")) return prev;
              return ["new-chat-session", ...prev];
            });
            setShowDigitalBusinessCard(false);
          }}
        />
      )}
    </div>
  );
}
