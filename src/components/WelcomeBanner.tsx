import { motion } from 'motion/react';
import { X, PartyPopper } from 'lucide-react';

interface WelcomeBannerProps {
  userName: string;
  onClose: () => void;
}

export function WelcomeBanner({ userName, onClose }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl p-6 shadow-lg relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #1C7C54 0%, #A8E6CF 100%)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <PartyPopper className="w-full h-full" style={{ color: 'white' }} />
      </div>
      
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="relative z-10">
        <h3 className="text-white text-2xl mb-2">
          Welcome to FareFit, {userName}! 🎉
        </h3>
        <p className="text-white opacity-90 mb-4">
          You're all set! Your personalized dashboard is ready. Let's start tracking your fitness journey.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span>Track meals & macros</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span>Log workouts</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span>Get AI coaching</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
