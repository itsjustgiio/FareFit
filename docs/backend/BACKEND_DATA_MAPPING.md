# FareFit Backend Data Mapping

## 📋 Overview
This document identifies **every placeholder/dummy data element** across all FareFit components and maps them to the appropriate database tables and fields for backend integration.

---

## 🎯 PHASE 1: Core User & Nutrition Data

### **GreetingSection.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| User Name | "Giovanni" (hardcoded line 5) | `users.full_name` | `user.fullName` | "Giovanni Carrion" |
| Greeting Time | "Good evening" (hardcoded line 5) | Calculate from `users.timezone` + current time | `greeting` | "Good morning" / "Good afternoon" |
| Fitness Score | `82` (hardcoded line 28) | `daily_metrics.fitness_score` or calculated field | `fitnessScore` | 82 (0-100) |

**Backend Logic Needed:**
- Calculate greeting based on user's local time
- Calculate fitness score from: (workouts_completed + nutrition_adherence + streak_days) / 3

---

### **CaloriesCard.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Calories Consumed | `1750` (default, line 21) | `daily_nutrition_summary.total_calories` | `summary.totalCalories` | 1845 |
| Target Calories | `2200` (default, line 22) | `fitness_goals.target_calories` (where `is_active=true`) | `goal.targetCalories` | 2200 |
| Protein Consumed | `120g` (default, line 23) | `daily_nutrition_summary.total_protein` | `summary.totalProtein` | 95 |
| Target Protein | `165g` (default, line 24) | `fitness_goals.protein_target` | `goal.proteinTarget` | 165 |
| Carbs Consumed | `180g` (default, line 25) | `daily_nutrition_summary.total_carbs` | `summary.totalCarbs` | 140 |
| Target Carbs | `220g` (default, line 26) | `fitness_goals.carbs_target` | `goal.carbsTarget` | 220 |
| Fat Consumed | `55g` (default, line 27) | `daily_nutrition_summary.total_fats` | `summary.totalFats` | 48 |
| Target Fat | `73g` (default, line 28) | `fitness_goals.fats_target` | `goal.fatsTarget` | 73 |
| Fiber Consumed | `28g` (default, line 29) | `daily_nutrition_summary.fiber` | `summary.fiber` | 18 |
| Fiber Target | `30g` (hardcoded, line 69) | `fitness_goals.fiber_target` | `goal.fiberTarget` | 30 |
| "On track" message | Calculated (line 46) | Calculate: `consumed <= target` | `statusMessage` | "On track" / "Over target" |
| Budget Display | `$450` (hardcoded, line 91) | `user_preferences.food_budget` OR remove feature | `budget.remaining` | "$320" |

**Backend Queries Needed:**
```sql
-- Get today's nutrition summary
SELECT * FROM daily_nutrition_summary 
WHERE user_id = $1 AND date = CURRENT_DATE;

-- Get active fitness goal
SELECT * FROM fitness_goals 
WHERE user_id = $1 AND is_active = true 
ORDER BY created_at DESC LIMIT 1;
```

---

### **MealsCard.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Entire Meals Array | Hardcoded array (lines 2-7) | `meals` table + JOIN `workouts` | `mealsAndWorkouts[]` | See below |
| Meal Name | "Breakfast" / "Lunch" | `meals.meal_type` | `meal.mealType` | "Breakfast" |
| Calories | `280` / `650` | `meals.calories` | `meal.calories` | 280 |
| Time | "8:30 AM" | `meals.logged_at` | `meal.loggedAt` | "8:30 AM" |
| Status Badge | "CONSUMED" / "WORKOUT" | `meals.meal_type` OR separate workout join | `meal.status` | "CONSUMED" |
| Workout Entry | "Push Day", `-517` | `workouts` table | `workout.name`, `workout.calories_burned` | "Push Day", -517 |

