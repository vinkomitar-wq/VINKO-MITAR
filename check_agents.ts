
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import configRaw from "./firebase-applet-config.json";

const firebaseConfig = {
  projectId: configRaw.projectId,
  appId: configRaw.appId,
  apiKey: configRaw.apiKey,
  authDomain: configRaw.authDomain,
  storageBucket: configRaw.storageBucket,
  messagingSenderId: configRaw.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, configRaw.firestoreDatabaseId);

async function checkAgents() {
  try {
    console.log("Checking agents from Firestore...");
    const snap = await getDocs(collection(db, "agents"));
    console.log("Found", snap.size, "agents in DB:");
    snap.forEach(doc => {
      console.log("- Agent:", doc.id, doc.data().email);
    });
  } catch (e) {
    console.error("Firestore Error:", e);
  }
}

checkAgents();
