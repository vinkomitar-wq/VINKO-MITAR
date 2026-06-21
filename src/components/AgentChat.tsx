import React, { useState, useEffect, useRef } from "react";
import { useAgent, Agent } from "../AgentContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { format } from "date-fns";
import { Send, FileText, Paperclip, MessageSquare } from "lucide-react";

export default function AgentChat() {
  const { currentAgent, agents } = useAgent();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeBrokerId =
    currentAgent?.id ||
    currentAgent?.email.toLowerCase().replace(/[^a-z0-9]/g, "_");

  const otherAgents = agents.filter((a) => {
    const aId = a.id || a.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return aId !== activeBrokerId;
  });

  const selectedAgent = otherAgents.find(
    (a) =>
      (a.id || a.email.toLowerCase().replace(/[^a-z0-9]/g, "_")) ===
      selectedAgentId,
  );

  useEffect(() => {
    if (!activeBrokerId || !selectedAgentId) {
      setMessages([]);
      return;
    }

    const chatId = [activeBrokerId, selectedAgentId].sort().join("_");
    const q = query(
      collection(db, "agent_chats"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      },
      (error) => {
        console.error("AgentChat onSnapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [activeBrokerId, selectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!inputText.trim() && !selectedFile) ||
      !activeBrokerId ||
      !selectedAgentId ||
      isSending
    )
      return;

    setIsSending(true);

    try {
      const chatId = [activeBrokerId, selectedAgentId].sort().join("_");
      let fileData = null;

      if (selectedFile) {
        // Read the file as a data URL
        const reader = new FileReader();
        fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      await addDoc(collection(db, "agent_chats"), {
        chatId,
        senderId: activeBrokerId,
        senderName: currentAgent?.name,
        receiverId: selectedAgentId,
        text: inputText.trim(),
        fileData,
        fileName: selectedFile?.name,
        timestamp: serverTimestamp(),
      });

      setInputText("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const activeChatContent = (
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-[#0F172A] text-white p-3 flex flex-col">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
          Internal Comms
        </div>
        <div className="text-sm font-semibold">{selectedAgent?.name}</div>
        <div className="text-[10px] opacity-75">{selectedAgent?.email}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative custom-scrollbar">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs text-center p-4">
            No messages yet between you and {selectedAgent?.name}.<br />
            Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === activeBrokerId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="text-[9px] text-slate-400 mb-0.5 ml-1 mr-1">
                  {msg.timestamp
                    ? format(msg.timestamp.toDate(), "MMM d, h:mm a")
                    : "Sending..."}
                </div>
                <div
                  className={`text-[11px] p-2.5 rounded-sm max-w-[85%] ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-none"
                  }`}
                >
                  {msg.text && (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                  {msg.fileData && (
                    <a
                      href={msg.fileData}
                      download={msg.fileName || "document.pdf"}
                      className={`inline-flex items-center gap-1.5 mt-1.5 p-2 rounded-xs border w-full shrink-0 ${
                        isMe
                          ? "bg-emerald-700/50 border-emerald-500/50 hover:bg-emerald-700"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      } transition-colors`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1 max-w-[150px] font-mono text-[9px]">
                        {msg.fileName || "document.pdf"}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-2">
            {selectedFile && (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xs">
                <div
                  className="flex items-center gap-1.5 min-w-0 pr-2 cursor-pointer"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(selectedFile);
                    link.download = selectedFile.name;
                    link.click();
                  }}
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[10px] text-emerald-800 font-medium truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-emerald-700 hover:text-red-600 shrink-0 cursor-pointer"
                >
                  <MessageSquare className="h-3 w-3 opacity-0" />{" "}
                  {/* dummy icon just to hold space if needed, using custom text instead */}
                  <span className="text-[10px] font-bold">X</span>
                </button>
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder={`Message ${selectedAgent?.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full text-xs py-2.5 pl-3 pr-10 border border-slate-300 rounded-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors block">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <Paperclip className="h-4 w-4" />
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedFile) || isSending}
            className="p-2.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Agent List */}
      <div className="md:col-span-1 space-y-2 border-r border-[#0F172A]/10 pr-2">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
          Internal Agents
        </h4>
        {otherAgents.map((a) => {
          const aId = a.id || a.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const isSelected = selectedAgentId === aId;
          return (
            <button
              key={aId}
              type="button"
              onClick={() => setSelectedAgentId(aId)}
              className={`w-full text-left p-3 rounded-sm border transition-all flex items-center gap-2.5 ${
                isSelected
                  ? "bg-[#0F172A] border-[#0F172A] text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-xs ${
                  isSelected
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {(a.name || a.email || "AG").substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] font-bold truncate">{a.name}</div>
                <div
                  className={`text-[9px] truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                >
                  {a.email}
                </div>
              </div>
            </button>
          );
        })}
        {otherAgents.length === 0 && (
          <div className="text-xs text-slate-500 italic p-2 border border-slate-100 rounded-sm bg-slate-50">
            No other agents found in the system.
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="md:col-span-2">
        {selectedAgentId ? (
          activeChatContent
        ) : (
          <div className="h-[500px] border border-slate-200 border-dashed rounded-sm bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
            Select an agent from the list to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
