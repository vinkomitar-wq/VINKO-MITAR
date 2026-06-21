import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Anchor,
  Shield,
  ShieldAlert,
  Lock,
  Compass,
  Activity,
  LifeBuoy,
  Utensils,
  Sparkles,
  Fish,
  CloudRain,
  Footprints,
  Info,
} from "lucide-react";

type Language = "en" | "hr" | "zh" | "ru" | "hi" | "th";

interface RuleItem {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  en: string;
  hr: string;
  zh: string;
  ru: string;
  hi: string;
  th: string;
  badge?: {
    en: string;
    hr: string;
    zh: string;
    ru: string;
    hi: string;
    th: string;
    type: "danger" | "warning" | "info";
  };
}

interface RuleCategory {
  id: string;
  titleEn: string;
  titleHr: string;
  titleZh: string;
  titleRu: string;
  titleHi: string;
  titleTh: string;
  rules: RuleItem[];
}

export const ONBOARD_CATEGORIES: RuleCategory[] = [
  {
    id: "authority",
    titleEn: "Command & Safety",
    titleHr: "Zapovjedništvo i sigurnost",
    titleZh: "指挥与安全",
    titleRu: "Командование и безопасность",
    titleHi: "कमान और सुरक्षा",
    titleTh: "ความปลอดภัยและการบัญชาการ",
    rules: [
      {
        id: 0,
        icon: ShieldAlert,
        en: "For any changes in booking after boarding the ship, the customer must contact the agency from which they booked the trip.",
        hr: "Za bilo kakve promjene u rezervaciji nakon ukrcaja na brod, kupac se mora obratiti agenciji kod koje je rezervirao putovanje.",
        zh: "登船后对预订方案的任何更改，客户必须联系其预订行程的代理机构。",
        ru: "Для любых изменений в бронировании после посадки на судно, клиент должен связаться с агентством, в котором он забронировал поездку.",
        hi: "जहाज पर चढ़ने के बाद बुकिंग में किसी भी बदलाव के लिए, ग्राहक को उस एजेंसी से संपर्क करना होगा जिससे उन्होंने यात्रा बुक की थी।",
        th: "สำหรับการเปลี่ยนแปลงใดๆ ในการจองหลังจากขึ้นเรือแล้ว ลูกค้าจะต้องติดต่อเอเจนซี่ที่จองทริปด้วยเท่านั้น",
        badge: {
          en: "Post-Boarding Policy",
          hr: "Nakon ukrcaja",
          zh: "登船后规则",
          ru: "После посадки",
          hi: "बोर्डिंग के बाद",
          th: "กฎหลังขึ้นเรือ",
          type: "danger",
        },
      },
      {
        id: 1,
        icon: Shield,
        en: "The Captain and crew are the ultimate authority on board.",
        hr: "Kapetan i posada su zakon na brodu.",
        zh: "船长和船员是船上的绝对权威。",
        ru: "Капитан и экипаж являются высшим авторитетом на борту.",
        hi: "कप्तान और चालक दल बोर्ड पर अंतिम अधिकार हैं।",
        th: "กัปตันและลูกเรือเป็นผู้มีอำนาจตัดสินใจสูงสุดบนเรือ",
        badge: {
          en: "Mandatory",
          hr: "Obavezno",
          zh: "强制要求",
          ru: "Обязательно",
          hi: "अनिवार्य",
          th: "ข้อบังคับ",
          type: "danger",
        },
      },
      {
        id: 2,
        icon: ShieldAlert,
        en: "The Captain may terminate the journey at any point if the safety of the vessel, crew, or passengers is compromised.",
        hr: "Kapetan može u svakom trenutku prekinuti putovanje ako je sigurnost broda, posade i putnika ugrožena.",
        zh: "如果船只、船员หรือ乘客的安全受到威胁，船长可随时终止航程。",
        ru: "Капитан может прекратить путешествие в любой момент, если безопасность судна, экипажа или пассажиров находится под угрозой.",
        hi: "यदि जहाज, चालक दल या यात्रियों की सुरक्षा से समझौता किया जाता है, तो कप्तान किसी भी समय यात्रा समाप्त कर सकता है।",
        th: "กัปตันสามารถสิ้นสุดการเดินทางได้ทันทีหากความปลอดภัยของเรือ ลูกเรือ หรือผู้โดยสารตกอยู่ในความเสี่ยง",
      },
      {
        id: 3,
        icon: Compass,
        en: "Touching any navigation or vessel instruments is strictly prohibited.",
        hr: "Zabranjeno je diranje svih brodskih instrumenata.",
        zh: "严禁触摸任何导航或船只仪器。",
        ru: "Категорически запрещается прикасаться к любым навигационным или судовым приборам.",
        hi: "किसी भी नेวิगेशन या जहाज के उपकरणों को छूना सख्त मना है।",
        th: "ห้ามมิให้สัมผัสอุปกรณ์นำทางหรือเครื่องควบคุมเรือโดยเด็ดขาด",
        badge: {
          en: "Prohibited",
          hr: "Zabranjeno",
          zh: "严禁触摸",
          ru: "Запрещено",
          hi: "निषिद्ध",
          th: "ห้ามสัมผัส",
          type: "danger",
        },
      },
      {
        id: 4,
        icon: CloudRain,
        en: "In adverse weather conditions, the crew may instruct passengers to seek shelter inside the salon.",
        hr: "U slučaju lošeg vremena posada vam može narediti da uđete u brodski salon.",
        zh: "在恶劣天气条件下，船员可能会指示乘客到沙龙舱内避险。",
        ru: "При неблагоприятных погодных условиях экипаж может дать указание пассажирам укрыться в салоне.",
        hi: "प्रतिकूल मौसम की स्थिति में, चालक दल यात्रियों को सैलून के अंदर शरण लेने का निर्देश दे सकता है।",
        th: "ในสถานการณ์ของสภาพอากาศแปรปรวน ลูกเรืออาจสั่งให้ผู้โดยสารเดินทางเข้าไปพักในห้องโถงหลักเพื่อความปลอดภัย",
      },
    ],
  },
  {
    id: "footwear",
    titleEn: "Footwear & Saloon",
    titleHr: "Obuća i salon",
    titleZh: "鞋履与沙龙",
    titleRu: "Обувь и салон",
    titleHi: "जूते और सैलून",
    titleTh: "รองเท้าและห้องโถง",
    rules: [
      {
        id: 5,
        icon: Footprints,
        en: "Walking on board with footwear is strictly prohibited. Keep the decks pristine and safe.",
        hr: "Nije dopušteno hodati po brodu u obući.",
        zh: "严禁穿着鞋履在船上行走。请保持甲板整洁与安全。",
        ru: "Ходить по борту в обуви строго запрещено. Держите палубу в чистоте и безопасности.",
        hi: "जूते पहनकर बोर्ड पर चलना सख्त मना है। डेक को साफและ सुरक्षित रखें।",
        th: "ห้ามผู้โดยสารเดินสวมรองเท้าบนเรืออย่างเด็ดขาดเพื่อรักษาดาดฟ้าเรือให้สะอาดและปลอดภัยอยู่เสมอ",
        badge: {
          en: "Barefoot",
          hr: "Bez obuće",
          zh: "赤脚上船",
          ru: "Без обуви",
          hi: "नंगे पैर",
          th: "ห้ามสวมรองเท้า",
          type: "warning",
        },
      },
      {
        id: 6,
        icon: Anchor,
        en: "Please remove your footwear; the crew will store and safeguard it in a designated onboard locker.",
        hr: "Skinite obuću, posada će je spremiti na sigurno mjesto i čuvati.",
        zh: "请脱下您的鞋子；船员会将其存放并妥善保管在船上的专属储物柜中。",
        ru: "Пожалуйста, снимите обувь; экипаж поместит ее на хранение в специальный сейф на борту.",
        hi: "कृपया अपने जूते उतारें; चालक दल उन्हें जहाज पर निर्दिष्ट तिजोरी में सुरक्षित रूप से संग्रहीत करेगा।",
        th: "โปรดถอดรองเท้าของท่าน โดยลูกเรือจะนำไปจัดเก็บเพื่อความปลอดภัยไว้ในช่องเก็บเฉพาะบนเรือเพื่อความเรียบร้อย",
      },
      {
        id: 7,
        icon: Sparkles,
        en: "Please do not enter the indoor saloon while wet from swimming; wet flooring is extremely slippery.",
        hr: "Prilikom izlaska iz mora, ne ulazite mokri u salon, sklisko je.",
        zh: "游泳后身上未干时请勿进入室内沙龙；潮湿的地板极易打滑。",
        ru: "Пожалуйста, не входите в закрытый салон мокрыми после купания; влажный пол очень скользкий.",
        hi: "कृपया तैरने के बाद गीले होने पर इनडोर सैलून में प्रवेश न करें; गीला फर्श बेहद फिसलन भरा होता है।",
        th: "โปรดหลีกเลี่ยงการเข้าไปในบริเวณห้องโถงด้านในขณะที่ตัวยังเปียกน้ำจากการว่ายน้ำ เพราะพื้นจะลื่นมากอาจก่อให้เกิดอุบัติเหตุได้",
      },
    ],
  },
  {
    id: "cabins",
    titleEn: "Cabins & Compartments",
    titleHr: "Pravila u kabinama i prostorima",
    titleZh: "船舱与区域",
    titleRu: "Каюты и отсеки",
    titleHi: "केबिन और डिब्बे",
    titleTh: "ห้องพักและห้องจัดเก็บ",
    rules: [
      {
        id: 8,
        icon: Utensils,
        en: "Eating and creating clutter inside the cabins is strictly forbidden.",
        hr: "U kabinama je zabranjeno jesti i raditi nered.",
        zh: "严禁在客舱内进食或制造凌乱。",
        ru: "Прием пищи и создание беспорядка в каютах строго запрещены.",
        hi: "केबिन के अंदर खाना खाना और गंदगी फैलाना सख्त मना है।",
        th: "ห้ามนำอาหารไปรับประทานหรือก่อความสกปรกเละเทะภายในห้องพักโดยเด็ดขาด",
        badge: {
          en: "No Food",
          hr: "Bez hrane",
          zh: "禁止饮食",
          ru: "Без еды",
          hi: "भोजन वर्जित",
          th: "ห้ามรับประทานอาหาร",
          type: "warning",
        },
      },
      {
        id: 9,
        icon: Info,
        en: "Restrooms are located inside the cabins and are clearly marked for your convenience.",
        hr: "U kabinama se nalaze wc i propisno su označeni.",
        zh: "洗手间位于客舱内，并标有清晰的指示牌，以便您使用。",
        ru: "Санузлы расположены внутри кают и четко обозначены для вашего удобства.",
        hi: "शौचालय केबिन के अंदर स्थित हैं और आपकी सुविधा के लिए स्पष्ट रूप से चिह्नित हैं।",
        th: "ห้องสุขาตั้งอยู่ภายในบริเวณห้องพัก ได้รับการทำสัญลักษณ์ไว้อย่างเด่นชัดเพื่อความสะดวกสบายของคุณ",
      },
      {
        id: 10,
        icon: Lock,
        en: "Accessing unauthorized compartments or crew-only areas is strictly prohibited.",
        hr: "Nije dozvoljeno otvarati prostore koji nisu namijenjeni za putnike. Ne ulazite u prostore posade.",
        zh: "严禁进入未经授权的舱室或仅限船员进入的区域。",
        ru: "Доступ в несанкционированные отсеки или зоны только для экипажа строго запрещен.",
        hi: "अनधिकृत डिब्बों या केवल चालक दल के क्षेत्रों में प्रवेश करना सख्त मना है।",
        th: "ห้ามเปิดตรวจสอบห้องเก็บของหรือเข้าไปในส่วนเฉพาะของลูกเรืออย่างเด็ดขาด",
        badge: {
          en: "Restricted",
          hr: "Zabranjen pristup",
          zh: "限制区域",
          ru: "Ограничено",
          hi: "प्रतिबंधित",
          th: "พื้นที่จำกัด",
          type: "danger",
        },
      },
    ],
  },
  {
    id: "water",
    titleEn: "Swimming & Water Safety",
    titleHr: "Kupanje i sigurnost u moru",
    titleZh: "游泳与水上安全",
    titleRu: "Плавание и безопасность на воде",
    titleHi: "तैराकी और जल सुरक्षा",
    titleTh: "การเล่นน้ำและความปลอดภัย",
    rules: [
      {
        id: 11,
        icon: ShieldAlert,
        en: "Jumping into the ocean from the vessel while transiting/moving is strictly prohibited.",
        hr: "Zabranjeno je skakanje u more sa broda tokom plovidbe.",
        zh: "船只行驶/移动期间，严禁跳入海中。",
        ru: "Категорически запрещено прыгать в океан с судна во время движения.",
        hi: "पारगमन/चलने के दौरान जहाज से समुद्र में कूदना सख्त मना है।",
        th: "ห้ามกระโดดลงสู่ทะเลโดยเด็ดขาดในระหว่างที่เรือยังเคลื่อนที่อยู่",
        badge: {
          en: "Dangerous",
          hr: "Opasno",
          zh: "极度危险",
          ru: "Опасно",
          hi: "खतरनाक",
          th: "อันตราย",
          type: "danger",
        },
      },
      {
        id: 12,
        icon: LifeBuoy,
        en: "For your own safety, do not enter the water until the vessel has fully anchored and the crew has given explicit clearance.",
        hr: "Kada brod pristane na lokaciju, posada će vam dati znak kada možete ići u more, ne prije zbog vaše sigurnosti.",
        zh: "为了您的安全，在船只完全抛锚且船员给予明确许可前，请勿下水。",
        ru: "В целях вашей безопасности не входите в воду до тех пор, пока судно полностью не встанет на якорь и экипаж не даст четкого разрешения.",
        hi: "आपकी अपनी सुरक्षा के लिए, जब तक जहाज पूरी तरह से लंगर नहीं डाल देता और चालक दल स्पष्ट अनुमति नहीं दे देता, तब तक पानी में प्रवेश न करें।",
        th: "เพื่อความปลอดภัยของคุณเอง ห้ามลงเล่นน้ำจนกว่าเรือจะจอดทอดสมอเสร็จสมบูรณ์และได้รับการส่งสัญญาณอนุญาตจากลูกเรือเท่านั้น",
      },
      {
        id: 13,
        icon: Activity,
        en: "While swimming, if carried away by an ocean current, do not swim against it; remain calm, and the crew will rescue you.",
        hr: "Prilikom plivanja, ako vas odnese morska struja nemojte plivati protiv nje, posada će doći po vas.",
        zh: "游泳时，如果被海流卷走，切勿迎着海流游动；请保持冷静，船员会前去营救您。",
        ru: "Если во время плавания вас унесло океанским течением, не плывите против него; сохраняйте спокойствие, экипаж спасет вас.",
        hi: "तैरते समय यदि समुद्री धारा आपको बहा ले जाए, तो उसके विरुद्ध न तैरें; शांत रहें, और चालक दल आपको बचा लेगा।",
        th: "ขณะว่ายน้ำในทะเล หากถูกกระแสน้ำพัดออกไป โปรดอย่าพยายามว่ายต้านกระแสน้ำ ให้ตั้งสติและลูกเรือจะนำเรือเข้าไปรับท่านทันที",
      },
      {
        id: 14,
        icon: LifeBuoy,
        en: "Under the laws of the Kingdom of Thailand, passengers must wear life jackets. The crew is ready to assist you.",
        hr: "Prema zakonu Kraljevine Thailand morate obući prsluk za spašavanje. Posada će vam pomoći.",
        zh: "根据泰王国法律，乘客必须穿着救生衣。船员已准备好为您提供协助。",
        ru: "Согласно законам Королевства Таиланд, пассажиры обязаны носить спасательные жилеты. Экипаж готов помочь вам.",
        hi: "थाईलैंड साम्राज्य के कानून के तहत, यात्रियों को लाइफ जैकेट पहनना आवश्यक है। चालक दल आपकी सहायता के लिए तैयार है।",
        th: "ตามระเบียบกฎหมายแห่งราชอาณาจักรไทย ผู้โดยสารทุกคนต้องสวมเสื้อชูชีพ ลูกเรือพร้อมที่จะดูแลและช่วยเหลือท่าน",
        badge: {
          en: "Thai Law",
          hr: "Zakon Thailanda",
          zh: "泰国法律",
          ru: "Закон Таиланда",
          hi: "थाई कानून",
          th: "กฎหมายไทย",
          type: "warning",
        },
      },
      {
        id: 15,
        icon: LifeBuoy,
        en: "You may request a swim/safety vest from the crew anytime for extra floating support.",
        hr: "Ako hoćete, možete zatražiti sigurnosni prsluk da biste plivali.",
        zh: "您可以随时向船员索要游动/安全背心，以获得额外的浮力支持。",
        ru: "Вы можете в любое время попросить у экипажа плавательный/страховочный жилет для дополнительной поддержки на воде.",
        hi: "अतिरिक्त तैरने के समर्थन के लिए आप किसी भी समय चालक दल से सुरक्षा जैकेट का अनुरोध कर सकते हैं।",
        th: "ท่านสามารถร้องขอเสื้อชูชีพหรือชูชีพพยุงตัวสำหรับการลงเล่นน้ำจากลูกเรือได้ตลอดเวลาเพื่อความอุ่นใจ",
      },
      {
        id: 16,
        icon: Activity,
        en: "When using the water slide, please wait until the previous sliding passenger has cleared the splash zone.",
        hr: "Prilikom korištenja slidera, pričekajte da se osoba ispred vas makne.",
        zh: "使用水上滑梯时，请等到前一位滑行乘客离开落水区后再滑下。",
        ru: "При использовании водной горки подождите, пока предыдущий пассажир покинет зону приземления.",
        hi: "वॉटर स्लाइड का उपयोग करते समय, कृपया तब तक प्रतीक्षा करें जब तक कि पिछला स्लाइडिंग यात्री स्पलैश जोन से बाहर न निकल जाए।",
        th: "ระหว่างใช้งานเครื่องเล่นสไลเดอร์ โปรดรอสัญญาณหรือจนกว่าผู้โดยสารคนก่อนหน้าจะเคลื่อนที่ออกจากพื้นที่ลงน้ำด้านล่างเสร็จสิ้น",
      },
    ],
  },
  {
    id: "ecology",
    titleEn: "Eco & Marine Conservation",
    titleHr: "Ekologija i očuvanje mora",
    titleZh: "生态与海洋保护",
    titleRu: "Экология и охрана моря",
    titleHi: "पर्यावरण और समुद्री संरक्षण",
    titleTh: "การอนุรักษ์สิ่งแวดล้อม",
    rules: [
      {
        id: 17,
        icon: Fish,
        en: "Feeding marine wildlife inside Marine National Parks is strictly prohibited by law.",
        hr: "Zabranjeno je hranjenje ribe u nacionalnim parkovima.",
        zh: "法律严格禁止在国家海洋公园内喂食海洋野生动物。",
        ru: "Закон строго запрещает кормление морских обитателей на территории национальных морских парков.",
        hi: "समुद्री राष्ट्रीय उद्यानों के अंदर समुद्री वन्यजीवों को खिलाना कानून द्वारा सख्त प्रतिबंधित है।",
        th: "ห้ามให้อาหารสัตว์ทะเลภายในพื้นที่เขตอุทยานแห่งชาติทางทะเลอย่างเด็ดขาดตามกฎหมาย",
        badge: {
          en: "Eco Law",
          hr: "Eko zakon",
          zh: "生态法律",
          ru: "Эко-закон",
          hi: "पर्यावरण कानून",
          th: "กฎหมายสิ่งแวดล้อม",
          type: "danger",
        },
      },
      {
        id: 18,
        icon: Fish,
        en: "Fishing from the vessel is restricted or forbidden in designated zones.",
        hr: "Zabranjen je ribolov sa broda u određenim lokacijama.",
        zh: "在指定区域内，禁止或者限制在船上进行垂钓。",
        ru: "Рыбалка с судна ограничена или запрещена в определенных зонах.",
        hi: "नामित क्षेत्रों में जहाज से मछली पकड़ना प्रतिबंधित या मना है।",
        th: "ห้ามจับปลาหรือตกปลาจากบนตัวเรือในเขตพื้นที่คุ้มครองธรรมชาติที่ระบุไว้",
      },
    ],
  },
];

