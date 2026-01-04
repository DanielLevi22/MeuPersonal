import { DietMeal, DietPlan } from '@meupersonal/core';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export const NutriBotService = {
  sendMessage: async (
    chatHistory: ChatMessage[],
    userMessage: string,
    currentPlan: DietPlan | null,
    meals: DietMeal[]
  ): Promise<string> => {
    
    // 1. Build System Context
    let dietContext = "O usuário não possui um plano de dieta ativo.";
    
    if (currentPlan && meals.length > 0) {
      const mealSummaries = meals.map(m => 
        `- ${m.name} (${m.meal_time}): ${m.meal_type}`
      ).join('\n');
      
      dietContext = `
        Plano de Dieta do Usuário: "${currentPlan.name}"
        Refeições:
        ${mealSummaries}
        
        Usando o plano acima, responda às perguntas do usuário em Português do Brasil.
        Se pedirem substituições, sugira opções saudáveis que se encaixem no plano.
        Seja amigável, motivador e conciso.
        Evite conselhos médicos.
      `;
    }

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1000));
      return "Estou no Modo Demo. Adicione sua Chave de API para conversar sobre sua dieta!";
    }

    // 2. Call Gemini
    try {
      const historyText = chatHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `
        SISTEMA: ${dietContext}
        
        HISTÓRICO:
        ${historyText}
        
        USUÁRIO: ${userMessage}
        ASSISTENTE:
      `;

      const callGemini = async (model: string) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (response.status === 429) return null;
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      };

      // Try Primary (2.5) then Fallback (2.0)
      let text = await callGemini('gemini-2.5-flash');
      if (!text) {
          console.log("NutriBot primary model failed, trying fallback...");
          text = await callGemini('gemini-2.0-flash');
      }
      
      return text || "Desculpe, não entendi.";

    } catch (error) {
       console.error("NutriBot Error:", error);
       return "Desculpe, estou com dificuldades técnicas no momento.";
    }
  }
};
