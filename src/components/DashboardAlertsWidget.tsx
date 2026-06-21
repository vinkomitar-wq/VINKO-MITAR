import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { AlertTriangle, Bell, Info, ShieldAlert } from "lucide-react";

export default function DashboardAlertsWidget() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const qAlerts = query(
      collection(db, "adminAlerts"),
      orderBy("timestamp", "desc"),
      limit(5),
    );
    const unsub = onSnapshot(qAlerts, (snap) => {
      setAlerts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "security":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "system_test":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case "info":
        return <Info className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (alerts.length === 0) {
    return null; // hide if no alerts
  }

  return (
    <div className="bg-white border border-rose-200 rounded-sm shadow-xs p-5 mt-6 border-t-4 border-t-rose-500">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        Recent System & Security Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex gap-3 bg-slate-50 p-3 rounded-xs border border-slate-100"
          >
            <div className="pt-0.5">{getIcon(alert.type || "info")}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-xs font-bold text-slate-800 truncate">
                  {alert.title || "Alert"}
                </h4>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {alert.message}
              </p>
              {alert.details && (
                <pre className="mt-1.5 p-1.5 bg-white border border-slate-200 rounded-xs text-[9px] font-mono whitespace-pre-wrap text-slate-500 overflow-x-auto">
                  {alert.details}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
