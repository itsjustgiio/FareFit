/**
 * AI Plan Generator Orchestrator
 * Main coordinator that combines TDEE calculation, Gemini AI, and storage
 * Handles the complete plan generation workflow with error handling
 */

import { getGeminiService } from './geminiService';
import { calculateCompleteTDEE, validateUserData } from './tdeeCalculator';
import { 
  saveUserPlan, 
  getTodaysPlanCount, 
  getActiveUserPlan 
} from './planStorageService';
import { updateFitnessGoalsBatch } from '../userService';

import type {
  UserGoalData,
  UserPlan,
  PlanGenerationRequest,
  PlanGenerationResponse,
  PlanContent,
  ValidationResult
} from '../types/planTypes';

import { PlanGenerationError } from '../types/planTypes';

// Rate limiting constants
const MAX_DAILY_GENERATIONS = 10;  // Increase daily limit
const MIN_HOURS_BETWEEN_GENERATIONS = 0.5;  // 30 minutes between generations

/**
 * Extract macro data from plan content for fitness goals update
 * Converts Gemini response format to the format expected by updateFitnessGoalsBatch
 */
function extractMacroUpdateData(
  planContent: PlanContent,
  tdeeResult: ReturnType<typeof calculateCompleteTDEE>,
  userData: UserGoalData
): Record<string, any> {
  return {
    // Target values from the plan
    target_calories: planContent.summary.daily_calories || tdeeResult.targetCalories,
    protein_target: planContent.summary.macros.protein || tdeeResult.macros.protein,
    carbs_target: planContent.summary.macros.carbs || tdeeResult.macros.carbs,
    fats_target: planContent.summary.macros.fat || tdeeResult.macros.fat,
    fiber_target: planContent.summary.macros.fiber || tdeeResult.macros.fiber,
    
    // Additional calculated values
    tdee: tdeeResult.tdee,
    
    // User profile data
    age: userData.age,
    weight: userData.weight,
    height: userData.height,
    gender: userData.gender,
    activity_level: userData.activityLevel,
    goal_type: userData.goalType,
    
    // Metadata
    is_active: true
  };
}

/**
 * Main plan generation function
 * Orchestrates the entire workflow from user data to saved plan
 */
export async function generateUserPlan(
  userId: string,
  userData: UserGoalData,
  options: { updateFitnessGoals?: boolean } = {}
): Promise<PlanGenerationResponse> {
  console.log(`🤖 Starting plan generation for user ${userId}`);
  
  try {
    // Step 1: Validate input data
    console.log('📝 Validating user data...');
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      return {
        success: false,
        error: PlanGenerationError.INVALID_USER_DATA
      };
    }

    // Step 2: Rate limiting check (DISABLED FOR TESTING)
    // console.log('⏱️ Checking rate limits...');
    // const rateLimitCheck = await checkRateLimits(userId);
    // if (!rateLimitCheck.allowed) {
    //   console.log(`❌ Rate limit exceeded: ${rateLimitCheck.reason}`);
    //   return {
    //     success: false,
    //     error: PlanGenerationError.RATE_LIMIT_EXCEEDED
    //   };
    // }

    // Step 3: Calculate TDEE and macros
    console.log('🧮 Calculating TDEE and macros...');
    const tdeeResult = calculateCompleteTDEE(userData);
    console.log(`✅ TDEE: ${tdeeResult.tdee}, Target: ${tdeeResult.targetCalories} calories`);

    // Step 4: Generate AI plan content
    console.log('🤖 Generating AI plan with Gemini...');
    const planContent = await generateAIPlanContent(userData, tdeeResult);
    console.log('✅ AI plan generation completed');

    // Step 5: Save plan to Firestore
    console.log('💾 Saving plan to Firestore...');
    const savedPlan = await saveUserPlan(
      userId,
      userData.goalType,
      tdeeResult.tdee,
      tdeeResult.targetCalories,
      tdeeResult.macros,
      planContent
    );
    console.log(`✅ Plan saved with ID: ${savedPlan.id}`);

    // Step 6: Extract macro data for fitness goals update
    const macroUpdateData = extractMacroUpdateData(planContent, tdeeResult, userData);
    console.log('📊 Extracted macro data for fitness goals update:', macroUpdateData);

    // Step 7: Optionally update fitness goals automatically
    if (options.updateFitnessGoals) {
      console.log('🎯 Automatically updating fitness goals with plan data...');
      try {
        await updateFitnessGoalsBatch(userId, macroUpdateData);
        console.log('✅ Fitness goals updated successfully with AI plan data');
      } catch (error) {
        console.error('⚠️ Failed to update fitness goals automatically:', error);
        // Don't fail the whole operation if fitness goals update fails
      }
    }

    // Step 8: Log success analytics
    logPlanGenerationEvent(userId, 'success', {
      goalType: userData.goalType,
      tdee: tdeeResult.tdee,
      planVersion: savedPlan.version
    });

    return {
      success: true,
      plan: savedPlan,
      macroData: macroUpdateData
    };

  } catch (error) {
    console.error('❌ Plan generation failed:', error);
    
    // Log failure analytics
    logPlanGenerationEvent(userId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Determine error type
    let errorType = PlanGenerationError.UNKNOWN_ERROR;
    
    if (error instanceof Error) {
      if (error.message.includes('Gemini')) {
        errorType = PlanGenerationError.GEMINI_API_TIMEOUT;
      } else if (error.message.includes('Firestore') || error.message.includes('Failed to save')) {
        errorType = PlanGenerationError.FIRESTORE_ERROR;
      } else if (error.message.includes('JSON') || error.message.includes('schema')) {
        errorType = PlanGenerationError.SCHEMA_VALIDATION_FAILED;
      }
    }

    return {
      success: false,
      error: errorType
    };
  }
}

