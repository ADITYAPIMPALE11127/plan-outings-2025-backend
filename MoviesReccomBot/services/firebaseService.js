const admin = require('firebase-admin');

// For testing, we'll use mock data. Replace this with your actual Firebase config later
class FirebaseService {
  
  // Mock chat data for testing - replace with real Firebase later
  async getChatMessages(chatId) {
    console.log(`Getting mock chat messages for: ${chatId}`);
    
    // Sample chat conversations for testing
    const sampleChats = {
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

    return sampleChats[chatId] || sampleChats['chat1'];
  }

  // Get real Firebase data (commented out for now)
  /*
  async getRealChatMessages(chatId) {
    // Your Firebase initialization code here
    const serviceAccount = require('./path/to/serviceAccountKey.json');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'your-database-url'
      });
    }

    const db = admin.database();
    const snapshot = await db.ref(`chats/${chatId}/messages`).once('value');
    return snapshot.val() || [];
  }
  */
}

module.exports = new FirebaseService();