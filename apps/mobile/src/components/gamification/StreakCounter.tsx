import { colors as brandColors } from '@/constants/colors';
import { Text, View } from 'react-native';
import { FireAnimation } from './FireAnimation';

interface StreakCounterProps {
  streak: number;
  frozen?: boolean;
}

export function StreakCounter({ streak, frozen = false }: StreakCounterProps) {
  return (
    <View 
      className="px-3 py-2 rounded-full flex-row items-center gap-x-2 border"
      style={{
        backgroundColor: frozen ? brandColors.secondary.main + '20' : brandColors.primary.start + '20',
        borderColor: frozen ? brandColors.secondary.main + '40' : brandColors.primary.start + '40'
      }}
    >
      <FireAnimation active={streak > 0} frozen={frozen} size={20} />
      <Text 
        className="font-bold text-base font-display"
        style={{ color: frozen ? brandColors.secondary.main : brandColors.primary.start }}
      >
        {streak}
      </Text>
    </View>
  );
}

