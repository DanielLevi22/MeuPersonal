import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentWorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchWorkoutDetails();
    }
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      // Fetch workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      // Fetch workout items with exercises
      const { data: itemsData, error: itemsError } = await supabase
        .from('workout_items')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', id)
        .order('order');

      if (itemsError) throw itemsError;
      setExercises(itemsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    router.push(`/student/execute-workout?id=${id}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-white">Treino não encontrado.</Text>
        <Button label="Voltar" onPress={() => router.back()} className="mt-4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-6 pb-0">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white flex-1" numberOfLines={1}>
            {workout.title}
          </Text>
        </View>

        {workout.description && (
          <View className="bg-surface p-4 rounded-xl mb-4 border border-border">
            <Text className="text-muted">{workout.description}</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6">
        <Text className="text-xl font-bold text-white mb-4">Exercícios</Text>
        
        {exercises.length === 0 ? (
          <View className="bg-surface p-8 rounded-xl items-center border border-border border-dashed">
            <Text className="text-muted">Nenhum exercício neste treino.</Text>
          </View>
        ) : (
          exercises.map((item, index) => (
            <View key={item.id} className="bg-surface p-4 rounded-xl mb-3 border border-border">
              <View className="flex-row items-start mb-2">
                <View className="bg-primary/20 h-8 w-8 rounded-full items-center justify-center mr-3">
                  <Text className="text-primary font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">{item.exercise?.name}</Text>
                  {item.exercise?.muscle_group && (
                    <Text className="text-muted text-sm">{item.exercise.muscle_group}</Text>
                  )}
                </View>
              </View>
              
              <View className="ml-11 space-y-1">
                {item.sets && (
                  <View className="flex-row">
                    <Text className="text-muted text-sm w-20">Séries:</Text>
                    <Text className="text-white text-sm font-bold">{item.sets}</Text>
                  </View>
                )}
                {item.reps && (
                  <View className="flex-row">
                    <Text className="text-muted text-sm w-20">Reps:</Text>
                    <Text className="text-white text-sm font-bold">{item.reps}</Text>
                  </View>
                )}
                {item.weight && (
                  <View className="flex-row">
                    <Text className="text-muted text-sm w-20">Carga:</Text>
                    <Text className="text-white text-sm font-bold">{item.weight} kg</Text>
                  </View>
                )}
                {item.rest_time && (
                  <View className="flex-row">
                    <Text className="text-muted text-sm w-20">Descanso:</Text>
                    <Text className="text-white text-sm font-bold">{item.rest_time}s</Text>
                  </View>
                )}
                {item.notes && (
                  <View className="mt-2">
                    <Text className="text-muted text-xs italic">{item.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="p-6 border-t border-border">
        <Button 
          label="Iniciar Treino" 
          onPress={handleStartWorkout}
          disabled={exercises.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
