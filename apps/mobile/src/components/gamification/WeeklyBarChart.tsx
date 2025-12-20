import { DailyGoal } from '@/services/gamification';
import { useMemo, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface WeeklyBarChartProps {
  data: DailyGoal[];
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48; // Padding 24 * 2
  const maxBarHeight = 150;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Process data to ensure we have 7 days (or use provided data)
  const weekData = useMemo(() => {
    const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']; // Fixed 3-letter labels
    return data.map(d => {
       const date = new Date(d.date);
       const dayLabel = DAYS[date.getDay()];
       return {
         ...d,
         label: dayLabel,
         mealProgress: d.meals_target > 0 ? Math.min(d.meals_completed / d.meals_target, 1) : 0,
         workoutProgress: d.workout_target > 0 ? Math.min(d.workout_completed / d.workout_target, 1) : 0
       };
    });
  }, [data]);

  if (!data || data.length === 0) {
      return (
          <View className="bg-zinc-900/50 rounded-3xl p-6 items-center justify-center border border-zinc-800" style={{ height: 200 }}>
              <Text className="text-zinc-500 text-sm">Sem dados para exibir</Text>
          </View>
      );
  }

  const selectedData = selectedIndex !== null ? weekData[selectedIndex] : null;

  return (
    <View className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 relative">
      {/* Header / Details Overlay */}
      <View className="flex-row justify-between items-center mb-6 h-10">
        {selectedData ? (
            <Animated.View entering={FadeInDown.duration(200)} className="flex-1 flex-row items-center justify-between bg-zinc-800/80 px-3 py-2 rounded-xl">
                 <Text className="text-white font-bold text-sm">{selectedData.label}</Text>
                 <View className="flex-row gap-3">
                     <Text className="text-emerald-400 text-xs font-medium">
                        🥗 {selectedData.meals_completed}/{selectedData.meals_target}
                     </Text>
                     <Text className="text-orange-400 text-xs font-medium">
                        💪 {selectedData.workout_completed}/{selectedData.workout_target}
                     </Text>
                 </View>
            </Animated.View>
        ) : (
            <>
                <Text className="text-white font-bold text-base">Atividade Semanal</Text>
                <View className="flex-row gap-4">
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <Text className="text-zinc-400 text-xs font-medium">Dieta</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <Text className="text-zinc-400 text-xs font-medium">Treino</Text>
                    </View>
                </View>
            </>
        )}
      </View>

      <View className="flex-row justify-between items-end h-[150px] mb-2">
        {weekData.map((day, index) => {
            const isSelected = selectedIndex === index;
            const isBlur = selectedIndex !== null && !isSelected;

            return (
            <TouchableOpacity
                key={index} 
                onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}
                activeOpacity={0.7}
                style={{ width: (chartWidth - 48) / 7 }} // Distribute space
            >
                <Animated.View 
                    entering={FadeInDown.delay(index * 100).springify()}
                    className={`items-center gap-1 ${isBlur ? 'opacity-30' : 'opacity-100'}`}
                >
                    {/* Bar Container */}
                    <View className="flex-row gap-1 items-end h-full">
                        {/* Diet Bar */}
                        <View 
                        className={`w-2 rounded-full overflow-hidden relative ${isSelected ? 'bg-zinc-700' : 'bg-zinc-800'}`}
                        style={{ height: '100%' }}
                        >
                            <View 
                                className="bg-emerald-500 w-full absolute bottom-0 rounded-full"
                                style={{ height: `${day.mealProgress * 100}%` }}
                            />
                        </View>

                        {/* Workout Bar */}
                        <View 
                        className={`w-2 rounded-full overflow-hidden relative ${isSelected ? 'bg-zinc-700' : 'bg-zinc-800'}`}
                        style={{ height: '100%' }}
                        >
                            <View 
                                className="bg-orange-500 w-full absolute bottom-0 rounded-full"
                                style={{ height: `${day.workoutProgress * 100}%` }}
                            />
                        </View>
                    </View>

                    {/* Label */}
                    <Text className={`text-[10px] font-bold mt-2 ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                        {day.label}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        )})}
      </View>
    </View>
  );
}
