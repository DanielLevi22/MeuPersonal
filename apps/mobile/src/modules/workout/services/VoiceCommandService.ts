export type VoiceAction = 'next_set' | 'finish_workout' | 'pause_timer' | 'resume_timer' | 'repeat_instruction' | 'unknown';

export const VoiceCommandService = {
  analyzeCommand: async (base64Audio: string): Promise<VoiceAction> => {
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
      const callGemini = async (model: string) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { inline_data: { mime_type: "audio/mp4", data: base64Audio } }
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
          console.log("Voice command primary model failed, trying fallback...");
          text = await callGemini('gemini-2.0-flash');
      }

      if (!text) return 'unknown';

      const result = JSON.parse(text);
      return result.action || 'unknown';

    } catch (e) {
      console.error("Voice Command Error", e);
      return 'unknown';
    }
  }
};
