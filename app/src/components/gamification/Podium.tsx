import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { colors as brandColors } from '@/constants/colors';

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
      // Gold (Richer Amber/Yellow)
      case 1:
        return { height: 160, color: ['#FBBF24', '#B45309'], scale: 1.1 };
      // Silver (Metallic Blue-Gray)
      case 2:
        return { height: 130, color: ['#E2E8F0', '#475569'], scale: 1 };
      // Bronze (Deep Orange/Rust)
      case 3:
        return { height: 110, color: ['#FB923C', '#7C2D12'], scale: 0.9 };
      default:
        return { height: 100, color: ['#374151', '#1F2937'], scale: 1 };
    }
  };

  // Sort by rank just in case
  const sorted = [...topThree].sort((a, b) => a.rank - b.rank);

  // Reorder for visual podium: 2nd, 1st, 3rd
  const visualOrder = [
    sorted.find((p) => p.rank === 2),
    sorted.find((p) => p.rank === 1),
    sorted.find((p) => p.rank === 3),
  ].filter(Boolean);

  return (
    <View className="flex-row justify-center items-end min-h-[280px] pt-8 mb-6 gap-3">
      {/* 2nd Place */}
      <PodiumItem student={visualOrder[0]} rank={2} style={getPodiumStyle(2)} />

      {/* 1st Place */}
      <PodiumItem student={visualOrder[1]} rank={1} style={getPodiumStyle(1)} />

      {/* 3rd Place */}
      <PodiumItem student={visualOrder[2]} rank={3} style={getPodiumStyle(3)} />
    </View>
  );
}

function PodiumItem({
  student,
  rank,
  style,
}: {
  student: PodiumProps['topThree'][number] | undefined;
  rank: number;
  style: { height: number; color: string[]; scale: number };
}) {
  if (!student) {
    // Placeholder for empty slot
    return (
      <View
        className="items-center w-24 opacity-30"
        style={{ transform: [{ scale: style.scale }] }}
      >
        <View className="w-14 h-14 rounded-full bg-zinc-800 mb-2 border-2 border-zinc-700" />
        <LinearGradient
          colors={['#27272a', '#000000']}
          className="w-full rounded-t-xl"
          style={{ height: style.height }}
        />
      </View>
    );
  }

  return (
    <View className="items-center w-24 z-10" style={{ transform: [{ scale: style.scale }] }}>
      <View className="mb-3 relative shadow-xl shadow-black">
        {/* Crown for #1 */}
        {rank === 1 && <Text className="absolute -top-6 text-2xl text-center w-full">👑</Text>}

        {student.avatar_url ? (
          <Image
            source={{ uri: student.avatar_url }}
            className="w-16 h-16 rounded-full border-2"
            style={{ borderColor: style.color[0] }}
          />
        ) : (
          <View
            className="w-16 h-16 rounded-full items-center justify-center border-2"
            style={{
              backgroundColor: brandColors.background.elevated,
              borderColor: style.color[0],
            }}
          >
            <Text className="text-white font-black text-xl">{student.name.charAt(0)}</Text>
          </View>
        )}

        <View
          className="absolute -bottom-2 right-0 w-6 h-6 rounded-full items-center justify-center border-2 border-black"
          style={{ backgroundColor: style.color[0] }}
        >
          <Text className="text-black text-[10px] font-black">{rank}</Text>
        </View>
      </View>

      <Text className="text-white text-xs font-bold mb-0.5 text-center px-1" numberOfLines={1}>
        {student.name.split(' ')[0]}
      </Text>
      <Text
        className="text-[10px] font-black mb-2 uppercase tracking-wide"
        style={{ color: style.color[0] }}
      >
        {student.points} PTS
      </Text>

      <LinearGradient
        colors={style.color as [string, string]}
        className="w-full rounded-t-xl border-t border-white/20 shadow-lg shadow-black/50"
        style={{ height: style.height }}
      />
    </View>
  );
}
