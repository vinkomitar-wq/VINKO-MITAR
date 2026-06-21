import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FreeMap from "./FreeMap";
import {
  Compass,
  Clock,
  Ship,
  MapPin,
  ChevronRight,
  Award,
  Flame,
  Star,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { DESTINATIONS, PIERS } from "../data";
import { COMPOSITE_ROUTES } from "./RouteMapModal";

export const destCoords: Record<string, { lat: number; lng: number }> = {
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
  "ko-he-ko-racha-yai-prompteph": { lat: 7.7385, lng: 98.3731 },
  "maithon-ko-he": { lat: 7.7612, lng: 98.4807 },
  "maithon-ko-racha-yai": { lat: 7.7612, lng: 98.4807 },
  "ko-racha-yai-ko-racha-noi": { lat: 7.6042, lng: 98.3688 },
  "koh-khai-nok-maithon": { lat: 7.8931, lng: 98.5332 },
  "ko-he-prompteph": { lat: 7.7385, lng: 98.3731 },
  "ko-he-ko-racha-yai": { lat: 7.7385, lng: 98.3731 },
  "ko-he-maithon-prompteph": { lat: 7.7385, lng: 98.3731 },
  "coco-coral": { lat: 7.7385, lng: 98.3731 },
  "coco-maithon": { lat: 7.7612, lng: 98.4807 },
  "coco-maithon-ko-he": { lat: 7.7612, lng: 98.4807 },
  "coco-racha-yai": { lat: 7.6042, lng: 98.3688 },
  "coco-khai-nok": { lat: 7.8931, lng: 98.5332 },
  "coco-phromthep": { lat: 7.7587, lng: 98.304 },
  "koh-phi-phi": { lat: 7.7405, lng: 98.7782 },
  "phanak-island": { lat: 8.203, lng: 98.487 },
  "koh-yao-noi": { lat: 8.118, lng: 98.618 },
  "naga-noi": { lat: 8.037, lng: 98.4475 },
  "naga-yai": { lat: 8.0545, lng: 98.46 },
  "ko-kalu-ok": { lat: 8.2163, lng: 98.4831 },
  "koh-yao-yai-koh-hong-james-bond": { lat: 8.0792, lng: 98.679 },
};

export const getPhysicalIsland = (id: string): string => {
  const norm = id.toLowerCase();
  if (norm.includes("phi-phi") || norm.includes("phiphi"))
    return "phi-phi-islands";
  if (
    norm.includes("coral") ||
    norm.includes("ko-he") ||
    norm.includes("banana-beach") ||
    norm.includes("coco-coral")
  )
    return "ko-he-south";
  if (norm.includes("maithon") || norm.includes("mai-thon")) return "maithon";
  if (norm.includes("racha-yai")) return "ko-racha-yai";
  if (norm.includes("racha-noi")) return "ko-racha-noi";
  if (
    norm.includes("khai-nok") ||
    norm.includes("koh-khai") ||
    norm.includes("khai")
  )
    return "koh-khai-nok";
  if (norm.includes("prompteph") || norm.includes("phromthep"))
    return "prompteph";
  if (norm.includes("james-bond") || norm.includes("jamesbond"))
    return "james-bond";
  if (norm.includes("hong")) return "koh-hong";
  if (norm.includes("yao-yai")) return "koh-yao-yai";
  if (norm.includes("yao-noi")) return "koh-yao-noi";
  if (norm.includes("naga-noi")) return "naga-noi";
  if (norm.includes("naga-yai")) return "naga-yai";
  if (norm.includes("ko-kalu-ok")) return "ko-kalu-ok";
  if (norm.includes("phanak")) return "phanak-island";
  if (norm.includes("similan")) return "similan-islands";
  return id;
};

const calculateDistanceNM = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * 3440.065; // Earth radius in Nautical Miles
};

const getRoutePointsForPier = (
  routeId: string,
  pierId: string,
  endPierId?: string,
): string[] => {
  const finalEndPierId = endPierId || pierId;
  const basePoints = COMPOSITE_ROUTES[routeId];
  if (basePoints && basePoints.length > 0) {
    const first = basePoints[0];
    const pts =
      first === "chalong" || first === "coco" || first === "ao-po"
        ? [pierId, ...basePoints.slice(1)]
        : [pierId, ...basePoints];

    const last = pts[pts.length - 1];
    if (last === "chalong" || last === "coco" || last === "ao-po") {
      pts[pts.length - 1] = finalEndPierId;
    } else {
      pts.push(finalEndPierId);
    }
    return pts;
  }
  const destObj = DESTINATIONS.find((d) => d.id === routeId);
  if (destObj) {
    return [pierId, destObj.id, finalEndPierId];
  }
  return [pierId, routeId, finalEndPierId];
};

