import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from "firebase/firestore";

import { readFileSync } from 'fs';

const firebaseConfig = {
  projectId: "ai-studio-9ef1e50a-1195-4446-b8c2-518eefb30d2e"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const d = await getDocs(collection(db, 'crewMembers'));
    d.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase() === 'phuketvinko2@gmail.com') {
        console.log('Crew:', data.email, data.password);
      }
    });

    const d2 = await getDocs(collection(db, 'captains'));
    d2.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase() === 'phuketvinko2@gmail.com') {
        console.log('Captain:', data.email, data.password);
      }
    });
  } catch (e) {
    console.error(e);
  }
}
run();
