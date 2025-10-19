/**
 * Plan Generated Modal
 * Success popup that displays after AI plan generation
 * Shows key metrics and provides access to full plan
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, Target, Flame, Dumbbell, Calendar, Sparkles } from 'lucide-react';
import type { UserPlan, PlanModalStatus } from '../types/planTypes';

interface PlanGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: PlanModalStatus;
  plan: UserPlan | null;
  onViewFullPlan?: () => void;
  onContinueToDashboard: () => void;
  error?: string;
}

export function PlanGeneratedModal({
  isOpen,
  onClose,
  status,
  plan,
  onViewFullPlan,
  onContinueToDashboard,
  error
}: PlanGeneratedModalProps) {
  
  // Loading state
  if (status === 'loading') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                🤖 AI is crafting your plan...
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="animate-pulse">📊 Analyzing your goals...</p>
                <p className="animate-pulse delay-500">🧮 Calculating nutrition targets...</p>
                <p className="animate-pulse delay-1000">📋 Creating 4-week roadmap...</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Plan Generation Failed
              </h3>
              <p className="text-sm text-gray-600">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <Button 
              onClick={onClose}
              className="mt-4"
              style={{ backgroundColor: 'var(--farefit-primary)' }}
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (status === 'ready' && plan) {
    const currentWeek = plan.planContent.weeks[0]; // Start with Week 1

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              🎯 Your Personalized Plan is Ready!
            </DialogTitle>
          </DialogHeader>

          {/* Goal Type and Targets */}
          <div className="space-y-4">
            {/* Goal Type */}
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4"
                   style={{ backgroundColor: '#1C7C5415', color: '#1C7C54' }}>
                Your goal: {plan.goalType === 'cut' ? 'Cutting' : plan.goalType === 'bulk' ? 'Bulking' : 'Maintaining'}
              </div>
            </div>

            {/* Daily Targets with Explanations */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Daily calories:</span>
                <span className="font-bold text-lg">{plan.targetCalories.toLocaleString()} kcal</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Protein:</span>
                <div className="text-right">
                  <span className="font-bold text-lg">{plan.macros.protein}g</span>
                  <span className="text-sm text-gray-600 block">(muscle maintenance)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Carbs:</span>
                <div className="text-right">
                  <span className="font-bold text-lg">{plan.macros.carbs}g</span>
                  <span className="text-sm text-gray-600 block">(energy)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Fat:</span>
                <div className="text-right">
                  <span className="font-bold text-lg">{plan.macros.fat}g</span>
                  <span className="text-sm text-gray-600 block">(hormone health)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Fiber:</span>
                <div className="text-right">
                  <span className="font-bold text-lg">{plan.macros.fiber}g</span>
                  <span className="text-sm text-gray-600 block">(digestion)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={onContinueToDashboard}
              className="w-full"
              style={{ backgroundColor: 'var(--farefit-primary)' }}
            >
              Got it! Take me home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

// Helper component for loading dots animation
function LoadingDots() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}