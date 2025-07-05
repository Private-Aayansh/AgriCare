import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
let app;
let auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Auth with persistence for React Native
  if (Platform.OS !== 'web') {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (error) {
      // If initializeAuth fails, fall back to getAuth
      console.log('Falling back to getAuth');
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create a fallback auth object to prevent crashes
  auth = null;
}

export { app, auth };