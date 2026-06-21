import React, { useState } from "react";
import {
  Compass,
  UserCheck,
  Briefcase,
  MessageSquare,
  LogOut,
  QrCode,
  Copy,
  Check,
  User,
  Settings,
  Lock,
  Anchor,
  FileText,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const CopyHelperButton = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white/90 px-2 py-0.5 rounded-sm transition-all xs:ml-1 cursor-pointer"
      title={label}
    >
      {copied ? (
        <Check className="w-2.5 h-2.5 text-emerald-400" />
      ) : (
        <Copy className="w-2.5 h-2.5" />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

interface FastBookingSystemProps {
  currentAgent?: any;
  currentCustomer?: any;
  customerData?: any;
  isReferred?: boolean;
  onOpenAgentPortal: () => void;
  onOpenCustomerPortal: (tab?: "login" | "register" | "forgot" | "express-manifest") => void;
  onOpenCaptainPortal: () => void;
  onLogoutAgent: () => void;
  onLogoutCustomer: () => void;
  getContactPhone: () => string;
  unreadInquiriesCount?: number;
  onSelectUnreadChat?: () => void;
  hasActiveChat?: boolean;
  hasSelectedVessel?: boolean;
}

export default function FastBookingSystem({
  currentAgent,
  currentCustomer,
  customerData,
  isReferred,
  onOpenAgentPortal,
  onOpenCustomerPortal,
  onOpenCaptainPortal,
  onLogoutAgent,
  onLogoutCustomer,
  getContactPhone,
  unreadInquiriesCount = 0,
  onSelectUnreadChat,
  hasActiveChat,
  hasSelectedVessel = false,
}: FastBookingSystemProps) {
  const [showQRMap, setShowQRMap] = useState<Record<string, boolean>>({});

  const toggleQR = (key: string) => {
    setShowQRMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartGuestBooking = () => {
    window.location.href = "/?workspace=customer&mode=guest";
  };

  return (
    <div
      id="fast-booking-control-hub"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 mb-4"
    >
      {/* Dynamic Connected Agent Banner */}
      {(isReferred || currentAgent) && (
        <div className="mb-3 bg-[#0F172A] border border-slate-800 text-white p-3 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                {isReferred
                  ? "Custom Broker Referral active"
                  : "Representative Session Active"}
              </p>
              <p className="text-xs font-semibold text-white mt-0.5">
                <span className="text-emerald-400">
                  Connected Agent: {currentAgent?.name || "Representative"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentAgent?.whatsapp && (
              <div className="relative inline-flex items-center bg-white/5 rounded-xs px-2 py-0.5 gap-1 border border-white/10">
                <span className="text-[10px] text-slate-300 font-medium font-sans">
                  WA:
                </span>
                <a
                  href={`https://wa.me/${currentAgent.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-mono text-[11px] hover:text-emerald-400 underline transition-all"
                >
                  {currentAgent.whatsapp}
                </a>
                <button
                  onClick={() => toggleQR("wa")}
                  className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Toggle WhatsApp QR Code"
                >
                  <QrCode className="w-3 h-3 text-slate-300" />
                </button>
                {showQRMap["wa"] && (
                  <div className="absolute right-0 top-full mt-2 bg-white p-2 rounded shadow-2xl border border-slate-200 z-[999] text-[#0F172A] flex flex-col items-center animate-in zoom-in-95 duration-150">
                    <QRCodeSVG
                      value={`https://wa.me/${currentAgent.whatsapp.replace(/[^\d]/g, "")}`}
                      size={76}
                    />
                    <span className="text-[7px] font-bold uppercase mt-1">
                      Scan WhatsApp
                    </span>
                  </div>
                )}
              </div>
            )}

            {currentAgent?.lineId && (
              <div className="relative inline-flex items-center bg-white/5 rounded-xs px-2 py-0.5 gap-1 border border-white/10">
                <span className="text-[10px] text-slate-300 font-medium font-sans">
                  LINE:
                </span>
                <strong className="text-white font-mono text-[11px]">
                  {currentAgent.lineId}
                </strong>
                <button
                  onClick={() => toggleQR("line")}
                  className="p-1 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Toggle LINE QR Code"
                >
                  <QrCode className="w-3 h-3 text-slate-300" />
                </button>
                {showQRMap["line"] && (
                  <div className="absolute right-0 top-full mt-2 bg-white p-2 rounded shadow-2xl border border-slate-200 z-[999] text-[#0F172A] flex flex-col items-center animate-in zoom-in-95 duration-150">
                    <QRCodeSVG
                      value={`https://line.me/ti/p/~${currentAgent.lineId}`}
                      size={76}
                    />
                    <span className="text-[7px] font-bold uppercase mt-1">
                      Scan LINE
                    </span>
                  </div>
                )}
              </div>
            )}

            {isReferred && (
              <button
                onClick={onLogoutAgent}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider rounded-xs cursor-pointer transition-all ml-1"
                title="Clears custom broker session to restore standard agency dispatch"
              >
                Restore Standard Desk
              </button>
            )}
          </div>
        </div>
      )}

      {/* Luxury Portal & Booking Command Center Buttons */}
      {!(
        hasSelectedVessel &&
        !currentAgent &&
        !currentCustomer &&
        !hasActiveChat &&
        !isReferred
      ) && (
        <div className="bg-white border border-[#0F172A]/15 rounded-xs p-4 shadow-sm">
          {hasActiveChat || isReferred ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 px-1">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="text-left font-sans">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isReferred
                      ? "Direct Broker Referral Connection Active"
                      : "Direct Broker Connection Active"}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    {isReferred
                      ? `You are in a premium charter session with Broker Representative ${currentAgent?.name || "assigned to you"}. Configure your perfect marine excursion below.`
                      : "Your secure chat session is active in the floating pop-up window. Search vessel fleet and configure your itinerary below to sync with your broker."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("fleet-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 bg-[#0F172A] text-white hover:bg-slate-800 font-sans text-[10px] uppercase font-bold tracking-wider rounded-xs cursor-pointer select-none transition-all shadow-3xs"
                >
                  Configure Your Charter Below
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentAgent ? (
                // If an agent is logged in, they ONLY need to see their focused admin tools!
                <div className="col-span-1 md:col-span-3 flex w-full items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={onOpenAgentPortal}
                    className="flex-1 max-w-xl flex h-[52px] items-center justify-between rounded-xs px-5 bg-cyan-700 hover:bg-cyan-800 text-white transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Settings
                        className="h-4.5 w-4.5 text-cyan-300 animate-spin"
                        style={{ animationDuration: "6s" }}
                      />
                      <div className="text-left leading-tight">
                        <span className="block font-bold">
                          Broker Dashboard Active
                        </span>
                        <span className="block text-[8px] font-medium text-cyan-200 capitalize tracking-normal mt-0.5">
                          Manage Customer Inquiries, Calendars & Proposals
                        </span>
                      </div>
                    </div>
                  </button>
                  {unreadInquiriesCount > 0 && onSelectUnreadChat && (
                    <button
                      type="button"
                      onClick={onSelectUnreadChat}
                      className="h-[52px] px-4 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase rounded-xs flex items-center justify-center gap-1 animate-pulse border border-amber-650 shrink-0 cursor-pointer shadow-sm"
                      title="Active Inquiries"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>({unreadInquiriesCount})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onLogoutAgent}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 h-[52px] w-[52px] shrink-0 rounded-xs flex items-center justify-center transition-all cursor-pointer hover:scale-102 active:scale-97"
                    title="Logout Agent Desk"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : currentCustomer ? (
                // If a registered customer is logged in, show only customer-relevant links!
                <div className="col-span-1 md:col-span-3 flex w-full items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={onOpenCustomerPortal}
                    className="flex-1 max-w-xl flex h-[52px] items-center justify-between rounded-xs px-5 bg-emerald-700 hover:bg-emerald-850 text-white transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4.5 w-4.5 text-emerald-300" />
                      <div className="text-left leading-tight">
                        <span className="block font-bold">
                          Your Customer Workspace
                        </span>
                        <span className="block text-[8px] font-medium text-emerald-200 capitalize tracking-normal mt-0.5">
                          Access Booking Vouchers & Manifests
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={onLogoutCustomer}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 h-[52px] w-[52px] shrink-0 rounded-xs flex items-center justify-center transition-all cursor-pointer hover:scale-102 active:scale-97"
                    title="Sign Out Workspace"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Anonymous guest browser
                <>
                  {/* Button 1: Book as Guest (DISABLED) */}
                  {/* 
                <button
                  type="button"
                  onClick={handleStartGuestBooking}
                  className="group relative flex w-full h-[52px] items-center justify-between rounded-xs px-5 bg-[#0F172A] text-white hover:bg-slate-800 transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="h-4.5 w-4.5 text-amber-500 group-hover:rotate-45 transition-transform duration-350" />
                    <div className="text-left leading-tight">
                      <span className="block font-bold">Book as Guest</span>
                      <span className="block text-[8px] font-medium text-slate-400 capitalize tracking-normal mt-0.5">3-Step Instant Itinerary setup</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-xs group-hover:scale-105 transition-transform duration-200">Instant</span>
                </button> 
                */}

                  {/* Button 2: Registered Customer */}
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPortal("login")}
                    className="flex w-full h-[52px] items-center justify-between rounded-xs px-5 bg-white border border-[#0F172A]/15 text-[#0F172A] hover:bg-slate-50 transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-3xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                      <div className="text-left leading-tight">
                        <span className="block font-bold">
                          Registered Customer
                        </span>
                        <span className="block text-[8px] font-medium text-slate-500 capitalize tracking-normal mt-0.5">
                          Voucher retrieval & manifests
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-widest text-[#0F172A]/40">
                      LOGIN / SIGN UP
                    </span>
                  </button>

                  {/* Button 2.5: Express Manifest (No Registration) */}
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPortal("express-manifest")}
                    className="flex w-full h-[52px] items-center justify-between rounded-xs px-5 bg-emerald-50/20 border border-emerald-500/30 text-[#0F172A] hover:bg-emerald-50/40 transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-3xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4.5 w-4.5 text-emerald-600 animate-bounce" />
                      <div className="text-left leading-tight">
                        <span className="block font-bold text-emerald-850">
                          Express Passengers / Manifests
                        </span>
                        <span className="block text-[8.5px] font-semibold text-emerald-700 capitalize tracking-normal mt-0.5 flex items-center gap-1">
                          No registration • <span className="underline decoration-emerald-500/50 hover:text-emerald-950 font-extrabold cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.origin + "/?expressManifest=true");
                            alert("Direct Guest Link copied! Send this link to guests to allow them to fill out check-in manifests without registration.");
                          }}>Copy Shared Guest Link</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-widest text-emerald-700">
                      ACCESS PAGE
                    </span>
                  </button>

                  {/* Button 3: Agent Login */}
                  <button
                    type="button"
                    onClick={onOpenAgentPortal}
                    className="flex w-full h-[52px] items-center justify-between rounded-xs px-5 bg-white border border-[#0F172A]/15 text-[#0F172A] hover:bg-slate-50 transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-3xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4.5 w-4.5 text-cyan-600" />
                      <div className="text-left leading-tight">
                        <span className="block font-bold">
                          Agent's Dashboard
                        </span>
                        <span className="block text-[8px] font-medium text-slate-500 capitalize tracking-normal mt-0.5">
                          Bespoke pricing quotes & log
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-widest text-[#0F172A]/40">
                      LOGIN / SIGN UP
                    </span>
                  </button>

                  {/* Button 4: Captain & Crew Login */}
                  <button
                    type="button"
                    onClick={onOpenCaptainPortal}
                    className="flex w-full h-[52px] items-center justify-between rounded-xs px-5 bg-white border border-[#0F172A]/15 text-[#0F172A] hover:bg-slate-50 transition-all font-sans font-bold text-xs uppercase tracking-wider shadow-3xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Anchor className="h-4.5 w-4.5 text-emerald-600" />
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Crew Workspace</span>
                        <span className="block text-[8px] font-medium text-slate-500 capitalize tracking-normal mt-0.5">
                          Shifts, manifesting & reporting
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-widest text-[#0F172A]/40">
                      ACCESS DESK
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
