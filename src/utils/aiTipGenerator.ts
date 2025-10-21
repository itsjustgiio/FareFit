/**
 * AI Tip Generator
 * Generates personalized tips based on user context, time, and progress
 */

interface UserContext {
  userName?: string;
  hasLoggedMeals: boolean;
  hasLoggedWorkout: boolean;
  goalType?: 'cut' | 'maintain' | 'bulk';
  macroProgress?: {
    calories: number;
    targetCalories: number;
    protein: number;
    targetProtein: number;
    carbs: number;
    targetCarbs: number;
    fat: number;
    targetFat: number;
  };
}

interface AITip {
  message: string;
  emoji: string;
  type: 'motivational' | 'reminder' | 'suggestion' | 'achievement';
}

export function generateAITip(context: UserContext): AITip {
  const hour = new Date().getHours();
  const isNewUser = !context.hasLoggedMeals && !context.hasLoggedWorkout;
  
  // New user tips
  if (isNewUser) {
    return getNewUserTip(hour);
  }
  //quick edits
  // Time-based tips with user progress
  if (hour >= 5 && hour < 12) {
    return getMorningTip(context);
  } else if (hour >= 12 && hour < 17) {
    return getAfternoonTip(context);
  } else if (hour >= 17 && hour < 22) {
    return getEveningTip(context);
  } else {
    return getLateNightTip(context);
  }
}

function getNewUserTip(hour: number): AITip {
  if (hour >= 5 && hour < 12) {
    return {
      message: "Good morning! Start your day by logging your breakfast.",
      emoji: "🌅",
      type: 'reminder'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      message: "Welcome! Track your first meal to start your fitness journey.",
      emoji: "🎯",
      type: 'reminder'
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      message: "Ready to get started? Log your dinner and today's workout!",
      emoji: "💪",
      type: 'reminder'
    };
  } else {
    return {
      message: "Start fresh tomorrow! Set up your goals and get ready to track.",
      emoji: "🌙",
      type: 'motivational'
    };
  }
}

