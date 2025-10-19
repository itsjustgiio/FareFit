/**
 * Browser-friendly user profile viewer for F12 console
 * Usage: await window.viewUserProfile("userId") or await viewUserProfile("userId")
 */

import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Use the existing Firebase instance from your app
const db = getFirestore();
const auth = getAuth();

// Helper function to calculate age (timezone-safe)
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

export async function viewUserProfile(userId?: string) {
  try {
    // If no userId provided, use current authenticated user
    let targetUserId = userId;
    if (!targetUserId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("❌ No user ID provided and no user is logged in");
        console.log("💡 Usage: await viewUserProfile('user-id-here')");
        return;
      }
      targetUserId = currentUser.uid;
      console.log(`🔍 Using current logged-in user: ${targetUserId}`);
    }

    console.log(`\n🏃 FareFit User Profile Data`);
    console.log('━'.repeat(60));
    console.log(`👤 User ID: ${targetUserId}`);

    // ✅ Query correct collections (capital U, separate collections) 
    const [userSnap, fitnessSnap, prefsSnap] = await Promise.all([
      getDoc(doc(db, "Users", targetUserId)),
      getDoc(doc(db, "Fitness_Goals", targetUserId)), 
      getDoc(doc(db, "User_Preferences", targetUserId))
    ]);

    const profile = userSnap.exists() ? userSnap.data() : null;
    const fitness = fitnessSnap.exists() ? fitnessSnap.data() : null;
    const prefs = prefsSnap.exists() ? prefsSnap.data() : null;

    if (!profile && !fitness && !prefs) {
      console.log(`❌ No documents found for user: ${targetUserId}`);
      console.log(`   Checked: Users, Fitness_Goals, User_Preferences collections`);
      return { profile, fitness, prefs };
    }
    
    console.group("\n👤 PROFILE INFORMATION");
    console.log("📧 Email:", profile?.email ?? "—");
    console.log("🪪 Name:", profile?.full_name ?? profile?.name ?? "—");
    
    if (profile?.birthDate) {
      console.log("👶 Birth Date:", formatDate(profile.birthDate));
      console.log("🎂 Age:", calculateAge(profile.birthDate), "years old");
    } else {
      console.log("👶 Birth Date: —");
    }
    console.groupEnd();

    console.group("\n📏 PHYSICAL DATA");
    if (fitness?.height) {
      console.log("📐 Height:", formatHeight(fitness.height));
    } else {
      console.log("📐 Height: —");
    }
    if (fitness?.weight) {
      console.log("⚖️ Weight:", formatWeight(fitness.weight));
    } else {
      console.log("⚖️ Weight: —");
    }
    console.groupEnd();

    console.group("\n🎯 FITNESS INFORMATION");
    console.log("🏃 Activity Level:", fitness?.activityLevel ?? "—");
    const goals = Array.isArray(fitness?.goals) ? fitness.goals.join(", ") : (fitness?.goals ?? "—");
    console.log("🎯 Goals:", goals);
    console.groupEnd();

    console.group("\n🔔 NOTIFICATION PREFERENCES");
    console.log("📱 Notifications Enabled:", prefs?.notifications_enabled ? 'Yes' : 'No');
    console.log("� Email Notifications:", prefs?.email_notifications ? 'Yes' : 'No');
    console.log("📏 Measurement Units:", prefs?.measurement_units ?? "—");
    console.log("🌍 Language:", prefs?.language ?? "—");
    console.groupEnd();

    console.log(`\n✅ Profile data retrieval complete`);
    console.log(`\n💡 Raw data objects available in Network tab → Firebase calls\n`);

    return { profile, fitness, prefs };

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Helper function to get current user's profile quickly
export async function viewMyProfile() {
  return await viewUserProfile();
}

// Make it globally available for F12 console
declare global {
  interface Window {
    viewUserProfile: typeof viewUserProfile;
    viewMyProfile: typeof viewMyProfile;
  }
}

if (typeof window !== 'undefined') {
  window.viewUserProfile = viewUserProfile;
  window.viewMyProfile = viewMyProfile;
}