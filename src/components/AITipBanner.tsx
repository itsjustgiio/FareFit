import { Sparkles, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { generateAITip } from '../utils/aiTipGenerator';

interface AITipBannerProps {
  onCoachAIClick?: () => void;
  userName?: string;
  hasLoggedMeals?: boolean;
  hasLoggedWorkout?: boolean;
  goalType?: 'cut' | 'maintain' | 'bulk';
  macroProgress?: {
    calories: number;
    targetCalories: number;
    protein: number;
    targetProtein: number;
    carbs: number;
    targetCarbs: number;
    fat: number;
    targetFat: number;
  };
}

export function AITipBanner({ 
  onCoachAIClick, 
  userName,
  hasLoggedMeals = false,
  hasLoggedWorkout = false,
  goalType,
  macroProgress
}: AITipBannerProps) {
  // Generate personalized tip based on context
  const tip = useMemo(() => {
    return generateAITip({
      userName,
      hasLoggedMeals,
      hasLoggedWorkout,
      goalType,
      macroProgress
    });
  }, [userName, hasLoggedMeals, hasLoggedWorkout, goalType, macroProgress]);

  // Color scheme based on tip type
  const getGradientColors = () => {
    switch (tip.type) {
      case 'achievement':
        return ['#FFB6B9', '#FF8FA3']; // Coral/Pink for achievements
      case 'reminder':
        return ['#1C7C54', '#16a34a']; // Green for reminders
      case 'suggestion':
        return ['#A8E6CF', '#1C7C54']; // Mint to green for suggestions
      case 'motivational':
        return ['#22c55e', '#16a34a']; // Bright green for motivation
      default:
        return ['#1C7C54', '#16a34a'];
    }
  };

  const [color1, color2] = getGradientColors();

  return (
    <motion.div 
      className="px-4 sm:px-6 lg:px-8 py-4 shadow-[0_0_15px_rgba(0,0,0,0.05)]"
      animate={{ 
        background: [
          `linear-gradient(90deg, ${color1}, ${color2})`,
          `linear-gradient(90deg, ${color2}, ${color1})`
        ]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 5,
        ease: 'easeInOut'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <span className="text-2xl flex-shrink-0">{tip.emoji}</span>
          </motion.div>
          <p className="text-white text-sm sm:text-base">
            {tip.message}
          </p>
        </div>
        {onCoachAIClick && (
          <button
            onClick={onCoachAIClick}
            className="text-sm text-white/90 hover:text-white underline decoration-white/50 hover:decoration-white transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Coach AI</span>
            <span className="sm:hidden">Ask AI</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
