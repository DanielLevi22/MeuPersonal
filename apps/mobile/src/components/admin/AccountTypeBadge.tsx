import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface AccountTypeBadgeProps {
  accountType: 'admin' | 'professional' | 'managed_student' | 'autonomous_student';
  isSuperAdmin?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AccountTypeBadge({ accountType, isSuperAdmin, size = 'md' }: AccountTypeBadgeProps) {
  const config = {
    admin: {
      label: isSuperAdmin ? 'Super Admin' : 'Admin',
      icon: 'shield-checkmark' as const,
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/50',
      text: 'text-purple-400',
    },
    professional: {
      label: 'Professional',
      icon: 'briefcase' as const,
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
    },
    managed_student: {
      label: 'Managed Student',
      icon: 'school' as const,
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
    },
    autonomous_student: {
      label: 'Autonomous Student',
      icon: 'person' as const,
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
    },
  };

  const { label, icon, bg, border, text } = config[accountType];
  
  const sizeClasses = {
    sm: { container: 'px-2 py-1', text: 'text-xs', icon: 12 },
    md: { container: 'px-3 py-1.5', text: 'text-sm', icon: 14 },
    lg: { container: 'px-4 py-2', text: 'text-base', icon: 16 },
  };

  const { container, text: textSize, icon: iconSize } = sizeClasses[size];

  return (
    <View className={`flex-row items-center ${container} ${bg} ${border} border rounded-full`}>
      <Ionicons name={icon} size={iconSize} color={text.includes('purple') ? '#C084FC' : 
                                                      text.includes('orange') ? '#FB923C' :
                                                      text.includes('blue') ? '#60A5FA' : '#4ADE80'} />
      <Text className={`${text} ${textSize} font-semibold ml-1`}>{label}</Text>
    </View>
  );
}
