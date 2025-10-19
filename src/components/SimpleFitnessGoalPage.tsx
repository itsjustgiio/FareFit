import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, Minus, TrendingUp, Check, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import { Footer } from './Footer';
import { toast } from 'sonner';
import { PlanGeneratedModal } from './PlanGeneratedModal';
import { generateUserPlan } from '../services/aiPlanGenerator';
import type { UserPlan, PlanModalStatus } from '../types/planTypes';
import { 
  getUnitPreference, 
  setUnitPreference, 
  lbsToKg, 
  kgToLbs, 
  feetInchesToCm, 
  cmToFeetInches,
  formatWeightWithBoth,
  formatHeightWithBoth,
  type UnitSystem 
} from '../utils/unitConversions';
import { getUserProfile, updateFitnessGoalsBatch } from '../userService';
import { getAuth } from 'firebase/auth';

interface UserProfile {
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  gender?: 'male' | 'female';
  activityLevel?: string;
  goalType?: 'cut' | 'maintain' | 'bulk';
}

interface GoalData {
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
  fiber: number;
}

interface SimpleFitnessGoalPageProps {
  onBack: () => void;
  onSaveGoal: (goalData: GoalData) => void;
  onNavigate: (page: string) => void;
  onFeedbackClick: () => void;
  onPlanGenerated?: (plan: any) => void;
  userId?: string;
  userProfile?: UserProfile;
}

