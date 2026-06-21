export type LanguageCode =
  | "en"
  | "ru"
  | "hi"
  | "ar"
  | "th"
  | "zh"
  | "fr"
  | "de";

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  flag: string;
  isRtl?: boolean;
}

export const LANGUAGES_CONFIG: LanguageConfig[] = [
  { code: "en", label: "English", flag: "🇬🇧", isRtl: false },
  { code: "ru", label: "Русский", flag: "🇷🇺", isRtl: false },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", isRtl: false },
  { code: "zh", label: "中文", flag: "🇨🇳", isRtl: false },
  { code: "th", label: "ไทย", flag: "🇹🇭", isRtl: false },
  { code: "fr", label: "Français", flag: "🇫🇷", isRtl: false },
  { code: "de", label: "Deutsch", flag: "🇩🇪", isRtl: false },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "Yacht Charter",
    "header.tagline": "Exclusive Private Maritime Experiences",
    "header.reservations": "Direct Reservations",
    "header.configure": "Configure Charter",
    "hero.badge": "Bespoke Island Sailings",
    "hero.heading1": "Tailor-Made Private",
    "hero.heading2": "Catamaran Day Trips",
    "hero.description":
      "Discover the hidden lagoons and pure azure waters of the Andaman Sea on an exquisite private yacht excursion. Charter The Best, NAMASTE, or THE ONE for customized island exploration.",
    "hero.selectVessel": "Select Your Vessel",
    "hero.planTrip": "Plan Custom Day-Trip",
    "hero.planParty": "Plan Party Trip",
    "hero.planOvernight": "Plan Overnight Trip",

    // Stats
    "stats.catamarans": "Catamarans Available",
    "stats.ports": "Phuket Launch Piers",
    "stats.destinations": "Tropical Destinations",
    "stats.itineraries": "Bespoke Itineraries",

    // Fleet Overview UI
    "fleet.badge": "Fleet Selection",
    "fleet.heading": "Choose Your Sailing Marvel",
    "fleet.description":
      "Our vessels boast superlative offshore engineering, luxurious cabins, double-deck lounging comfort, and a professional captain.",
    "fleet.capacity": "Guests capacity max",
    "fleet.length": "Length",
    "fleet.cabins": "Cabins",
    "fleet.bathrooms": "Bathrooms",
    "fleet.suitability": "Celebration Suitability",
    "fleet.selected": "Selected",
    "fleet.selectBtn": "Select Vessel",
    "fleet.configureBtn": "Configure This Vessel",
    "fleet.speed": "Speed",
    "fleet.built": "Built/Refitted",

    // Vessel Card Details & Specs (English UI translation overrides)
    "vessel.yacht": "Luxury Catamaran Yacht",
    "vessel.suitability": "Celebration Suitability",
    "vessel.capacityLabel": "Maximum Capacity",
    "vessel.upTo": "Up to",
    "vessel.guests": "Guests",
    "vessel.cabinsLabel": "Cabins & Baths / Layout",
    "vessel.cabins": "Cabins",
    "vessel.baths": "Baths",
    "vessel.speedLabel": "Cruising Speed",
    "vessel.crewLabel": "Professional Crew",
    "vessel.crew": "Crew Members",
    "vessel.amenities": "Onboard Amenities & Water Toys",
    "vessel.features": "Key Excursion Highlights & Inclusions",
    "vessel.selected": "Selected",
    "vessel.select": "Select Yacht",
    "vessel.book": "Configure & Book",

    // Benefits
    "benefits.title": "Day Charter Benefits",
    "benefits.subtitle":
      "Every private catamaran expedition features executive-level marine benefits designed to ensure complete relaxation.",
    "benefits.skipper.title": "Expert Skipper & Hostess",
    "benefits.skipper.desc":
      "Dedicated regional mariners managing navigation, snorkeling points, and hospitality.",
    "benefits.catering.title": "Tropical Catering",
    "benefits.catering.desc":
      "Fresh seasonal island fruits, premium soft drinks, clean ice water, and appetizing snacks.",
    "benefits.gear.title": "Sea Toys & Snorkeling Gear",
    "benefits.gear.desc":
      "Includes deep-ocean snorkel masks, swim jackets, and stand-up paddleboards.",
    "benefits.safety.title": "Onboard First Aid Kit",
    "benefits.safety.desc":
      "For your complete peace of mind, every catamaran in our fleet is fully prepared with a seaworthy professional First Aid Kit.",
    "benefits.seasickness.title": "Sea Sickness Tablets",
    "benefits.seasickness.desc":
      "For a smooth and comfortable voyage, every catamaran in our fleet is fully equipped with sea sickness tablets, provided entirely free of charge.",

    // Booking Form UI
    "form.step1.title": "01. Select Your Vessel",
    "form.step1b.title": "02. Choose Charter Duration",
    "form.step1b.half": "Half Day Cruise (4-5 hours)",
    "form.step1b.full": "Full Day Cruise (8-9 hours)",
    "form.step2.title": "03. Date & Guest Count",
    "form.step2.date": "Select Charter Date",
    "form.step2.guests": "Number of Guests on board",
    "form.step3.title":
      "04. Choose Destination Route (Select any / Plan your own)",
    "form.step3.recommended": "Recommended Departure Pier",
    "form.step3.warning": "Departure pier mismatched! Highly recommend picking",
    "form.step4.title": "05. Select Phuket Departure Pier",
    "form.step4b.title": "06. Customize Excursion or Party Upgrades",
    "form.step4b.desc":
      "Unfold luxury on water by including standard activity assets or premium add-on gears.",
    "form.upgrade.slider": "Inflatable Giant Sea Water Slider",
    "form.upgrade.sliderDesc":
      "Add dynamic sliding fun directly off the top deck flybridge into the emerald warm ocean.",
    "form.upgrade.pool": "Inflatable Ocean Swimming Safe-Pool",
    "form.upgrade.poolDesc":
      "Creates a secure perimeter floating net pool behind the catamaran hull, protecting kids from currents.",
    "form.upgrade.cabin": "Charter Air-Conditioned Cabins",
    "form.upgrade.cabinDesc":
      "Unlock private below-deck AC bedroom domains with double berths and full shower facilities during the sail.",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "Culinary & Onboard Food Catering Options",
    "form.upgrade.foodStandard": "Standard Complimentary Menu",
    "form.upgrade.foodStandardDesc":
      "Assorted gourmet finger food appetizers, regional chicken satay skewers, and refreshing local pad-thai wraps.",
    "form.upgrade.foodStandardIncl": "Included Complimentary",
    "form.upgrade.foodSeafood": "Seafood BBQ Feast",
    "form.upgrade.foodSeafoodDesc":
      "Grilled Andaman sea prawns, buttery squid aquarium, deep-sea cod fish skewers, and baked garlic butter potatoes.",
    "form.upgrade.foodThai": "Royal Thai Banquet",
    "form.upgrade.foodThaiDesc":
      "Signature Tom Yum Goong soup, rich Massaman curry beef, pineapple fried rice, and sweet gold mango sticky rice.",
    "form.upgrade.foodWestern": "Premium Western Buffet",
    "form.upgrade.foodWesternDesc":
      "Truffled Hokkaido sea scallops, chargrilled Australian black angus tenderloin, organic Caesar and premium dessert.",
    "form.upgrade.selected": "Selected Option",

    "form.upgrade.bartender": "Professional Bartender Service (Party Upgrade)",
    "form.upgrade.bartenderBtn": "Hire Guest-Facing Mixologist & Bartender",
    "form.upgrade.bartenderDesc":
      "Treat your guests to elegant customized cocktail shaking, wine service, and custom-infused party mojitos.",
    "form.upgrade.bartenderSelect": "Select Number of Bartenders",
    "form.upgrade.bartenderOpt1": "1 Professional Bartender",
    "form.upgrade.bartenderOpt2": "2 Professional Bartenders",
    "form.upgrade.bartenderOpt3":
      "3 Professional Bartenders (Recommended for large groups)",

    "form.upgrade.cakeTitle":
      "Celebration Birthday Cake (Anniversary & Party Upgrade)",
    "form.upgrade.cakeBtn": "Order Custom Birthday / Celebration Cake",
    "form.upgrade.cakeDesc":
      "Make your charter unforgettable with a premium, freshly baked customized celebration cake. Hand-delivered and chilled.",
    "form.upgrade.cakeSelect": "Select Quantity of Cakes (1-5)",
    "form.upgrade.cakeOpt": "Celebration Cake",
    "form.upgrade.cakeOptP": "Celebration Cakes",
    "form.upgrade.cakeOptMax": "Celebration Cakes (Full party package)",

    // Customer Detail Form & Actions
    "form.step5.title": "07. Guest Representative Name",
    "form.step5.placeholder": "e.g. Elena Mitchell",
    "form.step5.requests": "08. Special Inquiries / Requests",
    "form.step5.requestsPl":
      "e.g. catering details, diving needs, sunset surprises",

    // Copy & Form Triggers
    "form.draft.title": "Generated Inquiry Text",
    "form.draft.copy": "Copy message",
    "form.draft.copied": "✓ Copied to clipboard!",
    "form.bookWhatsApp": "Book with WhatsApp",
    "form.callAgency": "Call",
    "form.downloadPdf": "Download Custom PDF Brochure",
    "form.speedBooking":
      "Fast private charter booking via WhatsApp chat & direct voice call",

    // Success Toast
    "toast.successTitle": "Draft Formulated",
    "toast.successDesc":
      "Your customized itinerary is ready. Please proceed with sending the message on WhatsApp to finalize your booking dates!",

    // Privacy Banner UI & Cookie links
    "privacy.btn": "Privacy Settings",
    "privacy.pdpa": "PDPA Disclosure",
    "footer.language": "Select Language",
    "page.translation.instruction":
      "This page can be auto-translated. If you use Google Chrome, go to settings (3 dots, top right) and select 'Translate' to read in your preferred language.",

    // Map & Guide Translations
    "map.interactiveChart": "01. Interactive Phuket Chart",
    "map.exploreRoutes": "Explore the Andaman Routes",
    "map.exploreDesc":
      "Navigate between launching harbors and exotic destinations on our bespoke interactive chart. Tap any point to plot a cruise trajectory line, review direct nautical mile distances, transit hours, and custom excursions details.",
    "map.legend": "Map Legend",
    "map.startHub": "Start Pier Hub",
    "map.activePoint": "Active Point",
    "map.destIsland": "Destination Island",
    "map.target": "Tropical Target",
    "map.cruise": "Cruise",
    "map.features": "Features & Offerings",
    "map.optimalPier": "Optimal Launch Pier:",
    "map.distance": "Distance",
    "map.transit": "Transit Time",
    "map.excursion": "Excursion",
    "map.private": "100% Private",
    "map.optimalDeparture": "Optimal Departure Pier",
    "map.hours": "hours",
    "map.hour": "Hr",
    "piers.chalong.location": "South",
    "piers.ao-po.location": "Northeast",
    "destination.startingPoint": "STARTING POINT",
    "guide.title": "Phuket Destination Guide",
    "guide.subtitle":
      "Compare distances and optimal cruise point recommendations",
    "filter.all": "All Islands",
    "btn.addToRoute": "Add to Route",
    "map.dragToPan": "DRAG MAP TO PAN",
    "map.chartScale": "CHART SCALE: 1 : 250,000",
    "map.latLong": "LAT/LONG REF: 7.9512° N, 98.3916° E",
    "map.andamanSea": "Andaman Sea",
    "map.tip":
      "Hover over markers to preview trajectories. Tap to target excursion info.",
    "map.maxSpeed": "All Boat speeds max 8 kts",
    "map.zoomIn": "Zoom In",
    "map.zoomOut": "Zoom Out",
    "map.zoomReset": "Reset View",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.short": "Chalong",
    "piers.ao-po.short": "Ao Po Pier",
    "map.startingPort": "Starting Pier",
    "map.destination": "Destination",
    "map.estTime": "Est. Time",
    "map.southPhuketDept": "South Phuket Departure",
    "map.nePhuketBase": "Ao Po Pier (Northeast)",
  },
  ru: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "Аренда Яхт",
    "header.tagline": "Эксклюзивные частные морские приключения",
    "header.reservations": "Прямое бронирование",
    "header.configure": "Настроить чартер",
    "hero.badge": "Индивидуальные морские прогулки",
    "hero.heading1": "Частные дневные круизы",
    "hero.heading2": "на катамаране по вашему вкусу",
    "hero.description":
      "Откройте для себя скрытые лагуны и лазурные воды Андаманского моря на великолепной частной яхте. Арендуйте The Best, NAMASTE или THE ONE для индивидуального исследования островов.",
    "hero.selectVessel": "Выбрать яхту",
    "hero.planTrip": "Запланировать круиз",
    "hero.planParty": "Заказать пати-круиз",
    "hero.planOvernight": "Круиз с ночевкой",
    "stats.catamarans": "Доступно катамаран",
    "stats.ports": "Порты отправления на Пхукете",
    "stats.destinations": "Тропические направления",
    "stats.itineraries": "Индивидуальные маршруты",

    // Fleet Overview UI
    "fleet.badge": "Выбор флота",
    "fleet.heading": "Выберите свой катамаран",
    "fleet.description":
      "Наши суда отличаются великолепными характеристиками мореходности, роскошными каютами, максимальным комортом двух палуб и профессиональным капитаном.",
    "fleet.capacity": "Макс. вместимость гостей",
    "fleet.length": "Длина",
    "fleet.cabins": "Каюты",
    "fleet.bathrooms": "Ванные комнаты",
    "fleet.suitability": "Подходит для праздников",
    "fleet.selected": "Выбрано",
    "fleet.selectBtn": "Выбрать катамаран",
    "fleet.configureBtn": "Настроить этот катамаран",
    "fleet.speed": "Скорость",
    "fleet.built": "Построен/Отремонтирован",

    // Vessel Card Details & Specs
    "vessel.yacht": "Роскошный катамаран",
    "vessel.suitability": "Подходит для мероприятий",
    "vessel.capacityLabel": "Максимальная вместимость",
    "vessel.upTo": "До",
    "vessel.guests": "гостей",
    "vessel.cabinsLabel": "Каюты и ванные / Планировка",
    "vessel.cabins": "кают",
    "vessel.baths": "ванных",
    "vessel.speedLabel": "Крейсерская скорость",
    "vessel.crewLabel": "Профессиональный экипаж",
    "vessel.crew": "членов экипажа",
    "vessel.amenities": "Удобства на борту и водные игрушки",
    "vessel.features": "Основные моменты круиза и включенные опции",
    "vessel.selected": "Выбрано",
    "vessel.select": "Выбрать яхту",
    "vessel.book": "Настроить и забронировать",

    // Benefits
    "benefits.title": "Преимущества дневного чартера",
    "benefits.subtitle":
      "Каждая частная экспедиция на катамаране включает премиальные привилегии на борту для вашего полного расслабления.",
    "benefits.skipper.title": "Опытный капитан и стюард",
    "benefits.skipper.desc":
      "Местные профессиональные моряки позаботятся о навигации, лучших местах для сноркелинга и гостеприимстве.",
    "benefits.catering.title": "Тропический кейтеринг",
    "benefits.catering.desc":
      "Свежие сезонные островные фрукты, прохладительные напитки премиум-класса, чистая ледяная вода и аппетитные закуски.",
    "benefits.gear.title": "Морские игрушки и сноркелинг",
    "benefits.gear.desc":
      "Включает маски для глубокого сноркелинга, спасательные жилеты и доски для сапсерфинга.",
    "benefits.safety.title": "Аптечка первой помощи на борту",
    "benefits.safety.desc":
      "Для вашего полного спокойствия каждый катамаран в нашем флоте полностью оборудован профессиональной морской аптечкой.",
    "benefits.seasickness.title": "Таблетки от укачивания",
    "benefits.seasickness.desc":
      "Для плавного и комфортного путешествия на каждом катамаране бесплатно предоставляются таблетки от укачивания.",

    // Booking Form UI
    "form.step1.title": "01. Выберите катамаран",
    "form.step1b.title": "02. Выберите продолжительность чартера",
    "form.step1b.half": "Круиз на полдня (4-5 часов)",
    "form.step1b.full": "Круиз на целый день (8-9 часов)",
    "form.step2.title": "03. Дата и количество гостей",
    "form.step2.date": "Выберите дату чартера",
    "form.step2.guests": "Количество гостей на борту",
    "form.step3.title": "04. Выберите маршрут (Выберите любой / Свой маршрут)",
    "form.step3.recommended": "Рекомендуемый пирс отправления",
    "form.step3.warning":
      "Несоответствие пирса! Настоятельно рекомендуем выбрать",
    "form.step4.title": "05. Выберите пирс отправления на Пхукете",
    "form.step4b.title": "06. Водные игрушки и настройки на борту",
    "form.step4b.desc":
      "Раскройте роскошь на воде, добавив водные активности или премиальные дополнения.",
    "form.upgrade.slider": "Гигантская надувная водная горка",
    "form.upgrade.sliderDesc":
      "Безумное веселье: скатывайтесь прямо с флайбриджа верхней палубы в теплый изумрудный океан.",
    "form.upgrade.pool": "Надувной безопасный бассейн в океане",
    "form.upgrade.poolDesc":
      "Создает защищенный сетчатый бассейн за кормой катамарана, защищая детей от течений.",
    "form.upgrade.cabin": "Каюты с кондиционером",
    "form.upgrade.cabinDesc":
      "Откройте доступ к роскошным спальням с кондиционером и душевыми во время прогулки.",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "Кейтеринг и питание на борту",
    "form.upgrade.foodStandard": "Стандартное бесплатное меню",
    "form.upgrade.foodStandardDesc":
      "Ассорти из закусок, куриные шашлычки сатай и фирменные роллы пад-тай.",
    "form.upgrade.foodStandardIncl": "Включено бесплатно",
    "form.upgrade.foodSeafood": "Морское барбекю",
    "form.upgrade.foodSeafoodDesc":
      "Свежие тигровые креветки Андаманского моря, сочные кальмары, шпажки с треской и печеный картофель с чесночным маслом.",
    "form.upgrade.foodThai": "Королевский тайский банкет",
    "form.upgrade.foodThaiDesc":
      "Суп Том Ям Кунг, наваристый карри Массаман с говядиной, жареный рис с ананасом и манго стики-райс.",
    "form.upgrade.foodWestern": "Премиальный западный буфет",
    "form.upgrade.foodWesternDesc":
      "Трюфельные морские гребешки Хоккайдо, стейк из вырезки Ангус на гриле, салат Цезарь и фирменный десерт.",
    "form.upgrade.selected": "Выбранный вариант",

    "form.upgrade.bartender": "Услуги профессионального бармена",
    "form.upgrade.bartenderBtn": "Нанять профессионального миксолога на борт",
    "form.upgrade.bartenderDesc":
      "Порадуйте гостей изысканными коктейлями, винным сервисом и освежающими праздничными мохито.",
    "form.upgrade.bartenderSelect": "Выберите количество барменов",
    "form.upgrade.bartenderOpt1": "1 Профессиональный бармен",
    "form.upgrade.bartenderOpt2": "2 Профессиональных бармена",
    "form.upgrade.bartenderOpt3":
      "3 Профессиональных бармена (рекомендуется для больших групп)",

    "form.upgrade.cakeTitle": "Праздничный торт (День рождения / Юбилей)",
    "form.upgrade.cakeBtn": "Заказать праздничный торт",
    "form.upgrade.cakeDesc":
      "Сделайте праздник незабываемым благодаря свежеиспеченному изысканному торту. Доставляется охлажденным.",
    "form.upgrade.cakeSelect": "Количество тортов (1-5)",
    "form.upgrade.cakeOpt": "Праздничный торт",
    "form.upgrade.cakeOptP": "Праздничных торта",
    "form.upgrade.cakeOptMax": "Праздничных тортов (Фулл-пакет праздника)",

    // Customer Detail Form & Actions
    "form.step5.title": "07. Имя представителя гостей",
    "form.step5.placeholder": "например, Елена Смирнова",
    "form.step5.requests": "08. Особые пожелания / Запросы",
    "form.step5.requestsPl": "например, кейтеринг, дайвинг, сюрприз на закате",

    // Copy & Form Triggers
    "form.draft.title": "Сформированный текст запроса",
    "form.draft.copy": "Копировать текст круиза",
    "form.draft.copied": "✓ Скопировано в буфер!",
    "form.bookWhatsApp": "Забронировать в WhatsApp",
    "form.callAgency": "Позвонить нам",
    "form.downloadPdf": "Скачать PDF-брошюру",
    "form.speedBooking":
      "Быстрое бронирование через WhatsApp чат или прямой звонок",

    // Success Toast
    "toast.successTitle": "Запрос сформирован",
    "toast.successDesc":
      "Ваш индивидуальный маршрут готов. Пожалуйста, отправьте сообщение в WhatsApp для окончательного выбора дат!",

    // Privacy Banner UI
    "privacy.btn": "Настройки конфиденциальности",
    "privacy.pdpa": "Раскрытие PDPA",
    "footer.language": "Выберите язык",

    // Map & Guide Translations
    "map.interactiveChart": "01. Интерактивная карта Пхукета",
    "map.exploreRoutes": "Исследуйте маршруты Андаманского моря",
    "map.exploreDesc":
      "Управляйте путешествием между портами и тропическими островами на нашей интерактивной карте. Нажмите на точку, чтобы проложить траекторию круиза, узнать расстояние в морских милях, время в пути и подробности экскурсий.",
    "map.legend": "Легенда карты",
    "map.startHub": "Пирс отправления",
    "map.activePoint": "Активная точка",
    "map.destIsland": "Остров назначения",
    "map.target": "Тропическая цель",
    "map.cruise": "Круиз",
    "map.features": "Особенности и предложения",
    "map.optimalPier": "Оптимальный пирс отправления:",
    "map.distance": "Расстояние",
    "map.transit": "Время в пути",
    "map.excursion": "Экскурсия",
    "map.private": "100% приватный",
    "map.optimalDeparture": "Рекомендуемый пирс",
    "map.hours": "ч.",
    "map.hour": "ч.",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "Юг",
    "piers.ao-po.location": "Северо-восток",
    "destination.startingPoint": "ТОЧКА ОТПРАВЛЕНИЯ",
    "guide.title": "Путеводитель по островам Пхукета",
    "guide.subtitle":
      "Сравнивайте расстояния и получайте рекомендации по оптимальным точкам круиза",
    "filter.all": "Все острова",
    "btn.addToRoute": "Добавить в маршрут",
    "map.dragToPan": "ПЕРЕТАСКИВАЙТЕ КАРТУ ДЛЯ ОБЗОРА",
    "map.chartScale": "МАСШТАБ КАРТЫ: 1 : 250 000",
    "map.latLong": "КООРДИНАТЫ LAT/LONG: 7.9512° N, 98.3916° E",
    "map.andamanSea": "Андаманское море",
    "map.tip":
      "Наведите на маркер для просмотра пути. Нажмите, чтобы открыть детали.",
    "map.maxSpeed": "Макс. скорость всех лодок 8 узлов",
    "map.zoomIn": "Увеличить",
    "map.zoomOut": "Уменьшить",
    "map.zoomReset": "Сбросить вид",
    "piers.chalong.short": "Чалонг",
    "piers.ao-po.short": "Пирс Ао По",
    "map.startingPort": "Пирс отправления",
    "map.destination": "Направление",
    "map.estTime": "В пути",
    "map.southPhuketDept": "Отправление с Юга Пхукета",
    "map.nePhuketBase": "Пирс Ао По (Северо-Восток)",
  },
  hi: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "नौका चार्टर",
    "header.tagline": "विशिष्ट व्यक्तिगत समुद्री अनुभव",
    "header.reservations": "सीधा आरक्षण",
    "header.configure": "चार्टर को कस्टमाइज़ करें",
    "hero.badge": "निजी द्वीप यात्रा यात्राएँ",
    "hero.heading1": "पूरी तरह से निजी",
    "hero.heading2": "कस्टमाइज़्ड कटमरैन डे ट्रिप्स",
    "hero.description":
      "एक शानदार निजी नौका भ्रमण पर अंडमान सागर के छिपे हुए लैगून और शुद्ध नीले पानी की खोज करें। व्यक्तिगत द्वीप अन्वेषण के लिए The Best, NAMASTE, या THE ONE चार्टर करें।",
    "hero.selectVessel": "अपनी नौका चुनें",
    "hero.planTrip": "कस्टम डे-ट्रिप की योजना बनाएं",
    "hero.planParty": "पार्टी ट्रिप की योजना बनाएं",
    "hero.planOvernight": "ओवरनाइट ट्रिप की योजना बनाएं",
    "stats.catamarans": "उपलब्ध कटमरैन",
    "stats.ports": "फुकेत लॉन्च पियर्स (Piers)",
    "stats.destinations": "उष्णकटिबंधीय स्थल",
    "stats.itineraries": "बेस्पोक यात्रा कार्यक्रम",

    // Fleet Overview UI
    "fleet.badge": "बेड़े का विकल्प",
    "fleet.heading": "अपनी नौकायन चमत्कार चुनें",
    "fleet.description":
      "हमारी नौकाएँ बेहतरीन ऑनशोर इंजीनियरिंग, शानदार केबिन, डबल-डेक लाउंज आराम और एक पेशेवर कप्तान से लैस हैं।",
    "fleet.capacity": "अधिकतम अतिथि क्षमता",
    "fleet.length": "लंबाई",
    "fleet.cabins": "केबिन",
    "fleet.bathrooms": "शौचालय/बावायरमेंट",
    "fleet.suitability": "उत्सव उपयुक्तता",
    "fleet.selected": "चयनित",
    "fleet.selectBtn": "नौका का चयन करें",
    "fleet.configureBtn": "इस नौका को कॉन्फ़िगर करें",
    "fleet.speed": "गति",
    "fleet.built": "निर्मित/नवीनीकृत",

    // Vessel Card Details & Specs
    "vessel.yacht": "शानदार कटमरैन यॉट",
    "vessel.suitability": "उत्सव उपयुक्तता",
    "vessel.capacityLabel": "अधिकतम क्षमता",
    "vessel.upTo": "अधिकतम",
    "vessel.guests": "अतिथि",
    "vessel.cabinsLabel": "केबिन और बाथरूम / लेआउट",
    "vessel.cabins": "केबिन",
    "vessel.baths": "बाथरूम",
    "vessel.speedLabel": "क्रूज़िंग स्पीड",
    "vessel.crewLabel": "पेशेवर चालक दल",
    "vessel.crew": "क्रू सदस्य",
    "vessel.amenities": "ऑनबोर्ड सुविधाएं और पानी के खिलौने",
    "vessel.features": "मुख्य यात्रा हाइलाइट्स और समावेशन",
    "vessel.selected": "चयनित",
    "vessel.select": "नौका का चयन करें",
    "vessel.book": "कस्टमाइज़ और बुक करें",

    // Benefits
    "benefits.title": "डे चार्टर लाभ",
    "benefits.subtitle":
      "हर निजी कटमरैन यात्रा में पूर्ण विश्राम सुनिश्चित करने के लिए डिज़ाइन किए गए कार्यकारी स्तर के लाभ शामिल हैं।",
    "benefits.skipper.title": "विशेषज्ञ कप्तान और परिचारिका",
    "benefits.skipper.desc":
      "नेविगेशन, स्नॉर्कलिंग पॉइंट और आतिथ्य सत्कार प्रणालियों को संभालने वाले समर्पित क्षेत्रीय नाविक।",
    "benefits.catering.title": "उष्णकटिबंधीय कैटरिंग",
    "benefits.catering.desc":
      "ताजे मौसमी फल, प्रीमियम पेय, साफ बर्फ पानी और स्वादिष्ट स्नैक्स।",
    "benefits.gear.title": "सी टॉयज़ और स्नॉर्कलिंग गियर",
    "benefits.gear.desc":
      "गहरे समुद्र में स्नॉर्कलिंग मास्क, स्विम जैकेट और स्टैंड-अप पैडलबোर्ड शामिल हैं।",
    "benefits.safety.title": "ऑनबोर्ड प्राथमिक चिकित्सा किट",
    "benefits.safety.desc":
      "आपके पूर्ण मानसिक शांति के लिए, हमारे बेड़े का हर कटमरैन पेशेवर समुद्री प्राथमिक चिकित्सा किट से पूरी तरह तैयार है।",
    "benefits.seasickness.title": "मोशन सिकनेस की दवा",
    "benefits.seasickness.desc":
      "एक सहज और आरामदायक यात्रा सुनिश्चित करने के लिए, हमारी नौकाएँ पूरी तरह से निःशुल्क मोशन सिकनेस टैबलेट से सुसज्जित हैं।",

    // Booking Form UI
    "form.step1.title": "01. अपनी नौका चुनें",
    "form.step1b.title": "02. चार्टर अवधि तय करें",
    "form.step1b.half": "हाफ डे क्रूज़ (4-5 घंटे)",
    "form.step1b.full": "फुल डे क्रूज़ (8-9 घंटे)",
    "form.step2.title": "03. तारीख और मेहमानों की संख्या",
    "form.step2.date": "चार्टर की तारीख चुनें",
    "form.step2.guests": "मेहमानों की संख्या",
    "form.step3.title":
      "04. गंतव्य मार्ग चुनें (कोई भी चुनें / अपनी योजना बनाएं)",
    "form.step3.recommended": "अनुशंसित प्रस्थान घाट (Pier)",
    "form.step3.warning":
      "प्रस्थान घाट मेल नहीं खा रहा है! हम दृढ़ता से चुनने की सलाह देते हैं",
    "form.step4.title": "05. प्रस्थान पोर्ट (घाट) चुनें",
    "form.step4b.title": "06. वाटर टॉयज़ और ऑनबोर्ड कस्टमाइज़ेशन",
    "form.step4b.desc":
      "मानक गतिविधि संपत्तियों या प्रीमियम ऐड-ऑन द्वारा पानी पर विलासिता का आनंद लें।",
    "form.upgrade.slider": "इन्फ्लेटेबल विशाल वॉटर स्लाइड",
    "form.upgrade.sliderDesc":
      "शीर्ष डेक फ्लाईब्रिज से सीधे पन्ना गर्म सागर में गिरने वाली स्लाइडिंग लें।",
    "form.upgrade.pool": "इन्फ्लेटेबल महासागर सुरक्षित-पूल",
    "form.upgrade.poolDesc":
      "कटमरैन हल के पीछे एक सुरक्षित तैरता हुआ नेट पूल स्थापित करें जिससे बच्चे सुरक्षित रहें।",
    "form.upgrade.cabin": "चार्टर एयर-कंडीशन केबिन",
    "form.upgrade.cabinDesc":
      "डबल बर्थ और शॉवर सुविधाओं के साथ निजी बिलो-डेक एसी बेडरूम अनलॉक करें।",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "भोजन और ऑनबोर्ड सुरक्षा विकल्प",
    "form.upgrade.foodStandard": "मानक मानार्थ मेनू",
    "form.upgrade.foodStandardDesc":
      "मिश्रित पेटू फिंगर फूड ऐपेटाइज़र, स्थानीय चिकन सैट और ताज़ा पैด-थाई Wraps।",
    "form.upgrade.foodStandardIncl": "मुफ़्त शामिल है",
    "form.upgrade.foodSeafood": "सीफ़ूड बीबीक्यू पर्व",
    "form.upgrade.foodSeafoodDesc":
      "ग्रील्ड अंडमान समुद्री झींगे, बटररी स्क्विड, गहरे समुद्र के कॉड फिश और बेक्ด लहसुन बटर आलू।",
    "form.upgrade.foodThai": "रॉयल थाई बैंक्वेट",
    "form.upgrade.foodThaiDesc":
      "हस्ताक्षर टॉम यम गोंग सूप, समृद्ध मस्समन करी बीफ, अनानास फ्राइड राइस और मीठा आम स्टिकी राइस।",
    "form.upgrade.foodWestern": "प्रीमियम पश्चिमी बुफे",
    "form.upgrade.foodWesternDesc":
      "हक्काइडो सी स्कैलप्स, ग्रिल्ड ऑस्ट्रेलियन ब्लैक एंगस टेंडरलॉइन, ऑर्गेनिक सीज़र और प्रीमियम मिठाई।",
    "form.upgrade.selected": "चयनित विकल्प",

    "form.upgrade.bartender": "पेशेवर बारटेंडर सेवा (पार्टी अपग्रेड)",
    "form.upgrade.bartenderBtn":
      "पेशेवर मिक्सोलॉजिस्ट और बारटेंडर किराए पर लें",
    "form.upgrade.bartenderDesc":
      "अपने मेहमानों को शानदार कॉकटेल शेकिंग, वाइन सेवा और ताज़ा पार्टी मोजिटो का आनंद दें।",
    "form.upgrade.bartenderSelect": "बारटेंडर्स की संख्या चुनें",
    "form.upgrade.bartenderOpt1": "1 पेशेवर बारटेंडर",
    "form.upgrade.bartenderOpt2": "2 पेशेवर बारटेंडर",
    "form.upgrade.bartenderOpt3":
      "3 पेशेवर बारटेंडर (बड़े समूहों के लिए अनुशंसित)",

    "form.upgrade.cakeTitle": "उत्सव जन्मदिन केक (वर्षगाँठ और पार्टी अपग्रेड)",
    "form.upgrade.cakeBtn": "कस्टम उत्सव केक ऑर्डर करें",
    "form.upgrade.cakeDesc":
      "प्रीमियम, ताज़ा पके कस्टम उत्सव केक के साथ अपनी यात्रा को अविस्मरणीय बनाएं।",
    "form.upgrade.cakeSelect": "केक की मात्रा चुनें (1-5)",
    "form.upgrade.cakeOpt": "उत्सव केक",
    "form.upgrade.cakeOptP": "उत्सव केक",
    "form.upgrade.cakeOptMax": "उत्सव केक (पूर्ण पार्टी पैकेज)",

    // Customer Detail Form & Actions
    "form.step5.title": "07. अतिथि प्रतिनिधि का नाम",
    "form.step5.placeholder": "जैसे - अमित सिंह",
    "form.step5.requests": "08. विशेष पूछताछ / अनुरोध",
    "form.step5.requestsPl":
      "जैसे - खानपान विवरण, डाइविंग विकल्प, सूर्यास्त आश्चर्य",

    // Copy & Form Triggers
    "form.draft.title": "उत्पन्न पूछताछ पाठ (Draft)",
    "form.draft.copy": "संदेश कॉपी करें",
    "form.draft.copied": "✓ क्लिपबोर्ड पर कॉपी किया गया!",
    "form.bookWhatsApp": "व्हाट्सएप के साथ बुक करें",
    "form.callAgency": "कॉल करें",
    "form.downloadPdf": "कस्टम पीडीएफ ब्रोशर डाउनलोड करें",
    "form.speedBooking":
      "व्हाट्सएप चैट और प्रत्यक्ष वॉयस कॉल के माध्यम से त्वरित निजी बुकिंग",

    // Success Toast
    "toast.successTitle": "प्रारूप तैयार किया गया",
    "toast.successDesc":
      "आपका अनुकूलित यात्रा कार्यक्रम तैयार है। कृपया अपनी बुकिंग तिथियों को अंतिम रूप देने के लिए व्हाट्सएप पर संदेश भेजें!",

    // Privacy Banner UI
    "privacy.btn": "गोपनीयता सेटिंग्स",
    "privacy.pdpa": "PDPA प्रकटीकरण",
    "footer.language": "भाषा चुनें",

    // Map & Guide Translations
    "map.interactiveChart": "01. इंटरेक्टिव फुकेत चार्ट",
    "map.exploreRoutes": "अंडमान मार्गों का अन्वेषण करें",
    "map.exploreDesc":
      "हमारे विशेष इंटरेक्टिव चार्ट पर लॉन्चिंग बंदरगाहों और विदेशी गंतव्यों के बीच नेविगेट करें। क्रूज़ प्रक्षेपवक्र रेखा खींचने, सीधे समुद्री मील की दूरी, पारगमन घंटे और कस्टम भ्रमण विवरण की समीक्षा करने के लिए किसी भी बिंदु पर टैप करें।",
    "map.legend": "नक्शा किंवदंती",
    "map.startHub": "प्रस्थान घाट हब",
    "map.activePoint": "सक्रिय बिंदु",
    "map.destIsland": "गंतव्य द्वीप",
    "map.target": "उष्णकटिबंधीय लक्ष्य",
    "map.cruise": "क्रूज़",
    "map.features": "विशेषताएं और पेशकश",
    "map.optimalPier": "इष्टतम लॉन्च घाट:",
    "map.distance": "दूरी",
    "map.transit": "पारगमन समय",
    "map.excursion": "भ्रमण",
    "map.private": "100% निजी",
    "map.optimalDeparture": "इष्टतम प्रस्थान घाट",
    "map.hours": "घंटे",
    "map.hour": "घंटा",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "दक्षिण",
    "piers.ao-po.location": "उत्तर-पूर्व",
    "destination.startingPoint": "प्रस्थान बिंदु",
    "guide.title": "फुकेत गंतव्य गाइड",
    "guide.subtitle": "दूरियों और इष्टतम क्रूज़ बिंदु सिफारिशों की तुलना करें",
    "filter.all": "सभी द्वीप",
    "btn.addToRoute": "मार्ग में जोड़ें",
    "map.dragToPan": "पैन करने के लिए खींचें",
    "map.chartScale": "चार्ट स्केल: 1 : 250,000",
    "map.latLong": "अक्षांश/देशांतर: 7.9512° N, 98.3916° E",
    "map.andamanSea": "अंडमान सागर",
    "map.tip":
      "मार्ग देखने के लिए मार्करों पर होवर करें। भ्रमण की जानकारी देखने के लिए क्लिक करें।",
    "map.maxSpeed": "सभी नावों की अधिकतम गति 8 समुद्री मील",
    "map.zoomIn": "ज़ूम इन",
    "map.zoomOut": "ज़ूम आउट",
    "map.zoomReset": "दृश्य रीसेट करें",
    "piers.chalong.short": "चालोंग",
    "piers.ao-po.short": "आओ पो पियर (Ao Po Pier)",
    "map.startingPort": "प्रस्थान घाट (Pier)",
    "map.destination": "गंतव्य",
    "map.estTime": "अनुमानित समय",
    "map.southPhuketDept": "दक्षिण फुकेत प्रस्थान",
    "map.nePhuketBase": "आओ पो पियर (Ao Po Pier - उत्तर-पूर्व फुकेत)",
  },
  ar: {
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "تأجير اليخوت",
    "header.tagline": "تجارب بحرية خاصة وحصرية",
    "header.reservations": "حجوزات مباشرة",
    "header.configure": "تهيئة الحجز",
    "hero.badge": "رحلات بحرية مخصصة للجزر",
    "hero.heading1": "رحلات بحرية خاصة",
    "hero.heading2": "بكاتماران مصممة خصيصاً",
    "hero.description":
      "اكتشف البحيرات الهادئة والمياه الفيروزية لبحر أندامان في رحلة يخت خاصة رائعة. استأجر يخت The Best أو NAMASTE أو THE ONE لاستكشاف الجزر بطريقتك الخاصة.",
    "hero.selectVessel": "اختر يختك",
    "hero.planTrip": "خطط لرحلتك اليومية",
    "hero.planParty": "خطط لرحلة حفلة",
    "hero.planOvernight": "خطط لرحلة مبيت",
    "stats.catamarans": "اليخوت المتاحة",
    "stats.ports": "موانئ بوكيت",
    "stats.destinations": "الوجهات الاستوائية",
    "stats.itineraries": "مسارات مخصصة",
    "fleet.badge": "اختيار الأسطول",
    "fleet.heading": "اختر يخت أحلامك",
    "fleet.description":
      "تتميز يخوتنا بهندسة بحرية متميزة، مقصورات فاخرة، وصالونات للاسترخاء مع كابتن محترف.",
    "fleet.capacity": "أقصى سعة للضيوف",
    "fleet.length": "الطول",
    "fleet.cabins": "المقصورات",
    "fleet.bathrooms": "دورات المياه",
    "fleet.suitability": "مناسب للاحتفالات",
    "fleet.selected": "محدد",
    "fleet.selectBtn": "اختر اليخت",
    "fleet.configureBtn": "تهيئة هذا اليخت",
    "fleet.speed": "السرعة",
    "fleet.built": "سنة البناء/المجدد",
    "vessel.yacht": "يخت كاتماران فاخر",
    "vessel.suitability": "مناسب للمناسبات والاحتفالات",
    "vessel.capacityLabel": "السعة القصوى للركاب",
    "vessel.upTo": "ما يصل إلى",
    "vessel.guests": "ضيوف",
    "vessel.cabinsLabel": "المقصورات ودورات المياه والتقسيم",
    "vessel.cabins": "مقصورات",
    "vessel.baths": "حمامات",
    "vessel.speedLabel": "سرعة الإبحار",
    "vessel.crewLabel": "طاقم عمل محترف",
    "vessel.crew": "أعضاء الطاقم",
    "vessel.amenities": "الخدمات والمرافق والألعاب المائية",
    "vessel.features": "أبرز مميزات الرحلة والشمولية",
    "vessel.selected": "اليخت المحدد",
    "vessel.select": "اختر هذا اليخت",
    "vessel.book": "تهيئة وحجز الرحلة",
  },
  fr: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "Location de Yachts",
    "header.tagline": "Expériences maritimes privées exclusives",
    "header.reservations": "Réservations directes",
    "header.configure": "Configurer la location",
    "hero.badge": "Croisières insulaires sur mesure",
    "hero.heading1": "Croisières privées",
    "hero.heading2": "en catamaran sur mesure",
    "hero.description":
      "Découvrez les lagons cachés et les eaux turquoise de la mer d'Andaman lors d'une magnifique excursion privée en yacht. Louez The Best, NAMASTE ou THE ONE pour une exploration personnalisée des îles.",
    "hero.selectVessel": "Sélectionnez votre navire",
    "hero.planTrip": "Planifier l'excursion",
    "hero.planParty": "Planifier une fête en mer",
    "hero.planOvernight": "Planifier une nuit à bord",

    // Stats
    "stats.catamarans": "Catamarans disponibles",
    "stats.ports": "Piers de départ à Phuket",
    "stats.destinations": "Destinations tropicales",
    "stats.itineraries": "Itinéraires personnalisés",

    // Fleet Overview UI
    "fleet.badge": "Sélection de la flotte",
    "fleet.heading": "Choisissez votre navire d'exception",
    "fleet.description":
      "Nos bateaux offrent une ingénierie marine de premier ordre, des cabines luxueuses, des espaces de détente spacieux sur double pont et un capitaine professionnel.",
    "fleet.capacity": "Capacité maximale d'invités",
    "fleet.length": "Longueur",
    "fleet.cabins": "Cabines",
    "fleet.bathrooms": "Salles de bain",
    "fleet.suitability": "Idéal pour célébrations",
    "fleet.selected": "Sélectionné",
    "fleet.selectBtn": "Sélectionner ce navire",
    "fleet.configureBtn": "Configurer ce navire",
    "fleet.speed": "Vitesse",
    "fleet.built": "Année/Rénové",

    // Vessel Card Details & Specs (English UI translation overrides)
    "vessel.yacht": "Catamaran de luxe",
    "vessel.suitability": "Idéal pour célébrations",
    "vessel.capacityLabel": "Capacité maximale",
    "vessel.upTo": "Jusqu'à",
    "vessel.guests": "Personnes",
    "vessel.cabinsLabel": "Cabines, douches et agencement",
    "vessel.cabins": "Cabines",
    "vessel.baths": "Douches",
    "vessel.speedLabel": "Vitesse de croisière",
    "vessel.crewLabel": "Équipage professionnel",
    "vessel.crew": "Membres d'équipage",
    "vessel.amenities": "Équipements à bord & jouets aquatiques",
    "vessel.features": "Points forts de l'excursion et inclusions",
    "vessel.selected": "Sélectionné",
    "vessel.select": "Sélectionner ce yacht",
    "vessel.book": "Configurer & Réserver",

    // Benefits
    "benefits.title": "Avantages de la location privée",
    "benefits.subtitle":
      "Chaque expédition en catamaran de luxe comprend des services de premier ordre pour vous assurer une détente absolue.",
    "benefits.skipper.title": "Skipper & Hôtesse expérimentés",
    "benefits.skipper.desc":
      "Des marins locaux dévoués gèrent la navigation, les arrêts plongée et l'accueil des passagers.",
    "benefits.catering.title": "Restauration tropicale",
    "benefits.catering.desc":
      "Fruits de saison frais des îles, boissons sans alcool de qualité, eau glacée et collations incluses.",
    "benefits.gear.title": "Jouets marins & équipement de plongée",
    "benefits.gear.desc":
      "Comprend des masques de plongée, des gilets de sauvetage et des planches de stand-up paddle.",
    "benefits.safety.title": "Trousse médicale de premier secours",
    "benefits.safety.desc":
      "Pour votre tranquillité d'esprit absolue, chaque catamaran est équipé d'une trousse médicale complète.",
    "benefits.seasickness.title": "Médicaments contre le mal de mer",
    "benefits.seasickness.desc":
      "Pour un voyage serein et confortable, des comprimés contre le mal de mer sont offerts gratuitement à bord.",

    // Booking Form UI
    "form.step1.title": "01. Sélectionnez votre navire",
    "form.step1b.title": "02. Choisissez la durée de la location",
    "form.step1b.half": "Demi-journée (4-5 heures)",
    "form.step1b.full": "Journée complète (8-9 heures)",
    "form.step2.title": "03. Date & Nombre de passagers",
    "form.step2.date": "Sélectionnez la date du charter",
    "form.step2.guests": "Nombre d'invités à bord",
    "form.step3.title":
      "04. Choisissez votre itinéraire (Sélectionnez une option / Sur mesure)",
    "form.step3.recommended": "Pier de départ recommandé",
    "form.step3.warning":
      "Incompatibilité de port ! Nous recommandons vivement de choisir",
    "form.step4.title": "05. Sélectionnez le port de départ à Phuket",
    "form.step4b.title": "06. Personnalisez vos options et loisirs",
    "form.step4b.desc":
      "Ajoutez du divertissement haut de gamme à votre croisière en intégrant nos options premium.",
    "form.upgrade.slider": "Toboggan aquatique gonflable géant",
    "form.upgrade.sliderDesc":
      "Glissez directement depuis le pont supérieur flybridge dans les eaux chaudes et turquoise de l'océan.",
    "form.upgrade.pool": "Piscine flottante sécurisée en mer",
    "form.upgrade.poolDesc":
      "Crée une piscine filet flottante sécurisée à l'arrière du catamaran pour protéger les enfants des courants.",
    "form.upgrade.cabin": "Réserver des cabines climatisées",
    "form.upgrade.cabinDesc":
      "Accédez aux cabines de couchage privées climatisées avec lits doubles et douches royales à bord.",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "Options de restauration et buffet à bord",
    "form.upgrade.foodStandard": "Menu standard gratuit de bienvenue",
    "form.upgrade.foodStandardDesc":
      "Amuse-bouches gourmands assortis, brochettes de poulet satay local et wraps pad-thai frais.",
    "form.upgrade.foodStandardIncl": "Inclus gratuitement",
    "form.upgrade.foodSeafood": "Grand barbecue de fruits de mer",
    "form.upgrade.foodSeafoodDesc":
      "Crevettes géantes de la mer d'Andaman grillées, calamars marinés rôtis, brochettes de cabillaud et pommes de terre rissolées au beurre d'ail.",
    "form.upgrade.foodThai": "Banquet thaïlandais royal",
    "form.upgrade.foodThaiDesc":
      "Soupe signature Tom Yum Goong, curry Massaman au bœuf mijoté, riz frit à l'ananas et mangue sucrée au riz collant.",
    "form.upgrade.foodWestern": "Buffet occidental de prestige",
    "form.upgrade.foodWesternDesc":
      "Noix de Saint-Jacques de Hokkaido truffées, filet de bœuf Black Angus d'Australie grillé, salade César bio et desserts fins.",
    "form.upgrade.selected": "Option sélectionnée",

    "form.upgrade.bartender": "Service de barman professionnel (Option fête)",
    "form.upgrade.bartenderBtn": "Engager un barman & mixologue professionnel",
    "form.upgrade.bartenderDesc":
      "Faites plaisir à vos invités avec des cocktails fins, un service de vin professionnel et des mojitos parfumés à bord.",
    "form.upgrade.bartenderSelect": "Sélectionnez le nombre de barmans",
    "form.upgrade.bartenderOpt1": "1 Barman professionnel",
    "form.upgrade.bartenderOpt2": "2 Barmans professionnels",
    "form.upgrade.bartenderOpt3":
      "3 Barmans professionnels (Recommandé pour grands groupes)",

    "form.upgrade.cakeTitle": "Gâteau d'anniversaire ou gâteau de fête",
    "form.upgrade.cakeBtn": "Commander un gâteau de fête personnalisé",
    "form.upgrade.cakeDesc":
      "Rendez votre voyage inoubliable avec un gâteau haut de gamme fraîchement préparé. Livré frais sur le bateau.",
    "form.upgrade.cakeSelect": "Nombre de gâteaux (1-5)",
    "form.upgrade.cakeOpt": "Gâteau de célébration",
    "form.upgrade.cakeOptP": "Gâteaux de célébration",
    "form.upgrade.cakeOptMax": "Pack gâteaux de célébration (Maximum)",

    // Customer Detail Form & Actions
    "form.step5.title": "07. Nom du représentant des invités",
    "form.step5.placeholder": "ex : Amélie Laurent",
    "form.step5.requests": "08. Demandes particulières / Informations",
    "form.step5.requestsPl":
      "ex : détails du buffet, matériel de plongée, surprise au coucher du soleil",

    // Copy & Form Triggers
    "form.draft.title": "Texte de la demande généré",
    "form.draft.copy": "Copier le message",
    "form.draft.copied": "✓ Copié dans le presse-papiers !",
    "form.bookWhatsApp": "Réserver via WhatsApp",
    "form.callAgency": "Téléphoner",
    "form.downloadPdf": "Télécharger la brochure PDF",
    "form.speedBooking":
      "Réservation rapide de yacht privé via discussion WhatsApp ou appel direct",

    // Success Toast
    "toast.successTitle": "Demande formulée",
    "toast.successDesc":
      "Votre itinéraire est prêt. Veuillez envoyer le message sur WhatsApp pour finaliser vos dates de réservation !",

    // Privacy Banner UI & Cookie links
    "privacy.btn": "Paramètres de confidentialité",
    "privacy.pdpa": "Divulgation PDPA",
    "footer.language": "Sélectionner la langue",

    // Map & Guide Translations
    "map.interactiveChart": "01. Carte marine de Phuket",
    "map.exploreRoutes": "Explorez les trajets d'Andaman",
    "map.exploreDesc":
      "Naviguez entre les ports de départ et les îles tropicales sur notre carte interactive. Appuyez sur un point pour tracer l'itinéraire, vérifier les miles et la durée du voyage.",
    "map.legend": "Légende de la carte",
    "map.startHub": "Pier de départ",
    "map.activePoint": "Point sélectionné",
    "map.destIsland": "Île de destination",
    "map.target": "Destination",
    "map.cruise": "Voyage",
    "map.features": "Points forts & Services",
    "map.optimalPier": "Pier de départ idéal :",
    "map.distance": "Distance",
    "map.transit": "Durée du trajet",
    "map.excursion": "Excursion",
    "map.private": "100% Privé",
    "map.optimalDeparture": "Pier de départ idéal",
    "map.hours": "heures",
    "map.hour": "h",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "Sud",
    "piers.ao-po.location": "Nord-Est",
    "destination.startingPoint": "POINT DE DÉPART",
    "guide.title": "Guide touristique de Phuket",
    "guide.subtitle":
      "Comparez les distances et les recommandations d'itinéraires idéaux",
    "filter.all": "Toutes les îles",
    "btn.addToRoute": "Ajouter au trajet",
    "map.dragToPan": "GLISSER POUR DÉPLACER LA CARTE",
    "map.chartScale": "ÉCHELLE : 1 : 250 000",
    "map.latLong": "COORDONNÉES LAT/LONG : 7.9512° N, 98.3916° E",
    "map.andamanSea": "Mer d'Andaman",
    "map.tip":
      "Survolez les marqueurs pour voir le trajet. Appuyez pour obtenir les détails.",
    "map.maxSpeed": "Vitesse maximale des bateaux : 8 nœuds",
    "map.zoomIn": "Zoomer",
    "map.zoomOut": "Dézoomer",
    "map.zoomReset": "Réinitialiser la vue",
    "piers.chalong.short": "Chalong",
    "piers.ao-po.short": "Ao Po Pier",
    "map.startingPort": "Pier de départ",
    "map.destination": "Destination",
    "map.estTime": "Durée estimée",
    "map.southPhuketDept": "Départ du Sud de Phuket",
    "map.nePhuketBase": "Ao Po Pier (Nord-Est de Phuket)",
  },
  de: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "Yachtcharter",
    "header.tagline": "Exklusive private maritime Erlebnisse",
    "header.reservations": "Direkte Reservierungen",
    "header.configure": "Charter konfigurieren",
    "hero.badge": "Maßgeschneiderte Insel-Kreuzfahrten",
    "hero.heading1": "Individuelle private",
    "hero.heading2": "Katamaran-Tagesausflüge",
    "hero.description":
      "Entdecken Sie die verborgenen Lagunen und das reine, kristallblaue Wasser der Andamanensee bei einem exquisiten privaten Yachtausflug. Chartern Sie The Best, NAMASTE oder THE ONE für Ihre maßgeschneiderte Inselerkundung.",
    "hero.selectVessel": "Wählen Sie Ihr Schiff",
    "hero.planTrip": "Tagesausflug planen",
    "hero.planParty": "Party-Ausflug planen",
    "hero.planOvernight": "Mehrtägigen Ausflug planen",

    // Stats
    "stats.catamarans": "Verfügbare Katamarane",
    "stats.ports": "Yachthäfen in Phuket",
    "stats.destinations": "Tropische Reiseziele",
    "stats.itineraries": "Maßgeschneiderte Routen",

    // Fleet Overview UI
    "fleet.badge": "Flottenauswahl",
    "fleet.heading": "Wählen Sie Ihr Traumschiff",
    "fleet.description":
      "Unsere Schiffe bestechen durch erstklassiges maritimes Design, luxuriöse Kabinen, großzügige Doppeldeck-Lounges und einen professionellen Kapitän.",
    "fleet.capacity": "Maximale Gästeanzahl",
    "fleet.length": "Länge",
    "fleet.cabins": "Kabinen",
    "fleet.bathrooms": "Badezimmer",
    "fleet.suitability": "Eignung für Feiern",
    "fleet.selected": "Ausgewählt",
    "fleet.selectBtn": "Schiff auswählen",
    "fleet.configureBtn": "Dieses Schiff konfigurieren",
    "fleet.speed": "Geschwindigkeit",
    "fleet.built": "Baujahr/Renoviert",

    // Vessel Card Details & Specs (English UI translation overrides)
    "vessel.yacht": "Luxus-Katamaran-Yacht",
    "vessel.suitability": "Eignung für Feiern",
    "vessel.capacityLabel": "Maximale Kapazität",
    "vessel.upTo": "Bis zu",
    "vessel.guests": "Gäste",
    "vessel.cabinsLabel": "Kabinen & Bäder / Layout",
    "vessel.cabins": "Kabinen",
    "vessel.baths": "Bäder",
    "vessel.speedLabel": "Reisegeschwindigkeit",
    "vessel.crewLabel": "Professionelle Crew",
    "vessel.crew": "Crewmitglieder",
    "vessel.amenities": "Bordausstattung & Wasserspielzeug",
    "vessel.features": "Highlights & Inklusivleistungen",
    "vessel.selected": "Ausgewählt",
    "vessel.select": "Yacht auswählen",
    "vessel.book": "Konfigurieren & Buchen",

    // Benefits
    "benefits.title": "Vorteile der Tagescharter",
    "benefits.subtitle":
      "Jede private Katamaran-Expedition bietet erstklassige maritime Vorteile, die für vollkommene Entspannung sorgen.",
    "benefits.skipper.title": "Erfahrener Skipper & Hostess",
    "benefits.skipper.desc":
      "Engagierte lokale Seeleute kümmern sich um Navigation, Schnorchelplätze und erstklassigen Service.",
    "benefits.catering.title": "Tropisches Catering",
    "benefits.catering.desc":
      "Frische saisonale Inselfrüchte, erstklassige alkoholfreie Getränke, reines Eiswasser und leckere Snacks.",
    "benefits.gear.title": "Wasserspielzeug & Schnorchelausrüstung",
    "benefits.gear.desc":
      "Inklusive Tiefsee-Schnorchelmasken, Schwimmwesten und Stand-up-Paddleboards.",
    "benefits.safety.title": "Erste-Hilfe-Ausrüstung an Bord",
    "benefits.safety.desc":
      "Für Ihre absolute Sorgenfreiheit ist jeder Katamaran in unserer Flotte mit einem voll ausgestatteten Erste-Hilfe-Kasten ausgestattet.",
    "benefits.seasickness.title": "Tabletten gegen Seekrankheit",
    "benefits.seasickness.desc":
      "Für eine ruhige und angenehme Fahrt ist jeder Katamaran unserer Flotte kostenlos mit Tabletten gegen Seekrankheit ausgestattet.",

    // Booking Form UI
    "form.step1.title": "01. Wählen Sie Ihr Schiff",
    "form.step1b.title": "02. Wählen Sie die Charterdauer",
    "form.step1b.half": "Halbtages-Kreuzfahrt (4-5 Stunden)",
    "form.step1b.full": "Ganztages-Kreuzfahrt (8-9 Stunden)",
    "form.step2.title": "03. Datum & Gästeanzahl",
    "form.step2.date": "Charterdatum auswählen",
    "form.step2.guests": "Anzahl der Gäste an Bord",
    "form.step3.title": "04. Route oder Reiseziel wählen",
    "form.step3.recommended": "Empfohlener Abfahrtshafen",
    "form.step3.warning": "Abweichender Abfahrtshafen! Wir empfehlen dringend",
    "form.step4.title": "05. Abfahrtshafen in Phuket auswählen",
    "form.step4b.title": "06. Ausflugs- oder Party-Upgrades anpassen",
    "form.step4b.desc":
      "Erleben Sie puren Luxus auf dem Wasser mit unseren Aktivitäten und erstklassigem Zubehör.",
    "form.upgrade.slider": "Riesige aufblasbare Wasserrutsche",
    "form.upgrade.sliderDesc":
      "Riesiger Rutschspaß direkt von der Flybridge des Oberdecks in den warmen, smaragdgrünen Ozean.",
    "form.upgrade.pool": "Aufblasbarer meeressicherer Pool",
    "form.upgrade.poolDesc":
      "Erstellt einen sicheren schwimmenden Netzpool hinter dem Katamaran, um Kinder vor Strömungen zu schützen.",
    "form.upgrade.cabin": "Klimatisierte Kabinen reservieren",
    "form.upgrade.cabinDesc":
      "Schalten Sie private, klimatisierte Schlafkabinen unter Deck mit Doppelkojen und kompletten Duschbädern frei.",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "Kulinarische Optionen und Bordcatering",
    "form.upgrade.foodStandard": "Kostenloses Standard-Menü",
    "form.upgrade.foodStandardDesc":
      "Ausgewählte Gourmet-Fingerfood-Vorspeisen, regionale Hähnchen-Saté-Spieße und erfrischende lokale Pad-Thai-Wraps.",
    "form.upgrade.foodStandardIncl": "Kostenlos inbegriffen",
    "form.upgrade.foodSeafood": "Meeresfrüchte-Grillfest (BBQ)",
    "form.upgrade.foodSeafoodDesc":
      "Gegrillte Riesengarnelen aus der Andamanensee, zarter marinierter Tintenfisch, Kabeljau-Spieße und Ofenkartoffeln mit Kräuterbutter.",
    "form.upgrade.foodThai": "Königliches thailändisches Buffet",
    "form.upgrade.foodThaiDesc":
      "Klassische Tom-Yum-Goong-Suppe, reichhaltiges Massaman-Rindfleisch-Curry, Ananas-Fried-Rice und süßer Mango-Klebreis (Sticky Rice).",
    "form.upgrade.foodWestern": "Premium-Westliches Buffet",
    "form.upgrade.foodWesternDesc":
      "Jakobsmuscheln mit Trüffel, gegrilltes australisches Black-Angus-Rinderfilet, Bio-Caesar-Salat und feines Dessert.",
    "form.upgrade.selected": "Ausgewählte Option",

    "form.upgrade.bartender":
      "Professioneller Barkeeper-Service (Party-Upgrade)",
    "form.upgrade.bartenderBtn":
      "Professionellen Barkeeper & Mixologen engagieren",
    "form.upgrade.bartenderDesc":
      "Verwöhnen Sie Ihre Gäste mit frisch gemixten Cocktails, Wein-Service und erfrischenden Partydrinks.",
    "form.upgrade.bartenderSelect": "Anzahl der Barkeeper wählen",
    "form.upgrade.bartenderOpt1": "1 Professioneller Barkeeper",
    "form.upgrade.bartenderOpt2": "2 Professionelle Barkeeper",
    "form.upgrade.bartenderOpt3":
      "3 Professionelle Barkeeper (Empfohlen für große Gruppen)",

    "form.upgrade.cakeTitle":
      "Geburtstags- oder Jubiläumstorte (Feier-Upgrade)",
    "form.upgrade.cakeBtn": "Maßgeschneiderte Geburtstagstorte bestellen",
    "form.upgrade.cakeDesc":
      "Machen Sie Ihre Charter unvergesslich mit einer exklusiven, frisch gebackenen Torte. Gekühlt an Bord geliefert.",
    "form.upgrade.cakeSelect": "Anzahl der Torten wählen (1-5)",
    "form.upgrade.cakeOpt": "Festliche Torte",
    "form.upgrade.cakeOptP": "Festliche Torten",
    "form.upgrade.cakeOptMax": "Festliches Torten-Paket (Maximale Anzahl)",

    // Customer Detail Form & Actions
    "form.step5.title": "07. Name des Hauptgastes",
    "form.step5.placeholder": "z. B. Max Mustermann",
    "form.step5.requests": "08. Besondere Wünsche / Anfragen",
    "form.step5.requestsPl":
      "z. B. Catering-Details, Tauchgänge, Überraschung zum Sonnenuntergang",

    // Copy & Form Triggers
    "form.draft.title": "Erstellter Anfrage-Entwurf",
    "form.draft.copy": "Nachricht kopieren",
    "form.draft.copied": "✓ In Zwischenablage kopiert!",
    "form.bookWhatsApp": "Über WhatsApp buchen",
    "form.callAgency": "Anrufen",
    "form.downloadPdf": "Eigene PDF-Broschüre herunterladen",
    "form.speedBooking":
      "Schnelle Charterbuchung via WhatsApp oder Telefonanruf",

    // Success Toast
    "toast.successTitle": "Entwurf erstellt",
    "toast.successDesc":
      "Ihre personalisierte Route ist bereit. Bitte senden Sie die Nachricht auf WhatsApp, um Ihre Buchung abzuschließen!",

    // Privacy Banner UI & Cookie links
    "privacy.btn": "Datenschutz-Einstellungen",
    "privacy.pdpa": "PDPA-Erklärung",
    "footer.language": "Sprache wählen",

    // Map & Guide Translations
    "map.interactiveChart": "01. Interaktive Seekarte Phuket",
    "map.exploreRoutes": "Entdecken Sie die Andamanen-Routen",
    "map.exploreDesc":
      "Navigieren Sie auf unserer interaktiven Karte zwischen Abfahrtshäfen und tropischen Inseln. Tippen Sie auf einen beliebigen Punkt, um die Route anzuzeigen, Meilen und Fahrtzeiten zu prüfen.",
    "map.legend": "Kartenlegende",
    "map.startHub": "Abfahrtshafen (Pier)",
    "map.activePoint": "Aktiver Punkt",
    "map.destIsland": "Zielinsel",
    "map.target": "Reiseziel",
    "map.cruise": "Fahrt",
    "map.features": "Highlights & Angebote",
    "map.optimalPier": "Optimaler Abfahrtshafen:",
    "map.distance": "Distanz",
    "map.transit": "Fahrtzeit",
    "map.excursion": "Ausflug",
    "map.private": "100% Privat",
    "map.optimalDeparture": "Empfohlener Hafen",
    "map.hours": "Stunden",
    "map.hour": "Std.",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "Süden",
    "piers.ao-po.location": "Nordosten",
    "destination.startingPoint": "STARTPUNKT",
    "guide.title": "Phuket Reiseführer",
    "guide.subtitle": "Vergleichen Sie Distanzen und ideale Routenempfehlungen",
    "filter.all": "Alle Inseln",
    "btn.addToRoute": "Zur Route hinzufügen",
    "map.dragToPan": "ZUM BEWEGEN DER KARTE ZIEHEN",
    "map.chartScale": "KARTENMASSSTAB: 1 : 250.000",
    "map.latLong": "HILFSKOORDINATEN: 7.9512° N, 98.3916° O",
    "map.andamanSea": "Andamanensee",
    "map.tip":
      "Bewegen Sie den Mauszeiger über Wegpunkte, um die Route anzuzeigen. Tippen Sie für Infos.",
    "map.maxSpeed": "Maximale Bootsgeschwindigkeit 8 Knoten",
    "map.zoomIn": "Vergrößern",
    "map.zoomOut": "Verkleinern",
    "map.zoomReset": "Ansicht zurücksetzen",
    "piers.chalong.short": "Chalong",
    "piers.ao-po.short": "Ao Po Pier",
    "map.startingPort": "Abfahrtspier",
    "map.destination": "Zielort",
    "map.estTime": "Geschätzte Zeit",
    "map.southPhuketDept": "Abfahrt im Süden Phukets",
    "map.nePhuketBase": "Ao Po Pier (Nordosten Phukets)",
  },
  th: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "เช่าเรือยอชท์",
    "header.tagline": "ประสบการณ์ทางทะเลส่วนตัวสุดเอ็กซ์คลูซีฟ",
    "header.reservations": "สำรองที่นั่งโดยตรง",
    "header.configure": "ปรับแต่งแพ็กเกจเรือยอชท์",
    "hero.badge": "ล่องเรือเที่ยวเกาะส่วนตัว",
    "hero.heading1": "ทริปเรือแคทามารันส่วนตัว",
    "hero.heading2": "ที่ออกแบบมาเพื่อคุณโดยเฉพาะ",
    "hero.description":
      "ค้นพบอ่าวลับอันสวยงามและผืนน้ำสีครามใสของทะเลอันดามันไปกับเรือยอชท์ส่วนตัวสุดหรู เลือกเช่าเรือ The Best, NAMASTE หรือ THE ONE เพื่อทริปสวรรค์บนดิน",
    "hero.selectVessel": "เลือกเรือของคุณ",
    "hero.planTrip": "วางแผนทริปส่วนตัว",
    "hero.planParty": "วางแผนทริปปาร์ตี้",
    "hero.planOvernight": "วางแผนทริปค้างคืน",
    "stats.catamarans": "จำนวนเรือยอชท์พร้อมบริการ",
    "stats.ports": "ท่าเรือขึ้นเรือในภูเก็ต",
    "stats.destinations": "จุดหมายปลายทางยอดฮิต",
    "stats.itineraries": "แผนการเดินทางเฉพาะคุณ",

    // Fleet Overview UI
    "fleet.badge": "กองเรือระดับพรีเมียม",
    "fleet.heading": "เลือกเรือยอชท์สุดหรูลำโปรดของคุณ",
    "fleet.description":
      "เรือของเราโดดเด่นด้วยวิศวกรรมทางทะเลชั้นเลิศ ห้องพักหรูหรา พื้นที่นั่งเล่นดาดฟ้าสองชั้นกว้างขวาง และกัปตันมืออาชีพคอยดูแลอย่างใกล้ชิด",
    "fleet.capacity": "ความจุผู้โดยสารสูงสุด",
    "fleet.length": "ความยาวเรือ",
    "fleet.cabins": "ห้องนอนพัก",
    "fleet.bathrooms": "ห้องน้ำ",
    "fleet.suitability": "ความเหมาะสมในการจัดปาร์ตี้",
    "fleet.selected": "เลือกแล้ว",
    "fleet.selectBtn": "เลือกเรือลำนี้",
    "fleet.configureBtn": "ปรับแต่งเรือลำนี้",
    "fleet.speed": "ความเร็ว",
    "fleet.built": "ปีที่สร้าง/ปรับปรุงใหม่",

    // Vessel Card Details & Specs
    "vessel.yacht": "เรือยอชท์แคทามารันสุดหรู",
    "vessel.suitability": "เหมาะสมสำหรับจัดทริปปาร์ตี้เฉลิมฉลอง",
    "vessel.capacityLabel": "ความจุสูงสุด",
    "vessel.upTo": "รองรับผู้โดยสารได้ถึง",
    "vessel.guests": "ท่าน",
    "vessel.cabinsLabel": "ห้องพักและห้องน้ำ / รูปแบบการจัดห้อง",
    "vessel.cabins": "ห้องนอน",
    "vessel.baths": "ห้องน้ำ",
    "vessel.speedLabel": "ความเร็วในการล่องเรือ",
    "vessel.crewLabel": "ลูกเรือมืออาชีพ",
    "vessel.crew": "คน",
    "vessel.amenities": "สิ่งอำนวยความสะดวกบนเรือและเครื่องเล่นทางน้ำ",
    "vessel.features":
      "จุดเด่นของทริปเดินทางและสิ่งอำนวยความสะดวกที่รวมอยู่แล้ว",
    "vessel.selected": "เลือกแล้ว",
    "vessel.select": "เลือกเรือยอชท์ลำนี้",
    "vessel.book": "ปรับแต่งแพ็กเกจและสำรองเรือ",

    // Benefits
    "benefits.title": "สิทธิประโยชน์สำหรับเรือเช่าเหมาลำ",
    "benefits.subtitle":
      "ทุกทริปเดินทางด้วยเรือแคทามารันส่วนตัวมาพร้อมบริการและสิ่งอำนวยความสะดวกระดับพรีเมียมเพื่อความผ่อนคลายสูงสุดของคุณ",
    "benefits.skipper.title": "กัปตันและลูกเรือผู้เชี่ยวชาญ",
    "benefits.skipper.desc":
      "ลูกเรือท้องถิ่นมืออาชีพคอยดูแลทิศทางการเดินเรือ แนะนำจุดดำน้ำตื้น และบริการด้วยความอบอุ่น",
    "benefits.catering.title": "บริการอาหารต้อนรับสไตล์ทรอปิคอล",
    "benefits.catering.desc":
      "ผลไม้สดตามฤดูกาลในท้องถิ่น น้ำอัดลมพรีเมียม น้ำดื่มแช่เย็นใสสะอาด และของว่างบำรุงกำลัง",
    "benefits.gear.title": "ของเล่นทางน้ำและอุปกรณ์ดำน้ำตื้น",
    "benefits.gear.desc":
      "รวมหน้ากากดำน้ำตื้นลึก เสื้อชูชีพมาตรฐานความปลอดภัย และบอร์ดพายแบบยืน (SUP)",
    "benefits.safety.title": "กล่องอุปกรณ์ปฐมพยาบาลมาตรฐาน",
    "benefits.safety.desc":
      "เพื่อความอุ่นใจตลอดการเดินทาง เรือทุกลำในกองเรือของเราได้รับการเตรียมพร้อมด้วยกล่องอุปกรณ์ปฐมพยาบาลทางทะเลระดับมืออาชีพ",
    "benefits.seasickness.title": "ยาแก้เมารถเมาเรือฟรี",
    "benefits.seasickness.desc":
      "เพื่อการเดินทางที่ราบรื่นและแสนสบาย เรือของเรารวมบริการยาแก้เมาเรือเตรียมพร้อมไว้ให้อย่างครบครันโดยไม่มีค่าใช้จ่ายใดๆ",

    // Booking Form UI
    "form.step1.title": "01. เลือกเรือแคทามารันของคุณ",
    "form.step1b.title": "02. เลือกเวลาเช่าเหมาลำเรือ",
    "form.step1b.half": "ครึ่งวัน (4-5 ชั่วโมง)",
    "form.step1b.full": "เต็มวัน (8-9 ชั่วโมง)",
    "form.step2.title": "03. วันเดินทาง & จำนวนแขก",
    "form.step2.date": "เลือกกำหนดวันเดินทาง",
    "form.step2.guests": "จำนวนผู้โดยสารบนเรือ",
    "form.step3.title":
      "04. เลือกเส้นทางจุดหมายปลายทาง (เลือกได้หลายเส้นทาง / กำหนดเอง)",
    "form.step3.recommended": "ท่าเรือขึ้นเรือที่แนะนำ",
    "form.step3.warning":
      "ท่าเรือขึ้นเรือไม่ตรงเส้นทาง! แนะนำให้ปรับไปเลือกที่",
    "form.step4.title": "05. เลือกท่าเรือขึ้นเรือในภูเก็ต",
    "form.step4b.title": "06. ของเล่นน้ำพรีเมียมและการตกแต่งพิเศษ",
    "form.step4b.desc":
      "เปิดประสบการณ์สุดหรูเหนือระดับด้วยเครื่องเล่นและการปรับเพิ่มอุปกรณ์จัดปาร์ตี้ระดับท็อป",
    "form.upgrade.slider": "สไลเดอร์ยักษ์เป่าลม",
    "form.upgrade.sliderDesc":
      "เพิ่มความสนุกสุดเร้าใจด้วยการลื่นไถลลงจากฟลายบริดจ์ด้านบนสู่ผืนน้ำอันดามันสีมรกต",
    "form.upgrade.pool": "สระนํ้าตาข่ายเป่าลมกันกระแสนํ้า",
    "form.upgrade.poolDesc":
      "เนรมิตสระว่ายน้ำส่วนตัวที่ลอยตัวท้ายเรือ ปลอดภัยและอุ่นใจสำหรับเด็กๆ หมดกังวลเรื่องกระแสน้ำ",
    "form.upgrade.cabin": "สิทธิ์เปิดใช้ห้องนอนพักปรับอากาศ",
    "form.upgrade.cabinDesc":
      "เปิดสิทธิ์สัมผัสความเป็นส่วนตัวห้องแอร์ใต้ดาดฟ้าพร้อมเตียงคู่และห้องน้ำสำหรับการล่องเรือพักผ่อน",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "ตัวเลือกบริการจัดเลี้ยงอาหารบนเรือ",
    "form.upgrade.foodStandard": "เมนูอาหารต้อนรับมาตรฐานฟรี",
    "form.upgrade.foodStandardDesc":
      "อาหารว่างนานาชนิดแสนอร่อย สะเต๊ะไก่ซิกเนเจอร์สูตรพิเศษ และโรลผัดไทยห่อพร้อมทาน",
    "form.upgrade.foodStandardIncl": "รวมบริการฟรีในแพ็กเกจ",
    "form.upgrade.foodSeafood": "เซ็ตบาร์บีคิวอาหารทะเลพรีเมียม",
    "form.upgrade.foodSeafoodDesc":
      "กุ้งลายเสืออันดามันย่างร้อนๆ ปลาปลาเก๋าขาวทะเลสดๆ หมึกย่าง และมันฝรั่งอบเนยกระเทียม",
    "form.upgrade.foodThai": "อาหารไทยบุฟเฟต์สูตรชาววัง",
    "form.upgrade.foodThaiDesc":
      "ต้มยำกุ้งรสเลิศสูตรเด่น มัสมั่นเนื้อรสชาติเข้มข้น ข้าวผัดสับปะรดจานอร่อย และข้าวเหนียวมะม่วงสีทองหวานฉ่ำ",
    "form.upgrade.foodWestern": "เซ็ตอาหารสากลตะวันตกเลิศหรู",
    "form.upgrade.foodWesternDesc":
      "หอยเชลล์ฮอกไกโดซอสทรัฟเฟิล เนื้อออสเตรเลียนแบล็กแองกัสย่าง ซีซาร์สลัดออร์แกนิก และของหวานรสเลิศ",
    "form.upgrade.selected": "เมนูอาหารที่เลือกแล้ว",

    "form.upgrade.bartender": "บริการบาร์เทนเดอร์มืออาชีพ (ปาร์ตี้อัปเกรด)",
    "form.upgrade.bartenderBtn": "จ้างบาร์เทนเดอร์และมิกโซโลจิสผู้เชี่ยวชาญ",
    "form.upgrade.bartenderDesc":
      "เสิร์ฟค็อกเทลปรุงแก้วต่อแก้ว บริการรินไวน์รสเลิศ และเครื่องดื่มม็อกเทลเฉลิมฉลองครบรสโดยผู้เชี่ยวชาญ",
    "form.upgrade.bartenderSelect": "เลือกจำนวนบาร์เทนเดอร์",
    "form.upgrade.bartenderOpt1": "บาร์เทนเดอร์มืออาชีพ 1 คน",
    "form.upgrade.bartenderOpt2": "บาร์เทนเดอร์มืออาชีพ 2 คน",
    "form.upgrade.bartenderOpt3":
      "บาร์เทนเดอร์มืออาชีพ 3 คน (แนะนำสำหรับทริปปาร์ตี้ขนาดใหญ่)",

    "form.upgrade.cakeTitle":
      "เค้กปาร์ตี้วันเกิดและโอกาสพิเศษ (ฉลอง & อัปเกรด)",
    "form.upgrade.cakeBtn": "สั่งจองเค้กฉลองโอกาสพิเศษส่วนตัว",
    "form.upgrade.cakeDesc":
      "ฉลองความทรงจำที่อบอุ่นด้วยเค้กพรีเมียมเพิ่งอบสดใหม่ ตกแต่งอย่างประณีต ส่งตรงแบบแช่เย็นจนถึงมือคุณบนเรือยอชท์",
    "form.upgrade.cakeSelect": "ระบุจำนวนเค้ก (1-5 ก้อน)",
    "form.upgrade.cakeOpt": "เค้กเฉลิมฉลอง",
    "form.upgrade.cakeOptP": "เค้กเฉลิมฉลอง",
    "form.upgrade.cakeOptMax": "แพ็กเก็จเซ็ตเค้กฉลองจัดเต็มสำหรับทริปปาร์ตี้",

    // Customer Detail Form & Actions
    "form.step5.title": "07. ชื่อตัวแทนผู้ระบุการจองเรือ",
    "form.step5.placeholder": "เช่น คุณรนกร เพชรพรรณ",
    "form.step5.requests": "08. คำขอหรือความต้องการพิเศษอื่นๆ",
    "form.step5.requestsPl":
      "เช่น ความต้องการอาหารพิเศษเพื่อสุขภาพ, ตารางการดำน้ำลึก, การตกแต่งป้ายปาร์ตี้",

    // Copy & Form Triggers
    "form.draft.title": "ข้อมูลรายละเอียดความต้องการจองเรือ",
    "form.draft.copy": "คัดลอกข้อความเจตจำนงการจอง",
    "form.draft.copied": "✓ คัดลอกข้อความเป็นสิทธิ์ข้อมูลแล้ว!",
    "form.bookWhatsApp": "สำรองที่นั่ง/จองด่วนผ่าน WhatsApp",
    "form.callAgency": "โทรติดต่อฝ่ายขาย",
    "form.downloadPdf": "ดาวน์โหลดโบรชัวร์และใบเสนอราคา PDF",
    "form.speedBooking":
      "จองทริปส่วนตัวแบบรวดเร็วทันใจผ่านการแชตไลน์/วอตส์แอป หรือโทรสายตรงหาพนักงานทันที",

    // Success Toast
    "toast.successTitle": "จัดทำข้อมูลเรียบร้อย",
    "toast.successDesc":
      "รายละเอียดเส้นทางท่องเที่ยวส่วนตัวของคุณพร้อมแล้ว โปรดคลิกส่งความเจตจำนงแชตสนทนาผ่านทาง WhatsApp เพื่อยืนยันวันที่ของคุณ!",

    // Privacy Banner UI
    "privacy.btn": "ตั้งค่าความเป็นส่วนตัว",
    "privacy.pdpa": "ข้อกำหนดคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
    "footer.language": "เลือกภาษา",

    // Map & Guide Translations
    "map.interactiveChart": "01. แผนที่เดินเรือภูเก็ตแบบโต้ตอบ",
    "map.exploreRoutes": "สำรวจเส้นทางเดินเรืออันดามัน",
    "map.exploreDesc":
      "เนวิเกตเดินทางระหว่างท่าเรือเริ่มต้นและจุดหมายปลายทางยอดฮิตบนแผนที่แบบอินเตอร์แอคทีฟของเรา คลิกจุดใดๆ เพื่อเริ่มสร้างเส้นทางข้ามทะเล ตรวจสอบระยะทางไมล์ทะเล เวลาเดินทาง และรายละเอียดกิจกรรมเฉลิมฉลองคัดสรร",
    "map.legend": "คำอธิบายสัญลักษณ์บนแผนที่",
    "map.startHub": "ท่าเรือเริ่มต้น",
    "map.activePoint": "จุดที่เลือก",
    "map.destIsland": "เกาะจุดหมายปลายทาง",
    "map.target": "จุดมุ่งหมายเขตร้อน",
    "map.cruise": "การล่องเรือ",
    "map.features": "กิจกรรมไฮไลต์และสิ่งอำนวยความสะดวก",
    "map.optimalPier": "ท่าเรือที่เหมาะสมที่สุด:",
    "map.distance": "ระยะทาง",
    "map.transit": "เวลาในการเดินทาง",
    "map.excursion": "การท่องเที่ยวเกาะ",
    "map.private": "ส่วนตัว 100%",
    "map.optimalDeparture": "ท่าเรือเริ่มต้นที่แนะนำ",
    "map.hours": "ชั่วโมง",
    "map.hour": "ชม.",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "ใต้",
    "piers.ao-po.location": "ตะวันออกเฉียงเหนือ",
    "destination.startingPoint": "ท่าเรือขิ้นเรือมาตรฐาน",
    "guide.title": "คู่มือจุดหมายปลายทางภูเก็ตยอดฮิต",
    "guide.subtitle": "เปรียบเทียบระยะทางเดินเรือและพิกัดลงน้ำลึกที่โดดเด่น",
    "filter.all": "เกาะทั้งหมด",
    "btn.addToRoute": "เพิ่มเข้ากับเส้นทางของคุณ",
    "map.dragToPan": "ลากเพื่อย้ายตําแหน่งแผนที่",
    "map.chartScale": "มาตราส่วนแผนที่: 1 : 250,000",
    "map.latLong": "พิกัดอ้างอิง: 7.9512° N, 98.3916° E",
    "map.andamanSea": "ทะเลอันดามัน",
    "map.tip":
      "ชี้ที่จุดปักเพื่อส่องดูพิกัดเดินเรือลากสายตา คลิกเพื่อล็อกหน้าต่างไฮไลต์",
    "map.maxSpeed": "เรือทุกลำใช้ความเร็วลากปลอดภัยไม่เกิน 8 นอต",
    "map.zoomIn": "ขยายแผนที่",
    "map.zoomOut": "ย่อแผนที่",
    "map.zoomReset": "รีเซ็ตตําแหน่ง",
    "piers.chalong.short": "ฉลอง",
    "piers.ao-po.short": "ท่าเรืออ่าวปอ (Ao Po Pier)",
    "map.startingPort": "ท่าเรืออ้างอิง",
    "map.destination": "จุดหมายเกาะปลายทาง",
    "map.estTime": "เวลาเดินทาง",
    "map.southPhuketDept": "จุดขึ้นเรือทางฝั่งใต้ของภูเก็ต",
    "map.nePhuketBase": "ท่าเรืออ่าวปอ (ฝั่งตะวันออกเฉียงเหนือ)",
  },
  zh: {
    // Header & Hero
    "header.title": "PHUKET AMAZING",
    "header.subtitle": "奢华游艇包船",
    "header.tagline": "专属私人海上定制体验",
    "header.reservations": "直接预订",
    "header.configure": "配置您的专属包船",
    "hero.badge": "定制海岛航行",
    "hero.heading1": "专属私人定制",
    "hero.heading2": "双体船日租巡游之旅",
    "hero.description":
      "乘坐精致奢华的私人游艇，探索安达曼海隐藏的潟湖和纯净碧蓝的海域。为您定制专属海岛航程，可选择 The Best、NAMASTE 或 THE ONE。",
    "hero.selectVessel": "选择您的专属游艇",
    "hero.planTrip": "定制行程规划",
    "hero.planParty": "策划海上派对",
    "hero.planOvernight": "策划过夜多日游",
    "stats.catamarans": "现役双体船总数",
    "stats.ports": "普吉登船就近码头",
    "stats.destinations": "热带风情海岛",
    "stats.itineraries": "私人定制航线",

    // Fleet Overview UI
    "fleet.badge": "船队尊享选择",
    "fleet.heading": "选择您的海上航行奇迹",
    "fleet.description":
      "我们的船只拥有卓越的近海工程设计、豪华舒适的客舱、双层宽阔甲板的休闲空间，并配备专业持证船长。",
    "fleet.capacity": "最大旅客载重",
    "fleet.length": "船长",
    "fleet.cabins": "豪华客舱",
    "fleet.bathrooms": "卫浴间",
    "fleet.suitability": "派对欢庆适用度",
    "fleet.selected": "已选定",
    "fleet.selectBtn": "选定此船",
    "fleet.configureBtn": "配置此双体船",
    "fleet.speed": "航速",
    "fleet.built": "建造/翻新年份",

    // Vessel Card Details & Specs
    "vessel.yacht": "奢华双体船游艇",
    "vessel.suitability": "派对活动适用度",
    "vessel.capacityLabel": "最大载客量",
    "vessel.upTo": "最多可载",
    "vessel.guests": "位贵宾",
    "vessel.cabinsLabel": "奢华客舱及独立卫浴 / 布局",
    "vessel.cabins": "间客舱",
    "vessel.baths": "间卫浴",
    "vessel.speedLabel": "平均巡航航速",
    "vessel.crewLabel": "专业执证船员",
    "vessel.crew": "名专业船员",
    "vessel.amenities": "船载高端娱乐设施与海上玩具",
    "vessel.features": "航程核心亮点及包含赠送项目",
    "vessel.selected": "当前选定",
    "vessel.select": "选择此游艇",
    "vessel.book": "配置专属行程及预订",

    // Benefits
    "benefits.title": "奢华一日包船尊享礼遇",
    "benefits.subtitle":
      "每一次私人双体船远征都包含行政级海上礼遇服务，确保您全身心放松和享受。",
    "benefits.skipper.title": "资深专业船长与水手服务",
    "benefits.skipper.desc":
      "专属本地资深船员竭诚服务，全权负责航行、寻找绝美浮潜点及贴心款待。",
    "benefits.catering.title": "缤纷热带餐饮",
    "benefits.catering.desc":
      "时令新鲜热带水果冷盘、高档 soft drinks、冰镇纯净水及精美点心包。",
    "benefits.gear.title": "水上玩具与高级浮潜设备",
    "benefits.gear.desc":
      "包含高级专业浮潜面罩、安全救生衣以及时尚站立式桨板 (SUP)。",
    "benefits.safety.title": "船载常备应急医药箱",
    "benefits.safety.desc":
      "为了您的海上出行安全，我们船队的每一艘双体船均配备专业海洋级应急医药救护箱。",
    "benefits.seasickness.title": "免费应急晕船药 (晕船贴)",
    "benefits.seasickness.desc":
      "为了确保旅途平稳舒适，每艘双体船上均配有高效防晕船药物，完全免费提供。",

    // Booking Form UI
    "form.step1.title": "01. 选择您的专属双体船",
    "form.step1b.title": "02. 选定租船航行时长",
    "form.step1b.half": "半日巡游 (4-5 小时)",
    "form.step1b.full": "全日巡游 (8-9 小时)",
    "form.step2.title": "03. 选择日期与登船贵宾人数",
    "form.step2.date": "选定租船登船日期",
    "form.step2.guests": "登船预估总人数",
    "form.step3.title": "04. 选定航行目的地航线 (可多选 / 自行规划)",
    "form.step3.recommended": "推荐码头出海口",
    "form.step3.warning": "登船出发码头冲突！强烈建议调整并选定",
    "form.step4.title": "05. 选定普吉岛登船码头",
    "form.step4b.title": "06. 水上玩具及船载尊贵定制升级",
    "form.step4b.desc":
      "为您在海上的奢华体验锦上添花，可自选搭载专业活动设备和高端配饰选件。",
    "form.upgrade.slider": "充气式巨型飞桥海上滑梯",
    "form.upgrade.sliderDesc":
      "直接从飞桥上层滑入蔚蓝温暖海水中的极具动感的畅玩新高度。",
    "form.upgrade.pool": "充气海面安全网防流游泳网池",
    "form.upgrade.poolDesc":
      "在双体船艉固定网池，为孩童及宾客营造百分百安心的隔离游泳池。",
    "form.upgrade.cabin": "配备全空调奢华睡舱舱房",
    "form.upgrade.cabinDesc":
      "解锁甲板下方高档空调双人卧室套间及全套淋浴系统，以便中途休沐养神。",

    // BBQ & Drinks Add-ons
    "form.upgrade.bbqTitle": "船上顶级餐饮膳食方案",
    "form.upgrade.foodStandard": "标准免费船载点心软饮",
    "form.upgrade.foodStandardDesc":
      "各类精美手指泡芙、炭烤泰式鸡肉沙爹串以及爽口的泰式金边粉卷。",
    "form.upgrade.foodStandardIncl": "完全免费赠送",
    "form.upgrade.foodSeafood": "至臻海鲜炭烤 BBQ",
    "form.upgrade.foodSeafoodDesc":
      "安达曼海捕捞海鲈鱼、大虎虾、鲜爽鱿鱼和香烤香蒜黄油土豆块。",
    "form.upgrade.foodThai": "泰皇御膳宫廷宴",
    "form.upgrade.foodThaiDesc":
      "经典招牌冬阴功汤、浓郁玛莎曼泰式咖喱牛肉、菠萝炒饭及黄金芒果糯米饭。",
    "form.upgrade.foodWestern": "西式至臻自助私房宴",
    "form.upgrade.foodWesternDesc":
      "松露北海道鲜扇贝、秘制澳洲安格斯牛柳排、有机凯撒沙拉和高端主厨西点。",
    "form.upgrade.selected": "当前选定的餐饮方案",

    "form.upgrade.bartender": "专业调酒师现场服务 (派对高端升级)",
    "form.upgrade.bartenderBtn": "特聘持证花式调酒师和侍酒师上船",
    "form.upgrade.bartenderDesc":
      "为您的贵宾呈现极致高雅的定制鸡尾酒现摇调配、名庄红酒倒酒服务与莫吉托派对升级。",
    "form.upgrade.bartenderSelect": "选择特聘调酒师人数",
    "form.upgrade.bartenderOpt1": "1 位专业调酒师",
    "form.upgrade.bartenderOpt2": "2 位专业调酒师",
    "form.upgrade.bartenderOpt3": "3 位专业调酒师 (大型派对推荐)",

    "form.upgrade.cakeTitle": "纪念日/庆典私人订制蛋糕 (生日及纪念升级)",
    "form.upgrade.cakeBtn": "尊享定制生日/周年纪念蛋糕",
    "form.upgrade.cakeDesc":
      "提供现场星级烘焙的高级定制翻糖/鲜奶蛋糕，提前冰镇装船，呈现惊喜时刻。",
    "form.upgrade.cakeSelect": "选择蛋糕订购数量 (1-5 个)",
    "form.upgrade.cakeOpt": "定制庆典蛋糕",
    "form.upgrade.cakeOptP": "定制庆典蛋糕",
    "form.upgrade.cakeOptMax": "最高档尊享包办庆典蛋糕组",

    // Customer Detail Form & Actions
    "form.step5.title": "07. 首选联络贵宾代表姓名",
    "form.step5.placeholder": "例如：张博森 先生",
    "form.step5.requests": "08. 专属定制需求 / 特别备注",
    "form.step5.requestsPl":
      "例如：全家浮潜设备说明、潜水配置说明、求婚惊喜蛋糕布置",

    // Copy & Form Triggers
    "form.draft.title": "为您实时生成的预订意向书详情",
    "form.draft.copy": "复制英文意向信息",
    "form.draft.copied": "✓ 详情已成功复制到剪贴板！",
    "form.bookWhatsApp": "通过 WhatsApp 立即发起预订",
    "form.callAgency": "致电咨询",
    "form.downloadPdf": "下载专属 PDF 意向书与报价单",
    "form.speedBooking":
      "通过 WhatsApp 在线对话或直接致电来极速开启专属行程包船预订",

    // Success Toast
    "toast.successTitle": "包船意向书生成完毕",
    "toast.successDesc":
      "您的专属配置行程已归纳完毕。请继续在 WhatsApp 客户端发送已生成的文本，以便我们的顾问核对订期！",

    // Privacy Banner UI
    "privacy.btn": "隐私设置",
    "privacy.pdpa": "PDPA 个人信息保护声明",
    "footer.language": "选择语言",

    // Map & Guide Translations
    "map.interactiveChart": "01. 普吉岛海区域交互海图",
    "map.exploreRoutes": "探索安达曼绝美航线",
    "map.exploreDesc":
      "通过专属的高级交互式海图，在始发港口与热带度假群岛之间自由定位。点击任意点即可绘制实时的航行轨迹线，详细审阅航海浬程距离、预估航时以及专属的浮潜登岛游玩特色。",
    "map.legend": "海图标注说明",
    "map.startHub": "起航接驳码头",
    "map.activePoint": "当前选中位置",
    "map.destIsland": "热带度假群岛",
    "map.target": "热带探索目标",
    "map.cruise": "航程",
    "map.features": "岛屿游玩亮点与包含项",
    "map.optimalPier": "最佳起航登船码头：",
    "map.distance": "航行距离",
    "map.transit": "单程预估航时",
    "map.excursion": "巡航旅程",
    "map.private": "100% 私人包船",
    "map.optimalDeparture": "建议始发码头",
    "map.hours": "小时",
    "map.hour": "小时",
    "piers.chalong.name": "Chalong Pier",
    "piers.ao-po.name": "Ao Po Pier",
    "piers.chalong.location": "南部",
    "piers.ao-po.location": "东北部",
    "destination.startingPoint": "建议启航始发港",
    "guide.title": "普吉岛热带群岛目的地指南",
    "guide.subtitle": "详尽对比离岛航程距离、单程预估航时与臻选登船港口",
    "filter.all": "全部探索岛屿",
    "btn.addToRoute": "添加至我的定制路线",
    "map.dragToPan": "可拖拽或滑动海图以平移视野",
    "map.chartScale": "海图比例尺: 1 : 250,000",
    "map.latLong": "精准经纬度基础参考值: 北纬 7.9512°, 东经 98.3916°",
    "map.andamanSea": "安达曼海区",
    "map.tip":
      "将鼠标悬停在标注点上即可预览航行航线轨迹。点击可锁定专属岛屿细节。",
    "map.maxSpeed": "所有双体船体平均安全巡航时速 8 节",
    "map.zoomIn": "放大海图",
    "map.zoomOut": "缩小海图",
    "map.zoomReset": "重设海图视野",
    "piers.chalong.short": "查龙",
    "piers.ao-po.short": "奥波码头 (Ao Po Pier)",
    "map.startingPort": "启航港口",
    "map.destination": "度假岛屿",
    "map.estTime": "预计时间",
    "map.southPhuketDept": "普吉岛南部港口启航",
    "map.nePhuketBase": "奥波码头 (Ao Po Pier - 东北部)",
  },
};
