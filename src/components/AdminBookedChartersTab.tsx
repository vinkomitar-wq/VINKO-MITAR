import React, { useState } from "react";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Download,
  Anchor,
} from "lucide-react";
import { CATAMARANS } from "../data";
import { generateAgentPdfQuote } from "../utils/pdfGenerator";
import { useAgent } from "../AgentContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminBookedChartersTab({
  agentProposals,
}: {
  agentProposals: any[];
}) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [anchorState, setAnchorState] = useState<{
    opening: boolean;
    booking: any | null;
  }>({ opening: false, booking: null });
  const [selectedVessel, setSelectedVessel] = useState("");
  const { agents } = useAgent(); // Need to fetch brokers/captains

  const handleAnchor = async () => {
    if (!anchorState.booking || !selectedVessel) return;
    try {
      const docRef = doc(db, "proposals", anchorState.booking.id);
      await updateDoc(docRef, {
        vesselId: selectedVessel,
        captainName: "Admin", // Default
      });
      setAnchorState({ opening: false, booking: null });
      alert("Booking anchored successfully!");
    } catch (err) {
      console.error("Failed to anchor:", err);
    }
  };

  const toggleFolder = (yachtId: string) => {
    setOpenFolders((prev) => ({ ...prev, [yachtId]: !prev[yachtId] }));
  };

  // Only consider proposals that have been sent to the captain (closed/booked)
  const closedBookings = (agentProposals || []).filter(
    (p) => p.sentToCaptain === true || p.isBooked === true,
  );

  // Group by yacht ID
  const groupedBookings: Record<string, any[]> = {};

  // Initialize all catamarans as empty folders
  CATAMARANS.forEach((c) => {
    groupedBookings[c.id] = [];
  });

  // Unknown folder
  groupedBookings["unknown"] = [];

  closedBookings.forEach((booking) => {
    // If the booking has vesselId1, that's likely the selected one if they forwarded it.
    // Or recommendedVesselId.
    let yId = booking.vesselId1 || booking.recommendedVesselId;
    if (CATAMARANS.find((c) => c.id === yId)) {
      groupedBookings[yId].push(booking);
    } else {
      groupedBookings["unknown"].push(booking);
    }
  });

  const getVesselName = (id: string) => {
    if (id === "unknown") return "Unassigned / Unknown Asset";
    return CATAMARANS.find((c) => c.id === id)?.name || id;
  };

  const downloadPdf = async (proposal: any) => {
    try {
      await generateAgentPdfQuote(proposal, {
        name: proposal.agencyName || "Admin",
      });
    } catch (err) {
      console.error("Failed to generate PDF for admin:", err);
      alert("Failed to reconstruct PDF for this booking.");
    }
  };

  const yachtIds = Object.keys(groupedBookings).filter(
    (id) => groupedBookings[id].length > 0 || id !== "unknown",
  ); // keep all known ships

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Anchor Modal */}
      {anchorState.opening && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-sm w-full max-w-sm shadow-xl">
            <h4 className="font-bold text-sm mb-4 text-slate-800">
              Assign Vessel & Captain to {anchorState.booking?.clientName}
            </h4>
            <select
              className="w-full border border-slate-300 rounded mb-4 p-2 text-sm"
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
            >
              <option value="">Select Vessel</option>
              {CATAMARANS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase"
                onClick={() =>
                  setAnchorState({ opening: false, booking: null })
                }
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase"
                onClick={handleAnchor}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border text-left border-slate-200 rounded-xs shadow-sm p-5">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Folder className="h-4 w-4 text-emerald-600" /> Booked & Closed
              Charters
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Organized folders of all successfully closed bookings forwarded to
              Yacht Captains.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {yachtIds.map((yId) => {
            const bookings = groupedBookings[yId] || [];
            const isOpen = openFolders[yId] || false;

            // Only show unknown if it has elements
            if (yId === "unknown" && bookings.length === 0) return null;

            return (
              <div
                key={yId}
                className="border border-slate-200 rounded-sm overflow-hidden text-left bg-white transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(yId)}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${isOpen ? "bg-slate-50 border-b border-slate-200" : "bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <Folder
                      className={`h-4 w-4 ${bookings.length > 0 ? "text-emerald-500 fill-emerald-100" : "text-slate-400"}`}
                    />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      {getVesselName(yId)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      {bookings.length} Bookings
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3 bg-slate-50/50">
                    {bookings.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-4 text-center">
                        No bookings forwarded to this yacht yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="bg-white border border-slate-200 p-3 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <Anchor className="h-3 w-3 text-emerald-600" />
                                {booking.clientName || "Unnamed Charter"}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                Date: {booking.targetDate || "N/A"} • Broker:{" "}
                                {booking.agencyName ||
                                  booking.agentEmail ||
                                  "Direct"}
                              </div>
                              {booking.sentToCaptainAt && (
                                <div className="text-[9px] text-slate-400 mt-1">
                                  Assigned to Captain:{" "}
                                  {new Date(
                                    booking.sentToCaptainAt,
                                  ).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div>
                              <button
                                onClick={() =>
                                  setAnchorState({
                                    opening: true,
                                    booking: booking,
                                  })
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xs text-[10px] font-bold uppercase tracking-widest transition-colors mr-2"
                              >
                                <Anchor className="h-3 w-3" /> Anchor
                              </button>
                              <button
                                onClick={() => downloadPdf(booking)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xs text-[10px] font-bold uppercase tracking-widest transition-colors"
                              >
                                <Download className="h-3 w-3" /> Get PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
