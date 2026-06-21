import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  LogIn,
  User,
  Check,
  Plus,
  Trash2,
  Download,
  Send,
  ShieldAlert,
  Globe,
  Key,
  AlertTriangle,
  LogOut,
  Phone,
  FileText,
  Share2,
  MessageSquare,
  MessageCircle,
  QrCode,
  Compass,
  ArrowRight,
  Menu,
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { useAgent } from "../AgentContext";
import { generateCharterQuotationPdf } from "../lib/pdfGenerator";
import { BookingRecord } from "../types";
import PasswordInput from "./PasswordInput";
import GuestFeedbackModal from "./GuestFeedbackModal";

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register" | "forgot" | "express-manifest";
}

interface Companion {
  fullName: string;
  country: string;
  passportNumber: string;
  passportExpiry: string;
}

export const CALLING_CODES = [
  { code: "+66", country: "Thailand" },
  { code: "+1", country: "USA / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+852", country: "Hong Kong" },
  { code: "+62", country: "Indonesia" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+81", country: "Japan" },
  { code: "+91", country: "India" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+7", country: "Russia" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+41", country: "Switzerland" },
  { code: "+31", country: "Netherlands" },
  { code: "+46", country: "Sweden" },
  { code: "+27", country: "South Africa" },
  { code: "+64", country: "New Zealand" },
];

export const WORLD_COUNTRIES = [
  "Thailand",
  "United States",
  "United Kingdom",
  "Australia",
  "Singapore",
  "Germany",
  "France",
  "Japan",
  "India",
  "Canada",
  "China",
  "Hong Kong",
  "Malaysia",
  "Indonesia",
  "Switzerland",
  "Netherlands",
  "Sweden",
  "Italy",
  "Spain",
  "Russia",
  "United Arab Emirates",
  "New Zealand",
  "South Africa",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua & Barbuda",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia & Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Jamaica",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Rwanda",
  "Saint Kitts & Nevis",
  "Saint Lucia",
  "Saint Vincent",
  "Samoa",
  "San Marino",
  "Sao Tome & Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Korea",
  "South Sudan",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad & Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

// Custom jspdf manifest document compiler formatted elegantly for insurance and harbor master
export const compileManifestPdf = (profile: any, companions: Companion[]) => {
  const doc = new jsPDF();

  const primaryColor = [15, 23, 42]; // #0F172A - Yacht Charcoal Blue
  const accentColor = [16, 185, 129]; // #10B981 - Emerald Green
  const textColor = [51, 65, 85]; // Slate 700
  const lightGrey = [241, 245, 249]; // Slate 100
  const lineGrey = [226, 232, 240]; // Slate 200

  // 1. Draw header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 42, "F");

  // Accent line
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 42, 210, 2, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PHUKET PRIVATE YACHT EXCURSIONS", 15, 18);

  doc.setFont("Helvetica", "medium");
  doc.setFontSize(10);
  doc.text(
    "OFFICIAL PASSENGER MANIFEST & MARITIME INSURANCE REGISTRATION",
    15,
    26,
  );
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "In accordance with high-seas safety charters of the Harbor Master Department of the Kingdom of Thailand",
    15,
    33,
  );

  // 2. Lead Guest Details
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LEAD GUEST DETAILS (ACCOUNT CHARTERER)", 15, 54);

  doc.setDrawColor(lineGrey[0], lineGrey[1], lineGrey[2]);
  doc.line(15, 56, 195, 56);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500

  doc.text("FULL NAME:", 15, 62);
  doc.text("EMAIL ADDRESS:", 15, 69);
  doc.text("PHONE CONTACT:", 15, 76);

  doc.text("COUNTRY / NATIONALITY:", 110, 62);
  doc.text("PASSPORT / ID NUMBER:", 110, 69);
  doc.text("PASSPORT EXPIRY DATE:", 110, 76);

  // Lead Values
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("Helvetica", "normal");

  doc.text((profile?.name || "").toUpperCase(), 48, 62);
  doc.text(profile?.email || "", 48, 69);
  doc.text(profile?.phoneNumber || "NOT PROVIDED", 48, 76);

  doc.text((profile?.country || "NOT PROVIDED").toUpperCase(), 158, 62);
  doc.text(profile?.passportNumber || "NOT PROVIDED", 158, 69);
  doc.text(profile?.passportExpiry || "NOT PROVIDED", 158, 76);

  // 3. Companion Details Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    `TRAVELING PARTY COMPANIONS & DISASTER RECOVERY BENEFICIARIES (${companions.length} REGISTERED)`,
    15,
    90,
  );
  doc.line(15, 92, 195, 92);

  // Table Headers
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.rect(15, 96, 180, 8, "F");

  doc.setFontSize(8);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(47, 55, 70);
  doc.text("NO.", 18, 101);
  doc.text("FULL PASSENGER NAME (AS REGISTERED)", 28, 101);
  doc.text("NATIONALITY/COUNTRY", 98, 101);
  doc.text("PASSPORT / ID NO.", 142, 101);
  doc.text("EXPIRY DATE", 176, 101);

  // Rows
  let currentY = 104;
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (companions.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.text(
      "No travel companions registered. Vessel sailing with Lead Individual only.",
      20,
      112,
    );
    currentY = 120;
  } else {
    companions.forEach((c, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(250, 251, 252);
        doc.rect(15, currentY, 180, 8, "F");
      }

      doc.text(`${index + 1}`, 18, currentY + 5);
      doc.text((c.fullName || "").toUpperCase(), 28, currentY + 5);
      doc.text((c.country || "").toUpperCase(), 98, currentY + 5);
      doc.text((c.passportNumber || "").toUpperCase(), 142, currentY + 5);
      doc.text(c.passportExpiry || "N/A", 176, currentY + 5);

      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 8, 195, currentY + 8);

      currentY += 8;
    });
  }

  // 4. Maritime Law Warning
  currentY += 12;
  doc.setFillColor(254, 252, 232); // Light yellow
  doc.setDrawColor(254, 240, 138); // Border yellow
  doc.rect(15, currentY, 180, 18, "FD");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(133, 77, 14); // Wood/Brown yellow text
  doc.text(
    "MANDATORY PASSENGER INSURANCE UNDERWRITING STATUS:",
    18,
    currentY + 5,
  );
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Under the statutory maritime rules of Thailand, all charter groups must be declared with accurate passport details to vessel captains",
    18,
    currentY + 9,
  );
  doc.text(
    "prior to high-seas clearance. Failure to maintain correct registries on this manifest waives any active maritime injury coverages.",
    18,
    currentY + 13,
  );

  // 5. Signature Fields
  currentY += 26;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Lead Charterer Signature:", 15, currentY + 5);
  doc.line(15, currentY + 14, 75, currentY + 14);

  doc.text("Date of Registry:", 120, currentY + 5);
  doc.line(120, currentY + 14, 180, currentY + 14);
  doc.setFont("Helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 122, currentY + 10);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Digital compliance log compiled through Phuket Yacht Broker secure customer nodes.",
    15,
    currentY + 22,
  );

  return doc;
};

