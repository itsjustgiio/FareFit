# AI Tip System Documentation

## Overview

The FareFit AI Tip System provides personalized, contextual suggestions to users based on their current progress, goals, and time of day. The system is designed to feel like a personal coach that understands the user's journey.

## How It Works

### 1. Context Analysis

The AI Tip Generator (`/utils/aiTipGenerator.ts`) analyzes multiple factors:

```typescript
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
```

### 2. Time-Based Intelligence

The system adapts messages based on the time of day:

#### Morning (5am - 12pm)
- **New Users**: "Good morning! Start your day by logging your breakfast." 🌅
- **No Meals Logged**: "Rise and shine! Start your day by tracking your morning meal." ☀️
- **Bulking, Low Protein**: "Consider adding a protein shake to hit your muscle-building goals." 💪
- **Cutting, Light Start**: "You're off to a light start — perfect for your cutting goals." 🎯

#### Afternoon (12pm - 5pm)
- **No Meals Logged**: "Haven't tracked anything yet? It's not too late — log your lunch now!" 🍽️
- **No Workout**: "Great time for a workout! Even 30 minutes can make a difference." 🏋️
- **80%+ Protein Progress**: "You're close to your protein goal — want to add a shake?" 🥤
- **Over Calories (cutting)**: "You've exceeded your calorie target. Consider a lighter dinner." ⚖️

#### Evening (5pm - 10pm)
- **No Workout**: "Evening workout time! Get moving before the day ends." 🌆
- **No Dinner Logged**: "Don't forget to log your dinner! Tracking is key to progress." 🌙
- **Perfect Macros**: "Perfect day! You've hit your macro targets like a pro! 🎉" 🏆
- **Low Protein**: "Low on protein today. Add some lean meat or a protein shake with dinner!" 🥩

#### Late Night (10pm - 5am)
- **Over Target**: "Over target today? Don't stress! Tomorrow is a fresh start." 💙
- **Good Progress**: "Great job tracking today! Get some rest and crush it tomorrow." 😴
- **General**: "Time to rest! Recovery is just as important as training." 🛌

### 3. Goal-Specific Logic

#### Cutting (Lean Out)
- Celebrates staying under calorie targets
- Warns about exceeding calories
- Emphasizes protein to preserve muscle
- Suggests lighter meal options

#### Maintaining
- Balanced approach to all macros
- Focuses on consistency
- Moderate reminders

#### Bulking (Muscle Building)
- Ensures adequate calorie intake
- Emphasizes protein heavily
- Suggests adding meals/shakes if under target
- Celebrates high-calorie days

### 4. Progress-Based Intelligence

The system calculates progress percentages and responds accordingly:

```typescript
const proteinProgress = (macroProgress.protein / macroProgress.targetProtein) * 100;
const calorieProgress = (macroProgress.calories / macroProgress.targetCalories) * 100;

// Examples:
// 80-100% protein → "You're close to your protein goal!"
// >100% calories (cutting) → "You've exceeded your target"
// <50% calories (bulking) → "You need more calories to bulk!"
// 90-110% both → "Perfect day! 🏆"
```

### 5. Visual Feedback System

Tips are color-coded by type:

