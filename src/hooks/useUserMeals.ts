import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface Meal {
  meal_date: string;
  meal_type: string;
  food_name: string;
  brand?: string;
  serving_size: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function useUserMeals(targetDate?: Date) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<NutritionTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });

  useEffect(() => {
    const auth = getAuth();
    
    // Wait for auth state to be determined
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setMeals([]);
        setTotals({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
        setLoading(false);
        return;
      }

      const db = getFirestore();
      const docRef = doc(db, "Daily_Nutrition_Summary", user.uid);

      console.log("🔄 Setting up real-time meal listener for user:", user.uid);

      // 👇 Real-time Firestore listener
      const unsubscribeFirestore = onSnapshot(
        docRef,
        (snapshot) => {
          const data = snapshot.data();
          const allMeals = (data?.todays_meals || []) as Meal[];
          
          // Filter for target date (defaults to today if not specified)
          const dateString = targetDate 
            ? targetDate.toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
          const filteredMeals = allMeals.filter(meal => meal.meal_date === dateString);
          
          // Calculate totals for the selected date
          const calculatedTotals = filteredMeals.reduce(
            (acc, meal) => ({
              calories: acc.calories + (meal.calories || 0),
              protein: acc.protein + (meal.protein || 0),
              carbs: acc.carbs + (meal.carbs || 0),
              fat: acc.fat + (meal.fats || 0), // Note: 'fats' in Firestore
              fiber: acc.fiber + (meal.fiber || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );
          
          setMeals(filteredMeals);
          setTotals(calculatedTotals);
          setLoading(false);
          
          console.log("📊 Meals updated:", {
            mealCount: filteredMeals.length,
            totals: calculatedTotals
          });
        },
        (error) => {
          console.error("🔥 Firestore listener error:", error);
          setLoading(false);
        }
      );

      // Cleanup function will be returned by the auth listener
      return unsubscribeFirestore;
    });

    // Return cleanup function
    return () => {
      unsubscribeAuth();
    };
  }, [targetDate]); // Re-run when targetDate changes

  // Helper functions
  const getMealsByType = () => {
    return meals.reduce((acc, meal) => {
      const type = meal.meal_type.toLowerCase();
      if (!acc[type]) acc[type] = [];
      acc[type].push(meal);
      return acc;
    }, {} as Record<string, Meal[]>);
  };

  const getMealTypeOrder = () => {
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    const grouped = getMealsByType();
    return mealOrder.filter(type => grouped[type]?.length > 0);
  };

  return { 
    meals, 
    loading, 
    totals,
    getMealsByType,
    getMealTypeOrder
  };
}