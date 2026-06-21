import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAgent } from "../AgentContext";
import {
  X,
  Anchor,
  Settings,
  UserCheck,
  FileText,
  Search,
  CheckCircle,
  Clock,
  ShieldAlert,
  Shield,
  Compass,
  Clipboard,
  User,
  LogOut,
  Lock,
  Sparkles,
  ArrowRight,
  Printer,
  Check,
  QrCode,
  Menu,
  Calendar,
  Users,
  Camera,
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { CATAMARANS } from "../data";
import { generateCaptainManifestPdf } from "../lib/pdfGenerator";
import { QRCodeSVG } from "qrcode.react";
import CrewBoardingQrGenerator from "./CrewBoardingQrGenerator";
import QRScannerModal from "./QRScannerModal";
import PasswordInput from "./PasswordInput";
import CrewLogsTab from "./CrewLogsTab";
import { CrewMemberCalendarModal } from "./CrewMemberCalendarModal";
import { BoardingLogsView } from "./BoardingLogsView";
import { reverseGeocode } from "../utils/geocoding";

interface CaptainWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CaptainProfile {
  uid: string;
  name: string;
  email: string;
  licenseNo: string;
  yachtId: string;
  createdAt: string;
  phoneNumber?: string;
  whatsapp?: string;
  lineId?: string;
  role?: string;
  isActive?: boolean;
  dbSource?: string;
  registrationLocation?: { lat: number; lng: number };
}

export default function CaptainWorkspaceModal({
  isOpen,
  onClose,
}: CaptainWorkspaceModalProps) {
  const { agents } = useAgent();
  // Authentication & Profile states
  const [currentCaptainUser, setCurrentCaptainUser] = useState<any | null>(
    null,
  );
  const [captainProfile, setCaptainProfile] = useState<CaptainProfile | null>(
    null,
  );
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Captain"); // "Captain", "First Mate", "Deckhand", "Host/Hostess", "Chef", "Engineer"
  const [licenseNo, setLicenseNo] = useState("");
  const [selectedYachtId, setSelectedYachtId] = useState(
    CATAMARANS[0]?.id || "",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Workspace states
  const [currentTab, setCurrentTab] = useState<
    "active" | "closed" | "scan" | "shift" | "profile" | "calendar" | "logs"
  >("active");
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Settings form states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");
  const [profileLineId, setProfileLineId] = useState("");
  const [profileYachtId, setProfileYachtId] = useState("");
  const [profileRole, setProfileRole] = useState("Crew");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [captainAlerts, setCaptainAlerts] = useState<any[]>([]);

  // Custom Toasts Notification System for real-time boarding alerts
  const [toasts, setToasts] = useState<
    {
      id: string;
      title: string;
      message: string;
      type: "success" | "info" | "warning";
    }[]
  >([]);
  const prevStatusesRef = useRef<Record<string, string>>({});
  const initialLoadRef = useRef<boolean>(true);

  // Shift Log System
  const [shiftLogStart, setShiftLogStart] = useState("");
  const [shiftLogEnd, setShiftLogEnd] = useState("");
  const [shiftLogFuel, setShiftLogFuel] = useState("");
  const [shiftLogEngineHours, setShiftLogEngineHours] = useState("");
  const [shiftLogNotes, setShiftLogNotes] = useState("");
  const [shiftLogs, setShiftLogs] = useState<any[]>([]);
  const [todaysCrewLogs, setTodaysCrewLogs] = useState<any[]>([]);
  const [allPersonalCrewLogs, setAllPersonalCrewLogs] = useState<any[]>([]);
  const [showPersonalLogsModal, setShowPersonalLogsModal] = useState(false);
  const [isSavingShift, setIsSavingShift] = useState(false);

  useEffect(() => {
    if (!currentCaptainUser || !captainProfile) return;
    const q = query(collection(db, "crewLogs"));
    const unsub = onSnapshot(q, (snap) => {
      const today = new Date().toISOString().split("T")[0];
      const allLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const filteredTodayLogs = allLogs
        .filter((l: any) => {
          const logDate = l.timestamp
            ? new Date(l.timestamp).toISOString().split("T")[0]
            : "";
          return logDate === today && l.yachtId === captainProfile.yachtId;
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      setTodaysCrewLogs(filteredTodayLogs);

      const myRefId = `CAPTAIN-${captainProfile.uid}`; // wait, some are CREW-id
      const myRefId2 = `CREW-${captainProfile.uid}`;
      const myRefId3 = captainProfile.uid;

      const myLogs = allLogs
        .filter(
          (l: any) =>
            l.crewId === myRefId ||
            l.crewId === myRefId2 ||
            l.crewId === myRefId3 ||
            l.crewId === `CAPTAIN-${captainProfile.email || "noemail"}` ||
            l.crewName === captainProfile.name,
        )
        // standardizing fallback to name
        .map((l) => ({ ...l, crewId: captainProfile.uid })) // force to match what Modal expects
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      setAllPersonalCrewLogs(myLogs);
    });
    return () => unsub();
  }, [currentCaptainUser, captainProfile]);

  useEffect(() => {
    if (!captainProfile?.uid) return;
    const qNotif = query(
      collection(db, "captain_notifications"),
      where("captainUid", "==", captainProfile.uid),
    );
    const unsub = onSnapshot(
      qNotif,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        setCaptainAlerts(list);
      },
      (err) => console.warn("captain_notifications listener failed:", err),
    );
    return () => unsub();
  }, [captainProfile?.uid]);

  const markCaptainAlertRead = async (id: string) => {
    try {
      await setDoc(
        doc(db, "captain_notifications", id),
        { read: true },
        { merge: true },
      );
    } catch (err) {
      console.warn("Failed to mark captain alert read:", err);
    }
  };

  const addToast = async (
    title: string,
    message: string,
    type: "success" | "info" | "warning" = "info",
  ) => {
    const id = "toast_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Automatically dismiss toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);

    // Also log to the central adminAlerts database
    try {
      await setDoc(doc(db, "adminAlerts", id), {
        title,
        message,
        type: type === "warning" ? "error" : type,
        details: `From Captain/Crew Workspace. User: ${currentCaptainUser?.email || "Unknown"}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    } catch (e) {
      console.error("Failed to log captain toast to admin alerts", e);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");

  // Scan Code Input (For simulated QR scanning / ticket verification)
  const [scanInput, setScanInput] = useState("");
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [scannedJustProcessed, setScannedJustProcessed] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanLocation, setScanLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [boardingStatus, setBoardingStatus] = useState("Boarded");

  useEffect(() => {
    if (captainProfile && isOpen) {
      const pendingScan = localStorage.getItem("pending_scan_verify");
      if (pendingScan) {
        setCurrentTab("scan");
        setScanInput(pendingScan);
        setTimeout(() => handlePerformSimulatedScan(pendingScan), 500);
        localStorage.removeItem("pending_scan_verify");
      }
    }
  }, [captainProfile, isOpen]);

  // Subscribe to Auth state modifications specifically for Captains
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Direct custom database login session has priority to avoid user crossover
      const customSession = localStorage.getItem("custom_logged_in_crew");
      if (customSession) {
        try {
          const parsed = JSON.parse(customSession);
          setCurrentCaptainUser(parsed.user);
          setCaptainProfile(parsed.profile);
          setSelectedYachtId(parsed.profile.yachtId || CATAMARANS[0]?.id || "");
          setIsLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse custom crew session:", e);
        }
      }

      if (user) {
        setIsLoading(true);
        setCurrentCaptainUser(user);
        try {
          let dataFromDb: any = null;
          const docRef = doc(db, "captains", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            dataFromDb = docSnap.data();
          } else {
            if (user.email) {
              const cleanEmail = user.email.toLowerCase().trim();
              const captainsQuery = query(
                collection(db, "captains"),
                where("email", "==", cleanEmail),
              );
              const captainsSnap = await getDocs(captainsQuery);
              if (!captainsSnap.empty) {
                dataFromDb = captainsSnap.docs[0].data();
              } else {
                const crewQuery = query(
                  collection(db, "crewMembers"),
                  where("email", "==", cleanEmail),
                );
                const crewSnap = await getDocs(crewQuery);
                if (!crewSnap.empty) {
                  dataFromDb = crewSnap.docs[0].data();
                }
              }
            }
          }

          if (dataFromDb) {
            // Map shipId from crewMembers to yachtId for the UI
            if (dataFromDb.shipId && !dataFromDb.yachtId) {
              dataFromDb.yachtId = dataFromDb.shipId;
            }
            setCaptainProfile(dataFromDb as CaptainProfile);
            setSelectedYachtId(dataFromDb.yachtId || CATAMARANS[0]?.id || "");
          } else {
            // Check if they present an existing registration key in localStorage as fallback
            const localCached = localStorage.getItem(
              `captain_cache_${user.email}`,
            );
            if (localCached) {
              const parsed = JSON.parse(localCached);
              setCaptainProfile(parsed);
              setSelectedYachtId(parsed.yachtId || CATAMARANS[0]?.id || "");
            } else {
              // Check if they are currently registering or logging in as captain
              const registeringEmail = localStorage.getItem(
                "registering_captain_email",
              );
              if (registeringEmail && registeringEmail === user.email) {
                const defaultProfile: CaptainProfile = {
                  uid: user.uid,
                  name: name || user.displayName || "Licensed Fleet Captain",
                  email: user.email || "",
                  licenseNo:
                    licenseNo ||
                    "TG-MC-" + Math.floor(100000 + Math.random() * 900000),
                  yachtId: selectedYachtId,
                  createdAt: new Date().toISOString(),
                };
                await setDoc(docRef, defaultProfile);
                setCaptainProfile(defaultProfile);
                localStorage.setItem(
                  `captain_cache_${user.email}`,
                  JSON.stringify(defaultProfile),
                );
              } else {
                // Not a captain! Keep captain user and state clear to prevent customer crossover
                setCurrentCaptainUser(null);
                setCaptainProfile(null);
              }
            }
          }
        } catch (err) {
          console.warn(
            "Could not retrieve online captain profile, loading fallback state:",
            err,
          );
        } finally {
          setIsLoading(false);
          localStorage.removeItem("registering_captain_email");
        }
      } else {
        setCurrentCaptainUser(null);
        setCaptainProfile(null);
      }
    });

    return () => unsub();
  }, [name, licenseNo, selectedYachtId]);

  // Sync / Load Bookings list via real-time Firestore Subscription & Local fallbacks
  useEffect(() => {
    if (!isOpen) return;
    loadBookings();

    if (!captainProfile?.yachtId) return;

    // Setup real-time listener for any changes in proposals
    const proposalsCol = collection(db, "proposals");
    const unsubSnapshot = onSnapshot(
      proposalsCol,
      (snapshot) => {
        let firestoreList: any[] = [];
        const updatedStatuses: Record<string, string> = {
          ...prevStatusesRef.current,
        };

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const id = docSnap.id;
          const proposal = { id, ...data } as any;
          firestoreList.push(proposal);

          const isMyVessel =
            proposal.vesselId1 === captainProfile.yachtId ||
            proposal.recommendedVesselId === captainProfile.yachtId;

          if (isMyVessel && proposal.sentToCaptain === true) {
            const currentStatus = proposal.boardingStatus || "Pending";
            const prevStatus = prevStatusesRef.current[id];

            if (!initialLoadRef.current) {
              const yachtName =
                CATAMARANS.find((c) => c.id === captainProfile.yachtId)?.name ||
                captainProfile.yachtId;

              if (prevStatus === undefined) {
                addToast(
                  "New Charter Booking Arrived",
                  `Broker securely forwarded new booking/manifest for client "${proposal.clientName || "Guest"}" on yacht "${yachtName}".`,
                  "info",
                );
              } else if (prevStatus !== currentStatus) {
                if (currentStatus === "Boarded") {
                  addToast(
                    "Roster Checked In / Boarded",
                    `Active manifest for client "${proposal.clientName || "Guest"}" on yacht "${yachtName}" has been verified and registered as BOARDED.`,
                    "success",
                  );
                } else if (currentStatus === "Completed") {
                  addToast(
                    "Excursion Completed",
                    `Voyage file completed and archived for client "${proposal.clientName || "Guest"}".`,
                    "info",
                  );
                } else {
                  addToast(
                    "Manifest Updates Saved",
                    `Trip specs for "${proposal.clientName || "Guest"}" updated to: ${currentStatus}.`,
                    "info",
                  );
                }
              }
            }
            updatedStatuses[id] = currentStatus;
          }
        });

        // Track statuses to prevent duplicates
        prevStatusesRef.current = updatedStatuses;
        initialLoadRef.current = false;

        // Merge with local storage fallback
        const localStored = localStorage.getItem("phuket_charter_proposals");
        const localList = localStored ? JSON.parse(localStored) : [];

        const combinedMap = new Map();
        firestoreList.forEach((item) => combinedMap.set(item.id, item));
        localList.forEach((item: any) => {
          if (!combinedMap.has(item.id)) {
            combinedMap.set(item.id, item);
          }
        });

        const unifiedList = Array.from(combinedMap.values());
        setBookings(unifiedList);
      },
      (err) => {
        console.warn(
          "Real-time listener failed, resorting to manual reloads:",
          err,
        );
      },
    );

    // Subscribe to internal trigger events too
    window.addEventListener("proposals-updated", loadBookings);

    return () => {
      unsubSnapshot();
      window.removeEventListener("proposals-updated", loadBookings);
      initialLoadRef.current = true;
    };
  }, [isOpen, captainProfile?.yachtId]);

  const loadBookings = async () => {
    try {
      // 1. Fetch from Firestore
      const querySnapshot = await getDocs(collection(db, "proposals"));
      let firestoreList: any[] = [];
      querySnapshot.forEach((doc) => {
        firestoreList.push({ id: doc.id, ...doc.data() });
      });

      // 2. Fetch from LocalStorage fallback
      const localStored = localStorage.getItem("phuket_charter_proposals");
      const localList = localStored ? JSON.parse(localStored) : [];

      // Combine both lists and unify IDs
      const combinedMap = new Map();
      firestoreList.forEach((item) => combinedMap.set(item.id, item));
      localList.forEach((item: any) => {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      const unifiedList = Array.from(combinedMap.values());
      setBookings(unifiedList);
    } catch (err) {
      console.warn(
        "Using offline fallback storage to display charter bookings:",
        err,
      );
      const localStored = localStorage.getItem("phuket_charter_proposals");
      if (localStored) {
        setBookings(JSON.parse(localStored));
      }
    }
  };

  // Filter bookings based on captain's nominated drive vessel
  const filteredBookings = bookings.filter((b) => {
    const vesselMatch =
      b.vesselId1 === captainProfile?.yachtId ||
      b.recommendedVesselId === captainProfile?.yachtId;

    // Only premium bookings forwarded securely by the representative agent appear
    const isForwarded = b.sentToCaptain === true;

    // Overriding control: if assigned to another captain explicitly, exclude it.
    // But if assigned to me, or unassigned (not assigned to anybody yet): include it!
    const isAssignedToMeOrUnassigned =
      !b.assignedCaptainUid || b.assignedCaptainUid === captainProfile?.uid;

    return vesselMatch && isForwarded && isAssignedToMeOrUnassigned;
  });

  // Split Active and Closed bookings based on boarding status check
  const activeCharters = filteredBookings.filter(
    (b) =>
      b.boardingStatus !== "Completed" &&
      b.boardingStatus !== "Completed_Archived",
  );
  const closedCharters = filteredBookings.filter(
    (b) =>
      b.boardingStatus === "Completed" ||
      b.boardingStatus === "Completed_Archived",
  );

  // Calculate boarding scans for the current shift log or current day
  const getCurrentShiftBoardings = () => {
    const baseList = filteredBookings.filter(
      (b) => b.boardingStatus === "Boarded" || b.boardingStatus === "Completed",
    );

    if (shiftLogStart) {
      const startMs = new Date(shiftLogStart).getTime();
      const endMs = shiftLogEnd ? new Date(shiftLogEnd).getTime() : Infinity;
      return baseList.filter((b) => {
        if (!b.boardingVerifiedAt) return false;
        const bMs = new Date(b.boardingVerifiedAt).getTime();
        return bMs >= startMs && bMs <= endMs;
      });
    }

    // Fallback to boarding scans verified today (calendar day local)
    const todayStr = new Date().toDateString();
    return baseList.filter((b) => {
      if (!b.boardingVerifiedAt) return true; // Include if marked boarded historically or manually
      return new Date(b.boardingVerifiedAt).toDateString() === todayStr;
    });
  };

  const currentShiftBoardedBookings = getCurrentShiftBoardings();
  const currentShiftBoardedCount = currentShiftBoardedBookings.length;

  // Load registered shifts from Firestore or LocalStorage
  const loadShiftLogs = async () => {
    if (!captainProfile?.yachtId) return;
    try {
      const q = query(
        collection(db, "captain_shifts"),
        where("yachtId", "==", captainProfile.yachtId),
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setShiftLogs(list);
    } catch (err) {
      console.warn("Failed to load shift logs from cloud:", err);
      const localKey = `shifts_${captainProfile.yachtId}`;
      const local = localStorage.getItem(localKey);
      if (local) {
        setShiftLogs(JSON.parse(local));
      }
    }
  };

  // Submit new Shift Log
  const handleSaveShiftLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainProfile) {
      addToast(
        "Error",
        "No active authorized captain profile detected.",
        "warning",
      );
      return;
    }
    if (!shiftLogStart || !shiftLogEnd) {
      addToast(
        "Error",
        "Please specify both shift start and end times.",
        "warning",
      );
      return;
    }
    if (!shiftLogFuel) {
      addToast(
        "Error",
        "Please specify estimated fuel usage (liters).",
        "warning",
      );
      return;
    }

    setIsSavingShift(true);
    const newLog = {
      captainUid: captainProfile.uid,
      captainName: captainProfile.name,
      licenseNo: captainProfile.licenseNo,
      yachtId: captainProfile.yachtId,
      startTime: shiftLogStart,
      endTime: shiftLogEnd,
      fuelUsedLitres: Number(shiftLogFuel),
      engineHoursString: shiftLogEngineHours || "0",
      notes: shiftLogNotes,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save directly to Firestore for administrative reviews
      const docRef = doc(collection(db, "captain_shifts"));
      await setDoc(docRef, newLog);

      // Create an automated log entry system in Firestore so that when a crew member or captain changes their boarding status (shift log), it records the action, vessel ID, and timestamp in the 'crewLogs' collection for full auditability.
      const auditLogId = `crew-shift-${Date.now()}`;
      await setDoc(doc(db, "crewLogs", auditLogId), {
        id: auditLogId,
        crewId: `CAPTAIN-${captainProfile.uid}`,
        crewName: captainProfile.name,
        role: captainProfile.role || "Captain",
        status: "Boarded", // Entering shift means they boarded
        timestamp: new Date().toISOString(),
        yachtId: captainProfile.yachtId,
        scannedByCaptainUid: captainProfile.uid,
        scannedByCaptainName: captainProfile.name,
        notes: `Started shift from ${shiftLogStart} to ${shiftLogEnd} with fuel usage ${shiftLogFuel}L.`,
      });

      // Cache locally
      const localKey = `shifts_${captainProfile.yachtId}`;
      const existingStr = localStorage.getItem(localKey);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updatedLocal = [{ id: docRef.id, ...newLog }, ...existing];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      addToast(
        "Success",
        "Shift log registered successfully for administrative review!",
        "success",
      );

      // Clear inputs
      setShiftLogStart("");
      setShiftLogEnd("");
      setShiftLogFuel("");
      setShiftLogEngineHours("");
      setShiftLogNotes("");

      loadShiftLogs();
    } catch (err: any) {
      console.warn(
        "Saving shift log online failed, writing to fallback local storage...",
        err,
      );
      // Fallback
      const localKey = `shifts_${captainProfile.yachtId}`;
      const fallbackId = "shift_" + Date.now();
      const existingStr = localStorage.getItem(localKey);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updatedLocal = [{ id: fallbackId, ...newLog }, ...existing];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      addToast(
        "Success",
        "Shift logged securely to local device storage. It is preserved for admin reviews.",
        "success",
      );
      setShiftLogStart("");
      setShiftLogEnd("");
      setShiftLogFuel("");
      setShiftLogEngineHours("");
      setShiftLogNotes("");
      loadShiftLogs();
    } finally {
      setIsSavingShift(false);
    }
  };

  // Sync shifts when tab opens or vessel is re-registered
  useEffect(() => {
    if (currentTab === "shift" && isOpen) {
      loadShiftLogs();
    }
  }, [currentTab, captainProfile?.yachtId, isOpen]);

  // Sync profile form when captain profile updates
  useEffect(() => {
    if (captainProfile) {
      setProfileName(captainProfile.name || "");
      setProfilePhone(captainProfile.phoneNumber || "");
      setProfileWhatsapp(captainProfile.whatsapp || "");
      setProfileLineId(captainProfile.lineId || "");
      setProfileYachtId(captainProfile.yachtId || "");
      setProfileRole(captainProfile.role || "Crew");
    }
  }, [captainProfile]);

  // Boarding Pass QR States
  const [qrCardGreeting, setQrCardGreeting] = useState(
    "Crew Verification Passed",
  );
  const [qrCardDesign, setQrCardDesign] = useState<
    "emerald" | "navy" | "charcoal" | "sunset"
  >("emerald");
  const [qrCardTagline, setQrCardTagline] = useState(
    "Authorized Ship Personnel",
  );

  // Upgrade to Agent Workspace
  const handleUpgradeToAgent = async () => {
    if (!currentCaptainUser || !captainProfile) return;
    try {
      const agentData = {
        id: currentCaptainUser.uid,
        name: captainProfile.name,
        email: captainProfile?.email || "",
        whatsapp: captainProfile.whatsapp || profilePhone || "",
        contactPhone: profilePhone || captainProfile.phoneNumber || "",
        lineId: captainProfile.lineId || "",
        isAdmin: false,
      };
      await setDoc(doc(db, "agents", currentCaptainUser.uid), agentData, {
        merge: true,
      });
      addToast(
        "Success",
        "Successfully activated Agent Dashboard! You may log in to the Broker system with your same credentials.",
        "success",
      );
    } catch (err: any) {
      console.error(err);
      addToast("Error", "Failed to activate Agent credentials.", "warning");
    }
  };
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainProfile || !currentCaptainUser) {
      addToast("Error", "No active authorized profile detected.", "warning");
      return;
    }

    if (!profileName.trim()) {
      addToast("Error", "Please specify staff name.", "warning");
      return;
    }

    setIsUpdatingProfile(true);
    const updatedProfile: CaptainProfile = {
      ...captainProfile,
      name: profileName,
      phoneNumber: profilePhone,
      whatsapp: profileWhatsapp,
      lineId: profileLineId,
      yachtId: profileYachtId,
      role: profileRole,
    };

    try {
      // 1. Update online Firestore structure
      const oldCollection =
        captainProfile.dbSource ||
        (captainProfile.role && captainProfile.role !== "Captain"
          ? "crewMembers"
          : "captains");
      const newCollection =
        profileRole === "Captain" ? "captains" : "crewMembers";

      const savePayload = {
        ...updatedProfile,
        dbSource: newCollection,
        id: currentCaptainUser.uid,
        phone: profilePhone || captainProfile.phoneNumber || "",
      };

      if (oldCollection !== newCollection) {
        // Move to new collection
        await setDoc(
          doc(db, newCollection, currentCaptainUser.uid),
          savePayload,
        );
        await deleteDoc(doc(db, oldCollection, currentCaptainUser.uid));
      } else {
        // Keep in the same collection
        await setDoc(
          doc(db, newCollection, currentCaptainUser.uid),
          savePayload,
          { merge: true },
        );
      }

      // Update dbSource internally
      updatedProfile.dbSource = newCollection;

      // 2. Cache locally
      localStorage.setItem(
        `captain_cache_${captainProfile?.email || "unknown"}`,
        JSON.stringify(updatedProfile),
      );

      // 3. Update local state
      setCaptainProfile(updatedProfile);

      // Update selectedYachtId state as well to migrate charter view filter
      setSelectedYachtId(profileYachtId);

      addToast(
        "Success",
        "Profile details and vessel assignment updated successfully!",
        "success",
      );
    } catch (err: any) {
      console.warn(
        "Saving profile online failed, writing to fallback local storage...",
        err,
      );
      // Fallback
      localStorage.setItem(
        `captain_cache_${captainProfile?.email || "unknown"}`,
        JSON.stringify(updatedProfile),
      );
      setCaptainProfile(updatedProfile);
      setSelectedYachtId(profileYachtId);
      addToast(
        "Success",
        "Profile updated securely on local device storage.",
        "success",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Captain Authentication: Register
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    if (password.length < 6) {
      setErrorMessage(
        "Choose a secure password containing at least 6 characters.",
      );
      setIsLoading(false);
      return;
    }

    // Explicitly request Geolocation on crew and captains registration
    let regLocation: { lat: number; lng: number } | undefined = undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0,
            });
          },
        );
        regLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (locErr) {
        console.warn(
          "Could not retrieve geolocation coordinates during registration:",
          locErr,
        );
      }
    }

    try {
      localStorage.setItem("registering_captain_email", email);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Save profile metadata inside DB
      const captainData = {
        uid: userCred.user.uid,
        name: name || "Staff Representative",
        email: email,
        licenseNo:
          licenseNo || "TG-REG-" + Math.floor(100000 + Math.random() * 900000),
        yachtId: selectedYachtId,
        createdAt: new Date().toISOString(),
        role: role,
        registrationLocation: regLocation || undefined,
        isActive: false,
      };

      if (role === "Captain") {
        await setDoc(doc(db, "captains", userCred.user.uid), captainData);
      } else {
        // Maintain compatibility with AdminCrewTab
        await setDoc(doc(db, "crewMembers", userCred.user.uid), {
          id: userCred.user.uid, // AdminCrewTab expects id
          name: name || "Crew Member",
          role: role,
          phone: "",
          qrCodeUrl: "",
          // Also store captain specific fields to work seamlessly with workspace
          ...captainData,
        });
      }

      // Save locally to bypass offline gaps
      localStorage.setItem(
        `captain_cache_${email}`,
        JSON.stringify(captainData),
      );

      setCaptainProfile(captainData);
      addToast(
        "Success",
        "Registration Authorized! Welcome on board.",
        "success",
      );
    } catch (err: any) {
      console.error("SignUp error:", err);
      setErrorMessage(
        err.message || "Unable to complete security registration",
      );
    } finally {
      setIsLoading(false);
      localStorage.removeItem("registering_captain_email");
    }
  };

  // Handle Captain/Crew Authentication: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      localStorage.setItem("registering_captain_email", email);
      const cleanEmail = email.toLowerCase().trim();

      // 1. Check Firestore explicit records First
      let dataFromDb: any = null;
      let dbCollection: string = "";

      const captainsQuery = query(
        collection(db, "captains"),
        where("email", "==", cleanEmail),
      );
      const captainsSnap = await getDocs(captainsQuery);
      if (!captainsSnap.empty) {
        dataFromDb = captainsSnap.docs[0].data();
        dbCollection = "captains";
      }

      if (!dataFromDb) {
        const crewQuery = query(
          collection(db, "crewMembers"),
          where("email", "==", cleanEmail),
        );
        const crewSnap = await getDocs(crewQuery);
        if (!crewSnap.empty) {
          dataFromDb = crewSnap.docs[0].data();
          dbCollection = "crewMembers";
        }
      }

      let userCred;
      if (dataFromDb) {
        // User exists in our DB. Verify password.
        if (dataFromDb.password && dataFromDb.password !== password) {
          throw new Error("Invalid password.");
        }

        if (dataFromDb.isActive === false) {
          setErrorMessage("Account deactivated.");
          setIsLoading(false);
          return;
        }

        // Try getting an actual auth session, but if it doesn't work, recreate it!
        try {
          userCred = await signInWithEmailAndPassword(
            auth,
            cleanEmail,
            password,
          );
        } catch (authError: any) {
          try {
            userCred = await createUserWithEmailAndPassword(
              auth,
              cleanEmail,
              password,
            );
          } catch (creationErr) {
            console.warn("Could not setup Auth, using simulated session.");
          }
        }

        // If Auth worked, save standard stuff
        if (dataFromDb.shipId && !dataFromDb.yachtId) {
          dataFromDb.yachtId = dataFromDb.shipId;
        }

        if (userCred) {
          setCaptainProfile(dataFromDb as CaptainProfile);
          setSelectedYachtId(dataFromDb.yachtId || CATAMARANS[0]?.id || "");
        } else {
          // Simulated Session fallback
          const simulatedUser = {
            uid: dataFromDb.id || dataFromDb.uid || `crew_sim_${Date.now()}`,
            email: dataFromDb.email,
            displayName: dataFromDb.name,
            isCustomRegistry: true,
          };
          setCurrentCaptainUser(simulatedUser as any);
          setCaptainProfile(dataFromDb);
          setSelectedYachtId(dataFromDb.yachtId || CATAMARANS[0]?.id || "");
          localStorage.setItem(
            "custom_logged_in_crew",
            JSON.stringify({ user: simulatedUser, profile: dataFromDb }),
          );
        }

        addToast(
          "Success",
          "Secure access granted! Opening Workspace.",
          "success",
        );
        return;
      }

      // 2. If user is completely unknown to DB, try plain Auth
      userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);

      let docRef = doc(db, "captains", userCred.user.uid);
      let docSnap = await getDoc(docRef);
      let data: any = null;

      if (docSnap.exists()) {
        data = docSnap.data() as CaptainProfile;
      } else {
        docRef = doc(db, "crewMembers", userCred.user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          data = docSnap.data();
        }
      }

      if (data) {
        if (data.isActive === false) {
          await signOut(auth);
          setErrorMessage("Account deactivated.");
          setIsLoading(false);
          return;
        }
        setCaptainProfile(data as CaptainProfile);
        setSelectedYachtId(data.yachtId || CATAMARANS[0]?.id || "");
      } else {
        // Build fallback profile
        const fallbackProfile: CaptainProfile = {
          uid: userCred.user.uid,
          name: "Licensed Crew Member",
          email: cleanEmail,
          role: "Deckhand",
          licenseNo: "TG-REF-" + Math.floor(100000 + Math.random() * 900000),
          yachtId: CATAMARANS[0]?.id || "",
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "crewMembers", userCred.user.uid), {
          id: userCred.user.uid,
          ...fallbackProfile,
        });
        setCaptainProfile(fallbackProfile);
      }
      addToast(
        "Success",
        "Secure access granted! Opening Workspace.",
        "success",
      );
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
      localStorage.removeItem("registering_captain_email");
    }
  };

  // Captain updates which ship they drive
  const handleUpdateCommandVessel = async (yachtId: string) => {
    if (!currentCaptainUser) return;
    try {
      const isCrew = captainProfile?.role && captainProfile.role !== "Captain";
      const collectionName = isCrew ? "crewMembers" : "captains";
      const profileRef = doc(db, collectionName, currentCaptainUser.uid);
      await updateDoc(profileRef, { yachtId });

      const updatedProfile = { ...captainProfile!, yachtId };
      setCaptainProfile(updatedProfile);
      setSelectedYachtId(yachtId);

      // Save local cache backup
      localStorage.setItem(
        `captain_cache_${captainProfile?.email || "unknown"}`,
        JSON.stringify(updatedProfile),
      );

      addToast(
        "Success",
        "Command vessel registers refreshed successfully!",
        "success",
      );
      loadBookings();
    } catch (err) {
      console.error("Error setting brand new drive vessel:", err);
      // Local state fallback
      const updatedProfile = { ...captainProfile!, yachtId };
      setCaptainProfile(updatedProfile);
      setSelectedYachtId(yachtId);
      addToast("Info", "Command vessel updated locally!", "info");
    }
  };

  // Helper to trigger push notifications to Broker and Admin on Boarding
  const triggerBoardingNotification = async (
    booking: any,
    vesselId: string,
  ) => {
    if (!booking) return;
    try {
      const alertId =
        "alert_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const vesselName =
        CATAMARANS.find((c) => c.id === vesselId)?.name ||
        vesselId ||
        "Luxury Catamaran";
      const clientName =
        booking.clientName || booking.customerName || "Charterer";
      const captainName = captainProfile?.name || "Authorized Crew";
      const agentEmail = (booking.agentEmail || "").trim().toLowerCase();

      const alertPayload = {
        id: alertId,
        bookingId: booking.id || "",
        clientName,
        vesselId: vesselId || "unknown",
        vesselName,
        captainUid: captainProfile?.uid || "unknown",
        captainName,
        agentEmail,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        message: `Capt. ${captainName} initiated Boarding on vessel "${vesselName}" for party "${clientName}". Charter active!`,
      };

      await setDoc(doc(db, "boarding_notifications", alertId), alertPayload);
      console.log(
        "Successfully broadcasted boarding notification via Firestore!",
      );
    } catch (err) {
      console.warn(
        "Failed sending real-time boarding alert to Firestore:",
        err,
      );
    }
  };

  // Close / Completed Booking State Toggle
  const handleSetBookingStatus = async (
    bookingId: string,
    statusText: "Boarded" | "Completed",
  ) => {
    try {
      const embarkTimestamp = new Date().toISOString();
      const updatePayload: any = {
        boardingStatus: statusText,
      };
      if (statusText === "Boarded") {
        updatePayload.boardedAt = embarkTimestamp;
        // Trigger push notification to broker and admin
        const matched = bookings.find((b) => b.id === bookingId);
        if (matched) {
          const matchVesselId =
            matched.vesselId1 ||
            matched.recommendedVesselId ||
            captainProfile?.yachtId;
          triggerBoardingNotification(matched, matchVesselId);
        }
      }
      if (captainProfile) {
        updatePayload.assignedCaptainUid = captainProfile.uid;
        updatePayload.assignedCaptainName = captainProfile.name;
      }

      // Modify online Firestore structure
      await setDoc(doc(db, "proposals", bookingId), updatePayload, {
        merge: true,
      });

      // Build guest profile for crew logs if needed
      const matchedUser = bookings.find((b) => b.id === bookingId);
      if (matchedUser) {
        // Mirror to crew logs for general manifest audit trail
        const auditLogId = `passenger-${Date.now()}`;
        await setDoc(doc(db, "crewLogs", auditLogId), {
          id: auditLogId,
          crewId: `PASSENGER-${matchedUser.id}`,
          crewName:
            matchedUser.clientName ||
            matchedUser.customerName ||
            "Charter Guest",
          role: "Passenger",
          status: statusText,
          timestamp: embarkTimestamp,
          scannedByCaptainUid: captainProfile?.uid || "unknown",
          scannedByCaptainName: captainProfile?.name || "Unknown",
          yachtId:
            matchedUser.vesselId1 ||
            matchedUser.recommendedVesselId ||
            captainProfile?.yachtId ||
            "",
          notes: `Passenger verified voucher ${matchedUser.id} and recorded '${statusText}' action.`,
        });
      }

      // Modify local registry structure
      const localStored = localStorage.getItem("phuket_charter_proposals");
      if (localStored) {
        const list = JSON.parse(localStored);
        const updated = list.map((b: any) => {
          if (b.id === bookingId) {
            return { ...b, ...updatePayload };
          }
          return b;
        });
        localStorage.setItem(
          "phuket_charter_proposals",
          JSON.stringify(updated),
        );
      }

      window.dispatchEvent(new Event("proposals-updated"));
      addToast(
        "Success",
        `Booking tracking updated to ${statusText.toUpperCase()}`,
        "success",
      );

      // Update local state if selected
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev: any) => ({ ...prev, ...updatePayload }));
      }
      if (scannedResult && scannedResult.id === bookingId) {
        setScannedResult((prev: any) => ({ ...prev, ...updatePayload }));
      }

      loadBookings();
    } catch (err) {
      console.warn(
        "Failed updating remote booking metadata, applying local storage fallback:",
        err,
      );
      // Local Storage Fallback
      const localStored = localStorage.getItem("phuket_charter_proposals");
      if (localStored) {
        const list = JSON.parse(localStored);
        const updated = list.map((b: any) => {
          if (b.id === bookingId) {
            const embarkTimestamp = new Date().toISOString();
            const updatePayload: any = {
              boardingStatus: statusText,
            };
            if (statusText === "Boarded") {
              updatePayload.boardedAt = embarkTimestamp;
            }
            if (captainProfile) {
              updatePayload.assignedCaptainUid = captainProfile.uid;
              updatePayload.assignedCaptainName = captainProfile.name;
            }
            return { ...b, ...updatePayload };
          }
          return b;
        });
        localStorage.setItem(
          "phuket_charter_proposals",
          JSON.stringify(updated),
        );
        window.dispatchEvent(new Event("proposals-updated"));
      }
      loadBookings();
    }
  };

  // Simulated Scanning Engine: Lookup specific boarding code / references
  const handlePerformSimulatedScan = async (overrideCode?: string) => {
    setScanError("");
    setScannedResult(null);
    setScannedJustProcessed(false);

    const inputToUse = overrideCode || scanInput;

    if (!inputToUse.trim()) {
      setScanError("Provide or select a valid boarding voucher passcode.");
      return;
    }

    try {
      const parsed = JSON.parse(inputToUse);
      if (parsed.type === "crew" && parsed.id) {
        // Crew Verification Logic: "ZAPISNIK UKRCAJA ... AKO NIJE REGISTRIRAN NEMOZE SE UKRCATI"
        let isValidCrew = false;
        let registeredCrewName = parsed.name || "Unknown Crew";
        let registeredRole = parsed.role || "Crew";
        let registeredEmail = "";
        let registeredPhone = "";
        let targetCollection = "";

        try {
          const crewDocRef = doc(db, "crewMembers", parsed.id);
          const crewSnap = await getDoc(crewDocRef);

          if (crewSnap.exists()) {
            isValidCrew = true;
            targetCollection = "crewMembers";
            registeredCrewName = crewSnap.data().name || registeredCrewName;
            registeredRole = crewSnap.data().role || registeredRole;
            registeredEmail = crewSnap.data().email || "";
            registeredPhone = crewSnap.data().phone || "";
          } else {
            const capDocRef = doc(db, "captains", parsed.id);
            const capSnap = await getDoc(capDocRef);
            if (capSnap.exists()) {
              isValidCrew = true;
              targetCollection = "captains";
              registeredCrewName = capSnap.data().name || registeredCrewName;
              registeredRole = capSnap.data().role || registeredRole;
              registeredEmail = capSnap.data().email || "";
              registeredPhone = capSnap.data().phone || "";
            }
          }
        } catch (err) {
          console.warn("Firebase Crew Doc lookup failed", err);
        }

        if (!isValidCrew) {
          setScanError(
            `Pristup odbijen: Skenirani član posade "${parsed.name || parsed.id}" nije registriran u Crew Workspaceu i ne može se ukrcati.`,
          );
          return;
        }

        if (
          boardingStatus === "Boarded" &&
          captainProfile?.yachtId &&
          targetCollection
        ) {
          // Auto-assign the crew member to the current captain's ship
          try {
            await updateDoc(doc(db, targetCollection, parsed.id), {
              shipId: captainProfile.yachtId,
            });
          } catch (assignErr) {
            console.warn(
              "Could not auto-assign ship to crew member from scanner",
              assignErr,
            );
          }
        }

        setScannedJustProcessed(true);
        setScannedResult({
          title: `CREW BOARDED: ${registeredCrewName} (${registeredRole})`,
          type: "crew",
        });

        const matchedAgent = agents.find(
          (a) =>
            registeredCrewName &&
            a.name.toLowerCase() === registeredCrewName.toLowerCase(),
        );
        if (matchedAgent) {
          localStorage.setItem(
            "charter_active_agent",
            JSON.stringify(matchedAgent),
          );
          console.log(
            "Successfully paired crew agent profile:",
            matchedAgent.name,
          );
        }

        // Log to firebase
        const logId = `log-${Date.now()}`;
        const resolvedAddress = scanLocation
          ? await reverseGeocode(scanLocation)
          : undefined;
        await setDoc(doc(db, "crewLogs", logId), {
          id: logId,
          crewId: parsed.id,
          crewName: registeredCrewName, // Must contain name & data from registry
          role: registeredRole,
          email: registeredEmail,
          phone: registeredPhone,
          timestamp: new Date().toISOString(),
          scannedByCaptainUid: captainProfile?.uid || "",
          scannedByCaptainName: captainProfile?.name || "Unknown Captain",
          yachtId: captainProfile?.yachtId || "",
          status: boardingStatus,
          location: scanLocation,
          locationName: resolvedAddress || undefined,
        });

        setTimeout(() => {
          setScannedJustProcessed(false);
          setScanInput("");
          setScannedResult(null);
        }, 6000);
        return;
      }
    } catch (e) {
      // not a json string, proceed to normal booking scan
    }

    const matched = bookings.find(
      (b) =>
        b.id?.toLowerCase().trim() === inputToUse.toLowerCase().trim() ||
        b.verifyBookingId?.toLowerCase().trim() ===
          inputToUse.toLowerCase().trim(),
    );

    if (matched) {
      const matchVesselId = matched.vesselId1 || matched.recommendedVesselId;
      if (matchVesselId === captainProfile?.yachtId) {
        // Automatically save time of embarkation, assign to logged-in captain, and mark as boarded
        const embarkTimestamp = new Date().toISOString();
        const updatedBooking = {
          ...matched,
          sentToCaptain: true,
          sentToCaptainAt: matched.sentToCaptainAt || embarkTimestamp,
          assignedCaptainUid: captainProfile?.uid,
          assignedCaptainName: captainProfile?.name,
          boardingStatus: "Boarded",
          boardedAt: embarkTimestamp,
        };

        try {
          await setDoc(
            doc(db, "proposals", updatedBooking.id),
            updatedBooking,
            { merge: true },
          );
          // Trigger real-time boarding alert to Admin and Broker
          triggerBoardingNotification(updatedBooking, matchVesselId);
        } catch (e) {
          console.warn("Failed saving scanned assignment online:", e);
        }

        // Automatically write a mirroring item inside the shifts log for administrative record
        const autoShiftId = "shift_auto_" + Date.now();
        const autoShiftLog = {
          captainUid: captainProfile?.uid || "UNKNOWN_UID",
          captainName: captainProfile?.name || "Authorized Crew",
          licenseNo: captainProfile?.licenseNo || "TG-AUTO-REF",
          yachtId: captainProfile?.yachtId || matchVesselId,
          startTime: embarkTimestamp,
          endTime: embarkTimestamp,
          fuelUsedLitres: 0,
          engineHoursString: "0",
          notes: `[AUTO-SCANNED BOARDING LOG] Client "${updatedBooking.clientName || updatedBooking.customerName || "Guest"}" successfully scanned boarding QR code, authenticated manifest list, and boarded unit. Booking ID: ${updatedBooking.id}`,
          createdAt: embarkTimestamp,
        };

        try {
          await setDoc(doc(db, "captain_shifts", autoShiftId), autoShiftLog);
          // Save locally
          const localKey = `shifts_${captainProfile?.yachtId}`;
          const existingStr = localStorage.getItem(localKey);
          const existing = existingStr ? JSON.parse(existingStr) : [];
          const updatedLocal = [
            { id: autoShiftId, ...autoShiftLog },
            ...existing,
          ];
          localStorage.setItem(localKey, JSON.stringify(updatedLocal));
        } catch (e) {
          console.warn("Failed saving auto boarding to captain_shifts:", e);
        }

        // Save locally
        const localStored = localStorage.getItem("phuket_charter_proposals");
        if (localStored) {
          try {
            const list = JSON.parse(localStored);
            const updatedList = list.some(
              (b: any) => b.id === updatedBooking.id,
            )
              ? list.map((b: any) =>
                  b.id === updatedBooking.id ? updatedBooking : b,
                )
              : [updatedBooking, ...list];
            localStorage.setItem(
              "phuket_charter_proposals",
              JSON.stringify(updatedList),
            );
          } catch (e) {}
        }

        // Activate visual conformation pulsing state
        setScannedJustProcessed(true);

        // Reload state and notify other components
        setTimeout(() => {
          loadBookings();
          window.dispatchEvent(new Event("proposals-updated"));
        }, 50);

        setScannedResult(updatedBooking);

        // Hide pulse ring after 6 seconds to return to normal
        setTimeout(() => {
          setScannedJustProcessed(false);
        }, 6000);
      } else {
        setScanError(
          `Warning: This booking is scheduled on vessel "${matchVesselId || "unassigned"}". Your registered command vessel is "${captainProfile?.yachtId}". Only trips scheduled on your driving vessel can be added/cleared.`,
        );
      }
    } else {
      setScanError(
        "No manifest is registered under this identification voucher.",
      );
    }
  };

  const handleDownloadCaptainReport = (b: any) => {
    const vesselObj = CATAMARANS.find(
      (v) => v.id === (b.vesselId1 || b.recommendedVesselId),
    );
    const dataForPdf = {
      id: b.id || "GUEST-MANIFEST",
      clientName: b.clientName || b.customerName || "Authenticated Guest",
      customerEmail: b.customerEmail,
      charterDate: b.charterDate,
      vesselName: vesselObj?.name || "Premium Catamaran",
      guestCount: b.guestCount || b.passengers?.length || 1,
      hotelPickupLocation: b.hotelPickupLocation,
      passengers: b.passengers || [],
      boardingStatus: b.boardingStatus,
      boardedAt: b.boardedAt,
    };

    try {
      const doc = generateCaptainManifestPdf(dataForPdf);
      doc.save(`Port_Captain_Manifest_${b.id || "Verification"}.pdf`);
    } catch (err) {
      addToast(
        "Error",
        "Error printing manifest. Please check passenger values.",
        "warning",
      );
    }
  };

  const handleSignOut = async () => {
    if (captainProfile) {
      try {
        const auditLogId = `crew-shift-out-${Date.now()}`;
        await setDoc(doc(db, "crewLogs", auditLogId), {
          id: auditLogId,
          crewId: `CAPTAIN-${captainProfile.uid}`,
          crewName: captainProfile.name,
          role: captainProfile.role || "Captain",
          status: "Deboarded",
          timestamp: new Date().toISOString(),
          yachtId: captainProfile.yachtId,
          scannedByCaptainUid: captainProfile.uid,
          scannedByCaptainName: captainProfile.name,
          notes: `Captain signed out of the workspace terminal.`,
        });
      } catch (err) {
        console.warn("Failed recording deboard audit:", err);
      }
    }

    localStorage.removeItem("custom_logged_in_crew");
    signOut(auth).then(() => {
      setCaptainProfile(null);
      setCurrentCaptainUser(null);
      addToast("Info", "Captain system closed.", "info");
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-sm z-[5100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-[96vw] xl:max-w-[1400px] bg-white rounded-xs shadow-2xl border-2 border-slate-900 overflow-hidden flex flex-col my-4 h-[96vh] min-h-[600px]">
        {/* Header Block with Executive Dark Backdrop */}
        <div className="bg-[#0F172A] p-4.5 px-6 flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 rounded-sm p-1.5 text-emerald-950 border border-emerald-400">
              <Anchor className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-[0.2em] uppercase font-sans flex items-center gap-1.5 opacity-90">
                Fleet Logistics & Operations
              </span>
              <h3 className="text-xl font-serif tracking-wide text-white font-light mt-1 mb-0.5">
                Fleet Captain & Crew Workspace
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentCaptainUser && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex items-center gap-1.5 bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-xs text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer select-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4 text-slate-300" />
                ) : (
                  <Menu className="h-4 w-4 text-slate-300" />
                )}
                <span>Menu</span>
              </button>
            )}
            {currentCaptainUser && (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 px-3 py-1.5 rounded-xs text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer select-none font-mono"
                title="Log Out Captain Workspace"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden xs:inline">Log Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 px-2.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Outer Workspace Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 relative">
          {/* Guest Form/Sign-in block OR Logged In Navigation Drawer */}
          <div
            className={`w-full md:w-72 md:min-w-[280px] h-full ${currentCaptainUser ? "bg-[#0F172A] border-[#1E293B]" : "bg-slate-100 border-slate-200"} border-r flex flex-col overflow-y-auto ${currentCaptainUser && !isMobileMenuOpen ? "hidden md:flex z-10" : "flex absolute md:relative z-20"}`}
          >
            {!currentCaptainUser ? (
              // Unauthenticated Entry Panel
              <div className="p-5 flex-1 flex flex-col justify-center bg-white">
                <div className="text-center pb-5">
                  <div className="h-12 w-12 rounded-full bg-slate-950 text-emerald-400 mx-auto flex items-center justify-center border border-slate-800 mb-2 shadow-sm">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                    {authMode === "login"
                      ? "Maritime Login Entry"
                      : "Register Charter Captain"}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Secure license check & roster clearance activation
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xs text-[10px] mb-4 flex items-start gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form
                  onSubmit={authMode === "login" ? handleLogin : handleSignUp}
                  className="space-y-3"
                >
                  {authMode === "signup" && (
                    <>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Staff Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Captain Somchai or John Doe"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:border-slate-800 focus:outline-hidden bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Role / Position
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:border-slate-800 focus:outline-hidden bg-white text-slate-800"
                        >
                          <option value="Captain">Captain</option>
                          <option value="First Mate">First Mate</option>
                          <option value="Deckhand">Deckhand</option>
                          <option value="Host/Hostess">Host/Hostess</option>
                          <option value="Chef">Chef</option>
                          <option value="Engineer">Engineer</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Staff Email Access
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Somchai@yachtcharter.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:border-slate-800 focus:outline-hidden bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Workspace Password
                    </label>
                    <PasswordInput
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters *"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xs focus:border-slate-800 focus:outline-hidden bg-white text-slate-800 opacity-95"
                    />
                  </div>

                  {authMode === "signup" && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Select Command Catamaran
                      </label>
                      <select
                        value={selectedYachtId}
                        onChange={(e) => setSelectedYachtId(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xs focus:border-slate-800 focus:outline-hidden bg-white text-slate-800 font-medium"
                      >
                        {CATAMARANS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.model})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-sans font-bold text-[10px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {authMode === "login"
                        ? "Request Verification"
                        : "Complete Safety Registry"}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode(authMode === "login" ? "signup" : "login")
                    }
                    className="text-[10px] text-emerald-600 font-sans font-extrabold uppercase tracking-wide hover:underline"
                  >
                    {authMode === "login"
                      ? "Need Registry Captain and Crew? Register here"
                      : "Return to Log-in Clearance"}
                  </button>
                </div>
              </div>
            ) : (
              // Authenticated Dashboard left rail
              <div className="flex flex-col w-full min-h-full bg-[#0F172A] text-slate-300">
                {/* Profile Card Summary */}
                <div className="pt-6 pb-4 bg-[#0F172A] border-b border-[#1E293B] text-center flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-600 border-2 border-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg relative mb-2 select-none group-hover:scale-105 transition-transform">
                    {captainProfile?.name?.charAt(0).toUpperCase() || "C"}
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-emerald-400 text-emerald-400">
                      <Anchor className="h-3 w-3" />
                    </div>
                  </div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide">
                    Capt. {captainProfile?.name || "Licensed Pilot"}
                  </h4>
                  <p className="text-[8px] font-mono tracking-widest text-[#10b981] mt-0.5 uppercase">
                    Lic: {captainProfile?.licenseNo || "GEN-PILOT-99"}
                  </p>
                </div>

                {/* COMMAND VESSEL REGISTER SELECTOR */}
                <div className="px-5 py-4 bg-[#0F172A] border-b border-[#1E293B]">
                  <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Compass className="h-3 w-3 text-emerald-400" /> Register
                    Drive Vessel
                  </label>
                  <select
                    value={selectedYachtId}
                    onChange={(e) => handleUpdateCommandVessel(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#1E293B] border border-slate-800 rounded-sm text-[11px] text-white focus:outline-hidden font-bold select-none cursor-pointer"
                  >
                    {CATAMARANS.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-[#1E293B] text-slate-200"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[8px] text-slate-500 mt-1.5 font-mono leading-normal leading-relaxed">
                    Confirm your vessel here. Bookings assigned to this yacht
                    appear automatically below.
                  </p>
                </div>

                {/* SHIFT PROGRESS MONITOR & BOARDING COUNT */}
                <div className="px-5 py-4 border-b border-[#1E293B]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1 font-sans">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />{" "}
                      Crew Boarding Count
                    </span>
                    <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-xs border border-emerald-900/60 shadow-inner">
                      {currentShiftBoardedCount} / {filteredBookings.length}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{
                        width: `${filteredBookings.length > 0 ? Math.min(100, (currentShiftBoardedCount / filteredBookings.length) * 100) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 select-none">
                    <span className="text-[7.5px] font-mono text-slate-500 uppercase font-bold">
                      {shiftLogStart
                        ? "LOGGED SHIFT RANGE"
                        : "TODAY'S TOUR ROTATION"}
                    </span>
                    <span className="text-[7.5px] font-mono font-bold text-slate-300">
                      {filteredBookings.length > 0
                        ? `${Math.round(Math.min(100, (currentShiftBoardedCount / filteredBookings.length) * 100))}% Checked In`
                        : "0% Complete"}
                    </span>
                  </div>
                </div>

                {/* Dashboard Options Vertical Nav */}
                <div className="flex-1 overflow-y-auto w-full space-y-1 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("active");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "active"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "active" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <Compass className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center w-full">
                          <span
                            className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "active" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                          >
                            Active Excursions
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs ${currentTab === "active" ? "bg-slate-950 text-emerald-400" : "bg-slate-900 text-slate-500"}`}
                          >
                            {activeCharters.length}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "active" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Today's boarding operations
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("closed");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "closed"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "closed" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <CheckCircle className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center w-full">
                          <span
                            className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "closed" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                          >
                            Closed Bookings
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs ${currentTab === "closed" ? "bg-slate-950 text-emerald-400" : "bg-slate-900 text-slate-500"}`}
                          >
                            {closedCharters.length}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "closed" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Past excursion records
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("scan");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "scan"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "scan" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <Clipboard className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "scan" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                        >
                          Verify Manifest Scan
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "scan" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Scan guest boarding passes
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("shift");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "shift"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "shift" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <FileText className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "shift" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                        >
                          Shift Logging Desk
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "shift" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Daily ops reporting
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("calendar");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "calendar"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "calendar" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <Calendar className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "calendar" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                        >
                          Bookings Calendar
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "calendar" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Vessel schedule dates
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("logs");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "logs"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "logs" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <FileText className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "logs" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                        >
                          Boarding Logs
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "logs" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Master crew registry
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("profile");
                      setSelectedBooking(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 group relative transition-all duration-300 border-l-[3px] ${
                      currentTab === "profile"
                        ? "border-emerald-500 bg-slate-800/80"
                        : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex gap-3.5 items-center">
                      <div
                        className={`${currentTab === "profile" ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"}`}
                      >
                        <User className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${currentTab === "profile" ? "text-white" : "text-slate-300 group-hover:text-slate-200"}`}
                        >
                          Profile Settings
                        </span>
                        <span
                          className={`text-[9px] font-medium leading-relaxed mt-0.5 ${currentTab === "profile" ? "text-emerald-500/80" : "text-slate-500 group-hover:text-slate-400"}`}
                        >
                          Configure account
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="px-5 pb-5">
                    {captainProfile?.role === "Captain" && (
                      <button
                        type="button"
                        onClick={async () => {
                          // Ensure captain is also minted as an Agent so they can use "Broker Workspace"
                          if (captainProfile) {
                            const safeEmail =
                              captainProfile?.email ||
                              `crew_${captainProfile.uid || Date.now()}@yacht.com`;
                            const agentId = safeEmail
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "_");
                            try {
                              const agentDoc = await getDoc(
                                doc(db, "agents", agentId),
                              );
                              if (!agentDoc.exists()) {
                                await setDoc(
                                  doc(db, "agents", agentId),
                                  {
                                    id: agentId,
                                    name:
                                      captainProfile.name || "Fleet Captain",
                                    email: safeEmail,
                                    password: password || "captain_auto",
                                    whatsapp:
                                      captainProfile.phoneNumber ||
                                      "66000000000",
                                    contactPhone:
                                      captainProfile.phoneNumber ||
                                      "+66 00 000 0000",
                                    companyName: "Fleet Captain",
                                  },
                                  { merge: true },
                                );
                              }

                              // Setup local auth token for the Agent/Broker context
                              const docData = agentDoc.exists()
                                ? agentDoc.data()
                                : {
                                    id: agentId,
                                    name:
                                      captainProfile.name || "Fleet Captain",
                                    email: safeEmail,
                                    whatsapp:
                                      captainProfile.phoneNumber ||
                                      "66000000000",
                                    contactPhone:
                                      captainProfile.phoneNumber ||
                                      "+66 00 000 0000",
                                  };
                              localStorage.setItem(
                                "charter_active_agent",
                                JSON.stringify(docData),
                              );
                            } catch (e) {
                              console.error("Auto agent sync failed:", e);
                            }
                          }
                          onClose();
                          // Open agent portal by injecting query parameter (safe reload trigger)
                          const targetUrl = new URL(window.location.href);
                          targetUrl.searchParams.set("agent-portal", "true");
                          targetUrl.searchParams.set("from", "crew");
                          window.location.href = targetUrl.toString();
                        }}
                        className="w-full py-2.5 px-3.5 rounded-sm font-sans text-[10px] uppercase font-bold tracking-wider text-left flex items-center justify-between transition-all cursor-pointer hover:bg-slate-800/40 text-sky-400 hover:text-sky-300 border border-sky-900/30 bg-sky-950/20 mt-4"
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Agent/Broker Workspace</span>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2.5 px-3.5 mt-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 rounded-sm font-sans text-[10px] uppercase font-bold tracking-wider text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>LOG OUT CAPTAIN DESK</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Core Action Console Area */}
          <div
            className={`flex-1 p-5 overflow-y-auto flex-col justify-between ${currentCaptainUser && isMobileMenuOpen ? "hidden md:flex" : "flex"}`}
          >
            {!currentCaptainUser ? (
              // Non-logged in presentation overview
              <div className="m-auto max-w-lg text-center p-8 border border-dashed border-slate-300 rounded-sm bg-white">
                <Compass
                  className="h-10 w-10 text-emerald-600 mx-auto animate-spin mb-3"
                  style={{ animationDuration: "10s" }}
                />
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                  Command & Dispatch Fleet Terminal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-2.5">
                  Welcome to the authorized Phuket Captain access suite. Log in
                  to your specialized licensing credentials to verify manifests,
                  sign off passenger boarding procedures, and query upcoming
                  active itineraries for your drive vessel.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-100">
                    <h5 className="text-[10px] font-bold uppercase text-slate-800">
                      1. Drive Vessel Registry
                    </h5>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Associate your profile permanently to any catamaran or
                      mega-yacht in our fleet.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xs border border-slate-100">
                    <h5 className="text-[10px] font-bold uppercase text-slate-800">
                      2. Manifest Sign-off
                    </h5>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Secure boarding checks and print captain lists without
                      price metrics.
                    </p>
                  </div>
                </div>
              </div>
            ) : captainProfile && captainProfile.isActive !== true ? (
              <div className="m-auto max-w-lg text-center p-8 border border-dashed border-slate-300 rounded-md shadow-sm bg-white">
                <Shield className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                  Account Under Admin Review
                </h3>
                <p className="text-[12px] text-slate-500 leading-relaxed mt-2.5 mb-6">
                  Your profile has been successfully registered. Due to strict
                  security protocols, a master administrator must review and
                  approve your credentials before you can gain access to
                  operational dispatch terminal features and passenger
                  manifests.
                </p>
                <button
                  onClick={handleSignOut}
                  className="mx-auto flex justify-center py-2 px-6 bg-slate-900 border-2 border-slate-900 text-white rounded-xs font-sans text-[10px] uppercase font-bold tracking-widest hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close Secure Terminal
                </button>
              </div>
            ) : (
              // True Dashboard active screen based on selectedTab state, WITH EXCLUSION OF ALL PRICING METRICS
              <div className="space-y-4 flex-1">
                {currentTab === "active" && (
                  <div className="space-y-4">
                    {captainAlerts.filter((a) => !a.read).length > 0 && (
                      <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                          {captainAlerts.filter((a) => !a.read).length} new
                          charter notification(s)
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {captainAlerts
                            .filter((a) => !a.read)
                            .map((a) => (
                              <li
                                key={a.id}
                                onClick={() => markCaptainAlertRead(a.id)}
                                className="cursor-pointer text-[11px] text-slate-700 hover:text-slate-900"
                              >
                                • {a.message}{" "}
                                <span className="text-slate-400">
                                  ({a.charterDate || "date TBA"})
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                          Assigned Active Excursions
                        </h3>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Active itineraries forwarded specifically to your
                          vessel for clearance
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search charterer name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 text-xs text-slate-800 rounded-sm focus:outline-hidden focus:border-slate-800 w-full sm:w-48"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>

                    {activeCharters.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-slate-200 rounded-xs bg-white text-slate-400">
                        <Compass className="h-8 w-8 mx-auto text-slate-300 animate-pulse mb-2" />
                        <h4 className="text-[11px] font-bold uppercase text-slate-600">
                          No Active Excursion Tasks
                        </h4>
                        <p className="text-[10px] mt-1">
                          No bookings are currently forwarded to this drive
                          vessel. Ask the listing agent to click "Send to
                          Captain & Crew" from their workspace dashboard.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeCharters
                          .filter((b) =>
                            (b.clientName || b.customerName || "")
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                          .map((b) => renderBookingCard(b))}
                      </div>
                    )}
                  </div>
                )}

                {currentTab === "closed" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 font-sans">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-slate-700 shrink-0" />{" "}
                          Closed & Archived Bookings
                        </h3>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Historic voyages completed or archived
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search charterer..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 text-xs text-slate-800 rounded-sm focus:outline-hidden focus:border-slate-800 w-full sm:w-48"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>

                    {closedCharters.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-slate-200 rounded-xs bg-white text-slate-400">
                        <Clipboard className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <h4 className="text-[11px] font-bold uppercase text-slate-600">
                          No Closed Register Documents
                        </h4>
                        <p className="text-[10px] mt-1">
                          When charters are marked as fully processed or
                          "Completed", their history will be preserved securely
                          inside this folder.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {closedCharters
                          .filter((b) =>
                            (b.clientName || b.customerName || "")
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                          .map((b) => renderBookingCard(b))}
                      </div>
                    )}
                  </div>
                )}

                {currentTab === "scan" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                        <Clipboard className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                        Verify Manifest & Boarding Code
                      </h3>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Lookup or scan guest vouchers instantly at Phuket Pier
                        to sign off passenger manifest records
                      </p>
                    </div>

                    {/* Interactive Boarding Progress Stats Strip */}
                    <div className="max-w-xl mx-auto mb-1 bg-white border border-slate-200 p-3.5 rounded-sm flex items-center justify-between shadow-3xs">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block font-sans">
                          Active Shift Boardings
                        </span>
                        <span className="text-xs font-black text-[#0F172A] uppercase tracking-tight block">
                          {currentShiftBoardedCount} / {filteredBookings.length}{" "}
                          Bookings Scanned
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right select-none">
                          <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-xs uppercase tracking-wider block">
                            {filteredBookings.length > 0
                              ? `${Math.round(Math.min(100, (currentShiftBoardedCount / filteredBookings.length) * 100))}% Boarded`
                              : "No excursions loaded"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-xl mx-auto p-5 bg-slate-100 border border-slate-200 rounded-xs">
                      <h4 className="text-[10px] font-black uppercase text-[#0F172A] tracking-wider mb-2">
                        Simulate Digital QR Roster Scan
                      </h4>

                      {/* VOYAGE VIEWPORT SCANNING VIEWFINDER MOCKUP */}
                      <div className="relative w-full h-48 bg-slate-950 border border-slate-800 rounded-sm overflow-hidden mb-4 flex flex-col items-center justify-center select-none shadow-inner">
                        {/* Corner Target Markers */}
                        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-600" />
                        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-600" />
                        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-600" />
                        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-600" />

                        {/* Scanner Laser Grid */}
                        {!scannedJustProcessed && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce"
                            style={{ top: "40%" }}
                          />
                        )}

                        {scannedJustProcessed ? (
                          <div className="flex flex-col items-center justify-center space-y-2.5 animate-fade-in z-10 px-4">
                            {/* Multiplying Green Pulsing Rings */}
                            <div className="relative flex items-center justify-center mb-1">
                              {/* Pulse Outer 1 */}
                              <div className="absolute w-20 h-20 rounded-full border-4 border-emerald-500 animate-ping opacity-75" />
                              {/* Pulse Outer 2 */}
                              <div className="absolute w-28 h-28 rounded-full border border-emerald-400 animate-pulse opacity-40" />
                              {/* Solid Core Ring */}
                              <div className="relative w-14 h-14 rounded-full bg-emerald-950/40 border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.7)] z-10">
                                <Check className="h-7 w-7 text-emerald-400 stroke-[3.5] animate-[scale-up_0.3s_ease-out]" />
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono block">
                                BOARDING SYNCHRONIZED
                              </span>
                              <span className="text-[8.5px] text-slate-400 font-bold tracking-tight block">
                                Roster records logged & verified to Captain
                                shift log
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center select-none opacity-40 flex flex-col items-center gap-1.5 z-10">
                            <QrCode className="h-10 w-10 text-slate-500 animate-pulse" />
                            <span className="text-[8px] font-bold tracking-widest uppercase text-slate-500 font-mono">
                              POSITION VOUCHER CODE IN FRAME
                            </span>
                          </div>
                        )}

                        {/* Device Info Badge */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/80 border border-slate-800 text-[8px] px-2 py-0.5 rounded-sm font-mono text-slate-400 uppercase">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${scannedJustProcessed ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"}`}
                          />
                          <span>CAPT-CAM-FEED-01</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer select-none transition-colors border border-slate-300"
                        >
                          <Camera size={14} />
                        </button>
                        <select
                          value={boardingStatus}
                          onChange={(e) => setBoardingStatus(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-300 text-[10px] uppercase font-bold tracking-wider rounded-xs focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        >
                          <option value="Boarded">Boarding</option>
                          <option value="Deboarded">Debarking</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Scan ID"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-xs text-xs font-bold font-mono tracking-wider focus:outline-hidden focus:border-slate-800 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handlePerformSimulatedScan}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer select-none transition-colors"
                        >
                          Verify Pass
                        </button>
                      </div>

                      {showScanner && (
                        <QRScannerModal
                          onScanSuccess={(code, location) => {
                            setScanInput(code);
                            setScanLocation(location || null);
                            setShowScanner(false);
                            // Auto-trigger verification after scan
                            setTimeout(
                              () => handlePerformSimulatedScan(code),
                              100,
                            );
                          }}
                          onClose={() => setShowScanner(false)}
                        />
                      )}

                      {scanError && (
                        <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xs border border-red-100 mb-4 font-sans uppercase">
                          ⚠️ {scanError}
                        </p>
                      )}

                      {/* QUICK REFERENCE SHORTLIST OF FORWARDED PASSES TO CLICK AND SIMULATE INSTANTLY */}
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <h5 className="text-[8.5px] font-black uppercase text-slate-500 tracking-widest mb-2">
                          Forwarded Vessel Passes Quick-Select:
                        </h5>
                        {activeCharters.length === 0 ? (
                          <p className="text-[9px] text-slate-400 italic">
                            No bookings currently active to simulate scan.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {activeCharters.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setScanInput(b.id || b.verifyBookingId || "");
                                  setScanError("");
                                }}
                                className="px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 text-[9px] font-semibold rounded-xs transition-colors hover:border-emerald-300 font-mono tracking-tight"
                              >
                                {b.id || "VOUCHER"} (
                                {b.clientName || b.customerName})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {scannedResult && scannedResult.type === "crew" && (
                      <div className="border border-emerald-200 rounded-sm bg-emerald-50 p-5 space-y-4 animate-fade-in shadow-xs text-center">
                        <div className="flex justify-center mb-3">
                          <div className="h-16 w-16 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center shadow-inner">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                          </div>
                        </div>
                        <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">
                          {scannedResult.title}
                        </h4>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          Boarding logged in Admin System
                        </p>
                      </div>
                    )}

                    {scannedResult && scannedResult.type !== "crew" && (
                      <div className="border border-slate-200 rounded-xs bg-white p-5 space-y-4 animate-fade-in shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="text-left font-sans">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 font-bold font-mono text-slate-800 uppercase rounded-sm border border-slate-200 mb-1 inline-block">
                              ID: {scannedResult.id || "GUEST"}
                            </span>
                            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wide mt-1">
                              Lead Charterer:{" "}
                              {scannedResult.clientName ||
                                scannedResult.customerName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {scannedResult.boardingStatus === "Boarded" ? (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xs border border-emerald-200 tracking-wider">
                                REGISTERED ON-BOARD
                              </span>
                            ) : scannedResult.boardingStatus === "Completed" ? (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xs border border-[#0F172A]/10 tracking-wider">
                                VOYAGE COMPLETED
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-xs border border-amber-200 tracking-wider">
                                PENDING PIER RECOGNITION
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PASSENGER TABLE WITHOUT PRICES */}
                        {renderBookingDetailSheet(scannedResult)}

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadCaptainReport(scannedResult)
                            }
                            className="px-4 py-2.5 border border-slate-300 text-slate-800 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" /> PDF Print
                            Captain's Book
                          </button>

                          {scannedResult.boardingStatus !== "Boarded" &&
                            scannedResult.boardingStatus !== "Completed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetBookingStatus(
                                    scannedResult.id,
                                    "Boarded",
                                  )
                                }
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Approve
                                Boarding Clearance
                              </button>
                            )}

                          {scannedResult.boardingStatus === "Boarded" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetBookingStatus(
                                  scannedResult.id,
                                  "Completed",
                                )
                              }
                              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Close &
                              Archive Charter
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentTab === "shift" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                        Vessel Shift & Fuel Ledger
                      </h3>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Register active operating logs, flight timelines, and
                        diesel consumption files for administrative audit
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Input Form */}
                      <form
                        onSubmit={handleSaveShiftLog}
                        className="lg:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-xs space-y-4 font-sans text-left"
                      >
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] border-b border-slate-200 pb-2 mb-2 flex items-center gap-1.5 select-none">
                          <Compass className="h-3.5 w-3.5 text-emerald-600" />{" "}
                          Log New Active Shift
                        </h4>

                        {/* Boarding Counter Indicator inside Shift Form */}
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xs flex items-center justify-between select-none">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-sm bg-emerald-600 text-white">
                              <UserCheck className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-[8px] font-bold text-emerald-800 uppercase tracking-widest font-sans">
                                Boardings On Duty
                              </span>
                              <span className="block text-[11px] font-extrabold text-emerald-950 font-sans">
                                {currentShiftBoardedCount} Successful Boarding
                                Scans
                              </span>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono font-bold text-emerald-750 uppercase bg-emerald-100/80 px-1.5 py-0.5 rounded-xs">
                            Active Sync
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              Shift Commencement Time
                            </label>
                            <input
                              type="datetime-local"
                              required
                              value={shiftLogStart}
                              onChange={(e) => setShiftLogStart(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              Shift Conclusion Time
                            </label>
                            <input
                              type="datetime-local"
                              required
                              value={shiftLogEnd}
                              onChange={(e) => setShiftLogEnd(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                                Fuel Consumed (Litres)
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                placeholder="e.g. 350"
                                value={shiftLogFuel}
                                onChange={(e) =>
                                  setShiftLogFuel(e.target.value)
                                }
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                                Engine Operating Hours
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 14.5"
                                value={shiftLogEngineHours}
                                onChange={(e) =>
                                  setShiftLogEngineHours(e.target.value)
                                }
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              Voyage/Operational Notes
                            </label>
                            <textarea
                              rows={2}
                              maxLength={300}
                              placeholder="Describe route, passengers count or maintenance events..."
                              value={shiftLogNotes}
                              onChange={(e) => setShiftLogNotes(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A] resize-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingShift}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 select-none font-mono"
                        >
                          {isSavingShift ? (
                            <span>Logging Shift state...</span>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Log Shift to Ledger
                            </>
                          )}
                        </button>
                      </form>

                      {/* Right: History List */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />{" "}
                            Administrative Voyage History
                          </h4>
                          <span className="text-[8.5px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 border border-slate-200 rounded-sm font-bold uppercase tracking-tight">
                            Vessel:{" "}
                            {CATAMARANS.find(
                              (c) => c.id === captainProfile?.yachtId,
                            )?.name ||
                              captainProfile?.yachtId ||
                              "Fleet Unit"}
                          </span>
                        </div>

                        {shiftLogs.length === 0 ? (
                          <div className="text-center p-8 border border-dashed border-slate-200 rounded-xs bg-white text-slate-400">
                            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                            <h5 className="text-[10px] font-bold uppercase text-slate-600">
                              No Shift Documents Logs
                            </h5>
                            <p className="text-[9px] mt-0.5">
                              Use the ledger form on the left to submit fuel and
                              duration timelines.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                            {shiftLogs.map((log) => {
                              const startD = log.startTime
                                ? new Date(log.startTime)
                                : null;
                              const endD = log.endTime
                                ? new Date(log.endTime)
                                : null;
                              let diffHours = "";
                              if (startD && endD) {
                                const diffMs =
                                  endD.getTime() - startD.getTime();
                                if (diffMs > 0) {
                                  const hrs = Math.floor(
                                    diffMs / (1000 * 60 * 60),
                                  );
                                  const mins = Math.floor(
                                    (diffMs % (1000 * 60 * 60)) / (1000 * 60),
                                  );
                                  diffHours = `${hrs}h ${mins}m`;
                                }
                              }

                              return (
                                <div
                                  key={log.id}
                                  className="bg-white border border-slate-200 p-3 rounded-xs font-sans text-left relative overflow-hidden group shadow-3xs"
                                >
                                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
                                  <div className="flex items-start justify-between gap-2 border-b border-dashed border-slate-100 pb-1.5 mb-2">
                                    <div>
                                      <h5 className="text-[10px] font-black text-slate-800 uppercase leading-tight">
                                        Capt.{" "}
                                        {log.captainName || "Fleet Officer"}
                                      </h5>
                                      <p className="text-[8px] text-slate-400 font-mono uppercase mt-0.5">
                                        Lic: {log.licenseNo || "Authorized"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[8px] font-mono text-slate-400">
                                        Log Date:{" "}
                                        {new Date(
                                          log.createdAt || Date.now(),
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2 border border-slate-100 rounded-sm mb-2">
                                    <div className="text-left select-none">
                                      <span className="block text-[7.5px] uppercase text-slate-400 font-extrabold tracking-wider">
                                        Start
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-700 tracking-tight block truncate">
                                        {startD
                                          ? startD.toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <div className="text-left select-none">
                                      <span className="block text-[7.5px] uppercase text-slate-400 font-extrabold tracking-wider">
                                        End
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-700 tracking-tight block truncate">
                                        {endD
                                          ? endD.toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <div className="text-left select-none">
                                      <span className="block text-[7.5px] uppercase text-slate-400 font-extrabold tracking-wider">
                                        Duration
                                      </span>
                                      <span className="text-[9px] font-bold text-emerald-600 tracking-tight block font-mono">
                                        {diffHours || "N/A"}
                                      </span>
                                    </div>
                                    <div className="text-right select-none">
                                      <span className="block text-[7.5px] uppercase text-slate-400 font-extrabold tracking-wider">
                                        Fuel Used
                                      </span>
                                      <span className="text-[9px] font-bold text-red-600 tracking-tight block font-mono">
                                        {log.fuelUsedLitres} L
                                      </span>
                                    </div>
                                  </div>

                                  {log.engineHoursString &&
                                    log.engineHoursString !== "0" && (
                                      <p className="text-[8.5px] text-slate-500 font-mono uppercase flex items-center gap-1 mb-1.5 select-none">
                                        <Settings className="h-3 w-3 text-slate-400" />{" "}
                                        ENGINE TIME REGISTERED:{" "}
                                        <span className="font-bold text-slate-700">
                                          {log.engineHoursString} hrs
                                        </span>
                                      </p>
                                    )}

                                  {log.notes && (
                                    <p className="text-[9px] text-slate-600 leading-normal bg-slate-50 p-1.5 rounded-xs border border-slate-100 font-medium">
                                      {log.notes}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-emerald-600" />{" "}
                          Today's Registered Crew ({todaysCrewLogs.length})
                        </h4>
                      </div>

                      {todaysCrewLogs.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-slate-200 rounded-xs bg-slate-50 text-slate-400">
                          <p className="text-[9px] uppercase tracking-widest font-bold">
                            No crew member scanned on board yet today.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                          {todaysCrewLogs.map((log) => (
                            <div
                              key={log.id}
                              className="bg-white border text-left border-slate-200 p-3 rounded-xs flex items-center gap-3"
                            >
                              <div className="bg-emerald-100 p-2 rounded-full">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {log.crewName}
                                </p>
                                <p className="text-[9px] uppercase text-emerald-600 tracking-wider font-bold">
                                  {log.role}
                                </p>
                                <p className="text-[8px] text-slate-400 mt-0.5">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentTab === "calendar" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                        Captain Schedule & Logs
                      </h3>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Visual overview of upcoming and past assigned excursions
                        for your vessel.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xs overflow-hidden">
                      {/* Grid Header */}
                      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day) => (
                            <div
                              key={day}
                              className="p-2 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest"
                            >
                              {day}
                            </div>
                          ),
                        )}
                      </div>

                      {/* Mock Calendar Grid */}
                      <div className="grid grid-cols-7">
                        {Array.from({ length: 35 }).map((_, i) => {
                          const dateObj = new Date();
                          const currentDayIdx = dateObj.getDay() || 7; // 1-7
                          dateObj.setDate(
                            dateObj.getDate() - currentDayIdx + 1 + i - 7,
                          ); // Start from previous week monday

                          const y = dateObj.getFullYear();
                          const m = String(dateObj.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const d = String(dateObj.getDate()).padStart(2, "0");
                          const formattedDate = `${y}-${m}-${d}`;

                          // Filter bookings for this day assigned to this captain's vessel
                          // For simplicity, showing all approved bookings that match this date and vessel
                          const dayBookings = bookings.filter(
                            (b) =>
                              b.charterDate === formattedDate &&
                              b.selectedYachtId === captainProfile?.yachtId &&
                              b.status === "Approved",
                          );

                          // Check if it's today
                          const isToday =
                            new Date().toISOString().split("T")[0] ===
                            formattedDate;

                          return (
                            <div
                              key={i}
                              className={`min-h-[90px] p-1.5 border-r border-t border-slate-200 relative group flex flex-col gap-1 transition-colors ${i % 7 === 6 ? "border-r-0" : ""} ${isToday ? "bg-emerald-50/30" : "bg-white hover:bg-slate-50"}`}
                            >
                              <span
                                className={`text-[9px] font-mono font-bold absolute top-1.5 right-1.5 ${isToday ? "text-emerald-600 bg-emerald-100 px-1 py-0 rounded-xs" : "text-slate-400"}`}
                              >
                                {d}
                              </span>

                              <div className="mt-4 flex flex-col gap-1 overflow-y-auto max-h-[70px]">
                                {dayBookings.slice(0, 3).map((b, idx) => (
                                  <div
                                    onClick={() => {
                                      setSelectedBooking(b);
                                      setCurrentTab("active");
                                    }}
                                    key={idx}
                                    className="bg-emerald-50 border shadow-3xs border-emerald-100 text-[8px] text-emerald-800 p-1 rounded-sm font-bold truncate cursor-pointer hover:bg-emerald-200 transition-colors"
                                    title={b.clientName}
                                  >
                                    ⛵ {b.clientName?.split(" ")[0]}
                                  </div>
                                ))}
                                {dayBookings.length > 3 && (
                                  <div className="text-[8px] text-slate-400 font-bold text-center mt-0.5">
                                    +{dayBookings.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {currentTab === "logs" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                          Vessel Boarding Records
                        </h3>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          Manifest registry for{" "}
                          {captainProfile?.yachtId || "assigned vessel"}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPersonalLogsModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Calendar className="h-3 w-3" />
                        My Logs & Calendar
                      </button>
                    </div>
                    <BoardingLogsView
                      captainYachtId={captainProfile?.yachtId}
                      hideMap={captainProfile?.role !== "Captain"}
                      crewIdFilter={
                        captainProfile?.role !== "Captain"
                          ? captainProfile?.uid
                          : undefined
                      }
                    />
                  </div>
                )}

                {currentTab === "profile" && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                        <User className="h-4 w-4 text-emerald-600 shrink-0" />{" "}
                        Profile & Command Settings
                      </h3>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Update your professional details, contact information,
                        and current driving vessel configuration instantly
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 p-5 rounded-xs space-y-4 font-sans">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] border-b border-slate-200 pb-2 mb-2 flex items-center gap-1.5 select-none">
                        <Settings className="h-3.5 w-3.5 text-emerald-600" />{" "}
                        Edit Staff Profile
                      </h4>

                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                            Staff Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              Contact Number / Phone
                            </label>
                            <input
                              type="tel"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                              placeholder="e.g. +66 81 234 5678"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              Email Address (Read-only)
                            </label>
                            <input
                              type="text"
                              disabled
                              value={captainProfile?.email || ""}
                              className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-sm text-xs text-slate-400 font-medium cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              WhatsApp Number
                            </label>
                            <input
                              type="tel"
                              value={profileWhatsapp}
                              onChange={(e) =>
                                setProfileWhatsapp(e.target.value)
                              }
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                              placeholder="e.g. +66 81 234 5678"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                              LINE ID
                            </label>
                            <input
                              type="text"
                              value={profileLineId}
                              onChange={(e) => setProfileLineId(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                              placeholder="e.g. line_id"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                            Current Role / Position
                          </label>
                          <select
                            value={profileRole}
                            onChange={(e) => setProfileRole(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                          >
                            <option value="Captain">Captain</option>
                            <option value="First Mate">First Mate</option>
                            <option value="Deckhand">Deckhand</option>
                            <option value="Stewardess">Stewardess</option>
                            <option value="Hostess">Hostess</option>
                            <option value="Chef">Chef</option>
                            <option value="Engineer">Engineer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">
                            Active Assigned Catamaran
                          </label>
                          <select
                            value={profileYachtId}
                            onChange={(e) => setProfileYachtId(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#0F172A]"
                          >
                            {CATAMARANS.map((vessel) => (
                              <option key={vessel.id} value={vessel.id}>
                                {vessel.name} ({vessel.length} • Max{" "}
                                {vessel.capacity} pax)
                              </option>
                            ))}
                          </select>
                          <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                            Important: Changing your active assigned vessel
                            instantly migrates your charter clearance feed and
                            shift controls to the specified catamaran template.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 select-none font-mono"
                        >
                          {isUpdatingProfile ? (
                            <span>Saving Changes...</span>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Save Profile Details
                            </>
                          )}
                        </button>
                      </form>

                      {/* Staff Boarding Pass QR Generator */}
                      <div className="border-t border-slate-200 mt-4 pt-4">
                        <CrewBoardingQrGenerator
                          captainProfile={captainProfile}
                          profileName={profileName}
                          profilePhone={profilePhone}
                          profileWhatsapp={profileWhatsapp}
                          profileLineId={profileLineId}
                          profileRole={captainProfile?.role || "Crew"}
                          cardGreeting={qrCardGreeting}
                          setCardGreeting={setQrCardGreeting}
                          cardDesign={qrCardDesign}
                          setCardDesign={setQrCardDesign}
                          cardTagline={qrCardTagline}
                          setCardTagline={setQrCardTagline}
                        />
                      </div>

                      {/* Agent Broker Dashboard Activation */}
                      <div className="border-t border-slate-200 pt-4 mt-4 bg-white p-4 rounded-sm shadow-2xs">
                        <div className="flex items-start justify-between">
                          <div className="text-left flex-1 border-r border-slate-100 pr-4 mr-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1">
                              Broker Workspace Access
                            </h5>
                            <p className="text-[9.5px] text-slate-500 leading-relaxed">
                              Activate an Agent profile linked to your
                              credentials to book charters, access referral
                              links, and earn commissions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleUpgradeToAgent}
                            className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-2 text-[9px] uppercase font-bold tracking-wider rounded-xs whitespace-nowrap self-center transition-colors"
                          >
                            Activate Broker Account
                          </button>
                        </div>
                      </div>

                      {/* Explicit Workspace Session Logout */}
                      <div className="border-t border-slate-200 pt-4 mt-4 text-center space-y-2">
                        <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
                          Finished with your shift? Sign out below to clear the
                          active device cache and lock the workspace terminal.
                        </p>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-250 hover:border-rose-300 text-rose-700 font-bold text-[9px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all select-none font-mono duration-150"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-600" /> Log
                          Out of Captain Desk
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete your staff account? You will be deactivated permanently from operational access pending admin audit.",
                              )
                            ) {
                              try {
                                let targetCollection = currentCaptainUser?.email
                                  ? "crewMembers"
                                  : "captains"; // rough fallback
                                if (
                                  captainProfile?.role === "Captain" ||
                                  captainProfile?.role === "Admin"
                                ) {
                                  targetCollection = "captains";
                                } else {
                                  targetCollection = "crewMembers";
                                }
                                await updateDoc(
                                  doc(
                                    db,
                                    targetCollection,
                                    currentCaptainUser!.uid,
                                  ),
                                  { isActive: false },
                                );
                                handleSignOut();
                              } catch (e) {
                                console.error(e);
                                alert(
                                  "Required admin elevation to fully process this operation.",
                                );
                              }
                            }
                          }}
                          className="w-full py-2 bg-red-800 hover:bg-red-900 border border-red-950 text-white font-bold text-[9px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all select-none duration-150"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL / SHEET PREVIEW OF SPECIFIC IN-LIST SELECTION */}
                {selectedBooking && (
                  <div className="border border-slate-300 rounded-xs bg-white p-5 space-y-4 animate-fade-in shadow-xs mt-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] bg-slate-100 border border-slate-200 font-bold font-mono px-2 py-0.5 rounded-sm block w-fit">
                          REF ID: {selectedBooking.id}
                        </span>
                        <h4 className="text-xs font-black uppercase text-[#0F172A] tracking-wider mt-1.5">
                          Charterer:{" "}
                          {selectedBooking.clientName ||
                            selectedBooking.customerName ||
                            "Representative Guest"}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(null)}
                        className="text-xs text-slate-400 hover:text-slate-800 underline font-semibold cursor-pointer"
                      >
                        Minimize Preview
                      </button>
                    </div>

                    {renderBookingDetailSheet(selectedBooking)}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadCaptainReport(selectedBooking)
                        }
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Printer className="h-3.5 w-3.5" /> PDF Captain's Book
                      </button>

                      {selectedBooking.boardingStatus !== "Boarded" &&
                        selectedBooking.boardingStatus !== "Completed" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleSetBookingStatus(
                                selectedBooking.id,
                                "Boarded",
                              )
                            }
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Log Guest
                            Boarded
                          </button>
                        )}

                      {selectedBooking.boardingStatus === "Boarded" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSetBookingStatus(
                              selectedBooking.id,
                              "Completed",
                            )
                          }
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Archive /
                          Close Charter
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showPersonalLogsModal && (
                  <CrewMemberCalendarModal
                    crewId={captainProfile.uid}
                    crewName={captainProfile.name}
                    logs={allPersonalCrewLogs}
                    onClose={() => setShowPersonalLogsModal(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Custom Toast Container */}
      <div className="fixed bottom-6 right-6 z-[6000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
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
                <h4 className="text-[10px] font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                  {toast.type === "success" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  {toast.title}
                </h4>
                <p className="text-[10px] text-slate-300 mt-1 leading-normal font-medium">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  // Render a nice compact, price-free card for listed bookings
  function renderBookingCard(b: any) {
    const isCompleted =
      b.boardingStatus === "Completed" ||
      b.boardingStatus === "Completed_Archived";
    const isBoarded = b.boardingStatus === "Boarded";

    return (
      <div
        key={b.id}
        onClick={() => {
          setSelectedBooking(b);
        }}
        className="p-4 bg-white border border-slate-200 rounded-sm hover:border-[#0F172A] hover:bg-slate-50 transition-all cursor-pointer text-left relative flex flex-col justify-between space-y-3"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold font-mono tracking-tight bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-xs">
              {b.id || "BOOKING"}
            </span>
            <span>
              {isCompleted ? (
                <span className="text-[8px] bg-slate-100 border border-[#0F172A]/10 text-[#0F172A] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                  Completed / Closed
                </span>
              ) : isBoarded ? (
                <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-sm animate-pulse">
                  On Board
                </span>
              ) : (
                <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-700 font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                  Active Excursion
                </span>
              )}
            </span>
          </div>

          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide mt-2">
            {b.clientName || b.customerName || "Direct Yacht Guest"}
          </h4>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">
                Excursion Date
              </span>
              <span className="font-extrabold text-slate-700 font-sans">
                {b.charterDate || "Scheduled Departure"}
              </span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-400 uppercase font-bold">
                Party Manifest
              </span>
              <span className="font-extrabold text-slate-700">
                {b.guestCount || b.passengers?.length || 1} Registered
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-slate-100 text-right">
          <span className="text-[9px] text-emerald-600 font-sans font-extrabold uppercase tracking-wider hover:underline flex items-center justify-end gap-1 select-none">
            Review Passenger Manifest <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  }

  // Render high-fidelity sheet with general details and manifest roster, STRICTLY REMOVING ALL PRICES DEFINITIONS
  function renderBookingDetailSheet(b: any) {
    const passengers = b.passengers || [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {/* Core Roster Log */}
        <div className="md:col-span-2 space-y-3">
          <div className="bg-slate-100 p-3 rounded-xs border border-slate-200">
            <h5 className="text-[9.5px] font-black uppercase text-[#0F172A] tracking-wider mb-2 flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Manifest
              Registry List ({passengers.length} Registered)
            </h5>

            {passengers.length === 0 ? (
              <div className="bg-white p-3 text-center border border-dashed border-slate-200 text-slate-400 text-[10px] rounded-xs font-medium">
                No custom manifest entries configured yet. Verification occurs
                at boarding terminal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11.5px] font-sans">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[8.5px] font-bold uppercase tracking-wider">
                      <th className="px-2 py-1.5 rounded-l-xs text-center">
                        No.
                      </th>
                      <th className="px-2.5 py-1.5">Legal Name</th>
                      <th className="px-2.5 py-1.5 text-center">Nationality</th>
                      <th className="px-2.5 py-1.5 text-center">Age</th>
                      <th className="px-2.5 py-1.5 rounded-r-xs font-mono text-center">
                        Passport No.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passengers.map((pax: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-2 py-2 font-mono text-center text-slate-400 font-medium text-[10px]">
                          {index + 1}
                        </td>
                        <td className="px-2.5 py-2 font-extrabold text-slate-800 uppercase text-[10.5px]">
                          {pax.name || "UNREGISTERED"}
                        </td>
                        <td className="px-2.5 py-2 text-center text-slate-600 uppercase text-[10px]">
                          {pax.nationality || "N/A"}
                        </td>
                        <td className="px-2.5 py-2 text-center text-slate-600 text-[10.5px]">
                          {pax.age ? `${pax.age} Y` : "N/A"}
                        </td>
                        <td className="px-2.5 py-2 text-center font-mono text-[10px] font-bold text-slate-800">
                          {pax.passport || "AT DOCK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Yacht Detail Coordinates Block */}
        <div className="space-y-3">
          <div className="bg-slate-100 p-3 rounded-xs border border-slate-200 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h5 className="text-[9.5px] font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-1 border-b border-slate-200 pb-1.5">
                <Compass className="h-3.5 w-3.5 text-emerald-600" /> Navigation
                Coordinates
              </h5>

              <div className="space-y-2 mt-2">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black font-sans">
                    Booked Yacht
                  </span>
                  <span className="text-[11px] font-extrabold text-[#0F172A] uppercase">
                    {CATAMARANS.find(
                      (v) => v.id === (b.vesselId1 || b.recommendedVesselId),
                    )?.name ||
                      b.vesselId1 ||
                      "Custom Vessel"}
                  </span>
                </div>

                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black font-sans">
                    Charter Date
                  </span>
                  <span className="text-[11.5px] font-extrabold text-slate-800 font-mono">
                    {b.charterDate || "Scheduled Excursion"}
                  </span>
                </div>

                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black font-sans">
                    Shore Transfer / Hotel
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 block max-h-[48px] overflow-y-auto leading-normal leading-relaxed">
                    {b.hotelPickupLocation ||
                      "No shuttle coordinates configured"}
                  </span>
                </div>

                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black font-sans">
                    Onboard Catering Choice
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 capitalize">
                    {b.selectedCateringTier ||
                      b.cateringOption ||
                      "Standard Marine Beverage Refreshments"}
                  </span>
                </div>

                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black font-sans">
                    Approved Cruising Route
                  </span>
                  <span className="text-[10.5px] font-semibold text-slate-600 max-h-[40px] overflow-y-auto block leading-tight">
                    {b.selectedRouteName ||
                      b.routeSelection ||
                      b.packageName ||
                      "Captain's Discretion Standard Tour"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-sm shadow-2xs">
                <p className="text-[9.5px] font-black uppercase text-[#0F172A] tracking-wider mb-2 text-center w-full">
                  Vessel Boarding QR Validation
                </p>
                <div className="bg-white p-2 rounded-sm border border-slate-200">
                  <QRCodeSVG value={`BK-${b.id}`} size={80} />
                  <p className="text-[8px] text-center mt-1 text-slate-400 font-mono tracking-tighter">
                    BK-{b.id ? b.id.substring(0, 6) : "SCAN"}
                  </p>
                </div>
                <p className="text-[8.5px] text-slate-500 text-center mt-2 leading-tight">
                  Captain can scan this voucher if guest physical copy is
                  unavailable.
                </p>
              </div>
            </div>

            <div className="mt-4 border border-emerald-100 bg-emerald-50 p-2 text-center rounded-xs">
              <span className="block text-[8px] text-emerald-800 uppercase font-extrabold tracking-wider">
                Security Clearances
              </span>
              <p className="text-[8.5px] text-emerald-700 mt-0.5 leading-tight font-medium">
                Pricing schedules are blanked on Port Captain manifest requests
                for high privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
