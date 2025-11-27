import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function ExecuteWorkoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();
  
  const [workout, setWorkout] = useState<any>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (user?.id && !workouts.length) {
      fetchWorkouts(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (workouts.length > 0 && id) {
      const found = workouts.find(w => w.id === id);
      setWorkout(found);
    }
  }, [workouts, id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isResting) {
      setIsResting(false);
      setIsActive(false);
      Alert.alert('Tempo esgotado!', 'Hora da próxima série!');
    }
    return () => clearInterval(interval);
  }, [isActive, timer, isResting]);

  if (isLoading || !workout) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  const currentExercise = workout.items?.[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === (workout.items?.length || 0) - 1;
  const isLastSet = currentSet === currentExercise?.sets;

  const handleNextSet = () => {
    if (isLastSet) {
      if (isLastExercise) {
        Alert.alert(
          'Parabéns!',
          'Treino concluído com sucesso!',
          [
            {
              text: 'Finalizar',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        setCurrentExerciseIndex((prev) => prev + 1);
        setCurrentSet(1);
      }
    } else {
      setCurrentSet((prev) => prev + 1);
      startRest();
    }
  };

  const startRest = () => {
    setTimer(currentExercise.rest_time || 60);
    setIsResting(true);
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScreenLayout>
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-zinc-400 text-sm font-sans uppercase tracking-wider">
              Exercício {currentExerciseIndex + 1}/{workout.items?.length}
            </Text>
            <Text className="text-white text-lg font-bold font-display">
              {workout.title}
            </Text>
          </View>
          <View className="w-12" />
        </View>

        {/* Exercise Card */}
        <View className="flex-1 justify-center items-center">
          <View className="w-full bg-zinc-900 rounded-[32px] p-8 border border-zinc-800 items-center shadow-2xl shadow-black/50">
            <View className="w-24 h-24 rounded-full bg-orange-500/10 items-center justify-center mb-6 border-2 border-orange-500/20">
              <Ionicons name="barbell" size={48} color="#FF6B35" />
            </View>

            <Text className="text-3xl font-extrabold text-white text-center mb-2 font-display">
              {currentExercise?.exercise?.name}
            </Text>
            <Text className="text-zinc-400 text-lg font-sans mb-8">
              {currentExercise?.exercise?.muscle_group}
            </Text>

            {/* Stats Grid */}
            <View className="flex-row gap-4 w-full mb-8">
              <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase">Série</Text>
                <Text className="text-white text-2xl font-bold">
                  {currentSet}<Text className="text-zinc-500 text-base">/{currentExercise?.sets}</Text>
                </Text>
              </View>
              <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase">Reps</Text>
                <Text className="text-white text-2xl font-bold">{currentExercise?.reps}</Text>
              </View>
              <View className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-zinc-500 text-xs font-bold mb-1 uppercase">Carga</Text>
                <Text className="text-white text-2xl font-bold">{currentExercise?.weight || '-'}kg</Text>
              </View>
            </View>

            {/* Timer */}
            {isResting ? (
              <View className="items-center mb-8">
                <Text className="text-zinc-400 text-sm font-bold uppercase mb-2">Descanso</Text>
                <Text className="text-5xl font-mono font-bold text-cyan-400">
                  {formatTime(timer)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={handleNextSet}
                activeOpacity={0.8}
                className="w-full"
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF2E63']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl py-5 items-center justify-center shadow-lg shadow-orange-500/40"
                >
                  <Text className="text-white text-xl font-bold font-display">
                    {isLastSet && isLastExercise ? 'Finalizar Treino' : 'Próxima Série'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isResting && (
              <TouchableOpacity 
                onPress={() => {
                  setIsResting(false);
                  setIsActive(false);
                  setTimer(0);
                }}
                className="bg-zinc-800 py-3 px-6 rounded-xl"
              >
                <Text className="text-white font-bold">Pular Descanso</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
