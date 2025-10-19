import { db } from "./firebase";
import { doc, setDoc, getDoc, Timestamp, updateDoc, collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
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

// Add this new interface
interface SetData {
  id: string;
  reps: number;
  weight: number;
  volume: number;
}

// Update the Exercise interface
interface Exercise {
  name: string | null;
  sets: SetData[];  // ✅ Changed from number to array
  // ❌ Remove these lines:
  // reps: number;
  // weight: number;
  // volume: number;  // This is now calculated from sets
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
}

// WorkoutDay interface stays the same
interface WorkoutDay {
  day_type: string | null;
  duration: number;
  calories_burned: number;
  total_sets: number;
  total_reps: number;
  volume: number;
  exercises: Exercise[];
  date: string;
}

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

    await setDoc(doc(db, "Daily_Metric", userId), {
      hit_calorie_goal: false,
      hit_protein_goal: false,
      hit_carbs_goal: false,
      hit_fats_goal: false,
      hit_fiber_goal: false
    });

    await setDoc(doc(db, "Food_Streak_Tracker", userId), {
      protein_track_days: 0,
      carbs_track_days: 0,
      fats_track_days: 0,
      micronutrient_track_days: 0,
      loggedMeals_track_days: 0,
      hyrdration_track_days: 0,
      fiber_track_days: 0,
      sugar_track_days: 0
    });

    await setDoc(doc(db, "Daily_Metric", userId), {
      hit_calorie_goal: false,
      hit_protein_goal: false,
      hit_carbs_goal: false,
      hit_fats_goal: false,
      hit_fiber_goal: false
    });

    await setDoc(doc(db, "Food_Streak_Tracker", userId), {
      protein_track_days: 0,
      carbs_track_days: 0,
      fats_track_days: 0,
      micronutrient_track_days: 0,
      loggedMeals_track_days: 0,
      hyrdration_track_days: 0,
      fiber_track_days: 0,
      sugar_track_days: 0
    });

    // Get real user creation date from Firebase Auth
    const auth = getAuth();
    const user = auth.currentUser;
    const actualJoinDate = user?.metadata?.creationTime 
      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    //
    console.log(`✅ Creating FareScore with real join date: ${actualJoinDate}`);

    await setDoc(doc(db, "FareScore", userId), {
      score: 350,
      tier: null,
      mealsLogged: 0,
      workoutsCompleted: 0,
      streakDays: 0,
      lastStreakDate: '2025-10-17', // NEW FIELD
      penalties: 0,
      joinDate: actualJoinDate, // ← Now uses real Firebase Auth creation date!
      history: [
        { date: '2025-10-17', score: 350 }
      ]
    });

    await setDoc(doc(db, "Workout_Exercises", userId), {
      workout: [{
        day_type: null,
        duration: 0,
        calories_burned: 0,
        total_sets: 0,
        total_reps: 0,
        volume: 0, // I dont really care about this
        exercises: [{
          name: null,
          sets: [{
            id: '1',
            reps: 0,
            weight: 0,
            volume: 0
          }],
          startTime: null,
          endTime: null,
          notes: null,
        }]
      }]
    });

    await setDoc(doc(db, "Weekly_Facts", userId), {
      total_cals: 0,
      total_burned: 0,
      net_calories: 0,
      total_workouts: 0,
      days_consumed: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      days_burned: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      days_net: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      }
    });

    await setDoc(doc(db, "User_Achievements", userId), {
      macro_master: false,
      protein_champ: false,
      carb_control: false,
      fat_balance: false,
      micronutr_minded: false,
      clean_plate_club: false,
      hydration_hero: false,
      fiber_fiend: false,
      sugar_smart: false
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

// New function for batch updates (more efficient than multiple single updates)
export const updateFitnessGoalsBatch = async (
    userId: string, 
    updates: Record<string, any>, 
    collection: string = "Fitness_Goals"
) => {
    try {
        const userRef = doc(db, collection, userId);
        await updateDoc(userRef, {
            ...updates,
            updated_at: Timestamp.now() // Add timestamp for tracking
        });
        console.log(`✅ Updated ${Object.keys(updates).join(', ')} in ${collection}/${userId} successfully.`);
    } catch (error) {
        console.error(`❌ Error updating fitness goals for user ${userId}:`, error);
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

// ✨ NEW: Real AI Image Analysis Function
export const analyzeMealImage = async (base64Image: string, imageCount: number = 1) => {
  try {
    const { getGeminiService } = await import('./services/geminiService');
    const gemini = getGeminiService();
    
    console.log(`🔬 Starting AI image analysis... (${imageCount} photo(s) provided)`);
    
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const prompt = `Analyze this food image and identify all visible food items. For each item, provide detailed nutritional information.

${imageCount > 1 ? `Note: This is the primary image from ${imageCount} photos provided. Use this main angle for analysis.` : ''}

IMPORTANT: If you cannot clearly identify a food item or are uncertain about what it is, please:
- Use descriptive names like "Unknown protein (appears to be meat)", "Unidentified grain/starch", or "Mixed vegetables"
- Set calories to 0 for items you cannot identify
- Be honest about uncertainty rather than guessing

Return ONLY a valid JSON object in this exact format:
{
  "name": "Overall meal name (e.g., 'Grilled Chicken Salad')",
  "confidence": "high|medium|low",
  "items": [
    {
      "id": "1",
      "name": "Food item name (use 'Unknown/Unclear [description]' if uncertain)",
      "servingSize": "Estimated serving (e.g., '150g', '1 cup')",
      "amountConsumed": 1,
      "baseCalories": 0,
      "baseProtein": 0,
      "baseCarbs": 0,
      "baseFat": 0,
      "baseFiber": 0,
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "isExpanded": false,
      "brandName": "",
      "confidence": "high|medium|low"
    }
  ]
}

Guidelines:
- Only identify items you can see clearly
- If lighting is poor, image is blurry, or food is unclear, mark as "low" confidence
- Use "Unknown" or "Unclear" in names when uncertain
- Set calories to 0 for unidentifiable items
- Estimate realistic portion sizes only for items you can identify
- Use USDA nutrition database values for known items
- Round calories to whole numbers, macros to 1 decimal
- Make calories/macros = base values × amount consumed
- Include condiments, sauces, and garnishes if clearly visible
- Be conservative with portion estimates if unsure
${imageCount > 1 ? '- Multiple angles were provided - use this for better accuracy' : ''}

Example response for unclear image:
{
  "name": "Mixed Meal (Unclear)",
  "confidence": "low",
  "items": [
    {
      "id": "1",
      "name": "Unknown protein (appears to be meat)",
      "servingSize": "unclear portion",
      "amountConsumed": 1,
      "baseCalories": 0,
      "confidence": "low",
      ...
    }
  ]
}`;

    // Create the multimodal message for Gemini
    const messages = [{
      role: 'user' as const,
      parts: [{
        text: prompt
      }, {
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      }]
    }];

    const response = await gemini.chat(messages, 'gemini-2.5-flash');
    
    console.log('🤖 Raw Gemini response:', response);
    
    // Extract JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!parsedData.name || !Array.isArray(parsedData.items)) {
      throw new Error('Invalid response structure from AI');
    }
    
    console.log('✅ AI analysis complete:', parsedData);
    return { success: true, data: parsedData };
    
  } catch (error) {
    console.error('❌ AI image analysis failed:', error);
    
    // Return fallback mock data if AI fails
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        name: 'Mixed Meal',
        items: [
          {
            id: '1',
            name: 'Food Item (AI analysis failed)',
            servingSize: '1 portion',
            amountConsumed: 1,
            baseCalories: 300,
            baseProtein: 15,
            baseCarbs: 30,
            baseFat: 10,
            baseFiber: 3,
            calories: 300,
            protein: 15,
            carbs: 30,
            fat: 10,
            fiber: 3,
            isExpanded: false,
            brandName: ''
          }
        ]
      }
    };
  }
};

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
    
    // 🆕 Update Weekly_Facts
    await updateWeeklyFactsOnMealAdd(userId, sanitizedMeal.calories, sanitizedMeal.meal_date);
    
  } catch (err) {
    console.error("❌ Error adding meal:", err);
  }
};

