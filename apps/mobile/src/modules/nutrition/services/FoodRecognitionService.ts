export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

import * as FileSystem from 'expo-file-system/legacy';

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

const SYSTEM_PROMPT = `
Você é uma IA analista nutricional. 
Analise a comida na imagem. 
Retorne APENAS JSON válido neste formato exato::
{
  "name": "Nome conciso da refeição em Português",
  "calories": número (total estimado),
  "protein": número (gramas),
  "carbs": número (gramas),
  "fat": número (gramas),
  "confidence": número (0-1)
}
Se não for claro, dê seu melhor palpite com confiança menor.
`;

export const FoodRecognitionService = {
  analyzeFoodImage: async (uri: string): Promise<FoodAnalysisResult> => {
    
    // 1. Check for API Key
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log('Sending image to Gemini...');
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

        const callGemini = async (model: string) => {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { inline_data: { mime_type: "image/jpeg", data: base64 } }
                        ]
                    }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });
            if (response.status === 429) return null;
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text;
        };

        // Try Primary (2.5) then Fallback (2.0)
        let text = await callGemini('gemini-2.5-flash');
        if (!text) {
             console.log("Food recognition primary model failed, trying fallback...");
             text = await callGemini('gemini-2.0-flash');
        }

        if (!text) throw new Error("No content returned from Gemini");

        // Clean markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);
        
        return {
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            confidence: result.confidence
        };

      } catch (error) {
        console.error('AI Analysis Failed, falling back to mock:', error);
        // Do not throw, let it fall through to mock
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
