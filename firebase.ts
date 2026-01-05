import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdVmd0tMmMMHoljusebQ3fvSjHbxFpFy0",
  authDomain: "gestaoprojects.firebaseapp.com",
  projectId: "gestaoprojects",
  storageBucket: "gestaoprojects.firebasestorage.app",
  messagingSenderId: "446514075562",
  appId: "1:446514075562:web:865f6d349f04c49c9dbdd3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db_firestore = getFirestore(app);