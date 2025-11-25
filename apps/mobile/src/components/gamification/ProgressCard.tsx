import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'success' | 'warning' | 'danger' | 'info';
  unit?: string;
}

const colors = {
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  info: ['#3B82F6', '#2563EB'],
};

export function ProgressCard({ title, current, target, icon, color, unit = '' }: ProgressCardProps) {
  const progress = Math.min(Math.max(current / target, 0), 1);
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors[color][1] + '20' }]}>
            <Ionicons name={icon} size={20} color={colors[color][1]} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={[styles.percentage, { color: colors[color][1] }]}>{percentage}%</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={colors[color] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {current} <Text style={styles.targetText}>/ {target} {unit}</Text>
        </Text>
        {percentage >= 100 && (
          <Ionicons name="checkmark-circle" size={16} color={colors[color][1]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  targetText: {
    color: '#8B92A8',
    fontWeight: '400',
  },
});
