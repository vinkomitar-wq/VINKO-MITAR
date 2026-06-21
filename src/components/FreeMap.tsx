import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Anchor,
  Map,
  Globe,
  Mountain,
  Download,
  Loader2,
  Compass,
  Plus,
  Minus,
  LocateFixed,
} from "lucide-react";
import { toPng } from "html-to-image";

interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  title: string;
  isPier?: boolean;
  isActive?: boolean;
  category?: "snorkeling" | "lagoon" | "photography" | "standard";
  keyActivity?: string;
}

interface MultiPath {
  points: { lat: number; lng: number }[];
  isActive?: boolean;
  name?: string;
  isItinerary?: boolean;
  pierId?: "coco" | "chalong" | "ao-po";
}

interface FreeMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  polylinePaths?: { lat: number; lng: number }[];
  multiPaths?: MultiPath[];
  onMarkerClick?: (id: string, isPier: boolean) => void;
  vesselId?: string;
}

// Cruising speeds of catamaran fleet in knots
const VESSEL_SPEEDS: Record<string, number> = {
  "the-best": 7.5,
  namaste: 7.0,
  "the-one": 6.5,
};

export default function FreeMap({
  center,
  zoom,
  markers,
  polylinePaths,
  multiPaths,
  onMarkerClick,
  vesselId = "the-best",
}: FreeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const timeoutIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const [mapType, setMapType] = useState<"default" | "satellite" | "terrain">(
    "default",
  );
  const [isNautical, setIsNautical] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [focusMode, setFocusMode] = useState<"route" | "region">("route");

  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const nauticalOverlayRef = useRef<L.TileLayer | null>(null);

  // Helper to safely schedule timeouts
  const safeSetTimeout = (handler: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      handler();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  };

  // Helper to clear all scheduled timeouts
  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current.clear();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize leaflet map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      markersGroupRef.current = L.featureGroup().addTo(mapRef.current);
    }

    return () => {
      clearAllTimeouts();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync nautical overlays and base tile layers dynamically based on mapType and isNautical
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove legacy base layer safely before attaching the new choice
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    if (mapType === "satellite") {
      // High-resolution Esri World Imagery
      baseLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          crossOrigin: "anonymous",
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        },
      ).addTo(map);
    } else if (mapType === "terrain") {
      // Extremely detailed contours & elevation relief on OpenTopoMap
      baseLayerRef.current = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 17,
          crossOrigin: "anonymous",
          attribution: "Map &copy; OpenTopoMap contributors, SRTM",
        },
      ).addTo(map);
    } else {
      // Standard elegant Voyager theme
      baseLayerRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          crossOrigin: "anonymous",
          attribution: "&copy; CARTO, OpenStreetMap",
        },
      ).addTo(map);
    }

    // Toggle OpenSeaMap nautical overlays
    if (!isNautical && nauticalOverlayRef.current) {
      map.removeLayer(nauticalOverlayRef.current);
      nauticalOverlayRef.current = null;
    }

    if (isNautical && !nauticalOverlayRef.current) {
      nauticalOverlayRef.current = L.tileLayer(
        "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
        {
          maxZoom: 18,
          crossOrigin: "anonymous",
          attribution: "Map data &copy; OpenSeaMap contributors",
        },
      ).addTo(map);
    }
  }, [mapType, isNautical]);

  // Sync center and zoom
  useEffect(() => {
    if (mapRef.current) {
      const hasTrajectory =
        (multiPaths &&
          multiPaths.length > 0 &&
          multiPaths.some((p) => p.points.length >= 2)) ||
        (polylinePaths && polylinePaths.length >= 2) ||
        (markers && markers.some((m) => m.isActive || m.isPier));
      if (!hasTrajectory) {
        mapRef.current.setView([center.lat, center.lng], zoom);
      }
    }
  }, [center.lat, center.lng, zoom, markers, polylinePaths, multiPaths]);

  // Sync markers & polylines
  useEffect(() => {
    const map = mapRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    // Clear old markers
    group.clearLayers();

    // Clear old polylines
    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];

    // Clear any pending animations from previous draw
    clearAllTimeouts();

    // Add new markers
    markers.forEach((m) => {
      const isSelected = m.isActive;

      // Determine POI specifics
      let markerEmoji = "";
      let markerColor = "#4F46E5";
      let markerSize = "14px";

      if (m.category === "snorkeling") {
        markerEmoji = "🤿";
        markerColor = "#06B6D4"; // cyan
        markerSize = isSelected ? "26px" : "22px";
      } else if (m.category === "lagoon") {
        markerEmoji = "🌊";
        markerColor = "#0EA5E9"; // sky blue
        markerSize = isSelected ? "26px" : "22px";
      } else if (m.category === "photography") {
        markerEmoji = "📸";
        markerColor = "#F43F5E"; // rose
        markerSize = isSelected ? "26px" : "22px";
      } else if (m.isPier) {
        if (m.id === "coco") {
          markerColor = "#EF4444"; // Red
        } else if (m.id === "chalong") {
          markerColor = "#3B82F6"; // Blue
        } else if (m.id === "ao-po") {
          markerColor = "#EAB308"; // Yellow
        } else {
          markerColor = "#EF4444"; // default
        }
        markerSize = isSelected ? "22px" : "18px";
      } else if (isSelected) {
        markerColor = "#10B981";
        markerSize = "20px";
      } else {
        markerColor = "#4F46E5";
        markerSize = "14px";
      }

      const pulseOpacity = isSelected ? "0.45" : "0.18";
      const pulseAnimation = isSelected
        ? "pulse 1.2s infinite ease-in-out"
        : "pulse 2.2s infinite ease-in-out";
      const bgOpacity = isSelected
        ? "rgba(255, 255, 255, 1)"
        : "rgba(255, 255, 255, 0.9)";

      let textColor = "#1e1b4b";
      if (m.isPier) textColor = "#b91c1c";
      else if (m.category === "snorkeling") textColor = "#0891b2";
      else if (m.category === "lagoon") textColor = "#0369a1";
      else if (m.category === "photography") textColor = "#be123c";

      const finalTextColor = isSelected ? "#10B981" : textColor;
      const borderStyle = isSelected
        ? "2px solid #10B981"
        : m.category
          ? `1px solid ${markerColor}`
          : "1px solid rgba(15, 23, 42, 0.15)";

      const innerContent = markerEmoji
        ? `<span style="font-size: 11px; line-height: 1; z-index: 12; user-select: none;">${markerEmoji}</span>`
        : `<span style="width: 4px; height: 4px; background-color: #ffffff; border-radius: 50%;"></span>`;

      const prefixLabel = m.isPier
        ? "⚓ "
        : markerEmoji
          ? `${markerEmoji} `
          : "";

      const icon = L.divIcon({
        className: "custom-leaflet-icon-container",
        html: `
          <div style="
            position: absolute;
            width: 150px;
            height: 150px;
            left: -75px;
            top: -75px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            pointer-events: none;
          ">
            <!-- Ripple/Pulse for interactive points -->
            <div style="
              position: absolute;
              width: ${parseInt(markerSize) + 8}px;
              height: ${parseInt(markerSize) + 8}px;
              background-color: ${markerColor};
              opacity: ${pulseOpacity};
              border-radius: 50%;
              animation: ${pulseAnimation};
              pointer-events: none;
            "></div>

            <div class="leaflet-interactive" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: ${markerSize};
              height: ${markerSize};
              background-color: ${markerColor};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(15, 23, 42, 0.35);
              z-index: 10;
              pointer-events: auto;
              cursor: pointer;
              transition: all 0.3s ease;
            " title="${m.title}">
              ${innerContent}
            </div>
            
            <div class="leaflet-interactive" style="
              position: absolute;
              top: calc(75px + ${parseInt(markerSize) / 2 + 5}px);
              left: 50%;
              transform: translateX(-50%);
              background-color: ${bgOpacity};
              backdrop-filter: blur(2px);
              border: ${borderStyle};
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 700;
              color: ${finalTextColor};
              font-family: inherit;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
              white-space: nowrap;
              max-width: 140px;
              overflow: hidden;
              text-overflow: ellipsis;
              z-index: 5;
              pointer-events: auto;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              ${prefixLabel}${m.title}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Fallback activities dictionary if none is provided via props
      const FALLBACK_ACTIVITIES: Record<string, string> = {
        "phi-phi-islands":
          "Snorkeling with turtles & blacktip reef sharks near Pileh Lagoon and climbing high viewpoints.",
        "ko-he-south":
          "Quiet, shallow-water snorkeling, wild great hornbill spotting, and customized beach picnics.",
        "ko-he-north-banana-beach":
          "Thrilling parasailing, sea walking, crystal sea kayaking, and water slide adventures.",
        maithon:
          "Observing the resident wild bottlenose dolphin pod and snorkeling in pristine anemone gardens.",
        "ko-racha-yai":
          "Scuba diving among amazing submerged temple statues and swimming in Patok horseshoe bay.",
        "ko-racha-noi":
          "Advanced granite boulder drift diving alongside oceanic manta rays and green sea turtles.",
        "koh-khai-nok":
          "Shallow water coral swimming and standing among friendly swarms of glassy sergeant fish.",
        prompteph:
          "Catamaran high-seas sunset viewing, visiting the historic Kanchanaphisek lighthouse and cliffs.",
        "james-bond":
          "Sea cave canoeing in Phang Nga Bay, exploring Khao Phing Kan, and Koh Panyee stilt village.",
        "koh-hong":
          "Sea kayaking into the majestic hidden salt-water emerald lagoon and ancient mangroves.",
        "koh-yao-noi":
          "Biking through quiet rice fields and exploring local wooden stilt fishing culture.",
        "koh-yao-yai":
          "Stretching on beautiful golden sandy dunes and native fishing village walkaways.",
        "naga-noi":
          "Elite guided south-sea pearl nursery and culture tour and remote swimming.",
        "naga-yai":
          "Scenic wild mangrove trails and peaceful uninhabited shore hiking.",
        "phanak-island":
          "Paddling inflatable kayaks inside dark, mystical limestone caves and cavern hongs.",
        "ko-kalu-ok":
          "Exploring hidden sea caves and shallow interior lagoons in silence via inflatable craft.",
        "similan-islands":
          "Premium global snorkeling in crystal visibility and viewing iconic volcanic balance rocks.",
        chalong: "Catamaran Southern Pier Departure Hub & Passenger Lounge.",
        "ao-po": "Cruising Gateway to Phang Nga Bay & Ao Po Pier Base.",
        coco: "Private Yacht & Beach Access Elite departure point.",
      };

      const activeOrPierId = m.id?.toLowerCase() || "";
      let markerActivity = m.keyActivity || FALLBACK_ACTIVITIES[activeOrPierId];
      if (!markerActivity) {
        if (m.category === "snorkeling") {
          markerActivity =
            "Premium shallow-water snorkeling and marine wildlife spotting.";
        } else if (m.category === "lagoon") {
          markerActivity =
            "Exploring enclosed majestic turquoise waters and limestone caves.";
        } else if (m.category === "photography") {
          markerActivity =
            "Scenic viewpoint with breathtaking vistas for premium photography.";
        } else {
          markerActivity = m.isPier
            ? "Phuket luxury yacht passenger embarking pier."
            : "Exploring scenic shores, swimming or private beach barbecue.";
        }
      }

      const popupHtml = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 2px; min-width: 170px; max-width: 240px;">
          <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 5px;">
            <span style="font-size: 15px; line-height: 1; z-index: 5; margin-top: 1px;">${markerEmoji || (m.isPier ? "⚓" : "📍")}</span>
            <div>
              <h5 style="margin: 0; font-size: 12px; font-weight: 700; color: #0F172A; line-height: 1.3;">${m.title}</h5>
              ${m.isPier ? '<span style="font-size: 8px; font-weight: 700; color: #3B82F6; background: #EFF6FF; padding: 1px 4px; border-radius: 2px; text-transform: uppercase;">Marina Hub</span>' : ""}
              ${m.category ? `<span style="font-size: 8px; font-weight: 700; color: #047857; background: #ECFDF5; padding: 1px 4px; border-radius: 2px; text-transform: uppercase;">${m.category}</span>` : ""}
            </div>
          </div>
          <div style="border-top: 1px solid rgba(15, 23, 42, 0.08); padding-top: 5px; margin-top: 4px;">
            <p style="margin: 0; font-size: 10px; line-height: 1.4; color: #475569; font-weight: 550; font-style: normal;">
              ${markerActivity}
            </p>
          </div>
        </div>
      `;

      const marker = L.marker([m.lat, m.lng], { icon });
      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -10],
        maxWidth: 240,
      });

      if (onMarkerClick && m.id) {
        marker.on("click", (e) => {
          onMarkerClick(m.id!, !!m.isPier);
          e.target.openPopup();
        });
      }
      group.addLayer(marker);
    });

    // Add polylines
    const allLatLngs: L.LatLng[] = [];

    // Include active markers or piers to ensure they fit in the bounding box
    markers.forEach((m) => {
      if (focusMode === "region" || m.isActive || m.isPier) {
        allLatLngs.push(L.latLng([m.lat, m.lng]));
      }
    });

    // Helper to trigger a stunning progress-reveal SVG path drawing animation on active path loads
    const animatePathDrawing = (
      poly: L.Polyline,
      isActive: boolean,
      isItinerary: boolean,
    ) => {
      safeSetTimeout(() => {
        if (!mapRef.current) return;
        const pathEl = poly.getElement() as SVGPathElement;
        if (!pathEl || !pathEl.parentNode) return;

        try {
          const totalLength = pathEl.getTotalLength();
          if (totalLength <= 0) return;

          // Start fully hidden
          pathEl.style.strokeDasharray = `${totalLength}`;
          pathEl.style.strokeDashoffset = `${totalLength}`;

          // Force layout reflow
          pathEl.getBoundingClientRect();

          // Smooth modern ease reveal
          const duration = isItinerary ? "2.4s" : "1.8s";
          pathEl.style.transition = `stroke-dashoffset ${duration} cubic-bezier(0.25, 1, 0.5, 1)`;
          pathEl.style.strokeDashoffset = "0";

          const speedKnots = VESSEL_SPEEDS[vesselId] || 7.0;
          // Dynamically scale animation duration inversely proportional to speed
          const animationDuration = 10 / speedKnots;

          // Post-reveal transition to live travel stream (marching flow)
          safeSetTimeout(
            () => {
              if (!mapRef.current || !poly.getElement()) return;
              if (isItinerary || isActive) {
                const currentPathEl = poly.getElement() as SVGPathElement;
                if (!currentPathEl) return;
                currentPathEl.style.transition = "none";
                currentPathEl.style.strokeDasharray = isItinerary
                  ? "10, 10"
                  : "6, 6";
                currentPathEl.style.animation = `dash-flow ${animationDuration.toFixed(2)}s linear infinite reverse`;
                currentPathEl.classList.add("route-dash-flow");
              }
            },
            isItinerary ? 2400 : 1800,
          );
        } catch (error) {
          console.error("Path travel drawing animation error:", error);
        }
      }, 40);
    };

    if (multiPaths && multiPaths.length > 0) {
      multiPaths.forEach((path) => {
        if (path.points.length < 2) return;
        const latlngs = path.points.map((p) => L.latLng([p.lat, p.lng]));
        allLatLngs.push(...latlngs);

        const isItinerary = !!path.isItinerary;
        let color = "#6366F1";
        if (isItinerary) {
          color = "#F59E0B"; // Premium warm yachting gold/amber-500
        } else if (path.isActive) {
          color = "#10B981"; // Green for active choice
        } else {
          // Alternative trajectories color based on starting pier
          if (path.pierId === "coco") {
            color = "#EF4444"; // Red
          } else if (path.pierId === "chalong") {
            color = "#3B82F6"; // Blue
          } else if (path.pierId === "ao-po") {
            color = "#EAB308"; // Yellow
          } else {
            color = "#6366F1"; // Default Indigo/Purple
          }
        }
        const weight = isItinerary ? 5.5 : path.isActive ? 4.5 : 2.5;
        const opacity = isItinerary ? 1.0 : path.isActive ? 0.95 : 0.45;
        const dashArray = isItinerary
          ? undefined
          : path.isActive
            ? undefined
            : "5, 6";

        const poly = L.polyline(latlngs, {
          color,
          weight,
          opacity,
          dashArray,
        }).addTo(map);

        if (path.name) {
          poly.bindTooltip(path.name, { sticky: true, opacity: 0.85 });
        }

        // Animate drawing for itineraries and active routes
        if (isItinerary || path.isActive) {
          animatePathDrawing(poly, path.isActive || false, isItinerary);
        }

        polylinesRef.current.push(poly);
      });
    } else if (polylinePaths && polylinePaths.length > 1) {
      const latlngs = polylinePaths.map((p) => L.latLng([p.lat, p.lng]));
      allLatLngs.push(...latlngs);

      const poly = L.polyline(latlngs, {
        color: "#10B981",
        weight: 4.5,
        opacity: 0.95,
      }).addTo(map);

      animatePathDrawing(poly, true, false);

      polylinesRef.current.push(poly);
    }

    if (allLatLngs.length > 0) {
      safeSetTimeout(() => {
        const currentMap = mapRef.current;
        if (!currentMap) return;
        try {
          currentMap.invalidateSize();
          const bounds = L.latLngBounds(allLatLngs);
          currentMap.fitBounds(bounds, {
            padding: focusMode === "region" ? [40, 40] : [22, 22],
            maxZoom: 12,
          });
        } catch (e) {
          console.warn("Could not fit bounds:", e);
        }
      }, 100);
    }
  }, [markers, polylinePaths, multiPaths, vesselId, focusMode]);

  // Automatic resize invalidator & fit bounds stabilizer
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      currentMap.invalidateSize();
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleExportMap = async () => {
    if (!containerRef.current || !mapRef.current) return;
    setIsExporting(true);

    try {
      // Short delay to allow browser thread to stabilize
      await new Promise((resolve) => {
        const id = setTimeout(() => {
          timeoutIdsRef.current.delete(id);
          resolve(null);
        }, 150);
        timeoutIdsRef.current.add(id);
      });

      if (!mapRef.current) return;

      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        backgroundColor: "#0f172a", // Premium deep canvas background
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          borderRadius: "0px",
        },
        filter: (node: any) => {
          if (node && node.classList) {
            if (
              node.classList.contains("leaflet-control-container") ||
              node.classList.contains("pointer-events-auto") ||
              (typeof node.closest === "function" &&
                node.closest(".pointer-events-auto"))
            ) {
              return false;
            }
          }
          return true;
        },
      });

      const link = document.createElement("a");
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      link.download = `phuket-yachting-route-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to export map as high-resolution PNG:", e);
      alert(
        "Could not export map view. Please try another layer or click again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const bounds = markersGroupRef.current?.getBounds();
    if (bounds && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [22, 22], maxZoom: 12 });
    } else {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  };

  return (
    <div className="relative w-full h-full group/map">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Custom Branded Zoom Controls */}
      <div className="absolute right-3 bottom-[calc(theme(spacing.3)+80px)] md:bottom-[calc(theme(spacing.3)+60px)] z-[1000] flex flex-col pointer-events-auto shadow-md rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="text-white p-2.5 transition-all active:bg-slate-800 hover:bg-slate-800 cursor-pointer flex items-center justify-center bg-transparent border-0"
          title="Zoom In"
        >
          <Plus className="h-4 w-4 text-emerald-400 font-bold" />
        </button>
        <div className="h-px w-full bg-slate-700/80 m-0" />
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="text-white p-2.5 transition-all active:bg-slate-800 hover:bg-slate-800 cursor-pointer flex items-center justify-center bg-transparent border-0"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4 text-emerald-400 font-bold" />
        </button>
        <div className="h-px w-full bg-slate-700/80 m-0" />
        <button
          type="button"
          onClick={handleRecenter}
          className="text-white p-2.5 transition-all active:bg-slate-800 hover:bg-slate-800 cursor-pointer flex items-center justify-center bg-transparent border-0"
          title="Recenter Map"
        >
          <LocateFixed className="h-4 w-4 text-emerald-400" />
        </button>
      </div>

      {/* Dynamic Cruise Speed Dashboard Indicator */}
      {vesselId && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 text-white backdrop-blur-md px-3 py-2 rounded-md border border-slate-700/50 shadow-md transition-all flex items-center gap-2.5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="font-sans">
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest leading-none mb-0.5">
              EST. FLOW VELOCITY
            </span>
            <span className="text-[11px] font-black text-white flex items-center gap-1.5 leading-none">
              🚤{" "}
              {(vesselId === "the-best"
                ? "The Best"
                : vesselId === "namaste"
                  ? "NAMASTE"
                  : "THE ONE"
              ).toUpperCase()}
              :{" "}
              <span className="text-emerald-400">
                {(VESSEL_SPEEDS[vesselId] || 7.0).toFixed(1)} kts
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Floating Map View Controls Option Panel */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-sm border border-slate-200/80 shadow-md transition-all">
        {/* Voyager View Button */}
        <button
          type="button"
          onClick={() => setMapType("default")}
          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border ${
            mapType === "default"
              ? "bg-[#0F172A] border-transparent text-white shadow-xs"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title="Standard Voyager Map View"
        >
          <Map className="h-3 w-3" />
          <span className="hidden sm:inline">Standard</span>
        </button>

        {/* Satellite View Button */}
        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border ${
            mapType === "satellite"
              ? "bg-[#10B981] border-transparent text-white shadow-xs"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title="Satellite Imagery Map View"
        >
          <Globe className="h-3 w-3" />
          <span className="hidden sm:inline">Satellite</span>
        </button>

        {/* Terrain View Button */}
        <button
          type="button"
          onClick={() => setMapType("terrain")}
          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border ${
            mapType === "terrain"
              ? "bg-amber-600 border-transparent text-white shadow-xs"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title="Topographic Terrain Map View"
        >
          <Mountain className="h-3 w-3" />
          <span className="hidden sm:inline">Terrain</span>
        </button>

        <div
          className="w-px h-4 bg-slate-205/60 mx-1 bg-slate-250 self-stretch"
          style={{ backgroundColor: "rgba(226, 232, 240, 1)" }}
        />

        {/* Nautical Overlay Toggle Button */}
        <button
          type="button"
          onClick={() => setIsNautical(!isNautical)}
          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border ${
            isNautical
              ? "bg-blue-600 border-transparent text-white shadow-xs font-extrabold"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title={
            isNautical
              ? "Disable OpenSeaMap Nautical layer"
              : "Enable OpenSeaMap Nautical layer"
          }
        >
          <Anchor
            className={`h-3 w-3 ${isNautical ? "text-white" : "text-slate-500"}`}
          />
          <span className="hidden sm:inline">Nautical</span>
        </button>

        <div
          className="w-px h-4 bg-slate-205/60 mx-1 bg-slate-250 self-stretch"
          style={{ backgroundColor: "rgba(226, 232, 240, 1)" }}
        />

        {/* Dynamic Focus Bounds toggle */}
        <button
          type="button"
          onClick={() =>
            setFocusMode(focusMode === "route" ? "region" : "route")
          }
          className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border ${
            focusMode === "region"
              ? "bg-[#0F172A] border-transparent text-emerald-400 font-extrabold"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title={
            focusMode === "region"
              ? "Switch camera to Active Route focus"
              : "Zoom camera out to show Entire Phuket Region"
          }
        >
          <Compass
            className={`h-3 w-3 ${focusMode === "region" ? "text-emerald-400 animate-spin-slow" : "text-slate-500"}`}
          />
          <span className="hidden md:inline">
            {focusMode === "region" ? "Whole Phuket" : "Route View"}
          </span>
          <span className="md:hidden inline">
            {focusMode === "region" ? "Map" : "Route"}
          </span>
        </button>

        <div
          className="w-px h-4 bg-slate-205/60 mx-1 bg-slate-250 self-stretch"
          style={{ backgroundColor: "rgba(226, 232, 240, 1)" }}
        />

        {/* High-Resolution PNG Export Trigger button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportMap}
          className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer select-none border disabled:opacity-50 disabled:cursor-not-allowed ${
            isExporting
              ? "bg-emerald-700 border-transparent text-white shadow-xs font-black animate-pulse"
              : "bg-emerald-50/70 border-emerald-200/80 text-emerald-700 hover:bg-[#10B981] hover:text-white"
          }`}
          title="Download HQ Offline Route Map PNG"
        >
          {isExporting ? (
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          ) : (
            <Download className="h-3 w-3 text-emerald-600 group-hover:text-white" />
          )}
          <span>{isExporting ? "Exporting..." : "Download HQ"}</span>
        </button>
      </div>
    </div>
  );
}
