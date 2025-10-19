/**
 * Plan Summary Card
 * Dashboard card component that displays active plan summary
 * Shows key metrics and current week focus
 */

import React from 'react';
import { Target, Calendar, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import type { PlanSummary } from '../types/planTypes';

interface PlanSummaryCardProps {
  planSummary: PlanSummary | null;
  onViewFullPlan?: () => void;
  className?: string;
}

export function PlanSummaryCard({ 
  planSummary, 
  onViewFullPlan,
  className = ''
}: PlanSummaryCardProps) {
  
  // Don't render anything if no plan exists
  if (!planSummary) {
    return null;
  }

  // Calculate days since generation
  const daysSinceGeneration = Math.floor(
    (Date.now() - planSummary.generatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate progress percentage (assuming 4-week plan = 28 days)
  const totalDays = 28;
  const progressPercentage = Math.min((daysSinceGeneration / totalDays) * 100, 100);
  
  // Determine status
  const isCompleted = daysSinceGeneration >= totalDays;
  const isActive = daysSinceGeneration >= 0 && daysSinceGeneration < totalDays;

  return (
    <div className={`rounded-lg p-6 bg-white border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'var(--farefit-primary)' }} />
          <h3 className="font-semibold text-gray-900">Your Active Plan</h3>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>v{planSummary.version}</span>
          {isCompleted && <span className="text-green-600 font-medium">✓ Completed</span>}
        </div>
      </div>

      {/* Current Week & Focus */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--farefit-primary)10' }}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4" style={{ color: 'var(--farefit-primary)' }} />
          <span className="text-sm font-medium text-gray-700">
            Week {planSummary.currentWeek} Focus
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900">{planSummary.currentFocus}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs text-gray-600">
            Day {Math.min(daysSinceGeneration + 1, totalDays)} of {totalDays}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: isCompleted ? '#10B981' : 'var(--farefit-primary)'
            }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Daily Calories */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Daily Target</div>
          <div className="text-lg font-bold text-gray-900">
            {planSummary.targetCalories.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">calories</div>
        </div>

        {/* Protein Target */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Protein Goal</div>
          <div className="text-lg font-bold text-gray-900">
            {planSummary.macros.protein}g
          </div>
          <div className="text-xs text-gray-500">daily</div>
        </div>
      </div>

      {/* Macro Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-2">Daily Macro Targets</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">P: {planSummary.macros.protein}g</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">C: {planSummary.macros.carbs}g</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">F: {planSummary.macros.fat}g</span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {onViewFullPlan && (
          <button
            onClick={onViewFullPlan}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-sm font-medium text-gray-900">View Full 4-Week Plan</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Plan Age */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Generated {planSummary.generatedAt.toLocaleDateString()} • 
          {daysSinceGeneration === 0 
            ? ' Today' 
            : daysSinceGeneration === 1 
              ? ' 1 day ago' 
              : ` ${daysSinceGeneration} days ago`}
        </p>
      </div>
    </div>
  );
}

// Empty state component for when user has no plan
export function NoPlanCard({ 
  onGenerateNewPlan, 
  className = '' 
}: { 
  onGenerateNewPlan?: () => void; 
  className?: string; 
}) {
  return (
    <div className={`rounded-lg p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <Target className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Ready to start your journey?</h3>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Complete your fitness goal setup to generate your personalized 4-week transformation plan.
          </p>
        </div>
        
        {onGenerateNewPlan && (
          <button
            onClick={onGenerateNewPlan}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors duration-200"
            style={{ backgroundColor: 'var(--farefit-primary)' }}
          >
            <Sparkles className="w-4 h-4" />
            Set My Goals
          </button>
        )}
      </div>
    </div>
  );
}