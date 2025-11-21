import { ExerciseConfigModal } from '@/components/ExerciseConfigModal';
import { supabase } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SelectedExercise } from '@/store/workoutStore';

export default function SelectExercisesScreen() {
  const { exercises, isLoading, fetchExercises, createExercise } = useWorkoutStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [weight, setWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('60');
  const [videoUrl, setVideoUrl] = useState('');

  // New Exercise creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [newExerciseVideo, setNewExerciseVideo] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchExercises();
  }, []);

  const openConfigForNew = (exercise: any) => {
    setCurrentExercise(exercise);
    setSets('3');
    setReps('12');
    setWeight('');
    setRestSeconds('60');
    setVideoUrl(exercise.video_url || '');
    setEditingIndex(null);
    setShowConfigModal(true);
  };

  const editSelectedExercise = (exercise: any) => {
    const index = selectedExercises.findIndex((ex) => ex.id === exercise.id);
    if (index !== -1) {
      setCurrentExercise(exercise);
      setEditingIndex(index);
      setSets(String(selectedExercises[index].sets));
      setReps(String(selectedExercises[index].reps));
      setWeight(selectedExercises[index].weight);
      setRestSeconds(String(selectedExercises[index].rest_seconds));
      // Use the original exercise's video URL for preview
      setVideoUrl(exercise.video_url || '');
      setShowConfigModal(true);
    }
  };

  const toggleSelection = (exercise: any) => {
    if (selected.includes(exercise.id)) {
      editSelectedExercise(exercise);
    } else {
      openConfigForNew(exercise);
    }
  };

  const handleSaveExercise = () => {
    if (!currentExercise) return;
    const setsNum = parseInt(sets) || 3;
    const repsNum = parseInt(reps) || 12;
    const restNum = parseInt(restSeconds) || 60;
    if (setsNum < 1 || repsNum < 1 || restNum < 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos.');
      return;
    }
    const newExercise: SelectedExercise = {
      id: currentExercise.id,
      name: currentExercise.name,
      muscle_group: currentExercise.muscle_group,
      sets: setsNum,
      reps: repsNum,
      weight: weight,
      rest_seconds: restNum,
      video_url: videoUrl.trim() || undefined,
    };
    // Update video URL if changed
    if (videoUrl.trim() !== (currentExercise.video_url || '')) {
      supabase
        .from('exercises')
        .update({ video_url: videoUrl.trim() || null })
        .eq('id', currentExercise.id)
        .then(({ error }) => {
          if (!error) fetchExercises();
        });
    }
    if (editingIndex !== null) {
      const updated = [...selectedExercises];
      updated[editingIndex] = newExercise;
      setSelectedExercises(updated);
    } else {
      setSelected([...selected, currentExercise.id]);
      setSelectedExercises([...selectedExercises, newExercise]);
    }
    setShowConfigModal(false);
    setCurrentExercise(null);
    setEditingIndex(null);
  };

  const handleConfirm = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um exercício.');
      return;
    }
    const { setSelectedExercises } = useWorkoutStore.getState();
    setSelectedExercises(selectedExercises);
    router.back();
  };

  const renderItem = ({ item }: { item: any }) => {
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0, 217, 255, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '600' }}>{item.muscle_group}</Text>
            </View>
          </View>
        </View>
        {isSelected && (
          <TouchableOpacity onPress={() => editSelectedExercise(item)}>
            <Ionicons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#141B2D', padding: 10, borderRadius: 12, marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>Selecionar Exercícios</Text>
            <Text style={{ fontSize: 14, color: '#8B92A8', marginTop: 2 }}>{selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={{ marginLeft: 'auto', backgroundColor: 'rgba(255, 107, 53, 0.15)', padding: 10, borderRadius: 12 }}>
            <Ionicons name="add" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ color: '#8B92A8', marginTop: 16, fontSize: 15 }}>Carregando exercícios...</Text>
          </View>
        ) : (
          <FlatList data={exercises} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} />
        )}
        {/* Bottom Button */}
        {selected.length > 0 && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 32, backgroundColor: '#0A0E1A', borderTopWidth: 2, borderTopColor: '#1E2A42' }}>
            <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
              <LinearGradient colors={['#00FF88', '#00CC6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <Ionicons name="checkmark-circle" size={22} color="#0A0E1A" style={{ marginRight: 8 }} />
                <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>Adicionar {selected.length} {selected.length === 1 ? 'Exercício' : 'Exercícios'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* New Exercise Creation Modal */}
        {showCreateModal && (
          <>
            <TouchableOpacity 
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)' }}
              activeOpacity={1}
              onPress={() => {
                setShowCreateModal(false);
                setNewExerciseName('');
                setNewExerciseMuscle('');
                setNewExerciseVideo('');
              }}
            />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141B2D', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 2, borderTopColor: '#1E2A42', maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Criar Novo Exercício</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                setNewExerciseName('');
                setNewExerciseMuscle('');
                setNewExerciseVideo('');
              }}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Nome do Exercício</Text>
              <TextInput value={newExerciseName} onChangeText={setNewExerciseName} placeholder="Ex: Supino Reto" placeholderTextColor="#5A6178" style={{ backgroundColor: '#0A0E1A', borderWidth: 2, borderColor: '#1E2A42', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16 }} />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Grupo Muscular</Text>
              <TextInput value={newExerciseMuscle} onChangeText={setNewExerciseMuscle} placeholder="Ex: Peitoral" placeholderTextColor="#5A6178" style={{ backgroundColor: '#0A0E1A', borderWidth: 2, borderColor: '#1E2A42', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16 }} />
            </View>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Link do Vídeo (YouTube)</Text>
              <TextInput value={newExerciseVideo} onChangeText={setNewExerciseVideo} placeholder="https://youtube.com/..." placeholderTextColor="#5A6178" autoCapitalize="none" style={{ backgroundColor: '#0A0E1A', borderWidth: 2, borderColor: '#1E2A42', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16 }} />
            </View>
            <TouchableOpacity onPress={async () => {
              if (!newExerciseName.trim() || !newExerciseMuscle.trim()) {
                Alert.alert('Erro', 'Preencha o nome e o grupo muscular.');
                return;
              }
              setIsCreating(true);
              try {
                await createExercise({ name: newExerciseName, muscle_group: newExerciseMuscle, video_url: newExerciseVideo.trim() || undefined });
                setNewExerciseName('');
                setNewExerciseMuscle('');
                setNewExerciseVideo('');
                setShowCreateModal(false);
                Alert.alert('Sucesso', 'Exercício criado com sucesso!');
              } catch (error) {
                Alert.alert('Erro', 'Não foi possível criar o exercício.');
              } finally {
                setIsCreating(false);
              }
            }} disabled={isCreating} activeOpacity={0.8} style={{ backgroundColor: '#FF6B35', padding: 12, borderRadius: 8, alignItems: 'center' }}>
              {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Salvar Exercício</Text>}
            </TouchableOpacity>
            </View>
          </>
        )}
        {/* Exercise Config Modal */}
        <ExerciseConfigModal
          visible={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setEditingIndex(null);
            setCurrentExercise(null);
          }}
          exercise={currentExercise || { id: '', name: '', muscle_group: '' }}
          initialData={editingIndex !== null ? selectedExercises[editingIndex] : undefined}
          onSave={handleSaveExercise}
        />
      </SafeAreaView>
    </View>
  );
}
