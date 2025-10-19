import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Star, Calendar, Ruler, Weight, Bell, CheckCircle2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import logoImage from 'figma:asset/77bf03e5d71328d3253fb9c4f7bef47edf94924a.png';
import { updateFitnessGoals } from '../userService';
import { getAuth } from 'firebase/auth';
import { validateBirthDate, getMaxBirthDate, getMinBirthDate } from '../utils/validation';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  sex: 'male' | 'female' | null;
  birthday: string | null; // made birthday from Date to string
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lb';
  activityLevel: string | null;
  goal: 'lose' | 'maintain' | 'gain' | null;
  notificationsEnabled: boolean;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    sex: null,
    birthday: null,
    height: 0,
    heightUnit: 'cm', // adbhabhjd
    weight: 0, // Stored in kg (155 lb = ~70 kg)
    weightUnit: 'lb',
    activityLevel: null,
    goal: null,
    notificationsEnabled: true,
  });

  const totalSteps = 9; // Including final confirmation

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData({ ...data, ...updates });
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return data.sex !== null;
      case 2:
        return data.birthday !== null;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return data.activityLevel !== null;
      case 6:
        return data.goal !== null;
      case 7:
        return true;
      case 8:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'white' }}>
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        {currentStep > 0 && currentStep < totalSteps - 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={prevStep}
                className="p-2 rounded-full hover:bg-white transition-colors"
                style={{ color: '#1C7C54' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                {currentStep} of {totalSteps - 2}
              </p>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#A8E6CF' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(currentStep / (totalSteps - 2)) * 100}%`,
                  backgroundColor: '#1C7C54',
                }}
              />
            </div>
          </div>
        )}

        {/* Screen Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <WelcomeScreen key="welcome" onContinue={nextStep} />
          )}
          {currentStep === 1 && (
            <SexScreen
              key="sex"
              value={data.sex}
              onChange={(sex) => updateData({ sex })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 2 && (
            <BirthdayScreen
              value={data.birthday}
              onChange={(birthday) => updateData({ birthday })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 3 && (
            <HeightScreen
              key="height"
              height={data.height}
              unit={data.heightUnit}
              onHeightChange={(height) => updateData({ height })}
              onUnitChange={(heightUnit) => updateData({ heightUnit })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 4 && (
            <WeightScreen
              key="weight"
              weight={data.weight}
              unit={data.weightUnit}
              onWeightChange={(weight) => updateData({ weight })}
              onUnitChange={(weightUnit) => updateData({ weightUnit })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 5 && (
            <ActivityScreen
              key="activity"
              value={data.activityLevel}
              onChange={(activityLevel) => updateData({ activityLevel })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 6 && (
            <GoalsScreen
              key="goals"
              value={data.goal}
              onChange={(goal) => updateData({ goal })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 7 && (
            <NotificationsScreen
              key="notifications"
              value={data.notificationsEnabled}
              onChange={(notificationsEnabled) => updateData({ notificationsEnabled })}
              onContinue={nextStep}
            />
          )}
          {currentStep === 8 && (
            <FinalScreen key="final" onContinue={nextStep} />
          )}
        </AnimatePresence>

        {/* Continue Button (for screens without built-in button) */}
        {currentStep > 0 && currentStep !== 7 && currentStep !== 8 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={nextStep}
            disabled={!canContinue()}
            className="w-full py-4 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6 flex items-center justify-center"
            style={{ backgroundColor: '#1C7C54' }}
          >
            Continue
          </motion.button>
        )}
      </div>
    </div>
  );
}

// Welcome Screen
function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const testimonials = [
    { name: 'Sarah M.', text: 'Lost 15 lbs in 2 months!', rating: 5 },
    { name: 'Mike T.', text: 'Best fitness tracker I\'ve used', rating: 5 },
    { name: 'Emma L.', text: 'The AI coach is incredible', rating: 5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl text-center"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <div className="mb-6">
        <img 
          src={logoImage} 
          alt="FareFit Logo" 
          className="w-32 h-32 object-contain mx-auto mb-4"
        />
        <p className="text-sm mb-2" style={{ color: '#1C7C54' }}>
          Trusted by millions worldwide
        </p>
        <h1 className="text-3xl mb-3" style={{ color: '#102A43' }}>
          Welcome to FareFit
        </h1>
        <p className="text-lg" style={{ color: '#102A43', opacity: 0.7 }}>
          Let's personalize your experience
        </p>
      </div>

      {/* Testimonials */}
      <div className="space-y-3 mb-8">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="p-4 rounded-xl text-left"
            style={{ backgroundColor: '#E8F4F2' }}
          >
            <div className="flex items-center gap-1 mb-2">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-current"
                  style={{ color: '#FFB6B9' }}
                />
              ))}
            </div>
            <p className="text-sm mb-1" style={{ color: '#102A43' }}>
              "{testimonial.text}"
            </p>
            <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
              — {testimonial.name}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
        style={{ backgroundColor: '#1C7C54' }}
      >
        Continue
      </button>

      <p className="text-xs mt-4" style={{ color: '#102A43', opacity: 0.5 }}>
        Takes about 2 minutes
      </p>
    </motion.div>
  );
}

