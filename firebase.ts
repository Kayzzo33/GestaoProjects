import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do projeto gestaoprojects
const firebaseConfig = {
  apiKey: "AIzaSyBdVmd0tMmMMHoljusebQ3fvSjHbxFpFy0",
  authDomain: "gestaoprojects.firebaseapp.com",
  projectId: "gestaoprojects",
  storageBucket: "gestaoprojects.firebasestorage.app",
  messagingSenderId: "446514075562",
  appId: "1:446514075562:web:865f6d349f04c49c9dbdd3"
};

// Fix: Initializing Firebase app with check for existing instances to comply with v9+ Modular SDK
// Using named imports initializeApp, getApp, and getApps from 'firebase/app'
const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

// Exportação de instâncias registradas
export const auth = getAuth(app);
export const db_firestore = getFirestore(app);