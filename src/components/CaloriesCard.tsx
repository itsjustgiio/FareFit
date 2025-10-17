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
  loggedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export function CaloriesCard({ onFoodAIClick, onLogMealClick, userGoal, loggedMacros }: CaloriesCardProps) {
  // Check if there's any logged data
  const hasData = loggedMacros && loggedMacros.calories > 0;
  
  // Use real data if available, otherwise show zeros
  const displayCalories = loggedMacros?.calories || 0;
  const targetCalories = userGoal?.targetCalories || 2200;
  const displayProtein = loggedMacros?.protein || 0;
  const targetProtein = userGoal?.protein || 165;
  const displayCarbs = loggedMacros?.carbs || 0;
  const targetCarbs = userGoal?.carbs || 220;
  const displayFat = loggedMacros?.fat || 0;
  const targetFat = userGoal?.fat || 73;
  const displayFiber = loggedMacros?.fiber || 0;
  const targetFiber = userGoal?.fiber || 30;

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