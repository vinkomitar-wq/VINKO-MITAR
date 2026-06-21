import React, { useMemo, useState } from "react";
import FreeMap from "./FreeMap";
import { X, MapPin, Maximize2 } from "lucide-react";
import { DESTINATIONS, PIERS } from "../data";
import { QRCodeSVG } from "qrcode.react";

export const COMPOSITE_ROUTES: Record<string, string[]> = {
  prompteph: ["chalong", "prompteph"],
  "james-bond": ["ao-po", "james-bond"],
  "ko-he-south": ["chalong", "ko-he-south"],
  "ko-he-north-banana-beach": ["chalong", "ko-he-north-banana-beach"],
  "ko-racha-yai": ["chalong", "ko-racha-yai"],
  "ko-racha-noi": ["chalong", "ko-racha-noi"],
  maithon: ["chalong", "maithon"],
  "koh-khai-nok": ["chalong", "koh-khai-nok"],
  "koh-hong": ["ao-po", "koh-hong"],
  "koh-yao-yai": ["ao-po", "koh-yao-yai"],
  "koh-hong-koh-yao-yai": ["ao-po", "koh-hong", "koh-yao-yai"],
  "koh-yao-yai-koh-hong-james-bond": [
    "ao-po",
    "phanak-island",
    "james-bond",
    "koh-hong",
    "koh-yao-noi",
    "koh-yao-yai",
    "naga-noi",
    "naga-yai",
  ],
  "similan-islands": ["ao-po", "similan-islands"],
  "ko-he-ko-racha-yai-prompteph": [
    "chalong",
    "ko-he-south",
    "ko-racha-yai",
    "prompteph",
  ],
  "maithon-ko-he": ["chalong", "maithon", "ko-he-south"],
  "maithon-ko-racha-yai": ["chalong", "maithon", "ko-racha-yai"],
  "ko-racha-yai-ko-racha-noi": ["chalong", "ko-racha-yai", "ko-racha-noi"],
  "koh-khai-nok-maithon": ["chalong", "koh-khai-nok", "maithon"],
  "ko-he-prompteph": ["chalong", "ko-he-south", "prompteph"],
  "ko-he-ko-racha-yai": ["chalong", "ko-he-south", "ko-racha-yai"],
  "ko-he-maithon-prompteph": ["chalong", "maithon", "ko-he-south", "prompteph"],
  "phi-phi-islands": ["chalong", "phi-phi-islands"],
  // Coco Pier Composite Routes
  "coco-coral": ["coco", "ko-he-south"],
  "coco-maithon": ["coco", "maithon"],
  "coco-maithon-ko-he": ["coco", "maithon", "ko-he-south"],
  "coco-racha-yai": ["coco", "ko-racha-yai"],
  "coco-khai-nok": ["coco", "koh-khai-nok"],
  "coco-phromthep": ["coco", "prompteph"],
  "coco-phi-phi": ["coco", "phi-phi-islands"],
};

export const hasRouteMap = (id: string) =>
  !!COMPOSITE_ROUTES[id] && COMPOSITE_ROUTES[id].length > 1;

interface RouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  routeName: string;
}

const destCoords: Record<string, { lat: number; lng: number }> = {
  chalong: { lat: 7.8214, lng: 98.3412 },
  "ao-po": { lat: 8.0716, lng: 98.4415 },
  coco: { lat: 7.8231, lng: 98.4036 },
  prompteph: { lat: 7.7587, lng: 98.304 },
  "james-bond": { lat: 8.2745, lng: 98.5015 },
  "ko-he-south": { lat: 7.7385, lng: 98.3731 },
  "ko-he-north-banana-beach": { lat: 7.7461, lng: 98.3769 },
  "ko-racha-yai": { lat: 7.6042, lng: 98.3688 },
  "ko-racha-noi": { lat: 7.4722, lng: 98.3189 },
  maithon: { lat: 7.7612, lng: 98.4807 },
  "koh-khai-nok": { lat: 7.8931, lng: 98.5332 },
  "phi-phi-islands": { lat: 7.7405, lng: 98.7782 },
  "koh-hong": { lat: 8.0792, lng: 98.679 },
  "koh-yao-yai": { lat: 8.0, lng: 98.583 },
  "similan-islands": { lat: 8.5695, lng: 97.6455 },
  "coco-coral": { lat: 7.7385, lng: 98.3731 },
  "coco-maithon": { lat: 7.7612, lng: 98.4807 },
  "coco-maithon-ko-he": { lat: 7.7612, lng: 98.4807 },
  "coco-racha-yai": { lat: 7.6042, lng: 98.3688 },
  "coco-khai-nok": { lat: 7.8931, lng: 98.5332 },
  "coco-phromthep": { lat: 7.7587, lng: 98.304 },
  "coco-phi-phi": { lat: 7.7405, lng: 98.7782 },
  "phanak-island": { lat: 8.203, lng: 98.487 },
  "koh-yao-noi": { lat: 8.118, lng: 98.618 },
  "naga-noi": { lat: 8.037, lng: 98.4475 },
  "naga-yai": { lat: 8.0545, lng: 98.46 },
  "ko-kalu-ok": { lat: 8.2163, lng: 98.4831 },
};