// In userService.ts, in getTodayMeals function, add array checking:
export const getTodayMeals = async (userId: string) => {
    const docRef = doc(db, "Daily_Nutrition_Summary", userId);
    const docSnap = await getDoc(docRef);
    const today = getTodayEST();

    if (!docSnap.exists()) return [];

    const meals = docSnap.data()?.todays_meals || [];
    
    // Add this check:
    if (!Array.isArray(meals)) {
      return [];
    }
    
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
  return getDateInEasternTimezone();
};

// Export this function so other components can use the same date logic
export const getDateInEasternTimezone = (date?: Date): string => {
  const targetDate = date || new Date();
  
  // Get the date in Eastern timezone using Intl.DateTimeFormat
  const easternFormatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const easternDateString = easternFormatter.format(targetDate); // Returns "YYYY-MM-DD"
  return easternDateString;
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

// ========== Barcode History Functions ==========
export const addBarcodeToHistory = async (
  userId: string,
  productData: {
    barcode: string;
    product_name: string;
    brand_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    serving_size: string;
  }
) => {
  try {
    const docRef = doc(db, "Barcode_History", userId);
    const docSnap = await getDoc(docRef);

    let scannedProducts: any[] = [];

    if (docSnap.exists()) {
      scannedProducts = docSnap.data()?.scanned_products || [];
    }

    // Check if product already exists
    const existingIndex = scannedProducts.findIndex(
      (p: any) => p.barcode === productData.barcode
    );

    if (existingIndex >= 0) {
      // Update existing product - increment scan count
      scannedProducts[existingIndex] = {
        ...scannedProducts[existingIndex],
        scan_count: scannedProducts[existingIndex].scan_count + 1,
        last_scanned: Timestamp.now(),
      };
    } else {
      // Add new product
      scannedProducts.push({
        ...productData,
        scan_count: 1,
        first_scanned: Timestamp.now(),
        last_scanned: Timestamp.now(),
      });
    }

    // Sort by last_scanned (most recent first)
    scannedProducts.sort((a: any, b: any) =>
      b.last_scanned.toMillis() - a.last_scanned.toMillis()
    );

    // Keep only last 20 products to avoid bloat
    scannedProducts = scannedProducts.slice(0, 20);

    // Create or update document
    if (docSnap.exists()) {
      await updateDoc(docRef, { scanned_products: scannedProducts });
    } else {
      await setDoc(docRef, { scanned_products: scannedProducts });
    }

    console.log("✅ Barcode added to history!");
  } catch (err) {
    console.error("❌ Error adding barcode to history:", err);
  }
};

export const getBarcodeHistory = async (userId: string) => {
  try {
    const docRef = doc(db, "Barcode_History", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    return docSnap.data()?.scanned_products || [];
  } catch (error) {
    console.error("❌ Error fetching barcode history:", error);
    return [];
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

// Add this to your updateUserFareScoreOnLog function
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
  } else if (eventName === "logged_workout") {
    newScore += 3; // Workouts give more points
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
 * Gets the complete user profile data from Firestore
 * Fetches from both Users and Fitness_Goals collections and merges the data
 * Maps onboarding field names to expected field names
 */
export const getUserProfile = async (userId: string) => {
  try {
    // Fetch from both collections
    const userDocRef = doc(db, "Users", userId);
    const fitnessGoalsRef = doc(db, "Fitness_Goals", userId);
    
    const [userDoc, fitnessDoc] = await Promise.all([
      getDoc(userDocRef),
      getDoc(fitnessGoalsRef)
    ]);
    
    const userData = userDoc.exists() ? userDoc.data() : {};
    const fitnessData = fitnessDoc.exists() ? fitnessDoc.data() : {};
    
    console.log(`👤 Raw user data (Users collection) for ${userId}:`, userData);
    console.log(`🏋️ Raw fitness data (Fitness_Goals collection) for ${userId}:`, fitnessData);
    
    // Calculate age from birthday if available
    let calculatedAge = userData.age || fitnessData.age;
    if (!calculatedAge && (userData.birthday || fitnessData.birthday)) {
      const birthday = userData.birthday || fitnessData.birthday;
      const birthDate = new Date(birthday);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }
    
    // Merge and map data from both collections, prioritizing fitness data for fitness-related fields
    const mappedProfile = {
      age: calculatedAge,
      gender: fitnessData.sex || fitnessData.gender || userData.sex || userData.gender,
      weight: fitnessData.weight || userData.weight,
      height: fitnessData.height || userData.height,
      activityLevel: fitnessData.activity_level || fitnessData.activityLevel || userData.activityLevel,
      goalType: fitnessData.goal_type || fitnessData.goal || fitnessData.goalType || userData.goal || userData.goalType,
      onboardingComplete: userData.onboardingComplete || false,
      // Include other fields as needed
      full_name: userData.full_name,
      email: userData.email,
      birthday: userData.birthday || fitnessData.birthday,
      dateOfBirth: userData.dateOfBirth,
    };
    
    console.log(`👤 Merged and mapped user profile for ${userId}:`, mappedProfile);
    return mappedProfile;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return null;
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

export const getUserFareScore = async (userId: string) => {
  try {
    const docRef = doc(db, "FareScore", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn("No FareScore document found for user:", userId);
      return null;
    }
  } catch (err) {
    console.error("❌ Error fetching FareScore:", err);
    return null;
  }
};


// Get workout exercises for a specific date
export const getWorkoutExercises = async (date?: string) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const workoutDocRef = doc(db, "Workout_Exercises", user.uid);
  const workoutDocSnap = await getDoc(workoutDocRef);

  if (!workoutDocSnap.exists()) {
    console.log("No Workout_Exercises document found for this user");
    return { workout: [] };
  }

  const data = workoutDocSnap.data() as { workout: WorkoutDay[] };
  
  // If no date specified, return today's workout
  const targetDate = date || getTodayEST();
  
  // Find workout for the specific date
  const todayWorkout = data.workout.find(day => day.date === targetDate);
  
  return {
    workout: todayWorkout ? [todayWorkout] : [],
    allWorkouts: data.workout || []
  };
};

// Set workout exercises for a specific date
// Set workout exercises for a specific date
export const setWorkoutExercises = async (workoutData: WorkoutDay, date?: string) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const workoutDocRef = doc(db, "Workout_Exercises", user.uid);
  const workoutDocSnap = await getDoc(workoutDocRef);

  const targetDate = date || getTodayEST();
  
  let allWorkouts: WorkoutDay[] = [];

  if (workoutDocSnap.exists()) {
    allWorkouts = workoutDocSnap.data()?.workout || [];
    
    console.log('📊 Current workouts in DB:', allWorkouts.length);
    console.log('📅 Target date:', targetDate);
    console.log('📋 All dates:', allWorkouts.map(w => w.date));
    
    // Remove existing workout for this date if it exists
    allWorkouts = allWorkouts.filter(day => {
      const shouldKeep = day.date !== targetDate;
      if (!shouldKeep) {
        console.log('🗑️ Removing existing workout for date:', day.date);
      }
      return shouldKeep;
    });
    
    console.log('✅ Workouts after filter:', allWorkouts.length);
  }

  // Add the new workout with the date (don't add updated_at to the workout object)
  const workoutWithDate: WorkoutDay = {
    ...workoutData,
    date: targetDate
  };

  // Keep only last 30 days
  allWorkouts.push(workoutWithDate);
  allWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  console.log('📦 Before slice - Total workouts:', allWorkouts.length);
  allWorkouts = allWorkouts.slice(0, 30);
  console.log('✂️ After slice - Keeping workouts:', allWorkouts.length);

  // Save to Firestore - IMPORTANT: Use setDoc WITHOUT merge to replace the entire document
  await setDoc(workoutDocRef, { 
    workout: allWorkouts,
    last_updated: Timestamp.now()
  });

  console.log("✅ Workout saved for date:", targetDate);
  console.log("💾 Total workouts now in DB:", allWorkouts.length);
};

// Check and clear workouts at midnight
export const checkAndClearDailyWorkout = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const workoutDocRef = doc(db, "Workout_Exercises", user.uid);
  const workoutDocSnap = await getDoc(workoutDocRef);

  if (!workoutDocSnap.exists()) {
    return;
  }

  const data = workoutDocSnap.data();
  const lastUpdated = data.last_updated?.toDate();
  const today = new Date(getTodayEST());
  
  // Check if we've already updated today
  if (lastUpdated && lastUpdated.toDateString() === today.toDateString()) {
    return; // Already updated today
  }

  // Clear today's workout slot (it will be empty for the new day)
  const allWorkouts = data.workout || [];
  
  // Remove any existing workout for today (in case of stale data)
  const filteredWorkouts = allWorkouts.filter((day: any) => day.date !== getTodayEST());
  
  // Update the document
  await setDoc(workoutDocRef, { 
    workout: filteredWorkouts,
    last_updated: Timestamp.now()
  }, { merge: true });

  console.log("✅ Daily workout slot cleared for new day");
};

// Get workout history (last 30 days)
export const getWorkoutHistory = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const workoutDocRef = doc(db, "Workout_Exercises", user.uid);
  const workoutDocSnap = await getDoc(workoutDocRef);

  if (!workoutDocSnap.exists()) {
    return [];
  }

  const data = workoutDocSnap.data();
  return data.workout || [];
};

// Add this helper function to determine day of week from date string
const getDayOfWeekFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// New function to update Weekly_Facts when a meal is added
export const updateWeeklyFactsOnMealAdd = async (
  userId: string,
  calories: number,
  mealDate: string
) => {
  try {
    const docRef = doc(db, "Weekly_Facts", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error("❌ Weekly_Facts document does not exist for user:", userId);
      return;
    }

    const data = docSnap.data();
    const dayOfWeek = getDayOfWeekFromDate(mealDate);
    
    console.log(`📅 Updating Weekly_Facts for ${dayOfWeek} with ${calories} calories`);

    // Update the specific day's consumed calories
    const updatedDaysConsumed = {
      ...data.days_consumed,
      [dayOfWeek]: (data.days_consumed[dayOfWeek] || 0) + calories
    };

    // Calculate new totals
    const newTotalCals = Object.values(updatedDaysConsumed).reduce((sum: number, val: any) => sum + val, 0);
    const totalBurned = data.total_burned || 0;
    const newNetCalories = newTotalCals - totalBurned;

    // Update days_net for this specific day
    const updatedDaysNet = {
      ...data.days_net,
      [dayOfWeek]: updatedDaysConsumed[dayOfWeek] - (data.days_burned[dayOfWeek] || 0)
    };

    await updateDoc(docRef, {
      total_cals: newTotalCals,
      net_calories: newNetCalories,
      days_consumed: updatedDaysConsumed,
      days_net: updatedDaysNet
    });

    console.log(`✅ Weekly_Facts updated: ${dayOfWeek} +${calories} cals, Total: ${newTotalCals}`);
  } catch (error) {
    console.error("❌ Error updating Weekly_Facts:", error);
  }
};

// Function to recalculate Weekly_Facts from all meals (useful for corrections)
export const recalculateWeeklyFacts = async (userId: string) => {
  try {
    const nutritionDocRef = doc(db, "Daily_Nutrition_Summary", userId);
    const nutritionSnap = await getDoc(nutritionDocRef);

    if (!nutritionSnap.exists()) {
      console.log("No nutrition data found");
      return;
    }

    const meals = nutritionSnap.data()?.todays_meals || [];
    
    // Get current week's date range (Sunday to Saturday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay); // Go back to Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday
    weekEnd.setHours(23, 59, 59, 999);

    // Initialize days object
    const daysConsumed = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0
    };

    // Sum up calories for each day
    meals.forEach((meal: any) => {
      const mealDate = new Date(meal.meal_date);
      
      // Only count meals from current week
      if (mealDate >= weekStart && mealDate <= weekEnd) {
        const dayOfWeek = getDayOfWeekFromDate(meal.meal_date) as keyof typeof daysConsumed;
        daysConsumed[dayOfWeek] += meal.calories || 0;
      }
    });

    // Calculate total
    const totalCals = Object.values(daysConsumed).reduce((sum, val) => sum + val, 0);

    // Get current Weekly_Facts to preserve burned data
    const weeklyDocRef = doc(db, "Weekly_Facts", userId);
    const weeklySnap = await getDoc(weeklyDocRef);
    
    let daysBurned = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0
    };
    
    let totalBurned = 0;

    if (weeklySnap.exists()) {
      const weeklyData = weeklySnap.data();
      daysBurned = weeklyData.days_burned || daysBurned;
      totalBurned = weeklyData.total_burned || 0;
    }

    // Calculate net for each day
    const daysNet: { [key: string]: number } = {};
    Object.keys(daysConsumed).forEach((day: string) => {
      const dayKey = day as keyof typeof daysConsumed;
      daysNet[day] = daysConsumed[dayKey] - daysBurned[dayKey];
    });

    const netCalories = totalCals - totalBurned;

    // Update Weekly_Facts
    await setDoc(weeklyDocRef, {
      total_cals: totalCals,
      total_burned: totalBurned,
      net_calories: netCalories,
      total_workouts: weeklySnap.exists() ? weeklySnap.data().total_workouts : 0,
      days_consumed: daysConsumed,
      days_burned: daysBurned,
      days_net: daysNet
    });

    console.log("✅ Weekly_Facts recalculated successfully");
  } catch (error) {
    console.error("❌ Error recalculating Weekly_Facts:", error);
  }
};

