export interface Catamaran {
  id: string;
  name: string;
  model: string;
  image: string;
  images?: string[];
  cabinImages?: string[];
  videoUrl?: string;
  capacity: number;
  length: string;
  cabins: number;
  bathrooms: number;
  description: string;
  highlights: string[];
  amenities: string[];
  partySuitability?: string;
  isPrivateCharter?: boolean;
  specs: {
    crew: number;
    speed: string;
    built: string;
    engines?: string;
    generator?: string;
    inverter?: string;
    winch?: string;
    fishfinder?: string;
    airconSystem?: string;
  };
}

export interface Pier {
  id: string;
  name: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface Destination {
  id: string;
  name: string;
  thaiName?: string;
  description: string;
  estimatedTimeHours: number;
  recommendedPierId: string; // recommended start point
  highlights: string[];
  keyActivities?: string[];
  distanceNM: number;
  imagePlaceholder: string; // Lucide or style color block
  imageUrl?: string;
  imageUrls?: string[]; // photo URL
  videoUrl?: string; // Add video link support
  priceOverlay?: number;
}

export interface BookingState {
  vesselId: string;
  startPierId: string;
  endPierId: string;
  destinations: string[]; // selected multi destinations
  charterDate: string;
  departureTime: string;
  arrivalTime: string;
  guestCount: number;
  guestsAdults: number;
  guestsKids: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests: string;
  celebrationPackage: "none" | "birthday" | "anniversary" | "corporate";
  addWaterSlider: boolean;
  addInflatablePool: boolean;
  addCabinRental: boolean;
  cabinCount: number;
  addGasBBQ: boolean;
  addCharcoalBBQ: boolean;
  extraWatermelon: number; // 0 indicates none, or 1-5
  extraSnack: number; // 0 indicates none, or 1-20
  extraPineapple: number; // 0 indicates none, or 1-10
  addKaraoke: boolean;
  addLongtailBoat: boolean;
  addMayaBayTicketAndLongtail: boolean;
  addJetski: boolean;
  jetskiCount: number;
  jetskiDuration: string; // e.g., "30m", "1h", "2h"
  addMinibusTransfer: boolean;
  transferMarina: "chalong" | "ao-po" | "coco";
  transferGuests: number;
  transferPickupAddress: string;
  guideLanguage:
    | "none"
    | "english"
    | "indian"
    | "chinese"
    | "south-korean"
    | "arabic"
    | "russian";
  fishingRodsCount: number; // 0 to 5
  fishingHandlinesCount: number; // 0 to 10
  addJamesBondTicket: boolean;
  charterDuration: "halfday" | "fullday" | "overnight";
  halfDaySlot?: "morning" | "afternoon" | "sunset";
  overnightDays: number; // 1 to 7 days
  foodOption: string;
  addBartender: boolean;
  bartenderCount: number; // 1 to 3
  addBirthdayCake: boolean;
  birthdayCakeCount: number; // 1 to 5
  addPhotographer: boolean;
  addDJ: boolean;
  addDroneVideography: boolean;
  addFlowerBouquet: boolean;
  flowerBouquetCount: number;
  addChampagne: boolean;
  champagneCount: number;
  addPartyDecorations: boolean;
  redWineBottles: number;
  whiteWineBottles: number;
  beerCartons: number;
  addSashimi: boolean;
  addParasailing: boolean;
  addBananaBoat: boolean;
  addRubberCanoe: boolean;
  rubberCanoeCount: number;
  hotelPickupLocation: string;
  customInclusions?: string[];
  customExclusions?: string[];
  customAddonKeys?: string[];
}

export interface BookingRecord {
  id: string;
  customerUid: string;
  charterDate: string;
  vesselId1: string;
  price1: string;
  clientName: string;
  createdAt: string;
}

export interface StandardExtra {
  key: string;
  label: string;
  defaultPrice: number;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
}
