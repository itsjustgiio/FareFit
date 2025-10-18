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
   * ✉️ Standard single-response call
   */
  async chat(messages: GeminiMessage[], model: string = 'gemini-2.5-flash'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`, {
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
          tools: [{ name: 'google_search' }], // allows macro lookups
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
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
        tools: [{ name: 'google_search' }],
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
}

// 🔁 Singleton pattern to prevent multiple instances
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    console.log('🔑 Checking Gemini API key...');
    console.log('Environment variables available:', Object.keys(import.meta.env));
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
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