//  📊 Get the user's Weekly_Facts document
export const getWeeklyFacts = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not logged in");
  }

  const weeklyFactsRef = doc(db, "Weekly_Facts", user.uid);
  const weeklyFactsSnap = await getDoc(weeklyFactsRef);

  if (!weeklyFactsSnap.exists()) {
    console.warn("⚠️ No Weekly_Facts document found for this user");
    return null;
  }

  return weeklyFactsSnap.data() as {
    total_cals: number;
    total_burned: number;
    net_calories: number;
    total_workouts: number;
    days_consumed: Record<string, number>;
    days_burned: Record<string, number>;
    days_net: Record<string, number>;
  };
};

// Please bro
// Add this to your userService.ts file

// Function to check and update daily metrics based on nutrition data
export const updateDailyMetrics = async (userId: string) => {
  try {
    // Get today's nutrition data
    const todayMeals = await getTodayMeals(userId);
    const fitnessGoals = await getUserFitnessGoals(userId);
    
    if (!fitnessGoals) {
      console.error("No fitness goals found for user:", userId);
      return;
    }

    // Calculate totals from today's meals
    const todayTotals = todayMeals.reduce((acc: any, meal: any) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0),
      fiber: acc.fiber + (meal.fiber || 0),
      mealCount: acc.mealCount + 1,
      hasFruitsVeggies: acc.hasFruitsVeggies || (meal.food_name && isFruitOrVeggie(meal.food_name))
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      mealCount: 0,
      hasFruitsVeggies: false
    });

    // Determine which goals were hit today
    const dailyMetrics = {
      hit_protein_goal: todayTotals.protein >= (fitnessGoals.protein_target || 0),
      hit_carbs_goal: todayTotals.carbs >= (fitnessGoals.carbs_target || 0) && 
                      todayTotals.carbs <= (fitnessGoals.carbs_target || 0) * 1.2, // Within 20% range
      hit_fats_goal: todayTotals.fats >= (fitnessGoals.fats_target || 0),
      hit_fiber_goal: todayTotals.fiber >= (fitnessGoals.fiber_target || 0),
      logged_full_meals: todayTotals.mealCount >= 3, // 3+ meals logged
      had_fruits_veggies: todayTotals.hasFruitsVeggies,
      // For hydration, we'll use dummy data for now since it's not implemented
      hit_hydration_goal: Math.random() > 0.3, // 70% chance for demo
      // For sugar control - assuming target is calculated or has default
      stayed_under_sugar: todayTotals.carbs * 0.2 <= 50 // Simple sugar estimate
    };

    // Update Daily_Metric
    const dailyMetricRef = doc(db, "Daily_Metric", userId);
    await updateDoc(dailyMetricRef, dailyMetrics);

    console.log("✅ Daily metrics updated:", dailyMetrics);
    
    // Update streaks based on today's performance
    await updateFoodStreaks(userId, dailyMetrics);
    
  } catch (error) {
    console.error("❌ Error updating daily metrics:", error);
  }
};

