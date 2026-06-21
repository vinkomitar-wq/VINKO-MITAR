import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { getPublicUrl } from "../utils/url";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import {
  X,
  Minus,
  Square,
  Send,
  Anchor,
  Phone,
  Mail,
  Maximize2,
  Minimize2,
  Zap,
  Download,
  Paperclip,
  Settings,
  FileText,
  Camera,
  Mic,
  Video,
  Info,
  Users,
  Bell,
  Volume2,
} from "lucide-react";
import { Agent, useAgent } from "../AgentContext";

const INITIAL_QUICK_REPLIES = [
  "Hello! Thank you for reaching out. How can I assist you today?",
  "I am currently checking vessel availability for your requested date. I will have an update for you shortly.",
  "I have attached a customized charter proposal for your review. Please let me know if you have any questions.",
  "Our standard luxury package includes a professional crew, fuel, water toys, and complimentary refreshments.",
  "To secure your booking and lock in this rate, would you like me to send over the deposit payment details?",
  "Perfect, I have noted your special requests and will ensure the crew is informed prior to your embarkation.",
  "Please keep in mind that our itineraries are fully customizable. Would you like to adjust any of the destinations?",
  "Thank you for confirming! I will finalize the paperwork and send you the official booking confirmation.",
];

interface AgentChatPopupProps {
  key?: string;
  inquiryId: string;
  onClose: () => void;
  currentAgent: Agent;
  offsetIndex: number;
  onCreateQuote?: (chatId: string, clientName: string) => void;
  onResetInquiryId?: (oldId: string, newId: string) => void;
}

