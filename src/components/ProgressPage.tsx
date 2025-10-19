import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Flame, Trophy, Activity, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Footer } from './Footer';
import { FeedbackModal } from './FeedbackModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { getWeeklyFacts, getUserAchievements, getFoodStreaks, updateDailyMetrics} from '../userService';
import { getAuth } from 'firebase/auth';

interface ProgressPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

interface WeeklyFacts {
  total_cals: number;
  total_burned: number;
  net_calories: number;
  total_workouts: number;
  days_consumed: Record<string, number>;
  days_burned: Record<string, number>;
  days_net: Record<string, number>;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  earned: boolean;
  mystery: boolean;
  discovered?: boolean;
  hint?: string;
  category?: string;
  color?: string;
  categoryIcon?: string;
}

export function ProgressPage({ onBack, onNavigate, onFeedbackClick }: ProgressPageProps) {
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Nutrition']));
  const [weeklyFacts, setWeeklyFacts] = useState<WeeklyFacts | null>(null);
  const [userAchievements, setUserAchievements] = useState<any>(null);
  const [foodStreaks, setFoodStreaks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          setError('User not logged in');
          return;
        }

        // Update daily metrics first to ensure data is current
        await updateDailyMetrics(user.uid);
        
        // Fetch all data in parallel
        const [facts, achievements, streaks] = await Promise.all([
          getWeeklyFacts(),
          getUserAchievements(user.uid),
          getFoodStreaks(user.uid)
        ]);

        setWeeklyFacts(facts);
        setUserAchievements(achievements);
        setFoodStreaks(streaks);
        
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  // Transform Firestore data to match your chart format
  const weeklyStats = weeklyFacts ? [
    { 
      day: 'Mon', 
      consumed: weeklyFacts.days_consumed.monday || 0, 
      burned: weeklyFacts.days_burned.monday || 0, 
      net: weeklyFacts.days_net.monday || 0,
      workout: weeklyFacts.days_burned.monday > 0
    },
    { 
      day: 'Tue', 
      consumed: weeklyFacts.days_consumed.tuesday || 0, 
      burned: weeklyFacts.days_burned.tuesday || 0, 
      net: weeklyFacts.days_net.tuesday || 0,
      workout: weeklyFacts.days_burned.tuesday > 0
    },
    { 
      day: 'Wed', 
      consumed: weeklyFacts.days_consumed.wednesday || 0, 
      burned: weeklyFacts.days_burned.wednesday || 0, 
      net: weeklyFacts.days_net.wednesday || 0,
      workout: weeklyFacts.days_burned.wednesday > 0
    },
    { 
      day: 'Thu', 
      consumed: weeklyFacts.days_consumed.thursday || 0, 
      burned: weeklyFacts.days_burned.thursday || 0, 
      net: weeklyFacts.days_net.thursday || 0,
      workout: weeklyFacts.days_burned.thursday > 0
    },
    { 
      day: 'Fri', 
      consumed: weeklyFacts.days_consumed.friday || 0, 
      burned: weeklyFacts.days_burned.friday || 0, 
      net: weeklyFacts.days_net.friday || 0,
      workout: weeklyFacts.days_burned.friday > 0
    },
    { 
      day: 'Sat', 
      consumed: weeklyFacts.days_consumed.saturday || 0, 
      burned: weeklyFacts.days_burned.saturday || 0, 
      net: weeklyFacts.days_net.saturday || 0,
      workout: weeklyFacts.days_burned.saturday > 0
    },
    { 
      day: 'Sun', 
      consumed: weeklyFacts.days_consumed.sunday || 0, 
      burned: weeklyFacts.days_burned.sunday || 0, 
      net: weeklyFacts.days_net.sunday || 0,
      workout: weeklyFacts.days_burned.sunday > 0
    },
  ] : [
    { day: 'Mon', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Tue', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Wed', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Thu', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Fri', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Sat', consumed: 0, burned: 0, net: 0, workout: false },
    { day: 'Sun', consumed: 0, burned: 0, net: 0, workout: false },
  ];

  // Use real data from Firestore or fallback to 0
  const totalConsumed = weeklyFacts ? weeklyFacts.total_cals : 0;
  const totalBurned = weeklyFacts ? weeklyFacts.total_burned : 0;
  const totalNet = weeklyFacts ? weeklyFacts.net_calories : 0;
  const workoutCount = weeklyFacts ? weeklyFacts.total_workouts : 0;

  // Achievement categories with real data from Firestore
  const achievementCategories = [
    {
      name: 'Nutrition',
      color: '#1C7C54',
      icon: '🥗',
      achievements: [
        { 
          id: 1, 
          title: 'Macro Master', 
          description: 'Hit protein goal 5 days in a row', 
          earned: userAchievements?.macro_master || false, 
          mystery: false 
        },
        { 
          id: 2, 
          title: 'Protein Champion', 
          description: 'Hit protein goal for 30 days straight', 
          earned: userAchievements?.protein_champ || false, 
          mystery: false 
        },
        { 
          id: 3, 
          title: 'Carb Control', 
          description: 'Stayed within carb range for 7 consecutive days', 
          earned: userAchievements?.carb_control || false, 
          mystery: false 
        },
        { 
          id: 4, 
          title: 'Fat Balance', 
          description: 'Hit fat target for 10 days straight', 
          earned: userAchievements?.fat_balance || false, 
          mystery: false 
        },
        { 
          id: 5, 
          title: 'Micronutrient Minded', 
          description: 'Logged 5 meals with fruits/veggies in a week', 
          earned: userAchievements?.micronutr_minded || false, 
          mystery: false 
        },
        { 
          id: 6, 
          title: 'Clean Plate Club', 
          description: 'Logged 3 full meals + snacks for 7 days straight', 
          earned: userAchievements?.clean_plate_club || false, 
          mystery: false 
        },
        { 
          id: 7, 
          title: 'Hydration Hero', 
          description: 'Drank 8+ glasses of water daily for a week', 
          earned: userAchievements?.hydration_hero || false, 
          mystery: false 
        },
        { 
          id: 8, 
          title: 'Fiber Fiend', 
          description: 'Hit fiber goal 10 days total', 
          earned: userAchievements?.fiber_fiend || false, 
          mystery: false 
        },
        { 
          id: 9, 
          title: 'Sugar Smart', 
          description: 'Stayed under sugar target for 7 consecutive days', 
          earned: userAchievements?.sugar_smart || false, 
          mystery: false 
        },
        { 
          id: 10, 
          title: 'The Overachiever', 
          description: 'Exceed any macro goal by 20%', 
          hint: 'Go beyond your goal.', 
          earned: false, 
          mystery: true, 
          discovered: false 
        }
      ]
    },
    {
      name: 'Workout & Fitness',
      color: '#4A90E2',
      icon: '💪',
      achievements: [
        { id: 11, title: 'Workout Warrior', description: 'Complete 4 workouts in a week', earned: true, mystery: false },
        { id: 12, title: 'Iron Will', description: 'Complete 20 workouts in a month', earned: false, mystery: false },
        { id: 13, title: 'Beast Mode', description: 'Complete 100 total workouts', earned: false, mystery: false },
        { id: 14, title: 'No Days Off', description: 'Work out 7 days in a row', earned: false, mystery: false },
        { id: 15, title: 'Consistency King', description: 'Work out for 30 consecutive days', earned: false, mystery: false },
        { id: 16, title: 'Push Day Pro', description: 'Log 10 push workouts', earned: true, mystery: false },
        { id: 17, title: 'Pull Day Performer', description: 'Log 10 pull workouts', earned: true, mystery: false },
        { id: 18, title: 'Leg Day Legend', description: 'Log 10 leg workouts', earned: false, mystery: false },
        { id: 19, title: 'Sweat Session', description: 'Burn 500+ calories in one workout', earned: true, mystery: false },
        { id: 20, title: 'Summer Shred', description: 'Maintain calorie deficit 10 days in June–Aug', hint: 'Feel the heat.', earned: false, mystery: true, discovered: false }
      ]
    },
    {
      name: 'Streak & Consistency',
      color: '#FF6B35',
      icon: '🔥',
      achievements: [
        { id: 21, title: '7-Day Streak', description: 'Log meals for 7 consecutive days', earned: true, mystery: false },
        { id: 22, title: 'Early Bird', description: 'Log breakfast before 9 AM for 7 days', earned: true, mystery: false },
        { id: 23, title: 'Night Owl', description: 'Log your last meal after 8 PM for 5 nights', earned: false, mystery: false },
        { id: 24, title: 'Routine Rookie', description: 'Log activity or meals for 3 consecutive days', earned: true, mystery: false },
        { id: 25, title: 'The Streak Breaker', description: 'Lose a streak but rebuild it again', hint: 'Nobody\'s perfect.', earned: false, mystery: true, discovered: true },
        { id: 26, title: 'Habit Hero', description: 'Maintain any streak for 21 days', earned: false, mystery: false },
        { id: 27, title: 'Consistency Champion', description: 'Log meals for 30 consecutive days', earned: false, mystery: false },
        { id: 28, title: 'Daily Devotee', description: 'Use FitPanel 14 days in a row', earned: true, mystery: false },
        { id: 29, title: 'Dedication Destroyer', description: 'Use FitPanel for 60 days straight', earned: false, mystery: false },
        { id: 30, title: 'The Comeback Kid', description: 'Log in after 14 days away', hint: 'They always come back…', earned: true, mystery: true, discovered: true }
      ]
    },
    {
      name: 'Food Logging & Tracking',
      color: '#F4A460',
      icon: '📝',
      achievements: [
        { id: 31, title: 'Foodie Beginner', description: 'Log your first meal', earned: true, mystery: false },
        { id: 32, title: 'Meal Machine', description: 'Log 50 total meals', earned: true, mystery: false },
        { id: 33, title: 'Calorie Tracker', description: 'Log 1,000 total calories in a day', earned: true, mystery: false },
        { id: 34, title: 'Balanced Bites', description: 'Log a meal with all three macros', earned: true, mystery: false },
        { id: 35, title: 'Snack Strategist', description: 'Log 20 snacks', earned: false, mystery: false },
        { id: 36, title: 'Prep Pro', description: 'Log 5 custom recipes', earned: false, mystery: false },
        { id: 37, title: 'The Midnight Logger', description: 'Log a meal between 12 AM–3 AM', hint: 'For the night owls out there.', earned: false, mystery: true, discovered: true },
        { id: 38, title: 'Weekend Logger', description: 'Log every day Friday–Sunday', earned: true, mystery: false },
        { id: 39, title: 'Breakfast Bandit', description: 'Log dessert in the morning', hint: 'Who said cookies aren\'t breakfast?', earned: false, mystery: true, discovered: false },
        { id: 40, title: 'Streak Chef', description: 'Log breakfast, lunch, and dinner 7 days in a row', earned: true, mystery: false }
      ]
    },
    {
      name: 'Weight & Progress',
      color: '#9B59B6',
      icon: '⚖️',
      achievements: [
        { id: 41, title: 'First Step', description: 'Set your first fitness goal', earned: true, mystery: false },
        { id: 42, title: 'Scale Shifter', description: 'Lose or gain your first pound', earned: true, mystery: false },
        { id: 43, title: 'Milestone Marker', description: 'Reach 5 pounds toward your goal', earned: false, mystery: false },
        { id: 44, title: 'Goal Crusher', description: 'Hit your weight goal', earned: false, mystery: false },
        { id: 45, title: 'New Year, New Me', description: 'Log 3 workouts in the first week of January', hint: 'January holds surprises.', earned: false, mystery: true, discovered: false }
      ]
    },
    {
      name: 'Community / AI Interaction',
      color: '#17A2B8',
      icon: '🤖',
      achievements: [
        { id: 46, title: 'Ask Barry', description: 'Talk to Barry in the Help section for the first time', earned: true, mystery: false },
        { id: 47, title: 'AI Whisperer', description: 'Chat with Barry 10+ times', hint: 'Barry seems to like you.', earned: false, mystery: true, discovered: false },
        { id: 48, title: 'Food Feedback', description: 'Use Food AI to log a meal automatically', earned: false, mystery: false },
        { id: 49, title: 'Knowledge Seeker', description: 'View a tip in the info section', earned: true, mystery: false },
        { id: 50, title: 'Feedback Friend', description: 'Submit your first feedback form', earned: true, mystery: false }
      ]
    },
    {
      name: 'Mystery & Easter Eggs',
      color: '#6C5CE7',
      icon: '🎁',
      achievements: [
        { id: 56, title: 'Tap Tap Boom', description: 'Click same button 10x fast', hint: 'You\'re a little… curious.', earned: false, mystery: true, discovered: false },
        { id: 57, title: 'Developer\'s Pet', description: 'Find the hidden route', hint: 'How did you even find this?', earned: false, mystery: true, discovered: false }
      ]
    }
  ];

  // Calculate achievement statistics
  const allAchievements = achievementCategories.flatMap(cat => 
    cat.achievements.map(ach => ({ ...ach, category: cat.name, color: cat.color, categoryIcon: cat.icon }))
  );
  
  const standardAchievements = allAchievements.filter(a => !a.mystery);
  const mysteryAchievements = allAchievements.filter(a => a.mystery);
  
  const totalStandard = standardAchievements.length;
  const totalMystery = mysteryAchievements.length;
  const totalAchievements = totalStandard + totalMystery;
  
  const earnedStandard = standardAchievements.filter(a => a.earned).length;
  const earnedMystery = mysteryAchievements.filter(a => a.earned).length;
  const discoveredMystery = mysteryAchievements.filter(a => a.discovered || a.earned).length;
  const earnedCount = earnedStandard + earnedMystery;
  
  const standardPercentage = (earnedStandard / totalStandard) * 100;
  const mysteryPercentage = (earnedMystery / totalMystery) * 100;
  const progressPercentage = (earnedCount / totalAchievements) * 100;
  
  // Get rank based on achievements
  const getRank = (count: number) => {
    if (count >= 50) return { name: 'Platinum', color: '#E5E4E2', icon: '💎' };
    if (count >= 40) return { name: 'Gold', color: '#FFD700', icon: '🏆' };
    if (count >= 25) return { name: 'Silver', color: '#C0C0C0', icon: '🥈' };
    if (count >= 10) return { name: 'Bronze', color: '#CD7F32', icon: '🥉' };
    return { name: 'Beginner', color: '#A8E6CF', icon: '🌱' };
  };
  
  const currentRank = getRank(earnedCount);

  const toggleCategory = (categoryName: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryName)) {
      newOpen.delete(categoryName);
    } else {
      newOpen.add(categoryName);
    }
    setOpenCategories(newOpen);
  };

  const collapseAll = () => {
    setOpenCategories(new Set());
  };

  const expandAll = () => {
    const allCategories = new Set(achievementCategories.map(cat => cat.name));
    setOpenCategories(allCategories);
  };

  const handleFilterChange = (filter: 'all' | 'unlocked' | 'locked') => {
    setAchievementFilter(filter);
    
    // Auto-expand categories when filtering to show results
    if (filter !== 'all') {
      const categoriesToOpen = achievementCategories
        .filter(cat => {
          const hasMatchingAchievements = cat.achievements.some(ach => {
            if (filter === 'unlocked') return ach.earned;
            if (filter === 'locked') return !ach.earned;
            return true;
          });
          return hasMatchingAchievements;
        })
        .map(cat => cat.name);
      
      setOpenCategories(new Set(categoriesToOpen));
    }
  };

  // Current streak display from food streaks
  const currentStreak = foodStreaks ? Math.max(
    foodStreaks.protein_track_days || 0,
    foodStreaks.carbs_track_days || 0,
    foodStreaks.fats_track_days || 0,
    foodStreaks.loggedMeals_track_days || 0,
    foodStreaks.hyrdration_track_days || 0
  ) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--farefit-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--farefit-primary)' }}></div>
          <p style={{ color: 'var(--farefit-text)' }}>Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--farefit-bg)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--farefit-accent)' }}>Error: {error}</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--farefit-primary)', color: 'white' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
      <header className="px-4 sm:px-6 lg:px-8 py-4 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-primary)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-white hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h2 style={{ color: 'var(--farefit-text)' }}>Your Progress</h2>
          <p style={{ color: 'var(--farefit-subtext)' }}>Track your weekly stats and achievements</p>
        </div>

        {/* Weekly Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg p-5 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Consumed</p>
            <p className="text-3xl mb-1" style={{ color: 'var(--farefit-text)' }}>{totalConsumed.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>kcal this week</p>
          </div>

          <div className="rounded-lg p-5 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Burned</p>
            <p className="text-3xl mb-1" style={{ color: 'var(--farefit-accent)' }}>{totalBurned.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>kcal this week</p>
          </div>

          <div className="rounded-lg p-5 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Net Calories</p>
            <p className="text-3xl mb-1" style={{ color: 'var(--farefit-primary)' }}>{totalNet.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>total this week</p>
          </div>

          <div className="rounded-lg p-5 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4" style={{ color: 'var(--farefit-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>Workouts</p>
            </div>
            <p className="text-3xl mb-1" style={{ color: 'var(--farefit-text)' }}>{workoutCount}</p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>sessions</p>
          </div>

          <div className="rounded-lg p-5 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4" style={{ color: 'var(--farefit-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>Streak</p>
            </div>
            <p className="text-3xl mb-1" style={{ color: 'var(--farefit-text)' }}>{currentStreak}</p>
            <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>days in a row</p>
          </div>
        </div>

        {/* Current Streaks Display */}
        {foodStreaks && (
          <div className="rounded-lg p-6 shadow-sm mb-6 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <h3 className="mb-4" style={{ color: 'var(--farefit-text)' }}>Current Streaks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--farefit-primary)' }}>
                  {foodStreaks.protein_track_days || 0}
                </div>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>Protein Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--farefit-primary)' }}>
                  {foodStreaks.carbs_track_days || 0}
                </div>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>Carbs Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--farefit-primary)' }}>
                  {foodStreaks.fats_track_days || 0}
                </div>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>Fats Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--farefit-primary)' }}>
                  {foodStreaks.fiber_track_days || 0}
                </div>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>Fiber Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Table and Graph Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Data Table */}
          <div className="rounded-lg p-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <h3 className="mb-4" style={{ color: 'var(--farefit-text)' }}>Daily Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--farefit-secondary)' }}>
                    <th className="text-left py-3 px-2" style={{ color: 'var(--farefit-subtext)' }}>Day</th>
                    <th className="text-right py-3 px-2" style={{ color: 'var(--farefit-subtext)' }}>Consumed</th>
                    <th className="text-right py-3 px-2" style={{ color: 'var(--farefit-subtext)' }}>Burned</th>
                    <th className="text-right py-3 px-2" style={{ color: 'var(--farefit-subtext)' }}>Net</th>
                    <th className="text-center py-3 px-2" style={{ color: 'var(--farefit-subtext)' }}>Workout</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyStats.map((stat, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--farefit-border)' }}>
                      <td className="py-3 px-2" style={{ color: 'var(--farefit-text)' }}>{stat.day}</td>
                      <td className="text-right py-3 px-2" style={{ color: 'var(--farefit-text)' }}>{stat.consumed}</td>
                      <td className="text-right py-3 px-2" style={{ color: 'var(--farefit-accent)' }}>-{stat.burned}</td>
                      <td className="text-right py-3 px-2" style={{ color: 'var(--farefit-primary)' }}>{stat.net}</td>
                      <td className="text-center py-3 px-2">
                        {stat.workout ? (
                          <span className="inline-block w-6 h-6 rounded-full text-center" style={{ backgroundColor: 'var(--farefit-secondary)' }}>
                            ✓
                          </span>
                        ) : (
                          <span style={{ color: 'var(--farefit-text)', opacity: 0.3 }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graph */}
          <div className="rounded-lg p-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <h3 className="mb-4" style={{ color: 'var(--farefit-text)' }}>Weekly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--farefit-border)" />
                <XAxis dataKey="day" stroke="var(--farefit-subtext)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--farefit-subtext)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--farefit-card)', 
                    border: '1px solid var(--farefit-secondary)',
                    borderRadius: '8px',
                    color: 'var(--farefit-text)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="consumed" 
                  stroke="var(--farefit-primary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--farefit-primary)', r: 4 }}
                  name="Consumed"
                />
                <Line 
                  type="monotone" 
                  dataKey="burned" 
                  stroke="var(--farefit-accent)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--farefit-accent)', r: 4 }}
                  name="Burned"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="var(--farefit-secondary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--farefit-secondary)', r: 4 }}
                  name="Net"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          {/* Achievement Header with Progress */}
          <div className="rounded-lg p-6 shadow-sm mb-6 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="mb-1" style={{ color: 'var(--farefit-text)' }}>🏆 Achievements</h2>
                <p className="text-sm" style={{ color: 'var(--farefit-subtext)' }}>
                  {earnedCount} / {totalAchievements} unlocked ({discoveredMystery} mysteries discovered)
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{currentRank.icon}</span>
                  <span style={{ color: currentRank.color }}>{currentRank.name}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--farefit-subtext)', opacity: 0.7 }}>
                  FareFit Rank
                </p>
              </div>
            </div>
            
            {/* Dual Progress Bars */}
            <div className="space-y-4">
              {/* Standard Achievements */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--farefit-subtext)' }}>
                  <span>Standard</span>
                  <span>{earnedStandard}/{totalStandard} ({Math.round(standardPercentage)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${standardPercentage}%`,
                      background: 'linear-gradient(90deg, var(--farefit-primary) 0%, var(--farefit-secondary) 100%)'
                    }}
                  />
                </div>
              </div>
              
              {/* Mystery Achievements */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--farefit-subtext)' }}>
                  <span>Mystery</span>
                  <span>{earnedMystery}/{totalMystery} ({Math.round(mysteryPercentage)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${mysteryPercentage}%`,
                      background: 'linear-gradient(90deg, #6C5CE7 0%, #A29BFE 100%)'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-sm text-center mt-4" style={{ color: 'var(--farefit-subtext)' }}>
              Track your streaks, goals, and milestones to earn new badges!
            </p>
          </div>

          {/* Filter Buttons and Collapse Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-3 flex-1 flex-wrap">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-md text-sm transition-all`}
                style={{
                  backgroundColor: achievementFilter === 'all' ? 'var(--farefit-primary)' : 'var(--farefit-card)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: achievementFilter === 'all' ? 'var(--farefit-primary)' : 'var(--farefit-secondary)',
                  color: achievementFilter === 'all' ? 'white' : 'var(--farefit-text)'
                }}
              >
                All ({totalAchievements})
              </button>
              <button
                onClick={() => handleFilterChange('unlocked')}
                className={`px-4 py-2 rounded-md text-sm transition-all`}
                style={{
                  backgroundColor: achievementFilter === 'unlocked' ? 'var(--farefit-primary)' : 'var(--farefit-card)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: achievementFilter === 'unlocked' ? 'var(--farefit-primary)' : 'var(--farefit-secondary)',
                  color: achievementFilter === 'unlocked' ? 'white' : 'var(--farefit-text)'
                }}
              >
                Unlocked ({earnedCount})
              </button>
              <button
                onClick={() => handleFilterChange('locked')}
                className={`px-4 py-2 rounded-md text-sm transition-all`}
                style={{
                  backgroundColor: achievementFilter === 'locked' ? 'var(--farefit-primary)' : 'var(--farefit-card)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: achievementFilter === 'locked' ? 'var(--farefit-primary)' : 'var(--farefit-secondary)',
                  color: achievementFilter === 'locked' ? 'white' : 'var(--farefit-text)'
                }}
              >
                Locked ({totalAchievements - earnedCount})
              </button>
            </div>
            
            {/* Collapse/Expand All Controls */}
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 rounded-md text-sm border transition-all"
                style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 rounded-md text-sm border transition-all"
                style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-text)' }}
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Achievement Categories */}
          {achievementCategories.map((category) => {
            const filteredAchievements = category.achievements.filter(ach => {
              if (achievementFilter === 'unlocked') return ach.earned;
              if (achievementFilter === 'locked') return !ach.earned;
              return true;
            });

            if (filteredAchievements.length === 0) return null;

            const categoryEarned = category.achievements.filter(a => a.earned).length;
            const categoryTotal = category.achievements.length;
            const isOpen = openCategories.has(category.name);

            return (
              <Collapsible
                key={category.name}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.name)}
                className="mb-6"
              >
                <div className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
                  {/* Category Header - Clickable */}
                  <CollapsibleTrigger className="w-full">
                    <div 
                      className="flex items-center gap-3 p-4 transition-colors cursor-pointer"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="mb-1" style={{ color: 'var(--farefit-text)' }}>{category.name}</h3>
                        <p className="text-xs" style={{ color: category.color }}>
                          {achievementFilter === 'all' && `${categoryEarned} / ${categoryTotal} earned`}
                          {achievementFilter === 'unlocked' && `${filteredAchievements.length} unlocked`}
                          {achievementFilter === 'locked' && `${filteredAchievements.length} locked`}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5" style={{ color: 'var(--farefit-subtext)' }} />
                        ) : (
                          <ChevronDown className="w-5 h-5" style={{ color: 'var(--farefit-subtext)' }} />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  {/* Collapsible Content */}
                  <CollapsibleContent className="transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAchievements.map((achievement) => {
                    const isMystery = achievement.mystery;
                    const isDiscovered = achievement.discovered || achievement.earned;
                    const showBlurred = isMystery && !isDiscovered;
                    
                    return (
                      <div
                        key={achievement.id}
                        className={`rounded-lg p-4 transition-all relative overflow-hidden ${
                          achievement.earned 
                            ? 'shadow-sm hover:shadow-md' 
                            : 'border border-dashed'
                        }`}
                        style={{
                          backgroundColor: 'var(--farefit-card)',
                          borderWidth: achievement.earned ? '2px' : '1px',
                          borderStyle: achievement.earned ? 'solid' : isMystery && !isDiscovered ? 'dashed' : 'dashed',
                          borderColor: achievement.earned ? (isMystery ? '#6C5CE7' : category.color) : 'var(--farefit-secondary)',
                          opacity: achievement.earned ? 1 : 0.6
                        }}
                      >
                        {/* Unlock Animation Overlay (for newly unlocked achievements) */}
                        {achievement.earned && isMystery && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div 
                              className="absolute inset-0 opacity-20"
                              style={{ 
                                background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)',
                                animation: 'pulse 2s ease-in-out infinite'
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 relative ${
                              showBlurred ? 'blur-md' : achievement.earned ? '' : 'grayscale'
                            }`}
                            style={{ backgroundColor: `${isMystery ? '#6C5CE7' : category.color}20` }}
                          >
                            {showBlurred ? '❓' : isMystery ? '🎁' : category.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 
                              className={`text-sm mb-1 ${showBlurred ? 'blur-sm' : ''}`}
                              style={{ color: 'var(--farefit-text)' }}
                            >
                              {showBlurred ? '???' : achievement.title}
                            </h4>
                            <p 
                              className={`text-xs ${showBlurred ? 'blur-sm' : ''}`}
                              style={{ color: 'var(--farefit-subtext)' }}
                            >
                              {showBlurred 
                                ? 'Keep tracking to uncover this secret.'
                                : achievement.description
                              }
                            </p>
                            
                            {/* Hint for undiscovered mysteries */}
                            {showBlurred && achievement.hint && (
                              <p className="text-xs mt-2 italic" style={{ color: '#6C5CE7', opacity: 0.8 }}>
                                💡 Hint: {achievement.hint}
                              </p>
                            )}
                            
                            {/* Hint for discovered but not earned mysteries */}
                            {isMystery && isDiscovered && !achievement.earned && achievement.hint && (
                              <p className="text-xs mt-2 italic" style={{ color: '#6C5CE7', opacity: 0.8 }}>
                                💡 Hint: {achievement.hint}
                              </p>
                            )}
                            
                            {achievement.earned && (
                              <div className="mt-2">
                                <span 
                                  className="text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                                  style={{ 
                                    backgroundColor: `${isMystery ? '#6C5CE7' : category.color}20`, 
                                    color: isMystery ? '#6C5CE7' : category.color 
                                  }}
                                >
                                  <span>{isMystery ? '🎉' : '✓'}</span> {isMystery ? 'Mystery Unlocked!' : 'Earned'}
                                </span>
                              </div>
                            )}
                            {!achievement.earned && !showBlurred && (
                              <div className="mt-2">
                                <span 
                                  className="text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                                  style={{ 
                                    backgroundColor: isMystery ? '#6C5CE720' : 'var(--farefit-bg)', 
                                    color: isMystery ? '#6C5CE7' : 'var(--farefit-text)', 
                                    opacity: 0.6 
                                  }}
                                >
                                  🔒 {isMystery ? 'Mystery Locked' : 'Locked'}
                                </span>
                              </div>
                            )}
                            {showBlurred && (
                              <div className="mt-2">
                                <span 
                                  className="text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                                  style={{ backgroundColor: '#6C5CE720', color: '#6C5CE7', opacity: 0.8 }}
                                >
                                  ❓ Mystery
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
      
      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}