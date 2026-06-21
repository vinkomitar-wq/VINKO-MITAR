import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Anchor, Users, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { CATAMARANS } from "../data";

export const AdminShipRoster: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    const q = query(collection(db, "crewLogs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLogs(fetched);
    }, (err) => console.log('AdminShipRoster snapshot err', err.message));
    return () => unsub();
  }, []);

  const rosterByShip = useMemo(() => {
    // Filter by selected date
    const dayLogs = logs.filter((log) => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      return logDate === selectedDate;
    });

    // Group logs by crew member within the day to find their latest status on that day
    const crewStatusByDay = new Map<string, any>();

    // Day logs are ordered by desc, so we need to reverse or just take first?
    // Wait, the timestamp desc means the first log for a crewId is their latest state for the day.

    dayLogs.forEach((log) => {
      if (!crewStatusByDay.has(log.crewId)) {
        crewStatusByDay.set(log.crewId, log);
      }
    });

    const activeRoster = new Map<string, any[]>();

    CATAMARANS.forEach((ship) => {
      activeRoster.set(ship.id, []);
    });
    activeRoster.set("Unknown/Other", []);

    crewStatusByDay.forEach((log, crewId) => {
      // If their last status of the day is "Boarded" or "Scanned"
      if (log.status === "Boarded" || log.status === "Scanned") {
        const yachtId = log.yachtId || "Unknown/Other";
        if (!activeRoster.has(yachtId)) {
          activeRoster.set(yachtId, []);
        }
        activeRoster.get(yachtId)!.push(log);
      }
    });

    return activeRoster;
  }, [logs, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Anchor className="h-4 w-4 text-emerald-600" />
            Ship Rosters
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            See who is currently active/boarded on each vessel for a specific
            day
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from(rosterByShip.entries()).map(([shipId, crewInShip]) => {
          const shipName =
            CATAMARANS.find((c) => c.id === shipId)?.name || shipId;

          if (crewInShip.length === 0) {
            return (
              <div
                key={shipId}
                className="bg-white border text-left border-slate-200 rounded-lg shadow-sm p-5 space-y-4 opacity-60"
              >
                <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>{shipName}</span>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">
                    0 Crew
                  </span>
                </h3>
                <div className="text-center py-6 text-[10px] text-slate-400 font-medium">
                  No active crew logged on this day
                </div>
              </div>
            );
          }

          return (
            <div
              key={shipId}
              className="bg-white border text-left border-emerald-200 rounded-lg shadow-md p-5 space-y-4"
            >
              <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-2 text-emerald-800">
                  <Anchor className="h-3 w-3" />
                  {shipName}
                </span>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm font-bold">
                  {crewInShip.length} Active
                </span>
              </h3>

              <div className="space-y-3">
                {crewInShip.map((member) => (
                  <div
                    key={member.id}
                    className="flex gap-3 items-start bg-slate-50 p-2.5 rounded-md border border-slate-100"
                  >
                    <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {member.crewName}
                        </p>
                        <span className="text-[8px] uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm">
                          {member.role || "Crew"}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-2.5 w-2.5" />
                        {new Date(member.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {member.locationName && (
                        <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">
                            {member.locationName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
