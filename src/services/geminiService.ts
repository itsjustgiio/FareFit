/**
 * Gemini API Service
 * Handles all AI interactions with Google Gemini
 */

interface GeminiTextPart {
  text: string;
}

interface GeminiImagePart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: (GeminiTextPart | GeminiImagePart)[];
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
      // Use v1beta for experimental models, v1 for stable models
      const apiVersion = model.includes('-exp') ? 'v1beta' : 'v1';
      const requestUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${this.apiKey}`;
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
        apiVersion,
        messageCount: messages.length,
        firstMessagePreview: 'text' in (messages[0]?.parts[0] || {}) ?
          (messages[0].parts[0] as GeminiTextPart).text.substring(0, 200) + '...' :
          '[Image + Text]'
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
    try {
      // Use v1beta for experimental models, v1 for stable models
      const apiVersion = model.includes('-exp') ? 'v1beta' : 'v1';
      const requestUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:streamGenerateContent?key=${this.apiKey}`;

      console.log('🌊 Gemini Streaming Request:', {
        url: requestUrl.replace(this.apiKey, '***API_KEY***'),
        model,
        apiVersion,
        messageCount: messages.length
      });

      const res = await fetch(requestUrl, {
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

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Streaming API error:', {
          status: res.status,
          statusText: res.statusText,
          errorBody: errorText
        });
        throw new Error(`Streaming API error (${res.status}): ${errorText}`);
      }

      if (!res.body) {
        console.error('❌ No response body from streaming API');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      console.log('✅ Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        console.log('📦 Raw buffer chunk:', buffer.substring(0, 200));

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          console.log('📄 Processing line:', line.substring(0, 100));

          // Try parsing without 'data: ' prefix first (Gemini might not use SSE format)
          if (!line.trim()) continue;

          try {
            // Try parsing as direct JSON first
            const json = JSON.parse(line);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log('📝 Stream chunk (direct JSON):', text.substring(0, 50));
              yield text;
            }
          } catch (e1) {
            // If that fails, try with 'data: ' prefix
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  console.log('📝 Stream chunk (SSE format):', text.substring(0, 50));
                  yield text;
                }
              } catch (e2) {
                console.warn('⚠️ Stream parse error:', { line: line.substring(0, 100), error: e2 });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in streamChat:', error);
      throw error;
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
   * 💪 Enhanced Coach AI - With full workout history and analysis
   */
  async getEnhancedCoachAdvice(
    userMessage: string,
    userContext: {
      goalType: 'cut' | 'bulk' | 'maintain';
      age: number;
      weight: number;
      workoutContext: string; // Pre-formatted workout history and analysis
    }
  ): Promise<string> {
    const systemPrompt = `You are Coach AI, an expert personal trainer and strength coach in the FareFit app.

**Your Role:**
- Analyze workout performance and provide data-driven feedback
- Detect plateaus and suggest progressive overload strategies
- Recommend exercise variations and programming adjustments
- Motivate and encourage consistent training
- Provide form cues and injury prevention tips

**User's Profile:**
- Goal: ${userContext.goalType}
- Age: ${userContext.age}
- Weight: ${userContext.weight}lbs

**Complete Workout History & Analysis:**
${userContext.workoutContext}

**Instructions:**
1. Reference specific exercises, weights, and reps from their history
2. If they mention an exercise they've done before, compare to their previous performance
3. For plateaus, suggest specific weight/rep adjustments or exercise variations
4. If someone did high reps (15+) with heavy weight, suggest going heavier with lower reps
5. If someone hasn't trained in a while, acknowledge it and provide comeback strategy
6. Always be specific with numbers (e.g., "Try 155lbs for 8 reps instead of 145lbs for 20 reps")
7. Keep responses conversational, motivational, and actionable
8. Use emojis sparingly for emphasis

**Examples:**
- "I see you benched 145lbs for 20 reps - that's solid endurance! But you're ready for more weight. Try 165lbs for 8-10 reps to build pure strength."
- "Your squat has been stuck at 185lbs for 3 workouts. Let's break through! Try 190lbs for 5 reps, or do a deload week at 155lbs for 12 reps."
- "Great leg day! Your volume is up 25% from last week. Keep this intensity but watch for overtraining signals."`;

    const messages: GeminiMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return this.chat(messages, 'gemini-2.0-flash-exp');
  }

  /**
   * 📸 Nutrition Label OCR - Extract nutrition data from image
   * @param imageBase64 - Base64 encoded image (with data:image/jpeg;base64, prefix)
   * @returns Structured nutrition data
   */
  async extractNutritionFromImage(imageBase64: string): Promise<{
    productName: string;
    brandName: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }> {
    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `Analyze this nutrition facts label image and extract the following information:

1. Product name (if visible on the label)
2. Brand name (if visible)
3. Serving size (e.g., "1 cup (240ml)", "2 cookies (28g)")
4. Calories per serving
5. Protein in grams
6. Total Carbohydrates in grams
7. Total Fat in grams
8. Dietary Fiber in grams

IMPORTANT:
- Return ONLY a valid JSON object, no markdown formatting, no explanation
- Use exact field names: productName, brandName, servingSize, calories, protein, carbs, fat, fiber
- If a value is not visible or unclear, use 0 for numbers and empty string for text
- For servingSize, include the unit (e.g., "1 cup (240ml)")

Example response format:
{"productName":"Protein Bar","brandName":"Quest","servingSize":"1 bar (60g)","calories":200,"protein":20,"carbs":22,"fat":8,"fiber":14}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2, // Lower temperature for more consistent JSON
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error response:', errorText);
        throw new Error(`Gemini Vision API error (${response.status}): ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('🔍 Gemini Vision raw response:', textResponse);

      // Extract JSON from response (remove markdown code blocks if present)
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const nutritionData = JSON.parse(jsonMatch[0]);

      console.log('✅ Parsed nutrition data:', nutritionData);

      return {
        productName: nutritionData.productName || '',
        brandName: nutritionData.brandName || '',
        servingSize: nutritionData.servingSize || '1 serving',
        calories: Number(nutritionData.calories) || 0,
        protein: Number(nutritionData.protein) || 0,
        carbs: Number(nutritionData.carbs) || 0,
        fat: Number(nutritionData.fat) || 0,
        fiber: Number(nutritionData.fiber) || 0,
      };
    } catch (error) {
      console.error('Error extracting nutrition from image:', error);
      throw error;
    }
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
