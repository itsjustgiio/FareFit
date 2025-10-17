# Meal Logging Page Documentation

## Overview

The Meal Logging Page is a dedicated full-screen AI-powered interface that provides four intuitive ways for users to log their meals:

1. **Manual Entry** - Multi-item form-based input with flexible meal naming and serving size calculations
2. **Barcode Scan** - Scan product barcodes for instant nutrition data (also integrated within each food item)
3. **Photo Scan** - AI-powered food recognition from images
4. **Ask Food AI** - Natural language meal description that parses into individual items

## New Features (Latest Update)

### 🎯 Intelligent Serving Size System
- **Base Nutrition Per Serving:** Enter nutrition values for one standard serving
- **Amount Consumed:** Specify how many servings eaten (e.g., 0.5, 1.2, 2.0)
- **Auto-Calculation:** All macros automatically multiply based on servings consumed
- **Real-time Updates:** Totals recalculate instantly as you adjust amounts

### 📊 Live Total Nutrition Summary
- **Top Position:** Moved above food items for constant visibility
- **Animated Updates:** Numbers smoothly transition when values change
- **Per-Item Breakdown:** Expandable tooltip showing contribution of each food
- **Auto-update Message:** Clear indication that totals update automatically

### 📷 Integrated Barcode Scanning
- **Per-Item Scanner:** Each food card has its own "Scan Barcode" button
- **Auto-Fill Fields:** Scanned data populates name, serving size, and nutrition
- **Editable After Scan:** Users can adjust any field post-scan
- **No Tab Switching:** Stay in Manual Entry tab while scanning

## Component Architecture

### Main Component
**Location:** `/components/MealLoggingPage.tsx`

The page is a full-screen experience (not a modal) with a persistent bottom summary bar showing real-time macro totals. Uses ShadCN tabs for navigation between logging methods.

## Logging Methods

### 1. Manual Entry Tab 🍳

**Best for:** Users who want to build complex meals with multiple ingredients

**NEW Features:**
- **Multi-Item System:** Add unlimited food items to one meal (e.g., "Shake" = milk + protein + banana + peanut butter)
- **Flexible Meal Naming:** Choose between preset types (Breakfast/Lunch/Dinner/Snack) OR enter custom names (e.g., "Post-Workout", "Late-Night Bowl")
- **Collapsible Items:** Each food item can expand/collapse for cleaner view
- **Running Totals:** Bottom bar shows live sum of all items' macros
- **Dynamic Add/Remove:** "➕ Add Item" button creates new input rows; trash icon removes items
- Individual item tracking: name, portion, calories*, protein, carbs, fat, fiber
- Form validation (requires at least one item with name + calories)

**User Flow:**
1. Choose meal name type: Preset (dropdown) or Custom (text input)
2. If custom, enter name like "Shake", "Post-Workout Meal", etc.
3. Add first food item:
   - Enter food name (e.g., "Whey Protein Powder")
   - Add portion (e.g., "1 scoop, 30g")
   - Enter calories (required) and macros (optional)
4. Click "➕ Add Item" to add more ingredients
5. Each item can be collapsed/expanded via chevron icon
6. View real-time totals in bottom summary bar
7. Click "Save Meal"
8. Success toast appears: "✅ [Meal Name] logged successfully! [Total] kcal added."

**Data Structure:**
```typescript
// Individual food item (NEW STRUCTURE)
{
  id: string;
  name: string;              // Required
  servingSize: string;       // e.g., "1 cup (150g)", "1 scoop (30g)"
  amountConsumed: number;    // e.g., 0.75, 1.0, 2.5 servings
  
  // Base values (per single serving)
  baseCalories: number;      // Required - calories per serving
  baseProtein: number;       // Optional - protein per serving
  baseCarbs: number;         // Optional - carbs per serving
  baseFat: number;           // Optional - fat per serving
  baseFiber: number;         // Optional - fiber per serving
  
  // Calculated values (base × amountConsumed)
  calories: number;          // Auto-calculated
  protein: number;           // Auto-calculated
  carbs: number;             // Auto-calculated
  fat: number;               // Auto-calculated
  fiber: number;             // Auto-calculated
  
  isExpanded: boolean;       // UI state
}

// Complete meal
{
  id: string;
  name: string;              // Custom or preset name
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: FoodItem[];         // Array of food items
  calories: number;          // Sum of all items
  protein: number;           // Sum of all items
  carbs: number;             // Sum of all items
  fat: number;               // Sum of all items
  fiber: number;             // Sum of all items
  timestamp: Date;
}
```

