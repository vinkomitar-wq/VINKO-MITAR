import { QRCodeSVG } from "qrcode.react";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  Compass,
  Ship,
  Clock,
  Star,
  CheckCircle,
  MapPin,
  Sparkles,
  Anchor,
  Waves,
  Utensils,
  GripVertical,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { DESTINATIONS, PIERS } from "../data";
import { Destination } from "../types";
import { useLanguage } from "../LanguageContext";
import AIPlanner from "./AIPlanner";
import { ImageWithFallback } from "./ImageWithFallback";
import FreeMap from "./FreeMap";
import { destCoords, getPhysicalIsland } from "./ExcursionMap";

import { COMPOSITE_ROUTES } from "./RouteMapModal";
import RouteMapModal, { hasRouteMap } from "./RouteMapModal";

export const isDestinationEligibleForHalfDay = (id: string): boolean => {
  const eligibleIds = [
    "promteph",
    "ko-he-south",
    "ko-he-north-banana-beach",
    "ko-he-prompteph",
    "coco-coral",
    "coco-phromthep",
  ];
  return eligibleIds.includes(id);
};

interface ItineraryHelperProps {
  onSelectDestination?: (id: string) => void;
  onSelectVessel?: (id: string) => void;
  selectedVesselId?: string;
  mode?: "guide" | "sequence" | "all";
  onCompleteBooking?: (duration: "halfday" | "fullday" | "overnight") => void;
}

// Cruising speeds of catamaran fleet in knots
export const VESSEL_SPEEDS: Record<string, number> = {
  "the-best": 7.5,
  namaste: 7.0,
  "the-one": 6.5,
};

export interface DestinationGuideContent {
  historyTitle: string;
  historyText: string;
  landTitle: string;
  landText: string;
  seaTitle: string;
  seaText: string;
  historyPeriod: string;
}

export const DESTINATION_GUIDE_DATA: Record<string, DestinationGuideContent> = {
  "phi-phi-islands": {
    historyPeriod: "Nomadic Sea Gypsy Era",
    historyTitle: "Ancient Shelters & Pirate Lore",
    historyText:
      "Ko Phi Phi has been inhabited since prehistoric times, serving as a sanctuary for nomadic sea gypsies (Moken) and passing maritime trade vessels. The famous Viking Cave got its name from the magnificent prehistoric-style mural paintings on its eastern and southern walls, depicting European tall ships, Chinese junks, and Arabic dhows. These murals are believed to have been sketched by pirates or sailors seeking refuge from violent monsoons. Today, the cave is strictly protected for swallow bird-nest harvesting.",
    landTitle: "Limestone Cliffs & Viewpoint Treks",
    landText:
      "Beyond the beaches, Phi Phi is famous for its dramatic vertical limestone karsts. Brave explorers can trek up steep jungle pathways to Phi Phi Don's high viewing platforms, exposing a breathtaking dual-cresent-bay panorama of Ton Sai Bay and Loh Dalum Bay. Walk around the vibrant eco-village of Ton Sai, enjoying local crafts, beachfront restaurants, and tropical fire-show spectacles.",
    seaTitle: "Snorkeling, Shark Corridor & Lagoon Cruses",
    seaText:
      "Sea activities on Phi Phi are legendary. Swim through Pileh Lagoon, a beautiful turquoise fjord enclosed by 100-meter vertical limestone cliffs where yachts anchor in completely calm water. Snorkel with giant leatherback turtles and friendly blacktip reef sharks at Shark Point, or kayak near Monkey Beach where crab-eating macaques swim directly out to passing vessels.",
  },
  "james-bond": {
    historyPeriod: "Triassic Geologic Era",
    historyTitle: "130-Million-Year-Old Limestone Wonders",
    historyText:
      "Geologically, Phang Nga Bay's karst towers rose during the Triassic period, formed by immense tectonic pressures, marine currents, and rainwater dissolution over 130 million years. Known historically by Malay and Thai fishermen as Koh Tapu (Nail Island) and Khao Phing Kan (Leaning Hills), it was an obscure refuge until 1974. The island skyrocketed to global stardom when it was featured as the hidden fortress for double-agent Francisco Scaramanga in the James Bond cinematic classic, 'The Man with the Golden Gun'.",
    landTitle: "Stilt Villages & Leaning Caves",
    landText:
      "Explore Khao Phing Kan, a pair of wooden-skirted islands with caves leaning at extreme angles. Nearby is Koh Panyee, an unbelievable 18th-century Muslim fishing village built entirely on wooden and concrete stilts over the shallow bay. It features a mosques, stilt houses, and a world-famous floating wooden football pitch constructed by local children.",
    seaTitle: "Sea Cave Canoeing & Sea Gypsy Rowing",
    seaText:
      "Phang Nga Bay's emerald waters are extremely shallow and calm, offering pristine kayaking conditions. Paddle customized canoes directly into 'Hongs' (hollow marine chambers inside high karsts) accessible only during low tides, passing through mystical low-hanging limestone stalactite vaults and dense primary mangrove swamp pathways.",
  },
  "ko-he-south": {
    historyPeriod: "Ornithological Outpost",
    historyTitle: "The Hornbill Sanctuary of Koh He",
    historyText:
      "Historically a quiet, undeveloped island off Phuket's southern coast, Coral Island (Ko He) has always been famous of its rich, fringing shallow coral gardens. While the northern beach became a tourist playground, the southern beach (Kahung Beach) remained a protected habitat. The island acts as a unique bird sanctuary where the Great Hornbill (known for its golden beak and black-and-white feathers) nests in pristine jungle trees overlooking the sea, undisturbed by the tourism footprint.",
    landTitle: "Pristine Jungle Trails & Bird Watching",
    landText:
      "Take a quiet walk along the shaded jungle trails to spot wild hornbills nesting or gliding between large banyan trees. The southern shore is incredibly tranquil, framed by thick forest providing a great spot for high-end boutique picnic lunches, yoga sessions, or relaxing on fine white sands.",
    seaTitle: "Shallow Snorkeling & Coral Restoration Tours",
    seaText:
      "Highly beloved for shallow snorkeling in calm, blue waters. Sea activities are geared towards eco-awareness. Guests can snorkel right off the white sandy shore into shallow reefs containing staghorn, brain, and table corals. Highly active schools of parrotfish, butterflyfish, and clownfish reside just meters from the shoreline.",
  },
  "ko-he-north-banana-beach": {
    historyPeriod: "Elite Eco-Playground",
    historyTitle: "Evolution of Phuket's Bamboo Sanctuary",
    historyText:
      "Once a secret, untamed strip of sand, Banana Beach was developed with a strict eco-conscious layout. Builders constructed the beach's magnificent structures using sustainable bamboo, reflecting the shape of a hornbill's wings, leaving the surrounding jungle ecosystem and coral fringe 100% untouched. It serves as a prime example of high-end eco-tourism, balancing exciting activities with local preservation.",
    landTitle: "Aesthetic Bamboo Pavilions & Wellness",
    landText:
      "Take photographs of the award-winning bamboo pavilions nested against the lush, green hillside. Dine on authentic southern-style Thai seafood at the eco-restaurant, or try swing-chair photo sessions under giant coconut palms swaying in the sea breeze.",
    seaTitle: "Thrilling Parasailing, Sea-Walking & Slide Fun",
    seaText:
      "The absolute capital for dynamic water sports off Phuket. Guests can parasail high above the bay, go on an exciting sea-walk on the sandy floor wearing specialized air helmets, paddle see-through crystal kayaks, or slide down water slides deployed directly into the warm ocean.",
  },
  "ko-racha-yai": {
    historyPeriod: "Royal Marine Reserve",
    historyTitle: "The Emperor's Crystal Haven",
    historyText:
      "Named 'Racha' (meaning Emperor or Royal) because of its pristine beauty, these islands were traditionally used by Royal Thai navies for shelter and navigation. Racha Yai was historically cultivated as a coconut and buffalo farming outpost by small groups of settlers, preserving its stunning, clear white sand beaches. The waters are remarkably clear, boasting visibility up to 30 meters under perfect conditions.",
    landTitle: "Scenic Overlooks & Buffalo Trails",
    landText:
      "Trek up the volcanic rocks at Patok Bay to see the high viewpoint, exposing the perfect horseshoe-shaped bay and the yacht array below. Hike or bike inland along dirt paths to see local coconut grooves and harmless giant monitor lizards basking in the sun near small fresh-water creeks.",
    seaTitle: "Scuba Diving, Snorkeling & Ocean SNUBA",
    seaText:
      "The premier scuba-diving destination in Phuket. Racha Yai's Ter Bay and Siam Bay feature submerged artificial reef structures (including a steel motorcycle and elephant statues) that attract diverse marine life. Perfect for beginners and advanced divers alike, with shallow currents and exceptional visibility.",
  },
  "ko-racha-noi": {
    historyPeriod: "Uninhabited Wilderness",
    historyTitle: "Raw Granite Cliffs & Pelagic Shelves",
    historyText:
      "Racha Noi is the smaller, completely uninhabited, rugged sister to Racha Yai. Fringed by massive, smooth volcanic granite boulders reminiscent of the remote Similan Islands, its deep-sea surrounding topography features sudden submarine drop-offs and intense deep currents. Historically, it has remained untouched by permanent settlers, leaving its underwater and land environment completely raw and wild.",
    landTitle: "Rugged Volcanic Hike & Sunset Deck",
    landText:
      "As a wild sanctuary, Racha Noi has no hotels or roads. Only a small, secret beach bar on the quiet south-tip bay exists during high season. Disembark from your yacht to explore raw tide pools and walk along smooth granite rocks carved by tides over centuries.",
    seaTitle: "Advanced Drift Diving & Manta Ray Encounters",
    seaText:
      "Sea activities here are deep and exciting. Racha Noi's South Tip is legendary for drift diving, where experienced scuba divers can swim alongside giant oceanic manta rays, barracuda packs, reef sharks, and magnificent green sea turtles cruising the deep blue shelves.",
  },
  maithon: {
    historyPeriod: "Private Sanctuary Reserve",
    historyTitle: "The Secluded Haven of the Andaman",
    historyText:
      "Maiton Island is often referred to as Phuket's 'Secret Hideaway'. For decades, access to this high-end private island was strictly controlled, which protected its magnificent fringing coral reef from damage. The island is also famous for its resident pod of wild bottlenose dolphins, who chose the peaceful, nutrient-rich east-coast waters as their permanent mating and hunting grounds.",
    landTitle: "Wooden Viewing Platforms & Serene Walks",
    landText:
      "Take a scenic walk up to the island's wooden hilltop viewpoint. On a clear day, you can see all the way to Krabi's towering cliffs, Phi Phi Islands, and Phuket's southern beaches. Relax on the private seaside wooden decks under the palms.",
    seaTitle: "Dolphin Spotting & Yacht-Stern Snorkeling",
    seaText:
      "Enjoy observing the resident pod of wild Phuket bottlenose dolphins playing and jumping in the surf right off your catamaran bows. The crystal-clear shallow waters contain highly active sea anemone gardens, giant clams, clownfish, and thousands of schooling small glassfish.",
  },
  prompteph: {
    historyPeriod: "Ancient Maritime Landmark",
    historyTitle: "The Pilgrim Cape & Elephant Shrine",
    historyText:
      "Phromthep Cape is Phuket's most famous southern headland. Traditionally known to international sea farers as 'Laem Jaw' (Shrine Cape), it was a critical geographical landmark for Portuguese caravels, British merchants, and Chinese trading junks sailing from Malacca. Sailors would pray to the winds for safe harbor. Today, there is a giant shrine populated with thousands of colorful wooden elephant carvings offered by pilgrims in return for protection.",
    landTitle: "Kanchanaphisek Lighthouse & Golden Sunset Trails",
    landText:
      "Explore the golden-hued sea cliffs of the cape. Visit the Kanchanaphisek Lighthouse, built in 1996 to celebrate King Rama IX's golden jubilee, which houses ancient naval artifacts. Hike down the steep, wind-beaten clay paths to the absolute lowest edge of the peninsula.",
    seaTitle: "Catamaran High-Sea Anchoring & Deep-Water Fishing",
    seaText:
      "Yachts anchor in the deep-water passage between Phromthep Cape and the offshore Koh Man island. It's a prime spot for deep-water trolling (seeking sailfish and mackerel) or boarding paddleboards to glide across sunset waters.",
  },
  "custom-route": {
    historyPeriod: "Infinite Exploration",
    historyTitle: "Your Bespoke Andaman Odyssey",
    historyText:
      "Rather than following standard paths, a custom travel route grants you absolute freedom to create your own journey. The Phuket archipelago comprises over 32 islands, countless secret sandbanks, hidden caves, and private anchorages. By consulting directly with our expert captains and agents, you can draft an original cruising experience based on live winds and tides.",
    landTitle: "Private Sandbar Landings & Hidden Beach BBQ",
    landText:
      "Step ashore on sandbanks that disappear during high tide. Arrange for exclusive, private beachfront seafood BBQs cooked by our crew on desolate shores, or kayak to isolated caves reachable only by sea.",
    seaTitle: "Undiscovered Snorkeling Holes & Sea Kayaking",
    seaText:
      "Jump off the swim platform into uncharted waters. Spot pristine marine life, follow schools of flying fish, paddle your paddleboard through quiet shorelines, or cruise at high speeds on the catamaran's water slide.",
  },
};

