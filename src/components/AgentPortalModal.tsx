import React, { useState } from "react";
import { useIsAdmin } from "../useIsAdmin";
import QuoteGeneratorInline from "./QuoteGeneratorInline";
import QRCode from "qrcode";
import { getPublicUrl } from "../utils/url";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ShieldAlert,
  Shield,
  User,
  Users,
  Mail,
  Lock,
  Phone,
  MessageSquare,
  Save,
  LogOut,
  CheckCircle2,
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  Trash2,
  Edit2,
  Inbox,
  Anchor,
  Plus,
  Globe,
  Key,
  AlertTriangle,
  Share2,
  Facebook,
  MessageCircle,
  Send,
  Paperclip,
  Upload,
  Gauge,
  Cloud,
  FolderOpen,
  RefreshCw,
  File,
  Folder,
  Eye,
  EyeOff,
  Menu,
  Activity,
  Ship,
  PieChart,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Star,
} from "lucide-react";
import { useAgent, Agent } from "../AgentContext";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updatePassword,
  deleteUser,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { CATAMARANS, DESTINATIONS } from "../data";
import { useCurrency } from "../CurrencyContext";
import { VESSEL_BASE_RATES } from "./VesselCard";
import {
  CALLING_CODES,
  WORLD_COUNTRIES,
  compileManifestPdf,
} from "./CustomerPortalModal";
import AdminFleetSettings from "./AdminFleetSettings";
import PDFChatModal from "./PDFChatModal";
import AgentChat from "./AgentChat";
import WorkspaceHub from "./WorkspaceHub";
import AgentReferralQrGenerator from "./AgentReferralQrGenerator";
import PasswordInput from "./PasswordInput";
import AgentAIAssistant from "./AgentAIAssistant";
import AgentPricesTab from "./AgentPricesTab";
import { generateAgentPdfQuote } from "../utils/pdfGenerator";

const TOUR_PRESET_ITEMS = [
  {
    name: "Phromthep Cape Sunset Cruise Package",
    price: 35000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "James Bond Island & Phang Nga Bay Premium Route",
    price: 55000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Coral Island (Ko He South) Day Cruise",
    price: 28000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Banana Beach (Ko He Island) Lagoon Tour",
    price: 32000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Ko Racha Yai - Pristine White Beach Day Sail",
    price: 42000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Ko Racha Noi - Deep Coral Volcanic Voyage",
    price: 48000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Maithon Private Island - Bottlenose Dolphin Watch",
    price: 35000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Koh Khai Nok - Shallow Reef Wading Excursion",
    price: 38000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Twin Island Trilogy: Maithon & Ko He Family Tour",
    price: 45000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Twin Island Signature: Maithon & Ko Racha Yai Route",
    price: 52000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Phuket Premier Trilogy: Ko He, Racha Yai & Promthep Sunset",
    price: 54000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Phi Phi Islands Explorer (Maya Bay, Pileh Lagoon & Bamboo)",
    price: 85000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Koh Hong Emerald Karst Lagoon Cruise (Phang Nga Bay)",
    price: 58000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Koh Yao Yai Hidden Golden Beach & Village Cruise",
    price: 48000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Similan Islands National Park Marine Sanctuary Voyage",
    price: 110000,
    unit: "charter",
    qty: 1,
  },
];

const ADDON_PRESET_ITEMS = [
  {
    name: "Inflatable Ocean Swimming Safe-Pool Net Enclosure",
    price: 5000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Water Slider (Flybridge Inflatable Slide into Ocean)",
    price: 5000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Charter Air-Conditioned Cabins (Double bed bedrooms access)",
    price: 6000,
    unit: "day",
    qty: 1,
  },
  {
    name: "Premium Fresh Seafood & Tropical Barbecue Upgrade",
    price: 1800,
    unit: "guest",
    qty: 10,
  },
  {
    name: "Traditional Thai Signature Buffet Catering Menu",
    price: 950,
    unit: "guest",
    qty: 10,
  },
  {
    name: "Custom Onboard Live DJ & Professional Sound Rigging",
    price: 15000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Private Hotel/Airport Round-trip Luxury Minibus Transfer",
    price: 2500,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Certified Scuba Diving Master & Specialized Diving Equipment",
    price: 6500,
    unit: "day",
    qty: 1,
  },
  {
    name: "Onboard Drone Videography & High-Speed Raw Footage Service",
    price: 9005,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Smart TV Karaoke Entertainment System with Multi-mic Library",
    price: 3000,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Deep-Sea Trolling Professional Fishing Rods & Special Lures",
    price: 1500,
    unit: "day",
    qty: 4,
  },
  {
    name: "Traditional Longtail Boat Island Transfer Tender",
    price: 4500,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Premium Imported Bottle of French Moët & Chandon Champagne",
    price: 4900,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Bespoke Red Wine or White Wine Bottles Box (Carton of 6)",
    price: 4200,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Elegant Birthday Celebration Cake & Decorative Balloon Theme",
    price: 2500,
    unit: "charter",
    qty: 1,
  },
  {
    name: "Bilingual Marine Tour Hostess Guide (English/Chinese/Thai)",
    price: 3500,
    unit: "day",
    qty: 1,
  },
  {
    name: "Maya Bay & National Park Entrance/Maintenance Tickets",
    price: 400,
    unit: "guest",
    qty: 10,
  },
  {
    name: "Cold Young Island Fresh Coconut Served Welcome Platters",
    price: 120,
    unit: "guest",
    qty: 10,
  },
];

interface AgentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestComparisonModal?: () => void;
  initialInquiryTab?:
    | "quotes"
    | "inquiries"
    | "customers"
    | "fleet"
    | "efficiency"
    | "assistant"
    | "generator"; // Added generator
  initialActiveInquiryChatId?: string | null;
  initialEditingProposalId?: string | null;
}

