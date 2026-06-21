import { storage, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadChatFileBlob(
  inquiryId: string,
  file: Blob,
  fileName: string,
): Promise<string> {
  const uid = auth.currentUser?.uid || "anonymous";
  const storageRef = ref(
    storage,
    `inquiries/${uid}/${inquiryId}/${Date.now()}_${fileName}`,
  );
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function uploadChatDataUrl(
  inquiryId: string,
  dataUrl: string,
  fileName: string,
): Promise<string> {
  // Convert dataUrl to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const uid = auth.currentUser?.uid || "anonymous";
  const storageRef = ref(
    storage,
    `inquiries/${uid}/${inquiryId}/${Date.now()}_${fileName}`,
  );
  const snapshot = await uploadBytes(storageRef, blob);
  return await getDownloadURL(snapshot.ref);
}
