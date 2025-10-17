import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Apple, TrendingUp, ChefHat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  loggedMacros: LoggedMacros;
}

export function FoodAssistantPage({ onBack, userGoal, loggedMacros }: FoodAssistantPageProps) {
  // Calculate remaining macros
  const remainingMacros = {
    calories: userGoal ? userGoal.targetCalories - loggedMacros.calories : 750,
    protein: userGoal ? userGoal.protein - loggedMacros.protein : 70,
    carbs: userGoal ? userGoal.carbs - loggedMacros.carbs : 80,
    fat: userGoal ? userGoal.fat - loggedMacros.fat : 25,
    fiber: 30 - loggedMacros.fiber // Assume 30g fiber goal
  };

  const goalType = userGoal?.goalType || 'maintain';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey there! 🍎 I'm your Food Assistant, here to help you hit your macro goals with smart meal suggestions.\n\nBased on your current progress today, you have **${remainingMacros.calories} calories** left with **${remainingMacros.protein}g protein**, **${remainingMacros.carbs}g carbs**, and **${remainingMacros.fat}g fat** remaining.\n\nWhat would you like help with?`,
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    "What should I eat for dinner?",
    "Suggest a high-protein snack",
    "I need more carbs today",
    "Low-calorie meal ideas"
  ];

  const getFoodAssistantResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Get context for AI responses
    const remaining = remainingMacros;
    const goal = goalType;
    const isLowCalories = remaining.calories < 200;
    const isOverTarget = remaining.calories < 0;
    const needsProtein = remaining.protein > 50;

    // Dinner suggestions
    if (lowerMessage.includes('dinner') || lowerMessage.includes('meal')) {
      if (isOverTarget) {
        return `### 📊 Summary\nYou've already hit your ${remaining.calories * -1} calories over your target today. If you're still hungry, let's keep it super light!\n\n### 🍽️ Meal Suggestions\n- **Grilled chicken breast (4oz)** with steamed vegetables (light and protein-focused)\n- **Egg white omelet** with spinach and mushrooms (very low calorie)\n- **Baked white fish** with lemon and asparagus (lean and clean)\n- **Large salad** with grilled chicken and light vinaigrette\n\n### 💪 Encouragement\nOne day over is totally fine — tomorrow's a fresh start! 💚`;
      }

      const goalContext = goal === 'cut' 
        ? "Since you're cutting, here are some filling options that won't break your calorie bank"
        : goal === 'bulk'
        ? "Bulking mode! Here are some calorie-packed options"
        : "Let's keep it balanced";

      return `### 📊 Summary\nYou've got ${remaining.calories} calories left with ${remaining.protein}g protein and ${remaining.carbs}g carbs. ${goalContext}!\n\n### 🍽️ Meal Suggestions\n- **Grilled chicken breast (6oz)** with sweet potato and roasted broccoli (hits all your macros perfectly)\n- **Salmon (5oz)** with quinoa and asparagus (great for healthy fats + protein)\n- **Turkey chili** with beans and a small cornbread (warm, filling, balanced)\n- **Stir-fry** with lean beef, brown rice, and mixed veggies (quick and satisfying)\n\n### 💪 Encouragement\nYou're crushing it today — finish strong with a great meal! 🔥`;
    }

    // High protein snacks
    if (lowerMessage.includes('protein') && (lowerMessage.includes('snack') || lowerMessage.includes('quick'))) {
      return `### 📊 Summary\nLooking for protein? You need ${remaining.protein}g more today. Here are some easy snacks that'll boost your protein intake without breaking your calorie bank (${remaining.calories} cals left).\n\n### 🍽️ Snack Suggestions\n- **Greek yogurt (170g)** with a few berries (20g protein, ~150 cals)\n- **Protein shake** with isolate powder in water (25g protein, ~110 cals)\n- **Hard-boiled eggs (3)** with a pinch of salt (18g protein, ~210 cals)\n- **Cottage cheese (1 cup)** with cucumber slices (25g protein, ~160 cals)\n\n### 💪 Encouragement\nGet that protein in — your muscles will thank you! 💪`;
    }

    // More carbs
    if (lowerMessage.includes('carb') || lowerMessage.includes('carbs')) {
      return `### 📊 Summary\nNeed to bump up those carbs? You've got ${remaining.carbs}g left to hit. Here are some clean carb sources that fit your ${remaining.calories} calorie budget.\n\n### 🍽️ Meal Suggestions\n- **Oatmeal (1 cup cooked)** with banana and honey (60g carbs, filling)\n- **Brown rice bowl (1.5 cups)** with chicken and veggies (70g carbs)\n- **Whole wheat pasta (2oz dry)** with marinara and lean turkey (65g carbs)\n- **Sweet potato (large, baked)** with a bit of cinnamon (55g carbs)\n\n### 💪 Encouragement\nFuel up smart — you're on the right track! 🔥`;
    }

    // Low calorie
    if (lowerMessage.includes('low') && lowerMessage.includes('calorie')) {
      const context = goal === 'cut' 
        ? "Perfect for cutting! High-volume, low-calorie options coming right up"
        : "Here are some lighter options";

      return `### 📊 Summary\n${context}. You've got ${remaining.calories} calories left, so let's maximize volume!\n\n### 🍽️ Meal Suggestions\n- **Egg white omelet (5 whites)** with spinach and mushrooms (~150 cals)\n- **Grilled chicken salad** with tons of veggies and light dressing (~250 cals)\n- **Veggie stir-fry** with shirataki noodles and a bit of soy sauce (~120 cals)\n- **Protein fluff** (whipped protein powder with ice and xanthan gum) (~100 cals)\n\n### 💪 Encouragement\nVolume eating for the win — stay satisfied while hitting your goals! 💚`;
    }

    // Breakfast
    if (lowerMessage.includes('breakfast')) {
      return `### 📊 Summary\nBreakfast time! You have ${remaining.calories} calories left today with ${remaining.protein}g protein and ${remaining.carbs}g carbs to hit. Here are some balanced morning options.\n\n### 🍽️ Meal Suggestions\n- **Protein pancakes** (made with egg whites, oats, and protein powder) with berries\n- **Scrambled eggs (3 whole)** with avocado toast and turkey bacon\n- **Greek yogurt parfait** with granola, banana, and a drizzle of honey\n- **Overnight oats** with protein powder, chia seeds, and sliced almonds\n\n### 💪 Encouragement\nStart your day strong — breakfast sets the tone! 🌅`;
    }

    // Default helpful response with real data
    return `### 📊 Summary\nI can help you find the perfect meal or snack to fit your remaining macros! You currently have **${remaining.calories} calories**, **${remaining.protein}g protein**, **${remaining.carbs}g carbs**, and **${remaining.fat}g fat** left for today.\n\nYou're on a **${goal}** plan, so I'll tailor suggestions accordingly!\n\n### 🍽️ What I Can Help With:\n- **Meal planning** for breakfast, lunch, dinner, or snacks\n- **Macro-specific suggestions** (high protein, low calorie, etc.)\n- **Goal-based recommendations** for your ${goal} journey\n- **Quick meal ideas** when you're short on time\n\n### 💪 Encouragement\nJust tell me what you're looking for, and I'll hook you up with some tasty options! 🍽️`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getFoodAssistantResponse(inputValue),
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-bg)' }}>
      {/* Header */}
      <div className="shadow-sm sticky top-0 z-10 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)' }}>
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

      {/* Current Macro Status Card */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div 
          className="rounded-lg p-6 mb-6 transition-colors duration-300"
          style={{ backgroundColor: 'var(--farefit-card)', border: '1px solid var(--farefit-secondary)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
            <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>Today's Macro Status</h3>
          </div>
          
          {userGoal ? (
            <>
              <div className="mb-4 pb-4 border-b transition-colors duration-300" style={{ borderColor: 'var(--farefit-secondary)' }}>
                <p className="text-sm mb-2" style={{ color: 'var(--farefit-subtext)' }}>
                  Goal: <span style={{ color: 'var(--farefit-primary)', textTransform: 'capitalize' }}>{goalType}</span> ({userGoal.targetCalories} kcal/day)
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Remaining</p>
                  <p className="text-2xl" style={{ color: remainingMacros.calories < 0 ? 'var(--farefit-accent)' : 'var(--farefit-primary)' }}>
                    {Math.abs(remainingMacros.calories)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {remainingMacros.calories < 0 ? 'over' : 'kcal left'}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Protein</p>
                  <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{Math.max(0, remainingMacros.protein)}g</p>
                  <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {loggedMacros.protein}/{userGoal.protein}g
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Carbs</p>
                  <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{Math.max(0, remainingMacros.carbs)}g</p>
                  <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {loggedMacros.carbs}/{userGoal.carbs}g
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Fat</p>
                  <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{Math.max(0, remainingMacros.fat)}g</p>
                  <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {loggedMacros.fat}/{userGoal.fat}g
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>Fiber</p>
                  <p className="text-2xl" style={{ color: 'var(--farefit-primary)' }}>{Math.max(0, remainingMacros.fiber)}g</p>
                  <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                    {loggedMacros.fiber}/30g
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p style={{ color: 'var(--farefit-subtext)' }}>
                No fitness goal set yet. Set your goals to get personalized macro tracking!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 transition-colors duration-300 ${
                  message.sender === 'user'
                    ? ''
                    : 'text-white'
                }`}
                style={{
                  backgroundColor: message.sender === 'assistant' ? 'var(--farefit-primary)' : 'var(--farefit-card)',
                  border: message.sender === 'user' ? '1px solid var(--farefit-secondary)' : undefined,
                  color: message.sender === 'user' ? 'var(--farefit-text)' : undefined
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
                          <ul className="text-white text-sm space-y-2 mb-3 list-none pl-0">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-white text-sm leading-relaxed flex items-start gap-2">
                            <span className="opacity-70">•</span>
                            <span>{children}</span>
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-medium">{children}</strong>
                        )
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
                    color: message.sender === 'assistant' ? 'white' : 'var(--farefit-text)'
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

      {/* Quick Prompts (only show at start) */}
      {messages.length === 1 && (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4">
          <div className="rounded-lg p-4 transition-colors duration-300" style={{ backgroundColor: 'var(--farefit-card)', border: '1px solid var(--farefit-secondary)' }}>
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
                  style={{ borderColor: 'var(--farefit-secondary)', color: 'var(--farefit-primary)', backgroundColor: 'var(--farefit-card)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about meals, macros, or food suggestions..."
              className="flex-1 px-4 py-3 border rounded-lg text-sm transition-colors duration-300"
              style={{ 
                borderColor: 'var(--farefit-secondary)',
                color: 'var(--farefit-text)',
                backgroundColor: 'var(--farefit-card)'
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