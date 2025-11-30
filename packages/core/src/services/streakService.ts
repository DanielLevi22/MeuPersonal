import { supabase } from '@meupersonal/supabase';
import { achievementService } from './achievementService';

export const streakService = {
  /**
   * Atualiza a sequência (streak) do aluno
   * Deve ser chamado quando uma meta diária é completada
   */
  async updateStreak(studentId: string, date: string) {
    try {
      // 1. Buscar streak atual
      const { data: currentStreak, error: fetchError } = await supabase
        .from('student_streaks')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const today = new Date(date);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = 1;
      let longestStreak = 1;

      if (currentStreak) {
        const lastActivityDate = currentStreak.last_activity_date 
          ? new Date(currentStreak.last_activity_date) 
          : null;

        if (lastActivityDate) {
          const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 0) {
            // Mesmo dia, não atualizar
            return currentStreak;
          } else if (daysDiff === 1) {
            // Dia consecutivo, incrementar streak
            newStreak = currentStreak.current_streak + 1;
          } else {
            // Quebrou a sequência, resetar
            newStreak = 1;
          }
        }

        longestStreak = Math.max(currentStreak.longest_streak, newStreak);

        // 2. Atualizar streak
        const { error: updateError } = await supabase
          .from('student_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: date,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);

        if (updateError) throw updateError;
      } else {
        // 3. Criar novo streak
        const { error: insertError } = await supabase
          .from('student_streaks')
          .insert({
            student_id: studentId,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: date,
          });

        if (insertError) throw insertError;
      }

      // 4. Verificar conquistas de streak
      await achievementService.checkAchievements(studentId);

      return { current_streak: newStreak, longest_streak: longestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  /**
   * Verifica se o aluno quebrou a sequência
   * Deve ser executado diariamente (pode ser um cron job ou verificação ao abrir o app)
   */
  async checkStreakBreak(studentId: string) {
    try {
      const { data: streak, error } = await supabase
        .from('student_streaks')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!streak || !streak.last_activity_date) return;

      const today = new Date();
      const lastActivity = new Date(streak.last_activity_date);
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      // Se passou mais de 1 dia sem atividade, resetar streak
      if (daysDiff > 1 && streak.current_streak > 0) {
        await supabase
          .from('student_streaks')
          .update({
            current_streak: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);

        console.log(`Streak broken for student ${studentId}`);
      }
    } catch (error) {
      console.error('Error checking streak break:', error);
    }
  },

  /**
   * Obtém informações de streak do aluno
   */
  async getStreakInfo(studentId: string) {
    const { data, error } = await supabase
      .from('student_streaks')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
    };
  },

  /**
   * Verifica se o aluno está em risco de perder o streak
   * Retorna true se ainda não completou a meta de hoje
   */
  async isStreakAtRisk(studentId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: todayGoal, error } = await supabase
      .from('daily_goals')
      .select('completed')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Em risco se não completou a meta de hoje
    return !todayGoal?.completed;
  },
};
