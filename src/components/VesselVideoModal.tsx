import React, { useEffect } from "react";
import { X, Play, ShieldAlert, Video } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VesselVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  vesselName: string;
}

export function getEmbedUrl(url: string): { embedUrl: string; isIframe: boolean; videoId?: string } {
  if (!url) return { embedUrl: "", isIframe: false };

  const parsedUrl = url.trim();

  // YouTube match types
  // Standard url: https://www.youtube.com/watch?v=scg136qDclY
  // Share url: https://youtu.be/scg136qDclY
  // Mobile short: https://m.youtube.com/watch?v=scg136qDclY
  // Short URL: https://youtube.com/shorts/scg136qDclY
  // Embed: https://www.youtube.com/embed/scg136qDclY
  let ytId = "";
  if (parsedUrl.includes("youtube.com") || parsedUrl.includes("youtu.be")) {
    if (parsedUrl.includes("embed/")) {
      ytId = parsedUrl.split("embed/")[1]?.split("?")[0];
    } else if (parsedUrl.includes("shorts/")) {
      ytId = parsedUrl.split("shorts/")[1]?.split("?")[0];
    } else if (parsedUrl.includes("v=")) {
      ytId = parsedUrl.split("v=")[1]?.split("&")[0];
    } else if (parsedUrl.includes("youtu.be/")) {
      ytId = parsedUrl.split("youtu.be/")[1]?.split("?")[0];
    }
  }

  if (ytId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      isIframe: true,
      videoId: ytId,
    };
  }

  // Vimeo match types
  // Standard url: https://vimeo.com/123456789
  // Embed: https://player.vimeo.com/video/123456789
  let vimeoId = "";
  if (parsedUrl.includes("vimeo.com")) {
    if (parsedUrl.includes("player.vimeo.com/video/")) {
      vimeoId = parsedUrl.split("video/")[1]?.split("?")[0];
    } else {
      vimeoId = parsedUrl.split("vimeo.com/")[1]?.split("?")[0];
    }
  }

  if (vimeoId) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&badge=0&autopause=0&player_id=0&app_id=58479`,
      isIframe: true,
      videoId: vimeoId,
    };
  }

  // Facebook match types
  if (parsedUrl.includes("facebook.com") || parsedUrl.includes("fb.watch")) {
    return {
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(parsedUrl)}&show_text=0&width=560&t=0`,
      isIframe: true,
    };
  }

  // Google Drive match types
  if (parsedUrl.includes("drive.google.com") || parsedUrl.includes("docs.google.com/file")) {
    let driveId = "";
    if (parsedUrl.includes("/d/")) {
      driveId = parsedUrl.split("/d/")[1]?.split("/")[0];
    } else if (parsedUrl.includes("id=")) {
      driveId = parsedUrl.split("id=")[1]?.split("&")[0];
    }
    
    if (driveId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        isIframe: true,
      };
    }
  }

  // Instagram match types
  if (parsedUrl.includes("instagram.com")) {
    let instaPath = "";
    if (parsedUrl.includes("/p/")) {
      instaPath = `p/${parsedUrl.split("/p/")[1]?.split("/")[0]}`;
    } else if (parsedUrl.includes("/reel/")) {
      instaPath = `reel/${parsedUrl.split("/reel/")[1]?.split("/")[0]}`;
    }
    
    if (instaPath) {
      return {
        embedUrl: `https://www.instagram.com/${instaPath}/embed`,
        isIframe: true,
      };
    }
  }

  // TikTok match types
  if (parsedUrl.includes("tiktok.com")) {
    let tiktokId = "";
    if (parsedUrl.includes("/video/")) {
      tiktokId = parsedUrl.split("/video/")[1]?.split("?")[0]?.split("/")[0];
    }
    if (tiktokId) {
      return {
        embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
        isIframe: true,
      };
    }
  }

  // Fallback to standard MP4/direct link
  return {
    embedUrl: parsedUrl,
    isIframe: false,
  };
}

export default function VesselVideoModal({
  isOpen,
  onClose,
  videoUrl,
  vesselName,
}: VesselVideoModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { embedUrl, isIframe } = getEmbedUrl(videoUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        >
          {/* Background Closer */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-md bg-slate-950 border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/40 px-5 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xs bg-emerald-600/20 text-emerald-400">
                  <Play className="h-4 w-4 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold uppercase tracking-wide">
                    {vesselName} — Walkthrough & Cinematic Tour
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans tracking-wide">
                    Premium yachting luxury in Phuket, Thailand
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/5 p-1.5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Body CONTAINER */}
            <div className="relative aspect-video w-full bg-black">
              {embedUrl ? (
                isIframe ? (
                  <iframe
                    src={embedUrl}
                    title={`${vesselName} Video Tour`}
                    className="absolute inset-0 h-full w-full border-0 select-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <video
                    src={embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ShieldAlert className="h-10 w-10 text-amber-500 mb-2" />
                  <p className="text-sm font-medium">No walkthrough video link loaded for this vessel.</p>
                  <p className="text-xs text-slate-500 mt-1">Please configure a direct or embed link inside the Administration Panel.</p>
                </div>
              )}
            </div>

            {/* Footer controls or helpful details */}
            <div className="bg-slate-900/60 px-5 py-3 text-slate-400 text-[10px] flex justify-between items-center border-t border-white/5">
              <span className="font-sans">
                💡 Videos stream directly from external secure content delivery networks (CDNs).
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-xs font-sans text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Close Tour
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
