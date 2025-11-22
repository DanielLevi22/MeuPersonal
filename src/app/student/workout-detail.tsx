import { supabase } from '@/lib/supabase';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentWorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  
  const { createLog, isWorkoutCompletedToday, fetchLogs } = useWorkoutLogStore();

  useEffect(() => {
    const init = async () => {
      if (id) {
        await fetchWorkoutDetails();
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) {
          await fetchLogs(data.user.id);
        }
      }
    };
    init();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('workout_items')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', id)
        .order('order_index');

      if (itemsError) throw itemsError;
      setExercises(itemsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    const result = await createLog(id as string, feedback);
    setSubmitting(false);

    if (result.success) {
      setShowFeedbackModal(false);
      setFeedback('');
      Alert.alert(
        'Parabéns! 🎉',
        'Treino concluído com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível registrar o check-in.');
    }
  };

  const isCompleted = isWorkoutCompletedToday(id as string);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, marginBottom: 16 }}>Treino não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#00D9FF' }}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', flex: 1 }} numberOfLines={1}>
              {workout.title}
            </Text>
          </View>

          {workout.description && (
            <View style={{ backgroundColor: '#141B2D', padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ color: '#8B92A8', fontSize: 14 }}>{workout.description}</Text>
            </View>
          )}

          {isCompleted && (
            <View style={{ 
              backgroundColor: 'rgba(0, 255, 136, 0.1)', 
              padding: 12, 
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="checkmark-circle" size={20} color="#00FF88" style={{ marginRight: 8 }} />
              <Text style={{ color: '#00FF88', fontSize: 14, fontWeight: '600' }}>
                Treino concluído hoje!
              </Text>
            </View>
          )}
        </View>

        {/* Exercises List */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 }}>
            Exercícios ({exercises.length})
          </Text>
          
          {exercises.length === 0 ? (
            <View style={{ 
              backgroundColor: '#141B2D', 
              padding: 32, 
              borderRadius: 16, 
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#1E2A42',
              borderStyle: 'dashed'
            }}>
              <Ionicons name="barbell-outline" size={48} color="#5A6178" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#8B92A8', textAlign: 'center' }}>Nenhum exercício neste treino.</Text>
            </View>
          ) : (
            exercises.map((item, index) => (
              <View key={item.id} style={{ 
                backgroundColor: '#141B2D', 
                padding: 16, 
                borderRadius: 16, 
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#1E2A42'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ 
                    backgroundColor: 'rgba(0, 217, 255, 0.15)', 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ color: '#00D9FF', fontWeight: '700', fontSize: 14 }}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                      {item.exercise?.name || 'Exercício'}
                    </Text>
                    {item.exercise?.muscle_group && (
                      <Text style={{ color: '#8B92A8', fontSize: 12 }}>{item.exercise.muscle_group}</Text>
                    )}
                  </View>
                </View>
                
                <View style={{ marginLeft: 44 }}>
                  {item.sets && (
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ color: '#8B92A8', fontSize: 13, width: 80 }}>Séries:</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{item.sets}</Text>
                    </View>
                  )}
                  {item.reps && (
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ color: '#8B92A8', fontSize: 13, width: 80 }}>Repetições:</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{item.reps}</Text>
                    </View>
                  )}
                  {item.weight && (
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ color: '#8B92A8', fontSize: 13, width: 80 }}>Carga:</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{item.weight} kg</Text>
                    </View>
                  )}
                  {item.rest_seconds && (
                    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                      <Text style={{ color: '#8B92A8', fontSize: 13, width: 80 }}>Descanso:</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{item.rest_seconds}s</Text>
                    </View>
                  )}
                  {item.notes && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: '#0A0E1A', borderRadius: 8 }}>
                      <Text style={{ color: '#8B92A8', fontSize: 12, fontStyle: 'italic' }}>{item.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Check-in Button */}
        {!isCompleted && exercises.length > 0 && (
          <View style={{ padding: 24, borderTopWidth: 1, borderTopColor: '#1E2A42' }}>
            <TouchableOpacity 
              onPress={() => setShowFeedbackModal(true)}
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
                <Ionicons name="checkmark-circle" size={24} color="#0A0E1A" style={{ marginRight: 8 }} />
                <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                  Concluir Treino
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            justifyContent: 'flex-end' 
          }}>
            <View style={{ 
              backgroundColor: '#0A0E1A', 
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24,
              padding: 24
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                  Como foi o treino?
                </Text>
                <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                  <Ionicons name="close" size={28} color="#8B92A8" />
                </TouchableOpacity>
              </View>

              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Deixe suas observações (opcional)"
                placeholderTextColor="#5A6178"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#141B2D',
                  borderRadius: 12,
                  padding: 16,
                  color: '#FFFFFF',
                  fontSize: 16,
                  height: 120,
                  textAlignVertical: 'top',
                  marginBottom: 24
                }}
              />

              <TouchableOpacity 
                onPress={handleCheckIn}
                disabled={submitting}
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
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: '#0A0E1A', fontSize: 18, fontWeight: '700' }}>
                    {submitting ? 'Salvando...' : 'Confirmar Check-in'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
