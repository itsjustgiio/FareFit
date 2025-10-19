import { getGeminiService } from './geminiService';

interface MealData {
  meal_date: string;
  meal_type: string;
  food_name: string;
  brand?: string;
  serving_size: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  meal_time?: any;
}

interface FoodContext {
  date: string;
  userGoal: {
    goalType: 'cut' | 'maintain' | 'bulk';
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  currentProgress: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  remainingMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  meals: Array<{
    time: string;
    name: string;
    brand: string;
    portion: number;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  }>;
}

const FOOD_COACH_SYSTEM_PROMPT = `
# 🍎 FareFit Food Coach System Prompt

You are FareFit's AI nutrition coach. Your job is to help the user improve their nutrition habits throughout the day using empathy, pattern recognition, and science-backed reasoning.

## Your Coaching Philosophy:
- **Empathetic & Non-judgmental**: Never shame or criticize food choices
- **Educational**: Explain WHY certain foods benefit their goals
- **Practical**: Give actionable, realistic suggestions
- **Balanced**: Promote long-term healthy habits, not extreme restrictions
- **Goal-oriented**: Tailor advice to their specific fitness goal (cut/bulk/maintain)

## When given the user's meal log, analyze:

### 1. **Nutritional Patterns**
- Protein, carb, and fat distribution across meals
- Timing of meals and macros throughout the day
- Missing food groups (vegetables, fruits, whole grains)
- Balance of processed vs whole foods

### 2. **Goal-Specific Coaching**
- **Cut Goal**: Focus on satiety, protein timing, volume foods
- **Bulk Goal**: Emphasize calorie density, post-workout nutrition
- **Maintain Goal**: Balance variety, consistency, sustainable habits

### 3. **Educational Moments**
- Explain benefits: "Protein helps with satiety and muscle recovery"
- Teach principles: "Fiber slows digestion and improves gut health"
- Connect foods to goals: "Greek yogurt provides protein for your cut goal"

## Output Style:
- **Conversational tone** (like a knowledgeable friend)
- **2-4 sentences max** unless user asks for details
- **Include specific food suggestions** based on remaining macros
- **Use emojis sparingly** (1-2 per response)
- **Reference their actual foods** when giving advice

## Example Response Patterns:
- "I see you had [specific food] earlier - great choice for [reason]! For dinner, try [suggestion] to hit your remaining [macro] goals."
- "Your protein timing looks good, but you're missing vegetables today. Add some [specific veggie] to boost fiber and micronutrients."
- "Since you're cutting, those [food] will help with satiety. Consider pairing with [complement] for better nutrition balance."
`;

export async function analyzeUserFoodContext(
  userMessage: string,
  context: FoodContext
): Promise<string> {
  try {
    const geminiService = getGeminiService();
    
    // Build comprehensive context for the AI
    const contextString = buildContextString(context);
    
    const fullPrompt = `${FOOD_COACH_SYSTEM_PROMPT}

---

## 📊 User's Current Context:
${contextString}

## 💬 User Message:
"${userMessage}"

## Instructions:
Respond as their personal nutrition coach. Reference their actual meals, goal type, and remaining macros to give personalized advice.
`;

    console.log('🤖 Sending food coach request to Gemini...');
    
    const response = await geminiService.chat([
      {
        role: 'user',
        parts: [{ text: fullPrompt }]
      }
    ]);

    return response;
  } catch (error) {
    console.error('Food coach analysis error:', error);
    return "I'm having trouble analyzing your nutrition right now. Please try again!";
  }
}

function buildContextString(context: FoodContext): string {
  const { date, userGoal, currentProgress, remainingMacros, meals } = context;
  
  let contextStr = `**Date:** ${date}\n`;
  
  if (userGoal) {
    contextStr += `**Goal:** ${userGoal.goalType.toUpperCase()} (${userGoal.targetCalories} kcal/day)\n`;
    contextStr += `**Targets:** ${userGoal.protein}g protein, ${userGoal.carbs}g carbs, ${userGoal.fat}g fat\n\n`;
  } else {
    contextStr += `**Goal:** Not set yet\n\n`;
  }
  
  contextStr += `**Current Progress:**\n`;
  contextStr += `- Calories: ${Math.round(currentProgress.calories)}/${userGoal?.targetCalories || '?'}\n`;
  contextStr += `- Protein: ${Math.round(currentProgress.protein)}g/${userGoal?.protein || '?'}g\n`;
  contextStr += `- Carbs: ${Math.round(currentProgress.carbs)}g/${userGoal?.carbs || '?'}g\n`;
  contextStr += `- Fat: ${Math.round(currentProgress.fat)}g/${userGoal?.fat || '?'}g\n`;
  contextStr += `- Fiber: ${Math.round(currentProgress.fiber)}g/30g\n\n`;
  
  contextStr += `**Remaining Macros:**\n`;
  contextStr += `- Calories: ${remainingMacros.calories} ${remainingMacros.calories < 0 ? 'over' : 'left'}\n`;
  contextStr += `- Protein: ${remainingMacros.protein}g ${remainingMacros.protein < 0 ? 'over' : 'left'}\n`;
  contextStr += `- Carbs: ${remainingMacros.carbs}g ${remainingMacros.carbs < 0 ? 'over' : 'left'}\n`;
  contextStr += `- Fat: ${remainingMacros.fat}g ${remainingMacros.fat < 0 ? 'over' : 'left'}\n`;
  contextStr += `- Fiber: ${remainingMacros.fiber}g ${remainingMacros.fiber < 0 ? 'over' : 'left'}\n\n`;
  
  contextStr += `**Today's Meals:**\n`;
  if (meals.length === 0) {
    contextStr += `- No meals logged yet today\n`;
  } else {
    meals.forEach((meal, index) => {
      const brand = meal.brand && meal.brand !== 'Unknown' ? ` (${meal.brand})` : '';
      contextStr += `- ${meal.time || `Meal ${index + 1}`}: ${meal.name}${brand} - ${meal.portion} serving(s)\n`;
      contextStr += `  └ ${Math.round(meal.macros.calories)} kcal, ${Math.round(meal.macros.protein)}g protein, ${Math.round(meal.macros.carbs)}g carbs, ${Math.round(meal.macros.fat)}g fat\n`;
    });
  }
  
  return contextStr;
}

export function buildFoodContext(
  meals: MealData[],
  userGoal: any,
  loggedMacros: any,
  remainingMacros: any
): FoodContext {
  return {
    date: new Date().toLocaleDateString("en-US", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    userGoal,
    currentProgress: loggedMacros,
    remainingMacros,
    meals: meals.map(meal => ({
      time: meal.meal_time ? 
        (meal.meal_time.toDate ? meal.meal_time.toDate().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }) : meal.meal_time) : 
        'Unknown time',
      name: meal.food_name,
      brand: meal.brand || 'Unknown',
      portion: meal.serving_size,
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fats,
        fiber: meal.fiber,
      },
    })),
  };
}