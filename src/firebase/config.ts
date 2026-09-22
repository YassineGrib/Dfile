import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Project: fintask-app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB9c6stdrCjopbGYPK2TxV9GHXkMYaKk0g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fintask-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fintask-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fintask-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "401380699771",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:401380699771:web:8cf87398f306083e123cde",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W7RJWTVSEH"
};

// Check if credentials are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully for fintask-app');
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
}

export { app, auth, db, googleProvider };
