# FareScore System Documentation

## 🎯 Overview

FareFit uses two complementary scoring systems to track your health and fitness progress:

### 1. **FareScore** (300-850)
A credit-score-inspired health consistency rating that reflects how consistently you stick to your nutrition and fitness goals over time. This is your long-term accountability metric.

### 2. **Daily Score** (0-100)
A daily reset score that shows how close you are to earning maximum points for today. This is your immediate progress tracker.

---

## 📊 FareScore (Long-Term Consistency)

**FareScore** is a credit-score-inspired health consistency rating system that ranges from **300-850** (matching FICO credit scores). It reflects how consistently users stick to their nutrition and fitness goals.

### Core Philosophy

> "Your FareScore shows how consistently you stick to your nutrition and fitness goals."

Unlike instant gratification systems, FareScore:
- **Grows slowly** through sustained discipline (like building credit)
- **Decays gradually** when consistency drops
- **Updates daily** with weekly smoothing
- **Rewards consistency** over perfection
- **Reflects accountability** through visible metrics

---

## 📊 Score Range & Tiers

| Tier | Range | Label | Description |
|------|-------|-------|-------------|
| 🔴 Starting Journey | 300-399 | Starting Journey | Beginning your fitness journey - Every log counts! |
| 🟡 Building Habits | 400-549 | Building Habits | Developing consistency - Keep going! |
| 🟢 Consistent Tracker | 550-699 | Consistent Tracker | Staying on track most days - Great progress! |
| 🔵 Goal Crusher | 700-799 | Goal Crusher | Crushing your goals with dedication! |
| 💎 FareFit Elite | 800-850 | FareFit Elite | Elite consistency - You're an inspiration! |

### Starting Score
**Everyone starts at: 350** (Starting Journey tier)

---

## 🎯 Daily Score (Today's Progress)

**Daily Score** ranges from **0-100** and resets every day at midnight. It shows how close you are to earning maximum points for the current day.

### Daily Score Breakdown

| Component | Points | How to Earn |
|-----------|--------|-------------|
| **Meals Logged** | 30 | Log at least 2-3 meals (≥500 calories total) |
| **Workout Completed** | 30 | Complete any workout and log it |
| **Macros Hit** | 25 | Stay within 10% of your calorie and protein targets |
| **Consistency Bonus** | 15 | Earn ≥75 points from the above categories |
| **TOTAL** | **100** | Perfect day! |

### Daily Score Tiers

- **100**: Perfect Day! 🎉
- **85-99**: Excellent
- **70-84**: Great
- **50-69**: Good
- **25-49**: Fair
- **0-24**: Getting Started

### Key Differences: Daily Score vs FareScore

| Aspect | Daily Score | FareScore |
|--------|-------------|-----------|
| **Range** | 0-100 | 300-850 |
| **Resets** | Every day | Never (accumulates) |
| **Purpose** | Today's tasks | Long-term consistency |
| **Changes** | Instant | Gradual (weekly smoothing) |
| **Display** | Dashboard | Dashboard + Account Page |

---

## 📈 How FareScore Changes

### Positive Actions (Score Increases)

| Action | Score Change | Frequency | Notes |
|--------|--------------|-----------|-------|
| Log meals for the day | +1 | Daily | Requires ≥2 meals |
| Complete a workout | +2 | Per workout | Any workout type |
| Hit macro targets | +3 | Daily | Within 10% of goals |
| Maintain 7-day streak | +5 | Every 7 days | Bonus milestone |
| Keep weight stable | +2 | Weekly | Within 1% of goal |
| Log sleep/hydration | +1 | Daily | Future feature |

### Negative Actions (Score Decreases)

| Action | Score Change | Notes |
|--------|--------------|-------|
| Miss daily meal logging | -2 | Compound quickly |
| Break streak | -5 | Immediate penalty |
| Inactive for 1 week | -10 | Significant drop |
| Delete meals/workouts | -15 | Manipulation penalty |
| Fail macro targets | -3 | High deviation |

### Growth Timeline Example

**Conservative User Journey:**
- **Week 1:** 350 → 365 (+15)
- **Month 1:** 350 → 395 (+45)
- **Month 2:** 395 → 445 (+50)
- **Month 3:** 445 → 505 (+60)
- **Month 6:** 505 → 615 (+110)

**Dedicated User Journey:**
- **Month 2:** 350 → 485
- **Month 4:** 485 → 640
- **Month 6:** 640 → 750
- **Year 1:** 750 → 830

