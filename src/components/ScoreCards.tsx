import { TrendingUp, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { getTier, getScoreColor } from '../utils/fareScoreCalculator';
import { DailyScoreBreakdown } from '../utils/dailyScoreCalculator';
import { useState, useEffect } from 'react';
import { calculateDailyScore } from '../utils/dailyScoreCalculator';

interface ScoreCardsProps {
  fareScore: number;
  fareScoreChange: number; // Weekly change
  dailyScore: number; // 0-100
  onFareScoreClick?: () => void;
  isDemoMode?: boolean;
  userId: string; // Add userId prop
}

export function ScoreCards({ 
  fareScore, 
  fareScoreChange, 
  dailyScore,
  onFareScoreClick,
  isDemoMode = false,
  userId 
}: ScoreCardsProps) {
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedDailyScore, setAnimatedDailyScore] = useState(0);

  // In ScoreCards.tsx, update the useEffect:
useEffect(() => {
  const loadDailyScore = async () => {
    if (isDemoMode || !userId) { // Add !userId check
      setLoading(false);
      return;
    }
    
    try {
      const scoreData = await calculateDailyScore(userId);
      setDailyBreakdown(scoreData.breakdown);
      
      // Animate the daily score progress
      animateValue(0, scoreData.totalScore, 1000, setAnimatedDailyScore);
    } catch (error) {
      console.error('Error loading daily score:', error);
      setAnimatedDailyScore(dailyScore);
    } finally {
      setLoading(false);
    }
  };

  loadDailyScore();
}, [userId, isDemoMode, dailyScore]);

  // Animation function for smooth number transition
  const animateValue = (start: number, end: number, duration: number, setValue: (value: number) => void) => {
    const startTime = performance.now();
    
    const updateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(start + (end - start) * easeOutQuart);
      
      setValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };
    
    requestAnimationFrame(updateValue);
  };

  const tier = getTier(fareScore);
  const tierColor = getScoreColor(fareScore);
  
  // Calculate daily score percentage for progress ring
  const dailyScorePercentage = animatedDailyScore;
  const circumference = 2 * Math.PI * 36; // Increased radius for better visibility
  const dailyStrokeDashoffset = circumference - (dailyScorePercentage / 100) * circumference;

  // Calculate FareScore percentage (300-850 range)
  const fareScorePercentage = ((fareScore - 300) / (850 - 300)) * 100;
  const fareStrokeDashoffset = circumference - (fareScorePercentage / 100) * circumference;

  // Get color for daily score based on value
  const getDailyScoreColor = (score: number) => {
    if (score === 100) return '#FFD700';
    if (score >= 75) return '#1C7C54';
    if (score >= 50) return '#4DD4AC';
    if (score >= 25) return '#F5A623';
    return '#E53E3E';
  };

  const dailyScoreColor = getDailyScoreColor(animatedDailyScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* FareScore Card */}
      <motion.button
        onClick={onFareScoreClick}
        className="relative overflow-hidden rounded-xl p-6 text-left transition-all hover:shadow-lg active:scale-[0.98]"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '2px solid var(--border-color)',
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                FareScore
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Your consistency rating
            </p>
          </div>
          
          {/* Change Indicator */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded"
            style={{
              backgroundColor: fareScoreChange >= 0 ? 'var(--accent-light)' : '#FFE8E8',
            }}
          >
            {fareScoreChange >= 0 ? (
              <ArrowUp size={14} style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <ArrowDown size={14} style={{ color: '#E53E3E' }} />
            )}
            <span
              className="text-xs"
              style={{
                color: fareScoreChange >= 0 ? 'var(--accent-primary)' : '#E53E3E',
              }}
            >
              {Math.abs(fareScoreChange)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="36"
                stroke="var(--accent-light)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="36"
                stroke={tierColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={fareStrokeDashoffset}
                strokeLinecap="round"
                style={{ 
                  transition: 'stroke-dashoffset 1.5s ease-in-out',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-semibold" style={{ color: tierColor }}>
                {fareScore}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {tier.label}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              Range: 300-850
            </p>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
              {fareScoreChange >= 0 ? '+' : ''}{fareScoreChange} this week
            </p>
            <p className="text-xs" style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
              Tap for details →
            </p>
          </div>
        </div>
      </motion.button>

      {/* Daily Score Card */}
      <div
        className="relative overflow-hidden rounded-xl p-6"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '2px solid var(--border-color)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} style={{ color: '#F5A623' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Today's Score
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Daily points progress
            </p>
          </div>
          
          {/* Perfect Day Badge */}
          {animatedDailyScore === 100 && (
            <Badge
              style={{
                backgroundColor: '#FFD700',
                color: '#102A43',
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              Perfect Day!
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="36"
                stroke="var(--accent-light)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="36"
                stroke={dailyScoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dailyStrokeDashoffset}
                strokeLinecap="round"
                style={{ 
                  transition: 'stroke-dashoffset 1.5s ease-in-out',
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div 
                className="text-2xl font-semibold transition-colors duration-500"
                style={{ color: dailyScoreColor }}
              >
                {animatedDailyScore}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                / 100 
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {loading ? (
                // Loading state
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Loading today's progress...
                </div>
              ) : dailyBreakdown ? (
                <>
                  <DailyScoreItem 
                    label="Meals logged" 
                    points={dailyBreakdown.mealsLogged.max} 
                    earned={dailyBreakdown.mealsLogged.earned}
                  />
                  <DailyScoreItem 
                    label="Workout done" 
                    points={dailyBreakdown.workoutCompleted.max} 
                    earned={dailyBreakdown.workoutCompleted.earned}
                  />
                  <DailyScoreItem 
                    label="Macros hit" 
                    points={dailyBreakdown.macrosHit.max} 
                    earned={dailyBreakdown.macrosHit.earned}
                  />
                  <DailyScoreItem 
                    label="Bonus" 
                    points={dailyBreakdown.consistencyBonus.max} 
                    earned={dailyBreakdown.consistencyBonus.earned}
                  />
                </>
              ) : (
                // Fallback to demo data
                <>
                  <DailyScoreItem label="Meals logged" points={30} earned={dailyScore >= 20} />
                  <DailyScoreItem label="Workout done" points={30} earned={dailyScore >= 50} />
                  <DailyScoreItem label="Macros hit" points={25} earned={dailyScore >= 75} />
                  <DailyScoreItem label="Bonus" points={15} earned={dailyScore === 100} />
                </>
              )}
            </div>
            
            {/* Progress summary */}
            {!loading && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Today's Progress</span>
                  <span style={{ color: dailyScoreColor, fontWeight: '600' }}>
                    {animatedDailyScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div 
                    className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${animatedDailyScore}%`,
                      backgroundColor: dailyScoreColor
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyScoreItem({ 
  label, 
  points, 
  earned 
}: { 
  label: string; 
  points: number; 
  earned: number | boolean;
}) {
  const earnedPoints = typeof earned === 'number' ? earned : (earned ? points : 0);
  const isComplete = earnedPoints === points;
  const isPartial = earnedPoints > 0 && earnedPoints < points;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: isComplete ? '#1C7C54' : isPartial ? '#4DD4AC' : 'var(--accent-light)',
            transform: isComplete ? 'scale(1.1)' : 'scale(1)',
            boxShadow: isComplete ? '0 0 4px rgba(28, 124, 84, 0.4)' : 'none'
          }}
        />
        <span
          className="text-xs transition-all duration-300"
          style={{
            color: 'var(--text-primary)',
            opacity: earnedPoints > 0 ? 0.9 : 0.5,
            fontWeight: isComplete ? '600' : '400'
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-xs transition-all duration-300"
        style={{
          color: isComplete ? '#1C7C54' : isPartial ? '#4DD4AC' : 'var(--text-primary)',
          opacity: earnedPoints > 0 ? 1 : 0.4,
          fontWeight: isComplete ? '600' : '400'
        }}
      >
        {earnedPoints}/{points}
      </span>
    </div>
  );
}