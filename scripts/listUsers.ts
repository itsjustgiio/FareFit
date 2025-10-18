/**
 * Helper script to list user IDs from Firebase Authentication
 * This can help you find the correct userId to use with view-meals
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listRecentMealUsers() {
  try {
    console.log('\n🔍 Finding users with meal data...\n');
    
    // Query Daily_Nutrition_Summary collection for recent users
    const q = query(collection(db, "Daily_Nutrition_Summary"), limit(10));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No users with meal data found');
      return;
    }
    
    console.log('👥 Users with meal data:');
    console.log('═'.repeat(60));
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const mealsCount = data.todays_meals?.length || 0;
      const lastMealDate = data.todays_meals?.[data.todays_meals.length - 1]?.meal_date || 'Unknown';
      
      console.log(`${index + 1}. User ID: ${doc.id}`);
      console.log(`   📝 Total meals logged: ${mealsCount}`);
      console.log(`   📅 Last meal date: ${lastMealDate}`);
      console.log('');
    });
    
    console.log('💡 To view meals for a user, run:');
    console.log('   npm run view-meals <USER_ID>\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listRecentMealUsers();