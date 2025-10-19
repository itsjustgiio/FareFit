import { useUserMeals } from "../hooks/useUserMeals";
import type { PlanSummary } from '../types/planTypes';

interface CaloriesCardProps {
  onFoodAIClick?: () => void;
  onLogMealClick?: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } | null;
  planSummary?: PlanSummary | null;
  loggedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export function CaloriesCard({ onFoodAIClick, onLogMealClick, userGoal, planSummary, loggedMacros }: CaloriesCardProps) {
  // Use enhanced real-time data from Firestore
  const { meals, loading, totals } = useUserMeals();

  // Loading state
  if (loading) {
    return (
      <div 
        className="rounded-lg p-6 sm:p-8 transition-colors duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--farefit-primary) 0%, var(--farefit-secondary) 100%)'
        }}
      >
        <h3 className="text-white mb-2">CALORIES CONSUMED</h3>
        <p className="text-center text-white opacity-70">Loading meals...</p>
      </div>
    );
  }

  // Check if there's any logged data
  const hasData = meals.length > 0;
  
  // Use calculated totals from hook
  const displayCalories = totals.calories;
  
  // Prioritize planSummary data over userGoal data, then fallback to defaults
  const targetCalories = planSummary?.targetCalories || userGoal?.targetCalories || 2200;
  const displayProtein = totals.protein;
  const targetProtein = planSummary?.macros.protein || userGoal?.protein || 165;
  const displayCarbs = totals.carbs;
  const targetCarbs = planSummary?.macros.carbs || userGoal?.carbs || 220;
  const displayFat = totals.fat;
  const targetFat = planSummary?.macros.fat || userGoal?.fat || 73;
  const displayFiber = totals.fiber;
  const targetFiber = planSummary?.macros.fiber || userGoal?.fiber || 30;

  return (
    <div 
      className="rounded-lg p-6 sm:p-8 transition-colors duration-300"
      style={{
        background: 'linear-gradient(135deg, var(--farefit-primary) 0%, var(--farefit-secondary) 100%)'
      }}
    >
      <h3 className="text-white mb-2">CALORIES CONSUMED</h3>
      
      {!hasData ? (
        <div className="text-center py-12">
          <div className="mb-4 text-5xl">🍽️</div>
          <p className="text-white text-lg mb-2">
            No calories logged yet
          </p>
          <p className="text-white opacity-70 text-sm mb-6">
            Start tracking your nutrition today
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={onLogMealClick}
              className="px-6 py-3 rounded-md text-white transition-all hover:opacity-90 hover:-translate-y-0.5 bg-white/20 hover:bg-white/30 flex items-center justify-center gap-2"
            >
              Log Meal
            </button>
            <button 
              onClick={onFoodAIClick}
              className="px-6 py-3 rounded-md text-white transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--farefit-accent)' }}
            >
              Ask Food AI
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl sm:text-6xl text-white">{displayCalories.toLocaleString()}</span>
            <span className="text-xl text-white opacity-90 pb-2">/ {targetCalories.toLocaleString()} kcal</span>
          </div>
          
          <p className="text-white opacity-90 mb-6">
            {displayCalories <= targetCalories ? 'On track with your goals' : 'Over target today'}
          </p>
          
          {/* Macros */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-white opacity-90 text-sm">Protein</p>
              <p className="text-white text-xl">{displayProtein}g</p>
              <p className="text-white opacity-70 text-xs">/ {targetProtein}g</p>
            </div>
            <div>
              <p className="text-white opacity-90 text-sm">Carbs</p>
              <p className="text-white text-xl">{displayCarbs}g</p>
              <p className="text-white opacity-70 text-xs">/ {targetCarbs}g</p>
            </div>
            <div>
              <p className="text-white opacity-90 text-sm">Fat</p>
              <p className="text-white text-xl">{displayFat}g</p>
              <p className="text-white opacity-70 text-xs">/ {targetFat}g</p>
            </div>
            <div>
              <p className="text-white opacity-90 text-sm">Fiber</p>
              <p className="text-white text-xl">{displayFiber}g</p>
              <p className="text-white opacity-70 text-xs">/ {targetFiber}g</p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onLogMealClick}
              className="px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--farefit-primary)' }}
            >
              Log Meal
            </button>
            <button 
              onClick={onFoodAIClick}
              className="px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--farefit-accent)' }}
            >
              Ask Food AI
            </button>
          </div>
        </>
      )}
    </div>
  );
}