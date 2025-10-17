import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Dumbbell, Apple, Moon, Target, Sparkles, ChevronDown } from 'lucide-react';
import { Footer } from './Footer';
import { FeedbackModal } from './FeedbackModal';

interface CoachAIPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export function CoachAIPage({ onBack, onNavigate, onFeedbackClick }: CoachAIPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! 👋 I'm Coach AI, your personal training assistant. I'm here to help you train smarter, recover better, and stay on track. What would you like to work on today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock user data
  const userProfile = {
    todayWorkout: 'Push Day - Completed',
    fitnessLevel: experienceLevel,
    currentGoal: 'Lean Bulk',
    hasWorkedOutToday: true,
    lastWorkoutDaysAgo: 0,
    consistencyImprovement: 12
  };

  const exampleQuestions = [
    "Build me a 3-day full-body plan.",
    "How can I increase bench press strength?",
    "What's the best post-workout meal?",
    "I feel sore every day — am I overtraining?",
    "Give me a beginner's guide to progressive overload."
  ];

  const quickActions = [
    { icon: Dumbbell, label: 'Workout Advice', prompt: 'Give me workout advice for today' },
    { icon: Apple, label: 'Nutrition', prompt: 'What should I eat to support my fitness goals?' },
    { icon: Moon, label: 'Recovery', prompt: 'How can I optimize my recovery?' },
    { icon: Target, label: 'Goals', prompt: 'Help me set realistic fitness goals' }
  ];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Direct scroll without looking for child elements
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('coachAI_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message
      localStorage.setItem('coachAI_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Context-aware responses
    if (lowerMessage.includes('3-day') && lowerMessage.includes('plan')) {
      if (experienceLevel === 'Beginner') {
        return "Great choice! Here's a simple 3-day full-body plan:\n\n**Day 1 - Full Body A**\n• Squats: 3 sets of 8-10 reps\n• Bench Press: 3 sets of 8-10 reps\n• Bent Over Rows: 3 sets of 8-10 reps\n• Plank: 3 sets of 30-60 seconds\n\n**Day 2 - Rest or Light Cardio**\n\n**Day 3 - Full Body B**\n• Deadlifts: 3 sets of 6-8 reps\n• Overhead Press: 3 sets of 8-10 reps\n• Pull-ups/Lat Pulldowns: 3 sets of 8-10 reps\n• Bicycle Crunches: 3 sets of 15 reps\n\n**Day 4-5 - Rest**\n\n**Day 6 - Full Body C**\n• Lunges: 3 sets of 10 reps per leg\n• Incline Dumbbell Press: 3 sets of 10 reps\n• Cable Rows: 3 sets of 10 reps\n• Russian Twists: 3 sets of 20 reps\n\nRemember to warm up before each session and focus on proper form! 💪";
      } else {
        return "Perfect! Here's an intermediate/advanced 3-day full-body split:\n\n**Day 1 - Strength Focus**\n• Squats: 5x5 (heavy)\n• Bench Press: 4x6-8\n• Pendlay Rows: 4x6-8\n• Face Pulls: 3x15\n• Ab Rollouts: 3x10\n\n**Day 2 - Hypertrophy Focus**\n• Romanian Deadlifts: 4x8-10\n• Overhead Press: 4x8-10\n• Weighted Pull-ups: 4x6-8\n• Dumbbell Lateral Raises: 3x12-15\n• Hanging Leg Raises: 3x12\n\n**Day 3 - Volume Focus**\n• Front Squats: 4x10-12\n• Incline Bench: 4x10-12\n• Cable Rows: 4x10-12\n• Dumbbell Curls: 3x12\n• Tricep Dips: 3x12\n\nUse progressive overload by adding 2.5-5lbs per week or increasing reps. Track your RPE (Rate of Perceived Exertion) and aim for 7-9 on compound lifts. 🔥";
      }
    }

    if (lowerMessage.includes('bench press') && lowerMessage.includes('strength')) {
      return "To increase your bench press strength, focus on these key strategies:\n\n**1. Progressive Overload**\nIncrease weight by 2.5-5lbs every 1-2 weeks. If you can't add weight, add 1-2 reps.\n\n**2. Frequency**\nBench 2-3x per week with varied intensities (heavy/medium/light).\n\n**3. Accessory Work**\n• Close-grip bench press (triceps)\n• Incline press (upper chest)\n• Dumbbell press (stabilizers)\n• Tricep dips\n\n**4. Form Check**\n• Retract shoulder blades\n• Arch your lower back slightly\n• Plant feet firmly\n• Bar path: straight down to mid-chest\n\n**5. Deload Week**\nEvery 4-6 weeks, reduce volume by 40% to allow recovery.\n\nWhat's your current bench weight? I can help create a specific progression plan! 💪";
    }

    if (lowerMessage.includes('post-workout meal') || (lowerMessage.includes('eat') && lowerMessage.includes('workout'))) {
      return "Great question! Post-workout nutrition is crucial for recovery and muscle growth:\n\n**Ideal Post-Workout Meal (within 2 hours):**\n\n🍗 **Protein (20-40g)**\n• Chicken breast\n• Salmon\n• Greek yogurt\n• Protein shake\n• Eggs\n\n🍚 **Carbs (40-80g)**\n• White rice\n• Sweet potato\n• Oats\n• Pasta\n• Fruit\n\n**Sample Meals:**\n1. Grilled chicken (6oz) + white rice (1 cup) + veggies\n2. Protein shake + banana + oats\n3. Salmon (5oz) + sweet potato + broccoli\n4. Greek yogurt (2 cups) + berries + granola\n\n**Pro Tip:** " + (experienceLevel === 'Beginner' 
        ? "Don't overthink it! Just get protein and carbs within a few hours of training. Whole foods are best!" 
        : "Optimize your post-workout window by having fast-digesting protein and high-GI carbs to spike insulin and shuttle nutrients to muscles. Consider adding 5g creatine here too.") + " 🍎";
    }

    if (lowerMessage.includes('sore') && (lowerMessage.includes('overtraining') || lowerMessage.includes('every day'))) {
      return "Constant soreness can be a sign of inadequate recovery. Let's assess:\n\n**Signs of Overtraining:**\n✓ Persistent muscle soreness (3+ days)\n✓ Declining performance\n✓ Fatigue and low energy\n✓ Poor sleep quality\n✓ Increased resting heart rate\n✓ Mood changes/irritability\n\n**Recovery Strategies:**\n\n**1. Sleep** - Aim for 7-9 hours\n**2. Nutrition** - Eat at maintenance or slight surplus\n**3. Deload** - Reduce volume by 40-50% for 1 week\n**4. Active Recovery** - Light walking, stretching, yoga\n**5. Hydration** - 0.5-1oz per lb bodyweight daily\n\n**Soreness vs. Injury:**\n• DOMS (Delayed Onset Muscle Soreness) = normal, peaks 24-72hrs\n• Sharp pain = potential injury, rest immediately\n\n" + (userProfile.lastWorkoutDaysAgo === 0 
        ? "I see you worked out today. Consider taking tomorrow as a rest or active recovery day!" 
        : "Try implementing a deload week and see how you feel. Recovery is when growth happens! 💤");
    }

    if (lowerMessage.includes('progressive overload')) {
      if (experienceLevel === 'Beginner') {
        return "**Progressive Overload for Beginners 📈**\n\nProgressive overload means gradually increasing the stress on your muscles over time. It's the key to getting stronger!\n\n**Simple Ways to Progress:**\n\n1. **Add Weight** (easiest)\n   Example: Squatting 135lbs → 140lbs next week\n\n2. **Add Reps**\n   Example: 3 sets of 8 → 3 sets of 9 → 3 sets of 10\n\n3. **Add Sets**\n   Example: 3 sets → 4 sets\n\n**How to Apply It:**\n• Week 1: Squat 3x8 @ 135lbs\n• Week 2: Squat 3x9 @ 135lbs\n• Week 3: Squat 3x10 @ 135lbs\n• Week 4: Squat 3x8 @ 140lbs ← restart cycle\n\n**Golden Rule:** Only progress if you can do ALL reps with good form!\n\nStart tracking your workouts in FareFit to see your progress over time! 💪";
      } else {
        return "**Advanced Progressive Overload Strategies 📊**\n\nYou know the basics — let's dive deeper into periodization and advanced tactics:\n\n**1. Wave Loading**\nVary intensity weekly:\n• Week 1: 4x6 @ 80% 1RM\n• Week 2: 4x8 @ 75% 1RM\n• Week 3: 4x10 @ 70% 1RM\n• Week 4: Deload (50% volume)\n\n**2. RPE Progression**\nIncrease effort over weeks:\n• Week 1-2: RPE 7\n• Week 3-4: RPE 8\n• Week 5-6: RPE 9\n• Week 7: Deload\n\n**3. Volume Landmarks**\nTrack total tonnage (sets × reps × weight):\n• Aim for 10-20% volume increase every 4 weeks\n\n**4. Tempo Manipulation**\n• Increase time under tension: 3-1-1-0 → 4-1-1-0\n\n**5. Advanced Techniques**\n• Drop sets\n• Rest-pause sets\n• Cluster sets\n\nRemember: Progress isn't always linear. Respect deload weeks and listen to your body. 🔥";
      }
    }

    // Contextual responses based on user profile
    if (lowerMessage.includes('workout') && lowerMessage.includes('today')) {
      if (userProfile.hasWorkedOutToday) {
        return `Nice job on your ${userProfile.todayWorkout}! 💪\n\nSince you've already trained today, let's focus on recovery:\n\n**Post-Workout Checklist:**\n✓ Protein shake or meal within 2 hours\n✓ Hydrate (16-24oz water)\n✓ Light stretching or foam rolling\n✓ Get 7-9 hours of sleep tonight\n\nWant me to review form tips for your next push workout or plan tomorrow's session?`;
      } else {
        return "I noticed you haven't logged a workout today. No worries! Let's plan a great session:\n\n**What type of workout interests you today?**\n• Push (Chest, Shoulders, Triceps)\n• Pull (Back, Biceps)\n• Legs\n• Full Body\n• Cardio/Conditioning\n\nLet me know and I'll build you a complete workout! 🔥";
      }
    }

    if (lowerMessage.includes('meal') || lowerMessage.includes('eat today')) {
      return `Based on your current goal (${userProfile.currentGoal}), here are 3 meal ideas:\n\n**Option 1: High Protein Bowl**\n• 6oz grilled chicken\n• 1 cup quinoa\n• Roasted vegetables\n• Avocado\n≈ 650 cal | 50g protein\n\n**Option 2: Power Breakfast**\n• 4 whole eggs scrambled\n• 2 slices whole grain toast\n• Greek yogurt with berries\n≈ 580 cal | 40g protein\n\n**Option 3: Post-Workout Fuel**\n• 8oz salmon\n• Sweet potato (large)\n• Steamed broccoli\n• Olive oil drizzle\n≈ 720 cal | 55g protein\n\n` + (userProfile.currentGoal === 'Lean Bulk' 
        ? "For lean bulk, aim for a 200-300 calorie surplus with high protein! 💪" 
        : "These meals support your fitness goals while keeping you satisfied! 🍎");
    }

    // Default response
    return "That's a great question! I'm here to help with:\n\n• Workout programming and planning\n• Strength and muscle building advice\n• Nutrition and meal planning\n• Recovery and injury prevention\n• Form checks and technique tips\n• Motivation and accountability\n\nCould you provide more details about what you'd like help with? The more specific you are, the better I can assist! 💪";
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(textToSend),
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleExampleClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8F4F2' }}>
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: '#102A43' }} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6" style={{ color: '#1C7C54' }} />
                  <h1 style={{ color: '#102A43' }}>Coach AI</h1>
                </div>
                <p className="text-sm mt-1" style={{ color: '#102A43', opacity: 0.7 }}>
                  Your personal training assistant
                </p>
              </div>
            </div>

            {/* Experience Level Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-gray-50"
                style={{ borderColor: '#A8E6CF', backgroundColor: 'white' }}
              >
                <span className="text-sm" style={{ color: '#102A43' }}>
                  Level: <span style={{ color: '#1C7C54' }}>{experienceLevel}</span>
                </span>
                <ChevronDown className="w-4 h-4" style={{ color: '#102A43', opacity: 0.6 }} />
              </button>

              {isLevelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20" style={{ borderColor: '#A8E6CF' }}>
                  {(['Beginner', 'Intermediate', 'Advanced'] as ExperienceLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setExperienceLevel(level);
                        setIsLevelDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      style={{
                        backgroundColor: experienceLevel === level ? '#E8F4F2' : 'white',
                        color: experienceLevel === level ? '#1C7C54' : '#102A43'
                      }}
                    >
                      <div className="text-sm">{level}</div>
                      <div className="text-xs mt-0.5" style={{ opacity: 0.7 }}>
                        {level === 'Beginner' && 'Simple language & basics'}
                        {level === 'Intermediate' && 'RPE, progressive overload'}
                        {level === 'Advanced' && 'Mesocycles, periodization'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 overflow-hidden">
        {/* Profile Summary Card */}
        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm flex-shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Today's Activity</p>
              <p className="text-sm" style={{ color: '#1C7C54' }}>
                {userProfile.todayWorkout}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Current Goal</p>
              <p className="text-sm" style={{ color: '#102A43' }}>
                {userProfile.currentGoal}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Fitness Level</p>
              <p className="text-sm" style={{ color: '#102A43' }}>
                {userProfile.fitnessLevel}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Consistency</p>
              <p className="text-sm" style={{ color: '#FFB6B9' }}>
                +{userProfile.consistencyImprovement}% this month 📈
              </p>
            </div>
          </div>
        </div>

        {/* Example Questions */}
        <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm flex-shrink-0">
          <p className="text-sm mb-3" style={{ color: '#102A43', opacity: 0.8 }}>
            💡 Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(question)}
                className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm border transition-all hover:shadow-md hover:bg-white hover:-translate-y-1 active:translate-y-0"
                style={{
                  borderColor: '#A8E6CF',
                  backgroundColor: '#E8F4F2',
                  color: '#102A43'
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col overflow-hidden" style={{ height: '600px' }}>
          {/* Messages Container with Manual Scroll */}
          <div className="flex-1 overflow-y-auto p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 break-words ${
                      message.sender === 'user'
                        ? 'rounded-br-sm'
                        : 'rounded-bl-sm'
                    }`}
                    style={{
                      backgroundColor: message.sender === 'user' ? '#1C7C54' : '#F5F5F5',
                      color: message.sender === 'user' ? 'white' : '#102A43'
                    }}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.text}
                    </div>
                    <p
                      className="text-xs mt-2"
                      style={{
                        opacity: 0.6,
                        color: message.sender === 'user' ? 'white' : '#102A43'
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
                    className="rounded-2xl rounded-bl-sm px-4 py-3"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="border-t px-4 sm:px-6 py-3 flex-shrink-0" style={{ borderColor: '#E8F4F2' }}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-all hover:shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                    style={{
                      borderColor: '#A8E6CF',
                      backgroundColor: 'white',
                      color: '#102A43'
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: '#1C7C54' }} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t p-4 flex-shrink-0" style={{ borderColor: '#E8F4F2', backgroundColor: 'white' }}>
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border outline-none transition-all focus:border-opacity-100 text-sm sm:text-base"
                style={{
                  borderColor: '#A8E6CF',
                  backgroundColor: 'white',
                  color: '#102A43'
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md flex items-center justify-center"
                style={{
                  backgroundColor: '#1C7C54',
                  color: 'white'
                }}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}