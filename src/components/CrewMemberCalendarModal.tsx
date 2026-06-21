import React, { useMemo } from "react";
import {
  X,
  Download,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CrewLog {
  id: string;
  crewId: string;
  crewName: string;
  role?: string;
  email?: string;
  phone?: string;
  status: string;
  timestamp: string;
  yachtId?: string;
  location?: { lat: number; lng: number };
  locationName?: string;
  scannedByCaptainName?: string;
  notes?: string;
}

interface CrewMemberCalendarModalProps {
  crewId: string;
  crewName: string;
  logs: CrewLog[];
  onClose: () => void;
}

export const CrewMemberCalendarModal: React.FC<
  CrewMemberCalendarModalProps
> = ({ crewId, crewName, logs, onClose }) => {
  const sortedLogs = useMemo(() => {
    return [...logs]
      .filter((l) => l.crewId === crewId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [logs, crewId]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(20);
      doc.setTextColor("#064e3b");
      doc.text("Evidencija Radnog Vremena (Crew Logs)", 14, 20);

      doc.setFontSize(11);
      doc.setTextColor("#475569");
      doc.text(`Clan Posade: ${crewName}`, 14, 28);
      doc.text(`Ukupno Zabiljezbi: ${sortedLogs.length}`, 14, 34);
      doc.text(`Datum Izvoza: ${new Date().toLocaleString()}`, 14, 40);

      const tableData = sortedLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.status === "Boarded"
          ? "UKRCAJ (Boarded)"
          : log.status === "Deboarded"
            ? "ISKRCANJE (Deboarded)"
            : log.status || "Zabiljezeno",
        log.yachtId || "Sve jahte",
        log.scannedByCaptainName || "Sustav",
        log.locationName ||
          (log.location
            ? `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}`
            : "Nepoznato"),
        `${log.email || "N/A"} / ${log.phone || "N/A"}`,
      ]);

      autoTable(doc, {
        startY: 48,
        head: [
          [
            "Vrijeme i Datum",
            "Akcija",
            "Plovilo",
            "Skenirao / Registrirao",
            "Lokacija",
            "Kontakt (Email/Tel)",
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
        `Zapisnik_Posade_${crewName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (e) {
      console.error("PDF generator failed", e);
      alert("Error generating PDF.");
    }
  };

  // Basic calendar view
  // We can group by day
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: CrewLog[] } = {};
    sortedLogs.forEach((log) => {
      const d = new Date(log.timestamp).toLocaleDateString([], {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!groups[d]) groups[d] = [];
      groups[d].push(log);
    });
    return groups;
  }, [sortedLogs]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col font-sans overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {crewName} - Logs & Calendar
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Viewing boarding and disembarkation history
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {sortedLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              No logs found for this crew member.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDay).map(
                ([day, logsOfDay]: [string, any]) => (
                  <div
                    key={day}
                    className="bg-white border text-sm border-slate-200 rounded-md overflow-hidden shadow-xs"
                  >
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-xs">
                      {day}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {logsOfDay.map((log: any) => {
                        const isBoarding =
                          log.status === "Boarded" || log.status === "Scanned";
                        const isDeboarding = log.status === "Deboarded";

                        return (
                          <div
                            key={log.id}
                            className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50"
                          >
                            <div className="w-24 shrink-0 flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>

                            <div className="w-32 shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                                  isBoarding
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                    : isDeboarding
                                      ? "bg-amber-50 text-amber-800 border-amber-100"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {log.status === "Boarded"
                                  ? "UKRCAJ"
                                  : log.status === "Deboarded"
                                    ? "ISKRCANJE"
                                    : log.status || "ZABILJEŽENO"}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">
                                  {log.locationName ||
                                    (log.location
                                      ? `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}`
                                      : "Nepoznato / No GPS")}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                <strong>Plovilo:</strong> {log.yachtId || "N/A"}{" "}
                                &nbsp;|&nbsp; <strong>Skenirao:</strong>{" "}
                                {log.scannedByCaptainName || "Sustav"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
