import { cn } from '@/lib/utils';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  icon,
}: ButtonProps) {
  const baseStyles = 'rounded-xl flex-row items-center justify-center';
  
  const variantStyles = {
    primary: 'bg-primary active:bg-primary-dark shadow-lg',
    secondary: 'bg-secondary active:bg-secondary-dark shadow-lg',
    outline: 'border-2 border-primary bg-transparent active:bg-primary/10',
    ghost: 'bg-transparent active:bg-surface',
  };

  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorStyles = {
    primary: 'text-white',
    secondary: 'text-background',
    outline: 'text-primary',
    ghost: 'text-white',
  };

  const disabledStyles = disabled || isLoading ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#FF6B35' : '#FFFFFF'} />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={cn(
              'font-bold',
              textSizeStyles[size],
              textColorStyles[variant]
            )}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
