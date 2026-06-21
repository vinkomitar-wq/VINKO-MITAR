import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useCurrency } from "../CurrencyContext";
import { Edit2, Save, Trash2, Plus, Tag, Anchor, MapPin } from "lucide-react";
import { CATAMARANS } from "../data";
import { DESTINATIONS } from "../data";

export const STANDARD_EXTRAS = [
  {
    key: "waterSlider",
    label: "Inflatable Sea Water Slider",
    defaultPrice: 4500,
  },
  {
    key: "inflatablePool",
    label: "Inflatable Ocean Swimming Pool",
    defaultPrice: 5000,
  },
  { key: "cabinCount", label: "Private Cabin Access", defaultPrice: 3000 },
  { key: "gasBBQ", label: "Gas Barbecue Grill", defaultPrice: 2000 },
  { key: "charcoalBBQ", label: "Charcoal Barbecue Grill", defaultPrice: 2500 },
  { key: "extraWatermelon", label: "Extra Watermelon", defaultPrice: 200 },
  { key: "extraSnack", label: "Extra Snack Plates", defaultPrice: 300 },
  { key: "extraPineapple", label: "Extra Pineapple", defaultPrice: 200 },
  {
    key: "karaoke",
    label: "On-Board Karaoke Entertainment System",
    defaultPrice: 3500,
  },
  {
    key: "longtailBoat",
    label: "Private Longtail Boat Exploration",
    defaultPrice: 4000,
  },
  {
    key: "mayaBayTicketAndLongtail",
    label: "Maya Bay Access Tickets & Longtail Boat",
    defaultPrice: 6000,
  },
  {
    key: "jamesBondTicket",
    label: "James Bond Island Tickets (per guest)",
    defaultPrice: 500,
  },
  { key: "jetski", label: "Jet Ski Tour (per unit)", defaultPrice: 2500 },
  {
    key: "minibusTransfer",
    label: "Roundtrip Minibus Transfer",
    defaultPrice: 1800,
  },
  { key: "guide", label: "Professional Host Guide", defaultPrice: 3000 },
  {
    key: "fishingGear",
    label: "Premium Fishing Gear (per rod)",
    defaultPrice: 500,
  },
  { key: "bartender", label: "Private Bartender Service", defaultPrice: 3500 },
  {
    key: "photographer",
    label: "Professional Photographer",
    defaultPrice: 5500,
  },
  { key: "droneVideographer", label: "Drone Videographer", defaultPrice: 6500 },
  { key: "djService", label: "Professional DJ Service", defaultPrice: 8000 },
];

