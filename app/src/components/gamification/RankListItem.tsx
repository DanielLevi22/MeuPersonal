import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { colors as brandColors } from '@/constants/colors';

interface RankListItemProps {
  item: {
    student_id: string;
    name: string;
    points: number;
    avatar_url?: string;
    rank: number;
  };
  isCurrentUser: boolean;
}

export function RankListItem({ item, isCurrentUser }: RankListItemProps) {
  const _isTopThree = item.rank <= 3;
  const rankColor =
    item.rank === 1
      ? 'text-yellow-400'
      : item.rank === 2
        ? 'text-zinc-300'
        : item.rank === 3
          ? 'text-orange-400'
          : 'text-zinc-500';

  return (
    <View
      className={`flex-row items-center justify-between py-4 px-5 rounded-2xl mb-3 border ${
        isCurrentUser ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <View className="flex-row items-center flex-1">
        <Text className={`text-lg font-black italic w-10 text-center mr-2 ${rankColor}`}>
          #{item.rank}
        </Text>

        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            className="w-10 h-10 rounded-full mr-4 border-2"
            style={{ borderColor: isCurrentUser ? brandColors.primary.start : '#27272a' }}
          />
        ) : (
          <View
            className="w-10 h-10 rounded-full mr-4 items-center justify-center border-2"
            style={{
              backgroundColor: isCurrentUser
                ? `${brandColors.primary.start}20`
                : brandColors.background.elevated,
              borderColor: isCurrentUser ? brandColors.primary.start : '#27272a',
            }}
          >
            <Text className="text-white font-bold text-sm">{item.name.charAt(0)}</Text>
          </View>
        )}

        <View className="flex-1 justify-center">
          <Text
            className={`text-base font-bold ${isCurrentUser ? 'text-white' : 'text-zinc-100'}`}
            numberOfLines={1}
          >
            {item.name}{' '}
            {isCurrentUser && <Text className="text-yellow-500 text-xs font-normal"> (Você)</Text>}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-base font-black italic" style={{ color: brandColors.primary.start }}>
          {item.points}
        </Text>
        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">PTS</Text>
      </View>
    </View>
  );
}
