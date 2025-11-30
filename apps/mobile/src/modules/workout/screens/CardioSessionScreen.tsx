import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { useGamificationStore } from '@/store/gamificationStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

// METs aproximados
const METS: Record<string, number> = {
  'Caminhada': 3.5,
  'Corrida': 8.0,
  'Bicicleta': 6.0,
  'Elíptico': 5.0,
  'Natação': 7.0,
  'Cardio': 5.0, // Default
};

export default function CardioSessionScreen() {
  const { id, exerciseId, exerciseName, muscleGroup } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateWorkoutProgress } = useGamificationStore();
  const { saveCardioSession } = useWorkoutStore();

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [calories, setCalories] = useState(0);
  const [intensity, setIntensity] = useState<'Baixa' | 'Moderada' | 'Alta'>('Moderada');
  const [startTime, setStartTime] = useState<Date | null>(null);

  // User weight fallback (70kg if not found)
  // In a real app, we should fetch this from the profile/assessment
  const userWeight = 70; 

  const met = METS[exerciseName as string] || METS['Cardio'] || 5.0;

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Calculate calories: MET * Weight(kg) * Time(hours)
          // Time in hours = 1 / 3600
          // Calories per second = (MET * Weight) / 3600
          const calsPerSec = (met * userWeight) / 3600;
          setCalories((prevCals) => prevCals + calsPerSec);

          // Voice Feedback every 5 minutes (300 seconds)
          if (newSeconds % 300 === 0) {
            const mins = newSeconds / 60;
            const cals = Math.round(calories + calsPerSec); // Current estimate
            Speech.speak(`Você já treinou ${mins} minutos e gastou ${cals} calorias. Continue assim!`, {
              language: 'pt-BR',
            });
          }

          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, met, userWeight, calories]);

  const handleStart = () => {
    setIsActive(true);
    if (!startTime) setStartTime(new Date());
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleFinish = async () => {
    setIsActive(false);
    
    if (!user?.id || !startTime) return;

    const endTime = new Date();

    try {
      // Save session
      await saveCardioSession({
        studentId: user.id,
        exerciseName: (exerciseName as string) || 'Cardio Livre',
        durationSeconds: seconds,
        calories: calories,
        startedAt: startTime.toISOString(),
        completedAt: endTime.toISOString()
      });

      // Update gamification
      await updateWorkoutProgress(1);

      Alert.alert(
        'Treino Salvo!',
        `Tempo: ${formatTime(seconds)}\nCalorias: ${Math.round(calories)} kcal`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro ao salvar treino.');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScreenLayout>
      <View className="flex-1 p-6 justify-between">
        {/* Header */}
        <View className="items-center mt-4">
          <Text className="text-zinc-400 text-lg font-sans uppercase tracking-widest">
            Sessão de Cardio
          </Text>
          <Text className="text-white text-3xl font-bold font-display mt-2 text-center">
            {exerciseName || 'Exercício Livre'}
          </Text>
          <View className="bg-zinc-800 px-3 py-1 rounded-full mt-3">
            <Text className="text-zinc-400 text-xs font-bold">
              Intensidade: <Text className="text-orange-500">{intensity}</Text>
            </Text>
          </View>
        </View>

        {/* Main Stats */}
        <View className="items-center justify-center">
          {/* Timer Circle */}
          <View className="w-64 h-64 rounded-full border-8 border-zinc-800 items-center justify-center mb-8 relative">
            <View className="absolute w-full h-full rounded-full border-8 border-orange-500 opacity-20" />
            <Text className="text-6xl font-mono font-bold text-white tracking-tighter">
              {formatTime(seconds)}
            </Text>
            <Text className="text-zinc-500 text-sm font-bold uppercase mt-2">
              Duração
            </Text>
          </View>

          {/* Calories */}
          <View className="flex-row items-end">
            <Text className="text-5xl font-bold text-white font-display">
              {Math.round(calories)}
            </Text>
            <Text className="text-zinc-500 text-lg font-bold mb-2 ml-2">
              kcal
            </Text>
          </View>
          <Text className="text-zinc-600 text-xs mt-1">
            Estimado (~{met} METs)
          </Text>
        </View>

        {/* Controls */}
        <View className="mb-8">
          {!isActive && seconds === 0 ? (
            <TouchableOpacity 
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF2E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl py-5 items-center justify-center shadow-lg shadow-orange-500/40"
              >
                <Ionicons name="play" size={32} color="white" />
                <Text className="text-white text-lg font-bold font-display mt-1">
                  INICIAR
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-4">
              {isActive ? (
                <TouchableOpacity 
                  onPress={handlePause}
                  className="flex-1 bg-zinc-800 py-5 rounded-2xl items-center justify-center border border-zinc-700"
                >
                  <Ionicons name="pause" size={28} color="white" />
                  <Text className="text-white font-bold mt-1">PAUSAR</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={handleStart}
                  className="flex-1 bg-emerald-600 py-5 rounded-2xl items-center justify-center"
                >
                  <Ionicons name="play" size={28} color="white" />
                  <Text className="text-white font-bold mt-1">RETOMAR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleFinish}
                className="flex-1 bg-zinc-900 py-5 rounded-2xl items-center justify-center border border-zinc-800"
              >
                <Ionicons name="stop" size={28} color="#EF4444" />
                <Text className="text-red-500 font-bold mt-1">FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScreenLayout>
  );
}
