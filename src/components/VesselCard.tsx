import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Ship,
  Compass,
  Settings,
  Check,
  CalendarDays,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Images,
  Maximize2,
  Languages,
  MapPin,
  Share2,
  Send,
  Mail,
  Facebook,
  Copy,
} from "lucide-react";
import { Catamaran } from "../types";
import { useLanguage } from "../LanguageContext";
import { useCurrency } from "../CurrencyContext";
import VesselLightbox from "./VesselLightbox";
import { ImageWithFallback } from "./ImageWithFallback";

export const VESSEL_BASE_RATES: Record<
  string,
  { halfday: number; sunset: number; fullday: number; overnight: number }
> = {
  "the-best": {
    halfday: 55000,
    sunset: 55000,
    fullday: 85000,
    overnight: 150000,
  },
  namaste: {
    halfday: 40000,
    sunset: 40000,
    fullday: 65000,
    overnight: 110000,
  },
  "the-one": {
    halfday: 35000,
    sunset: 35000,
    fullday: 55000,
    overnight: 95000,
  },
};

const VESSEL_TRANSLATIONS: Record<
  string,
  Record<
    "en" | "ru" | "hi" | "zh" | "th",
    {
      name: string;
      description: string;
      partySuitability: string;
      highlights: string[];
      amenities: string[];
    }
  >
