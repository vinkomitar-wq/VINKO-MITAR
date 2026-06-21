import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const configPath = new URL("../firebase-applet-config.json", import.meta.url).pathname;
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId;
// In Node.js, we don't need persistent local cache stuff, but we can just initialize getFirestore
import { initializeFirestore } from "firebase/firestore";
const db = dbId ? initializeFirestore(app, {}, dbId) : getFirestore(app);

async function seed() {
  const crewId = "crew_lutka_test";
  const dummyCrew = {
    id: crewId,
    uid: crewId,
    name: "Lutka Test",
    role: "Deckhand",
    phone: "+385 91 234 5678",
    shipId: "the-best",
    photoUrl: "https://images.unsplash.com/photo-1544333323-167812e95a32?w=150&h=150&fit=crop",
    email: "lutka@phuketyacht.com",
    password: "testpassword",
    isActive: true,
    dbSource: "crewMembers",
    embarkationStatus: "Embakred"
  };

  try {
    console.log("Creating dummy crew...");
    await setDoc(doc(db, "crewMembers", crewId), dummyCrew, { merge: true });
    console.log("Dummy crew created successfully!");
    
    // Create an initial crew logs
    const logId = "log_lutka_" + Date.now();
    await setDoc(doc(db, "crewLogs", logId), {
        id: logId,
        uid: logId,
        crewId: crewId,
        crewName: "Lutka Test",
        action: "EMBARK",
        yachtId: "the-best",
        timestamp: Date.now(),
        notes: "Testiranje procesa ukrcaja - Automated AI Test"
    }, { merge: true });
    console.log("Dummy embarkation log created!");

  } catch (error) {
    console.error("Error seeding dummy crew:", error);
  }
  process.exit(0);
}

seed();
