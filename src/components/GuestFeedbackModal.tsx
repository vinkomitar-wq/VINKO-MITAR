import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { X, Star, Send } from "lucide-react";
import { motion } from "framer-motion";

interface GuestFeedbackModalProps {
  booking: any;
  userProfile: any;
  onClose: () => void;
}

export default function GuestFeedbackModal({
  booking,
  userProfile,
  onClose,
}: GuestFeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const feedbackId = `feedback-${booking.id}-${Date.now()}`;
      await setDoc(doc(db, "guestFeedbacks", feedbackId), {
        id: feedbackId,
        bookingId: booking.id,
        guestId: userProfile?.uid || "unknown",
        guestName: userProfile?.name || booking?.clientName || "Unknown Guest",
        rating,
        comment,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-sm w-full rounded-sm shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Post-Charter Feedback
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 text-emerald-600">
              <Star className="h-6 w-6 fill-emerald-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Thank you!
            </h3>
            <p className="text-[10px] text-slate-500 max-w-[250px] mx-auto leading-relaxed">
              Your feedback has been submitted to the management team. We hope
              to welcome you aboard again.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                How was your charter experience?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Additional Comments
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the crew, the yacht, or the itinerary..."
                className="w-full text-xs font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xs p-3 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Submit Feedback
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
