import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps extends TouchableOpacityProps {
  icon: IconName;
  variant?: 'default' | 'danger' | 'ghost' | 'solid' | 'outline';
  size?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ 
  icon, 
  variant = 'default', 
  size = 24, 
  iconColor, 
  style, 
  ...props 
}: IconButtonProps) {
  
  const getBaseStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.default, // Standard border for shape
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'solid':
        return {
          backgroundColor: colors.primary.start,
          borderColor: colors.primary.start,
        };
      default: // 'default' | 'outline'
        return {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.default,
        };
    }
  };

  const getIconDefaultColor = () => {
    if (iconColor) return iconColor;
    
    switch (variant) {
      case 'danger':
        return colors.status.error;
      case 'solid':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const baseStyles = getBaseStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="w-12 h-12 items-center justify-center border"
      style={[
        {
          backgroundColor: baseStyles.backgroundColor,
          borderColor: baseStyles.borderColor,
          borderRadius: 20, // Enforce Squircle globally
        },
        style
      ]}
      {...props}
    >
      <Ionicons name={icon} size={size} color={getIconDefaultColor()} />
    </TouchableOpacity>
  );
}
