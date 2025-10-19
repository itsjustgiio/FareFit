import { Apple, Brain } from 'lucide-react';
import { GoalSetupBlock } from './GoalSetupBlock';
import type { PlanSummary } from '../types/planTypes';

interface BottomCardsProps {
  onGoalSetupClick: () => void;
  onCoachAIClick?: () => void;
  onFoodAssistantClick?: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
  } | null;
  planSummary?: PlanSummary | null;
}

export function BottomCards({ onGoalSetupClick, onCoachAIClick, onFoodAssistantClick, userGoal, planSummary }: BottomCardsProps) {
  const cards = [
    {
      icon: Apple,
      title: 'Food Assistant',
      description: 'Get meal suggestions based on your macro goals',
      color: '#1C7C54',
      onClick: onFoodAssistantClick || (() => {}),
      comingSoon: false
    },
    {
      icon: Brain,
      title: 'Coach AI',
      description: 'Get personalized workout advice and form checks from your AI coach',
      color: '#FFB6B9',
      onClick: onCoachAIClick || (() => {}),
      comingSoon: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={card.onClick}
          className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col hover:-translate-y-1 active:translate-y-0"
        >
          <div className="mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: card.color + '20' }}
            >
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
          </div>
          <h4 className="mb-2" style={{ color: '#102A43' }}>{card.title}</h4>
          <p className="text-sm mb-4 flex-1" style={{ color: '#102A43', opacity: 0.7 }}>
            {card.description}
          </p>
          <button 
            className="text-sm px-4 py-2 rounded-md transition-all hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: '#1C7C54', color: 'white' }}
          >
            Start Chat →
          </button>
        </div>
      ))}
      <GoalSetupBlock onClick={onGoalSetupClick} userGoal={userGoal} planSummary={planSummary} />
    </div>
  );
}