import { colors as brandColors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

interface PodiumProps {
  topThree: {
    student_id: string;
    name: string;
    points: number;
    avatar_url?: string;
    rank: number;
  }[];
}

export function Podium({ topThree }: PodiumProps) {
  const getPodiumStyle = (rank: number) => {
    switch (rank) {
      // Gold
      case 1: return { height: 160, color: ['#FFD700', '#F59E0B'], scale: 1.1 };
      // Silver
      case 2: return { height: 130, color: ['#E2E8F0', '#94A3B8'], scale: 1 };
      // Bronze (Using Orange-ish bronze from palette or custom)
      case 3: return { height: 110, color: ['#F97316', '#C2410C'], scale: 0.9 };
      default: return { height: 100, color: ['#374151', '#1F2937'], scale: 1 };
    }
  };

  // Sort by rank just in case
  const sorted = [...topThree].sort((a, b) => a.rank - b.rank);
  
  // Reorder for visual podium: 2nd, 1st, 3rd
  const visualOrder = [
    sorted.find(p => p.rank === 2),
    sorted.find(p => p.rank === 1),
    sorted.find(p => p.rank === 3),
  ].filter(Boolean);

  return (
    <View className="flex-row justify-center items-end h-[240px] mb-6 gap-4">
      {visualOrder.map((student: any) => {
        const style = getPodiumStyle(student.rank);
        return (
          <View key={student.student_id} className="items-center w-20" style={{ transform: [{ scale: style.scale }] }}>
            <View className="mb-2 relative">
              {student.avatar_url ? (
                <Image 
                    source={{ uri: student.avatar_url }} 
                    className="w-12 h-12 rounded-full border-2"
                    style={{ borderColor: brandColors.border.dark }}
                />
              ) : (
                <View 
                    className="w-12 h-12 rounded-full items-center justify-center border-2 border-zinc-800"
                    style={{ backgroundColor: brandColors.background.elevated }}
                >
                  <Text className="text-white font-bold text-lg">{student.name.charAt(0)}</Text>
                </View>
              )}
              <View 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border border-black"
                style={{ backgroundColor: style.color[1] }}
              >
                <Text className="text-white text-[10px] font-black">{student.rank}</Text>
              </View>
            </View>
            
            <Text className="text-white text-xs font-semibold mb-0.5" numberOfLines={1}>
                {student.name.split(' ')[0]}
            </Text>
            <Text className="text-[10px] font-bold mb-2" style={{ color: brandColors.primary.start }}>
                {student.points} pts
            </Text>
            
            <LinearGradient
              colors={style.color as [string, string]}
              className="w-full rounded-t-lg opacity-90"
              style={{ height: style.height }}
            />
          </View>
        );
      })}
    </View>
  );
}
