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
  success: ['#00C9A7', '#00A88E'], // Emerald
  warning: ['#FFB800', '#FF9500'], // Gold
  danger: ['#FF2E63', '#FF0000'],  // Pink/Red
  info: ['#00D9FF', '#00B8D9'],    // Cyan
};

const iconColors = {
  success: '#00C9A7',
  warning: '#FFB800',
  danger: '#FF2E63',
  info: '#00D9FF',
};

export function ProgressCard({ title, current, target, icon, color, unit = '' }: ProgressCardProps) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const percentage = Math.round(progress * 100);

  return (
    <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <View 
            className="p-2 rounded-xl"
            style={{ backgroundColor: iconColors[color] + '20' }}
          >
            <Ionicons name={icon} size={20} color={iconColors[color]} />
          </View>
          <Text className="text-white text-sm font-semibold">{title}</Text>
        </View>
        <Text 
          className="text-sm font-bold"
          style={{ color: iconColors[color] }}
        >
          {percentage}%
        </Text>
      </View>

      <View className="mb-2">
        <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
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
        <Text className="text-white text-sm font-bold">
          {current} <Text className="text-zinc-500 font-normal">/ {target} {unit}</Text>
        </Text>
        {percentage >= 100 && (
          <Ionicons name="checkmark-circle" size={16} color={iconColors[color]} />
        )}
      </View>
    </View>
  );
}