// Sex at Birth Screen
function SexScreen({
  value,
  onChange,
  onContinue,
}: {
  value: 'male' | 'female' | null;
  onChange: (sex: 'male' | 'female') => void;
  onContinue: () => void;
}) {

  const auth = getAuth();

  const handleSelectSex = async (sex: 'male' | 'female') => {
    try {
      onChange(sex); // update local state
      const user = auth.currentUser;

      if (user) {
        // immediately store gender in Firebase
        await updateFitnessGoals(user.uid, "gender", sex);
        console.log(`User gender set to ${sex} in Firebase`);
      }

      setTimeout(onContinue, 300);
    } catch (error) {
      console.error("Error updating user gender:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <h2 className="text-2xl mb-3 text-center" style={{ color: '#102A43' }}>
        What is your assigned sex at birth?
      </h2>
      <p className="text-center mb-8" style={{ color: '#102A43', opacity: 0.6 }}>
        This helps us calculate accurate calorie and macro targets
      </p>

      <div className="space-y-4">
        <button
          onClick={() => {
            onChange('male');
            handleSelectSex('male');
            setTimeout(onContinue, 300);
          }}
          className="w-full py-5 rounded-2xl border-2 transition-all flex items-center justify-center"
          style={{
            backgroundColor: value === 'male' ? '#A8E6CF' : 'white',
            borderColor: value === 'male' ? '#1C7C54' : '#A8E6CF',
            color: '#102A43',
          }}
        >
          Male
        </button>
        <button
          onClick={() => {
            onChange('female');
            handleSelectSex('female')
            setTimeout(onContinue, 300);
          }}
          className="w-full py-5 rounded-2xl border-2 transition-all flex items-center justify-center"
          style={{
            backgroundColor: value === 'female' ? '#A8E6CF' : 'white',
            borderColor: value === 'female' ? '#1C7C54' : '#A8E6CF',
            color: '#102A43',
          }}
        >
          Female
        </button>
      </div>
    </motion.div>
  );
}

// Birthday Screen
function BirthdayScreen({
  value,
  onChange,
  onContinue,
}: {
  value: string | null;
  onChange: (birthday: string) => void;
  onContinue: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  const handleBirthdaySelect = async (birthday: string) => {
    // Validate the birth date
    const validationError = validateBirthDate(birthday);
    setError(validationError);
    
    if (validationError) {
      // Don't proceed if validation fails
      return;
    }

    onChange(birthday); // update local state
    setLoading(true);

    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        // Save the birthday in Firestore under this user's record
        await updateFitnessGoals(user.uid, "birthday", birthday);
        await updateFitnessGoals(user.uid, "age", age);
        console.log(`Birthday set to ${birthday} for user ${user.uid}`);
        console.log(`Age set to ${age} for user ${user.uid}`);
      }

      setTimeout(onContinue, 300); // move to next onboarding step
    } catch (error) {
      console.error("Error updating birthday:", error);
      setError("Failed to save birth date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if current value is valid
  const isValidDate = value && !validateBirthDate(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: "#E8F4F2" }}
    >
      <h2 className="text-2xl mb-3 text-center" style={{ color: "#102A43" }}>
        When were you born?
      </h2>
      <p className="text-center mb-2" style={{ color: "#102A43", opacity: 0.6 }}>
        This helps calculate your age for your calorie and fitness targets
      </p>
      <p className="text-center mb-8 text-sm" style={{ color: "#102A43", opacity: 0.5 }}>
        You must be at least 13 years old to use this app
      </p>

      <div className="flex flex-col items-center space-y-4">
        <input
          id="birthdate-input"
          type="date"
          value={value || ""}
          min={getMinBirthDate()} // 120 years ago
          max={getMaxBirthDate()} // Today
          onChange={(e) => handleBirthdaySelect(e.target.value)}
          className={`border rounded-xl px-4 py-3 text-center ${
            error ? 'border-red-500' : 'border-[#A8E6CF]'
          }`}
          style={{ color: "#102A43" }}
        />

        {/* Error message display */}
        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 px-4 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <button
          onClick={onContinue}
          disabled={!isValidDate || loading}
          className={`mt-6 px-8 py-3 rounded-xl text-white transition-all ${
            !isValidDate || loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#1C7C54] hover:bg-[#156B47]'
          }`}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </motion.div>
  );
}

// Height Screen
function HeightScreen({
  height,
  unit,
  onHeightChange,
  onUnitChange,
  onContinue,
}: {
  height: number; // always stored in cm
  unit: 'cm' | 'ft';
  onHeightChange: (height: number) => void;
  onUnitChange: (unit: 'cm' | 'ft') => void;
  onContinue: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  // Convert cm to feet & inches
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  // Display value based on unit
  const displayHeight = unit === 'cm' ? Math.round(height) : cmToFeetInches(height);

  // Convert feet/inches value from slider to cm
  const convertToCm = (val: number) => (unit === 'cm' ? val : Math.round(val * 30.48));

  // Handle slider change
  const handleHeightChange = async (sliderValue: number) => {
    const heightInCm = convertToCm(sliderValue);
    onHeightChange(heightInCm); // update parent state immediately

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.warn("No user logged in, skipping Firebase update.");
        return;
      }

      await updateFitnessGoals(user.uid, "height", heightInCm);
      console.log(`Height updated to ${heightInCm}cm for user ${user.uid}`);
    } catch (err) {
      console.error("Error updating height:", err);
    } finally {
      setLoading(false);
    }
  };

  // Slider min/max based on unit
  const sliderMin = unit === 'cm' ? 120 : 3.9; // 3'11"
  const sliderMax = unit === 'cm' ? 220 : 7.3; // 7'3"
  const sliderStep = 1; // keep simple, can adjust

  // Slider value in current unit
  const sliderValue = unit === 'cm' ? height : Math.round(height / 30.48 * 10) / 10; // feet with decimal

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: '#A8E6CF' }}
        >
          <Ruler className="w-8 h-8" style={{ color: '#1C7C54' }} />
        </div>
        <h2 className="text-2xl mb-3" style={{ color: '#102A43' }}>
          How tall are you?
        </h2>
      </div>

      {/* Unit Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#E8F4F2' }}>
          <button
            onClick={() => onUnitChange('cm')}
            className="px-6 py-2 rounded-full transition-all"
            style={{
              backgroundColor: unit === 'cm' ? '#1C7C54' : 'transparent',
              color: unit === 'cm' ? 'white' : '#102A43',
            }}
          >
            cm
          </button>
          <button
            onClick={() => onUnitChange('ft')}
            className="px-6 py-2 rounded-full transition-all"
            style={{
              backgroundColor: unit === 'ft' ? '#1C7C54' : 'transparent',
              color: unit === 'ft' ? 'white' : '#102A43',
            }}
          >
            ft/in
          </button>
        </div>
      </div>

      {/* Height Display */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-2" style={{ color: '#1C7C54' }}>
          {displayHeight}
        </p>
        <p style={{ color: '#102A43', opacity: 0.6 }}>
          {unit === 'cm' ? 'centimeters' : 'feet/inches'}
        </p>
      </div>

      {/* Slider */}
      <div className="px-4">
        <Slider
          key={unit} // ensures slider re-renders on unit change
          value={[sliderValue]}
          onValueChange={(values: number[]) => handleHeightChange(values[0])} // 👈 Added type annotation
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          className="mb-4"
        />

        <div className="flex justify-between text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
          <span>{unit === 'cm' ? '120 cm' : '3\'11"'}</span>
          <span>{unit === 'cm' ? '220 cm' : '7\'3"'}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Weight Screen
function WeightScreen({
  weight,
  unit,
  onWeightChange,
  onUnitChange,
  onContinue,
}: {
  weight: number;
  unit: 'kg' | 'lb';
  onWeightChange: (weight: number) => void;
  onUnitChange: (unit: 'kg' | 'lb') => void;
  onContinue: () => void;
}) {
  // Local state for slider
  const [localWeight, setLocalWeight] = useState(weight);
  const auth = getAuth();

  // Convert for display
  const displayWeight = unit === 'lb' ? (localWeight * 2.20462).toFixed(1) : localWeight.toFixed(1);

  const sliderMin = unit === 'lb' ? 66 : 30;
  const sliderMax = unit === 'lb' ? 440 : 200;
  const sliderStep = 0.1;
  const sliderValue = unit === 'lb' ? localWeight * 2.20462 : localWeight;

  const handleSliderChange = async (values: number[]) => {
    const newWeight = unit === 'lb' ? values[0] / 2.20462 : values[0];
    const roundedWeight = Math.round(newWeight * 100) / 100;
    setLocalWeight(roundedWeight);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateFitnessGoals(user.uid, "weight", roundedWeight);
        console.log("Weight saved to Firebase:", roundedWeight);
      }
    } catch (err) {
      console.error("Error saving weight:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: '#A8E6CF' }}
        >
          <Weight className="w-8 h-8" style={{ color: '#1C7C54' }} />
        </div>
        <h2 className="text-2xl mb-3" style={{ color: '#102A43' }}>
          How much do you weigh?
        </h2>
      </div>

      {/* Unit Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#E8F4F2' }}>
          <button
            onClick={() => onUnitChange('kg')}
            className="px-6 py-2 rounded-full transition-all flex items-center justify-center"
            style={{
              backgroundColor: unit === 'kg' ? '#1C7C54' : 'transparent',
              color: unit === 'kg' ? 'white' : '#102A43',
            }}
          >
            kg
          </button>
          <button
            onClick={() => onUnitChange('lb')}
            className="px-6 py-2 rounded-full transition-all flex items-center justify-center"
            style={{
              backgroundColor: unit === 'lb' ? '#1C7C54' : 'transparent',
              color: unit === 'lb' ? 'white' : '#102A43',
            }}
          >
            lb
          </button>
        </div>
      </div>

      {/* Weight Display */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-2" style={{ color: '#1C7C54' }}>
          {displayWeight}
        </p>
        <p style={{ color: '#102A43', opacity: 0.6 }}>{unit}</p>
      </div>

      {/* Slider */}
      <div className="px-4 mb-6">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          className="mb-4"
        />
        <div className="flex justify-between text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
          <span>{unit === 'lb' ? '66 lb' : '30 kg'}</span>
          <span>{unit === 'lb' ? '440 lb' : '200 kg'}</span>
        </div>
      </div>

      {/* Note */}
      <p className="text-center text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
        Don't have a scale? Enter your best estimate.
      </p>
    </motion.div>
  );
}

// Activity Level Screen
function ActivityScreen({
  value,
  onChange,
  onContinue,
}: {
  value: string | null;
  onChange: (level: string) => void;
  onContinue: () => void;
}) {
  const auth = getAuth();
  const levels = [
    {
      label: 'Not Active',
      description: 'Little to no exercise, desk job',
      value: 'sedentary',
    },
    {
      label: 'Lightly Active',
      description: 'Exercise 1-3 days/week',
      value: 'lightly-active',
    },
    {
      label: 'Moderately Active',
      description: 'Exercise 3-5 days/week',
      value: 'moderately-active',
    },
    {
      label: 'Very Active',
      description: 'Exercise 6-7 days/week',
      value: 'very-active',
    },
    {
      label: 'Extremely Active',
      description: 'Exercise 2× per day',
      value: 'extremely-active',
    },
  ];

  const handleLevelSelect = async (levelValue: string) => {
    onChange(levelValue); // update local state

    try {
      const user = auth.currentUser;
      if (user) {
        await updateFitnessGoals(user.uid, "activity_level", levelValue);
        console.log("Activity level saved to Firebase:", levelValue);
      }
    } catch (err) {
      console.error("Error saving activity level:", err);
    }

    // Continue to next screen after saving
    setTimeout(onContinue, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <h2 className="text-2xl mb-3 text-center" style={{ color: '#102A43' }}>
        How active are you? 💪
      </h2>
      <p className="text-center mb-8" style={{ color: '#102A43', opacity: 0.6 }}>
        This helps us calculate your daily calorie needs
      </p>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleLevelSelect(level.value)}
            className="w-full p-5 rounded-2xl border-2 transition-all text-left"
            style={{
              backgroundColor: value === level.value ? '#A8E6CF' : 'white',
              borderColor: value === level.value ? '#1C7C54' : '#A8E6CF',
            }}
          >
            <p className="mb-1" style={{ color: '#102A43' }}>
              {level.label}
            </p>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
              {level.description}
            </p>
          </button>

        ))}
      </div>
    </motion.div>
  );
}

