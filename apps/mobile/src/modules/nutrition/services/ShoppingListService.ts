import { DietMeal, DietMealItem } from '@meupersonal/core';

export interface ShoppingListItem {
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingCategory {
  category: string;
  items: ShoppingListItem[];
  icon?: string; // Optional for UI mapping if we wanted to pass it from here, but we'll map in UI
}

export interface CookingStep {
  step: number;
  instruction: string;
  timerSeconds?: number;
}

// Simple keyword matcher for categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Hortifruti': ['banana', 'maçã', 'alface', 'tomate', 'batata', 'cenoura', 'fruta', 'legume', 'verdura', 'uva', 'morango', 'abacate', 'limão', 'mamão', 'laranja', 'cebola', 'alho'],
  'Carnes & Proteínas': ['frango', 'carne', 'ovo', 'peixe', 'patinho', 'peito', 'filé', 'boi', 'suíno', 'bife', 'acém', 'músculo', 'tilápia', 'salmão', 'atum'],
  'Laticínios & Frios': ['leite', 'queijo', 'iogurte', 'whey', 'requeijão', 'mussarela', 'prato', 'ricota', 'cotage', 'manteiga'],
  'Mercearia': ['arroz', 'feijão', 'macarrão', 'aveia', 'pão', 'azeite', 'farinha', 'açúcar', 'sal', 'tempero', 'bolacha', 'biscoito', 'café', 'granola', 'mel'],
  'Bebidas': ['água', 'suco', 'refrigerante', 'chá'],
  'Suplementos': ['creatina', 'multivitamínico', 'omega', 'pre-treino', 'beta']
};