---

## 🧮 Calculation Algorithm

### Daily Update Logic

```typescript
let score = 350; // starting score
let consistency = 0.0; // 0 to 1 range (average adherence past 30 days)
let penalties = 0; // count of missed days

// Daily Update Algorithm
if (meals_logged_today >= 2) score += 1;
if (completed_workout_today) score += 2;
if (hit_macro_target) score += 3;
if (streak_days % 7 === 0) score += 5;

if (missed_day) score -= 2;
if (inactive_for_week) score -= 10;

score = clamp(score, 300, 850); // Boundaries
```

### Weekly Smoothing

To prevent dramatic swings (like real credit scores):

```typescript
score = 0.9 * old_score + 0.1 * new_score
```

This creates:
- **Gradual growth** that feels earned
- **Slow decay** that gives users time to recover
- **Realistic progression** matching credit-building patterns

---

## 💻 Implementation

### Files Created

1. **`/components/AccountPage.tsx`** - Full account interface with 3 tabs
   - Overview: FareScore display, history graph, activity breakdown
   - Leaderboard: Top 50 users ranked by FareScore
   - Friends: Friend list with scores and cheer functionality

2. **`/utils/fareScoreCalculator.ts`** - Core calculation engine
   - Score calculation functions
   - Tier determination
   - Weekly smoothing algorithm
   - History generation
   - Time-to-target estimation

### Data Structure

```typescript
interface FareScoreState {
  currentScore: number;           // 300-850
  streakDays: number;             // Current consecutive days
  mealsLoggedThisMonth: number;   // Monthly counter
  workoutsThisMonth: number;      // Monthly counter
  penaltiesThisMonth: number;     // Missed logs
  lastUpdateDate: string;         // ISO date
  consistencyRate: number;        // 0.0-1.0 (30-day avg)
}
```

---

## 🎨 UI Components

### FareScore Display (Overview Tab)

**Circular Gauge:**
- SVG circle progress bar
- Color-coded by tier (red → yellow → green → blue)
- Large centered score number
- Tier badge below score
- Percentage fill: `(score - 300) / (850 - 300) * 100`

**Change Indicator:**
- ↑ Arrow + points (green) for increases
- ↓ Arrow + points (red) for decreases
- "X points from last week"

**Score History Graph:**
- 6-week line chart (Recharts)
- Smooth monotone curve
- Points at each week
- Y-axis: 300-850 range
- Shows growth trajectory

**Activity Breakdown Cards (4-column grid):**
1. 🏆 **Meals Logged** (green) - This month count
2. 🏅 **Workouts** (orange) - This month count
3. 📅 **Streak Days** (mint) - Current streak
4. ⚠️ **Penalties** (red) - Missed logs

**Score Range Reference:**
- 5-column color bar
- Each tier with label + range
- Visual guide for users

### Leaderboard Tab

**Top 50 Ranking:**
- Rank badges (🏆 gold, 🥈 silver, 🥉 bronze for top 3)
- Avatar + name + username
- FareScore (large, color-coded)
- Tier badge
- Weekly change (↑ +8, ↓ -3)
- Current user highlighted with green border + mint background

**Features:**
- Trophy icon for top 3 ranks
- Share button (future social feature)
- Auto-scroll to current user if not in top 10

### Friends Tab

**Friend Cards:**
- Avatar (circular)
- Name + username
- Current streak days (📅 icon)
- FareScore (large, color-coded)
- Weekly change indicator
- Tier badge
- **"Cheer" button** (❤️ icon) - Sends encouragement (+1 bonus score)

**Add Friend Button:**
- Prominent green button at top
- Opens friend search modal (future)

**Empty State:**
- Icon + message when no friends
- Encourages adding friends

---

## 🔐 Privacy Features

### Toggleable Visibility
- **Private Mode** toggle (planned)
- Hide FareScore from leaderboard
- Only show to friends
- Keep personal tracking active

### Friend System
- Opt-in friend connections
- Only see friends' scores if mutual
- Cheer/boost feature for encouragement
- No forced social comparison

---

## 🎯 User Psychology

### Why FareScore Works

1. **Familiar Framework:** Everyone understands credit scores = trust/consistency
2. **Slow Growth:** Prevents gaming, encourages real behavior change
3. **Visible Progress:** Daily actions compound into meaningful change
4. **Social Proof:** Leaderboard creates healthy competition
5. **Recovery Path:** Decay is gradual, users can bounce back
6. **Tier Goals:** Clear milestones to reach (Consistent Tracker → Goal Crusher)

