import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function AIChatWidget({ disabled }: { disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Sawadee ka! I am your AI Charter Concierge. Need help matching an itinerary or picking VIP add-ons based on your group size?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/concierge-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send all messages for context
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMsg }],
        }),
      });

      if (!response.ok) {
        throw new Error("Chat failed");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "I'm sorry, I encountered an error.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Apologies, my satellite link dropped. Please try asking again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (disabled) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && !disabled && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[4.5rem] right-4 sm:bottom-20 sm:right-6 z-50 h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800 transition-colors border-[3px] border-white focus:outline-hidden ring-2 ring-slate-900/10 cursor-pointer"
          >
            <Sparkles className="absolute top-2 right-2 h-3 w-3 text-emerald-400" />
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 w-full sm:w-[340px] h-[100dvh] sm:h-[500px] sm:max-h-[calc(100dvh-2rem)] bg-white sm:rounded-xl shadow-2xl flex flex-col overflow-hidden sm:border border-slate-200"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-slate-900" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-sm tracking-wide">
                    Charter Concierge
                  </h4>
                  <p className="text-[10px] text-slate-300 font-mono tracking-wider">
                    AI EXPERT ONLINE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-xs ${
                      msg.role === "assistant"
                        ? "bg-white text-slate-700 border border-slate-200 rounded-tl-sm"
                        : "bg-[#0F172A] text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-xs">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 shrink-0"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about itineraries, boats, sizes..."
                  className="w-full pl-4 pr-12 py-3 rounded-full border border-slate-200 bg-slate-50 text-[13px] focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-8 flex items-center justify-center bg-slate-900 text-white rounded-full disabled:bg-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    <Send className="h-3.5 w-3.5 ml-0.5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
