# Database Integration Guide for FareFit

This guide provides complete documentation for integrating the backend database with the FareFit frontend application.

## Table of Contents
1. [Overview](#overview)
2. [Data Models](#data-models)
3. [App.tsx State Management](#apptsx-state-management)
4. [Component Data Flow](#component-data-flow)
5. [API Endpoints Needed](#api-endpoints-needed)
6. [Integration Checklist](#integration-checklist)

---

## Overview

The FareFit app currently uses local state management in `App.tsx`. All data needs to be connected to your backend database/API. The app is designed to work with empty states, so new users will see clean "no data" states until they log their first meal or workout.

---

## Data Models

### 1. User Model
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  // Onboarding data
  sexAtBirth?: 'male' | 'female';
  birthdate?: string; // ISO date string
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Goal Model
```typescript
interface UserGoal {
  id: string;
  userId: string;
  goalType: 'cut' | 'maintain' | 'bulk'; // Lean out, maintain, bulk up
  targetCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  tdee: number; // Total Daily Energy Expenditure
  createdAt: string;
  updatedAt: string;
}
```

### 3. Meal Model
```typescript
interface Meal {
  id: string;
  userId: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string; // ISO datetime string
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4. Workout Model
```typescript
interface Workout {
  id: string;
  userId: string;
  workoutType: string; // e.g., "Push Day 💪", "Leg Day", "Cardio"
  date: string; // ISO date string (YYYY-MM-DD)
  duration: number; // minutes
  caloriesBurned: number;
  exercises: Exercise[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Exercise {
  id: string;
  workoutId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number; // lbs
  volume: number; // weight * reps * sets
  notes: string;
  order: number; // For display order
}
```

### 5. Daily Aggregates (Computed or Cached)
```typescript
interface DailyMacros {
  date: string; // ISO date string (YYYY-MM-DD)
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
```

---

## App.tsx State Management

### Current State Variables (Lines 15-26)

```typescript
// Authentication & User
const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

// Onboarding Data - This should be saved to User model
const [onboardingData, setOnboardingData] = useState<any>(null);

// User Goal - Connect to Goal Model
const [userGoal, setUserGoal] = useState<UserGoal | null>(null);

// Daily Macros - Aggregate from Meal Model for current date
const [loggedMacros, setLoggedMacros] = useState({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
});

// Workout Data - Fetch from Workout Model for current date
const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
```

### Data Flow on App Load

When a user logs in, you need to:

1. **Fetch User Profile**
   ```typescript
   const fetchUserProfile = async (userId: string) => {
     const userData = await api.get(`/users/${userId}`);
     setUser(userData);
     setOnboardingData(userData); // If onboarding data is stored in user profile
   };
   ```

2. **Fetch User Goal**
   ```typescript
   const fetchUserGoal = async (userId: string) => {
     const goal = await api.get(`/users/${userId}/goal`);
     setUserGoal(goal);
   };
   ```

3. **Fetch Today's Meals & Aggregate Macros**
   ```typescript
   const fetchTodaysMacros = async (userId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const meals = await api.get(`/users/${userId}/meals?date=${today}`);
     
     // Aggregate macros from meals
     const aggregated = meals.reduce((acc, meal) => ({
       calories: acc.calories + meal.calories,
       protein: acc.protein + meal.protein,
       carbs: acc.carbs + meal.carbs,
       fat: acc.fat + meal.fat,
       fiber: acc.fiber + meal.fiber
     }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
     
     setLoggedMacros(aggregated);
   };
   ```

4. **Fetch Today's Workout**
   ```typescript
   const fetchTodaysWorkout = async (userId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const workout = await api.get(`/users/${userId}/workouts?date=${today}`);
     setWorkoutData(workout);
   };
   ```

---

## Component Data Flow

### 1. CaloriesCard Component
**Location:** `/components/CaloriesCard.tsx`  
**Props:**
```typescript
interface CaloriesCardProps {
  onFoodAIClick?: () => void;
  userGoal?: UserGoal | null;
  loggedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
```

**Data Source:**
- `userGoal` - Fetch from Goal API
- `loggedMacros` - Aggregate from today's Meals API

**Empty State:** Shows when `loggedMacros.calories === 0`

---

### 2. MealsCard Component
**Location:** `/components/MealsCard.tsx`  
**Props:**
```typescript
interface MealsCardProps {
  onViewTimeline?: () => void;
  meals?: Meal[];
}
```

**Data Source:**
- Fetch from `GET /users/{userId}/meals?date={today}&limit=3`
- Returns most recent 3 meals for quick preview

**Empty State:** Shows when `meals.length === 0`

**Current Display Logic:**
```typescript
// Shows first 3 meals with macro preview
meals.slice(0, 3).map(meal => ({
  name: meal.name,
  time: new Date(meal.timestamp).toLocaleTimeString(),
  calories: meal.calories,
  protein: meal.protein,
  carbs: meal.carbs,
  fat: meal.fat
}))
```

---

### 3. WorkoutCard Component
**Location:** `/components/WorkoutCard.tsx`  
**Props:**
```typescript
interface WorkoutCardProps {
  onCoachAIClick?: () => void;
  onViewWorkout?: () => void;
  workoutData?: {
    workoutType: string;
    duration: number;
    caloriesBurned: number;
    exercises: Exercise[];
    date: string;
  } | null;
}
```

**Data Source:**
- Fetch from `GET /users/{userId}/workouts?date={today}`
- Returns today's workout with all exercises

**Empty State:** Shows when `workoutData === null`

---

### 4. AITipBanner Component (Smart AI Tips)
**Location:** `/components/AITipBanner.tsx`  
**Props:**
```typescript
interface AITipBannerProps {
  onCoachAIClick?: () => void;
  userName?: string;
  hasLoggedMeals?: boolean;
  hasLoggedWorkout?: boolean;
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

**AI Tip Generator Logic:**
The AITipBanner uses `/utils/aiTipGenerator.ts` to provide contextual, personalized tips based on:

1. **Time of Day**
   - Morning (5am-12pm): Breakfast reminders, protein suggestions
   - Afternoon (12pm-5pm): Workout suggestions, macro progress updates
   - Evening (5pm-10pm): Dinner reminders, daily achievement summaries
   - Late Night (10pm-5am): Rest reminders, motivational messages

2. **User Progress**
   - No meals logged: "Good morning! Start your day by logging your breakfast."
   - Close to protein goal: "You're close to your protein goal — want to add a shake?"
   - Over calorie target: "You've exceeded your calorie target. Consider a lighter dinner."
   - Perfect macros: "Perfect day! You've hit your macro targets like a pro! 🎉"

3. **Goal Type**
   - Cut: Encourages staying under calorie target, high protein
   - Maintain: Balanced macro reminders
   - Bulk: Reminds to eat enough, focus on protein and calories

4. **Visual Feedback**
   - Achievement tips (🏆): Pink/coral gradient
   - Reminder tips (🔔): Green gradient
   - Suggestion tips (💡): Mint-to-green gradient
   - Motivational tips (🔥): Bright green gradient

**Example Tips:**
- Morning, no meals: "Good morning! Don't forget to log your breakfast to stay on track." ☀️
- Afternoon, 80% protein: "You're close to your protein goal — want to add a shake?" 🥤
- Evening, workout done, perfect macros: "Perfect day! You've hit your macro targets like a pro! 🎉" 🏆
- Late night: "Great job tracking today! Get some rest and crush it tomorrow." 😴

---

### 5. DailyTimelinePage Component
**Location:** `/components/DailyTimelinePage.tsx`  
**Props:**
```typescript
interface DailyTimelinePageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onFeedbackClick: () => void;
  userGoal?: UserGoal | null;
  loggedMacros?: DailyMacros;
}
```

**Data Source:**
- Fetch from `GET /users/{userId}/meals?date={selectedDate}`
- Returns all meals for the selected date in chronological order

**Features:**
- Shows all meals logged for the day
- Can navigate between different dates
- Shows meal detail modal on click

---

### 6. WorkoutDetailPage Component
**Location:** `/components/WorkoutDetailPage.tsx`  
**Props:**
```typescript
interface WorkoutDetailPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onFeedbackClick: () => void;
  workoutData?: WorkoutData | null;
}
```

**Data Source:**
- Uses the same workout data passed from App.tsx
- Shows detailed breakdown of all exercises, sets, reps, weight

**Features:**
- Automatic calorie calculation based on exercises
- Total volume calculation (weight × reps × sets)
- Exercise-by-exercise breakdown

---

### 7. ProgressPage Component
**Location:** `/components/ProgressPage.tsx`  
**Data Needs:**
- Historical weight data for weight chart
- Historical macro data for nutrition chart
- Historical workout data for activity chart

**API Endpoints Needed:**
```typescript
GET /users/{userId}/weight-history?startDate={date}&endDate={date}
GET /users/{userId}/macros-history?startDate={date}&endDate={date}
GET /users/{userId}/workouts-history?startDate={date}&endDate={date}
```

---

## API Endpoints Needed

### Authentication
```
POST   /auth/signup         - Create new user
POST   /auth/login          - Login user
POST   /auth/logout         - Logout user
GET    /auth/me             - Get current user
```

### Users
```
GET    /users/{userId}                    - Get user profile
PUT    /users/{userId}                    - Update user profile
PATCH  /users/{userId}/onboarding         - Save onboarding data
```

### Goals
```
GET    /users/{userId}/goal               - Get user's goal
POST   /users/{userId}/goal               - Create/update goal
```

### Meals
```
GET    /users/{userId}/meals              - Get meals (with date filters)
POST   /users/{userId}/meals              - Create new meal
GET    /users/{userId}/meals/{mealId}     - Get specific meal
PUT    /users/{userId}/meals/{mealId}     - Update meal
DELETE /users/{userId}/meals/{mealId}     - Delete meal
```

### Workouts
```
GET    /users/{userId}/workouts           - Get workouts (with date filters)
POST   /users/{userId}/workouts           - Create new workout
GET    /users/{userId}/workouts/{workoutId}  - Get specific workout
PUT    /users/{userId}/workouts/{workoutId}  - Update workout
DELETE /users/{userId}/workouts/{workoutId}  - Delete workout
```

### Analytics
```
GET    /users/{userId}/daily-macros?date={date}        - Get aggregated macros for date
GET    /users/{userId}/weight-history?start={}&end={}  - Get weight history
GET    /users/{userId}/macros-history?start={}&end={}  - Get macro history
```

---

## Integration Checklist

### Phase 1: Authentication
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Store JWT/session token
- [ ] Update `handleSignupComplete()` in App.tsx to call API
- [ ] Update `handleLoginComplete()` in App.tsx to call API
- [ ] Update `handleLogout()` in App.tsx to call API

### Phase 2: Onboarding
- [ ] Create endpoint to save onboarding data to User model
- [ ] Update `handleOnboardingComplete()` in App.tsx (line 122)
- [ ] Save: sexAtBirth, birthdate, height, weight, activityLevel, notifications
- [ ] Calculate and save TDEE + macros based on goal selection

### Phase 3: User Profile & Goals
- [ ] Fetch user profile on app load
- [ ] Fetch user goal on app load
- [ ] Pass goal data to relevant components

### Phase 4: Meals Integration
- [ ] Create meal CRUD endpoints
- [ ] Fetch today's meals on dashboard load
- [ ] Aggregate macros from meals
- [ ] Update CaloriesCard with real data
- [ ] Update MealsCard with real data
- [ ] Update DailyTimelinePage with real data
- [ ] Implement meal logging functionality

### Phase 5: Workouts Integration
- [ ] Create workout CRUD endpoints
- [ ] Fetch today's workout on dashboard load
- [ ] Update WorkoutCard with real data
- [ ] Update WorkoutDetailPage with real data
- [ ] Implement workout logging functionality

### Phase 6: Progress & Analytics
- [ ] Implement historical data endpoints
- [ ] Connect ProgressPage charts to real data
- [ ] Implement date range filtering
- [ ] Add weight tracking functionality

### Phase 7: Real-time Updates
- [ ] Implement refresh mechanism after logging meals
- [ ] Implement refresh mechanism after logging workouts
- [ ] Update UI immediately after CRUD operations

---

## Example Integration (App.tsx)

Here's how to modify the main useEffect in App.tsx:

```typescript
useEffect(() => {
  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch all user data in parallel
      const [profile, goal, macros, workout] = await Promise.all([
        api.get(`/users/${user.id}`),
        api.get(`/users/${user.id}/goal`),
        fetchTodaysMacros(user.id),
        fetchTodaysWorkout(user.id)
      ]);
      
      setUser(profile);
      setUserGoal(goal);
      setLoggedMacros(macros);
      setWorkoutData(workout);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load your data');
    }
  };
  
  loadUserData();
}, [user?.id]);
```

---

## Notes for Database Engineer

1. **Empty States**: All components handle empty/null data gracefully. New users will see clean "no data logged yet" states.

2. **Date Handling**: Use ISO 8601 format (YYYY-MM-DD) for dates, ISO 8601 datetime for timestamps.

3. **Calculations**: 
   - TDEE should be calculated server-side using Mifflin-St Jeor equation
   - Macro splits should follow standard ratios (protein: 1g/lb bodyweight, fat: 25-30% calories, carbs: remainder)
   - Workout volume = weight × reps × sets

4. **Aggregations**: Daily macros can be computed on-the-fly or cached for performance.

5. **Timezone**: Handle user timezones appropriately for "today" calculations.

6. **Validation**: Validate all user inputs (macros, weights, reps) on the backend.

7. **Performance**: Consider pagination for historical data on ProgressPage.

---

## Questions?

If you need clarification on any data structure or component behavior:
1. Check the component file directly in `/components`
2. Review the TypeScript interfaces at the top of each component
3. Look for empty state conditions to understand when data is considered "missing"

Good luck with the integration! 🚀
