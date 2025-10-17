import { ChevronRight } from 'lucide-react';

interface MealsCardProps {
  onViewTimeline?: () => void;
  onLogMealClick?: () => void;
}

export function MealsCard({ onViewTimeline, onLogMealClick }: MealsCardProps) {
  // Start with empty meals - user will add them
  const meals: any[] = [];

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
        {meals.length === 0 ? (
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
          meals.map((meal, index) => (
            <div 
              key={index} 
              onClick={onViewTimeline}
              className="flex justify-between items-center py-3 border-b last:border-b-0 cursor-pointer hover:opacity-70 -mx-2 px-2 rounded transition-all"
              style={{ borderColor: 'var(--farefit-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="text-xs px-2 py-1 rounded" style={{ 
                  backgroundColor: meal.status === 'WORKOUT' ? 'var(--farefit-secondary)' : 'var(--farefit-bg)',
                  color: 'var(--farefit-text)'
                }}>
                  {meal.status}
                </div>
                <div>
                  <p style={{ color: 'var(--farefit-text)' }}>{meal.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>{meal.time}</p>
                    {meal.macros && (
                      <>
                        <span className="text-sm" style={{ color: 'var(--farefit-subtext)', opacity: 0.5 }}>•</span>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                          <span style={{ color: '#F5A623' }}>P: {meal.macros.protein}g</span>
                          <span style={{ color: '#4DD4AC' }}>C: {meal.macros.carbs}g</span>
                          <span style={{ color: '#6B47DC' }}>F: {meal.macros.fat}g</span>
                          <span style={{ color: 'var(--farefit-primary)' }}>F: {meal.macros.fiber}g</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p style={{ color: meal.calories < 0 ? '#1C7C54' : '#102A43' }}>
                {meal.calories > 0 ? '+' : ''}{meal.calories} kcal
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}