**Backend Query Needed:**
```sql
-- Get today's meals and workouts combined
(SELECT meal_type as name, calories, logged_at as time, 'CONSUMED' as status 
 FROM meals WHERE user_id = $1 AND meal_date = CURRENT_DATE)
UNION ALL
(SELECT workout_name as name, -calories_burned as calories, end_time as time, 'WORKOUT' as status
 FROM workouts WHERE user_id = $1 AND workout_date = CURRENT_DATE)
ORDER BY time ASC;
```

---

## 💪 PHASE 2: Workout Tracking

### **WorkoutCard.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Calories Burned | `517` (from workoutData) | `workouts.total_calories_burned` | `workout.caloriesBurned` | 517 |
| Workout Type | "Push Day 💪" | `workouts.workout_name` | `workout.workoutName` | "Push Day 💪" |
| Duration | `45` minutes | `workouts.total_duration_minutes` | `workout.duration` | 45 |
| Total Volume | Calculated from exercises | SUM(`workout_exercises.volume`) | `workout.totalVolume` | 9550 |
| Total Sets | Calculated (line 50) | COUNT of sets in `workout_exercises` | `workout.totalSets` | 13 |
| Workout Notes | Hardcoded string (lines 32-47) | `workouts.notes` | `workout.notes` | "Felt strong today..." |

**Backend Query Needed:**
```sql
-- Get latest workout with aggregated exercise data
SELECT w.*, 
  SUM(we.sets) as total_sets,
  SUM(we.sets * we.reps * we.weight_lbs) as total_volume
FROM workouts w
LEFT JOIN workout_exercises we ON we.workout_id = w.id
WHERE w.user_id = $1 AND w.workout_date = CURRENT_DATE
GROUP BY w.id
ORDER BY w.created_at DESC LIMIT 1;
```

---

### **WorkoutDetailPage.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Exercises Array | Default array (App.tsx lines 44-88) | `workout_exercises` table | `exercises[]` | See below |
| Exercise Name | "Bench Press" | `workout_exercises.exercise_name` | `exercise.name` | "Bench Press" |
| Sets | `4` | `workout_exercises.sets` | `exercise.sets` | 4 |
| Reps | `8` | `workout_exercises.reps` | `exercise.reps` | 8 |
| Weight | `155 lbs` | `workout_exercises.weight_lbs` | `exercise.weight` | 155 |
| Volume | `4960` | Calculated: `sets * reps * weight` | `exercise.volume` | 4960 |
| Notes | "Felt strong, good tempo" | `workout_exercises.notes` | `exercise.notes` | "Felt strong" |
| Start Time | ISO timestamp | `workout_exercises.start_time` | `exercise.startTime` | "2025-10-17T18:30:00Z" |
| End Time | ISO timestamp | `workout_exercises.end_time` | `exercise.endTime` | "2025-10-17T18:40:00Z" |
| Progress Chart Data | Hardcoded (lines 57-65) | Query past 7 days from `workouts` | `progressData[]` | See query below |
| Muscle Distribution | Hardcoded (lines 68-72) | Calculate from `workout_exercises` + `exercise_library.muscle_group` | `muscleData[]` | See below |

**Backend Queries Needed:**
```sql
-- Get exercises for a specific workout
SELECT * FROM workout_exercises
WHERE workout_id = $1
ORDER BY order_index ASC;

-- Get last 7 days volume for chart
SELECT 
  TO_CHAR(workout_date, 'Dy') as name,
  COALESCE(SUM(we.sets * we.reps * we.weight_lbs), 0) as volume
FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') AS workout_date
LEFT JOIN workouts w ON w.workout_date = workout_date::date AND w.user_id = $1
LEFT JOIN workout_exercises we ON we.workout_id = w.id
GROUP BY workout_date
ORDER BY workout_date;
```

---

## 📊 PHASE 3: Progress & History

