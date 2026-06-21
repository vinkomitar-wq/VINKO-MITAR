import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

interface RawAgent {
  _docId: string;
  name?: string;
  email?: string;
  password?: string;
  whatsapp?: string;
  lineId?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  [key: string]: any;
}

const AgentDebugPanel: React.FC = () => {
  const [rows, setRows] = useState<RawAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "agents"));
      const all: RawAgent[] = [];
      snap.forEach((d) => {
        all.push({ _docId: d.id, ...(d.data() as any) });
      });
      all.sort((a, b) => {
        const ai = a.isActive === false ? 0 : 1;
        const bi = b.isActive === false ? 0 : 1;
        if (ai !== bi) return ai - bi;
        return (a.email || "").localeCompare(b.email || "");
      });
      setRows(all);
    } catch (err: any) {
      setError(err?.message || "Greska pri citanju.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reactivate = async (docId: string) => {
    setError("");
    try {
      await setDoc(doc(db, "agents", docId), { isActive: true }, { merge: true });
      await load();
    } catch (err: any) {
      setError("Greska pri reaktivaciji: " + (err?.message || err));
    }
  };

  const emailCounts: Record<string, number> = {};
  rows.forEach((r) => {
    const e = (r.email || "").toLowerCase();
    if (e) emailCounts[e] = (emailCounts[e] || 0) + 1;
  });

  const f = filter.trim().toLowerCase();
  const visible = rows.filter((r) =>
    !f
      ? true
      : (r.email || "").toLowerCase().includes(f) ||
        (r.name || "").toLowerCase().includes(f) ||
        (r._docId || "").toLowerCase().includes(f),
  );

  const total = rows.length;
  const inactive = rows.filter((r) => r.isActive === false).length;
  const dupEmails = Object.values(emailCounts).filter((c) => c > 1).length;

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-bold text-base">Agents - svi dokumenti</h2>
        <button
          onClick={load}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold"
        >
          {loading ? "Ucitavam..." : "Osvjezi"}
        </button>
      </div>

      <div className="flex gap-3 mb-3 text-xs flex-wrap">
        <span className="px-2 py-1 bg-slate-700 rounded">Ukupno: <b>{total}</b></span>
        <span className="px-2 py-1 bg-amber-700 rounded">Neaktivni: <b>{inactive}</b></span>
        <span className="px-2 py-1 bg-rose-700 rounded">Email duplikati: <b>{dupEmails}</b></span>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Trazi (npr. chan, umnad, email...)"
        className="w-full mb-3 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white"
      />

      {error && (
        <div className="mb-3 p-2 bg-rose-900 rounded text-rose-100">{error}</div>
      )}

      <div className="space-y-2">
        {visible.map((r) => {
          const isInactive = r.isActive === false;
          const isDup = (emailCounts[(r.email || "").toLowerCase()] || 0) > 1;
          return (
            <div
              key={r._docId}
              className={`p-3 rounded border ${
                isInactive ? "bg-amber-950 border-amber-600" : "bg-slate-800 border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-semibold">
                  {r.name || "(bez imena)"}{" "}
                  {r.isAdmin && <span className="text-yellow-400 text-xs">ADMIN</span>}
                </div>
                <div className="flex gap-1.5 items-center">
                  {isInactive ? (
                    <span className="px-2 py-0.5 bg-amber-600 rounded text-xs">isActive: false</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-700 rounded text-xs">aktivan</span>
                  )}
                  {isDup && <span className="px-2 py-0.5 bg-rose-600 rounded text-xs">DUPLIKAT</span>}
                </div>
              </div>

              <div className="mt-1 text-xs text-slate-300 space-y-0.5">
                <div>email: {r.email || "-"}</div>
                <div>doc: {r._docId}</div>
                <div>
                  lozinka: {r.password ? "postoji" : "-"} - WA {r.whatsapp || "-"} - LINE: {r.lineId || "-"}
                </div>
              </div>

              {isInactive && (
                <button
                  onClick={() => reactivate(r._docId)}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold text-xs"
                >
                  Reaktiviraj
                </button>
              )}
            </div>
          );
        })}
        {!loading && visible.length === 0 && (
          <div className="text-slate-400 text-center py-4">Nema rezultata.</div>
        )}
      </div>
    </div>
  );
};

export default AgentDebugPanel;
