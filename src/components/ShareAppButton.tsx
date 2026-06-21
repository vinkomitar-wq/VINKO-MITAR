import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useLanguage } from "../LanguageContext";

export default function ShareAppButton({
  variant = "icon",
  className = "",
}: {
  variant?: "icon" | "button" | "navbar";
  className?: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = "Phuket Premium Yacht Charter";
    const text = "Check out these premium catamaran charters in Phuket!";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log("Failed to copy", err);
      }
    }
  };

  if (variant === "navbar") {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#0F172A]/5 hover:bg-[#0F172A]/10 text-[#0F172A] transition-colors cursor-pointer ${className}`}
        title="Share App"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {copied ? "Copied Link!" : "Share"}
        </span>
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center justify-center gap-2 px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs font-sans font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer ${className}`}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
        <span>{copied ? "Link Copied!" : "Share Experience"}</span>
      </button>
    );
  }

  // default icon
  return (
    <button
      onClick={handleShare}
      className={`p-2 text-slate-400 hover:text-[#0F172A] transition-colors cursor-pointer ${className}`}
      title="Share App"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <Share2 className="w-5 h-5" />
      )}
    </button>
  );
}
