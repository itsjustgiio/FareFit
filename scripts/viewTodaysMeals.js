#!/usr/bin/env node

/**
 * CLI Script to View Today's Logged Meals
 * 
 * Usage: 
 *   node scripts/viewTodaysMeals.js [userId]
 * 
 * If no userId provided, it will prompt for one.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Firebase config from .env file
const envPath = join(__dirname, '..', '.env');
let firebaseConfig;

try {
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  firebaseConfig = {
    apiKey: lines.find(line => line.startsWith('VITE_FIREBASE_API_KEY='))?.split('=')[1]?.replace(/"/g, ''),
    authDomain: lines.find(line => line.startsWith('VITE_FIREBASE_AUTH_DOMAIN='))?.split('=')[1]?.replace(/"/g, ''),
    projectId: lines.find(line => line.startsWith('VITE_FIREBASE_PROJECT_ID='))?.split('=')[1]?.replace(/"/g, ''),
    storageBucket: lines.find(line => line.startsWith('VITE_FIREBASE_STORAGE_BUCKET='))?.split('=')[1]?.replace(/"/g, ''),
    messagingSenderId: lines.find(line => line.startsWith('VITE_FIREBASE_MESSAGING_SENDER_ID='))?.split('=')[1]?.replace(/"/g, ''),
    appId: lines.find(line => line.startsWith('VITE_FIREBASE_APP_ID='))?.split('=')[1]?.replace(/"/g, '')
  };
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  console.log('Please make sure .env file exists with Firebase configuration');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const getTodayEST = () => {
  const estOffset = -5 * 60; // EST offset in minutes
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const estDate = new Date(utc + estOffset * 60000);
  return estDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const getTodayMeals = async (userId) => {
  try {
    const docRef = doc(db, "Daily_Nutrition_Summary", userId);
    const docSnap = await getDoc(docRef);
    const today = getTodayEST();

    if (!docSnap.exists()) {
      console.log(`📭 No nutrition data found for user: ${userId}`);
      return [];
    }

    const data = docSnap.data();
    const meals = data?.todays_meals || [];
    const todaysMeals = meals.filter(meal => meal.meal_date === today);
    
    return { meals: todaysMeals, date: today, totalData: data };
  } catch (error) {
    console.error('❌ Error fetching meals:', error);
    return [];
  }
};

const displayMeals = (data) => {
  const { meals, date, totalData } = data;
  
  console.log('\n🍽️  FAREFIT MEAL LOG VIEWER');
  console.log('════════════════════════════════════════');
  console.log(`📅 Date: ${date}`);
  console.log(`👤 User: ${process.argv[2] || 'Not specified'}`);
  console.log('════════════════════════════════════════\n');

  if (meals.length === 0) {
    console.log('🔍 No meals logged for today.');
    console.log('\n💡 Tips:');
    console.log('   • Make sure the userId is correct');
    console.log('   • Check if any meals were logged today');
    console.log('   • Verify Firebase connection\n');
    return;
  }

  // Group meals by meal type
  const groupedMeals = meals.reduce((acc, meal) => {
    if (!acc[meal.meal_type]) acc[meal.meal_type] = [];
    acc[meal.meal_type].push(meal);
    return acc;
  }, {});

  // Display each meal type
  Object.entries(groupedMeals).forEach(([mealType, mealList]) => {
    console.log(`🥗 ${mealType.toUpperCase()}`);
    console.log('─'.repeat(40));
    
    mealList.forEach((meal, index) => {
      console.log(`${index + 1}. ${meal.food_name}`);
      console.log(`   Brand: ${meal.brand || 'N/A'}`);
      console.log(`   Serving: ${meal.serving_size}`);
      console.log(`   📊 Nutrition:`);
      console.log(`      🔥 ${meal.calories} kcal`);
      console.log(`      🥩 ${meal.protein}g protein`);
      console.log(`      🍞 ${meal.carbs}g carbs`);
      console.log(`      🧈 ${meal.fats}g fat`);
      console.log(`      🌾 ${meal.fiber}g fiber`);
      console.log('');
    });
  });

  // Calculate totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats,
    fiber: acc.fiber + meal.fiber
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

  console.log('📈 DAILY TOTALS');
  console.log('═'.repeat(40));
  console.log(`🔥 Total Calories: ${totals.calories.toFixed(1)} kcal`);
  console.log(`🥩 Total Protein: ${totals.protein.toFixed(1)}g`);
  console.log(`🍞 Total Carbs: ${totals.carbs.toFixed(1)}g`);
  console.log(`🧈 Total Fat: ${totals.fats.toFixed(1)}g`);
  console.log(`🌾 Total Fiber: ${totals.fiber.toFixed(1)}g`);
  console.log(`\n📝 Total Foods Logged: ${meals.length}`);
  console.log(`🍽️  Meal Types: ${Object.keys(groupedMeals).join(', ')}\n`);
};

// Main execution
const main = async () => {
  const userId = process.argv[2];
  
  if (!userId) {
    console.log('❌ Please provide a userId');
    console.log('Usage: node scripts/viewTodaysMeals.js <userId>');
    console.log('\nExample: node scripts/viewTodaysMeals.js "user123abc"');
    process.exit(1);
  }

  console.log('🔍 Fetching today\'s meals...');
  const data = await getTodayMeals(userId);
  displayMeals(data);
};

main().catch(console.error);