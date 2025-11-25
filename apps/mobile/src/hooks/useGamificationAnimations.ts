import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook para animação de confete ao completar meta
 */
export function useConfettiAnimation(trigger: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      // Haptic feedback forte
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animação de confete
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scale.setValue(0);
      });
    }
  }, [trigger]);

  return { opacity, scale };
}

/**
 * Hook para animação de pulsação (streak counter)
 */
export function usePulseAnimation(shouldPulse: boolean = true) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!shouldPulse) return;

    const pulse = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();

    return () => {
      scale.setValue(1);
    };
  }, [shouldPulse]);

  return scale;
}

/**
 * Hook para animação de check ao completar item
 */
export function useCheckAnimation(trigger: boolean) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      // Haptic feedback leve
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Animação de check
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0);
      opacity.setValue(0);
    }
  }, [trigger]);

  return { scale, opacity };
}

/**
 * Hook para animação de progresso de barra
 */
export function useProgressAnimation(progress: number) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width não suporta native driver
    }).start();
  }, [progress]);

  return width;
}

/**
 * Trigger haptic feedback para ações importantes
 */
export const hapticFeedback = {
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => Haptics.selectionAsync(),
};
