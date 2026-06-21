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

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  app.use(express.json());

  registerCrewBoarding(app);

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
  });
}

startServer();
