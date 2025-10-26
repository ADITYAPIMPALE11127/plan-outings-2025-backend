const admin = require('firebase-admin');

let db = null;
let firebaseInitialized = false;

// Initialize Firebase
try {
  // Production: Environment variables (Render)
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    
    console.log('✅ Firebase: Production (Environment Variables)');
  }
  // Development: Service account file (Local)
  else {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://plan-outings-user-data-default-rtdb.firebaseio.com'
    });
    console.log('✅ Firebase: Development (Service Account File)');
  }
  
  db = admin.database();
  firebaseInitialized = true;
} catch (error) {
  console.log('❌ Firebase failed, using mock data:', error.message);
}

// Rest of your class remains the same...