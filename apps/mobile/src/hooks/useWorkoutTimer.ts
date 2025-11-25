import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseWorkoutTimerProps {
  onComplete?: () => void;
}

export function useWorkoutTimer({ onComplete }: UseWorkoutTimerProps = {}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);

  // Load sounds
  const soundRef = useRef<Audio.Sound | null>(null);

  const playSound = async (type: 'start' | 'finish' | 'tick') => {
    try {
      // In a real app, you would load different sound files here
      // For now, we'll just use haptics as a fallback if no sound file is provided
      // or implement a simple beep if possible.
      
      // Placeholder for sound implementation
      // const { sound } = await Audio.Sound.createAsync(require('./path/to/sound.mp3'));
      // await sound.playAsync();
      
      // Haptic feedback based on type
      if (type === 'start') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'finish') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Long vibration
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === 'tick') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.warn('Error playing sound/haptics:', error);
    }
  };

  const startTimer = useCallback((seconds: number) => {
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setIsActive(true);
    playSound('start');
  }, []);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => prev + seconds);
    setTotalTime((prev) => prev + seconds);
  }, []);

  const subtractTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev - seconds));
    setTotalTime((prev) => Math.max(0, prev - seconds));
  }, []);

  // Handle background state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isActive) {
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active' && isActive && backgroundTimeRef.current) {
        const elapsed = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        setTimeLeft((prev) => Math.max(0, prev - elapsed));
        backgroundTimeRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isActive]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            playSound('finish');
            if (onComplete) onComplete();
            return 0;
          }
          // Tick sound for last 3 seconds
          if (prev <= 4) {
            playSound('tick');
          }
          return prev - 1;
        });
      }, 1000 as unknown as number); // Fix for React Native timer type mismatch
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft, onComplete]);

  return {
    timeLeft,
    isActive,
    totalTime,
    startTimer,
    stopTimer,
    addTime,
    subtractTime,
    progress: totalTime > 0 ? timeLeft / totalTime : 0,
  };
}
