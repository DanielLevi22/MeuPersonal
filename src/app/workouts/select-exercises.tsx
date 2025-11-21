import { useWorkoutStore } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SelectedExercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

export default function SelectExercisesScreen() {
  const { exercises, isLoading, fetchExercises } = useWorkoutStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [restSeconds, setRestSeconds] = useState('60');
  const router = useRouter();

  useEffect(() => {
    fetchExercises();
  }, []);

  const toggleSelection = (exercise: any) => {
    if (selected.includes(exercise.id)) {
      // Remove from selection
      setSelected(selected.filter(id => id !== exercise.id));
      setSelectedExercises(selectedExercises.filter(ex => ex.id !== exercise.id));
    } else {
      // Show config modal
      setCurrentExercise(exercise);
      setSets('3');
      setReps('12');
      setRestSeconds('60');
      setShowConfigModal(true);
    }
  };

  const handleAddExercise = () => {
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
      rest_seconds: restNum,
    };

    setSelected([...selected, currentExercise.id]);
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowConfigModal(false);
    setCurrentExercise(null);
  };

  const handleConfirm = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um exercício.');
      return;
    }

    // Save to global store
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
          justifyContent: 'space-between'
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: 'rgba(0, 217, 255, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8
            }}>
              <Text style={{ color: '#00D9FF', fontSize: 12, fontWeight: '600' }}>
                {item.muscle_group}
              </Text>
            </View>
          </View>
        </View>
        
        {isSelected && (
          <View style={{
            backgroundColor: '#FF6B35',
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 12
          }}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24
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
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>
              Selecionar Exercícios
            </Text>
            <Text style={{ fontSize: 14, color: '#8B92A8', marginTop: 2 }}>
              {selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}
            </Text>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ color: '#8B92A8', marginTop: 16, fontSize: 15 }}>
              Carregando exercícios...
            </Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ 
              paddingHorizontal: 24,
              paddingBottom: 100 
            }}
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
            paddingBottom: 32,
            backgroundColor: '#0A0E1A',
            borderTopWidth: 2,
            borderTopColor: '#1E2A42'
          }}>
            <TouchableOpacity 
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
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
                <Text style={{ 
                  color: '#0A0E1A', 
                  fontSize: 18, 
                  fontWeight: '700'
                }}>
                  Adicionar {selected.length} {selected.length === 1 ? 'Exercício' : 'Exercícios'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Config Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          justifyContent: 'flex-end' 
        }}>
          <View style={{
            backgroundColor: '#141B2D',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
                Configurar Exercício
              </Text>
              <TouchableOpacity onPress={() => setShowConfigModal(false)}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>

            {/* Exercise Name */}
            {currentExercise && (
              <View style={{
                backgroundColor: '#0A0E1A',
                padding: 16,
                borderRadius: 16,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: '#1E2A42'
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                  {currentExercise.name}
                </Text>
                <Text style={{ color: '#00D9FF', fontSize: 14 }}>
                  {currentExercise.muscle_group}
                </Text>
              </View>
            )}

            {/* Inputs */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>
                  Séries
                </Text>
                <TextInput
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: '#0A0E1A',
                    borderWidth: 2,
                    borderColor: '#1E2A42',
                    borderRadius: 12,
                    padding: 14,
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>
                  Repetições
                </Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: '#0A0E1A',
                    borderWidth: 2,
                    borderColor: '#1E2A42',
                    borderRadius: 12,
                    padding: 14,
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>
                  Descanso (s)
                </Text>
                <TextInput
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: '#0A0E1A',
                    borderWidth: 2,
                    borderColor: '#1E2A42',
                    borderRadius: 12,
                    padding: 14,
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                />
              </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity 
              onPress={handleAddExercise}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B35', '#E85A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Adicionar Exercício
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
