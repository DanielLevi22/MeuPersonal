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
    let dietContext = "The user has no active diet plan.";
    
    if (currentPlan && meals.length > 0) {
      const mealSummaries = meals.map(m => 
        `- ${m.name} (${m.meal_time}): ${m.meal_type}`
      ).join('\n');
      
      dietContext = `
        User's Diet Plan: "${currentPlan.name}"
        Meals:
        ${mealSummaries}
        
        Using the above plan, answer the user's questions. 
        If they ask for substitutions, suggest healthy options fitting the plan.
        Be friendly, motivating, and concise.
        Avoid medical advice.
      `;
    }

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1000));
      return "I'm in Demo Mode. Add your API Key to chat specifically about your diet!";
    }

    // 2. Call Gemini
    try {
      const historyText = chatHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `
        SYSTEM: ${dietContext}
        
        HISTORY:
        ${historyText}
        
        USER: ${userMessage}
        ASSISTANT:
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return text || "Desculpe, não entendi.";

    } catch (error) {
    }
  }
};