/**
 * Generate AI plan content using Gemini
 */
async function generateAIPlanContent(
  userData: UserGoalData,
  tdeeResult: ReturnType<typeof calculateCompleteTDEE>
): Promise<PlanContent> {
  try {
    const geminiService = getGeminiService();
    
    // Prepare context for Gemini
    const geminiContext = {
      age: userData.age,
      weight: userData.weight,
      height: userData.height,
      gender: userData.gender,
      goalType: userData.goalType,
      activityLevel: userData.activityLevel,
      targetCalories: tdeeResult.targetCalories,
      macros: tdeeResult.macros,
      tdee: tdeeResult.tdee
    };

    // Generate plan with Gemini
    const aiResponse = await geminiService.generatePersonalizedPlan(geminiContext);
    
    // Parse and validate response
    const parsedContent = parseGeminiResponse(aiResponse);
    
    // Validate the structure
    const validationResult = validatePlanContent(parsedContent);
    if (!validationResult.isValid) {
      throw new Error(`Invalid plan structure: ${validationResult.errors.join(', ')}`);
    }

    return parsedContent;

  } catch (error) {
    console.error('❌ AI plan generation failed:', error);
    
    // Fallback to template-based plan if AI fails
    console.log('🔄 Falling back to template plan...');
    return generateFallbackPlan(userData, tdeeResult);
  }
}

/**
 * Parse Gemini JSON response
 */
