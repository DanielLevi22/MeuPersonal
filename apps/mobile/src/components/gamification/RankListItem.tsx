import { colors as brandColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

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
  return (
    <View 
      className={`flex-row items-center justify-between py-3 px-4 rounded-xl mb-2 border ${
        isCurrentUser ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-900 border-zinc-800'
      }`}
      style={isCurrentUser ? { borderColor: brandColors.primary.start } : {}}
    >
      <View className="flex-row items-center flex-1">
        <Text className={`text-base font-bold w-8 ${isCurrentUser ? 'text-white' : 'text-zinc-400'}`}>
          {item.rank}
        </Text>
        
        {item.avatar_url ? (
          <Image 
            source={{ uri: item.avatar_url }} 
            className="w-9 h-9 rounded-full mr-3 border"
            style={{ borderColor: isCurrentUser ? brandColors.primary.start : brandColors.border.dark }} 
          />
        ) : (
          <View 
            className="w-9 h-9 rounded-full mr-3 items-center justify-center border"
            style={{ 
              backgroundColor: isCurrentUser ? brandColors.primary.start + '20' : brandColors.background.elevated, 
              borderColor: isCurrentUser ? brandColors.primary.start : brandColors.border.dark 
            }}
          >
            <Text className="text-white font-bold text-sm">{item.name.charAt(0)}</Text>
          </View>
        )}
        
        <Text 
          className={`text-sm font-semibold flex-1 ${isCurrentUser ? 'text-white' : 'text-zinc-200'}`} 
          numberOfLines={1}
        >
          {item.name} {isCurrentUser && '(Você)'}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        <Text 
          className="text-sm font-bold"
          style={{ color: brandColors.primary.start }}
        >
          {item.points} pts
        </Text>
        {isCurrentUser && (
          <Ionicons name="flame" size={16} color={brandColors.primary.start} style={{ marginLeft: 4 }} />
        )}
      </View>
    </View>
  );
}

