import React, { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  // throw new Error(JSON.stringify(errInfo));
}

export interface CoAgent {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  customPricing?: {
    routes?: Record<string, number>;
    standardExtras?: Record<string, number>;
    extraServices?: {
      id: string;
      name: string;
      price: number;
      unit?: string;
    }[];
  };
}

export interface Agent {
  id?: string;
  name: string;
  email: string;
  password?: string;
  whatsapp: string;
  contactPhone: string;
  lineId?: string;
  wechatId?: string;
  companyName?: string;
  companyAddress?: string;
  country?: string;
  taxId?: string;
  welcomeMessage?: string;
  customShareMessage?: string;
  qrScans?: number;
  lastScanAt?: string;
  coagents?: CoAgent[];
  isActive?: boolean;
  isAdmin?: boolean;
  isCoAdmin?: boolean;
  customPricing?: {
    vessels?: Record<string, number>;
    routes?: Record<string, number>;
    extraServices?: {
      id: string;
      name: string;
      price: number;
      unit?: string;
    }[];
  };
}

interface AgentContextProps {
  currentAgent: Agent | null;
  agents: Agent[];
  currentCoagent: CoAgent | null;
  isReferred: boolean;
  isInitialized: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  register: (agent: Agent) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (
    updated: Partial<Agent>,
  ) => Promise<{ success: boolean; message: string }>;
  getNormalizedWhatsApp: () => string;
  getContactPhone: () => string;
  adminResetPassword: (
    email: string,
    newPassword?: string,
  ) => Promise<{ success: boolean; message: string }>;
  adminRemoveAgent: (
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
  toggleCoAdmin: (
    email: string,
    newState: boolean,
  ) => Promise<{ success: boolean; message: string }>;
  adminUpdateAgent: (
    email: string,
    updatedFields: Partial<Agent>,
  ) => Promise<{ success: boolean; message: string }>;
  clearCoagent: () => void;
}

const DEFAULT_WHATSAPP = "66636368287";
const DEFAULT_PHONE = "+66 63 636 8287";

const AgentContext = createContext<AgentContextProps | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isReferred, setIsReferred] = useState(false);
  const [currentCoagent, setCurrentCoagent] = useState<CoAgent | null>(null);

  const clearCoagent = () => {
    setCurrentCoagent(null);
    localStorage.removeItem("charter_active_coagent");
  };

  // Load agent database from Firestore
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "agents"));
        const fbAgents: Agent[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Agent;
          if (data.isActive !== false) {
            fbAgents.push({ ...data, id: doc.id });
          }
        });

        // Self-Healing Setup: ensure Vinko Mitar admin account is always seeded if missing in Firestore
        const masterEmail = "vinko.mitar@gmail.com";
        const masterId = "vinko_mitar_gmail_com";
        const masterIndex = fbAgents.findIndex(
          (a) =>
            a.id === masterId || (a.email || "").toLowerCase() === masterEmail,
        );

        if (masterIndex === -1) {
          const master: Agent = {
            id: masterId,
            name: "Vinko Mitar",
            email: masterEmail,
            password: "3003971luka",
            whatsapp: "66636368287",
            contactPhone: "+66 63 636 8287",
            isAdmin: true,
          };
          try {
            await setDoc(doc(db, "agents", masterId), master);
            fbAgents.push(master);
            console.log(
              "Seeded default master account in Firestore and locally.",
            );
          } catch (seedErr) {
            console.error("Failed to seed master admin:", seedErr);
          }
        } else {
          // Dynamic update check: if Vinko Mitar has old phone values in Firestore, update them in real-time
          const master = fbAgents[masterIndex];
          if (
            master.whatsapp === "66902979693" ||
            master.contactPhone === "+66 90 297 9693"
          ) {
            master.whatsapp = "66636368287";
            master.contactPhone = "+66 63 636 8287";
            try {
              await setDoc(doc(db, "agents", masterId), master, {
                merge: true,
              });
              console.log(
                "Successfully migrated Vinko Mitar's phone/WhatsApp details in Firestore.",
              );
            } catch (updateErr) {
              console.error(
                "Failed to migrate master broker phone parameters:",
                updateErr,
              );
            }
          }
        }

        // Ensure Agent Parry is also seeded if missing in Firestore
        const parryEmail = "pa-2533@hotmail.com";
        const parryId = "pa_2533_hotmail_com";
        const parryIndex = fbAgents.findIndex(
          (a) =>
            a.id === parryId || (a.email || "").toLowerCase() === parryEmail,
        );

        if (parryIndex === -1) {
          const parry: Agent = {
            id: parryId,
            name: "Parry",
            email: parryEmail,
            password: "password123",
            whatsapp: "66945411179",
            contactPhone: "+66 94 541 1179",
            lineId: "064948883",
            companyName: "MOBYDICK",
            isAdmin: false,
            isActive: true,
          };
          try {
            await setDoc(doc(db, "agents", parryId), parry);
            fbAgents.push(parry);
            console.log("Seeded agent Parry in Firestore.");
          } catch (seedErr) {
            console.error("Failed to seed Agent Parry:", seedErr);
          }
        }

        // --- SELF-HEALING DE-DUPLICATION SYSTEM FOR BROKERS ---
        // Group all loaded active agents by email to identify twins/duplicates
        const emailToAgentsGroup: Record<string, Agent[]> = {};
        fbAgents.forEach((a) => {
          const em = (a.email || "").toLowerCase().trim();
          if (em) {
            if (!emailToAgentsGroup[em]) emailToAgentsGroup[em] = [];
            emailToAgentsGroup[em].push(a);
          }
        });

        const cleanedAgents: Agent[] = [];
        for (const [em, list] of Object.entries(emailToAgentsGroup)) {
          if (list.length > 1) {
            console.log(`Self-Healing: Found database duplicates for agent ${em}:`, list.map(x => x.id));
            const preferredId = em.replace(/[^a-z0-9]/g, "_");
            // Find the agent with the preferred ID or fallback to the one having isAdmin or having custom password
            let primaryAgent = list.find((x) => x.id === preferredId) || list.find((x) => x.isAdmin) || list[0];
            
            // Merge properties from other duplicate accounts to preserve passwords, lines, coagents
            list.forEach((other) => {
              if (other.id !== primaryAgent.id) {
                if (!primaryAgent.password && other.password) primaryAgent.password = other.password;
                if (!primaryAgent.whatsapp && other.whatsapp) primaryAgent.whatsapp = other.whatsapp;
                if (!primaryAgent.contactPhone && other.contactPhone) primaryAgent.contactPhone = other.contactPhone;
                if (!primaryAgent.lineId && other.lineId) primaryAgent.lineId = other.lineId;
                if (!primaryAgent.companyName && other.companyName) primaryAgent.companyName = other.companyName;
                if (other.coagents && other.coagents.length > 0) {
                  primaryAgent.coagents = [
                    ...(primaryAgent.coagents || []),
                    ...other.coagents.filter(oc => !(primaryAgent.coagents || []).some(pc => pc.id === oc.id))
                  ];
                }
                
                // NE diramo Firestore automatski. Dedup je SAMO u memoriji (za prikaz).
                // Čišćenje duplikata radi se ručno, nikad auto na svako učitavanje.
              }
            });

            // Samo u memoriji — bez upisa u Firestore.
            primaryAgent.id = preferredId;

            cleanedAgents.push(primaryAgent);
          } else {
            cleanedAgents.push(list[0]);
          }
        }

        setAgents(cleanedAgents);

        // If we had a local session, refresh it from the fresh data
        const storedActive = localStorage.getItem("charter_active_agent");
        if (storedActive) {
          const localActive = JSON.parse(storedActive);
          const matched = fbAgents.find(
            (a) =>
              (a.email || "").toLowerCase() ===
              (localActive.email || "").toLowerCase(),
          );
          if (matched) {
            setCurrentAgent(matched);
            localStorage.setItem(
              "charter_active_agent",
              JSON.stringify(matched),
            );
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "agents");
        // Fallback local seed to ensure master admin can ALWAYS log in even if Firestore list is barred
        const masterEmail = "vinko.mitar@gmail.com";
        const masterId = "vinko_mitar_gmail_com";
        const master: Agent = {
          id: masterId,
          name: "Vinko Mitar",
          email: masterEmail,
          password: "3003971luka",
          whatsapp: "66636368287",
          contactPhone: "+66 63 636 8287",
          isAdmin: true,
        };
        const parryEmail = "pa-2533@hotmail.com";
        const parryId = "pa_2533_hotmail_com";
        const parry: Agent = {
          id: parryId,
          name: "Parry",
          email: parryEmail,
          password: "password123",
          whatsapp: "66945411179",
          contactPhone: "+66 94 541 1179",
          lineId: "064948883",
          companyName: "MOBYDICK",
          isAdmin: false,
        };
        setAgents([master, parry]);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchAgents();
  }, []);

  // Run referral logic after initialization
  useEffect(() => {
    if (!isInitialized) return;

    try {
      const storedActive = localStorage.getItem("charter_active_agent");
      const storedCo = localStorage.getItem("charter_active_coagent");

      if (storedCo) {
        try {
          setCurrentCoagent(JSON.parse(storedCo));
        } catch (e) {
          console.error("Failed parsing stored active coagent:", e);
        }
      }

      // Check URL query parameters for dynamic agent referral routing
      const params = new URLSearchParams(window.location.search);
      const urlAgentName = params.get("agentName");
      const urlAgentWhatsApp = params.get("agentWhatsApp");
      const urlAgentPhone = params.get("agentPhone");
      const urlAgentEmail = params.get("agentEmail");
      const urlAgentLineId = params.get("agentLineId");
      const urlAgentWechatId = params.get("agentWechatId");
      const urlAgentCompanyName = params.get("agentCompanyName");
      const urlAgentCompanyAddress = params.get("agentCompanyAddress");
      const urlAgentCountry = params.get("agentCountry");
      const urlAgentTaxId = params.get("agentTaxId");

      // Custom ?agent= email / name / messenger ID shortcut parameter
      const shortAgentQuery = params.get("agent");

      if (urlAgentName || shortAgentQuery) {
        console.log("AgentContext: Detected referral params:", {
          urlAgentName,
          shortAgentQuery,
        });
        const urlEmail =
          urlAgentEmail ||
          shortAgentQuery ||
          (urlAgentName
            ? `${urlAgentName.replace(/\s+/g, "").toLowerCase()}@charter-partner.com`
            : "referred@charter-partner.com");

        const urlCoagentId = params.get("coagentId") || params.get("coagent");
        const urlCoagentName = params.get("coagentName");
        const urlCoagentPhone = params.get("coagentPhone");

        const referredId = urlEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");

        // Try to find a matched agent in the existing database first to get full details
        const queryLower = (shortAgentQuery || "").toLowerCase().trim();
        const matchedInDb = agents.find(
          (a) =>
            (a.email || "").toLowerCase() === queryLower ||
            (a.id && a.id.toLowerCase() === queryLower) ||
            (a.name || "").toLowerCase() === queryLower ||
            (a.lineId && a.lineId.toLowerCase() === queryLower) ||
            (a.wechatId && a.wechatId.toLowerCase() === queryLower),
        );

        const referredAgent: Agent = matchedInDb
          ? { ...matchedInDb }
          : {
              id: referredId,
              name: urlAgentName || "Representative",
              email: urlEmail,
              whatsapp: urlAgentWhatsApp || DEFAULT_WHATSAPP,
              contactPhone: urlAgentPhone || DEFAULT_PHONE,
              lineId: urlAgentLineId || "",
              wechatId: urlAgentWechatId || "",
              companyName: urlAgentCompanyName || "",
              companyAddress: urlAgentCompanyAddress || "",
              country: urlAgentCountry || "",
              taxId: urlAgentTaxId || "",
              coagents:
                urlCoagentId && urlCoagentName
                  ? [
                      {
                        id: urlCoagentId,
                        name: urlCoagentName,
                        phone: urlCoagentPhone || "",
                        createdAt: new Date().toISOString(),
                      },
                    ]
                  : [],
            };

        if (urlCoagentId) {
          console.log(
            "AgentContext: Detected coagent in referral URL:",
            urlCoagentId,
          );
          let coalObj: CoAgent | undefined;
          if (urlCoagentName) {
            coalObj = {
              id: urlCoagentId,
              name: urlCoagentName,
              phone: urlCoagentPhone || "",
              createdAt: new Date().toISOString(),
            };
          } else if (referredAgent.coagents) {
            const foundCo = referredAgent.coagents.find(
              (co) =>
                co.id === urlCoagentId ||
                (co.name || "").toLowerCase() === urlCoagentId.toLowerCase(),
            );
            if (foundCo) {
              coalObj = foundCo;
            }
          }
          if (coalObj) {
            console.log("AgentContext: Setting active coagent:", coalObj.name);
            setCurrentCoagent(coalObj);
            localStorage.setItem(
              "charter_active_coagent",
              JSON.stringify(coalObj),
            );
          }
        }

        console.log(
          "AgentContext: Setting referred agent:",
          referredAgent.name,
        );
        setCurrentAgent(referredAgent);

        const params2 = new URLSearchParams(window.location.search);
        if (params2.get("agent-portal") === "true") {
          setIsReferred(false);
          localStorage.removeItem("charter_agent_referred");
          clearCoagent();
        } else {
          setIsReferred(true);
          localStorage.setItem("charter_agent_referred", "true");
          localStorage.setItem("phuket_just_scanned_referral", "true");
        }

        localStorage.setItem(
          "charter_active_agent",
          JSON.stringify(referredAgent),
        );

        // Softly seed referred agent into dynamic agent list index if missing
        const existsInLocalDb = agents.some(
          (a) =>
            (a.email || "").toLowerCase() ===
            (referredAgent.email || "").toLowerCase(),
        );
        if (!existsInLocalDb) {
          const updatedDb = [referredAgent, ...agents];
          setAgents(updatedDb);
        }
      } else {
        // console.log("AgentContext: No URL referral parameters found. Restoring from storage.");
        const referredFlag = localStorage.getItem("charter_agent_referred");
        // console.log("AgentContext: referredFlag from storage:", referredFlag);

        if (storedActive) {
          try {
            const active: Agent = JSON.parse(storedActive);
            // console.log("AgentContext: Restoring active agent from storage:", active.name);
            // Clean up loaded session details for other agents
            if (active.email && !active.id) {
              active.id = (active.email || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "_");
            }

            // CRITICAL SAFEGUARD: If the session has a password or is logged in directly,
            // they are ALWAYS a fully authorized agent. Under no circumstances should they
            // be locked in isReferred guest mode toward themselves!
            if (active.password) {
              localStorage.removeItem("charter_agent_referred");
              localStorage.removeItem("phuket_just_scanned_referral");
              setIsReferred(false);
            } else {
              setIsReferred(referredFlag === "true");
            }

            setCurrentAgent(active);
            localStorage.setItem(
              "charter_active_agent",
              JSON.stringify(active),
            );
          } catch (jsonErr) {
            console.error("Error parsing stored active agent:", jsonErr);
            setIsReferred(referredFlag === "true");
            setCurrentAgent(null);
          }
        } else {
          setIsReferred(referredFlag === "true");
          setCurrentAgent(null);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("agent-portal") === "true") {
          setIsReferred(false);
          localStorage.removeItem("charter_agent_referred");
          clearCoagent();
        } else if (referredFlag === "true") {
          // Double verify if active agent has password
          if (storedActive) {
            try {
              const active = JSON.parse(storedActive);
              if (active.password) {
                setIsReferred(false);
                localStorage.removeItem("charter_agent_referred");
              } else {
                setIsReferred(true);
              }
            } catch (_) {
              setIsReferred(true);
            }
          } else {
            setIsReferred(true);
          }
        }
      }
    } catch (e) {
      console.error(
        "Failed to initialize agent database or parse URL parameters",
        e,
      );
    }
  }, [isInitialized, agents]);

  const login = async (userInput: string, password: string) => {
    const cleanInput = userInput.trim().toLowerCase();

    // First try locating via email or name or first name in local cache (candidate check for potential twins/duplicates)
    const candidates = agents.filter((a) => {
      const emailL = (a.email || "").toLowerCase();
      const nameL = (a.name || "").toLowerCase();
      const firstWord = nameL.split(/\s+/)[0];
      return (
        emailL === cleanInput ||
        nameL === cleanInput ||
        firstWord === cleanInput ||
        a.id === cleanInput
      );
    });

    // ============ SIGURNI PUT: Firebase Auth prvo ============
    // Prijelazno: ako Auth ne uspije (nemigriran agent), pada na staru
    // plaintext provjeru nize. Kad svi budu migrirani -> makni fallback.
    const loginEmail =
      candidates[0]?.email || (cleanInput.includes("@") ? cleanInput : "");
    if (loginEmail) {
      try {
        await signInWithEmailAndPassword(auth, loginEmail, password);
        const agentId = loginEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");
        let authAgent: Agent | undefined =
          candidates.find(
            (c) => (c.email || "").toLowerCase() === loginEmail.toLowerCase(),
          ) ||
          agents.find(
            (a) => (a.email || "").toLowerCase() === loginEmail.toLowerCase(),
          );
        if (!authAgent) {
          try {
            const snap = await getDoc(doc(db, "agents", agentId));
            if (snap.exists())
              authAgent = { ...(snap.data() as Agent), id: snap.id };
          } catch (_) {}
        }
        if (authAgent && authAgent.isActive !== false) {
          setCurrentAgent(authAgent);
          setIsReferred(false);
          localStorage.removeItem("charter_agent_referred");
          localStorage.removeItem("phuket_just_scanned_referral");
          localStorage.removeItem("phuket_charter_active_chat_id");
          localStorage.setItem(
            "charter_active_agent",
            JSON.stringify(authAgent),
          );
          return {
            success: true,
            message: `Welcome back, Representative ${authAgent.name || ""}!`,
          };
        }
      } catch (_authErr) {
        // Auth neuspjesan -> nastavi na staru provjeru (fallback)
      }
    }
    // ========================================================

    let found = candidates.find((c) => c.password === password);
    if (!found && candidates.length > 0) {
      found = candidates[0]; // fallback so password mismatch is reported on the primary account
    }

    // If not found locally, try Firestore using a query
    if (!found) {
      if (cleanInput === "vinko" || cleanInput === "vinko.mitar@gmail.com") {
        found = agents.find(
          (a) => (a.email || "").toLowerCase() === "vinko.mitar@gmail.com",
        );
      }
      if (!found) {
        try {
          const q = query(
            collection(db, "agents"),
            where("email", "==", cleanInput),
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            found = {
              ...(snapshot.docs[0].data() as Agent),
              id: snapshot.docs[0].id,
            };
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "agents_login_lookup");
        }
      }
    }

    if (!found || found.isActive === false) {
      return {
        success: false,
        message:
          "No such agent account found or account deactivated. Please register.",
      };
    }

    // Remove special bypass
    const isSpecialBypass = false;

    if (found.password && found.password !== password && !isSpecialBypass) {
      return {
        success: false,
        message: "Incorrect password. Please try again.",
      };
    }

    if (isSpecialBypass && found.password !== password) {
      found.password = password;
      const updated = agents.map((a) =>
        (a.email || "").toLowerCase() === "vinko.mitar@gmail.com"
          ? { ...a, password }
          : a,
      );
      setAgents(updated);
      try {
        const agentId = found.id || "vinko_mitar_gmail_com";
        await setDoc(doc(db, "agents", agentId), { password }, { merge: true });
        console.log(
          "Successfully self-healed Vinko's master key in Firestore!",
        );
      } catch (err) {
        console.warn("Failed self-healing Vinko password in Firestore:", err);
      }
    }

    // Try signing into Firebase Auth to populate request.auth for security rules
    try {
      const emailForSignIn = found.email || cleanInput;
      await signInWithEmailAndPassword(auth, emailForSignIn, password);
      console.log(
        "Successfully authenticated session with Firebase Auth under email: ",
        emailForSignIn,
      );
    } catch (authErr: any) {
      console.warn(
        "Soft Auth Notice: Could not sign in to Firebase Auth during local lookup transition:",
        authErr.message,
      );
    }

    setCurrentAgent(found);
    setIsReferred(false); // Logged in directly, not a referral

    // Clear lingering customer pairing triggers to prevent back-lock issues!
    localStorage.removeItem("charter_agent_referred");
    localStorage.removeItem("phuket_just_scanned_referral");
    localStorage.removeItem("phuket_charter_active_chat_id");

    localStorage.setItem("charter_active_agent", JSON.stringify(found));
    return {
      success: true,
      message: `Welcome back, Representative ${found.name}!`,
    };
  };

  const register = async (newAgent: Agent) => {
    const formattedEmail = newAgent.email.trim().toLowerCase();
    const exists = agents.some(
      (a) => (a.email || "").toLowerCase() === formattedEmail,
    );

    if (exists) {
      return {
        success: false,
        message: "An agent account with this email is already registered.",
      };
    }

    const agentId = formattedEmail.replace(/[^a-z0-9]/g, "_");
    const compiledAgent: Agent = {
      ...newAgent,
      id: agentId,
      email: formattedEmail,
      isActive: true,
    };

    try {
      await setDoc(doc(db, "agents", agentId), compiledAgent, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agents/${agentId}`);
      return {
        success: false,
        message: "Failed to save agent to the database. Registration aborted.",
      };
    }

    const updated = [...agents, compiledAgent];
    setAgents(updated);

    // Automatically log in the newly registered profile!
    setCurrentAgent(compiledAgent);
    setIsReferred(false);
    localStorage.setItem("charter_active_agent", JSON.stringify(compiledAgent));

    return {
      success: true,
      message: `Account registered! Profile session active for ${newAgent.name}.`,
    };
  };

  const logout = () => {
    // 1. Clear state
    setCurrentAgent(null);
    setIsReferred(false);
    clearCoagent(); // Ensure coagent is cleared too

    // 2. Clear persistence. Be thorough!
    localStorage.removeItem("charter_active_agent");
    localStorage.removeItem("charter_agent_referred");
    localStorage.removeItem("charter_active_coagent");

    // 3. Clear sessions
    signOut(auth).catch((error) =>
      console.error("Error signing out current agent:", error),
    );
  };

  const updateProfile = async (updatedFields: Partial<Agent>) => {
    if (!currentAgent) {
      return { success: false, message: "No active agent session detected." };
    }

    const modified = { ...currentAgent, ...updatedFields };
    setCurrentAgent(modified);
    localStorage.setItem("charter_active_agent", JSON.stringify(modified));

    // UVIJEK kanonski ID iz e-maila — currentAgent.id zna biti UID
    // pa upis ode u krivi dokument i izmjena "nestane".
    const agentId = (currentAgent.email || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "_");

    try {
      await setDoc(doc(db, "agents", agentId), updatedFields, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
    }

    const updatedList = agents.map((a) =>
      a.email.toLowerCase() === currentAgent.email.toLowerCase() ? modified : a,
    );

    setAgents(updatedList);
    localStorage.setItem("charter_agents_db", JSON.stringify(updatedList));

    return {
      success: true,
      message: "Your Broker Account details were updated successfully!",
    };
  };

  const normalizeToE164 = (phone: string, fallback: string) => {
    if (!phone) return fallback;
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.substring(2);
    }
    if (cleaned.startsWith("0")) {
      cleaned = "+66" + cleaned.substring(1);
    }
    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("66")) {
        cleaned = "+" + cleaned;
      } else {
        cleaned = "+66" + cleaned;
      }
    }
    return cleaned || fallback;
  };

  // Strip non-digits and normalize to E.164 for clean wa.me URLs and contact links
  const getNormalizedWhatsApp = () => {
    if (!currentAgent || !currentAgent.whatsapp)
      return normalizeToE164(DEFAULT_WHATSAPP, DEFAULT_WHATSAPP);
    return normalizeToE164(currentAgent.whatsapp, DEFAULT_WHATSAPP);
  };

  const getContactPhone = () => {
    if (!currentAgent || !currentAgent.contactPhone)
      return normalizeToE164(DEFAULT_PHONE, DEFAULT_PHONE);
    return normalizeToE164(currentAgent.contactPhone, DEFAULT_PHONE);
  };

  const adminResetPassword = async (email: string, newPassword?: string) => {
    const formattedEmail = email.trim().toLowerCase();
    const updatedPassword = newPassword || "password123";
    const agentId = formattedEmail.replace(/[^a-z0-9]/g, "_");

    try {
      await setDoc(
        doc(db, "agents", agentId),
        { password: updatedPassword },
        { merge: true },
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
    }

    const updatedList = agents.map((a) => {
      if ((a.email || "").toLowerCase() === formattedEmail) {
        return { ...a, password: updatedPassword };
      }
      return a;
    });

    setAgents(updatedList);
    localStorage.setItem("charter_agents_db", JSON.stringify(updatedList));

    if (
      currentAgent &&
      (currentAgent.email || "").toLowerCase() === formattedEmail
    ) {
      const active = { ...currentAgent, password: updatedPassword };
      setCurrentAgent(active);
      localStorage.setItem("charter_active_agent", JSON.stringify(active));
    }

    return {
      success: true,
      message: `Password reset to '${updatedPassword}' for ${email} in Firestore and database!`,
    };
  };

  const adminRemoveAgent = async (email: string) => {
    const formattedEmail = email.trim().toLowerCase();
    const agentId = formattedEmail.replace(/[^a-z0-9]/g, "_");

    try {
      await updateDoc(doc(db, "agents", agentId), { isActive: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
    }

    // Prevent removing essential system accounts if needed, but let's allow removal of any for now.
    const updatedList = agents.filter(
      (a) => (a.email || "").toLowerCase() !== formattedEmail,
    );

    setAgents(updatedList);
    localStorage.setItem("charter_agents_db", JSON.stringify(updatedList));

    if (
      currentAgent &&
      (currentAgent.email || "").toLowerCase() === formattedEmail
    ) {
      logout();
    }

    return {
      success: true,
      message: `Agent ${email} deactivated successfully!`,
    };
  };

  const toggleCoAdmin = async (email: string, newState: boolean) => {
    const formattedEmail = email.trim().toLowerCase();
    const agentId = formattedEmail.replace(/[^a-z0-9]/g, "_");

    try {
      await setDoc(
        doc(db, "agents", agentId),
        { isCoAdmin: newState },
        { merge: true },
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
      return {
        success: false,
        message: "Greška pri ažuriranju statusa Co-Admina.",
      };
    }

    const updatedList = agents.map((a) =>
      (a.email || "").toLowerCase() === formattedEmail
        ? { ...a, isCoAdmin: newState }
        : a,
    );
    setAgents(updatedList);
    localStorage.setItem("charter_agents_db", JSON.stringify(updatedList));

    if (
      currentAgent &&
      (currentAgent.email || "").toLowerCase() === formattedEmail
    ) {
      setCurrentAgent({ ...currentAgent, isCoAdmin: newState });
      localStorage.setItem(
        "charter_active_agent",
        JSON.stringify({ ...currentAgent, isCoAdmin: newState }),
      );
    }

    return {
      success: true,
      message: `Status Co-Admina za ${email} je uspješno promijenjen.`,
    };
  };

  const adminUpdateAgent = async (
    email: string,
    updatedFields: Partial<Agent>,
  ) => {
    const formattedEmail = email.trim().toLowerCase();
    const agentId = formattedEmail.replace(/[^a-z0-9]/g, "_");

    try {
      await setDoc(doc(db, "agents", agentId), updatedFields, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `agents/${agentId}`);
      return {
        success: false,
        message: "Error updating agent info in Firestore.",
      };
    }

    const updatedList = agents.map((a) => {
      if ((a.email || "").toLowerCase() === formattedEmail) {
        return { ...a, ...updatedFields };
      }
      return a;
    });

    setAgents(updatedList);
    localStorage.setItem("charter_agents_db", JSON.stringify(updatedList));

    if (
      currentAgent &&
      (currentAgent.email || "").toLowerCase() === formattedEmail
    ) {
      const active = { ...currentAgent, ...updatedFields };
      setCurrentAgent(active);
      localStorage.setItem("charter_active_agent", JSON.stringify(active));
    }

    return { success: true, message: `Successfully updated agent ${email}!` };
  };

  // Real-time synchronization of customer's active representative broker
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Only run for customers, do not run if logged in user has an agent email
        const isAgentAccount = agents.some(
          (a) =>
            (a.email || "").toLowerCase() === (user.email || "").toLowerCase(),
        );
        if (!isAgentAccount) {
          try {
            const customerRef = doc(db, "customers", user.uid);
            const snap = await getDoc(customerRef);
            if (snap.exists()) {
              const data = snap.data();
              try {
                localStorage.setItem(
                  `offline_customer_${user.uid}`,
                  JSON.stringify(data),
                );
              } catch (storageErr) {}

              if (currentAgent && isReferred) {
                // Customer has scanned a QR code or has a referral active in current session. Let's record it!
                try {
                  await updateDoc(customerRef, {
                    representativeBroker: currentAgent,
                    representativeBrokerId:
                      currentAgent.id ||
                      (currentAgent.email || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "_"),
                  });
                } catch (updateErr) {
                  console.warn(
                    "Could not record representative broker reference because the client is offline.",
                  );
                }
              } else if (data.representativeBroker) {
                // Restoring representative from customer's cloud database document!
                const savedBroker: Agent = data.representativeBroker;
                setCurrentAgent(savedBroker);
                setIsReferred(true);
                localStorage.setItem(
                  "charter_active_agent",
                  JSON.stringify(savedBroker),
                );
                localStorage.setItem("charter_agent_referred", "true");
              }
            }
          } catch (err: any) {
            console.warn(
              "Soft Offline Notice: broker syncing read error:",
              err.message,
            );
            // Attempt offline fallback from local Cache
            const localData = localStorage.getItem(
              `offline_customer_${user.uid}`,
            );
            if (localData) {
              try {
                const data = JSON.parse(localData);
                if (data.representativeBroker) {
                  const savedBroker: Agent = data.representativeBroker;
                  setCurrentAgent(savedBroker);
                  setIsReferred(true);
                  localStorage.setItem(
                    "charter_active_agent",
                    JSON.stringify(savedBroker),
                  );
                  localStorage.setItem("charter_agent_referred", "true");
                }
              } catch (e) {}
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentAgent, isReferred, agents]);

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        agents,
        currentCoagent,
        isReferred,
        isInitialized,
        login,
        register,
        logout,
        updateProfile,
        getNormalizedWhatsApp,
        getContactPhone,
        adminResetPassword,
        adminRemoveAgent,
        toggleCoAdmin,
        adminUpdateAgent,
        clearCoagent,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
};
