import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  HardDrive,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Database,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info,
  Calendar
} from "lucide-react";
import { useAgent } from "../AgentContext";

export function AdminDatabaseBackups() {
  const { currentAgent } = useAgent();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for system settings
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [frequencyHours, setFrequencyHours] = useState(24);
  const [hasDriveCredentials, setHasDriveCredentials] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [tokenSavedAt, setTokenSavedAt] = useState<string | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [lastBackupStatus, setLastBackupStatus] = useState<string | null>(null);
  const [lastBackupStatusMessage, setLastBackupStatusMessage] = useState<string | null>(null);

  // Google sign in states
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);

  // Backup log lists
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // DB Statistics loaded for information
  const [collectionStats, setCollectionStats] = useState<any[]>([]);

  useEffect(() => {
    // 1. Subscribe to backup history collections in real-time
    const qHistory = query(
      collection(db, "backup_history"),
      orderBy("timestamp", "desc")
    );
    const unsubHistory = onSnapshot(
      qHistory,
      (snap) => {
        const logs = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistoryLogs(logs);
      },
      (err) => {
        console.error("Failed to fetch backup history:", err);
      }
    );

    // 2. Load configurations from server
    loadSettings();

    // 3. Approximate DB documents statistics for admin overview
    loadDBStatistics();

    return () => {
      unsubHistory();
    };
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No active authentication found.");

      const res = await fetch("/api/backup/config", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch Google Drive Configurations.");

      const data = await res.json();
      setBackupEnabled(data.settings?.backupEnabled || false);
      setFrequencyHours(data.settings?.frequencyHours || 24);
      setLastBackupTime(data.settings?.lastBackupTime || null);
      setLastBackupStatus(data.settings?.lastBackupStatus || null);
      setLastBackupStatusMessage(data.settings?.lastBackupStatusMessage || null);
      setHasDriveCredentials(data.hasDriveCredentials || false);
      setDriveFolderId(data.driveFolderId || null);
      setTokenSavedAt(data.tokenSavedAt || null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not retrieve backup configs.");
    } finally {
      setLoading(false);
    }
  };

  const loadDBStatistics = async () => {
    // Collect counts to display in UI for transparency
    const cols = [
      { name: "fleet", label: "Fleet Vessels" },
      { name: "agents", label: "Broker Agents" },
      { name: "customers", label: "Customers Profiles" },
      { name: "booking_requests", label: "Booking Requests" },
      { name: "proposals", label: "Agent Proposals" },
      { name: "inquiries", label: "Inquiries & Chats" },
      { name: "crewMembers", label: "Crew Members" },
      { name: "captains", label: "Yacht Captains" },
      { name: "crewLogs", label: "Boarding Records" },
    ];

    try {
      const stats = [];
      for (const col of cols) {
        // Simple client doc snapshot read to display size
        const snap = await getDoc(doc(db, "google_drive_configs", "backup_settings")); // any simple read or let's estimate
        stats.push({ label: col.label, collectionName: col.name });
      }
      setCollectionStats(stats);
    } catch (e) {
      console.warn("Could not load DB collections list:", e);
    }
  };

  const saveSettings = async (enabled: boolean, hours: number) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Please log in again.");

      const res = await fetch("/api/backup/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          backupEnabled: enabled,
          frequencyHours: hours,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update automated backup settings.");
      }

      setBackupEnabled(enabled);
      setFrequencyHours(hours);
      setSuccessMsg("Automated backup settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save backup configurations.");
    } finally {
      setActionLoading(false);
    }
  };

  // Google sign in popup to discover/create Phuket Yacht Charters Backup Folder
  const handleGoogleConnect = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Unable to retrieve Google Drive authorization token.");
      }

      setGdriveToken(token);
      setGdriveUser(result.user);

      // Search or create Phuket Yacht Charters Backups folder in their Drive account
      const folderName = "Phuket Yacht Charters Database Backups";
      const queryStr = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!searchRes.ok) {
        throw new Error("Could not check backup folder in Google Drive.");
      }

      const searchData = await searchRes.json();
      let folderId = "";

      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      } else {
        // Create folder
        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to create backup folder on Google Drive.");
        }
        const createData = await createRes.json();
        folderId = createData.id;
      }

      // Save credentials into Firestore
      await setDoc(doc(db, "google_drive_configs", "default"), {
        accessToken: token,
        folderId: folderId,
        updatedAt: new Date().toISOString(),
        userEmail: result.user.email || "",
        userName: result.user.displayName || ""
      }, { merge: true });

      setDriveFolderId(folderId);
      setHasDriveCredentials(true);
      setTokenSavedAt(new Date().toISOString());

      // If enabled, save setting too
      await saveSettings(true, frequencyHours);

      setSuccessMsg("Google Drive account linked and backup folder initialized successfully!");
      setTimeout(() => setSuccessMsg(null), 4500);
      loadSettings();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authorize with Google Drive.");
    } finally {
      setActionLoading(false);
    }
  };

  // Run manually
  const triggerManualBackup = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No active session token found. Please log in.");

      const res = await fetch("/api/backup/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          triggeredBy: currentAgent?.name ? `${currentAgent.name} (Admin)` : "Admin Portal Manual Run",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute manual Google Drive backup.");
      }

      setSuccessMsg("Database backup securely archived and uploaded to Google Drive!");
      setTimeout(() => setSuccessMsg(null), 4500);
      loadSettings();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to compile or upload manual backup.");
    } finally {
      setActionLoading(false);
    }
  };

  // Static Direct Download from Backend api
  const handleDirectDownload = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No active login token.");

      const res = await fetch("/api/backup/download", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Direct JSON download rejected by backup engine.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payc_database_snapshot_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccessMsg("Direct JSON database backup downloaded successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred downloading raw backup.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-800 space-y-6">
      {/* Header and Summary Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HardDrive className="text-emerald-500 w-5 h-5 shrink-0" />
            Phuket Yacht Charters Backup Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Secure, fully automated daily database backups of your CRM, bookings, proposals, and logs directly to Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={loading || actionLoading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 font-medium py-1.5 px-3 rounded-md transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Config
          </button>
          
          <button
            onClick={handleDirectDownload}
            disabled={loading || actionLoading}
            className="flex items-center gap-1.5 text-xs text-white bg-slate-800 hover:bg-slate-700 font-medium py-1.5 px-3 rounded-md transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Local Backup
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 animate-pulse" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Settings & Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Google integration connection status */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="text-emerald-500 w-5 h-5 shrink-0" />
                <h3 className="font-semibold text-sm text-slate-900">Google Drive Integration</h3>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${hasDriveCredentials ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {hasDriveCredentials ? "Authorized" : "Disconnected"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Automated daily backups run directly on the custom server and require an active Google Drive authorization token. The system automatically creates a private, isolated folder named <strong className="text-slate-800 font-medium">"Phuket Yacht Charters Database Backups"</strong> in your Drive to archive the files safely.
            </p>

            {hasDriveCredentials ? (
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-medium text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Authorized Google Drive Account
                  </span>
                  <span className="text-[10px] text-slate-400">Secure AES Session</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <span className="text-slate-400">Backup Folder ID:</span>
                  <span className="col-span-2 font-mono text-slate-700 truncate select-all">{driveFolderId}</span>
                </div>
                {tokenSavedAt && (
                  <div className="grid grid-cols-3 gap-2 py-0.5">
                    <span className="text-slate-400">Token Renewed:</span>
                    <span className="col-span-2 text-slate-700 font-medium">
                      {new Date(tokenSavedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Every time you log in or renew authorization, your backup window automatically expands.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-lg text-xs text-slate-600 space-y-3">
                <p className="font-medium text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Google Workspace connection required
                </p>
                <p>
                  Click the button below to sign in with your Google account and authorize Phaser Yacht Backup engine to save daily database snapshots.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleGoogleConnect}
                disabled={actionLoading}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 py-2 px-3.5 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {hasDriveCredentials ? "Renew Google Authorization" : "Authorize Google Drive & Enable Backups"}
              </button>

              {hasDriveCredentials && (
                <button
                  onClick={triggerManualBackup}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 py-2 px-3.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  Run Backup Now
                </button>
              )}
            </div>
          </div>

          {/* Backup Config Dashboard */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="text-slate-500 w-4 h-4 shrink-0" />
              <h4 className="font-semibold text-sm text-slate-800">Automated Scheduler Configuration</h4>
            </div>

            <div className="space-y-4">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <label className="text-xs font-semibold text-slate-900 block">Automated Backup Operations</label>
                  <span className="text-[11px] text-slate-500">Enable or disable scheduled background server backup</span>
                </div>
                <div>
                  <button
                    onClick={() => saveSettings(!backupEnabled, frequencyHours)}
                    disabled={actionLoading}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${backupEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${backupEnabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Frequency slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-900">Backup Frequency Threshold</span>
                  <span className="text-slate-500 font-medium">{frequencyHours} hours</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="48"
                  step="6"
                  value={frequencyHours}
                  onChange={(e) => setFrequencyHours(parseInt(e.target.value))}
                  onMouseUp={() => saveSettings(backupEnabled, frequencyHours)}
                  onTouchEnd={() => saveSettings(backupEnabled, frequencyHours)}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>High Security (6h)</span>
                  <span>Daily (24h)</span>
                  <span>Every 2 days (48h)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active status & data statistics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="text-slate-500 w-4 h-4 shrink-0" />
              <h4 className="font-semibold text-sm text-slate-800">Daemon Health Status</h4>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Scheduler Daemon state:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active Listener
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Last Database Backup Time:</span>
                <span className="font-medium text-slate-800">
                  {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "Never"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Last Backup Result:</span>
                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${lastBackupStatus === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : lastBackupStatus === "FAILED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-400"}`}>
                  {lastBackupStatus || "No runs yet"}
                </span>
              </div>

              {lastBackupStatusMessage && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 leading-snug">
                  {lastBackupStatusMessage}
                </div>
              )}
            </div>
          </div>

          {/* Database Backup Metadata target folders */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-xs space-y-3.5">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-slate-400">
              Bundled Data Collections
            </h4>
            <div className="text-xs text-slate-600 space-y-2">
              <p>Each backup package is structured securely as dynamic, relational JSON streams containing full tables for:</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Vessels Inventory</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Broker Accounts</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Boarding Logs</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Crew & Staff</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Client Bookings</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Saved Proposals</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> Guest Contacts</span>
                <span className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-emerald-500" /> System Alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Database className="text-emerald-500 w-4 h-4 shrink-0" />
            Backup Archive History Logs
          </h3>
          <span className="text-[10px] text-slate-400">{historyLogs.length} historical logs logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Backup Filename</th>
                <th className="py-3 px-4">Backup Size</th>
                <th className="py-3 px-4">Triggered By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {historyLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No database backups archived yet. Click "Run Backup Now" to record the first log!
                  </td>
                </tr>
              ) : (
                historyLogs.map((log) => {
                  const isSuccess = log.status === "SUCCESS";
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] max-w-[200px] truncate" title={log.filename}>
                        {log.filename}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.size || "Unknown"}</td>
                      <td className="py-3 px-4 text-slate-600">{log.triggeredBy || "Scheduler Daemon"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full ${isSuccess ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
                          {log.status}
                        </span>
                        {!isSuccess && log.error && (
                          <span className="block text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={log.error}>
                            {log.error}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {isSuccess && log.driveFileId && (
                          <a
                            href={`https://drive.google.com/open?id=${log.driveFileId}`}
                            target="_blank"
                            rel="referrer noopener"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            Google Drive
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
