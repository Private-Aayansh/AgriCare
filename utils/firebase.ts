import { Platform } from 'react-native';

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
    const { initializeApp, getApps } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    
    const firebaseConfig = {
      apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
    };

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    console.log('Firebase JS SDK initialized for web');
  } catch (error) {
    console.error('Firebase JS SDK initialization error:', error);
  }
}

export { app, auth };
export default app;