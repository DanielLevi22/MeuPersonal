import { Exercise, ExerciseConfigModal } from '@/workout';
import { useCreateExercise } from '@/hooks/useExerciseMutations';
import { useExercises } from '@/hooks/useExercises';
import { SelectedExercise, useWorkoutStore } from '@/workout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectExercisesScreen() {
  const { data: exercisesData = [], isLoading } = useExercises();
  const createExerciseMutation = useCreateExercise();
  const insets = useSafeAreaInsets();
  
  // Filtrar exercícios inválidos - remover "Adicionar Exercício" e outros inválidos
  const exercises = useMemo(() => {
    return exercisesData.filter(
      (ex) => ex.name && 
      ex.name.trim() !== '' &&
      !ex.name.toLowerCase().includes('adicionar exercício') &&
      !ex.name.toLowerCase().includes('adicionar exercicios')
    );
  }, [exercisesData]);

  const [selected, setSelected] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New Exercise creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [newExerciseVideo, setNewExerciseVideo] = useState('');

  const router = useRouter();

  const openConfigForNew = useCallback((exercise: Exercise) => {
    setCurrentExercise(exercise);
    setEditingIndex(null);
    setShowConfigModal(true);
  }, []);

  const editSelectedExercise = useCallback((exercise: Exercise) => {
    const index = selectedExercises.findIndex((ex) => ex.id === exercise.id);
    if (index !== -1) {
      setCurrentExercise(exercise);
      setEditingIndex(index);
      setShowConfigModal(true);
    }
  }, [selectedExercises]);

  const toggleSelection = useCallback((exercise: Exercise) => {
    if (selected.includes(exercise.id)) {
      editSelectedExercise(exercise);
    } else {
      openConfigForNew(exercise);
    }
  }, [selected, editSelectedExercise, openConfigForNew]);

  const handleSaveExercise = useCallback((updatedExercise: SelectedExercise) => {
    if (editingIndex !== null) {
      const updated = [...selectedExercises];
      updated[editingIndex] = updatedExercise;
      setSelectedExercises(updated);
    } else {
      setSelected([...selected, updatedExercise.id]);
      setSelectedExercises([...selectedExercises, updatedExercise]);
    }
    setShowConfigModal(false);
    setCurrentExercise(null);
    setEditingIndex(null);
  }, [editingIndex, selected, selectedExercises]);

  const handleConfirm = useCallback(() => {
    if (selectedExercises.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um exercício.');
      return;
    }
    const { setSelectedExercises } = useWorkoutStore.getState();
    setSelectedExercises(selectedExercises);
    router.back();
  }, [selectedExercises, router]);

  const handleCreateExercise = useCallback(async () => {
    if (!newExerciseName.trim() || !newExerciseMuscle.trim()) {
      Alert.alert('Erro', 'Preencha o nome e o grupo muscular.');
      return;
    }
    
    try {
      await createExerciseMutation.mutateAsync({
        name: newExerciseName,
        muscle_group: newExerciseMuscle,
        video_url: newExerciseVideo.trim() || undefined,
      });
      setNewExerciseName('');
      setNewExerciseMuscle('');
      setNewExerciseVideo('');
      setShowCreateModal(false);
      Alert.alert('Sucesso', 'Exercício criado com sucesso!');
    } catch (error) {
      // Error já é tratado no hook
    }
  }, [newExerciseName, newExerciseMuscle, newExerciseVideo, createExerciseMutation]);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewExerciseName('');
    setNewExerciseMuscle('');
    setNewExerciseVideo('');
  }, []);

  const handleCloseConfigModal = useCallback(() => {
    setShowConfigModal(false);
    setEditingIndex(null);
    setCurrentExercise(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Exercise }) => {
    const isSelected = selected.includes(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleSelection(item)}
        style={{
          backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.1)' : '#141B2D',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: isSelected ? '#FF6B35' : '#1E2A42',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>{item.name}</Text>
          {item.muscle_group && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ 
                backgroundColor: 'rgba(0, 217, 255, 0.15)', 
                paddingHorizontal: 10, 
                paddingVertical: 4, 
                borderRadius: 8 
              }}>
                <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '600' }}>{item.muscle_group}</Text>
              </View>
            </View>
          )}
        </View>
        {isSelected && (
          <TouchableOpacity onPress={() => editSelectedExercise(item)} style={{ marginLeft: 12 }}>
            <Ionicons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [selected, toggleSelection, editSelectedExercise]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingTop: insets.top + 16, 
        paddingBottom: 24,
        backgroundColor: '#0A0E1A'
      }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            backgroundColor: '#141B2D', 
            padding: 10, 
            borderRadius: 12, 
            marginRight: 16 
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>Selecionar Exercícios</Text>
          <Text style={{ fontSize: 14, color: '#8B92A8', marginTop: 2 }}>
            {selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowCreateModal(true)} 
          style={{ 
            backgroundColor: 'rgba(255, 107, 53, 0.15)', 
            padding: 10, 
            borderRadius: 12 
          }}
        >
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#0A0E1A' 
        }}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: '#8B92A8', marginTop: 16, fontSize: 15 }}>Carregando exercícios...</Text>
        </View>
      ) : (
        <FlatList 
          data={exercises} 
          renderItem={renderItem} 
          keyExtractor={(item) => item.id} 
          contentContainerStyle={{ 
            paddingHorizontal: 24, 
            paddingBottom: insets.bottom + 100, 
            backgroundColor: '#0A0E1A' 
          }}
          style={{ flex: 1, backgroundColor: '#0A0E1A' }}
          showsVerticalScrollIndicator={false} 
        />
      )}

      {/* Bottom Button */}
      {selected.length > 0 && (
        <View style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: 24, 
          paddingBottom: Math.max(insets.bottom, 24), 
          backgroundColor: '#0A0E1A', 
          borderTopWidth: 2, 
          borderTopColor: '#1E2A42' 
        }}>
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
            <LinearGradient 
              colors={['#00FF88', '#00CC6E']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={{ 
                borderRadius: 16, 
                paddingVertical: 18, 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexDirection: 'row' 
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#0A0E1A" style={{ marginRight: 8 }} />
              <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                Adicionar {selected.length} {selected.length === 1 ? 'Exercício' : 'Exercícios'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* New Exercise Creation Modal */}
      {showCreateModal && (
        <>
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.8)' 
            }}
            activeOpacity={1}
            onPress={handleCloseCreateModal}
          />
          <View style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: '#141B2D', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            padding: 24, 
            paddingBottom: Math.max(insets.bottom, 24), 
            borderTopWidth: 2, 
            borderTopColor: '#1E2A42', 
            maxHeight: '80%' 
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Criar Novo Exercício</Text>
              <TouchableOpacity onPress={handleCloseCreateModal}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Nome do Exercício</Text>
              <TextInput 
                value={newExerciseName} 
                onChangeText={setNewExerciseName} 
                placeholder="Ex: Supino Reto" 
                placeholderTextColor="#5A6178" 
                style={{ 
                  backgroundColor: '#0A0E1A', 
                  borderWidth: 2, 
                  borderColor: '#1E2A42', 
                  borderRadius: 12, 
                  padding: 16, 
                  color: '#FFFFFF', 
                  fontSize: 16 
                }}
              />
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Grupo Muscular</Text>
              <TextInput 
                value={newExerciseMuscle} 
                onChangeText={setNewExerciseMuscle} 
                placeholder="Ex: Peitoral" 
                placeholderTextColor="#5A6178" 
                style={{ 
                  backgroundColor: '#0A0E1A', 
                  borderWidth: 2, 
                  borderColor: '#1E2A42', 
                  borderRadius: 12, 
                  padding: 16, 
                  color: '#FFFFFF', 
                  fontSize: 16 
                }}
              />
            </View>
            
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Link do Vídeo (YouTube)</Text>
              <TextInput 
                value={newExerciseVideo} 
                onChangeText={setNewExerciseVideo} 
                placeholder="https://youtube.com/..." 
                placeholderTextColor="#5A6178" 
                autoCapitalize="none" 
                style={{ 
                  backgroundColor: '#0A0E1A', 
                  borderWidth: 2, 
                  borderColor: '#1E2A42', 
                  borderRadius: 12, 
                  padding: 16, 
                  color: '#FFFFFF', 
                  fontSize: 16 
                }}
              />
            </View>
            
            <TouchableOpacity 
              onPress={handleCreateExercise} 
              disabled={createExerciseMutation.isPending} 
              activeOpacity={0.8} 
              style={{ 
                backgroundColor: '#FF6B35', 
                padding: 12, 
                borderRadius: 8, 
                alignItems: 'center',
                opacity: createExerciseMutation.isPending ? 0.5 : 1
              }}
            >
              {createExerciseMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Salvar Exercício</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Exercise Config Modal */}
      <ExerciseConfigModal
        visible={showConfigModal}
        onClose={handleCloseConfigModal}
        exercise={currentExercise || { id: '', name: '', muscle_group: '', video_url: null }}
        initialData={editingIndex !== null ? selectedExercises[editingIndex] : undefined}
        onSave={handleSaveExercise}
      />
    </View>
  );
}
