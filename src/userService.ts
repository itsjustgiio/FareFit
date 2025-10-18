import { db } from "./firebase";
import { doc, setDoc, getDoc, Timestamp, updateDoc} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, updateProfile} from "firebase/auth";

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

// Create default documents for a new user
export async function createUserRecords(userId: string, name: string, email: string) {
  try {
    // 1️⃣ User profile (one-to-one, doc ID = userId)
    await setDoc(doc(db, "Users", userId), {
      full_name: name,
      email: email,
      avatar_url: "",
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
            fiber: 0
        }]
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
  }
) => {
  try {
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

    meals.push({ ...meal, meal_date: today });
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
    return meals.filter((meal: any) => meal.meal_date === today);
};

const getTodayEST = (): string => {
  const estOffset = -5 * 60; // EST offset in minutes
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const estDate = new Date(utc + estOffset * 60000);
  return estDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
};