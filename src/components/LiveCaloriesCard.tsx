import React from 'react';
import { useUserMeals } from '../hooks/useUserMeals';

interface LiveCaloriesCardProps {
  onMealLoggingClick: () => void;
  onFoodAssistantClick: () => void;
}

export function LiveCaloriesCard({ onMealLoggingClick, onFoodAssistantClick }: LiveCaloriesCardProps) {
  const { meals, loading, totals } = useUserMeals(); // 👈 Fixed: use correct properties from useUserMeals

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">CALORIES CONSUMED</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Remove error handling since useUserMeals doesn't return error
  // const todaysMeals and recentMeals will use the meals data directly
  const hasAnyMeals = meals.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">CALORIES CONSUMED</h2>
      
      {!hasAnyMeals ? (
        // No meals logged yet
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-gray-600 mb-2">No calories logged yet</p>
          <p className="text-sm text-gray-500 mb-6">Start tracking your nutrition today</p>
          
          <div className="space-y-3">
            <button 
              onClick={onMealLoggingClick}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Log Meal
            </button>
            <button 
              onClick={onFoodAssistantClick}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              Ask Food AI
            </button>
          </div>
        </div>
      ) : (
        // Meals exist - show nutrition summary
        <div>
          {/* Today's Totals */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Nutrition</h3>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              🔥 {totals.calories.toFixed(0)} kcal {/* 👈 Changed totalNutrition to totals */}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>🥩 {totals.protein.toFixed(1)}g protein</div>
              <div>🍞 {totals.carbs.toFixed(1)}g carbs</div>
              <div>🧈 {totals.fat.toFixed(1)}g fat</div> {/* 👈 Changed fats to fat */}
              <div>🌾 {totals.fiber.toFixed(1)}g fiber</div>
            </div>
          </div>

          {/* Recent Meals - use meals data directly */}
          {meals.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Meals</h3>
              <div className="space-y-2">
                {meals.slice(0, 3).map((meal: any, index: number) => (
                  <div key={`${meal.food_name}-${meal.meal_type}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {meal.food_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {meal.meal_type} • {meal.meal_date} {meal.brand && `• ${meal.brand}`}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {meal.calories} kcal
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button 
              onClick={onMealLoggingClick}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              + Log Another Meal
            </button>
            <button 
              onClick={onFoodAssistantClick}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Ask Food AI
            </button>
          </div>

          {/* Meal Count Indicator */}
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500">
              {meals.length} meal{meals.length !== 1 ? 's' : ''} today • {meals.length} total logged {/* 👈 Use meals.length directly */}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}