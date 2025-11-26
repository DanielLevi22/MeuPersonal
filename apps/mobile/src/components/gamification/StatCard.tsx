import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ label, value, trend, change, icon }: StatCardProps) {
  return (
    <View className="bg-card rounded-2xl p-4 border border-white/5 flex-row justify-between items-start">
      <View className="flex-1">
        <Text className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-widest">
          {label}
        </Text>
        <Text className="text-foreground text-2xl font-bold mb-1">{value}</Text>
        
        {(trend && change) && (
          <View className="flex-row items-center gap-1">
            <Ionicons 
              name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'} 
              size={12} 
              color={trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF'} 
            />
            <Text 
              className="text-xs font-semibold"
              style={{ color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF' }}
            >
              {change}
            </Text>
          </View>
        )}
      </View>
      
      {icon && (
        <View className="bg-white/5 p-2 rounded-xl">
          <Ionicons name={icon} size={24} color="#A1A1AA" />
        </View>
      )}
    </View>
  );
}
