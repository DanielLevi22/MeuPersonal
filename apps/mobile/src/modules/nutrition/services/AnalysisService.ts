import { DietPlan } from '@meupersonal/core';
import { supabase } from '@meupersonal/supabase';

export interface WeeklyAdherenceData {
  totalMeals: number;
  completedMeals: number;
  missedProtein: number; // Days with low protein
  missedCalories: number; // Days with high deviation
  logs: any[];
}

export const AnalysisService = {
  /**
   * Fetches logs for the last 7 days and calculates basic adherence stats.
   */
  getWeeklyStats: async (studentId: string, plan: DietPlan): Promise<WeeklyAdherenceData> => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const { data: logs, error } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('logged_date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('logged_date', today.toISOString().split('T')[0]);

    if (error) throw error;

    // Basic calculation (can be improved with real macro tracking from logs if available)
    // For now, relies on 'completed' boolean.
    const totalMeals = 7 * 4; // Assuming avg 4 meals/day context or we could count expected meals
    const completedMeals = logs?.filter(l => l.completed).length || 0;

    return {
      totalMeals,
      completedMeals,
      missedProtein: 0, // Placeholder for deep analysis
      missedCalories: 0, // Placeholder
      logs: logs || []
    };
  },

  /**
   * Generates a text summary using Gemini 2.0
   */
  generateSummary: async (studentName: string, adherence: WeeklyAdherenceData, planName: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return "Erro: Chave de API não configurada.";

    // Construct context
    const context = `
      Student: ${studentName}
      Plan: ${planName}
      Last 7 Days Logs: ${adherence.logs.length} entries found.
      Completed Meals: ${adherence.completedMeals} (Approx adherence based on logs).
      
      Raw Logs (Sample): ${JSON.stringify(adherence.logs.slice(0, 10))}
    `;

    const prompt = `
      You are a senior sports nutritionist assistant. 
      Analyze the weekly adherence of this student based on the provided logs.
      
      CONTEXT:
      ${context}

      TASK:
      Write a concise (max 3 bullet points) weekly summary for the nutritionist.
      Focus on patterns (e.g., "Consistent on weekdays but missed weekend meals").
      If data is scarce, mention that the student needs to log more often.
      Tone: Professional, direct, and helpful. Language: Portuguese (Brazil).
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        // Handle Quota or other API errors gracefully
        console.error("Gemini API Error:", data.error);
        if (data.error.code === 429) {
           return "⚠️ Limite de uso da IA excedido. Tente novamente mais tarde.";
        }
        return "Não foi possível gerar a análise no momento.";
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "Sem dados suficientes para análise.";

    } catch (error) {
      console.error("Analysis Service Error:", error);
      return "Erro de conexão ao gerar análise.";
    }
  }
};
