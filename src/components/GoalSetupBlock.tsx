import { Target, ChevronRight } from 'lucide-react';
import type { PlanSummary } from '../types/planTypes';

interface GoalSetupBlockProps {
  onClick: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
  } | null;
  planSummary?: PlanSummary | null;
}

export function GoalSetupBlock({ onClick, userGoal, planSummary }: GoalSetupBlockProps) {
  const getGoalLabel = (type: string) => {
    if (type === 'cut') return 'Cutting';
    if (type === 'bulk') return 'Bulking';
    return 'Maintaining';
  };

  // Determine if we have any goal data - prioritize planSummary over userGoal
  const hasGoal = planSummary || userGoal;
  const activeGoalType = planSummary?.goalType || userGoal?.goalType;
  const activeCalories = planSummary?.targetCalories || userGoal?.targetCalories;

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
      
      {hasGoal ? (
        <>
          <h4 className="mb-1" style={{ color: '#102A43' }}>
            Current Goal
          </h4>
          <div className="mb-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2"
                 style={{ backgroundColor: '#1C7C5415', color: '#1C7C54' }}>
              {getGoalLabel(activeGoalType || 'maintain')}
            </div>
          </div>
          <div className="text-sm space-y-1">
            <p style={{ color: '#102A43', opacity: 0.7 }}>
              Target: {activeCalories?.toLocaleString()} kcal/day
            </p>
          </div>
        </>
      ) : (
        <>
          <h4 className="mb-2" style={{ color: '#102A43' }}>
            Set Your Fitness Goal
          </h4>
        </>
      )}
      
      {!hasGoal && (
        <p className="text-sm mb-3" style={{ color: '#102A43', opacity: 0.7 }}>
          Set your goal to start tracking calories and get personalized recommendations.
        </p>
      )}
    </div>
  );
}