export default function AgentPricesTab() {
  const { currentAgent, updateProfile } = useAgent();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [activeTab, setActiveTab] = useState<"routes" | "extras">("routes");
  const [selectedVesselId, setSelectedVesselId] = useState<string>(
    CATAMARANS[0]?.id || "",
  );

  const [routePrices, setRoutePrices] = useState<Record<string, number>>({});
  const [standardExtras, setStandardExtras] = useState<Record<string, number>>(
    {},
  );
  const [extraServices, setExtraServices] = useState<
    { id: string; name: string; price: number; unit?: string }[]
  >([]);

  const [editingTargetId, setEditingTargetId] = useState<string>("main");

  useEffect(() => {
    if (editingTargetId === "main") {
      setRoutePrices(currentAgent?.customPricing?.routes || {});
      setStandardExtras(currentAgent?.customPricing?.standardExtras || {});
      setExtraServices(currentAgent?.customPricing?.extraServices || []);
    } else {
      const coagent = (currentAgent?.coagents || []).find(
        (c) => c.id === editingTargetId,
      );
      if (coagent) {
        setRoutePrices(coagent.customPricing?.routes || {});
        setStandardExtras(coagent.customPricing?.standardExtras || {});
        setExtraServices(coagent.customPricing?.extraServices || []);
      }
    }
  }, [currentAgent, editingTargetId]);

  const handleSave = async () => {
    if (!currentAgent?.id) return;
    setLoading(true);
    setSuccessMsg("");

    const updatedPricing = {
      routes: routePrices,
      standardExtras: standardExtras,
      extraServices: extraServices,
    };

    let updatePayload: any = {};
    if (editingTargetId === "main") {
      updatePayload = { customPricing: updatedPricing };
    } else {
      const coagentsList = currentAgent.coagents || [];
      const updatedCoagents = coagentsList.map((c) =>
        c.id === editingTargetId ? { ...c, customPricing: updatedPricing } : c,
      );
      updatePayload = { coagents: updatedCoagents };
    }

    try {
      if (currentAgent.email) {
        await setDoc(doc(db, "agents", currentAgent.id), updatePayload, {
          merge: true,
        });
      }

      await updateProfile(updatePayload);
      setSuccessMsg("Custom prices successfully saved!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save custom prices.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraService = () => {
    const newService = {
      id: `ext_${Date.now()}`,
      name: "New Custom Service",
      price: 0,
      unit: "charter",
    };
    setExtraServices([...extraServices, newService]);
  };

  const updateExtraService = (id: string, field: string, value: any) => {
    setExtraServices(
      extraServices.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const deleteExtraService = (id: string) => {
    setExtraServices(extraServices.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-white rounded p-6 shadow-sm border border-slate-200 min-h-[500px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 relative">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#0F172A] tracking-tight">
            Custom Prices
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Set unique pricing for your clients. These values override standard
            public rates in your proposals.
          </p>
          {currentAgent?.coagents && currentAgent.coagents.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                Editing pricing for:
              </span>
              <select
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-emerald-500"
                value={editingTargetId}
                onChange={(e) => setEditingTargetId(e.target.value)}
              >
                <option value="main">
                  My Main Broker Rates ({currentAgent.name})
                </option>
                {currentAgent.coagents.map((co) => (
                  <option key={co.id} value={co.id}>
                    Co-Agent: {co.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xs font-bold uppercase tracking-wider text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {successMsg && (
          <div className="absolute -bottom-8 right-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {successMsg}
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${activeTab === "routes" ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Routes & Vessels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("extras")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${activeTab === "extras" ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
        >
          <Tag className="w-3.5 h-3.5" />
          Extras & Addons
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "routes" && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 block border-b border-slate-100 pb-2">
              Vessel & Destination Combinations
            </h3>

            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                Select Vessel to Configure Routes Pricing
              </label>
              <div className="flex flex-wrap gap-2">
                {CATAMARANS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVesselId(v.id)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${selectedVesselId === v.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {DESTINATIONS.map((dest) => {
                const key = `${selectedVesselId}_${dest.id}`;
                const isCustom = routePrices[key] !== undefined;
                const value = isCustom ? routePrices[key] : "";

                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded group gap-2"
                  >
                    <div className="flex-1">
                      <span
                        className="text-xs font-bold text-slate-800 block truncate"
                        title={dest.name}
                      >
                        {dest.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                        {isCustom ? "Price Configured" : "Not Set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        THB
                      </span>
                      <input
                        type="number"
                        value={value}
                        placeholder="0"
                        className="w-24 text-sm font-bold border border-slate-300 rounded px-2 py-1 text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") {
                            const newVals = { ...routePrices };
                            delete newVals[key];
                            setRoutePrices(newVals);
                          } else {
                            setRoutePrices((prev) => ({
                              ...prev,
                              [key]: parseInt(v) || 0,
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "extras" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 block border-b border-slate-100 pb-2">
                Standard Booking Step 2 Extras
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {STANDARD_EXTRAS.map((extra) => {
                  const isCustom = standardExtras[extra.key] !== undefined;
                  const value = isCustom ? standardExtras[extra.key] : "";

                  return (
                    <div
                      key={extra.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded group gap-2"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800 block">
                          {extra.label}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                          {isCustom ? "Price Configured" : "Not Set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium">
                          THB
                        </span>
                        <input
                          type="number"
                          value={value}
                          placeholder="0"
                          className="w-24 text-sm font-bold border border-slate-300 rounded px-2 py-1 text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              const newVals = { ...standardExtras };
                              delete newVals[extra.key];
                              setStandardExtras(newVals);
                            } else {
                              setStandardExtras((prev) => ({
                                ...prev,
                                [extra.key]: parseInt(v) || 0,
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Custom Broker Extra Services
                </h3>
                <button
                  onClick={handleAddExtraService}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Service
                </button>
              </div>
              {extraServices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-sans border-2 border-dashed border-slate-200 rounded">
                  No custom extra services added yet. Click above to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {extraServices.map((service) => (
                    <div
                      key={service.id}
                      className="grid grid-cols-12 items-center gap-3 p-3 bg-white border border-slate-200 rounded shadow-sm"
                    >
                      <div className="col-span-12 sm:col-span-6">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) =>
                            updateExtraService(
                              service.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full border-b border-slate-300 focus:border-emerald-500 focus:outline-none bg-transparent text-sm font-bold text-slate-800 px-1 py-1"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Price (THB)
                        </label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) =>
                            updateExtraService(
                              service.id,
                              "price",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full border-b border-slate-300 focus:border-emerald-500 focus:outline-none bg-transparent text-sm font-bold text-slate-800 px-1 py-1"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Unit
                        </label>
                        <select
                          value={service.unit || "charter"}
                          onChange={(e) =>
                            updateExtraService(
                              service.id,
                              "unit",
                              e.target.value,
                            )
                          }
                          className="w-full border-b border-slate-300 focus:border-emerald-500 focus:outline-none bg-transparent text-sm font-bold text-slate-800 px-1 py-1"
                        >
                          <option value="charter">Per Charter</option>
                          <option value="guest">Per Guest</option>
                          <option value="day">Per Day</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-end justify-center pb-1">
                        <button
                          onClick={() => deleteExtraService(service.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
