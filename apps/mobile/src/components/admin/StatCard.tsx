import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const gradientColors = {
    purple: ['#8B5CF6', '#7C3AED'],
    blue: ['#3B82F6', '#2563EB'],
    green: ['#10B981', '#059669'],
    orange: ['#F59E0B', '#D97706'],
  };

  const colors = gradientColors[color as keyof typeof gradientColors] || gradientColors.purple;

  return (
    <View className="bg-surface border border-white/10 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-3">
            <Ionicons name={icon} size={20} color={colors[0]} />
          </View>
          <Text className="text-muted text-sm">{title}</Text>
        </View>
        
        {trend && (
          <View className={`flex-row items-center px-2 py-1 rounded-lg ${
            trend.direction === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Ionicons 
              name={trend.direction === 'up' ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend.direction === 'up' ? '#10B981' : '#EF4444'} 
            />
            <Text className={`text-xs font-semibold ml-1 ${
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.value}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-white text-3xl font-bold">{value}</Text>
    </View>
  );
}
