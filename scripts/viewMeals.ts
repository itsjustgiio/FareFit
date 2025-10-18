/**
 * Simple CLI to view today's logged meals
 * Run with: npm run view-meals [userId]
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase config - using environment variables
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

const getTodayEST = (): string => {
  const estOffset = -5 * 60;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const estDate = new Date(utc + estOffset * 60000);
  return estDate.toISOString().split("T")[0];
};

async function viewTodaysMeals(userId: string) {
  try {
    console.log(`\n🔍 Fetching meals for user: ${userId}`);
    
    const docRef = doc(db, "Daily_Nutrition_Summary", userId);
    const docSnap = await getDoc(docRef);
    const today = getTodayEST();

    if (!docSnap.exists()) {
      console.log(`❌ No data found for user: ${userId}`);
      return;
    }

    const data = docSnap.data();
    const allMeals = data?.todays_meals || [];
    const todaysMeals = allMeals.filter((meal: any) => meal.meal_date === today);

    console.log(`\n🍽️  MEALS FOR ${today}`);
    console.log('═'.repeat(50));

    if (todaysMeals.length === 0) {
      console.log('📭 No meals logged today');
      return;
    }

    // Group by meal type
    const grouped = todaysMeals.reduce((acc: any, meal: any) => {
      if (!acc[meal.meal_type]) acc[meal.meal_type] = [];
      acc[meal.meal_type].push(meal);
      return acc;
    }, {});

    // Display each meal type
    for (const [mealType, meals] of Object.entries(grouped) as [string, any[]][]) {
      console.log(`\n🥗 ${mealType.toUpperCase()}:`);
      meals.forEach((meal, i) => {
        console.log(`  ${i + 1}. ${meal.food_name} (${meal.brand || 'No brand'})`);
        console.log(`     Serving: ${meal.serving_size}`);
        console.log(`     🔥 ${meal.calories}kcal | 🥩 ${meal.protein}g | 🍞 ${meal.carbs}g | 🧈 ${meal.fats}g | 🌾 ${meal.fiber}g`);
      });
    }

    // Calculate totals
    const totals = todaysMeals.reduce((acc: any, meal: any) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
      fiber: acc.fiber + meal.fiber
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

    console.log(`\n📊 DAILY TOTALS:`);
    console.log(`🔥 ${totals.calories.toFixed(1)} kcal | 🥩 ${totals.protein.toFixed(1)}g | 🍞 ${totals.carbs.toFixed(1)}g | 🧈 ${totals.fats.toFixed(1)}g | 🌾 ${totals.fiber.toFixed(1)}g`);
    console.log(`\n📝 Total items: ${todaysMeals.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.log('\n❌ Please provide a userId');
  console.log('Usage: npm run view-meals <userId>');
  console.log('Example: npm run view-meals "abc123def456"\n');
  process.exit(1);
}

viewTodaysMeals(userId);