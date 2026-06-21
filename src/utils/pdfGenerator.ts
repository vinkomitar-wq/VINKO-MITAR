import { jsPDF } from "jspdf";
import { CATAMARANS } from "../data";
import { VESSEL_BASE_RATES } from "../components/VesselCard";
import QRCode from "qrcode";
import { getPublicUrl } from "./url";

export const generateAgentPdfQuote = async (
  proposal: any,
  currentAgent: any,
  returnBlob = false,
): Promise<any> => {
  const doc = new jsPDF("p", "mm", "a4");

  const formatPrice = (thbValue: number) => {
    return new Intl.NumberFormat("en-US").format(thbValue) + " THB";
  };

  const clean = (str: string) => {
    if (!str) return "";
    return str
      .replace(/[\uD800-\uDFFF]./g, "")
      .replace(/[^\x00-\x7F]/g, " ")
      .trim();
  };

  const addFooter = (pageNo: number) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 280, 210, 17, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 280, 210, 280);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Prepared by ${currentAgent?.name || "Agent"} — Generated on ${new Date().toLocaleDateString()}`,
      20,
      289,
    );
    doc.text(`Page ${pageNo}`, 190, 289, { align: "right" });
  };

  // Header Panel
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");

  // Emerald Accent line
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 40, 210, 1.5, "F");

  const headerBrandName = currentAgent?.companyName
    ? currentAgent.companyName.toUpperCase()
    : currentAgent?.name?.toUpperCase() || "PRIVATE YACHT CHARTER PROPOSAL";
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(headerBrandName, 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text("BESPOKE PRIVATE CATAMARAN PROPOSAL", 20, 28);

  // Right Side Brand
  const agencyTitle = proposal.agencyDetailsOverride
    ? proposal.agencyDetailsOverride.split("\n")[0]
    : currentAgent?.companyName || "LUXURY CHARTER SERVICE";
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(agencyTitle.toUpperCase().substring(0, 35), 190, 20, {
    align: "right",
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const preparer = currentAgent?.name
    ? `PREPARED BY: ${currentAgent.name.toUpperCase()}`
    : "PREPARED FOR CLIENT";
  doc.text(preparer, 190, 28, { align: "right" });

  let currentY = 58;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PROPOSAL DETAILS", 20, currentY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 4, 190, currentY + 4);

  currentY += 14;

  const drawMeta = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(clean(value), x, y + 5);
  };

  drawMeta(
    "CLIENT GUEST NAME",
    proposal.clientName || "Interested Guest",
    20,
    currentY,
  );
  drawMeta(
    "PROPOSED DATE",
    proposal.charterDate || "To be Determined",
    110,
    currentY,
  );

  currentY += 16;
  drawMeta(
    "BROKER/AGENT",
    currentAgent?.name || "Authorized Broker",
    20,
    currentY,
  );
  drawMeta(
    "BROKER CONTACT",
    currentAgent?.whatsapp || currentAgent?.contactPhone || "-",
    110,
    currentY,
  );

  if (proposal.agencyDetailsOverride) {
    currentY += 16;
    drawMeta(
      "AGENCY / NOTES",
      proposal.agencyDetailsOverride.replace(/\n/g, " - "),
      20,
      currentY,
    );
  } else if (currentAgent?.companyName) {
    currentY += 16;
    drawMeta("AGENCY", currentAgent.companyName, 20, currentY);
  }

  currentY += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("YACHT COMPARISON SELECTION", 20, currentY);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, currentY + 4, 190, currentY + 4);

  currentY += 14;

  let pageNumber = 1;

  const renderVesselInPdf = (
    vesselObj: any,
    customPrice: string,
    yPos: number,
  ) => {
    if (!vesselObj) return yPos;

    if (yPos + 55 > 265) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      yPos = 20;
    }

    doc.setFillColor(250, 250, 250);
    doc.rect(20, yPos, 170, 52, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, yPos, 170, 52, "S");

    // Side accent line
    doc.setFillColor(16, 185, 129);
    doc.rect(20.3, yPos + 0.3, 3, 51.4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      clean(vesselObj.name) + "  |  " + clean(vesselObj.model),
      28,
      yPos + 9,
    );

    // Specs Tagline
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `CAPACITY: ${vesselObj.capacity} PAX   •   SIZE: ${vesselObj.length}   •   CABINS: ${vesselObj.cabins}`,
      28,
      yPos + 17,
    );

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(clean(vesselObj.description), 156);
    doc.text(splitDesc, 28, yPos + 24);

    // Price Tag (bottom right)
    if (!proposal.hidePricesOnPdf) {
      doc.setFillColor(241, 245, 249);
      doc.rect(125, yPos + 38, 62, 11, "F"); // Background block for price
      doc.setDrawColor(203, 213, 225);
      doc.rect(125, yPos + 38, 62, 11, "S");

      if (customPrice) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Proposed Rate", 130, yPos + 45);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(customPrice, 184, yPos + 45.5, { align: "right" });
      } else {
        const basePriceInfo = VESSEL_BASE_RATES[vesselObj.id];
        if (basePriceInfo) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text("Starts from", 130, yPos + 45);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(71, 85, 105);
          doc.text(formatPrice(basePriceInfo.halfday), 184, yPos + 45.5, {
            align: "right",
          });
        }
      }
    }

    return yPos + 58;
  };

  const vessel1 = CATAMARANS.find((v) => v.id === proposal.vesselId1);
  const vessel2 = CATAMARANS.find((v) => v.id === proposal.vesselId2);
  const vessel3 =
    proposal.compareCount === 3
      ? CATAMARANS.find((v) => v.id === proposal.vesselId3)
      : null;

  currentY = renderVesselInPdf(vessel1, proposal.price1, currentY);

  if (vessel2 && vessel2.id !== vessel1?.id) {
    currentY = renderVesselInPdf(vessel2, proposal.price2, currentY);
  }

  if (vessel3 && vessel3.id !== vessel1?.id && vessel3.id !== vessel2?.id) {
    currentY = renderVesselInPdf(vessel3, proposal.price3, currentY);
  }

  const parsePriceNo = (val: string | number) => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    const digits = val.replace(/[^\d]/g, "");
    return Number(digits) || 0;
  };

  const formatNumberAsPrice = (num: number) => {
    return num.toLocaleString() + " THB";
  };

  const lineItems = proposal.customLineItems || [];
  const hasExtras = lineItems.length > 0;
  const extrasSum = lineItems.reduce(
    (acc: number, item: any) => acc + item.price * item.qty,
    0,
  );

  if (hasExtras) {
    if (currentY + 30 > 265) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("OFFERED OPTIONS & SERVICE EXTRA CHARGES", 20, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY + 3, 190, currentY + 3);

    currentY += 10;

    // Header row for line items
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, 170, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text("SERVICE / OPTION DESCRIPTION", 24, currentY + 4.8);
    doc.text("UNIT RATE", 105, currentY + 4.8, { align: "right" });
    doc.text("QTY", 125, currentY + 4.8, { align: "right" });
    doc.text("UNIT", 148, currentY + 4.8, { align: "right" });
    doc.text("TOTAL PRICE", 185, currentY + 4.8, { align: "right" });

    currentY += 7;

    lineItems.forEach((item: any, idx: number) => {
      if (currentY + 10 > 265) {
        addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        currentY = 20;

        // Re-draw header table
        doc.setFillColor(241, 245, 249);
        doc.rect(20, currentY, 170, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text("SERVICE / OPTION DESCRIPTION", 24, currentY + 4.8);
        doc.text("UNIT RATE", 105, currentY + 4.8, { align: "right" });
        doc.text("QTY", 125, currentY + 4.8, { align: "right" });
        doc.text("UNIT", 148, currentY + 4.8, { align: "right" });
        doc.text("TOTAL PRICE", 185, currentY + 4.8, { align: "right" });
        currentY += 7;
      }

      // Row background
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 252);
        doc.rect(20, currentY, 170, 6.5, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(clean(item.name || "Custom item"), 24, currentY + 4.4);
      doc.text(formatNumberAsPrice(item.price), 105, currentY + 4.4, {
        align: "right",
      });
      doc.text(String(item.qty), 125, currentY + 4.4, { align: "right" });
      doc.text(clean(item.unit || "charter"), 148, currentY + 4.4, {
        align: "right",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatNumberAsPrice(item.price * item.qty),
        185,
        currentY + 4.4,
        { align: "right" },
      );

      currentY += 6.5;
    });

    // Total Extras Row
    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY, 190, currentY);
    currentY += 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("EXTRAS & UPGRADE SUB-TOTAL:", 135, currentY + 4, {
      align: "right",
    });
    doc.setTextColor(16, 185, 129);
    doc.text(formatNumberAsPrice(extrasSum), 185, currentY + 4, {
      align: "right",
    });

    currentY += 10;
  }

  if (!proposal.hidePricesOnPdf) {
    if (currentY + 35 > 265) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      currentY = 20;
    }

    // Grand Total Price Estimates Summary block
    doc.setFillColor(244, 252, 248);
    doc.rect(20, currentY, 170, 25, "F");
    doc.setDrawColor(167, 243, 208);
    doc.rect(20, currentY, 170, 25, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    doc.text(
      "FINAL GRAND ESTIMATES (BASE VESSEL + ALL SELECTED OPTIONS)",
      24,
      currentY + 6,
    );

    let rate1 = parsePriceNo(proposal.price1);
    let grandTotal1 = rate1 + extrasSum;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    if (vessel1) {
      doc.text(
        `${vessel1.name.toUpperCase().substring(0, 16)}: ${formatNumberAsPrice(grandTotal1)}`,
        24,
        currentY + 16,
      );
    }

    if (vessel2 && vessel2.id !== vessel1?.id) {
      let rate2 = parsePriceNo(proposal.price2);
      let grandTotal2 = rate2 + extrasSum;
      doc.text(
        `${vessel2.name.toUpperCase().substring(0, 16)}: ${formatNumberAsPrice(grandTotal2)}`,
        80,
        currentY + 16,
      );
    }

    if (vessel3 && vessel3.id !== vessel1?.id && vessel3.id !== vessel2?.id) {
      let rate3 = parsePriceNo(proposal.price3);
      let grandTotal3 = rate3 + extrasSum;
      doc.text(
        `${vessel3.name.toUpperCase().substring(0, 16)}: ${formatNumberAsPrice(grandTotal3)}`,
        136,
        currentY + 16,
      );
    }

    currentY += 32;
  }

  if (currentY + 55 > 265) {
    addFooter(pageNumber);
    doc.addPage();
    pageNumber++;
    currentY = 20;
  }

  // Inclusions Block
  doc.setFillColor(248, 250, 252);
  doc.rect(20, currentY, 170, 31, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(20, currentY, 170, 31, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("STANDARD CHARTER INCLUSIONS", 26, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "• Professional Captain & Crew included in base limits.",
    26,
    currentY + 15,
  );
  doc.text(
    "• Drinking water, soft drinks, seasonal fruits.",
    26,
    currentY + 20,
  );
  doc.text(
    "• Use of on-board facilities, standard snorkeling equipment, life jackets.",
    26,
    currentY + 25,
  );
  doc.text(
    "• Comprehensive Marine Travel Insurance for all passengers.",
    26,
    currentY + 30,
  );

  currentY += 43;

  // Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("AUTHORIZATION & REMARKS", 20, currentY);
  doc.setDrawColor(226, 232, 240);
  doc.line(20, currentY + 4, 190, currentY + 4);

  currentY += 24;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);

  // Broker
  doc.line(20, currentY, 80, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    currentAgent ? currentAgent.name : "Authorized Broker",
    20,
    currentY + 6,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Yacht Representative", 20, currentY + 11);

  // Client
  doc.line(130, currentY, 190, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(proposal.clientName || "Client Confirmed", 130, currentY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Booking Reference Check", 130, currentY + 11);

  addFooter(pageNumber);

  const itineraryUrl = `${getPublicUrl()}/itinerary/${proposal.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(itineraryUrl);
  doc.addImage(qrCodeDataUrl, "PNG", 160, 245, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Scan for Itinerary", 175, 278, { align: "center" });

  if (returnBlob) {
    return doc.output("blob");
  }

  const clientNameClean = (proposal.clientName || "quote")
    .toLowerCase()
    .replace(/\s+/g, "_");
  doc.save(`phuket_charter_proposal_${clientNameClean}_quote.pdf`);
};
