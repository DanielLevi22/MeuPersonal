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
      if (!apiKey) throw new Error("API Key missing");

      const prompt = `
          You are a culinary instructor. Create a step-by-step cooking guide for a meal named "${mealName}" using these ingredients: ${ingredients.join(', ')}.
          Return ONLY a JSON array where each object has:
          - "step": number
          - "instruction": string (max 150 chars, clear and direct)
          - "timerSeconds": number (optional, only if a specific time is mentioned like "cook for 5 mins", convert to seconds).
          Example: [{"step": 1, "instruction": "Chop the onions.", "timerSeconds": null}]
      `;

      try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }]
              })
          });

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!text) return [];
          
          // Clean markdown code blocks if present
          const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(jsonStr);
      } catch (error) {
          console.error("Error generating cooking steps:", error);
          return [
              { step: 1, instruction: "Prepare os ingredientes.", timerSeconds: 0 },
              { step: 2, instruction: "Cozinhe conforme sua preferência.", timerSeconds: 0 }
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
          systemPrompt = "You are a chef. Suggest 3 simple, healthy recipes using mainly the ingredients from this shopping list. Format nicely with emojis.";
      } else if (promptType === 'analysis') {
          systemPrompt = "You are a nutritionist. Analyze this shopping list. Is it balanced? Are there missing essential nutrients (fiber, protein, vitamins)? Be concise.";
      } else if (promptType === 'tips') {
          systemPrompt = "You are a proactive shopper. specific tips on how to choose the quality of fresh items (fruits/vegetables/meat) present in this list. Short bullet points.";
      } else if (promptType === 'meal_prep') {
          systemPrompt = "You are a meal prep expert. Create a step-by-step guide to cook/prepare these ingredients efficiently for the week. Group tasks (e.g., 'Chop vegetables', 'Cook protein'). Be practical.";
      } else if (promptType === 'cooking_guide') {
          systemPrompt = "You are a culinary instructor. Choose the main meal components (protein + specific side) from this list and teach step-by-step how to cook them perfectly for immediate consumption. Focus on technique (searing, seasoning, timing).";
      }

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{
                  parts: [
                      { text: systemPrompt },
                      { text: `Shopping List Context:\n${itemsList}` }
                  ]
              }]
          })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui gerar uma resposta no momento.";
      } catch (e) {
          console.error("AI Assistant Error", e);
          return "Ocorreu um erro ao consultar a IA.";
      }
  }
};
