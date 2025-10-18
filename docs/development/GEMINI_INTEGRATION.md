# Gemini AI Integration Guide

## 🚀 Setup Steps

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 2. Environment Variables

Create a `.env` file in your project root:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Integration Examples

#### Food Assistant Integration

```typescript
// In FoodAssistantPage.tsx
import { getGeminiService } from "../services/geminiService";

const handleSendMessage = async () => {
  // ... existing code ...

  try {
    const gemini = getGeminiService();
    const response = await gemini.getFoodSuggestion(inputValue, {
      remainingCalories: remainingMacros.calories,
      remainingProtein: remainingMacros.protein,
      remainingCarbs: remainingMacros.carbs,
      remainingFat: remainingMacros.fat,
      goalType: userGoal?.goalType || "maintain",
      hasWorkedOut: true, // Get from your workout data
    });

    const assistantResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      sender: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantResponse]);
  } catch (error) {
    console.error("AI Error:", error);
    // Fallback to your existing mock responses
  }
};
```

#### Coach AI Integration

```typescript
// In CoachAIPage.tsx
import { getGeminiService } from "../services/geminiService";

const getCoachResponse = async (input: string) => {
  try {
    const gemini = getGeminiService();
    return await gemini.getCoachAdvice(input, {
      goalType: "bulk", // Get from user data
      experienceLevel: userExperience,
      recentWorkouts: ["Push Day", "Pull Day"], // Get from workout history
    });
  } catch (error) {
    console.error("Coach AI Error:", error);
    return "I'm having trouble connecting right now. Please try again!";
  }
};
```

## 🤖 Your 3 AI Agents

### 1. **AI Tip Banner** (Keep Current Structure)

- File: `src/utils/aiTipGenerator.ts`
- Purpose: Smart local tips, no API needed
- Keep as-is - works great for instant feedback

### 2. **Food Assistant** (Gemini Integration)

- Component: `src/components/FoodAssistantPage.tsx`
- Service: `src/services/geminiService.getFoodSuggestion()`
- Purpose: Meal suggestions, recipe ideas, nutrition advice

### 3. **Coach AI** (Gemini Integration)

- Component: `src/components/CoachAIPage.tsx`
- Service: `src/services/geminiService.getCoachAdvice()`
- Purpose: Workout plans, form tips, motivation

## 💡 Recommendations

### Keep Local for Speed:

- ✅ AI Tip Banner (instant, no API calls)
- ✅ Simple calculations
- ✅ Basic reminders

### Use Gemini for Conversation:

- ✅ Food Assistant chat
- ✅ Coach AI chat
- ✅ Complex meal planning
- ✅ Workout programming

## 🛠️ Next Steps

1. **Test Gemini API**: Get your API key and test the service
2. **Replace Mock Responses**: Update your components to use Gemini
3. **Add Error Handling**: Fallback to local responses if API fails
4. **Optimize Prompts**: Fine-tune system prompts for better responses

This approach gives you the best of both worlds - instant local tips + powerful conversational AI!