### 2. Barcode Scan Tab 📊

**NEW FEATURE - Best for:** Packaged foods with barcodes (protein bars, supplements, boxed meals)

**Features:**
- Camera access to scan UPC/EAN/QR codes
- Instant product database lookup
- Auto-fill nutrition from barcode data
- Add directly to meal as a new item
- Can scan multiple products and add to same meal

**User Flow:**
1. Click "Start Scanning"
2. Point camera at product barcode
3. AI scans and retrieves product info (2-second simulation)
4. Review detected product and nutrition
5. Click "Add to Meal" → item is added to Manual Entry tab
6. Can scan more items or switch to Manual tab to review/edit
7. Continue building meal with other items

**Barcode Detection Display:**
```
✅ Product Found:

Product Name: Optimum Nutrition Gold Standard Whey
Serving Size: 1 scoop (30g)
───────────────────────────
Calories: 120 kcal

Protein: 24g  |  Carbs: 3g  |  Fat: 1g  |  Fiber: 1g
```

**Scanner Tips (shown in UI):**
- Make sure barcode is well-lit and in focus
- Hold camera 4-6 inches from the barcode
- Works with UPC, EAN, and QR codes

### 3. Photo Scan Tab 📸

**Best for:** Home-cooked meals, restaurant plates, complex dishes with multiple visible ingredients

**ENHANCED Features:**
- Drag & drop upload zone
- Camera access (for mobile devices)
- **Multi-item AI detection** - recognizes EACH ingredient separately
- Auto-populates Manual Entry tab with all detected items
- Visual feedback during analysis

**User Flow:**
1. Click or drag to upload photo
2. AI analyzes image (2.5-second simulation)
3. **AI detects multiple items** and breaks down the meal:
   - "Grilled Chicken Salad" → 4 items detected
   - Grilled Chicken Breast (150g) - 248 kcal
   - Mixed Greens (2 cups) - 20 kcal
   - Cherry Tomatoes (½ cup) - 27 kcal
   - Olive Oil Dressing (2 tbsp) - 125 kcal
4. User reviews AI-detected items list
5. User can either:
   - Click "Use These Items" → all items added to Manual Entry tab
   - Click "Retake Photo" to try again
6. Switch to Manual tab to review, edit, or add more items

**AI Detection Display:**
```
✨ AI Detected 4 Items:

• Grilled Chicken Breast (150g) - 248 kcal
• Mixed Greens (2 cups) - 20 kcal
• Cherry Tomatoes (½ cup) - 27 kcal
• Olive Oil Dressing (2 tbsp) - 125 kcal
```

**Photo Tips (shown in UI):**
- Good lighting helps AI detect foods better
- Capture the entire plate or packaging label
- Multiple items? The AI will identify each one

### 4. Ask Food AI Tab 🤖

**Best for:** Quick logging with natural language, describing complex meals verbally

**ENHANCED Features:**
- Natural language text input
- **AI parsing into individual food items** (not just totals)
- Automatic portion estimation
- Auto-populates Manual Entry tab with parsed items
- Can suggest missing macros for incomplete descriptions

**User Flow:**
1. Type meal description in natural language
   - Example: "Protein shake with almond milk, 1 scoop whey, banana, and peanut butter"
