import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

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
      case 1: return { height: 160, color: ['#FFD700', '#F59E0B'], scale: 1.1 };
      case 2: return { height: 130, color: ['#C0C0C0', '#9CA3AF'], scale: 1 };
      case 3: return { height: 110, color: ['#CD7F32', '#A0522D'], scale: 0.9 };
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
    <View style={styles.container}>
      {visualOrder.map((student: any) => {
        const style = getPodiumStyle(student.rank);
        return (
          <View key={student.student_id} style={[styles.column, { transform: [{ scale: style.scale }] }]}>
            <View style={styles.avatarContainer}>
              {student.avatar_url ? (
                <Image source={{ uri: student.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: style.color[1] }]}>
                <Text style={styles.badgeText}>{student.rank}</Text>
              </View>
            </View>
            
            <Text style={styles.name} numberOfLines={1}>{student.name.split(' ')[0]}</Text>
            <Text style={styles.points}>{student.points} pts</Text>
            
            <LinearGradient
              colors={style.color as [string, string]}
              style={[styles.bar, { height: style.height }]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 240,
    marginBottom: 24,
    gap: 16,
  },
  column: {
    alignItems: 'center',
    width: 80,
  },
  avatarContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1E2A42',
  },
  avatarPlaceholder: {
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A0E1A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  points: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.8,
  },
});
