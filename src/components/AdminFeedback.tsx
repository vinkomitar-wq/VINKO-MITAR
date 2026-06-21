import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { RefreshCw, MessageSquareQuote, Star, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedback = async () => {
    try {
      setRefreshing(true);
      const q = query(
        collection(db, "guestFeedbacks"),
        orderBy("timestamp", "desc"),
      );
      const snap = await getDocs(q);
      setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.warn("Failed to fetch feedback:", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in text-[#0F172A]">
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-3">
        <h3 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-emerald-600" />
          Guest Post-Charter Review & Feedback
        </h3>
        <button
          onClick={fetchFeedback}
          disabled={refreshing}
          className="p-1 hover:bg-slate-100 rounded-sm"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
          />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center font-mono text-[10px] uppercase text-slate-400 animate-pulse">
            Loading feedback submissions...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-10 text-center font-mono text-[10px] uppercase text-slate-400 flex flex-col items-center">
            <Inbox className="h-6 w-6 text-slate-200 mb-2" />
            Your guests have not submitted any post-charter feedback yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {feedbacks.map((f) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={f.id}
                className="p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {f.guestName || "Anonymous Guest"}
                    </h4>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono mt-0.5">
                      Booking Ref: {f.bookingId || "N/A"}
                    </span>
                  </div>
                  <div className="flex bg-amber-50 px-2.5 py-1 rounded-sm border border-amber-100">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < (f.rating || 5) ? "text-amber-400 fill-amber-400" : "text-amber-100"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic bg-white border border-slate-100 p-4 rounded-sm shadow-2xs relative">
                  <MessageSquareQuote className="h-6 w-6 text-slate-100 absolute -top-1 -left-1" />
                  <span className="relative z-10">
                    {f.comment || "No written comments."}
                  </span>
                </p>
                {f.timestamp && (
                  <div className="mt-3 text-[8.5px] font-black uppercase text-slate-300 tracking-wider">
                    Submitted: {new Date(f.timestamp).toLocaleString()}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
