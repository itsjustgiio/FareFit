import { ChevronRight } from 'lucide-react';
import { useUserMeals } from '../hooks/useUserMeals';

/**
 * MealsCard - Simplified meal summary view
 * 
 * Shows condensed meal type summaries (Breakfast: 165 kcal) instead of individual foods
 * For detailed breakdown pattern, see the commit history or use this structure:
 * 
 * DETAILED BREAKDOWN PATTERN (for Progress page):
 * mealsInType.map((meal, index) => (
 *   <div key={`${mealType}-${index}`}>
 *     <p>{meal.food_name}</p>
 *     {meal.brand && <span>{meal.brand}</span>}
 *     <div>P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g | Fb: {meal.fiber}g</div>
 *     <div>{meal.calories} kcal • {meal.serving_size} serving(s)</div>
 *   </div>
 * ))
 */

interface MealsCardProps {
  onViewTimeline?: () => void;
  onLogMealClick?: () => void;
}

export function MealsCard({ onViewTimeline, onLogMealClick }: MealsCardProps) {
  // Use real-time data from Firestore (same hook as CaloriesCard)
  const { meals, loading, getMealsByType, getMealTypeOrder } = useUserMeals();

  return (
    <div className="rounded-lg p-6 sm:p-8 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ color: 'var(--farefit-text)' }}>Meals Today</h3>
        <button 
          onClick={onViewTimeline}
          className="text-sm hover:underline flex items-center gap-1 transition-all hover:-translate-y-0.5" 
          style={{ color: 'var(--farefit-primary)' }}
        >
          View More
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
              Loading meals...
            </p>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-4xl">🍽️</div>
            <p className="mb-2" style={{ color: 'var(--farefit-subtext)' }}>
              No meals logged yet
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>
              Start your day by logging your first meal
            </p>
            <button
              onClick={onLogMealClick}
              className="px-6 py-3 rounded-lg text-white transition-all hover:opacity-90 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--farefit-primary)' }}
            >
              Log Your First Meal
            </button>
          </div>
        ) : (
          // Simplified view - just show meal type summaries
          getMealTypeOrder().map((mealType) => {
            const mealsInType = getMealsByType()[mealType] || [];
            if (mealsInType.length === 0) return null;
            
            const typeCalories = mealsInType.reduce((sum, meal) => sum + meal.calories, 0);
            const typeProtein = mealsInType.reduce((sum, meal) => sum + meal.protein, 0);
            const typeCarbs = mealsInType.reduce((sum, meal) => sum + meal.carbs, 0);
            const typeFats = mealsInType.reduce((sum, meal) => sum + meal.fats, 0);
            const typeFiber = mealsInType.reduce((sum, meal) => sum + meal.fiber, 0);
            
            return (
              <div 
                key={mealType}
                onClick={onViewTimeline}
                className="flex justify-between items-center py-4 px-4 mb-3 cursor-pointer hover:opacity-80 rounded-lg transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--farefit-bg)', opacity: 0.8 }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {mealType === 'breakfast' ? '🍳' : 
                       mealType === 'lunch' ? '🥗' :
                       mealType === 'dinner' ? '🍽️' : '🍿'}
                    </span>
                    <h4 className="text-base font-medium capitalize" style={{ color: 'var(--farefit-text)' }}>
                      {mealType}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
                      {mealsInType.length} item{mealsInType.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--farefit-subtext)', opacity: 0.5 }}>•</span>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                      <span style={{ color: '#F5A623' }}>P: {Math.round(typeProtein)}g</span>
                      <span style={{ color: '#4DD4AC' }}>C: {Math.round(typeCarbs)}g</span>
                      <span style={{ color: '#6B47DC' }}>F: {Math.round(typeFats)}g</span>
                      <span style={{ color: 'var(--farefit-primary)' }}>Fb: {Math.round(typeFiber)}g</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold" style={{ color: 'var(--farefit-text)' }}>
                    {typeCalories} kcal
                  </p>
                  <ChevronRight className="w-4 h-4 mt-1 mx-auto" style={{ color: 'var(--farefit-primary)' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}