# Dark Mode Completion Guide

This document outlines the comprehensive dark mode implementation for all remaining FareFit components.

## Components Updated

### ✅ Already Completed
- GreetingSection.tsx
- ScoreCards.tsx  
- ProgressPage.tsx (core components)
- HelpPage.tsx
- BarryChat.tsx
- FeedbackModal.tsx

### 🔄 In Progress  
The following components need CSS variable conversion:

1. **PrivacyPage.tsx** - Privacy settings and data controls
2. **TermsPage.tsx** - Terms of service
3. **FitnessGoalPage.tsx** - Goal setup and TDEE calculator
4. **CoachAIPage.tsx** - AI coaching assistant  
5. **FoodAssistantPage.tsx** - Food/meal recommendations
6. **WorkoutDetailPage.tsx** - Workout logging
7. **MealLoggingPage.tsx** - Meal entry interface

## Color Mapping

All hardcoded colors should be replaced with CSS variables:

| Old Color | CSS Variable | Usage |
|-----------|--------------|-------|
| `#E8F4F2` | `var(--color-background)` | Page background |
| `white` / `#FFFFFF` | `var(--color-card-bg)` | Card backgrounds |
| `#102A43` | `var(--color-text)` | Primary text |
| `#1C7C54` | `var(--color-primary)` | Primary green |
| `#A8E6CF` | `var(--color-border)` | Borders |
| `#1C7C5420` / `#1C7C5410` | `var(--color-primary-light)` | Light green backgrounds |
| `#FFB6B9` | `var(--color-accent)` | Accent color |

## Implementation Strategy

Due to the large file sizes, the approach is:

1. Replace all `backgroundColor: '#E8F4F2'` with `backgroundColor: 'var(--color-background)'`
2. Replace all `backgroundColor: 'white'` or `bg-white` with CSS variable usage
3. Replace all `color: '#102A43'` with `color: 'var(--color-text)'`
4. Replace all `borderColor: '#A8E6CF'` with `borderColor: 'var(--color-border)'`
5. Replace all `color: '#1C7C54'` with `color: 'var(--color-primary)'`

This ensures all components properly adapt to both light and dark themes.
