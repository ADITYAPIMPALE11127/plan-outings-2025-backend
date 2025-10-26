const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    this.db = null;
    this.firebaseInitialized = false;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Only initialize if we have valid Firebase config
      if (process.env.FIREBASE_PRIVATE_KEY && 
          process.env.FIREBASE_PROJECT_ID && 
          process.env.FIREBASE_CLIENT_EMAIL) {
        
        console.log('🔧 Attempting Firebase initialization...');
        
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://plan-outings-user-data-default-rtdb.firebaseio.com'
        });
        
        this.db = admin.database();
        this.firebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');
      } else {
        console.log('🔄 Firebase environment variables not found, using mock data');
      }
    } catch (error) {
      console.log('❌ Firebase initialization failed, using mock data only');
    }
  }

  async getChatMessages(chatId, limit = 50) {
    try {
      if (!this.firebaseInitialized || !this.db) {
        console.log(`🔄 Using mock data for: ${chatId}`);
        return this.getMockMessages(chatId);
      }

      console.log(`📥 Fetching REAL chat messages for: ${chatId}`);
      
      const messagesRef = this.db.ref(`chats/${chatId}/messages`);
      const snapshot = await messagesRef
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');
      
      if (!snapshot.exists()) {
        console.log(`❌ No real messages found for: ${chatId}`);
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
      
      console.log(`✅ Found ${messages.length} real messages for: ${chatId}`);
      return messages.reverse();
      
    } catch (error) {
      console.error('❌ Error fetching from Firebase:', error.message);
      return this.getMockMessages(chatId);
    }
  }

  getMockMessages(chatId) {
    console.log(`🎭 Using mock data for: ${chatId}`);
    
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
      ],
      '-0cPStdCj11vcx2ZLW61': [
        { sender: 'User1', text: 'What movies should we watch this weekend?', timestamp: Date.now() },
        { sender: 'User2', text: 'I like action and adventure films!', timestamp: Date.now() },
        { sender: 'User3', text: 'Something with good visuals and story', timestamp: Date.now() }
      ]
    };

    return mockChats[chatId] || mockChats['chat1'];
  }
}

// ✅ Correct export - create instance
module.exports = new FirebaseService();