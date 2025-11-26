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
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  info: ['#3B82F6', '#2563EB'],
};

export function ProgressCard({ title, current, target, icon, color, unit = '' }: ProgressCardProps) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const percentage = Math.round(progress * 100);

  return (
    <View className="bg-card rounded-2xl p-4 border border-white/5">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <View 
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors[color][1] + '20' }}
          >
            <Ionicons name={icon} size={20} color={colors[color][1]} />
          </View>
          <Text className="text-foreground text-sm font-semibold">{title}</Text>
        </View>
        <Text 
          className="text-sm font-bold"
          style={{ color: colors[color][1] }}
        >
          {percentage}%
        </Text>
      </View>

      <View className="mb-2">
        <View className="h-2 bg-white/10 rounded-full overflow-hidden">
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
        <Text className="text-foreground text-sm font-bold">
          {current} <Text className="text-muted-foreground font-normal">/ {target} {unit}</Text>
        </Text>
        {percentage >= 100 && (
          <Ionicons name="checkmark-circle" size={16} color={colors[color][1]} />
        )}
      </View>
    </View>
  );
}
