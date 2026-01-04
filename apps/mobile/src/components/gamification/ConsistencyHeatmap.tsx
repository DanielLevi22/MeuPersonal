import { DailyGoal } from '@/services/gamification';
import { ScrollView, Text, View } from 'react-native';

interface ConsistencyHeatmapProps {
  history: DailyGoal[];
}

export function ConsistencyHeatmap({ history }: ConsistencyHeatmapProps) {
  // Generate last 16 weeks (~3-4 months)
  // Grid: Rows = Days (Sun-Sat), Cols = Weeks
  const numWeeks = 16;
  const today = new Date();
  
  // Calculate start date: Go back numWeeks, then find the Sunday of that week
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (numWeeks * 7));
  const dayOfWeek = startDate.getUTCDay(); // 0 = Sun
  startDate.setDate(startDate.getDate() - dayOfWeek); // Snap to previous Sunday

  const weeks = [];
  
  // Build grid data
  for (let w = 0; w < numWeeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find goal for this date
        // Optimize: Convert history to Map if performance issues, but for < 100 items array.find is fine
        const goal = history.find(g => g.date === dateStr);
        
        let level = 0;
        if (goal) {
            const mealsMet = (goal.meals_completed || 0) >= (goal.meals_target || 1);
            const workoutMet = (goal.workout_target || 0) === 0 || (goal.workout_completed || 0) >= goal.workout_target;
            
            if (mealsMet && workoutMet) level = 2; // Perfect
            else if (mealsMet || workoutMet) level = 1; // Good
        }
        
        // Don't show future days
        const isFuture = dateStr > new Date().toISOString().split('T')[0];

        weekDays.push({ date: dateStr, level, isFuture });
    }
    weeks.push(weekDays);
  }

  return (
    <View className="mb-8">
      <Text className="text-zinc-500 text-[13px] font-bold mb-3 font-sans uppercase tracking-widest ml-1">
        Consistência (Últimos 4 Meses)
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-[3px]">
            {weeks.map((week, wIndex) => (
                <View key={wIndex} className="gap-[3px]">
                    {week.map((day, dIndex) => (
                         <View 
                            key={day.date}
                            className={`w-3 h-3 rounded-[2px] ${
                                day.isFuture ? 'bg-zinc-900' :
                                day.level === 2 ? 'bg-emerald-500' : 
                                day.level === 1 ? 'bg-emerald-900 border border-emerald-500/30' : 
                                'bg-zinc-800'
                            }`}
                         />
                    ))}
                </View>
            ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center justify-end mt-2 gap-3 mr-1">
          <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-[2px] bg-zinc-800" />
              <Text className="text-[9px] text-zinc-500">Off</Text>
          </View>
          <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-[2px] bg-emerald-900 border border-emerald-500/30" />
              <Text className="text-[9px] text-zinc-500">Parcial</Text>
          </View>
          <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-[2px] bg-emerald-500" />
              <Text className="text-[9px] text-zinc-500">Meta!</Text>
          </View>
      </View>
    </View>
  );
}
