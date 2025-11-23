import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
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
  foodNames?: string[];
}

export async function scheduleMealNotifications(
  planId: string,
  meals: MealNotification[]
): Promise<void> {
  try {
    // NUCLEAR OPTION: Cancel ALL notifications to ensure no ghosts remain from previous attempts
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('☢️ CANCELLING ALL NOTIFICATIONS (Nuclear Option) to prevent duplicates');

    for (const meal of meals) {
      if (!meal.mealTime || meal.dayOfWeek === undefined || meal.dayOfWeek === null) {
        console.warn('Skipping invalid meal notification:', meal);
        continue;
      }

      const [hours, minutes] = meal.mealTime.split(':').map(Number);
      const dayOfWeek = Number(meal.dayOfWeek);

      if (isNaN(hours) || isNaN(minutes) || isNaN(dayOfWeek)) {
        console.warn('Invalid time or day for meal:', meal);
        continue;
      }

      // Expo uses 1-7 (Sunday=1, Saturday=7)
      // Our DB uses 0-6 (Sunday=0, Saturday=6)
      const weekday = dayOfWeek + 1;

      if (weekday < 1 || weekday > 7) {
        console.warn('Invalid weekday calculated:', weekday, 'from dayOfWeek:', dayOfWeek);
        continue;
      }
      
      // Format body text
      let bodyText = `Não esqueça: ${meal.mealName || 'Refeição'}`;
      if (meal.foodNames && meal.foodNames.length > 0) {
        const foodsList = meal.foodNames.join(', ');
        bodyText += `\n${foodsList}`;
      }

      if (Platform.OS === 'android') {
        // Android doesn't support "weekly" repeating triggers reliably with expo-notifications
        // Strategy: Schedule individual notifications for the next 4 weeks
        const now = new Date();
        const weeksToSchedule = 4;

        for (let i = 0; i < weeksToSchedule; i++) {
          // Calculate date for this week's occurrence
          let targetDate = new Date();
          targetDate.setDate(now.getDate() + (i * 7)); // Move to future weeks
          
          // Adjust to the correct day of week
          // dayOfWeek: 0 (Sun) - 6 (Sat)
          // targetDate.getDay(): 0 (Sun) - 6 (Sat)
          const currentDay = targetDate.getDay();
          const daysUntilTarget = (dayOfWeek + 7 - currentDay) % 7;
          
          targetDate.setDate(targetDate.getDate() + daysUntilTarget);
          targetDate.setHours(hours, minutes, 0, 0);

          console.log(`[Debug] Scheduling for: ${meal.mealName}`);
          console.log(`[Debug] Now: ${now.toISOString()}`);
          console.log(`[Debug] Target (initial): ${targetDate.toISOString()}`);
          console.log(`[Debug] DayOfWeek: ${dayOfWeek}, CurrentDay: ${currentDay}, DaysUntil: ${daysUntilTarget}`);

          // If the time has already passed for this week
          if (targetDate.getTime() <= now.getTime()) {
             const timeDiff = now.getTime() - targetDate.getTime();
             const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes grace period

             if (i === 0 && timeDiff < GRACE_PERIOD_MS) {
                // If it's the current week and within grace period, schedule immediately using TimeInterval
                // TimeInterval is often more reliable for "immediate" triggers than a Date slightly in the past/future
                console.log(`[Debug] Within grace period (${timeDiff}ms), scheduling IMMEDIATELY via TimeInterval`);
                
                await Notifications.scheduleNotificationAsync({
                  identifier: `${planId}-${meal.mealId}-${i}`,
                  content: {
                    title: '🍽️ Hora da refeição!',
                    body: bodyText,
                    data: { planId, mealId: meal.mealId },
                    sound: true,
                    // @ts-ignore
                    channelId: 'meal-reminders',
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 2, // Fire in 2 seconds
                    repeats: false,
                  },
                });
                continue; // Skip the standard scheduling for this instance
             } else {
                // Otherwise, skip this iteration (don't duplicate next week's notification)
                console.log('[Debug] Time passed, skipping this instance');
                continue;
             }
          }
          console.log(`[Debug] Final Target: ${targetDate.toISOString()}`);

          const trigger: Notifications.DateTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
          };

          await Notifications.scheduleNotificationAsync({
            identifier: `${planId}-${meal.mealId}-${i}`, // Unique ID for each instance
            content: {
              title: '🍽️ Hora da refeição!',
              body: bodyText,
              data: { planId, mealId: meal.mealId },
              sound: true,
              // @ts-ignore
              channelId: 'meal-reminders',
            },
            trigger,
          });
        }
      } else {
        // iOS supports weekly repeating triggers
        const trigger: any = {
          hour: hours,
          minute: minutes,
          repeats: true,
          weekday: weekday,
        };

        await Notifications.scheduleNotificationAsync({
          identifier: `${planId}-${meal.mealId}`,
          content: {
            title: '🍽️ Hora da refeição!',
            body: `Não esqueça: ${meal.mealName || 'Refeição'}`,
            data: { planId, mealId: meal.mealId },
            sound: true,
          },
          trigger,
        });
      }
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