2. Click "Ask Food AI"
3. AI parses input (1.8-second simulation)
4. **AI breaks description into 4 separate items:**
   - Almond Milk (1 cup) - 30 kcal | P: 1g C: 1g F: 2.5g
   - Whey Protein Powder (1 scoop) - 120 kcal | P: 24g C: 3g F: 1g
   - Banana (1 medium) - 105 kcal | P: 1g C: 27g F: 0g
   - Peanut Butter (1 tbsp) - 95 kcal | P: 4g C: 3g F: 8g
5. User can either:
   - Click "Use These Items" → all items added to Manual Entry tab
   - Click "Try Again" to re-describe
6. Switch to Manual tab to review, adjust portions, or add more items

**Example Inputs:**
- "Large chicken burrito with rice, beans, cheese"
- "Greek yogurt with granola and blueberries"
- "Protein shake with 1 scoop whey and almond milk"

**AI Parsed Output:**
```
🤖 AI Parsed 4 Items:

Almond Milk (1 cup)             30 kcal
Whey Protein Powder (1 scoop)  120 kcal
Banana (1 medium)              105 kcal
Peanut Butter (1 tbsp)          95 kcal
```

## Integration with Dashboard

### Opening the Page

The Meal Logging Page can be accessed from multiple locations:

**1. CaloriesCard (Empty State)**
```tsx
<CaloriesCard 
  onLogMealClick={() => setCurrentPage('meal-logging')}
  // ... other props
/>
```
Shows "Log Meal" button when no calories are logged.

**2. MealsCard (Empty State)**
```tsx
<MealsCard 
  onLogMealClick={() => setCurrentPage('meal-logging')}
  // ... other props
/>
```
Shows "Log Your First Meal" button when no meals exist.

**3. Navigation**
Page is added to App.tsx routing:
```tsx
if (currentPage === 'meal-logging') {
  return (
    <MealLoggingPage
      onBack={() => setCurrentPage('dashboard')}
      onMealLogged={handleMealLogged}
    />
  );
}
```

### Data Flow

```typescript
// 1. User builds meal with multiple items
const foodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Almond Milk',
    portion: '1 cup',
    calories: 30,
    protein: 1,
    carbs: 1,
    fat: 2.5,
    fiber: 1,
    isExpanded: false,
  },
  {
    id: '2',
    name: 'Whey Protein Powder',
    portion: '1 scoop',
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 1,
    fiber: 1,
    isExpanded: false,
  },
  // ... more items
];

// 2. System calculates totals from all items
const totals = foodItems.reduce((acc, item) => ({
  calories: acc.calories + item.calories,
  protein: acc.protein + item.protein,
  carbs: acc.carbs + item.carbs,
  fat: acc.fat + item.fat,
  fiber: acc.fiber + item.fiber,
}), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

// 3. Complete meal object created
const meal = {
  id: Date.now().toString(),
  name: 'Protein Shake', // Custom or preset name
  mealType: 'snack',
  items: foodItems, // Full array of food items
  calories: totals.calories, // Sum
  protein: totals.protein,   // Sum
  carbs: totals.carbs,       // Sum
  fat: totals.fat,           // Sum
  fiber: totals.fiber,       // Sum
  timestamp: new Date(),
};

// 4. Meal data is passed to handler
onMealLogged(meal);

// 5. App.tsx aggregates macros
const handleMealLogged = (meal) => {
  const updatedMacros = {
    calories: loggedMacros.calories + meal.calories,
    protein: loggedMacros.protein + meal.protein,
    carbs: loggedMacros.carbs + meal.carbs,
    fat: loggedMacros.fat + meal.fat,
    fiber: loggedMacros.fiber + meal.fiber,
  };
  updateLoggedMacros(updatedMacros);
  // TODO: Save meal with items array to database
};

// 6. Dashboard updates automatically
// CaloriesCard shows new totals
// AI Tips adjust based on new macros
// Circular macro rings fill accordingly
```

## UI/UX Features

