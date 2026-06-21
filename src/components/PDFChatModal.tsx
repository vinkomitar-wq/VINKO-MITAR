import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  FileText,
  Send,
  MessageSquare,
  Loader2,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  Trash2,
  ChevronRight,
  HelpCircle,
  Calendar,
  Users,
  Phone,
  Mail,
  UserCheck,
  QrCode,
  Copy,
  Download,
} from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAgent } from "../AgentContext";

interface Message {
  id?: string;
  sender: "client" | "agent" | "ai";
  text: string;
  createdAt: string;
  seen: boolean;
  isPdfAttached?: boolean;
  fileName?: string;
  pdfData?: string;
}

interface PDFChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFChatModal({ isOpen, onClose }: PDFChatModalProps) {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [dynamicHistoryRaw, setDynamicHistoryRaw] = useState<string>("[]");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMesssage, setErrorMessage] = useState<string | null>(null);
  const [extractedDetails, setExtractedDetails] = useState<{
    customerName?: string;
    contactEmail?: string;
    contactPhone?: string;
    targetTravelDate?: string;
    totalGuests?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { currentAgent } = useAgent();
  const [activeTab, setActiveTab] = useState<"ai">("ai");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Suggested questions based on yacht charter quotes
  const prepopulatedQuestions = [
    "What is the total charter price?",
    "How many passengers can fit on board?",
    "What is the day charter itinerary?",
    "Is gourmet lunch or drinks included?",
    "Is there an overnight charter option?",
  ];

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const [chatListenerId, setChatListenerId] = useState<string | null>(() => {
    return localStorage.getItem("phuket_charter_active_chat_id");
  });

  // Listen to Firestore for two-way communication when active chat exists!
  useEffect(() => {
    if (!chatListenerId) return;

    console.log("PDF Chatbot attaching listener to", chatListenerId);
    const docRef = doc(db, "inquiries", chatListenerId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.chatHistory) {
          // Sync incoming messages from the human agent into local UI
          setChatHistory((prev) => {
            // Only update if the history length changed or if we need to
            return data.chatHistory;
          });
        }
      }
    });

    return () => unsubscribe();
  }, [chatListenerId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const savePdfChatInquiry = async (
    file: File,
    base64Data: string,
    textExtracted: string,
    detailsExtracted: any,
    replyMessage: string,
    savedUrl: string = "",
  ) => {
    try {
      let activeId = localStorage.getItem("phuket_charter_active_chat_id");
      if (!activeId) {
        activeId = `inq_${Date.now()}_pdf_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("phuket_charter_active_chat_id", activeId);
        setChatListenerId(activeId);
      }

      const agentObj = currentAgent || {
        name: "Agent Representative",
        email: "info@phuketcharter.com",
      };
      const brokerEmailStr = agentObj.email || "info@phuketcharter.com";
      const brokerIdStr = agentObj.id || "unassigned";

      const guestName = detailsExtracted.customerName?.trim() || "Luka (Guest)";
      const guestContact =
        detailsExtracted.contactEmail?.trim() ||
        detailsExtracted.contactPhone?.trim() ||
        "Uploaded PDF Spec";

      const chatHistoryObj = [
        {
          id: `msg_auto_upload_${Date.now()}`,
          sender: "client",
          text: `📄 Attached: ${file.name} (Catamaran Specifications)`,
          createdAt: new Date().toISOString(),
          isPdfAttached: true,
          fileName: file.name,
          pdfData: base64Data,
          charterInquiriesUrl: savedUrl,
        },
        {
          id: `msg_ai_greet_${Date.now()}`,
          sender: "agent",
          text: `🤖 [AI Concierge] ${replyMessage || "Hello! I am scanning your uploaded catamaran specifications."}`,
          createdAt: new Date().toISOString(),
        },
      ];

      const payload: any = {
        id: activeId,
        name: guestName,
        contact: guestContact,
        message: `Uploaded Catamaran specification PDF: ${file.name}`,
        folder: "Chatbot",
        createdAt: new Date().toISOString(),
        isRead: false,
        source: "PDF Chatbot",
        brokerId: brokerIdStr,
        brokerEmail: brokerEmailStr,
        fileName: file.name,
        pdfData: base64Data,
        charterInquiriesUrl: savedUrl,
        extractedText: textExtracted,
        extractedDetails: detailsExtracted || {},
        chatHistory: chatHistoryObj,
      };

      await setDoc(doc(db, "inquiries", activeId), payload);
      window.dispatchEvent(
        new CustomEvent("phuket_charter_chat_linked", {
          detail: { inquiryId: activeId },
        }),
      );
      console.log(
        "Automatically synchronized PDF Chatbot inquiry to Firestore folder: Chatbot",
        activeId,
      );
    } catch (err) {
      console.error(
        "Failed to automatically synchronize PDF Chatbot inquiry:",
        err,
      );
    }
  };

  const uploadToGoogleDrive = async (file: File): Promise<string | null> => {
    try {
      // 1. Fetch active Google Drive session configuration from Firestore
      const driveSnap = await getDoc(
        doc(db, "google_drive_configs", "default"),
      );
      if (!driveSnap.exists()) {
        console.log(
          "No stored Google Drive configuration found in Firestore 'google_drive_configs/default'.",
        );
        return null;
      }

      const { accessToken, folderId } = driveSnap.data();
      if (!accessToken) {
        console.log(
          "Stored Google Drive configuration is missing accessToken.",
        );
        return null;
      }

      // 2. Query to find or create the 'charter-inquiries' folder inside the agent's Google Drive space
      let targetFolderId = folderId;
      try {
        const folderQuery = encodeURIComponent(
          "name='charter-inquiries' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        );
        const folderSearchRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (folderSearchRes.ok) {
          const searchData = await folderSearchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            targetFolderId = searchData.files[0].id;
            console.log(
              "Found existing 'charter-inquiries' folder on Google Drive:",
              targetFolderId,
            );
          } else {
            // Create 'charter-inquiries' folder
            const makeFolderRes = await fetch(
              "https://www.googleapis.com/drive/v3/files",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: "charter-inquiries",
                  mimeType: "application/vnd.google-apps.folder",
                }),
              },
            );
            if (makeFolderRes.ok) {
              const newFolderData = await makeFolderRes.json();
              targetFolderId = newFolderData.id;
              console.log(
                "Created 'charter-inquiries' bucket/folder on Google Drive:",
                targetFolderId,
              );
            }
          }
        }
      } catch (folderErr) {
        console.warn(
          "Error finding/creating 'charter-inquiries' folder in Google Drive:",
          folderErr,
        );
      }

      // 3. Upload the file to Google Drive (using the target folder as parent)
      const metadata = {
        name: file.name,
        parents: targetFolderId ? [targetFolderId] : undefined,
      };

      const uploadFormData = new FormData();
      uploadFormData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      uploadFormData.append("file", file);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: uploadFormData,
        },
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Google Drive API upload failed: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // 4. Generate a public-facing URL by making the file readable by anyone
      try {
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: "reader",
              type: "anyone",
            }),
          },
        );
        console.log(
          "Succeeded setting read permissions on uploaded Google Drive file.",
        );
      } catch (permErr) {
        console.warn(
          "Failed to set open read permissions on Google Drive file:",
          permErr,
        );
      }

      // Construct direct streamable/downloadable public URL
      const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log(
        "Generated Google Drive public URL for attachment:",
        publicUrl,
      );
      return publicUrl;
    } catch (err) {
      console.error(
        "Failed Google Drive auto-upload within PDFChatModal:",
        err,
      );
      return null;
    }
  };

  const parsePdfFiles = async (files: File[]) => {
    setIsParsing(true);
    setErrorMessage(null);
    setExtractedText("");
    setChatHistory([]);
    setDynamicHistoryRaw("[]");
    setExtractedDetails({});

    let accumulatedText = "";
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf") {
        setErrorMessage(`Skipping non-PDF file: ${file.name}`);
        continue;
      }
      validFiles.push(file);

      try {
        const formData = new FormData();
        formData.append("pdf", file);
        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          accumulatedText += `\n\n--- Document: ${file.name} ---\n\n${data.text || ""}`;
        }
      } catch (err) {
        console.error(`Failed to parse ${file.name}`, err);
      }
    }

    setPdfFiles(validFiles);
    setExtractedText(accumulatedText);

    // CRM sync for the first file
    if (validFiles.length > 0) {
      const file = validFiles[0];
      let resolvedAttachmentUrl = "";

      try {
        const chatFormData = new FormData();
        chatFormData.append("pdf", file);
        chatFormData.append(
          "question",
          "Hello! Scan this catamaran document context and automatically extract: full name, contact email, contact phone, target travel date, and passenger guest count. If they are in the document, identify them clearly. Wrap them nicely in your brief greeting review answer.",
        );
        chatFormData.append("extractedText", accumulatedText);
        chatFormData.append("history", "[]");

        const extractRes = await fetch("/api/chat-with-pdf", {
          method: "POST",
          body: chatFormData,
        });

        if (extractRes.ok) {
          const extractData = await extractRes.json();
          const detailsResolved = extractData.details || {};

          if (extractData.driveUrl) {
            resolvedAttachmentUrl = extractData.driveUrl;
          } else {
            const gdriveLink = await uploadToGoogleDrive(file);
            if (gdriveLink) resolvedAttachmentUrl = gdriveLink;
          }

          setExtractedDetails(detailsResolved);
          // if (detailsResolved.customerName) setInitName(detailsResolved.customerName);
          const contactStr =
            detailsResolved.contactEmail || detailsResolved.contactPhone || "";
          // if (contactStr) setInitContact(contactStr);

          if (extractData.reply) {
            setChatHistory([
              {
                id: `msg_ai_${Date.now()}`,
                sender: "ai",
                text: extractData.reply,
                createdAt: new Date().toISOString(),
                seen: false,
              },
            ]);
            setDynamicHistoryRaw(extractData.history || "[]");
          }

          const base64Data = await fileToBase64(file);
          await savePdfChatInquiry(
            file,
            base64Data,
            accumulatedText,
            detailsResolved,
            extractData.reply || "",
            resolvedAttachmentUrl,
          );
        } else {
          // Error handling fallback...
          const gdriveLink = await uploadToGoogleDrive(file);
          if (gdriveLink) resolvedAttachmentUrl = gdriveLink;
          const base64Data = await fileToBase64(file);
          await savePdfChatInquiry(
            file,
            base64Data,
            accumulatedText,
            {},
            "Successfully scanned the document! Ask any catamaran queries.",
            resolvedAttachmentUrl,
          );
        }
      } catch (err) {
        console.error("PDF Parsing/CRM Sync Error:", err);
      }
    }

    setIsParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parsePdfFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parsePdfFiles(Array.from(e.target.files));
    }
  };

  const handleClearFile = () => {
    setPdfFiles([]);
    setExtractedText("");
    setChatHistory([]);
    setDynamicHistoryRaw("[]");
    setQuestion("");
    setErrorMessage(null);
    setExtractedDetails({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (questionText?: string) => {
    const activeQuestion = (questionText || question).trim();
    if (!activeQuestion || pdfFiles.length === 0 || isLoading) return;

    if (!questionText) {
      setQuestion("");
    }

    // Update local UI immediately with the user message
    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      sender: "client",
      text: activeQuestion,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat-with-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: activeQuestion,
          extractedText: extractedText,
          history: dynamicHistoryRaw,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      const botMessage: Message = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: `🤖 [AI Concierge] ${data.reply}`,
        createdAt: new Date().toISOString(),
        seen: false,
      };
      setChatHistory((prev) => [...prev, botMessage]);
      setDynamicHistoryRaw(data.history);

      if (data.details) {
        setExtractedDetails((prev) => {
          const updated = { ...prev };
          const newDetails = data.details;
          if (newDetails.customerName)
            updated.customerName = newDetails.customerName;
          if (newDetails.contactEmail)
            updated.contactEmail = newDetails.contactEmail;
          if (newDetails.contactPhone)
            updated.contactPhone = newDetails.contactPhone;
          if (newDetails.targetTravelDate)
            updated.targetTravelDate = newDetails.targetTravelDate;
          if (newDetails.totalGuests)
            updated.totalGuests = newDetails.totalGuests;
          return updated;
        });
      }

      // Sync subsequently to Firestore active inquiry thread in "Chatbot" folder
      let activeId = localStorage.getItem("phuket_charter_active_chat_id");
      if (activeId) {
        try {
          const docRef = doc(db, "inquiries", activeId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const currentHistory = snap.data().chatHistory || [];
            const updatedHistory = [
              ...currentHistory,
              {
                id: `msg_user_${Date.now()}`,
                sender: "client",
                text: activeQuestion,
                createdAt: new Date().toISOString(),
                seen: false,
              },
              {
                id: `msg_ai_${Date.now()}`,
                sender: "agent",
                text: `🤖 [AI Concierge] ${data.reply}`,
                createdAt: new Date().toISOString(),
                seen: false,
              },
            ];

            const currentExtracted = snap.data().extractedDetails || {};
            const mergedExtracted = {
              ...currentExtracted,
              ...(data.details || {}),
            };
            const updatedName =
              mergedExtracted.customerName?.trim() ||
              snap.data().name ||
              "Luka (Guest)";
            const updatedContact =
              mergedExtracted.contactEmail?.trim() ||
              mergedExtracted.contactPhone?.trim() ||
              snap.data().contact ||
              "Uploaded PDF Spec";

            await updateDoc(docRef, {
              chatHistory: updatedHistory,
              extractedDetails: mergedExtracted,
              name: updatedName,
              contact: updatedContact,
              isRead: false,
            });
          }
        } catch (syncErr) {
          console.error("Failed to sync AI chat turn to FireStore:", syncErr);
        }
      }
    } catch (err: any) {
      console.error("PDF Chat Error:", err);
      const errorMsg =
        err.message ||
        "Failed to reach the server. Please check your network connection.";
      setChatHistory((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "ai",
          text: `⚠️ API Connection Error: ${errorMsg}`,
          createdAt: new Date().toISOString(),
          seen: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSummary = async () => {
    setIsSummarizing(true);
    await handleSend("Provide a 3-bullet point summary of this document.");
    setIsSummarizing(false);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportChatJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(chatHistory, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `chat_export_${new Date().toISOString()}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setDynamicHistoryRaw("[]");
    localStorage.removeItem("phuket_charter_active_chat_id");
    // setLiveInquiryId(null);
    setActiveTab("ai");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="pdf-chat-portal"
          className="fixed inset-0 z-[5500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
        >
          {/* Backdrop Click Close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            id="pdf-chat-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            className={`bg-white w-full rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative z-10 transition-all duration-300 ${
              pdfFiles.length > 0
                ? "max-w-4xl h-[85vh] sm:h-[80vh]"
                : "max-w-xl h-[70vh] sm:h-[70vh]"
            }`}
          >
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-sans font-bold text-sm tracking-wide text-white">
                    Catamaran Charter AI
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-0.5 uppercase">
                    {" "}
                    Bespoke PDF Document Dialogue Engine
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Clear all chat messages"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExportChatJSON}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Export chat history as JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  id="close-pdf-chat-btn"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close AI Engine"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isOnline && (
              <div className="bg-amber-100 text-amber-900 px-4 py-2 text-[11px] font-bold text-center border-b border-amber-200">
                ⚠️ Connection lost. Reconnecting...
              </div>
            )}

            {/* Split Screen or Interactive Body */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* STAGE 1: Upload PDF */}
              {pdfFiles.length === 0 ? (
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center items-center max-w-md mx-auto text-center">
                  {/* QR Code Scan Simulation toolkit */}
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-800 text-xs text-left mb-4 shadow-sm w-full">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px] mb-1.5 uppercase font-mono tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      QR Code Referee Scanner Simulator
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug mb-3 font-sans">
                      Under standard catamaran broker workflows, clients scan QR
                      codes pointing to specific agents' profiles. Simulate
                      scanning of our representative QR codes to dynamically
                      pair your communications session:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = "?agent=Representative";
                        }}
                        className={`px-3 py-1.5 rounded text-[10px] font-sans font-extrabold flex items-center gap-1.5 transition-all text-slate-900 bg-white hover:bg-slate-150 cursor-pointer shadow-xs ${
                          currentAgent
                            ? "ring-2 ring-emerald-500 bg-emerald-50 text-emerald-950 font-black h-fit"
                            : ""
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-800" />
                        <span>Scan Sample Agent QR Code</span>
                      </button>
                    </div>
                    <div className="mt-2.5 text-[9px] text-slate-500 flex items-center gap-1 font-sans">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Representative Active:{" "}
                      <strong className="text-slate-300">
                        {currentAgent?.name || "None"}
                      </strong>
                      {currentAgent && (
                        <span className="opacity-75">
                          ({currentAgent.email})
                        </span>
                      )}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center"
                  >
                    <MessageSquare className="w-6 h-6 text-slate-500" />
                  </motion.div>

                  <h4 className="font-sans font-extrabold text-[#0F172A] text-lg tracking-tight mb-2">
                    Locked-In Charter Document Helper
                  </h4>
                  <p className="text-xs text-slate-500 font-sans leading-relaxed mb-8">
                    Upload your bespoke catamaran quotation or spec PDF to
                    immediately ask questions about price, routes, chef
                    services, itineraries, and inclusions.
                  </p>

                  {/* Drag and Drop Zone */}
                  {isParsing ? (
                    <div className="w-full p-10 border-2 border-dashed border-emerald-500 bg-emerald-500/5 rounded-xl flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                      <div>
                        <span className="text-sm font-extrabold text-[#0F172A] block animate-pulse">
                          Parsing & Extracting PDF Text...
                        </span>
                        <span className="text-xs text-slate-500 block mt-1.5 font-medium">
                          Analyzing catamaran charter specs & quotes in
                          real-time
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      id="pdf-drop-zone"
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center gap-4 ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        multiple
                        className="hidden"
                      />
                      <Upload
                        className={`w-8 h-8 ${dragActive ? "text-emerald-500" : "text-slate-400"}`}
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0F172A] block">
                          Drag and drop your PDF here, or
                        </span>
                        <span className="text-[11px] text-emerald-600 font-bold underline mt-0.5 block">
                          browse device folders
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                        ACCEPTED: .PDF DOCUMENT (MAX 10MB)
                      </span>
                    </div>
                  )}

                  {errorMesssage && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs text-left rounded-lg border border-red-100 w-full font-medium">
                      ⚠️ {errorMesssage}
                    </div>
                  )}
                </div>
              ) : (
                /* STAGE 2: Interactive Chat Dialogue with Live Sidebar */
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Chat Panel (Left 2/3) */}
                  <div className="flex-1 flex flex-col overflow-hidden md:border-r md:border-slate-200">
                    <>
                      {/* File Lock In Badge */}
                      <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-left shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1 px-1.5 bg-emerald-100 rounded text-emerald-700 shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 block leading-tight font-extrabold">
                              LOCK IN ACTIVE DOCUMENT
                            </span>
                            <span className="text-[11px] text-emerald-950 font-bold truncate block max-w-[280px] sm:max-w-md">
                              {pdfFiles.map((f) => f.name).join(", ")}
                            </span>
                          </div>
                        </div>
                        <button
                          id="reset-pdf-file-btn"
                          type="button"
                          onClick={handleClearFile}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Upload a different itinerary document"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Change File</span>
                        </button>
                      </div>

                      {/* Message Container Log */}
                      <div
                        id="pdf-chat-log"
                        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
                      >
                        {chatHistory.length === 0 ? (
                          <div className="h-full flex flex-col justify-center items-center text-center p-6 max-w-sm mx-auto">
                            <Bot className="w-8 h-8 text-emerald-500 mb-3 animate-pulse" />
                            <h5 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                              AI Assistant Ready
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                              The document details are now fed directly into my
                              context windows. Click a suggested prompt below or
                              type your customized message.
                            </p>

                            {/* Suggestion Chips */}
                            <div className="mt-5 w-full space-y-2">
                              {prepopulatedQuestions.map((q, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSend(q)}
                                  className="w-full text-left p-2.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-[11px] text-slate-700 rounded-lg transition-all flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{q}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {chatHistory.map((msg, index) => (
                              <div
                                key={index}
                                className={`flex items-start gap-2.5 ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                              >
                                {msg.sender !== "client" && (
                                  <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-xs">
                                    <Bot className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs text-left ${
                                    msg.sender === "client"
                                      ? "bg-slate-900 text-white rounded-tr-sm font-medium"
                                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm"
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">{msg.text}</div>
                                    {msg.sender === "ai" && (
                                      <button
                                        onClick={() =>
                                          handleCopyToClipboard(msg.text)
                                        }
                                        className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 rounded-sm cursor-pointer shrink-0"
                                        title="Copy to clipboard"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {msg.sender === "agent" && msg.seen && (
                                    <div className="text-[9px] text-blue-500 font-bold mt-1 text-right">
                                      ✓✓ Seen
                                    </div>
                                  )}
                                </div>
                                {msg.sender === "client" && (
                                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-slate-600" />
                                  </div>
                                )}
                              </div>
                            ))}

                            {isLoading && (
                              <div className="flex items-start gap-2.5 justify-start">
                                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-xs">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-xs">
                                  <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                                  <span className="text-[11px] text-emerald-700 font-semibold animate-pulse">
                                    Generating answer...
                                  </span>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </div>

                      {/* Input form */}
                      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        <button
                          onClick={handleQuickSummary}
                          disabled={isLoading || isSummarizing}
                          className="mb-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isSummarizing ? "Summarizing..." : "Quick Summary"}
                        </button>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isLoading) {
                                handleSend();
                              }
                            }}
                            disabled={isLoading}
                            placeholder="Ask about passengers, pricing, itineraries..."
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors disabled:opacity-50"
                          />
                          <button
                            id="submit-pdf-chat-query"
                            type="button"
                            onClick={() => handleSend()}
                            disabled={!question.trim() || isLoading}
                            className="absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center bg-slate-900 text-white rounded-lg disabled:bg-slate-100 disabled:text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Submit bespoke query"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1.5 text-center">
                          <span className="text-[10px] text-slate-400 font-sans">
                            ⚡ Powered by Gemini 3.5 Flash for concise document
                            analysis
                          </span>
                        </div>
                      </div>
                    </>
                    {/* 
                    ) : (
                      // Live support broker panel
                      ...
                    )} 
                    */}
                  </div>

                  {/* Booking Intelligence Sidebar (Right 1/3) */}
                  <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 p-5 overflow-y-auto shrink-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-4 select-none">
                        <UserCheck className="w-4 h-4 text-emerald-605 text-emerald-600" />
                        <h4 className="text-xs font-mono tracking-widest uppercase text-slate-800 font-extrabold">
                          Extracted CRM Profile
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans leading-relaxed mb-5 select-none">
                        These lead attributes are parsed in real-time as the
                        customer converses with the catamaran itinerary document
                        context.
                      </p>

                      <div className="space-y-3.5">
                        {/* Customer Name */}
                        <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-left">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 block mb-1 select-none">
                            Lead Name
                          </span>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`text-[11px] font-bold ${extractedDetails.customerName ? "text-[#0F172A]" : "text-slate-400 italic font-normal"}`}
                            >
                              {extractedDetails.customerName ||
                                "Not yet mentioned"}
                            </span>
                          </div>
                        </div>

                        {/* Contact Email */}
                        <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-left">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 block mb-1 select-none">
                            Contact Email
                          </span>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`text-[11px] font-bold break-all ${extractedDetails.contactEmail ? "text-[#0F172A]" : "text-slate-400 italic font-normal"}`}
                            >
                              {extractedDetails.contactEmail ||
                                "Not yet mentioned"}
                            </span>
                          </div>
                        </div>

                        {/* Contact Phone */}
                        <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-left">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 block mb-1 select-none">
                            Contact Phone
                          </span>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`text-[11px] font-bold ${extractedDetails.contactPhone ? "text-[#0F172A]" : "text-slate-400 italic font-normal"}`}
                            >
                              {extractedDetails.contactPhone ||
                                "Not yet mentioned"}
                            </span>
                          </div>
                        </div>

                        {/* Target Travel Date */}
                        <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-left">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 block mb-1 select-none">
                            Travel Date
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`text-[11px] font-bold ${extractedDetails.targetTravelDate ? "text-[#0F172A]" : "text-slate-400 italic font-normal"}`}
                            >
                              {extractedDetails.targetTravelDate ||
                                "Not yet mentioned"}
                            </span>
                          </div>
                        </div>

                        {/* Total GuestsCount */}
                        <div className="bg-white border border-slate-200/60 rounded-lg p-3 text-left">
                          <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 block mb-1 select-none">
                            Passenger Count
                          </span>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`text-[11px] font-bold ${extractedDetails.totalGuests ? "text-[#0F172A]" : "text-slate-400 italic font-normal"}`}
                            >
                              {extractedDetails.totalGuests ||
                                "Not yet mentioned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/80 text-left select-none">
                      <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 border border-emerald-100/55 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[9px] font-semibold text-emerald-800 leading-tight">
                          Syncing active with Phuket Agent Suite
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
