import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface AchievementBadgeProps {
  title: string;
  subtitle?: string;
  icon: string; // Emoji or image URL
  earned: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ title, subtitle, icon, earned, size = 'md' }: AchievementBadgeProps) {
  const sizeMap = {
    sm: { container: 60, icon: 24, fontSize: 'text-[10px]' },
    md: { container: 80, icon: 32, fontSize: 'text-xs' },
    lg: { container: 100, icon: 40, fontSize: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <View className={`items-center gap-2 ${earned ? 'opacity-100' : 'opacity-50'}`}>
      <LinearGradient
        colors={earned ? ['#FFB800', '#FF9500'] : ['#27272A', '#18181B']}
        className="rounded-full p-[2px] justify-center items-center"
        style={{ width: currentSize.container, height: currentSize.container }}
      >
        <View className="flex-1 w-full bg-zinc-900 rounded-full m-[2px] justify-center items-center">
          <Text style={{ fontSize: currentSize.icon }}>{icon}</Text>
        </View>
      </LinearGradient>
      
      <View className="items-center">
        <Text className={`text-white font-bold text-center ${currentSize.fontSize}`} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className={`text-zinc-400 font-medium text-center ${currentSize.fontSize}`} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
