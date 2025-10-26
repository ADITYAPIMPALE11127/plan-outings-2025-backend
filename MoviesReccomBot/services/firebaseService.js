const admin = require('firebase-admin');

let db = null;
let firebaseInitialized = false;

// Initialize Firebase from service account file
try {
  const serviceAccount = require('../firebase-service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://plan-outings-user-data-default-rtdb.firebaseio.com'
  });
  
  db = admin.database();
  firebaseInitialized = true;
  console.log('✅ Firebase Admin initialized successfully from service account file');
} catch (error) {
  console.log('❌ Firebase initialization failed, using mock data only:', error.message);
}

class FirebaseService {
  async getChatMessages(chatId, limit = 50) {
    try {
      if (!firebaseInitialized || !db) {
        console.log('🔄 Firebase not available, using mock data for:', chatId);
        return this.getMockMessages(chatId);
      }

      console.log(`📥 Fetching REAL chat messages for: ${chatId}`);
      
      const messagesRef = db.ref(`chats/${chatId}/messages`);
      const snapshot = await messagesRef
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');
      
      if (!snapshot.exists()) {
        console.log(`❌ No real messages found for chat: ${chatId}, using mock data`);
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
      
      console.log(`✅ Found ${messages.length} REAL messages for chat: ${chatId}`);
      return messages.reverse();
      
    } catch (error) {
      console.error('❌ Error fetching from Firebase:', error.message);
      return this.getMockMessages(chatId);
    }
  }

  getMockMessages(chatId) {
    console.log(`🎭 Using MOCK data for chat: ${chatId}`);
    
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