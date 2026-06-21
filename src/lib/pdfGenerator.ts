import { jsPDF } from "jspdf";

import { ONBOARD_CATEGORIES } from "../components/OnboardRules";

export interface CharterQuotationData {
  clientName: string;
  charterDate: string;
  vesselName: string;
  price: string;
  notes: string;
  bookingId?: string;
}

export interface pdfGeneratedItinerary {
  recommendedVesselId: string;
  vesselReasoning: string;
  recommendedPierId: string;
  routeTitle: string;
  fullDescription: string;
  stops: {
    destinationId: string;
    name: string;
    activity: string;
    durationHours: number;
    timeOfDay: string;
  }[];
  totalEstimatedHours: number;
  insiderTips: string[];
  vesselImageBase64?: string;
  vesselNameText?: string;

  // Metadata for Booking matching Main Page Layout
  bookingReference?: string;
  agentName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  charterDate?: string;
  guestCount?: string;
  duration?: string;
  cabinCount?: number;

  // Financial specifics for match
  agentPriceStr?: string;
  routePriceNum?: number;
  addonsPriceNum?: number;
  taxAmountNum?: number;
  totalIncTaxNum?: number;

  vesselSpecs?: {
    length?: string;
    capacity?: number;
    cabins?: number;
    bathrooms?: number;
    [key: string]: any;
  };
}