function getMorningTip(context: UserContext): AITip {
  const { hasLoggedMeals, goalType, macroProgress } = context;
  
  if (!hasLoggedMeals) {
    const tips = [
      {
        message: "Good morning! Don't forget to log your breakfast to stay on track.",
        emoji: "☀️",
        type: 'reminder' as const
      },
      {
        message: "Rise and shine! Start your day by tracking your morning meal.",
        emoji: "🌅",
        type: 'reminder' as const
      },
      {
        message: "Morning! Fuel up and log it — breakfast is your most important meal.",
        emoji: "🍳",
        type: 'reminder' as const
      }
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Has logged meals
  if (goalType === 'bulk' && macroProgress) {
    if (macroProgress.protein < macroProgress.targetProtein * 0.3) {
      return {
        message: "Great start! Consider adding a protein shake to hit your muscle-building goals.",
        emoji: "💪",
        type: 'suggestion'
      };
    }
  }
  
  if (goalType === 'cut' && macroProgress) {
    if (macroProgress.calories < macroProgress.targetCalories * 0.25) {
      return {
        message: "Good morning! You're off to a light start — perfect for your cutting goals.",
        emoji: "🎯",
        type: 'achievement'
      };
    }
  }
  
  return {
    message: "Morning routine looking good! Keep up the momentum throughout the day.",
    emoji: "🔥",
    type: 'motivational'
  };
}

function getAfternoonTip(context: UserContext): AITip {
  const { hasLoggedMeals, hasLoggedWorkout, goalType, macroProgress } = context;
  
  if (!hasLoggedMeals) {
    return {
      message: "Haven't tracked anything yet? It's not too late — log your lunch now!",
      emoji: "🍽️",
      type: 'reminder'
    };
  }
  
  if (!hasLoggedWorkout) {
    const tips = [
      {
        message: "Great time for a workout! Even 30 minutes can make a difference.",
        emoji: "🏋️",
        type: 'suggestion' as const
      },
      {
        message: "Afternoon energy dip? A quick workout can boost your mood and metabolism.",
        emoji: "⚡",
        type: 'suggestion' as const
      }
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Check macro progress
  if (macroProgress) {
    const proteinProgress = (macroProgress.protein / macroProgress.targetProtein) * 100;
    const calorieProgress = (macroProgress.calories / macroProgress.targetCalories) * 100;
    
    if (proteinProgress >= 80 && proteinProgress < 100) {
      return {
        message: "You're close to your protein goal — want to add a shake?",
        emoji: "🥤",
        type: 'suggestion'
      };
    }
    
    if (calorieProgress > 100 && goalType === 'cut') {
      return {
        message: "You've exceeded your calorie target. Consider a lighter dinner tonight.",
        emoji: "⚖️",
        type: 'suggestion'
      };
    }
    
    if (calorieProgress < 50 && (goalType === 'bulk' || goalType === 'maintain')) {
      return {
        message: "You're running low on calories! Make sure to fuel up properly.",
        emoji: "🍱",
        type: 'reminder'
      };
    }
  }
  
  return {
    message: "Afternoon check-in: You're doing great! Stay consistent.",
    emoji: "✨",
    type: 'motivational'
  };
}

function getEveningTip(context: UserContext): AITip {
  const { hasLoggedMeals, hasLoggedWorkout, goalType, macroProgress } = context;
  
  if (!hasLoggedWorkout) {
    const tips = [
      {
        message: "Evening workout time! Get moving before the day ends.",
        emoji: "🌆",
        type: 'reminder' as const
      },
      {
        message: "No workout logged yet? A quick session now can help you sleep better!",
        emoji: "💤",
        type: 'suggestion' as const
      }
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  if (!hasLoggedMeals) {
    return {
      message: "Don't forget to log your dinner! Tracking is key to progress.",
      emoji: "🌙",
      type: 'reminder'
    };
  }
  
  // Check if they've hit their goals
  if (macroProgress) {
    const proteinProgress = (macroProgress.protein / macroProgress.targetProtein) * 100;
    const calorieProgress = (macroProgress.calories / macroProgress.targetCalories) * 100;
    
    if (proteinProgress >= 90 && proteinProgress <= 110 && calorieProgress >= 90 && calorieProgress <= 110) {
      return {
        message: "Perfect day! You've hit your macro targets like a pro! 🎉",
        emoji: "🏆",
        type: 'achievement'
      };
    }
    
    if (proteinProgress < 70) {
      return {
        message: "Low on protein today. Add some lean meat or a protein shake with dinner!",
        emoji: "🥩",
        type: 'suggestion'
      };
    }
    
    if (calorieProgress < 70 && goalType === 'bulk') {
      return {
        message: "You need more calories to bulk effectively! Time for a substantial dinner.",
        emoji: "🍗",
        type: 'reminder'
      };
    }
  }
  
  return {
    message: "Evening wind-down: Review your progress and plan for tomorrow!",
    emoji: "📊",
    type: 'motivational'
  };
}

function getLateNightTip(context: UserContext): AITip {
  const { hasLoggedMeals, macroProgress, goalType } = context;
  
  if (!hasLoggedMeals) {
    return {
      message: "Late night? Log what you ate today so you don't forget tomorrow!",
      emoji: "🌙",
      type: 'reminder'
    };
  }
  
  if (macroProgress && macroProgress.calories > macroProgress.targetCalories * 1.2) {
    return {
      message: "Over target today? Don't stress! Tomorrow is a fresh start.",
      emoji: "💙",
      type: 'motivational'
    };
  }
  
  const tips = [
    {
      message: "Great job tracking today! Get some rest and crush it tomorrow.",
      emoji: "😴",
      type: 'motivational' as const
    },
    {
      message: "Late night? Avoid heavy snacking and stay hydrated before bed!",
      emoji: "💧",
      type: 'suggestion' as const
    },
    {
      message: "Time to rest! Recovery is just as important as training.",
      emoji: "🛌",
      type: 'motivational' as const
    }
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

// Helper function to get motivational messages for achievements
export function getAchievementMessage(achievement: string): string {
  const messages: Record<string, string> = {
    'first_meal': "🎉 First meal logged! You're on your way!",
    'first_workout': "💪 First workout tracked! Keep the momentum going!",
    'perfect_macros': "🏆 Perfect macro day! You're a nutrition pro!",
    'week_streak': "🔥 7-day streak! You're unstoppable!",
    'protein_goal': "🥤 Protein goal crushed! Your muscles will thank you!",
    'calorie_target': "🎯 Hit your calorie target perfectly! Well done!",
  };
  
  return messages[achievement] || "🌟 Great job! Keep up the amazing work!";
}
