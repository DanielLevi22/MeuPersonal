import { usePulseAnimation } from '@/hooks/useGamificationAnimations';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Text } from 'react-native';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const scale = usePulseAnimation(streak > 0);

  return (
    <Animated.View 
      className="bg-orange-500/10 px-3 py-2 rounded-full flex-row items-center gap-x-2 border border-orange-500/20"
      style={{ transform: [{ scale }] }}
    >
      <Ionicons name="flame" size={20} color="#F97316" />
      <Text className="text-orange-500 font-bold text-base font-display">
        {streak}
      </Text>
    </Animated.View>
  );
}
