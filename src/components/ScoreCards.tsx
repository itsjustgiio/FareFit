import { TrendingUp, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { getTier, getScoreColor } from '../utils/fareScoreCalculator';
import { DailyScoreBreakdown } from '../utils/dailyScoreCalculator';

interface ScoreCardsProps {
  fareScore: number;
  fareScoreChange: number; // Weekly change
  dailyScore: number; // 0-100
  dailyBreakdown?: DailyScoreBreakdown;
  onFareScoreClick?: () => void;
  isDemoMode?: boolean;
}

export function ScoreCards({ 
  fareScore, 
  fareScoreChange, 
  dailyScore, 
  dailyBreakdown,
  onFareScoreClick,
  isDemoMode = false 
}: ScoreCardsProps) {
  const tier = getTier(fareScore);
  const tierColor = getScoreColor(fareScore);
  
  // Calculate daily score percentage for progress ring
  const dailyScorePercentage = dailyScore;
  const circumference = 2 * Math.PI * 32;
  const dailyStrokeDashoffset = circumference - (dailyScorePercentage / 100) * circumference;

  // Calculate FareScore percentage (300-850 range)
  const fareScorePercentage = ((fareScore - 300) / (850 - 300)) * 100;
  const fareStrokeDashoffset = circumference - (fareScorePercentage / 100) * circumference;

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
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="32"
                stroke="var(--accent-light)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="32"
                stroke={tierColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={fareStrokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl" style={{ color: tierColor }}>
                  {fareScore}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <Badge
              style={{
                backgroundColor: tierColor,
                color: 'white',
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              {tier.label}
            </Badge>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
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
          {dailyScore === 100 && (
            <Badge
              style={{
                backgroundColor: '#FFD700',
                color: '#102A43',
                fontSize: '11px',
              }}
            >
              Perfect!
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="32"
                stroke="var(--accent-light)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="32"
                stroke={dailyScore === 100 ? '#FFD700' : dailyScore >= 75 ? '#1C7C54' : dailyScore >= 50 ? '#4DD4AC' : '#F5A623'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dailyStrokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl" style={{ color: dailyScore === 100 ? '#FFD700' : dailyScore >= 75 ? '#1C7C54' : dailyScore >= 50 ? '#4DD4AC' : '#F5A623' }}>
                  {dailyScore}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  / 100
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {dailyBreakdown ? (
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
                <>
                  <DailyScoreItem label="Meals logged" points={30} earned={dailyScore >= 20} />
                  <DailyScoreItem label="Workout done" points={30} earned={dailyScore >= 50} />
                  <DailyScoreItem label="Macros hit" points={25} earned={dailyScore >= 75} />
                  <DailyScoreItem label="Bonus" points={15} earned={dailyScore === 100} />
                </>
              )}
            </div>
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
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: isComplete ? '#1C7C54' : isPartial ? '#4DD4AC' : 'var(--accent-light)',
          }}
        />
        <span
          className="text-xs"
          style={{
            color: 'var(--text-primary)',
            opacity: earnedPoints > 0 ? 0.8 : 0.5,
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-xs"
        style={{
          color: isComplete ? '#1C7C54' : isPartial ? '#4DD4AC' : 'var(--text-primary)',
          opacity: earnedPoints > 0 ? 1 : 0.4,
        }}
      >
        {earnedPoints}/{points}
      </span>
    </div>
  );
}