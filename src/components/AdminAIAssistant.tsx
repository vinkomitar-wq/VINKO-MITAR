import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AdminAIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin-concierge-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden font-sans">
      <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-50">
              Gemini Admin Assistant
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
              Powered by Google AI
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <Bot className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              How can I assist you?
            </h3>
            <p className="text-[11px] text-slate-500 max-w-xs mt-2">
              Ask about our fleet, destinations, pricing, or let me draft emails
              and itineraries for you.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-sm p-3 ${
                msg.role === "user"
                  ? "bg-slate-800 text-white rounded-tr-none"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs text-left"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                {msg.role === "user" ? (
                  <User className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Bot className="h-3 w-3 text-slate-500" />
                )}
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${msg.role === "user" ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-sm rounded-tl-none p-3 max-w-[80%] shadow-xs flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">
                Assistant is thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-sm text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-800 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-[#0F172A] text-white rounded-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
