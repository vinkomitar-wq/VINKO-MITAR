import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { reverseGeocode } from "../utils/geocoding";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { CATAMARANS } from "../data";
import {
  generateCaptainManifestPdf,
  CaptainManifestPassenger,
  CaptainManifestCrew,
  CaptainManifestData,
} from "../lib/pdfGenerator";
import QRScannerModal from "./QRScannerModal";
import {
  X,
  Anchor,
  Users,
  UserCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Calendar,
  Key,
  Database,
  User,
  ArrowRightLeft,
  Ship,
  Sparkles,
  ArrowRight,
  FileText,
  QrCode,
} from "lucide-react";

interface VesselOperationsPortalProps {
  vesselId: string;
  onClose: () => void;
}

export default function VesselOperationsPortal({
  vesselId,
  onClose,
}: VesselOperationsPortalProps) {
  const vessel = CATAMARANS.find((v) => v.id === vesselId) || CATAMARANS[0];

  const [activeTab, setActiveTab] = useState<
    "passenger" | "crew" | "simulation"
  >("passenger");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Passenger boarding form states
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [manualPasscode, setManualPasscode] = useState("");
  const [passengerAction, setPassengerAction] = useState<
    "Boarded" | "Deboarded"
  >("Boarded");
  const [showPassengerScanner, setShowPassengerScanner] = useState(false);

  // Crew operation form states
  const [crewName, setCrewName] = useState("");
  const [crewRole, setCrewRole] = useState("Captain");
  const [crewAction, setCrewAction] = useState<"Boarded" | "Deboarded">(
    "Boarded",
  );
  const [showCrewScanner, setShowCrewScanner] = useState(false);
  const [hasSavedCrewProfile, setHasSavedCrewProfile] = useState(false);

  // Simulation states
  const [simPassengers, setSimPassengers] = useState(24);
  const [isSimulating, setIsSimulating] = useState(false);

  // Feedbacks
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Sound Synthesizer Chime
  const playPortalChime = (isSuccess: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      if (isSuccess) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } else {
        osc.frequency.setValueAtTime(220.0, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.warn("Audio play blocked by browser sandbox", e);
    }
  };

  // Load bookings for this catamaran
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const q = query(collection(db, "proposals"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docRef) => {
        const data = docRef.id
          ? { id: docRef.id, ...docRef.data() }
          : docRef.data();
        // Check if the booking matches this vesselId
        const matchVessel =
          data.vesselId1 === vesselId ||
          data.recommendedVesselId === vesselId ||
          data.vesselId === vesselId;
        if (matchVessel) {
          list.push(data);
        }
      });
      setBookings(list);
    } catch (e) {
      console.error("Failed loading vessel active bookings", e);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load recent logs
  const loadRecentLogs = async () => {
    try {
      const q = query(
        collection(db, "crewLogs"),
        where("yachtId", "==", vesselId),
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setRecentLogs(list); // take all for crew manifest calculation
    } catch (e) {
      console.warn("Skipped loading logs:", e);
    }
  };

  useEffect(() => {
    loadBookings();
    loadRecentLogs();
  }, [vesselId]);

  useEffect(() => {
    const savedName = localStorage.getItem("phuket_yacht_crew_name");
    const savedRole = localStorage.getItem("phuket_yacht_crew_role");
    if (savedName) {
      setCrewName(savedName);
      if (savedRole) setCrewRole(savedRole);
      setHasSavedCrewProfile(true);
    }
  }, []);

  const handleGeneratePdf = () => {
    // Find all loaded boarded bookings
    const boardedBookings = bookings.filter(
      (b) => b.boardingStatus === "Boarded",
    );
    let allPassengers: CaptainManifestPassenger[] = [];

    boardedBookings.forEach((b) => {
      if (b.passengers && b.passengers.length > 0) {
        allPassengers = allPassengers.concat(b.passengers);
      } else {
        // fallback
        allPassengers.push({
          name: (b.clientName || "Charter Guest").toString(),
        });
      }
    });

    // Calculate active boarded crew from logs
    // The `recentLogs` array is sorted newest to oldest. We want the latest action for each crewId.
    const activeCrewMap = new Map<string, CaptainManifestCrew | null>();
    recentLogs
      .filter((L) => L.role !== "Passenger")
      .forEach((log) => {
        if (!activeCrewMap.has(log.crewId)) {
          if (log.status === "Boarded") {
            activeCrewMap.set(log.crewId, {
              name: log.crewName,
              role: log.role,
              timestamp: log.timestamp,
            });
          } else {
            // if the newest log is Deboarded, we mark them as processed but inactive
            activeCrewMap.set(log.crewId, null);
          }
        }
      });

    const activeCrew = Array.from(activeCrewMap.values()).filter(
      (c) => c !== null,
    ) as CaptainManifestCrew[];

    const manifestData: CaptainManifestData = {
      id:
        boardedBookings.length > 0
          ? boardedBookings.map((b) => b.id).join(", ")
          : "NO_BOARDED_BOOKING",
      clientName:
        boardedBookings.length > 0
          ? (boardedBookings[0].clientName || "Vessel Voyage").toString()
          : "Vessel Voyage",
      charterDate: new Date().toLocaleDateString(),
      vesselName: vessel.name,
      passengers: allPassengers.length > 0 ? allPassengers : undefined,
      crew: activeCrew.length > 0 ? activeCrew : undefined,
      boardingStatus:
        boardedBookings.length > 0 ? "Boarded" : "NO_BOARDED_PASSENGERS",
    };

    try {
      const docObj = generateCaptainManifestPdf(manifestData);
      docObj.save(`Vessel_Manifest_${vessel.name.replace(/\s+/g, "_")}.pdf`);
      playPortalChime(true);
      setStatusMessage({
        type: "success",
        text: "Generated PDF Manifest Document successfully!",
      });
    } catch (err) {
      console.error("PDF Gen error:", err);
      playPortalChime(false);
      setStatusMessage({
        type: "error",
        text: "PDF generation failed. Check errors.",
      });
    }
  };

  const getGPSCoords = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });
  };

  // Handle passenger boarding submission
  const handlePassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    let matchBooking = null;

    if (selectedBookingId) {
      matchBooking = bookings.find((b) => b.id === selectedBookingId);
    } else if (manualPasscode.trim()) {
      matchBooking = bookings.find(
        (b) =>
          b.id?.toLowerCase().trim() === manualPasscode.toLowerCase().trim() ||
          b.verifyBookingId?.toLowerCase().trim() ===
            manualPasscode.toLowerCase().trim(),
      );
    }

    if (!matchBooking) {
      playPortalChime(false);
      setStatusMessage({
        type: "error",
        text: "Could not find a valid charter reservation for this vessel matching that reference passcode.",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const gpsLocation = await getGPSCoords();
      const resolvedAddress = gpsLocation
        ? await reverseGeocode(gpsLocation)
        : undefined;
      const updatedData = {
        boardingStatus: passengerAction,
        boardedAt:
          passengerAction === "Boarded"
            ? timestamp
            : matchBooking.boardedAt || null,
        deboardedAt:
          passengerAction === "Deboarded"
            ? timestamp
            : matchBooking.deboardedAt || null,
      };

      await updateDoc(doc(db, "proposals", matchBooking.id), updatedData);

      // Mirror to crew logs for general manifest audit trail
      const auditLogId = `passenger-${Date.now()}`;
      await setDoc(doc(db, "crewLogs", auditLogId), {
        id: auditLogId,
        crewId: `PASSENGER-${matchBooking.id}`,
        crewName: matchBooking.clientName || "Charter Guest",
        role: "Passenger",
        status: passengerAction,
        timestamp: timestamp,
        yachtId: vesselId,
        location: gpsLocation || undefined,
        locationName: resolvedAddress || undefined,
        notes: `Passenger verified voucher ${matchBooking.id} and recorded '${passengerAction}' action.`,
      });

      playPortalChime(true);
      setStatusMessage({
        type: "success",
        text: `Successfully ${passengerAction === "Boarded" ? "EMBARKED" : "DISEMBARKED"} Lead Passenger: '${matchBooking.clientName || "Guest"}'! Vessel manifest updated.`,
      });

      // Clear input and reload
      setManualPasscode("");
      setSelectedBookingId("");
      loadBookings();
      loadRecentLogs();
    } catch (err) {
      console.error(err);
      playPortalChime(false);
      setStatusMessage({
        type: "error",
        text: "System communication fault. Verification aborted.",
      });
    }
  };

  const handleSimulation = async () => {
    setIsSimulating(true);
    setStatusMessage(null);
    try {
      // 1. Get all crew
      const cSnap = await getDocs(collection(db, "crewMembers"));
      const allCrew = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

      const capSnap = await getDocs(collection(db, "captains"));
      const allCaps = capSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as any,
      );

      const combinedCrew = [...allCrew, ...allCaps];

      if (combinedCrew.length === 0) {
        playPortalChime(false);
        setStatusMessage({
          type: "error",
          text: "No crew members registered. Please register some crew members first.",
        });
        setIsSimulating(false);
        return;
      }

      // 2. Create mock proposal for N passengers
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockPassengers = [];
      for (let i = 1; i <= simPassengers; i++) {
        mockPassengers.push({
          name: `Imaginary Guest ${i}`,
          age: Math.floor(Math.random() * 50) + 18,
          passport: `PASS${Math.floor(Math.random() * 1000000)}`,
        });
      }

      const mockProposalId = `SIM-${Date.now()}`;
      await setDoc(doc(db, "proposals", mockProposalId), {
        id: mockProposalId,
        clientName: "Simulation Lead Guest",
        vesselId1: vesselId,
        charterDate: tomorrow.toISOString().split("T")[0],
        passengers: mockPassengers,
        guestCount: simPassengers,
        boardingStatus: "Boarded",
        boardedAt: new Date().toISOString(),
      });

      // 3. Log passengers boarding
      const pLogId = `passenger-${Date.now()}`;
      await setDoc(doc(db, "crewLogs", pLogId), {
        id: pLogId,
        crewId: `PASSENGER-${mockProposalId}`,
        crewName: `Simulation Lead Guest (+${simPassengers - 1} pax)`,
        role: "Passenger",
        status: "Boarded",
        timestamp: new Date().toISOString(),
        yachtId: vesselId,
        notes: `Simulated boarding of ${simPassengers} imaginary customers.`,
      });

      // 4. Log all crew boarding
      for (const c of combinedCrew) {
        const logId = `crew-${Date.now()}-${c.id}`;
        await setDoc(doc(db, "crewLogs", logId), {
          id: logId,
          crewId: c.id,
          crewName: c.name,
          role: c.role || "Crew",
          status: "Boarded",
          timestamp: new Date().toISOString(),
          yachtId: vesselId,
          notes: "Simulated complete crew sign-in",
        });

        // Update their assigned ship to this specific vessel
        try {
          // We need to know if they belong to "captains" or "crewMembers"
          // In simulation we fetch them all so we try both depending if they have role 'Captain'
          let isCaptain = c.role === "Captain" || c.role === "Kapetan";
          const refCol = isCaptain ? "captains" : "crewMembers";
          await updateDoc(doc(db, refCol, c.id), { shipId: vesselId });
        } catch (e) {
          /* ignore error on simulation */
        }
      }

      playPortalChime(true);
      setStatusMessage({
        type: "success",
        text: `Simulation Complete! ${simPassengers} guests and ${combinedCrew.length} crew boarded.`,
      });

      // Clear data inside to fetch again
      loadBookings();
      loadRecentLogs();
    } catch (e) {
      console.error(e);
      playPortalChime(false);
      setStatusMessage({ type: "error", text: "Failed to run simulation." });
    }
    setIsSimulating(false);
  };

  const generateCanvasFingerprint = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 50;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("no-can-" + navigator.userAgent.length);
            return;
          }
          ctx.textBaseline = "top";
          ctx.font = "14px 'Arial'";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "#f60";
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = "#069";
          ctx.fillText("Phuket Yacht Charters", 2, 15);
          ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
          ctx.fillText("Deep Security Print", 4, 30);

          const dataURL = canvas.toDataURL();
          let hash = 0;
          for (let i = 0; i < dataURL.length; i++) {
            const char = dataURL.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
          }

          // Also hash user agent briefly to combine them
          let uaHash = 0;
          const ua = navigator.userAgent;
          for (let i = 0; i < ua.length; i++) {
            const char = ua.charCodeAt(i);
            uaHash = (uaHash << 5) - uaHash + char;
            uaHash = uaHash & uaHash;
          }

          resolve(
            `CANVAS-${Math.abs(hash).toString(16)}-UA-${Math.abs(uaHash).toString(16)}`,
          );
        } catch (e) {
          resolve("err-canvas-" + Date.now());
        }
      }, 0);
    });
  };

  const getDeviceId = async () => {
    let id = localStorage.getItem("phuket_yacht_device_id");
    if (!id || !id.startsWith("DEV-CF-")) {
      const cf = await generateCanvasFingerprint();
      const randomPart = Math.random().toString(36).substring(2, 8);
      id = "DEV-CF-" + cf + "-" + randomPart;
      localStorage.setItem("phuket_yacht_device_id", id);
    }
    return id;
  };

  // Handle crew sign in/of submission
  const submitCrewBoarding = async (
    vesselId: string,
    action: "Boarded" | "Deboarded",
  ) => {
    if (!crewName.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please provide your Crew Member Name.",
      });
      return;
    }

    setStatusMessage(null);

    // 1. High-accuracy GPS, no cached fix.
    const pos: GeolocationPosition | null = await new Promise((resolve) =>
      navigator.geolocation.getCurrentPosition(
        resolve,
        () => resolve(null as any),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      ),
    );
    if (!pos) {
      setStatusMessage({
        type: "error",
        text: "Enable location to sign in/out. Boarding needs your position.",
      });
      return;
    }

    try {
      const deviceId = await getDeviceId();
      const timestamp = new Date().toISOString();
      const resolvedAddress = await reverseGeocode({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      const auditLogId = `crew-${deviceId}-${Date.now()}`;
      await setDoc(doc(db, "crewLogs", auditLogId), {
        id: auditLogId,
        crewId: deviceId, // Identify using device ID
        crewName: crewName,
        role: crewRole,
        status: action,
        timestamp: timestamp,
        yachtId: vesselId,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        locationName: resolvedAddress || undefined,
        notes: `Device ${deviceId} recorded '${action}' action.`,
      });

      // Upsert crew profile into crewMembers so they show up in Admin Workspace Crew Registry
      if (crewRole !== "Passenger") {
        try {
          const crewDocRef = doc(db, "crewMembers", deviceId);
          await setDoc(
            crewDocRef,
            {
              id: deviceId,
              uid: deviceId,
              name: crewName,
              role: crewRole,
              shipId: vesselId,
              isActive: true,
              lastActive: timestamp,
            },
            { merge: true },
          );
        } catch (e) {
          console.warn("Failed to register crew profile globally", e);
        }
      }

      // Save to local storage for future seamless use
      localStorage.setItem("phuket_yacht_crew_name", crewName);
      localStorage.setItem("phuket_yacht_crew_role", crewRole);
      setHasSavedCrewProfile(true);

      playPortalChime(true);
      setStatusMessage({
        type: "success",
        text: `Signed ${action === "Boarded" ? "IN / ON DUTY" : "OUT / COMPLETED"} successfully!`,
      });
      loadRecentLogs();
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: "Network error — boarding not logged.",
      });
    }
  };

  return (
    <div
      id="vessel-ops-portal-backdrop"
      className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="vessel-ops-portal"
        className="w-full max-w-4xl bg-slate-900 border border-[#0f543e] rounded-lg shadow-2xl relative overflow-hidden flex flex-col md:flex-row my-auto"
      >
        {/* Left Side: Vessel Brand & Header */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#092219] to-slate-950 p-6 border-r border-[#0f543e]/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] tracking-widest font-mono rounded-lg uppercase">
                Active Vessel Web Terminal
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-serif text-amber-500 tracking-wider uppercase font-semibold">
                Phuket Charters
              </h2>
              <h3 className="text-xl font-sans text-white tracking-widest uppercase font-black flex items-center gap-1.5">
                <Ship className="h-5 w-5 text-emerald-500" />{" "}
                <span>{vessel.name}</span>
              </h3>
              <p className="text-emerald-500/60 text-[9px] tracking-[0.2em] uppercase font-bold pt-1">
                Authorized Ship Boarding System
              </p>

              <button
                onClick={handleGeneratePdf}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-emerald-900/40 hover:bg-emerald-800 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] uppercase tracking-wider rounded transition-colors"
                title="Generate Official Manifest PDF with active Passengers & Crew"
              >
                <FileText className="h-4 w-4" />
                Download PDF Manifest
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {vessel.image && (
              <img
                src={vessel.image}
                alt={vessel.name}
                className="w-full h-36 object-cover rounded border border-emerald-500/10 grayscale hover:grayscale-0 transition-all duration-500"
              />
            )}

            <div className="bg-slate-950/70 p-3 rounded-lg border border-[#0f543e]/20 space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-[#E58c40] flex items-center gap-1.5">
                <Database className="h-3 w-3" />{" "}
                <span>Vessel Operations Rules</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                <span>
                  Scanning the vessel's official printed plaque provides direct
                  crew sign-in/out and passenger boarding control.
                </span>
              </p>
              <p className="text-[9px] text-emerald-500/80 font-mono">
                <span>Port: 3000 • Ingress: Secure HTTPS</span>
              </p>
            </div>
          </div>

          <p className="text-[8px] text-slate-500 font-mono uppercase mt-6">
            <span>Phuket Amazing Yacht Charter © 2026</span>
          </p>
        </div>

        {/* Right Side: Interactive Forms */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-6">
          <button
            id="vessel-ops-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800">
              <button
                id="tab-passenger"
                onClick={() => {
                  setActiveTab("passenger");
                  setStatusMessage(null);
                }}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "passenger" ? "border-emerald-500 text-emerald-400 bg-emerald-950/20" : "border-transparent text-slate-400 hover:text-slate-300"}`}
              >
                <Users className="w-4 h-4" /> <span>Guest Embarkation</span>
              </button>
              <button
                id="tab-crew"
                onClick={() => {
                  setActiveTab("crew");
                  setStatusMessage(null);
                }}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "crew" ? "border-emerald-500 text-emerald-400 bg-emerald-950/20" : "border-transparent text-slate-400 hover:text-slate-300"}`}
              >
                <Anchor className="w-4 h-4" />{" "}
                <span>Crew Shift Log (Sign In/Off)</span>
              </button>
            </div>

            {/* Status Feedback Message */}
            {statusMessage && (
              <div
                id="status-feedback-msg"
                className={`flex gap-3 p-3.5 rounded border text-xs leading-relaxed font-sans ${statusMessage.type === "success" ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400" : "bg-red-950/30 border-red-500/40 text-red-400"}`}
              >
                <div className="shrink-0 mt-0.5">
                  {statusMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <p>
                  <span>{statusMessage.text}</span>
                </p>
              </div>
            )}

            {/* Content: Passenger Tab */}
            {activeTab === "passenger" && (
              <form
                id="passenger-boarding-form"
                onSubmit={handlePassengerSubmit}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Select Checked-in Yacht Charter Booking</span>
                  </label>
                  {loadingBookings ? (
                    <p className="text-[10px] text-slate-500 font-mono animate-pulse">
                      <span>Loading verified vessel manifests...</span>
                    </p>
                  ) : bookings.length === 0 ? (
                    <p className="text-[10px] text-amber-500/80 bg-amber-950/10 p-2.5 rounded-sm border border-amber-600/20">
                      <span>
                        No active bookings found for this specific vessel. Use
                        the passcode lookup input below to type any booking ID
                        manually.
                      </span>
                    </p>
                  ) : (
                    <select
                      id="select-booking-manifest"
                      value={selectedBookingId}
                      onChange={(e) => {
                        setSelectedBookingId(e.target.value);
                        setManualPasscode("");
                      }}
                      className="w-full bg-[#061219] text-xs font-bold text-slate-200 border border-slate-700 py-3 px-4 rounded focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">
                        -- Choose active booking passenger --
                      </option>
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.clientName || b.customerName || "Charter Guest"} (
                          {b.charterDate || "TBA"}) - Status:{" "}
                          {b.boardingStatus || "Pending"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  <div className="h-[1px] bg-slate-800 flex-1"></div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                    or enter manual voucher passcode
                  </span>
                  <div className="h-[1px] bg-slate-800 flex-1"></div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Voucher ID / Passcode</span>
                  </label>
                  <input
                    id="input-manual-passcode"
                    type="text"
                    placeholder="e.g. b_231908 or verifyBoardingId"
                    value={manualPasscode}
                    onChange={(e) => {
                      setManualPasscode(e.target.value);
                      setSelectedBookingId("");
                    }}
                    className="w-full bg-[#061219] text-xs font-mono font-bold text-slate-200 border border-slate-700 py-3 px-4 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-4 items-center pt-2 pb-1">
                  <div className="h-[1px] bg-slate-800 flex-1"></div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                    or use quick scan
                  </span>
                  <div className="h-[1px] bg-slate-800 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassengerScanner(true)}
                  className="w-full bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 py-3 font-bold uppercase tracking-wider text-[11px] rounded transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Scan Boarding QR
                </button>

                <div className="space-y-2 pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Select Boarding Movement</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-select-board"
                      type="button"
                      onClick={() => setPassengerAction("Boarded")}
                      className={`py-3.5 px-4 rounded border text-center transition-all flex items-center justify-center gap-2 ${passengerAction === "Boarded" ? "bg-emerald-950/30 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"}`}
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />{" "}
                      <span>Guest Embarking (Board Ship)</span>
                    </button>
                    <button
                      id="btn-select-deboard"
                      type="button"
                      onClick={() => setPassengerAction("Deboarded")}
                      className={`py-3.5 px-4 rounded border text-center transition-all flex items-center justify-center gap-2 ${passengerAction === "Deboarded" ? "bg-amber-950/30 border-amber-600 text-amber-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"}`}
                    >
                      <ArrowRightLeft className="w-4 h-4 text-amber-500" />{" "}
                      <span>Guest Disembarking (Leave Ship)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    id="btn-submit-passenger-manifest"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 font-bold uppercase tracking-wider text-xs rounded transition-all active:scale-[99]"
                  >
                    <span>Confirm Passenger Boarding Status</span>
                  </button>
                </div>
              </form>
            )}

            {/* Content: Crew Tab */}
            {activeTab === "crew" && (
              <form
                id="crew-sign-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCrewBoarding(vesselId, crewAction);
                }}
                className="space-y-4 pt-2"
              >
                {hasSavedCrewProfile ? (
                  <div className="bg-slate-900 border border-emerald-900/50 p-4 rounded-lg mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Signed in as
                      </p>
                      <p className="font-bold text-white text-sm">{crewName}</p>
                      <p className="text-emerald-500 text-xs font-semibold">
                        {crewRole}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Crew Member Name</span>
                      </label>
                      <input
                        id="input-crew-name"
                        type="text"
                        placeholder="e.g. Captain Vinko Mitar / Crew member"
                        value={crewName}
                        onChange={(e) => setCrewName(e.target.value)}
                        className="w-full bg-[#061219] text-xs font-bold text-slate-200 border border-slate-700 py-3 px-4 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Duty Role</span>
                      </label>
                      <select
                        id="select-crew-role"
                        value={crewRole}
                        onChange={(e) => setCrewRole(e.target.value)}
                        className="w-full bg-[#061219] text-xs font-bold text-slate-200 border border-slate-700 py-3 px-4 rounded focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Captain">Yacht Captain</option>
                        <option value="First Mate">First Mate</option>
                        <option value="Deckhand">Professional Deckhand</option>
                        <option value="Chef">Yacht Chef</option>
                        <option value="Hostess">
                          Service Hostess / Stewardess
                        </option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Select Duty Shift Action</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-crew-shift-in"
                      type="button"
                      onClick={() => setCrewAction("Boarded")}
                      className={`py-3.5 px-4 rounded border text-center transition-all flex items-center justify-center gap-2 ${crewAction === "Boarded" ? "bg-emerald-950/30 border-emerald-500 text-emerald-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />{" "}
                      <span>Sign In / On Duty</span>
                    </button>
                    <button
                      id="btn-crew-shift-out"
                      type="button"
                      onClick={() => setCrewAction("Deboarded")}
                      className={`py-3.5 px-4 rounded border text-center transition-all flex items-center justify-center gap-2 ${crewAction === "Deboarded" ? "bg-amber-950/30 border-amber-600 text-amber-400 font-bold" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300"}`}
                    >
                      <Clock className="w-4 h-4 text-amber-500" />{" "}
                      <span>Sign Off / Completed Duty</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    id="btn-submit-crew-shift"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 font-bold uppercase tracking-wider text-xs rounded transition-all active:scale-[99]"
                  >
                    <span>Submit Crew Shift Log / Sign In-Out</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showPassengerScanner && (
        <QRScannerModal
          onClose={() => setShowPassengerScanner(false)}
          onScanSuccess={(decodedText) => {
            setShowPassengerScanner(false);
            let code = decodedText;
            if (code.startsWith("BK-")) code = code.substring(3);
            setManualPasscode(code);
            setSelectedBookingId("");
          }}
        />
      )}

      {showCrewScanner && (
        <QRScannerModal
          onClose={() => setShowCrewScanner(false)}
          onScanSuccess={(decodedText) => {
            setShowCrewScanner(false);
            try {
              const data = JSON.parse(decodedText);
              if (data.type === "crew" || data.type === "agent") {
                setCrewName(data.name || "");
                setCrewRole(data.role || "Crew");
                playPortalChime(true);
              } else {
                setStatusMessage({
                  type: "error",
                  text: "Invalid Crew QR Code.",
                });
                playPortalChime(false);
              }
            } catch (e) {
              setStatusMessage({
                type: "error",
                text: "Failed to read QR Code.",
              });
              playPortalChime(false);
            }
          }}
        />
      )}
    </div>
  );
}
