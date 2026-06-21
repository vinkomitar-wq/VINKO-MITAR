const fs = require('fs');
let txt = fs.readFileSync('src/components/ExcursionMap.tsx', 'utf8');

const missing = `
      {
        id: "ao-po",
        name: t("piers.ao-po.name") !== "piers.ao-po.name" ? t("piers.ao-po.name") : "Ao Po Harbour",
        type: "pier",
        x: 230,
        y: 120,
        lat: 8.0673,
        lng: 98.4419,
        description: t("piers.ao-po.description") !== "piers.ao-po.description" ? t("piers.ao-po.description") : "Elite deep-water luxury marina in Northeast Phuket. Direct access to Phang Nga Bay without tide constraints.",
        highlights: [
          t("piers.ao-po.highlights.0") !== "piers.ao-po.highlights.0" ? t("piers.ao-po.highlights.0") : "24-Hour tide-free luxury access",
          t("piers.ao-po.highlights.1") !== "piers.ao-po.highlights.1" ? t("piers.ao-po.highlights.1") : "Exclusive superyacht berths",
          t("piers.ao-po.highlights.2") !== "piers.ao-po.highlights.2" ? t("piers.ao-po.highlights.2") : "Premium waterfront dining bars"
        ],
        imageUrl: DESTINATIONS.find(d => d.id === 'prompteph')?.imageUrl
      },
      {
        id: "james-bond",
        name: t("destinations.james-bond.name") !== "destinations.james-bond.name" ? t("destinations.james-bond.name") : "James Bond Island",
        type: "destination",
        x: 270,
        y: 40,
        lat: 8.2750,
        lng: 98.5000,
        description: t("destinations.james-bond.desc") !== "destinations.james-bond.desc" ? t("destinations.james-bond.desc") : "Geologically spectacular Khao Phing Kan in Phang Nga Bay. Admire the iconic 66-foot tall needle karst rising gracefully from tranquil emerald waters.",
        distanceNM: 17.3,
        timeHours: 2.5,
        recommendedPierId: "ao-po",
        highlights: [
          t("destinations.james-bond.highlights.0") !== "destinations.james-bond.highlights.0" ? t("destinations.james-bond.highlights.0") : "The legendary 'Gold Gun' film spire",
          t("destinations.james-bond.highlights.1") !== "destinations.james-bond.highlights.1" ? t("destinations.james-bond.highlights.1") : "Hidden mangrove kayak sea caves",
          t("destinations.james-bond.highlights.2") !== "destinations.james-bond.highlights.2" ? t("destinations.james-bond.highlights.2") : "Vibrant ancient sea-gypsy stilt village"
        ],
        imageUrl: DESTINATIONS.find(d => d.id === 'james-bond')?.imageUrl
      },`;

if (!txt.includes('id: "ao-po"')) {
  txt = txt.replace('// Starting Piers\n      {', '// Starting Piers\n' + missing + '\n      {');
}

txt = txt.replace(/<img src=\{selectedItem\.imageUrl\}/g, '<img referrerPolicy="no-referrer" src={selectedItem.imageUrl}');

fs.writeFileSync('src/components/ExcursionMap.tsx', txt);