### Behavioral Nudges

- **Morning:** "Log breakfast to start your daily points!"
- **Evening:** "Complete your food log to maintain your 14-day streak"
- **Weekly:** "You're 8 points away from 'Consistent Tracker' tier!"
- **Social:** "Your friend Julia just hit 'FareFit Elite' - send a cheer!"

---

## 📱 Mobile Experience

- **Circular gauge** adapts to small screens
- **Graph** switches to horizontal scroll on mobile
- **Activity cards** stack vertically (1-column)
- **Leaderboard** optimized for tap targets
- **Swipe** between tabs (native feel)

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] **Achievements System:** Unlock badges at score milestones
- [ ] **Score Prediction:** "At this pace, reach 700 in 8 weeks"
- [ ] **Detailed Breakdown:** See which actions contributed most
- [ ] **Score History Export:** Download CSV of score over time
- [ ] **Personalized Tips:** AI suggestions to improve score

### Phase 3 Features
- [ ] **Challenges:** "Maintain 650+ for 30 days"
- [ ] **Team Scores:** Aggregate friend group average
- [ ] **Coach Integration:** Barry AI ties tips to FareScore
- [ ] **Premium Tiers:** Advanced analytics for subscribers
- [ ] **Webhooks:** Notify users of score changes

---

## 🛠️ Database Schema (For Dev Team)

```sql
-- User FareScore Table
CREATE TABLE user_farescore (
  user_id UUID PRIMARY KEY,
  current_score INTEGER DEFAULT 350,
  streak_days INTEGER DEFAULT 0,
  meals_logged_this_month INTEGER DEFAULT 0,
  workouts_this_month INTEGER DEFAULT 0,
  penalties_this_month INTEGER DEFAULT 0,
  consistency_rate DECIMAL(3,2) DEFAULT 0.00,
  last_update TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Score History (for graphing)
CREATE TABLE farescore_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard View
CREATE VIEW farescore_leaderboard AS
SELECT 
  u.id,
  u.name,
  u.username,
  u.avatar_url,
  fs.current_score,
  fs.streak_days,
  CASE 
    WHEN fs.current_score >= 800 THEN 'FareFit Elite'
    WHEN fs.current_score >= 700 THEN 'Goal Crusher'
    WHEN fs.current_score >= 550 THEN 'Consistent Tracker'
    WHEN fs.current_score >= 400 THEN 'Building Habits'
    ELSE 'Starting Journey'
  END AS tier,
  fs.current_score - LAG(fs.current_score, 1) OVER (PARTITION BY u.id ORDER BY fs.last_update) AS weekly_change
FROM users u
JOIN user_farescore fs ON u.id = fs.user_id
WHERE u.farescore_public = TRUE
ORDER BY fs.current_score DESC
LIMIT 50;
```

---

## 🎯 Success Metrics

### KPIs to Track
- **Average FareScore:** Track cohort progression
- **Tier Distribution:** % of users in each tier
- **Weekly Active Rate:** % of users with score changes
- **Churn Correlation:** Do higher scores = lower churn?
- **Social Engagement:** Friend adds, cheers sent

### Expected Outcomes
- **Month 1:** 70% of users above starting score (350)
- **Month 3:** Average score 420-450
- **Month 6:** 30% reach "Consistent Tracker" tier (550+)
- **Year 1:** Top 10% reach "Goal Crusher" (700+)

---

## 📚 Related Documentation

- **AI Tip System:** `/AI_TIP_SYSTEM.md` - Personalized suggestions
- **Progress Tracking:** `/components/ProgressPage.tsx` - Charts & trends
- **Database Schema:** `/DATABASE_INTEGRATION_GUIDE.md` - Full backend setup
- **Authentication:** `/AUTHENTICATION_FLOW.md` - User management

---

## 🚀 Getting Started (For Users)

1. **Sign up** and complete onboarding
2. **Your FareScore starts at 350**
3. **Log meals and workouts daily** to grow your score
4. **Check your Account page** to track progress
5. **Add friends** to compare and encourage each other
6. **Aim for streaks** - consistency compounds!

**First Week Goal:** Reach 365 (log consistently for 7 days)
**First Month Goal:** Reach 400 (enter Building Habits tier)
**First Quarter Goal:** Reach 550 (enter Consistent Tracker tier)

---

**Built with the Fresh Start color palette**
**Inspired by FICO credit scores**
**Designed for sustainable behavior change** 🌱
