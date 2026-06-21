import React, { useState } from "react";
import {
  X,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { db } from "../firebase";
import { useIsAdmin } from "../useIsAdmin";
import { doc, setDoc, getDoc } from "firebase/firestore";

const blank = {
  name: "",
  email: "",
  password: "",
  lineId: "",
  whatsapp: "",
  contactPhone: "",
  companyName: "",
  isAdmin: false,
};

// Self-contained: renders a floating "Add Agent" button + the modal + all logic.
// Writes straight to Firestore (does NOT touch auth), so your admin session stays intact.
export default function AddAgentManager({
  onAdded,
}: {
  onAdded?: (a: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const isRealAdmin = useIsAdmin();

  const set = (k: keyof typeof blank, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));
  const slug = (email: string) =>
    email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

  const close = () => {
    setOpen(false);
    setForm({ ...blank });
    setError(null);
    setDone(false);
    setBusy(false);
  };

  const submit = async () => {
    if (!isRealAdmin) {
      setError("You do not have permission to add agents.");
      return;
    }
    setError(null);
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) return setError("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Enter a valid email address.");

    const id = slug(email);
    setBusy(true);
    try {
      const existing = await getDoc(doc(db, "agents", id));
      if (existing.exists()) {
        setBusy(false);
        return setError("An agent with this email already exists.");
      }
      const record: any = {
        id,
        name,
        email,
        lineId: form.lineId.trim(),
        whatsapp: form.whatsapp.trim(),
        contactPhone: form.contactPhone.trim(),
        companyName: form.companyName.trim(),
        isActive: true,
        isAdmin: form.isAdmin,
      };
      if (form.password.trim()) record.password = form.password.trim();

      await setDoc(doc(db, "agents", id), record, { merge: true });
      setDone(true);
      onAdded?.(record);
    } catch (e: any) {
      setError(
        e?.code === "permission-denied"
          ? "Permission denied — make sure you're logged in as admin."
          : e?.message || "Failed to save agent.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[7500] px-4 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-2xl hover:bg-emerald-700 cursor-pointer flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" /> Add Agent
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-md bg-white rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-[#0F172A] text-white flex justify-between items-center shrink-0">
              <h2 className="text-base font-serif italic flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                Add New Agent
              </h2>
              <button
                onClick={close}
                className="p-1 hover:bg-slate-800 rounded-xs text-slate-300 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50 overflow-y-auto">
              {done ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">
                    Agent saved.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Reload the portal to see them in the list.
                  </p>
                  <button
                    onClick={close}
                    className="mt-5 px-5 py-2 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-slate-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="flex items-start gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xs border border-red-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {(
                    [
                      ["name", "Name *", "text", "Chan"],
                      ["email", "Email *", "email", "umnad.thong@gmail.com"],
                      ["lineId", "LINE ID", "text", "+66656463528"],
                      ["whatsapp", "WhatsApp (optional)", "text", ""],
                      ["contactPhone", "Phone", "text", "+66656463528"],
                      ["companyName", "Company (optional)", "text", ""],
                      ["password", "Login password (optional)", "text", ""],
                    ] as const
                  ).map(([key, label, type, ph]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={(form as any)[key]}
                        placeholder={ph}
                        onChange={(e) => set(key as any, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xs text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isAdmin}
                      onChange={(e) => set("isAdmin", e.target.checked)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    Grant admin privileges
                  </label>

                  <button
                    onClick={submit}
                    disabled={busy}
                    className="w-full py-2.5 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-slate-800 transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {busy ? "Saving…" : "Save Agent"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
