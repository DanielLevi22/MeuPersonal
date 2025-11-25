import { useConfettiAnimation } from '@/hooks/useGamificationAnimations';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Text, View } from 'react-native';

interface ConfettiOverlayProps {
  show: boolean;
}

export function ConfettiOverlay({ show }: ConfettiOverlayProps) {
  const { opacity, scale } = useConfettiAnimation(show);

  if (!show) return null;

  return (
    <Animated.View
      className="absolute inset-0 justify-center items-center bg-black/50 z-50"
      style={{ opacity, transform: [{ scale }] }}
      pointerEvents="none"
    >
      {/* Confetti Container */}
      <View className="absolute inset-0">
        <Animated.Text className="absolute text-4xl" style={{ top: '10%', left: '20%' }}>🎉</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '15%', right: '25%' }}>🎊</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '30%', left: '15%' }}>⭐</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '35%', right: '20%' }}>✨</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '50%', left: '25%' }}>🏆</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '55%', right: '15%' }}>💪</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '70%', left: '30%' }}>🔥</Animated.Text>
        <Animated.Text className="absolute text-4xl" style={{ top: '75%', right: '30%' }}>🎯</Animated.Text>
      </View>

      {/* Message Container */}
      <View className="items-center bg-white/95 rounded-3xl p-8 shadow-2xl">
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text className="text-2xl font-bold text-green-600 mt-4 font-display">
          Meta Alcançada!
        </Text>
      </View>
    </Animated.View>
  );
}
