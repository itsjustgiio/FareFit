// 🔑 Uses your existing Gemini API key from .env
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

// ✅ Core AI Parser
export async function analyzeMealDescription(description: string) {
  const prompt = `
You are an AI nutrition assistant. Parse the following meal description into structured nutrition data in **strict JSON**.

Each "item" represents one distinct food in the meal.
Estimate macros (calories, protein, carbs, fat, fiber) as realistic averages.

---
🎯 OUTPUT FORMAT (strict JSON only, no extra text):

{
  "name": "Meal Name",
  "items": [
    {
      "id": "string (unique id)",
      "name": "string (food name)",
      "servingSize": "string (e.g. 1 cookie, 1 cup, 100g, 2 slices)",
      "amountConsumed": "number (how many servings - e.g. 3 for '3 cookies')",
      "baseCalories": "number (calories per 1 serving)",
      "baseProtein": "number (protein per 1 serving)",
      "baseCarbs": "number (carbs per 1 serving)",
      "baseFat": "number (fat per 1 serving)",
      "baseFiber": "number (fiber per 1 serving)",
      "calories": "number (total calories = baseCalories × amountConsumed)",
      "protein": "number (total protein = baseProtein × amountConsumed)",
      "carbs": "number (total carbs = baseCarbs × amountConsumed)",
      "fat": "number (total fat = baseFat × amountConsumed)",
      "fiber": "number (total fiber = baseFiber × amountConsumed)",
      "isExpanded": false
    }
  ]
}
---

💡 Examples:
"3 chip ahoy cookies"
→ servingSize: "1 cookie", amountConsumed: 3, baseCalories: 53, calories: 159

"2 cups of rice"
→ servingSize: "1 cup", amountConsumed: 2, baseCalories: 205, calories: 410

"1 banana"
→ servingSize: "1 medium banana", amountConsumed: 1, baseCalories: 105, calories: 105
"Protein shake with almond milk, banana, 1 scoop whey, and peanut butter"
→ name: "Protein Shake"
→ items: almond milk (1 cup, amount: 1), banana (1 medium, amount: 1), whey protein (1 scoop, amount: 1), peanut butter (1 tbsp, amount: 1)

"Grilled chicken with rice and broccoli"
→ name: "Chicken Meal"  
→ items: grilled chicken breast (6oz portion, amount: 1), cooked white rice (1 cup, amount: 1), steamed broccoli (1 cup, amount: 1)

---

User Input: """${description}"""
Now return the structured JSON only.
  `;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    }

    console.log('🍪 Starting meal analysis for:', description);

    const requestUrl = `${GEMINI_BASE_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    };

    console.log('🤖 Making Gemini API request...');

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error:`, {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Gemini API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Raw Gemini response:', data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('❌ No text in response:', data);
      throw new Error("No response from Gemini API");
    }

    console.log('📝 Raw AI text response:', text);

    // � Clean the response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned text for parsing:', cleanedText);

    // �🧩 Try parsing the response as JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed JSON:', parsed);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('Raw text that failed to parse:', text);
      console.error('Cleaned text that failed to parse:', cleanedText);
      throw new Error("AI response was not valid JSON");
    }
    
    if (!validateParsedMeal(parsed)) {
      console.error('❌ Validation failed for:', parsed);
      throw new Error("Invalid or incomplete meal data");
    }

    console.log('🎉 Meal parsing successful!');
    return parsed;
  } catch (err) {
    console.error("🚨 Meal parsing error:", err);
    throw err;
  }
}

// ✅ Basic data validation
function validateParsedMeal(response: any): boolean {
  return (
    response &&
    response.items &&
    Array.isArray(response.items) &&
    response.items.every(
      (item: any) =>
        typeof item.name === "string" &&
        typeof item.baseCalories === "number" &&
        item.baseCalories >= 0
    )
  );
}