import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get notification permissions');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meal-reminders', {
      name: 'Meal Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF88',
    });
  }

  return true;
}

interface MealNotification {
  mealId: string;
  mealName: string;
  mealTime: string; // Format: "HH:MM"
  dayOfWeek: number; // 0-6
}

export async function scheduleMealNotifications(
  planId: string,
  meals: MealNotification[]
): Promise<void> {
  try {
    // Cancel existing notifications for this plan
    await cancelPlanNotifications(planId);

    for (const meal of meals) {
      if (!meal.mealTime) continue;

      const [hours, minutes] = meal.mealTime.split(':').map(Number);
      
      // Schedule repeating notification for this meal
      await Notifications.scheduleNotificationAsync({
        identifier: `${planId}-${meal.mealId}`,
        content: {
          title: '🍽️ Hora da refeição!',
          body: `Não esqueça: ${meal.mealName || 'Refeição'}`,
          data: { planId, mealId: meal.mealId },
          sound: true,
        },
        trigger: {
          channelId: 'meal-reminders',
          hour: hours,
          minute: minutes,
          repeats: true,
          weekday: meal.dayOfWeek + 1, // expo-notifications uses 1-7 (Sunday=1)
        },
      });
    }

    console.log(`Scheduled ${meals.length} meal notifications for plan ${planId}`);
  } catch (error) {
    console.error('Error scheduling meal notifications:', error);
  }
}

export async function cancelPlanNotifications(planId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    const notificationsToCancel = scheduledNotifications
      .filter(n => n.identifier.startsWith(`${planId}-`))
      .map(n => n.identifier);

    if (notificationsToCancel.length > 0) {
      for (const id of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      console.log(`Cancelled ${notificationsToCancel.length} notifications for plan ${planId}`);
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}
