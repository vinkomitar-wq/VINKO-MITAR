import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export default function AdminAlertsTab() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const qAlerts = query(
      collection(db, "adminAlerts"),
      orderBy("timestamp", "desc"),
    );
    const unsub = onSnapshot(qAlerts, (snap) => {
      setAlerts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const markAsRead = async (id: string, currentRead: boolean) => {
    try {
      await updateDoc(doc(db, "adminAlerts", id), { read: !currentRead });
    } catch (e) {
      console.error("Failed to update alert:", e);
    }
  };

  const deleteAlert = async (id: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      try {
        await deleteDoc(doc(db, "adminAlerts", id));
      } catch (e) {
        console.error("Failed to delete alert:", e);
      }
    }
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to delete ALL alerts?")) {
      alerts.forEach((alert) => deleteDoc(doc(db, "adminAlerts", alert.id)));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "security":
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case "system_test":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case "info":
        return <Info className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-600" />
            System Alerts & Security Log
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Review system alerts, AI tests, and security notifications.
          </p>
        </div>

        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border text-left border-slate-200 rounded-lg shadow-sm">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-sm">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-200" />
            No active alerts or system notifications.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 flex gap-4 transition-colors ${alert.read ? "bg-white opacity-70" : "bg-rose-50/30"}`}
              >
                <div className="pt-1">{getIcon(alert.type || "info")}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4
                        className={`text-sm font-bold ${alert.read ? "text-slate-600" : "text-slate-900"}`}
                      >
                        {alert.message}
                      </h4>
                      {alert.details && (
                        <p className="mt-1 text-xs text-slate-500 font-mono mt-2 break-all whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">
                          {alert.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => markAsRead(alert.id, alert.read)}
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${alert.read ? "text-emerald-600 hover:text-emerald-700" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {alert.read ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