### **ProgressPage.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Weekly Stats Array | Hardcoded (lines 18-26) | `daily_metrics` or `daily_summaries` | `weeklyStats[]` | See query below |
| Daily Consumed | `2100` | `daily_summaries.total_calories_consumed` | `day.consumed` | 2100 |
| Daily Burned | `450` | `daily_summaries.total_calories_burned` | `day.burned` | 450 |
| Daily Net | `1650` | Calculated: `consumed - burned` | `day.net` | 1650 |
| Workout Boolean | `true` | `daily_summaries.workouts_completed > 0` | `day.workout` | true |
| Total Consumed | Calculated sum | SUM of week's consumed | `totalConsumed` | 14350 |
| Total Burned | Calculated sum | SUM of week's burned | `totalBurned` | 2990 |
| Workout Count | `4` (line 31) | COUNT workouts this week | `workoutCount` | 4 |
| Current Streak | `7 days` (line 276) | Calculate from consecutive `daily_summaries` | `currentStreak` | 7 |
| Fitness Rank | "Bronze" / "Silver" | Calculate from `user_achievements` count | `rank.name` | "Silver" |
| Rank Icon | 🥉 / 🥈 | Maps to rank | `rank.icon` | "🥈" |

**Backend Query Needed:**
```sql
-- Get last 7 days of metrics
SELECT 
  TO_CHAR(date, 'Dy') as day,
  total_calories_consumed as consumed,
  total_calories_burned as burned,
  (total_calories_consumed - total_calories_burned) as net,
  workouts_completed > 0 as workout
FROM daily_summaries
WHERE user_id = $1 AND date >= CURRENT_DATE - 6
ORDER BY date ASC;
```

---

### **Achievements (ProgressPage.tsx)**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| All Achievements | Hardcoded array (lines 34-148) | `achievements` table (predefined) | `achievements[]` | Seeded in DB |
| Achievement Earned Status | `earned: true/false` | `user_achievements` JOIN | `achievement.earned` | true |
| Achievement Progress | Not shown yet | `user_achievements.progress` | `achievement.progress` | 5 / 10 |
| Mystery Discovered | `discovered: true/false` | `user_achievements.is_discovered` | `achievement.discovered` | true |
| Total Unlocked | Calculated (line 162) | COUNT from `user_achievements` where `is_completed=true` | `earnedCount` | 23 |

**Backend Queries Needed:**
```sql
-- Get all achievements with user progress
SELECT a.*, 
  ua.is_completed as earned,
  ua.progress,
  ua.is_discovered as discovered
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
ORDER BY a.category, a.id;

-- Calculate user rank
SELECT COUNT(*) as earned_count 
FROM user_achievements 
WHERE user_id = $1 AND is_completed = true;
```

---

## 🤖 PHASE 4: AI Features

### **CoachAIPage.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Messages Array | localStorage + initial message | `coach_messages` table | `messages[]` | See below |
| Message Text | String | `coach_messages.content` | `message.text` | "How can I help?" |
| Message Sender | "user" / "ai" | `coach_messages.role` | `message.sender` | "assistant" |
| Message Timestamp | Date | `coach_messages.timestamp` | `message.timestamp` | "2025-10-17T14:30:00Z" |
| User Profile Data | Hardcoded (lines 38-45) | Join from `fitness_goals`, `workouts`, `daily_metrics` | `userProfile` | See below |
| Experience Level | "Intermediate" (line 31) | `user_preferences.experience_level` | `user.experienceLevel` | "Intermediate" |

**Backend Queries Needed:**
```sql
-- Get coach conversation history
SELECT role as sender, content as text, timestamp
FROM coach_messages
WHERE user_id = $1
ORDER BY timestamp ASC;

-- Get user context for AI
SELECT 
  fg.goal_type as current_goal,
  w.workout_name as today_workout,
  ds.workouts_completed > 0 as has_worked_out_today
FROM users u
LEFT JOIN fitness_goals fg ON fg.user_id = u.id AND fg.is_active = true
LEFT JOIN workouts w ON w.user_id = u.id AND w.workout_date = CURRENT_DATE
LEFT JOIN daily_summaries ds ON ds.user_id = u.id AND ds.date = CURRENT_DATE
WHERE u.id = $1;
```

