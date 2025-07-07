import { Platform } from 'react-native';
import { apiClient } from './api';

let firestore: any = null;

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
    const { getFirestore } = require('firebase/firestore');
    const { app } = require('./firebase');
    
    if (app) {
      firestore = getFirestore(app);
      console.log('Firebase JS SDK Firestore initialized for web');
    }
  } catch (error) {
    console.error('Firebase JS SDK Firestore initialization error:', error);
  }
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

  async initializeAuth(): Promise<boolean> {
    try {
      if (!firestore) {
        console.error('Firestore not initialized');
        return false;
      }

      // Get Firebase custom token from our API
      const response = await apiClient.getFirebaseToken();
      this.firebaseToken = response.firebase_token;

      if (Platform.OS !== 'web') {
        // React Native Firebase
        const auth = require('@react-native-firebase/auth').default;
        await auth().signInWithCustomToken(this.firebaseToken);
      } else {
        // Firebase JS SDK
        const { getAuth, signInWithCustomToken } = require('firebase/auth');
        const auth = getAuth();
        await signInWithCustomToken(auth, this.firebaseToken);
      }

      console.log('Firebase authentication successful');
      return true;
    } catch (error) {
      console.error('Firebase auth initialization error:', error);
      return false;
    }
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
      const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');
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
      const { collection, doc, addDoc, updateDoc, serverTimestamp, increment, writeBatch } = require('firebase/firestore');
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

    if (Platform.OS !== 'web') {
      // React Native Firebase
      return firestore
        .collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot: any) => {
          const messages = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(messages);
        });
    } else {
      // Firebase JS SDK
      const { collection, query, where, orderBy, onSnapshot } = require('firebase/firestore');
      const messagesQuery = query(
        collection(firestore, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(messages);
      });
    }
  }

  subscribeToChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    if (!firestore) throw new Error('Firestore not initialized');

    if (Platform.OS !== 'web') {
      // React Native Firebase
      return firestore
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
        });
    } else {
      // Firebase JS SDK
      const { collection, query, where, orderBy, onSnapshot } = require('firebase/firestore');
      
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

      let farmerChats: Chat[] = [];
      let labourChats: Chat[] = [];

      const unsubscribeFarmer = onSnapshot(farmerQuery, (snapshot) => {
        farmerChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        callback([...farmerChats, ...labourChats]);
      });

      const unsubscribeLabour = onSnapshot(labourQuery, (snapshot) => {
        labourChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        callback([...farmerChats, ...labourChats]);
      });

      return () => {
        unsubscribeFarmer();
        unsubscribeLabour();
      };
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    if (!firestore) throw new Error('Firestore not initialized');

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
      const { doc, updateDoc, collection, query, where, getDocs, writeBatch } = require('firebase/firestore');
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