import { VideoPlayer } from '@/components/VideoPlayer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Exercise, SelectedExercise } from '../store/workoutStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise;
  initialData?: SelectedExercise;
  onSave: (data: SelectedExercise) => void;
}

export const ExerciseConfigModal: React.FC<Props> = ({ visible, onClose, exercise, initialData, onSave }) => {
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [weight, setWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('60');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSets(String(initialData.sets));
      setReps(String(initialData.reps));
      setWeight(initialData.weight);
      setRestSeconds(String(initialData.rest_seconds));
      setVideoUrl(initialData.video_url || '');
    } else {
      setSets('3');
      setReps('12');
      setWeight('');
      setRestSeconds('60');
      setVideoUrl('');
    }
  }, [initialData, visible]);

  const handleSave = useCallback(async () => {
    const setsNum = parseInt(sets) || 3;
    const repsNum = parseInt(reps) || 12;
    const restNum = parseInt(restSeconds) || 60;
    if (setsNum < 1 || repsNum < 1 || restNum < 0) {
      Alert.alert('Erro', 'Por favor, insira valores válidos.');
      return;
    }
    setSaving(true);
    try {
      const result: SelectedExercise = {
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group || '',
        sets: setsNum,
        reps: repsNum,
        weight: weight,
        rest_seconds: restNum,
        video_url: videoUrl.trim() || undefined,
      };
      onSave(result);
      onClose();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }, [sets, reps, restSeconds, weight, videoUrl, exercise, onSave, onClose]);

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPress={onClose}
        style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'flex-end'
        }}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{ 
            backgroundColor: '#141B2D',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
            maxHeight: '90%'
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>Configurar Exercício</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#8B92A8" />
              </TouchableOpacity>
            </View>
            
            <View style={{ backgroundColor: '#0A0E1A', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 2, borderColor: '#1E2A42' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>{exercise.name}</Text>
              <Text style={{ color: '#00D9FF', fontSize: 14 }}>{exercise.muscle_group}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Séries</Text>
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
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Repetições</Text>
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
                <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Descanso (s)</Text>
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
            
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Carga (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Ex: 20"
                placeholderTextColor="#5A6178"
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
            
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8B92A8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Link do Vídeo (YouTube)</Text>
              <TextInput
                value={videoUrl}
                onChangeText={setVideoUrl}
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
                  fontSize: 16, 
                  marginBottom: 12 
                }}
              />
              {videoUrl.trim() ? <VideoPlayer videoUrl={videoUrl.trim()} height={200} /> : null}
            </View>
            
            <TouchableOpacity 
              onPress={handleSave} 
              activeOpacity={0.8} 
              disabled={saving}
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={['#FF6B35', '#E85A2A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                    {initialData ? 'Salvar Alterações' : 'Adicionar Exercício'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