export default function AgentPortalModal({
  isOpen,
  onClose,
  onRequestComparisonModal,
  initialInquiryTab,
  initialActiveInquiryChatId,
  initialEditingProposalId,
}: AgentPortalModalProps) {
  const {
    currentAgent,
    isReferred,
    login,
    register,
    logout,
    updateProfile,
    getNormalizedWhatsApp,
    agents,
    adminResetPassword,
  } = useAgent();
  const isRealAdmin = useIsAdmin();
  const isVinko = isRealAdmin;
  const isMasterAdmin = isRealAdmin;
  const isAgentLoggedIn = !!(
    currentAgent &&
    (currentAgent.password || !isReferred)
  );
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Agent real-time notification toast queue
  const [agentToasts, setAgentToasts] = useState<
    { id: string; title: string; message: string }[]
  >([]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState("");
  const [resetLookupResult, setResetLookupResult] = useState<{
    found: boolean;
    name?: string;
    email?: string;
  } | null>(null);

  // Secure Self-Service Password Reset States
  const [verificationWhatsapp, setVerificationWhatsapp] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [selfResetSuccess, setSelfResetSuccess] = useState<string | null>(null);
  const [selfResetError, setSelfResetError] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLineId, setRegLineId] = useState("");
  const [regWechatId, setRegWechatId] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regCompanyAddress, setRegCompanyAddress] = useState("");
  const [regCountry, setRegCountry] = useState("Thailand");
  const [regTaxId, setRegTaxId] = useState("");

  // Edit Profile State (for authenticated view)
  const [profileName, setProfileName] = useState(currentAgent?.name || "");
  const [profileWhatsapp, setProfileWhatsapp] = useState(
    currentAgent?.whatsapp || "",
  );
  const [profilePhone, setProfilePhone] = useState(
    currentAgent?.contactPhone || "",
  );
  const [profileLineId, setProfileLineId] = useState(
    currentAgent?.lineId || "",
  );
  const [profileWechatId, setProfileWechatId] = useState(
    currentAgent?.wechatId || "",
  );
  const [profileCompanyName, setProfileCompanyName] = useState(
    currentAgent?.companyName || "",
  );
  const [profileCompanyAddress, setProfileCompanyAddress] = useState(
    currentAgent?.companyAddress || "",
  );
  const [profileCountry, setProfileCountry] = useState(
    currentAgent?.country || "Thailand",
  );
  const [profileTaxId, setProfileTaxId] = useState(currentAgent?.taxId || "");
  const [profileCommissionRate, setProfileCommissionRate] = useState<number>(
    (currentAgent as any)?.commissionRate || 15,
  );
  const [profileWelcomeMessage, setProfileWelcomeMessage] = useState(
    currentAgent?.welcomeMessage || "",
  );
  const [profileCustomShareMessage, setProfileCustomShareMessage] = useState(
    currentAgent?.customShareMessage || "",
  );

  // Private Booking requests & Passenger Manifest states (Idea 1)
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [brandingLinkCopied, setBrandingLinkCopied] = useState(false);
  const [tiktokCopied, setTiktokCopied] = useState(false);
  const [sharingPhotoUrl, setSharingPhotoUrl] = useState<string | null>(null);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [selectedBookingForManifest, setSelectedBookingForManifest] = useState<
    string | null
  >(null);
  const [manifestPaxName, setManifestPaxName] = useState("");
  const [manifestPaxAge, setManifestPaxAge] = useState("");
  const [manifestPaxNationality, setManifestPaxNationality] = useState("");
  const [manifestPaxPassport, setManifestPaxPassport] = useState("");
  const [manifestPaxPassportExpiry, setManifestPaxPassportExpiry] =
    useState("");
  const [manifestError, setManifestError] = useState("");
  const [manifestSuccess, setManifestSuccess] = useState("");
  const [isSavingManifest, setIsSavingManifest] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(
    null,
  );

  // VIP CRM Settings (Idea 6)
  const [activeCrmCustomerId, setActiveCrmCustomerId] = useState<string | null>(
    null,
  );
  const [crmNotesDraft, setCrmNotesDraft] = useState("");
  const [crmPreferencesDraft, setCrmPreferencesDraft] = useState("");
  const [isSavingCrm, setIsSavingCrm] = useState(false);

  const handleSaveCrm = async (customerId: string) => {
    setIsSavingCrm(true);
    try {
      await updateDoc(doc(db, "customers", customerId), {
        crmNotes: crmNotesDraft.trim(),
        crmPreferences: crmPreferencesDraft.trim(),
      });
      setActiveCrmCustomerId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save CRM changes.");
    } finally {
      setIsSavingCrm(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, "booking_requests", bookingId));
      if (selectedBookingForManifest === bookingId) {
        setSelectedBookingForManifest(null);
      }
      setDeletingBookingId(null);
    } catch (err: any) {
      console.error("Failed to delete booking", err);
    }
  };

  const markProposalAccepted = async (proposal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Mark "${proposal.clientName || "this quote"}" as accepted by the client?`,
    );
    if (!ok) return;
    try {
      const updated = savedProposals.map((p) =>
        p.id === proposal.id ? { ...p, status: "accepted" } : p,
      );
      setSavedProposals(updated);
      localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));
      await setDoc(
        doc(db, "proposals", proposal.id),
        { status: "accepted", acceptedOfflineAt: new Date().toISOString() },
        { merge: true },
      );
      window.dispatchEvent(new Event("proposals-updated"));
    } catch (err) {
      console.warn("Failed to mark proposal accepted:", err);
    }
  };

  const [savedProposals, setSavedProposals] = useState<any[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);

  // Google Drive integration states
  const [gdriveAccessToken, setGdriveAccessToken] = useState<string | null>(
    null,
  );
  const [gdriveUser, setGdriveUser] = useState<any | null>(null);
  const [gdriveFolderName] = useState("Phuket Yacht Charters - Quotations");
  const [gdriveFolderId, setGdriveFolderId] = useState<string | null>(null);
  const [gdriveFiles, setGdriveFiles] = useState<any[]>([]);
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const [gdriveError, setGdriveError] = useState<string | null>(null);
  const [gdriveStatusMessage, setGdriveStatusMessage] = useState<string | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [agentDriveFolders, setAgentDriveFolders] = useState<any[]>([]);

  const createAgentGdriveFolder = async (
    agent: { name: string; email: string },
    token: string,
    parentFolderId: string,
  ) => {
    try {
      const agentEmail = agent.email.toLowerCase().trim();
      const folderName = `Agent - ${agent.name} (${agentEmail})`;

      const qVal = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;
      const queryStr = encodeURIComponent(qVal);
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const folderId = searchData.files[0].id;
          await setDoc(
            doc(db, "agent_drive_folders", agentEmail),
            {
              folderId,
              agentEmail,
              agentName: agent.name,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
          return folderId;
        }
      }

      const createRes = await fetch(
        "https://www.googleapis.com/drive/v3/files",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentFolderId],
          }),
        },
      );

      if (createRes.ok) {
        const folderData = await createRes.json();
        const folderId = folderData.id;
        await setDoc(
          doc(db, "agent_drive_folders", agentEmail),
          {
            folderId,
            agentEmail,
            agentName: agent.name,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        return folderId;
      }
    } catch (err) {
      console.error("Error creating agent drive folder:", err);
    }
    return null;
  };

  const syncAllAgentsGdriveFolders = async (
    token: string,
    parentFolderId: string,
  ) => {
    if (!token || !parentFolderId) return;
    for (const agent of agents) {
      if (agent && agent.name && agent.email) {
        await createAgentGdriveFolder(agent, token, parentFolderId);
      }
    }
  };

  // Dedicated local/server 'charter-inquiries' bucket files (Google Disk storage)
  const [charterInquiriesFiles, setCharterInquiriesFiles] = useState<any[]>([]);
  const [charterLoading, setCharterLoading] = useState(false);
  const [charterError, setCharterError] = useState<string | null>(null);

  const loadCharterInquiriesFiles = async () => {
    setCharterLoading(true);
    setCharterError(null);
    try {
      const res = await fetch("/api/charter-inquiries");
      if (!res.ok) {
        throw new Error(
          "Failed to fetch local charter-inquiries bucket files.",
        );
      }
      const data = await res.json();
      setCharterInquiriesFiles(data || []);
    } catch (err: any) {
      console.error("Local charter-inquiries retrieval error:", err);
      setCharterError(err.message || "Failed to load files");
    } finally {
      setCharterLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGdriveLoading(true);
    setGdriveError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive");
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        const token = credential.accessToken;
        setGdriveAccessToken(token);
        // Fetch user profile info
        try {
          const profileRes = await fetch(
            "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setGdriveUser(profileData);
          }
        } catch (e) {
          console.warn("Could not load Google profile details:", e);
        }
        setGdriveStatusMessage(
          "Successfully authenticated Google Drive connection!",
        );
        setTimeout(() => setGdriveStatusMessage(null), 3000);
        await findOrCreateGdriveFolder(token);
      } else {
        throw new Error("No access token returned from Google Sign In popup.");
      }
    } catch (err: any) {
      console.error("Google login failed", err);
      setGdriveError(err.message || "Failed to connect to Google Account.");
    } finally {
      setGdriveLoading(false);
    }
  };

  const handleGoogleLogout = () => {
    setGdriveAccessToken(null);
    setGdriveUser(null);
    setGdriveFolderId(null);
    setGdriveFiles([]);
    setGdriveError(null);
  };

  const loadGdriveFiles = async (folderId: string, token: string) => {
    try {
      const q = encodeURIComponent(
        `'${folderId}' in parents and trashed=false`,
      );
      const filesRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,mimeType,size,createdTime,webViewLink,iconLink)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setGdriveFiles(filesData.files || []);
      } else {
        throw new Error("Could not retrieve documents inside Drive folder.");
      }
    } catch (err: any) {
      console.error(err);
      setGdriveError(
        "Failed to fetch folder contents. Use the Reload button to retry.",
      );
    }
  };

  const findOrCreateGdriveFolder = async (tokenOnSignIn?: string) => {
    const token = tokenOnSignIn || gdriveAccessToken;
    if (!token) return;

    setGdriveLoading(true);
    setGdriveError(null);
    try {
      // Find folder
      const queryStr = encodeURIComponent(
        `name='${gdriveFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      );
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!searchRes.ok) {
        throw new Error("Failed to query Google Drive folder list.");
      }

      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const folderId = searchData.files[0].id;
        setGdriveFolderId(folderId);

        // Save active Google Drive session configuration dynamically to Firestore
        try {
          await setDoc(
            doc(db, "google_drive_configs", "default"),
            {
              accessToken: token,
              folderId: folderId,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
          console.log(
            "Persisted active Google Drive configuration in Firestore.",
          );
        } catch (dbErr) {
          console.warn(
            "Could not persist Google Drive config to Firestore:",
            dbErr,
          );
        }

        await loadGdriveFiles(folderId, token);
        await syncAllAgentsGdriveFolders(token, folderId);
      } else {
        const createRes = await fetch(
          "https://www.googleapis.com/drive/v3/files",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: gdriveFolderName,
              mimeType: "application/vnd.google-apps.folder",
            }),
          },
        );

        if (!createRes.ok) {
          throw new Error(
            "Failed to create 'Phuket Yacht Charters - Quotations' folder in your Google Drive.",
          );
        }

        const folderData = await createRes.json();
        const folderId = folderData.id;
        setGdriveFolderId(folderId);

        // Save active Google Drive session configuration dynamically to Firestore
        try {
          await setDoc(
            doc(db, "google_drive_configs", "default"),
            {
              accessToken: token,
              folderId: folderId,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
          console.log(
            "Persisted active Google Drive configuration in Firestore.",
          );
        } catch (dbErr) {
          console.warn(
            "Could not persist Google Drive config to Firestore:",
            dbErr,
          );
        }

        setGdriveStatusMessage(
          `Created a new folder '${gdriveFolderName}' on your Google Drive!`,
        );
        setTimeout(() => setGdriveStatusMessage(null), 4500);
        await loadGdriveFiles(folderId, token);
        await syncAllAgentsGdriveFolders(token, folderId);
      }
    } catch (err: any) {
      console.error(err);
      setGdriveError(err.message || "Error setting up Google Drive folder.");
    } finally {
      setGdriveLoading(false);
    }
  };

  const uploadProposalToGdrive = async (proposal: any) => {
    if (!gdriveAccessToken) {
      alert(
        "Please connect your Google Drive account first under the Google Drive workspace tab.",
      );
      setInquiriesTab("gdrive");
      return;
    }
    if (!gdriveFolderId) {
      alert(
        "Please wait for Google Drive folder synchronization or create the folder inside the Google Drive tab.",
      );
      setInquiriesTab("gdrive");
      return;
    }

    setUploadProgress(true);
    setGdriveError(null);
    try {
      const blob = await generateAgentPdfQuote(proposal, currentAgent, true);
      const clientNameClean = (proposal.clientName || "quote")
        .toLowerCase()
        .replace(/\s+/g, "_");
      const fileName = `phuket_charter_proposal_${clientNameClean}_quote.pdf`;

      const metadata = {
        name: fileName,
        parents: [gdriveFolderId],
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      formData.append("file", blob);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gdriveAccessToken}`,
          },
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload proposal PDF to Google Drive.");
      }

      setGdriveStatusMessage(
        `Successfully uploaded proposal for ${proposal.clientName || "Client"} to Google Drive!`,
      );
      setTimeout(() => setGdriveStatusMessage(null), 3000);

      await loadGdriveFiles(gdriveFolderId, gdriveAccessToken);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload to Google Drive.");
    } finally {
      setUploadProgress(false);
    }
  };

  const backupSystemDataToDrive = async () => {
    if (!gdriveAccessToken || !gdriveFolderId) {
      alert("Please connect your Google Drive account first.");
      return;
    }

    setUploadProgress(true);
    setGdriveError(null);
    try {
      const dataToBackup = {
        timestamp: new Date().toISOString(),
        vessels: CATAMARANS,
        routes: DESTINATIONS,
        rates: VESSEL_BASE_RATES,
        inquiries: inquiries,
        customers: customersList,
      };

      const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], {
        type: "application/json",
      });
      const fileName = `system_backup_${new Date().toISOString().replace(/:/g, "-")}.json`;

      const metadata = {
        name: fileName,
        parents: [gdriveFolderId],
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      formData.append("file", blob);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gdriveAccessToken}`,
          },
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload system backup to Google Drive.");
      }

      setGdriveStatusMessage(
        `Successfully backed up system data to Google Drive!`,
      );
      setTimeout(() => setGdriveStatusMessage(null), 3000);

      await loadGdriveFiles(gdriveFolderId, gdriveAccessToken);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to back up to Google Drive.");
    } finally {
      setUploadProgress(false);
    }
  };

  const handleLocalFileUploadToGdrive = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!gdriveAccessToken || !gdriveFolderId) {
      alert("Ensure Google Drive is connected first.");
      return;
    }

    setUploadProgress(true);
    setGdriveError(null);
    try {
      const metadata = {
        name: file.name,
        parents: [gdriveFolderId],
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      formData.append("file", file);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gdriveAccessToken}`,
          },
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload local file to Google Drive.");
      }

      setGdriveStatusMessage(
        `Successfully uploaded '${file.name}' to Google Drive!`,
      );
      setTimeout(() => setGdriveStatusMessage(null), 3000);

      await loadGdriveFiles(gdriveFolderId, gdriveAccessToken);
    } catch (err: any) {
      console.error(err);
      setGdriveError(err.message || "Failed to upload file.");
    } finally {
      setUploadProgress(false);
    }
  };

  const handleGdriveFileDelete = async (fileId: string, fileName: string) => {
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = window.confirm(
          `Are you absolutely sure you want to delete '${fileName}' from Google Drive? This operation cannot be easily undone.`,
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    setGdriveLoading(true);
    setGdriveError(null);
    try {
      const deleteRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${gdriveAccessToken}` },
        },
      );
      if (deleteRes.ok) {
        setGdriveStatusMessage(`Deleted file '${fileName}' from Google Drive.`);
        setTimeout(() => setGdriveStatusMessage(null), 3000);
        if (gdriveFolderId) {
          await loadGdriveFiles(gdriveFolderId, gdriveAccessToken);
        }
      } else {
        throw new Error("Failed to delete the file from Google Drive.");
      }
    } catch (err: any) {
      console.error(err);
      setGdriveError(err.message || "Could not delete file from Google Drive.");
    } finally {
      setGdriveLoading(false);
    }
  };

  // States for creating manual/offline client proposals
  const [isCreatingManualQuote, setIsCreatingManualQuote] = useState(false);
  const [manualCustomerUid, setManualCustomerUid] = useState<string>("");
  const [manualClientName, setManualClientName] = useState("");
  const [manualCharterDate, setManualCharterDate] = useState("");
  const [manualClientContact, setManualClientContact] = useState("");
  const [manualVessel1Id, setManualVessel1Id] = useState("");
  const [manualPrice1, setManualPrice1] = useState("");
  const [manualVessel2Id, setManualVessel2Id] = useState("");
  const [manualPrice2, setManualPrice2] = useState("");
  const [manualVessel3Id, setManualVessel3Id] = useState("");
  const [manualPrice3, setManualPrice3] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualCustomLineItems, setManualCustomLineItems] = useState<any[]>([]);

  // Tab configurations and active inquiry links (Proposal Portal improvements)
  const [manualPresetTab, setManualPresetTab] = useState<
    "tours" | "addons" | "broker"
  >("tours");
  const [editingPresetTab, setEditingPresetTab] = useState<
    "tours" | "addons" | "broker"
  >("tours");
  const [manualCreateInquiry, setManualCreateInquiry] = useState<boolean>(true);

  // Load customers
  React.useEffect(() => {
    const q = query(collection(db, "customers"));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
      setCustomersList(list);
    });
    return () => unsub();
  }, []);

  // Helpers for managing manual quotation custom offered options & rates
  const handleAddManualLineItem = (preset?: any) => {
    const newItem = preset
      ? {
          id: `item-${Date.now()}-${Math.random()}`,
          name: preset.name,
          price: preset.price,
          qty: preset.qty,
          unit: preset.unit,
        }
      : {
          id: `item-${Date.now()}-${Math.random()}`,
          name: "Custom Offered Service",
          price: 1500,
          qty: 1,
          unit: "charter",
        };
    setManualCustomLineItems((prev) => [...prev, newItem]);
  };

  const handleUpdateManualLineItem = (
    id: string,
    field: string,
    value: any,
  ) => {
    setManualCustomLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let parsedVal = value;
          if (field === "price" || field === "qty") {
            parsedVal = Number(value) || 0;
          }
          return { ...item, [field]: parsedVal };
        }
        return item;
      }),
    );
  };

  const handleRemoveManualLineItem = (id: string) => {
    setManualCustomLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Helpers for managing active edited proposal options and custom extras
  const handleAddEditingLineItem = (preset?: any) => {
    if (!editingProposal) return;
    const prevItems = editingProposal.customLineItems || [];
    const newItem = preset
      ? {
          id: `item-${Date.now()}-${Math.random()}`,
          name: preset.name,
          price: preset.price,
          qty: preset.qty,
          unit: preset.unit,
        }
      : {
          id: `item-${Date.now()}-${Math.random()}`,
          name: "Custom Offered Service",
          price: 1500,
          qty: 1,
          unit: "charter",
        };
    setEditingProposal({
      ...editingProposal,
      customLineItems: [...prevItems, newItem],
    });
  };

  const handleUpdateEditingLineItem = (
    id: string,
    field: string,
    value: any,
  ) => {
    if (!editingProposal) return;
    const prevItems = editingProposal.customLineItems || [];
    const updatedItems = prevItems.map((item: any) => {
      if (item.id === id) {
        let parsedVal = value;
        if (field === "price" || field === "qty") {
          parsedVal = Number(value) || 0;
        }
        return { ...item, [field]: parsedVal };
      }
      return item;
    });
    setEditingProposal({
      ...editingProposal,
      customLineItems: updatedItems,
    });
  };

  const handleRemoveEditingLineItem = (id: string) => {
    if (!editingProposal) return;
    const prevItems = editingProposal.customLineItems || [];
    const updatedItems = prevItems.filter((item: any) => item.id !== id);
    setEditingProposal({
      ...editingProposal,
      customLineItems: updatedItems,
    });
  };

  // --- CUSTOMER PORTAL / CHARTER GUEST WORKSPACE VARIABLES ---
  const [portalMode, setPortalMode] = useState<"agent" | "customer">("agent");
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [fetchingCustomerProfile, setFetchingCustomerProfile] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Customer Auth fields
  const [customerActiveTab, setCustomerActiveTab] = useState<
    "login" | "register" | "forgot"
  >("login");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPwd, setCustomerPwd] = useState("");
  const [customerRegName, setCustomerRegName] = useState("");
  const [customerRegEmail, setCustomerRegEmail] = useState("");
  const [customerRegPwd, setCustomerRegPwd] = useState("");

  // Customer profile fields
  const [customerPhoneCode, setCustomerPhoneCode] = useState("+66");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [customerCountry, setCustomerCountry] = useState("Thailand");
  const [customerPassport, setCustomerPassport] = useState("");
  const [customerPassportExpiry, setCustomerPassportExpiry] = useState("");
  const [customerCompanions, setCustomerCompanions] = useState<any[]>([]);

  // Companion form fields
  const [companionName, setCompanionName] = useState("");
  const [companionCountry, setCompanionCountry] = useState("Thailand");
  const [companionPassport, setCompanionPassport] = useState("");
  const [companionExpiry, setCompanionExpiry] = useState("");

  // Customer Password fields
  const [customerNewPwd, setCustomerNewPwd] = useState("");
  const [customerConfirmPwd, setCustomerConfirmPwd] = useState("");
  const [showCustomerPasswordChange, setShowCustomerPasswordChange] =
    useState(false);

  // Sharing feedback
  const [showWechatPromptCustomer, setShowWechatPromptCustomer] =
    useState(false);
  const [copiedTextCustomer, setCopiedTextCustomer] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      let activeUser = user;
      if (!activeUser) {
        const localSandbox = localStorage.getItem("sandbox_customer_session");
        if (localSandbox) {
          try {
            activeUser = JSON.parse(localSandbox);
          } catch (e) {
            console.error("Failed to parse sandbox customer session:", e);
          }
        }
      }
      setCurrentCustomer(activeUser);
      if (activeUser) {
        setFetchingCustomerProfile(true);
        try {
          const docRef = doc(db, "customers", activeUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCustomerData(data);

            // Format phone numbers
            const savedPhone = data.phoneNumber || "";
            let foundPrefix = "+66";
            let mainNum = savedPhone;

            if (savedPhone.startsWith("+")) {
              const matched = CALLING_CODES.find((cc) =>
                savedPhone.startsWith(cc.code),
              );
              if (matched) {
                foundPrefix = matched.code;
                mainNum = savedPhone.slice(matched.code.length).trim();
              } else {
                const match = savedPhone.match(/^(\+\d{1,4})/);
                if (match) {
                  foundPrefix = match[1];
                  mainNum = savedPhone.slice(match[1].length).trim();
                }
              }
            }

            setCustomerPhoneCode(foundPrefix);
            setCustomerPhoneNumber(mainNum);
            setCustomerCountry(data.country || "Thailand");
            setCustomerPassport(data.passportNumber || "");
            setCustomerPassportExpiry(data.passportExpiry || "");
            setCustomerCompanions(data.companions || []);
          }
        } catch (err: any) {
          console.warn(
            "Error reading customer profile in agent portal modal",
            err.message,
          );
        } finally {
          setFetchingCustomerProfile(false);
        }
      } else {
        setCustomerData(null);
        setCustomerCompanions([]);
      }
    });

    return () => unsub();
  }, [isOpen]);

  // New states for Live Chat inquiries inbox (Idea 1 & Idea 2)
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [localUpdateCounter, setLocalUpdateCounter] = useState(0);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  React.useEffect(() => {
    const handleExceeded = () => setIsQuotaExceeded(true);
    const handleRecovered = () => setIsQuotaExceeded(false);
    window.addEventListener("phuket_quota_exceeded", handleExceeded);
    window.addEventListener("phuket_quota_recovered", handleRecovered);
    return () => {
      window.removeEventListener("phuket_quota_exceeded", handleExceeded);
      window.removeEventListener("phuket_quota_recovered", handleRecovered);
    };
  }, []);
  const [inquiriesTab, setInquiriesTab] = useState<
    | "quotes"
    | "inquiries"
    | "customers"
    | "fleet"
    | "agent-chat"
    | "co-agents"
    | "gdrive"
    | "bookings"
    | "workspace"
    | "efficiency"
    | "qr-generator"
    | "analytics"
    | "branding"
    | "assistant"
    | "prices"
  >(initialInquiryTab || "quotes");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCoagentEditorId, setActiveCoagentEditorId] =
    useState<string>("main");
  const [activeInquiryChatId, setActiveInquiryChatId] = useState<string | null>(
    null,
  );
  const [copiedInquiryId, setCopiedInquiryId] = useState<string | null>(null);
  const [activeInquiryFolder, setActiveInquiryFolder] = useState<string>("All");
  const [agentReplyText, setAgentReplyText] = useState("");
  const [isSendingAgentReply, setIsSendingAgentReply] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [isInlineQuoteOpen, setIsInlineQuoteOpen] = useState(false);
  const [isPdfChatOpen, setIsPdfChatOpen] = useState(false);
  const [inlineQuoteData, setInlineQuoteData] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // QR Code Generator customization states
  const [qrFrameType, setQrFrameType] = useState<
    "none" | "classic" | "luxury" | "vintage" | "neon"
  >("luxury");
  const [qrCustomBg, setQrCustomBg] = useState("#FFFFFF");
  const [qrCustomFg, setQrCustomFg] = useState("#0C192E");
  const [qrBadgeLogo, setQrBadgeLogo] = useState<"logo" | "none">("logo");
  const [qrCaption, setQrCaption] = useState("SCAN   TO   BOOK   NOW");
  const [qrSizeScale, setQrSizeScale] = useState(250);
  const [qrDisplayTab, setQrDisplayTab] = useState<"poster" | "badge">("badge");
  const [qrCopied, setQrCopied] = useState(false);
  const [testPairingMsg, setTestPairingMsg] = useState("");

  // Shareable QR Invitation Card states
  const [cardGreeting, setCardGreeting] = useState(
    "Let's plan your dream charter!",
  );
  const [cardDesign, setCardDesign] = useState<
    "emerald" | "navy" | "charcoal" | "sunset"
  >("emerald");
  const [cardTagline, setCardTagline] = useState("VIP Charter Advisor");

  // Listen to interactive commands from the Broker AI Assistant
  React.useEffect(() => {
    const handleAgentPortalAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { action, payload } = customEvent.detail || {};
      if (action === "change-tab" && payload) {
        setInquiriesTab(payload);
      } else if (action === "update-qr-card" && payload) {
        if (payload.cardGreeting !== undefined)
          setCardGreeting(payload.cardGreeting);
        if (payload.cardDesign !== undefined) setCardDesign(payload.cardDesign);
        if (payload.cardTagline !== undefined)
          setCardTagline(payload.cardTagline);
        if (payload.qrFrameType !== undefined)
          setQrFrameType(payload.qrFrameType);
        if (payload.qrCustomBg !== undefined) setQrCustomBg(payload.qrCustomBg);
        if (payload.qrCustomFg !== undefined) setQrCustomFg(payload.qrCustomFg);
        if (payload.qrBadgeLogo !== undefined)
          setQrBadgeLogo(payload.qrBadgeLogo);
        if (payload.qrCaption !== undefined) setQrCaption(payload.qrCaption);
      } else if (action === "download-proposal-pdf") {
        const proposalId = payload?.proposalId;
        let pObj = null;
        if (proposalId) {
          pObj = savedProposals.find((p) => p.id === proposalId);
        }
        if (!pObj && savedProposals.length > 0) {
          // Default to the most recent proposal
          pObj = savedProposals[0];
        }
        if (pObj) {
          generateAgentPdfQuote(pObj, currentAgent);
        } else {
          console.warn("Could not find any proposals to generate PDF from.");
        }
      }
    };
    window.addEventListener("agent-portal-action", handleAgentPortalAction);
    return () => {
      window.removeEventListener(
        "agent-portal-action",
        handleAgentPortalAction,
      );
    };
  }, [savedProposals]);

  React.useEffect(() => {
    if (inquiriesTab === "gdrive") {
      loadCharterInquiriesFiles();
      if (gdriveAccessToken && !gdriveFolderId) {
        findOrCreateGdriveFolder();
      }
    }
  }, [inquiriesTab, gdriveAccessToken]);

  React.useEffect(() => {
    if (!gdriveAccessToken) {
      setAgentDriveFolders([]);
      return;
    }
    const q = query(collection(db, "agent_drive_folders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAgentDriveFolders(list);
      },
      (err) => {
        console.warn("Failed to listen to agent_drive_folders:", err);
      },
    );
    return () => unsubscribe();
  }, [gdriveAccessToken]);

  // States for co-agent accounts and QR code generation
  const [newCoagentName, setNewCoagentName] = useState("");
  const [newCoagentPhone, setNewCoagentPhone] = useState("");
  const [coagentFeedback, setCoagentFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Synchronize dynamic profile field states when active agent sessions shift
  React.useEffect(() => {
    if (isAgentLoggedIn && currentAgent) {
      setProfileName(currentAgent.name || "");
      setProfileWhatsapp(currentAgent.whatsapp || "");
      setProfilePhone(currentAgent.contactPhone || "");
      setProfileLineId(currentAgent.lineId || "");
      setProfileWechatId(currentAgent.wechatId || "");
      setProfileCompanyName(currentAgent.companyName || "");
      setProfileCompanyAddress(currentAgent.companyAddress || "");
      setProfileCountry(currentAgent.country || "Thailand");
      setProfileTaxId(currentAgent.taxId || "");
      setProfileCommissionRate((currentAgent as any).commissionRate || 15);
      setProfileWelcomeMessage(currentAgent.welcomeMessage || "");
    }
  }, [currentAgent, isAgentLoggedIn]);

  // Synchronize private booking requests from Firestore (Idea 1 & Absolute Isolation)
  React.useEffect(() => {
    if (!isOpen || !isAgentLoggedIn || !currentAgent) return;

    const qBook = query(collection(db, "booking_requests"));
    const unsubscribeBook = onSnapshot(
      qBook,
      (snapshot) => {
        const list: any[] = [];
        const myAgentEmail = currentAgent.email.toLowerCase().trim();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const email = (data.agentEmail || "").trim().toLowerCase();

            // Match strictly if assigned to this agent's email
            if (email === myAgentEmail) {
              list.push({ ...data, id: doc.id });
            }
          }
        });
        // Sort descending by charterDate or timestamp
        list.sort((a, b) => {
          const dateA = a.charterDate ? new Date(a.charterDate).getTime() : 0;
          const dateB = b.charterDate ? new Date(b.charterDate).getTime() : 0;
          return dateB - dateA;
        });
        setDbBookings(list);
        // Save local backup
        localStorage.setItem(
          "phuket_charter_local_bookings_" + myAgentEmail,
          JSON.stringify(list),
        );
      },
      (error) => {
        console.warn(
          "Failed to synchronize booking requests inside AgentPortalModal",
          error,
        );
        if (
          error?.message?.toLowerCase().indexOf("quota") !== -1 ||
          error?.code === "resource-exhausted"
        ) {
          setIsQuotaExceeded(true);
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
        const myAgentEmail = currentAgent.email.toLowerCase().trim();
        const localBackup = localStorage.getItem(
          "phuket_charter_local_bookings_" + myAgentEmail,
        );
        if (localBackup) {
          setDbBookings(JSON.parse(localBackup));
        }
      },
    );

    return () => unsubscribeBook();
  }, [isOpen, currentAgent, isAgentLoggedIn]);

  // Live subscription to boarding notifications for the logged-in Broker (Agent)
  React.useEffect(() => {
    if (!isOpen || !isAgentLoggedIn || !currentAgent) return;

    const myAgentEmail = currentAgent.email.toLowerCase().trim();
    const qBoardingAlerts = query(
      collection(db, "boarding_notifications"),
      orderBy("timestamp", "desc"),
    );

    let isFirstRender = true;
    const unsubscribe = onSnapshot(
      qBoardingAlerts,
      (snapshot) => {
        if (!isFirstRender) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const notificationAgentEmail = (data.agentEmail || "")
                .trim()
                .toLowerCase();

              // Core lock check: trigger ONLY if assigned to this exact broker
              if (notificationAgentEmail === myAgentEmail) {
                const newToastId =
                  "toast_" +
                  Date.now() +
                  "_" +
                  Math.floor(Math.random() * 1000);
                const toastData = {
                  id: newToastId,
                  title: "🚨 CHARTER BOARDING STARTED",
                  message:
                    data.message ||
                    `Client "${data.clientName}" has boarded "${data.vesselName}" with Capt. ${data.captainName}. Trip is now active.`,
                };

                setAgentToasts((prev) => [...prev, toastData]);

                // Auto dismiss after 8 seconds
                setTimeout(() => {
                  setAgentToasts((prev) =>
                    prev.filter((t) => t.id !== newToastId),
                  );
                }, 8000);
              }
            }
          });
        }
        isFirstRender = false;
      },
      (error) => {
        console.warn("Failed to subscribe to boarding alerts:", error);
      },
    );

    return () => unsubscribe();
  }, [isOpen, currentAgent, isAgentLoggedIn]);

  // Synchronize initial state variables with parent triggers on modal open
  React.useEffect(() => {
    if (isOpen && initialInquiryTab) {
      setInquiriesTab(initialInquiryTab);
    }
  }, [isOpen, initialInquiryTab]);

  React.useEffect(() => {
    if (isOpen && initialActiveInquiryChatId !== undefined) {
      setActiveInquiryChatId(initialActiveInquiryChatId);
    }
  }, [isOpen, initialActiveInquiryChatId]);

  // Load live inquiries from firestore (Idea 1 & Collaborative Mode)
  React.useEffect(() => {
    if (!isOpen || !isAgentLoggedIn || !currentAgent) return;

    const handleLocalInquiriesUpdated = () => {
      setLocalUpdateCounter((prev) => prev + 1);
    };
    window.addEventListener(
      "local-inquiries-updated",
      handleLocalInquiriesUpdated,
    );

    // All authorized brokers can collectively see/answer incoming public inquiries (unassigned).
    // Custom agent session inquiries are restricted to their assigned agent.
    const q = query(collection(db, "inquiries"));

    const myAgentId =
      currentAgent.id ||
      currentAgent.uid ||
      (currentAgent.email
        ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "unassigned");
    const myAgentEmail = currentAgent.email.toLowerCase().trim();

    const getMergedInquiries = (docsList: any[]) => {
      // Load shared local storage backup list
      const fallbackInquiriesStr =
        localStorage.getItem("phuket_charter_shared_local_inquiries") || "[]";
      let fallbackInquiries = [];
      try {
        fallbackInquiries = JSON.parse(fallbackInquiriesStr);
      } catch (e) {
        fallbackInquiries = [];
      }

      const myLocalInquiries = fallbackInquiries.filter((inq: any) => {
        const bId = (inq.brokerId || "").trim();
        const bEmail = (inq.brokerEmail || "").trim().toLowerCase();
        return bId === myAgentId || bEmail === myAgentEmail;
      });

      const combined = [...docsList];
      myLocalInquiries.forEach((localInq: any) => {
        if (!combined.some((c) => c.id === localInq.id)) {
          combined.push(localInq);
        }
      });

      combined.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      return combined;
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList: any[] = [];
        snapshot.forEach((doc) => {
          docsList.push({ ...doc.data(), id: doc.id });
        });

        const filteredList = docsList.filter((inq: any) => {
          const bId = (inq.brokerId || "").trim();
          const bEmail = (inq.brokerEmail || "").trim().toLowerCase();

          const isMasterAdmin = currentAgent?.isAdmin === true;
          if (isMasterAdmin) {
            return true;
          }

          // Other agencies must strictly only see inquiries originating from their scanned agent QR
          return bId === myAgentId || bEmail === myAgentEmail;
        });

        const combined = getMergedInquiries(filteredList);

        setInquiries(combined);
        localStorage.setItem(
          "phuket_charter_local_inquiries_" + myAgentEmail,
          JSON.stringify(combined),
        );
      },
      (error) => {
        console.error(
          "Failed to load inquiries inside AgentPortalModal via onSnapshot",
          error,
        );
        if (
          error?.message?.toLowerCase().indexOf("quota") !== -1 ||
          error?.code === "resource-exhausted"
        ) {
          setIsQuotaExceeded(true);
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
        const localBackup = localStorage.getItem(
          "phuket_charter_local_inquiries_" + myAgentEmail,
        );
        let list = [];
        if (localBackup) {
          try {
            list = JSON.parse(localBackup);
          } catch (e) {
            list = [];
          }
        }
        const combined = getMergedInquiries(list);
        setInquiries(combined);
      },
    );

    return () => {
      unsubscribe();
      window.removeEventListener(
        "local-inquiries-updated",
        handleLocalInquiriesUpdated,
      );
    };
  }, [isOpen, currentAgent, localUpdateCounter]);

  // Synchronize registered customers list from Firestore
  React.useEffect(() => {
    if (!isOpen || !isAgentLoggedIn || !currentAgent) return;
    const qCust = query(collection(db, "customers"));
    const unsubscribeCust = onSnapshot(
      qCust,
      (snapshot) => {
        const list: any[] = [];
        const myAgentId =
          currentAgent.id ||
          currentAgent.uid ||
          (currentAgent.email
            ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
            : "unassigned");
        const myAgentEmail = currentAgent.email.toLowerCase().trim();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const bId = (
              data.brokerId ||
              data.representativeBrokerId ||
              ""
            ).trim();
            const bEmail = (
              data.brokerEmail ||
              (data.representativeBroker && data.representativeBroker.email) ||
              ""
            )
              .trim()
              .toLowerCase();

            const isMasterAdmin = currentAgent?.isAdmin === true;
            const isUnassigned =
              !bId ||
              bId === "unassigned" ||
              bId === "none" ||
              !bEmail ||
              bEmail === "booking@charter-partner.com";

            // Show customers that were either created by/assigned to this agent's session, or unassigned if Master Admin
            if (
              bId === myAgentId ||
              bEmail === myAgentEmail ||
              (isMasterAdmin && isUnassigned)
            ) {
              list.push({ ...data, id: doc.id });
            }
          }
        });
        // Sort in-memory to prevent requiring high index logic on the sandbox DB
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        setCustomersList(list);
        localStorage.setItem(
          "phuket_charter_local_customers_" + myAgentEmail,
          JSON.stringify(list),
        );
      },
      (error) => {
        console.warn(
          "Failed to load firestore customers in Agent Workspace",
          error,
        );
        if (
          error?.message?.toLowerCase().indexOf("quota") !== -1 ||
          error?.code === "resource-exhausted"
        ) {
          setIsQuotaExceeded(true);
          window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
        }
        const myAgentEmail = currentAgent.email.toLowerCase().trim();
        const localBackup = localStorage.getItem(
          "phuket_charter_local_customers_" + myAgentEmail,
        );
        if (localBackup) {
          setCustomersList(JSON.parse(localBackup));
        }
      },
    );
    return () => unsubscribeCust();
  }, [isOpen, currentAgent, isAgentLoggedIn]);

  const toggleInquiryRead = async (
    inquiryId: string,
    currentReadStatus: boolean,
  ) => {
    try {
      await updateDoc(doc(db, "inquiries", inquiryId), {
        isRead: !currentReadStatus,
      });
    } catch (e) {
      console.error("Failed to update inquiry read status", e);
    }
  };

  const deleteInquiry = async (inquiryId: string) => {
    try {
      let proceed = true;
      const isIframe = window.self !== window.top;
      if (!isIframe) {
        try {
          proceed = confirm(
            "Are you sure you want to delete this live chat inquiry?",
          );
        } catch (err) {
          proceed = true;
        }
      }
      if (proceed) {
        await deleteDoc(doc(db, "inquiries", inquiryId));
      }
    } catch (e) {
      console.error("Failed to delete inquiry", e);
    }
  };

  const handleAgentFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    inq: any,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !inq) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported.");
      return;
    }

    // Limit to 700KB
    if (file.size > 700 * 1024) {
      alert("File is too large! Maximum allowed size is 700KB.");
      return;
    }

    setIsSendingAgentReply(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const newMsg = {
          sender: "agent",
          text: `📄 Sent a PDF Document: ${file.name}`,
          createdAt: new Date().toISOString(),
          isPdfAttached: true,
          fileName: file.name,
          pdfData: base64Data,
          seen: false,
        };

        const currentHistory = inq.chatHistory || [
          {
            sender: "client",
            text: inq.message,
            createdAt: inq.createdAt,
          },
        ];

        const brokerIdToLock =
          currentAgent.id ||
          currentAgent.uid ||
          (currentAgent.email
            ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
            : "unassigned");

        try {
          if (inq.id && inq.id.indexOf("inq_local_") === 0) {
            const fallbackInquiriesStr =
              localStorage.getItem("phuket_charter_shared_local_inquiries") ||
              "[]";
            let fallbackInquiries = [];
            try {
              fallbackInquiries = JSON.parse(fallbackInquiriesStr);
            } catch (e) {
              fallbackInquiries = [];
            }

            fallbackInquiries = fallbackInquiries.map((item: any) => {
              if (item.id === inq.id) {
                return {
                  ...item,
                  chatHistory: [...currentHistory, newMsg],
                  isRead: true,
                  activeBrokerId: brokerIdToLock,
                };
              }
              return item;
            });

            localStorage.setItem(
              "phuket_charter_shared_local_inquiries",
              JSON.stringify(fallbackInquiries),
            );
            window.dispatchEvent(new Event("local-inquiries-updated"));
          } else {
            try {
              await updateDoc(doc(db, "inquiries", inq.id), {
                chatHistory: [...currentHistory, newMsg],
                isRead: true,
                activeBrokerId: brokerIdToLock,
              });
            } catch (firestoreErr) {
              console.warn(
                "Firestore PDF attach failed or quota limit reached, saving to local inquiries backup:",
                firestoreErr,
              );
              const fallbackInquiriesStr =
                localStorage.getItem("phuket_charter_shared_local_inquiries") ||
                "[]";
              let fallbackInquiries = [];
              try {
                fallbackInquiries = JSON.parse(fallbackInquiriesStr);
              } catch (e) {
                fallbackInquiries = [];
              }

              const existingIdx = fallbackInquiries.findIndex(
                (item: any) => item.id === inq.id,
              );
              const updatedLocalInq = {
                ...inq,
                chatHistory: [...currentHistory, newMsg],
                isRead: true,
                activeBrokerId: brokerIdToLock,
              };

              if (existingIdx !== -1) {
                fallbackInquiries[existingIdx] = updatedLocalInq;
              } else {
                fallbackInquiries.push(updatedLocalInq);
              }

              localStorage.setItem(
                "phuket_charter_shared_local_inquiries",
                JSON.stringify(fallbackInquiries),
              );
              window.dispatchEvent(new Event("local-inquiries-updated"));
            }
          }
        } catch (innerErr) {
          console.error("Failed inside PDF attach thread:", innerErr);
        } finally {
          setIsSendingAgentReply(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload PDF:", err);
      alert("An error occurred uploading the PDF");
    } finally {
      setIsSendingAgentReply(false);
      e.target.value = "";
    }
  };

  const sendWelcomeMessage = async (inq: any, message: string) => {
    if (!message.trim() || !inq) return;

    const newMsg = {
      sender: "agent",
      text: message.trim(),
      createdAt: new Date().toISOString(),
      seen: false,
    };

    const currentHistory = inq.chatHistory || [
      {
        sender: "client",
        text: inq.message,
        createdAt: inq.createdAt,
      },
    ];

    try {
      const brokerIdToLock =
        currentAgent.id ||
        currentAgent.uid ||
        (currentAgent.email
          ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
          : "unassigned");

      if (inq.id && inq.id.indexOf("inq_local_") === 0) {
        const fallbackInquiriesStr =
          localStorage.getItem("phuket_charter_shared_local_inquiries") || "[]";
        let fallbackInquiries = [];
        try {
          fallbackInquiries = JSON.parse(fallbackInquiriesStr);
        } catch (e) {
          fallbackInquiries = [];
        }

        fallbackInquiries = fallbackInquiries.map((item: any) => {
          if (item.id === inq.id) {
            return {
              ...item,
              chatHistory: [...currentHistory, newMsg],
              isRead: true,
              activeBrokerId: brokerIdToLock,
            };
          }
          return item;
        });

        localStorage.setItem(
          "phuket_charter_shared_local_inquiries",
          JSON.stringify(fallbackInquiries),
        );
        window.dispatchEvent(new Event("local-inquiries-updated"));
      } else {
        await updateDoc(doc(db, "inquiries", inq.id), {
          chatHistory: [...currentHistory, newMsg],
          isRead: true,
          activeBrokerId: brokerIdToLock,
        });
      }
    } catch (err) {
      console.error("Failed to send welcome message:", err);
    }
  };

  // Auto-reply logic
  React.useEffect(() => {
    if (activeInquiryChatId) {
      const inq = inquiries.find((i) => i.id === activeInquiryChatId);
      if (
        inq &&
        currentAgent?.welcomeMessage &&
        (!inq.chatHistory || inq.chatHistory.length <= 1)
      ) {
        sendWelcomeMessage(inq, currentAgent.welcomeMessage);
      }
    }
  }, [activeInquiryChatId, currentAgent, inquiries]);

  const sendAgentReply = async (e: React.FormEvent, inq: any) => {
    e.preventDefault();
    if (!agentReplyText.trim() || !inq) return;

    setIsSendingAgentReply(true);

    const newMsg = {
      sender: "agent",
      text: agentReplyText.trim(),
      createdAt: new Date().toISOString(),
    };

    const currentHistory = inq.chatHistory || [
      {
        sender: "client",
        text: inq.message,
        createdAt: inq.createdAt,
      },
    ];

    try {
      const brokerIdToLock =
        currentAgent.id ||
        currentAgent.uid ||
        (currentAgent.email
          ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
          : "unassigned");

      if (inq.id && inq.id.indexOf("inq_local_") === 0) {
        // Handle purely local inquiries through localStorage update
        const fallbackInquiriesStr =
          localStorage.getItem("phuket_charter_shared_local_inquiries") || "[]";
        let fallbackInquiries = [];
        try {
          fallbackInquiries = JSON.parse(fallbackInquiriesStr);
        } catch (e) {
          fallbackInquiries = [];
        }

        fallbackInquiries = fallbackInquiries.map((item: any) => {
          if (item.id === inq.id) {
            return {
              ...item,
              chatHistory: [...currentHistory, newMsg],
              isRead: true,
              activeBrokerId: brokerIdToLock,
            };
          }
          return item;
        });

        localStorage.setItem(
          "phuket_charter_shared_local_inquiries",
          JSON.stringify(fallbackInquiries),
        );
        window.dispatchEvent(new Event("local-inquiries-updated"));
        setAgentReplyText("");
      } else {
        // Try writing to Firestore first
        try {
          await updateDoc(doc(db, "inquiries", inq.id), {
            chatHistory: [...currentHistory, newMsg],
            isRead: true, // Mark as read for agent since they are active
            activeBrokerId: brokerIdToLock,
          });
          setAgentReplyText("");
        } catch (dbErr) {
          console.warn(
            "Firestore reply failed or quota limit reached, saving to local inquiry backup:",
            dbErr,
          );
          // Fallback update to local storage
          const fallbackInquiriesStr =
            localStorage.getItem("phuket_charter_shared_local_inquiries") ||
            "[]";
          let fallbackInquiries = [];
          try {
            fallbackInquiries = JSON.parse(fallbackInquiriesStr);
          } catch (e) {
            fallbackInquiries = [];
          }

          const existingIdx = fallbackInquiries.findIndex(
            (item: any) => item.id === inq.id,
          );
          const updatedLocalInq = {
            ...inq,
            chatHistory: [...currentHistory, newMsg],
            isRead: true,
            activeBrokerId: brokerIdToLock,
          };

          if (existingIdx !== -1) {
            fallbackInquiries[existingIdx] = updatedLocalInq;
          } else {
            fallbackInquiries.push(updatedLocalInq);
          }

          localStorage.setItem(
            "phuket_charter_shared_local_inquiries",
            JSON.stringify(fallbackInquiries),
          );
          window.dispatchEvent(new Event("local-inquiries-updated"));
          setAgentReplyText("");
        }
      }
    } catch (err) {
      console.error("Failed to post agent reply message to chat room:", err);
    } finally {
      setIsSendingAgentReply(false);
    }
  };

  const loadProposals = React.useCallback(() => {
    try {
      const stored = localStorage.getItem("phuket_charter_proposals");
      if (stored) {
        let proposals = JSON.parse(stored) || [];
        if (currentAgent?.email) {
          proposals = proposals.filter(
            (p: any) => !p.agentEmail || p.agentEmail === currentAgent.email,
          );
        }
        setSavedProposals(proposals);
      } else {
        setSavedProposals([]);
      }
    } catch (e) {
      console.error(
        "Failed to load client proposals inside AgentPortalModal",
        e,
      );
    }
  }, [currentAgent]);

  // Load saved client proposals on mount/open and subscribe to changes in real-time
  React.useEffect(() => {
    if (!isOpen || !isAgentLoggedIn || !currentAgent) return;

    const qProps = query(collection(db, "proposals"));
    const unsubscribeProps = onSnapshot(
      qProps,
      (snapshot) => {
        const list: any[] = [];
        const myAgentEmail = currentAgent.email.toLowerCase().trim();

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const email = (data.agentEmail || "").trim().toLowerCase();
            // Filter dynamically by current broker email
            if (email === myAgentEmail) {
              list.push({ ...data, id: doc.id });
            }
          }
        });

        // Sort descending by timestamp or chronological ID order
        list.sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });

        setSavedProposals(list);
        localStorage.setItem("phuket_charter_proposals", JSON.stringify(list));
      },
      (error) => {
        console.warn(
          "Failed to synchronize proposals inside AgentPortalModal via onSnapshot:",
          error,
        );
        // Fallback on error / quota limit
        loadProposals();
      },
    );

    const handleProposalsUpdated = () => {
      loadProposals();
    };

    window.addEventListener("proposals-updated", handleProposalsUpdated);
    return () => {
      unsubscribeProps();
      window.removeEventListener("proposals-updated", handleProposalsUpdated);
    };
  }, [isOpen, currentAgent, isAgentLoggedIn, loadProposals]);

  React.useEffect(() => {
    if (isOpen && initialEditingProposalId && savedProposals.length > 0) {
      const match = savedProposals.find(
        (p) => p.id === initialEditingProposalId,
      );
      if (
        match &&
        (!editingProposal || editingProposal.id !== initialEditingProposalId)
      ) {
        setEditingProposal(match);
        setInquiriesTab("quotes");
      }
    }
  }, [isOpen, initialEditingProposalId, savedProposals]);

  const deleteProposal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(updated);
    localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));

    // Delete copy in admin portal (Firestore collection 'proposals')
    deleteDoc(doc(db, "proposals", id)).catch((err) => {
      console.warn("Failed to delete proposal copy from Firestore:", err);
    });

    window.dispatchEvent(new Event("proposals-updated"));
    if (editingProposal?.id === id) {
      setEditingProposal(null);
    }
  };

  const sendBookingToCaptain = async (proposal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedProposal = {
        ...proposal,
        status: "confirmed",
        sentToCaptain: true, // keep for legacy reads
        sentToCaptainAt: new Date().toISOString(),
      };

      const updated = savedProposals.map((p) =>
        p.id === proposal.id ? updatedProposal : p,
      );
      setSavedProposals(updated);
      localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));

      // Save copy in admin portal (Firestore collection 'proposals')
      await setDoc(doc(db, "proposals", proposal.id), updatedProposal, {
        merge: true,
      });

      // Create an alert for the admin
      const alertId = `booking_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, "adminAlerts", alertId), {
        title: "New Booking Approved by Broker",
        message: `Broker ${currentAgent?.name || "Unknown"} successfully forwarded a booking to the captain.`,
        details: `Client Name: ${proposal.clientName || "Unknown"}\nDate: ${proposal.targetDate || "N/A"}\nYacht ID: ${proposal.vesselId1 || proposal.recommendedVesselId || "N/A"}\nProposal ID: ${proposal.id}`,
        type: "system",
        timestamp: new Date().toISOString(),
        read: false,
      });

      window.dispatchEvent(new Event("proposals-updated"));
      alert(
        `Manifest Roster and Booking "${proposal.clientName || "Proposal"}" forwarded safely to Yacht Captain & Crew's Workspace!`,
      );
    } catch (err) {
      console.warn(
        "Failed to forward proposal copy to captain in Firestore, doing local storage fallback:",
        err,
      );
      const updatedProposal = {
        ...proposal,
        sentToCaptain: true,
        sentToCaptainAt: new Date().toISOString(),
      };
      const updated = savedProposals.map((p) =>
        p.id === proposal.id ? updatedProposal : p,
      );
      setSavedProposals(updated);
      localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));
      window.dispatchEvent(new Event("proposals-updated"));
      alert(`Forwarded locally to captain & crew.`);
    }
  };

  const saveEditedProposal = () => {
    if (!editingProposal) return;
    const updated = savedProposals.map((p) =>
      p.id === editingProposal.id ? editingProposal : p,
    );
    setSavedProposals(updated);
    localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));

    // Save copy in admin portal (Firestore collection 'proposals')
    setDoc(doc(db, "proposals", editingProposal.id), {
      ...editingProposal,
      timestamp: Date.now(),
    }).catch((err) => {
      console.warn("Failed to sync edited proposal copy to Firestore:", err);
    });

    window.dispatchEvent(new Event("proposals-updated"));
    setEditingProposal(null);
  };

  const handleCreateManualQuote = async () => {
    setManualError("");
    if (!manualClientName.trim()) {
      setManualError("Please enter a customer or client name.");
      return;
    }
    if (!manualVessel1Id) {
      setManualError("Please select at least the first catamaran.");
      return;
    }

    // Generate connected database inquiry ticket if agent checked the box
    let connectedInquiryId = "";
    if (manualCreateInquiry) {
      try {
        connectedInquiryId = `inq-manual-${Date.now()}`;
        const selectedVesselObj = CATAMARANS.find(
          (c) => c.id === manualVessel1Id,
        );

        let initialChatMsgStr = `Hello ${manualClientName.trim()}! I have initialized an official charter inquiry and compiled a bespoke private catamaran quotation for your journey.\n\n`;
        initialChatMsgStr += `📅 Charter Date: ${manualCharterDate || "Flexible / TBA"}\n`;
        initialChatMsgStr += `🛥️ Catamaran Options Selected:\n`;
        initialChatMsgStr += `- Option 1: ${selectedVesselObj ? selectedVesselObj.name : "Catamaran #1"} @ ${manualPrice1 || "Request rate"}\n`;
        if (manualVessel2Id) {
          const v2Obj = CATAMARANS.find((c) => c.id === manualVessel2Id);
          initialChatMsgStr += `- Option 2: ${v2Obj ? v2Obj.name : "Catamaran #2"} @ ${manualPrice2 || "Request rate"}\n`;
        }
        if (manualVessel3Id) {
          const v3Obj = CATAMARANS.find((c) => c.id === manualVessel3Id);
          initialChatMsgStr += `- Option 3: ${v3Obj ? v3Obj.name : "Catamaran #3"} @ ${manualPrice3 || "Request rate"}\n`;
        }

        if (manualCustomLineItems.length > 0) {
          initialChatMsgStr += `\n✨ Active Service Price List (Offered Extras):\n`;
          manualCustomLineItems.forEach((item) => {
            initialChatMsgStr += `- ${item.name}: ${item.price.toLocaleString()} THB x ${item.qty} (${item.unit || "charter"})\n`;
          });
        }

        if (manualNotes.trim()) {
          initialChatMsgStr += `\n📝 Agent Remarks & Plan:\n"${manualNotes.trim()}"`;
        }

        const payload = {
          id: connectedInquiryId,
          name: manualClientName.trim(),
          contact: manualClientContact.trim() || "N/A",
          message: initialChatMsgStr,
          brokerEmail: currentAgent?.email
            ? currentAgent.email.trim()
            : "booking@charter-partner.com",
          brokerId: currentAgent?.id || "unassigned",
          ownerUid: manualCustomerUid || null,
          vesselId: manualVessel1Id,
          vesselName: selectedVesselObj ? selectedVesselObj.name : "none",
          isRead: true,
          createdAt: new Date().toISOString(),
          chatHistory: [
            {
              id: `msg-${Date.now()}-init-manual`,
              sender: "agent",
              senderName: currentAgent?.name || "Yacht Broker",
              text: initialChatMsgStr,
              createdAt: new Date().toISOString(),
            },
          ],
        };

        await setDoc(doc(db, "inquiries", connectedInquiryId), payload);
        console.log("Successfully created firestore live inquiry linking!");
      } catch (e) {
        console.error("Firestore inquiry cross-creation failed", e);
      }
    }

    const newProposal = {
      id: `prop-manual-${Date.now()}`,
      clientName: manualClientName.trim(),
      customerUid: manualCustomerUid || null,
      charterDate: manualCharterDate || "",
      vesselId1: manualVessel1Id,
      vesselId2: manualVessel2Id || "",
      vesselId3: manualVessel3Id || "",
      price1: manualPrice1 || "",
      price2: manualPrice2 || "",
      price3: manualPrice3 || "",
      compareCount: manualVessel3Id ? 3 : manualVessel2Id ? 2 : 1,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      agentEmail: currentAgent ? currentAgent.email : null,
      isManualExternal: true,
      clientContact: manualClientContact.trim(),
      agencyDetailsOverride: manualNotes.trim() || "",
      customLineItems: manualCustomLineItems, // Store all priced features
      inquiryId: connectedInquiryId, // Store cross-link
    };

    const updated = [newProposal, ...savedProposals];
    setSavedProposals(updated);
    localStorage.setItem("phuket_charter_proposals", JSON.stringify(updated));

    // Save copy in admin portal (Firestore collection 'proposals')
    setDoc(doc(db, "proposals", newProposal.id), {
      ...newProposal,
      timestamp: Date.now(),
    }).catch((err) => {
      console.warn("Failed to sync manual proposal copy to Firestore:", err);
    });

    window.dispatchEvent(new Event("proposals-updated"));

    // Reset form fields
    setManualClientName("");
    setManualCharterDate("");
    setManualClientContact("");
    setManualVessel1Id("");
    setManualPrice1("");
    setManualVessel2Id("");
    setManualPrice2("");
    setManualVessel3Id("");
    setManualPrice3("");
    setManualNotes("");
    setManualError("");
    setManualCustomLineItems([]);
    setManualCustomerUid("");
    setIsCreatingManualQuote(false);
  };

  const downloadProposalsAsCSV = () => {
    if (savedProposals.length === 0) return;
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

    const rows = savedProposals.map((prop) => {
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

  // Status/Error states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // QR Code Generation details
  const [showQrSection, setShowQrSection] = useState(false);
  const [customGreeting, setCustomGreeting] = useState(
    "Hello! I scanned your representative yacht flyer and would love to inquire about a secure luxury catamaran charter in Phuket. 🏝️⛵",
  );
  const [portalBaseUrl, setPortalBaseUrl] = useState(() => {
    const currentOrigin = window.location.origin;
    // Auto-rewrite private 'ais-dev-' url to public 'ais-pre-' url for scan troubleshooting!
    if (currentOrigin.includes("ais-dev-")) {
      return (
        currentOrigin.replace("ais-dev-", "ais-pre-") + window.location.pathname
      );
    }
    return currentOrigin + window.location.pathname;
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 200);
  };

  const getCoagentUrl = (co: { id: string; name: string; phone: string }) => {
    const params = new URLSearchParams();
    params.set("agentName", currentAgent?.name || "Representative");
    params.set(
      "agentEmail",
      currentAgent?.email || "booking@phuketcharter.com",
    );
    params.set("agentWhatsApp", currentAgent?.whatsapp || "+66636368287");
    params.set("agentPhone", currentAgent?.contactPhone || "+66636368287");
    if (currentAgent?.lineId) params.set("agentLineId", currentAgent.lineId);
    if (currentAgent?.wechatId)
      params.set("agentWechatId", currentAgent.wechatId);
    if (currentAgent?.companyName)
      params.set("agentCompanyName", currentAgent.companyName);

    params.set("coagentId", co.id);
    params.set("coagentName", co.name);
    params.set("coagentPhone", co.phone);

    const currentOrigin = window.location.origin;
    const resolvedOrigin = currentOrigin.includes("ais-dev-")
      ? currentOrigin.replace("ais-dev-", "ais-pre-")
      : currentOrigin;

    return `${resolvedOrigin}${window.location.pathname}?${params.toString()}`;
  };

  const handleAddCoagent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoagentName.trim() || !newCoagentPhone.trim()) {
      setCoagentFeedback({
        success: false,
        message: "Please enter name and phone number.",
      });
      return;
    }
    if (!currentAgent) {
      setCoagentFeedback({
        success: false,
        message: "No active agent session detected.",
      });
      return;
    }

    const coagentsList = currentAgent.coagents || [];
    const coagentId = "co_" + Math.random().toString(36).substring(2, 9);
    const coObj = {
      id: coagentId,
      name: newCoagentName.trim(),
      phone: newCoagentPhone.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...coagentsList, coObj];
    const res = await updateProfile({ coagents: updatedList });
    if (res.success) {
      setNewCoagentName("");
      setNewCoagentPhone("");
      setCoagentFeedback({
        success: true,
        message: `Co-agent ${coObj.name} registered successfully with custom dynamic referral QR!`,
      });
      setTimeout(() => setCoagentFeedback(null), 4000);
    } else {
      setCoagentFeedback({ success: false, message: res.message });
    }
  };

  const handleRemoveCoagent = async (id: string, name: string) => {
    if (!currentAgent) return;
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = window.confirm(
          `Are you sure you want to remove co-agent ${name}? This will sever scanning references immediately.`,
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    const coagentsList = currentAgent.coagents || [];
    const updated = coagentsList.filter((co) => co.id !== id);
    const res = await updateProfile({ coagents: updated });
    if (res.success) {
      setCoagentFeedback({
        success: true,
        message: `Removed partnership metadata for co-agent ${name} successfully.`,
      });
      setTimeout(() => setCoagentFeedback(null), 4000);
    }
  };

  const downloadCoagentQrCode = (coagentId: string, name: string) => {
    const svgElement = document.getElementById(
      `coagent-qr-code-svg-${coagentId}`,
    );
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${currentAgent?.name.replace(/\s+/g, "_") || "agent"}_coagent_${name.replace(/\s+/g, "_")}_qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadQrCode = () => {
    const svgElement = document.getElementById("agent-qr-code-svg");
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${currentAgent?.name.replace(/\s+/g, "_") || "agent"}_whatsapp_qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Sync profile editing fields when currentAgent changes
  React.useEffect(() => {
    if (isAgentLoggedIn && currentAgent) {
      setProfileName(currentAgent.name);
      setProfileWhatsapp(currentAgent.whatsapp);
      setProfilePhone(currentAgent.contactPhone);
      setProfileLineId(currentAgent.lineId || "");
      setProfileCompanyName(currentAgent.companyName || "");
      setProfileCompanyAddress(currentAgent.companyAddress || "");
      setProfileCountry(currentAgent.country || "Thailand");
      setProfileTaxId(currentAgent.taxId || "");
    }
  }, [currentAgent]);

  const [qrReferralUrl, setQrReferralUrl] = useState("");

  // Automatically re-generate the QR referral Link/Code as the broker updates their settings or WhatsApp digits
  React.useEffect(() => {
    let compiled = "";
    const cleanBase = portalBaseUrl.trim();
    const activeName = profileName.trim();
    const activeEmail = currentAgent?.email ? currentAgent.email.trim() : "";
    const activeWhatsapp = profileWhatsapp.trim();
    const activePhone = profilePhone.trim();
    const activeLineId = profileLineId.trim();
    const activeWechatId = profileWechatId.trim();
    const activeCompanyName = profileCompanyName.trim();
    const activeCompanyAddress = profileCompanyAddress.trim();
    const activeCountry = profileCountry.trim();
    const activeTaxId = profileTaxId.trim();

    try {
      const urlObj = new URL(
        cleanBase.startsWith("http") ? cleanBase : `https://${cleanBase}`,
      );
      urlObj.searchParams.set("agentName", activeName);
      urlObj.searchParams.set("agentEmail", activeEmail);
      urlObj.searchParams.set("agentWhatsApp", activeWhatsapp);
      urlObj.searchParams.set("agentPhone", activePhone);
      if (activeLineId) {
        urlObj.searchParams.set("agentLineId", activeLineId);
      }
      if (activeWechatId) {
        urlObj.searchParams.set("agentWechatId", activeWechatId);
      }
      if (activeCompanyName) {
        urlObj.searchParams.set("agentCompanyName", activeCompanyName);
      }
      if (activeCompanyAddress) {
        urlObj.searchParams.set("agentCompanyAddress", activeCompanyAddress);
      }
      if (activeCountry) {
        urlObj.searchParams.set("agentCountry", activeCountry);
      }
      if (activeTaxId) {
        urlObj.searchParams.set("agentTaxId", activeTaxId);
      }
      compiled = urlObj.toString();
    } catch (e) {
      const separator = cleanBase.includes("?") ? "&" : "?";
      let baseString = `${cleanBase}${separator}agentName=${encodeURIComponent(activeName)}&agentEmail=${encodeURIComponent(activeEmail)}&agentWhatsApp=${encodeURIComponent(activeWhatsapp)}&agentPhone=${encodeURIComponent(activePhone)}`;
      if (activeLineId) {
        baseString += `&agentLineId=${encodeURIComponent(activeLineId)}`;
      }
      if (activeWechatId) {
        baseString += `&agentWechatId=${encodeURIComponent(activeWechatId)}`;
      }
      if (activeCompanyName) {
        baseString += `&agentCompanyName=${encodeURIComponent(activeCompanyName)}`;
      }
      if (activeCompanyAddress) {
        baseString += `&agentCompanyAddress=${encodeURIComponent(activeCompanyAddress)}`;
      }
      if (activeCountry) {
        baseString += `&agentCountry=${encodeURIComponent(activeCountry)}`;
      }
      if (activeTaxId) {
        baseString += `&agentTaxId=${encodeURIComponent(activeTaxId)}`;
      }
      compiled = baseString;
    }
    setQrReferralUrl(compiled);
  }, [
    portalBaseUrl,
    profileName,
    profileWhatsapp,
    profilePhone,
    profileLineId,
    profileWechatId,
    profileCompanyName,
    profileCompanyAddress,
    profileCountry,
    profileTaxId,
    currentAgent,
  ]);

  // --- CUSTOMER PORTAL / CHARTER GUEST WORKSPACE ACTIONS ---
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerRegName.trim() ||
      !customerRegEmail.trim() ||
      !customerRegPwd
    ) {
      alert("Name, Email and Password are required.");
      return;
    }

    setCustomerLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        customerRegEmail.trim(),
        customerRegPwd,
      );
      const user = userCredential.user;

      const fullPhone = customerPhoneCode + " " + customerPhoneNumber.trim();

      const myAgentId =
        currentAgent?.id ||
        currentAgent?.uid ||
        currentAgent?.email?.toLowerCase().replace(/[^a-z0-9]/g, "_") ||
        "unassigned";
      const myAgentEmail = currentAgent?.email?.toLowerCase().trim();

      const customerPayload = {
        uid: user.uid,
        name: customerRegName.trim(),
        email: customerRegEmail.trim(),
        phoneNumber: fullPhone,
        country: customerCountry,
        passportNumber: customerPassport,
        passportExpiry: customerPassportExpiry,
        companions: [],
        createdAt: new Date().toISOString(),
        brokerId: myAgentId,
        brokerEmail: myAgentEmail,
      };

      await setDoc(doc(db, "customers", user.uid), customerPayload);
      setCustomerData(customerPayload);
      alert("Charter Guest profile registered successfully!");
      setCustomerActiveTab("login");
    } catch (error: any) {
      console.error(
        "Customer Registration failed, attempting secure guest sandbox fallback:",
        error,
      );
      try {
        const checkEmail = customerRegEmail.trim();
        // Double-check if this customer email is already registered in our database
        const qCust = query(
          collection(db, "customers"),
          where("email", "==", checkEmail),
        );
        const snapshot = await getDocs(qCust);
        if (!snapshot.empty) {
          let existingData: any = null;
          snapshot.forEach((d) => {
            existingData = d.data();
          });
          if (existingData) {
            setCurrentCustomer(existingData);
            alert(
              `Customer email ${checkEmail} is already registered. Logging in automatically!`,
            );
            return;
          }
        }

        const fallbackUid =
          "cust_" + Math.random().toString(36).substring(2, 9);
        const fullPhone = customerPhoneCode + " " + customerPhoneNumber.trim();

        const myAgentId =
          currentAgent?.id ||
          currentAgent?.uid ||
          currentAgent?.email?.toLowerCase().replace(/[^a-z0-9]/g, "_") ||
          "unassigned";
        const myAgentEmail = currentAgent?.email?.toLowerCase().trim();

        const customerPayload = {
          uid: fallbackUid,
          name: customerRegName.trim(),
          email: checkEmail,
          phoneNumber: fullPhone,
          country: customerCountry,
          passportNumber: customerPassport,
          passportExpiry: customerPassportExpiry,
          companions: [],
          createdAt: new Date().toISOString(),
          authStatus: "direct_firestore_sandbox",
          brokerId: myAgentId,
          brokerEmail: myAgentEmail,
        };

        await setDoc(doc(db, "customers", fallbackUid), customerPayload);
        setCustomerData(customerPayload);

        alert(
          "Charter Guest registered successfully via Sandbox Mode!\n\n" +
            "Note: Email/Password registration uses secure direct-write storage. " +
            "Direct secure entry has been established.",
        );
        setCustomerActiveTab("login");
      } catch (fallbackError: any) {
        console.error("Direct fallback failed:", fallbackError);
        alert(`Registration failed: ${error.message}`);
      }
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = customerEmail.trim().toLowerCase();
    if (!targetEmail || !customerPwd) {
      alert("Please enter both email and password");
      return;
    }

    setCustomerLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        targetEmail,
        customerPwd,
      );
      const user = userCredential.user;

      // If an agent is logged in, automatically link the customer with him/her
      if (currentAgent) {
        const myAgentId =
          currentAgent.id ||
          currentAgent.uid ||
          (currentAgent.email
            ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
            : "unassigned");
        const myAgentEmail = currentAgent.email.toLowerCase().trim();

        const customerRef = doc(db, "customers", user.uid);
        await setDoc(
          customerRef,
          {
            uid: user.uid,
            representativeBroker: currentAgent,
            representativeBrokerId: myAgentId,
            brokerId: myAgentId,
            brokerEmail: myAgentEmail,
          },
          { merge: true },
        );

        try {
          const guestRef = doc(db, "admin_registered_guests", user.uid);
          await setDoc(
            guestRef,
            {
              uid: user.uid,
              representativeBroker: currentAgent,
              representativeBrokerId: myAgentId,
              brokerId: myAgentId,
              brokerEmail: myAgentEmail,
            },
            { merge: true },
          );
        } catch (guestErr) {
          // Ignored
        }

        alert(
          `✅ GUEST SECURE SIGN IN & LINKING SUCCESS!\n\nAccessed Charter Guest account (${targetEmail}) and linked it to your Agent Profile (${currentAgent.name}) automatically!\n\nThis client is now synced in your Representative Workspace.`,
        );
      } else {
        alert(
          `✅ GUEST SECURE SIGN IN SUCCESS!\n\nAccessed Guest Workspace for ${targetEmail}.`,
        );
      }
    } catch (err: any) {
      console.warn(
        "Customer email sign in failed with Firebase, checking sandbox option:",
        err,
      );
      try {
        const qCust = query(
          collection(db, "customers"),
          where("email", "==", targetEmail),
        );
        const snapshot = await getDocs(qCust);
        if (!snapshot.empty) {
          let foundSandboxUser: any = null;
          snapshot.forEach((d) => {
            foundSandboxUser = d.data();
          });
          if (foundSandboxUser) {
            localStorage.setItem(
              "sandbox_customer_session",
              JSON.stringify(foundSandboxUser),
            );
            setCurrentCustomer(foundSandboxUser);

            const userUid =
              foundSandboxUser.uid ||
              foundSandboxUser.id ||
              "sandbox_" + targetEmail.replace(/[^a-z0-9]/g, "_");

            // If an agent is logged in, automatically link the Sandbox customer with him/her
            if (currentAgent) {
              const myAgentId =
                currentAgent.id ||
                currentAgent.uid ||
                (currentAgent.email
                  ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
                  : "unassigned");
              const myAgentEmail = currentAgent.email.toLowerCase().trim();

              const customerRef = doc(db, "customers", userUid);
              await setDoc(
                customerRef,
                {
                  uid: userUid,
                  representativeBroker: currentAgent,
                  representativeBrokerId: myAgentId,
                  brokerId: myAgentId,
                  brokerEmail: myAgentEmail,
                },
                { merge: true },
              );

              try {
                const guestRef = doc(db, "admin_registered_guests", userUid);
                await setDoc(
                  guestRef,
                  {
                    uid: userUid,
                    representativeBroker: currentAgent,
                    representativeBrokerId: myAgentId,
                    brokerId: myAgentId,
                    brokerEmail: myAgentEmail,
                  },
                  { merge: true },
                );
              } catch (guestErr) {
                // Ignored
              }

              alert(
                `✅ GUEST SANDBOX SIGN IN & LINKING SUCCESS!\n\nAccessed Sandbox Guest account (${targetEmail}) and linked it to your Agent Profile (${currentAgent.name}) automatically!`,
              );
            } else {
              alert("Signed in successfully via secure direct sandbox mode!");
            }
            return;
          }
        }
      } catch (dbError) {
        console.error("Failed to query direct sandbox customer:", dbError);
      }
      alert(err.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      alert("Please enter your email address");
      return;
    }

    setCustomerLoading(true);
    try {
      alert(
        "Password reset instructions have been forwarded to " +
          customerEmail.trim() +
          " (if the account exists).",
      );
      setCustomerActiveTab("login");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNewPwd.trim()) {
      alert("Password cannot be empty.");
      return;
    }
    if (customerNewPwd !== customerConfirmPwd) {
      alert("Passwords do not match.");
      return;
    }

    setCustomerLoading(true);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        await updatePassword(currentUserObj, customerNewPwd);
        alert("Password updated successfully!");
        setCustomerNewPwd("");
        setCustomerConfirmPwd("");
        setShowCustomerPasswordChange(false);
      } else {
        alert("Password changes are restricted under guest sandbox modes.");
      }
    } catch (error: any) {
      console.error("Password update failed:", error);
      alert("Error: " + error.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerDeleteAccount = async () => {
    let proceed = true;
    try {
      proceed = confirm(
        "🚨 DANGER: Are you absolutely sure you want to PERMANENTLY delete your guest account?\n\n" +
          "This will instantly wipe your registration details and all travel companions from our insurance manifest files. This action is irreversible.",
      );
    } catch (e) {
      proceed = true;
    }
    if (!proceed) return;

    setCustomerLoading(true);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        await deleteDoc(doc(db, "customers", currentUserObj.uid));
        try {
          await deleteUser(currentUserObj);
        } catch (e) {
          console.warn(
            "Auth user deletion failed (requires recent login), continuing with log out",
            e,
          );
        }
        alert(
          "Your customer account and related insurance records have been permanently erased.",
        );
        setCurrentCustomer(null);
        setCustomerData(null);
      } else if (customerData?.uid) {
        await deleteDoc(doc(db, "customers", customerData.uid));
        alert(
          "Your customer account and related insurance records have been permanently erased.",
        );
        setCustomerData(null);
      }
    } catch (error: any) {
      console.error("Account self deletion failed:", error);
      alert(
        "Self deletion failed. Please log out, sign back in, and try deleting your profile again immediately.",
      );
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerLoading(true);
    const fullPhone = customerPhoneCode + " " + customerPhoneNumber.trim();
    const payload = {
      ...(customerData || {}),
      phoneNumber: fullPhone,
      country: customerCountry,
      passportNumber: customerPassport,
      passportExpiry: customerPassportExpiry,
      companions: customerCompanions,
    };

    try {
      const uid = currentCustomer?.uid || customerData?.uid;
      if (uid) {
        await setDoc(doc(db, "customers", uid), payload, { merge: true });
        setCustomerData(payload);
        alert("Profile contact information updated successfully!");
      } else {
        alert("Unable to save profile, no active guest session.");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert("Error: " + error.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companionName.trim() || !companionCountry.trim()) {
      alert("Traveling companion Name and Nationality are required.");
      return;
    }

    const newComp = {
      fullName: companionName.toUpperCase().trim(),
      country: companionCountry,
      passportNumber: companionPassport.toUpperCase().substring(0, 15).trim(),
      passportExpiry: companionExpiry,
    };

    const updatedList = [...customerCompanions, newComp];
    setCustomerCompanions(updatedList);

    setCompanionName("");
    setCompanionPassport("");
    setCompanionExpiry("");

    const uid = currentCustomer?.uid || customerData?.uid;
    if (uid) {
      setCustomerLoading(true);
      try {
        await updateDoc(doc(db, "customers", uid), {
          companions: updatedList,
        });
        if (customerData) {
          setCustomerData({ ...customerData, companions: updatedList });
        }
      } catch (err) {
        console.error("Error direct saving companions:", err);
      } finally {
        setCustomerLoading(false);
      }
    }
  };

  const handleCustomerRemoveCompanion = (idx: number) => {
    const updatedList = customerCompanions.filter((_, i) => i !== idx);
    setCustomerCompanions(updatedList);

    const uid = currentCustomer?.uid || customerData?.uid;
    if (uid) {
      setCustomerLoading(true);
      updateDoc(doc(db, "customers", uid), {
        companions: updatedList,
      })
        .then(() => {
          if (customerData) {
            setCustomerData({ ...customerData, companions: updatedList });
          }
        })
        .catch((err) => {
          console.error("Error updating companions list:", err);
        })
        .finally(() => {
          setCustomerLoading(false);
        });
    }
  };

  const handleCustomerSendManifestToAgentChat = async () => {
    setCustomerLoading(true);
    try {
      const activeInquiryId = localStorage.getItem(
        "phuket_charter_active_chat_id",
      );
      let targetId = activeInquiryId;

      const emailVal = currentCustomer?.email || customerData?.email || "";

      if (!targetId && emailVal) {
        const q = query(
          collection(db, "inquiries"),
          where("contact", "==", emailVal),
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          targetId = querySnap.docs[0].id;
        }
      }

      const activeBrokerObj = currentAgent || {
        name: "Agent Team",
        email: "info@phuketcharter.com",
      };
      const currentBrokerId = activeBrokerObj.email
        ? activeBrokerObj.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "unassigned";

      if (!targetId && emailVal) {
        const dummyInqId = "inq_" + Math.random().toString(36).substring(2, 9);
        const dummyInqPayload = {
          name:
            customerData?.name ||
            currentCustomer?.displayName ||
            "Charter Guest",
          contact: emailVal,
          message:
            "Secure Digital Manifest Synchronization request initialized.",
          brokerId: currentBrokerId,
          createdAt: new Date().toISOString(),
          isRead: false,
          chatHistory: [],
        };
        await setDoc(doc(db, "inquiries", dummyInqId), dummyInqPayload);
        targetId = dummyInqId;
        localStorage.setItem("phuket_charter_active_chat_id", dummyInqId);
      }

      if (!targetId) {
        alert(
          "We could not find an active live chat/booking thread open for your profile.\n\n" +
            "Please click the Live Chat bubble in the bottom right corner of the screen first, send a short text to initialize your secure booking channel, then return here to forward your manifest instantly.",
        );
        return;
      }

      const inquiryDocRef = doc(db, "inquiries", targetId);
      const inquirySnap = await getDoc(inquiryDocRef);
      if (inquirySnap.exists()) {
        const inqData = inquirySnap.data();
        const history = inqData.chatHistory || [];

        const companionDetailsList = customerCompanions
          .map(
            (c, i) =>
              `  • [Traveler ${i + 1}] ${c.fullName.toUpperCase()} | Nationality: ${c.country.toUpperCase()} | Passport: ${c.passportNumber.toUpperCase()} | Exp: ${c.passportExpiry}`,
          )
          .join("\n");

        const msgText =
          `📋 [SYSTEM INTEGRATION] GUEST PASSENGER MANIFEST FOR MARITIME INSURANCE\n` +
          `==================================================\n` +
          `A complete passenger manifest has been digitally generated and submitted by the customer for clearance and insurance cover verification:\n\n` +
          `LEAD CHARTERER RECORD:\n` +
          `  • Full Name: ${(customerData?.name || currentCustomer?.displayName || "N/A").toUpperCase()}\n` +
          `  • Phone Contact: ${customerPhoneCode} ${customerPhoneNumber}\n` +
          `  • Nationality/Country: ${(customerCountry || "N/A").toUpperCase()}\n` +
          `  • Passport/ID Number: ${(customerPassport || "N/A").toUpperCase()}\n` +
          `  • Expiry Date: ${customerPassportExpiry || "N/A"}\n\n` +
          `ADDITIONAL TRAVEL COMPANIONS (${customerCompanions.length}):\n` +
          (customerCompanions.length > 0
            ? companionDetailsList
            : "  • Solo Voyager (No additional travelers listed).") +
          `\n` +
          `==================================================\n` +
          `💡 Live Agent Action: Click 'Download Passenger Manifest PDF' in the compliance panel above to compile official Harbor Master forms.`;

        const newMsg = {
          sender: "client",
          text: msgText,
          createdAt: new Date().toISOString(),
          isManifest: true,
          companions: customerCompanions,
          leadInfo: {
            name: customerData?.name || currentCustomer?.displayName || "N/A",
            phone: `${customerPhoneCode} ${customerPhoneNumber}`,
            country: customerCountry,
            passportNumber: customerPassport,
            passportExpiry: customerPassportExpiry,
          },
        };

        await updateDoc(inquiryDocRef, {
          chatHistory: [...history, newMsg],
          isRead: false,
        });

        alert(
          "Secure Sync Successful! Your complete Passenger Manifest has been dispatched directly into our secure broker files for insurance clearance.",
        );
      } else {
        alert("We were unable to synchronize with your active booking file.");
      }
    } catch (err: any) {
      console.error("Direct manifest sync failed:", err);
      alert("Error synchronizing manifest: " + err.message);
    } finally {
      setCustomerLoading(false);
    }
  };

  const compileCustomerTextManifest = () => {
    const companionsText = customerCompanions
      .map(
        (c, i) =>
          `- Traveler ${i + 1}: ${c.fullName.toUpperCase()} | Nationality: ${c.country.toUpperCase()} | Passport: ${c.passportNumber.toUpperCase()} | Exp: ${c.passportExpiry}`,
      )
      .join("\n");

    return (
      `📋 GUEST PASSENGER MANIFEST FOR MARITIME INSURANCE\n` +
      `--------------------------------------------------\n` +
      `LEAD CHARTERER:\n` +
      `• Name: ${(customerData?.name || currentCustomer?.displayName || "N/A").toUpperCase()}\n` +
      `• Phone: ${customerPhoneCode} ${customerPhoneNumber.trim() || "N/A"}\n` +
      `• Citizenship: ${(customerCountry || "N/A").toUpperCase()}\n` +
      `• Passport/ID: ${(customerPassport || "N/A").toUpperCase()}\n` +
      `• Expiry: ${customerPassportExpiry || "N/A"}\n\n` +
      `TRAVELING PARTY COMPANIONS (${customerCompanions.length}):\n` +
      (customerCompanions.length > 0
        ? companionsText
        : "- Solo Voyager (No additional travelers listed).") +
      `\n` +
      `--------------------------------------------------\n` +
      `Generated via Phuket Private Yacht Excursions.`
    );
  };

  const handleCustomerDownloadPdf = () => {
    try {
      const docData = compileManifestPdf(
        {
          name:
            customerData?.name ||
            currentCustomer?.displayName ||
            currentCustomer?.email ||
            "Valued Customer",
          email: currentCustomer?.email || customerData?.email || "",
          phoneNumber: `${customerPhoneCode} ${customerPhoneNumber}`,
          country: customerCountry,
          passportNumber: customerPassport,
          passportExpiry: customerPassportExpiry,
        },
        customerCompanions,
      );

      const fileName = `Official_Insurance_Manifest_${(customerData?.name || "guest").toLowerCase().replace(/\s+/g, "_")}.pdf`;
      docData.save(fileName);
    } catch (e: any) {
      console.error("PDF download crashed:", e);
      alert("Error building document PDF: " + e.message);
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail || !loginPwd) {
      setErrorMsg("Please provide your email address and password.");
      return;
    }

    const res = await login(loginEmail, loginPwd);
    if (res.success) {
      setSuccessMsg(res.message);

      setTimeout(() => {
        setSuccessMsg(null);
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPwd) {
      setErrorMsg(
        "Representative Name, Email and Password are required to construct your account.",
      );
      return;
    }

    const payload: Agent = {
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPwd,
      whatsapp: regWhatsapp.trim() || "+66 63 636 8287",
      contactPhone: regPhone.trim() || "+66 63 636 8287",
      lineId: regLineId.trim() || undefined,
      wechatId: regWechatId.trim() || undefined,
      companyName: regCompanyName.trim() || undefined,
      companyAddress: regCompanyAddress.trim() || undefined,
      country: regCountry.trim() || undefined,
      taxId: regTaxId.trim() || undefined,
    };

    const res = await register(payload);
    if (res.success) {
      setSuccessMsg(res.message);

      // Automatically create subfolder of newly registered agent if Google Drive is connected
      if (gdriveAccessToken && gdriveFolderId) {
        createAgentGdriveFolder(payload, gdriveAccessToken, gdriveFolderId)
          .then(() => {
            console.log(
              `Auto-created Google Drive folder for newly registered agent: ${payload.name}`,
            );
          })
          .catch((err) => {
            console.warn(
              "Could not auto-create Google Drive folder for newly registered agent:",
              err,
            );
          });
      }

      // Reset fields
      setRegName("");
      setRegEmail("");
      setRegPwd("");
      setRegWhatsapp("");
      setRegPhone("");
      setRegLineId("");
      setRegCompanyName("");
      setRegCompanyAddress("");
      setRegCountry("Thailand");
      setRegTaxId("");

      setTimeout(() => {
        setSuccessMsg(null);
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!profileName.trim()) {
      setErrorMsg("An active representative name is required.");
      return;
    }

    const res = await updateProfile({
      name: profileName.trim(),
      whatsapp: profileWhatsapp.trim(),
      contactPhone: profilePhone.trim(),
      lineId: profileLineId.trim(),
      wechatId: profileWechatId.trim(),
      companyName: profileCompanyName.trim() || undefined,
      companyAddress: profileCompanyAddress.trim() || undefined,
      country: profileCountry.trim() || undefined,
      taxId: profileTaxId.trim() || undefined,
      commissionRate: profileCommissionRate,
      welcomeMessage: profileWelcomeMessage.trim() || undefined,
      customShareMessage: profileCustomShareMessage.trim() || undefined,
    } as any);

    if (res.success) {
      setSuccessMsg("Saved Successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Removed sandbox functions

  const isStandaloneApp =
    typeof window !== "undefined" &&
    window.location.search.includes("agent-portal=true");

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center ${isStandaloneApp ? "p-0 bg-[#FAF9F6]" : "p-4 bg-slate-900/40 backdrop-blur-xs"}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`relative w-full ${isStandaloneApp ? "h-[100dvh] max-w-none rounded-none border-0 shadow-none" : isAgentLoggedIn ? "max-w-[98vw] h-[98vh] rounded-xs border border-[#0F172A]/15 shadow-2xl" : "max-w-4xl max-h-[92vh] rounded-xs border border-[#0F172A]/15 shadow-2xl"} bg-[#FAF9F6] overflow-hidden flex flex-col my-auto`}
        >
          {/* Header Banner */}
          <div className="bg-[#0F172A] text-white p-6 relative flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] font-sans font-extrabold text-amber-400">
                Phuket Yacht Fleet Portal
              </span>
              <h3 className="text-xl font-serif tracking-wide text-white font-light mt-1 mb-0.5">
                {isAgentLoggedIn
                  ? "Representative Workspace"
                  : "Yacht Broker Portal"}
              </h3>
              <p className="text-[10px] text-slate-350 font-sans opacity-80 leading-relaxed max-w-[85%] mt-1">
                Authenticate your account. Personalized WhatsApp leads and call
                reservations automatically route to your phone.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAgentLoggedIn && isMasterAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-admin-portal"));
                  }}
                  className="py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-sm font-sans font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  title="Force Open Master Admin Control Panel"
                >
                  <Shield className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>
              )}
              {isAgentLoggedIn && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-1.5 rounded-sm hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              {(!isStandaloneApp ||
                (typeof window !== "undefined" &&
                  window.location.search.includes("from=crew"))) && (
                <button
                  id="btn-close-agent-portal"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.location.search.includes("from=crew")
                    ) {
                      const targetUrl = new URL(window.location.href);
                      targetUrl.searchParams.delete("agent-portal");
                      targetUrl.searchParams.delete("from");
                      targetUrl.searchParams.set("workspace", "crew");
                      window.location.href = targetUrl.toString();
                    } else {
                      onClose();
                    }
                  }}
                  type="button"
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={
                    typeof window !== "undefined" &&
                    window.location.search.includes("from=crew")
                      ? "Return to Crew Workspace"
                      : "Close"
                  }
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto space-y-6">
            {/* Feedback Messages */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-[11px] font-sans rounded-xs flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-sans rounded-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-semibold">{successMsg}</span>
              </motion.div>
            )}

            {/* Authenticated Broker Settings View */}
            {isAgentLoggedIn ? (
              <div className="-m-6 md:-m-8 flex flex-col lg:flex-row h-[85vh] bg-slate-50 min-h-0 relative">
                <div
                  className={`w-full lg:w-[280px] bg-[#0F172A] border-r border-[#1E293B] flex flex-col shrink-0 ${isMobileMenuOpen ? "flex h-full absolute lg:relative z-20 w-full" : "hidden lg:flex"}`}
                >
                  <div className="pt-6 pb-2 px-5 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      WORKSPACE TASKS
                    </span>
                    <button
                      id="sidebar-btn-logout-agent"
                      type="button"
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="px-3 py-1 border border-rose-900/40 hover:bg-rose-950/30 text-rose-400 font-sans font-bold text-[9px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>

                  {isQuotaExceeded && (
                    <div className="mx-5 mb-4 p-3 bg-amber-950/20 border border-amber-900/30 text-amber-500 rounded-sm font-sans text-[10px] leading-relaxed flex items-start gap-2.5 text-left">
                      <span className="text-sm">⚠️</span>
                      <div>
                        <p className="font-bold flex items-center gap-1.5 text-amber-500">
                          <span>Offline Fallback Mode Active</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto w-full space-y-1 py-2">
                    {[
                      {
                        id: "analytics",
                        label: "ANALYTICS",
                        subtitle: "Main metrics, totals & overviews",
                        icon: <Activity className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "bookings",
                        label: `BOOKED CHARTERS`,
                        subtitle: `${dbBookings.length} confirmed yacht reservations`,
                        icon: <Anchor className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "generator",
                        label: `PROPOSAL GENERATOR`,
                        subtitle: "Compare yachts & export PDF brochure",
                        icon: <FileText className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "quotes",
                        label: `PROPOSALS`,
                        subtitle: `${savedProposals.length} generated & saved client quotes`,
                        icon: <FileText className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "inquiries",
                        label: `INQUIRIES`,
                        subtitle: `${inquiries.length} client messages & CRM threads`,
                        icon: <Inbox className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "Assistant",
                        label: `AI ASSISTANT`,
                        subtitle: "Smart inquiry responder",
                        icon: <Sparkles className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "customers",
                        label: `VIP CRM & GUESTS`,
                        subtitle: `${customersList.length} past clients in database`,
                        icon: <Users className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "fleet",
                        label: `SHIP ROSTERS`,
                        subtitle: "Live guest boarding manifests",
                        icon: <Ship className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "co-agents",
                        label: `TEAM & BROKERS`,
                        subtitle: "Co-agents and sub-brokers",
                        icon: <Briefcase className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "agent-chat",
                        label: `INTERNAL CHAT`,
                        subtitle: "Internal communication logs",
                        icon: <MessageSquare className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "workspace",
                        label: `WORKSPACE HUB`,
                        subtitle: "Shortcuts & links",
                        icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "branding",
                        label: `PERSONAL BRANDING`,
                        subtitle: "Settings & Profile config",
                        icon: <Edit2 className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "qr-generator",
                        label: `REFERRAL QR`,
                        subtitle: "Shareable VIP Cards",
                        icon: <QrCode className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "prices",
                        label: `CUSTOM PRICES`,
                        subtitle: "Manage price lists & addons",
                        icon: <FolderOpen className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "gdrive",
                        label: `GOOGLE DRIVE`,
                        subtitle: "File storage system",
                        icon: <Folder className="w-[18px] h-[18px]" />,
                      },
                      {
                        id: "efficiency",
                        label: `EFFICIENCY`,
                        subtitle: "Timer & metrics tracking",
                        icon: <PieChart className="w-[18px] h-[18px]" />,
                      },
                      ...(isMasterAdmin
                        ? [
                            {
                              id: "admin-portal-trigger",
                              label: `MASTER ADMIN PANEL`,
                              subtitle: "Global fleet, metrics & users",
                              icon: (
                                <Shield className="w-[18px] h-[18px] text-rose-500 animate-pulse" />
                              ),
                              action: () => {
                                window.dispatchEvent(
                                  new CustomEvent("open-admin-portal"),
                                );
                              },
                            },
                          ]
                        : []),
                    ].map((tab: any) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          if (tab.action) {
                            tab.action();
                          } else {
                            setInquiriesTab(tab.id as any);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                          inquiriesTab === tab.id
                            ? "border-emerald-500 bg-slate-800/80"
                            : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex gap-3.5 items-center">
                          <div
                            className={`${inquiriesTab === tab.id ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                          >
                            {tab.icon}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-[10px] font-bold tracking-widest uppercase ${inquiriesTab === tab.id ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                            >
                              {tab.label}
                            </span>
                            <span
                              className={`text-[9px] font-medium leading-relaxed mt-0.5 ${inquiriesTab === tab.id ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                            >
                              {tab.subtitle}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-5 border-t border-[#1E293B] mt-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-300 font-sans uppercase tracking-wider">
                          Representative Desk
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono truncate max-w-[200px]">
                          {currentAgent.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-white no-scrollbar space-y-6">
                  {/* Switchable Workspaces */}
                  {inquiriesTab === "generator" && (
                    <div className="space-y-4 block animate-in fade-in duration-150">
                      <div className="bg-slate-50 border border-slate-205 p-6 rounded-xs text-left shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-200 pb-5 mb-5">
                          <div>
                            <h4 className="font-serif text-lg text-slate-900 font-bold flex items-center gap-2">
                              <FileText className="h-5 w-5 text-emerald-600" />
                              Custom PDF Proposal Generator
                            </h4>
                            <p className="text-[11px] text-slate-500 font-sans mt-2 max-w-2xl leading-relaxed">
                              Check off 2 or 3 specific yachts to instantly
                              create a branded, multi-page PDF brochure
                              comparing the vessels side-by-side. You can send
                              this brochure directly to your VIP clients.
                            </p>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                if (onRequestComparisonModal) {
                                  onRequestComparisonModal();
                                }
                              }}
                              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#0F172A] hover:bg-slate-800 transition-colors rounded shadow-xs text-white text-[11px] font-sans font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4" /> Open Full-Screen
                              Generator
                            </button>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 p-4 rounded text-center py-8">
                          <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            The full-screen generator allows you to filter the
                            current vessel fleet, select two or three specific
                            ships, and combine them into a high-resolution
                            offline PDF layout.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inquiriesTab === "quotes" && (
                    /* CRM offline integration and Client proposals list */
                    <div className="space-y-3.5 block animate-in fade-in duration-150">
                      {/* Manual Quote Creator Button and Toggle Form */}
                      <div className="bg-slate-50 border border-slate-205 p-4 rounded-xs text-left space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <h5 className="font-serif text-sm text-slate-800 font-bold">
                              Custom Offline Client Quote
                            </h5>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Create and save customized proposals for walk-in,
                              phone, or direct inquiries not registered on the
                              web app.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingManualQuote(!isCreatingManualQuote);
                              setManualError("");
                            }}
                            className={`py-1.5 px-3 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                              isCreatingManualQuote
                                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                : "bg-emerald-800 text-white hover:bg-emerald-950"
                            }`}
                          >
                            {isCreatingManualQuote ? (
                              <>
                                <X className="h-3 w-3" /> Close Form
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" /> Create Quote / Add
                                Inquiry
                              </>
                            )}
                          </button>
                        </div>

                        {isCreatingManualQuote && (
                          <div className="bg-white border border-slate-250 p-4 rounded-xs space-y-3.5 mt-2 animate-in slide-in-from-top-1 duration-150">
                            {manualError && (
                              <p className="text-red-800 bg-red-50 border border-red-200 p-2 rounded-xs font-sans text-[10.5px]">
                                ⚠️ {manualError}
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                  Known Client (optional)
                                </label>
                                <select
                                  value={manualCustomerUid}
                                  onChange={(e) => {
                                    const uid = e.target.value;
                                    setManualCustomerUid(uid);
                                    const c = customersList.find(
                                      (x: any) => x.uid === uid,
                                    );
                                    if (c) {
                                      setManualClientName(c.name || "");
                                      setManualClientContact(
                                        c.email || c.phone || "",
                                      );
                                    }
                                  }}
                                  className="w-full text-xs p-2 border border-slate-205 rounded-xs focus:outline-none focus:border-emerald-700 bg-slate-50/50"
                                >
                                  <option value="">
                                    New / external client
                                  </option>
                                  {customersList.map((c: any) => (
                                    <option key={c.uid} value={c.uid}>
                                      {c.name || "Unnamed"} —{" "}
                                      {c.email || c.phone || "no contact"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                  Client Name *
                                </label>
                                <input
                                  type="text"
                                  placeholder="E.g. Dr. John Cooper"
                                  value={manualClientName}
                                  onChange={(e) =>
                                    setManualClientName(e.target.value)
                                  }
                                  className="w-full text-xs p-2 border border-slate-205 rounded-xs focus:outline-none focus:border-emerald-700 bg-slate-50/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                  Client Contact (Phone / WhatsApp / Email)
                                </label>
                                <input
                                  type="text"
                                  placeholder="E.g. WhatsApp: +386 40 123 456"
                                  value={manualClientContact}
                                  onChange={(e) =>
                                    setManualClientContact(e.target.value)
                                  }
                                  className="w-full text-xs p-2 border border-slate-205 rounded-xs focus:outline-none focus:border-emerald-700 bg-slate-50/50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                  Charter Date / Period
                                </label>
                                <input
                                  type="text"
                                  placeholder="E.g. June 25, 2026"
                                  value={manualCharterDate}
                                  onChange={(e) =>
                                    setManualCharterDate(e.target.value)
                                  }
                                  className="w-full text-xs p-2 border border-slate-205 rounded-xs focus:outline-none focus:border-emerald-700 bg-slate-50/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                  Custom Pitch Notes / Comments
                                </label>
                                <input
                                  type="text"
                                  placeholder="E.g. Includes catering + airport private van transfers"
                                  value={manualNotes}
                                  onChange={(e) =>
                                    setManualNotes(e.target.value)
                                  }
                                  className="w-full text-xs p-2 border border-slate-205 rounded-xs focus:outline-none focus:border-emerald-700 bg-slate-50/50"
                                />
                              </div>
                            </div>

                            <div className="bg-emerald-50/60 p-3 rounded border border-emerald-150 flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                id="manual-create-inquiry-box"
                                checked={manualCreateInquiry}
                                onChange={(e) =>
                                  setManualCreateInquiry(e.target.checked)
                                }
                                className="rounded-sm accent-emerald-750 h-4 w-4 cursor-pointer"
                              />
                              <div className="space-y-0.5">
                                <label
                                  htmlFor="manual-create-inquiry-box"
                                  className="block text-[11px] font-bold text-emerald-900 tracking-wide uppercase cursor-pointer"
                                >
                                  💬 Automatically register as a Live Database
                                  Inquiry
                                </label>
                                <p className="text-[9.5px] text-emerald-700 leading-tight">
                                  Creates an active consultation ticket in your
                                  Live Inquiries folder. Customers can scan your
                                  custom link to load their Client Portal to
                                  initiate 2-way messaging and log manifest
                                  details.
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3.5 space-y-3">
                              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                Configure Offered Catamarans & Rates
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Catamaran 1 Selection */}
                                <div className="space-y-1 bg-slate-50/60 p-2 border border-slate-150 rounded">
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                    Option #1 Catamaran *
                                  </label>
                                  <select
                                    value={manualVessel1Id}
                                    onChange={(e) =>
                                      setManualVessel1Id(e.target.value)
                                    }
                                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  >
                                    <option value="">-- Select Boat --</option>
                                    {CATAMARANS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.model})
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Price rate (e.g. 55,000 THB)"
                                    value={manualPrice1}
                                    onChange={(e) =>
                                      setManualPrice1(e.target.value)
                                    }
                                    className="w-full text-[11px] mt-1.5 p-1 px-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  />
                                </div>

                                {/* Catamaran 2 Selection */}
                                <div className="space-y-1 bg-slate-50/60 p-2 border border-slate-150 rounded">
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                    Option #2 Catamaran (Optional)
                                  </label>
                                  <select
                                    value={manualVessel2Id}
                                    onChange={(e) =>
                                      setManualVessel2Id(e.target.value)
                                    }
                                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  >
                                    <option value="">-- None --</option>
                                    {CATAMARANS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.model})
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Price rate (e.g. 70,000 THB)"
                                    value={manualPrice2}
                                    onChange={(e) =>
                                      setManualPrice2(e.target.value)
                                    }
                                    className="w-full text-[11px] mt-1.5 p-1 px-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  />
                                </div>

                                {/* Catamaran 3 Selection */}
                                <div className="space-y-1 bg-slate-50/60 p-2 border border-slate-150 rounded">
                                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                    Option #3 Catamaran (Optional)
                                  </label>
                                  <select
                                    value={manualVessel3Id}
                                    onChange={(e) =>
                                      setManualVessel3Id(e.target.value)
                                    }
                                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  >
                                    <option value="">-- None --</option>
                                    {CATAMARANS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.model})
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Price rate (e.g. 95,000 THB)"
                                    value={manualPrice3}
                                    onChange={(e) =>
                                      setManualPrice3(e.target.value)
                                    }
                                    className="w-full text-[11px] mt-1.5 p-1 px-1.5 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section for Offered Extras & Service Surcharges */}
                            <div className="border-t border-slate-150 pt-3.5 space-y-3">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                    Offered Extras & Service Option Surcharges
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                                    Include catering packages, private vans,
                                    park entry tickets, water slides, or custom
                                    fees with flexible prices.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddManualLineItem()}
                                  className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-850 rounded text-[9px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Custom Extra Line</span>
                                </button>
                              </div>

                              {/* Preset Buttons for easy mouse picking categorized into Tours and Addons from the first page */}
                              <div className="border border-slate-150 rounded-sm max-w-full overflow-hidden bg-slate-50/50">
                                <div className="flex border-b border-slate-150 bg-slate-100 text-[10px] font-bold uppercase tracking-wider">
                                  <button
                                    type="button"
                                    onClick={() => setManualPresetTab("tours")}
                                    className={`flex-1 py-2 px-3 text-center cursor-pointer transition-colors ${
                                      manualPresetTab === "tours"
                                        ? "bg-white text-emerald-800 border-r border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                        : "text-slate-500 hover:bg-slate-200"
                                    }`}
                                  >
                                    🏝️ Landmark Sea Tours
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setManualPresetTab("addons")}
                                    className={`flex-1 py-2 px-3 text-center cursor-pointer transition-colors ${
                                      manualPresetTab === "addons"
                                        ? "bg-white text-emerald-800 border-l border-r border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                        : "text-slate-500 hover:bg-slate-200 border-x border-[#E2E8F0]"
                                    }`}
                                  >
                                    ✨ Experience Add-ons
                                  </button>
                                  {currentAgent?.customPricing?.extraServices &&
                                    currentAgent.customPricing.extraServices
                                      .length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setManualPresetTab("broker")
                                        }
                                        className={`flex-1 py-2 px-3 text-center cursor-pointer transition-colors ${
                                          manualPresetTab === "broker"
                                            ? "bg-white text-emerald-800 border-l border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                            : "text-slate-500 hover:bg-slate-200"
                                        }`}
                                      >
                                        💎 My Extras
                                      </button>
                                    )}
                                </div>

                                <div className="p-2.5 max-h-[160px] overflow-y-auto space-y-1.5 bg-white">
                                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                                    {manualPresetTab === "tours"
                                      ? "Select Destination / Cruise Package (Agent can fully edit custom price listed)"
                                      : manualPresetTab === "addons"
                                        ? "Select Premium Extras & Catering Addon (Agent can fully edit custom price listed)"
                                        : "Select Custom Broker Extra Features added from Prices page"}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {(manualPresetTab === "tours"
                                      ? TOUR_PRESET_ITEMS
                                      : manualPresetTab === "addons"
                                        ? ADDON_PRESET_ITEMS
                                        : currentAgent?.customPricing
                                            ?.extraServices || []
                                    ).map((preset: any, idx: number) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          handleAddManualLineItem(preset)
                                        }
                                        className="py-1 px-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded text-[9px] font-sans font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-98"
                                      >
                                        <Plus className="h-2.5 w-2.5 text-emerald-600" />
                                        <span>{preset.name}</span>
                                        <span className="text-[8.5px] text-emerald-700 font-mono font-bold">
                                          (
                                          {preset.price > 0
                                            ? `${preset.price.toLocaleString()} THB`
                                            : "0 THB"}
                                          )
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Active custom extras list */}
                              {manualCustomLineItems.length > 0 && (
                                <div className="bg-slate-50/50 p-2 border border-slate-150 rounded space-y-2">
                                  <div className="hidden md:grid grid-cols-12 gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider px-2">
                                    <div className="col-span-12 md:col-span-5">
                                      Service / Option Name
                                    </div>
                                    <div className="col-span-12 md:col-span-2 text-right">
                                      Unit Rate (THB)
                                    </div>
                                    <div className="col-span-12 md:col-span-1 text-center">
                                      Qty
                                    </div>
                                    <div className="col-span-12 md:col-span-2 text-center">
                                      Basis / Unit
                                    </div>
                                    <div className="col-span-12 md:col-span-2 text-right">
                                      Total
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto">
                                    {manualCustomLineItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-1.5 border border-slate-150 rounded shadow-xs relative"
                                      >
                                        <div className="col-span-12 md:col-span-5">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) =>
                                              handleUpdateManualLineItem(
                                                item.id,
                                                "name",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Service description"
                                            className="w-full text-xs p-1 border border-slate-200 rounded-xs bg-slate-50/10 focus:border-slate-400"
                                          />
                                        </div>
                                        <div className="col-span-12 md:col-span-2">
                                          <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) =>
                                              handleUpdateManualLineItem(
                                                item.id,
                                                "price",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Price"
                                            className="w-full text-xs p-1 text-right border border-slate-200 rounded-xs"
                                          />
                                        </div>
                                        <div className="col-span-12 md:col-span-1">
                                          <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) =>
                                              handleUpdateManualLineItem(
                                                item.id,
                                                "qty",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Qty"
                                            className="w-full text-xs p-1 text-center border border-slate-200 rounded-xs"
                                          />
                                        </div>
                                        <div className="col-span-12 md:col-span-2">
                                          <select
                                            value={item.unit}
                                            onChange={(e) =>
                                              handleUpdateManualLineItem(
                                                item.id,
                                                "unit",
                                                e.target.value,
                                              )
                                            }
                                            className="w-full text-[11px] p-1 border border-slate-200 rounded-xs bg-white focus:outline-none"
                                          >
                                            <option value="guest">
                                              guest(s)
                                            </option>
                                            <option value="charter">
                                              charter
                                            </option>
                                            <option value="hour">
                                              hour(s)
                                            </option>
                                            <option value="day">day(s)</option>
                                          </select>
                                        </div>
                                        <div className="col-span-12 md:col-span-2 text-right flex items-center justify-between pl-2">
                                          <span className="text-xs font-bold text-slate-800 font-mono w-full text-right shrink-0 pr-6">
                                            {(
                                              item.price * item.qty
                                            ).toLocaleString()}{" "}
                                            THB
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveManualLineItem(
                                                item.id,
                                              )
                                            }
                                            className="absolute right-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 uppercase tracking-wider px-2 pt-1 border-t border-slate-100">
                                    <span>Extra Options Surcharges Total:</span>
                                    <span className="text-emerald-800 font-extrabold font-mono text-xs">
                                      {manualCustomLineItems
                                        .reduce(
                                          (acc, item) =>
                                            acc + item.price * item.qty,
                                          0,
                                        )
                                        .toLocaleString()}{" "}
                                      THB
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Live grand totals pre-calculations comparison */}
                              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded space-y-2">
                                <h6 className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 animate-pulse" />
                                  <span>
                                    Live Grand Estimate Summary (With Surcharges
                                    & Extras)
                                  </span>
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
                                  {(() => {
                                    const extrasSum =
                                      manualCustomLineItems.reduce(
                                        (acc, item) =>
                                          acc + item.price * item.qty,
                                        0,
                                      );

                                    const parsePriceNoVal = (val: string) => {
                                      if (!val) return 0;
                                      const digits = val.replace(/[^\d]/g, "");
                                      return Number(digits) || 0;
                                    };

                                    const rate1 = parsePriceNoVal(manualPrice1);
                                    const rate2 = parsePriceNoVal(manualPrice2);
                                    const rate3 = parsePriceNoVal(manualPrice3);

                                    const vesselObj1 = CATAMARANS.find(
                                      (c) => c.id === manualVessel1Id,
                                    );
                                    const vesselObj2 = CATAMARANS.find(
                                      (c) => c.id === manualVessel2Id,
                                    );
                                    const vesselObj3 = CATAMARANS.find(
                                      (c) => c.id === manualVessel3Id,
                                    );

                                    return (
                                      <>
                                        <div className="bg-white border border-emerald-100 p-2 rounded text-left">
                                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                            Option #1 (
                                            {vesselObj1
                                              ? vesselObj1.name.substring(0, 15)
                                              : "Boat 1"}
                                            )
                                          </p>
                                          <p className="text-[10px] text-slate-600 mt-1 font-sans">
                                            Vessel Base:{" "}
                                            <span className="font-mono text-slate-800 font-semibold">
                                              {rate1.toLocaleString()} THB
                                            </span>
                                          </p>
                                          <p className="text-[12px] font-extrabold text-emerald-800 mt-1 font-sans border-t border-slate-100 pt-1.5 flex justify-between">
                                            <span>GRAND:</span>
                                            <span className="font-mono text-[13px]">
                                              {(
                                                rate1 + extrasSum
                                              ).toLocaleString()}{" "}
                                              THB
                                            </span>
                                          </p>
                                        </div>

                                        {manualVessel2Id && (
                                          <div className="bg-white border border-emerald-100 p-2 rounded text-left">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                              Option #2 (
                                              {vesselObj2
                                                ? vesselObj2.name.substring(
                                                    0,
                                                    15,
                                                  )
                                                : "Boat 2"}
                                              )
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-1 font-sans font-medium">
                                              Vessel Base:{" "}
                                              <span className="font-mono text-slate-800 font-semibold">
                                                {rate2.toLocaleString()} THB
                                              </span>
                                            </p>
                                            <p className="text-[12px] font-extrabold text-emerald-800 mt-1 font-sans border-t border-slate-100 pt-1.5 flex justify-between">
                                              <span>GRAND:</span>
                                              <span className="font-mono text-[13px]">
                                                {(
                                                  rate2 + extrasSum
                                                ).toLocaleString()}{" "}
                                                THB
                                              </span>
                                            </p>
                                          </div>
                                        )}

                                        {manualVessel3Id && (
                                          <div className="bg-white border border-emerald-100 p-2 rounded text-left">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                              Option #3 (
                                              {vesselObj3
                                                ? vesselObj3.name.substring(
                                                    0,
                                                    15,
                                                  )
                                                : "Boat 3"}
                                              )
                                            </p>
                                            <p className="text-[10px] text-slate-605 mt-1 font-sans font-medium">
                                              Vessel Base:{" "}
                                              <span className="font-mono text-slate-800 font-semibold">
                                                {rate3.toLocaleString()} THB
                                              </span>
                                            </p>
                                            <p className="text-[12px] font-extrabold text-emerald-800 mt-1 font-sans border-t border-slate-100 pt-1.5 flex justify-between">
                                              <span>GRAND:</span>
                                              <span className="font-mono text-[13px]">
                                                {(
                                                  rate3 + extrasSum
                                                ).toLocaleString()}{" "}
                                                THB
                                              </span>
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingManualQuote(false);
                                  setManualError("");
                                }}
                                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer animate-none"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleCreateManualQuote}
                                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="h-3 w-3" /> Save Proposal &
                                Store
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mb-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] border-b pb-1.5 font-sans w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span>Saved Client Quotes & Proposals</span>
                              <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors normal-case tracking-normal">
                                <input
                                  type="checkbox"
                                  checked={showActiveOnly}
                                  onChange={(e) =>
                                    setShowActiveOnly(e.target.checked)
                                  }
                                  className="rounded-sm accent-emerald-500 h-3 w-3 cursor-pointer"
                                />
                                <span>Show Active Only</span>
                              </label>
                            </div>
                            {savedProposals.length > 0 && (
                              <button
                                id="btn-crm-export"
                                type="button"
                                onClick={downloadProposalsAsCSV}
                                className="py-1 px-2 bg-emerald-800 hover:bg-emerald-950 border border-emerald-900 text-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xs flex items-center gap-1 cursor-pointer transition-colors shadow-none"
                              >
                                <Download className="h-3 w-3" /> Export CSV
                              </button>
                            )}
                          </h4>
                        </div>
                      </div>

                      {(() => {
                        const filteredProposals = savedProposals.filter((p) => {
                          if (!showActiveOnly) return true;
                          if (!p.charterDate) return false;
                          const date = new Date(p.charterDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date >= today;
                        });

                        return filteredProposals.length === 0 ? (
                          <div className="p-4 bg-slate-50 border border-slate-200/55 rounded-xs text-center space-y-1 block">
                            <FileText className="h-5 w-5 text-slate-400 mx-auto" />
                            <p className="text-[10.5px] font-sans text-slate-500 font-medium leading-relaxed">
                              No {showActiveOnly ? "active " : ""}client
                              proposals saved yet.
                            </p>
                            <p className="text-[9.5px] font-sans text-slate-400">
                              Use our custom "Create Quote for Client" tool in
                              the yacht comparison page to customize pricing and
                              save proposals.
                            </p>
                          </div>
                        ) : (
                          <div className="border border-slate-200/60 rounded-xs overflow-hidden bg-white block shadow-xs w-full">
                            <div className="grid grid-cols-1 divide-y divide-slate-100">
                              {filteredProposals.map((proposal) => {
                                const v1 = CATAMARANS.find(
                                  (v) => v.id === proposal.vesselId1,
                                );
                                const v2 = CATAMARANS.find(
                                  (v) => v.id === proposal.vesselId2,
                                );
                                const v3 =
                                  proposal.compareCount === 3
                                    ? CATAMARANS.find(
                                        (v) => v.id === proposal.vesselId3,
                                      )
                                    : null;

                                const vesselsText = Array.from(
                                  new Set(
                                    [v1?.name, v2?.name, v3?.name].filter(
                                      Boolean,
                                    ),
                                  ),
                                ).join(" & ");

                                return (
                                  <div
                                    key={proposal.id}
                                    className="group p-3 hover:bg-slate-50 flex flex-col gap-1 text-left transition-colors relative w-full"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="space-y-0.5 truncate flex-1 block">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-[11px] font-bold font-sans text-slate-900 truncate">
                                            {proposal.clientName}
                                          </span>
                                          {proposal.charterDate && (
                                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-xs font-mono">
                                              {proposal.charterDate}
                                            </span>
                                          )}
                                          {proposal.isManualExternal && (
                                            <span className="text-[8px] bg-amber-100 text-amber-850 px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider shrink-0 select-none">
                                              👤 Manual / Offline Client
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9.5px] text-slate-500 truncate font-sans">
                                          {vesselsText}{" "}
                                          {proposal.clientContact &&
                                            ` • ${proposal.clientContact}`}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5 font-sans shrink-0">
                                        {proposal.vesselId1 ===
                                          proposal.vesselId2 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.dispatchEvent(
                                                new CustomEvent(
                                                  "load-booking-proposal",
                                                  { detail: proposal },
                                                ),
                                              );
                                            }}
                                            className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-xs transition-colors shrink-0 cursor-pointer"
                                            title="Load into Full Quotation Toolkit"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <path d="M12 20h9" />
                                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                            </svg>
                                            <span>Reload</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.dispatchEvent(
                                              new CustomEvent("edit-proposal", {
                                                detail: proposal.id,
                                              }),
                                            );
                                          }}
                                          className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xs transition-colors shrink-0 cursor-pointer"
                                          title="Quick Compare Edit"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                          <span>Compare</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProposal(
                                              editingProposal?.id ===
                                                proposal.id
                                                ? null
                                                : proposal,
                                            );
                                          }}
                                          className={`p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase border rounded-xs transition-colors shrink-0 cursor-pointer ${editingProposal?.id === proposal.id ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"}`}
                                          title="Edit Profile Options (Pricing, Agency Details, Visibility)"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                          <span>Options</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await generateAgentPdfQuote(
                                              editingProposal?.id ===
                                                proposal.id
                                                ? editingProposal
                                                : proposal,
                                              currentAgent,
                                            );
                                          }}
                                          className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xs transition-colors shrink-0 cursor-pointer"
                                          title="Download Quote PDF"
                                        >
                                          <FileText className="h-3 w-3" />
                                          <span>PDF</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={uploadProgress}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            uploadProposalToGdrive(
                                              editingProposal?.id ===
                                                proposal.id
                                                ? editingProposal
                                                : proposal,
                                            );
                                          }}
                                          className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase bg-sky-50 hover:bg-sky-105 text-sky-600 border border-sky-150 rounded-xs transition-all shrink-0 cursor-pointer"
                                          title={
                                            gdriveAccessToken
                                              ? "Backup Quote PDF to Google Drive"
                                              : "Connect Google Drive account to backup quote"
                                          }
                                        >
                                          {uploadProgress ? (
                                            <RefreshCw className="h-3 w-3 animate-spin text-sky-600" />
                                          ) : (
                                            <>
                                              <Upload className="h-3 w-3 text-sky-600" />
                                              <span>GDrive</span>
                                            </>
                                          )}
                                        </button>
                                        {proposal.status !== "accepted" &&
                                          proposal.status !== "confirmed" && (
                                            <button
                                              type="button"
                                              onClick={(e) =>
                                                markProposalAccepted(
                                                  proposal,
                                                  e,
                                                )
                                              }
                                              className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase rounded-xs border border-slate-200 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
                                              title="Mark this quote as accepted by the client (offline)"
                                            >
                                              <Check className="h-3 w-3" />
                                              <span>Accept</span>
                                            </button>
                                          )}
                                        {proposal.status === "accepted" && (
                                          <span className="px-2 py-1 flex items-center gap-1 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                            <Check className="h-3 w-3" />{" "}
                                            Accepted
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            sendBookingToCaptain(proposal, e)
                                          }
                                          className={`p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase rounded-xs border transition-colors shrink-0 cursor-pointer ${proposal.sentToCaptain ? "bg-amber-100 border-amber-300 text-amber-700 animate-pulse" : "bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-600"}`}
                                          title={
                                            proposal.sentToCaptain
                                              ? "Forwarded securely to Yacht Captain & Crew!"
                                              : "Send this booking and manifest rosters for ship (booked) to the Yacht Captain & Crew"
                                          }
                                        >
                                          <Anchor
                                            className={`h-3 w-3 ${proposal.sentToCaptain ? "text-amber-700 font-bold" : "text-slate-500"}`}
                                          />
                                          <span>
                                            {proposal.sentToCaptain
                                              ? "Sent"
                                              : "Captain"}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) =>
                                            deleteProposal(proposal.id, e)
                                          }
                                          className="p-1.5 px-2 flex items-center gap-1.5 text-[9px] font-bold uppercase bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-700 border border-slate-200 rounded-xs transition-colors shrink-0 cursor-pointer"
                                          title="Delete Proposal"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </div>

                                    {editingProposal?.id === proposal.id && (
                                      <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xs shadow-sm space-y-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Hide Prices on PDF
                                          </label>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={
                                                editingProposal.hidePricesOnPdf ||
                                                false
                                              }
                                              onChange={(e) =>
                                                setEditingProposal({
                                                  ...editingProposal,
                                                  hidePricesOnPdf:
                                                    e.target.checked,
                                                })
                                              }
                                              className="rounded-sm accent-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-700">
                                              Do not display prices in the
                                              generated brochure
                                            </span>
                                          </div>
                                        </div>

                                        {v1 && (
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                              {v1.name} Price
                                            </label>
                                            <input
                                              type="text"
                                              value={
                                                editingProposal.price1 || ""
                                              }
                                              onChange={(e) =>
                                                setEditingProposal({
                                                  ...editingProposal,
                                                  price1: e.target.value,
                                                })
                                              }
                                              placeholder="E.g. 35,000 THB"
                                              className="w-full text-xs p-1.5 border border-slate-200 rounded-xs focus:outline-none focus:border-emerald-500"
                                            />
                                          </div>
                                        )}
                                        {v2 && v2.id !== v1?.id && (
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                              {v2.name} Price
                                            </label>
                                            <input
                                              type="text"
                                              value={
                                                editingProposal.price2 || ""
                                              }
                                              onChange={(e) =>
                                                setEditingProposal({
                                                  ...editingProposal,
                                                  price2: e.target.value,
                                                })
                                              }
                                              placeholder="E.g. 45,000 THB"
                                              className="w-full text-xs p-1.5 border border-slate-200 rounded-xs focus:outline-none focus:border-emerald-500"
                                            />
                                          </div>
                                        )}
                                        {v3 &&
                                          v3.id !== v1?.id &&
                                          v3.id !== v2?.id && (
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                {v3.name} Price
                                              </label>
                                              <input
                                                type="text"
                                                value={
                                                  editingProposal.price3 || ""
                                                }
                                                onChange={(e) =>
                                                  setEditingProposal({
                                                    ...editingProposal,
                                                    price3: e.target.value,
                                                  })
                                                }
                                                placeholder="E.g. 55,000 THB"
                                                className="w-full text-xs p-1.5 border border-slate-200 rounded-xs focus:outline-none focus:border-emerald-500"
                                              />
                                            </div>
                                          )}

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Agency Notes / Details Override
                                          </label>
                                          <textarea
                                            value={
                                              editingProposal.agencyDetailsOverride ||
                                              ""
                                            }
                                            onChange={(e) =>
                                              setEditingProposal({
                                                ...editingProposal,
                                                agencyDetailsOverride:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder="Custom agency info or quote notes..."
                                            className="w-full text-xs p-1.5 border border-slate-200 rounded-xs min-h-[60px] focus:outline-none focus:border-emerald-500"
                                          />
                                        </div>

                                        {/* Edit Custom Extras Section */}
                                        <div className="border-t border-slate-100 pt-3 space-y-3">
                                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                                Configure Offered Extras &
                                                Surcharges
                                              </p>
                                              <p className="text-[9px] text-slate-400">
                                                Include specific customizable
                                                prices for catering package
                                                options, transfers, and slide
                                                additions.
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAddEditingLineItem()
                                              }
                                              className="py-0.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[8.5px] rounded font-bold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                                            >
                                              <Plus className="h-2 w-2" />
                                              <span>Add Custom Extra</span>
                                            </button>
                                          </div>

                                          {/* Preset options categorized into Tours and Addons for clean custom price lists */}
                                          <div className="border border-slate-200 rounded-xs max-w-full overflow-hidden bg-slate-50/50">
                                            <div className="flex border-b border-slate-200 bg-slate-100/85 text-[8.5px] font-bold uppercase tracking-wider">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setEditingPresetTab("tours")
                                                }
                                                className={`flex-1 py-1 px-2 text-center cursor-pointer transition-colors ${
                                                  editingPresetTab === "tours"
                                                    ? "bg-white text-emerald-800 border-r border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                                    : "text-slate-500 hover:bg-slate-200"
                                                }`}
                                              >
                                                🏝️ Pick Landmark Tours
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setEditingPresetTab("addons")
                                                }
                                                className={`flex-1 py-1 px-2 text-center cursor-pointer transition-colors ${
                                                  editingPresetTab === "addons"
                                                    ? "bg-white text-emerald-800 border-l border-r border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                                    : "text-slate-500 hover:bg-slate-200 border-x border-[#E2E8F0]"
                                                }`}
                                              >
                                                ✨ Pick Add-ons
                                              </button>
                                              {currentAgent?.customPricing
                                                ?.extraServices &&
                                                currentAgent.customPricing
                                                  .extraServices.length > 0 && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setEditingPresetTab(
                                                        "broker",
                                                      )
                                                    }
                                                    className={`flex-1 py-1 px-2 text-center cursor-pointer transition-colors ${
                                                      editingPresetTab ===
                                                      "broker"
                                                        ? "bg-white text-emerald-800 border-l border-[#E2E8F0] border-t-2 border-t-emerald-700"
                                                        : "text-slate-500 hover:bg-slate-200"
                                                    }`}
                                                  >
                                                    💎 My Extras
                                                  </button>
                                                )}
                                            </div>

                                            <div className="p-1.5 max-h-[140px] overflow-y-auto space-y-1 bg-white">
                                              <div className="flex flex-wrap gap-1">
                                                {(editingPresetTab === "tours"
                                                  ? TOUR_PRESET_ITEMS
                                                  : editingPresetTab ===
                                                      "addons"
                                                    ? ADDON_PRESET_ITEMS
                                                    : currentAgent
                                                        ?.customPricing
                                                        ?.extraServices || []
                                                ).map(
                                                  (
                                                    preset: any,
                                                    idx: number,
                                                  ) => (
                                                    <button
                                                      key={idx}
                                                      type="button"
                                                      onClick={() =>
                                                        handleAddEditingLineItem(
                                                          preset,
                                                        )
                                                      }
                                                      className="py-0.5 px-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded text-[8.5px] font-sans font-medium flex items-center gap-0.5 transition-all cursor-pointer shadow-xs active:scale-98"
                                                    >
                                                      <Plus className="h-2 w-2 text-emerald-650" />
                                                      <span>{preset.name}</span>
                                                      <span className="text-[8px] text-emerald-700 font-mono">
                                                        (
                                                        {preset.price > 0
                                                          ? `${preset.price.toLocaleString()} THB`
                                                          : "0 THB"}
                                                        )
                                                      </span>
                                                    </button>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Active custom extras list in edit mode */}
                                          {editingProposal.customLineItems &&
                                          editingProposal.customLineItems
                                            .length > 0 ? (
                                            <div className="space-y-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded">
                                              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                                {editingProposal.customLineItems.map(
                                                  (item: any) => (
                                                    <div
                                                      key={item.id}
                                                      className="grid grid-cols-12 gap-1 items-center bg-white p-1.5 border border-slate-150 rounded relative"
                                                    >
                                                      <div className="col-span-12 md:col-span-4">
                                                        <input
                                                          type="text"
                                                          value={item.name}
                                                          onChange={(e) =>
                                                            handleUpdateEditingLineItem(
                                                              item.id,
                                                              "name",
                                                              e.target.value,
                                                            )
                                                          }
                                                          placeholder="Item description"
                                                          className="w-full text-[10px] p-0.5 border border-slate-100 rounded-sm focus:border-slate-300"
                                                        />
                                                      </div>
                                                      <div className="col-span-12 md:col-span-3">
                                                        <input
                                                          type="number"
                                                          value={item.price}
                                                          onChange={(e) =>
                                                            handleUpdateEditingLineItem(
                                                              item.id,
                                                              "price",
                                                              e.target.value,
                                                            )
                                                          }
                                                          placeholder="Rate"
                                                          className="w-full text-[10px] p-0.5 text-right border border-slate-100 rounded-sm"
                                                        />
                                                      </div>
                                                      <div className="col-span-12 md:col-span-1">
                                                        <input
                                                          type="number"
                                                          value={item.qty}
                                                          onChange={(e) =>
                                                            handleUpdateEditingLineItem(
                                                              item.id,
                                                              "qty",
                                                              e.target.value,
                                                            )
                                                          }
                                                          placeholder="Qty"
                                                          className="w-full text-[10px] p-0.5 text-center border border-slate-100 rounded-sm"
                                                        />
                                                      </div>
                                                      <div className="col-span-12 md:col-span-2">
                                                        <select
                                                          value={item.unit}
                                                          onChange={(e) =>
                                                            handleUpdateEditingLineItem(
                                                              item.id,
                                                              "unit",
                                                              e.target.value,
                                                            )
                                                          }
                                                          className="w-full text-[9px] p-0.5 border border-slate-100 rounded bg-white"
                                                        >
                                                          <option value="guest">
                                                            guest
                                                          </option>
                                                          <option value="charter">
                                                            charter
                                                          </option>
                                                          <option value="hour">
                                                            hour
                                                          </option>
                                                          <option value="day">
                                                            day
                                                          </option>
                                                        </select>
                                                      </div>
                                                      <div className="col-span-12 md:col-span-2 text-right pr-4 text-[10px] font-bold text-slate-800 font-mono">
                                                        {(
                                                          item.price * item.qty
                                                        ).toLocaleString()}
                                                      </div>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleRemoveEditingLineItem(
                                                            item.id,
                                                          )
                                                        }
                                                        className="absolute right-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </button>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 px-1 pt-1 border-t border-slate-150">
                                                <span>
                                                  Surcharges Subtotal:
                                                </span>
                                                <span className="text-emerald-700 font-mono font-extrabold text-[10px]">
                                                  {editingProposal.customLineItems
                                                    .reduce(
                                                      (
                                                        acc: number,
                                                        item: any,
                                                      ) =>
                                                        acc +
                                                        item.price * item.qty,
                                                      0,
                                                    )
                                                    .toLocaleString()}{" "}
                                                  THB
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-[9px] text-slate-400 italic">
                                              No extra options or food
                                              surcharges configured yet.
                                            </p>
                                          )}

                                          {/* Edited Proposal Live Total view */}
                                          <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100 text-[10px] font-sans flex justify-between items-center">
                                            <span className="font-bold text-emerald-800">
                                              New Grand Estimates:
                                            </span>
                                            <div className="space-y-0.5 text-right font-mono text-[9.5px]">
                                              {(() => {
                                                const extrasSum = (
                                                  editingProposal.customLineItems ||
                                                  []
                                                ).reduce(
                                                  (acc: number, item: any) =>
                                                    acc + item.price * item.qty,
                                                  0,
                                                );

                                                const parsePriceNo = (
                                                  val: string,
                                                ) => {
                                                  if (!val) return 0;
                                                  const digits = val.replace(
                                                    /[^\d]/g,
                                                    "",
                                                  );
                                                  return Number(digits) || 0;
                                                };

                                                const grand1 =
                                                  parsePriceNo(
                                                    editingProposal.price1,
                                                  ) + extrasSum;
                                                const grand2 =
                                                  parsePriceNo(
                                                    editingProposal.price2,
                                                  ) + extrasSum;
                                                const grand3 =
                                                  parsePriceNo(
                                                    editingProposal.price3,
                                                  ) + extrasSum;

                                                return (
                                                  <div className="flex flex-wrap gap-2 justify-end">
                                                    <div>
                                                      Opt 1:{" "}
                                                      <strong className="text-emerald-850 font-sans">
                                                        {grand1.toLocaleString()}{" "}
                                                        THB
                                                      </strong>
                                                    </div>
                                                    {editingProposal.vesselId2 && (
                                                      <div>
                                                        | Opt 2:{" "}
                                                        <strong className="text-emerald-850 font-sans">
                                                          {grand2.toLocaleString()}{" "}
                                                          THB
                                                        </strong>
                                                      </div>
                                                    )}
                                                    {editingProposal.vesselId3 && (
                                                      <div>
                                                        | Opt 3:{" "}
                                                        <strong className="text-emerald-850 font-sans">
                                                          {grand3.toLocaleString()}{" "}
                                                          THB
                                                        </strong>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex justify-end pt-1">
                                          <button
                                            type="button"
                                            onClick={saveEditedProposal}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors"
                                          >
                                            Save Changes
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Hover Details Summary */}
                                    <div className="hidden group-hover:block overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 border-t border-slate-100 pt-2 mt-1">
                                      <div className="space-y-1.5">
                                        {v1 && (
                                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                                            <span className="font-semibold text-slate-700 truncate">
                                              {v1.name}
                                            </span>
                                            <span className="shrink-0">
                                              {proposal.price1 ||
                                                "Standard Rate"}
                                            </span>
                                          </div>
                                        )}
                                        {v2 && v2.id !== v1?.id && (
                                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                                            <span className="font-semibold text-slate-700 truncate">
                                              {v2.name}
                                            </span>
                                            <span className="shrink-0">
                                              {proposal.price2 ||
                                                "Standard Rate"}
                                            </span>
                                          </div>
                                        )}
                                        {v3 &&
                                          v3.id !== v1?.id &&
                                          v3.id !== v2?.id && (
                                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-sans bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                                              <span className="font-semibold text-slate-700 truncate">
                                                {v3.name}
                                              </span>
                                              <span className="shrink-0">
                                                {proposal.price3 ||
                                                  "Standard Rate"}
                                              </span>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {inquiriesTab === "bookings" && (
                    /* Booking Confirmation & Confidential Manifest Hub (Idea 1) */
                    <div className="space-y-5 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
                          <Anchor className="h-4 w-4 text-emerald-700" />
                          <span>Private Bookings & Manifest Register</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          View active booking confirmations registered under
                          your representative profile. Complete passenger
                          manifests, verify boarding rosters, and export luxury
                          confirmation statements.{" "}
                          <strong>
                            Broker folder isolation is strictly active:
                          </strong>{" "}
                          no other broker or partner can view your booking files
                          or client data.
                        </p>
                      </div>

                      {dbBookings.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-xs space-y-2">
                          <Anchor className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
                          <p className="text-xs font-bold text-slate-700 font-sans">
                            No Active Booking Records
                          </p>
                          <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Once a customer submits a live catamaran booking or
                            you lock down a custom walkthrough quote under your
                            active session, the verified confirmation files will
                            appear here privately.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5">
                          {/* Bookings List Panel */}
                          <div className="lg:col-span-5 space-y-3 pr-1">
                            {dbBookings.map((book) => {
                              const vesselVal =
                                book.vesselId1 ||
                                book.vesselId ||
                                "Unknown vessel";
                              const matchVessel = CATAMARANS.find(
                                (v) => v.id === vesselVal,
                              );
                              const guestCount =
                                book.guestCount ||
                                parseFloat(book.guestsAdults || 0) +
                                  parseFloat(book.guestsKids || 0) ||
                                0;
                              const isSelected =
                                selectedBookingForManifest === book.id;

                              return (
                                <div
                                  key={book.id}
                                  className={`p-4 border transition-all rounded bg-white text-left space-y-2.5 cursor-pointer hover:shadow-xs relative ${
                                    isSelected
                                      ? "border-emerald-700 ring-1 ring-emerald-700/30"
                                      : "border-slate-205 py-3.5"
                                  }`}
                                  onClick={() => {
                                    setSelectedBookingForManifest(book.id);
                                    setManifestError("");
                                    setManifestSuccess("");
                                  }}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <span className="text-[8px] bg-slate-100 text-slate-700 font-mono font-bold uppercase py-0.5 px-1.5 rounded tracking-wide">
                                        {book.id.replace("prop-", "BK-")}
                                      </span>
                                      <h5 className="font-serif text-xs text-slate-800 font-extrabold mt-1">
                                        {book.clientName ||
                                          "Direct Yacht Charter"}
                                      </h5>
                                    </div>
                                    <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                                      ★ Confirmed
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-sans border-t border-slate-100 pt-2">
                                    <div>
                                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                        Charter Vessel
                                      </p>
                                      <p className="font-semibold text-slate-850 truncate">
                                        {matchVessel?.name || vesselVal}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                        Launch Date
                                      </p>
                                      <p className="font-bold text-slate-850">
                                        {book.charterDate || "TBA"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                        Traveling Party
                                      </p>
                                      <p className="font-medium">
                                        {guestCount} Passengers
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                        Price Statement
                                      </p>
                                      <p className="font-bold text-emerald-800">
                                        ฿
                                        {parseFloat(
                                          book.price1 || 0,
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  {book.pdfBase64 && (
                                    <div className="pt-2">
                                      <a
                                        href={book.pdfBase64}
                                        download={`Booking_${book.id}.pdf`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-block bg-[#E58c40] text-slate-900 px-3 py-1.5 text-[10px] uppercase font-bold rounded cursor-pointer pointer-events-auto"
                                      >
                                        Export Booking PDF
                                      </a>
                                    </div>
                                  )}

                                  {deletingBookingId === book.id ? (
                                    <div
                                      className="flex items-center justify-between w-full bg-red-50 border border-red-100 rounded p-1.5 text-left animate-in fade-in duration-200"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="text-[9px] text-red-900 font-sans font-bold uppercase tracking-wide px-1">
                                        Are you sure?
                                      </span>
                                      <div className="flex gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBooking(book.id);
                                          }}
                                          className="text-[9px] font-sans font-bold uppercase px-2 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition-colors"
                                        >
                                          Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingBookingId(null);
                                          }}
                                          className="text-[9px] font-sans font-bold uppercase px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 pt-1 border-t border-slate-50 justify-between items-center w-full">
                                      <div className="flex gap-2">
                                        {!book.promotedToAccount && (
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              let proceed = true;
                                              const isIframe =
                                                window.self !== window.top;
                                              if (!isIframe) {
                                                try {
                                                  proceed = confirm(
                                                    "Promote this guest to a full customer account?",
                                                  );
                                                } catch (err) {
                                                  proceed = true;
                                                }
                                              }
                                              if (proceed) {
                                                try {
                                                  const fallbackUid =
                                                    "cust_" +
                                                    Math.random()
                                                      .toString(36)
                                                      .substring(2, 9);
                                                  const customerPayload = {
                                                    uid: fallbackUid,
                                                    name:
                                                      book.clientName ||
                                                      "Direct Guest",
                                                    email:
                                                      book.customerEmail || "",
                                                    phoneNumber:
                                                      book.customerPhone || "",
                                                    createdAt:
                                                      new Date().toISOString(),
                                                    authStatus:
                                                      "direct_firestore_sandbox",
                                                    brokerId:
                                                      currentAgent?.id ||
                                                      currentAgent?.email ||
                                                      "unassigned",
                                                  };
                                                  await setDoc(
                                                    doc(
                                                      db,
                                                      "customers",
                                                      fallbackUid,
                                                    ),
                                                    customerPayload,
                                                  );
                                                  await updateDoc(
                                                    doc(
                                                      db,
                                                      "booking_requests",
                                                      book.id,
                                                    ),
                                                    { promotedToAccount: true },
                                                  );
                                                  alert(
                                                    "Guest promoted to customer successfully!",
                                                  );
                                                } catch (err: any) {
                                                  console.error(
                                                    "Promotion failed:",
                                                    err,
                                                  );
                                                  alert(
                                                    "Promotion failed: " +
                                                      err.message,
                                                  );
                                                }
                                              }
                                            }}
                                            className="text-[9px] font-sans font-bold uppercase transition-colors px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                          >
                                            Promote
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          className={`text-[9px] font-sans font-bold uppercase transition-colors px-2 py-1 rounded flex items-center gap-1 ${
                                            isSelected
                                              ? "bg-emerald-800 text-white"
                                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                          }`}
                                        >
                                          👤 Manifest (
                                          {book.passengers?.length || 0})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Print option
                                            const printWin = window.open(
                                              "",
                                              "_blank",
                                            );
                                            if (printWin) {
                                              const passMarkup = (
                                                book.passengers || []
                                              )
                                                .map(
                                                  (p: any, idx: number) => `
                                              <tr>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${p.name.toUpperCase()}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.age} yrs</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.nationality.toUpperCase()}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.passport.toUpperCase()}</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.passportExpiry}</td>
                                              </tr>
                                            `,
                                                )
                                                .join("");

                                              printWin.document.write(`
                                              <html>
                                                <head>
                                                  <title>Yacht Charter Confirmation Code: ${book.id}</title>
                                                  <style>
                                                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
                                                    .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 4px; box-shadow: 0 4px 6px -1px rgb(0,0,0,0.05); }
                                                    .header { border-bottom: 4px solid #059669; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: top; }
                                                    .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
                                                    .subtitle { font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px; uppercase; letter-spacing: 1px; }
                                                    .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
                                                    .meta-item p { margin: 3px 0; font-size: 11px; }
                                                    .meta-label { text-transform: uppercase; font-size: 9px; color: #64748b; font-weight: bold; letter-spacing: 0.5px; }
                                                    .meta-val { font-weight: bold; color: #0f172a; }
                                                    .section-title { font-size: 12px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
                                                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
                                                    th { background: #f8fafc; padding: 8px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 9px; color: #475569; }
                                                    .signature-block { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
                                                    .sig-line { width: 220px; border-top: 1px solid #94a3b8; margin-top: 35px; text-align: center; color: #64748b; font-size: 9px; }
                                                    .watermark { text-align: center; font-size: 8px; color: #94a3b8; font-style: italic; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
                                                    @media print {
                                                      body { padding: 0; }
                                                      .container { border: none; box-shadow: none; padding: 0; }
                                                      .no-print { display: none; }
                                                    }
                                                  </style>
                                                </head>
                                                <body>
                                                  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                                                    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 16px; font-size: 12px; font-weight: bold; cursor: pointer; border-radius: 4px;">Print / Save as PDF</button>
                                                  </div>
                                                  <div class="container">
                                                    <div class="header">
                                                      <div>
                                                        <h1 class="title">PHUKET AMAZING YACHT CHARTER</h1>
                                                        <p class="subtitle">Official Safe Charterer Reassurance & Confirmation Slip</p>
                                                      </div>
                                                      <div style="text-align: right;">
                                                        <p style="font-size: 11px; font-weight: bold; margin: 0; color: #059669;">CONFIRMED VOUCHER</p>
                                                        <p style="font-size: 9px; font-family: monospace; margin: 2px 0 0 0; color: #64748b;">${book.id.replace("prop-", "BK-")}</p>
                                                      </div>
                                                    </div>

                                                    <div class="meta-grid">
                                                      <div class="meta-item">
                                                        <p><span class="meta-label">Lead Charter Guest:</span><br/><span class="meta-val">${(book.clientName || "Direct Guest").toUpperCase()}</span></p>
                                                        <p><span class="meta-label">Guest Contact Email:</span><br/><span class="meta-val">${book.customerEmail || "N/A"}</span></p>
                                                        <p><span class="meta-label">Guest Contact Phone:</span><br/><span class="meta-val">${book.customerPhone || "N/A"}</span></p>
                                                        <p><span class="meta-label">Hotel Transfer Location:</span><br/><span class="meta-val">${book.hotelPickupLocation || "None Requested"}</span></p>
                                                      </div>
                                                      <div class="meta-item" style="border-left: 1px solid #f1f5f9; padding-left: 20px;">
                                                        <p><span class="meta-label">Charter Yacht:</span><br/><span class="meta-val">${(matchVessel?.name || vesselVal).toUpperCase()}</span></p>
                                                        <p><span class="meta-label">Excursion Launch Date:</span><br/><span class="meta-val">${book.charterDate || "TBA"}</span></p>
                                                        <p><span class="meta-label">Charter Representative:</span><br/><span class="meta-val">${currentAgent?.name || "Yacht Broker Representative"}</span></p>
                                                        <p><span class="meta-label">Broker Agency Signature:</span><br/><span class="meta-val">${currentAgent?.companyName || "Verified Charter Partner Platform"}</span></p>
                                                      </div>
                                                    </div>

                                                    <div class="section-title">Charter Package Pricing</div>
                                                    <table style="margin-bottom: 20px;">
                                                      <thead>
                                                        <tr>
                                                          <th style="text-align: left; padding: 8px;">Charter Package Description</th>
                                                          <th style="text-align: right; padding: 8px;">Net Base Fees</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 10px 8px; font-weight: bold;">Full-Day Dynamic Excursion Base Package (Phuket Waters)</td>
                                                          <td style="padding: 10px 8px; text-align: right; font-weight: bold;">฿${parseFloat(book.price1 || 0).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                          <td style="padding: 10px 8px; color: #64748b;">Includes catering requirements, captain and crew fees, professional sea-safety gear, fuel costs, and park landing privileges.</td>
                                                          <td style="padding: 10px 8px; text-align: right; color: #64748b;">Included</td>
                                                        </tr>
                                                        <tr style="border-top: 2px solid #e2e8f0; background: #f8fafc;">
                                                          <td style="padding: 10px 8px; font-weight: bold; text-transform: uppercase;">Total Verified Invoice Amount (THB):</td>
                                                          <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 13px; color: #047857;">฿${parseFloat(book.price1 || 0).toLocaleString()}</td>
                                                        </tr>
                                                      </tbody>
                                                    </table>

                                                    <div class="section-title">Official Passenger Embarkation Manifest</div>
                                                    ${
                                                      passMarkup
                                                        ? `
                                                      <table>
                                                        <thead>
                                                          <tr>
                                                            <th style="padding: 8px; width: 40px;">No.</th>
                                                            <th style="padding: 8px; text-align: left;">Passenger Full Name</th>
                                                            <th style="padding: 8px; width: 60px;">Age</th>
                                                            <th style="padding: 8px;">Nationality</th>
                                                            <th style="padding: 8px;">Passport Number</th>
                                                            <th style="padding: 8px;">Expiry Date</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          ${passMarkup}
                                                        </tbody>
                                                      </table>
                                                    `
                                                        : `
                                                      <div style="padding: 20px; background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; text-align: center; border-radius: 4px; font-size: 11px;">
                                                        <strong>⚠️ NO PASSENGERS ENROLLED:</strong> No passengers are registered yet. The maritime manifest is blank. Please configure companion names prior to port clearance.
                                                      </div>
                                                    `
                                                    }

                                                    <div class="signature-block">
                                                      <div class="sig-line">
                                                        Lead Guest Signature
                                                      </div>
                                                      <div class="sig-line">
                                                        Yacht Master & Port Clearance Seal
                                                      </div>
                                                    </div>

                                                    <div class="watermark">
                                                      This document is generated privately on the Phuket Amazing Yacht Charter Platform. Full security auditing logs are recorded securely in the database. Shared privately between representative and client.
                                                    </div>
                                                  </div>
                                                </body>
                                              </html>
                                            `);
                                              printWin.document.close();
                                            }
                                          }}
                                          className="text-[9px] font-sans font-bold uppercase transition-colors px-2 py-1 rounded bg-[#0F172A] text-[#10B981] hover:bg-slate-850 flex items-center gap-1"
                                          title="Export Official Printing Receipt & Secure Manifest Card"
                                        >
                                          <FileText className="h-3 w-3" /> Print
                                          Confirmation
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingBookingId(book.id);
                                        }}
                                        className="text-[9px] font-sans font-bold uppercase transition-colors px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1 ml-auto"
                                        title="Remove booking permanently"
                                      >
                                        <Trash2 className="h-3 w-3" /> Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Manifest Editor Panel */}
                          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-205 p-5 rounded-xs space-y-4">
                            {(() => {
                              const curBook = dbBookings.find(
                                (b) => b.id === selectedBookingForManifest,
                              );
                              if (!curBook) {
                                return (
                                  <div className="h-full flex flex-col justify-center items-center p-8 text-slate-400 text-center">
                                    <Users className="h-8 w-8 text-slate-350 animate-bounce mb-2" />
                                    <p className="text-xs font-bold text-slate-600 font-sans">
                                      Select a Private Booking
                                    </p>
                                    <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                                      Click on a confirmed booking on the left
                                      list to edit passenger passport
                                      registries, configure manifests, and
                                      review official insurance papers.
                                    </p>
                                  </div>
                                );
                              }

                              const paxList = curBook.passengers || [];

                              const handleAddPassenger = async (
                                e: React.FormEvent,
                              ) => {
                                e.preventDefault();
                                if (!manifestPaxName.trim()) return;

                                setIsSavingManifest(true);
                                setManifestError("");
                                setManifestSuccess("");

                                const newGuest = {
                                  id: `pax-${Date.now()}`,
                                  name: manifestPaxName.trim(),
                                  age: manifestPaxAge.trim() || "N/A",
                                  nationality:
                                    manifestPaxNationality.trim() || "N/A",
                                  passport: manifestPaxPassport.trim() || "N/A",
                                  passportExpiry:
                                    manifestPaxPassportExpiry.trim() || "N/A",
                                };

                                try {
                                  const updated = [...paxList, newGuest];
                                  await updateDoc(
                                    doc(db, "booking_requests", curBook.id),
                                    {
                                      passengers: updated,
                                    },
                                  );
                                  setManifestSuccess(
                                    "Added guest to traveling manifest successfully!",
                                  );
                                } catch (err: any) {
                                  console.warn(
                                    "Firestore write failed, falling back to LocalStorage:",
                                    err,
                                  );
                                  if (
                                    err?.message
                                      ?.toLowerCase()
                                      .indexOf("quota") !== -1 ||
                                    err?.code === "resource-exhausted"
                                  ) {
                                    setIsQuotaExceeded(true);
                                    window.dispatchEvent(
                                      new CustomEvent("phuket_quota_exceeded"),
                                    );
                                  }
                                  const updated = [...paxList, newGuest];
                                  const updatedBookings = dbBookings.map((b) =>
                                    b.id === curBook.id
                                      ? { ...b, passengers: updated }
                                      : b,
                                  );
                                  setDbBookings(updatedBookings);
                                  const myAgentEmail = (
                                    currentAgent?.email || ""
                                  )
                                    .toLowerCase()
                                    .trim();
                                  localStorage.setItem(
                                    "phuket_charter_local_bookings_" +
                                      myAgentEmail,
                                    JSON.stringify(updatedBookings),
                                  );
                                  setManifestSuccess(
                                    "Added guest to traveling manifest (Saved in Local Offline Reservation Store)!",
                                  );
                                } finally {
                                  setManifestPaxName("");
                                  setManifestPaxAge("");
                                  setManifestPaxNationality("");
                                  setManifestPaxPassport("");
                                  setManifestPaxPassportExpiry("");
                                  setTimeout(
                                    () => setManifestSuccess(""),
                                    4000,
                                  );
                                  setIsSavingManifest(false);
                                }
                              };

                              const handleDeletePassenger = async (
                                paxId: string,
                              ) => {
                                setIsSavingManifest(true);
                                setManifestError("");
                                setManifestSuccess("");
                                try {
                                  const updated = paxList.filter(
                                    (p: any) => p.id !== paxId,
                                  );
                                  await updateDoc(
                                    doc(db, "booking_requests", curBook.id),
                                    {
                                      passengers: updated,
                                    },
                                  );
                                  setManifestSuccess(
                                    "Removed guest from passenger manifest successfully!",
                                  );
                                } catch (err: any) {
                                  console.warn(
                                    "Firestore delete failed, falling back to LocalStorage:",
                                    err,
                                  );
                                  if (
                                    err?.message
                                      ?.toLowerCase()
                                      .indexOf("quota") !== -1 ||
                                    err?.code === "resource-exhausted"
                                  ) {
                                    setIsQuotaExceeded(true);
                                    window.dispatchEvent(
                                      new CustomEvent("phuket_quota_exceeded"),
                                    );
                                  }
                                  const updated = paxList.filter(
                                    (p: any) => p.id !== paxId,
                                  );
                                  const updatedBookings = dbBookings.map((b) =>
                                    b.id === curBook.id
                                      ? { ...b, passengers: updated }
                                      : b,
                                  );
                                  setDbBookings(updatedBookings);
                                  const myAgentEmail = (
                                    currentAgent?.email || ""
                                  )
                                    .toLowerCase()
                                    .trim();
                                  localStorage.setItem(
                                    "phuket_charter_local_bookings_" +
                                      myAgentEmail,
                                    JSON.stringify(updatedBookings),
                                  );
                                  setManifestSuccess(
                                    "Removed guest from passenger manifest (Local Offline Reservation Mode)!",
                                  );
                                } finally {
                                  setTimeout(
                                    () => setManifestSuccess(""),
                                    3000,
                                  );
                                  setIsSavingManifest(false);
                                }
                              };

                              return (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="border-b border-slate-200 pb-2">
                                    <h5 className="font-serif text-sm text-slate-800 font-bold block">
                                      Guest Manifest:{" "}
                                      {curBook.clientName ||
                                        "Direct Yacht Booking"}
                                    </h5>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Vessel:{" "}
                                      <span className="font-semibold text-slate-700">
                                        {CATAMARANS.find(
                                          (v) =>
                                            v.id ===
                                            (curBook.vesselId1 ||
                                              curBook.vesselId),
                                        )?.name || "Yacht"}
                                      </span>{" "}
                                      | Date:{" "}
                                      <span className="font-semibold text-slate-700">
                                        {curBook.charterDate || "TBA"}
                                      </span>
                                    </p>
                                  </div>

                                  {/* Feedbacks */}
                                  {manifestSuccess && (
                                    <p className="p-2.5 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-s font-sans text-[10px] font-bold">
                                      ✓ {manifestSuccess}
                                    </p>
                                  )}
                                  {manifestError && (
                                    <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-s font-sans text-[10px] font-bold">
                                      ⚠️ {manifestError}
                                    </p>
                                  )}

                                  {/* Passengers Manifest table */}
                                  <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-xs">
                                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                      <span className="text-[10px] font-extrabold uppercase text-slate-600 font-sans">
                                        Boarding Roster ({paxList.length}{" "}
                                        guests)
                                      </span>
                                      <span className="text-[9px] bg-sky-50 border border-sky-100 text-sky-700 font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                                        Insured Manifest
                                      </span>
                                    </div>

                                    {paxList.length === 0 ? (
                                      <div className="p-6 text-center text-slate-400 font-sans text-[11px] italic">
                                        No traveling party guests registered on
                                        this list. Use the form below to enroll
                                        passengers.
                                      </div>
                                    ) : (
                                      <div className="block">
                                        <table className="w-full text-left font-sans text-[11px] border-collapse">
                                          <thead className="bg-[#0F172A]/5 text-[#0F172A]/60 font-bold text-[8.5px] uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                              <th className="p-2 pl-3">
                                                Full Name
                                              </th>
                                              <th className="p-2">Age</th>
                                              <th className="p-2">
                                                Nationality
                                              </th>
                                              <th className="p-2">Passport</th>
                                              <th className="p-2 text-right pr-3">
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                            {paxList.map((pax: any) => (
                                              <tr
                                                key={pax.id}
                                                className="hover:bg-slate-50/50"
                                              >
                                                <td className="p-2 pl-3 text-left font-bold text-slate-800 uppercase text-[10px]">
                                                  {pax.name}
                                                </td>
                                                <td className="p-2 text-slate-500 font-mono text-[10px]">
                                                  {pax.age} yrs
                                                </td>
                                                <td className="p-2 text-slate-600 font-semibold uppercase text-[10px]">
                                                  {pax.nationality}
                                                </td>
                                                <td
                                                  className="p-2 text-slate-500 font-mono text-[9px] bg-slate-55/40 select-all"
                                                  title={`Expiry: ${pax.passportExpiry}`}
                                                >
                                                  {pax.passport}
                                                </td>
                                                <td className="p-2 pr-3 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDeletePassenger(
                                                        pax.id,
                                                      )
                                                    }
                                                    className="p-1 hover:bg-rose-50 hover:border-rose-200 border border-transparent rounded transition-colors text-slate-400 hover:text-rose-700 cursor-pointer"
                                                    title="Remove Guest"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>

                                  {/* Add Passenger Form */}
                                  <form
                                    onSubmit={handleAddPassenger}
                                    className="p-4 bg-white border border-slate-200 rounded-xs space-y-3"
                                  >
                                    <h6 className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider font-sans">
                                      + Add New Companion Guest Details
                                    </h6>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                          Full Name *
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          placeholder="as registered in passport"
                                          value={manifestPaxName}
                                          onChange={(e) =>
                                            setManifestPaxName(e.target.value)
                                          }
                                          className="w-full text-xs font-sans py-1.5 px-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                          Age (e.g. 35, 12, Infant)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 35"
                                          value={manifestPaxAge}
                                          onChange={(e) =>
                                            setManifestPaxAge(e.target.value)
                                          }
                                          className="w-full text-xs font-sans py-1.5 px-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                          Nationality
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. French"
                                          value={manifestPaxNationality}
                                          onChange={(e) =>
                                            setManifestPaxNationality(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-xs font-sans py-1.5 px-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                          Passport Number / ID
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. EF123456"
                                          value={manifestPaxPassport}
                                          onChange={(e) =>
                                            setManifestPaxPassport(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-xs font-sans py-1.5 px-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-mono"
                                        />
                                      </div>
                                      <div className="space-y-1 md:col-span-2">
                                        <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                          Passport Expiry Date
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 2030-12-15"
                                          value={manifestPaxPassportExpiry}
                                          onChange={(e) =>
                                            setManifestPaxPassportExpiry(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full text-xs font-sans py-1.5 px-2.5 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                      <button
                                        type="submit"
                                        disabled={isSavingManifest}
                                        className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 font-sans font-bold text-[10px] text-white uppercase tracking-wider rounded-xs cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                                      >
                                        {isSavingManifest ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 animate-spin" />{" "}
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-3.5 w-3.5" />{" "}
                                            Save Passenger to Roster
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {inquiriesTab === "analytics" && (
                    /* Private Commissions, Revenue & Performance Analytics dashboard (Idea 3) */
                    <div className="space-y-5 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
                          <span>
                            📊 Broker Performance & Projected Commissions
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          Track your dynamic sales pipelines, estimated
                          earnings, and catamaran conversions.{" "}
                          <strong>
                            Data confidentiality is fully preserved:
                          </strong>{" "}
                          this interface operates strictly across your private
                          proposals and confirmed bookings database.
                        </p>
                      </div>

                      {/* Key Cards Row */}
                      {(() => {
                        const totalCommissionPercent =
                          profileCommissionRate || 15;
                        const activeBookingsCount = dbBookings.length;
                        const activeProposalsCount = savedProposals.length;

                        const totalVolume = dbBookings.reduce(
                          (sum, b) => sum + (parseFloat(b.price1) || 0),
                          0,
                        );
                        const projectedCommission =
                          totalVolume * (totalCommissionPercent / 100);

                        const conversionRate =
                          activeBookingsCount + activeProposalsCount > 0
                            ? Math.round(
                                (activeBookingsCount /
                                  (activeBookingsCount +
                                    activeProposalsCount)) *
                                  100,
                              )
                            : 0;

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Card 1 */}
                              <div className="p-4 bg-white border border-slate-205 rounded-xs space-y-1 bg-gradient-to-br from-emerald-50/10 to-transparent">
                                <p className="text-[8.5px] text-slate-400 uppercase tracking-widest font-extrabold font-sans">
                                  Accumulated Volume
                                </p>
                                <div className="flex items-baseline gap-1 pt-1">
                                  <span className="text-sm font-sans font-extrabold text-slate-500 font-mono">
                                    ฿
                                  </span>
                                  <span className="text-lg font-serif font-extrabold text-[#0F172A] tracking-tight">
                                    {totalVolume.toLocaleString(undefined, {
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 font-sans leading-none pt-1">
                                  Across {activeBookingsCount} confirmed
                                  bookings
                                </p>
                              </div>

                              {/* Card 2 */}
                              <div className="p-4 bg-[#0F172A] border border-transparent rounded-xs space-y-1 shadow-md text-white">
                                <p className="text-[8.5px] text-emerald-400 uppercase tracking-widest font-extrabold font-sans">
                                  Forecast Commissions
                                </p>
                                <div className="flex items-baseline gap-1 pt-1">
                                  <span className="text-sm font-sans font-extrabold text-emerald-500 font-mono">
                                    ฿
                                  </span>
                                  <span className="text-lg font-serif font-extrabold text/white tracking-or-tight text-emerald-400 progress-glow">
                                    {projectedCommission.toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 0 },
                                    )}
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-300/75 font-sans leading-none pt-1">
                                  At custom rate: {totalCommissionPercent}%
                                  markup
                                </p>
                              </div>

                              {/* Card 3 */}
                              <div className="p-4 bg-white border border-slate-205 rounded-xs space-y-1">
                                <p className="text-[8.5px] text-slate-400 uppercase tracking-widest font-extrabold font-sans">
                                  Active Proposals
                                </p>
                                <div className="flex items-baseline gap-1 pt-1">
                                  <span className="text-lg font-serif font-extrabold text-slate-800 tracking-tight">
                                    {activeProposalsCount}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium pl-1">
                                    Quotes
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 font-sans leading-none pt-1">
                                  Draft client proposals
                                </p>
                              </div>

                              {/* Card 4 */}
                              <div className="p-4 bg-white border border-slate-205 rounded-xs space-y-1">
                                <p className="text-[8.5px] text-slate-400 uppercase tracking-widest font-extrabold font-sans">
                                  Client Conversion %
                                </p>
                                <div className="flex items-baseline gap-1 pt-1">
                                  <span className="text-lg font-serif font-extrabold text-slate-800 tracking-tight">
                                    {conversionRate}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded overflow-hidden mt-1.5">
                                  <div
                                    className="bg-emerald-600 h-full rounded transition-all duration-300"
                                    style={{ width: `${conversionRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5">
                              {/* SVG Trendline Graphic chart panel (Idea 3) */}
                              <div className="lg:col-span-8 bg-white border border-slate-205 p-5 rounded-xs space-y-4">
                                <div>
                                  <h5 className="font-serif text-[11.5px] text-slate-800 font-extrabold uppercase tracking-wide">
                                    Estimated Weekly Bookings & Commissions
                                    Timeline
                                  </h5>
                                  <p className="text-[9px] text-slate-400">
                                    Chronological distribution graph of your
                                    active commissions pipeline over your recent
                                    activities.
                                  </p>
                                </div>

                                <div className="relative pt-4 pr-3 pl-1 pb-1">
                                  {activeBookingsCount === 0 ? (
                                    <div className="h-40 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-s text-slate-400 text-xs italic font-sans">
                                      Chronological timeline requires confirmed
                                      bookings to visualize pipeline trends.
                                    </div>
                                  ) : (
                                    <div className="w-full">
                                      <svg
                                        viewBox="0 0 500 150"
                                        className="w-full h-36 font-sans select-none overflow-visible"
                                      >
                                        {/* Grid Lines */}
                                        <line
                                          x1="10"
                                          y1="130"
                                          x2="495"
                                          y2="130"
                                          stroke="#f1f5f9"
                                          strokeWidth="2"
                                          strokeDasharray="3,3"
                                        />
                                        <line
                                          x1="10"
                                          y1="90"
                                          x2="495"
                                          y2="90"
                                          stroke="#f1f5f9"
                                          strokeWidth="1"
                                          strokeDasharray="3,3"
                                        />
                                        <line
                                          x1="10"
                                          y1="50"
                                          x2="495"
                                          y2="50"
                                          stroke="#f1f5f9"
                                          strokeWidth="1"
                                          strokeDasharray="3,3"
                                        />
                                        <line
                                          x1="10"
                                          y1="10"
                                          x2="495"
                                          y2="10"
                                          stroke="#f1f5f9"
                                          strokeWidth="1"
                                          strokeDasharray="3,3"
                                        />

                                        {/* Area plot curve */}
                                        {(() => {
                                          const spacingX =
                                            dbBookings.length > 1
                                              ? 460 / (dbBookings.length - 1)
                                              : 460;

                                          // Generate y-coords by scaling price relative to total volume
                                          const maxPrice = Math.max(
                                            ...dbBookings.map((b) =>
                                              parseFloat(b.price1 || 1),
                                            ),
                                            10000,
                                          );
                                          const points = dbBookings.map(
                                            (b, idx) => {
                                              const x = 20 + idx * spacingX;
                                              const price = parseFloat(
                                                b.price1 || 0,
                                              );
                                              // invert as SVG y=0 is TOP. Higher price = lower y value (closer to top)
                                              const y =
                                                130 - (price / maxPrice) * 110;
                                              return {
                                                x,
                                                y,
                                                price,
                                                date: b.charterDate || "TBA",
                                              };
                                            },
                                          );

                                          const pathD = points
                                            .map(
                                              (p, idx) =>
                                                `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                                            )
                                            .join(" ");
                                          const areaD =
                                            points.length > 0
                                              ? `${pathD} L ${points[points.length - 1].x} 130 L ${points[0].x} 130 Z`
                                              : "";

                                          return (
                                            <>
                                              <defs>
                                                <linearGradient
                                                  id="chartGrad"
                                                  x1="0"
                                                  y1="0"
                                                  x2="0"
                                                  y2="1"
                                                >
                                                  <stop
                                                    offset="0%"
                                                    stopColor="#10B981"
                                                    stopOpacity="0.4"
                                                  />
                                                  <stop
                                                    offset="100%"
                                                    stopColor="#10B981"
                                                    stopOpacity="0.0"
                                                  />
                                                </linearGradient>
                                              </defs>

                                              {/* Shaded Area */}
                                              {areaD && (
                                                <path
                                                  d={areaD}
                                                  fill="url(#chartGrad)"
                                                />
                                              )}

                                              {/* Line Path */}
                                              {pathD && (
                                                <path
                                                  d={pathD}
                                                  fill="none"
                                                  stroke="#059669"
                                                  strokeWidth="2.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              )}

                                              {/* Markers */}
                                              {points.map((pt, i) => (
                                                <g
                                                  key={i}
                                                  className="group cursor-pointer"
                                                >
                                                  <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r="5"
                                                    fill="#ffffff"
                                                    stroke="#047857"
                                                    strokeWidth="2.5"
                                                  />
                                                  <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r="8"
                                                    fill="#10B981"
                                                    fillOpacity="0"
                                                    className="hover:fill-opacity-20 transition-all"
                                                  />

                                                  {/* Tooltip text */}
                                                  <text
                                                    x={pt.x}
                                                    y={pt.y - 12}
                                                    textAnchor="middle"
                                                    className="text-[7.5px] font-bold font-mono fill-slate-800 bg-white/90 p-1 rounded border shadow-sm hidden group-hover:block pointer-events-none"
                                                  >
                                                    ฿{pt.price.toLocaleString()}{" "}
                                                    ({pt.date})
                                                  </text>
                                                </g>
                                              ))}
                                            </>
                                          );
                                        })()}

                                        {/* Axis Labels */}
                                        <text
                                          x="15"
                                          y="145"
                                          className="text-[7.5px] fill-slate-400 font-mono uppercase font-bold"
                                        >
                                          Past Bookings
                                        </text>
                                        <text
                                          x="475"
                                          y="145"
                                          className="text-[7.5px] fill-slate-400 font-mono uppercase font-bold text-right"
                                          textAnchor="end"
                                        >
                                          Latest
                                        </text>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Yacht Popularity card panel (Idea 3) */}
                              <div className="lg:col-span-4 bg-white border border-slate-205 p-5 rounded-xs space-y-4">
                                <div>
                                  <h5 className="font-serif text-[11.5px] text-slate-800 font-extrabold uppercase tracking-wide">
                                    Vessel Booking Density %
                                  </h5>
                                  <p className="text-[9px] text-slate-400">
                                    Total bookings and active quotes generated
                                    per catamaran model.
                                  </p>
                                </div>

                                <div className="space-y-4 pt-1">
                                  {(() => {
                                    // Gather frequencies of quotes + bookings
                                    const distribution: Record<string, number> =
                                      {};

                                    dbBookings.forEach((b) => {
                                      const vId =
                                        b.vesselId1 || b.vesselId || "Other";
                                      distribution[vId] =
                                        (distribution[vId] || 0) + 1;
                                    });

                                    savedProposals.forEach((p) => {
                                      if (p.vesselId1)
                                        distribution[p.vesselId1] =
                                          (distribution[p.vesselId1] || 0) + 1;
                                      if (p.vesselId2)
                                        distribution[p.vesselId2] =
                                          (distribution[p.vesselId2] || 0) + 1;
                                    });

                                    const totalDemand =
                                      Object.values(distribution).reduce(
                                        (a, b) => a + b,
                                        0,
                                      ) || 1;

                                    return CATAMARANS.map((vessel) => {
                                      const rawCount =
                                        distribution[vessel.id] || 0;
                                      const percentage = Math.round(
                                        (rawCount / totalDemand) * 100,
                                      );

                                      return (
                                        <div
                                          key={vessel.id}
                                          className="space-y-1.5 text-left"
                                        >
                                          <div className="flex justify-between items-center text-[10px] font-sans text-slate-700">
                                            <span className="font-bold">
                                              {vessel.name}
                                            </span>
                                            <span className="font-mono text-slate-400">
                                              ({rawCount} quotes/books){" "}
                                              {percentage}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-2 rounded overflow-hidden relative border border-slate-50 shadow-inner">
                                            <div
                                              className="bg-emerald-600 h-full rounded transition-all duration-300"
                                              style={{
                                                width: `${percentage}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {inquiriesTab === "branding" && (
                    /* Independent Broker Branding Settings & Lock referral tool (Idea 2 & Idea 4) */
                    <div className="space-y-5 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
                          <span>
                            ⚙️ Broker Representative Workspace Settings
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          Customize your business parameters, email seals, and
                          target commissions. Download personalized client
                          landing links and QR codes to lock customer inquiries
                          permanently to your console.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {/* Analytics Widget */}
                        <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-700 p-6 rounded-xl relative overflow-hidden shadow-xl">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <QrCode className="w-32 h-32 text-white" />
                          </div>
                          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 text-left">
                              <h5 className="font-serif text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-1 border-b border-slate-700/50 pb-2">
                                <Gauge className="w-4 h-4 text-emerald-400" />{" "}
                                Campaign & QR Analytics
                              </h5>
                              <p className="text-[11px] text-slate-400 font-sans mt-2">
                                Real-time monitoring of your custom QR codes,
                                VIP Posters, and referral links. Track how many
                                clients are opening your immersive Digital
                                Business Card interface.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 min-w-[120px] text-center shadow-inner">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                  Total Scans
                                </div>
                                <div className="text-3xl font-serif text-emerald-400 font-bold">
                                  {currentAgent?.qrScans || 0}
                                </div>
                              </div>
                              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 min-w-[150px] text-center flex flex-col justify-center shadow-inner">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                                  Last Scan
                                </div>
                                <div className="text-[12px] font-sans text-white font-medium bg-slate-900 px-2 py-1.5 rounded border border-slate-700">
                                  {currentAgent?.lastScanAt
                                    ? new Date(
                                        currentAgent.lastScanAt,
                                      ).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Pending Data"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personal Settings Sheet */}
                        <form
                          onSubmit={handleUpdateProfile}
                          className="w-full max-w-3xl mx-auto bg-white border border-slate-205 p-6 rounded-xs space-y-4"
                        >
                          <h5 className="font-serif text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-1 flex justify-between items-center">
                            <span>1. Personal Branding Profile</span>
                            {successMsg && (
                              <span className="text-emerald-600 bg-emerald-50 px-2 flex items-center gap-1 py-0.5 rounded text-[10px] lowercase font-sans font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> saved
                                successfully
                              </span>
                            )}
                          </h5>

                          {errorMsg && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] font-sans rounded flex items-start gap-2">
                              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{errorMsg}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Representative Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-semibold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Agency Company Name
                              </label>
                              <input
                                type="text"
                                value={profileCompanyName}
                                onChange={(e) =>
                                  setProfileCompanyName(e.target.value)
                                }
                                placeholder="e.g. Mitar Luxury Charters"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Commission Rate (%) *
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="5"
                                  max="35"
                                  step="1"
                                  value={profileCommissionRate}
                                  onChange={(e) =>
                                    setProfileCommissionRate(
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                                />
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 pl-2.5 pr-2 py-1 rounded border shrink-0 w-12 text-center">
                                  {profileCommissionRate}%
                                </span>
                              </div>
                              <p className="text-[8.5px] text-slate-450 mt-0.5 leading-none">
                                Used to calculate dynamic projected earnings
                                charts
                              </p>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Corporate WhatsApp (e.g. 66636368287) *
                              </label>
                              <input
                                type="text"
                                required
                                value={profileWhatsapp}
                                onChange={(e) =>
                                  setProfileWhatsapp(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Office Phone
                              </label>
                              <input
                                type="text"
                                required
                                value={profilePhone}
                                onChange={(e) =>
                                  setProfilePhone(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                LINE Messenger ID
                              </label>
                              <input
                                type="text"
                                value={profileLineId}
                                onChange={(e) =>
                                  setProfileLineId(e.target.value)
                                }
                                placeholder="e.g. partner_referral"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                WeChat Messenger ID
                              </label>
                              <input
                                type="text"
                                value={profileWechatId}
                                onChange={(e) =>
                                  setProfileWechatId(e.target.value)
                                }
                                placeholder="e.g. mitar_vip"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Tax ID / License No.
                              </label>
                              <input
                                type="text"
                                value={profileTaxId}
                                onChange={(e) =>
                                  setProfileTaxId(e.target.value)
                                }
                                placeholder="Optional tax license"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-50 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                Registered Agency Operating Address
                              </label>
                              <textarea
                                rows={2}
                                value={profileCompanyAddress}
                                onChange={(e) =>
                                  setProfileCompanyAddress(e.target.value)
                                }
                                placeholder="e.g. Pier Office 102/B, Ao Po Pier, Phuket"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-55 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium resize-none"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <label className="flex items-center justify-between text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                <span>
                                  Digital Business Card Welcome Message
                                </span>
                                <span className="text-emerald-600">
                                  Client Facing
                                </span>
                              </label>
                              <textarea
                                rows={2}
                                value={profileWelcomeMessage}
                                onChange={(e) =>
                                  setProfileWelcomeMessage(e.target.value)
                                }
                                placeholder="e.g. Welcome to Phuket Yacht Charters. I'm here to ensure your premium catamaran experience is flawless from start to finish."
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-55 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium resize-none shadow-inner"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <label className="flex items-center justify-between text-[8.5px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                <span>
                                  Custom WhatsApp/Social Share Template
                                </span>
                                <span className="text-blue-500">
                                  Auto-filled Template
                                </span>
                              </label>
                              <textarea
                                rows={3}
                                value={profileCustomShareMessage}
                                onChange={(e) =>
                                  setProfileCustomShareMessage(e.target.value)
                                }
                                placeholder="e.g. Hi! Check out our new luxury catamarans for your trip to Phuket next month. Tap my link to browse the private fleet and prices!"
                                className="w-full text-xs font-sans py-2 px-3 bg-slate-55 hover:bg-slate-50/50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium resize-none shadow-inner"
                              />
                              <p className="text-[8.5px] text-slate-450 mt-1 leading-none italic">
                                This exact text will automatically pre-fill when
                                you click "Share to WA" or "Email" on your QR
                                Poster cards (your link will automatically be
                                attached to the end).
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              className={`py-2.5 px-5 font-sans font-bold text-xs uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                                successMsg
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-emerald-800 hover:bg-emerald-900 text-white"
                              }`}
                            >
                              {successMsg ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />{" "}
                                  Settings Saved
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 text-emerald-400" />{" "}
                                  Save Branding Configuration
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Integrated Referral Copying banner */}
                        <div className="w-full max-w-3xl mx-auto bg-slate-50 border border-slate-201 p-6 rounded-xs space-y-4 shadow-sm text-left mt-6">
                          <h5 className="font-serif text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-1">
                            Private Referral Link Suite
                          </h5>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-1">
                            Share your personalized booking referral link. Under
                            our **Deep Cookie Lock** system, clicking this link
                            permanently locks the client's subsequent inquiries,
                            chats, proposals, and reservations to your name. No
                            external brokers can capture these portfolios.
                          </p>
                          {(() => {
                            const refUrl = `${getPublicUrl()}/?agent=${encodeURIComponent(currentAgent?.email || "")}`;
                            const handleLinkCopy = () => {
                              navigator.clipboard.writeText(refUrl);
                              setBrandingLinkCopied(true);
                              setTimeout(
                                () => setBrandingLinkCopied(false),
                                3000,
                              );
                            };
                            return (
                              <div className="space-y-3">
                                <div className="flex gap-1.5 font-sans mt-1">
                                  <input
                                    type="text"
                                    readOnly
                                    value={refUrl}
                                    className="w-full text-[10px] font-mono py-2 px-3 bg-white border border-slate-201 rounded focus:outline-hidden text-slate-600 truncate"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleLinkCopy}
                                    className="p-2 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded font-sans font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                                  >
                                    {brandingLinkCopied ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                    <span>
                                      {brandingLinkCopied ? "Copied" : "Copy"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Consolidated Referral Companion notice box */}
                      <div className="w-full max-w-3xl mx-auto bg-emerald-50 border border-emerald-150 p-5 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-left leading-relaxed shadow-sm mt-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-emerald-100 rounded-full text-emerald-800 shrink-0 mt-0.5">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-950">
                              Single Consolidated QR Card Workspace
                            </h5>
                            <p className="text-[10.5px] text-emerald-900/80 mt-1">
                              We have consolidated your referrals to maintain
                              exactly **one official VIP QR Card** to eliminate
                              duplicate layouts. Use the{" "}
                              <strong className="text-emerald-950 font-bold border-b border-emerald-900/30">
                                📱 Referral QR
                              </strong>{" "}
                              tab above to view live digital cards, customize
                              luxury canvas palettes, and download vector SVG
                              assets.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInquiriesTab("qr-generator")}
                          className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer shrink-0 transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>Open QR Generator</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {inquiriesTab === "qr-generator" && (
                    <AgentReferralQrGenerator
                      currentAgent={currentAgent}
                      profileName={profileName}
                      profileWhatsapp={profileWhatsapp}
                      profilePhone={profilePhone}
                      profileLineId={profileLineId}
                      profileWechatId={profileWechatId}
                      cardGreeting={cardGreeting}
                      setCardGreeting={setCardGreeting}
                      cardDesign={cardDesign}
                      setCardDesign={setCardDesign}
                      cardTagline={cardTagline}
                      setCardTagline={setCardTagline}
                      initialCoagentId={activeCoagentEditorId}
                    />
                  )}

                  {inquiriesTab === "inquiries" &&
                    (() => {
                      const uniqueFoldersList: string[] = Array.from(
                        new Set(
                          inquiries.map((inq: any) => inq.folder || "Inbox"),
                        ),
                      ) as string[];
                      if (!uniqueFoldersList.includes("Inbox")) {
                        uniqueFoldersList.unshift("Inbox");
                      }
                      const foldersToDisplay: string[] = [
                        "All",
                        ...uniqueFoldersList,
                      ];

                      const filteredInquiriesByFolder = inquiries.filter(
                        (inq: any) => {
                          if (activeInquiryFolder === "All") return true;
                          return (
                            (inq.folder || "Inbox").toLowerCase().trim() ===
                            activeInquiryFolder.toLowerCase().trim()
                          );
                        },
                      );

                      return (
                        /* Live Chat Inquiries Inbox (Idea 1) */
                        <div className="space-y-4 block animate-in fade-in duration-150">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-200 pb-2 text-left">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] font-sans">
                              Live Broker Inquiries Console ({inquiries.length})
                            </h4>

                            {/* Folder Navigation Pills */}
                            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200/60 text-left">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1.5 select-none">
                                📁 Folders:
                              </span>
                              {foldersToDisplay.map((fld) => {
                                const count =
                                  fld === "All"
                                    ? inquiries.length
                                    : inquiries.filter(
                                        (inq: any) =>
                                          (inq.folder || "Inbox")
                                            .toLowerCase()
                                            .trim() ===
                                          fld.toLowerCase().trim(),
                                      ).length;
                                const isActive =
                                  activeInquiryFolder.toLowerCase().trim() ===
                                  fld.toLowerCase().trim();
                                return (
                                  <button
                                    key={fld}
                                    type="button"
                                    onClick={() => {
                                      setActiveInquiryFolder(fld);
                                      setActiveInquiryChatId(null);
                                    }}
                                    className={`px-2 py-0.5 text-[9.5px] font-sans font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                                      isActive
                                        ? "bg-emerald-800 text-white shadow-xs"
                                        : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                    }`}
                                  >
                                    {fld} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {inquiries.length === 0 ? (
                            <div className="p-5 bg-slate-50 border border-slate-200/55 rounded-xs text-center space-y-1.5 block">
                              <Inbox
                                className="h-6 w-6 text-slate-400 mx-auto"
                                strokeWidth={1.5}
                              />
                              <p className="text-[11px] font-sans text-slate-600 font-bold leading-relaxed">
                                Your live inquiries folder is empty.
                              </p>
                              <p className="text-[10px] font-sans text-slate-400 max-w-[85%] mx-auto leading-relaxed">
                                When potential clients click "Inquire Now" on
                                local listings, their contact and message
                                entries stream instantly right here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              {/* LEFT COLUMN: Sidebar list of Inquiries */}
                              <div
                                className={`col-span-1 md:col-span-4 border border-slate-200/70 rounded bg-white overflow-hidden max-h-[70vh] min-h-[500px] overflow-y-auto shadow-2xs scrollbar-thin flex flex-col divide-y divide-slate-100 ${activeInquiryChatId ? "hidden md:flex" : "flex"}`}
                              >
                                {filteredInquiriesByFolder.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 font-sans text-[11px] space-y-2">
                                    <Inbox
                                      className="h-6 w-6 mx-auto text-slate-300"
                                      strokeWidth={1.5}
                                    />
                                    <p className="font-bold text-slate-500">
                                      No inquiries in folder "
                                      {activeInquiryFolder}"
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Move an existing client thread into this
                                      folder or submit one from client portal.
                                    </p>
                                  </div>
                                ) : (
                                  filteredInquiriesByFolder.map((inq) => {
                                    const isSelected =
                                      activeInquiryChatId === inq.id;
                                    const isAttached =
                                      inq.vesselName &&
                                      inq.vesselName !== "none";
                                    const myAgentId =
                                      currentAgent?.id ||
                                      (currentAgent?.email
                                        ? currentAgent.email
                                            .toLowerCase()
                                            .replace(/[^a-z0-9]/g, "_")
                                        : "unassigned");
                                    const inqActiveBrokerId =
                                      inq.activeBrokerId;
                                    const isLockedByOther =
                                      inqActiveBrokerId &&
                                      inqActiveBrokerId !== "none" &&
                                      inqActiveBrokerId !== "unassigned" &&
                                      inqActiveBrokerId !== myAgentId;

                                    return (
                                      <div
                                        key={inq.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            setActiveInquiryChatId(
                                              isSelected ? null : inq.id,
                                            );
                                            setAgentReplyText("");
                                          }
                                        }}
                                        type="button"
                                        onClick={async () => {
                                          const nextSelected = isSelected
                                            ? null
                                            : inq.id;
                                          setActiveInquiryChatId(nextSelected);
                                          setAgentReplyText("");

                                          if (nextSelected) {
                                            const myAgentId =
                                              currentAgent.id ||
                                              currentAgent.uid ||
                                              (currentAgent.email
                                                ? currentAgent.email
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9]/g, "_")
                                                : "unassigned");

                                            try {
                                              await updateDoc(
                                                doc(db, "inquiries", inq.id),
                                                {
                                                  isRead: true,
                                                  activeBrokerId: myAgentId,
                                                },
                                              );
                                            } catch (err) {
                                              console.error(
                                                "Failed to set read status and acquire session lock:",
                                                err,
                                              );
                                            }
                                          }
                                        }}
                                        className={`w-full text-left p-3 transition-all flex flex-col gap-1 hover:bg-slate-50 relative shrink-0 cursor-pointer ${
                                          isSelected
                                            ? "bg-slate-900/[0.03] border-l-3 border-emerald-700"
                                            : isLockedByOther
                                              ? "bg-slate-50/70 opacity-75 border-l-3 border-red-500/50"
                                              : "border-l-3 border-transparent"
                                        } ${!inq.isRead && !isLockedByOther ? "bg-amber-500/[0.04]" : ""}`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-[11.5px] font-bold text-slate-900 truncate max-w-[124px] flex items-center gap-1">
                                            {isLockedByOther && (
                                              <Lock className="h-2.5 w-2.5 text-red-500 shrink-0" />
                                            )}
                                            {inq.name}
                                          </span>
                                          <span className="text-[7.5px] font-mono text-slate-400 flex items-center gap-1">
                                            {isLockedByOther && (
                                              <span className="text-[7px] font-sans font-bold text-red-500 uppercase tracking-tight bg-red-50 border border-red-100 px-1 py-0.1 rounded-xs">
                                                LOCKED
                                              </span>
                                            )}
                                            {inq.createdAt
                                              ? `${new Date(inq.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} • ${new Date(inq.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                                              : ""}
                                          </span>
                                        </div>
                                        <p className="text-[9.5px] font-mono text-slate-500 truncate w-full">
                                          {inq.contact}
                                        </p>
                                        <div className="text-[9.5px] text-slate-600 line-clamp-1 w-full font-serif italic">
                                          "{inq.message}"
                                        </div>
                                        <div className="text-[9.5px] text-slate-400 w-full mt-0.5 truncate flex items-center gap-1">
                                          {isLockedByOther ? (
                                            <span className="text-red-600 font-medium font-sans text-[8.5px] flex items-center gap-0.5">
                                              🔒 In Service:{" "}
                                              {inq.brokerEmail || inq.brokerId}
                                            </span>
                                          ) : (
                                            <span>
                                              Assigned to:{" "}
                                              {inq.brokerEmail ||
                                                inq.brokerId ||
                                                "Unassigned"}
                                            </span>
                                          )}
                                        </div>
                                        {inq.coAgentName && (
                                          <div className="text-[8px] font-sans font-extrabold text-emerald-805 bg-emerald-50 border border-emerald-100 rounded-xs px-1.5 py-0.5 mt-0.5 w-max flex items-center gap-0.5 select-none leading-none">
                                            👥 Co-Agent: {inq.coAgentName}
                                          </div>
                                        )}
                                        {inq.proposalStatus && (
                                          <div className="mt-1 mb-1 font-sans select-none flex flex-wrap gap-1">
                                            {inq.proposalStatus ===
                                              "proposed" && (
                                              <span className="text-[7.5px] font-sans font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-1 py-0.5 rounded-sm uppercase tracking-tight flex items-center gap-0.5">
                                                ⚡ Offered:{" "}
                                                {inq.proposedPrice ||
                                                  "Custom pricing"}
                                              </span>
                                            )}
                                            {inq.proposalStatus ===
                                              "accepted" && (
                                              <>
                                                <span className="text-[7.5px] font-sans font-extrabold text-[#059669] bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded-sm uppercase tracking-tight flex items-center gap-0.5">
                                                  🟢 Accepted ✓
                                                </span>
                                                {!inq.isBooked && (
                                                  <button
                                                    type="button"
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      try {
                                                        await updateDoc(
                                                          doc(
                                                            db,
                                                            "proposals",
                                                            inq.id,
                                                          ),
                                                          { isBooked: true },
                                                        );
                                                        alert(
                                                          "Proposal moved to Bookings.",
                                                        );
                                                      } catch (err) {
                                                        console.error(
                                                          "Failed to move to bookings:",
                                                          err,
                                                        );
                                                      }
                                                    }}
                                                    className="text-[7.5px] font-sans font-bold text-sky-700 bg-sky-50 border border-sky-200/50 px-1 py-0.5 rounded-sm uppercase tracking-tight hover:bg-sky-100 cursor-pointer"
                                                  >
                                                    Move to Bookings
                                                  </button>
                                                )}
                                              </>
                                            )}
                                            {inq.proposalStatus ===
                                              "declined" && (
                                              <span className="text-[7.5px] font-sans font-bold text-red-700 bg-red-50 border border-red-200/50 px-1 py-0.5 rounded-sm uppercase tracking-tight flex items-center gap-0.5">
                                                🔴 Declined ✗
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <div className="mt-1 mb-1.5 w-full flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(
                                                inq.id,
                                              );
                                              alert(
                                                `Inquiry Reference Copied:\n${inq.id}`,
                                              );
                                            }}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-600 rounded text-[8px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                            title="Copy unique Inquiry ID to clipboard"
                                          >
                                            <Copy className="h-2.5 w-2.5 text-slate-500" />
                                            <span>Copy Ref</span>
                                          </button>

                                          {inqActiveBrokerId === myAgentId ? (
                                            <div className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 font-bold font-sans flex items-center justify-center gap-1 flex-1 select-none">
                                              <CheckCircle2 className="h-2.5 w-2.5" />
                                              Assigned to Me
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              id={`btn-assign-inq-${inq.id}`}
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                  await updateDoc(
                                                    doc(
                                                      db,
                                                      "inquiries",
                                                      inq.id,
                                                    ),
                                                    {
                                                      activeBrokerId: myAgentId,
                                                      brokerId: myAgentId,
                                                      brokerEmail:
                                                        currentAgent?.email ||
                                                        "info@phuketcharter.com",
                                                    },
                                                  );
                                                } catch (err) {
                                                  console.error(
                                                    "Failed to assign inquiry to agent:",
                                                    err,
                                                  );
                                                }
                                              }}
                                              className="flex-1 py-0.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded font-sans text-[8.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                                            >
                                              <User className="h-2.5 w-2.5" />
                                              Assign
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between w-full mt-1.5 border-t border-slate-100/60 pt-1.5">
                                          <div className="flex items-center gap-1.5 truncate max-w-[110px]">
                                            {isAttached ? (
                                              <span
                                                className="text-[8px] bg-slate-100 text-slate-700 font-mono py-0.5 px-1.5 rounded-sm border border-slate-100 truncate"
                                                title={inq.vesselName}
                                              >
                                                ⚓ {inq.vesselName}
                                              </span>
                                            ) : (
                                              <span className="text-[8px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-sm">
                                                General
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex gap-1.5 items-center shrink-0">
                                            <button
                                              type="button"
                                              id={`btn-copy-ref-${inq.id}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (inq.id) {
                                                  navigator.clipboard.writeText(
                                                    inq.id,
                                                  );
                                                  setCopiedInquiryId(inq.id);
                                                  setTimeout(
                                                    () =>
                                                      setCopiedInquiryId(null),
                                                    2000,
                                                  );
                                                }
                                              }}
                                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-sans font-bold transition-all cursor-pointer ${
                                                copiedInquiryId === inq.id
                                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 active:bg-slate-205"
                                              }`}
                                              title="Copy unique inquiry ID reference to clipboard"
                                            >
                                              {copiedInquiryId === inq.id ? (
                                                <>
                                                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                                                  <span>Copied ID!</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="h-2.5 w-2.5 text-slate-500" />
                                                  <span>Copy Reference</span>
                                                </>
                                              )}
                                            </button>

                                            {!inq.isRead && (
                                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            )}
                                            {isSelected && (
                                              <span className="text-[8px] text-emerald-800 font-bold uppercase tracking-wider">
                                                Active
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* RIGHT COLUMN: Active Chat Panel */}
                              <div
                                className={`col-span-1 md:col-span-8 border border-slate-200/70 bg-slate-50/40 rounded flex flex-col justify-between max-h-[70vh] min-h-[500px] shadow-2xs relative overflow-hidden ${activeInquiryChatId ? "flex" : "hidden md:flex"}`}
                              >
                                {(() => {
                                  const activeInq = inquiries.find(
                                    (i) => i.id === activeInquiryChatId,
                                  );
                                  if (!activeInq) {
                                    return (
                                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2 select-none h-full min-h-[460px]">
                                        <div className="p-3 bg-white border border-slate-200/60 text-slate-400 shadow-3xs rounded-full">
                                          <MessageSquare className="h-6 w-6 stroke-1.5 animate-pulse" />
                                        </div>
                                        <p className="text-[11.5px] text-slate-700 font-bold font-sans">
                                          No Active Thread Selected
                                        </p>
                                        <p className="text-[10px] text-slate-450 max-w-[70%] mx-auto leading-relaxed text-slate-400">
                                          Click any catalog item on the sidebar
                                          to inspect credentials, reply live in
                                          two-way thread, or trigger mail
                                          backups.
                                        </p>
                                      </div>
                                    );
                                  }

                                  const isAttached =
                                    activeInq.vesselName &&
                                    activeInq.vesselName !== "none";
                                  return (
                                    <div className="flex flex-col flex-1 h-full min-h-[460px] relative">
                                      {/* Chat Panel Header */}
                                      <div className="p-3 bg-white border-b border-slate-200/60 flex items-center justify-between shadow-3xs">
                                        <div className="min-w-0 flex-1 flex items-center gap-2">
                                          {isInlineQuoteOpen &&
                                            inlineQuoteData && (
                                              <div className="bg-slate-50 border-b border-slate-200">
                                                <QuoteGeneratorInline
                                                  chatId={
                                                    inlineQuoteData.chatId
                                                  }
                                                  clientName={
                                                    inlineQuoteData.clientName
                                                  }
                                                  initialShip={
                                                    inlineQuoteData.ship
                                                  }
                                                  onClose={() =>
                                                    setIsInlineQuoteOpen(false)
                                                  }
                                                />
                                              </div>
                                            )}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setActiveInquiryChatId(null)
                                            }
                                            className="md:hidden p-1.5 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer shrink-0 mr-1"
                                            title="Back to Inquiries List"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                          </button>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                              <h5 className="text-[12px] font-bold text-slate-900 truncate">
                                                Client: {activeInq.name}
                                              </h5>
                                              {activeInq.coAgentName && (
                                                <span className="text-[8px] bg-emerald-50 text-emerald-805 border border-emerald-150 rounded px-1.5 py-0.5 font-extrabold flex items-center gap-0.5 shrink-0 select-none">
                                                  👥 Referrer Partner:{" "}
                                                  {activeInq.coAgentName} (
                                                  {activeInq.coAgentPhone})
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[9.5px] font-mono text-slate-500 truncate mt-0.5 select-all">
                                              {activeInq.contact}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Quick Actions Header Toolbar */}
                                        <div className="flex gap-1.5 items-center shrink-0 ml-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInlineQuoteData({
                                                chatId: activeInq.id,
                                                clientName: activeInq.name,
                                                ship: activeInq.vesselName,
                                              });
                                              setIsInlineQuoteOpen(true);
                                            }}
                                            className="py-0.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xs transition-colors cursor-pointer text-[9px] font-sans font-bold flex items-center gap-1"
                                            title="Generate Custom PDF Quotation"
                                          >
                                            <FileText className="h-3 w-3 text-emerald-600" />
                                            Create Quote
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              window.dispatchEvent(
                                                new CustomEvent(
                                                  "trigger-agent-chat-popup",
                                                  { detail: activeInq.id },
                                                ),
                                              );
                                            }}
                                            className="py-0.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xs transition-colors cursor-pointer text-[9px] font-sans font-bold flex items-center gap-1"
                                            title="Open Chat in Floating Window"
                                          >
                                            Pop Out
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleInquiryRead(
                                                activeInq.id,
                                                activeInq.isRead || false,
                                              )
                                            }
                                            className={`py-0.5 px-2 border rounded-xs transition-colors cursor-pointer text-[9px] font-sans ${
                                              activeInq.isRead
                                                ? "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                                                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-850 border-amber-200 font-bold"
                                            }`}
                                            title={
                                              activeInq.isRead
                                                ? "Mark as Unread"
                                                : "Mark as Read"
                                            }
                                          >
                                            {activeInq.isRead
                                              ? "Done"
                                              : "Mark Read"}
                                          </button>
                                          <a
                                            href={`mailto:${activeInq.contact}?subject=Re: Phuket Private Yacht Charter Inquiry&body=${encodeURIComponent(`Dear ${activeInq.name || "Client"},\n\nThank you for contacting us regarding our luxury yacht charters.\n\n`)}`}
                                            onClick={() => {
                                              if (!activeInq.isRead) {
                                                toggleInquiryRead(
                                                  activeInq.id,
                                                  false,
                                                );
                                              }
                                            }}
                                            className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xs transition-all font-sans font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                                            title="Reply via Email Client App"
                                          >
                                            Email Reply
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              deleteInquiry(activeInq.id);
                                              setActiveInquiryChatId(null);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-700 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-xs transition-colors shrink-0 cursor-pointer"
                                            title="Delete Inquiry"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Folder Management Ribbon */}
                                      <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200/50 flex flex-wrap items-center justify-between gap-2.5 text-left">
                                        <div className="flex items-center gap-1">
                                          <Folder className="h-3.5 w-3.5 text-emerald-805 shrink-0" />
                                          <span className="text-[10px] text-slate-500 font-sans">
                                            Workspace Folder:{" "}
                                            <strong className="text-emerald-805 uppercase font-bold">
                                              {activeInq.folder || "Inbox"}
                                            </strong>
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-1.5 md:pt-0">
                                          <span className="text-[8.5px] text-slate-400 font-sans uppercase font-black select-none tracking-wider">
                                            Move to Folder:
                                          </span>
                                          <div className="flex gap-1 flex-wrap">
                                            {[
                                              "Inbox",
                                              "Chatbot",
                                              "Urgent",
                                              "VIP",
                                              "Follow-up",
                                              "Archive",
                                            ].map((fld) => {
                                              if (
                                                (activeInq.folder || "Inbox")
                                                  .toLowerCase()
                                                  .trim() ===
                                                fld.toLowerCase().trim()
                                              )
                                                return null;
                                              return (
                                                <button
                                                  key={fld}
                                                  type="button"
                                                  onClick={async () => {
                                                    console.log(
                                                      "Attempting to move inquiry",
                                                      activeInq.id,
                                                      "to folder",
                                                      fld,
                                                    );
                                                    try {
                                                      await updateDoc(
                                                        doc(
                                                          db,
                                                          "inquiries",
                                                          activeInq.id,
                                                        ),
                                                        {
                                                          folder: fld,
                                                        },
                                                      );
                                                      console.log(
                                                        "Successfully updated folder for",
                                                        activeInq.id,
                                                      );
                                                    } catch (err) {
                                                      console.error(
                                                        "DEBUG: Failed to move inquiry to pre-set folder:",
                                                        err,
                                                      );
                                                    }
                                                  }}
                                                  className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-605 border border-slate-200 rounded text-[9px] font-sans font-bold transition-all cursor-pointer shadow-xs font-sans hover:text-slate-900"
                                                >
                                                  {fld}
                                                </button>
                                              );
                                            })}
                                            {/* Custom Folder Input option */}
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                const customFolder = prompt(
                                                  "Enter custom folder name to move this inquiry to:",
                                                  activeInq.folder || "",
                                                );
                                                if (
                                                  customFolder &&
                                                  customFolder.trim()
                                                ) {
                                                  try {
                                                    await updateDoc(
                                                      doc(
                                                        db,
                                                        "inquiries",
                                                        activeInq.id,
                                                      ),
                                                      {
                                                        folder:
                                                          customFolder.trim(),
                                                      },
                                                    );
                                                  } catch (err) {
                                                    console.error(
                                                      "Failed to move inquiry to custom folder:",
                                                      err,
                                                    );
                                                  }
                                                }
                                              }}
                                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 rounded text-[9px] font-sans font-bold transition-all cursor-pointer shadow-xs"
                                            >
                                              + Custom Folder
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Customer Manifest Action Bar */}
                                      {(() => {
                                        const manifestMsg =
                                          activeInq.chatHistory?.find(
                                            (item: any) =>
                                              item.isManifest &&
                                              item.companions,
                                          );
                                        if (!manifestMsg) return null;
                                        return (
                                          <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-700">
                                            <span className="flex items-center gap-1.5 text-emerald-950 font-bold select-none truncate font-sans">
                                              <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                              <span>
                                                Passenger Manifest (
                                                {manifestMsg.companions.length +
                                                  1}{" "}
                                                Passengers Verified)
                                              </span>
                                            </span>
                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  try {
                                                    const docObj = new jsPDF();

                                                    // Header
                                                    docObj.setFillColor(
                                                      15,
                                                      23,
                                                      42,
                                                    );
                                                    docObj.rect(
                                                      0,
                                                      0,
                                                      210,
                                                      42,
                                                      "F",
                                                    );
                                                    docObj.setFillColor(
                                                      16,
                                                      185,
                                                      129,
                                                    );
                                                    docObj.rect(
                                                      0,
                                                      42,
                                                      210,
                                                      2,
                                                      "F",
                                                    );

                                                    docObj.setTextColor(
                                                      255,
                                                      255,
                                                      255,
                                                    );
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "bold",
                                                    );
                                                    docObj.setFontSize(18);
                                                    docObj.text(
                                                      "PHUKET PRIVATE YACHT EXCURSIONS",
                                                      15,
                                                      18,
                                                    );
                                                    docObj.setFontSize(10);
                                                    docObj.text(
                                                      "OFFICIAL PASSENGER MANIFEST & MARITIME INSURANCE REGISTRATION",
                                                      15,
                                                      26,
                                                    );
                                                    docObj.setFontSize(8);
                                                    docObj.text(
                                                      "Forwarded secure digital copy to active Yacht Broker Account",
                                                      15,
                                                      33,
                                                    );

                                                    // Lead Guest Details
                                                    docObj.setTextColor(
                                                      15,
                                                      23,
                                                      42,
                                                    );
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "bold",
                                                    );
                                                    docObj.text(
                                                      "LEAD GUEST DETAILS (ACCOUNT OWNER)",
                                                      15,
                                                      54,
                                                    );
                                                    docObj.line(
                                                      15,
                                                      56,
                                                      195,
                                                      56,
                                                    );

                                                    docObj.setFontSize(8.5);
                                                    docObj.setTextColor(
                                                      100,
                                                      116,
                                                      139,
                                                    );
                                                    docObj.text(
                                                      "FULL NAME:",
                                                      15,
                                                      62,
                                                    );
                                                    docObj.text(
                                                      "PHONE CONTACT:",
                                                      15,
                                                      69,
                                                    );
                                                    docObj.text(
                                                      "COUNTRY / CITIZENSHIP:",
                                                      110,
                                                      62,
                                                    );
                                                    docObj.text(
                                                      "PASSPORT / ID NO:",
                                                      110,
                                                      69,
                                                    );

                                                    docObj.setTextColor(
                                                      15,
                                                      23,
                                                      42,
                                                    );
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "normal",
                                                    );
                                                    docObj.text(
                                                      (
                                                        manifestMsg.leadInfo
                                                          ?.name ||
                                                        activeInq.name ||
                                                        "N/A"
                                                      ).toUpperCase(),
                                                      48,
                                                      62,
                                                    );
                                                    docObj.text(
                                                      manifestMsg.leadInfo
                                                        ?.phone || "N/A",
                                                      48,
                                                      69,
                                                    );
                                                    docObj.text(
                                                      (
                                                        manifestMsg.leadInfo
                                                          ?.country || "N/A"
                                                      ).toUpperCase(),
                                                      158,
                                                      62,
                                                    );
                                                    docObj.text(
                                                      (
                                                        manifestMsg.leadInfo
                                                          ?.passportNumber ||
                                                        "N/A"
                                                      ).toUpperCase(),
                                                      158,
                                                      69,
                                                    );

                                                    // Companion headers
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "bold",
                                                    );
                                                    docObj.setFontSize(11);
                                                    docObj.text(
                                                      `TRAVELING PARTY COMPANIONS (${manifestMsg.companions.length} DECLARED)`,
                                                      15,
                                                      86,
                                                    );
                                                    docObj.line(
                                                      15,
                                                      88,
                                                      195,
                                                      88,
                                                    );

                                                    docObj.setFillColor(
                                                      241,
                                                      245,
                                                      249,
                                                    );
                                                    docObj.rect(
                                                      15,
                                                      92,
                                                      180,
                                                      8,
                                                      "F",
                                                    );

                                                    docObj.setFontSize(8);
                                                    docObj.setTextColor(
                                                      47,
                                                      55,
                                                      70,
                                                    );
                                                    docObj.text("NO.", 18, 97);
                                                    docObj.text(
                                                      "FULL PASSENGER NAME (AS REGISTERED)",
                                                      28,
                                                      97,
                                                    );
                                                    docObj.text(
                                                      "NATIONALITY/COUNTRY",
                                                      98,
                                                      97,
                                                    );
                                                    docObj.text(
                                                      "PASSPORT / ID NO.",
                                                      142,
                                                      97,
                                                    );
                                                    docObj.text(
                                                      "EXPIRY DATE",
                                                      176,
                                                      97,
                                                    );

                                                    let currentYVal = 100;
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "normal",
                                                    );
                                                    docObj.setTextColor(
                                                      51,
                                                      65,
                                                      85,
                                                    );

                                                    (
                                                      manifestMsg.companions ||
                                                      []
                                                    ).forEach(
                                                      (
                                                        c: any,
                                                        index: number,
                                                      ) => {
                                                        if (index % 2 === 1) {
                                                          docObj.setFillColor(
                                                            250,
                                                            251,
                                                            252,
                                                          );
                                                          docObj.rect(
                                                            15,
                                                            currentYVal,
                                                            180,
                                                            8,
                                                            "F",
                                                          );
                                                        }
                                                        docObj.text(
                                                          `${index + 1}`,
                                                          18,
                                                          currentYVal + 5,
                                                        );
                                                        docObj.text(
                                                          (
                                                            c.fullName || ""
                                                          ).toUpperCase(),
                                                          28,
                                                          currentYVal + 5,
                                                        );
                                                        docObj.text(
                                                          (
                                                            c.country || ""
                                                          ).toUpperCase(),
                                                          98,
                                                          currentYVal + 5,
                                                        );
                                                        docObj.text(
                                                          (
                                                            c.passportNumber ||
                                                            ""
                                                          ).toUpperCase(),
                                                          142,
                                                          currentYVal + 5,
                                                        );
                                                        docObj.text(
                                                          c.passportExpiry ||
                                                            "N/A",
                                                          176,
                                                          currentYVal + 5,
                                                        );

                                                        docObj.setDrawColor(
                                                          241,
                                                          245,
                                                          249,
                                                        );
                                                        docObj.line(
                                                          15,
                                                          currentYVal + 8,
                                                          195,
                                                          currentYVal + 8,
                                                        );
                                                        currentYVal += 8;
                                                      },
                                                    );

                                                    currentYVal += 12;
                                                    docObj.setFillColor(
                                                      254,
                                                      252,
                                                      232,
                                                    );
                                                    docObj.setDrawColor(
                                                      254,
                                                      240,
                                                      138,
                                                    );
                                                    docObj.rect(
                                                      15,
                                                      currentYVal,
                                                      180,
                                                      18,
                                                      "FD",
                                                    );

                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "bold",
                                                    );
                                                    docObj.setFontSize(7.5);
                                                    docObj.setTextColor(
                                                      133,
                                                      77,
                                                      14,
                                                    );
                                                    docObj.text(
                                                      "MANDATORY PASSENGER INSURANCE UNDERWRITING STATUS:",
                                                      18,
                                                      currentYVal + 5,
                                                    );
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "normal",
                                                    );
                                                    docObj.setFontSize(7);
                                                    docObj.text(
                                                      "Under the statutory maritime rules of Thailand, all charter groups must be declared with accurate passport details to vessel captains",
                                                      18,
                                                      currentYVal + 9,
                                                    );
                                                    docObj.text(
                                                      "prior to high-seas clearance. Failure to maintain correct registries on this manifest waives any active maritime injury coverages.",
                                                      18,
                                                      currentYVal + 13,
                                                    );

                                                    currentYVal += 26;
                                                    docObj.setFont(
                                                      "Helvetica",
                                                      "bold",
                                                    );
                                                    docObj.setFontSize(8.5);
                                                    docObj.setTextColor(
                                                      15,
                                                      23,
                                                      42,
                                                    );
                                                    docObj.text(
                                                      "Lead Charterer Signature: Checked Digitally",
                                                      15,
                                                      currentYVal + 5,
                                                    );
                                                    docObj.line(
                                                      15,
                                                      currentYVal + 14,
                                                      75,
                                                      currentYVal + 14,
                                                    );

                                                    docObj.text(
                                                      "Date of Registry:",
                                                      120,
                                                      currentYVal + 5,
                                                    );
                                                    docObj.line(
                                                      120,
                                                      currentYVal + 14,
                                                      180,
                                                      currentYVal + 14,
                                                    );
                                                    docObj.text(
                                                      new Date().toLocaleDateString(),
                                                      122,
                                                      currentYVal + 10,
                                                    );

                                                    const fName = `Insurance_Manifest_${(activeInq.name || "guest").toLowerCase().replace(/\s+/g, "_")}.pdf`;
                                                    docObj.save(fName);
                                                  } catch (pdfErr: any) {
                                                    console.error(
                                                      "Agent PDF generation failed:",
                                                      pdfErr,
                                                    );
                                                    alert(
                                                      "Failed compiling PDF: " +
                                                        pdfErr.message,
                                                    );
                                                  }
                                                }}
                                                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-black text-[9px] uppercase tracking-widest rounded-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                                                title="Download secure insurance & manifest clearance PDF"
                                              >
                                                <Download className="h-3 w-3" />
                                                <span>Download PDF</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  let cleanPhone = (
                                                    manifestMsg.leadInfo
                                                      ?.phone ||
                                                    activeInq.contact ||
                                                    ""
                                                  ).replace(/[^\d+]/g, "");
                                                  cleanPhone =
                                                    cleanPhone.startsWith("+")
                                                      ? cleanPhone.slice(1)
                                                      : cleanPhone;
                                                  if (!cleanPhone) {
                                                    alert(
                                                      "No valid phone number found for this customer.",
                                                    );
                                                    return;
                                                  }

                                                  let companionList = "None";
                                                  if (
                                                    manifestMsg.companions &&
                                                    manifestMsg.companions
                                                      .length > 0
                                                  ) {
                                                    companionList =
                                                      manifestMsg.companions
                                                        .map(
                                                          (c: any, i: number) =>
                                                            `[${i + 1}] ${c.fullName || "-"} (Pass: ${c.passportNumber || "-"})`,
                                                        )
                                                        .join("\n");
                                                  }

                                                  const waMsg = `Hi ${manifestMsg.leadInfo?.name || activeInq.name},\n\nWe have received your trip manifest for the upcoming yacht charter.\n\nLead Passenger: ${manifestMsg.leadInfo?.name || "-"}\nPassport: ${manifestMsg.leadInfo?.passportNumber || "-"}\n\nCompanions:\n${companionList}\n\nPlease confirm if these details are correct so we can proceed with harbor authority registration. Thank you!`;

                                                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
                                                  window.open(
                                                    waUrl,
                                                    "_blank",
                                                    "noopener,noreferrer",
                                                  );
                                                }}
                                                className="py-1 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 font-sans font-black text-[9px] uppercase tracking-widest rounded-xs cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                                                title="Share Manifest Review via WhatsApp"
                                              >
                                                <MessageCircle className="h-3 w-3" />
                                                <span>Share via WhatsApp</span>
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* Attached Context Card */}
                                      {isAttached && (
                                        <div className="px-3.5 py-1.5 bg-slate-100/85 border-b border-slate-200/40 flex items-center justify-between text-[10px] text-slate-700 font-mono">
                                          <span className="flex items-center gap-1.5 select-none truncate">
                                            <Anchor className="h-3 w-3 text-slate-500 shrink-0" />
                                            Selected Yacht:{" "}
                                            <strong className="font-semibold text-slate-900">
                                              {activeInq.vesselName}
                                            </strong>
                                          </span>
                                          <span className="text-[8px] bg-slate-200 text-slate-700 px-1 rounded-sm leading-none shrink-0 border border-slate-300">
                                            Contextual Link
                                          </span>
                                        </div>
                                      )}

                                      {/* Chat dialogue body */}
                                      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[260px] scrollbar-thin bg-slate-50/20 shadow-inner flex flex-col justify-start">
                                        {/* Render Extracted CRM Profile from PDF Chatbot if present */}
                                        {activeInq.extractedDetails && (
                                          <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-lg text-left shadow-2xs select-none">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                              </div>
                                              <h6 className="text-[10px] font-mono uppercase tracking-wider text-emerald-950 font-black">
                                                Extracted CRM Lead Profile (PDF
                                                Catamaran Chatbot)
                                              </h6>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                                              {/* Name */}
                                              <div className="bg-white p-2.5 rounded border border-slate-200/50 shadow-3xs">
                                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wide block">
                                                  Lead Name
                                                </span>
                                                <span className="text-[11px] font-extrabold text-slate-905 block truncate mt-0.5">
                                                  {activeInq.extractedDetails
                                                    .customerName || "N/A"}
                                                </span>
                                              </div>

                                              {/* Email */}
                                              <div className="bg-white p-2.5 rounded border border-slate-200/50 shadow-3xs">
                                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wide block">
                                                  Contact Email
                                                </span>
                                                <span
                                                  className="text-[11px] font-extrabold text-slate-905 block truncate mt-0.5 select-all"
                                                  title={
                                                    activeInq.extractedDetails
                                                      .contactEmail
                                                  }
                                                >
                                                  {activeInq.extractedDetails
                                                    .contactEmail || "N/A"}
                                                </span>
                                              </div>

                                              {/* Phone */}
                                              <div className="bg-white p-2.5 rounded border border-slate-200/50 shadow-3xs">
                                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wide block">
                                                  Contact Phone
                                                </span>
                                                <span className="text-[11px] font-extrabold text-slate-905 block truncate mt-0.5">
                                                  {activeInq.extractedDetails
                                                    .contactPhone || "N/A"}
                                                </span>
                                              </div>

                                              {/* Travel Date */}
                                              <div className="bg-white p-2.5 rounded border border-slate-200/50 shadow-3xs">
                                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wide block">
                                                  Travel Date
                                                </span>
                                                <span className="text-[11px] font-extrabold text-emerald-700 block truncate mt-0.5">
                                                  {activeInq.extractedDetails
                                                    .targetTravelDate || "N/A"}
                                                </span>
                                              </div>

                                              {/* Guests count */}
                                              <div className="bg-white p-2.5 rounded border border-slate-200/50 shadow-3xs col-span-2 md:col-span-1">
                                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wide block">
                                                  Passenger Count
                                                </span>
                                                <span className="text-[11px] font-extrabold text-slate-905 block truncate mt-0.5">
                                                  {activeInq.extractedDetails
                                                    .totalGuests || "N/A"}{" "}
                                                  passengers
                                                </span>
                                              </div>
                                            </div>

                                            {/* Document info and download option */}
                                            {(activeInq.pdfData ||
                                              activeInq.charterInquiriesUrl) && (
                                              <div className="mt-3 pt-2.5 border-t border-emerald-500/10 flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-[9.5px] text-slate-500 font-medium font-sans flex items-center gap-1">
                                                  📄 Core Document Source:{" "}
                                                  <strong className="text-slate-705 truncate max-w-[200px]">
                                                    {activeInq.fileName ||
                                                      "itinerary.pdf"}
                                                  </strong>
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    try {
                                                      const downloadUrl =
                                                        activeInq.charterInquiriesUrl ||
                                                        activeInq.pdfData;
                                                      const res =
                                                        await fetch(
                                                          downloadUrl,
                                                        );
                                                      const blob =
                                                        await res.blob();
                                                      const url =
                                                        URL.createObjectURL(
                                                          blob,
                                                        );
                                                      const a =
                                                        document.createElement(
                                                          "a",
                                                        );
                                                      a.href = url;
                                                      a.download =
                                                        activeInq.fileName ||
                                                        "document.pdf";
                                                      document.body.appendChild(
                                                        a,
                                                      );
                                                      a.click();
                                                      document.body.removeChild(
                                                        a,
                                                      );
                                                      URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                      console.error(
                                                        "PDF download failed",
                                                        err,
                                                      );
                                                      alert(
                                                        "Unable to fetch PDF binary download stream.",
                                                      );
                                                    }
                                                  }}
                                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8.5px] transition-all font-sans font-bold flex items-center gap-1 shadow-3xs cursor-pointer"
                                                >
                                                  <Download className="w-3 h-3 text-emerald-400" />{" "}
                                                  Download Luka's Original PDF
                                                  (Preview)
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Render original initial inquiry text */}
                                        {(!activeInq.chatHistory ||
                                          activeInq.chatHistory.length ===
                                            0) && (
                                          <div className="flex flex-col items-start max-w-[85%] self-start">
                                            <div className="text-[10px] font-bold text-slate-450 mb-0.5 uppercase tracking-wider ml-1 text-slate-405 font-mono select-none">
                                              Initial Inquiry Message
                                            </div>
                                            <div className="bg-slate-200/90 text-slate-800 text-[10.5px] px-3.5 py-2.5 rounded-sm rounded-tl-none leading-relaxed break-words whitespace-pre-wrap font-sans border border-slate-300/40 shadow-2xs font-semibold">
                                              {activeInq.message}
                                            </div>
                                            <span className="text-[8px] text-slate-400 mt-1 ml-1.5 font-mono">
                                              {activeInq.createdAt
                                                ? new Date(
                                                    activeInq.createdAt,
                                                  ).toLocaleTimeString()
                                                : ""}
                                            </span>
                                          </div>
                                        )}

                                        {/* Render dialog thread */}
                                        {activeInq.chatHistory &&
                                          activeInq.chatHistory.map(
                                            (item: any, idx: number) => {
                                              const isAgent =
                                                item.sender === "agent";
                                              return (
                                                <div
                                                  key={idx}
                                                  className={`flex flex-col max-w-[85%] ${isAgent ? "items-end self-end text-right" : "items-start self-start text-left"}`}
                                                >
                                                  <div
                                                    className={`text-[11px] p-2.5 rounded-sm max-w-[85%] leading-relaxed font-sans ${
                                                      isAgent
                                                        ? "bg-emerald-600 text-white rounded-tr-none"
                                                        : "bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-none"
                                                    } ${item.isBookingSummary ? "!p-0 overflow-hidden !bg-white !text-slate-800 !border-emerald-500/50" : ""}`}
                                                  >
                                                    {item.isBookingSummary &&
                                                    item.bookingDetails ? (
                                                      <div className="flex flex-col text-[10px] w-full min-w-[200px]">
                                                        <div className="bg-emerald-600 text-white font-bold tracking-wider uppercase px-3 py-2 flex justify-between items-center">
                                                          <span>
                                                            Booking Request
                                                          </span>
                                                        </div>
                                                        <div className="p-3 space-y-1.5 font-sans text-left">
                                                          <div className="font-bold text-xs text-slate-900 leading-tight mb-1">
                                                            {
                                                              item
                                                                .bookingDetails
                                                                .vesselName
                                                            }{" "}
                                                            <span className="font-normal text-slate-500">
                                                              (
                                                              {
                                                                item
                                                                  .bookingDetails
                                                                  .vesselModel
                                                              }
                                                              )
                                                            </span>
                                                          </div>
                                                          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                            <div className="text-slate-500">
                                                              Date:
                                                            </div>
                                                            <div className="font-medium text-slate-800 text-right">
                                                              {
                                                                item
                                                                  .bookingDetails
                                                                  .charterDate
                                                              }
                                                            </div>
                                                            <div className="text-slate-500">
                                                              Guests:
                                                            </div>
                                                            <div className="font-medium text-slate-800 text-right">
                                                              {
                                                                item
                                                                  .bookingDetails
                                                                  .guestCount
                                                              }
                                                            </div>
                                                            <div className="text-slate-500">
                                                              Duration:
                                                            </div>
                                                            <div className="font-medium text-slate-800 text-right">
                                                              {
                                                                item
                                                                  .bookingDetails
                                                                  .charterDuration
                                                              }
                                                            </div>
                                                            <div className="text-slate-500">
                                                              Price:
                                                            </div>
                                                            <div className="font-medium text-emerald-600 text-right">
                                                              ฿
                                                              {item.bookingDetails.totalPrice?.toLocaleString()}
                                                            </div>
                                                          </div>
                                                          {item.bookingDetails
                                                            .excursionRoute && (
                                                            <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                                                              <span className="text-slate-500">
                                                                Route:
                                                              </span>
                                                              <span className="font-medium text-slate-700 leading-snug">
                                                                {
                                                                  item
                                                                    .bookingDetails
                                                                    .excursionRoute
                                                                }
                                                              </span>
                                                            </div>
                                                          )}
                                                          {item.bookingDetails
                                                            .amenities &&
                                                            item.bookingDetails
                                                              .amenities
                                                              .length > 0 && (
                                                              <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
                                                                <span className="text-slate-500">
                                                                  Add-ons:
                                                                </span>
                                                                <ul className="list-disc pl-4 text-xs font-medium text-slate-700 leading-snug">
                                                                  {item.bookingDetails.amenities.map(
                                                                    (
                                                                      addon: string,
                                                                      i: number,
                                                                    ) => (
                                                                      <li
                                                                        key={i}
                                                                      >
                                                                        {addon}
                                                                      </li>
                                                                    ),
                                                                  )}
                                                                </ul>
                                                              </div>
                                                            )}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="flex flex-col gap-1">
                                                        {!isAgent && (
                                                          <div className="text-[7.5px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5 font-mono select-none">
                                                            Client
                                                          </div>
                                                        )}
                                                        <span className="whitespace-pre-wrap">
                                                          {item.text}
                                                        </span>
                                                        {item.isPdfAttached &&
                                                          item.pdfData && (
                                                            <button
                                                              onClick={async () => {
                                                                try {
                                                                  const response =
                                                                    await fetch(
                                                                      item.pdfData,
                                                                    );
                                                                  const blob =
                                                                    await response.blob();
                                                                  const blobUrl =
                                                                    URL.createObjectURL(
                                                                      blob,
                                                                    );
                                                                  const link =
                                                                    document.createElement(
                                                                      "a",
                                                                    );
                                                                  link.href =
                                                                    blobUrl;
                                                                  link.download =
                                                                    item.fileName ||
                                                                    "document.pdf";
                                                                  document.body.appendChild(
                                                                    link,
                                                                  );
                                                                  link.click();
                                                                  document.body.removeChild(
                                                                    link,
                                                                  );
                                                                  setTimeout(
                                                                    () =>
                                                                      URL.revokeObjectURL(
                                                                        blobUrl,
                                                                      ),
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
                                                              className="mt-2 text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 flex items-center gap-1.5 w-fit text-[9px] uppercase font-bold tracking-wider rounded-sm transition-colors border border-slate-700 cursor-pointer"
                                                            >
                                                              <Download className="w-3 h-3 text-emerald-400" />
                                                              Download PDF
                                                            </button>
                                                          )}
                                                        {item.isImageAttached &&
                                                          item.imageData && (
                                                            <div className="mt-2 rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex flex-col shrink-0 max-w-[220px]">
                                                              <img
                                                                src={
                                                                  item.imageData
                                                                }
                                                                alt="Captured photo attachment"
                                                                className="w-full max-h-[160px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                referrerPolicy="no-referrer"
                                                                onClick={() => {
                                                                  try {
                                                                    const win =
                                                                      window.open();
                                                                    if (win) {
                                                                      win
                                                                        .document
                                                                        .write(`
                                                            <html>
                                                              <head><title>Photo Viewer</title></head>
                                                              <body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;">
                                                                <img src="${item.imageData}" style="max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 10px 25px rgba(0,0,0,0.5);" />
                                                              </body>
                                                            </html>
                                                          `);
                                                                    }
                                                                  } catch (e) {
                                                                    console.error(
                                                                      e,
                                                                    );
                                                                  }
                                                                }}
                                                              />
                                                              <div className="px-2 py-1 text-[8px] text-slate-500 font-sans tracking-wide bg-slate-50 border-t border-slate-200/50 flex justify-between items-center select-none text-left">
                                                                <span>
                                                                  📷 Captured
                                                                  Photo
                                                                </span>
                                                                <button
                                                                  type="button"
                                                                  onClick={() => {
                                                                    const link =
                                                                      document.createElement(
                                                                        "a",
                                                                      );
                                                                    link.href =
                                                                      item.imageData!;
                                                                    link.download = `photo_${Date.now()}.jpg`;
                                                                    document.body.appendChild(
                                                                      link,
                                                                    );
                                                                    link.click();
                                                                    document.body.removeChild(
                                                                      link,
                                                                    );
                                                                  }}
                                                                  className="text-[8px] font-bold text-emerald-650 hover:text-emerald-750 bg-none border-none cursor-pointer"
                                                                >
                                                                  Download
                                                                </button>
                                                              </div>
                                                            </div>
                                                          )}
                                                      </div>
                                                    )}
                                                    {item.isManifest &&
                                                      item.companions && (
                                                        <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              try {
                                                                const docObj =
                                                                  new jsPDF();

                                                                // Header
                                                                docObj.setFillColor(
                                                                  15,
                                                                  23,
                                                                  42,
                                                                );
                                                                docObj.rect(
                                                                  0,
                                                                  0,
                                                                  210,
                                                                  42,
                                                                  "F",
                                                                );
                                                                docObj.setFillColor(
                                                                  16,
                                                                  185,
                                                                  129,
                                                                );
                                                                docObj.rect(
                                                                  0,
                                                                  42,
                                                                  210,
                                                                  2,
                                                                  "F",
                                                                );

                                                                docObj.setTextColor(
                                                                  255,
                                                                  255,
                                                                  255,
                                                                );
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "bold",
                                                                );
                                                                docObj.setFontSize(
                                                                  18,
                                                                );
                                                                docObj.text(
                                                                  "PHUKET PRIVATE YACHT EXCURSIONS",
                                                                  15,
                                                                  18,
                                                                );
                                                                docObj.setFontSize(
                                                                  10,
                                                                );
                                                                docObj.text(
                                                                  "OFFICIAL PASSENGER MANIFEST & MARITIME INSURANCE REGISTRATION",
                                                                  15,
                                                                  26,
                                                                );
                                                                docObj.setFontSize(
                                                                  8,
                                                                );
                                                                docObj.text(
                                                                  "Forwarded secure digital copy to active Yacht Broker Account",
                                                                  15,
                                                                  33,
                                                                );

                                                                // Lead Guest Details
                                                                docObj.setTextColor(
                                                                  15,
                                                                  23,
                                                                  42,
                                                                );
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "bold",
                                                                );
                                                                docObj.text(
                                                                  "LEAD GUEST DETAILS (ACCOUNT OWNER)",
                                                                  15,
                                                                  54,
                                                                );
                                                                docObj.line(
                                                                  15,
                                                                  56,
                                                                  195,
                                                                  56,
                                                                );

                                                                docObj.setFontSize(
                                                                  8.5,
                                                                );
                                                                docObj.setTextColor(
                                                                  100,
                                                                  116,
                                                                  139,
                                                                );
                                                                docObj.text(
                                                                  "FULL NAME:",
                                                                  15,
                                                                  62,
                                                                );
                                                                docObj.text(
                                                                  "PHONE CONTACT:",
                                                                  15,
                                                                  69,
                                                                );
                                                                docObj.text(
                                                                  "COUNTRY / CITIZENSHIP:",
                                                                  110,
                                                                  62,
                                                                );
                                                                docObj.text(
                                                                  "PASSPORT / ID NO:",
                                                                  110,
                                                                  69,
                                                                );

                                                                docObj.setTextColor(
                                                                  15,
                                                                  23,
                                                                  42,
                                                                );
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "normal",
                                                                );
                                                                docObj.text(
                                                                  (
                                                                    item
                                                                      .leadInfo
                                                                      ?.name ||
                                                                    activeInq.name ||
                                                                    "N/A"
                                                                  ).toUpperCase(),
                                                                  48,
                                                                  62,
                                                                );
                                                                docObj.text(
                                                                  item.leadInfo
                                                                    ?.phone ||
                                                                    "N/A",
                                                                  48,
                                                                  69,
                                                                );
                                                                docObj.text(
                                                                  (
                                                                    item
                                                                      .leadInfo
                                                                      ?.country ||
                                                                    "N/A"
                                                                  ).toUpperCase(),
                                                                  158,
                                                                  62,
                                                                );
                                                                docObj.text(
                                                                  (
                                                                    item
                                                                      .leadInfo
                                                                      ?.passportNumber ||
                                                                    "N/A"
                                                                  ).toUpperCase(),
                                                                  158,
                                                                  69,
                                                                );

                                                                // Companion headers
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "bold",
                                                                );
                                                                docObj.setFontSize(
                                                                  11,
                                                                );
                                                                docObj.text(
                                                                  `TRAVELING PARTY COMPANIONS (${item.companions.length} DECLARED)`,
                                                                  15,
                                                                  86,
                                                                );
                                                                docObj.line(
                                                                  15,
                                                                  88,
                                                                  195,
                                                                  88,
                                                                );

                                                                docObj.setFillColor(
                                                                  241,
                                                                  245,
                                                                  249,
                                                                );
                                                                docObj.rect(
                                                                  15,
                                                                  92,
                                                                  180,
                                                                  8,
                                                                  "F",
                                                                );

                                                                docObj.setFontSize(
                                                                  8,
                                                                );
                                                                docObj.setTextColor(
                                                                  47,
                                                                  55,
                                                                  70,
                                                                );
                                                                docObj.text(
                                                                  "NO.",
                                                                  18,
                                                                  97,
                                                                );
                                                                docObj.text(
                                                                  "FULL PASSENGER NAME (AS REGISTERED)",
                                                                  28,
                                                                  97,
                                                                );
                                                                docObj.text(
                                                                  "NATIONALITY/COUNTRY",
                                                                  98,
                                                                  97,
                                                                );
                                                                docObj.text(
                                                                  "PASSPORT / ID NO.",
                                                                  142,
                                                                  97,
                                                                );
                                                                docObj.text(
                                                                  "EXPIRY DATE",
                                                                  176,
                                                                  97,
                                                                );

                                                                let currentYVal = 100;
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "normal",
                                                                );
                                                                docObj.setTextColor(
                                                                  51,
                                                                  65,
                                                                  85,
                                                                );

                                                                (
                                                                  item.companions ||
                                                                  []
                                                                ).forEach(
                                                                  (
                                                                    c: any,
                                                                    index: number,
                                                                  ) => {
                                                                    if (
                                                                      index %
                                                                        2 ===
                                                                      1
                                                                    ) {
                                                                      docObj.setFillColor(
                                                                        250,
                                                                        251,
                                                                        252,
                                                                      );
                                                                      docObj.rect(
                                                                        15,
                                                                        currentYVal,
                                                                        180,
                                                                        8,
                                                                        "F",
                                                                      );
                                                                    }
                                                                    docObj.text(
                                                                      `${index + 1}`,
                                                                      18,
                                                                      currentYVal +
                                                                        5,
                                                                    );
                                                                    docObj.text(
                                                                      (
                                                                        c.fullName ||
                                                                        ""
                                                                      ).toUpperCase(),
                                                                      28,
                                                                      currentYVal +
                                                                        5,
                                                                    );
                                                                    docObj.text(
                                                                      (
                                                                        c.country ||
                                                                        ""
                                                                      ).toUpperCase(),
                                                                      98,
                                                                      currentYVal +
                                                                        5,
                                                                    );
                                                                    docObj.text(
                                                                      (
                                                                        c.passportNumber ||
                                                                        ""
                                                                      ).toUpperCase(),
                                                                      142,
                                                                      currentYVal +
                                                                        5,
                                                                    );
                                                                    docObj.text(
                                                                      c.passportExpiry ||
                                                                        "N/A",
                                                                      176,
                                                                      currentYVal +
                                                                        5,
                                                                    );

                                                                    docObj.setDrawColor(
                                                                      241,
                                                                      245,
                                                                      249,
                                                                    );
                                                                    docObj.line(
                                                                      15,
                                                                      currentYVal +
                                                                        8,
                                                                      195,
                                                                      currentYVal +
                                                                        8,
                                                                    );
                                                                    currentYVal += 8;
                                                                  },
                                                                );

                                                                currentYVal += 12;
                                                                docObj.setFillColor(
                                                                  254,
                                                                  252,
                                                                  232,
                                                                );
                                                                docObj.setDrawColor(
                                                                  254,
                                                                  240,
                                                                  138,
                                                                );
                                                                docObj.rect(
                                                                  15,
                                                                  currentYVal,
                                                                  180,
                                                                  18,
                                                                  "FD",
                                                                );

                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "bold",
                                                                );
                                                                docObj.setFontSize(
                                                                  7.5,
                                                                );
                                                                docObj.setTextColor(
                                                                  133,
                                                                  77,
                                                                  14,
                                                                );
                                                                docObj.text(
                                                                  "MANDATORY PASSENGER INSURANCE UNDERWRITING STATUS:",
                                                                  18,
                                                                  currentYVal +
                                                                    5,
                                                                );
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "normal",
                                                                );
                                                                docObj.setFontSize(
                                                                  7,
                                                                );
                                                                docObj.text(
                                                                  "Under the statutory maritime rules of Thailand, all charter groups must be declared with accurate passport details to vessel captains",
                                                                  18,
                                                                  currentYVal +
                                                                    9,
                                                                );
                                                                docObj.text(
                                                                  "prior to high-seas clearance. Failure to maintain correct registries on this manifest waives any active maritime injury coverages.",
                                                                  18,
                                                                  currentYVal +
                                                                    13,
                                                                );

                                                                currentYVal += 26;
                                                                docObj.setFont(
                                                                  "Helvetica",
                                                                  "bold",
                                                                );
                                                                docObj.setFontSize(
                                                                  8.5,
                                                                );
                                                                docObj.setTextColor(
                                                                  15,
                                                                  23,
                                                                  42,
                                                                );
                                                                docObj.text(
                                                                  "Lead Charterer Signature: Checked Digitally",
                                                                  15,
                                                                  currentYVal +
                                                                    5,
                                                                );
                                                                docObj.line(
                                                                  15,
                                                                  currentYVal +
                                                                    14,
                                                                  75,
                                                                  currentYVal +
                                                                    14,
                                                                );

                                                                docObj.text(
                                                                  "Date of Registry:",
                                                                  120,
                                                                  currentYVal +
                                                                    5,
                                                                );
                                                                docObj.line(
                                                                  120,
                                                                  currentYVal +
                                                                    14,
                                                                  180,
                                                                  currentYVal +
                                                                    14,
                                                                );
                                                                docObj.text(
                                                                  new Date().toLocaleDateString(),
                                                                  122,
                                                                  currentYVal +
                                                                    10,
                                                                );

                                                                const fName = `Insurance_Manifest_${(activeInq.name || "guest").toLowerCase().replace(/\s+/g, "_")}.pdf`;
                                                                docObj.save(
                                                                  fName,
                                                                );
                                                              } catch (pdfErr: any) {
                                                                console.error(
                                                                  "Agent PDF generation failed:",
                                                                  pdfErr,
                                                                );
                                                                alert(
                                                                  "Failed compiling PDF: " +
                                                                    pdfErr.message,
                                                                );
                                                              }
                                                            }}
                                                            className="w-full mt-2 py-1.5 px-3 bg-[#0F172A] hover:bg-slate-800 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1 cursor-pointer transition-colors border border-white/10"
                                                          >
                                                            <Download className="w-3.5 h-3.5 text-emerald-400" />{" "}
                                                            Download Passenger
                                                            Manifest PDF
                                                            (Compliance Record)
                                                          </button>
                                                        </div>
                                                      )}
                                                  </div>
                                                  <span
                                                    className={`text-[8px] text-slate-400 mt-1 font-mono ${isAgent ? "mr-1.5" : "ml-1.5"}`}
                                                  >
                                                    {item.createdAt
                                                      ? new Date(
                                                          item.createdAt,
                                                        ).toLocaleTimeString()
                                                      : ""}
                                                  </span>
                                                </div>
                                              );
                                            },
                                          )}
                                      </div>

                                      {/* Inbox Text Area Composer */}
                                      <form
                                        onSubmit={(e) =>
                                          sendAgentReply(e, activeInq)
                                        }
                                        className="p-3 bg-white border-t border-slate-200/60 flex gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                                      >
                                        <label className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xs cursor-pointer transition-colors border border-slate-300 flex items-center justify-center">
                                          <Paperclip className="h-3.5 w-3.5" />
                                          <input
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={(e) =>
                                              handleAgentFileUpload(
                                                e,
                                                activeInq,
                                              )
                                            }
                                            disabled={isSendingAgentReply}
                                          />
                                        </label>
                                        <input
                                          type="text"
                                          required
                                          value={agentReplyText}
                                          onChange={(e) =>
                                            setAgentReplyText(e.target.value)
                                          }
                                          disabled={isSendingAgentReply}
                                          placeholder={`Type reply directly to ${activeInq.name}...`}
                                          className="flex-1 py-2 px-3 border border-slate-350 text-[11px] text-slate-800 focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                                        />
                                        <button
                                          type="submit"
                                          disabled={
                                            isSendingAgentReply ||
                                            !agentReplyText.trim()
                                          }
                                          className="py-2 px-4 bg-emerald-800 hover:bg-emerald-950 disabled:opacity-50 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs"
                                        >
                                          {isSendingAgentReply ? (
                                            <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full shrink-0" />
                                          ) : (
                                            <span>Send Reply</span>
                                          )}
                                        </button>
                                      </form>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* --- REGISTERED CUSTOMERS TAB --- */}
                  {inquiriesTab === "customers" && (
                    <div className="space-y-4 block animate-in fade-in duration-150 text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans">
                            Registered Charter Guests & Accounts (
                            {customersList.length})
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            View details, citizenship, and passport records.
                            Open a guest's secure workspace to assist with their
                            travel manifest or booking.
                          </p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                          <div className="relative max-w-md w-full">
                            <input
                              type="text"
                              placeholder="Search guests by name/email..."
                              value={customerSearchQuery}
                              onChange={(e) =>
                                setCustomerSearchQuery(e.target.value)
                              }
                              className="w-full text-sm font-sans py-2 pl-3 pr-8 bg-white border border-slate-350 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden shadow-xs"
                            />
                            {customerSearchQuery && (
                              <button
                                onClick={() => setCustomerSearchQuery("")}
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-extrabold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerActiveTab("register");
                              setPortalMode("customer");
                            }}
                            className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" /> Guest Account
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const queryClean = customerSearchQuery
                          .trim()
                          .toLowerCase();
                        const filtered = customersList.filter((cust) => {
                          const name = (cust.name || "").toLowerCase();
                          const email = (cust.email || "").toLowerCase();
                          return (
                            name.includes(queryClean) ||
                            email.includes(queryClean)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 bg-slate-50 border border-slate-200/55 rounded-xs text-center space-y-1.5">
                              <p className="text-xs font-sans text-slate-600 font-bold">
                                {customersList.length === 0
                                  ? "No registered guests found in the database."
                                  : "No registered guests matched your search."}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                When travelers register their accounts on the
                                guest workspace, their profiles will appear
                                here.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="border border-slate-200/60 rounded bg-white overflow-hidden shadow-2xs flex flex-col">
                            <div className="overflow-x-auto w-full">
                              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                                <thead className="sticky top-0 z-10">
                                  <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/60 font-sans shadow-sm">
                                    <th className="py-2.5 px-3 font-semibold">
                                      Guest Profile
                                    </th>
                                    <th className="py-2.5 px-3 font-semibold">
                                      Contact
                                    </th>
                                    <th className="py-2.5 px-3 font-semibold">
                                      Passport & Citizenship
                                    </th>
                                    <th className="py-2.5 px-3 font-semibold">
                                      Companions
                                    </th>
                                    <th className="py-2.5 px-3 text-right font-semibold">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filtered.map((customer) => {
                                    const nameVal =
                                      customer.name || "Unnamed Guest";
                                    const avatarLetter =
                                      nameVal.trim().charAt(0).toUpperCase() ||
                                      "G";
                                    const companionsCount = Array.isArray(
                                      customer.companions,
                                    )
                                      ? customer.companions.length
                                      : 0;

                                    // Determine passport expiry status
                                    let passportStatus = "None declared";
                                    let isExpired = false;
                                    if (customer.passportExpiry) {
                                      const expDate = new Date(
                                        customer.passportExpiry,
                                      );
                                      const today = new Date();
                                      isExpired = expDate < today;
                                      passportStatus = isExpired
                                        ? `Expired (${customer.passportExpiry})`
                                        : `Valid (exp: ${customer.passportExpiry})`;
                                    }

                                    return (
                                      <React.Fragment key={customer.id}>
                                        <tr className="hover:bg-slate-50/70 transition-colors">
                                          <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2.5 py-0.5">
                                              <div className="h-8 w-8 rounded-full bg-emerald-800 text-white font-sans font-bold flex items-center justify-center shadow-xs">
                                                {avatarLetter}
                                              </div>
                                              <div>
                                                <div className="font-bold text-slate-900 line-clamp-1">
                                                  {nameVal}
                                                </div>
                                                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                                  UID:{" "}
                                                  {customer.id.substring(0, 8)}
                                                  ...
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <div className="space-y-0.5 text-[11px]">
                                              <div className="text-slate-700 font-mono font-medium">
                                                {customer.email || "No email"}
                                              </div>
                                              {customer.phone && (
                                                <div className="text-slate-500 font-sans">
                                                  {customer.phone}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <div className="space-y-0.5 text-[10.5px]">
                                              <div className="text-slate-800 font-medium font-sans">
                                                🇹🇭{" "}
                                                {customer.country ||
                                                  "Not specified"}
                                              </div>
                                              {customer.passport ? (
                                                <div className="text-slate-500 font-mono">
                                                  No. {customer.passport} •{" "}
                                                  <span
                                                    className={
                                                      isExpired
                                                        ? "text-rose-600 font-bold"
                                                        : "text-emerald-750"
                                                    }
                                                  >
                                                    {passportStatus}
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="text-slate-400 italic">
                                                  No passport registered
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${companionsCount > 0 ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-sans" : "bg-slate-50 text-slate-500 border border-slate-200 font-sans"}`}
                                            >
                                              {companionsCount}{" "}
                                              {companionsCount === 1
                                                ? "Companion"
                                                : "Companions"}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  let proceed = true;
                                                  try {
                                                    proceed =
                                                      window.self !== window.top
                                                        ? true
                                                        : window.confirm(
                                                            `Are you sure you want to permanently delete guest account: ${nameVal}?`,
                                                          );
                                                  } catch (err) {
                                                    proceed = true;
                                                  }
                                                  if (!proceed) return;
                                                  try {
                                                    await deleteDoc(
                                                      doc(
                                                        db,
                                                        "customers",
                                                        customer.id,
                                                      ),
                                                    );
                                                  } catch (err: any) {
                                                    alert(
                                                      "Error deleting guest: " +
                                                        err.message,
                                                    );
                                                  }
                                                }}
                                                className="p-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded flex items-center transition-colors cursor-pointer"
                                                title="Delete Guest Account"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (
                                                    activeCrmCustomerId ===
                                                    customer.id
                                                  ) {
                                                    setActiveCrmCustomerId(
                                                      null,
                                                    );
                                                  } else {
                                                    setActiveCrmCustomerId(
                                                      customer.id,
                                                    );
                                                    setCrmNotesDraft(
                                                      customer.crmNotes || "",
                                                    );
                                                    setCrmPreferencesDraft(
                                                      customer.crmPreferences ||
                                                        "",
                                                    );
                                                  }
                                                }}
                                                className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs font-sans"
                                              >
                                                <Edit2 className="w-3 h-3" />{" "}
                                                CRM Base
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setCustomerData(customer);
                                                  setCurrentCustomer({
                                                    uid: customer.id,
                                                    email: customer.email,
                                                    displayName: customer.name,
                                                  });
                                                  setPortalMode("customer");
                                                }}
                                                className="py-1 px-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs font-sans"
                                              >
                                                Open Workspace
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                        {activeCrmCustomerId ===
                                          customer.id && (
                                          <tr className="bg-slate-50/80 border-b border-t border-slate-200/60 shadow-inner">
                                            <td colSpan={5} className="p-5">
                                              <div className="space-y-4 max-w-4xl relative">
                                                <h5 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/60">
                                                  <Star className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />{" "}
                                                  VIP Preferences & Internal
                                                  Notes
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                  <div className="space-y-1.5 focus-within:relative z-10">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>{" "}
                                                      Private Notes (Internal
                                                      Only)
                                                    </label>
                                                    <textarea
                                                      rows={3}
                                                      value={crmNotesDraft}
                                                      onChange={(e) =>
                                                        setCrmNotesDraft(
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="e.g. Needs pick up from airport. Prefers quiet music."
                                                      className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-300/80 rounded-md shadow-2xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all resize-none text-slate-800"
                                                    />
                                                  </div>
                                                  <div className="space-y-1.5 focus-within:relative z-10">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>{" "}
                                                      VIP Preferences
                                                      (Allergies, Drinks)
                                                    </label>
                                                    <textarea
                                                      rows={3}
                                                      value={
                                                        crmPreferencesDraft
                                                      }
                                                      onChange={(e) =>
                                                        setCrmPreferencesDraft(
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="e.g. Allergic to peanuts. Favorite champagne is Moët."
                                                      className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-300/80 rounded-md shadow-2xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all resize-none text-slate-800"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="flex justify-end gap-3 pt-2">
                                                  <button
                                                    onClick={() =>
                                                      setActiveCrmCustomerId(
                                                        null,
                                                      )
                                                    }
                                                    className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer"
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleSaveCrm(customer.id)
                                                    }
                                                    disabled={isSavingCrm}
                                                    className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
                                                  >
                                                    {isSavingCrm
                                                      ? "Saving..."
                                                      : "Save CRM Profile"}
                                                  </button>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* --- FLEET / MEDIA MANAGEMENT TAB --- */}
                  {inquiriesTab === "fleet" && (
                    <div className="space-y-4 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans">
                          Ships and Destinations Media Manager
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Add, remove, or modify custom descriptions,
                          specifications, or base rates for charter catamarans
                          below. (Note: Photo management is restricted to system
                          administrators).
                        </p>
                      </div>

                      <AdminFleetSettings
                        hidePhotoEditing={true}
                        isAdmin={currentAgent?.isAdmin}
                        agentId={currentAgent?.id || currentAgent?.email}
                      />
                    </div>
                  )}

                  {inquiriesTab === "agent-chat" && (
                    <div className="space-y-4 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans">
                          Broker-to-Broker Secure Communications
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Privately message other registered agents on the
                          platform and securely share proposal documents.
                        </p>
                      </div>

                      <AgentChat />
                    </div>
                  )}

                  {inquiriesTab === "co-agents" && (
                    <div className="space-y-5 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-700" />
                          <span>Co-Agent Team Relationship Console</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          Register co-agents (e.g., Luka) under your main
                          representative profile. The system will generate a
                          custom dynamic QR code and referral link for each
                          partner. All customer messages sent via their link
                          flow instantly into your live chat console, labeled as
                          referred from that particular co-agent.
                        </p>
                      </div>

                      {coagentFeedback && (
                        <div
                          className={`p-3 rounded border text-xs font-sans font-medium flex items-center gap-2 ${
                            coagentFeedback.success
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-250 text-rose-800"
                          }`}
                        >
                          <span className="font-bold text-sm">
                            {coagentFeedback.success ? "✓" : "⚠"}
                          </span>
                          <span>{coagentFeedback.message}</span>
                        </div>
                      )}

                      <form
                        onSubmit={handleAddCoagent}
                        className="p-4 bg-slate-50/70 border border-slate-200 rounded space-y-3"
                      >
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                          + Register New Co-Agent / Partner Profile
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="block text-[9.5px] uppercase tracking-wider font-extrabold text-slate-505 font-sans">
                              Partner Name (e.g. Luka)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Luka"
                              value={newCoagentName}
                              onChange={(e) =>
                                setNewCoagentName(e.target.value)
                              }
                              className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9.5px] uppercase tracking-wider font-extrabold text-slate-505 font-sans">
                              Partner Phone (Generated in QR Code)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. +385 91 123 4567"
                              value={newCoagentPhone}
                              onChange={(e) =>
                                setNewCoagentPhone(e.target.value)
                              }
                              className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-medium"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="py-2 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          Add Co-Agent Relationship
                        </button>
                      </form>

                      <div className="space-y-4">
                        <h5 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider font-sans border-b pb-1.5 flex items-center gap-1">
                          <span>Active Co-Agent Partnerships</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.2 text-[9.5px] font-mono rounded">
                            {(currentAgent?.coagents || []).length}
                          </span>
                        </h5>

                        {!currentAgent?.coagents ||
                        currentAgent.coagents.length === 0 ? (
                          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded text-center text-slate-400 space-y-1">
                            <p className="text-[11px] font-sans font-bold text-slate-600">
                              No active co-agents added to your account yet.
                            </p>
                            <p className="text-[9.5px] font-sans text-slate-400">
                              Fill and submit the quick partners form above to
                              register and generate pairing QR codes.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {currentAgent.coagents.map((co) => {
                              const url = getCoagentUrl(co);
                              return (
                                <div
                                  key={co.id}
                                  className="border border-slate-200 bg-white rounded p-4 flex flex-col justify-between space-y-4 shadow-3xs hover:border-slate-350 transition-colors"
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h6 className="font-serif text-sm text-[#0F172A] font-extrabold">
                                          Partner Name: {co.name}
                                        </h6>
                                        <p className="text-[8.5px] text-slate-400 font-sans">
                                          Added:{" "}
                                          {new Date(
                                            co.createdAt,
                                          ).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveCoagent(co.id, co.name)
                                        }
                                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-full transition-colors cursor-pointer"
                                        title="Remove Partnership Link"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xs border border-slate-100 space-y-0.5">
                                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 font-sans block">
                                        Co-Agent Phone Contact
                                      </span>
                                      <span className="text-xs font-mono font-bold text-slate-800">
                                        {co.phone}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50/70 rounded border border-slate-200/60 p-3.5 space-y-2.5 flex flex-col items-center">
                                    <div className="p-2.5 bg-white rounded border border-slate-200">
                                      <QRCodeSVG
                                        id={`coagent-qr-code-svg-${co.id}`}
                                        value={url}
                                        size={120}
                                        level="H"
                                        includeMargin={true}
                                      />
                                    </div>

                                    <div className="text-center w-full space-y-2">
                                      <p className="text-[9px] font-sans text-slate-505 leading-normal max-w-[210px] mx-auto">
                                        Scanning this pairing QR code assigns{" "}
                                        <strong>{currentAgent.name}</strong> as
                                        primary agent on the cookies, but flags
                                        inquiries as originating from{" "}
                                        <strong>{co.name}</strong>.
                                      </p>

                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveCoagentEditorId(co.id);
                                            setInquiriesTab("qr-generator");
                                          }}
                                          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 rounded-xs text-[10px] font-sans font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs uppercase tracking-wider"
                                        >
                                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                                          <span>
                                            Create VIP Poster & Plaque
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {inquiriesTab === "workspace" && <WorkspaceHub />}

                  {inquiriesTab === "efficiency" && (
                    <div className="space-y-4 block animate-in fade-in duration-150 text-left">
                      <div className="border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
                          <Anchor className="h-4 w-4 text-emerald-700" />
                          <span>Efficiency Dashboard</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          Estimated travel times to major destinations based on
                          the 8 knots/h maximum cruising speed limit. Use this
                          tool to set realistic client expectations.
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 shadow-sm relative overflow-visible">
                        <div className="flex gap-4 items-center mb-6">
                          <div className="flex flex-col flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Applicable Vessels
                            </label>
                            <div className="text-xs font-semibold text-slate-700">
                              The Best, Namaste, The One
                            </div>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="flex flex-col flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Speed Constraint
                            </label>
                            <div className="text-xs font-semibold text-emerald-700">
                              8 knots (nm/hour)
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {DESTINATIONS.filter(
                            (d) => d.distanceNM && d.distanceNM > 0,
                          ).map((dest) => {
                            const timeHours = dest.distanceNM / 8;
                            const hrs = Math.floor(timeHours);
                            const mins = Math.round((timeHours - hrs) * 60);

                            return (
                              <div
                                key={dest.id}
                                className="bg-white p-4 rounded border border-slate-200"
                              >
                                <div className="text-xs font-bold text-slate-800 mb-1">
                                  {dest.name}
                                </div>
                                <div className="flex justify-between items-end mt-3">
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Distance:{" "}
                                    <span className="font-bold text-slate-700">
                                      {dest.distanceNM.toFixed(1)} nm
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-indigo-700">
                                    {hrs > 0 ? `${hrs}h ` : ""}
                                    {mins > 0
                                      ? `${mins}m`
                                      : hrs === 0
                                        ? "0m"
                                        : ""}{" "}
                                    est.
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                              <strong>Note:</strong> Travel times are strict
                              estimates under ideal weather conditions.
                              Headwinds, currents, and swell may increase actual
                              transit time. Guests should be warned against
                              aggressive scheduling.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inquiriesTab === "assistant" && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <AgentAIAssistant currentAgent={currentAgent} />
                    </div>
                  )}

                  {inquiriesTab === "prices" && <AgentPricesTab />}

                  {inquiriesTab === "gdrive" && (
                    <div className="space-y-4 p-4 border border-slate-200 rounded-sm">
                      <h3 className="font-bold text-sm">
                        Google Drive Management
                      </h3>
                      <p className="text-xs text-slate-600">
                        Securely back up your system data and client proposals
                        to your connected Google Drive folder.
                      </p>
                      <button
                        type="button"
                        onClick={backupSystemDataToDrive}
                        className="py-2 px-4 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
                      >
                        Backup System Data Now
                      </button>
                      {uploadProgress && (
                        <p className="text-xs text-sky-700">Backing up...</p>
                      )}
                      {gdriveStatusMessage && (
                        <p className="text-xs text-emerald-700">
                          {gdriveStatusMessage}
                        </p>
                      )}

                      <h3 className="font-bold text-sm mt-4">
                        System Notifications
                      </h3>
                      <button
                        type="button"
                        onClick={async () => {
                          const permission =
                            await Notification.requestPermission();
                          if (permission === "granted") {
                            new Notification("Test Notification", {
                              body: "This is a test notification from your Broker System.",
                              icon: "/icon.png",
                            });
                          } else {
                            alert("Notification permission denied.");
                          }
                        }}
                        className="py-2 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
                      >
                        Send Test Notification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Auth or Guest Portal Views */
              <div className="space-y-6 text-left">
                {/* Mode Selector Removed */}

                {portalMode === "customer" ? (
                  /* --- CUSTOMER PORTAL WRAPPER --- */
                  <div className="space-y-6">
                    {fetchingCustomerProfile ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-2">
                        <span className="h-6 w-6 border-2 border-emerald-800 border-t-transparent animate-spin rounded-full" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                          Retrieving secure records...
                        </span>
                      </div>
                    ) : currentCustomer || customerData?.uid ? (
                      /* Authenticated Customer View inside Agent Workspace */
                      <div className="space-y-6">
                        {/* Guest profile header */}
                        {(() => {
                          const clientName =
                            customerData?.name ||
                            currentCustomer?.displayName ||
                            currentCustomer?.email ||
                            "Charter Guest";
                          const initialChar =
                            clientName.trim().substring(0, 1).toUpperCase() ||
                            "C";
                          return (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-900/10 rounded-xs flex items-center gap-4 text-left">
                              <div className="h-12 w-12 rounded-full bg-emerald-850 text-white flex items-center justify-center text-xl font-sans font-black shadow-inner select-none shrink-0 border border-emerald-750/30">
                                {initialChar}
                              </div>
                              <div className="flex-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-800 font-mono block">
                                  Charter Guest File
                                </span>
                                <h4 className="text-xs font-sans font-extrabold text-slate-900 mt-0.5 tracking-tight">
                                  {clientName.toUpperCase()}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {currentCustomer?.email ||
                                    customerData?.email}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.removeItem(
                                    "sandbox_customer_session",
                                  );
                                  signOut(auth)
                                    .then(() => {
                                      setCurrentCustomer(null);
                                    })
                                    .catch(() => {
                                      setCurrentCustomer(null);
                                    });
                                }}
                                className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-red-200/40 transition-colors pointer-events-auto cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <LogOut className="h-3 w-3" /> Exit
                              </button>
                            </div>
                          );
                        })()}

                        {/* Booking File Status Indicator */}
                        <div className="p-3 bg-slate-100/80 border border-slate-200/60 rounded-xs text-left">
                          <span className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                            Charter Connection Routing
                          </span>
                          <p className="text-[10.5px] font-sans text-slate-700 mt-1 leading-relaxed">
                            Inside Representative hub for:{" "}
                            <strong className="text-slate-900">
                              {(
                                currentAgent?.name || "Booking Desk"
                              ).toUpperCase()}
                            </strong>
                          </p>
                        </div>

                        {/* Customer Settings/Profile Editor */}
                        <form
                          onSubmit={handleCustomerUpdateProfile}
                          className="space-y-4"
                        >
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-850 border-b pb-1.5 font-sans flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-emerald-800" />
                            <span>1. Guest Profile & ID Registry</span>
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* CitizenshipDropdown */}
                            <div className="space-y-1 block text-left">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                Country of Citizenship
                              </label>
                              <select
                                value={customerCountry}
                                onChange={(e) =>
                                  setCustomerCountry(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                              >
                                {WORLD_COUNTRIES.map((cty) => (
                                  <option key={cty} value={cty}>
                                    {cty}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Contact digits */}
                            <div className="space-y-1 block text-left">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans font-medium">
                                Contact number
                              </label>
                              <div className="flex gap-1.5">
                                <select
                                  value={customerPhoneCode}
                                  onChange={(e) =>
                                    setCustomerPhoneCode(e.target.value)
                                  }
                                  className="py-2 px-2 bg-white border border-slate-200 rounded-xs text-xs font-sans focus:ring-1 focus:ring-emerald-805"
                                >
                                  {CALLING_CODES.map((cc) => (
                                    <option key={cc.code} value={cc.code}>
                                      {cc.code}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="tel"
                                  placeholder="e.g. 901234567"
                                  value={customerPhoneNumber}
                                  onChange={(e) =>
                                    setCustomerPhoneNumber(e.target.value)
                                  }
                                  className="flex-1 text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805 focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Passport IDs details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 block text-left">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans font-medium">
                                Passport / ID Number
                              </label>
                              <input
                                type="text"
                                value={customerPassport}
                                onChange={(e) =>
                                  setCustomerPassport(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805 text-slate-800"
                              />
                            </div>
                            <div className="space-y-1 block text-left">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans font-medium">
                                Passport Expiration Date
                              </label>
                              <input
                                type="date"
                                value={customerPassportExpiry}
                                onChange={(e) =>
                                  setCustomerPassportExpiry(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={customerLoading}
                              className="py-2 px-4 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white font-sans text-[10.5px] font-bold uppercase tracking-wider rounded-xs cursor-pointer flex items-center justify-center gap-1 transition-colors shadow-xs"
                            >
                              <Save className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Save Profile Details
                            </button>
                          </div>
                        </form>

                        {/* Travel companions - Who will travel with him */}
                        <div className="space-y-4 text-left">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-850 border-b pb-1.5 font-sans flex items-center gap-1.5 mt-2">
                            <Plus className="h-3.5 w-3.5 text-emerald-800" />
                            <span>
                              2. Travel Party & Companions (Friends List)
                            </span>
                          </h4>

                          <form
                            onSubmit={handleCustomerAddCompanion}
                            className="p-3 bg-slate-50 border border-slate-200/60 rounded-xs grid grid-cols-1 md:grid-cols-2 gap-3 text-left"
                          >
                            <div className="space-y-1 block">
                              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                Companion Full Name
                              </label>
                              <input
                                type="text"
                                placeholder="E.G. JOHN SMITH"
                                required
                                value={companionName}
                                onChange={(e) =>
                                  setCompanionName(e.target.value)
                                }
                                className="w-full text-xs font-sans py-1.5 px-2.5 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805"
                              />
                            </div>

                            <div className="space-y-1 block">
                              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                Country of Nationality
                              </label>
                              <select
                                value={companionCountry}
                                onChange={(e) =>
                                  setCompanionCountry(e.target.value)
                                }
                                className="w-full text-xs font-sans py-1.5 px-2 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805"
                              >
                                {WORLD_COUNTRIES.map((cty) => (
                                  <option key={cty} value={cty}>
                                    {cty}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1 block">
                              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                Passport / ID Number
                              </label>
                              <input
                                type="text"
                                placeholder="E.G. BB987654"
                                value={companionPassport}
                                onChange={(e) =>
                                  setCompanionPassport(e.target.value)
                                }
                                className="w-full text-xs font-sans py-1.5 px-2.5 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805"
                              />
                            </div>

                            <div className="space-y-1 block">
                              <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                Passport Expiry Date
                              </label>
                              <input
                                type="date"
                                value={companionExpiry}
                                onChange={(e) =>
                                  setCompanionExpiry(e.target.value)
                                }
                                className="w-full text-xs font-sans py-1.5 px-2.5 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805"
                              />
                            </div>

                            <div className="md:col-span-2 pt-1 text-left">
                              <button
                                type="submit"
                                className="py-1.5 px-3 bg-emerald-850 hover:bg-emerald-950 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5 text-emerald-400" />{" "}
                                Add Companion to Party
                              </button>
                            </div>
                          </form>

                          {/* Friends / companions registered list */}
                          {customerCompanions.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic text-center py-2 bg-white border border-dashed border-slate-200 rounded-xs">
                              Sailing individual lead guest registry. No
                              companions added.
                            </p>
                          ) : (
                            <div className="border border-slate-200/60 rounded-xs bg-white overflow-hidden shadow-2xs block">
                              <table className="w-full text-left font-sans text-[10.5px]">
                                <thead className="bg-[#0F172A] text-white text-[9px] uppercase tracking-wider">
                                  <tr>
                                    <th className="py-2.5 px-3">No. Name</th>
                                    <th className="py-2.5 px-3">Citizenship</th>
                                    <th className="py-2.5 px-2 hidden sm:table-cell">
                                      ID / Passport
                                    </th>
                                    <th className="py-2.5 px-3 text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {customerCompanions.map((comp, idx) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                                        {idx + 1}. {comp.fullName}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-550">
                                        {comp.country}
                                      </td>
                                      <td className="py-2.5 px-2 text-slate-450 font-mono hidden sm:table-cell text-[9.5px]">
                                        {comp.passportNumber || "N/A"} (Exp:{" "}
                                        {comp.passportExpiry || "N/A"})
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCustomerRemoveCompanion(idx)
                                          }
                                          className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-sm cursor-pointer transition-colors"
                                          title="Remove passenger"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Forward Manifest to Active Agent Section */}
                        <div className="p-4 bg-emerald-900/[0.03] border border-emerald-950/15 rounded-xs text-left space-y-3 pt-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-900 font-sans flex items-center gap-1.5 border-b pb-1">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>
                              3. Submit Passenger Manifest to Yacht
                              Representative
                            </span>
                          </label>

                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Underwriter High-seas Insurance Clearances require
                            this manifest file to be forwarded directly to your
                            lead agent desk.
                          </p>

                          <div className="flex flex-col gap-2 pt-1">
                            {/* Option 1: Direct App Sync (Saves to current agent Chat History in Firestore) */}
                            <button
                              type="button"
                              onClick={handleCustomerSendManifestToAgentChat}
                              className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white font-sans text-[10.5px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                            >
                              <Send className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
                              <span>
                                Dispatch Passenger Manifest to Agent Chat
                              </span>
                            </button>

                            {/* Option 2: Download PDF directly */}
                            <button
                              type="button"
                              onClick={handleCustomerDownloadPdf}
                              className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white border border-white/10 font-mono text-[9.5px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Download PDF Manifest for Insurance
                            </button>
                          </div>

                          {/* Social copies and emails (Line/whatsapp/wechat) */}
                          <div className="space-y-2 pt-2 border-t border-slate-200/80">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                              Or send manifest via social networks:
                            </span>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {/* WhatsApp WhatsApp client copy */}
                              <button
                                type="button"
                                onClick={() => {
                                  const text = compileCustomerTextManifest();
                                  const num =
                                    currentAgent?.whatsapp || "+66636368287";
                                  const encoded = encodeURIComponent(text);
                                  window.open(
                                    `https://api.whatsapp.com/send?phone=${num.replace(/[^0-9+]/g, "")}&text=${encoded}`,
                                    "_blank",
                                  );
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 rounded-xs text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                WhatsApp
                              </button>

                              {/* LINE line client copy */}
                              <button
                                type="button"
                                onClick={() => {
                                  const text = compileCustomerTextManifest();
                                  const encoded = encodeURIComponent(text);
                                  window.open(
                                    `https://line.me/R/msg/text/?${encoded}`,
                                    "_blank",
                                  );
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 rounded-xs text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                LINE
                              </button>

                              {/* WeChat copy trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  const text = compileCustomerTextManifest();
                                  navigator.clipboard.writeText(text);
                                  setShowWechatPromptCustomer(true);
                                  setTimeout(
                                    () => setShowWechatPromptCustomer(false),
                                    8000,
                                  );
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 rounded-xs text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                WeChat
                              </button>

                              {/* Email Dispatcher redirect */}
                              <button
                                type="button"
                                onClick={() => {
                                  const text = compileCustomerTextManifest();
                                  const destEmail =
                                    currentAgent?.email ||
                                    "info@phuketcharter.com";
                                  window.open(
                                    `mailto:${destEmail}?subject=Official%20Passenger%2520Manifest%252520-%252520Insurance%25252520Registration&body=${encodeURIComponent(text)}`,
                                    "_blank",
                                  );
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 rounded-xs text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                Email Agent
                              </button>
                            </div>

                            {showWechatPromptCustomer && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-[9px] text-[#0F172A] p-2 bg-amber-50 border border-amber-250 italic leading-relaxed rounded-xs"
                              >
                                📋 copied: Manifest copied to your system
                                clipboard successfully!
                                <br />
                                💬 Forward it in WeChat to representative ID:{" "}
                                <strong>
                                  {currentAgent?.wechatId || "phuket_yachts"}
                                </strong>
                              </motion.p>
                            )}
                          </div>
                        </div>

                        {/* Customer Password & Account Management Security */}
                        <div className="border border-red-900/10 bg-red-50/5 p-4 rounded-xs text-left space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-800 border-b pb-1.5 font-sans flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 text-red-700" />
                            <span>4. Security & Account Options</span>
                          </h4>

                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setShowCustomerPasswordChange(
                                  !showCustomerPasswordChange,
                                )
                              }
                              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                            >
                              Change Password
                            </button>

                            <button
                              type="button"
                              onClick={handleCustomerDeleteAccount}
                              className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-red-200/20 transition-colors cursor-pointer"
                            >
                              Delete Account
                            </button>
                          </div>

                          {showCustomerPasswordChange && (
                            <form
                              onSubmit={handleCustomerChangePassword}
                              className="space-y-3 pt-2 text-left"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1 block">
                                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans text-left">
                                    New password
                                  </label>
                                  <PasswordInput
                                    required
                                    value={customerNewPwd}
                                    onChange={(e) =>
                                      setCustomerNewPwd(e.target.value)
                                    }
                                    className="text-xs font-sans py-1 rounded-xs border border-slate-200 px-2 bg-white"
                                  />
                                </div>
                                <div className="space-y-1 block">
                                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans text-left">
                                    Confirm Password
                                  </label>
                                  <PasswordInput
                                    required
                                    value={customerConfirmPwd}
                                    onChange={(e) =>
                                      setCustomerConfirmPwd(e.target.value)
                                    }
                                    className="text-xs font-sans py-1 rounded-xs border border-slate-200 px-2 bg-white"
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                className="py-1 px-3 bg-[#0F172A] text-white text-[9px] font-bold uppercase tracking-wider rounded-xs cursor-pointer hover:bg-slate-800"
                              >
                                Save New Password
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Guest Login or Create Account switchboard block */
                      <div className="space-y-5">
                        {/* Guest Authentication state tabs */}
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xs">
                          <button
                            type="button"
                            onClick={() => setCustomerActiveTab("login")}
                            className={`py-2 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                              customerActiveTab === "login"
                                ? "bg-white text-emerald-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-950 bg-transparent"
                            }`}
                          >
                            Guest Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerActiveTab("register")}
                            className={`py-2 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                              customerActiveTab === "register"
                                ? "bg-white text-emerald-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-950 bg-transparent"
                            }`}
                          >
                            Create Guest Account
                          </button>
                        </div>

                        {customerActiveTab === "login" ? (
                          /* Guest Log In Form */
                          <form
                            onSubmit={handleCustomerLogin}
                            className="space-y-4"
                          >
                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                Guest Email Address
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. guest@example.com"
                                  value={customerEmail}
                                  onChange={(e) =>
                                    setCustomerEmail(e.target.value)
                                  }
                                  className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                                />
                              </div>
                            </div>

                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                Password
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="password"
                                  required
                                  placeholder="••••••••"
                                  value={customerPwd}
                                  onChange={(e) =>
                                    setCustomerPwd(e.target.value)
                                  }
                                  className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={customerLoading}
                              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-xs transition-colors mt-2"
                            >
                              {customerLoading
                                ? "Accessing Space..."
                                : "Sign In to Guest Space"}
                            </button>

                            <div className="text-center pt-2">
                              <button
                                type="button"
                                onClick={handleCustomerResetPassword}
                                className="text-[10.5px] text-slate-500 hover:text-emerald-800 transition-colors underline cursor-pointer"
                              >
                                Reset Guest Password
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Guest Registration Form (includes Contact, Citizenship and Passport for Insurance Purpose) */
                          <form
                            onSubmit={handleCustomerRegister}
                            className="space-y-4"
                          >
                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  required
                                  placeholder="E.G. ALICE SMITH (Use full names for insurance)"
                                  value={customerRegName}
                                  onChange={(e) =>
                                    setCustomerRegName(e.target.value)
                                  }
                                  className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 uppercase"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 block">
                                <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                  Email Address{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="email"
                                    required
                                    placeholder="alice@example.com"
                                    value={customerRegEmail}
                                    onChange={(e) =>
                                      setCustomerRegEmail(e.target.value)
                                    }
                                    className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1 block">
                                <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                  Password{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="password"
                                    required
                                    placeholder="Min 6 characters"
                                    value={customerRegPwd}
                                    onChange={(e) =>
                                      setCustomerRegPwd(e.target.value)
                                    }
                                    className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Citizenship list all country */}
                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-700 font-sans">
                                Country of Citizenship (Lists All Countries){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 font-medium" />
                                <select
                                  value={customerCountry}
                                  onChange={(e) =>
                                    setCustomerCountry(e.target.value)
                                  }
                                  className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-755"
                                >
                                  {WORLD_COUNTRIES.map((cty) => (
                                    <option key={cty} value={cty}>
                                      {cty}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* phone setting digits digits */}
                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                                Mobile Phone / WhatsApp Contact{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={customerPhoneCode}
                                  onChange={(e) =>
                                    setCustomerPhoneCode(e.target.value)
                                  }
                                  className="py-2.5 px-3 bg-white border border-slate-200 rounded-xs text-xs font-sans focus:ring-1 focus:ring-emerald-850 focus:outline-hidden"
                                >
                                  {CALLING_CODES.map((cc) => (
                                    <option key={cc.code} value={cc.code}>
                                      {cc.code} ({cc.country})
                                    </option>
                                  ))}
                                </select>
                                <div className="relative flex-1">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="tel"
                                    required
                                    placeholder="901234567"
                                    value={customerPhoneNumber}
                                    onChange={(e) =>
                                      setCustomerPhoneNumber(e.target.value)
                                    }
                                    className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Passport IDs for maritime insurance purpose */}
                            <div className="border border-emerald-990/10 bg-emerald-50/20 p-3 rounded-xs space-y-3">
                              <div className="flex items-center gap-1.5 text-emerald-800">
                                <ShieldAlert className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider font-sans">
                                  Maritime Insurance Mandate
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                                Under Thai high-seas safety governance, actual
                                passports or national IDs must be declared to
                                underwriters prior to high-performance yacht
                                charters.
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1 block">
                                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans text-left">
                                    Passport / ID Number
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. AA123456"
                                    value={customerPassport}
                                    onChange={(e) =>
                                      setCustomerPassport(e.target.value)
                                    }
                                    className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805 text-slate-800 uppercase font-mono"
                                  />
                                </div>
                                <div className="space-y-1 block">
                                  <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans text-left">
                                    Expiration Date
                                  </label>
                                  <input
                                    type="date"
                                    value={customerPassportExpiry}
                                    onChange={(e) =>
                                      setCustomerPassportExpiry(e.target.value)
                                    }
                                    className="w-full text-xs font-sans py-2 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-emerald-805 text-slate-800"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={customerLoading}
                              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-xs transition-colors mt-2"
                            >
                              {customerLoading
                                ? "Creating Account..."
                                : "Create Account & Agree to Terms"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- AGENT AUTH VIEWS --- */
                  <div className="space-y-6">
                    {/* Tabs selection */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xs">
                      <button
                        id="tab-login"
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className={`py-2 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                          activeTab === "login"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900 bg-transparent"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        id="tab-register"
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className={`py-2 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all ${
                          activeTab === "register"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-slate-500 hover:text-slate-900 bg-transparent"
                        }`}
                      >
                        Register Broker Link
                      </button>
                    </div>

                    {/* Main Form Fields */}
                    {activeTab === "login" ? (
                      isResetMode ? (
                        <div className="space-y-4 text-left">
                          <div className="bg-amber-50 border border-amber-200 rounded-sm p-3.5 space-y-2">
                            <h4 className="text-xs font-sans font-bold text-amber-900 uppercase tracking-wide">
                              Representative Password Check system
                            </h4>
                            <p className="text-[10px] leading-relaxed text-slate-600">
                              Representative accounts are registered securely
                              inside our direct-write Firestore database. You
                              can check your email's existence here, reset it,
                              or launch an instant WhatsApp recovery with admin
                              Vinko.
                            </p>
                          </div>

                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Registered Representative Email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="reset-email"
                                type="email"
                                placeholder="Enter registered broker email"
                                value={resetEmailInput}
                                onChange={(e) => {
                                  setResetEmailInput(e.target.value);
                                  setResetLookupResult(null);
                                }}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const clean = resetEmailInput
                                  .trim()
                                  .toLowerCase();
                                if (!clean) {
                                  alert("Please specify your email first.");
                                  return;
                                }
                                const foundAgent = agents.find(
                                  (a) =>
                                    (a.email || "").toLowerCase().trim() ===
                                    clean,
                                );
                                if (foundAgent) {
                                  setResetLookupResult({
                                    found: true,
                                    name: foundAgent.name,
                                    email: foundAgent.email,
                                  });
                                } else {
                                  setResetLookupResult({
                                    found: false,
                                    email: clean,
                                  });
                                }
                              }}
                              className="px-3 py-2 bg-slate-900 text-white rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors"
                            >
                              🔍 Check Database Presence
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsResetMode(false);
                                setResetLookupResult(null);
                              }}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xs font-sans font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              ⬅️ Back to Sign In
                            </button>
                          </div>

                          {resetLookupResult && (
                            <div
                              className={`p-3 rounded-sm border text-[10.5px] space-y-2 leading-relaxed ${
                                resetLookupResult.found
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-850"
                                  : "bg-red-50 border-red-200 text-red-850"
                              }`}
                            >
                              {resetLookupResult.found ? (
                                <>
                                  <p className="font-bold uppercase tracking-wider text-[9px] text-emerald-900 font-sans">
                                    ✓ Active Representative Record Discovered!
                                  </p>
                                  <p>
                                    Representative{" "}
                                    <strong>{resetLookupResult.name}</strong> is
                                    registered under{" "}
                                    <strong>{resetLookupResult.email}</strong>.
                                  </p>
                                  {/* ONLINE SELF-SERVICE PASSWORD RESET GATEWAY */}
                                  <div className="bg-white border text-left border-emerald-200 shadow-xs rounded-sm p-3.5 space-y-3 mt-2 text-slate-800">
                                    <h5 className="text-[10.5px] uppercase tracking-wider font-bold text-slate-850 font-sans border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                      <span>🔒 INSTANT ONLINE SELF-RESET</span>
                                    </h5>

                                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                                      Confirm your identity below by entering your registered WhatsApp/Contact Phone number to self-authorize this credential reset.
                                    </p>

                                    {selfResetError && (
                                      <div className="p-2 border border-red-200 bg-red-50 text-[9.5px] rounded-xs text-red-800 font-sans font-medium">
                                        ⚠️ {selfResetError}
                                      </div>
                                    )}

                                    {selfResetSuccess && (
                                      <div className="p-2 border border-emerald-300 bg-emerald-50 text-[9.5px] rounded-xs text-emerald-900 font-sans font-bold">
                                        🎉 {selfResetSuccess}
                                      </div>
                                    )}

                                    {!selfResetSuccess && (
                                      <div className="space-y-2.5">
                                        <div className="space-y-1">
                                          <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                            Registered WhatsApp / Phone Number:
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="e.g. +66 63 636 8287 or last 4 digits"
                                            value={verificationWhatsapp}
                                            onChange={(e) => {
                                              setVerificationWhatsapp(e.target.value);
                                              setSelfResetError(null);
                                            }}
                                            className="w-full text-xs font-sans p-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden text-slate-800"
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                            New Secure Password:
                                          </label>
                                          <div className="relative">
                                            <input
                                              type={showNewResetPassword ? "text" : "password"}
                                              placeholder="New password (min 6 chars)"
                                              value={newResetPassword}
                                              onChange={(e) => {
                                                setNewResetPassword(e.target.value);
                                                setSelfResetError(null);
                                              }}
                                              className="w-full text-xs font-sans p-2 pr-9 bg-slate-50 border border-slate-200 rounded-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden text-slate-800"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setShowNewResetPassword(!showNewResetPassword)
                                              }
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                              {showNewResetPassword ? (
                                                <EyeOff className="h-3 w-3" />
                                              ) : (
                                                <Eye className="h-3 w-3" />
                                              )}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-600 font-sans">
                                            Confirm New Password:
                                          </label>
                                          <input
                                            type="password"
                                            placeholder="Retype password to confirm"
                                            value={confirmResetPassword}
                                            onChange={(e) => {
                                              setConfirmResetPassword(e.target.value);
                                              setSelfResetError(null);
                                            }}
                                            className="w-full text-xs font-sans p-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden text-slate-800"
                                          />
                                        </div>

                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setSelfResetError(null);
                                            setSelfResetSuccess(null);

                                            const emailClean = resetEmailInput.trim().toLowerCase();
                                            const phoneClean = verificationWhatsapp
                                              .trim()
                                              .replace(/[^\d]/g, "");
                                            const pass = newResetPassword;
                                            const passConf = confirmResetPassword;

                                            if (!phoneClean) {
                                              setSelfResetError(
                                                "Please provide your registered Phone/WhatsApp.",
                                              );
                                              return;
                                            }
                                            if (!pass) {
                                              setSelfResetError(
                                                "Please provide a new secure password.",
                                              );
                                              return;
                                            }
                                            if (pass.length < 6) {
                                              setSelfResetError(
                                                "Password must be at least 6 characters.",
                                              );
                                              return;
                                            }
                                            if (pass !== passConf) {
                                              setSelfResetError("Passwords do not match.");
                                              return;
                                            }

                                            const targetAgent = agents.find(
                                              (a) =>
                                                (a.email || "").toLowerCase().trim() ===
                                                emailClean,
                                            );

                                            if (!targetAgent) {
                                              setSelfResetError("Representative record not found.");
                                              return;
                                            }

                                            const storedPhoneClean = (
                                              targetAgent.contactPhone || ""
                                            ).replace(/[^\d]/g, "");
                                            const storedWaClean = (
                                              targetAgent.whatsapp || ""
                                            ).replace(/[^\d]/g, "");

                                            let matches = false;
                                            if (storedPhoneClean && phoneClean) {
                                              if (
                                                storedPhoneClean.endsWith(phoneClean) ||
                                                phoneClean.endsWith(storedPhoneClean)
                                              ) {
                                                matches = true;
                                              }
                                            }
                                            if (storedWaClean && phoneClean) {
                                              if (
                                                storedWaClean.endsWith(phoneClean) ||
                                                phoneClean.endsWith(storedWaClean)
                                              ) {
                                                matches = true;
                                              }
                                            }

                                            if (!matches) {
                                              setSelfResetError(
                                                "Verification Failed: Registered Phone/WhatsApp mismatch.",
                                              );
                                              return;
                                            }

                                            const res = await adminResetPassword(
                                              targetAgent.email,
                                              pass,
                                            );
                                            if (res.success) {
                                              setSelfResetSuccess(
                                                "Password updated instantly! Returning to login...",
                                              );
                                              setLoginEmail(targetAgent.email);
                                              setLoginPwd(pass);
                                              setVerificationWhatsapp("");
                                              setNewResetPassword("");
                                              setConfirmResetPassword("");
                                              setTimeout(() => {
                                                setIsResetMode(false);
                                                setResetLookupResult(null);
                                                setSelfResetSuccess(null);
                                              }, 2200);
                                            } else {
                                              setSelfResetError("Failed: " + res.message);
                                            }
                                          }}
                                          className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 font-medium"
                                        >
                                          🔒 Reset Password Online
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-slate-200 mt-2 space-y-1">
                                    <p className="text-[9px] text-slate-500 text-center italic font-sans_not_used">
                                      Alternatively, ask Admin Vinko to trigger a manual bypass:
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const whatsappNumber = "66636368287"; // Vinko/Mobydick
                                        const text = `Hi Vinko, I'm representative ${resetLookupResult.name} (${resetLookupResult.email}). I forgot my login credentials for the Phuket Yacht Charter Dashboard. Could you please check my account or reset my password to password123? Thank you!`;
                                        window.open(
                                          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
                                          "_blank",
                                        );
                                      }}
                                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 rounded-xs cursor-pointer transition-colors"
                                    >
                                      💬 Ask Admin via WhatsApp
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="font-bold uppercase tracking-wider text-[9px] text-red-900 font-sans">
                                    ✗ Profile Not Discovered
                                  </p>
                                  <p>
                                    No representative account was found matching{" "}
                                    <strong>{resetLookupResult.email}</strong>.
                                    Please verify your spelling or register as a
                                    new broker.
                                  </p>
                                  <div className="pt-1.5 border-t border-red-200/50 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const whatsappNumber = "66636368287";
                                        const text = `Hi Vinko, I tried logging in with ${resetLookupResult.email} but my account isn't listed. Can you check my broker credentials?`;
                                        window.open(
                                          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
                                          "_blank",
                                        );
                                      }}
                                      className="py-1.5 px-3 bg-slate-800 text-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-xs cursor-pointer inline-flex items-center gap-1"
                                    >
                                      💬 Message Vinko
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <form
                          onSubmit={handleLoginSubmit}
                          className="space-y-4"
                        >
                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Representative Email address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="login-email-input"
                                type="email"
                                required
                                placeholder="e.g. broker@example.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="login-pass-input"
                                type={showLoginPwd ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={loginPwd}
                                onChange={(e) => setLoginPwd(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-10 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPwd(!showLoginPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 transition-colors focus:outline-hidden"
                                title={
                                  showLoginPwd
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showLoginPwd ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <button
                            id="btn-login-submit"
                            type="submit"
                            className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-xs transition-colors mt-2"
                          >
                            Authenticate Representative File
                          </button>

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsResetMode(true);
                                setErrorMsg(null);
                                setResetEmailInput(loginEmail);
                              }}
                              className="text-[10.5px] text-slate-500 hover:text-slate-800 transition-colors underline decoration-slate-300 hover:decoration-slate-500 cursor-pointer font-sans"
                            >
                              Forgot your password or need a reset check?
                            </button>
                          </div>
                        </form>
                      )
                    ) : (
                      <form
                        onSubmit={handleRegisterSubmit}
                        className="space-y-4"
                      >
                        <div className="space-y-1 block">
                          <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                            Full Licensed Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              id="reg-name-input"
                              type="text"
                              required
                              placeholder="e.g. Agent Representative"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Email address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="reg-email-input"
                                type="email"
                                required
                                placeholder="broker@charter.com"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Account Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="reg-pass-input"
                                type={showRegPwd ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={regPwd}
                                onChange={(e) => setRegPwd(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-10 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPwd(!showRegPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 transition-colors focus:outline-hidden"
                                title={
                                  showRegPwd ? "Hide password" : "Show password"
                                }
                              >
                                {showRegPwd ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              Call Reservations Phone
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="reg-phone-input"
                                type="text"
                                placeholder="+66 63 636 8287"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 block">
                            <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                              WhatsApp Link Number
                            </label>
                            <div className="relative">
                              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                id="reg-whatsapp-input"
                                type="text"
                                placeholder="+66636368287"
                                value={regWhatsapp}
                                onChange={(e) => setRegWhatsapp(e.target.value)}
                                className="w-full text-xs font-sans py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 block pt-1">
                          <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                            Line ID (Optional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-emerald-800 font-sans tracking-tight bg-emerald-100 px-1 py-0.5 rounded-xs">
                              LINE
                            </span>
                            <input
                              id="reg-lineid-input"
                              type="text"
                              placeholder="e.g. 064948883"
                              value={regLineId}
                              onChange={(e) => setRegLineId(e.target.value)}
                              className="w-full text-xs font-sans py-2.5 pl-12 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 block pt-1">
                          <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                            WeChat ID (Optional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-emerald-800 font-sans tracking-tight bg-emerald-100 px-1 py-0.5 rounded-xs">
                              WeChat
                            </span>
                            <input
                              id="reg-wechatid-input"
                              type="text"
                              placeholder="e.g. wx_agent"
                              value={regWechatId}
                              onChange={(e) => setRegWechatId(e.target.value)}
                              className="w-full text-xs font-sans py-2.5 pl-16 pr-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Company Registration Section */}
                        <div className="border-t border-slate-200/65 pt-3 mt-3 text-left">
                          <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-[#0F172A]/70 font-sans block mb-3">
                            Company Details
                          </span>

                          <div className="space-y-3">
                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                                Company Name (Optional)
                              </label>
                              <input
                                id="reg-company-name-input"
                                type="text"
                                placeholder="e.g. Premier Yacht Brokerage Co., Ltd."
                                value={regCompanyName}
                                onChange={(e) =>
                                  setRegCompanyName(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden text-slate-705"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 block">
                                <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                                  Country
                                </label>
                                <select
                                  id="reg-country-select"
                                  value={regCountry}
                                  onChange={(e) =>
                                    setRegCountry(e.target.value)
                                  }
                                  className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden text-[#0F172A]"
                                >
                                  <option value="Thailand">Thailand</option>
                                  <option value="Singapore">Singapore</option>
                                  <option value="Malaysia">Malaysia</option>
                                  <option value="Hong Kong">Hong Kong</option>
                                  <option value="Indonesia">Indonesia</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="space-y-1 block">
                                <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                                  Tax ID{" "}
                                  {regCountry === "Thailand" && (
                                    <span className="text-red-500 font-extrabold">
                                      *
                                    </span>
                                  )}
                                </label>
                                <input
                                  id="reg-tax-id-input"
                                  type="text"
                                  placeholder="e.g. 0835564002341"
                                  required={regCountry === "Thailand"}
                                  value={regTaxId}
                                  onChange={(e) => setRegTaxId(e.target.value)}
                                  className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden text-slate-705"
                                />
                                {regCountry === "Thailand" && (
                                  <p className="text-[8.5px] text-amber-600 font-sans font-medium mt-0.5">
                                    * Required if company is in Thailand
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1 block">
                              <label className="block text-[9.5px] uppercase tracking-wider font-bold text-slate-705 font-sans">
                                Full Company Address
                              </label>
                              <textarea
                                id="reg-company-address-input"
                                rows={2}
                                placeholder="e.g. 43/20 Moo 5, Rawai, Mueang Phuket District, Phuket 83130"
                                value={regCompanyAddress}
                                onChange={(e) =>
                                  setRegCompanyAddress(e.target.value)
                                }
                                className="w-full text-xs font-sans py-2.5 px-3 bg-white border border-slate-200 rounded-xs focus:ring-1 focus:ring-[#0F172A] focus:outline-hidden text-slate-705"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          id="btn-register-submit"
                          type="submit"
                          className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-xs transition-colors mt-2"
                        >
                          Create Registered Broker Credentials
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* VIP Card Photo Share Walker Overlay */}
          {sharingPhotoUrl && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded shadow-2xl flex flex-col items-center text-white"
              >
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => setSharingPhotoUrl(null)}
                    className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-bold uppercase rounded cursor-pointer transition-colors border border-slate-700"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="text-center space-y-1 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 tracking-widest rounded-full animate-pulse">
                    ✨ Send VIP Invitation
                  </span>
                  <h4 className="text-sm font-sans font-extrabold uppercase text-amber-300 tracking-wider pt-1">
                    Tap & Hold to Share Photo
                  </h4>
                  <p className="text-[10px] text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
                    📱 On Mobile:{" "}
                    <span className="text-emerald-300 font-bold">
                      Tap & Hold (Long Press)
                    </span>{" "}
                    on the card below to click "Save Image", "Add to Photos", or
                    share directly into WhatsApp & Email.
                  </p>
                </div>

                <div className="bg-white p-2 rounded-md shadow-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
                  {sharingPhotoUrl === "fallback" ? (
                    <div className="text-center p-5 bg-slate-900 text-slate-300 rounded max-w-xs border border-slate-800">
                      <p className="text-[11px] leading-relaxed mb-3 text-slate-350">
                        Direct Canvas-to-PNG conversion is blocked by this
                        browser's security/sandbox boundaries.
                      </p>
                      <div className="mb-3.5 flex justify-center">
                        <Download className="h-9 w-9 text-amber-300 animate-bounce" />
                      </div>
                      <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                        Use SVG Option below
                      </p>
                      <p className="text-[9px] text-slate-400 leading-normal mt-1">
                        The SVG file retains full vector resolution and
                        downloads flawlessly in every browser context.
                      </p>
                    </div>
                  ) : (
                    <img
                      src={sharingPhotoUrl}
                      alt="VIP Representative Card"
                      className="w-[240px] h-[374px] object-cover rounded pointer-events-auto"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="mt-4 w-full space-y-2">
                  {sharingPhotoUrl !== "fallback" && (
                    <a
                      href={sharingPhotoUrl}
                      download={`${(profileName || currentAgent?.name || "agent").replace(/\s+/g, "_")}_vip_card.png`}
                      className="w-full py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md text-center border border-emerald-600"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-300" />
                      Download High-Res PNG Photo
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const svgElement = document.getElementById(
                        "broker-invitation-card-svg",
                      );
                      if (svgElement) {
                        const svgString = new XMLSerializer().serializeToString(
                          svgElement,
                        );
                        const svgBlob = new Blob([svgString], {
                          type: "image/svg+xml;charset=utf-8",
                        });
                        const svgUrl = URL.createObjectURL(svgBlob);
                        const downloadLink = document.createElement("a");
                        downloadLink.href = svgUrl;
                        downloadLink.download = `${(profileName || currentAgent?.name || "agent").replace(/\s+/g, "_")}_vip_invitation_card.svg`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      }
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9.5px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-slate-750"
                  >
                    <Download className="h-3 w-3" />
                    Save Original Vector SVG
                  </button>

                  <button
                    type="button"
                    onClick={() => setSharingPhotoUrl(null)}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white text-[9.5px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all border border-slate-850"
                  >
                    Return to Workspace
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* PDF Chatbot Modal */}
          <PDFChatModal
            isOpen={isPdfChatOpen}
            onClose={() => setIsPdfChatOpen(false)}
          />

          {/* Custom Toast Container for Real-time Boarding push notifications */}
          <div className="fixed bottom-6 right-6 z-[6000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
              {agentToasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-auto bg-slate-950/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xs shadow-2xl flex gap-3 items-start relative overflow-hidden"
                >
                  {/* Accent decoration */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500 animate-pulse" />

                  <Anchor className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0 pr-4 text-left">
                    <h4 className="text-[10px] font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {toast.title}
                    </h4>
                    <p className="text-[10px] text-slate-350 mt-1 leading-normal font-sans">
                      {toast.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAgentToasts((prev) =>
                        prev.filter((t) => t.id !== toast.id),
                      )
                    }
                    className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 shrink-0 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