> = {
  "the-best": {
    en: {
      name: "The Best",
      description:
        "Built for absolute stability and superb celebration space, 'The Best' is a majestic double-hulled yacht spacious enough to host up to 45 guests for daytime cruises, plus full overnight charters. Equipped with 6 luxurious Air-Conditioned (AC) cabins and a fully air-conditioned main saloon area, it welcomes overnight groups looking for tailored adventures. Sleep secure and navigate gorgeous remote islands with custom itinerary routes determined by customer choice or mutual agreement. For all multi-day overnight adventures, delicious full-board packages consisting of fresh Breakfast, Lunch, and Dinner are completely included inside the experience.",
      partySuitability:
        "Outstanding for birthday parties & dynamic celebrations of any kind (up to 45 guests)",
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
      ],
    },
    ru: {
      name: "The Best",
      description:
        "Созданная для абсолютной остойчивости и великолепного праздничного пространства, яхта 'The Best' — это величественный двухкорпусный катамаран, достаточно просторный для размещения до 45 гостей во время дневных круизов, а также для полноценных ночных чартеров. Оснащенная 6 роскошными каютами с кондиционерами (AC) и полностью кондиционируемым главным салоном, она идеально подходит для групп на ночлег, ищущих индивидуальные приключения. Спите в безопасности и путешествуйте по великолепным уединенным островам по индивидуальным маршрутам, определяемым выбором клиента или взаимным соглашением. Во всех многодневных приключениях с ночевкой в стоимость полностью включено вкуснейшее трехразовое питание (завтрак, обед и ужин), свежеприготовленное на борту.",
      partySuitability:
        "Превосходно подходит для вечеринок по случаю дня рождения и динамичных праздников любого рода (до 45 гостей)",
      highlights: [
        "6 роскошных двухместных кают с кондиционерами + современный кондиционер в салоне",
        "Ночной полный пансион включен: Восхитительный завтрак, обед и ужин, свежеприготовленные на борту",
        "Гибкий маршрут круиза, определяемый полностью по выбору клиента или по согласованию с капитаном",
        "Просторный флайбридж с непрерывной 360-градусной панорамой Андаманского моря",
        "Отличный выбор для масштабных вечеринок по случаю дня рождения, премиальных праздников и корпоративных групп (до 45 гостей днем)",
        "Эксклюзивный угольный гриль-барбекю на палубе",
        "Премиальная кофемашина эспрессо с неограниченным количеством чашек включена в стоимость",
        "32-дюймовый Smart TV с Netflix и YouTube для ваших детей",
        "Бесплатный высокоскоростной Wi-Fi на борту (скорость зависит от активных подключений)",
        "3 изотермических ящика для хранения ваших напитков идеально холодными",
        "Оснащена стандартной морской аптечкой первой помощи",
        "Снабжена таблетками от укачивания (предоставляются бесплатно)",
      ],
      amenities: [
        "6 кают с кондиционерами",
        "Кондиционер в салоне",
        "Питание при ночевке (завтрак, обед, ужин включены)",
        "Индивидуальное планирование маршрута (по выбору или согласованию)",
        "Электрогенератор и льдогенератор",
        "Интегрированная аудиосистема премиум-класса с Bluetooth",
        "Комплект снаряжения для сноркелинга и SUP-доска",
        "Океанское каноэ",
        "Угольный гриль барбекю (эксклюзивно на The Best)",
        "Кофемашина эспрессо (бесплатное неограниченное обслуживание)",
        '32" Smart TV с Netflix и YouTube на борту',
        "Бесплатный Wi-Fi на борту (скорость зависит от количества пользователей)",
        "3 изотермических ящика для холодных напитков",
        "Бортовая аптечка первой помощи",
        "Таблетки от укачивания (бесплатно)",
      ],
    },
    hi: {
      name: "The Best",
      description:
        "'The Best' पूर्ण स्थिरता और शानदार उत्सव स्थान के लिए बनाई गई एक शानदार डबल-हल वाली नौका है, जो दिन के समय क्रूज के लिए 45 मेहमानों तक की मेजबानी करने के लिए पर्याप्त विशाल है, साथ ही पूरी रात के चार्टर के लिए भी उपयुक्त है। 6 शानदार एयर-कंडीशन (AC) केबिन और पूरी तरह से वातानुकूलित मुख्य सैलून क्षेत्र से सुसज्जित, यह अनुकूलित रोमांच की तलाश में रात बिताने वाले समूहों का स्वागत करता है। सुरक्षित सोएं और ग्राहक की पसंद या आपसी समझौते द्वारा निर्धारित कस्टम यात्रा मार्गों के साथ भव्य दूरस्थ द्वीपों को पार करें। सभी बहु-दिवसीय रातोंरात रोमांच के लिए, ताज़ा नाश्ता, दोपहर का भोजन और रात के खाने से युक्त स्वादिष्ट फुल-बोर्ड पैकेज पूरी तरह से इस अनुभव के अंदर शामिल हैं।",
      partySuitability:
        "किसी भी प्रकार के जन्मदिन पार्टियों और गतिशील समारोहों के लिए उत्कृष्ट (45 मेहमानों तक)",
      highlights: [
        "6 पूरी तरह से वातानुकूलित लक्जरी डबल केबिन + आधुनिक सैलून एयर-कंडीशनिंग",
        "रातोंरात पूर्ण बोर्ड शामिल: बोर्ड पर ताजा तैयार स्वादिष्ट नाश्ता, दोपहर का भोजन और रात का भोजन",
        "लचीला क्रूज़ मार्ग पूरी तरह से ग्राहक की पसंद या मास्टर कप्तान के समझौते द्वारा निर्धारित किया जाता है",
        "निरंतर 360° सुंदर अंडमान परिदृश्यों के साथ विस्तृत फ्लाइंग ब्रिज",
        "बड़े पैमाने पर जन्मदिन पार्टियों, प्रीमियम समारोहों और कॉर्पोरेट समूहों के लिए उत्कृष्ट विकल्प (45 दिन के मेहमानों तक)",
        "डेक पर विशेष चारकोल बारबेक्यू सेटअप",
        "असीमित कप के साथ प्रीमियम कैफ़े एस्प्रेसो मशीन शामिल है",
        "आपके बच्चों के लिए नेटफ्लिक्स और यूट्यूब के साथ 32-इंच स्मार्ट टीवी",
        "मुफ़्त हाई-स्पीड ऑनबोर्ड वाई-फाई (गति सक्रिय कनेक्शन पर निर्भर करती है)",
        "आपके पेय पदार्थों को पूरी तरह से ठंडा रखने के लिए 3 कूलर बक्से",
        "मानक समुद्री प्राथमिक चिकित्सा किट से सुसज्जित",
        "समुद्री बीमारी के लिए गोलियों से सुसज्जित (निःशुल्क प्रदान किया जाता है)",
      ],
      amenities: [
        "6 वातानुकूलित केबिन",
        "सैलून एयर कंडीशनिंग",
        "ओवरनाइट कैटरिंग (नाश्ता, दोपहर का भोजन, रात का खाना शामिल)",
        "कस्टम मार्ग योजना (पसंद या समझौते से)",
        "पावर जेनरेटर और आइस मेकर",
        "ब्लूटूथ के साथ प्रीमियम एकीकृत ध्वनि प्रणाली",
        "पूर्ण स्नॉर्कलिंग उपकरण और एसयूपी (स्टैंड-अप पैดलबोर्ड)",
        "महासागर डोंगी (Canoe)",
        "चारकोल बारबेक्यू (The Best के लिए विशेष)",
        "ऑनबोर्ड कैफ़े एस्प्रेसो मशीन (मुफ़्त असीमित सर्विंग्स)",
        'नेटफ्लिक्स और यूट्यूब के साथ ऑनबोर्ड 32" स्मार्ट टीवी',
        "मुफ्त ऑनबोर्ड वाईफाई इंटरनेट (गति उपयोगकर्ताओं पर निर्भर)",
        "ठंडे पेय पदार्थों के लिए 3 कूलर बॉक्स",
        "ऑनबोर्ड प्राथमिक चिकित्सा किट",
        "समुद्री बीमारी की गोलियाँ (निःशुल्क)",
      ],
    },
    zh: {
      name: "The Best",
      description:
        "‘The Best’ 双体游艇专为极致平稳与绝佳庆典空间而设计。船体宏伟宽敞，白天巡航可容纳多达 45 名贵宾，并支持全天候过夜包船。游艇配备 6 间豪华空调（AC）双人客舱及全空调主沙龙区，是追求量身定制航海冒险的过夜团队之首选。在安全舒适中安睡，并可根据客户自主选择或与船长共同商定的定制航线，畅游叹为观止的离岛秘境。在所有多日过夜航海行程中，体验已完全包含由船上现场新鲜烹饪的美味全餐（早餐、午餐及晚餐）。",
      partySuitability:
        "作为各种大型生日庆祝、亲友聚会或派对的最佳奢华之选（至多 45 人）",
      highlights: [
        "6 间全空调豪华双人客舱 + 现代沙龙主舱区空调系统",
        "包含过夜全餐：船上新鲜现做美味早餐、午餐和晚餐",
        "灵活巡航路线设定，完全由客户自选或与船长协商达成",
        "极其宽阔的双体飞桥，坐拥连续 360° 安达曼群岛绝美胜景",
        "大型生日派对、至尊商务庆典、团队建设的绝佳选择（白昼航行支持多达 45 名贵宾）",
        "甲板专属碳烤木炭烧烤设备组",
        "配有机上商用半自动意式浓缩咖啡机，无限量免费畅饮",
        "配有 32 英寸智能网络电视，预装 Netflix 与 YouTube，儿童娱乐无忧",
        "船上提供免费高带宽无线网络高速 WiFi （带宽取决于实际海域信号强度）",
        "配有 3 台专业户外保温保冷冰箱，可完美保冰饮品",
        "船上标配国际航海标准专业急救箱",
        "完全免费备有进口防晕船专业口服药品",
      ],
      amenities: [
        "6 间空调舱",
        "主沙龙大厅空调",
        "过夜餐饮供应（含早餐、午餐、晚餐）",
        "自选航线规划（自由选定或协商一致）",
        "大功率发电机与商用自动制冰机",
        "专业级车载集成高品质蓝牙音响系统",
        "全套浮潜呼吸面罩与站立式桨板（SUP）",
        "深海双人独木舟",
        "豪华木炭烧烤炉（The Best 专属）",
        "半自动咖啡机（免费无限畅饮）",
        "智能 32 英寸彩色电视联播网",
        "全船高速 Wi-Fi 覆盖（信号质量由所处海域决定）",
        "3 台户外饮品保冷保温箱",
        "船用专业航空医护急救包",
        "安全防晕船药口服药片（完全免费）",
      ],
    },
    th: {
      name: "The Best",
      description:
        "เรือ 'The Best' ได้รับการสร้างขึ้นมาเพื่อความเสถียรสูงสุดและพื้นที่จัดเลี้ยงสังสรรค์อันยอดเยี่ยม เป็นเรือยอชท์สองท้อง (Catamaran) ที่สง่างามและกว้างขวางเพียงพอที่จะรองรับแขกได้มากถึง 45 ท่านสำหรับโปรแกรมล่องเรือแบบรายวัน รวมถึงการเช่าเหมาลำค้างคืนอย่างเต็มรูปแบบ พร้อมกับห้องพักแบบปรับอากาศสุดหรู 6 ห้อง และพื้นที่ห้องโถงหลักที่ติดตั้งเครื่องปรับอากาศอย่างครบครัน เหมาะสำหรับกลุ่มนักเดินทางแบบค้างคืนที่มองหาการผจญภัยส่วนตัวอันเป็นเอกลักษณ์ พักผ่อนได้อย่างปลอดภัยและแล่นเรือชมเกาะระยะไกลที่งดงามด้วยเส้นทางที่กำหนดได้เองตามความต้องการของลูกค้าหรือข้อตกลงร่วมกัน สำหรับการผจญภัยค้างคืนหลายวัน แพ็คเกจอาหารแบบฟูลบอร์ดแสนอร่อย ประกอบด้วยอาหารเช้า อาหารกลางวัน และอาหารเย็นที่ปรุงสดใหม่ จะได้รับการรวมเข้าไว้ในประสบการณ์การเดินทางนี้สำหรับคุณอย่างแท้จริง",
      partySuitability:
        "ยอดเยี่ยมโดดเด่นสำหรับการจัดปาร์ตี้วันเกิดและการเฉลิมฉลองคึกคักทุกประเภท (รองรับแขกได้สูงสุด 45 ท่าน)",
      highlights: [
        "ห้องพักคู่สุดหรู 6 ห้องพร้อมเครื่องปรับอากาศครบครัน + แอร์คอนดิชั่นเนอร์ในห้องโถงหลัก",
        "รวมบริการอาหารค้างคืนแบบฟูลบอร์ด: อาหารเช้า กลางวัน และเย็นแสนอร่อย ปรุงสดใหม่บนเรือ",
        "เส้นทางการล่องเรือที่ยืดหยุ่น กำหนดได้ตามความต้องการของลูกค้าหรือความเห็นชอบของกัปตัน",
        "ฟลายบริดจ์ขนาดกว้างขวางเพื่อรับชมวิวทิวทัศน์แบบพาโนรามา 360 องศาของทะเลอันดามันอย่างต่อเนื่อง",
        "ตัวเลือกที่ยอดเยี่ยมสำหรับการจัดงานวันเกิดขนาดใหญ่ การเฉลิมฉลองระดับพรีเมียม และกลุ่มบริษัท (แขกสูงสุด 45 ท่านต่อวัน)",
        "อุปกรณ์บาร์บีคิวถ่านสุดพิเศษจัดวางบนดาดฟ้าเรือ",
        "เครื่องชงกาแฟเอสเปรสโซระดับพรีเมียมส่วนตัวพร้อมบริการเสิร์ฟฟรีไม่จำกัดถ้วย",
        "สมาร์ททีวีขนาด 32 นิ้วพร้อม Netflix และ YouTube สำหรับบุตรหลานของคุณ",
        "อินเทอร์เน็ต WiFi ความเร็วสูงฟรีบนเรือ (ความเร็วขึ้นอยู่กับจุดเชื่อมต่อสัญญาณ)",
        "ถังแช่เย็น 3 ใบเพื่อรักษาเครื่องดื่มของคุณให้เย็นจัดอย่างสมบูรณ์แบบ",
        "มีอุปกรณ์ปฐมพยาบาลทางทะเลมาตรฐานระดับสากลครบถ้วน",
        "มียาแก้เมาคลื่นเตรียมพร้อมบริการให้ฟรีโดยไม่คิดค่าใช้จ่าย",
      ],
      amenities: [
        "ห้องพักปรับอากาศ 6 ห้อง",
        "เครื่องปรับอากาศในห้องโถงกลาง",
        "อาหารสำหรับแผนค้างคืน (รวมมื้ออาหารเช้า, กลางวัน, เย็น)",
        "การวางแผนเส้นทางล่องเรือส่วนตัว (ตามต้องการหรือตกลงร่วมกัน)",
        "เครื่องปั่นไฟขนาดใหญ่และเครื่องทำน้ำแข็ง",
        "เครื่องเสียงระบบ Bluetooth พรีเมียมรอบทิศทาง",
        "อุปกรณ์ดำน้ำตื้นครบชุด และบอร์ดพายแบบยืน (SUP)",
        "เรือแคนูทางทะเล",
        "เตาบาร์บีคิวถ่านหรู (สิทธิพิเศษสำหรับเรือ The Best เท่านั้น)",
        "เครื่องชงกาแฟเอสเปรสโซบนเรือ (เสิร์ฟฟรีไม้วั้น)",
        "สมาร์ททีวีขนาด 32 นิ้วพร้อม Netflix และ YouTube บนเรือ",
        "ฟรีสัญญาณอินเทอร์เน็ต WiFi ความเร็วสูงบนเรือ (ความเร็วขึ้นอยู่กับจุดเชื่อมต่อสัญญาณ)",
        "ถังแช่เย็น 3 ใบเพื่อรักษาเครื่องดื่มของคุณให้เย็นจัดอย่างสมบูรณ์แบบ",
        "มีอุปกรณ์ปฐมพยาบาลทางทะเลมาตรฐานระดับสากลครบถ้วน",
        "มียาแก้เมาคลื่นเตรียมพร้อมบริการให้ฟรีโดยไม่คิดค่าใช้จ่าย",
      ],
    },
  },
  namaste: {
    en: {
      name: "NAMASTE",
      description:
        "Elegant, spirited, and exquisitely dynamic. ‘NAMASTE’ is a high-performance Imp 55 catamaran designed for up to 45 guests. Easily identifiable by its distinctive green registration letters '5751 00430 NAMASTE' on the starboard bow and its iconic sandy beige deck canvas sunshade. Designed for true ocean sailing, it offers stylish wood trim decks, a shaded cockpit lounge, and 1 air-conditioning unit in the main cabin saloon.",
      partySuitability:
        "Great for elegant social gatherings, sunsets, and premium family getaways",
      highlights: [
        "Custom-fitted sandy beige awning canopy providing generous main-deck sun relief",
        "Official starboard bow lettering: '5751 00430 NAMASTE' for clear marine identification",
        "Sleek aerodynamic aerodynamic-hull lines with impressive cruising stability in any tide",
        "Sophisticated open-air deck area perfect for private sunset dining & ocean photography",
        "1 dedicated Air Conditioning unit in the saloon area with premium Bluetooth music surroundings",
        "1 cooler box to keep your drinks perfectly ice-cold",
        "Equipped with standard marine First Aid Kit",
        "Equipped with tablets for sea sickness (provided free of charge)",
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
      ],
    },
    ru: {
      name: "NAMASTE",
      description:
        "Элегантный, энергичный и изысканно динамичный катамаран 'NAMASTE' — это высокопроизводительный Imp 55, спроектированный для размещения до 45 гостей. Его легко узнать по характерным зеленым регистрационным буквам '5751 00430 NAMASTE' на правом борту и культовому песчано-бежевому тенту на палубе. Созданный для настоящего океанского плавания, он предлагает стильные деревянные палубы, затененный салон в кокпите и 1 кондиционер в салоне главной каюты.",
      partySuitability:
        "Отлично подходит для элегантных светских встреч, закатов и семейного отдыха премиум-класса",
      highlights: [
        "Индивидуальный песчано-бежевый тент, обеспечивающий надежную защиту от солнца на главной палубе",
        "Официальная надпись на правом борту: '5751 00430 NAMASTE' для четкой морской идентификации",
        "Гладкие аэродинамические линии корпуса с впечатляющей остойчивостью на любом курсе",
        "Изысканная открытая палуба, идеально подходящая для частного ужина на закате и морской фотографии",
        "1 специальный кондиционер в зоне салона с премиальным Bluetooth-звуком",
        "1 изотермический ящик для сохранения напитков идеально холодными",
        "Оснащен стандартной морской аптечкой первой помощи",
        "Снабжен таблетками от укачивания (предоставляются бесплатно)",
      ],
      amenities: [
        "1 кондиционер (только в салоне)",
        "Снаряжение для сноркелинга",
        "Музыкальная система премиум-класса с Bluetooth",
        "Прохладительные напитки на борту",
        "SUP-доска для катания стоя",
        "Лестница для купания с двух сторон и пляжные полотенца",
        "Океанское каноэ",
        "1 изотермический ящик для холодных напитков",
        "Бортовая аптечка первой помощи",
        "Таблетки от укачивания (бесплатно)",
      ],
    },
    hi: {
      name: "NAMASTE",
      description:
        "सुरुचिपूर्ण, उत्साही और उत्कृष्ट रूप से गतिशील। 'NAMASTE' एक उच्च प्रदर्शन वाला Imp 55 कैटामारन है जिसे 45 मेहमानों के लिए डिज़ाइन किया गया है। इसे स्टारबोर्ड धनुष पर इसके विशिष्ट हरे रंग के पंजीकरण अक्षरों '5751 00430 NAMASTE' और इसके प्रतिष्ठित रेतीले बेज डेक कैनवास सनशेड द्वारा आसानी से पहचाना जा सकता है। वास्तविक महासागर नौकायन के लिए डिज़ाइन किया गया, यह स्टाइलिश लकड़ी के ट्रिम डेक, एक छायांकित कॉकपिट लाउंज और मुख्य केबिन सैलून में 1 एयर-कंडीशनिंग इकाई प्रदान करता है।",
      partySuitability:
        "सुरुचिपूर्ण सामाजिक समारोहों, सूर्यास्त और प्रीमियम पारिवारिक गेटवे के लिए बढ़िया",
      highlights: [
        "कस्टम-फिट रेतीле बेज रंग का शामियाना शामियाना मुख्य डेक को सूरज की रोशनी से बचाता है",
        "स्टारबोर्ड धनुष पर आधिकारिक पंजीकरण ब्रांड: '5751 00430 NAMASTE' समुद्री पहचान सुनिश्चित करने के लिए",
        "बिना किसी बाधा के गति और स्थिरता सुनिश्चित करने वाली उन्नत वायुगतिकीय पतवार",
        "निजी सूर्यास्त भोजन और समुद्री फोटोग्राफी के लिए परिष्कृत खुले डेक",
        "प्रीमियम ब्लूटूथ संगीत प्लेबैक के साथ सैलून क्षेत्र में 1 समर्पित एयर कंडीशनिंग यूनिट",
        "आपके पेय पदार्थों को पूरी तरह से ठंडा रखने के लिए 1 कूलर बॉक्स",
        "मानक समुद्री प्राथमिक चिकित्सा किट से सुसज्जित",
        "समुद्री बीमारी के लिए गोलियों से सुसज्जित (निःशुल्क प्रदान किया जाता है)",
      ],
      amenities: [
        "1 एयर कंडीशनिंग यूनिट (केवल सैलून)",
        "स्नॉर्कलिंग उपकरण",
        "ब्लूटूथ के साथ प्रीमियम संगीत प्रणाली",
        "ऑनबोर्ड जलपान",
        "स्टैंड-अप पैडलबोर्ड (SUP)",
        "दोनों तरफ तैरने की सीढ़ी और समुद्र तट के तौलिये",
        "महासागर डोंगी (Canoe)",
        "ठंडे पेय पदार्थों के लिए 1 कूलर बॉक्स",
        "ऑनबोर्ड प्राथमिक चिकित्सा किट",
        "समुद्री बीमारी की गोलियाँ (निःशुल्क)",
      ],
    },
    zh: {
      name: "NAMASTE",
      description:
        "优雅、充满活力且精致。‘NAMASTE’ 是一款高性能 Imp 55 双体船，专为多达 45 位宾客设计。其右舷船头独特的绿色注册字样‘5751 00430 NAMASTE’及标致性的沙滩米色甲板遮阳蓬极具辨识度。专为真正的海洋航行而设计，配备高档木饰甲板、遮阳驾驶舱沙龙，以及主沙龙内的 1 台空调设备。",
      partySuitability: "非常适合高雅的社交聚会、晚霞日落巡航及高端家庭度假",
      highlights: [
        "量身定制的沙滩米色遮阳蓬，为整个主甲板提供极佳的防晒保护",
        "右舷船头印有官方注册字样 '5751 00430 NAMASTE'，具备清晰的航海标识度",
        "流线型空气动力学双体船身，在任何潮汐下皆能保持极佳的航行稳定性",
        "精致奢华的露天甲板区，是举办私人日落晚宴和进行海洋摄影的绝佳场所",
        "主沙龙大厅专设 1 台空调设备，配有高品质蓝牙立体环绕音响",
        "配有 1 台户外专业冰箱，可完美冰镇您的专属饮品",
        "船上标配国际航海标准专业急救箱",
        "完全免费备有进口防晕船专业口服药品",
      ],
      amenities: [
        "1 台空调设备（仅限主沙龙区）",
        "专业级全套浮潜呼吸面罩",
        "含蓝牙功能的至尊车载音响系统",
        "专属船上茶点及软饮",
        "站立式桨板（SUP）",
        "双侧游泳梯及高端海滩沙滩巾",
        "深海双人独木舟",
        "1 台专业户外饮料冷冻箱",
        "船用专业航海急救箱",
        "安全防晕船药口服药片（完全免费）",
      ],
    },
    th: {
      name: "NAMASTE",
      description:
        "หรูหรา เปี่ยมล้นด้วยพลัง และคล่องตัวอย่างประณีต ‘NAMASTE’ เป็นเรือแคทามารันรุ่น Imp 55 ที่มีประสิทธิภาพสูง ออกแบบมาเพื่อรองรับแขกได้มากถึง 45 ท่าน โดดเด่นด้วยตัวอักษรจดทะเบียนสีเขียวอันเป็นเอกลักษณ์ '5751 00430 NAMASTE' ที่บริเวณหัวเรือกราบขวา พร้อมผ้าใบกันแดดสีเบจทรายสุดคลาสสิก ออกแบบมาสำหรับการล่องเรือในมหาสมุทรอย่างแท้จริง มีดาดฟ้าเรือบุไม้สุดหรู ห้องนั่งเล่นกึ่งกลางแจ้งที่มีร่มเงา และติดตั้งเครื่องปรับอากาศ 1 เครื่องในโถงนั่งเล่นหลัก",
      partySuitability:
        "ดีเยี่ยมสำหรับการจัดกิจกรรมสังสรรค์ที่หรูหรา ชมพระอาทิตย์ตกดิน และทริปพักผ่อนของครอบครัวระดับพรีเมียม",
      highlights: [
        "ผ้าใบกันแดดสีเบจทรายสั่งทำพิเศษ ให้ร่มเงาที่กว้างขวางสำหรับดาดฟ้าเรือหลัก",
        "ตัวอักษรทางการบนกราบขวาเรือ: '5751 00430 NAMASTE' เพื่อการระบุเอกลักษณ์ทางทะเลที่ชัดเจน",
        "ตัวเรือดีไซน์แอโรไดนามิกเพรียวบาง ให้ความเสถียรในการล่องเรือที่น่าทึ่งในทุกสภาวะคลื่นลม",
        "พื้นที่ดาดฟ้าแบบเปิดโล่งแสนหรูหรา เหมาะสำหรับการรับประทานอาหารเย็นส่วนตัวชมพระอาทิตย์ตกดินและการถ่ายภาพระดับมืออาชีพ",
        "เครื่องปรับอากาศเฉพาะ 1 เครื่องในโถงกลางเรือพร้อมระบบลำโพง Bluetooth ระดับพรีเมียม",
        "ถังแช่เย็น 1 ใบเพื่อรักษาความเย็นของเครื่องดื่มให้เย็นสดชื่นตลอดเวลา",
        "มีอุปกรณ์ปฐมพยาบาลทางทะเลมาตรฐานระดับสากลครบถ้วน",
        "มียาแก้เมาคลื่นเตรียมพร้อมบริการให้ฟรีโดยไม่คิดค่าใช้จ่าย",
      ],
      amenities: [
        "เครื่องปรับอากาศ 1 เครื่อง (เฉพาะโถงกลางเรือกลาง)",
        "อุปกรณ์ดำน้ำตื้น",
        "ระบบเครื่องเสียงพรีเมียมพร้อมการเชื่อมต่อ Bluetooth",
        "เครื่องดื่มของว่างบริการบนเรือ",
        "บอร์ดพายแบบยืน (SUP)",
        "บันไดขึ้นลงเล่นน้ำทั้งสองด้านเรือและผ้าเช็ดตัวชาดหาด",
        "เรือแคนูทางทะเล",
        "ถังแช่เครื่องดื่มเย็น 1 ถัง",
        "กล่องปฐมพยาบาลปฐมพยาบาลบนเรือ",
        "ยาแก้เมารถหน้ามืดและเมาคลื่น (บริการฟรี)",
      ],
    },
  },
  "the-one": {
    en: {
      name: "THE ONE",
      description:
        "Crafted by world-renowned Robertson & Caine, ‘THE ONE’ is a highly sought-after Leopard 47. Boasting a unique forward cockpit, direct access from the saloon, and an immersive sunbed lounge on the coachroof.",
      partySuitability:
        "Ideal for cozy families, couples, and intimate friend excursions",
      highlights: [
        "Signature forward-facing social cockpit dining table",
        "Leopard luxury styling with natural varnished timber paneling",
        "Upper-deck sunbed platform adjacent to helm command",
        "Atmospheric underwater ocean lighting",
        "1 cooler box to keep your drinks perfectly ice-cold",
        "Equipped with standard marine First Aid Kit",
        "Equipped with tablets for sea sickness (provided free of charge)",
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
      ],
    },
    ru: {
      name: "THE ONE",
      description:
        "Созданный всемирно известной верфью Robertson & Caine, катамаран 'THE ONE' — это невероятно популярный Leopard 47. Он может похвастаться уникальным передним кокпитом с прямым выходом из салона, а также уютной зоной для принятия солнечных ванн на крыше рубки.",
      partySuitability:
        "Идеально подходит для уютных семей, пар и камерных путешествий в кругу близких друзей",
      highlights: [
        "Фирменный обеденный стол в передней части палубы для приятного общения",
        "Роскошный стиль Leopard с отделкой из натурального лакированного дерева",
        "Верхняя палуба-солярий рядом с постом управления капитана",
        "Атмосферная подводная светодиодная подсветка океана",
        "1 изотермический ящик для хранения ваших напитков идеально холодными",
        "Оснащен стандартной морской аптечкой первой помощи",
        "Снабжен бесплатными таблетками от укачивания",
      ],
      amenities: [
        "Снаряжение для сноркелинга",
        "Современная музыкальная система",
        "Прохладительные и безалкогольные напитки на борту",
        "1 изотермический ящик для холодных напитков",
        "Душ с пресной водой на палубе",
        "Полный комплект спасательных жилетов повышенной безопасности",
        "Океанское каноэ",
        "Бортовая аптечка первой помощи",
        "Таблетки от укачивания (бесплатно)",
      ],
    },
    hi: {
      name: "THE ONE",
      description:
        "विश्व-प्रसिद्ध रॉबर्टसन एंड केन (Robertson & Caine) द्वारा निर्मित, 'THE ONE' एक अत्यधिक लोकप्रिय लेपर्ड 47 (Leopard 47) कटमरैन है। इसमें सैलून से सीधे प्रवेश के साथ एक अनूठा फॉरवर्ड कॉकपิต और कोचरूफ पर सनबेड लाउंज की सुविधा शामिल है।",
      partySuitability:
        "आरामदायक परिवारों, जोड़ों और करीबी दोस्तों की यात्रा के लिए आदर्श",
      highlights: [
        "हस्ताक्षर आगे की ओर मुख वाला सोशल कॉकपิต डाइनिंग टेबल",
        "लेपर्ड लक्जरी स्टाइलिंग के साथ प्राकृतिक वार्निशयुक्त लकड़ी के पैनलिंग",
        "हेल्म कमांड के निकट अपर-डेक सनबेड प्लेटफॉर्म",
        "वायुमंडलीय पानी के नीचे महासागर प्रकाश",
        "आपके पेय पदार्थों को पूरी तरह से ठंडा रखने के लिए 1 कूलर बॉक्स",
        "मानक समुद्री प्राथमिक चिकित्सा किट से सुसज्जित",
        "समुद्र की बीमारी की गोलियों से सुसज्जित (निःशुल्क प्रदान की जाती है)",
      ],
      amenities: [
        "स्नॉर्कलिंग उपकरण",
        "आधुनिक संगीत प्रणाली",
        "ऑनबोर्ड अल्पाहार और शीतल पेय",
        "ठंडे पेय पदार्थों के लिए 1 कूलर बॉक्स",
        "ताजे पानी डेक शॉवर",
        "पूरी तरह से लोड सुरक्षा निहित (सुरक्षा जैकेट)",
        "महासागर डोंगी (Canoe)",
        "ऑनबोर्ड प्राथमिक चिकित्सा किट",
        "समुद्र की बीमारी की गोलियाँ (निःशुल्क)",
      ],
    },
    zh: {
      name: "THE ONE",
      description:
        "由举世闻名的罗伯逊与凯恩（Robertson & Caine）精心打造，“THE ONE”是备受追捧的莱帕德 47（Leopard 47）双体游艇。它拥有独特的上前部开放式甲板沙龙区，可直接自沙龙舱穿行进入，并在驾驶台顶盖配置了极具沉浸感的舒适遮阳卧榻。",
      partySuitability:
        "温馨家庭度假、浪漫情侣出游及亲密密友私密巡航的完美代表之作",
      highlights: [
        "招牌式前向社交甲板用餐区餐桌",
        "独特的原天然光漆木镶板莱帕德级奢华装潢",
        "紧邻上层舵手指挥台的大型日光浴卧榻软垫",
        "迷人的五彩气泡水下LED海洋氛围照明系统",
        "1个带充足冰块的大型保温箱以保证饮品冰爽",
        "随备标准救生箱和常用海洋外用医疗用品",
        "免费提供高品质纯天然草本晕船药片",
      ],
      amenities: [
        "高档浮潜呼吸管和安全面罩",
        "现代游艇顶级音响及多功能乐曲系统",
        "无限量冰镇软饮料与纯净饮用水服务",
        "1个清凉冰镇软饮特制保温箱",
        "甲板室外温和淡水淋浴花洒",
        "全套符合国际最高海事标准的专业救生衣",
        "海事专用环保坚固独木舟",
        "随船常备专业急救药箱配置",
        "高浓度晕车晕船片（完全免费）",
      ],
    },
    th: {
      name: "THE ONE",
      description:
        "รังสรรค์โดยอู่เรือเลื่องชื่อระดับโลก Robertson & Caine, ‘THE ONE’ เป็นเรือสไตล์ Leopard 47 ที่ได้รับความนิยมและตามหาอย่างล้นหลาม โดดเด่นด้วยพื้นที่ส่วนโถงหน้าเรือขนาดใหญ่ที่เป็นเอกลักษณ์ ทางเชื่อมต่อจากห้องนั่งเล่นหลักโดยตรง และพื้นที่นอนอาบแดดสุดชิลด้านบนหลังคาเรือ",
      partySuitability:
        "เหมาะอย่างยิ่งสำหรับครอบครัวที่แสนอบอุ่น คู่รัก และการท่องเที่ยวกับกลุ่มเพื่อนสนิทในบรรยากาศเป็นกันเอง",
      highlights: [
        "โต๊ะรับประทานอาหารอันเป็นเอกลักษณ์ในพื้นที่ห้องควบคุมหน้าเรือตรงเตียงนอน",
        "ดีไซน์การตกแต่งสุดหรูสไตล์ Leopard ด้วยไม้เคลือบเงาธรรมชาติพรีเมียม",
        "ดาดฟ้าชั้นบนสุดชิลพร้อมเบาะนอนรับแสงแดดดาดฟ้าด้านบน ใกล้เคียงกับพื้นที่บังคับการเลี้ยวเรือ",
        "ไฟตกแต่งสีสันสวยงามสร้างบรรยากาศใต้น้ำรอบตัวเรือยามค่ำคืน",
        "ถังแช่เย็น 1 ใบเพื่อรักษาความเย็นของเครื่องดื่มให้เย็นสดชื่นตลอดเวลา",
        "มีอุปกรณ์ปฐมพยาบาลทางทะเลมาตรฐานระดับสากลครบถ้วน",
        "มียาแก้เมาคลื่นเตรียมพร้อมบริการให้ฟรีโดยไม่คิดค่าใช้จ่าย",
      ],
      amenities: [
        "อุปกรณ์ดำน้ำตื้น",
        "ระบบเครื่องเล่นเพลงและลำโพงรอบทิศทางดีไซน์ทันสมัย",
        "เครื่องดื่มอัดลมและน้ำอัดลมบริการฟรีตลอดทริป",
        "ถังแช่เครื่องดื่มเย็น 1 ถัง",
        "ฝักบัวอาบน้ำล้างตัวน้ำจืดกลางดาดฟ้าเรือ",
        "เสื้อชูชีพเพื่อความปลอดภัยอย่างครบถ้วนตามหลักสากล",
        "เรือแคนูทางทะเล",
        "กล่องปฐมพยาบาลปฐมพยาบาลบนเรือ",
        "ยาแก้เมารถหน้ามืดและเมาคลื่น (บริการฟรี)",
      ],
    },
  },
};

