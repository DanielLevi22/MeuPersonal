import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface FireAnimationProps {
  size?: number;
  active?: boolean;
  frozen?: boolean;
}

export function FireAnimation({ size = 24, active = false, frozen = false }: FireAnimationProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active && !frozen) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
  }, [active, frozen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const color = frozen ? '#3B82F6' : (active ? '#F97316' : '#71717A'); // Blue for frozen, Orange for active, Gray for inactive
  const iconName = frozen ? 'snow' : 'flame';

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={animatedStyle}>
        <Ionicons name={iconName} size={size} color={color} />
      </Animated.View>
      {active && !frozen && (
        <Animated.View 
          style={[
            { 
              position: 'absolute', 
              width: size, 
              height: size, 
              borderRadius: size / 2, 
              backgroundColor: color, 
              zIndex: -1 
            }, 
            useAnimatedStyle(() => ({
              opacity: opacity.value * 0.3,
              transform: [{ scale: scale.value * 1.2 }]
            }))
          ]} 
        />
      )}
    </View>
  );
}
