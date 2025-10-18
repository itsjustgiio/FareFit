import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function showUserMeals() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.warn("⚠️ No user signed in. Please log in first.");
    return;
  }

  const db = getFirestore();
  const docRef = doc(db, "Daily_Nutrition_Summary", user.uid);

  console.log(`\n🍎 Fetching meals for user: ${user.email} (${user.uid})\n`);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("❌ No meal document found for this user.");
      return;
    }

    const data = docSnap.data();
    const meals = data?.todays_meals || [];

    if (meals.length === 0) {
      console.log("📭 No meals logged yet.");
      return;
    }

    console.log(`📊 Found ${meals.length} meal(s):`);
    console.log("═".repeat(60));

    // Group meals by date
    const mealsByDate = meals.reduce((acc: any, meal: any) => {
      const date = meal.meal_date || 'Unknown date';
      if (!acc[date]) acc[date] = [];
      acc[date].push(meal);
      return acc;
    }, {});

    // Display meals organized by date
    Object.entries(mealsByDate).forEach(([date, dayMeals]: [string, any]) => {
      console.log(`\n📅 ${date}:`);
      
      // Group by meal type within each day
      const mealsByType = dayMeals.reduce((acc: any, meal: any) => {
        const type = meal.meal_type || 'Unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(meal);
        return acc;
      }, {});

      Object.entries(mealsByType).forEach(([mealType, typeMeals]: [string, any]) => {
        console.log(`\n  🍽️ ${mealType.toUpperCase()}:`);
        
        typeMeals.forEach((meal: any, index: number) => {
          console.log(`    ${index + 1}. ${meal.food_name || "Unnamed"} ${meal.brand ? `(${meal.brand})` : ''}`);
          console.log(`       Serving: ${meal.serving_size || 'N/A'}`);
          console.log(`       📊 ${meal.calories || 0} kcal | 🥩 ${meal.protein || 0}g | 🍞 ${meal.carbs || 0}g | 🧈 ${meal.fats || 0}g | 🌾 ${meal.fiber || 0}g`);
        });
      });
    });

    // Calculate totals for today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todaysMeals = meals.filter((meal: any) => meal.meal_date === today);
    
    if (todaysMeals.length > 0) {
      const totals = todaysMeals.reduce((acc: any, meal: any) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0),
        fiber: acc.fiber + (meal.fiber || 0)
      }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

      console.log(`\n🎯 TODAY'S TOTALS (${today}):`);
      console.log(`🔥 ${totals.calories.toFixed(1)} kcal | 🥩 ${totals.protein.toFixed(1)}g | 🍞 ${totals.carbs.toFixed(1)}g | 🧈 ${totals.fats.toFixed(1)}g | 🌾 ${totals.fiber.toFixed(1)}g`);
    }

    console.log(`\n✅ Meal data fetched successfully! Total meals: ${meals.length}`);
  } catch (error) {
    console.error("🔥 Error fetching meals:", error);
  }
}

// For easier console access, also expose a shorter version
export async function meals() {
  return showUserMeals();
}

// Quick summary version
export async function mealSummary() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.warn("⚠️ No user signed in.");
    return;
  }

  const db = getFirestore();
  const docRef = doc(db, "Daily_Nutrition_Summary", user.uid);

  try {
    const docSnap = await getDoc(docRef);
    const meals = docSnap.exists() ? (docSnap.data()?.todays_meals || []) : [];
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = meals.filter((meal: any) => meal.meal_date === today);

    console.log(`📊 User: ${user.email}`);
    console.log(`📝 Total meals logged: ${meals.length}`);
    console.log(`🗓️ Today's meals: ${todaysMeals.length}`);
    
    if (todaysMeals.length > 0) {
      const calories = todaysMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
      console.log(`🔥 Today's calories: ${calories.toFixed(1)} kcal`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}