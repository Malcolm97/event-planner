// Firebase client SDK initialization
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAtV9Dxwf1czjyxZ_RiYPkiptTbqtHJr_c",
  authDomain: "event-planner-b8da2.firebaseapp.com",
  projectId: "event-planner-b8da2",
  storageBucket: "event-planner-b8da2.appspot.com",
  messagingSenderId: "683229987603",
  appId: "1:683229987603:web:36358563c704c74019d0e6",
  measurementId: "G-9WH4PEXLDK"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Only initialize analytics in the browser (client-side)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
