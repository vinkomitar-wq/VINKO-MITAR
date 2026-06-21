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
  Bed,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CATAMARANS, DESTINATIONS, STANDARD_EXTRAS } from "../data";
import { VESSEL_BASE_RATES } from "./VesselCard";
import VesselCard from "./VesselCard";
import { QRCodeSVG } from "qrcode.react";
import { getPublicUrl } from "../utils/url";
import { compressImage, compressBase64 } from "../utils/imageCompressor";

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
  const [activeSubTab, setActiveSubTab] = useState<
    "vessels" | "routes" | "qr" | "addons"
  >("vessels");
 
  const [vessels, setVessels] = useState(CATAMARANS);
  const [routes, setRoutes] = useState(DESTINATIONS);
  const [addons, setAddons] = useState<any[]>(STANDARD_EXTRAS);
  const [rates, setRates] = useState(VESSEL_BASE_RATES);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("charter_offline_mode") === "true";
  });
 
  // Custom editing states
  const [editingVessel, setEditingVessel] = useState<any>(null);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [tempRouteUrl, setTempRouteUrl] = useState("");
  const [tempAddonUrl, setTempAddonUrl] = useState("");
  const [isVesselPhotoLoading, setIsVesselPhotoLoading] = useState(false);
  const [isCabinPhotoLoading, setIsCabinPhotoLoading] = useState(false);
  const [isRoutePhotoLoading, setIsRoutePhotoLoading] = useState(false);
  const [isAddonPhotoLoading, setIsAddonPhotoLoading] = useState(false);

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
    let currentAddons = [...STANDARD_EXTRAS];
    const savedAddons = localStorage.getItem("admin_addons_override");
    if (savedAddons) {
      currentAddons = JSON.parse(savedAddons);
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
    setAddons(currentAddons);

    // 2. Fetch live data from cloud Firestore for perfect sync across all client devices
    const loadFromCloud = async () => {
      if (offlineMode) return;
      try {
        let loadedVessels = [...currentVessels];
        let loadedRoutes = [...currentRoutes];
        let loadedAddons = [...currentAddons];

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

        const addonsSnap = await getDoc(doc(db, "fleet", "addons"));
        if (addonsSnap.exists()) {
          const list = addonsSnap.data().list;
          if (list && Array.isArray(list)) {
            localStorage.setItem("admin_addons_override", safeStringify(list));
            loadedAddons = list;
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
        setAddons(loadedAddons);
      } catch (err) {
        console.warn("Could not load fleet overrides from Firestore:", err);
      }
    };

    loadFromCloud();
  }, [isAdmin, agentId, offlineMode]);

  const saveVessel = async () => {
    if (!editingVessel) return;

    // Auto-repair any paths reference to old /src/assets/ images or broken thebest1/thebest2 local assets
    const sanitizeVesselImages = (vesselsList: any[]) => {
      return vesselsList.map((vessel) => {
        const updatedV = { ...vessel };
        const mapBrokenPath = (path: string) => {
          if (typeof path !== "string") return path;
          let p = path;
          if (p.startsWith("/src/assets/")) {
            p = p.replace("/src/assets/", "/assets/");
          } else if (p.includes("/src/assets/")) {
            p = p.replace(/\/src\/assets\//g, "/assets/");
          }
          if (p.includes("thebest1.jpg")) {
            return "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=800&q=80";
          }
          if (p.includes("thebest2.jpg")) {
            return "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=800&q=80";
          }
          return p;
        };

        if (updatedV.image) {
          updatedV.image = mapBrokenPath(updatedV.image);
        }
        if (Array.isArray(updatedV.images)) {
          updatedV.images = updatedV.images.map((img: any) => mapBrokenPath(img));
        }
        if (Array.isArray(updatedV.cabinImages)) {
          updatedV.cabinImages = updatedV.cabinImages.map((img: any) => mapBrokenPath(img));
        }
        return updatedV;
      });
    };

    const compressVesselsList = async (vesselsList: any[]) => {
      const result = [];
      for (const vessel of vesselsList) {
        const compV = { ...vessel };
        if (compV.image && typeof compV.image === "string" && compV.image.startsWith("data:image/")) {
          compV.image = await compressBase64(compV.image, 700, 500, 0.5);
        }
        if (Array.isArray(compV.images)) {
          const compImgs = [];
          for (const img of compV.images) {
            if (img && typeof img === "string" && img.startsWith("data:image/")) {
              compImgs.push(await compressBase64(img, 700, 500, 0.5));
            } else {
              compImgs.push(img);
            }
          }
          compV.images = compImgs;
        }
        if (Array.isArray(compV.cabinImages)) {
          const compCabinImgs = [];
          for (const img of compV.cabinImages) {
            if (img && typeof img === "string" && img.startsWith("data:image/")) {
              compCabinImgs.push(await compressBase64(img, 700, 500, 0.5));
            } else {
              compCabinImgs.push(img);
            }
          }
          compV.cabinImages = compCabinImgs;
        }
        result.push(compV);
      }
      return result;
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
      agentTessels = await compressVesselsList(agentTessels);

      const newGlobalVessels = vessels.map((v) =>
        v.id === eVessel.id ? (agentTessels.find((at: any) => at.id === v.id) || eVessel) : v,
      );
      if (!vessels.find((v) => v.id === eVessel.id)) {
        const compressedEVessel = agentTessels.find((at: any) => at.id === eVessel.id) || eVessel;
        newGlobalVessels.push(compressedEVessel);
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
    const sanitized = sanitizeVesselImages(updatedRaw);
    const updated = await compressVesselsList(sanitized);

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

  const saveAddon = async (addonToSave: any) => {
    if (!addonToSave) return;
    const updated = addons.map((a) => (a.key === addonToSave.key ? addonToSave : a));
    if (!addons.find((a) => a.key === addonToSave.key)) {
      updated.push(addonToSave);
    }
    setAddons(updated);
    STANDARD_EXTRAS.length = 0;
    STANDARD_EXTRAS.push(...updated);

    localStorage.setItem("admin_addons_override", safeStringify(updated));
    setEditingAddon(null);
    window.dispatchEvent(new Event("admin-data-updated"));

    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "addons"), { list: updated });
        if (onAlert) {
          onAlert("Add-on details saved and synchronized successfully to the Cloud Database!");
        } else {
          alert("Add-on details saved and synchronized successfully to the Cloud Database!");
        }
      } catch (err: any) {
        console.error("Failed to synchronize addons on Firestore:", err);
        if (onAlert) onAlert("⚠️ Database Sync Error:\n" + (err.message || String(err)));
        else alert("⚠️ Database Sync Error:\n" + (err.message || String(err)));
      }
    } else {
      if (onAlert) onAlert("Offline access active: Add-on details saved locally only.");
      else alert("Offline access active: Add-on details saved locally only.");
    }
  };

  const deleteAddon = async (key: string, label: string) => {
    let proceed = true;
    const isIframe = window.self !== window.top;
    if (!isIframe) {
      try {
        proceed = window.confirm(`Are you sure you want to completely remove this add-on or extra: ${label}?`);
      } catch (e) {
        proceed = true;
      }
    }
    if (!proceed) return;

    const updated = addons.filter((a) => a.key !== key);
    setAddons(updated);
    STANDARD_EXTRAS.length = 0;
    STANDARD_EXTRAS.push(...updated);

    localStorage.setItem("admin_addons_override", safeStringify(updated));
    window.dispatchEvent(new Event("admin-data-updated"));

    if (!offlineMode) {
      try {
        await setDoc(doc(db, "fleet", "addons"), { list: updated });
        if (onAlert) onAlert("Add-on deleted from DB successfully.");
        else alert("Add-on deleted from DB successfully.");
      } catch (err: any) {
        if (onAlert) onAlert("Error syncing deleted add-on: " + err.message);
        else alert("Error syncing deleted add-on: " + err.message);
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
              onClick={() => setActiveSubTab("addons")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${activeSubTab === "addons" ? "bg-[#0F172A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Add-ons & Extras
            </button>
          )}
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Cinematic Walkthrough Video URL / Video Obilazak (YouTube, Vimeo, MP4 URL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=scg136qDclY"
                      value={editingVessel.videoUrl || ""}
                      onChange={(e) =>
                        setEditingVessel({
                          ...editingVessel,
                          videoUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">
                      Paste a standard YouTube link, Vimeo URL, or direct video file. This renders an elegant rose pulse <strong>"Watch Tour / Video"</strong> trigger on the boat card on the front page.
                    </p>
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
                          <div className={`flex items-center justify-center border border-dashed rounded-xs p-2 transition-colors ${isVesselPhotoLoading ? "border-amber-400 bg-amber-50/50" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              id="vessel-photos-picker"
                              disabled={isVesselPhotoLoading}
                              className="hidden"
                              onChange={async (e) => {
                                const files = Array.from(
                                  e.target.files || [],
                                ) as File[];
                                if (files.length === 0) return;

                                setIsVesselPhotoLoading(true);
                                try {
                                  const newBase64s = await Promise.all(
                                    files.map(async (file) => {
                                      try {
                                        return await compressImage(file, 800, 600, 0.55);
                                      } catch (singleErr) {
                                        console.error("Error with single file compression:", singleErr);
                                        return "";
                                      }
                                    }),
                                  );
                                  const validBase64s = newBase64s.filter(
                                    (b) => b && b.length > 0,
                                  );
                                  if (validBase64s.length === 0) {
                                    alert("No valid images could be read. Please try a different photo format.");
                                    setIsVesselPhotoLoading(false);
                                    return;
                                  }

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
                                } catch (err: any) {
                                  console.error("Error compressing file:", err);
                                  alert("Error reading file: " + (err.message || String(err)));
                                } finally {
                                  setIsVesselPhotoLoading(false);
                                  // Clear input so same file can be reselected
                                  e.target.value = "";
                                }
                              }}
                            />
                            {isVesselPhotoLoading ? (
                              <div className="flex items-center gap-2 py-1 font-sans text-xs font-bold text-amber-700 uppercase tracking-wider animate-pulse">
                                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                Processing & Compressing Photos...
                              </div>
                            ) : (
                              <label
                                htmlFor="vessel-photos-picker"
                                className="cursor-pointer flex items-center justify-center gap-1.5 w-full text-slate-700 hover:text-slate-900 py-1 font-sans text-xs font-bold uppercase tracking-wider"
                              >
                                <Upload className="h-4 w-4 text-emerald-600" />{" "}
                                Select Image Files
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notice Banner to save */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xs p-2.5 text-[10px] leading-relaxed">
                      💡 <strong>Save Reminder / Podsjetnik za spremanje:</strong>
                      <br />
                      Slike su prenesene ili poredane u galeriji privremeno u formi. 
                      <strong> Morate kliknuti crni gumb "Spremi Plovilo" na dnu</strong> ove forme kako bi se promjene trajno snimile u bazu podataka!
                    </div>

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
                                  <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-slate-900 flex items-center justify-center">
                                    <img
                                      src={imgSrc}
                                      alt="vessel thumbnail"
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                      referrerPolicy="no-referrer"
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

                  {/* Optional Cabin Photos Gallery */}
                  <div className="border border-slate-200 rounded-sm p-4 bg-slate-50/50 space-y-4 font-sans">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <Bed className="h-4 w-4 text-emerald-600 font-bold" />{" "}
                      Luxury Cabin Photos Gallery / Slike Luksuznih Kabina
                    </h4>

                    {hidePhotoEditing ? (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xs p-3 text-[10px] text-amber-900 font-sans leading-relaxed">
                        🚫 <strong>Cabin Photo Editing Is Disabled:</strong> As a
                        Representative Broker, editing or replacing cabin
                        photos is restricted.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* URL input option */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            Add Cabin Photo by Web URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="https://example.com/cabin-photo.jpg"
                              id="add-vessel-cabin-photo-url"
                              className="bg-white px-3 py-1.5 border border-slate-300 rounded-xs text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(
                                  "add-vessel-cabin-photo-url",
                                ) as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  const newUrl = input.value.trim();
                                  const currentImages = editingVessel.cabinImages || [];
                                  const updatedImages = [
                                    ...currentImages,
                                    newUrl,
                                  ];
                                  setEditingVessel({
                                    ...editingVessel,
                                    cabinImages: updatedImages,
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
                            Upload Local Cabin Photos / Prenesi Slike Kabine
                          </label>
                          <div className={`flex items-center justify-center border border-dashed rounded-xs p-2 transition-colors ${isCabinPhotoLoading ? "border-amber-400 bg-amber-50/50" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              id="vessel-cabin-photos-picker"
                              disabled={isCabinPhotoLoading}
                              className="hidden"
                              onChange={async (e) => {
                                const files = Array.from(
                                  e.target.files || [],
                                ) as File[];
                                if (files.length === 0) return;

                                setIsCabinPhotoLoading(true);
                                try {
                                  const newBase64s = await Promise.all(
                                    files.map(async (file) => {
                                      try {
                                        return await compressImage(file, 800, 600, 0.55);
                                      } catch (singleErr) {
                                        console.error("Error with single file compression:", singleErr);
                                        return "";
                                      }
                                    }),
                                  );
                                  const validBase64s = newBase64s.filter(
                                    (b) => b && b.length > 0,
                                  );
                                  if (validBase64s.length === 0) {
                                    alert("No valid images could be read.");
                                    setIsCabinPhotoLoading(false);
                                    return;
                                  }

                                  const currentImages = editingVessel.cabinImages || [];
                                  const updatedImages = [
                                    ...currentImages,
                                    ...validBase64s,
                                  ];
                                  setEditingVessel({
                                    ...editingVessel,
                                    cabinImages: updatedImages,
                                  });
                                } catch (err: any) {
                                  console.error("Error compressing file:", err);
                                  alert("Error reading file: " + (err.message || String(err)));
                                } finally {
                                  setIsCabinPhotoLoading(false);
                                  e.target.value = "";
                                }
                              }}
                            />
                            {isCabinPhotoLoading ? (
                              <div className="flex items-center gap-2 py-1 font-sans text-xs font-bold text-amber-700 uppercase tracking-wider animate-pulse">
                                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                Processing Cabin Photos...
                              </div>
                            ) : (
                              <label
                                htmlFor="vessel-cabin-photos-picker"
                                className="cursor-pointer flex items-center justify-center gap-1.5 w-full text-slate-700 hover:text-slate-900 py-1 font-sans text-xs font-bold uppercase tracking-wider"
                              >
                                <Upload className="h-4 w-4 text-emerald-600" />{" "}
                                Select Cabin Image Files
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notice Banner to save */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xs p-2.5 text-[10px] leading-relaxed">
                      💡 <strong>Save Reminder:</strong> Click the black <strong>"Spremi Plovilo" / "Save Vessel"</strong> button at the bottom of this form to permanently persist these cabin photos to the Cloud Database!
                    </div>

                    {/* Previews / Gallery Grid */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Currently Loaded Cabin Photos ({ (editingVessel.cabinImages || []).length })
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(() => {
                          const currentCabinImages = editingVessel.cabinImages || [];
                          if (currentCabinImages.length === 0) {
                            return (
                              <div className="col-span-full py-6 text-center text-slate-400 italic text-[11px] bg-white border border-slate-200 rounded-xs">
                                No cabin photos uploaded yet. Fallbacks will apply in the booking form.
                              </div>
                            );
                          }
                          return currentCabinImages.map(
                            (imgSrc: string, index: number) => {
                              return (
                                <div
                                  key={`cabin-${imgSrc.substring(0, 30)}-${index}`}
                                  className="relative border border-slate-200 bg-white rounded-xs p-1 flex flex-col justify-between shadow-xs group"
                                >
                                  <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-slate-900 flex items-center justify-center">
                                    <img
                                      src={imgSrc}
                                      alt="cabin thumbnail"
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-xs text-[8px] font-bold uppercase tracking-wider bg-black/60 text-white">
                                      #{index + 1}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-end mt-1 text-[9px] border-t border-slate-100 pt-1 px-0.5 gap-2">
                                    {!hidePhotoEditing ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedImgList = [
                                            ...currentCabinImages,
                                          ];
                                          updatedImgList.splice(index, 1);
                                          setEditingVessel({
                                            ...editingVessel,
                                            cabinImages: updatedImgList,
                                          });
                                        }}
                                        className="text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                                        title="Delete Cabin Photo"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[8px] italic py-0.5 select-none">
                                        Read-only
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
                  imageUrls: [],
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
                      onClick={() => setEditingRoute({
                        ...route,
                        imageUrls: route.imageUrls || (route.imageUrl ? [route.imageUrl] : [])
                      })}
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
                  <div className="space-y-4 border-y border-slate-100 py-4 my-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      📸 Manage Route Photos / Slike Rute
                    </h4>

                    {/* Add by link */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Add Photo by URL / Paste Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempRouteUrl}
                          onChange={(e) => setTempRouteUrl(e.target.value)}
                          placeholder="https://example.com/island_photo.jpg"
                          className="flex-1 px-3 py-1.5 border rounded-xs text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempRouteUrl.trim()) return;
                            const cur = editingRoute.imageUrls || [];
                            const updated = [...cur, tempRouteUrl.trim()];
                            setEditingRoute({
                              ...editingRoute,
                              imageUrls: updated,
                              imageUrl: editingRoute.imageUrl || tempRouteUrl.trim(),
                            });
                            setTempRouteUrl("");
                          }}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>

                    {/* Upload local files */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Upload Files & Compress / Prenesi Slike
                      </label>
                      <div className={`flex items-center justify-center border border-dashed rounded-xs p-3 transition-all ${isRoutePhotoLoading ? "border-amber-400 bg-amber-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"}`}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id="route-photos-picker"
                          disabled={isRoutePhotoLoading}
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            if (files.length === 0) return;

                            setIsRoutePhotoLoading(true);
                            try {
                              const newBase64s = await Promise.all(
                                files.map(async (file) => {
                                  try {
                                    return await compressImage(file, 900, 600, 0.7);
                                  } catch (singleErr) {
                                    console.error("Error with route file compression:", singleErr);
                                    return "";
                                  }
                                })
                              );
                              const validBase64s = newBase64s.filter((b) => b && b.length > 0);
                              if (validBase64s.length === 0) {
                                alert("No valid images could be read.");
                                setIsRoutePhotoLoading(false);
                                return;
                              }

                              const currentImages = editingRoute.imageUrls || (editingRoute.imageUrl ? [editingRoute.imageUrl] : []);
                              const updatedImages = [...currentImages, ...validBase64s];
                              setEditingRoute({
                                ...editingRoute,
                                imageUrl: editingRoute.imageUrl || updatedImages[0],
                                imageUrls: updatedImages,
                              });
                            } catch (err: any) {
                              console.error("Error compressing file:", err);
                              alert("Error: " + (err.message || String(err)));
                            } finally {
                              setIsRoutePhotoLoading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                        {isRoutePhotoLoading ? (
                          <div className="flex items-center gap-2 py-1 font-sans text-xs font-bold text-amber-700 uppercase tracking-wider animate-pulse">
                            <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            Compressing Photos...
                          </div>
                        ) : (
                          <label
                            htmlFor="route-photos-picker"
                            className="cursor-pointer flex flex-col items-center justify-center gap-1 text-center w-full text-slate-600 hover:text-slate-800 py-1"
                          >
                            <Upload className="h-5 w-5 text-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Select Route Photos</span>
                            <span className="text-[10px] text-slate-400 font-sans">Supports multiple files, auto-compresses for quick loading</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Loaded Photos Gallery */}
                    {editingRoute.imageUrls && editingRoute.imageUrls.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Currently Loaded Photos ({editingRoute.imageUrls.length})
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-50 border p-3 rounded-xs">
                          {editingRoute.imageUrls.map((imgUrl: string, idx: number) => {
                            const isCover = editingRoute.imageUrl === imgUrl;
                            return (
                              <div key={idx} className="relative group bg-white border border-slate-200 rounded-sm overflow-hidden aspect-[4/3] flex items-center justify-center">
                                <img
                                  src={imgUrl}
                                  alt="Gallery thumbnail"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-row items-center justify-around p-1 z-10">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingRoute({ ...editingRoute, imageUrl: imgUrl })}
                                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2px] text-[8px] font-bold uppercase tracking-wider"
                                    >
                                      Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = editingRoute.imageUrls.filter((itm: string) => itm !== imgUrl);
                                      let newCover = editingRoute.imageUrl;
                                      if (isCover) {
                                        newCover = updated.length > 0 ? updated[0] : "";
                                      }
                                      setEditingRoute({
                                        ...editingRoute,
                                        imageUrl: newCover,
                                        imageUrls: updated,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-[2px] text-[8px] font-bold uppercase tracking-wider"
                                  >
                                    Delete
                                  </button>
                                </div>
                                {isCover && (
                                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm tracking-wider shadow-sm z-20">
                                    ⭐ Cover
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

      {isAdmin && activeSubTab === "addons" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 border rounded-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded">
              💎 Manage Add-ons & Upgrades / Dodaci i Extras
            </span>
            <button
              onClick={() =>
                setEditingAddon({
                  key: "addon-" + Date.now(),
                  label: "New Add-on",
                  defaultPrice: 1000,
                  description: "",
                  imageUrl: "",
                  imageUrls: [],
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add upgrade extra
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {addons.map((addon) => (
              <div
                key={addon.key}
                className="relative group bg-white border border-slate-200 rounded-md overflow-visible shadow-sm hover:shadow-md transition-all flex flex-col hover:z-50"
              >
                <div className="h-28 bg-slate-200 relative rounded-t-md">
                  <div className="w-full h-full overflow-hidden relative z-0 group-hover:overflow-visible rounded-t-md group-hover:rounded-md">
                    {addon.imageUrl ? (
                      <img
                        src={addon.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[2.5] group-hover:z-50 relative group-hover:shadow-2xl rounded-t-md group-hover:rounded-md origin-center"
                        alt={addon.label}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                        <ImageIcon className="w-6 h-6 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-10 rounded-t-md" />
                  <div className="absolute bottom-2 left-2 right-2 text-white z-20">
                    <div className="font-bold text-xs leading-tight drop-shadow-md">
                      {addon.label}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">
                      {addon.defaultPrice !== undefined ? `${addon.defaultPrice.toLocaleString()} THB` : "Free"}
                    </div>
                  </div>
                </div>
                <div className="p-3 flex flex-col justify-between flex-grow bg-white z-0 relative rounded-b-md">
                  <p className="text-[9px] text-slate-500 mb-3 line-clamp-2">
                    {addon.description || "Premium addition for Phuket catamaran experiences."}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button
                      onClick={() => setEditingAddon({
                        ...addon,
                        imageUrls: addon.imageUrls || (addon.imageUrl ? [addon.imageUrl] : [])
                      })}
                      className="flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteAddon(addon.key, addon.label)}
                      className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xs text-[10px] font-bold uppercase transition-colors"
                      title="Delete Add-on"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingAddon && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="w-full max-w-xl bg-white rounded-xs shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto w-full">
                <button
                  onClick={() => setEditingAddon(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold mb-4 font-sans uppercase tracking-wide text-slate-900 border-b pb-2">Edit Add-on / Extra Option</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Add-on Identifier Key
                      </label>
                      <input
                        type="text"
                        value={editingAddon.key}
                        onChange={(e) =>
                          setEditingAddon({
                            ...editingAddon,
                            key: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xs text-sm bg-slate-50 text-slate-500 font-mono text-xs focus:outline-hidden"
                        placeholder="e.g. waterSlider"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Add-on Name / Label
                      </label>
                      <input
                        type="text"
                        value={editingAddon.label}
                        onChange={(e) =>
                          setEditingAddon({
                            ...editingAddon,
                            label: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xs text-sm"
                        placeholder="e.g. Water Slider"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Default Price (THB) / Zadana Cijena
                    </label>
                    <input
                      type="number"
                      value={editingAddon.defaultPrice || 0}
                      onChange={(e) =>
                        setEditingAddon({
                          ...editingAddon,
                          defaultPrice: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-4 border-y border-slate-100 py-4 my-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      📸 Manage Add-on Photos / Slike Dodatka
                    </h4>

                    {/* Add-on Add by link */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Add Photo by URL / Paste Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempAddonUrl}
                          onChange={(e) => setTempAddonUrl(e.target.value)}
                          placeholder="https://example.com/slide_photo.jpg"
                          className="flex-1 px-3 py-1.5 border rounded-xs text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempAddonUrl.trim()) return;
                            const cur = editingAddon.imageUrls || [];
                            const updated = [...cur, tempAddonUrl.trim()];
                            setEditingAddon({
                              ...editingAddon,
                              imageUrls: updated,
                              imageUrl: editingAddon.imageUrl || tempAddonUrl.trim(),
                            });
                            setTempAddonUrl("");
                          }}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>

                    {/* Add-on Upload local files */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Upload Files & Compress / Prenesi Slike
                      </label>
                      <div className={`flex items-center justify-center border border-dashed rounded-xs p-3 transition-all ${isAddonPhotoLoading ? "border-amber-400 bg-amber-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"}`}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id="addon-photos-picker"
                          disabled={isAddonPhotoLoading}
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            if (files.length === 0) return;

                            setIsAddonPhotoLoading(true);
                            try {
                              const newBase64s = await Promise.all(
                                files.map(async (file) => {
                                  try {
                                    return await compressImage(file, 900, 600, 0.7);
                                  } catch (singleErr) {
                                    console.error("Error with addon file compression:", singleErr);
                                    return "";
                                  }
                                })
                              );
                              const validBase64s = newBase64s.filter((b) => b && b.length > 0);
                              if (validBase64s.length === 0) {
                                alert("No valid images could be read.");
                                setIsAddonPhotoLoading(false);
                                return;
                              }

                              const currentImages = editingAddon.imageUrls || (editingAddon.imageUrl ? [editingAddon.imageUrl] : []);
                              const updatedImages = [...currentImages, ...validBase64s];
                              setEditingAddon({
                                ...editingAddon,
                                imageUrl: editingAddon.imageUrl || updatedImages[0],
                                imageUrls: updatedImages,
                              });
                            } catch (err: any) {
                              console.error("Error compressing file:", err);
                              alert("Error: " + (err.message || String(err)));
                            } finally {
                              setIsAddonPhotoLoading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                        {isAddonPhotoLoading ? (
                          <div className="flex items-center gap-2 py-1 font-sans text-xs font-bold text-amber-700 uppercase tracking-wider animate-pulse">
                            <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            Compressing Photos...
                          </div>
                        ) : (
                          <label
                            htmlFor="addon-photos-picker"
                            className="cursor-pointer flex flex-col items-center justify-center gap-1 text-center w-full text-slate-600 hover:text-slate-800 py-1"
                          >
                            <Upload className="h-5 w-5 text-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-wider">Select Add-on Photos</span>
                            <span className="text-[10px] text-slate-400 font-sans">Supports multiple files, auto-compresses for quick loading</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Add-on Loaded Photos Gallery */}
                    {editingAddon.imageUrls && editingAddon.imageUrls.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                          Currently Loaded Photos ({editingAddon.imageUrls.length})
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-50 border p-3 rounded-xs font-sans">
                          {editingAddon.imageUrls.map((imgUrl: string, idx: number) => {
                            const isCover = editingAddon.imageUrl === imgUrl;
                            return (
                              <div key={idx} className="relative group bg-white border border-slate-200 rounded-sm overflow-hidden aspect-[4/3] flex items-center justify-center">
                                <img
                                  src={imgUrl}
                                  alt="Gallery thumbnail"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-row items-center justify-around p-1 z-10">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingAddon({ ...editingAddon, imageUrl: imgUrl })}
                                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2px] text-[8px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = editingAddon.imageUrls.filter((itm: string) => itm !== imgUrl);
                                      let newCover = editingAddon.imageUrl;
                                      if (isCover) {
                                        newCover = updated.length > 0 ? updated[0] : "";
                                      }
                                      setEditingAddon({
                                        ...editingAddon,
                                        imageUrl: newCover,
                                        imageUrls: updated,
                                      });
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-[2px] text-[8px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                                {isCover && (
                                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm tracking-wider shadow-sm z-20">
                                    ⭐ Cover
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-sans">
                      Description / Opis Dodatka
                    </label>
                    <textarea
                      value={editingAddon.description || ""}
                      onChange={(e) =>
                        setEditingAddon({
                          ...editingAddon,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xs text-sm h-24"
                      placeholder="Write a clear description for yacht charter clients..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      saveAddon(editingAddon);
                      setEditingAddon(null);
                    }}
                    className="w-full mt-4 py-3 bg-[#0F172A] text-white font-bold text-xs uppercase cursor-pointer transition-all hover:bg-slate-800"
                  >
                    Save Add-on Option
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
