import { supabase } from '@meupersonal/supabase';
import * as Notifications from 'expo-notifications';
import { achievementService } from './achievementService';
import { streakService } from './streakService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const gamificationNotificationService = {
  /**
   * Solicita permissões de notificação
   */
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  },

  /**
   * Notifica quando meta diária é completada
   */
  async notifyDailyGoalComplete(mealsCompleted: number, mealsTarget: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Meta do Dia Alcançada!',
        body: `Parabéns! Você completou ${mealsCompleted}/${mealsTarget} refeições hoje!`,
        data: { type: 'daily_goal_complete' },
      },
      trigger: null, // Imediato
    });
  },

  /**
   * Notifica quando está próximo de completar a meta
   */
  async notifyAlmostComplete(remaining: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Falta Pouco!',
        body: `Você está a ${remaining} ${remaining === 1 ? 'refeição' : 'refeições'} de bater a meta de hoje!`,
        data: { type: 'almost_complete' },
      },
      trigger: null,
    });
  },

  /**
   * Agenda lembrete diário de streak
   */
  async scheduleStreakReminder() {
    // Cancelar lembretes anteriores de streak
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const streakReminders = scheduled.filter((n: any) => n.content.data?.type === 'streak_reminder');
    for (const reminder of streakReminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }

    // Agendar para 20h todos os dias
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Mantenha sua Sequência!',
        body: 'Não esqueça de completar suas metas hoje para manter seu streak!',
        data: { type: 'streak_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  },

  /**
   * Notifica resumo semanal
   */
  async notifyWeeklySummary(percentage: number, mealsCompleted: number, workoutsCompleted: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Seu Resumo da Semana',
        body: `${percentage}% das metas alcançadas! ${mealsCompleted} refeições e ${workoutsCompleted} treinos completados.`,
        data: { type: 'weekly_summary' },
      },
      trigger: null,
    });
  },

  /**
   * Agenda resumo semanal para domingo à noite
   */
  async scheduleWeeklySummary() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Agendar para domingo às 21h
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Resumo da Semana',
        body: 'Veja como foi sua semana!',
        data: { type: 'weekly_summary_scheduled', userId: user.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 1, // Domingo
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
  },

  /**
   * Verifica e envia notificações de gamificação
   * Deve ser chamado quando o progresso é atualizado
   */
  async checkAndNotify(studentId: string, dailyGoal: any) {
    if (!dailyGoal) return;

    const totalTarget = dailyGoal.meals_target + dailyGoal.workout_target;
    const totalCompleted = dailyGoal.meals_completed + dailyGoal.workout_completed;
    const remaining = totalTarget - totalCompleted;

    // Notificar se completou a meta
    if (dailyGoal.completed && dailyGoal.completion_percentage === 100) {
      await this.notifyDailyGoalComplete(dailyGoal.meals_completed, dailyGoal.meals_target);
      
      // Atualizar streak
      const today = new Date().toISOString().split('T')[0];
      await streakService.updateStreak(studentId, today);
      
      // Verificar conquistas
      await achievementService.checkAchievements(studentId);
    }
    // Notificar se está próximo (falta 1)
    else if (remaining === 1) {
      await this.notifyAlmostComplete(remaining);
    }
  },

  /**
   * Inicializa notificações de gamificação
   */
  async initialize() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Disabled to reduce spam as per user request
    // await this.scheduleStreakReminder();
    // await this.scheduleWeeklySummary();
  },
};
