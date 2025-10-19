/**
 * Core TypeScript interfaces for AI Plan Generation System
 * Defines contracts for user goals, TDEE calculations, and AI-generated plans
 */

// Base user data needed for calculations
export interface UserPhysicalData {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female';
  activityLevel: string; // Activity multiplier as string (e.g., "1.55")
}

// Goal types matching existing system
export type GoalType = 'cut' | 'maintain' | 'bulk';

// Complete user goal data
export interface UserGoalData extends UserPhysicalData {
  goalType: GoalType;
}

// TDEE calculation results
export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: MacroTargets;
}

// Macro breakdown
export interface MacroTargets {
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber: number;   // grams
}

// Weekly plan structure (what Gemini returns)
export interface WeeklyPlan {
  week: number;
  focus: string;
  nutrition: string[];
  workouts: string[];
  motivation: string;
}

// Complete AI-generated plan content
export interface PlanContent {
  summary: {
    daily_calories: number;
    macros: MacroTargets;
    goal_description: string;
  };
  weeks: WeeklyPlan[];
}

// Full plan data stored in Firestore
export interface UserPlan {
  id: string;
  userId: string;
  goalType: GoalType;
  tdee: number;
  targetCalories: number;
  macros: MacroTargets;
  planContent: PlanContent;
  generatedAt: Date;
  isActive: boolean;
  version: number;
}

// Plan generation request
export interface PlanGenerationRequest {
  userId: string;
  userData: UserGoalData;
}

// Plan generation response
export interface PlanGenerationResponse {
  success: boolean;
  plan?: UserPlan;
  error?: PlanGenerationError;
  macroData?: Record<string, any>;
}

// Error types for plan generation
export enum PlanGenerationError {
  GEMINI_API_TIMEOUT = 'GEMINI_API_TIMEOUT',
  INVALID_USER_DATA = 'INVALID_USER_DATA',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  FIRESTORE_ERROR = 'FIRESTORE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Modal states for UI
export type PlanModalStatus = 'loading' | 'ready' | 'error';

// Plan summary for dashboard display (performance optimized)
export interface PlanSummary {
  goalType: GoalType;
  targetCalories: number;
  macros: MacroTargets;
  currentWeek: number;
  currentFocus: string;
  generatedAt: Date;
  version: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}