import { useState, useEffect } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase";

export function useMaintenanceMode() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsOffline(data.maintenanceMode === true);
      }
    });
    return () => unsub();
  }, []);

  return isOffline;
}
