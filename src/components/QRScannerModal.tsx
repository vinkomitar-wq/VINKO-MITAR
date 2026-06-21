import React, { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { X, Camera } from "lucide-react";

interface QRScannerModalProps {
  onScanSuccess: (
    decodedText: string,
    location?: { lat: number; lng: number },
  ) => void;
  onClose: () => void;
}

export default function QRScannerModal({
  onScanSuccess,
  onClose,
}: QRScannerModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn(
            "QRScannerModal location retrieval failed / blocked:",
            err,
          );
        },
        { enableHighAccuracy: true, timeout: 6000 },
      );
    }
  }, []);

  const handleScan = (result: any) => {
    if (result && result.length > 0 && result[0].rawValue) {
      onScanSuccess(result[0].rawValue, location || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded p-4 max-w-sm w-full mx-auto relative shadow-2xl">
        <button
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-800 p-2 z-10 cursor-pointer bg-white rounded-full border border-slate-100 shadow-sm"
          onClick={onClose}
          type="button"
        >
          <X size={20} />
        </button>
        <div className="text-center mb-4 pt-2">
          <Camera size={24} className="mx-auto text-emerald-600 mb-2" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
            Scan Booking QR
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            Point your camera at a customer's booking QR code
          </p>
        </div>

        <div className="w-full rounded overflow-hidden relative bg-slate-100 min-h-[250px]">
          <Scanner
            onScan={handleScan}
            formats={["qr_code"]}
            components={{
              audio: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
