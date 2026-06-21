import { db } from "../firebase";
import { getPublicUrl } from "./url";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BookingEmailPayload {
  to: string;
  clientName: string;
  charterDate: string;
  vesselName: string;
  vesselModel: string;
  totalPrice?: string | number;
  excursionRoute?: string;
  guestCount: number;
  charterDuration: string;
  optInReminder?: boolean;
}

export async function sendBookingConfirmationEmail(
  customerEmail: string,
  payload: BookingEmailPayload,
  pdfBase64: string,
): Promise<{
  success: boolean;
  firestoreDocId?: string;
  isSimulated: boolean;
  error?: string;
}> {
  // 1. Build beautiful HTML email summary
  const formattedDate = payload.charterDate
    ? new Date(payload.charterDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "To be finalized";

  const formattedPrice = payload.totalPrice
    ? typeof payload.totalPrice === "number"
      ? payload.totalPrice.toLocaleString()
      : payload.totalPrice
    : "Upon Request";

  const emailSubject = `⛵ Booking Confirmation: Phuket Private Charter - ${payload.vesselName}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Private Catamaran Charter Summary</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF9F6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #FAF9F6; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #0F172A; padding: 35px; text-align: center; color: #ffffff; position: relative; }
        .header h1 { font-family: 'Georgia', serif; font-style: italic; font-weight: normal; margin: 0; font-size: 26px; letter-spacing: 1px; }
        .header p { margin: 8px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #34D399; font-weight: bold; }
        .content { padding: 40px 35px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 16px; margin-bottom: 25px; }
        .spec-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        .spec-table th { background-color: #F8FAFC; text-align: left; padding: 12px 16px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 1.5px solid #E2E8F0; }
        .spec-table td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A; }
        .spec-label { font-weight: bold; color: #475569; width: 40%; }
        .price-badge { background-color: #ECFDF5; border: 1px dashed #34D399; color: #065F46; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace; }
        .cta-btn { display: inline-block; background-color: #0F172A; color: #ffffff !important; text-decoration: none; padding: 14px 30px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 2px; margin: 20px 0; text-align: center; }
        .footer { background-color: #F1F5F9; padding: 25px 35px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
        .footer a { color: #0F172A; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="wrapper" style="width: 100%; background-color: #FAF9F6; padding: 40px 0;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden;">
          <div class="header" style="background-color: #0F172A; padding: 35px; text-align: center; color: #ffffff;">
            <div style="font-size: 30px; margin-bottom: 10px;">⛵</div>
            <h1 style="font-family: 'Georgia', serif; font-style: italic; font-weight: normal; margin: 0; font-size: 26px; color: #ffffff;">Phuket Custom Yacht Charters</h1>
            <p style="margin: 8px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #34D399; font-weight: bold;">Exclusive Journey Manifest & Confirmation</p>
          </div>
          <div class="content" style="padding: 40px 35px; color: #334155; line-height: 1.6;">
            <div class="greeting" style="font-size: 16px; margin-bottom: 25px;">Dear <strong>${payload.clientName}</strong>,</div>
            <p>Thank you for choosing us to curate your private yacht excursion. We are pleased to confirm your private catamaran booking details. Your bespoke travel quotation, security insurance manifest, and onboard itinerary has been generated successfully and is attached securely to this email as a PDF.</p>
            
            <table class="spec-table" style="width: 100%; border-collapse: collapse; margin: 25px 0;">
              <thead>
                <tr>
                  <th colspan="2" style="background-color: #F8FAFC; text-align: left; padding: 12px 16px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 1.5px solid #E2E8F0;">Charter Specifications</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Vessel Yacht</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A;"><strong>${payload.vesselName}</strong> (${payload.vesselModel})</td>
                </tr>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Charter Date</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A;">${formattedDate}</td>
                </tr>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Duration</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A; text-transform: uppercase;">${payload.charterDuration}</td>
                </tr>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Total Guests</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A;">${payload.guestCount} Passengers</td>
                </tr>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Destinations</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A;">${payload.excursionRoute || "Bespoke Direct Captain Route"}</td>
                </tr>
                <tr>
                  <td class="spec-label" style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; font-weight: bold; color: #475569; width: 40%;">Proposed Cost</td>
                  <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #0F172A;"><span class="price-badge" style="background-color: #ECFDF5; border: 1px dashed #34D399; color: #065F46; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-family: monospace;">${formattedPrice}</span></td>
                </tr>
              </tbody>
            </table>

            <p>Please review the detailed guidelines, departures pier protocols, passenger registers, and national marine park security rules outlined in the attached PDF brochure.</p>
            
            <p style="margin-top: 25px;">Should you need to modify any passenger listings, declare travel companions, or update your safety manifests, please log in anytime to your secure <strong>Charter Guest Workspace</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${getPublicUrl()}" class="cta-btn" style="display: inline-block; background-color: #0F172A; color: #ffffff !important; text-decoration: none; padding: 14px 30px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; border-radius: 2px;">Access Guest Workspace</a>
            </div>

            <p style="font-size: 11.5px; color: #64748B; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 15px;">
              *Note: This is an automated booking engine confirmation. Your representative broker has been notified and will coordinate with the captain and crew to finalize your onboard catering preferences.*
            </p>
          </div>
          <div class="footer" style="background-color: #F1F5F9; padding: 25px 35px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0;">
            <strong>Phuket Luxury Yacht Charters Ltd.</strong><br>
            Ao Po Pier & Chalong Marina Operations, Phuket, Thailand<br>
            <p style="margin-top: 10px; font-size: 10px;">Broker Managed Partnership • Standard Maritime Charter Contract Applies</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `.trim();

  // 2. Append booking summary email trigger documentation to Firestore 'mail' collection
  let firestoreDocId = "";
  try {
    const addDocPromise = addDoc(collection(db, "mail"), {
      to: [customerEmail],
      message: {
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `Phuket_Yacht_Charter_Booking_${payload.vesselName.replace(/\s+/g, "_")}.pdf`,
            content: pdfBase64,
            encoding: "base64",
            type: "application/pdf",
          },
        ],
      },
      createdAt: serverTimestamp(),
      status: "pending",
      metadata: {
        bookingId: payload.charterDate + "_" + payload.vesselName.slice(0, 5),
        clientName: payload.clientName,
        optInReminder: payload.optInReminder || false,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Quota/Offline write timeout - proceeding with local fallback",
            ),
          ),
        1500,
      ),
    );

    const mailDoc = await Promise.race([addDocPromise, timeoutPromise]);
    firestoreDocId = mailDoc.id;
    console.log(
      "Firestore mail triggered document created with id:",
      firestoreDocId,
    );
  } catch (err: any) {
    console.warn(
      "Skipped appending summary email trigger to Firestore (database offline/quota):",
      err,
    );
    // Dispatch global custom event for the UI to alert quota limit reached
    window.dispatchEvent(new CustomEvent("phuket_quota_exceeded"));
  }

  // 3. Direct Client-side trigger (Resend SMTP/API if VITE_RESEND_API_KEY is configured)
  let directSent = false;
  let errorMsg = undefined;

  // Clean fallback checks
  const resendApiKey = (import.meta as any).env?.VITE_RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Phuket Private Yacht <reservations@resend.dev>",
          to: [customerEmail],
          subject: emailSubject,
          html: emailHtml,
          attachments: [
            {
              filename: `Phuket_Yacht_Charter_Quotation_${payload.vesselName.replace(/\s+/g, "_")}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (response.ok) {
        directSent = true;
        console.log("Resend direct API integration successfully completed.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        errorMsg = errorData.message || JSON.stringify(errorData);
        console.warn(
          "Direct Resend email dispatch failed with error message:",
          errorMsg,
        );
      }
    } catch (e: any) {
      errorMsg = e.message || String(e);
      console.error(
        "Network interface error calling Direct Resend REST endpoint",
        e,
      );
    }
  }

  // 4. Fire DOM custom event so user interface overlay can immediately render delivery parameters
  const triggerPayload = {
    docId: firestoreDocId || `sim-${Date.now()}`,
    customerEmail,
    subject: emailSubject,
    html: emailHtml,
    pdfBase64,
    directSent,
    error: errorMsg,
    resendConfigured: !!resendApiKey,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent("email-triggered", { detail: triggerPayload }),
  );

  return {
    success: true,
    firestoreDocId,
    isSimulated: !directSent,
    error: errorMsg,
  };
}
