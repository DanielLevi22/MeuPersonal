import { useAuthStore } from '@/auth';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';

export default function WorkoutDetailsScreen() {
  const { id, workoutId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { workouts, fetchWorkoutsForPhase, isLoading, selectedExercises, addWorkoutItems, clearSelectedExercises, fetchWorkoutById } = useWorkoutStore();
  const [workout, setWorkout] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  // Use workoutId if available (nested route), otherwise id (direct route)
  const targetId = (workoutId || id) as string;

  // Find workout from store or fetch it
  useEffect(() => {
    if (!targetId) return;

    const found = workouts.find(w => w.id === targetId);
    if (found) {
      setWorkout(found);
    } else {
      // If not found in current list, fetch it specifically
      fetchWorkoutById(targetId).then(data => {
        if (data) {
          setWorkout(data);
        } else {
          setNotFound(true);
        }
      });
    }
  }, [workouts, targetId]);

  // Handle returning from SelectExercisesScreen
  // Removed useFocusEffect for adding exercises - moved to SelectExercisesScreen

  if (notFound) {
    return (
      <ScreenLayout className="justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#71717A" />
        <Text className="text-white text-xl font-bold mt-4 text-center font-display">
          Treino não encontrado
        </Text>
        <Text className="text-zinc-500 text-center mt-2 mb-6">
          O treino que você está procurando não existe ou foi removido.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-zinc-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </ScreenLayout>
    );
  }

  if (!workout && isLoading) {
    return (
      <ScreenLayout className="justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </ScreenLayout>
    );
  }

  if (!workout) return null; // Should be handled by notFound, but just in case

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
                onPress={() => router.push({
                  pathname: '/(tabs)/workouts/select-exercises',
                  params: { workoutId: workout.id, studentId: id }
                })}
                className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
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
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold font-display tracking-wide">
              EXERCÍCIOS
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/(tabs)/workouts/select-exercises',
              params: { workoutId: workout.id, studentId: id }
            })}>
              <Text className="text-orange-500 font-bold text-sm">Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={workout.items || []}
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => item.id || `exercise-${index}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-zinc-500 font-sans mb-4">Nenhum exercício cadastrado.</Text>
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/(tabs)/workouts/select-exercises',
                    params: { workoutId: workout.id, studentId: id }
                  })}
                  className="bg-zinc-800 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Adicionar Exercícios</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>


      </View>
    </ScreenLayout>
  );
}
