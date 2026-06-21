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

async function run() {
  try {
    console.log("Checking agents...");
    const snap = await getDocs(collection(db, "agents"));
    console.log("Found", snap.size, "agents.");
  } catch (e) {
    console.error("Error read access:", e);
  }
}
run();
