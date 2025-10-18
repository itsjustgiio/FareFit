import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Apple, TrendingUp, ChefHat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  loggedMacros: LoggedMacros;
}

export function FoodAssistantPage({ onBack, userGoal, loggedMacros }: FoodAssistantPageProps) {
  // Calculate remaining macros
  const remainingMacros = {
    calories: userGoal ? userGoal.targetCalories - loggedMacros.calories : 750,
    protein: userGoal ? userGoal.protein - loggedMacros.protein : 70,
    carbs: userGoal ? userGoal.carbs - loggedMacros.carbs : 80,
    fat: userGoal ? userGoal.fat - loggedMacros.fat : 25,
    fiber: 30 - loggedMacros.fiber,
  };

  const goalType = userGoal?.goalType || 'maintain';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey there! 🍎 I'm your Food Assistant, here to help you hit your macro goals with smart meal suggestions.\n\nBased on your current progress today, you have **${remainingMacros.calories} calories** left with **${remainingMacros.protein}g protein**, **${remainingMacros.carbs}g carbs**, and **${remainingMacros.fat}g fat** remaining.\n\nWhat would you like help with?`,
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

User’s current macro data:
Calories left: ${remainingMacros.calories}
Protein left: ${remainingMacros.protein}g
Carbs left: ${remainingMacros.carbs}g
Fat left: ${remainingMacros.fat}g
Fiber left: ${remainingMacros.fiber}g
Goal type: ${goalType}

Your job:
1. Analyze their nutrition and give tailored meal/snack suggestions.
2. Identify missing nutrients or imbalances.
3. Suggest 2–3 specific foods or meal ideas to balance the day.
4. Keep your tone casual, motivational, and concise (1–2 short paragraphs).
5. Use markdown for formatting (bold, bullet points, headers).
6. If any food requires macros lookup, use Google Search grounding to check typical values before answering.
`;

      // Streaming Gemini call
      const gemini = getGeminiService();
      const stream = await gemini.streamChat(
        [{ role: 'user', parts: [{ text: systemPrompt }] }],
        'gemini-2.5-flash'
      );

      let accumulated = '';
      for await (const chunk of stream) {
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === newAssistant.id ? { ...m, text: accumulated } : m))
        );
      }
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: '⚠️ Sorry, something went wrong while contacting the AI.',
          sender: 'assistant',
          timestamp: new Date(),
        },
      ]);
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

      {/* Macro Status */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="rounded-lg p-6 mb-6 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--farefit-card)',
            border: '1px solid var(--farefit-secondary)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
            <h3 className="m-0" style={{ color: 'var(--farefit-text)' }}>
              Today's Macro Status
            </h3>
          </div>

          {userGoal ? (
            <>
              <div
                className="mb-4 pb-4 border-b transition-colors duration-300"
                style={{ borderColor: 'var(--farefit-secondary)' }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--farefit-subtext)' }}>
                  Goal:{' '}
                  <span
                    style={{
                      color: 'var(--farefit-primary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {goalType}
                  </span>{' '}
                  ({userGoal.targetCalories} kcal/day)
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  ['Remaining', remainingMacros.calories, remainingMacros.calories < 0 ? 'over' : 'kcal left'],
                  ['Protein', remainingMacros.protein, `${loggedMacros.protein}/${userGoal.protein}g`],
                  ['Carbs', remainingMacros.carbs, `${loggedMacros.carbs}/${userGoal.carbs}g`],
                  ['Fat', remainingMacros.fat, `${loggedMacros.fat}/${userGoal.fat}g`],
                  ['Fiber', remainingMacros.fiber, `${loggedMacros.fiber}/30g`],
                ].map(([label, value, sub], i) => (
                  <div key={i}>
                    <p className="text-sm mb-1" style={{ color: 'var(--farefit-subtext)' }}>
                      {label}
                    </p>
                    <p
                      className="text-2xl"
                      style={{
                        color: Number(value) < 0 ? 'var(--farefit-accent)' : 'var(--farefit-primary)',
                      }}
                    >
                      {Math.abs(value as number)}{label === 'Remaining' ? '' : 'g'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--farefit-subtext)' }}>
                      {sub}
                    </p>
                  </div>
                ))}
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