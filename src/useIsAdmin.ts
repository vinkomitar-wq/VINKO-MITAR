import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Real admin = the signed-in Firebase user, by email or custom claim.
// Keep this list in sync with your Firestore rules' isAdmin().
const ADMIN_EMAILS = ["vinko.mitar@gmail.com"];

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const email = (user.email || "").toLowerCase();
      let claimAdmin = false;
      try {
        const token = await user.getIdTokenResult();
        claimAdmin = token.claims.admin === true;
      } catch {
        /* ignore */
      }
      setIsAdmin(claimAdmin || ADMIN_EMAILS.includes(email));
    });
    return () => unsub();
  }, []);

  return isAdmin;
}
