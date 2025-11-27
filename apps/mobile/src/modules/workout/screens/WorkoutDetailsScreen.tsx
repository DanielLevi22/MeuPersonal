import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();
  const [workout, setWorkout] = useState<any>(null);

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

  if (isLoading || !workout) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#00C9A7'; // Emerald
      case 'intermediate': return '#FFB800'; // Gold
      case 'advanced': return '#FF2E63'; // Red
      default: return '#00D9FF'; // Cyan
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  const renderExerciseItem = ({ item, index }: { item: any, index: number }) => (
    <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mr-3">
          <Text className="text-orange-500 font-bold">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white text-base font-bold font-display">
            {item.exercise?.name || 'Exercício'}
          </Text>
          <Text className="text-zinc-500 text-xs font-sans">
            {item.exercise?.muscle_group || 'Geral'}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 items-center">
          <Text className="text-zinc-500 text-[10px] font-bold mb-1 uppercase">Séries</Text>
          <Text className="text-white font-bold">{item.sets}</Text>
        </View>
        <View className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 items-center">
          <Text className="text-zinc-500 text-[10px] font-bold mb-1 uppercase">Reps</Text>
          <Text className="text-white font-bold">{item.reps}</Text>
        </View>
        <View className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 items-center">
          <Text className="text-zinc-500 text-[10px] font-bold mb-1 uppercase">Descanso</Text>
          <Text className="text-white font-bold">{item.rest_time}s</Text>
        </View>
        {item.weight && (
          <View className="flex-1 bg-zinc-950 p-2 rounded-xl border border-zinc-800 items-center">
            <Text className="text-zinc-500 text-[10px] font-bold mb-1 uppercase">Carga</Text>
            <Text className="text-white font-bold">{item.weight}kg</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenLayout>
      <View className="flex-1">
        {/* Header */}
        <View className="items-center pt-8 pb-8 px-6 bg-zinc-900 rounded-b-[32px] border-b border-zinc-800 mb-6">
          <View className="flex-row items-center justify-between w-full mb-6">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => Alert.alert('Em breve', 'Edição em desenvolvimento')}
                className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="w-20 h-20 rounded-full bg-orange-500/10 items-center justify-center mb-4 border-2 border-orange-500/20">
            <Ionicons name="barbell" size={40} color="#FF6B35" />
          </View>
          
          <Text className="text-2xl font-extrabold text-white mb-2 font-display text-center">
            {workout.title}
          </Text>
          
          <View 
            className="px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: `${getDifficultyColor(workout.difficulty)}20` }}
          >
            <Text 
              className="text-xs font-bold"
              style={{ color: getDifficultyColor(workout.difficulty) }}
            >
              {getDifficultyLabel(workout.difficulty)}
            </Text>
          </View>

          <Text className="text-zinc-400 font-sans text-center px-4">
            {workout.description || 'Sem descrição'}
          </Text>
        </View>

        {/* Exercises List */}
        <View className="flex-1 px-6">
          <Text className="text-white text-lg font-bold mb-4 font-display tracking-wide">
            EXERCÍCIOS
          </Text>
          
          <FlatList
            data={workout.items || []} // Assuming items are populated
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => item.id || `exercise-${index}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-zinc-500 font-sans">Nenhum exercício cadastrado.</Text>
              </View>
            }
          />
        </View>

        {/* Start Workout Button (Floating) */}
        <View className="absolute bottom-8 left-6 right-6">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/(tabs)/workouts/execute/${workout.id}` as any)}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF2E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-orange-500/40"
            >
              <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-bold font-display">
                Iniciar Treino
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}
