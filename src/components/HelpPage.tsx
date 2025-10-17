import { useState } from 'react';
import { ArrowLeft, Search, MessageCircle, Settings, Apple, Brain, Dumbbell, TrendingUp, Shield, Mail, Bug, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Footer } from './Footer';
import { BarryChat } from './BarryChat';
import { FeedbackModal } from './FeedbackModal';

interface HelpPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

interface Question {
  question: string;
  answer: string;
}

export function HelpPage({ onBack, onNavigate, onFeedbackClick }: HelpPageProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isBarryOpen, setIsBarryOpen] = useState(false);

  const helpCategories = [
    {
      icon: Settings,
      title: 'Account & Settings',
      description: 'Manage your profile, goals, and preferences',
      questions: [
        {
          question: 'How do I reset my password?',
          answer: 'Go to Settings > Account Security > Change Password. Enter your current password, then create a new one. You\'ll receive a confirmation email once it\'s updated.'
        },
        {
          question: 'How can I change my goals?',
          answer: 'Navigate to Dashboard > Set Your Fitness Goal card at the bottom. Update your target weight, activity level, or calorie goals. Changes take effect immediately.'
        },
        {
          question: 'Update notification settings',
          answer: 'Head to Settings > Notifications to customize when and how you receive reminders for meals, workouts, and AI tips. Toggle specific alerts on or off.'
        }
      ]
    },
    {
      icon: Apple,
      title: 'Food Logging',
      description: 'Track meals and manage your nutrition',
      questions: [
        {
          question: 'Can I scan barcodes?',
          answer: 'Yes! Use the Food Assistant card on your dashboard. Click "Scan Barcode" and point your camera at any packaged food to instantly log nutrition data.'
        },
        {
          question: 'How do I edit a logged meal?',
          answer: 'In the "Meals Today" card, click on any meal entry. You can adjust portion sizes, swap ingredients, or delete the meal entirely. Changes update your calorie total automatically.'
        },
        {
          question: 'Track custom recipes',
          answer: 'Use Food AI to create custom recipes. Enter all ingredients and serving sizes, and the AI will calculate total macros and save it to your recipe library for quick logging.'
        }
      ]
    },
    {
      icon: Brain,
      title: 'AI Assistants',
      description: 'Learn about Food AI and Coach AI features',
      questions: [
        {
          question: 'What\'s Food AI?',
          answer: 'Food AI is your smart nutrition assistant. It can identify foods from photos, suggest meal ideas based on your macros, and help you build custom recipes with accurate calorie tracking.'
        },
        {
          question: 'What can Coach AI do?',
          answer: 'Coach AI analyzes your workout logs, estimates calories burned, suggests improvements to your fitness routine, and provides personalized tips based on your progress and goals.'
        },
        {
          question: 'How to get personalized tips',
          answer: 'The AI Tip Banner shows smart suggestions based on your daily activity. For deeper insights, chat with Coach AI or Food AI directly—they learn from your habits over time.'
        }
      ]
    },
    {
      icon: Dumbbell,
      title: 'Workouts & Recovery',
      description: 'Log exercises and track your fitness',
      questions: [
        {
          question: 'How do I track rest days?',
          answer: 'In the Workout Overview card, click "Log Workout" and select "Rest Day" from the activity type. This helps maintain your fitness score by showing consistent recovery patterns.'
        },
        {
          question: 'Can I add custom workouts?',
          answer: 'Absolutely! Click "Log Workout" and use the notes-style editor to describe your exercise. Coach AI will estimate calories burned, or you can manually enter the data.'
        },
        {
          question: 'Log workout calories',
          answer: 'After logging a workout, Coach AI automatically estimates calories burned. You can also manually adjust this number if you have data from a fitness tracker or heart rate monitor.'
        }
      ]
    },
    {
      icon: TrendingUp,
      title: 'Fitness Credit Score',
      description: 'Understand your progress metrics',
      questions: [
        {
          question: 'What affects my score?',
          answer: 'Your Fitness Credit Score is based on consistency (logging meals/workouts), hitting macro goals, workout frequency, calorie balance, and overall trend over the past 30 days.'
        },
        {
          question: 'Why did it go down?',
          answer: 'Scores drop from inconsistent logging, missing workout days, exceeding calorie goals significantly, or not meeting protein/macro targets. Check your Progress page for detailed insights.'
        },
        {
          question: 'How to improve my score',
          answer: 'Log meals and workouts daily, hit your protein target, maintain a calorie deficit (if losing weight), exercise 3-5 times per week, and stay consistent. Small daily wins add up!'
        }
      ]
    },
    {
      icon: Shield,
      title: 'Privacy & Data',
      description: 'Your data security and privacy options',
      questions: [
        {
          question: 'Is my nutrition data private?',
          answer: 'Yes. All your data is encrypted and stored securely. We never sell your information to third parties. Only you can access your nutrition and fitness logs.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Go to Settings > Account > Delete Account. This permanently removes all your data from our servers. You\'ll receive a confirmation email before final deletion.'
        },
        {
          question: 'Export my data',
          answer: 'Visit Settings > Privacy > Export Data to download a complete copy of your nutrition logs, workouts, and progress history in CSV or JSON format.'
        }
      ]
    }
  ];



  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="shadow-sm" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--accent-light)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-primary)' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="mb-3" style={{ color: 'var(--text-primary)' }}>Help Center</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Hi there 👋 Let's get you the help you need.
          </p>
        </div>

        {/* Search / Ask Barry Section */}
        <div className="rounded-lg p-6 sm:p-8 shadow-sm mb-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-primary)', opacity: 0.4 }} />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-3 border rounded-md"
                style={{ borderColor: 'var(--accent-light)' }}
              />
            </div>
            <div className="text-center">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>or</span>
            </div>
            <button
              onClick={() => setIsBarryOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Sparkles className="w-5 h-5" />
              <span>Ask Barry</span>
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
              Barry's your friendly AI assistant — he's got your back! 💪
            </p>
          </div>
        </div>

        {/* Common Topics */}
        <div className="mb-10">
          <h2 className="mb-6" style={{ color: 'var(--text-primary)' }}>Common Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#1C7C5420' }}
                >
                  <category.icon className="w-6 h-6" style={{ color: '#1C7C54' }} />
                </div>
                <h3 className="mb-2" style={{ color: 'var(--text-primary)' }}>{category.title}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {category.description}
                </p>
                <div className="space-y-2">
                  {category.questions.map((q, qIndex) => {
                    const questionId = `${categoryIndex}-${qIndex}`;
                    const isExpanded = expandedQuestion === questionId;
                    
                    return (
                      <div key={qIndex}>
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : questionId)}
                          className="w-full text-left flex items-start justify-between gap-2 p-2 rounded hover:bg-gray-50 transition-colors group"
                        >
                          <span className="text-sm flex-1" style={{ color: '#1C7C54' }}>
                            {q.question}
                          </span>
                          <ChevronDown 
                            className="w-4 h-4 flex-shrink-0 transition-transform mt-0.5"
                            style={{ 
                              color: '#1C7C54',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div 
                                className="pl-4 pr-2 py-2 text-sm leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {q.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting & Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Troubleshooting */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <h3 className="mb-4" style={{ color: 'var(--text-primary)' }}>Troubleshooting</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>App not syncing?</span>
                <button 
                  className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#A8E6CF', color: 'var(--text-primary)' }}
                >
                  Refresh Data
                </button>
              </div>
              <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Missing meals or workouts?</span>
                <button 
                  className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#A8E6CF', color: 'var(--text-primary)' }}
                >
                  Recalculate
                </button>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: 'var(--text-primary)' }}>Found a bug?</span>
                <button 
                  className="px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#FFB6B9', color: 'var(--text-primary)' }}
                >
                  <Bug className="w-4 h-4" />
                  Report Issue
                </button>
              </div>
            </div>
          </div>

          {/* Email Support */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FFB6B920' }}
            >
              <Mail className="w-6 h-6" style={{ color: '#FFB6B9' }} />
            </div>
            <h3 className="mb-2" style={{ color: 'var(--text-primary)' }}>Email Support</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Reach out to our team for personalized help
            </p>
            <a 
              href="mailto:support@farefit.ai"
              className="inline-block px-4 py-2 rounded-md border transition-all hover:bg-gray-50"
              style={{ borderColor: 'var(--accent-light)', color: '#1C7C54' }}
            >
              support@farefit.ai
            </a>
          </div>
        </div>
      </div>

      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
      
      {/* Barry Chat Drawer */}
      <BarryChat isOpen={isBarryOpen} onClose={() => setIsBarryOpen(false)} />
    </div>
  );
}