export const ShoppingListService = {
  /**
   * Generates a categorized shopping list based on meals and duration.
   */
  generateShoppingList: async (
    meals: DietMeal[],
    mealItemsRecord: Record<string, DietMealItem[]>,
    durationDays: number = 7
  ): Promise<ShoppingCategory[]> => {
    
    // 1. Aggregate Items
    const rawMap = new Map<string, { quantity: number; unit: string }>();

    meals.forEach((meal) => {
      const items = mealItemsRecord[meal.id] || [];
      items.forEach((item) => {
        if (!item.food) return;
        
        const key = item.food.name;
        const current = rawMap.get(key) || { quantity: 0, unit: item.unit };
        
        // Multiplier: Daily Quantity * Duration
        // Note: Assuming 'meals' represents ONE DAY of eating. 
        // If the plan implementation varies (e.g. weekly plan), this logic needs adjustment.
        // For this app context, DietPlan is usually a daily template.
        
        rawMap.set(key, { 
          quantity: current.quantity + (item.quantity * durationDays), 
          unit: item.unit 
        });
      });
    });

    if (rawMap.size === 0) return [];

    // 2. Categorize
    const categorized: Record<string, ShoppingListItem[]> = {};

    rawMap.forEach((data, name) => {
      const category = ShoppingListService.categorizeItem(name);
      
      if (!categorized[category]) {
        categorized[category] = [];
      }

      categorized[category].push({
        name,
        quantity: `${data.quantity.toFixed(1)} ${data.unit}`,
        checked: false
      });
    });

    // 3. Format Output
    return Object.entries(categorized).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.category.localeCompare(b.category));
  },

  categorizeItem: (itemName: string): string => {
    const lowerName = itemName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => lowerName.includes(k))) {
        return category;
      }
    }
    
    return 'Outros';
  },

  generateCookingSteps: async (mealName: string, ingredients: string[]): Promise<CookingStep[]> => {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      console.log('Generating cooking steps for:', mealName, 'with API Key present:', !!apiKey);

      if (!apiKey) {
        console.error('API Key missing in ShoppingListService');
        throw new Error("API Key missing");
      }

      const prompt = `
          Você é um instrutor culinário. Crie um guia passo-a-passo de preparo para uma refeição chamada "${mealName}" usando estes ingredientes: ${ingredients.join(', ')}.
          Retorne APENAS um array JSON onde cada objeto tem:
          - "step": número
          - "instruction": string (max 150 caracteres, claro e direto, em Português do Brasil)
          - "timerSeconds": número (opcional, apenas se um tempo específico for mencionado como "cozinhe por 5 minutos", converta para segundos).
          Exemplo: [{"step": 1, "instruction": "Pique a cebola.", "timerSeconds": null}]
      `;

      try {
          // Try Primary Model (2.5 Flash)
          let responseText = await ShoppingListService.callGeminiAPI(apiKey, 'gemini-2.5-flash', prompt);

          if (!responseText) {
               console.log("Primary model failed or empty, trying fallback model (2.0 Flash)...");
               responseText = await ShoppingListService.callGeminiAPI(apiKey, 'gemini-2.0-flash', prompt);
          }

          if (!responseText) {
             throw new Error("Both models failed to generate content.");
          }
          
          // Clean markdown code blocks if present
          const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(jsonStr);
      } catch (error) {
          console.error("Error generating cooking steps (all attempts failed):", error);
          return [
              { step: 1, instruction: "Não foi possível gerar a receita com a IA no momento.", timerSeconds: 0 },
              { step: 2, instruction: "Por favor, tente novamente em alguns instantes.", timerSeconds: 0 }
          ];
      }
  },

  askAssistant: async (categories: ShoppingCategory[], promptType: 'recipes' | 'analysis' | 'tips' | 'meal_prep' | 'cooking_guide'): Promise<string> => {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return "Erro: Chave de API não configurada.";

      const itemsList = categories.map(cat => 
          `${cat.category}: ${cat.items.map(i => i.name).join(', ')}`
      ).join('\n');

      let systemPrompt = "";
      if (promptType === 'recipes') {
          systemPrompt = "Você é um chef. Sugira 3 receitas simples e saudáveis usando principalmente os ingredientes desta lista de compras. Formate de forma agradável com emojis. Responda em Português do Brasil.";
      } else if (promptType === 'analysis') {
          systemPrompt = "Você é um nutricionista. Analise esta lista de compras. Ela é equilibrada? Faltam nutrientes essenciais (fibras, proteínas, vitaminas)? Seja conciso. Responda em Português do Brasil.";
      } else if (promptType === 'tips') {
          systemPrompt = "Você é um comprador proativo. Dê dicas específicas sobre como escolher a qualidade dos itens frescos (frutas/legumes/carnes) presentes nesta lista. Bullet points curtos. Responda em Português do Brasil.";
      } else if (promptType === 'meal_prep') {
          systemPrompt = "Você é um especialista em meal prep. Crie um guia passo-a-passo para cozinhar/preparar esses ingredientes de forma eficiente para a semana. Agrupe tarefas (ex: 'Picar legumes', 'Cozinhar proteínas'). Seja prático. Responda em Português do Brasil.";
      } else if (promptType === 'cooking_guide') {
          systemPrompt = "Você é um instrutor culinário. Escolha os componentes principais da refeição (proteína + acompanhamento) desta lista e ensine passo-a-passo como cozinhá-los perfeitamente para consumo imediato. Foque na técnica (selar, temperar, tempo). Responda em Português do Brasil.";
      }

      const fullPrompt = `${systemPrompt}\n\nShopping List Context:\n${itemsList}`;

      try {
         // Try Primary Model (2.5 Flash)
         let responseText = await ShoppingListService.callGeminiAPI(apiKey, 'gemini-2.5-flash', fullPrompt);

         if (!responseText) {
             console.log("Primary model failed, trying fallback (2.0 Flash)...");
             responseText = await ShoppingListService.callGeminiAPI(apiKey, 'gemini-2.0-flash', fullPrompt);
         }

         return responseText || "Não consegui gerar uma resposta no momento. Tente novamente.";
      } catch (e) {
          console.error("AI Assistant Error", e);
          return "Ocorreu um erro ao consultar a IA.";
      }
  },

  callGeminiAPI: async (apiKey: string, model: string, prompt: string): Promise<string | null> => {
      try {
        console.log(`Calling Gemini API (${model})...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (response.status === 429) {
            console.warn(`Gemini API (${model}) rate limited (429).`);
            return null; // Return null to trigger fallback
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             console.warn(`Gemini API (${model}) returned no text candidates.`, JSON.stringify(data));
             return null;
        }

        return text;
      } catch (error) {
          console.error(`Error calling Gemini API (${model}):`, error);
          return null;
      }
  }
};
