export type VoiceAction =
  | 'next_set'
  | 'finish_workout'
  | 'pause_timer'
  | 'resume_timer'
  | 'repeat_instruction'
  | 'unknown';

import { GeminiService } from '@/modules/ai/services/GeminiService';

export const VoiceCommandService = {
  analyzeCommand: async (base64Audio: string): Promise<VoiceAction> => {
    // Check key only to fail fast if needed, but GeminiService handles it too.
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return 'unknown';

    const SYSTEM_PROMPT = `
    Você está ouvindo um usuário treinando. Ele dará um comando curto.
    Mapeie a fala dele para uma das seguintes ações JSON:
    - "Terminei", "Próxima", "Feito", "Já", "Concluído", "Próxima série", "Next", "Check" -> "next_set"
    - "Acabei o treino", "Finalizar", "Encerrar", "Chega" -> "finish_workout"
    - "Pausar", "Espera", "Pause" -> "pause_timer"
    - "Retomar", "Voltar", "Resume", "Continua" -> "resume_timer"
    
    Retorne APENAS um JSON válido: { "action": "..." }.
    Se não for claro, retorne { "action": "unknown" }.
    `;

    try {
      const parts = [
        { text: SYSTEM_PROMPT },
        { inline_data: { mime_type: 'audio/mp4', data: base64Audio } },
      ];

      // Centralized call
      const result = await GeminiService.generateContent<{ action?: string }>(parts, {
        responseMimeType: 'application/json',
      });

      if (!result.data) return 'unknown';

      // Parse logic
      let data = result.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      return (data.action as VoiceAction) || 'unknown';
    } catch (e) {
      console.error('Voice Command Error', e);
      return 'unknown';
    }
  },
};