// High-precision spherical distance formula (Haversine) in Nautical Miles
export const calculateDistanceNM = (
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

export default function ItineraryHelper({
  onSelectDestination,
  onSelectVessel,
  selectedVesselId: propVesselId,
  mode = "all",
  onCompleteBooking,
}: ItineraryHelperProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(
    mode === "sequence" ? "sequence" : "all",
  );
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (mode === "sequence") {
      setActiveTab("sequence");
    } else if (mode === "guide" && activeTab === "sequence") {
      setActiveTab("all");
    }
  }, [mode]);

  // Emit tab changed events to keep map synchronized
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("itinerary-tab-changed", {
        detail: activeTab,
      }),
    );
  }, [activeTab]);

  // Listen to map pier filter selections and update activeTab
  useEffect(() => {
    const handleMapPierChanged = (e: CustomEvent) => {
      const pierId = e.detail;
      if (pierId === "all" || pierId === null) {
        if (
          activeTab !== "all" &&
          activeTab !== "ai" &&
          activeTab !== "sequence"
        ) {
          setActiveTab("all");
        }
      } else {
        if (activeTab !== pierId) {
          setActiveTab(pierId);
        }
      }
    };
    window.addEventListener(
      "map-pier-changed",
      handleMapPierChanged as EventListener,
    );
    return () => {
      window.removeEventListener(
        "map-pier-changed",
        handleMapPierChanged as EventListener,
      );
    };
  }, [activeTab]);

  const [selectedDestId, setSelectedDestId] =
    useState<string>("phi-phi-islands");
  const [routeModalData, setRouteModalData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [timelineDuration, setTimelineDuration] = useState<
    "halfday" | "fullday" | "overnight"
  >("halfday");
  const [currentVesselId, setCurrentVesselId] = useState<string>("the-best");

  // Drag-and-drop itinerary sequence states
  const [sequence, setSequence] = useState<string[]>(() => {
    const saved = localStorage.getItem("phuket_booking_form_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.destinations)) {
          return parsed.destinations.filter(
            (id: string) =>
              id !== "custom-route" &&
              id !== "the-best" &&
              id !== "namaste" &&
              id !== "the-one",
          );
        }
      } catch (e) {
        console.error(
          "Error loading initial sequence state in ItineraryHelper:",
          e,
        );
      }
    }
    return [];
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSuccessSynced, setIsSuccessSynced] = useState(false);

  // Sync vessel selection prop changes
  useEffect(() => {
    if (propVesselId) {
      setCurrentVesselId(propVesselId);
    }
  }, [propVesselId]);

  // Sync vessel selection from custom events
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

  // Synchronize from booking destinations list change (when changed via map/form/selection) -> Phuket Destination Guide
  useEffect(() => {
    const handleSyncEvent = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;

      let dests: string[] = [];
      if (Array.isArray(detail)) {
        dests = detail;
      } else if (
        detail.destinationIds &&
        Array.isArray(detail.destinationIds)
      ) {
        dests = detail.destinationIds;
        if (detail.startPierId) setPlannerStartPier(detail.startPierId);
        if (detail.endPierId !== undefined) setPlannerEndPier(detail.endPierId);
      } else if (detail.destinationId) {
        dests = [detail.destinationId];
      } else if (typeof detail === "object" && detail !== null) {
        if (Array.isArray(detail.destinations)) {
          dests = detail.destinations;
        }
        if (detail.startPierId) setPlannerStartPier(detail.startPierId);
        if (detail.endPierId !== undefined) setPlannerEndPier(detail.endPierId);
      }

      const validDests = dests.filter(
        (id: string) =>
          id !== "custom-route" &&
          id !== "the-best" &&
          id !== "namaste" &&
          id !== "the-one",
      );
      // Compare to see if there is any actual difference, including clearing the sequence
      const isSame =
        validDests.length === sequence.length &&
        validDests.every(
          (val: string, index: number) => val === sequence[index],
        );
      if (!isSame) {
        setSequence(validDests);
      }
    };

    const handlePierSync = (e: CustomEvent) => {
      const { startPierId, endPierId } = e.detail || {};
      if (startPierId) setPlannerStartPier(startPierId);
      if (endPierId !== undefined) setPlannerEndPier(endPierId);
    };

    const handleDurationSync = (e: CustomEvent) => {
      const duration = e.detail;
      if (duration === "halfday" || duration === "half-day") {
        setTimelineDuration("halfday");
      } else if (duration === "fullday" || duration === "full-day") {
        setTimelineDuration("fullday");
      } else if (duration === "overnight") {
        setTimelineDuration("overnight");
      }
    };

    window.addEventListener(
      "booking-destinations-changed",
      handleSyncEvent as EventListener,
    );
    window.addEventListener(
      "cruise-trajectory-selected",
      handleSyncEvent as EventListener,
    );
    window.addEventListener(
      "add-destination-to-route",
      handleSyncEvent as EventListener,
    );
    window.addEventListener(
      "booking-duration-changed",
      handleDurationSync as EventListener,
    );
    window.addEventListener(
      "booking-pier-changed",
      handlePierSync as EventListener,
    );

    return () => {
      window.removeEventListener(
        "booking-destinations-changed",
        handleSyncEvent as EventListener,
      );
      window.removeEventListener(
        "cruise-trajectory-selected",
        handleSyncEvent as EventListener,
      );
      window.removeEventListener(
        "add-destination-to-route",
        handleSyncEvent as EventListener,
      );
      window.removeEventListener(
        "booking-duration-changed",
        handleDurationSync as EventListener,
      );
      window.removeEventListener(
        "booking-pier-changed",
        handlePierSync as EventListener,
      );
    };
  }, [sequence]);

  // Enforce half-day restriction: upgrade to fullday if has ineligible stops or starting from Ao Po
  useEffect(() => {
    const isAoPo =
      sequence.length > 0 &&
      (DESTINATIONS.find((d) => d.id === sequence[0])?.recommendedPierId ||
        "chalong") === "ao-po";
    const hasIneligible = sequence.some(
      (d) => !isDestinationEligibleForHalfDay(d),
    );
    if (timelineDuration === "halfday" && (isAoPo || hasIneligible)) {
      setTimelineDuration("fullday");
    }
  }, [sequence, timelineDuration]);

  // Dispatches current sequence details to BookingForm & ExcursionMap
  const [plannerStartPier, setPlannerStartPier] = useState<string | null>(null);
  const [plannerEndPier, setPlannerEndPier] = useState<string | null>(null);

  const effectiveStartPier =
    plannerStartPier ||
    (sequence.length > 0
      ? DESTINATIONS.find((d) => d.id === sequence[0])?.recommendedPierId ||
        "chalong"
      : "chalong");
  const effectiveEndPier = plannerEndPier || effectiveStartPier;

  const syncSequenceToBooking = (newSeq: string[]) => {
    window.dispatchEvent(
      new CustomEvent("add-destination-to-route", {
        detail: {
          destinationIds: newSeq,
          startPierId: effectiveStartPier,
          endPierId: effectiveEndPier,
        },
      }),
    );
  };

  // Memoized Markers for local planner Map - ONLY SHOW PLOTTED TRAJECTORY POINTS & STARTING PIER
  const guideMapMarkers = useMemo(() => {
    const list: any[] = [];

    const seqPier = PIERS.find((p) => p.id === effectiveStartPier) || PIERS[0];
    const pierCoord = destCoords[effectiveStartPier];
    if (pierCoord) {
      list.push({
        id: effectiveStartPier,
        lat: pierCoord.lat,
        lng: pierCoord.lng,
        title: `⚓ START: ${seqPier.name}`,
        isPier: true,
        category: "pier",
      });
    }

    if (effectiveEndPier !== effectiveStartPier) {
      const endPierObj =
        PIERS.find((p) => p.id === effectiveEndPier) || PIERS[0];
      const endPierCoord = destCoords[effectiveEndPier];
      if (endPierCoord) {
        list.push({
          id: effectiveEndPier,
          lat: endPierCoord.lat,
          lng: endPierCoord.lng,
          title: `🏁 DISEMBARK PIER: ${endPierObj.name}`,
          isPier: true,
          category: "pier",
        });
      }
    }

    // Active Chosen Route points in custom order sequence (Only plotted points)
    sequence.forEach((id, idx) => {
      const dest = DESTINATIONS.find((d) => d.id === id);
      if (!dest) return;
      const physical = getPhysicalIsland(id);
      const coord = destCoords[physical] || destCoords[id];
      if (coord) {
        list.push({
          id: id,
          lat: coord.lat,
          lng: coord.lng,
          title: `[Stop #${idx + 1}] ${dest.name}`,
          isPier: false,
          isActive: true,
        });
      }
    });

    return list;
  }, [sequence, effectiveStartPier, effectiveEndPier]);

  // Connects the chosen route itinerary sequence with polyline lines - ONLY SHOW PLOTTED TRAJECTORY PATHS (STARTING FROM PIER)
  const guideMapPaths = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];

    // Determine starting pier and prepend its coordinate as the start point of path
    const pierCoord = destCoords[effectiveStartPier];
    if (pierCoord) {
      points.push(pierCoord);
    }

    // Active Sequence coords (Only plotted stops)
    sequence.forEach((id) => {
      const physical = getPhysicalIsland(id);
      const coord = destCoords[physical] || destCoords[id];
      if (coord) {
        points.push(coord);
      }
    });

    // Close the loop back to Disembark Pier
    const endCoord = destCoords[effectiveEndPier];
    if (endCoord) {
      points.push(endCoord);
    }

    if (points.length >= 2) {
      return [
        {
          points,
          isActive: true,
          name: `Current Interactive Path`,
          isItinerary: true,
        },
      ];
    }
    return [];
  }, [sequence, effectiveStartPier, effectiveEndPier]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...sequence];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setSequence(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedIndex(null);
    syncSequenceToBooking(sequence);
  };

  const handleRemoveFromSequence = (index: number) => {
    const updated = sequence.filter((_, i) => i !== index);
    setSequence(updated);
    setIsSuccessSynced(false);
    syncSequenceToBooking(updated);
  };

  const handleAddToSequence = (destId: string) => {
    if (sequence.includes(destId)) {
      alert(
        "This island destination is already included in your hopping sequence!",
      );
      return;
    }
    // Filter out dummy/special packages if chosen
    if (
      destId === "custom-route" ||
      destId === "the-best" ||
      destId === "namaste" ||
      destId === "the-one"
    ) {
      return;
    }
    const updated = [...sequence, destId];
    setSequence(updated);
    setIsSuccessSynced(false);
    syncSequenceToBooking(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sequence];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSequence(updated);
    setIsSuccessSynced(false);
    syncSequenceToBooking(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === sequence.length - 1) return;
    const updated = [...sequence];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSequence(updated);
    setIsSuccessSynced(false);
    syncSequenceToBooking(updated);
  };

  const handleGuideMapMarkerClick = (markerId: string, isPier: boolean) => {
    if (isPier) return;
    if (sequence.includes(markerId)) {
      setSelectedDestId(markerId);
    } else {
      handleAddToSequence(markerId);
    }
  };

  const handleSyncSequence = () => {
    if (sequence.length === 0) {
      alert(
        "Please add at least one destination to lock in your custom hopping route sequence!",
      );
      return;
    }
    // Dispatch custom event to lock this into the booking form!
    window.dispatchEvent(
      new CustomEvent("add-destination-to-route", {
        detail: { destinationIds: sequence },
      }),
    );

    setIsSuccessSynced(true);
    setTimeout(() => {
      setIsSuccessSynced(false);
    }, 4000);

    // Smoothly scroll down to the booking form sheet
    const bookingSheet = document.getElementById("booking-sheet");
    if (bookingSheet) {
      bookingSheet.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getSequenceTimelineEvents = () => {
    const events = [];

    const seqStartPierId = effectiveStartPier;
    const seqStartPier = PIERS.find((p) => p.id === seqStartPierId) || PIERS[0];
    const seqEndPierId = effectiveEndPier;
    const seqEndPier = PIERS.find((p) => p.id === seqEndPierId) || PIERS[0];

    const isSeqPhiPhi = sequence.some((id) => id.includes("phi-phi"));
    // Full day cruise extend to 19h disembark and embark in 9 or 9.30 AM
    const seqStartHour =
      timelineDuration === "fullday" ? 9.5 : isSeqPhiPhi ? 8.0 : 8.5;
    const seqDuration =
      timelineDuration === "fullday"
        ? 9.5
        : isSeqPhiPhi
          ? 12.0
          : timelineDuration === "overnight"
            ? 24.0
            : 4.5;
    const seqEndHour = seqStartHour + seqDuration;

    const speedKnots = VESSEL_SPEEDS[currentVesselId] || 7.0;
    const activeVesselName =
      currentVesselId === "the-best"
        ? "The Best (Catlante 600)"
        : currentVesselId === "namaste"
          ? "NAMASTE (Imp 55)"
          : "THE ONE (Leopard 47)";

    // Boarding Event
    events.push({
      time:
        timelineDuration === "fullday"
          ? "09:00 / 09:30 AM"
          : formatTimelineTime(seqStartHour),
      title: `Boarding & Departure`,
      location: seqStartPier.name,
      description: `Step onto our custom double-deck catamaran. Receive a refreshing iced welcome drink, meet Captain & crew, and enjoy a brief safety briefing before we set sail. (Speed: ${speedKnots} kts)`,
      icon: "ship",
      color: "bg-emerald-600",
    });

    let totalSeqDistance = 0;
    let totalTransitTime = 0;
    let leisureTimePerIsland = 0;
    let warningStatus = "optimal";

    if (sequence.length > 0) {
      // Build chronological sequence of physical coordinate points: start pier -> islands -> return pier
      const physicalPoints = [
        seqStartPierId,
        ...sequence.map(getPhysicalIsland),
        seqEndPierId,
      ];

      // Calculate individual legs
      const legs: {
        from: string;
        to: string;
        distance: number;
        transitTime: number;
      }[] = [];
      for (let i = 0; i < physicalPoints.length - 1; i++) {
        const fromId = physicalPoints[i];
        const toId = physicalPoints[i + 1];
        const p1 = destCoords[fromId];
        const p2 = destCoords[toId];
        let distance = 0;
        if (p1 && p2) {
          distance = calculateDistanceNM(p1.lat, p1.lng, p2.lat, p2.lng);
        }
        const transitTime = speedKnots > 0 ? distance / speedKnots : 0;
        totalSeqDistance += distance;
        totalTransitTime += transitTime;
        legs.push({ from: fromId, to: toId, distance, transitTime });
      }

      // Available total duration is seqDuration
      // Overhead duration: 0.5hr onboarding delay before departure + 0.5hr before disembarkation
      const overheadTime = 1.0;
      const totalAvailableLegTime =
        seqDuration - totalTransitTime - overheadTime;

      if (totalAvailableLegTime < 0) {
        warningStatus = "optimal"; // Don't warn, just show reality
        leisureTimePerIsland = 0.1; // Clamp to small buffer
      } else {
        leisureTimePerIsland = totalAvailableLegTime / sequence.length;
        if (leisureTimePerIsland < 0.5) {
          warningStatus = "tight"; // less than 30 mins per stop is rushed
        } else {
          warningStatus = "optimal";
        }
      }

      // Build out Timeline Schedule events
      let currentHour = seqStartHour + 0.5; // depart pier 0.5h after boarding boarding

      sequence.forEach((id, index) => {
        const dest = DESTINATIONS.find((d) => d.id === id);
        if (!dest) return;

        // Transit leg to school/beach
        const leg = legs[index];
        const arrivalHour = currentHour + leg.transitTime;

        let customDesc = `Arrive at this exclusive beach paradise. Enjoy world-class swimming, spectacular rock formations, and clear waters perfect for underwater exploration.`;
        if (id.includes("phi-phi")) {
          customDesc = `Behold the iconic 100m towering limestone cliffs of Phi Phi. Dive into the breathtaking emerald-neon waters of Pileh Lagoon and visit Maya Bay.`;
        } else if (id.includes("maithon")) {
          customDesc = `Search for our resident dolphin pod in crystal-clear waters. Discover the pristine coral garden ideal for snorkeling.`;
        } else if (id.includes("khai")) {
          customDesc = `Experience soft sandy beaches, ideal for children and family swimming, as sergeant major fish swim directly to the shore.`;
        } else if (id.includes("racha")) {
          customDesc = `Paradise for scuba or drift snorkeling. Deep blue waters teeming with magnificent sea-life and powdery white crescent beaches.`;
        } else if (dest.description) {
          customDesc = dest.description;
        }

        // Minutes format helper for transits
        const legMin = Math.round(leg.transitTime * 60);
        const legTransitString =
          legMin >= 60
            ? `${Math.floor(legMin / 60)}h ${legMin % 60}m`
            : `${legMin} mins`;

        events.push({
          time: formatTimelineTime(arrivalHour),
          title: `Stop #${index + 1}: Explore ${dest.name}`,
          location: dest.name,
          description: `${customDesc} (Sailed ${leg.distance.toFixed(1)} NM in ${legTransitString} cruising at ${speedKnots} kts. Gourmet onboard dining served during transit).`,
          icon: "pin",
          color: "bg-indigo-600",
        });

        // Next stop start is arrivalHour + leisure time
        currentHour = arrivalHour + leisureTimePerIsland;
      });

      // Insert Gourmet Catering Lunch break (either in a stop or middle) - Removed to avoid wasting customer time
    }

    // Return Pier Disembarkation
    events.push({
      time:
        timelineDuration === "fullday"
          ? "07:00 PM (19:00)"
          : formatTimelineTime(seqEndHour),
      title: `Return & Safe Arrival at End Pier`,
      location: seqEndPier.name,
      description: `Glide back smoothly. Collect all personal items, receive photos shot by our staff, and prepare for your private hotel transfer.`,
      icon: "anchor",
      color: "bg-slate-900",
    });

    return {
      events,
      totalDuration: seqDuration,
      totalDistance: totalSeqDistance,
      totalTransitTime,
      leisureTimePerIsland,
      speedKnots,
      vesselName: activeVesselName,
      warningStatus,
    };
  };

  const filteredDestinations = DESTINATIONS.filter((dest) => {
    if (activeTab === "all") return true;
    return dest.recommendedPierId === activeTab;
  });

  const selectedDestinationDetails =
    DESTINATIONS.find((d) => d.id === selectedDestId) || DESTINATIONS[0];

  const translatedDestName =
    t(`destinations.${selectedDestinationDetails.id}.name`) !==
    `destinations.${selectedDestinationDetails.id}.name`
      ? t(`destinations.${selectedDestinationDetails.id}.name`)
      : selectedDestinationDetails.name;

  const translatedDestDesc =
    t(`destinations.${selectedDestinationDetails.id}.desc`) !==
    `destinations.${selectedDestinationDetails.id}.desc`
      ? t(`destinations.${selectedDestinationDetails.id}.desc`)
      : selectedDestinationDetails.description;

  const translatedDestHighlights = selectedDestinationDetails.highlights.map(
    (h, i) => {
      const key = `destinations.${selectedDestinationDetails.id}.highlights.${i}`;
      return t(key) !== key ? t(key) : h;
    },
  );

  const basePoints = COMPOSITE_ROUTES[selectedDestinationDetails.id] || [
    selectedDestinationDetails.recommendedPierId,
    selectedDestinationDetails.id,
  ];
  const startPierId = basePoints[0];
  const startPier = PIERS.find((p) => p.id === startPierId) || PIERS[0];

  const isPhiPhi =
    selectedDestinationDetails.id.includes("phi-phi") ||
    selectedDestinationDetails.id === "coco-phi-phi";
  const isFullDay = isPhiPhi || timelineDuration === "fullday";
  const startHour = timelineDuration === "fullday" ? 9.5 : isPhiPhi ? 8.0 : 8.5;
  const totalDuration =
    timelineDuration === "fullday" ? 9.5 : isPhiPhi ? 12.0 : 4.5;
  const endHour = startHour + totalDuration;

  const formatTimelineTime = (hour: number) => {
    const hrInt = Math.floor(hour);
    const minInt = Math.round((hour - hrInt) * 60);
    const isPM = hrInt >= 12;
    const displayHr = hrInt > 12 ? hrInt - 12 : hrInt === 0 ? 12 : hrInt;
    const formattedMin = minInt < 10 ? `0${minInt}` : minInt;
    return `${displayHr < 10 ? "0" + displayHr : displayHr}:${formattedMin} ${isPM ? "PM" : "AM"}`;
  };

  const getTimelineEvents = () => {
    const events: any[] = [];

    // 1. Depart event
    events.push({
      time:
        timelineDuration === "fullday"
          ? "09:00 / 09:30 AM"
          : formatTimelineTime(startHour),
      title: `Boarding & Departure`,
      location: startPier.name,
      description: `Step onto our custom double-deck catamaran. Receive a refreshing iced welcome drink, meet Captain & crew, and enjoy a brief safety briefing before we set sail.`,
      icon: "ship",
      color: "bg-emerald-600",
      sortHour: startHour,
    });

    const wayIds = basePoints.slice(1);
    const speedKnots = VESSEL_SPEEDS[currentVesselId] || 7.0;

    // Calculate transit times instead of using fractional estimates
    let currentHour = startHour + 0.5; // Departure delay

    wayIds.forEach((id, index) => {
      const dest = DESTINATIONS.find((d) => d.id === id);
      const name = dest ? dest.name : id;

      // Calculate transit to this stop
      const prevPoint =
        index === 0 ? effectiveStartPier || basePoints[0] : wayIds[index - 1];
      const p1 = destCoords[prevPoint];
      const p2 = destCoords[id];
      const distance =
        p1 && p2 ? calculateDistanceNM(p1.lat, p1.lng, p2.lat, p2.lng) : 10; // Fallback
      const transitHours = distance / speedKnots;
      const arrivalHour = currentHour + transitHours;

      let customDesc = `Arrive at this exclusive beach paradise. Enjoy world-class swimming, spectacular rock formations, and clear waters perfect for underwater exploration.`;
      if (id.includes("phi-phi")) {
        customDesc = `Behold the iconic 100m towering limestone cliffs of Phi Phi. Dive into the breathtaking emerald-neon waters of Pileh Lagoon and visit Maya Bay.`;
      } else if (id.includes("maithon")) {
        customDesc = `Search for our resident dolphin pod in crystal-clear waters. Discover the pristine coral garden ideal for snorkeling.`;
      } else if (id.includes("khai")) {
        customDesc = `Experience soft sandy beaches, ideal for children and family swimming, as sergeant major fish swim directly to the shore.`;
      } else if (id.includes("racha")) {
        customDesc = `Paradise for scuba or drift snorkeling. Deep blue waters teeming with magnificent sea-life and powdery white crescent beaches.`;
      }

      events.push({
        time: formatTimelineTime(arrivalHour),
        title: `Arrive at ${name}`,
        location: name,
        description: customDesc,
        icon: "pin",
        color: "bg-indigo-600",
        sortHour: arrivalHour,
      });

      // Update currentHour to arrival + leisure (buffer 1.5h)
      currentHour = arrivalHour + 1.5;
    });

    // Return event
    const lastStopId = wayIds[wayIds.length - 1];
    const pLast = destCoords[lastStopId];
    const endPierId = effectiveEndPier || basePoints[0];
    const pPier = destCoords[endPierId];
    const distReturn =
      pLast && pPier
        ? calculateDistanceNM(pLast.lat, pLast.lng, pPier.lat, pPier.lng)
        : 10;
    const returnTransitTime = distReturn / speedKnots;
    const returnTime = endHour;

    events.push({
      time: formatTimelineTime(returnTime),
      title: `Return & Safe Arrival at End Pier`,
      location: PIERS.find((p) => p.id === endPierId)?.name || startPier.name,
      description: `Glide back smoothly as twilight sets in Phrumthep waters. Collect all personal items, receive photos shot by our staff, and prepare for your private hotel transfer.`,
      icon: "anchor",
      color: "bg-slate-900",
      sortHour: returnTime,
    });

    events.sort((a, b) => a.sortHour - b.sortHour);

    return events;
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div id="itinerary-guide-section" className="space-y-6">
      {/* Segment controls */}
      {mode === "guide" ? (
        <div className="border-b border-[#0F172A]/15 pb-5">
          <h3 className="text-2xl font-serif italic text-slate-900 tracking-wide">
            Phuket Historical Chronicle & Destination Guide
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#0F172A]/50 font-sans font-semibold mt-1">
            Bespoke Split Explorer: Legacy of Junk Ceylon alongside Curated
            Charter Corridors
          </p>
        </div>
      ) : (
        mode !== "sequence" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4 border-b border-[#0F172A]/15 pb-5">
            <div>
              <h3 className="text-2xl font-serif italic text-slate-900 tracking-wide">
                {t("guide.title") !== "guide.title"
                  ? t("guide.title")
                  : "Phuket Destination Guide"}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#0F172A]/50 font-sans font-semibold mt-1">
                {t("guide.subtitle") !== "guide.subtitle"
                  ? t("guide.subtitle")
                  : "Compare distances and optimal cruise point recommendations"}
              </p>
            </div>

            {/* Pier Filter (Minimal Editorial Segment) */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xs border border-slate-200 self-stretch sm:self-auto overflow-x-auto">
              <button
                id="filter-pier-all"
                onClick={() => setActiveTab("all")}
                type="button"
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === "all"
                    ? "bg-[#0F172A] text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("filter.all") !== "filter.all"
                  ? t("filter.all")
                  : "All Islands"}
              </button>
              <button
                id="filter-pier-chalong"
                onClick={() => setActiveTab("chalong")}
                type="button"
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === "chalong"
                    ? "bg-[#0F172A] text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("piers.chalong.short") !== "piers.chalong.short"
                  ? t("piers.chalong.short")
                  : "Chalong"}
              </button>
              <button
                id="filter-pier-ao-po"
                onClick={() => setActiveTab("ao-po")}
                type="button"
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === "ao-po"
                    ? "bg-[#0F172A] text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("piers.ao-po.short") !== "piers.ao-po.short"
                  ? t("piers.ao-po.short")
                  : "Ao Po"}
              </button>
              <button
                id="filter-pier-coco"
                onClick={() => setActiveTab("coco")}
                type="button"
                className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === "coco"
                    ? "bg-[#0F172A] text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t("piers.coco.short") !== "piers.coco.short"
                  ? t("piers.coco.short")
                  : "Coco"}
              </button>
              <button
                id="filter-pier-ai"
                onClick={() => setActiveTab("ai")}
                type="button"
                className={`px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-indigo-600 text-white rounded-xs"
                    : "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-850"
                }`}
              >
                <Sparkles className="h-3 w-3" /> AI Planner ✨
              </button>
              {(mode as string) !== "guide" && (
                <button
                  id="filter-pier-sequence"
                  onClick={() => setActiveTab("sequence")}
                  type="button"
                  className={`px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeTab === "sequence"
                      ? "bg-emerald-700 text-white rounded-xs"
                      : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-850"
                  }`}
                >
                  <Layers className="h-3 w-3" /> My Route Sequence 🗺️
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Grid of Islands cards */}
      {mode === "guide" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
          {/* LEFT WINDOW: SPECIFIC DESTINATION INFORMATION (50% split) */}
          <div className="lg:col-span-6 bg-slate-50 border border-[#0F172A]/10 rounded-xs p-6 md:p-8 flex flex-col justify-between shadow-xs relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-700" />

            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Compass className="h-5 w-5 text-emerald-700 shrink-0 animate-spin-slow" />
                <h4 className="text-xl font-serif font-bold text-[#0F172A] tracking-tight">
                  {translatedDestName} Almanac
                </h4>
              </div>

              {(() => {
                const guide =
                  DESTINATION_GUIDE_DATA[selectedDestId] ||
                  DESTINATION_GUIDE_DATA["custom-route"];
                return (
                  <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* History Section */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                        {guide.historyPeriod}
                      </span>
                      <h5 className="font-serif font-bold text-slate-900 mt-1 text-sm font-semibold">
                        {guide.historyTitle}
                      </h5>
                      <p className="text-xs leading-relaxed text-slate-650 font-sans">
                        {guide.historyText}
                      </p>
                    </div>

                    {/* Land Section */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#0F172A]/70 bg-slate-100 px-2 py-0.5 rounded-sm">
                        Land & Coastal Exploration
                      </span>
                      <h5 className="font-serif font-bold text-slate-900 mt-1 text-sm font-semibold">
                        {guide.landTitle}
                      </h5>
                      <p className="text-xs leading-relaxed text-slate-655 font-sans">
                        {guide.landText}
                      </p>
                    </div>

                    {/* Sea Section */}
                    <div className="space-y-2 pt-4 border-t border-slate-200">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-semibold">
                        Sea-Faring & Aquatic Pursuits
                      </span>
                      <h5 className="font-serif font-bold text-slate-900 mt-1 text-sm font-semibold">
                        {guide.seaTitle}
                      </h5>
                      <p className="text-xs leading-relaxed text-slate-655 font-sans">
                        {guide.seaText}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* RIGHT WINDOW: SELECTED DESTINATION EXPLORER (50% split) */}
          <div className="lg:col-span-6 bg-white border border-[#0F172A]/10 rounded-xs p-6 md:p-8 flex flex-col justify-between shadow-xs relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-[#0F172A]" />

            <div className="space-y-5">
              {/* Destination selector inside split window */}
              <div>
                <label className="block text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#0F172A]/60 mb-2">
                  Select Chosen Destination:
                </label>
                <div className="relative">
                  <select
                    id="destination-guide-select"
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0F172A]/15 rounded-md px-4 py-3 text-sm font-sans font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer shadow-sm"
                  >
                    {DESTINATIONS.filter((d) => d.id !== "custom-route").map(
                      (dest) => {
                        const destName =
                          t(`destinations.${dest.id}.name`) !==
                          `destinations.${dest.id}.name`
                            ? t(`destinations.${dest.id}.name`)
                            : dest.name;
                        return (
                          <option key={dest.id} value={dest.id}>
                            ⚓ {destName} ({dest.distanceNM} NM cruise)
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>
              </div>

              {/* Destination Detail content */}
              <motion.div
                key={selectedDestinationDetails.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">
                      {translatedDestName}
                    </h4>
                    {selectedDestinationDetails.thaiName && (
                      <span className="text-xs text-slate-400 font-sans block mt-0.5">
                        {selectedDestinationDetails.thaiName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono tracking-wider font-bold">
                    <span className="bg-emerald-50 text-emerald-850 px-2 py-0.5 rounded-sm">
                      {selectedDestinationDetails.distanceNM} NM
                    </span>
                    <span className="bg-slate-100 text-slate-850 px-2 py-0.5 rounded-sm">
                      ~{selectedDestinationDetails.estimatedTimeHours} HOURS
                    </span>
                  </div>
                </div>

                {/* Grid image layout */}
                {selectedDestinationDetails.imageUrls &&
                selectedDestinationDetails.imageUrls.length === 2 ? (
                  <div className="grid grid-cols-2 gap-3 h-36">
                    <div className="w-full h-full rounded-sm overflow-hidden bg-slate-100 border border-slate-200">
                      <ImageWithFallback
                        referrerPolicy="no-referrer"
                        src={selectedDestinationDetails.imageUrls[0]}
                        alt={selectedDestinationDetails.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full h-full rounded-sm overflow-hidden bg-slate-100 border border-slate-200">
                      <ImageWithFallback
                        referrerPolicy="no-referrer"
                        src={selectedDestinationDetails.imageUrls[1]}
                        alt={selectedDestinationDetails.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : selectedDestinationDetails.imageUrl ? (
                  <div className="w-full h-36 rounded-sm overflow-hidden bg-slate-100 border border-slate-200">
                    <ImageWithFallback
                      referrerPolicy="no-referrer"
                      src={selectedDestinationDetails.imageUrl}
                      alt={selectedDestinationDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-600 font-sans">
                    {translatedDestDesc}
                  </p>

                  <div className="space-y-1.5">
                    <h6 className="text-[10px] uppercase font-sans font-extrabold tracking-widest text-[#0F172A]/70">
                      Curated Highlights:
                    </h6>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {translatedDestHighlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-600 flex items-start gap-1.5 font-sans leading-snug"
                        >
                          <span className="text-emerald-700 shrink-0 mt-0.5">
                            ✔
                          </span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Selector Bottom Action */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 block font-semibold">
                  Recommended Starting Base
                </span>
                <span className="text-xs font-sans font-bold text-slate-800">
                  {selectedDestinationDetails.recommendedPierId === "chalong"
                    ? "Chalong Pier (South Phuket)"
                    : selectedDestinationDetails.recommendedPierId === "ao-po"
                      ? "Ao Po Pier (Northeast)"
                      : "Coco Pier (Phuket)"}
                </span>
              </div>
              <div className="text-xs font-sans text-slate-400 font-medium italic flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5">
                <span>ℹ Use standard steps to book this stop</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "ai" ? (
        <AIPlanner
          onSelectVessel={onSelectVessel}
          onSelectDestination={(destId) => {
            setActiveTab("all");
            setSelectedDestId(destId);
          }}
        />
      ) : activeTab === "sequence" ? (
        (() => {
          const seqTimelineData = getSequenceTimelineEvents();
          const totalSeqDistance = seqTimelineData.totalDistance;
          const isSeqPhiPhi = sequence.some((id) => id.includes("phi-phi"));
          const seqDuration = seqTimelineData.totalDuration;
          const requiredSpeed = seqTimelineData.speedKnots;
          const remainingIslands = DESTINATIONS.filter((dest) => {
            const hasComp = !!COMPOSITE_ROUTES[dest.id];
            const physicalOnly = hasComp
              ? COMPOSITE_ROUTES[dest.id].filter(
                  (p) => p !== "chalong" && p !== "ao-po" && p !== "coco",
                )
              : [dest.id];

            return (
              physicalOnly.length <= 1 &&
              !sequence.includes(dest.id) &&
              dest.id !== "custom-route" &&
              dest.id !== "the-best" &&
              dest.id !== "namaste" &&
              dest.id !== "the-one"
            );
          });

          return (
            <div
              id="drag-drop-sequence-builder"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Drag and Drop Builder Sequence list */}
              <div className="lg:col-span-5 space-y-6 w-full max-w-full overflow-hidden">
                <div className="bg-slate-50 border border-slate-200/60 p-4 sm:p-5 rounded-xs space-y-4 w-full max-w-full overflow-hidden">
                  <div>
                    <h4 className="text-sm font-sans font-bold text-slate-900 tracking-wide flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-800" />
                      Preferred Island Sequence Planner
                    </h4>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5 uppercase tracking-wider font-semibold">
                      Drag & Drop sequence order list below, or use mobile
                      carets
                    </p>
                  </div>

                  {/* Embark / Disembark Pier Selection */}
                  <div className="flex flex-col gap-3 py-3 border-y border-slate-200/60">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                        ⚓ Choice Embark Pier
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["chalong", "coco", "ao-po"].map((pId) => (
                          <button
                            key={`start-${pId}`}
                            type="button"
                            onClick={() => {
                              if (
                                (pId === "chalong" &&
                                  plannerEndPier === "coco") ||
                                (pId === "coco" && plannerEndPier === "chalong")
                              ) {
                                setPlannerEndPier(null);
                              }
                              setPlannerStartPier(pId);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                              effectiveStartPier === pId
                                ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs ring-1 ring-indigo-200/20"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                            }`}
                          >
                            <span>
                              {pId === "chalong"
                                ? "Chalong Pier"
                                : pId === "coco"
                                  ? "Coco Pier"
                                  : "Ao Po Pier"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                        🏁 Disembark Pier
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPlannerEndPier(null)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                            plannerEndPier === null
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs ring-1 ring-emerald-200/20"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span>
                            Live as is (
                            {effectiveStartPier === "chalong"
                              ? "Chalong Pier"
                              : effectiveStartPier === "coco"
                                ? "Coco Pier"
                                : "Ao Po Pier"}
                            )
                          </span>
                        </button>

                        {["chalong", "coco", "ao-po"].map((pId) => {
                          if (pId === effectiveStartPier) return null;

                          return (
                            <button
                              key={`end-${pId}`}
                              type="button"
                              onClick={() => setPlannerEndPier(pId)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-sans font-semibold border transition-all cursor-pointer select-none active:scale-[0.97] ${
                                plannerEndPier === pId
                                  ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs ring-1 ring-blue-200/20"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                              }`}
                            >
                              <span>
                                {pId === "chalong"
                                  ? "Chalong Pier"
                                  : pId === "coco"
                                    ? "Coco Pier"
                                    : "Ao Po Pier"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Connected Sequence List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {sequence.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-white rounded-xs flex flex-col items-center justify-center p-4">
                        <span className="text-2xl mb-1 select-none">🗺️</span>
                        <p className="text-xs font-bold text-slate-500">
                          Your hopping sequence is currently empty.
                        </p>
                        <p className="text-[10.5px] text-slate-400 mt-1 max-w-[200px]">
                          Use the quick selector below to attach beautiful
                          islands!
                        </p>
                      </div>
                    ) : (
                      sequence.map((seqId, idx) => {
                        const dest = DESTINATIONS.find((d) => d.id === seqId);
                        if (!dest) return null;

                        const destName =
                          t(`destinations.${dest.id}.name`) !==
                          `destinations.${dest.id}.name`
                            ? t(`destinations.${dest.id}.name`)
                            : dest.name;

                        const isDragged = draggedIndex === idx;

                        return (
                          <motion.div
                            key={seqId}
                            layout
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, idx)}
                            className={`flex items-center justify-between p-3 bg-white border rounded-xs transition-all ${
                              isDragged
                                ? "border-dashed border-emerald-500 bg-emerald-50/50 scale-[0.98] opacity-70 shadow-sm"
                                : "border-slate-200 hover:border-slate-350 cursor-grab active:cursor-grabbing"
                            }`}
                          >
                            {/* Drag Handle + Left Content */}
                            <div className="flex items-center gap-3 select-none">
                              <div className="text-slate-400 shrink-0">
                                <GripVertical className="h-4 w-4" />
                              </div>

                              <div className="flex h-5 w-5 rounded-full bg-emerald-100 text-emerald-850 text-[9px] font-mono font-bold items-center justify-center shrink-0 shadow-2xs">
                                {idx + 1}
                              </div>

                              {dest.imageUrl && (
                                <div className="h-10 w-10 rounded-sm overflow-hidden bg-slate-100 border border-slate-200/60 hidden sm:block shrink-0">
                                  <ImageWithFallback
                                    referrerPolicy="no-referrer"
                                    src={dest.imageUrl}
                                    alt={dest.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-snug tracking-tight font-sans">
                                  {destName}
                                </p>
                                <span className="text-[9.5px] text-slate-500 font-mono font-medium block">
                                  ⚓ {dest.distanceNM} NM |{" "}
                                  {dest.estimatedTimeHours} Hr cruise
                                </span>
                              </div>
                            </div>

                            {/* Right Content: Caret Actions (Accessibility/Touch Screen) + Trash */}
                            <div className="flex items-center gap-1.5 z-20">
                              {/* Caret UP */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveUp(idx)}
                                className={`p-1 rounded-sm border border-slate-200 bg-slate-50 transition-colors ${
                                  idx === 0
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-slate-100 text-slate-600 cursor-pointer"
                                }`}
                                title="Move Stop Up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>

                              {/* Caret DOWN */}
                              <button
                                type="button"
                                disabled={idx === sequence.length - 1}
                                onClick={() => handleMoveDown(idx)}
                                className={`p-1 rounded-sm border border-slate-200 bg-slate-50 transition-colors ${
                                  idx === sequence.length - 1
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-slate-100 text-slate-600 cursor-pointer"
                                }`}
                                title="Move Stop Down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>

                              {/* Delete Item Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveFromSequence(idx)}
                                className="p-1 rounded-sm border border-red-100 bg-red-50 text-red-650 hover:bg-red-100 transition-colors cursor-pointer"
                                title="Remove Stop"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown input selector for remaining islands */}
                  <div className="pt-2 border-t border-slate-200/65 font-sans w-full max-w-full">
                    {remainingIslands.length > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white p-3 border border-slate-200 rounded-sm w-full max-w-full overflow-hidden">
                        <span className="text-[9.5px] font-sans font-bold uppercase text-slate-500 shrink-0 flex items-center gap-1">
                          <Plus className="h-3 w-3 text-emerald-800" /> Quick
                          Add Island:
                        </span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddToSequence(e.target.value);
                              e.target.value = ""; // reset
                            }
                          }}
                          className="w-full min-w-0 flex-1 bg-white border border-slate-300 rounded-xs px-2 py-1.5 text-xs text-slate-755 font-sans focus:outline-none focus:border-emerald-600 cursor-pointer text-ellipsis overflow-hidden"
                        >
                          <option value="">-- Choose an island --</option>
                          {remainingIslands.map((dest) => (
                            <option key={dest.id} value={dest.id}>
                              {dest.name} ({dest.distanceNM} NM)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-sans font-bold uppercase tracking-wider rounded-xs">
                        🎉 All registered destinations are added to your
                        sequence
                      </div>
                    )}

                    {/* Quick Add Grid helper */}
                    {remainingIslands.length > 0 && (
                      <div className="space-y-1.5 mt-4 font-sans w-full max-w-full">
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block font-sans">
                          Available Islands (Click to append)
                        </span>
                        <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                          {remainingIslands.map((dest) => (
                            <button
                              key={dest.id}
                              type="button"
                              onClick={() => handleAddToSequence(dest.id)}
                              className="text-left p-2.5 bg-white border border-slate-200 rounded-xs hover:border-emerald-600/50 hover:bg-slate-100/50 transition-all flex items-center justify-between group cursor-pointer min-w-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-extrabold text-slate-800 truncate">
                                  {dest.name}
                                </p>
                                <span className="text-[8.5px] text-slate-400 font-mono block">
                                  {dest.distanceNM} NM | ~
                                  {dest.estimatedTimeHours} Hr
                                </span>
                              </div>
                              <span className="h-4.5 w-4.5 rounded-full bg-slate-150 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-750 font-bold text-[10px] flex items-center justify-center shrink-0 transition-colors ml-1">
                                +
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Path Map for custom-built chosen routes under Available Islands */}
                    <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-sans font-extrabold text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                          🧭 Plotted trajectory (Plotted waypoints only)
                        </span>
                      </div>

                      <div className="w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-xs overflow-hidden border border-slate-200/60 shadow-inner bg-slate-50 relative z-0">
                        <button
                          type="button"
                          onClick={() => setIsMapFullscreen(true)}
                          className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-slate-200 shadow-md transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-emerald-700 cursor-pointer active:scale-95"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                        <FreeMap
                          center={{ lat: 7.78, lng: 98.42 }}
                          zoom={10}
                          markers={guideMapMarkers}
                          multiPaths={guideMapPaths}
                          onMarkerClick={handleGuideMapMarkerClick}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Analytics & Generated Combined Timeline */}
              <div className="lg:col-span-12 xl:col-span-7 lg:mt-0 mt-6 lg:ml-0">
                <div className="rounded-xs border border-[#0F172A]/10 bg-white p-6 md:p-8 shadow-2xs relative">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-700" />

                  <div className="border-b border-[#0F172A]/10 pb-4 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-serif font-normal text-[#0F172A] tracking-normal flex items-center gap-1.5">
                        <Compass className="h-5 w-5 text-emerald-800" />
                        Sequence Diagnostics & Timeline
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold font-sans uppercase tracking-widest mt-1">
                        Dynamic calculations optimized around sequence order
                      </p>
                    </div>
                    {/* Compact Duration Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => {
                          if (isSeqPhiPhi) {
                            alert(
                              "Half Day tours are not available for Phi Phi Island routes due to the 12-hour maritime distance. Timeline will remain Full Day.",
                            );
                            return;
                          }
                          setTimelineDuration("halfday");
                        }}
                        className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors ${timelineDuration === "halfday" && !isSeqPhiPhi ? "bg-white text-emerald-800 shadow-3xs border border-emerald-250" : "text-slate-500 hover:text-slate-700"} ${isSeqPhiPhi ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        Half Day
                      </button>
                      <button
                        onClick={() => setTimelineDuration("fullday")}
                        className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${timelineDuration === "fullday" || isSeqPhiPhi ? "bg-white text-emerald-800 shadow-3xs border border-emerald-250" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {isSeqPhiPhi ? "12H Fixed" : "Full Day"}
                      </button>
                    </div>
                  </div>

                  {/* Diagnostics Badges Panel */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 border border-slate-200/60 rounded-xs">
                      <div>
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                          Departure Pier
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-slate-850 block truncate font-sans">
                          ⚓{" "}
                          {sequence.length > 0
                            ? PIERS.find(
                                (p) =>
                                  p.id ===
                                  (DESTINATIONS.find(
                                    (d) => d.id === sequence[0],
                                  )?.recommendedPierId || "chalong"),
                              )?.name || "Chalong Pier"
                            : "Chalong Pier"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5 font-sans">
                          Total Trajectory
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-slate-850 block font-mono">
                          📏 {totalSeqDistance.toFixed(1)} NM
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5 font-sans">
                          Charter Duration
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-[#0F172A] block font-mono">
                          ⏱️ {seqTimelineData.totalDuration} Hours
                        </span>
                      </div>
                      <div className="border-t border-slate-200/50 pt-2 mt-1 col-span-2 sm:col-span-1">
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                          Est. Sailing Time
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-emerald-800 block font-mono">
                          ⛵ {seqTimelineData.totalTransitTime.toFixed(1)} Hours
                        </span>
                      </div>
                      <div className="border-t border-slate-200/50 pt-2 mt-1">
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                          Avg. Island Stay
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-bold text-indigo-700 block font-mono">
                          🏝️{" "}
                          {seqTimelineData.leisureTimePerIsland >= 1.0
                            ? `${seqTimelineData.leisureTimePerIsland.toFixed(1)} Hours`
                            : `${Math.round(seqTimelineData.leisureTimePerIsland * 60)} Minutes`}
                        </span>
                      </div>
                      <div className="border-t border-slate-200/50 pt-2 mt-1">
                        <span className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                          Active Vessel
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block truncate font-sans">
                          🛥️ {seqTimelineData.vesselName.split(" ")[0]} (
                          {seqTimelineData.speedKnots} kts)
                        </span>
                      </div>
                    </div>

                    {/* Navigation Diagnostic Alert Callout */}
                    {seqTimelineData.warningStatus === "insufficient" && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xs text-[11px] font-medium flex items-start gap-2.5 animate-in fade-in zoom-in duration-300">
                        <span className="text-rose-600 shrink-0 text-base mt-0.5">
                          ⚠️
                        </span>
                        <div className="font-sans space-y-1">
                          <p className="font-bold text-rose-900">
                            Diagnostics: Cruising Speed / Distance Alert
                          </p>
                          <p>
                            At the selected catamaran's cruising speed of{" "}
                            <strong>{seqTimelineData.speedKnots} knots</strong>,
                            sailing this{" "}
                            <strong>{totalSeqDistance.toFixed(1)} NM</strong>{" "}
                            itinerary is physically impossible within the{" "}
                            <strong>{seqDuration}h</strong> timeline limit.
                          </p>
                          <p className="text-[10px] text-rose-700 font-semibold">
                            Required Cruising: ~
                            {(totalSeqDistance / (seqDuration - 1.0)).toFixed(
                              1,
                            )}{" "}
                            kts. Please increase charter duration to Full
                            Day/Overnight, configure a faster catamaran, or
                            remove distant islands.
                          </p>
                        </div>
                      </div>
                    )}

                    {seqTimelineData.warningStatus === "tight" && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xs text-[11px] font-medium flex items-start gap-2.5 animate-in fade-in zoom-in duration-300">
                        <span className="text-amber-500 shrink-0 text-base mt-0.5">
                          ⚠️
                        </span>
                        <div className="font-sans space-y-1">
                          <p className="font-bold text-amber-900">
                            Diagnostics: Tight Stop Schedule
                          </p>
                          <p>
                            This sequence allows only{" "}
                            <strong>
                              {Math.round(
                                seqTimelineData.leisureTimePerIsland * 60,
                              )}{" "}
                              minutes
                            </strong>{" "}
                            of exploratory stay per island stop due to sailing
                            distances.
                          </p>
                          <p className="text-[10px] text-amber-700 font-semibold">
                            Consider extending your active charter duration or
                            skipping 1 island stop for optimal leisure
                            enjoyment.
                          </p>
                        </div>
                      </div>
                    )}

                    {seqTimelineData.warningStatus === "optimal" && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xs text-[11px] font-medium flex items-start gap-2.5 animate-in fade-in zoom-in duration-300">
                        <span className="text-emerald-600 shrink-0 text-base mt-0.5">
                          ✅
                        </span>
                        <div className="font-sans space-y-1">
                          <p className="font-bold text-emerald-900">
                            Diagnostics: Perfect Itinerary Pace
                          </p>
                          <p>
                            This layout has excellent pacing! Relax with{" "}
                            <strong>
                              {seqTimelineData.leisureTimePerIsland.toFixed(1)}{" "}
                              hours
                            </strong>{" "}
                            of pure beach and exploration time at each stop.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Recalculated Sequence Timeline */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4.5 w-4.5 text-emerald-800 shrink-0" />
                      <span className="text-[11px] uppercase tracking-widest font-sans font-bold text-[#0F172A] block leading-none">
                        Sequence Itinerary Map
                      </span>
                    </div>

                    <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:top-[12px] before:bottom-[12px] before:left-[11px] sm:before:left-[13px] before:w-0.5 before:border-l-2 before:border-dashed before:border-slate-200/75">
                      {seqTimelineData.events.map((ev, index) => (
                        <div
                          key={index}
                          className="relative group flex flex-col gap-1 pr-1"
                        >
                          {/* Circle dot */}
                          <div className="absolute -left-[22px] sm:-left-[26px] top-1.5 flex items-center justify-center z-10">
                            <div
                              className={`h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full flex items-center justify-center ring-4 ring-white ${ev.color} text-white shadow-sm transition-transform group-hover:scale-105`}
                            >
                              {ev.icon === "ship" && (
                                <Ship className="h-2.5 w-2.5" />
                              )}
                              {ev.icon === "pin" && (
                                <MapPin className="h-2.5 w-2.5" />
                              )}
                              {ev.icon === "waves" && (
                                <Waves className="h-2.5 w-2.5" />
                              )}
                              {ev.icon === "lunch" && (
                                <Utensils className="h-2.5 w-2.5" />
                              )}
                              {ev.icon === "anchor" && (
                                <Anchor className="h-2.5 w-2.5" />
                              )}
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className="bg-[#FAF9F6] border border-slate-200/40 rounded-xs p-3.5 transition-all group-hover:bg-slate-50 group-hover:border-slate-300">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                              <span className="text-[9.5px] font-mono font-extrabold text-slate-700 bg-white border border-slate-250/60 px-2 py-0.5 rounded-sm uppercase tracking-wide inline-block w-fit shadow-3xs">
                                {ev.time}
                              </span>
                              <span className="text-[9px] font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                📍 {ev.location}
                              </span>
                            </div>
                            <h6 className="text-[11.5px] font-extrabold text-[#0F172A] font-sans">
                              {ev.title}
                            </h6>
                            <p className="text-[11px] leading-relaxed text-slate-500 font-sans mt-0.5">
                              {ev.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Auto-synchronized and Proceed control */}
                  <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col gap-3">
                    <button
                      type="button"
                      id="btn-lock-custom-route-complete"
                      onClick={() => {
                        if (sequence.length === 0) {
                          alert(
                            "Please add at least one destination to lock in your custom hopping route sequence!",
                          );
                          return;
                        }
                        if (onCompleteBooking) {
                          onCompleteBooking(timelineDuration);
                        }

                        setTimeout(() => {
                          // 1. Dispatch custom sequence to booking form
                          window.dispatchEvent(
                            new CustomEvent("add-destination-to-route", {
                              detail: {
                                destinationIds: sequence,
                                preventStepChange: true,
                              },
                            }),
                          );
                          // 2. Dispatch duration configure event
                          window.dispatchEvent(
                            new CustomEvent("configure-booking-trip", {
                              detail: { duration: timelineDuration },
                            }),
                          );
                          // 3. Dispatch jump to Party Theme (step 4)
                          window.dispatchEvent(
                            new CustomEvent("goto-booking-step", {
                              detail: { step: 4 },
                            }),
                          );
                        }, 500);
                      }}
                      className="w-full py-4 bg-emerald-700 hover:bg-emerald-850 text-white font-sans font-extrabold text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs transition-all duration-300"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-100 animate-pulse shrink-0" />
                      <span>Lock In Custom Route & Go To Booking ⚓</span>
                    </button>

                    <p className="text-[10.5px] text-center text-slate-500 font-sans leading-relaxed">
                      This action locks in your island sequence & selected{" "}
                      <strong>
                        {timelineDuration === "halfday"
                          ? "Half Day"
                          : "Full Day"}
                      </strong>{" "}
                      duration to the main booking worksheet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Right Side: Destination Interactive list */}
          <div className="md:col-span-1 md:order-2 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredDestinations.map((dest) => {
              const isActive = selectedDestId === dest.id;
              const destName =
                t(`destinations.${dest.id}.name`) !==
                `destinations.${dest.id}.name`
                  ? t(`destinations.${dest.id}.name`)
                  : dest.name;

              return (
                <motion.button
                  key={dest.id}
                  id={`itinerary-item-${dest.id}`}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedDestId(dest.id)}
                  type="button"
                  className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${
                    isActive
                      ? "border-[#0F172A] bg-[#FAF9F6] shadow-2xs"
                      : "border-slate-100 bg-white hover:border-slate-350"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-850 tracking-tight font-sans">
                      {destName}
                    </span>
                    <span className="text-[10px] text-[#0F172A] font-mono font-medium tracking-wide">
                      {dest.distanceNM} NM
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-505 font-sans font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      <Clock className="h-2.5 w-2.5 text-slate-500" />{" "}
                      {dest.estimatedTimeHours}{" "}
                      {t("map.hour") !== "map.hour" ? t("map.hour") : "Hr"}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Left Side: Detailed destination overview card */}
          <div className="md:col-span-2 md:order-1">
            <motion.div
              key={selectedDestinationDetails.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xs border border-[#0F172A]/10 bg-white p-6 md:p-8 shadow-2xs relative overflow-hidden"
            >
              {/* Top dark accent line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-[#0F172A]" />

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-serif font-normal text-[#0F172A] tracking-wide">
                      {translatedDestName}
                    </h4>
                    {selectedDestinationDetails.thaiName && (
                      <span className="text-xs text-slate-400 font-sans">
                        ({selectedDestinationDetails.thaiName})
                      </span>
                    )}
                  </div>
                </div>

                {hasRouteMap(selectedDestinationDetails.id) && (
                  <button
                    id={`btn-view-route-${selectedDestinationDetails.id}`}
                    onClick={() =>
                      setRouteModalData({
                        id: selectedDestinationDetails.id,
                        name: selectedDestinationDetails.name,
                      })
                    }
                    type="button"
                    className="mt-3 sm:mt-0 text-[10px] font-sans font-bold uppercase tracking-widest py-2 px-3 bg-slate-100 text-[#0F172A] border border-[#0F172A]/10 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    View Route
                  </button>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-650 mb-6 font-sans">
                {translatedDestDesc}
              </p>

              {selectedDestinationDetails.imageUrls &&
              selectedDestinationDetails.imageUrls.length === 2 ? (
                <div className="w-full h-48 sm:h-56 mb-6 flex gap-1 rounded-xs overflow-hidden">
                  <div className="flex-1 overflow-hidden relative">
                    <ImageWithFallback
                      referrerPolicy="no-referrer"
                      src={selectedDestinationDetails.imageUrls[0]}
                      alt={selectedDestinationDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <ImageWithFallback
                      referrerPolicy="no-referrer"
                      src={selectedDestinationDetails.imageUrls[1]}
                      alt={selectedDestinationDetails.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : selectedDestinationDetails.imageUrl ? (
                <div className="w-full h-48 sm:h-56 mb-6 rounded-xs overflow-hidden bg-slate-200 border border-slate-300 relative">
                  <ImageWithFallback
                    referrerPolicy="no-referrer"
                    src={selectedDestinationDetails.imageUrl}
                    alt={selectedDestinationDetails.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {/* Quick stats panel */}
              <div className="grid grid-cols-3 gap-px bg-[#0F172A]/10 border-y border-[#0F172A]/10 py-5 mb-6">
                <div className="bg-white p-2">
                  <Compass className="h-3.5 w-3.5 text-[#0F172A]/60 mb-1" />
                  <p className="text-[9px] text-slate-400 font-sans uppercase tracking-widest">
                    {t("map.distance") !== "map.distance"
                      ? t("map.distance")
                      : "Distance"}
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedDestinationDetails.distanceNM} NM
                  </p>
                </div>

                <div className="bg-white p-2 px-3">
                  <Clock className="h-3.5 w-3.5 text-[#0F172A]/60 mb-1" />
                  <p className="text-[9px] text-slate-400 font-sans uppercase tracking-widest">
                    {t("map.transit") !== "map.transit"
                      ? t("map.transit")
                      : "Transit Time"}
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    ~{selectedDestinationDetails.estimatedTimeHours}{" "}
                    {t("map.hours") !== "map.hours" ? t("map.hours") : "hours"}
                  </p>
                </div>

                <div className="bg-white p-2">
                  <Ship className="h-3.5 w-3.5 text-[#0F172A]/60 mb-1" />
                  <p className="text-[9px] text-slate-400 font-sans uppercase tracking-widest">
                    {t("map.excursion") !== "map.excursion"
                      ? t("map.excursion")
                      : "Excursion"}
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {t("map.private") !== "map.private"
                      ? t("map.private")
                      : "100% Private"}
                  </p>
                </div>
              </div>

              {/* Sights Highlights */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-widest font-sans font-bold text-[#0F172A] block mb-3 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-500" />
                  {t("map.features") !== "map.features"
                    ? t("map.features")
                    : "Signature Tour Experiences"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {translatedDestHighlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-[#FAF9F6] p-3 border border-slate-200/40 rounded-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="text-xs leading-relaxed text-slate-700 font-sans">
                        {h}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Visual Live Timeline View */}
              <div
                id="live-timeline-card"
                className="mt-8 pt-8 border-t border-slate-200/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-emerald-700 shrink-0 animate-pulse" />
                    <div>
                      <h5 className="text-[11px] uppercase tracking-widest font-sans font-bold text-[#0F172A] block leading-none">
                        Live Itinerary Timeline
                      </h5>
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                        Auto-calibrated based on local speed coordinates
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Duration Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200">
                      <button
                        onClick={() => {
                          if (isPhiPhi) {
                            alert(
                              "Half Day tours are not available for Phi Phi Island routes due to the 12-hour maritime distance. Timeline will remain Full Day.",
                            );
                            return;
                          }
                          setTimelineDuration("halfday");
                        }}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors ${!isFullDay ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/50" : "text-slate-500 hover:text-slate-700"} ${isPhiPhi ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        Half Day
                      </button>
                      <button
                        onClick={() => setTimelineDuration("fullday")}
                        className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${isFullDay ? "bg-white text-emerald-800 shadow-xs border border-emerald-200/50" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {isPhiPhi ? "12H Fixed" : "Full Day"}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-sm border border-emerald-200/50 flex items-center gap-1">
                      ⏱️ {totalDuration} Hours Total Excursion
                    </span>
                  </div>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] sm:before:left-[15px] before:w-0.5 before:border-l-2 before:border-dashed before:border-slate-200">
                  {timelineEvents.map((ev, index) => (
                    <div
                      key={index}
                      className="relative group flex flex-col gap-1 pr-1"
                    >
                      {/* Timeline Dot Indicator */}
                      <div className="absolute -left-[22px] sm:-left-[26px] top-1.5 flex items-center justify-center z-10">
                        <div
                          className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ring-4 ring-white ${ev.color} text-white shadow-sm transition-transform group-hover:scale-110`}
                        >
                          {ev.icon === "ship" && (
                            <Ship className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                          {ev.icon === "pin" && (
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                          {ev.icon === "waves" && (
                            <Waves className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                          {ev.icon === "lunch" && (
                            <Utensils className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                          {ev.icon === "anchor" && (
                            <Anchor className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          )}
                        </div>
                      </div>

                      {/* Timeline Content Block */}
                      <div className="bg-[#FAF9F6] border border-slate-250/50 rounded-xs p-3.5 transition-all group-hover:bg-slate-50 group-hover:border-slate-300">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-white border border-slate-250/60 px-2 py-0.5 rounded-sm uppercase tracking-wide inline-block w-fit">
                            {ev.time}
                          </span>
                          <span className="text-[9.5px] font-sans font-bold text-slate-450 uppercase tracking-wild flex items-center gap-1">
                            📍 {ev.location}
                          </span>
                        </div>
                        <h6 className="text-[12px] font-extrabold text-[#0F172A] font-sans mt-1">
                          {ev.title}
                        </h6>
                        <p className="text-[11.5px] leading-relaxed text-slate-600 font-sans mt-1">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Advice Panel */}
                <div className="mt-8 p-4 bg-slate-50/85 border border-slate-200/60 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm select-none mt-0.5">🌟</span>
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11.5px]">
                        Dynamic Tides & Wind Alignment
                      </span>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                        Excursion speeds and navigation segments are optimized
                        around actual currents, ensuring ultra-stable yachting
                        angles and max efficiency.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Sync / QR Code Generator */}
                <div className="mt-4 p-4 border border-slate-200/60 rounded-xs flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur">
                  <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                    <h6 className="text-[12px] font-bold text-slate-800">
                      Mobile Itinerary Sync
                    </h6>
                    <p className="text-[10px] text-slate-500 max-w-xs">
                      Scan this QR code to quickly download this {totalDuration}
                      -hour itinerary route connection to your mobile device.
                    </p>
                  </div>
                  <div className="shrink-0 p-2 border border-slate-100 rounded-lg shadow-sm bg-white">
                    <QRCodeSVG
                      value={`${typeof window !== "undefined" ? window.location.origin : "https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app"}?vessel=${currentVesselId}&route=${sequence.join(",")}&duration=${timelineDuration}`}
                      size={96}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {isMapFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shadow-sm bg-white z-[110]">
              <h3 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-700" />
                Plotted Trajectory Explorer
              </h3>
              <button
                type="button"
                onClick={() => setIsMapFullscreen(false)}
                className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 border border-slate-200 p-2 px-3 rounded-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Minimize2 className="h-3.5 w-3.5" /> Close Fullscreen
              </button>
            </div>
            <div className="flex-1 relative bg-slate-50 w-full h-full">
              <FreeMap
                center={{ lat: 7.78, lng: 98.42 }}
                zoom={10}
                markers={guideMapMarkers}
                multiPaths={guideMapPaths}
                onMarkerClick={handleGuideMapMarkerClick}
              />
            </div>
          </div>,
          document.body,
        )}

      <RouteMapModal
        isOpen={!!routeModalData}
        onClose={() => setRouteModalData(null)}
        routeId={routeModalData?.id || ""}
        routeName={routeModalData?.name || ""}
      />
    </div>
  );
}
