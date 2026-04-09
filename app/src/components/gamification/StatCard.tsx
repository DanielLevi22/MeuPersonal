import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors } from '@/constants/colors';

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
      className="rounded-[22px] p-5 mb-3 flex-row justify-between items-start border"
      style={{
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.dark,
      }}
    >
      <View className="flex-1">
        <Text className="text-zinc-500 text-[11px] font-bold mb-1.5 uppercase tracking-widest">
          {label}
        </Text>
        <Text className="text-white text-[28px] font-bold mb-1 tracking-tight">{value}</Text>

        {trend && change && (
          <View className="flex-row items-center gap-1.5">
            <View
              className="rounded-full p-0.5"
              style={{
                backgroundColor: `${trend === 'up' ? colors.status.success : trend === 'down' ? colors.status.error : colors.text.muted}15`,
              }}
            >
              <Ionicons
                name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove'}
                size={10}
                color={
                  trend === 'up'
                    ? colors.status.success
                    : trend === 'down'
                      ? colors.status.error
                      : colors.text.muted
                }
              />
            </View>
            <Text
              className="text-[13px] font-bold"
              style={{
                color:
                  trend === 'up'
                    ? colors.status.success
                    : trend === 'down'
                      ? colors.status.error
                      : colors.text.muted,
              }}
            >
              {change}
            </Text>
          </View>
        )}
      </View>

      {icon && (
        <View className="bg-white/5 p-2.5 rounded-2xl border border-white/5">
          <Ionicons name={icon} size={20} color={colors.text.secondary} />
        </View>
      )}
    </View>
  );
}
