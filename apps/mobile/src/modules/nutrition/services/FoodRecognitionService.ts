export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

import * as FileSystem from 'expo-file-system';

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

const SYSTEM_PROMPT = `
You are a nutritional analyst AI. 
Analyze the food in the image. 
Return ONLY valid JSON in this exact format:
{
  "name": "Concise name of the meal",
  "calories": number (estimated total),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "confidence": number (0-1)
}
If unclear, provide best guess with lower confidence.
`;

export const FoodRecognitionService = {
  analyzeFoodImage: async (uri: string): Promise<FoodAnalysisResult> => {
    
    // 1. Check for API Key
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log('Sending image to Gemini...');
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: SYSTEM_PROMPT },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini Error:", data.error);
            throw new Error(data.error.message);
        }

        // Gemini returns candidates[0].content.parts[0].text
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No content returned from Gemini");

        const result = JSON.parse(text);
        
        return {
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            confidence: result.confidence
        };

      } catch (error) {
        console.error('AI Analysis Failed, falling back to mock or error:', error);
        throw error;
      }
    }

    // --- MOCK FALLBACK (If no API Key) ---
    console.log('No API Key found. Using Mock Service.');
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const variants = [
      {
        name: "Prato: Frango Grelhado com Arroz",
        calories: 380,
        protein: 32,
        carbs: 45,
        fat: 8,
        confidence: 0.94
      },
      {
        name: "Salada Caesar com Frango",
        calories: 250,
        protein: 28,
        carbs: 12,
        fat: 10,
        confidence: 0.88
      }
    ];

    return variants[Math.floor(Math.random() * variants.length)];
  }
};
