import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCU23Kg1rjBeH-UztQPduQvb-9h6EoL49A",
  authDomain: "fridge-whisperer-e632b.firebaseapp.com",
  projectId: "fridge-whisperer-e632b",
  storageBucket: "fridge-whisperer-e632b.firebasestorage.app",
  messagingSenderId: "247935484158",
  appId: "1:247935484158:web:b2502cdef46b6d4530e5af",
  measurementId: "G-W4N4KS63Q6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };

export async function syncToCloud(householdId: string, data: any) {
  if (!db || !householdId) return;
  try {
    const docRef = doc(db, "households", householdId);
    await setDoc(docRef, data, { merge: true });
  } catch (e) {
    console.error("Cloud sync failed:", e);
  }
}

export function listenToCloud(householdId: string, callback: (data: any) => void) {
  if (!db || !householdId) return () => {};
  try {
    const docRef = doc(db, "households", householdId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback({ inventory: [], shoppingList: [] });
      }
    }, (error) => {
      console.error("Firebase sync error:", error);
    });
  } catch (e) {
    console.error("Failed to setup cloud listener:", e);
    return () => {};
  }
}