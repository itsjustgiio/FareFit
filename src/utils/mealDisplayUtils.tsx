/**
 * Meal Display Utilities
 * Reusable patterns for displaying meals in different views
 */

import React from 'react';

// Type for meal data from Firestore
export interface MealData {
  food_name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  serving_size: number;
  meal_type: string;
}

/**
 * Detailed meal breakdown component for Progress page
 * Shows individual food items with full nutrition info
 */
export const DetailedMealBreakdown: React.FC<{
  meals: MealData[];
  mealType: string;
  onMealClick?: (meal: MealData) => void;
}> = ({ meals, mealType, onMealClick }) => {
  if (meals.length === 0) return null;

  const typeCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="mb-4">
      {/* Meal Type Header */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium uppercase" style={{ color: 'var(--farefit-text)' }}>
          {mealType === 'breakfast' ? '🍳 Breakfast' : 
           mealType === 'lunch' ? '🥗 Lunch' :
           mealType === 'dinner' ? '🍽️ Dinner' : '🍿 Snack'}
        </h4>
        <span className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
          {meals.length} item{meals.length !== 1 ? 's' : ''} • {typeCalories} kcal
        </span>
      </div>
      
      {/* Individual Meals */}
      {meals.map((meal, index) => (
        <div 
          key={`${mealType}-${index}`}
          onClick={() => onMealClick?.(meal)}
          className="flex justify-between items-center py-2 px-3 mb-1 cursor-pointer hover:opacity-70 rounded transition-all"
          style={{ backgroundColor: 'var(--farefit-bg)', opacity: 0.7 }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--farefit-text)' }}>
              {meal.food_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {meal.brand && (
                <>
                  <span className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {meal.brand}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.5 }}>•</span>
                </>
              )}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                <span style={{ color: '#F5A623' }}>P: {meal.protein}g</span>
                <span style={{ color: '#4DD4AC' }}>C: {meal.carbs}g</span>
                <span style={{ color: '#6B47DC' }}>F: {meal.fats}g</span>
                <span style={{ color: 'var(--farefit-primary)' }}>Fb: {meal.fiber}g</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: 'var(--farefit-text)' }}>
              {meal.calories} kcal
            </p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
              {meal.serving_size} serving{meal.serving_size !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Simplified meal type summary for dashboard
 * Shows just meal type totals (Breakfast: 165 kcal)
 */
export const SimplifiedMealSummary: React.FC<{
  meals: MealData[];
  mealType: string;
  onClick?: () => void;
}> = ({ meals, mealType, onClick }) => {
  if (meals.length === 0) return null;
  
  const typeCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const typeProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const typeCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const typeFats = meals.reduce((sum, meal) => sum + meal.fats, 0);
  const typeFiber = meals.reduce((sum, meal) => sum + meal.fiber, 0);
  
  return (
    <div 
      onClick={onClick}
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
            {meals.length} item{meals.length !== 1 ? 's' : ''}
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
      </div>
    </div>
  );
};

/**
 * Calculate meal type totals for any meal array
 */
export const calculateMealTypeTotals = (meals: MealData[]) => {
  return meals.reduce((totals, meal) => {
    const type = meal.meal_type;
    if (!totals[type]) {
      totals[type] = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, count: 0 };
    }
    
    totals[type].calories += meal.calories;
    totals[type].protein += meal.protein;
    totals[type].carbs += meal.carbs;
    totals[type].fats += meal.fats;
    totals[type].fiber += meal.fiber;
    totals[type].count += 1;
    
    return totals;
  }, {} as Record<string, { calories: number; protein: number; carbs: number; fats: number; fiber: number; count: number }>);
};