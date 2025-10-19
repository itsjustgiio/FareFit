import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Apple, TrendingUp, ChefHat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeUserFoodContext } from '../services/foodAssistantService';
import { useUserMeals } from '../hooks/useUserMeals';
import { getGeminiService } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
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
}

interface LoggedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface FoodAssistantPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
  userGoal: GoalData | null;
  planSummary: any; // Add planSummary prop
  loggedMacros: LoggedMacros;
}

export function FoodAssistantPage({ onBack, userGoal, planSummary, loggedMacros }: FoodAssistantPageProps) {
  // Get real meal data
  const { meals, loading: mealsLoading } = useUserMeals();
  
  // Use planSummary as primary source of goal data (fallback to userGoal)
  const activeGoal = planSummary || userGoal;
  
  // Only calculate macros if we have actual goal data
  if (!activeGoal) {
    console.warn('No goal data available in Food Assistant');
  }

  // Calculate remaining macros using the active goal (no hardcoded fallbacks)
  const safe = (val: number | undefined, fallback = 0) => (typeof val === 'number' && !isNaN(val) ? val : fallback);
  const macroTargets = {
    calories: safe(activeGoal?.targetCalories, 0),
    protein: safe(activeGoal?.macros?.protein ?? activeGoal?.protein, 0),
    carbs: safe(activeGoal?.macros?.carbs ?? activeGoal?.carbs, 0),
    fat: safe(activeGoal?.macros?.fat ?? activeGoal?.fat, 0),
    fiber: safe(activeGoal?.fiber, 30),
  };
  const remainingMacros = {
    calories: Math.max(0, macroTargets.calories - loggedMacros.calories),
    protein: Math.max(0, macroTargets.protein - loggedMacros.protein),
    carbs: Math.max(0, macroTargets.carbs - loggedMacros.carbs),
    fat: Math.max(0, macroTargets.fat - loggedMacros.fat),
    fiber: Math.max(0, macroTargets.fiber - loggedMacros.fiber),
  };

  // Update circle calculations to use activeGoal (no hardcoded fallbacks)
  const caloriesProgress = macroTargets.calories > 0 ? loggedMacros.calories / macroTargets.calories : 0;
  const proteinProgress = macroTargets.protein > 0 ? loggedMacros.protein / macroTargets.protein : 0;
  const carbsProgress = macroTargets.carbs > 0 ? loggedMacros.carbs / macroTargets.carbs : 0;
  const fatProgress = macroTargets.fat > 0 ? loggedMacros.fat / macroTargets.fat : 0;
  const fiberProgress = macroTargets.fiber > 0 ? loggedMacros.fiber / macroTargets.fiber : 0;

  // Calculate percentages for display and glow effects
  const caloriePercent = Math.round(caloriesProgress * 100);
  const proteinPercent = Math.round(proteinProgress * 100);
  const carbsPercent = Math.round(carbsProgress * 100);
  const fatPercent = Math.round(fatProgress * 100);
  const fiberPercent = Math.round(fiberProgress * 100);

  // Target hit detection (90-110% range for most macros)
  const calorieHit = caloriePercent >= 90 && caloriePercent <= 110;
  const proteinHit = proteinPercent >= 90 && proteinPercent <= 110;
  const carbsHit = carbsPercent >= 90 && carbsPercent <= 110;
  const fatHit = fatPercent >= 90 && fatPercent <= 110;
  const fiberHit = fiberPercent >= 90;

  // Create dynamic AI message based on goal status
  const createInitialMessage = () => {
    if (!activeGoal) {
      return `Hey there! 🍎 I'm your Food Assistant, here to help you with nutrition.\n\n⚠️ **I notice you don't have fitness goals set up yet.** Please set your goals first to get personalized macro tracking with beautiful progress rings and smart meal recommendations!\n\nWhat would you like help with?`;
    }
    const goalType = activeGoal.goalType || userGoal?.goalType || 'maintain';
    const goalTypeDisplay = goalType.charAt(0).toUpperCase() + goalType.slice(1);
    // Show 'N/A' if macro target is 0 (not set)
    const macroDisplay = (val: number, target: number, unit = '') =>
      target > 0 ? `${val}${unit}` : 'N/A';
    return `Hey there! 🍎 I'm your Food Assistant, here to help you hit your **${goalTypeDisplay}** goals with smart meal suggestions.\n\nBased on your current progress today, you have **${macroDisplay(remainingMacros.calories, macroTargets.calories)} calories** left with **${macroDisplay(remainingMacros.protein, macroTargets.protein, 'g')} protein**, **${macroDisplay(remainingMacros.carbs, macroTargets.carbs, 'g')} carbs**, and **${macroDisplay(remainingMacros.fat, macroTargets.fat, 'g')} fat** remaining.\n\nWhat would you like help with?`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: createInitialMessage(),
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    'What should I eat for dinner?',
    'Suggest a high-protein snack',
    'I need more carbs today',
    'Low-calorie meal ideas',
  ];

  // === ✨ NEW: Gemini Integration ===
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Create a placeholder assistant message that updates as text streams in
    const newAssistant: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newAssistant]);

    try {
      const systemPrompt = `
You are a friendly nutrition analysis assistant.

The user says:
${userMessage.text}

User's current macro data:
Calories left: ${remainingMacros.calories}
Protein left: ${remainingMacros.protein}g
Carbs left: ${remainingMacros.carbs}g
Fat left: ${remainingMacros.fat}g
Fiber left: ${remainingMacros.fiber}g
Goal type: ${activeGoal?.goalType || 'maintain'}

Your job:
1. Analyze their nutrition and give tailored meal/snack suggestions.
2. Identify missing nutrients or imbalances.
3. Suggest 2–3 specific foods or meal ideas to balance the day.
4. Keep your tone casual, motivational, and concise (1–2 short paragraphs).
5. Use markdown for formatting (bold, bullet points, headers).
`;

      // Use regular chat API instead of streaming (more reliable)
      const gemini = getGeminiService();
      const response = await gemini.chat(
        [{ role: 'user', parts: [{ text: systemPrompt }] }],
        'gemini-2.5-flash'
      );

      // Update the assistant message with the response
      setMessages((prev) =>
        prev.map((m) => (m.id === newAssistant.id ? { ...m, text: response } : m))
      );
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newAssistant.id
            ? { ...m, text: '⚠️ Sorry, something went wrong while contacting the AI.' }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => setInputValue(prompt);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--farefit-bg)' }}
    >
      {/* Header */}
      <div
        className="shadow-sm sticky top-0 z-10 transition-colors duration-300"
        style={{ backgroundColor: 'var(--farefit-card)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              aria-label="Go back"
              style={{ backgroundColor: 'transparent' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--farefit-text)' }} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Apple className="w-6 h-6" style={{ color: 'var(--farefit-primary)' }} />
                <h1 style={{ color: 'var(--farefit-text)' }}>Food Assistant</h1>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--farefit-subtext)' }}>
                Get meal suggestions based on your macro goals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Progress Rings */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="rounded-lg p-6 mb-6 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--farefit-card)',
            border: '1px solid var(--farefit-secondary)',
          }}
        >
          <style>
            {`
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.02);
                }
              }
            `}
          </style>
          
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
            <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>
              {activeGoal ? `Today's Macro Status - ${(activeGoal.goalType || 'Maintain').charAt(0).toUpperCase() + (activeGoal.goalType || 'maintain').slice(1)} Goal` : "Today's Macro Status"}
            </h3>
            {activeGoal && (
              <span className="text-sm ml-2" style={{ color: 'var(--farefit-subtext)' }}>
                ({activeGoal.targetCalories} kcal/day)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Calories */}
            <div className="flex flex-col items-center">
              <p className="text-sm mb-3" style={{ color: '#FFB6B9' }}>Calories</p>
              <div 
                className="relative w-24 h-24 lg:w-32 lg:h-32 mb-3 transition-all duration-500"
                style={{
                  boxShadow: calorieHit ? '0 0 20px rgba(255, 182, 185, 0.8), 0 0 40px rgba(255, 182, 185, 0.4)' : 'none',
                  borderRadius: '50%',
                  animation: calorieHit ? 'pulse 2s infinite' : 'none'
                }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E8F4F2"
                    strokeWidth="8"
                    fill="none"
                    className="lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E8F4F2"
                    strokeWidth="10"
                    fill="none"
                    className="hidden lg:block"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={calorieHit ? "#FF8A8A" : "#FFB6B9"}
                    strokeWidth={calorieHit ? "10" : "8"}
                    fill="none"
                    strokeDasharray={`${(caloriePercent / 100) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500 lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={calorieHit ? "#FF8A8A" : "#FFB6B9"}
                    strokeWidth={calorieHit ? "12" : "10"}
                    fill="none"
                    strokeDasharray={`${(caloriePercent / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-500 hidden lg:block"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className={`text-xl lg:text-3xl transition-all duration-300 ${calorieHit ? 'font-bold scale-110' : ''}`} 
                    style={{ 
                      color: calorieHit ? '#FFB6B9' : '#102A43',
                      textShadow: calorieHit ? '0 0 10px rgba(255, 182, 185, 0.6)' : 'none'
                    }}
                  >
                    {Math.round(loggedMacros.calories)}
                  </span>
                  <span className="text-xs lg:text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    /{activeGoal?.targetCalories || 0}
                  </span>
                </div>
              </div>
              <p className="text-sm text-center" style={{ color: calorieHit ? '#FFB6B9' : '#102A43', opacity: calorieHit ? 1 : 0.6 }}>
                {calorieHit ? '🏆 Target hit!' : `${Math.max(0, remainingMacros.calories)} left`}
              </p>
            </div>

            {/* Protein */}
            <div className="flex flex-col items-center">
              <p className="text-sm mb-3" style={{ color: '#F5A623' }}>Protein</p>
              <div 
                className="relative w-24 h-24 lg:w-32 lg:h-32 mb-3 transition-all duration-500"
                style={{
                  boxShadow: proteinHit ? '0 0 20px rgba(245, 166, 35, 0.8), 0 0 40px rgba(245, 166, 35, 0.4)' : 'none',
                  borderRadius: '50%',
                  animation: proteinHit ? 'pulse 2s infinite' : 'none'
                }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E8F4F2"
                    strokeWidth="8"
                    fill="none"
                    className="lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E8F4F2"
                    strokeWidth="10"
                    fill="none"
                    className="hidden lg:block"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={proteinHit ? "#FFD700" : "#F5A623"}
                    strokeWidth={proteinHit ? "10" : "8"}
                    fill="none"
                    strokeDasharray={`${(proteinPercent / 100) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500 lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={proteinHit ? "#FFD700" : "#F5A623"}
                    strokeWidth={proteinHit ? "12" : "10"}
                    fill="none"
                    strokeDasharray={`${(proteinPercent / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-500 hidden lg:block"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className={`text-xl lg:text-3xl transition-all duration-300 ${proteinHit ? 'font-bold scale-110' : ''}`} 
                    style={{ 
                      color: proteinHit ? '#F5A623' : '#102A43',
                      textShadow: proteinHit ? '0 0 10px rgba(245, 166, 35, 0.6)' : 'none'
                    }}
                  >
                    {Math.round(loggedMacros.protein)}
                  </span>
                  <span className="text-xs lg:text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    /{activeGoal?.macros?.protein || activeGoal?.protein || 0}g
                  </span>
                </div>
              </div>
              <p className="text-sm text-center" style={{ color: proteinHit ? '#F5A623' : '#102A43', opacity: proteinHit ? 1 : 0.6 }}>
                {proteinHit ? '🏆 Target hit!' : `${Math.max(0, remainingMacros.protein)}g left`}
              </p>
            </div>

            {/* Carbs */}
            <div className="flex flex-col items-center">
              <p className="text-sm mb-3" style={{ color: '#4DD4AC' }}>Carbs</p>
              <div 
                className="relative w-24 h-24 lg:w-32 lg:h-32 mb-3 transition-all duration-500"
                style={{
                  boxShadow: carbsHit ? '0 0 20px rgba(77, 212, 172, 0.8), 0 0 40px rgba(77, 212, 172, 0.4)' : 'none',
                  borderRadius: '50%',
                  animation: carbsHit ? 'pulse 2s infinite' : 'none'
                }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E8F4F2"
                    strokeWidth="8"
                    fill="none"
                    className="lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E8F4F2"
                    strokeWidth="10"
                    fill="none"
                    className="hidden lg:block"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={carbsHit ? "#22C55E" : "#4DD4AC"}
                    strokeWidth={carbsHit ? "10" : "8"}
                    fill="none"
                    strokeDasharray={`${(carbsPercent / 100) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500 lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={carbsHit ? "#22C55E" : "#4DD4AC"}
                    strokeWidth={carbsHit ? "12" : "10"}
                    fill="none"
                    strokeDasharray={`${(carbsPercent / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-500 hidden lg:block"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className={`text-xl lg:text-3xl transition-all duration-300 ${carbsHit ? 'font-bold scale-110' : ''}`} 
                    style={{ 
                      color: carbsHit ? '#4DD4AC' : '#102A43',
                      textShadow: carbsHit ? '0 0 10px rgba(77, 212, 172, 0.6)' : 'none'
                    }}
                  >
                    {Math.round(loggedMacros.carbs)}
                  </span>
                  <span className="text-xs lg:text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    /{activeGoal?.macros?.carbs || activeGoal?.carbs || 0}g
                  </span>
                </div>
              </div>
              <p className="text-sm text-center" style={{ color: carbsHit ? '#4DD4AC' : '#102A43', opacity: carbsHit ? 1 : 0.6 }}>
                {carbsHit ? '🏆 Target hit!' : `${Math.max(0, remainingMacros.carbs)}g left`}
              </p>
            </div>

            {/* Fat */}
            <div className="flex flex-col items-center">
              <p className="text-sm mb-3" style={{ color: '#8B5CF6' }}>Fat</p>
              <div 
                className="relative w-24 h-24 lg:w-32 lg:h-32 mb-3 transition-all duration-500"
                style={{
                  boxShadow: fatHit ? '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4)' : 'none',
                  borderRadius: '50%',
                  animation: fatHit ? 'pulse 2s infinite' : 'none'
                }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E8F4F2"
                    strokeWidth="8"
                    fill="none"
                    className="lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E8F4F2"
                    strokeWidth="10"
                    fill="none"
                    className="hidden lg:block"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={fatHit ? "#A855F7" : "#8B5CF6"}
                    strokeWidth={fatHit ? "10" : "8"}
                    fill="none"
                    strokeDasharray={`${(fatPercent / 100) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500 lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={fatHit ? "#A855F7" : "#8B5CF6"}
                    strokeWidth={fatHit ? "12" : "10"}
                    fill="none"
                    strokeDasharray={`${(fatPercent / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-500 hidden lg:block"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className={`text-xl lg:text-3xl transition-all duration-300 ${fatHit ? 'font-bold scale-110' : ''}`} 
                    style={{ 
                      color: fatHit ? '#8B5CF6' : '#102A43',
                      textShadow: fatHit ? '0 0 10px rgba(139, 92, 246, 0.6)' : 'none'
                    }}
                  >
                    {Math.round(loggedMacros.fat)}
                  </span>
                  <span className="text-xs lg:text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    /{activeGoal?.macros?.fat || activeGoal?.fat || 0}g
                  </span>
                </div>
              </div>
              <p className="text-sm text-center" style={{ color: fatHit ? '#8B5CF6' : '#102A43', opacity: fatHit ? 1 : 0.6 }}>
                {fatHit ? '🏆 Target hit!' : `${Math.max(0, remainingMacros.fat)}g left`}
              </p>
            </div>

            {/* Fiber */}
            <div className="flex flex-col items-center">
              <p className="text-sm mb-3" style={{ color: '#1C7C54' }}>Fiber</p>
              <div 
                className="relative w-24 h-24 lg:w-32 lg:h-32 mb-3 transition-all duration-500"
                style={{
                  boxShadow: fiberHit ? '0 0 20px rgba(28, 124, 84, 0.8), 0 0 40px rgba(28, 124, 84, 0.4)' : 'none',
                  borderRadius: '50%',
                  animation: fiberHit ? 'pulse 2s infinite' : 'none'
                }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E8F4F2"
                    strokeWidth="8"
                    fill="none"
                    className="lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E8F4F2"
                    strokeWidth="10"
                    fill="none"
                    className="hidden lg:block"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={fiberHit ? "#22C55E" : "#1C7C54"}
                    strokeWidth={fiberHit ? "10" : "8"}
                    fill="none"
                    strokeDasharray={`${(fiberPercent / 100) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-500 lg:hidden"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={fiberHit ? "#22C55E" : "#1C7C54"}
                    strokeWidth={fiberHit ? "12" : "10"}
                    fill="none"
                    strokeDasharray={`${(fiberPercent / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-500 hidden lg:block"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className={`text-xl lg:text-3xl transition-all duration-300 ${fiberHit ? 'font-bold scale-110' : ''}`} 
                    style={{ 
                      color: fiberHit ? '#1C7C54' : '#102A43',
                      textShadow: fiberHit ? '0 0 10px rgba(28, 124, 84, 0.6)' : 'none'
                    }}
                  >
                    {Math.round(loggedMacros.fiber)}
                  </span>
                  <span className="text-xs lg:text-sm" style={{ color: '#102A43', opacity: 0.6 }}>
                    /{activeGoal?.fiber || 30}g
                  </span>
                </div>
              </div>
              <p className="text-sm text-center" style={{ color: fiberHit ? '#1C7C54' : '#102A43', opacity: fiberHit ? 1 : 0.6 }}>
                {fiberHit ? '🏆 Target hit!' : `${Math.max(0, remainingMacros.fiber)}g left`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg p-4 transition-colors duration-300 ${
                  message.sender === 'user' ? '' : 'text-white'
                }`}
                style={{
                  backgroundColor:
                    message.sender === 'assistant' ? 'var(--farefit-primary)' : 'var(--farefit-card)',
                  border: message.sender === 'user' ? '1px solid var(--farefit-secondary)' : undefined,
                  color: message.sender === 'user' ? 'var(--farefit-text)' : undefined,
                }}
              >
                {message.sender === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-invert">
                    <ReactMarkdown
                      components={{
                        h3: ({ children }) => (
                          <h3 className="text-white text-base font-medium mt-0 mb-3 flex items-center gap-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-white text-sm leading-relaxed mb-3 last:mb-0">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-white text-sm space-y-2 mb-3 list-none pl-0">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-white text-sm leading-relaxed flex items-start gap-2">
                            <span className="opacity-70">•</span>
                            <span>{children}</span>
                          </li>
                        ),
                        strong: ({ children }) => <strong className="font-medium">{children}</strong>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--farefit-text)' }}>
                    {message.text}
                  </p>
                )}
                <p
                  className="text-xs mt-2"
                  style={{
                    opacity: 0.6,
                    color: message.sender === 'assistant' ? 'white' : 'var(--farefit-text)',
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div
                className="max-w-[85%] rounded-lg p-4 text-white transition-colors duration-300"
                style={{ backgroundColor: 'var(--farefit-primary)' }}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4">
          <div
            className="rounded-lg p-4 transition-colors duration-300"
            style={{
              backgroundColor: 'var(--farefit-card)',
              border: '1px solid var(--farefit-secondary)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="w-4 h-4" style={{ color: 'var(--farefit-primary)' }} />
              <p className="text-sm m-0" style={{ color: 'var(--farefit-subtext)' }}>
                Quick suggestions:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs px-3 py-2 rounded-full border transition-all"
                  style={{
                    borderColor: 'var(--farefit-secondary)',
                    color: 'var(--farefit-primary)',
                    backgroundColor: 'var(--farefit-card)',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="sticky bottom-0 border-t transition-colors duration-300"
        style={{ backgroundColor: 'var(--farefit-card)', borderColor: 'var(--farefit-secondary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about meals, macros, or food suggestions..."
              className="flex-1 px-4 py-3 border rounded-lg text-sm transition-colors duration-300"
              style={{
                borderColor: 'var(--farefit-secondary)',
                color: 'var(--farefit-text)',
                backgroundColor: 'var(--farefit-card)',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-6 py-3 rounded-lg text-white transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: 'var(--farefit-primary)' }}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--farefit-subtext)' }}>
            Food Assistant suggests meals based on your macro data — always verify nutrition info! 🍎
          </p>
        </div>
      </div>
    </div>
  );
}