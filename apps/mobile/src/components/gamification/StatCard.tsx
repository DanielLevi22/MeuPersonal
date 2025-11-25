import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ label, value, trend, change, icon }: StatCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        
        {(trend && change) && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'} 
              size={12} 
              color={trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF'} 
            />
            <Text style={[
              styles.change, 
              { color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF' }
            ]}>
              {change}
            </Text>
          </View>
        )}
      </View>
      
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#8B92A8" />
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
  },
  label: {
    color: '#8B92A8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 12,
  },
});
