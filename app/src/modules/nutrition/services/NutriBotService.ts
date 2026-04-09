import type { DietMeal, DietMealItem, DietPlan } from '@meupersonal/core';
import { GeminiService } from '@/modules/ai/services/GeminiService';

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
    meals: DietMeal[],
    mealItems: Record<string, DietMealItem[]>
  ): Promise<string> => {
    // 1. Build System Context
    let dietContext = 'O usuário não possui um plano de dieta ativo.';

    if (currentPlan && meals.length > 0) {
      const mealSummaries = meals
        .map((m) => {
          const items = mealItems[m.id] || [];
          const itemsStr = items
            .map((i) => {
              const foodName = i.food?.name || 'Alimento desconhecido';
              return `   - ${i.quantity} ${i.unit} de ${foodName}`;
            })
            .join('\n');

          return `- ${m.name} (${m.meal_time}): ${m.meal_type}\n${itemsStr}`;
        })
        .join('\n\n');

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

    // 2. Call Gemini via Centralized Service
    try {
      const historyText = chatHistory
        .slice(-5)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
      const prompt = `
        SISTEMA: ${dietContext}
        
        HISTÓRICO:
        ${historyText}
        
        USUÁRIO: ${userMessage}
        ASSISTENTE:
      `;

      // GeminiService handles API keys, model fallback (2.5 -> 2.0), and error parsing internally.
      // We pass the prompt and expect a text string response.
      const result = await GeminiService.generateContent<string>(prompt);

      return (result.data as string) || 'Desculpe, não entendi.';
    } catch (error) {
      console.error('NutriBot Error:', error);
      return 'Desculpe, estou com dificuldades técnicas no momento.';
    }
  },
};
