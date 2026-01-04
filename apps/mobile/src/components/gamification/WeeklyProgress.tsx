import { DailyGoal } from '@/services/gamification';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface WeeklyProgressProps {
  weeklyGoals: DailyGoal[];
}

const getDayLabel = (dateStr: string) => {
  // Use UTC to avoid timezone shifts for YYYY-MM-DD
  const dayIndex = new Date(dateStr).getUTCDay();
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  return days[dayIndex];
};

export function WeeklyProgress({ weeklyGoals }: WeeklyProgressProps) {
  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <View className="mb-8">
      <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
        Consistência Semanal
      </Text>
      
      <View className="flex-row justify-between items-center bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
        {days.map((date, index) => {
          const goal = weeklyGoals.find(g => g.date === date);
          const isToday = date === today;
          
          // Determine status
          // Note: "completed" boolean might count sleep/water. 
          // For consistency chart, let's focus on Meal AND Workout (if target > 0)
          const mealsDone = (goal?.meals_completed || 0) >= (goal?.meals_target || 1);
          const workoutDone = (goal?.workout_target || 0) === 0 || (goal?.workout_completed || 0) >= goal!.workout_target;
          
          const isSuccess = mealsDone && workoutDone;
          const isFuture = date > today;
          const isMissed = !isFuture && !isSuccess;

          const dayLabel = getDayLabel(date);

          return (
            <View key={date} className="items-center gap-2">
              <Text className={`text-[10px] font-bold ${isToday ? 'text-white' : 'text-zinc-500'}`}>
                {dayLabel}
              </Text>
              
              <View 
                className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  isToday 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-transparent bg-zinc-800'
                } ${
                  isSuccess ? 'bg-emerald-500/20' : ''
                }`}
                style={isSuccess && !isToday ? { backgroundColor: 'rgba(16, 185, 129, 0.1)' } : {}}
              >
                {isFuture ? (
                  <View className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                ) : isSuccess ? (
                  <Ionicons name="checkmark" size={16} color="#34D399" />
                ) : (
                  <Ionicons name="close" size={16} color={isToday ? "#FF6B35" : "#71717A"} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
