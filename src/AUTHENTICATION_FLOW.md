# FareFit Authentication & Onboarding Flow

## Complete User Journey

```
Landing Page
     ↓
  ┌──┴──┐
  │     │
Login  Sign Up
  │     │
  │     └──→ Onboarding (7 screens)
  │              ↓
  └──────────→ Welcome Banner → Dashboard
```

## Design System - Fresh Start Palette

```css
Text:        #102A43  (Dark blue-gray)
Background:  #E8F4F2  (Soft mint)
Primary:     #1C7C54  (Forest green)
Secondary:   #A8E6CF  (Light mint)
Accent:      #FFB6B9  (Soft coral/pink)
```

## Screens Overview

### 1. Landing Page
**Purpose:** Introduce the app and invite users to get started

**Design:**
- Large app icon (green with lightning bolt)
- Title: "Track your progress. Transform your habits."
- Subtitle: "Personalized fitness and nutrition insights — all in one place."
- Two prominent buttons: "Sign Up" (primary green) and "Log In" (outlined green)
- Three preview cards below:
  - "Track Meals" - Log your nutrition with AI assistance
  - "Log Workouts" - Record exercises and track progress
  - "See Results" - Visualize your fitness journey
- Clean white background with subtle icon illustrations
- Hidden "Demo" button (top-right) for quick testing

### 2. Sign Up Page
**Title:** "Create your account"

**Inputs:**
- Name (with user icon)
- Email (with mail icon)
- Password (with lock icon + show/hide toggle)
- Confirm Password (with lock icon + show/hide toggle)

**Features:**
- Green "Continue" button
- Link: "Already have an account? Log In"
- "← Back to home" link
- Form validation with error messages

