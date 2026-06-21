import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
  const masterId = "vinko_mitar_gmail_com";
  const master = {
    id: masterId,
    name: "Vinko Mitar",
    email: "vinko.mitar@gmail.com",
    password: "3003971luka",
    whatsapp: "66636368287",
    contactPhone: "+66 63 636 8287",
    isAdmin: true,
    isActive: true
  };
  const parryId = "pa_2533_hotmail_com";
  const parry = {
    id: parryId,
    name: "Parry",
    email: "pa-2533@hotmail.com",
    password: "password123",
    whatsapp: "66945411179",
    contactPhone: "+66 94 541 1179",
    lineId: "064948883",
    companyName: "MOBYDICK",
    isAdmin: false,
    isActive: true
  };

  try {
    await setDoc(doc(db, 'agents', masterId), master);
    console.log("Restored master agent.");
    await setDoc(doc(db, 'agents', parryId), parry);
    console.log("Restored Parry agent.");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