const AMENITY_EXPAND_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  { showMore: string; showLess: string }
> = {
  en: { showMore: "Show All Amenities & Toys", showLess: "Show Less" },
  ru: { showMore: "Показать все удобства и игрушки", showLess: "Свернуть" },
  hi: { showMore: "सभी सुविधाएं और खिलौने दिखाएं", showLess: "कम दिखाएं" },
  zh: { showMore: "显示所有设施与玩具", showLess: "收起" },
  th: {
    showMore: "แสดงสิ่งอำนวยความสะดวก & ของเล่นทั้งหมด",
    showLess: "แสดงน้อยลง",
  },
};

const HIGHLIGHTS_EXPAND_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  { showMore: string; showLess: string }
> = {
  en: { showMore: "Show All Highlights", showLess: "Show Less" },
  ru: { showMore: "Показать все особенности", showLess: "Свернуть" },
  hi: { showMore: "सभी मुख्य विशेषताएं दिखाएं", showLess: "कम दिखाएं" },
  zh: { showMore: "显示所有亮点", showLess: "收起" },
  th: { showMore: "แสดงจุดเด่นทั้งหมด", showLess: "แสดงน้อยลง" },
};

const SPECS_EXPAND_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  { showMore: string; showLess: string }
> = {
  en: { showMore: "Show All Specifications", showLess: "Show Less" },
  ru: {
    showMore: "Показать все технические характеристики",
    showLess: "Свернуть",
  },
  hi: { showMore: "सभी तकनीकी विशेषताएं दिखाएं", showLess: "कम दिखाएं" },
  zh: { showMore: "显示所有技术规格", showLess: "收起" },
  th: { showMore: "แสดงข้อมูลทางเทคนิคทั้งหมด", showLess: "แสดงน้อยลง" },
};

