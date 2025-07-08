import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';

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
      apiKey: "AIzaSyCWkrMAHqO23yJ9or7oA918T6u2eZFixrw",
      authDomain: "agricare-68b19.firebaseapp.com",
      projectId: "agricare-68b19",
      storageBucket: "agricare-68b19.firebasestorage.app",
      messagingSenderId: "872782355781",
      appId: "1:872782355781:web:3d2aada85d4f2c9519b22c",
    };

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    firestore = getFirestore(app);
    
    console.log('Firebase JS SDK initialized for web');
  } catch (error) {
    console.error('Firebase JS SDK initialization error:', error);
  }
}

export { app, auth, firestore };
export default app;