---

### **FoodAssistantPage.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Messages Array | State + initial message | `food_assistant_messages` table | `messages[]` | Array of messages |
| Remaining Calories | Calculated (line 45) | `goal.target_calories - summary.total_calories` | `remainingMacros.calories` | 750 |
| Remaining Protein | Calculated (line 46) | `goal.protein - summary.total_protein` | `remainingMacros.protein` | 70 |
| Remaining Carbs | Calculated (line 47) | Similar calculation | `remainingMacros.carbs` | 80 |
| Remaining Fat | Calculated (line 48) | Similar calculation | `remainingMacros.fat` | 25 |
| Goal Type | From props (line 52) | `fitness_goals.goal_type` | `goalType` | "cut" / "bulk" / "maintain" |

**Same query structure as CoachAIPage but from `food_assistant_messages` table**

---

### **AITipBanner.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| AI Tip Text | "You're close to your protein goal — want to add a shake?" (line 28) | Generate from `daily_summaries` analysis | `aiTip.message` | "Great protein today! Add veggies for fiber." |

**Backend Logic Needed:**
- Analyze current day's macros vs targets
- Generate contextual tip based on what's lacking
- Could be stored in `ai_tips` table with logic rules

---

## 📝 PHASE 5: Goal Setting

### **FitnessGoalPage.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Saved Goal Data | localStorage | `fitness_goals` table (most recent active) | `savedGoal` | Object with all fields |
| Age | Form input | `fitness_goals.age` | `goalData.age` | 28 |
| Weight | Form input | `fitness_goals.weight_kg` | `goalData.weight` | 82.5 |
| Height | Form input | `fitness_goals.height_cm` | `goalData.height` | 178 |
| Gender | Form select | `fitness_goals.gender` | `goalData.gender` | "male" |
| Activity Level | Form select | `fitness_goals.activity_level` | `goalData.activityLevel` | "moderately_active" |
| Goal Type | Form select | `fitness_goals.goal_type` | `goalData.goalType` | "cut" |
| TDEE | Calculated | `fitness_goals.tdee_calories` | `goalData.tdee` | 2400 |
| Target Calories | Calculated | `fitness_goals.target_calories` | `goalData.targetCalories` | 2200 |
| Macro Targets | Calculated | `fitness_goals.protein_grams`, etc. | `goalData.protein` | 165 |

**Backend Mutation:**
```sql
-- Save new fitness goal
INSERT INTO fitness_goals (
  user_id, age, gender, height_cm, weight_kg, 
  activity_level, goal_type, tdee_calories, 
  target_calories, protein_grams, carbs_grams, fats_grams,
  is_active, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
ON CONFLICT (user_id, is_active) 
DO UPDATE SET is_active = false; -- Deactivate old goal
```

---

## 🔧 PHASE 6: Support & Utility

### **FeedbackModal.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Feedback Submission | Console log only | `feedback_submissions` table | `feedback` | Object with all fields |
| Category | Form select | `feedback.category` | `feedback.category` | "bug" / "feature" |
| Subject | Form input | `feedback.subject` | `feedback.subject` | "Login issue" |
| Message | Form textarea | `feedback.message` | `feedback.message` | "Can't reset password..." |
| Current Page | Passed as prop | `feedback.page_context` | `feedback.currentPage` | "Dashboard" |
| User ID | From auth | `feedback.user_id` | `feedback.userId` | UUID |
| Status | Default "pending" | `feedback.status` | `feedback.status` | "pending" |

**Backend Mutation:**
```sql
INSERT INTO feedback_submissions 
(user_id, category, subject, message, page_context, status, submitted_at)
VALUES ($1, $2, $3, $4, $5, 'pending', NOW());
```

---

