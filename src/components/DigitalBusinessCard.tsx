import React from "react";
import { X, MessageSquare, Ship, Star, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent } from "../AgentContext";

interface DigitalBusinessCardProps {
  agent: Agent;
  onClose: () => void;
  onMessageClick: () => void;
}

export const DigitalBusinessCard: React.FC<DigitalBusinessCardProps> = ({
  agent,
  onClose,
  onMessageClick,
}) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm bg-slate-900 overflow-hidden shadow-2xl rounded-2xl border border-slate-700 flex flex-col"
        >
          {/* Top Banner / Hero Image Placeholder */}
          <div
            className="h-28 bg-gradient-to-br from-emerald-800 to-slate-900 border-b border-emerald-900 flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1544551763-46a013e70559?auto=format&fit=crop&q=80&w=800')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white hover:text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Profile Details */}
          <div className="px-6 pt-0 pb-6 flex flex-col items-center relative -mt-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-slate-800 border-[3px] border-slate-900 shadow-xl flex items-center justify-center mb-3 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <span className="text-2xl font-serif text-emerald-400 font-bold uppercase tracking-wider">
                {agent.name.substring(0, 2)}
              </span>
            </div>

            <div className="text-center space-y-1 mb-4">
              <h2 className="text-xl font-serif font-bold text-white leading-tight">
                {agent.name}
              </h2>
              <p className="text-xs font-sans font-semibold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5 pb-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{" "}
                Premium VIP Broker{" "}
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              </p>
              {agent.companyName && (
                <p className="text-xs text-slate-400 font-medium">
                  {agent.companyName}
                </p>
              )}
            </div>

            {/* Custom Welcome Message */}
            <div className="w-full bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 mb-5 relative">
              <p className="text-[14px] text-slate-300 leading-relaxed text-center font-serif italic text-balance">
                "
                {agent.welcomeMessage ||
                  "Welcome to Phuket Yacht Charters. I'm here to ensure your premium catamaran experience is flawless from start to finish. Contact me anytime!"}
                "
              </p>
            </div>

            {/* Actions Grid */}
            <div className="w-full grid grid-cols-1 gap-2.5 mb-1">
              <button
                onClick={() => {
                  onMessageClick();
                  onClose();
                }}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-black font-sans uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/50"
              >
                <MessageSquare className="w-4 h-4" /> Message Me Now
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-[13px] font-bold font-sans uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <Ship className="w-4 h-4 text-emerald-400" /> View Private Fleet{" "}
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
