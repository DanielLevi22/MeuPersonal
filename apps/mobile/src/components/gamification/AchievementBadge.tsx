import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AchievementBadgeProps {
  title: string;
  subtitle?: string;
  icon: string; // Emoji or image URL
  earned: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ title, subtitle, icon, earned, size = 'md' }: AchievementBadgeProps) {
  const sizeMap = {
    sm: { container: 60, icon: 24, fontSize: 10 },
    md: { container: 80, icon: 32, fontSize: 12 },
    lg: { container: 100, icon: 40, fontSize: 14 },
  };

  const currentSize = sizeMap[size];

  return (
    <View style={[styles.wrapper, { opacity: earned ? 1 : 0.5 }]}>
      <LinearGradient
        colors={earned ? ['#FFD700', '#F59E0B'] : ['#374151', '#1F2937']}
        style={[styles.container, { width: currentSize.container, height: currentSize.container }]}
      >
        <View style={styles.innerCircle}>
          <Text style={{ fontSize: currentSize.icon }}>{icon}</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, { fontSize: currentSize.fontSize }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { fontSize: currentSize.fontSize - 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  container: {
    borderRadius: 999,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    flex: 1,
    width: '100%',
    backgroundColor: '#141B2D',
    borderRadius: 999,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8B92A8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