### **HelpPage.tsx (Barry Chat)**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| Barry Messages | localStorage | `help_conversations` + `help_messages` | `messages[]` | Same structure as Coach AI |
| FAQ Content | Hardcoded (lines 23-80+) | Could be `help_articles` table | `helpCategories[]` | Keep as static content OR move to DB |

---

## 🔐 Authentication & User Profile

### **Header.tsx**

| Element | Current Placeholder | Database Source | Variable Name | Example Real Data |
|---------|-------------------|----------------|---------------|-------------------|
| App Name | "FareFit" (hardcoded) | Static (no change) | N/A | "FareFit" |
| User Avatar | Not shown yet | `users.avatar_url` | `user.avatarUrl` | "https://..." |
| User Menu | Not implemented | Add dropdown with `users.full_name` | `user.fullName` | "Giovanni C." |

---

## 📅 Date & Time Context

**Multiple Components Need:**
- Current date for filtering (`CURRENT_DATE`)
- User timezone (`users.timezone` or browser timezone)
- "Today" vs historical data logic

---

## 🎨 Dashboard State Management

**App.tsx currently uses:**
- localStorage for persistence
- React state for runtime

**Migration Plan:**
```javascript
// BEFORE (localStorage)
const saved = localStorage.getItem('fitnessGoal');

// AFTER (Supabase)
const { data: goal } = await supabase
  .from('fitness_goals')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();
```

---

## 🚀 Implementation Priority

### **Critical Path (MVP):**
1. ✅ User authentication (`auth.users`)
2. ✅ Fitness goals (`fitness_goals`)
3. ✅ Meals logging (`meals`)
4. ✅ Daily summaries (`daily_summaries`)

### **High Priority:**
5. ✅ Workouts & exercises (`workouts`, `workout_exercises`)
6. ✅ AI conversations (`coach_messages`, `food_assistant_messages`)
7. ✅ Progress tracking (`body_measurements`)

### **Medium Priority:**
8. ✅ Achievements (`achievements`, `user_achievements`)
9. ✅ Feedback system (`feedback_submissions`)
10. ✅ Help chat history (`help_messages`)

### **Nice-to-Have:**
11. User preferences (`user_preferences`)
12. Exercise library (`exercise_library`)
13. Social features (`friends`, `workout_shares`)

---

## 📊 Data Flow Examples

### **Dashboard Load Sequence:**
```
1. Authenticate user → get user.id
2. Fetch active fitness_goal
3. Fetch today's daily_summary
4. Fetch today's meals
5. Fetch latest workout
6. Calculate AI tip based on data
7. Render dashboard with real data
```

### **Meal Logging Flow:**
```
1. User logs meal → Insert into `meals` table
2. Trigger function updates `daily_summaries.total_calories`
3. Recalculate remaining macros
4. Check if triggers any achievement
5. Update AI tip banner
```

---

## 🔒 Row Level Security (RLS)

**Every table needs RLS policies:**
```sql
-- Example for meals table
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own meals"
ON meals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own meals"
ON meals FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 📝 Notes

- **All numeric displays** (calories, macros, weight) should be formatted with `.toLocaleString()` or similar
- **All dates** should respect user's timezone
- **All AI features** need rate limiting on backend
- **All localStorage** should be migrated to Supabase with real-time subscriptions
- **Progress charts** need last 7/30/90 days of data depending on view
- **Achievements** should have background jobs checking completion criteria

---

## ✅ Migration Checklist

- [ ] Create all Phase 1 tables (users, fitness_goals, meals, daily_summaries)
- [ ] Implement RLS policies on all tables
- [ ] Replace localStorage with Supabase queries in App.tsx
- [ ] Update CaloriesCard to fetch real nutrition data
- [ ] Update MealsCard to fetch real meals
- [ ] Migrate workout system to database
- [ ] Migrate AI conversation history
- [ ] Implement achievements tracking
- [ ] Set up real-time subscriptions for live updates
- [ ] Add data validation and error handling
- [ ] Test with multiple user accounts

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-17  
**Maintained By:** FareFit Development Team
