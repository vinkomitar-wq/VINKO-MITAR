import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "fs";

const configRaw = JSON.parse(readFileSync("firebase-applet-config.json", "utf8"));
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
    let pw = "NOT FOUND";
    const d = await getDocs(collection(db, 'crewMembers'));
    d.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase() === 'phuketvinko2@gmail.com') {
        pw = data.password;
        console.log('Crew Password:', data.password);
      }
    });

    const d2 = await getDocs(collection(db, 'captains'));
    d2.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase() === 'phuketvinko2@gmail.com') {
        pw = data.password;
        console.log('Captain Password:', data.password);
      }
    });

    console.log("FINAL PASSWORD:", pw);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
