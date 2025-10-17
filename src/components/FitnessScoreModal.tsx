import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { TrendingUp, Award, Flame, Target, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface FitnessScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FitnessScoreModal({ isOpen, onClose }: FitnessScoreModalProps) {
  // Mock data for last 7 days - will come from backend
  const scoreHistory = [
    { day: 'Mon', score: 75, date: 'Oct 11' },
    { day: 'Tue', score: 78, date: 'Oct 12' },
    { day: 'Wed', score: 80, date: 'Oct 13' },
    { day: 'Thu', score: 77, date: 'Oct 14' },
    { day: 'Fri', score: 83, date: 'Oct 15' },
    { day: 'Sat', score: 85, date: 'Oct 16' },
    { day: 'Today', score: 82, date: 'Oct 17' }
  ];

  const currentScore = 82;
  const weekAverage = Math.round(scoreHistory.reduce((sum, day) => sum + day.score, 0) / scoreHistory.length);
  const weekChange = currentScore - scoreHistory[0].score;

  // Score components with points
  const scoreComponents = [
    {
      category: 'Calorie Balance',
      icon: Target,
      points: 30,
      maxPoints: 35,
      status: 'good',
      details: [
        { text: 'Within target range', earned: true, points: 20 },
        { text: 'Consistent daily tracking', earned: true, points: 10 },
        { text: 'No extreme fluctuations', earned: false, points: 5 }
      ],
      color: '#1C7C54'
    },
    {
      category: 'Macro Adherence',
      icon: Award,
      points: 25,
      maxPoints: 30,
      status: 'good',
      details: [
        { text: 'Hit protein goal (95g/165g)', earned: true, points: 15 },
        { text: 'Carbs within range', earned: true, points: 10 },
        { text: 'Fat target met', earned: false, points: 5 }
      ],
      color: '#4A90E2'
    },
    {
      category: 'Workout Consistency',
      icon: Flame,
      points: 20,
      maxPoints: 25,
      status: 'excellent',
      details: [
        { text: 'Worked out today (Push Day)', earned: true, points: 15 },
        { text: '4 workouts this week', earned: true, points: 5 },
        { text: 'Rest days optimized', earned: false, points: 5 }
      ],
      color: '#FFB6B9'
    },
    {
      category: 'Streak & Habits',
      icon: TrendingUp,
      points: 7,
      maxPoints: 10,
      status: 'fair',
      details: [
        { text: '7-day logging streak', earned: true, points: 5 },
        { text: 'Logged before 10 PM', earned: true, points: 2 },
        { text: 'All meals logged', earned: false, points: 3 }
      ],
      color: '#A8E6CF'
    }
  ];

  const totalPoints = scoreComponents.reduce((sum, comp) => sum + comp.points, 0);
  const maxTotalPoints = scoreComponents.reduce((sum, comp) => sum + comp.maxPoints, 0);

  // AI tips to improve score
  const improvementTips = [
    {
      icon: Plus,
      tip: "Log one more snack to complete your meal tracking",
      impact: "+3 points",
      color: '#1C7C54'
    },
    {
      icon: Plus,
      tip: "Hit your fat macro target (48g / 73g remaining)",
      impact: "+5 points",
      color: '#FFB6B9'
    },
    {
      icon: Plus,
      tip: "Add cardio or active recovery tomorrow",
      impact: "+5 points",
      color: '#4A90E2'
    }
  ];

  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: '#1C7C54', emoji: '🔥' };
    if (score >= 80) return { label: 'Excellent', color: '#1C7C54', emoji: '💪' };
    if (score >= 70) return { label: 'Good', color: '#4A90E2', emoji: '👍' };
    if (score >= 60) return { label: 'Fair', color: '#F4A460', emoji: '⚡' };
    return { label: 'Needs Work', color: '#FFB6B9', emoji: '💭' };
  };

  const rating = getScoreRating(currentScore);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#102A43' }}>Your Fitness Score Breakdown</DialogTitle>
          <DialogDescription style={{ color: '#102A43', opacity: 0.6 }}>
            Understanding how your daily actions contribute to your overall fitness
          </DialogDescription>
        </DialogHeader>

        {/* Current Score Display */}
        <div className="text-center p-6 rounded-lg" style={{ background: 'linear-gradient(135deg, #1C7C54 0%, #A8E6CF 100%)' }}>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(currentScore / 100) * 251} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl text-white">{currentScore}</span>
                <span className="text-xs text-white opacity-90">/ 100</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-3xl text-white mb-1">{rating.emoji} {rating.label}</p>
              <p className="text-white opacity-90">
                {totalPoints} / {maxTotalPoints} points earned today
              </p>
            </div>
          </div>
          <p className="text-white text-sm opacity-95">
            You're {weekChange >= 0 ? 'up' : 'down'} <strong>{Math.abs(weekChange)} points</strong> from Monday. 
            Week average: <strong>{weekAverage}</strong>
          </p>
        </div>

        {/* Score Trend Chart */}
        <div className="bg-white rounded-lg p-6 border-2" style={{ borderColor: '#E8F4F2' }}>
          <h4 className="mb-4" style={{ color: '#102A43' }}>7-Day Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F2" />
              <XAxis 
                dataKey="day" 
                stroke="#102A43" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#102A43" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #A8E6CF',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${value} pts`, 'Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1C7C54"
                strokeWidth={3}
                dot={{ fill: '#1C7C54', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score Components Breakdown */}
        <div>
          <h4 className="mb-4" style={{ color: '#102A43' }}>How It's Calculated</h4>
          <div className="space-y-4">
            {scoreComponents.map((component, index) => (
              <motion.div
                key={component.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border-2"
                style={{ borderColor: '#E8F4F2' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${component.color}20` }}
                    >
                      <component.icon className="w-5 h-5" style={{ color: component.color }} />
                    </div>
                    <div>
                      <p style={{ color: '#102A43' }}>{component.category}</p>
                      <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                        {component.points} / {component.maxPoints} points
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-2xl mb-1"
                      style={{ color: component.color }}
                    >
                      {component.points}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#E8F4F2' }}>
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${(component.points / component.maxPoints) * 100}%`,
                      backgroundColor: component.color
                    }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-2 pl-2">
                  {component.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {detail.earned ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: component.color }} />
                      ) : (
                        <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#102A43', opacity: 0.3 }} />
                      )}
                      <span style={{ 
                        color: '#102A43', 
                        opacity: detail.earned ? 1 : 0.5,
                        textDecoration: detail.earned ? 'none' : 'line-through'
                      }}>
                        {detail.text}
                      </span>
                      <span className="ml-auto text-xs" style={{ color: component.color }}>
                        {detail.earned ? `+${detail.points}` : `${detail.points}`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#E8F4F2' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: '#1C7C54' }} />
            <h4 style={{ color: '#102A43' }}>How to Improve Your Score</h4>
          </div>
          <div className="space-y-3">
            {improvementTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'white' }}
                >
                  <tip.icon className="w-4 h-4" style={{ color: tip.color }} />
                </div>
                <div className="flex-1">
                  <p style={{ color: '#102A43' }}>{tip.tip}</p>
                  <p className="text-sm" style={{ color: tip.color }}>
                    {tip.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg border-2" style={{ borderColor: '#A8E6CF', backgroundColor: '#A8E6CF10' }}>
          <p className="text-sm" style={{ color: '#102A43' }}>
            <strong>📊 About Your Score:</strong> Your Fitness Score is calculated daily based on calorie balance, 
            macro adherence, workout consistency, and logging habits. Aim for 80+ to stay on track with your goals!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}