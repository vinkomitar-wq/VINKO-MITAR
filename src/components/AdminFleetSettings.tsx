import React, { useState, useEffect } from "react";
import { safeStringify } from "../lib/jsonSafe";
import {
  Plus,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Upload,
  Trash2,
  Printer,
  Share2,
  Calendar,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CATAMARANS, DESTINATIONS } from "../data";
import { VESSEL_BASE_RATES } from "./VesselCard";
import VesselCard from "./VesselCard";
import { QRCodeSVG } from "qrcode.react";
import { getPublicUrl } from "../utils/url";

const compressImage = (
  file: File,
  maxW = 1000,
  maxH = 1000,
  quality = 0.75,
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        } else {
          resolve(ev.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(ev.target?.result as string);
      };
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => {
      resolve("");
    };
    reader.readAsDataURL(file);
  });
};

export default function AdminFleetSettings({
  hidePhotoEditing = false,
  onAlert,
  isAdmin = false,
  agentId = "",
}: {
  hidePhotoEditing?: boolean;
  onAlert?: (msg: string) => void;
  isAdmin?: boolean;
  agentId?: string;
} = {}) {
  const [activeSubTab, setActiveSubTab] = useState<"vessels" | "routes" | "qr">(
    "vessels",
  );

  const [vessels, setVessels] = useState(CATAMARANS);
  const [routes, setRoutes] = useState(DESTINATIONS);
  const [rates, setRates] = useState(VESSEL_BASE_RATES);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("charter_offline_mode") === "true";
  });

  // Custom editing states
  const [editingVessel, setEditingVessel] = useState<any>(null);
  const [editingRoute, setEditingRoute] = useState<any>(null);

  const toggleOfflineMode = () => {
    const newVal = !offlineMode;
    setOfflineMode(newVal);
    localStorage.setItem("charter_offline_mode", String(newVal));
  };

  useEffect(() => {
    // 1. Initial quick load from local storage
    let currentVessels = [...CATAMARANS];
    const savedVessels = localStorage.getItem("admin_vessels_override");
    if (savedVessels) {
      currentVessels = JSON.parse(savedVessels);
    }
    let currentRoutes = [...DESTINATIONS];
    const savedRoutes = localStorage.getItem("admin_routes_override");
    if (savedRoutes) {
      currentRoutes = JSON.parse(savedRoutes);
    }
    let currentRates = { ...VESSEL_BASE_RATES };
    const savedRates = localStorage.getItem("admin_fleet_rates_override");
    if (savedRates) {
      currentRates = JSON.parse(savedRates);
    }

    if (!isAdmin && agentId) {
      const agentVessels = localStorage.getItem(`agent_vessels_${agentId}`);
      if (agentVessels) {
        currentVessels = [...currentVessels, ...JSON.parse(agentVessels)];
      }
      const agentRoutes = localStorage.getItem(`agent_routes_${agentId}`);
      if (agentRoutes) {
        currentRoutes = [...currentRoutes, ...JSON.parse(agentRoutes)];
      }
    }

    setVessels(currentVessels);
    setRoutes(currentRoutes);

    // 2. Fetch live data from cloud Firestore for perfect sync across all client devices
    const loadFromCloud = async () => {
      if (offlineMode) return;
      try {
        let loadedVessels = [...currentVessels];
        let loadedRoutes = [...currentRoutes];

        const vesselsSnap = await getDoc(doc(db, "fleet", "vessels"));
        if (vesselsSnap.exists()) {
          const list = vesselsSnap.data().list;
          if (list && Array.isArray(list)) {
            localStorage.setItem(
              "admin_vessels_override",
              safeStringify(list),
            );
            loadedVessels = list;
          }
        }

        const routesSnap = await getDoc(doc(db, "fleet", "routes"));
        if (routesSnap.exists()) {
          const list = routesSnap.data().list;
          if (list && Array.isArray(list)) {
            localStorage.setItem("admin_routes_override", safeStringify(list));
            loadedRoutes = list;
          }
        }

        let currentMergedRates = { ...currentRates };
        const ratesSnap = await getDoc(doc(db, "fleet", "rates"));
        if (ratesSnap.exists()) {
          const data = ratesSnap.data().data;
          if (data) {
            currentMergedRates = { ...currentMergedRates, ...data };
            localStorage.setItem(
              "admin_fleet_rates_override",
              safeStringify(data),
            );
          }
        }

        if (!isAdmin && agentId) {
          const agentVesselsSnap = await getDoc(doc(db, "agents", agentId));
          if (agentVesselsSnap.exists()) {
            const customVessels = agentVesselsSnap.data().customVessels;
            if (customVessels && Array.isArray(customVessels)) {
              loadedVessels = [...loadedVessels, ...customVessels];
              localStorage.setItem(
                `agent_vessels_${agentId}`,
                safeStringify(customVessels),
              );
            }
            const customRoutes = agentVesselsSnap.data().customRoutes;
            if (customRoutes && Array.isArray(customRoutes)) {
              loadedRoutes = [...loadedRoutes, ...customRoutes];
              localStorage.setItem(
                `agent_routes_${agentId}`,
                safeStringify(customRoutes),
              );
            }
            const customRates = agentVesselsSnap.data().customRates;
            if (customRates) {
              currentMergedRates = { ...currentMergedRates, ...customRates };
              localStorage.setItem(
                `agent_rates_${agentId}`,
                safeStringify(customRates),
              );
            }
          }
        }

        setRates(currentMergedRates);
        setVessels(loadedVessels);
        setRoutes(loadedRoutes);
      } catch (err) {
        console.warn("Could not load fleet overrides from Firestore:", err);
      }
    };

    loadFromCloud();
  }, [isAdmin, agentId, offlineMode]);

  const saveVessel = async () => {
    if (!editingVessel) return;

    // Auto-repair any paths reference to old /src/assets/ images
    const sanitizeVesselImages = (vesselsList: any[]) => {
      return vesselsList.map((vessel) => {
        const updatedV = { ...vessel };
        if (typeof updatedV.image === "string") {
          if (updatedV.image.startsWith("/src/assets/")) {
            updatedV.image = updatedV.image.replace("/src/assets/", "/assets/");
          } else if (updatedV.image.includes("/src/assets/")) {
            updatedV.image = updatedV.image.replace(
              /\/src\/assets\//g,
              "/assets/",
            );
          }
        }
        if (Array.isArray(updatedV.images)) {
          updatedV.images = updatedV.images.map((img: any) => {
            if (typeof img === "string") {
              if (img.startsWith("/src/assets/")) {
                return img.replace("/src/assets/", "/assets/");
              } else if (img.includes("/src/assets/")) {
                return img.replace(/\/src\/assets\//g, "/assets/");
              }
            }
            return img;
          });
        }
        return updatedV;
      });
    };

    if (!isAdmin && agentId) {
      // Create or update custom vessel for agent only
      const eVessel = { ...editingVessel, isCustomBy: agentId };
      const rawStored = localStorage.getItem(`agent_vessels_${agentId}`);
      let agentTessels = rawStored ? JSON.parse(rawStored) : [];

      const existsIndex = agentTessels.findIndex(
        (v: any) => v.id === eVessel.id,
      );
      if (existsIndex >= 0) {
        agentTessels[existsIndex] = eVessel;
      } else {
        agentTessels.push(eVessel);
      }
      agentTessels = sanitizeVesselImages(agentTessels);

      const newGlobalVessels = vessels.map((v) =>
        v.id === eVessel.id ? eVessel : v,
      );
      if (!vessels.find((v) => v.id === eVessel.id)) {
        newGlobalVessels.push(eVessel);
      }

      setVessels(newGlobalVessels);
      localStorage.setItem(
        `agent_vessels_${agentId}`,
        safeStringify(agentTessels),
      );
      setEditingVessel(null);
      window.dispatchEvent(new Event("admin-data-updated"));

      if (!offlineMode) {
        try {
          await setDoc(
            doc(db, "agents", agentId),
            { customVessels: agentTessels },
            { merge: true },
          );
          // But inform admin of the creation
          await setDoc(doc(db, "admin_messages", Date.now().toString()), {
            type: "new_custom_vessel",
            agentId: agentId,
            vesselName: eVessel.name,
            timestamp: new Date().toISOString(),
          });
          if (onAlert)
            onAlert(
              "Vessel details saved successfully to your personal Agent Workspace.",
            );
          else
            alert(
              "Vessel details saved successfully to your personal Agent Workspace.",
            );
        } catch (err: any) {
          if (onAlert)
            onAlert("Saved locally but failed to sync: " + err.message);
        }
      }
      return;
    }

    const updatedRaw = vessels.map((v) =>
      v.id === editingVessel.id ? editingVessel : v,
    );
    if (!vessels.find((v) => v.id === editingVessel.id)) {
      updatedRaw.push(editingVessel);
    }
    const updated = sanitizeVesselImages(updatedRaw);

    setVessels(updated);

    CATAMARANS.length = 0;
    CATAMARANS.push(...updated);

    localStorage.setItem("admin_vessels_override", safeStringify(updated));
    setEditingVessel(null);
    window.dispatchEvent(new Event("admin-data-updated"));

    // Upload to Firestore if not using offline mode
    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "vessels"), { list: updated });
        if (onAlert)
          onAlert(
            "Vessel details saved and synchronized successfully to the Cloud Database!",
          );
        else
          alert(
            "Vessel details saved and synchronized successfully to the Cloud Database!",
          );
      } catch (err: any) {
        console.error("Failed to synchronize vessels on Firestore:", err);
        if (onAlert)
          onAlert(
            "⚠️ Error Syncing with Database:\nSaved locally, but could not sync to Cloud. " +
              (err.message || String(err)),
          );
        else
          alert(
            "⚠️ Error Syncing with Database:\nSaved locally, but could not sync to Cloud. " +
              (err.message || String(err)),
          );
      }
    } else {
      if (onAlert)
        onAlert("Offline access active: Vessel details saved locally only.");
      else alert("Offline access active: Vessel details saved locally only.");
    }

    setEditingVessel(null);
  };

  const deleteVessel = async (id: string, name: string) => {
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = window.confirm(
          `Are you sure you want to completely remove this vessel: ${name}?`,
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    if (!isAdmin && agentId) {
      // an agent can only delete their custom vessels
      const target = vessels.find((v) => v.id === id);
      if (target && target.isCustomBy !== agentId) {
        if (onAlert)
          onAlert(
            "Permission Denied: You can only delete vessels you have created. Global vessels are locked by Admin.",
          );
        else
          alert(
            "Permission Denied: You can only delete vessels you have created. Global vessels are locked by Admin.",
          );
        return;
      }
      const rawStored = localStorage.getItem(`agent_vessels_${agentId}`);
      let agentTessels = rawStored ? JSON.parse(rawStored) : [];
      agentTessels = agentTessels.filter((v: any) => v.id !== id);
      localStorage.setItem(
        `agent_vessels_${agentId}`,
        safeStringify(agentTessels),
      );

      const updated = vessels.filter((v) => v.id !== id);
      setVessels(updated);
      CATAMARANS.length = 0;
      CATAMARANS.push(...updated);
      window.dispatchEvent(new Event("admin-data-updated"));

      if (!offlineMode) {
        try {
          await setDoc(
            doc(db, "agents", agentId),
            { customVessels: agentTessels },
            { merge: true },
          );
          if (onAlert) onAlert("Custom vessel removed from your workspace.");
        } catch (err: any) {}
      }
      return;
    }

    const updated = vessels.filter((v) => v.id !== id);
    setVessels(updated);

    // Explicitly update memory mapping so it doesn't linger elsewhere
    CATAMARANS.length = 0;
    CATAMARANS.push(...updated);

    localStorage.setItem("admin_vessels_override", safeStringify(updated));
    window.dispatchEvent(new Event("admin-data-updated"));

    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "vessels"), { list: updated });
        if (onAlert) onAlert("Vessel deleted from DB successfully.");
        else alert("Vessel deleted from DB successfully.");
      } catch (err: any) {
        if (onAlert) onAlert("Error syncing deleted vessel: " + err.message);
        else alert("Error syncing deleted vessel: " + err.message);
      }
    }
  };

  const saveRoute = async () => {
    if (!editingRoute) return;

    if (!isAdmin && agentId) {
      const eRoute = { ...editingRoute, isCustomBy: agentId };
      const rawStored = localStorage.getItem(`agent_routes_${agentId}`);
      let agentRoutesList = rawStored ? JSON.parse(rawStored) : [];
      const existsIndex = agentRoutesList.findIndex(
        (r: any) => r.id === eRoute.id,
      );
      if (existsIndex >= 0) agentRoutesList[existsIndex] = eRoute;
      else agentRoutesList.push(eRoute);

      const updated = routes.map((r) => (r.id === eRoute.id ? eRoute : r));
      if (!routes.find((r) => r.id === eRoute.id)) updated.push(eRoute);
      setRoutes(updated);
      localStorage.setItem(
        `agent_routes_${agentId}`,
        safeStringify(agentRoutesList),
      );
      setEditingRoute(null);
      window.dispatchEvent(new Event("admin-data-updated"));

      if (!offlineMode) {
        try {
          await setDoc(
            doc(db, "agents", agentId),
            { customRoutes: agentRoutesList },
            { merge: true },
          );
          await setDoc(doc(db, "admin_messages", Date.now().toString()), {
            type: "new_custom_route",
            agentId: agentId,
            routeName: eRoute.name,
            timestamp: new Date().toISOString(),
          });
          if (onAlert) onAlert("Route saved to your personal workspace.");
        } catch (err: any) {}
      }
      return;
    }

    const updated = routes.map((r) =>
      r.id === editingRoute.id ? editingRoute : r,
    );
    if (!routes.find((r) => r.id === editingRoute.id)) {
      updated.push(editingRoute);
    }
    setRoutes(updated);

    DESTINATIONS.length = 0;
    DESTINATIONS.push(...updated);

    localStorage.setItem("admin_routes_override", safeStringify(updated));
    setEditingRoute(null);
    window.dispatchEvent(new Event("admin-data-updated"));

    // Upload to Firestore if not using offline mode
    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "routes"), { list: updated });
        if (onAlert)
          onAlert(
            "Route details saved and synchronized successfully to the Cloud Database!",
          );
        else
          alert(
            "Route details saved and synchronized successfully to the Cloud Database!",
          );
      } catch (err: any) {
        console.error("Failed to synchronize routes on Firestore:", err);
        if (onAlert)
          onAlert("⚠️ Database Sync Error:\n" + (err.message || String(err)));
        else alert("⚠️ Database Sync Error:\n" + (err.message || String(err)));
      }
    } else {
      if (onAlert)
        onAlert("Offline access active: Route details saved locally only.");
      else alert("Offline access active: Route details saved locally only.");
    }
  };

  const deleteRoute = async (id: string, name: string) => {
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = window.confirm(
          `Are you sure you want to completely remove this route: ${name}?`,
        );
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    if (!isAdmin && agentId) {
      const target = routes.find((r) => r.id === id);
      if (target && target.isCustomBy !== agentId) {
        if (onAlert)
          onAlert(
            "Permission Denied: You can only delete routes you have created. Global routes are locked by Admin.",
          );
        else
          alert(
            "Permission Denied: You can only delete routes you have created. Global routes are locked by Admin.",
          );
        return;
      }
      const rawStored = localStorage.getItem(`agent_routes_${agentId}`);
      let agentRoutesList = rawStored ? JSON.parse(rawStored) : [];
      agentRoutesList = agentRoutesList.filter((r: any) => r.id !== id);
      localStorage.setItem(
        `agent_routes_${agentId}`,
        safeStringify(agentRoutesList),
      );

      const updated = routes.filter((r) => r.id !== id);
      setRoutes(updated);
      DESTINATIONS.length = 0;
      DESTINATIONS.push(...updated);
      window.dispatchEvent(new Event("admin-data-updated"));

      if (!offlineMode) {
        try {
          await setDoc(
            doc(db, "agents", agentId),
            { customRoutes: agentRoutesList },
            { merge: true },
          );
          if (onAlert) onAlert("Custom route removed from your workspace.");
        } catch (err: any) {}
      }
      return;
    }

    const updated = routes.filter((r) => r.id !== id);
    setRoutes(updated);

    // Explicitly update memory mapping so it doesn't linger elsewhere
    DESTINATIONS.length = 0;
    DESTINATIONS.push(...updated);

    localStorage.setItem("admin_routes_override", safeStringify(updated));
    window.dispatchEvent(new Event("admin-data-updated"));

    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "routes"), { list: updated });
        if (onAlert) onAlert("Route deleted from DB successfully.");
        else alert("Route deleted from DB successfully.");
      } catch (err: any) {
        if (onAlert) onAlert("Error syncing deleted route: " + err.message);
        else alert("Error syncing deleted route: " + err.message);
      }
    }
  };

  const saveGlobalRates = async (vesselIdStr: string, updatedRates: any) => {
    const newRates = { ...rates, [vesselIdStr]: updatedRates };

    if (!isAdmin && agentId) {
      setRates(newRates);
      localStorage.setItem(`agent_rates_${agentId}`, safeStringify(newRates));

      if (!offlineMode) {
        try {
          await setDoc(
            doc(db, "agents", agentId),
            { customRates: newRates },
            { merge: true },
          );
        } catch (err: any) {}
      }
      return;
    }

    setRates(newRates);
    localStorage.setItem(
      "admin_fleet_rates_override",
      safeStringify(newRates),
    );

    // Upload to Firestore if not using offline mode
    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "rates"), { data: newRates });
      } catch (err: any) {
        console.error("Failed to synchronize rates on Firestore:", err);
        if (onAlert)
          onAlert(
            "⚠️ Database Sync Error for Rates:\n" +
              (err.message || String(err)),
          );
        else
          alert(
            "⚠️ Database Sync Error for Rates:\n" +
              (err.message || String(err)),
          );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 mb-4 gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("vessels")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${activeSubTab === "vessels" ? "bg-[#0F172A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {isAdmin ? "Vessels & Prices" : "Workspace Vessels"}
          </button>
          <button
            onClick={() => setActiveSubTab("routes")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${activeSubTab === "routes" ? "bg-[#0F172A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {isAdmin ? "Routes & Destinations" : "Workspace Routes"}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab("qr")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${activeSubTab === "qr" ? "bg-[#0F172A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Ship QR Codes
            </button>
          )}
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new Event("admin-data-updated"));
            if (onAlert) onAlert("✓ Settings confirmed and live globally.");
            else alert("✓ Settings confirmed and live globally.");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-widest cursor-pointer shadow-sm active:scale-95 transition-all"
        >
          Save Changes
        </button>
      </div>

      {isAdmin && activeSubTab === "qr" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {vessels.map((vessel) => {
            const qrUrl = `${getPublicUrl()}?vessel-portal=${vessel.id}`;

            const handleShare = async () => {
              try {
                await navigator.share({
                  title: `${vessel.name} Operations`,
                  text: `Access Operations & Boarding Portal for ${vessel.name}`,
                  url: qrUrl,
                });
              } catch (err) {
                console.error("Share failed", err);
              }
            };

            const handlePrint = () => {
              const printWindow = window.open("", "_blank");
              printWindow?.document.write(
                `<html><head><title>${vessel.name} Operations Portal QR</title></head><body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#020617; color:#f8fafc; font-family:sans-serif;"><div><h1 style="text-align:center; font-family:serif; letter-spacing:3px; color:#f59e0b; font-size:2rem; margin-bottom:0.5rem; text-transform:uppercase;">PHUKET CHARTERS</h1><h2 style="text-align:center; letter-spacing:4px; text-transform:uppercase; font-size:1.5rem; margin-top:0; margin-bottom:2rem;">${vessel.name}</h2><div style="background-color:white; padding:1.5rem; border-radius:12px; display:inline-block; border:4px solid #b45309;">${document.querySelector(`svg[data-vessel-id="${vessel.id}"]`)?.outerHTML}</div><p style="text-align:center; text-transform:uppercase; font-weight:bold; font-size:0.8rem; margin-top:2rem; letter-spacing:2px; color:#10b981;">Crew Sign In & Shift Log</p><p style="text-align:center; text-transform:uppercase; font-weight:bold; font-size:0.75rem; color:#64748b; letter-spacing:2px;">Passenger Embark & Disembark</p></div></body></html>`,
              );
              printWindow?.print();
            };

            return (
              <div
                key={vessel.id}
                className="bg-gradient-to-b from-[#0e2a22] to-[#040d0a] border-2 border-amber-600 p-6 rounded-lg flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden text-center w-full max-w-sm mx-auto"
              >
                <div className="absolute inset-0 bg-amber-500/5"></div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif text-amber-500 tracking-wider uppercase font-semibold">
                    Phuket Charters
                  </h3>
                  <h4 className="text-lg font-sans text-white tracking-widest uppercase font-bold">
                    {vessel.name}
                  </h4>
                  <p className="text-amber-600/80 text-[10px] tracking-[0.2em] uppercase font-bold pt-1">
                    Authorized Ship Personnel
                  </p>
                </div>

                <div className="bg-white p-3 rounded shadow-inner border border-amber-800">
                  <QRCodeSVG
                    data-vessel-id={vessel.id}
                    value={qrUrl}
                    size={180}
                  />
                </div>

                <div className="space-y-1 text-white/90">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                    Crew Sign In & Out Shift Log
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-amber-600/70">
                    Passenger Embark & Disembark
                  </p>
                </div>

                <div className="flex gap-2 z-10 w-full pt-4 border-t border-amber-900/50">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-1 bg-slate-950 hover:bg-slate-900 text-amber-500 border border-amber-900/50 p-2 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-white p-2 border border-slate-600 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => window.open(qrUrl, "_blank")}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white p-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    Test Portal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === "vessels" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingVessel({
                  id: "new-vessel-" + Date.now(),
                  name: "New Vessel",
                  model: "Model",
                  capacity: 10,
                  length: "40 ft",
                  images: [],
                  description: "",
                  cabins: 1,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Vessel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vessels.map((vessel) => (
              <div
                key={vessel.id}
                className="relative group bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-md transition-all flex flex-col hover:z-50"
              >
                <div className="h-28 bg-slate-200 relative rounded-t-md">
                  <div className="w-full h-full overflow-hidden relative z-0 group-hover:overflow-visible rounded-t-md group-hover:rounded-md">
                    <img
                      src={vessel.images[0]}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[2.5] group-hover:z-50 relative group-hover:shadow-2xl rounded-t-md group-hover:rounded-md origin-center"
                      alt={vessel.name}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-10 rounded-t-md" />
                  <div className="absolute bottom-2 left-2 right-2 text-white z-20">
                    <p className="font-bold text-sm leading-tight drop-shadow-md">
                      {vessel.name}
                    </p>
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-between flex-grow bg-white z-0 relative rounded-b-md">
                  <p className="text-[10px] text-slate-500 mb-3 truncate font-medium">
                    Capacity: {vessel.capacity} guests
                  </p>

                  {["the-best", "namaste", "the-one"].includes(vessel.id) && (
                    <a
                      href="https://phuketamazingyacht.com/direct/freebooking#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mb-3 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" /> Live Calendar
                    </a>
                  )}

                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={() => setEditingVessel(vessel)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteVessel(vessel.id, vessel.name)}
                      className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xs text-[10px] font-bold uppercase transition-colors"
                      title="Delete Vessel"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingVessel && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-white rounded-xs shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setEditingVessel(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold mb-4">Edit Vessel</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingVessel.name}
                      onChange={(e) =>
                        setEditingVessel({
                          ...editingVessel,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm"
                    />
                  </div>
                  {/* Photo Gallery & Cover Selection Management */}
                  <div className="border border-slate-200 rounded-sm p-4 bg-slate-50/50 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <ImageIcon className="h-4 w-4 text-emerald-600 font-bold" />{" "}
                      Vessel Photos Gallery / Slike Plovila
                    </h4>

                    {hidePhotoEditing ? (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xs p-3 text-[10px] text-amber-900 font-sans leading-relaxed">
                        🚫 <strong>Photo Editing Is Disabled:</strong> As a
                        Representative Broker, editing or replacing catamaran
                        vessel photos is restricted. To suggest updates or
                        refresh fleet media, please contact the main
                        administrator.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* URL input option */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            Add Photo by Web URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="https://example.com/vessel-photo.jpg"
                              id="add-vessel-photo-url"
                              className="bg-white px-3 py-1.5 border border-slate-300 rounded-xs text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(
                                  "add-vessel-photo-url",
                                ) as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  const newUrl = input.value.trim();
                                  const currentImages =
                                    editingVessel.images ||
                                    (editingVessel.image
                                      ? [editingVessel.image]
                                      : []);
                                  const updatedImages = [
                                    ...currentImages,
                                    newUrl,
                                  ];
                                  setEditingVessel({
                                    ...editingVessel,
                                    image: editingVessel.image || newUrl,
                                    images: updatedImages,
                                  });
                                  input.value = "";
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-xs cursor-pointer active:scale-98 transition-transform"
                            >
                              Add URL
                            </button>
                          </div>
                        </div>

                        {/* File upload option */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            Upload Local Photos / Prenesi Slike
                          </label>
                          <div className="flex items-center justify-center border border-dashed border-slate-300 rounded-xs p-2 bg-white hover:bg-slate-50 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              id="vessel-photos-picker"
                              className="hidden"
                              onChange={async (e) => {
                                const files = Array.from(
                                  e.target.files || [],
                                ) as File[];
                                if (files.length === 0) return;

                                try {
                                  const newBase64s = await Promise.all(
                                    files.map((file) => compressImage(file)),
                                  );
                                  const validBase64s = newBase64s.filter(
                                    (b) => b.length > 0,
                                  );
                                  if (validBase64s.length === 0) return;

                                  const currentImages =
                                    editingVessel.images ||
                                    (editingVessel.image
                                      ? [editingVessel.image]
                                      : []);
                                  const updatedImages = [
                                    ...currentImages,
                                    ...validBase64s,
                                  ];
                                  setEditingVessel({
                                    ...editingVessel,
                                    image:
                                      editingVessel.image || updatedImages[0],
                                    images: updatedImages,
                                  });
                                } catch (err) {
                                  console.error("Error compressing file:", err);
                                }
                              }}
                            />
                            <label
                              htmlFor="vessel-photos-picker"
                              className="cursor-pointer flex items-center justify-center gap-1.5 w-full text-slate-700 hover:text-slate-900 py-1 font-sans text-xs font-bold uppercase tracking-wider"
                            >
                              <Upload className="h-4 w-4 text-emerald-600" />{" "}
                              Select Image Files
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Previews / Gallery Order Grid */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Currently Loaded Photos (
                        {
                          (
                            editingVessel.images ||
                            (editingVessel.image ? [editingVessel.image] : [])
                          ).length
                        }
                        ) - First is Main Cover
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(() => {
                          const currentImages =
                            editingVessel.images ||
                            (editingVessel.image ? [editingVessel.image] : []);
                          if (currentImages.length === 0) {
                            return (
                              <div className="col-span-full py-6 text-center text-slate-400 italic text-[11px] bg-white border border-slate-200 rounded-xs">
                                No photos in gallery yet.
                              </div>
                            );
                          }
                          return currentImages.map(
                            (imgSrc: string, index: number) => {
                              const isCover = index === 0;
                              return (
                                <div
                                  key={`${imgSrc.substring(0, 30)}-${index}`}
                                  className="relative border border-slate-200 bg-white rounded-xs p-1 flex flex-col justify-between shadow-xs group hover:z-50"
                                >
                                  <div className="relative aspect-video w-full rounded-xs overflow-hidden group-hover:overflow-visible bg-slate-900 flex items-center justify-center">
                                    <img
                                      src={imgSrc}
                                      alt="vessel thumbnail"
                                      className="w-full h-full object-cover transition-transform duration-500 origin-center group-hover:scale-[3] group-hover:z-50 relative group-hover:rounded-md group-hover:shadow-2xl"
                                    />
                                    <span
                                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-xs text-[8px] font-bold uppercase tracking-wider ${isCover ? "bg-amber-500 text-slate-900 font-extrabold" : "bg-black/60 text-white"}`}
                                    >
                                      {isCover ? "Cover ⭐" : `#${index + 1}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-[9px] border-t border-slate-100 pt-1 px-0.5 gap-2">
                                    {!hidePhotoEditing ? (
                                      <>
                                        {!isCover ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedImgList = [
                                                ...currentImages,
                                              ];
                                              const item =
                                                updatedImgList.splice(
                                                  index,
                                                  1,
                                                )[0];
                                              updatedImgList.unshift(item);
                                              setEditingVessel({
                                                ...editingVessel,
                                                image: updatedImgList[0],
                                                images: updatedImgList,
                                              });
                                            }}
                                            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer transition-colors uppercase text-[8px]"
                                          >
                                            Use As Cover
                                          </button>
                                        ) : (
                                          <span className="text-amber-600 font-bold uppercase select-none text-[8px]">
                                            Main Cover
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedImgList = [
                                              ...currentImages,
                                            ];
                                            updatedImgList.splice(index, 1);
                                            setEditingVessel({
                                              ...editingVessel,
                                              image: updatedImgList[0] || "",
                                              images: updatedImgList,
                                            });
                                          }}
                                          className="text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                                          title="Delete Photo"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 text-[8px] italic py-0.5 select-none">
                                        Read-only view
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingVessel.description}
                      onChange={(e) =>
                        setEditingVessel({
                          ...editingVessel,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm h-24"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 mt-4">
                    <h4 className="font-bold text-sm mb-2 text-emerald-800">
                      Global Fleet Pricing
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Half Day
                        </label>
                        <input
                          type="number"
                          value={rates[editingVessel.id]?.halfday || 0}
                          onChange={(e) =>
                            saveGlobalRates(editingVessel.id, {
                              ...rates[editingVessel.id],
                              halfday: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xs text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Sunset
                        </label>
                        <input
                          type="number"
                          value={rates[editingVessel.id]?.sunset || 0}
                          onChange={(e) =>
                            saveGlobalRates(editingVessel.id, {
                              ...rates[editingVessel.id],
                              sunset: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xs text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Full Day
                        </label>
                        <input
                          type="number"
                          value={rates[editingVessel.id]?.fullday || 0}
                          onChange={(e) =>
                            saveGlobalRates(editingVessel.id, {
                              ...rates[editingVessel.id],
                              fullday: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xs text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Overnight
                        </label>
                        <input
                          type="number"
                          value={rates[editingVessel.id]?.overnight || 0}
                          onChange={(e) =>
                            saveGlobalRates(editingVessel.id, {
                              ...rates[editingVessel.id],
                              overnight: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-xs text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveVessel}
                    className="w-full mt-4 py-3 bg-[#0F172A] text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Save Vessel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "routes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 border rounded-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Manage Excursions
            </span>
            <button
              onClick={() =>
                setEditingRoute({
                  id: "new-route-" + Date.now(),
                  name: "New Route",
                  thaiName: "",
                  description: "",
                  highlights: [],
                  imageUrl: "",
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Route
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="relative group bg-white border border-slate-200 rounded-md overflow-visible shadow-sm hover:shadow-md transition-all flex flex-col hover:z-50"
              >
                <div className="h-28 bg-slate-200 relative rounded-t-md">
                  <div className="w-full h-full overflow-hidden relative z-0 group-hover:overflow-visible rounded-t-md group-hover:rounded-md">
                    {route.imageUrl ? (
                      <img
                        src={route.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[2.5] group-hover:z-50 relative group-hover:shadow-2xl rounded-t-md group-hover:rounded-md origin-center"
                        alt={route.name}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-10 rounded-t-md" />
                  <div className="absolute bottom-2 left-2 right-2 text-white z-20">
                    <div className="font-bold text-sm leading-tight drop-shadow-md">
                      {route.name}
                    </div>
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-between flex-grow bg-white z-0 relative rounded-b-md">
                  <p className="text-[9px] text-slate-500 mb-3 line-clamp-2">
                    {route.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={() => setEditingRoute(route)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id, route.name)}
                      className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xs text-[10px] font-bold uppercase transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingRoute && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="w-full max-w-xl bg-white rounded-xs shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setEditingRoute(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold mb-4">Edit Route</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Route Name
                    </label>
                    <input
                      type="text"
                      value={editingRoute.name}
                      onChange={(e) =>
                        setEditingRoute({
                          ...editingRoute,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Photo URL
                    </label>
                    <input
                      type="text"
                      value={editingRoute.imageUrl}
                      onChange={(e) =>
                        setEditingRoute({
                          ...editingRoute,
                          imageUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingRoute.description}
                      onChange={(e) =>
                        setEditingRoute({
                          ...editingRoute,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm h-24"
                    />
                  </div>
                  <button
                    onClick={saveRoute}
                    className="w-full mt-4 py-3 bg-[#0F172A] text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Save Route
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
