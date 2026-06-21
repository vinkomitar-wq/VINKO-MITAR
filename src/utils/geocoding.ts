export interface GPSCoords {
  lat: number;
  lng: number;
}

export const PHUKET_LANDMARKS = [
  { name: "Chalong Pier, Phuket (Yacht Club)", lat: 7.8214, lng: 98.3376 },
  {
    name: "Ao Po Grand Marina, Phuket (East Coast)",
    lat: 8.0716,
    lng: 98.4429,
  },
  { name: "Yacht Haven Marina, Phuket (North)", lat: 8.1685, lng: 98.3533 },
  { name: "Royal Phuket Marina, Phuket", lat: 7.9515, lng: 98.3934 },
  { name: "Phuket Boat Lagoon, Ko Kaeo", lat: 7.9654, lng: 98.3969 },
  { name: "Bang Rong Pier, Phuket (East Coast)", lat: 8.0503, lng: 98.4172 },
  { name: "Rawai Beach, Phuket (South)", lat: 7.7755, lng: 98.3218 },
  {
    name: "Patong Beach Jetty, Phuket (West Coast)",
    lat: 7.8967,
    lng: 98.2936,
  },
  {
    name: "Ko Racha Yai Island (Southern Vessel Anchorage)",
    lat: 7.6044,
    lng: 98.3697,
  },
  { name: "Ko Phi Phi Don Anchorage (Ton Sai)", lat: 7.7394, lng: 98.7699 },
  { name: "Phromthep Cape Anchorage, Phuket", lat: 7.7621, lng: 98.3072 },
  { name: "Rassada Pier, Phuket (Ferry Terminal)", lat: 7.8791, lng: 98.4184 },
];

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function reverseGeocode(
  coords: GPSCoords | null | undefined,
): Promise<string> {
  if (
    !coords ||
    typeof coords.lat !== "number" ||
    typeof coords.lng !== "number"
  ) {
    return "Nije zabilježeno";
  }

  const { lat, lng } = coords;

  // 1. Check if it matches a known Phuket landmark within 1.5 km
  for (const landmark of PHUKET_LANDMARKS) {
    const dist = calculateDistance(lat, lng, landmark.lat, landmark.lng);
    if (dist <= 1.5) {
      // 1.5 km tolerance
      return landmark.name;
    }
  }

  // 2. Fetch from OSM Nominatim (with user-agent and timeout safeguards)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en-US,en;q=0.9,hr;q=0.8",
          "User-Agent": "YachtCharterBrokerCRMApp/1.0",
        },
      },
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || addr.pedestrian || "";
        const suburb = addr.suburb || addr.quarter || "";
        const city = addr.city || addr.town || addr.village || "";
        const island = addr.island || addr.archipelago || "";

        const parts: string[] = [];
        if (street) parts.push(street);
        if (island) parts.push(island);
        else if (suburb) parts.push(suburb);
        if (city) parts.push(city);

        if (parts.length > 0) {
          return parts.join(", ");
        }

        if (data.display_name) {
          // Truncate overly long display names
          return data.display_name.split(",").slice(0, 3).join(",").trim();
        }
      }
    }
  } catch (err) {
    console.warn("External reverse geocoding fetch failed:", err);
  }

  // 3. Last fallback: formatted coordinates
  return `Sidrište (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
}
