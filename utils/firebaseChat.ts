import { Platform } from 'react-native';
import { apiClient } from './api';
import { app, auth, firestore as webFirestore } from './firebase'; // Import the auth and firestore instances

// Import Firebase Firestore functions for web
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  increment,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from 'firebase/firestore';

// Import Firebase Auth functions for web
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';


let firestore: any = null;

// Initialize Firestore only if app is available
if (app) {
  if (Platform.OS !== 'web') {
    // Use React Native Firebase for mobile platforms
    try {
      const firestoreModule = require('@react-native-firebase/firestore').default;
      firestore = firestoreModule();
      console.log('React Native Firebase Firestore initialized');
    } catch (error) {
      console.error('React Native Firebase Firestore initialization error:', error);
    }
  } else {
    // Use Firebase JS SDK for web
    try {
      firestore = webFirestore || getFirestore(app);
      
      // Ensure network is enabled for web
      if (firestore) {
        enableNetwork(firestore).catch(error => {
          console.warn('Failed to enable Firestore network:', error);
        });
      }
      
      console.log('Firebase JS SDK Firestore initialized for web');
    } catch (error) {
      console.error('Firebase JS SDK Firestore initialization error:', error);
    }
  }
} else {
  console.warn('Firebase app not initialized, Firestore will not be available.');
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'farmer' | 'labour';
  message: string;
  timestamp: any;
  read: boolean;
}

export interface Chat {
  id: string;
  farmerId: string;
  farmerName: string;
  labourId: string;
  labourName: string;
  jobId: number;
  jobTitle: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: { [userId: string]: number };
  createdAt: any;
}

class FirebaseChatService {
  private firebaseToken: string | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private authStateUnsubscribe: (() => void) | null = null;

  async initializeAuth(): Promise<boolean> {
    try {
      if (!firestore) {
        console.error('Firestore not initialized');
        return false;
      }

      // Clear any existing auth state listener
      if (this.authStateUnsubscribe) {
        this.authStateUnsubscribe();
        this.authStateUnsubscribe = null;
      }

      // For web, ensure network connectivity before proceeding
      if (Platform.OS === 'web') {
        try {
          await enableNetwork(firestore);
          console.log('Firestore network enabled successfully');
        } catch (networkError) {
          console.warn('Network enable failed, continuing anyway:', networkError);
        }
      }

      // Set up auth state listener to handle token expiration
      if (Platform.OS === 'web') {
        this.authStateUnsubscribe = onAuthStateChanged(auth, (user) => {
          if (!user) {
            console.log('User signed out, may need to re-authenticate');
          } else {
            console.log('User authenticated:', user.uid);
          }
        });
      }

      // Get Firebase custom token from our API
      try {
        const response = await apiClient.getFirebaseToken();
        this.firebaseToken = response.firebase_token;
        
        if (!this.firebaseToken) {
          throw new Error('No Firebase token received from API');
        }
      } catch (apiError) {
        console.error('Failed to get Firebase token from API:', apiError);
        throw new Error('Failed to get authentication token from server');
      }

      if (Platform.OS !== 'web') {
        // React Native Firebase
        const authModule = require('@react-native-firebase/auth').default;
        await authModule().signInWithCustomToken(this.firebaseToken);
      } else {
        // Firebase JS SDK
        try {
          const userCredential = await signInWithCustomToken(auth, this.firebaseToken);
          console.log('Firebase authentication successful for user:', userCredential.user.uid);
        } catch (authError: any) {
          console.error('Custom token authentication failed:', authError);
          if (authError.code === 'auth/invalid-custom-token') {
            throw new Error('Invalid authentication token. Please check server configuration.');
          }
          throw authError;
        }
      }
      
      this.scheduleTokenRefresh();
      return true;
    } catch (error) {
      console.error('Firebase auth initialization error:', error);
      return false;
    }
  }

