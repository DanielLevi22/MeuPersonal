import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import {
  ImageBackground,
  type ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

interface PremiumCardProps {
  onPress?: () => void;
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  children?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badge?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function PremiumCard({
  onPress,
  title,
  subtitle,
  image,
  children,
  icon,
  iconColor = '#FFFFFF',
  badge,
  containerStyle,
}: PremiumCardProps) {
  const content = (
    <View
      className="rounded-3xl overflow-hidden border border-white/10 shadow-lg bg-zinc-900"
      style={containerStyle}
    >
      <ImageBackground
        source={image || { uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
        className="w-full"
        resizeMode="cover"
      >
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']} className="p-6">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              {badge && <View className="mb-2">{badge}</View>}
              <Text className="text-white text-3xl font-extrabold font-display leading-tight">
                {title}
              </Text>
              {subtitle && <Text className="text-zinc-400 font-medium mt-1">{subtitle}</Text>}
            </View>
            {icon && <Ionicons name={icon} size={28} color={iconColor} />}
          </View>

          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
