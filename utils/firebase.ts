import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let auth: any = null;
let app: any = null;

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
      apiKey: "AIzaSyC2rnbhBwXSqIbypfOU4ywrc2PG9fY_rR8",
      authDomain: "agricare-68b19.firebaseapp.com",
      databaseURL: "https://agricare-68b19-default-rtdb.firebaseio.com",
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
    
    // Enable offline persistence for better reliability
    import('firebase/firestore').then(({ enableNetwork, connectFirestoreEmulator }) => {
      const firestore = import('firebase/firestore').then(({ getFirestore }) => getFirestore(app));
      
      // Enable network connectivity
      firestore.then(db => {
        enableNetwork(db).catch(error => {
          console.warn('Failed to enable Firestore network:', error);
        });
      });
    });
    
    console.log('Firebase JS SDK initialized for web');
  } catch (error) {
    console.error('Firebase JS SDK initialization error:', error);
  }
}

export { app, auth };
export default app;