  private scheduleTokenRefresh() {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }
    // Refresh token 5 minutes before it expires (assuming 1 hour token lifetime)
    // Firebase custom tokens are valid for 1 hour (3600 seconds)
    const refreshInterval = (3600 - 300) * 1000; // 55 minutes in milliseconds
    this.tokenRefreshTimeout = setTimeout(async () => {
      console.log('Proactively refreshing Firebase custom token...');
      await this.refreshAuthToken();
    }, refreshInterval);
  }

  async refreshAuthToken(): Promise<boolean> {
    try {
      console.log('Attempting to refresh Firebase custom token...');
      
      // For web platform, sign out current user to clear any stale session
      if (Platform.OS === 'web' && auth && auth.currentUser) {
        try {
          console.log('Signing out current Firebase user...');
          await auth.signOut();
          console.log('Current Firebase user signed out.');
        } catch (signOutError) {
          console.warn('Error signing out user:', signOutError);
        }
      }

      try {
        const response = await apiClient.getFirebaseToken();
        this.firebaseToken = response.firebase_token;
        
        if (!this.firebaseToken) {
          throw new Error('No Firebase token received from API during refresh');
        }
        
        console.log('Received new Firebase custom token.');
      } catch (apiError) {
        console.error('Failed to get new Firebase token from API:', apiError);
        return false;
      }

      if (Platform.OS !== 'web') {
        const authModule = require('@react-native-firebase/auth').default;
        await authModule().signInWithCustomToken(this.firebaseToken);
      } else {
        await signInWithCustomToken(auth, this.firebaseToken);
      }
      
      console.log('Firebase custom token refreshed and signed in successfully.');
      this.scheduleTokenRefresh(); // Reschedule after successful refresh
      return true;
    } catch (error) {
      console.error('Error refreshing Firebase custom token:', error);
      return false;
    }
  }

  async waitForAuth(): Promise<boolean> {
    if (Platform.OS !== 'web' || !auth) {
      return true; // For non-web platforms or if auth is not available
    }

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  async createOrGetChat(
    farmerId: string,
    farmerName: string,
    labourId: string,
    labourName: string,
    jobId: number,
    jobTitle: string
  ): Promise<string> {
    if (!firestore) throw new Error('Firestore not initialized');

    // Wait for authentication to complete
    const isAuthenticated = await this.waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const chatId = `${farmerId}_${labourId}_${jobId}`;
    
    if (Platform.OS !== 'web') {
      // React Native Firebase
      const chatRef = firestore.collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();

      if (!chatDoc.exists) {
        await chatRef.set({
          farmerId,
          farmerName,
          labourId,
          labourName,
          jobId,
          jobTitle,
          unreadCount: {
            [farmerId]: 0,
            [labourId]: 0,
          },
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Firebase JS SDK
      const chatRef = doc(firestore, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          farmerId,
          farmerName,
          labourId,
          labourName,
          jobId,
          jobTitle,
          unreadCount: {
            [farmerId]: 0,
            [labourId]: 0,
          },
          createdAt: serverTimestamp(),
        });
      }
    }

    return chatId;
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    senderRole: 'farmer' | 'labour',
    message: string
  ): Promise<void> {
    if (!firestore) throw new Error('Firestore not initialized');

    // Wait for authentication to complete
    const isAuthenticated = await this.waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const receiverId = senderRole === 'farmer' ? chatId.split('_')[1] : chatId.split('_')[0];

    if (Platform.OS !== 'web') {
      // React Native Firebase
      const batch = firestore.batch();

      // Add message
      const messageRef = firestore.collection('messages').doc();
      batch.set(messageRef, {
        chatId,
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      // Update chat
      const chatRef = firestore.collection('chats').doc(chatId);
      batch.update(chatRef, {
        lastMessage: message,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        [`unreadCount.${receiverId}`]: firestore.FieldValue.increment(1),
      });

      await batch.commit();
    } else {
      // Firebase JS SDK
      const batch = writeBatch(firestore);

      // Add message
      await addDoc(collection(firestore, 'messages'), {
        chatId,
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Update chat
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${receiverId}`]: increment(1),
      });
    }
  }

  subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    if (!firestore) throw new Error('Firestore not initialized');

    let isSubscriptionActive = true;

    if (Platform.OS !== 'web') {
      let unsubscribe: () => void;

      const startListening = () => {
        if (!isSubscriptionActive) return;
        
        unsubscribe = firestore
          .collection('messages')
          .where('chatId', '==', chatId)
          .orderBy('timestamp', 'asc')
          .onSnapshot((snapshot: any) => {
            const messages = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            }));
            callback(messages);
          }, async (error: any) => {
            console.error('Firestore messages subscription error (RN Firebase):', error);
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
              if (isSubscriptionActive) {
                console.log('Authentication error, attempting to re-authenticate and re-subscribe.');
                unsubscribe(); // Unsubscribe the current listener
                const success = await this.refreshAuthToken();
                if (success && isSubscriptionActive) {
                  console.log('Re-authentication successful, re-subscribing to messages.');
                  startListening(); // Re-subscribe
                } else {
                  console.error('Failed to re-authenticate after Firestore error.');
                }
              }
            }
          });
      };

      startListening(); // Initial call to start listening

      return () => {
        isSubscriptionActive = false;
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Firebase JS SDK
      const messagesQuery = query(
        collection(firestore, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      let unsubscribe: () => void;

      const startListening = () => {
        if (!isSubscriptionActive) return;
        
        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(messages);
        }, async (error) => {
          console.error('Firestore messages subscription error (JS SDK):', error);
          if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            if (isSubscriptionActive) {
              console.log('Authentication error, attempting to re-authenticate and re-subscribe.');
              unsubscribe(); // Unsubscribe the current listener
              const success = await this.refreshAuthToken();
              if (success && isSubscriptionActive) {
                console.log('Re-authentication successful, re-subscribing to messages.');
                startListening(); // Re-subscribe
              } else {
                console.error('Failed to re-authenticate after Firestore error, cannot re-subscribe.');
              }
            }
          }
        });
      };

      startListening(); // Initial call to start listening

      return () => {
        isSubscriptionActive = false;
        if (unsubscribe) unsubscribe();
      };
    }
  }

  subscribeToChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    if (!firestore) throw new Error('Firestore not initialized');

    let isSubscriptionActive = true;

    if (Platform.OS !== 'web') {
      let unsubscribeFarmer: () => void;
      let unsubscribeLabour: () => void;

      const startListening = () => {
        if (!isSubscriptionActive) return;
        
        unsubscribeFarmer = firestore
          .collection('chats')
          .where('farmerId', '==', userId)
          .orderBy('lastMessageTime', 'desc')
          .onSnapshot((snapshot: any) => {
            const farmerChats = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            }));

            firestore
              .collection('chats')
              .where('labourId', '==', userId)
              .orderBy('lastMessageTime', 'desc')
              .onSnapshot((labourSnapshot: any) => {
                const labourChats = labourSnapshot.docs.map((doc: any) => ({
                  id: doc.id,
                  ...doc.data(),
                }));

                const allChats = [...farmerChats, ...labourChats];
                callback(allChats);
              });
          }, async (error: any) => {
            console.error('Firestore chats subscription error (RN Firebase):', error);
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
              if (isSubscriptionActive) {
                console.log('Authentication error, attempting to re-authenticate and re-subscribe.');
                unsubscribeFarmer(); // Unsubscribe the current listener
                const success = await this.refreshAuthToken();
                if (success && isSubscriptionActive) {
                  console.log('Re-authentication successful, re-subscribing to chats.');
                  startListening(); // Re-subscribe
                } else {
                  console.error('Failed to re-authenticate after Firestore error.');
                }
              }
            }
          });
      };

      startListening(); // Initial call to start listening

      return () => {
        isSubscriptionActive = false;
        if (unsubscribeFarmer) unsubscribeFarmer();
        if (unsubscribeLabour) unsubscribeLabour();
      };
    } else {
      // Firebase JS SDK
      const farmerQuery = query(
        collection(firestore, 'chats'),
        where('farmerId', '==', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const labourQuery = query(
        collection(firestore, 'chats'),
        where('labourId', '==', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const startListening = () => {
        if (!isSubscriptionActive) return;
        
        const unsubscribeFarmer = onSnapshot(farmerQuery, (snapshot) => {
          farmerChats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Chat[];
          callback([...farmerChats, ...labourChats]);
        }, async (error) => {
          console.error('Firestore farmer chats subscription error (JS SDK):', error);
          if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            if (isSubscriptionActive) {
              console.log('Authentication error, attempting to re-authenticate and re-subscribe.');
              unsubscribeFarmer(); // Unsubscribe the current listener
              const success = await this.refreshAuthToken();
              if (success && isSubscriptionActive) {
                console.log('Re-authentication successful, re-subscribing to farmer chats.');
                startListening(); // Re-subscribe
              } else {
                console.error('Failed to re-authenticate after Firestore error, cannot re-subscribe.');
              }
            }
          }
        });

        const unsubscribeLabour = onSnapshot(labourQuery, (snapshot) => {
          labourChats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Chat[];
          callback([...farmerChats, ...labourChats]);
        }, async (error) => {
          console.error('Firestore labour chats subscription error (JS SDK):', error);
          if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
            if (isSubscriptionActive) {
              console.log('Authentication error, attempting to re-authenticate and re-subscribe.');
              unsubscribeLabour(); // Unsubscribe the current listener
              const success = await this.refreshAuthToken();
              if (success && isSubscriptionActive) {
                console.log('Re-authentication successful, re-subscribing to labour chats.');
                startListening(); // Re-subscribe
              } else {
                console.error('Failed to re-authenticate after Firestore error, cannot re-subscribe.');
              }
            }
          }
        });

        return () => {
          isSubscriptionActive = false;
          unsubscribeFarmer();
          unsubscribeLabour();
        };
      };

      return startListening();
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    if (!firestore) throw new Error('Firestore not initialized');

    // Wait for authentication to complete
    const isAuthenticated = await this.waitForAuth();
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    if (Platform.OS !== 'web') {
      // React Native Firebase
      const batch = firestore.batch();

      // Reset unread count
      const chatRef = firestore.collection('chats').doc(chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });

      // Mark messages as read
      const messagesSnapshot = await firestore
        .collection('messages')
        .where('chatId', '==', chatId)
        .where('senderId', '!=', userId)
        .where('read', '==', false)
        .get();

      messagesSnapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } else {
      // Firebase JS SDK
      const batch = writeBatch(firestore);

      // Reset unread count
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });

      // Mark messages as read
      const messagesQuery = query(
        collection(firestore, 'messages'),
        where('chatId', '==', chatId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, { read: true });
      });

      await batch.commit();
    }
  }
}

export const firebaseChatService = new FirebaseChatService();
export { firestore };