import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  AlertTriangle,
  Copy,
  Check,
  Folder,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, addDoc, doc, onSnapshot } from "firebase/firestore";
import { useAgent } from "../AgentContext";

export default function LiveInquiry({ disabled }: { disabled: boolean }) {
  const { currentAgent, getNormalizedWhatsApp, getContactPhone } = useAgent();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(disabled);
  const [localFallbackCopied, setLocalFallbackCopied] = useState(false);

  useEffect(() => {
    setQuotaExceeded(disabled);
  }, [disabled]);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [folder, setFolder] = useState("Inbox");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableDraft, setAvailableDraft] = useState<{
    text: string;
    name?: string;
    contact?: string;
  } | null>(null);
  const [isAgentOnline, setIsAgentOnline] = useState<boolean>(false);

  useEffect(() => {
    let bId = "none";

    if (currentAgent) {
      if (currentAgent.id) {
        bId = currentAgent.id;
      } else if (currentAgent.uid) {
        bId = currentAgent.uid;
      } else if (currentAgent.email) {
        bId = currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      }
    } else {
      bId = "vinko_mitar_gmail_com"; // Master fallback for no-referral customers
    }

    const presenceRef = doc(db, "agent_presence", bId);
    const unsubscribe = onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lastActiveTime =
            typeof data.lastActive === "number"
              ? data.lastActive
              : data.lastActive
                ? new Date(data.lastActive).getTime()
                : 0;
          const isRecentlyActive = lastActiveTime
            ? Math.abs(Date.now() - lastActiveTime) < 300000
            : false;
          setIsAgentOnline(data.isOnline === true || isRecentlyActive);
        } else {
          setIsAgentOnline(false);
        }
      },
      (err: any) => {
        if (err?.message?.includes("permission")) return;
        console.log(
          "Failed to load agent presence inside LiveInquiry widget:",
          err,
        );
      },
    );

    return () => unsubscribe();
  }, [currentAgent]);

  useEffect(() => {
    // Check if there is already a copied draft in local storage
    const storedDraftText = localStorage.getItem("phuket_copied_inquiry_draft");
    const storedDraftName =
      localStorage.getItem("phuket_copied_customer_name") || "";
    const storedDraftContact =
      localStorage.getItem("phuket_copied_customer_contact") || "";
    if (storedDraftText) {
      setAvailableDraft({
        text: storedDraftText,
        name: storedDraftName,
        contact: storedDraftContact,
      });
    }

    const handleInquiryCopied = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      const newDraft = {
        text: detail.text || "",
        name: detail.customerName || "",
        contact: detail.customerContact || "",
      };
      setAvailableDraft(newDraft);

      if (detail.isAgentOnline !== undefined) {
        setIsAgentOnline(detail.isAgentOnline);
      }

      // Auto open and auto fill!
      setIsOpen(true);
      if (newDraft.text) {
        setMessage(newDraft.text);
      }
      if (newDraft.name) {
        setName(newDraft.name);
      }
      if (newDraft.contact) {
        setContact(newDraft.contact);
      }
    };

    window.addEventListener("phuket_inquiry_copied", handleInquiryCopied);
    return () => {
      window.removeEventListener("phuket_inquiry_copied", handleInquiryCopied);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported.");
      return;
    }

    if (file.size > 700 * 1024) {
      // 700KB limit for Firestore docs
      alert("File is too large. Please select a PDF under 700KB.");
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const initialMessage = {
        id: `msg_init_${Date.now()}`,
        sender: "client",
        text: message,
        createdAt: new Date().toISOString(),
        ...(pdfBase64
          ? {
              isPdfAttached: true,
              fileName: pdfFile?.name,
              pdfData: pdfBase64,
            }
          : {}),
      };

      const activeBrokerId =
        currentAgent?.id ||
        (currentAgent?.email
          ? currentAgent.email
            ? currentAgent.email.toLowerCase().replace(/[^a-z0-9]/g, "_")
            : "unassigned"
          : "unassigned");
      const activeBrokerEmail = currentAgent?.email
        ? currentAgent.email.toLowerCase().trim()
        : "booking@charter-partner.com";

      const chatHistory = [initialMessage];
      if (!isAgentOnline) {
        chatHistory.push({
          id: `msg_offline_notice_${Date.now()}`,
          sender: "system",
          text: `⚠️ Representative [${currentAgent?.name || "Agent"}] is currently OFFLINE.\n\nYour specification has been successfully logged. The agent will receive an automated desktop notification and respond as soon as they are back online!`,
          createdAt: new Date().toISOString(),
        } as any);
      }

      const payload = {
        id: `inq_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name,
        contact,
        message,
        folder: folder.trim() || "Inbox",
        createdAt: new Date().toISOString(),
        isRead: false,
        source: "live_inquiry_widget",
        brokerId: activeBrokerId,
        brokerEmail: activeBrokerEmail,
        chatHistory: chatHistory,
      };

      // Ensure we always save this to the shared local storage fallback
      try {
        const fallbackInquiriesStr =
          localStorage.getItem("phuket_charter_shared_local_inquiries") || "[]";
        let fallbackInquiries = [];
        try {
          fallbackInquiries = JSON.parse(fallbackInquiriesStr);
        } catch (e) {
          fallbackInquiries = [];
        }
        fallbackInquiries.push(payload);
        localStorage.setItem(
          "phuket_charter_shared_local_inquiries",
          JSON.stringify(fallbackInquiries),
        );
        window.dispatchEvent(new Event("local-inquiries-updated"));
      } catch (localErr) {
        console.warn("Failed to write to local storage backup:", localErr);
      }

      try {
        const addDocPromise = addDoc(collection(db, "inquiries"), payload);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Inquiry submit timeout (quota limit or network)"),
              ),
            1500,
          ),
        );

        await Promise.race([addDocPromise, timeoutPromise]);
      } catch (firestoreErr) {
        console.warn(
          "Firestore write failed (likely quota limit or offline). Saved to local inbox fallback:",
          firestoreErr,
        );
      }

      setSubmitted(true);
      setName("");
      setContact("");
      setMessage("");
      setFolder("Inbox");
      setShowFolderInput(false);
      setPdfFile(null);
      setPdfBase64(null);

      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      console.warn("Failed core thread in live inquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (disabled) return null;

  return (
    <div className="fixed bottom-6 right-20 sm:right-[6.5rem] z-40 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden border border-slate-100"
          >
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-semibold tracking-wide text-sm leading-tight">
                    Live Inquiry
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isAgentOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400 animate-pulse"}`}
                    />
                    <span className="text-[10px] text-slate-300 font-medium">
                      {currentAgent?.name || "Representative"}:{" "}
                      {isAgentOnline ? "online" : "offline"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close inquiry form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {quotaExceeded ? (
                <div className="text-left space-y-4">
                  <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <span className="bg-[#E11D48] text-white px-1 py-0.2 rounded-xs text-[9px]">
                          RATE EXCEEDED
                        </span>
                        <span>Daily Server Quota Reached</span>
                      </h4>
                      <p className="text-[11px] text-rose-900 leading-relaxed mt-1">
                        Your custom yacht inquiry was generated successfully,
                        but the database free tier is currently full. Please
                        send it directly via our{" "}
                        <strong>100% resilient backup channels</strong> below:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: WhatsApp instant dispatch */}
                    <a
                      href={`https://wa.me/${(getNormalizedWhatsApp() || "66636368287").replace(/[+]/g, "")}?text=${encodeURIComponent(
                        `Dear Phuket Amazing Yacht Charter,\n\nI am presenting a yacht charter inquiry:\n\n*Name:* ${name || "Interested Customer"}\n*Contact:* ${contact || "Not provided"}\n\n*Message:* ${message}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors shadow-sm text-center block"
                    >
                      <span>💬 Send via WhatsApp</span>
                    </a>

                    {/* Option 2: Clipboard copy */}
                    <button
                      type="button"
                      onClick={() => {
                        const fullMessageText = `Dear Phuket Amazing Yacht Charter,\n\nI am presenting a yacht charter inquiry:\n\nName: ${name || "Interested Customer"}\nContact: ${contact || "Not provided"}\n\nMessage: ${message}`;
                        navigator.clipboard.writeText(fullMessageText);
                        setLocalFallbackCopied(true);
                        setTimeout(() => setLocalFallbackCopied(false), 3000);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors border border-slate-200 cursor-pointer"
                    >
                      {localFallbackCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>✓ Copied to clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span>📋 Copy inquiry content</span>
                        </>
                      )}
                    </button>

                    {/* Option 3: Mail fallback */}
                    <a
                      href={`mailto:${currentAgent?.email || "booking@charter-partner.com"}?subject=Phuket Yacht Charter Inquiry&body=${encodeURIComponent(
                        `Dear Phuket Amazing Yacht Charter,\n\nI am presenting a yacht charter inquiry:\n\nName: ${name || "Interested Customer"}\nContact: ${contact || "Not provided"}\n\nMessage: ${message}`,
                      )}`}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors text-center block"
                    >
                      ✉️ Send via Email
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuotaExceeded(false)}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-slate-700 underline pt-2 cursor-pointer block"
                  >
                    ← Back to edit form
                  </button>
                </div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-emerald-600 ml-1" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">
                    Inquiry Sent!
                  </h4>
                  <p className="text-slate-600 text-sm">
                    Our team will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Have a question? Send us a message and our agents will
                    respond promptly.
                  </p>

                  {availableDraft && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-lg flex flex-col gap-1.5 text-left mb-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-600 text-sm">✨</span>
                        <span>Yacht Inquiry Auto-filled!</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        We have automatically matched and loaded your customized
                        charter summary. Feel free to review or add more
                        details.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (availableDraft.text)
                            setMessage(availableDraft.text);
                          if (availableDraft.name) setName(availableDraft.name);
                          if (availableDraft.contact)
                            setContact(availableDraft.contact);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 outline-none underline text-left self-start cursor-pointer hover:no-underline"
                      >
                        Reset to Draft Values
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email or Phone
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      placeholder="Your contact info"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm resize-none"
                      placeholder="How can we help you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200/60 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5 select-none text-[11.5px]">
                        <Folder className="w-3.5 h-3.5 text-emerald-600" />
                        Workspace Folder:{" "}
                        <strong className="text-emerald-800">{folder}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowFolderInput(!showFolderInput)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {showFolderInput ? "Lock Folder" : "Change Folder"}
                      </button>
                    </div>
                    {showFolderInput && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-200/50 mt-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                          Designate Workspace Folder (e.g. VIP, Urgent,
                          JulyTours)
                        </label>
                        <input
                          type="text"
                          value={folder === "Inbox" ? "" : folder}
                          onChange={(e) => setFolder(e.target.value || "Inbox")}
                          placeholder="Type custom folder name..."
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none font-sans"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      {pdfFile ? (
                        <span className="truncate max-w-[200px]">
                          {pdfFile.name} (Attached)
                        </span>
                      ) : (
                        "Attach PDF Document (Optional)"
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-5 py-3 rounded-full text-white font-medium shadow-lg transition-all cursor-pointer ${
          isOpen
            ? "bg-slate-800 hover:bg-slate-900"
            : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">
          {isOpen ? "Close" : "Live Inquiry"}
        </span>
      </button>
    </div>
  );
}
