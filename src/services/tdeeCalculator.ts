/**
 * TDEE Calculator Service
 * Pure math functions for BMR/TDEE calculations and macro distribution
 * Uses Mifflin-St Jeor equation for BMR calculation
 */

import type { UserGoalData, TDEEResult, MacroTargets, GoalType, ValidationResult } from '../types/planTypes';

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Most accurate formula for healthy adults
 */
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  // Mifflin-St Jeor Equation:
  // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
  // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
  
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 * BMR multiplied by activity level factor
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultiplier = parseFloat(activityLevel);
  
  // Validate activity level is within expected range
  if (activityMultiplier < 1.2 || activityMultiplier > 2.0) {
    throw new Error(`Invalid activity level: ${activityLevel}. Expected between 1.2 and 2.0`);
  }
  
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate target calories based on goal type
 * Uses conservative deficits/surpluses for sustainable results
 */
export function calculateTargetCalories(tdee: number, goalType: GoalType): number {
  switch (goalType) {
    case 'cut':
      // 15% deficit for sustainable fat loss (0.5-1 lb/week)
      return Math.round(tdee * 0.85);
    
    case 'bulk':
      // 15% surplus for lean muscle gain (0.5 lb/week)
      return Math.round(tdee * 1.15);
    
    case 'maintain':
    default:
      // Maintenance calories
      return tdee;
  }
}

/**
 * Calculate macro targets based on calories and goal type
 * Uses evidence-based ratios for optimal body composition
 */
export function calculateMacroTargets(targetCalories: number, goalType: GoalType, weight: number): MacroTargets {
  let proteinGrams: number;
  let fatPercentage: number;
  
  // Protein targets based on goal and body weight (using grams per kg body weight)
  // Industry standard: 0.8-1.2g per pound = 1.8-2.6g per kg
  switch (goalType) {
    case 'cut':
      // Higher protein during cut to preserve muscle (1.0g per lb = 2.2g per kg)
      proteinGrams = Math.round(weight * 2.2);
      fatPercentage = 0.25; // 25% of calories from fat
      break;
    
    case 'bulk':
      // Moderate protein for muscle building (0.9g per lb = 2.0g per kg)
      proteinGrams = Math.round(weight * 2.0);
      fatPercentage = 0.20; // 20% of calories from fat (more carbs for energy)
      break;
    
    case 'maintain':
    default:
      // Balanced protein for maintenance (0.8g per lb = 1.8g per kg)
      proteinGrams = Math.round(weight * 1.8);
      fatPercentage = 0.30; // 30% of calories from fat (more balanced)
      break;
  }
  
  // Calculate calories from protein (4 cal/g)
  const proteinCalories = proteinGrams * 4;
  
  // Calculate fat calories and grams (9 cal/g)
  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9);
  
  // Remaining calories go to carbs (4 cal/g)
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);
  
  // Fiber target: 14g per 1000 calories (FDA recommendation)
  const fiberGrams = Math.round((targetCalories / 1000) * 14);
  
  return {
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    fiber: fiberGrams
  };
}

/**
 * Complete TDEE calculation pipeline
 * Combines all calculations into a single result
 */
export function calculateCompleteTDEE(userData: UserGoalData): TDEEResult {
  // Validate input data
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
  }
  
  // Calculate BMR
  const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.gender);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, userData.activityLevel);
  
  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, userData.goalType);
  
  // Calculate macro targets
  const macros = calculateMacroTargets(targetCalories, userData.goalType, userData.weight);
  
  return {
    bmr,
    tdee,
    targetCalories,
    macros
  };
}

/**
 * Validate user data before calculations
 */
export function validateUserData(userData: UserGoalData): ValidationResult {
  const errors: string[] = [];
  
  // Age validation
  if (!userData.age || userData.age < 15 || userData.age > 120) {
    errors.push('Age must be between 15 and 120 years');
  }
  
  // Weight validation (reasonable range in kg)
  if (!userData.weight || userData.weight < 30 || userData.weight > 300) {
    errors.push('Weight must be between 30 and 300 kg');
  }
  
  // Height validation (reasonable range in cm)
  if (!userData.height || userData.height < 120 || userData.height > 250) {
    errors.push('Height must be between 120 and 250 cm');
  }
  
  // Gender validation
  if (!userData.gender || !['male', 'female'].includes(userData.gender)) {
    errors.push('Gender must be either "male" or "female"');
  }
  
  // Activity level validation
  const activityLevel = parseFloat(userData.activityLevel);
  if (isNaN(activityLevel) || activityLevel < 1.2 || activityLevel > 2.0) {
    errors.push('Activity level must be between 1.2 and 2.0');
  }
  
  // Goal type validation
  if (!userData.goalType || !['cut', 'maintain', 'bulk'].includes(userData.goalType)) {
    errors.push('Goal type must be "cut", "maintain", or "bulk"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get activity level description from multiplier
 */
export function getActivityLevelDescription(activityLevel: string): string {
  const level = parseFloat(activityLevel);
  
  if (level <= 1.2) return 'Sedentary (little or no exercise)';
  if (level <= 1.375) return 'Lightly active (1-3 days/week)';
  if (level <= 1.55) return 'Moderately active (3-5 days/week)';
  if (level <= 1.725) return 'Very active (6-7 days/week)';
  if (level <= 1.9) return 'Super active (physical job + training)';
  
  return 'Unknown activity level';
}

/**
 * Get goal type description
 */
export function getGoalTypeDescription(goalType: GoalType): string {
  switch (goalType) {
    case 'cut':
      return 'Lose fat while preserving muscle';
    case 'bulk':
      return 'Build lean muscle mass';
    case 'maintain':
      return 'Maintain current weight and body composition';
    default:
      return 'Unknown goal type';
  }
}