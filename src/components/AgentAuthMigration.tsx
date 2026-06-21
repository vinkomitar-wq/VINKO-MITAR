import React, { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { initializeApp, deleteApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

interface LogLine {
  type: "ok" | "skip" | "fail";
  text: string;
}

const AgentAuthMigration: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [stats, setStats] = useState({ ok: 0, skip: 0, fail: 0, noPass: 0 });

  const add = (type: LogLine["type"], text: string) =>
    setLog((l) => [{ type, text }, ...l]);

  const run = async () => {
    setConfirm(false);
    setBusy(true);
    setDone(false);
    setLog([]);
    const counters = { ok: 0, skip: 0, fail: 0, noPass: 0 };

    const SEC_NAME = "migrator";
    const existing = getApps().find((a) => a.name === SEC_NAME);
    const secApp = existing || initializeApp(firebaseConfig as any, SEC_NAME);
    const secAuth = getAuth(secApp);

    try {
      const snap = await getDocs(collection(db, "agents"));
      const agents: any[] = [];
      snap.forEach((d) => agents.push({ _id: d.id, ...(d.data() as any) }));

      for (const a of agents) {
        const email = (a.email || "").trim().toLowerCase();
        const password = a.password;

        if (!email) continue;
        if (!password) {
          counters.noPass++;
          add("skip", `${email}: nema lozinke u bazi - preskoceno`);
          continue;
        }
        if (String(password).length < 6) {
          counters.fail++;
          add("fail", `${email}: lozinka kraca od 6 znakova - treba reset`);
          continue;
        }

        try {
          await createUserWithEmailAndPassword(secAuth, email, password);
          counters.ok++;
          add("ok", `${email}: Auth racun kreiran`);
          await signOut(secAuth).catch(() => {});
        } catch (err: any) {
          const code = err?.code || "";
          if (code === "auth/email-already-in-use") {
            counters.skip++;
            add("skip", `${email}: vec postoji Auth racun`);
          } else if (code === "auth/operation-not-allowed") {
            counters.fail++;
            add(
              "fail",
              `${email}: Email/Password prijava NIJE ukljucena u Firebase Auth! (Authentication -> Sign-in method -> Enable)`,
            );
          } else if (code === "auth/invalid-email") {
            counters.fail++;
            add("fail", `${email}: neispravan email format`);
          } else if (code === "auth/weak-password") {
            counters.fail++;
            add("fail", `${email}: preslaba lozinka - treba reset`);
          } else {
            counters.fail++;
            add("fail", `${email}: ${err?.message || code}`);
          }
        }
      }

      setStats({ ...counters });
      setDone(true);
      add(
        "ok",
        `Gotovo: ${counters.ok} kreirano, ${counters.skip} vec postojalo, ${counters.fail} greska, ${counters.noPass} bez lozinke.`,
      );
    } catch (err: any) {
      add("fail", "Greska pri citanju agenata: " + (err?.message || err));
    } finally {
      try {
        await signOut(secAuth).catch(() => {});
        if (!existing) await deleteApp(secApp);
      } catch (_) {}
      setBusy(false);
    }
  };

  const color = (t: LogLine["type"]) =>
    t === "ok"
      ? "text-emerald-300"
      : t === "skip"
        ? "text-slate-400"
        : "text-rose-300";

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm">
      <h2 className="font-bold text-base mb-1">Auth migracija - korak 1</h2>
      <p className="text-xs text-slate-400 mb-3">
        Kreira Firebase Auth racune iz postojecih agenata. Nista se ne brise.
        Ne izbacuje te iz admin sesije.
      </p>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          disabled={busy}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Migriram..." : "Pokreni migraciju"}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={busy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-semibold disabled:opacity-50"
          >
            Sigurno? Pokreni
          </button>
          <button
            onClick={() => setConfirm(false)}
            disabled={busy}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-white font-semibold disabled:opacity-50"
          >
            Odustani
          </button>
        </div>
      )}

      {done && (
        <div className="mt-3 flex gap-2 flex-wrap text-xs">
          <span className="px-2 py-1 bg-emerald-800 rounded">OK {stats.ok}</span>
          <span className="px-2 py-1 bg-slate-700 rounded">vec {stats.skip}</span>
          <span className="px-2 py-1 bg-rose-800 rounded">err {stats.fail}</span>
          <span className="px-2 py-1 bg-amber-800 rounded">
            bez-lozinke {stats.noPass}
          </span>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-3 p-2 bg-black/40 rounded text-xs font-mono space-y-0.5 max-h-64 overflow-auto">
          {log.map((l, i) => (
            <div key={i} className={color(l.type)}>
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentAuthMigration;