// Helper function to check if food contains fruits/veggies (simplified)
const isFruitOrVeggie = (foodName: string): boolean => {
  const fruitVeggieKeywords = [
    'apple', 'banana', 'orange', 'berry', 'grape', 'melon',
    'broccoli', 'spinach', 'lettuce', 'carrot', 'tomato', 'pepper',
    'onion', 'garlic', 'cucumber', 'zucchini', 'potato', 'sweet potato',
    'avocado', 'mango', 'pineapple', 'peach', 'pear', 'plum'
  ];
  
  return fruitVeggieKeywords.some(keyword => 
    foodName.toLowerCase().includes(keyword)
  );
};

// Update food streaks based on daily metrics
const updateFoodStreaks = async (userId: string, dailyMetrics: any) => {
  try {
    const streakRef = doc(db, "Food_Streak_Tracker", userId);
    const streakSnap = await getDoc(streakRef);
    const achievementsRef = doc(db, "User_Achievements", userId);
    const achievementsSnap = await getDoc(achievementsRef);

    if (!streakSnap.exists() || !achievementsSnap.exists()) {
      console.error("Missing streak tracker or achievements document");
      return;
    }

    const currentStreaks = streakSnap.data();
    const currentAchievements = achievementsSnap.data();
    const updates: any = {};

    // Protein streaks
    if (dailyMetrics.hit_protein_goal) {
      updates.protein_track_days = (currentStreaks.protein_track_days || 0) + 1;
    } else if (!currentAchievements.macro_master && !currentAchievements.protein_champ) {
      updates.protein_track_days = 0;
    }

    // Carbs streaks
    if (dailyMetrics.hit_carbs_goal) {
      updates.carbs_track_days = (currentStreaks.carbs_track_days || 0) + 1;
    } else if (!currentAchievements.carb_control) {
      updates.carbs_track_days = 0;
    }

    // Fats streaks
    if (dailyMetrics.hit_fats_goal) {
      updates.fats_track_days = (currentStreaks.fats_track_days || 0) + 1;
    } else if (!currentAchievements.fat_balance) {
      updates.fats_track_days = 0;
    }

    // Fiber streaks (total days, not consecutive)
    if (dailyMetrics.hit_fiber_goal) {
      updates.fiber_track_days = (currentStreaks.fiber_track_days || 0) + 1;
    }

    // Micronutrient (fruits/veggies) - weekly tracking
    if (dailyMetrics.had_fruits_veggies) {
      updates.micronutrient_track_days = (currentStreaks.micronutrient_track_days || 0) + 1;
    }

    // Full meals logged
    if (dailyMetrics.logged_full_meals) {
      updates.loggedMeals_track_days = (currentStreaks.loggedMeals_track_days || 0) + 1;
    } else if (!currentAchievements.clean_plate_club) {
      updates.loggedMeals_track_days = 0;
    }

    // Hydration
    if (dailyMetrics.hit_hydration_goal) {
      updates.hyrdration_track_days = (currentStreaks.hyrdration_track_days || 0) + 1;
    } else if (!currentAchievements.hydration_hero) {
      updates.hyrdration_track_days = 0;
    }

    // Sugar control
    if (dailyMetrics.stayed_under_sugar) {
      updates.sugar_track_days = (currentStreaks.sugar_track_days || 0) + 1;
    } else if (!currentAchievements.sugar_smart) {
      updates.sugar_track_days = 0;
    }

    // Update streaks
    await updateDoc(streakRef, updates);
    console.log("✅ Food streaks updated:", updates);

    // Check for new achievements
    await checkAchievements(userId, { ...currentStreaks, ...updates });

  } catch (error) {
    console.error("❌ Error updating food streaks:", error);
  }
};

