import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'barry';
  timestamp: Date;
}

interface BarryChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BarryChat({ isOpen, onClose }: BarryChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there 👋 I'm Barry, your AI help assistant! I've got your back with anything FareFit-related. What can I help you with today?",
      sender: 'barry',
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

  const quickQuestions = [
    "How do I log a meal?",
    "What's my Fitness Credit Score?",
    "How to reset my password?",
    "Can I scan barcodes?"
  ];

  const getBarryResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Password reset
    if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
      return "No worries, it's easy! Just go to Settings > Account Security > Change Password. Enter your current password, then create a new one. You'll get a confirmation email once it's updated. 🔒";
    }

    // Food logging
    if (lowerMessage.includes('log') && (lowerMessage.includes('meal') || lowerMessage.includes('food'))) {
      return "Great question! Head to the Food Assistant card on your dashboard, then click 'Log Meal'. You can search for foods, scan barcodes, or even snap a photo and I'll identify it for you! 📸🍎";
    }

    // Barcode scanning
    if (lowerMessage.includes('barcode') || lowerMessage.includes('scan')) {
      return "Yes! You can totally scan barcodes 📱 Just use the Food Assistant card on your dashboard and hit 'Scan Barcode'. Point your camera at any packaged food and boom — instant nutrition data logged. Pretty cool, right? 😎";
    }

    // Fitness Credit Score
    if (lowerMessage.includes('fitness') && (lowerMessage.includes('score') || lowerMessage.includes('credit'))) {
      return "Your Fitness Credit Score is like your health report card! 📊 It tracks consistency (logging meals/workouts), hitting macro goals, workout frequency, and calorie balance over the past 30 days. The more consistent you are, the higher it goes! Keep crushing it 💪";
    }

    // Score going down
    if (lowerMessage.includes('score') && (lowerMessage.includes('down') || lowerMessage.includes('drop') || lowerMessage.includes('lower'))) {
      return "Ah, I see! Your score might drop from inconsistent logging, missing workout days, or going way over your calorie goals. But don't sweat it — just get back on track! Check your Progress page for detailed insights. Small daily wins add up! 📈";
    }

    // AI features
    if (lowerMessage.includes('food ai') || lowerMessage.includes('coach ai') || lowerMessage.includes('ai')) {
      return "Ooh, AI talk! 🤖 Food AI helps you identify meals from photos, suggest recipes, and track nutrition. Coach AI analyzes your workouts, estimates calories burned, and gives you personalized tips. We're all here to help you crush your goals! You can also ask Coach AI for a daily workout plan if you'd like.";
    }

    // Workout logging
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return "Let's get moving! 🏋️ Click the 'Log Workout' button in your Workout Overview card. You can describe your exercise in the notes-style editor, and Coach AI will estimate calories burned. Or manually enter your data if you have it from a fitness tracker. That's progress! Keep logging consistently 💪";
    }

    // Edit meal
    if (lowerMessage.includes('edit') && lowerMessage.includes('meal')) {
      return "Easy peasy! In the 'Meals Today' card, just click on any meal entry. You can adjust portion sizes, swap ingredients, or delete it entirely. Your calorie total updates automatically — pretty slick! 🍽️";
    }

    // Goals/changing goals
    if (lowerMessage.includes('goal') || lowerMessage.includes('change')) {
      return "Changing goals? No problem! Navigate to Dashboard > 'Set Your Fitness Goal' card at the bottom. Update your target weight, activity level, or calorie goals and changes take effect immediately. You got this! 🎯";
    }

    // Privacy/data
    if (lowerMessage.includes('privacy') || lowerMessage.includes('data') || lowerMessage.includes('secure')) {
      return "Your data is totally safe with us! 🔐 Everything is encrypted and stored securely. We never sell your info to third parties. Only you can access your nutrition and fitness logs. Want to export your data? Just head to Settings > Privacy > Export Data.";
    }

    // Default helpful response
    return "Hmm, I'm not 100% sure about that one, but I'm always learning! 🧠 Try rephrasing your question, or check out the FAQ categories above. You can also reach out to our support team at support@farefit.ai — they're awesome! Is there anything else I can help with?";
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

    // Simulate Barry thinking
    setTimeout(() => {
      const barryResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBarryResponse(inputValue),
        sender: 'barry',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, barryResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader 
          className="px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: '#A8E6CF', backgroundColor: '#1C7C54' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white">Barry</SheetTitle>
                <SheetDescription className="text-xs text-white" style={{ opacity: 0.8 }}>
                  Your AI Help Assistant
                </SheetDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.sender === 'user'
                    ? 'text-gray-800'
                    : 'text-white'
                }`}
                style={{
                  backgroundColor: message.sender === 'barry' ? 'var(--accent-primary)' : 'var(--bg-primary)'
                }}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p 
                  className="text-xs mt-1"
                  style={{ 
                    opacity: 0.6,
                    color: message.sender === 'barry' ? 'white' : 'var(--text-primary)'
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
                className="max-w-[80%] rounded-lg px-4 py-3 text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
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

        {/* Quick Questions (only show at start) */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t flex-shrink-0" style={{ borderColor: '#A8E6CF', backgroundColor: 'white' }}>
            <p className="text-xs mb-2" style={{ color: '#102A43', opacity: 0.7 }}>
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all hover:bg-gray-50"
                  style={{ borderColor: '#A8E6CF', color: '#1C7C54' }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: '#A8E6CF', backgroundColor: 'white' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Barry anything..."
              className="flex-1 px-4 py-2 border rounded-md text-sm"
              style={{ borderColor: '#A8E6CF' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-4 py-2 rounded-md text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#1C7C54' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: '#102A43', opacity: 0.5 }}>
            Psst! Barry's learning from your progress — soon he'll share insights right on your dashboard.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}