### Full-Page Layout
- **Header:** Sticky top bar with back arrow, title, subtitle, and **Save icon** (top-right)
- **Content Area:** Max-width container (4xl) with generous padding
- **Bottom Bar:** Fixed position action buttons with total calories preview
- **Background:** Light gray (#F7F9FA) for depth
- **Animations:** Smooth transitions and number updates

### New Layout Order (Manual Entry Tab)
1. **Meal Type Selector** - Preset or Custom name
2. **📊 Total Nutrition Summary** - Live-updating card with:
   - Large calorie count (animated on change)
   - 4-column macro grid (Protein, Carbs, Fat, Fiber)
   - Info icon to expand per-item breakdown
   - Helper text: "Your total nutrition updates automatically..."
3. **➕ Add Item Button** - Dashed border, full-width
4. **Food Items List** - Collapsible cards with numbering

### Tabs
- Four equal-width tabs (Manual, Barcode, Photo, AI)
- Icons + text (icons only on mobile <sm breakpoint)
- Green underline indicator (#1C7C54)
- Smooth transition between tabs
- Tab content scrolls independently

### Multi-Item Cards (UPDATED)
- **Collapsible Design:** Each food item is a card with expand/collapse
- **Numbered Badges:** Circular badges (1, 2, 3...) for item order
- **Header Preview:** Shows item name + servings multiplier + calories when collapsed
  - Example: "Protein Powder • 1.5x servings • 180 kcal"
- **Expand Animation:** Smooth height animation via Motion/React
- **Delete Button:** Red trash icon (only shows when >1 item exists)
- **Mint Border:** 2px border (#E8F4F2) for card separation

### Food Item Card Structure (Expanded)
1. **Food Name Input** with **Scan Barcode** button (side-by-side)
   - Barcode button: mint green (#A8E6CF), animates while scanning
2. **Serving Size & Amount Consumed** (2-column grid)
   - Serving Size: Text input (e.g., "1 cup (150g)")
   - Amount Consumed: Number input with 0.1 step (e.g., "0.75")
3. **Base Nutrition Per Serving** (mint background #E8F4F2)
   - Small inputs for: Calories*, Protein, Carbs, Fat, Fiber
   - Label: "Nutrition per serving"
4. **📊 Calculated Totals** (green border card)
   - Shows actual values after multiplying by amount consumed
   - 5-column grid: Calories, Protein, Carbs, Fat, Fiber
   - Color-coded values matching macro colors
   - Only appears when base values are entered

### Bottom Action Bar (SIMPLIFIED)
- **Persistent:** Always visible at bottom
- **Two Buttons:**
  - Cancel (outlined, gray)
  - Save Meal • [XXX] kcal (filled green, shows total calories)
- **No Duplicate Summary:** Totals moved to top section

### Form Styling
- Consistent Fresh Start color palette
- Green primary buttons (#1C7C54)
- Mint backgrounds for info cards (#E8F4F2)
- Proper spacing and typography
- Mobile-responsive grid layouts (2-col, 4-col)
- ShadCN inputs with proper labels

### Feedback
- **Loading States:** Animated sparkles icon rotating
- **Success:** Toast notification with meal name + calorie total
- **Error:** Toast for validation issues
- **Visual Confirmation:** Green checkmarks on buttons
- **Real-time Totals:** Bottom bar updates instantly

## Mock AI Behavior

Currently, the AI features use simulated responses for demonstration:

### Photo Scan Simulation
```typescript
const simulateAIAnalysis = () => {
  setIsAnalyzing(true);
  setTimeout(() => {
    setAnalyzedData({
      name: 'Grilled Chicken Salad',
      calories: 420,
      protein: 35,
      // ... etc
    });
    setIsAnalyzing(false);
  }, 2000); // 2-second delay
};
```

### Natural Language Parsing Simulation
```typescript
setTimeout(() => {
  setParsedMeal({
    name: 'Eggs, Banana & Toast with Peanut Butter',
    portion: '2 eggs, 1 banana, 2 toast slices, 2 tbsp peanut butter',
    calories: 485,
    // ... etc
  });
}, 1500); // 1.5-second delay
```

## Backend Integration Requirements

When connecting to a real backend, you'll need:

### 1. Food Recognition API
**Endpoint:** `POST /api/foods/analyze-image`
```typescript
Request:
{
  image: File | base64 string,
  userId: string
}

Response:
{
  foods: [
    {
      name: string,
      confidence: number,
      portion: string,
      nutrition: {
        calories: number,
        protein: number,
        carbs: number,
        fat: number,
        fiber: number
      }
    }
  ]
}
```

**Recommended Services:**
- Clarifai Food Model
- Google Cloud Vision API
- AWS Rekognition Custom Labels
- Nutritionix Track API

### 2. Natural Language Food Parser
**Endpoint:** `POST /api/foods/parse-description`
```typescript
Request:
{
  description: string,
  userId: string,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

Response:
{
  detectedFoods: string[],
  totalNutrition: {
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    fiber: number
  },
  mealName: string,
  confidence: number
}
```

**Recommended Services:**
- OpenAI GPT-4 with food database
- Nutritionix Natural Language API
- Edamam Food Database API
- USDA FoodData Central

### 3. Meal Storage
**Endpoint:** `POST /api/users/:userId/meals`
```typescript
Request:
{
  name: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  timestamp: ISO8601 string,
  nutrition: {
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    fiber: number
  },
  portion?: string,
  source: 'manual' | 'photo' | 'ai-text'
}

Response:
{
  id: string,
  ...meal data,
  createdAt: ISO8601 string
}
```

## Accessibility

- **Keyboard Navigation:** Full tab support through form fields
- **Screen Readers:** Proper labels and ARIA attributes
- **Focus Management:** Auto-focus on first input when tab opens
- **Color Contrast:** WCAG AA compliant (white text on green)
- **Touch Targets:** Minimum 44px for mobile buttons

## Performance

- **Bundle Size:** ~15KB (with tree-shaking)
- **Dependencies:** Motion/React, ShadCN components
- **Image Handling:** Client-side compression before upload
- **Lazy Loading:** Modal only renders when `isOpen={true}`

## Future Enhancements

### Planned Features
1. **Barcode Scanner:** Scan nutrition labels for instant data
2. **Meal Templates:** Save and reuse common meals
3. **Recent Foods:** Quick-add from history
4. **Meal Suggestions:** AI recommends meals to meet macro targets
5. **Voice Input:** Speak your meal description
6. **Meal Sharing:** Share meals with friends/community
7. **Nutrition Insights:** "This meal is high in protein!" badges

### AI Improvements
1. **Multi-food Detection:** Recognize all items on a plate
2. **Portion Estimation:** Use visual cues to estimate serving sizes
3. **Brand Recognition:** Identify packaged food brands
4. **Confidence Scores:** Show AI certainty levels
5. **Learning:** Improve based on user corrections

## Testing Checklist

- [ ] Manual entry validates required fields
- [ ] Photo upload accepts images and triggers camera on mobile
- [ ] AI text parser handles empty input gracefully
- [ ] Success toast appears after logging
- [ ] Macros aggregate correctly in dashboard
- [ ] Modal closes on backdrop click
- [ ] Modal closes on X button click
- [ ] Tab navigation works smoothly
- [ ] Form resets after successful submission
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All buttons have proper hover states
- [ ] Keyboard navigation works throughout

## Code Example: Using the Page

```tsx
import { MealLoggingPage } from './components/MealLoggingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const handleMealLogged = (meal) => {
    console.log('New meal logged:', meal);
    console.log('Items:', meal.items); // Array of food items
    console.log('Total calories:', meal.calories);
    // Update your state/database
    setCurrentPage('dashboard'); // Navigate back
  };
  
  if (currentPage === 'meal-logging') {
    return (
      <MealLoggingPage
        onBack={() => setCurrentPage('dashboard')}
        onMealLogged={handleMealLogged}
      />
    );
  }
  
  return (
    <div>
      <button onClick={() => setCurrentPage('meal-logging')}>
        Log Meal
      </button>
      {/* Dashboard content */}
    </div>
  );
}
```

## Serving Size Calculation System

### How It Works

**Traditional Problem:**
- User eats 1.5 servings of protein powder
- Must manually calculate: 120 cal × 1.5 = 180 cal, 24g protein × 1.5 = 36g, etc.

**Our Solution:**
1. Enter **base nutrition per serving** (from barcode/label)
2. Enter **amount consumed** (0.5, 1.0, 2.5, etc.)
3. System **auto-calculates** actual macros
4. **Live preview** shows calculated totals for that item

### Example Workflow

```
Item: Whey Protein Powder
Serving Size: "1 scoop (30g)"

Base Nutrition (per serving):
- Calories: 120 kcal
- Protein: 24g
- Carbs: 3g
- Fat: 1g
- Fiber: 1g

Amount Consumed: 1.5 servings

→ Calculated Totals:
- Calories: 180 kcal
- Protein: 36g
- Carbs: 4.5g
- Fat: 1.5g
- Fiber: 1.5g
```

### Benefits
- ✅ No mental math required
- ✅ Accurate macro tracking for partial servings
- ✅ Easy to adjust portions after logging
- ✅ Works perfectly with barcode scanning
- ✅ Matches nutrition label format

## Key Improvements Over Previous Version

1. **Serving Size Calculator:** Auto-multiply macros based on servings consumed
2. **Integrated Barcode Scanning:** Scan button inside each food item card
3. **Top-Position Totals:** Always visible summary with animated updates
4. **Per-Item Breakdown:** Tooltip shows which items contribute what calories
5. **Flexible Naming:** Custom meal names allow for more personalized tracking
6. **Item Management:** Add, remove, collapse/expand individual items
7. **Better AI Integration:** Photo and AI text now populate item list with serving sizes
8. **Full-Screen Experience:** More space for complex meal building
9. **Save Icon:** Quick-save button in header for faster workflow

## Page Layout Diagram

```
┌─────────────────────────────────────────────┐
│ ← Log Your Meal                    [Save]  │ ← Header (sticky)
├─────────────────────────────────────────────┤
│                                             │
│  📋 Meal Type: [Preset ▼] or [Custom...] │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 📊 Total Nutrition           [ℹ️]     │ │
│  │                                       │ │
│  │         🔥 1,247 kcal                │ │
│  │                                       │ │
│  │  Protein  Carbs    Fat    Fiber      │ │
│  │   98g     112g    38g     18g        │ │
│  │                                       │ │
│  │  Updates automatically as you edit   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │        ➕ Add Item                   │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                             │
│  Food Items (3)                            │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 1️⃣ Whey Protein • 1.5x • 180 kcal [🗑️]│ │
│  ├───────────────────────────────────────┤ │
│  │ Name: [Whey Protein...] [📷 Scan]   │ │
│  │ Serving: [1 scoop]  Amount: [1.5]    │ │
│  │ Base/serving: 120cal 24p 3c 1f 1fi   │ │
│  │ → Calculated: 180cal 36p 4.5c 1.5f   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 2️⃣ Banana • 105 kcal             [🗑️]│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 3️⃣ Almond Milk • 30 kcal         [🗑️]│ │
│  └───────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│ [Cancel]  [✓ Save Meal • 1,247 kcal]      │ ← Bottom bar (fixed)
└─────────────────────────────────────────────┘
```

## Summary

The Meal Logging Page provides a powerful, flexible interface for tracking nutrition with four complementary input methods. The **serving size calculation system** eliminates mental math, the **integrated barcode scanning** speeds up packaged food entry, and the **live total nutrition summary** keeps users informed in real-time. The full-page design gives users ample space to build complex multi-item meals. The AI features (when connected to real APIs) will provide a best-in-class food tracking experience that surpasses apps like MyFitnessPal and Lose It! by breaking down meals into individual trackable components with intelligent serving size handling.