// Check and unlock achievements based on streak counts
const checkAchievements = async (userId: string, streaks: any) => {
  try {
    const achievementsRef = doc(db, "User_Achievements", userId);
    const achievementsSnap = await getDoc(achievementsRef);

    if (!achievementsSnap.exists()) return;

    const currentAchievements = achievementsSnap.data();
    const newAchievements: any = {};

    // Check each achievement condition
    if (!currentAchievements.macro_master && streaks.protein_track_days >= 5) {
      newAchievements.macro_master = true;
    }

    if (!currentAchievements.protein_champ && streaks.protein_track_days >= 30) {
      newAchievements.protein_champ = true;
    }

    if (!currentAchievements.carb_control && streaks.carbs_track_days >= 7) {
      newAchievements.carb_control = true;
    }

    if (!currentAchievements.fat_balance && streaks.fats_track_days >= 10) {
      newAchievements.fat_balance = true;
    }

    if (!currentAchievements.micronutr_minded && streaks.micronutrient_track_days >= 5) {
      newAchievements.micronutr_minded = true;
    }

    if (!currentAchievements.clean_plate_club && streaks.loggedMeals_track_days >= 7) {
      newAchievements.clean_plate_club = true;
    }

    if (!currentAchievements.hydration_hero && streaks.hyrdration_track_days >= 7) {
      newAchievements.hydration_hero = true;
    }

    if (!currentAchievements.fiber_fiend && streaks.fiber_track_days >= 10) {
      newAchievements.fiber_fiend = true;
    }

    if (!currentAchievements.sugar_smart && streaks.sugar_track_days >= 7) {
      newAchievements.sugar_smart = true;
    }

    // Update achievements if any new ones were unlocked
    if (Object.keys(newAchievements).length > 0) {
      await updateDoc(achievementsRef, newAchievements);
      console.log("🎉 New achievements unlocked:", newAchievements);
      
      // Update FareScore for achievements
      const achievementCount = Object.values(newAchievements).filter(Boolean).length;
      await updateUserFareScoreOnLog(userId, `achievement_unlocked_${achievementCount}`);
    }

  } catch (error) {
    console.error("❌ Error checking achievements:", error);
  }
};

