/**
 * FareScore Calculator
 * 
 * A credit-score-inspired health consistency rating system
 * Range: 300-850 (same as FICO scores)
 * Updates: Daily with weekly smoothing
 */

export interface FareScoreAction {
  type: 'meal_logged' | 'workout_completed' | 'macro_target_hit' | 'streak_milestone' | 
        'weight_stable' | 'sleep_logged' | 'hydration_logged' | 'missed_day' | 
        'streak_broken' | 'inactive_week' | 'data_manipulation' | 'macro_deviation';
  value?: number; // For dynamic scoring
}

export interface FareScoreState {
  currentScore: number;
  streakDays: number;
  mealsLoggedThisMonth: number;
  workoutsThisMonth: number;
  penaltiesThisMonth: number;
  lastUpdateDate: string;
  consistencyRate: number; // 0.0 to 1.0 (average adherence past 30 days)
}

/**
 * Score change values for each action type
 */
const SCORE_CHANGES = {
  // Positive actions
  meal_logged: 1,
  workout_completed: 2,
  macro_target_hit: 3,
  streak_milestone: 5, // Every 7 days
  weight_stable: 2,
  sleep_logged: 1,
  hydration_logged: 1,
  
  // Negative actions (penalties)
  missed_day: -2,
  streak_broken: -5,
  inactive_week: -10,
  data_manipulation: -15,
  macro_deviation: -3,
};

/**
 * Tier definitions
 */
export const FARESCORE_TIERS = {
  STARTING_JOURNEY: { min: 300, max: 399, label: 'Starting Journey', description: 'Beginning your fitness journey - Every log counts!' },
  BUILDING_HABITS: { min: 400, max: 549, label: 'Building Habits', description: 'Developing consistency - Keep going!' },
  CONSISTENT_TRACKER: { min: 550, max: 699, label: 'Consistent Tracker', description: 'Staying on track most days - Great progress!' },
  GOAL_CRUSHER: { min: 700, max: 799, label: 'Goal Crusher', description: 'Crushing your goals with dedication!' },
  FAREFIT_ELITE: { min: 800, max: 850, label: 'FareFit Elite', description: 'Elite consistency - You\'re an inspiration!' },
};

/**
 * Get tier information for a given score
 */
export function getTier(score: number): { label: string; description: string } {
  if (score >= FARESCORE_TIERS.FAREFIT_ELITE.min) return { label: FARESCORE_TIERS.FAREFIT_ELITE.label, description: FARESCORE_TIERS.FAREFIT_ELITE.description };
  if (score >= FARESCORE_TIERS.GOAL_CRUSHER.min) return { label: FARESCORE_TIERS.GOAL_CRUSHER.label, description: FARESCORE_TIERS.GOAL_CRUSHER.description };
  if (score >= FARESCORE_TIERS.CONSISTENT_TRACKER.min) return { label: FARESCORE_TIERS.CONSISTENT_TRACKER.label, description: FARESCORE_TIERS.CONSISTENT_TRACKER.description };
  if (score >= FARESCORE_TIERS.BUILDING_HABITS.min) return { label: FARESCORE_TIERS.BUILDING_HABITS.label, description: FARESCORE_TIERS.BUILDING_HABITS.description };
  return { label: FARESCORE_TIERS.STARTING_JOURNEY.label, description: FARESCORE_TIERS.STARTING_JOURNEY.description };
}

/**
 * Clamp score within valid range
 */
function clampScore(score: number): number {
  return Math.max(300, Math.min(850, score));
}

/**
 * Calculate score change for an action
 */
export function calculateScoreChange(action: FareScoreAction, state: FareScoreState): number {
  let change = SCORE_CHANGES[action.type] || 0;
  
  // Apply dynamic value if provided
  if (action.value !== undefined) {
    change = action.value;
  }
  
  // Apply streak milestone bonus
  if (action.type === 'streak_milestone' && state.streakDays > 0 && state.streakDays % 7 === 0) {
    change = 5;
  }
  
  return change;
}

/**
 * Update FareScore based on daily actions
 */
