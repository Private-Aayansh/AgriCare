import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abcdef123456",
  // Add your actual config values here
};

// Initialize Firebase
let app;
let auth;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase app');
  }

  // Initialize Auth with proper persistence
  if (Platform.OS !== 'web') {
    // For React Native (iOS/Android) - use AsyncStorage persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('Firebase Auth initialized with AsyncStorage persistence');
    } catch (error: any) {
      // If initializeAuth fails (already initialized), fall back to getAuth
      if (error.code === 'auth/already-initialized') {
        console.log('Auth already initialized, using getAuth');
        auth = getAuth(app);
      } else {
        console.error('Auth initialization error:', error);
        auth = getAuth(app);
      }
    }
  } else {
    // For Web - use default persistence
    auth = getAuth(app);
    console.log('Firebase Auth initialized for web');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a fallback to prevent crashes
  auth = null;
}

export { app, auth };
export default app;