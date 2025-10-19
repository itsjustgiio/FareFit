import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Dumbbell, Apple, Moon, Target, Sparkles, ChevronDown, TrendingUp, AlertCircle } from 'lucide-react';
import { Footer } from './Footer';
import { FeedbackModal } from './FeedbackModal';
import { getGeminiService } from '../services/geminiService';
import { analyzeWorkoutHistory, buildWorkoutContext, WorkoutAnalysis } from '../services/workoutAnalysisService';
import { getWorkoutHistory, getUserFitnessGoals } from '../userService';
import { getAuth } from 'firebase/auth';

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

  // Real user data from Firebase
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [workoutAnalysis, setWorkoutAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // Mock user data (keeping for backward compatibility)
  const userProfile = {
    todayWorkout: workoutHistory.length > 0 ? workoutHistory[0].day_type || 'Workout Logged' : 'No workout today',
    fitnessLevel: experienceLevel,
    currentGoal: userGoals?.goal_type || 'Loading...',
    hasWorkedOutToday: workoutAnalysis ? workoutAnalysis.daysSinceLastWorkout === 0 : false,
    lastWorkoutDaysAgo: workoutAnalysis?.daysSinceLastWorkout || 0,
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

  // Fetch user workout data and analysis on mount
  useEffect(() => {
    const fetchUserContext = async () => {
      const auth = getAuth();
      if (!auth.currentUser) {
        console.log('No user logged in for Coach AI');
        setIsLoadingContext(false);
        return;
      }

      try {
        console.log('📊 Fetching workout history for Coach AI...');

        // Fetch workout history and user goals
        const [workouts, goals] = await Promise.all([
          getWorkoutHistory(auth.currentUser.uid),
          getUserFitnessGoals(auth.currentUser.uid)
        ]);

        console.log(`✅ Loaded ${workouts.length} workouts for Coach AI`);

        setWorkoutHistory(workouts);
        setUserGoals(goals);

        // Analyze workout history if available
        if (workouts.length > 0) {
          const analysis = analyzeWorkoutHistory(workouts);
          setWorkoutAnalysis(analysis);
          console.log('✅ Workout analysis complete:', {
            totalWorkouts: analysis.totalWorkouts,
            totalVolume: analysis.totalVolume,
            plateaus: analysis.plateaus.length,
            recommendations: analysis.recommendations.length
          });
        }
      } catch (error) {
        console.error('❌ Error fetching user context:', error);
      } finally {
        setIsLoadingContext(false);
      }
    };

    fetchUserContext();
  }, []);

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

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const auth = getAuth();
      if (!auth.currentUser || !userGoals || !workoutAnalysis) {
        // Fallback if no user data available
        return "I'm here to help! However, I need your workout history to provide personalized advice. Start logging workouts in FareFit and I'll be able to give you specific, data-driven recommendations! 💪";
      }

      // Build complete workout context
      const workoutContext = buildWorkoutContext(workoutHistory, workoutAnalysis);

      console.log('🤖 Calling Coach AI with full workout history...');

      // Call Gemini AI with full context
      const geminiService = getGeminiService();
      const response = await geminiService.getEnhancedCoachAdvice(
        userMessage,
        {
          goalType: userGoals.goal_type || 'maintain',
          age: userGoals.age || 25,
          weight: userGoals.weight || 150,
          workoutContext: workoutContext
        }
      );

      console.log('✅ Coach AI response received');
      return response;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      return "I apologize, but I'm having trouble connecting right now. Please try again in a moment. In the meantime, keep crushing your workouts! 💪";
    }
  };

  const handleSendMessage = async (messageText?: string) => {
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

    // Get AI response
    try {
      const aiText = await generateAIResponse(textToSend);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble responding right now. Please try again! 💪",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExampleClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

        {/* Workout Insights Panel */}
        {workoutAnalysis && workoutAnalysis.totalWorkouts > 0 && (
          <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" style={{ color: '#1C7C54' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#102A43' }}>
                Workout Insights
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Total Workouts</p>
                <p className="text-lg font-bold" style={{ color: '#1C7C54' }}>
                  {workoutAnalysis.totalWorkouts}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Total Volume</p>
                <p className="text-lg font-bold" style={{ color: '#1C7C54' }}>
                  {(workoutAnalysis.totalVolume / 1000).toFixed(1)}k lbs
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Avg Duration</p>
                <p className="text-lg font-bold" style={{ color: '#1C7C54' }}>
                  {workoutAnalysis.averageDuration} min
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#102A43', opacity: 0.6 }}>Last Workout</p>
                <p className="text-lg font-bold" style={{ color: workoutAnalysis.daysSinceLastWorkout > 3 ? '#FFB6B9' : '#1C7C54' }}>
                  {workoutAnalysis.daysSinceLastWorkout === 0 ? 'Today' : `${workoutAnalysis.daysSinceLastWorkout}d ago`}
                </p>
              </div>
            </div>

            {/* Plateaus Warning */}
            {workoutAnalysis.plateaus.length > 0 && (
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#FFF4E6', borderLeft: '3px solid #FFB6B9' }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FFB6B9' }} />
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#102A43' }}>
                      Plateaus Detected ({workoutAnalysis.plateaus.length})
                    </p>
                    <div className="space-y-1">
                      {workoutAnalysis.plateaus.slice(0, 2).map((plateau, idx) => (
                        <p key={idx} className="text-xs" style={{ color: '#102A43', opacity: 0.8 }}>
                          • {plateau.exercise}: {plateau.suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {workoutAnalysis.recommendations.length > 0 && (
              <div className="rounded-lg p-3" style={{ backgroundColor: '#E8F4F2' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#1C7C54' }}>
                  💡 Recommendations
                </p>
                <div className="space-y-1">
                  {workoutAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                    <p key={idx} className="text-xs" style={{ color: '#102A43', opacity: 0.8 }}>
                      • {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                onKeyDown={handleKeyDown}
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