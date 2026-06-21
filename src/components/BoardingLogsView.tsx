import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { RefreshCw, ClipboardList, MapPin, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VesselTrackingMap } from "./VesselTrackingMap";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface BoardingLogsViewProps {
  captainYachtId?: string;
  hideMap?: boolean;
  crewIdFilter?: string;
}

// Utility for relative time
function getRelativeTime(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `Just now`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export const BoardingLogsView: React.FC<BoardingLogsViewProps> = ({
  captainYachtId,
  hideMap,
  crewIdFilter,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "crewLogs"),
      orderBy("timestamp", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (crewIdFilter) {
          fetched = fetched.filter(
            (l: any) =>
              l.crewId === crewIdFilter ||
              l.crewId === `CAPTAIN-${crewIdFilter}` ||
              l.crewId === `CREW-${crewIdFilter}`,
          );
        } else if (captainYachtId) {
          fetched = fetched.filter((l: any) => l.yachtId === captainYachtId);
        }

        setLogs(fetched);
        setLoading(false);
        setRefreshing(false); // If manually refreshed, clear state
      },
      (error) => {
        console.error("Failed to listen to boarding logs:", error);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsubscribe();
  }, [captainYachtId]);

  const manualRefresh = () => {
    setRefreshing(true);
    // onSnapshot is already active, this is mostly visual feedback
    setTimeout(() => setRefreshing(false), 800);
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(20);
      doc.setTextColor("#064e3b");
      doc.text("Audit Boarding Logs", 14, 20);

      doc.setFontSize(11);
      doc.setTextColor("#475569");
      doc.text(`Vessel ID: ${captainYachtId || "All"}`, 14, 28);
      doc.text(`Total Records: ${logs.length}`, 14, 34);
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 40);

      const tableData = logs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.status === "Boarded"
          ? "BOARDED"
          : log.status === "Deboarded"
            ? "DISEMBARKED"
            : log.status || "LOGGED",
        log.crewName || "Unknown",
        log.role || "N/A",
        `${log.email || "N/A"} / ${log.phone || "N/A"}`,
        log.yachtId || "All",
        log.locationName ||
          (log.location
            ? `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}`
            : "Unknown"),
      ]);

      autoTable(doc, {
        startY: 48,
        head: [
          [
            "Time & Date",
            "Action",
            "Crew Member",
            "Role",
            "Contact (Email/Phone)",
            "Vessel",
            "Location",
          ],
        ],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [6, 78, 59],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(
        `Audit_Boarding_Logs_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (e) {
      console.error("PDF generator failed", e);
      alert("Error generating PDF.");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-emerald-600 shrink-0" />
            Audit Boarding Logs
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Recent boarding and disembarking actions
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={generatePDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-sm transition-colors"
          >
            <Download className="h-3 w-3" />
            Export PDF
          </button>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-400 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {!hideMap && (
        <div className="mb-4">
          <VesselTrackingMap limitPoints={50} vesselId={captainYachtId} />
        </div>
      )}

      <div className="bg-slate-50 rounded-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[10px] text-slate-500 font-mono animate-pulse uppercase tracking-wider">
            Loading Audit Trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-[10px] text-slate-500 uppercase tracking-wider">
            No boarding activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 max-h-[60vh] overflow-y-auto">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  key={log.id}
                  className="p-3 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 text-[8px] font-black uppercase font-mono tracking-wider rounded-sm ${
                          log.status === "Boarded"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : log.status === "Deboarded"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {log.status || "Unknown"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800">
                        {log.crewName || "Unknown Name"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      <strong className="text-slate-500 mr-1">
                        {getRelativeTime(log.timestamp)}
                      </strong>{" "}
                      &bull;{" "}
                      {new Date(log.timestamp).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-2 text-[9px] text-slate-500 font-sans">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Role:</strong> {log.role || "N/A"}
                      </span>
                      <span className="font-mono text-[8px] text-slate-400">
                        ID: {log.id}
                      </span>
                    </div>
                    {(log.email || log.phone) && (
                      <div className="flex gap-2 items-center text-[9px] text-slate-500 mt-0.5">
                        {log.email && (
                          <span>
                            <strong>Email:</strong> {log.email}
                          </span>
                        )}
                        {log.phone && (
                          <span>
                            <strong>Phone:</strong> {log.phone}
                          </span>
                        )}
                      </div>
                    )}
                    {log.location && (
                      <div className="flex gap-1 items-center font-mono mt-1 pt-1 border-t border-slate-200/60">
                        <MapPin className="h-2.5 w-2.5 text-slate-400" />
                        <span>
                          {log.location.lat.toFixed(5)},{" "}
                          {log.location.lng.toFixed(5)}
                        </span>
                        {log.locationName && (
                          <span className="ml-1 text-slate-400 truncate">
                            ({log.locationName})
                          </span>
                        )}
                      </div>
                    )}
                    {log.notes && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 italic text-slate-600 line-clamp-2">
                        {log.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
