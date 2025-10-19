/**
 * Simple CLI to view user's onboarding profile data
 * Run with: npm run view-user [userId]
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

// Helper to safely extract data from snapshot
const getSafe = <T>(snap: any) => (snap.exists() ? (snap.data() as T) : null);

// Helper function to calculate age from birth date (timezone-safe)
const calculateAge = (birthDate: string): number => {
  // Prevent timezone offset by parsing manually
  const [year, month, day] = birthDate.split("-").map(Number);
  const birth = new Date(year, month - 1, day); // local date (no UTC shift)
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to format height
const formatHeight = (heightCm: number): string => {
  const totalInches = heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}" (${heightCm} cm)`;
};

// Helper function to format weight
const formatWeight = (weightKg: number): string => {
  const weightLb = (weightKg * 2.20462).toFixed(1);
  return `${weightKg} kg (${weightLb} lb)`;
};

// Helper function to format date nicely (timezone-safe)
const formatDate = (dateString: string): string => {
  // Prevent timezone offset by parsing manually
  const [year, month, day] = dateString.split("-").map(Number);
  return `${month}/${day}/${year}`;
};

async function viewUserProfile(userId: string) {
  try {
    console.log(`\n🔍 Fetching profile data for user: ${userId}`);
    console.log('═'.repeat(60));

    // Get user basic profile
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      console.log(`❌ No profile found for user: ${userId}`);
      return;
    }

    const userData = userDocSnap.data();
    
    console.log(`\n👤 PROFILE INFORMATION:`);
    console.log(`📧 Email: ${userData?.email || 'Not provided'}`);
    console.log(`👶 Birth Date: ${userData?.birthDate ? formatDate(userData.birthDate) : 'Not provided'}`);
    if (userData?.birthDate) {
      console.log(`🎂 Age: ${calculateAge(userData.birthDate)} years old`);
    }

    // Get fitness goals data
    const fitnessGoalsRef = doc(db, "users", userId, "fitnessGoals", "current");
    const fitnessGoalsSnap = await getDoc(fitnessGoalsRef);
    
    if (fitnessGoalsSnap.exists()) {
      const fitnessData = fitnessGoalsSnap.data();
      
      console.log(`\n📏 PHYSICAL DATA:`);
      if (fitnessData?.height) {
        console.log(`📐 Height: ${formatHeight(fitnessData.height)}`);
      }
      if (fitnessData?.weight) {
        console.log(`⚖️  Weight: ${formatWeight(fitnessData.weight)}`);
      }
      
      console.log(`\n🎯 FITNESS INFORMATION:`);
      if (fitnessData?.activityLevel) {
        console.log(`🏃 Activity Level: ${fitnessData.activityLevel}`);
      }
      if (fitnessData?.goals && Array.isArray(fitnessData.goals)) {
        console.log(`🎯 Goals: ${fitnessData.goals.join(', ')}`);
      }
    } else {
      console.log(`\n📏 PHYSICAL DATA:`);
      console.log(`❌ No fitness goals data found`);
    }

    // Get user preferences
    const preferencesRef = doc(db, "users", userId, "preferences", "notifications");
    const preferencesSnap = await getDoc(preferencesRef);
    
    console.log(`\n🔔 NOTIFICATION PREFERENCES:`);
    if (preferencesSnap.exists()) {
      const prefsData = preferencesSnap.data();
      console.log(`📱 Daily Reminders: ${prefsData?.dailyReminders ? 'Enabled' : 'Disabled'}`);
      if (prefsData?.reminderTime) {
        console.log(`⏰ Reminder Time: ${prefsData.reminderTime}`);
      }
      console.log(`📅 Weekly Check-ins: ${prefsData?.weeklyCheckins ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log(`❌ No notification preferences found`);
    }

    console.log(`\n✅ Profile data retrieval complete\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.log('\n❌ Please provide a userId');
    console.log('Usage: npm run view-user <userId>');
    console.log('Example: npm run view-user "KTL7Lgg7YcRHj1dFfULIuy9DLVI3"');
    console.log('\n💡 To find user IDs, run: npm run list-users\n');
    process.exit(1);
  }

  await viewUserProfile(userId);
}

main().catch((error) => {
  console.error('⚠️ Error:', error);
  process.exit(1);
});