import { Catamaran, Pier, Destination, StandardExtra } from "./types";

export const GLOBAL_ROUTE_PRICING: Record<string, number> = {};
export const GLOBAL_EXTRA_PRICING: Record<string, number> = {};

export const STANDARD_EXTRAS: StandardExtra[] = [
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

export const CATAMARANS: Catamaran[] = [
  {
    id: "the-best",
    name: "The Best",
    model: "Catlante 600",
    image:
      "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544333323-167812e95a32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605281317010-fe5fed93a4c6?auto=format&fit=crop&w=800&q=80",
    ],
    capacity: 45,
    videoUrl: "https://www.youtube.com/watch?v=scg136qDclY",
    length: "60 ft (18.3m)",
    cabins: 6,
    bathrooms: 6,
    description:
      "Built for absolute stability and superb celebration space, 'The Best' is a majestic double-hulled yacht spacious enough to host up to 45 guests for daytime cruises, plus full overnight charters. Equipped with 6 luxurious Air-Conditioned (AC) cabins and a fully air-conditioned main saloon area, it welcomes overnight groups looking for tailored adventures. Sleep secure and navigate gorgeous remote islands with custom itinerary routes determined by customer choice or mutual agreement. For all multi-day overnight adventures, delicious full-board packages consisting of fresh Breakfast, Lunch, and Dinner are completely included inside the experience.",
    highlights: [
      "6 fully Air-Conditioned luxury double cabins + modern saloon Air-Conditioning",
      "Overnight full board included: Delectable Breakfast, Lunch, and Dinner freshly prepared onboard",
      "Flexible cruise route set entirely by customer choice or master captain agreement",
      "Expansive flying bridge with continuous 360° scenic Andaman panoramas",
      "Excellent choice for massive birthday parties, premium celebrations, and corporate groups (up to 45 day guests)",
      "Exclusive Charcoal Barbecue setup on the deck",
      "Premium café espresso machine with unlimited cups included",
      "32-inch Smart TV with Netflix & YouTube for your kids",
      "Free high-speed onboard WiFi (speed depends on active connections)",
      "3 cooler boxes to keep your drinks perfectly ice-cold",
      "Equipped with standard marine First Aid Kit",
      "Equipped with tablets for sea sickness (provided free of charge)",
      "Comprehensive Marine Travel Insurance Included",
    ],
    amenities: [
      "6 Air-Conditioned Cabins",
      "Saloon Air Conditioning",
      "Overnight Catering (Breakfast, Lunch, Dinner Included)",
      "Custom Route Planning (By Choice or Agreement)",
      "Power Generator & Ice Maker",
      "Premium integrated sound system with Bluetooth",
      "Full Snorkeling Apparatus & SUP (Stand-Up Paddleboard)",
      "Ocean Canoe",
      "Charcoal Barbecue (Exclusive to The Best)",
      "Onboard Café Espresso Machine (Free Unlimited Servings)",
      'Onboard 32" Smart TV with Netflix & YouTube',
      "Free Onboard WiFi Internet (Speed dependent on connected users)",
      "3 Cooler Boxes for Cold Drinks",
      "Onboard First Aid Kit",
      "Sea Sickness Tablets (Free of Charge)",
      "Travel Insurance Included",
    ],
    partySuitability:
      "Outstanding for birthday parties & dynamic celebrations of any kind (up to 45 guests)",
    isPrivateCharter: true,
    specs: {
      crew: 4,
      speed: "Max speed 7 kts/h or nm/h",
      built: "Refitted 2023",
      engines: "Powered by 2x Volvo Penta 75 HP engines",
      generator: "Onan 11 kW Generator",
      inverter: "Inverter 220V / 5 kW",
      winch: "Electric winch for Jib & Main sail",
      fishfinder: "Professional Fishfinder & sonar system",
      airconSystem: "Chiller (quiet) air-conditioning system",
    },
  },
  {
    id: "namaste",
    name: "NAMASTE",
    model: "Imp 55",
    image:
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=800&q=80",
    ],
    capacity: 45,
    videoUrl: "https://www.youtube.com/watch?v=kY73zCiz7lQ",
    length: "55 ft (16.8m)",
    cabins: 4,
    bathrooms: 3,
    description:
      "Elegant, spirited, and exquisitely dynamic. ‘NAMASTE’ is a high-performance Imp 55 catamaran designed for up to 45 guests. Easily identifiable by its distinctive green registration letters '5751 00430 NAMASTE' on the starboard bow and its iconic sandy beige deck canvas sunshade. Designed for true ocean sailing, it offers stylish wood trim decks, a shaded cockpit lounge, and 1 air-conditioning unit in the main cabin saloon.",
    highlights: [
      "Custom-fitted sandy beige awning canopy providing generous main-deck sun relief",
      "Official starboard bow lettering: '5751 00430 NAMASTE' for clear marine identification",
      "Sleek aerodynamic aerodynamic-hull lines with impressive cruising stability in any tide",
      "Sophisticated open-air deck area perfect for private sunset dining & ocean photography",
      "1 dedicated Air Conditioning unit in the saloon area with premium Bluetooth music surroundings",
      "1 cooler box to keep your drinks perfectly ice-cold",
      "Equipped with standard marine First Aid Kit",
      "Equipped with tablets for sea sickness (provided free of charge)",
      "Comprehensive Marine Travel Insurance Included",
    ],
    amenities: [
      "1 Air Conditioning Unit (Saloon Only)",
      "Snorkeling gear",
      "Premium music system with Bluetooth",
      "Onboard refreshments",
      "Stand-up paddleboard",
      "Swim ladder on both sides & beach towels",
      "Ocean Canoe",
      "1 Cooler Box for Cold Drinks",
      "Onboard First Aid Kit",
      "Sea Sickness Tablets (Free of Charge)",
      "Travel Insurance Included",
    ],
    partySuitability:
      "Great for elegant social gatherings, sunsets, and premium family getaways",
    isPrivateCharter: true,
    specs: {
      crew: 4,
      speed: "Max speed 7 kts/h or nm/h",
      built: "Refitted 2024",
    },
  },
  {
    id: "the-one",
    name: "THE ONE",
    model: "LEOPARD 47",
    image:
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=800&q=80",
    capacity: 40,
    videoUrl: "https://www.youtube.com/watch?v=rJ1zXb8C1fQ",
    length: "47 ft (14.3m)",
    cabins: 4,
    bathrooms: 2,
    description:
      "Crafted by world-renowned Robertson & Caine, ‘THE ONE’ is a highly sought-after Leopard 47. Boasting a unique forward cockpit, direct access from the saloon, and an immersive sunbed lounge on the coachroof.",
    highlights: [
      "Signature forward-facing social cockpit dining table",
      "Leopard luxury styling with natural varnished timber paneling",
      "Upper-deck sunbed platform adjacent to helm command",
      "Atmospheric underwater ocean lighting",
      "1 cooler box to keep your drinks perfectly ice-cold",
      "Equipped with standard marine First Aid Kit",
      "Equipped with tablets for sea sickness (provided free of charge)",
      "Comprehensive Marine Travel Insurance Included",
    ],
    amenities: [
      "Snorkeling gear",
      "Modern music system",
      "Onboard refreshments & soft drinks",
      "1 Cooler Box for Cold Drinks",
      "Fresh water deck shower",
      "Fully loaded safety vests",
      "Ocean Canoe",
      "Onboard First Aid Kit",
      "Sea Sickness Tablets (Free of Charge)",
      "Travel Insurance Included",
    ],
    partySuitability:
      "Ideal for cozy families, couples, and intimate friend excursions",
    specs: {
      crew: 3,
      speed: "Max speed 7 kts/h or nm/h",
      built: "2021",
    },
  },
];

