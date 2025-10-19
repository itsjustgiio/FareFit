// utils/dailyScoreCalculator.ts

export interface DailyScoreBreakdown {
  mealsLogged: { earned: number; max: number };
  workoutCompleted: { earned: number; max: number };
  macrosHit: { earned: number; max: number };
  consistencyBonus: { earned: number; max: number };
}

export interface DailyScoreData {
  totalScore: number;
  breakdown: DailyScoreBreakdown;
}

/**
 * Calculate today's score based on user activities
 */
export const calculateDailyScore = async (userId: string): Promise<DailyScoreData> => {
  try {
    // Import your userService functions
    const { getTodayMeals, getWorkoutExercises, getUserFitnessGoals, updateDailyMetrics } = await import('../userService');
    
    // Get today's data with error handling
    let todayMeals: any[] = [];
    let workoutData: any = null; // Use any type for workoutData
    let fitnessGoals: any = null; // Use any type for fitnessGoals
    
    try {
      const mealsResult = await getTodayMeals(userId);
      todayMeals = Array.isArray(mealsResult) ? mealsResult : [];
    } catch (error) {
      console.error('Error fetching meals:', error);
      todayMeals = [];
    }
    
    try {
      workoutData = await getWorkoutExercises();
    } catch (error) {
      console.error('Error fetching workout:', error);
      workoutData = { workout: [] };
    }
    
    try {
      fitnessGoals = await getUserFitnessGoals(userId);
    } catch (error) {
      console.error('Error fetching fitness goals:', error);
      fitnessGoals = null;
    }
    
    // Calculate base scores
    const mealsLogged = calculateMealsScore(todayMeals);
    const workoutCompleted = calculateWorkoutScore(workoutData);
    const macrosHit = await calculateMacrosScore(todayMeals, fitnessGoals, userId);
    
    // Calculate bonus (your specific logic)
    const consistencyBonus = calculateBonus(mealsLogged, workoutCompleted, macrosHit);
    
    // Total score (0-100)
    const totalScore = mealsLogged.earned + workoutCompleted.earned + macrosHit.earned + consistencyBonus.earned;
    
    return {
      totalScore,
      breakdown: {
        mealsLogged,
        workoutCompleted,
        macrosHit,
        consistencyBonus
      }
    };
    
  } catch (error) {
    console.error('Error calculating daily score:', error);
    return getDefaultScore();
  }
};

/**
 * Calculate meals logged score (max 30 points)
 */
const calculateMealsScore = (meals: any[]): { earned: number; max: number } => {
  const mealCount = Array.isArray(meals) ? meals.length : 0;
  
  // 10 points per meal, max 3 meals = 30 points
  const earned = Math.min(mealCount * 10, 30);
  
  return { earned, max: 30 };
};

/**
 * Calculate workout score (max 30 points)
 */
const calculateWorkoutScore = (workoutData: any): { earned: number; max: number } => {
  // Handle different possible return types from getWorkoutExercises
  const workoutArray = workoutData?.workout || [];
  const hasWorkout = Array.isArray(workoutArray) && workoutArray.length > 0;
  
  // 30 points for any workout completed
  return { earned: hasWorkout ? 30 : 0, max: 30 };
};

/**
 * Calculate macros hit score (max 25 points)
 */
const calculateMacrosScore = async (meals: any[], fitnessGoals: any, userId: string): Promise<{ earned: number; max: number }> => {
  if (!fitnessGoals || !Array.isArray(meals) || meals.length === 0) {
    return { earned: 0, max: 25 };
  }
  
  try {
    // Update daily metrics to get current macro status
    const { updateDailyMetrics } = await import('../userService');
    await updateDailyMetrics(userId);
    
    // Simplified macro check - you can enhance this later
    const totalProtein = meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
    const proteinTarget = Number(fitnessGoals.protein_target) || 0;
    
    // 25 points if protein target is met (simplified for now)
    const earned = totalProtein >= proteinTarget ? 25 : 0;
    
    return { earned, max: 25 };
  } catch (error) {
    console.error('Error calculating macros score:', error);
    return { earned: 0, max: 25 };
  }
};

/**
 * Calculate bonus points based on your specific logic
 */
const calculateBonus = (
  meals: { earned: number; max: number },
  workout: { earned: number; max: number },
  macros: { earned: number; max: number }
): { earned: number; max: number } => {
  let bonus = 0;
  const maxBonus = 15;
  
  // Your specific logic:
  // - 3 meals logged = +5 points
  if (meals.earned >= 30) { // 30 points means 3 meals
    bonus += 5;
  }
  
  // - Workout done = +5 points  
  if (workout.earned > 0) {
    bonus += 5;
  }
  
  // - Macros hit = +5 points
  if (macros.earned > 0) {
    bonus += 5;
  }
  
  return { earned: Math.min(bonus, maxBonus), max: maxBonus };
};

const getDefaultScore = (): DailyScoreData => ({
  totalScore: 0,
  breakdown: {
    mealsLogged: { earned: 0, max: 30 },
    workoutCompleted: { earned: 0, max: 30 },
    macrosHit: { earned: 0, max: 25 },
    consistencyBonus: { earned: 0, max: 15 }
  }
});