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
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Send message to Gemini and get response
   */
  async chat(messages: GeminiMessage[], model: string = 'gemini-pro'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Food Assistant - Get meal suggestions
   */
  async getFoodSuggestion(userMessage: string, userContext: {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    goalType: 'cut' | 'bulk' | 'maintain';
    hasWorkedOut: boolean;
  }): Promise<string> {
    const systemPrompt = `You are Food Assistant, a nutrition coach in the FareFit app. 

User's Context:
- Remaining calories: ${userContext.remainingCalories}
- Remaining protein: ${userContext.remainingProtein}g
- Remaining carbs: ${userContext.remainingCarbs}g  
- Remaining fat: ${userContext.remainingFat}g
- Goal: ${userContext.goalType}
- Worked out today: ${userContext.hasWorkedOut}

Suggest 2-3 specific meals/snacks that fit their remaining macros. Be friendly and practical.`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    return this.chat(messages);
  }

  /**
   * Coach AI - Get workout and fitness advice
   */
  async getCoachAdvice(userMessage: string, userContext: {
    goalType: 'cut' | 'bulk' | 'maintain';
    experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    recentWorkouts?: string[];
  }): Promise<string> {
    const systemPrompt = `You are Coach AI, a fitness coach in the FareFit app.

User's Profile:
- Goal: ${userContext.goalType}
- Experience: ${userContext.experienceLevel}
- Recent workouts: ${userContext.recentWorkouts?.join(', ') || 'None logged'}

Provide personalized workout advice, form tips, and motivation. Be encouraging and specific.`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    return this.chat(messages);
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
}

export { GeminiService };
export type { GeminiMessage, GeminiResponse };