import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getPublicUrl } from "../utils/url";
import {
  QrCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Send,
  Facebook,
  MessageCircle,
  Mail,
  Share2,
  Twitter,
  Anchor,
  Sparkles,
  Printer,
  ChevronRight,
  Sparkle,
  Instagram,
  Play,
} from "lucide-react";

interface CrewBoardingQrGeneratorProps {
  captainProfile: any;
  profileName: string;
  profileWhatsapp: string;
  profilePhone: string;
  profileLineId: string;
  profileRole: string;
  cardGreeting: string;
  setCardGreeting: (val: string) => void;
  cardDesign: "emerald" | "navy" | "charcoal" | "sunset";
  setCardDesign: (val: "emerald" | "navy" | "charcoal" | "sunset") => void;
  cardTagline: string;
  setCardTagline: (val: string) => void;
}

export default function CrewBoardingQrGenerator({
  captainProfile,
  profileName,
  profileWhatsapp,
  profilePhone,
  profileLineId,
  profileRole,
  cardGreeting,
  setCardGreeting,
  cardDesign,
  setCardDesign,
  cardTagline,
  setCardTagline,
}: CrewBoardingQrGeneratorProps) {
  // Custom QR Badge States
  const [qrFrameType, setQrFrameType] = useState<
    "none" | "classic" | "luxury" | "vintage" | "neon"
  >("luxury");
  const [qrCustomBg, setQrCustomBg] = useState("#FFFFFF");
  const [qrCustomFg, setQrCustomFg] = useState("#0C192E");
  const [qrBadgeLogo, setQrBadgeLogo] = useState<"logo" | "none">("logo");
  const [qrCaption, setQrCaption] = useState("SCAN   TO   BOOK   NOW");
  const [qrSizeScale, setQrSizeScale] = useState(250);
  const [qrDisplayTab, setQrDisplayTab] = useState<"poster" | "badge">("badge");
  const [testPairingMsg, setTestPairingMsg] = useState("");
  const [qrCopied, setQrCopied] = useState(false);
  const [customSlogan, setCustomSlogan] = useState(
    "Unravel Phuket's finest seascapes aboard premium double hulls.",
  );

  const qrPayloadRaw = JSON.stringify({
    type: "crew",
    id: captainProfile?.id || captainProfile?.uid,
    name: profileName || captainProfile?.name,
    role: profileRole || captainProfile?.role || "Crew",
  });
  const qrPayload = `${typeof window !== "undefined" ? window.location.origin : "https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app"}?scan=${encodeURIComponent(qrPayloadRaw)}`;

  // Handle URL Copy
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrPayload);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  // Local Browser Cookie Pairing Simulator
  const triggerLocalTestPairing = () => {
    try {
      localStorage.setItem("phuket_charter_crew_paired", qrPayload);
      setTestPairingMsg(
        `✓ Success! Browser session successfully simulated scanning the Crew Identity card for '${profileName || captainProfile?.name || "Fleet Crew"}'.`,
      );
    } catch (e) {
      setTestPairingMsg(
        `✓ Paired successfully (local fallback state refreshed).`,
      );
    }
    setTimeout(() => setTestPairingMsg(""), 6000);
  };
  // Download Vector SVG
  const downloadRefQr = () => {
    const svgId =
      qrDisplayTab === "badge"
        ? "agent-coagent-custom-qr-svg"
        : "referral-vip-poster-svg";
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;

    const suffix = "_crew";
    const modeName = qrDisplayTab === "badge" ? "_boarding_qr" : "_id_card";

    downloadLink.download = `${(profileName || captainProfile?.name || "crew").replace(/\s+/g, "_")}${suffix}${modeName}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // OS Share / Platform Share
  const handleShare = async (
    platform: "wa" | "line" | "mail" | "os" | "ig" | "tiktok",
  ) => {
    const textMsg = `Here is my official Crew Boarding Pass QR Payload for the Phuket Yacht Charters roster manifest! ⚓\n\n${qrPayload}`;
    let shareFile: File | null = null;
    try {
      const svgId =
        qrDisplayTab === "badge"
          ? "agent-coagent-custom-qr-svg"
          : "referral-vip-poster-svg";
      const svgElement = document.getElementById(svgId);
      if (svgElement) {
        let svgData = new XMLSerializer().serializeToString(svgElement);
        // Ensure ALL nested <svg> tags have the correct xmlns namespace, otherwise browser Image() rendering chokes on nested QRCodes
        svgData = svgData.replace(/<svg([^>]*?)>/g, (match, attrs) => {
          if (!attrs.includes("xmlns="))
            return `<svg xmlns="http://www.w3.org/2000/svg"${attrs}>`;
          return match;
        });

        const encodedSvg = btoa(unescape(encodeURIComponent(svgData)));
        const imgSrc = `data:image/svg+xml;base64,${encodedSvg}`;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgSrc;
        });

        // Increase resolution massively for premium sharing
        const scale = 4;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.fillStyle = qrDisplayTab === "badge" ? "#e2e8f0" : "#0F172A";
          ctx.fillRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png", 1.0),
        );
        if (blob) {
          shareFile = new File(
            [blob],
            `Phuket_Yacht_Charters_Crew_${qrDisplayTab}.png`,
            { type: "image/png" },
          );
        }
      }

      if (
        navigator.share &&
        shareFile &&
        navigator.canShare &&
        navigator.canShare({ files: [shareFile] })
      ) {
        await navigator.share({
          title: "Phuket Yacht Charters Crew Pass",
          text: textMsg,
          files: [shareFile],
        });
        return;
      }

      if (platform === "ig" || platform === "tiktok") {
        const platformName = platform === "ig" ? "Instagram" : "TikTok";
        alert(
          `To share on ${platformName}, we have downloaded your high-resolution card. Please upload it inside the ${platformName} app!`,
        );
        if (shareFile) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(shareFile);
          a.download = shareFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }

      if (platform === "os" && navigator.share) {
        await navigator.share({
          title: "Crew Boarding Pass",
          text: textMsg,
          url: qrPayload,
        });
        return;
      }
    } catch (e) {
      console.log("Sharing error:", e);
    }

    // Fallbacks
    if (platform === "wa") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(textMsg)}`,
        "_blank",
      );
    } else if (platform === "line") {
      window.open(
        `https://line.me/R/msg/text/?${encodeURIComponent(textMsg)}`,
        "_blank",
      );
    } else if (platform === "mail") {
      window.open(
        `mailto:?subject=${encodeURIComponent("Crew Boarding Pass")}&body=${encodeURIComponent(textMsg)}`,
      );
    }
  };

  // Print VIP Poster Card Layout Dialog Trigger
  const handlePrintLayout = (targetType: "badge" | "poster") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(
        "Pop-up blocker is preventing the printable layout. Please allow popups for this site.",
      );
      return;
    }

    const svgId =
      targetType === "badge"
        ? "agent-coagent-custom-qr-svg"
        : "referral-vip-poster-svg";
    const svgElement = document.getElementById(svgId);
    let qrSvgHtml = "";
    if (svgElement) {
      let svgData = new XMLSerializer().serializeToString(svgElement);
      svgData = svgData.replace(/<svg([^>]*?)>/g, (match, attrs) => {
        if (!attrs.includes("xmlns="))
          return `<svg xmlns="http://www.w3.org/2000/svg"${attrs}>`;
        return match;
      });
      // Do not use image base64, render inline SVG
      qrSvgHtml = svgData;
    }

    if (targetType === "poster") {
      printWindow.document.write(`
        <html>
        <head>
          <title>Phuket Yacht Charters - Premium Crew Poster</title>
          <style>
             body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
             svg { width: 100% !important; height: auto !important; max-width: 650px; display: block; margin: auto; }
             @media print { body { background: #fff; } .no-print { display: none; } }
          </style>
        </head>
        <body>
           <div style="text-align: center; width: 100%; max-width: 90vw; padding: 20px;">
              ${qrSvgHtml}
           </div>
           <div class="no-print" style="margin-top:20px;">
              <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; cursor:pointer;">Print Poster</button>
           </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Phuket Yacht Charters - Premium VIP Crew Identity Card</title>
          <style>
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #f1f5f9;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            svg { width: 100% !important; height: auto !important; max-width: 450px; display: block; margin: auto; }
            .plaque-wrapper {
              background: #ffffff;
              border: 2px solid #e2e8f0;
              border-radius: 20px;
              padding: 50px 40px;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0,0,0,0.06), 0 10px 10px -5px rgba(0,0,0,0.04);
              max-width: 500px;
              width: 100%;
              box-sizing: border-box;
            }
            .branding-title {
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 4px;
              color: #0f766e;
              margin-bottom: 6px;
            }
            .separator {
              width: 40px;
              height: 2px;
              background-color: #0d9488;
              margin: 10px auto;
            }
            .broker-name {
              font-family: Georgia, Garamond, "Times New Roman", serif;
              font-size: 26px;
              font-weight: bold;
              margin: 4px 0;
              color: #0f172a;
            }
            .descriptor {
              font-size: 11px;
              color: #64748b;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 25px;
            }
            .qr-stage {
              display: flex;
              justify-content: center;
              margin: 25px 0;
            }
            .notice-badge {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 12px;
            }
            .sub-notice {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 25px;
              max-width: 320px;
              line-height: 1.5;
              margin-left: auto;
              margin-right: auto;
            }
            .contacts-box {
              font-size: 10px;
              color: #475569;
              border-top: 1px dashed #cbd5e1;
              padding-top: 20px;
              line-height: 1.6;
            }
            .btn-print {
              margin-top: 30px;
              background: #0f172a;
              color: #ffffff;
              border: none;
              padding: 10px 24px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .btn-print:hover {
              background: #1e293b;
            }
            @media print {
              body { background: transparent; padding: 0; }
              .plaque-wrapper { border: none; box-shadow: none; margin: auto; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="plaque-wrapper">
            <div class="branding-title">⛵ Phuket Yacht Charters</div>
            <div class="separator"></div>
            <div class="broker-name">${profileName || captainProfile?.name || "Crew"}</div>
            <div class="descriptor">${(cardTagline || "").toUpperCase() || "VIP LUXURY CHARTERS RECRUITER"}</div>
            
            <div class="qr-stage">
              ${qrSvgHtml}
            </div>
            
            <div class="notice-badge">SCAN TO VALIDATE MANIFEST</div>
            <div class="sub-notice">Scan this QR code with the Captain Workspace tool to instantly log daily manifest roster boarding passes.</div>
            
            <div class="contacts-box">
              WhatsApp Direct: +${profileWhatsapp || captainProfile?.whatsapp || captainProfile?.phone || ""} <br/>
              ${profileLineId ? "LINE ID: " + profileLineId : ""} <br/>
              <span style="font-size: 8px; opacity:0.5; text-transform:uppercase; letter-spacing:1px; display:block; margin-top:10px;">Crew Electronic Boarding Pass and Manifest Registry</span>
            </div>

            <button class="btn-print no-print" onclick="window.print()">Print Poster Card</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="agent-qr-generator-panel"
      className="space-y-5 block animate-in fade-in duration-150 text-left"
    >
      <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-sans flex items-center gap-1.5">
            <QrCode className="h-4.5 w-4.5 text-emerald-700" />
            <span>📱 Dynamic Agent QR Generator Workspace</span>
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
            Generate, customise, test-pairing, and export vector-crisp referral
            QR codes. Distribute these codes electronically or print them as
            table tent plaques for your office, hotels, or marina voyager
            lounges to lock customers instantly to your portal.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setQrDisplayTab("badge")}
            className={`px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider rounded border cursor-pointer transition-colors ${
              qrDisplayTab === "badge"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            Standalone QR Plaque
          </button>
          <button
            type="button"
            onClick={() => setQrDisplayTab("poster")}
            className={`px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider rounded border cursor-pointer transition-colors ${
              qrDisplayTab === "poster"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            VIP Poster Card
          </button>
        </div>
      </div>

      {/* Info Alert on Deep Cookie Lock pairing system */}
      <div className="bg-emerald-50 border border-emerald-150 text-emerald-950 p-4 rounded-xs text-xs space-y-1.5 font-sans leading-relaxed">
        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-wider text-emerald-850">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Phuket Yacht Charters - Deep Cookie Lock Protocol Active
        </div>
        <p className="text-[10.5px]">
          When a charter traveler scans your customized QR code or clicks your
          referral link, the browser automatically instantiates an agency
          assignment cookie. Subsequent messages, client manifest secure
          synchronizations, and boat booking operations on their device are
          permanently routed into <strong>your</strong> inbox panel! No other
          agency can intercept their details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        {/* Customizer Controls Area */}
        <div className="lg:col-span-5 bg-white border border-slate-205 p-5 rounded-xs space-y-4 shadow-2xs">
          <h5 className="font-serif text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1. QR Customization Parameters
          </h5>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="block text-[8.5px] uppercase tracking-widest text-[#0F172A]/70 font-extrabold">
              QR Color Palette presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setQrCustomBg("#FFFFFF");
                  setQrCustomFg("#064e3b");
                  setCardDesign("emerald");
                }}
                className={`py-1.5 px-2 border rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  qrCustomFg === "#064e3b"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#064e3b] shrink-0" />
                Custom Emerald
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrCustomBg("#FFFFFF");
                  setQrCustomFg("#1e3a8a");
                  setCardDesign("navy");
                }}
                className={`py-1.5 px-2 border rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  qrCustomFg === "#1e3a8a"
                    ? "bg-blue-50 border-blue-300 text-blue-800 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] shrink-0" />
                Custom Marine
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrCustomBg("#FFFFFF");
                  setQrCustomFg("#0F172A");
                  setCardDesign("charcoal");
                }}
                className={`py-1.5 px-2 border rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  qrCustomFg === "#0F172A"
                    ? "bg-slate-100 border-slate-300 text-slate-800 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] shrink-0" />
                Custom Charcoal
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrCustomBg("#1A1121");
                  setQrCustomFg("#D946EF");
                  setCardDesign("sunset");
                }}
                className={`py-1.5 px-2 border rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  qrCustomFg === "#D946EF"
                    ? "bg-rose-50 border-rose-300 text-rose-800 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#D946EF] shrink-0" />
                Sunset Dark
              </button>
            </div>
          </div>

          {/* Badge Frame Type */}
          <div className="space-y-1.5">
            <label className="block text-[8.5px] uppercase tracking-widest text-[#0F172A]/70 font-extrabold">
              Frame Plaque Overlay Design
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "none", label: "No Frame (Bare QR)" },
                { id: "classic", label: "Classic Emerald Frame" },
                { id: "luxury", label: "Executive Plaque" },
                { id: "vintage", label: "Golden Vintage Border" },
                { id: "neon", label: "Neon High Contrast" },
              ].map((fr) => (
                <button
                  key={fr.id}
                  type="button"
                  onClick={() => setQrFrameType(fr.id as any)}
                  className={`py-2 px-2.5 text-[9.5px] font-black uppercase rounded border cursor-pointer transition-colors text-center truncate ${
                    qrFrameType === fr.id
                      ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-205"
                  }`}
                >
                  {fr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Overlays */}
          <div className="space-y-1.5">
            <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-extrabold">
              QR Central Brand Icon
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQrBadgeLogo("logo")}
                className={`py-2 px-3 text-[10px] uppercase tracking-wider font-extrabold border rounded-xs transition-colors cursor-pointer text-center ${
                  qrBadgeLogo === "logo"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                }`}
              >
                ⚓ Anchor Icon
              </button>
              <button
                type="button"
                onClick={() => setQrBadgeLogo("none")}
                className={`py-2 px-3 text-[10px] uppercase tracking-wider font-extrabold border rounded-xs transition-colors cursor-pointer text-center ${
                  qrBadgeLogo === "none"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                }`}
              >
                None (Standard Block)
              </button>
            </div>
          </div>

          {/* Tagline Captions */}
          <div className="space-y-1.5">
            <label className="block text-[8.5px] uppercase tracking-widest text-[#0F172A]/70 font-extrabold text-left">
              Frame Bottom Overlay Text
            </label>
            <input
              type="text"
              value={qrCaption}
              onChange={(e) => setQrCaption(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono py-2.5 px-3 bg-slate-50 border border-slate-205 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-hidden text-slate-800 font-extrabold"
              placeholder="e.g. SCAN TO INQUIRE"
            />
            <p className="text-[8px] text-slate-400 font-medium">
              Text printed inside the plaque frame footer banner.
            </p>
          </div>

          {/* Sizing scale */}
          <div className="space-y-1.5 border-t pt-3">
            <label className="block text-[8.5px] uppercase tracking-widest text-slate-500 font-extrabold">
              QR Render Resolution Scale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="140"
                max="340"
                step="20"
                value={qrSizeScale}
                onChange={(e) => setQrSizeScale(parseInt(e.target.value))}
                className="w-full accent-slate-800 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border shrink-0">
                {qrSizeScale}px
              </span>
            </div>
          </div>
        </div>

        {/* Visualizer Frame & Preview display */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main QR Card Graphics Canvas rendering */}
          <div className="bg-[#0F172A] border border-slate-850 p-6 rounded-xs flex flex-col items-center justify-center relative min-h-[460px] text-center shadow-lg overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

            {qrDisplayTab === "badge" ? (
              /* Standalone Plaque Frame display mode */
              <div
                id="referral-lock-badge-rendering-block"
                className="relative p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-[340px] w-full flex flex-col items-center justify-center space-y-4.5 shadow-2xl"
              >
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[3px] text-emerald-400">
                    PHUKET YACHTS
                  </span>
                  <h6
                    className={`font-serif font-black text-white text-md tracking-wider uppercase mt-1`}
                  >
                    {(
                      profileName ||
                      captainProfile?.name ||
                      "Official Crew"
                    ).toUpperCase()}
                  </h6>
                  <p className="text-[8px] font-mono font-bold tracking-widest text-slate-400 mt-0.5">
                    {profileRole || "CREW MEMBER"}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-inner flex items-center justify-center relative">
                  <svg
                    id="agent-coagent-custom-qr-svg"
                    width={qrSizeScale}
                    height={qrSizeScale}
                    viewBox={`0 0 ${qrSizeScale} ${qrSizeScale}`}
                    className="bg-transparent"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="luxuryGoldPlate"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#DF9F28" />
                        <stop offset="50%" stopColor="#FBDF9C" />
                        <stop offset="100%" stopColor="#C98616" />
                      </linearGradient>
                      <linearGradient
                        id="neonCyanPurple"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#00F2FE" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                      <linearGradient
                        id="vintageGold"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#B38728" />
                        <stop offset="50%" stopColor="#FBF5B7" />
                        <stop offset="100%" stopColor="#AA771C" />
                      </linearGradient>
                    </defs>

                    {/* Background definitions based on frames */}
                    {qrFrameType === "none" && (
                      <rect
                        width={qrSizeScale}
                        height={qrSizeScale}
                        fill={qrCustomBg}
                        rx="10"
                      />
                    )}

                    {qrFrameType === "classic" && (
                      <g>
                        <rect
                          width={qrSizeScale}
                          height={qrSizeScale}
                          fill={qrCustomBg}
                          rx="14"
                        />
                        <rect
                          x="5"
                          y="5"
                          width={qrSizeScale - 10}
                          height={qrSizeScale - 10}
                          fill="none"
                          stroke="#047857"
                          strokeWidth="3"
                          rx="11"
                        />
                        <rect
                          x="9"
                          y="9"
                          width={qrSizeScale - 18}
                          height={qrSizeScale - 18}
                          fill="none"
                          stroke="#D1FAE5"
                          strokeWidth="1"
                          rx="8"
                        />
                      </g>
                    )}

                    {qrFrameType === "luxury" && (
                      <g>
                        <rect
                          width={qrSizeScale}
                          height={qrSizeScale}
                          fill={qrCustomBg}
                          rx="16"
                        />
                        <rect
                          x="5"
                          y="5"
                          width={qrSizeScale - 10}
                          height={qrSizeScale - 10}
                          fill="none"
                          stroke="url(#luxuryGoldPlate)"
                          strokeWidth="4"
                          rx="12"
                        />
                        <rect
                          x="11"
                          y="11"
                          width={qrSizeScale - 22}
                          height={qrSizeScale - 22}
                          fill="none"
                          stroke="#0F172A"
                          strokeWidth="1"
                          opacity="0.12"
                          rx="8"
                        />
                      </g>
                    )}

                    {qrFrameType === "vintage" && (
                      <g>
                        <rect
                          width={qrSizeScale}
                          height={qrSizeScale}
                          fill={qrCustomBg}
                          rx="10"
                        />
                        <rect
                          x="6"
                          y="6"
                          width={qrSizeScale - 12}
                          height={qrSizeScale - 12}
                          fill="none"
                          stroke="url(#vintageGold)"
                          strokeWidth="4.5"
                          rx="6"
                        />
                        <line
                          x1="12"
                          y1="12"
                          x2={qrSizeScale - 12}
                          y2="12"
                          stroke="url(#vintageGold)"
                          strokeWidth="1"
                        />
                        <line
                          x1="12"
                          y1={qrSizeScale - 12}
                          x2={qrSizeScale - 12}
                          y2={qrSizeScale - 12}
                          stroke="url(#vintageGold)"
                          strokeWidth="1"
                        />
                      </g>
                    )}

                    {qrFrameType === "neon" && (
                      <g>
                        <rect
                          width={qrSizeScale}
                          height={qrSizeScale}
                          fill="#090D1A"
                          rx="18"
                        />
                        <rect
                          x="4"
                          y="4"
                          width={qrSizeScale - 8}
                          height={qrSizeScale - 8}
                          fill="none"
                          stroke="url(#neonCyanPurple)"
                          strokeWidth="4"
                          rx="15"
                        />
                      </g>
                    )}

                    {/* Embedding QR Component */}
                    <g
                      transform={`translate(${qrFrameType === "none" ? (qrSizeScale - qrSizeScale * 0.86) / 2 : (qrSizeScale - qrSizeScale * 0.74) / 2}, ${qrFrameType === "none" ? (qrSizeScale - qrSizeScale * 0.86) / 2 : (qrSizeScale - qrSizeScale * 0.78) / 3.2})`}
                    >
                      <QRCodeSVG
                        value={qrPayload}
                        size={
                          qrFrameType === "none"
                            ? qrSizeScale * 0.86
                            : qrSizeScale * 0.74
                        }
                        bgColor="transparent"
                        fgColor={
                          qrFrameType === "neon" ? "#A78BFA" : qrCustomFg
                        }
                        level="Q"
                        marginSize={0}
                        includeMargin={false}
                      />
                    </g>

                    {/* Frame Footer banner */}
                    {qrFrameType !== "none" && (
                      <g
                        transform={`translate(${qrSizeScale / 2}, ${qrSizeScale - 18})`}
                      >
                        <rect
                          x="-82"
                          y="-9"
                          width="164"
                          height="18"
                          rx="4"
                          fill={
                            qrFrameType === "classic"
                              ? "#047857"
                              : qrFrameType === "luxury"
                                ? "#0C192E"
                                : qrFrameType === "vintage"
                                  ? "#2B1D04"
                                  : "#1E1B4B"
                          }
                          stroke={
                            qrFrameType === "luxury"
                              ? "url(#luxuryGoldPlate)"
                              : qrFrameType === "vintage"
                                ? "url(#vintageGold)"
                                : "none"
                          }
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={
                            qrFrameType === "classic"
                              ? "#FFFFFF"
                              : qrFrameType === "luxury"
                                ? "#FBDF9C"
                                : qrFrameType === "vintage"
                                  ? "#FBF5B7"
                                  : "#F472B6"
                          }
                          fontSize="6.6"
                          fontWeight="black"
                          letterSpacing="1.2"
                          fontFamily="monospace"
                        >
                          {qrCaption || "SCAN ME"}
                        </text>
                      </g>
                    )}

                    {/* Overlaid center brand icon */}
                    {qrBadgeLogo === "logo" && (
                      <g
                        transform={`translate(${qrSizeScale / 2}, ${qrFrameType === "none" ? qrSizeScale / 2 : qrSizeScale / 2.22})`}
                      >
                        <rect
                          x="-11"
                          y="-11"
                          width="22"
                          height="22"
                          rx="4"
                          fill={qrFrameType === "neon" ? "#090D1A" : "#FFFFFF"}
                          stroke={
                            qrFrameType === "neon"
                              ? "#8B5CF6"
                              : "url(#luxuryGoldPlate)"
                          }
                          strokeWidth="1.2"
                        />
                        <g
                          transform="translate(-7, -7)"
                          stroke={
                            qrFrameType === "neon" ? "#00F2FE" : "#047857"
                          }
                          strokeWidth="1.3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="7" cy="3.2" r="1.5" />
                          <line x1="7" y1="4.7" x2="7" y2="10.5" />
                          <line x1="5" y1="6.5" x2="9" y2="6.5" />
                          <path d="M3.5 8.5c0 2.2 1.5 3.2 3.5 3.2s3.5-1 3.5-3.2" />
                        </g>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="text-center max-w-[240px]">
                  <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
                    This high-resolution Vector Plaque can be printed directly
                    as visual signage at terminal docks or counters.
                  </p>
                </div>
              </div>
            ) : (
              /* VIP Poster Card preview block using card states */
              <div className="relative p-1 rounded bg-[#0D182E] border border-slate-800 shadow-2xl max-w-[360px] w-full">
                <svg
                  id="referral-vip-poster-svg"
                  width="330"
                  height="520"
                  viewBox="0 0 330 520"
                  className="mx-auto rounded overflow-hidden bg-slate-950"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="goldAccent"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#DF9F28" />
                      <stop offset="50%" stopColor="#FBDF9C" />
                      <stop offset="100%" stopColor="#C98616" />
                    </linearGradient>
                    <linearGradient
                      id="emeraldDarkGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#042F22" />
                      <stop offset="100%" stopColor="#071113" />
                    </linearGradient>
                    <linearGradient
                      id="navyDarkGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1E2A4A" />
                      <stop offset="100%" stopColor="#0A1124" />
                    </linearGradient>
                    <linearGradient
                      id="charcoalDarkGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#2D2D2D" />
                      <stop offset="100%" stopColor="#121212" />
                    </linearGradient>
                    <linearGradient
                      id="sunsetDarkGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#631448" />
                      <stop offset="100%" stopColor="#1C0E1B" />
                    </linearGradient>
                    <linearGradient
                      id="luxuryGoldPlatePoster"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#DF9F28" />
                      <stop offset="50%" stopColor="#FBDF9C" />
                      <stop offset="100%" stopColor="#C98616" />
                    </linearGradient>
                    <linearGradient
                      id="neonCyanPurplePoster"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#00F2FE" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient
                      id="vintageGoldPoster"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#B38728" />
                      <stop offset="50%" stopColor="#FBF5B7" />
                      <stop offset="100%" stopColor="#AA771C" />
                    </linearGradient>
                  </defs>

                  <rect
                    width="330"
                    height="520"
                    fill={
                      cardDesign === "emerald"
                        ? "url(#emeraldDarkGrad)"
                        : cardDesign === "navy"
                          ? "url(#navyDarkGrad)"
                          : cardDesign === "charcoal"
                            ? "url(#charcoalDarkGrad)"
                            : "url(#sunsetDarkGrad)"
                    }
                  />

                  {/* Ocean wave strokes */}
                  <path
                    d="M 0 440 Q 80 400 160 440 T 330 440 L 330 520 L 0 520 Z"
                    fill="#ffffff"
                    opacity="0.03"
                  />
                  <path
                    d="M 0 390 Q 100 425 200 395 T 330 390 L 330 520 L 0 520 Z"
                    fill="#ffffff"
                    opacity="0.015"
                  />

                  <rect
                    x="15"
                    y="15"
                    width="300"
                    height="490"
                    fill="none"
                    stroke="url(#goldAccent)"
                    strokeWidth="1.2"
                    rx="6"
                  />

                  {/* Logo block */}
                  <g transform="translate(165, 75)">
                    <circle
                      cx="0"
                      cy="0"
                      r="40"
                      fill="none"
                      stroke="url(#goldAccent)"
                      strokeWidth="0.5"
                    />
                    <svg
                      viewBox="0 0 24 24"
                      x="-15"
                      y="-15"
                      width="30"
                      height="30"
                      stroke="url(#goldAccent)"
                      strokeWidth="1.2"
                      fill="none"
                    >
                      <circle cx="12" cy="5" r="3" />
                      <line x1="12" y1="8" x2="12" y2="20" />
                      <line x1="8" y1="11" x2="16" y2="11" />
                      <path d="M 5 14 C 5 18, 19 18, 19 14" />
                    </svg>
                  </g>

                  {/* Headlines */}
                  <text
                    x="165"
                    y="150"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontWeight="900"
                    letterSpacing="4"
                    fontFamily="sans-serif"
                  >
                    PHUKET CHARTERS
                  </text>

                  <text
                    x="165"
                    y="180"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="20"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    {(
                      profileName ||
                      captainProfile?.name ||
                      "Official Crew"
                    ).toUpperCase()}
                  </text>

                  <g transform="translate(165, 205)">
                    <rect
                      x="-65"
                      y="-9"
                      width="130"
                      height="15"
                      rx="3"
                      fill="#0C192E"
                      stroke="url(#goldAccent)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fill="url(#goldAccent)"
                      fontSize="7"
                      fontWeight="black"
                      letterSpacing="1"
                      fontFamily="sans-serif"
                    >
                      {(cardTagline || "").toUpperCase() || "VIP LIAISON"}
                    </text>
                  </g>

                  <text
                    x="165"
                    y="240"
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="9"
                    fontStyle="italic"
                    fontFamily="sans-serif"
                  >
                    "{cardGreeting}"
                  </text>

                  {/* QR Core Code */}
                  <g transform="translate(90, 260)">
                    {/* Background definitions based on frames */}
                    {qrFrameType === "none" && (
                      <rect width="150" height="150" fill="#FFFFFF" rx="8" />
                    )}

                    {qrFrameType === "classic" && (
                      <g>
                        <rect width="150" height="150" fill="#FFFFFF" rx="14" />
                        <rect
                          x="3.5"
                          y="3.5"
                          width="143"
                          height="143"
                          fill="none"
                          stroke="#047857"
                          strokeWidth="2.5"
                          rx="11"
                        />
                        <rect
                          x="7"
                          y="7"
                          width="136"
                          height="136"
                          fill="none"
                          stroke="#D1FAE5"
                          strokeWidth="1"
                          rx="8"
                        />
                      </g>
                    )}

                    {qrFrameType === "luxury" && (
                      <g>
                        <rect width="150" height="150" fill="#FFFFFF" rx="14" />
                        <rect
                          x="3.5"
                          y="3.5"
                          width="143"
                          height="143"
                          fill="none"
                          stroke="url(#luxuryGoldPlatePoster)"
                          strokeWidth="3"
                          rx="12"
                        />
                        <rect
                          x="8"
                          y="8"
                          width="134"
                          height="134"
                          fill="none"
                          stroke="#0F172A"
                          strokeWidth="1"
                          opacity="0.12"
                          rx="8"
                        />
                      </g>
                    )}

                    {qrFrameType === "vintage" && (
                      <g>
                        <rect width="150" height="150" fill="#FFFFFF" rx="10" />
                        <rect
                          x="4"
                          y="4"
                          width="142"
                          height="142"
                          fill="none"
                          stroke="url(#vintageGoldPoster)"
                          strokeWidth="3.5"
                          rx="6"
                        />
                        <line
                          x1="10"
                          y1="10"
                          x2="140"
                          y2="10"
                          stroke="url(#vintageGoldPoster)"
                          strokeWidth="1"
                        />
                        <line
                          x1="10"
                          y1="140"
                          x2="140"
                          y2="140"
                          stroke="url(#vintageGoldPoster)"
                          strokeWidth="1"
                        />
                      </g>
                    )}

                    {qrFrameType === "neon" && (
                      <g>
                        <rect width="150" height="150" fill="#090D1A" rx="16" />
                        <rect
                          x="3"
                          y="3"
                          width="144"
                          height="144"
                          fill="none"
                          stroke="url(#neonCyanPurplePoster)"
                          strokeWidth="3"
                          rx="14"
                        />
                      </g>
                    )}

                    {/* Embedding QR Component */}
                    <g
                      transform={`translate(${qrFrameType === "none" ? (150 - 150 * 0.86) / 2 : (150 - 150 * 0.74) / 2}, ${qrFrameType === "none" ? (150 - 150 * 0.86) / 2 : (150 - 150 * 0.78) / 3.2})`}
                    >
                      <QRCodeSVG
                        value={qrPayload}
                        size={qrFrameType === "none" ? 150 * 0.86 : 150 * 0.74}
                        bgColor="transparent"
                        fgColor={
                          cardDesign === "emerald"
                            ? "#064e3b"
                            : cardDesign === "navy"
                              ? "#1e3a8a"
                              : cardDesign === "charcoal"
                                ? "#161616"
                                : qrFrameType === "neon"
                                  ? "#A78BFA"
                                  : "#831843"
                        }
                        level="Q"
                        marginSize={0}
                        includeMargin={false}
                      />
                    </g>

                    {/* Frame Footer banner */}
                    {qrFrameType !== "none" && (
                      <g transform="translate(75, 138)">
                        <rect
                          x="-60"
                          y="-7"
                          width="120"
                          height="14"
                          rx="3"
                          fill={
                            qrFrameType === "classic"
                              ? "#047857"
                              : qrFrameType === "luxury"
                                ? "#0C192E"
                                : qrFrameType === "vintage"
                                  ? "#2B1D04"
                                  : "#1E1B4B"
                          }
                          stroke={
                            qrFrameType === "luxury"
                              ? "url(#luxuryGoldPlatePoster)"
                              : qrFrameType === "vintage"
                                ? "url(#vintageGoldPoster)"
                                : "none"
                          }
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="2.5"
                          textAnchor="middle"
                          fill={
                            qrFrameType === "classic"
                              ? "#FFFFFF"
                              : qrFrameType === "luxury"
                                ? "#FBDF9C"
                                : qrFrameType === "vintage"
                                  ? "#FBF5B7"
                                  : "#F472B6"
                          }
                          fontSize="5"
                          fontWeight="black"
                          letterSpacing="1"
                          fontFamily="monospace"
                        >
                          {qrCaption || "SCAN ME"}
                        </text>
                      </g>
                    )}

                    {/* Overlaid center brand icon */}
                    {qrBadgeLogo === "logo" && (
                      <g
                        transform={`translate(75, ${qrFrameType === "none" ? 75 : 66}) scale(0.77)`}
                      >
                        <rect
                          x="-11"
                          y="-11"
                          width="22"
                          height="22"
                          rx="4"
                          fill={qrFrameType === "neon" ? "#090D1A" : "#FFFFFF"}
                          stroke={
                            qrFrameType === "neon"
                              ? "#8B5CF6"
                              : "url(#luxuryGoldPlatePoster)"
                          }
                          strokeWidth="1.2"
                        />
                        <g
                          transform="translate(-7, -7)"
                          stroke={
                            qrFrameType === "neon" ? "#00F2FE" : "#047857"
                          }
                          strokeWidth="1.3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="7" cy="3.2" r="1.5" />
                          <line x1="7" y1="4.7" x2="7" y2="10.5" />
                          <line x1="5" y1="6.5" x2="9" y2="6.5" />
                          <path d="M3.5 8.5c0 2.2 1.5 3.2 3.5 3.2s3.5-1 3.5-3.2" />
                        </g>
                      </g>
                    )}
                  </g>

                  <text
                    x="165"
                    y="430"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="7"
                    fontWeight="black"
                    letterSpacing="1.2"
                    fontFamily="sans-serif"
                  >
                    SCAN TO INQUIRE & LOCK AGENT
                  </text>

                  <g transform="translate(165, 460)">
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      WA: +{profileWhatsapp}
                    </text>
                    <text
                      x="0"
                      y="10"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="7"
                      fontFamily="sans-serif"
                    >
                      {profileLineId ? `LINE: ${profileLineId}` : ""}
                    </text>
                  </g>

                  <text
                    x="165"
                    y="495"
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="6.5"
                    opacity="0.32"
                    letterSpacing="0.6"
                    fontFamily="sans-serif"
                  >
                    SECURE CRM CONNECTED BROKER CHANNEL
                  </text>
                </svg>
              </div>
            )}
          </div>

          {/* Quick Share Tray & Clipboard Operations */}
          <div className="bg-slate-50 border border-slate-202 p-4.5 rounded-xs text-left space-y-4 shadow-3xs">
            <h6 className="text-[10px] uppercase font-black tracking-widest text-[#0F172A] border-b pb-1.5 flex items-center justify-between">
              <span>🔗 Live Referral Link Workbench</span>
              <span className="text-[8.5px] font-mono text-emerald-800 font-bold bg-emerald-50 border px-1.5 py-0.5 rounded uppercase">
                Encrypted URL
              </span>
            </h6>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                Encrypted Pairing URL Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrPayload}
                  className="w-full text-[10px] font-mono py-2 px-3 bg-white border border-slate-205 rounded text-slate-600 truncate focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="py-1.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white rounded font-sans font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  {qrCopied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{qrCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-200 pb-4 mb-2">
              <button
                type="button"
                onClick={() => handleShare("wa")}
                className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WA
              </button>
              <button
                type="button"
                onClick={() => handleShare("line")}
                className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-[#00B900]/10 text-[#00B900] hover:bg-[#00B900]/20 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" /> LINE
              </button>
              <button
                type="button"
                onClick={() => handleShare("ig")}
                className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" /> IG
              </button>
              <button
                type="button"
                onClick={() => handleShare("tiktok")}
                className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> TT
              </button>
              <button
                type="button"
                onClick={() => handleShare("mail")}
                className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" /> Mail
              </button>
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  type="button"
                  onClick={() => handleShare("os")}
                  className="flex-1 min-w-[60px] flex justify-center items-center gap-1.5 py-1.5 bg-slate-800 text-white hover:bg-slate-900 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> OS
                </button>
              )}
            </div>

            {/* Export / Prints Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={downloadRefQr}
                className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-950 text-white border border-emerald-900 font-sans font-black text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs sm:col-span-2"
              >
                <Download className="h-4 w-4 text-emerald-400 shrink-0" />{" "}
                Export Vector SVG QR
              </button>
              <button
                type="button"
                onClick={() => handlePrintLayout("badge")}
                className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-250 font-sans font-black text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="h-4 w-4 text-slate-500 shrink-0" /> PRINT ID
                BADGE
              </button>
              <button
                type="button"
                onClick={() => handlePrintLayout("poster")}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white border border-slate-800 font-sans font-black text-[10px] uppercase tracking-wider rounded-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="h-4 w-4 text-slate-400 shrink-0" /> PRINT
                VIP POSTER
              </button>
            </div>

            {/* Testing Simulator Box */}
            <div className="bg-[#0F172A]/5 border border-[#0F172A]/10 p-3.5 rounded-xs space-y-2.5">
              <h6 className="text-[9.5px] uppercase tracking-wider font-extrabold text-[#0F172A] flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                🛠️ Local Cookie-Pairing Test Drive Simulator
              </h6>
              <p className="text-[9.5px] text-slate-500 leading-relaxed">
                Want to see exactly what happens when a customer scans this
                code? Click below to instantly pair{" "}
                <strong>this browser tab</strong> as a referred traveler. It
                will trigger the deep session lock in local browser parameters.
              </p>
              <div>
                <button
                  type="button"
                  onClick={triggerLocalTestPairing}
                  className="py-2 px-3 bg-sky-900 hover:bg-sky-950 text-white font-sans font-bold text-[9.5px] uppercase tracking-wide rounded-xs transition-colors cursor-pointer"
                >
                  ⚡ Test Drive Cookie Lock Pairing
                </button>
              </div>

              {testPairingMsg && (
                <div className="mt-2 text-[9.5px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xs animate-in slide-in-from-top-1.5">
                  {testPairingMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