export const PIERS: Pier[] = [
  {
    id: "chalong",
    name: "Chalong Pier",
    location: "South Phuket",
    description:
      "The primary maritime hub of Phuket. Ideally situated for south-bound sailing excursions to pristine tropical islands, featuring an easy-access floating pontoon and vibrant port infrastructure.",
    latitude: 7.8214,
    longitude: 98.3412,
  },
  {
    id: "ao-po",
    name: "Ao Po Pier",
    location: "Northeast Phuket",
    description:
      "A prestigious deep-water luxury harbor. Located in the north-east, it serves as the perfect launchpad to Phang Nga Bay and James Bond Island, with 24-hour access unaffected by local tides.",
    latitude: 8.0716,
    longitude: 98.4415,
  },
  {
    id: "coco",
    name: "Coco Pier",
    location: "Phuket",
    description:
      "A convenient pier serving as a starting point for various excursions.",
    latitude: 7.8231,
    longitude: 98.4036,
  },
];

export const DESTINATIONS: Destination[] = [
  {
    id: "custom-route",
    name: "Custom Route (Plan Your Own)",
    thaiName: "เส้นทางแบบกำหนดเอง (วางแผนด้วยตัวเอง)",
    description:
      "Work directly with our agents and captain to forge a completely bespoke itinerary based on your preferences, sea state, and schedule.",
    estimatedTimeHours: 0,
    recommendedPierId: "chalong",
    distanceNM: 0,
    highlights: [
      "Completely personalized exploration based on your unique desires",
      "Captain advice and guidance towards hidden bays upon request",
      "Ultimate freedom to linger or cruise at your leisure",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "prompteph",
    name: "Phromthep Cape",
    thaiName: "แหลมพรหมเทพ",
    description:
      "Phuket's legendary southern headland. Renowned for spectacular, open-water sea breeze views alongside dramatic granite cliffs and the iconic golden-hour Andaman sunset backdrop.",
    estimatedTimeHours: 1.5,
    recommendedPierId: "chalong",
    distanceNM: 6.5,
    highlights: [
      "Iconic golden hour sunset vista from the luxury of your yacht deck",
      "Pristine coastal breeze cruising alongside towing volcanic headlands",
      "Excellent photo opportunities with deep-blue ocean contrasts",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1505235687559-28b5f54645b7?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "james-bond",
    name: "James Bond Island (Koh Tapu)",
    thaiName: "เกาะตะปู",
    description:
      "Geologically known as Ko Ta Pu, this world-renowned needle-shaped limestone karst stands proudly within Phang Nga Bay's tranquil, emerald-green waters. Surrounded by mystic sea caves and lush mangrove estuaries.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "ao-po",
    distanceNM: 17.3,
    highlights: [
      "Iconic 'needle' karst tower popularized in 'The Man with the Golden Gun'",
      "Canoe explorations through incredible hollow limestone Hong caves",
      "Breathtaking views of evergreen mangrove forests in ancient bays",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1537952303821-6d48386348ef?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-south",
    name: "Coral Island (Ko He South)",
    thaiName: "เกาะเฮ ฝั่งใต้",
    description:
      "The quiet, pristine back-beach side of Coral Island. Highly beloved for shallow snorkeling in calm, blue waters with friendly hornbills nestling in wild beach trees.",
    estimatedTimeHours: 1.0,
    recommendedPierId: "chalong",
    distanceNM: 4.8,
    highlights: [
      "Peaceful snorkeling in ultra-clear waters with resident marine life",
      "Calm, private sands ideal for customized premium picnic lunches",
      "Excellent visibility away from dominant public catamaran groupings",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-north-banana-beach",
    name: "Banana Beach (Ko He Island)",
    thaiName: "เกาะเฮ ฝั่งเหนือ (บานาน่าบีช)",
    description:
      "Phuket's elite beach playground. Features premium eco-designed bamboo pavilions nested against lush jungle, white-sand access, and dynamic premium water sports.",
    estimatedTimeHours: 1.0,
    recommendedPierId: "chalong",
    distanceNM: 5.2,
    highlights: [
      "Pristine sands with spectacular, architectural bamboo shading hubs",
      "Exciting options: professional parasailing, custom sea walk and banana boats",
      "Fabulous snorkeling right off the sand's edge with colorful marine fishes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-racha-yai",
    name: "Racha Yai Island (Koh Racha Yai)",
    thaiName: "เกาะราชาใหญ่",
    description:
      "Features majestic white-sand bays carved into lush volcanic hillsides. Racha Yai boasts incredibly high visibility underwater, making it the top destination for scuba diving and swimming in azure waters.",
    estimatedTimeHours: 2.0,
    recommendedPierId: "chalong",
    distanceNM: 11.9,
    highlights: [
      "Stunning semi-circular beach at Patok Bay with powdery sands",
      "Perfect swimming and SNUBA snorkeling conditions year-round",
      "Exquisite turquoise bay backdrops ideal for luxury vessel photography",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-racha-noi",
    name: "Racha Noi Island (Koh Racha Noi)",
    thaiName: "เกาะราชาน้อย",
    description:
      "The wild, uninhabited sister island to Racha Yai. Fringed by immense granite boulders and deep-water drop-offs that invite larger pelagic marine life. Pristine, quiet, and absolutely breathtaking.",
    estimatedTimeHours: 3.0,
    recommendedPierId: "chalong",
    distanceNM: 17.8,
    highlights: [
      "Raw volcanic granite landscapes reminiscent of Similan islands",
      "Untouched diving reefs with frequent manta ray and marine turtle sightings",
      "Ultra-transparent sapphire waters far from the tourist trails",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "maithon",
    name: "Maiton Island (Koh Mai Thon)",
    thaiName: "เกาะไม้ท่อน",
    description:
      "Often called 'Dolphin Island' because a resident pod of wild bottlenose dolphins plays near its shores. Highly exclusive, secluded island offering peaceful snorkeling right off the catamaran decks.",
    estimatedTimeHours: 1.5,
    recommendedPierId: "chalong",
    distanceNM: 8.1,
    highlights: [
      "Observe pods of wild Phuket bottlenose dolphins playing in the surf",
      "Remarkably pristine private beach coral reef ecosystem",
      "Calm, peaceful ocean waves far away from speedboat congestion",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-khai-nok",
    name: "Khai Nok Island (Koh Khai Nok)",
    thaiName: "เกาะไข่นอก",
    description:
      "A delightful tropical gem situated east of Phuket. Beloved for its pristine white-sand crescent, crystal shallow shores, and knee-deep wading directly among hundreds of friendly schooling fishes.",
    estimatedTimeHours: 2.0,
    recommendedPierId: "chalong",
    distanceNM: 9.5,
    highlights: [
      "Incredibly safe, shallow sand wading perfect for all age groups and children",
      "Dazzling, dense schools of yellow-striped sergeant majors playing directly near the shore",
      "Charming wooden local beach hut bars serving freshly cracked coconuts and cool juices",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1560295191-10dc6609ec25?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-ko-racha-yai-prompteph",
    name: "Coral Island • Racha Yai • Phromthep Cape",
    thaiName: "เกาะเฮ • เกาะราชาใหญ่ • แหลมพรหมเทพ",
    description:
      "The premier yachting trilogy. Clear shallow snorkeling at Coral Island, followed by pristine underwater exploration at Racha Yai, culminating in a majestic twilight sunset in front of Promthep Cape.",
    estimatedTimeHours: 4.5,
    recommendedPierId: "chalong",
    distanceNM: 21.0,
    highlights: [
      "Comprehensive cruise pathway bridging three premier Andaman highlights",
      "Exceptional turquoise bay snorkeling and diving at magnificent Racha Yai",
      "Staggering evening dinner panorama under the golden twilight cliffs of Promthep",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "maithon-ko-he",
    name: "Maiton • Coral Island",
    thaiName: "เกาะไม้ท่อน • เกาะเฮ",
    description:
      "The classic high-recommendation catamaran family cruise. Search for Maithon's resident wild bottlenose dolphin pod, then anchor at Coral Island's powdery white crescent for swimming.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "chalong",
    distanceNM: 12.0,
    highlights: [
      "High probability of encountering friendly wild dolphin families playing in the surf",
      "Active shallow coral snorkeling alongside diverse parrotfish and sergeant majors",
      "Splendid beachside relaxation and premium stand-up paddleboarding (SUP)",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1505322033502-1f4385692e6a?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "maithon-ko-racha-yai",
    name: "Maiton • Racha Yai",
    thaiName: "เกาะไม้ท่อน • เกาะราชาใหญ่",
    description:
      "Venturing to Phuket's gold-standard paradise beaches. Combine exclusive dolphin watching at Maithon Private Island with the stunning white sands and transparent waters of Racha Yai.",
    estimatedTimeHours: 4.0,
    recommendedPierId: "chalong",
    distanceNM: 18.5,
    highlights: [
      "High probability of encountering friendly wild dolphin families playing in the surf",
      "Superb visibility and marine life at the brilliant semi-circular Patok Bay",
      "Ideal dual-island cruiser pathway offering the perfect balance of activity and relaxation",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1505322033502-1f4385692e6a?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1589394815804-964ce0ff969f?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-racha-yai-ko-racha-noi",
    name: "Racha Yai • Racha Noi",
    thaiName: "เกาะราชาใหญ่ • เกาะราชาน้อย",
    description:
      "The absolute benchmark for deep-water snorkeling and luxury swimming. Glide from the scenic, mountain-ringed crescent beaches of Racha Yai to the raw granite cliffs of Racha Noi.",
    estimatedTimeHours: 3.5,
    recommendedPierId: "chalong",
    distanceNM: 15.5,
    highlights: [
      "Dazzling turquoise bays with top-tier water clarity for marine diving",
      "Snorkel with giant coral fans, reef turtles, and colorful marine schools",
      "A wonderfully relaxing pathway ideal for customized cruising day trips",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1512455823171-ec55152a55ce?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1589394815804-964ce0ff969f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-khai-nok-maithon",
    name: "Khai Nok • Maiton",
    thaiName: "เกาะไข่นอก • เกาะไม้ท่อน",
    description:
      "The perfect escape along the pristine east coast of Phuket. Explore Koh Khai Nok's lively coral flats before coasting down to Maithon Private Island's peaceful dolphin-watching channels.",
    estimatedTimeHours: 3.0,
    recommendedPierId: "chalong",
    distanceNM: 14.5,
    highlights: [
      "Fascinating mixture of shallow beach wading and deep wild-dolphin channels",
      "Slower-tempo breeze path perfect for enjoying gourmet onboard dining spreads",
      "Scenic backdrop views framing both Cape Panwa and Phang Nga Bay in the distance",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1560295191-10dc6609ec25?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1560295191-10dc6609ec25?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-prompteph",
    name: "Coral Island • Phromthep Cape",
    thaiName: "เกาะเฮ • แหลมพรหมเทพ",
    description:
      "Enjoy the pristine back-beach snorkeling at Coral Island before heading over to witness the breathtaking Andaman sunset at Promthep Cape, the classic end to a perfect day on the water.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "chalong",
    distanceNM: 10.5,
    highlights: [
      "Vibrant coral reefs perfect for snorkeling at Coral Island",
      "Serene late-afternoon cruising across the southern Andaman",
      "Legendary golden sunset views at the iconic Promthep Cape",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1549695420-ad8d9047b74e?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-ko-racha-yai",
    name: "Coral Island • Racha Yai",
    thaiName: "เกาะเฮ • เกาะราชาใหญ่",
    description:
      "Experience two distinct island vibes: the easy, lively coral reefs of Coral Island (Ko He) followed by the dramatically clear, turquoise waters and powder beaches of Racha Yai.",
    estimatedTimeHours: 3.5,
    recommendedPierId: "chalong",
    distanceNM: 14.0,
    highlights: [
      "Relax in the tranquil, shallow waters of Coral Island",
      "Enjoy premium snorkeling in Racha Yai's pristine high-visibility bays",
      "An excellent balance of beach relaxation and aquatic adventure",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1589394815804-964ce0ff969f?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-he-maithon-prompteph",
    name: "Coral Island • Maiton • Phromthep Cape",
    thaiName: "เกาะเฮ • เกาะไม้ท่อน • แหลมพรหมเทพ",
    description:
      "A spectacular triple-destination itinerary offering dolphin watching, vibrant snorkeling, and a grand finale sunset. Stop at Maithon for dolphins, Ko He for snorkeling, and Promthep for twilight.",
    estimatedTimeHours: 4.5,
    recommendedPierId: "chalong",
    distanceNM: 18.0,
    highlights: [
      "Search for wild dolphin pods around Maithon Private Island",
      "Snorkel and swim at Coral Island's vibrant underwater reefs",
      "Finish the trip with an unforgettable sunset at Promthep Cape",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "phi-phi-islands",
    name: "Phi Phi Islands (Maya Bay & Pileh Lagoon)",
    thaiName: "หมู่เกาะพีพี (พีพีดอน พีพีเล มาหยา)",
    description:
      "Experience the complete Phi Phi Islands tour. Visit the iconic Maya Bay, explore the stunning lagoon of Phi Phi Le, and enjoy the vibrant atmosphere of Phi Phi Don. ⚠️ Important: Any trip to the Phi Phi Islands has a total itinerary day time of 12 hours. It must start at 8:00 AM or 8:30 AM and ends at 8:00 PM or 8:30 PM.",
    estimatedTimeHours: 12.0,
    recommendedPierId: "chalong",
    distanceNM: 24.0,
    highlights: [
      "Visit the world-famous Maya Bay made famous by 'The Beach'",
      "Swim in the breathtaking Pileh Lagoon surrounded by towering cliffs",
      "Explore the main island of Phi Phi Don for dining and relaxation",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
    videoUrl: "https://youtu.be/Va90C0J5Oxc?si=dSBZC1T8CyxECfRm",
  },
  {
    id: "koh-hong",
    name: "Hong Island (Krabi)",
    thaiName: "เกาะห้อง",
    description:
      "A stunning archipelago famous for its breathtaking emerald lagoon enclosed by dramatic limestone karst walls.",
    estimatedTimeHours: 3.0,
    recommendedPierId: "ao-po",
    distanceNM: 18.5,
    highlights: [
      "Koh Hong Lagoon surrounded by majestic limestone cliffs",
      "Serene white-sand beaches perfect for relaxation",
      "Kayaking opportunities through calm bay waters",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "phanak-island",
    name: "Phanak Island",
    thaiName: "เกาะพนัก",
    description:
      "An extraordinary island featuring numerous hidden sea caves and interior lagoons, accessible only by kayak during low tide.",
    estimatedTimeHours: 1.5,
    recommendedPierId: "ao-po",
    distanceNM: 14.0,
    highlights: [
      "Navigate intricate, narrow sea caves by kayak",
      "Discover pristine interior lagoons",
      "Observe dramatic limestone formations up close",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-yao-noi",
    name: "Yao Noi Island",
    thaiName: "เกาะยาวน้อย",
    description:
      "The serene sister island to Koh Yao Yai, known for its lush green hills, quiet atmosphere, and traditional island charm.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "ao-po",
    distanceNM: 15.0,
    highlights: [
      "Quiet, unspoiled white-sand beaches",
      "Experience authentic, tranquil local community life",
      "Stunning views of Phang Nga Bay vistas",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "naga-noi",
    name: "Naga Noi Island",
    thaiName: "เกาะนาคาน้อย",
    description:
      "Known locally as Pearl Island, Naga Noi is a serene, private-like island escape famous for its pristine pearl farming history and beautiful quiet beaches.",
    estimatedTimeHours: 1.5,
    recommendedPierId: "ao-po",
    distanceNM: 8.0,
    highlights: [
      "Pristine white sand beaches",
      "Famous for local pearl farming history",
      "Peaceful and secluded atmosphere",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "naga-yai",
    name: "Naga Yai Island",
    thaiName: "เกาะนาคาใหญ่",
    description:
      "A larger, greener island neighbor to Naga Noi, featuring lush coconut groves, extensive beaches, and calm bays perfect for swimming.",
    estimatedTimeHours: 2.0,
    recommendedPierId: "ao-po",
    distanceNM: 9.5,
    highlights: [
      "Expansive, quiet white-sand beaches",
      "Lush coconut palm groves",
      "Calm, swimmable coastal bays",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-yao-yai",
    name: "Yao Yai Island",
    thaiName: "เกาะยาวใหญ่",
    description:
      "A peaceful and culturally rich island offering long stretches of quiet beaches and tranquil traditional village life.",
    estimatedTimeHours: 2.0,
    recommendedPierId: "ao-po",
    distanceNM: 12.0,
    highlights: [
      "Serene, less-crowded white sand beaches",
      "Authentic glimpses into local island life",
      "Breathtaking views of the surrounding limestone islands",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-hong-koh-yao-yai",
    name: "Hong Island • Yao Yai Island",
    thaiName: "เกาะห้อง • เกาะยาวใหญ่",
    description:
      "Combine the dramatic karst beauty and hidden lagoons of Koh Hong with the unspoiled tranquility of Koh Yao Yai.",
    estimatedTimeHours: 4.5,
    recommendedPierId: "ao-po",
    distanceNM: 22.0,
    highlights: [
      "Explore the hidden emerald lagoon of Koh Hong",
      "Relax on the peaceful, untouched shores of Koh Yao Yai",
      "A perfect blend of dramatic scenery and cultural serenity",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "koh-yao-yai-koh-hong-james-bond",
    name: "Phang Nga Odyssey: Caves, Karsts, & Yao Islands",
    thaiName: "ผจญภัยพังงา และเกาะยาว",
    description:
      "The ultimate Phang Nga Bay odyssey: Explore Phanak caves, James Bond island, Kayak through secluded Hong island lagoons, Naga islands, and unwind on tranquil Yao islands (Noi & Yai).",
    estimatedTimeHours: 9.0,
    recommendedPierId: "ao-po",
    distanceNM: 40.0,
    highlights: [
      "Kayaking in Phanak Island lagoons",
      "Visit iconic James Bond needle karst",
      "Kayak secret lagoons in Hong island",
      "Relax on Naga Noi & Naga Yai shores",
      "Exploration of peaceful Yao Noi & Yao Yai islands",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1537952303821-6d48386348ef?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1537952303821-6d48386348ef?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "ko-kalu-ok",
    name: "Koh Kalu Ok",
    thaiName: "เกาะกาลูออก",
    description:
      "A hidden gem in Phang Nga Bay, famous for its dramatic limestone sea caves and tranquil interior lagoons. Perfect for exploring in silence via inflatable rubber canoes.",
    estimatedTimeHours: 2.0,
    recommendedPierId: "ao-po",
    distanceNM: 15.5,
    highlights: [
      "Navigate through spectacular hidden sea caves",
      "Pristine interior lagoons accessible only by small craft",
      "Serene exploration close to ancient limestone wall formations",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "similan-islands",
    name: "Similan Islands",
    thaiName: "หมู่เกาะสิมิลัน",
    description:
      "A world-renowned archipelago famous for its crystal-clear waters, vibrant coral reefs, and incredible marine life.",
    estimatedTimeHours: 8.0,
    recommendedPierId: "chalong",
    distanceNM: 55.0,
    highlights: [
      "World-class snorkeling and diving with abundant marine life",
      "Stunning white-sand beaches with iconic granite boulders",
      "Crystal-clear turquoise waters perfect for swimming",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },

  // Coco Pier Routes
  {
    id: "coco-coral",
    name: "Coral Island (Koh He) South from Coco Pier",
    thaiName: "เกาะเฮ ฝั่งใต้ จากท่าเรือโคโค่",
    description:
      "Enjoy a premium cruise launching from Coco Pier to Coral Island (Ko He) South Side. Delight in pristine beaches and direct bay snorkeling.",
    estimatedTimeHours: 1.0,
    recommendedPierId: "coco",
    distanceNM: 5.6,
    highlights: [
      "Super-efficient 5.6 nautical mile cruise from the new Coco Pier",
      "Shallow water coral reefs and marine life viewing",
      "Peaceful coastal route away from large commercial lanes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-maithon",
    name: "Maiton Island (Koh Mai Thon) from Coco Pier",
    thaiName: "เกาะไม้ท่อน จากท่าเรือโคโค่",
    description:
      "Launch from Coco Pier on a private search for Maiton's famous pod of wild bottlenose dolphins, followed by turquoise water swimming.",
    estimatedTimeHours: 1.2,
    recommendedPierId: "coco",
    distanceNM: 5.9,
    highlights: [
      "Exceptional dolphin watching opportunity with 5.9 NM transit from Coco Pier",
      "Untouched private beach feel with incredibly vibrant fish populations",
      "Serene windward cruising along the eastern Phuket peninsula",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-maithon-ko-he",
    name: "Maiton • Coral Island from Coco Pier",
    thaiName: "เกาะไม้ท่อน • เกาะเฮ จากท่าเรือโคโค่",
    description:
      "The classic family island adventure, optimized from Coco Pier. Spot wild dolphins around Maiton, then anchor in Coral Island's calm waters for paddleboarding.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "coco",
    distanceNM: 11.5,
    highlights: [
      "Vibrant eco-snorkeling and dolphin watching combined",
      "Paddleboard in safe, protected bays with stunning turquoise backgrounds",
      "Saves travel time with intelligent routing starting from Coco Pier",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1505322033502-1f4385692e6a?auto=format&fit=crop&q=80&w=800",
    imageUrls: [
      "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1541535882583-d3368add521a?auto=format&fit=crop&q=80&w=800",
    ],
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-racha-yai",
    name: "Racha Yai Island from Coco Pier",
    thaiName: "เกาะราชาใหญ่ จากท่าเรือโคโค่",
    description:
      "A gorgeous luxury cruise to Phuket's premier white-sand bays. Racha Yai offers unparalleled diving and swimming in incredibly clear, azure seas.",
    estimatedTimeHours: 2.5,
    recommendedPierId: "coco",
    distanceNM: 13.3,
    highlights: [
      "White-sand beaches at Patok Bay with spectacular water visibility",
      "Exceptional deep swimming and marine reef viewing on a 13.3 NM route",
      "Unmatched tranquility on a dedicated luxury sailing trajectory",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1589394815804-964ce0ff969f?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-khai-nok",
    name: "Khai Nok Island from Coco Pier",
    thaiName: "เกาะไข่นอก จากท่าเรือโคโค่",
    description:
      "Perfect tropical escape east of Phuket. Wade in knee-deep waters surrounded by hundreds of school fish, with standard beach bar refreshments.",
    estimatedTimeHours: 1.8,
    recommendedPierId: "coco",
    distanceNM: 8.8,
    highlights: [
      "Crescent sands and crystal clear waders perfect for children and families",
      "Wade directly amongst schools of friendly sergeant major fishes",
      "Wooden local beach bars serving fresh coconuts and sunset cocktails",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1560295191-10dc6609ec25?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-phromthep",
    name: "Phromthep Cape Sunset from Coco Pier",
    thaiName: "แหลมพรหมเทพ ชมพระอาทิตย์ตก จากท่าเรือโคโค่",
    description:
      "Behold the dramatic granite cliffs and legendary southern sunset of Phromthep Cape in the comfort of your double-hulled catamaran.",
    estimatedTimeHours: 1.5,
    recommendedPierId: "coco",
    distanceNM: 7.0,
    highlights: [
      "An unforgettable romantic sunset dinner and premium wine panorama",
      "Coasting by Phuket's beautiful southern bays at late afternoon",
      "Premium photo backdrops with towering volcanic peaks",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1549695420-ad8d9047b74e?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
  {
    id: "coco-phi-phi",
    name: "Phi Phi Islands (Maya Bay & Pileh Lagoon) from Coco Pier",
    thaiName: "หมู่เกาะพีพี จากท่าเรือโคโค่",
    description:
      "Our comprehensive full-day catamaran voyage from Coco Pier to the Phi Phi Islands. Visit Maya Bay, Pileh Lagoon, and experience world-class snorkeling. ⚠️ Important: Any trip to the Phi Phi Islands has a total itinerary day time of 12 hours. It must start at 8:00 AM or 8:30 AM and ends at 8:00 PM or 8:30 PM.",
    estimatedTimeHours: 12.0,
    recommendedPierId: "coco",
    distanceNM: 24.0,
    highlights: [
      "Complete exploration of Phi Phi Leh limestone cliffs",
      "Deep sea crossing with top stability on 'The Best' or 'NAMASTE'",
      "Full-board delicious prepared lunch and snacks served on board",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=800",
    imagePlaceholder: "bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]/10",
  },
];
