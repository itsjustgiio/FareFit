import { ArrowLeft, FileText, CheckCircle, User, Shield, Lightbulb, AlertTriangle, Lock, CreditCard, RefreshCw, XCircle, Scale, Mail } from 'lucide-react';
import { Footer } from './Footer';

interface TermsPageProps {
  onBack: () => void;
  onNavigate: (page: 'dashboard' | 'progress' | 'help' | 'privacy' | 'terms' | 'fitness-goal' | 'coach-ai') => void;
  onFeedbackClick: () => void;
}

export function TermsPage({ onBack, onNavigate, onFeedbackClick }: TermsPageProps) {
  const sections = [
    {
      number: 1,
      icon: CheckCircle,
      title: 'Acceptance of Terms',
      content: [
        'By accessing or using FareFit, you agree to these Terms of Use and our Privacy Policy.',
        'If you don\'t agree, please stop using the app.',
        'FareFit may update these terms occasionally — we\'ll notify you if major changes occur.'
      ]
    },
    {
      number: 2,
      icon: User,
      title: 'Eligibility & Accounts',
      content: [
        'To use FitPanel, you must be at least 13 years old and capable of forming a legal agreement.',
        'You\'re responsible for maintaining the confidentiality of your account credentials.',
        'You agree not to share your account or use another user\'s credentials.'
      ]
    },
    {
      number: 3,
      icon: AlertTriangle,
      title: 'App Purpose (Fitness Disclaimer)',
      highlight: true,
      content: [
        'FareFit provides nutrition and fitness tracking tools, AI-powered insights, and educational content.',
        'It is not a substitute for professional medical advice, diagnosis, or treatment.',
        'Always consult a qualified health provider before making major changes to your diet or exercise routine.'
      ]
    },
    {
      number: 4,
      icon: Lightbulb,
      title: 'User Responsibilities',
      content: [
        'You agree to:',
        '• Provide accurate and truthful information.',
        '• Use the app for personal, non-commercial purposes.',
        '• Respect other users and our community guidelines (if applicable).',
        '• Not attempt to hack, reverse-engineer, or misuse the app\'s services.'
      ]
    },
    {
      number: 5,
      icon: FileText,
      title: 'Intellectual Property',
      content: [
        'All app content, including logos, graphics, text, AI systems, and design elements, are owned by FareFit.',
        'You may not copy, redistribute, or resell them without permission.',
        'However, the data you log (meals, workouts, notes) belongs to you.'
      ]
    },
    {
      number: 6,
      icon: Lock,
      title: 'Data & Privacy',
      content: [
        'Your data is handled according to our Privacy Policy.',
        'We process your information only to provide the app\'s core features (nutrition tracking, progress scoring, and AI recommendations).',
        'We do not sell or share personal information with third parties.'
      ]
    },
    {
      number: 7,
      icon: CreditCard,
      title: 'Subscription & Payment',
      content: [
        'If FareFit introduces paid features, you\'ll be informed before purchase.',
        'All payments will be processed securely and are non-refundable once the service period begins, unless required by law.'
      ]
    },
    {
      number: 8,
      icon: Shield,
      title: 'Limitation of Liability',
      content: [
        'FitPanel and its creators are not liable for any damages or losses arising from app usage, data inaccuracies, or downtime.',
        'By using the app, you understand that results are estimates and depend on your personal habits and input accuracy.'
      ]
    },
    {
      number: 9,
      icon: RefreshCw,
      title: 'Modifications & Updates',
      content: [
        'We may update or change FareFit\'s features, AI models, or Terms over time.',
        'When we make major updates, we\'ll let you know through the app or by email.',
        'Continued use after changes means you accept the new Terms.'
      ]
    },
    {
      number: 10,
      icon: XCircle,
      title: 'Termination of Use',
      content: [
        'You may delete your account at any time.',
        'FitPanel may suspend or terminate accounts that violate these terms or misuse the platform.'
      ]
    },
    {
      number: 11,
      icon: Scale,
      title: 'Governing Law',
      content: [
        'These Terms are governed by the laws of the United States and the State of New York.',
        'Any disputes will be handled in accordance with applicable laws.'
      ]
    },
    {
      number: 12,
      icon: Mail,
      title: 'Contact Us',
      content: [
        'Have questions about these Terms?',
        '📧 Contact us at legal@farefit.ai'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-card-bg)', borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Title Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <FileText className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ color: 'var(--color-text)' }}>FitPanel Terms of Use</h1>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
            Last updated: <strong>October 2025</strong>
          </p>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg mb-2" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
              Welcome to FareFit!
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
              By using our app, you agree to these terms. Please read them carefully.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.number}
              className={`rounded-lg p-6 sm:p-8 shadow-sm ${
                section.highlight ? 'border-2' : ''
              }`}
              style={{
                backgroundColor: section.highlight ? '#FFB6B910' : 'var(--color-card-bg)',
                borderColor: section.highlight ? '#FFB6B9' : 'transparent'
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: section.highlight ? '#FFB6B920' : 'var(--color-primary-light)'
                  }}
                >
                  <section.icon
                    className="w-6 h-6"
                    style={{ color: section.highlight ? '#FFB6B9' : 'var(--color-primary)' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span
                      className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: section.highlight ? '#FFB6B920' : 'var(--color-primary-light)',
                        color: section.highlight ? '#FFB6B9' : 'var(--color-primary)'
                      }}
                    >
                      {section.number}
                    </span>
                    <h2 className="m-0" style={{ color: 'var(--color-text)' }}>
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {section.content.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-sm"
                        style={{
                          color: 'var(--color-text)',
                          opacity: 0.85,
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {section.highlight && (
                <div
                  className="mt-4 p-4 rounded-md"
                  style={{ backgroundColor: '#FFB6B920' }}
                >
                  <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                    ⚠️ <strong>Important:</strong> This section is crucial for your safety and our legal protection. Please read carefully.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-lg p-6 sm:p-8 shadow-sm text-center" style={{ backgroundColor: 'var(--color-card-bg)' }}>
          <h3 className="mb-4" style={{ color: 'var(--color-text)' }}>Questions about our Terms?</h3>
          <div className="flex flex-col items-center gap-4">
            <a
              href="mailto:legal@fitpanel.ai"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Mail className="w-5 h-5" />
              <span>legal@fitpanel.ai</span>
            </a>
            <p className="text-xs" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
              We're here to help clarify anything you need.
            </p>
          </div>
        </div>

        {/* Acceptance Footer */}
        <div
          className="mt-6 p-6 rounded-lg text-center"
          style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
            ✅ By continuing to use FareFit, you acknowledge that you have read, understood, and agree to these Terms of Use.
          </p>
        </div>
      </div>

      <Footer 
        onNavigate={onNavigate}
        onFeedbackClick={onFeedbackClick}
      />
    </div>
  );
}