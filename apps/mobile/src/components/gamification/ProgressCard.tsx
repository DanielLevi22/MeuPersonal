import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'success' | 'warning' | 'danger' | 'info';
  unit?: string;
}

const colors = {
  success: ['#34C759', '#30D158'], // Apple Green
  warning: ['#FF6B35', '#FF8C61'], // Brand Orange
  danger: ['#FF2E63', '#FF4C79'],  // Brand Red
  info: ['#0A84FF', '#5AC8FA'],    // Apple Blue
};

const iconColors = {
  success: '#34C759',
  warning: '#FF6B35',
  danger: '#FF2E63',
  info: '#0A84FF',
};

const borderColors = {
  success: 'rgba(52, 199, 89, 0.15)',
  warning: 'rgba(255, 107, 53, 0.15)',
  danger: 'rgba(255, 46, 99, 0.15)',
  info: 'rgba(10, 132, 255, 0.15)',
};

export function ProgressCard({ title, current, target, icon, color, unit = '' }: ProgressCardProps) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const percentage = Math.round(progress * 100);

  return (
    <View 
      className="rounded-[22px] p-5 mb-3"
      style={{ 
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: borderColors[color]
      }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-3">
          <View 
            className="p-2.5 rounded-full"
            style={{ backgroundColor: iconColors[color] + '15' }}
          >
            <Ionicons name={icon} size={20} color={iconColors[color]} />
          </View>
          <Text className="text-white text-[17px] font-semibold tracking-tight">{title}</Text>
        </View>
        <Text 
          className="text-[15px] font-bold"
          style={{ color: iconColors[color] }}
        >
          {percentage}%
        </Text>
      </View>

      <View className="mb-3">
        <View className="h-2.5 bg-zinc-800/50 rounded-full overflow-hidden">
          <LinearGradient
            colors={colors[color] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-zinc-400 text-[14px] font-medium">
          <Text className="text-white font-semibold">{current}</Text> / {target} {unit}
        </Text>
        {percentage >= 100 && (
          <Ionicons name="checkmark-circle" size={18} color={iconColors[color]} />
        )}
      </View>
    </View>
  );
}