// Goals Screen
function GoalsScreen({
  value,
  onChange,
  onContinue,
}: {
  value: 'lose' | 'maintain' | 'gain' | null;
  onChange: (goal: 'lose' | 'maintain' | 'gain') => void;
  onContinue: () => void;
}) {
  const auth = getAuth();
  const goals = [
    {
      label: 'Lose Weight',
      description: 'Lean out and reduce body fat',
      value: 'lose' as const,
      emoji: '🔥',
    },
    {
      label: 'Maintain Weight',
      description: 'Stay at current weight and build healthy habits',
      value: 'maintain' as const,
      emoji: '⚖️',
    },
    {
      label: 'Gain Weight',
      description: 'Build muscle and increase mass',
      value: 'gain' as const,
      emoji: '💪',
    },
  ];

  const handleGoalSelect = async (goalValue: 'lose' | 'maintain' | 'gain') => {
    onChange(goalValue); // update local state

    try {
      const user = auth.currentUser;
      if (user) {
        await updateFitnessGoals(user.uid, "goal_type", goalValue);
        console.log("Goal saved to Firebase:", goalValue);
      }
    } catch (err) {
      console.error("Error saving goal:", err);
    }

    // Continue to next screen after saving
    setTimeout(onContinue, 300);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <h2 className="text-2xl mb-3 text-center" style={{ color: '#102A43' }}>
        What's your main goal?
      </h2>
      <p className="text-center mb-8" style={{ color: '#102A43', opacity: 0.6 }}>
        This helps us personalize your calorie and macro targets
      </p>

      <div className="space-y-3">
        {goals.map((goal) => (
          <button
            key={goal.value}
            onClick={() => handleGoalSelect(goal.value)}
            className="w-full p-5 rounded-2xl border-2 transition-all text-left"
            style={{
              backgroundColor: value === goal.value ? '#A8E6CF' : 'white',
              borderColor: value === goal.value ? '#1C7C54' : '#A8E6CF',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{goal.emoji}</span>
              <div>
                <p className="mb-1" style={{ color: '#102A43' }}>
                  {goal.label}
                </p>
                <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                  {goal.description}
                </p>
              </div>
            </div>
          </button>

        ))}
      </div>
    </motion.div>
  );
}

// Notifications Screen
function NotificationsScreen({
  value,
  onChange,
  onContinue,
}: {
  value: boolean;
  onChange: (enabled: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl p-8 shadow-xl"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: '#A8E6CF' }}
        >
          <Bell className="w-8 h-8" style={{ color: '#1C7C54' }} />
        </div>
        <h2 className="text-2xl mb-3" style={{ color: '#102A43' }}>
          Reach your goals with notifications
        </h2>
        <p style={{ color: '#102A43', opacity: 0.6 }}>
          Get timely updates to keep you motivated. You can turn off notifications anytime in Settings.
        </p>
      </div>

      {/* Sample Notification */}
      <div
        className="p-4 rounded-2xl mb-8 shadow-md"
        style={{ backgroundColor: '#E8F4F2' }}
      >
        <div className="flex items-start gap-3">
          <img 
            src={logoImage} 
            alt="FareFit" 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="mb-1" style={{ color: '#102A43' }}>
              FareFit
            </p>
            <p className="text-sm" style={{ color: '#102A43', opacity: 0.7 }}>
              Great job logging breakfast! You're 25% towards your protein goal.
            </p>
            <p className="text-xs mt-1" style={{ color: '#102A43', opacity: 0.5 }}>
              now
            </p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-8 p-4 rounded-2xl" style={{ backgroundColor: '#E8F4F2' }}>
        <div>
          <p style={{ color: '#102A43' }}>Enable Notifications</p>
          <p className="text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
            You can change this later
          </p>
        </div>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
        style={{ backgroundColor: '#1C7C54' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

// Final Confirmation Screen
function FinalScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-3xl p-8 shadow-xl text-center"
      style={{ backgroundColor: '#E8F4F2' }}
    >
      <div
        className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: '#A8E6CF' }}
      >
        <CheckCircle2 className="w-14 h-14" style={{ color: '#1C7C54' }} />
      </div>

      <h1 className="text-4xl mb-4" style={{ color: '#102A43' }}>
        You're all set!
      </h1>
      
      <p className="text-lg mb-8" style={{ color: '#102A43', opacity: 0.7 }}>
        Your personalized dashboard is ready. Let's start your fitness journey!
      </p>

      <button
        onClick={onContinue}
        className="w-full py-5 rounded-2xl text-white text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
        style={{ backgroundColor: '#1C7C54' }}
      >
        Go to Dashboard
      </button>
    </motion.div>
  );
}
