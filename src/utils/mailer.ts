import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function sendBookingConfirmationEmail(payload: {
  toUids?: string[];
  to?: string[];
  bookingRequestRef: any;
  customerName: string;
}) {
  await addDoc(collection(db, "mail"), {
    to: payload.to,
    toUids: payload.toUids,
    message: {
      subject: `Booking Request Confirmed - ${payload.customerName}`,
      html: `Your booking request has been received. Our brokers will contact you soon.`,
    },
  });
}
