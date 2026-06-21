import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  RefreshCw,
  DollarSign,
  UserCheck,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminCommissions() {
  const [closedBookings, setClosedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClosedBookings = async () => {
    try {
      setRefreshing(true);
      // Fetch only "Completed" or "Completed_Archived" bookings
      const q = query(collection(db, "proposals"));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Filter locally for simplicity (since we might lack composite indexes)
      const valid = list.filter(
        (b: any) =>
          b.boardingStatus === "Completed" ||
          b.boardingStatus === "Completed_Archived",
      );

      // Sort by newest first
      valid.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setClosedBookings(valid);
    } catch (err) {
      console.error("Failed to fetch closed bookings for commissions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClosedBookings();
  }, []);

  // Simple commission logic: 20% flat mock rate unless defined
  const calculateCommission = (booking: any) => {
    const defaultPrice = 50000; // Mock 50k THB baseline
    const price = booking.totalPrice || defaultPrice;
    return price * 0.2;
  };

  const calculateTotal = () => {
    return closedBookings.reduce(
      (acc, curr) => acc + calculateCommission(curr),
      0,
    );
  };

  return (
    <div className="space-y-6 text-left animate-fade-in text-[#0F172A]">
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-3">
        <h3 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Broker Commissions Ledger
        </h3>
        <button
          onClick={fetchClosedBookings}
          disabled={refreshing}
          className="p-1 hover:bg-slate-100 rounded-sm"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xs p-5 flex flex-col gap-1 shadow-xs">
          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Cumulative Commissions
          </span>
          <span className="text-2xl font-black text-emerald-900">
            {calculateTotal().toLocaleString()} THB
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xs p-5 flex flex-col gap-1 shadow-xs">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <UserCheck className="h-3 w-3" /> Total Completed Charters
          </span>
          <span className="text-2xl font-black text-slate-800">
            {closedBookings.length} completed
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center font-mono text-[10px] uppercase text-slate-400 animate-pulse">
            Loading ledgers...
          </div>
        ) : closedBookings.length === 0 ? (
          <div className="p-10 text-center font-mono text-[10px] uppercase text-slate-400 flex flex-col items-center">
            <HelpCircle className="h-6 w-6 text-slate-200 mb-2" />
            There are no completed charters eligible for commission payout.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {closedBookings.map((b) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={b.id}
                className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">
                      {b.clientName || b.customerName || "Charter Guest"}
                    </span>
                    <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Agent:{" "}
                    <strong className="text-slate-700">
                      {b.assignedAgentName ||
                        b.creatorName ||
                        "Direct / No Agent"}
                    </strong>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
                    Date:{" "}
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-emerald-600 font-bold uppercase tracking-widest mb-1">
                    Commission Out
                  </span>
                  <span className="block text-sm font-black font-mono tracking-tight text-emerald-900 bg-emerald-100/50 px-2.5 py-1 rounded-xs border border-emerald-200/50">
                    +{calculateCommission(b).toLocaleString()} THB
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