const getBeautifulRouteName = (routeId: string, pierId: string): string => {
  const d = DESTINATIONS.find((x) => x.id === routeId);
  const pierLabel =
    pierId === "coco"
      ? "Coco Pier"
      : pierId === "ao-po"
        ? "Ao Po Pier"
        : "Chalong Pier";

  if (!d) return `Route from ${pierLabel}`;

  const basePoints = COMPOSITE_ROUTES[routeId];
  if (basePoints && basePoints.length > 2) {
    const islands = basePoints.slice(1).map((ptId) => {
      const isld = DESTINATIONS.find((x) => x.id === ptId);
      return isld
        ? isld.name.replace(/ Island.*$/, "").replace(/ \(.*$/, "")
        : ptId;
    });
    const uniqueIslands = Array.from(new Set(islands));
    return `Combined: ${uniqueIslands.join(" • ")} from ${pierLabel}`;
  }

  const cleanName = d.name
    .replace(/ from (Chalong|Coco|Ao Po) Pier/gi, "")
    .replace(/ \(Koh He\)/gi, "");
  return `${cleanName} (from ${pierLabel})`;
};

export interface SpecialPOI {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: "snorkeling" | "lagoon" | "photography";
  description: string;
}

export const SPECIAL_POIS: SpecialPOI[] = [
  {
    id: "poi-ao-sane",
    title: "Ao Sane Beach Snorkeling Reef",
    lat: 7.778,
    lng: 98.298,
    category: "snorkeling",
    description:
      "A vibrant shallow reef with abundant marine life, lionfish, and parrotfish right off a secret sandy beach.",
  },
  {
    id: "poi-banana-beach",
    title: "Banana Beach Snorkel Lagoon",
    lat: 7.7455,
    lng: 98.3768,
    category: "snorkeling",
    description:
      "Incredibly clear waters on Coral Island, superb for beginners with thousands of friendly sergeants.",
  },
  {
    id: "poi-racha-coral",
    title: "Racha Yai Coral Gardens",
    lat: 7.61,
    lng: 98.372,
    category: "snorkeling",
    description:
      "Deep visibility dive and snorkel site boasting beautiful staghorn corals and sea turtles.",
  },
  {
    id: "poi-maithon-dolphin",
    title: "Maithon Dolphin Reef Wall",
    lat: 7.765,
    lng: 98.485,
    category: "snorkeling",
    description:
      "A protected reef slope where a resident pod of wild bottlenose dolphins is frequently spotted playing.",
  },
  {
    id: "poi-shark-point",
    title: "Shark Point Sanctuary",
    lat: 7.798,
    lng: 98.615,
    category: "snorkeling",
    description:
      "An open sea marine park with gorgeous soft corals, anemones, and harmless leopard sharks.",
  },
  {
    id: "poi-pileh-lagoon",
    title: "Pileh Lagoon (Emerald Creek)",
    lat: 7.6812,
    lng: 98.778,
    category: "lagoon",
    description:
      "A majestic enclosed emerald-green lagoon bordered by towering limestone cliffs.",
  },
  {
    id: "poi-phanak-lagoon",
    title: "Phanak Hidden Sea-Cave Lagoon",
    lat: 8.2035,
    lng: 98.487,
    category: "lagoon",
    description:
      "Only accessible via inflatable kayak during low tide through a pitch-black stalactite honga tunnel.",
  },
  {
    id: "poi-hong-lagoon",
    title: "Hong Island Blue Salt-Lagoon",
    lat: 8.082,
    lng: 98.6795,
    category: "lagoon",
    description:
      "A spectacular hidden room inside Koh Hong with crystal tidal waters and wild mangrove trees.",
  },
  {
    id: "poi-naka-lagoon",
    title: "Naka Secret Emerald Inlet",
    lat: 8.062,
    lng: 98.462,
    category: "lagoon",
    description:
      "A peaceful, secluded inlet popular for quiet swimming away from major ferry channels.",
  },
  {
    id: "poi-maya-overlook",
    title: "Maya Bay Scenic Overlook",
    lat: 7.6766,
    lng: 98.765,
    category: "photography",
    description:
      "The world-famous view of the pristine white sand bay framed by iconic karst cliffs.",
  },
  {
    id: "poi-samet-nangshe",
    title: "Samet Nangshe Viewpoint",
    lat: 8.2404,
    lng: 98.4452,
    category: "photography",
    description:
      "Unrivaled 180-degree panoramic vista across the mystical misty karst islands of Phang Nga Bay.",
  },
  {
    id: "poi-promthep-sunset",
    title: "Promthep Cape Golden Hour Point",
    lat: 7.762,
    lng: 98.3045,
    category: "photography",
    description:
      "Phuket's absolute premier sunset location with palm sweeps, sea-breezes, and dramatic rocky edges.",
  },
  {
    id: "poi-windmill-cliff",
    title: "Windmill Cliff Ya Nui Vista",
    lat: 7.7695,
    lng: 98.3055,
    category: "photography",
    description:
      "An elevated coastal bluff capturing Yanui beach and Koh Man island in stunning twilight angles.",
  },
];

export default function ExcursionMap({
  onSelectRoute,
  informationalOnly = false,
}: {
  onSelectRoute?: (destination: any) => void;
  informationalOnly?: boolean;
}) {
  const { language } = useLanguage();
  const [selectedRouteId, setSelectedRouteId] =
    useState<string>("custom-route");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activePierFilter, setActivePierFilter] = useState<string | null>(null);
  const [activeEndPierFilter, setActiveEndPierFilter] = useState<string | null>(
    null,
  );
  const [activeIslandFilter, setActiveIslandFilter] = useState<string | null>(
    null,
  );

  const clearRoute = () => {
    setActiveIslandFilter(null);
    setActivePierFilter(null);
    setActiveEndPierFilter(null);
    setSearchTerm("");
    setSelectedRouteId("custom-route");
    setBookingDestinations([]);
    setBookingStartPier("chalong");
    setBookingEndPier("chalong");

    // Dispatch event to clear the booking route so other components sync
    window.dispatchEvent(
      new CustomEvent("add-destination-to-route", {
        detail: {
          destinationIds: [],
          startPierId: "chalong",
          endPierId: "chalong",
          preventStepChange: true,
        },
      }),
    );
  };

  const isSyncingFromItineraryRef = useRef(false);

  // Listen to Itinerary tab changes and update map filters
  useEffect(() => {
    const handleItineraryTabChanged = (e: CustomEvent) => {
      const tab = e.detail;
      isSyncingFromItineraryRef.current = true;
      if (tab === "all") {
        setActivePierFilter(null);
        setActiveIslandFilter(null);
      } else if (tab === "chalong" || tab === "ao-po" || tab === "coco") {
        setActivePierFilter(tab);
        setActiveIslandFilter(null);
      } else if (tab === "sequence") {
        setSelectedRouteId("custom-route");
        setActivePierFilter(null);
        setActiveIslandFilter(null);
      } else if (tab === "ai") {
        setActivePierFilter(null);
        setActiveIslandFilter(null);
      }
      setTimeout(() => {
        isSyncingFromItineraryRef.current = false;
      }, 50);
    };
    window.addEventListener(
      "itinerary-tab-changed",
      handleItineraryTabChanged as EventListener,
    );
    return () => {
      window.removeEventListener(
        "itinerary-tab-changed",
        handleItineraryTabChanged as EventListener,
      );
    };
  }, []);

  // Emit map pier changes to Keep Phuket Destination guide synchronized
  useEffect(() => {
    if (isSyncingFromItineraryRef.current) return;
    window.dispatchEvent(
      new CustomEvent("map-pier-changed", {
        detail: activePierFilter || "all",
      }),
    );
  }, [activePierFilter]);

  const [bookingDestinations, setBookingDestinations] = useState<string[]>([]);
  const [bookingStartPier, setBookingStartPier] = useState<string>("chalong");
  const [bookingEndPier, setBookingEndPier] = useState<string>("chalong");
  const [showSnorkeling, setShowSnorkeling] = useState<boolean>(true);
  const [showLagoons, setShowLagoons] = useState<boolean>(true);
  const [showViewpoints, setShowViewpoints] = useState<boolean>(true);
  const [selectedPOI, setSelectedPOI] = useState<SpecialPOI | null>(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  const isSyncingFromBookingRef = useRef(false);
  const [currentVesselId, setCurrentVesselId] = useState<string>("the-best");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Exit full screen with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Synchronize vessel selection from booking/other helpers
  useEffect(() => {
    const handleVesselSync = (e: CustomEvent) => {
      const vId = e.detail;
      if (vId && typeof vId === "string") {
        setCurrentVesselId(vId);
      }
    };
    window.addEventListener(
      "booking-vessel-changed",
      handleVesselSync as EventListener,
    );
    return () => {
      window.removeEventListener(
        "booking-vessel-changed",
        handleVesselSync as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleBookingDestinationsChanged = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;

      let newDests: string[] = [];
      let startPier = bookingStartPier;
      let endPier = bookingEndPier;

      if (Array.isArray(detail)) {
        newDests = detail;
      } else if (
        detail.destinationIds &&
        Array.isArray(detail.destinationIds)
      ) {
        newDests = detail.destinationIds;
        if (detail.startPierId) startPier = detail.startPierId;
        if (detail.endPierId !== undefined) endPier = detail.endPierId;
      } else if (detail.destinationId) {
        newDests = [detail.destinationId];
      } else if (typeof detail === "object" && detail !== null) {
        if (Array.isArray(detail.destinations)) {
          newDests = detail.destinations;
        }
        if (detail.startPierId) {
          startPier = detail.startPierId;
        }
        if (detail.endPierId !== undefined) {
          endPier = detail.endPierId;
        }
      } else {
        return;
      }

      setBookingDestinations(newDests);
      setBookingStartPier(startPier);
      setBookingEndPier(endPier);

      if (newDests.length > 0 && selectedRouteId !== "custom-route") {
        isSyncingFromBookingRef.current = true;
        const matchedRoute = DESTINATIONS.find((d) => {
          if (d.id === "custom-route") return false;
          const pts = COMPOSITE_ROUTES[d.id] || [d.recommendedPierId, d.id];
          const routeIslands = pts.filter(
            (id) => id !== "chalong" && id !== "ao-po" && id !== "coco",
          );

          if (routeIslands.length !== newDests.length) return false;
          const sortedIslands = [...routeIslands].sort();
          const sortedNewDests = [...newDests].sort();
          return sortedIslands.every((id, idx) => id === sortedNewDests[idx]);
        });

        if (matchedRoute) {
          const isComp = !!COMPOSITE_ROUTES[matchedRoute.id];
          const routeIslands = isComp
            ? COMPOSITE_ROUTES[matchedRoute.id].filter(
                (id) => id !== "chalong" && id !== "ao-po" && id !== "coco",
              )
            : [matchedRoute.id];
          const exactOrderMatch =
            routeIslands.length === newDests.length &&
            routeIslands.every((id, idx) => id === newDests[idx]);

          if (exactOrderMatch) {
            if (matchedRoute.id !== selectedRouteId) {
              setSelectedRouteId(matchedRoute.id);
            } else {
              isSyncingFromBookingRef.current = false;
            }
          } else {
            if (selectedRouteId !== "custom-route") {
              setSelectedRouteId("custom-route");
            } else {
              isSyncingFromBookingRef.current = false;
            }
          }
        } else {
          if (selectedRouteId !== "custom-route") {
            setSelectedRouteId("custom-route");
          } else {
            isSyncingFromBookingRef.current = false;
          }
        }
      } else {
        if (selectedRouteId !== "custom-route") {
          setSelectedRouteId("custom-route");
        }
      }
    };
    window.addEventListener(
      "booking-destinations-changed",
      handleBookingDestinationsChanged as EventListener,
    );
    window.addEventListener(
      "add-destination-to-route",
      handleBookingDestinationsChanged as EventListener,
    );
    return () => {
      window.removeEventListener(
        "booking-destinations-changed",
        handleBookingDestinationsChanged as EventListener,
      );
      window.removeEventListener(
        "add-destination-to-route",
        handleBookingDestinationsChanged as EventListener,
      );
    };
  }, [selectedRouteId]);

  useEffect(() => {
    if (!selectedRouteId) return;
    if (isSyncingFromBookingRef.current) {
      isSyncingFromBookingRef.current = false;
      return;
    }
    if (informationalOnly) {
      return;
    }
    const isComp = !!COMPOSITE_ROUTES[selectedRouteId];
    const routeIslands = isComp
      ? COMPOSITE_ROUTES[selectedRouteId].filter(
          (id) => id !== "chalong" && id !== "ao-po" && id !== "coco",
        )
      : [selectedRouteId];

    const validDests = routeIslands.filter(
      (id) =>
        id !== "custom-route" &&
        id !== "the-best" &&
        id !== "namaste" &&
        id !== "the-one",
    );
    if (validDests.length > 0) {
      const dest = DESTINATIONS.find((d) => d.id === selectedRouteId);
      const pierId = activePierFilter || dest?.recommendedPierId || "chalong";

      window.dispatchEvent(
        new CustomEvent("cruise-trajectory-selected", {
          detail: { destinationIds: validDests },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("add-destination-to-route", {
          detail: {
            destinationIds: validDests,
            pierId: pierId,
            startPierId: pierId,
            endPierId: activeEndPierFilter || pierId,
          },
        }),
      );
    }
  }, [
    selectedRouteId,
    activePierFilter,
    activeEndPierFilter,
    informationalOnly,
  ]);

  const selectedDestination = useMemo(() => {
    const dest =
      DESTINATIONS.find((d) => d.id === selectedRouteId) ||
      DESTINATIONS.find((d) => d.id === "phi-phi-islands")!;
    if (onSelectRoute) {
      setTimeout(() => onSelectRoute(dest), 0);
    }
    return dest;
  }, [selectedRouteId, onSelectRoute]);

  const routePoints = useMemo(() => {
    const parentPier =
      activePierFilter || selectedDestination.recommendedPierId;
    const ids = getRoutePointsForPier(selectedRouteId, parentPier);
    return ids
      .map((id) => {
        const coord = destCoords[id];
        if (!coord) return null;
        return {
          lat: coord.lat,
          lng: coord.lng,
        };
      })
      .filter(Boolean) as { lat: number; lng: number }[];
  }, [selectedRouteId, selectedDestination, activePierFilter]);

  const multiPaths = useMemo(() => {
    const list: {
      points: { lat: number; lng: number }[];
      isActive: boolean;
      name: string;
      isItinerary?: boolean;
      pierId?: "coco" | "chalong" | "ao-po";
    }[] = [];

    const getCoordsList = (pointIds: string[]) => {
      return pointIds.map((id) => destCoords[id]).filter(Boolean) as {
        lat: number;
        lng: number;
      }[];
    };

    if (activeIslandFilter) {
      const matchingRoutes = DESTINATIONS.filter((d) => {
        if (d.id === "custom-route") return false;
        const pts = COMPOSITE_ROUTES[d.id] || [d.recommendedPierId, d.id];
        const normPts = pts.map(getPhysicalIsland);
        return (
          normPts.includes(activeIslandFilter) ||
          getPhysicalIsland(d.id) === activeIslandFilter
        );
      });

      matchingRoutes.forEach((d) => {
        const aoPoPts = getRoutePointsForPier(d.id, "ao-po");
        const aoPoCoords = getCoordsList(aoPoPts);
        if (aoPoCoords.length > 1) {
          const isSelected =
            d.id === selectedRouteId &&
            selectedDestination.recommendedPierId === "ao-po";
          list.push({
            points: aoPoCoords,
            isActive: isSelected,
            name: getBeautifulRouteName(d.id, "ao-po"),
            pierId: "ao-po",
          });
        }

        const chalongPts = getRoutePointsForPier(d.id, "chalong");
        const chalongCoords = getCoordsList(chalongPts);
        if (chalongCoords.length > 1) {
          const isSelected =
            d.id === selectedRouteId &&
            selectedDestination.recommendedPierId === "chalong";
          list.push({
            points: chalongCoords,
            isActive: isSelected,
            name: getBeautifulRouteName(d.id, "chalong"),
            pierId: "chalong",
          });
        }

        const cocoPts = getRoutePointsForPier(d.id, "coco");
        const cocoCoords = getCoordsList(cocoPts);
        if (cocoCoords.length > 1) {
          const isSelected =
            d.id === selectedRouteId &&
            (selectedDestination.recommendedPierId === "coco" ||
              activePierFilter === "coco");
          list.push({
            points: cocoCoords,
            isActive: isSelected,
            name: getBeautifulRouteName(d.id, "coco"),
            pierId: "coco",
          });
        }
      });
    } else if (activePierFilter) {
      DESTINATIONS.filter(
        (d) =>
          d.id !== "custom-route" && d.recommendedPierId === activePierFilter,
      ).forEach((d) => {
        const pts = getRoutePointsForPier(d.id, activePierFilter);
        const coords = getCoordsList(pts);
        if (coords.length > 1) {
          const isSelected = d.id === selectedRouteId;
          list.push({
            points: coords,
            isActive: isSelected,
            name: getBeautifulRouteName(d.id, activePierFilter),
            pierId: activePierFilter as any,
          });
        }
      });
    } else {
      const piersToCompare = Array.from(
        new Set(["chalong", "coco", selectedDestination.recommendedPierId]),
      );

      for (const pId of piersToCompare) {
        if (!pId) continue;
        const pts = getRoutePointsForPier(selectedRouteId, pId);
        const coords = getCoordsList(pts);
        if (coords.length > 1) {
          list.push({
            points: coords,
            isActive: selectedDestination.recommendedPierId === pId,
            name: getBeautifulRouteName(selectedRouteId, pId),
            pierId: pId as any,
          });
        }
      }

      const activePts = COMPOSITE_ROUTES[selectedRouteId] || [
        selectedDestination.recommendedPierId,
        selectedDestination.id,
      ];
      const targetIsland = getPhysicalIsland(activePts[activePts.length - 1]);

      if (targetIsland && targetIsland !== "custom-route") {
        const alternativeRoutes = DESTINATIONS.filter((d) => {
          if (d.id === "custom-route" || d.id === selectedRouteId) return false;
          const isComp =
            !!COMPOSITE_ROUTES[d.id] && COMPOSITE_ROUTES[d.id].length > 2;
          if (!isComp) return false;
          const pts = COMPOSITE_ROUTES[d.id];
          const normPts = pts.map(getPhysicalIsland);
          return (
            normPts.includes(targetIsland) ||
            getPhysicalIsland(d.id) === targetIsland
          );
        });

        alternativeRoutes.forEach((d) => {
          ["chalong", "coco"].forEach((pId) => {
            const pts = getRoutePointsForPier(d.id, pId);
            const ptsCoords = getCoordsList(pts);
            if (ptsCoords.length > 1) {
              list.push({
                points: ptsCoords,
                isActive: false,
                name: getBeautifulRouteName(d.id, pId),
                pierId: pId as any,
              });
            }
          });
        });
      }
    }

    const seen = new Set<string>();
    const uniqueList: typeof list = [];
    for (const item of list) {
      if (item.points.length < 2) continue;
      const key = item.points
        .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
        .join("|");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      } else if (item.isActive) {
        const idx = uniqueList.findIndex(
          (u) =>
            u.points
              .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
              .join("|") === key,
        );
        if (idx !== -1) {
          uniqueList[idx] = item;
        }
      }
    }

    // Custom Itinerary Route Plotting
    if (bookingDestinations && bookingDestinations.length > 0) {
      const itinPoints: { lat: number; lng: number }[] = [];

      // Start pier coordinate
      const startingPier = bookingStartPier || "chalong";
      const pierCoord = destCoords[startingPier];
      if (pierCoord) {
        itinPoints.push(pierCoord);
      }

      bookingDestinations.forEach((bId) => {
        const compPts = COMPOSITE_ROUTES[bId];
        if (compPts && compPts.length > 0) {
          compPts.forEach((pt) => {
            if (pt === "chalong" || pt === "ao-po" || pt === "coco") return;
            const physical = getPhysicalIsland(pt);
            const coord = destCoords[physical] || destCoords[pt];
            if (
              coord &&
              !itinPoints.some(
                (p) => p.lat === coord.lat && p.lng === coord.lng,
              )
            ) {
              itinPoints.push(coord);
            }
          });
        } else {
          const physical = getPhysicalIsland(bId);
          const coord = destCoords[physical] || destCoords[bId];
          if (
            coord &&
            !itinPoints.some((p) => p.lat === coord.lat && p.lng === coord.lng)
          ) {
            itinPoints.push(coord);
          }
        }
      });

      // End pier coordinate
      const endingPier = bookingEndPier || startingPier;
      if (endingPier && endingPier !== startingPier) {
        const endPierCoord = destCoords[endingPier];
        if (endPierCoord) {
          itinPoints.push(endPierCoord);
        }
      } else if (startingPier && itinPoints.length >= 2) {
        // Loop back
        const pierCoord = destCoords[startingPier];
        if (pierCoord) {
          itinPoints.push(pierCoord);
        }
      }

      if (itinPoints.length >= 2) {
        // If Custom Route is active, we prefer showing it at the top and maybe hide others
        const itTitle = `⭐ MY ITINERARY: ${bookingDestinations.length} Islands Connected 🗺️`;
        const itineraryItem = {
          points: itinPoints,
          isActive: true,
          name: itTitle,
          isItinerary: true,
        };

        if (selectedRouteId === "custom-route") {
          // In custom route mode, we only want to see our itinerary
          return [itineraryItem];
        } else {
          uniqueList.unshift(itineraryItem);
        }
      }
    }

    return uniqueList;
  }, [
    selectedRouteId,
    selectedDestination,
    activeIslandFilter,
    activePierFilter,
    bookingDestinations,
    bookingStartPier,
    bookingEndPier,
  ]);

  const bookingPhysicalIslands = useMemo(() => {
    const included = new Set<string>();
    bookingDestinations.forEach((bId) => {
      const dest = DESTINATIONS.find((d) => d.id === bId);
      const recommendedPier = dest?.recommendedPierId;
      if (recommendedPier) included.add(recommendedPier);

      const pts = COMPOSITE_ROUTES[bId] || [bId];
      pts.forEach((p) => {
        if (!PIERS.some((pier) => pier.id === p)) {
          included.add(getPhysicalIsland(p));
        }
      });
      if (!PIERS.some((pier) => pier.id === bId)) {
        included.add(getPhysicalIsland(bId));
      }
    });
    return included;
  }, [bookingDestinations]);

  const mapMarkers = useMemo(() => {
    const piers = PIERS.map((pier) => {
      const isStartPier = pier.id === bookingStartPier;
      let pTitle = pier.name;
      if (isStartPier) {
        pTitle = `⚓ START: ${pTitle}`;
      }

      return {
        id: pier.id,
        lat: pier.latitude,
        lng: pier.longitude,
        title: pTitle,
        isPier: true,
        isActive: bookingPhysicalIslands.has(pier.id) || isStartPier,
        keyActivity:
          pier.id === "chalong"
            ? "Catamaran Southern Pier Departure Hub & Passenger Lounge."
            : pier.id === "ao-po"
              ? "Cruising Gateway to Phang Nga Bay & Ao Po Pier Base."
              : "Private Yacht & Beach Access Elite departure point.",
      };
    });

    const physicalIslandIds = [
      "phi-phi-islands",
      "ko-he-south",
      "ko-he-north-banana-beach",
      "maithon",
      "ko-racha-yai",
      "ko-racha-noi",
      "koh-khai-nok",
      "prompteph",
      "james-bond",
      "koh-hong",
      "koh-yao-noi",
      "koh-yao-yai",
      "naga-noi",
      "naga-yai",
      "phanak-island",
      "ko-kalu-ok",
      "similan-islands",
    ];

    const EX_KEY_ACTIVITIES: Record<string, string> = {
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
      "similan-islands":
        "Premium global snorkeling in crystal visibility and viewing iconic volcanic balance rocks.",
    };

    const dests = physicalIslandIds
      .map((id) => {
        const destObj = DESTINATIONS.find((d) => d.id === id);
        const coord = destCoords[id];
        if (!coord) return null;

        const itinIndex = bookingDestinations.indexOf(id);
        let displayTitle =
          destObj?.name ||
          id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        if (itinIndex !== -1) {
          displayTitle = `[Stop #${itinIndex + 1}] ${displayTitle}`;
        }

        return {
          id,
          lat: coord.lat,
          lng: coord.lng,
          title: displayTitle,
          isPier: false,
          isActive: bookingPhysicalIslands.has(id),
          keyActivity:
            EX_KEY_ACTIVITIES[id] ||
            "Scenic beach stroll, beach snorkeling and customized private yacht charter relaxation.",
        };
      })
      .filter(Boolean) as {
      id: string;
      lat: number;
      lng: number;
      title: string;
      isPier: boolean;
      isActive: boolean;
      keyActivity: string;
    }[];

    const activePOIs = SPECIAL_POIS.filter((p) => {
      if (p.category === "snorkeling" && !showSnorkeling) return false;
      if (p.category === "lagoon" && !showLagoons) return false;
      if (p.category === "photography" && !showViewpoints) return false;
      return true;
    }).map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: p.title,
      isPier: false,
      isActive: selectedPOI?.id === p.id,
      category: p.category as
        | "snorkeling"
        | "lagoon"
        | "photography"
        | "standard",
      keyActivity: p.description,
    }));

    return [...piers, ...dests, ...activePOIs];
  }, [
    bookingPhysicalIslands,
    showSnorkeling,
    showLagoons,
    showViewpoints,
    selectedPOI,
  ]);

  const handleMarkerClick = (id: string, isPier: boolean) => {
    setSearchTerm("");
    if (id && id.startsWith("poi-")) {
      const poiObj = SPECIAL_POIS.find((p) => p.id === id);
      if (poiObj) {
        setSelectedPOI(poiObj);
      }
      return;
    }

    setSelectedPOI(null);

    // If Custom Route mode is active (or we want to explicitly start building one)
    if (selectedRouteId === "custom-route" || informationalOnly) {
      if (isPier) {
        // If they click the start pier when they don't have destinations, set the start pier
        if (bookingDestinations.length === 0) {
          setBookingStartPier(id);
          window.dispatchEvent(
            new CustomEvent("booking-pier-changed", {
              detail: { startPierId: id },
            }),
          );
        } else {
          // If they already built parts of their route, clicking another pier toggles the disembark pier
          const newEnd = bookingEndPier === id ? "" : id;
          setBookingEndPier(newEnd);
          window.dispatchEvent(
            new CustomEvent("booking-pier-changed", {
              detail: { endPierId: newEnd },
            }),
          );
        }
      } else {
        // Toggle the island destination
        const physicalId = getPhysicalIsland(id);
        let newDests = [...bookingDestinations];
        if (newDests.includes(physicalId)) {
          newDests = newDests.filter((d) => d !== physicalId);
        } else {
          newDests.push(physicalId);
        }
        setBookingDestinations(newDests);
        window.dispatchEvent(
          new CustomEvent("add-destination-to-route", {
            detail: {
              destinationIds: newDests,
              startPierId: bookingStartPier,
              endPierId: bookingEndPier,
            },
          }),
        );
      }
      return;
    }

    if (isPier) {
      setActivePierFilter(id);
      setActiveIslandFilter(null);
      const matchingRoutes = DESTINATIONS.filter(
        (d) => d.recommendedPierId === id && d.id !== "custom-route",
      );
      if (matchingRoutes.length > 0) {
        setSelectedRouteId(matchingRoutes[0].id);
      }
    } else {
      const physicalId = getPhysicalIsland(id);
      setActiveIslandFilter(physicalId);
      setActivePierFilter(null);

      const matchingRoutes = DESTINATIONS.filter((d) => {
        if (d.id === "custom-route") return false;
        const pts = COMPOSITE_ROUTES[d.id] || [d.recommendedPierId, d.id];
        const normPts = pts.map(getPhysicalIsland);
        return (
          normPts.includes(physicalId) || getPhysicalIsland(d.id) === physicalId
        );
      });

      const isCurrentMatching = matchingRoutes.some(
        (d) => d.id === selectedRouteId,
      );
      if (isCurrentMatching) {
        // keep selectedRouteId active
      } else if (matchingRoutes.length > 0) {
        setSelectedRouteId(matchingRoutes[0].id);
      } else {
        setSelectedRouteId(physicalId);
      }
    }
  };

  const filteredDestinationRoutes = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      if (d.id === "custom-route") return false;
      if (d.id === "prompteph") return false;
      if (!destCoords[d.id] && !COMPOSITE_ROUTES[d.id]) return false;

      // REMOVED activePierFilter filter to allow merging with all routes

      if (activeIslandFilter) {
        const pts = COMPOSITE_ROUTES[d.id] || [d.recommendedPierId, d.id];
        const normPts = pts.map(getPhysicalIsland);
        const visits =
          normPts.includes(activeIslandFilter) ||
          getPhysicalIsland(d.id) === activeIslandFilter;
        if (!visits) return false;
      }

      const matchesSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.thaiName &&
          d.thaiName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm, activePierFilter, activeIslandFilter]);

  useEffect(() => {
    if (selectedRouteId === "custom-route") return;
    if (filteredDestinationRoutes.length > 0) {
      const isStillPossible = filteredDestinationRoutes.some(
        (d) => d.id === selectedRouteId,
      );
      if (!isStillPossible) {
        setSelectedRouteId(filteredDestinationRoutes[0].id);
      }
    }
  }, [filteredDestinationRoutes, selectedRouteId]);

  const activePointsList = useMemo(() => {
    if (selectedRouteId === "custom-route" && bookingDestinations.length > 0) {
      const parentPier = bookingStartPier || "chalong";
      const endPier = bookingEndPier || parentPier;
      const pointIds = [parentPier, ...bookingDestinations, endPier];
      return pointIds.map((id) => {
        const pierObj = PIERS.find((p) => p.id === id);
        const destObj = DESTINATIONS.find((d) => d.id === id);
        return {
          id,
          name: pierObj?.name || destObj?.name || id,
          isPier: !!pierObj,
        };
      });
    }

    const parentPier =
      activePierFilter || selectedDestination.recommendedPierId;
    const pointIds = getRoutePointsForPier(
      selectedRouteId,
      parentPier,
      activeEndPierFilter || undefined,
    );
    return pointIds.map((id) => {
      const pierObj = PIERS.find((p) => p.id === id);
      const destObj = DESTINATIONS.find((d) => d.id === id);
      return {
        id,
        name: pierObj?.name || destObj?.name || id,
        isPier: !!pierObj,
      };
    });
  }, [
    selectedRouteId,
    selectedDestination,
    activePierFilter,
    activeEndPierFilter,
    bookingDestinations,
    bookingStartPier,
    bookingEndPier,
  ]);

  const mapCenter = useMemo(() => {
    if (routePoints.length > 0) {
      return routePoints[0];
    }
    return { lat: 7.8214, lng: 98.3412 };
  }, [routePoints]);

  const mapCanvas = (
    <div
      className={
        isFullScreen
          ? "fixed inset-0 z-[99999] bg-[#0F172A] p-4 sm:p-6 md:p-8 flex flex-col overflow-hidden animate-fade-in"
          : "col-span-1 lg:col-span-7 h-[500px] lg:h-[calc(100vh-140px)] min-h-[500px] flex flex-col relative"
      }
    >
      {isFullScreen && (
        <div className="flex items-center justify-between mb-4 text-white">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-serif text-white tracking-wide flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-400" />
              <span>Phuket Yacht Charters Excursion Planner</span>
            </h3>
            <p className="text-[10px] sm:text-xs font-mono tracking-wider text-slate-400 mt-1 uppercase">
              Vessel Speed:{" "}
              <span className="text-emerald-400 font-bold">
                {(currentVesselId === "the-best"
                  ? 7.5
                  : currentVesselId === "namaste"
                    ? 7.0
                    : 6.5
                ).toFixed(1)}{" "}
                Kts
              </span>{" "}
              • Start:{" "}
              <span className="text-white font-bold">
                {bookingStartPier.toUpperCase()} Pier
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-sans font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md active:scale-95 border border-rose-500 shrink-0"
          >
            <X className="h-4 w-4 text-white shrink-0 font-black" />
            <span>Close Map</span>
          </button>
        </div>
      )}

      <div
        className={`w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0 ${isFullScreen ? "flex-1 min-h-0" : "h-full"}`}
      >
        <FreeMap
          center={mapCenter}
          zoom={9}
          markers={mapMarkers}
          polylinePaths={routePoints}
          multiPaths={multiPaths}
          onMarkerClick={handleMarkerClick}
          vesselId={currentVesselId}
        />

        {!isFullScreen && (
          <div
            id="map-route-legend"
            className={`absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md pb-3 rounded-lg border border-slate-200/80 shadow-lg font-sans text-slate-800 pointer-events-auto transition-all duration-300 ease-in-out md:max-w-[260px] ${
              isLegendCollapsed
                ? "w-auto px-2.5 py-1.5 max-w-[150px]"
                : "w-[calc(100%-24px)] md:w-[260px] px-3.5 py-3"
            }`}
          >
            <div className="font-bold text-[#0F172A] flex items-center justify-between gap-2.5 uppercase tracking-wider text-[9.5px] select-none">
              <div
                onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-emerald-600 text-xs">🧭</span>
                <span>{isLegendCollapsed ? "Legend" : "Map Legend"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFullScreen(true)}
                  className="hover:bg-slate-100 p-1 rounded transition-all flex items-center justify-center cursor-pointer text-emerald-600 border border-slate-100 shadow-sm"
                  title="View in Full Screen Mode"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                  className="hover:bg-slate-100 p-0.5 rounded transition-all flex items-center justify-center cursor-pointer"
                  title={
                    isLegendCollapsed
                      ? "Expand Map Legend"
                      : "Collapse Map Legend"
                  }
                >
                  {isLegendCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {!isLegendCollapsed && (
              <div className="space-y-2.5 mt-2.5 animate-fade-in text-[11px]">
                {bookingDestinations.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-1 mt-1.5 shrink-0 shadow-xs rounded-full bg-[#F59E0B]" />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block text-slate-900 leading-tight">
                        My Custom Itinerary Route
                      </span>
                      <span className="text-rose-600 block text-[9px] mt-0.5 font-bold leading-none uppercase tracking-wider animate-pulse">
                        ⚡ Travel Route Active
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-1 bg-[#10B981] rounded-full mt-1.5 shrink-0 shadow-xs" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block text-slate-900 leading-tight">
                      Active Cruising Trajectory
                    </span>
                    <span className="text-slate-500 block truncate text-[10px] mt-0.5 font-medium">
                      {selectedDestination?.name || "Active Route"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100/70 pt-2">
                  <span className="font-bold block text-slate-950 uppercase tracking-wider text-[8.5px]">
                    Alternative Option Trajectories
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0 mt-0.5 border-t-2 border-dashed border-[#EF4444] shrink-0" />
                    <span className="text-[10px] font-medium text-slate-600">
                      Coco Pier Route (🔴 Red)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0 mt-0.5 border-t-2 border-dashed border-[#3B82F6] shrink-0" />
                    <span className="text-[10px] font-medium text-slate-600">
                      Chalong Pier Route (🔵 Blue)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0 mt-0.5 border-t-2 border-dashed border-[#EAB308] shrink-0" />
                    <span className="text-[10px] font-medium text-slate-600">
                      Ao Po Pier Route (🟡 Yellow)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100/70 pt-2">
                  <span className="font-bold block text-slate-950 uppercase tracking-wider text-[8.5px]">
                    Departure Yacht Piers
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white shadow-xs shrink-0" />
                    <span className="font-medium text-[9.5px] text-slate-600">
                      Coco Pier
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full border-2 border-white shadow-xs shrink-0" />
                    <span className="font-medium text-[9.5px] text-slate-600">
                      Chalong Pier
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#EAB308] rounded-full border-2 border-white shadow-xs shrink-0" />
                    <span className="font-medium text-[9.5px] text-slate-600">
                      Ao Po Pier
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100/70">
                  <div className="w-2.5 h-2.5 bg-[#4F46E5] rounded-full border-2 border-white shadow-xs shrink-0" />
                  <span className="font-medium text-[10px] text-slate-600 block">
                    Island Waypoints (🏝️ Purple)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-right text-[10px] text-slate-400 mt-2 font-mono">
        🛈 Click on the islands directly to toggle routes, or use the interactive
        companion panel.
      </p>
    </div>
  );

  return (
    <div
      id="route-explorer-section"
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-12 pb-16"
    >
      {/* Sidebar controls */}
      <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 mb-3">
            <Compass className="h-3 w-3 animate-spin-slow" /> Interactive Charts
          </span>
          <h3 className="text-3xl md:text-4xl font-serif text-[#0F172A] leading-tight mb-3">
            Explore Andaman Routes
          </h3>
          <p className="text-[#0F172A]/70 text-sm leading-relaxed max-w-lg">
            Compare premium destinations and sail trajectories across Phuket.
            Toggle options below or click map points to analyze custom travel
            configurations.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200/50 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              🧭 Sights & Sights Filter Sights
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Map
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSnorkeling(!showSnorkeling)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                showSnorkeling
                  ? "bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs ring-1 ring-cyan-200/20"
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
              title="Toggle Snorkeling Spots on Map"
            >
              <span
                className={
                  showSnorkeling ? "opacity-100 text-cyan-600" : "opacity-40"
                }
              >
                🤿
              </span>
              <span>Snorkeling</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${showSnorkeling ? "bg-cyan-500" : "bg-slate-200"}`}
              />
            </button>

            <button
              type="button"
              onClick={() => setShowLagoons(!showLagoons)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                showLagoons
                  ? "bg-sky-50 border-sky-200 text-sky-900 shadow-xs ring-1 ring-sky-200/20"
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
              title="Toggle Hidden Lagoons on Map"
            >
              <span
                className={
                  showLagoons ? "opacity-100 text-sky-600" : "opacity-40"
                }
              >
                🌊
              </span>
              <span>Lagoons</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${showLagoons ? "bg-sky-500" : "bg-slate-200"}`}
              />
            </button>

            <button
              type="button"
              onClick={() => setShowViewpoints(!showViewpoints)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                showViewpoints
                  ? "bg-rose-50 border-rose-200 text-rose-900 shadow-xs ring-1 ring-rose-200/20"
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
              title="Toggle Photo Lookouts on Map"
            >
              <span
                className={
                  showViewpoints ? "opacity-100 text-rose-600" : "opacity-40"
                }
              >
                📸
              </span>
              <span>Viewpoints</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${showViewpoints ? "bg-rose-500" : "bg-slate-200"}`}
              />
            </button>
          </div>

          <div className="h-px bg-slate-200/60 my-1.5" />

          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              ⚓ Choice Start Pier
            </div>
            <div className="flex flex-wrap gap-2">
              {PIERS.map((pier) => (
                <button
                  key={`start-${pier.id}`}
                  type="button"
                  onClick={() => {
                    const newStart = pier.id;
                    setBookingStartPier(newStart);
                    window.dispatchEvent(
                      new CustomEvent("booking-pier-changed", {
                        detail: { startPierId: newStart },
                      }),
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all select-none cursor-pointer active:scale-[0.97] ${
                    bookingStartPier === pier.id
                      ? pier.id === "chalong"
                        ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-200/20"
                        : pier.id === "coco"
                          ? "bg-red-50 border-red-200 text-red-900 shadow-xs ring-1 ring-red-200/20"
                          : "bg-yellow-50 border-yellow-200 text-yellow-900 shadow-xs ring-1 ring-yellow-200/20"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={
                      bookingStartPier === pier.id
                        ? "opacity-100"
                        : "opacity-40"
                    }
                  >
                    {pier.id === "chalong"
                      ? "🔵"
                      : pier.id === "coco"
                        ? "🔴"
                        : "🟡"}
                  </span>
                  <span>{pier.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200/60 my-1.5" />

          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              🏁 Disembark Pier
            </div>
            <div className="flex flex-wrap gap-2">
              {PIERS.map((pier) => (
                <button
                  key={`end-${pier.id}`}
                  type="button"
                  onClick={() => {
                    // toggle logic
                    const currentEnd = bookingEndPier || bookingStartPier;
                    const newEnd = currentEnd === pier.id ? "" : pier.id;
                    setBookingEndPier(newEnd);
                    window.dispatchEvent(
                      new CustomEvent("booking-pier-changed", {
                        detail: { endPierId: newEnd },
                      }),
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition-all select-none cursor-pointer active:scale-[0.97] ${
                    (bookingEndPier || bookingStartPier) === pier.id
                      ? pier.id === "chalong"
                        ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-200/20"
                        : pier.id === "coco"
                          ? "bg-red-50 border-red-200 text-red-900 shadow-xs ring-1 ring-red-200/20"
                          : "bg-yellow-50 border-yellow-200 text-yellow-900 shadow-xs ring-1 ring-yellow-200/20"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{pier.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200/60 my-1.5" />

          <button
            type="button"
            onClick={clearRoute}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-sans font-bold uppercase tracking-wider py-2.5 px-4 rounded-md text-[10.5px] transition-colors cursor-pointer text-center flex items-center justify-center gap-2 mt-1"
          >
            ❌ Clear Route Path
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search islands, routes, or experiences..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value !== "") {
                setActivePierFilter(null);
                setActiveIslandFilter(null);
              }
            }}
            className="w-full px-4 py-2.5 rounded-md border border-[#0F172A]/10 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans shadow-sm"
          />
        </div>

        {(activePierFilter || activeIslandFilter) && (
          <div className="bg-emerald-50/80 border border-emerald-500/20 p-3.5 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{activePierFilter ? "⚓" : "🏝️"}</span>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider mb-0.5 leading-none">
                  {activePierFilter
                    ? "Showing Starting Point Options"
                    : "Showing Selected Island"}
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {activePierFilter
                    ? PIERS.find((p) => p.id === activePierFilter)?.name
                    : DESTINATIONS.find((d) => d.id === activeIslandFilter)
                        ?.name || activeIslandFilter}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActivePierFilter(null);
                setActiveIslandFilter(null);
              }}
              className="p-1 px-2 border border-slate-250 hover:bg-white text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 rounded"
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded-lg bg-slate-50/50">
          {filteredDestinationRoutes.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">
              No route matches found.
            </p>
          ) : (
            filteredDestinationRoutes.map((dest) => {
              const isActive = selectedRouteId === dest.id;

              const startP = activePierFilter || dest.recommendedPierId;
              const endP = activeEndPierFilter || startP;

              const pts = getRoutePointsForPier(dest.id, startP, endP);
              let totalNM = 0;
              for (let i = 0; i < pts.length - 1; i++) {
                const p1 = destCoords[pts[i]];
                const p2 = destCoords[pts[i + 1]];
                if (p1 && p2) {
                  totalNM += calculateDistanceNM(
                    p1.lat,
                    p1.lng,
                    p2.lat,
                    p2.lng,
                  );
                }
              }

              return (
                <button
                  key={dest.id}
                  id={`route-card-${dest.id}`}
                  onClick={() => setSelectedRouteId(dest.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? "bg-emerald-50/70 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-sm"
                      : "bg-white border-slate-200/60 hover:border-slate-350 hover:bg-slate-50/40"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] uppercase font-sans font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-[#0F172A]/60"
                        }`}
                      >
                        {totalNM.toFixed(1)} NM
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        From{" "}
                        {PIERS.find((p) => p.id === startP)?.name || "Chalong"}{" "}
                        to {PIERS.find((p) => p.id === endP)?.name || "Chalong"}
                      </span>
                    </div>
                    <h4
                      className={`text-sm font-bold truncate ${isActive ? "text-[#064E3B] font-sans" : "text-slate-800"}`}
                    >
                      {dest.name}
                    </h4>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {isFullScreen ? (
        <>
          <div className="col-span-1 lg:col-span-7 h-[500px] lg:h-[calc(100vh-140px)] min-h-[500px] border border-dashed border-[#0F172A]/15 bg-slate-50/50 rounded-lg flex flex-col items-center justify-center p-8 text-center gap-4">
            <Compass className="h-10 w-10 text-emerald-700 animate-spin-slow" />
            <div>
              <p className="font-serif text-[#0F172A] text-lg font-light">
                Excursion Map is Expanded
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                The chart is currently active in full screen mode for maximum
                detail. Click below or use the overlay to minimize.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="px-5 py-2.5 bg-[#0F172A] text-white text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-slate-850 rounded transition-all cursor-pointer active:scale-95"
            >
              Minimize Map View
            </button>
          </div>
          {createPortal(mapCanvas, document.body)}
        </>
      ) : (
        mapCanvas
      )}
    </div>
  );
}
