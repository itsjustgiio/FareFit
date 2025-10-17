# Quick Dark Mode Fix - Comprehensive Color Replacement Guide

## Remaining Files to Update

The following components need all hardcoded colors replaced with CSS variables for dark mode support:

### 1. Privacy Page (`/components/PrivacyPage.tsx`)
### 2. Fitness Goal Page (`/components/FitnessGoalPage.tsx`)
### 3. Coach AI Page (`/components/CoachAIPage.tsx`)
### 4. Food Assistant Page (`/components/FoodAssistantPage.tsx`)
### 5. Workout Detail Page (`/components/WorkoutDetailPage.tsx`)
### 6. Meal Logging Page (`/components/MealLoggingPage.tsx`)

## Global Find & Replace Instructions

For EACH of the above files, apply these replacements:

### Background Colors
```
backgroundColor: '#E8F4F2'  →  backgroundColor: 'var(--color-background)'
backgroundColor: 'white'     →  backgroundColor: 'var(--color-card-bg)'
backgroundColor: '#FBEBD9'   →  backgroundColor: 'var(--color-form-bg)'
bg-white                     →  Remove class, use style={{ backgroundColor: 'var(--color-card-bg)' }}
```

### Text Colors
```
color: '#102A43'  →  color: 'var(--color-text)'
```

### Primary Color
```
color: '#1C7C54'          →  color: 'var(--color-primary)'
backgroundColor: '#1C7C54' →  backgroundColor: 'var(--color-primary)'
```

### Borders
```
borderColor: '#A8E6CF'      →  borderColor: 'var(--color-border)'
borderBottom: '1px solid #A8E6CF'  →  borderBottom: '1px solid var(--color-border)'
border: '1px solid #A8E6CF'  →  border: '1px solid var(--color-border)'
```

### Light Backgrounds
```
backgroundColor: '#1C7C5420'  →  backgroundColor: 'var(--color-primary-light)'
backgroundColor: '#1C7C5410'  →  backgroundColor: 'var(--color-primary-light)'
```

### Specific Cases
```
F5F5F5 (gray background in AI messages)  →  var(--color-gray-light)
```

## Manual Checks Needed

After replacement, manually verify:
1. Dialog/modal backgrounds use `var(--color-card-bg)`
2. Input backgrounds use `var(--color-form-bg)` or `var(--color-card-bg)`
3. All hover states with `hover:bg-gray-50` should also have `dark:hover:bg-gray-800`
4. Charts and special colored elements that should stay the same color in dark mode (like #FFB6B9 accent)

## CSS Variables Reference

These are already defined in `/styles/globals.css`:

```css
:root {
  --color-background: #E8F4F2;
  --color-card-bg: white;
  --color-text: #102A43;
  --color-primary: #1C7C54;
  --color-border: #A8E6CF;
  --color-primary-light: #1C7C5420;
  --color-form-bg: #FBEBD9;
  --color-gray-light: #F5F5F5;
}

[data-theme="dark"] {
  --color-background: #0F1C14;
  --color-card-bg: #1A2820;
  --color-text: #E8F4F2;
  --color-primary: #4DD4AC;
  --color-border: #2D4A3A;
  --color-primary-light: #4DD4AC20;
  --color-form-bg: #243329;
  --color-gray-light: #2D4A3A;
}
```

## Testing Checklist

After applying changes, test each page in both themes:
- [ ] Privacy Page - light & dark
- [ ] Terms Page - light & dark ✅
- [ ] Fitness Goal Page - light & dark
- [ ] Coach AI Page - light & dark  
- [ ] Food Assistant Page - light & dark
- [ ] Workout Detail Page - light & dark
- [ ] Meal Logging Page - light & dark
- [ ] Feedback Modal - light & dark ✅
