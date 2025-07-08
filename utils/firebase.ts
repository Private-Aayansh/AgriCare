import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

let auth: any = null;
let app: any = null;
let firestore: any = null;

if (Platform.OS !== 'web') {
  // Use React Native Firebase for mobile platforms
  try {
    const firebaseApp = require('@react-native-firebase/app').default;
    const firebaseAuth = require('@react-native-firebase/auth').default;
    
    app = firebaseApp;
    auth = firebaseAuth();
    
    console.log('React Native Firebase initialized');
  } catch (error) {
    console.error('React Native Firebase initialization error:', error);
  }
} else {
  // Use Firebase JS SDK for web
  try {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyC2rnbhBwXSqIbypfOU4ywrc2PG9fY_rR8",
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "agricare-68b19.firebaseapp.com",
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://agricare-68b19-default-rtdb.firebaseio.com",
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "agricare-68b19",
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "agricare-68b19.firebasestorage.app",
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "872782355781",
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:872782355781:web:3d2aada85d4f2c9519b22c",
    };

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    firestore = getFirestore(app);
    
    // Configure auth settings for better custom token handling
    auth.settings = {
      appVerificationDisabledForTesting: __DEV__,
    };
    
    console.log('Firebase JS SDK initialized for web');
  } catch (error) {
    console.error('Firebase JS SDK initialization error:', error);
  }
}

export { app, auth, firestore };
export default app;