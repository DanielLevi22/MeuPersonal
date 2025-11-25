import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

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
    <View style={[styles.container, isCurrentUser && styles.currentUserContainer]}>
      <View style={styles.leftContent}>
        <Text style={[styles.rank, isCurrentUser && styles.currentUserText]}>
          {item.rank}
        </Text>
        
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        
        <Text style={[styles.name, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
          {item.name} {isCurrentUser && '(Você)'}
        </Text>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={[styles.points, isCurrentUser && styles.currentUserText]}>
          {item.points} pts
        </Text>
        {isCurrentUser && (
          <Ionicons name="flame" size={16} color="#FF6B35" style={{ marginLeft: 4 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E2A42',
  },
  currentUserContainer: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rank: {
    color: '#8B92A8',
    fontSize: 16,
    fontWeight: '700',
    width: 30,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
  },
  currentUserText: {
    color: '#FFFFFF',
  },
});
