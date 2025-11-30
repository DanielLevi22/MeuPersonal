import { Text, View } from 'react-native';
import { FireAnimation } from './FireAnimation';

interface StreakCounterProps {
  streak: number;
  frozen?: boolean;
}

export function StreakCounter({ streak, frozen = false }: StreakCounterProps) {
  return (
    <View 
      className={`px-3 py-2 rounded-full flex-row items-center gap-x-2 border ${
        frozen 
          ? 'bg-blue-500/10 border-blue-500/20' 
          : 'bg-orange-500/10 border-orange-500/20'
      }`}
    >
      <FireAnimation active={streak > 0} frozen={frozen} size={20} />
      <Text className={`font-bold text-base font-display ${
        frozen ? 'text-blue-500' : 'text-orange-500'
      }`}>
        {streak}
      </Text>
    </View>
  );
}
