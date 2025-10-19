import { db } from "./firebase";
import { doc, setDoc, getDoc, Timestamp, updateDoc} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile 
} from "firebase/auth";

interface Meal {
  meal_date: string;
  meal_type: string;
  food_name: string;
  serving_size: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

let meals: Meal[] = [];

export const signupUser = async (email: string, password: string, name: string) => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  return userCredential.user;
};

export const logInUser = async (email: string, password: string) => {
    try {
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ User logged in successfully:", userCredential.user.email);
        return userCredential.user;
    } catch (error: any) {
        console.error("❌ Error logging in:", error.message);
        throw new Error(error.message);
    }
}

export const logInWithGoogle = async () => {
    try {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        // If this is their first login, create their default records
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
        console.log("🆕 First Google login detected — creating default records...");
        await createUserRecords(
            user.uid,
            user.displayName || "Unnamed User",
            user.email || ""
        );
        }

        console.log("✅ Google sign-in successful:", user.email);
        return user;
    } catch (error: any) {
        console.error("❌ Error with Google sign-in:", error.message);
        throw new Error(error.message);
    }
};

// Create default documents for a new user
export async function createUserRecords(userId: string, name: string, email: string) {
  try {
    // 1️⃣ User profile (one-to-one, doc ID = userId)
    await setDoc(doc(db, "Users", userId), {
      full_name: name,
      email: email,
      avatar_url: "",
      onboardingComplete: false, // 👈 New users need to complete onboarding
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    // 2️⃣ User preferences (one-to-one)
    await setDoc(doc(db, "User_Preferences", userId), {
      theme: "light",
      notifications_enabled: true,
      email_notifications: true,
      measurement_units: "metric",
      language: "en",
    });

    // 3️⃣ Initial fitness goal (auto-generated ID)
    await setDoc(doc(db, "Fitness_Goals", userId), {
      //user_id: userId,
      age: null,
      gender: null,
      height: null,
      weight: null,
      activity_level: null,
      goal_type: "maintain",
      target_weight: null,
      weekly_goal: null,
      tdee: null,
      target_calories: null,
      protein_target: null,
      carbs_target: null,
      fats_target: null,
      fiber_target: null,
      created_at: Timestamp.now(),
      is_active: true,
    });

    await setDoc(doc(db, "Daily_Nutrition_Summary", userId), {
        todays_meals: [{
            meal_date: null,
            meal_type: null,
            food_name: null,
            brand: null,
            serving_size: 0,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            fiber: 0,
            meal_time: null
        }]
    });

    // Help me here chat gpt
    await setDoc(doc(db, "FareScore", userId), {
      score: 350,
      tier: null,
      mealsLogged: 0,
      workoutsCompleted: 0,
      streakDays: 0,
      lastStreakDate: '2025-10-17', // NEW FIELD
      penalties: 0,
      joinDate: 'August 15, 2025',
    });


    console.log("Default user records created successfully!");
  } catch (err) {
    console.error("Error creating user records:", err);
  }
}

export const updateFitnessGoals = async (
    userId: string, 
    field: string, 
    value: any, 
    collection: string = "Fitness_Goals"
) => {
    try {
        const userRef = doc(db, collection, userId);
        await updateDoc(userRef, { 
            [field]: value // dynamic field name
        });
        console.log(`✅ Updated ${field} in ${collection}/${userId} successfully.`);
    } catch (error) {
        console.error(`❌ Error updating ${field} for user ${userId}:`, error);
        throw error;
    }
}

// Sanitize meal data to ensure all numeric fields are valid numbers
function sanitizeMealData(meal: any) {
  const clean = { ...meal };
  ['calories', 'protein', 'carbs', 'fats', 'fiber', 'serving_size'].forEach((key) => {
    const value = clean[key];
    if (value === '' || isNaN(value) || value === undefined || value === null) {
      clean[key] = 0;
    } else {
      clean[key] = Number(value);
    }
  });
  return clean;
}

export const addMealToDailyNutrition = async (
  userId: string,
  meal: {
    meal_type: string;
    food_name: string;
    brand: string;
    serving_size: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    meal_time: Date;
    meal_date: string;
  }
) => {
  try {
    // Sanitize the meal data before saving
    const sanitizedMeal = sanitizeMealData(meal);
    
    // Debug logging to see what we're actually saving
    console.log("🧩 Original meal data:", JSON.stringify(meal, null, 2));
    console.log("🧩 Sanitized meal data being saved:", JSON.stringify(sanitizedMeal, null, 2));
    
    const today = getTodayEST();
    const docRef = doc(db, "Daily_Nutrition_Summary", userId);
    const docSnap = await getDoc(docRef);

    // Explicitly type the array
    let meals: Meal[] = [];

    if (docSnap.exists()) {
      meals = (docSnap.data()?.todays_meals as Meal[]) || [];
      const lastMealDate = meals.length ? meals[meals.length - 1].meal_date : null;
      if (lastMealDate !== today) {
        meals = []; // reset for new day
      }
    }

    meals.push({ ...sanitizedMeal, meal_date: today });
    await updateDoc(docRef, { todays_meals: meals });
    console.log("✅ Meal added successfully!");
  } catch (err) {
    console.error("❌ Error adding meal:", err);
  }
};

export const getTodayMeals = async (userId: string) => {
    const docRef = doc(db, "Daily_Nutrition_Summary", userId);
    const docSnap = await getDoc(docRef);
    const today = getTodayEST();

    if (!docSnap.exists()) return [];

    const meals = docSnap.data()?.todays_meals || [];
    const todaysMeals = meals.filter((meal: any) => meal.meal_date === today);
    
    // Sanitize any existing bad data when loading
    const safeMeals = todaysMeals.map((meal: any) => ({
      ...meal,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fats: Number(meal.fats) || 0,
      fiber: Number(meal.fiber) || 0,
      serving_size: Number(meal.serving_size) || 1,
    }));
    
    return safeMeals;
};

const getTodayEST = (): string => {
  const estOffset = -5 * 60; // EST offset in minutes
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const estDate = new Date(utc + estOffset * 60000);
  return estDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
};

export const getUserFitnessGoals = async (userId: string) => {
  try {
    const docRef = doc(db, "Fitness_Goals", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`No fitness goals found for user ${userId}`);
      return null;
    }

    return docSnap.data();
  } catch (error) {
    console.error(`❌ Error fetching fitness goals for user ${userId}:`, error);
    throw error;
  }
};

export const updateUserStreak = async (userId: string) => {
  const fareRef = doc(db, "FareScore", userId);
  const fareSnap = await getDoc(fareRef);
  if (!fareSnap.exists()) return;

  const data = fareSnap.data();
  const lastDateStr = data.lastStreakDate;
  const todayStr = getTodayEST();

  const lastDate = lastDateStr ? new Date(lastDateStr) : null;
  const today = new Date(todayStr);
  const oneDay = 24 * 60 * 60 * 1000;

  let newStreak = 1;
  let newScore = data.score;

  if (lastDate) {
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / oneDay);

    if (diffDays === 0) {
      // Already logged today
      console.log("✅ Streak already counted today.");
      return;
    } else if (diffDays === 1) {
      // Continue streak
      newStreak = data.streakDays + 1;
    } else if (diffDays <= 6) {
      // Missed daily logs → break streak
      newStreak = 1;
      newScore -= 5; // break streak penalty
      console.log("⚠️ Streak broken, -5 points");
    } else if (diffDays >= 7) {
      // Inactive for a week
      newStreak = 1;
      newScore -= 10; // inactivity penalty
      console.log("⚠️ Inactive for a week, -10 points");
    }

    // Optional: small daily log penalty
    if (diffDays === 2) newScore -= 2; // Missed 1 day
  }

  await updateDoc(fareRef, {
    streakDays: newStreak,
    lastStreakDate: todayStr,
    score: newScore,
  });

  console.log(`✅ Updated streak: ${newStreak}, FareScore: ${newScore}`);
};