export default function RouteMapModal({
  isOpen,
  onClose,
  routeId,
  routeName,
}: RouteMapModalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  if (!isOpen) return null;

  const pointIds = COMPOSITE_ROUTES[routeId] || [];

  const mapMarkers = useMemo(() => {
    return pointIds
      .map((id) => {
        const coord = destCoords[id];
        if (!coord) return null;
        const dest =
          DESTINATIONS.find((d) => d.id === id) ||
          PIERS.find((p) => p.id === id);
        const isPier = PIERS.some((p) => p.id === id);
        return {
          lat: coord.lat,
          lng: coord.lng,
          title: dest?.name || id,
          isPier,
        };
      })
      .filter(Boolean) as {
      lat: number;
      lng: number;
      title: string;
      isPier: boolean;
    }[];
  }, [pointIds]);

  const fallbackCenter = { lat: 7.8214, lng: 98.3412 };
  const center = mapMarkers[0] || fallbackCenter;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 ${isFullscreen ? "bg-white p-0 sm:p-0" : "bg-[#0F172A]/80 backdrop-blur-sm"}`}
    >
      <div
        className={`bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${isFullscreen ? "w-full h-full rounded-none" : "rounded-lg w-full max-w-5xl md:h-[600px] border border-[#0F172A]/10 animate-fade-in"}`}
      >
        {/* Header / Sidebar info */}
        {!isFullscreen && (
          <div className="p-6 md:p-8 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-[#0F172A]/10 flex flex-col w-full md:w-1/3 min-h-[150px] relative max-h-[40vh] md:max-h-full overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#0F172A]/40 hover:text-[#0F172A] transition-colors md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-serif text-2xl text-[#0F172A] mb-2 pr-8 md:pr-0 leading-tight">
              Route Details
            </h3>
            <p className="text-[#0F172A]/60 text-sm font-medium mb-6">
              {routeName}
            </p>

            <div className="flex flex-col gap-4 mt-auto">
              {pointIds.map((id, idx) => {
                const dest =
                  DESTINATIONS.find((d) => d.id === id) ||
                  PIERS.find((p) => p.id === id);
                return (
                  <div key={id + idx} className="flex items-start gap-3">
                    <div className="mt-0.5 relative z-10 w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] font-bold">
                      {idx === 0 ? <MapPin className="h-3 w-3" /> : idx}
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-200">
                      <p className="text-sm font-bold text-[#0F172A]">
                        {dest?.name || id}
                      </p>
                      {idx === 0 && (
                        <span className="text-xs text-[#0F172A]/50">
                          Starting Pier
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 text-center">
                Mobile Itinerary Sync
              </p>
              <div className="bg-white p-2 border border-slate-100 shadow-sm rounded-lg mb-2">
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : "https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app"}?route=${routeId}`}
                  size={84}
                />
              </div>
              <p className="text-[9px] text-slate-400 text-center leading-relaxed mt-1">
                Scan to open and save this route exactly on your mobile device
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-6 bg-[#0F172A] hover:bg-[#1E293B] text-white font-sans font-bold uppercase tracking-wider py-3.5 px-4 rounded-xs text-xs transition-colors cursor-pointer text-center shadow-md active:scale-95 transition-transform"
            >
              Close Route Map
            </button>
          </div>
        )}

        <div
          className={`w-full bg-slate-100 flex flex-col relative ${isFullscreen ? "h-full md:w-full" : "md:w-2/3 h-[400px] md:h-full"}`}
        >
          <div className="absolute top-3 right-3 z-[1000] flex gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5 text-emerald-600" />
              {isFullscreen ? "Exit Full Screen" : "Full Screen"}
            </button>
            <button
              onClick={onClose}
              className="bg-white rounded-md p-1.5 text-[#0F172A]/60 hover:text-[#0F172A] border border-slate-200 shadow-sm transition-colors hidden md:block cursor-pointer flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 w-full h-full relative">
            <FreeMap
              center={{ lat: center.lat, lng: center.lng }}
              zoom={10}
              markers={mapMarkers}
              polylinePaths={mapMarkers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
