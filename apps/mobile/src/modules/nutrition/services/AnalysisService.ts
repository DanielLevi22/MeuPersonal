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
      Aluno: ${studentName}
      Plano: ${planName}
      Logs dos últimos 7 dias: ${adherence.logs.length} entradas.
      Refeições Completas: ${adherence.completedMeals} (Aderência aproximada baseada nos logs).
      
      Logs Brutos (Amostra): ${JSON.stringify(adherence.logs.slice(0, 10))}
    `;

    const prompt = `
      Você é um assistente nutricionista esportivo sênior. 
      Analise a aderência semanal deste aluno com base nos logs fornecidos.
      
      CONTEXTO:
      ${context}

      TAREFA:
      Escreva um resumo semanal conciso (máx. 3 pontos) para o nutricionista.
      Foque em padrões (ex: "Consistente dias de semana mas errou no fds").
      Se houver poucos dados, mencione que o aluno precisa registrar mais.
      Tom: Profissional, direto e útil. Idioma: Português (Brasil).
    `;

    try {
      const callGemini = async (model: string) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (response.status === 429) return null; // Trigger fallback
        
        const data = await response.json();
        if (data.error) {
           console.error(`Gemini Error (${model}):`, data.error);
           return null;
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      };

      // Try Primary (2.5) then Fallback (2.0)
      let text = await callGemini('gemini-2.5-flash');
      if (!text) {
          console.log("Analysis primary model failed, trying fallback...");
          text = await callGemini('gemini-2.0-flash');
      }

      return text || "Sem dados suficientes para análise.";

    } catch (error) {
      console.error("Analysis Service Error:", error);
      return "Erro de conexão ao gerar análise.";
    }
  }
};