const READ_MORE_ABOUT_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  string
> = {
  en: "READ MORE ABOUT",
  ru: "ПОДРОБНЕЕ О",
  hi: "के बारे में और पढ़ें",
  zh: "了解更多关于",
  th: "อ่านเพิ่มเติมเกี่ยวกับ",
};

const CLOSE_DETAILS_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  string
> = {
  en: "CLOSE DETAILS",
  ru: "СКРЫТЬ ДЕТАЛИ",
  hi: "विवरण बंद करें",
  zh: "关闭详情",
  th: "ปิดรายละเอียด",
};

const LIVE_CALENDAR_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  string
> = {
  en: "Live Availability Calendar",
  ru: "Онлайн-календарь занятости",
  hi: "लाइव उपलब्धता कैलेंडर",
  zh: "查看实时空档日历",
  th: "ดูปฏิทินสถานะว่างล่าสุด",
};

const SPEC_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  {
    specsTitle: string;
    engines: string;
    generator: string;
    inverter: string;
    winches: string;
    aircon: string;
    fishfinder: string;
    fullAC: string;
    saloonACOnly: string;
  }
> = {
  en: {
    specsTitle: "Technical Specifications",
    engines: "Engines:",
    generator: "Generator:",
    inverter: "Inverter:",
    winches: "Winches:",
    aircon: "AirCon:",
    fishfinder: "Fishfinder:",
    fullAC: "⚡ FULL CABIN & SALOON AC",
    saloonACOnly: "💨 SALOON AC ONLY",
  },
  ru: {
    specsTitle: "Технические характеристики",
    engines: "Двигатели:",
    generator: "Генератор:",
    inverter: "Инвертор:",
    winches: "Лебедки:",
    aircon: "Кондиционер:",
    fishfinder: "Эхолот:",
    fullAC: "⚡ КОНДИЦИОНЕР В КАЮТАХ И САЛОНЕ",
    saloonACOnly: "💨 КОНДИЦИОНЕР ТОЛЬКО В САЛОНЕ",
  },
  hi: {
    specsTitle: "तकनीकी विनिर्देश",
    engines: "इंजन:",
    generator: "जेनरेटर:",
    inverter: "इन्वर्टर:",
    winches: "विंचेस:",
    aircon: "एसी सिस्टम:",
    fishfinder: "फिशफाइंडर:",
    fullAC: "⚡ पूर्ण केबिन और सैलून एसी",
    saloonACOnly: "💨 केवल सैलून एसी",
  },
  zh: {
    specsTitle: "技术参数与船载系统",
    engines: "动力引擎:",
    generator: "发电机组:",
    inverter: "逆变设备:",
    winches: "电动绞盘:",
    aircon: "空调系统:",
    fishfinder: "探鱼测深仪:",
    fullAC: "⚡ 全客舱及沙龙舱大功率空调",
    saloonACOnly: "💨 仅主沙龙舱空调配置",
  },
  th: {
    specsTitle: "ข้อมูลเฉพาะทางเทคนิค",
    engines: "เครื่องยนต์:",
    generator: "เครื่องปั่นไฟ:",
    inverter: "อินเวอร์เตอร์:",
    winches: "วินช์กว้านสมอ:",
    aircon: "ระบบแอร์:",
    fishfinder: "เครื่องหาปลา:",
    fullAC: "⚡ เปิดใช้งานแอร์ห้องนอน & ห้องโถง",
    saloonACOnly: "💨 เปิดใช้งานแอร์เฉพาะห้องโถง",
  },
};

