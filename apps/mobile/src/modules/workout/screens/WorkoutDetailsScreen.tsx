import { useAuthStore } from '@/auth';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@meupersonal/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown
} from 'react-native-reanimated';
import { ExerciseConfigModal } from '../components/ExerciseConfigModal';
import { useWorkoutStore } from '../store/workoutStore';

const { width } = Dimensions.get('window');

// Asset Mapping
const MUSCLE_IMAGES: Record<string, any> = {
  'Peito': require('../../../../assets/workouts/chest.png'),
  'Costas': require('../../../../assets/workouts/back.png'),
  'Pernas': require('../../../../assets/workouts/legs.png'),
  'Braços': require('../../../../assets/workouts/arms.png'),
  'Ombros': require('../../../../assets/workouts/shoulders.png'),
  'Abdominais': require('../../../../assets/workouts/abs.png'),
  'Chest': require('../../../../assets/workouts/chest.png'),
  'Back': require('../../../../assets/workouts/back.png'),
  'Legs': require('../../../../assets/workouts/legs.png'),
  'Arms': require('../../../../assets/workouts/arms.png'),
  'Shoulders': require('../../../../assets/workouts/shoulders.png'),
  'Abs': require('../../../../assets/workouts/abs.png'),
  'Geral': require('../../../../assets/workouts/back.png'), // Fallback
};