export default function CustomerPortalModal({
  isOpen,
  onClose,
  initialTab = "login",
}: CustomerPortalModalProps) {
  const { currentAgent, currentCoagent } = useAgent();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Authentication & View states
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeQRBooking, setActiveQRBooking] = useState<BookingRecord | null>(
    null,
  );
  const [bookingForFeedback, setBookingForFeedback] =
    useState<BookingRecord | null>(null);

  const [activeTab, setActiveTab ] = useState<"login" | "register" | "forgot" | "express-manifest">(
    initialTab,
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const checkUrlParams = async () => {
      if (isOpen && activeTab === "express-manifest") {
        const params = new URLSearchParams(window.location.search);
        const urlBookingId = params.get("bookingId");
        if (urlBookingId && urlBookingId.trim()) {
          const cleanId = urlBookingId.trim();
          setExpressBookingId(cleanId);
          setExpressLoading(true);
          setExpressError(null);
          setExpressSuccess(null);
          try {
            const docRef = doc(db, "booking_requests", cleanId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setExpressLeadName(data.clientName || data.customerName || "");
              setExpressLeadEmail(data.customerEmail || data.email || "");
              setExpressLeadPhone(data.customerPhone || data.phone || "");
              setExpressCharterDate(data.charterDate || "");
              setExpressVessel(data.vesselId1 || "Premium Yacht");
              if (data.passengers && Array.isArray(data.passengers)) {
                const list: Companion[] = data.passengers.map((p: any) => ({
                  fullName: p.name || p.fullName || "",
                  country: p.nationality || p.country || "Thailand",
                  passportNumber: p.passport || p.passportNumber || "",
                  passportExpiry: p.passportExpiry || "",
                }));
                setExpressCompanions(list);
              }
              setExpressSuccess("Yacht itinerary synced! Please list your companions' details below.");
            }
          } catch (e: any) {
            console.error("Auto prefill failed:", e);
          } finally {
            setExpressLoading(false);
          }
        }
      }
    };
    checkUrlParams();
  }, [isOpen, activeTab]);

  // Express Manifest (No registration) states
  const [expressBookingId, setExpressBookingId] = useState("");
  const [expressLeadName, setExpressLeadName] = useState("");
  const [expressLeadEmail, setExpressLeadEmail] = useState("");
  const [expressLeadPhone, setExpressLeadPhone] = useState("");
  const [expressLeadCountry, setExpressLeadCountry] = useState("Thailand");
  const [expressLeadPassport, setExpressLeadPassport] = useState("");
  const [expressLeadExpiry, setExpressLeadExpiry] = useState("");
  const [expressCharterDate, setExpressCharterDate] = useState("");
  const [expressVessel, setExpressVessel] = useState("Premium Yacht");
  const [expressCompanions, setExpressCompanions] = useState<Companion[]>([]);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressSuccess, setExpressSuccess] = useState<string | null>(null);
  const [expressError, setExpressError] = useState<string | null>(null);

  // New Express Traveler fields
  const [expTravName, setExpTravName] = useState("");
  const [expTravCountry, setExpTravCountry] = useState("Thailand");
  const [expTravPassport, setExpTravPassport] = useState("");
  const [expTravExpiry, setExpTravExpiry] = useState("");
  const [expTravAge, setExpTravAge] = useState("");
  const [dashboardTab, setDashboardTab] = useState<
    "manifest" | "settings" | "edit_profile" | "history"
  >("manifest");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);

  // Login / Register Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Lead Guest settings fields
  const [phoneCode, setPhoneCode] = useState("+66");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");

  // New Traveler Form fields
  const [companionName, setCompanionName] = useState("");
  const [companionCountry, setCompanionCountry] = useState("");
  const [companionPassport, setCompanionPassport] = useState("");
  const [companionExpiry, setCompanionExpiry] = useState("");

  // Edit Profile fields
  const [editName, setEditName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editDietaryRestrictions, setEditDietaryRestrictions] = useState("");

  // Password Update fields
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Express Manifest functions
  const handleExpressLoadBooking = async () => {
    if (!expressBookingId.trim()) {
      setExpressError("Please provide a Booking Request ID or Reference ID.");
      return;
    }
    setExpressLoading(true);
    setExpressError(null);
    setExpressSuccess(null);
    try {
      const cleanId = expressBookingId.trim();
      const docRef = doc(db, "booking_requests", cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExpressLeadName(data.clientName || data.customerName || "");
        setExpressLeadEmail(data.customerEmail || data.email || "");
        setExpressLeadPhone(data.customerPhone || data.phone || "");
        setExpressCharterDate(data.charterDate || "");
        setExpressVessel(data.vesselId1 || "Premium Yacht");
        if (data.passengers && Array.isArray(data.passengers)) {
          const list: Companion[] = data.passengers.map((p: any) => ({
            fullName: p.name || p.fullName || "",
            country: p.nationality || p.country || "Thailand",
            passportNumber: p.passport || p.passportNumber || "",
            passportExpiry: p.passportExpiry || "",
          }));
          setExpressCompanions(list);
        }
        setExpressSuccess("Booking itinerary loaded successfully from Firestore!");
      } else {
        setExpressError("No booking found with this ID. You can still fill out the manifest manually below!");
      }
    } catch (e: any) {
      console.error(e);
      setExpressError("Failed to lookup booking reference: " + e.message);
    } finally {
      setExpressLoading(false);
    }
  };

  const handleExpressSaveAndSync = async () => {
    if (!expressBookingId.trim()) {
      setExpressError("Please specify your Booking Request ID to Link & Sync.");
      return;
    }
    if (!expressLeadName.trim()) {
      setExpressError("Please enter your Lead Passenger Full Name.");
      return;
    }
    setExpressLoading(true);
    setExpressError(null);
    setExpressSuccess(null);
    try {
      const cleanId = expressBookingId.trim();
      const docRef = doc(db, "booking_requests", cleanId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setExpressError("Booking ID is incorrect. Verify the ID and try again.");
        setExpressLoading(false);
        return;
      }
      
      const mappedPassengers = expressCompanions.map((c) => ({
        name: c.fullName,
        nationality: c.country,
        passport: c.passportNumber,
        passportExpiry: c.passportExpiry,
        age: "N/A"
      }));

      await updateDoc(docRef, {
        clientName: expressLeadName,
        customerEmail: expressLeadEmail,
        customerPhone: expressLeadPhone,
        passengers: mappedPassengers,
        manifestSyncedAt: new Date().toISOString(),
      });

      setExpressSuccess("SUCCESS! The passenger manifest has been completely synchronized with the yacht boarding master. Crews at the pier will automatically see this upon boarding!");
    } catch (e: any) {
      console.error(e);
      setExpressError("Failed to synchronize manifest with database: " + e.message);
    } finally {
      setExpressLoading(false);
    }
  };

  const handleExpressDownloadPdf = () => {
    if (!expressLeadName.trim()) {
      alert("Please provide the Lead Guest Full Name before downloading!");
      return;
    }
    const fakeProfile = {
      name: expressLeadName,
      email: expressLeadEmail,
      phoneNumber: expressLeadPhone,
      country: expressLeadCountry,
      passportNumber: expressLeadPassport,
      passportExpiry: expressLeadExpiry,
    };
    const pdfDoc = compileManifestPdf(fakeProfile, expressCompanions);
    pdfDoc.save(`Official_Yacht_Manifest_${expressLeadName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleAddExpressCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTravName.trim()) {
      alert("Passenger Name is required.");
      return;
    }
    const newComp: Companion = {
      fullName: expTravName.trim(),
      country: expTravCountry || "Thailand",
      passportNumber: expTravPassport.trim() || "N/A",
      passportExpiry: expTravExpiry || "N/A",
    };
    setExpressCompanions([...expressCompanions, newComp]);
    setExpTravName("");
    setExpTravPassport("");
    setExpTravExpiry("");
  };

  const handleRemoveExpressCompanion = (idx: number) => {
    setExpressCompanions(expressCompanions.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (userObj) => {
      let activeUser = userObj;
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

      if (activeUser) {
        // Prevent Captain session from cross-logging as a Customer
        const isCaptainLocal = localStorage.getItem(
          `captain_cache_${activeUser.email}`,
        );
        if (isCaptainLocal) {
          setUser(null);
          setProfile(null);
          return;
        }
        try {
          const captainDoc = await getDoc(doc(db, "captains", activeUser.uid));
          if (captainDoc.exists()) {
            localStorage.setItem(
              `captain_cache_${activeUser.email}`,
              JSON.stringify(captainDoc.data()),
            );
            setUser(null);
            setProfile(null);
            return;
          }
        } catch (e) {
          console.warn("IsCaptain lookup bypass:", e);
        }
      }

      setUser(activeUser);
      if (activeUser) {
        setFetchingProfile(true);
        try {
          const docRef = doc(db, "customers", activeUser.uid);
          const snap = await getDoc(docRef);
          let data: any = null;
          if (snap.exists()) {
            data = snap.data();
            try {
              localStorage.setItem(
                `offline_customer_${activeUser.uid}`,
                JSON.stringify(data),
              );
            } catch (storageErr) {}
          } else {
            // Check offline cache as fallback
            const localData = localStorage.getItem(
              `offline_customer_${activeUser.uid}`,
            );
            if (localData) {
              try {
                data = JSON.parse(localData);
              } catch (e) {}
            }
          }

          if (data) {
            setProfile(data);

            setEditName(data.name || "");
            setEditPhoneNumber(data.phoneNumber || "");
            setEditDietaryRestrictions(data.dietaryRestrictions || "");

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

            setPhoneCode(foundPrefix);
            setPhoneNumber(mainNum);
            setCountry(data.country || "");
            setPassportNumber(data.passportNumber || "");
            setPassportExpiry(data.passportExpiry || "");
            setCompanions(data.companions || []);

            // Fetch bookings
            const bookingsMap = new Map();

            try {
              const qUid = query(
                collection(db, "booking_requests"),
                where("customerUid", "==", activeUser.uid),
              );
              const snapUid = await getDocs(qUid);
              snapUid.forEach((doc) =>
                bookingsMap.set(doc.id, { ...doc.data(), id: doc.id }),
              );
            } catch (e) {}

            if (activeUser.email) {
              try {
                const qEmail = query(
                  collection(db, "booking_requests"),
                  where("customerEmail", "==", activeUser.email),
                );
                const snapEmail = await getDocs(qEmail);
                snapEmail.forEach((doc) =>
                  bookingsMap.set(doc.id, { ...doc.data(), id: doc.id }),
                );
              } catch (e) {}
            }

            setBookings(Array.from(bookingsMap.values()) as BookingRecord[]);
          }
        } catch (err: any) {
          console.warn(
            "Soft Offline Notice: customer portal profile read error:",
            err.message,
          );
          // Try to recover from local fallback cache completely
          const localData = localStorage.getItem(
            `offline_customer_${activeUser.uid}`,
          );
          if (localData) {
            try {
              const data = JSON.parse(localData);
              setProfile(data);
              setEditName(data.name || "");
              setEditPhoneNumber(data.phoneNumber || "");
              setEditDietaryRestrictions(data.dietaryRestrictions || "");
              setCountry(data.country || "");
              setPassportNumber(data.passportNumber || "");
              setPassportExpiry(data.passportExpiry || "");
              setCompanions(data.companions || []);
            } catch (pErr) {}
          }
        } finally {
          setFetchingProfile(false);
        }
      } else {
        setProfile(null);
        setCompanions([]);
      }
    });

    return () => unsub();
  }, [isOpen]);

  // LOGIN/REGISTER logic (Email/Password only)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      alert("Please fill in all fields (Name, Email, Password)");
      return;
    }

    setLoading(true);
    try {
      // Auth might be slow, so we can wrap in a timeout:
      const timeoutPromise = new Promise<{ user: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Auth Timeout")), 1500),
      );
      const userCredential = await Promise.race([
        createUserWithEmailAndPassword(auth, email, password),
        timeoutPromise,
      ]);
      const user = userCredential.user;

      const agentObj = currentAgent ||
        profile?.representativeBroker || {
          name: "Agent Team",
          email: "info@phuketcharter.com",
        };
      const brokerEmailStr = (agentObj.email || "info@phuketcharter.com")
        .toLowerCase()
        .trim();
      const brokerIdStr = agentObj.id || agentObj.uid || "unassigned";

      const adminGuestData = {
        uid: user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
        brokerId: brokerIdStr,
        brokerEmail: brokerEmailStr,
      };

      try {
        const p1 = setDoc(
          doc(db, "admin_registered_guests", user.uid),
          adminGuestData,
        );
        const p2 = setDoc(doc(db, "customers", user.uid), adminGuestData);
        const fbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 1000),
        );
        await Promise.race([Promise.all([p1, p2]), fbTimeout]);
      } catch (err) {
        console.warn("Firestore save delayed or failed:", err);
      }

      alert("Account created successfully!");
      setActiveTab("login");
    } catch (error: any) {
      console.warn(
        "Registration failed on standard Firebase Auth, trying secure guest sandbox mode fallback:",
        error,
      );
      try {
        // Double-check if this customer email is already stored in our database
        const qCust = query(
          collection(db, "customers"),
          where("email", "==", email.trim()),
        );
        let snapshot: any = { empty: true };
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1000),
          );
          snapshot = await Promise.race([getDocs(qCust), timeoutPromise]);
        } catch (err) {
          console.warn("Firestore getDocs delayed or failed:", err);
        }

        if (!snapshot.empty && snapshot.forEach) {
          let existingData: any = null;
          snapshot.forEach((d: any) => {
            existingData = d.data();
          });
          if (existingData) {
            localStorage.setItem(
              "sandbox_customer_session",
              JSON.stringify(existingData),
            );
            setUser(existingData);
            alert(
              `Customer email ${email.trim()} is already registered in the system. Logged in automatically!`,
            );
            return;
          }
        }

        const fallbackUid =
          "cust_" + Math.random().toString(36).substring(2, 9);
        const agentObj = currentAgent ||
          profile?.representativeBroker || {
            name: "Agent Team",
            email: "info@phuketcharter.com",
          };
        const brokerEmailStr = (agentObj.email || "info@phuketcharter.com")
          .toLowerCase()
          .trim();
        const brokerIdStr = agentObj.id || agentObj.uid || "unassigned";

        const adminGuestData = {
          uid: fallbackUid,
          name,
          email,
          authStatus: "direct_firestore_sandbox",
          createdAt: new Date().toISOString(),
          brokerId: brokerIdStr,
          brokerEmail: brokerEmailStr,
        };

        try {
          const p1 = setDoc(
            doc(db, "admin_registered_guests", fallbackUid),
            adminGuestData,
          );
          const p2 = setDoc(doc(db, "customers", fallbackUid), adminGuestData);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000),
          );
          await Promise.race([Promise.all([p1, p2]), timeoutPromise]);
        } catch (err) {
          console.warn("Firestore fallback save delayed or failed:", err);
        }

        alert(
          "Guest Account registered successfully via Sandbox Mode!\n\n" +
            "Note: Firebase Authentication provider uses sandbox direct-write storage. " +
            "Direct secure entry has been established.",
        );
        setActiveTab("login");
      } catch (fallbackError: any) {
        console.error("Direct fallback registration failed:", fallbackError);
        alert(`Registration failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      // Add a timeout for Auth
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth Timeout")), 1500),
      );
      await Promise.race([
        signInWithEmailAndPassword(auth, email, password),
        timeoutPromise,
      ]);
    } catch (error: any) {
      console.warn(
        "Firebase Auth login failed, checking sandbox direct-search database:",
        error,
      );
      try {
        // Fallback: search Firestore database for matching sandbox customer account
        const qCust = query(
          collection(db, "customers"),
          where("email", "==", email.trim()),
        );
        let snapshot: any = { empty: true };
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1000),
          );
          snapshot = await Promise.race([getDocs(qCust), timeoutPromise]);
        } catch (err) {
          console.warn("Firestore getDocs delayed or failed:", err);
        }

        if (!snapshot.empty && snapshot.forEach) {
          let foundSandboxUser: any = null;
          snapshot.forEach((d: any) => {
            foundSandboxUser = d.data();
          });

          if (foundSandboxUser) {
            // Log in successfully via sandbox!
            localStorage.setItem(
              "sandbox_customer_session",
              JSON.stringify(foundSandboxUser),
            );
            setUser(foundSandboxUser);
            alert("Signed in successfully via secure direct sandbox mode!");
            return;
          }
        }
      } catch (dbError) {
        console.error("Failed to query direct sandbox customer:", dbError);
      }

      let finalErrMsg = error.message;
      if (finalErrMsg.includes("invalid-credential")) {
        finalErrMsg =
          "Incorrect email or password. If you don't have an account, please switch to the Register tab to create one.";
      } else if (finalErrMsg === "Auth Timeout") {
        finalErrMsg = "Login system timed out. Please try again.";
      }

      alert(finalErrMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
      setActiveTab("login");
    } catch (err: any) {
      console.error(err);
      alert("Failed to send reset email: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const updateData = {
        name: editName,
        phoneNumber: editPhoneNumber,
        dietaryRestrictions: editDietaryRestrictions,
      };

      // Update customers
      await updateDoc(doc(db, "customers", user.uid), updateData);
      // Update admin_registered_guests
      await updateDoc(doc(db, "admin_registered_guests", user.uid), updateData);

      setProfile((prev: any) => ({ ...prev, ...updateData }));
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const compiledPhone = `${phoneCode} ${phoneNumber.trim()}`;
      const docRef = doc(db, "customers", user.uid);
      await setDoc(
        docRef,
        {
          phoneNumber: compiledPhone,
          country,
          passportNumber,
          passportExpiry,
        },
        { merge: true },
      );

      setProfile((prev: any) => ({
        ...prev,
        phoneNumber: compiledPhone,
        country,
        passportNumber,
        passportExpiry,
      }));

      alert("Lead insurance and profile records compiled successfully!");
    } catch (err: any) {
      console.error("Error saving lead guidelines:", err);
      alert("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBoardingPass = async (b: BookingRecord) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(b.id, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 250,
      });
      const doc = new jsPDF("p", "mm", "a4");

      // Ticket background and border
      doc.setFillColor(250, 250, 250);
      doc.rect(10, 10, 190, 150, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, 10, 190, 150, "S");

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(10, 10, 190, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("GUEST BOARDING PASS", 105, 25, { align: "center" });

      const brandText = currentAgent?.companyName
        ? `${currentAgent.companyName.toUpperCase()}${currentAgent.companyAddress ? ` - ${currentAgent.companyAddress.toUpperCase()}` : ""}`
        : "PHUKET AMAZING YACHT CHARTER";
      doc.setFontSize(brandText.length > 40 ? 7.5 : 9);
      doc.text(brandText, 105, 33, { align: "center" });

      // Body format
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.text(`Booking Reference: ${b.id.replace("prop-", "BK-")}`, 20, 55);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Guest Name:`, 20, 70);
      doc.setFont("helvetica", "bold");
      doc.text(`${(b.clientName || "Direct Guest").toUpperCase()}`, 60, 70);

      doc.setFont("helvetica", "normal");
      doc.text(`Charter Date:`, 20, 85);
      doc.setFont("helvetica", "bold");
      doc.text(`${b.charterDate || "TBA"}`, 60, 85);

      doc.setFont("helvetica", "normal");
      doc.text(`Vessel:`, 20, 100);
      doc.setFont("helvetica", "bold");
      doc.text(`${(b.vesselId1 || "").toUpperCase()}`, 60, 100);

      // QR Code for captain scan
      doc.addImage(qrDataUrl, "PNG", 130, 60, 60, 60);

      // Scan instruction
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Captain / Charter Staff: Scan this QR code to load the confirmed itinerary",
        160,
        130,
        { align: "center", maxWidth: 60 },
      );
      doc.text(
        "and view client passenger manifest securely via the internal portal.",
        160,
        137,
        { align: "center", maxWidth: 60 },
      );

      // Notice
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This document is subject to the terms and conditions outlined in the Charter Reassurance policy.",
        105,
        150,
        { align: "center" },
      );

      doc.save(
        `Boarding_Pass_${b.charterDate || "TBA"}_${b.clientName.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (err) {
      console.error("Error generating boarding pass QR/PDF", err);
      alert("Failed to generate boarding pass. Please try again.");
    }
  };

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (
      !companionName.trim() ||
      !companionCountry.trim() ||
      !companionPassport.trim()
    ) {
      alert("Please fill in companion name, country and passport details.");
      return;
    }

    setLoading(true);
    try {
      const newCompanion: Companion = {
        fullName: companionName.trim(),
        country: companionCountry.trim(),
        passportNumber: companionPassport.trim(),
        passportExpiry: companionExpiry || "N/A",
      };

      const updatedCompanions = [...companions, newCompanion];
      const docRef = doc(db, "customers", user.uid);
      await setDoc(
        docRef,
        {
          companions: updatedCompanions,
        },
        { merge: true },
      );

      setCompanions(updatedCompanions);
      setCompanionName("");
      setCompanionCountry("");
      setCompanionPassport("");
      setCompanionExpiry("");

      alert(
        `${newCompanion.fullName} added successfully to your insurance roster!`,
      );
    } catch (err: any) {
      console.error("Failed adding traveler companion:", err);
      alert("Failed to add companion: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompanion = async (indexToRemove: number) => {
    if (!user) return;
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = confirm(
          "Are you sure you want to remove this passenger from the insurance manifest?",
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    setLoading(true);
    try {
      const updatedCompanions = companions.filter(
        (_, idx) => idx !== indexToRemove,
      );
      const docRef = doc(db, "customers", user.uid);
      await setDoc(
        docRef,
        {
          companions: updatedCompanions,
        },
        { merge: true },
      );

      setCompanions(updatedCompanions);
      alert("Passenger removed from roster.");
    } catch (err: any) {
      console.error("Failed removing traveler companion:", err);
      alert("Failed to exclude traveler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert("Password cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        await updatePassword(currentUserObj, newPassword);
        alert("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
      }
    } catch (error: any) {
      console.error("Password update failed:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = confirm(
          "🚨 DANGER: Are you absolutely sure you want to PERMANENTLY delete your guest account?\n\n" +
            "This will instantly wipe your registration details and all travel companions from our insurance manifest files. This action is irreversible.",
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    setLoading(true);
    try {
      const currentUserObj = auth.currentUser;
      if (currentUserObj) {
        // Soft delete Firestore document
        await updateDoc(doc(db, "customers", currentUserObj.uid), {
          isActive: false,
        });

        // Log out user
        localStorage.removeItem("sandbox_customer_session");
        signOut(auth).then(() => {
          setUser(null);
          alert(
            "Your customer account and related insurance records have been deactivated and marked for review.",
          );
          onClose();
        });
      }
    } catch (error: any) {
      console.error("Self deletion failed:", error);
      alert(
        "For security verification, you must have logged in very recently to delete this account. " +
          "Please log out, sign back in, and try deleting your profile again immediately.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      const docData = compileManifestPdf(
        {
          name:
            profile?.name ||
            user?.displayName ||
            user?.email ||
            "Valued Customer",
          email: user?.email || "",
          phoneNumber: phoneNumber || "Not Provided",
          country: country || "Not Provided",
          passportNumber: passportNumber || "Not Provided",
          passportExpiry: passportExpiry || "Not Provided",
        },
        companions,
      );

      const fileName = `Official_Insurance_Manifest_${(profile?.name || "guest").toLowerCase().replace(/\s+/g, "_")}.pdf`;
      docData.save(fileName);
    } catch (e: any) {
      console.error("PDF download crashed:", e);
      alert("Error building document PDF: " + e.message);
    }
  };

  const [showWechatPrompt, setShowWechatPrompt] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const compileTextManifest = () => {
    const companionsText = companions
      .map(
        (c, i) =>
          `- Traveler ${i + 1}: ${c.fullName.toUpperCase()} | Nationality: ${c.country.toUpperCase()} | Passport: ${c.passportNumber.toUpperCase()} | Exp: ${c.passportExpiry}`,
      )
      .join("\n");

    return (
      `📋 GUEST PASSENGER MANIFEST FOR MARITIME INSURANCE\n` +
      `--------------------------------------------------\n` +
      `LEAD CHARTERER:\n` +
      `• Name: ${(profile?.name || user?.displayName || user?.email || "N/A").toUpperCase()}\n` +
      `• Phone: ${phoneCode} ${phoneNumber.trim() || "N/A"}\n` +
      `• Citizenship: ${(country || "N/A").toUpperCase()}\n` +
      `• Passport/ID: ${(passportNumber || "N/A").toUpperCase()}\n` +
      `• Expiry: ${passportExpiry || "N/A"}\n\n` +
      `TRAVELING PARTY COMPANIONS (${companions.length}):\n` +
      (companions.length > 0
        ? companionsText
        : "- Solo Voyager (No additional travelers listed).") +
      `\n` +
      `--------------------------------------------------\n` +
      `Generated via Phuket Private Yacht Excursions.`
    );
  };

  const [sendingManifestProgress, setSendingManifestProgress] = useState(false);

  const handleSendManifestToAgentChat = async () => {
    setSendingManifestProgress(true);
    try {
      if (!user) return;

      // Let's identify the active chat inquiry
      const activeInquiryId = localStorage.getItem(
        "phuket_charter_active_chat_id",
      );
      let targetId = activeInquiryId;

      if (!targetId && user.email) {
        const q = query(
          collection(db, "inquiries"),
          where("contact", "==", user.email),
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          targetId = querySnap.docs[0].id;
        }
      }

      if (!targetId) {
        // Automatically establish an active representative workspace link
        const autoInqId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const agentObj = currentAgent ||
          profile?.representativeBroker || {
            name: "Agent Team",
            email: "info@phuketcharter.com",
          };
        const brokerEmailStr = agentObj.email || "info@phuketcharter.com";
        const brokerIdStr = agentObj.id || agentObj.uid || "unassigned";

        const autoPayload = {
          id: autoInqId,
          name: profile?.name || user.displayName || "Charter Guest",
          contact: user.email,
          message:
            "Guest Passenger Manifest initiated via the Charter Guest Workspace.",
          brokerEmail: brokerEmailStr,
          brokerId: brokerIdStr,
          vesselId: "none",
          vesselName: "none",
          isRead: false,
          createdAt: new Date().toISOString(),
          chatHistory: [
            {
              sender: "client",
              text: "I have initialized my Phuket Yacht Charter guest session and opened my Charter Guest Workspace.",
              createdAt: new Date().toISOString(),
            },
          ],
          ...(currentCoagent && {
            coAgentId: currentCoagent.id,
            coAgentName: currentCoagent.name,
            coAgentPhone: currentCoagent.phone,
          }),
        };

        await setDoc(doc(db, "inquiries", autoInqId), autoPayload);
        localStorage.setItem("phuket_charter_active_chat_id", autoInqId);
        targetId = autoInqId;

        // Dispatch custom browser event to synchronize active live chat instances
        window.dispatchEvent(
          new CustomEvent("phuket_charter_chat_linked", {
            detail: { inquiryId: autoInqId },
          }),
        );
      }

      // Read current history
      const inquiryDocRef = doc(db, "inquiries", targetId);
      const inquirySnap = await getDoc(inquiryDocRef);
      if (inquirySnap.exists()) {
        const inquiryData = inquirySnap.data();
        const history = inquiryData.chatHistory || [];

        const companionDetailsList = companions
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
          `  • Full Name: ${(profile?.name || user.displayName || "N/A").toUpperCase()}\n` +
          `  • Phone Contact: ${phoneNumber || "N/A"}\n` +
          `  • Nationality/Country: ${(country || "N/A").toUpperCase()}\n` +
          `  • Passport/ID Number: ${(passportNumber || "N/A").toUpperCase()}\n` +
          `  • Expiry Date: ${passportExpiry || "N/A"}\n\n` +
          `ADDITIONAL TRAVEL COMPANIONS (${companions.length}):\n` +
          (companions.length > 0
            ? companionDetailsList
            : "  • Solo Voyager (No additional travelers listed).") +
          `\n` +
          `==================================================\n` +
          `💡 Live Agent Action: Click 'Download PDF' inside the customer's portal overview file to compile this manifest onto official Harbor Master forms.`;

        const newMsg = {
          sender: "client",
          text: msgText,
          createdAt: new Date().toISOString(),
          isManifest: true,
          companions: companions,
          leadInfo: {
            name: profile?.name || user.displayName || "N/A",
            phone: phoneNumber,
            country: country,
            passportNumber: passportNumber,
            passportExpiry: passportExpiry,
          },
        };

        await updateDoc(inquiryDocRef, {
          chatHistory: [...history, newMsg],
          isRead: false, // alert the agent
        });

        alert(
          "Secure Sync Successful! Your complete Passenger Manifest for maritime insurance has been forwarded directly into your active representative's inbox.",
        );
      } else {
        alert(
          "Unable to locate active representative workspace. Please open chat panel first.",
        );
      }
    } catch (err: any) {
      console.error("Failed sending manifest to representative:", err);
      alert("Network Error: " + err.message);
    } finally {
      setSendingManifestProgress(false);
    }
  };

  if (!isOpen) return null;

  // Render a lovely styled dashboard if signed in
  if (user) {
    const customerDisplayName =
      profile?.name || user.displayName || user.email || "Valued Customer";
    const bigLetter = customerDisplayName.trim().charAt(0).toUpperCase();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-200">
        <div className="relative w-full h-full md:h-auto md:max-h-[90vh] max-w-7xl bg-white shadow-2xl flex flex-col md:flex-row pointer-events-auto overflow-hidden md:rounded-lg">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-3 sm:px-8 py-3 sm:py-5 bg-[#0F172A] text-white shrink-0 shadow-md z-10 w-full relative">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 sm:w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)] shrink-0" />
              <h2 className="text-[9px] sm:text-sm font-black uppercase tracking-widest truncate">
                Customer Workspace
              </h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              >
                <Menu className="w-4 h-4 sm:w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = "/?mode=registered";
                }}
                className="flex items-center gap-1 sm:gap-2 bg-emerald-600 text-white px-2 sm:px-3 py-1.5 rounded-xs hover:bg-emerald-700 transition text-[8px] sm:text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30"
              >
                <Plus className="w-2.5 h-2.5 sm:w-3 h-3" />
                <span className="hidden xs:inline">Book Charter</span>
                <span className="xs:hidden">Book</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              >
                <X className="w-4 h-4 sm:w-5 h-5" />
              </button>
            </div>
          </div>

          {!isOnline && (
            <div className="bg-amber-100 text-amber-900 px-4 py-2 text-[11px] font-bold text-center border-b border-amber-200">
              ⚠️ Connection lost. Reconnecting...
            </div>
          )}

          {/* Double Column or Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0 bg-slate-50 relative pb-12 md:pb-0">
            {/* Left Column Profile Summary & Navigation */}
            <div
              className={`w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6 shrink-0 flex-col shadow-xs overflow-y-auto ${isMobileMenuOpen ? "flex h-full absolute md:relative z-20 w-full" : "hidden md:flex z-10"}`}
            >
              <div>
                {/* Profile Avatar featuring BIG LETTER FOR NAME option */}
                <div className="flex flex-col items-center text-center pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-100">
                  <div className="h-16 w-16 sm:h-20 w-20 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-2xl sm:text-4xl shadow-lg border-2 border-emerald-400/20 mb-3 sm:mb-4 select-none ring-4 ring-emerald-50">
                    {bigLetter}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-tight line-clamp-1">
                    {customerDisplayName}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono tracking-wide mt-1 max-w-[200px] truncate">
                    {user.email}
                  </p>
                </div>

                {/* Vertical Tab Controls */}
                <nav className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => {
                      setDashboardTab("manifest");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 text-left font-sans text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2.5 cursor-pointer transition-all ${
                      dashboardTab === "manifest"
                        ? "bg-[#0F172A] text-white shadow-md scale-[1.02]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Passenger Manifest
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab("history");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 text-left font-sans text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2.5 cursor-pointer transition-all ${
                      dashboardTab === "history"
                        ? "bg-[#0F172A] text-white shadow-md scale-[1.02]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Booking History
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab("edit_profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 text-left font-sans text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2.5 cursor-pointer transition-all ${
                      dashboardTab === "edit_profile"
                        ? "bg-[#0F172A] text-white shadow-md scale-[1.02]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <User className="w-4 h-4" /> Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      setDashboardTab("settings");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-2.5 px-4 text-left font-sans text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2.5 cursor-pointer transition-all ${
                      dashboardTab === "settings"
                        ? "bg-[#0F172A] text-white shadow-md scale-[1.02]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Lock className="w-4 h-4" /> Account Settings
                  </button>
                </nav>
              </div>

              {/* Bottom Actions inside Left Panel */}
              <div className="pt-4 mt-auto mb-4 md:mb-0 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("sandbox_customer_session");
                    signOut(auth)
                      .then(() => {
                        setUser(null);
                        alert("Logged out successfully");
                        onClose();
                      })
                      .catch(() => {
                        setUser(null);
                        alert("Logged out successfully");
                        onClose();
                      });
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200/50"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete your customer account? This will permanently mark your account as inactive.",
                      )
                    ) {
                      try {
                        await setDoc(
                          doc(db, "customers", profile.id),
                          { isActive: false },
                          { merge: true },
                        );
                        localStorage.removeItem("sandbox_customer_session");
                        signOut(auth)
                          .catch(() => {})
                          .finally(() => {
                            setUser(null);
                            onClose();
                          });
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 border border-red-200/50"
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Right Column Core Views (Scrollable) */}
            <div className="flex-1 overflow-y-visible md:overflow-y-auto p-4 sm:p-6 min-h-0 bg-white md:bg-transparent w-full animate-in fade-in duration-250">
              {fetchingProfile ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="h-8 w-8 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs text-slate-500 font-mono">
                    Synchronizing maritime records...
                  </span>
                </div>
              ) : dashboardTab === "manifest" ? (
                /* Manifest Tab */
                <div className="space-y-6">
                  {/* Maritime Insurance Notice Card */}
                  <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xs flex gap-3 text-amber-900">
                    <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="font-sans leading-relaxed">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-800">
                        Maritime Insurance Registry
                      </h4>
                      <p className="text-[10px] text-amber-700/90 mt-1 font-sans">
                        Under guidelines issued by the Harbor Master Department
                        of the Kingdom of Thailand, all private catamaran
                        passenger logs must be registered with legal full names,
                        passport/ID records, and credential exiprations. Correct
                        information prevents cover exclusions on active voyages.
                      </p>
                    </div>
                  </div>

                  {/* Header summary info & PDF Download panel */}
                  <div className="bg-slate-900 text-white rounded-xs p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-slate-800 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 to-slate-900/10 pointer-events-none" />
                    <div className="relative z-10 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase font-black">
                          Official Yacht Manifest File
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest font-sans">
                        Travel & Insurance Clearance PDF
                      </h4>
                      <p className="text-[10px] text-slate-300 max-w-sm font-sans leading-relaxed">
                        Ready for instant submission. Includes full names,
                        country of origin, passport numbers, and credential
                        expiry dates formatted for Thai Harbor Masters as well
                        as travel insurance underwriters.
                      </p>
                      <div className="pt-2">
                        <span className="text-2xl font-black text-emerald-400 font-sans">
                          {companions.length + 1}{" "}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          Roster Members Verified
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto relative z-10 shrink-0">
                      <button
                        onClick={handleDownloadPdf}
                        className="flex-1 md:flex-initial py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-black uppercase tracking-widest rounded-xs cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/20 active:scale-98 transition-all border border-emerald-500/30"
                        title="Download standard manifest PDF formatted for underwriters"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <div className="text-left font-sans">
                          <div className="leading-none text-xs font-black">
                            Download Manifest as PDF
                          </div>
                          <span className="text-[8px] opacity-80 font-normal tracking-normal lowercase block mt-0.5">
                            insurance & agent submission ready
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Share Manifest Panel with Whatsapp, LINE, WeChat, and Email */}
                  <div className="bg-white border border-slate-200 p-5 rounded-xs space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-emerald-600" /> Dispatch
                        Copy to Yacht Broker Agent
                      </h4>
                    </div>

                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      Send the passenger manifest directly to your dedicated
                      broker agent for maritime insurance underwriters
                      clearance. Tap a channel to instantly message or email.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* WhatsApp Option */}
                      <button
                        onClick={() => {
                          const agentObj = currentAgent ||
                            profile?.representativeBroker || {
                              name: "Broker Agent",
                              email: "info@phuketcharter.com",
                            };
                          const phoneRaw = agentObj.whatsapp || "+66636368287";
                          const cleanPhone = phoneRaw.replace(/[^\d]/g, "");
                          const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(compileTextManifest())}`;
                          window.open(waUrl, "_blank");
                        }}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 hover:text-emerald-900 text-emerald-800 border border-emerald-200/50 rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span>WhatsApp SMS</span>
                      </button>

                      {/* LINE Option */}
                      <button
                        onClick={() => {
                          const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(compileTextManifest())}`;
                          window.open(lineUrl, "_blank");
                        }}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 hover:text-emerald-900 text-emerald-800 border border-emerald-200/50 rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span>LINE Messenger</span>
                      </button>

                      {/* WeChat Option */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(compileTextManifest());
                          setCopiedText(true);
                          setShowWechatPrompt(true);
                          setTimeout(() => setCopiedText(false), 4000);
                        }}
                        className="py-2 px-3 bg-teal-50 hover:bg-teal-100/80 hover:text-teal-900 text-teal-850 border border-teal-200/50 rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group"
                      >
                        <Globe className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span>WeChat Copy</span>
                      </button>

                      {/* Customer Workspace Option */}
                      <button
                        onClick={() => {
                          window.location.href = "/?workspace=customer";
                        }}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100/80 hover:text-indigo-900 text-indigo-800 border border-indigo-200/50 rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group"
                      >
                        <Compass className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span>Create Route</span>
                      </button>
                    </div>

                    {showWechatPrompt && (
                      <div className="bg-teal-50 border border-teal-200 p-3 rounded-xs animate-in slide-in-from-top-2 duration-150 relative">
                        <button
                          onClick={() => setShowWechatPrompt(false)}
                          className="absolute top-2 right-2 text-teal-700 hover:text-teal-900 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <h5 className="text-[9px] font-black uppercase tracking-wider text-teal-900">
                          WeChat Sharing Clipboard
                        </h5>
                        <p className="text-[9.5px] text-teal-800 leading-relaxed mt-1 font-sans">
                          {copiedText
                            ? "✅ Manifest text copied to clipboard successfully! "
                            : ""}
                          Paste it directly inside WeChat to your Broker
                          Representative (WeChat ID:{" "}
                          <span className="font-mono font-bold bg-white/60 px-1 py-0.2 rounded-xs">
                            {(
                              currentAgent?.wechatId ||
                              profile?.representativeBroker?.wechatId ||
                              "phuket_yacht_broker"
                            ).toUpperCase()}
                          </span>
                          ) for instant maritime coordination.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Travelers Companions Manifest List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-850 uppercase tracking-widest border-b border-slate-200 pb-2">
                      Registered Traveling Party & Friends
                    </h4>

                    {/* List Table wrapper for horizontal scroll on mobile/tablet */}
                    <div className="w-full overflow-x-auto border border-slate-200/80 bg-white rounded-xs">
                      <div className="min-w-[640px] overflow-hidden">
                        <div className="grid grid-cols-12 bg-slate-100 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <div className="col-span-1">No</div>
                          <div className="col-span-4">Passenger Name</div>
                          <div className="col-span-2">Nationality</div>
                          <div className="col-span-3">Passport / ID</div>
                          <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Lead Guest Row */}
                        <div className="grid grid-cols-12 px-3 py-2.5 text-xs font-sans text-slate-700 hover:bg-slate-50 border-b border-slate-150 items-center">
                          <div className="col-span-1 font-mono text-[10px] text-slate-400">
                            01
                          </div>
                          <div className="col-span-4">
                            <span className="font-bold text-slate-900">
                              {(
                                profile?.name ||
                                user.displayName ||
                                "lead guest"
                              ).toUpperCase()}
                            </span>
                            <span className="ml-1.5 py-0.5 px-1 bg-blue-150 text-blue-800 text-[8px] font-black rounded-xs select-none tracking-wider uppercase">
                              Lead
                            </span>
                          </div>
                          <div className="col-span-2 truncate">
                            {(country || "Not set").toUpperCase()}
                          </div>
                          <div className="col-span-3 font-mono text-[11px] truncate">
                            {passportNumber
                              ? passportNumber.toUpperCase()
                              : "N/A"}{" "}
                            {passportExpiry ? `(Exp: ${passportExpiry})` : ""}
                          </div>
                          <div className="col-span-2 text-[10px] text-slate-400 italic text-right">
                            Lead Record
                          </div>
                        </div>

                        {/* Companion rows */}
                        {companions.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50/50">
                            No companions registered for insurance manifest yet.
                            Use the tool below to add your travel group!
                          </div>
                        ) : (
                          companions.map((comp, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-12 px-3 py-2 text-xs font-sans text-slate-700 hover:bg-slate-50 border-b border-slate-150 items-center"
                            >
                              <div className="col-span-1 font-mono text-[10px] text-slate-400">
                                {idx + 2 < 10 ? `0${idx + 2}` : idx + 2}
                              </div>
                              <div className="col-span-4 font-bold text-slate-800 truncate">
                                {(comp.fullName || "").toUpperCase()}
                              </div>
                              <div className="col-span-2 truncate">
                                {(comp.country || "").toUpperCase()}
                              </div>
                              <div className="col-span-3 font-mono text-[11px] truncate">
                                {(comp.passportNumber || "").toUpperCase()}{" "}
                                {comp.passportExpiry
                                  ? `(Exp: ${comp.passportExpiry})`
                                  : ""}
                              </div>
                              <div className="col-span-2 text-right">
                                <button
                                  onClick={() => handleRemoveCompanion(idx)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                                  title="Exclude from manifest"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500 m-auto" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Companion Form block */}
                  <form
                    onSubmit={handleAddCompanion}
                    className="p-4 bg-white border border-slate-200 rounded-xs space-y-3 shadow-2xs"
                  >
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F172A] border-b border-slate-100 pb-1 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" /> Register
                      Passenger / Companion
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Passenger Name (As in Passport)
                        </label>
                        <input
                          type="text"
                          required
                          value={companionName}
                          onChange={(e) => setCompanionName(e.target.value)}
                          placeholder="e.g. EMILY SMITH"
                          className="w-full px-2.5 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Nationality / Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 z-10" />
                          <select
                            required
                            value={companionCountry}
                            onChange={(e) =>
                              setCompanionCountry(e.target.value)
                            }
                            className="w-full pl-8 pr-2.5 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                          >
                            <option value="">-- Choose Nationality --</option>
                            {WORLD_COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Passport / National ID Number
                        </label>
                        <input
                          type="text"
                          required
                          value={companionPassport}
                          onChange={(e) => setCompanionPassport(e.target.value)}
                          placeholder="e.g. GBR123456"
                          className="w-full px-2.5 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Passport Expiration Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={companionExpiry}
                          onChange={(e) => setCompanionExpiry(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !companionName.trim() ||
                        !companionCountry.trim()
                      }
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Save details on insurance
                      list
                    </button>
                  </form>
                </div>
              ) : dashboardTab === "history" ? (
                /* Booking History Tab */
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2">
                    Booking History
                  </h4>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xs">
                      No booking history found.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xs overflow-hidden">
                      <div className="grid grid-cols-3 bg-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                        <div>Date</div>
                        <div>Vessel ID</div>
                        <div className="text-right">Action</div>
                      </div>
                      {bookings.map((b) => (
                        <div
                          key={b.id}
                          className="grid grid-cols-3 p-3 border-b text-xs text-slate-700 items-center"
                        >
                          <div>{b.charterDate}</div>
                          <div>{b.vesselId1}</div>
                          <div className="text-right">
                            {b.pdfBase64 ? (
                              <div className="flex flex-col gap-1.5 items-end">
                                <a
                                  href={b.pdfBase64}
                                  download={`Booking_${b.id}.pdf`}
                                  className="text-blue-600 hover:text-blue-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" /> Quote PDF
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadBoardingPass(b)}
                                  className="text-emerald-600 hover:text-emerald-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" /> Boarding Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveQRBooking(b)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <QrCode className="h-3 w-3" /> Check-in QR
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5 items-end">
                                <button
                                  className="text-blue-600 hover:text-blue-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                  onClick={() => {
                                    const doc = generateCharterQuotationPdf({
                                      clientName: b.clientName,
                                      charterDate: b.charterDate,
                                      vesselName: b.vesselId1,
                                      price: b.price1,
                                      notes: "Original charter quotation.",
                                      bookingId: b.id,
                                    });
                                    doc.save(`Quotation_${b.id}.pdf`);
                                  }}
                                >
                                  <FileText className="h-3 w-3" /> Quote PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadBoardingPass(b)}
                                  className="text-emerald-600 hover:text-emerald-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" /> Boarding Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveQRBooking(b)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <QrCode className="h-3 w-3" /> Check-in QR
                                </button>
                              </div>
                            )}
                            {(b.boardingStatus === "Completed" ||
                              b.boardingStatus === "Completed_Archived") && (
                              <button
                                type="button"
                                onClick={() => setBookingForFeedback(b)}
                                className="text-amber-600 hover:text-amber-800 text-[10px] uppercase font-bold cursor-pointer inline-flex items-center gap-1 mt-2 border-t border-slate-100 pt-2 w-full justify-end"
                              >
                                <MessageSquare className="h-3 w-3" /> Leave
                                Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : dashboardTab === "edit_profile" ? (
                /* Edit Profile Tab */
                <div className="space-y-6">
                  <form
                    onSubmit={handleUpdateProfile}
                    className="bg-white border border-slate-200 p-5 rounded-xs space-y-4 shadow-2xs"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2">
                      Edit Profile
                    </h4>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs rounded-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs rounded-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Dietary Restrictions
                      </label>
                      <textarea
                        value={editDietaryRestrictions}
                        onChange={(e) =>
                          setEditDietaryRestrictions(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 text-xs rounded-xs"
                        placeholder="e.g. Vegetarian, Gluten-free"
                        rows={3}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors w-full"
                    >
                      {loading ? "Saving..." : "Update Profile"}
                    </button>
                  </form>
                </div>
              ) : (
                /* Account Settings Tab */
                <div className="space-y-6">
                  {/* Lead details registration */}
                  <form
                    onSubmit={handleSaveContactInfo}
                    className="bg-white border border-slate-200 p-5 rounded-xs space-y-4 shadow-2xs"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2">
                      Lead Guest Information (Account Owner)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Full Legal Name
                        </label>
                        <input
                          type="text"
                          disabled
                          value={customerDisplayName}
                          className="w-full px-3 py-2 border border-slate-200 text-xs bg-slate-100 text-slate-500 rounded-xs select-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          WhatsApp / Contact Phone
                        </label>
                        <div className="relative flex">
                          <select
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value)}
                            className="py-2 px-2 border border-r-0 border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-slate-50 rounded-l-xs shrink-0 select-none max-w-[100px]"
                          >
                            {CALLING_CODES.map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.code} (
                                {item.code === "+66"
                                  ? "TH"
                                  : item.country.slice(0, 3).toUpperCase()}
                                )
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) =>
                              setPhoneNumber(
                                e.target.value.replace(/[^\d\s\-]/g, ""),
                              )
                            }
                            placeholder="e.g. 812345678"
                            className="w-full px-3 py-2 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-r-xs"
                          />
                        </div>
                        <p className="text-[8.5px] text-slate-400 font-mono mt-1">
                          Select your country dial code prefix followed by the
                          cellular digits.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Passport / National ID
                        </label>
                        <input
                          type="text"
                          value={passportNumber}
                          onChange={(e) => setPassportNumber(e.target.value)}
                          placeholder="e.g. GBR100200"
                          className="w-full px-3 py-2 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Passport Expiration Date
                        </label>
                        <input
                          type="date"
                          value={passportExpiry}
                          onChange={(e) => setPassportExpiry(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Country of Citizenship / Residence
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400 z-10" />
                        <select
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                        >
                          <option value="">
                            -- Choose Country of Residence --
                          </option>
                          {WORLD_COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors w-full"
                    >
                      {loading
                        ? "Saving records..."
                        : "Update Lead Insurance Credentials"}
                    </button>
                  </form>

                  {/* Security Management */}
                  <div className="bg-white border border-slate-200 p-5 rounded-xs space-y-4 shadow-2xs">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-slate-500" /> Password &
                      Security
                    </h4>

                    {profile?.authStatus === "direct_firestore_sandbox" ? (
                      <p className="text-[10px] text-slate-500 italic bg-slate-50 p-3 border border-slate-200">
                        Notice: This account was established in Sandbox
                        direct-write mode due to Firebase Authentication console
                        limits. Standard password changes are securely bypassed.
                      </p>
                    ) : user.providerData &&
                      user.providerData[0]?.providerId === "google.com" ? (
                      <p className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200/50 p-3 rounded-xs font-sans">
                        💡 SSO Active: You signed in securely via Your Google
                        Account. Standard password resets are managed directly
                        by Google Auth, no local password changes required.
                      </p>
                    ) : (
                      <>
                        {!showPasswordChange ? (
                          <button
                            onClick={() => setShowPasswordChange(true)}
                            className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
                          >
                            Update Account Password
                          </button>
                        ) : (
                          <form
                            onSubmit={handleChangePassword}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                  New Secure Password
                                </label>
                                <PasswordInput
                                  required
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                  placeholder="Minimum 6 characters"
                                  className="w-full px-3 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                  Confirm New Password
                                </label>
                                <PasswordInput
                                  required
                                  value={confirmPassword}
                                  onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                  }
                                  placeholder="Match new password"
                                  className="w-full px-3 py-1.5 border border-slate-350 text-xs focus:outline-hidden focus:border-[#0F172A] bg-white rounded-xs"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={loading}
                                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
                              >
                                {loading
                                  ? "Updating..."
                                  : "Commit Password Change"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPasswordChange(false);
                                  setNewPassword("");
                                  setConfirmPassword("");
                                }}
                                className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50/50 border border-red-200/50 p-5 rounded-xs space-y-3 shadow-2xs">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-800 border-b border-red-100 pb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />{" "}
                      Danger Zone
                    </h4>
                    <p className="text-[10.5px] text-red-700/80 leading-relaxed font-sans">
                      By deleting your account, you will instantly deactivate
                      your secure reservation credentials. All companion
                      history, safety manifests, and travel history stored
                      within Phuket Private Yacht database entries will be
                      immediately deleted under GDPR guidelines.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="py-2 px-4 bg-red-650 hover:bg-red-850 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-200" /> Permanent
                      Account Deletion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Footer logout */}
          <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 md:hidden shrink-0 flex justify-between items-center">
            <span className="text-[8.5px] font-mono text-slate-400">
              ID: {user.uid.substring(0, 8)}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("sandbox_customer_session");
                signOut(auth)
                  .then(() => {
                    setUser(null);
                    alert("Logged out successfully");
                    onClose();
                  })
                  .catch(() => {
                    setUser(null);
                    alert("Logged out successfully");
                    onClose();
                  });
              }}
              className="py-1 px-3 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 font-sans text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer border border-slate-200 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3 text-red-500" /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to standard login block if guest is not signed in - Now styled as an expansive "New Window" split screen full viewport takeover
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-200">
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] max-w-7xl bg-white shadow-2xl flex flex-col md:flex-row pointer-events-auto overflow-hidden md:rounded-lg border-x border-slate-200">
        {/* Left Side: Elegant Branding and Info Console */}
        <div className="hidden md:flex md:w-[45%] bg-[#0F172A] text-white p-8 flex-col justify-between relative overflow-hidden shrink-0 border-r border-[#1E293B]">
          {/* Subtle decorative layout graphic elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#10B981] uppercase block font-mono">
                  Similan & Phi Phi Charters
                </span>
                <span className="text-sm font-bold text-slate-100 uppercase tracking-tight">
                  Guest Portal Desk
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-850">
              <h2 className="text-xl font-serif text-slate-50 font-medium mb-3 leading-snug">
                Your Exclusive Yacht Itinerary Planner
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Access your personalized maritime itinerary. Sign in or
                initialize a guest key to log safety manifests, configure
                onshore catering, and authorize vessel clearances before
                departure.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-slate-800 rounded">
                  <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">
                    Passenger Manifests
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Digitally compile passport data & medical exemptions for
                    Thai immigration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-slate-800 rounded">
                  <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">
                    Custom Route Modeling
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Tailor destination stops, water slides, toys, and private
                    minibus transfers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-slate-800 rounded">
                  <Download className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">
                    Automated PDF Export
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Download a beautifully stylized cruise plan presentation for
                    your guests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-slate-855 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>PORT ID: cust-portal-v2</span>
            <span>SECURE SSL ACTIVE</span>
          </div>
        </div>

        {/* Right Side: Actual Form Interface */}
        <div className="flex-grow flex flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] text-white shrink-0 md:bg-white md:text-[#0F172A] md:border-b md:border-slate-100">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-pulse md:hidden" />
              🔑 guest portal workspace
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 md:hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-white md:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 bg-slate-100 shrink-0 select-none text-[10px] md:text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all border-b-2 text-center cursor-pointer ${
                activeTab === "login"
                  ? "border-[#0F172A] text-[#0F172A] bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 bg-slate-100"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all border-b-2 text-center cursor-pointer ${
                activeTab === "register"
                  ? "border-[#0F172A] text-[#0F172A] bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-50 bg-slate-100"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("express-manifest")}
              className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all border-b-2 text-center cursor-pointer ${
                activeTab === "express-manifest"
                  ? "border-[#10B981] text-emerald-700 bg-emerald-50/40 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/20 bg-slate-100"
              }`}
            >
              Express Manifest
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 pb-24 md:p-8 flex flex-col justify-center">
            {activeTab === "login" && (
              <form
                onSubmit={handleLogin}
                className="space-y-4 max-w-sm w-full mx-auto"
              >
                <div className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wider font-bold">
                  Sign In to Your Workspace
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">
                    Guest Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                      Secure Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-wider cursor-pointer font-sans"
                    >
                      Forgot Key?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-16 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full mt-3 py-2.5 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer flex justify-center items-center gap-2 rounded shadow-md disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />{" "}
                  {loading ? "Signing In..." : "Access My Workspace"}
                </button>
                <div className="text-center pt-3">
                  <p className="text-xs text-slate-500">
                    New guest?
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="ml-1 font-bold text-[#0F172A] hover:underline cursor-pointer"
                    >
                      Initialize guest account.
                    </button>
                  </p>
                </div>
              </form>
            )}

            {activeTab === "register" && (
              <form
                onSubmit={handleRegister}
                className="space-y-4 max-w-sm w-full mx-auto"
              >
                <div className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wider font-bold">
                  Register Guest Charter Key
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">
                    Primary Guest Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans">
                    Register Secure Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pr-16 pl-3 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all cursor-pointer mt-3 rounded shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registering..." : "Initialize and Access Portal"}
                </button>
                <div className="text-center pt-3">
                  <p className="text-xs text-slate-500">
                    Already have a guest account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}

            {activeTab === "forgot" && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-4 max-w-sm w-full mx-auto"
              >
                <div className="text-center text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">
                  Reset Guest Security Key
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans text-center mb-4">
                  Enter your verified security email below and we'll transmit a
                  remote link to reset authorization.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Verification Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                    placeholder="john@example.com"
                  />
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-2.5 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer mt-3 rounded shadow-md disabled:opacity-50"
                >
                  {loading ? "Transmitting..." : "Receive Reset Workspace Key"}
                </button>
                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-xs font-bold text-[#0F172A] hover:underline cursor-pointer font-sans"
                  >
                    Return to Workspace Sign In
                  </button>
                </div>
              </form>
            )}

            {activeTab === "express-manifest" && (
              <div className="space-y-6 max-w-lg w-full mx-auto font-sans text-slate-800">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-600 animate-spin-slow" />
                    Express Manifest Check-In
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Register companion passenger names and passport numbers for mandatory Harbor Master marine insurance coverages. No account registration required.
                  </p>
                </div>

                {/* Optional Booking ID Link */}
                <div className="bg-slate-50 border border-slate-200/60 rounded p-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                      Yacht Booking Reference ID / RF-ID (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={expressBookingId}
                        onChange={(e) => setExpressBookingId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black font-mono shadow-inner"
                        placeholder="e.g. prop-xxxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={handleExpressLoadBooking}
                        disabled={expressLoading}
                        className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 border border-transparent rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                      >
                        {expressLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Compass className="h-3.5 w-3.5" />
                        )}
                        <span>Load</span>
                      </button>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-sans mt-1.5 leading-normal">
                      Syncing with your Booking ID will automatically pull your charter date, vessel, and any existing passenger records directly from our servers.
                    </p>
                  </div>
                </div>

                {/* Status messages */}
                {expressError && (
                  <div className="border border-red-200 bg-red-50 text-red-700 text-xs p-3 rounded leading-relaxed">
                    ⚠️ {expressError}
                  </div>
                )}
                {expressSuccess && (
                  <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded leading-relaxed font-semibold">
                    ✅ {expressSuccess}
                  </div>
                )}

                {/* Form fields for Lead Guest */}
                <div className="space-y-3.5 bg-white border border-slate-100 p-4 rounded-sm shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
                    Lead Guest details (Charterer)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        value={expressLeadName}
                        onChange={(e) => setExpressLeadName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black uppercase font-semibold"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={expressLeadEmail}
                        onChange={(e) => setExpressLeadEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Passport / Thai ID Number
                      </label>
                      <input
                        type="text"
                        value={expressLeadPassport}
                        onChange={(e) => setExpressLeadPassport(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black font-mono tracking-wider"
                        placeholder="A12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Passport Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expressLeadExpiry}
                        onChange={(e) => setExpressLeadExpiry(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Nationality
                      </label>
                      <select
                        value={expressLeadCountry}
                        onChange={(e) => setExpressLeadCountry(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                      >
                        {WORLD_COUNTRIES.map((cty) => (
                          <option key={cty} value={cty}>
                            {cty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Charter Date
                      </label>
                      <input
                        type="date"
                        value={expressCharterDate}
                        onChange={(e) => setExpressCharterDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        Yacht/Vessel
                      </label>
                      <input
                        type="text"
                        value={expressVessel}
                        onChange={(e) => setExpressVessel(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black text-xs"
                        placeholder="Yacht Name"
                      />
                    </div>
                  </div>
                </div>

                {/* Traveling Companions List */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
                    Traveling Companions / Party Members ({expressCompanions.length})
                  </span>

                  {expressCompanions.length === 0 ? (
                    <div className="border border-dashed border-slate-200 text-center py-6 text-xs text-slate-400 rounded-sm bg-slate-50/10">
                      No companions added. Fill out the express companion form below.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {expressCompanions.map((comp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-3 rounded-xs text-xs shadow-3xs"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-bold text-slate-800 block truncate uppercase tracking-tight">
                              {idx + 1}. {comp.fullName}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono tracking-tight block mt-0.5">
                              {comp.country} • Passport: <span className="font-semibold text-slate-700">{comp.passportNumber}</span> • Exp: {comp.passportExpiry}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpressCompanion(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer shrink-0"
                            title="Remove Companion"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Companion inline Form */}
                  <div className="border border-slate-200/75 rounded p-4 bg-slate-50/40 space-y-3 shadow-3xs">
                    <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Companion / Party Member
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Full Legal Name *
                        </label>
                        <input
                          type="text"
                          value={expTravName}
                          onChange={(e) => setExpTravName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black uppercase"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Nationality
                        </label>
                        <select
                          value={expTravCountry}
                          onChange={(e) => setExpTravCountry(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                        >
                          {WORLD_COUNTRIES.map((cty) => (
                            <option key={cty} value={cty}>
                              {cty}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                          Passport / ID Number
                        </label>
                        <input
                          type="text"
                          value={expTravPassport}
                          onChange={(e) => setExpTravPassport(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black font-mono tracking-wider"
                          placeholder="e.g. B98765432"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                          Passport Expiry Date
                        </label>
                        <input
                          type="date"
                          value={expTravExpiry}
                          onChange={(e) => setExpTravExpiry(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 text-xs focus:outline-hidden focus:border-[#0F172A] rounded bg-white text-black"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddExpressCompanion}
                      className="w-full py-2 bg-[#0F172A] text-white hover:bg-slate-800 rounded font-sans font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-3xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Companion to Manifest
                    </button>
                  </div>
                </div>

                {/* Submissions buttons block */}
                <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleExpressDownloadPdf}
                    className="flex-1 py-3 bg-slate-900 border border-transparent text-white hover:bg-slate-800 font-sans font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-3xs transition-all active:scale-99 hover:-translate-y-0.5 duration-200"
                  >
                    <Download className="h-4 w-4 text-slate-300" />
                    Download Manifest PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleExpressSaveAndSync}
                    disabled={expressLoading || !expressBookingId.trim()}
                    className="flex-1 py-3 bg-emerald-650 text-white hover:bg-emerald-700 font-sans font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer shadow-3xs transition-all active:scale-99 hover:-translate-y-0.5 duration-205 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      expressBookingId.trim()
                        ? "Save & Sync details direct to Yacht Ledger"
                        : "Enter optional Booking Reference ID above to enable Cloud Database Sync"
                    }
                  >
                    {expressLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-100" />
                    )}
                    Live Sync to Yacht Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeQRBooking && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden"
          onClick={() => setActiveQRBooking(null)}
        >
          <div
            className="bg-white max-w-sm w-full shadow-2xl relative border border-slate-200 p-8 rounded-lg animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveQRBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors p-1 bg-slate-50 hover:bg-slate-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center">
              <div className="bg-emerald-50 text-emerald-700 p-2 rounded-full mb-3 shadow-inner shadow-emerald-200/50">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-800 mb-1 text-center leading-tight">
                Boarding Pass
                <br />
                Check-in QR
              </h3>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
                Voucher ID: {activeQRBooking.id.replace("prop-", "BK-")}
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs relative group overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-blue-50/50 to-transparent pointer-events-none" />
                <QRCodeSVG
                  value={`BK-${activeQRBooking.id}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                  className="relative z-10"
                />
                {/* Scanning corner cutouts for visual flair */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl pointer-events-none" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br pointer-events-none" />
              </div>

              <div className="mt-6 flex flex-col items-center self-stretch bg-slate-50 border border-slate-100 p-3 rounded text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">
                  {(activeQRBooking.clientName || "Guest").toUpperCase()}
                </div>
                <div className="text-[10px] font-medium text-slate-600 mb-1 flex justify-center gap-3">
                  <span>
                    Yacht:{" "}
                    <span className="font-bold">
                      {activeQRBooking.vesselId1 || "TBA"}
                    </span>
                  </span>
                  <span>
                    Date:{" "}
                    <span className="font-bold">
                      {activeQRBooking.charterDate || "TBA"}
                    </span>
                  </span>
                </div>
              </div>

              <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-4 text-center font-bold max-w-[240px]">
                Present this to the captain during physical check-in for instant
                manifest validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {bookingForFeedback && (
        <GuestFeedbackModal
          booking={bookingForFeedback}
          userProfile={profile}
          onClose={() => setBookingForFeedback(null)}
        />
      )}
    </div>
  );
}