export function updateDailyScore(
  state: FareScoreState,
  actions: FareScoreAction[]
): FareScoreState {
  let newScore = state.currentScore;
  
  // Apply all actions
  actions.forEach(action => {
    const change = calculateScoreChange(action, state);
    newScore += change;
  });
  
  // Clamp to valid range
  newScore = clampScore(newScore);
  
  // Update state
  const updatedState: FareScoreState = {
    ...state,
    currentScore: newScore,
    lastUpdateDate: new Date().toISOString(),
  };
  
  // Update counters based on actions
  actions.forEach(action => {
    if (action.type === 'meal_logged') {
      updatedState.mealsLoggedThisMonth++;
    } else if (action.type === 'workout_completed') {
      updatedState.workoutsThisMonth++;
    } else if (action.type.includes('missed') || action.type.includes('broken') || action.type.includes('inactive')) {
      updatedState.penaltiesThisMonth++;
    }
  });
  
  return updatedState;
}

/**
 * Apply weekly smoothing to prevent dramatic swings
 * Similar to credit score updates
 */
export function applyWeeklySmoothing(oldScore: number, newScore: number): number {
  // 90% old, 10% new - gradual change
  const smoothedScore = Math.round(0.9 * oldScore + 0.1 * newScore);
  return clampScore(smoothedScore);
}

/**
 * Calculate consistency rate based on recent activity
 */
export function calculateConsistencyRate(
  daysActive: number,
  totalDays: number = 30
): number {
  return Math.min(1.0, daysActive / totalDays);
}

/**
 * Initialize a new user's FareScore state
 */
export function initializeFareScore(joinDate: string = new Date().toISOString()): FareScoreState {
  return {
    currentScore: 350, // Starting score
    streakDays: 0,
    mealsLoggedThisMonth: 0,
    workoutsThisMonth: 0,
    penaltiesThisMonth: 0,
    lastUpdateDate: joinDate,
    consistencyRate: 0.0,
  };
}

/**
 * Example: Daily score calculation
 */
export function processDailyUpdate(
  state: FareScoreState,
  mealsLogged: number,
  workoutCompleted: boolean,
  hitMacroTarget: boolean,
  missedDay: boolean
): FareScoreState {
  const actions: FareScoreAction[] = [];
  
  // Add positive actions
  if (mealsLogged >= 2) {
    actions.push({ type: 'meal_logged' });
  }
  
  if (workoutCompleted) {
    actions.push({ type: 'workout_completed' });
  }
  
  if (hitMacroTarget) {
    actions.push({ type: 'macro_target_hit' });
  }
  
  // Check for streak milestone
  if (state.streakDays > 0 && state.streakDays % 7 === 0) {
    actions.push({ type: 'streak_milestone' });
  }
  
  // Add penalties
  if (missedDay) {
    actions.push({ type: 'missed_day' });
  }
  
  return updateDailyScore(state, actions);
}

/**
 * Get color for score visualization
 */
export function getScoreColor(score: number): string {
  if (score >= 800) return '#4DD4AC'; // FareFit Elite - bright mint
  if (score >= 700) return '#1C7C54'; // Goal Crusher - forest green
  if (score >= 550) return '#A8E6CF'; // Consistent Tracker - mint
  if (score >= 400) return '#F5A623'; // Building Habits - orange
  return '#E53E3E'; // Starting Journey - red
}

/**
 * Generate score history for demo/testing
 */
export function generateScoreHistory(
  startScore: number,
  weeks: number,
  avgWeeklyChange: number = 10
): Array<{ date: string; score: number }> {
  const history: Array<{ date: string; score: number }> = [];
  let currentScore = startScore;
  const today = new Date();
  
  for (let i = weeks; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7));
    
    // Add some randomness to make it realistic
    const change = avgWeeklyChange + (Math.random() - 0.5) * 5;
    currentScore = clampScore(currentScore + change);
    
    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(currentScore),
    });
  }
  
  return history;
}

/**
 * Calculate expected time to reach target score
 */
export function estimateTimeToTarget(
  currentScore: number,
  targetScore: number,
  avgDailyChange: number = 0.5 // Conservative estimate
): { days: number; weeks: number; realistic: boolean } {
  const difference = targetScore - currentScore;
  
  if (difference <= 0) {
    return { days: 0, weeks: 0, realistic: true };
  }
  
  const days = Math.ceil(difference / avgDailyChange);
  const weeks = Math.ceil(days / 7);
  
  // Is this realistic? (more than 2 years is unlikely)
  const realistic = days <= 730;
  
  return { days, weeks, realistic };
}
