import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// All values are loaded from environment variables (.env file)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  // Only initialize if we have at least an API key, otherwise mock/fail gracefully
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.warn(
      "Firebase config missing. App will run in demo/offline mode where possible."
    );
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Export safe instances or nulls.
// Consumers (AuthContext, TaskContext) need to handle nulls.
// Re-exporting `getAuth` helper wrapper if needed or just using the SDK.
// Actually, standard pattern is to export the initialized services.

import { getAuth } from "firebase/auth";
const safeAuth = app ? getAuth(app) : null;

export { db, safeAuth as auth };
