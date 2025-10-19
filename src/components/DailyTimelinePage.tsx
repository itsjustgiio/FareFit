import { useState } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Flame, Apple, Dumbbell, ChevronLeft, ChevronRight, Sparkles, Clock, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Footer } from './Footer';
import { MealDetailModal } from './MealDetailModal';
import { FitnessScoreModal } from './FitnessScoreModal';
import { motion } from 'motion/react';
import { useUserMeals } from '../hooks/useUserMeals';
import { getDateInEasternTimezone } from '../userService';

interface DailyTimelinePageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai' | 'food-assistant' | 'workout-detail') => void;
  onFeedbackClick: () => void;
  userGoal?: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  loggedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface MealEntry {
  id: string;
  type: 'meal' | 'workout';
  name: string;
  calories: number;
  time: string;
  timestamp: Date;
  status: string;
  // Meal-specific fields
  foods?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: string;
  }[];
  // Workout-specific fields
  exercises?: {
    name: string;
    sets: number;
    reps: number;
  }[];
}

export function DailyTimelinePage({ onBack, onNavigate, onFeedbackClick, userGoal, loggedMacros }: DailyTimelinePageProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date(`${getDateInEasternTimezone()}T00:00:00`));
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [isFitnessScoreOpen, setIsFitnessScoreOpen] = useState(false);

  // Get real meal data from Firestore for selected date
  const { meals, totals, loading } = useUserMeals(selectedDate);

  // Loading state while fetching meal data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8F4F2' }}>
        <div className="text-center">
          <div className="mb-4 text-2xl" style={{ color: '#1C7C54' }}>🍽️</div>
          <p style={{ color: '#1C7C54' }}>Loading your timeline...</p>
        </div>
      </div>
    );
  }

  // Group meals by meal_type to combine foods into single entries
  const groupedMeals = meals.reduce((groups, meal) => {
    const mealType = meal.meal_type || 'meal';
    if (!groups[mealType]) {
      groups[mealType] = {
        meal_type: mealType,
        total_calories: 0,
        foods: [],
        meal_time: null, // Track the time for this meal group
      };
    }
    
    groups[mealType].total_calories += meal.calories || 0;
    groups[mealType].foods.push({
      name: meal.food_name || 'Unknown food',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fats || 0,
      serving: meal.serving_size?.toString() || '1',
    });
    
    // Capture the earliest meal_time for this meal type (if available)
    if (meal.meal_time) {
      const mealTime = typeof meal.meal_time === 'object' && meal.meal_time.seconds 
        ? new Date(meal.meal_time.seconds * 1000) // Firestore Timestamp
        : new Date(meal.meal_time); // Regular Date
      
      if (!groups[mealType].meal_time || mealTime < groups[mealType].meal_time) {
        groups[mealType].meal_time = mealTime;
      }
    }
    
    return groups;
  }, {} as Record<string, { meal_type: string; total_calories: number; foods: any[]; meal_time: Date | null }>);

  // Convert grouped meals to timeline format
  const mealEntries: MealEntry[] = Object.values(groupedMeals).map((group, index) => ({
    id: `meal-group-${group.meal_type}-${index}`,
    type: 'meal' as const,
    name: group.meal_type.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
    calories: group.total_calories,
    time: group.meal_time ? group.meal_time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : '—',
    timestamp: group.meal_time || new Date(),
    status: 'CONSUMED',
    foods: group.foods,
  }));

  // Check if we should show workout for selected date (only show for today for now)
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  // Merge real meals with static workout data  
  const workoutEntry = isToday ? [{
    id: 'workout-1',
    type: 'workout' as const,
    name: 'Push Day',
    calories: -517,
    time: '6:15 PM',
    timestamp: new Date(2025, 9, 17, 18, 15),
    status: 'WORKOUT',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8 },
      { name: 'Incline DB Press', sets: 3, reps: 10 },
      { name: 'Lateral Raises', sets: 3, reps: 12 },
      { name: 'Tricep Pushdowns', sets: 3, reps: 15 },
    ],
  }] : [];

  const timelineEntries: MealEntry[] = [
    ...mealEntries,
    ...workoutEntry,
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate cumulative data for chart
  const cumulativeData = timelineEntries.reduce((acc, entry, index) => {
    const prevCalories = index > 0 ? acc[index - 1].calories : 0;
    const prevBurned = index > 0 ? acc[index - 1].burned : 0;
    
    if (entry.type === 'meal') {
      acc.push({
        time: entry.time,
        calories: prevCalories + entry.calories,
        burned: prevBurned,
        net: (prevCalories + entry.calories) - prevBurned
      });
    } else {
      acc.push({
        time: entry.time,
        calories: prevCalories,
        burned: prevBurned + Math.abs(entry.calories),
        net: prevCalories - (prevBurned + Math.abs(entry.calories))
      });
    }
    return acc;
  }, [] as { time: string; calories: number; burned: number; net: number }[]);

  // Calculate totals using real data
  const totalConsumed = totals.calories || 0;
  const totalBurned = 517; // Still static until workout logging is added
  const netCalories = totalConsumed - totalBurned;
  const targetCalories = userGoal?.targetCalories || 2200;
  const remainingCalories = targetCalories - netCalories;

  // Calculate macro percentages using real data
  const proteinConsumed = totals.protein || 0;
  const carbsConsumed = totals.carbs || 0;
  const fatConsumed = totals.fat || 0;
  const fiberConsumed = totals.fiber || 0;

  const proteinTarget = userGoal?.protein || 165;
  const carbsTarget = userGoal?.carbs || 220;
  const fatTarget = userGoal?.fat || 73;
  const fiberTarget = 30;

  const proteinPercent = (proteinConsumed / proteinTarget) * 100;
  const carbsPercent = (carbsConsumed / carbsTarget) * 100;
  const fatPercent = (fatConsumed / fatTarget) * 100;
  const fiberPercent = (fiberConsumed / fiberTarget) * 100;

  // Date navigation
  const previousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const isFuture = selectedDate > new Date();

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleMealClick = (entry: MealEntry) => {
    if (entry.type === 'meal') {
      setSelectedMeal(entry);
    } else {
      // Navigate to workout detail page
      onNavigate('workout-detail');
    }
  };

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: '#E8F4F2' }}>
        <header className="px-4 sm:px-6 lg:px-8 py-4" style={{ backgroundColor: '#1C7C54' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-white hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            {/* Fitness Score - Clickable */}
            <button
              onClick={() => setIsFitnessScoreOpen(true)}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="white"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${(82 / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl text-white">82</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-white opacity-90">Fitness</p>
                <p className="text-white">Score</p>
              </div>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          {/* Date Navigation */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={previousDay}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: '#1C7C54' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: '#1C7C54' }} />
                <h2 style={{ color: '#102A43' }}>{formatDate(selectedDate)}</h2>
              </div>

              <button
                onClick={nextDay}
                disabled={isFuture}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: '#1C7C54' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Daily Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-4 h-4" style={{ color: '#1C7C54' }} />
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>Consumed</p>
              </div>
              <p className="text-3xl mb-1" style={{ color: '#102A43' }}>{totalConsumed}</p>
              <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>kcal</p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4" style={{ color: '#FFB6B9' }} />
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>Burned</p>
              </div>
              <p className="text-3xl mb-1" style={{ color: '#FFB6B9' }}>{totalBurned}</p>
              <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>kcal</p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#1C7C54' }} />
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>Net Calories</p>
              </div>
              <p className="text-3xl mb-1" style={{ color: '#1C7C54' }}>{netCalories}</p>
              <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>kcal</p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: '#102A43' }} />
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>Remaining</p>
              </div>
              <p className="text-3xl mb-1" style={{ color: remainingCalories >= 0 ? '#102A43' : '#FFB6B9' }}>
                {Math.abs(remainingCalories)}
              </p>
              <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                {remainingCalories >= 0 ? 'kcal left' : 'kcal over'}
              </p>
            </div>
          </div>

          {/* Macro Progress Rings - MOVED TO TOP */}
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm mb-6">
            <h3 className="mb-6" style={{ color: '#102A43' }}>Macros</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Protein */}
              <div className="flex flex-col items-center">
                <p className="text-sm mb-3" style={{ color: '#F5A623' }}>Protein</p>
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E8F4F2"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#F5A623"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(proteinPercent / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl" style={{ color: '#102A43' }}>{proteinConsumed}</span>
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>/{proteinTarget}g</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  {Math.max(0, proteinTarget - proteinConsumed)}g left
                </p>
              </div>

              {/* Carbohydrates */}
              <div className="flex flex-col items-center">
                <p className="text-sm mb-3" style={{ color: '#4DD4AC' }}>Carbohydrates</p>
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E8F4F2"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#4DD4AC"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(carbsPercent / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl" style={{ color: '#102A43' }}>{carbsConsumed}</span>
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>/{carbsTarget}g</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  {Math.max(0, carbsTarget - carbsConsumed)}g left
                </p>
              </div>

              {/* Fat */}
              <div className="flex flex-col items-center">
                <p className="text-sm mb-3" style={{ color: '#6B47DC' }}>Fat</p>
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E8F4F2"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#6B47DC"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(fatPercent / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl" style={{ color: '#102A43' }}>{fatConsumed}</span>
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>/{fatTarget}g</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  {Math.max(0, fatTarget - fatConsumed)}g left
                </p>
              </div>

              {/* Fiber */}
              <div className="flex flex-col items-center">
                <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>Fiber</p>
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E8F4F2"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#1C7C54"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${(fiberPercent / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl" style={{ color: '#102A43' }}>{fiberConsumed}</span>
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>/{fiberTarget}g</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  {Math.max(0, fiberTarget - fiberConsumed)}g left
                </p>
              </div>
            </div>
          </div>

          {/* AI Daily Recap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-lg shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1C7C54 0%, #A8E6CF 100%)'
            }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-1" />
              <div>
                <p className="text-white mb-2">
                  <span style={{ fontWeight: 600 }}>AI Daily Recap:</span>
                </p>
                <p className="text-white opacity-95">
                  You've hit <strong>66% of your calorie goal</strong> so far today with excellent protein intake at <strong>58%</strong>. 
                  You burned 517 calories during your Push Day workout — consider adding <strong>70g more protein</strong> and <strong>80g carbs</strong> for dinner to support recovery and hit your daily targets.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="mb-4" style={{ color: '#102A43' }}>Daily Timeline</h3>
              
              <div className="space-y-4">
                {timelineEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 text-4xl">📅</div>
                    <p className="mb-2" style={{ color: '#102A43' }}>
                      No meals logged for {formatDate(selectedDate)}
                    </p>
                    {isToday ? (
                      <button
                        onClick={onBack}
                        className="mt-4 px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#1C7C54' }}
                      >
                        Go to Dashboard to Log Meal
                      </button>
                    ) : (
                      <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                        This day had no activity
                      </p>
                    )}
                  </div>
                ) : (
                  timelineEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleMealClick(entry)}
                    className="flex items-start gap-4 p-4 rounded-lg border-2 border-transparent hover:border-gray-200 transition-all cursor-pointer hover:shadow-sm group"
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{
                        backgroundColor: entry.type === 'workout' ? '#A8E6CF' : '#E8F4F2'
                      }}>
                        {entry.type === 'workout' ? (
                          <Dumbbell className="w-5 h-5" style={{ color: '#1C7C54' }} />
                        ) : (
                          <Apple className="w-5 h-5" style={{ color: '#1C7C54' }} />
                        )}
                      </div>
                      {index < timelineEntries.length - 1 && (
                        <div className="w-0.5 h-12 mt-2" style={{ backgroundColor: '#E8F4F2' }} />
                      )}
                    </div>

                    {/* Entry content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p style={{ color: '#102A43' }}>{entry.name}</p>
                          <span className="text-xs px-2 py-1 rounded" style={{
                            backgroundColor: entry.type === 'workout' ? '#A8E6CF' : '#E8F4F2',
                            color: '#102A43'
                          }}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: entry.calories < 0 ? '#1C7C54' : '#102A43' }}>
                          {entry.calories > 0 ? '+' : ''}{entry.calories} kcal
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                        <Clock className="w-3 h-3" />
                        <span>{entry.time}</span>
                      </div>

                      {/* Preview items */}
                      {entry.type === 'meal' && entry.foods && (
                        <p className="text-sm mt-2 truncate" style={{ color: '#102A43', opacity: 0.7 }}>
                          {entry.foods.map(f => f.name).join(', ')}
                        </p>
                      )}
                      {entry.type === 'workout' && entry.exercises && (
                        <p className="text-sm mt-2 truncate" style={{ color: '#102A43', opacity: 0.7 }}>
                          {entry.exercises.length} exercises completed
                        </p>
                      )}
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Cumulative Graph */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="mb-4" style={{ color: '#102A43' }}>Calorie Flow</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F2" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#102A43" 
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#102A43" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #A8E6CF',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#102A43"
                    strokeWidth={2}
                    dot={{ fill: '#102A43', r: 4 }}
                    name="Consumed"
                  />
                  <Line
                    type="monotone"
                    dataKey="burned"
                    stroke="#FFB6B9"
                    strokeWidth={2}
                    dot={{ fill: '#FFB6B9', r: 4 }}
                    name="Burned"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#1C7C54"
                    strokeWidth={3}
                    dot={{ fill: '#1C7C54', r: 5 }}
                    name="Net"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <Footer onNavigate={onNavigate} onFeedbackClick={onFeedbackClick} />
      </div>

      {/* Modals */}
      <MealDetailModal
        meal={selectedMeal}
        isOpen={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onFoodAssistantClick={() => onNavigate('food-assistant')}
        userGoal={userGoal}
      />

      <FitnessScoreModal
        isOpen={isFitnessScoreOpen}
        onClose={() => setIsFitnessScoreOpen(false)}
      />
    </>
  );
}
