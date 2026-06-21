export type CharterFormLanguage =
  | "en"
  | "ru"
  | "hi"
  | "zh"
  | "th"
  | "fr"
  | "de";

export const CHARTER_FORM_TRANSLATIONS: Record<
  CharterFormLanguage,
  Record<string, string>
> = {
  fr: {
    "header.title": "Configurez votre location",
    "header.subtitle": "Personnalisation privée de yacht sur mesure",
    "step1.title": "01. Sélectionnez votre navire",
    "step1b.title": "02. Choisissez la durée de la location",
    "step1b.half": "Demi-journée (4-5 heures)",
    "step1b.halfDesc":
      "Parfait pour une croisière détendue au coucher du soleil l'après-midi ou une session de plongée matinale. Idéal pour de courtes escapades tropicales.",
    "step1b.full": "Journée complète (8-9 heures)",
    "step1b.fullDesc":
      "Découvrez les profondeurs pures de la mer d'Andaman. Offre une flexibilité totale de l'itinéraire avec plongée en apnée, détente sur les plages et bains de soleil.",
    "step1b.overnight": "Location de nuit ou plus",
    "step1b.overnightDesc":
      "Le luxe ultime de la navigation de plaisance privée. Dormez confortablement dans des cabines climatisées et réveillez-vous dans des baies vierges.",
    "step1b.overnightDaysTitle": "Durée de la location avec nuit(s)",
    "step1b.overnightDaysDesc":
      "Définissez la durée de la croisière sur plusieurs jours (1 à 7 nuits)",
    "step1b.night": "Nuit",
    "step1b.nights": "Nuits",
    "step2.date": "Sélectionnez le jour de départ",
    "step2.guests": "Nombre d'invités à bord",
    "step2.adults": "Adultes",
    "step2.adultsAge": "18 ans et plus",
    "step2.kids": "Enfants (0-17 ans)",
    "step2.kidsAge": "De 0 à 17 ans",
    "step2.maxWarning":
      "Capacité maximale de passagers atteinte pour ce catamaran.",
    "step3.title":
      "04. Choisissez votre itinéraire (Sélectionnez une option / Sur mesure)",
    "step3.recommended": "Pier de départ recommandé",
    "step3.tip": "Conseil d'optimisation",
    "step3.tipDesc":
      "Vous avez sélectionné des destinations comme {dest}. Partir de {pier} réduit considérablement le temps de trajet !",
    "step3.adjustBtn": "Ajuster pour optimiser le trajet",
    "step3.total": "Total",
    "step4.title": "05. Pier de départ sélectionné",
    "step4.recommendedLabel": "Recommandé",
    "step4b.title": "06. Personnalisez vos options et loisirs",
    "step4b.desc":
      "Ajoutez du divertissement d'exception à votre croisière, disponible sur tous nos catamarans :",
    "upgrade.slider": "Réserver le toboggan",
    "upgrade.sliderLabel": "Toboggan aquatique gonflable géant",
    "upgrade.sliderDesc":
      "Glissez directement depuis le pont supérieur flybridge dans les eaux chaudes et turquoise de l'océan.",
    "upgrade.pool": "Réserver la piscine",
    "upgrade.poolLabel": "Piscine flottante sécurisée en mer",
    "upgrade.poolDesc":
      "Crée une piscine filet flottante sécurisée à l'arrière du catamaran pour protéger les enfants des courants.",
    "upgrade.cabin": "Réserver des cabines climatisées",
    "upgrade.cabinLabel": "Location de cabines climatisées",
    "upgrade.cabinDesc":
      "Accédez aux cabines de couchage privées climatisées avec lits doubles et douches royales à bord.",
    "upgrade.bbqTitle": "Options de restauration & buffet à bord",
    "upgrade.partyTitle": "Options de célébration & fête",
    "upgrade.partySub":
      "Sublimez votre croisière avec des forfaits de fête, de la musique live et des barmans professionnels.",
    "upgrade.cateringSub":
      "Offrez à vos invités une expérience culinaire d'exception. Choisissez le meilleur buffet pour votre excursion :",
    "upgrade.foodOption": "Option sélectionnée",
    "food.standard": "Menu standard gratuit de bienvenue",
    "food.standardLabel": "Restauration standard",
    "food.standardDesc":
      "Boissons fraîches, plateaux d'ananas et de pastèque frais, eau minérale d'Andaman et snacks inclus.",
    "food.standardIncl": "INCLUS GRATUITEMENT",
    "food.seafood": "Grand barbecue de fruits de mer",
    "food.seafoodLabel": "Restauration grillades aux fruits de mer deluxe",
    "food.seafoodDesc":
      "Bar frais local, crevettes tigrées géantes d'Andaman, calamars grillés au charbon de bois, servis avec du maïs chaud rissolé au beurre.",
    "food.seafoodTag": "Option premium",
    "food.thai": "Banquet thaïlandais royal",
    "food.thaiLabel": "Buffet de cuisine thaïlandaise royale",
    "food.thaiDesc":
      "Currys de crabe du Sud, soupe de crevettes signature Tom Yum Goong, mangue sucrée au riz collant et Pad Thai local.",
    "food.thaiTag": "Spécialité de Phuket",
    "food.western": "Buffet occidental de prestige",
    "food.westernLabel": "Table gastronomique occidentale",
    "food.westernDesc":
      "Noix de Saint-Jacques de Hokkaido truffées, filet de bœuf Black Angus d'Australie grillé, salade César bio et desserts fins.",
    "food.westernTag": "Sélection d'élite",
    "upgrade.bartender": "Service de barman professionnel (Option fête)",
    "upgrade.bartenderBtn": "Engager un barman & mixologue professionnel",
    "upgrade.bartenderDesc":
      "Faites plaisir à vos invités avec des cocktails fins, un service de vin professionnel et des mojitos parfumés préparés par un mixologue à bord.",
    "upgrade.bartenderSelect": "Sélectionnez le nombre de barmans",
    "upgrade.bartenderOpt1": "1 Barman professionnel",
    "upgrade.bartenderOpt2": "2 Barmans professionnels",
    "upgrade.bartenderOpt3":
      "3 Barmans professionnels (Recommandé pour grands groupes)",
    "upgrade.cakeTitle": "Gâteau de célébration et anniversaire",
    "upgrade.cakeBtn": "Commander un gâteau personnalisé",
    "upgrade.cakeDesc":
      "Rendez votre voyage inoubliable avec un gâteau haut de gamme fraîchement préparé. Livré frais sur le bateau et gardé au frais.",
    "upgrade.cakeSelect": "Nombre de gâteaux (1-5)",
    "upgrade.cakeOpt": "Gâteau de célébration",
    "upgrade.cakeOptP": "Gâteaux de célébration",
    "upgrade.cakeOptMax": "Pack complet de gâteaux de célébration",
    "step5.title": "07. Nom du représentant des invités",
    "step5.placeholder": "ex : Amélie Laurent",
    "step5.requests": "08. Demandes particulières / Informations",
    "step5.requestsPl":
      "ex : détails du buffet, matériel de plongée, surprise au coucher du soleil",
    "draft.title": "Texte de la demande généré",
    "draft.copied": "✓ Copié dans le presse-papiers !",
    "draft.copy": "Copier le message",
    bookWhatsApp: "Réserver via WhatsApp",
    callAgency: "Téléphoner",
    speedBooking:
      "Réservation rapide de yacht privé via discussion WhatsApp ou appel direct",
  },
  de: {
    "header.title": "Konfigurieren Sie Ihre Charter",
    "header.subtitle": "Individueller privater Katamaran-Planer",
    "step1.title": "01. Wählen Sie Ihr Schiff",
    "step1b.title": "02. Wählen Sie die Charterdauer",
    "step1b.half": "Halbtages-Kreuzfahrt (4-5 Stunden)",
    "step1b.halfDesc":
      "Ideal für eine entspannte Fahrt in den Sonnenuntergang oder zum Schnorcheln am Vormittag. Perfekt für einen kurzen tropischen Kurzurlaub.",
    "step1b.full": "Ganztages-Kreuzfahrt (8-9 Stunden)",
    "step1b.fullDesc":
      "Erleben Sie die wahre Schönheit der Andamanensee. Bietet vollkommene Flexibilität mit ausreichend Zeit zum Schnorcheln, Baden und Sonnen.",
    "step1b.overnight": "Mehrtägige Charter (mit Übernachtung)",
    "step1b.overnightDesc":
      "Der ultimative Luxus einer privaten Yachtcharter. Schlafen Sie in komfortablen, klimatisierten Kabinen und wachen Sie in einsamen Buchten auf.",
    "step1b.overnightDaysTitle": "Dauer der Charter mit Übernachtung",
    "step1b.overnightDaysDesc":
      "Wählen Sie die Anzahl der Übernachtungen (1 bis 7 Nächte)",
    "step1b.night": "Nacht",
    "step1b.nights": "Nächte",
    "step2.date": "Charterdatum auswählen",
    "step2.guests": "Anzahl der Gäste an Bord",
    "step2.adults": "Erwachsene",
    "step2.adultsAge": "Alter 18+",
    "step2.kids": "Kinder (0-17)",
    "step2.kidsAge": "Alter 0 bis 17 Jahre",
    "step2.maxWarning":
      "Die maximale Kapazität für diesen Katamaran ist erreicht.",
    "step3.title": "04. Route oder Reiseziel wählen",
    "step3.recommended": "Empfohlener Abfahrtspier",
    "step3.tip": "Optimierungs-Tipp",
    "step3.tipDesc":
      "Sie haben Reiseziele wie {dest} ausgewählt. Die Abfahrt von {pier} verkürzt Ihre Fahrtzeit deutlich!",
    "step3.adjustBtn": "Hafen für optimale Route anpassen",
    "step3.total": "Gesamt",
    "step4.title": "05. Ausgewählter Abfahrtspier",
    "step4.recommendedLabel": "Empfohlen",
    "step4b.title": "06. Ausflugs- oder Party-Upgrades anpassen",
    "step4b.desc":
      "Veredeln Sie Ihre Charter mit exklusivem Wasserspielzeug und Equipment für alle Katamarane:",
    "upgrade.slider": "Wasserrutsche buchen",
    "upgrade.sliderLabel": "Riesige aufblasbare Wasserrutsche",
    "upgrade.sliderDesc":
      "Riesiger Rutschspaß direkt von der Flybridge des Oberdecks in den warmen, smaragdgrünen Ozean.",
    "upgrade.pool": "Sicherheits-Pool buchen",
    "upgrade.poolLabel": "Aufblasbarer meeressicherer Pool",
    "upgrade.poolDesc":
      "Erstellt einen sicheren schwimmenden Netzpool hinter dem Katamaran, um Kinder vor Strömungen zu schützen.",
    "upgrade.cabin": "Klimatisierte Kabinen reservieren",
    "upgrade.cabinLabel": "Klimatisierte Kabinen an Bord",
    "upgrade.cabinDesc":
      "Schalten Sie private, klimatisierte Schlakabinen unter Deck mit Doppelkojen und kompletten Duschbädern frei.",
    "upgrade.bbqTitle": "Kulinarische Optionen & Bordcatering",
    "upgrade.partyTitle": "Party-Optionen erstellen",
    "upgrade.partySub":
      "Machen Sie Ihre Charter unvergesslich mit Feier-Paketen, Live-Musik und professionellen Barkeepern.",
    "upgrade.cateringSub":
      "Verwöhnen Sie Ihre Gäste with exklusivem Catering auf dem Meer. Wählen Sie das beste Menü für Ihre Reise:",
    "upgrade.foodOption": "Ausgewählte Option",
    "food.standard": "Kostenloses Standard-Menü",
    "food.standardLabel": "Standard-Verpflegung an Bord",
    "food.standardDesc":
      "Alkoholfreie Erfrischungsgetränke, frische Obstplatten mit Ananas & Wassermelone, reines Mineralwasser und Snacks inklusive.",
    "food.standardIncl": "KOSTENLOS INBEGRIFFEN",
    "food.seafood": "Meeresfrüchte-Grillfest (BBQ)",
    "food.seafoodLabel": "Exklusives gegrilltes Meeresfrüchte-Grillfest",
    "food.seafoodDesc":
      "Frischer lokaler Seebarsch, Riesengarnelen aus der Andamanensee, Tintenfisch vom Holzkohlegrill, serviert mit warmem Buttermais.",
    "food.seafoodTag": "Premium-Upgrade",
    "food.thai": "Königliches thailändisches Buffet",
    "food.thaiLabel": "Buffet mit königlicher thailändischer Küche",
    "food.thaiDesc":
      "Traditionelle Krabbencurrys aus dem Süden, klassische Tom-Yum-Goong-Suppe, süßer Mango-Klebreis und thailändisches Pad Thai.",
    "food.thaiTag": "Phuket Spezialität",
    "food.western": "Premium-Westliches Buffet",
    "food.westernLabel": "Exquisites westliches Buffet",
    "food.westernDesc":
      "Jakobsmuscheln mit Trüffel, gegrilltes australisches Black-Angus-Rinderfilet, Bio-Caesar-Salat und feines Dessert.",
    "food.westernTag": "Elite-Auswahl",
    "upgrade.bartender": "Professioneller Barkeeper-Service (Party-Upgrade)",
    "upgrade.bartenderBtn": "Professionellen Barkeeper & Mixologen engagieren",
    "upgrade.bartenderDesc":
      "Verwöhnen Sie Ihre Gäste mit frisch gemixten Cocktails, Wein-Service und erfrischenden Partydrinks von einem Profi an Bord.",
    "upgrade.bartenderSelect": "Anzahl der Barkeeper wählen",
    "upgrade.bartenderOpt1": "1 Professioneller Barkeeper",
    "upgrade.bartenderOpt2": "2 Professionelle Barkeeper",
    "upgrade.bartenderOpt3":
      "3 Professionelle Barkeeper (Empfohlen für große Gruppen)",
    "upgrade.cakeTitle": "Geburtstags- oder Jubiläumstorte (Feier-Upgrade)",
    "upgrade.cakeBtn": "Maßgeschneiderte Geburtstagstorte bestellen",
    "upgrade.cakeDesc":
      "Überraschen Sie Ihre Liebsten mit einer frisch gebackenen, exklusiven Geburtstagstorte, frisch gekühlt an Bord serviert.",
    "upgrade.cakeSelect": "Anzahl der Torten wählen (1-5)",
    "upgrade.cakeOpt": "Festliche Torte",
    "upgrade.cakeOptP": "Festliche Torten",
    "upgrade.cakeOptMax": "Festliches Torten-Komplettpaket",
    "step5.title": "07. Name des Hauptgastes",
    "step5.placeholder": "z. B. Max Mustermann",
    "step5.requests": "08. Besondere Wünsche / Anfragen",
    "step5.requestsPl":
      "z. B. Catering-Details, Tauchgänge, Überraschung zum Sonnenuntergang",
    "draft.title": "Erstellter Anfrage-Entwurf",
    "draft.copied": "✓ In Zwischenablage kopiert!",
    "draft.copy": "Nachricht kopieren",
    bookWhatsApp: "Über WhatsApp buchen",
    callAgency: "Anrufen",
    speedBooking: "Schnelle Charterbuchung via WhatsApp oder Telefonanruf",
  },
  en: {
    "header.title": "Configure Your Charter",
    "header.subtitle": "Private Bespoke Yacht Customizer",
    "step1.title": "01. Select Your Vessel",
    "step1b.title": "02. Choose Charter Duration",
    "step1b.half": "Half Day Cruise (4-5 hours)",
    "step1b.halfDesc":
      "Perfect for a relaxed afternoon sunset voyage or high-visibility morning snorkeling. Highly popular for quick tropical getaways. Includes soft drinks, ice, and local fruits.",
    "step1b.full": "Full Day Cruise (8-9 hours)",
    "step1b.fullDesc":
      "Experience the pure depths of the Andaman Sea. Offers complete timeline flexibility with ample snorkeling, beachcombing, and leisurely sunbathing along your package route.",
    "step1b.overnight": "Overnight Charter",
    "step1b.overnightDesc":
      "The ultimate private yachting luxury. Sleep secure in 6-cabin AC comfort, waking up to pristine bays, deserted islands, and custom multi-day voyages.",
    "step1b.overnightDaysTitle": "Overnight Charter Duration",
    "step1b.overnightDaysDesc":
      "Define multi-day cruise length (1 to 7 nights)",
    "step1b.night": "Night",
    "step1b.nights": "Nights",
    "step2.date": "Select Charter Date",
    "step2.guests": "Number of Guests on board",
    "step2.adults": "Adults",
    "step2.adultsAge": "Age 18+",
    "step2.kids": "Kids (0-17)",
    "step2.kidsAge": "Age 0 to 17",
    "step2.maxWarning":
      "Maximum passenger capacity reached for this catamaran.",
    "step3.title": "04. Choose Destination Route (Select any / Plan your own)",
    "step3.recommended": "Recommended Departure Pier",
    "step3.tip": "Optimization Tip",
    "step3.tipDesc":
      "You selected destinations like {dest}. Starting from {pier} minimizes total cruise transit time considerably!",
    "step3.adjustBtn": "Adjust Pier for optimal cruise",
    "step3.total": "Total",
    "step4.title": "05. Selected Start Point Pier",
    "step4.recommendedLabel": "Recommended",
    "step4b.title": "06. Customize Excursion or Party Upgrades",
    "step4b.desc":
      "Treat your party to deluxe offshore amusement additions, available for setup on any size catamarans:",
    "upgrade.slider": "Book Water Slide",
    "upgrade.sliderLabel": "Inflatable Giant Sea Water Slider",
    "upgrade.sliderDesc":
      "Add dynamic sliding fun directly off the top deck flybridge into the emerald warm ocean.",
    "upgrade.pool": "Book Safe-Pool",
    "upgrade.poolLabel": "Inflatable Ocean Swimming Safe-Pool",
    "upgrade.poolDesc":
      "Creates a secure perimeter floating net pool behind the catamaran hull, protecting kids from currents.",
    "upgrade.cabin": "Book AC Cabins",
    "upgrade.cabinLabel": "Charter Air-Conditioned Cabins",
    "upgrade.cabinDesc":
      "Unlock private below-deck AC bedroom domains with double berths and full shower facilities during the sail.",
    "upgrade.bbqTitle": "Culinary & Onboard Food Catering Options",
    "upgrade.partyTitle": "Create Party Options",
    "upgrade.partySub":
      "Elevate your charter with celebration packages, live music, and professional media.",
    "upgrade.cateringSub":
      "Treat your guests to exceptional ocean-side catering. Select the best dining upgrade for your catamaran journey:",
    "upgrade.foodOption": "Selected Option",
    "food.standard": "Standard Complimentary Menu",
    "food.standardLabel": "Standard Charter Board",
    "food.standardDesc":
      "Cool soft drinks, fresh tropical pineapple & watermelon platters, pure drinking mineral water, and {coolers} included.",
    "food.standardIncl": "FREE INCLUSION",
    "food.seafood": "Seafood BBQ Feast",
    "food.seafoodLabel": "Deluxe Grilled Seafood BBQ",
    "food.seafoodDesc":
      "Fresh local sea-bass, jumbo Andaman tiger prawns, local squids grilled on coal deck, served with hot garlic butter corn.",
    "food.seafoodTag": "Premium upgrade",
    "food.thai": "Royal Thai Banquet",
    "food.thaiLabel": "Royal Thai Cuisine Buffet",
    "food.thaiDesc":
      "Signature southern crab curries, flavorful Tom Yum Goong shrimp soup, sweet mango sticky rice, and local stir-fried Pad Thai.",
    "food.thaiTag": "Phuket Special",
    "food.western": "Premium Western Buffet",
    "food.westernLabel": "Western Fine Dining",
    "food.westernDesc":
      "Truffled Hokkaido sea scallops, chargrilled Australian black angus tenderloin, organic Caesar and premium dessert.",
    "food.westernTag": "Elite Reserve",
    "upgrade.bartender": "Professional Bartender Service (Party Upgrade)",
    "upgrade.bartenderBtn": "Hire Guest-Facing Mixologist & Bartender",
    "upgrade.bartenderDesc":
      "Treat your guests to elegant customized cocktail shaking, wine service, and custom-infused party mojitos from a professional mixologist on board.",
    "upgrade.bartenderSelect": "Select Number of Bartenders",
    "upgrade.bartenderOpt1": "1 Professional Bartender",
    "upgrade.bartenderOpt2": "2 Professional Bartenders",
    "upgrade.bartenderOpt3":
      "3 Professional Bartenders (Recommended for large groups)",
    "upgrade.cakeTitle":
      "Celebration Birthday Cake (Anniversary & Party Upgrade)",
    "upgrade.cakeBtn": "Order Custom Birthday / Celebration Cake",
    "upgrade.cakeDesc":
      "Make your charter unforgettable with a premium, freshly baked customized celebration cake. Hand-delivered to the yacht and kept chilled until the perfect moment.",
    "upgrade.cakeSelect": "Select Quantity of Cakes (1-5)",
    "upgrade.cakeOpt": "Celebration Cake",
    "upgrade.cakeOptP": "Celebration Cakes",
    "upgrade.cakeOptMax": "Celebration Cakes (Full party package)",
    "step5.title": "07. Guest Representative Name",
    "step5.placeholder": "e.g. Elena Mitchell",
    "step5.requests": "08. Special Inquiries / Requests",
    "step5.requestsPl": "e.g. catering details, diving needs, sunset surprises",
    "draft.title": "Generated Inquiry Text",
    "draft.copied": "✓ Copied to clipboard!",
    "draft.copy": "Copy message",
    bookWhatsApp: "Book with WhatsApp",
    callAgency: "Call",
    speedBooking:
      "Fast private charter booking via WhatsApp chat & direct voice call",

    // Destination Names
    "destinations.prompteph.name": "Prompteph (Phromthep Cape)",
    "destinations.prompteph.desc":
      "Phuket's legendary southern headland. Renowned for spectacular, open-water sea breeze views alongside dramatic granite cliffs and the iconic golden-hour Andaman sunset backdrop.",
    "destinations.james-bond.name": "James Bond Island (Phang Nga Bay)",
    "destinations.james-bond.desc":
      "Geologically Ko Ta Pu, this world-renowned limestone karst stands in Phang Nga Bay's tranquil, emerald-green waters surrounded by sea caves.",
    "destinations.ko-he-south.name": "Coral Island (Ko He South)",
    "destinations.ko-he-south.desc":
      "The quiet, pristine back-beach side of Coral Island. Highly beloved for shallow snorkeling in calm, blue waters with friendly horns bills.",
    "destinations.ko-he-north-banana-beach.name": "Banana Beach (Ko He Island)",
    "destinations.ko-he-north-banana-beach.desc":
      "Phuket's elite beach playground. Features premium eco-designed bamboo pavilions nested against lush jungle, and dynamic water sports.",
    "destinations.ko-racha-yai.name": "Ko Racha Yai",
    "destinations.ko-racha-yai.desc":
      "Features majestic white-sand bays carved into lush volcanic hillsides with incredibly high visibility underwater for snorkeling.",
    "destinations.ko-racha-noi.name": "Ko Racha Noi",
    "destinations.ko-racha-noi.desc":
      "The wild, uninhabited sister island to Racha Yai. Fringed by immense granite boulders and pristine, sapphire deep waters.",
    "destinations.maithon.name": "Maithon Private Island",
    "destinations.maithon.desc":
      "Often called 'Dolphin Island' because of wild bottlenose dolphins playing near its shores. Peaceful snorkeling right off yacht decks.",
    "destinations.koh-khai-nok.name": "Koh Khai Nok",
    "destinations.koh-khai-nok.desc":
      "A delightful tropical gem east of Phuket. Beloved for its white sands, crystal shores, and wading directly among friendly schooling fishes.",
    "destinations.ko-he-ko-racha-yai-prompteph.name":
      "Ko He - Ko Racha Yai - Prompteph",
    "destinations.ko-he-ko-racha-yai-prompteph.desc":
      "The premier yachting trilogy: shallow snorkeling, pristine diving at Racha Yai, and a twilight sunset in front of Promthep Cape.",
    "destinations.maithon-ko-he.name": "Maithon - Ko He",
    "destinations.maithon-ko-he.desc":
      "Search for Maithon's resident wild bottlenose dolphin pod, then anchor at Coral Island's white crescent for swimming.",
    "destinations.maithon-ko-racha-yai.name": "Maithon - Ko Racha Yai",
    "destinations.maithon-ko-racha-yai.desc":
      "Combine exclusive dolphin watching at Maithon with the stunning white sands and transparent waters of Racha Yai.",
    "destinations.ko-racha-yai-ko-racha-noi.name":
      "Ko Racha Yai - Ko Racha Noi",
    "destinations.ko-racha-yai-ko-racha-noi.desc":
      "Absolute benchmark for deep snorkeling. Glide from mountain-ringed sands of Racha Yai to raw granite cliffs of Racha Noi.",
    "destinations.koh-khai-nok-maithon.name": "Koh Khai Nok - Maithon",
    "destinations.koh-khai-nok-maithon.desc":
      "Perfect escape: explore Koh Khai Nok's lively coral flats before coasting Maithon Private Island's dolphin-watching channels.",
    "destinations.ko-kalu-ok.name": "Koh Kalu Ok (Sea Caves & Lagoons)",
    "destinations.ko-kalu-ok.desc":
      "Secret interior lagoons and limestone sea cave tunnels in Phang Nga Bay. Explore pristine natural cathedrals accessible only by inflatable craft.",

    // Piers
    "piers.chalong.name": "Chalong Pier",
    "piers.chalong.location": "South Phuket (Chalong Bay)",
    "piers.chalong.desc":
      "Phuket’s primary southern launchpad. Excellent for Southern cruises such as Ko He, Racha islands, and Maithon.",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.ao-po.location": "Northeast Phuket (Ao Po)",
    "piers.ao-po.desc":
      "Elite deep-water luxury harbor in Northeast Phuket. Direct access to Phang Nga Bay without tide constraints.",
    "upgrade.bbqGrillTitle": "Barbecue Grill Add-ons (Optional)",
    "upgrade.gasBBQ": "Barbecue on Gas",
    "upgrade.gasBBQDesc":
      "High-efficiency propane gas BBQ grill set up on the deck. Perfect for clean, speedy grilling of meat or seafood. Available on all yachts!",
    "upgrade.charcoalBBQ": "👑 Charcoal Barbecue",
    "upgrade.charcoalBBQDesc":
      "Premium wood-charcoal classic design grill on the catamaran stern deck. Imparts an authentic robust smoky flavor to your catch.",
    "upgrade.charcoalBBQLocked": "🔒 Charcoal Barbecue",
    "upgrade.charcoalBBQTheBestOnly": '"The Best" Only',
    "upgrade.charcoalBBQLimitDesc":
      'Authentic coal-smoking barbecue setup. This exclusive premium feature is restricted to our flagship catamaran "The Best".',
    "upgrade.fruitsTitle": "🍎 Extra Fruit & Snack Platters",
    "upgrade.watermelon": "🍉 Extra Watermelon",
    "upgrade.watermelonDesc":
      "Chilled sweet juicy red slices. Select quantity:",
    "upgrade.watermelonSelect.none": "0 - None",
    "upgrade.watermelonSelect.unitSingle": "Platter",
    "upgrade.watermelonSelect.unitPlural": "Platters",
    "upgrade.snacks": "🍿 Extra Snacks",
    "upgrade.snacksDesc": "Select premium snack spreads (1-20):",
    "upgrade.snacksUnitSingle": "Premium snack unit",
    "upgrade.snacksUnitPlural": "Premium snack units",
    "upgrade.pineapple": "🍍 Extra Pineapple",
    "upgrade.pineappleDesc": "Select local sweet pineapple (1-10):",
    "upgrade.pineapplePlatterSingle": "Pineapple platter",
    "upgrade.pineapplePlatterPlural": "Pineapple platters",
    "upgrade.entertainmentTitle": "On-Board Premium Entertainment",
    "upgrade.tvIncludedLabel": '🎁 Included Free on "The Best"',
    "upgrade.tvIncludedTitle":
      '32" Smart TV with Netflix & YouTube for Kids + Free WiFi Internet',
    "upgrade.tvIncludedDesc":
      "Complimentary onboard internet access (speed depending on connected people) and a dedicated 32 inch TV loaded with streaming catalogs to keep children happy and entertained.",
    "upgrade.karaokeTitle": "🎵 Professional Onboard Karaoke System",
    "upgrade.karaokeDesc":
      "Multi-speaker surround sound system with massive flat screen, catalog containing 50,000+ files, and wireless microphones.",
    "upgrade.karaokeLocked": "🔒 On-Board Karaoke System",
    "upgrade.karaokeLimitDesc":
      'Turn your Andaman sunset into an exceptional acoustic stage. This premium package is exclusively integrated onboard our flagship catamaran "The Best".',
    "upgrade.longtailTitle": "Longtail Boat & Island Entry Upgrades",
    "upgrade.privateLongtail": "⚓ Private Long Tail Boat",
    "upgrade.privateLongtailDesc":
      "Private local wooden long tail boat charter on any of the selected islands. Perfect for close-up reef access, shallow coral runs, and private beach drop-offs.",
    "upgrade.mayaBayTicket": "🎟️ Maya Bay Tour & Ticket",
    "upgrade.mayaBayTicketDesc":
      "Guaranteed park entry tickets to Maya Beach combined with an authentic wooden longtail boat cruise into Pileh Lagoon's transparent turquoise waters.",
    "upgrade.jamesBondTicket": "🎬 James Bond Tour Ticket",
    "upgrade.jamesBondTicketDesc":
      "Guaranteed national park admission tickets to Ao Phang Nga National Park (James Bond Island) with sea canoeing around mystic caves.",
    "upgrade.jetskiTitle": "🌊 Jet Ski Rentals (Exclusive Islands)",
    "upgrade.jetskiRent": "Rent High-Speed Jet Ski at Destination",
    "upgrade.jetskiDesc":
      "Enjoy the crystal shallow waters on high-quality sea scooters with skilled guides.",
    "upgrade.jetskiQty": "Select Jet Ski Quantity",
    "upgrade.jetskiUnitSingle": "Jet Ski",
    "upgrade.jetskiUnitPlural": "Jet Skis",
    "upgrade.jetskiDuration": "Select Ride Duration",
    "upgrade.jetskiLocked": "🔒 Jet Ski Rentals",
    "upgrade.jetskiKhaiNokOnly": "Exclusive Islands Only",
    "upgrade.jetskiLimitDesc":
      "Jet Ski rental operates exclusively at select locations (Koh Khai Nok, Naka Yai, Naka Noi). Please select one of these destinations to enable this upgrade!",
    "upgrade.bananaBeachTitle": "🌊 Banana Beach Water Sports (Exclusive)",
    "upgrade.parasailing": "Book Parasailing Experience",
    "upgrade.parasailingDesc":
      "Experience the ultimate thrill soaring high above the turquoise bay of Koh He with trained safety professionals.",
    "upgrade.bananaBoat": "Book Banana Boat Ride",
    "upgrade.bananaBoatDesc":
      "Gather your group and bounce over the tropical waves on our exciting high-speed inflatable banana craft.",
    "upgrade.bananaBeachLocked": "🔒 Banana Beach Water Sports",
    "upgrade.bananaBeachOnly": "Banana Beach Only",
    "upgrade.bananaBeachLimitDesc":
      "Parasailing and Banana Boat rides are exclusively available at the elite Banana Beach playground (Ko He North). Please select Banana Beach as your destination to enable these options!",
    "upgrade.rubberCanoeTitle": "🛶 Koh Kalu Ok Inflatable Canoe (Exclusive)",
    "upgrade.rubberCanoe": "Rent Inflatable Rubber Canoes",
    "upgrade.rubberCanoeDesc":
      "Explore hidden sea caves and shallow interior lagoons in silence with our stable high-buoyancy inflatable rubber canoes (Max 2 passengers per canoe).",
    "upgrade.rubberCanoeQty": "Select Quantity (1-10 Canoes)",
    "upgrade.rubberCanoeUnitSingle": "Rubber Canoe",
    "upgrade.rubberCanoeUnitPlural": "Rubber Canoes",
    "upgrade.rubberCanoeLocked": "🔒 Rubber Canoe Rentals",
    "upgrade.rubberCanoeOnly": "Koh Kalu Ok Only",
    "upgrade.rubberCanoeLimitDesc":
      "Rubber canoe rentals are exclusively available for the Koh Kalu Ok destination due to its unique sea caves and interior lagoons. Please select Koh Kalu Ok to enable this option!",
    "upgrade.minibusTitle": "Private Minibus Roundtrip Airport/Hotel Transfer",
    "upgrade.minibusAdd": "Add roundtrip minivan transport",
    "upgrade.minibusDesc":
      "Arrive stress-free in a private, air-conditioned luxury VIP minibus straight to your departure pier and back.",
    "upgrade.transferMarina": "Destination Pier / Harbor",
    "upgrade.transferMarinaChalong":
      "Chalong Pier (Recommended for Racha, Coral, Maithon)",
    "upgrade.transferMarinaAoPo":
      "Ao Po Pier (Recommended for Phang Nga, James Bond)",
    "upgrade.transferMarinaCoco": "Coco Pier (Alternative Starting Point)",
    "upgrade.transferGuests": "Number of Passengers / People",
    "upgrade.transferGuestsUnitSingle": "Person",
    "upgrade.transferGuestsUnitPlural": "People",
    "upgrade.guideTitle": "Professional Host & Translator guide (Optional)",
    "upgrade.guideSelect": "Select Specialist Language Guide",
    "upgrade.guideDesc":
      "Highly vetted native-speaking guides certified by the Tourist Authority of Thailand. Perfect for detailed explanations of islands, marine wildlife, and safety translation.",
    "upgrade.guideNone":
      "No Special host guide needed (Local Thai Skipper & Crew only)",
    "upgrade.guideEn": "🇬🇧 English Speaking Guide",
    "upgrade.guideIndian": "🇮🇳 Indian Speaking Guide",
    "upgrade.guideChinese": "🇨🇳 Chinese Speaking Guide",
    "upgrade.guideKr": "🇰🇷 South Korean Speaking Guide",
    "upgrade.guideArabic": "🇦🇪 Arabic Speaking Guide",
    "upgrade.guideRu": "🇷🇺 Russian Speaking Guide",
    "upgrade.fishingTitle": "🎣 Tour Fishing & Professional Gear",
    "upgrade.fishingInclTitle": "✓ Fishing Included on All Tours",
    "upgrade.fishingInclFree": "Free For All",
    "upgrade.fishingInclDesc":
      "Every private charter completely includes complimentary handline fishing gear, classic sinkers, baits, and fully dedicated local crew support to clean and/or grill your catch on board.",
    "upgrade.fishingPro": "Upgrade Premium Fishing Rods",
    "upgrade.fishingProDesc":
      "Rent top-tier professional rods, reels, & premium trolling gear for deeper waters (Max 5 rods):",
    "upgrade.fishingFreeOption":
      "0 - No premium rods (Use complimentary handlines)",
    "upgrade.fishingProUnitSingle": "Premium Trolling/Cast Rod",
    "upgrade.fishingProUnitPlural": "Premium Trolling/Cast Rods",
    "upgrade.fishingProFullSet":
      "Premium Trolling/Cast Rods (Full trolling set)",
  },
  ru: {
    "header.title": "Настроить чартер",
    "header.subtitle": "Индивидуальный конструктор частных яхт",
    "step1.title": "01. Выберите катамаран",
    "step1b.title": "02. Выберите продолжительность чартера",
    "step1b.half": "Круиз на полдня (4-5 часов)",
    "step1b.halfDesc":
      "Идеально подходит для расслабленного вечернего круиза на закате или утреннего сноркелинга. Очень популярен для коротких тропических поездок. Включает безалкогольные напитки, лед и фрукты.",
    "step1b.full": "Круиз на целый день (8-9 часов)",
    "step1b.fullDesc":
      "Познайте все глубины Андаманского моря. Полная свобода расписания, много времени для сноркелинга, пляжного отдыха и принятия солнечных ванн.",
    "step1b.overnight": "Чартер с ночевкой",
    "step1b.overnightDesc":
      "Абсолютная роскошь частной яхты. Спите спокойно в комфортабельных каютах с кондиционером, просыпаясь в нетронутых бухтах на безлюдных островах.",
    "step1b.overnightDaysTitle": "Продолжительность чартера",
    "step1b.overnightDaysDesc": "Задайте количество ночей в круизе (от 1 до 7)",
    "step1b.night": "Ночь",
    "step1b.nights": "Ночей",
    "step2.date": "Выберите дату чартера",
    "step2.guests": "Количество гостей на борту",
    "step2.adults": "Взрослые",
    "step2.adultsAge": "От 18 лет",
    "step2.kids": "Дети (0-17)",
    "step2.kidsAge": "От 0 до 17 лет",
    "step2.maxWarning": "Достигнут лимит пассажиров для этого катамарана.",
    "step3.title": "04. Выберите маршрут (Выберите любой / Свой маршрут)",
    "step3.recommended": "Рекомендуемый пирс отправления",
    "step3.tip": "Совет по оптимизации",
    "step3.tipDesc":
      "Вы выбрали направления вроде {dest}. Отправление из {pier} значительно сократит время в пути!",
    "step3.adjustBtn": "Выбрать оптимальный пирс",
    "step3.total": "Всего",
    "step4.title": "05. Выбранный пирс отправления",
    "step4.recommendedLabel": "Рекомендуется",
    "step4b.title": "06. Водные игрушки и настройки на борту",
    "step4b.desc":
      "Раскройте роскошь на воде, добавив водные активности или премиальные дополнения:",
    "upgrade.slider": "Добавить водную горку",
    "upgrade.sliderLabel": "Гигантская надувная водная горка",
    "upgrade.sliderDesc":
      "Безумное веселье: скатывайтесь прямо с флайбриджа верхней палубы в теплый изумрудный океан.",
    "upgrade.pool": "Добавить бассейн",
    "upgrade.poolLabel": "Надувной безопасный бассейн в океане",
    "upgrade.poolDesc":
      "Создает защищенный сетчатый бассейн за кормой катамарана, защищая детей от течений.",
    "upgrade.cabin": "Добавить каюты с кондиционером",
    "upgrade.cabinLabel": "Каюты с кондиционером",
    "upgrade.cabinDesc":
      "Откройте доступ к роскошным спальням с кондиционером и душевыми во время прогулки.",
    "upgrade.bbqTitle": "Кейтеринг и питание на борту",
    "upgrade.partyTitle": "Параметры вечеринки",
    "upgrade.partySub":
      "Дополните свой чартер праздничными пакетами, живой музыкой и медиауслугами.",
    "upgrade.cateringSub":
      "Порадуйте своих гостей исключительным кейтерингом у моря. Выберите лучший вариант питания для путешествия на катамаране:",
    "upgrade.foodOption": "Выбранный вариант",
    "food.standard": "Стандартное бесплатное меню",
    "food.standardLabel": "Стандартное бортовое питание",
    "food.standardDesc":
      "Холодные газированные напитки, свежие тарелки с ананасом и арбузом, чистая питьевая вода и {coolers}.",
    "food.standardIncl": "ВКЛЮЧЕНО БЕСПЛАТНО",
    "food.seafood": "Морское барбекю",
    "food.seafoodLabel": "Делюкс гриль-барбекю из морепродуктов",
    "food.seafoodDesc":
      "Свежий местный сибас, королевские тигровые креветки, кальмары гриль, подается с горячей кукурузой с чесночным маслом.",
    "food.seafoodTag": "Премиум апгрейд",
    "food.thai": "Королевский тайский банкет",
    "food.thaiLabel": "Шведский стол королевской тайской кухни",
    "food.thaiDesc":
      "Фирменный кокосовый крабовый карри, острый суп Том Ям Кунг, сладкий манго стики-райс и традиционный Пад Тай.",
    "food.thaiTag": "Спецпредложение Пхукета",
    "food.western": "Премиальный западный буфет",
    "food.westernLabel": "Западная изысканная кухня",
    "food.westernDesc":
      "Трюфельные морские гребешки Хоккайдо, австралийский стейк из вырезки Ангус, органический салат Цезарь и фирменный десерт.",
    "food.westernTag": "Особый резерв",
    "upgrade.bartender": "Услуги профессионального бармена",
    "upgrade.bartenderBtn": "Нанять профессионального миксолога на борт",
    "upgrade.bartenderDesc":
      "Порадуйте гостей изысканными коктейлями, винным сервисом и освежающими праздничными мохито от профессионала.",
    "upgrade.bartenderSelect": "Выберите количество барменов",
    "upgrade.bartenderOpt1": "1 Профессиональный бармен",
    "upgrade.bartenderOpt2": "2 Профессиональных бармена",
    "upgrade.bartenderOpt3":
      "3 Профессиональных бармена (рекомендуется для больших групп)",
    "upgrade.cakeTitle": "Праздничный торт (День рождения / Юбилей)",
    "upgrade.cakeBtn": "Заказать праздничный торт индивидуальной работы",
    "upgrade.cakeDesc":
      "Сделайте праздник незабываемым благодаря свежеиспеченному изысканному торту. Доставляется на яхту охлажденным.",
    "upgrade.cakeSelect": "Количество тортов (1-5)",
    "upgrade.cakeOpt": "Праздничный торт",
    "upgrade.cakeOptP": "Праздничных торта",
    "upgrade.cakeOptMax": "Праздничных тортов (Максимальный комплект)",
    "step5.title": "07. Имя представителя гостей",
    "step5.placeholder": "например, Елена Смирнова",
    "step5.requests": "08. Особые пожелания / Запросы",
    "step5.requestsPl": "например, кейтеринг, дайвинг, сюрприз на закате",
    "draft.title": "Сформированный текст запроса",
    "draft.copied": "✓ Скопировано в буфер!",
    "draft.copy": "Копировать",
    bookWhatsApp: "Забронировать в WhatsApp",
    callAgency: "Позвонить",
    speedBooking: "Быстрое бронирование через WhatsApp чат или прямой звонок",

    // Destination Names
    "destinations.prompteph.name": "Промтеп (Мыс Промтхеп)",
    "destinations.prompteph.desc":
      "Легендарный южный мыс Пхукета. Славится потрясающими панорамами открытого моря, гранитными скалами и волшебными закатами.",
    "destinations.james-bond.name": "Остров Джеймса Бонда (Залив Пханг Нга)",
    "destinations.james-bond.desc":
      "Всемирно известная известняковая скала Ко Та Пу в изумрудных водах залива Пханг Нга, окруженная морскими пещерами и гротами.",
    "destinations.ko-he-south.name": "Ко Хе, Южная сторона (Коралловый остров)",
    "destinations.ko-he-south.desc":
      "Тихий и уединенный пляж Кораллового острова. Идеально подходит для мелководного сноркелинга в спокойных бирюзовых водах.",
    "destinations.ko-he-north-banana-beach.name":
      "Ко Хе, Северная сторона (Банана Бич)",
    "destinations.ko-he-north-banana-beach.desc":
      "Элитный пляж Пхукета с роскошными бамбуковыми павильонами посреди джунглей, белым песком и водными развлечениями.",
    "destinations.ko-racha-yai.name": "Ко Рача Яй",
    "destinations.ko-racha-yai.desc":
      "Белоснежные песчаные бухты среди тропических холмов. Невероятная прозрачность воды для дайвинга и купания.",
    "destinations.ko-racha-noi.name": "Ко Рача Ной",
    "destinations.ko-racha-noi.desc":
      "Дикий, необитаемый остров-близнец Рача Яи, окруженный огромными гранитными валунами и глубоководными рифами.",
    "destinations.maithon.name": "Частный остров Майтон",
    "destinations.maithon.desc":
      "Известен как 'Остров Дельфинов' благодаря стае диких дельфинов, живущих здесь. Отличный сноркелинг прямо с палубы яхты.",
    "destinations.koh-khai-nok.name": "Ко Кхай Нок",
    "destinations.koh-khai-nok.desc":
      "Уютный живописный остров на востоке от Пхукета. Популярен благодаря мелководью и стайкам ручных разноцветных рыбок у берега.",
    "destinations.ko-he-ko-racha-yai-prompteph.name":
      "Ко Хе - Ко Рача Яй - Промтеп",
    "destinations.ko-he-ko-racha-yai-prompteph.desc":
      "Премиальное трио: сноркелинг на Коралловом острове, дайвинг на Рача Яи и встреча заката у мыса Промтхеп.",
    "destinations.maithon-ko-he.name": "Майтон - Ко Хе",
    "destinations.maithon-ko-he.desc":
      "Поиск диких дельфинов у острова Майтон и остановка для купания у белоснежных пляжей Кораллового острова.",
    "destinations.maithon-ko-racha-yai.name": "Майтон - Ко Рача Яй",
    "destinations.maithon-ko-racha-yai.desc":
      "Совместите наблюдение за дельфинами у острова Майтон с прозрачными лагунами и белоснежным песком острова Рача Яи.",
    "destinations.ko-racha-yai-ko-racha-noi.name": "Ко Рача Яй - Ко Рача Ной",
    "destinations.ko-racha-yai-ko-racha-noi.desc":
      "Эталон глубоководного сноркелинга. Переход от песчаных бухт Рача Яи к диким скалам Рача Ной.",
    "destinations.koh-khai-nok-maithon.name": "Ко Кхай Нок - Майтон",
    "destinations.koh-khai-nok-maithon.desc":
      "Прекрасный побег: исследуйте коралловые отмели Кхай Нок и понаблюдайте за стаями дельфинов у острова Майтон.",
    "destinations.ko-kalu-ok.name": "Ко Калу Ок (Пещеры и лагуны)",
    "destinations.ko-kalu-ok.desc":
      "Скрытые внутренние лагуны и известняковые морские пещеры в заливе Пханг Нга. Исследуйте нетронутые природные соборы, доступные только на надувных лодках.",

    // Piers
    "piers.chalong.name": "Пирс Чалонг",
    "piers.chalong.location": "Южный Пхукет (Залив Чалонг)",
    "piers.chalong.desc":
      "Главный южный пирс Пхукета. Идеальная точка отправления на Ко Хе, Рача Яи и остров Майтон.",
    "piers.ao-po.name": "Пирс Ао По",
    "piers.ao-po.location": "Северо-Восточный Пхукет (Ао По)",
    "piers.ao-po.desc":
      "Элитная глубоководная стоянка на северо-востоке. Прямой выход в залив Пханг Нга без ограничений по отливам.",
    "upgrade.bbqGrillTitle": "Барбекю-гриль на борту (Опционально)",
    "upgrade.gasBBQ": "Гриль на газу",
    "upgrade.gasBBQDesc":
      "Эффективный газовый гриль-барбекю на пропане, установленный на палубе. Идеально для быстрой и чистой обжарки мяса или рыбы. Доступен на всех яхтах!",
    "upgrade.charcoalBBQ": "👑 Угольный гриль",
    "upgrade.charcoalBBQDesc":
      "Премиальный классический гриль на древесном угля на корме катамарана. Придает вашему улову настоящий насыщенный дымный вкус.",
    "upgrade.charcoalBBQLocked": "🔒 Угольный гриль",
    "upgrade.charcoalBBQTheBestOnly": 'Только для "The Best"',
    "upgrade.charcoalBBQLimitDesc":
      'Аутентичный угольный гриль. Эта эксклюзивная функция премиум-класса доступна только на нашем флагманском катамаране "The Best".',
    "upgrade.fruitsTitle": "🍎 Дополнительные фруктовые и закусочные тарелки",
    "upgrade.watermelon": "🍉 Больше арбуза",
    "upgrade.watermelonDesc":
      "Свежие охлажденные ломтики спелого арбуза. Выберите количество:",
    "upgrade.watermelonSelect.none": "0 - Нет",
    "upgrade.watermelonSelect.unitSingle": "Тарелка",
    "upgrade.watermelonSelect.unitPlural": "Тарелки",
    "upgrade.snacks": "🍿 Дополнительные закуски",
    "upgrade.snacksDesc": "Премиальные закуски и чипсы (1-20):",
    "upgrade.snacksUnitSingle": "Упаковка закусок",
    "upgrade.snacksUnitPlural": "Упаковок закусок",
    "upgrade.pineapple": "🍍 Больше ананасов",
    "upgrade.pineappleDesc": "Выбрать сладкий местный ананас (1-10):",
    "upgrade.pineapplePlatterSingle": "Тарелка ананасов",
    "upgrade.pineapplePlatterPlural": "Тарелок ананасов",
    "upgrade.entertainmentTitle": "Премиальные развлечения на борту",
    "upgrade.tvIncludedLabel": '🎁 Включено бесплатно на "The Best"',
    "upgrade.tvIncludedTitle":
      '32" Смарт-ТВ с Netflix и YouTube для детей + бесплатный WiFi на борту',
    "upgrade.tvIncludedDesc":
      "Бесплатный доступ в интернет на борту и отдельный 32-дюймовый ТВ с доступом к каталогам фильмов, чтобы дети были счастливы и заняты.",
    "upgrade.karaokeTitle": "🎵 Профессиональное караоке на борту",
    "upgrade.karaokeDesc":
      "Многоколоночная система объемного звучания с огромным плоским экраном, каталогом из более чем 50 000 песен и беспроводными микрофонами.",
    "upgrade.karaokeLocked": "🔒 Профессиональное караоке",
    "upgrade.karaokeLimitDesc":
      'Превратите ваш закат в Андаманском море в музыкальную сцену. Эта премиальная услуга эксклюзивно доступна на нашем флагмане "The Best".',
    "upgrade.longtailTitle": "Традиционные лодки и билеты на острова",
    "upgrade.privateLongtail": "⚓ Частная лодка лонгтейл",
    "upgrade.privateLongtailDesc":
      "Частный фрахт местной деревянной лодки на любом из выбранных островов. Идеально для прохода к рифам, мелководьям и высадки на диких пляжах.",
    "upgrade.mayaBayTicket": "🎟️ Тур и билеты в Майя Бэй",
    "upgrade.mayaBayTicketDesc":
      "Гарантированные входные билеты в национальный парк Майя Бич вместе с круизом на традиционной деревянной лодке в кристально чистую лагуну Пиле.",
    "upgrade.jamesBondTicket": "🎬 Билеты на остров Джеймса Бонда",
    "upgrade.jamesBondTicketDesc":
      "Гарантированные входные билеты в национальный парк Ао Пханг Нга (остров Джеймса Бонда) с катанием на каноэ вокруг таинственных пещер.",
    "upgrade.jetskiTitle": "🌊 Прокат гидроциклов (Эксклюзивные острова)",
    "upgrade.jetskiRent": "Аренда скоростного гидроцикла на месте",
    "upgrade.jetskiDesc":
      "Наслаждайтесь кристально чистым мелководьем на современных аквабайках под присмотром квалифицированного гида.",
    "upgrade.jetskiQty": "Количество гидроциклов",
    "upgrade.jetskiUnitSingle": "Гидроцикл",
    "upgrade.jetskiUnitPlural": "Гидроцикла",
    "upgrade.jetskiDuration": "Продолжительность катания",
    "upgrade.jetskiLocked": "🔒 Прокат гидроциклов",
    "upgrade.jetskiKhaiNokOnly": "Только эксклюзивные острова",
    "upgrade.jetskiLimitDesc":
      "Прокат гидроциклов разрешен исключительно в определенных локациях (Ко Кхай Нок, Нака Яй, Нака Ной). Выберите одно из этих направлений для включения опции!",
    "upgrade.bananaBeachTitle":
      "🌊 Водные развлечения Banana Beach (Эксклюзив)",
    "upgrade.parasailing": "Забронировать парасейлинг",
    "upgrade.parasailingDesc":
      "Испытайте невероятный восторг, паря высоко над бирюзовым заливом Ко Хе вместе с обученными профессионалами по безопасности.",
    "upgrade.bananaBoat": "Забронировать катание на банане",
    "upgrade.bananaBoatDesc":
      "Соберите свою группу и подпрыгивайте на тропических волнах на нашем захватывающем скоростном надувном банане.",
    "upgrade.bananaBeachLocked": "🔒 Развлечения на Banana Beach",
    "upgrade.bananaBeachOnly": "Только для Banana Beach",
    "upgrade.bananaBeachLimitDesc":
      "Парасейлинг и катание на банане доступны исключительно на элитном игровом пляже Banana Beach (Ко Хе Север). Пожалуйста, выберите Banana Beach в качестве пункта назначения, чтобы включить эти опции!",
    "upgrade.rubberCanoeTitle": "🛶 Надувные каноэ Ко Калу Ок (Эксклюзив)",
    "upgrade.rubberCanoe": "Аренда надувных резиновых каноэ",
    "upgrade.rubberCanoeDesc":
      "Исследуйте скрытые морские пещеры и тихие внутренние лагуны в тишине на наших устойчивых надувных резиновых каноэ (макс. 2 пассажира на каноэ).",
    "upgrade.rubberCanoeQty": "Выберите количество (1-10 каноэ)",
    "upgrade.rubberCanoeUnitSingle": "Резиновое каноэ",
    "upgrade.rubberCanoeUnitPlural": "Резиновых каноэ",
    "upgrade.rubberCanoeLocked": "🔒 Аренда резиновых каноэ",
    "upgrade.rubberCanoeOnly": "Только для Ко Калу Ок",
    "upgrade.rubberCanoeLimitDesc":
      "Аренда резиновых каноэ доступна исключительно для направления Ко Калу Ок из-за его уникальных морских пещер и лагун. Пожалуйста, выберите Ко Калу Ок, чтобы включить эту опцию!",
    "upgrade.minibusTitle":
      "Частный трансфер на минивэне туда и обратно (Аэропорт/Отель)",
    "upgrade.minibusAdd": "Добавить трансфер туда и обратно",
    "upgrade.minibusDesc":
      "Добирайтесь без лишнего стресса в частном люксовом VIP-минивэне с кондиционером прямо до пирса отправления и обратно.",
    "upgrade.transferMarina": "Пирс прибытия",
    "upgrade.transferMarinaChalong":
      "Пирс Чалонг (Рекомендуется для Рача, Корал, Майтон)",
    "upgrade.transferMarinaAoPo":
      "Пирс Аอ По (Рекомендуется для Пханг Нга, Джеймс Бонд)",
    "upgrade.transferMarinaCoco": "Пирс Коко (Альтернативная точка)",
    "upgrade.transferGuests": "Количество пассажиров",
    "upgrade.transferGuestsUnitSingle": "Человек",
    "upgrade.transferGuestsUnitPlural": "Человек",
    "upgrade.guideTitle":
      "Профессиональный гид-переводчик на борту (Опционально)",
    "upgrade.guideSelect": "Выберите язык гида-сопровождающего",
    "upgrade.guideDesc":
      "Тщательно отобранные носители языка, сертифицированные Туристическим управлением Таиланда TAT. Отлично для экскурсий, перевода и безопасности.",
    "upgrade.guideNone": "Без гида (Только местный тайский шкипер и команда)",
    "upgrade.guideEn": "🇬🇧 Англоговорящий гид",
    "upgrade.guideIndian": "🇮🇳 Гид со знанием хинди",
    "upgrade.guideChinese": "🇨🇳 Китайскоговорящий гид",
    "upgrade.guideKr": "🇰🇷 Корейскоговорящий гид",
    "upgrade.guideArabic": "🇦🇪 Арабскоговорящий гид",
    "upgrade.guideRu": "🇷🇺 Русскоговорящий гид",
    "upgrade.fishingTitle": "🎣 Морская рыбалка и профессиональные снасти",
    "upgrade.fishingInclTitle": "✓ Рыбалка включена во все туры",
    "upgrade.fishingInclFree": "Бесплатно",
    "upgrade.fishingInclDesc":
      "Каждый частный чартер полностью укомплектован бесплатными донными лесками (хэндлайнами), грузилами, наживками и поддержкой дружной тайской команды, готовой почистить и пожарить ваш улов.",
    "upgrade.fishingPro": "Премиальные удочки и удилища",
    "upgrade.fishingProDesc":
      "Возьмите в аренду флагманские спиннинги, катушки и снасти для троллинга на глубине (Макс 5 шт):",
    "upgrade.fishingFreeOption":
      "0 - Без премиальных удочек (Использовать стандартные донные лески)",
    "upgrade.fishingProUnitSingle": "Премиальное удилище",
    "upgrade.fishingProUnitPlural": "Премиальных удилищ",
    "upgrade.fishingProFullSet": "Комплект премиальных удилищ",
  },
  hi: {
    "header.title": "चार्टर कॉन्फ़िगर करें",
    "header.subtitle": "निजी बेस्पोक यॉट कस्टमाइज़र",
    "step1.title": "01. कैटमारन चुनें",
    "step1b.title": "02. चार्टर अवधि चुनें",
    "step1b.half": "आधा दिन क्रूज़ (4-5 घंटे)",
    "step1b.halfDesc":
      "शाम को ढलते सूरज की सैर या सुबह के स्नॉर्कलिंग के लिए बिल्कुल सही। छोटे दौरों के लिए बहुत लोकप्रिय। शीतल पेय, बर्फ और स्थानीय फल शामिल हैं।",
    "step1b.full": "पूरा दिन क्रूज़ (8-9 घंटे)",
    "step1b.fullDesc":
      "अंडमान सागर की असीम गहराइयों का अनुभव करें। आपके चुने हुए रास्ते में भरपूर स्नॉर्कलिंग, समुद्र तट पर घूमने और धूप सेंकने के साथ पूर्ण समय लचीलापन।",
    "step1b.overnight": "रातोंरात चार्टर",
    "step1b.overnightDesc":
      "परम निजी नौका विहार विलासिता। 6-केबिन एसी सुविधा में सुरक्षित सोएं, प्राचीन खाड़ियों, निर्जन द्वीपों और कस्टम बहु-दिवसीय यात्राओं के लिए जागें।",
    "step1b.overnightDaysTitle": "रातोंरात चार्टर अवधि",
    "step1b.overnightDaysDesc":
      "बहु-दिवसीय क्रूज़ की लंबाई परिभाषित करें (1 से 7 रातें)",
    "step1b.night": "रात",
    "step1b.nights": "रातें",
    "step2.date": "चार्टर तिथि चुनें",
    "step2.guests": "बोर्ड पर मेहमानों की संख्या",
    "step2.adults": "वयस्क",
    "step2.adultsAge": "उम्र 18+",
    "step2.kids": "बच्चे (0-17)",
    "step2.kidsAge": "उम्र 0 से 17",
    "step2.maxWarning":
      "इस कैटामरान के लिए अधिकतम यात्री क्षमता पूरी हो गई है।",
    "step3.title": "04. गंतव्य मार्ग चुनें (कोई भी चुनें / अपनी योजना बनाएं)",
    "step3.recommended": "अनुशंसित प्रस्थान घाट",
    "step3.tip": "अनुकूलन युक्ति",
    "step3.tipDesc":
      "आपने {dest} जैसे गंतव्य चुने हैं। {pier} से शुरू करने पर कुल यात्रा का समय काफी कम हो जाता है!",
    "step3.adjustBtn": "अनुकूलतम घाट समायोजित करें",
    "step3.total": "कुल",
    "step4.title": "05. चयनित प्रस्थान घाट (Pier)",
    "step4.recommendedLabel": "अनुशंसित",
    "step4b.title": "06. वॉटर टॉयज़ और ऑनबोर्ड कस्टमाइज़ेशन (Optional)",
    "step4b.desc":
      "मानक गतिविधि संपत्तियों या प्रीमियम ऐड-ऑन गियर को शामिल करके पानी पर विलासिता को बढ़ाएं:",
    "upgrade.slider": "वाटर स्लाइड बुक करें",
    "upgrade.sliderLabel": "इन्फ्लेटेबल जाइंट सी वॉटर स्लाइडर",
    "upgrade.sliderDesc":
      "शीर्ष डेक फ्लाईब्रिज से सीधे पन्ना जैसे गर्म समुद्र में वाटर स्लाइडिंग का आनंद जोड़ें।",
    "upgrade.pool": "सेफ-पूल बुक करें",
    "upgrade.poolLabel": "इन्फ्लेटेबल ओशन स्विमिंग सेफ-पूल",
    "upgrade.poolDesc":
      "कैटमारन के पीछे एक सुरक्षित तैरता हुआ नेट पूल बनाता है, जो बच्चों को समुद्री लहरों और लहरों से सुरक्षित रखता।",
    "upgrade.cabin": "एसी केबिन बुक करें",
    "upgrade.cabinLabel": "वातानुकूलित केबिन",
    "upgrade.cabinDesc":
      "यात्रा के दौरान डबल बर्थ और संपूर्ण शॉवर सुविधाओं वाले निजी नीचे-डेक एसी बेडरूम को अनलॉक करें।",
    "upgrade.bbqTitle": "पाककला और भोजन खान-पान विकल्प",
    "upgrade.partyTitle": "पार्टी विकल्प बनाएं",
    "upgrade.partySub":
      "जश्न पैकेज, लाइव संगीत और पेशेवर मीडिया के साथ अपने चार्टर को खास बनाएं।",
    "upgrade.cateringSub":
      "अपने मेहमानों को समुद्र के किनारे असाधारण खान-पान का आनंद दें। अपने कटमरैन यात्रा के लिए सर्वोत्तम भोजन अपग्रेड चुनें:",
    "upgrade.foodOption": "चयनित विकल्प",
    "food.standard": "मानक मानार्थ मेनू",
    "food.standardLabel": "मानक चार्टर बोर्ड",
    "food.standardDesc":
      "ठंडे शीतल पेय, ताज़ा उष्णकटिबंधीय अनानास और तरबूज की थालियाँ, स्वच्छ पेयजल और {coolers} शामिल हैं।",
    "food.standardIncl": "निःशुल्क समावेशन",
    "food.seafood": "सीफूड बीबीक्यू दावत",
    "food.seafoodLabel": "डीलक्स ग्रील्ड सीफूड बीबीक्यू",
    "food.seafoodDesc":
      "अंडमान के ताजे समुद्री झींगे, स्क्विड, कोयले पर पके मछली के सीख, और मक्खन आलू के साथ परोसा जाता है।",
    "food.seafoodTag": "प्रीमियम अपग्रेड",
    "food.thai": "रॉयल थाई बैंक्वेट",
    "food.thaiLabel": "रॉयल थाई बुफे भोजन",
    "food.thaiDesc":
      "सिग्नेचर टॉम यम गूंग सूप, समृद्ध मासामन करी बीफ, अनानास फ्राइड राइस और मीठा आम स्टिकी राइस।",
    "food.thaiTag": "फुकेत स्पेशल",
    "food.western": "प्रीमियम वेस्टर्न बुफे",
    "food.westernLabel": "वेस्टर्न फाइन डाइनिंग",
    "food.westernDesc":
      "ट्रफ़ल्ड होक्काइडो सी स्कैलप्स, चार्ग्रिल्ड ऑस्ट्रेलियन ब्लैक एंगस टेंडरलॉइन, ऑर्गेनिक सीज़र और प्रीमियम मिठाई।",
    "food.westernTag": "एलीट रिज़र्व",
    "upgrade.bartender": "व्यावसायिक बारटेंडर सेवा",
    "upgrade.bartenderBtn": "मिक्सोलॉजिस्ट और बारटेंडर किराए पर लें",
    "upgrade.bartenderDesc":
      "अपने मेहमानों को सुरुचिपूर्ण अनुकूलित कॉकटेल शेकिंग, वाइन सेवा और कस्टम पार्टी मोजितोस का आनंद दें।",
    "upgrade.bartenderSelect": "बारटेंडर्स की संख्या चुनें",
    "upgrade.bartenderOpt1": "1 व्यावसायिक बारटेंडर",
    "upgrade.bartenderOpt2": "2 व्यावसायिक बारटेंडर",
    "upgrade.bartenderOpt3":
      "3 व्यावसायिक बारटेंडर (बड़े समूहों के लिए अनुशंसित)",
    "upgrade.cakeTitle": "जन्मदिन/सालगिरह केक",
    "upgrade.cakeBtn": "कस्टम जन्मदिन केक ऑर्डर करें",
    "upgrade.cakeDesc":
      "एक प्रीमियम, ताजा बेक किए गए कस्टमाइज्ड उत्सव केक के साथ अपने सफ़र को यादगार बनाएं। ठंडी डिलीवरी।",
    "upgrade.cakeSelect": "केक की मात्रा चुनें (1-5)",
    "upgrade.cakeOpt": "उत्सव का केक",
    "upgrade.cakeOptP": "उत्सव के केक",
    "upgrade.cakeOptMax": "उत्सव के केक (पूरा पार्टी पैकेज)",
    "step5.title": "07. अतिथि प्रतिनिधि का नाम",
    "step5.placeholder": "जैसे, प्रिया शर्मा",
    "step5.requests": "08. विशेष पूछताछ / अनुरोध",
    "step5.requestsPl": "जैसे, कैटरिंग विवरण, डाइविंग, सूर्यास्त सरप्राइज",
    "draft.title": "उत्पन्न पाठ (Draft)",
    "draft.copied": "✓ क्लिपबोर्ड पर कॉपी किया गया!",
    "draft.copy": "कॉपी संदेश",
    bookWhatsApp: "व्हाट्सएप से बुक करें",
    callAgency: "कॉल करें",
    speedBooking:
      "व्हाट्सएप चैट और प्रत्यक्ष वॉयस कॉल के माध्यम से त्वरित निजी चार्टर बुकिंग",

    // Destination Names
    "destinations.prompteph.name": "प्रॉम्प्टेप (प्रॉमथेप केप)",
    "destinations.prompteph.desc":
      "फुकेत का प्रसिद्ध दक्षिणी सिरा। शानदार खुले पानी के नज़ारे, विशाल चट्टानों और आश्चर्यजनक सूर्यास्त पृष्ठभूमि के लिए प्रसिद्ध।",
    "destinations.james-bond.name": "जेम्स बॉन्ड द्वीप (फांग न्गा खाड़ी)",
    "destinations.james-bond.desc":
      "को ता पु के रूप में प्रसिद्ध, फांग न्गा की शांत, पन्ना जैसे हरी लहरों में खड़ी विश्व प्रसिद्ध limestone karst.",
    "destinations.ko-he-south.name": "को हे साउथ साइड (coral द्वीप)",
    "destinations.ko-he-south.desc":
      "कोरल द्वीप का शांत, प्राचीन रेतीला किनारा। शांत नीले पानी में उथली स्नॉर्कलिंग के लिए अत्यधिक प्रिय।",
    "destinations.ko-he-north-banana-beach.name":
      "को हे नॉर्थ साइड (बनाना बीच)",
    "destinations.ko-he-north-banana-beach.desc":
      "फुकेत का विशिष्ट समुद्र तट खेल का मैदान। हरे-भरे जंगल, सफेद रेत और रोमांचक वाटर स्पोर्ट्स की सुविधा।",
    "destinations.ko-racha-yai.name": "को राचा याई",
    "destinations.ko-racha-yai.desc":
      "शानदार सफेद रेत की खाड़ियाँ और हरे-भरे पहाड़ों का सुंदर संगम। तैराकी और स्नॉर्कलिंग के लिए पानी अत्यधिक साफ़ रहता है।",
    "destinations.ko-racha-noi.name": "को राचा नोई",
    "destinations.ko-racha-noi.desc":
      "राचा याई की जंगली और अछूती बहन द्वीप। विशाल भूरे ग्रेनाइट पत्थरों और गहरे नीले पानी से घिरी हुई।",
    "destinations.maithon.name": "मैथॉन निजी द्वीप",
    "destinations.maithon.desc":
      "इसे अक्सर 'डॉल्फ़िन द्वीप' भी कहा जाता है क्योंकि यहाँ डॉल्फ़िन के झुंड अठखेलियाँ करते देखे जाते हैं। शांत और एकांत द्वीप।",
    "destinations.koh-khai-nok.name": "को खाई नोक",
    "destinations.koh-khai-nok.desc":
      "फुकेत के पूर्व में एक रमणीय छोटा द्वीप। इसके सफेद रेत और उथले किनारे पर सैकड़ों रंगीन मछलियाँ आपके हाथ के पास तैरती हैं।",
    "destinations.ko-he-ko-racha-yai-prompteph.name":
      "को हे - को राचा याई - प्रॉम्प्टेप",
    "destinations.ko-he-ko-racha-yai-prompteph.desc":
      "अंडमान का प्रीमियम ट्रिलॉजी: कोरल द्वीप पर स्नॉर्कलिंग, राचा याई पर अद्भुत जलीय जीवन, और प्रॉमथेप में विहंगम सूर्यास्त का आनंद।",
    "destinations.maithon-ko-he.name": "मैथॉन - को हे",
    "destinations.maithon-ko-he.desc":
      "मैथॉन की डॉल्फ़िन की टुकड़ियों की खोज करें, फिर तैराकी और स्नॉर्कलिंग के लिए कोरल बीच पर लंगर डालें।",
    "destinations.maithon-ko-racha-yai.name": "मैथॉन - को राचा याई",
    "destinations.maithon-ko-racha-yai.desc":
      "मैथॉन में रोमांचक डॉल्फ़िन दर्शन का समागम करें को राचा याई के शानदार सफ़ेद रेतीले सागर तटों के साथ।",
    "destinations.ko-racha-yai-ko-racha-noi.name": "को राचा याई - को राचा नोई",
    "destinations.ko-racha-yai-ko-racha-noi.desc":
      "गहरे पानी के साहसिक खेल का बेजोड़ बेंचमार्क। राचा याई से राचा नोई की विशाल प्राचीन चट्टानों की सुंदर यात्रा।",
    "destinations.koh-khai-nok-maithon.name": "को खाई नोक - मैथॉन",
    "destinations.koh-khai-nok-maithon.desc":
      "बेहतरीन पलायन: को खाई नोक की उथली मूँगे की चट्टानों के दर्शन के बाद मैथॉन द्वीप के गहरे डॉल्फ़िन चैनलों की सैर करें।",
    "destinations.ko-kalu-ok.name": "को कालू ओक (समुद्री गुफाएं और लैगून)",
    "destinations.ko-kalu-ok.desc":
      "फांग न्गा की खाड़ी में गुप्त आंतरिक लैगून और चूना पत्थर की समुद्री गुफा सुरंगें। केवल रबर कैनो द्वारा सुलभ प्राचीन प्राकृतिक सौंदर्य का अन्वेषण करें।",

    // Piers
    "piers.chalong.name": "चालोंग घाट (Chalong)",
    "piers.chalong.location": "दक्षिणी फुकेत (चालोंग खाड़ी)",
    "piers.chalong.desc":
      "फुकेत का प्राथमिक दक्षिणी बंदरगाह। को हे, राचा और मैथॉन जैसे प्रसिद्ध दक्षिणी द्वीपों के लिए उत्तम प्रस्थान बिंदु।",
    "piers.ao-po.name": "आओ पो पियर (Ao Po Pier)",
    "piers.ao-po.location": "पूर्वोत्तर फुकेत (Ao Po)",
    "piers.ao-po.desc":
      "पूर्वोत्तर फुकेत में विशिष्ट लक्जरी मरीना। ज्वार की चिंताओं के बिना सीधे फांग न्गा खाड़ी का बेजोड़ प्रवेश द्वार।",
    "upgrade.bbqGrillTitle": "बारबेक्यू ग्रिल ऐड-ऑन (वैकल्पिक)",
    "upgrade.gasBBQ": "गैस बारबेक्यू",
    "upgrade.gasBBQDesc":
      "डेक पर स्थापित उच्च दक्षता वाला प्रोपेन गैस बीबीक्यू ग्रिल। मांस या सीफूड की तेजी से और साफ ग्रिलिंग के लिए बिल्कुल सही। सभी नौकाओं पर उपलब्ध!",
    "upgrade.charcoalBBQ": "👑 क्लासिक कोयला बारबेक्यू",
    "upgrade.charcoalBBQDesc":
      "कैटमारन के पीछे डेक पर प्रीमियम क्लासिक लकड़ी-कोयला ग्रिल। आपके ताजे समुद्री शिकार को एक वास्तविक और सुगंधित धुएँ का स्वाद देता है।",
    "upgrade.charcoalBBQLocked": "🔒 क्लासिक कोयला बारबेक्यू",
    "upgrade.charcoalBBQTheBestOnly": 'केवल "The Best" के लिए',
    "upgrade.charcoalBBQLimitDesc":
      'असली कोयले से धुआं कूटने वाला बारबेक्यू सेटअप। यह विशेष सुविधा केवल हमारे प्रमुख फ्लैटबोट "The Best" पर अनुमत है।',
    "upgrade.fruitsTitle": "🍎 अतिरिक्त फल और नाश्ता प्लैटर्स",
    "upgrade.watermelon": "🍉 अतिरिक्त तरबूज",
    "upgrade.watermelonDesc":
      "ठंडी और मीठी रसीली लाल तरबूज की स्लाइस। मात्रा चुनें:",
    "upgrade.watermelonSelect.none": "0 - कोई नहीं",
    "upgrade.watermelonSelect.unitSingle": "थाली",
    "upgrade.watermelonSelect.unitPlural": "थालियाँ",
    "upgrade.snacks": "🍿 अतिरिक्त स्नैक्स",
    "upgrade.snacksDesc": "प्रीमियम स्नैक स्प्रेड चुनें (1-20):",
    "upgrade.snacksUnitSingle": "प्रीमियम स्नैक यूनिट",
    "upgrade.snacksUnitPlural": "प्रीमियम स्नैक यूनिट",
    "upgrade.pineapple": "🍍 अतिरिक्त अनानास",
    "upgrade.pineappleDesc": "मूल मीठा अनानास चुनें (1-10):",
    "upgrade.pineapplePlatterSingle": "अनानास प्लैटर",
    "upgrade.pineapplePlatterPlural": "अनानास प्लैटर्स",
    "upgrade.entertainmentTitle": "क्रूज़ पर प्रीमियम मनोरंजन कस्टमाइज़र",
    "upgrade.tvIncludedLabel": '🎁 द बेस्ट ("The Best") पर निःशुल्क शामिल है',
    "upgrade.tvIncludedTitle":
      'बच्चों के लिए नेटफ्लिक्स और यूट्यूब के साथ 32" स्मार्ट टीवी + फ्री वाईफाई इंटरनेट',
    "upgrade.tvIncludedDesc":
      "जहाज पर मानार्थ इंटरनेट का उपयोग और बच्चों को खुश तथा व्यस्त रखने के लिए डिजिटल कार्टून फिल्मों वाला एक समर्पित 32 इंच का टीवी।",
    "upgrade.karaokeTitle": "🎵 व्यावसायिक कराओके प्रणाली",
    "upgrade.karaokeDesc":
      "विशाल फ्लैट स्क्रीन, 50,000 से अधिक गानों की सूची और वायरलेस माइक्रोफोन के साथ मल्टी-स्पीकर सराउंड साउंड सिस्टम।",
    "upgrade.karaokeLocked": "🔒 ऑन-बोर्ड कराओके प्रणाली",
    "upgrade.karaokeLimitDesc":
      "अंडमान के अपने सूर्यास्त को एक शानदार ध्वनिक मंच में बदलें। यह प्रीमियम सुविधा विशेष रूप से हमारे प्रमुख कैटामरान द बेस्ट (The Best) पर एकीकृत है।",
    "upgrade.longtailTitle": "लॉन्गटेल बोट और द्वीप पार्क टिकट कस्टमाइज़र",
    "upgrade.privateLongtail": "⚓ निजी लॉन्ग टेल बोट",
    "upgrade.privateLongtailDesc":
      "चुने गए द्वीपों पर स्थानीय लकड़ी की पारंपरिक लॉन्ग टेल बोट का निजी व्यवस्थापन। प्रवाल भित्तियों के करीब जाने और निजी समुद्र तटों पर उतरने के लिए बेहतरीन।",
    "upgrade.mayaBayTicket": "🎟️ माया बे पार्क टिकट और टूर",
    "upgrade.mayaBayTicketDesc":
      "माया बीच के लिए राष्ट्रीय पार्क प्रवेश टिकट के साथ पिले लैगून के पारदर्शी फ़िरोज़ा पानी में लकड़ी की लॉगटेल नाव से सुंदर क्रूज़ विहार का संगम।",
    "upgrade.jamesBondTicket": "🎬 जेम्स बॉन्ड द्वीप टूर टिकट",
    "upgrade.jamesBondTicketDesc":
      "रहस्यमई समुद्री गुफाओं के आसपास कैनोइंग के साथ आओ फंग न्गा नेशनल पार्क (जेम्स बॉन्ड द्वीप) के लिए राष्ट्रीय उद्यान प्रवेश टिकट शामिल।",
    "upgrade.jetskiTitle": "🌊 जेट स्की किराया (विशेष द्वीप)",
    "upgrade.jetskiRent": "गंतव्य पर हाई-स्पीड जेट स्की किराए पर लें",
    "upgrade.jetskiDesc":
      "कुशल गाइडों की देखरेख में उच्च गुणवत्ता वाले वाटर स्कूटरों पर क्रिस्टल जैसे साफ पानी का आनंद लें।",
    "upgrade.jetskiQty": "जेट स्की की संख्या चुनें",
    "upgrade.jetskiUnitSingle": "जेट स्की",
    "upgrade.jetskiUnitPlural": "जेट स्कीज़",
    "upgrade.jetskiDuration": "सवारी की अवधि चुनें",
    "upgrade.jetskiLocked": "🔒 जेट स्की किराया प्रतिबंधित",
    "upgrade.jetskiKhaiNokOnly": "केवल विशेष द्वीप",
    "upgrade.jetskiLimitDesc":
      "जेट स्की संचालन विशेष रूप से चुनिंदा स्थानों (को खाई नोक, नाका याई, नाका नोई) पर उपलब्ध है। कृपया इसे सक्रिय करने के लिए इनमें से एक गंतव्य चुनें!",
    "upgrade.bananaBeachTitle": "🌊 बनाना बीच वाटर स्पोर्ट्स (एक्सक्लूसिव)",
    "upgrade.parasailing": "पैरासेलिंग अनुभव बुक करें",
    "upgrade.parasailingDesc":
      "प्रशिक्षित सुरक्षा पेशेवरों के साथ को हे की फ़िरोज़ा खाड़ी के ऊपर ऊंचे उड़ने के रोमांच का अनुभव करें।",
    "upgrade.bananaBoat": "बनाนา बोट राइड बुक करें",
    "upgrade.bananaBoatDesc":
      "अपने समूह को इकट्ठा करें और हमारे रोमांचक उच्च गति वाले इन्फ्लैटेबल बनाना बोट पर ट्रॉपिकल लहरों पर उछलें।",
    "upgrade.bananaBeachLocked": "🔒 बनाना बीच वाटर स्पोर्ट्स",
    "upgrade.bananaBeachOnly": "केवल बनाना बीच",
    "upgrade.bananaBeachLimitDesc":
      "पैरासेलिंग और बनाना बोट राइड विशेष रूप से विशिष्ट बनाना बीच खेल के मैदान (को हे उत्तर) पर उपलब्ध हैं। कृपया इन विकल्पों को सक्षम करने के लिए अपने गंतव्य के रूप में बनाना बीच चुनें!",
    "upgrade.rubberCanoeTitle": "🛶 को कालू ओक इन्फ्लेटेबल कैनो (एक्सक्लूसिव)",
    "upgrade.rubberCanoe": "इन्फ्लेटेबल रबर कैनो किराए पर लें",
    "upgrade.rubberCanoeDesc":
      "हमारे स्थिर उच्च-उछाल वाले इन्फ्लेटेबल रबर कैनो (प्रति कैनो अधिकतम 2 यात्री) के साथ मौन में छिपी समुद्री गुफाओं और शांत आंतरिक लैगून का पता लगाएं।",
    "upgrade.rubberCanoeQty": "मात्रा चुनें (1-10 कैनो)",
    "upgrade.rubberCanoeUnitSingle": "रबर कैनो",
    "upgrade.rubberCanoeUnitPlural": "रबर कैनो",
    "upgrade.rubberCanoeLocked": "🔒 रबर कैनो किराया",
    "upgrade.rubberCanoeOnly": "केवल को कालू ओक",
    "upgrade.rubberCanoeLimitDesc":
      "रबर कैनो किराया विशेष रूप से इसकी अनूठी समुद्री गुफाओं और आंतरिक लैगून के कारण को कालू ओक गंतव्य के लिए उपलब्ध है। कृपया इस विकल्प को सक्षम करने के लिए को कालू ओक चुनें!",
    "upgrade.minibusTitle":
      "निजी मिनीबस राउंडट्रिप हवाई अड्डा / होटल स्थानांतरण",
    "upgrade.minibusAdd": "राउंडट्रिप मिनीवैन ट्रांसफर जोड़ें",
    "upgrade.minibusDesc":
      "प्रस्थान घाट तक सीधे और वापसी के लिए वाठनुकूलित लक्जरी वीआईपी मिनीबस में तनावमुक्त रूप से पहुंचें।",
    "upgrade.transferMarina": "गंतव्य पिअर / जेटी",
    "upgrade.transferMarinaChalong":
      "चालोंग पियर (राचा, कोरल, मैथॉन के लिए अनुशंसित)",
    "upgrade.transferMarinaAoPo":
      "आओ पो पियर (फांग न्गा, जेम्स बॉन्ड के लिए अनुशंसित)",
    "upgrade.transferMarinaCoco": "कोको पियर (वैकल्पिक प्रस्थान बिंदु)",
    "upgrade.transferGuests": "यात्रियों / लोगों की संख्या",
    "upgrade.transferGuestsUnitSingle": "व्यक्ति",
    "upgrade.transferGuestsUnitPlural": "लोग",
    "upgrade.guideTitle": "व्यावसायिक गाइड और अनुवादक (वैकल्पिक)",
    "upgrade.guideSelect": "विशिष्ट भाषा गाइड चुनें",
    "upgrade.guideDesc":
      "थाईलैंड पर्यटन प्राधिकरण द्वारा प्रमाणित और अत्यधिक विश्वसनीय नेटिव-स्पीकिंग गाइड। द्वीपों के इतिहास, समुद्री वन्य जीवन और सुरक्षा अनुवाद के विस्तृत विवरण के लिए बिल्कुल सही।",
    "upgrade.guideNone":
      "किसी विशेष भाषा गाइड की आवश्यकता नहीं है (केवल स्थानीय थाई क्रू)",
    "upgrade.guideEn": "🇬🇧 अंग्रेजी बोलने वाले गाइड",
    "upgrade.guideIndian": "🇮🇳 हिंदी/भारतीय भाषा बोलने वाले गाइड",
    "upgrade.guideChinese": "🇨🇳 चीनी बोलने वाले गाइड",
    "upgrade.guideKr": "🇰🇷 कोरियाई बोलने वाले गाइड",
    "upgrade.guideArabic": "🇦🇪 अरबी बोलने वाले गाइड",
    "upgrade.guideRu": "🇷🇺 रूसी बोलने वाले गाइड",
    "upgrade.fishingTitle": "🎣 क्रूज़ मछली पकड़ने और व्यावसायिक गियर",
    "upgrade.fishingInclTitle":
      "✓ सभी यात्राओं पर मछली पकड़ना निःशुल्क शामिल है",
    "upgrade.fishingInclFree": "सभी के लिए मुफ़्त",
    "upgrade.fishingInclDesc":
      "प्रत्येक चार्टर में मानार्थ पारंपरिक हाथ की डोर, सिंकर्स, मीठी टैकल और आपके पकड़े गए शिकार को साफ करने या उसे बोर्ड पर ग्रिल करवाने के लिए क्रू का पूरा सहयोग शामिल है।",
    "upgrade.fishingPro": "प्रीमियम फिशिंग रॉड्स में अपग्रेड करें",
    "upgrade.fishingProDesc":
      "गहरे पानी में बड़े शिकार की खोज के लिए शीर्ष धातु की छड़ें, मजबूत रील और ट्रोलिंग गियर किराए पर लें (अधिकतम 5 रॉड्स):",
    "upgrade.fishingFreeOption":
      "0 - निःशुल्क हैंडलाइन का उपयोग करें (प्रीमियम रॉड नहीं)",
    "upgrade.fishingProUnitSingle": "प्रीमियम फिशिंग रोड",
    "upgrade.fishingProUnitPlural": "प्रीमियम फिशिंग रोड्स",
    "upgrade.fishingProFullSet": "प्रीमियम फिशिंग रोड्स (पूर्ण पैकेज)",
  },
  zh: {
    "header.title": "客舱及航程在线配置",
    "header.subtitle": "私人定制双体游艇定制系统",
    "step1.title": "01. 选择您的双体船",
    "step1b.title": "02. 选择航行时长",
    "step1b.half": "半日巡提观光 (4-5 小时)",
    "step1b.halfDesc":
      "非常适合下午观赏浪漫落水日落，或清晨体验高能浮潜。热带海岛微度假首选。含软饮、冰块和优质海岛水果。",
    "step1b.full": "全日深度巡游 (8-9 小时)",
    "step1b.fullDesc":
      "深度探索安达曼海的蔚蓝之境。航程时间完全自由支配，可尽情享受浮潜、沙滩漫步，或在甲板沙滩椅上悠闲享受日光浴。",
    "step1b.overnight": "双体船过夜包船",
    "step1b.overnightDesc":
      "最极致的私人奢华航海体验。在 6 间全空调双人客舱中安稳甜睡，清晨在未受污染的秘境港湾、无人离岛醒来，开启量身定制的多日航行。",
    "step1b.overnightDaysTitle": "包船过夜天数",
    "step1b.overnightDaysDesc": "请设定多日航行的时间范围（1至7晚）",
    "step1b.night": "晚",
    "step1b.nights": "晚",
    "step2.date": "选择出行日期",
    "step2.guests": "登船宾客总人数",
    "step2.adults": "成人",
    "step2.adultsAge": "18岁及以上",
    "step2.kids": "儿童与婴幼儿 (0-17)",
    "step2.kidsAge": "0 至 17 岁",
    "step2.maxWarning": "已达到该双体船的最大乘客容量上限。",
    "step3.title": "04. 选择目的地航线 (可多选 / 自行规划)",
    "step3.recommended": "推荐出发码头",
    "step3.tip": "航线优化建议",
    "step3.tipDesc":
      "您选择了像 {dest} 的方向。从 {pier} 出发，可为您节省大量在途航行时间！",
    "step3.adjustBtn": "调整为最佳出发码头",
    "step3.total": "总航程",
    "step4.title": "05. 已选择 Phuket 登船码头",
    "step4.recommendedLabel": "推荐港口",
    "step4b.title": "06. 海上玩具及升级项目配置 (可选)",
    "step4b.desc": "通过添加标准娱乐资产或顶级奢华附加设备，开启无限海上乐趣：",
    "upgrade.slider": "预订飞桥滑梯",
    "upgrade.sliderLabel": "双层海上充气巨无霸水上滑梯",
    "upgrade.sliderDesc":
      "从双体船上层飞桥甲板一滑而下，体验瞬间冲入翡翠色碧蓝大海的极致快感。",
    "upgrade.pool": "预订安全网泳池",
    "upgrade.poolLabel": "充气式海上防海蜇特质安全泳池",
    "upgrade.poolDesc":
      "在双体船船艉部署专属防流浮水网，为儿童和家庭建立安全的私密海水泳圈。",
    "upgrade.cabin": "预订空调卧舱",
    "upgrade.cabinLabel": "解锁包机专属空调豪华双人客舱",
    "upgrade.cabinDesc":
      "即使是日间航行也能解锁下层豪华冷气卧室，配备特大家卧铺与极奢独立卫浴淋浴系统。",
    "upgrade.bbqTitle": "精致餐点供应与客舱餐饮方案",
    "upgrade.partyTitle": "创建派对选项",
    "upgrade.partySub":
      "利用庆典套餐、现场音乐和专业媒体服务提升您的游艇体验。",
    "upgrade.cateringSub":
      "为您和贵宾奉上无与伦比的海上餐饮盛宴。请为您的双体船之旅选择最完美的餐饮升级方案：",
    "upgrade.foodOption": "当前选定方案",
    "food.standard": "标配免费精致欢迎餐单",
    "food.standardLabel": "标配免费水果冷盘",
    "food.standardDesc":
      "清凉软饮可乐、现场新鲜切片精美热带菠萝和冰镇大西瓜拼盘、进口矿泉水及包含 {coolers}。",
    "food.standardIncl": "完全免费包含",
    "food.seafood": "安达曼海鲜炭烤大餐",
    "food.seafoodLabel": "安达曼奢华炭烤海鲜烧烤盛宴",
    "food.seafoodDesc":
      "由船员亲手烹制深海红明虾、香肥起司黄油烤整鱿鱼、优质深海鳕鱼串及烘烤浓香大蒜黄油土豆块。",
    "food.seafoodTag": "顶级奢华升级",
    "food.thai": "泰王国皇家贡享晚宴",
    "food.thaiLabel": "经典皇家顶级泰式料理盛宴",
    "food.thaiDesc":
      "品尝泰式经典极品冬阴功鲜虾汤、香浓马沙文咖喱小牛肉、泰式大皇宫菠萝炒饭以及精选玉芒椰浆糯米饭。",
    "food.thaiTag": "普吉风情招牌",
    "food.western": "北海道大带子和牛西式自助",
    "food.westernLabel": "至尊轻奢西式自助高级餐单",
    "food.westernDesc":
      "极致享受奢华黑松露北海道特级带子扇贝、澳洲火山木炭烤安格斯牛柳、大区有机凯撒沙拉和主厨私人定制创意甜点。",
    "food.westernTag": "臻稀专属皇家",
    "upgrade.bartender": "聘请特调鸡尾酒调酒师服务",
    "upgrade.bartenderBtn": "预约星级专业游艇现场调酒师与执酒侍从",
    "upgrade.bartenderDesc":
      "为您的亲友和宾客配齐管家式鸡尾酒摇晃、起泡香槟起塞侍酒及专属特调清凉莫希托果酒派对服务。",
    "upgrade.bartenderSelect": "选择现场执役调酒师人数",
    "upgrade.bartenderOpt1": "1 位金牌金牌调酒师服务",
    "upgrade.bartenderOpt2": "2 位豪华行政调酒师 (伴宴管家服务)",
    "upgrade.bartenderOpt3":
      "3 位至尊级主干侍中 (建议多位贵宾大型聚会团建搭载)",
    "upgrade.cakeTitle": "海上定制手工庆典大蛋糕预约",
    "upgrade.cakeBtn": "尊享定制大尺寸海上生日/派对大蛋糕",
    "upgrade.cakeDesc":
      "让您的生日或海上求婚纪念更有仪式感，为您新鲜出炉并冷链直达游艇，在海风音乐中完美呈递惊喜。",
    "upgrade.cakeSelect": "预约定制蛋糕个数 (1-5 个)",
    "upgrade.cakeOpt": "定制大庆典蛋糕",
    "upgrade.cakeOptP": "定制大庆典蛋糕",
    "upgrade.cakeOptMax": "定制大庆典蛋糕 (全派对尊贵打包方案)",
    "step5.title": "07. 预订贵宾核心代表真实姓名",
    "step5.placeholder": "例如：张立廷 (Elena Mitchell)",
    "step5.requests": "08. 其他特殊定制需求、过敏源或特殊航行意向描述",
    "step5.requestsPl": "例如：有婴儿出行、自备红酒、快艇快划浮潜求婚安排...",
    "draft.title": "自动生成的航位及航期需求清单稿",
    "draft.copied": "✓ 成功复制并妥存至您的系统粘贴板！",
    "draft.copy": "一键复制草稿",
    bookWhatsApp: "一键调起 WhatsApp 发送预约",
    callAgency: "拨打客服电话快速响应",
    speedBooking: "点击按键可使用 WhatsApp 即时通信或直接通话极速锁定您的航位",

    // Destination Names
    "destinations.prompteph.name": "神仙半岛 (Phromthep Cape)",
    "destinations.prompteph.desc":
      "普吉岛最经典的南部地岬。以壮阔的断崖海景、清透海风，以及金黄色安达曼日落极致景观而名满天下。",
    "destinations.james-bond.name": "詹姆斯邦德 077 铁钉岛 (攀牙湾)",
    "destinations.james-bond.desc":
      "地质学名 Ko Ta Pu，矗立于平静绿翠的攀牙湾里。怪石嶙峋，四周环绕着红树林秘境水道。电影《金枪客》取景地。",
    "destinations.ko-he-south.name": "珊瑚岛南侧 (Ko He South Side)",
    "destinations.ko-he-south.desc":
      "珊瑚岛最为安静清秀的原始后滩，避开嘈杂人流。浅海区有超清澈的浮潜珊瑚，也是红嘴犀鸟繁衍的雨林家园。",
    "destinations.ko-he-north-banana-beach.name":
      "珊瑚岛北侧香蕉滩 (Banana Beach)",
    "destinations.ko-he-north-banana-beach.desc":
      "香蕉滩是高品质滨海乐园。拥有极具竹艺美学的大型穹顶。备有滑翔伞、海底漫步等多种奢华海上运动设施。",
    "destinations.ko-racha-yai.name": "皇帝岛-大拉查岛 (Ko Racha Yai)",
    "destinations.ko-racha-yai.desc":
      "环绕在热带火山森林中如粉末般的月牙形白沙湾。皇帝岛海水拥有无可比拟的高透光能见度，是浮潜及深潜潜水胜地。",
    "destinations.ko-racha-noi.name": "皇帝岛-小拉查岛 (Ko Racha Noi)",
    "destinations.ko-racha-noi.desc":
      "巨型花岗岩巨石环抱的无人野生群岛。海底断崖和蓝水晶般海平面吸引了大魔鬼鱼、大海龟等海洋大型野生动物繁衍。",
    "destinations.maithon.name": "脉通私人小岛 (Maithon Island)",
    "destinations.maithon.desc":
      "因常年有野生瓶鼻海豚家族在此嬉戏，又被称为「海豚岛」。这里水质无暇，是不受游人打扰的顶级家庭避世之所。",
    "destinations.koh-khai-nok.name": "蛋岛 (Koh Khai Nok)",
    "destinations.koh-khai-nok.desc":
      "普吉岛东部极其精致可爱的无人白细砂小岛。岸边海水极浅，可站在水里让数以千计的黄色条纹热带鱼亲和您的脚踝。",
    "destinations.ko-he-ko-racha-yai-prompteph.name":
      "珊瑚岛 + 大皇帝岛 + 神仙半岛日落 (三岛合一尊贵编排)",
    "destinations.ko-he-ko-racha-yai-prompteph.desc":
      "普吉最经典的包游航运完美篇章：在珊瑚岛浮潜鱼群中穿梭，在皇帝岛海湾游泳，并在晚霞中降落在神仙半岛断崖下。",
    "destinations.maithon-ko-he.name": "麦通岛 + 珊瑚岛双岛合一",
    "destinations.maithon-ko-he.desc":
      "去麦通岛追逐野生海豚嬉戏，随后游弋至珊瑚岛雪白平静的海湾沙滩上午睡放松，体验休闲派的绝妙组合。",
    "destinations.maithon-ko-racha-yai.name": "麦通海豚岛 + 大皇帝岛合一",
    "destinations.maithon-ko-racha-yai.desc":
      "将麦通岛海豚寻踪的乐趣与皇帝岛Patok Bay那粉末沙滩、蓝宝石色超清透海水完美融合，是最高人气的主流定制路线。",
    "destinations.ko-racha-yai-ko-racha-noi.name":
      "大皇帝岛 + 小皇帝岛皇帝岛全景",
    "destinations.ko-racha-yai-ko-racha-noi.desc":
      "普吉岛深海浮潜的绝对天花板级路线。从大皇帝岛如面粉般的白沙湾，起航前往小皇帝岛那宏伟的花岗岩怪石清溪。",
    "destinations.koh-khai-nok-maithon.name": "蛋岛玩浅水鱼 + 麦通私密海豚岛",
    "destinations.koh-khai-nok-maithon.desc":
      "为有长辈 or 携儿童的家庭设计的舒适漫渡。在蛋岛清浅见底的水中同成百上千条彩色小鱼嬉戏，在麦通清凉航道中远眺海豚。",
    "destinations.ko-kalu-ok.name": "迦鲁岛探索航线 (Koh Kalu Ok)",
    "destinations.ko-kalu-ok.desc":
      "攀牙湾最隐秘的内陆泻湖和石灰岩海蚀洞群。乘坐充气皮划艇进入这处只能通过狭窄洞穴抵达的‘海上世外桃源’。",

    // Piers
    "piers.chalong.name": "查龙客运码头 (Chalong Pier)",
    "piers.chalong.location": "普吉南部 (Chalong Bay)",
    "piers.chalong.desc":
      "普吉最主要的南部深水码头，是前往珊瑚岛、皇帝岛、麦通岛等南线群岛的黄金大本营出发口岸。",
    "piers.ao-po.name": "奥波码头 (Ao Po Pier)",
    "piers.ao-po.location": "普吉东北部 (Ao Po)",
    "piers.ao-po.desc":
      "普吉唯一的全天候深水超级码头，直面攀牙湾，出入湾区不受每日潮汐大起大落影响，尊贵出行不限航道。",
    "upgrade.bbqGrillTitle": "船载烧烤、烤炉设备升级 (可选)",
    "upgrade.gasBBQ": "环保气烤炉",
    "upgrade.gasBBQDesc":
      "在甲板上安装的高效环保丙烷气烧烤炉。非常适合快速、干净地烧烤各种肉类和海鲜。所有游艇均可配备！",
    "upgrade.charcoalBBQ": "👑 传统果木炭烤架",
    "upgrade.charcoalBBQDesc":
      "双体船船艉甲板上的高级传统果木炭烤架。为您的每日海钓渔获注入地道又浓郁的果木熏烤风味。",
    "upgrade.charcoalBBQLocked": "🔒 传统果木炭烤架",
    "upgrade.charcoalBBQTheBestOnly": '仅限旗舰船 "The Best"',
    "upgrade.charcoalBBQLimitDesc":
      "传统的木炭烧烤架。该项专属高能升级和设备受安全规范限制，仅对我们的旗舰双体船 The Best 开放。",
    "upgrade.fruitsTitle": "🍎 额外水果冷盘与精美点心拼盘",
    "upgrade.watermelon": "🍉 额外西瓜盘",
    "upgrade.watermelonDesc": "冰镇甜美的红瓤多汁西瓜切片。请选择采购份数：",
    "upgrade.watermelonSelect.none": "0 - 无",
    "upgrade.watermelonSelect.unitSingle": "盘",
    "upgrade.watermelonSelect.unitPlural": "盘",
    "upgrade.snacks": "🍿 额外点心",
    "upgrade.snacksDesc": "选择派对零点组合 (1-20):",
    "upgrade.snacksUnitSingle": "份精致零点拼盘",
    "upgrade.snacksUnitPlural": "份精致零点拼盘",
    "upgrade.pineapple": "🍍 额外菠萝盘",
    "upgrade.pineappleDesc": "选择当地金黄香甜菠萝拼盘 (1-10):",
    "upgrade.pineapplePlatterSingle": "份切片金菠萝",
    "upgrade.pineapplePlatterPlural": "份切片金菠萝",
    "upgrade.entertainmentTitle": "客舱外加多媒体娱乐项目配置",
    "upgrade.tvIncludedLabel": '🎁 旗舰版 "The Best" 完全免费包含',
    "upgrade.tvIncludedTitle":
      "32英寸智能电视已预置 Netflix、YouTube 少儿，及配套全船免费高速无线 WiFi",
    "upgrade.tvIncludedDesc":
      "免费提供的全船海域无线网络，以及内置丰富儿童卡通画册和影视娱乐的专用智能电视，确保孩子度过快乐舒适的航程。",
    "upgrade.karaokeTitle": "🎵 船载专业级多功能卡拉 OK 系统",
    "upgrade.karaokeDesc":
      "配备大容量多扬声器数字环绕音响系统、超大高清屏幕、搭载 50,000+ 首多国歌曲库和顶级降噪无线麦克风。",
    "upgrade.karaokeLocked": "🔒 卡拉 OK 娱乐系统",
    "upgrade.karaokeLimitDesc":
      "将您的安达曼海上落日熔金变成动听的露天歌剧舞台。该奢华配置仅限配置于我们的旗舰双体船客船 The Best。",
    "upgrade.longtailTitle": "传统长尾船租赁与海滩登岛门票",
    "upgrade.privateLongtail": "⚓ 私人专属经典木质长尾船",
    "upgrade.privateLongtailDesc":
      "在所选的海岛提供私人木质经典泰式长尾船租赁。极度适合靠近浅水珊瑚礁盘、探访浅海礁石与完成私人秘境沙滩登岸。",
    "upgrade.mayaBayTicket": "🎟️ 玛雅湾景区登岸与长尾船",
    "upgrade.mayaBayTicketDesc":
      "包含保障登入玛雅湾国家自然公园（Maya Beach）的海滩门票，以及搭乘木底传统长尾船畅游皮蕾湾（Pileh Lagoon）玻璃镜面水系的双重搭配。",
    "upgrade.jamesBondTicket": "🎬 詹姆斯邦德登岛游门票",
    "upgrade.jamesBondTicketDesc":
      "包含攀牙湾国家公园（Ao Phang Nga）詹姆斯邦德经典铁钉石的登入入场券，并搭配专人在神秘喀斯特岩溶洞中乘坐皮划艇探秘的奇妙探险。",
    "upgrade.jetskiTitle": "🌊 摩托艇租赁 (特定岛屿专属)",
    "upgrade.jetskiRent": "预订在目的岛屿租用极速海上摩托艇",
    "upgrade.jetskiDesc":
      "在资深运动教练的陪同和安全保障下，驾驶顶级海上摩托艇，在清透的水上体验乘风破浪的推背感。",
    "upgrade.jetskiQty": "选择预订摩托艇数量",
    "upgrade.jetskiUnitSingle": "架摩托艇",
    "upgrade.jetskiUnitPlural": "架摩托艇",
    "upgrade.jetskiDuration": "选择租赁体验时长",
    "upgrade.jetskiLocked": "🔒 摩托艇租赁受限",
    "upgrade.jetskiKhaiNokOnly": "仅限指定岛屿",
    "upgrade.jetskiLimitDesc":
      "根据海洋管理法规，海上极速摩托艇租赁仅允许在特定海域（蛋岛、大纳卡岛、小纳卡岛）开展。请选择这些目的地即可解锁此升级！",
    "upgrade.bananaBeachTitle": "🌊 香蕉滩水上运动 (独家)",
    "upgrade.parasailing": "预订滑翔伞体验",
    "upgrade.parasailingDesc":
      "在经过培训的安全专业人员指导下，在高空俯瞰珊瑚岛，体验翱翔在绿松石色海面上的极致刺激。",
    "upgrade.bananaBoat": "预订香蕉船体验",
    "upgrade.bananaBoatDesc":
      "和您的团队一起在令人兴奋的高速充气香蕉船上随波逐浪。",
    "upgrade.bananaBeachLocked": "🔒 香蕉滩水上运动",
    "upgrade.bananaBeachOnly": "仅限香蕉滩",
    "upgrade.bananaBeachLimitDesc":
      "滑翔伞和香蕉船仅在香蕉滩 (珊瑚岛北) 独家提供。请选择香蕉滩作为目的地以启用这些选项！",
    "upgrade.rubberCanoeTitle": "🛶 迦鲁岛探索型充气皮划艇 (独家)",
    "upgrade.rubberCanoe": "租赁充气橡胶皮划艇",
    "upgrade.rubberCanoeDesc":
      "搭乘我们平稳、高浮力的充气橡胶皮划艇，在静谧中探索隐藏的海蚀洞和浅滩内陆泻湖（每艘船限坐 2 名乘客）。",
    "upgrade.rubberCanoeQty": "选择皮划艇数量 (1-10 艘)",
    "upgrade.rubberCanoeUnitSingle": "艘皮划艇",
    "upgrade.rubberCanoeUnitPlural": "艘皮划艇",
    "upgrade.rubberCanoeLocked": "🔒 皮划艇租赁受限",
    "upgrade.rubberCanoeOnly": "仅限迦鲁岛 (Koh Kalu Ok)",
    "upgrade.rubberCanoeLimitDesc":
      "由于迦鲁岛拥有独特的海蚀洞和内陆泻湖地形，橡胶皮划艇租赁仅限此航线提供。请选择该目的地以启用此升级！",
    "upgrade.minibusTitle": "私人豪华冷气面包车双程接送规划",
    "upgrade.minibusAdd": "增加面包商务客车轮渡接送",
    "upgrade.minibusDesc":
      "专车专享，全程高端冷气豪华 VIP 商务面包车直达您的登船码头，并在归航后平稳安全接驳回您的酒店或机场。",
    "upgrade.transferMarina": "选择送往的预定出发游艇港口码头",
    "upgrade.transferMarinaChalong":
      "查龙港口码头 Chalong (推荐南线：珊瑚岛, 皇帝岛, 迈通岛)",
    "upgrade.transferMarinaAoPo":
      "奥波码头 Ao Po (推荐北线：攀牙湾, 詹姆斯邦德铁钉岛)",
    "upgrade.transferMarinaCoco":
      "可可码头 Coco Pier (普吉岛南部另一可选启航港口)",
    "upgrade.transferGuests": "选择乘车贵宾总人数",
    "upgrade.transferGuestsUnitSingle": "位贵宾",
    "upgrade.transferGuestsUnitPlural": "位宾客",
    "upgrade.guideTitle": "客舱翻译与行程中英文专员 (可选)",
    "upgrade.guideSelect": "定制专属双语行程经理或认证随船导游",
    "upgrade.guideDesc":
      "严格筛选、持有泰王国旅游局（TAT）国家级认证的专业导游与同声随同翻译。提供海岛风物历史、海洋生物解说，并保障航海翻译便利。",
    "upgrade.guideNone": "不需特殊语言导游 (仅提供专业泰籍船长和基础英语船员)",
    "upgrade.guideEn": "🇬🇧 专业英语行程管家导游",
    "upgrade.guideIndian": "🇮🇳 专业印地语随船随行翻译",
    "upgrade.guideChinese": "🇨🇳 专业资深中文双语导游随船服务",
    "upgrade.guideKr": "🇰🇷 专业韩语随同翻译导游随同",
    "upgrade.guideArabic": "🇦🇪 专业阿拉伯语双语领队",
    "upgrade.guideRu": "🇷🇺 专业俄语翻译随船游览领队",
    "upgrade.fishingTitle": "🎣 海钓活动配置与高级钓竿租售",
    "upgrade.fishingInclTitle": "✓ 所有航线均完全免费包含海钓活动",
    "upgrade.fishingInclFree": "完全免费",
    "upgrade.fishingInclDesc":
      "普吉岛包船出航均全面免费搭载传统木轮手拉钓线配置、经典抛坠、生鲜鱼饵，并配备全心尽责的船员，在现场为您清理并烧烤渔获！",
    "upgrade.fishingPro": "自付升级租用专业深海拖钓竿及绕线器",
    "upgrade.fishingProDesc":
      "如有深海捕猎意愿, 可自选租赁世界一流海钓绕线手柄、专业纺车轮、深海多级路亚拖钓竿组 (最多可配5竿组):",
    "upgrade.fishingFreeOption":
      "0 - 使用常规免费手提木轮吊线配置 (不升级专业鱼竿)",
    "upgrade.fishingProUnitSingle": "套深水职业抛竿组合",
    "upgrade.fishingProUnitPlural": "套深海路亚拖钓鱼竿套组",
    "upgrade.fishingProFullSet": "至尊专业级路亚全拖钓渔竿全家桶",
  },
  th: {
    "header.title": "กำหนดรายละเอียดการเช่าเรือ",
    "header.subtitle": "โปรแกรมออกแบบทริปเรือยอชท์ส่วนตัวเฉพาะคุณ",
    "step1.title": "01. เลือกเรือยอชท์ของคุณ",
    "step1b.title": "02. เลือกเวลาที่ต้องการล่องเรือ",
    "step1b.half": "ครึ่งวัน (4-5 ชั่วโมง)",
    "step1b.halfDesc":
      "เหมาะอย่างยิ่งสำหรับทริปชมพระอาทิตย์ตกดินยามบ่ายอันแสนผ่อนคลาย หรือการดำน้ำตื้นรับอรุณมื้อเช้า ยอดฮิตสำหรับวันหยุดสั้นๆ รวมเครื่องดื่ม น้ำแข็ง และผลไม้ท้องถิ่น",
    "step1b.full": "เต็มวัน (8-9 ชั่วโมง)",
    "step1b.fullDesc":
      "สัมผัสประสบการณ์ความมหัศจรรย์ของทะเลอันดามันอย่างเต็มอิ่ม ให้ความยืดหยุ่นของเวลาอย่างเต็มที่ พร้อมพื้นที่ดำน้ำตื้น เดินเล่นชายหาด และพักผ่อนนอนอาบแดดอย่างไม่เร่งรีบ",
    "step1b.overnight": "ทริปเช่าเหมาลำแบบค้างคืน",
    "step1b.overnightDesc":
      "ที่สุดแห่งความหรูหราส่วนตัว พักผ่อนบนห้องนอนปรับอากาศ 6 ห้องอย่างปลอดภัย ตื่นขึ้นมาพบเกาะและอัญมณีเม็ดงามอันเงียบสงบ ตลอดจนการล่องเรือหลายวันตามใจชอบ",
    "step1b.overnightDaysTitle": "ระยะเวลาการเช่าเหมาค้างคืน",
    "step1b.overnightDaysDesc":
      "ระบุจำนวนคืนที่ประสงค์จะล่องเรือค้างคืน (1 ถึง 7 คืน)",
    "step1b.night": "คืน",
    "step1b.nights": "คืน",
    "step2.date": "เลือกวันที่ล่องเรือ",
    "step2.guests": "จำนวนผู้โดยสารบนเรือ",
    "step2.adults": "ผู้ใหญ่",
    "step2.adultsAge": "อายุ 18 ปีขึ้นไป",
    "step2.kids": "เด็ก (0-17)",
    "step2.kidsAge": "อายุ 0 ถึง 17 ปี",
    "step2.maxWarning": "จำนวนผู้โดยสารเต็มความจุสูงสุดของเรือลำนี้แล้ว",
    "step3.title":
      "04. เลือกเส้นทางจุดหมายปลายทาง (เลือกได้หลายเส้นทาง / กำหนดเอง)",
    "step3.recommended": "ท่าเรือแนะนำสำหรับการออกเดินทาง",
    "step3.tip": "เคล็ดลับการเดินทางที่ดีที่สุด",
    "step3.tipDesc":
      "คุณเลือกเส้นทางเที่ยวเกาะ {dest} การเดินทางจากท่าเรือ {pier} จะช่วยประหยัดเวลาล่องเรือและหลีกเลี่ยงกระแสน้ำได้ดีที่สุด!",
    "step3.adjustBtn":
      "ปรับเปลี่ยนท่าเรือให้เหมาะสมที่สุดเพื่อประหยัดเวลาล่องเรือ",
    "step3.total": "รวมทั้งหมด",
    "step4.title": "05. ท่าเรือขึ้นเรือที่ท่านเลือกในภูเก็ต",
    "step4.recommendedLabel": "แนะนำเป็นสถิติดีสุด",
    "step4b.title":
      "06. ของเล่นทางน้ำและการปรับแต่งพิเศษบนเรือ (ระบุเพิ่มเติม)",
    "step4b.desc":
      "เติมเต็มความสนุกสุดหรูบนผืนน้ำด้วยของเล่นยอดนิยมและสิ่งอำนวยความสะดวกระดับพรีเมียม:",
    "upgrade.slider": "จองสไลเดอร์ถ่านลมยักษ์",
    "upgrade.sliderLabel": "สไลเดอร์ยักษ์เป่าลมสำหรับเล่นในทะเล",
    "upgrade.sliderDesc":
      "เพิ่มความสนุกสนานด้วยสไลเดอร์ลื่นไหลจากบนฟลายบริดจ์ชั้นบนสุดตรงลงสู่ผืนน้ำทะเลสีมรกตอย่างเร้าใจ",
    "upgrade.pool": "จองสระตาข่ายท้ายเรือ",
    "upgrade.poolLabel": "สระว่ายน้ำเป่าลมกันกระแสน้ำและสัตว์ทะเล",
    "upgrade.poolDesc":
      "จัดตั้งสระน้ำตาข่ายท้ายเรือยอชท์ ปกป้องทุกคนจากกระแสน้ำแรงและแมงกะพรุนไฟเพื่อความปลอดภัยสูงสุดของครอบครัว",
    "upgrade.cabin": "จองห้องนอนปรับอากาศ",
    "upgrade.cabinLabel": "เปิดใช้งานห้องพักปรับอากาศส่วนตัวบนเรือ",
    "upgrade.cabinDesc":
      "คลายความร้อนในระหว่างวันด้วยการเปิดระบบห้องนอนปรับอากาศสุดหรูหรา พร้อมเตียงคู่หนานุ่มและห้องน้ำส่วนตัวในตัว",
    "upgrade.bbqTitle": "ตัวเลือกอาหารและบาร์บีคิวรสเลิศบนเรือ",
    "upgrade.partyTitle": "สร้างตัวเลือกปาร์ตี้",
    "upgrade.partySub":
      "ยกระดับการล่องเรือของคุณด้วยแพ็คเกจเฉลิมฉลอง ดนตรีสด และบริการสื่อระดับมืออาชีพ",
    "upgrade.cateringSub":
      "ดูแลแขกคนสำคัญของคุณด้วยบริการอาหารรสเลิศริมทะเล เลือกแพ็กเกจอาหารที่ดีที่สุดสำหรับการเดินทางด้วยเรือแคทามารันของคุณ:",
    "upgrade.foodOption": "ตัวเลือกที่เลือก",
    "food.standard": "ชุดอาหารต้อนรับมาตรฐานไม่มีค่าใช้จ่าย",
    "food.standardLabel": "อาหารและของว่างมาตรฐานไม่มีค่าใช้จ่าย",
    "food.standardDesc":
      "น้ำอัดลมแสนชื่นใจ ผลไม้สดจานใหญ่แตงโมกับสับปะรด น้ำดื่มใสบริสุทธิ์ รวมทั้งบริการ {coolers} สำหรับแช่เย็นส่วนตัวฟรี",
    "food.standardIncl": "บริการให้ฟรี ไม่มีค่าบริการ",
    "food.seafood": "บาร์บีคิวอาหารทะเลสดๆ หรูหรา",
    "food.seafoodLabel": "ชุดบาร์บีคิวปลาซีบาส ซีฟู้ด และกุ้งลายเสือปิ้งย่างสด",
    "food.seafoodDesc":
      "กุ้งทะเลอันดามันย่างตัวโตๆ หมึกสดๆ เสียบไม้ย่างเตาถ่านสดใหม่เสิร์ฟพร้อมข้าวโพดอบเนยกระเทียม",
    "food.seafoodTag": "บริการสั่งพิเศษพรีเมียม",
    "food.thai": "อาหารไทยประณีตสไตล์รอยัล",
    "food.thaiLabel": "บุฟเฟ่ต์อาหารไทยสไตล์รอยัลโฮมเมด",
    "food.thaiDesc":
      "แกงปูใบชะพลูสูตรต้นตำรับ ต้มยำกุ้งแสนเผ็ดร้อน ข้าวผัดสับปะรดเม็ดโตอบเนยทอง และข้าวเหนียวมะม่วงหวานฉ่ำ",
    "food.thaiTag": "เมนูภูเก็ตขึ้นชื่อ",
    "food.western": "อาหารตะวันตกพรีเมียมบุฟเฟ่ต์",
    "food.westernLabel": "อาหารตะวันตกฟายน์ไดนิ่งเสิร์ฟร้อน",
    "food.westernDesc":
      "หอยเชลล์ฮอกไกโดอบน้ำมันทรัฟเฟิล เนื้อแองกัสชั้นดีออสเตรเลียปิ้งย่าง ซีซาร์สลัดสดใหม่ และของหวานสไตล์ตะวันตกพรีเมียม",
    "food.westernTag": "เฉพาะระดับวีไอพีเท่านั้น",
    "upgrade.bartender": "บริการบาร์เทนเดอร์และผู้ช่วยส่วนตัวบนเรือ",
    "upgrade.bartenderBtn": "บริการบาร์เทนเดอร์และพนักงานบริการระดับมืออาชีพ",
    "upgrade.bartenderDesc":
      "บริการปรนเปรอผู้ร่วมทริปด้วยมิกโซโลจิสต์ส่วนตัวที่จะมาเขย่าเครื่องดื่มค็อกเทลรสเลิศ เสิร์ฟไวน์ และรังสรรค์ปาร์ตี้อารมณ์ดีบนเรือยอชท์",
    "upgrade.bartenderSelect": "ระบุจำนวนพนักงานที่ต้องการ",
    "upgrade.bartenderOpt1": "พนักงานบาร์เทนเดอร์มืออาชีพ 1 คน",
    "upgrade.bartenderOpt2": "พนักงานดูแลและบริการระดับหรู 2 คน",
    "upgrade.bartenderOpt3":
      "ดูแลระดับท็อป 3 คน (แนะนำสำหรับเป็นอาหารและผู้โดยสารจำนวนมาก)",
    "upgrade.cakeTitle": "เค้กฉลองวันเกิดวันครบรอบแสนพิเศษ",
    "upgrade.cakeBtn":
      "สั่งเค้กวันเกิด / เครือบฉลองวันประทับใจเป็นพิเศษเฉพาะทริป",
    "upgrade.cakeDesc":
      "ส่งมอบความทรงจำดีๆ ให้คนพิเศษด้วยเค้กส่วนตัวสไตล์พรีเมียม ขนส่งระบบเย็นตรงสู่ห้องครัวของเรือเก็บรอเข้าพิธีเซอร์ไพรส์",
    "upgrade.cakeSelect": "ระบุจำนวนก้อนเค้กเป้าหมาย (1-5 ก้อน)",
    "upgrade.cakeOpt": "เค้กวันเกิดร่วมเฉลิมฉลองพิเศษ 1 ก้อน",
    "upgrade.cakeOptP": "เค้กวันเกิดร่วมเฉลิมฉลองพิเศษ",
    "upgrade.cakeOptMax": "เค้กฉลองครบชุดใหญ่ (เหมาะโปรแกรมทริปขนาดใหญ่)",
    "step5.title": "07. ชื่อตัวแทนผู้ประสานงาน",
    "step5.placeholder": "เช่น คุณธนา แสงทอง",
    "step5.requests": "08. คำขอพิเศษ / ความต้องการเพิ่มเติม",
    "step5.requestsPl":
      "เช่น ข้อมูลจำกัดอาหาร แพ้อาหาร ต้องการดำน้ำลึก สกูบ้า หรือข้อความเขียนหน้าเค้ก...",
    "draft.title": "เอกสารร่างสัญญาและแจ้งความต้องการทริปจองเรือ",
    "draft.copied": "✓ คัดลอกรายละเอียดทริปลงคลิปบอร์ดสำเร็จแล้ว!",
    "draft.copy": "คัดลอกข้อความร่าง",
    bookWhatsApp: "ส่งข้อความเพื่อยืนยันจองผ่าน WhatsApp",
    callAgency: "โทรติดต่อยืนยันด่วน",
    speedBooking:
      "บริการจองทริปเรือยอชท์ส่วนตัวที่สะดวกรวดเร็วผ่านไลน์ WhatsApp หรือการโทรศัพท์ติดต่อเราโดยตรง",

    // Destination Names
    "destinations.prompteph.name":
      "แหลมพรหมเทพ (จุดชมวิวพระอาทิตย์ตกดินอันดับ 1)",
    "destinations.prompteph.desc":
      "จุดชมวิวขึ้นชื่อทางใต้สุดของภูเก็ต เดินทางล่องเรือเพื่อยืนรับลมชมภาพอาทิตย์โค้งจมแผ่นน้ำหน้าหน้าผาหินแกรนิตสูงใหญ่ในยามอัสดงสีทอง",
    "destinations.james-bond.name": "เกาะเจมส์บอนด์ พังงาเบย์",
    "destinations.james-bond.desc":
      "โดดเด่นด้วยเสาหินปูนสูงรูปเข็มตะปู เกาะตาปู เป็นที่รู้จักทั่วโลกในภาพยนตร์เจมส์บอนด์ 007 ตั้งตระหง่านกลางมรกตของอ่าวพังงา",
    "destinations.ko-he-south.name": "เกาะเฮ ฝั่งใต้ (เงียบสงบ หลีกหนีผู้คน)",
    "destinations.ko-he-south.desc":
      "ชาดหาดฝั่งลับอันเงียบสงบ หลบเลี่ยงความวุ่นวายได้อย่างประเสริฐ ดื่มด่ำกับการดำน้ำตื้นน้ำใส ตุ่นนกเงือกป่าบินคอยทักทายคุณตามทิวไผ่ธรรมชาติ",
    "destinations.ko-he-north-banana-beach.name":
      "เกาะเฮ ฝั่งเหนือ (บานาน่าบีช โซนไฮเอนด์)",
    "destinations.ko-he-north-banana-beach.desc":
      "จุดสังสรรค์ระดับลักชัวรี โดดเด่นด้วยสถาปัตยกรรมไม้ไผ่พาสิงห์ธรรมชาติ กิจกรรมทางน้ำระดับโปร พาราเซลลิ่ง และความคึกคักอย่างมีสไตล์",
    "destinations.ko-racha-yai.name": "เกาะราชาใหญ่ (น้ำใส หาดทรายละเอียดแป้ง)",
    "destinations.ko-racha-yai.desc":
      "ความงามเว้าโค้งของอ่าวปะตก ล้อมรอบด้วยภูทิวเขาสลัดเขียว ราชาใหญ่มีระดับน้ำใสและความสว่างใต้น้ำดีเลิศ เหมาะกับทริปว่ายน้ำและดำน้ำสำรวจธรรมชาติ",
    "destinations.ko-racha-noi.name": "เกาะราชาน้อย (ความอัศจรรย์แห่งทะเลลึก)",
    "destinations.ko-racha-noi.desc":
      "เกาะพี่น้องที่ไร้ผู้อยู่อาศัย สวรรค์ลึกลับของภูเขาหินแกรนิตสีเข้ม น้ำลึกสีแซฟไฟร์สดใส มีปะการังที่อุดมสมบูรณ์และปลากระเบนราหูเต่าทะเลแวะเวียนประดับคลื่น",
    "destinations.maithon.name":
      "เกาะไม้ท่อน (จุดทักทายปลาโลมาป่าชายหาดส่วนตัว)",
    "destinations.maithon.desc":
      "มักถูกเรียกว่าเกาะโลมาเนื่องจากมีครอบครัวฝูงโลมาป่าคอยดำผุดพ่นน้ำใกล้ชายหาด ทริปนี้จะพาทุกท่านจอดเรือพักผ่อนเล่นน้ำตื้นในบรรยากาศเป็นส่วนตัวสูงสุด",
    "destinations.koh-khai-nok.name": "เกาะไข่นอก (เกาะปลากระต่ายขวัญใจเด็กๆ)",
    "destinations.koh-khai-nok.desc":
      "เกาะทรายแก้วรูปเสี้ยวพระจันทร์ ทางทิศตะวันออกของภูเก็ต น้ำไม่ลึก ปลาลายเสือตัวเล็กนับร้อยจะเข้ามารุมล้อมว่ายรอบขาของท่าน มอบความสุขให้ทริปครอบครัว",
    "destinations.ko-kalu-ok.name": "เกาะกาลูออก (ถ้ำทะเลและลากูน)",
    "destinations.ko-kalu-ok.desc":
      "ลากูนภายในที่เป็นความลับและอุโมงค์ถ้ำทะเลหินปูนในอ่าวพังงา สำรวจวิหารธรรมชาติที่บริสุทธิ์ซึ่งเข้าถึงได้โดยเรือยางเป่าลมเท่านั้น",
    "destinations.ko-he-ko-racha-yai-prompteph.name":
      "ทริปไตรภาคพรีเมียม (เกาะเฮ • เกาะราชาใหญ่ • แหลมพรหมเทพ ชมพระอาทิตย์อัสดง)",
    "destinations.ko-he-ko-racha-yai-prompteph.desc":
      "การเดินทางสุดหรูประสมประสาน 3 ไฮไลต์ทะเลใต้: ดำน้ำเกาะเฮ สนุกสนานน้ำใสที่ราชาใหญ่ และจิบเครื่องดื่มท้ายเรือดึงความสุขใต้หน้าผาแหลมพรหมเทพ",
    "destinations.maithon-ko-he.name":
      "ทริปครอบครัวยอดฮิต: เกาะไม้ท่อน • เกาะเฮ ทวิภาคผ่อนคลาย",
    "destinations.maithon-ko-he.desc":
      "ล่องเรือลานใบเลาะตามหาฝูงโลมาธรรมชาติรอบเกาะไม้ท่อน จากนั้นทิ้งสมอบริเวณชายหาดเม็ดทรายละเอียดแผงของเกาะเฮเพื่อเล่นสแตนด์อัพแพดเดิลบอร์ด (SUP)",
    "destinations.maithon-ko-racha-yai.name":
      "ล่องสองเกาะลักชัวรี: เกาะไม้ท่อน • เกาะราชาใหญ่",
    "destinations.maithon-ko-racha-yai.desc":
      "ทางเลือกสมบูรณ์แบบที่ผสานกิจกรรมเดินทางทักทายฝูงโลมาน่ารักที่ไม้ท่อน เข้ากับการดำว่ายชมแนวประกายปะการังปลาการ์ตูนน้ำใสราวน้ำสระกลางอ่าวของราชาใหญ่",
    "destinations.ko-racha-yai-ko-racha-noi.name":
      "ที่สุดแห่งความใส: เกาะราชาใหญ่ • เกาะราชาน้อย ผจญภัยทางเรืออันดามันลึก",
    "destinations.ko-racha-yai-ko-racha-noi.desc":
      "ที่สุดจุดมุ่งหมายดำน้ำลึกระดับมาสเตอร์พีซ ล่องเรือจากปลายหาดปาดมุกของราชาใหญ่ สูงสุดหน้าผาภูเขาหินแรนิตสวรรค์นักประดาน้ำของราชาน้อยอย่างน่าอัศจรรย์",
    "destinations.koh-khai-nok-maithon.name":
      "เกาะไข่นอกปลาลายเสือตื้น • เกาะไม้ท่อนหาฝูงโลมาป่า",
    "destinations.koh-khai-nok-maithon.desc":
      "แผนเดินทางยอดนิยมที่ลอยลำช้าๆ รับสมลมเย็น เหมาะสมกับเด็กเล็กและผู้สูงวัย สนุกสนานกับปลากลุ่มตื้นที่ไข่นอกและลอยตัวสงบหาโลมาที่ไม้ท่อน",

    // Piers
    "piers.chalong.name": "อ่าวท่าเรือฉลอง (Chalong Pier)",
    "piers.chalong.location": "ภูเก็ตตอนใต้ (อ่าวฉลอง)",
    "piers.chalong.desc":
      "ท่าเรือหลักสำหรับล่องเรือยอชท์ลงสู่ทิศใต้ของภูเก็ต จุดคุ้มเดินทางดีที่สุดสำหรับต่อไปยังเกาะเฮ ราชา และไม้ท่อน",
    "piers.ao-po.name": "ท่าเรืออ่าวปอ (Ao Po Pier)",
    "piers.ao-po.location": "ภูเก็ตตะวันออกเฉียงเหนือ (อ่าวปอ)",
    "piers.ao-po.desc":
      "ท่าเรือระดับลักชัวรีน้ำลึกทางภูเก็ตตะวันออกเฉียงเหนือ เรือใหญ่จอดคล่องแคล่ว มีจุดเดินเรือตรงลงสู่อ่าวพังงาได้ทันทีโดยไม่ต้องรอตารางน้ำขึ้น-ลด",
    "upgrade.bbqGrillTitle":
      "อุปกรณ์เสริมเตาปิ้งย่างบาร์บีคิวปิกนิกบนเรือ (เลือกระบุเพิ่ม)",
    "upgrade.gasBBQ": "เตาบาร์บีคิวระบบแก๊สไร้ควัน",
    "upgrade.gasBBQDesc":
      "เตาย่างแก๊สโพรเพนประสิทธิภาพสูง จัดวางไว้บนระเบียงท้ายเรือ เหมาะกับการย่างเนื้อหรืออาหารทะเลสะดวกรวดเร็ว มีบริการครบทุกเรือ!",
    "upgrade.charcoalBBQ": "👑 เตาย่างถ่านไม้ธรรมชาติสุดคลาสสิก",
    "upgrade.charcoalBBQDesc":
      "ชุดเตาถ่านไม้พรีเมียมคลาสสิกบริเวณระเบียงท้ายเรือ ช่วยมอบกลิ่นอายความหอมอบอวลรมควันธรรมชาติให้แก่ปลาที่ตกได้สดๆ ของคุณ",
    "upgrade.charcoalBBQLocked": "🔒 เตาย่างถ่านไม้ธรรมชาติสุดคลาสสิก",
    "upgrade.charcoalBBQTheBestOnly": 'เฉพาะเรือ "The Best" เท่านั้น',
    "upgrade.charcoalBBQLimitDesc":
      "บริการชุดปิ้งย่างถ่านรมควันระดับพรีเมียม คุณลักษณะพิเศษนี้ได้รับการจำกัดด้านความปลอดภัยเฉพาะบนเรือธงลำใหญ่ที่สุด คือ The Best เท่านั้น",
    "upgrade.fruitsTitle": "🍎 สั่งเพิ่มชุดผลไม้สดและของว่างยอดนิยม",
    "upgrade.watermelon": "🍉 แตงโมแช่เย็นสั่งพิเศษ",
    "upgrade.watermelonDesc":
      "แตงโมเนื้อแดงฉ่ำหวานแช่เย็นเจี๊ยบ เลือกปริมาณชุดที่จอง:",
    "upgrade.watermelonSelect.none": "0 - ไม่รับเพิ่ม",
    "upgrade.watermelonSelect.unitSingle": "จาน",
    "upgrade.watermelonSelect.unitPlural": "จาน",
    "upgrade.snacks": "🍿 ชุดของว่างทิปปิกพรีเมียม",
    "upgrade.snacksDesc": "เลือกจำนวนกล่องของว่างเคี้ยวเล่นพรีเมียม (1-20):",
    "upgrade.snacksUnitSingle": "ชุดของว่างพรีเมียม",
    "upgrade.snacksUnitPlural": "ชุดของว่างพรีเมียม",
    "upgrade.pineapple": "🍍 สับปะรดท้องถิ่นหวานฉ่ำ",
    "upgrade.pineappleDesc": "เลือกจำนวนจานสับปะรดภูเก็ตหวานกรอบ (1-10):",
    "upgrade.pineapplePlatterSingle": "จานสับปะรดสด",
    "upgrade.pineapplePlatterPlural": "จานสับปะรดสด",
    "upgrade.entertainmentTitle": "ระบบความบันเทิงระดับพรีเมียมบนเรือ",
    "upgrade.tvIncludedLabel": '🎁 ได้รับสิทธิใช้ฟรี บนเรือ "The Best"',
    "upgrade.tvIncludedTitle":
      'สมาร์ททีวี 32" พร้อมบริการช่องภาพยนตร์และเน็ตฟลิกซ์สำหรับเด็ก + ฟรีอินเทอร์เน็ต WiFi',
    "upgrade.tvIncludedDesc":
      "อินเทอร์เน็ตไร้สายสำหรับเช็คอินบนเรือ และทีวี 32 นิ้วพร้อมรายการเพื่อพัฒนาการเด็ก ช่วยให้กลุ่มเด็กๆ มีความบันเทิงอย่างมีความสุข",
    "upgrade.karaokeTitle": "🎵 ชุดเครื่องเสียงและคาราโอเกะมืออาชีพบอร์ดแคส",
    "upgrade.karaokeDesc":
      "ระบบเสียงเซอร์راวด์รอบทิศทางพร้อมจอทีวีแบนขนาดใหญ่ คลังเพลงลิขสิทธิ์กว้างขวางกว่า 50,000 เพลง และไมโครโฟนไร้สายเสียงดี",
    "upgrade.karaokeLocked": "🔒 ระบบคาราโอเกะพิเศษบนเรือ",
    "upgrade.karaokeLimitDesc":
      "เปลี่ยนทัศนียภาพอัศดงสีครามอันดามันของคุณให้เป็นเวทีความบันเทิงสุดประทับใจ แพ็กเกจสุดพิเศษนี้บูรณาการเฉพาะบนเรือธง The Best",
    "upgrade.longtailTitle":
      "แพ็กเกจเรือหางยาวส่วนตัวเฉพาะที่และตั๋วอุทยานแห่งชาติ",
    "upgrade.privateLongtail": "⚓ เรือหางยาวโบราณรับส่งส่วนตัวเฉพาะเกาะ",
    "upgrade.privateLongtailDesc":
      "เช่าเรือหางยาวไม้ท้องถิ่นส่วนตัว อำนวยความสะดวกดีเยี่ยมสำหรับการพาดำน้ำตื้นชิดปะการังน้ำตื้นและพาแวะขึ้นหาดทรายส่วนตัวของเกาะแสนสะดวก",
    "upgrade.mayaBayTicket": "🎟️ บัตรผ่านเข้าหาดมาหยาแห่งชาติภูเก็ตพร้อมทัวร์",
    "upgrade.mayaBayTicketDesc":
      "บัตรผ่านประตูอุทยานอ่าวมาหยาที่ได้รับการคุ้มครองสิทธิ์ ร่วมกับความอบอุ่นของการนั่งเรือหางยาวไม้ท้องถิ่นล่องเข้าไปยังอ่าวปิเละเพื่อสัมผัสน้ำใสสระมรกต",
    "upgrade.jamesBondTicket":
      "🎬 บัตรผ่านอุทยานแห่งชาติเกาะเจมส์บอนด์เขาพิงกัน",
    "upgrade.jamesBondTicketDesc":
      "รวมบัตรผ่านเข้าอุทยานแห่งชาติอ่าวพังงา (เกาะตาปู เขาพิงกัน) ตลอดจนกิจกรรมพายเรือคายัคลอดชมถ้ำมหัศจรรย์หินงอกหินย้อยกับพนักงานพายเรือ",
    "upgrade.jetskiTitle": "🌊 กิจกรรมเช่าเจ็ทสกี (เฉพาะเกาะที่กำหนด)",
    "upgrade.jetskiRent":
      "เช่าเหมาเครื่องเล่นเจ็ทสกีความเร็วสูงตามจุดหมายปลายทาง",
    "upgrade.jetskiDesc":
      "สนุกสนานกับเครื่องเล่นเจ็ทสกีส่วนตัวในระดับแนวคลื่นใสสะอาดพร้อมพนักงานคอยคุมด้านความปลอดภัย",
    "upgrade.jetskiQty": "ระบุจำนวนเครื่องเจ็ทสกีที่เช่า",
    "upgrade.jetskiUnitSingle": "คัน",
    "upgrade.jetskiUnitPlural": "คัน",
    "upgrade.jetskiDuration": "ระบุช่วงระยะเวลาที่เช่าเล่น",
    "upgrade.jetskiLocked": "🔒 กิจกรรมขี่เจ็ทสกีปิดให้บริการ",
    "upgrade.jetskiKhaiNokOnly": "เฉพาะเกาะที่ได้รับอนุญาตเท่านั้น",
    "upgrade.jetskiLimitDesc":
      "กิจกรรมเจ็ทสกีเปิดให้บริการเฉพาะบางพื้นที่ (เกาะไข่นอก, นาคาใหญ่, นาคาน้อย) โปรดเลือกจุดหมายปลายทางเหล่านี้เพื่อเปิดใช้งาน!",
    "upgrade.bananaBeachTitle": "🌊 กิจกรรมทางน้ำ Banana Beach (เอ็กซ์คลูซีฟ)",
    "upgrade.parasailing": "จองกิจกรรมพาราเซลลิ่ง (Parasailing)",
    "upgrade.parasailingDesc":
      "สัมผัสความตื่นเต้นขั้นสุดขณะลอยตัวสูงเหนืออ่าวสีครามของเกาะเฮ ภายใต้การดูแลของผู้เชี่ยวชาญด้านความปลอดภัย",
    "upgrade.bananaBoat": "จองเรือกล้วย (Banana Boat)",
    "upgrade.bananaBoatDesc":
      "รวบรวมกลุ่มเพื่อนของคุณและกระโดดไปตามคลื่นที่น่าตื่นเต้นด้วยเรือกล้วยความเร็วสูงของเรา",
    "upgrade.bananaBeachLocked": "🔒 กิจกรรมทางน้ำ Banana Beach",
    "upgrade.bananaBeachOnly": "เฉพาะบานาน่าบีชเท่านั้น",
    "upgrade.bananaBeachLimitDesc":
      "พาราเซลลิ่งและพานาน่าโบ๊ทมีให้บริการเฉพาะที่บานาน่าบีช (เกาะเฮฝั่งเหนือ) เท่านั้น โปรดเลือกบานาน่าบีชเป็นจุดหมายปลายทางเพื่อเปิดใช้งานตัวเลือกเหล่านี้!",
    "upgrade.rubberCanoeTitle":
      "🛶 กิจกรรมพายเรือแคนูยาง Koh Kalu Ok (เอ็กซ์คลูซีฟ)",
    "upgrade.rubberCanoe": "เช่าเรือแคนูยางเป่าลม",
    "upgrade.rubberCanoeDesc":
      "สำรวจถ้ำทะเลที่ซ่อนอยู่และลากูนภายในที่เงียบสงบด้วยเรือแคนูยางเป่าลมที่มีความลอยตัวสูงและมั่นคงของเรา (นั่งได้สูงสุด 2 ท่านต่อลำ)",
    "upgrade.rubberCanoeQty": "ระบุจำนวนเรือ (1-10 ลำ)",
    "upgrade.rubberCanoeUnitSingle": "เรือแคนูยาง",
    "upgrade.rubberCanoeUnitPlural": "เรือแคนูยาง",
    "upgrade.rubberCanoeLocked": "🔒 กิจกรรมเช่าเรือแคนูยาง",
    "upgrade.rubberCanoeOnly": "เฉพาะเกาะกาลูออกเท่านั้น",
    "upgrade.rubberCanoeLimitDesc":
      "กิจกรรมเช่าเรือแคนูยางมีให้บริการเฉพาะที่เกาะกาลูออกเท่านั้นเนื่องจากมีถ้ำทะเลและลากูนภายในที่โดดเด่น โปรดเลือกเกาะกาลูออกเพื่อเปิดใช้งานตัวเลือกนี้!",
    "upgrade.minibusTitle":
      "บริการรถตู้ปรับอากาศวีไอพีไปกลับ รับส่งโรงแรม/สนามบิน",
    "upgrade.minibusAdd": "เลือกบริการจองรถตู้วีไอพีไปกลับตามพิกัด",
    "upgrade.minibusDesc":
      "เดินทางสะดวกรวดเร็วไร้กังวลกับรถตู้รับแอร์คูลวีไอพี รับพาทุกท่านเดินทางตรงจากพิกัดเข้าหาท่าเรือและส่งพากลับโรงแรมอย่างปลอดภัย",
    "upgrade.transferMarina": "ระบุสถานีท่าเรือขึ้นเรือเป้าหมาย",
    "upgrade.transferMarinaChalong":
      "อ่าวท่าเรือฉลอง Chalong (แนะนำสำหรับเกาะราชา เกาะเฮ เกาะไม้ท่อน)",
    "upgrade.transferMarinaAoPo":
      "ท่าเรืออ่าวปอ Ao Po (แนะนำสำหรับอ่าวพังงา เกาะเจมส์บอนด์)",
    "upgrade.transferMarinaCoco":
      "ท่าเรือโคโค่ (Coco Pier - ยอดฮิตโซนตะวันออก)",
    "upgrade.transferGuests": "เลือกจำนวนผู้โดยสารรถตู้",
    "upgrade.transferGuestsUnitSingle": "ท่าน",
    "upgrade.transferGuestsUnitPlural": "ท่าน",
    "upgrade.guideTitle":
      "บริการไกด์ผู้ประสานงานและแปลภาษาต่างประเทศมืออาชีพ (เลือกระบุเพิ่ม)",
    "upgrade.guideSelect": "ระบุภาษาพนักงานประสานงานหลัก",
    "upgrade.guideDesc":
      "มัคคุเทศก์ภาษาต่างประเทศที่มีบัตรรับรองจาก ททท. คัดกรองมารยาทดูแลดีเยี่ยม เหมาะอย่างยิ่งในการประสานการขนส่ง อธิบายข้อมูลธรรมชาติ และการแปลภาษา",
    "upgrade.guideNone":
      "ไม่รับบริการไกด์กิตติมศักดิ์ (เฉพาะทีมกัปตันและทีมบริการไทยพื้นเมืองหลักเท่านั้น)",
    "upgrade.guideEn": "🇬🇧 พนักงานอำนวยความสะดวกภาษาอังกฤษ",
    "upgrade.guideIndian": "🇮🇳 พนักงานประสานงานอินเดียภาษาฮินดี",
    "upgrade.guideChinese": "🇨🇳 ไกด์กิตติมศักดิ์ภาษาจีนดูแลครอบครัว",
    "upgrade.guideKr": "🇰🇷 พนักงานผู้ช่วยภาษาเกาหลี",
    "upgrade.guideArabic": "🇦🇪 พนักงานบริการภาษาอาหรับ",
    "upgrade.guideRu": "🇷🇺 มัคคุเทศก์ผู้เชี่ยวชาญภาษารัสเซีย",
    "upgrade.fishingTitle": "🎣 ตกปลามืออาชีพและอุปกรณ์คันเบ็ดลากจูงพรีเมียม",
    "upgrade.fishingInclTitle": "✓ บริการกิจกรรมตกปลาเบ็ดสายจานฟรีทุกเส้นทาง",
    "upgrade.fishingInclFree": "บริการฟรีไม่มีชาร์จ",
    "upgrade.fishingInclDesc":
      "ทุกการเดินทางแบบเหมาลำครอบคลุมการแถมจานเบ็ดตกปลามือชักแบบคลาสสิก ลูกตะกั่ว และนิลเหยื่อสดตลอดจนความสุขจากทีมเรือที่จะคอยขอดเกล็ดแล่หน้าเตาทำซาซิมิหรือบาร์บีคิวฟรี",
    "upgrade.fishingPro":
      "เลือกอัปเกรดเช่าเบ็ดตกปลามืออาชีพและรอกลากจูงพรีเมียม",
    "upgrade.fishingProDesc":
      "บริการเช่าเช็คคันเบ็ดและรอกตกปลาระดับสปอร์ตไฮเอนด์ สำหรับการลากเหยื่อปลอมและตกปลาน้ำลึกทะเลอันดามัน (ทำเช่าได้สูงสุด 5 คัน):",
    "upgrade.fishingFreeOption":
      "ต้องการใช้เครื่องมือสายมือตามมาตรฐานจานฟรีหลัก",
    "upgrade.fishingProUnitSingle": "คันเบ็ดระดับมืออาชีพ",
    "upgrade.fishingProUnitPlural": "คันเบ็ดระดับมืออาชีพ",
    "upgrade.fishingProFullSet": "ชุดเบ็ดลากสปอร์ตพูลฟูลเซ็ตแบบครบมือ",
  },
};
