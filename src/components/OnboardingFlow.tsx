import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Star, Calendar, Ruler, Weight, Bell, CheckCircle2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { DateInput } from './ui/date-input';
import logoImage from 'figma:asset/77bf03e5d71328d3253fb9c4f7bef47edf94924a.png';
import { updateFitnessGoals } from '../userService';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
    heightUnit: 'ft', // Default to feet/inches
    weight: 0, // Stored in kg (155 lb = ~70 kg)
    weightUnit: 'lb',
    activityLevel: null,
    goal: null,
    notificationsEnabled: true,
  });

  const totalSteps = 9; // Including final confirmation

  const nextStep = async () => {
    const user = getAuth().currentUser;
    
    // Save default values if user is leaving height/weight screens without changes
    if (user) {
      if (currentStep === 3 && data.height <= 0) {
        // User is leaving height screen with no saved height - save default 170cm
        try {
          await updateFitnessGoals(user.uid, "height", 170);
          console.log(`✅ Default height 170cm saved for ${user.uid}`);
          // Update local state too
          setData({ ...data, height: 170 });
        } catch (err) {
          console.error("Error saving default height:", err);
        }
      } else if (currentStep === 4 && data.weight <= 0) {
        // User is leaving weight screen with no saved weight - save default 70kg
        try {
          await updateFitnessGoals(user.uid, "weight", 70);
          console.log(`✅ Default weight 70kg saved for ${user.uid}`);
          // Update local state too
          setData({ ...data, weight: 70 });
        } catch (err) {
          console.error("Error saving default weight:", err);
        }
      }
    }
    
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'white', overflow: 'hidden' }}>
      <div className="relative w-full max-w-md h-[700px] flex flex-col justify-center">
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
        <AnimatePresence mode="sync">
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
  const [isValid, setIsValid] = useState(false);
  const auth = getAuth();

  const handleDateChange = async (birthday: string) => {
    onChange(birthday); // update local state
    
    // Validate the birth date
    const validationError = validateBirthDate(birthday);
    if (validationError) {
      setError(validationError);
      setIsValid(false);
      return;
    }

    setError(null);
    setIsValid(true);
    setLoading(true);

    // Parse date safely to avoid timezone issues
    const [yearStr, monthStr, dayStr] = birthday.split('-');
    const birthYear = parseInt(yearStr);
    const birthMonth = parseInt(monthStr);
    const birthDay = parseInt(dayStr);
    
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = (today.getMonth() + 1) - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        // ✅ Save birthday correctly in Users collection
        const userRef = doc(db, "Users", user.uid);
        await setDoc(userRef, { birthDate: birthday, age }, { merge: true });
        console.log(`✅ Birthday (${birthday}) + age (${age}) saved in Users/${user.uid}`);
      }

      setTimeout(onContinue, 800); // move to next onboarding step
    } catch (error) {
      console.error("Error updating birthday:", error);
      setError("Failed to save birth date. Please try again.");
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleValidationChange = (valid: boolean, validationError?: string) => {
    setIsValid(valid);
    if (validationError) {
      setError(validationError);
    } else {
      setError(null);
    }
  };

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

      <div className="flex flex-col items-center space-y-8">
        {/* Custom Google-style Date Input */}
        <motion.div 
          className="flex flex-col items-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        >
          <DateInput
            value={value || ''}
            onChange={handleDateChange}
            onValidationChange={handleValidationChange}
            minDate={getMinBirthDate()}
            maxDate={getMaxBirthDate()}
            className={`${error ? 'opacity-75' : ''}`}
          />
          
          {/* Instruction text */}
          <p className="text-sm text-center font-medium" style={{ color: "#102A43", opacity: 0.6 }}>
            📅 Type or select your birth date above
          </p>
        </motion.div>

        {/* Error message display */}
        {error && (
          <motion.div 
            className="text-red-600 text-sm text-center bg-red-50 px-6 py-3 rounded-xl border-l-4 border-red-400 shadow-sm max-w-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              {error}
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {loading && (
          <motion.div 
            className="flex items-center gap-3 text-center text-sm bg-blue-50 px-6 py-3 rounded-xl border-l-4 border-blue-400 shadow-sm"
            style={{ color: "#102A43" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Saving your information...</span>
          </motion.div>
        )}

        {/* Success message */}
        {isValid && !error && !loading && value && (
          <motion.div 
            className="text-green-700 text-sm text-center bg-green-50 px-6 py-3 rounded-xl border-l-4 border-green-400 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="font-medium">Date saved successfully!</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Height Screen
const HeightScreen = memo(function HeightScreen({
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
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);
  const [cm, setCm] = useState(170);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [sliderTempValue, setSliderTempValue] = useState(0);
  const auth = getAuth();

  // Debounced save to reduce Firebase calls
  const [heightSaveTimeout, setHeightSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize from props
  useEffect(() => {
    if (height > 0) {
      if (unit === 'cm') {
        setCm(Math.round(height));
        setSliderTempValue(Math.round(height));
      } else {
        const totalInches = height / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setFeet(ft);
        setInches(inch);
        setSliderTempValue(ft * 12 + inch);
      }
    } else {
      // Set defaults
      if (unit === 'cm') {
        setCm(170);
        setSliderTempValue(170);
      } else {
        setFeet(5);
        setInches(7);
        setSliderTempValue(5 * 12 + 7);
      }
    }
  }, [height, unit]);

  // Convert feet/inches to total inches for slider
  const getCurrentTotalInches = () => feet * 12 + inches;
  
  // Slider bounds for ft/in mode (in total inches)
  const sliderMin = unit === 'cm' ? 107 : 42; // 42 inches = 3'6"
  const sliderMax = unit === 'cm' ? 244 : 96; // 96 inches = 8'0"
  const sliderStep = 1;
  const sliderValue = isSliderDragging ? sliderTempValue : (unit === 'cm' ? cm : getCurrentTotalInches());

  // Convert feet/inches to cm
  const feetInchesToCm = (ft: number, inch: number) => {
    const totalInches = ft * 12 + inch;
    return Math.round(totalInches * 2.54);
  };

  // Validate feet/inches
  const validateFeetInches = (ft: number, inch: number) => {
    if (ft < 3 || ft > 8) {
      return "Height must be between 3'0\" and 8'0\"";
    }
    if (inch < 0 || inch > 11) {
      return "Inches must be between 0 and 11";
    }
    if (ft === 3 && inch < 6) {
      return "Minimum height is 3'6\"";
    }
    if (ft === 8 && inch > 0) {
      return "Maximum height is 8'0\"";
    }
    return null;
  };

  // Validate cm input
  const validateCm = (cmValue: number) => {
    if (cmValue < 107 || cmValue > 244) {
      return "Height must be between 107cm and 244cm";
    }
    return null;
  };

  // Save height to Firebase
  const saveHeight = async (heightInCm: number) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateFitnessGoals(user.uid, "height", heightInCm);
        console.log(`Height updated to ${heightInCm}cm for user ${user.uid}`);
      }
      onHeightChange(heightInCm);
      setError(null);
    } catch (err) {
      console.error("Error updating height:", err);
      setError("Failed to save height. Please try again.");
    }
  };

  // Debounced save to reduce excessive Firebase calls
  const saveHeightDebounced = (heightInCm: number) => {
    if (heightSaveTimeout) {
      clearTimeout(heightSaveTimeout);
    }
    const timeout = setTimeout(() => saveHeight(heightInCm), 400);
    setHeightSaveTimeout(timeout);
  };

  // Handle slider drag (don't update display while dragging)
  const handleSliderDrag = (values: number[]) => {
    setIsSliderDragging(true);
    setSliderTempValue(values[0]);
  };

  // Handle slider commit (update display and save)
  const handleSliderCommit = async (values: number[]) => {
    setIsSliderDragging(false);
    const newValue = values[0];
    let heightInCm: number;

    if (unit === 'cm') {
      const newCm = Math.round(newValue);
      setCm(newCm);
      heightInCm = newCm;
    } else {
      // Convert total inches to feet/inches
      const totalInches = Math.round(newValue);
      const newFeet = Math.floor(totalInches / 12);
      const newInches = totalInches % 12;
      
      setFeet(newFeet);
      setInches(newInches);
      heightInCm = feetInchesToCm(newFeet, newInches);
    }

    setError(null);
    await saveHeight(heightInCm);
  };

  // Handle direct feet input (from editable display)
  const handleFeetChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    // Only allow 3-8 feet
    if (numValue < 3 || numValue > 8) {
      return;
    }
    
    setFeet(numValue);
    setSliderTempValue(numValue * 12 + inches);
    
    // Validate before saving
    const validationError = validateFeetInches(numValue, inches);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const heightInCm = feetInchesToCm(numValue, inches);
    setError(null);
    saveHeightDebounced(heightInCm);
  };

  // Handle direct inches input (from editable display)
  const handleInchesChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    // Only allow 0-11 inches
    if (numValue < 0 || numValue > 11) {
      return;
    }
    
    setInches(numValue);
    setSliderTempValue(feet * 12 + numValue);
    
    // Validate before saving
    const validationError = validateFeetInches(feet, numValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const heightInCm = feetInchesToCm(feet, numValue);
    setError(null);
    saveHeightDebounced(heightInCm);
  };

  // Handle direct cm input (from editable display)
  const handleCmChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    // Only allow 107-244 cm
    if (numValue < 107 || numValue > 244) {
      return;
    }
    
    setCm(numValue);
    setSliderTempValue(numValue);
    
    // Validate before saving
    const validationError = validateCm(numValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    saveHeightDebounced(numValue);
  };

  // No longer needed - we store feet/inches directly

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (heightSaveTimeout) {
        clearTimeout(heightSaveTimeout);
      }
    };
  }, [heightSaveTimeout]);

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl p-8 shadow-xl h-[600px] overflow-hidden"
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
        <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#D4EDDA' }}>
          <button
            onClick={() => {
              onUnitChange('ft');
              setError(null);
            }}
            className="px-6 py-2 rounded-full transition-all"
            style={{
              backgroundColor: unit === 'ft' ? '#1C7C54' : 'transparent',
              color: unit === 'ft' ? 'white' : '#102A43',
            }}
          >
            ft/in
          </button>
          <button
            onClick={() => {
              onUnitChange('cm');
              setError(null);
            }}
            className="px-6 py-2 rounded-full transition-all"
            style={{
              backgroundColor: unit === 'cm' ? '#1C7C54' : 'transparent',
              color: unit === 'cm' ? 'white' : '#102A43',
            }}
          >
            cm
          </button>
        </div>
      </div>

      {/* Editable Height Display */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 h-[100px] w-full">
          {unit === 'ft' ? (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={isSliderDragging ? Math.floor(sliderTempValue / 12) : feet}
                onChange={(e) => handleFeetChange(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="text-5xl font-bold text-center bg-transparent border-none outline-none w-16"
                style={{ 
                  fontVariantNumeric: 'tabular-nums', 
                  transition: 'none', 
                  color: isSliderDragging ? '#4A90A4' : '#1C7C54',
                  opacity: isSliderDragging ? 0.8 : 1
                }}
                maxLength={1}
                readOnly={isSliderDragging}
              />
              <span className="text-5xl font-bold" style={{ color: isSliderDragging ? '#4A90A4' : '#1C7C54', opacity: isSliderDragging ? 0.8 : 1 }}>′</span>
              <input
                type="text"
                inputMode="numeric"
                value={isSliderDragging ? Math.round(sliderTempValue % 12) : inches}
                onChange={(e) => handleInchesChange(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="text-5xl font-bold text-center bg-transparent border-none outline-none w-16"
                style={{ 
                  fontVariantNumeric: 'tabular-nums', 
                  transition: 'none', 
                  color: isSliderDragging ? '#4A90A4' : '#1C7C54',
                  opacity: isSliderDragging ? 0.8 : 1
                }}
                maxLength={2}
                readOnly={isSliderDragging}
              />
              <span className="text-5xl font-bold" style={{ color: isSliderDragging ? '#4A90A4' : '#1C7C54', opacity: isSliderDragging ? 0.8 : 1 }}>″</span>
            </>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={isSliderDragging ? Math.round(sliderTempValue) : cm}
                onChange={(e) => handleCmChange(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="text-5xl font-bold text-center bg-transparent border-none outline-none w-24"
                style={{ 
                  fontVariantNumeric: 'tabular-nums', 
                  transition: 'none', 
                  color: isSliderDragging ? '#4A90A4' : '#1C7C54',
                  opacity: isSliderDragging ? 0.8 : 1
                }}
                maxLength={3}
                readOnly={isSliderDragging}
              />
              <span className="text-5xl font-bold" style={{ color: isSliderDragging ? '#4A90A4' : '#1C7C54', opacity: isSliderDragging ? 0.8 : 1 }}>cm</span>
            </>
          )}
        </div>
      </div>

      {/* Tap to edit hint */}
      <div className="text-center mb-6 h-[20px]">
        {isSliderDragging ? (
          <p className="text-xs" style={{ color: '#4A90A4', opacity: 0.8 }}>
            Preview - release to set
          </p>
        ) : (
          <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
            Tap numbers to edit or use slider below
          </p>
        )}
      </div>

      {/* Height Slider */}
      <div className="mb-8 px-4">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderDrag}
          onValueCommit={handleSliderCommit}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          className="w-full"
        />
        <div className="flex justify-between text-xs mt-2" style={{ color: '#102A43', opacity: 0.5 }}>
          <span>{unit === 'ft' ? "3'6\"" : "107cm"}</span>
          <span>{unit === 'ft' ? "8'0\"" : "244cm"}</span>
        </div>
      </div>

      {/* Error Message */}
      <div className="min-h-[40px] text-center mb-4">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200 inline-block">
            {error}
          </p>
        )}
      </div>

      {/* Spacer for consistent layout */}
      <div className="h-[40px] mb-4"></div>

      {/* Range indicators */}
      <div className="text-center">
        <p className="text-xs" style={{ color: '#102A43', opacity: 0.5 }}>
          {unit === 'ft' ? "Range: 3'6\" - 8'0\"" : "Range: 107cm - 244cm"}
        </p>
      </div>
    </motion.div>
  );
});

// Weight Screen
const WeightScreen = memo(function WeightScreen({
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
  // State for weight management
  const [localWeight, setLocalWeight] = useState(weight || 70);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [sliderTempValue, setSliderTempValue] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const auth = getAuth();

  // Initialize weight values
  useEffect(() => {
    if (weight > 0) {
      setLocalWeight(weight);
      const displayValue = unit === 'lb' ? (weight * 2.20462).toFixed(1) : weight.toFixed(1);
      setInputValue(displayValue);
      setSliderTempValue(unit === 'lb' ? weight * 2.20462 : weight);
    } else {
      setLocalWeight(70);
      const displayValue = unit === 'lb' ? (70 * 2.20462).toFixed(1) : (70).toFixed(1);
      setInputValue(displayValue);
      setSliderTempValue(unit === 'lb' ? 70 * 2.20462 : 70);
    }
  }, [weight, unit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Get display value for input
  const getDisplayWeight = () => {
    if (isSliderDragging) {
      return sliderTempValue.toFixed(1);
    }
    if (isInputFocused) {
      return inputValue;
    }
    return unit === 'lb' ? (localWeight * 2.20462).toFixed(1) : localWeight.toFixed(1);
  };

  // Debounced save function
  const saveWeightDebounced = (weightInKg: number) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(() => saveWeight(weightInKg), 500);
    setSaveTimeout(timeout);
  };

  // Handle manual weight input
  const handleWeightChange = (value: string) => {
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    setInputValue(value);
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= sliderMin && numValue <= sliderMax) {
      const weightInKg = unit === 'lb' ? numValue / 2.20462 : numValue;
      const roundedWeight = Math.round(weightInKg * 100) / 100;
      setLocalWeight(roundedWeight);
      setSliderTempValue(unit === 'lb' ? roundedWeight * 2.20462 : roundedWeight);
      saveWeightDebounced(roundedWeight);
    }
  };

  // Handle input focus/blur to sync values
  const handleInputFocus = () => {
    setIsInputFocused(true);
    setInputValue(getDisplayWeight());
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    const numValue = parseFloat(inputValue);
    
    if (!isNaN(numValue) && numValue >= sliderMin && numValue <= sliderMax) {
      const weightInKg = unit === 'lb' ? numValue / 2.20462 : numValue;
      const roundedWeight = Math.round(weightInKg * 100) / 100;
      setLocalWeight(roundedWeight);
      setSliderTempValue(unit === 'lb' ? roundedWeight * 2.20462 : roundedWeight);
      saveWeight(roundedWeight);
    }
    
    // Update input to formatted value
    const displayValue = unit === 'lb' ? (localWeight * 2.20462).toFixed(1) : localWeight.toFixed(1);
    setInputValue(displayValue);
  };

  const sliderMin = unit === 'lb' ? 66 : 30;
  const sliderMax = unit === 'lb' ? 440 : 200;
  const sliderStep = 0.1;
  const sliderValue = isSliderDragging ? sliderTempValue : (unit === 'lb' ? localWeight * 2.20462 : localWeight);

  // Save weight to Firebase
  const saveWeight = async (weightInKg: number) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateFitnessGoals(user.uid, "weight", weightInKg);
        console.log("Weight saved to Firebase:", weightInKg);
      }
      onWeightChange(weightInKg);
    } catch (err) {
      console.error("Error saving weight:", err);
    }
  };

  // Handle slider drag (preview only)
  const handleSliderDrag = (values: number[]) => {
    setIsSliderDragging(true);
    setSliderTempValue(values[0]);
  };

  // Handle slider commit (save final value)
  const handleSliderCommit = async (values: number[]) => {
    setIsSliderDragging(false);
    const newWeight = unit === 'lb' ? values[0] / 2.20462 : values[0];
    const roundedWeight = Math.round(newWeight * 100) / 100;
    setLocalWeight(roundedWeight);
    
    // Update input value to match final weight
    const displayValue = unit === 'lb' ? (roundedWeight * 2.20462).toFixed(1) : roundedWeight.toFixed(1);
    setInputValue(displayValue);
    
    await saveWeight(roundedWeight);
  };

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl p-8 shadow-xl h-[600px] overflow-hidden"
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

      {/* Editable Weight Display */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 h-[100px] w-full">
          <input
            type="text"
            inputMode="decimal"
            value={getDisplayWeight()}
            onChange={(e) => handleWeightChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="text-5xl font-bold text-center bg-transparent border-none outline-none w-32"
            style={{ 
              fontVariantNumeric: 'tabular-nums', 
              transition: 'none', 
              color: isSliderDragging ? '#4A90A4' : '#1C7C54',
              opacity: isSliderDragging ? 0.8 : 1
            }}
            readOnly={isSliderDragging}
          />
          <span className="text-5xl font-bold" style={{ color: isSliderDragging ? '#4A90A4' : '#1C7C54', opacity: isSliderDragging ? 0.8 : 1 }}>{unit}</span>
        </div>
      </div>

      {/* Tap to edit hint */}
      <div className="text-center mb-6 h-[20px]">
        {isSliderDragging ? (
          <p className="text-xs" style={{ color: '#4A90A4', opacity: 0.8 }}>
            Preview - release to set
          </p>
        ) : (
          <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
            Tap number to edit or use slider below
          </p>
        )}
      </div>

      {/* Weight Slider */}
      <div className="px-4 mb-6">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderDrag}
          onValueCommit={handleSliderCommit}
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
});

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
        await updateFitnessGoals(user.uid, "activityLevel", levelValue);
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
        await updateFitnessGoals(user.uid, "goals", goalValue);
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
