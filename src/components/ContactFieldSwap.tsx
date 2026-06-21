import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

const ContactFieldSwap: React.FC = () => {
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(false);

  const lookup = async () => {
    setBusy(true);
    setMsg("");
    setPreview(null);
    setConfirm(false);
    try {
      const em = email.trim().toLowerCase();
      const q = query(collection(db, "agents"), where("email", "==", em));
      const snap = await getDocs(q);
      if (snap.empty) {
        setMsg("Nema agenta s tim emailom.");
        return;
      }
      const d = snap.docs[0];
      setPreview({ _id: d.id, ...(d.data() as any) });
    } catch (err: any) {
      setMsg("Greska: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const swap = async () => {
    if (!preview) return;
    setConfirm(false);
    setBusy(true);
    try {
      await setDoc(
        doc(db, "agents", preview._id),
        { whatsapp: preview.lineId || "", lineId: preview.whatsapp || "" },
        { merge: true },
      );
      setMsg("Zamijenjeno. Osvjezi listu agenata.");
      setPreview({
        ...preview,
        whatsapp: preview.lineId || "",
        lineId: preview.whatsapp || "",
      });
    } catch (err: any) {
      setMsg("Greska pri spremanju: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm">
      <h2 className="font-bold text-base mb-2">Zamjena WhatsApp / LINE</h2>
      <div className="flex gap-2 mb-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="agent email (npr. umnad.thong@gmail.com)"
          className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white"
        />
        <button
          onClick={lookup}
          disabled={busy}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold disabled:opacity-50"
        >
          Nadji
        </button>
      </div>

      {preview && (
        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-xs space-y-1">
          <div>{preview.name || "?"}</div>
          <div>WhatsApp: {preview.whatsapp || "-"}</div>
          <div>LINE: {preview.lineId || "-"}</div>
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              disabled={busy}
              className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold disabled:opacity-50"
            >
              Zamijeni vrijednosti
            </button>
          ) : (
            <span className="flex gap-2 mt-2">
              <button
                onClick={swap}
                disabled={busy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded font-semibold disabled:opacity-50"
              >
                Sigurno? Zamijeni
              </button>
              <button
                onClick={() => setConfirm(false)}
                disabled={busy}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded font-semibold disabled:opacity-50"
              >
                Odustani
              </button>
            </span>
          )}
        </div>
      )}

      {msg && <div className="mt-2 text-amber-300 text-xs">{msg}</div>}
    </div>
  );
};

export default ContactFieldSwap;
