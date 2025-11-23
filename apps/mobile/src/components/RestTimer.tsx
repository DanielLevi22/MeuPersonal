import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

interface RestTimerProps {
  restSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function RestTimer({ restSeconds, onComplete, autoStart = false }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(restSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load alarm sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        // TODO: Add alarm.mp3 file to assets folder
        // const { sound } = await Audio.Sound.createAsync(
        //   require('../assets/alarm.mp3'),
        //   { shouldPlay: false }
        // );
        // soundRef.current = sound;
      } catch (error) {
        console.log('Error loading sound:', error);
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Play sound
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }

    // Vibrate
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error with haptics:', error);
    }

    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(restSeconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeRemaining / restSeconds;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      {/* Circular Progress */}
      <View style={{ position: 'relative', marginBottom: 24 }}>
        <Svg width={200} height={200}>
          {/* Background circle */}
          <Circle
            cx={100}
            cy={100}
            r={90}
            stroke="#1E2A42"
            strokeWidth={12}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={100}
            cy={100}
            r={90}
            stroke={timeRemaining === 0 ? '#00FF88' : '#FF6B35'}
            strokeWidth={12}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 100 100)`}
          />
        </Svg>
        
        {/* Time display */}
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Text style={{ 
            fontSize: 48, 
            fontWeight: '800', 
            color: timeRemaining === 0 ? '#00FF88' : '#FFFFFF' 
          }}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={{ fontSize: 14, color: '#8B92A8', marginTop: 4 }}>
            {timeRemaining === 0 ? 'Concluído!' : 'Descanso'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity
          onPress={handleStartPause}
          style={{
            backgroundColor: isRunning ? '#FF6B35' : '#00FF88',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Ionicons 
            name={isRunning ? 'pause' : 'play'} 
            size={20} 
            color="#0A0E1A" 
          />
          <Text style={{ color: '#0A0E1A', fontSize: 16, fontWeight: '700' }}>
            {isRunning ? 'Pausar' : 'Iniciar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReset}
          style={{
            backgroundColor: '#141B2D',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#1E2A42'
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