export function SimpleFitnessGoalPage({ 
  onBack, 
  onSaveGoal, 
  onNavigate, 
  onFeedbackClick, 
  onPlanGenerated, 
  userId, 
  userProfile 
}: SimpleFitnessGoalPageProps) {
  const [selectedGoal, setSelectedGoal] = useState<'cut' | 'maintain' | 'bulk' | null>(
    userProfile?.goalType || null
  );
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Unit system state
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => getUnitPreference());
  
  // Imperial input states
  const [weightLbs, setWeightLbs] = useState('');
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);
  
  // Metric input states (keep existing)
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // Helper function to convert activity level string to numeric value
  const getActivityLevelValue = (activityString?: string) => {
    if (!activityString) return '1.4';
    
    // Map string values to numeric values
    const activityMap: { [key: string]: string } = {
      'sedentary': '1.2',
      'lightly-active': '1.3', 
      'moderately-active': '1.4',
      'very-active': '1.55',
      'super-active': '1.7'
    };
    
    // If it's already a numeric string, return it
    if (activityMap[activityString]) {
      return activityMap[activityString];
    }
    
    // If it's already numeric, return it
    if (activityString.match(/^\d+\.?\d*$/)) {
      return activityString;
    }
    
    // Default fallback
    return '1.4';
  };
  
  const [activityLevel, setActivityLevel] = useState(() => 
    getActivityLevelValue(userProfile?.activityLevel) || '1.4'
  );
  
  // Debug userProfile changes
  useEffect(() => {
    console.log('🔄 SimpleFitnessGoalPage - userProfile prop changed:', userProfile);
  }, [userProfile]);

  // Fetch profile if missing
  useEffect(() => {
    const fetchProfileIfMissing = async () => {
      if (!userProfile && userId) {
        console.log('🔍 User profile is missing, attempting to fetch directly...');
        try {
          const profile = await getUserProfile(userId);
          console.log('👤 Directly fetched profile:', profile);
          // Note: This won't update the parent state, but we can use it locally
        } catch (error) {
          console.error('❌ Failed to fetch profile directly:', error);
        }
      }
    };
    
    fetchProfileIfMissing();
  }, [userProfile, userId]);

  // Initialize values based on user profile and unit system
  useEffect(() => {
    console.log('🔧 Initializing form values from userProfile:', userProfile);
    
    if (userProfile?.weight) {
      if (unitSystem === 'imperial') {
        const convertedWeight = Math.round(kgToLbs(userProfile.weight)).toString();
        console.log(`⚖️ Setting weight - kg: ${userProfile.weight} -> lbs: ${convertedWeight}`);
        setWeightLbs(convertedWeight);
      } else {
        console.log(`⚖️ Setting weight - kg: ${userProfile.weight}`);
        setWeight(userProfile.weight.toString());
      }
    }
    
    if (userProfile?.height) {
      if (unitSystem === 'imperial') {
        const { feet: f, inches: i } = cmToFeetInches(userProfile.height);
        console.log(`📏 Setting height - cm: ${userProfile.height} -> ${f}'${i}"`);
        setFeet(f);
        setInches(i);
      } else {
        console.log(`📏 Setting height - cm: ${userProfile.height}`);
        setHeight(userProfile.height.toString());
      }
    }
    
    if (userProfile?.activityLevel) {
      const mappedActivityLevel = getActivityLevelValue(userProfile.activityLevel);
      console.log(`🏃 Setting activity level: ${userProfile.activityLevel} -> ${mappedActivityLevel}`);
      setActivityLevel(mappedActivityLevel);
    }
  }, [userProfile, unitSystem]);
  
  // AI Plan Generation State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalStatus, setPlanModalStatus] = useState<PlanModalStatus>('loading');
  const [generatedPlan, setGeneratedPlan] = useState<UserPlan | null>(null);
  const [planError, setPlanError] = useState<string>('');

  // Target Macros State (Approach 2 - Batch Updates)
  const [targetMacros, setTargetMacros] = useState({
    target_calories: 2000,
    target_weight: 150,
    protein_target: 150,
    carbs_target: 200,
    fats_target: 50,
    fiber_target: 25,
  });
  const [isUpdatingMacros, setIsUpdatingMacros] = useState(false);

  // Batch update function using Approach 2
  const updateUserFitnessGoalsBatch = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }

    setIsUpdatingMacros(true);
    try {
      // Update all fields in a single Firestore operation
      await updateFitnessGoalsBatch(user.uid, targetMacros);
      console.log("✅ All fitness goals updated in batch!");
      toast.success('Macros updated successfully!');
    } catch (error) {
      console.error("❌ Error updating fitness goals:", error);
      toast.error('Failed to update macros');
    } finally {
      setIsUpdatingMacros(false);
    }
  };

  // Manual macro update function
  const handleManualMacroUpdate = (field: string, value: number) => {
    setTargetMacros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Test AI macro generation (without full plan)
  const handleGenerateTestMacros = async () => {
    if (!userProfile?.age || !userProfile?.gender) {
      toast.error('Profile data missing for macro generation');
      return;
    }

    setIsUpdatingMacros(true);
    try {
      // Simple macro calculation for testing
      const weight = getCurrentWeightKg();
      const height = getCurrentHeightCm();
      
      // Basic TDEE calculation (you can make this more sophisticated)
      const bmr = userProfile.gender === 'male' 
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * userProfile.age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * userProfile.age);
      
      const activityMultiplier = parseFloat(activityLevel);
      const tdee = Math.round(bmr * activityMultiplier);
      
      // Calculate macros based on goal
      let calories = tdee;
      if (selectedGoal === 'cut') calories = Math.round(tdee * 0.85);
      if (selectedGoal === 'bulk') calories = Math.round(tdee * 1.15);
      
      const testMacros = {
        target_calories: calories,
        target_weight: weight,
        protein_target: Math.round(weight * 2.2), // 1g per lb
        carbs_target: Math.round(calories * 0.4 / 4), // 40% of calories
        fats_target: Math.round(calories * 0.3 / 9), // 30% of calories  
        fiber_target: Math.round(calories / 100), // 1g per 100 calories
      };
      
      console.log('🧪 Test generated macros:', testMacros);
      setTargetMacros(testMacros);
      
      // Save to Firestore
      await updateFitnessGoalsBatch(userId!, testMacros);
      toast.success('Test macros generated and saved!');
      
    } catch (error) {
      console.error("❌ Error generating test macros:", error);
      toast.error('Failed to generate test macros');
    } finally {
      setIsUpdatingMacros(false);
    }
  };

  const goalOptions = [
    {
      id: 'cut' as const,
      title: 'Cutting',
      subtitle: 'Lose fat, keep muscle',
      icon: TrendingDown,
      color: '#1C7C54',
      bgColor: '#1C7C5410',
    },
    {
      id: 'maintain' as const,
      title: 'Maintaining',
      subtitle: 'Stay at current level',
      icon: Minus,
      color: '#A8E6CF',
      bgColor: '#A8E6CF20',
    },
    {
      id: 'bulk' as const,
      title: 'Bulking',
      subtitle: 'Build muscle mass',
      icon: TrendingUp,
      color: '#FFB6B9',
      bgColor: '#FFB6B920',
    }
  ];

  const activityLevels = [
    { value: '1.2', label: 'Sedentary (desk job, no exercise)' },
    { value: '1.3', label: 'Lightly active (1-3 workouts/week)' },
    { value: '1.4', label: 'Moderately active (3-5 workouts/week)' },
    { value: '1.55', label: 'Very active (6-7 workouts/week)' },
    { value: '1.7', label: 'Super active (physical job + daily training)' }
  ];

  const formatHeight = (cm: number) => {
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}" (${cm}cm)`;
  };

  const formatWeight = (kg: number) => {
    const lbs = Math.round(kg * 2.20462);
    return `${kg}kg (${lbs}lbs)`;
  };

  const hasProfileData = userProfile?.age && userProfile?.weight && userProfile?.height && userProfile?.gender;

  // Get current values in metric for calculations
  const getCurrentWeightKg = () => {
    if (unitSystem === 'imperial') {
      const weightValue = parseFloat(weightLbs);
      const convertedWeight = weightValue ? lbsToKg(weightValue) : userProfile?.weight || 0;
      console.log('🏋️ Weight conversion - lbs:', weightLbs, 'parsed:', weightValue, 'converted to kg:', convertedWeight);
      return convertedWeight;
    } else {
      const weightValue = parseFloat(weight) || userProfile?.weight || 0;
      console.log('🏋️ Weight (metric) - input:', weight, 'profile:', userProfile?.weight, 'final:', weightValue);
      return weightValue;
    }
  };

  const getCurrentHeightCm = () => {
    if (unitSystem === 'imperial') {
      const convertedHeight = feet && inches >= 0 ? feetInchesToCm(feet, inches) : userProfile?.height || 0;
      console.log('📏 Height conversion - feet:', feet, 'inches:', inches, 'converted to cm:', convertedHeight);
      return convertedHeight;
    } else {
      const heightValue = parseFloat(height) || userProfile?.height || 0;
      console.log('📏 Height (metric) - input:', height, 'profile:', userProfile?.height, 'final:', heightValue);
      return heightValue;
    }
  };

  const handleUnitToggle = () => {
    const newUnit = unitSystem === 'imperial' ? 'metric' : 'imperial';
    setUnitSystem(newUnit);
    setUnitPreference(newUnit);
    
    // Convert current input values
    if (newUnit === 'metric') {
      // Converting from imperial to metric
      if (weightLbs) {
        setWeight(lbsToKg(parseFloat(weightLbs)).toFixed(1));
      }
      if (feet && inches >= 0) {
        setHeight(Math.round(feetInchesToCm(feet, inches)).toString());
      }
    } else {
      // Converting from metric to imperial
      if (weight) {
        setWeightLbs(Math.round(kgToLbs(parseFloat(weight))).toString());
      }
      if (height) {
        const { feet: f, inches: i } = cmToFeetInches(parseFloat(height));
        setFeet(f);
        setInches(i);
      }
    }
  };

  const handleGenerateAIPlan = async () => {
    console.log('🎯 Starting plan generation...');
    console.log('User ID:', userId);
    console.log('Selected goal:', selectedGoal);
    console.log('User profile:', userProfile);
    console.log('Unit system:', unitSystem);
    console.log('Imperial inputs - weightLbs:', weightLbs, 'feet:', feet, 'inches:', inches);
    console.log('Metric inputs - weight:', weight, 'height:', height);
    
    if (!userId) {
      toast.error('User not found. Please try logging in again.');
      return;
    }

    if (!selectedGoal) {
      toast.error('Please select a fitness goal.');
      return;
    }

    // Validate required data
    const currentWeight = getCurrentWeightKg();
    const currentHeight = getCurrentHeightCm();
    const currentAge = userProfile?.age;
    const currentGender = userProfile?.gender;

    console.log('📊 Calculated values:');
    console.log('Current weight (kg):', currentWeight);
    console.log('Current height (cm):', currentHeight);
    console.log('Current age:', currentAge);
    console.log('Current gender:', currentGender);

    if (!currentAge) {
      console.log('❌ Age validation failed - age:', currentAge);
      console.log('🔍 User profile is:', userProfile);
      toast.error('Age is missing from your profile. Please complete your profile in Account Settings.');
      return;
    }

    if (!currentGender) {
      console.log('❌ Gender validation failed - gender:', currentGender);
      console.log('🔍 User profile is:', userProfile);
      toast.error('Gender is missing from your profile. Please complete your profile in Account Settings.');
      return;
    }

    if (!currentWeight || currentWeight <= 0) {
      console.log('❌ Weight validation failed');
      toast.error('Weight is required. Please enter your current weight.');
      return;
    }

    if (!currentHeight || currentHeight <= 0) {
      console.log('❌ Height validation failed');
      toast.error('Height is required. Please enter your current height.');
      return;
    }

    try {
      setPlanModalStatus('loading');
      setPlanModalOpen(true);

      const userData = {
        age: currentAge,
        weight: currentWeight,
        height: currentHeight,
        gender: currentGender,
        activityLevel: activityLevel,
        goalType: selectedGoal
      };

      console.log('🤖 Generating AI plan with data:', userData);
      
      // Add a timeout to catch if AI generation gets stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plan generation timeout after 30 seconds')), 30000);
      });
      
      const response = await Promise.race([
        generateUserPlan(userId, userData, { updateFitnessGoals: true }),
        timeoutPromise
      ]) as any;

      if (response.success && response.plan) {
        setPlanModalOpen(false);
        
        // Save goal data
        const goalData: GoalData = {
          ...userData,
          tdee: response.plan.tdee,
          targetCalories: response.plan.targetCalories,
          protein: response.plan.macros.protein,
          carbs: response.plan.macros.carbs,
          fat: response.plan.macros.fat,
          fiber: response.plan.macros.fiber
        };
        
        // Update target macros state with AI-generated values
        const aiGeneratedMacros = {
          target_calories: response.plan.targetCalories,
          target_weight: userData.weight, // Keep current weight as target for now
          protein_target: response.plan.macros.protein,
          carbs_target: response.plan.macros.carbs,
          fats_target: response.plan.macros.fat,
          fiber_target: response.plan.macros.fiber,
        };
        
        console.log('🎯 AI generated macros:', aiGeneratedMacros);
        setTargetMacros(aiGeneratedMacros);
        
        // Macros are automatically saved to Firestore by the plan generator
        toast.success('AI plan and macros saved successfully!');
        
        onSaveGoal(goalData);
        onBack();
        
        setTimeout(() => {
          onPlanGenerated?.(response.plan);
        }, 100);
      } else {
        const errorMessage = 'Plan generation failed. Please try again.';
        setPlanError(errorMessage);
        setPlanModalStatus('error');
      }
    } catch (error) {
      console.error('❌ Plan generation error:', error);
      setPlanError('An unexpected error occurred while generating your plan.');
      setPlanModalStatus('error');
    }
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3" style={{ color: '#102A43' }}>
            Set Your Fitness Goal
          </h1>
          <p className="text-lg mb-4" style={{ color: '#102A43', opacity: 0.8 }}>
            Choose your goal and we'll create a personalized plan
          </p>
          
          {/* Unit Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${unitSystem === 'metric' ? 'font-semibold' : 'opacity-60'}`}>
              Metric (kg, cm)
            </span>
            <button
              onClick={handleUnitToggle}
              className="p-1 hover:opacity-70 transition-opacity"
              style={{ color: '#1C7C54' }}
            >
              {unitSystem === 'imperial' ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
            <span className={`text-sm ${unitSystem === 'imperial' ? 'font-semibold' : 'opacity-60'}`}>
              Imperial (lbs, ft/in)
            </span>
          </div>
        </div>

        {/* Profile Summary */}
        {hasProfileData ? (
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#102A43' }}>
                Your Profile
              </h3>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="flex items-center gap-2 text-sm px-3 py-1 rounded-md transition-colors"
                style={{ 
                  color: '#1C7C54',
                  backgroundColor: editingProfile ? '#1C7C5415' : 'transparent'
                }}
              >
                <Edit3 className="w-4 h-4" />
                {editingProfile ? 'Done' : 'Update'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="opacity-70">Age:</span>
                <div className="font-medium">{userProfile?.age} years</div>
              </div>
              <div>
                <span className="opacity-70">Gender:</span>
                <div className="font-medium capitalize">{userProfile?.gender}</div>
              </div>
              <div>
                <span className="opacity-70">Weight:</span>
                {editingProfile ? (
                  unitSystem === 'imperial' ? (
                    <input
                      type="number"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(e.target.value)}
                      className="w-full mt-1 p-1 border rounded text-sm"
                      placeholder="lbs"
                    />
                  ) : (
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full mt-1 p-1 border rounded text-sm"
                      placeholder="kg"
                    />
                  )
                ) : (
                  <div className="font-medium">{formatWeightWithBoth(userProfile?.weight || 0)}</div>
                )}
              </div>
              <div>
                <span className="opacity-70">Height:</span>
                {editingProfile ? (
                  unitSystem === 'imperial' ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={feet}
                        onChange={(e) => setFeet(parseInt(e.target.value) || 0)}
                        className="w-12 mt-1 p-1 border rounded text-sm"
                        placeholder="ft"
                        min="3"
                        max="8"
                      />
                      <span className="text-xs self-end pb-1">'</span>
                      <input
                        type="number"
                        value={inches === 0 ? '' : inches}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setInches(0);
                          } else {
                            setInches(parseInt(value) || 0);
                          }
                        }}
                        className="w-12 mt-1 p-1 border rounded text-sm"
                        placeholder="0"
                        min="0"
                        max="11"
                      />
                      <span className="text-xs self-end pb-1">"</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full mt-1 p-1 border rounded text-sm"
                      placeholder="cm"
                    />
                  )
                ) : (
                  <div className="font-medium">{formatHeightWithBoth(userProfile?.height || 0)}</div>
                )}
              </div>
            </div>

            {/* Activity Level */}
            <div className="mt-4">
              <label className="block text-sm opacity-70 mb-2">Activity Level:</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
                disabled={!editingProfile}
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          // Show form for missing profile data
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border-l-4" style={{ borderColor: '#FFB6B9' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#102A43' }}>
              Complete Your Profile
            </h3>
            <p className="text-sm mb-4" style={{ color: '#102A43', opacity: 0.7 }}>
              We need some basic information to generate your personalized plan.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm opacity-70 mb-2">
                  Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'}):
                </label>
                {unitSystem === 'imperial' ? (
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your weight in lbs"
                  />
                ) : (
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your weight in kg"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm opacity-70 mb-2">
                  Height ({unitSystem === 'imperial' ? 'ft/in' : 'cm'}):
                </label>
                {unitSystem === 'imperial' ? (
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={feet}
                        onChange={(e) => setFeet(parseInt(e.target.value) || 0)}
                        className="w-16 p-2 border rounded-md"
                        placeholder="ft"
                        min="3"
                        max="8"
                      />
                      <span className="text-sm opacity-70">ft</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={inches === 0 ? '' : inches}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setInches(0);
                          } else {
                            setInches(parseInt(value) || 0);
                          }
                        }}
                        className="w-16 p-2 border rounded-md"
                        placeholder="0"
                        min="0"
                        max="11"
                      />
                      <span className="text-sm opacity-70">in</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your height in cm"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm opacity-70 mb-2">Activity Level:</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Macro Management Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Target Macros</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateTestMacros}
                    disabled={isUpdatingMacros}
                    className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isUpdatingMacros ? 'Generating...' : '🧪 Test Generate'}
                  </button>
                  <button
                    onClick={updateUserFitnessGoalsBatch}
                    disabled={isUpdatingMacros}
                    className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isUpdatingMacros ? 'Saving...' : '💾 Save Macros'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(targetMacros).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {key.replace('_', ' ').replace('target', '').trim()}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleManualMacroUpdate(key, Number(e.target.value))}
                      className="w-full p-1 border rounded text-xs"
                      disabled={isUpdatingMacros}
                    />
                  </div>
                ))}
              </div>
              
              {isUpdatingMacros && (
                <div className="mt-2 text-xs text-blue-600">
                  ⏳ Updating macros...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Loading/Missing Alert */}
        {!userProfile && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-md">
            <div className="flex items-center justify-between">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Loading Profile...</strong> We're fetching your profile information to calculate accurate calorie targets.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (userId) {
                    console.log('🔄 Manual profile fetch triggered');
                    try {
                      const profile = await getUserProfile(userId);
                      console.log('👤 Manual fetch result:', profile);
                      toast.success('Profile loaded! Please try generating your plan again.');
                    } catch (error) {
                      console.error('❌ Manual fetch failed:', error);
                      toast.error('Failed to load profile. Please refresh the page.');
                    }
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Reload Profile
              </button>
            </div>
          </div>
        )}

        {/* Missing Age/Gender Alert */}
        {userProfile && (!userProfile?.age || !userProfile?.gender) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Missing Profile Information:</strong> We need your age and gender to calculate accurate calorie targets. 
                  <br />
                  <span className="mt-2 inline-block">
                    Please complete your profile in 
                    <button 
                      onClick={() => onNavigate('account')} 
                      className="ml-1 text-yellow-800 underline hover:no-underline"
                    >
                      Account Settings
                    </button> 
                    or refresh this page.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Goal Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6 text-center" style={{ color: '#102A43' }}>
            What's your current focus?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`relative bg-white rounded-lg p-6 text-center transition-all hover:shadow-md ${
                  selectedGoal === goal.id ? 'ring-2 shadow-lg' : ''
                }`}
                style={{
                  borderColor: selectedGoal === goal.id ? goal.color : 'transparent',
                  backgroundColor: selectedGoal === goal.id ? goal.bgColor : 'white'
                }}
              >
                {selectedGoal === goal.id && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5" style={{ color: goal.color }} />
                  </div>
                )}
                
                <goal.icon 
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: goal.color }}
                />
                
                <h4 className="font-semibold mb-2" style={{ color: '#102A43' }}>
                  {goal.title}
                </h4>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
                  {goal.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerateAIPlan}
            disabled={!selectedGoal}
            className="px-8 py-4 rounded-lg font-semibold text-white text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ 
              backgroundColor: selectedGoal ? '#1C7C54' : '#cccccc'
            }}
          >
            🎯 Generate My Personalized Plan
          </button>
        </div>
      </div>

      {/* Plan Generated Modal */}
      <PlanGeneratedModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        status={planModalStatus}
        plan={generatedPlan}
        onContinueToDashboard={() => {
          setPlanModalOpen(false);
          onBack();
        }}
        error={planError}
      />

      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}