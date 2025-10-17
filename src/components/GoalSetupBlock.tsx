import { Target, ChevronRight } from 'lucide-react';

interface GoalSetupBlockProps {
  onClick: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
  } | null;
}

export function GoalSetupBlock({ onClick, userGoal }: GoalSetupBlockProps) {
  const getGoalLabel = (type: string) => {
    if (type === 'cut') return 'Leaning Out';
    if (type === 'bulk') return 'Bulking';
    return 'Maintaining';
  };

  return (
    <div 
      className="bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#1C7C5420' }}
        >
          <Target className="w-6 h-6" style={{ color: '#1C7C54' }} />
        </div>
        <ChevronRight 
          className="w-5 h-5 transition-transform group-hover:translate-x-1" 
          style={{ color: '#1C7C54', opacity: 0.5 }} 
        />
      </div>
      
      <h4 className="mb-2" style={{ color: '#102A43' }}>
        {userGoal ? 'Update Fitness Goal' : 'Set Your Fitness Goal'}
      </h4>
      
      {userGoal ? (
        <div className="text-sm space-y-1">
          <p style={{ color: '#1C7C54' }}>
            <strong>{getGoalLabel(userGoal.goalType)}</strong>
          </p>
          <p style={{ color: '#102A43', opacity: 0.7 }}>
            {userGoal.targetCalories.toLocaleString()} kcal/day
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
          Get personalized calorie and macro recommendations
        </p>
      )}
    </div>
  );
}
