import { motion } from 'motion/react';
import { Utensils, Dumbbell, TrendingUp, Star } from 'lucide-react';
import logoImage from 'figma:asset/77bf03e5d71328d3253fb9c4f7bef47edf94924a.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDemoLogin?: () => void;
}

export function LandingPage({ onGetStarted, onLogin, onDemoLogin }: LandingPageProps) {
  const features = [
    {
      icon: Utensils,
      title: 'Track Meals',
      description: 'Log your nutrition with AI assistance and smart macro tracking',
    },
    {
      icon: Dumbbell,
      title: 'Log Workouts',
      description: 'Record exercises and track progress with detailed analytics',
    },
    {
      icon: TrendingUp,
      title: 'See Results',
      description: 'Visualize your fitness journey with beautiful charts and insights',
    },
  ];

  const testimonials = [
    { name: 'Sarah M.', text: 'Lost 15 lbs in 2 months!', rating: 5 },
    { name: 'Mike T.', text: 'Best fitness tracker I\'ve used', rating: 5 },
    { name: 'Emma L.', text: 'The AI coach is incredible', rating: 5 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8F4F2' }}>
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#E8F4F2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="FareFit Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl" style={{ color: '#102A43' }}>FareFit</span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                className="transition-colors"
                style={{ color: '#102A43', opacity: 0.7 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
              >
                Features
              </a>
              <a 
                href="#why-farefit" 
                className="transition-colors"
                style={{ color: '#102A43', opacity: 0.7 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
              >
                About
              </a>
              {onDemoLogin && (
                <button
                  onClick={onDemoLogin}
                  className="transition-colors"
                  style={{ color: '#102A43', opacity: 0.7 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
                >
                  Demo
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Background shape */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, #A8E6CF 0%, transparent 50%)',
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Logo Icon */}
            <div className="flex justify-center mb-8">
              <img 
                src={logoImage} 
                alt="FareFit Logo" 
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
              />
            </div>

            {/* Headline with accent */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight" style={{ color: '#102A43' }}>
              Track your progress.
              <br />
              <span className="relative inline-block">
                Transform your habits.
                <div 
                  className="absolute bottom-2 left-0 right-0 h-3 -z-10 rounded"
                  style={{ backgroundColor: '#FFB6B9', opacity: 0.4 }}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto" style={{ color: '#2F3E46', opacity: 0.8 }}>
              Personalized fitness and nutrition insights — all in one place.
            </p>

            {/* Main Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl text-white text-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: '#1C7C54', boxShadow: '0 4px 14px rgba(28, 124, 84, 0.2)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3BB273'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1C7C54'}
              >
                Sign Up
              </button>
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl text-lg border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  borderColor: '#1C7C54', 
                  color: '#1C7C54',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C7C54';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1C7C54';
                }}
              >
                Log In
              </button>
            </div>

            {/* Demo Button */}
            {onDemoLogin && (
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-8" style={{ backgroundColor: '#102A43', opacity: 0.2 }} />
                <button
                  onClick={onDemoLogin}
                  className="text-sm px-6 py-2 rounded-full transition-all hover:shadow-md"
                  style={{ 
                    color: '#1C7C54',
                    backgroundColor: '#A8E6CF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C7C54';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#A8E6CF';
                    e.currentTarget.style.color = '#1C7C54';
                  }}
                >
                  ✨ Try Demo
                </button>
                <div className="h-px w-8" style={{ backgroundColor: '#102A43', opacity: 0.2 }} />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 sm:py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="group rounded-3xl p-8 text-center transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ 
                  backgroundColor: 'rgba(168, 230, 207, 0.15)',
                  boxShadow: '0 2px 8px rgba(16, 42, 67, 0.05)',
                  borderBottom: '2px solid transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = '#FFB6B9'}
                onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#A8E6CF' }}
                >
                  <feature.icon className="w-8 h-8 transition-colors" style={{ color: '#1C7C54' }} />
                </div>
                <h3 className="text-xl mb-3" style={{ color: '#102A43' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#2F3E46', opacity: 0.8 }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why FareFit Section */}
      <section 
        id="why-farefit" 
        className="py-16 sm:py-20"
        style={{ 
          background: 'linear-gradient(to bottom, #E8F4F2, #A8E6CF)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#102A43' }}>
              Why users love FareFit
            </h2>
            <p style={{ color: '#2F3E46', opacity: 0.8 }}>
              Join thousands who've transformed their health journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="rounded-2xl p-6 text-center"
                style={{ 
                  backgroundColor: 'white',
                  boxShadow: '0 2px 12px rgba(16, 42, 67, 0.08)'
                }}
              >
                <div className="flex justify-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#FFB6B9' }} />
                  ))}
                </div>
                <p className="mb-3 text-sm italic" style={{ color: '#102A43' }}>
                  "{testimonial.text}"
                </p>
                <p className="text-xs" style={{ color: '#102A43', opacity: 0.6 }}>
                  — {testimonial.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section 
        className="py-16 sm:py-20"
        style={{
          background: 'linear-gradient(90deg, #E8F4F2 0%, #FFB6B9 10%, #E8F4F2 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#102A43' }}>
              Start your journey to better health today
            </h2>
            <p className="text-lg mb-8" style={{ color: '#2F3E46', opacity: 0.8 }}>
              Join FareFit and take control of your fitness goals
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl text-white text-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: '#1C7C54' }}
              >
                Sign Up
              </button>
              <button
                onClick={() => window.location.href = '#features'}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl text-lg border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ 
                  borderColor: '#1C7C54', 
                  color: '#1C7C54',
                  backgroundColor: 'white'
                }}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: 'white', borderTop: '1px solid #FFB6B9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="FareFit Logo" 
                className="w-8 h-8 object-contain"
              />
              <span style={{ color: '#102A43', opacity: 0.7 }}>© 2025 FareFit</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a 
                href="#privacy" 
                className="transition-colors"
                style={{ color: '#102A43', opacity: 0.7 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
              >
                Privacy Policy
              </a>
              <a 
                href="#terms" 
                className="transition-colors"
                style={{ color: '#102A43', opacity: 0.7 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
              >
                Terms
              </a>
              <a 
                href="#support" 
                className="transition-colors"
                style={{ color: '#102A43', opacity: 0.7 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C54'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#102A43'}
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
