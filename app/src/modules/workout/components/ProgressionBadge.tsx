import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type ProgressionType = 'improved' | 'decreased' | 'maintained';
type MetricType = 'weight' | 'reps' | 'sets';

interface ProgressionBadgeProps {
  type: ProgressionType;
  value: string; // Ex: "+2kg", "-2 reps", "="
  metric?: MetricType;
}

export function ProgressionBadge({ type, value }: ProgressionBadgeProps) {
  const colors = {
    improved: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
    },
    decreased: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
    },
    maintained: {
      bg: 'bg-zinc-700/20',
      border: 'border-zinc-600/40',
      text: 'text-zinc-400',
    },
  };

  const icons: Record<ProgressionType, string> = {
    improved: 'arrow-up',
    decreased: 'arrow-down',
    maintained: 'remove',
  };

  const { bg, border, text } = colors[type];

  return (
    <View className={`flex-row items-center ${bg} ${border} border px-2 py-0.5 rounded-full`}>
      <Ionicons
        name={icons[type] as never}
        size={10}
        color={type === 'improved' ? '#34D399' : type === 'decreased' ? '#F87171' : '#A1A1AA'}
      />
      <Text className={`${text} text-[9px] font-black uppercase tracking-widest ml-1`}>
        {value}
      </Text>
    </View>
  );
}
