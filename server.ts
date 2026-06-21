import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { getAppCheck } from "firebase-admin/app-check";
import {
  initializeApp as initAdminApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";
import { getAuth as getAdminAuthSDK } from "firebase-admin/auth";
import { getFirestore as getAdminFirestoreSDK } from "firebase-admin/firestore";
import esbuild from "esbuild";
import multer from "multer";
import * as pdf from "pdf-parse";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export let firebaseAdminAppInitialized = false;

// Global Firebase configuration
const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
export const cfg = fs.existsSync(cfgPath)
  ? JSON.parse(fs.readFileSync(cfgPath, "utf8"))
  : {};

export function ensureAdminSDK() {
  if (firebaseAdminAppInitialized) return;
  try {
    if (!getApps().length) {
      const initOpts: any = { projectId: cfg.projectId };
      try {
        initOpts.credential = applicationDefault();
      } catch (credErr) {
        console.warn("Could not load applicationDefault credentials. Proceeding with basic config for dynamic environment...", credErr);
      }
      initAdminApp(initOpts);
    }
    firebaseAdminAppInitialized = true;
  } catch (err: any) {
    console.error("Firebase Admin SDK failed to initialize dynamically:", err);
  }
}

// ---- Security Middleware ----
async function verifyAppCheck(req: any, res: any, next: any) {
  const token = req.header("X-Firebase-AppCheck");
  if (!token)
    return res.status(401).json({ error: "Missing App Check token." });
  try {
    ensureAdminSDK();
    await getAppCheck().verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid App Check token." });
  }
}

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

function rateLimit(opts: { capacity: number; refillPerSec: number }) {
  const { capacity, refillPerSec } = opts;
  return (req: any, res: any, next: any) => {
    const key =
      (req.header("X-Firebase-AppCheck") || "").slice(0, 40) ||
      req.ip ||
      "unknown";
    const now = Date.now();
    let b = buckets.get(key);
    if (!b) {
      b = { tokens: capacity, last: now };
      buckets.set(key, b);
    }
    const elapsedSec = (now - b.last) / 1000;
    b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSec);
    b.last = now;

    if (b.tokens < 1) {
      const retryAfter = Math.ceil((1 - b.tokens) / refillPerSec);
      res.setHeader("Retry-After", String(retryAfter));
      return res
        .status(429)
        .json({ error: "Too many requests. Please slow down." });
    }
    b.tokens -= 1;
    return next();
  };
}

const aiLimiter = rateLimit({ capacity: 20, refillPerSec: 1 / 3 });
const uploadLimiter = rateLimit({ capacity: 6, refillPerSec: 1 / 10 });
import { PIERS } from "./src/data";

// Admin SDK init - lazy helpers
function getAdminAuth() {
  ensureAdminSDK();
  try {
    return getAdminAuthSDK();
  } catch (err) {
    console.error("Failed to lazy locate Firebase Admin Auth SDK:", err);
    throw err;
  }
}

function getAdminDb() {
  ensureAdminSDK();
  try {
    return cfg.firestoreDatabaseId
      ? getAdminFirestoreSDK(cfg.firestoreDatabaseId)
      : getAdminFirestoreSDK();
  } catch (err) {
    console.error("Failed to lazy locate Firebase Admin Firestore SDK:", err);
    throw err;
  }
}

const adminAuth = {
  verifyIdToken(idToken: string) {
    return getAdminAuth().verifyIdToken(idToken);
  }
};

const adminDb = {
  collection(name: string) {
    return getAdminDb().collection(name);
  }
};

// Multer hardening
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF uploads are allowed."));
  },
});
const BOARDING_RADIUS_M = 300; // how close to a boarding point counts as "present"
const MAX_GPS_ACCURACY_M = 150; // reject vague fixes (wifi/IP gelocation, etc.)
const MAX_GPS_AGE_MS = 120000; // 2 min — reject stale/cached coordinates

// ---- Haversine distance in metres ----
function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat),
    lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---- Allowed boarding points for a vessel ----
// (a) the vessel's pushed live position if a captain set one (good for at-sea
//     deboard), plus (b) the known piers. To tighten, restrict (b) to the pier
//     of today's confirmed charter for this vessel instead of all piers.
async function allowedBoardingPoints(vesselId: string) {
  const points: { name: string; lat: number; lng: number }[] = [];
  try {
    const vSnap = await adminDb.collection("vessels").doc(vesselId).get();
    const v = vSnap.exists ? (vSnap.data() as any) : null;
    if (
      v &&
      typeof v.currentLat === "number" &&
      typeof v.currentLng === "number"
    ) {
      points.push({
        name: "vessel-position",
        lat: v.currentLat,
        lng: v.currentLng,
      });
    }
  } catch {
    /* vessels doc optional */
  }
  for (const p of PIERS)
    points.push({ name: p.name, lat: p.latitude, lng: p.longitude });
  return points;
}

