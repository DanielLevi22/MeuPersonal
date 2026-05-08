import * as ImageManipulator from 'expo-image-manipulator';
import { GeminiService } from '@/modules/ai/services/GeminiService';
import { BodyScanResult } from '../types/assessment';

export const AIBodyScanService = {
  simulateScan: async (): Promise<BodyScanResult> => {
    // Legacy support or fallback
    return {
      id: 'mock-id',
      date: new Date().toISOString(),
      metrics: { height: 175, weight: 75, bodyFat: 15.5, muscleMass: 60.2, bmi: 24.5 },
      segments: { chest: 100, waist: 80, hips: 95, arms: 35, thighs: 55 },
      imageUrl: 'https://via.placeholder.com/150',
    };
  },

  analyzeImages: async (images: {
    front?: string;
    side_right?: string;
    back?: string;
    side_left?: string;
  }): Promise<BodyScanResult> => {
    try {
      const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
        {
          text: `Analyze these 4 body images (Front, Side Right, Back, Side Left) for a fitness assessment. 
             Identify the person's approximate body measurements, body fat percentage, and perform a posture analysis.
             
             Return ONLY a JSON object with this EXACT structure (no markdown):
             {
               "metrics": { "height": number (cm), "weight": number (kg), "bodyFat": number (%), "muscleMass": number (kg), "bmi": number },
               "segments": { "chest": number, "waist": number, "hips": number, "arms": number, "thighs": number, "calves": number, "neck": number, "shoulders": number },
               "postureAnalysis": {
                  "scores": { "symmetry": number (0-100), "muscle": number (0-100), "posture": number (0-100) },
                  "feedback": {
                     "front": [{ "title": string, "risk": "ÓTIMO" | "BOM" | "NORMAL" | "MODERADO" | "ALTO", "text": "brief analysis" }],
                     "back": [{ "title": string, "risk": "ÓTIMO" | "BOM" | "NORMAL" | "MODERADO" | "ALTO", "text": "brief analysis" }],
                     "side_right": [{ "title": string, "risk": "ÓTIMO" | "BOM" | "NORMAL" | "MODERADO" | "ALTO", "text": "brief analysis" }],
                     "side_left": [{ "title": string, "risk": "ÓTIMO" | "BOM" | "NORMAL" | "MODERADO" | "ALTO", "text": "brief analysis" }]
                  },
                  "recommendations": "string (training advice)"
               }
             }`,
        },
      ];

      // Helper to add image if exists
      const addImage = async (uri: string | undefined, label: string) => {
        if (!uri) return;
        try {
          // Resize and compress to reduce payload size (Gemini limit)
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          if (manipResult.base64) {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: manipResult.base64,
              },
            });
            parts.push({ text: `[Image: ${label}]` });
          }
        } catch (e) {
          console.warn(`Failed to process image ${label}`, e);
        }
      };

      await addImage(images.front, 'Front View');
      await addImage(images.side_right, 'Side View (Right)');
      await addImage(images.back, 'Back View');
      await addImage(images.side_left, 'Side View (Left)');

      const response = await GeminiService.generateContent<BodyScanResult>(parts, {
        responseMimeType: 'application/json',
        temperature: 0.4,
        // model: 'gemini-1.5-flash' // Rely on service default (2.5-flash -> 2.0-flash) which is known to work in Nutrition
      });

      const result = response.data;

      if (!result?.metrics) {
        throw new Error('Failed to generate valid analysis from AI');
      }

      return {
        ...result,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUrl: images.front || '',
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw error;
    }
  },
};