// Function to get user achievements
export const getUserAchievements = async (userId: string) => {
  try {
    const achievementsRef = doc(db, "User_Achievements", userId);
    const achievementsSnap = await getDoc(achievementsRef);

    if (!achievementsSnap.exists()) {
      return null;
    }

    return achievementsSnap.data();
  } catch (error) {
    console.error("❌ Error fetching user achievements:", error);
    return null;
  }
};

// Function to get food streaks
export const getFoodStreaks = async (userId: string) => {
  try {
    const streakRef = doc(db, "Food_Streak_Tracker", userId);
    const streakSnap = await getDoc(streakRef);

    if (!streakSnap.exists()) {
      return null;
    }

    return streakSnap.data();
  } catch (error) {
    console.error("❌ Error fetching food streaks:", error);
    return null;
  }
};

// Reset streaks at midnight (call this in a daily cron job)
export const resetDailyMetrics = async (userId: string) => {
  try {
    const dailyMetricRef = doc(db, "Daily_Metric", userId);
    await updateDoc(dailyMetricRef, {
      hit_protein_goal: false,
      hit_carbs_goal: false,
      hit_fats_goal: false,
      hit_fiber_goal: false,
      logged_full_meals: false,
      had_fruits_veggies: false,
      hit_hydration_goal: false,
      stayed_under_sugar: false
    });
    
    console.log("✅ Daily metrics reset for new day");
  } catch (error) {
    console.error("❌ Error resetting daily metrics:", error);
  }
};