// ---- Resolve crew identity from the verified token ----
async function resolveCrew(idToken: string) {
  const decoded = await adminAuth.verifyIdToken(idToken);
  const email = (decoded.email || "").toLowerCase();

  let snap = await adminDb.collection("crewMembers").doc(decoded.uid).get();
  if (snap.exists)
    return { id: snap.id, ...(snap.data() as any), _coll: "crewMembers" };

  for (const coll of ["crewMembers", "captains"]) {
    if (!email) break;
    const q = await adminDb
      .collection(coll)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!q.empty)
      return { id: q.docs[0].id, ...(q.docs[0].data() as any), _coll: coll };
  }

  snap = await adminDb.collection("captains").doc(decoded.uid).get();
  if (snap.exists)
    return { id: snap.id, ...(snap.data() as any), _coll: "captains" };

  return null; // authenticated, but not a registered crew member
}

export function registerCrewBoarding(app: any) {
  app.post("/api/crew-board", async (req: any, res: any) => {
    try {
      const header = req.headers.authorization || "";
      const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
      if (!idToken)
        return res.status(401).json({ error: "Sign in required to board." });

      const { vesselId, action, lat, lng, accuracy, gpsTimestamp, deviceId } =
        req.body || {};
      if (!vesselId || !["Boarded", "Deboarded"].includes(action))
        return res
          .status(400)
          .json({ error: "Missing vesselId or valid action." });
      if (typeof lat !== "number" || typeof lng !== "number")
        return res
          .status(400)
          .json({ error: "Location is required to board." });

      // GPS quality + freshness — blocks cached/IP-based/old fixes.
      if (typeof accuracy === "number" && accuracy > MAX_GPS_ACCURACY_M)
        return res
          .status(403)
          .json({
            error: "Location too imprecise. Move to open sky and retry.",
          });
      if (
        typeof gpsTimestamp === "number" &&
        Date.now() - gpsTimestamp > MAX_GPS_AGE_MS
      )
        return res
          .status(403)
          .json({ error: "Location is stale. Refresh and retry." });

      // Identity from token.
      let crew: any;
      try {
        crew = await resolveCrew(idToken);
      } catch {
        return res.status(401).json({ error: "Invalid or expired session." });
      }
      if (!crew)
        return res.status(403).json({ error: "Not a registered crew member." });

      // Geofence: nearest allowed boarding point must be within radius.
      const points = await allowedBoardingPoints(vesselId);
      let nearest = Infinity,
        nearestName = "";
      for (const p of points) {
        const d = distanceMeters(lat, lng, p.lat, p.lng);
        if (d < nearest) {
          nearest = d;
          nearestName = p.name;
        }
      }
      if (nearest > BOARDING_RADIUS_M)
        return res
          .status(403)
          .json({
            error: `You are ${Math.round(nearest)}m away. Boarding must happen at the vessel/pier.`,
          });

      // State machine from the latest log for this crew+vessel.
      const lastSnap = await adminDb
        .collection("crewLogs")
        .where("crewId", "==", crew.id)
        .where("yachtId", "==", vesselId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
      const last = lastSnap.empty ? null : (lastSnap.docs[0].data() as any);
      const lastStatus = last?.status || null;
      if (action === "Boarded" && lastStatus === "Boarded")
        return res.status(409).json({ error: "You are already boarded." });
      if (action === "Deboarded" && lastStatus !== "Boarded")
        return res
          .status(409)
          .json({ error: "You are not currently boarded." });

      // Optional device fingerprint as a SECONDARY signal (flag, don't hard-block,
      // since geofence + auth already prove presence + identity).
      if (
        deviceId &&
        crew.deviceFingerprint &&
        crew.deviceFingerprint !== deviceId
      ) {
        await adminDb.collection("securityIncidents").add({
          timestamp: new Date().toISOString(),
          yachtId: vesselId,
          targetCrewId: crew.id,
          targetCrewName: crew.name || "",
          usedDeviceId: deviceId,
          registeredDeviceId: crew.deviceFingerprint,
          action,
          status: "DEVICE_MISMATCH",
        });
      } else if (deviceId && !crew.deviceFingerprint) {
        await adminDb
          .collection(crew._coll)
          .doc(crew.id)
          .update({ deviceFingerprint: deviceId })
          .catch(() => {});
      }

      // Write the log server-side (clients are blocked from writing crewLogs).
      const logId = `crew-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await adminDb
        .collection("crewLogs")
        .doc(logId)
        .set({
          id: logId,
          crewId: crew.id,
          crewName: crew.name || "",
          role: crew.role || "Crew",
          email: crew.email || "",
          status: action,
          yachtId: vesselId,
          timestamp: new Date().toISOString(),
          location: { lat, lng, accuracy: accuracy ?? null },
          locationName: nearestName,
          distanceMeters: Math.round(nearest),
          verifiedBy: "server-geofence",
        });

      if (action === "Boarded") {
        await adminDb
          .collection(crew._coll)
          .doc(crew.id)
          .update({ shipId: vesselId })
          .catch(() => {});
      }

      return res.json({
        ok: true,
        action,
        distanceMeters: Math.round(nearest),
        at: nearestName,
      });
    } catch (err: any) {
      console.error("crew-board error:", err);
      return res.status(500).json({ error: err.message || "Boarding failed." });
    }
  });
}

// ---- Secure Admin Authorization Middleware ----
async function verifyAdminUser(req: any, res: any, next: any) {
  try {
    const header = req.headers.authorization || "";
    const idToken = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!idToken) return res.status(401).json({ error: "Unauthorized access. Please log in." });

    ensureAdminSDK();
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase();

    // Vinko is supreme administrator
    if (email === "vinko.mitar@gmail.com") {
      return next();
    }

    const q = await getAdminDb()
      .collection("agents")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (q.empty) {
      return res.status(403).json({ error: "Access denied. Broker/Admin profile not found." });
    }

    const agent = q.docs[0].data();
    if (agent.isAdmin === true) {
      return next();
    }

    return res.status(403).json({ error: "Access denied. Admin permissions required." });
  } catch (err: any) {
    console.error("verifyAdminUser error:", err);
    return res.status(401).json({ error: "Invalid or expired administrator session." });
  }
}

// ---- Database Backup Execution Engine ----
async function executeBackupAndDriveSync(opts: {
  db: any;
  token: string;
  folderId: string;
  triggeredBy: string;
}): Promise<boolean> {
  const { db, token, folderId, triggeredBy } = opts;
  const timestampStr = new Date().toISOString();
  const dateStr = timestampStr.split("T")[0];
  const timeStr = timestampStr.split("T")[1].replace(/:/g, "-").split(".")[0];
  const filename = `payc_database_backup_${dateStr}_${timeStr}.json`;

  try {
    const backupData: any = {
      meta: {
        exportedAt: timestampStr,
        version: "2.0.0",
        source: "Phuket Yacht Charters Backup Engine"
      },
      collections: {}
    };

    const collectionsToBackup = [
      "fleet",
      "agents",
      "customers",
      "booking_requests",
      "proposals",
      "inquiries",
      "crewMembers",
      "captains",
      "crewLogs",
      "captain_shifts",
      "adminAlerts",
      "guestFeedbacks",
      "mail"
    ];

    let totalDocsExported = 0;

    for (const col of collectionsToBackup) {
      try {
        const snap = await db.collection(col).get();
        const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        backupData.collections[col] = docs;
        totalDocsExported += docs.length;
        console.log(`[Backup Engine] Exporting ${docs.length} docs from '${col}'`);
      } catch (colErr: any) {
        console.warn(`[Backup Engine] Could not fetch collection '${col}':`, colErr.message);
        backupData.collections[col] = [];
      }
    }

    const jsonStr = JSON.stringify(backupData, null, 2);
    const byteSize = Buffer.byteLength(jsonStr, "utf8");
    const formattedSize = (byteSize / 1024).toFixed(2) + " KB";

    // Upload to Google Drive using robust multi-part payload
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      mimeType: "application/json",
      parents: [folderId]
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      jsonStr +
      close_delimiter;

    console.log(`[Backup Engine] Uploading backup file (${formattedSize}) to Google Drive Folder '${folderId}'...`);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive API returned ${uploadRes.status}: ${errText}`);
    }

    const gResponse = await uploadRes.json() as any;
    console.log("[Backup Engine] Upload succeeded! Google Drive File ID:", gResponse.id);

    // Save success log
    const logId = `backup-${Date.now()}`;
    await db.collection("backup_history").doc(logId).set({
      id: logId,
      timestamp: timestampStr,
      filename,
      size: formattedSize,
      status: "SUCCESS",
      driveFileId: gResponse.id || null,
      folderId,
      triggeredBy,
      totalCollections: collectionsToBackup.length,
      totalDocs: totalDocsExported,
      error: null
    });

    return true;
  } catch (err: any) {
    console.error("[Backup Engine] Backup failed:", err);

    // Record failure in backup_history
    try {
      const logId = `backup-${Date.now()}`;
      await db.collection("backup_history").doc(logId).set({
        id: logId,
        timestamp: timestampStr,
        filename,
        size: "0.00 KB",
        status: "FAILED",
        driveFileId: null,
        folderId,
        triggeredBy,
        error: err.message || JSON.stringify(err)
      });

      // Write error system alert
      await db.collection("adminAlerts").add({
        title: "Automated Backup Failure",
        message: `Standard daily automated database backup FAILED: ${err.message || "Google authentication expired or revoked."}`,
        type: "error",
        details: err.message || "",
        timestamp: timestampStr,
        read: false
      });
    } catch (logErr) {
      console.error("[Backup Engine] Failed to write fail-log to database:", logErr);
    }
    return false;
  }
}

// ---- Background Automated Backups Daemon Checker ----
function startBackupScheduler() {
  setInterval(async () => {
    try {
      console.log("[Backup Scheduler] Running tick for scheduled automated database backups...");
      const db = getAdminDb();

      // Check current settings
      const settingsSnap = await db.collection("google_drive_configs").doc("backup_settings").get();
      if (!settingsSnap.exists) {
        console.log("[Backup Scheduler] Backup settings doc ('google_drive_configs/backup_settings') does not exist yet.");
        return;
      }

      const settings = settingsSnap.data() || {};
      if (!settings.backupEnabled) {
        console.log("[Backup Scheduler] Automated daily backups are currently disabled.");
        return;
      }

      // Check frequency threshold (default 24 hours)
      const lastBackupStr = settings.lastBackupTime;
      const now = new Date();
      if (lastBackupStr) {
        const lastBackupTime = new Date(lastBackupStr);
        const diffMs = now.getTime() - lastBackupTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const frequencyHours = settings.frequencyHours || 24;
        if (diffHours < frequencyHours) {
          console.log(`[Backup Scheduler] Threshold not reached. Last backup: ${lastBackupStr}. Next in ${Math.round(frequencyHours - diffHours)} hours.`);
          return;
        }
      }

      // Load authorization configs
      const credSnap = await db.collection("google_drive_configs").doc("default").get();
      if (!credSnap.exists) {
        console.warn("[Backup Scheduler] Skipped: Stored Google authorization ('google_drive_configs/default') is missing.");
        return;
      }

      const cred = credSnap.data() || {};
      const token = cred.accessToken;
      const folderId = cred.folderId;

      if (!token || !folderId) {
        console.warn("[Backup Scheduler] Skipped: Stored Google Drive Token or Backup folderId is missing.");
        return;
      }

      const success = await executeBackupAndDriveSync({
        db,
        token,
        folderId,
        triggeredBy: "Automated Scheduler"
      });

      if (success) {
        await db.collection("google_drive_configs").doc("backup_settings").set({
          lastBackupTime: now.toISOString(),
          lastBackupStatus: "SUCCESS",
          lastBackupStatusMessage: "Backup executed successfully by background daemon.",
        }, { merge: true });
        console.log("[Backup Scheduler] Automated backup completed successfully & settings updated.");
      } else {
        await db.collection("google_drive_configs").doc("backup_settings").set({
          lastBackupStatus: "FAILED",
          lastBackupStatusMessage: "Automated backup failed. Stored access token expired.",
        }, { merge: true });
        console.error("[Backup Scheduler] Background automated backup finished with failure status.");
      }
    } catch (err: any) {
      console.error("[Backup Scheduler] Background backup daemon checker error:", err);
    }
  }, 4 * 60 * 60 * 1000); // Check every 4 hours
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  app.use(express.json());

  registerCrewBoarding(app);

  // ---- BACKUP API ENDPOINTS ----
  
  // Download full DB snapshot directly
  app.get("/api/backup/download", verifyAdminUser, async (req: any, res: any) => {
    try {
      const db = getAdminDb();
      const backupData: any = {
        meta: {
          exportedAt: new Date().toISOString(),
          version: "2.0.0",
          source: "Phuket Yacht Charters Backup Engine"
        },
        collections: {}
      };

      const collectionsToBackup = [
        "fleet",
        "agents",
        "customers",
        "booking_requests",
        "proposals",
        "inquiries",
        "crewMembers",
        "captains",
        "crewLogs",
        "captain_shifts",
        "adminAlerts",
        "guestFeedbacks",
        "mail"
      ];

      for (const col of collectionsToBackup) {
        try {
          const snap = await db.collection(col).get();
          backupData.collections[col] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        } catch (e: any) {
          backupData.collections[col] = [];
        }
      }

      const dateStr = new Date().toISOString().split("T")[0];
      res.setHeader("Content-Disposition", `attachment; filename=payc_db_snapshot_${dateStr}.json`);
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(backupData, null, 2));
    } catch (err: any) {
      console.error("Download backup error:", err);
      return res.status(500).json({ error: err.message || "Failed to compile snapshot." });
    }
  });

  // Execute manual backup to Google Drive
  app.post("/api/backup/run", verifyAdminUser, async (req: any, res: any) => {
    try {
      const db = getAdminDb();
      const { token, folderId } = req.body || {};

      let finalToken = token;
      let finalFolderId = folderId;

      if (!finalToken || !finalFolderId) {
        const credSnap = await db.collection("google_drive_configs").doc("default").get();
        if (credSnap.exists) {
          const cred = credSnap.data() || {};
          finalToken = finalToken || cred.accessToken;
          finalFolderId = finalFolderId || cred.folderId;
        }
      }

      if (!finalToken || !finalFolderId) {
        return res.status(400).json({
          error: "Google Drive Access Token & backup Folder ID are required. Please link your Google Account in the dashboard."
        });
      }

      const success = await executeBackupAndDriveSync({
        db,
        token: finalToken,
        folderId: finalFolderId,
        triggeredBy: req.body?.triggeredBy || "Admin Panel Manual UI"
      });

      if (!success) {
        return res.status(502).json({
          error: "Failed to upload database backup file to Google Drive. Check connection or renew Google Access Session."
        });
      }

      // Also update backup frequency state timestamp
      await db.collection("google_drive_configs").doc("backup_settings").set({
        lastBackupTime: new Date().toISOString(),
        lastBackupStatus: "SUCCESS",
        lastBackupStatusMessage: "Backup executed successfully by manual request.",
      }, { merge: true });

      return res.json({ success: true, message: "Backup completed and uploaded successfully to Google Drive!" });
    } catch (err: any) {
      console.error("Manual backup route error:", err);
      return res.status(500).json({ error: err.message || "Backup execution failed." });
    }
  });

  // Retrieve backup configuration & system health status
  app.get("/api/backup/config", verifyAdminUser, async (req: any, res: any) => {
    try {
      const db = getAdminDb();
      const setSnap = await db.collection("google_drive_configs").doc("backup_settings").get();
      const settings = setSnap.exists ? setSnap.data() : { backupEnabled: false, frequencyHours: 24 };

      const credSnap = await db.collection("google_drive_configs").doc("default").get();
      const credentials = credSnap.exists ? credSnap.data() : null;

      return res.json({
        settings,
        hasDriveCredentials: !!credentials,
        driveFolderId: credentials?.folderId || null,
        tokenSavedAt: credentials?.updatedAt || null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Save backup configurations
  app.post("/api/backup/config", verifyAdminUser, async (req: any, res: any) => {
    try {
      const db = getAdminDb();
      const { backupEnabled, frequencyHours } = req.body || {};

      await db.collection("google_drive_configs").doc("backup_settings").set({
        backupEnabled: !!backupEnabled,
        frequencyHours: Number(frequencyHours) || 24,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return res.json({ success: true, message: "Backup settings saved successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // API Health
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.get("/api/charter-inquiries", (req, res) => {
    res.json([]);
  });

  app.post("/api/translate", verifyAppCheck, aiLimiter, async (req, res) => {
    // ... re-implement translate logic
    res.json({ status: "ok" });
  });

  // Apply public protected endpoints
  // app.post("/api/translate", verifyAppCheck, aiLimiter, handler);
  // app.post("/api/ai-itinerary", verifyAppCheck, aiLimiter, handler);
  // app.post("/api/concierge-chat", verifyAppCheck, aiLimiter, handler);
  // app.post("/api/parse-pdf", verifyAppCheck, uploadLimiter, upload.single("pdf"), handler);
  // app.post("/api/chat-with-pdf", verifyAppCheck, uploadLimiter, upload.single("pdf"), handler);

  // Catch multer errors
  app.use((err: any, _req: any, res: any, next: any) => {
    if (
      err &&
      (err.code === "LIMIT_FILE_SIZE" || /Only PDF/.test(err.message))
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Start the automated database backup daemon
    try {
      startBackupScheduler();
      console.log("[Server Initialization] Automated daily backups daemon started successfully.");
    } catch (schedErr) {
      console.error("[Server Initialization] Failed to start backup daemon:", schedErr);
    }
  });
}

startServer();
