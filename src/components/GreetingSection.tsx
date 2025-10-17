interface GreetingSectionProps {
  onFitnessScoreClick?: () => void;
  userName?: string;
}

export function GreetingSection({ onFitnessScoreClick, userName = 'there' }: GreetingSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 style={{ color: 'var(--text-primary)' }}>{getGreeting()}, {userName}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Let's start your journey today!</p>
      </div>
      
      {/* Fitness Score Gauge - Clickable - Hidden initially */}
      <button
        onClick={onFitnessScoreClick}
        className="hidden items-center gap-3 hover:opacity-80 transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="var(--accent-light)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="var(--accent-primary)"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${(0 / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl" style={{ color: 'var(--text-primary)' }}>0</span>
          </div>
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Fitness</p>
          <p style={{ color: 'var(--text-primary)' }}>Score</p>
        </div>
      </button>
    </div>
  );
}