// ============================================================================
// LEADERBOARD FUNCTIONS
// ============================================================================

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  fareScore: number;
  tier: string;
  change: number;
  isCurrentUser?: boolean;
}

// Helper function to get tier from score (import from fareScoreCalculator if available)
const getTierFromScore = (score: number): string => {
  if (score >= 800) return 'FareFit Elite';
  if (score >= 700) return 'Goal Crusher';
  if (score >= 550) return 'Consistent Tracker';
  if (score >= 400) return 'Building Habits';
  return 'Starting Journey';
};

/**
 * Get global leaderboard - Top users by FareScore
 */
export const getGlobalLeaderboard = async (limitCount: number = 50): Promise<LeaderboardEntry[]> => {
  try {
    console.log(`🏆 Fetching global leaderboard (top ${limitCount})`);
    
    // Query all FareScore documents, ordered by score descending
    const leaderboardQuery = query(
      collection(db, "FareScore"),
      orderBy("score", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(leaderboardQuery);
    const leaderboardData: LeaderboardEntry[] = [];
    const currentUserId = getAuth().currentUser?.uid;
    
    // Process each user in the leaderboard
    let rank = 1;
    for (const fareScoreDoc of snapshot.docs) {
      const fareData = fareScoreDoc.data();
      const userId = fareScoreDoc.id;
      
      // Get user profile for name/email
      const userDoc = await getDoc(doc(db, "Users", userId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Generate username from name
      const fullName = userData.full_name || userData.name || "Anonymous User";
      const username = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12) || 'user' + userId.substring(0, 4)}`;
      
      leaderboardData.push({
        rank,
        name: fullName,
        username,
        avatar: userData.avatar || '',
        fareScore: fareData.score || 350,
        tier: getTierFromScore(fareData.score || 350),
        change: fareData.weeklyChange || 0,
        isCurrentUser: userId === currentUserId
      });
      
      rank++;
    }
    
    console.log(`✅ Global leaderboard loaded: ${leaderboardData.length} users`);
    return leaderboardData;
    
  } catch (error) {
    console.error("❌ Error fetching global leaderboard:", error);
    return [];
  }
};

// ============================================================================
// FRIENDS MANAGEMENT
// ============================================================================

/**
 * Add a friend by userId
 */
export const addFriend = async (currentUserId: string, friendUserId: string): Promise<boolean> => {
  try {
    // Add friend to current user's friends list
    const currentUserFriendsRef = doc(db, "User_Friends", currentUserId);
    const currentUserFriendsSnap = await getDoc(currentUserFriendsRef);
    
    let currentFriends: string[] = [];
    if (currentUserFriendsSnap.exists()) {
      currentFriends = currentUserFriendsSnap.data().friendsList || [];
    }
    
    // Check if already friends
    if (currentFriends.includes(friendUserId)) {
      console.log("Already friends with this user");
      return false;
    }
    
    // Add to friends list
    currentFriends.push(friendUserId);
    await setDoc(currentUserFriendsRef, { friendsList: currentFriends });
    
    // Add current user to friend's friends list (mutual friendship)
    const friendUserFriendsRef = doc(db, "User_Friends", friendUserId);
    const friendUserFriendsSnap = await getDoc(friendUserFriendsRef);
    
    let friendFriends: string[] = [];
    if (friendUserFriendsSnap.exists()) {
      friendFriends = friendUserFriendsSnap.data().friendsList || [];
    }
    
    if (!friendFriends.includes(currentUserId)) {
      friendFriends.push(currentUserId);
      await setDoc(friendUserFriendsRef, { friendsList: friendFriends });
    }
    
    console.log(`✅ Friend added: ${currentUserId} <-> ${friendUserId}`);
    return true;
    
  } catch (error) {
    console.error("❌ Error adding friend:", error);
    return false;
  }
};

/**
 * Get user's friends list
 */
export const getUserFriends = async (userId: string): Promise<string[]> => {
  try {
    const friendsDoc = await getDoc(doc(db, "User_Friends", userId));
    if (friendsDoc.exists()) {
      return friendsDoc.data().friendsList || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Error getting user friends:", error);
    return [];
  }
};

/**
 * Get friends leaderboard - User's actual friends ranked by FareScore
 */
export const getFriendsLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const currentUserId = getAuth().currentUser?.uid;
    if (!currentUserId) {
      console.log("❌ No current user for friends leaderboard");
      return [];
    }
    
    console.log("👥 Fetching real friends leaderboard");
    
    // Get user's actual friends list
    const friendIds = await getUserFriends(currentUserId);
    
    if (friendIds.length === 0) {
      console.log("📭 No friends found");
      return [];
    }
    
    console.log(`Found ${friendIds.length} friends:`, friendIds);
    
    // Get FareScore data for all friends
    const friendsData: LeaderboardEntry[] = [];
    
    for (const friendId of friendIds) {
      try {
        // Get friend's FareScore
        const fareScoreDoc = await getDoc(doc(db, "FareScore", friendId));
        const fareData = fareScoreDoc.exists() ? fareScoreDoc.data() : { score: 350 };
        
        // Get friend's profile
        const userDoc = await getDoc(doc(db, "Users", friendId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const fullName = userData.full_name || userData.name || "Friend";
        const username = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12) || 'friend' + friendId.substring(0, 4)}`;
        
        friendsData.push({
          rank: 0, // Will be set after sorting
          name: fullName,
          username,
          avatar: userData.avatar || '',
          fareScore: fareData.score || 350,
          tier: getTierFromScore(fareData.score || 350),
          change: fareData.weeklyChange || 0,
          isCurrentUser: friendId === currentUserId
        });
        
      } catch (error) {
        console.error(`❌ Error fetching data for friend ${friendId}:`, error);
      }
    }
    
    // Add current user to the list
    try {
      const userFareDoc = await getDoc(doc(db, "FareScore", currentUserId));
      const userFareData = userFareDoc.exists() ? userFareDoc.data() : { score: 350 };
      
      const userDoc = await getDoc(doc(db, "Users", currentUserId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const fullName = userData.full_name || userData.name || "You";
      const username = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12) || 'you'}`;
      
      friendsData.push({
        rank: 0, // Will be set after sorting
        name: fullName,
        username,
        avatar: userData.avatar || '',
        fareScore: userFareData.score || 350,
        tier: getTierFromScore(userFareData.score || 350),
        change: userFareData.weeklyChange || 0,
        isCurrentUser: true
      });
    } catch (error) {
      console.error("❌ Error fetching current user data:", error);
    }
    
    // Sort by score and assign ranks
    friendsData.sort((a, b) => b.fareScore - a.fareScore);
    friendsData.forEach((friend, index) => {
      friend.rank = index + 1;
    });
    
    console.log(`✅ Real friends leaderboard loaded: ${friendsData.length} friends`);
    return friendsData;
    
  } catch (error) {
    console.error("❌ Error fetching friends leaderboard:", error);
    return [];
  }
};

// ============================================================================
// AI PLAN INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get user's active AI-generated plan summary for dashboard display
 */
export const getUserActivePlanSummary = async (userId: string) => {
  try {
    // Import the function from planStorageService
    const { getUserPlanSummary } = await import('./services/planStorageService');
    return await getUserPlanSummary(userId);
  } catch (error) {
    console.error("❌ Error fetching user plan summary:", error);
    return null;
  }
};

/**
 * Check if user has an active AI plan
 */
export const hasActiveUserPlan = async (userId: string): Promise<boolean> => {
  try {
    // Import the function from planStorageService
    const { getActiveUserPlan } = await import('./services/planStorageService');
    const plan = await getActiveUserPlan(userId);
    return plan !== null;
  } catch (error) {
    console.error("❌ Error checking for active user plan:", error);
    return false;
  }
};

/**
 * Update fitness goals with TDEE and plan data when AI plan is generated
 */
export const updateFitnessGoalsFromPlan = async (
  userId: string,
  planData: {
    tdee: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    goalType: string;
    age: number;
    weight: number;
    height: number;
    gender: string;
    activityLevel: string;
  }
) => {
  try {
    const fitnessGoalRef = doc(db, "Fitness_Goals", userId);
    
    await updateDoc(fitnessGoalRef, {
      // Physical data
      age: planData.age,
      weight: planData.weight,
      height: planData.height,
      gender: planData.gender,
      activity_level: planData.activityLevel,
      
      // Goal type
      goal_type: planData.goalType,
      
      // Calculated values
      tdee: planData.tdee,
      target_calories: planData.targetCalories,
      protein_target: planData.protein,
      carbs_target: planData.carbs,
      fats_target: planData.fat,
      fiber_target: planData.fiber,
      
      // Metadata
      updated_at: Timestamp.now(),
      is_active: true
    });

    console.log(`✅ Updated fitness goals for user ${userId} with AI plan data`);
  } catch (error) {
    console.error("❌ Error updating fitness goals from plan:", error);
    throw error;
  }
};

/**
 * Initialize plan-related collections for new users
 */
export const initializePlanCollectionsForUser = async (userId: string) => {
  try {
    // This function is called during user creation to ensure 
    // plan-related collections are ready for use
    
    // The User_Plans collection is created on-demand when first plan is generated
    // No need to pre-create documents
    
    console.log(`✅ Plan collections initialized for user ${userId}`);
  } catch (error) {
    console.error("❌ Error initializing plan collections:", error);
    throw error;
  }
};

// Add to userService.ts
export const getTodaysWorkoutStatus = async (userId: string): Promise<boolean> => {
  try {
    const workoutData = await getWorkoutExercises();
    return workoutData?.workout?.length > 0;
  } catch (error) {
    console.error('Error checking workout status:', error);
    return false;
  }
};