| Type | Color Scheme | Use Case |
|------|--------------|----------|
| **Achievement** 🏆 | Pink/Coral (#FFB6B9) | Perfect macros, milestones |
| **Reminder** 🔔 | Green (#1C7C54) | Forgotten meals, workouts |
| **Suggestion** 💡 | Mint-to-Green gradient | Protein shakes, workout timing |
| **Motivational** 🔥 | Bright Green (#22c55e) | Encouragement, streak maintenance |

Each tip includes an animated emoji that gently wiggles to draw attention.

## Implementation

### In App.tsx

The AITipBanner receives real-time data:

```typescript
<AITipBanner 
  onCoachAIClick={() => setCurrentPage('coach-ai')} 
  userName={user?.name}
  hasLoggedMeals={loggedMacros.calories > 0}
  hasLoggedWorkout={workoutData !== null}
  goalType={userGoal?.goalType}
  macroProgress={{
    calories: loggedMacros.calories,
    targetCalories: userGoal.targetCalories,
    protein: loggedMacros.protein,
    targetProtein: userGoal.protein,
    carbs: loggedMacros.carbs,
    targetCarbs: userGoal.carbs,
    fat: loggedMacros.fat,
    targetFat: userGoal.fat
  }}
/>
```

### In AITipBanner Component

The component uses `useMemo` to regenerate tips when context changes:

```typescript
const tip = useMemo(() => {
  return generateAITip({
    userName,
    hasLoggedMeals,
    hasLoggedWorkout,
    goalType,
    macroProgress
  });
}, [userName, hasLoggedMeals, hasLoggedWorkout, goalType, macroProgress]);
```

## Example Tip Flows

### New User Flow (Day 1)

**6:00 AM** - Login  
🌅 "Good morning! Start your day by logging your breakfast."

**12:30 PM** - Still no meals logged  
🍽️ "Haven't tracked anything yet? It's not too late — log your lunch now!"

**2:00 PM** - Logged lunch  
🏋️ "Great time for a workout! Even 30 minutes can make a difference."

**7:00 PM** - Logged workout + dinner  
✨ "Afternoon check-in: You're doing great! Stay consistent."

### Active User - Cutting Goal

**7:00 AM** - Logged breakfast (300 cal, 25g protein)  
🎯 "Good morning! You're off to a light start — perfect for your cutting goals."

**1:00 PM** - Logged lunch (500 cal, 40g protein)  
⚡ "Afternoon energy dip? A quick workout can boost your mood and metabolism."

**3:00 PM** - After logging workout  
✨ "Afternoon check-in: You're doing great! Stay consistent."

**6:00 PM** - Logged dinner (400 cal, 35g protein) - Total: 1200/1800 cal, 100/120g protein  
🥤 "You're close to your protein goal — want to add a shake?"

**9:00 PM** - Added protein shake (120 cal, 25g protein) - Total: 1320/1800 cal, 125/120g protein  
🏆 "Perfect day! You've hit your macro targets like a pro! 🎉"

### Active User - Bulking Goal

**8:00 AM** - Logged big breakfast (600 cal, 35g protein)  
💪 "Great start! Consider adding a protein shake to hit your muscle-building goals."

**12:00 PM** - Logged lunch (700 cal, 45g protein)  
✨ "Afternoon check-in: You're doing great! Stay consistent."

**3:00 PM** - Still low on calories (1300/3000 total)  
🍱 "You're running low on calories! Make sure to fuel up properly."

**7:00 PM** - Logged workout + dinner (900 cal, 50g protein)  
🍗 "You need more calories to bulk effectively! Time for a substantial dinner."

## Future Enhancements

### Potential Additions:
1. **Streak Tracking**: "🔥 7-day logging streak! You're unstoppable!"
2. **Hydration Reminders**: "💧 Remember to drink water throughout the day"
3. **Meal Timing**: "⏰ It's been 4 hours since your last meal"
4. **Weather-Based**: "☀️ Beautiful day for an outdoor workout!"
5. **Sleep Tracking**: "😴 Getting 8 hours of sleep? Your recovery matters!"
6. **Social Features**: "👥 3 friends hit their goals today!"

### Database Integration Needed:
- Store user's tip preferences
- Track which tips have been shown to avoid repetition
- Log tip engagement (clicks, dismissals)
- A/B test different tip phrasings
- Track correlation between tip types and user retention

## Technical Notes

- Tips regenerate whenever user context changes (meal logged, workout completed, etc.)
- Tips are deterministic based on current state (same state = same tip)
- Random selection is used within tip categories to provide variety
- Emoji animations use Motion for smooth, performant effects
- Component uses `useMemo` to prevent unnecessary recalculation

## Accessibility

- Tips are readable by screen readers
- Color is not the only indicator (emoji + text)
- High contrast white text on green/pink backgrounds
- Button has proper hover states and keyboard navigation

## Performance

- Lightweight calculations (no API calls)
- Memoized to prevent re-renders
- Pure functions in tip generator
- No external dependencies beyond React/Motion
