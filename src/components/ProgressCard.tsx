import { TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressCardProps {
  onClick: () => void;
}

export function ProgressCard({ onClick }: ProgressCardProps) {
  return (
    <div
      className="bg-white rounded-lg p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#1C7C5420' }}
        >
          <TrendingUp className="w-6 h-6" style={{ color: '#1C7C54' }} />
        </div>
        <h3 style={{ color: '#102A43' }}>Progress Overview</h3>
      </div>
      <p className="text-sm mb-6" style={{ color: '#102A43', opacity: 0.7 }}>
        Track your weekly stats, streaks, and see how you're improving over time.
      </p>
      
      <motion.button
        onClick={onClick}
        className="px-6 py-3 rounded-md text-white flex items-center gap-2 shadow-md"
        style={{ backgroundColor: '#1C7C54' }}
        whileHover={{ 
          y: -2,
          boxShadow: '0 10px 25px rgba(28, 124, 84, 0.3)'
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <span>View Progress</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
