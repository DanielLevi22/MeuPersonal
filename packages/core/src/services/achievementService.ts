import { supabase } from '@meupersonal/supabase';
import * as Notifications from 'expo-notifications';

export interface AchievementDefinition {
  id: string;
  type: 'streak' | 'milestone' | 'challenge';
  title: string;
  description: string;
  icon: string;
  points: number;
  condition: (data: any) => boolean;
}

// Definições de conquistas
const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'streak_3',
    type: 'streak',
    title: '3 Dias Seguidos! 🔥',
    description: 'Manteve sua sequência por 3 dias',
    icon: '🔥',
    points: 50,
    condition: (data) => data.streak >= 3,
  },
  {
    id: 'streak_7',
    type: 'streak',
    title: '7 Dias Seguidos! 🔥🔥',
    description: 'Uma semana inteira de dedicação!',
    icon: '🔥',
    points: 100,
    condition: (data) => data.streak >= 7,
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: '30 Dias Seguidos! 🔥🔥🔥',
    description: 'Um mês de consistência incrível!',
    icon: '🔥',
    points: 300,
    condition: (data) => data.streak >= 30,
  },
  {
    id: 'first_week_complete',
    type: 'milestone',
    title: 'Primeira Semana Completa! 🥇',
    description: '100% das metas alcançadas na semana',
    icon: '🥇',
    points: 150,
    condition: (data) => data.weeklyCompletion === 100 && data.weeksCompleted === 1,
  },
  {
    id: 'perfect_week',
    type: 'challenge',
    title: 'Semana Perfeita! 💯',
    description: '100% de dieta e treino por 7 dias',
    icon: '💯',
    points: 200,
    condition: (data) => data.weeklyCompletion === 100,
  },
  {
    id: 'workout_warrior',
    type: 'challenge',
    title: 'Guerreiro do Treino! 💪',
    description: '20 treinos completados',
    icon: '💪',
    points: 250,
    condition: (data) => data.totalWorkouts >= 20,
  },
  {
    id: 'nutrition_master',
    type: 'challenge',
    title: 'Mestre da Nutrição! 🥗',
    description: '100 refeições registradas',
    icon: '🥗',
    points: 250,
    condition: (data) => data.totalMeals >= 100,
  },
];

export const achievementService = {
  /**
   * Verifica e desbloqueia novas conquistas para um aluno
   */
  async checkAchievements(studentId: string) {
    try {
      // 1. Buscar dados necessários
      const [streakData, weeklyData, totalsData, existingAchievements] = await Promise.all([
        this.getStreakData(studentId),
        this.getWeeklyData(studentId),
        this.getTotalsData(studentId),
        this.getEarnedAchievements(studentId),
      ]);

      const data = {
        streak: streakData?.current_streak || 0,
        weeklyCompletion: weeklyData?.completion_percentage || 0,
        weeksCompleted: weeklyData?.weeks_completed || 0,
        totalWorkouts: totalsData?.total_workouts || 0,
        totalMeals: totalsData?.total_meals || 0,
      };

      // 2. Verificar cada conquista
      const newAchievements: AchievementDefinition[] = [];
      
      for (const achievement of ACHIEVEMENTS) {
        // Pular se já foi desbloqueada
        if (existingAchievements.some(a => a.title === achievement.title)) {
          continue;
        }

        // Verificar condição
        if (achievement.condition(data)) {
          newAchievements.push(achievement);
        }
      }

      // 3. Desbloquear novas conquistas
      for (const achievement of newAchievements) {
        await this.unlockAchievement(studentId, achievement);
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  /**
   * Desbloqueia uma conquista e envia notificação
   */
  async unlockAchievement(studentId: string, achievement: AchievementDefinition) {
    try {
      // 1. Inserir conquista no banco
      const { error } = await supabase.from('achievements').insert({
        student_id: studentId,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
      });

      if (error) throw error;

      // 2. Enviar notificação
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Nova Conquista Desbloqueada!',
          body: achievement.title,
          data: { 
            type: 'achievement',
            achievementId: achievement.id,
          },
        },
        trigger: null, // Imediato
      });

      console.log(`Achievement unlocked: ${achievement.title}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  },

  /**
   * Busca conquistas já desbloqueadas
   */
  async getEarnedAchievements(studentId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('student_id', studentId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Busca dados de streak
   */
  async getStreakData(studentId: string) {
    const { data, error } = await supabase
      .from('student_streaks')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Busca dados semanais
   */
  async getWeeklyData(studentId: string) {
    // Calcular início e fim da semana atual
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startOfWeek.toISOString().split('T')[0])
      .lte('date', endOfWeek.toISOString().split('T')[0]);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { completion_percentage: 0, weeks_completed: 0 };
    }

    // Calcular percentual de conclusão da semana
    const totalTarget = data.reduce((sum, goal) => sum + goal.meals_target + goal.workout_target, 0);
    const totalCompleted = data.reduce((sum, goal) => sum + goal.meals_completed + goal.workout_completed, 0);
    const completion_percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    // Contar semanas 100% completas
    const { count } = await supabase
      .from('daily_goals')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('completion_percentage', 100);

    const weeks_completed = Math.floor((count || 0) / 7);

    return { completion_percentage, weeks_completed };
  },

  /**
   * Busca totais gerais
   */
  async getTotalsData(studentId: string) {
    const [workoutsResult, mealsResult] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'completed'),
      supabase
        .from('diet_logs')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('completed', true),
    ]);

    return {
      total_workouts: workoutsResult.count || 0,
      total_meals: mealsResult.count || 0,
    };
  },
};
