import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();

const DB_ID = "ai-studio-9ef1e50a-1195-4446-b8c2-518eefb30d2e";
const db = getFirestore(DB_ID);

export type BookingStatus =
  | "draft" | "quoted" | "accepted" | "confirmed" | "completed" | "declined" | "cancelled";

export const onProposalStatusChange = onDocumentUpdated(
  { document: "proposals/{id}", database: DB_ID },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const id = event.params.id;
    const ref = db.collection("proposals").doc(id);
    const clientName = after.clientName || "Charter Guest";
    const agentEmail = (after.agentEmail || after.brokerEmail || "").toLowerCase();

    await ref.update({
      statusHistory: FieldValue.arrayUnion({
        status: after.status, at: new Date().toISOString(),
      }),
    });

    if (after.status === "accepted") {
      await db.collection("adminAlerts").doc(`accepted_${id}`).set({
        title: "Quote Accepted by Client",
        message: `${clientName} accepted ${agentEmail || "an agent"}'s quote.`,
        details: `Proposal ${id} • Vessel ${after.vesselId1 || "N/A"} • ${after.charterDate || ""}`,
        type: "booking", read: false, timestamp: new Date().toISOString(),
      });
      if (agentEmail) {
        await db.collection("agent_notifications").add({
          agentEmail, proposalId: id, kind: "accepted",
          message: `${clientName} accepted your quote. Forward it to the captain when ready.`,
          read: false, createdAt: new Date().toISOString(),
        });
      }
    }

    if (after.status === "confirmed") {
      const vesselId = after.vesselId1 || "";
      let captainUid = after.assignedCaptainUid || "";
      let captainName = after.assignedCaptainName || "";
      if (!captainUid && vesselId) {
        const capSnap = await db.collection("captains")
          .where("yachtId", "==", vesselId).limit(1).get();
        if (!capSnap.empty) {
          captainUid = capSnap.docs[0].id;
          captainName = capSnap.docs[0].data().name || captainName;
          await ref.update({ assignedCaptainUid: captainUid, assignedCaptainName: captainName });
        }
      }

      await db.collection("captain_notifications").add({
        captainUid: captainUid || "unassigned",
        vesselId, proposalId: id, clientName,
        charterDate: after.charterDate || "",
        message: `New confirmed charter for ${clientName} on ${vesselId || "your vessel"}.`,
        read: false, createdAt: new Date().toISOString(),
      });

      await ref.update({ sentToCaptain: true, sentToCaptainAt: new Date().toISOString() });

      await db.collection("adminAlerts").doc(`confirmed_${id}`).set({
        title: captainUid ? "Booking Forwarded to Captain" : "Booking Confirmed — NO CAPTAIN MATCHED",
        message: captainUid
          ? `${clientName}'s charter on ${vesselId} assigned to Capt. ${captainName}.`
          : `${clientName}'s charter on ${vesselId} has no captain assigned — please assign one.`,
        type: "booking", read: false, timestamp: new Date().toISOString(),
      });
    }
  }
);

export const onInquiryDecision = onDocumentUpdated(
  { document: "inquiries/{id}", database: DB_ID },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.proposalStatus === after.proposalStatus) return;
    if (!["accepted", "declined"].includes(after.proposalStatus)) return;

    const inquiryId = event.params.id;
    let proposalRef = after.proposalId
      ? db.collection("proposals").doc(after.proposalId)
      : null;

    if (!proposalRef) {
      const snap = await db.collection("proposals")
        .where("inquiryId", "==", inquiryId).limit(1).get();
      if (!snap.empty) proposalRef = snap.docs[0].ref;
    }
    if (!proposalRef) return;

    await proposalRef.update({
      status: after.proposalStatus === "accepted" ? "accepted" : "declined",
    });
  }
);

export const onProposalCreated = onDocumentCreated(
  { document: "proposals/{id}", database: DB_ID },
  async (event) => {
    const data = event.data?.data();
    if (!data || data.status) return;
    await event.data!.ref.update({ status: "quoted" });
  }
);
