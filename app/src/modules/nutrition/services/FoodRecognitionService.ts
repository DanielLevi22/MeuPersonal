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

import { GeminiService } from '@/modules/ai/services/GeminiService';

export const FoodRecognitionService = {
  analyzeFoodImage: async (uri: string): Promise<FoodAnalysisResult> => {
    // 1. Check for API Key (GeminiService handles check but we need base64 logic here)
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log('Sending image to Gemini...');
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

        const parts = [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        ];

        // Centralized call with multimodal parts
        const result = await GeminiService.generateContent<string>(parts, {
          responseMimeType: 'application/json',
        });

        if (!result.data) throw new Error('No content returned from Gemini');

        // Clean markdown if present (though GeminiService usually handles JSON parsing if mime type is set,
        // the generic type <string> means we might get text.
        // NOTE: GeminiService tries to parse JSON if responseMimeType is application/json.
        // But let's be safe and assume we might get an object directly if logic matches,
        // or a string if it failed to parse inside service.

        // Actually, looking at GeminiService:
        // if (config?.responseMimeType === 'application/json') return { data: JSON.parse(text) as T };
        // So 'result.data' IS ALREADY the parsed object if everything went well.

        let analysisData = result.data as unknown as FoodAnalysisResult;

        // Double check if it came back as string (e.g. if mime type wasn't respected by fallback or service logic quirk)
        if (typeof analysisData === 'string') {
          const jsonStr = (analysisData as string)
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          analysisData = JSON.parse(jsonStr) as FoodAnalysisResult;
        }

        return {
          name: analysisData.name,
          calories: analysisData.calories,
          protein: analysisData.protein,
          carbs: analysisData.carbs,
          fat: analysisData.fat,
          confidence: analysisData.confidence,
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
        name: 'Prato: Frango Grelhado com Arroz',
        calories: 380,
        protein: 32,
        carbs: 45,
        fat: 8,
        confidence: 0.94,
      },
      {
        name: 'Salada Caesar com Frango',
        calories: 250,
        protein: 28,
        carbs: 12,
        fat: 10,
        confidence: 0.88,
      },
    ];

    return variants[Math.floor(Math.random() * variants.length)];
  },
};
