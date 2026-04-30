import * as FileSystem from 'expo-file-system/legacy';

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

const BFF_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/ai/student/scan-food`;

export const FoodRecognitionService = {
  analyzeFoodImage: async (uri: string, authToken: string): Promise<FoodAnalysisResult> => {
    const imageBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const response = await fetch(BFF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
    });

    if (!response.ok) {
      throw new Error(`scan-food BFF error: ${response.status}`);
    }

    return response.json() as Promise<FoodAnalysisResult>;
  },
};
