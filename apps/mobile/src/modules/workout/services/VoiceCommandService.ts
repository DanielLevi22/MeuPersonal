export type VoiceAction = 'next_set' | 'finish_workout' | 'pause_timer' | 'resume_timer' | 'repeat_instruction' | 'unknown';

export const VoiceCommandService = {
  analyzeCommand: async (base64Audio: string): Promise<VoiceAction> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return 'unknown';

    const SYSTEM_PROMPT = `
    You are listening to a user working out. They will give a short command.
    Map their speech to one of the following JSON actions:
    - "Terminei", "Próxima", "Feito", "Já", "Concluído", "Próxima série", "Next", "Check" -> "next_set"
    - "Acabei o treino", "Finalizar", "Encerrar", "Chega" -> "finish_workout"
    - "Pausar", "Espera", "Pause" -> "pause_timer"
    - "Retomar", "Voltar", "Resume", "Continua" -> "resume_timer"
    
    Return ONLY valid JSON: { "action": "..." }.
    If unclear, return { "action": "unknown" }.
    `;

    try {
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
                            mime_type: "audio/mp4", 
                            data: base64Audio
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
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return 'unknown';

      const result = JSON.parse(text);
      return result.action || 'unknown';

    } catch (e) {
      console.error("Voice Command Error", e);
      return 'unknown';
    }
  }
};