export const OnboardRules: React.FC = () => {
  const [lang, setLang] = useState<Language>("en");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const getLabel = (key: string) => {
    switch (key) {
      case "header":
        if (lang === "hr") return "Pravila na brodu";
        if (lang === "zh") return "乘船规则";
        if (lang === "ru") return "Правила поведения на борту";
        if (lang === "hi") return "बोर्ड पर नियम";
        if (lang === "th") return "กฎระเบียบความปลอดภัยบนเรือ";
        return "Rules On Board";
      case "subheader":
        if (lang === "hr") return "Sigurnosni kućni red i direktive";
        if (lang === "zh") return "行为准则与安全指南";
        if (lang === "ru") return "Кодекс поведения и морские инструкции";
        if (lang === "hi") return "आचरण संहिता और सुरक्षा दिशानिर्देश";
        if (lang === "th")
          return "ข้อกำหนดและแนวทางปฏิบัติด้านความปลอดภัยทางทะเล";
        return "Code of Conduct & Marine Guidelines";
      case "all_rules":
        if (lang === "hr") return "Sva pravila";
        if (lang === "zh") return "全部规则";
        if (lang === "ru") return "Все правила";
        if (lang === "hi") return "सभी नियम";
        if (lang === "th") return "กฎระเบียบทั้งหมด";
        return "All Rules";
      case "bottom_callout":
        if (lang === "hr")
          return "Poštivanje svih pravila o sigurnosti plovidbe obavezno je za sve goste tijekom trajanja chartera. Hvala vam na suradnji.";
        if (lang === "zh")
          return "您对游艇安全规则的遵守是确保高端航行体验的强制要求。感谢您的合作。";
        if (lang === "ru")
          return "Соблюдение правил безопасности на яхте обязательно для обеспечения первоклассного морского путешествия. Благодарим за сотрудничество.";
        if (lang === "hi")
          return "एक प्रीमियम समुद्री यात्रा सुनिश्चित करने के लिए नौका सुरक्षा नियमों का आपका अनुपालन पूरी तरह से अनिवार्य है। आपके सहयोग के लिए धन्यवाद।";
        if (lang === "th")
          return "การปฏิบัติตามกฎระเบียบด้านความปลอดภัยบนเรือยอชท์เป็นหน้าที่สำคัญของผู้โดยสารเพื่อความปลอดภัยสูงสุดและทริปที่สมบูรณ์แบบ ขอขอบพระคุณในความร่วมมือ";
        return "Your compliance with yacht safety rules is fully mandatory to ensure a premium maritime voyage. Thank you for your partnership.";
      default:
        return "";
    }
  };

  const getCategoryTitle = (cat: RuleCategory) => {
    if (lang === "hr") return cat.titleHr;
    if (lang === "zh") return cat.titleZh;
    if (lang === "ru") return cat.titleRu;
    if (lang === "hi") return cat.titleHi;
    if (lang === "th") return cat.titleTh;
    return cat.titleEn;
  };

  const getRuleText = (rule: RuleItem) => {
    if (lang === "hr") return rule.hr;
    if (lang === "zh") return rule.zh;
    if (lang === "ru") return rule.ru;
    if (lang === "hi") return rule.hi;
    if (lang === "th") return rule.th;
    return rule.en;
  };

  const getBadgeText = (rule: RuleItem) => {
    if (!rule.badge) return "";
    if (lang === "hr") return rule.badge.hr;
    if (lang === "zh") return rule.badge.zh;
    if (lang === "ru") return rule.badge.ru;
    if (lang === "hi") return rule.badge.hi;
    if (lang === "th") return rule.badge.th;
    return rule.badge.en;
  };

  const languagesConfig = [
    { code: "en", label: "EN" },
    { code: "hr", label: "HR" },
    { code: "zh", label: "中文" },
    { code: "ru", label: "РУС" },
    { code: "hi", label: "हिन्दी" },
    { code: "th", label: "ภาษาไทย" },
  ];

  return (
    <div className="bg-white border border-[#0F172A]/10 rounded-xs overflow-hidden shadow-sm text-left min-w-0">
      {/* Editorial Header bar */}
      <div className="bg-[#0F172A] p-4.5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold font-sans uppercase tracking-[0.15em] text-white">
            {getLabel("header")}
          </h4>
          <p className="text-[10px] text-slate-400 font-sans mt-0.5">
            {getLabel("subheader")}
          </p>
        </div>

        {/* Toggle between 6 languages */}
        <div className="flex flex-wrap bg-white/10 rounded-sm p-0.5 border border-white/5 shadow-inner gap-0.5 select-none w-full sm:w-auto">
          {languagesConfig.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLang(item.code as Language)}
              className={`px-2 py-1 rounded-xs text-[9px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer ${
                lang === item.code
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Horizontal Slider filter */}
      <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-slate-100 bg-slate-50 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeCategory === "all"
              ? "bg-[#0F172A] text-white"
              : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800"
          }`}
        >
          {getLabel("all_rules")}
        </button>
        {ONBOARD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeCategory === cat.id
                ? "bg-[#0F172A] text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800"
            }`}
          >
            {getCategoryTitle(cat)}
          </button>
        ))}
      </div>

      {/* Rules Feed */}
      <div className="p-4 space-y-5 max-h-[460px] overflow-y-auto divide-y divide-slate-100">
        <AnimatePresence mode="popLayout">
          {ONBOARD_CATEGORIES.filter(
            (cat) => activeCategory === "all" || cat.id === activeCategory,
          ).map((category, catIdx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`pt-4 ${catIdx === 0 ? "pt-0 border-t-0" : ""}`}
            >
              <h5 className="text-[10px] font-bold font-sans uppercase tracking-[0.12em] text-[#0F172A]/70 mb-3 block">
                {getCategoryTitle(category)}
              </h5>

              <ul className="space-y-3 pl-0 list-none">
                {category.rules.map((rule) => {
                  const RuleIcon = rule.icon;
                  return (
                    <li key={rule.id} className="flex gap-3 items-start group">
                      <div className="p-1 rounded-sm bg-slate-50 border border-slate-100 text-[#0F172A] mt-0.5 shrink-0 group-hover:bg-[#0F172A]/5 group-hover:text-[#0F172A] transition-colors">
                        <RuleIcon className="h-3.5 w-3.5 shrink-0" />
                      </div>
                      <div className="flex-1 space-y-0.5 text-left">
                        <p className="text-[11px] text-slate-700 leading-normal font-sans">
                          {getRuleText(rule)}
                        </p>

                        {rule.badge && (
                          <span
                            className={`inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded-xs border font-sans ${
                              rule.badge.type === "danger"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {getBadgeText(rule)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Professional Callout at the bottom */}
      <div className="bg-slate-50 p-3.5 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed font-sans flex items-start gap-2">
        <span className="text-amber-500 text-xs mt-0.5 shrink-0">⚠️</span>
        <p>{getLabel("bottom_callout")}</p>
      </div>
    </div>
  );
};
