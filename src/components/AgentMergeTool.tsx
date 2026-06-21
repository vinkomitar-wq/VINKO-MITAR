import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

type RawAgent = { _docId: string; [k: string]: any };

interface Plan {
  email: string;
  targetId: string;
  baseExists: boolean;
  merged: Record<string, any>;
  removeIds: string[];
  conflicts: string[];
  count: number;
}

const sanitize = (email: string) =>
  email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

const isEmpty = (v: any) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0);

const CONFLICT_KEYS = ["password", "whatsapp", "contactPhone", "lineId", "name"];

const AgentMergeTool: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const addLog = (m: string) => setLog((l) => [m, ...l]);

  const scan = async () => {
    setBusy(true);
    setLog([]);
    setScanned(false);
    setConfirmAll(false);
    setConfirmId(null);
    try {
      const snap = await getDocs(collection(db, "agents"));
      const all: RawAgent[] = [];
      snap.forEach((d) => all.push({ _docId: d.id, ...(d.data() as any) }));

      const byEmail: Record<string, RawAgent[]> = {};
      all.forEach((a) => {
        const em = (a.email || "").toLowerCase().trim();
        if (!em) return;
        (byEmail[em] = byEmail[em] || []).push(a);
      });

      const result: Plan[] = [];
      for (const [em, list] of Object.entries(byEmail)) {
        const targetId = sanitize(em);
        if (list.length === 1 && list[0]._docId === targetId) continue;

        const ordered = [...list].sort((a, b) => {
          if (a._docId === targetId) return -1;
          if (b._docId === targetId) return 1;
          return Object.keys(b).length - Object.keys(a).length;
        });

        const merged: Record<string, any> = {};
        const conflicts: string[] = [];
        const coagentMap: Record<string, any> = {};

        ordered.forEach((rec) => {
          Object.keys(rec).forEach((k) => {
            if (k === "_docId") return;
            if (k === "coagents") {
              (rec.coagents || []).forEach((c: any) => {
                if (c && c.id && !coagentMap[c.id]) coagentMap[c.id] = c;
              });
              return;
            }
            const val = rec[k];
            if (isEmpty(val)) return;
            if (isEmpty(merged[k])) {
              merged[k] = val;
            } else if (merged[k] !== val && CONFLICT_KEYS.includes(k)) {
              conflicts.push(`${k}: zadrzano "${merged[k]}", ignoriran "${val}"`);
            }
          });
        });

        if (Object.keys(coagentMap).length) {
          merged.coagents = Object.values(coagentMap);
        }
        merged.id = targetId;
        merged.email = em;
        merged.isActive = true;

        const removeIds = list
          .map((r) => r._docId)
          .filter((id) => id !== targetId);

        result.push({
          email: em,
          targetId,
          baseExists: list.some((r) => r._docId === targetId),
          merged,
          removeIds,
          conflicts,
          count: list.length,
        });
      }

      setPlans(result);
      setScanned(true);
      addLog(
        result.length === 0
          ? "OK Nema duplikata ni krivo keyiranih agenata."
          : `Pronadjeno ${result.length} email(ova) za sredjivanje.`,
      );
    } catch (err: any) {
      addLog("ERR Greska pri skeniranju: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const applyOne = async (plan: Plan) => {
    await setDoc(doc(db, "agents", plan.targetId), plan.merged, { merge: true });
    for (const id of plan.removeIds) {
      await deleteDoc(doc(db, "agents", id));
    }
  };

  const runOne = async (p: Plan) => {
    setConfirmId(null);
    setBusy(true);
    try {
      await applyOne(p);
      addLog(`OK ${p.email}: spojeno.`);
      await scan();
    } catch (err: any) {
      addLog(`ERR ${p.email}: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    setConfirmAll(false);
    setBusy(true);
    try {
      for (const plan of plans) {
        try {
          await applyOne(plan);
          addLog(
            `OK ${plan.email}: spojeno u ${plan.targetId}, obrisano ${plan.removeIds.length} duplikat(a).`,
          );
        } catch (err: any) {
          addLog(`ERR ${plan.email}: ${err?.message || err}`);
        }
      }
      try {
        localStorage.removeItem("charter_agents_db");
      } catch (_) {}
      addLog("Gotovo. Osvjezi stranicu za cistu listu.");
      await scan();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-bold text-base">Spajanje duplikata agenata</h2>
        <button
          onClick={scan}
          disabled={busy}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Radim..." : "1. Skeniraj"}
        </button>
      </div>

      {scanned && plans.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-amber-300">
            {plans.length} email(ova) za sredjivanje
          </span>
          {!confirmAll ? (
            <button
              onClick={() => setConfirmAll(true)}
              disabled={busy}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold disabled:opacity-50"
            >
              2. Spoji sve
            </button>
          ) : (
            <span className="flex gap-2">
              <button
                onClick={runAll}
                disabled={busy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold disabled:opacity-50"
              >
                Sigurno? Spoji
              </button>
              <button
                onClick={() => setConfirmAll(false)}
                disabled={busy}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white font-semibold disabled:opacity-50"
              >
                Odustani
              </button>
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {plans.map((p) => (
          <div
            key={p.targetId}
            className="p-3 rounded border bg-slate-800 border-slate-700"
          >
            <div className="font-semibold">{p.email}</div>
            <div className="text-xs text-slate-300 mt-1 space-y-0.5">
              <div>
                dokumenata: <b>{p.count}</b> - glavni id <code>{p.targetId}</code>
                {!p.baseExists && (
                  <span className="text-sky-400"> (kreira se novi)</span>
                )}
              </div>
              <div>
                brise se:{" "}
                {p.removeIds.length ? <code>{p.removeIds.join(", ")}</code> : "-"}
              </div>
              <div>
                ostaje: {p.merged.name || "?"} - {p.merged.password ? "lozinka ok" : "bez lozinke"} - WA {p.merged.whatsapp || "-"} - LINE {p.merged.lineId || "-"}
              </div>
              {p.conflicts.length > 0 && (
                <div className="mt-1 p-1.5 bg-amber-950 border border-amber-700 rounded text-amber-200">
                  Konflikt (provjeri):
                  {p.conflicts.map((c, i) => (
                    <div key={i}>- {c}</div>
                  ))}
                </div>
              )}
            </div>
            {confirmId === p.targetId ? (
              <span className="flex gap-2 mt-2">
                <button
                  onClick={() => runOne(p)}
                  disabled={busy}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-semibold text-xs disabled:opacity-50"
                >
                  Sigurno? Spoji
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={busy}
                  className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white font-semibold text-xs disabled:opacity-50"
                >
                  Odustani
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmId(p.targetId)}
                disabled={busy}
                className="mt-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-semibold text-xs disabled:opacity-50"
              >
                Spoji samo ovog
              </button>
            )}
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="mt-3 p-2 bg-black/40 rounded text-xs font-mono space-y-0.5 max-h-48 overflow-auto">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentMergeTool;
