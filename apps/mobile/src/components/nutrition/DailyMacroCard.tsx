import { useNutritionStore } from '@/modules/nutrition/store/nutritionStore';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

interface DailyMacroCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function DailyMacroCard({ calories: defaultCalories, protein: defaultProt, carbs: defaultCarbs, fat: defaultFat }: DailyMacroCardProps) {
  const { currentDietPlan } = useNutritionStore();
  
  // Use real data if available, otherwise defaults
  const calories = currentDietPlan?.target_calories || defaultCalories;
  const protein = currentDietPlan?.target_protein || defaultProt;
  const carbs = currentDietPlan?.target_carbs || defaultCarbs;
  const fat = currentDietPlan?.target_fat || defaultFat;

  // Constants for Chart
  const size = 120;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages (Mock assumption: 50% Carbs, 30% Protein, 20% Fat if defaults)
  // In reality, we use the props.
  const totalGrams = protein + carbs + fat;
  const pProt = totalGrams > 0 ? protein / totalGrams : 0.3;
  const pCarb = totalGrams > 0 ? carbs / totalGrams : 0.5;
  const pFat = totalGrams > 0 ? fat / totalGrams : 0.2;

  // Segments (Cumulative for circle strokeDashoffset)
  // We want to render segments. Simplest way with Circle:
  // Use `strokeDasharray` [length, gap]
  // Length = percent * circumference
  
  const aCarb = pCarb * circumference;
  const aProt = pProt * circumference;
  const aFat = pFat * circumference;

  return (
    <Animated.View 
      entering={FadeInDown.delay(400).springify()}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6"
    >
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
            <View className="bg-orange-500/20 p-2 rounded-xl">
                <Ionicons name="flame" size={24} color="#F97316" />
            </View>
            <View>
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Metas Diárias</Text>
                <Text className="text-white text-2xl font-black font-display">{calories} kcal</Text>
            </View>
        </View>

        {/* Chart Content */}
        <View className="flex-row items-center justify-between">
            
            {/* Donut Chart */}
            <View className="relative w-[120px] h-[120px] items-center justify-center">
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G rotation="-90" origin={`${center}, ${center}`}>
                         {/* Background Circle */}
                         <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#27272A"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        
                        {/* Carbs (Pink) */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#F472B6" // Pink-400
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${aCarb} ${circumference}`}
                            strokeLinecap="round"
                        />

                        {/* Protein (Blue) */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#60A5FA" // Blue-400
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${aProt} ${circumference}`}
                            strokeDashoffset={-aCarb} // Rotate past carbs
                            strokeLinecap="round"
                        />

                        {/* Fat (Yellow) */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#FACC15" // Yellow-400
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${aFat} ${circumference}`}
                            strokeDashoffset={-(aCarb + aProt)} // Rotate past both
                            strokeLinecap="round"
                        />
                    </G>
                </Svg>
                
                {/* Center Text */}
                <View className="absolute items-center justify-center">
                    <Text className="text-white font-bold text-lg">{Math.round((protein / (totalGrams || 1)) * 100)}%</Text>
                    <Text className="text-zinc-500 text-[10px] uppercase">Prot</Text>
                </View>
            </View>

            {/* Legend / Stats */}
            <View className="flex-1 ml-6 gap-4">
                {/* Carbs */}
                <View>
                    <Text className="text-[#F472B6] font-bold text-sm mb-0.5">Carboidratos</Text>
                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-lg font-bold">{carbs}g</Text>
                        <Text className="text-zinc-500 text-xs">{carbs * 4} kcal</Text>
                    </View>
                    <View className="h-1 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <View className="h-full bg-[#F472B6]" style={{ width: `${pCarb * 100}%` }} />
                    </View>
                </View>

                {/* Protein */}
                <View>
                    <Text className="text-[#60A5FA] font-bold text-sm mb-0.5">Proteínas</Text>
                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-lg font-bold">{protein}g</Text>
                        <Text className="text-zinc-500 text-xs">{protein * 4} kcal</Text>
                    </View>
                     <View className="h-1 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <View className="h-full bg-[#60A5FA]" style={{ width: `${pProt * 100}%` }} />
                    </View>
                </View>

                {/* Fat */}
                <View>
                    <Text className="text-[#FACC15] font-bold text-sm mb-0.5">Gorduras</Text>
                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-lg font-bold">{fat}g</Text>
                        <Text className="text-zinc-500 text-xs">{fat * 9} kcal</Text>
                    </View>
                     <View className="h-1 w-full bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <View className="h-full bg-[#FACC15]" style={{ width: `${pFat * 100}%` }} />
                    </View>
                </View>
            </View>
        </View>
    </Animated.View>
  );
}
