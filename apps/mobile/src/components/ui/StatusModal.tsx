import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

export type StatusModalType = 'success' | 'error' | 'warning' | 'info';

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: StatusModalType;
  buttonText?: string;
}

export function StatusModal({ 
  visible, 
  onClose, 
  title, 
  message, 
  type = 'info',
  buttonText = 'Entendi'
}: StatusModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#34D399', // Emerald 400
          gradient: ['#059669', '#34D399'] as const,
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30'
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: '#F87171', // Red 400
          gradient: ['#DC2626', '#EF4444'] as const,
          bg: 'bg-red-500/10',
          border: 'border-red-500/30'
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#FBBF24', // Amber 400
          gradient: ['#D97706', '#F59E0B'] as const,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30'
        };
      default:
        return {
          icon: 'information-circle' as const,
          color: '#60A5FA', // Blue 400
          gradient: ['#2563EB', '#3B82F6'] as const,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30'
        };
    }
  };

  const config = getConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <Animated.View style={[containerStyle]} className="absolute inset-0">
            {/* Optional blur effect if supported or just dim overlay */}
        </Animated.View>

        <Animated.View 
          style={[contentStyle]} 
          className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black"
        >
          {/* Header Icon Area */}
          <View className={`items-center py-8 ${config.bg} border-b ${config.border}`}>
            <View className="shadow-lg shadow-black/20">
              <Ionicons name={config.icon} size={64} color={config.color} />
            </View>
          </View>

          {/* Content */}
          <View className="p-6 items-center">
            <Text className="text-white text-xl font-bold font-display text-center mb-2">
              {title}
            </Text>
            <Text className="text-zinc-400 text-center font-sans mb-8 leading-relaxed">
              {message}
            </Text>

            <TouchableOpacity 
              onPress={onClose}
              activeOpacity={0.9}
              className="w-full"
            >
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4 rounded-xl items-center justify-center shadow-lg"
              >
                <Text className="text-white font-bold text-base font-display uppercase tracking-wide">
                  {buttonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