export const generateCharterQuotationPdf = (data: CharterQuotationData) => {
  const doc = new jsPDF();

  // Professional Branded Styling
  const primaryColor = [15, 23, 42];

  // Header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CHARTER QUOTATION", 15, 22);
  doc.setFontSize(10);
  doc.text("PHUKET PRIVATE YACHT EXCURSIONS", 15, 30);

  // Content
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");

  doc.text(`Client: ${data.clientName}`, 15, 60);
  doc.text(`Charter Date: ${data.charterDate}`, 15, 70);
  doc.text(`Vessel: ${data.vesselName}`, 15, 80);
  doc.text(`Total Price: ${data.price}`, 15, 90);

  doc.setFont("Helvetica", "bold");
  doc.text("Notes:", 15, 110);
  doc.setFont("Helvetica", "normal");
  const splitNotes = doc.splitTextToSize(data.notes, 180);
  doc.text(splitNotes, 15, 120);

  // Dynamic start position for the passenger manifest box based on splitNotes length
  const notesHeight = splitNotes.length * 5;
  const manifestBoxY = Math.max(140, 120 + notesHeight + 8);

  // Emerald Passenger Compliance Notice Box
  doc.setFillColor(240, 253, 244); // light emerald background (#F0FDF4)
  doc.rect(15, manifestBoxY, 180, 25, "F");
  
  doc.setDrawColor(16, 185, 129); // emerald border (#10B981)
  doc.setLineWidth(0.4);
  doc.rect(15, manifestBoxY, 180, 25, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("MANDATORY PASSENGER MANIFEST DECLARATION (HARBOR MASTER COMPLIANCE)", 19, manifestBoxY + 5.5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // Slate 700
  const noticeDesc = "Phuket marine safety regulations dictate all charterers declare passenger details. Click the link below to securely input your companion names and passport numbers on our live Ledger prior to pier arrival. No sign-up required.";
  const splitNoticeDesc = doc.splitTextToSize(noticeDesc, 172);
  doc.text(splitNoticeDesc, 19, manifestBoxY + 10.5);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app';
  const manifestUrl = data.bookingId 
    ? `${originUrl}/?expressManifest=true&bookingId=${data.bookingId}` 
    : `${originUrl}/?expressManifest=true`;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.textWithLink("👉 Click Here to Instantly Pre-Register Passengers Online", 19, manifestBoxY + 20.5, { url: manifestUrl });

  // Signature Section
  const sigY = 195;
  doc.setLineWidth(0.4);
  doc.setDrawColor(148, 163, 184); // Slate 300

  // Left: Guest Signature
  doc.line(15, sigY, 90, sigY);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("GUEST / CHARTERER SIGNATURE", 15, sigY + 5);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${data.clientName || "Valued Guest"}`, 15, sigY + 9);
  doc.text("Date: ____ / ____ / ________", 15, sigY + 13);

  // Right: Company Representative Signature
  doc.line(115, sigY, 190, sigY);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("COMPANY REPESENTATIVE SIGNATURE", 115, sigY + 5);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Name: Phuket Yacht Charters Representative", 115, sigY + 9);
  doc.text("Date: ____ / ____ / ________", 115, sigY + 13);

  return doc; // Returns the jspdf instance
};

export const generateItineraryPdf = (itinerary: pdfGeneratedItinerary) => {
  const doc = new jsPDF("p", "mm", "a4");

  const cleanString = (str: string | undefined | null) => {
    if (!str) return "";
    return str
      .replace(/[\uD800-\uDFFF]./g, "")
      .replace(/[⛵✨🌴🐠🌊🔒✓🎣🍽🍹🎂👑🎁⭐•*]/g, "")
      .replace(/[~≈]/g, "")
      .replace(/[^\x00-\x7F]/g, " ")
      .trim();
  };

  // -------------------------------------------------------------
  // PAGE 1: Brand & Charter Specification Proposal
  // -------------------------------------------------------------

  // Header background (Sleek Brand Banner style)
  doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
  doc.rect(0, 0, 210, 36, "F");

  // Teal Divider Strip
  doc.setFillColor(5, 150, 105); // Rich Emerald (#059669)
  doc.rect(0, 36, 210, 1.5, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const pdfBrandName = itinerary.agentName
    ? itinerary.agentName.toUpperCase()
    : "PRIVATE YACHT CHARTER PROPOSAL";
  doc.text(pdfBrandName, 20, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 242, 219); // Muted Teal
  doc.text("BESPOKE PRIVATE CATAMARAN PROPOSAL & ITINERARY", 20, 25);

  if (itinerary.agentName) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Prepared by: ${itinerary.agentName}`, 20, 31);
  }

  // Right Side Contact Channels
  doc.setTextColor(255, 255, 255);
  let headerRightY = 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    `Booking Ref: ${itinerary.bookingReference || "PENDING"}`,
    190,
    headerRightY,
    { align: "right" },
  );
  headerRightY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, headerRightY, {
    align: "right",
  });

  // 1. Proposal Metadata section
  let currentY = 52;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("I. CHARTER PARTNERSHIP SUMMARY", 20, currentY);

  // Section divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 3, 190, currentY + 3);

  currentY += 12;

  // Render Metadata in 2 columns
  const cols = {
    col1X: 20,
    col2X: 78,
    labelSize: 8,
    valSize: 9.5,
  };

  const drawMeta = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(cols.labelSize);
    doc.setTextColor(100, 116, 139); // Gray 500
    doc.text(label, x, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(cols.valSize);
    doc.setTextColor(15, 23, 42); // Navy 900
    doc.text(cleanString(value), x, y + 5);
  };

  const formattedDate =
    itinerary.charterDate || "Not Finalized (Pending Selection)";
  const durationText = String(itinerary.duration || "").startsWith("half-day")
    ? itinerary.duration === "half-day-afternoon"
      ? "Half Day Afternoon (from 14:30)"
      : itinerary.duration === "half-day-sunset"
        ? "Promthep Sunset (16:00 - 19:00)"
        : "Half Day Morning (from 08:30)"
    : itinerary.duration === "full-day"
      ? "Full Day Cruise (approx. 8 Hours)"
      : `Overnight Charter (${itinerary.cabinCount || 1} Cabins)`;

  // Draw vessel image on the right side of the metadata block if present
  if (itinerary.vesselImageBase64) {
    try {
      doc.addImage(itinerary.vesselImageBase64, "JPEG", 140, currentY, 50, 36);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.rect(140, currentY, 50, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("PROPOSED VESSEL PHOTO", 140, currentY + 39.5);
    } catch (err) {
      console.warn("Failed drawing vesselImageBase64 in itinerary PDF:", err);
    }
  }

  const vesselDisplayName =
    itinerary.vesselNameText || itinerary.recommendedVesselId.toUpperCase();
  drawMeta(
    "CLIENT GUEST NAME",
    itinerary.customerName || "Interested Guest",
    cols.col1X,
    currentY,
  );
  drawMeta("YACHT MODEL", vesselDisplayName, cols.col2X, currentY);

  currentY += 14;

  const contactStr =
    [itinerary.customerPhone, itinerary.customerEmail]
      .filter(Boolean)
      .join(" / ") || "Not provided";
  drawMeta("CLIENT CONTACT", contactStr, cols.col1X, currentY);
  drawMeta("PROPOSED DATE", formattedDate, cols.col2X, currentY);

  currentY += 14;

  drawMeta("CRUISE TYPE", durationText, cols.col1X, currentY);
  drawMeta(
    "DEPARTURE PORT / PIER",
    itinerary.recommendedPierId,
    cols.col2X,
    currentY,
  );

  currentY += 14;

  const guestDetails = `${itinerary.guestCount || "1"} guests total`;
  drawMeta("PASSENGER COMPOSITION", guestDetails, cols.col1X, currentY);
  drawMeta(
    "CUSTOMER ROUTE CHOICE",
    itinerary.routeTitle || "Customer Choice",
    cols.col2X,
    currentY,
  );

  if (itinerary.agentName) {
    currentY += 14;
    drawMeta("BROKER / AGENT", itinerary.agentName, cols.col2X, currentY);
  }

  currentY += 21;

  // 2. Trip Itinerary Timeline Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("II. PERSONALIZED VOYAGE ITINERARY & WAYPOINTS", 20, currentY);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, currentY + 3, 190, currentY + 3);

  currentY += 12;

  if (Array.isArray(itinerary.stops) && itinerary.stops.length > 0) {
    const timelineStartX = 26;
    const timelineStartY = currentY + 4;
    const timelineEndY = timelineStartY + (itinerary.stops.length - 1) * 16;

    if (itinerary.stops.length > 1) {
      doc.setDrawColor(5, 150, 105); // Emerald Green line
      doc.setLineWidth(0.65);
      doc.line(timelineStartX, timelineStartY, timelineStartX, timelineEndY);
    }

    itinerary.stops.forEach((stop, idx) => {
      const itemY = currentY + 4 + idx * 16;
      doc.setFillColor(5, 150, 105);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(timelineStartX, itemY, 2.2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanString(stop.name), timelineStartX + 10, itemY + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const estDuration = stop.durationHours * 60;
      doc.text(
        `Time of day: ${stop.timeOfDay} | Activity: ${cleanString(stop.activity)}`,
        timelineStartX + 10,
        itemY + 4.5,
      );
    });

    currentY += itinerary.stops.length * 16 + 5;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "No specific destinations selected. Custom route arranged by choice or charter captain.",
      24,
      currentY + 5,
    );
    currentY += 15;
  }

  // -------------------------------------------------------------
  // PAGE 2: Financial Proposal & Broker Synchronization
  // -------------------------------------------------------------
  doc.addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 20, "F");

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 20, 210, 1, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(pdfBrandName, 20, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 242, 219);
  doc.text("PROPOSAL COST ESTIMATION & TERMS", 190, 13, { align: "right" });

  currentY = 32;

  // Financial Section
  if (itinerary.totalIncTaxNum !== undefined) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("III. FINAL FINANCIAL QUOTATION", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 12;

    const startRectY = currentY;
    let tableY = currentY + 6;

    /// Base cost
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Base Yacht Charter (${itinerary.duration || "full-day"})`,
      25,
      tableY,
    );
    doc.setFont("helvetica", "bold");
    if (itinerary.routePriceNum !== undefined) {
      doc.text(`THB ${itinerary.routePriceNum.toLocaleString()}`, 185, tableY, {
        align: "right",
      });
    } else {
      doc.text(
        cleanString(itinerary.agentPriceStr || "Included"),
        185,
        tableY,
        { align: "right" },
      );
    }

    tableY += 8;

    /// Addons cost
    if (itinerary.insiderTips && itinerary.insiderTips.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("ADDONS :", 25, tableY);
      tableY += 6;
      doc.setFont("helvetica", "normal");

      itinerary.insiderTips.forEach((addon: string) => {
        doc.text(`SELECTED ( ${addon} ) =`, 30, tableY);
        tableY += 6;
      });
      // Just print total addons price if it exists
      if (itinerary.addonsPriceNum && itinerary.addonsPriceNum > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Addons Total", 25, tableY);
        doc.text(
          `THB ${itinerary.addonsPriceNum.toLocaleString()}`,
          185,
          tableY,
          { align: "right" },
        );
        tableY += 8;
      }
    } else if (itinerary.addonsPriceNum && itinerary.addonsPriceNum > 0) {
      doc.setFont("helvetica", "normal");
      doc.text("ADDONS :", 25, tableY);
      doc.setFont("helvetica", "bold");
      doc.text(
        `THB ${itinerary.addonsPriceNum.toLocaleString()}`,
        185,
        tableY,
        { align: "right" },
      );
      tableY += 8;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(20, tableY - 2, 190, tableY - 2);

    tableY += 6;

    // Total (WITHOUT TAX)
    const totalWithoutTax =
      (itinerary.routePriceNum || 0) + (itinerary.addonsPriceNum || 0);

    doc.setFillColor(15, 23, 42); // Navy background for total
    doc.rect(20, tableY, 170, 14, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL , WITHOUT TAX =", 25, tableY + 9);
    doc.text(`THB ${totalWithoutTax.toLocaleString()}`, 185, tableY + 9, {
      align: "right",
    });

    currentY = tableY + 24;

    // DISCLAIMER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(190, 20, 20); // Red
    const disclaimer =
      "DISCLAIMER: Any changes of route requested after boarding, the lead customer must call the agent where they booked the trip.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, 20, currentY);
    currentY += splitDisclaimer.length * 5 + 10;
  }

  // Insider Tips
  if (
    Array.isArray(itinerary.insiderTips) &&
    itinerary.insiderTips.length > 0
  ) {
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("IV. CATERING & GASTRONOMY (TIPS)", 15, currentY);
    currentY += 8;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");

    itinerary.insiderTips.forEach((tip) => {
      const tipLines = doc.splitTextToSize(`- ${cleanString(tip)}`, 180);
      doc.text(tipLines, 15, currentY);
      currentY += tipLines.length * 5 + 2;
    });
  }

  currentY += 12;

  // Emerald Passenger Compliance Banner
  doc.setFillColor(240, 253, 244); // light emerald background
  doc.rect(20, currentY, 170, 24, "F");
  doc.setDrawColor(16, 185, 129); // emerald border
  doc.setLineWidth(0.4);
  doc.rect(20, currentY, 170, 24, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text("IMPORTANT: HARBOR MASTER SECURITY & INSURANCE DISCLOSURE", 24, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // Slate 700
  const bannerDesc = "To clear pier boarding, local Thai Sea Police require fully declared guest manifests. Scan or click this secure link to immediately sync companion names/passports to our database (no log-in required):";
  const splitBannerDesc = doc.splitTextToSize(bannerDesc, 162);
  doc.text(splitBannerDesc, 24, currentY + 10.5);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app';
  const bRef = itinerary.bookingReference || "";
  const manifestFullUrl = bRef ? `${originUrl}/?expressManifest=true&bookingId=${bRef}` : `${originUrl}/?expressManifest=true`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // Emerald-700
  doc.textWithLink("👉 CLICK & SYNC COMPANION MANIFEST TO LIVE LEDGER HERE", 24, currentY + 19.5, { url: manifestFullUrl });
  
  currentY += 32;

  // Policies
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("V. TERMS & CONDITIONS", 20, currentY);
  doc.setDrawColor(226, 232, 240);
  doc.line(20, currentY + 3, 190, currentY + 3);

  let policyY = currentY + 3.5;
  const policies = [
    "Estimates are based on standard seasonal charter rates, catering ingredients, and official partner services. Final binding invoices are offered dynamically by authorized Brokers depending on tidal height variances, exact state national park fees, and specific holiday surcharges.",
    "Under the regulations set by the Harbor Master Department of the Kingdom of Thailand, all charter passengers must wear approved marine safety life vests at all times during yacht transit. The onboard skipper and captain command the absolute authority to adjust or change scheduled destinations depending on safe wind conditions and maritime weather safety bulletins.",
    "Proper identification documents, such as a valid passport scan or Thai National ID copy, must be furnished via WhatsApp or Email direct synchronization at least 72 hours down to departure for official marine insurance registration and manifest approvals.",
  ];

  policies.forEach((policy) => {
    policyY += 4.5;
    const splitPolicy = doc.splitTextToSize(policy, 166);
    doc.text(splitPolicy, 20, policyY);
    policyY += (splitPolicy.length - 1) * 3;
  });

  // Page End Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const pdfFooterText2 = itinerary.agentName
    ? `${itinerary.agentName} | Ph: ${itinerary.customerPhone || ""}`
    : "Fast Proposal - Bespoke Interactive Customized Brochure";
  doc.text(pdfFooterText2, 20, 285);
  doc.text("Page 2 of 3", 190, 285, { align: "right" });

  // -------------------------------------------------------------
  // PAGE 3: Terms and Onboard Safety Rules
  // -------------------------------------------------------------
  doc.addPage();
  doc.setFillColor(15, 23, 42); // Deep Navy (#0F172A)
  doc.rect(0, 0, 210, 20, "F");

  let p3Y = 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("ONBOARD RULES & SAFETY REGULATIONS", 20, p3Y);
  p3Y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const rulesIntro =
    "Your compliance with yacht safety rules is fully mandatory to ensure a premium maritime voyage. The Captain and crew are the ultimate authority on board. Ensure you adhere to all policies.";
  const splitIntro = doc.splitTextToSize(rulesIntro, 170);
  doc.text(splitIntro, 20, p3Y);
  p3Y += splitIntro.length * 4 + 4;

  ONBOARD_CATEGORIES.forEach((cat) => {
    if (p3Y > 260) {
      doc.addPage();
      p3Y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanString(cat.titleEn).toUpperCase(), 20, p3Y);
    p3Y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    cat.rules.forEach((rule) => {
      if (p3Y > 270) {
        doc.addPage();
        p3Y = 20;
      }
      const bulletText = doc.splitTextToSize(`• ${cleanString(rule.en)}`, 165);
      doc.text(bulletText, 25, p3Y);
      p3Y += bulletText.length * 3.5;
    });
    p3Y += 3; // Space between categories
  });

  // Dual Interactive Signature Block
  p3Y += 10;
  if (p3Y > 230) {
    doc.addPage();
    p3Y = 25;
  }

  doc.setLineWidth(0.4);
  doc.setDrawColor(148, 163, 184); // Slate 300

  // Left: Guest Signature
  doc.line(20, p3Y + 20, 95, p3Y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("GUEST / CHARTERER SIGNATURE", 20, p3Y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Name: ${cleanString(itinerary.customerName || "Valued Charterer")}`,
    20,
    p3Y + 28,
  );
  doc.text("Date: ____ / ____ / ________", 20, p3Y + 31);

  // Right: Company Representative Signature
  doc.line(115, p3Y + 20, 190, p3Y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("COMPANY REPESENTATIVE SIGNATURE", 115, p3Y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const repName = itinerary.agentName || "Phuket Yacht Charters Representative";
  doc.text(`Name: ${cleanString(repName)}`, 115, p3Y + 28);
  doc.text("Date: ____ / ____ / ________", 115, p3Y + 31);

  return doc;
};

export interface CaptainManifestPassenger {
  name: string;
  nationality?: string;
  age?: string | number;
  passport?: string;
  passportExpiry?: string;
  timestamp?: string;
}

export interface CaptainManifestCrew {
  name: string;
  role?: string;
  timestamp?: string;
}

export interface CaptainManifestData {
  id: string;
  clientName: string;
  customerEmail?: string;
  charterDate?: string;
  vesselName?: string;
  guestCount?: string | number;
  hotelPickupLocation?: string;
  passengers?: CaptainManifestPassenger[];
  crew?: CaptainManifestCrew[];
  boardingStatus?: string;
  boardedAt?: string;
}

export const generateCaptainManifestPdf = (data: CaptainManifestData) => {
  const doc = new jsPDF("p", "mm", "a4");

  // Design system constants matching executive slate & emerald style
  const slateDark = [15, 23, 42]; // #0f172a
  const slateGray = [71, 85, 105]; // #475569
  const accentGold = [229, 140, 64]; // #E58c40
  const emeraldClear = [16, 185, 129]; // #10b981

  // Page boundaries (A4: 210 x 297 mm)
  const marginX = 15;
  let currentY = 15;

  // 1. Top Decorative Bar
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(0, 0, 210, 8, "F");
  currentY += 10;

  // 2. Offical Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("OFFICIAL VESSEL PASSENGER MANIFEST", marginX, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(
    "PORT OF DEPARTURE: PHUKET, THAILAND  •  FOR CAPTAIN & PORT OFFICIAL USE ONLY",
    marginX,
    currentY,
  );

  // Line separator
  currentY += 3;
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, 195, currentY);
  currentY += 8;

  // 3. Metadata Grid Info Box (Yacht, Date, Charterer, Status)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.rect(marginX, currentY, 180, 36, "FD");

  const drawMetaField = (
    label: string,
    value: string,
    x: number,
    y: number,
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label.toUpperCase(), x, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(value, x, y + 4.5);
  };

  const col1 = marginX + 5;
  const col2 = marginX + 65;
  const col3 = marginX + 125;

  // Lead Name, Yacht Name, Date
  drawMetaField(
    "Lead Charterer",
    data.clientName || "Valued Guest",
    col1,
    currentY + 6,
  );
  drawMetaField(
    "Vessel / Yacht",
    data.vesselName || "Premium Yacht",
    col2,
    currentY + 6,
  );
  drawMetaField(
    "Charter Date",
    data.charterDate || "Scheduled Departure",
    col3,
    currentY + 6,
  );

  // Manifest Count, ID / Ref, Boarding Clearance Status
  const paxCount = data.passengers ? data.passengers.length : 1;
  drawMetaField(
    "Manifest Count",
    `${paxCount} registered on-board`,
    col1,
    currentY + 20,
  );
  drawMetaField(
    "Booking Reference ID",
    (data.id || "N/A").toUpperCase(),
    col2,
    currentY + 20,
  );

  const isBoarded = data.boardingStatus === "Boarded";
  const statusStr = isBoarded
    ? "CLEARED / ACTIVE ON BOARD"
    : "PENDING BOARDING SIGN-OFF";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("MANIFEST VERIFICATION STATUS", col3, currentY + 20);

  if (isBoarded) {
    doc.setFillColor(209, 250, 229); // light green
    doc.rect(col3, currentY + 21, 51, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105); // emerald dark
    doc.text(statusStr, col3 + 2.5, currentY + 25.2);
  } else {
    doc.setFillColor(254, 243, 199); // light amber
    doc.rect(col3, currentY + 21, 51, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(217, 119, 6); // amber dark
    doc.text(statusStr, col3 + 2.5, currentY + 25.2);
  }

  currentY += 46;

  // 4. Passenger Tabular Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("PASSENGER & CREW RECOGNIZED MANIFEST LIST", marginX, currentY);
  currentY += 5;

  // Table Setup
  doc.setFillColor(15, 23, 42); // slate-900 table header background
  doc.rect(marginX, currentY, 180, 7.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("No.", marginX + 3, currentY + 5);
  doc.text("Passenger Name", marginX + 12, currentY + 5);
  doc.text("Nationality", marginX + 70, currentY + 5);
  doc.text("Age", marginX + 100, currentY + 5);
  doc.text("Passport No.", marginX + 115, currentY + 5);
  doc.text("Embarkation", marginX + 150, currentY + 5);

  currentY += 7.5;

  const passengers = data.passengers || [];

  if (passengers.length === 0) {
    // Fallback single line for lead passenger if list empty
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, currentY, 180, 10, "BD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text("1", marginX + 3, currentY + 6.5);
    doc.text(
      `${data.clientName || "Authenticated Guest"}`,
      marginX + 12,
      currentY + 6.5,
    );
    doc.text("N/A", marginX + 70, currentY + 6.5);
    doc.text("Adult", marginX + 100, currentY + 6.5);
    doc.text("VERIFIED", marginX + 115, currentY + 6.5);
    doc.text("--", marginX + 150, currentY + 6.5);
    currentY += 10;
  } else {
    passengers.forEach((pax, idx) => {
      // Row page-split check
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;

        // Re-draw table header on new page
        doc.setFillColor(15, 23, 42);
        doc.rect(marginX, currentY, 180, 7.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("No.", marginX + 3, currentY + 5);
        doc.text("Passenger Name", marginX + 12, currentY + 5);
        doc.text("Nationality", marginX + 70, currentY + 5);
        doc.text("Age", marginX + 100, currentY + 5);
        doc.text("Passport No.", marginX + 115, currentY + 5);
        doc.text("Embarkation", marginX + 150, currentY + 5);
        currentY += 7.5;
      }

      // Striped table row background
      const isEven = idx % 2 === 0;
      doc.setFillColor(
        isEven ? 255 : 248,
        isEven ? 255 : 250,
        isEven ? 255 : 252,
      );
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.rect(marginX, currentY, 180, 9, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      doc.text(String(idx + 1), marginX + 3, currentY + 6);

      // Safety truncates
      const truncate = (str: string, maxLen: number) =>
        str.length > maxLen ? str.substring(0, maxLen - 2) + ".." : str;

      doc.text(
        truncate((pax.name || "").toUpperCase(), 28),
        marginX + 12,
        currentY + 6,
      );
      doc.text(
        truncate((pax.nationality || "N/A").toUpperCase(), 12),
        marginX + 70,
        currentY + 6,
      );
      doc.text(pax.age ? `${pax.age} YRs` : "N/A", marginX + 100, currentY + 6);

      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.text(
        truncate((pax.passport || "AT PIER").toUpperCase(), 16),
        marginX + 115,
        currentY + 6,
      );

      const timestampStr = pax.timestamp
        ? new Date(pax.timestamp).toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            month: "short",
            day: "numeric",
          })
        : data.boardedAt
          ? new Date(data.boardedAt).toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              month: "short",
              day: "numeric",
            })
          : "--";
      doc.text(timestampStr, marginX + 150, currentY + 6);

      currentY += 9;
    });
  }

  // -- ADD CREW TABLE --
  const crewList = data.crew || [];
  if (crewList.length > 0) {
    currentY += 8;

    // Page split check before crew header
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text("CREW LIST & DUTY ROSTER", marginX, currentY);
    currentY += 5;

    // Table Setup
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(marginX, currentY, 180, 7.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("No.", marginX + 3, currentY + 5);
    doc.text("Full Legal Crew Name", marginX + 12, currentY + 5);
    doc.text("Assigned Role", marginX + 85, currentY + 5);
    doc.text("Sign-On Timestamp", marginX + 130, currentY + 5);

    currentY += 7.5;

    crewList.forEach((c, idx) => {
      // Row page-split check
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;

        // Re-draw table header on new page
        doc.setFillColor(15, 23, 42);
        doc.rect(marginX, currentY, 180, 7.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("No.", marginX + 3, currentY + 5);
        doc.text("Full Legal Crew Name", marginX + 12, currentY + 5);
        doc.text("Assigned Role", marginX + 85, currentY + 5);
        doc.text("Sign-On Timestamp", marginX + 130, currentY + 5);
        currentY += 7.5;
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(
        isEven ? 255 : 248,
        isEven ? 255 : 250,
        isEven ? 255 : 252,
      );
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.rect(marginX, currentY, 180, 9, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      doc.text(String(idx + 1), marginX + 3, currentY + 6);

      const truncate = (str: string, maxLen: number) =>
        str.length > maxLen ? str.substring(0, maxLen - 2) + ".." : str;

      doc.text(
        truncate((c.name || "Unknown").toUpperCase(), 35),
        marginX + 12,
        currentY + 6,
      );
      doc.text(
        truncate((c.role || "Crew").toUpperCase(), 20),
        marginX + 85,
        currentY + 6,
      );

      const timestampStr = c.timestamp
        ? new Date(c.timestamp).toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A";
      doc.setFont("courier", "bold");
      doc.text(timestampStr, marginX + 130, currentY + 6);

      currentY += 9;
    });
  }
  // -- END CREW TABLE --

  // 5. Shore Transfer Location Details
  if (data.hotelPickupLocation) {
    currentY += 8;
    // Page split check
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(marginX, currentY, 180, 15, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "COORDINATED SHORE TRANSFER & PICKUP COORDINATES",
      marginX + 4,
      currentY + 4.5,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(data.hotelPickupLocation, marginX + 4, currentY + 10);

    currentY += 15;
  }

  // 6. Captain Clearance & Roster Validation Sign-Off Block
  currentY += 12;
  // Make sure complete sign off block fits or goes to a clean new page
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(254, 254, 254);
  doc.setDrawColor(15, 23, 42); // slate-900 border
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, 180, 44, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "VESSEL CAPTAIN RESPONSIBILITY & CLEARANCE STATEMENT",
    marginX + 5,
    currentY + 6,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const disclaimerText = [
    "By signing this document, I, as the licensed Master Mariner and Vessel Captain of the nominated catamaran,",
    "hereby verify and certify that the passengers listed on this manifest correspond perfectly and legally with the",
    "physical roster checked on board. All safety briefings under Thai Maritime regulations have been fulfilled.",
    "The certified port office and crew shall keep a physical copy of this manifest on file during regional navigation.",
  ];

  disclaimerText.forEach((line, i) => {
    doc.text(line, marginX + 5, currentY + 12 + i * 3.5);
  });

  // Signature Lines for Captain & Port Officer
  const sigLineY = currentY + 36;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);

  // Captain Signature Line
  doc.line(marginX + 10, sigLineY, marginX + 85, sigLineY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VESSEL CAPTAIN MASTER SIGNATURE", marginX + 10, sigLineY + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "CAPTAIN NAME: ____________________________",
    marginX + 10,
    sigLineY + 6.5,
  );

  // Witnessing Port Authority Officer
  doc.line(marginX + 95, sigLineY, marginX + 170, sigLineY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    "WITNESSING CREW / PORT AUTHORITY OFFICER",
    marginX + 95,
    sigLineY + 3.5,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("SIGNATURE & DEPARTURE DATE / TIME", marginX + 95, sigLineY + 6.5);

  return doc;
};