const EXPAND_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  { readMore: string; readLess: string }
> = {
  en: { readMore: "Read More", readLess: "Read Less" },
  ru: { readMore: "Читать далее", readLess: "Свернуть" },
  hi: { readMore: "अधिक पढ़ें", readLess: "कम पढ़ें" },
  zh: { readMore: "阅读更多", readLess: "收起" },
  th: { readMore: "อ่านเพิ่มเติม", readLess: "ย่อข้อมูล" },
};

const INTEGRATED_EXPAND_TRANSLATIONS: Record<
  "en" | "ru" | "hi" | "zh" | "th",
  { title: string; showAll: string; hideAll: string }
> = {
  en: {
    title: "Amenities, Features & Specs",
    showAll: "Show Amenities, Features & Specs",
    hideAll: "Hide Amenities, Features & Specs",
  },
  ru: {
    title: "Удобства, особенности и хар-ки",
    showAll: "Все удобства, игрушки и характеристики",
    hideAll: "Скрыть подробности",
  },
  hi: {
    title: "सुविधाएं, फीचर्स और विशेषताएं",
    showAll: "सुविधाएं, वाटर टॉयज और विशेषताएं दिखाएं",
    hideAll: "विशेषताएं और विवरण छिपाएं",
  },
  zh: {
    title: "船载设施、特色及技术规格",
    showAll: "显示设施、特色与技术参数",
    hideAll: "收起设施、特色与技术参数",
  },
  th: {
    title: "สิ่งอำนวยความสะดวก ไฮไลท์ & ข้อมูลจำเพาะ",
    showAll: "แสดงสิ่งอำนวยความสะดวก ของเล่น & ข้อมูลจำเพาะ",
    hideAll: "ซ่อนสิ่งอำนวยความสะดวก ของเล่น & ข้อมูลจำเพาะ",
  },
};

