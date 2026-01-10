import { colors as brandColors } from '@/constants/colors';
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

const progressStyles = {
  success: {
    gradient: brandColors.gradients.success,
    icon: brandColors.status.success,
    border: `${brandColors.status.success}20`,
    bg: `${brandColors.status.success}10`,
  },
  warning: {
    gradient: brandColors.gradients.primary,
    icon: brandColors.primary.start,
    border: `${brandColors.primary.start}20`,
    bg: `${brandColors.primary.start}10`,
  },
  danger: {
    gradient: brandColors.gradients.primaryReverse,
    icon: brandColors.status.error,
    border: `${brandColors.status.error}20`,
    bg: `${brandColors.status.error}10`,
  },
  info: {
    gradient: brandColors.gradients.secondary,
    icon: brandColors.status.info,
    border: `${brandColors.status.info}20`,
    bg: `${brandColors.status.info}10`,
  },
};

export function ProgressCard({ title, current, target, icon, color, unit = '' }: ProgressCardProps) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const percentage = Math.round(progress * 100);

  return (
    <View 
      className="rounded-[22px] p-5 mb-3 border"
      style={{ 
        backgroundColor: brandColors.background.secondary,
        borderColor: progressStyles[color].border
      }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-3">
          <View 
            className="p-2.5 rounded-2xl border"
            style={{ 
              backgroundColor: progressStyles[color].bg,
              borderColor: progressStyles[color].border
            }}
          >
            <Ionicons name={icon} size={20} color={progressStyles[color].icon} />
          </View>
          <Text className="text-white text-[17px] font-bold tracking-tight font-display">{title}</Text>
        </View>
        <Text 
          className="text-[15px] font-black font-display"
          style={{ color: progressStyles[color].icon }}
        >
          {percentage}%
        </Text>
      </View>

      <View className="mb-3">
        <View className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <LinearGradient
            colors={progressStyles[color].gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-zinc-500 text-[14px] font-bold uppercase tracking-widest">
          <Text className="text-white font-extrabold">{current}</Text> / {target} {unit}
        </Text>
        {percentage >= 100 && (
          <Ionicons name="checkmark-circle" size={18} color={progressStyles[color].icon} />
        )}
      </View>
    </View>
  );
}
