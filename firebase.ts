import * as firebaseApp from "firebase/app";
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

// Fixed: Using namespace import for firebase/app to ensure initializeApp and app management functions 
// are correctly resolved across different TypeScript and bundler configurations.
const app = firebaseApp.getApps().length > 0 
  ? firebaseApp.getApp() 
  : firebaseApp.initializeApp(firebaseConfig);

// Exportação de instâncias registradas
export const auth = getAuth(app);
export const db_firestore = getFirestore(app);