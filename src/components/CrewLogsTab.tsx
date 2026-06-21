import React, { useState, useMemo, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  Table,
  MapPin,
  Watch,
  ShieldCheck,
  Trash2,
  Cloud,
  FileCode2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { reverseGeocode, GPSCoords } from "../utils/geocoding";
import { CATAMARANS } from "../data";

interface Props {
  isAdmin?: boolean;
}

interface BoardingSession {
  crewId: string;
  crewName: string;
  role: string;
  email?: string;
  phone?: string;
  yachtId: string;
  boardedAt: string | null;
  boardedLocation: GPSCoords | null;
  boardedLocationName: string | null;
  deboardedAt: string | null;
  deboardedLocation: GPSCoords | null;
  deboardedLocationName: string | null;
  scannedByCaptainName: string | null;
  isSimulated?: boolean;
  notes?: string;
}

export default function CrewLogsTab({ isAdmin = false }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "sessions" | "calendar">(
    "sessions",
  );
  const [filterShip, setFilterShip] = useState<string>("");
  const [resolvedAddresses, setResolvedAddresses] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const qLogs = query(collection(db, "crewLogs"));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(
        snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
      );
    });

    return () => unsubLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!filterShip) return logs;
    return logs.filter((log) => log.yachtId === filterShip);
  }, [logs, filterShip]);

  // Handle dynamic reverse geocoding on any coordinate that doesn't have a lookup yet
  useEffect(() => {
    let active = true;
    const processLocs = async () => {
      const keysToResolve: Array<{ key: string; coords: GPSCoords }> = [];
      const currentAddresses = { ...resolvedAddresses };

      for (const log of filteredLogs) {
        if (
          log.location &&
          typeof log.location.lat === "number" &&
          typeof log.location.lng === "number"
        ) {
          const key = `${log.location.lat.toFixed(5)},${log.location.lng.toFixed(5)}`;

          if (log.locationName) {
            currentAddresses[key] = log.locationName;
          } else if (!currentAddresses[key]) {
            currentAddresses[key] = "Učitavanje lokacije...";
            keysToResolve.push({ key, coords: log.location });
          }
        }
      }

      if (keysToResolve.length > 0 && active) {
        setResolvedAddresses({ ...currentAddresses });

        // Resolve asynchronously one by one
        for (const item of keysToResolve) {
          try {
            const address = await reverseGeocode(item.coords);
            if (active) {
              setResolvedAddresses((prev) => ({
                ...prev,
                [item.key]: address,
              }));
            }
          } catch (e) {
            console.error("Failed reverse geocoding inside list loop:", e);
          }
        }
      } else if (
        Object.keys(currentAddresses).length >
          Object.keys(resolvedAddresses).length &&
        active
      ) {
        setResolvedAddresses(currentAddresses);
      }
    };

    processLocs();
    return () => {
      active = false;
    };
  }, [filteredLogs]);

  // Helper to easily get a coordinates' name from the pre-db state or the geocoding state
  const getLocationName = (log: any): string => {
    if (log.locationName) return log.locationName;
    if (log.location) {
      const key = `${log.location.lat.toFixed(5)},${log.location.lng.toFixed(5)}`;
      return resolvedAddresses[key] || "Traženje lokacije...";
    }
    return "Nije zabilježeno";
  };

  // Group logs into paired boarding/deboarding sessions
  const boardingSessions = useMemo(() => {
    const crewGroups: Record<string, any[]> = {};
    const sortedLogsAsc = [...filteredLogs].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    for (const log of sortedLogsAsc) {
      if (log.role === "Passenger") continue; // Keep focused purely on professional Crew members
      const key = log.crewId || log.crewName;
      if (!crewGroups[key]) {
        crewGroups[key] = [];
      }
      crewGroups[key].push(log);
    }

    const list: BoardingSession[] = [];

    for (const key in crewGroups) {
      const crewLogs = crewGroups[key];
      let currentSession: BoardingSession | null = null;

      for (const log of crewLogs) {
        const isBoarding = log.status === "Boarded" || log.status === "Scanned";
        const isDeboarding = log.status === "Deboarded";
        const isSimulated =
          log.notes?.includes("Automated") ||
          log.notes?.includes("Test") ||
          log.crewName?.includes("Lutka Test") ||
          log.notes?.includes("Simulat") ||
          log.notes?.toLowerCase().includes("fake");

        if (isBoarding) {
          if (currentSession) {
            // Unpaired boarding shift; push incomplete row
            list.push(currentSession);
          }
          currentSession = {
            crewId: log.crewId || "",
            crewName: log.crewName,
            role: log.role || "Crew",
            email: log.email || "",
            phone: log.phone || "",
            yachtId: log.yachtId,
            boardedAt: log.timestamp,
            boardedLocation: log.location || null,
            boardedLocationName: getLocationName(log),
            deboardedAt: null,
            deboardedLocation: null,
            deboardedLocationName: null,
            scannedByCaptainName: log.scannedByCaptainName || "Sustav",
            isSimulated: !!isSimulated,
            notes: log.notes,
          };
        } else if (isDeboarding) {
          if (currentSession) {
            currentSession.deboardedAt = log.timestamp;
            currentSession.deboardedLocation = log.location || null;
            currentSession.deboardedLocationName = getLocationName(log);
            if (isSimulated) currentSession.isSimulated = true;
            list.push(currentSession);
            currentSession = null;
          } else {
            // Unpaired Deboarding
            list.push({
              crewId: log.crewId || "",
              crewName: log.crewName,
              role: log.role || "Crew",
              email: log.email || "",
              phone: log.phone || "",
              yachtId: log.yachtId,
              boardedAt: null,
              boardedLocation: null,
              boardedLocationName: null,
              deboardedAt: log.timestamp,
              deboardedLocation: log.location || null,
              deboardedLocationName: getLocationName(log),
              scannedByCaptainName: log.scannedByCaptainName || "Sustav",
              isSimulated: !!isSimulated,
              notes: log.notes,
            });
          }
        }
      }

      if (currentSession) {
        list.push(currentSession);
      }
    }

    // Sort to show latest session starts first
    return list.sort((a, b) => {
      const timeA = new Date(a.boardedAt || a.deboardedAt || 0).getTime();
      const timeB = new Date(b.boardedAt || b.deboardedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [filteredLogs, resolvedAddresses]);

  const exportToExcel = () => {
    // Export formatted paired sessions for highly descriptive report
    const data = boardingSessions.map((sess) => {
      const bDate = sess.boardedAt
        ? new Date(sess.boardedAt).toLocaleDateString()
        : "-";
      const bTime = sess.boardedAt
        ? new Date(sess.boardedAt).toLocaleTimeString()
        : "-";
      const dDate = sess.deboardedAt
        ? new Date(sess.deboardedAt).toLocaleDateString()
        : "-";
      const dTime = sess.deboardedAt
        ? new Date(sess.deboardedAt).toLocaleTimeString()
        : "-";
      return {
        "Ime i prezime":
          sess.crewName + (sess.isSimulated ? " (FAKE/TEST)" : ""),
        Uloga: sess.role,
        "Jahta ID": sess.yachtId,
        Jahta:
          CATAMARANS.find((v) => v.id === sess.yachtId)?.name || sess.yachtId,
        "Datum ukrcaja": bDate,
        "Vrijeme ukrcaja": bTime,
        "Lokacija ukrcaja":
          sess.boardedLocationName ||
          (sess.boardedLocation
            ? `${sess.boardedLocation.lat}, ${sess.boardedLocation.lng}`
            : "Nepoznato"),
        "Datum iskrcaja": dDate,
        "Vrijeme iskrcaja": dTime,
        "Lokacija iskrcaja":
          sess.deboardedLocationName ||
          (sess.deboardedLocation
            ? `${sess.deboardedLocation.lat}, ${sess.deboardedLocation.lng}`
            : "Na brodu / Aktivno"),
        "Odobrio kapetan": sess.scannedByCaptainName || "Sustav",
        Napomena: sess.notes || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Smjene-Zapisnik");
    XLSX.writeFile(workbook, "Zapisnik_Ukrcaja_Posade.xlsx");
  };

  const exportToCSV = () => {
    // Export standard, UTF-8 BOM CSV that is 100% immune to Protected View warnings and opens perfectly in Excel
    const data = boardingSessions.map((sess) => {
      const bDate = sess.boardedAt
        ? new Date(sess.boardedAt).toLocaleDateString()
        : "-";
      const bTime = sess.boardedAt
        ? new Date(sess.boardedAt).toLocaleTimeString()
        : "-";
      const dDate = sess.deboardedAt
        ? new Date(sess.deboardedAt).toLocaleDateString()
        : "-";
      const dTime = sess.deboardedAt
        ? new Date(sess.deboardedAt).toLocaleTimeString()
        : "-";
      return {
        "Ime i prezime":
          sess.crewName + (sess.isSimulated ? " (FAKE/TEST)" : ""),
        Uloga: sess.role,
        "Jahta ID": sess.yachtId,
        Jahta:
          CATAMARANS.find((v) => v.id === sess.yachtId)?.name || sess.yachtId,
        "Datum ukrcaja": bDate,
        "Vrijeme ukrcaja": bTime,
        "Lokacija ukrcaja":
          sess.boardedLocationName ||
          (sess.boardedLocation
            ? `${sess.boardedLocation.lat}, ${sess.boardedLocation.lng}`
            : "Nepoznato"),
        "Datum iskrcaja": dDate,
        "Vrijeme iskrcaja": dTime,
        "Lokacija iskrcaja":
          sess.deboardedLocationName ||
          (sess.deboardedLocation
            ? `${sess.deboardedLocation.lat}, ${sess.deboardedLocation.lng}`
            : "Na brodu / Aktivno"),
        "Odobrio kapetan": sess.scannedByCaptainName || "Sustav",
        Napomena: sess.notes || "",
      };
    });

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = String(row[fieldName as keyof typeof row] || "");
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ];

    // Added UTF-8 Byte Order Mark (\ufeff) so Excel detects the character accents like Č, š, ž perfectly
    const csvContent = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Zapisnik_Ukrcaja_Posade_Excel_Siguran.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(20);
      doc.setTextColor("#064e3b");
      doc.text("Evidencija Radnog Vremena", 14, 20);

      doc.setFontSize(11);
      doc.setTextColor("#475569");
      doc.text(`Ukupno Zabiljezbi: ${boardingSessions.length}`, 14, 28);
      doc.text(`Datum Izvoza: ${new Date().toLocaleString()}`, 14, 34);

      const tableData = boardingSessions.map((sess) => {
        const bTime = sess.boardedAt
          ? new Date(sess.boardedAt).toLocaleString()
          : "-";
        const dTime = sess.deboardedAt
          ? new Date(sess.deboardedAt).toLocaleString()
          : "-";
        return [
          sess.crewName + (sess.isSimulated ? "\n(FAKE)" : ""),
          sess.role,
          CATAMARANS.find((v) => v.id === sess.yachtId)?.name ||
            sess.yachtId ||
            "Sve jahte",
          `${bTime}\n${sess.boardedLocationName || "Nepoznato"}`,
          `${dTime}\n${sess.deboardedLocationName || "Na brodu"}`,
          sess.scannedByCaptainName || "Sustav",
        ];
      });

      autoTable(doc, {
        startY: 42,
        head: [
          [
            "Ime i Prezime",
            "Uloga",
            "Jahta",
            "Ukrcaj (Boarding)",
            "Iskrcaj (Deboarding)",
            "Skenirao",
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
        `Zapisnik_Ukrcaja_Posade_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (e) {
      console.error("PDF generator failed", e);
      alert("Error generating PDF.");
    }
  };

  const clearAllLogs = async () => {
    if (
      !window.confirm(
        "Jeste li sigurni da želite trajno obrisati sve zapisnike smjena? Ova akcija je nepovratna.",
      )
    )
      return;

    try {
      const batch = writeBatch(db);
      // Batch maximum size is 500, we should chunk if needed
      if (logs.length > 500) {
        alert(
          "Previše zapisa za odjednom (maksimalno 500). Brisanje je djelomično uspješno, ponovite akciju.",
        );
      }
      const logsToDelete = logs.slice(0, 500);
      for (const log of logsToDelete) {
        batch.delete(doc(db, "crewLogs", log.id));
      }
      await batch.commit();
      alert("Zapisnici su uspješno obrisani.");
    } catch (err) {
      console.error(err);
      alert("Došlo je do greške prilikom brisanja.");
    }
  };

  const backupToGoogleDrive = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        alert("Nije moguće dobiti pristup aplikaciji Google Drive.");
        return;
      }

      const csvContent =
        "\uFEFF" +
        [
          [
            "ID",
            "Posada ID",
            "Ime i Prezime",
            "Uloga",
            "Status",
            "Vrijeme",
            "Registrirano (Captain)",
            "Vessel ID",
          ],
          ...logs.map((log) => [
            log.id || "",
            log.crewId || "",
            `"${(log.crewName || "").replace(/"/g, '""')}"`,
            log.role || "",
            log.status || "",
            new Date(log.timestamp).toLocaleString("hr-HR"),
            log.scannedByCaptainName || "",
            log.yachtId || "",
          ]),
        ]
          .map((row) => row.join(";"))
          .join("\n");

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const fileName = `Zapisnici_Posade_Backup_${new Date().toISOString().split("T")[0]}.csv`;

      const metadata = {
        name: fileName,
        mimeType: "text/csv",
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: text/csv\r\n\r\n" +
        csvContent +
        close_delim;

      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        },
      );

      if (res.ok) {
        alert("Zapisnici su uspješno spremljeni na Vaš Google Drive!");
      } else {
        const err = await res.json();
        console.error(err);
        alert("Došlo je do greške prilikom spremanja na Google Drive.");
      }
    } catch (error) {
      console.error("Backup to Google Drive error:", error);
      alert("Došlo je do greške prilikom prijave i spremanja na Google Drive.");
    }
  };

  const renderCalendar = () => {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"].map((d) => (
          <div
            key={d}
            className="text-center font-bold text-[10px] text-slate-500 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const daySessions = boardingSessions.filter((sess) => {
            const bDate = sess.boardedAt ? new Date(sess.boardedAt) : null;
            return (
              bDate &&
              bDate.getDate() === day &&
              bDate.getMonth() === now.getMonth()
            );
          });
          return (
            <div
              key={day}
              className="min-h-24 border border-slate-200 rounded-lg p-2 text-[10px] bg-white hover:border-emerald-300 transition-colors shadow-xs flex flex-col justify-between"
            >
              <div className="font-extrabold text-slate-400 font-mono text-xs">
                {day}
              </div>
              <div className="space-y-1 mt-1 overflow-y-auto max-h-16 pr-0.5">
                {daySessions.map((s, i) => (
                  <div
                    key={i}
                    className="truncate bg-emerald-50 text-emerald-800 border border-emerald-100 px-1 py-0.5 rounded text-[8px] font-semibold"
                  >
                    🚢 {s.crewName}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Header Control Rail */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            Vesel Manifest & Zapisnik Ukrcaja
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Digitalno skenirani i geolocirani pomorski zapisi za osiguranje i
            obalnu stražu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Ship Selection Filter */}
          <select
            value={filterShip}
            onChange={(e) => setFilterShip(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-[10px] uppercase font-bold tracking-wider rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="">SVI BRODOVI (ALL FLEET)</option>
            {CATAMARANS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Tab Selection */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("sessions")}
              className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-md transition-all ${viewMode === "sessions" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              🔄 Smjene
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-md transition-all ${viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              📄 Kronološki
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-md transition-all ${viewMode === "calendar" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
            >
              📅 Kalendar
            </button>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={clearAllLogs}
                disabled={logs.length === 0}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                title="Obriši sve zapisnike"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Obriši Sve
              </button>
              <button
                onClick={exportToPDF}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
                title="Izvoz u PDF format"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="bg-[#0f543e] hover:bg-[#12644a] text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
                title="Izvoz u standardni Excel format. (Ako se pojavi Protected View, koristite Safe CSV)"
              >
                <Download className="h-3.5 w-3.5" />
                Excel (XLSX)
              </button>
              <button
                onClick={exportToCSV}
                className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
                title="Sigurna verzija kompatibilna sa svim Excel verzijama bez Protected View blokada"
              >
                <Download className="h-3.5 w-3.5" />
                Excel (BOM Safe CSV)
              </button>
              <button
                onClick={backupToGoogleDrive}
                className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-xs"
                title="Spremi na Google Drive"
              >
                <Cloud className="h-3.5 w-3.5" />
                G-Drive Backup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main logs workspace container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-4">
          {/* VIEW: Paired Shift Sessions (HIGHLY DETAILED) */}
          {viewMode === "sessions" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Član Posade</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Uloga</th>
                  <th className="px-4 py-3">Jahta</th>
                  <th className="px-4 py-3">Vrijeme i Mjesto Ukrcaja</th>
                  <th className="px-4 py-3">Vrijeme i Mjesto Iskrcaja</th>
                  <th className="px-4 py-3 text-center">Status Smjene</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {boardingSessions.map((sess, idx) => {
                  const bLocName =
                    sess.boardedLocationName ||
                    (sess.boardedLocation
                      ? resolvedAddresses[
                          `${sess.boardedLocation.lat.toFixed(5)},${sess.boardedLocation.lng.toFixed(5)}`
                        ]
                      : null);
                  const dLocName =
                    sess.deboardedLocationName ||
                    (sess.deboardedLocation
                      ? resolvedAddresses[
                          `${sess.deboardedLocation.lat.toFixed(5)},${sess.deboardedLocation.lng.toFixed(5)}`
                        ]
                      : null);

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${sess.isSimulated ? "bg-amber-50/50" : ""}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-800 self-start">
                        <p className="flex items-center gap-1.5">
                          {sess.crewName}
                          {sess.isSimulated && (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest border border-amber-200">
                              Test / Fake
                            </span>
                          )}
                        </p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">
                          ID: {sess.crewId.substring(0, 14)}
                        </p>
                        {sess.notes && (
                          <p className="text-[9px] text-slate-500 italic mt-0.5 max-w-[200px] truncate">
                            {sess.notes}
                          </p>
                        )}
                      </td>
                      {/* Kontakt */}
                      <td className="px-4 py-3.5 text-[9px] text-slate-500 whitespace-nowrap self-start">
                        {sess.email && <div>E: {sess.email}</div>}
                        {sess.phone && <div>T: {sess.phone}</div>}
                        {!sess.email && !sess.phone && (
                          <span className="opacity-50">-</span>
                        )}
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border border-slate-200">
                          {sess.role}
                        </span>
                      </td>
                      {/* Ship */}
                      <td className="px-4 py-3.5 font-bold text-slate-500 font-mono">
                        {CATAMARANS.find((v) => v.id === sess.yachtId)?.name ||
                          sess.yachtId}
                      </td>

                      {/* BOARDED: Time, date, street/island map block */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {sess.boardedAt ? (
                          <div className="space-y-1">
                            <p className="font-mono text-[10px] text-slate-800 font-semibold">
                              {new Date(sess.boardedAt).toLocaleString()}
                            </p>
                            {sess.boardedLocation ? (
                              <a
                                href={`https://www.google.com/maps?q=${sess.boardedLocation.lat},${sess.boardedLocation.lng}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer"
                                className="inline-flex items-start gap-1 text-emerald-700 hover:text-emerald-900 font-sans text-[10px] group leading-tight"
                              >
                                <MapPin className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                  <span className="font-semibold underline decoration-dotted">
                                    {bLocName || "Dohvaćanje lokacije..."}
                                  </span>
                                  <span className="block text-[8px] font-mono text-slate-400 mt-0.5">
                                    ({sess.boardedLocation.lat.toFixed(4)},{" "}
                                    {sess.boardedLocation.lng.toFixed(4)})
                                  </span>
                                </div>
                              </a>
                            ) : (
                              <p className="text-slate-400 italic text-[10px]">
                                Lokacija nedostupna
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">
                            Ukrcaj nije evidentiran
                          </span>
                        )}
                      </td>

                      {/* DEBOARDED: Time, date, street/island map block */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {sess.deboardedAt ? (
                          <div className="space-y-1">
                            <p className="font-mono text-[10px] text-slate-800 font-semibold">
                              {new Date(sess.deboardedAt).toLocaleString()}
                            </p>
                            {sess.deboardedLocation ? (
                              <a
                                href={`https://www.google.com/maps?q=${sess.deboardedLocation.lat},${sess.deboardedLocation.lng}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer"
                                className="inline-flex items-start gap-1 text-[#b45309] hover:text-[#92400e] font-sans text-[10px] group leading-tight"
                              >
                                <MapPin className="h-3 w-3 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                  <span className="font-semibold underline decoration-dotted">
                                    {dLocName || "Dohvaćanje lokacije..."}
                                  </span>
                                  <span className="block text-[8px] font-mono text-slate-400 mt-0.5">
                                    ({sess.deboardedLocation.lat.toFixed(4)},{" "}
                                    {sess.deboardedLocation.lng.toFixed(4)})
                                  </span>
                                </div>
                              </a>
                            ) : (
                              <p className="text-slate-400 italic text-[10px]">
                                Lokacija nedostupna
                              </p>
                            )}
                          </div>
                        ) : sess.boardedAt ? (
                          <div className="py-1">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 border border-emerald-100 rounded leading-none shrink-0 uppercase tracking-wider animate-pulse">
                              🚢 Na Brodu / Active
                            </span>
                            <p className="text-[8px] text-slate-400 mt-1">
                              Nakon prijave, iskrcaj još nije skeniran.
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">
                            -
                          </span>
                        )}
                      </td>

                      {/* Status pill and duration calculation */}
                      <td className="px-4 py-3.5 text-center">
                        {sess.boardedAt && sess.deboardedAt ? (
                          <div className="space-y-1">
                            <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200">
                              ZAVRŠENO
                            </span>
                            <p className="text-[8px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">
                              Trajanje:{" "}
                              {(() => {
                                const diffMs =
                                  new Date(sess.deboardedAt).getTime() -
                                  new Date(sess.boardedAt).getTime();
                                const hrs = Math.floor(
                                  diffMs / (1000 * 60 * 60),
                                );
                                const mins = Math.floor(
                                  (diffMs / (1000 * 60)) % 60,
                                );
                                return hrs > 0
                                  ? `${hrs}h ${mins}m`
                                  : `${mins}m`;
                              })()}
                            </p>
                          </div>
                        ) : sess.boardedAt ? (
                          <span className="bg-emerald-100 text-emerald-900 font-semibold text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest">
                            AKTIVNO
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 font-semibold text-[9px] px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-widest">
                            SAMO ISKRCAJ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {boardingSessions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-slate-400 italic"
                    >
                      Nije spremljen nijedan zapisnik smjene.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* VIEW: Chronological Simple Log Table */}
          {viewMode === "table" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Pomorac / Manifest</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Uloga</th>
                  <th className="px-4 py-3">Zabilježeni Događaj</th>
                  <th className="px-4 py-3">Vrijeme i Datum</th>
                  <th className="px-4 py-3">Jahta</th>
                  <th className="px-4 py-3">Skenirao / Detektor</th>
                  <th className="px-4 py-3">Ulica, Mjesto i Otok (Mapa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => {
                  const isBoarding =
                    log.status === "Boarded" || log.status === "Scanned";
                  const resolvedName = getLocationName(log);
                  const isSimulated =
                    log.notes?.includes("Automated") ||
                    log.notes?.includes("Test") ||
                    log.crewName?.includes("Lutka Test") ||
                    log.notes?.includes("Simulat") ||
                    log.notes?.toLowerCase().includes("fake");

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 transition-colors ${isSimulated ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {log.crewName}
                        {isSimulated && (
                          <div className="mt-0.5 whitespace-nowrap">
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-widest border border-amber-200">
                              FAKE / TEST
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[9px] text-slate-500 whitespace-nowrap">
                        {log.email && <div>E: {log.email}</div>}
                        {log.phone && <div>T: {log.phone}</div>}
                        {!log.email && !log.phone && (
                          <span className="opacity-50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border border-slate-200">
                          {log.role || "Passenger"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            isBoarding
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : "bg-amber-50 text-amber-800 border-amber-100"
                          }`}
                        >
                          {log.status === "Boarded"
                            ? "UKRCAJ"
                            : log.status === "Deboarded"
                              ? "ISKRCAN"
                              : log.status || "ZABILJEŽENO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-mono font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-bold font-mono">
                        {CATAMARANS.find((v) => v.id === log.yachtId)?.name ||
                          log.yachtId ||
                          "Sve jahte"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {log.scannedByCaptainName ||
                          "Obalni Portal (Vessel Portal)"}
                      </td>
                      <td className="px-4 py-3">
                        {log.location ? (
                          <a
                            href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-sans font-semibold transition-all hover:scale-[1.02] border ${
                              isBoarding
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0 animate-bounce" />
                            <span>{resolvedName}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">
                            Izvan dometa / Nije odobren GPS
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-slate-400 italic"
                    >
                      No logging events available with current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* VIEW: Calendar Panel */}
          {viewMode === "calendar" && renderCalendar()}
        </div>
      </div>
    </div>
  );
}