**Colors:**
- Inputs: Light mint borders (#A8E6CF), focus state: forest green (#1C7C54)
- Errors: Soft coral background (#FFB6B9)

### 3. Log In Page
**Title:** "Welcome back"

**Inputs:**
- Email (with mail icon)
- Password (with lock icon + show/hide toggle)

**Features:**
- Green "Log In" button
- "Forgot Password?" link
- Social login buttons (Google, Apple) with icons
- Link: "Don't have an account? Sign up"
- "← Back to home" link

### 4. Onboarding Flow (8 Screens)

#### Progress Indicator
- Appears on screens 1-6
- Back button (chevron left) on left
- "X of 6" counter on right
- Progress bar: light mint background, forest green fill

#### Screen 1: Welcome / Social Proof
- Icon: Lightning bolt in light mint circle
- "Trusted by millions worldwide" badge
- Title: "Welcome to FareFit"
- Subtitle: "Let's personalize your experience"
- 3 testimonial cards with 5-star ratings (coral stars)
- Green "Continue" button
- "Takes about 2 minutes" note

#### Screen 2: Assigned Sex at Birth
- Title: "What is your assigned sex at birth?"
- Subtitle: "This helps us calculate accurate calorie and macro targets"
- Two cards: "Male" and "Female"
- Selected state: light mint background, forest green border
- Auto-advances after selection

#### Screen 3: Birthday
- Icon: Calendar in light mint circle
- Title: "When is your birthday?"
- Subtitle: "We use this to personalize your experience"
- iOS-style date picker
- Green "Continue" button

#### Screen 4: Height
- Icon: Ruler in light mint circle
- Title: "How tall are you?"
- Unit toggle: cm / ft-in (pill-style toggle)
- Large number display in forest green
- Horizontal slider (120-220 cm range)
- Green "Continue" button

#### Screen 5: Weight
- Icon: Weight scale in light mint circle
- Title: "How much do you weigh?"
- Unit toggle: kg / lb (pill-style toggle)
- Large number display (shows "60.0" format)
- Horizontal slider (30-200 kg range)
- Note: "Don't have a scale? Enter your best estimate."
- Green "Continue" button

#### Screen 6: Activity Level
- Title: "How active are you? 💪"
- Subtitle: "This helps us calculate your daily calorie needs"
- 5 stacked cards:
  1. **Not Active** - Little to no exercise, desk job
  2. **Lightly Active** - Exercise 1-3 days/week
  3. **Moderately Active** - Exercise 3-5 days/week
  4. **Very Active** - Exercise 6-7 days/week
  5. **Extremely Active** - Exercise 2× per day
- Selected state: light mint background, forest green border
- Auto-advances after selection

#### Screen 7: Notifications
- Icon: Bell in light mint circle
- Title: "Reach your goals with notifications"
- Subtitle: "Get timely updates to keep you motivated. You can turn off notifications anytime in Settings."
- Sample notification preview (mint background):
  - FareFit icon (forest green circle)
  - "Great job logging breakfast! You're 25% towards your protein goal."
  - Timestamp: "now"
- Toggle switch with explanation
- Green "Continue" button

#### Screen 8: Final Confirmation
- Icon: Large checkmark in light mint circle
- Title: "You're all set!"
- Subtitle: "Your personalized dashboard is ready. Let's start your fitness journey!"
- Green "Go to Dashboard" button
- No progress bar (completion state)

### 5. Welcome Banner
**Appears:** After completing onboarding, on first dashboard view

**Design:**
- Gradient background: forest green → light mint
- Title: "Welcome to FareFit, {Name}! 🎉"
- Message: "You're all set! Your personalized dashboard is ready..."
- Feature bullets with white dots
- Dismiss button (X) in top-right
- Animated entrance from top

### 6. Dashboard
**Full App Access with:**
- User menu in header (name + dropdown)
- Logout option
- Personalized greeting with time-of-day detection
- All FareFit features unlocked

## Data Flow

### Collected Data Structure
```typescript
{
  // Auth data
  email: string
  name: string
  password: string (mock - not production-ready)
  
  // Onboarding data
  sex: 'male' | 'female'
  birthday: Date
  height: number
  heightUnit: 'cm' | 'ft'
  weight: number
  weightUnit: 'kg' | 'lb'
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extremely-active'
  notificationsEnabled: boolean
}
```

### LocalStorage Keys
- `farefit_user` - Current session
- `farefit_user_{email}` - Individual user profiles
- `fitnessGoal` - Goal calculations
- `workoutData` - Workout history
- `loggedMacros` - Daily nutrition tracking

## Transitions & Animations

### Landing → Auth
- Fade and slide from right

### Auth → Onboarding
- Fade and scale

### Onboarding Steps
- Next: Slide left, fade in
- Back: Slide right, fade in
- Progress bar: Smooth width animation

### Onboarding → Dashboard
- Fade in welcome banner from top
- Dashboard fades in behind

### Button Interactions
- Hover: Shadow lift, slight translate up
- Active: Scale down slightly
- Disabled: 40% opacity, no pointer

## Components

### Created
- `LandingPage.tsx` - Marketing introduction
- `AuthPage.tsx` - Login/Signup forms with toggle
- `OnboardingFlow.tsx` - 8-screen data collection
- `WelcomeBanner.tsx` - Post-onboarding celebration

### Modified
- `App.tsx` - Authentication routing logic
- `Header.tsx` - User menu with logout
- `GreetingSection.tsx` - Dynamic user greeting

## Testing Features

### Demo Mode
- Click "Demo" button on landing page
- Instant access with pre-filled data
- Email: demo@farefit.com
- Skips all authentication and onboarding

### Quick Test Flow
1. Landing → Sign Up
2. Fill: Name, Email, Password (min 6 chars)
3. Complete all 7 onboarding screens
4. See welcome banner
5. Access dashboard

## Design Principles

1. **Clean & Minimal** - White cards on soft backgrounds
2. **Consistent Spacing** - 8px grid system
3. **Friendly Typography** - Large headings, readable body text
4. **Smooth Animations** - Motion for all transitions
5. **Clear Hierarchy** - Primary actions stand out
6. **Progress Indicators** - Users always know where they are
7. **Validation Feedback** - Immediate, helpful error messages
8. **Mobile-First** - Responsive on all screen sizes

## Notes

⚠️ **Not Production Ready**
- Uses localStorage (insecure for real passwords)
- No email verification
- No password reset functionality
- Social logins are UI-only
- Mock authentication logic

✅ **Perfect For**
- Prototyping and demos
- User flow testing
- Design validation
- Investor presentations
- Usability studies

🔄 **Supabase Upgrade Path**
- Replace localStorage with Supabase Auth
- Add email verification
- Implement OAuth providers
- Store onboarding data in user profiles table
- Add password reset via email

## Color Usage Guide

| Element | Color | Hex |
|---------|-------|-----|
| Headings | Text | #102A43 |
| Body text | Text 70% | #102A43 (0.7 opacity) |
| Backgrounds (screens) | Background | #E8F4F2 |
| Cards | White | #FFFFFF |
| Primary buttons | Primary | #1C7C54 |
| Button borders | Secondary | #A8E6CF |
| Selected states | Secondary | #A8E6CF |
| Focus borders | Primary | #1C7C54 |
| Error backgrounds | Accent | #FFB6B9 |
| Icons | Primary | #1C7C54 |
| Stars/ratings | Accent | #FFB6B9 |

## Accessibility

- All buttons have proper labels
- Forms use semantic HTML
- Color contrast meets WCAG AA standards
- Focus states clearly visible
- Keyboard navigation supported
- Screen reader friendly