export default function AgentChatPopup({
  inquiryId,
  onClose,
  currentAgent,
  offsetIndex,
  onCreateQuote,
  onResetInquiryId,
}: AgentChatPopupProps) {
  const { currentAgent: contextAgent, isReferred } = useAgent();
  const isUserClient = !contextAgent || isReferred;
  const [inquiry, setInquiry] = useState<any | null>(null);

  // Registration form states for new customer chat session
  const [registerName, setRegisterName] = useState(() => {
    return localStorage.getItem("phuket_copied_customer_name") || "";
  });
  const [registerPhone, setRegisterPhone] = useState(() => {
    return localStorage.getItem("phuket_copied_customer_contact") || "";
  });
  const [registerTerms, setRegisterTerms] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeVideoRoom, setActiveVideoRoom] = useState<string | null>(null);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplies, setQuickReplies] = useState(INITIAL_QUICK_REPLIES);
  const [newQuickReply, setNewQuickReply] = useState("");

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cancelRecordingRef = useRef(false);

  // Translation settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>(
    {},
  );
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Passenger Manifest states
  const [showManifestPanel, setShowManifestPanel] = useState(false);
  const [manifestLead, setManifestLead] = useState({
    name: "",
    phone: "",
    country: "Thailand",
    passportNumber: "",
    passportExpiry: "",
  });
  const [manifestCompanions, setManifestCompanions] = useState<any[]>([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;

  // Push Notifications and Audio Alerts States
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_audio_alerts");
      return saved !== null ? saved === "true" : true;
    } catch (_) {
      return true;
    }
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_push_notifications");
      if (saved !== null) {
        return (
          saved === "true" &&
          "Notification" in window &&
          Notification.permission === "granted"
        );
      }
    } catch (_) {}
    return false;
  });

  const playIncomingChime = () => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(392.0, now); // G4
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5 (chime effect)
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.6);
    } catch (error) {
      console.error("Web Audio chime play failed:", error);
    }
  };

  const handleToggleAudio = (enabled: boolean) => {
    setAudioAlertsEnabled(enabled);
    try {
      localStorage.setItem("chat_audio_alerts", String(enabled));
    } catch (_) {}
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          setNotificationsEnabled(true);
          try {
            localStorage.setItem("chat_push_notifications", "true");
          } catch (_) {}
        } else if (Notification.permission === "denied") {
          alert(
            "Notification permission was previously denied. Please enable notifications for this page in your browser settings to continue.",
          );
          setNotificationsEnabled(false);
        } else {
          try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              setNotificationsEnabled(true);
              localStorage.setItem("chat_push_notifications", "true");
              new Notification("Notifications Enabled", {
                body: "You will receive system-level push notifications for new incoming messages.",
                tag: "chat-alerts",
              });
            } else {
              alert(
                "Notification permission was denied. Please allow notifications in your browser settings.",
              );
              setNotificationsEnabled(false);
              localStorage.setItem("chat_push_notifications", "false");
            }
          } catch (err) {
            console.error("Error requesting notification permission:", err);
            alert("Could not request notification permissions.");
          }
        }
      } else {
        alert(
          "This browser does not support desktop/mobile web notifications.",
        );
        setNotificationsEnabled(false);
        try {
          localStorage.setItem("chat_push_notifications", "false");
        } catch (_) {}
      }
    } else {
      setNotificationsEnabled(false);
      try {
        localStorage.setItem("chat_push_notifications", "false");
      } catch (_) {}
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showScrollDown, setShowScrollDown] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 30;
      setShowScrollDown(!isNearBottom);
    }
  };

  const rawChatHistory =
    inquiry?.chatHistory ||
    (inquiry
      ? [
          {
            sender: "client",
            text: inquiry.message,
            createdAt: inquiry.createdAt,
          },
        ]
      : []);

  const chatHistory = rawChatHistory.map((item: any, idx: number) => {
    if (!item) {
      return {
        id: `msg_fallback_${idx}`,
        sender: "client",
        text: "Incomplete message transmission",
        createdAt: new Date().toISOString(),
      };
    }
    const key =
      item.id ||
      `msg_client_${item.createdAt ? String(item.createdAt).replace(/[^a-z0-9]/gi, "_") : idx}`;
    return {
      ...item,
      id: key,
    };
  });

  const prevMessagesCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // Monitor chatHistory for new messages & play audio/chime or send push notifications
  useEffect(() => {
    if (!inquiry || !chatHistory) return;

    if (isFirstLoadRef.current) {
      prevMessagesCountRef.current = chatHistory.length;
      isFirstLoadRef.current = false;
      return;
    }

    if (chatHistory.length > prevMessagesCountRef.current) {
      // New messages were added
      const latestMsg = chatHistory[chatHistory.length - 1];
      if (latestMsg) {
        // Did we (self) send it or is it from the other party?
        const isSelf = isUserClient
          ? latestMsg.sender === "client"
          : latestMsg.sender === "agent";

        if (!isSelf) {
          // Play clean audio alert
          if (audioAlertsEnabled) {
            playIncomingChime();
          }

          // Trigger push notifications
          if (notificationsEnabled) {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const bodyText = latestMsg.isImageAttached
                ? "📷 Sent a photo attachment"
                : latestMsg.isPdfAttached
                  ? `📄 Sent a PDF file: ${latestMsg.fileName || "document"}`
                  : latestMsg.isVoiceNote
                    ? "🎙️ Sent a voice note"
                    : latestMsg.text;

              const senderLabel = isUserClient
                ? latestMsg.agentName || "Phuket Yacht Broker"
                : inquiry.name || "Client Guest";

              const notification = new Notification(
                `Message from ${senderLabel}`,
                {
                  body: bodyText,
                  icon: "/icon.png",
                  tag: inquiryId,
                },
              );

              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
          }
        }
      }
    }
    prevMessagesCountRef.current = chatHistory.length;
  }, [
    chatHistory,
    inquiryId,
    isUserClient,
    audioAlertsEnabled,
    notificationsEnabled,
    inquiry,
  ]);

  // Auto-translation effect
  useEffect(() => {
    if (!autoTranslate || chatHistory.length === 0) return;

    chatHistory.forEach((msg: any) => {
      const isAgent = msg.sender === "agent";
      if (
        !isAgent &&
        msg.text &&
        !translations[msg.id] &&
        !translatingIds[msg.id] &&
        !msg.isBookingSummary &&
        !msg.isPdfAttached
      ) {
        setTranslatingIds((prev) => ({ ...prev, [msg.id]: true }));
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: msg.text,
            targetLanguage: preferredLanguage,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.translation) {
              setTranslations((prev) => ({
                ...prev,
                [msg.id]: data.translation,
              }));
            }
          })
          .catch((err) => console.error("Auto-translate error:", err))
          .finally(() => {
            setTranslatingIds((prev) => ({ ...prev, [msg.id]: false }));
          });
      }
    });
  }, [
    inquiry?.chatHistory,
    inquiry?.message,
    inquiry?.createdAt,
    autoTranslate,
    preferredLanguage,
    translations,
  ]);

  // Action submission handler for new customer chat session setup
  const handleStartGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!registerName.trim()) {
      setRegisterError("Please enter your name.");
      return;
    }

    if (registerPhone.trim().length < 5) {
      setRegisterError("Please enter a correct phone number or email address.");
      return;
    }

    if (!registerTerms) {
      setRegisterError("You must accept the terms & conditions.");
      return;
    }

    setIsSending(true);

    const newInqDocId = `inq_web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const brokerIdVal =
      currentAgent?.id ||
      (currentAgent?.email
        ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "unassigned");
    const brokerEmailVal = currentAgent?.email
      ? currentAgent.email.toLowerCase().trim()
      : "booking@charter-partner.com";

    const chatHistoryPayload = [
      {
        id: `msg_init_${Date.now()}`,
        sender: "client",
        text:
          localStorage.getItem("phuket_copied_inquiry_draft") ||
          `Dear ${currentAgent?.name || "Agent"}, I'm ready to chat. I have accepted the charter terms and safety rules on-screen.`,
        createdAt: new Date().toISOString(),
      },
    ];

    const payload = {
      id: newInqDocId,
      name: registerName,
      contact: registerPhone,
      message:
        localStorage.getItem("phuket_copied_inquiry_draft")?.slice(0, 100) +
          "..." || "Customer initiated secure chat session",
      folder: "Inbox",
      createdAt: new Date().toISOString(),
      isRead: false,
      source: "live_inquiry_widget",
      brokerId: brokerIdVal,
      brokerEmail: brokerEmailVal,
      chatHistory: chatHistoryPayload,
    };

    try {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "inquiries", newInqDocId), payload);

      const fallbackInquiriesStr =
        localStorage.getItem("phuket_charter_shared_local_inquiries") || "[]";
      let fallbackInquiries = [];
      try {
        fallbackInquiries = JSON.parse(fallbackInquiriesStr);
      } catch (_) {}
      fallbackInquiries.push(payload);
      localStorage.setItem(
        "phuket_charter_shared_local_inquiries",
        JSON.stringify(fallbackInquiries),
      );
      window.dispatchEvent(new Event("local-inquiries-updated"));

      localStorage.setItem("phuket_copied_customer_name", registerName);
      localStorage.setItem("phuket_copied_customer_contact", registerPhone);
      localStorage.setItem("phuket_charter_active_chat_id", newInqDocId);

      window.dispatchEvent(
        new CustomEvent("sync-guest-details", {
          detail: { name: registerName, phone: registerPhone },
        }),
      );

      if (onResetInquiryId) {
        onResetInquiryId("new-chat-session", newInqDocId);
      }
    } catch (err) {
      console.error("Failed to initialize secure chat:", err);
      setRegisterError("Failed to initialize connection. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Mark chat as read and load live inquiry details
  useEffect(() => {
    if (inquiryId === "new-chat-session") {
      setInquiry({
        id: "new-chat-session",
        name: `Chat with ${currentAgent?.name || "Charter Advisor"}`,
        contact: "Please introduce yourself first",
        vesselName: "",
        chatHistory: [],
      });
      return;
    }

    const docRef = doc(db, "inquiries", inquiryId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInquiry({ id: docSnap.id, ...data });

          // Auto mark as read if it is currently unread and not minimized
          // Also acquire session lock if not already set or owned by currentAgent
          const myAgentId =
            currentAgent?.id ||
            (currentAgent?.email
              ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
              : "unassigned");

          const updates: any = {};
          if (data && !data.isRead && !isMinimized && !isUserClient) {
            updates.isRead = true; // Wait no, actually if it's the client reading the message from agent, agent side should mark read? The schema uses a single isRead boolean for both? Usually isRead means "did the agent read the client's message". If the client is reading it, maybe we don't update this. Or maybe we do.
          }
          if (
            data &&
            !isUserClient &&
            (!data.activeBrokerId ||
              data.activeBrokerId === "none" ||
              data.activeBrokerId === "unassigned")
          ) {
            updates.activeBrokerId = myAgentId;
          }

          if (Object.keys(updates).length > 0) {
            updateDoc(docRef, updates).catch((err) => {
              console.error(
                "Auto mark read or session lock acquisition failed:",
                err,
              );
            });
          }
        } else {
          onClose(); // Auto close if deleted
        }
      },
      (error) => {
        console.error("Realtime fetch for agent popup failed:", error);
      },
    );

    return () => unsubscribe();
  }, [inquiryId, isMinimized, currentAgent]);

  // Scroll messages viewport to bottom
  useEffect(() => {
    if (!isMinimized && inquiry) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [inquiry?.chatHistory?.length, inquiry?.customerTyping, isMinimized]);

  // Sync manifest from Firestore chatHistory matching existing design
  useEffect(() => {
    if (showManifestPanel && inquiry && chatHistory) {
      const manifestMsg = chatHistory.find(
        (m: any) => m.isManifest && m.companions,
      );
      if (manifestMsg) {
        setManifestLead({
          name: manifestMsg.leadInfo?.name || inquiry.name || "",
          phone: manifestMsg.leadInfo?.phone || inquiry.contact || "",
          country: manifestMsg.leadInfo?.country || "Thailand",
          passportNumber: manifestMsg.leadInfo?.passportNumber || "",
          passportExpiry: manifestMsg.leadInfo?.passportExpiry || "",
        });
        setManifestCompanions(manifestMsg.companions || []);
      } else {
        // Prefill with inquiry default details
        setManifestLead({
          name: inquiry.name || "",
          phone: inquiry.contact || "",
          country: "Thailand",
          passportNumber: "",
          passportExpiry: "",
        });
        setManifestCompanions([]);
      }
    }
  }, [showManifestPanel, inquiryId, chatHistory, inquiry]);

  if (!inquiry) {
    return null;
  }

  const handleAcceptProposal = async (proposalPrice: string) => {
    const docRef = doc(db, "inquiries", inquiryId);
    const nowStr = new Date().toISOString();

    const newMsg = {
      id: `msg_accept_${Date.now()}`,
      sender: "client",
      text: `✅ I have accepted your custom proposal with Offer Rate: ${proposalPrice || "Custom Specific Quote"}! I am ready to confirm the itinerary details and lock in my reservation booking.`,
      createdAt: nowStr,
    };

    try {
      const freshDoc = await getDoc(docRef);
      const existingHistory = freshDoc.exists()
        ? freshDoc.data().chatHistory || []
        : [];

      await updateDoc(docRef, {
        proposalStatus: "accepted",
        chatHistory: [...existingHistory, newMsg],
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to accept proposal:", err);
    }
  };

  const handleDeclineProposal = async () => {
    const docRef = doc(db, "inquiries", inquiryId);
    const nowStr = new Date().toISOString();

    const newMsg = {
      id: `msg_decline_${Date.now()}`,
      sender: "client",
      text: `❌ I have declined this custom proposal. I would like to adjust our selection, explore other luxury vessels, or request a revised quote.`,
      createdAt: nowStr,
    };

    try {
      const freshDoc = await getDoc(docRef);
      const existingHistory = freshDoc.exists()
        ? freshDoc.data().chatHistory || []
        : [];

      await updateDoc(docRef, {
        proposalStatus: "declined",
        chatHistory: [...existingHistory, newMsg],
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to decline proposal:", err);
    }
  };

  const handleAddCompanion = () => {
    setManifestCompanions((prev) => [
      ...prev,
      {
        fullName: "",
        country: "Thailand",
        passportNumber: "",
        passportExpiry: "",
      },
    ]);
  };

  const handleUpdateCompanion = (
    index: number,
    field: string,
    value: string,
  ) => {
    setManifestCompanions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCompanion = (index: number) => {
    setManifestCompanions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveManifest = async () => {
    try {
      const docRef = doc(db, "inquiries", inquiryId);
      const freshDoc = await getDoc(docRef);
      if (!freshDoc.exists()) return;
      const inquiryData = freshDoc.data();
      const existingHistory = inquiryData.chatHistory || [];

      // Filter out any existing manifest messages to keep history clean
      const filteredHistory = existingHistory.filter((m: any) => !m.isManifest);

      const companionDetailsList = manifestCompanions
        .map(
          (c: any, i: number) =>
            `  • [Traveler ${i + 1}] ${(c.fullName || "").toUpperCase()} | Nationality: ${(c.country || "").toUpperCase()} | Passport: ${(c.passportNumber || "").toUpperCase()} | Exp: ${c.passportExpiry || "N/A"}`,
        )
        .join("\n");

      const msgText =
        `📋 [SYSTEM INTEGRATION] GUEST PASSENGER MANIFEST FOR MARITIME INSURANCE\n` +
        `==================================================\n` +
        `A complete passenger manifest has been digitally compiled and verified by the representative for Harbor Master clearance:\n\n` +
        `LEAD CHARTERER RECORD:\n` +
        `  • Full Name: ${(manifestLead.name || "N/A").toUpperCase()}\n` +
        `  • Phone Contact: ${manifestLead.phone || "N/A"}\n` +
        `  • Nationality/Country: ${(manifestLead.country || "N/A").toUpperCase()}\n` +
        `  • Passport/ID Number: ${(manifestLead.passportNumber || "N/A").toUpperCase()}\n` +
        `  • Expiry Date: ${manifestLead.passportExpiry || "N/A"}\n\n` +
        `ADDITIONAL TRAVEL COMPANIONS (${manifestCompanions.length}):\n` +
        (manifestCompanions.length > 0
          ? companionDetailsList
          : "  • Solo Voyager (No additional travelers listed).") +
        `\n` +
        `==================================================\n` +
        `💡 Live Agent Action: Click 'Download PDF' inside the customer's portal overview file to compile this manifest onto official Harbor Master forms.`;

      const newMsg = {
        id: `msg_manifest_${Date.now()}`,
        sender: "client", // set as client for visual styling parity matching user-submitted manifest blocks
        text: msgText,
        createdAt: new Date().toISOString(),
        isManifest: true,
        companions: manifestCompanions,
        leadInfo: {
          name: manifestLead.name,
          phone: manifestLead.phone,
          country: manifestLead.country,
          passportNumber: manifestLead.passportNumber,
          passportExpiry: manifestLead.passportExpiry,
        },
      };

      await updateDoc(docRef, {
        chatHistory: [...filteredHistory, newMsg],
        isRead: true,
      });

      alert("Passenger Manifest has been successfully synchronized and saved!");
      setShowManifestPanel(false);
    } catch (err: any) {
      console.error("Save manifest error:", err);
      alert("Error saving manifest: " + err.message);
    }
  };

  const handleCopyWhatsAppTemplate = () => {
    const customerName = inquiry?.name || "Valued Customer";
    const dateText = inquiry?.charterDate || "your scheduled charter date";
    const guestLimit = inquiry?.guestCount || "your group size";

    const text = `Hello ${customerName}! 🌴🐠 

To prepare the required port clearance and complimentary marine safety insurance forms for your upcoming yacht excursion on *${dateText}*, we need to register the official passenger roster with the Phuket Harbor Master.

Could you please send us the passenger details for your party (up to ${guestLimit} guests)?
For each person, we need:
1. Full Name (as shown in passport)
2. Nationality
3. Passport or National ID Number
4. Passport Expiration Date

Alternatively, you can securely fill these out directly on your mobile browser by clicking this link:
${getPublicUrl()}/?workspace=customer&customer-portal=true

Thank you, we look forward to welcoming you on board! ⛵☀️`;

    navigator.clipboard.writeText(text);
    alert("WhatsApp registration request template copied to clipboard!");
  };

  const startRecording = async () => {
    cancelRecordingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) =>
        audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        if (cancelRecordingRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;

          const nowStr = new Date().toISOString();
          const newMsg: any = {
            id: `msg_${Date.now()}`,
            sender: isUserClient ? "client" : "agent",
            text: `🎙️ Sent a voice note`,
            createdAt: nowStr,
            isVoiceNote: true,
            audioData: base64Audio,
          };
          if (!isUserClient) {
            newMsg.agentName = currentAgent?.name || "Support";
            newMsg.agentId =
              currentAgent?.id || currentAgent?.email || "unassigned";
          }

          const currentHistory = inquiry.chatHistory || [];
          const myAgentId =
            currentAgent?.id ||
            (currentAgent?.email
              ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
              : "unassigned");

          const updates: any = {
            chatHistory: [...currentHistory, newMsg],
            isRead: isUserClient ? false : true,
          };
          if (!isUserClient) {
            updates.activeBrokerId = myAgentId;
          }
          await updateDoc(doc(db, "inquiries", inquiryId), updates);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);

    const nowStr = new Date().toISOString();
    const newMsg: any = {
      id: `msg_${Date.now()}`,
      sender: isUserClient ? "client" : "agent",
      text: replyText.trim(),
      createdAt: nowStr,
    };
    if (!isUserClient) {
      newMsg.agentName = currentAgent?.name || "Support";
      newMsg.agentId = currentAgent?.id || currentAgent?.email || "unassigned";
    }

    const currentHistory = inquiry.chatHistory || [
      {
        id: `msg_init_${inquiry.createdAt}`,
        sender: "client",
        text: inquiry.message,
        createdAt: inquiry.createdAt,
      },
    ];

    try {
      const myAgentId =
        currentAgent?.id ||
        (currentAgent?.email
          ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
          : "unassigned");

      const docRef = doc(db, "inquiries", inquiryId);
      const updates: any = {
        chatHistory: [...currentHistory, newMsg],
        isRead: isUserClient ? false : true,
      };
      if (!isUserClient) {
        updates.activeBrokerId = myAgentId;
      }
      await updateDoc(docRef, updates);
      setReplyText("");
    } catch (error) {
      console.error("Agent failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuickReply = async (reply: string) => {
    if (isSending) return;
    setIsSending(true);

    const nowStr = new Date().toISOString();
    const newMsg: any = {
      id: `msg_${Date.now()}`,
      sender: isUserClient ? "client" : "agent",
      text: reply,
      createdAt: nowStr,
    };
    if (!isUserClient) {
      newMsg.agentName = currentAgent?.name || "Support";
      newMsg.agentId = currentAgent?.id || currentAgent?.email || "unassigned";
    }

    const currentHistory = inquiry.chatHistory || [
      {
        id: `msg_init_${inquiry.createdAt}`,
        sender: "client",
        text: inquiry.message,
        createdAt: inquiry.createdAt,
      },
    ];

    try {
      const myAgentId =
        currentAgent?.id ||
        (currentAgent?.email
          ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
          : "unassigned");

      const docRef = doc(db, "inquiries", inquiryId);
      const updates: any = {
        chatHistory: [...currentHistory, newMsg],
        isRead: isUserClient ? false : true,
      };
      if (!isUserClient) {
        updates.activeBrokerId = myAgentId;
      }
      await updateDoc(docRef, updates);
      setShowQuickReplies(false);
    } catch (error) {
      console.error("Agent failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inquiryId || !inquiry) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported.");
      return;
    }

    // limit to 700KB
    if (file.size > 700 * 1024) {
      alert("File is too large! Maximum allowed size is 700KB.");
      return;
    }

    setIsSending(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const newMsg: any = {
          id: `msg_${Date.now()}`,
          sender: isUserClient ? "client" : "agent",
          text: `📄 Sent a PDF Document: ${file.name}`,
          createdAt: new Date().toISOString(),
          isPdfAttached: true,
          fileName: file.name,
          pdfData: base64Data,
        };
        if (!isUserClient) {
          newMsg.agentName = currentAgent?.name || "Support";
          newMsg.agentId =
            currentAgent?.id || currentAgent?.email || "unassigned";
        }

        const currentHistory = inquiry.chatHistory || [
          {
            id: `msg_init_${inquiry.createdAt}`,
            sender: "client",
            text: inquiry.message,
            createdAt: inquiry.createdAt,
          },
        ];

        const myAgentId =
          currentAgent?.id ||
          (currentAgent?.email
            ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
            : "unassigned");

        const updates: any = {
          chatHistory: [...currentHistory, newMsg],
          isRead: isUserClient ? false : true,
        };
        if (!isUserClient) {
          updates.activeBrokerId = myAgentId;
        }
        await updateDoc(doc(db, "inquiries", inquiryId), updates);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload PDF:", err);
      alert("An error occurred uploading the PDF");
    } finally {
      setIsSending(false);
      e.target.value = "";
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleCameraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inquiryId || !inquiry) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are supported.");
      return;
    }

    setIsSending(true);

    try {
      const base64Data = await compressImage(file);

      const newMsg: any = {
        id: `msg_${Date.now()}`,
        sender: isUserClient ? "client" : "agent",
        text: `📷 Sent a photo`,
        createdAt: new Date().toISOString(),
        isImageAttached: true,
        imageData: base64Data,
      };
      if (!isUserClient) {
        newMsg.agentName = currentAgent?.name || "Support";
        newMsg.agentId =
          currentAgent?.id || currentAgent?.email || "unassigned";
      }

      const currentHistory = inquiry.chatHistory || [
        {
          id: `msg_init_${inquiry.createdAt}`,
          sender: "client",
          text: inquiry.message,
          createdAt: inquiry.createdAt,
        },
      ];

      const myAgentId =
        currentAgent?.id ||
        (currentAgent?.email
          ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
          : "unassigned");

      const updates: any = {
        chatHistory: [...currentHistory, newMsg],
        isRead: isUserClient ? false : true,
      };
      if (!isUserClient) {
        updates.activeBrokerId = myAgentId;
      }
      await updateDoc(doc(db, "inquiries", inquiryId), updates);
    } catch (err) {
      console.error("Failed to upload camera photo:", err);
      alert("An error occurred capturing or uploading the photo.");
    } finally {
      setIsSending(false);
      e.target.value = "";
    }
  };

  const handleSendVideoInvite = async () => {
    alert("Live video consultation is currently disabled.");
    return;
    /*
    if (!inquiryId || !inquiry || isSending) return;
    setIsSending(true);

    const nowStr = new Date().toISOString();
    const roomName = `PhuketYachtCharter-${inquiryId.substring(0, 8)}-${Date.now()}`;
    const videoLink = `https://meet.jit.si/${roomName}`;

    const newMsg: any = {
      id: `msg_${Date.now()}`,
      sender: isUserClient ? "client" : "agent",
      text: `🎥 Video Consultation link generated. Join using the card below.`,
      isVideoInvite: true,
      videoLink,
      createdAt: nowStr,
    };
    if (!isUserClient) {
      newMsg.agentName = currentAgent?.name || "Support";
      newMsg.agentId = currentAgent?.id || currentAgent?.email || "unassigned";
    }

    const currentHistory = inquiry.chatHistory || [
      {
        id: `msg_init_${inquiry.createdAt}`,
        sender: "client",
        text: inquiry.message,
        createdAt: inquiry.createdAt,
      }
    ];

    try {
      const myAgentId = currentAgent?.id || (currentAgent?.email ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_") : "unassigned");

      const updates: any = {
        chatHistory: [...currentHistory, newMsg],
        isRead: isUserClient ? false : true
      };
      if (!isUserClient) {
        updates.activeBrokerId = myAgentId;
      }
      await updateDoc(doc(db, "inquiries", inquiryId), updates);
      
      // Auto-join the video room for the agent
      setActiveVideoRoom(videoLink);
    } catch (err) {
      console.error("Failed to send video invitation link:", err);
      alert("Could not send video invitation.");
    } finally {
      setIsSending(false);
    }
    */
  };

  // chatHistory is already parsed and mapped above

  // Calculate responsive width and offset multiplier for desktop viewport queries
  const widthMultiplier =
    windowWidth >= 1024 ? 396 : windowWidth >= 768 ? 376 : 356;
  const offsetRight = 16 + offsetIndex * widthMultiplier;

  let targetWidthClass = "w-full sm:w-[340px] md:w-[360px] lg:w-[380px]";
  let targetHeight =
    windowWidth >= 1024
      ? "520px"
      : windowWidth >= 768
        ? "460px"
        : windowWidth >= 640
          ? "410px"
          : "62vh";

  if (activeVideoRoom && !isMinimized) {
    targetWidthClass =
      windowWidth >= 768
        ? isVideoExpanded
          ? "w-full md:w-[860px] lg:w-[960px]"
          : "w-full md:w-[720px] lg:w-[760px]"
        : "w-full";
    targetHeight = isVideoExpanded
      ? "90vh"
      : windowWidth >= 768
        ? "520px"
        : "85vh";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 150, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      style={
        isMobile
          ? { left: "12px", right: "12px", width: "auto" }
          : { right: `${offsetRight}px` }
      }
      className={`fixed bottom-0 z-[600] w-auto bg-[#FAF9F6] border border-slate-300 shadow-2xl rounded-t-lg overflow-hidden flex flex-col font-sans transition-all max-w-[calc(100vw-24px)] ${targetWidthClass}`}
    >
      {/* Header Area */}
      <div
        className="bg-[#0F172A] text-white p-3 flex items-center justify-between cursor-pointer select-none border-b border-white/5 shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
          <div className="min-w-0">
            <h5 className="text-[11.5px] font-bold tracking-wide truncate">
              {inquiryId === "new-chat-session"
                ? "Connect with Broker"
                : inquiry.name}
            </h5>
            <p className="text-[9px] text-slate-400 font-mono truncate select-all">
              {inquiryId === "new-chat-session"
                ? "Introduce yourself below"
                : inquiry.contact}
            </p>
          </div>
        </div>

        {/* Action Window Controls icon-group */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {inquiryId !== "new-chat-session" && (
            <>
              {onCreateQuote && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateQuote(inquiryId, inquiry.name);
                  }}
                  className="p-1 text-emerald-400 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                  title="Generate PDF Quotation"
                >
                  <FileText className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManifestPanel(!showManifestPanel);
                }}
                className={`p-1 rounded-xs transition-colors cursor-pointer ${showManifestPanel ? "text-sky-400 bg-white/20 shadow-xs" : "text-slate-400 hover:text-sky-400 hover:bg-white/10"}`}
                title="Passenger Manifest"
              >
                <Users className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const historyText = chatHistory
                    .map((m: any) => {
                      const time = m.createdAt
                        ? new Date(m.createdAt).toLocaleString()
                        : "";
                      const sender =
                        m.sender === "client"
                          ? inquiry.name || "Client"
                          : m.agentName || "Agent";
                      return `[${time}] ${sender}: ${m.text}`;
                    })
                    .join("\n\n");

                  const blob = new Blob([historyText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `chat_history_${inquiryId}_${new Date().toISOString().split("T")[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
                title="Download chat history"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className={`p-1 hover:text-white rounded-xs transition-colors cursor-pointer ${showSettings ? "text-white bg-white/20" : "text-slate-400 hover:bg-white/10"}`}
                title="Chat settings"
              >
                <Settings className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFeatureGuide(!showFeatureGuide);
                }}
                className={`p-1 hover:text-white rounded-xs transition-colors cursor-pointer ${showFeatureGuide ? "text-emerald-400 bg-white/20" : "text-slate-400 hover:bg-white/10"}`}
                title="Live Chat feature guide"
              >
                <Info className="h-3 w-3" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
            title={isMinimized ? "Expand popup" : "Minimize popup"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
            title="Dismiss popup chat"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div
        className={`flex flex-1 overflow-hidden transition-all duration-300 ${activeVideoRoom && !isMinimized ? "flex-col md:flex-row" : "flex-col"}`}
      >
        {/* activeVideoRoom display (kept mounted so calls don't drop on minimize) */}
        <div
          className={`relative bg-black shrink-0 flex flex-col transition-all duration-300 ${activeVideoRoom ? (!isMinimized ? (windowWidth >= 768 ? (isVideoExpanded ? "w-[65%]" : "w-[50%]") : isVideoExpanded ? "h-[50vh] min-h-[300px]" : "h-[30vh] min-h-[220px]") : "h-0 w-0 opacity-0 overflow-hidden") : "hidden"}`}
        >
          <div className="absolute top-0 w-full p-2 z-10 flex justify-end gap-1.5 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button
              type="button"
              onClick={() => setIsVideoExpanded(!isVideoExpanded)}
              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-xs text-white cursor-pointer pointer-events-auto shadow-xs backdrop-blur-md"
            >
              {isVideoExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveVideoRoom(null)}
              className="p-1.5 bg-red-600/90 hover:bg-red-700 rounded-xs text-white cursor-pointer pointer-events-auto shadow-xs backdrop-blur-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isMobile && activeVideoRoom && !isMinimized && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none flex justify-start">
              <a
                href={activeVideoRoom}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600/90 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[10px] flex items-center gap-1.5 shadow-lg pointer-events-auto font-bold uppercase tracking-wider backdrop-blur-md transition-colors"
              >
                <Video className="w-3 h-3" />
                Click to Open in Browser
              </a>
            </div>
          )}

          {activeVideoRoom && (
            <iframe
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              src={`${activeVideoRoom}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          )}

          {activeVideoRoom && !isMinimized && (
            <div className="absolute bottom-4 left-0 right-0 px-4 z-20 flex flex-col justify-end gap-2 pointer-events-none">
              {/* Last incoming/outgoing text message bubble overlay */}
              {(() => {
                const lastTextMsg = (inquiry?.chatHistory || [])
                  .filter(
                    (m: any) =>
                      m.text &&
                      !m.isSystem &&
                      !m.isManifest &&
                      !m.proposalStatus,
                  )
                  .pop();
                if (!lastTextMsg) return null;

                const isMine = isUserClient
                  ? lastTextMsg.sender === "client"
                  : lastTextMsg.sender !== "client";
                return (
                  <div
                    className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed shadow-lg backdrop-blur-md pointer-events-auto ${isMine ? "bg-emerald-600/90 text-white rounded-br-sm" : "bg-slate-900/80 text-white rounded-bl-sm border border-slate-700/50"}`}
                    >
                      <div className="text-[9px] opacity-70 mb-0.5 flex justify-between gap-3 font-semibold uppercase tracking-wider">
                        <span>
                          {isMine ? "You" : lastTextMsg.senderName || "Agent"}
                        </span>
                      </div>
                      <p>{lastTextMsg.text}</p>
                    </div>
                  </div>
                );
              })()}

              <form
                onSubmit={handleSend}
                className="flex gap-1.5 pointer-events-auto bg-slate-900/70 p-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-2xl w-full"
              >
                <input
                  disabled={isSending}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-800/80 rounded border border-slate-600/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 px-2.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden"
                  placeholder="Type message..."
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 flex items-center gap-1.5 justify-center rounded w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Embedded 2-way message list stream context */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: targetHeight }}
              exit={{ height: 0 }}
              className="flex flex-col flex-1 divide-y divide-slate-100 overflow-hidden max-h-[calc(100vh-140px)] min-w-0"
            >
              {showManifestPanel ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-800 text-[11px] font-sans">
                  {/* Header bar within manifest */}
                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      <Users className="h-3.5 w-3.5 text-sky-600 animate-pulse shrink-0" />
                      <span>Passenger Manifest Editor</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppTemplate}
                      className="py-1 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-sm font-semibold border border-sky-200 transition-all cursor-pointer text-[9px] uppercase tracking-wider scale-98 active:scale-95"
                      title="Copy WhatsApp request template to clipboard"
                    >
                      Copy Template
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {/* Lead passenger section */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 select-none border-b border-slate-200 pb-1">
                        Lead Passenger (Main Guest)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={manifestLead.name}
                            onChange={(e) =>
                              setManifestLead((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="e.g. John Doe"
                            className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-sm focus:outline-none focus:border-sky-600 text-[10.5px] font-medium"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Phone No.
                          </label>
                          <input
                            type="text"
                            value={manifestLead.phone}
                            onChange={(e) =>
                              setManifestLead((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="e.g. +66..."
                            className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-sm focus:outline-none focus:border-sky-600 text-[10.5px] font-medium"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1 flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Nationality
                          </label>
                          <input
                            type="text"
                            value={manifestLead.country}
                            onChange={(e) =>
                              setManifestLead((prev) => ({
                                ...prev,
                                country: e.target.value,
                              }))
                            }
                            placeholder="e.g. Thai"
                            className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-sm focus:outline-none focus:border-sky-600 text-[10.5px] font-medium"
                          />
                        </div>
                        <div className="col-span-1 flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Passport / ID
                          </label>
                          <input
                            type="text"
                            value={manifestLead.passportNumber}
                            onChange={(e) =>
                              setManifestLead((prev) => ({
                                ...prev,
                                passportNumber: e.target.value,
                              }))
                            }
                            placeholder="Doc #"
                            className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-sm focus:outline-none focus:border-sky-600 text-[10.5px] font-medium uppercase"
                          />
                        </div>
                        <div className="col-span-1 flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={manifestLead.passportExpiry}
                            onChange={(e) =>
                              setManifestLead((prev) => ({
                                ...prev,
                                passportExpiry: e.target.value,
                              }))
                            }
                            placeholder="DD/MM/YYYY"
                            className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-sm focus:outline-none focus:border-sky-600 text-[10.5px] font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Companions section */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1 pt-1.5">
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 select-none">
                          Companions ({manifestCompanions.length})
                        </span>
                        <button
                          type="button"
                          onClick={handleAddCompanion}
                          className="text-[9.5px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          + Add Companion
                        </button>
                      </div>

                      {manifestCompanions.length === 0 ? (
                        <div className="text-center py-5 px-3 bg-white border border-dashed border-slate-200 rounded text-slate-400 text-[10px] select-none">
                          No additional companions declared yet.
                          <br />
                          <span className="text-[9px] text-slate-400">
                            Click "+ Add Companion" above to register additional
                            travelers.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {manifestCompanions.map((comp, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-white border border-slate-200 rounded-sm relative space-y-2"
                            >
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Traveler {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCompanion(idx)}
                                  className="text-rose-655 hover:text-rose-800 font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                  Full Name
                                </label>
                                <input
                                  type="text"
                                  value={comp.fullName}
                                  onChange={(e) =>
                                    handleUpdateCompanion(
                                      idx,
                                      "fullName",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Full Name as in Passport"
                                  className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-xs focus:outline-none focus:border-emerald-600 text-[10px] font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                    Nationality
                                  </label>
                                  <input
                                    type="text"
                                    value={comp.country}
                                    onChange={(e) =>
                                      handleUpdateCompanion(
                                        idx,
                                        "country",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Nationality"
                                    className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-xs focus:outline-none focus:border-emerald-600 text-[10px] font-medium"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                    Passport No.
                                  </label>
                                  <input
                                    type="text"
                                    value={comp.passportNumber}
                                    onChange={(e) =>
                                      handleUpdateCompanion(
                                        idx,
                                        "passportNumber",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Passport"
                                    className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-xs focus:outline-none focus:border-emerald-600 text-[10px] font-medium uppercase"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                    Expiry Date
                                  </label>
                                  <input
                                    type="text"
                                    value={comp.passportExpiry}
                                    onChange={(e) =>
                                      handleUpdateCompanion(
                                        idx,
                                        "passportExpiry",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Expiry"
                                    className="bg-white border border-slate-300 p-1.5 text-slate-800 rounded-xs focus:outline-none focus:border-emerald-600 text-[10px] font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Save action bar */}
                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowManifestPanel(false)}
                      className="flex-1 text-center py-1.5 bg-white border border-slate-300 text-slate-650 hover:bg-slate-50 rounded-sm font-semibold tracking-wide cursor-pointer transition-all uppercase text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveManifest}
                      className="flex-1 text-center py-1.5 bg-emerald-700 hover:bg-emerald-850 text-white rounded-sm font-semibold tracking-wide cursor-pointer transition-all uppercase text-[10px]"
                    >
                      Save & Sync
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Settings Drawer */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50 border-b border-slate-200/60 overflow-hidden text-slate-800 text-xs px-3 py-2.5 flex flex-col gap-2.5"
                      >
                        <label className="flex items-center gap-2 cursor-pointer w-fit select-none">
                          <input
                            type="checkbox"
                            checked={autoTranslate}
                            onChange={(e) => setAutoTranslate(e.target.checked)}
                            className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                            Auto-translate messages (Gemini AI)
                          </span>
                        </label>
                        {autoTranslate && (
                          <div className="flex items-center gap-2 pl-5">
                            <span className="text-[10px] text-slate-500 font-medium">
                              To:
                            </span>
                            <select
                              value={preferredLanguage}
                              onChange={(e) =>
                                setPreferredLanguage(e.target.value)
                              }
                              className="flex-1 bg-white border border-slate-300 py-1 px-2 rounded-xs focus:outline-none focus:border-emerald-600 text-[10px] cursor-pointer"
                            >
                              <option value="English">English</option>
                              <option value="Thai">Thai</option>
                              <option value="Chinese (Simplified)">
                                Chinese
                              </option>
                              <option value="Russian">Russian</option>
                              <option value="German">German</option>
                              <option value="French">French</option>
                              <option value="Hindi">Hindi</option>
                              <option value="Arabic">Arabic</option>
                            </select>
                          </div>
                        )}

                        <div className="border-t border-slate-200/60 my-1" />

                        {/* Audio Alerts Toggle */}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                              Audio Alerts
                            </span>
                          </label>
                          <input
                            type="checkbox"
                            checked={audioAlertsEnabled}
                            onChange={(e) =>
                              handleToggleAudio(e.target.checked)
                            }
                            className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                          />
                        </div>

                        {/* Push Notifications Toggle */}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Bell className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                              Push Notifications
                            </span>
                          </label>
                          <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={(e) =>
                              handleToggleNotifications(e.target.checked)
                            }
                            className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                          />
                        </div>

                        {/* Vibration Display */}
                        <div className="flex items-center justify-between opacity-50">
                          <label className="flex items-center gap-2 select-none">
                            <span className="text-[10px]">📳</span>
                            <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                              Vibration Alerts
                            </span>
                          </label>
                          <span className="text-[8px] font-bold text-red-600 uppercase bg-red-50 border border-red-200/50 px-1 py-0.5 rounded-xs">
                            Always Disabled
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Start Video Consultation Top Bar */}
                  {!isUserClient &&
                    inquiryId !== "new-chat-session" &&
                    inquiry && (
                      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3.5 py-2 flex items-center justify-between gap-1.5 text-[9.5px] font-sans shrink-0">
                        <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                          <Video className="h-3.5 w-3.5 text-emerald-600 animate-pulse shrink-0" />
                          <span className="uppercase tracking-wide font-extrabold text-slate-700 text-[9px]">
                            Video Consultation Ready
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendVideoInvite}
                          disabled={isSending}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 disabled:opacity-50 text-white rounded-xs font-bold transition-all cursor-pointer text-[8.5px] uppercase tracking-widest shadow-3xs flex items-center gap-1 active:scale-97 font-sans font-semibold"
                          title="Generate and send instant Video Room link"
                        >
                          <Video className="h-2.5 w-2.5" />
                          Start Video Consultation
                        </button>
                      </div>
                    )}

                  {/* Optional luxury attachment banner */}
                  {((inquiry.vesselName && inquiry.vesselName !== "none") ||
                    !isUserClient) && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex flex-col gap-1.5 text-[9.5px] text-amber-900 font-sans font-semibold font-bold">
                      {inquiry.vesselName && inquiry.vesselName !== "none" && (
                        <div className="flex items-center gap-1.5">
                          <Anchor className="h-3 w-3" />
                          <span className="truncate">
                            Active Interest: {inquiry.vesselName}
                          </span>
                        </div>
                      )}
                      {!isUserClient && (
                        <button
                          type="button"
                          onClick={() => {
                            const urlObj = new URL(getPublicUrl());
                            urlObj.searchParams.set("compare", "true");
                            urlObj.searchParams.set(
                              "v1",
                              inquiry.vesselId && inquiry.vesselId !== "none"
                                ? inquiry.vesselId
                                : "the-best",
                            );
                            urlObj.searchParams.set(
                              "clientName",
                              inquiry.name || "Live Chat Guest",
                            );
                            urlObj.searchParams.set(
                              "replyToChatId",
                              inquiry.id,
                            );
                            window.open(urlObj.toString(), "_blank");
                          }}
                          className="w-full py-1.5 bg-white border border-amber-500/30 text-amber-700 hover:bg-amber-50 rounded-sm shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-widest font-bold font-semibold"
                        >
                          Launch Portal to Generate Quote
                        </button>
                      )}
                    </div>
                  )}

                  {inquiryId === "new-chat-session" ? (
                    <div className="flex-1 overflow-y-auto p-5 bg-white text-left space-y-4">
                      <div className="text-center space-y-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Anchor className="h-4.5 w-4.5" />
                        </span>
                        <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
                          Broker Connection Form
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed max-w-[95%] mx-auto font-sans">
                          Speak directly with our expert broker team to secure
                          your premium catamaran charter.
                        </p>
                      </div>

                      <form
                        onSubmit={handleStartGuestChat}
                        className="space-y-3.5 pt-2"
                      >
                        {registerError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-sans font-semibold p-2 rounded text-center leading-normal">
                            ⚠️ {registerError}
                          </div>
                        )}

                        <div>
                          <label className="block text-[8.5px] uppercase tracking-widest text-[#0F172A]/70 font-extrabold mb-1">
                            Your Full Name
                          </label>
                          <input
                            type="text"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            placeholder="e.g. John Doe"
                            disabled={isSending}
                            className="w-full text-xs font-sans border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[8.5px] uppercase tracking-widest text-[#0F172A]/70 font-extrabold mb-1">
                            Email or Active Phone
                          </label>
                          <input
                            type="text"
                            value={registerPhone}
                            onChange={(e) => setRegisterPhone(e.target.value)}
                            placeholder="e.g. +66 81 234 5678 or john@example.com"
                            disabled={isSending}
                            className="w-full text-xs font-sans border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                            required
                          />
                        </div>

                        <div className="pt-1 select-none">
                          <label className="flex items-start gap-2 text-slate-600 text-[10px] leading-relaxed cursor-pointer">
                            <input
                              type="checkbox"
                              checked={registerTerms}
                              onChange={(e) =>
                                setRegisterTerms(e.target.checked)
                              }
                              disabled={isSending}
                              className="accent-emerald-650 w-3.5 h-3.5 mt-0.5 shrink-0 cursor-pointer"
                              required
                            />
                            <span>
                              I agree to the Phuket yacht charter terms, local
                              safety regulations, and broker representation
                              pairing.
                            </span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={isSending}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-sans text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          {isSending
                            ? "Connecting Broker Account..."
                            : "Start Chat with Broker"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      {/* Scrollable message container */}
                      <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50 scrollbar-thin relative"
                      >
                        {/* Explanatory Chat Feature Guide */}
                        {showFeatureGuide && (
                          <div className="bg-white border border-emerald-100 rounded-lg p-3 shadow-xs mb-4 relative">
                            <div className="flex items-center justify-between border-b border-emerald-50 pb-2 mb-2">
                              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                <Info className="h-3.5 w-3.5 text-emerald-600" />
                                Live Conversation Features
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowFeatureGuide(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                                title="Hide Guide"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-2.5 leading-relaxed font-sans">
                              <div className="flex items-start gap-2.5">
                                <FileText className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                                <span>
                                  <strong>Text messaging:</strong> Type reply
                                  directly and hit Enter or submit to chat
                                  instantly.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <Mic className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                                <span>
                                  <strong>Voice messaging:</strong> Record
                                  real-time audio instruction notes to explain
                                  details cleanly. Click the mic to start, and
                                  check the sent message box.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <Video className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                                <span>
                                  <strong>Video conference:</strong> Initiate or
                                  join face-to-face video reviews instantly by
                                  clicking the Video button.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <Anchor className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                                <span>
                                  <strong>Send booking inquiry:</strong>{" "}
                                  Instantly share boat preferences, passenger
                                  specs, and desired dates.
                                </span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <Camera className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                                <span>
                                  <strong>Send photos:</strong> Click the camera
                                  button to capture and upload images in
                                  real-time.
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {chatHistory.map((item: any) => {
                          const isMe = isUserClient
                            ? item.sender === "client"
                            : item.sender === "agent";
                          return (
                            <div
                              key={item.id || item.createdAt}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-[85%] text-[11px] leading-relaxed shadow-3xs text-left ${
                                  isMe
                                    ? "bg-[#0F172A] text-white rounded-tr-none px-3 py-2 rounded-lg"
                                    : "bg-white text-slate-900 border border-slate-250 rounded-tl-none px-3 py-2 rounded-lg"
                                } ${item.isBookingSummary ? "!p-0 overflow-hidden !bg-white !text-slate-800 !border-emerald-500/50" : ""}`}
                              >
                                {item.isBookingSummary &&
                                item.bookingDetails ? (
                                  <div className="flex flex-col text-[10px] w-full min-w-[200px]">
                                    <div className="bg-emerald-600 text-white font-bold tracking-wider uppercase px-3 py-2 flex justify-between items-center">
                                      <span>Booking Request</span>
                                    </div>
                                    <div className="p-3 space-y-1.5 font-sans">
                                      <div className="font-bold text-xs text-slate-900 leading-tight mb-1">
                                        {item.bookingDetails.vesselName}{" "}
                                        <span className="font-normal text-slate-500">
                                          ({item.bookingDetails.vesselModel})
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                        <div className="text-slate-500">
                                          Date:
                                        </div>
                                        <div className="font-medium text-slate-800 text-right">
                                          {item.bookingDetails.charterDate}
                                        </div>
                                        <div className="text-slate-500">
                                          Guests:
                                        </div>
                                        <div className="font-medium text-slate-800 text-right">
                                          {item.bookingDetails.guestCount}
                                        </div>
                                        <div className="text-slate-500">
                                          Duration:
                                        </div>
                                        <div className="font-medium text-slate-800 text-right">
                                          {item.bookingDetails.charterDuration}
                                        </div>
                                        <div className="text-slate-500">
                                          Price:
                                        </div>
                                        <div className="font-medium text-emerald-600 text-right">
                                          ฿
                                          {item.bookingDetails.totalPrice?.toLocaleString()}
                                        </div>
                                      </div>
                                      {item.bookingDetails.excursionRoute && (
                                        <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                                          <span className="text-slate-500">
                                            Route:
                                          </span>
                                          <span className="font-medium text-slate-700 leading-snug">
                                            {item.bookingDetails.excursionRoute}
                                          </span>
                                        </div>
                                      )}
                                      {item.bookingDetails.amenities &&
                                        item.bookingDetails.amenities.length >
                                          0 && (
                                          <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                                            <span className="text-slate-500">
                                              Add-ons:
                                            </span>
                                            <ul className="list-disc pl-4 text-xs font-medium text-slate-700 leading-snug">
                                              {item.bookingDetails.amenities.map(
                                                (addon: string, i: number) => (
                                                  <li key={i}>{addon}</li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <p className="whitespace-pre-wrap">
                                      {item.text}
                                    </p>

                                    {/* Manual Translation Trigger */}
                                    {!isMe &&
                                      !translations[item.id] &&
                                      !translatingIds[item.id] &&
                                      !item.isBookingSummary &&
                                      !item.isPdfAttached && (
                                        <button
                                          onClick={() => {
                                            setTranslatingIds((prev) => ({
                                              ...prev,
                                              [item.id]: true,
                                            }));
                                            fetch("/api/translate", {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                text: item.text,
                                                targetLanguage:
                                                  preferredLanguage,
                                              }),
                                            })
                                              .then((res) => res.json())
                                              .then((data) => {
                                                if (data.translation)
                                                  setTranslations((prev) => ({
                                                    ...prev,
                                                    [item.id]: data.translation,
                                                  }));
                                              })
                                              .catch((err) =>
                                                console.error(
                                                  "Translate error:",
                                                  err,
                                                ),
                                              )
                                              .finally(() => {
                                                setTranslatingIds((prev) => ({
                                                  ...prev,
                                                  [item.id]: false,
                                                }));
                                              });
                                          }}
                                          className="text-[8px] mt-1 text-emerald-600 hover:text-emerald-700 underline font-semibold"
                                        >
                                          Translate to {preferredLanguage}
                                        </button>
                                      )}

                                    {/* Translation rendering */}
                                    {!isMe &&
                                      (translations[item.id] ||
                                        translatingIds[item.id]) && (
                                        <div className="mt-1 pt-1.5 border-t border-slate-200/60 break-words flex flex-col gap-0.5">
                                          <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            Translation ({preferredLanguage})
                                          </span>
                                          {translatingIds[item.id] ? (
                                            <div className="flex space-x-1 items-center h-3 px-1 mt-0.5 opacity-50">
                                              <div
                                                className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"
                                                style={{
                                                  animationDelay: "0ms",
                                                }}
                                              ></div>
                                              <div
                                                className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"
                                                style={{
                                                  animationDelay: "150ms",
                                                }}
                                              ></div>
                                              <div
                                                className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"
                                                style={{
                                                  animationDelay: "300ms",
                                                }}
                                              ></div>
                                            </div>
                                          ) : (
                                            <p className="text-[#0F172A] font-medium text-[10.5px] whitespace-pre-wrap">
                                              {translations[item.id]}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    {item.isPdfAttached && item.pdfData && (
                                      <div className="mt-2 p-2 rounded border border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
                                        <div className="flex items-center gap-1.5">
                                          <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                          <span
                                            className="text-[10px] font-bold text-slate-800 truncate block max-w-[150px] font-sans"
                                            title={item.fileName}
                                          >
                                            {item.fileName || "Proposal.pdf"}
                                          </span>
                                        </div>
                                        <button
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(
                                                item.pdfData,
                                              );
                                              const blob =
                                                await response.blob();
                                              const blobUrl =
                                                URL.createObjectURL(blob);
                                              const link =
                                                document.createElement("a");
                                              link.href = blobUrl;
                                              link.download =
                                                item.fileName || "document.pdf";
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                              setTimeout(
                                                () =>
                                                  URL.revokeObjectURL(blobUrl),
                                                100,
                                              );
                                            } catch (err) {
                                              console.error(
                                                "PDF download error:",
                                                err,
                                              );
                                              alert(
                                                "Failed to download PDF document.",
                                              );
                                            }
                                          }}
                                          className="mt-0.5 text-white bg-slate-900 border-none hover:bg-slate-800 px-2.5 py-1.5 flex items-center justify-center gap-1.5 w-full text-[9px] uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer shadow-2xs"
                                        >
                                          <Download className="w-3" />
                                          Download PDF Proposal
                                        </button>

                                        {/* Interactive Accept / Decline for Customer Session */}
                                        {isUserClient &&
                                          item.sender === "agent" && (
                                            <div className="mt-1 border-t border-slate-200/60 pt-2 flex flex-col gap-1.5 font-sans">
                                              {!inquiry.proposalStatus ||
                                              inquiry.proposalStatus ===
                                                "proposed" ? (
                                                <>
                                                  <p className="text-[8.5px] font-sans font-bold text-slate-605 uppercase tracking-wider text-center select-none">
                                                    Do you accept our proposal
                                                    rate?
                                                  </p>
                                                  <div className="grid grid-cols-2 gap-1.5">
                                                    <button
                                                      onClick={() =>
                                                        handleAcceptProposal(
                                                          inquiry.proposedPrice,
                                                        )
                                                      }
                                                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs py-1.5 px-2 text-[9px] font-bold uppercase tracking-wider border-none transition-colors cursor-pointer shadow-3xs"
                                                    >
                                                      Accept
                                                    </button>
                                                    <button
                                                      onClick={() =>
                                                        handleDeclineProposal()
                                                      }
                                                      className="bg-red-50 hover:bg-red-105 text-red-650 rounded-xs py-1.5 px-2 text-[9px] font-bold uppercase tracking-wider border border-red-200/65 transition-colors cursor-pointer"
                                                    >
                                                      Decline
                                                    </button>
                                                  </div>
                                                </>
                                              ) : inquiry.proposalStatus ===
                                                "accepted" ? (
                                                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded p-1.5 text-[9px] font-sans font-extrabold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 select-none h-7">
                                                  <span className="animate-bounce">
                                                    🟢
                                                  </span>{" "}
                                                  Proposal Accepted ✓
                                                </div>
                                              ) : inquiry.proposalStatus ===
                                                "declined" ? (
                                                <div className="bg-red-50 text-red-600 border border-red-200/50 rounded p-1.5 text-[9px] font-sans font-extrabold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 select-none h-7">
                                                  <span>🔴</span> Proposal
                                                  Declined ✗
                                                </div>
                                              ) : null}
                                            </div>
                                          )}
                                      </div>
                                    )}
                                    {item.isVoiceNote && item.audioData && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <audio
                                          src={item.audioData}
                                          controls
                                          className="h-8 max-w-[200px]"
                                        />
                                      </div>
                                    )}
                                    {item.isVideoInvite && item.videoLink && (
                                      <div className="mt-2 rounded-md overflow-hidden border border-emerald-500/25 bg-emerald-50/60 p-3.5 flex flex-col gap-2.5 shrink-0 min-w-[230px] shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-2">
                                          <span className="p-1.5 rounded-sm bg-gradient-to-tr from-emerald-600 to-teal-500 text-white animate-pulse flex items-center justify-center">
                                            <Video className="h-4 w-4" />
                                          </span>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 leading-none mb-0.5">
                                              Video Consultation
                                            </span>
                                            <span className="text-[8.5px] font-bold text-slate-500 font-mono tracking-wide uppercase leading-none">
                                              Private Session
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-[9.5px] text-slate-600 leading-normal font-medium">
                                          Tap the link below to enter your
                                          secure face-to-face video chat session
                                          with your broker representative.
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            alert(
                                              "Live video consultation is currently disabled.",
                                            );
                                            /*
                                  setActiveVideoRoom(item.videoLink);
                                  if (isMinimized) {
                                    setIsMinimized(false);
                                  }
                                  */
                                          }}
                                          className="mt-1 text-center text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 py-2.5 flex items-center justify-center gap-2 w-full text-[9.5px] uppercase font-bold tracking-widest rounded-xs transition-colors cursor-pointer shadow-3xs"
                                        >
                                          <Video className="w-3.5 h-3.5" />
                                          Join Video Chat
                                        </button>
                                      </div>
                                    )}
                                    {item.isImageAttached && item.imageData && (
                                      <div className="mt-2 rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex flex-col shrink-0 min-w-[150px]">
                                        <img
                                          src={item.imageData}
                                          alt="Captured photo attachment"
                                          className="w-full max-h-[160px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                          referrerPolicy="no-referrer"
                                          onClick={() =>
                                            setExpandedImage(item.imageData)
                                          }
                                        />
                                        <div className="px-2 py-1 text-[8px] text-slate-500 font-sans tracking-wide bg-slate-50 border-t border-slate-200/50 flex justify-between items-center select-none">
                                          <span>📷 Captured Photo</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const link =
                                                document.createElement("a");
                                              link.href = item.imageData!;
                                              link.download = `photo_${Date.now()}.jpg`;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                            className="text-[8px] font-bold text-emerald-600 hover:text-emerald-700 bg-none border-none cursor-pointer"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div
                                className={`flex w-full mt-1 px-0.5 select-none ${isMe ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`flex items-center gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                >
                                  <span className="text-[8px] font-mono text-slate-400">
                                    {item.createdAt
                                      ? new Date(
                                          item.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                  {!isMe && item.agentName && (
                                    <span className="text-[8px] font-sans font-semibold text-emerald-600/80 truncate">
                                      {item.agentName}
                                    </span>
                                  )}
                                  {isMe && item.seen && (
                                    <span className="text-[9px] text-blue-500 font-bold">
                                      ✓✓ Seen
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {inquiry.customerTyping && (
                          <div className="flex flex-col mb-2.5 max-w-[85%] self-start text-left items-start">
                            <div className="px-3 py-2.5 rounded-2xl bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200">
                              <div className="flex space-x-1 items-center h-4 px-1">
                                <div
                                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                ></div>
                                <div
                                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></div>
                                <div
                                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-slate-400 mt-1 select-none">
                              Typing...
                            </span>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <AnimatePresence>
                        {showScrollDown && (
                          <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            onClick={() =>
                              messagesEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                              })
                            }
                            className="absolute bottom-16 right-4 p-1.5 bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition-colors z-50 cursor-pointer"
                            title="Scroll to latest message"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Quick Replies Drawer */}
                      <AnimatePresence>
                        {showQuickReplies && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50 border-t border-slate-200/60 overflow-hidden"
                          >
                            <div className="p-2 flex flex-col gap-1.5 max-h-[170px] overflow-y-auto scrollbar-thin">
                              {quickReplies.map((reply, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSendQuickReply(reply)}
                                  className="text-[9px] font-sans font-medium px-2 py-1 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 rounded-sm transition-colors text-left text-slate-600 truncate max-w-full cursor-pointer shadow-3xs"
                                >
                                  {reply}
                                </button>
                              ))}
                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Add new quick reply..."
                                  value={newQuickReply}
                                  onChange={(e) =>
                                    setNewQuickReply(e.target.value)
                                  }
                                  className="flex-1 text-[9px] px-2 py-1 border border-slate-300 rounded-sm bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newQuickReply.trim()) {
                                      setQuickReplies([
                                        ...quickReplies,
                                        newQuickReply.trim(),
                                      ]);
                                      setNewQuickReply("");
                                    }
                                  }}
                                  className="text-[9px] font-bold px-2 py-1 bg-emerald-700 text-white rounded-sm cursor-pointer hover:bg-emerald-800"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quick interactive replying input form */}
                      <form
                        onSubmit={handleSend}
                        className="p-2 border-t border-slate-200/60 flex gap-1.5 bg-white relative"
                      >
                        {!isRecording && (
                          <>
                            <label
                              className="p-1.5 rounded-xs bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-250 border border-slate-200 cursor-pointer shrink-0 flex items-center justify-center transition-colors"
                              title="Capture or select photo"
                            >
                              <Camera className="h-3 w-3" />
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleCameraUpload}
                                disabled={isSending}
                              />
                            </label>
                            <label
                              className="p-1.5 rounded-xs bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer shrink-0 flex items-center justify-center transition-colors"
                              title="Attach PDF"
                            >
                              <Paperclip className="h-3 w-3" />
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isSending}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setShowQuickReplies(!showQuickReplies)
                              }
                              className={`p-1.5 rounded-xs transition-colors shrink-0 flex items-center justify-center border cursor-pointer ${showQuickReplies ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"}`}
                              title="Quick Replies"
                            >
                              <Zap className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={startRecording}
                              className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 cursor-pointer shrink-0 flex items-center justify-center transition-colors text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-250"
                              title="Record voice note"
                            >
                              <Mic className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleSendVideoInvite}
                              className="p-1.5 rounded-xs bg-slate-50 border border-slate-200 cursor-pointer shrink-0 flex items-center justify-center transition-colors text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-250"
                              title="Video conference"
                            >
                              <Video className="h-3 w-3" />
                            </button>
                          </>
                        )}

                        {isRecording ? (
                          <div className="flex-1 flex items-center justify-between px-3 py-1 bg-red-50/50 border border-red-200 text-red-600 rounded-xs text-[11px] font-medium mr-1 shadow-inner animate-pulse transition-all">
                            <div className="flex items-center gap-2">
                              <Mic className="h-3.5 w-3.5" />
                              <span>Recording audio...</span>
                            </div>
                            <button
                              type="button"
                              onClick={cancelRecording}
                              className="p-0.5 hover:bg-red-100/80 rounded-sm cursor-pointer flex items-center justify-center transition-colors text-red-500 hover:text-red-700"
                              title="Cancel recording"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            required
                            value={replyText}
                            onChange={(e) => {
                              setReplyText(e.target.value);
                              const docRef = doc(db, "inquiries", inquiryId);
                              updateDoc(docRef, {
                                [isUserClient
                                  ? "customerTyping"
                                  : "agentTyping"]: e.target.value.length > 0,
                              });
                            }}
                            disabled={isSending}
                            placeholder={`Type reply directly...`}
                            className="flex-1 py-1 px-2.5 border border-slate-300 text-[11px] text-slate-800 focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white rounded-xs"
                          />
                        )}

                        <button
                          type={isRecording ? "button" : "submit"}
                          onClick={isRecording ? stopRecording : undefined}
                          disabled={
                            isSending || (!isRecording && !replyText.trim())
                          }
                          className="p-1.5 bg-emerald-700 hover:bg-emerald-850 disabled:opacity-45 text-white rounded-xs cursor-pointer transition-colors shrink-0 flex items-center justify-center shadow-3xs"
                          title={
                            isRecording
                              ? "Send voice note"
                              : "Send active message reply"
                          }
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}

              {/* Bottom Close Option */}
              <div className="bg-slate-50 border-t border-slate-200/60 p-1.5 flex justify-center items-center shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-center py-1 px-3 text-[10px] text-rose-650 hover:text-white hover:bg-rose-600 border border-rose-250/50 rounded-xs font-semibold tracking-wide transition-all uppercase cursor-pointer flex items-center justify-center gap-1 hover:border-transparent active:scale-98"
                >
                  <X className="h-2.5 w-2.5" /> Close Chat
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {expandedImage && (
        <div
          className="fixed inset-0 z-[601] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded"
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-sm"
          />
        </div>
      )}
    </motion.div>
  );
}
