import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import FreeMap from "./FreeMap";
import { Loader2 } from "lucide-react";

interface VesselTrackingMapProps {
  vesselId?: string;
  limitPoints?: number;
}

export const VesselTrackingMap: React.FC<VesselTrackingMapProps> = ({
  vesselId,
  limitPoints = 100,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch logs that have geo location
    const q = query(
      collection(db, "crewLogs"),
      orderBy("timestamp", "desc"),
      limit(limitPoints),
    );

    const unsub = onSnapshot(q, (snap) => {
      let fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (vesselId) {
        fetched = fetched.filter((l: any) => l.yachtId === vesselId);
      }

      // Filter out records without valid coordinates
      fetched = fetched.filter(
        (l: any) =>
          l.location &&
          typeof l.location.lat === "number" &&
          typeof l.location.lng === "number",
      );

      setLogs(fetched);
      setLoading(false);
    });

    return () => unsub();
  }, [vesselId, limitPoints]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-sm w-full">
        <Loader2 className="animate-spin h-6 w-6 text-slate-400 mb-2" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Loading Satellite GPS Ping Data...
        </span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-sm border border-slate-200">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          No valid GPS scan tracks available.
        </span>
      </div>
    );
  }

  // Create markers and paths for FreeMap
  // We'll reverse the logs so chronological order for paths
  const chronological = [...logs].reverse();

  const pathPoints = chronological.map((l) => ({
    lat: l.location.lat,
    lng: l.location.lng,
  }));

  const markers = chronological.map((l, index) => {
    const isLatest = index === chronological.length - 1;
    let emoji = "📌";
    if (l.status === "Boarded") emoji = "🧍";
    if (l.status === "Deboarded") emoji = "👋";
    if (l.scannedByCaptainUid) emoji = "📲";
    if (isLatest) emoji = "📍";

    return {
      id: l.id,
      lat: l.location.lat,
      lng: l.location.lng,
      title: `${l.crewName || "Unknown"} - ${l.status || "Scanned"}\n${new Date(l.timestamp).toLocaleTimeString()}`,
      isActive: isLatest,
      keyActivity:
        l.locationName ||
        `Lat: ${l.location.lat.toFixed(4)}, Lng: ${l.location.lng.toFixed(4)}`,
    };
  });

  const latestPos = pathPoints[pathPoints.length - 1];

  return (
    <div className="w-full h-80 lg:h-96 rounded-sm overflow-hidden border border-slate-200 relative">
      <FreeMap
        center={latestPos || { lat: 7.822, lng: 98.338 }}
        zoom={12}
        markers={markers}
        polylinePaths={pathPoints.length > 1 ? pathPoints : undefined}
        vesselId={vesselId || "the-best"}
      />
    </div>
  );
};