export const updateUserFareScoreOnLog = async (userId: string, eventName: string) => {
  const docRef = doc(db, "FareScore", userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error("❌ FareScore document does not exist for user:", userId);
    return;
  }

  const data = docSnap.data();
  let newScore = data.score || 0;

  if (eventName === "logged_food") {
    newScore += 1;
  } else if (eventName === "macros_hit") {
    newScore += 2;
  } else {
    console.warn(`⚠️ Event "${eventName}" not recognized. No score update.`);
    return;
  }

  await updateDoc(docRef, { score: newScore });
  console.log(`✅ FareScore updated for ${eventName}: ${newScore}`);
};

// ===== ONBOARDING STATUS FUNCTIONS =====

/**
 * Gets the onboarding completion status from Firestore
 * Returns false for new users or if no document exists
 */
export const getOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log(`📝 No user document found for ${userId} - treating as new user`);
      return false;
    }
    
    const userData = userDoc.data();
    const onboardingComplete = userData.onboardingComplete || false;
    
    console.log(`📋 Onboarding status for ${userId}: ${onboardingComplete}`);
    return onboardingComplete;
  } catch (error) {
    console.error("❌ Error fetching onboarding status:", error);
    // Return false as safe default to ensure onboarding shows
    return false;
  }
};

/**
 * Marks onboarding as complete in Firestore
 * Also updates the updated_at timestamp
 */
export const setOnboardingComplete = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, {
      onboardingComplete: true,
      updated_at: Timestamp.now()
    });
    
    console.log(`✅ Onboarding marked as complete for user ${userId}`);
  } catch (error) {
    console.error("❌ Error marking onboarding complete:", error);
    throw error;
  }
};

/**
 * Helper function to migrate existing localStorage users to Firestore onboarding status
 * Checks if user exists in Firestore but lacks onboarding status, sets to true for existing users
 */
export const migrateOnboardingStatus = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If user exists but doesn't have onboardingComplete field, they're an existing user
      if (userData.onboardingComplete === undefined) {
        console.log(`🔄 Migrating existing user ${userId} - setting onboarding as complete`);
        await updateDoc(userDocRef, {
          onboardingComplete: true,
          updated_at: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error("❌ Error migrating onboarding status:", error);
    // Don't throw - this is a best-effort migration
  }
};