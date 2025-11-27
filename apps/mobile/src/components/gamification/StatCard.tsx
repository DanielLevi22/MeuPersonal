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
    <View 
      className="rounded-[22px] p-5 mb-3 flex-row justify-between items-start"
      style={{ 
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <View className="flex-1">
        <Text className="text-zinc-500 text-[11px] font-bold mb-1.5 uppercase tracking-widest">
          {label}
        </Text>
        <Text className="text-white text-[28px] font-bold mb-1 tracking-tight">{value}</Text>
        
        {(trend && change) && (
          <View className="flex-row items-center gap-1.5">
            <View className={`rounded-full p-0.5 ${trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-rose-500/10' : 'bg-zinc-500/10'}`}>
              <Ionicons 
                name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'} 
                size={10} 
                color={trend === 'up' ? '#34C759' : trend === 'down' ? '#FF2E63' : '#A1A1AA'} 
              />
            </View>
            <Text 
              className="text-[13px] font-semibold"
              style={{ color: trend === 'up' ? '#34C759' : trend === 'down' ? '#FF2E63' : '#A1A1AA' }}
            >
              {change}
            </Text>
          </View>
        )}
      </View>
      
      {icon && (
        <View className="bg-zinc-800/50 p-2.5 rounded-full">
          <Ionicons name={icon} size={20} color="#E4E4E7" />
        </View>
      )}
    </View>
  );
}
