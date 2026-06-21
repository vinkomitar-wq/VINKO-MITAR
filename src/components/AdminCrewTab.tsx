import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  QrCode as QrCodeIcon,
  Check,
  MapPin,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CrewMemberCalendarModal } from "./CrewMemberCalendarModal";

export default function AdminCrewTab({
  onAlert,
}: {
  onAlert?: (msg: string) => void;
}) {
  const [basicCrew, setBasicCrew] = useState<any[]>([]);
  const [captains, setCaptains] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "Deckhand",
    phone: "",
    shipId: "", // Added shipId
    photoUrl: "", // Added photoUrl
    email: "", // Added login email
    password: "", // Added login password
    dbSource: "crewMembers",
  });

  const [ships, setShips] = useState<any[]>([]);

  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedCrewForModal, setSelectedCrewForModal] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    // Fetch ships/vessels list
    const q = query(collection(db, "fleet")); // Assuming fleet collection structure exists
    const unsub = onSnapshot(doc(db, "fleet", "vessels"), (doc) => {
      if (doc.exists()) {
        setShips(doc.data().list || []);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q1 = query(collection(db, "crewMembers"));
    const unsub1 = onSnapshot(q1, (snap) => {
      setBasicCrew(
        snap.docs.map((doc) => ({
          id: doc.id,
          dbSource: "crewMembers",
          ...doc.data(),
        })),
      );
    });

    const q2 = query(collection(db, "captains"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setCaptains(
        snap.docs.map((doc) => ({
          id: doc.id,
          dbSource: "captains",
          ...doc.data(),
        })),
      );
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const historicCrewFromLogs = logs
    .filter((log) => log.role !== "Passenger" && log.crewName && log.crewId)
    .reduce((acc, log) => {
      if (!acc.some((c: any) => c.id === log.crewId)) {
        acc.push({
          id: log.crewId,
          dbSource: "logs",
          name: log.crewName,
          role: log.role || "Crew",
          shipId: log.yachtId,
          isActive: true,
        });
      }
      return acc;
    }, [] as any[]);

  const discoveredCrew = historicCrewFromLogs.filter(
    (hc: any) =>
      !captains.find((c) => c.id === hc.id) &&
      !basicCrew.find((c) => c.id === hc.id),
  );

  const allCrew = [...captains, ...basicCrew, ...discoveredCrew];
  const crew =
    roleFilter === "All"
      ? allCrew
      : allCrew.filter((c) => c.role === roleFilter);

  useEffect(() => {
    const q = query(collection(db, "crewLogs"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(
        snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
      );
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanEmail = formData.email
        ? formData.email.trim().toLowerCase()
        : "";
      const crewId =
        formData.id ||
        (cleanEmail
          ? "crew_" + cleanEmail.replace(/[^a-z0-9]/g, "_")
          : `crew-${Date.now()}`);
      const collectionName =
        formData.role === "Captain"
          ? "captains"
          : formData.dbSource || "crewMembers";

      // If moving from crewMembers to captains or vice-versa, clean up the old one
      if (
        formData.id &&
        formData.dbSource &&
        formData.dbSource !== collectionName
      ) {
        await deleteDoc(doc(db, formData.dbSource, formData.id));
      }

      await setDoc(
        doc(db, collectionName, crewId),
        {
          id: crewId,
          uid: crewId,
          name: formData.name,
          role: formData.role,
          phone: formData.phone || "",
          shipId: formData.shipId || "",
          photoUrl: formData.photoUrl || "",
          email: cleanEmail,
          password: formData.password || "",
          isActive: true, // Mark as active
        },
        { merge: true },
      );

      setShowForm(false);
      setFormData({
        id: "",
        name: "",
        role: "Deckhand",
        phone: "",
        shipId: "",
        photoUrl: "",
        email: "",
        password: "",
        dbSource: "crewMembers",
      });
    } catch (err: any) {
      console.error("Save crew member error:", err);
      if (onAlert)
        onAlert(
          `Failed to save crew member: ${err.message || "Unknown error"}`,
        );
      else
        alert(`Failed to save crew member: ${err.message || "Unknown error"}`);
    }
  };

  const handleDelete = async (id: string, dbSource: string) => {
    try {
      await updateDoc(doc(db, dbSource, id), { isActive: false }); // Soft delete
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualLog = async (
    crewEntry: any,
    newStatus: "Boarded" | "Deboarded",
  ) => {
    try {
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "crewLogs", logId), {
        id: logId,
        crewId: crewEntry.id,
        crewName: crewEntry.name,
        role: crewEntry.role,
        timestamp: new Date().toISOString(),
        scannedByCaptainUid: "admin",
        scannedByCaptainName: "Admin Portal",
        yachtId: crewEntry.shipId || "",
        status: newStatus,
      });
      if (onAlert) onAlert(`Crew marked as ${newStatus}`);
      else alert(`Crew marked as ${newStatus}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      if (onAlert) onAlert("Failed to update crew status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          Crew Registry & Logs
        </h3>
        <button
          onClick={async () => {
            if (
              confirm(
                "Jeste li sigurni da želite obrisati apsolutno sve zapise posade, kapetane i logove iz Firebase-a? (Ovo je nepovratno!)",
              )
            ) {
              try {
                onAlert?.("Brisanje započeto, molimo sačekajte...");
                const collectionsToDelete = [
                  "crewMembers",
                  "captains",
                  "crewLogs",
                  "captain_shifts",
                ];
                for (const colName of collectionsToDelete) {
                  const snap = await getDocs(query(collection(db, colName)));
                  for (const docSnap of snap.docs) {
                    await deleteDoc(doc(db, colName, docSnap.id));
                  }
                }
                onAlert?.(
                  "Svi zapisi posade, kapetana i logova su uspješno izbrisani iz Firebase-a.",
                );
              } catch (err) {
                console.error(err);
                onAlert?.("Greška pri brisanju!");
              }
            }
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors mr-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Obriši Sve
        </button>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({
              id: "",
              name: "",
              role: "Deckhand",
              phone: "",
              shipId: "",
              photoUrl: "",
              email: "",
              password: "",
              dbSource: "crewMembers",
            });
          }}
          className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
        >
          {showForm ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {showForm ? "Cancel" : "Add Crew Member"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-slate-50 border border-slate-200 p-4 rounded-xs space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Captain">Captain</option>
                <option value="First Mate">First Mate</option>
                <option value="Deckhand">Deckhand</option>
                <option value="Host/Hostess">Host/Hostess</option>
                <option value="Chef">Chef</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="+66..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Photo (from ID)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({
                        ...formData,
                        photoUrl: reader.result as string,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Ship
              </label>
              <select
                value={formData.shipId}
                onChange={(e) =>
                  setFormData({ ...formData, shipId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select Ship</option>
                {ships.map((ship) => (
                  <option key={ship.id} value={ship.id}>
                    {ship.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Account Email (Login)
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="crew@yacht.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Account Password (Login)
              </label>
              <input
                type="text"
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xs px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Password for login"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xs text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Save Crew Member
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Registered Crew
            </h4>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-[10px] uppercase font-bold tracking-wider rounded-sm px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Roles</option>
              <option value="Captain">Captain</option>
              <option value="First Mate">First Mate</option>
              <option value="Deckhand">Deckhand</option>
              <option value="Stewardess">Stewardess</option>
              <option value="Hostess">Hostess</option>
              <option value="Chef">Chef</option>
              <option value="Engineer">Engineer</option>
            </select>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {crew.map((c) => (
              <div
                key={c.id + "_" + c.dbSource}
                className="bg-white border border-slate-200 rounded-sm p-4 flex gap-4 items-start shadow-sm hover:border-emerald-300 transition-colors"
              >
                {/* Photo layout on the Left */}
                <div className="shrink-0">
                  {c.photoUrl ? (
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className="h-16 w-16 object-cover rounded-sm border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded-sm flex flex-col items-center justify-center text-slate-400">
                      <Users className="h-5 w-5 text-slate-300" />
                      <span className="text-[7px] uppercase mt-1 font-extrabold tracking-tighter">
                        No Photo
                      </span>
                    </div>
                  )}
                </div>

                {/* Info layout in Context Center */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {c.name}
                        {c.isActive === false ? (
                          <span className="bg-rose-100 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider">
                            Blocked / Pending
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </h5>
                      <select
                        value={c.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          try {
                            const newCollection =
                              newRole === "Captain"
                                ? "captains"
                                : "crewMembers";
                            if (
                              c.dbSource &&
                              c.dbSource !== "logs" &&
                              newCollection !== c.dbSource
                            ) {
                              // Move to correct collection
                              const currentDocRef = doc(db, c.dbSource, c.id);
                              const newDocRef = doc(db, newCollection, c.id);

                              // Keep all existing fields except updating role
                              const { dbSource, ...restData } = c as any;
                              await setDoc(newDocRef, {
                                ...restData,
                                role: newRole,
                              });
                              await deleteDoc(currentDocRef);
                            } else {
                              const targetColl = newCollection;
                              const { dbSource, ...restData } = c as any;
                              await setDoc(
                                doc(db, targetColl, c.id),
                                { ...restData, role: newRole },
                                { merge: true },
                              );
                            }
                          } catch (err) {
                            console.error("Failed to update role:", err);
                            if (onAlert) onAlert("Error updating role.");
                            else alert("Error updating role.");
                          }
                        }}
                        className="block w-full bg-emerald-50 text-emerald-900 text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-wider mt-1 cursor-pointer hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        <option value="Captain">Captain</option>
                        <option value="First Mate">First Mate</option>
                        <option value="Deckhand">Deckhand</option>
                        <option value="Host/Hostess">Host/Hostess</option>
                        <option value="Chef">Chef</option>
                        <option value="Engineer">Engineer</option>
                      </select>

                      <select
                        value={c.shipId || ""}
                        onChange={async (e) => {
                          const newShipId = e.target.value;
                          try {
                            const targetColl =
                              c.dbSource === "captains"
                                ? "captains"
                                : "crewMembers";
                            const { dbSource, ...restData } = c as any;
                            await setDoc(
                              doc(db, targetColl, c.id),
                              { ...restData, shipId: newShipId },
                              { merge: true },
                            );
                          } catch (err) {
                            console.error("Failed to update ship:", err);
                            if (onAlert)
                              onAlert("Error updating ship assignment.");
                            else alert("Error updating ship assignment.");
                          }
                        }}
                        className="block w-full bg-sky-50 text-sky-900 text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-wider mt-2 cursor-pointer hover:bg-sky-100 transition-colors border border-sky-200"
                      >
                        <option value="">-- Assign Ship --</option>
                        {ships.map((ship) => (
                          <option key={ship.id} value={ship.id}>
                            {ship.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const newStatus =
                              c.isActive === false ? true : false;
                            const targetColl =
                              c.dbSource === "captains"
                                ? "captains"
                                : "crewMembers";
                            const { dbSource, ...restData } = c as any;
                            await setDoc(
                              doc(db, targetColl, c.id),
                              { ...restData, isActive: newStatus },
                              { merge: true },
                            );
                            if (onAlert)
                              onAlert(
                                `Crew member ${newStatus ? "Activated" : "Deactivated"}.`,
                              );
                          } catch (err) {
                            console.error(err);
                            if (onAlert) onAlert("Failed to change status.");
                          }
                        }}
                        className={`px-2 py-1 rounded-xs text-[9px] font-bold uppercase tracking-wider flex items-center transition-colors ${c.isActive === false ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200" : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"}`}
                      >
                        {c.isActive === false ? "Activate" : "Deactivate"}
                      </button>
                      <button
                        onClick={() => {
                          setFormData({
                            id: c.id,
                            name: c.name,
                            role: c.role,
                            phone: c.phone || "",
                            dbSource: c.dbSource || "crewMembers",
                            shipId: c.shipId || "",
                            photoUrl: c.photoUrl || "",
                            email: c.email || "",
                            password: c.password || "",
                          });
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to deactivate/delete this crew member? They will be kept in the admin page for 1 year before permanent deletion.",
                            )
                          ) {
                            try {
                              const targetColl =
                                c.dbSource === "captains"
                                  ? "captains"
                                  : "crewMembers";
                              const { dbSource, ...restData } = c as any;
                              await setDoc(
                                doc(db, targetColl, c.id),
                                { ...restData, isActive: false },
                                { merge: true },
                              );
                              if (onAlert) onAlert("Crew member deactivated.");
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] bg-slate-50 p-2 border border-slate-100 rounded-sm">
                    {c.phone && (
                      <p className="text-slate-500 font-mono">
                        <span className="font-bold uppercase tracking-wider text-slate-400">
                          Tel:
                        </span>{" "}
                        {c.phone}
                      </p>
                    )}
                    <p className="text-slate-600 font-sans">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        Email:
                      </span>{" "}
                      <span className="font-mono text-slate-700 select-all">
                        {c.email || "No email assigned"}
                      </span>
                    </p>
                    <p className="text-slate-600 font-sans">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        Pass:
                      </span>{" "}
                      <span className="font-mono text-slate-700 select-all">
                        {c.password || "No password"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {(() => {
                      const latestLog = logs.find((l) => l.crewId === c.id);
                      const isBoarded =
                        latestLog &&
                        latestLog.status !== "Disembarked" &&
                        latestLog.status !== "Deboarded";

                      return (
                        <>
                          {isBoarded ? (
                            <button
                              onClick={() => handleManualLog(c, "Deboarded")}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              <LogOut className="h-3 w-3" />
                              Force Disembark
                            </button>
                          ) : (
                            <button
                              onClick={() => handleManualLog(c, "Boarded")}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              <LogIn className="h-3 w-3" />
                              Manual Board
                            </button>
                          )}
                          {latestLog && (
                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter">
                              Last: {latestLog.status || "Boarded"}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setSelectedCrewForModal({
                                id: c.id,
                                name: c.name,
                              })
                            }
                            className="ml-auto bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <CalendarIcon className="h-3 w-3" />
                            Logs & Calendar
                          </button>
                          {c.deviceFingerprint && (
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Jeste li sigurni da želite ukloniti sigurnosnu zabranu uređaja za ovog člana? (Ovo mu omogućuje prijavu s novog mobitela)",
                                  )
                                ) {
                                  try {
                                    await updateDoc(
                                      doc(
                                        db,
                                        c.dbSource || "crewMembers",
                                        c.id,
                                      ),
                                      {
                                        deviceFingerprint: null,
                                      },
                                    );
                                    if (onAlert)
                                      onAlert("Zabrana uređaja uklonjena.");
                                  } catch (err) {
                                    console.error(err);
                                    if (onAlert)
                                      onAlert("Greška pri uklanjanju.");
                                  }
                                }
                              }}
                              className="ml-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              Unlock Device
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Are you sure you want to completely clear the boarding history logs for this crew member? This action cannot be undone.",
                                )
                              ) {
                                try {
                                  const qLogs = query(
                                    collection(db, "crewLogs"),
                                    where("crewId", "==", c.id),
                                  );
                                  const snapshot = await getDocs(qLogs);
                                  const deletePromises = snapshot.docs.map(
                                    (logDoc) =>
                                      deleteDoc(doc(db, "crewLogs", logDoc.id)),
                                  );
                                  await Promise.all(deletePromises);
                                  if (onAlert)
                                    onAlert("Boarding history cleared.");
                                } catch (err) {
                                  console.error(err);
                                  if (onAlert)
                                    onAlert("Error clearing history.");
                                }
                              }
                            }}
                            className="ml-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear Logs
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Scan QR code Badge on the Right */}
                <div className="bg-white p-1 rounded-sm border border-slate-200 shrink-0">
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app"}?scan=${encodeURIComponent(JSON.stringify({ type: "crew", id: c.id, name: c.name, role: c.role }))}`}
                    size={52}
                  />
                  <p className="text-[7px] text-center mt-0.5 text-slate-400 font-mono tracking-tighter uppercase font-bold">
                    SCAN
                  </p>
                </div>
              </div>
            ))}
            {crew.length === 0 && (
              <p className="text-xs text-slate-400 font-bold">
                No crew members registered yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Crew Boarding Logs
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-sm overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border-b last:border-b-0 border-slate-200 p-3 hover:bg-slate-100 transition-colors flex justify-between items-center"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">
                      {log.crewName}
                    </h5>
                    <p className="text-[10px] text-slate-500">{log.role}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1">
                      Kapetan: {log.scannedByCaptainName || "Sustav"} (Yacht:{" "}
                      {ships.find((s) => s.id === log.yachtId)?.name ||
                        log.yachtId ||
                        "N/A"}
                      )
                    </p>
                    {log.location && (
                      <a
                        href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-105 px-1.5 py-0.5 rounded text-[8px] font-semibold transition-all hover:scale-[1.01]"
                      >
                        <MapPin className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                        <span>
                          {log.locationName ||
                            `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}`}
                        </span>
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100 uppercase tracking-widest">
                      {log.status || "Boarded"}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-4 text-xs text-slate-400 text-center font-bold">
                  No crew logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedCrewForModal && (
        <CrewMemberCalendarModal
          crewId={selectedCrewForModal.id}
          crewName={selectedCrewForModal.name}
          logs={logs}
          onClose={() => setSelectedCrewForModal(null)}
        />
      )}
    </div>
  );
}
