const admin = require('firebase-admin');

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    // Check if we have the required environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      
      // Clean up the private key - remove quotes and fix newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        .replace(/^"|"$/g, '') // Remove surrounding quotes if present
        .replace(/\\n/g, '\n'); // Convert \n to actual newlines
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://plan-outings-user-data-default-rtdb.firebaseio.com'
      });
      
      console.log('✅ Firebase Admin initialized successfully');
      return true;
    } else {
      console.log('❌ Firebase environment variables missing, using mock data only');
      return false;
    }
  } catch (error) {
    console.log('❌ Firebase initialization failed:', error.message);
    return false;
  }
};

// Initialize Firebase
const firebaseInitialized = initializeFirebase();
const db = firebaseInitialized ? admin.database() : null;

class FirebaseService {
  async getChatMessages(chatId, limit = 50) {
    try {
      if (!firebaseInitialized || !db) {
        console.log('❌ Firebase not available, using mock data');
        return this.getMockMessages(chatId);
      }

      console.log(`📥 Fetching real chat messages for: ${chatId}`);
      
      const messagesRef = db.ref(`chats/${chatId}/messages`);
      const snapshot = await messagesRef
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');
      
      if (!snapshot.exists()) {
        console.log(`❌ No messages found for chat: ${chatId}`);
        return this.getMockMessages(chatId);
      }
      
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        messages.push({
          id: childSnapshot.key,
          sender: message.sender || 'Unknown',
          text: message.text || message.message || '',
          timestamp: message.timestamp || Date.now()
        });
      });
      
      console.log(`✅ Found ${messages.length} real messages for chat: ${chatId}`);
      return messages.reverse();
      
    } catch (error) {
      console.error('❌ Error fetching from Firebase:', error);
      return this.getMockMessages(chatId);
    }
  }

  getMockMessages(chatId) {
    console.log(`🔄 Using mock data for chat: ${chatId}`);
    
    const mockChats = {
      'chat1': [
        { sender: 'User1', text: 'I love action movies with great fight scenes!', timestamp: Date.now() },
        { sender: 'User2', text: 'Yeah, but some comedy would be nice too', timestamp: Date.now() },
        { sender: 'User3', text: 'How about something with adventure and humor?', timestamp: Date.now() }
      ],
      'chat2': [
        { sender: 'User1', text: 'I want to watch something scary this weekend', timestamp: Date.now() },
        { sender: 'User2', text: 'Horror movies are too intense for me', timestamp: Date.now() },
        { sender: 'User3', text: 'Maybe a thriller instead? Something suspenseful but not too scary', timestamp: Date.now() }
      ],
      'chat3': [
        { sender: 'User1', text: 'Let\'s watch a romantic comedy', timestamp: Date.now() },
        { sender: 'User2', text: 'I prefer sci-fi movies with great visuals', timestamp: Date.now() },
        { sender: 'User3', text: 'How about something that has both romance and sci-fi?', timestamp: Date.now() }
      ]
    };

    return mockChats[chatId] || mockChats['chat1'];
  }
}

module.exports = new FirebaseService();