function parseGeminiResponse(response: string): PlanContent {
  try {
    const parsed = JSON.parse(response);
    
    // Ensure required structure exists
    if (!parsed.summary || !parsed.weeks || !Array.isArray(parsed.weeks)) {
      throw new Error('Missing required plan structure');
    }

    return parsed as PlanContent;

  } catch (error) {
    console.error('❌ Failed to parse Gemini response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Validate plan content structure
 */
function validatePlanContent(content: PlanContent): ValidationResult {
  const errors: string[] = [];

  // Validate summary
  if (!content.summary) {
    errors.push('Missing plan summary');
  } else {
    if (!content.summary.daily_calories || content.summary.daily_calories <= 0) {
      errors.push('Invalid daily calories in summary');
    }
    if (!content.summary.macros) {
      errors.push('Missing macros in summary');
    }
  }

  // Validate weeks
  if (!content.weeks || !Array.isArray(content.weeks)) {
    errors.push('Missing or invalid weeks array');
  } else {
    if (content.weeks.length !== 4) {
      errors.push('Plan must have exactly 4 weeks');
    }

    content.weeks.forEach((week, index) => {
      if (!week.week || week.week !== index + 1) {
        errors.push(`Week ${index + 1} has invalid week number`);
      }
      if (!week.focus || week.focus.trim().length === 0) {
        errors.push(`Week ${index + 1} missing focus`);
      }
      if (!Array.isArray(week.nutrition) || week.nutrition.length === 0) {
        errors.push(`Week ${index + 1} missing nutrition array`);
      }
      if (!Array.isArray(week.workouts) || week.workouts.length === 0) {
        errors.push(`Week ${index + 1} missing workouts array`);
      }
      if (!week.motivation || week.motivation.trim().length === 0) {
        errors.push(`Week ${index + 1} missing motivation`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate fallback plan when AI fails
 */
function generateFallbackPlan(
  userData: UserGoalData,
  tdeeResult: ReturnType<typeof calculateCompleteTDEE>
): PlanContent {
  const goalTemplates = {
    cut: {
      description: 'lose fat while preserving muscle',
      weeks: [
        { focus: 'Foundation Building', nutrition: ['Track all meals daily', 'Aim for your calorie target', 'Prioritize protein at each meal'], workouts: ['3x strength training', '2x cardio sessions'], motivation: 'Start small, build consistency!' },
        { focus: 'Building Momentum', nutrition: ['Meal prep 2-3 days ahead', 'Stay hydrated (8+ glasses)', 'Include vegetables in every meal'], workouts: ['4x strength training', '3x cardio sessions'], motivation: 'Consistency beats perfection.' },
        { focus: 'Pushing Forward', nutrition: ['Focus on whole foods', 'Time protein around workouts', 'Plan for social eating situations'], workouts: ['4x strength training', '4x cardio sessions'], motivation: 'You\'re building lasting habits.' },
        { focus: 'Finishing Strong', nutrition: ['Trust the process', 'Adjust portions based on hunger', 'Celebrate non-scale victories'], workouts: ['5x strength training', '4x cardio sessions'], motivation: 'Strong finishes create strong beginnings.' }
      ]
    },
    bulk: {
      description: 'build lean muscle mass',
      weeks: [
        { focus: 'Foundation Building', nutrition: ['Eat in a slight surplus', 'Protein with every meal', 'Don\'t fear carbs pre-workout'], workouts: ['4x strength training', '1x light cardio'], motivation: 'Muscle is built with patience.' },
        { focus: 'Building Momentum', nutrition: ['Track your lifts and food', 'Add healthy fats daily', 'Time carbs around training'], workouts: ['4x strength training', '2x light cardio'], motivation: 'Progressive overload is key.' },
        { focus: 'Pushing Forward', nutrition: ['Focus on food quality', 'Stay consistent with timing', 'Listen to your hunger cues'], workouts: ['5x strength training', '2x light cardio'], motivation: 'Growth happens in the recovery.' },
        { focus: 'Finishing Strong', nutrition: ['Maintain your surplus', 'Prioritize sleep for gains', 'Adjust based on progress'], workouts: ['5x strength training', '2x cardio sessions'], motivation: 'Consistency compounds into strength.' }
      ]
    },
    maintain: {
      description: 'maintain current weight and improve fitness',
      weeks: [
        { focus: 'Foundation Building', nutrition: ['Eat at maintenance level', 'Balance all macronutrients', 'Focus on food quality'], workouts: ['3x strength training', '2x cardio sessions'], motivation: 'Maintenance is mastery.' },
        { focus: 'Building Momentum', nutrition: ['Develop sustainable habits', 'Practice mindful eating', 'Stay flexible with choices'], workouts: ['4x strength training', '2x cardio sessions'], motivation: 'Balance creates longevity.' },
        { focus: 'Pushing Forward', nutrition: ['Focus on nutrient timing', 'Maintain consistent patterns', 'Trust your body\'s signals'], workouts: ['4x strength training', '3x cardio sessions'], motivation: 'Stability breeds confidence.' },
        { focus: 'Finishing Strong', nutrition: ['Continue proven strategies', 'Adapt to life changes', 'Maintain without obsessing'], workouts: ['4x strength training', '3x cardio sessions'], motivation: 'Sustainable habits win long-term.' }
      ]
    }
  };

  const template = goalTemplates[userData.goalType];

  return {
    summary: {
      daily_calories: tdeeResult.targetCalories,
      macros: tdeeResult.macros,
      goal_description: template.description
    },
    weeks: template.weeks.map((week, index) => ({
      week: index + 1,
      focus: week.focus,
      nutrition: week.nutrition,
      workouts: week.workouts,
      motivation: week.motivation
    }))
  };
}

/**
 * Check rate limiting for plan generation
 */
async function checkRateLimits(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // ⚠️ TEMPORARY: Disable rate limiting for testing
    console.log('🧪 Rate limiting temporarily disabled for testing');
    return { allowed: true };

    // Uncomment below to re-enable rate limiting:
    /*
    // Check daily generation count
    const todayCount = await getTodaysPlanCount(userId);
    if (todayCount >= MAX_DAILY_GENERATIONS) {
      return {
        allowed: false,
        reason: `Daily limit reached (${MAX_DAILY_GENERATIONS} plans per day)`
      };
    }

    // Check time since last generation
    const activePlan = await getActiveUserPlan(userId);
    if (activePlan) {
      const hoursSinceGeneration = (Date.now() - activePlan.generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceGeneration < MIN_HOURS_BETWEEN_GENERATIONS) {
        return {
          allowed: false,
          reason: `Please wait ${Math.ceil(MIN_HOURS_BETWEEN_GENERATIONS - hoursSinceGeneration)} more hours`
        };
      }
    }

    return { allowed: true };
    */

  } catch (error) {
    console.error('❌ Rate limit check failed:', error);
    // Fail open - allow generation if we can't check limits
    return { allowed: true };
  }
}

/**
 * Log plan generation events for analytics
 */
function logPlanGenerationEvent(userId: string, event: 'success' | 'failed', data: any) {
  // In a real app, this would send to your analytics service
  console.log(`📊 Plan Generation Event: ${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
}

/**
 * Utility function to extract macro data from any plan content
 * Use this to convert plan data to the format expected by updateFitnessGoalsBatch
 */
export function extractMacroDataFromPlan(
  planContent: PlanContent,
  tdeeResult: ReturnType<typeof calculateCompleteTDEE>,
  userData: UserGoalData
): Record<string, any> {
  return extractMacroUpdateData(planContent, tdeeResult, userData);
}