import { useState } from 'react';
import { ArrowLeft, Info, Activity, TrendingDown, Minus, TrendingUp, Calculator, Target, Flame, Dumbbell } from 'lucide-react';
import { Footer } from './Footer';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner'; // 👈 Fixed: removed version specification

interface FitnessGoalPageProps {
  onBack: () => void;
  onSaveGoal: (goalData: GoalData) => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

export interface GoalData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityLevel: string;
  goalType: 'cut' | 'maintain' | 'bulk';
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number; // 👈 Added missing fiber property
}

export function FitnessGoalPage({ onBack, onSaveGoal, onNavigate, onFeedbackClick }: FitnessGoalPageProps) {
  const [selectedGoal, setSelectedGoal] = useState<'cut' | 'maintain' | 'bulk' | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<any>(null);
  const [useMetric, setUseMetric] = useState(true);
  
  // Form state
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState('');
  
  // Auto-convert weight when switching units
  const handleUnitToggle = () => {
    const newUseMetric = !useMetric;
    
    // Convert weight
    if (weight) {
      const numWeight = parseFloat(weight);
      if (useMetric) {
        // kg to lbs
        setWeight((numWeight * 2.20462).toFixed(1));
      } else {
        // lbs to kg
        setWeight((numWeight / 2.20462).toFixed(1));
      }
    }
    
    // Clear height fields when switching
    setHeight('');
    setHeightFeet('');
    setHeightInches('');
    
    setUseMetric(newUseMetric);
  };
  
  const goalOptions = [
    {
      id: 'cut' as const,
      title: 'Leaning Out',
      subtitle: 'Cutting',
      icon: TrendingDown,
      color: '#1C7C54',
      bgColor: '#1C7C5410',
      description: 'Lose fat while keeping muscle',
      info: {
        goal: 'Lose fat while keeping muscle.',
        calorieTarget: '10–20% below your TDEE.',
        proteinFocus: 'High (to prevent muscle loss).',
        trainingTip: 'Prioritize compound lifts + light cardio.',
        aiInsight: '"When cutting, consistency beats speed — slow, steady drops of 0.5–1 lb per week are ideal."',
        fullDescription: 'You\'ll eat slightly fewer calories than you burn to lose fat gradually while keeping strength. Expect slow, consistent progress — this phase is about precision and recovery.'
      }
    },
    {
      id: 'maintain' as const,
      title: 'Maintaining',
      subtitle: 'Stay Balanced',
      icon: Minus,
      color: '#A8E6CF',
      bgColor: '#A8E6CF20',
      description: 'Stay at your current level',
      info: {
        goal: 'Stay at your current weight and performance level.',
        calorieTarget: 'Around your TDEE (±0%).',
        proteinFocus: 'Moderate to high for recovery.',
        trainingTip: 'Use this phase to build consistency and improve strength.',
        aiInsight: '"Maintaining is a great time to improve form, mobility, and sustainable habits."',
        fullDescription: 'You\'ll stay around your current weight while keeping your body fueled for performance and consistency. Great for improving form, balance, and recovery.'
      }
    },
    {
      id: 'bulk' as const,
      title: 'Bulking',
      subtitle: 'Gaining Muscle',
      icon: TrendingUp,
      color: '#FFB6B9',
      bgColor: '#FFB6B920',
      description: 'Build lean muscle mass',
      info: {
        goal: 'Build lean muscle mass with minimal fat gain.',
        calorieTarget: '10–20% above TDEE.',
        proteinFocus: 'High; carbs help fuel workouts.',
        trainingTip: 'Focus on progressive overload — track lifts weekly.',
        aiInsight: '"Small surpluses add up. 250–300 extra calories daily is often all you need."',
        fullDescription: 'You\'ll eat slightly more calories to gain lean muscle mass. The focus is steady progress — small surpluses work best. Track your lifts and protein intake.'
      }
    }
  ];

  const activityLevels = [
    { value: '1.2', label: 'Sedentary (little or no exercise)' },
    { value: '1.375', label: 'Lightly active (1-3 days/week)' },
    { value: '1.55', label: 'Moderately active (3-5 days/week)' },
    { value: '1.725', label: 'Very active (6-7 days/week)' },
    { value: '1.9', label: 'Super active (physical job + training)' }
  ];

  const openInfoDialog = (goal: typeof goalOptions[0]) => {
    setInfoContent(goal);
    setInfoDialogOpen(true);
  };

  const calculateTDEE = () => {
    if (!age || !activityLevel) return null;
    
    // Check weight input based on system
    if (!weight) return null;
    
    // Check height input based on system
    if (useMetric && !height) return null;
    if (!useMetric && (!heightFeet || !heightInches)) return null;
    
    const a = parseFloat(age);
    const activityMultiplier = parseFloat(activityLevel);
    
    // Convert to metric if using imperial
    let weightKg: number;
    let heightCm: number;
    
    if (useMetric) {
      weightKg = parseFloat(weight);
      heightCm = parseFloat(height);
    } else {
      // Convert lbs to kg (1 lb = 0.453592 kg)
      weightKg = parseFloat(weight) * 0.453592;
      // Convert feet + inches to cm
      const totalInches = (parseFloat(heightFeet) * 12) + parseFloat(heightInches);
      heightCm = totalInches * 2.54;
    }
    
    // Mifflin-St Jeor Equation (uses kg and cm)
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * a) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * a) - 161;
    }
    
    return Math.round(bmr * activityMultiplier);
  };

  const calculateMacros = (calories: number, goalType: 'cut' | 'maintain' | 'bulk') => {
    // Convert weight to kg if using imperial
    let weightKg: number;
    if (useMetric) {
      weightKg = parseFloat(weight);
    } else {
      weightKg = parseFloat(weight) * 0.453592;
    }
    
    // Protein: 2.2g per kg for cut, 2.0g for maintain, 2.0g for bulk
    const proteinPerKg = goalType === 'cut' ? 2.2 : 2.0;
    const protein = Math.round(weightKg * proteinPerKg);
    const proteinCals = protein * 4;
    
    // Fat: 25% of calories for cut, 30% for maintain/bulk
    const fatPercentage = goalType === 'cut' ? 0.25 : 0.30;
    const fatCals = calories * fatPercentage;
    const fat = Math.round(fatCals / 9);
    
    // Carbs: remaining calories
    const carbCals = calories - proteinCals - fatCals;
    const carbs = Math.round(carbCals / 4);
    
    // Fiber: 14g per 1000 calories (FDA recommendation)
    const fiber = Math.round((calories / 1000) * 14);
    
    return { protein, carbs, fat, fiber };
  };

  const getTargetCalories = (tdee: number, goalType: 'cut' | 'maintain' | 'bulk') => {
    if (goalType === 'cut') return Math.round(tdee * 0.85); // 15% deficit
    if (goalType === 'bulk') return Math.round(tdee * 1.15); // 15% surplus
    return tdee; // maintain
  };



  const [showResults, setShowResults] = useState(false);
  const [calculatedTdee, setCalculatedTdee] = useState(0);
  const [calculatedTargetCalories, setCalculatedTargetCalories] = useState(0);
  const [calculatedMacros, setCalculatedMacros] = useState<{ protein: number; carbs: number; fat: number; fiber: number } | null>(null);

  const handleCalculate = () => {
    if (!selectedGoal || !age || !weight || !activityLevel) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check height based on unit system
    if (useMetric && !height) {
      toast.error('Please enter your height');
      return;
    }
    if (!useMetric && (!heightFeet || !heightInches)) {
      toast.error('Please enter your height');
      return;
    }

    const tdee = calculateTDEE();
    if (!tdee) {
      toast.error('Unable to calculate TDEE. Please check your inputs.');
      return;
    }

    const targetCalories = getTargetCalories(tdee, selectedGoal);
    const macros = calculateMacros(targetCalories, selectedGoal);

    setCalculatedTdee(tdee);
    setCalculatedTargetCalories(targetCalories);
    setCalculatedMacros(macros);
    setShowResults(true);
  };

  const handleSaveAsGoal = () => {
    if (!calculatedMacros) return;

    const goalData: GoalData = {
      age: parseFloat(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      activityLevel,
      goalType: selectedGoal!,
      tdee: calculatedTdee,
      targetCalories: calculatedTargetCalories,
      ...calculatedMacros
    };

    onSaveGoal(goalData);
    toast.success('Fitness goal saved successfully!');
    onBack();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8F4F2' }}>
      {/* Header */}
      <div className="bg-white shadow-sm" style={{ borderBottom: '1px solid #A8E6CF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: '#102A43' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Target className="w-8 h-8" style={{ color: '#1C7C54' }} />
            <h1 style={{ color: '#102A43' }}>Set Your Fitness Goal</h1>
          </div>
          <p className="text-lg" style={{ color: '#102A43', opacity: 0.8 }}>
            Let's personalize your plan based on your goals and lifestyle
          </p>
        </div>

        {/* Step 1: Choose Your Goal */}
        <div className="mb-10">
          <h2 className="mb-6" style={{ color: '#102A43' }}>
            🎯 Step 1: What's your current focus?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`relative bg-white rounded-lg p-6 text-left transition-all ${
                  selectedGoal === goal.id
                    ? 'ring-2 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                style={{
                  borderColor: selectedGoal === goal.id ? goal.color : 'transparent' // 👈 Fixed: changed ringColor to borderColor
                }}
              >
                {selectedGoal === goal.id && (
                  <div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: goal.color }}
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: goal.bgColor }}
                >
                  <goal.icon className="w-6 h-6" style={{ color: goal.color }} />
                </div>
                
                <h3 className="mb-1" style={{ color: '#102A43' }}>{goal.title}</h3>
                <p className="text-xs mb-3" style={{ color: goal.color }}>
                  {goal.subtitle}
                </p>
                <p className="text-sm mb-4" style={{ color: '#102A43', opacity: 0.7 }}>
                  {goal.description}
                </p>
                
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    openInfoDialog(goal);
                  }}
                  className="flex items-center gap-2 text-xs hover:underline cursor-pointer"
                  style={{ color: goal.color }}
                >
                  <Info className="w-4 h-4" />
                  <span>Learn more</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Personal Information */}
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="m-0" style={{ color: '#102A43' }}>
              📝 Step 2: Tell us about yourself
            </h2>
            
            {/* Unit System Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm transition-opacity" style={{ color: '#102A43', opacity: useMetric ? 0.5 : 1 }}>
                Imperial
              </span>
              <button
                onClick={handleUnitToggle}
                className="relative w-12 h-6 rounded-full transition-all hover:shadow-md"
                style={{ backgroundColor: useMetric ? '#1C7C54' : '#A8E6CF' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: useMetric ? 'translateX(26px)' : 'translateX(4px)' }}
                />
              </button>
              <span className="text-sm transition-opacity" style={{ color: '#102A43', opacity: useMetric ? 1 : 0.5 }}>
                Metric
              </span>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Birthday & Age Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="birthday" style={{ color: '#102A43' }}>
                  Birthday 🎂 <span className="text-xs opacity-60">(Optional)</span>
                </Label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="mt-2 w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none"
                  style={{ 
                    backgroundColor: '#FBEBD9',
                    borderColor: '#A8E6CF',
                    color: '#102A43'
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="age" style={{ color: '#102A43' }}>
                  Age (years)
                </Label>
                <input
                  id="age"
                  type="text"
                  list="ageOptions"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 25"
                  inputMode="numeric"
                  className="mt-2 w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none"
                  style={{ 
                    backgroundColor: '#FBEBD9',
                    borderColor: '#A8E6CF',
                    color: '#102A43'
                  }}
                />
                <datalist id="ageOptions">
                  {[...Array(88)].map((_, i) => (
                    <option key={i} value={i + 13} />
                  ))}
                </datalist>
              </div>
            </div>
            
            {/* Gender */}
            <div>
              <Label htmlFor="gender" style={{ color: '#102A43' }}>
                Gender
              </Label>
              <Select value={gender} onValueChange={(value: string) => setGender(value as 'male' | 'female')}> {/* 👈 Added type annotation */}
                <SelectTrigger className="mt-2 rounded-xl" style={{ backgroundColor: '#FBEBD9' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Height & Weight Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useMetric ? (
                <div>
                  <Label htmlFor="height" style={{ color: '#102A43' }}>
                    Height (cm)
                  </Label>
                  <input
                    id="height"
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 175"
                    className="mt-2 w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none no-spin"
                    style={{ 
                      backgroundColor: '#FBEBD9',
                      borderColor: '#A8E6CF',
                      color: '#102A43'
                    }}
                  />
                </div>
              ) : (
                <div>
                  <Label style={{ color: '#102A43' }}>
                    Height (ft / in)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="e.g., 5"
                      className="flex-1 px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none no-spin"
                      style={{ 
                        backgroundColor: '#FBEBD9',
                        borderColor: '#A8E6CF',
                        color: '#102A43'
                      }}
                    />
                    <span className="flex items-center text-sm" style={{ color: '#102A43', opacity: 0.6 }}>ft</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="e.g., 9"
                      className="flex-1 px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none no-spin"
                      style={{ 
                        backgroundColor: '#FBEBD9',
                        borderColor: '#A8E6CF',
                        color: '#102A43'
                      }}
                    />
                    <span className="flex items-center text-sm" style={{ color: '#102A43', opacity: 0.6 }}>in</span>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="weight" style={{ color: '#102A43' }}>
                  Weight ({useMetric ? 'kg' : 'lbs'})
                </Label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={useMetric ? 'e.g., 75' : 'e.g., 165'}
                  className="mt-2 w-full px-4 py-2.5 rounded-xl border transition-all focus:ring-2 focus:ring-offset-0 outline-none no-spin"
                  style={{ 
                    backgroundColor: '#FBEBD9',
                    borderColor: '#A8E6CF',
                    color: '#102A43'
                  }}
                />
              </div>
            </div>
            
            {/* Activity Level */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="activity" style={{ color: '#102A43' }}>
                  Activity Level
                </Label>
                <div className="group relative">
                  <Info className="w-4 h-4 cursor-help" style={{ color: '#1C7C54', opacity: 0.6 }} />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-3 rounded-lg shadow-lg text-xs bg-white border left-6 top-0" style={{ borderColor: '#A8E6CF', color: '#102A43' }}>
                    TDEE = Total Daily Energy Expenditure — an estimate of how many calories you burn daily including activity.
                  </div>
                </div>
              </div>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="rounded-xl" style={{ backgroundColor: '#FBEBD9' }}>
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleCalculate}
                className="px-8 py-3 rounded-xl transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                style={{ 
                  backgroundColor: '#1C7C54',
                  color: 'white'
                }}
              >
                <Calculator className="w-5 h-5" />
                Calculate My Plan
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Results */}
        {showResults && calculatedMacros && (
          <div className="mb-10">
            <h2 className="mb-6" style={{ color: '#102A43' }}>
              🎉 Step 3: Your Personalized Plan
            </h2>
            
            {/* Summary Card */}
            <div 
              className="rounded-xl p-6 sm:p-8 shadow-sm mb-6"
              style={{ 
                backgroundColor: goalOptions.find(g => g.id === selectedGoal)?.bgColor,
                border: `2px solid ${goalOptions.find(g => g.id === selectedGoal)?.color}`
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6" style={{ color: goalOptions.find(g => g.id === selectedGoal)?.color }} />
                <h3 className="m-0" style={{ color: '#102A43' }}>
                  Goal: {goalOptions.find(g => g.id === selectedGoal)?.title}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5" style={{ color: '#1C7C54' }} />
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                      Your TDEE
                    </span>
                  </div>
                  <p style={{ color: '#102A43' }}>
                    {calculatedTdee.toLocaleString()} cal/day
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5" style={{ color: goalOptions.find(g => g.id === selectedGoal)?.color }} />
                    <span className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                      Daily Target
                    </span>
                  </div>
                  <p style={{ color: '#102A43' }}>
                    {calculatedTargetCalories.toLocaleString()} cal/day
                  </p>
                </div>
              </div>
            </div>

            {/* Macro Breakdown */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm mb-6">
              <h3 className="mb-6" style={{ color: '#102A43' }}>Your Daily Macros</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#1C7C5420' }}
                  >
                    <Flame className="w-8 h-8" style={{ color: '#1C7C54' }} />
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Protein</p>
                  <p style={{ color: '#102A43' }}>{calculatedMacros.protein}g</p>
                </div>
                
                <div className="text-center">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#FFB6B920' }}
                  >
                    <Activity className="w-8 h-8" style={{ color: '#FFB6B9' }} />
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Carbs</p>
                  <p style={{ color: '#102A43' }}>{calculatedMacros.carbs}g</p>
                </div>
                
                <div className="text-center">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#A8E6CF20' }}
                  >
                    <Dumbbell className="w-8 h-8" style={{ color: '#A8E6CF' }} />
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#102A43', opacity: 0.7 }}>Fat</p>
                  <p style={{ color: '#102A43' }}>{calculatedMacros.fat}g</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCalculatedTdee(0);
                  setCalculatedTargetCalories(0);
                  setCalculatedMacros(null);
                }}
                className="px-6 py-3 rounded-xl border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', color: '#102A43' }}
              >
                Recalculate
              </button>
              <button
                onClick={handleSaveAsGoal}
                className="px-8 py-3 rounded-xl text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1C7C54' }}
              >
                <Target className="w-5 h-5" />
                Set as New Goal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: infoContent?.bgColor }}
              >
                {infoContent?.icon && <infoContent.icon className="w-6 h-6" style={{ color: infoContent.color }} />}
              </div>
              <DialogTitle style={{ color: '#102A43' }}>
                {infoContent?.title} - {infoContent?.subtitle}
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              <div style={{ color: '#102A43', opacity: 0.85 }}>
                <p className="mb-4">{infoContent?.info.fullDescription}</p>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Goal:</strong> {infoContent?.info.goal}
                  </div>
                  <div>
                    <strong>Calorie Target:</strong> {infoContent?.info.calorieTarget}
                  </div>
                  <div>
                    <strong>Protein Focus:</strong> {infoContent?.info.proteinFocus}
                  </div>
                  <div>
                    <strong>Training Tip:</strong> {infoContent?.info.trainingTip}
                  </div>
                  <div 
                    className="p-4 rounded-lg mt-4"
                    style={{ backgroundColor: '#1C7C5410', borderLeft: `3px solid ${infoContent?.color}` }}
                  >
                    <p className="text-xs italic">
                      💡 AI Insight: {infoContent?.info.aiInsight}
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}