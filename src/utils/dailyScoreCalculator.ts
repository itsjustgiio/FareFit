/**
 * Daily Score Calculator (0-100)
 * 
 * Measures how close the user is to earning maximum points for the current day.
 * This is separate from FareScore and resets daily.
 */

export interface DailyScoreBreakdown {
  total: number;
  mealsLogged: { earned: number; max: number };
  workoutCompleted: { earned: number; max: number };
  macrosHit: { earned: number; max: number };
  consistencyBonus: { earned: number; max: number };
}

export interface DailyScoreInput {
  mealsLoggedCount: number; // Number of meals logged today
  workoutCompleted: boolean;
  loggedCalories: number;
  targetCalories: number;
  loggedProtein: number;
  targetProtein: number;
  loggedCarbs?: number;
  targetCarbs?: number;
  loggedFat?: number;
  targetFat?: number;
}

/**
 * Calculate daily score with detailed breakdown
 */
export function calculateDailyScore(input: DailyScoreInput): DailyScoreBreakdown {
  const breakdown: DailyScoreBreakdown = {
    total: 0,
    mealsLogged: { earned: 0, max: 30 },
    workoutCompleted: { earned: 0, max: 30 },
    macrosHit: { earned: 0, max: 25 },
    consistencyBonus: { earned: 0, max: 15 },
  };

  // 1. Meals Logged (30 points max)
  // Award points based on how many meals logged
  if (input.mealsLoggedCount >= 3) {
    breakdown.mealsLogged.earned = 30;
  } else if (input.mealsLoggedCount === 2) {
    breakdown.mealsLogged.earned = 20;
  } else if (input.mealsLoggedCount === 1) {
    breakdown.mealsLogged.earned = 10;
  }
  // Simple heuristic: if calories > 500, assume at least 2 meals
  else if (input.loggedCalories >= 500) {
    breakdown.mealsLogged.earned = 20;
  } else if (input.loggedCalories >= 200) {
    breakdown.mealsLogged.earned = 10;
  }

  // 2. Workout Completed (30 points max)
  if (input.workoutCompleted) {
    breakdown.workoutCompleted.earned = 30;
  }

  // 3. Macros Hit (25 points max)
  // Check if user is within acceptable range of their targets
  const caloriesDiff = Math.abs(input.loggedCalories - input.targetCalories);
  const caloriesPercent = input.targetCalories > 0 
    ? (caloriesDiff / input.targetCalories) * 100 
    : 100;

  const proteinDiff = Math.abs(input.loggedProtein - input.targetProtein);
  const proteinPercent = input.targetProtein > 0 
    ? (proteinDiff / input.targetProtein) * 100 
    : 100;

  // Perfect macros (within 5%)
  if (caloriesPercent <= 5 && proteinPercent <= 5) {
    breakdown.macrosHit.earned = 25;
  }
  // Good macros (within 10%)
  else if (caloriesPercent <= 10 && proteinPercent <= 10) {
    breakdown.macrosHit.earned = 20;
  }
  // Acceptable macros (within 15%)
  else if (caloriesPercent <= 15 && proteinPercent <= 15) {
    breakdown.macrosHit.earned = 15;
  }
  // Partial credit (within 25%)
  else if (caloriesPercent <= 25 && proteinPercent <= 25) {
    breakdown.macrosHit.earned = 10;
  }

  // 4. Consistency Bonus (15 points max)
  // Earned when everything else is completed well
  const subtotal = breakdown.mealsLogged.earned + 
                   breakdown.workoutCompleted.earned + 
                   breakdown.macrosHit.earned;
  
  if (subtotal >= 75) {
    breakdown.consistencyBonus.earned = 15;
  } else if (subtotal >= 60) {
    breakdown.consistencyBonus.earned = 10;
  }

  // Calculate total
  breakdown.total = 
    breakdown.mealsLogged.earned +
    breakdown.workoutCompleted.earned +
    breakdown.macrosHit.earned +
    breakdown.consistencyBonus.earned;

  return breakdown;
}

/**
 * Get color for daily score visualization
 */
export function getDailyScoreColor(score: number): string {
  if (score === 100) return '#FFD700'; // Gold for perfect
  if (score >= 75) return '#1C7C54'; // Forest green for great
  if (score >= 50) return '#4DD4AC'; // Mint for good
  if (score >= 25) return '#F5A623'; // Orange for okay
  return '#E53E3E'; // Red for needs work
}

/**
 * Get daily score tier label
 */
export function getDailyScoreTier(score: number): string {
  if (score === 100) return 'Perfect Day!';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Fair';
  return 'Getting Started';
}

/**
 * Get motivational message based on score
 */
export function getDailyScoreMessage(score: number): string {
  if (score === 100) return 'Perfect! You crushed every goal today! 🎉';
  if (score >= 85) return 'Excellent work! Keep this momentum going!';
  if (score >= 70) return 'Great progress! You\'re on track!';
  if (score >= 50) return 'Good effort! A few more tasks to go!';
  if (score >= 25) return 'You\'re getting there! Keep logging!';
  return 'Let\'s start building your daily habits!';
}
