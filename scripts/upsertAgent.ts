// Register / update agent "Chan" in the Firestore `agents` collection.
//
// Your hardened rules only allow writes to `agents` from an admin, so this
// script signs in as you (Firebase Auth) before writing. Credentials come from
// environment variables so they're never saved in the file.
//
// Usage:
//   ADMIN_EMAIL=vinko.mitar@gmail.com ADMIN_PASSWORD=3003971luka \
//     npx tsx scripts/upsertAgent.ts
//
// Reads ../firebase-applet-config.json, same as seedDummyCrew.ts.

import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import fs from "fs";

// ---- Edit Chan's details here if anything is off ----------------------------
const BASE_URL = "https://phuket-catamaran-charter-245786032645.asia-southeast1.run.app/";

const CHAN = {
  name: "Chan",
  email: "umnad.thong@gmail.com",   // corrected from gmai.com
  lineId: "+66656463528",            // Chan's LINE ID (his phone number)
  contactPhone: "+66656463528",
  whatsapp: "",                      // no WhatsApp on file
  companyName: "",
  isActive: true,
  isAdmin: false,
  // password intentionally omitted — set later via Admin portal if Chan needs to log in
};
// -----------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Missing admin credentials.\n" +
      "Run as:  ADMIN_EMAIL=vinko.mitar@gmail.com ADMIN_PASSWORD=yourpassword npx tsx scripts/upsertAgent.ts"
  );
  process.exit(1);
}

const configPath = new URL("../firebase-applet-config.json", import.meta.url).pathname;
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId;
const db = dbId ? initializeFirestore(app, {}, dbId) : getFirestore(app);
const auth = getAuth(app);

// Doc id is derived from the email, exactly like AgentContext.register().
const agentId = CHAN.email.toLowerCase().replace(/[^a-z0-9]/g, "_");

function buildReferralLink() {
  const p = new URLSearchParams();
  p.set("agent", CHAN.email);
  p.set("agentName", CHAN.name);
  if (CHAN.lineId) p.set("agentLineId", CHAN.lineId);
  if (CHAN.contactPhone) p.set("agentPhone", CHAN.contactPhone);
  return BASE_URL + "?" + p.toString();
}

async function run() {
  console.log(`Signing in as ${ADMIN_EMAIL}...`);
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL!, ADMIN_PASSWORD!);

  const record = { id: agentId, ...CHAN };

  console.log(`Writing agents/${agentId} ...`);
  await setDoc(doc(db, "agents", agentId), record, { merge: true });

  console.log("\n✅ Chan registered / updated successfully.\n");
  console.log("Stored record:");
  console.log(JSON.stringify(record, null, 2));
  console.log("\nClean referral link (LINE-based — distribute this one):");
  console.log(buildReferralLink());

  await signOut(auth);
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Upsert failed:", err?.code || "", err?.message || err);
  if (err?.code === "permission-denied") {
    console.error(
      "The signed-in account isn't treated as admin by your rules. " +
        "Confirm ADMIN_EMAIL is vinko.mitar@gmail.com (or an account with the admin claim)."
    );
  }
  process.exit(1);
});