export default function WorkoutDetailsScreen() {
  const { id, workoutId } = useLocalSearchParams();
  const router = useRouter();
  const { user, accountType } = useAuthStore();
  const { workouts, isLoading, fetchWorkoutById } = useWorkoutStore();
  const [workout, setWorkout] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const targetId = (workoutId || id) as string;

  useEffect(() => {
    if (!targetId) return;

    const found = workouts.find(w => w.id === targetId);
    if (found) {
      setWorkout(found);
    } else {
      fetchWorkoutById(targetId).then(data => {
        if (data) setWorkout(data);
        else setNotFound(true);
      });
    }
  }, [workouts, targetId]);

  // Identify unique muscle groups for the slideshow
  const muscleGroups = useMemo(() => {
    let groups: string[] = [];
    
    // 1. Add dominant muscle group if exists
    if (workout?.muscle_group) {
      groups.push(workout.muscle_group);
    }
    
    // 2. Add muscle groups from exercises
    if (workout?.items) {
      const exerciseGroups = workout.items
        .map((item: any) => item.exercise?.muscle_group)
        .filter((g: string) => g && g !== workout.muscle_group);
      groups = [...groups, ...new Set(exerciseGroups)] as string[];
    }
    
    return groups.length > 0 ? groups : ['Geral'];
  }, [workout]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (muscleGroups.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % muscleGroups.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [muscleGroups]);

  const handleEditExercise = (item: any) => {
    if (accountType !== 'professional') return;
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveExercise = async (updatedExercise: any) => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from('workout_exercises') // Note: Assuming the table is workout_exercises as per store, but [id].tsx used workout_items. Check store. 
        // Store addWorkoutItems uses 'workout_exercises' (line 602). 
        // But [id].tsx (Step 158) used 'workout_items' (line 200).
        // Let's verify schema used in [id].tsx. 
        // Lines 67-68 in [id].tsx: .from('workout_items').select(...)
        // Line 200 in [id].tsx: .from('workout_items').update(...)
        // Store line 602: .from('workout_exercises').insert(...)
        // This suggests a discrepancy or two tables?
        // Let's check the store file again in Step 187... 
        // Line 602 says 'workout_exercises'. 
        // But renderExerciseItem here uses workout.items. 
        // Let's assume 'workout_exercises' if that's what the store uses for relationships.
        // Wait, fetchWorkoutById in store (line 280) uses `items:workout_exercises(...)`.
        // So `workout_exercises` seems correct for this module. `[id].tsx` might be using a different table or legacy?
        // I will use `workout_exercises`.
        .update({
          sets: updatedExercise.sets,
          reps: updatedExercise.reps.toString(),
          weight: updatedExercise.weight,
          rest_time: updatedExercise.rest_seconds,
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      // Update video URL if changed
      if (updatedExercise.video_url !== editingItem.exercise.video_url) {
        await supabase
          .from('exercises')
          .update({ video_url: updatedExercise.video_url || null })
          .eq('id', editingItem.exercise.id);
      }
      
      // Refresh
      await fetchWorkoutById(targetId);
      setShowEditModal(false);
      setEditingItem(null);
      Alert.alert('Sucesso', 'Exercício atualizado!');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

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

  if (!workout) return null;

  const renderExerciseItem = ({ item, index }: { item: any, index: number }) => {
    const muscleGroup = item.exercise?.muscle_group || 'Geral';
    const bgImage = MUSCLE_IMAGES[muscleGroup] || MUSCLE_IMAGES['Geral'];

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(500)}
        className="mb-4"
      >
        <TouchableOpacity
            activeOpacity={accountType === 'professional' ? 0.7 : 1}
            onPress={() => handleEditExercise(item)}
        >
            <ImageBackground
            source={bgImage}
            className="rounded-2xl overflow-hidden border border-zinc-800 h-40"
            resizeMode="cover"
            >
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
                className="flex-1 p-4 justify-between"
            >
                <View className="flex-row justify-between items-start">
                <View className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                    <Text className="text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                    {muscleGroup}
                    </Text>
                </View>
                <View className="w-8 h-8 rounded-lg bg-black/40 items-center justify-center border border-white/10">
                    <Text className="text-white font-bold">{index + 1}</Text>
                </View>
                </View>

                <View>
                <Text className="text-white text-lg font-bold font-display mb-2 drop-shadow-lg">
                    {item.exercise?.name || 'Exercício'}
                </Text>
                
                <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-md border border-white/5">
                    <Ionicons name="repeat-outline" size={14} color="#FF6B35" style={{ marginRight: 4 }} />
                    <Text className="text-zinc-200 text-xs font-bold">{item.sets} x {item.reps}</Text>
                    </View>
                    
                    <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-md border border-white/5">
                    <Ionicons name="timer-outline" size={14} color="#FF6B35" style={{ marginRight: 4 }} />
                    <Text className="text-zinc-200 text-xs font-bold">{item.rest_time}s</Text>
                    </View>

                    {item.weight && (
                    <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-md border border-white/5">
                        <Ionicons name="barbell-outline" size={14} color="#FF6B35" style={{ marginRight: 4 }} />
                        <Text className="text-zinc-200 text-xs font-bold">{item.weight}kg</Text>
                    </View>
                    )}
                </View>
                </View>
            </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScreenLayout>
      <View className="flex-1">
        {/* Animated Header */}
        <Animated.View 
          entering={FadeIn.duration(800)}
          className="h-80 w-full relative"
        >
          <Animated.Image
            key={currentImageIndex}
            source={MUSCLE_IMAGES[muscleGroups[currentImageIndex]] || MUSCLE_IMAGES['Geral']}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
            className="absolute inset-0 flex-1 px-6 pb-8 justify-between"
          >
            {/* Header Controls */}
            <View className="flex-row items-center justify-between pt-8">
              <IconButton 
                icon="arrow-back" 
                onPress={() => router.back()} 
              />
              
              <View className="flex-row gap-2">
                {accountType === 'professional' && (
                  <IconButton 
                    icon="add" 
                    variant="solid"
                    onPress={() => router.push({
                      pathname: '/(tabs)/workouts/select-exercises',
                      params: { workoutId: workout.id, studentId: id }
                    })}
                  />
                )}
              </View>
            </View>

            {/* Workout Info */}
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                {muscleGroups.map((group, idx) => (
                  <View key={idx} className="bg-white/10 px-2 py-1 rounded-md border border-white/10">
                    <Text className="text-zinc-300 text-[10px] font-bold uppercase">{group}</Text>
                  </View>
                ))}
              </View>
              
              <Text className="text-3xl font-extrabold text-white mb-2 font-display">
                {workout.title}
              </Text>
              
              <Text className="text-zinc-400 font-sans text-sm line-clamp-2">
                {workout.description || 'Foco em hipertrofia e definição muscular.'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Exercises List */}
        <View className="flex-1 px-6 -mt-4 bg-black rounded-t-[32px] pt-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-xl font-bold font-display tracking-tight">
                Lista de Exercícios
              </Text>
              <Text className="text-zinc-500 text-xs font-sans">
                {workout.items?.length || 0} movimentos planejados
              </Text>
            </View>
            
            {/* Removed the explicit Edit button as per user request */}
          </View>
          
          <FlatList
            data={workout.items || []}
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => item.id || `exercise-${index}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <Ionicons name="barbell-outline" size={48} color="#3F3F46" />
                <Text className="text-zinc-500 font-sans mt-4 text-center">Nenhum exercício cadastrado ainda.</Text>
                {accountType === 'professional' && (
                  <TouchableOpacity 
                    onPress={() => router.push({
                      pathname: '/(tabs)/workouts/select-exercises',
                      params: { workoutId: workout.id, studentId: id }
                    })}
                    className="mt-6 bg-zinc-800 px-8 py-3 rounded-2xl border border-zinc-700"
                  >
                    <Text className="text-white font-bold">Adicionar</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </View>

      {/* Edit Modal */}
      {editingItem && (
        <ExerciseConfigModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          exercise={{
            id: editingItem.exercise?.id || '',
            name: editingItem.exercise?.name || '',
            muscle_group: editingItem.exercise?.muscle_group || '',
            video_url: editingItem.exercise?.video_url || null,
          }}
          initialData={{
            id: editingItem.exercise?.id || '',
            name: editingItem.exercise?.name || '',
            muscle_group: editingItem.exercise?.muscle_group || '',
            sets: editingItem.sets,
            reps: typeof editingItem.reps === 'string' ? parseInt(editingItem.reps) : editingItem.reps,
            weight: editingItem.weight || '',
            rest_seconds: editingItem.rest_time,
            video_url: editingItem.exercise?.video_url,
          }}
          onSave={handleSaveExercise}
        />
      )}
    </ScreenLayout>
  );
}
