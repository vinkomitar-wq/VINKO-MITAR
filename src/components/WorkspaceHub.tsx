import React, { useState, useEffect } from "react";
import {
  Mail,
  Calendar,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function WorkspaceHub() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [emails, setEmails] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
      provider.addScope("https://www.googleapis.com/auth/gmail.send");
      provider.addScope("https://www.googleapis.com/auth/calendar");
      provider.addScope("https://www.googleapis.com/auth/chat.messages");
      provider.addScope("https://www.googleapis.com/auth/chat.spaces");
      provider.addScope("https://www.googleapis.com/auth/forms");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        fetchApis(credential.accessToken);
      }
    } catch (err) {
      console.error(err);
      alert("Workspace authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApis = async (accessToken: string) => {
    setLoading(true);
    try {
      // Fetch Gmail
      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (gmailRes.ok) {
        const gmailData = await gmailRes.json();
        const msgList = await Promise.all(
          (gmailData.messages || []).map(async (m: any) => {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );
            const detail = await detailRes.json();
            const subjectHeader = detail.payload?.headers?.find(
              (h: any) => h.name === "Subject",
            );
            const fromHeader = detail.payload?.headers?.find(
              (h: any) => h.name === "From",
            );
            return {
              id: m.id,
              subject: subjectHeader?.value || "No Subject",
              from: fromHeader?.value || "Unknown",
            };
          }),
        );
        setEmails(msgList);
      }

      // Fetch Calendar
      const timeMin = new Date().toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=3&orderBy=startTime&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.items || []);
      }
      // Fetch Chat
      const chatRes = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setSpaces(chatData.spaces || []);
      }
    } catch (err) {
      console.error("API Error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 block animate-in fade-in duration-150 text-left">
      <div className="border-b pb-3 flex justify-between items-end">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-indigo-700" />
            <span>Google Workspace Integration Hub</span>
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
            Connect your Google Workspace features to automate charter
            processes, sync availability calendars, and manage incoming agency
            communications seamlessly.
          </p>
        </div>
        {!token ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="py-1.5 px-3 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase cursor-pointer hover:bg-indigo-700 disabled:opacity-50 flex gap-2 items-center"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            Sign In with Google
          </button>
        ) : (
          <button
            onClick={() => fetchApis(token)}
            disabled={loading}
            className="py-1.5 px-3 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase cursor-pointer hover:bg-slate-200 disabled:opacity-50 flex gap-2 items-center"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Refresh Sync
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gmail Card */}
        <div className="border border-slate-200 bg-white rounded p-4 flex flex-col space-y-4 shadow-3xs cursor-pointer hover:border-red-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-red-500" />
              <h6 className="font-serif text-sm font-extrabold text-slate-800">
                Gmail Sync
              </h6>
            </div>

            {token ? (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-700 border-b pb-1">
                  Unread Inquiries (Latest 3)
                </p>
                {emails.length === 0 ? (
                  <p className="text-xs text-slate-400">No emails found.</p>
                ) : null}
                {emails.map((m) => (
                  <div
                    key={m.id}
                    className="text-[9px] bg-slate-50 p-2 border border-slate-100 rounded"
                  >
                    <span className="font-bold text-red-700 block">
                      {m.from}
                    </span>
                    <span className="text-slate-600 truncate block w-full">
                      {m.subject}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Send automated charter confirmations, read incoming inquiries
                directly, and dispatch customer itineraries as PDF attachments.
              </p>
            )}
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="border border-slate-200 bg-white rounded p-4 flex flex-col space-y-4 shadow-3xs cursor-pointer hover:border-blue-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h6 className="font-serif text-sm font-extrabold text-slate-800">
                Charter Calendar
              </h6>
            </div>

            {token ? (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-700 border-b pb-1">
                  Upcoming Charters (Next 3)
                </p>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400">No events found.</p>
                ) : null}
                {events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="text-[9px] bg-slate-50 p-2 border border-slate-100 rounded"
                  >
                    <span className="font-bold text-blue-700 block">
                      {ev.summary || "Busy"}
                    </span>
                    <span className="text-slate-600">
                      {new Date(
                        ev.start?.dateTime || ev.start?.date,
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Synchronize vessel availability with your agency Google
                Calendar. Automatically block out charter dates upon proposal
                confirmation.
              </p>
            )}
          </div>
        </div>

        {/* Google Chat Card */}
        <div className="border border-slate-200 bg-white rounded p-4 flex flex-col space-y-4 shadow-3xs cursor-pointer hover:border-emerald-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h6 className="font-serif text-sm font-extrabold text-slate-800">
                Google Chat Notification
              </h6>
            </div>
            {token ? (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-700 border-b pb-1">
                  Agency Chat Spaces
                </p>
                {spaces.length === 0 ? (
                  <p className="text-xs text-slate-400">No spaces found.</p>
                ) : null}
                {spaces.slice(0, 3).map((sp, idx) => (
                  <div
                    key={idx}
                    className="text-[9px] bg-slate-50 p-2 border border-slate-100 rounded flex items-center justify-between"
                  >
                    <span className="font-bold text-emerald-700">
                      {sp.displayName || "Direct Message"}
                    </span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded uppercase font-bold">
                      {sp.spaceType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Pipe real-time customer website interactions, new leads, and
                signed documents directly into your agency's Google Chat spaces.
              </p>
            )}
          </div>
        </div>

        {/* Google Forms Card */}
        <div className="border border-slate-200 bg-white rounded p-4 flex flex-col space-y-4 shadow-3xs cursor-pointer hover:border-purple-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h6 className="font-serif text-sm font-extrabold text-slate-800">
                Google Forms
              </h6>
            </div>
            {token ? (
              <div className="mt-4 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded border border-slate-100">
                <span className="text-purple-500 font-bold text-xs uppercase tracking-widest mb-1 shadow-sm">
                  Authenticated
                </span>
                <span className="text-[10px] text-slate-400 text-center px-4">
                  Workspace Forms API Ready.
                  <br />
                  Set a target Form ID to retrieve responses.
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Read submitted Google Form passenger lists, passenger manifests,
                and waiver agreements securely directly within your workspace
                dashboard.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
