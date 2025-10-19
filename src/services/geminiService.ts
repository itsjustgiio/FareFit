/**
 * Gemini API Service
 * Handles all AI interactions with Google Gemini
 */

interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * ✉️ Standard single-response call
   */
  async chat(messages: GeminiMessage[], model: string = 'gemini-2.5-flash'): Promise<string> {
    try {
      const requestUrl = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: messages,
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
        },
      };

      console.log('🤖 Gemini API Request:', {
        url: requestUrl.replace(this.apiKey, '***API_KEY***'),
        model,
        messageCount: messages.length,
        firstMessagePreview: messages[0]?.parts[0]?.text?.substring(0, 200) + '...'
      });

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Gemini API error (${response.status}): ${response.statusText} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Sorry, I could not generate a response.'
      );
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * ⚡ Streaming real-time response (for live typing effect)
   */
  async *streamChat(messages: GeminiMessage[], model: string = 'gemini-2.5-flash') {
    const res = await fetch(`${this.baseUrl}/${model}:streamGenerateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch (e) {
          console.warn('Stream parse error:', e);
        }
      }
    }
  }

  /**
   * 🥗 Food Assistant - Generate meal/snack ideas
   */
  async getFoodSuggestion(
    userMessage: string,
    userContext: {
      remainingCalories: number;
      remainingProtein: number;
      remainingCarbs: number;
      remainingFat: number;
      goalType: 'cut' | 'bulk' | 'maintain';
      hasWorkedOut: boolean;
    }
  ): Promise<string> {
    const systemPrompt = `You are Food Assistant, a friendly nutrition coach in the FareFit app.

User's Context:
- Remaining calories: ${userContext.remainingCalories}
- Remaining protein: ${userContext.remainingProtein}g
- Remaining carbs: ${userContext.remainingCarbs}g
- Remaining fat: ${userContext.remainingFat}g
- Goal: ${userContext.goalType}
- Worked out today: ${userContext.hasWorkedOut}

Respond with:
1. A short analysis of how their nutrition looks so far.
2. 2–3 realistic food or meal suggestions to balance their macros.
3. Keep it conversational and motivational. Avoid strict dietary advice.`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return this.chat(messages);
  }

  /**
   * 🏋️ Coach AI - Personalized workout advice
   */
  async getCoachAdvice(
    userMessage: string,
    userContext: {
      goalType: 'cut' | 'bulk' | 'maintain';
      experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
      recentWorkouts?: string[];
    }
  ): Promise<string> {
    const systemPrompt = `You are Coach AI, a fitness trainer in the FareFit app.

User's Profile:
- Goal: ${userContext.goalType}
- Experience: ${userContext.experienceLevel}
- Recent workouts: ${userContext.recentWorkouts?.join(', ') || 'None logged'}

Provide specific, encouraging feedback and practical exercise advice.`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return this.chat(messages);
  }

  /**
   * 🎯 Plan Generator - Create 4-week personalized fitness plans
   */
  async generatePersonalizedPlan(userContext: {
    age: number;
    weight: number;
    height: number;
    gender: 'male' | 'female';
    goalType: 'cut' | 'bulk' | 'maintain';
    activityLevel: string;
    targetCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    tdee: number;
  }): Promise<string> {
    const goalDescriptions = {
      cut: 'lose fat while preserving muscle',
      bulk: 'build lean muscle mass with minimal fat gain',
      maintain: 'maintain current weight and improve body composition'
    };

    const activityDescriptions: { [key: string]: string } = {
      '1.2': 'sedentary lifestyle',
      '1.375': 'lightly active (1-3 days/week)',
      '1.55': 'moderately active (3-5 days/week)',
      '1.725': 'very active (6-7 days/week)',
      '1.9': 'extremely active (physical job + daily training)'
    };

    const systemPrompt = `Create a fitness plan as JSON. Respond with ONLY this JSON structure and no other text:

{
  "summary": {
    "daily_calories": ${userContext.targetCalories},
    "macros": {
      "protein": ${userContext.macros.protein},
      "carbs": ${userContext.macros.carbs},
      "fat": ${userContext.macros.fat},
      "fiber": ${userContext.macros.fiber}
    },
    "goal_description": "${goalDescriptions[userContext.goalType]}"
  },
  "weeks": [
    {
      "week": 1,
      "focus": "Foundation Building",
      "nutrition": ["Track calories daily", "Eat protein with meals", "Stay hydrated"],
      "workouts": ["3x strength training", "2x cardio"],
      "motivation": "Start small, build consistency!"
    },
    {
      "week": 2,
      "focus": "Building Momentum", 
      "nutrition": ["Meal prep twice weekly", "Include vegetables", "Control portions"],
      "workouts": ["4x strength training", "2x cardio"],
      "motivation": "Consistency beats perfection."
    },
    {
      "week": 3,
      "focus": "Pushing Forward",
      "nutrition": ["Focus on whole foods", "Time nutrients", "Plan ahead"],
      "workouts": ["4x strength training", "3x cardio"],
      "motivation": "You're building lasting habits."
    },
    {
      "week": 4,
      "focus": "Finishing Strong",
      "nutrition": ["Trust the process", "Adjust as needed", "Celebrate progress"],
      "workouts": ["5x strength training", "3x cardio"],
      "motivation": "Strong finishes create strong beginnings."
    }
  ]
}`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] }
    ];

    const response = await this.chat(messages, 'gemini-2.5-flash');
    
    console.log('🤖 Raw Gemini response:', response);
    console.log('🤖 Response length:', response.length);
    console.log('🤖 First 200 chars:', response.substring(0, 200));
    
    // Clean response to ensure it's valid JSON
    const cleanedResponse = this.cleanJsonResponse(response);
    
    return cleanedResponse;
  }

  /**
   * Clean and validate JSON response from Gemini
   */
  private cleanJsonResponse(response: string): string {
    // Remove any markdown formatting
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Try to find JSON object boundaries
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
    
    // Validate JSON
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (error) {
      console.error('❌ Invalid JSON response from Gemini:', error);
      throw new Error('Gemini returned invalid JSON format');
    }
  }
}

// 🔁 Singleton pattern to prevent multiple instances
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    console.log('🔑 Checking Gemini API key...');
    console.log('Environment variables available:', Object.keys((import.meta as any).env));
    
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ VITE_GEMINI_API_KEY not found in environment variables');
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    }
    
    if (!apiKey.startsWith('AIza')) {
      console.warn('⚠️ Gemini API key format may be incorrect - should start with "AIza"');
    }
    
    console.log('✅ Gemini API key loaded successfully');
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
}

export { GeminiService };
export type { GeminiMessage, GeminiResponse };
