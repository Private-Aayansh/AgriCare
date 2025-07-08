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
      authDomain: "expo-template-default-rtdb.firebaseapp.com",
      databaseURL: "https://expo-template-default-rtdb-default-rtdb.firebaseio.com",
      projectId: "expo-template-default-rtdb",
      storageBucket: "expo-template-default-rtdb.appspot.com",
      messagingSenderId: "644779229873",
      appId: "1:644779229873:web:8cebc6dc40ff2748"
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