interface VesselCardProps {
  key?: string;
  vessel: Catamaran;
  isSelected: boolean;
  onSelect: () => void;
  onBookNow: () => void;
  showCalendar?: boolean;
}

export default function VesselCard({
  vessel,
  isSelected,
  onSelect,
  onBookNow,
  showCalendar = false,
}: VesselCardProps) {
  const { t, language: globalLang } = useLanguage();
  const { formatPrice } = useCurrency();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [cardLang, setCardLang] = useState<"en" | "ru" | "hi" | "zh" | "th">(
    "en",
  );
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tiktokCopied, setTiktokCopied] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [useContain, setUseContain] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    if (globalLang && ["en", "ru", "hi", "zh", "th"].includes(globalLang)) {
      setCardLang(globalLang as any);
    } else {
      setCardLang("en");
    }
  }, [globalLang]);

  const images =
    vessel.images && vessel.images.length > 0 ? vessel.images : [vessel.image];

  const handlePrev = (e?: any) => {
    e?.stopPropagation?.();
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e?: any) => {
    e?.stopPropagation?.();
    setCurrentIdx((prev) => (prev + 1) % images.length);
  };

  const selectDot = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentIdx(idx);
  };

  // Check if we have translated description, name, suitability and highlights
  const activeTx = VESSEL_TRANSLATIONS[vessel.id]?.[cardLang];
  const st = SPEC_TRANSLATIONS[cardLang] || SPEC_TRANSLATIONS["en"];

  const translatedName = activeTx
    ? activeTx.name
    : t(`vessels.${vessel.id}.name`) !== `vessels.${vessel.id}.name`
      ? t(`vessels.${vessel.id}.name`)
      : vessel.name;
  const translatedDescription = activeTx
    ? activeTx.description
    : t(`vessels.${vessel.id}.desc`) !== `vessels.${vessel.id}.desc`
      ? t(`vessels.${vessel.id}.desc`)
      : vessel.description;
  const translatedSuitability = activeTx
    ? activeTx.partySuitability
    : vessel.partySuitability
      ? t(`vessels.${vessel.id}.suitability`) !==
        `vessels.${vessel.id}.suitability`
        ? t(`vessels.${vessel.id}.suitability`)
        : vessel.partySuitability
      : null;

  const translatedHighlights = activeTx
    ? activeTx.highlights
    : vessel.highlights.map((highlight, index) => {
        const key = `vessels.${vessel.id}.highlights.${index}`;
        return t(key) !== key ? t(key) : highlight;
      });

  const translatedAmenities = activeTx
    ? activeTx.amenities
    : vessel.amenities.map((amenity, index) => {
        const key = `vessels.${vessel.id}.amenities.${index}`;
        return t(key) !== key ? t(key) : amenity;
      });

  const specsItems = [
    { label: st.engines, value: vessel.specs.engines },
    { label: st.generator, value: vessel.specs.generator },
    { label: st.inverter, value: vessel.specs.inverter },
    { label: st.winches, value: vessel.specs.winch },
    { label: st.aircon, value: vessel.specs.airconSystem },
    { label: st.fishfinder, value: vessel.specs.fishfinder },
  ].filter((item) => item.value);

  return (
    <motion.div
      id={`vessel-card-${vessel.id}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex flex-col overflow-hidden rounded-xs border transition-all duration-350 ${
        isSelected
          ? "border-[#0F172A] bg-white ring-1 ring-[#0F172A]/10 shadow-lg"
          : "border-[#0F172A]/10 bg-white/80 hover:border-[#0F172A]/30 hover:shadow-md"
      }`}
    >
      {/* Editorial High-end Badges */}
      <div className="absolute top-4 left-4 z-30 flex gap-2 pointer-events-none">
        <span className="rounded-xs bg-[#0F172A]/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-xs font-sans">
          {vessel.model}
        </span>
        <span className="rounded-xs bg-[#FAF9F6]/95 border border-[#0F172A]/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#0F172A] font-sans">
          {vessel.length}
        </span>
      </div>

      {/* Multi-photo Slideshow indicator badge & Aspect Toggle */}
      <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
        {images.length > 1 && (
          <div className="flex items-center gap-1.5 rounded-xs bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs font-mono pointer-events-none shadow-sm">
            <Images className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {currentIdx + 1} / {images.length}
            </span>
          </div>
        )}
        <button
          id={`toggle-aspect-${vessel.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setUseContain(!useContain);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-emerald-950/90 text-white text-[9px] uppercase tracking-wider font-sans font-bold hover:bg-emerald-900 shadow-md backdrop-blur-xs border border-emerald-500/30 transition-all cursor-pointer pointer-events-auto active:scale-95"
          title={useContain ? "Switch to crop fill view" : "Switch to show whole yacht view"}
        >
          {useContain ? "🔍 Fill Card" : "⛵ Whole Yacht"}
        </button>
      </div>

      {/* Image Container with Editorial Zoom effect & Carousel Controls */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-zoom-in group/image"
        title="View Full-Screen High-Resolution Photos"
      >
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <ImageWithFallback
              key={currentIdx}
              src={images[currentIdx]}
              onClick={() => setIsLightboxOpen(true)}
              alt={`${translatedName} - Slide ${currentIdx + 1}`}
              referrerPolicy="strict-origin-when-cross-origin"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className={`absolute inset-0 h-full w-full select-none transition-all duration-300 ${
                useContain ? "object-contain p-2" : "object-cover"
              } ${images.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
              draggable={false}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset }) => {
                if (images.length <= 1) return;
                if (offset.x < -40) {
                  handleNext(e);
                } else if (offset.x > 40) {
                  handlePrev(e);
                }
              }}
            />
          </AnimatePresence>
        </div>

        {/* Dynamic Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent z-10 pointer-events-none" />

        {/* Click to expand hover zoom visual feedback */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity z-15 flex items-center justify-center pointer-events-none">
          <span className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0F172A]/90 backdrop-blur-xs rounded-xs text-white text-[10px] font-sans font-bold uppercase tracking-widest shadow-xl border border-white/10 scale-95 group-hover/image:scale-100 transition-all duration-300">
            <Maximize2 className="h-3.5 w-3.5 text-amber-400" /> View Large
            Photos
          </span>
        </div>

        {/* Carousel Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              id={`carousel-btn-prev-${vessel.id}`}
              onClick={handlePrev}
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/75 hover:bg-white text-[#0F172A] flex items-center justify-center shadow-md hover:shadow-lg transition-all focus:outline-hidden opacity-90 sm:opacity-0 sm:group-hover:opacity-100 duration-200 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              id={`carousel-btn-next-${vessel.id}`}
              onClick={handleNext}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/75 hover:bg-white text-[#0F172A] flex items-center justify-center shadow-md hover:shadow-lg transition-all focus:outline-hidden opacity-90 sm:opacity-0 sm:group-hover:opacity-100 duration-200 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>

            {/* Indicator Dots overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-25 flex gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-xs">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  id={`carousel-dot-${vessel.id}-${idx}`}
                  onClick={(e) => selectDot(e, idx)}
                  type="button"
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIdx
                      ? "bg-white w-3.5"
                      : "bg-white/40 hover:bg-white/80 w-1.5"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <p className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/90 uppercase">
            {t("vessel.yacht")}
          </p>
          <h3 className="text-3xl font-serif italic text-white font-normal tracking-wide">
            {translatedName}
          </h3>
        </div>
      </div>

      {/* Vessel Details & Specs */}
      <div className="flex flex-1 flex-col p-6">
        {translatedDescription.length > 180 ? (
          <div className="mb-6">
            <div
              className={`relative overflow-hidden transition-all duration-300 ease-in-out ${isDescExpanded ? "max-h-[500px]" : "max-h-16"}`}
            >
              <p className="text-xs leading-relaxed text-slate-600 font-sans">
                {translatedDescription}
              </p>
              {!isDescExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            <button
              type="button"
              id={`vessel-desc-expand-${vessel.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDescExpanded(!isDescExpanded);
              }}
              className="mt-2 text-[10px] font-bold text-[#0F172A] hover:text-slate-600 uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isDescExpanded ? (
                <>
                  {EXPAND_TRANSLATIONS[cardLang]?.readLess || "Read Less"}
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  {EXPAND_TRANSLATIONS[cardLang]?.readMore || "Read More"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-slate-600 mb-6 font-sans">
            {translatedDescription}
          </p>
        )}

        {/* Party Suitability Highlight */}
        {translatedSuitability && (
          <div className="mb-6 p-3 rounded-xs bg-emerald-50/70 border border-emerald-900/10 text-emerald-950 flex gap-2 items-center">
            <Award className="h-4 w-4 text-emerald-700 shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-emerald-900 font-bold font-sans">
                {t("vessel.suitability")}
              </p>
              <p className="text-[11px] font-medium font-sans leading-tight mt-0.5 text-emerald-850">
                {translatedSuitability}
              </p>
            </div>
          </div>
        )}

        {/* Specs Clean Grid (Editorial Minimal layout) */}
        <div className="grid grid-cols-2 gap-px bg-[#0F172A]/10 border-y border-[#0F172A]/10 py-4 mb-6">
          <div className="flex items-center gap-2.5 bg-white py-1 pr-2">
            <Users className="h-3.5 w-3.5 text-[#0F172A]/60 shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#0F172A]/50 font-sans">
                {t("vessel.capacityLabel")}
              </p>
              <p className="text-xs font-semibold text-[#0F172A] font-sans">
                {t("vessel.upTo")} {vessel.capacity} {t("vessel.guests")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white py-1 px-2">
            <Ship className="h-3.5 w-3.5 text-[#0F172A]/60 shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#0F172A]/50 font-sans">
                {t("vessel.cabinsLabel")}
              </p>
              <p className="text-xs font-semibold text-[#0F172A] font-sans">
                {vessel.cabins} {t("vessel.cabins")} / {vessel.bathrooms}{" "}
                {t("vessel.baths")}
                <span className="block text-[8.5px] font-mono font-medium text-slate-500 mt-0.5 leading-none">
                  {vessel.id === "the-best" && st.fullAC}
                  {vessel.id === "namaste" && st.saloonACOnly}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white py-1 pr-2 mt-2">
            <Compass className="h-3.5 w-3.5 text-[#0F172A]/60 shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#0F172A]/50 font-sans">
                {t("vessel.speedLabel")}
              </p>
              <p className="text-xs font-semibold text-[#0F172A] font-sans">
                {vessel.specs.speed}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white py-1 px-2 mt-2">
            <Settings className="h-3.5 w-3.5 text-[#0F172A]/60 shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#0F172A]/50 font-sans">
                {t("vessel.crewLabel")}
              </p>
              <p className="text-xs font-semibold text-[#0F172A] font-sans">
                {vessel.specs.crew} {t("vessel.crew")}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Button for More Details to make the default card smaller */}
        <div className="mb-4">
          <button
            type="button"
            id={`vessel-read-more-btn-${vessel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsExpanded(!isDetailsExpanded);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors shadow-xs active:scale-[0.99] duration-150"
          >
            <span>
              {isDetailsExpanded
                ? `${CLOSE_DETAILS_TRANSLATIONS[cardLang] || "CLOSE DETAILS"}`
                : `${READ_MORE_ABOUT_TRANSLATIONS[cardLang] || "READ MORE ABOUT"} ${translatedName}`}
            </span>
            {isDetailsExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {isDetailsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-6 pt-4 border-t border-[#0F172A]/10 my-4">
                {/* Onboard Amenities Option Grid */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#0F172A] uppercase font-sans mb-3 border-b border-[#0F172A]/10 pb-1">
                    {t("vessel.amenities")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {translatedAmenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-sky-50/50 hover:bg-sky-50 text-slate-800 px-2.5 py-1 rounded-sm border border-sky-900/10 font-sans font-medium hover:border-sky-900/20 transition-all"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bullet Highlights */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#0F172A] uppercase font-sans mb-3 border-b border-[#0F172A]/10 pb-1">
                    {t("vessel.features")}
                  </p>
                  <div className="space-y-2">
                    {translatedHighlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 text-emerald-600 font-bold shrink-0">
                          <Check className="h-3 w-3" />
                        </span>
                        <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
                          {highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Ship Specifications */}
                {vessel.specs.engines && specsItems.length > 0 && (
                  <div className="p-4 rounded bg-[#FAF9F6] border border-[#0F172A]/10 text-slate-900">
                    <p className="text-[10.5px] font-bold tracking-[0.15em] text-[#0F172A] uppercase font-sans mb-1.5 border-[#0F172A]/10 pb-1 flex items-center gap-1.5">
                      <span>⚙️</span> {st.specsTitle}
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-xs font-sans">
                      {specsItems.map((item, idx, arr) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-1 ${idx < arr.length - 1 ? "pb-1 border-b border-[#0F172A]/5" : ""}`}
                        >
                          <span className="font-semibold text-slate-500 w-24 shrink-0 [font-size:10px] tracking-wide uppercase">
                            {item.label}
                          </span>
                          <span className="text-[#0F172A] [font-size:11px] font-medium leading-snug">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer CTA (Cleaned, no pricing info as requested) */}
        <div className="mt-auto pt-5 border-t border-[#0F172A]/10 space-y-3">
          {showCalendar &&
            ["the-best", "namaste", "the-one"].includes(vessel.id) && (
              <div className="bg-slate-100/80 p-2.5 rounded-md border border-slate-200/80 flex flex-col gap-2">
                <button
                  id={`btn-calendar-vessel-${vessel.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCalendarOpen(!isCalendarOpen);
                  }}
                  className="w-full py-2 px-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-sans font-bold uppercase tracking-widest cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 rounded-sm shadow-xs"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <CalendarDays className="h-3.5 w-3.5 text-white shrink-0" />
                  {isCalendarOpen
                    ? "Close Calendar"
                    : LIVE_CALENDAR_TRANSLATIONS[cardLang] ||
                      "Live Availability Calendar"}
                </button>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 400, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full overflow-hidden rounded-md border border-slate-200 mt-2 bg-white"
                    >
                      <iframe
                        src="https://phuketamazingyacht.com/direct/freebooking#"
                        className="w-full h-full border-0"
                        title={`${vessel.name} Availability Calendar`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200/60 pt-2 gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Share Link:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Here is the Live Availability Calendar for ${vessel.name}: https://phuketamazingyacht.com/direct/freebooking#`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share via WhatsApp"
                      className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-sm border border-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="h-2.5 w-2.5 rotate-45 text-emerald-600 shrink-0" />
                      <span className="text-[8px] font-bold">WhatsApp</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        "https://phuketamazingyacht.com/direct/freebooking#",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share on Facebook"
                      className="p-1 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-sm border border-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Facebook className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                      <span className="text-[8px] font-bold">Facebook</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        `${vessel.name} - Live Availability Calendar`,
                      )}&body=${encodeURIComponent(
                        `Hello!\n\nPlease check the live availability schedule for ${vessel.name} here:\nhttps://phuketamazingyacht.com/direct/freebooking#\n\nPhuket Private Yacht Excursions.`,
                      )}`}
                      title="Share via Email"
                      className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-sm border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Mail className="h-2.5 w-2.5 text-slate-600 shrink-0" />
                      <span className="text-[8px] font-bold">Email</span>
                    </a>

                    {/* TikTok */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "https://phuketamazingyacht.com/direct/freebooking#",
                        );
                        setTiktokCopied(true);
                        setTimeout(() => setTiktokCopied(false), 2000);
                      }}
                      title="Copy Link for TikTok Bio/DM"
                      type="button"
                      className={`p-1 px-1.5 rounded-sm border transition-colors flex items-center gap-1 cursor-pointer ${
                        tiktokCopied
                          ? "bg-rose-50 border-rose-300 text-rose-800"
                          : "bg-slate-900 hover:bg-slate-850 text-white border-slate-900"
                      }`}
                    >
                      {tiktokCopied ? (
                        <Check className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-2.5 w-2.5 fill-current shrink-0 text-[#00f2fe]"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12.525.024a.066.066 0 0 0-.073.064c-.01 1.054-.156 3.424-2.106 4.792-1.944 1.366-3.837 1.157-4.607 1.042a.067.067 0 0 0-.077.065V10.1c0 .04.032.072.071.072a7.359 7.359 0 0 0 3.393-.578 3.013 3.013 0 0 1-.225 1.18c-.642 1.573-2.124 2.656-3.766 2.613a3.864 3.864 0 0 1-3.665-3.863c.03-2.133 1.76-3.834 3.844-3.8a3.847 3.847 0 0 1 1.488.334.066.066 0 0 0 .085-.04l1.374-4.13a.065.065 0 0 0-.038-.078c-.7-.344-1.638-.55-2.731-.55C2.155.992.002 3.1.002 5.698c0 2.597 2.153 4.706 4.811 4.706a4.8 4.8 0 0 0 2.148-.507V23.77c0 .037.03.067.067.067h4.868a.067.067 0 0 0 .067-.067V10.573c2.443.918 4.678 3.593 4.678 3.593a.067.067 0 0 0 .1.002L19.9 10.7a.067.067 0 0 0-.002-.1 7.126 7.126 0 0 1-4.702-3.153A8.932 8.932 0 0 0 18.527 8c2.949-.071 5.313-2.435 5.384-5.384.034-1.4-.336-2.614-1.122-3.486a.067.067 0 0 0-.083-.013c-2.422 1.341-3.611 3.535-4.225 4.811V.088a.066.066 0 0 0-.066-.064h-5.89z" />
                        </svg>
                      )}
                      <span className="text-[8px] font-bold">
                        {tiktokCopied ? "Copied" : "TikTok Link"}
                      </span>
                    </button>

                    {/* Copy Link / WeChat / WeMe */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "https://phuketamazingyacht.com/direct/freebooking#",
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      title="Copy Link for WeMe/WeChat"
                      type="button"
                      className={`p-1 px-1.5 rounded-sm border transition-colors flex items-center gap-1 cursor-pointer ${
                        copied
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
                      }`}
                    >
                      {copied ? (
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-2.5 w-2.5 text-amber-600" />
                      )}
                      <span className="text-[8px] font-bold">
                        {copied ? "Copied" : "Copy Link"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          <div className="grid grid-cols-2 gap-2">
            <button
              id={`btn-select-vessel-${vessel.id}`}
              onClick={onSelect}
              type="button"
              className={`w-full py-2.5 px-2 border text-center text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-[#0F172A] text-white border-[#0F172A]"
                  : "bg-transparent text-slate-700 border-slate-200 hover:border-slate-800"
              }`}
            >
              {isSelected ? t("vessel.selected") : t("vessel.select")}
            </button>

            <button
              id={`btn-book-vessel-${vessel.id}`}
              onClick={() => {
                onSelect();
                onBookNow();
              }}
              type="button"
              className="w-full py-2.5 px-2 bg-emerald-700 text-white text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-emerald-800 cursor-pointer transition-colors flex items-center justify-center gap-1 hover:shadow-xs"
            >
              <CalendarDays className="h-3 w-3" />
              {t("vessel.book")}
            </button>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Dialog */}
      <VesselLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        vesselName={translatedName}
        initialIndex={currentIdx}
      />
    </motion.div>
  );
}
